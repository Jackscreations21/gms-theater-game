# THE HOUSE — handoff

A 3D theatre you work in. Two buildings, three stages, a lighting rig you can
plot, a counterweight fly rail you can haul, productions that load in, a crew
that carries them, and a VR mode for a Quest 3. One HTML file, ~875KB, three.js
r128, no build step beyond concatenating text files.

---

## 0. Layout

```
theater_game/
  the-house.html     the game — open this, or serve it (VR needs HTTPS)
  index.html         one-line redirect so the bare Pages URL lands in the game
  build.sh           rebuilds the-house.html from src/
  HANDOFF.md         this
  AUDIT.md           the 2026-08-06 code audit — findings, evidence, line numbers
  VR-SETUP.md        getting it onto a Quest 3 — routes, controls, first-run list
  README.md          the GitHub front page
  src/               the 30 parts it is built from (build.sh has the order)
  tests/             nineteen suites — npm install, then npm test
  assets/audio/      the show's three recordings — COMMITTED (docs/AUDIO.md)
  tools/             probes that draw pictures — see tools/README.md
```

`the-house.html` is committed built. You only need `build.sh` if you edit `src/`.

Git: the remote is `https://github.com/Jackscreations21/gms-theater-game`
(private as of 2026-08-06). Commits use the owner's GitHub no-reply address —
**keep it that way**; the repo may go public. `.gitattributes` pins LF because
`build.sh` breaks under CRLF.

**All work goes through pull requests** (owner's rule, 2026-08-06, so there
is a record): branch off `main`, commit there, push, open a PR with `gh`, and
let the owner review/merge. No direct commits to `main`. Everything up to
`6d635ce` predates the rule.

---

## 1. Build it

```sh
sh build.sh          # concatenates src/ into the-house.html and syntax-checks
```

**The order in `build.sh` is not alphabetical and must not be sorted.** It is a
dependency order, and a few positions are load-bearing:

| Part | What it is | Why it sits where it does |
|---|---|---|
| `p1` | HTML, CSS, all the DOM panels | must be first — opens `<script>` at the end |
| `p2` | dimensions `D`, `scene`, `camera`, `renderer`, materials `M`, textures `TX` | everything reads `D` |
| `p2b p2c p2e p2g p2h p2f` | auditorium, stage house, FOH, dock, doors, seats | |
| `p3` | fly system: `FLY`, `GOODS`, `TRIMS`, `drape()` | `p4` reads `FLY[n].z` when it builds the rig |
| `p4` | lighting: `FIXTURES`, light pool, beam shader, `stageToWorld` | after `p3` |
| `p5 p5e` | scenic stock, smoke | |
| `p6 p6b` | cue engine + console UI, the crew | |
| `p5c` | `SHOWS`/`SHOW`, scenes, rain/fire, helpers | after the crew (`crewForgetLoads`) |
| `p5d p5f p5g` | Lost Boys, Hamilton, The Play That Goes Wrong | `p5f`/`p5g` reuse `LB_CLOTH_W` from `p5d` |
| `p2j` | **the Arc Centre** (second venue) | after the shows, before the stages |
| `p2k` | **three stages, one board** | needs `ARC` and `buildRig`/`makeLineset` |
| `p2i` | room/portal culling — `buildRooms()` sorts `world.children` | **must be late**: it files whatever exists at that moment |
| `p7` | camera, movement, all UI wiring, the frame loop | |
| `p9` | **VR** | needs `frame`, `renderer`, `SHOWS`, `STAGES` |
| `pz` | `</script></body></html>` | **split out of `p7` on purpose** — anything appended after `p7` would land outside the script tag. It did, once. |

`p2d` is orphaned and unused. Leave it or delete it.

---

## 2. Test it

jsdom plus the **real** three.js with a stubbed `WebGLRenderer`. There is no
browser and no GPU in the loop, so it catches structure, geometry, state and
wiring, and cannot catch anything about how it looks or how fast it runs.

```sh
cd tests
npm install       # once — jsdom and three@0.128
npm test          # all nineteen suites, exits non-zero if any fail
node real.js      # boots the whole file, reports "fatal": null
node full14.js    # the building
node rooms.js     # portal culling
node holes.js     # no gaps in the shell you can see or walk through
node crew.js      # the stagehands
node smoke.js     # the machines
node show.js      # productions, cue stacks, the saved hang
node sets.js      # scene changes, the collapsing set, the revolves
node arc.js       # the Arc Centre
node stages.js    # three stages, one board
node legs.js      # goods, including the half legs
node warehouse.js # the warehouse sheds, their doors, the carts, the slots
node orders.js    # the supply screens, the pallet, rulings C/D/E
node build.js     # the build system: wood stock, the tabbed screen, caps
node vr.js        # WebXR: rig, sticks, desks, ropes, GO, bodies
```

All nineteen are at `--- failures: 0 ---`. Keep them there. Every suite exits
non-zero on failure (including a failure to boot), and `npm test` runs the lot.

`full14.js` wraps `window.MouseEvent` at the top of its harness: jsdom has no
pointer-lock support, so a stock jsdom `MouseEvent` silently drops
`movementX`/`movementY`, and the five fly-haul tests pull with undefined force
and fail in cascade. Any new test that synthesizes mouse movement needs the
same shim (or belongs in `full14.js`, which already has it).

`tools/` holds **probes**, which are not pass/fail but print pictures —
`audience.js`, `goes-wrong.js`, `arc-foyer.js`, `arc-studio.js`. They cast a
grid of rays and print what each one hits as ASCII, banded by distance. Between
them they found the Outsiders frame hidden behind a drop, the crossed rafters,
the bricked-up proscenium and the see-through seating.

**Write a probe when you cannot picture it.** Every single "it looks wrong"
report in this project was found in seconds once something drew it.

---

## 3. What is in it

**Two venues.** The Palace (a Broadway house: fly tower, dock, foyer) at the
origin, and the Arc Centre 420m out along +x — a glazed foyer with a bar and box
office, a Main House and a Studio Theatre. Only the venue you are standing in is
drawn; neither draws a single mesh from inside the other.

**Three stages, and one board.** `p2k`. There is one `FIXTURES`, one `FLY`, one
`CUES`, one `SHOW`, one `HOUSE` — and walking into a theatre **swaps their
contents** rather than threading a stage argument through two hundred functions.
Every existing function carries on working; it just describes a different room.
`STAGE` names the live one, `STAGES[key]` parks the others.

**Five productions.** THE OUTSIDERS, THE LOST BOYS, HAMILTON (two concentric
revolves that turn), THE PLAY THAT GOES WRONG (seven pieces that fall over under
their own weight and can be stood back up), and BEETLEJUICE (seven scenes that
take turns on the one stage, its cue times measured off a recording). All
interpretations in each show's vocabulary — no reproduction of anyone's
drawings; **RULING AO** restates that for the one taken off a video.

**A crew.** Six stagehands with a job queue who bring a set in through the dock
of whichever stage the board is patched to, hang the goods, and strike it again.

**VR** (`p9`). Quest 3, 90Hz target. Auto-detected — the desktop is untouched.
Smooth stick walking and smooth turning, five physical consoles (Palace balcony;
tech table and control room in each Arc house), ropes at the pin rail you grab
and haul, a GO button you reach out and press.

---

## 4. Invariants — break these and things go quietly wrong

**The deck is `y = 0`, on every stage.** Every set, every fly trim and every
fixture aim is written to it. The Arc's decks were built a metre up once and it
buried every production that loaded onto them.

**Every stage is the same box.** `AS` in `p2j` takes `procW`, `procH`, `stageW`,
`stageD`, `gridY` straight off the Palace's `D`. Both Arc houses are built by one
function called twice, and their rigs and fly systems are the *Palace's own
builders* run into a translated group. Change `D` and all three change.

**A fixture's `aim` is in WORLD space; a light plot is written in STAGE
coordinates.** `stageToWorld()` in `p4` converts. With one theatre these were the
same thing; with three, a plot aimed every lantern in the Arc back across town.

**Trims are the height of the PIPE.** Goods hang below it. Setting a trim to
where you want the bottom edge hangs the cloth through the floor.

**Upstage is −z. Downstage is +z. Stage right is −x.**

**Anything computed in world space needs a container at the world origin.** The
Arc's rooms sit at x = 420, so its floor-pool group, its crew root and its rope
holder all carry `position.x = -ARC.X` to cancel it back out.

---

## 5. Traps this codebase has actually fallen into

Listed because every one of them cost real time and none of them are obvious.

**three.js r128 instanced bounding spheres.** r128 sizes an `InstancedMesh`
bounding sphere from the base geometry, so a batch of 1,400 seats looks like one
seat at the origin and gets culled. Widening the sphere fixes the culling **and
breaks per-instance raycasts**, because r128 uses the same sphere per instance.
So: things you must stand on keep an honest local sphere and set
`frustumCulled = false`; decorative batches get the wide sphere and
`raycast = ()=>{}`.

**`visible` is only a drawing flag.** A raycast goes straight through it and hits
the geometry anyway. Scenery that is off is switched off with `layers.disableAll()`
as well.

**A flag used for two purposes will eventually mean the wrong one.**
`userData.moves` meant both "don't freeze this" and "crew keep off", which is why
the jungle-gym bars were never struck. Split into `userData.effect` plus a light
check.

**DOM cached on a per-stage object.** Each lineset cached its table row in
`ls.ui`. Rebuilding the table for another stage detached the old rows, and the
stage you came from went on updating a table nobody could see. The fly rail
"stopped working" from exactly this.

**Test through the DOM, not the model.** The bug above survived a test that
clicked `ls.ui.row` — a *detached* row still fires its handler perfectly well.
Go through `document.querySelectorAll`.

**`typeof` does not protect a `const` declared later in the same script.** It
throws instead of returning `'undefined'`. Function declarations hoist across the
whole concatenated file, so `updatePlayer` could reach the VR guard before `p9`
had run. `VR` is a `var` for this reason.

**Orientation sign errors, four separate times** (gable rafters, the dock ramp,
which side the dock was on, the street wall). `rotateX(-π/2)` maps shape-y to
world −z. `rotateY(π/2)` mirrors. A box's long axis is local Y.

**jsdom's `MouseEvent` has no `movementX`/`movementY` at all** — not 0,
undefined. The game guards it to 0, so synthetic hauling events do nothing and
the failure looks like broken game code. It isn't; shim the event (see §2).
Cost half a session before anyone checked what jsdom actually constructs.

**Measure the right thing.** Two tests passed while being wrong: a darkness
comparison that swept in the Palace's foyer chandeliers 30m away through a shut
door, and a floor probe that found the fly gallery instead of the stage. And "is
anything below zero" is a useless test of whether a set sits on the deck —
compare the *same* production across stages instead.

---

## NEXT SESSION: **HIS EYE ON THE DANCING AND THE SITS; HIS LABELS; THE CAMERAS' SECOND ROUND** (2026-10-14, third session)

Rulings at **GF** (GG next). `actors` = PR #234 at **`ec66e53`**; `cue-blackouts` = PR #233; both open, both Jack's to
merge. Read STATE.md's top block. Dance round 2 landed this session (below) and the re-key batch ran (`6e2580c`), so
the vision list in the block two below this one starts at its item 2.

1. **Watch it with him** (http://localhost:8093/midtown.html → Show → Play, or the editor's Dance button per song):
   83 new assignments and 46 sits are a reading of the reviewers' words, not a measurement. His notes go into the
   blocking checklist (https://claude.ai/artifact/4Q5Xh37ZmSinhtsJbVhAub; `ArtifactData` `list` on `songs` first) and
   then into `tools/blocking/dance.py` (one `dict(...)` per entry; `with_=` for a partner) or `props.py` — regenerate
   (`python -I tools/blocking/dance.py`, `props.py`), merge (`python -I tools/blocking-merge.py tools/blocking/segments`),
   `MIDTOWN.actors.check()` in the page. The two HELD seated actions (2-02's nodding, the King's jamming in 2-11) wait
   for a seated layer (FUTURE).
2. **His five rulings** (unchanged): 1-05 the sisters' order; 1-07 the two Kings men; 1-09/1-10 the side flip; 2-11 the
   King's stool; 2-22 the duel sides.
3. **His labels** in `blocking.html` → Advanced → Calibrate → Labels (VISION.md §7, item 1), then `ident`, `motion`,
   `compare` for those tracks — the first evidence the diffs can carry.
4. Then: the cameras' second round (VISION.md §7 item 2); the far-body LOD; the grid drift candidates; the older list.

## DONE — 2026-10-14 (third session): dance round 2 (RULING GF) by four Opus agents, and the re-key batch (PR #234, `6e2580c`, `6ce2d53`, `ec66e53`)

*"finish everything for the choreo and dancing … use opus agents to finish everything"* → the paused round rebuilt from
its WIP note by three agents on disjoint files (engine: `midtown.html` + the move export; tooling: the editor, the
merge, the plot, `props.py`, the grid, the format doc; assignments: `dance.py`), then a docs agent. **40 new moves**
(87 in the library): hand and arm gestures, head and body loops, four gait overlays on her own walk, `sit` (snaps to
the nearest seat's nearest point, the chair behind her on a tie, the seat height from the prop) and `comfort`, the
two-body `lift`, `catch` (the forward lean of It's Quiet Uptown), `partner-lift`, `sabre`. **Pairs:** `with` on the
lead's entry (the one doing the verb), the mate posed from it, an aligner that closes and faces them; the page's check
and the merge both validate it. **Hand props** end to end (page, editor, merge, plot, `props.py`; the two books
converted). **The grid:** My Shot's nine tempo changes and Guns and Ships' first beat, verified against the album's
onsets. **The assignments:** 177 → 260 entries, every review-3 stand-in swapped for the reviewers' gesture, 46 sits,
13 pairs, My Shot's phrases and all of 1-18 re-placed on beat 1. Merge 0/0, `props.py --check` 0, `dance.py --check`
1–8 all 0, `MIDTOWN.actors.check()` green, console clean. *"Do this task here: run steps 4–6 of the vision re-key
batch"* → run as one background script in three minutes: 54 shots re-solved on the 1280 bodies, floor/ident/motion
on 20 tracks, 20 diffs (evidence 0 everywhere — no labels yet); VISION.md §7 has the numbers. Nothing in `src/`;
suites not run (no Node on the PATH). Eight traps.

## SUPERSEDED (the batch ran; dance round 2 landed; the labels are item 3 above): **RUN STEPS 4–6 OF THE RE-KEY BATCH, COMMIT, THEN HIS LABELS; THE CAMERAS' SECOND ROUND** (2026-10-14, second session, stopped 15:38)

Rulings at **GE** (GF = dance round 2 when it lands). `actors` = PR #234 at **`0eea859`** + this record; `cue-blackouts` = PR #233,
both open, both Jack's to merge. Read STATE.md's top block, then this block's "How the system works" if you are new to
`tools/vision/`, then "What is left". The agents' notes file every agent must read is `tools/vision/AGENT-COMMON.md`;
the manual is `docs/guide/VISION.md` (§3 commands, §4 every stage, §7 the findings and the list).

### What is left, in order

1. **Steps 4–6 of the re-key batch** (STATE.md has the commands verbatim; one agent, ~15 min). Jack stopped the agent
   mid-step-4 at 15:38; four calib files (1-02, 1-03, 1-05, 1-06) are re-solved and uncommitted, the rest wait.
   `resolve all` (the body-height cue must read the 1280 bodies) → `floor` every calibrated clip → per track `ident`
   then `motion` → `compare.py --all` → commit `calib/`, `out/`, `diffs/`. The five `out/*.json` in the tree are STALE
   (old shot ids, 640 bodies) until this runs. Then write the numbers into §7 of VISION.md.
2. **Jack labels a few numbers** in `blocking.html` → Advanced → Calibrate → Labels (click a body, pick the cast id;
   "Download labels JSON" → save as `tools/vision/labels/<clip>.json`; `x` = not a performer, `ens?` = ensemble unknown).
   Until labels exist, every identity is the blocking's nearest character (`fromBlocking`, conf 0.3) or the `ens?`
   pool, every diff says "NO EVIDENCE", and the move matcher has nobody known to be dancing. Start with the numbers
   whose cameras are good and whose principals are few: 1-06 Farmer Refuted (two `good` solves), 1-15 Ten Duel
   Commandments, 1-16 Meet Me Inside, 2-05 The Room Where It Happens, 1-08 Right Hand Man (one camera, 11 shots).
   After labels: `ident`, `motion`, `compare` for those tracks; read `diffs/<track>.md`; `compare.py --apply
   --min-conf 0.7 --dry` to see what it would write into a `# VISION:` generator section.
3. **The cameras, round two.** 59 of ~190 wide shots are solved (54 after the merges). The agents skipped the rest for
   dark washes, bodies hiding the back wall, deck-level cameras, and merged shots — the last is fixed (1631 shots now)
   and the set points are better, so a re-check of the skipped shots by the same method (one careful frame per camera
   set-up, points carried to its siblings by homography; the rig lanterns as points in the dark wides) should win more.
   Brief per clip as before (`tools/vision/AGENT-CALIB.md`, now with the pit/centre/high camera families in VISION.md
   §7 instead of the wrong 45 m reference) and give each agent its own scratch subfolder.
4. **Jack's rulings and questions:** the five blocking rulings (1-05 sisters' order, 1-07 the two Kings men, 1-09/1-10
   the side flip, 2-11 the King's stool, 2-22 the duel sides — the shaded rows of the checklist); the Tonys/Ham4Ham
   clips (a different stage); 5 vs 10 fps for the dance numbers (the matcher cannot tell moves apart at 5); whether he
   clicks the first few numbers' points himself. Downloads only he does: a larger pose model (the nano misses the
   galleries even at 1280), the still-wanted clips (1-09, 2-13, 2-02, 2-15, 2-22, 2-23, a full 1-01).
5. **Dance round 2** (paused since 2026-10-13; `scratchpad/dance/WIP-round2.md` of the 2026-10-12 session): ~40 moves
   the video reviewers asked for and the beat-grid fixes for My Shot and 1-18; RULING GF.
6. **Loose:** `setpoints.json`'s open conflicts (`gal-sl-ds`, the SL stair's steepness, the rig height ±0.3 m);
   `aligncheck.py` is green; the 1-08 handheld dance close-up still over-splits (8 false cuts, harmless); a far-body LOD
   for the jointed actors; then the older list (rig placements from the cue photos, `edge`/`frost`, the 238 effects,
   the body, the headset).

### How the system works (`tools/vision/`, RULINGS FX–GE; the manual is VISION.md)

The footage (45 clips of the Disney+ film, one per number, 40 of 46 tracks) lives outside the repo at
`C:\Users\jackf\Videos\hamilton-clips\`; `video/` in the worktree is a directory junction to it (a fresh clone must
remake it, TRAPS). `video/INDEX.json` (committed) names each file, its sha256, duration, URL. The venv is
`tools/vision/.venv` (Python 3.13 — Jack's 3.15 has no torch wheel), `P=tools/vision/.venv/Scripts/python`, every
script run as `$P -I`. Everything derived is a file; every stage reads the previous stage's file and writes its own,
so any one can be re-run alone. The cache (`tools/vision/cache/<clip>/`, git-ignored, regenerable) holds the per-frame
work; `calib/`, `out/`, `diffs/`, `labels/` are committed.

- **Stage 1 `frames`** (`run.py`): ffmpeg decodes 5 fps 720p JPEGs; the clip's audio becomes the page's own 20 ms
  loudness envelope and is matched piecewise (10 s windows) against the album's envelope for the track(s) the clip
  covers — a global find needs two agreeing windows, a chain moves ±2 s a step; wrong-beat anchors are dropped against
  their neighbours, each anchor is refined at the local tempo, and a tempo prior (×0.94–1.06) retries when nothing
  aligns (1-04 needed ×1.06; its hand anchors in `cache/1-04…/anchors.json` are force-added). Cuts: gray diff + hue
  histogram, now with a tiled normalised-NCC structure test (`tq` < 0.4 = the picture's structure changed; ≥ 0.5 = a
  lighting change, not a cut; a flash must persist 2 frames). `recut <clip>` re-detects cuts from the cached frames
  without decoding or re-aligning and writes `shotmap.json` (old → new shot ids); `recut.py remap all --write` re-keys
  the calib files by each entry's `frame`. Output `frames.json`: per frame `t`, `track`, `at`, `tconf`, `shot`.
  `aligncheck.py` is the synthetic check (0.15 s tolerance, exits 0).
- **Stage 2 `bodies`**: YOLO26n-pose (`yolo26n-pose.pt`, auto-downloaded) + ByteTrack, the tracker reset at every cut,
  `--imgsz 1280` now (2–3× the bodies in wide shots, ~14 fps on Jack's CPU, ~45 min for the playlist). Output
  `bodies.json`: per frame boxes + 17 COCO keypoints, tracklets `s<shot>-t<n>`.
- **Stage 3 `calib`** (`calib.py`, `setpoints.json`): 52 named set points in `assets/hamilton-set.glb`'s frame (metres,
  deck y 0.045, galleries 2.743, upstage −z, stage left +x = image RIGHT from the house) with `see` hints and a wire
  for the overlay; `stair-sr-*` flagged `movable` (the unit stands differently by number), the six rig lanterns `approx`.
  A shot's camera: ≥ 5 named points read off the frame (`grid` → `solve` → `zoom` → re-solve; or clicked in the page),
  PnP at every lens 12–100° free AND bounded (the camera in the house or at the lip, off the turntables, under 60 m),
  the winner by the **body-height cue** — the shot's bodies' implied shoulder height through the candidate camera vs
  1.40 m, because a point set in one plane lets lens and distance trade off freely and a low rms from 5–7 points
  proves nothing — else the nearest known camera family (`HOUSE_CAMERAS`: centre stalls (0, 2.1, 18) 33°; high close
  (0, 4.5, 14.5) 52°; pit (0, 0.3, 9) 88°; front row; SR lip), else least rms; `degenerate` when the rms is flat over
  30° of lens; `mPerPx` and `cond` say how fragile the depth is. `resolve all` re-solves every stored point set;
  `census --loo` gives per-point signed residuals (how `setpoints.json` was corrected). Output `calib/<clip>.json`:
  per shot `frame`, `points`, `solve{K,R,t,rvec,camera,look,fovDeg,rms,residuals,frameSize,choice,…}`, `judged`
  good/fair, `moving`, `skipped: why`, `note`. **The Calibrate mode** in `blocking.html` (Advanced) does the same
  in the page: the frame with a 4× loupe, the point list, an in-page PnP identical to `calib.py` (all 59 solves
  reproduced), the wire overlay, body boxes to label, downloads of `calib-<clip>.json` and `labels-<clip>.json`,
  `window.CALIB` for an agent.
- **Stage 4 `floor`** (`floor.py`): each body's foot pixel (ankle mean, else hip + 0.85 m of leg scaled by box
  height) back-projected through the shot's camera onto the deck plane, or the 2.743 plane where the floor map
  (`tools/hamilton-floor.json`) has gallery floor and the foot is above the gallery's front edge in the image, or a
  stair tread; `offMap` when it lands off the set. Only `good`/`fair` shots (weights 1 / 0.6, `moving` 0.3). Output
  `out/<track>.json` `clips.<clip>.positions.<tid> = [[at, x, z, level, conf], …]` with `mPerPx` per shot;
  `floor-check <clip> <shot>` draws the dots on the plan.
- **Stage 5 `ident`** (`ident.py`): a tracklet's identity by (1) a human label `labels/<clip>.json`, (2) continuity
  across a cut (0.5 s, 0.6 m, ×0.8), (3) torso-colour HSV histogram vs the clip's labelled tracklets (≥ 0.80
  Bhattacharyya, ensemble only among ensemble), (4) the committed blocking's nearest on-stage character within 1.5 m,
  conf 0.3, `fromBlocking` — never evidence; else the `ens?` pool. Writes `identities` and `characters` (per cast id,
  samples with clip/shot/tid/rule) into the out file.
- **GD `motion`** (`motion.py`): per identified tracklet the 2D joint angles → motion energy per bar on the beat grid
  (`assets/hamilton-beats.json`), arms/legs split, a company total (`motion`); a DTW matcher of the arm/leg angle
  sequences against the 46 library moves exported from `midtown.html`'s `DANCE` (`motion/moves.json`, re-export with
  `motion/moves2d.js` if the move code changes) → `proposals` with a score vs standing still (nothing reaches 0.7 at
  5 fps on 2–4 s shots). Order per track: floor → ident → motion (floor rebuilds the file and drops the later keys).
- **GC `compare.py`**: `out/<track>.json` vs `assets/hamilton-blocking.json` → `diffs/<track>.md` + `.json`:
  disagreements > 0.75 m for > 2 s, on/off-stage, level; proposals by Douglas–Peucker (0.3 m, ≤ 1 per 3 s) snapped to
  the floor map, conf < 0.5 flagged; the RULED items (boundary carry-overs, the Cabinet Battle sides, Burr's balcony,
  the Non-Stop gallery, the duel sides — cited to where each lives) reported as "footage disagrees with ruling", never
  proposed; `fromBlocking` samples counted as "seen, placed by blocking", never evidence; the `ens?` pool as
  formations per 3 s. `--apply --min-conf 0.7 [--dry]` writes qualifying proposals into a new `# VISION:` section of
  the right generator under `tools/blocking/`, never into an existing waypoint; the merge accepts it (tested).

### Traps of this round (all in TRAPS.md)

A low rms from points in one plane proves nothing; the brief's reference camera was a wrong solve; "a camera on the
stage means wrong points" is false for a film (pit and SR-lip cameras are real); re-aligning stage 1 stales stages 4–5
silently; agents sharing one scratchpad overwrote each other's helpers; the stair units move between numbers.

## DONE — 2026-10-14 (second session, 09:00–15:38): the video capture finished end to end by twenty agents; the cameras half won (PR #234, `62f7ddf`…`0eea859`)

*"finish everything using agents"* → nine calibration agents (one per 4–6 clips) read set points off gridded frames
and solved ~190 wide shots: 59 kept, the rest `skipped` with the reason (dark washes, bodies hiding the back wall,
deck-level cameras, merged shots); every "known" was overturned — the 45 m / 24° reference was misidentified posts
(Guns and Ships s16 is a pit camera at deck height, 98°), the real families are a centre-stalls camera (0, 2–2.6,
14–19) 32–45°, a high close one, a pit one, on-stage ones in We Know. Builders landed stage 4 (`floor.py`), stage 5
(`ident.py`), the Calibrate clicking mode in `blocking.html` (its JS PnP = `calib.py` to 1e-7), the stage 1 loose
ends (the "≤ 0.1 s" claim did not reproduce — 0.15 s is honest; 1-04 anchored by hand and chroma, then by the new
tempo prior on its own; the missed-cut rate measured at 15–20 %), the stage 1 fixes (wrong-beat drop, refine, tempo
prior; 620 → 613 anchors, no shot id changed). A solver agent rewrote the solve with the physical prior and the
body-height depth cue, `resolve` and `census`; the census corrected `setpoints.json` (SL stair top 0.2 m toward
centre, the SR rail ends 0.15 m stage-left, the SR balcony to the GLB's edge, `stair-sr-*` movable, six rig lanterns
added; median rms 10.6 → 8.2 px). The missed cuts: a tiled structure test found 60 of 62 the agents had noted and
removed 71 lighting splits (1371 → 1631 shots), `recut`/shotmap/`remap` re-keyed the 43 calib files (66 splits, 7
merges). GC `compare.py` and GD `motion.py` built (diffs for 20 tracks say NO EVIDENCE — no labels; the placed dance
bars run 2× the rest in energy; the matcher proposes nothing at 5 fps). The UI solver carries the prior. The pose
re-run at 1280 over all 45 clips: 120,092 → 137,362 bodies. Jack paused at 11 (record written), unpaused, paused at
14:55, resumed the batch, stopped it at 15:38 mid-step-4 — steps 4–6 are item 1 above. The blocking checklist
artifact got a "What is left" board. Twelve commits; nothing in `src/`; suites unaffected (not run).

## NEXT SESSION: **STAGE 2 ON ONE CLIP (WHEN THE 3.13 VENV EXISTS); DANCE ROUND 2; HIS RULINGS** (2026-10-14)

Rulings at **GE** (GF next — reserved for dance round 2). `actors` = PR #234. Read STATE.md's newest block, then
**`docs/guide/VISION.md`** (the whole video-capture system: how it works, the agents' plan in full, what is left — Jack
asked for it as the detailed handoff), then the memory files `video-capture-status-2026-10-14.md` and
`hamilton-blocking-status-2026-10-13.md`.

1. **Spawn the Opus agents on the calibration** — Jack's word (*"once you figure out the best way to do it have
   opus agents do the rest"*), PAUSED before spawning on his *"get everything to a point where it can pause"*.
   The brief is `tools/vision/AGENT-CALIB.md` (the loop: `wide` → `grid` → read 6–10 points → `solve` → `zoom`
   the bad ones → `solve` → judge the overlay → the JSON). First make sure every clip has `bodies.json` (the
   batch was at 27 of 44 when paused; re-run the same loop — it skips the done ones:
   `for f in video/*.mp4; do c=$(basename "$f" .mp4); [ -f tools/vision/cache/$c/bodies.json ] || $P -I tools/vision/run.py bodies $c; done`).
   Then one agent per 4–5 clips, `model: opus`, the brief's path and its clips in the prompt, in parallel; commit
   `tools/vision/calib/*.json` as they come back. Expect 8–15 px per shot; the Calibrate clicking mode in
   `blocking.html` (RULING GA's UI, not built) is the way to tighten later if the floor positions need it.
2. **Stage 2's output, looked at**: `run.py draw <clip>` per clip, the tracklet counts, any shot where it found
   nobody.
3. **1-04's anchors by hand** (`cache/1-04-the-story-of-tonight/anchors.json`, `[[clipTime, "1-04:at"], ...]`) —
   Jack scrubs the clip for two moments, or the page's cue list gives them.
4. **Resume dance round 2** from the WIP note (session scratch `scratchpad/dance/WIP-round2.md`, the 2026-10-12
   session): the ~40 moves from the reviewers' `## Review 3` descriptions, the stand-in swaps in
   `tools/blocking/dance.py`, the beat-grid fixes (My Shot, 1-18). RULING GF.
5. **His rulings** (the checklist's "Your call" bullets): read the `songs` collection first; apply what he marked.
6. Post-merge protocol when #234 lands (it carries #233): fast-forward `main`, delete `actors`, `cue-blackouts` and
   the five older landed branches both sides; suites when Node is on the PATH.

## SUPERSEDED (the footage came; stages 1–2 are built): **RESUME DANCE ROUND 2; HIS FIVE RULINGS; THEN THE VIDEO CAPTURE** (2026-10-13, end of day)

Rulings at **GE** (GF next — reserved for dance round 2). `actors` = PR #234 at `ec5ea08` + the record. Read
STATE.md's newest block, then the memory file `hamilton-blocking-status-2026-10-13.md` in Claude's project memory.

1. **Resume dance round 2** from the WIP note (session scratch `scratchpad/dance/WIP-round2.md`): the ~40 moves
   from the reviewers' `## Review 3` descriptions, the stand-in swaps in `tools/blocking/dance.py`, the beat-grid
   fixes (My Shot, 1-18). Develop on a scratch copy, apply to the worktree, verify (`actors.check`), commit on
   `actors`, push. RULING GF.
2. **His rulings** (the checklist's "Your call" bullets): read the `songs` collection first; apply what he marked.
3. **The video capture** — build only when he has downloaded the clips into `video/` and created the venv; PR 1 of
   the spec's plan (stages 1–2 on one clip).
4. Optional, his call: the far-body LOD for the jointed bodies (~+30 ms a frame at the busiest moment).
5. Post-merge protocol when #234 lands (it carries #233): fast-forward `main`, delete `actors`, `cue-blackouts` and
   the five older landed branches both sides; suites when Node is on the PATH.

## DONE — 2026-10-14: the footage in (45 clips, 40 tracks), stages 1–2 built and run, the 3.13 venv (PR #234, RULINGS FX–FZ built, GE)

*"i am getting the videos right now"* → `tools/vision/run.py` (index / frames / sheet / bodies / draw / check),
`tools/vision/requirements.txt`, `video/README.md` + `video/INDEX.json` (the playlist read from YouTube: 36 clips
with ids and the file name each takes; 10 unavailable; his second folder's 11 placed by title, parts as `-pN`),
the ignore rules, a `tools/README.md` section, six TRAPS. `video/` is a junction to
`C:\Users\jackf\Videos\hamilton-clips` (OneDrive). Stage 1 on all 45 clips: 43 aligned (the envelope matcher,
10 s windows, a global find must agree with its neighbour and walk back; the synthetic check is ten tracks at ±3 %
tempo to ≤ 0.1 s and no false anchor from any other track), 1-04 not, 1-01 a montage. Cuts checked by eye on two
clips. Jack ran `py install 3.13`; the venv was made and filled here. **Stage 2 ran on Schuyler Defeated: 316
frames in 22 s (17.6 fps on his CPU — faster than the spec's 6–10), 1,183 bodies, 71 tracklets, 3.7 bodies a frame
(max 9), every body in nine shots boxed and skeletoned right by eye (`draw`), the dark upstage ensemble included.**
Then the lot in the background: all 45 clips, 120,092 bodies, done by the end of the day. **Stage 3 built** (`calib.py`, `setpoints.json`: 47 named set
points off the editor's plan and the GLB's posts; a focal grid-search + PnP, an overlay, per-point zoom crops, an
edge refinement, `wide`) and proven on Guns and Ships shot 16 — a long lens 45 m back; agent-read points give
~25 px, so the Opus agents' brief (`tools/vision/AGENT-CALIB.md`) expects 8–15 px and the clicking UI stays the
way to tighten. Paused before spawning on Jack's word. Nothing in `src/`; suites not run.

## SUPERSEDED (all of it landed or was absorbed into PR #234): **LAND #233; THEN HIS RE-CHECK THROUGH THE CHECKLIST** (2026-10-12, end of day)

Rulings at **FE** (FF next). `main` is **`5d24188`** (#230, #231, #232 merged: the show and the fixture GLBs are on
Pages). **PR #233 (`cue-blackouts`, 13 commits) is open** — the whole day: revisions 3, 4 and 5 of the cues, the
readout, the sound-synced skip, the interval fix. Read STATE.md's newest block.

1. **When #233 merges:** fast-forward local `main`; delete `cue-blackouts` and the five landed branches both sides
   (`midtown-walk`, `midtown-walls`, `midtown-lights`, `record-230`, `fixture-glbs`); suites when Node is on the PATH.
2. **His notes come through the checklist** (https://claude.ai/artifact/FpiGBBW8LicWbaRb1nTUjg): `ArtifactData` `list`
   on `songs` first thing. Nine songs carry notes answered once (act 1: My Shot, Farmer Refuted, Ten Duel Commandments,
   Guns and Ships, Non-Stop; act 2: Cabinet Battle #1, Cabinet Battle #2, Washington on Your Side, Who Lives) — his
   re-check decides. The method, before changing a single `at`: (a) the clock — it is the sound tap's business now, so
   a timing note means the cue, but check `MIDTOWN.show.sound` says "sound synced" when he watched; (b) `CAP.dark(track,
   0, len)` for a track he names (install `CAP` from the session scratch `capture.js` after `midtown.html?cap=N`;
   `shotrecv.py` on 8099 takes the sheets); (c) `CAP.sheet([...])` of the suspect seconds, look, edit
   `assets/hamilton-show.json` with a script that folds the state (`ham/edit3.py`–`edit6.py` are the models: `lift`,
   `remove_cross`, per-channel merge, mirrored focus), re-render, `show.check()`.
3. Then the older list: the rig placements the photos exposed (FUTURE.md), `edge`/`frost`, the 238 effects, the body,
   the headset.

## DONE — 2026-10-13 (end of day): the video-capture spec; dance round 2 paused (PR #234, RULINGS FX–GE specced)

*"would it be possible … body recognition on those videos … where everyone should be and when … where the camera
angle would be"* → the design in `docs/superpowers/specs/2026-10-13-video-blocking-capture-design.md`: five stages,
per-shot PnP from clicked set points, identities by label/continuity/appearance, a diff a person reads, dance timing
only in v1. Not built. The dance agent's round 2 (the ~40 reviewer-requested moves, the beat-grid fixes) was paused on
Jack's word with a WIP note in scratch and nothing in the worktree. The checklist is at v5. Suites not run.

## DONE — 2026-10-13: review 3 merged — the video evidence, the dance assignments (PR #234, RULING FW)

- Eight reviewers' generators, `props.py` / `dance.py` sections and research notes were merged. Totals: waypoints
  6,596 → 7,153, moves 322 → 859, props 62 → 72. The merge has 0 errors and 0 warnings; `props.py --check` gives 0.
- RULING FW: the seven at 2-16's count carry over into 2-17; a hand prop is legal; `props.py --check` uses the whole
  kinds table.
- Checks pass: the actors with props, limbs and moves; the show's seek equivalence; the lead-in; the console.
- The bodies cost 14–31 ms a frame at the busiest dance moments.
- 15 renders and a contact sheet are in scratch `act/shots/review3/`.
- The cue items and Jack's open questions are in the cue notes; the not-built items are in FUTURE.md.

## DONE — 2026-10-13: the dancing — a beat grid, 47 moves, the show's own choreography, the Dance button (PR #234, RULING FV)

- `tools/beats.html` → `assets/hamilton-beats.json`; `midtown.html` `DANCE` (→ `tools/hamilton-moves.json`, described with
  sources in `docs/hamilton-dance-moves.md`); actors' `moves` (format doc), `tools/blocking/dance.py` → the merge → the file;
  the editor's Dance button; two-person carries and `model` in the editor. Next: Jack watches the numbers with the music
  and moves the moves (the Dance button), the beat grid's tempo changes by ear, props for Yorktown's and Hurricane's
  furniture so the lifts lift something.

## DONE — 2026-10-12: his first full watch — the blackouts, the checklist, the readout, the skip (twice), his act-1 and act-2 notes (PR #233)

*"Ther shouldnt be a blackout at the end of alexander hamilton … a random blackout in the middle of my shot … the timing
seams to get off somewhere majorly"* → the clock checked and found right, a luminance scanner in the page measuring every
half-second: the reviewers' one-pool pull-ins and the cut-off blackouts at every song change were what he saw. Revision
3: four blackouts gone (cross-fades), nine pull-ins lifted, Farmer Refuted one palette, Yorktown's last chord kept.
*"make a checklist of every song"* → a db-backed artifact, one row per track, Good / Need work + notes. *"add something on
the side of my screen that says what song it is and how many seconds in"* → `#sh-hud`. *"when I skip it misaligns … the
audio timing"* → his VBR soundtrack mis-seeks by up to 52 s in Chrome, measured by matching the element's real output
against the file's loudness; a per-cell table fixed the first pass; *"going forward works but doesn't go back"* → the
browser's seek is history-dependent, so the clock now follows the sound itself: the element tapped through Web Audio and
matched against a stored envelope (new asset) after every seek and every half-minute. The interval bug he found (act 2's
first cue at the hold) fixed. His act-1 notes (18 good, 5 notes) → revision 4; his act-2 notes (4) and two more words on
Guns and Ships → revision 5 (the balcony lit from the 1st Electric at a person's height, the upstage row sweeping out
over the house in 0.6 s). 891 cues, 123 real; show.check() green after every step; everything rendered; nothing in
`src/`. Six traps.

## SUPERSEDED (the show reached him; his notes are the round above): **THE FIXTURE GLBs ONTO PAGES, THEN HIS EYE ON THE SHOW WITH THE MUSIC PLAYING** (2026-10-12, evening)

Rulings at **FE** (FF next). `main` is **`8961616`**: #229 and #230 merged by Jack — the house at 1:1, the lobby, bake 3,
the rig trimmed, the lighting engine, the show, the calibration, all on `main`. Read STATE.md's newest block.

1. **Finish the post-merge protocol:** delete `midtown-walk`, `midtown-walls`, `midtown-lights` local and remote (the
   sandbox refused the delete this session); run the suites once Node is on the PATH (`winget install OpenJS.NodeJS.LTS`,
   Jack runs it) — expect the one red (the untracked GLBs) until step 2.
2. **The rig on Pages needs the fixture GLBs committed** (38 files, 5.8 MB; `assets/fixtures/README.md` has the licences).
   Jack said "don't commit the files yet" on 2026-10-11; ask again now that the show is on `main` — without them the
   Pages copy has no lights.
3. **Watch it with him, music on** (below). His notes go into the segment files in the session scratch or straight into
   `assets/hamilton-show.json`.
4. Rule the rig placements (FUTURE.md), then the older list.
5. **The automatic actors (branch `actors`, RULINGS FF–FV, the next spec starts at FW):** PR #234 is open beside #233 —
   the whole show is blocked. Play it with him (Show → Play), and give him `blocking.html` for corrections: its change
   file says what to change, and a correction goes into the segment's generator in `tools/blocking/`, then the merge. Put `docs/hamilton-blocking-cue-notes.md` in front of him:
   his two rulings (1-05 sisters, 2-22 duel sides) and the cue fixes. Ask the mannequin's licence/origin.

## DONE — 2026-10-13 (latest): `cue-blackouts` (#233) merged into `actors` — the sound tap in the 3D page (PR #234)

- A merge commit on `actors`; PR #234 now carries #233.
- The conflicts were resolved by keeping both sides: `midtown.html`'s clock edges (FQ) with the sound tap, `STATE.md`
  and `TRAPS.md`. `hamilton-show.json` is #233's.
- `assets/hamilton-pools.json` was re-dumped from the merged page and regenerated. The cue notes say what #233 settled.
- Skip forward 20 min, back 10, and across the interval both ways: each landing error was reported, moved, and ended
  "sound synced" in `MIDTOWN.show.sound` and the HUD.
- Then FIXED: a back skip resumed about its landing error away from the asked time. The check kept the first request's
  relation, so the second check undid the correction. Each corrective seek now re-arms the check, and the check judges
  POSITION. Six skips, the back ones into played stretches, resume within 0.15 s. The stale "moving it" note at a tail
  is cleared too.

## DONE — 2026-10-13: notes2 — two carry it, a better carry, prop models, the roll call on the gallery (PR #234, RULING FU)

- RULING FU covers the page, the plotter, the merge, `props.py` and the format doc. `blocking.html` still has to learn
  a pair carry and `model`.
- `tools/props-models.py` builds the picnic table and the street lamp (`assets/props/`).
- 1-01: the clerk's table is carried by two; the roll-call singers are on the gallery and Burr is at centre; the centre
  third never holds more than 8.
- 1-02: the lamp is struck just before Q86; the table goes upstage right, carried by two.
- 1-03: the table is struck by two at Q119.
- `seg1/lib.py` gained `pair_carry`. Its `turn()` now keeps the level, so a turn on the gallery stays up there (TRAPS).
- Checks pass; renders are in scratch `act/shots/notes2/`; the cue asks are in `docs/hamilton-blocking-cue-notes.md`.

## DONE — 2026-10-13 (review 2 merged): the ensemble cut back, the furniture carried, props glide (PR #234, RULING FT)

- Jack's verdict, *"the ensemble is used far too much and much of the choreography is wrong"*, was applied by eight
  reviewers in the generators and in `props.py`'s sections.
- Merged: 9,410 → 6,491 waypoints, 28 → 62 props, ensemble on-stage time −36 %; 0 errors and 0 warnings.
- New ruling FT: placed props glide (the page, the editor, the plotter); the 2-17 table rides the ring on a few points.
- Dolly and Martha are allowed and used.
- Checks pass (actors with props and limbs, show seek-equivalence, labels); renders are in scratch `act/shots/review2/`.
- The new cue items and questions are in `docs/hamilton-blocking-cue-notes.md`.
- Next: Jack's questions; merging the limbs' parts per body for frame time.

## DONE — 2026-10-13 (latest): the limbs — a jointed mannequin that walks, idles, turns and carries (PR #234, RULING FS)

- `tools/mannequin-rig.py` → `assets/mannequin-woman-rig.glb` (fifteen parts, joints measured from the mesh, a liner under
  the cuts); `midtown.html`'s `rigAnimate` through FL's hook, a pure function of the pose; `check()` compares the limbs.
  `?rig=0` keeps the whole mannequin. Next: gestures per keyframe (FUTURE.md), when Jack's choreography asks for them.

## DONE — 2026-10-13: Simple mode — selection, delete a track in a song or from now on, delete a keyframe (PR #234)

- The recording file's `deletions` and how to apply them: the format doc.

## DONE — 2026-10-12 (latest, round 3): the editor's Simple mode — record by dragging dots with the music, furniture carries (PR #234)

- `blocking.html` defaults to Simple (dots, squares, Space, drag = keyframe now, carry ▾); Advanced unchanged behind a toggle.
- The recording file and how to apply it: `docs/hamilton-blocking-format.md` ("Simple mode: recording, and the recording file").
- Next: Jack records; a session applies his recording to the generators.

## DONE — 2026-10-12 (latest, round 2): the editor's music checked on 8093, Clear / Restore a song, the level button, a clean plan (PR #234)

- The music plays on Jack's own URL (the soundtrack was missing from the worktree); lead-in, loading and refusal states shown.
- Clear this song (with offstage holds so nobody is left frozen) / Restore this song; `clear-track` in the change file.
- Lower · deck / Upper · gallery where the floor has both; the change file names the level.
- The plan redrawn as an architect's plan; the key in the panel.
- The YouTube `showState` guard; `actors.check` off the waypoint instants; carriers for the two unattended props.

## DONE — 2026-10-12 (latest): the blocking editor, the clock's lead-ins and tails, props (PR #234, RULINGS FP–FR)

Jack's asks: a separate page to see and alter every path with the music, a blackout indicator, a top view with every part
named, and a file that says what to change (FP); 10 s before each act and after Act One, an open end after Act Two (FQ);
props the company carries on (FR).

What was done:
- `blocking.html` (FP): the editor; its change file is documented in `docs/hamilton-blocking-format.md`.
- `midtown.html`: the lead-ins and tails in the show player (FQ); props drawn, posed, carried and checked (FR).
- `tools/blocking-merge.py`: `track_table` / `at_ok` (FQ), `merge_props` (FR); `tools/blocking-plot.py` on the FQ clock.
- `assets/hamilton-pools.json` + `tools/blocking-pools.py`: the person lights for the editor.
- `tools/blocking/props.py`: the 28-prop seed, merged into `assets/hamilton-blocking.json`.
- Checked in the browser (editor = page poses at 360 moments; blackouts = the page's dump on 892 cues; round trip byte for
  byte; `show.check` and `actors.check` pass across the edges).

Next:
- Jack edits in `blocking.html` and hands back `hamilton-blocking-changes-<date>.json`: apply it to the generators (the
  format doc's "Applying it").
- His eye on the props seed.

## DONE — 2026-10-12 (late night): the whole of Hamilton blocked, merged and checked (PR #234, RULING FO)

Jack's three asks:
- *"put the choreography for every character in hamilton"*
- *"run agents to check each section using reference pictures, documents, and videos"*
- *"make sure that spotlights are on their actor"*

What was done:
- Eight segment writers, eight reviewers, eight spotlight checkers, then the merge.
- `assets/hamilton-blocking.json`: 9,410 waypoints, 20 bodies, all 46 tracks.
- The generators and research are in `tools/blocking/`; re-run, they reproduce the file byte for byte.
- In the page: `actors.check` passes (after its speed test stopped counting unseen offstage moves); show seek-equivalence
  passes; the doubling labels are right; twelve proof renders are in scratch.
- `docs/hamilton-blocking-cue-notes.md`: the cue fixes the light needs, and two questions for Jack.

Next:
- His eye on it with the music.
- His two rulings.
- The cue fixes (some may already be on #233).

## DONE — 2026-10-12 (night): names over their heads, the company of twenty, the merge tool and the writers' brief (PR #234, FN)

*"put the choreography for every character in hamilton … put a thing over their head with what character they are"* → head
labels (constant screen size, per-waypoint `label` from that waypoint on, part of the pose and of `check()`, which now seeks
first from far away); `tools/hamilton-cast.json` (20 bodies, the doublings fixed); `tools/hamilton-floor.json` (the floor
measured every 0.2 m); `tools/blocking-merge.py` (validate and merge eight segment files); `assets/hamilton-blocking.json`
reset to the cast with no waypoints; the brief for eight writers in the session scratch (`act/brief/`). Next on the branch:
their eight segments, merged.

## DONE — 2026-10-12 (evening): automatic actors — the mannequin, paths on the show clock, the Blocking panel (branch `actors`, PR #234, FF–FM)

*"make a system for automatic actors. Make a software where you can create their paths and stuff. Right now just make
them using this mannequin but later we will add arm and feet movement."* → `tools/mannequin-glb.py` turns his STL into
`assets/mannequin-woman.glb` (18,096 triangles, 1.65 m, feet at 0, facing +Z); `midtown.html` gains actors (a group
with a `body`, under the set's root, set-local metres) walking waypoints on the show clock — a pure function of show
time (centripetal Catmull–Rom, eased stops, facing turns, auto dwell at 1.3 m/s, an offstage flag, the floor by ray so
she climbs onto the gallery), lit by the show (pool bands widened round a body); the Blocking panel (the show clock,
actors, Click to place at the current time, drag a disc, a waypoint form, Download / Load… / Copy, a browser draft);
`assets/hamilton-blocking.json` (a demonstration through 1-01; format `docs/hamilton-blocking-format.md`); the spec
`docs/superpowers/specs/2026-10-12-automatic-actors-design.md`. Checks: `MIDTOWN.actors.check()` seek = play
(negative-checked twice), `show.check()` seek-equivalence and `lx.check()` 301/313 unchanged, drop / drag / round trip
by real clicks. Nothing in `src/`; suites not run (no Node). Branched from `main` beside #233, not on it.

## SUPERSEDED (merged as #230): **COMMIT AND LAND THE SHOW; HIS EYE ON THE RE-JUDGED CUES WITH THE MUSIC PLAYING** (2026-10-12, later)

Rulings at **FE** (FF next). `main` was **`f3f3b35`** (#229 merged). Committed on `midtown-lights` (PR #230): everything
the block below this one lists PLUS this round: the engine calibrated to the cue photos, the Viper colour model, the
converter's gobo fix (`assets/hamilton-eos.json` regenerated), the show re-judged from renders (`assets/hamilton-show.json`,
892 cues), the preshow and the interval hold in the player, `docs/hamilton-cues-format.md` (`tracks[].hold`), TRAPS, FUTURE,
the lighting-style doc. Read STATE.md's newest block.

1. **PR #230 is open** (Jack merged #229 and asked for everything else in one PR; `midtown-lights` rebased onto that
   `main` and pushed). When he merges it: the post-merge protocol, then delete `midtown-walls` and `midtown-lights`.
2. **Watch it with him, music on.** Show → the preset is up with the house on; Play; at the end of Non-Stop it holds on the
   preset with the house up until Play. His notes are one-line `at` / level / focus fixes in the segment files (session
   scratch `ham/out/seg<N>.json`, then `python -I ham/merge.py`) or straight in `assets/hamilton-show.json`.
3. **Rule the rig placements the photos exposed** (FUTURE.md, the Hamilton section): the 10th-Electric VL3500s focused
   behind the back wall, the back-wall foots under the gallery, the Deck strips. And the real cues that still throw into
   Midtown's house at the Rodgers' aims (194, 200, 300.3, 1044, 1110, 1238.01): a focus clamp in the player, or leave them.
4. Then the older list: `edge`/`frost`, the 238 effects, the twelve placements, the body, the fixture GLBs, the headset.

The session's working material (not in the repo) is in its scratchpad: `ham/` (segments, generators, research, `audio.py`
with its loudness file now in `shots/`, `merge.py`, `validate.py` — now rejecting `slot:` gobos), `cuephotos/`, `shots/`
(every render: `final-*.png` photo | ours for the 109 real cues, `full/sheet-*.png` per track), `BRIEF-ENGINE.md`,
`ham/REVIEW2.md`, `calib.json`, `midtown.before-engine.html`.

## DONE — 2026-10-12 (later): the engine calibrated to the cue photos, every cue re-judged from renders, the preshow and the interval (uncommitted)

*"go through all the cues and compare them to pictures … the main problem i saw where spotlight places, timing and
brightness"* → every cue rendered (a synchronous `MIDTOWN.frame()` for the hidden pane, a receiver for the PNGs, contact
sheets), the 109 photographed real cues rendered beside Binkley's photos; one Opus agent calibrated the engine (linear
accumulation with a knee so overlaps keep colour, filled beams, Linear on the Viper wheel, strip and X4 output down, a hotter
near field; 0.73 → 0.98 of the photos' luminance); the Viper's cyan flag made blue-leaning (C88/Y55 is blue in the photos
and the stills); the converter's lost gobo table for channels 91–100 fixed (654 changes); eight Opus reviewers re-judged
every cue from renders of their own segments against the notes, the photos and the album's hits (911 → 892 cues: house-
and wall-landing aims pulled onto the deck, shins capped, blues re-mixed, specials moved onto the people, invisible cues
cut, ~60 re-timed). *"you didnt do the preshow lighting … at the end of nonstop it blacks out then the lights go back to
what they where at preshow an it waits for me to press play"* → the Show panel opens on the preset with the house up; a
`hold` track (2-01) makes the player stop at the end of 1-23 (blackout, preset, house up) until Play, on every clock.
Checks: show.check() seek-equivalence passes, refs resolve, lx 301/313, console clean. Nothing in `src/`; suites not run.

## SUPERSEDED (the round above landed on top): **COMMIT AND LAND THE SHOW; HIS EAR AND EYE ON IT WITH THE MUSIC PLAYING** (2026-10-12)

Rulings at **FE** (FF next). `main` is **`e27fc1e`**. On top of `midtown-lights` (unmerged), UNCOMMITTED in the tree:
the projected pools and the light-as-albedo pass, the whole-show cue sequence (`tools/hamilton-cues.py`,
`assets/hamilton-eos.json`, `assets/hamilton-show.json` — revised — `docs/hamilton-cues-format.md`,
`tools/show-fixture/`), the show player (his soundtrack / YouTube / silent clock), the desk screens, the brick grade, and
`docs/HAMILTON-LIGHTING-STYLE.md`. His soundtrack sits at `assets/audio/hamilton-soundtrack.mp3`, ignored by the existing
`assets/audio/*` rule — never commit it. Read STATE.md's three newest blocks.

1. **Ask Jack** to commit (and how the PRs land — the chain question is still open). Commit on `midtown-lights`.
2. **Watch it with him, music on** (Show → Play; the desk's song list jumps anywhere). His notes are one-line `at` or
   colour fixes in `assets/hamilton-show.json`. Still doubtful after the revision: the Cabinet Battle sides (unknown in
   any source), Washington's entrance in Right Hand Man, 782/784 (a strong onset at 25.3 s), Burr's shot 191.18 vs 189.06,
   1044's moment, the specials' exact positions.
3. Run Binkley's effects (238 entries: chases, gobo trails, the AMBER/RED fades); soften templates by Eos `edge`; fix
   `lxSolve`'s near-vertical miss; FOH Vipers aimed at the Rodgers' corners land on Midtown's nearer side walls.
4. Still from before: the twelve placements, the body, the fixture GLBs, the headset.

The session's working material (not in the repo) is in its scratchpad `ham/`: the eight segment files and generators,
`research/visual` + `research/text` (per-number notes and sources), `audio.py` (the album's hits per track), the timing
sheets (lyrics: scratch only), `merge.py` (segments → `assets/hamilton-show.json`), `validate.py`.

## DONE — 2026-10-12: the music, the light made physical, and every cue revised against pictures, writing and the audio (uncommitted)

*"you forgot to put in the audio … the lights looked too bright and unrealistic"* → the player plays his one-file
soundtrack (track starts found from its silences; a Blob, because python's server cannot seek), else the official album on
YouTube (embedded), else a silent clock; a pool is now light × the surface's own colour (an albedo pass with the depth
pass), output per fixture type, 1/R² with a near-field cap, the brick graded from near-pure red, haze 0.35, house lights
out for the show — calibrated against Binkley's cue photos. *"when a light is shining on a wall it loses its texture"* →
the albedo multiply; dark textures scaled, not floored. *"do a revision of the cues … look at pictures online"* → two
research agents (≈120 production pictures; LSA / Live Design / creatives' interviews), the album's loudness decoded for
timing, and the eight segment agents revising every cue: palettes to the evidence, staging where known, real cues
re-placed on the audio (content untouched), 911 cues. *"make an md file … the style of lighting used in hamilton"* →
`docs/HAMILTON-LIGHTING-STYLE.md`. Checks green (show seek-equivalence, refs, lx 301/313 with the show stopped); nothing in
`src/`; suites not run.

## DONE — 2026-10-11 (third session): projected pools; the whole of Hamilton auto-timed; the desk drives it (uncommitted)

Jack's flat-gobo screenshots → the pool is a deferred decal over a depth pass (1/R² fall-off since). *"make as accurate of
an auto timed light sequence for the entirety of Hamilton"* → the Eos export converted (128 real cues, the full vocabulary),
a show player against the cast album (his own files, or a silent clock), and eight Opus agents reconstructing the other
~80% in Binkley's presets and palettes, timed on synced lyric data kept out of the repo: 910 cues, 124 real. *"on the
lighting console i can skip to songs"* → the desk's two monitors are live: songs, cue list, soft keys. Checks green;
nothing in `src/`; suites not run.

## SUPERSEDED (the show came first): **LAND THE CHAIN (NOW SEVEN COMMITS DEEPER), RULE THE TWELVE PLACEMENTS, THEN THE BODY** (2026-10-11, night, second session)

Rulings at **FE** (FF next). Suite count **21**. `main` is **`e27fc1e`**. **PR #229 open; `midtown-walls`
unmerged; `midtown-lights` on top of it carries the lighting engine, the panel, gobos and colours, the check, the
preview and this record.** Read STATE.md's newest block first.

1. **The PRs.** Still Jack's call: close #229 and open one PR from the tip (`midtown-lights`), or merge in turn.
   Then the post-merge protocol (fast-forward local `main`, rebuild byte-identical, map, 21/21 — red is the
   untracked fixture GLBs until he commits them — delete the branches).
2. **Twelve placements the check fails on purpose** (`MIDTOWN.lx.check()` prints them): three shins with their
   lens under the deck (ch234, 239, 240 — yoke-up on a sidearm, or lift 0.15 m) and nine ColorBlaze-48 strips
   under set rails (ch616, 715, 632–637). And the two house booms now land on his baked posts (box 17/19): booms
   downstage of z −1.6, or narrower posts. Ask, then fix in `hamilton-rig.py`/the page as he rules.
3. **The body** — *"the person is too tall, and also give them a body"* — still paused, still wanted.
4. **The cues** — still "timed against what". The engine is the player's target now: `lx.set` with fades is a
   cue; a cue engine over `lx` plus the Eos export's 128 cues is the next piece of work when he answers.
5. **Fixture GLBs** uncommitted; **headset run** still owed. Gobo first-use stall (TRAPS) worth fixing in passing.

## DONE — 2026-10-11 (night, second session): the lighting engine, its gobos, colours, panel, check and preview (`midtown-lights`, six commits)

Jack: *"use opus agents to make the lighting engine and to check that every light is working with the movements,
gobos and colors"*, then *"make a preview of the lights that shows a bunch of different gobos and stuff."* Five
Opus agents — engine alone; gobos+colours and panel at once in two worktrees, cherry-picked; check alone; preview
alone — each in a comment-headed region with working stubs left by the engine agent (TRAPS, "the clean way").

**The engine (`c0179c1`).** Every rig unit a light: level, colour, pan/tilt on the 71 movers (yoke and head, both
LOD levels, at speed), gobo and rotation, zoom; a lens glow, one glare cloud, p4's volumetric cone (far side only,
120 a frame), a pool where the beam lands (a ray through the walk's collision grid, cached), four real SpotLights
for the brightest. Off frame dt; idle draws nothing. Everything at full 54 ms a frame on the Intel chip from the
front row (30 dark; 102 before the cone cuts). Landing points matched a brute raycast 310/310.

**Gobos and colours (`5a2688e`).** Sixteen drawn patterns named for the show's beam palettes, wheels per type,
the template Source Four systems read off Binkley's magic sheet and loaded with their template; colour models per
type — gel with an amber dim, xenon boomerang, CMY+CTO+wheel, LED emitters — ending in one colour the engine draws.

**The panel (`9da710c`).** Select by position, type, channel or a click in the view; drive level, colour, gobo,
pan/tilt, zoom, aim; master; a step-through that fires one light at a time; saved looks.

**The check (`768f9a5`).** `lx.check()` measures what draws for all 313 units through level, colour, gobo,
movement, zoom and both set sizes, restoring the rig exactly: **301 / 313 pass; the 12 fails are placements**
(three shins' lenses under the deck, nine strips under rails), left for Jack. It also re-aimed the house booms
after their wall move (they land on his baked posts now) and stepped SL Boom 4's tower clear of a lens.

**The preview (`817ad37`).** *"make a preview of the lights that shows a bunch of different gobos and stuff."* A
scripted two-minute show on the rig, twelve scenes as data with the camera moving to where each reads: the gobo
parade, every pattern through every unit, the templates on the brick, the VL3500s' soft patterns, a ballyhoo in
haze, LED chases, a fan and a ring on the turntable, CMY mixing on one pool, a gel dimming amber beside an LED that
does not, the strips, a finale. Stop restores the rig and camera exactly; 35/35 checks; every scene under 54 ms.

Suites not run (no `node` on PATH; nothing they check moved). Record: STATE, this, twelve traps.

## SUPERSEDED (the chain grew; the body and his walls still wait): **LAND THE CHAIN, THEN THE BODY, THEN HIS WALLS AS THEY COME** (2026-10-11, late night)

Rulings at **FE** (FF next). Suite count **21**. `main` is **`e27fc1e`** (#228 merged). **PR #229
(`midtown-walk`) is open; `midtown-walls` carries it plus lobby, walls cut, bake 3, rig trim and this
record — five commits on `midtown.html`, unmerged.** Read STATE.md's late-night block first.

1. **The PRs.** Jack has not said whether to close #229 and open one PR from `midtown-walls`, or merge
   #229 and open lobby → walls → bake+rig in turn. Ask, then do it; post-merge protocol after
   (fast-forward local `main`, rebuild byte-identical, `node tools/artnet-map.js` reproduces
   `docs/ARTNET.md`, 21/21 — the red is the untracked fixture GLBs until he commits them — delete the
   branches). `node` was not on PATH this session; the portable copy is in the old scratchpad (STATE).
2. **The body.** Jack: *"the person is too tall, and also give them a body"* — paused by him, still
   wanted. Shorter eye height (Palace 1.68, Roblox ~1.4; make `walk.eye` a setting), a blocky visible
   body under the camera seen looking down, probably a third-person toggle. Off the branch tip; the
   walk's crouch and the 0.40 step-up are measured, keep them.
3. **His walls.** He builds them in Build mode at 1:1 and hands over exports; the bake recipe is in
   STATE (pieces replace if he pressed "Edit the baked pieces", cuts always append, dedupe exact
   duplicates, suffix "(bake N)", tell him Clear all). Flag what the page's `walls:` check reports:
   today his posts, panel, shelf and slab all run into the set, and the slab's top is 4.5 cm over the
   deck. He needs deck stage right downstage of z 3.9 and behind z 9.0; say so when he asks why he falls.
4. **The cues** — still waiting on "timed against what".
5. **Fixture GLBs** uncommitted; **headset run** still owed.

## DONE — 2026-10-11 (late night): the walk, the lobby, the house cut for the set at 1:1, bake 3, the rig trimmed (`midtown-walls`, five commits)

Five Opus 5.5 agents, by Jack's instruction (*"run an opus agent …"*, *"use opus agents to fix it"*),
one at a time until the last two, which ran at once in separate checkouts (bake in the main one, rig
in a worktree, non-overlapping regions, clean cherry-pick). All `midtown.html`; nothing in `src/`.

**The walk (`edd07eb`, PR #229).** *"make it so i can walk around like i do in the palace or like how a
roblox player does."* The fly camera became a first-person walk on the Palace's numbers: pointer-lock
look with a drag fallback (the pane refuses the lock; two refusals and it stops asking), WASD/Shift/
Space, gravity, a floor found by a ray down and walls by level rays at four heights and three widths,
x and z tried separately so you slide, all against one 0.5 m grid of every solid thing in the scene,
rebuilt whenever the scene changes. Three numbers measured here rather than copied: step-up 0.40 (the
scan's seat cushions are 0.45–0.51 over the legroom, so 0.62 walked over the rows), radius 0.25 (the
fitted set's doorways are 0.6 m), and a crouch on C because the fitted galleries were 1.5 m off the
deck. Jack then asked for a shorter player with a body — paused on his *"wait a second"*, not done.

**The lobby (`0be6c01`).** *"add a lobby to the building."* The brief gave the agent the cross-aisle's
floor (y 2.10) for the rear doorways; the doorways are passages from the side aisles 1.2 m lower, and
the agent measured that and built the floor to the passages. A 19.8 × 7 m room behind the back wall
wrapped round the booth (boxed in as a projection room), box office, bar, six glazed entrance doors,
furnishings, its own light, a viewpoint, in the walk's collision; 4,962 triangles.

**The walls (`b0028db`).** *"lets change the theater walls so we can fit the hamilton set at full size"*
— then *"have an opus agent cut out the area of the walls that needs to be, then i will put walls in
that are needed on my own."* So: Real size the default, the set's 1:1 box measured (17.31 m wide,
10.07 deep, 10.17 tall, 0.82 m through the back brick), and four delete boxes through the page's own
cut machinery: the stage house wall to wall up to the fly roof, the front over the deck, the piers'
feet, the whole proscenium frame (the set's own portal passes through it). Triangles split along the
box faces first, because a fill plane is two triangles the size of a wall. Cuts and copies now carry
the set scale they were made at, or a cut made at one scale would eat a different part of the set at
the other. The deck is not wall to wall: stage right is air downstage of z 3.9.

**Bake 3 (`1fba90a`).** His first walls at 1:1 — two posts, a header, rails, a shelf, a copied stair,
and a 42 × 39 m floor slab — replaced the old pieces (he had pressed "Edit the baked pieces"; the
inner timber proscenium, box 5, the rail strip and the first copied stair are gone), exact
duplicates dropped, cuts appended because the editor never lifts cuts. The page's check reports what
the set runs into; the slab's top is 4.5 cm over the deck.

**The rig trimmed (`af02c26`).** *"the lights got raised too high so fix that."* At 1:1 the rig hung
at the Rodgers' heights, through this room's 8.05 m ceiling. `RIG_TRIM` brings the FOH rows to y 7.20
(the Apron Electric back to z −5.2 behind the scan's own bridge, the FOH Truss to z −12 at 0.6
width), the ten electrics level at 7.60, booms and on-set units untouched, every moved fixed-focus
unit re-aimed at where the file's beam met the deck; the rigging rebuilds per set scale against the
cut house, its raycasts batched (1.3 s → 150 ms). Outside the house: 13 on-set units past the cut back
wall, zero house-side.

Suites not run (no `node` on PATH; nothing they check moved). Record: STATE, this, fourteen traps.

## SUPERSEDED (the cues still wait; #226/#228 merged): **ASK WHAT THE CUES ARE TIMED AGAINST, THEN BUILD THEM; MERGE #226 FIRST IF HE SAYS SO** (2026-10-11, night)

Rulings at **FE** (FF next). Suite count **21**. `main` is **`692f3d3`**. **PR #226
(`midtown-preview`) is open at `15703ae`, twenty commits** — the preview page now carries the
whole Hamilton rig, its rigging, a followspot booth, a lighting desk and a frame-rate round. Read
STATE.md's night block first.

1. **The cues.** Jack: *"i want you to do all the lighting cues timed correctly"* — resources in
   his Downloads (STATE lists them). **Timed against what?** He has not said: a recording he
   supplies (the Beetlejuice route, exact) or the cast album's track lengths with no audio. Ask,
   then spec it: the Eos export's 128 cues and their fade/follow times, the 112 cue photos for
   the looks, the game's `plotHamilton` (p5f) to replace, Beetlejuice's `at:` clock as the model.
   The preview page has no cue engine; decide whether the cues live in the game or the preview
   grows a player (the rig's `userData.channels` is the patch for either).
2. **Merge #226** when he is happy with the look, then the post-merge protocol for #224/#225/#226.
   **The 38 fixture GLBs (`assets/fixtures/` and `lod/`) are untracked by his instruction and
   the page fetches them** — ask whether they get committed; Pages shows no rig until they are.
3. **Did Chrome move to the RTX 5060?** He set it in Windows; the page prints its GPU on load.
4. **Headset run**, still owed.

## DONE — 2026-10-11 (night): the rig, its rigging, the booth and the desk, and the frame rate (PR #226, four commits)

Jack asked for the cues and then put the rig first: *"first befor you do the cues put in all
the lights in the correct spots so i can see what they look like"* — and *"can you have opus
agents place all the lights."* Eleven Opus agents over the evening, two or three at a time, each
in a pre-cut region of `midtown.html`; the parent inserted the stubs, the shared import and the
call lines before spawning, and the record of how that went is in TRAPS.

**The rig (`b39f86e`).** `tools/hamilton-rig.py` turns the ETC pack's `Scene/Patch.json` (445
entries) into `assets/hamilton-rig.json`: 313 physical units (32 scenic elements skipped, 161
Color Force cells merged into 11 battens and 44 single cells, six placed by hand), each with its
model file, hang point, pan×tilt quaternion, beam vector, gel, tags and an inferred hanging
position, in the set GLB's own frame. The generator found the GLB's upstage is −z (p5i seats it
unturned; the preview's 180° turn is right for the Midtown house) and that the pack's deck is
0.229 m below the GLB's y 0 (the dropped floor slab). The page hangs one fixture model per unit
under the set's root, yaw on the unit and tilt on the head so clamps stay on pipes, movers
head-down, lens tinted by gel, and the aim check against the file's beam reads dot 1.0000.

**The rigging (`b7776ce`), from three marked-up screenshots.** *"move these lights back to be
attached to the walls"* — the two house booms raycast to the side-wall piers and sit 0.45 m off
them on a boom pipe with brackets. *"make a truss hanging down from the roof with 4 ropes
securing it"* — a 12-inch box truss per FOH row on four cables to the scanned ceiling; the FOH
Electric's line ran through a ceiling ledge (the real room's own bridge), so that row hangs
0.75 m lower. *"put a grid at the level of the stage lights"* — ten pipes wall to wall, five
cross pipes, twelve hangers to the fly roof. *"make all the lights in the wings have trusses
attached to the ground"* — thirteen box-truss towers on base plates, one chord through each
boom's hang points. Every structure is one merged mesh marked `rig`.

**The frame rate (`5d57fde`).** *"its also lagging … i have run way heavier things on this
laptop."* The measurement agent found why both were true: Chromium was on the Intel UHD, not
the RTX 5060. On the Intel chip the page was GPU-bound (CPU render 3 ms, GPU 25–42 ms), draw
calls were not the problem, and an instancing prototype RAISED GPU time. What was done: the two
over-stage specials cast no shadow (−4 / −10 ms Front), static shadow maps (−3 ms, identical
picture), pixel cap 1 with an adaptive drop to 0.8, render on demand, `compileAsync` behind the
loader, the cuts applied once, `powerPreference: 'high-performance'`, the GPU name printed on
load; and a Blender LOD pass (`tools/blender/fixtures_lod.py`, hang point pinned after the first
collapse moved it) with `THREE.LOD` per unit past 7 m — 1.46M → 467k triangles from the back.
Jack then set Chrome to High performance in Windows Settings; whether it took is unverified.

**House works (`15703ae`).** *"carve out a hole here and put in a spotlight booth"* — the back
wall is an alcove between jambs with the rear doorways outside them, so the window is 5.9 m
not 8; the room behind, sill, lintel, stools, work light, and the Lycians on stands re-aimed at
the turntable. *"take out some of the seats in the middle here and put in a lighting desk"* —
rows 7 and 8 of the centre block cut on a box tilted to the 6.5° rake (the floor untouched,
verified by raycast), a level riser, a tech table, an Eos-style console with two monitors, a
littlite, a laptop, two chairs.

Not done: the cues (one question open — see NEXT SESSION). Nothing in `src/`; suites not run.

## NEXT SESSION: **MERGE #226, RUN THE POST-MERGE PROTOCOL FOR #224/#225/#226, THEN SPEC THE HAMILTON GAME** (2026-10-11, end of session)

Rulings at **FE** (FF next). Suite count **21**. `main` is **`692f3d3`** (#224 and #225 merged by
Jack). **PR #226 (`midtown-preview`) is open, sixteen commits** — `midtown.html`, the preview page
with its build mode, area box (copy / delete) and two bakes of his work. Read STATE.md's end-of-session
block first; the bake recipe is there. **If he hands over another export** (`Downloads/midtown-build*.json`
or pasted JSON): append its `pieces` to `BAKED` and its `cuts` to `BAKED_CUTS` with a "(bake N)"
suffix, reload, look, commit; replace instead of append only if he pressed "Edit the baked pieces"
first; tell him to Clear all afterwards.

1. **Merge #226**, then the post-merge protocol for all three: fast-forward local `main`, rebuild
   byte-identical, `node tools/artnet-map.js` reproduces `docs/ARTNET.md`, 21/21, delete
   `hamilton-set`, `fixture-models`, `midtown-preview` local and remote. **The suite is red on this
   tree until the 19 untracked `assets/fixtures/*.glb` are committed or moved out** — ask Jack which.
2. **Spec the Hamilton game** from FUTURE.md PART 2 and the dependency survey; letter from FF; one
   concern per PR, (1) the second build target first. The preview page's three placement calls
   (arch forward, opening fitted, stairs filled) are his and belong in the venue spec.
3. **Headset run**, still owed.

## DONE — 2026-10-11 (evening): the Midtown preview page (the `midtown-preview` branch, PR #226)

Jack: *"make it so i can actually go into the game and start looking at stuff"* — the Palace was
already live on Pages and booted clean from a local http server (an Opus agent did that round:
`.claude/launch.json` gained a `the-house` entry, gitignored). Then: *"no not the palace the new one
with the 3d model theater and the hamilton set."* That game does not exist yet, so a **preview page**
was built instead of the game: `midtown.html`, the Midtown scan unlit (as `tools/midtown-viewer/`
draws it) with `assets/hamilton-set.glb` seated on its deck the way `p5i hamApplyModel` does, turned
180° because this GLB's upstage is +z, lit by a hemisphere fill, two FOH spots and two over-stage
specials with shadows; orbit or drag-to-look walking (no pointer lock), six viewpoints, a
`window.MIDTOWN` console handle. Several rounds of his, made while he watched the pane, two of
them spent on misreadings worth recording. The proscenium to the front of the stage (its six nodes
slide, the ceiling/skirts/fly walls/roof stretch along z to the new plane). The opening fitted round
the set — re-spanning the GLB's pier and header planes read as *"you just removed the proscenium"*
(they are the wall's own flat grey), a dark lit frame read as *"still no proscenium"*, so `frameArch`
now hides the planes and builds a frame of 1.5 m piers and header, 0.6 m deep, **in the proscenium
wall's own unlit material** (opening x ±5.6 / top y 6.9, wall strips to the house either side) — that
one he could see. *"Fill in the stairs on the front of the stage"* was read as the scan's two corner
steps, which got filled twice (steps, then blocks: *"what are these blocks"*); he meant the SET's side
staircases at the gallery ends — which the ETC model simply does not have: the gallery is a U, its two
arms come downstage and end in railed platforms (x ±3.5..4.5, z 0.5..2.0, floor y 3.00, measured off
`ham_plank`) with no way down. `buildSideStairs` adds a flight each. Two tries: solid wedges toward centre
stage (dominated the house), open flights toward centre stage (*"stairs are way too big and don't
go there"*, with a production photo), then per the photo a landing and a flight running backstage along each arm;
and finally, per his marked-up screenshot (*"this one faces towards the audience"*, *"this one
faces this way ->"*, *"just copy the stairs that are already in there and move them"*), ONE flight
built by `buildFlight` (9 risers over 1.26 m, 0.8 m wide, treads on stringers, rails, plank) placed
twice — house-left off a landing on the platform's inner side toward the audience, house-right off
the platform's outer edge toward stage right, where its foot (x 5.76) just touches the scanned
stage wall (x 5.62). **Then all of it removed** — *"remove all the stairs you have put and make a
tool where I can select an area and copy it"* — and the area box gained **Copy area**: every
triangle whose centroid is inside becomes a new piece, one mesh per source mesh sharing its
material, in the box's frame, on the gizmo; pieces centred inside are cloned in too. Saved as the
source box and rebuilt from the models on load before deletes apply. Verified: a 1.6 × 2.2 × 1.8 box
over the house-left platform end copied five parts, moved to centre stage, survived a reload. Lesson:
after the second wrong placement the right move was to hand him the tool, not a third guess. **And
it paid at once:** his next export (pasted) was the set's own stair copied to house right, turned
90°, a rail-grain strip, two tidy-up cuts — baked as `(bake 2)`, appended to the first bake; names
restart at "box 1" per session, hence the suffix. A copy's `src` box is on the pristine geometry, so
appending is safe as long as no later cut overlaps a copy's source (checked: none do). (`ham_iron`, hidden for
a round on the theory it held the beams, is only the posts' foot blocks.) The scan's corner steps are
back untouched.
*"Remove the metal beam"*: not the set's — hiding or cutting every set mesh left it standing. It is
the **scan's** hanging iron over the stage (pipes, a cross bar, two beams on cables, kept upstage of
the wall below the fly cut); `cutBeams` drops every scan triangle with a vertex in a box over the
stage (|x| < 5.2, y 3.0..6.3, z 2.4..8.6). Lesson for TRAPS-by-another-name: with two models in
one scene, **find which model a thing belongs to before touching either** — hide meshes one at a
time and look.

**Then a build mode**, his ask: *"make something where i can add geometries and use a dropdown to
choose their texture and i can move and resize them"*, and *"make it so you can see the things i add
then add them to the actual geometry."* `midtown.html`'s Build button: add box / cylinder / sphere /
plane / wedge where the view is looking; texture dropdown of the set's and house's materials
(cloned to lit `MeshStandard`) plus flat colours; image by picker or dropped on the view (data URL,
travels in the JSON); tiling, tint; `TransformControls` gizmo, G/R/S, numeric fields, snap,
duplicate, delete; autosave to localStorage flushed from the frame loop (no `setTimeout`); Export /
Copy / Import JSON. Then *"a delete box where you scale it over an area then select confirm and it gets rid
of it"*: a red translucent cube on the same gizmo; Confirm drops every triangle whose centroid is
inside it (scan, fills, set, side stairs, proscenium) and removes pieces centred inside; Undo last
re-applies the remaining cuts from original indices captured on first cut. Verified by triangle
counts: a 2.5 × 2.4 × 2 box over the stage-right gallery took 252 brick, 335 post and 331 rail
triangles and undo restored every count. **Bake recipe:** read his export (Downloads,
`midtown-build.json`) or the pasted JSON, put its `pieces` into the page's `BAKED` constant and its
`cuts` into `BAKED_CUTS`, commit — **done once this session** with his first export: six pieces (an
inner timber proscenium of two posts and a header in the set's post grain, a black masking panel
stage left, two rail-grain blocks over the apron's front corners) and four cuts (a hanging thing at
the back of the house, the scan's corner stairs); "Edit the baked pieces" lifts them
back into the editor. Verified in the pane: two pieces, brick texture, resize, autosave; console
clean. The set is 17.3 m wide against
the scanned side walls, so "Set fitted" is scale 0.62 and "Real size" is 1:1 through the walls.

Nothing in `src/`; `the-house.html` and `docs/ARTNET.md` untouched. Suites with the portable Node:
20/21 — `beetlejuice`'s on-disk index check fails on the 19 untracked fixture GLBs in the working
tree, not on anything committed. Found on the way: the Midtown GLB's fill boxes are named nodes
(`pros_*`, `fly_*`, `house_*`, `deck_fill`), which is what made the placement changes possible in
the page without re-exporting the asset.

## SUPERSEDED (folded into the block above): **RUN THE POST-MERGE PROTOCOL FOR #224, THEN SPEC THE HAMILTON GAME** (2026-10-11, later)

Rulings at **FE** (FF next). Suite count **21**. `main` is **`1ca0a14`** (#224 merged by Jack).
The fixture work is on **`fixture-models`** (tools, docs, record; the GLBs deliberately
uncommitted). Read STATE.md's NEWEST block first.

1. **Post-merge protocol for #224**: fast-forward local `main`, rebuild byte-identical,
   `node tools/artnet-map.js` reproduces `docs/ARTNET.md`, 21/21, delete `hamilton-set` local
   and remote. Node: the portable copy (STATE) until Jack installs it.
2. **Merge `fixture-models`** (tools and record only). Then ask Jack whether the 19 GLBs in
   `assets/fixtures/` get committed; `node tools/fixtures-check.js` is ready to become a suite
   case the day they are.
3. **Spec the Hamilton game** from FUTURE.md PART 2 "THE HAMILTON GAME" and the dependency
   survey; letter the rulings from FF; one concern per PR, (1) the second build target first.
   Ask what "a better way to control the lights" means before writing the desk section.
4. **Headset run**, still owed.

## DONE — 2026-10-11 (later): the Hamilton rig's fixture models, and the brief for a second game (the `fixture-models` branch)

Jack's machine. The session opened on the hamilton-set PR already merged (#224, `1ca0a14`),
then went where he pointed it: *"make it so the stuff we have been working on is a separate
game from the palace … improved lighting and sound system."* Four questions, four answers
(FUTURE.md PART 2 "THE HAMILTON GAME"); then *"find 3d models for all the different lights
they use and give me a list with pictures and I will choose."* He pasted the **real Broadway
equipment list** (`docs/hamilton-equipment-list.txt`), which replaced the ETC training rig as
the source of truth; then *"for this session … just get all the models in a usable state
(moving parts separate so they can move later), then update state and handoff."*

**The hunt.** Five research agents over Sketchfab, 3D Warehouse, GDTF Share, the manufacturers,
CGTrader/TurboSquid/Free3D, BlendSwap, Thingiverse. Worth keeping: **3D Warehouse is the
source** — public GLB downloads via `warehouse/v1.0/entities/<id>/binaries/glb`, one author
(Jamie V.) with a consistent low-poly theatre set; **GDTF Share is login-walled** (it would
have official 3D for the Viper, VL3500, X4, Revolution, ColorBlaze, MDG — Jack could open an
account); Sketchfab's search returned nothing for any fixture; **no model of a GAM Stickup, an
Altman Mini-10 or any Lycian exists anywhere.** The ETC pack itself ships six fixture DAEs
(Viper, VL3500, Fresnel, PAR 64, ColorSource PAR, Irideon) with textures; rendered and offered
beside the web finds. The sheet: https://claude.ai/artifact/YFMCghYoCM12CRC1NRoaqz (74
candidates, 18 rows, pictures embedded because the artifact sandbox blocks other hosts, a
`db`-backed pick button per row). **He picked 17 from 3D Warehouse and the ETC VL3500.**

**The build** (`tools/blender/fixtures.py`, rules in `fixtures.json`): import, classify every
mesh into `base` / `yoke` / `head` by name rules, z-zones or a geometric heuristic, join and
decimate per part to a budget, merge materials by colour, scale to the real size, put the hang
point (or floor point) at the origin, set the yoke's origin on the pan axis and the head's on
the trunnions, add a `lens` disc whose local −Z is the beam, export Y-up GLB. Verified three
ways: a colour-coded Workbench sheet (`fixtures_sheet.py`, red/green/blue/yellow parts) through
five rounds of rule fixes; **three.js r128 `GLTFLoader`** loading every file and posing
yoke/head (pivots right on the Source Four and the Viper); and `tools/fixtures-check.js`, which
reads the JSON chunk and checks tree, budgets and that the geometry hangs from y = 0 — **19/19,
0 failures.** Results: 1.4k–10k tris each, 1–4 materials, 4.8 MB in all; table in
`docs/HAMILTON-RIG.md`.

**Found on the way, now in TRAPS:** Blender's `bound_box` is stale after `mesh.transform()`
(every post-scale measurement was wrong for a round); a SketchUp mesh can carry a metre of
loose junk (the birdie); GLTFExporter r128 dies on an undecoded texture (the DAE → GLB route
for Blender 5, which has no COLLADA importer); `transform_apply` refuses multi-user data;
research agents share the browser tab; a hidden pane screenshots blank.

**Also:** `docs/hamilton-game-dependency-survey.md` — an agent's survey of what each kept engine
part needs from the parts the second game drops (p7, p4's `buildRig` and p5's `Snd` are the
entanglement). Nothing in `src/` changed; suites not run; `the-house.html` untouched.

## SUPERSEDED (the PR merged as #224): **LAND THE HAMILTON SET, THEN DECIDE WHAT ELSE OF HAMILTON IS WANTED** (2026-10-11, FE)

Rulings at **FE**. Suite count **21**. `main` is still **`4125f6f`**; the
work is on **`hamilton-set` (`f4d9a90`, pushed, PR not yet opened** — the
agent's permission layer refused the API call, so Jack opens it from the
compare page). Read STATE.md's NEWEST block first.

1. **Open and merge the PR**, then the post-merge protocol: `main` rebuilds
   byte-identical, `node tools/artnet-map.js` reproduces `docs/ARTNET.md`,
   21/21 on the merged result, branch deleted local and remote. **`main` is
   red until this merges** (`beetlejuice.js`, the Midtown glb — see the Done
   block below and TRAPS).
2. **Node.** This machine has only the portable copy in the session scratch
   folder. `winget install OpenJS.NodeJS.LTS` — **Jack runs it**, not the
   agent (TRAPS, the sandbox). `tests/node_modules` is installed.
3. **Look at it.** Load HAMILTON on the desktop build served from the repo
   (the model fetches; `file://` cannot) and from Pages after the merge. The
   stand-in shows for a second or two on a slow line, then the brick and
   timber replace it. Headset run still owed, now for this too.
4. **Then Jack's calls, in FUTURE.md PART 2 "Hamilton":** walkables on the
   model, lanterns on the real gallery, the rig from `Patch.json`, and whether
   a cue-stack reconstruction from the 128 exported cues is wanted at all.

## DONE — 2026-10-11: the Hamilton set is a model on the stage (the `hamilton-set` branch, RULING FE)

Jack's machine again. Two things happened in one long session: an assessment
of two Hamilton source packs he had downloaded, and then — on his instruction —
the set from one of them onto the stage.

**The packs.** *The Hamilton Programming Project* (ETC's official Eos Augment3d
training pack, non-commercial) and a zip of the 2015 Richard Rodgers light plot
PDFs. The ETC pack's `.esf3d` is a zip; inside, `working.a3d` is another zip
whose `Scene/Patch.json` holds all 445 patched channels with world positions in
metres (y = depth, z = up; the FOH truss at y −17.5), `Scene/Fixture.json` the
21 fixture types, and `Resources/Hamilton Full Set*.dae` is Rod Lemmond's full
set model (401k polys, ten flat greys, no UVs, Y-up, mm with a 0.001 node
scale). The cue states are in the binary `showdat.dat` and are NOT parseable;
the route is Eos Nomad (free) → File > Export > CSV. **Both are in Jack's
Downloads, not the repo.**

**RULING FE** — Jack: *"can you put the set model onto the stage then update
state and handoff."* This extends RULING AV (Beetlejuice modelled on the
production, AO repealed for it) to HAMILTON, scoped to it. The other three
shows keep their interpretation note and the assertion that pinned AV's scope
now pins FE's as well. The licence is ETC's non-commercial one; recorded in
`assets/README.md` against the day the repo goes public.

**What was built:**
- `tools/blender/hamilton_set.py` — parses the COLLADA itself (Blender 5.2
  removed the importer), drops the theatre (proscenium surround, borders, and
  the 0.2 m floor slab — the game keeps its deck because the revolves are cut
  into it), splits the two mixed grey groups by face normal (vertical = brick,
  flat = timber plank), maps the rest onto post/rail/iron, generates brick and
  three tinted grain maps, planar-dissolves 400k CAD triangles to **65,949**,
  box-projects UVs, exports Y-up metres. It prints the turntable rings it finds
  on the floor: **centre z +0.95 (model frame), r 3.82 and 2.59.**
- `assets/hamilton-set.glb` (6.8 MB, 5 materials) — WIRED IN: `p5i`
  `HAM_MODEL`/`loadHamiltonSet`/`hamApplyModel`, hooked from `showLoad` beside
  `loadSetModels`. Placed, not fitted: `HAM_MODEL.z` −3.91 carries the model's
  frame so its turntable centre lands at z −2.96 (the ETC cone sheet's
  measurement of the real one, upstage of the arch). Same shrink, validator,
  freeze, pinned-group discipline and "the stand-in plays" fallback as the
  Beetlejuice loader.
- `p5f` — the hand-built structure is filed into one group, `SHOW.hamStand`,
  which the apply strips along with its walk entries and its lanterns
  (`hamPruneStandIn`). `REV` moved from (−5.6, 6.6, 3.4) to **(−2.96, 3.82,
  2.59)**; the model's rings and the game's discs are the same circles, held
  by a test against `HAM_MODEL.tt`.
- Tests: five new cases in `tests/sets.js` (the FE note; revolves match
  `HAM_MODEL.tt`; the stand-in is one group with ≥3 walkables and the lanterns,
  and a 2 m box applied through `hamApplyModel` takes it out, prunes exactly
  its walkables, lands seated at y 0 / x 0 / z −3.91, frozen, revolves intact;
  strike-and-reload gives a fresh stand-in; no-fetch resolves and touches
  nothing) and a node-side read of the GLB (≤8 materials, 20k–150k triangles,
  no camera or light). `beetlejuice.js`: the AO/AV note case excludes Hamilton
  and asserts FE's note; the on-disk check accepts `HAM_MODEL` and any `.glb`
  named in `assets/README.md`. All negative-checked against `main`'s build in a
  detached worktree (`git worktree add … main`, the new suites copied in,
  `NODE_PATH` at the real `node_modules`).

**What was found on the way, now in TRAPS:** `main`'s suite had been RED since
#221 (the Midtown glb trips "committed but no manifest entry fetches them") and
nobody knew, because that round had no Node — a round that cannot run the
suites must say so and must not call the result green. Installers and
`msiexec` launched from the agent's tools cannot write under `AppData\Local`
(Windows Installer 1622), even elevated; Jack double-clicking the same file
worked first time. Blender 5.x has no COLLADA importer. The agent's Bash tool
truncates a heredoc past ~100 lines and reports `unexpected EOF`; write the
file with the file tool instead.

**Also this session, not in the repo:** Eos Nomad v3.3.10 installed; the ETC
show file opened in it (driven through the window by screenshot and mouse,
because OSC is off by default and the GUI is the only export path) and
exported to CSV — **128 distinct cues, 333 rows with parts, 111 presets, 41
colour / 118 beam palettes, 280 groups, 45 effects, 659 channels, 200,900
level rows.** Cue numbers run 0.5–1271 in thirteen islands (36 → 190, 476 →
631, 894 → 1039…): one moment per training exercise, matching the 112 cue
photos; about a fifth of the real stack. The rig, presets and palettes are
complete. Nothing of it is in the repo; FUTURE.md PART 2 carries what a
reconstruction would be.

## DONE — 2026-10-10 (second session): the scan's holes, found by raycast (the `midtown-holes` branch)

Same machine, same asset, same shape of PR: **assets and tools only, nothing in
`src/`, no suite needed or run** (Node still not installed). Jack asked for the
model to be gone over for "holes, miscolorings or just problems in general",
then "fix the issues then make the rendering".

**How it was audited, and this is the reusable part:** the magenta-background
renders of the first session only find what a camera happens to point at. This
pass added an **inside-out raycast test** (`BVHTree.FromPolygons` over the whole
GLB, 240 directions from a 1 m grid of interior points, 620k rays): a ray that
hits nothing has left the building, and its exit cell on the outer box says
where. It found the biggest hole in the model — **a void east of the stage-right
wall** (x 6..10, y −3.8..1.5), the whole corner between the stage's side wall and
the house's diagonal front-right wall, where the scan has nothing at all — which
no render had shown because nothing in the house looks that way. The script is
not committed (it was a scratch tool); the recipe is `tools/blender/midtown_probe.py`
plus `mathutils.bvhtree`, and it is cheap enough to re-run after any edit.

**What was wrong and what was done** (all in `midtown_theatre.py`, so the GLB
rebuilds from source; the first-pass fills are unchanged where they worked):

- The east void: a full-height panel at x 10 from the tower's back wall to y 3.6.
- Slits under the wall-top fills (the scanned walls stop at 2.6–3.3 m, the fills
  began at 3.5): `SKIRT_Z` 3.5 → 2.5, still above the tallest doorway (2.4 m).
- No lintels over the stage-left wing doorways, and the front-left vestibule's
  outer wall torn at every height: a strip and a full panel at x −9.8.
- Side-wall bases open behind the front rows, and the cavity under the raked
  rear floor open to the sides: skirting boards on both side walls (low to y 8,
  skirt-height behind that) and across the rear wall, low only across the two
  rear doorways so they stay open.
- Two single-face black shards at the opening's top corners (valance scraps) and
  12 curtain-leg stubs standing on the deck at the pier bases: a `valance` rule
  and a stray-island sweep (union-find per object, ≤12 faces inside a box).
- The old header's soffit at 6.19 m survived the fly cut as a floating black bar:
  a `soffit` rule (flat faces above 5.95 m upstage of the wall).
- The tiled brick was a different hue from the real brick beside it, and MIRROR
  extension folded the mortar into butterflies with a conduit bracket repeating:
  cropped past the conduit, toned to the measured colour of the real brick,
  made seamless by edge cross-fade, REPEAT not MIRROR, plane moved to y −8.9 to
  sit flush with the real brick.
- Fill mottle read as TV static (2 blur passes): 8.
- Speakers were pure black (base colour 0.001 in the scan): dark grey, rough 0.85.
- Deck fill z-fought the scanned deck at distance (5 mm): 2 cm.

**Result:** escaped rays **4807 → 501**, and 498 of the 501 exit through the two
rear doorways Jack chose to leave open. The last three graze the stage-left wall
top under the fly-tower fill. Face count 64,563; still 17 materials.

**Delivered:** six 1080p renders in chat, the walkthrough viewer re-exported, and
**a markup tool**, `tools/midtown-viewer/markup.html`, published as the artifact
https://claude.ai/artifact/LwSoKjQ911xowE1DQa4syv (the plain viewer is still
`index.html`). Jack clicks the model with one of three tools — **Delete** cuts a
sphere out of whatever he clicks (previewed live by rebuilding the mesh's index
buffer), **Retexture** swaps a filled panel's tile (the scan's own pieces refuse
it), **Fix this** drops a pin with a note — and every edit is written to the
artifact's `db` as a document in the `edits` collection: `{kind, mesh, point
(glTF), blender (x, y, z in the Blender frame, 3 dp), radius | texture, note,
created}`. **To apply his edits at source, read that collection** (`ArtifactData`
list `edits` on the URL above) and turn each into a rule in `midtown_theatre.py`:
a `delete` is a sphere to drop faces inside (mesh names are the GLB node names,
`Object_N` for scan pieces), a `retexture` is a `material(...)` swap on the named
`box_*` panel, a `fix` is a note at a point. Served from a plain file the page
runs without the store and says so (edits then live in the tab only).

**Round 1 of his edits, applied the same evening and cleared from the list:**
four Delete clicks on the speaker arrays (read as "remove the arrays", not
"carve 0.5 m spheres out of four boxes": all nine `Material.002` objects go,
59k faces, 16 materials now) and two "hole" pins, one each side of the
proscenium at 4.5–5.4 m. Neither was an opening — the raycast still says 501 —
they were **slits beside the piers**: the piers stopped at the stage side walls
(x ±5.9), the house's return walls sit outboard of that, and from the house
you saw the brick (left) and the void panel (right) through the gap. `PIER_X0/X1`
are now −6.6 / 6.4 so the piers run behind the return walls.

**Round 2 (two screenshots, "fix these holes on both sides"):** the recesses
above the louvre vents either side of the proscenium. The scan's vent walls
(y ≈ −2.2) stop at the vent tops, ~4.5 m; above that each recess has a soffit
at 6.2 m and nothing behind, so from the seats you looked through into the fly
tower (a seat-to-recess ray probe hit `fly_wall_w/e` and `back_brick_hi` 350–600
times a side; after the fix, never). `pros_outer_l/r`: wall-grey strips in the
proscenium plane from `VENT_TOP` 4.3 m to the ceiling, outboard of the piers.

**Traps hit, now in TRAPS.md:** a texture's MIRROR extension is not a free
seamless tile; and renders only audit what the camera sees.

## DONE — 2026-10-10: a real auditorium, from a scan (the `midtown-scan` branch)

The first session after the Art-Net round, on a **new machine** — Jack's, repo
at `C:\Users\jackf\OneDrive\Documents\gms-theater`. Git 2.55 was installed this
session; **Node is NOT installed, so no suite ran** — and none needed to:
**nothing in `src/` changed**, so `the-house.html` and `docs/ARTNET.md` are
untouched and still match. Blender 5.2 is installed and is now a tool this repo uses.

**What was asked:** "look a lot more realistic". A research pass (the options
list is in FUTURE.md PART 2) and a model hunt — **no model of the real Palace
Theatre exists anywhere**, free or paid — and Jack picked the
*Midtown Atlanta Auditorium* photogrammetry scan (Cody Setchfield, **CC BY 4.0**),
then directed four rounds of edits off rendered pictures.

**What landed (assets and tools only, nothing wired into the game):**

- `assets/source/midtown/` — the download as-is, plus `brick_tile.png` (a crop of
  its own scanned brick). **Rebuild everything from here.**
- `tools/blender/midtown_theatre.py` → `assets/midtown-auditorium.glb` (~65k tris,
  13 MB). It deletes the "Free Chapel" screen, its frame, the screen glow baked on
  the wall behind, two freestanding upstage masking slabs, and the brown curtain
  legs/valance; builds a **solid proscenium wall** (opening x ±4.3, top 5.2 m, at
  y −2.3) in the measured colour of the house walls beside it; opens a **fly tower**
  (roof 16 m — Jack wants a fly rail in it later); tiles the back wall with the
  scan's own brick; fills the ceiling, wall-top slits, deck and floor gaps the scan
  never captured; mattes the mirror-glossy (0.96) floor pieces; decimates the
  speakers (they were 128k of 190k tris). **Doorways deliberately left open** (Jack).
- `tools/blender/midtown_shot.py` (renders named views; `SHOT_BG=1,0,1` shows
  holes magenta, and the background is camera-rays-only so reflections can't fake
  a hole), `midtown_probe.py` (measures), `midtown_inspect.py`.
- `tools/midtown-viewer/` — a three.js r160 walkthrough, built from
  `tools/blender/midtown_web_export.ps1`. **Serve it; `file://` cannot fetch.**

**Traps hit, worth keeping:**
- **Blender coordinates vs the viewer:** Blender world is Z-up with the stage at −Y;
  glTF is (x, z, −y), so the stage is at **+Z** in three.js.
- **Mirror-glossy floor reads as holes.** The `.001` floor pieces reflected the
  magenta test background and looked exactly like gaps. Make the hole-finder's
  background camera-only.
- **Artifact pages refuse `.glb`, `.bin` and `data:` fetches** — the viewer ships the
  buffer as base64 text and rebuilds a GLB in memory.

**Open, and his:** which venue the scan becomes, the fly rail, and the material
merge (17 vs the 8 budget). See FUTURE.md PART 2.

## NEXT SESSION: **THE ART-NET ROUND IS CLOSED — PUT IT IN A HEADSET** (2026-08-16, EL–FD)

Cache-bust **`?v=31`**. Rulings at **FD**. Suite count **21**. `main` is at
**`a3eecce`**. **Read STATE.md — it carries the six things left, the three
open decisions, and what the real desk found.**

**NOTHING IS OPEN, NOTHING IS SHELVED, AND NO BRANCH IS UNLANDED.** #200 to
#216 with no gaps. The branch that had been sitting finished-but-unpushed
(RULING FC, the proscenium neon) merged as **#213**; **#214** remade
`docs/ARTNET.md` as a patch sheet; **#216** added `--csv` for his spreadsheet.
All four of the session's branches are gone from both sides — verified with
`git ls-remote`, not assumed.

**SO THE ONE THING TO DO IS THE HEADSET, AND IT IS NOW THREE ROUNDS OWED.**
`?v=29` never happened, nothing in DR–DY has ever been seen, and **not one byte
of the Art-Net round has been in the headset** — all of the desk work, real
QLC+ included, is desktop-only. Read all four wrist lines (`avg`, `pk`, `fov`,
`calls · tri`) at four moments: empty Palace, Beetlejuice pre-show, the 1:00
cue with eight blinders, and **at the proscenium looking up into the neon with
a desk driving 311..314**. Prediction on record: **~590 calls empty at the boot
view**; ~700 means the build is stale.

**BEFORE ANY OF THAT, START THE RELAY, AND USE THE ABSOLUTE PATH:**

```sh
node C:/Users/patri/Documents/theater_game/tools/artnet-relay.js
```

**Two "it isn't coming up" reports in one session were both this**, and neither
was a bug in the game. `node tools/artnet-relay.js` from anywhere but the repo
root fails with `Cannot find module`; and the relay is a plain Node process,
not a service, so closing the window makes `localhost:8080` answer
`ERR_CONNECTION_REFUSED`, which reads exactly like the build is broken. The
relay resolves the directory it SERVES from the script's own location, so an
absolute path is safe from any working directory.

**THE FIVE THINGS THAT WANT A RULING RATHER THAN A SESSION** are in STATE.md
and FUTURE.md PART 1a: RULING EY (channel 307 on a dead universe, ruled and
deliberately unbuilt), `ART_PROVE` and the relay's sequence guard (both sized
off the 44Hz that FB disproved), **the ARTNET row that cannot tell three
failures apart** — the one most likely to cost another evening — the three
disagreeing spellings of the driving-here predicate, and the `smoke` flake.
**And three decisions are his**, now including whether the CSV gets committed
and guarded or stays an on-demand flag.

**Patch off [docs/ARTNET.md](docs/ARTNET.md), never off prose.** RULING FD made
it a six-block patch sheet and it is still generated from the built file, with
a suite case that fails if it drifts. This session proved the point three times
over: STATE.md was wrong about `artUrl` for two days, wrong about `EADDRINUSE`
for one, and the mover block renumbered twice with no code edited to say so.

## DONE — 2026-08-16 (evening): the record, the spreadsheet, and a desk that finally answered (#215, #216)

Two PRs, and then the first session in this round where the work was checked
against **his running machine** rather than against jsdom.

**#215 — the record** for FC and FD, plus the two corrections STATE.md had
owed since the previous session. **And it nearly lost a Done block**, which is
the process finding: the previous session's record — the real QLC+ desk, #207
to #212, rulings EX to FB — lived in the SAME commit as an unlanded feature
branch. Landing that feature as one concern meant dropping the commit, and
`main` had never carried the record at all. Restored, with the sentence calling
FC "finished and unlanded" corrected to say when it merged. **A record commit
riding on a feature branch is a record that depends on that feature landing
unchanged.**

**#216 — `tools/artnet-map.js --csv`.** He asked for the channel list in a
Google Sheet whose header row is literally `channel number,what is does,where
it is`. **The header is reproduced verbatim, typo and all**, because it is his
sheet and a column whose name does not match will not line up when he pastes.
`where it is` is the column the data never had and the reason it is worth
generating: a lantern's position is `f.pos` and the bar it hangs from is
`f.ls`, both read off the built rig, so a re-hung lantern moves in the sheet
too. **SELF-CHECK 12** refuses to emit unless every channel appears exactly
once in order; the negative check drops one house circuit and it fires. **It is
a flag, not a third committed file** — and that is an open decision, because
nothing warns him when a pasted sheet goes stale.

**THEN THE DESK ANSWERED, AND IT CORRECTED THE RECORD AGAIN.** Everything
below came off his machine while he was trying to get the page up:

- **`ERR_CONNECTION_REFUSED` twice, and neither was the game.** Once because
  `node tools/artnet-relay.js` was run from `C:\Users\patri` rather than the
  repo; once because no relay was running at all. Diagnosed from
  `netstat`/`Get-NetTCPConnection`: Chrome sitting in `SYN_SENT` against 8080
  with nothing listening. **The absolute-path invocation is now in STATE and in
  the block above.**
- **THE `EADDRINUSE` VERDICT WAS TOO BROAD AND THE RELAY'S COMMENT WAS RIGHT.**
  STATE said QLC+ and the relay never collide, so no `EADDRINUSE` is ever
  raised, and therefore the relay's comment about refusing `reuseAddr` making a
  clash loud was wrong reasoning. **Measured both ways on his machine:** QLC+
  vs the relay genuinely does not clash — seen with QLC+ holding **both**
  `0.0.0.0` and `::` while the relay still bound and still counted packets,
  because QLC+ sets `SO_REUSEADDR` — but **relay vs relay raises a real, loud
  `bind EADDRINUSE 0.0.0.0:6454`** and the second process dies rather than
  silently splitting the packet stream. The comment was describing a different
  collision than the one the record tested. **Second hardware-sourced finding
  of the round, after RULING FB.**
- **QLC+ was already sending the whole time.** The relay's own counter proved
  it — `1 ArtDmx packets in, 0 client(s)`, then 6 — with no browser attached.
  The desk half of the chain has never been the problem.

**AND THE `smoke` FLAKE FIRED, WHICH IS WORTH HAVING ON THE RECORD.** A full
`npm test` came back `20/21 FAILED: smoke`; `smoke` alone then passed **three
times running**, and the next full run was 21/21. That is FUTURE.md PART 1a
item 6 behaving exactly as documented, and it is the first sighting logged with
a re-run count attached. **A lone red `smoke` after an unrelated change is
this, and one re-run settles it.**

**Post-merge verified on both PRs:** `main` rebuilds byte-identical
(`94084f5e`), `tools/artnet-map.js` reproduces `docs/ARTNET.md` exactly, the
`--csv` mode still emits 327 rows, 21/21 on the merged result, and every branch
confirmed gone from the remote by `git ls-remote` rather than by assumption.

## DONE — 2026-08-16 (later): the proscenium lands, the sheet becomes readable (#213, #214, FC–FD)

Two PRs, two clean merges, and the round closes.

**#213 — RULING FC, the proscenium neon.** Four channels (311 intensity, 312 R,
313 G, 314 B), and ruled a **LIGHT**: no takeover byte, so a dead universe
blacks it along with the 39 lanterns, which reads as "the desk is dark" rather
than "the game broke". It is the first family in this project ruled to have NO
answer to *"what does 0 mean when nobody is driving this"* — drawing that line,
scenery gets a companion byte and light does not, was the ruling.

**THE SESSION'S FINDING IS ABOUT WHAT A REVIEW ACTUALLY COVERS.** The branch
arrived reviewed, green, negative-checked and unpushed. It had been reviewed
**once**, seven findings fixed — and **the fixes themselves had never been read
by anybody.** They are the least-watched code on a branch: written under the
glow of a review that happened before they existed, and merged as "reviewed".

The third pass found it. Closing the first review's finding — an interval gate
failing OPEN, asking `artDriving()` on any stage when `artnetTick` only writes
on the Palace — the fix had **widened the gate from `a.portal` to a
`deskOwnsIt` that also gated `HOUSE.house`.** A second behaviour change,
correct as it happens, **with no assertion behind it at all**, because the case
had been written for the portal.

**AND THE TRAP THE BRANCH HAD JUST DOCUMENTED REAPPEARED INSIDE ITS OWN FIX.**
One commit earlier it added the note that the FC case needs a SENTINEL because
`deskOn()` delivers zeros. The new gate had exactly that hole again — the
desk's frame writes `HOUSE.house` to 0, so *"it is not 0.5"* is the state the
setup left. **Writing a trap down does not inoculate the next commit against
it.** The assertion plants `HOUSE.house = -1`, a level no byte and no queue can
produce.

**The stomp is visible, not merely wrong on paper**: `artnetTick` runs at
p7:1636 and `updateStorm` — which calls this — at p7:1646, so an ungated write
lands AFTER the desk's inside one frame and `updateRig` reads it at p7:1664.
One frame of house light in the middle of the desk's blackout.

**THE MIRROR CLAUSE IS WHAT PROVES A GATE HAS NOT FAILED THE OTHER WAY.** "The
desk did not stomp it" and "nothing wrote it at all" are indistinguishable from
one assertion. The Palace clause asserts the level is withheld; the Arc clause
asserts the same level lands. Without the second, a gate that failed SHUT
everywhere reads as a pass — the exact failure review one had just caught in
the other direction.

**#214 — RULING FD, the channel file becomes a patch sheet.** Jack, at a desk
with the flat file open: *"make it so the list isnt generated it is just what
it is for beetlejuice and make it easier to read."*

**THE "NOT GENERATED" HALF WAS PUT BACK TO HIM AND HE TOOK THE OTHER ANSWER** —
one instruction with two halves pulling opposite ways, so the collision was the
thing to ask about. Offered reformat-and-keep-generated, hand-write it, or keep
both, he chose **reformat**. 326 flat lines became **219 in six blocks**, each
heading declaring its own channel range, the 39 lanterns collapsed to one
7-channel pattern plus a roster, long notes wrapped instead of running to
column 200.

**The generation was worth defending and the evidence was in the same two
days:** the mover block has renumbered **twice** (EZ, then FC) with **no code
edited to say so**, because every base is computed. A hand-written sheet would
have been wrong twice in two days with nothing to say so.

**AND THE COLLAPSE IS CHECKED RATHER THAN ASSUMED**, which is the round's
standing finding wearing a new hat — *a generated document is only as honest as
the set it MEASURES.* Each of the seven slots is compared across all 39
fixtures; a slot they agree on prints once, a slot they do not prints every
distinct reading with the fixtures that give it. **Not hypothetical: `+5 pan`
and `+6 tilt` really do disagree**, and the sheet names fixtures 23, 24 and
34–39 as the movers. FA's guarantee — no channel missing — is kept and now has
three guards, including one in the suite that survives somebody deleting the
probe's own check.

**Negative checks: 7 across the two PRs, all by sha, all fire.** Two on FC (the
ungated `HOUSE.house` write; the dropped stage test, where the returned `-1`
proves the sentinel survived and so identifies the fail-shut mode rather than a
wrong value), five on FD — including one that **neuters the generator's own
self-check** so a gapped file really is emitted, which is what proves the suite
is a backstop rather than a restatement of a check that already ran. Every
restore byte-identical.

**Post-merge verified on both:** `main` rebuilds byte-identical (`94084f5e`),
`tools/artnet-map.js` reproduces `docs/ARTNET.md` exactly, 21/21 on each merged
result, branches deleted local and remote.

**AND THREE DOCUMENTS WERE WRONG.** STATE.md's claim that `artUrl` returns null
from Pages — it does not; **only `file://` has no host.** From Pages it builds
`wss://jackscreations21.github.io/artnet`, a socket really is constructed and
it **fails to connect**, a different failure with a different console
signature. Telling a tester "it fails silently" while their console shows an
error is how an evening goes. FUTURE.md's PART 1a heading read "SIX" over a
body opening "All five", and its closing paragraph called item 5 a flake when
the flake is item 6 — **the same off-by-one that file already warns about,
twice more.** The count is now stated in three places that must agree.

**New in FUTURE.md (item 7):** three spellings of "a desk is driving THIS rig",
and two of them disagree on `typeof STAGE === 'undefined'` — `artnetTick`
refuses to write, `artHandover` counts it as driving. Latent only, because
`STAGE` is always defined in p2k; recorded rather than fixed because reversing
`artHandover` is a behaviour change on paper.

**New in TRAPS:** a fix written in response to a review is itself unreviewed
code, and is the least-watched code on the branch — read the fixes as a diff of
their own and ask what each one WIDENED; and the mirror clause, because a gate
that fails shut and a gate that works look identical from one side.

## DONE — 2026-08-16: a real desk ran it, and six more PRs (EX–FC)

The Art-Net chain finished, **and then Jack patched a real QLC+ into it for the
first time.** That evening is the round: everything before it came out of
jsdom, and the hardware disagreed.

**SIX MERGES: #207 (EX, set movers parked unless driven), #208 (EO, the map
probe), #209 (EY, the record), #210 (EZ, the sign is a fly), #211 (FA, the flat
list), #212 (FB, ART_STALE 5s).** Every one verified byte-identical with the
map reproducing and 21/21 on the merged result. A seventh, FC, was finished and unlanded when this was
written; it merged the next day as #213.

**WHAT THE REAL DESK FOUND, and this is the part worth keeping:**

- **The universe was the whole problem and the default was right.** QLC+ sends
  Art-Net universe 0. A `--universe 1` suggestion from me broke a working setup
  for an hour.
- **I blamed QLC+ for stealing UDP 6454 and I was wrong.** Both processes do
  hold it — QLC+ on IPv6 `::`, the relay on IPv4 `0.0.0.0` — but measured, the
  packets get through anyway. **The relay's comment claiming that refusing
  `reuseAddr` makes a clash loud is still wrong**: they never collide, so no
  `EADDRINUSE` is ever raised.
- **MY INSTRUMENT WAS BROKEN AND I DREW CONCLUSIONS FROM IT ANYWAY.** Every
  reading said "no desk yet" because the browser tab I was measuring had a
  stopped frame loop — `document.hidden`, so `requestAnimationFrame` never
  fired and `artnetTick` never consumed what had arrived. `ART.buf` held a live
  512-byte frame the whole time. **Check the instrument before believing the
  measurement** is the lesson, and it cost most of the evening.
- **The ARTNET row cannot tell three failures apart** — a tab that is not
  rendering, a page that can never build a socket (`file://`, or Pages), and a
  desk that is not talking all read `ON — no desk yet`. Unfixed, no ruling yet.
- **A REAL DESK IDLES AT ~1.8s BETWEEN PACKETS**, not at the nominal 44Hz —
  against a 2.0s hand-back. That is RULING FB, and it is the first number in
  this entire round that came off hardware.

**THE RULINGS.** EX: byte 0 on a set mover is no command, after 512 zeros were
measured walking the parked attic 19.50m onto the deck. EZ: the sign is a fly
on target and speed, which retired EY's sign half. FA: `docs/ARTNET.md` is a
flat list, one line per channel, no gaps. FB: the stale window is 5s. FC: the
proscenium neon takes four channels and is a LIGHT — the first family in this
project ruled to have NO answer to "what does 0 mean when nobody is driving
this", because a light's zero is a real command meaning black.

**THE REVIEWS FOUND SOMETHING REAL ON EVERY SINGLE PR, and three of them were
bugs written within the hour:**

- Parking the sign left the desk's old speed on the record, so the SHOW's own
  haul then crawled at 0.2651m/s instead of 2.6 — for the rest of the session,
  surviving the switch off and on. No assertion covered it.
- FC's gate asked `artDriving()` alone, which is true on any stage — so with
  the board on an Arc house and the desk writing nothing, the interval's neon
  was discarded and never struck again. **It failed OPEN**, and p6d's own
  comment says a "never write unless" ruling should fail shut.
- The map's house-circuit lines were the last block still TYPED: a build where
  a dead universe brings the house lights to half produced a byte-identical
  file.

**AND THE STANDING FINDING GOT SHARPER TWICE.** A mutation that breaks an
EARLIER clause never reaches the clause it was meant to prove — the case
aborts, and the run still prints ERR against the case by name. And an
assertion can be green because of the ORDER ITS OWN SETUP RUNS IN: RULING EY
was found only because a reviewer moved one line, and FC's first assertion was
satisfied by the zeros `deskOn()` had already delivered. Both are in TRAPS.

**Negative checks across the round: 40-odd, all by sha**, every mutation proved
present in the BUILT file and proved to have changed it, every restore proved
byte-identical. **Three did not fire on the first attempt and were rebuilt
until they did** — the guarded read in `sceneMvAdvance`, the sign's stale
`artSpeed`, and FC's stage test. Two more were recorded as not firing rather
than quietly dropped.

## SUPERSEDED: **THE ART-NET CHAIN IS FINISHED — PUT IT IN FRONT OF A DESK** (2026-08-16, EL–EY) — the chain landed and the round closed; see above

Cache-bust **`?v=31`**. Rulings at **EY**. Suite count **21**. `main` is at
**`44688eb`** as this was written, with its own PR landing on top. **Read
STATE.md — it carries the run instructions, the one bug left standing, and the
two things that are his to decide.**

**TEN PRs — #200 to #209 with no gaps, TEN CLEAN MERGES, NO RECOVERY PR.**
Nine of them are the planned chain; **#206 is the extra**, the mid-round record
written when the chain paused at six. Every merge verified byte-identical,
21/21 on the merged result, branches deleted local and remote.

**THE ONE THING TO DO IS PUT A DESK ON IT**, because not one byte of this
round has been seen against real hardware. `node tools/artnet-relay.js`, QLC+
to 127.0.0.1 universe 0, LIGHTING page, throw ARTNET. **Patch off
`docs/ARTNET.md`** — it is generated from the build and the suite fails if it
drifts. VR-SETUP.md §8 is the whole recipe.

**AND ONE BUG IS LEFT STANDING ON PURPOSE — RULING EY.** A dead universe
still hauls the Beetlejuice sign 11.36m to its FLOOR stop on the first frame,
because the band channels write on a CHANGE and their memories start at -1.
Jack ruled the fix and ruled that it waits: *"Don't fix it — just record it."*
It is PART 1a item 4 of FUTURE.md. **Expect it the first time the switch goes
on with a desk patched only for the 273 light channels**, which is the
likeliest first real use.

**The `?v=29` headset run is now TWO ROUNDS owed** and nothing in DR–DY has
ever been seen either.

## DONE — 2026-08-16: the Art-Net chain finished, movers, the map and the record (EX, EY)

Three PRs. The set movers with a ruling reversed under them, a channel map
generated off the code, and the record — and the round's shape is that
**every one of the three was changed by measuring what a DEAD universe does.**

**RULING EX — the movers are parked unless something is really driving them.**
ET gave them no speed byte, so byte 0 meant `home` and 512 zeros commanded
every mover in the loaded show home: measured, it walked the parked attic
19.50m onto the deck while it is drawn and flew the exterior cloth in. Put to
Jack with both answers written out; he ruled byte 0 = no command, 1..255 spans
home..out. **And it is NOT the same park as the flys**, which is the half
worth keeping: EQ makes a fly line's zero a STOP because a line that kept a
target it was not at left the rail motor loop playing. A set mover has no such
loop, so a zero here is SILENCE and a move the show started runs on — a build
that copied the fly rule across would freeze the show mid-changeover every
frame a dead desk was connected.

**RULING EY — the bands have the same fault and it is RULED BUT NOT BUILT.**
`artBands` writes 307 and 308 on a band CHANGE only and the memories start at
-1, so the first frame of an unpatched universe reads band 0 and acts: the
sign goes to its FLOOR stop, **11.356m of world travel measured from its UP
stop**, and the house redresses to the Maitlands. Third time the same
collision was found in one round. Jack ruled the fix and ruled that it waits.

**THE FINDING OF THE ROUND IS ABOUT WHAT A GREEN ASSERTION IS WORTH, AGAIN,
AND THIS TIME IT IS ABOUT ORDER.** The sign's own safety case reads green
BECAUSE `deskOn()` establishes band 0 before the sign is put on its stop — so
its 120 measured frames are a no-change band. **The assertion written to prove
the sign safe is the thing that concealed the hole.** Move that call two lines
down and it fails.

**AND THE SAME SHAPE APPEARED IN THE NEGATIVE CHECKS THEMSELVES.** A mutation
written to prove the "block STOPS" clause broke an earlier clause in the same
case, so the case aborted forty lines above the thing under test — and the run
still printed ERR against the case by name, which reads exactly like a check
that fired. It took a second mutation, built specifically to leave the earlier
clauses green, to reach the clause at all. **Read WHICH message came back, not
just that one did.** In TRAPS.

**TWO REVIEWS FOUND WHAT THE OTHER DID NOT, ON BOTH PRs.** On the movers:
stage 1 found the two assertions that could not fail (the only haul in the
game has `key === scene`, and it is the LAST scene declared, so "takes no
channel" was only ever tested as "takes no write"); stage 2 found the
half-refusal the PR itself created — the SET list ran the changeover, marked
the set ON and drawn, and let artMovers put it back in the wing on the next
frame, with a toast saying it worked. On the map: stage 1 found that channels
307 and 308 were RESTATED rather than measured — three mutants each produced a
byte-identical map, on the two channels from Jack's own verbatim brief; stage
2 found that the mover metres are the STAND-IN geometry's, and that six of the
twelve channels mean something else once his model files land.

**Negative checks: eleven on the movers, and every one fired.** All by sha,
every mutation proved present in the BUILT file and proved to have changed it,
every restore proved byte-identical. Two of them were mutations a REVIEWER ran
against the old suite and reported as NOT firing; they fire against the new
fixture.

**Three documents were wrong and are now right.** FUTURE.md's Art-Net entry —
the one STATE.md said to delete when the chain finished — **never existed**;
the round went brief straight to spec. The relay serves the repo resolved from
its own location, not the working directory, so you cannot redirect it by
`cd`. And Art-Net cannot come off the Pages URL because `artUrl()` only ever
builds a SAME-ORIGIN socket — from HTTPS it attempts
`wss://jackscreations21.github.io/artnet`, which does not exist. Mixed content
is what kills the WORKAROUND, not the default path, so **the console error a
tester sees will not say "mixed content"**.

**And channel 309's traveler moves with the production.** On the standing hang
it is line 2, the house curtain. **With Beetlejuice loaded it is line 1**,
because the show hangs its own `bjCurtain` and `FLY.findIndex` takes the
first — the Palace house curtain is not on the rail at all. RULING EO always
said "the first lineset whose goods declare `traveler:true`" and was right;
the loose sentences were in `p6d`'s comment and in STATE.

## SUPERSEDED: **FINISH THE ART-NET CHAIN — THREE PRs LEFT** (2026-08-15, EL–EW) — all three landed, see above

Cache-bust **`?v=30`**. Rulings at **EW**. Suite count **21**. `main` is at
**`e0c5768`**. **Read STATE.md — it carries the channel map, the run
instructions and the five things that are his to decide.**

**In order:**

1. **PR 7 (RULING ET, set movers) is BUILT and NOT VERIFIED.** Branch
   `artnet-movers`, tip `cb10848`, `main` already merged into it. It has had
   **no review** and the full suite has **not** been run on the merge — the
   merge commit says so in as many words. Run `npm test`, two-stage review,
   then the usual protocol. **Ask Jack question 1 below before it lands.**
2. **PR 8 (RULING EO) — `tools/artnet-map.js` and the generated
   `docs/ARTNET.md`**, plus the suite assertion that the committed file matches
   what the probe emits. Not started. Everything it needs is already exported
   from `p6d`.
3. **PR 9 — the rest of the record**: the QLC+ section in VR-SETUP.md, and
   delete the Art-Net entry from FUTURE.md.

**THE QUESTION THAT SHOULD BE ASKED FIRST.** RULING ET gives set movers no
speed byte, so byte 0 is `home` and **512 zeros command every mover in the
loaded show home** — measured, it walks the parked attic **19.50m onto the deck
while it is drawn**. A desk patched only for the 273 light channels sends zeros
on everything else, which is the likeliest first real use, and RULING EQ says
in as many words that a dead universe moves no scenery. Either **parked unless
driven** (byte 0 = no command; matches the flys and channel 309) or **as ET is
written**. One condition either way. The other four questions are in STATE.md.

**AND THE `?v=29` HEADSET RUN IS STILL OWED** from the perf round — nothing in
DR–DY has ever been seen, and nothing in this round has either.

## DONE — 2026-08-15: Art-Net, six of nine PRs (#200–#205, EL–EW)

The desk drives the Palace. QLC+ sends ArtDmx on UDP 6454, a zero-dependency
relay forwards each packet as one WebSocket frame, and `src/p6d.txt` applies
the latest frame once per frame in `artnetTick`. `artDriving()` — the switch
**and** a frame inside two seconds — is the one gate everything else asks.

**Six PRs, six clean merges, no recovery PR.** #200 the relay (EL), #201 the
part and the socket (EM state, EN, EU, EV), #202 the lights (EP, EN, EO), #203
the gates and the rows (EM, EV, EW), #204 the flys (EQ), #205 the bands (ER,
ES). Every merge byte-identical, 21/21 on the merged result, branches deleted.

**THREE RULINGS WERE ADDED BY WHAT THE ROUND FOUND**, and that is the round's
shape:

- **EV** came from Jack mid-round — "make it so it just runs normally if it
  doesnt detect art net signals" — and it narrows EM: the board yields to the
  switch AND a live signal, never the switch alone. Throwing ARTNET with no
  relay running changes nothing at all.
- **EW** came from a review: **EM's list of writers was written from the
  board's CONTROLS**, so it missed every writer that is not a control — and
  those are the dangerous ones, because a control writes when a hand moves and
  these write every frame. Five of them, all measured: `standByAtTheTop`
  half-refusing (it took `fireCue`'s refusal AND its toast, then wrote all 39
  fixtures anyway), the firelight and `audFxStep` winning every frame silently
  with the row still reading LIVE, the pan/tilt/house sliders bypassing
  `setSection*`, and a running script whose faded writes `updateFades` then
  carried. **The sharpest part: `SHOW.flicker` and `AUD.fx` are only cleared by
  `showCueFx`, which only `fireCue` reaches — and EM gates `fireCue`. An effect
  armed in the last cue before the desk took over could never be turned off
  again.**
- **A note on channel 309** reversed EO's literal table for the traveler after
  measurement: written unconditionally, an unpatched universe ran the house
  curtain shut at 0.42/s in front of the audience. It is parked by its own
  lineset's speed byte now, and it is one condition to put back.

**THE FINDING WORTH KEEPING IS ABOUT TESTS, AND IT IS THE SAME ONE FIFTEEN
TIMES.** Across the round, fifteen assertions were green against builds that
did the opposite of what the assertion's name claimed, and almost every one was
the same shape: **the setup already put the system in the state the case then
asserted.** A duration check on a rig whose durations were already zero. A
"switching off snaps nothing" comparison taken on a rig that was already dark.
A parked-line case that began with the line standing still. A mover check that
read `ART_PAN` back out of the build and compared against it. A grand-master
check with no frame between setting the grand and reading it. A BACK case
entered at a pointer where "refused" and "worked" both leave 1.

Three more were masked rather than weak, which reads identically from outside:
`flyTo`'s own clamp hid a wrong fly mapping at BOTH ends of the travel (only
the middle differs); a zero speed hid a written target (the observable was the
rail motor loop, not the position); and two band guards **masked each other**,
so each mutation alone left the suite green — which is how the band memory
keyed on `SHOW.key` survived, and it is wrong, because **reloading the same
show builds fresh scene objects and the name has not changed**.

**Every one of those was found by a negative check that did not fire.** Around
seventy mutations across the round, all by sha, each proved present in the
BUILT file and proved to have changed it, each restore proved byte-identical,
rebuilding in the restore step as well as the mutate step. Two mutations turned
out to be genuinely UNOBSERVABLE rather than uncaught, and telling those apart
from a weak assertion can only be done by looking.

**Also found, and fixed, in code that was already on `main`:** two ways to kill
the relay process outright (`GET /%` and `GET /a%00b` — the second survives the
first's fix, because `%00` decodes cleanly and `fs.stat` then throws
synchronously); a header-only ArtDmx that forwarded 512 bytes of blackout; the
whole working directory including `.git` served to every interface; and a
dot-segment guard bypassable via NTFS 8.3 short names (`/GIT~1/config` returned
4040 bytes while `/.git/config` correctly returned 403).

## NEXT SESSION: **THE FRAME RATE GOT A ROUND OF ITS OWN — PUT IT ON THE HEADSET** (2026-08-14, DR–DY) — CARRIED, still unseen

Cache-bust **`?v=29`**. Rulings at **DY**. **Read STATE.md — it carries the
full picture, the probe numbers and the four-moment checklist.**

**EIGHT PRs, #185–#192, EIGHT CLEAN MERGES, NO RECOVERY PR.** His second
headset run read **47ms avg EMPTY / 57 avg, 70 pk with Beetlejuice**; a
four-agent audit found the causes and the round fixed everything it found:
the dark lens quads (DR), the castShadow churn (DS), **the environment moved
off every pixel and onto the metals** (DT — intensity 0 never removed the
taps; that is in TRAPS now), the grade folded to one matrix (DU), the console
upload gated by distance (DV), the lights that served no one gated (DW), the
draw census probe committed (DX), and **the lantern bodies merged — 10.8 →
3.2 draws each, the scene 878 → 580 submitted drawables** (DY).

**TWO OF THE AUDIT'S CLAIMS DIED ON INVESTIGATION, and that is the round's
finding**: the venue gate for lights already existed (DW pinned it and gated
the two real strays), and the architecture was already merged — the draw cost
was the RIG all along (DX measured it; DY took it). The audit's own census
misread the gathered set and quoted a workaround-site count that was never
real. **Count the gathered set, not the object census** — in TRAPS.

**THE ONE THING TO DO IS A HEADSET RUN AT `?v=29`** — read all four wrist
lines (`avg`, `pk`, `fov`, `calls · tri`) at the four moments. Predictions:
~590 calls empty at the boot view; avg well under 47 empty (how far is the
question). The DT/DU look questions and the carried DJ–DQ questions are in
STATE.md. **Ask for the calls · tri numbers with every report.**

## DONE — 2026-08-14 (later): the performance round, #185–#192 (DR–DY)

The audit ran four agents over the DJ–DQ diff plus a jsdom census; the round
ran eight implementer agents with two-stage review each, merges in-session
(owner delegated, "ok can you merge them yourself"), every merge verified
byte-identical + 19/19 + branches deleted. Review fixes landed on-branch
before every merge — the reviews caught, among others: the DS header crediting
the wrong half of its own defusal; the DV comment's flat "7.7m" that was
really a 5.5–10m band (and the desk faces UP the house, so the sightlines
that read it are rear stalls and balcony); the DW census numbers going stale
on arrival (the PR's own gate changed them — both now stand side by side);
the DX probe printing a mixed-denominator 62% its own prose had corrected to
54.2%; and the DY merge's one blind spot (a mirrored piece survives every
tri/box assertion — the scale refusal guard exists because the test net
cannot see that failure).

**Findings worth keeping** (all in TRAPS now): a tunable uniform is not a
kill switch; opacity 0 and intensity 0 are not hidden; the lights-state hash
carries castShadow's VALUE and the light COUNT (write on change, gate on
membership); r128 `Texture.needsUpdate` is SET-ONLY — observe
`texture.version` (the DV tests' first draft passed vacuously against an
ungated build); count the gathered set, not the census; mixed denominators
print confident lies, and a probe that reads the built file measures stale
bytes after an src-only edit.

**Negative checks across the round: 30+, all by sha**, each mutation proved
present in the BUILT file AND proved to have changed it, every restore proved
byte-identical. The DY reviewer added a fourth check of its own (per-body
mint → the restated sharing test fires), which is the two-stage review
earning its keep on the last PR of the chain.

## SUPERSEDED: **NOBODY HAS SEEN ANY OF THIS** (2026-08-14, DQ) — the DR–DY round above landed on top; its headset questions are CARRIED in STATE.md

Cache-bust **`?v=28`**. Rulings at **DQ**. `main` is at **`78f627a`**.
**Read STATE.md — it carries the full picture.**

**EIGHT PRs, #174–#182, EIGHT CLEAN MERGES, NO RECOVERY PR.** Each based on
`main` and verified after opening; `main` rebuilds byte-identical and the suite
is green on every merged result. Layer 1 of what he asked for is **complete** —
environment, atmosphere, colour grade, and glow planes instead of bloom — and
layer 2 is complete: the property panel on **both** surfaces, and droppable lights.

**RULING DQ LANDED TOO — #182, and the round is finished.** Droppable lights are
in, the DN/DQ seam is asserted, the worktree is gone and every branch is deleted.
**Nothing is open and nothing is shelved.**

**THE ONE THING TO DO IS A HEADSET RUN, because not one thing in this round has
been looked at.** Every number is reasoned and none of it is evidence. The
questions are in the feel-constants block of STATE.md; the one to expect trouble
from is that in a session the glow clamp uses the **desk** frustum, so close-up
halos are 42–52% smaller in the headset than on the monitor.

**AND THE PERFORMANCE PROBLEM IS STILL THERE AND IS NOW WORSE ON PAPER.** His
readings were **25ms empty / 48ms in Beetlejuice** against a 13.9ms budget, with
foveation pegged at 1.00 and no travel left. The spec says a performance
investigation belongs *between* DJ and DK. It did not happen — he was told, and
chose to carry on with the lighting. DK through DN each add per-pixel cost to
that frame. **The 25ms is the BUILDING, not his models**, and the leading suspect
is still that the instanced batches never cull.

**Three things are his to decide** and they are written out in STATE: `f.glow`
drawing all 39 in a blackout, the `envTrack` rota backstop, and whether the
performance investigation now goes first. The `GLOW_CAP` ordering question is
settled — DN’s rank already governs the buffer limit and #182 asserts it.

## DONE — 2026-08-14: the Roblox lighting round, #174–#182 (DJ–DQ)

*"rebuild the lighting engine to look and work like the one roblox uses"* →
layers **1 (the look)** and **2 (the authoring model)**, and **"It has to match
in VR."** Eight PRs, eight clean merges, no recovery PR.

**THE PLAN WAS WRONG IN SIX PLACES AND FIVE OF THEM WOULD HAVE PASSED A GREEN
SUITE.** That is the finding of the round, and it is a finding about *this
repo*: jsdom stubs `WebGLRenderer`, so nothing here can compile a shader, and
every shader mistake ships silently.

- **`UniformsLib` cannot be extended after load.** `ShaderLib` merges and
  **clones** at module init and `getUniforms` clones again per material, so the
  planned fog uniforms would have been declared and never supplied — **and the
  plan's own assertion would have passed**, because it read `UniformsLib`
  directly. A green test over a broken shader.
- **r128's fog varying is `fogDepth`, not `vFogDepth`.**
- **`VR.cam` does not exist**, so the glow's camera branch was permanently dead —
  and `camera.fov` is never written in a session either, so the screen-space
  clamp would have run off a stale desk value in the one place it exists to
  protect. It reads `projectionMatrix.elements[5]` and `getWorldQuaternion`,
  because the *local* quaternion misses the rig yaw the right stick applies.
- The plan's **test code, panel markup and cache-bust step** were all invented.

**THE REVIEWS CAUGHT SEVEN THINGS THAT WERE GREEN WHEN HANDED OVER**, and they
are the argument for the two-stage review: DK reaching only imported models
(**120 of 120** of the building's own at 7.27× in a blackout); ~142 more minted
by a VR session, the largest block being the rope rail you stand at; the Arc's
smoke racks building after the collect point; `goodsMat` cloning
`envMapIntensity` so a dyed drape froze at the moment it was pulled; the
"six-plane" box being five, with the floor edge-on to PMREM's camera at
**0.00%**; DN's cap keeping twelve halos behind your head and none in front; and
**two assertions that passed against builds they should have failed**.

**AND MY OWN SUGGESTED FIX WAS WRONG, AND WAS PROVED WRONG BY MEASUREMENT.**
Nearest-first only moved the halo blind spot — from the stalls the nearest twelve
*are* that same FOH bar overhead. So is an eye-plane half-space. The rule is a
**generous view cone, then nearest within it**, and the assertion that finds all
three wrong answers is the same seat measured **capped and uncapped as a ratio**;
"it drew something" passes for every one of them.

**TWO PATTERNS WORTH KEEPING.** Every injected effect got a **`mix` term that
defaults to 0 = bypass**, so a material the registry misses renders exactly as it
did before the ruling — without it, a missed material reads `gradeTint` as
`vec3(0)` and renders **black**, a hole in the picture rather than a drift. And
the **stub was fixed rather than the game weakened**: `PMREMGenerator` would have
taken the boot of all nineteen suites down, so the four renderer methods it
actually calls went onto the stub, the way DJ added the missing `renderer.info`.
One of them — `getClearColor` — was found **lying**: the real one mutates its
target and PMREM's default clear is white, so the harness would have built a
white environment while the browser built black, and the suites would have
reported success.

**Negative checks: 17 (DK), 5 (DL), 5 (DM), 9 (DN), 5 (DO), 4 (DP), 21 (DQ).**
Every mutation proved present in the BUILT file and proved to have changed it —
**by sha, not byte count**, after one equal-length swap left the size identical
and the usual check went silently green. **Two did not fire and are recorded as
not firing** rather than quietly dropped.

**PR 10, the three.js upgrade, was CUT** and the reasoning is in the spec: the
non-module addon folder died at r148, **meshopt already works on r128** (the
decoder is published for it and `p5i`'s vendored loader already carries
`setMeshoptDecoder`), and `KTX2Loader` was ESM-only at every version — so the
asset pipeline, its last surviving justification, was never gated on the upgrade
at all.

**New in TRAPS:** a backslash in a regex inside a probe template (which
`probe-lint` does *not* sweep for); `UniformsLib` being un-extendable while the
test passes anyway; the r128 fog varying name; `transformed` not existing in the
sprite shader; an unsupplied uniform defaulting to 0 where 0 is not neutral; a
byte count being a proxy where the sha is the proof; `instanceColor` reaching the
fragment only through the prefix's OR; and the three-wrong-answers glow cap.

## SUPERSEDED: **EXECUTE THE ROBLOX LIGHTING PLAN** (2026-08-13, DJ–DQ reserved)

**A spec and a plan are on disk and NO SOURCE WAS TOUCHED.** `origin/main` is at
`32c6a1a` (#173, the DI record). Rulings are still at **DI** in the code; the plan
reserves **DJ–DQ**. `bj-di-record` is contained in `main` and can be deleted.

**Read in this order:**

1. [docs/superpowers/specs/2026-08-13-roblox-lighting-design.md](docs/superpowers/specs/2026-08-13-roblox-lighting-design.md)
   — **the reasoning.** Rulings DJ–DQ (binding), the four findings, why route 1 and
   why Unity were both rejected, and what is still open for him.
2. [docs/superpowers/plans/2026-08-13-roblox-lighting-prs1-10.md](docs/superpowers/plans/2026-08-13-roblox-lighting-prs1-10.md)
   — **the steps.** PRs 1–10, one concern each, real code, negative check per PR.
3. STATE.md — the live picture.

**Both files are UNTRACKED. PR 1 commits them.**

**He chose subagent-driven execution and wanted it in a fresh session.** Use
`superpowers:subagent-driven-development` — one subagent per task, reviewed between.

**What he asked for:** *"rebuild the lighting engine to look and work like the one
roblox uses"* → layers **1 (the look)** and **2 (the authoring model)**; and asked
whether a desktop-only graded look would do, **"It has to match in VR."**

### The four findings — two of them correct advice given in the same conversation

1. **three.js has NO MULTIVIEW at any version.** Zero occurrences of `multiview`
   in the published r128, r160, r162 and r170 builds. **That was the entire
   frame-rate case for the upgrade.**
2. **The UMD build dies after r160.** `build/three.min.js` is 200 through r160.1,
   **404 from r161**. `THREE` is a CDN global and the file needs cross-part
   hoisting, so **r160.1 is the ceiling.**
3. **The wrist meter already existed** (`vrPerf`/`vrDrawMeter`, `p9.txt:130`) —
   avg ms, peak ms and live foveation on the left wrist. "Put the frame time in
   the headset" was describing something already built.
4. **The budget is 13.9ms, not 11.1ms, and foveation is a live governor**
   (`p9.txt:199` — *"the first headset run could not hold [90]"*). Desktop
   `autoTune` is inert in a session; foveation is not.

**Finding 4 settles the bloom question.** Foveation is the only mid-session lever,
a stereo composer forfeits it, so route 1 would buy bloom by removing the safety
net. **Route 2 — capped additive instanced glow planes — is the plan.**

**RULING BY was miscited twice.** Its 4.29ms is a CPU `groundAt` **raycast** for a
feature **measured and taken back out** — not render cost, not in the frame.
**There is no measured VR frame time at all.**

### THE READINGS ARE IN, AND THEY RESHAPE THE ROUND

**Taken 2026-08-13 at `?v=27`. Cache-bust is `?v=28` from here.**

| Moment | avg ms | vs the 13.9ms budget | ≈ fps |
|---|---|---|---|
| Empty Palace, nothing loaded | **25** | **1.8× over** | 40 |
| Beetlejuice | **48**, and *clamped* | **3.5× over** | ≤21 |

**"There is no measured VR frame time at all" is no longer true — and the first
number it produced was a lie.** `p7` clamps `dt` to 50ms and `vrPerf` was reading the
clamped figure, so every frame worse than 50ms recorded as exactly 50. He was reading
two off a ceiling nobody knew was there. **RULING DJ fixes it** and proves it: 120ms
frames average exactly 50.0 against the pre-change build.

**Three consequences, all structural — read the spec's §7.2 before Task 2:**
foveation is **pegged at 1.00** with no travel left, so DN's "preserve the lever"
reasoning needs restating (the conclusion holds, for a stronger reason); **25ms with
nothing loaded is the building, not his models**, and a performance investigation
belongs before PRs 2–5, which all add per-pixel cost to a build that cannot afford
it; and **PR 10 is cut** — meshopt already works on r128 and KTX2 costs the same at
either version, so the upgrade's last justification was never gated on the upgrade.

The DI questions in the block below are still unanswered and still want a headset run.

### The one thing to put to him

**The upgrade's case collapsed after he asked for it.** What survives is KTX2 +
meshopt for the 181MB and 32 releases of fixes — load time and memory, not frame
rate — against a bill that resets every intensity he ruled on in a headset
(`useLegacyLights` flips at r155: `BLIND_POWER` 4.6, `AUDM_POWER` 2.8,
**`BLIND_RANK` 0.9 / `AUDM_RANK` 0.8 (BC, load-bearing)**, `BJ_FILL_MAX` 0.55, the
house at 0.15). PR 10, last, optional, mitigated by `useLegacyLights = true` as
its own commit first. **He was offered the cut and has not answered.**

**Still owed, unchanged:** the graveyard, the audio join at 4292, the house floor
pool, a park stated as an absolute LINE, `BLIND_BODY`, the cemetery's park, the
sign's red at GO, 181MB of models, and `pr6.json`.

## NEXT SESSION: **THE PARKS ARE PAST THE LEGS — LOOK AT THE WING** (2026-08-13, DI) — STILL LIVE, fold into the run above

Cache-bust **`?v=27`**. **Read STATE.md — it carries the full list with the
rulings written out.** Rulings are at **DI**.

**`main` is at `9c555aa`, #172 is merged, and NOTHING IS OPEN OR SHELVED.**
Verified after the merge: `main` rebuilds **byte-identical** and the full suite is
green on the merged result. One PR, one clean merge, based on `main` and verified
after opening.

**HE REJECTED THE DF PARKS FROM THE HEADSET AND HE WAS RIGHT THREE TIMES.** "the
attic, bedrrom and closet sets are still in the wings", then "i meant past the
physical legs. past the black curtains", then "what is the problem there is plenty
of room between the fly rail and the legs to fit all three sets". All three parks
were standing *inside* the masking, and the wing he was pointing at was **11m
wider than three rulings believed**. See the Done block below.

**THE FIRST THING TO LOOK AT is the stage-right wing**, because the whole traffic
plan now lives in it:

1. **Do the three read as stored rather than standing about?** They are 2.00m
   past the leg cloth, 5.74m / 10.18m / 9.78m off the wall, packed 1.50m apart.
2. **Is stage left being EMPTY right?** All three enter from stage right now.
   That was ours to change, not his — his words were only "one of the sides" —
   and **it is the one thing in this round he might want back**. Past the legs it
   cannot go back: stage left is 9.80m from the leg edge to the wall and the attic
   is 13.06m wide, so putting it there means flying it, thinning it, or narrowing
   the legs. **Raise it rather than wait on it.**
3. **Does the attic crossing the whole stage read as travel or as a trek?**
   It tracks from x −14.20 at `BJ_TRACK_SPEED` 2.0.
4. Carried and still unseen: the neon on the black portal, the arch with no gold,
   the netherworld at 4.42m, FLOOR / PRE-SHOW / UP on the sign, the houses at
   13.6 × 12.76, 25 seconds of nothing at the top.

**Still his to decide:** which way the neon rakes if at all (**DG turns his own CY
rake off** — `BJ_NEON_RAKE_ON`, one line in `p5h` AND one in `p4`), the sign's red
at GO, the cemetery's missing park, and 181MB of models.

**Still owed:** **BY**, the graveyard, the audio join at 4292, the house floor
pool, a park stated as an absolute LINE, `BLIND_BODY`, and `pr6.json`.

## DONE — 2026-08-13: the parks go past the legs, and the rail was never there (#172, DI)

He put the DF parks on the headset and said the attic, bedroom and closet were
still in the wings. Two clarifications later — "i meant past the physical legs.
past the black curtains", and "what is the problem there is plenty of room between
the fly rail and the legs to fit all three sets" — he was right three times, and
the third one was a fault in the building rather than in the parks.

**DF MEASURED THE WRONG LINE.** It sized every park against the PICTURE edge at
x 6.80. A leg is 5.6m of cloth hung 1.9m outboard of the opening, spanning
|x| **6.60 .. 12.20** — so every park began *inside* the masking: the attic
4.33m deep in it, the bedroom 2.51m, the closet 2.71m. "1.07m clear" was 1.07m
clear of the picture and four metres inside the black.

**AND THE FLY RAIL WAS NEVER AT −19.2 — THREE RULINGS QUOTED A FALLBACK BRANCH.**
CE, CS and DF all state the flyman's locking rail at x −19.2 and all three cite
`p9`, which says `const railX = fr ? fr.rail : -D.stageW/2 + 2.8`. **−19.2 is the
`else`.** There is always a crew frame; `crewPalaceFrame` gives `XR + 2.8`, and
`XR` is `-(D.stageW/2 + D.wingSR)` because `D.wingSR` exists precisely to say
stage right runs 11m further out than stage left. **The rail is at −30.2.** The
gap between the legs and the rail is **18.00m, not 7.00m**, and his 13.06m attic
fits in it with 2.94m to spare. A number read out of a `?:` is only the number if
you also checked which branch runs — now in TRAPS, and `tools/wing.js` prints it.

**SO ALL THREE PARK STAGE RIGHT, 2.00m PAST THE CLOTH, ONE BEHIND ANOTHER**, and
the attic changes sides. **That was ours to change and not his:** RULING CQ picked
stage left *because* a 13m set would have reached past a rail at −19.2, and stage
left turns out to be the one wing (9.80m past the legs) that cannot hold it at
all. The side that was chosen for a wrong reason was the only wrong side.

**THE THREE TYPED OFFSETS ARE GONE, AND THAT IS THE ENGINE HALF.**
`BJ_ATTIC_SIDE`, `BJ_SIDE_ROOM` and `BJ_CLOSET_BACK` could not place his file and
the stand-in at once — the attic is 13.06 × 10.00 with his model against
10.40 × 9.60 without it, and **differently centred as well as differently sized**,
so one offset that puts his 2m past the cloth puts the stand-in somewhere else
entirely. DF proved it without noticing: the same number left the stand-in 2.00m
clear and his own file 0.57m clear. `bjWingPack` measures each set's own box and
packs the queue downstage-to-upstage; `bjApplyModel` packs **again** when a file
lands, because a set growing moves the two behind it. Both cases now land at
exactly 2.00m past the cloth, checked both ways round.

**TWO THINGS NOBODY HAD ASKED ABOUT, both found by the new probe.** The
**auditorium side wall** is a 1.0 × 22.0 × 32.0 box at x −15.50 whose upstage face
reaches **z −1.00**, straight through the middle of the stage-right wing — his
attic acts at z −0.30 and the old park simply left it at its acting z, so it stood
0.70m inside the wall and nothing in the suite or in `tools/parked.js` was looking
at that wall at all. And **the VR set menu asked about depth before side**, so a
park that is both in a wing and upstage of the backdrop read as "upstage" — true,
and it sends a man in a headset behind the cloth to look for a set standing in the
wing beside him. The tests are not exclusive; order them by which answer is useful.

**AND THE WRONG-WALL BELIEF WAS IN FOUR PLACES.** `XL` is +22 and `XR` is −33, and
two suite sweeps plus `tools/parked.js` all tested *both* sides against
`±D.stageW/2` — declaring an 11m strip of real deck to be outside the building.
Same substitution as the rail, one level down.

**ASSERTIONS: DF-1 REVERSED IN PLACE, ON BOTH OF ITS NUMBERS** — it measures off
`LEG_OUT` (named in `p3` so the parks and the assertion cannot drift apart) and
**reads** the rail off `crewFrame()` instead of copying a literal out of a
conditional. What it was for survives whole. Three new: the pack, the stack
(collision *and* the auditorium wall), and the re-pack when a bigger model lands
through the real `bjApplyModel` path. **Seven mutations negative-checked**, every
one proved present in the BUILT file *and* proved to have changed it, with the
revert byte-identical to the baseline.

**AND I BUILT AN ENGINE FEATURE AND THREW IT AWAY BEFORE COMMITTING.** Believing
the gap was 7.00m, the only way to fit an 8.62m bedroom into it was to turn the
sets end-on, so `p5c` grew a yaw mover — an `'ry'` axis with every mover write
routed through one `sceneMvWrite`. Then the probe said the gap was 18.00m and the
whole feature was unnecessary. It went back out: an engine concept with no caller
is worse than the problem it solved. **Measure before building the clever thing.**

**New in TRAPS:** a literal copied out of a conditional's fallback branch and
quoted by three rulings; the two side walls not being at the same |x|; measuring a
symmetric pair and getting the same edge twice (the probe printed "0.00m of
cloth"); and a classifier whose buckets overlap answering with whichever it asks
first.

## NEXT SESSION: **PUT THIS ROUND ON THE HEADSET** (2026-08-13, all nine landed) — SUPERSEDED, see above

Cache-bust **`?v=26`**. **Read STATE.md — it carries the full list with the
rulings written out.** Rulings are at **DH**.

**HE FINALLY LOOKED AT IT, ASKED FOR NINE THINGS, AND ALL NINE ARE BUILT AND
MERGED.** #164 → #170, seven PRs and seven clean merges, each based on `main` and
naming its dependency — no recovery PR, which is the whole lesson of the
#155–#162 round applied. `main` rebuilds **byte-identical** and the suite is
green on the merged result. **Nothing is open and nothing is shelved.**

**NOBODY HAS SEEN ANY OF THIS ROUND.** The questions, in the order they bite:

1. **Does the neon read on the black portal?** In from ±7.75 to **±7.11**, top
   from a rake to **flat at 9.51**. That is a third shape for this frame in three
   rounds, and it **supersedes his own CY rake** — see below.
2. **Does the arch look right with no gold?** Four pieces hidden for Beetlejuice:
   the moulded band, the goldDk inner, the keystone, its head. The ivory wall,
   the sounding board and the lyre stay.
3. **Is the netherworld right at 4.42m?** Third number on that constant.
4. **Do the parks read as out of the way** at 2.89m / 2.69m / 1.07m clear?
5. **Is FLOOR / PRE-SHOW / UP the right set of three for the sign?**
6. Carried: the houses at 13.6 × 12.76, `BJ_FILL_MAX`, `BLIND_POWER` 4.6, the
   house at 0.15, 25 seconds of nothing at the top.

**THE ONE PLACE THE ROUND ARGUES WITH HIM, and it should be raised rather than
waited on.** RULING DG turns his own CY rake OFF. CY was his correction and it
was right about the GOLD, whose top is a quadratic arch — a straight bar across
it must lean. The black portal's top is FLAT, so a rake would cut diagonally
across a horizontal member. `BJ_NEON_RAKE_ON` puts it back, and it is **one line
in p5h AND one in p4**, not one line altogether: flipping it alone leaves the
blinders on a flat line and CY's own assertion catches it.

**Still his to decide:** the cemetery's missing park (the probe now prices it —
running the hills further does NOT hide it), the sign's red at GO, 181MB of
models, and which way the neon rakes if at all.

**Still owed:** **BY**, the graveyard, the audio join at 4292, the house floor
pool, a park stated as an absolute LINE, `BLIND_BODY`, and `pr6.json`.

## DONE — 2026-08-13: his headset run, all nine things (#164–#170, CZ–DH)

The first time anybody had looked at any of it. Nine items, seven PRs, all
merged.

**RULING DG — THE GOLD COMES DOWN AND THE NEON MOVES ONTO THE BLACK PORTAL.**
*"just for beetlejuice remove the gold prosinium and put the neon where the black
is right now."* WHICH black was asked and answered rather than guessed: there are
two dark frames inside the arch 0.95m apart, and he picked `bj:portal` — the board
false portal — off the two readings drawn out, confirming in the same breath that
the blinders follow the neon in, in all five productions. Legs ±7.75 → **±7.11**,
raked top → **flat at 9.51**, z 1.26 → **0.87**, and everything derived from `BJ`
again, which is where the CH comment always wanted it.

**THE GOLD IS COLLECTED, NOT REPARENTED**, because `p2i`'s `buildRooms()` sorts
`world.children` and all four pieces are already on `STATIC` — slipping a group in
would change what both see for five productions to serve one. **And the STRIKE
puts it back, unconditionally**, not the show: the stage swap strikes too, and a
production that tidied up after itself would miss that path and leave the next
load-in with no proscenium. The negative check for that fires from the other side,
on its own first clause: with the restore gone, the next show finds 0 of 4 up.

**RULING DH — THE SIGN GETS THREE PLACES TO BE.** *"make it so i can make the
beeltjuice sign got to pre show postion to the floor or all the way up."* The old
`inOff`/`outOff` was a boolean dressed as two numbers and **the floor is BELOW
what it called IN** — the fraction clamps to 0 there, so a sign on the deck and a
sign in its pre-show position both read "IN". Three named stops now, declared and
optional, keeping the two-state fields beside them so every existing caller is
untouched. **The floor offset is MEASURED** (`-min.y` of the sign's own world box)
because its foot falls out of a raked arrow's rotation; re-rake the arrow and the
stop follows. Both surfaces, because "a control that exists only in the DOM does
not exist in VR" — and found by META, which is the only reason two buttons
becoming three cost nothing.

**RULING CZ — THE INTERVAL ASSEMBLES IN ORDER.** The frame and the interval music
queue behind CJ's own handover: cloth home → house up → neon strikes → music in.
**And the `stop` half is not held**, which is the part that would have bitten: act
one is the CLOCK track, so holding the whole audio field would have left the
transport firing act two's cues while the curtain was still flying in, straight
past RULING AU.

**RULING DA — THE SECOND HALF STARTS WITH THE FRAME STILL LIT.** The portal is the
one cue field applied unconditionally, so act two's GO saying nothing put it out —
the audience walked back in to a blue frame and it snapped dark. One assertion
reversed in place, and the reasoning was already in the file for act one's GO.

**RULINGS DB, DC — HIS TWO RETIMINGS, AND HIS NUMBERING SURVIVED.** Q39 and Q39.1
both on 1:39:19; Q40 now fires **after** Q41 so the house slides on inside the
blackout. **The plot pushes cues in array order with no sort and showAudioTick
walks by INDEX**, so the firing order IS the array order and the number is only a
label — swapping the entries made "Q40 right after Q41" literally true without
renumbering anything. An assertion caught the blackout carrying the changeover as
a consequence, and Q40 lost its blue look, which is flagged rather than buried.

**RULINGS DD, DE — TWO NUMBERS, AND BOTH WERE UNGUARDED.** Netherworld 6.82m →
4.42m (his second ask); exterior 1.5m upstage. **Changing both left 19/19 green.**
One negative check earned its assertion outright: squashing the recession about
the ORIGIN instead of the downstage frame gives an IDENTICAL depth, so only the
face clause catches the set walking into the audience.

**RULING DF — SETS PARK PAST THE WING, and establishing what it was NOT was most
of the work.** Fifty eyes at ~12,000 rays proved every park already invisible from
every seat, so any assertion on visibility would have passed against the build he
objected to. The fault was the OFFSET: `BJ_SIDE_ROOM` −11.6 → −14.0 and
`BJ_ATTIC_SIDE` 13.9 → 14.4. Stage right stops at the **locking rail**, not its
wall.

**AND I BUILT THE WRONG ANSWER FIRST AND THREW IT AWAY.** Read strictly, "no set
in a wing" leaves only the fly tower, so three sets went up — six of seven flying,
inverting his own CE, losing the CQ/CS side entrances, four assertion reversals.
He corrected it in one sentence. **When a request collides with an existing
ruling, the collision is the thing to ask about**, and I asked two questions
before the one that mattered.

**THE PROBE WAS LYING IN THREE WAYS AT ONCE**, and had been trusted for two
rounds: one eye at the middle of the stalls (the kindest seat), rays aimed at the
picture opening rather than at the sets, and bounding-box CORNERS for sampling,
which gave his one-mesh houses eight samples in mid-air and a confident
`0/450 UNSEEN`.

**THIRTY-ONE NEGATIVE CHECKS FIRED**, every mutation proved present in the BUILT
file **and proved to have changed it**. Three taught something: a mutation can
prove the wrong CLAUSE (the flash-cue portal trips a guard and never reaches the
emissive check); and twice a negative check found a hole in the TEST rather than
the code — the frame check would have *blocked* the rake switch it advertises, and
the sign test never observed the haul mid-travel, so `flyExtraAtStop` reading the
mover's TARGET passed everything.

**New in TRAPS:** the one-eyed sightline probe; aiming at the opening instead of
the subject; a box having corners only, wearing its other hat; establishing what a
complaint is NOT; the request-versus-ruling collision; the mutation that proves
the wrong clause; a literal measured from a constant becoming a tripwire for it;
hiding architecture for one production and who restores it; and the backtick in a
probe comment, three more times at no cost because the lint ran first.

## DONE — 2026-08-13: the first seven of that round (#164–#167, CZ–DF) — folded into the block above

**RULING CZ — THE INTERVAL ASSEMBLES IN ORDER.** *"at the end of the half the
neon light around the proscenium and the intermission music dont come on till the
curtain is fully done and the house lights are on."* RULING CJ already held the
house master for the cloth; this queues the frame and the interval music behind
CJ's own per-frame handover, so the break goes cloth home → house up → neon
strikes → music in. A chain, not a second clock.

**AND THE `stop` HALF IS NOT HELD, WHICH IS THE PART THAT WOULD HAVE BITTEN.**
The interval cue says `audio:{stop:'act1', play:'preshow'}` and **act one is the
CLOCK track** — holding the whole field would have left it running while the
curtain flew in, with `showAudioTick` firing act two's cues off it, straight past
RULING AU. The stop lands on the firing frame and only the `play` waits.

**RULING DA — THE SECOND HALF STARTS WITH THE FRAME STILL LIT.** The portal is
the one cue field applied unconditionally (CH), so act two's GO saying nothing
about it was what put the frame out: the audience walked back in to a blue frame
and it snapped dark as the show restarted. The GO says it now and the flash cue
says nothing, so **that** is what takes it out. One assertion reversed in place,
and the reasoning was already in the file for act one's GO — the pre-show runs
through one GO for the identical reason the interval now runs through the other.

**RULINGS DB, DC — HIS TWO RETIMINGS, AND HIS NUMBERING SURVIVED.** Q39 and Q39.1
both land on 1:39:19, so the netherworld comes on UNDER the black and the white
flash. Q40 now fires **after** Q41: the blackout comes first and the house slides
on inside it, because he watched it travel in full view. **The plot pushes cues in
array order with no sort and `showAudioTick` walks by INDEX, so the firing order
IS the array order and the cue number is only a label** — swapping the two entries
made "Q40 right after Q41" literally true without renumbering anything, which
would have silently changed the language he uses about his own plot.

**AN ASSERTION TAUGHT ME SOMETHING I HAD WRONG THERE.** With Q40 moved behind it,
the BLACKOUT became the first cue after the netherworld to declare
`scene:'interior'` — so the blackout carried the changeover and the room appeared
while its own one-second fade was still going down. "The set never changes in
view" named the cue. The blackout is still the netherworld now, merely dark.
**And Q40 lost its blue look**, which is a real change to his plot and is flagged
rather than buried: a set that slides on in the dark cannot also be lit.

**RULINGS DD, DE — TWO NUMBERS, AND BOTH WERE COMPLETELY UNGUARDED.** The
netherworld 6.82m → 4.42m (his second ask), his exterior 1.5m further upstage.
**Changing both left all nineteen suites green**, which is the finding. One
negative check earned its assertion outright: squashing the recession about the
ORIGIN instead of the downstage frame gives an identical depth, so the arithmetic
passes perfectly while the whole set walks 1.5m into the audience — only the
face clause catches it.

**RULING DF — SETS PARK PAST THE WING, AND ESTABLISHING WHAT IT WAS NOT WAS MOST
OF THE WORK.** Fifty eyes at ~12,000 rays proved every park already invisible from
every seat, so any assertion on visibility would have passed against the build he
objected to. The fault was the OFFSET: parks were sized to just clear the masking
and stopped. `BJ_SIDE_ROOM` −11.6 → −14.0 and `BJ_ATTIC_SIDE` 13.9 → 14.4 —
bedroom 0.49m → 2.89m clear, closet → 2.69m. **Stage right stops at the LOCKING
RAIL (x −19.2), not at its wall**, because CE was written when the wagon was
parked on the flyman's working space. Only the netherworld, exterior and roof fly,
which is his correction.

**AND I BUILT THE WRONG ANSWER FIRST AND THREW IT AWAY.** Read strictly, "no set
in a wing" leaves only the fly tower, so three sets went up — six of seven flying,
inverting his own CE, losing the CQ/CS side entrances, four assertion reversals.
He corrected it in one sentence. **When a request collides with an existing
ruling, the collision is the thing to ask about**, and I asked two questions
before the one that mattered.

**THE PROBE WAS LYING IN THREE WAYS AT ONCE.** One eye at the middle of the
stalls; rays aimed at the opening rather than at the sets; and bounding-box
corners for sampling, which gave his one-mesh houses eight samples in mid-air and
a confident `0/450 UNSEEN`. It also now prices the open cemetery question:
**running the hills further does NOT hide it** — 186 rays → 45 → and back up,
because `bj:hill`, `bj:gate` and `bj:moon` return to view as the hills clear.

**EIGHTEEN NEGATIVE CHECKS FIRED**, every mutation proved present in the BUILT
file **and proved to have changed it** before the result was read. Two taught
something: a mutation can prove the wrong clause (giving the flash cue a portal
field trips the guard and never reaches the emissive check), and a clause that
cannot fire should say so in the file rather than look live.

**New in TRAPS:** the one-eyed sightline probe; aiming at the opening instead of
at the subject; a box having corners only, wearing its other hat; establishing
what a complaint is NOT; the request-versus-ruling collision; the mutation that
proves the wrong clause; a literal measured from a constant becoming a tripwire
for it; and the backtick in a probe comment, sixth time.

## NEXT SESSION: **PUT IT ON THE HEADSET** (2026-08-13, late) — SUPERSEDED, see above

Cache-bust **`?v=25`**. **Read STATE.md — it carries the full left-to-do list
with the rulings written out.** What belongs here is the shape of it.
Rulings are at **CY**.

**EVERYTHING IS MERGED AND `main` IS AT `d89144f`.** #155–#162, verified after
the merge: `main` rebuilds byte-identical, the full suite is green on the merged
result, and all seven work branches are deleted. **Nothing is open.**

**IT TOOK AN EIGHTH PR, AND THAT IS THE WORKFLOW LESSON.** #156–#161 were stacked
— each based on the branch before it — and **a stacked PR merges into ITS BASE**,
so merging all seven collapsed them up the stack and only #155 reached `main`.
#162 was one clean merge from the stack tip. Nothing was lost, and that was
measured rather than assumed: `main`'s tree hash equals the stack tip's, and the
six leftover branches held zero commits `main` lacked. **Base every PR on `main`
even when building a chain** — CLAUDE.md says so and this is why.

**HE ASKED FOR ELEVEN THINGS AND ALL ELEVEN ARE BUILT.** Nine of them were one
subject — a traffic plan — and it is settled: four slots, every set in exactly
one, and `tools/parked.js` reports what it has never reported before, **`none —
every parked set has its own space`**.

**NOBODY HAS LOOKED AT ANY OF IT.** Not the sets from three rounds ago, not the
parks, not the netherworld, not the neon frame from yesterday, and certainly not
this round's. The questions, in the order they will bite:

1. **Does the neon read on the gold?** 15.88m across with a straight top **raked
   one way** — high stage right at 10.72, low stage left at 8.6 — and nothing
   across the deck. A completely different shape from the closed 13.6m rectangle
   RULING CH built the day before, and the rake is his own correction.
2. **Do bodiless blinders read as light out of the bar**, or light out of
   nowhere? `BLIND_BODY` is one line back.
3. **Is a thinned roof a roof?** `BJ_THIN` 0.28 steepens its slope, and that is a
   non-uniform scale this file otherwise refuses.
4. **Do the new entrances read** — the attic from stage left, the bedroom and
   closet from stage right, the house from behind the backdrop?
5. **Is the SETS page useful in a headset**, and is "where it is standing" the
   right thing for it to say?
6. Carried: the houses at 13.6 × 12.76, `BJ_FILL_MAX`, the netherworld at 6.90m,
   `BLIND_POWER` 4.6, the house at 0.15, 25 seconds of nothing at the top.

**THREE DEFECTS NOBODY ASKED ABOUT, all found on the way past.** Every parked set
stood **visible in its acting position the moment the show loaded** (RULING BQ
made a struck set stay drawn, and the instant swap struck nothing); the exterior
parked with its foot 0.2m inside the picture, on the SIGN's fly-out number
borrowed by a set; and `bjApplyModel` routed by **counting** part movers, so a
set with a park as well as a wrapper landed its model outside its own mover.

**Still his to decide:** which way the neon rakes (`BJ_NEON_RAKE`, one sign, and
the blinders follow it); the sign's red at GO;
the cemetery's missing park; 181MB of models; and whether the netherworld should
be narrower.

**Still owed:** **BY**, the graveyard, the audio join at 4292, the house floor
pool, **a park stated as an absolute LINE rather than an offset** (which is what
would let the flown sets stop sharing the tower), and `pr6.json`.

## DONE — 2026-08-13 (late): eleven things in one message (#155–#161, CN–CY)

He watched the parked-sets round and came back with eleven items. **Nine of them
were one subject** — where every set comes from and where it stands when it is
off — which is a traffic plan, and traffic plans have to be settled all at once
or the sets stand inside each other.

**THE TRAFFIC PLAN (CO–CS): four slots, and every set in exactly one.** The house
upstage behind the backdrop and nothing else there; the attic stage left; the
bedroom and the closet stage right; the roof, netherworld and exterior flown.
`tools/parked.js` now reports what it has never reported: **`none — every parked
set has its own space`**.

**RULING CO TURNS ON A COMMENT THAT STOPPED BEING TRUE.** RULING BQ parked the
wagon in a wing and wrote down why it could not go upstage: *"12.98m does not fit
between the backdrop at −10.90 and the brick at −21.5."* True when written.
**RULING CL moved the brick to −25.5 for a completely unrelated reason** — his
house was standing 3.28m out in the street at the curtain call — and the gap went
**10.60m → 14.60m**. His room fits with 1.62m to spare at the offset the wagon
already had, so CO changed *which mover parks the house* and not one number. **A
comment that rules something out on a number is a fact with a date on it**, and
that is now in TRAPS.

**RULING CS is the one that needed measuring rather than choosing.** The bedroom
is 8.62m wide and the closet 9.02m: 17.64m of room for a 14.5m wing. They do not
fit abreast and no number makes them, so they stand one behind the other — both
track in from the side, and the closet parks 6m further upstage on a second
mover. Without it they park inside each other by 8.6 × 5.6 × 4.2m.

**RULING CT — a flown set is thin**, and it is a **non-uniform scale, which this
file otherwise refuses** (CB kept the fit uniform to avoid distorting every door
in the house). His roof 10.00 → 2.80m, his exterior 8.77 → 2.46m, our stand-in
roof 5.00 → 1.50m with its walkable deck coming with it. **What the thinning did
NOT buy was tried before it was written down:** thin sets should hang on separate
lines, and they cannot — our exterior is a cloth at z −7.35 and his seats at the
arch, a park is an OFFSET, and no single number lines both up. The honest gain is
the SIZE: the deepest set-inside-set went **8.77m → 2.46m**. **A park stated as an
absolute LINE** is what would fix it, and that is an engine change, so it went on
the owed list rather than into the PR.

**RULING CN — one house in the world.** RULING AQ already said this and the code
did not do it: `bjRedress` darkened the other two dressings and left them in the
world, which was fair while a dressing was our own furniture and became **280,540
triangles — three complete houses of his in the same 13.6m of stage** once BP
landed. A dressing that is not worn is detached from the scene graph now and held
on `SHOW.offstage`. **Not a dispose** — re-fetching a 27MB file nine times an
evening is worse. Two sweeps had to learn about it and **both would have failed
silently**: `lockShowStatic` would have left a held house unfrozen, and
`showStrike` would have leaked a house and a half of geometry per show change.

**RULING CU — the marquee goes dark as it flies**, as a GATE rather than a
repaint: what a cue asked for is remembered and the gate multiplies it, so a red
survives underneath and comes back when the sign does. A sign with **no** mover is
left alone rather than switched off for ever.

**RULINGS CV, CW — the two menus.** The desk has had a set menu all along and the
headset has not, so the VR console grew a SETS page that says **where** each
struck set is standing. The sign cannot be a lineset — every lineset is upstage
of the plaster line and the sign hangs downstage of the curtain — so the rail
carries hauls the show declares, drawn on the desk and in the headset both.

**RULINGS CX, CY — the neon and the blinders.** The frame moved out to the
architectural proscenium, tracing p2b's gold band at x ±7.75 and z 1.26, with no
sill. **And the peak is 10.375, not 12.15**: a quadratic sits at a
quarter/half/quarter of its three points, not at its control point, and reading
the control point as the apex would have put the neon a metre and a half too
high. Built first as two chords meeting at the centre and **flagged as the open
reading of his sentence** — he corrected it (*"slanted just one way not from the
center"*), so it is one bar raked right across, high stage right and low stage
left, the way the marquee's own arrow leans. The blinders have **no body at all**
and sit on that same line.

**THREE DEFECTS NOBODY ASKED ABOUT, all found on the way past:**

- **Every parked set stood visible in its acting position the moment the show
  loaded.** RULING BQ made a struck set stay DRAWN and `sceneShow` — the instant
  swap, which is what `showLoad` uses — drove the movers of the set coming ON and
  **nothing at all** for the sets going off. Nothing caught it because the probe
  and every assertion drive a CHANGE first. Found by the sets menu.
- **The exterior parked with its foot 0.2m inside the picture**, flown to the
  SIGN's number borrowed by a set.
- **`bjApplyModel` chose its route by COUNTING part movers**, so a set with a
  park as well as a wrapper took the cemetery's route. It showed up as the roof
  measuring as an **empty box**. A count is not a kind.

**TWENTY-SEVEN MUTATIONS NEGATIVE-CHECKED**, every one proved present in the
BUILT file before the result was read — and **two of them said an assertion was
weak, which is what they are for**. "The set call is choreographed" had picked
the exterior, which carries no part movers at all, so an instant-swap mutant had
nothing to travel and sailed through. And the neon's rake line had its sign
inverted while the **blinders and their own assertion both carried the same wrong
line** — they agreed with each other perfectly and passed; only the check that
measures the BUILT GEOMETRY against the line, instead of re-computing it,
disagreed.

**Seven assertions reversed in place** (the AO/AV/BA/BI/BZ precedent, seventh
time), each exemption **named** rather than the rule loosened — and the attic's
was reversed for the *third* time and needed one line, because the last round had
written its clearance check on whatever axis the mover uses.

**A NINETEENTH SUITE, AND IT TESTS THE TESTS.** `tests/probe-lint.js` sweeps every
probe template for the three characters that break it — a backtick anywhere
including in a comment, and a singly-escaped quote. TRAPS records that trap three
times and says *"sweep for it mechanically rather than trusting care"*; I walked
into it twice in this round before writing the sweep. It runs first in `npm test`
and deliberately does not flag doubled escapes or deliberate interpolations,
because a lint that cries wolf is a lint nobody runs.

**New in TRAPS:** a comment that says something is impossible is a fact with a
date on it; a probe reading a game `const` that was never in its handout prints a
confident wrong answer; and **a BoxGeometry has vertices only at its CORNERS**, so
per-vertex sampling of a merged frame measures nothing between them — it bit
twice in one PR, once throwing against a correct build and once **passing against
a broken one**.

**AND THE MERGE DID NOT LAND WHERE IT WAS POINTED.** The six PRs after the first
were stacked, each based on the branch before it, so merging all seven collapsed
them **up the stack** and only #155 reached `main`. **#162** was the recovery: one
clean merge from the stack tip, no conflicts, and nothing lost — `main`'s tree
hash equals the stack tip's and every commit of the round is an ancestor of it,
both checked rather than assumed. CLAUDE.md's "never stack PRs" is written for
exactly this: build a chain sequentially if you must, but base every PR on
`main`.

## NEXT SESSION: **PUT IT ON THE HEADSET** (2026-08-13) — SUPERSEDED, see above

Cache-bust **`?v=24`**. **Read STATE.md — it carries the full left-to-do list
with the rulings written out.** What belongs here is the shape of it.

**THE WHOLE ROUND IS MERGED: #149 → #150 → #151 → #152 → #153**, in that order,
a linear chain built one on the next at his instruction ("dont wat foe me to
merge to keep going just keep going"). `main` rebuilds byte-identical and the
suite is green on the merged result. **Nothing is open and nothing is shelved.**

**HE SENT THIRTEEN THINGS IN ONE MESSAGE and all thirteen are built.** Two
features (the neon proscenium, a START OF SHOW call on the fly rail), one fault
report against RULING CA, one piece of building, and nine corrections to his own
plot. Rulings **CF–CM**. He also gave the reading order himself — *"(all of these
are in order od there appearance)"* — and it is what disambiguates item 8.

**THE NUMBER THREE HANDOFFS HAVE CARRIED AS UNRESOLVED IS SETTLED.** *"1 minute
into the audio (not acounting for the 32 seconds)"* was read as `at:60` and never
confirmed. *"time stamp 1:00 in the audio"* is the same number said plainly. It
is his now.

**NOBODY HAS LOOKED AT ANY OF THIS.** Not the seven sets from two rounds ago, not
the parks, not the netherworld, and now not the neon frame. The questions, in the
order they will bite:

1. **Does the neon bar read at 0.34m?** `BJ_NEON_BAR` is a guess against his one
   adjective, "thicker". So are `BJ_NEON_BLUE` 0x4fa8ff and the 1.2/s fade.
2. **Are the blinders right inside the portal?** They moved from x ±8.12 round
   the arch to x ±6.2 inside a 13.6 × 9.2 picture — **in all five productions** —
   and the 1:16 white flash still has to read on the cloth behind them.
3. **Does twenty-five seconds of nothing at the top play?** GO now starts the
   music and changes no light until 1:00. On paper it is a held pre-show; in the
   room it may read as a dead patch.
4. **Is the house at 15 low enough to see the beams and high enough to be a
   house?** 0.45 → 0.30 → (0.12, specified and never built) → 0.15, and this one
   is his.
5. **Do the houses read at 13.6 × 12.76 with 3.56m behind the border?** Still the
   biggest single unknown, carried from two rounds ago.
6. **Everything hardware still owns:** `BLIND_POWER` 4.6, `BJ_FILL_MAX` 0.55, the
   audio join at 4292, the netherworld at 6.90m over black.

**ONE JUDGEMENT CALL THAT IS HIS TO OVERRULE.** The sign's red moved to 1:00 with
the proscenium's. His original act-one line was ONE sentence about both, and
leaving the sign red at GO would put the only red thing in the house on a stage he
has just said should not be red yet. **One line back.**

**Still owed:** **BY** (standing on his geometry, 4.29ms, deferred with three ways
out), the graveyard he has never supplied and the show opens in, the house floor
pool, and `pr6.json`, still untracked and unruled.

## DONE — 2026-08-13: thirteen things in one message (#149–#153, CF–CM)

He watched it and wrote thirteen items out, in the order they appear in the show.
All thirteen are built, as five PRs in a linear chain.

**HE REPORTED A FAULT AGAINST RULING CA AND HE WAS EXACTLY RIGHT (CF).** *"The
lights for the beetlejuice sign arent on the sign they are just a box around
it."* CA read *"you just have to add the lights"* as new geometry and hung a bead
ring and a tube outline round his model's **bounding box** — two crude rings
outside a 99k-triangle marquee that has its bulbs and tubes modelled in. **And the
sign was dark underneath them**, which is the half nothing was looking at:
`bjApplyModel` registered it for the RULING CC set fill, which drives emissive off
**the stage rig's** output, and the plot's first cue is *"PRE-SHOW … the sign
lit"* with the rig at zero. His marquee sat at 0.000 for the whole pre-show while
our ring burned at 1.8. His own materials are the lamps now, self-lit off his
painted detail. CA's silent-failure guard is kept, not dropped.

**THE PROSCENIUM NEON IS HIS NOW, NOT A PHOTOGRAPH'S (CH).** `bj:portalTrim` — a
blue-green tube frame with wing returns and hoops, **always lit** — is gone.
`bj:portalFrame` is one closed rectangle of 0.34m bar, 13.60m across, four boxes
merged to one mesh on one material, **built dark**, driven by a
`portal:{col,lvl}` field applied on **every** cue so a cue that says nothing puts
it out. Measured: **8 cues light it, 87 leave it out, red only at 1:00.** The
engine is the shelved `bj-portal` branch (`a22bd36`) rebased — after three
handoffs of "start from there", it was right and only the geometry and the plot
changed. **Not `neonTube`**, inside x ±7.4, and **one material** — which is not an
inversion of "a material per tube is REQUIRED", because that rule is
`updateNeon`'s and this frame is not on `SHOW.neon`.

**AND NOTHING HAPPENS TO THE LIGHT AT GO ANY MORE (CG).** *"the red lights
shouldnt come on as soon as you press go and the house light shouldnt go don when
you press go. They should both happen at time stamp 1:00 in the audio."* GO is
now the music, the foyer and nothing else. **This settles `at:60`**, carried as an
unresolved reading through three handoffs. **An assertion found a fifth cue at
15** — act two's own GO, the tail of the interval with the audience coming back
in. And **the sign's red moved with the proscenium's on a judgement call**, named
in the PR and one line to reverse.

**HIS NINE RETIMINGS, AND HIS PARENTHESES ARE A RULE (CK).** Six carry *"(dont
change any light cues just the set change)"*, so where a cue does both, retiming
**splits** it: the set change takes the new second carrying the look already
standing, the light cue keeps its own. **Item 7 lands on his own blackout and that
is the point** — 1:30:00 plus 55 seconds is 1:30:55, his *"Lights blackout"*, so
the house comes on and the stage goes black over it. **Item 8 is the one his
ordering line resolves**: "slide back **on**" is 1:53:00 and not 1:39:19, and
against 1:39:19 the following blackout is three seconds later, so moving that ten
seconds earlier would put it before the change it covers.

**TWO GATES, BOTH DECLARED AND NEITHER ASSUMED (CI, CJ).** A cue move may name a
fly line it waits on — a gate on the **move**, not a delay on the cue, riding the
frame like `sc.mvHide`; measured, the wagon holds **716 frames** while the cloth
flies and sets off on 717. And a cue may hold the house master until the front
traveler is home **and** its halves are together.

**THE PALACE GOES DEEPER AGAIN, AND HIS MODEL IS THE BINDING CASE (CL).**
`PAL_DEEP` 4.5 → 8.5. His interior slid back measured **z −24.78 .. −11.80**
against a brick at −21.50 — **3.28m of house out in the street**, in the cue that
plays in full view at the curtain call. The stand-in is 7.68m deep and cleared by
2.26m, and the assertion that guards this lives in the synchronous probe, which
fetches nothing — so it had only ever measured the stand-in and always passed.
**The exact inverse of the RULING BQ trap.** New probe: `tools/deeper.js`.

**A START OF SHOW CALL ON THE FLY RAIL, DESK AND HEADSET (CM).** The loaded
show's own first cue — `CUES[0]` already carries a full fly snapshot — applied
through `flyTo`. A rail call, not a cue: `cueTop` fires the cue (BW) and doing
both from one button would make the fly rail start the show, which is the fault BW
exists to fix. Placed at the foot of the VR column because `tests/vr.js` pins the
FOH and speaker rows **by literal pixel**.

**MY OWN TESTS WERE WRONG FOUR TIMES AND EVERY ONE TAUGHT SOMETHING:**

- **"It fires nothing" was written straight after `showLoad`**, which leaves the
  board standing AT cue 0 — so a mutant calling `cueFiredByHand(0)` moved the
  pointer from 1 to 1 and the house from 0.30 to 0.30, and every check passed
  against a build where the fly rail started the show.
- **A re-anchored test picked its subject by the property it then asserted** —
  "the next cue whose aims are not up", then "its aims are not up". It takes the
  next cue by POSITION now.
- **`null >= 0` is TRUE in JavaScript.** Loosening a strictly-positive follow test
  to non-negative reclassified both deliberate holds as cues that arm the next
  one, and the code was right.
- **A guard nothing in the delivery exercises cannot be negative-checked.** "Fully
  closed" means the halves too, and this show's curtain FLIES — deleting that
  clause changed nothing. It has its own fixture now.

**FOUR SUITES WENT DOWN TO THE FURNITURE TRAP, ONE LEVEL UP.** The shed and every
piece of furniture in it rode `PAL_DEEP` correctly — that lesson had taken. What
broke was **the tests**, still probing literal −25 and −35 measured against the
first position of that wall, which are now shed floor and open stage. All four are
re-expressed off `SHEDS.palace` and `ROOMS.shed`.

**AND THE BACKTICK TRAP BIT THREE TIMES IN ONE ROUND**, always in a comment,
always quoting an identifier in prose. It is in TRAPS twice already; the finding
is the frequency, and the fix is a mechanical sweep rather than care.

**Nineteen mutations negative-checked**, each proved present in the BUILT file
before the result was read — which is what caught the two weak assertions above.

## NEXT SESSION: **THE NEON PROSCENIUM** (2026-08-12, late) — SUPERSEDED, see above

Cache-bust **`?v=23`**. **Read STATE.md — it carries the full left-to-do list
with the rulings written out.** What belongs here is the shape of it.

**HE ASKED FOR THREE THINGS AND TWO ARE BUILT.** The proscenium is the one left,
and it is the only unbuilt ruling in the sequence: **BR/BS/BT/BU**. Rulings are at
**CE**.

**START FROM THE SHELVED LOCAL BRANCH `bj-portal`** (`a22bd36`, RULING AX). It
already built the engine and was never opened: one merged mesh on one material,
**built dark**, `SHOW.bjPortal` parked by the stage swap, a `portal:{col,lvl}`
field applied on **every** cue so a cue that says nothing darkens the frame, and a
`dt` fade riding `updateStorm`. That default-dark behaviour is exactly what *"the
only times the lights in the neon tube are…"* asks for — **the engine is right and
only the plot changes.** Expect conflicts rebasing it: the split rule in
`showCueExtras`, the p5h repaints, BJ's edits to cues 1.1–1.4, and now BQ/CE's own
p5c/p5h work.

- **BR** widen the frame to his broad bright bands, inside x ±7.4.
- **BS** lit at exactly three times: blue pre-show, blue from GO, **red at 1:00**,
  blue in the netherworld, dark otherwise — which **takes the red off the eight
  blinders at GO**, a misreading of his own act-one line.
- **BT** the house starts at **0.12** and goes out with the red (supersedes BM's
  0.30).
- **BU** the blinders move inside the proscenium at z 1.35. **Check the curtain's
  z first** — the 1:16 white flash must still read.

**Not `neonTube`** (CatmullRom overshoots a right angle) and **a material per
tube is required**, because `updateNeon` writes a colour into every registered
mesh every frame.

**THE ONE NUMBER HE HAS NEVER CONFIRMED.** *"1 minute into the audio (not
acounting for the 32 seconds)"* is read as **`at:60`**. His *"the red lights
coming on to soon"* does **not** settle it — the red he saw is the blinders at
0:35, and both readings are later than that. One line either way.

**THE START-OF-SHOW LIGHTING STAYS DEFERRED** at his instruction ("dont do the
lights… just wait") — but **BS and BT are his own rulings and they already answer
both halves of his complaint.** Whatever he still sees after the proscenium is the
real lighting round.

**NOBODY HAS LOOKED AT ANY OF THIS.** Not the seven sets from the round before,
not the parks, not the netherworld. The questions, in the order they will bite:

1. **Do the houses read at 13.6 × 12.76, with 3.56m behind the border?** Still the
   biggest single unknown.
2. **Do the tracked entrances read?** A set sliding in from a wing instead of
   flying is different stagecraft, and `BJ_TRACK_SPEED` 2.0 is a guess.
3. **Is `BJ_FILL_MAX` 0.55 lit, or glowing?** One line in `p5i`.
4. **Is the netherworld right at 6.90m deep over a black ground?**
5. **Is `BJ_HOUSE_UPSTAGE` 1.5m right**, and was "slide up" upstage at all?
6. **Everything hardware still owns:** `BLIND_POWER` 4.6, the audio join at 4292,
   the colour that is HIS not ours.

**Four decisions that are his, all with numbers:** the netherworld is the one
flown set he did not name (14.4m wide fits no wing — *narrower* is what would buy
it a slot); the cue at 1:14:30 still flies the exterior out, which is his own plot
line; the cemetery declares no park (46.8m wide against a 44m stage); and 181MB of
models with ~70MB thrown away at load.

**A false alarm worth not repeating:** the show OPENS in the cemetery, which he
never modelled, and stays there until **10:40**. The first ten minutes are OURS,
and 165MB takes minutes over wifi with the stand-ins playing until each file
lands — **looking too early shows ours.**

**Still owed:** **BY** (standing on his geometry, 4.29ms, deferred with three
ways out), the graveyard he has never supplied, the house floor pool, and
`pr6.json`, still untracked and unruled.

## DONE — 2026-08-12 (late): the top of the show, parked sets, and how sets travel (#146–#147, BW/BQ/CE)

Three asks in one evening, each revising the last, and he named the order himself.

**HIS BUG REPORT WAS EXACT AND THE CAUSE WAS NOT WHERE THE SPEC SAID.** *"when i
try to press go to go to top os show it starts the show."* Both TOP buttons moved
the pointer and nothing else, so GO was the only way forward — **RULING BW**. The
previous round's spec predicted this composed with RULING BO for free because cue 0
carries its own `audio` and the jump-seek declines. The seek does decline, **and
the seek is not what bites: the transport is.** The pre-show cue does not stop act
one — only the GO cue does — so a hand-fired cue 0 leaves a `clock:true` track live
and on the **next frame** `showAudioTick` fires the GO cue off a playhead already
past 0:35. Measured on the built file: **TOP then GO put the board back at Q1.1
with the house at 0 in two frames.** So the sound stops FIRST and the cue fires
second, or the stop kills the pre-show music the cue itself asks for.

**RULING BQ — A STRUCK SET IS NEVER GONE, and the pick is what it cost.** A scene
may declare a **park** and stands there struck, solid and visible; a scene with no
park is switched off exactly as before, which is what leaves the other four
productions untouched. `layers.disableAll()` was doing **two** jobs — not drawn
*and* not raycast — and BQ only wants the first back. One crosshair ray, 200
calls, his models loaded: **1.11ms parked with the raycast opt-out against 9.23ms
without — 8.3×, 83% of a 90Hz frame — from the wings looking at the parked
house**, and 1.0× either way from a seat, because off-axis the bounding sphere
rejects for nothing. RULING BY's shape exactly, and **where you point is the whole
cost**: the seat figure is the misleading one, and walking backstage to look at
the parked set is the case the ruling *invites*. 582,736 triangles stand parked.

**RULING CE — AS FEW SETS FLY AS POSSIBLE**, and it improved the parking, which
was not the reason for it. `bjFlyWhole` became `bjTrackWhole(sc, axis, out,
speed)`; flying is the **y** case. Flying preserves x and z, so every flown set
wants the same volume in the one grid — the four that still fly overlap in **six
pairs**, worst 12.30 × 7.95 × 8.15m, and four sets 5.6–9.2m tall cannot stack
under a 25m grid. The three tracked sets each have their own floor space.

**The fly rail is stage right and that was read, not assumed** — `p9` builds the
locking rail at `-D.stageW/2 + 2.8`, x −19.2. **And asking for the exterior there
exposed a fault in the commit before it:** the wagon had been parked stage right
reaching x −20.8, standing **on the pin rail and the flyman's working space**, and
nothing had checked it. The wagon took stage left, the attic went upstage, and the
building turned out to have **exactly three horizontal slots** — which is why four
of nine still fly.

**THE NETHERWORLD, to his words and one correction.** "Thinner" was read as the
frame members first; *"i meant the set shouldnt be as deep"* — so the members went
back to BV's 0.15 and the **recession** was squashed about the downstage frame,
which does not move: **12.45m → 6.90m**. Backdrop **black**. "All blue" was
already true and its assertion still passes, recorded so it is not re-litigated.

**TWO REAL DEFECTS THE TESTS FOUND, AND BOTH WERE MINE.** The dress deferral
judged "can the audience see this set" as `!sceneOff` — and its own comment says
why: a set mid-exit is marked off while its layers are still on. BQ makes a parked
set drawn *on purpose*, so that test **inverted**: a dress cue on the parked wagon
deferred **for ever** and the room was called on still wearing the old dressing,
the exact pop RULING AY exists to prevent. And **the parks were sized to his
models while the stand-ins did not fit** — the exterior's stand-in is a 12.6m
painted drop (a drop FILLS the opening, which is why it used to fly), so a park
fitted to his 8.6m house left the fallback at x −4.70, in the middle of the
picture; the attic went the other way and put the stand-in 0.90m through the
brick. **The stand-in is the bigger case and the one that plays** on a fresh
clone, over slow wifi, and in every suite.

**ELEVEN ASSERTIONS REVERSED IN PLACE** — the AO/AV/BA/BI precedent, fifth time —
each watched failing against the pre-change build and passing after. The
netherworld backing is the clearest argument for turning one round rather than
dropping it: only the **colour** half is superseded, while *not registered as
neon*, *MeshBasic*, *upstage of every frame* and *inside the picture* are all
untouched and load-bearing. The attic's fly-out test was reversed **twice over**
(CE changed its axis, BQ stopped it going dark) and is written on whatever axis
the mover uses now, so the next re-routing will not need it rewritten a third
time. **Four new assertions**, each negative-checked against a wrong
implementation with every mutation proved to have landed in the built file.

**One fixture rebuilt rather than patched:** "a set with NO part movers changes
instantly" borrowed the exterior and the bare stage as its part-less pair, and CE
gave the exterior a tracked entrance — leaving exactly one part-less scene in the
production. It builds its own pair now, because borrowing a show's scenery to test
an ENGINE rule dates the test to that show's choreography.

**And one of my own proxies was simply the wrong one:** "it has vacated its acting
box" is not "out of the picture". The brick bounds the attic to 8.8m against a
9.6m stand-in, so 0.8m of the old footprint stays occupied and that is harmless —
what hides an upstage park is the **backdrop at −10.90** in front of it.

**New probe, `tools/parked.js`** — where every struck set goes, what it fouls,
whether a stalls eye can see it, what it costs to draw and to pick, and whether
eight parked sets stand inside each other. **It got four things wrong before it
got them right** and each is written into its header: travel measured from the
CENTRE said the cemetery never moves (its hills go to opposite wings, so the BOX
is what changed); visibility cast against the set alone said every flown set is in
the picture (a ray through the top of the opening rises 0.65m per metre upstage —
but the border is in the way); it measured a shut house curtain for four runs; and
an `unhide` that restored only layers left every "parked" set undrawn, so the pick
read 1.0× because nothing had been parked.

**New in TRAPS:** a hand-fired cue that does not stop the transport; a probe-scope
`const` shadowing a game function (it made two existing assertions decoration for
a whole round); a park fitted to his model parking the stand-in in the picture;
`sceneOff` meaning two things and BQ splitting them; layers doing two jobs with
only one wanted back; and a wrapper group inserted to carry a mover breaking
whatever reads the scene's structure.

## NEXT SESSION: **PUT HIS SEVEN SETS ON THE HEADSET** (2026-08-12, evening) — SUPERSEDED, see above

Cache-bust **`?v=22`**. **Read STATE.md — it carries the full left-to-do list
with the rulings written out.** What belongs here is the shape of it.

**FIRST, MERGE THE CHAIN: #141 → #142 → #143 → #144, in that order.** They were
built on each other and opened ahead of merging, at his instruction ("dont wait
for me to merge pr's to keep going just keep going"). #136–#140 are already in.

**ALL SEVEN OF HIS MODELS ARE IN THE GAME.** Every one passes every budget —
93k–99.5k triangles, one material, one draw call. They were verified loading,
applying, fitting and shrinking their textures **in a real browser**, not just in
jsdom. What has NOT happened is anybody seeing a frame of it: the browser pane
never composited, so **nothing about how any of it LOOKS has been observed.**
That is the whole of the next session.

**The questions, in the order they will bite:**

1. **Do the houses read at 13.6 × 12.76, with 3.56m of them behind the border?**
   His ruling, and his cost — "its fine if the house is a little taller than the
   prosinium" — but the biggest single unknown in the round.
2. **Is `BJ_FILL_MAX` 0.55 lit, or glowing?** RULING CC makes an imported set
   light itself off its own texture, because the rig aims where our stand-ins
   were and his houses are 12.98m deep. One line in `p5i`.
3. **Is `BJ_HOUSE_UPSTAGE` 1.5m right** — and **was "slide up" upstage at all?**
   Read as upstage, the theatre sense. If he meant the wagon should PARK further
   off, that is `BJ_WAGON_BACK`.
4. **The exterior lands 8.63m wide** in a 13.6m opening. Deliberately not
   filled: nearly a cube, so filling it masks **28.5%** of its surface, and for a
   house seen from outside that is the roofline. His call. The attic (13.06) and
   roof (12.30) are within 0.6m of flush.
5. **Does the netherworld read as his picture** — tilted trapezoids, all blue,
   over a dark ground?
6. **Everything hardware still owns from the last two lists** — `BLIND_POWER`
   4.6, the audio join at 4292, the colour that is HIS not ours.

**Two things that are his to decide, both with numbers attached:**

- **181MB, and ~70MB of it is thrown away on arrival.** Every file carries a
  4096 normal map that RULING BP shrinks to 2048 at load. Re-encoding to 2048
  JPEG takes each from ~27MB to a few MB. Same class as the texture shrink, but
  it rewrites HIS asset, so it was flagged and not taken.
- **RULING BY is measured and deferred.** Standing on his geometry costs
  **4.29ms — 38.6% of a 90Hz frame** against 0.0018ms for the stand-in it
  replaces (`tools/walkcost.js`). So **the roof and the house landing are not
  standable while his models are loaded.** Three ways out, none free: leave it, a
  collision proxy sampled at import (~0.6s hitch), or a `walk_` node in the file.

**A false alarm worth not repeating:** the show OPENS in the cemetery, which he
never modelled, and stays there until **10:40**. Load, press GO, and the first
ten minutes are OURS. His work starts at cue 7 (10:40, the interior, 56 cues),
then 32:50 attic, 56:00 roof, 1:11:32 exterior. And 165MB takes minutes over
wifi with the stand-ins playing until each lands — **looking too early shows
ours.**

**Still unbuilt and still wanted:** the neon proscenium (**BR/BS/BT/BU**) on the
unopened local `bj-portal`, with its one unconfirmed number (`at:60` vs 95);
**BW**, TOP firing the first cue; and **BQ**, a struck set parking backstage,
which is still the biggest item on the list.

## DONE — 2026-08-12 (evening): his seven sets into the house (#136–#144, BX–CD)

He delivered all seven models and said "start with adding the sets in" — and
**adding them in turned out not to be a file copy.**

**A NEW PROBE FOUND THAT EVERY SET WOULD HAVE LANDED WRONG, AND NONE OF IT WAS
HIS FAULT.** `tools/models.js` scans the glb bytes for the things budgets care
about, then serves his files to the real `loadSetModels` and measures what lands
**in world space against the frame it has to be seen through** — which nothing in
the repo had ever checked, because every budget is about cost. It found the
houses standing **12.01m tall in a 9.20m opening**, every set deeper than the
stage, and both flying sets **centred on z = 0 where the proscenium stands**, so
5.13m and 5.45m of set hung out over the audience. One root cause: `bjFitAndSeat`
fitted WIDTH and seated only Y (**RULING BX**).

**HE THEN OVERRULED THE FIX, AND WAS RIGHT.** Capped by height, his houses landed
9.49m wide in a 13.6m opening — two metres of bare stage each side. "make the
houses wide enought to stretch from one side of the prosinium to the other …
its fine if the house is a little taller than the prosinium." Measured before
choosing, by binning triangle **area** by height: filling the width puts **7.1%
of the surface behind the border**, and the bottom 0.6m alone holds 26.8% — the
profile of a roof tapering away, which is what a border is for (**RULING CB**).
Uniform scale throughout: 43% of horizontal stretch would have distorted every
door in the house.

**WHICH HOUSE IS WHICH WAS VERIFIED, NOT TRUSTED.** All three are geometrically
identical and all three came out of a tool called `deetz_house`, so the
base-colour PNG was decoded out of each: warmth (mean R−B) **+15.3 / −4.4 /
−10.9** orders them Maitland / Deetz / Beetlejuice unambiguously.

**Nine rulings.** **BX** a set is fitted to the room, not just its width.
**BZ** the exterior is a model, with **two assertions reversed in place** (the
AO/AV/BA precedent, fourth time). **CA** the sign is his geometry and OUR
lamps — and the lamps are two **materials**, so without re-fitting geometry to
them both would have survived registered, tintable and used by nothing, with
every `signCol` cue in the plot tinting a sign that never changes colour.
**BV** the netherworld is his photograph: tilted trapezoids, all blue,
brightening upstage, over a dark ground the scene never had — and his measured
colour changes survive because `neon` on a cue is a **level, not a colour**.
**CB** the houses fill the picture. **CD** they sit 1.5m further upstage.
**CC** the whole set is lit unless the cue says otherwise. **BY** measured and
deferred.

**RULING CC IS NOT AN AMBIENT LIFT, deliberately.** `p4` already took the rig
almost out of the ambient bed and says why: *"a bright stage lit the whole
auditorium … stage light belongs on the stage."* And it is not new lights, which
BC/BG/BL ration to 8 (4 in a headset). So the set lights **itself** — each
imported material takes its own texture as an emissive map, keeping his painted
detail — with two guards that each have a test: **imported materials only**
(stand-in materials are shared across shows, so an emissive on one lights four
other productions), and **a blackout stays black** (the default is the STAGE
rig's own output, audience units excluded — dark rig 0.000, full rig 0.550).

**RULING BY WAS WRITTEN, MEASURED, AND TAKEN BACK OUT** — and that is the most
useful thing in the round. His exports name no `walk_` node and *cannot* (one
primitive), so the roof silently lost "the roof slope you stand on, the whole
point of the set". Putting the landed mesh on `WALKABLE` costs **4.29ms per
`groundAt` against 0.0018ms** for the 12-triangle stand-in — **38.6% of a 90Hz
frame**, once for the player plus once per settling body, with **no early exit**
because three.js collects and sorts every intersection, so a miss costs the same
as a hit. **The estimate written into the spec before measuring was 0.031ms:
wrong by 100×**, and it would have shipped a frame-rate cliff onto the one
platform the entire budget system exists to protect.

**SEVEN OF MY OWN ASSERTIONS DIED TO NEGATIVE CHECKS**, the highest count yet,
and four of them taught something new:

- **A mutation that lands in the TEXT but not the BEHAVIOUR reads exactly like an
  assertion that does not fire.** A distortion mutation scaled x by
  `(targetW/size.x)/s` — and for a filling set `s` already IS that, so the factor
  was 1.0. Prove the mutation *changed something*.
- **A bound nothing exercises cannot be negative-checked.** Deleting the
  back-wall clamp changed nothing, because nothing he delivered makes it bind.
- **`undefined` arithmetic passes an assertion silently.**
  `box.max.z > -undefined + 0.01` is `5.45 > NaN` — false — so a set hanging five
  metres over the audience sailed through its own test.
- **The real frame is three calls, not one:** `updateFades` → `updateRig` →
  `updateStorm`. Stepping only the last left the rig where the previous test put
  it, which made a correct build look broken.
- And **proving a function while never proving its wiring, for the fourth time**:
  the cue field was written by hand in the test, so a mutation making
  `showCueExtras` ignore it entirely passed.

**Two existing assertions were rewritten in place** because BX made their
fixtures impossible — both fitted a 1.9 **cube** and demanded 13.40m of width,
which is 13.40m of height in a 9.20m opening. The width was never reachable for
that shape; the old expectation only held because nothing looked up.

**And a probe that reported three rulings as faults** — `tools/models.js` called
CB's masked overflow and CA's downstage sign defects until it was taught to read
the manifest before judging. A probe that calls a ruling a fault is worse than no
probe.

**New in TRAPS:** the guessed number vs the measured one; a mutation that lands
textually but not behaviourally; `undefined` arithmetic silently passing a
comparison; and `const` in its temporal dead zone throwing on a plain reference,
not just via `typeof` — `BJ_HOUSE_UPSTAGE` declared below the manifest that reads
it took the whole build down at load.

## NEXT SESSION: **THE NEON PROSCENIUM, AND HIS MODELS INTO `assets/`** (2026-08-12) — SUPERSEDED, see above

Cache-bust **`?v=21`**. **Read STATE.md — it carries the full left-to-do list
with the rulings written out.** What belongs here is the shape of it.

**Nothing of his newest round is built.** Six rulings, BQ–BW, all specified and
none started. In the order he asked for them:

**1. His seven `.glb` files are STILL NOT COMMITTED.** The plumbing is all
merged (#133 and #134) and the files sit in
`C:\Users\patri\Documents\beetlejuice sets`.
Five are straight swaps. **Two are not:** the exterior has no manifest slot —
and `tests/beetlejuice.js` actively *forbids* an entry targeting the `house`
scene, so that assertion gets reversed in place, the AO/AV/BA precedent for the
fourth time — and the sign is his geometry needing *our* lamps re-attached to
node names we do not control. The three houses are told apart by **texture
palette, not filename** (all three came out of the tool named `deetz_house`), so
if Maitland and Deetz are swapped it is a rename, not a rebuild.

**2. The neon proscenium (BR–BT). START FROM `bj-portal`.** RULING AX already
built this engine — a dark-by-default tube frame, `SHOW.bjPortal`, a
`portal:{col,lvl}` cue field applied on every cue, a `dt` fade — and it was
never reviewed or opened because he trimmed it out of the AW–AZ round. He now
wants exactly it. **Only the plot changes:** blue at the pre-show, blue from GO,
**red at 1:00**, blue in the netherworld, dark everywhere else. Widen the frame
to the broad bright bands his photographs show. His house-light instruction
rides along: **0.12 in the pre-show, still up through GO, out when the tube
turns red** — which supersedes the 0.30 #130 set and rewrites the GO cue.

**One number is unconfirmed and it is one line.** "1 minute into the audio (not
acounting for the 32 seconds)" was read as `at:60`, because the alternative
(95, his 1:35) would put the red after the 1:16 blinder flash and the 1:28
stage-blue. Ask him if it matters.

**3. Blinders inside the proscenium (BU)** — free now that the neon, not the
blinders, is what goes red. Check the curtain's z first: the 1:16 white flash
must still read.

**4. The netherworld skewed to his photographs (BV)**, all blue. Keep both
existing constraints: **not `neonTube`** (CatmullRom overshoots a right angle),
and **a material per tube is required**, because `updateNeon` writes a colour
into every registered mesh every frame.

**5. TOP fires the first cue (BW)** instead of selecting it. Small.

**6. A struck set parks backstage (BQ)** — the biggest item, two to three times
the models PR, and the one that spends the layer-disabling trick that makes
seven configurations affordable. **Measure the cost; do not assume it.** Splits
into "park them and prove they are there" then "measure and optimise".

**His photographs are never committed** — TRAPS draws the line at looking versus
committing, and this round looked at two.

## DONE — 2026-08-12: the second headset verdict, and his models (#129–#134, BJ–BP)

Four asks in one line: he still could not see the purple sweeps from the
balcony, the beams at the top of the show were too faint, cues should be
labelled by their timestamp rather than their fade, and skipping a cue should
skip the music with it. Mid-round he delivered **all seven set models**, twice.

**THE BALCONY WAS GETTING 7.1 OF LIGHT AND EVERY BIT OF IT WAS THE WRONG
COLOUR.** A new probe (`tools/audience-balcony.js`) measures light arriving at a
head on all three levels **split by which kind of audience unit emitted it**,
and that second part is what turned the round — a brightness number that does
not say what colour it is answers the wrong question. At 1:03 all eight real
lights (four in a headset) went to the eight RED blinders and the six purple
movers held **none**. RULING BG's reserve is a ceiling on the audience rig *as a
whole*, and the blinders are audience units outranking the movers 0.9 to 0.8.

**Seven rulings.** **BJ** the arch drops out for both purple sweeps and both
blackouts after them — his ruling, and *his own cue labels already said "the
house goes dark" while their looks held eight red lamps on it*. **BK** a sweep
sweeps UP: it read −84 → −10, which because a head sits at tilt+90 is 6° below
horizontal down to 80° below, so the number went up while the light went down.
**BL** the reserve divides the audience rig a group at a time. **BM** the
pre-show carried the lowest haze of all 94 cues, in the one stretch that is
nothing but beams. **BN** a cue is labelled by where it falls in the show, and
one with no `at` keeps its fade. **BO** a cue you jump to takes the music with
it — never inside `fireCue`, because the transport calls that. **BP** the
triangle budget goes to 150,000, an oversized texture is shrunk rather than
refused, and the house is three whole houses.

Measured, purple only, at a balcony head: **0.000 / 0% of the cue → 5.93 peak /
37% flat, 3.97 in a headset**. The pre-show drift at the back of the balcony went
**7% of a cycle → 57%**, stalls held at 80%. The faintest beam at the top of the
show went **45% of a mid-show beam → 108%**.

**AND HIS MODELS WOULD HAVE LOOKED BROKEN, TWICE OVER, FOR REASONS THAT WERE NOT
HIS FAULT.** The first export was 1.9M triangles against a 30k budget; he
re-exported at ~100k. Then measurement found every file normalised to a
**~1.9-unit box centred on the origin** — straight in, each set would have stood
a *seventh* of its size with half of it buried under the deck. Both are numbers
the export tool chose, not him, so both are handled on our side now: budgets
raised where his ruling said to, textures shrunk rather than refused, and **fit
and seat** — scale to the width MODELING.md already declares, put the lowest
point on the deck, centre the footprint. A re-export at any scale now lands
identically.

**FOUR OF MY OWN CLAIMS DIED TO NEGATIVE CHECKS**, the highest count in any round
so far and the most useful thing in it:

- **"The pre-show puts exactly zero on the balcony"** was one frame of a slow
  drift. Over a cycle it was 7–20%. It was already in a spec.
- **The tilt range was credited with reaching the balcony.** The tilt mutation
  sailed through the balcony assertion — which reads as a weak test, and the
  test *was* weak, but strengthening it showed the tilt had never been that fix.
  It is the **pan** narrowing that reaches the balcony (a third of the effect was
  aimed through the side wall); the tilt is what keeps the stalls, 20% against
  80%.
- **The BM assertion recomputed the beam formula instead of reading the
  uniform**, so replacing the whole `uHaze` line with a constant did not move it.
- **Three separate functions were proved while their wiring was not** — the
  shader formula, the texture shrink, and fit and seat.

**Two existing assertions had a feel constant baked into them by accident** —
`house < 0.4` in two suites, pinned to a pre-show 0.45 nobody remembered
depending on. Neither was testing the threshold; both meant "it loaded a
standing-by preset, not a mid-show look". They say that now, and do not move
again when a level does.

**New in TRAPS:** a probe can measure the wrong thing as confidently as no probe
at all (measure a periodic effect over a cycle, never one frame); a test that
reimplements what it tests agrees with itself whatever the code does; and a
negative-check harness that restores `src/` without rebuilding leaves every
later run measuring the mutant — it presented as `uHaze` frozen at 0.42 while
`hazeNow()` returned 0.7, which reads exactly like a bug in the rig.

**And one already in TRAPS that bit anyway:** the fit-and-seat commit was pushed
to `bj-models` *after* #133 merged and was **stranded**, with nothing to say so.
#134 is the recovery — a new branch off fresh `main`. The owner spotted the merge
before the repo did, again.

## NEXT SESSION: **THE HEADSET, WITH SOUND THIS TIME** (2026-08-11) — SUPERSEDED, see above

Cache-bust **`?v=20`**. **The recordings are in the repo now** (RULING BI), so
Pages serves them and the Quest has sound with nothing to copy and nothing to
host. That closes the setup step every previous list opened with.

**1. Is 4.6 too much?** Eight blinders at FULL, a metre from your face, **five
times** the light they had (0.866 → 4.427 per unit, measured). This is the one
change in the round that could genuinely hurt and it wants a verdict before it
stays. It is one constant: `BLIND_POWER` in `buildRig`. `AUD_STROBE_HZ` stays
at 9 deliberately — five times the light is a reason to be *more* careful about
the 15–20Hz photosensitive band, not less.

**2. Does the purple sweep read now?** Two real lights at 1.505 and four
beams, where before it was two at 0.43 flat and **nothing at all in a headset**.
If it still reads thin, the answer is already written down and does not need
rediscovering: the floor pool is clipped to the stage box (`p4`), so the four
unreserved movers land nothing on the seats. A purple decal crawling over the
stalls costs no per-pixel light — the right shape for a Quest — but needs a
seating-floor model per venue (the Palace rakes linearly through
`houseFloorY`; each Arc house carries a stepped `H.rake`). **First thing to
build if he says thin.** Spec §2.

**3. Does the foyer going out at GO read from a seat**, or only from the door?
And does it come back at the interval in time to be useful?

**4. Does the join sound?** Act two resumes at 4292 out of a **different file**
now. The cut is one AAC frame inside a stretch the show never plays, and
arithmetic says it is seamless — but no suite in this repo can hear.

**5. Does the sound sit on the music?** Still open from last time and now
actually answerable: RULING BB has never been observed, because there has never
been audio on the headset. If the cues land with the show rather than near it,
the drift question open since AP is closed.

**6. Everything from the last list that hardware still owns** — the colour that
is HIS not ours, the 30-second fade at 30:00 reading as intentional, "light
brown" for the Maitlands house, and whether 14 extra channels cost frames
(`VR.perf` on the wrist is the only thing that knows).

**Still owed and unblocked:** his `.glb` models, one small PR each
(`docs/MODELING.md` is the contract). **Shelved:** the portal rebuild,
unreviewed on the local `bj-portal` branch (see STATE).

**Watch:** `tests/smoke.js` still flakes under full-suite load and passes alone
every time. Not a regression of this round either.

## DONE — 2026-08-11: the first headset verdict, answered (#125–#127, BF–BI)

The owner ran the sound round in the headset and came back with four things in
one line: the blinders are not bright enough, the purple sweeps at the start
are not happening, the lobby lights should go out when the show starts, and the
show audio should be split in half so it fits.

**TWO OF THE FOUR WERE ONE FAULT, AND THE PATTERN ENGINE WAS NOT IN IT.** A
throwaway probe stepped four seconds of the pre-show cue through the frame loop
before a line was written, and the sweep was running perfectly — pan 0 → 45.6,
tilt −64 → −42.9, `#2fbf5f` → `#7e3fbe`. What the audience rig could not do was
put light on the audience: six movers won 2 of the 8 real lights and **none of
the 4 a headset hands out**, and eight blinders at "as bright as posible" burned
**0.866 each against one FOH lantern at 45% on 1.364**. The TRAPS advice —
*write a probe when you cannot picture it* — turned two vague complaints into
one measured number, and stopped a session being spent on the pattern engine.

**Four rulings.** **BF**: `power` was doing two jobs — ranking who wins one of
the eight real lights *and* setting how bright it burns — so RULING BC's very
sensible 0.9 quietly capped the blinders at a fifth of a front light, and
nothing here could see it. `rank` and `power` are now separate; rank defaults
to power, so all 25 stage channels in all three houses are unchanged to the
byte. **BG**: the audience rig gets a reserved share of the pool —
`AUD_LIGHT_RESERVE = 2`, a **ceiling and never a floor**, claimed only while an
audience unit is lit, which across 94 cues is the pre-show, four cues at the
top and two moments in act two. **BH**: a cue may say `lobby:` and **saying
nothing leaves it alone** — the foyer had burned through every performance of
all five shows because no cue had ever carried the field. **BI**: the show
track is two files and they are **committed**, which amends BA.

**BA is amended rather than repealed, and both sides are kept.** Its first
reason — 134MB against GitHub's 100MB hard limit — died when the track was
split (69.4MB + 70.1MB). Its other two were the owner's to overrule and he did.
The assertion that demanded the opposite was **reversed in place**: it now
checks the three named files are really in the index and that the directory
still refuses everything else. The AO/AV precedent, third time.

**The split is invisible to the plot, which was the actual requirement.** The
cut point is FREE — the act-break cue stops the track at 4269 and act two
resumes at 4292, so the join sits inside a silence the show already had. Each
half carries the `offset` where it begins; the clock is `offset + currentTime`
and a seek is `at - offset`. **Not one of his timestamps changed.** Verified to
the sample: 4292.023 + 4334.794 against a whole of 8626.794 is a 23ms overlap,
exactly one AAC frame, inside the unheard stretch.

**Fourteen assertions, every one negative-checked against a WRONG
implementation** — the reserve at 0 and at 4 and made unconditional, the power
back at 0.9, the rank raised over a stage lantern, the lobby field removed and
then applied unconditionally, the stage swap forgetting the foyer, the
transport reading `currentTime` raw, `audPlay` seeking the raw `at`, the offset
off by the interval, the pre-show music allowed to be the clock, the binary pin
commented out, and one manifest file quietly untracked.

**And the negative check that taught something new, now in TRAPS:** one
mutation **silently matched nothing** — the two power constants share a single
`const` statement — so it built an unchanged file and the suite correctly
passed. *A negative check whose mutation does not apply reads exactly like an
assertion that does not fire*, and the wrong conclusion ("my assertion is
weak") has the same shape as the right one. Prove the mutation landed before
reading the result. Its sibling has been in this file since #104: *a negative
check that does not fail means the ASSERTION is weak.* The two are told apart
only by looking.

**Also new in TRAPS:** `* text=auto eol=lf` decides binary by **content
heuristic**, and the repo needs that rule because `build.sh` breaks under CRLF.
A 70MB AAC file that lost the coin toss would be rewritten on checkout and
**nothing in this repo can hear**. `.gitattributes` now names the extensions
`binary` — including `.glb`, before a single model has arrived, because the
import fallback is silent by design. Checked after committing: all three files
byte-identical between disk and the index.

**Two decisions taken rather than asked about, both written into the spec so
they are not rediscovered as bugs:** the lobby is scoped to the **Palace**
foyer, because the Arc's is a different circuit shared between two auditoria
and dimming it for one house would black out the other's front of house
mid-interval; and the house floor pool is **deferred**, because with real light
now landing on the seats it may not be needed — and if it is, it is the first
thing to build.

## NEXT SESSION: **PUT THE SOUND ON THE HEADSET** (2026-08-11) — SUPERSEDED, see above

The show has a soundtrack and a full light plot now, and **not one second of
either has been seen or heard.** Cache-bust **`?v=19`**.

**Do this first, or most of the list below cannot be answered:** copy the two
recordings into `assets/audio/` — the commands are in **docs/AUDIO.md**. They
are NOT in the repo and never will be (RULING BA), so a fresh clone and Pages
both run silent, by design.

**1. Does it sit on the music?** This is the whole of RULING BB and it has
never been observed. Load BEETLEJUICE, press GO, and watch whether the cues
land with the show rather than near it. If they do, the drift question that has
been open since ruling AP is closed. If they do not, the transport is one
function (`showAudioTick`) and the fault will be in it, not in the plot.

**2. The blinder flash.** Eight units round the arch, at FULL, a metre from
your face in a headset. It is the one thing in this round that could genuinely
hurt, and it wants a verdict before it stays at 1.0. `AUD_STROBE_HZ` is 9Hz
deliberately — 15-20Hz is the photosensitive band and these point at the
audience.

**3. Do the patterns read as he described them?** "moving slowly ... slowly
fading between green and purple" for the pre-show drift; "a random pattern
fast" at 1:16; "really fast" for the green flashing at 2:01:53. Two constants,
both one-liners: `AUD_WANDER_RATE`, `AUD_RANDOM_RATE`.

**4. Is the pre-show house right?** He wrote "low"; it is 0.45. And does the
red arch plus red marquee read at GO, with the stage dark behind the cloth?

**5. Do fourteen new channels cost frames?** The patch went 25 to 39 on every
stage. Beams only draw in haze and the audience units make no floor pools, so
most of it should be cheap — but the wrist meter (`VR.perf`) is the only thing
that actually knows.

**6. And the colour, which is now HIS and not ours.** Sixty-six looks off his
own cue sheets. The likeliest words to have been read wrong are "light brown"
(the Maitlands house), and whether the thirty-second fade at 30:00 reads as
intentional rather than as nothing happening.

**Still owed and unblocked:** his `.glb` models, one small PR each
(docs/MODELING.md is the contract). **Shelved:** the portal rebuild, unreviewed
on the local `bj-portal` branch (see STATE).

**Watch:** `tests/smoke.js` flakes under full-suite load and passes alone every
time. It went twice across this round. Not a regression.

## DONE — 2026-08-11: his sound, his audience rig, his light plot (#121-#123)

The owner wrote the show out by hand — **four text files**, a pre-show sequence,
both acts of lighting and a revised set list — and asked for three PRs: the new
lights and the audio and the pre-show, then act one, then act two with the set
times checked. All three landed as a linear chain.

**His files are the authority, and that is now the second time it has worked.**
Where his plot disagreed with what #90-#100 measured and #104-#113 built, his
plot won, and the invented looks went: "the moon takes the upstage", "the
mourners", "a hard green across the frames". Sixty-six of his timestamps are
cues at his exact seconds. **The set list is DATA now** — one test walks every
time, scene, dressing, backdrop side and wagon offset — because the one drift
in it (the netherworld at 1:39:00, which he re-wrote as **1:39:19**) survived a
whole round unnoticed for want of exactly that test. The second thing he
changed was in the lighting: the act break takes the house to **half**.

**Five rulings.** **BA** the show has recorded sound and *the files are never
committed* — 134MB against GitHub’s 100MB hard limit, off a video, and a
commercial recording on a repo with Pages on, so it is the model-import
pipeline again (manifest, doc as contract, bidirectional test, silent
fallback). **BB** while the show track plays it IS the cue clock, which closes
the drift half of the question open since AP — every timestamp he wrote is a
position in that file, so `at` became literal. **BC** the audience is lit: 8
blinders round the arch and 6 movers over the seating on every stage, 25 to 39
channels, and they are *seen, not seeing* — power below the dimmest stage
lantern so they can never steal a real light off the stage. **BD** patterns run
on the frame, never a timer. **BE** widened BD off two of his own lines, because
"just a purple light is on the curtain an moving around a bunch" is the stage
movers, not the audience.

**Forty-four assertions, and every one negative-checked against a WRONG
implementation rather than an absent one.** Four of them did not fail the first
time, and all four were weak tests — which is the lesson from #104 working as
written:

- **"the fast pattern travels further" measured the wrong quantity.** A slow
  pattern with a wide throw covers more ground than a fast one with a narrow
  throw, so a random effect running at the wander frequencies sailed through on
  amplitude alone. Fast means OFTEN: it counts direction changes now.
- **"a missing track is silent" only looked before anything wanted the track,**
  so a version that confused "we asked for it" with "it is playing" passed.
- **the gitignore check grepped for a pattern that is still in the line when the
  rule is commented out.** It asks `git check-ignore` now.
- and one stale grep target of my own, which is the same class of thing.

**Three defects the suites caught before the owner could:** a cue that plays in
the exterior scene without stating the drop’s offset (the wagon convention — a
goBack would have opened act two on an empty stage), the confetti still hung on
the curtain cue when he had moved it to 2:14:52, and the netherworld label still
reading 1:39:00.

**And one I caught by reading rather than by testing:** the 9:01 "all lights
flash brite to white" was written as a pattern-engine flash while the engine
only drove the audience rig. It would have flashed eight blinders and left the
stage dark — the right effect on the wrong fourteen lamps, with nothing
anywhere to say so. Unknown pattern targets now move NOTHING and log it, and a
test pins every target to its own channels.

**What no suite in this repo can do is hear.** jsdom has no audio and no GPU:
nothing about how this sounds, looks or feels has been tested, and none of it
claims to be.

## NEXT SESSION: **HIS MODELS, AND THE HEADSET** (2026-08-11) — SUPERSEDED, see above

Two threads, either order:

**1. The owner's set models.** The pipeline is live (#119). Each delivery is
one small PR: the `.glb` goes into `assets/` named exactly per the File
column in **docs/MODELING.md** (that column is the contract, and a test pins
manifest↔doc both directions), rebuild nothing, suites green, merge. Budgets
refuse loudly (tris/materials/textures/stray lights); a missing or refused
model keeps the stand-in — the show is never broken. Routing inherits the
choreography: flyers, hill sides, dressings, the wagon shell.

**2. The headset run of THIS round** (cache-bust **`?v=18`**):
- Do the changeovers READ? The one number most likely to retune is
  `BJ_FLY_SPEED` (1.8 — a flown set takes ~5.8s; on cues 15/16/17/29/34 it
  is still rising 2–3s after the next look is lit).
- Does the 9:45 "graveyard empties" beat land — hills running to the wings
  inside their 5s fade?
- Do the two repainted cloths read: the sky's cratered moon and underlit
  clouds; the exterior drop's wonky house?
- The dressing swaps now genuinely hide (deferral) — confirm nothing pops
  anywhere across a full act.

**Shelved, if he asks:** the portal rebuild lives UNREVIEWED on the local
branch `bj-portal` (see STATE). The sign/marquee repaints were cut; the
show curtain stays by his word.

**Watch:** `tests/smoke.js` flakes under full-suite load (wall-clock dt);
a task chip exists. Not a regression of this round.

## DONE — 2026-08-11: the headset verdict round (AW–AZ, #115–#119)

The owner's first headset run of the re-time round came back in one line:
the sets look nothing like the pictures, every change pops, remove the neon
tubes. The round that answered it was reshaped by him twice mid-flight —
**"what if i 3d model each set myself"** became RULING AZ and split the
labour (he models the sets; this side builds "anything that isnt a set"),
and a later trim cut the round to the curtains, the set movement and the
model import. The neon ask was put back to him against his own photographs
(they show a lit frame as part of the design) and became "rebuild to match"
— the AO/AV pattern — and then was shelved with the trim: **built, never
opened, parked on the local `bj-portal` branch.**

**What merged:** the spec/plan/modeling-brief (#115); the changeover engine
(#116); the movement data (#117); the cloths + the split rule (#118); the
model importer (#119). Suites 18/18 before and after every link; every new
assertion negative-checked; the two independent branches (#118/#119) were
built by parallel worktree agents and seam-checked merged before either
opened.

**Six defects the reviews caught before the owner ever saw them,** each now
a test: a dress fired mid-exit popped on a still-drawn set (judged by the
wrong flag); the full-width hill layers "ran off" and stayed in the picture
(the clearance is now a world-box assertion); **the exterior had never
actually flown** — `sceneMoveTo` on a mover that was never wired is a silent
null no-op, masked for two rounds by tests that read state instead of
watching motion; the cue engine's move-vs-changeover order was load-bearing
in BOTH directions (the split rule in p5c's `showCueExtras` is the writeup:
outgoing-scene moves before, everything else after — each plain order fails
a different test); the importer's async test tail could hang and exit 0
(watchdog now guards the suite's core guarantee); and imported models
escaped the RULING AP static freeze, quietly spending the Quest budget the
import budgets exist to protect.

**The modeling contract:** docs/MODELING.md — dimensions off the real `D`
(picture opening 13.6 x 9.2m = 44'7" x 30'2", hard cap 14.8m), budgets, glb
export rules, `walk_*` floors, and a File column of exact deliverable names
that a test keeps provably in sync with the manifest, because the fallback
is silent by design and a misnamed file would otherwise just never load.

## NEXT SESSION: **PUT IT ON THE HEADSET** (2026-08-10) — SUPERSEDED, see above

The re-time round is BUILT, GREEN and **entirely unseen**. Eleven PRs, and
nobody has looked at a second of it through a Quest. The full list of what
only hardware can answer is in **STATE.md** — read that. What belongs here
is why the suites stop where they do, and it is not a shortcoming: jsdom
has no GPU and `fillText` is a noop, so *nothing about how any of this
looks has ever been tested, and no test in this repo claims otherwise.*

**Cache-bust `?v=17`.** The build went 964663 → ~1000763 across the round.
Confirming a timing or a look against a cached old build reads as a fault
that is not there, and this repo has been caught by that before.

**The one number most likely to be wrong** is the wagon's crossing time:
4.0 seconds over 10 metres. It is a guess. The assertion allows 2–12s
precisely so it can be retuned without a fight.

## DONE — 2026-08-10: the owner's own scene plot (#104–#113)

The owner watched the recording and wrote the set changes out himself with
timestamps, and **his list became the authority.** Where it disagreed with
what #93–#100 had measured, his list won — which was most of act one.

**The cross-check that made it trustworthy:** his act break, 1:11:02, is
second 4262, exactly where `blackdetect` found the show's longest blackout.
His timestamps and `tools/video.js` share a time base, so a plot written
from a sofa dropped straight into `looks[].at` with no offset.

**Eight rulings, and the first REVERSAL in the sequence.** AP the wagon is
real and seen; AQ one house three dressings; AR the show ends at 2:15:00
(the owner overruling a measurement); AS the sign flies and there is no
crypt; AT cloths on lines, structures on movers; AU the two waits are the
two GO presses; **AV repeals AO** — the scenery is no longer "our own
vocabulary", Beetlejuice is modelled on the production, scoped to that
show alone. AO is left in its own spec marked superseded, because a
reversed ruling is worth more on the record than a deleted one.

**The Palace is now deeper than the box.** `D.backWall` (−17) stays the
STAGE-COORDINATE reference every show and both Arc houses are written to;
`PAL_BACK` (−21.5) is where the Palace's brick actually stands. Structural
Palace geometry uses `PAL_BACK`, anything stage-relative keeps
`D.backWall`. A deliberate, scoped break of "every stage is the same box",
at the owner's instruction — "only do this with the palace theater".

**Six defects, and the suites caught two of them.** The mover that moved
nothing (a frozen group takes the write and stands still); the cloths hung
in FRONT of the show; `SHOW.goods` being the delete list; a building that
moved while its furniture stayed; a park offset measured against the
shallowest dressing; and a test helper that tripped the stale-parent trap
recorded three PRs earlier. **Two were found by throwaway probes** — the
TRAPS.md advice working exactly as written.

**And the lesson that outranks the rest, now in TRAPS.md:** *a negative
check that does not fail means the ASSERTION is weak.* It happened FIVE
times in one round — a clearance test that checked order and accepted 7cm,
a shed test that checked position and accepted a shed trimmed by a third,
a travel test whose window scaled with the speed it was testing, a
dressing test that never exercised its own hooks, and a confetti feature
with no test at all. Every one was about to ship as false comfort.

## SUPERSEDED — the in-flight block (#104–#109)

**This supersedes the "CONFIRMING THE SCENE TIMING" section below.** Nobody is
confirming the built timing, because the owner watched the recording himself
and wrote out the set changes with timestamps, and **his list is the
authority.** Full position, the plot, the rulings and what is left: **STATE.md,
"THE RE-TIME ROUND"** — read that, not this. What belongs here is what the
round has already taught.

**The cross-check worth remembering:** his act break, 1:11:02, is second 4262 —
exactly the built act-break cue taken off the measured 13.3s blackout. The
owner's timestamps and `tools/video.js` share a time base, so his numbers drop
straight into `looks[].at` with no offset. That is why a plot written from a
sofa could be trusted against a probe.

**RULING AV repealed RULING AO** — the first reversal in the sequence. The
scenery is no longer "our own vocabulary"; Beetlejuice is modelled on the
production, *scoped to that show alone*. AO is left in its own spec marked
superseded rather than deleted, and the assertion that guarded it was
**reversed in place** rather than removed, because the note is still
load-bearing and must not drift back.

**Four defects this round, and only one was found by a suite:**

1. **The mover moved nothing.** `lockShowStatic` freezes the set with
   `matrixAutoUpdate = false`, so writing `position.x` on a scene group updates
   the record while the house stands still. The first crossing test read
   `position.x` back and passed against a stationary wagon. In TRAPS.
2. **The cloths were hung in front of the show.** The backdrop went on line 8
   (z −6.10) with the interior wall at −9.20 and the cemetery at −16.15. Every
   suite was green: nothing asserted the one structural fact that makes a
   backdrop a backdrop. **Found by a throwaway probe printing per-scene
   bounding boxes** — the TRAPS advice working exactly as written.
3. **`SHOW.goods` is the DELETE list.** Registering the stock `sky` on it
   destroyed the good for every show that follows. Three suites went down.
   This one a suite did catch.
4. **A building moved and its furniture stayed.** The Palace shed shifted 4.5m
   upstage; `buildCart`, both `buildSaw`s, `buildRack` and `buildTrash` carry
   hardcoded z, so the fit-out drifted to the front wall and the trash drum
   ended up standing on the stage, through the brick.

**Two assertions had to be strengthened after their negative check passed** —
worth noting as a pattern, because both were nearly shipped as false comfort:
a clearance check that only tested ORDER and accepted 7cm between a cloth and a
roof, and a shed check that tested POSITION and accepted a shed trimmed from
13m to 9.4m. **A negative check that does not fail is telling you the assertion
is weak, not that the code is right.**

## NEXT SESSION: **CONFIRMING THE SCENE TIMING** (owner, 2026-08-10) — SUPERSEDED, see above

The round is built and merged (#90-#100). What has NOT happened is anybody
watching it run. The next session confirms the timing — and the first thing to
know is that **the suites cannot do it for you.**

### Why a suite cannot answer this

`follow` arms the next cue with **setTimeout**, so the chain runs on the wall
clock. jsdom can assert the follow VALUES (and does — the chain reconstructs
8627s, the act break at 71:02, the call at 141:02) but it cannot observe the
cues actually firing without sitting through 144 real minutes. **That gap is
itself the strongest argument for ruling AP**: a dt-driven transport would be
testable in a suite, because `stepProgram(dt)` can be stepped 8627 seconds in
a loop. Worth putting to the owner in exactly those terms.

### What to confirm, in order

1. **Does it start itself?** Load BEETLEJUICE, press GO once. Cue 1 should arm
   cue 2 twenty-five seconds later with nothing else touched.
2. **Does DRIFT accumulate?** This is the real question. Each timer fires a
   little late and the next is armed from the late fire. Note the wall-clock
   time at the act break (due 71:02) and at the call (due 141:02) and compare
   against those two. **If the call lands more than a few seconds late, the
   cheap version has answered ruling AP by itself.**
3. **Does a stage swap kill it?** Start it, walk into the Arc, come back. It
   should be dead — `cancelFollow` runs on the swap. Confirm that is what
   happens, because it is the other half of the AP argument.
4. **Do the scene changes land in the dark?** Ten scenes, six changes. Every
   one is covered by a shut cloth or a blackout and a test asserts it, but
   whether the cover FEELS long enough is a judgement nobody has made.
5. **Does the pace read?** 46 cues over 144 minutes averages one every three
   minutes. Cues 8-12 (the interior) and 26-29 (the redecorated room) are the
   longest stretches; those are where it will feel slow if anywhere does.

### When each scene is due, off the recording

| Scene | Due | Cues |
|---|---|---|
| cemetery | 0:33 - 15:20 | 0.5 - 7 |
| interior | 15:57 - 31:34 | 8 - 12 |
| attic | 42:22 - 51:56 | 13 - 15 |
| bedroom | 54:23 - 55:45 | 16 - 17.3 |
| crypt | 56:46 - 71:30 | 17.5 - 20 |
| house exterior | 72:30 - 78:00 | 21 - 25 |
| redecorated | 78:28 - 99:38 | 26 - 29 |
| afterlife | 103:39 - 115:00 | 30 - 32.3 |
| the sign | 118:04 - 120:50 | 32.5 - 32.7 |
| afterlife again | 121:54 - 136:40 | 33 - 33.3 |
| bare stage | 137:57 - end | 33.5 - 37 |

### The four soft spots — where it is a DECISION, not a measurement

If something feels wrong, look here first. These covers were invented because
the recording gave nothing to measure, and each says so in its own comment:

- **cue 7**, out to the interior — no measured blackout anywhere 9:00-18:00.
- **cue 12**, up into the attic — none before 42:22 either.
- **cue 25**, back inside from the exterior — none between 94:02 and it.
- **cue 32.3**, out to the sign — none there.

The covers that ARE measured, and should feel right: cue 15 (8.6s at 51:56),
cue 17.3 (10.5s at 55:38), cue 19 (13.3s at 71:02, the act break), cue 29
(2.9s at 99:38), cue 32 (a 12.4s fade at 113:18), cue 35 (7.0s into black at
143:35).

### And the standing one

**None of this has met hardware.** Whether a self-running show reads as a show
or as a slideshow, whether the portal reads as a portal from a seat, and
whether ten scenes taking turns reads as one production — those are headset
questions and they belong in the section at the bottom of this file as
questions, not asserted here as facts.

## DONE — 2026-08-10: a fifth show, taken off a recording (#90-#98)

The owner asked: "if i give you a video of a full show can you make the real
cues and sets for it and make an auto cue feature for it that is timed
currectley", then supplied a 2h23m47s recording of BEETLEJUICE.

**Phase 1, the measurement (#90).** `tools/video.js` — the one probe that loads
no harness, only ffmpeg. Five passes: a 16x9 area-averaged grid at 5fps (one
pass instead of the brief's 24 crops), per-frame scene scores, blackdetect,
silencedetect, astats. The headline changed the scope: the file is a **bootleg
compilation, not a locked-off wide shot** — 723 hard cuts at 5.0/min, layout
stability median r=0.676 where a fixed camera scores ~0.95 — so **per-area
channel levels are not measurable from it at all**. What survived: CFR
timestamps, real black at Y=16.8, fixed exposure (+1.1Y drift through a 13.3s
blackout), 33 blackouts >=1s, fade times median 2.2s, the act break at 71:02,
and the curtain call located in the last 2.5 minutes — 82 events of lights
bumping — **without ever seeing a frame**.

**RULING AO (#91).** The scenery is the show's vocabulary, not its drawing:
our own proportions, our own detailing, our own words on any sign. It restates
what §3 already ruled for the other four, and it is written down because a
video makes tracing easy for the first time. All four older shows carry an
interpretation note on their record; Beetlejuice's is now a tested assertion.

**Beetlejuice was here before, and was removed.** `tests/sets.js` carried an
assertion since the INITIAL COMMIT that `SHOWS.beetlejuice` must not exist, and
it appears nowhere in git history under `src/` — so the removal predates the
repository and **no reason for it was ever recorded**. Reversed deliberately,
with the old assertion rewritten in place saying what it used to guard and why
that changed.

**The scene machinery was built for this show and orphaned with it.**
`sceneAdd`/`sceneShow`, a cue that carries a `scene`, and a p7 panel — recorded
here as "general machinery that no current show uses". This is the first
production to use it, and it is what makes seven configurations affordable: a
scene that is off has its **layers disabled**, so it costs no draw call and no
raycast. Only `p2d` is genuinely dead — re-read audit item 20 before deleting
anything near it.

**What shipped.** `src/p5h.txt`, appended after `p5g` (SHOWS is declared in
p5c). Seven scenes — cemetery, interior, attic, bedroom, house exterior,
redecorated room, afterlife — and a constant portal, ~80 pieces, one scene ever
live. 38 cues across a full evening.

**THE AUTO-CUE RUNS, and it cost no new code.** Every cue's `follow` field now
carries the gap between two measured cue times. The chain spans **8627s = 144
min** against a 143-minute recording, reaching the act break at exactly
**71:02** and the curtain call at **141:02**. Show him this before any
transport is specced.

**Still owed:** **PR 6 of 7**, the remainder scenery (crypt 56:46, sign set
118:04, bare-stage looks) — purely additive. And **rulings AP onward**: cheap
`follow` vs a real timecode transport, whether it must be VR-reachable, and
what a running show does on a stage swap. Two facts for that discussion:
`follow` uses `setTimeout` and a **stage swap cancels it**, so an unattended
show dies when you change venue; and chained relative waits drift where
absolute timecode does not.

**For the headset, as questions and not claims:** does a self-running show read
as a show, or as a slideshow? Is 144 minutes of it bearable, and is the pace
right at the act break? Does the portal read as a portal from a seat, or just
as a frame? None of this has met hardware.

## 6. Where it stands / what is next

All twelve suites green on `main`, audited, and the audit **worked off**:
of the 6 high / 17 medium / 6 low findings in **AUDIT.md** (repo root,
2026-08-06), 20 of the 22 queue items below are fixed and merged. The two
leftovers (items 20, 22) are owner-taste, not bugs.

**The game is LIVE on GitHub Pages:**

```
https://jackscreations21.github.io/gms-theater-game/the-house.html
```

The bare `…/gms-theater-game/` URL redirects there. Pages serves whatever
is on `main`, so a merged PR is live within a couple of minutes. The Quest
Browser caches hard — bust with `?v=2` or clear site data before deciding
a fix "didn't work". VR-SETUP.md (repo root) is the full guide: both
serving routes, the control scheme, the first-run checklist.

**Done 2026-08-06:** fixed the `full14.js` harness (the jsdom `movementY` shim
above — the game code was never wrong), created the git repo (there had never
been one), pushed to GitHub, rewrote both commits onto the no-reply address,
added `README.md`. GitHub Pages is **not** enabled yet — it needs the repo
public or a paid plan, and that decision is the owner's. Later the same day:
ran the code audit — six independent read-only passes (global state, the p2k
swap, dead weight, duplication, coordinates, test coverage), cross-checked,
the sharpest single-source claims re-verified by hand and one by a live jsdom
probe. No code was touched; AUDIT.md is the deliverable.

**Done 2026-08-06, evening session: worked the bug list — and it is all on
`main` (80b3521).** Twenty of the twenty-two items below fixed, one finding
per commit, ~30 new regression tests, every fix negative-checked against the
unfixed code. Delivered as four stacked PRs (#2–#5); the stacking bit us —
the PRs were merged without deleting each base branch, so #3/#4/#5 landed on
their stale *bases* instead of `main`, and it took a catch-all
[#6](https://github.com/Jackscreations21/gms-theater-game/pull/6) to bring
the missing 17 commits home. **Lesson: with this repo, PR straight to `main`
— don't stack.** Post-merge verification: `main`'s tree byte-identical to the
tested state, the build reproduces exactly, 12/12 suites green on `main`,
work branches deleted. Still open from the queue: item 20 (dead weight —
owner's deletion call), item 22 (duplication — now unblocked), and the M9
ruling (documented one-board; capture them in p2k if you disagree). `gh` is
not installed on this machine — PRs were opened through the GitHub API with
the stored git credential.

**Done 2026-08-07 (the Pages session):** the owner enabled Pages; verified
live and smoke-tested on desktop (boots clean over HTTPS, zero console
errors, four shows registered, `navigator.xr` present). Merged the same
day, one PR each, straight to `main`, no stacking: **#8** the `index.html`
redirect, **#9** VR-SETUP.md (the Quest guide — controls read out of p9,
not guessed), **#10** the shift-lock rework. That last one changed a
control: **tap Shift** (under 250ms) now toggles the pointer lock — cursor
locked to centre, mouse steers the camera, tap again to release — while a
**hold** is still run, so sprinting never drops the mouse. The old
run-latch is gone; the SHIFT LOCK chip now mirrors the *real* pointer-lock
state however it changed (tap, canvas click, or the browser's Esc), so it
cannot lie. Four new tests in `full14.js` drive real key events through a
full pointer-lock mock (jsdom has none). Post-merge: `main` verified
byte-identical per PR, work branches deleted, 12/12 green.

**Done 2026-08-06, the VR features session — two rounds in one day.**

*The first headset run happened.* Findings, for the record: the first
attempt never entered VR because the ENTER VR chip went untapped (not a
bug — the flat page is keyboard/mouse by design); the second attempt
loaded in fine, so `vrEnter()` and the session chain are proven on
hardware. Frame rate was "a little low" (owner's words, no number). No
verdict yet on pointing accuracy, console readability or comfort.

*Round one (merged: #12, #13, #14):* triggers act on whatever the ray
lands on, the way the desktop E key does — either hand, desks keep
priority, floating label says what a pull will do; tap A jumps,
double-tap A flies (gaze-directed, gravity off, walls still block,
landing or another double-tap puts you back on your feet); the mild perf
notch — beams 14 → 10 in-session, framebuffer scale 0.85 asked for at
wiring time.

*Round two (open as of this writing: #15, #16, #17 — check they merged
before building on them):* built by three parallel worktree agents, each
reviewed line-by-line and independently re-verified before push. The
review caught one real seam bug: the live VR haul still used the flat
0.6m floor, so a held rope could drag goods through the deck.

- **#15** — nothing hung can go below the deck. `minTrimOf(ls)` in p3:
  the pipe stops when its goods kiss the floor, but never above the
  goods' own working trim (the house curtain is cut to puddle — h 13.0
  on a 12.6 trim — and must still make it). `flyTo` and the desktop haul
  clamp against it. Known change: SHOW LOOK's cyc call was burying 2.9m
  of cloth; it now stops at 13.55m.
- **#16** — the pin rail is real now. Full operating loops (head block
  under the grid, floor block off the deck, two runs, sheaves that
  spin), and a little red lever per line: the rope lock, which IS
  `ls.locked`. Grabbing a rope takes the lock off; releasing without
  throwing the lever starts a runaway — down from rest, slow-stop-return
  if it was going out, ever on if it was coming in — integrated in p3
  `updateFly`, stopped by the deck floor or the lever. Board commands
  cancel a runaway. Stage swaps tie off (no runaway — the parked-stage
  regression stays green). Desktop hauling unchanged.
- **#17** — the Palace balcony desk faces its operator (yaw π → 0, face
  normal now +z) and the 24 seats crowding the control position are
  gone (keep-out rectangle in the p2b mezz bank; SEAT_COUNT 1392 → 1368).

`#15` and `#16` are written to merge in either order: `#16` reaches
`minTrimOf` only through `typeof` guards.

**Done 2026-08-07, the locking-rail rework (this PR).** The owner sent a
photograph of a real counterweight locking rail and three asks; all three
are in:

- **The rail looks like the photograph.** A steel locking rail now stands
  in FRONT of the rope loops: one beam the length of the hung lines, a
  kick rail, posts, and — per lineset — a rope-lock housing on top with
  its red handle facing the flyman, over a painted number plate on the
  rail's face (`ropePlateTex`, cached in `ROPE_PLATES` so stage walks
  don't leak canvases; `disposeTree` only ever disposed geometry).
- **Grab anywhere on the rope.** A squeeze takes the nearest point on
  EITHER run of any loop, deck to grid (distance-to-segment, radius
  0.32m), not just the whipped section at hand height — the whipped
  section now slides to meet the hand. The back run is the other half of
  the loop, so it hauls in reverse (`VR.held.dir`).
- **Levers never move on their own.** The old rail toggled a lock when
  any hand came within 0.11m of the knob — a knuckle mid-haul could
  throw it — and grabbing a rope silently took its lock off. Both gone.
  A lever moves ONLY while a hand is squeezed closed on its knob
  (nearest-wins against the rope, `VR.heldLever`): lean it IN (upright)
  and the line locks; pull it OUT (toward you, past ~70% of the throw)
  and the line is RELEASED — and a line released with no lock and no
  hand on it runs away to the deck, same physics as a let-go rope.
  Grabbing a rope still arrests a runaway (you have the weight) but no
  longer touches the lock; hauling against a thrown lock moves nothing,
  and the hold re-bases while locked so pulling the lever out mid-haul
  cannot bank the blocked pull and let it fly. Board/desk LOCK is still
  the same `ls.locked` flag.

Suites 12/12 before and after; the eight new/reworked assertions all fail
against the pre-change build (negative-checked). What only the headset
can answer is folded into the step-zero list below.

**Done 2026-08-07, frame-rate round one (PRs #21, #22, #23 — open as
of this writing, check they merged before building on them).** The
measure-first order above is honoured — #22 IS the readout — and two
of the cheap wins went in alongside it, each its own PR, each gated on
the session so the desktop is untouched:

- **[#21](https://github.com/Jackscreations21/gms-theater-game/pull/21)
  — the session is paced at 72Hz, not 90.** On sessionstart the game
  asks `updateTargetFrameRate` for the lowest supported rate at or
  above 72 and remembers it in `VR.targetHz`. 13.9ms of frame budget
  instead of 11.1 before any other knob turns; a held 72 beats a 90
  that drops. Browsers without the API are left alone. If the meter
  later shows miles of headroom, this is one line to retune.
- **[#22](https://github.com/Jackscreations21/gms-theater-game/pull/22)
  — the frame meter, and foveation on a feedback loop.** `vrPerf`
  (called from `vrUpdate`): a 120-frame ring buffer, avg/worst in
  `VR.perf`, evaluated twice a second, drawn on a small tag riding the
  LEFT WRIST — glance at your watch; green under budget, red over,
  peak and foveation level alongside. Over budget the controller steps
  foveation 0.4 → 1.0 by 0.15 (foveation is the one knob WebXR turns
  mid-session; framebuffer scale is start-only); with headroom it
  relaxes by 0.05 back to the 0.4 base, never below. Climb fast, relax
  slow. `vrOnEnd` resets the window.
- **[#23](https://github.com/Jackscreations21/gms-theater-game/pull/23)
  — four real spotlights in VR, not eight.** `VR.lightCap = 4` set by
  `vrQualityOn`, honoured by the p4 hand-out loop (`_active` was
  already sorted by workload, so the four that matter keep theirs).
  178 `MeshStandardMaterial` uses pay per-pixel for every live light,
  twice per frame in a headset — this halves that term. Beams, gobo
  pools and lens glows still draw for all 25 channels, so the rig
  still reads fully lit.

Seven new vr.js probes across the three PRs, every one verified to
fail against the pre-change build. The three branches were also merged
together locally (any order — they are written independent) and the
combined build passed 12/12; the per-PR builds did too.

**Done 2026-08-07, the owner's five asks (PRs #25–#29 — open as of this
writing, check they merged before building on them).** Five one-line
asks, five PRs, all off `main`, no stacking. #25/#26 by hand; #27/#28/#29
by three parallel worktree agents, each reviewed line-by-line. Every new
probe negative-checked; all open branches merged together locally in two
different orders, rebuilt, 12/12 on the combination:

- **[#25](https://github.com/Jackscreations21/gms-theater-game/pull/25)
  — all four Arc desks face their operators** (both tech tables, both
  control rooms): built at yaw π — the same bug #17 fixed on the Palace
  desk, the same ruling: yaw 0, screen normal up the house.
- **[#26](https://github.com/Jackscreations21/gms-theater-game/pull/26)
  — the Arc seats sit on their treads.** They floated exactly 0.96m:
  rows laid out from `0.4 + i*RISE` against treads that top out at
  `Y0 + i*RISE + 0.2`. Now on real pedestals (a fourth instanced
  batch), 1,273 seats across the two houses.
- **[#27](https://github.com/Jackscreations21/gms-theater-game/pull/27)
  — the rail starts locked, and the semantics are DECIDED: the lock is
  the hand's interlock; the board is the flyman.** `flyTo` (cues, group
  calls, crew, presets) takes a thrown lock off itself, runs the line,
  relocks on arrival (`ls.relock`); manual hauls still refuse while
  locked; runaways never relock; a grab — VR or desktop — clears a
  pending relock, so nothing relocks under a live hand. NOTE FOR THE
  OWNER: LOCK no longer makes a line refuse cues/group calls — say so
  if that reads wrong. The seam check earned its keep twice here: the
  desktop grab was missing the handover the VR grab had, and a lock
  test crashed on the traveler rope (no lever) only once both branches
  were merged.
- **[#28](https://github.com/Jackscreations21/gms-theater-game/pull/28)
  — the traveler hand line.** A small rope loop just offstage of the
  arch, stage right, on every stage with a house curtain hung: the
  front run pulled down slides the curtain OPEN out to both sides, the
  back run closes it, 2.5m of rope for the full travel. While held it
  writes `ls.open` AND `ls.travTarget` so the p3 animator never fights
  the hand; no lock, no runaway — let go and the curtain stays. Board
  OPEN/CLOSE untouched.
- **[#29](https://github.com/Jackscreations21/gms-theater-game/pull/29)
  — the FOH bar.** The six house-front lanterns hang on a steel pipe
  with drop wires (one `buildRig`, so all three theatres get it),
  raised and lowered from BOTH boards — a FOH BAR tfoot row on the
  desktop fly panel, a RAISE/LOWER pair on the VR fly page — 1.2m a
  press at 0.4 m/s, aims held so the lanterns tilt to keep their
  focus, per-stage park/restore via the p2k pattern, per-house floor
  clamp.

New headset questions from this round, for the step-zero list: does
the locked-at-rest rail read right (all red handles upright until you
pull one out); does the traveler rope fall to hand at the proscenium
and does the curtain answer it believably; does the FOH bar read as a
real position over the stalls, and is watching it travel from the
stalls comfortable; and at the rail, mind the frame rate again — #28
adds ~7 meshes per stage and #29 ~9, small but real.

**Session closed 2026-08-07: everything above is ON `main`.** The owner
merged #21–#30 the same day, `main` rebuilds byte-identical, 12/12
suites green on the merged result. Nothing is in flight.

**Done 2026-08-07, the rig/warehouse session (PRs #32–#35 — open as of
this writing; check they merged before building on them; they merge
clean in ANY order, seam-checked both ways, 13/13 on the combination).**
The owner deferred the VR build feature — "we have to do some other
things first" — and asked for six things. The spec is
`docs/superpowers/specs/2026-08-07-rig-warehouse-design.md` (approved,
five rulings inline — READ IT before touching any of this), the plan
for the first four is `docs/superpowers/plans/2026-08-07-rig-warehouse-prs1-4.md`,
and those four are built:

- **[#32](https://github.com/Jackscreations21/gms-theater-game/pull/32)
  — the FOH fix.** `wireTop` was one hard-coded 15.8 — Arc-sized; the
  Palace ceiling over the bar is 24.6 (`D.ceilY`), so its wires stopped
  8.8m short. `buildRig` now defaults to `D.ceilY` and `buildArcStage`
  overrides per house (15.8, re-posed). `FOHBAR.min` floor+3.2 → +2.0
  in all three houses: the lanterns come to chest height, the point
  being PR 5 makes them takeable. The full14 "below heads" test asserts
  the NEW rule now (to hand, pipe never on the floor). This PR also
  carries the spec and plan docs.
- **[#33](https://github.com/Jackscreations21/gms-theater-game/pull/33)
  — real lantern bodies.** The five p4 builders are real lanterns
  (barrel/gate/shutter handles, barn doors, gel frames, C-clamps),
  every geometry built once and shared (`FIXG` cache), lens materials
  cached (`LENSM` — shared, so never tint one per fixture;
  `userData.lens` is write-only today). Every body carries
  `userData.clamp` for PR 5. `buildRig` is byte-identical to before:
  **PAR is stocked, not hung** — no rig hangs one, the tests build one
  directly via `bodyPar()`, and the patch stays 25 channels.
- **[#34](https://github.com/Jackscreations21/gms-theater-game/pull/34)
  — speaker bars.** L+R flown PA per stage (short pipe, two wires,
  three boxes) at x ±(procW/2+1.6), z 2.8, home 9.4 — the FOH-bar
  pattern run twice: `SPKBARS` parked by p2k, SPK BAR L/R tfoot rows on
  the desktop fly panel, RAISE/LOWER pairs on the VR fly page at pixel
  y 312/366/448/502 (vr.js pins them by literal pixel — do not shift
  them, same trap as the FOH pair). No audio (RULING B). Boxes are
  static meshes until PR 5.
- **[#35](https://github.com/Jackscreations21/gms-theater-game/pull/35)
  — the warehouses.** A shed behind each venue — the first geometry
  that has EVER stood behind either back wall. Palace: doorway cut in
  the p2b brick wall at x=0, roller door, `shedP` [E] station, a
  fourth portal-culled room (`'shed'`, a z-slab past `D.backWall−0.7`).
  Arc: one shared shed behind both houses, a rear roller door per
  house (`mainRear`/`studioRear`, in each house's door UI);
  `arcRoomAt` answers `'shed'` BEFORE the main/studio sign test and
  `stageAt` returns null there, so crossing the shed's width does NOT
  swap the board — the foyer ruling. One 6-slot pushcart per shed,
  VR-only: squeeze the handle and it rolls through the SAME wall
  predicates the player walks against, nearest-wins against ropes and
  levers. Carts are venue-level on purpose (palace: `world` +
  `roomForce 'shared'`; arc: `ARC.group`) — review caught them
  vanishing in front of you when their shed room culled. Racks carry
  32 slot anchors per shed, waiting for PR 5. New 13th suite:
  `tests/warehouse.js`; probe: `tools/warehouse.js`.

Process notes that earned their keep: #33/#34/#35 by parallel worktree
agents with TWO-STAGE review (spec compliance, then quality) — the
reviews caught an agent quietly adding two PAR channels to make a test
pass (reverted: scope), the cart room-cull vanish, and a pitch-black
Arc shed (both sheds now carry dock-style keep lights). New trick,
keep it: give each branch a DIFFERENT insertion anchor in shared test
files (top / middle / end of the stages.js probe) — four branches,
zero textual conflicts.

**Done 2026-08-07, the detach/ordering session (PRs #37, #38 — #37
merged same day; #38 open as of this writing, check it merged before
building on it).** The rig/warehouse feature set is COMPLETE. Plan:
`docs/superpowers/plans/2026-08-07-detach-ordering-prs5-6.md`. Two
owner asks folded into #37: the speaker arrays went to SIX boxes per
side (was 3, J-array toe-in) and every box detaches individually.

- **[#37](https://github.com/Jackscreations21/gms-theater-game/pull/37)
  — the detach system** (spec §3+§4). Every FIXTURES record IS a
  hanging POINT; `BODIES` is the venue-level registry
  (hung / held / slotted / loose). An empty point's channel is DEAD via
  ONE gate — p4 `updateRig`, `lvl = f.body ? clamp(...)*master : 0`
  (the choke point is **p4:554** now, NOT ~418 — #34 moved it) — never
  via `visible`. RULING A holds: any lantern body answers whatever the
  point is patched as; speaker points take only PA boxes. The grab
  extends `vrSqueeze` nearest-wins (bodies 0.35 vs ropes 0.32 vs levers
  0.12 vs carts 0.30); held bodies follow the grip KINEMATICALLY, never
  re-parented to the hand, so `vrOnEnd`/`vrClearRopes` dropping the
  record cold is safe — `updateBodies` (p4) demotes and settles them.
  Release snaps: empty live point (0.4) → slot (0.4) → floor.
  **`vrClearRopes` now opens only ROPE holds** — a carried body or cart
  survives the stage walk (the Main→Studio carry the spec wanted).
- **[#38](https://github.com/Jackscreations21/gms-theater-game/pull/38)
  — ordering** (spec §6). A wall supply screen per shed (own canvas,
  own pixel hit list, `p.obj.userData.orderScreen` branch in
  `vrSelect`; screens build in `vrBuildOrderScreens`, called from
  `vrBuildDesks`). ORDER → ~30s (GAME time in `updateSheds`, never
  setTimeout — M7) → loaded pallet at the apron, six slots in the snap
  scan. RULING C free; D one pending per shed, pallet self-clears ~5s
  after emptied; E 24 loose bodies per venue → STOCK FULL. New 14th
  suite `tests/orders.js`.

Every new assertion (13 in #37, 6 in #38) verified to FAIL against the
pre-change build. #38 was built ON #37's branch and opened only after
#37 merged (rebase → retest → open): the clean way to ship dependent
PRs without stacking.

**Done 2026-08-07, the build-system session begins — THE VR BUILD
FEATURE HAS A SPEC NOW.** The owner specified it live: physically build
scenery from wood — order it, forklift the pallets, cut on shed saws,
nail with a gun / pull with a hammer, paint, hinges that swing, track
that slides, and the game's FIRST SAVE SYSTEM. Spec (rulings F–J
inline — read it before touching any of this):
`docs/superpowers/specs/2026-08-07-build-system-design.md`. Plan, all
seven PRs: `docs/superpowers/plans/2026-08-07-build-system-prs1-7.md`.
Built SOLO and STRICTLY SEQUENTIAL (owner's token ruling; the PRs are
a dependency chain on p9/p4c/p2m — do not parallelize them).

- **PR 1 (branch `build-ordering`, carries spec+plan) — ordering knows
  wood.** New part `src/p4c.txt` (after p4 in build.sh): wood as
  PARAMETRIC bodies — one shared unit BoxGeometry for every piece of
  every profile (sheet/2x4/4x4/2x8, all born 8ft), scaled per piece,
  six material slots per mesh from the color-keyed `WOODM` cache; a
  cut must NEVER mint geometry (spec invariant). Hardware (hinge /
  track / carriage) and paint cans (10-color `PAINT_COLORS`, band
  material from the same cache) are bodies too. `canHang` refuses
  build kinds (wood joins assemblies, PR 3 — never a patch point).
  Ordering: `ORDERS[v]` is now `{pending:[], pallets:[]}` — RULING D'
  is THREE orders out per shed, `ORDER_MAX` 12 units, pallets lay
  their anchors FROM the manifest (sheets flat-stack, long stock in
  columns, smalls on seats) at one of three apron spots. `BUILD_CAP`
  150 build pieces per venue (p4c, shown on the glass as PIECES
  n/150, refusal 'PIECES FULL'); gear keeps its own 24 book —
  `venueLooseCount` now skips build kinds. The screen grew a tab
  strip (GEAR/WOOD/HDWE/PAINT, rows at y=112 pitch 48 — vr.js pins
  the first + at px 468,132; sc.counts starts EMPTY, `|| 0` your
  reads). New 15th suite `tests/build.js`; every new assertion
  negative-checked (whole-suite vs main's build; the canHang guard
  by rebuild-without-it).

- **PR 2 (branch `build-forklift`, built on PR 1's branch — open it
  only after PR 1 merges, rebase first) — the forklift.** RULING H:
  walk-behind. `buildLift` in p2m parks one per shed; the record lives
  in `LIFTS[venue]` AND in `CARTS[venue+'Lift']`, so the p9 cart grab /
  chase / wall machinery drives it with NO fork of the arbitration —
  the only p9 additions are the toast and the fork stick (RIGHT stick
  Y while held; rx is turn, lx/ly walk — ry was free). `updateLifts`
  (called from `updateSheds`): forks crossing y=0.13 upward under a
  pallet's boards take it (`forks.attach`, spot freed); forks lowered
  home while riding set it down — snapped to the nearest `PALLET_SLOTS`
  paint within 0.6 (4 per shed, 2 per stage wing, palace west wall /
  wings ±16.5 z −15.5; arc shed ±31/±16 z −52 + per-house wings), else
  flat where it stands via `groundAt`. Pallets reparent by `attach()`
  only — venue root when down (they LEAVE the shed now; the old
  shed-group cull note is dead), fork group when riding.

- **PR 3 (branch `build-tools`, on PR 2's branch) — the toolbelt and
  the joints, the CORE.** New in p9: `VR.tools[hand]` — tools are a
  slot of their own so `VR.held` stays the single world hold it always
  was; one hand carries the plank, the other works the gun. Belt rides
  the hips (`vrUpdateBelt`, camera x/z − 0.72, head yaw); squeeze at a
  holster draws, open hand ANYWHERE holsters (tools cannot be lost);
  the trigger of a tool hand IS the tool (vrSelect head). p4c:
  `ASSEMBLIES` (root Group at venue root, pieces, nails as DATA);
  RULING G is `asmJoints` — one nail → a pivot group at the nail
  (grab = kind `'swing'`, hand drives the angle), two+ → rigid; the
  hammer (`removeNail`) is the only way apart; a piece at zero nails
  demotes to loose. Anchors ride their nails: 'deck' pins the root
  (grab refuses), 'pipe' hangs the root off `ls.group` so it FLIES —
  `ls.asmH` (asmHangDepth) extends p3 `minTrimOf`, so a flown flat
  floors at the deck (#15's rule; the negative check here caught a
  WEAK TEST first — on a dressed pipe the goods clamp masks the built
  clamp; the test now uses the barest pipe and pins the movement).
  The ghost snap (`snapWood`): held wood turns with the wrist
  (`relQ`), then squares to offered wood (yaw 45s, pitch/roll 90s,
  faces flush via |R|·h), the deck, or a live pipe; `VR.snap` is the
  standing offer and the gun confirms it. `snapAsm` makes the same
  offer for a carried assembly (no re-orientation). Tape: other hand
  takes the tab, ft-in on the label (`ftIn`), trigger marks
  `body.tick` for the saw fences (PR 4). Wood settles FLAT now —
  `b.restH` (woodRestH) replaces the lantern 0.25 in updateBodies.
  Watch for: `vrTapeLine` had to grow its OWN temps — callers pass
  the shared `_vecA` in as an argument (aliasing bit once already).

- **PR 4 (branch `build-saws`, on PR 3's branch) — the saws.** One
  station pair per shed (geometry in p2m `buildSaw`, logic in p4c): a
  TRACK TABLE (sheets only) and a CHOP BENCH (lumber only, 90°). One
  mechanic for both: wood released over a station SEATS (`seatWood` —
  length along table X, sheets keep whichever axis the hand offered,
  `'seated'` pieces never settle and `grabBody` unfiles them); the
  CUTTER is a sixth grab class (0.28, nearest-wins extended — bod /
  cart / lever / rope / saw all cross-check now); sliding it snaps to
  the INCH with a tape tick (body.tick) snapping FIRST (`sawSetCut`);
  the trigger with the cutter in hand cuts whichever piece lies under
  the blade (`sawCut`) — one body re-scaled, one registered, paint
  rides both (copied material array, shared entries), a side under
  six inches is scrap and vanishes, cuts at the piece cap are legal
  (the screen is the enforcement point). vrLabel is the readout —
  no per-station canvases.

- **PR 5 (branch `build-paint`, on PR 4's branch) — paint.** A rack
  per shed (`buildRack` in p2m, logic p4c): open cans for the colors
  the shed OWNS (four stock; a delivered can released within 1.8 of
  the rack pours in as a new color and the body is consumed —
  `rackTakeCan`), and ONE roller — a seventh grab class, parented to
  the controller ON PURPOSE (the one carried thing that is): release
  ALWAYS re-racks it (`vrReRack`), including from `vrOnEnd` BEFORE the
  hold record drops. Dip = hold the head within 0.16 of a can (tints
  the head); trigger = `paintWood`: sheets take the touched FACE (box
  material-group order px nx py ny pz nz, computed in unit-box local
  coords — worldToLocal already divides out the scale), lumber
  whole-piece; every entry from the WOODM cache, repaint is a pointer
  swap. Cans never run out (RULING C's spirit).

- **PR 6 (branch `build-hinges`, on PR 5's branch) — hinges & track.**
  A HINGE is a NAIL THAT SWINGS: hold the hinge body at the seam
  between a LOOSE piece and its neighbour, fire the gun — `addHinge`
  consumes the body into a range-limited (±90°) pivot whose axis is
  the hinge's OWN PIN (you place it the way it should swing); nail
  the door shut later and it goes rigid, hammer that nail and it
  swings again, hammer the HINGE and the body respawns loose. TRACK:
  held sections snap to a run's end (or the deck) and the gun lays
  them (`layTrack`) — one deck-anchored assembly per run, `a.track.n`
  sections along root-local X; a carriage released onto the run RIDES
  it (`rideTrack` — a slider Group: the pivot pattern with
  translation); wood gun-nailed to the carriage mounts UNDER the
  slider; grabbing any of it is a `'slide'` hold, hard stops at the
  ends (`slideTo`); the hammer pops an EMPTY carriage. `asmJoints`
  learned the difference: world nails (deck/pipe) and carriage nails
  never pivot — only piece-to-piece singles and hinges swing.

- **PR 7 (branch `build-save`, on PR 6's branch) — the save system,
  the game's FIRST.** All in p4c: `buildSerialize` → localStorage
  (`house.build`, versioned) → `buildLoad` at the p7 boot tail, which
  REPLAYS the same functions the hands use (makeSerBody → asmAdopt →
  addNail → layTrack → rideTrack), so the loaded world obeys every
  rule the built one did. Saved: build bodies everywhere (pose, dims,
  per-face paint by hex — the WOODM cache re-keys), shed/cart slot
  addresses, saw seats, assemblies (world-posed pieces, nails, hinges
  with ranges, deck/pipe anchors — pipes addressed as {stage, fly
  index} via `lsAddress`/`lsResolve`), track runs re-laid n-long with
  riders and their mounts, pallets with per-slot loads, pending
  orders with time left, rack colors, lift poses. NOT saved (spec):
  shows, cues, fly positions, patch. Dirty writes flush ≤1s; a 10s
  heartbeat backstops any missed dirty call. Load is wrapped WHOLE:
  any throw (bad JSON, alien version) clears the key and boots empty.
  CLEAR SAVE button on the order-screen footer wipes STORAGE only.
  The test is a true round trip: `build.js` boots a SECOND jsdom
  world seeded with the first one's save (needs `url:` on JSDOM —
  about:blank has no localStorage) and asserts it all came back.
  Known drift, accepted: a swung pivot reloads at its swung POSE but
  its stops re-baseline there (range measures from the reloaded
  pose); pipe-anchored work reloads at saved world pose whatever trim
  the pipe wakes at (fly positions are not saved, by spec).

**THE BUILD SYSTEM IS FULLY ON `main` (2026-08-07, same day):** all
seven PRs merged in order — #40 ordering, #41 forklift, #42 toolbelt,
#43 saws, #44 paint, #45 hinges & track, #46 save — each one rebased
onto the fresh `main`, retested 15/15, opened only after its parent
merged. Post-merge verification: `main` rebuilds byte-identical,
15/15 on the merged result, all seven work branches deleted local and
remote. The game on Pages now carries the whole feature; bust the
Quest cache with `?v=9`.

**Done 2026-08-07, the build-usability round (PRs #48–#51 — ALL
MERGED same day).** The owner's first bug list, straight off the
first headset run of the build system, four asks in one line: grab
the wood from anywhere on the wood; a table for building on; wood
auto-detects other wood and finds the best connection; "i wasnt able
to get the nail gun to work" (he laid two pieces together on the
ground and pulled the trigger — the gun only confirmed a ghost offer
on a HELD piece, so the natural move did nothing).  Specced first
(`docs/superpowers/specs/2026-08-07-build-usability-design.md`,
RULING K inline: the table is orderable and movable, and never takes
a nail), planned (`docs/superpowers/plans/2026-08-07-build-usability-
prs1-2.md` + addendum), then shipped failing-test-first, one concern
per PR, each branch cut after its parent merged:

- **[#48](https://github.com/Jackscreations21/gms-theater-game/pull/48)
  — grab wood by its SURFACE, not its centre.** The vrSqueeze body
  loop measured hand-to-centre against 0.35, so an 8ft stick was
  grabbable only across its middle 0.7m.  Wood now measures to the
  nearest point on the piece (unit-box local clamp, exact); constant
  `GRAB_WOOD 0.15`.  Sheets gained their corners; a built frame comes
  by any plank end.  Compact bodies keep the centre test.
- **[#49](https://github.com/Jackscreations21/gms-theater-game/pull/49)
  — the gun fires into a SEAM.** With no held offer standing, the
  trigger seeks the nearest touching wood pair within `SEAM_REACH
  0.45` of the muzzle (OBB touch on the target's axes, `SEAM_TOUCH
  0.05`) and drives the nail at the contact; addNail already knew how
  to join any mix of loose and fixed.  A throttled seek floats
  TRIGGER TO NAIL at a reachable seam while the gun is in hand.
  Same-assembly pairs stay nailable on purpose (that is how a
  swinging piece is nailed rigid).  Precedence: hinge in the other
  hand → held ghost offer → seam → refusal.
- **[#50](https://github.com/Jackscreations21/gms-theater-game/pull/50)
  — snapWood rebuilt.** The old step 1 picked targets by CENTRE
  distance ≤1.4 (end-to-end 8ft butts have centres 2.48m apart — they
  could NEVER see each other), picked its axis with no overlap test,
  and mixed unit-box coordinates with metric flush distances.  Now:
  candidates by surface gap (`SNAP_SEEK 0.35`), a face is a joint
  only if the cross axes overlap (`SNAP_SLACK 0.08`), daylight axes
  beat overlapped ones, smallest flush error ≤ `SNAP_OFFER 0.22`
  wins, all metric.  Ghost/quantize/gun-confirm contract untouched.
- **[#51](https://github.com/Jackscreations21/gms-theater-game/pull/51)
  — the WORK TABLE (RULING K).** A build kind on the HDWE tab:
  pallet-delivered, carried like a body, lands square on release
  (upright, yaw to 45).  Its top (`TABLE_TOP 0.925`) is a raised
  piece of deck — loose stock settles ONTO it (`tableTopAt`, asked by
  updateBodies before the floor), held wood is offered flat ON it
  (snapWood step 2a), the gun refuses the table target with its own
  toast; you build on it and carry the work off whole.  Counts
  against BUILD_CAP, canHang refuses it, rides the save for free
  (serBody is generic by kind).  EN ROUTE, a latent bug: the deck
  offer passed `_aq2` into snapQuantize, whose FIRST LINE overwrites
  `_aq2` — rel came out identity and every "lie flat" offer stood the
  piece bolt upright.  Both flat offers now use a real identity quat
  (`_IDQ`).  The aliasing trap strikes again — never hand a shared
  temp to a function that writes it.

Post-merge verification done: `main` rebuilds byte-identical, 15/15
on the merged result, all four work branches deleted local and
remote.  Pages carries it all — bust the Quest cache with `?v=10`.
Ten new regression tests across vr.js and build.js, every one
verified failing against its pre-change build.

**Done 2026-08-08, the build-feel round — the owner's second headset
list, nine asks, nine PRs, ALL MERGED (#53, #55–#62; #54 the handoff).**
Spec (rulings L–S inline — READ IT before touching any of this):
`docs/superpowers/specs/2026-08-08-build-feel-round-design.md`; plan:
`docs/superpowers/plans/2026-08-08-build-feel-prs1-9.md`.  Landed one
at a time, each branch rebased onto fresh `main` after its parent
merged, rebuilt and 15/15 before opening — the linear-chain discipline
that replaces stacking.  Post-merge: `main` rebuilds byte-identical,
15/15 on the merged result, work branches deleted.  What went in:

1. `feel-carry` = **#53** — wood rides IN the hand: the hold keeps
   the pose relative to the CONTROLLER (relQ + grabV, the grabbed
   point metric in the piece's frame); the wrist pivots about the
   palm, not about a centre four feet up the stick.  Lanterns keep
   the fixed centre carry.  Carries the spec+plan docs.
2. `feel-table` — the table was never immovable, it was UNGRABBABLE:
   the 0.35 test measured to its origin, which is its FEET on the
   floor under the middle of the top.  It now grabs by its frame box
   (RULING Q) and carries grip-relative; #51's square landing is
   re-pinned.
3. `feel-45` — held wood squares to the 45° grid on all three axes
   about the grab point; HOLD X frees it (`VR.btnX`, read in
   vrReadSticks, guarded for 4-button pads); a snapWood offer
   overrides both (RULING M).
4. `feel-freeze` — Y parks the held piece exactly where it is, mid-air
   included (`b.frozen`, RULING N): updateBodies skips it, grabBody
   and asmAdopt clear it, `fz:1` rides the save.  A parked piece is a
   legal snap target ON PURPOSE — park it, build against it.
5. `feel-nail-ray` — nails go where the gun POINTS (RULING L):
   `nailRay` (p4c) casts the muzzle ray 1.2m, drives the nail at the
   hit spot, partners with the piece touching there (or the nearest
   seam ON the hit piece within SEAM_REACH); lone wood refuses
   ("nothing behind it to bite"), NO cosmetic nails; a ray that hits
   nothing falls back to #49's muzzle seam.  Label = same cast.
6. `feel-compass` — the stick walks where the LEFT CONTROLLER points
   (`vrMoveYaw`, RULING O); keyboard and FLYING unchanged; ~14° of
   vertical falls back to headset yaw.
7. `feel-trash` — a steel drum by each shed's rack (`buildTrash`,
   p2m; `TRASH` in p4c): any held BUILD body released with its centre
   over the mouth is destroyed; DELETE ALL WOOD on the order screen
   footer (stacked under CLEAR SAVE, both 196×25 now) empties the
   venue's wood through `removeBody`/`deleteAllWood` — installed
   hinges respawn as hardware, bare track runs stand, gear untouched,
   a piece in a live hand skipped (RULING P).
8. `feel-paint-signs` — painting says how it works: `vrPaintLabel`
   floats SQUEEZE TO TAKE THE ROLLER / DIP THE HEAD IN A CAN /
   TRIGGER TO PAINT at the right moments; the PAINT tab's idle line
   is the two-line how-to.
9. `feel-ftin` — every player-facing LENGTH readout through `ftIn()`
   (RULING S): desktop fly rows + toasts, FOH/SPK rows, VR fly page,
   "bars in".  The MODEL stays metric — this was formatting, not a
   unit migration.  Two old tests that parsed the display were
   updated to compare the formatter's string of the model.

Process notes: ~14 new regression tests, every one verified failing
against its pre-change build (the freeze save-leg at the exact
midpoint: runtime in, serialization not).  The chain tip passed all
fifteen suites, which IS the seam check for a linear chain.  One
trap re-confirmed: a regex literal inside a test PROBE template
loses its backslashes (`/\d/` arrives as `/d/`) — build regexes from
doubled-backslash strings there (full14's ft-in test).

**Done 2026-08-08, the goods round — two asks, two PRs, both merged
(#63, #64).**  Spec (rulings T–W):
`docs/superpowers/specs/2026-08-08-goods-round-design.md`.

- **[#63](https://github.com/Jackscreations21/gms-theater-game/pull/63)
  — the roller paints the goods** (RULING T).  Cloth as well as wood,
  and WHOLE: a pull against any cloth on a lineset colours every cloth
  on that lineset (both halves of a house curtain, both legs of a
  pair).  The trap it is written around: `M.serge` and `M.velour` (p2)
  are ONE material object each, shared by every border, leg, half leg
  and house curtain on ALL THREE stages plus the Arc's dressing and
  the Cornley velvet — tinting one would have repainted the masking of
  the whole game.  So paint clones through `GOODSM`, keyed by the
  ORIGINAL base plus the colour (`userData.goodsBase` stops
  clone-of-clone chains): repaint is a pointer swap, two pipes the
  same colour share one material.  **The WOODM/LENSM lesson, third
  time — if you add any paintable class, do it this way.**  Reach is
  to the goods' BOUNDING BOX (a 13m curtain's centre is five metres
  up — the 8ft-stick bug); wood keeps priority under the roller; only
  `isMeshStandardMaterial` takes a coat, so the chandelier's self-lit
  bulbs stay lit; the paint labels learn goods.
- **[#64](https://github.com/Jackscreations21/gms-theater-game/pull/64)
  — the VR goods picker** (RULINGS U + V).  The fly page's goods cell
  is a button: it opens a per-lineset picker (every `GOODS` entry with
  its weight, current one lit, own BACK) and choosing calls the same
  `hangGoods` the desktop palette calls.  **Hanging rebuilds the rail**
  (`vrBuildRopes`), or a newly hung pipe would have no rope and no
  lock and a stripped one would keep a rope to nowhere.  `vrHit` now
  takes optional META so the picker's regions are findable by meaning
  rather than by pixel (vr.js pinning rows by literal pixel has been a
  trap twice).  **RULING V, a real bug it flushed out:** `minTrimOf`
  (#15) is enforced by everything that MOVES a pipe, and hanging is
  not a move — a 13m house curtain hung on a pipe standing at 2m put
  ten metres of cloth through the stage.  `hangGoods` now lifts a pipe
  that is below its new floor; one with clearance never moves.  This
  fixed the desktop palette too.

**RULING W stands and is the owner's to revisit: the hang is NOT
saved, and neither is its paint.**  The build save deliberately
excludes shows, cues, fly positions and the patch; what is on each
pipe belongs with those.  Saving paint without the hang under it would
be incoherent.  If the owner wants persistence, save the hang (key per
lineset per stage) AND its paint together in the same versioned blob —
its own small round, not a bolt-on.

**Done 2026-08-08, the carpenters round — spec #68, PRs #69–#73,
landed via #74.**  (The chain lesson, so it is on the record: the
owner waived never-stack and the four chain PRs were opened at once,
each targeting its parent; on merge day #71–#73 were merged INTO
their parent branches instead of being retargeted to `main` after
each parent landed, so `main` briefly held only PRs 1–2 and #74
carried the verified chain tip across.  Never-stack earned its keep.)
RULINGS X–AC — after Z the letters double.  What shipped:

- **The crayon** (#69, RULING Z): fourth belt tool at the small of
  the back (0/-0.17 — every holster pair beyond the 0.22 draw radius,
  first-in-range wins); forward ray at `WALKABLE`, ankle-height
  floors only — the y≈8 gallery AND a loaded show's y=0.3 floor both
  refuse: the crayon wants the BARE deck.  One mark stands; re-fire
  moves it; palletSlot-style paint, `-ARC.X` corrected, yaw from the
  controller's facing.
- **The catalogue and planner** (#70, RULING Y): new part `p6c`
  between `p6b` and `p5c`; `CARP_CAT` (4x8 FLAT / 4x8 PLATFORM /
  2-STEP UNIT) with inch-grid cut schedules and mark-local
  blueprints, two nails per joint (RULING G — carpenters build
  rigid); `carpSurvey`; `carpPlan` PURE — NEED list, or PIECES FULL
  counting the bodies the cuts will MINT (a new cap enforcement
  point: nothing downstream of the order screen checked it), or the
  phased job queue.  16th suite `tests/carp.js`.
- **The lead and the saws** (#71, RULINGS AA + AC): the seventh
  figure — apron, no cap, `trade:'carpenter'`, always `people[6]`;
  trade guards BEFORE the queue shift so the head job waits for the
  right person; REAL carry (`attach` both ways, the new `'carried'`
  state — `'held'` demotes to loose every frame and would sink the
  plank out of the walking arms); `carpFetch`/`carpCut` through
  `seatWood`/`sawSetCut`/`sawCut` with a pencil tick so scheduled
  lengths beat the saw's 0.01 seat offset; `CARP_RUN` records what
  each cut kept.
- **The haul and the nails** (#72, RULINGS AB + AC): the six hands
  wake for the run; ONE piece per trip to the mark (poses composed
  through the mark's yaw); both blueprint nails per joint via
  `addNail` on live transforms; NO deck nail — the finished piece
  lies un-anchored and grabbable at the mark; `restH` carries the
  stack (the settle cannot see wood under wood); the work rides the
  save with zero new save code (round-tripped in a second world);
  a stood-down run leaves honest workshop state and the CALL itself
  is not saved.
- **The CARPENTERS screen** (#73, RULING X): a second wall panel
  beside each shed's order screen (the order canvas is pixel-pinned
  by tests and UNTOUCHED); META hits only; the selected row's live
  verdict off the pure planner; refusals in spec order — PICK A
  PIECE / NO MARK / MARK IS IN THE OTHER HOUSE / CREW BUSY /
  NEED 1× SHEET · 3× 2x4 / PIECES FULL; a called build runs under
  the show crew's work light.

Built by four sequential agents on a reviewed linear chain — every
link 16/16 green with the suites re-run independently, every new
assertion negative-checked, six new TRAPS.md entries (the crew /
carpenters section).  **NONE of it has met hardware** — the new
question block rides the headset section below.

**Done 2026-08-08, housekeeping — a stale clone caught up, and the
branch list swept.**  No game code changed.  A second working copy was
still parked on `handoff-carpenters` with its `main` at `4986f25`,
**nineteen commits behind**: the entire carpenters round, `STATE.md`
and the `docs/guide/` system had all landed from another machine while
that clone sat still.  Fast-forwarded to `origin/main` @ `b22c299`
(clean, no divergence, nothing local discarded) and verified the
standing rule — `sh build.sh` reproduces the committed
`the-house.html` byte for byte (`built 850229 bytes syntax OK`).

Then the sweep: the three `.claude/worktrees/agent-*` worktrees from
the rig/warehouse round removed (each checked clean first, then
`git worktree prune`), and the **sixteen** fully-merged local branches
deleted — the thirteen feature/handoff branches plus the three
`worktree-agent-*` pointers.  `git branch --no-merged origin/main` was
empty beforehand and `-d` was used throughout, so git itself was the
backstop.  `main` is now the only local branch.

**The lesson, which is the reason this is in the record at all: fetch
and compare before trusting a local checkout — or a handoff — about
what comes next.**  This clone, and the session memory that went with
it, both confidently said "NEXT = CARPENTERS" for a round that had
already shipped.  `git log main..origin/main` is the first move of any
session that did not personally watch the last one land.

Left deliberately undone: `origin` still carries ~40 merged branches
(`carp-*`, `feel-*`, the `handoff-*` series and every older feature
branch).  Local pruning is private; deleting them on GitHub changes
what everyone else sees, so it stays the owner's call — the suggestion
if it happens is to keep `carpenters-landing` and the `handoff-*`
series as the round record and prune the rest.  `pr6.json` is still
untracked, still unruled.

**Done 2026-08-08, the first headset findings — and CARPENTERS PHASE 2,
specced and built the same session (PRs #76–#79, all merged).**

The headset finally went on, and two things came back.

**"there is no but to open iether of the garages in the arc theaters"**
— true, and worse than it read. Every one of the Arc's eight doors
opened ONLY from the DOM panel (`p7`, `#arcDoorList`), and the two
warehouse rollers are the ONLY way into the Arc shed — so in VR the
whole shed was unreachable: order screen, carpenters screen, both saws,
paint rack, trash drum, forklift, cart. The Palace was never affected
because its shed door carries an `[E]` station and the VR trigger runs
the same `pickAll` → `describe` → `useInfo` chain the desktop crosshair
does. [#76](https://github.com/Jackscreations21/gms-theater-game/pull/76)
puts a control box on the stage side of each rear door (0.8m clear of
the opening, at hand height, filed with the HOUSE room because the shed
room can be culled from where you stand) and one `arcDoor:<key>` branch
in `useStation`, keyed off `ARC.doorMap` so any Arc door that grows a
control later needs no branch of its own. **The other six Arc doors are
still DOM-only** — deliberately left, one branch away.

**"i cant find the screen for the carpenters in iether warhouse"** — the
Arc half was the bug above. In the Palace the screen was where it
should be: a probe on the committed build put it at (9.1, 1.7, −30.1),
1.7m to the RIGHT of the order glass on the same wall, and the deployed
Pages file was byte-identical to `main`. The owner confirmed the build
was current (the crayon was on his belt), so it was a finding-it
problem, not a missing-it one.

**Then phase 2**, off four asks: build several things at once; a flat
with a door hole; one with a window hole; flats with or without the
sheets — plus **"it wont let me rotate stuff once it is built"**. Shaped
live: the batch is a LIST worked in order, it STACKS on the one mark,
and the skin is a SWITCH rather than eight catalogue rows. Spec
(RULINGS AD–AH):
`docs/superpowers/specs/2026-08-08-carpenters-phase2-design.md`; plan,
with an as-built section recording five deviations:
`docs/superpowers/plans/2026-08-08-carpenters-phase2-prs1-4.md`.

- **[#78](https://github.com/Jackscreations21/gms-theater-game/pull/78)
  — RULING AD: a built assembly turns in the hand.** The `asm` hold
  copied `position` and never touched the root's quaternion; loose wood
  got the grip-relative carry and the 45° grid in build-feel #53, the
  `asm` hold got neither. And the carpenters assemble LYING FLAT
  (RULING AC) — so every flat they had ever built was stuck face-up on
  the deck for good. It now takes `relQ` + `grabV` exactly as a plank
  does, squares to 45° unless X is held, and `snapAsm` is untouched: it
  still offers only the drop, never a re-orientation.
- **[#79](https://github.com/Jackscreations21/gms-theater-game/pull/79)
  — the rip, the two new rows, and the build list**, three commits:
  - **RULING AE's mechanism.** A sheet can never have a hole cut in it
    (parametric wood; a cut must not mint geometry), so an opening is
    FRAMED and skinned in pieces AROUND it. The saws already rip —
    `dims {L, W}`, `seatWood` reads the offered axis, `sawCut` writes
    either dimension — only the schedule could not ask, because
    `carpCut` seated every sheet `'L'`. A cut entry now names its axis;
    two entries may name one stick; a second entry wanting it turned
    emits a fetch with no body, meaning *re-seat what is on that bench*.
  - **The DOOR FLAT and WINDOW FLAT** (30×80″ and 30×36″ openings, the
    window's sill 36″ up), each framed with two 89″ jambs and a 30″
    header (**RULING AE amended mid-build**: the original 41″ header
    made the jambs 76.5″, and the saw snaps to the inch). Both skins
    come out of ONE sheet each — the check that the schedules are
    honest — and both leftovers go back as stock, not scrap. **SKIN is
    a switch on the CALL** (RULING AF) via `carpParts(row, skin)`, one
    pure helper the planner and the glass share; piece INDICES never
    move, so a dropped piece leaves a hole in the numbering and
    `flat4x8` never had to be reordered.
  - **The build LIST** (AG + AH): a count per row, one CALL, worked in
    order and stacked on the one mark (RULING Z stands — `restH`
    already carries a stack). Stock and cap are judged for the WHOLE
    list before a single cut, and piece indices are offset per item or
    item two's piece 0 overwrites item one's.

Every new assertion negative-checked **against its own parent build**,
not just against `main`, so each link genuinely fails before its fix.
16/16 at every link and at the tip. Post-merge: all four PRs merged
with `base=main` (the #71–#73 mishap did not repeat), `main`'s tree
identical to the tested branch, byte-identical rebuild (873188),
`"fatal": null`, and Pages already serving the same bytes. **Bust the
Quest cache with `?v=13`** — the game changed twice that day.

One real bug the work flushed out, now in TRAPS: `carpCut` decides
whether to keep the remainder seated by peeking at `CREW.jobs[0]`, and
it only knew about another `carpCut` — so the re-seat that turns a
sheet round to rip it found an empty bench and both skin strips
silently went missing (8 pieces instead of 10, no error anywhere).

**Done 2026-08-09, the geometry review — and the draw call it turned up
([#81](https://github.com/Jackscreations21/gms-theater-game/pull/81),
OPEN as of this writing; check it merged before building on it).**

The owner had the object system reviewed from outside. **Verdict: keep
polygon meshes — no voxels, no SDF/raymarching, no CSG-first
architecture**, and it rated the current approach 8.5/10 for this kind
of game. That verdict is accepted and is the standing answer if the
question comes round again. Three things about it are worth the record,
because the review was working off the file rather than this document:

- **Its CSG condition is already met, and the answer is still no.**
  "Only if players start cutting holes in scenery or constructing
  custom geometry" describes the build system exactly, and phase 2
  shipped a DOOR FLAT and a WINDOW FLAT the day before. We already
  ruled on it: RULING AE frames and skins AROUND an opening because a
  cut must never mint geometry — which is also how a real flat is
  built, so it reads right at arm's length. And the deeper reason:
  `buildLoad` persists a world by REPLAYING the functions the hands
  use, and a boolean result has no such replay, so it would be
  invisible to the save.
- **Two of its four recommendations were already done.** Seats have
  been instanced since the beginning (1,368 Palace, 1,273 Arc); the
  culling code it noticed IS the r128 instanced-bounding-sphere fix.
  And its "InstancedMesh: 11 uses" counts constructor sites — one of
  them is the `instanced()` helper at `p2.txt:359` with **30 call
  sites**. Geometry reuse is done too, and was learned here as a bug
  three times over (WOODM, LENSM, GOODSM).
- **GLTF stays out for now**, and the reason is priority, not purity:
  it buys visual richness, not frame rate, and the frame-rate question
  is the open one. (The page already pulls three.js off cdnjs with a
  unpkg fallback, so the network dependency is precedent, not a
  blocker — this is a "later", not a "never".)

**Then, costing out the one idea the review did leave open** — merge
nailed wood into a single mesh and un-merge on the hammer — the real
finding turned up, and it was in the file all along:

```js
const mesh = new T.Mesh(WOODG, [m, m, m, m, m, m]);   // the SAME material, six times
```

`BoxGeometry` has six groups and r128 submits **one render item per
group** whenever a material is an array — so six identical entries cost
**six draw calls to draw one bare plank**. 900 for the wood alone at
`BUILD_CAP`, per eye, doubled for stereo. Only a sheet can ever be
patchy (`paintWood` coats lumber whole), so #81 gives a piece ONE
material while its six faces agree and promotes to the six-slot form
only when one differs: 10 pieces 60 → 10 draw calls, 150 pieces
900 → 150, painted sheets unchanged. `woodFaces`/`woodSetFaces` are the
only two functions that know which form a mesh is in, and both COPY
rather than alias (the shared-temp trap, fourth time). **The save format
does not change** — `serBody` still writes six hexes either way, so old
saves load and new saves load on old code.

**THE MERGE ITSELF WAS DEFERRED, deliberately, by the owner** — see the
next section for the gate and for the design work already done on it, so
it can be picked up cold.

One false green found and fixed en route, now in TRAPS: the saw test
painted a face by poking `sheet.mesh.material[2] = red`. On a
single-material mesh that hangs a stray numeric property on the SHARED
cache entry both cut pieces point at, so `material[2] === red` read its
own poke straight back and passed while testing nothing — and polluted
that material for the rest of the run. Nothing ever went red.

**Done 2026-08-09, the workshop round — the belt and the shed made real
(spec #83, PRs #84–#87), and then the settle fix (#88).**

The owner's ask, verbatim: *"make everthing on the tool belt and in the
warhouse look mor realistic (saws, nail gun, tape measure, hammer,
shelves, etc). would it help if i found 3d models for everything and you
just had to scale them and put it in or do you want to do it all
yourself"*

**The models question is answered on the record as RULING AI: no
external assets, ever.** Four reasons, all specific to this repo, so it
does not have to be re-litigated: all seventeen suites boot the whole
file in jsdom and assert on geometry SYNCHRONOUSLY, and `.glb` loading
is async; `GLTFLoader` fetches over XHR, which a `file://` page is
blocked from doing, so double-click-to-open would die; it ends the
one-file property; and free models carry licences a repo that may go
public cannot. What helps instead is **photographs** — the locking rail
reads well because the owner sent a photo of a real one. For this round
the owner delegated judgment, so the headset run is the review.

Spec: `docs/superpowers/specs/2026-08-09-workshop-realism-design.md`
(RULINGS AI–AN). Plan:
`docs/superpowers/plans/2026-08-09-workshop-realism-prs1-4.md`.

- **#84 — the palette, the merge helper, the belt.** `mergeParts()` in
  p2 (r128's core ships no `BufferGeometryUtils`): bake each part's
  transform into its vertices, concatenate, one draw call for a cluster
  of static detail. Six SHARED canvas textures — galvanised, cast iron,
  moulded plastic, rubber grip, chipped hazard yellow, ply — plus a
  cached stencil helper. Then the four tools: a pneumatic framing nailer
  with an angled magazine, depth-adjust nose, contact tip and hose
  fitting; a 20oz framing hammer with a claw and a waffled face; a cased
  tape with a brake button, belt clip and hooked blade; and a
  carpenter's pencil that is actually flat. New 17th suite,
  `tests/workshop.js`.
- **#85 — the cut stations.** A fence, T-slots, stretchers and a real
  saw head with motor, guard and dust port on the track table; a kerf
  plate, feed rollers, pivot boss, motor and handle on the chop bench.
- **#86 — the paint rack, the roller and the drum.** Shelving with
  uprights, brackets, a back rail and drip-stained ply; a roller with a
  grip and crank; a ribbed drum with hoop bands.
- **#87 — the heavy plant.** The forklift becomes a walk-behind pallet
  stacker (mast channels, tie, hydraulic ram, lift chain, tiller control
  head, counterweight); the cart gets gussets, a lower rail, castors
  with yokes and ply deck boards; the racking gets punched uprights,
  beams, braces and footplates.

**The whole point, and it held: every object gained substantial detail
and the set costs 40% FEWER draw calls.** Measured by `tools/census.js`
against the pre-round build, per venue:

| object | before | after |   | object | before | after |
|---|---|---|---|---|---|---|
| nail gun | 3 | 3 | | trash drum | 3 | 2 |
| hammer | 2 | 2 | | track table | 7 | 4 |
| tape | 2 | 2 | | chop bench | 7 | 4 |
| crayon | 2 | 2 | | forklift | 12 | 4 |
| paint rack | 12 | 12 | | pushcart | 13 | 3 |
| | | | | **total** | **63** | **38** |

**RULING AJ is why a sweep this wide was safe: the round was cosmetic
and behaviour was frozen, enforced by every pre-existing suite passing
UNEDITED.** Across all four PRs the only change under `tests/` is the
new `workshop.js` plus one line in `run-all.js`. RULING AL named four
things that must never merge, each with an assertion: the saw `cutter`,
the lift `forks`, the paint `roller.head`, and the cans.

**Then #88, and it is the one that most likely answers "it lags".** The
owner asked for the build feature to lag less. Measured first with a new
probe, `tools/buildload.js`: `updateBodies` cast a recursive raycast AND
scanned the whole body registry for every loose piece every frame —
**including pieces lying perfectly still.** At `BUILD_CAP` that is 150
of each per frame; the probe reported 150 loose bodies and 0 moving.

| loose pieces | before | after |
|---|---|---|
| 25 | 0.259 ms | 0.027 ms |
| 100 | 1.044 ms | 0.096 ms |
| 150 | 1.565 ms | 0.146 ms |

11.3% of a 72Hz budget down to 1.0%, on a desktop; a headset CPU is
several times slower. A settled piece is re-tested on a rota
(`REST_ROTA` 12) spread by body index; `grabBody` wakes its venue, so
the rota is only a backstop and nothing visibly hangs in the air.
`groundAt` also stopped minting two `Vector3`s a call — GC churn, which
reads as hitching rather than slowness, and it was hurting the player's
own movement too.

**Process notes worth keeping.** Three plan defects were found by the
implementing agents ESCALATING rather than working around them, and each
would have shipped a lie: the census probe called `vrBuildBelt()` cold
when `VR.rig` is null outside a session; a muzzle assertion checked
`mesh.position` for geometry that had just been merged to the origin;
and an assertion about paint-can materials was simply wrong about the
data (`canMeshes` holds Groups). The last one is the sharpest — the
tempting "fix" was to merge the can body with its colour band so the
assertion became true, which would have made the whole can take the
paint. **A review of `mergeParts` also found its first four assertions
passed against five deliberately wrong implementations**, including one
that drops a `clone()` and mutates a caller's cached geometry. That is
now a TRAPS entry in its own right: negative-check against a WRONG
implementation, not merely an absent one.

**None of it has met hardware.** New questions ride the headset section.

---

## THE CARPENTERS BRIEF (2026-08-08 — superseded the same day)

Kept for the record; the round above answered it.  The owner's
answers to the five shaping questions: (1) a catalogue on a warehouse
screen; (2) cut at the shed saws, erect at a crayon-marked spot;
(3) real stock; (4) hybrid — hands haul and nail, a lead carpenter
owns the saws; (5) VR only.  Plus: planks visibly carried, one piece
per trip — never the show-load-in dummy look.

**The questions that decide the whole shape** (ask these first):

1. **What do you point them at?**  A named thing from a catalogue
   ("build me a 4x8 flat", "a 2-step platform"), a cut list, or
   something you have already built once and want copied?
2. **Where do they work** — at the shed saws and carry it out, or on
   the deck where it will stand?
3. **Do they consume real stock?**  The honest version orders wood,
   forklifts the pallet, cuts on the saws and nails it — every step
   the player does.  The cheap version conjures the timber.  The
   honest one is much better and MOSTLY ALREADY BUILT (see below).
4. **Are they the existing hands or a new trade?**  `CREW.people` are
   six generic stagehands; carpenters could be a new job kind in the
   same queue, or their own crew with their own frame and log.
5. **Can you call them from inside VR**, or is it a desktop-console
   call like CALL THE CREW?  (The VR fly page and order screens are
   the two precedents for a VR button.)

**What already exists that a carpenter should reuse — do not rebuild
any of this:**

- **The crew engine, `p6b`.**  `CREW.jobs` is a plain queue of
  `{kind, …}` records; `crewAssign(h)` switches on `job.kind`
  ('doors' | 'fly' | 'on' | 'off' | 'hold'); a hand walks with
  `handGoTo(h, x, z, then)` and works with
  `h.state='work'; h.wait=…; h.then=…`.  **Adding a trade is adding
  job kinds**, not a new engine.  `crewPlan(dir)` is the model for
  planning a sequence; `'hold'` is the barrier that waits for everyone
  to finish.
- **Every build primitive, `p4c`.**  `regWood(prof, dims)` mints
  stock, `seatWood`/`sawSetCut`/`sawCut` cut it on a real station,
  `addNail(a, target, wp, wax)` joins anything to anything and builds
  or merges the assembly, `asmAdopt`, `addHinge`, `layTrack`,
  `paintWood`/`paintGoods`.
- **THE BIG WIN: build through the same functions the hands use and
  the work rides the SAVE for free.**  `buildLoad` already replays
  exactly those calls (makeSerBody → asmAdopt → addNail → layTrack) to
  rebuild a saved world, so anything a carpenter assembles the same
  way serializes with no new save code.  A carpenter that pokes meshes
  directly would be invisible to the save — **do not do that.**

**Constraints a carpenter plan must respect:**

- `BUILD_CAP` is 150 build pieces per venue and the ORDER SCREEN is
  the enforcement point — a carpenter must check it too, or it will
  quietly walk past the cap the player is refused at.
- **Never `setTimeout` for game timing** (ruling M7): time comes off
  the frame `dt`, the way `updateSheds`/`updateOrders`/`updateLifts`
  do.  A carpenter tick belongs in that family.
- **Only the LIVE stage ticks** (documented limitation, §6): walk away
  mid-build and the carpenters freeze until you come back.  Decide
  deliberately whether that is acceptable or whether this is the
  feature that finally makes parked stages tick.
- The crew work out of the PALACE dock for `CALL THE CREW` (LOAD IN
  NOW works anywhere) — a carpenter needs the same `crewFrame()`
  treatment or it will build on the wrong stage's deck.  Read the
  §4 invariants on stage coordinates before writing any placement.
- Wood is PARAMETRIC and a cut must NEVER mint geometry (build spec
  §9): re-scale one body, register a second.

**Likely first PRs, if the owner's answers are the obvious ones:** the
carpenter job kinds + a trade in `CREW` (or `SHOP`) ; a catalogue of
buildable items with cut lists ; the call button (VR + desktop) ; the
saw/nail choreography so it reads as work rather than teleporting
timber ; the piece-cap and stock refusals.
(What actually shipped differs only where the owner ruled: VR only,
no desktop call, and the mark tool nobody had predicted.)

---

## NEXT SESSION: **THE FRAME-RATE ROUND**

The owner's call, 2026-08-09. It runs THROUGH the headset run below —
you cannot do this one at a desk — so put the headset on, take the
numbers FIRST while the questions are still unanswered and the room is
fresh, then work the feel questions in the section below while it is on
anyway.

**Load `…/the-house.html?v=14` once #81 has merged** (`?v=13` is the
pre-#81 build — if #81 is still open, you are measuring the OLD wood and
the numbers are not the ones this round wants). Bump the number either
way: the Quest Browser caches hard.

### Step zero: read the meter, and let it choose the round

The wrist tag (#22, LEFT WRIST — glance at your watch) has **never met
hardware**. It reports avg/worst against budget plus the live foveation
level, and that second number is the diagnostic, because **foveation is
a FRAGMENT-side knob**: it cuts pixel work at the periphery and does
nothing whatever for draw calls or vertex work.

| The tag reads | The wall you are hitting | What to do |
|---|---|---|
| foveation climbs 0.4 → 1.0, frames recover | fill / fragment | knobs 2, 3, 5 below. **Do not merge.** |
| foveation pinned at 1.0, still red | not fragment — submission / CPU | knobs 1, 4, then THE MERGE |
| foveation sits at 0.4, green | headroom | **stop. Ship nothing.** |

Two of the three outcomes say do not build the merge. That is the point
of measuring first.

### Stand in these four places and write the numbers down

Blank on purpose — fill it in and this section becomes the record:

| Where | avg ms | worst ms | foveation | notes |
|---|---|---|---|---|
| centre stage, full rig, haze | | | | |
| at the locking rail, full hang | | | | |
| anywhere a rig fills the view (#33's bodies) | | | | |
| **a real build standing under a lit rig** | | | | THE UNMEASURED ONE |

That last row is the case nobody has ever measured and the reason this
round exists: wood is one draw call per piece, `BUILD_CAP` is 150 to a
venue, and r128 draws each eye separately. Stand a full stack of flats
up and read the tag. Note the piece count when you do.

### What has already been spent on frame rate (do not redo it)

- **#21** — the session is paced at 72Hz, not 90 (13.9ms of budget
  instead of 11.1). One line to retune if the meter shows headroom.
- **#22** — the meter itself, plus foveation on a feedback loop:
  climbs by 0.15 when over budget, relaxes by 0.05 toward a 0.4 base.
- **#23** — `VR.lightCap = 4`: four real spotlights in VR, not eight.
  178 `MeshStandardMaterial` uses pay per-pixel for every live light.
- **#81** — wood holds ONE material until its faces disagree: 6× fewer
  draw calls on every unpainted piece (900 → 150 at the cap, per eye).
  **This is already in — the meter reads the world AFTER it.**

### The knobs, in order, gated on what the meter said

One change per PR, retest after each:

1. **Batch the locking rail** — merge its static per-line meshes
   (housings, number plates via a shared atlas, runs, blocks) into
   shared geometry or instanced draws in `vrBuildRopes`. Only the
   lever, knob and grab section actually move per line. ~11 unbatched
   meshes per line today. Built correctness-first on purpose; this is
   the deliberate follow-up.
2. **`VR.beamCap` below 10.** Additive beams in haze are overdraw — the
   thing a mobile tile GPU hates most. Fragment-side.
3. **Framebuffer scale below 0.85** (`setFramebufferScaleFactor`, p9
   wiring). **MUST be set before any session exists** — start-only.
4. **Merge the lantern bodies' static steel** (gel frame 4→1, shutter
   handles 4→1, yoke+stem+bolt+safety→1 per yoke radius). Keep the jaw
   and lens separate — the jaw IS `userData.clamp` and is grabbable.
   17 meshes → ~8 per profile, zero visual change. Spec'd in #33's
   quality review.
5. **Cut `SMOKE.n`; preselect RENDER *low* before entering.**

### THE MERGE — deferred 2026-08-09, gated on row four above

Merge the pieces of a nailed assembly into one mesh; the hammer
un-merges. Deferred by the owner in favour of #81's cheap half. The
design work is done, so it can be picked up cold — but **only if the
meter says submission-bound**, and note the honest arithmetic first:
after #81 a five-flat scene is ~50 draw calls of wood, and merging takes
it to ~5. Forty-five draw calls is the whole prize. Do not spend a round
on it blind.

If it is built, the rule that makes it safe is: **the merge is a
RENDERING representation, never a model change.** `a.pieces` stays the
truth — dims, pose, paint, nail count — and the merged mesh is a derived
artifact rebuilt on any structural change. That is the same discipline
`buildLoad` already runs on, so un-merging on the hammer is a replay
that is mostly written. What it constrains:

- **Only rigid pieces merge.** A one-nail piece rides a pivot and swings
  by hand (RULING G) — it must stay its own mesh. Candidates are
  2+-nail pieces sharing a material inside one assembly.
- **`BUILD_CAP` must not move.** The cap counts pieces of wood in the
  venue — the fiction, not the mesh count. Keep the count on the
  records or a player quietly builds four times the wood.
- **`nailRay` needs to know which piece it hit.** It casts the muzzle
  ray 1.2m; against a merged mesh you get a point but no identity. Map
  the hit to a piece by its OBB — `snapWood` already does metric
  surface-gap maths worth borrowing.
- **Paint and cut both invalidate the merge** and need a rebuild call.
- **Disposal.** Merging mints a real geometry per assembly. `disposeTree`
  (p3:168) only ever disposes GEOMETRY, never materials — which is
  correct here, but it means the merged geometries are the thing that
  will leak if nobody disposes them.
- `mergeBufferGeometries` lives in `BufferGeometryUtils`, an examples
  module **not in the cdnjs `three.min.js` this page loads**. It is ~40
  lines of hand-written concatenation, not a library call.

### While the headset is on

Everything in the section below is still owed and this is the same trip.
Take the numbers first, then work those question blocks oldest-first.

---

## NEXT SESSION (cont.): **THE HEADSET RUN** (owed since #48)

Everything from #48 onward — the usability round, all nine build-feel
PRs, both goods PRs, the carpenters round and now PHASE 2 — has met
hardware NEVER, except the two things the 2026-08-08 run turned up
(#76, #78).  Put the owner on `…/the-house.html?v=16` (the game changed
five times on 2026-08-09) and work the question blocks below, oldest
first.

**New questions, THE WORKSHOP ROUND (#84–#88) — record the answers here:**

- **Do the tools read as tools?** They are held at arm's length
  constantly, which is where proportion is unforgiving and texture
  detail is not. Does the nail gun read as a framing nailer, the hammer
  as a 20oz framing hammer, the tape as a tape? **No reference photos
  were used — the owner delegated judgment — so some of this will be
  wrong, and this is the review.** Naming what is wrong is more useful
  than a verdict: too big, too small, wrong shape, wrong colour.
- **Is the muzzle still where your hand expects it?** The gun now has a
  visible nose, depth adjuster and contact tip. `nailRay` casts from the
  same place it always did, but a visible muzzle changes where you
  *think* you are pointing.
- **Does the shed read as a working scene shop**, or as a room with
  objects in it? The saws, the racking and the plant all gained the
  parts that make them identifiable; the question is whether the room
  now reads as somewhere work happens.
- **Is the hazard-yellow forklift too loud?** It is the only saturated
  colour in either shed and it will pull the eye. If it does, the
  material is one entry in `M` and the fix is a line.
- **THE LAG QUESTION, the one that matters most.** #88 cut the build
  system's per-frame CPU 11× (1.565 ms → 0.146 ms at `BUILD_CAP`) and
  the workshop round cut the shed's draw calls 40% (63 → 38 meshes a
  venue). **Stand a real build under a lit rig and read the wrist
  meter.** If it is still red, the remaining suspects are the wood's own
  draw calls (the assembly merge, specced and deferred) and fill —
  because the two things measured off hardware are now small.
- **Does anything hang in the air?** #88 re-tests a settled piece on a
  rota rather than every frame, with `grabBody` waking the venue. If a
  piece ever visibly hangs for a beat after losing its support, that is
  a route to `wakeBodies` nobody found — worth reporting precisely.

**New questions, PHASE 2 — record the answers here:**

- **Standing a flat up.** A finished flat now turns with the wrist and
  squares to 45°.  Does tipping one upright off the deck feel like
  handling a flat, or does the 45° grid fight you halfway?  Is HOLD-X
  discoverable when you want it free?  Can you carry a 4x8 through the
  roller door without it snagging?
- **The openings.** Do the door and window read as real openings at
  arm's length, or does the framed-and-skinned construction show as
  seams?  Is the 30×80″ door big enough to walk through in VR (the
  bottom rail is a 3.5″ sill you step over — trip hazard or fine)?
- **The SKIN switch.** Is ON/OFF beside the CALL obvious, and does a
  bare frame read as deliberate rather than unfinished?
- **The list, and the STACK.** Press + a few times, CALL once: does
  watching a stack build read as work, or does the wait get long at
  three or four items?  **Is a stack usable** — can you get the top one
  off cleanly, or do they fight each other on the way up?
- **The five-row glass.** Rows dropped from an 86px pitch to 64px to
  fit five plus the counters.  Still readable at arm's length?  Are the
  −/+ boxes (46px) big enough to hit with a controller ray?
- **The Arc button.** Walk up to a rear door on the stage side and
  press it — does it read as the way in, and is it where your hand
  expects it (0.8m clear of the opening, 1.25m up)?
- **Frame rate with a real build standing.** THE UNMEASURED WORST CASE:
  wood is one draw call per piece, `BUILD_CAP` is 150 a venue, and r128
  draws each eye separately.  Stand a full stack of flats under a lit
  rig and read the wrist meter.

**Older blocks follow — the questions below are still owed too:**

- **The belt is four now.**  Crayon at the small of the back
  (0/-0.17): can you draw it without catching the tape?  Is a
  behind-the-back reach comfortable in a headset, or does the crayon
  want a hip?
- **The mark:** legible on the deck from standing height?  Is the yaw
  obvious from the nose notch, or does the build's facing surprise?
- **Watching the build:** does the pace read as WORK, or does it
  drag?  (Work-waits are one-line tunes in p6b's carp branches.)  Is
  one-plank-per-trip theatre or tedium at platform scale — nine
  hauls?
- **The seventh figure:** wrist-meter numbers with a build running —
  at the saws, and at the mark with the rig up.
- **The CARPENTERS screen:** readable beside the order screen?  Do
  the refusal strings land?

Candidates after the run, owner's call, no order — phase 2 took the
build list and the openings, so what is left of that list is: the
furniture catalogue (RULING J); "copy something I already built"
(shaping question 1's third answer — still out of scope); carpenters
that paint; RULING W revisited (save the hang + its paint together,
one versioned blob, its own round); the other six Arc doors, which
are still DOM-only and so still unreachable in VR (one branch on the
`arcDoor:<key>` station id #76 already established).

**Also still open, in rough order:**

- **The next headset run.** The build system has met hardware TWICE
  (each run produced a bug list — the usability round, then the
  build-feel round).  **Everything from #48 onward — the whole
  usability round, all nine build-feel PRs, both goods PRs and the
  carpenters round — has met hardware NEVER.**  Put the owner on
  `…/the-house.html?v=13` (bump the number, the Quest Browser caches
  hard) and work the question blocks at the bottom of this section.
  Feel constants, all one-line tunes: `GRAB_WOOD 0.15`,
  `SEAM_TOUCH 0.05`, `SEAM_REACH 0.45`, `SNAP_SEEK 0.35`,
  `SNAP_OFFER 0.22`, `SNAP_SLACK 0.08`, `TABLE_TOP 0.925` — plus the
  older radii (0.32 rope, 0.28 saw, 0.30 cart/lift, 0.22 tool/roller,
  0.12 lever, 0.35 compact bodies).
- **Known accepted drifts** (documented, may get promoted to bugs by
  the owner): a swung pivot reloads at its pose but its stops
  re-baseline there; pipe-anchored work reloads at saved pose
  whatever trim the pipe wakes at; a runaway resumes when a parked
  stage is re-entered; rope runs pass through the fly-gallery floor
  at y=8 (cosmetic); a cold-dropped table (session end mid-carry)
  settles standing but keeps its held tilt — only a live release
  squares it.
- **Small housekeeping:** `pr6.json` is still untracked in the repo
  root (leftover PR-body file; the owner never ruled on deleting it).
  And `origin` still carries ~40 fully-merged branches (`carp-*`,
  `feel-*`, the `handoff-*` series, every older feature branch) — the
  local copies were pruned 2026-08-08, but a remote prune is
  outward-facing and unruled.
- **Standing owner-taste leftovers:** audit items 20 (dead weight)
  and 22 (duplication) — decisions, not defects.

After the bugs: PHASE 2 is the furniture catalogue (doors, lamps,
tables, nightstands — RULING J; they slot straight in as ordered
bodies — and the WORK TABLE body from #51 is the pattern to copy),
and the headset checklist below still stands.

**STILL OWED WHENEVER THE HEADSET NEXT GOES ON** (no recorded run since
2026-08-06; the meter shipped in #22 but has never met hardware — put
the owner on `…/the-house.html?v=13`, bump the number, Quest Browser
caches hard):

**Read the wrist meter and WRITE THE NUMBERS HERE.** The worst cases,
now three: centre stage under a full rig in haze, at the locking rail
with a full hang (~11 unbatched meshes per line), and — new with #33 —
anywhere a rig fills the view: the real lantern bodies grew per-stage
body meshes ~3.8× (~94 → ~359; r128 WebXR draws each eye separately).
Also note what the foveation level settles at in each spot — if it is
pinned at 1.0 the controller is out of headroom and the next knob is
needed; if it sits at 0.4 we are done tuning.

**The remaining knobs, if the meter still reads over budget** (retest
after each — one change per PR):

1. Batch the rail: merge the locking rail's static per-line meshes
   (housings, plates via a shared atlas, runs, blocks) into shared
   geometry / instanced draws in `vrBuildRopes`. Only the lever, knob
   and grab section actually move per line; everything else can be one
   draw. Built correctness-first on purpose — this is the deliberate
   follow-up.
2. `VR.beamCap` lower still (10 today). Additive beams in haze are
   overdraw, the thing a mobile tile GPU hates most.
3. Framebuffer scale below 0.85 (`setFramebufferScaleFactor`, wiring
   section of p9 — MUST be set before any session exists).
4. Merge the new lantern bodies' static steel clusters (gel frame 4→1,
   shutter handles 4→1, yoke+stem+bolt+safety→1 per yoke radius — keep
   the jaw and lens separate: the jaw IS `userData.clamp` and PR 5
   grabs by it). Spec'd in #33's quality review; brings a profile from
   17 meshes to ~8 with zero visual change.
5. Cut `SMOKE.n`; RENDER *low* preselected before entering. (Thinning
   `LIGHT_POOL` is done — that was #23.)

**While the headset is on anyway**, collect the deferred verdicts and
write them here: does the locking rail read as the photograph, does
grab-anywhere land (0.32m to either run, deck to grid), does
pull-out-to-release / push-in-to-lock feel right, does a runaway read
as a load getting loose; do desk buttons land where the cursor sits
(the `v: 1 - h.uv.y` flip has a regression test but has never met real
hardware); console text size, smooth turn (`VR.turn` 2.1 rad/s — offer
snap if it turns stomachs), walk 3.2, fly 8, the 0.35s double-tap
window, label legibility. New from this round: is the wrist tag
readable and sized like a watch; does 72Hz feel smoother than the
dropping 90 did; is the four-light stage look visibly poorer in a busy
cue (if so, `VR.lightCap` is one number); is the foveated edge
noticeable when the controller leans on it. New from the rig/warehouse
round (#32–#35): do the new lantern bodies read as real lanterns at
arm's length (lower the FOH bar all the way and look); does pushing
the cart feel right — grab height 1.02m, 1:1 chase, yaw easing at 2.5
rad/s — and is pushing it through a doorway comfortable or claustro;
do the sheds read as real rooms (lit enough? the keep lights are
deliberate dusk, not work light); does the speaker-bar travel read
believably from the stalls. New from the detach/ordering round
(#37/#38): does the grab feel right at 0.35m and the snap at 0.4m
(both are one constant in p9); does carrying a lantern through the
roller door and hanging it read believably; is the wall order screen
legible at arm's length (560×520 canvas, 22px rows); does the pallet
read as a delivery; mind the frame rate holding a body under a full
rig, and do the 6-box arrays read as real PA from the stalls. New from
the build round (PR 1): is the tabbed supply screen still legible at
arm's length (the paint rows are 28px against everything else's 48),
and do the stacked wood pallets read as lumber stock on the apron.
(PR 2): does walking the forklift feel like a pallet jack or like
dragging furniture; is the right-stick fork control discoverable and
comfortable (push away = up); is steering a loaded pallet through the
roller door claustro; do the painted floor slots read as parking.
(PR 3): does the belt sit where hands expect it (drop 0.72, holster
reach 0.22); does drawing/holstering feel right or fumbly; does wood
turning with the wrist feel natural after the lanterns' fixed carry;
does the ghost snap GRAB the piece too eagerly (0.14 gap) or not
eagerly enough; is one squeeze + other-hand trigger workable for
gun-work at arm's length; does the swing of a one-nail piece read as
hinged; tape legibility and the tab grab at 0.2.
(PR 4): does seating wood on the table feel deliberate or accidental
(the release envelope is span/2+0.3 by 1.0); is the CUT AT label
readable while sliding; does the inch snap feel like a fence or like
stickiness; two stations 6.5m apart — is the shed getting crowded.
(PR 5): does the dip read (head tint + toast) without looking down;
is per-face painting discoverable or does everyone expect strokes;
can you find the roller on the rack at 0.22.
(PR 6): does placing the hinge BY ITS PIN read as choosing the swing
axis, or does it need a ghost arc; ±90° stops — enough for a door;
does the track chain-snap at 0.45 feel magnetic; sliding a panel by
grabbing the panel (not a handle) — natural or weird.
(PR 7): reload with a real build standing — does everything come
back where it stood (walk the shed AND the stage); is CLEAR SAVE too
easy to fat-finger next to ORDER (it only wipes storage, but say so);
and mind the frame rate with a 100-piece saved build restoring at
boot.
New from the usability round (grab + gun): does GRAB_WOOD 0.15 feel
like grabbing lumber or like a magnet (one constant, p9); does the
gun-at-seam read — point at two touching pieces, TRIGGER TO NAIL label,
fire — or does the SEAM_REACH 0.45 leash feel short; does SEAM_TOUCH
0.05 accept the seams a real stack of lumber offers.
New from the usability round (snap + table): does the earlier ghost
(SNAP_OFFER 0.22, was 0.14) help or grab too eagerly; do end-to-end
butts and T-joints offer the joint you meant (SNAP_SLACK 0.08 is the
overlap forgiveness); does the WORK TABLE (HDWE tab) carry comfortably
and land square on release; is building at 0.925m height right in VR;
and does 'the table holds it — no nail needed' read as design, not
refusal.
New from the build-feel round (once the chain lands): does the 45°
carry grid read as helpful or sticky, and is HOLD-X-to-free
discoverable without being told; does Y-park mid-air read as a
feature or a glitch (the toast says "parked"); does ray-nailing feel
like pointing a real gun (NAIL_RAY 1.2m — one constant); does
controller-compass walking fight the fork-stick habit when driving
the lift; is the drum obvious as a bin and is DELETE ALL WOOD too
easy to fat-finger next to CLEAR SAVE (both act instantly; the wood
button reports its count); do the three paint labels appear at the
right moments on hardware; do the ft-in fly rows read at arm's
length (they replaced "12.2m" with "40'0\"").
New from the goods round (#63/#64): does painting a curtain read as
painting the WHOLE hang (both legs of a pair go together — is that
right, or do you want a leg at a time); is the roller's reach to a
curtain comfortable, or does cloth grab the roller when you meant the
plank in front of it (wood has priority, but the box reach is
generous); is the goods picker legible at arm's length and is the
weight useful; does a pipe LIFTING when you hang something tall on it
read as sensible or as the board moving on its own; and the standing
question — do you want the hang and its paint SAVED (RULING W says
they are not, and both must be done together if so).
Known cosmetic, unfixed:
rope runs pass through the fly-gallery floor at y=8 (real rails have
rope slots).

Ground rules unchanged: suites green before and after; what jsdom can
test gets a regression test, what only a headset can verify gets written
here; PR straight to `main`, one concern per PR, never stack; `gh` is
not installed — PRs go through the GitHub API with the stored git
credential; PowerShell 5.1 mangles `git commit -m` when the message has
double quotes in it — write the message to a file and `-F` it. The
parallel-worktree-agents pattern (one branch per concern, review and
revise before push) has now worked well twice — and the SEAM CHECK is
no longer optional: before opening multi-branch PRs, merge every open
branch into a throwaway, rebuild, and run the full suite. On 2026-08-07
it caught two real bugs that every branch passed alone (a desktop grab
missing the relock handover; a lock test crashing on the lever-less
traveler rope only once both branches were merged). One more trap from
that day: never `git add -A` while agent worktrees exist under
`.claude/` — three gitlink pointers rode into a commit that way
(`.gitignore` covers it now).

After VR holds up on hardware, the leftovers: item 20, item 22, the
"stage 2" VR asks at the bottom of this section, and the deferred VR
BUILD feature (no spec — ask the owner what it means first) — plus the
small ones from earlier rounds: rope slots in the fly-gallery floor
(cosmetic), and clearing `runaway` when a stage is parked mid-fall
(today it resumes when you walk back in; arguably fine, documented
here so it is a decision rather than a surprise).

---

**The 2026-08-06 fix queue, for the record** (details in AUDIT.md; ground
rules were: suites green before and after every item, one finding one
commit, in-flight regression tests at the swap boundary):

Quick wins first — each is small, self-contained, and already hand-verified:

- [x] 1. **M16** — make the other eleven suites exit non-zero on failure the
      way `full14.js` does, and add an `npm test` script that runs all
      twelve. Do this first; it hardens every item after it.
- [x] 2. **M1** — `p5g:314` calls `makeFire` with the obsolete
      `{x,y,z,w,h,n}` shape, so every flame seeds at NaN and the GOES WRONG
      fireplace never renders. Convert to `{count, embers, y, x0,x1,z0,z1}`
      (the two correct callers are p5c:1065 and p5d:487).
- [x] 3. **M2** — `plotOutsiders` is missing `restoreAims(homeAims)` before
      `RIG.haze = savedHaze` (p5c:1261); the other three plots all have it.
- [x] 4. **M3** — guard the `updateNeon()` call at p5c:392 like its
      neighbours two lines down, and the unguarded `wrong*`/`setRevolve`
      references in p7:768-785.
- [x] 5. **M14** — two `function damaskTex()` (p2:218 Palace crimson,
      p5g:104 Cornley green); hoisting means p5g's silently wins everywhere.
      Rename the p5g one.

The swap boundary — decide the design ONCE, then the fixes are mechanical.
The choice per subsystem: PARK it (capture/restore in p2k) or HALT it (stop
on `stageSwitch`). AUDIT's recommendation: crew finish-or-stop, script stop,
follow cancel, audio stop, smoke gets a per-stage root exactly the way
`showRoot()` (p5c:43) already solved this for scenery:

- [x] 6. **H1** — smoke: `smokeRoot()` is memoized to the Palace forever, so
      shows loaded at the Arc rig their foggers 420m away (probe-verified);
      `removeShowSmoke()` strips units game-wide; `hazeNow()` reads global
      haze into whichever rig you're under.
- [x] 7. **H2–H5 + M5** — the crew, as one cluster: jobs mix plan-time and
      execution-time stages; `CREW.savedLook` restores onto whichever board
      is live; the loads cache is keyed by show only (LOAD OUT can strike
      the other stage's set); the stock plan is stage coordinates executed
      as world (Arc LOAD IN builds on the Palace deck); `crewStop` un-hides
      the wrong show, leaving scenery invisible with no UI recovery.
- [x] 8. **H6** — a running `Prog` script follows the board across a swap
      and drives the other theatre's rig and cue stack.
- [x] 9. **M7** — cue-follow `setTimeout` survives the swap and can GO the
      wrong stage's cue; cancel or park it.
- [x] 10. **M8** — `selCue` isn't swapped; DELETE CUE after a walk splices
      the wrong stack.
- [x] 11. **M9** — `SUBS` are one-board while `CUES` are per-stage. Possibly
      deliberate — owner rules: document it or capture them. *Documented as
      one-board (p6, comment above `SUBS`); if the owner rules the other
      way, capture them in p2k the way `CUES` are.*
- [x] 12. **M10** — rail-motor audio loop leaks for a lineset mid-travel at
      swap (and collides with the other stage's same-id lineset); the rain
      rumble has the same shape.
- [x] 13. **M11** — VR: `vrClearRopes` must null `VR.held`, or a held rope
      keeps flying the parked lineset and repositioning a disposed mesh.
- [x] 14. **M4** — the scenic palette and FOCUS raycast only the Palace's
      `deck` (and from the Arc can hit it *invisibly* through the walls —
      §5's own trap — aiming FOH across town); `setGroup` is one global
      store for three stages, and `showLoad`'s `strikeAll()` clears it
      cross-venue.

Coordinate/cosmetic — only ever visible at the Arc or in a headset:

- [x] 15. **M12** — the VR beam cap sorts fixtures' *local* positions
      against the camera's *world* position; on the Arc "nearest 14" means
      "most stage-left 14". Use `f._org` (p4:361).
- [x] 16. **M13** — fire billboards yaw from a stage-local centre toward the
      world camera; flames render edge-on at the Arc.
- [x] 17. **L2** — `camera.position` stops being world once
      `VR.rig.add(camera)`; smoke puffs (p5e:219) and lens glows (p4:378)
      need `getWorldPosition`.
- [x] 18. **M17** — the Outsiders show curtain never got the split-texture
      fix the other three have; its painted sun renders twice. A probe
      (tools/) confirms in seconds.

Structural / owner-taste — read the AUDIT sections before deciding:

- [x] 19. **M6** — `setPieceVisible` hides with `visible` only; crew-hidden
      scenery is still raycastable, so you can stand on invisible galleries.
      Fix shape depends on item 20 — the dead scene machinery contains the
      correct hide implementation.
- [ ] 20. Dead weight — `p2d` (orphaned, not even built), the Beetlejuice
      scene-change machinery (~110 lines plus a visible inert panel), eight
      functions, eight variables, two CSS blocks. Full inventory in AUDIT,
      including the `shopGroup` tombstone assertion in full14.js that must
      move with any deletion.
- [x] 21. **M15** — `SHOW`'s shape is defined in three drifting places and
      ad-hoc keys leak across swaps via `Object.assign`; unify the template.
- [ ] 22. Duplication — the four plot builders, show curtains, and the neon
      machinery want shared homes in p5c; bulk, not bugs. AUDIT lists every
      cluster with lines.

**Not done:**

- **No recorded headset run.** Hosting is solved (Pages, above), but as of
  this writing no Quest 3 findings have been written down. The XR code
  paths are exercised against a stubbed `WebXRManager` in `vr.js`; frame
  rate, comfort, real pointing and console readability are unknown. Next
  session opens by collecting exactly this — see step zero above.
- Only the live stage ticks. Leave a theatre mid-show and its fades and flys wait
  for you. Deliberate, but arguable.
- The Arc has no productions of its own; the four in the book are written for the
  Palace's stage box and load anywhere because all three boxes match.
- Hamilton is thinner than the other three (55 pieces against ~96).
- The scene-change system (`SHOW.scenes`, `p5c`) is general machinery that no
  current show uses — it was built for Beetlejuice, which was removed.

**Asked for and not yet built:** the "stage 2" VR work — grabbable faders
on the console, carrying scenery by hand. Worth folding into the VR fix
session only after the basics survive the headset.
