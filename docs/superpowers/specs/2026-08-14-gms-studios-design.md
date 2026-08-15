# GMS STUDIOS — the third venue

**Owner's brief, 2026-08-14:**

> add a movie and game show studio with 2 floors and a warhouse. the first
> building is for tv shows and game shows and officses. and the warehouse is
> for filming movies. make it so in the areas for tv shows it has bars on the
> celling and you can hang lights from them and in the ware house make it so
> you can lower them like the fly sytem. make it so you can order differnt
> lights to hang. make it have the building sytem like the stages

**His four answers, same day, which are the rulings below:**

> make it have 4 tv show spacses in the main building on the first floor. and
> offises on the second floor. and then one big warehouse space. and dont have
> prebuilt sets in any off them just make it have the same building ssytem as
> the theater.

> [starting rig] Empty — nothing at all hung
> [build shop] A separate shed behind the complex

**And, mid-round:**

> also add a lader you can order and climb up and carry

Rulings continue the lettered sequence; **DY** was the last (the lantern-body
merge). This spec is **DZ–EK**.

---

## 1. What this is, in one paragraph

A **third venue**, built exactly the way the Arc Centre is built (`p2j`): its
own `Group` hung off `scene` rather than `world` so the Palace's room sorter
never sees it, its own room groups and cull rota, its own bed light, its own
shed and its own `ORDERS` book. Inside it: a two-storey production block with
**four television studios** on the ground floor and **offices** above; one big
**warehouse film stage** behind it; and a **construction shed** off the
warehouse holding the saws, the paint rack, the forklift and the order screen.
Five new entries in `STAGES` — one board per studio, one for the film stage —
so the console follows you from room to room the way it already follows you
from the Palace to the Arc.

Everything in it starts **empty**. No production loads into it, no set stands
in it, no lantern hangs on it. What is there is structure: the rooms, the
grids, the bars, and the shop to build with.

---

## 2. RULING DZ — the studio grid is STRUCTURE, and the warehouse's is a FLY

This is the distinction the whole round turns on, and the two halves of the
brief are deliberately different mechanisms rather than one mechanism twice.

**A television studio has a fixed grid.** Bars are welded into the ceiling at
a set height and they do not move. You get to them off a ladder or a tallescope
and you clamp lanterns to them. So a studio bar is **static geometry with
hanging points on it** — `addFixture` records parented to `rigGroup`, no
lineset, no counterweight, no trim, nothing in `FLY`.

**A film stage flies.** The brief says so — *"in the ware house make it so you
can lower them like the fly sytem"* — so the warehouse's bars ARE linesets:
`makeLineset()` from `p3`, into that stage's `flyGroup`, moved by the same
`flyTo` / `updateFly` / `minTrimOf` the Palace's rail uses, hauled by the same
desktop drag and the same VR rope.

Consequences, stated so nobody has to rediscover them:

- A studio stage's `FLY` array is **empty**, and every function that iterates
  `FLY` must survive that. `updateFly` already does (a `for…of` over nothing).
  The fly UI must draw an empty rail rather than throw.
- A studio grid point's height is fixed at `SS.GRID`; `minTrimOf` has no
  meaning there and is never consulted.
- The warehouse's linesets carry **no drapery**. `GOODS` is a theatre stock
  list — house curtains, legs, borders, a cyc. A film stage's pipes carry
  lanterns and whatever you nail to them. They hang `'pipe'` (a bare pipe,
  weight 60) and `'electric'`; the rest of the palette is not offered there.

## 3. RULING EA — every room boots EMPTY, and that is the feature

*"dont have prebuilt sets in any off them"*, and *"Empty — nothing at all
hung"*. So:

- **No fixtures hung.** The grids and the flown bars carry hanging points and
  nothing else. Every channel is a dead point until you clamp a lantern to it —
  which is already exactly what an unhung point means, through the one gate in
  `updateRig` (never `visible`; INVARIANTS).
- **No goods.** No standing hang, no house curtain, no borders. This is not a
  receiving house.
