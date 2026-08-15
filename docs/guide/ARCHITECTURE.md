# Architecture

One HTML file built by concatenating 27 text parts. `build.sh` holds the
order; **the order is a dependency order and must never be sorted**.

## The parts

| Part | What it is | Position notes |
|---|---|---|
| `p1` | HTML, CSS, all DOM panels | must be first — opens `<script>` at its end |
| `p2` | dimensions `D`, `scene`, `camera`, `renderer`, materials `M`, textures `TX`, `mergeParts()` | everything reads `D` |
| `p2b p2c p2e p2g p2h p2f` | auditorium, stage house, FOH, dock, doors, seats | |
| `p3` | fly system: `FLY`, `GOODS`, `TRIMS`, `drape()`, `minTrimOf`, runaways | `p4` reads `FLY[n].z` when building the rig |
| `p4` | lighting: `FIXTURES`, light pool, beam shader, `stageToWorld`, `updateRig`, `BODIES`/`updateBodies` | after `p3` |
| `p4c` | **the build system**: wood, assemblies, nails/hinges/track, saws, paint, ordering, the save | after `p4` |
| `p5 p5e` | scenic stock, smoke | |
| `p6 p6b` | cue engine + console UI; the crew (`CREW`, job queue; the lead carpenter + carp job kinds) | |
| `p6c` | **the carpenters**: `CARP_CAT` (5 rows), `carpSurvey`/`carpParts`/`carpPlan`/`carpPlanList`/`carpStackH` (all pure), `carpStart`/`CARP_RUN` | after `p6b` (extends the crew), before `p5c` |
| `p6d` | **Art-Net** (RULINGS EL–EV): `ART`, the WebSocket client, the reconnect off frame `dt`, `artnetTick` — the one place a desk byte may touch the rig. `artDriving()` is the gate everything else asks | after `p6c`, before `p5c`; its references to `FIXTURES`/`STAGE` are all inside function bodies, never in an initialiser (TDZ) |
| `p5c` | `SHOWS`/`SHOW`, scenes, rain/fire, helpers | after the crew (`crewForgetLoads`) |
| `p5d p5f p5g` | Lost Boys, Hamilton, The Play That Goes Wrong | `p5f`/`p5g` reuse `LB_CLOTH_W` from `p5d` |
| `p2j` | the Arc Centre (second venue) | after the shows, before the stages |
| `p2k` | **three stages, one board** — the swap | needs `ARC`, `buildRig`, `makeLineset` |
| `p2m` | shed furniture: forklift, saws, paint rack, trash drum | |
| `p2i` | room/portal culling — `buildRooms()` sorts `world.children` | **must be late**: it files whatever exists at that moment |
| `p7` | camera, movement, UI wiring, the frame loop | |
| `p9` | **VR** (WebXR, grabs, desks, belt, perf) | needs `frame`, `renderer`, `SHOWS`, `STAGES` |
| `pz` | `</script></body></html>` | split out on purpose — anything appended after `p7` must land INSIDE the script tag |

`p2d` is orphaned and not built (owner-taste leftover; leave it).

## The central design: one board, swapped contents

There is ONE `FIXTURES`, ONE `FLY`, ONE `CUES`, ONE `SHOW`, ONE `HOUSE`.
Walking into a theatre **swaps their contents** (`p2k`) rather than
threading a stage argument through two hundred functions. `STAGE` names
the live stage; `STAGES[key]` parks the others (positions, cue stacks,
locks, FOH/speaker bar heights, etc.).

Consequences you must respect:

- Every function "just works" on whichever stage is live — but anything
  you cache across a swap (DOM rows, roots, timers) is a bug waiting.
  See TRAPS.md.
- New per-stage state MUST be parked/restored in `p2k` or it will leak
  across stages.
- Only the LIVE stage ticks. Parked stages freeze (documented,
  deliberate, arguable).

## The two venues

The Palace at the origin; the Arc Centre at x = +420 (`ARC.X`), holding
a Main House and a Studio. Every stage is the same box: `AS` in `p2j`
takes its dimensions straight off the Palace's `D`, and the Arc houses
are built by the Palace's own builders run into a translated group.
Portal culling (`p2i` for the Palace rooms, `arcRoomAt` for the Arc)
draws only the venue you stand in. Each venue has a warehouse shed
behind it (orders, saws, paint, forklift).

## Other venue-level registries

- `BODIES` — every detachable thing (lanterns, PA boxes, wood, hardware,
  paint cans, the work table): hung / held / slotted / loose / seated.
  An empty hanging point's channel is dead via ONE gate in p4
  `updateRig`, never via `visible`.
- `ASSEMBLIES` (p4c) — built scenery: root Group at the venue root,
  pieces, nails as DATA, `asmJoints` decides rigid vs swing.
- `ORDERS[venue]` — `{pending:[], pallets:[]}`, three orders out per
  shed, game-time delivery in `updateSheds`.
- `CREW` (p6b) — six stagehands plus the lead carpenter (`people[6]`,
  `trade:'carpenter'`, lazy), a plain job queue; `crewAssign` switches
  on `job.kind` with trade guards BEFORE the shift. **Adding a trade =
  adding job kinds, not an engine** — the carpenters proved it.
- Carts and the forklift live at venue level on purpose (they leave
  their shed's cull room).

## Building geometry — read this before you add any object

r128's core ships no `BufferGeometryUtils`, so **`mergeParts(parts)` in
p2 is the house merger**. Each part is `{geo, pos, rot, scale}`; it bakes
the transforms into the vertices and concatenates them into one
`BufferGeometry`, so a cluster of static detail costs ONE draw call
instead of one per part. All parts in a call share the single material
the merged mesh is given, so group by material.

**Detail is meant to be paid for by merging, not by adding meshes.** The
workshop round rebuilt eleven objects with far more detail and came out
at 38 meshes a venue where it had been 63. `tools/census.js` prints the
count; keep it honest.

Merge only what never moves, is never grabbed and is never recoloured.
Anything addressed at runtime stays its own mesh — the saw `cutter`, the
lift `forks`, the paint `roller.head`, the cans. **Merging one of those
fails silently**, which is why each has a test. See TRAPS.md.

Surfaces come from the shared workshop palette in p2: `M.galv`,
`M.castIron`, `M.moulded`, `M.rubber`, `M.hazard`, `M.ply`, plus
`stencilTex(text, bg)` for labels. **Shared — never tint one in place**
(the shared-material trap, three times over). Every texture in this game
is drawn on a `<canvas>`; there are no image files and no loader, and
that is RULING AI, not an accident.

Cache merged geometry the way `TOOLG`/`toolG` (p9) and
`SAWG`/`RACKG`/`LIFTG`/`CARTG` (p2m) do — builders that run once per
shed otherwise mint the same buffers twice.

## The save (game's first)

`buildSerialize` → localStorage key `house.build` (versioned) →
`buildLoad` at the p7 boot tail **replays the same functions the hands
use** (makeSerBody → asmAdopt → addNail → layTrack → rideTrack). Saved:
build bodies, assemblies, track, pallets, orders, rack colors, lift
poses. NOT saved (by spec): shows, cues, fly positions, patch, the hang
and its paint (RULING W). **Anything that builds scenery must go through
those same functions or it is invisible to the save.**
