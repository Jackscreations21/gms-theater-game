# STATE — 2026-08-14 (THE PERFORMANCE ROUND IS COMPLETE, DR–DY)

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## READ THIS FIRST: EIGHT PRs LANDED ON THE FRAME RATE, AND NOBODY HAS SEEN THEM

**His second headset run (at `?v=28`) read 47ms avg EMPTY / 57 avg, 70 pk with
Beetlejuice** against the 13.9ms budget, foveation pegged at 1.00. A four-agent
code audit found the causes, and rulings **DR–DY** fixed everything it found.
**Cache-bust is `?v=29` from here.** Rulings are at **DY**.

| PR | Ruling | What |
|---|---|---|
| **#185** | **DR** | a lens quad that is dark does not draw (39 always-on quads gated) |
| **#186** | **DS** | castShadow written only on change; shadow slots prefer the fixtures that asked |
| **#187** | **DT** | **the environment belongs to the metals** — `scene.environment` is GONE; the PMREM rides `material.envMap` on the 21 building metals + imported/session metals via `envCarrier` |
| **#188** | **DU** | the grade is ONE matrix (~22 → ~9 ALU per pixel; CPU-composed mat3+offset) |
| **#189** | **DV** | the console texture uploads only within 12m of a desk (was ~3.6MB at 5Hz, always) |
| **#190** | **DW** | a light that serves no one leaves the loop (the never-driven yard lamp; the Arc bed indoors) |
| **#191** | **DX** | `tools/draws.js` — the draw census probe, and the finding that re-aimed the round |
| **#192** | **DY** | the lantern body is one draw per material group (10.8 → 3.2 draws per fixture) |

Every merge verified: `main` rebuilds **byte-identical**, 19/19 suites on the
merged result, every branch deleted local and remote. Two-stage review on
every PR; review fixes landed on the branch before each merge.

## WHAT THE AUDIT SAID, AND WHERE IT WAS WRONG

The audit (this session, four agents over the DJ–DQ diff + a jsdom census):

1. **Primary: `scene.environment`** put PMREM cube-UV sampling (up to 16
   dependent texture taps + ~100 ALU) into EVERY standard fragment, per eye —
   and **intensity 0 does not remove the taps** (now in TRAPS). Most of the
   25→47ms empty-house regression. → **DT**.
2. **Secondary: grade ~22 ALU + atmosphere ~12 ALU per pixel**, no early-out
   (uniforms cannot fold). → **DU** took the grade to ~9; the atmosphere was
   judged fine as-is once DT landed.
3. **Peaks: show-load first-compiles** (env+atm+grade in every program), the
   console's unconditional texture upload (→ **DV**), and the per-frame
   `castShadow` write that flips the lights-state hash under dropped-light
   churn (→ **DS**).
4. **The baseline was already broken** — but the audit misread TWO things,
   and the round's own investigations corrected it:
   - **"13 always-on PointLights from both buildings" was a census misread**
     (→ **DW**): the venue gate has existed all along in `p2i`'s room sorter;
     all 13 were the Palace's own. What DW actually found: a yard light minted
     at intensity 0 that NOTHING has ever driven, and the Arc bed staying in
     the light loop indoors. Both gated on membership. Palace 13 → 12 points.
   - **"The instanced batches never cull / merge the architecture" was wrong
     twice** (→ **DX**): the 26-site workaround pins ~20 draws, and the
     architecture is ALREADY merged (~1.1 draws a block). **The cost was the
     RIG: 476 of the scene's 878 visible drawables (54.2%), 423 of them
     lantern bodies at 10.8 draws each.** → **DY** merged each body's static
     shell per material group.

## THE NUMBERS AS THEY STAND (tools/draws.js, the committed probe)

Empty Palace, per eye — double for the frame (no multiview at any three.js
version; that finding stands):

| view | before the round | after DY | the frame pays |
|---|---|---|---|
| boot camera (stalls centre) | 350 | **294** | ~588 |
| a stalls seat, facing stage | 185 | 185 | 370 |
| downstage centre, facing upstage | 321 | **214** | 428 |
| on stage, facing the house | 83 | 83 | 166 |
| whole scene, frustum off | 878 | **580** | — |