- **No production.** `SHOW` for each of the five stages is `showBlank()`. The
  four productions stay where they are; none of them loads here.
- **No scenery.** The scenic stock palette does not offer anything into these
  rooms. A set in this venue is wood, cut on the shed's saws, nailed into an
  assembly and painted — the build system, which is the rest of the brief.

**The one exception is work light.** A room with no lanterns and no house
lights is unlit black, in which you cannot find the saw, let alone hang
anything. Each studio and the warehouse get **blue-and-white work lights** on
the `HOUSE.work` master — the same master the Palace's work lights answer, so
the existing console row drives them with no new UI. They are the room's
lighting, not the show's, and they are not fixtures: they never enter
`FIXTURES` and never compete for the real-light pool.

## 4. RULING EB — a point is minted by `addFixture` and STRIPPED, never faked

`addFixture` mints a lantern body and hangs it on the point it just made
(`regBody(f.type, body, f)`), and for the mover it parents the beam and the
glow into the body's head rather than the point's group. An "empty point" made
by skipping that step would differ from a genuinely unhung point in exactly
the way that is invisible until a mover is hung on it.

So an empty studio point is built the honest way: `addFixture` runs whole, and
then the lantern it minted is taken off by **the same function the trash drum
uses** — `removeBody`, which clears `b.point.body` and drops the record from
`BODIES`. The point is left in precisely the state a point is in after a hand
has unclamped its lantern and carried it away, because that is what happened.

This is the project's standing rule (`ARCHITECTURE.md` §the save: *build
through the same functions the hands use*) applied to un-building.

## 5. RULING EC — two floors, and the floor is the raycast

The game already walks on more than one level: the Arc's mezzanine at 5.8 and
its fly floors at 9.4 are `WALKABLE` meshes, and `groundAt` is a downward
raycast with a 28m reach that finds whichever surface is under you. **A second
storey needs no new machinery** — it needs a slab on `WALKABLE`, a stair whose
treads are on `WALKABLE`, and a wall rule that does not let you walk off it.

- The office floor is a slab at `SS.OFF_Y`, over the front band only. The four
  studios run double-height beside it.
- The stair is in reception, built the way the Arc's feature stair is (treads
  batched, the batch pushed to `WALKABLE` with `walk:true` so its bounding
  sphere is not culled out from under you).
- **The edge is a wall, not a hope.** `stuWallBlocks` gets the office floor's
  perimeter as a rule with a `yMin`, so it stops you at 5.0 and not at 0.

## 6. RULING ED — the venue's own coordinates, and where it sits

`STU.X = -420`. The Palace is at 0 and the Arc at +420, so the town runs
studios ← palace → arc and `venueAt` stays one comparison per side:

```js
function venueAt(x){
  if(x < STU.X + 140) return 'studio';
  if(x > ARC.X  - 140) return 'arc';
  return 'palace';
}
```

Every number in `p2n` is **studio-local**; the group carries the offset, as the
Arc's does. Everything computed in world space needs a container at the world
origin (INVARIANTS) — the floor-pool group and the crew root each carry
`position.x = -STU.X` to cancel it out, exactly as `buildArcStage` does.

### The plan (studio-local metres)

```
                        z = +14  ── glazed front, the way in
   ┌──────────────────────────────────────────────────────────┐
   │  RECEPTION  +  the stair up            (z  -1 … +14)     │
   │  ── office floor over this band at y = 5.0 ──            │
   ├──────────────────────────────────────────────────────────┤
   │  CROSS CORRIDOR                        (z  -6 … -1)      │
   ├────────────┬────────────┬────────────┬────────────┬──────┤
   │ STUDIO 1   │ STUDIO 2   │ STUDIO 3   │ STUDIO 4   │      │  z -22 … -6
   │ cx = -33   │ cx = -11   │ cx = +11   │ cx = +33   │      │
   └────────────┴────────────┴────────────┴────────────┴──────┘
                        the yard              (z -30 … -22)
   ┌──────────────────────────────┬───────────────────────────┐
   │  THE WAREHOUSE — film stage  │  THE SHED  (x 34 … 58)    │  z -76 … -30
   │  x -30 … +30,  H 18, grid 14 │  saws, paint, forklift,   │
   │  10 flown bars               │  racking, order screen    │
   └──────────────────────────────┴───────────────────────────┘
```

