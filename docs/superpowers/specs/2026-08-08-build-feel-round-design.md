# The build-feel round — design

**Date:** 2026-08-08
**Source:** the owner's second headset bug list, verbatim asks:

1. "Make it so you can place nails anywhere on wood and if it detects its
   touching 2 pieces of wood it will hold it together."
2. "Make it so the wood orientates to the nearest 45 degree angle in every
   direction unless you hold x then it can be in any direction unless it
   finds a wood connection."
3. "Make it so if you press y when putting down a piece of wood it will
   stay in place wherever it is at whatever angle it is at."
4. "I can't figure out how to do the painting."
5. "Make it so the direction you move in is based on the direction your
   controller is facing instead of your oculus orientation."
6. "Add a delete all wood button and add a trash can that if you put wood
   in it will go away."
7. "I can't move the work table."
8. "Make it so the wood is actually in your hand instead of like a foot
   away from it."
9. "Make everything measure in feet and inches."

Nine asks, nine PRs, sequential, one concern each, failing-test-first.
Rulings continue the letter sequence (spec history ends at K).

---

## Diagnoses first — the two straight bugs

**The work table will not move (ask 7).** The vrSqueeze body loop measures
hand-to-`getWorldPosition(mesh)` against 0.35 for every non-wood body.  The
table's mesh is a Group whose origin is its FEET — a point on the floor,
under the centre of a 1.6 × 0.8 top.  To grab the table you must put your
hand on the deck under the middle of it.  Nobody ever did.

**Wood rides a foot from the hand (ask 8).** The hold record stores a
WORLD-space centre offset at grab time (`offX/Y/Z`) and re-applies it every
frame; orientation follows the wrist about the piece's CENTRE (`relQ`).
Grab an 8ft stick by its end — which the surface grab of #48 exists to
allow — and the centre, 1.2m away, is what tracks your hand; turn your
wrist and the piece pivots about that centre, so the end you actually
grabbed sweeps away from your palm.  The offset is also world-axis fixed,
so smooth-turning the rig swings the piece around you.

---

## RULING L — nails go where the gun points

The trigger with no ghost offer standing casts the GUN'S RAY (muzzle,
forward, 1.2m) against the wood bodies of the venue.  The hit point on the
hit piece is where the nail drives.  If a SECOND piece touches the hit
piece at that spot — its box, grown by `SEAM_TOUCH`, contains the point —
the nail joins the two through the existing `addNail` (which already
handles every mix of loose and fixed, and already refuses two anchored
assemblies).  Nearest such piece wins if several touch.  The nail's axis
is the hit face's normal.

If nothing touches the hit piece there: refusal, toast "nothing behind it
to bite".  **No cosmetic nails** — a nail that joins nothing would need
its own save/joint/hammer bookkeeping and would quietly complicate
`asmJoints`; the refusal keeps the record honest.

The throttled TRIGGER TO NAIL label follows the same cast, so the label
and the shot can never disagree (the vrBodyTarget lesson).  The old
seam-seek (nearest touching pair within 0.45 of the muzzle, #49) remains
as the fallback when the ray misses everything — pointing in the general
direction of a lying-together pair still works, which is the case the
owner originally reported.

## RULING M — held wood squares to 45° unless X says otherwise

While wood is held with no snap offer standing, its orientation is the
wrist orientation QUANTIZED to the nearest 45° on all three axes (world
frame, YXZ order — the same decomposition snapQuantize uses).  Holding
**X** (left controller, lower button) suspends the quantize: free wrist
follow, exactly today's behaviour.  A standing wood-connection offer
(snapWood: joint, table top, deck, pipe) overrides both, as it does today.
The quantize pivots about the GRAB POINT (see RULING R), not the centre.

## RULING N — Y parks the piece exactly where it is

Pressing **Y** (left controller, upper button) while wood is in that or
either hand releases it FROZEN: exact position, exact angle, mid-air
included.  A frozen body never settles (updateBodies skips it), takes no
snap pose, and stays until a hand grabs it again (grab clears the flag) or
it is nailed, sawn, trashed or deleted.  Frozen wood is a legal snap
TARGET and a legal seam partner — you can build against a parked piece;
that is the point of parking it.  The flag rides the save (`fz:1`).

## RULING O — the left controller is the compass

Stick walking moves along the LEFT CONTROLLER'S pointing direction
projected onto the floor — point the controller right, push forward, walk
right.  The right stick still turns; the fork stick still lifts.  When the
controller's -Z is within ~14° of straight up or down (no usable floor
direction), fall back to the HEADSET's yaw.  Desktop keyboard movement is
untouched (Player.yaw, as ever).  FLYING stays gaze-directed — "push the
stick where you look" is its own documented contract (#13) and the owner's
ask names walking.

