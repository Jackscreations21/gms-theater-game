# Video blocking capture — design (2026-10-13)

**BINDING once built. Rulings FX–GE.** The next spec starts at **GF** (dance round 2, paused when this was written,
takes GF when it lands). **NOT BUILT.** Jack asked what was possible and then for the spec; nothing here is code yet.

## The brief, verbatim

> would it be possible for you to create something that does body recognition on those videos to detect every body
> in those videos I gave you the link to, so you can figure out where everyone should be and when, then use something
> to figure out where the camera angle would be

The videos: his playlist of the Disney+ film's clips, one per number
(https://youtube.com/playlist?list=PLSOfHhku9XxiQuGTppcAc4NPRkja13MSK), plus whatever else is found on YouTube
(the 2016 Tonys, Ham4Ham, Blankenbuehler's breakdowns). Three review rounds have mined these clips' *text*
(descriptions, comments); nobody here can watch them. This system watches them.

## What this is

A pipeline, run by Jack on his machine (or by an agent once the parts are installed), that turns stage footage into
**per-character stage positions over album time** — the same `(track, at, x, z)` the blocking file is made of — and
hands them to the blocking generators as a *reviewable diff*, never as an automatic overwrite. It also gives the
camera pose of every shot, so a frame can be re-projected onto the measured set. Dance comes later (GD): the first
version answers "who is where, when".

Everything derived (positions, camera poses, identities) is data and is committed. **The footage is not**: it stays
in a local folder Jack owns, outside the repo, git-ignored (`video/`), and no frame image is committed either.

## RULINGS

### FX — Scope, sources and what may enter the repo

- **Input** is video files Jack has downloaded himself (he has JDownloader for this; `yt-dlp` works too). The agent
  never downloads footage. Files live in `video/<track-id>-<slug>.mp4` at the repo root, git-ignored, one per clip;
  a `video/INDEX.json` (committed) records for each file: the YouTube URL, title, uploader, duration, resolution,
  frame rate, sha256, and which track(s) it covers. A clip may cover part of a track or several tracks.
- **Output committed:** `tools/vision/out/<track>.json` (positions and camera poses, GA/GB/GC formats), the
  calibration correspondences (`tools/vision/calib/<clip>.json`), the identity labels
  (`tools/vision/labels/<clip>.json`), and the diff files the review step produces. No images, no video, no
  per-frame detections (those are a cache, `tools/vision/cache/`, git-ignored — regenerable from the footage).
- **Licence:** the footage is Disney's/the uploaders'; using it to measure where people stood is analysis, and only
  measurements are kept. The spec says so in `assets/README.md`'s spirit: provenance of every derived file names the
  clip it came from.

### FY — The pipeline: five stages, each a file

Run as `python tools/vision/run.py <stage> <clip>` (stdlib for the glue; the heavy stages use the venv of GE).
Each stage reads the previous stage's file and writes its own, so any stage can be re-run alone.

1. **Frames and time** — decode at a reduced rate (5 fps default; 10 fps for dance numbers), align the clip's audio
   to the album (FZ), write `cache/<clip>/frames.json`: for every kept frame its clip time, the album track and
   seconds, and the shot id (a cut detector on frame difference; manual cut edits allowed in the file).
2. **Bodies** — a multi-person 2D pose model (YOLO-pose or RTMPose, CPU) on every kept frame: per person a bounding
   box, 17 COCO keypoints with confidences. A tracker (ByteTrack-style) links detections into **tracklets** within a
   shot (tracklets never cross a cut). Write `cache/<clip>/bodies.json`.
3. **Camera** — per shot, the camera pose and lens (GA). Write `calib/<clip>.json`.
4. **Floor positions** — project each tracklet's foot point (mean of the ankle keypoints when both are seen; the lower
   hip point minus a standard 0.85 m leg when not) through the shot's camera onto the stage floor (deck plane, or the
   gallery plane when the calibration says the person is on the upper level — GA says how). Write
   `out/<track>.json` positions: per tracklet, per frame, `(at, x, z, level, conf)`.
5. **Identities** — map tracklets to cast ids (GB), then merge all clips of a track into per-character tracks and
   write them into the same `out/<track>.json` under `characters`.

