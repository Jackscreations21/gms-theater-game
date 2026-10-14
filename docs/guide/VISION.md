# VISION — the video blocking capture: how it works, where it stands, what is left

**Read this before touching `tools/vision/`, `video/`, or spawning the calibration agents.** Written 2026-10-14 at the
end of the day the system was built, on Jack's word: *"write a very detailed handoff for next session with what you
were going to tell the agents and how this system works and what is left to be done."* The binding rulings are in
`docs/superpowers/specs/2026-10-13-video-blocking-capture-design.md` (FX–GE); this file is the operating manual and the
state. Jack's brief, verbatim: *"body recognition on those videos to detect every body … figure out where everyone
should be and when, then … figure out where the camera angle would be."*

## 1. The idea in one paragraph

Jack downloaded the Disney+ film's clips, one per number. The pipeline turns each clip into: every kept frame's
**album time** `(track, at)` (stage 1), every **body** in every frame as a box plus 17 joints, linked into tracklets
within a shot (stage 2), and per wide shot the **camera** that took it (stage 3). What is NOT built yet projects each
body's feet through its shot's camera onto the stage floor (stage 4), names the bodies (stage 5), and writes a diff
against the blocking for a human to accept (GC). Nothing ever overwrites the blocking. The footage is never committed;
every derived file names the clip it came from.

## 2. Where everything is