### The numbers, named once (`SS`, the studio box — `AS`'s opposite number)

| name | value | what |
|---|---|---|
| `SS.W` | 20 | a studio, wall to wall |
| `SS.DEPTH` | 16 | front wall to back wall |
| `SS.CEIL` | 7.4 | the underside of the studio roof |
| `SS.GRID` | 5.2 | the lighting bars — **set by the ladder's reach, RULING EK** |
| `SS.PITCH` | 22 | centre to centre — 20 of studio, 2 of wall |
| `SS.OFF_Y` | 5.0 | the office slab, top face |
| `SS.OFF_H` | 3.4 | office clear height |
| `SS.DECK` | 0 | **the deck is y = 0, here as everywhere** (INVARIANTS) |
| `SS.DOORH` | 3.6 | a studio's roller door off the corridor |

`SW`, the film stage: `W 60`, `DEPTH 46`, `H 18`, `GRID 14`, `OUT 12.4`,
`BARS 10`, `DECK 0`.

**The deck is y = 0 in all six new rooms.** The Arc's decks were once built a
metre up and it buried every production that loaded onto them; nothing here
loads a production, but the build system's settle (`updateBodies`), the nail
snap and every trim in `p3` are all written to y = 0 too.

## 7. RULING EE — five boards, and a room that owns none keeps the one you had

`STAGES` gains `stu1 stu2 stu3 stu4 stuFilm`. `stageAt(x, z)` returns the
studio you are standing in, `'stuFilm'` in the warehouse, and **`null`** in
reception, the office floor, the corridor and the shed — `null` already means
*keep the board you walked in with* (the Arc foyer's rule), so walking out of
Studio 2 to fetch a lantern does not silently re-patch you.

Each studio stage is built by ONE function run four times, the way
`arcBuildHouse` is called twice: build them by hand and they drift apart
within a week. What differs between them is the centre line and the name.

New per-stage state gets parked in `p2k` or it leaks across the swap. These
stages introduce **no new per-stage state** — deliberately. A studio's grid
points ride `FIXTURES`, its group rides `rigGroup`, its pools ride
`poolGroup`, its (empty) rail rides `FLY`. All four already swap.

## 8. RULING EF — the shed is the theatre's shed, third instance

*"A separate shed behind the complex"*, *"the same building ssytem as the
theater"*. So: `SHEDS.studio`, `CARTS.studio`, `ORDERS.studio`,
`TRASH.studio` — the existing registries gain a third key, and the existing
builders run a third time. Nothing about the build system is re-implemented:

- Same saws (track table + chop bench), same paint rack and roller, same trash
  drum, same racking, same work table, same forklift, same pallet slots.
- Same order screen and the same four tabs (GEAR / WOOD / HDWE / PAINT), the
  same `ORDER_MAX` 12, the same `ORDER_PENDING_MAX` 3, the same
  `ORDER_DELIVERY` 30 game-seconds.
- **Same caps, enforced at the same point:** `BUILD_CAP` 150 build pieces per
  venue and `STOCK_CAP` 24 loose gear per venue. The order screen is the
  enforcement point (INVARIANTS); a third venue gets its own book of both.

`venueRoot('studio')` returns `STU.group`, so an un-hung body lives at the
venue root and neither culls with a shut door nor parks with a stage.

## 9. RULING EG — the lights you can order

*"make it so you can order differnt lights to hang"*. `ORDER_KINDS` today is
`profile fresnel par cyc mover speaker` and every one of them is a theatre
lantern. A television studio and a film stage light with different kit, so the
GEAR tab gains three, available in every venue (the catalogue is one list; a
Palace that can order a softlight is not a problem worth a second list):

| kind | label | what it is | angle | power |
|---|---|---|---|---|
| `soft` | `SOFTLIGHT` | the studio softbox — a big diffused box, the wash a talk set is lit with | 70 | 2.2 |
| `panel` | `LED PANEL` | a flat bi-colour panel, the modern studio's workhorse | 60 | 1.8 |
| `hmi` | `HMI FRESNEL` | the film stage's hard daylight unit, a heavy Fresnel on a big yoke | 24 | 3.4 |

Each needs a body builder in `p4` beside `bodyFresnel` / `bodyPar`, each built
from `fixG`-cached geometry and closed with `mergeShell` — **RULING DY's rule
is not optional for new bodies**: 423 lantern bodies were 54% of the scene's
drawables before it, and three new kinds that skip the merge put that straight
back. Each carries exactly one `LENSM` piece so the lens stays repaintable.

`hmi`'s `rank` sits above the profile's so a film stage's key light wins a real
light off the pool over a background unit — but `rank` and `power` are two
different numbers (RULING BF) and both are stated, not left to default.

## 10. RULING EH — culling, and eight rooms

`STU.order = ['recep','off','s1','s2','s3','s4','ware','shed']`, sorted by a
`STU_SEES` table exactly like `ARC_SEES`. `updateRooms` in `p2i` gains the
third branch beside the Arc's: the venue you are not in is switched off
entirely at the group.

The rule the Arc learned and this venue inherits: **a fitting belongs to a
room and answers that room's master** (`aGlow`'s `room` argument). Left on one
global master, every lit fitting in all eight rooms stays at full through a
blackout — which is why the Arc could never get as dark as the Palace until it
was fixed. Work lights answer `HOUSE.work` **of the stage that owns that
room**, through `stageHouseLevel`, so Studio 3's work lights do not come up
when you take Studio 1's up.