The result for a track is: for each cast id, a list of `(at, x, z, level, conf, clip, shot)` samples, with gaps where
no wide shot showed them.

### FZ — Time: the clip is slaved to the album

A clip's audio is decoded to the same 20 ms loudness envelope the page uses (`assets/hamilton-soundtrack-env.u8`'s
recipe: RMS per 20 ms, `255·(log10(rms)+4)/4`) and cross-correlated against the album's envelope for the track(s)
the clip covers, piecewise: the Disney+ film is a different performance from the album, so **tempo drifts**. The
alignment is a list of `(clipTime, albumTime)` anchor pairs every ~10 s (local correlation maxima, ±2 s window),
interpolated between; a pair whose correlation is weak is dropped and the gap bridged. The film's cut-to-cut
continuity is not assumed. Reported per clip: median residual, worst gap. Where a clip has no usable music (speech,
applause, a talk video), its time is set by hand in `frames.json` from a known cue moment.

### GA — Camera: one solve per shot, from the measured set

- The set geometry is known (`tools/hamilton-floor.json`, the glossary's measured points, the set model). A shot's
  camera is solved by **PnP** from correspondences between named set points and their pixel positions in one frame
  of the shot: the deck's downstage corners and lip ends, the two turntable rings (four points each on the visible
  arc), the upstage gallery's rail ends and posts, the SR/SL stair feet and tops, the proscenium posts, the balcony
  corners. **Minimum five** correspondences spread in depth; eight is the target.
- Correspondences are **clicked by a person** in a calibration tool: a new "Calibrate" mode in `blocking.html`'s
  Advanced view shows the frame (served from `cache/`), lists the named points, and lets Jack (or an agent through the
  page's console API) click each; the solve runs in the page (a small DLT + refinement in JS) and overlays the set's
  wireframe on the frame so the fit is judged by eye. The result is written to `calib/<clip>.json` through the
  existing download/paste route (the page cannot write files). An agent may do this by rendering the frame to its
  pane and clicking; the point names make it checkable.
- **Moving shots** (crane, zoom, dolly): calibrate the first and last frames; between them track the set's own
  features (the ring arcs, rail lines) with optical flow and re-solve every 0.5 s; a shot whose solve residual
  exceeds 2 px RMS is marked `moving: "failed"` and its positions get `conf ≤ 0.3`.
- **Lens:** the film's lenses are unknown; the solve estimates focal length with the pose (no distortion term in v1).
- **Upper level:** a person is on the gallery when their foot point, projected onto the deck plane, lands beyond the
  gallery's front rail in the image while the ankle pixel is above the rail line; then project onto the 2.743 m
  plane instead. Stairs: project onto the deck and flag `level: "stair"` for a human to place.
- A shot too tight to show two set points (close-ups) is **not calibrated** and yields no positions; its tracklets
  still get identities (GB) so a person is known to be on stage at that time, with `x, z` null.

### GB — Identity: tracklets become characters

- The pose model sees bodies, not people. A tracklet gets a cast id from, in order: (1) a human label in
  `labels/<clip>.json` (tracklet id → cast id, given once per shot; the calibration tool offers this on the same
  frame: click a body, pick a name); (2) continuity — a tracklet whose start is within 0.5 s and 0.6 m (on the floor)
  of a labelled tracklet's end in the previous shot inherits its label, with `conf × 0.8`; (3) appearance — a
  per-clip colour histogram of the torso box, matched to the labelled tracklets of the same clip (costumes are
  distinct for principals; the parchment-coloured ensemble match only among themselves); (4) the current blocking —
  as a last resort, the character the blocking puts nearest that floor point at that time, `conf 0.3`, flagged
  `fromBlocking` so it is never treated as evidence for the blocking.
- Ensemble bodies that cannot be told apart are merged into a **pool**: `ens?` with positions, so formations can be
  measured (count, shape) even when the individual is unknown; the apply step (GC) assigns pool positions to the
  nearest free ensemble ids.
- Every merged character track carries, per sample, which clip and shot it came from and the identity rule used.

### GC — Into the blocking: a diff a person reads, never an overwrite

- `python -I tools/vision/compare.py <track>` reads `out/<track>.json` and the committed blocking, and writes
  `tools/vision/diffs/<track>.md` + `.json`: per character, where the footage and the blocking disagree by more than
  0.75 m for more than 2 s (position), where the footage has them on stage and the blocking off (or the reverse),
  where the level differs, and the proposed waypoints (the footage's track simplified to ≤ one waypoint per 3 s by
  Douglas–Peucker at 0.3 m, snapped to the floor map, with `conf`). Each proposal names its evidence (clip, shot,
  frames, conf). Low-confidence proposals (< 0.5) are listed but marked "do not apply without a look".
- Applying is a generator edit, by a reviewer agent or Jack in the editor, exactly as the review rounds did; the
  diff file is the brief. `compare.py --apply <track> --min-conf 0.7` may write the proposals into a NEW generator
  section (`# VISION:`) for a human to accept, never into existing waypoints.
- The blocking's RULED items (the boundary carry-overs, the Cabinet Battle sides, Burr's balcony, the Non-Stop
  gallery, the duel sides) are listed in `compare.py` and reported as "footage disagrees with ruling" rather than
  proposed as changes.

