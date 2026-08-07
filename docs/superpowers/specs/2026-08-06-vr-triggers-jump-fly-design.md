# VR: triggers, jump & fly, and a performance notch — design

Owner-approved 2026-08-06, after the first recorded Quest 3 run (session starts,
frame rate a little low). Three concerns, three PRs, straight to `main`.

## 1. Triggers use what you point at (`vr-trigger-use`)

On desktop, "using" the world is the E key: `useTarget()` describes whatever the
crosshair is on (door, lineset, fixture, scenic, station) and acts on it. In VR
the trigger only worked on the console desks; pointing at a door did nothing.

- `p7`: `useTarget()` is split into `useInfo(info)` (act on a described target)
  plus a one-line `useTarget()` that feeds it `hoverInfo`. No desktop behaviour
  change.
- `p9`: both hands get a pointing ray. `vrSelect` keeps desk priority for the
  right hand — on a desk the trigger presses the console and never reaches
  through it. Off the desk, either trigger casts into the room with the same
  curated pick list the desktop uses (`pickAll` + `describe`, 22m reach) and
  calls `useInfo`.
- A floating label sprite shows what a pull would do ("HOUSE DOOR — open"),
  scaled with distance so it reads across a room; the cursor dot lands on the
  hit point.

## 2. Jump and fly (`vr-jump-fly`)

- Tap **A** (right controller): jump, same impulse as desktop Space
  (`vel.y = 4.6`, only when on the ground).
- Double-tap **A** (two presses inside 0.35s): fly mode on, with a toast.
- Flying: gravity off. The left stick moves along the direction the HEADSET
  looks — look up and push forward to climb. Stick back reverses, left/right
  strafe on the flat. Walls still block (same `tryMove`), the ceiling of the
  world clamps at 60m. Speed 8 m/s, a notch over sprint.
- Out: double-tap A again (gravity returns), or descend until the feet touch a
  floor — landing drops back to walking automatically.
- VR-only; the desktop is untouched.

## 3. Performance notch (`vr-perf-notch`)

The owner reports "a little low" frame rate, mild option chosen:

- `renderer.xr.setFramebufferScaleFactor(0.85)` — set at wiring time, before
  any session exists, per the WebXR rule.
- `VR.beamCap` 14 → 10 (additive beams in haze are the worst thing a mobile
  tile GPU can be handed).

Both VR-only, both easy to retune after the next headset run.

## Testing

Everything jsdom can reach gets a regression test in `tests/vr.js`: the desk
UV flip driven by a really-posed controller (not `hit.fn()`), door toggling by
either trigger, desk-priority swallowing, label text and clearing, jump, the
double-tap toggle, look-direction flight, soft landing, and the quality-tier
numbers. What only a headset can verify (comfort, readability, real frame
rate) goes to HANDOFF §6 for the next run.
