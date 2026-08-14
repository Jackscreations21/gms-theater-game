# Performance remediation — PRs 1–7 (rulings DR–DX)

**2026-08-14.** Follows the four-agent audit of the same date (findings summarized
below; the audit was run against `main` at `2293d5c`). Rulings continue from DQ:
this plan reserves **DR–DX**.

**The occasion:** his second headset run read **47ms avg on an EMPTY stage** (was
25 before the lighting round), **57ms avg / 70ms peaks with Beetlejuice**, against
the 13.9ms budget, with foveation pegged at 1.00. RULING DJ's unclamped meter makes
the BJ comparison invalid (the old 48 was a floor), but the empty 25→47 is real.

**EVERY CODE FRAGMENT IN THIS PLAN IS DIRECTION, NOT CODE.** The Roblox round's
plan was wrong in six places and five would have passed a green suite. Verify every
symbol against the source before typing it. The suites cannot see a shader; wiring
asserts + the browser `window.__glErr` check are the pattern (spec 2026-08-13 §6).

## The audit's findings (the spec for this plan)

1. **PRIMARY — `scene.environment` (p2 `envBuild`) puts PMREM cube-UV sampling
   into every `MeshStandardMaterial` fragment**: up to 16 dependent texture taps +
   ~100 ALU per pixel, per eye, no multiview. `ENV_INTENSITY`/`envMapIntensity`
   only scale the RESULT — the taps run at intensity 0, so a blackout pays full
   price. Before DK this cost was zero (no material had an envMap). This is most
   of the new ~22ms.
2. **The grade is ~22 scalar ALU per tone-mapped pixel** (`houseGrade`, p2), the
   atmosphere ~10–12 ALU + one varying per fogged pixel — on every material, both
   eyes, no early-out (uniforms cannot be compile-time folded). Both otherwise
   clean: shared uniforms, one-time hooks, identical `onBeforeCompile` text so
   r128's program cache shares, no steady-state recompiles, no double fog, PMREM
   builds once.
3. **The baseline was already broken and it is NOT the uncull workaround.** The
   26 bounding-sphere sites pin only ~20 draws / 1.7k tris (census, jsdom,
   simulating r128 projectObject). The real numbers: **205–310 meshes submitted
   per eye empty = 410–620 GL draw calls/frame** (~950 with BJ stand-ins) vs a
   ~100–200 Quest comfort band; ~125–135k tris/eye (comfortable). Plus **13
   always-on PointLights** in every standard fragment's light loop, and **39
   pre-existing `f.glow` lens quads submitted every frame even at opacity 0**
   (p4 mints one per fixture; `visible` is never set; the beam and floor pool
   right beside them ARE gated).
4. **Peaks (70ms)**: fatter first-compiles at show-load/VR-entry (env+atm+grade
   in every program), the VR console's unconditional 1200×760 (~3.6MB) texture
   upload at 5Hz (`VR.drawT > 0.2` in p9), and a latent trap — p4's light
   hand-out rewrites `l.castShadow` per frame, so a `shadows:false` dropped
   light churning a shadow-capable slot flips the lights-state hash and
   recompiles every lit material (not active without drops).

## Ground rules (every PR)

- Branch off **fresh `main`**, verify the PR base is `main` after opening.
  ONE concern per PR. Open PR N+1 only after PR N merges.
- `sh build.sh`, commit **both** `src/` and `the-house.html`. Suites 19/19
  before AND after. Every new assertion **negative-checked**: mutation proved
  present in the BUILT file **by sha**, proved to have changed the build, suite
  proved to fail, revert proved byte-identical.
- Commit author `Jackscreations21 <314018971+Jackscreations21@users.noreply.github.com>`,
  message via file + `git commit -F` (PowerShell 5.1 mangles `-m`).
  Never `git add -A`. PRs via the GitHub API (WORKFLOW.md recipe), JSON body
  written to the scratchpad, not /tmp.
- The LIGHTING page (DO/DP) must keep working on both surfaces — its rows point
  at constants some of these PRs touch.

---

## PR 1 — RULING DR: a lens quad that is dark does not draw

**One line plus its assertion.** `f.glow` (p4, minted per fixture ~line 808) gets
`visible = lvl > 0.004` in the same update that already drives its opacity
(~p4:1375), exactly the way the beam (~p4:1372) and the floor pool (~p4:1394)
are gated. Desk and VR both.