| Thing | Where | Committed? |
|---|---|---|
| The spec (binding rulings FX–GE) | `docs/superpowers/specs/2026-10-13-video-blocking-capture-design.md` | yes |
| The code | `tools/vision/run.py` (stages 1–2, the CLI), `tools/vision/calib.py` (stage 3), `tools/vision/setpoints.json` (the set's named points + wireframe) | yes |
| The agents' brief | `tools/vision/AGENT-CALIB.md` | yes |
| Python deps | `tools/vision/requirements.txt`; the venv `tools/vision/.venv` (Python 3.13.16; torch 2.14.1, ultralytics 8.4, opencv 4.x, numpy 2.5, scipy 1.18, imageio-ffmpeg, lap) | file yes, venv no |
| The footage | `C:\Users\jackf\Videos\hamilton-clips\` — `video/` in the worktree is a **directory junction** to it (`cmd /c mklink /J`); the repo is in OneDrive and 1.8 GB must not sync. His downloads (untouched originals) are in `Downloads\Asaki Takaya - Hamilfilm song clips …\` and `Downloads\Jack - ham\` | no (git-ignored) |
| What the footage is | `video/INDEX.json` (45 files: sha256, size, duration, fps, the playlist URL per clip, `note`s, `playlist` = the YouTube playlist read on 2026-10-14 with each clip's id and target name, `elsewhere.stillWanted`) and `video/README.md` | yes |
| Stage 1 output | `tools/vision/cache/<clip>/frames/NNNNNN.jpg` (5 fps, 1280×720), `frames.json`, `shots.jpg` (every cut as a frame pair) | no (cache, regenerable) |
| Stage 2 output | `tools/vision/cache/<clip>/bodies.json`, `bodies.jpg` (from `draw`) | no |
| Stage 3 output | `tools/vision/calib/<clip>.json` (one so far: Guns and Ships shot 16), overlays/grids/zooms in the cache | **yes** (`calib/`) |
| Hand edits | `cache/<clip>/anchors.json` (manual time anchors), `cache/<clip>/cuts.json` (cut edits) | no — if one is made it should be copied into `calib/` or committed somewhere; none exist yet |
| The record | STATE.md newest block, HANDOFF.md's 2026-10-14 Done block and NEXT SESSION, FUTURE.md's "Video blocking capture" entry, TRAPS.md "From the video capture round" | yes |
| Agent memory | `video-capture-status-2026-10-14.md` in Claude's project memory | — |

The worktree is `.claude/worktrees/agent-a00f4ef392ac2906d`, branch `actors` = PR #234. Everything above is on it.

## 3. Running it

All commands from the worktree root. `P=tools/vision/.venv/Scripts/python` (3.13 — Jack's default `python` is 3.15,
which has NO torch wheel; stage 1 alone also runs on 3.15 with numpy + opencv + imageio-ffmpeg).

```sh
$P -I tools/vision/run.py index                                   # scan video/, (re)write INDEX.json, list what is missing
$P -I tools/vision/run.py index --import "<download folder>" --rename   # copy new clips in (same bytes never re-copied), name them 1-03-slug.mp4
$P -I tools/vision/run.py frames 1-03-my-shot [--fps 5] [--no-decode] [--keep-align]    # stage 1
$P -I tools/vision/run.py sheet  1-03-my-shot                     # shots.jpg: last frame | first frame at every cut
$P -I tools/vision/run.py bodies 1-03-my-shot                     # stage 2 (~40 fps once the model is warm)
$P -I tools/vision/run.py draw   1-03-my-shot [-n 9]              # bodies.jpg: boxes, ids, skeletons, a frame a shot
$P -I tools/vision/run.py check  1-03-my-shot                     # what the cache holds
$P -I tools/vision/run.py wide   1-03-my-shot                     # the shots worth calibrating (small bodies, several)
$P -I tools/vision/run.py calib  1-03-my-shot list                # the 47 named set points and how to find each
$P -I tools/vision/run.py calib  1-03-my-shot 16 grid             # grid-s16.jpg: the shot's middle frame, 100 px grid at 2x
$P -I tools/vision/run.py calib  1-03-my-shot 16 solve lip-sr=200,652 rail-us-c=615,405 ...   # >= 5 points -> camera + overlay
$P -I tools/vision/run.py calib  1-03-my-shot 16 zoom [name ...]  # 4x crops around each point's PREDICTED pixel, 10 px grid
$P -I tools/vision/run.py calib  1-03-my-shot 16 refine           # slide the solve onto the image's edges (small help)
$P -I tools/vision/run.py floor  1-03-my-shot [--unjudged]        # stage 4: feet onto the floor -> tools/vision/out/<track>.json
$P -I tools/vision/run.py floor-check 1-03-my-shot 16             # floor-s16.jpg: the shot's foot pixels over a plan of its positions
$P -I tools/vision/ident.py 1-03 [--clip 1-03-my-shot] [--hist-stats]   # stage 5: identities -> characters in out/<track>.json (also `run.py ident`)
```

`<clip>` is a file in `video/` by stem. Every stage reads the previous stage's file and writes its own, so any one can
be re-run alone. Resume the whole-playlist pose batch (it skips finished clips) with:

```sh
for f in video/*.mp4; do c=$(basename "$f" .mp4); [ -f tools/vision/cache/$c/bodies.json ] || $P -I tools/vision/run.py bodies $c; done
```

## 4. How each stage works

### Stage 1 — `frames`: frames, cuts, album time (RULINGS FY-1, FZ)

1. **Frames.** ffmpeg (on the PATH, else imageio-ffmpeg's binary) decodes the clip at 5 fps, 720 high, to JPEGs.
   Frame `i` is at clip time `i / fps`.
2. **Time.** The clip's audio is decoded to 16 kHz mono and turned into the page's own loudness envelope: RMS per 20 ms,
   `255·(log10(rms)+4)/4`, one byte per bin — the same recipe as `assets/hamilton-soundtrack-env.u8` (the album, 8556 s,
   427,802 bytes; track `t` starts at `tracks[].file` seconds into it, from `assets/hamilton-show.json`). Both
   envelopes are high-passed (minus a 1 s moving mean) and the clip is matched against the span of the track(s) it
   covers ±30 s, **piecewise**: a 10 s window every 10 s, normalised cross-correlation.
   - With no running offset (the start, or the chain lost), a window is searched over the whole span and must clear
     0.45 AND the next (or previous) window, correlated on its own, must land on the same offset within 2 s. Two
     independent agreements are what a wrong number cannot fake (one window alone hits 0.45 on the wrong number).
   - With a running offset, a window is searched ±2 s around it (the slack grows 1 s per miss) and accepted at 0.245
     (0.7 × 0.35) — the film drifts through rapped dialogue over crowd noise, where it correlates weakly. Six misses
     in a row and the chain is lost (global search again). From every global find the chain also walks BACK to pick
     up a quiet opening.
   - **Wrong beats are dropped.** About one anchor in fifty (10 of 466 synthetic) took a beat or bar of the same
     groove, 0.6–2.1 s off, where the true peak had weakened. `drop_outliers` drops a run of one or two anchors when
     every one is more than 0.5 s off the line through the anchors either side of it AND those two agree: offsets
     within 0.3 s; or a steady tempo (the next anchor out on each side on their line within 0.25 s, and the run
     outside both their offsets); or the run is more than 1.5× their disagreement off the line. That last one is the
     shape test: a pause in the film is a STEP, and an anchor beside a step is never further off its neighbours' line
     than the step itself; a wrong beat goes out and comes back. The first and last anchors are never judged (the
     next number after a pause looks like a wrong beat from one side). A first try that fitted lines through any
     three neighbours ate real drifts — Take a Break slows 4 s over a minute, Aaron Burr, Sir gains 1.5 s in a gap —
     so it is this strict on purpose: 13 anchors went over the 45 clips (1-08, 1-11, 1-16, 2-05, 2-09, 2-16, 2-18,
     2-19; none lost more than 20 %), every one an excursion by eye. What went is in `align.info.dropped`.
   - **Refine.** Each anchor's window is then resampled to the local tempo (the slope of the anchors within 25 s) and
     searched ±0.3 s again, kept where the corr does not fall; then the drop runs again (a wrong beat between two
     anchors still carrying their jitter can fail the steady test before refine). A 10 s window 3 % off tempo has no
     single best offset (±0.15 s of jitter); at the album's tempo it has — the synthetic check went from 57 anchors
     over 0.1 s to 444 of 456 under 0.02 s (worst 0.133 s: an anchor with no neighbour within 25 s to take a tempo
     from).
   - **Tempo prior.** 1-04 The Story of Tonight runs 5 % faster in the film than on the album, and ±2 s of slack
     cannot follow that. When the plain pass finds fewer than 3 anchors, the clip envelope is resampled ×0.94, 0.97,
     1.03, 1.06 and the best chain kept (most anchors, then the best median corr) — but only a chain of 3+ with a
     median corr of 0.45: four more tries are four more chances at a wrong number (What'd I Miss over My Shot's span
     at ×0.97 made a false chain of seven at 0.33). The stretch used is `align.stretch` (1.0 none, null for manual
     anchors), the counts per stretch `align.info.tempoTried`. 1-04 (its hand anchors moved aside) found ×1.06, eight
     anchors within 0.06 s of the hand ones. 1-01 Alexander Hamilton, 0 anchors before, now has six at ×0.97 (median
     corr 0.45, just over the bar) — the middle four agree on a film 4 % slow, the first and last do not: look at it
     before trusting it.
   - The result is `align.anchors`: `(clipTime, albumFileTime, corr)`, plus `count`, `medianResidualS` (an anchor
     against the line through its neighbours), `worstGapS`. Frames interpolate linearly between anchors and ride a
     constant offset beyond the ends; each frame gets `tconf` 1 between anchors, falling to 0.2 ten seconds past the
     last one (applause, the next number's lead-in).
   - `cache/<clip>/anchors.json` = `[[clipTime, "1-04:12.5"], ...]` overrides the matcher entirely (for a clip with no
     usable music). `--keep-align` keeps the previous anchors; `--no-decode` keeps the frames and detected cuts.
   - Synthetic check, `$P -I tools/vision/aligncheck.py [-v] [--tol 0.15]` (not a suite — it needs numpy): slice ten
     tracks out of the album envelope, stretch ±3 %, put 8 s of noise in front → every anchor within 0.15 s (the
     jitter a 10 s window at 3 % has in itself) and anchors over 60 % of the track; slice any other track and search
     My Shot's span → no anchor. Documented exceptions, printed EXCEPT: the last 30 s of 1-02 and the first ~29 s of
     1-04 really are inside the span (an anchor there must land on the truth), and Non-Stop ends on My Shot's own
     refrain (an anchor allowed in its last 30 s). One case fails, and it is not a wrong anchor: My Shot at +3 %
     has no two agreeing windows before 185 s, and the walk back from there gives up after six windows under the
     full bar (0.30–0.34 at the truth, smeared by the tempo), so its anchors cover 47 % of the track.
3. **Cuts.** Consecutive frames compared on a 48×27 gray (mean abs diff) and a hue/sat histogram (16×8, half-L1):
   a cut when gray > 12 AND hist > 0.2. On the film, every true cut had hist > 0.2 and fast motion inside a shot
   reached gray 33 but stayed under hist 0.15. `cuts.json` `{"add": [i], "remove": [i]}` edits them. Shots are
   `{id, first, last, n}`; `sheet` draws every cut for the eye.
4. **Output** `frames.json`: `clip, source, tracksDeclared, tracksSeen (tconf ≥ 0.5), fps, height, frames[{i, file,
   t, album, track, at, tconf, shot}], shots[], align{}, cuts{}, diffs[]`.

### Stage 2 — `bodies`: pose and tracklets (FY-2)

ultralytics YOLO26n-pose (`tools/vision/yolo26n-pose.pt`, auto-downloaded, git-ignored), `imgsz` 640, `conf` 0.25,
ByteTrack with `persist=True`. **The tracker is reset at every cut** (`model.predictor.trackers[*].reset()`), so a
tracklet never crosses a shot; ids are `s<shot>-t<n>`. Output `bodies.json`: `frames[{i, bodies[{tid, box[x1,y1,x2,y2],
conf, kp[[x,y,c]×17 COCO order]}]}], tracklets{tid: {shot, first, last, n}}, frameSize, model`. COCO-17: 0 nose, 1–4
eyes/ears, 5–6 shoulders, 7–8 elbows, 9–10 wrists, 11–12 hips, 13–14 knees, 15–16 ankles. Runs at ~17 fps cold and
~40 fps warm on Jack's CPU — the spec expected 6–10. `draw` makes `bodies.jpg` to check by eye; Schuyler Defeated's
was checked: every body in nine shots boxed and skeletoned right, the dark upstage ensemble included.

**The widest shots lose most of their bodies at 640.** `bodies --imgsz N` (default 640) sets the model's input size.
Measured by calling the model straight on the cached frames (predict, no tracker, conf 0.25; the frames are 1280×720,
so 1280 is native and above it is upsampling):

| frames | ~visible | 640 | 960 | 1280 | 1280 at conf 0.1 |
|---|---|---|---|---|---|
| 1-18 shot 16 (335–341) | ~20 | 0–3, mean 1.6 | 2–6, 3.7 | 4–6, 4.9 | 4–9, 6.9 |
| 1-18 frames 330–346 (shots 15–17) | | mean 3.5 | 5.5 | 7.0 | |
| 2-05 shot 65 (1520–1526) | 13 | 4–8, 6.6 | 10–12, 10.7 | 12–15, 13.3 | 15–18, 16.0 |
| speed (Jack's CPU, warm) | | ~45 fps | ~24 fps | ~16 fps | ~16 fps |

1280 finds 2-05's thirteen (15–18 at conf 0.1 is more than are there — doubles or false boxes, not looked at); on Guns and Ships it still misses the galleries, the
stairs and a man centre stage with his arms up — the nano model, not the size, is the limit there (1920, upsampled,
found about one more per frame, at 6.5 fps; a larger pose model is the untried next step). Not
re-run over any clip: a re-run changes every tracklet id, so it waits for the decision.

### Stage 3 — `calib`: the camera of a shot (GA) — BUILT, the clicking UI NOT

- **`setpoints.json`**: 47 named 3D points in the set frame (`assets/hamilton-set.glb`'s: metres, Y up, deck y 0.045,
  galleries y 2.743, upstage −z, house +z, **stage left +x = the RIGHT of a house camera's frame**). Taken from
  `blocking.html`'s measured `PLAN` (deck lip z 5.4; turntable rings r 3.82 and 2.59 about (0, 0.95); upstage gallery
  front z −3.0 from x −4.75 to 5.0, its rail top y 3.6 at z −2.97; SL gallery x 4.6–6.0; SR balcony arm x −6.65 to
  −5.65; the stairs' feet/tops; proscenium piers x ±6.5) and from the GLB's `ham_post` mesh clustered into columns
  (back-wall posts at x −3.67, −3.07, 0, 3.07, 3.67, z −4.12; tall side posts at (−5.62, 0.52), (−5.17, −1.57),
  (5.32, −1.57)). Each has a `see` line. Also a `wire`: polylines + the two rings, for the overlay. **The rail height
  (y 3.6) and the post x's came from vertex clustering, not from a measurement — verify them against a good solve.**
- **`solve`**: the lens is unknown, so the horizontal field of view is grid-searched 12°–100° in 1° steps with the
  principal point at the frame centre. **The first version took the least RMS, and it went wrong**: the agents' point
  sets are near-planar or near-collinear (the back wall and the upstage rail, the centre line at one u), so the
  lens/distance trade-off is flat and the minimum fell on a deck-height 75–90° camera 9 m out where the frame is plainly
  a long lens — and 5 low-RMS points mean nothing there. Now, at every lens the camera is solved twice: **free** (SQPNP
  then iterative; kept as `solve.free` for comparison) and **bounded** — least squares in (rotation, camera centre)
  with the centre held inside a physical `PRIOR`: not under the deck (y 0–14), not inside the set (z ≥ 3.5, |x| ≤ 14,
  off the turntables r 3.82), at most 60 m from the set centre (0, 0.045, 0.95). (A tighter first prior — z ≥ 6, y ≥
  0.8, fov ≤ 70 — was wrong: the film had a pit camera at deck height with an 80–94° lens, One Last Time s37/43/46,
  1-03 s42, Washington s46, and on-stage cameras near the SR lip, We Know s1/s24.) Which bounded candidate wins:
  1. **the body cue** (`depthCue: "bodies"`): the shot's bodies (`bodies.json`, the solve's frame ± 3, inside the shot)
     with both ankles and both shoulders (or the nose, less 0.22 m) over 0.3; each foot pixel's ray meets the deck, the
     shoulder ray is brought to the vertical through that point, and the median implied shoulder height should be
     ~1.40 m. Score = RMS + 16.7 px/m × |h − 1.40| (0.3 m costs 5 px), over the candidates within **5 px** of the
     best RMS only — the cue decides what the points leave open, it does not overrule them (uncapped, it pushed a
     judged-good 4 px fit to 20 px). It is dropped (`depthCueNote` says why) with fewer than 3 bodies on the deck, when
     h moves less than 0.15 m over every lens (no information — it would only pull to a bound), or when h never comes
     within 1.25–1.55 (the bodies are not standing on the deck: a riser, a stair, a lift).
  2. else, when the candidates within 1.5 px (or 15 %) of the best span more than 25 % of its camera distance
     (`window.poor`), the one **nearest a known camera** (`HOUSE_CAMERAS`: the centre-stalls camera (0, 2.1, 18) 31–36°
     that four shots found independently, the high close one (0, 4.5, 14.5) ~53°, the rear-house long lens (−5, 2, 45)
     24°, the pit (0, 0.3, 9) ~88°, the front row (0, 0.1, 13.5) ~67°, the SR lip (−2.6, 1.7, 4.9) ~70°);
  3. else the least RMS. Then a 0.1° search around the pick by the same score.

  `solve.degenerate` is set when no body cue ran and the RMS is within 1.5 px over more than 30° of lens (the honest
  label: the points do not say where the camera is), or when no free candidate at any lens keeps inside the prior.
  Every solve also carries `mPerPx` (metres of deck one pixel down the frame moves the floor point at the set centre's
  pixel — stage 4's fragility measure; a deck-height camera gives 0.3–4.6), `cond` (`sv`: the singular values of the
  centred 3D point cloud / √n in metres, `heightSd`, `depthSd` along the look, and `sdDistPerPx`/`sdFovPerPx`: the
  camera distance's and the lens's 1σ for 1 px of point noise, from the Jacobian), `window`, `choice`, `bodyHeightM`,
  `bodies`. Output per shot in `calib/<clip>.json`: `frame, points{name: [u, v]}, solve{K, R, t, rvec, camera [x, y,
  z] in set metres, look (unit), fovDeg, rms, residuals[], frameSize, …the above}, moving`. Pixels are in the cache
  frame — **1280×720, but 1330 for Yorktown and 1350 for Non-Stop**: each solve takes the frame's own size.
- **`resolve`**: `run.py calib <clip> all resolve` (or `python -I tools/vision/calib.py resolve all [--no-bodies]
  [--dry]` for every clip) re-solves every shot with 5+ stored points through the above and redraws its overlay; it
  keeps `frame`, `points`, `judged`, `moving`, `skipped`, `note` and replaces only `solve` (the file is re-read before
  writing and a shot whose points changed meanwhile is left alone). It prints shot, n, RMS and camera before → after,
  fov, m/px, the cue, h, degenerate. **`census`**: `run.py calib <clip> census` (any clip; it reads every calib
  file) or `calib.py census [--loo]` — per named point over every solved, unskipped, non-degenerate shot: uses, mean
  signed residual (clicked − projected, +du right, +dv down) in px and in metres at the point's depth, its sd, and RMS.
  A point misplaced in `setpoints.json` shows a consistent sign across independent set-ups; `--loo` predicts each
  point from a solve without it, so a solve cannot absorb its own bad point. Count set-ups, not shots: Right Hand
  Man's ten shots are one camera.
- **`zoom`**: for every named point the solve puts in the frame, a 120 px crop at 4x with a 10 px grid and a red
  cross at the prediction — the reader finds the true pixel and re-solves. **`refine`**: Nelder–Mead over (rvec, t,
  fov) maximising the blurred image-gradient under the projected wireframe, coarse to fine (σ 8, 4, 2), penalised by
  the clicked residuals. On the one shot tried it barely moved the solve (the timber is dense, the edges weak); it is
  a small help, not the method.
- **What it gave**: Guns and Ships shot 16 (the whole set from the house, frame 338) from nine points the agent read
  off gridded crops: camera (−5.2, 1.6, 44.8) m — 45 m back, 2 m up, 24° lens (a long lens from the rear of the
  house: plausible, the audience's heads are in the bottom of the frame), the lip to 8 px, the back-wall posts 4–25
  px, the SL tall post 51 px: **the agent cannot tell one timber post from another at 720p**. A human clicking on
  the frame would get ~3 px. The overlay is `cache/1-18-guns-and-ships/calib-s16.jpg`.
- **Not built**: the Calibrate mode in `blocking.html` (Advanced) that RULING GA specifies (show a cache frame, list
  the named points, click, solve in the page or through a tiny local server that calls `calib.py`, draw the wire,
  write `calib/<clip>.json` by the download route); moving-shot handling (GA: calibrate first and last frames, track
  the set's features by optical flow, re-solve every 0.5 s, `moving: "failed"` over 2 px RMS). The upper-level rule
  is built, in stage 4.

### Stage 4 — `floor`: floor positions (FY-4, GA) — BUILT

`tools/vision/floor.py`. A shot is used when `calib/<clip>.json` has its `solve`, no `skipped`, and `judged` `good` or
`fair` (`--unjudged` also takes a solve with no verdict yet, weighted as a moving shot). Per body per frame: the foot
pixel is the mean of the ankles (COCO 15, 16) when both are over 0.3, else the lower hip plus 0.85 m of leg (half the
box, the box taken as 1.7 m), else nothing. Its ray from the camera meets, in order: the **upstage gallery** by the
ruling's test — the deck point lands upstage of the gallery's front (z −3.0) or nowhere, while the foot pixel is
above the gallery's projected front line (`gal-us-sr`..`gal-us-sl`, the edge **at the floor**, 0.3 m of slack; the
rail top at 3.6 m is not used, since from a house lens 1.6 m up a gallery foot sits ~0.8 m below it) → the 2.743 m
plane; else the first of the deck plane (0.045), the gallery plane where `tools/hamilton-floor.json`'s `top` grid has
gallery floor (the one big component at 2.55–2.95 m inside the proscenium — the side galleries, and any gallery seen
from above), and a **stair** tread (the `top` grid's mid-height components that rise ≥ 1 m, marched in 0.05 m steps;
a hit within 0.35 m under a tread's top — a ray low through the risers is a foot hidden behind the stair and goes on
to the deck). A stair body is placed where its ray meets the tread, flagged `stair` for a human: the deck plane would
throw it tens of metres upstage from a low lens. Nothing is clamped; a point outside the floor map or on the house
floor beyond the lip is kept with `offMap`. `conf` = the frame's `tconf` × the verdict (good 1, fair 0.6, moving or
unjudged 0.3) × the least keypoint confidence used.

Output `tools/vision/out/<track>.json` (committed), one per album track the clip's used shots fall in; a run
replaces only its own clip's entry, so Yorktown p1–p4 or Non-Stop p1–p3 merge into one file (and a clip's stale
entry in a track it no longer feeds is removed): `{format: "hamilton-vision 1", track, frame (the blocking's frame
sentence), clips: {<clip>: {source: {sha256, url}, shots: {<shot>: {camera, fovDeg, rms, judged, moving}},
positions: {<tid>: [[at, x, z, level, conf], ...]}}}}` — a sample off the map carries a sixth element
`{"offMap": true}`. `floor` prints per shot the count, the x/z ranges on the map, the levels, and **how many metres one
pixel of foot moves the point**: over ~0.1 m the shot's depth is fragile (a lens near deck height sees the deck
edge-on). `floor-check` draws the shot's middle frame with every foot pixel (filled = ankles, hollow = hip + leg) over
a plan (the floor map's deck, galleries in blue, stairs in brown, the rings, the lip; a colour per tracklet; dot deck,
square gallery, triangle stair).

### Stage 5 — `ident`: identities (FY-5, GB) — BUILT, no labels yet

`tools/vision/ident.py <track>` (per TRACK: it reads every clip in `out/<track>.json` plus every cached clip whose
`frames.json` reaches the track, and the clip's positions from every `out/*.json` it feeds). Every tracklet gets an id,
uncalibrated shots' too (x, z null). In order: (1) `labels/<clip>.json` `{"clip", "labels": {tid: castId}}` → conf 1.0
(no such file exists yet — the Calibrate mode is to write it); (2) **continuity**, shot by shot: a tracklet starting
≤ 0.5 s after a label/continuity tracklet of the previous shot ends, its first floor position ≤ 0.6 m from that one's
last (both within 0.6 s of the cut) → conf × 0.8; (3) **appearance**: the torso box (shoulders 5/6 to hips 11/12, ≥ one
of each over 0.3, widened to 0.4 of its height) in up to 12 frames, an 18×8×4 HSV histogram, Bhattacharyya coefficient
against the clip's label/continuity tracklets; the nearest picks the group (principals / ensemble — the parchment
costumes match only among themselves), it must reach **0.80** and beat the group's next id by **0.05**, conf = 0.7 ×
similarity × the reference's conf; an ensemble body that cannot be told apart (or only one ensemble id labelled) pools
as `ens?`. The 0.80: on 2-05 a tracklet's two halves reach it 53 % of the time and two bodies in one frame 6.5 % (1-18:
64 % / 12 %) — `--hist-stats` prints this per clip; with real labels re-judge it. (4) **blocking**: the committed
blocking's on-stage actor (straight legs at 1.3 m/s, not seen at or between `off` waypoints) nearest the tracklet's
median floor position at its median time, same level (gallery/deck; a stair either), < 1.5 m → conf 0.3,
`fromBlocking` — it agrees with the blocking by construction and is never evidence for it. Else the pool `ens?`
(rule `pool`). No id is held by two tracklets overlapping in time in one clip (greedy, nearest first). Written into
the same `out/<track>.json`, stage 4's keys byte-for-byte as they were: `identities: {clip: {tid: {id, rule, conf,
fromBlocking?}}}` and `characters: {castId | "ens?": [{at, x, z, level, conf, clip, shot, tid, rule, fromBlocking?,
offMap?}]}` sorted by `at`, a sample's conf = the position's × the identity's (a pooled body: the position's). It is
idempotent; **re-running `floor` drops both keys — run `ident` after it**, and after a stage-1 re-run (positions are
joined to frames by `at`; a stale join falls back to the tracklet's nearest frame and says so). With no labels every
identity is `blocking` or `ens?` (2-05: 525 tracklets, 14 with positions, 11 blocking, 514 pooled).

## 5. What the agents were going to be told

Jack: *"once you figure out the best way to do it have opus agents do the rest"* — then *"get everything to a point
where it can pause"*, so none were spawned. The plan:

- **Precondition**: every clip has `bodies.json` (done, all 45).
- **Split**: one agent per 4–5 clips, `subagent_type: general-purpose`, `model: "opus"`, run in parallel, each given:
  the worktree path, `P`, its list of clips, and the brief `tools/vision/AGENT-CALIB.md` to read first. Roughly:
  agent A 1-02 1-03 1-05 1-06 1-07; B 1-08 1-10 1-11 1-12 1-13; C 1-14 1-15 1-16 1-17 1-18; D 1-19 1-20-p1..p4 1-21;
  E 1-22 1-23-p1..p3 2-01; F 2-03 2-04 2-05 2-06 2-07; G 2-08 2-09 2-10 2-11 2-12; H 2-14 2-16 2-17 2-18; I 2-19 2-20
  2-21 (and 1-01, 1-04 only if their time ever gets anchored — without `at` a camera is useless).
- **The brief** (in the file, in full): per clip run `wide`; per wide shot `grid` → identify 6–10 named points spread
  in depth AND height, read their pixels → `solve` → `zoom` the points over 10 px and 2–3 unused ones → re-solve →
  at most three rounds → judge the overlay `good` (≤ 8 px, the wire sits on the set) / `fair` (≤ 15 px) / `poor`
  (leave the shot out, `"skipped"`); `"moving": true` when the wire fits the first frame and not the last; `"skipped":
  "too tight"` under five visible points. Never edit `setpoints.json`/`calib.py`/`run.py`, never commit, never run
  `bodies`/`frames`. Report per clip: shots found, rms, verdict, camera position, anything odd (a misplaced set point,
  SL/SR mirrored, a shot from a side box — 15–25 m to one side, 6–10 m up).
- **After**: commit `tools/vision/calib/*.json` as they come back (the spawning session commits, with the owner's
  no-reply email, on `actors`); spot-check two overlays per agent by eye; collect their notes on the set points into
  `setpoints.json` fixes (that IS allowed for the main session) and re-solve the affected shots.
- **Expect** 8–15 px per shot. If stage 4's floor positions then look wrong by more than ~0.5 m on a known mark, the
  clicking UI (§4, not built) is the way to tighten, with Jack clicking the first few numbers himself (the spec's
  open question).

## 6. The results so far

Stage 1 and stage 2 on all 45 clips (40 of the 46 tracks).

| clip | frames | shots | anchors | median residual s | worst gap s | bodies | tracklets |
|---|---|---|---|---|---|---|---|
| 1-01-alexander-hamilton | 520 | 43 | 0 | — | — | 1260 | 186 |
| 1-02-aaron-burr-sir | 750 | 28 | 11 | 0.02 | 30.0 | 2746 | 176 |
| 1-03-my-shot | 1690 | 68 | 30 | 0.02 | 20.0 | 8867 | 712 |
| 1-04-the-story-of-tonight | 440 | 8 | 0 | — | — | 1627 | 54 |
| 1-05-the-schuyler-sisters | 953 | 43 | 15 | 0.03 | 20.0 | 4588 | 425 |
| 1-06-farmer-refuted | 499 | 13 | 8 | 0.14 | 20.0 | 2649 | 130 |
| 1-07-you-ll-be-back | 1233 | 20 | 22 | 0.0 | 10.0 | 1654 | 46 |
| 1-08-right-hand-man | 1614 | 95 | 31 | 0.05 | 10.0 | 5790 | 518 |
| 1-10-helpless | 1278 | 70 | 25 | 0.01 | 10.0 | 4220 | 446 |
| 1-11-satisfied | 1641 | 69 | 28 | 0.02 | 20.0 | 7129 | 565 |
| 1-12-the-story-of-tonight-reprise | 612 | 17 | 9 | 0.08 | 30.0 | 1986 | 82 |
| 1-13-wait-for-it | 1057 | 24 | 18 | 0.01 | 20.0 | 1905 | 93 |
| 1-14-stay-alive | 795 | 25 | 12 | 0.02 | 20.0 | 2538 | 209 |
| 1-15-ten-duel-commandments | 536 | 43 | 10 | 0.01 | 10.0 | 2186 | 272 |
| 1-16-meet-me-inside | 436 | 24 | 8 | 0.77 | 10.0 | 1088 | 72 |
| 1-17-that-would-be-enough | 886 | 13 | 17 | 0.14 | 10.0 | 1716 | 37 |
| 1-18-guns-and-ships | 658 | 29 | 10 | 0.11 | 20.0 | 1759 | 193 |
| 1-19-history-has-its-eyes-on-you | 519 | 14 | 4 | 0.26 | 30.0 | 1165 | 52 |
| 1-20-yorktown…-p1 | 336 | 14 | 5 | 0.01 | 10.0 | 1151 | 80 |
| 1-20-yorktown…-p2 | 316 | 25 | 5 | 0.01 | 10.0 | 1009 | 146 |
| 1-20-yorktown…-p3 | 301 | 23 | 3 | 0.03 | 10.0 | 1117 | 152 |
| 1-20-yorktown…-p4 | 287 | 10 | 4 | 0.07 | 10.0 | 1062 | 68 |
| 1-21-what-comes-next | 604 | 13 | 8 | 0.17 | 20.0 | 748 | 33 |
| 1-22-dear-theodosia | 854 | 13 | 8 | 0.11 | 10.0 | 1237 | 27 |
| 1-23-non-stop-p1 | 591 | 28 | 11 | 0.03 | 10.0 | 2464 | 238 |
| 1-23-non-stop-p2 | 303 | 15 | 6 | 0.07 | 10.0 | 598 | 44 |
| 1-23-non-stop-p3 | 608 | 20 | 11 | 0.127 | 20.0 | 1557 | 151 |
| 2-01-what-d-i-miss | 1203 | 55 | 22 | 0.06 | 30.0 | 5656 | 476 |
| 2-03-take-a-break | 1447 | 48 | 27 | 0.03 | 20.0 | 3302 | 174 |
| 2-04-say-no-to-this | 1248 | 26 | 23 | 0.01 | 10.0 | 3153 | 200 |
| 2-05-the-room-where-it-happens | 1656 | 83 | 30 | 0.1 | 20.0 | 5967 | 523 |
| 2-06-schuyler-defeated | 316 | 10 | 6 | 0.02 | 10.0 | 1183 | 71 |
| 2-07-cabinet-battle-2 | 721 | 29 | 14 | 0.01 | 10.0 | 3801 | 228 |
| 2-08-washington-on-your-side | 895 | 47 | 16 | 0.01 | 20.0 | 2582 | 202 |
| 2-09-one-last-time | 1603 | 50 | 23 | 0.19 | 40.0 | 4290 | 186 |
| 2-10-i-know-him | 575 | 19 | 7 | 0.1 | 50.0 | 891 | 46 |
| 2-11-the-adams-administration | 283 | 6 | 5 | 0.39 | 10.0 | 1002 | 50 |
| 2-12-we-know | 737 | 29 | 12 | 0.12 | 20.0 | 2892 | 133 |
| 2-14-the-reynolds-pamphlet | 642 | 32 | 11 | 0.01 | 20.0 | 3521 | 312 |
| 2-16-blow-us-all-away | 882 | 29 | 17 | 0.09 | 10.0 | 2843 | 200 |
| 2-17-stay-alive-reprise | 621 | 9 | 12 | 0.01 | 10.0 | 1576 | 70 |
| 2-18-it-s-quiet-uptown | 1388 | 9 | 27 | 0.11 | 10.0 | 3508 | 114 |
| 2-19-the-election-of-1800 | 1213 | 65 | 23 | 0.02 | 20.0 | 5247 | 431 |
| 2-20-your-obedient-servant | 751 | 15 | 13 | 0.02 | 20.0 | 2342 | 135 |
| 2-21-best-of-wives-and-best-of-women | 257 | 3 | 5 | 0.02 | 10.0 | 520 | 11 |

Readings: the film runs at the album's tempo to within 20 ms on most numbers; Aaron Burr, Sir drifts 1.5 s through
its rap; One Last Time's offset drifts 10 s over the clip (the film's is 25 s longer than the album's, the chain follows
at correlations of 0.25–0.33 — trust its second half less). 1-16, 1-19, 2-11 are dialogue-heavy with few anchors.
**1-04** (a quiet close-harmony number) never aligned; **1-01** is Disney's 104 s promo montage — cut up, not
continuous — and never will. The "LIVE AUDIO" Satisfied and the sing-along Wait for It are the film's performance.
Cuts were judged by eye on Aaron Burr, Sir and Guns and Ships: every detected cut real; missed cuts are possible and
unmeasured (a missed cut merges two shots — the tracker then bridges a cut it should not, and a camera solve fits
only half the shot).

## 7. Where it stands after the agents' round (2026-10-14, second session), and what is left

**The round ran** (the §5 plan, nine Opus agents in parallel, plus builders): 43 `calib/<clip>.json` files, about 190 wide
shots looked at, **~55 kept solves** (good/fair, many `moving`), the rest `"skipped": "<why>"` with the reason and, for
merged shots, the frame of the missed cut in a `note`. Stage 4 and stage 5 are BUILT (§3, §4); the Calibrate clicking
UI is BUILT (`blocking.html` Advanced → Calibrate, `window.CALIB`); the stage 1 fixes landed and every clip was
re-aligned without a shot id changing. Commit `62f7ddf` holds the code; the calib JSONs, `calib.py` with its prior
and `out/` follow once the solver agent's `resolve all` finishes (see STATE.md).

**What the agents found, which changes the method:**
- **The brief's reference camera was wrong.** Guns and Ships shot 16 is a front-stalls camera at about deck height
  with a wide lens (≈ (0, 0.2, 9), 85–90°), not 45 m back at 24°: the old solve came from misidentified posts, and
  `HOUSE_CAMERAS` in `calib.py` must lose that entry. The real families: a fixed centre-stalls camera ≈ (0, 2–2.6,
  14–19 m), fov 32–45° (most house wides, found independently by four agents); a high close camera ≈ (0, 4–5, 14–15),
  50–55°; a pit/front-row camera ≈ (0, 0.1–0.4, 9–13.5), 67–94°; on-stage cameras near the SR lip in We Know.
- **Lens and distance trade off freely when the points sit in one plane** (rail + gallery edge + lip-c), so a low rms
  from 5–7 points means nothing; several first solves put the camera on the deck with a 90° lens or 60 m back at 11°.
  The fix is the solver's physical prior plus the **body-height cue** (the shot's bodies' shoulder height through the
  candidate camera, ≈ 1.4 m), which is what pinned every shot that was pinned. Points spread across the full width at
  deck level (back-wall window frames, gallery ends, the ring arcs) are what fix depth without it.
- **Set points that are off** (every agent's residual pattern agrees; the solver's `census` command measures it):
  the rail-top-to-gallery-floor gap in the footage is 1.1–1.2× the model's 0.86 m (rail higher, or the fascia read
  as the floor); `stair-sl-*` (foot ≈ 1 m further stage-left, run ≈ 1.3 m not 2.3) and `stair-sr-*` (10–25 px,
  maybe 0.5–1 m) — and **the stair units move between numbers**, so stair points are unreliable across songs; the
  lip bows downstage at centre by roughly 0.5–1 m (`lip-c` too far upstage); `rail-srstrip-ds`, `bal-sr-ds` 10–17 px;
  the side galleries look wider than placed. Missing from the set points and often the only lit things in a dark
  wide: the turntable's rolling staircases (props) and the overhead light rig.
- **Missed cuts are common** (15–20 % of real cuts; lighting changes split shots too): a merged shot defeats the
  tracker and the solve. The structure test that separates them (NCC of the normalised 48×27 gray < 0.4 with
  hist > 0.12) is in the loose-ends report, NOT applied — changing cuts re-keys every shot id, tracklet and calib.
- **Stage 2 at imgsz 640 misses most bodies in the widest shots** (1–2 of ~20 in G&S s16); 1280 (native) finds
  2–3× as many at ~16 fps; the nano model still misses the galleries. A larger pose model is the next step.
- The homography trick: read ONE frame of a camera set-up carefully and carry its points to sibling shots by SIFT
  homography or a measured similarity (1-08, 2-09, 1-10 were done this way; the `note` says so).

**What is left, in order:**
1. **Finish the solver round:** `calib.py`'s prior softened (y ≥ 0, z ≥ 3.5, fov ≤ 100, the body cue decides),
   `resolve all`, drop the 45 m entry from `HOUSE_CAMERAS`, run the `census`, then `floor` on every clip and `ident`
   on every track (stage 1 re-aligned the `at`s, so every out file is stale until then). Commit calib + out.
2. **Fix `setpoints.json`** from the census (rail height, the stairs per number or dropped, lip-c, the SR strip),
   add the rolling staircases and the light rig as points, re-solve.
3. **Re-run `bodies` at `--imgsz 1280`** on every clip (~80 min), or a larger pose model; then `floor` + `ident`.
4. **The missed cuts:** apply the structure test in a new round that re-keys everything (frames → bodies → calib
   shot ids re-mapped by frame range — the calib entries carry `frame`, so a remap is mechanical).
5. **Jack labels a few numbers in the Calibrate UI** (bodies → cast ids) so rules 1–3 of stage 5 have something to
   work from; until then every identity is `blocking` or `ens?` and is not evidence.
6. **`compare.py` (GC)** and **GD dance timing** — not started.
7. The Calibrate UI's JS solver must carry the same prior and body cue as `calib.py` once those settle.
8. `aligncheck.py`'s one failing case (My Shot ×1.03, coverage 47 %): a tempo-aware walk-back.
9. The Tonys/Ham4Ham question, 5 vs 10 fps, the still-wanted clips.

## 8. Traps specific to this (the full list is in TRAPS.md)

- Python 3.15 has no torch/onnxruntime wheel; the venv is 3.13 and must be made in the WORKTREE (a stray empty one is
  in `C:\Users\jackf\tools\vision\.venv` from a command run in his home folder — deletable).
- `video/` is a junction; a fresh clone needs it remade before importing or the footage lands in OneDrive.
- Patching a file through Python's `open(p, 'w')` on Windows writes CRLF; this Bash tool also strips backslashes
  inside heredocs (`\d` → `d`), so regexes went in through the Edit tool. `file` the sources before committing.
- A `{**stats}` merge whose key matches the data's key overwrites the data (`anchors` became an int once).
- A single 10 s envelope window hits 0.45 on the wrong number; two agreeing windows are the test.
- `index --import` once re-copied every clip because the renamed files no longer matched — it now skips by sha256.
- JDownloader names files by title (`?` becomes `¿`), fetches the audio separately (`.m4a`/`.opus` beside the mp4),
  and leaves `.part` files while downloading; the import takes only video extensions and whole files.
