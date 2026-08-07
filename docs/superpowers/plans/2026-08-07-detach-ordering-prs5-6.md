# Detach system & ordering — PRs 5–6 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or
> superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Land the last two PRs of the approved spec
(`docs/superpowers/specs/2026-08-07-rig-warehouse-design.md`): the detach system (§3 —
hanging points, bodies, channel-dead, snap, slots) and ordering (§6 — order screen, pallet
delivery). Two owner asks from 2026-08-07 are folded in: **the speaker arrays get bigger**
(6 boxes per array, up from 3) and **each speaker box detaches individually** (§4 already
makes boxes bodies; the enlargement rides PR 5 because detach must rewrite the same box
block anyway — two PRs editing the same 30 lines would conflict or stack).

**Ground rules:** identical to the 1–4 plan §0 (`docs/superpowers/plans/2026-08-07-rig-warehouse-prs1-4.md`)
— read it if you haven't: build with `sh build.sh` before every test run; suites must end
`--- failures: 0 ---`; every new assertion negative-checked per §0.3; commits via `-F` file
(PS 5.1); PRs via the GitHub API (§0.4), straight to `main`, owner merges. **PR 6 depends on
PR 5:** build PR 6 on the PR 5 branch locally, but OPEN it only after PR 5 merges (rebase
onto `main` first). Never open a PR whose diff contains another PR's commits.