- Assertion (full14.js or show.js, wherever the fixture-level asserts live): in a
  blackout every fixture's glow quad is `visible === false`; bring one channel up
  past the threshold and that fixture's quad is visible. Drive through the real
  cue/fader path, not by poking `f.lvl`.
- Negative check: remove the gate (mutation), prove present in built file by sha,
  suite fails, restore, byte-identical.
- **This PR also commits this plan file** (house precedent: the plan lands with
  PR 1).

## PR 2 — RULING DS: `castShadow` is written only when it changes, and shadow
slots prefer the fixtures that asked

The hand-out (~p4:1470) currently assigns `l.castShadow` unconditionally every
frame. Two changes, one concern (defusing the recompile churn):

1. Write `l.castShadow` only when the value differs.
2. In slot assignment, prefer giving the 3 shadow-capable slots to fixtures with
   `shadowWanted` (RULING DQ's request semantics), so churn between wanting and
   non-wanting occupants — the thing that flips the lights-state hash — is
   minimized. `shadowGranted` must keep telling the truth.

- Assertions: same occupant re-handed → no castShadow write (observable via a
  spy/wrapper in the test, or by asserting the slot order preference directly);
  a `shadowWanted:false` drop does not displace a `shadowWanted:true` fixture
  from a shadow slot when a non-shadow slot is free. DQ's existing assertions
  must stay green unmodified.
- Negative check per protocol.

## PR 3 — RULING DT: the environment belongs to the metals, not to every pixel

**The big one.** Remove the global `scene.environment` assignment (p2
`envBuild`). Keep the PMREM box, and assign its texture as **`material.envMap`
only on materials that need reflections**: the building's metals (`M.gold`,
`M.steel`, and whatever else in the M table carries metalness worth sampling —
read the table, decide by metalness/roughness, list the choice in the PR body),
imported GLTF materials with `metalness` above a threshold (p5i land path), and
the same class among VR-minted materials (p9). Everything else returns to its
pre-DK shading — the ambient already follows the bed (RULING BH).

**DK's purpose survives whole:** metal never renders near-black, and it still
matches in VR. What is removed is the per-pixel tax on the deck, walls, seats
and drapes that never showed a reflection anyone could see.

**Seams that must not break (read the code before touching):**
- `envTrack` currently does double duty: it hooks `atmTrack` (the DL/DM
  onBeforeCompile) AND registers `envMapIntensity` driving. The atm/grade hook
  must keep reaching **every** material; only the envMap assignment and the
  `ENV_MATS`/`envDrive` registry narrow to the envMap carriers.
- `ENV_INTENSITY` and the LIGHTING page's `env` row keep working — they now
  drive only the envMap carriers.
- `goodsMat`'s clone-copies-envMapIntensity trap (STATE): a cloned material that
  no longer carries an envMap is fine, but verify nothing asserts otherwise.
- DK's existing assertions get **reversed in place** where they assert the
  global (the DF-1 precedent): what they protect — "metal samples an
  environment, driven by the bed" — survives as assertions on the carriers.
- r128 material.envMap with a PMREM (CubeUV-mapped) texture is the supported
  path — verify against the r128 artifact in tests/node_modules, not a changelog.

- Assertions: `scene.environment` is null/unset; the named metals carry the
  PMREM texture and their `envMapIntensity` follows the bed; a representative
  non-metal (`M.deck`, `M.velour`) carries **no** envMap; imported-metal path
  covered via the stand-in manifest route if feasible.
- Negative checks: (a) restore the global assignment — assert fails; (b) drop a
  metal from the carrier set — assert fails.

## PR 4 — RULING DU: the grade is one matrix

`houseGrade` (p2 ~214–228) currently spends ~22 scalar ALU on brightness,
contrast, luma saturation and tint separately. All four are affine in RGB:
precompute on the CPU a single `mat3` + `vec3` offset whenever a GRADE value
changes (or once per frame — it is microseconds), and the shader body becomes
matrix-multiply-add + the existing `max`/`mix` (~9 ALU). Same visual result,
same `gradeMix` bypass semantics, same exemption list (`gradeExempt` untouched).

- The LIGHTING page's sat/contrast rows keep driving GRADE; the matrix
  recomputes from the same values.