One lantern body: **10.8 → 3.2 draws**. Boot tris +0.5% (coarser culling on
merged shells — stated in the DY comment, worth remembering at the wrist
meter's tri line). The regression pin: `DY_CEIL` in tests/stages.js — 294
measured, **ceiling 320**, un-merged build measures 350.

**Re-measure with `sh build.sh && NODE_PATH=../tests/node_modules node
draws.js` from tools/ — the probe reads the BUILT file** and prints its byte
size so a stale build shows itself.

## THE HEADSET RUN THIS ROUND NEEDS (at `?v=29`)

Nothing in DR–DY has been seen. Read the wrist meter — **all four lines:
`avg ms`, `pk`, `fov`, and `calls · k tri`** — at the same four moments:
empty Palace, Beetlejuice pre-show, the 1:00 cue with eight blinders, at the
proscenium looking up into the neon. Predictions to check:

1. **calls ≈ 590 empty at the boot view** (the meter counts both eyes). If it
   reads ~700, the build is stale — bust the cache harder.
2. **avg should fall well below 47 empty.** How far is the question the round
   exists to answer — the env taps were the modelled majority of the
   regression, but nothing in jsdom has eyes or a GPU.
3. **The LOOK questions DT/DU opened**: non-metals no longer sample the
   environment (their ambience is the bed, as pre-DK) — does the room still
   read right? The metals (gold proscenium, rails, imported chrome) still do
   — do they still read like metal in a blackout and at full bed? The grade
   is algebraically identical (pinned to 2.2e-16) — it should look EXACTLY
   the same; if it does not, that is a finding, not a tune.
4. **DV**: walk away from the desk and back — the board must repaint
   instantly on return; watch for any staleness at the balcony rail edge
   (the gate is 12m, chosen so the whole stalls band 5.5–10m is inside).
5. **Carried, still unseen from DJ–DQ**: the neon on the black portal, the
   no-gold arch, the netherworld at 4.42m, FLOOR/PRE-SHOW/UP on the sign,
   all three deck parks entering from stage right (stage left empty — still
   the thing he may want back), the glow halos reading 42–52% smaller in the
   headset than on the desk (the clamp uses the desk frustum).

## STILL HIS TO DECIDE (carried)

- **The neon rake** — DG turns his own CY lean off; `BJ_NEON_RAKE_ON`, one
  line in p5h AND one in p4, coupled deliberately.
- **The sign's red at GO** (one line), **the cemetery's missing park**,
  **181MB of models** (meshopt works on r128 today — the decoder is published
  and p5i's loader carries `setMeshoptDecoder`; KTX2 is a hand-port either
  way), **the graveyard** (still unsupplied, the show opens in it),
  **the audio join at 4292**, **the house floor pool**, **a park stated as an
  absolute line** (CT), **`BLIND_BODY`** (a blinder cannot be carried),
  **`pr6.json`** (still untracked, still unruled), **the `envTrack` rota
  backstop** (deferred: new per-frame machinery was his call; the audit
  measured the gap at 5 unhooked show materials, all non-metals, graceful via
  the mix-0 bypass).
- **The next perf bites, recorded but not taken**: room-gating the Palace's
  own 12 point lights (the work lights carry 40m of range — it changes the
  picture); the FLY system's 109 draws; `LIGHTNING`'s flappy gate (no stable
  armed flag). All written at their sites.
- `tests/smoke.js` still flakes under full-suite load (rerun standalone —
  it passes; not a regression).

## NEW ENGINE PIECES THIS ROUND

- **`envCarrier(m)` / `ENV_TEX` / `ENV_METAL_MIN` (p2, DT)** — the one rule
  for who samples the environment: `metalness >= 0.5` OR no metalness at all
  (the spec-gloss import deletes the property; **a missing number means
  YES**). The atm/grade hook (`atmTrack`) still reaches EVERY material —
  envTrack narrows only the envMap half, and the narrowing must stay BELOW
  the hook (asserted, 565/565).
- **`gradeCompose()` / `gradeMat`+`gradeOff` (p2/p4, DU)** — the grade as one
  CPU-composed matrix, recomposed once per frame in updateRig (the LIGHTING
  rows write GRADE fields with no notification). The derivation is above the
  function; a FIFTH grade step must re-derive the closed form, not extend the
  loop.
- **`vrConsoleSeen()` / `VR_SEE_CONSOLE` 12 (p9, DV)** — the cadence gate.
  Interaction (`vrDrawConsole(true)`) never asks. `drawT` deliberately not
  reset while out of range, so return repaints on the first frame.
- **`mergeShell()` / `BODY_MERGE` (p4, DY)** — per-material static-shell
  merging inside every body builder; yoke/head Groups skipped (they move),
  LENSM pieces never merged (they recolour), negative scale refused (flipped
  winding is the one failure the tests cannot see), handles re-pointed.
  All 117 bodies across three stages share FIXG buffers per type.
- **`tools/draws.js` (DX)** — the census probe, self-checked so it cannot
  print a confident lie. **`DY_CEIL`** in tests/stages.js pins the boot view.

## Feel constants for the headset (unchanged unless noted)

Everything from the DJ–DQ round stands (see the ROBLOX-round block below) with
one semantic change: **`ENV_INTENSITY` (the LIGHTING page's env row) now
drives only the envMap carriers** — the metals — which is what the row's VR
label (EnvSpecular) always said. `VR_SEE_CONSOLE` 12 is the one new tunable.

In `p2`: `ENV_INTENSITY` 0.55, `ENV_HALF` 10, `ENV_METAL_MIN` 0.5; `ATM`
density 0.0055 / height 9.0 / haze 1.8 / glare 0.4 / mix 0.75; `GRADE`
contrast 0.12 / sat −0.05 / tint 0xffeedd / mix 1.0. In `p4`:
`GLOW_MAX_FRAC` 0.22, `GLOW_SIZE` 1.9, `GLOW_MIN_LVL` 0.04, `GLOW_LENS_OUT`
0.45, `GLOW_CONE` 2.2, `GLOW_CAP` 64, `BODY_MERGE` true. In `p9`:
`VR.glowCap` 12, `VR_SEE_CONSOLE` 12.

The Beetlejuice constants (neon, sign, parks, netherworld, budgets) are
unchanged from the DI/DQ record — see the park table and constants blocks in
HANDOFF's earlier sections; they were not this round's subject.

## Standing facts

Suite count is **19** (`npm test` in tests/) — probe-lint runs first and is a
test of the TESTS. The patch is 39 channels on every stage. RULING AV still
governs; AO stays repealed; RULING B still holds; BB untouched. **Every
timestamp in the Beetlejuice plot is a position in his WHOLE recording.**
**His photographs are never committed.** three.js has **no multiview at any
version** and the UMD build dies after r160.1 — r160.1 is the ceiling and
PR 10 of the old plan stays CUT.

## Shelved

**Nothing.**
