# The build-feel round — implementation plan (PRs 1–9)

Spec: `docs/superpowers/specs/2026-08-08-build-feel-round-design.md`.
Ground rules as ever: failing test first, negative-check every new
assertion against the pre-change build, suites green before and after,
one concern per PR, straight to `main`, never stack — each branch is cut
AFTER its parent merges (rebase → rebuild → retest → open).  Sequential
on purpose: PRs 1–4 all rewrite the same vrSqueeze/vrUpdateHold lines.

Build: `sh build.sh` then `cd tests && npm test`.  PRs via the GitHub
API (no `gh`), commit messages via `-F` file, never `git add -A`.

---

## PR 1 — `feel-carry` — wood rides in the hand (RULING R)

**Files:** `src/p9.txt`, `tests/vr.js`.  Carries the spec + this plan.

- In vrSqueeze's wood grab: replace `offX/Y/Z`+centre `relQ` with a
  grip-relative pose: `relP = ctrl.worldToLocal(meshWorldPos)`, `relQ`
  as today.  Keep `offX/Y/Z` for every non-wood body (lantern carry
  unchanged).
- In vrUpdateHold's body branch: for holds carrying `relP`, compose
  `pos = ctrl.localToWorld(relP)`, `quat = ctrlQ · relQ`; then the
  existing snapWood override, unchanged.
- Tests: grab a plank at its end (hand near ±L/2), rotate the controller
  90°, assert the grabbed end stays within centimetres of the hand and
  the centre does NOT (fails today: centre-pivot).  Assert a snap offer
  still overrides the pose.

## PR 2 — `feel-table` — the work table moves (RULING Q)

**Files:** `src/p9.txt`, `tests/vr.js`.

- In the vrSqueeze body loop, give `kind === 'table'` its own distance:
  hand into table-group local space, clamp to the frame box
  (±0.8, 0…0.925, ±0.4), metric gap vs `GRAB_WOOD` (group scale is 1 —
  local IS metric).
- Grab takes `relP/relQ` like wood so it carries in-hand; the #51
  square-on-release contract stays (test pins it again).
- Tests: hand at a table edge (0.8m from origin) closes on it — fails
  today (0.35 centre test); carried table follows a moving controller;
  release still squares yaw to 45° and floors it.

## PR 3 — `feel-45` — 45° carry, X for free (RULING M)

**Files:** `src/p9.txt`, `tests/vr.js`.

- Read the left controller's buttons in vrReadSticks' pass (extend to
  buttons): `VR.btnX` = left b[4] held.  Guard `b[4] && b[4].pressed`.
- In vrUpdateHold's wood branch, after composing the wrist pose and
  BEFORE snapWood: if `!VR.btnX`, quantize the world quaternion to π/4
  on all three YXZ axes and re-place position about the grab point
  (`relP` fixed in the palm).  snapWood's offer still overrides.
- Tests: wrist at an odd angle → held wood world Euler lands on π/4
  multiples (fails today); with X pressed → matches the wrist exactly;
  with a snap target alongside → offer pose wins.

## PR 4 — `feel-freeze` — Y parks the piece (RULING N)

**Files:** `src/p9.txt`, `src/p4.txt` (updateBodies skip),
`src/p4c.txt` (save), `tests/vr.js`, `tests/build.js`.

- `VR.btnY` rising edge (left b[5]) while a held wood body exists →
  release frozen: `b.frozen = true`, hold record dropped, no snap, toast.
- `updateBodies`: `if(b.frozen) continue;` before the settle.
  `grabBody`: `delete b.frozen`.
- Save: `serBody` writes `fz:1`; `makeSerBody` restores.
- Tests: freeze mid-air → pose identical after 60 settle frames (fails
  today: it floors); regrab clears; save round trip keeps pose+flag;
  frozen piece still offers a snap to held wood.

## PR 5 — `feel-nail-ray` — nails go where the gun points (RULING L)

**Files:** `src/p4c.txt` (`nailRay(origin, dir)`), `src/p9.txt`
(gun head + label), `tests/build.js`, `tests/vr.js`.

