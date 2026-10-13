# Automatic actors — design (2026-10-12)

**BINDING. Rulings FF–FR.** The next spec starts at **FS**. (FN was added the same day, from Jack's
second message — see its section; FP–FR from his messages on the editor, the clock's edges and the props.)

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

### FO — The whole show's blocking, and how it is made

- **The pipeline.** The blocking is written by eight generators, one per segment of the album (the cue round's
  segments). They live in `tools/blocking/`, are standard library only, and each writes `segments/segN.json`.
  `tools/blocking-merge.py` merges and validates them into `assets/hamilton-blocking.json`.
  - The committed JSON is an OUTPUT. A fix goes in the segment's generator, never the merged file.
  - Each segment went through four passes: written, reviewed against references (photos, the Disney+ film, fan
    accounts), spotlight-checked against the page's own pool landings, then merged.
  - The research behind each is `tools/blocking/research/segN.md`.
- **Segment edges.** Every actor ends a segment offstage and starts the next offstage, except at three ruled edges.
  The adjoining segments agree there to the number, and the merge sees each as one continuous pose:
  - **2-10 → 2-11:** the King stays at (0, 3.41), facing the house, through the blackout. 2-10 ends at 95.6;
    2-11 starts at 0.0.
  - **2-16 → 2-17:** Philip (`laurens`) at (−0.4, 2.4) facing 180, and George Eacker (`ens5`) at (1.6, −1.0) facing
    180. 2-16 ends at 172.5; 2-17 starts at 0.0.
  - **2-23** ends on the bows line-up, with the company on stage, not offstage.
- **Unseen moves are not errors.** A leg between two offstage waypoints is invisible, so neither the page's
  `check()` nor the merge reports its speed. Bodies "teleport" between wings in the dark.
- **Light versus blocking.** Where a person light and the blocking disagreed, the blocking moved to the light unless
  the evidence said the cue was wrong. Those cues are listed, not edited, in
  `docs/hamilton-blocking-cue-notes.md` for Jack. That file also has two questions only he can rule: the sisters'
  order in 1-05, and the duel sides at the shot in 2-22.

### FP — The blocking editor: a second page, and the file it hands back

Jack: *"make a software that i can make paths for the people. have it so it has all the paths you have made already and i
can alter them. make this a different html. make it so i can play the music and it shows me where they would be at that
time in the music then i can export a file that tells you what to change. make it so it has an indicator for when it is a
blackout. make it be a 2d view from the top and add text showing what each part is like if it is the upper or lower level
and stuff like that"*

- **`blocking.html`, at the repository's root**, one file, no framework, a 2D canvas. It reads the committed files (the
  blocking, the show, the Eos file, the rig, the cast, the floor map, the person lights) and Jack's git-ignored soundtrack.
- **The plan is `tools/blocking-plot.py`'s picture**: from the top, the house at the bottom, stage left on the right, drawn
  from `tools/hamilton-floor.json` (the deck grey, the galleries tan, stairs a brown ramp, rails pale, the pit black), a 1 m
  grid with metre numbers, and a text label on every part (upper level / lower level, the galleries at 2.74 m, the stairs with
  an arrow up, the turntables, the Guns and Ships balcony, the pit, the house, the wings, the entrances, the named points).
  The pointer's readout names the part, the level and the height under it.
- **The pose is `midtown.html`'s** (actCompile / actPose and the prop pose, lifted line for line; only the floor ray is left
  out — the height on the plan is the waypoints'). Checked: equal to `MIDTOWN.actors.pose` at 360 random moments (position
  0 m, yaw 0 rad, visibility and labels alike), and to `blocking-plot.py`'s printout.
- **The clock is the music's** while it plays (the audio element's `currentTime`, through the VBR seek table — RULING on the
  soundtrack, `soundtrack.seek.toc`, embedded for a file of that duration when the show file lacks it), and the frame's dt in
  the lead-ins, the tails (FQ) and with no music. Never a timer. The soundtrack is fetched whole into a Blob (python's server
  has no Range requests). At the interval it stops and waits for Play, as the page does.
