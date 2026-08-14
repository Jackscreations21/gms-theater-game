# VR (p9)

Quest 3, WebXR, auto-detected — **the desktop is untouched by design**;
every VR feature is gated on the session.

**The frame rate is NEGOTIATED, not set.** `vrOnStart` asks for `VR.targetHz`
90 and then takes the **lowest supported rate at or above 72** — never below,
because under 72 the display flickers — so on a Quest 3 it settles at 72 and
the budget is **13.9ms**, not 11.1. Where the API is missing, 90 stands. The
comment in `p9` says why: *"the first headset run could not hold it; a held 72
beats a 90 that drops."*

**The first real readings, 2026-08-13, and they are bad:** **25ms** in an empty
Palace with nothing loaded and **48ms** in Beetlejuice — 1.8× and 3.5× over
budget. Foveation pegs at **1.00 within about two seconds** of entering and
never relaxes, so the one mid-session governor is spent, not standing by. And
the 48 was a **floor, not a measurement**: `p7` clamps `dt` to 50ms and the
meter used to read that clamped figure, so every frame worse than 50 recorded
as exactly 50 (RULING DJ fixed it).

## Movement

Smooth stick walking (3.2 m/s) where the LEFT CONTROLLER points
(`vrMoveYaw`; ~14° vertical falls back to headset yaw). Smooth turn
`VR.turn` 2.1 rad/s. Tap A jumps; double-tap A (0.35s window) flies —
gaze-directed, walls still block. Keyboard/desktop movement is separate
and unchanged.

## Grab arbitration — nearest-wins across classes

One squeeze; the closest candidate across ALL classes wins. Radii:

| Class | Radius | Notes |
|---|---|---|
| lever (rope lock) | 0.12 | moves ONLY while a hand is squeezed on its knob |
| tool / roller holster | 0.22 | belt rides the hips, `vrUpdateBelt` |
| saw cutter | 0.28 | slides, snaps to the inch (tape tick first) |
| cart / forklift | 0.30 | forklift record is in BOTH `LIFTS` and `CARTS` so cart machinery drives it |
| rope | 0.32 | nearest point on EITHER run, deck to grid; back run hauls in reverse |
| compact bodies (lanterns, cans…) | 0.35 | centre test |
| wood | `GRAB_WOOD` 0.15 | to the piece's SURFACE (unit-box local clamp), not its centre |
| work table | — | by its frame box (RULING Q) |

**Adding a grab class means extending every cross-check.** Wood keeps
priority over goods under the roller.

## Holds

- Held bodies follow the grip **kinematically** — never re-parented to
  the hand (exception: the paint roller, deliberately parented; release
  ALWAYS re-racks it, even from `vrOnEnd` before the hold drops).
- Wood carries grip-relative (relQ + grabV) and squares to a 45° grid
  on all three axes; HOLD X frees it; a snap offer overrides both.
  Y parks a piece mid-air (`b.frozen`) — a parked piece is a legal snap
  target on purpose.
- Release snaps: empty live point (0.4) → slot (0.4) → table top →
  floor (`b.restH` — wood settles flat).
- `vrClearRopes` opens only ROPE holds — carried bodies/carts survive a
  stage walk. A grab (VR or desktop) clears a pending relock.

## Ropes, levers, runaways (p3 + p9)

The locking rail: grab anywhere on either run; the lock lever is the
hand's interlock (starts locked), the board is the flyman — `flyTo`
unlocks/relocks itself (`ls.relock`), manual hauls refuse while locked.
A line released with no lock and no hand runs away to the deck
(integrated in p3 `updateFly`); grabbing arrests it; board commands
cancel it; stage swaps tie off. Runaways never relock.

## Screens and buttons

Five physical consoles + wall order screens + the fly page. **vr.js pins
some older buttons by LITERAL PIXEL** (FOH/SPK RAISE/LOWER at y
312/366/448/502) — do not shift those canvas layouts. New regions go
through `vrHit` META (findable by meaning; the goods picker is the
model). Desk hit-testing uses the `v: 1 - h.uv.y` flip.

The goods picker (fly page goods cell) calls the same `hangGoods` the
desktop palette uses; **hanging rebuilds the rail** (`vrBuildRopes`) so
new pipes get ropes and locks.

## Performance

The wrist meter (`vrPerf`, left wrist): 120-frame ring buffer, avg/worst
in `VR.perf`, green under budget / red over, plus **draw calls and
triangles** off `renderer.info` (RULING DJ — three.js has no multiview at
any version, so both eyes cost two passes and our own batching is the only
lever left on that number). It records the **raw** frame time `p7` hands it
alongside the clamped game `dt`, with its own far higher ceiling
(`PERF_CEIL` 200ms) — a 20ms frame is a frame rate and must be told the
truth, while a three-second model load is a hitch that would otherwise
poison the window. Foveation on a feedback
loop: base 0.4, steps +0.15 toward 1.0 when over budget, relaxes −0.05
with headroom — climb fast, relax slow. Other knobs, in order (one per
PR, retest after each — full list in HANDOFF "still owed"):

1. Batch the locking rail's static per-line meshes (`vrBuildRopes`)
2. `VR.beamCap` (10 today) — additive beams in haze are overdraw
2b. `VR.glowCap` (12 today, RULING DN) — the additive halo batch, same knob
   family and the same reason. Capped by NEAREST-WITHIN-A-CONE, never by
   array order: rig order drew twelve halos behind your head and none you
   could see. `f.glow`, the per-fixture lens core, is a **different** thing
   and still draws all 39 in a blackout — an open one-line follow-up.
3. Framebuffer scale below 0.85 (**must be set before any session exists**)
4. Merge lantern-body steel clusters (spec'd in #33's review; keep the
   jaw — it IS `userData.clamp` — and the lens separate)
5. Cut `SMOKE.n`

`VR.lightCap = 4` real spotlights in-session (p4 hand-out loop, sorted
by workload). `vrOnEnd` resets the perf window.

## Hardware truth

No suite can verify feel, frame rate, or legibility. Whatever only the
headset can answer goes on the HANDOFF checklist as a question, and the
answers get written back after the run. Everything from PR #48 onward
has never met hardware (as of 2026-08-08).