- Assertions: wiring — the uniforms exist, are shared (one object), and the
  chunk text contains the new symbol; a CPU-side check that the matrix for a
  known GRADE value set equals the hand-computed expectation (this CAN be
  asserted in jsdom — it is plain math, not shader).
- PR body carries the §6 caveat: the compile is verified in a browser via
  `window.__glErr`, not by the suites.
- Negative check per protocol (e.g. wrong matrix row order — assert fails).

## PR 5 — RULING DV: the console texture uploads only when someone could see it

`vrUpdate` redraws the whole 1200×760 console canvas and re-uploads the texture
at 5Hz unconditionally (p9 ~3227). Gate the **cadence redraws** on a console
actually being plausibly in view: within a distance threshold of the head (pick
by reading where the five consoles live; the Palace balcony desk vs the Arc
rooms) — interaction-driven redraws (`vrDrawConsole(true)` call sites) stay
immediate and unconditional. Far from every desk, the texture must not upload.

- Assertions (vr.js): drive frames with the head far from all consoles →
  `VR.tex.needsUpdate` stays false across the cadence window; move the head
  beside a console → it updates again; a button press far away still forces a
  redraw (the `force` path).
- Negative check per protocol.

## PR 6 — RULING DW: a light that serves no one leaves the loop

The census counts **13 PointLights + 8 SpotLights visible at boot** — every one
of them is per-fragment cost in every standard material's light loop, both
venues' lights at once, in a forward renderer. Investigate what the 13 points
are (house/foyer/practicals, both venues), then gate: a light whose venue/room
is not the one being drawn, or whose intensity is driven to 0 and stays there,
gets `visible = false` (r128 gathers lights per frame; fewer lights = a cheaper
program — count changes swap between CACHED programs after first compile, so
alternating is safe; verify against the r128 artifact).

**Do not break:** the darkness-comparison suites (a chandelier 30m away through
a shut door has bitten a test before — TRAPS), the Arc/Palace venue swap, VR's
`lightCap` hand-out (p4/p9 seam), RULING BH's ambient behaviour.

- Assertions: standing in the Palace with the Arc unvisited, no Arc light is
  visible (and vice versa); a house light driven to 0 by the bed for N seconds
  leaves the loop and returns when driven up. Choose the exact rule by reading
  how HOUSE/venue lighting is driven — the rule must be stated in the PR body.
- Negative check per protocol.

## PR 7 — RULING DX: the empty house submits fewer draws, and the number is
measured before and after

**Investigation + first scoped fix, evidence-first.** The census script
(scratchpad `census.js` from the audit session — copy it into `tools/` as a
proper probe if it earns its keep, probe-lint clean) says the empty Palace
submits 205–310 meshes per eye. Identify the biggest plain-mesh contributors
(it is almost entirely 1-draw plain meshes), then merge/instance the safest
large block — likely the static Palace architecture per room, same-material
geometry merged — WITHOUT breaking:

- room/portal culling (p2i `buildRooms()` files `world.children` late — a merge
  changes what exists at that moment),
- raycasts that walking/standing depends on (groundAt), the holes.js shell
  integrity suite, the build system's pickable objects, and anything crew/show
  code finds by name or userData.

Target: a measured reduction of the per-eye submission count for the boot view
(state the before/after census numbers in the PR body; aim for the biggest
single safe bite, not completeness — follow-up rounds can take more). If the
investigation finds the safe bite is smaller than expected, land the
measurement probe + the finding as the PR and say so — a true "this is the
shape of it" beats a risky merge.

- Assertions: the census probe's number is pinned (a regression assert with
  slack, the way tri-budget asserts work in p5i), plus suites 19/19 — holes,
  rooms, full14 especially.
- Negative check per protocol.

---

## After the chain: the record

STATE.md rewritten for the round, HANDOFF gets the Done block, new traps into
TRAPS.md (at minimum: "a tunable uniform is not a kill switch — the taps run at
intensity 0"; "opacity 0 still rasterises and still costs a draw call";
"lights-state hash churn recompiles every lit material"). Cache-bust becomes
**`?v=29`**. The headset checklist gains: read the wrist meter's `calls · tri`
line at the same four moments (predicted ~410–620 calls empty before PR 7).
