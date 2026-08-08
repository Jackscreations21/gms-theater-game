# The build system — PRs 1–7 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, solo —
> the owner's token ruling; no parallel agents, the PRs are a dependency chain on the same
> files). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Land the approved build-system spec
(`docs/superpowers/specs/2026-08-07-build-system-design.md`): order wood → forklift →
nail/hammer assemblies → saws → paint → hinges & track → save system.

**Architecture (spec §1):** everything extends the #37 detach system. New src part
**`p4c.txt` — THE BUILD SYSTEM** holds wood profiles, `ASSEMBLIES`, nails/joints, saw
stations, paint, hinge/track and save; inserted in `build.sh` directly after `p4`
(it reads `BODIES`/`regBody`/`slotBody`, and `p2m`/`p9` read it — hoisting covers
call-before-parse as usual). Ordering changes live in `p2m`, grabs in `p9`.

**Plan altitude:** this file follows the repo's plan precedent
(`2026-08-07-detach-ordering-prs5-6.md`) — exact anchors, data shapes, signatures, test
lists — not full code listings (owner's token-efficiency ruling, this session). All line
numbers verified on `main` = `fde77e3`.

**Ground rules (unchanged):** `sh build.sh` before every test run; suites end
`--- failures: 0 ---`; every new assertion negative-checked; commits via `-F` file
(PS 5.1); PRs via GitHub API, straight to `main`, owner merges; **each PR opens only
after the previous merges** (build the next on the last's branch meanwhile — the
#37→#38 rebase-retest-open pattern). Never `git add -A` (agent worktrees). New tests go
in a new 15th suite `tests/build.js` (created in PR 1, grows every PR); orders.js gets
only the multi-pallet/cap diffs.

**Branches, in order:** `build-ordering` (PR 1, already carries spec+plan), `build-forklift`
(PR 2), `build-tools` (PR 3), `build-saws` (PR 4), `build-paint` (PR 5), `build-hinges`
(PR 6), `build-save` (PR 7).

---

## Section 0 — shared shapes (decided; every PR conforms)

### Wood bodies (PR 1 creates them)

`BODIES` records grow optional fields — only wood/hardware carry them:

```js
// {kind:'wood', prof:'sheet'|'s2x4'|'s4x4'|'s2x8', dims:{L,W}, paint:[c0..c5], ...}
// {kind:'hinge'|'track'|'carriage'|'paint', color:<paint only>, ...}
```

- Lumber profiles (real inches → metres): s2x4 0.038×0.089, s4x4 0.089×0.089,
  s2x8 0.038×0.184; `dims.L` = length (8ft = 2.438 at birth). Sheet: 0.019 thick,
  `dims.L`×`dims.W` (2.438×1.219 at birth).
- **One cached unit BoxGeometry per profile** (`WOODG`, p4c), scaled per piece —
  a cut NEVER mints geometry (spec invariant). Box geometry's native 6 material
  groups carry paint: `mesh.material` = array of 6 entries from a shared
  color-keyed material cache `WOODM` (the LENSM lesson — never one material per
  piece). Unpainted = shared bare-ply / pine entries. Lumber paints whole-piece
  (all 6 entries set); sheets per-face.
- Local axes: lumber long axis = local Y (the §5 trap, embrace it); sheet:
  L along local X, W along local Y, thickness Z.
- `BODY_LABEL` additions (p4:248): sheet '4×8 SHEET', s2x4 '2×4', s4x4 '4×4',
  s2x8 '2×8', hinge 'HINGE', track 'TRACK 4FT', carriage 'CARRIAGE',
  paint 'PAINT CAN'.
- Wood/hardware pass through the existing grab machinery untouched: `grabBody`,
  kinematic hold, `updateBodies` settle. `canHang` (p4:288) must REFUSE
  build kinds on lantern/speaker points: add
  `if(BUILD_KINDS[b.kind]) return false;` (they snap to assemblies, not patch points).

### Assemblies (PR 3 creates them)

```js
var ASSEMBLIES = [];  // venue-level, like BODIES
// {id, venue, root:Group, pieces:[body...], nails:[{a,b, p:Vector3(local-to-root),
//   axis:Vector3, mesh}], anchor:null|{type:'deck'}|{type:'pipe', stage, lsId},
//   joints:[{piece, kind:'rev'|'slide', ...}]}   // joints arrive in PR 6
```

- Root Group sits at `venueRoot(venue)` (p4:266) — never in a room or stage group;
  piece meshes `root.attach()`ed. Carried assemblies = held kind `'asm'`, kinematic
  follow of the whole root (the body discipline, so `vrOnEnd` cold-drops stay safe).
- **RULING G:** per piece, count nails joining it to the rest. ≥2 → rigid (mesh a
  plain child of root). Exactly 1 → the mesh is a child of a pivot Group at the nail
  point; grabbing that piece drives rotation about the nail axis (held kind
  `'swing'`), release leaves it. 0 → `detachPiece`: body demotes to loose, removed
  from `pieces`; an assembly of 1 piece dissolves back to a plain body.
- `anchor.type==='deck'`: root stays at venue root (rooms already separate the three
  stages physically — the cart precedent; no p2k work needed). `type==='pipe'`:
  root attaches to the lineset's goods group so it flies; `minTrimOf` (p3) must see
  the assembly's height below the pipe — extend the goods-extent scan by the
  assembly bounding box, same clamp path as #15.
- Nail mesh: one tiny cached cylinder+head geometry, shared material, one mesh per
  nail (they are the hammer's hit targets; a 30-nail flat = 30 tiny meshes, cheap).

### Grab arbitration (never fork it — p9:1431 comment holds)

vrSqueeze's nearest-wins grows per PR, one candidate class each: PR 2 forklift
handle (segment test like carts, p9:1388–1409, radius 0.30); PR 3 belt tools
(0.22), nails don't grab (hammer hits them); PR 4 saw handles/fences (0.25);
PR 5 roller (0.22); PR 6 swing/slide pieces (piece mesh distance 0.35 → kind
`'swing'`). Assemblies grab by any rigid piece (0.35) → kind `'asm'`.
Priority stays strictly nearest-wins across ALL classes.

### The cap (PR 1)

`BUILD_CAP = 150` per venue: `venueBuildCount(v)` = BODIES where
`venue===v && BUILD_KINDS[kind]`. Orders refuse over cap; cutting may transiently
exceed by 1 (enforcement is the order screen alone — spec §3). Gear keeps its own
`STOCK_CAP = 24` path (p2m:274–280) untouched.

---

## Section 1 — PR 1: ordering expansion (branch `build-ordering`)

**Files:** `src/p4.txt` (labels, canHang guard), new `src/p4c.txt` (profiles, caches,
`makeWoodMesh`, BUILD_KINDS, BUILD_CAP), `src/p2m.txt` (multi-order, manifest pallets),
`src/p9.txt` (tabbed order screen), `build.sh` (+p4c line after p4), `tests/build.js`
(new, 15th), `tests/orders.js` (diffs), `tests/run-all.js` (+1 line), rebuild.

### Task 1.1 — wood kinds and meshes (p4c)
- [ ] `WOODG` (4 unit geometries), `WOODM` cache (`woodMat(color)`), `BUILD_KINDS`,
      `makeWoodMesh(prof, dims)` (scaled cached box, material array, castShadow,
      `userData.moves`), `makeBuildMesh(kind)` for hinge/track/carriage/paint-can
      (small cached geometries); `regWood(prof, dims)` → regBody with extra fields.
      Hook `makeBodyMesh` (p4:250) to route build kinds; `canHang` guard (§0).
- [ ] Tests (build.js, banner `--- the stock ---`): two 2x4s share one geometry
      object; an 8ft 2x4 is 2.438 long in world; sheet is 6 material slots; a PA
      point refuses a plank (`canHang` false); negative-check the canHang guard.

### Task 1.2 — orders: multiple pallets, manifests (p2m)
- [ ] `ORDERS[v]` → `{pending:[], pallets:[]}`; `ORDER_PENDING_MAX = 3` (ruling D');
      `orderPlace` takes `items` as `[{kind, prof?, n}]`, flattens ≤ `ORDER_MAX = 12`
      units, checks BUILD_CAP for build kinds and STOCK_CAP for gear, pushes to
      `pending` (each with its own `t`). `spawnPallet(which, items)` lays anchors
      FROM the manifest: sheets flat-stack center (dy 0.022), lumber two columns
      (dy per profile), gear the old 6 seats; pallets place at the apron with
      +1.9m x-offsets per live pallet (3 fit). Self-clear-when-empty logic moves
      per-pallet. `updateOrders` iterates arrays.
- [ ] Tests (orders.js diffs, same banners): three orders pend at once, a 4th
      refuses; a 12-sheet order delivers 12 slotted sheet bodies on one pallet;
      BUILD_CAP refusal string 'PIECES FULL'; the old gear path still delivers.
      build.js: pallet anchor stacking (12 sheets → 12 anchors, top one ~0.42+
      11×0.022). Negative-check multi-pending against the old one-slot ORDERS.

### Task 1.3 — the tabbed screen (p9:761–, vrDrawOrder p9:769)
- [ ] Tab strip GEAR | WOOD | HDWE | PAINT on the 560×520 canvas; `sc.tab`,
      hits rebuilt per draw (rows: wood 4, hdwe 3, paint one row per rack color —
      PR 5 fills the rack, until then the 10 palette colors order as cans);
      footer fixed: PIECES n/150, ORDER, status (pending count + soonest t).
      `vrSelect` branch (p9:1180) unchanged — hits carry their own handlers.
- [ ] Tests (build.js `--- the screen ---`): tab press switches row set (state,
      not canvas); +/ORDER on WOOD tab yields a pending wood manifest; PIECES
      count drawn from `venueBuildCount`. vr.js idiom only if the existing
      order-screen ray test breaks (don't duplicate it).

### Task 1.4 — ship PR 1
- [ ] `build.sh` line; run-all 15 suites comment; rebuild; `npm test` 15/15;
      negative-check log in the PR body; HANDOFF (§done + headset: does the
      tabbed screen read at arm's length; do stacked pallets read as lumber
      stock). Commit via `-F`, push, open PR via API:
      "Ordering knows wood: SKUs, manifests, three pallets to a shed".

## Section 2 — PR 2: the forklift (branch `build-forklift`)

**Files:** `src/p2m.txt` (build + move), `src/p9.txt` (grab/hold/sticks),
`src/p2b.txt`/`src/p2j.txt` only if slot rectangles need wing anchors, tests.

### Task 2.1 — the jack (p2m, the cart pattern verbatim)
- [ ] `LIFTS = {palace, arc}`; `buildLift(venue, parent, x, z)`: silhouette
      (body box, mast, two forks 1.1 long at spread 0.55, steer handle at
      h 1.0), record `{venue, group, x, z, yaw, forkY:0, riding:null,
      handleH:1.0, handleZ:+0.5, handleHalf:0.3, grabR:0.30}`; `liftPose`
      (cartPose clone, p2m:87); `liftBlocked` = `cartBlocked` predicates with
      halfW 0.65; parked by each roller door. Pallet pick test in
      `updateLifts(dt)`: forks raised under a pallet's bearers (|dx|<0.6,
      |dz|<0.5, forkY crossing base+0.12) → `riding = pallet`, pallet group
      attaches to the fork carriage; lowering onto floor or a marked slot →
      release (`liftDrop`), slot-snap within 0.5.
- [ ] `PALLET_SLOTS` per venue: painted rectangles (thin plane, cached
      material), 4 per shed at the racking end, 2 per stage wing (palace
      wings x ±(stageW/2−1.5) z 2; arc equivalents in house coords);
      pallets remember `slot`.
### Task 2.2 — VR drive (p9)
- [ ] Handle segment in vrSqueeze (after carts, radius 0.30, nearest-wins);
      held kind `'lift'`: chase = the cart hold branch (p9:1493) with
      `liftMoveTo`; gripping hand's thumbstick Y (the existing axes read used
      by walk — gate on hand) drives `forkY` 0→1.2 at 0.5 m/s; release leaves
      it standing. Label while held: 'FORKLIFT — stick raises the forks'.
- [ ] Tests (build.js `--- the forklift ---`): handle grab within 0.3 beats a
      body at 0.34; blocked by shed wall exactly like the cart test idiom;
      forks under a delivered pallet + raise → pallet rides (world y up),
      pieces ride with it (slotted anchors are pallet children — free);
      lower over a stage slot → pallet released, snapped, still holding its
      bodies; session end mid-drive leaves the lift standing (no reference).
      Negative-checks; 15/15; HANDOFF (headset: fork feel, doorway comfort);
      ship "The forklift: a walk-behind jack, pallets ride the forks".

## Section 3 — PR 3: toolbelt, nail gun, hammer, assemblies (branch `build-tools`)

**Files:** `src/p9.txt` (belt, tools, snap ghost, swing holds), `src/p4c.txt`
(ASSEMBLIES, nails, joint math), `src/p3.txt` (minTrimOf extension), tests.

### Task 3.1 — the belt (p9)
- [ ] `vrBuildBelt()` on session start: three holster anchors on a belt group
      that follows the rig (position = headset x/z at hip 0.95, yaw = head yaw,
      lerped); tool meshes (cached): nail gun R hip, hammer L hip, tape front.
      Draw: squeeze within 0.22 → kind `'tool', tool:'nailgun'|'hammer'|'tape'`,
      kinematic follow (grip pose + tool offset). ANY release → re-holster
      (never a loose tool body — spec). `vrOnEnd` holsters all.
- [ ] Tests (build.js `--- the belt ---`): belt follows a moved rig; draw beats
      a rope at equal distance? no — nearest wins, test the radius only;
      release anywhere re-holsters; session end holsters.

### Task 3.2 — nails and assemblies (p4c)
- [ ] `ASSEMBLIES` + shapes (§0). `addNail(bodyA, bodyB|anchorSpec, worldP,
      worldAxis)`: creates/merges assemblies (two plain bodies → new assembly;
      body+assembly → join; assembly+assembly → merge roots via attach);
      `removeNail(nail)`: recount, demote pivots, split? NO — splitting a
      graph is real work: v1 rule, an assembly stays one assembly until a
      PIECE hits 0 nails, then that piece alone detaches (`detachPiece`);
      document the quirk (two flats nailed by one plank into a U: pull the
      plank's nails and the flats stay one assembly — acceptable, recorded).
      `nailCountsFor(asm)` recomputes rigid/pivot parenting after every change.
      Deck anchor: `addNail(body, {deck:true}, ...)` on the live stage's deck;
      pipe anchor: nail fired at wood held against a pipe → attach root to the
      lineset goods group, extend `minTrimOf` goods scan (p3) by assembly
      bbox height.
- [ ] Tests (build.js `--- nails ---`): two studs + one nail → assembly of 2,
      the second stud pivots (rotate call moves its mesh, root still);
      second nail → rigid (pivot group gone); hammer-remove both → two loose
      bodies, assembly dissolved; deck-nailed assembly ignores updateBodies
      settle; pipe-nailed assembly flies with `flyTo` and clamps at the deck
      (minTrimOf — negative-check against unextended scan).

### Task 3.3 — gun, hammer, snap (p9)
- [ ] Held wood near other wood (< 0.25 face gap): pose-snap the HELD mesh —
      nearest 90°/45° yaw alignment + flush face contact via profile dims (no
      ghost clone; the held piece itself magnets, spec §5 'ghost-snaps');
      while snapped, trigger on held NAIL GUN in the other hand fires
      `addNail` at the contact midpoint, axis = face normal. Trigger with gun
      aimed at a snapped-against-deck bottom plate → deck nail; against pipe →
      pipe nail (reuse the rope-region test for which pipe). HAMMER: trigger
      swing test — hammer head within 0.15 of a nail mesh → `removeNail`.
      TAPE: second-hand grab of the tab stretches a line, live ft-in label
      (`vrLabel` feed); trigger while stretched across a piece → pencil tick
      stored `body.tick = {face, u}` (one per piece, latest wins — saw fences
      snap to it first, PR 4).
- [ ] Tests (build.js `--- the gun and the hammer ---`): full loop — hold a
      stud against a seated stud, gun fires, assembly exists, channel of
      nothing died (no fixture involvement); hammer pops it; tape tick
      round-trips (set, read, overwrite). Feet-inches formatter unit test
      (2.438 → 8'0"). Negative-checks; 15/15; HANDOFF (headset: snap feel,
      gun aim, hammer swing, belt reach); ship
      "The toolbelt: nail gun, hammer, tape — and wood that joins".

## Section 4 — PR 4: the saws (branch `build-saws`)

**Files:** `src/p4c.txt` (stations, cut logic), `src/p9.txt` (seat/fence/trigger),
`src/p2m.txt` (station placement calls per shed), tests.

- [ ] `SAWS` per shed: track table (2.9×1.6 top at y 0.9, rail across X with a
      sliding saw head) + chop bench (0.6×2.8, fence along X, drop-arm saw).
      Seat: releasing a held wood body over a station (top face overlap) →
      state `'seated'`, mesh attaches to table, sheets flat / lumber against
      the fence. Fence/head grab (0.25) slides the cut line along the piece;
      readout sprite: ft-in from the piece's near edge, **snap 1 inch, tick
      first** (|cut−tick| < 0.04 → tick). Saw trigger → `cutBody(b, at)`:
      resize `b` (scale + recentre), `regWood` the offcut, both re-seated
      side by side; paint array copies to both; a side < 6in (0.152) is
      discarded (toast 'scrap'); track saw cuts sheets (across either axis —
      whichever the piece was seated in) and lumber; chop saw lumber only,
      90° only.
- [ ] Tests (build.js `--- the saws ---`): seat a sheet, set 24in, cut → two
      sheets 24in and 72in wide, SAME geometry object, paint preserved;
      5in offcut vanishes (registry count +0); a tick at 13in beats a fence
      at 13.4; chop a 2x4 at 3ft → 3ft + 5ft studs; cutting at the cap still
      works (transient rule). Negative-checks; 15/15; HANDOFF (headset:
      readout legibility, fence feel); ship "The saws: a track table and a
      chop bench in every shed".

## Section 5 — PR 5: paint (branch `build-paint`)

**Files:** `src/p4c.txt` (rack, palette, apply), `src/p9.txt` (roller, dip,
stroke), `src/p2m.txt` (rack placement), tests.

- [ ] `PAINT_COLORS` (10 scenic: black, white, greys ×2, red, blue, green,
      brown, cream, gold); rack per shed: shelf + can meshes per available
      color (`RACKS[v].colors`, starts with 4 stock; ordered cans arrive as
      pallet bodies, releasing a can over the rack adds its color and consumes
      the body); one roller per rack (grab 0.22, kind `'tool'` roller —
      it re-racks on release like belt tools). Dip: roller within 0.15 of an
      open can → carries that color (roller head tints). Apply: trigger while
      roller touches a wood piece → sheet: the touched FACE's material slot
      swaps to `woodMat(color)`; lumber: all slots. Materials only ever from
      the WOODM cache.
- [ ] Tests (build.js `--- paint ---`): dip then touch face 2 of a sheet →
      slot 2 is the cached red material (SAME object as another red face
      elsewhere); lumber paints whole; repaint swaps; a delivered can released
      over the rack adds a color and the body count drops; cut carries paint
      (already asserted PR 4 — extend to painted-face split across the cut
      line). Negative-checks; 15/15; HANDOFF (headset: roller reach, face
      accuracy); ship "Paint: a rack of scenic colors and one roller per shed".

## Section 6 — PR 6: hinges & track (branch `build-hinges`)

**Files:** `src/p4c.txt` (joints), `src/p9.txt` (install + swing/slide holds), tests.

- [ ] HINGE install: held hinge body within 0.2 of a seam (two pieces of one
      or two assemblies, near-parallel faces) + gun trigger → consume the
      hinge body into a joint `{kind:'rev', piece, axisLine, range:±π/2 each
      way from closed, hingeMesh}`; the piece re-parents to a pivot group on
      the axis (the 1-nail machinery, fixed axis). TRACK: track bodies gun-
      nail to the deck (chain end-to-end when released within 0.3 of a laid
      section's end — they align); carriage released onto track → rides it
      (`{kind:'slide', t}`); wood gun-nailed to a carriage joins its assembly
      with a slide joint spanning the CONNECTED track run.
- [ ] Swing/slide holds (p9): squeezing a jointed piece → kind `'swing'`:
      revolute — project the hand onto the arc, drive angle within range;
      slide — project onto the track line, drive `t` with hard stops.
      Release leaves it (no momentum v1). Hammer on a hinge/carriage nail
      undoes it (hinge body respawns loose).
- [ ] Tests (build.js `--- hinges and track ---`): install swings a door
      panel 90° and stops at range; hammer returns the hinge body; three
      chained track sections give one slide span (carriage t crosses a
      section boundary); slide hard-stops at the run ends; a swung/slid
      piece stays put on release. Negative-checks; 15/15; HANDOFF (headset:
      swing feel, track push); ship "Hinges that swing, track that slides".

## Section 7 — PR 7: the save system (branch `build-save`)

**Files:** `src/p4c.txt` (serialize/load), `src/p9.txt` (CLEAR button row),
`src/p7.txt` (boot call + dirty timer), tests.

- [ ] `BUILD_SAVE_VER = 1`, key `'house.build'`. `buildSerialize()` → JSON:
      wood/hardware/paint bodies (kind, prof, dims, paint, state, world pose,
      slot address {pallet i / rack / cart / shed slot index}), assemblies
      (piece indices, nails as local p+axis, joints, anchor {deck | stage+lsId}),
      pallets (+manifest positions), pending orders (+t), lifts (pose, forkY),
      rack colors. `buildSave()` writes; called from every mutating op (order,
      deliver, cut, nail, pop, paint, install, lift drop) via a `buildDirty()`
      debounce (write at most 1/s on the p7 frame clock — game time).
      `buildLoad()`: called once from p7 boot tail (after buildRooms and
      buildArc exist — venue roots ready); whole thing in try/catch, version
      gate, any throw → `localStorage.removeItem` + toast; reconstructs
      bodies via the PR 1 builders, assemblies via addNail replay (order:
      bodies → assemblies → anchors → pallets → lifts).
- [ ] CLEAR SAVED BUILD button on the order-screen footer (all tabs) —
      wipes the key and toasts; does NOT clear the live scene (documented:
      it clears what the next reload sees).
- [ ] Tests (build.js `--- the save ---`, jsdom has localStorage): build a
      two-stud assembly with one pivot + a painted cut sheet on a stage slot
      pallet; serialize; fresh boot in the same harness (the real.js idiom) +
      load → counts, dims, paint slot identity (cache re-keyed), pivot still
      pivots, pallet slotted; corrupt JSON in the key → boots clean, key
      gone; version 0 payload → discarded wholesale. Negative-checks; 15/15.
- [ ] HANDOFF: full feature recap, headset list (everything deferred across
      PRs 1–6 plus: does a reloaded build read identical), remaining knobs.
      Ship "The save system: what you build survives the reload".

---

## Section 8 — self-review record & landing order

**Spec coverage:** §2 stock → 1.1; §3 ordering → 1.2/1.3; §4 forklift+slots → 2;
§5 belt/nails/assemblies/deck/pipe/crew-flag → 3 (crew keep-off is free:
crew job scan touches SHOW scenery lists, never BODIES/ASSEMBLIES — verify with
one build.js assertion in 3.2, crewForgetLoads untouched by a standing assembly);
§6 saws/offcuts/ticks → 4; §7 paint+hinges+track → 5/6; §8 save → 7; §9 caps/
invariants → 0/1.2; RULINGS F–J honoured (F: everything behind the session gate;
G: 3.2; H: 2; I: 7; J: no furniture task exists).

**Landing order is strict:** each branch forks from the previous one until it
merges, then rebases onto `main`, retests, opens. If a session ends with a PR
unmerged, hand off the next branch built-and-ready (the #38 pattern). HANDOFF
updates ride whichever branch ships the change they describe.
