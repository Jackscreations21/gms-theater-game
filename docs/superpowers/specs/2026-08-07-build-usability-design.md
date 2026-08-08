# Build Usability — design

**Date:** 2026-08-07
**Status:** approved by the owner (this session), pending final spec review
**Feature:** the first headset run of the build system came back with four
asks, and the code confirms they are one story: the grab only worked at a
piece's centre, so the wood went on the ground; the snap never offered, so
the gun refused; and there was no good surface to build on anyway.

The four, in the owner's words: grab the wood from anywhere on the wood; a
table for building stuff on; wood auto-detects other wood and finds the best
connection point; the nail gun didn't work (two pieces were put together on
the ground and the gun was pointed at them — nothing happened).

---

## 0. Root causes (verified in code, this session)

- **Grab:** the body loop in `vrSqueeze` (p9, "loose gear" section) measures
  the hand to `b.mesh.getWorldPosition()` — the piece's CENTRE — against a
  0.35 radius. An 8ft stick (2.44m) is grabbable only across its middle
  ~0.7m; a 4x8 sheet only near its middle. The same loop is how assembled
  pieces are grabbed, so built walls have the same dead zones.
- **Snap:** `snapWood` (p4c) picks its target by CENTRE-to-centre distance
  (≤1.4m) and only offers once a face is within 0.14m of flush. Two 8ft
  sticks end-to-end have centres 2.44m apart — they can never see each
  other. And the flush axis is chosen with no regard for whether the faces
  actually overlap on the other two axes.
- **Gun:** `vrToolFire` fires ONLY into a standing `VR.snap` offer, which
  only exists while a piece is HELD. Two loose pieces touching on the deck
  are un-nailable by design — exactly what the owner tried first.

## 1. Owner rulings (this session)

- **RULING K — the work table is orderable and movable.** Not fixed shed
  furniture. It is a body: ordered at the supply screen, delivered on the
  pallet, carried by hand, stood anywhere.
- The table **never takes a nail** (design consequence, owner approved):
  you build ON it and carry the work off. Nailing DOWN still means the
  deck (or a pipe), through the existing held-offer flow.
- Both nailing flows coexist: the held-piece ghost + gun confirm stays;
  point-the-gun-at-a-seam is added.

Standing rulings that carry over: F (build is VR-only), G (one nail pivots,
two are rigid, the hammer is the only way apart), C-spirit (ordering is
free), BUILD_CAP 150, deck y = 0, parametric wood (a table is NOT wood and
mints its own small cached geometry, like the hinge/track bodies).

---

## 2. Grab anywhere on the wood (PR 1)

Distance to the SURFACE, not the centre. Wood meshes are the shared unit
box scaled, so the exact metric distance is cheap: take the hand into the
mesh's local space (which divides out the scale), clamp to the ±0.5 unit
box, and the per-axis overshoot times the scale is the true gap to the
nearest point on the piece.

- Applies to bodies of kind `wood` (loose, slotted, seated, AND pieces
  inside assemblies — it is the same loop). Other kinds (lanterns, cans,
  hinges…) are compact and keep the 0.35 centre test.
- New constant `GRAB_WOOD = 0.15` — hand within 15cm of the wood's
  surface. Sits with the other grab radii at the top of the p9 section
  (0.35 body, 0.32 rope, 0.30 cart, 0.28 saw, 0.22 tool/roller, 0.12
  lever); headset-tunable like all of them.
- Nearest-wins arbitration is unchanged in shape: the wood's surface
  distance simply IS its distance in the six-way comparison. Do not fork
  the arbitration (standing rule).
- Track sections (1.2m long, a Group not a scaled box) keep the centre
  test in this PR; noted as a follow-up if the headset complains.

Test (fails today): a hand 5cm off an 8ft 2x4's end face (≈1.27m from its
centre) squeezes — the piece must be held. Sheet corner likewise. And a
negative: 30cm off the end face must NOT grab.

## 3. Wood auto-finds the best connection (PR 2)

`snapWood` target selection and axis choice are rebuilt; the ghost preview,
the quantized orientation (`snapQuantize`), the flush maths (`snapHalf`),
and the gun-confirms contract are untouched.

- **Candidates by surface gap.** For each other wood body in the venue:
  held centre into target local space, per-axis gap beyond flush
  (`max(0, |p| − (target_half + held_half_projected))`), surface distance =
  the root of the three gaps' summed squares. Candidates within
  `SNAP_SEEK = 0.35`. This is what lets end-to-end pieces see each other.
- **Axis by real overlap.** A face is only a candidate joint if the OTHER
  two axes overlap (each within `SNAP_SLACK = 0.08` of overlapping). Among
  overlapping axes, the one nearest flush wins. No more snapping to a face
  the held piece isn't actually over.
- **Offer earlier.** Flush tolerance 0.14 → `SNAP_OFFER = 0.22`. The ghost
  appears while you are still roughly placing.
- **Best, not nearest-centre.** Among candidate targets, the smallest
  flush gap wins — the joint you are closest to actually making.
- Carriage (step 0), deck (step 2) and pipe (step 3) offers keep their
  current shapes and order; the tabletop offer slots in at §5.

