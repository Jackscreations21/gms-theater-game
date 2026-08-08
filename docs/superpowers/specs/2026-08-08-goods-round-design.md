# The goods round — design

**Date:** 2026-08-08 (after the build-feel round landed, #53–#62)
**Source:** two owner asks, verbatim:

1. "Make it so i can paint curtains."
2. "Add a way in vr to change what is on each flyrail (like if it has a
   curtain or wing or border)."

Two PRs, sequential (both touch p9), failing-test-first as ever.
Rulings continue the sequence (spec history ends at S).

---

## The trap this round is built around

`M.serge` and `M.velour` (p2) are **one material object each**, shared by
every drape that uses them: the border, both full legs, both half legs and
the house curtain — on ALL THREE stages — plus Arc dressing (p2j) and the
Cornley velvet (p5g).  Setting `.color` on one to paint a curtain would
repaint every masking drape in both buildings at once.

This is the `LENSM` / `WOODM` lesson for the third time, so it gets the
same answer: a **cache of painted clones**, never a mutation, never a
material per lineset.

## RULING T — the roller paints goods, and paints them whole

The paint roller (build spec §7) already paints wood: sheets take the
touched face, lumber goes whole-piece.  Goods extend that as **whole
piece**: a trigger pull against any cloth on a lineset colours every cloth
on THAT lineset — both halves of a house curtain, both legs of a pair.
A curtain is not a sheet of ply with distinct faces, and painting one leg
of a pair is not a thing anyone wants.

- The material comes from `GOODSM`, keyed by the ORIGINAL base material
  plus the colour, so repaint is a pointer swap and two linesets painted
  the same colour share one material.  A painted clone remembers its base
  (`userData.goodsBase`), so repainting never chains clone-of-clone.
- Only lit materials take paint (`isMeshStandardMaterial`): the
  chandelier's self-lit bulbs and its PointLight are equipment, not cloth,
  and stay as they are.
- Reach is measured to the goods' BOUNDING BOX, not its centre — a
  13-metre house curtain has its centre five metres up in the air, and a
  centre test would be the 8ft-stick bug all over again.
- Wood keeps priority: if a plank is under the roller, the plank is what
  gets painted.  Only when no wood is in reach does the roller look for
  cloth.
- The PR 8 paint labels learn goods too, so TRIGGER TO PAINT appears at a
  curtain and the sign never lies about what the trigger will do.

## RULING U — the VR fly page is where you change what is on a pipe

The desktop has had a goods palette since the beginning (`#goodsPal`, p6);
VR has never had one, so in a headset the hang was whatever the stage
booted with.  The VR fly page's **goods label becomes a button**: press it
and the console shows a picker for that lineset — every entry in `GOODS`
as a labelled button with its weight, plus its own BACK.  Pressing one
calls the same `hangGoods` the desktop palette calls, then returns to the
fly page.

**Hanging rebuilds the rail.**  `vrBuildRopes` builds an operating line
for every lineset that carries goods, so without a rebuild a newly hung
pipe would have no rope and no lock at the rail, and a stripped one would
keep a rope to nowhere.  The picker calls it.  (It is the same call a
stage walk makes, and it ties off any held rope safely.)

## RULING V — a pipe lifts to make room for what you just hung

`minTrimOf` (#15) stops a pipe when what hangs on it kisses the deck — but
it is enforced by the things that MOVE a pipe, and hanging is not a move.
Hang a 13m house curtain on a pipe standing at 2m and the cloth goes
straight through the stage.

`hangGoods` now lifts a pipe that is below its new floor up to it (pos and
target together).  A pipe with room to spare is left exactly where it is.
This fixes the desktop palette too, where the same hole has always been.

## RULING W — the hang is not saved, and neither is its paint

The build save (spec §8) deliberately excludes shows, cues, fly positions
and the patch.  The hang belongs with those: what is on each pipe is the
rig, not the build.  So a painted curtain lasts the session, not the
reload — and it would be incoherent to save the paint without the hang it
sits on.

If the owner wants it to persist, that is its own small round: save the
hang (key per lineset per stage) and its paint together, in the same
versioned blob.  Called out here so it is a decision, not a surprise.

---

## The two PRs

**PR 1 — `goods-paint` (RULING T).**  `goodsMat`/`paintGoods`/`goodsAt` in
p4c beside the existing paint machinery; the p9 roller branch tries wood
first, then cloth; the paint labels learn goods.  Tests: build.js proves a
painted border does NOT tint `M.serge`, does not tint a second lineset
hung with the same goods, and that repainting reuses the cache; vr.js
drives the roller against a hung curtain end-to-end.

**PR 2 — `goods-vr-hang` (RULINGS U + V).**  `vrPageGoods` in p9 plus the
row hit; `hangGoods` gains the trim lift (p3).  Tests: vr.js presses the
row's goods cell, presses an entry, and asserts the lineset changed, the
page came back, and the rail carries a rope for it; build.js (or legs.js)
proves a low pipe lifts when tall goods are hung and an untouched pipe
does not move.

## Out of scope

Painting only one leg of a pair; per-face curtain painting; saving the
hang; a desktop UI change (it already has a palette); new goods types
(the catalogue is what it is — furniture is phase 2, RULING J).