**Stale-reference warning:** HANDOFF says the level choke point is `~p4:418` — it is
**p4:554** today (PR #34 pushed it down). All line numbers below verified 2026-08-07 on
`main` = `cce94c6`.

---

## Section 1 — The design (decided; do not re-litigate mid-build)

### Points

**A point is what a `FIXTURES` entry already is.** No new per-stage array: the fixture
record (p4:281 `addFixture`) keeps the channel, plot, aim, beam params, and per-frame motion
— it IS the hanging point, per-stage and p2k-parked for free (p2k:51 splices `FIXTURES`
wholesale). Occupancy: **`f.body` becomes nullable.** `f.body === null` ⇒ the point is
empty. `f.group` (the point's transform, riding its bar or lineset) never detaches.

**Speaker points** are new small records — no channel, no plot (RULING B): per box,
`{bar, side, y, body}` pushed onto `SPKBARS[side].points`. They park with `SPKBARS`
(p2k:64/88) untouched.

### Bodies

```js
var BODIES = [];   // venue-level: every detachable thing in the game
// {kind:'profile'|'fresnel'|'par'|'cyc'|'mover'|'speaker', venue:'palace'|'arc',
//  mesh:Group, state:'hung'|'held'|'slotted'|'loose', point:null|f|spkPoint, slot:null|anchor}
```

One flag one meaning (trap §5): `state` is the only word for where a body is; `point` and
`slot` are set exactly when state is `'hung'`/`'slotted'`. Slot anchors get
`anchor.userData.body = <body>` so a slot's emptiness is one read.

`addFixture` creates the point AND its factory-hung body (registered in `BODIES`,
state `'hung'`) so boot is unchanged: every rig starts fully hung. Venue tag comes from a
`var BUILD_VENUE = 'palace'` that `buildArcStage` (p2k:262-268) flips to `'arc'` alongside
`keepBar`/`keepSpk` and restores at p2k:322-327.

**Parenting per state** (never fork this):
- `hung` — mesh is a child of `f.group` at (0,0,0) (or the box group under the speaker bar).
  Exactly today's structure; beams/glows/aims all keep working.
- `held` — mesh stays parented to the **venue root** (`world` / `ARC.group`, the cart
  precedent p2m:149-154, 218-223); the hold is **kinematic**: `vrUpdateHold` copies the grip
  world pose onto it each frame. This is the crux of session-end safety: `vrOnEnd` (p9:240)
  and `vrClearRopes` (p9:951) drop `VR.held` without a release path — a kinematically-held
  body simply stops following and is already correctly parented. No disposed-mesh reference
  can exist.
- `slotted` — mesh is a child of the slot anchor at (0,0,0); cart slots inherit the cart's
  motion for free (anchors are children of the cart group, p2m:72-78).
- `loose` — mesh at venue root; `updateBodies(dt)` settles it to `groundAt(x,z)` (p7:95-101)
  so a record dropped mid-hold sinks to the floor instead of floating.

Venue-root reparenting always via `Object3D.attach()` (keeps world transform, in r128).
Every body mesh carries `userData.moves = true` (matrix-freeze trap) and, hidden never —
bodies are never hidden, so no `layers` games needed. Bodies added to `world` at runtime
land OUTSIDE the room groups (buildRooms sorted `world.children` once, at boot) — i.e.
never culled, the cart's own behaviour; Arc bodies under `ARC.group` gate venue-wide.
Palace loose/held bodies must NOT be added to a room group.

### Channel-dead — ONE gate

p4:554 becomes:

```js
    const lvl = f.body ? clamp(f.level,0,1) * master : 0;
```

Everything downstream (beam 566-573, glow 576-578, pool 580-597, `_active` push 563 →
light pool 600-620, ambient 651) is already gated on `lvl`/`_active` — verified. Cues,
subs, plots still WRITE `f.level`; they land on air. Never touch `visible` for this (§5).

Null-body guards needed in the same loop: p4:547-548 (mover yoke/head write) and p4:558
(`const src = f.mover ? f.body.userData.head : f.group;`) — both become
`f.mover && f.body && f.body.userData.head ? ... : f.group`-shaped. RULING A corollary:
a non-mover body hung on a mover point lights along the point's aim but cannot articulate
(no head to swing); documented quirk, not a bug.

**Mover beam/glow parenting:** the beam and glow of a mover point are parented to the
body's head (p4:296-298, 315-319) and would ride a carried body. `unhangBody` re-parents
beam+glow to `f.group`; `hangBody` re-parents them onto the new body's head only when the
point is a mover AND the body has a head. Non-mover points never move theirs.

### Grab / release (VR only; extend p9:1170 `vrSqueeze`, never fork)

New candidate class scanned alongside levers (0.12), ropes (0.32) and cart handles (0.30):
**bodies within `BODY_GRAB = 0.35`** of the hand (distance to mesh world position), from:
- hung bodies whose point is LIVE (its `f` in the live `FIXTURES`, or its speaker point's
  bar in the live `SPKBARS`) — parked stages' rigs are not reachable by hand;
- any `slotted`/`loose` body of the venue the player stands in.

Nearest-wins across all four classes. Held record: `{hand, kind:'body', body}` — the
discriminated union the cart started (p9:1237). Grabbing a hung body calls `unhangBody`
(point goes empty, channel dies); grabbing a slotted one clears its slot.

Release (p9:1176-1189 branch on `kind:'body'`), in priority order at the release point:
1. nearest LIVE empty point within `SNAP_POINT = 0.4` (distance to `f.group` world pos /
   speaker box seat) → `hangBody` — snaps in, channel comes back live;
2. nearest empty slot of the venue within `SNAP_SLOT = 0.4` (shed racks p2m:35-39, cart
   p2m:72-78, pallet in PR 6) → `slotBody`;
3. otherwise `dropBody` — state `'loose'`, settle to floor.

Any body can take any point (RULING A — "the circuit lives in the pipe"), except: speaker
points accept only `kind:'speaker'` bodies and lantern points accept only lantern kinds —
a PA box in a profile clamp is nonsense rigging (spec §4 keeps speaker points "rigging").
While held, the floating label (`vrLabel`, p9:1106) names the body and what release will do
— fed from the `kind:'body'` branch of `vrUpdateHold`, since the label's normal feeder
(`vrHoverWorld`) is bypassed while pointing at nothing.

### The bigger speaker arrays (owner ask, folded into PR 5)

The p4:415-447 block is rebuilt: **6 boxes per array** (was 3), each box a `T.Group`
(box + grille, grille material CACHED — today it's a fresh `MeshBasicMaterial` per box,
p2m-style leak), with a slight progressive J-array tilt on the bottom two boxes. Boxes
spaced 0.46 down from −0.32 as today → lowest at −2.62. `SPKBARS[side].boxes = [...]`
stores the groups; PR 5's speaker points hang one body in each. Floor clamps re-derived so
the LOWEST box still comes to chest height: `min = houseFloorY(sz) + 1.55 + 2.62` (and the
Arc override p2k:287-295 gets the same formula off its rake). Desktop rows say
`6 × PA box` (p6:605). The vr.js pixel pins (86+312/366/448/502) do not move.

### Ordering (PR 6)

`ORDERS = {palace:{...}, arc:{...}}`, each `{pending:null|{items, t}, pallet:null|{group,
slots, emptyT}}`. Timer runs in `updateSheds(dt)` (p2m:171) — game-time, no `setTimeout`
(M7's lesson). ORDER → 30s countdown → pallet mesh at the roller-door apron with **6 slot
anchors** that join the venue snap-scan, pre-loaded with the ordered bodies (state
`'slotted'`, venue = the shed's). RULING C: no cost. RULING D: one pending per shed; the
pallet self-removes ~5s after its last body leaves (anchors deregistered, mesh disposed —
geometry AND the slot references). RULING E: refuse with STOCK FULL when
`BODIES.filter(b => b.venue===v && b.state!=='hung').length + orderCount > 24`.

**The order screen** is a wall canvas panel per shed (NOT the shared `VR.tex` desk canvas):
`{canvas, ctx, tex, hits:[], mesh}`, mesh `userData.orderScreen = which`. `vrSelect`
(p9:1079) gains a check after the desk branch: ray-hit an order screen → map uv with the
same `v = 1 - uv.y` flip → walk its own `hits` reverse. Rows: PROFILE / FRESNEL / PAR /
CYC / MOVER / SPEAKER BOX with −/count/+, max 6 total per order, ORDER button, status line
(countdown / STOCK FULL / pallet waiting). Desktop is untouched.

---

## Section 2 — PR 5: the detach system (branch `detach-system`)

**Files:** `src/p4.txt` (arrays, gate, hang/unhang, speaker rebuild), `src/p9.txt`
(squeeze/hold/release/label), `src/p2k.txt` (BUILD_VENUE flip, arc spk min), `src/p6.txt`
(6 × PA box), `src/p7.txt` (updateBodies call), tests in `stages.js`, `warehouse.js`,
`vr.js`; rebuild `the-house.html`.

### Task 5.1 — bigger arrays, per-box groups
- [ ] Rewrite p4:415-447: 6 box groups per side, cached grille material, slight J-tilt,
      `SPKBARS[side].boxes`, new `min` formula. Update p2k:287-295 (arc min) and p6:605
      (`6 × PA box`).
- [ ] Tests (stages.js, new banner `--- speaker arrays ---`): 6 boxes per side each stage;
      box groups stored; grille material shared across all boxes; lowest box above the
      house floor at `min`. Negative-check (fails on 3-box build).

### Task 5.2 — BODIES, venue tag, factory hang
- [ ] `var BODIES = []` + `var BUILD_VENUE = 'palace'` in p4 (before `addFixture`);
      `bodySpeaker()` builder (box+grille via `fixG`, `userData.clamp` on a top bracket);
      `addFixture` registers the hung body; speaker points built in the 5.1 block with one
      hung speaker body each; `buildArcStage` flips/restores `BUILD_VENUE`.
- [ ] Tests (stages.js): every fixture has a BODIES record, state `'hung'`,
      `point === f`; Palace bodies venue `'palace'`, Arc venue `'arc'`; speaker points
      6 per side with hung speaker bodies.

### Task 5.3 — hang/unhang/slot/drop + the dead channel
- [ ] p4: `unhangBody(b)`, `hangBody(b, point)`, `slotBody(b, anchor)`, `dropBody(b)`,
      `updateBodies(dt)` (loose settle via `groundAt`); the p4:554 gate; the mover guards
      547-548/558; beam+glow re-parent rules. Call `updateBodies` from p7 next to
      `updateSheds(dt)` (p7:1457).
- [ ] Tests (stages.js, `--- the dead channel ---`): set a channel's level to 1, unhang →
      `_lvl === 0`, beam invisible, pool invisible, no light-pool slot, and the fixture's
      meshes still `visible === true` (the gate is the LEVEL PATH, not visibility);
      re-hang → all back. RULING A: unhang FOH-3's profile, hang the 1E fresnel body there
      → answers FOH-3's channel/aim. Negative-check: gate test must fail on a build
      without the p4:554 change.

### Task 5.4 — VR grab/release/label
- [ ] p9: body candidates in `vrSqueeze` (live-point + venue rules above), nearest-wins
      with ropes/levers/carts; `kind:'body'` branch in `vrUpdateHold` (kinematic follow +
      label); release logic (point → slot → drop). `vrOnEnd`/`vrClearRopes` untouched —
      verify a held body dropped there ends `'held'`-stateless: release-less drops leave
      state `'held'` with no holder, so `updateBodies` also demotes any `'held'` body no
      `VR.held` names to `'loose'` (idempotent, one line).
- [ ] Tests (vr.js, new banner `--- vr: bodies ---` before the failures footer, cart-test
      idiom): squeeze near a hung 1E fresnel takes it and kills its channel; release next
      to the emptied point re-hangs it; release over a cart slot files it
      (`anchor.userData.body`); release in the open drops it and it settles to the deck;
      a rope 0.1m away beats a body 0.3m away (arbitration); session end mid-hold leaves
      the body loose on the floor, no reference in `VR.held`. warehouse.js
      (`--- the slots ---`): a slotted body rides the cart (push cart, body world pos
      moves); rack slot occupancy round-trip.
- [ ] Negative-check the lot; `npm test` 13/13; rebuild committed.

### Task 5.5 — ship it
- [ ] Update HANDOFF (§ what's done, headset questions: does grab feel right at 0.35,
      does the snap radius read, do 6-box arrays look like line arrays from the stalls).
- [ ] Commit(s) via `-F`, push `detach-system`, open PR 5 via API. Title:
      "The detach system: points, bodies, dead channels — and 6-box speaker arrays".

## Section 3 — PR 6: ordering (branch `orders`, built on `detach-system`, OPENED after PR 5 merges)

### Task 6.1 — state, timer, pallet
- [ ] p2m: `ORDERS`, tick in `updateSheds(dt)`; `spawnPallet(which)` (mesh + 6 anchors at
      the apron, anchors into the snap scan), `clearPallet(which)` (dispose + deregister);
      spawn bodies via the PR 5 builders, state `'slotted'`, RULING E count helper.
- [ ] Tests (new 14th suite `tests/orders.js`, harness cloned from warehouse.js;
      run-all.js two-line diff, comment says fourteen): order 3 → pending; tick 30s of
      `updateSheds` → pallet with 3 slotted bodies; second order while pending refused;
      empty the pallet → gone in ~5s, slots deregistered; cap: 24 loose in the venue →
      STOCK FULL refusal.

### Task 6.2 — the order screen
- [ ] p9 (+p2m mesh): per-shed wall panel, own canvas/tex/hits; `vrSelect` order-screen
      branch with the uv flip; rows, max-6, ORDER, status line.
- [ ] Tests (orders.js): the screen's hits include six +/− pairs and ORDER; pressing +
      thrice and ORDER yields pending count 3; STOCK FULL drawn when over cap (read the
      state, not the canvas). vr.js: one test that the ray path reaches an order screen
      (uv → press → pending), aim() idiom.
- [ ] Negative-check; `npm test` 14/14; HANDOFF; commit, push. **Open only after PR 5
      merges** (rebase onto main first; if the session ends first, hand the branch off
      pushed-and-ready).

## Section 4 — seam & landing order

1. PR 5 built and green → seam-check is trivial (one branch) → open PR 5.
2. PR 6 built on top, green locally (this IS the seam check for 5+6 together).
3. If PR 5 merges in-session: rebase `orders` onto `main`, retest, open PR 6.
4. HANDOFF updated on whichever branch ships last.

**Headset-only, recorded in HANDOFF for the next run:** grab feel at 0.35 / snap at 0.4;
carrying a lantern through the roller door; reading the order screen at arm's length;
frame rate holding a body under a full rig; whether 6-box arrays read as real PA.
