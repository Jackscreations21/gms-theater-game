# The carpenters — design

**Date:** 2026-08-08 (spec written the day the owner answered HANDOFF's
five shaping questions)
**Source:** the owner's asks, verbatim:

1. "mkae it so there is a list of a bunch of stuff for them to build"
2. "you can use a new tool on your toolbelt to mark wher it should go"
3. "make them have to cut the wood in the warehouse"
4. "make them use real stock"
5. "only in vr and your call them with the screen in the warhouse and
   you choose what you want them to build and you use the new tool to
   make wher you want them to build it"
6. "make it so they actually carry the individual piecse of wood
   instead of how the show load in looiks"

And the fourth shaping question (existing hands or a new trade?)
answered by the owner's pick: **hybrid — the existing hands do the
hauling and hammering, one new lead carpenter runs the job.**

Five PRs, sequential (they share p6b and p9), failing-test-first as
ever. Rulings continue the letter sequence (spec history ends at W).
After Z the letters double: AA, AB, …

---

## What this is

The build system lets the player build scenery by hand: order stock at
the shed screen, forklift the pallet, seat wood on the saws, cut, nail,
paint. The carpenters are people who do that work for you. You pick a
piece from a catalogue on a warehouse wall screen, you stamp a mark on
the deck with a new toolbelt tool, and the crew builds it — really: the
same wood, the same saws, the same nails, every plank visibly carried
from the shed to the mark, one piece per trip.

Because every step goes through the same functions the player uses
(`regWood` stock already minted by the order, `seatWood`/`sawSetCut`/
`sawCut`, `addNail`/`asmAdopt`), the finished work is ordinary bodies
and assemblies: it can be grabbed, hammered apart, painted, flown, and
it rides the build save with zero new save code.

## The trap this round is built around

**`crewPutDown` destroys what it holds.** Today's show crew never
carries anything real — `crewPickUp` mints a throwaway dummy in the
hand's carry socket and `crewPutDown` calls `disposeTree` on it
(`src/p6b.txt:169-201`) while the real scenery just snaps visible at
its authored spot. Point that path at real stock and the plank's
geometry is destroyed on delivery. Carpenter loads must never pass
through the dummy path: real carry is `h.hands.attach(b.mesh)` on
pickup and `venueRoot(b.venue).attach(b.mesh)` on set-down — the
forklift's exact shape (`src/p2m.txt:271, 287`) — with the body's
state, not its existence, doing the bookkeeping.

The second standing trap is the wrong deck: every carpenter coordinate
that isn't the mark itself comes off `crewFrame()` at execution time,
or the work lands 420 m from where it should (HANDOFF §carpenters,
`STATE.md`, AUDIT H2/H5).

## RULING X — carpenters are a VR call from their own warehouse screen

- A second wall screen — the CARPENTERS screen — hangs beside the
  order screen in each shed, built in the order screen's mould
  (`vrMakeOrderScreen`, `src/p9.txt:892-910`): own canvas, own
  `hits[]`, own `userData` tag, own `vrSelect` branch. No desktop
  path, no HTML panel — VR only, as RULING F set for the build system.
- It is NOT a fifth tab on the order screen. The order glass is 560 px
  wide with four 122 px tabs on a 130 px pitch — a fifth lands off the
  canvas — and the suites find that screen's controls by pixel
  geometry (`tests/build.js:74-88, 685-689`); its layout does not
  move. The order screen keeps doing exactly one job: stock in.
- The screen shows the catalogue, the stock check for the selected
  item (READY, or a NEED list: "NEED 2× 2x4 · 1× SHEET"), the mark's
  status, and one CALL button. Refusal strings are statuses on the
  glass, order-screen style: `NO MARK`, `MARK IS IN THE OTHER HOUSE`,
  `NEED STOCK`, `PIECES FULL`, `CREW BUSY`.

## RULING Y — you build from a catalogue, and the screen is the enforcement point

- The catalogue is a data table (`CARP_CAT`): each entry names its
  label, the stock it consumes (profiles and counts of ordinary loose
  wood), its cut schedule, and its blueprint (piece poses about the
  mark origin plus nail placements). Adding a buildable is adding a
  row, not code.
- v1 ships three entries that exercise every primitive: **4x8 FLAT**
  (sheet skin, two full-length 2x4 stiles, one 2x4 cut into two
  rails), **4x8 PLATFORM** (sheet top, 2x4 frame, one 4x4 cut into
  four legs), **2-STEP UNIT** (two cut 2x8 stringers, sheet cut into
  treads).
