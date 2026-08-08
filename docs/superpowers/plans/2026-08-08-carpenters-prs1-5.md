# The carpenters — implementation plan (PRs 1–5)

Spec: `docs/superpowers/specs/2026-08-08-carpenters-design.md`
(RULINGS X, Y, Z, AA, AB, AC — binding).
Ground rules as ever: failing test first, negative-check every new
assertion against the pre-change build, suites green before and after,
one concern per PR, straight to `main`, never stack — each branch cut
AFTER its parent merges (rebase → rebuild → retest → open).  Sequential
on purpose: PRs 3–5 all touch p6b's assign switch, and 1 and 5 both
touch p9.

Build: `sh build.sh` then `cd tests && npm test`.  PRs via the GitHub
API (no `gh`), commit messages via `-F` file, never `git add -A`.

---

## PR 1 — `carp-mark` — the crayon marks the deck (RULING Z)

**Files:** `src/p9.txt`, `tests/vr.js`.  Carries the spec + this plan.

- `vrToolCrayon()` builder on the `toolG` cache; register
  `mk('crayon', vrToolCrayon, -0.12, 0.17)` beside the tape; add the
  toast ternary arm.  The generic holster/draw/squeeze loops need no
  edits (they iterate `VR.holsters`).
- `vrToolFire` branch `key === 'crayon'`: own `T.Raycaster` (far 12)
  from `_rayO` along the controller forward against `WALKABLE`; accept
  the first hit with `point.y < 0.3`; `stageAt(x,z)` null (foyer) or
  no hit → toast refusal, standing mark unmoved.
- `CARP.mark = {venue, stage, x, z, yaw}` world-space; marker plane in
  the `palletSlot` mould (y 0.02, `raycast=()=>{}`, `-ARC.X`
  correction, own colour).  Re-fire moves mark + plane.
- Tests: fire at the deck → mark at hit x/z, correct venue/stage; fire
  at a y≈8 gallery floor → refused, mark unmoved (fails today: no
  crayon); marker mesh never appears in a raycast; re-mark relocates.

## PR 2 — `carp-plan` — the catalogue and the planner (RULING Y + cap)

**Files:** new `src/p6c.txt` (carpenter data+logic; add to `build.sh`
between `p6b` and `p5c` — position is load-bearing, do not sort),
`tests/carp.js` (new suite, registered in `tests/run-all.js`).

- `CARP_CAT`: three rows (flat4x8, plat4x8, steps2), each
  `{label, stock:[{prof,n}], cuts:[{prof, at}], blueprint:{pieces:[
  {prof, len, pos, rot}], nails:[{i, j, p, ax}]}}` — poses local to
  the mark origin, two nails per joint (RULING G: rigid).
- `carpSurvey(venue)`: loose wood by prof (pallet-slotted or floor,
  not seated/fixed/held).  `carpPlan(key, mark)`: NEED list
  (`{short:[{prof,n}]}`) or the ordered job queue
  (fetch/cut/haul/nail + holds), plus `pieces_after` for the cap test:
  refuse when `venueBuildCount(v) + cuts > BUILD_CAP`.
- Pure functions — no crew, no VR, no mutation.  Tests drive them
  against a jsdom world with stocked and understocked sheds; cap
  refusal asserted at exactly 150.

## PR 3 — `carp-lead` — the lead and the saws (RULING AA + AC's cuts)

**Files:** `src/p6b.txt`, `src/p6c.txt`, `tests/carp.js`,
`tests/crew.js`.

- Seventh figure: `makeHand`-anatomy, apron/no-cap dress,
  `trade:'carpenter'`, appended to `CREW.people` lazily on first call;
  `crewAssign` show-kinds skip the lead; carp saw kinds pick only the
  lead.  Show census test in crew.js re-pinned (six hands work shows).
- `carpFetch`: lead walks to the surveyed piece, real-carry
  (`h.hands.attach`), walk to `SAWS[v][prof==='sheet'?'track':'chop']`,
  `seatWood`.  `carpCut`: `sawSetCut` per schedule (local-x convention
  from `tests/build.js:417-460`), work-wait off frame dt, `sawCut`;
  finished pieces set aside loose by the bench, usable off-cuts left.
- Tests: queue fetch+cut headlessly with fixed-dt `updateCrew` →
  the cut lands within a saw-snap inch, no geometry minted (shared
  `WOODG`), body count +1 per cut, carried mesh identity preserved.

## PR 4 — `carp-build` — the haul and the nails (RULINGS AB + AC)

**Files:** `src/p6b.txt`, `src/p6c.txt`, `tests/carp.js`.

- `carpHaul`: hand real-carries one piece bench → blueprint pose at
  the mark (mark yaw composed in), set-down
  `venueRoot(v).attach(mesh)`, state `'loose'`, `updateMatrixWorld`
  before any nail.  `carpNail`: work-wait, `addNail` ×2 per joint per
  blueprint; assembly forms by adoption/merge as nails land; **no deck
  nail** — the finished piece lies un-anchored at the mark.
- Stand-down: extend the crew stand-down path so a carpenter carrying
  real stock sets it down loose where they stand (the dummy-dispose
  path must never see a real body).
- Tests: full flat built headlessly at an `arcMain` mark called from
  the Arc shed → assembly world-x at the mark (wrong-deck kill), rigid
  (no pivot groups), grabbable (no anchor); stage-swap mid-haul →
  plank loose at the hand, body count unchanged; save round-trip in
  the second jsdom world → same pieces, nails, poses.

## PR 5 — `carp-screen` — the CARPENTERS screen (RULING X)

**Files:** `src/p9.txt`, `src/p6c.txt`, `tests/vr.js`, `tests/carp.js`.

- `vrMakeCarpScreen(which, parent, x, y, z)` in the order-screen mould:
  own 560×520 canvas, `sc.hits`, `face.userData.carpScreen = which`,
  pushed to `VR.deskMeshes`; hung beside each shed's order screen in
  `vrBuildOrderScreens`.  New regions carry META (`vrHit` style) — no
  pixel pinning; the order canvas is untouched.
- Draw: catalogue rows (select), stock line per selection (READY /
  NEED …), mark line (venue/stage or NO MARK), CALL button, status.
  Redraw on press and on the `_orderUiT` 0.5 s cadence.
- CALL: refusals in spec order (`NO MARK`, `MARK IS IN THE OTHER
  HOUSE`, `NEED STOCK`, `PIECES FULL`, `CREW BUSY`), else enqueue
  `carpPlan`'s jobs, work light on, one queue with the show crew.
- Tests: vrPointAt resolves the new face; each refusal string asserted
  through the glass; a stocked shed + mark → CALL runs the PR-4 build
  end-to-end through the screen; order-screen pixel tests untouched
  and still green.

---

After PR 5 merges: bump the Pages cache-buster past `?v=11`, add the
headset-only questions (spec §headset) to HANDOFF's list, STATE.md and
HANDOFF "Done" block as ever.
