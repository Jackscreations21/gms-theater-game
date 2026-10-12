# Automatic actors — design (2026-10-12)

**BINDING. Rulings FF–FN.** The next spec starts at **FO**. (FN was added the same day, from Jack's
second message — see its section.)

These rulings were made by the building session (an agent), not answered by
Jack in a Q&A first: he asked for the system and named the model, and every
choice below is the smallest one that does what he asked while leaving the
"later" he named (arms and feet) a drop-in. Where a ruling is a guess at his
taste rather than a consequence of the code, it says so — those are his to
overturn.

## The brief, verbatim

> make a system for automatic actors. Make a software where you can create
> their paths and stuff. Right now just make them using this mannequin but
> later we will add arm and feet movement.

The mannequin: `Downloads\standing-woman.stl` (binary STL, 158,010
triangles, 7.9 MB; its 80-byte header reads "MW 1.0 1219062 US", which is only
the header). Supplied by Jack; **licence unknown**.

## What this is

On `midtown.html` (the Hamilton page — one hand-edited file, not built from
`src/`), actors stand on the set and walk paths timed to the show player's
clock — the same (album track, seconds into it) clock the 892 cues run on — so
when the show plays, the company moves with the light. A **Blocking** panel
authors the paths: scrub the show to a moment, click where she should be.
The blocking lives in `assets/hamilton-blocking.json`
(`docs/hamilton-blocking-format.md`). The Palace game, `src/`, `the-house.html`
and the walk's player body are untouched.

## RULINGS

### FF — An actor is a group with a body; the mannequin is one asset

- An actor is a `THREE.Group` whose origin is her FEET and whose +z is her
  FRONT, with one child, `body`. Today the body is the mannequin; the path
  system only ever moves the group.
- `assets/mannequin-woman.glb` is made by `tools/mannequin-glb.py` from the
  STL (standard library only): the STL is +z up and faces −y (measured: the
  toes and face stick out to −y); the GLB is **metres, Y up, feet at y 0,
  centred on x/z, facing +Z, 1.65 m tall**, quadric-clustered at 1.5 cm cells
  to **18,096 triangles, 8,864 vertices, 322,508 bytes**, smooth normals, one
  material.
- Each actor wears her own colour through a material **per colour** (`ACT.mats`,
  keyed by hex) — never a shared material tinted in place (INVARIANTS).
- 1.65 m is a ruling of taste (a woman of average height); the converter's
  `HEIGHT` is one number.

### FG — Actors live in the set's own frame

- All actors are children of one group under the **set's loaded root**, as the
  rig is. A waypoint's `x, y, z` are **set-local metres**: the frame of
  `assets/hamilton-set.glb` — upstage −z, the house +z, the deck y 0, stage
  right −x (the game's convention; the page turns the whole set 180° to face
  Midtown's house).
- So "Real size" and "Set fitted" scale and seat the actors with the set, and
  she reads 1.65 m next to the gallery at real size. **Real size is the frame
  the blocking is authored in**: at "Set fitted" the set has the cut holes the
  page's cuts leave at that scale (`atSetScale`), and a floor ray may fall
  through one.
- Actors, their labels and the editor's markers are marked `userData.rig`, the
  page's existing "not scenery" flag: the build tools, the walk's collision
  grid and the lighting engine's landing rays all skip them.

### FH — Paths run on the show clock; the pose is a pure function of it

- A waypoint is `{ track, at, x, z, y?, dwell?, facing?, off? }`; its global
  time is the track's start + `at` (the show player's own `tracks[].start`).
  Waypoints are kept in time order.
- She **arrives** at a waypoint at its time, stands, and **leaves** after
  `dwell` seconds, arriving at the next on that one's time.
  - `dwell` absent: she leaves just in time to walk the leg at **1.3 m/s**
    (`ACT_WALK`) — the default for a dropped waypoint, so "click where she
    should be at this moment" needs nothing else.
  - `dwell: 0`: she walks **through** without stopping.
  - `dwell: n`: she leaves n s after arriving; a dwell that runs past the next
    waypoint is cut (and reported).
- A **stop** is the first or last waypoint, an offstage one, or any with a
  dwell other than 0. Speed ramps up out of a stop and down into one over
  **0.6 s** (`ACT_EASE`, a trapezoid of speed); a walk-through keeps its speed.
- The path is a **centripetal Catmull–Rom** curve that bends only through
  walk-through waypoints; **a stop breaks the curve** (its leg ends straight), so
  "go there and come back" never loops. Each leg is walked at constant speed
  along its arc length (a 24-sample table).