- Carpenters consume **real loose stock in the calling venue** —
  pallet-slotted or floor wood of the right profile, nearest first.
  They order nothing and conjure nothing. If the shed is short, the
  screen says what to order and the CALL refuses; the order screen is
  an arm's length away.
- **The screen enforces the cap.** Cutting registers off-cuts as new
  bodies, and nothing downstream of the order screen checks
  `BUILD_CAP` today — so the CARPENTERS screen counts the pieces the
  job will end with (stock consumed plus cuts made) and refuses with
  `PIECES FULL` past 150, per the standing invariant: caps are
  enforced at the screen, and anything that mints bodies checks them
  too.

## RULING Z — the mark tool says where

- A fourth tool joins the belt (nailgun right hip, hammer left hip,
  tape buckle): the **crayon**, holstered at the buckle's other side.
  Same lifecycle as every tool — squeeze within 0.22 to draw, trigger
  to fire, open the hand to holster; the generic holster loop needs no
  edits.
- Fire casts the controller's forward ray at `WALKABLE` (a small
  dedicated raycaster — the curated `pickAll` list deliberately
  excludes floors and stays that way). The hit must be a floor at
  ankle height (`y < 0.3`): the deck is y = 0 everywhere, and the fly
  gallery's floor at y ≈ 8 is in `WALKABLE` and must refuse —
  carpenters do not build in the air.
- The mark is paint on the floor, `PALLET_SLOTS` style
  (`src/p2m.txt:110-118`): a translucent plane at y = 0.02,
  `raycast = ()=>{}` so it is never a thing, Arc offset corrected with
  `-ARC.X`. It records `{venue, stage, x, z, yaw}` in world terms —
  yaw from the controller's horizontal facing, so the build fronts the
  way you pointed.
- **One mark stands at a time.** Marking again moves it; there is no
  eraser. Firing at a wall, at nothing, or at the foyer (`stageAt`
  returns null there) toasts a refusal and leaves the mark where it
  was.

## RULING AA — a lead carpenter runs the job; the hands haul and nail

- A seventh figure joins `CREW.people`: the **lead carpenter** — same
  `makeHand` anatomy, own dress (apron, no cap), `trade:'carpenter'`.
  They exist only for carpenter work: `crewAssign` never hands them a
  show job, and show load-ins never wait on them.
- **The saws are the lead's alone.** Fetch-to-bench and cutting are
  the lead's jobs; the six hands carry cut pieces to the mark and nail
  them. Everyone runs on the existing engine — `handGoTo`, the
  `work`/`wait`/`then` pattern, the `hold` barrier — adding a trade is
  adding job kinds, not an engine.
- One build runs at a time per call, and the show crew and carpenters
  do not run simultaneously (`CREW BUSY` both ways). The job queue is
  one queue.

## RULING AB — planks are really carried, one piece per trip

- Pickup is `h.hands.attach(b.mesh)`; set-down is
  `venueRoot(b.venue).attach(b.mesh)` with the body left `'loose'`
  (or seated, when the lead delivers to a bench through `seatWood`).
  The mesh is the same object before, during, and after the walk —
  nothing minted, nothing disposed, world pose preserved at both ends.
  The dummy-prop path (`crewPickUp`/`crewPutDown`) is never used for
  carpenter loads.
- **One piece per trip.** A flat's worth of timber is that many walks
  to the mark. That is the look the owner asked for, and it is honest:
  the piece in the hands is the piece that gets nailed.
- A carpenter stood down mid-carry (stage swap stands the crew down,
  `src/p2k.txt:130-143`) sets the plank down loose where they stand.
  Never dispose, never teleport.

## RULING AC — real stock, real saws, real nails; the save rides free

- Cuts run the player's pipeline headlessly: `seatWood(st, b)` →
  `sawSetCut(st, x)` → `sawCut(st)` on the venue's real stations
  (`SAWS[venue].track` for sheet, `.chop` for lumber) — the exact
  calls the test suite already makes with no VR
  (`tests/build.js:417-460`). A cut never mints geometry; off-cuts are
  real bodies and count against the cap; usable off-cuts are left in
  the shed as stock.
- Assembly happens **at the mark, lying flat**: hands place each piece
  at its blueprint pose (bodies really are there — `addNail` reads
  world transforms) and shoot **two nails per joint**, because RULING
  G stands: one nail is a pivot, two is rigid. Carpenters build rigid.
