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
   - The result is `align.anchors`: `(clipTime, albumFileTime, corr)`, plus `count`, `medianResidualS` (an anchor
     against the line through its neighbours), `worstGapS`. Frames interpolate linearly between anchors and ride a
     constant offset beyond the ends; each frame gets `tconf` 1 between anchors, falling to 0.2 ten seconds past the
     last one (applause, the next number's lead-in).
   - `cache/<clip>/anchors.json` = `[[clipTime, "1-04:12.5"], ...]` overrides the matcher entirely (for a clip with no
     usable music). `--keep-align` keeps the previous anchors; `--no-decode` keeps the frames and detected cuts.
   - Synthetic check (not a suite — it needs numpy): slice ten tracks out of the album envelope, stretch ±3 %, put 8 s
     of noise in front → every anchor within 0.1 s; slice any other track and search My Shot's span → no anchor. The
     recipe is in the session's record (HANDOFF 2026-10-14); it should become a script in `tools/vision/` (not done).
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

### Stage 3 — `calib`: the camera of a shot (GA) — BUILT, the clicking UI NOT

- **`setpoints.json`**: 47 named 3D points in the set frame (`assets/hamilton-set.glb`'s: metres, Y up, deck y 0.045,
  galleries y 2.743, upstage −z, house +z, **stage left +x = the RIGHT of a house camera's frame**). Taken from
  `blocking.html`'s measured `PLAN` (deck lip z 5.4; turntable rings r 3.82 and 2.59 about (0, 0.95); upstage gallery
  front z −3.0 from x −4.75 to 5.0, its rail top y 3.6 at z −2.97; SL gallery x 4.6–6.0; SR balcony arm x −6.65 to
  −5.65; the stairs' feet/tops; proscenium piers x ±6.5) and from the GLB's `ham_post` mesh clustered into columns
  (back-wall posts at x −3.67, −3.07, 0, 3.07, 3.67, z −4.12; tall side posts at (−5.62, 0.52), (−5.17, −1.57),
  (5.32, −1.57)). Each has a `see` line. Also a `wire`: polylines + the two rings, for the overlay. **The rail height
  (y 3.6) and the post x's came from vertex clustering, not from a measurement — verify them against a good solve.**
- **`solve`**: the lens is unknown, so the horizontal field of view is grid-searched 12°–100° in 1° steps, PnP
  (`cv2.solvePnP`, SQPNP) at each with the principal point at the frame centre, the least reprojection RMS wins, then
  a 0.1° search around it with iterative refinement. Output per shot in `calib/<clip>.json`: `frame, points{name:
  [u, v]}, solve{K, R, t, rvec, camera [x, y, z] in set metres, look (unit), fovDeg, rms, residuals[], frameSize},
  moving`. Pixels are in the 1280×720 cache frame.
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
  the set's features by optical flow, re-solve every 0.5 s, `moving: "failed"` over 2 px RMS); the upper-level rule.

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

## 7. What is left, in the order it should go

1. **The pose batch is done** (45 `bodies.json`; if the cache is ever lost, the §3 loop remakes it in ~25 min).
2. **Spawn the calibration agents** (§5). Commit `calib/*.json`.
3. **Stage 4 — floor positions (GA/FY-4)**, not built: for each tracklet in a calibrated shot, the foot point = the
   mean of the two ankles when both have conf > 0.3, else the lower hip minus a standard 0.85 m leg (in pixels, scale
   by the body's box height ≈ 1.7 m); back-project the pixel through the camera as a ray and intersect the deck plane
   (y 0.045); **upper level**: if the deck intersection lands beyond the gallery's front rail in the image while the
   ankle pixel is above the rail line, intersect the y 2.743 plane instead; stairs: deck plane and `level: "stair"`.
   Write `tools/vision/out/<track>.json` `positions`: per tracklet, per frame, `(at, x, z, level, conf)` with
   `conf` = tconf × the solve's verdict (good 1, fair 0.6) × the keypoint confidence. Uncalibrated (tight) shots
   yield no position but keep their tracklets for stage 5. `tools/hamilton-floor.json` (the measured floor grid,
   0.2 m cells, `deck` and `top` heights) is the source for "is there a gallery here".
4. **Stage 5 — identities (GB)**: `labels/<clip>.json` (tracklet → cast id, a human label once per shot — the
   Calibrate UI would offer it: click a body, pick a name); continuity across cuts (start within 0.5 s and 0.6 m of a
   labelled tracklet's end, conf × 0.8); a torso colour histogram matched within the clip (principals' costumes are
   distinct; the parchment ensemble only among themselves); last resort the current blocking's nearest character at
   that time, conf 0.3, flagged `fromBlocking`. Unresolvable ensemble bodies pool as `ens?`. Merge all clips of a
   track into per-character tracks under `characters` in `out/<track>.json`, each sample carrying clip/shot/rule.
   The cast ids and colours are in `tools/hamilton-cast.json` and `docs/hamilton-blocking-format.md`.
5. **`compare.py` (GC)**: `out/<track>.json` vs `assets/hamilton-blocking.json` → `diffs/<track>.md` + `.json`:
   disagreements > 0.75 m for > 2 s, on/off-stage disagreements, level disagreements, and proposed waypoints
   (Douglas–Peucker at 0.3 m, ≤ one per 3 s, snapped to the floor map) each naming its evidence; proposals under
   conf 0.5 marked "do not apply without a look"; the RULED items (boundary carry-overs, the Cabinet Battle sides,
   Burr's balcony, the Non-Stop gallery, the duel sides) reported as "footage disagrees with ruling", never proposed.
   `--apply --min-conf 0.7` writes a `# VISION:` section into a NEW generator section for a human to accept.
6. **GD — dance timing** from the skeletons against `assets/hamilton-beats.json` (per character per bar a motion
   energy and arm/leg split; DTW against the move library's joint-angle sequences, proposals above 0.7).
7. **The Calibrate clicking UI** in `blocking.html` (GA) — when the agents' precision is not enough.
8. **Loose ends**: 1-04's anchors by hand; a committed script for the synthetic alignment check; the missed-cut
   rate; `setpoints.json`'s rail height and post positions verified against a good solve; the clips still wanted
   (1-09, 2-13 — on the playlist, did not download; 2-02, 2-15, 2-22, 2-23 — unavailable there; a full uncut 1-01).
9. **Jack's open questions** (the spec's): the Tonys/Ham4Ham clips (a different stage — only relative positions
   transfer); who clicks; 5 vs 10 fps for the dance numbers (everything so far is 5).

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