- She faces her way of travel (yaw 0 faces the house, +90 stage left). At a
  stop with a `facing` she turns to it over **0.6 s** (`ACT_TURN`); leaving a
  stop she turns into the walk over the same.
- **The pose is a pure function of the show time** (`actPose`): position, yaw,
  visibility, speed and distance walked, from the compiled path and the time —
  nothing is carried from frame to frame. So a seek lands every actor exactly
  where playing to that moment does — the invariant the cues obey.
  `MIDTOWN.actors.check()` proves it: at a spread of moments (mid-walk on every
  leg, mid-turn into every stop), seeking straight there and playing the show's
  clock up to it from 8 s before (its tick, the engine's, then the actors', the
  frame's own order) must agree to 0.1 mm and 0.0001 rad. Negative-checked: a
  position lerp and a yaw smoothing (state carried across frames) both fail it.
- Time comes from the show clock only (never `setTimeout`). Before the show
  data loads the clock reads 0.

### FI — The floor is found, not stored

- Her height is the floor under her: a ray straight down from the path's own
  height + **0.6 m** (`ACT_STEP`; the set's stair risers are 0.17–0.23) through
  the walk's collision grid (`rayDown`: the set, the house, Jack's baked
  pieces), in the world, back into the set's frame. So she rises onto the
  gallery (2.74) and climbs the stairs.
- The path's own height is the waypoints' `y` (the floor where the waypoint
  was dropped or dragged — the editor writes it), interpolated along the leg.
  `y` absent means the deck. A miss (a hole in the scan) keeps the path's
  height.
- A leg that starts on the deck and ends on the gallery must run up a stair;
  a long leg past one is the author's to split with a waypoint at the stair's
  foot (the drawn path line shows it). Small props under a path lift her by
  their height, as they would a real foot.

### FJ — Offstage is an explicit waypoint flag

- `off: true`: at that waypoint she is not seen. Walking between an offstage
  waypoint and an onstage one she IS seen — she walks on from it, or off to
  it; between two offstage ones she is not.
- Before her first waypoint and after her last she stands at it (hidden if it
  is offstage). An actor with no waypoints is **not on stage** (amended by FN: it
  used to stand at the turntable's centre, and a cast list of twenty with no
  blocking yet stood twenty bodies in one spot).

### FK — Actors are lit by the show

- The body is a lit `MeshStandardMaterial`: the work light and the engine's
  real lights light her; the pools' depth-and-albedo pass draws her like any
  set piece (it swaps every visible opaque mesh), so a pool's light lands on
  her in her own colour.
- A pool's cone is drawn only over a depth band fitted to the scenery it lands
  on (`lxPoolBand`, 0.4 m in front of the nearest surface): a body standing in
  it was lit to the shins. Each frame (`actPoolBands`, after the engine's tick)
  every lit pool with an actor in its cone has its band widened to reach her,
  and put back to the engine's own when she leaves. Measured on one Viper
  straight down on her: without it the pool stops at her knees; with it she is
  lit head to foot (`lit-off.png` / `lit-on.png` in the session record).
- Actors **cast no shadows**: the page's shadow maps are static (redrawn only
  when a caster moves), and a walking caster would redraw them every frame.
  They receive them.
- Not addressed: the pool shader's normal comes from depth, so a dense body
  shows dark speckle where it faces away; real normals in the albedo pass
  would fix it (FUTURE.md).

### FL — Arms and feet, later, hook in here

- The group carries `userData.pose` every frame: `{ x, y, z, yaw, visible,
  speed (m/s), dist (m walked along her path) }` — `dist` is the gait phase,
  `speed` the stride, both pure functions of the show time like the rest.
- If `group.userData.animate` is a function, it is called with
  `(pose, group)` after the pose is applied; a failure in it never stops the
  show. A limb rig goes under the group (or replaces `body`) in the same
  frame: feet at 0, front +Z, 1.65 m — and **the path system and the file do
  not change**. Gait from `dist` keeps the limbs seek-equivalent too.
- Per-character models are the same: a model per actor (a `model` key in the
  file) is a body swap, not a path change. Not built (FUTURE.md).

### FM — The file, and the editor that writes it

- `assets/hamilton-blocking.json`, format `"hamilton-blocking 1"`
  (`docs/hamilton-blocking-format.md`), fetched at load (a missing file is an
  empty stage and a console warning, never an error). It is the committed
  truth. The first commit held a **demonstration** through 1-01 (Burr enters,
  Hamilton walks into the centre shaft and climbs the stage-left stair onto the
  gallery at the Voyage, Eliza appears on the upstage gallery twice) — not the
  Broadway blocking. Under FN it became the twenty-strong cast with no
  waypoints, to be filled by the merged segment blocking.
- The page cannot write to the repository: the editor's **Download** saves the
  JSON (Jack drops it into `assets/` or hands it over), **Load…** reads one,
  **Copy JSON** copies it. Every edit also keeps a **draft** in this browser's
  storage; on load a draft that differs from the file is **offered** ("Restore
  draft"), never applied by itself.
- The panel (header button **Blocking**, on the left, beside Lights when both
  are open): the show clock (Play/Pause, −5/−1/+1/+5, a scrub over the track,
  a track list — all the show player's own `showStart` / `showPause` /
  `showSeek`, never a second clock); actors (add, rename, colour, remove, show
  or hide all); the selected actor's waypoints (a list; double-click goes to a
  waypoint's time), a form (track, at, dwell, facing, x, z, offstage; Time =
  now, Go to, Delete), and in the view the path as a line with a disc per
  waypoint. **Click to place** drops a waypoint at the CURRENT show time where
  the view is clicked (one already at that time moves instead); dragging a
  disc moves a waypoint. Esc stops placing; Delete removes the selected
  waypoint. Clicking an actor selects her.
- The panel's clicks are taken in the capture phase on `#stage`, before the
  orbit and the build tools; a click it uses is withdrawn from the page's own
  handler by clearing its `press` — never by stopping the pointerup, which
  would leave OrbitControls holding the button down (TRAPS).
- Console: `MIDTOWN.actors` — `list`, `data()`, `load(obj | url)`,
  `pose(id, T)`, `select(i | id)`, `place(x, z, y)`, `floor(x, z, ref)`,
  `check()`, `panel(on)`, `drop(on)`, `state`, `tune`. `MIDTOWN.frame()` poses
  the actors before it draws.

### FN — A name over every head, and the whole company

Jack, on PR #234: *"dont focus on any costumes or arm or feet movements. but
i want you to put the choreography for every character in hamilton. for now
just use the blank mannequin and put a thing over their head with what
character they are."*

- **The head label.** Every actor carries a label: a canvas-texture sprite, a
  child of her group so it moves and hides with her. It is drawn at a constant
  **screen** size (`sizeAttenuation` off, about 3.5 % of the view's height),
  so it reads from the back of the house without towering over a body in the
  front row. Its lower edge sits 0.25 m above her crown. It is drawn over
  everything (no depth test), so a name on the gallery reads through the rail.
  The lighting engine's depth/albedo and pool passes get nothing from it (it
  draws transparent into any render target), so a pool never lands on a label.
  The panel's **Names** box turns them all off.
- **The text** is the actor's `label`, or her `name` when she has none, until
  a waypoint's `label` changes it **from that waypoint's time on**. It holds
  until another waypoint changes it. It is part of the pose, a pure function of
  show time, so a seek shows the right name; `MIDTOWN.actors.check()` compares
  labels too. Negative-checked: a label that only updates on small time steps
  fails it. The check now seeks to each moment as a jump from 600 s away,
  BEFORE playing up to it, so nothing left behind by the previous moment can
  pass for the right answer.
- **The company is fixed** in `tools/hamilton-cast.json`: twenty ids, each
  with a default label (its `name`), a colour, and the only other labels it
  may show. The principals: hamilton, burr, eliza, angelica, peggy (→ Maria
  Reynolds), washington, lafayette (→ Jefferson), mulligan (→ Madison),
  laurens (→ Philip), king ("King George"). The ensemble is ens1 … ens10 in one
  grey; the ensemble's named parts are each on one fixed body: ens1 the
  Bullet, ens2 Samuel Seabury, ens3 Charles Lee, ens4 Philip Schuyler / James
  Reynolds / the Doctor, ens5 George Eacker. These follow the Original Broadway
  Cast's doubling as far as it is known; any part not listed is played by a
  principal or not shown. Colours are a ruling of taste.
- **The blocking is written in eight segments** (the cue round's eight
  stretches of the album) and merged by `tools/blocking-merge.py`, which
  validates it (ids, tracks, times strictly increasing per actor across the
  show, labels against the cast, positions and levels against
  `tools/hamilton-floor.json`, measured in the page) and fills `y` from level
  names. The format doc has its rules.