- **The finished piece is not nailed to the deck.** It lies at the
  mark, an ordinary un-anchored assembly, so you can grab it, raise
  it, fly it, or nail it down yourself — an anchored assembly refuses
  the hand, and the carpenters don't get to make that choice for you.
- All timing off frame `dt` through the existing crew tick — work
  waits, saw pauses, everything. Never `setTimeout` (M7).
- Because every piece is a real body and every joint a real nail, the
  work rides `buildSerialize` with **zero new save code**. The CALL
  itself is not saved: reload mid-build keeps the wood, the cuts, and
  the partial assembly exactly where they were — honest workshop
  state — but the crew do not resume. Call them again.

## The job kinds

Four new kinds in `crewAssign`'s switch, plus the existing `hold`
barrier between phases:

| kind | who | does |
|---|---|---|
| `carpFetch` | lead | walk to a stock piece, real-carry it to the right saw, `seatWood` |
| `carpCut` | lead | `sawSetCut` to the schedule, work-wait, `sawCut`; off-cut stays seated or is set aside loose |
| `carpHaul` | hand | real-carry one finished piece from the bench to its blueprint pose at the mark |
| `carpNail` | hand | work-wait at a joint, then `addNail` ×2 per the blueprint |

The planner (`carpPlan(itemKey, mark)`) is pure: given the venue's
bodies and the catalogue row, it returns either the NEED list or the
full job queue — surveyable and testable with no VR and no crew.

## What can go wrong, and the tests that catch it

- **The dispose trap** — a carried plank must be the same mesh
  end-to-end: assert object identity through pickup/set-down, body
  count unchanged, geometry still the shared `WOODG`.
- **The wrong deck** — mark on `arcMain`, call from the Arc shed:
  assert the finished assembly's world x is at the mark, not 420 m
  west of it.
- **The gallery** — a mark ray hitting a `WALKABLE` floor at y ≈ 8
  refuses; the standing mark does not move.
- **The cap** — a call whose cuts would pass 150 pieces refuses at
  the screen with `PIECES FULL`; nothing is fetched.
- **Stand-down honesty** — stage swap mid-haul: the plank is loose at
  the hand's position, nothing disposed; mid-cut: the piece is still
  seated on the bench.
- **Pivot flats** — every blueprint joint gets two nails: assert no
  piece of a finished catalogue item rides a pivot group.
- **The pixel-pinned order screen** — the order canvas is untouched;
  its geometry-matched tests keep passing unmodified.
- **Save round-trip** — build a flat, serialize, boot the second
  jsdom world, load: same piece count, same nails, same world poses.
- Every new assertion negative-checked against the pre-change build,
  as ever. New suite `tests/carp.js`, registered in `run-all.js`.

## The five PRs

1. **`carp-mark`** — RULING Z. The crayon on the belt, the floor ray,
   the marker, the refusals. `tests/vr.js`.
2. **`carp-plan`** — RULING Y and the cap. `CARP_CAT`, `carpPlan`,
   the stock survey, the NEED list. Pure logic, new `tests/carp.js`.
3. **`carp-lead`** — RULING AA and the saw half of AC. The seventh
   figure, `carpFetch`/`carpCut`, real cuts on real stations,
   headless. `tests/carp.js`, `tests/crew.js`.
4. **`carp-build`** — RULINGS AB and the rest of AC.
   `carpHaul`/`carpNail`, the real carry, assembly at the mark,
   stand-down set-down. `tests/carp.js`.
5. **`carp-screen`** — RULING X. The CARPENTERS screen, catalogue
   list, statuses, CALL wired to the planner. `tests/vr.js`,
   `tests/carp.js`.

## Headset-only questions (to HANDOFF's list after this lands)

Belt crowding with a fourth holster; crayon draw-vs-tape confusion at
the buckle; marker legibility on the deck; the feel and pace of
watching a build (work-wait constants are one-line tunes); frame cost
of a seventh figure walking during play.

## Out of scope (recorded so they are decisions, not surprises)

- No desktop call, no HTML panel (X mirrors RULING F).
- No pathing: carpenters walk straight lines like the show crew,
  through walls if need be — the same accepted drift (AUDIT H5).
- One mark, one build at a time; no queue of builds.
- Carpenters do not paint — the roller is the player's.
- No "copy something I already built" (the third answer to shaping
  question 1) — catalogue only; a copy feature is its own round.
- No hinges, track, or hardware in v1 catalogue rows.
- The call does not survive reload; the work does (AC).
