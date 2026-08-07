# The rig comes apart: FOH fixes, real lanterns, speaker bars, warehouses, carts, ordering

**Date:** 2026-08-07 · **Status:** approved by owner (chat) · **Platform for all physical interaction: VR only** — the desktop is untouched except where noted.

The owner's asks, verbatim intent:

1. At the Palace FOH bar the ropes don't reach the roof — fix.
2. FOH bars must lower far enough to take the lights off.
3. Lights come off the bars (FOH and onstage) and store in a warehouse — one behind the Palace, one behind the Arc Centre reachable from both Arc stages — and go back on.
4. Speaker bars in front of each stage, also removable.
5. No teleporting: bring a cart out of the warehouse, load it, push it back.
6. The physical lanterns should look like actual lights (the beams are fine).
7. Order new lights and speakers from a screen in each warehouse; they arrive on a pallet you unload onto the shelves.

---

## 1. FOH bar fixes

**Wires reach the roof.** `FOHBAR.wireTop` is hard-coded 15.8 in `buildRig` (p4), chosen once to fit under the Arc's 16.2 m ceiling; in the Palace the wires stop in mid-air. `buildRig` gains a per-house `wireTop` parameter: the Palace passes its real cove/ceiling height over the stalls, `buildArcStage` passes the Arc's, and the wires anchor at the roof in all three theatres.

**The bar comes to hand.** `FOHBAR.min` drops from `houseFloorY(barZ) + 3.2` to `houseFloorY(barZ) + 2.0`. Lanterns hang 0.45 m below the pipe → ~1.55 m, chest height. The bar descends among the stalls seats; intended. The Arc's per-house min override in `buildArcStage` gets the same treatment.

## 2. Real fixture bodies

The five builders in p4 (`bodyProfile`, `bodyFresnel`, `bodyPar`, `bodyCyc`, `bodyMover`) become recognisable stage lanterns:

- **profile** — Source-Four-like: conical barrel, shutter ring at the gate, gel-frame clips at the nose, yoke with C-clamp above and a safety cable loop.
- **fresnel** — boxy body, four barn-door leaves, yoke + clamp.
- **par** — the can, gel frame, yoke + clamp.
- **cyc** — asymmetric trough, trunnion feet kept, hanging yoke added.
- **mover** — fatter sealed head, thicker arms, base with handles.