Tests (fail today): two 8ft 2x4s butted end-to-end offer a snap on the
length axis; a stick laid across a sheet mid-span offers the face it is
over; a stick hovering beyond a sheet's edge (no cross-overlap) offers
nothing.

## 4. The nail gun works on a seam (PR 3)

`vrToolFire('nailgun')`, new branch where today the no-offer refusal sits.
Order of precedence, unchanged where it exists today: hinge in the other
hand → standing snap offer → **NEW: seam under the muzzle** → refusal.

- **Seam seek:** among the venue's wood bodies within 2m of the muzzle
  (cheap centre prefilter), test pairs: surface gap ≤ `SEAM_TOUCH = 0.05`
  (touching, including slight overlap). Contact point = midpoint of the
  overlap region on the contact plane, clamped to the seam; axis = the
  contact normal. Nearest seam to the muzzle within `SEAM_REACH = 0.45`
  wins; fire `addNail(a, {body:b}, point, axis)`. `addNail` already
  builds/merges assemblies from loose pieces and already refuses joining
  two anchored assemblies — no new rules.
- **Wood-to-wood only** in v1: no gun-at-seam deck anchoring (nailing
  down stays a held-offer act, deliberate). Pieces inside assemblies are
  fair game as the target side (that is how a third stick joins a frame
  on the ground).
- **The gun talks.** While a nail gun is in hand, a per-frame seek (same
  prefilter, few pairs) drives `vrLabel`: 'trigger to NAIL' floating at
  the seam when one is in reach, nothing otherwise. The blind-trigger
  toasts remain for the miss cases.
- Pull the trigger with a seam AND a snap offer standing? The snap offer
  wins (you are holding the piece — your hands describe the joint).

Tests (fail today): two touching 2x4s on the deck, muzzle at the seam,
fire → one assembly, one nail, correct axis; muzzle 60cm away → refusal
toast, no assembly; two pieces 20cm apart → refusal; label test — gun in
hand near a seam sets the label, away clears it.

## 5. The work table (PR 4 — last, it touches §3's function)

A new body kind `table` in `BUILD_KINDS` (counts toward BUILD_CAP,
`canHang` refuses it, save serializes it for free where the serializer
keys on build kinds — verify at plan time).

- **Catalog:** one new HDWE-tab row, WORK TABLE. Delivered on the pallet
  standing, one pallet seat. Ordering is free; the same three-orders-out
  and cap rules apply unchanged.
- **Geometry:** own small cached geometry (buildG pattern): a 1.6 × 0.8m
  top 0.05 thick at 0.90m, four legs. One shared geometry set, M.wood/
  M.steel materials; `userData.moves`.
- **Carry:** it is a body — grab (centre test, it is compact enough),
  carry kinematically, release: yaw quantized to 45°, pitch/roll squared
  upright, settles to the floor under it (`restH` 0). Never seats on
  saws, never slots in racks, never hangs.
- **The top is a raised deck.** Two hooks:
  - `updateBodies` settle: a loose body whose x/z falls inside a table's
    top rectangle (yaw-aware) and whose height is above it settles to
    `topY + restH` instead of the floor. Nearest table wins; walking the
    table out from under stock lets the stock settle to the floor —
    accepted, visible, honest.
  - `snapWood`: between the wood-target step and the deck step, a
    tabletop offer — held piece over a table, near its top: lie flat ON
    the top (`target:{table:body}`). The gun refuses it with its own
    toast ('the table holds it — no nail needed'); release simply rests
    the piece. `addNail` never sees a table target.
- Assemblies built on the top are unanchored and stay at the height they
  were built (assemblies do not settle — existing behavior); grab any
  piece and the work comes off whole, exactly as on the deck.

Tests: order/deliver a table; wood released above it rests on the top;
`snapWood` over it returns the table offer and the gun refuses to nail
it; wood released past its edge settles to the floor; a two-piece
assembly nailed on the top stays put and carries off whole.

## 6. Sequencing, invariants, testing discipline

PR order: **grab → snap → gun → table**, one concern per PR, straight to
`main`, no stacking; each next branch cut only after the previous merges
(the #37/#38 pattern — §3, §4 and §5 all edit `snapWood`'s neighborhood
or its callers).

**Owner scope ruling, same day:** ship §2 (grab) and §4 (gun-at-seam)
NOW, in that order; §3 (snap rebuild) and §5 (table) are DEFERRED until
asked for. The gun's seam seek never depended on the snap rebuild — it
has its own touch test — so the two shipping PRs are independent of the
two deferred ones.

Invariants honored: parametric wood (the table is not wood; its geometry
is cached once); nearest-wins arbitration extended, never forked; bodies
follow the grip kinematically, never re-parented (the table too); every
constant named at the top of its section; deck y = 0; VR-only (RULING F)
— desktop is untouched in all four PRs.

Testing: every behavior above gets a jsdom assertion in `tests/build.js`
(or `vr.js` where it is a hand/tool act), and every new assertion is
negative-checked against the pre-change build. Suites 15/15 before and
after each PR. What only the headset can answer (do the new tolerances
FEEL right) goes on the HANDOFF step-zero list with its constant named.

Out of scope, unchanged: furniture catalogue (phase 2, RULING J), track
grab-anywhere, gun-at-seam deck anchoring, any desktop build tools.
