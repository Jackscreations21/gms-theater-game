# The Build System — design

**Date:** 2026-08-07
**Status:** approved by the owner (this session), pending final spec review
**Feature:** the deferred "VR build feature" (owner's words, 2026-08-06) — now specified.

You physically build scenery out of wood: order lumber and sheet goods at the
shed supply screens, forklift the pallets in, cut stock on shed saw stations,
nail pieces together with a nail gun, pull nails with a hammer, paint what you
built, add hinges that swing and track that slides, and stand the result on
any stage. Everything you build survives a page reload.

---

## 0. Owner rulings (given in this session — do not re-litigate)

- **RULING F — VR only.** No desktop tool equivalents. Desktop can still
  order at the supply screens and look at what was built; it cannot cut,
  nail, paint, or drive the forklift.
- **RULING G — joints take more than one nail.** One nail = the piece
  PIVOTS around that nail (droops if unsupported). Two or more nails at a
  joint = rigid. Nothing ever detaches or falls on its own; the hammer is
  the only way apart. No physics engine, no toppling.
- **RULING H — walk-behind forklift.** Pallet-jack mechanics (the proven
  cart pattern: grab the handle, it follows), forklift silhouette. Not a
  sit-in vehicle.
- **RULING I — a save system is part of this feature.** The first save
  system in the game. Scope: the build system's own state only (§8).
- **RULING J — v1 scope.** Order wood → forklift → cut → nail → paint →
  hinges → track. The furniture/parts catalogue (doors, lamps, tables,
  nightstands) is PHASE 2, after PR 7 — it slots into this machinery as
  ordered bodies and is out of scope for this spec's PRs.

Standing rulings that carry over: C (ordering is free), E-shape (stock caps
exist and the screen says so), one board per stage, deck y = 0.

---

## 1. Architecture: extend the detach system

Approach chosen over (a) a standalone build module — would duplicate the
carry/settle/snap machinery #37 proved and split nearest-wins across two
registries — and (b) a physics engine — RULING G makes one unnecessary, and
the Quest frame budget is the project's tightest constraint.

- Every wood piece, hardware item, and pallet is a **BODY** in the #37
  venue-level registry, with new kinds: `wood`, `hardware`, `pallet`.
  States extend hung/held/slotted/loose as needed (e.g. `seated` on a saw
  table, `riding` on forks).
- **Parametric geometry only.** A 2x4 of any length is ONE cached unit box,
  scaled. Same per profile (2x4, 4x4, 2x8, sheet). A cut NEVER mints new
  geometry — it replaces one body with two shorter ones sharing the same
  cached box. This is the frame-rate defense; treat it as an invariant.
- **Assemblies are data.** An assembly is a set of piece ids plus a list of
  NAILS (each nail: two piece ids, a point, an axis). Nail count per piece
  pair decides the constraint: 1 → revolute (pivot about the nail axis),
  2+ → rigid. Hinges and track carriages are constraints of the same shape
  (revolute with stops; prismatic with end stops). One venue-level
  `ASSEMBLIES` registry beside `BODIES`.
- Grabs extend `vrSqueeze` nearest-wins with the existing radii pattern;
  held pieces/assemblies follow the grip kinematically (never re-parented
  to the hand), and `updateBodies` (p4) settles them — exactly the #37
  contract, so `vrOnEnd`/`vrClearRopes` dropping a hold cold stays safe.
- Stage/venue parking is the p2k pattern; Arc-side containers carry
  `position.x = -ARC.X` (the world-origin invariant).
- Save (§8) is possible precisely because all of the above is data in
  registries.

## 2. Stock — the SKUs (§ordered in PR 1)

| Category | SKU | Notes |
|---|---|---|
| WOOD | 4×8 plywood sheet, 3/4" | one thickness in v1 |
| WOOD | 2×4 × 8ft | |
| WOOD | 4×4 × 8ft | |
| WOOD | 2×8 × 8ft | |
| HARDWARE | hinge | installs on a seam, §7 |
| HARDWARE | track section, 4ft | nails to the deck, §7 |
| HARDWARE | track carriage | clips onto track, §7 |
| PAINT | can, per color | fixed rack palette (~10 scenic colors) |

Single 8ft length for all lumber in v1. Display units on tapes, saws and
screens are **feet-and-inches** (American lumber); the world stays metric
internally, conversion at the display edge only.

## 3. Ordering (PR 1)

- The shed supply screen grows WOOD / HARDWARE / PAINT categories beside
  the existing lantern/PA stock. Quantity picker per SKU; one order builds
  one pallet manifest.
- **Up to 3 pending orders per shed** (ruling D updated from 1). Delivery
  stays ~30s of GAME time in `updateSheds` (never setTimeout — M7).
- Still free (RULING C holds — no budget, no money).
- **Per-venue build-piece cap ~150** (one tunable constant), counting wood
  and hardware bodies. Shown on the screen; an order that would exceed it
  refuses with a message. Cutting may transiently exceed the cap (a cut
  adds one piece); orders are the enforcement point.
- The pallet is a real body (`kind:'pallet'`): forkable, shows its load,
  self-clears ~5s after emptied (ruling D behavior kept).

## 4. Forklift (PR 2)

- Walk-behind pallet jack with a forklift silhouette. One per shed, parked
  by the roller door. VR only.
- Grab the handle and it follows (cart pattern: 1:1 chase, yaw easing,
  same wall predicates the player walks against). Thumbstick on the
  gripping hand runs the forks up/down.
- Forks under a pallet + raise = the pallet rides the forks. Lower onto
  the floor or a marked slot = released.
- **Pallet slots:** painted rectangles, 4 per shed, 2 per stage wing
  (per stage). Snap on release, same 0.4 snap feel as #37.
- Range: anywhere the player can walk — shed → dock → stage. Venue-level
  parent like the carts (never room-culled while in front of you).

## 5. Toolbelt, nail gun, hammer, assemblies (PR 3 — the core)

- **Belt always on in VR:** nail gun right hip, hammer left hip, tape
  measure front. Reach to the slot and squeeze to draw; release ANYWHERE
  returns the tool to the belt. Tools can never be lost, dropped, or left
  on a stage.
- **Tape measure:** grab the tab and pull; a line stretches and reads
  feet-and-inches live. Releasing the tab retracts it. It can leave a
  pencil tick on a wood face (one per piece, latest wins) that the saw
  fences snap to first (§6).
- **Nailing:** hold a piece against another; it ghost-snaps when close —
  flush faces, 90°/45° angle snap. Shoot the nail gun at the overlap →
  a visible nail head at the hit point, joint recorded. RULING G decides
  the constraint (1 = pivot, 2+ = rigid).
- **Hammer:** a swing that contacts a nail head pops THAT nail (it
  vanishes; no loose-nail litter). A piece with no nails left demotes to
  a loose body and settles.
- **Nail to the world:** the deck accepts nails (a stage screw — fixes
  the assembly to the stage; parks with it). A fly pipe accepts nails —
  the assembly hangs and flies with the lineset, respecting `minTrimOf`
  (nothing hung goes below the deck, #15's rule). Nothing else accepts
  nails (walls, seats, desks refuse).
- Carrying: any piece or assembly is carried kinematically like a body;
  no weight limit in v1 (the cap in §3 bounds worst-case size).
- **Crew never touch player-built work** (a `userData` flag they check);
  LOAD IN / LOAD OUT of the four productions leaves it alone.

## 6. Saws (PR 4)

- One **cut station per shed**: a track-saw table for sheets, a chop-saw
  bench for lumber. Fixed stations — saws do not ride the belt.
- Seat a piece by releasing it over the table/bench (snap-flat, `seated`).
- Grab the track (sheets) or slide the piece against the fence (lumber);
  a laser line + live feet-and-inches readout shows the cut, snapping to
  **1 inch**, with any pencil tick on the piece snapping FIRST.
- Squeeze the saw trigger → cut (sound + brief animation) → the seated
  body is replaced by two, both usable, paint preserved per face/piece.
- Chop saw is 90° crosscut only in v1 (miters are a later ask).
- **Offcuts under 6 inches** drop into the station's scrap bucket and
  vanish; they never enter the registry or count against the cap.

## 7. Paint (PR 5) and hinges & track (PR 6)

- **Paint rack per shed:** open cans in the fixed palette plus one roller.
  Ordering paint adds cans/colors to the rack. Dip the roller, then roll
  a piece: **sheets take color per FACE, lumber whole-piece.** Cans never
  run out; repaint freely. Materials come from a shared cache keyed by
  color (never one material per piece — the LENSM lesson).
- **Hinge:** hold it against the seam between two pieces, one nail-gun
  shot installs it → the joint becomes a revolute with stops (~180°
  swing); push the piece to swing it. Hammer on the hinge removes it.
- **Track:** nail 4ft sections to the deck in a line (they align
  end-to-end); clip a carriage onto the track; nail a piece to the
  carriage → it slides end-to-end when pushed, hard stops at the ends.

## 8. Save system (PR 7)

- **localStorage**, versioned (a version byte; unknown versions are
  discarded wholesale, never partially parsed), keyed per venue.
- Saved: every wood/hardware body (SKU, dims, position, paint), every
  nail/hinge/carriage and its constraint, assemblies, pallets and their
  manifests, pending orders with time remaining, forklift pose.
- NOT saved (deliberately, say it in the UI docs too): shows, cues, fly
  positions, lantern patch — that is a different feature.
- Save after every build action (order, cut, nail, pop, paint, install)
  plus a dirty-flag timer; load on boot before p2k parks the stages.
- A **CLEAR SAVED BUILD** button on the supply screen wipes the save —
  a corrupt or stale save must never brick the game (load is wrapped;
  any throw falls back to empty and says so on the screen).

## 9. PR split, testing, invariants

**Seven PRs, in dependency order, one concern each, straight to `main`,
never stacked** (each opened only after the previous merges — the
#37→#38 rebase-retest-open pattern):

1. Ordering expansion (SKUs, multi-pallet, cap; pallet as body)
2. Forklift
3. Toolbelt + nail gun + hammer + assemblies
4. Saws
5. Paint
6. Hinges + track
7. Save system

Built SOLO and sequentially (owner's token-economy ruling this session):
no parallel agents — the PRs all touch p9/p4/p2m and are a dependency
chain; parallelism buys conflicts here, not speed.

**Testing:** new 15th suite `tests/build.js` (grows with each PR);
`orders.js` extends for §3; probes for the stations and the pallet slots
(`tools/`). Every new assertion negative-checked against the pre-change
build. Suites green before and after every PR. What only the headset can
verify goes on the HANDOFF step-zero list (grab feel, saw readability,
roller feel, forklift comfort, meter numbers under a big build).

**Invariants (all standing ones hold, plus):**
- A cut never mints geometry; all wood shares per-profile cached boxes.
- Everything the player builds is raycastable and standable.
- Build state lives in `BODIES`/`ASSEMBLIES` (venue-level) — never on
  meshes alone — or it cannot save.
- The piece cap is enforced at the order screen and shown there.
- VR-only tools live behind the session gate; the desktop is untouched
  except the supply-screen additions.

**Out of scope for v1 (recorded so they are decisions, not surprises):**
furniture catalogue (phase 2), desktop tool parity, miter cuts, multiple
lumber lengths, sheet thicknesses, paint quantities/money, per-stroke
texture painting, physics toppling, crew interaction with built sets,
saving anything outside the build system.