- `nailRay`: raycast (THREE.Raycaster, 1.2m) against venue wood meshes;
  hit piece A at point P, face normal N; nearest OTHER wood B whose
  box + SEAM_TOUCH contains P (B-local test) → `{a:A, b:B, point:P,
  axis:N}`; none → `{miss:'bite'}`; no hit → null.
- vrToolFire gun head: no offer → try `nailRay` first, fall back to
  `seamSeek`; the "bite" miss gets its own toast.  vrGunLabel runs the
  same cast (ray first, seam fallback).
- Tests: two touching pairs, muzzle nearer pair 1 but RAY on pair 2 →
  the nail lands in pair 2 (fails today); ray onto a lone piece →
  refusal, no nail, no assembly; label and shot agree.

## PR 6 — `feel-compass` — controller-directed walking (RULING O)

**Files:** `src/p9.txt` (`vrMoveYaw()`), `src/p7.txt` (updatePlayer),
`tests/vr.js`.

- `vrMoveYaw()`: left controller -Z world, projected to xz; if its
  vertical component > ~0.97, fall back to the CAMERA's world yaw;
  no session/controller → null.
- updatePlayer: split the VR stick out of fx/fz for the WALK branch
  only — keyboard keeps Player.yaw; the stick vector rotates through
  `vrMoveYaw()`.  Flying and head-bob math keep the combined magnitude.
- Tests: controller yawed 90°, stick forward → motion along the
  controller's direction (fails today: rig yaw); desktop keys with no
  session → identical vectors to before; controller pointing straight
  down → headset-yaw fallback, no NaN.

## PR 7 — `feel-trash` — the drum and the big red button (RULING P)

**Files:** `src/p2m.txt` (drum geometry per shed), `src/p4c.txt`
(`TRASH`, `removeBody`, `deleteAllWood`), `src/p9.txt` (release check +
screen button), `tests/build.js`, `tests/vr.js`.

- Drum beside each rack; `TRASH[venue] = {group, r}`.
- `removeBody(b)`: unfile from station/slot/asm (nails via removeNail —
  hinges respawn, carriage mounts pop), mesh out, BODIES splice,
  buildDirty.
- vrSqueeze release: trash check FIRST, before ride/rack/seat/target.
  Held assemblies never trash.
- Order screen: DELETE ALL WOOD row (own row, red) → `deleteAllWood(v)`
  skips held wood, toasts the count.
- Tests: release wood over the drum → gone (fails today); delete-all on
  a venue with loose+frozen+seated+assembled wood + an installed hinge +
  a bare track run → wood gone, hinge respawned loose, track standing,
  gear untouched; save round-trips the emptier world.

## PR 8 — `feel-paint-signs` — painting says how it works

**Files:** `src/p9.txt`, `tests/vr.js`.

- Throttled label pass (piggyback the 0.12s gun-label clock): empty
  hand near a rack roller → "SQUEEZE TO TAKE THE ROLLER"; roller dry →
  "DIP THE HEAD IN A CAN" at the nearest can; dipped + wood in reach →
  "TRIGGER TO PAINT".
- PAINT tab idle status line → the one-line pointer.
- Tests: drive a hand to the rack → VR.labelTxt says the squeeze line
  (fails today); with the roller held dry → the dip line; PAINT tab
  status text present.

## PR 9 — `feel-ftin` — feet and inches on the glass (RULING S)

**Files:** `src/p6.txt`, `src/p7.txt`, `src/p9.txt`, `tests/full14.js`
or `tests/vr.js`.

- `ftIn()` (hoisted from p4c) replaces the metre readouts: p6 fly rows
  + FOH/SPK rows, p7 fly toast + "bars in", p9 fly page + FOH/SPK.
- Tests: desktop fly row text matches /'\d+"/ and not /m$/ (fails
  today); a save serialize before/after the change is byte-identical
  (formatting only).

## Headset questions this round leaves open (for HANDOFF)

Does 45° carry read as helpful or sticky (π/4 on all axes is opinionated);
is X-to-free discoverable; does Y-freeze in mid-air read as a feature or
a glitch; does controller-compass walking fight the fork stick habit;
is the drum obvious; is DELETE ALL WOOD too easy to press; do the ft-in
fly rows read at arm's length.