## RULING P — the trash can and the big red button

**The trash can:** a steel drum beside each shed's paint rack.  Releasing
a held BUILD body (wood, hinge, track section, carriage, paint can, work
table) with its centre over the drum destroys it — mesh out, registry out,
save dirty.  It outranks every other release snap: holding a thing over
the bin is the one unambiguous act of intent.  A carried ASSEMBLY refuses
the bin (toast: "hammer it apart first") — pieces go in one at a time,
which keeps the nail/hinge bookkeeping to machinery that already exists.

**DELETE ALL WOOD:** a red button on each order screen's footer, beside
CLEAR SAVE.  One press removes every WOOD body in that venue — loose,
frozen, slotted, seated on a saw, on a pallet, in an assembly, mounted on
a carriage.  Assembly wood dissolves through removeNail, so installed
hinges respawn as loose hardware, carriages pop back loose, and pure track
runs (no wood) stand untouched.  Hardware, gear and tables stay — the
button says WOOD and means it.  A piece in a live hand is skipped.  The
toast reports the count.  No confirm step (CLEAR SAVE has none either);
unlike CLEAR SAVE it acts on the room, so it is drawn in its own row with
clear air around it.

## RULING Q — the table is grabbed by its body

The work table joins the surface-grab class: hand within `GRAB_WOOD` of
its frame box (x ±0.8, y 0…0.925, z ±0.4, table-local) closes on it, from
any edge, leg or corner.  It carries in-hand (RULING R) and keeps its #51
release contract: lands upright, yaw squared to 45°.

## RULING R — held build stock rides IN the hand

For wood and the table, the hold record stores the mesh pose RELATIVE TO
THE CONTROLLER at grab time (position in grip space + relQ, replacing the
world offX/Y/Z).  Every frame the mesh pose is the controller's world pose
composed with that relative pose — the grabbed point stays in the palm,
wrist rotation pivots about the palm, and rig turns carry the piece
naturally.  RULING M's quantize slots in as a post-step on the same
composition: quantize the world quaternion, then re-place the position so
the grab point stays fixed.  Lanterns, PA boxes and compact hardware keep
today's fixed-orientation centre carry — their carry was tuned deliberately
(#37) and nobody complained.

## RULING S — feet and inches on the glass, metres in the bones

Every PLAYER-FACING length readout goes through `ftIn()` (p4c, already
feeds the tape and saws): the desktop fly-rail rows and their toasts, the
FOH BAR and SPK BAR rows on both boards, the VR fly page, and the show-FX
"bars in" line.  Order-screen labels already read in feet.  INTERNAL units
stay metric everywhere — `D`, trims, `ROPE`, the save format, every
constant.  This is a formatting pass, not a unit migration; a unit
migration would touch every invariant in the handoff for zero player
benefit.

## Painting discoverability (ask 4) — labels, not redesign

The mechanic (rack → roller → dip → trigger) matches how paint works in a
scene shop and stays.  What failed is that nothing in the room SAYS any of
it.  Three floating labels (the vrLabel pattern, throttled like the gun
label):

- an empty hand within reach of a rack's roller → "SQUEEZE TO TAKE THE
  ROLLER" riding the roller;
- roller in hand, no colour → "DIP THE HEAD IN A CAN" riding the nearest
  can;
- roller dipped, wood within painting reach → "TRIGGER TO PAINT".

The PAINT tab's idle status line becomes a one-line pointer: paint is
ordered in cans, cans stock the shed rack, the roller does the painting.

---

## What can go wrong, and the tests that catch it

Each PR ships its regression tests in `tests/vr.js` (hand/held mechanics,
labels, locomotion, screens) or `tests/build.js` (p4c logic, save), every
one verified to FAIL against the pre-change build.  Specific traps:

- **The carry rework must not break the ghost snap** — snapWood's pose
  override runs after the in-hand composition, unchanged.  Test: a snap
  offer still lands the piece flush.
- **Quantize must not fight the snap** (M): assert offer pose wins while
  an offer stands.
- **Freeze must survive the save round trip** (N) and must not settle
  after reload.
- **The ray nail must agree with its label** (L): the same cast feeds both.
- **Controller walk must leave the desktop alone** (O): the keyboard path
  asserts unchanged vectors with a session down.
- **DELETE ALL WOOD must leave a track run standing** and respawn an
  installed hinge as hardware (P) — both states exercised in one test
  build.
- **ftIn on the glass must not touch the save** (S): serialize before and
  after, byte-identical.

## Out of scope

Strokes-based painting, snap/comfort turn options, cosmetic decor nails,
a unit migration of the model, deleting non-wood stock in bulk, any
change to desktop keyboard controls.