- **Lit or BLACKOUT** comes from the cues: every cue's intensities, tracked and resolved through presets and palettes as the
  page resolves them, over the channels a unit answers (the rig's); BLACKOUT when none is above 0. It agrees with the page's
  own per-cue dump on all 892 cues. The blackouts are dark bands with a red edge on both scrub bars.
- **Editing** goes through one function (an undo step per edit, the path re-sorted, the merge tool's checks re-run).
  Positions snap to 0.05 m. Waypoints keep an identity, so the change file says "moved", not "deleted and added".
- **It writes nothing.** Its downloads: the CHANGE FILE (`hamilton-blocking-changes-<date>.json`, its format in
  `docs/hamilton-blocking-format.md` — every change against the loaded file by actor or prop, track, op, before / after, Jack's
  note, the generator to fix, and his notes per track and on the show; the source file's bytes and SHA-256 at the top), its
  Markdown, and the whole edited blocking file in the merge's own layout (byte-identical when nothing is edited). The
  committed blocking stays GENERATED (FO): a session applies the change file to the generators.
- **A draft** (edits and notes) is kept in localStorage and OFFERED on reload, never applied by itself (as FM's panel).
- **The person lights** (`assets/hamilton-pools.json`, 0.6 MB) are slimmed by `tools/blocking-pools.py` from the per-cue pool
  dump of the page (session scratch): specials, and units at zoom ≤ 18.5°, where they land. They are a snapshot of the cue
  data they were dumped from; regenerate after cue revisions.
- **Clear this song** (Jack: *"for each song I can choose to start with none of the lines already in there"*): every waypoint
  of the current track goes in one undoable step. RULED: because a body stands at her last waypoint after it, a cleared song
  would leave anyone on stage at the previous song's end frozen there; the clear therefore adds `off` holds (she walks off to
  the nearest wing at a walk, and waits in the wing nearest her next spot until she must walk on), marked
  `clear-track: held offstage`. The change file reports one `clear-track` with the count, not the deletes. **Restore this
  song** puts the loaded file's track back.
- **The level control** (Jack: *"add a button so if it is in a place with a second level I can choose what level it is on"*):
  Lower · deck / Upper · gallery, enabled only where the floor map has the deck below and the gallery above; `y` absent or
  2.743; the change file names the level.
- **SIMPLE MODE is the default** (Jack: *"just make it so every person has a dot, then I can play the music and I move the
  people to where they need to be … make it so I pause it with space bar … make it export that"*; *"when I add furniture it
  creates a square for it, and it has a button … I can choose who carries it at that time"*): dots and squares, no lines or
  forms; a drag records a keyframe at the current clock time (the drag's end while playing); keyframes REPLACE a body's loaded
  waypoints in that song from the first keyframe on (RULED; the format doc has it); furniture squares with a carry picker
  (nearest first, or nobody); saved at every keyframe; exported as the RECORDING FILE (format doc). The full editor is behind
  **Advanced ▸**, unchanged.
- **Selection and deletes in Simple mode:** click / Shift-click / a box / Ctrl+A select; Delete removes the selected bodies'
  whole track in the current song, Shift+Delete everything of theirs in the current song from the clock's time on (nothing
  earlier, no other song), X one keyframe. RULED: a deletion is recorded per song and body (`deleted: "all"` /
  `deletedFrom`) and, like a keyframe, replaces the loaded waypoints from the cut on; nobody is left frozen (the walk-off and
  wing holds as for a cleared song).
- **The plan is drawn as an architect's plan** (Jack: *"make the map of the stage look better"*): vector shapes from the
  measured geometry (the deck a shade lighter between the proscenium posts, the pit, the galleries raised with a shadow on
  their downstage edge, stairs as treads with an UP arrow, rails, posts, entrance tabs), labels placed so none overlap (inside
  their shape, else outside on a leader), the directions in letter-spaced capitals at the edges, metre numbers on two edges,
  a scale bar, the key in the left panel, the light pools under the labels. The floor map stays the source of the hover
  readout and the level logic, and is an optional faint underlay ("Floor scan").

### FQ — The show clock's lead-ins and tails

Jack: *"for timing make it give me 10 seconds before the first song starts at the start of the first and second act, and
give me 10 seconds at the end of act 1, and as much time as I want at the end of act 2."*

- A 10 s **lead-in** before the first track and before every track the show file marks `hold` (1-01, 2-01): `at` −10 … 0.
  No music; the music starts at 0. The look before it holds: for 1-01 the cues at its 0.0 (HOME, the preshow PRESET) now stand
  from the top of the lead-in; for 2-01 the interval's look (1-23's last cue).
- A 10 s **tail** after the track before a `hold` (1-23): `at` up to length + 10; the music stops at the track's end, the clock
  runs on, and then the interval hold happens (after the tail, not at the music's end).
- An **open tail** after the album's last track (2-23): `at` ≥ 0 with no upper bound; the clock keeps counting after the
  music until Stop or a scrub.
- The global clock leaves room: a track's `start` is after its own lead-in, the next track's after this one's tail. Every
  tool lays it out the same way (`midtown.html` showCompile, `blocking.html` buildTracks, `tools/blocking-merge.py`
  track_table / at_ok, `tools/blocking-plot.py`). The merge allows those ranges on exactly those tracks.
- Play from the top runs 1-01 from −10 ("−0:10" counting down); Play at the interval runs 2-01 from −10. Checked:
  `MIDTOWN.show.check({ points: [5, 10.6, 4275, 4283, 4289.5, 8600], span: 3 })` passes (a lead-in, the music's top, 1-23's
  tail, 2-01's lead-in, 2-23's open tail), `MIDTOWN.actors.check({ n: 40 })` passes, and stepping the clock by hand runs
  1-01 −10 → 1, 1-23 380 → the hold at 395, Play → 2-01 −10 → 1 (Q 720 at 0), 2-23 215 → 325 → 400.
- **The seek check samples off the instant.** The pose may STEP exactly at a waypoint's time (a facing with no time to turn,
  offstage → on, a jump, a prop changing hands), and the played clock reaches T as a sum of steps that can land an ulp short,
  so a moment exactly on a waypoint compares the two sides of a step. `MIDTOWN.actors.check()` moves every moment 5 ms clear of
  every waypoint time (the helper found failures only exactly there: a 45° turn at 2-02 ≈157.5, the top of 2-17).

### FR — Props, carried on and set down

Jack: *"make it so i can also put in props i want people to carry on like desks or stuff."*

- In the blocking file, `props` after the actors: `{ id, kind, label, size: [w, h, d], color, waypoints: [{ track, at, x, z,
  y?, facing?, off?, carriedBy?, note? }] }`. Kinds and their default sizes: desk, table, chair, bench, stool, box, crate,
  lantern, bucket, custom (`docs/hamilton-blocking-format.md`).
- From a waypoint until the next the prop is PLACED on the floor at (x, z) turned to `facing` (the floor found by the same ray
  as an actor's: on the gallery it sits on the gallery), or CARRIED by `carriedBy` (held in front of her at waist height —
  its centre 1.0 m up and 0.22 m beyond her front — turned with her, seen when she is), or hidden (`off`). Before its first
  waypoint a prop is not on stage.
- A pure function of show time and the carrier's pose; `MIDTOWN.actors.check()` covers props (moments just after each prop
  waypoint and mid-carry). Drawn in `midtown.html` as shaded boxes (a desk or table a top on four legs, a chair with a back),
  lit as the actors are, with a name tag (the Names box). `MIDTOWN.actors.props`, `MIDTOWN.actors.propPose(id, T)`.
- The seed is generated by `tools/blocking/props.py` into `tools/blocking/segments/props.json`, and the merge validates and
  writes it (errors: kind, size, colour, duplicate id, `carriedBy` not a cast id, a placed waypoint without x / z, the track
  ranges, times not increasing; warnings: placed off the stage, a carrier who is never on stage).
- The editor edits props like actors (a Props panel: add, remove, label, kind, size, colour; waypoints dragged and added;
  "Carry from now"; a "Carried by" field), and the change file reports `prop-*` ops.