And the bed: ambient is global, so `STU.amb`/`STU.hemi` go to `visible = false`
— not merely intensity 0 — whenever you are inside a studio or the warehouse.
RULING DW's finding stands: a hemisphere light at intensity 0 is still a full
iteration of the hemisphere block in every standard material's fragment, both
eyes, every frame, and only `visible = false` takes it out. The predicate is
**room membership**, never the faded number, so it cannot flap down a fade and
re-compile every lit material on consecutive frames.

## 11. RULING EI — every material reaches `envTrack`, no exceptions

The one registration (INVARIANTS, rulings DK/DL/DM/DT). Every material minted
in `p2n` — and every material minted by the three new lantern bodies — goes
through `envTrack`, which hands it the shared atmosphere and colour-grade
uniform objects and, if `envCarrier` says so, the room PMREM as
`material.envMap`. A material that misses it renders with the fog and the
grade **bypassed rather than broken**, which is a silent failure and is
therefore asserted rather than left to be noticed.

`envRegister(STU.group)` runs at the tail of `buildStudios()`, and
`envRecollect()` already runs at every stage swap.

**A copied uniform is the failure mode to fear.** Share the object.

## 12. RULING EJ — VR reaches the third venue, or it does not exist

The Quest is where this game is actually played. A venue with no VR is a
venue the owner cannot visit. So `p9` gains, at parity with the Arc:

- the venue in the teleport/travel list and in the wrist readout's zone line;
- the shed's order screen as a VR panel (the existing one — `ORDER_TABS`
  is shared, only the venue key differs);
- the fly rope on the warehouse's ten bars (the studios have no rail to haul);
- desks: the film stage and each studio get the board where the Arc's do.

`VR.glowCap` 12 and `VR_SEE_CONSOLE` 12 are unchanged and apply here as they do
everywhere.

---

## 12a. RULING EK — the ladder, and it is what SETS the grid height

> *"also add a lader you can order and climb up and carry"* (owner, mid-round)

Three verbs, and each one is a different existing system doing its job:

**ORDER it** — a ladder is an orderable body on the **HDWE** tab, beside the
work table (RULING K's precedent exactly: an orderable body, carried like
wood, that lands square). `kind:'ladder'`, one unit, delivered on a pallet.
It is **not** a build kind — it does not nail into assemblies, it is not
capped by `BUILD_CAP`, and it counts against the venue's 24 loose gear
(`STOCK_CAP`) like any other piece of kit.

