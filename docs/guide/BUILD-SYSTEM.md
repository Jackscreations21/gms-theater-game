# The build system (p4c, with geometry in p2m)

Physically build scenery from wood in VR: order it, forklift the
pallets, cut on shed saws, nail with a gun / pull with a hammer, paint,
hinges that swing, track that slides — and the game's first save.
Binding specs: `docs/superpowers/specs/2026-08-07-build-system-design.md`
(rulings F–J), `…build-usability-design.md` (K),
`…2026-08-08-build-feel-round-design.md` (L–S),
`…goods-round-design.md` (T–W). **Read them before touching any of
this.**

## Wood

- PARAMETRIC: one shared unit BoxGeometry for every piece of every
  profile (sheet / 2x4 / 4x4 / 2x8, all born 8ft), scaled per piece;
  six material slots per mesh from the colour-keyed `WOODM` cache.
  **A cut must NEVER mint geometry** — re-scale one body, register a
  second (`sawCut`); a side under six inches is scrap.
- `regWood(prof, dims)` mints stock. Wood settles flat via `b.restH`.
- `canHang` refuses build kinds — wood joins ASSEMBLIES, never a patch
  point.
- Lengths display as ft-in via `ftIn()` (RULING S); the MODEL stays
  metric.

## Assemblies, nails, hinges, track

- `addNail(a, target, wp, wax)` joins anything to anything, builds or
  merges the assembly. `asmJoints` (RULING G): one piece-to-piece nail →
  a swing pivot at the nail; two+ → rigid; world nails (deck/pipe
  anchors) and carriage nails NEVER pivot. The hammer (`removeNail`) is
  the only way apart; zero nails demotes the piece to loose.
- Nails go where the gun POINTS (`nailRay`, 1.2m, RULING L); with no ray
  hit it falls back to the nearest touching seam within `SEAM_REACH`
  0.45 (`SEAM_TOUCH` 0.05). Lone wood refuses — no cosmetic nails.
- A HINGE is a nail that swings (`addHinge`): axis is the hinge body's
  own PIN, ±90°; nail the door shut → rigid; hammer that nail → swings
  again; hammer the hinge → body respawns loose.
- TRACK: gun lays sections (`layTrack`) into one deck-anchored assembly
  per run; a carriage released onto the run rides it (`rideTrack`);
  wood nailed to the carriage mounts under the slider; grabbing is a
  `'slide'` hold with hard stops (`slideTo`).
- Pipe anchors hang the root off `ls.group` so it FLIES; `ls.asmH`
  extends p3 `minTrimOf` so a flown flat floors at the deck.

## The snap (`snapWood` / `snapAsm`)

Held wood turns with the wrist, then squares to offered wood / deck /
live pipe / table top. Candidates by SURFACE gap (`SNAP_SEEK` 0.35); a
face is a joint only if the cross axes overlap (`SNAP_SLACK` 0.08);
smallest flush error ≤ `SNAP_OFFER` 0.22 wins; all metric. `VR.snap` is
the standing offer; the gun confirms it. Flat offers use a real identity
quat (`_IDQ`) — see the aliasing trap in TRAPS.md.

## Stations (geometry `p2m`, logic `p4c`, one set per shed)

- **Saws**: track table (sheets) + chop bench (lumber, 90°). Wood
  released over a station SEATS (`seatWood`; `'seated'` pieces never
  settle); the cutter is a grab class; trigger cuts what's under the
  blade.
- **Paint rack** (`buildRack`): open cans for the shed's colours (four
  stock; a delivered can poured in within 1.8 becomes a new colour),
  one roller. Dip = head within 0.16 of a can; trigger = `paintWood`
  (sheets per-FACE — box material-group order px nx py ny pz nz, unit-
  box local coords — lumber whole-piece) or `paintGoods` (whole
  lineset, through `GOODSM`, RULING T). Cans never run out.
- **Trash drum** (`buildTrash`, `TRASH`): held BUILD body over the mouth
  is destroyed; DELETE ALL WOOD on the order screen empties the venue's
  wood via `removeBody`/`deleteAllWood` (hinges respawn as hardware,
  gear untouched, live-hand pieces skipped — RULING P).
- **Work table** (RULING K): orderable body (HDWE tab), carried like
  wood, lands square; `TABLE_TOP` 0.925 is raised deck — stock settles
  onto it, the gun refuses it as a target.

## Ordering & the forklift

`ORDERS[v] = {pending:[], pallets:[]}` — three orders out per shed
(RULING D'), `ORDER_MAX` 12 units, ~30s GAME time (`updateSheds`),
pallet at the apron with anchors laid from the manifest. Tab strip:
GEAR / WOOD / HDWE / PAINT. Caps: `BUILD_CAP` 150 pieces per venue
("PIECES FULL"), 24 loose gear per venue ("STOCK FULL") — the screen is
the enforcement point. Forklift (RULING H, walk-behind): right-stick Y
drives the forks while held; forks up under a pallet take it, lowered
home set it down snapped to `PALLET_SLOTS` paint within 0.6. Pallets
reparent by `attach()` only.

## The save

See ARCHITECTURE.md §"The save". The one rule that matters here:
**build through the same functions the hands use and the work rides the
save for free** — `buildLoad` replays makeSerBody → asmAdopt → addNail →
layTrack → rideTrack. Code that pokes meshes directly is invisible to
the save. Dirty writes flush ≤1s, 10s heartbeat backstop; a load throw
clears the key and boots empty. Known accepted drifts are listed in
STATE.md.