### GD — Dance from skeletons: timing first, shapes later

- v1 uses the 2D skeletons only for **timing**: for each labelled character, the onset of large limb motion against
  the beat grid, written as `out/<track>.json` `motion` (per character, per bar, a motion energy and the arm/leg
  split), so a reviewer can see which bars a phrase occupies and place library moves on them. A matcher that compares
  the skeleton's arm-angle sequence to the library's moves (DTW over joint angles, per 8 counts) proposes a move name
  with a score; a score above 0.7 is proposed in the diff, below is listed.
- **Later (not this spec):** monocular 3D lifting of the skeletons into joint curves to author new moves directly
  from footage (a separate ruling when it is wanted; MotionBERT-class models run on CPU slowly).

### GE — Runtime, dependencies, and the page's independence

- The heavy stages run in a Python **venv Jack creates** (`python -m venv tools/vision/.venv`, git-ignored) with
  `numpy`, `opencv-python`, `torch` (CPU), and one pose package (`ultralytics` for YOLO-pose, or `rtmlib`); the exact
  pins in `tools/vision/requirements.txt`. The agent cannot install (TRAPS: installers fail from the sandbox); it
  writes the file and the one-line command, Jack runs it. Audio decoding uses `ffmpeg` (Jack installs; `imageio-ffmpeg`
  as the fallback). Everything stdlib-only in this repo stays stdlib-only; `tools/vision/` is the one place with
  third-party dependencies, and nothing in `midtown.html`, `blocking.html`, the merge tool or the plotter depends on
  it — they only read the committed `out/` and `diffs/` files.
- Budget on Jack's machine (Intel UHD, CPU inference): ~5 fps × ~150 min of clips ≈ 45k frames; YOLO-pose nano on
  CPU ≈ 6–10 fps → 1.5–2 h for the whole playlist, cached. A cloud run is allowed if he prefers.
- The calibration step is the human-time cost: ~30–60 shots per clip on the film, ~5 clicks each when the shot is
  wide; close-ups are skipped. Estimate: 2–4 hours of clicking for the whole show, or an agent doing it from
  rendered frames with Jack spot-checking the overlays.

## Plan (one concern per PR, after #234 lands)

1. `tools/vision/`: `run.py` stages 1–2 (frames, time alignment, bodies with cache) + `INDEX.json` + requirements;
   tested on one clip Jack supplies. 2. Stage 3: the Calibrate mode in `blocking.html` (Advanced), the in-page PnP,
   the overlay; `calib/` format. 3. Stages 4–5 + `compare.py` + the first diff on one number, reviewed by eye against
   the clip's comment evidence. 4. The whole playlist; the per-track diffs; a review round applies them. 5. GD timing.

## Open, Jack's

- Which clips beyond the playlist (the Tonys, Ham4Ham) are worth calibrating — they are different stages (the Tonys
  stage is not the Rodgers set; only relative positions transfer).
- Whether an agent may do the calibration clicking unsupervised, or he wants to click the first few numbers himself.
- 5 fps vs 10 fps for the dance numbers.