Constraints: VR poly budget (each body well under ~600 tris); geometries built once at module level and shared across all instances (three stages × ~25 channels + speaker boxes); existing `M.fixture`/`M.steel` materials; `userData.lens` (and the mover's `base`/`yoke`/`head`) keep their names — the beam/glow/aim code reads them. Purely visual; no behaviour change; applies everywhere at once because every venue runs the same builders.

## 3. Bodies and hanging points — the detach model

Split every hung lantern into two things:

- **The hanging point** (new): the clamp position on a pipe — position, owning bar/lineset, and the channel's plot (aim, colour, type-as-patched, beam parameters). Points are what `addFixture` creates today, minus the mesh. Per-stage state, parked by p2k like the rest of the board. Occupancy: `point.body = <body|null>`.
- **The body** (new): the physical lantern — one of the §2 meshes plus a type tag. Venue-level state (see §5), never parked with a stage. A body is either **hung** (on a point), **held** (in a VR hand), **carted/shelved/palleted** (in a slot), or **loose** (standing on the floor where you dropped it).

**RULING A — the circuit lives in the pipe.** Hang any body on the empty FOH-3 point and it answers FOH 3's channel with FOH 3's focus, colour and beam. Bodies are interchangeable hardware; a body carried from the Arc Main House and hung in the Studio simply becomes whatever that Studio point is patched as. No cross-stage bookkeeping exists to go wrong. (Body type ≠ point type is allowed and lights per the point's plot; making a fresnel body wash differently in a profile point is noted future flavour, not built.)

**Channel-dead.** While a point is empty its channel drives nothing: no beam, no floor pool, no lens glow, no real-light-pool assignment, no shadow. Cues, subs, plots and the desk still write levels — they just land on air, like a real unplugged circuit. Re-hang and it all comes back live.

**VR interaction** (extends `vrSqueeze` nearest-wins in p9 — ropes, levers, desks, traveler keep their priorities; do not fork the grab machinery):

- Squeeze near a hung body (within ~0.35 m) → it unclamps and follows the grip kinematically.
- Release near an **empty point** (~0.4 m) → snaps in, clamp on the pipe. Release near a **slot** (cart shelf, warehouse rack, §5) → snaps into the slot. Release anywhere else → drops upright to the surface below (raycast down; floor or deck).
- While held, the floating label (existing machinery) names the body type and, near a point/slot, what a release will do.

**What's removable:** the six FOH lanterns (lower the bar), everything on the electrics — 1E fresnels, the movers (they ride lineset 4), 2E backlights, cyc units — by flying the pipe to the deck, and speaker boxes (§4). The two box booms stay fixed in their niches; nothing exists to lower them.

## 4. Speaker bars

L+R flown line arrays per stage, hung just downstage of the proscenium, one each side of the arch: a short pipe on two drop wires, three speaker boxes hanging under it in a vertical array. Same motor pattern as the FOH bar (`fohBarPose` generalised or mirrored): RAISE/LOWER buttons on the VR fly page, a row on the desktop fly panel (desktop moves the bar; removal stays VR-only). Per-house floor clamp; wires anchor at the real roof per §1. Built inside `buildRig` so all three stages get them, parked by p2k.

Speaker boxes are §3 bodies on **speaker-type hanging points** — no channel, no plot; they're rigging. **RULING B: no audio is wired to them.**

## 5. Warehouses and carts

**Two sheds.** One behind the Palace stage house, one behind the Arc Centre placed so both houses' backstage corridors reach it. Steel shed, roller door into the venue's backstage circulation, racking along the walls with rows of **rack slots** (~16 per shed), an apron area inside the roller door for pallets, the order screen (§6) on the wall. Doors join the room/portal culling system (p2i `buildRooms`) as rooms — the shed draws only when you can see into it. The Arc shed carries the `position.x = -ARC.X`-style world-origin discipline where anything computes in world space (§4 of HANDOFF).

**One cart per shed.** A two-shelf pushcart with a handle bar; **6 body slots** (3 per shelf). Squeeze the handle and the cart follows the grip kinematically — floor-locked (it rolls, never lifts), yaw follows the pull direction, blocked by the same collision that blocks the player, fits through every door on its route. Release and it stands where you left it. Slots load/unload per §3.

**State:** carts, shed contents and every un-hung body are **venue-level** roots (Palace set / Arc set), deliberately outside p2k parking — walk Main → Studio and the cart you left in the corridor is still there. Nothing persists across reload (true of the whole game today; a save shape is future work). A body being HELD when the VR session ends drops where it was (mirrors the `vrClearRopes`/`VR.held` discipline — never leave a held reference to a disposed mesh).

**No teleports.** The only ways a body moves: in a hand, or on the cart while the cart is pushed. Nothing enforces using the cart; it's just the only way to move six at once.

## 6. Ordering new stock

A wall **order screen** in each shed, built like the existing VR consoles (ray + trigger; five precedents in p9). Line items: PROFILE, FRESNEL, PAR, CYC, MOVER, SPEAKER BOX with +/− counts, **max 6 per order**, an ORDER button, and a status line (pending countdown / STOCK FULL).

- **RULING C — no money.** There is no economy anywhere in the game; ordering is free.
- **Delivery:** ~30 s after ORDER, a beep, and a loaded pallet appears at the roller-door apron **inside the shed** (nothing outdoors needs to exist). The pallet is a mesh with 6 body slots; unload per §3.
- **RULING D — one pending order per shed;** the emptied pallet removes itself a few seconds after the last body comes off.
- **RULING E — stock cap:** at most **24 loose bodies per venue** (held + carted + shelved + palleted + floor). The screen refuses with STOCK FULL past the cap. Ordered bodies are ordinary §3 bodies — Ruling A means they work on any point.

## 7. Delivery plan — six PRs, straight to `main`, one concern each, never stacked

| PR | Concern | Depends on |
|---|---|---|
| 1 | Fixture bodies look real (§2) | — |
| 2 | FOH wires to the roof + reach floor (§1) | — |
| 3 | Speaker bars, static + raise/lower (§4 minus removability) | — |
| 4 | Warehouses, carts, culling, racks (§5 minus body slots' contents) | — |
| 5 | The detach system: points, bodies, channel-dead, snap, slots (§3, ties 1–4) | 1–4 |
| 6 | Order screen + pallet delivery (§6) | 4, 5 |

Ground rules (unchanged from HANDOFF): suites green before and after every PR; what jsdom can test gets a regression test, negative-checked against the unfixed build; what only a headset can verify is written into HANDOFF; seam-check all open branches merged together before PRs go up; `gh` is not installed — PRs via the GitHub API; PS5.1 → commit messages via `-F`; never `git add -A` with agent worktrees present.

**Testing sketch:** jsdom suites cover — per-house `wireTop` and FOH min (geometry); body geometry contracts (`userData.lens` present, tri budget); point occupancy / channel-dead (level up on an empty point produces no beam/pool/glow/light assignment); snap-to-point and snap-to-slot radii; Ruling A cross-patch (body X on point Y answers Y's channel); cart follow + door clearance (collision probe along the route); culling rooms include the sheds; order flow (cap, single-pending, pallet spawn, pallet cleanup); vr.js-style stubbed-squeeze tests for grab/release. Probes (`tools/`) draw the sheds and the loaded cart. Headset-only: grab feel, snap radii, cart push comfort, screen readability, frame rate at the racks — recorded in HANDOFF after the next run.

**Traps this must respect** (HANDOFF §5): r128 instanced bounding spheres if racks/boxes get instanced; `visible` is only a drawing flag — empty-point beams must be OFF via level path, not visibility hacks, and hidden bodies get `layers.disableAll()`; one flag one meaning (`body.state`, not an overloaded boolean); no DOM caching per stage; `typeof` guards for load-order (`var` for any global p9/p4 reach for early); anything world-space at the Arc needs the `-ARC.X` container.
