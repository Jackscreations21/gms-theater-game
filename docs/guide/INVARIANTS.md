# Invariants — break these and things go quietly wrong

- **The deck is `y = 0`, on every stage.** Every set, fly trim and
  fixture aim is written to it. The Arc's decks were once built a metre
  up and it buried every production that loaded onto them.

- **Every stage is the same box.** `AS` in `p2j` takes `procW`, `procH`,
  `stageW`, `stageD`, `gridY` straight off the Palace's `D`. Change `D`
  and all three stages change together.

- **A fixture's `aim` is in WORLD space; a light plot is written in
  STAGE coordinates.** `stageToWorld()` in `p4` converts. Forget this
  and a plot aims every Arc lantern back across town at the Palace.

- **Trims are the height of the PIPE.** Goods hang below it. Setting a
  trim to where you want the bottom edge hangs the cloth through the
  floor.

- **Nothing hung goes below the deck.** `minTrimOf(ls)` in p3 is the
  floor: the pipe stops when its goods kiss the deck (but never above
  the goods' own working trim — the house curtain is cut to puddle).
  It is enforced by everything that MOVES a pipe **and by `hangGoods`**
  (hanging tall goods on a low pipe lifts the pipe — RULING V). Built
  assemblies hung on a pipe extend it via `ls.asmH`. If you add a new
  way to move or load a pipe, clamp it.

- **Upstage is −z. Downstage is +z. Stage right is −x.**

- **Anything computed in world space needs a container at the world
  origin.** The Arc sits at x = 420; its floor-pool group, crew root and
  rope holder all carry `position.x = -ARC.X` to cancel it out.

- **Wood is PARAMETRIC and a cut must NEVER mint geometry** (build spec
  §9): one shared unit BoxGeometry, scaled per piece; a cut re-scales
  one body and registers a second.

- **Shared materials are never tinted in place.** `M.serge`, `M.velour`
  (p2) are one object each, shared game-wide. Paint goes through a
  keyed cache (`WOODM` for wood, `LENSM` for lenses, `GOODSM` for
  goods): repaint is a pointer swap; same colour = same material object.
  **Any new paintable class must follow this pattern.**

- **Caps are enforced at the ORDER SCREEN**: `BUILD_CAP` 150 build
  pieces per venue, 24 loose gear bodies per venue (`venueLooseCount`,
  which skips build kinds). Anything that mints bodies must check them
  too, or it walks past the cap the player is refused at.

- **Never `setTimeout` for game timing** (ruling M7): time comes off the
  frame `dt` — the `updateSheds` / `updateOrders` / `updateLifts` family.

- **New per-stage state gets parked in `p2k`**, or it leaks across the
  stage swap.

- **Every material must reach `envTrack` (RULINGS DK, DL, DM).** It is
  the one registration: it hands the material the shared atmosphere and
  colour-grade uniform objects through a single `onBeforeCompile` (DL,
  DM), and — **if `envCarrier(m)` says so, which since RULING DT means
  `metalness >= ENV_METAL_MIN`** — gives it the room PMREM as
  `material.envMap` and drives its `envMapIntensity` off the light bed
  (DK). `scene.environment` is deliberately never set: it would put
  cube-UV sampling into every standard material's fragment, which is the
  22ms DT removed. **The narrowing is BELOW `atmTrack` and must stay
  there** — a non-metal keeps the fog and the grade exactly as it had
  them, and only the envMap and the `ENV_MATS`/`envDrive` registry stop
  at the metals. A
  material that misses it renders with the fog and grade **bypassed**
  rather than broken — `atmMix` and `gradeMix` default to 0 for exactly
  that reason — so the failure is silent and is asserted in
  `tests/full14.js` rather than left to be noticed. Anything that mints
  geometry after boot calls `envRegister(root)`; anything that mints a
  bare material calls `envTrack(m)`, which returns it so a keyed cache
  can mint straight through. **A copied uniform is the failure mode to
  fear**: `sh.uniforms.x = {value: v}` looks identical on the first
  frame and never moves again — share the object.

- **Additive light is exempt from the grade on purpose** (DM). A beam, a
  gobo flare or a lens glow *is* the light; the surfaces it falls on are
  graded already, so grading the source too tints the same photon twice.
  `gradeExempt(m)` sets `toneMapped = false`. This is not an omission to
  be tidied up later.