**CARRY it** — a `BODIES` record, so it is grabbed, held, dropped and settled
by machinery that already exists. Its `restH` puts its feet on the floor
rather than floating its origin at 0.25, the way `'table'` already does.
`canHang` refuses it: a ladder is not a lantern and never clamps to a bar.

**CLIMB it** — and this is the part with a trap in it. There is no climbing
code in this game and this ruling does not add any. What the game HAS is a
downward ground probe (`groundAt`, 28m reach) over a `WALKABLE` list, and a
player who steps up onto whatever it finds. So the ladder is an **A-frame
stepladder with a top platform**, its treads and its platform on `WALKABLE`,
and you climb it by walking up it — the same way you climb the Arc's feature
stair and its fly-floor ladder, with no new mechanic to get wrong.

That is also the honest piece of kit: nobody rigs a grid off a leaning
extension ladder. A studio uses a stepladder, and above that a tallescope.

**The trap, written down before it bites:** the ladder is a body that MOVES,
and `updateBodies` settles other bodies onto whatever is under them. A ladder
carried out from under a lantern resting on its platform takes that lantern's
floor away. This is precisely the contract BUILD-SYSTEM.md warns about
(*anything that can take the ground out from under a resting body must call
`wakeBodies`*).

> **Corrected at implementation, and the correction is the interesting part.**
> This paragraph originally ended "the `tableTopAt` scan is the mechanism; the
> ladder's platform joins it." **That is wrong.** `tableTopAt` exists precisely
> *because* the work table is NOT on `WALKABLE`; the ladder is, so `groundAt`
> already serves the settling body and the player from the same list, and
> adding the ladder to `tableTopAt` would be a redundant second answer to a
> question already answered. `tableTopAt` is left alone.
>
> The same pass found the real gap the paragraph was groping at: `grabBody`
> calls `wakeBodies` and covers every route through a hand, but **`removeBody`
> did not** — destroying a body is the one way to lose your floor that goes
> through no hand, and it was a live hole for the work table before there was a
> ladder. `removeBody` now calls it, and splices the body off `WALKABLE`.

**A second trap, found only by building it:** `groundAt` answers with the
HIGHEST surface in a column, and p7 snaps the player straight onto it. A real
stepladder's treads overlap in PLAN — so standing on tread one puts treads two,
three and four in your own column and you are teleported 1.32 m up, which
`tryMove` then refuses in every direction: a wall you can neither get onto nor
off. **The going must equal the tread depth so the plan TILES**, which is the
shape the Arc's feature stair already has and the reason its 0.62 m treads go
0.62 m per step. Rake is not a look here; it is the mechanism.

**And it is what sets `SS.GRID`.** A bar you cannot get a hand to is a bar you
cannot hang from, and hanging from it is the whole brief. The numbers:

| | |
|---|---|
| ladder overall height | 3.9 m |
| top platform | 3.05 m |
| treads | 6, at 0.44 m |
| standing reach from the platform | ≈ 2.15 m |
| **hand height** | **≈ 5.2 m** |

So **`SS.GRID` is 5.2** — chosen from the ladder, not guessed and then
defended. This is the one number in the venue that is a consequence rather
than a choice, and if the headset says the grid is too low for the room, the
ladder moves first and the grid follows it.

**The warehouse has no ladder problem**, and that is the shape of the brief:
its bars fly (RULING DZ), so you bring the bar down to the deck, clamp the
lantern on standing on the floor, and fly it out. That is what a fly system is
for, and it is why the two halves of the brief are two mechanisms.

## 13. What this round does NOT do, said out loud

- **No production loads here.** The five shows stay in the two theatres.
- **No cameras, no vision mixer, no gallery desk.** The brief says lighting
  and building; a camera system is a round of its own and inventing one here
  would be scope nobody asked for.
- **No audience seating in the studios.** A game show has a bleacher; it is
  not in the brief, and it is the kind of thing that is better built out of
  the wood than minted as furniture. The build system is the answer.
