# Calibrating the shots — the brief for an agent (stage 3, RULING GA)

Jack, 2026-10-14: *"once you figure out the best way to do it have opus agents do the rest."* This is the best way
found, and it is what you do. One agent takes a few clips; each clip's work is independent.

## What you produce

`tools/vision/calib/<clip>.json` — a camera (K, R, t, position, look, fov) for every **wide** shot of the clip,
each with the named set points you read and their pixels, and an overlay you judged. Nothing else is committed
(the crops and overlays are cache). The downstream stage projects every body's feet through these cameras onto
the floor, so a wrong camera puts a whole shot's people in the wrong place: **a shot you cannot fit is left out,
not fudged** — write it in the JSON as `"skipped": "<why>"` under the shot id.

## The tools (run from the repo root, with the venv)

    P=tools/vision/.venv/Scripts/python
    $P -I tools/vision/run.py wide  <clip>                    # the shots to do (small bodies, several of them)
    $P -I tools/vision/run.py calib <clip> list                # the 47 named set points and how to find each
    $P -I tools/vision/run.py calib <clip> <shot> grid         # cache/<clip>/grid-s<shot>.jpg: the frame, 100 px grid (2x)
    $P -I tools/vision/run.py calib <clip> <shot> solve name=u,v name=u,v ...   # >= 5 points -> solve + overlay calib-s<shot>.jpg
    $P -I tools/vision/run.py calib <clip> <shot> zoom [name ...]               # 4x crops around every point's PREDICTED pixel
    $P -I tools/vision/run.py calib <clip> <shot> refine       # slide onto the image's edges (small help; optional)

Pixels are in the cache frame (1280x720). Read every image with the Read tool; the grid labels are frame pixels.

## The loop, per shot

1. `grid`. Look. Name what you can see with certainty: the deck's downstage edge (the lip) and where it meets
   the proscenium piers; the turntable rings on the deck (two concentric circles, radii 3.82 and 2.59 m about
   (0, 0.95)); the upstage gallery's front edge and rail (the long horizontal platform at 2.74 m with rope coils
   on its rail); the SL gallery (stage left = image RIGHT when the camera is in the house) and its rail; the SR
   balcony arm; the two stairs; the back-wall posts (five: x −3.67, −3.07, 0, 3.07, 3.67, at z −4.12).
   **Stage left is +x and appears on the RIGHT of a house camera's frame.**
2. Read off 6–10 points, spread in depth AND height (lip + gallery + a post crossing; never all on one line).
   Prefer corners and ends over anything mid-line. `solve`. Note the rms and each residual.
3. `zoom` for the points with residuals over 10 px and for 2–3 points you did NOT use. Each crop has a red
   cross at where the solve predicts the point and a 10 px grid: read the TRUE pixel of the feature (the crop's
   caption says what the feature is). If the feature is not in the crop, the solve is far off — recheck your
   identifications (most often a post mistaken for its neighbour, or SL/SR swapped).
4. `solve` again with the corrected and the added points. Repeat 3–4 once more if the rms is over 12 px.
5. Look at `calib-s<shot>.jpg`: the cyan wireframe (posts, gallery edges, rails, lip) and the orange rings must
   sit ON the image's timber and the deck. Judge: `good` (rms ≤ 8 px, the wire sits on the set), `fair`
   (≤ 15 px, the wire is on the right things but a little off), or `poor`. Write the verdict into the JSON
   (`"judged": "good"`), and for a `poor` shot leave it out (`"skipped"`).
6. Only an agent-read point set reaches ~8–15 px at best (the timber is dense at 720p). That is expected. Do
   not spend more than three solve rounds on a shot.

A shot whose camera MOVES (the wire fits the first frame and not the last) is `"moving": true` for now; solve
its middle frame and say so. A shot with fewer than five set points visible is `"skipped": "too tight"`.

## Known good start: Guns and Ships shot 16

Camera 45 m back in the house, 2 m up, 24° lens (a long lens from the rear). That is what a wide shot from the
house looks like; a wide shot from the SIDE boxes (the film has some) will be 15–25 m off to one side and 6–10 m
up. If your solve puts the camera on the stage or under it, the point identifications are wrong.

## What you do NOT do

- Do not edit `setpoints.json`, `calib.py` or `run.py`; if a named point seems wrong, say so in your report.
- Do not commit; the session that spawned you commits `tools/vision/calib/*.json`.
- Do not run `bodies` or `frames`; they are done (if `wide` says to run them, report and stop on that clip).

## Report back (short)

Per clip: the wide shots found, per shot the rms, the verdict, the camera position, and anything odd (a set
point that seems misplaced, a clip whose SL/SR look mirrored, a shot from a side box).