- **No lift.** The stair reaches the office floor.
- **`p2d` stays orphaned.** It is owner-taste leftover; leave it.

---

## 14. The build order, and why `p2n` goes where it goes

A new part, `p2n`, and **`build.sh` is never sorted** — the order is a
dependency order with load-bearing positions.

```
… p2j.txt   the Arc            (defines venueAt, which p2n extends)
   p2n.txt  GMS STUDIOS        ← NEW
   p2k.txt  the stage swap     (buildStages registers the studio stages)
   p2m.txt  shed furniture     (buildStudioShed, called from buildStudios' tail)
   p2i.txt  room culling       ← must stay LAST of the p2 family
   p7.txt   the frame loop     (init: buildRooms → buildArc → buildStudios → buildStages)
```

`p2n` sits **after** `p2j` because it extends `venueAt` and reuses the Arc's
door mechanism, and **before** `p2k` because `buildStages()` must be able to
see `STU.rooms` to build into them. `buildStudioShed` lives in `p2m` beside
its two siblings and is called from the tail of `buildStudios` — function
declarations hoist across the concatenated file, which is how `buildArcShed`
already works. `p2i` stays last: it files whatever exists at that moment.

---

## 15. The PR chain — one concern each, linear, never stacked

Owner's rule: open a dependent PR only after its parent merges, rebased onto
fresh `main`, rebuilt, retested.

| PR | Concern | Test |
|---|---|---|
| **1** | `p2n`: the venue shell — `STU`, eight rooms, the production block, four studio boxes, the office floor and its stair, the warehouse, the yard, walls/bounds/culling, `venueAt`, the zone readout | new `tests/studios.js` |
| **2** | the shed: `SHEDS.studio`, `CARTS.studio`, `ORDERS.studio`, `TRASH.studio`, saws/rack/drum/forklift/racking, the order screen | `warehouse.js`, `orders.js`, `build.js` |
| **3** | the studio grids: static bars, empty hanging points (EB), the four studio stages, `stageAt` | `stages.js`, `studios.js` |
| **4** | the film stage: ten linesets, the film goods subset, the `stuFilm` stage, the haul | `stages.js`, `legs.js` |
| **5** | the three new lanterns (EG): bodies, `mergeShell`, `ORDER_KINDS`, labels | `workshop.js`, `orders.js` |
| **6** | the ladder (EK): the body, the HDWE row, `restH`, the walkable treads and platform, `tableTopAt` | `build.js`, `orders.js`, `studios.js` |
| **7** | VR (EJ): travel, zone, order screen, rope, desks | `vr.js` |
| **8** | the record: STATE.md, HANDOFF.md, the guide, any new traps | — |

Every assertion **negative-checked** — verified to fail against the pre-change
build, with the mutation proved present AND proved to have changed the build.
Suites green before AND after every PR. `tests/smoke.js` still flakes under
full-suite load; rerun it standalone.

---

## 16. The headset questions this round opens

jsdom has no eyes and no GPU. These go to the checklist, not to a test:

1. **Does an empty studio read as a room or as a void?** Four bare boxes with
   work light and nothing hung is a deliberate choice (EA) and it is the one
   most likely to feel wrong in the headset.
2. **Does the ladder actually get you to the grid, in VR, with a lantern in
   one hand?** `SS.GRID` 5.2 is derived from the ladder's reach (EK) on paper,
   and paper has no arms. This is the single most important thing to try in
   the headset, because if it fails the brief fails: climb the ladder, clamp a
   lantern, get down. Watch for the platform edge (does the ground probe hold
   you on it?) and for whether the clamp is above comfortable hand height.
3. **Do ten flown bars in a 60m room read as a fly system?** The Palace's
   fourteen sit in a 15m opening; the same rail spread across 60m may read as
   sparse.
4. **The draw cost of a third venue.** It is switched off when you are not in
   it, so the frame should not notice — but the boot does. Re-measure with
   `tools/draws.js`, and take the wrist meter's `calls · tri` line in each new
   room the way DR–DY established.
