# Roblox-style Lighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the house Roblox's lighting *look* (environment, atmosphere, colour grade, glow) and Roblox's lighting *authoring model* (a LIGHTING panel on both surfaces, droppable light objects), in VR and on the desktop, without losing a frame.

**Architecture:** Nine PRs land on three.js **r128 as it stands** — every piece of layer 1 and layer 2 is achievable on the current version, so nothing here bets on a migration. The upgrade is PR 10, separately justified and droppable. Layer 1 goes in as **shader-chunk patches** (fog, tonemapping) plus `scene.environment`, so one change reaches the shared `M` table and every imported GLTF material at once. Route 2's bloom substitute is an **additive instanced glow plane per lit emitter**, driven off the `f._lvl` the rig already computes each frame, capped in screen space and truncated by `InstancedMesh.count`.

**Tech Stack:** three.js r128 (UMD global `THREE`, CDN), no build step beyond `sh build.sh`, jsdom + real three.js test harness, WebXR on Quest 3.

---

## Findings that changed this plan — read before starting

Four things were verified against the code and the network during planning. Two of them contradict advice given earlier in the conversation.

**1. `three.js` has no multiview, at any version.** Grepping the actual published builds for `multiview` returns **zero** occurrences in r128, r160, r162 *and* r170. The −15% to −30% frame-time credit quoted for the upgrade was predicated on multiview and **does not exist**. The upgrade's real wins are the asset pipeline (KTX2/Basis, `EXT_meshopt_compression`) and 32 releases of fixes — load time and memory, not frame time. PR 10 is written on that honest basis.

**2. The UMD build disappears after r160.** Verified on unpkg: `build/three.min.js` returns HTTP 200 for r128 … r160.1 and **404 from r161 onward**. The game loads three.js as a UMD global from a CDN ([p1.txt:915](../../../src/p1.txt)) and relies on function declarations hoisting across all 30 concatenated parts (TRAPS). ESM breaks both. **r160.1 is the hard ceiling** unless the single-file architecture is abandoned, which is not in scope here.

**3. The wrist meter already exists — the earlier suggestion to "put the frame time in the headset" was already done.** `vrPerf` / `vrDrawMeter` ([p9.txt:130](../../../src/p9.txt)) keeps a 120-frame ring buffer and draws avg ms, peak ms and current foveation on the left wrist, green under budget and red over. PR 1 only *adds two numbers* to an instrument that is already there.

**4. The budget is 13.9ms, not 11.1ms, and foveation is a live governor.** `vrOnStart` asks for the lowest supported rate ≥ 72Hz because **"the first headset run could not hold [90]"** ([p9.txt:199](../../../src/p9.txt)). And `vrPerf` runs a closed feedback loop on foveation: +0.15 toward 1.0 when avg > budget × 1.06, −0.05 when avg < budget × 0.82. The earlier claim that "autoTune has no working lever in VR" was wrong — desktop `autoTune` is indeed inert in a session, but VR has its own separate governor.

**Consequence for route 1 vs route 2 — this is now decisive.** Foveation is the engine's *only* mid-session defence. A hand-rolled stereo composer renders into its own target and forfeits driver fixed-foveated rendering, which means route 1 would buy bloom by **removing the safety net**. Route 2 is the plan. Route 1 is not in this document.

---

## Conventions every PR in this chain must follow

Non-negotiable, from CLAUDE.md, WORKFLOW.md and TESTING.md. Read them once here; each PR names only its own specifics.

**The chain.** One concern per PR. **Never stack.** Base every PR on `main`, and **verify the base really is `main` after opening**. Open PR N+1 only after PR N merges — rebase onto fresh `main`, `sh build.sh`, full suite, then open.

**Build and commit.** `the-house.html` is committed **built**. After editing any `src/*.txt`: `sh build.sh`, then commit **both** the source and the built file. **Never sort or reorder `build.sh`.**

**Tests.** All 19 suites green **before and after** every change: `cd tests && npm test`. Run `node probe-lint.js` after every probe edit.

**The negative check, which is the discipline this project actually runs on.** For every new assertion:
1. Apply a mutation to `src/`, `sh build.sh`.
2. **Prove the mutation is present in the BUILT file** (`grep` it in `the-house.html`).
3. **Prove the mutation changed the build** (`the-house.html` byte count or hash differs from baseline).
4. Run the suite; the new assertion must **FAIL**.
5. Revert, rebuild, confirm `the-house.html` is **byte-identical** to the baseline.
6. Run the suite; green.

A mutation that lands in the text but not the behaviour reads exactly like an assertion that does not fire. A mutation can also trip a *guard* and never reach the clause you meant to test — check which clause failed, not just that something did.

**This machine.** PowerShell 5.1 mangles quoted `git commit -m` — write the message to a file and use `git commit -F`. Never `git add -A` while agent worktrees exist under `.claude/`. Commits use `Jackscreations21 <314018971+Jackscreations21@users.noreply.github.com>`.

**Opening the PR.** `gh` is not installed. Write the JSON to the **scratchpad** (not `/tmp`, not the repo root — `pr6.json` in the root is still untracked and unruled because someone did that once), then:

```bash
token=$(printf "protocol=https\nhost=github.com\n" | git credential fill | sed -n 's/^password=//p')
curl -s -X POST -H "Authorization: token $token" -H "Accept: application/vnd.github+json" \
  --data-binary @"$SCRATCH/pr-body.json" \
  https://api.github.com/repos/Jackscreations21/gms-theater-game/pulls
```

**Rulings.** The sequence is at **DI**. This round takes **DJ** through **DQ**, one per PR, written into the spec and cited in the code comment that implements it.

**Cache-bust.** `?v=27` today. Bump to **`?v=28`** in PR 1 and leave it — the Quest browser caches hard, and one bump covers the round.

**What jsdom cannot answer.** Frame rate, legibility and feel. Every such question goes on the HANDOFF headset checklist, not into an assertion.

**THE TEST CODE IN THIS PLAN IS PSEUDOCODE — DO NOT PASTE IT.** Found while building Task 1. Every task below writes assertions as `assert(W.thing, 'name')` against a `boot()` harness. **Neither exists.** Both `tests/vr.js` and `tests/full14.js` use `P(name, fn)` — a named case that **throws** on failure and **returns a summary string** on success (`vr.js:61`, `full14.js:53`) — and both eval the game script in their own scope, so game globals are reached bare (`VR`, `renderer`, `FIXTURES`), never through a `W.` prefix. Both files are also **probe templates inside backticks**, so the TESTING.md rule applies to every line added: **no backtick anywhere, including in a comment**, and run `node probe-lint.js` after editing. Read the neighbouring cases and copy their shape; treat the blocks below as a statement of what to assert, not as code.

**And `?v=N` is not in the source.** It is a query parameter typed onto the URL to defeat the Quest browser cache. Task 1 Step 6's instruction to edit it in `src/p1.txt` is wrong — there is nothing there to edit. Bumping it means recording the new number in STATE.md and HANDOFF.md.

---

## File structure

| File | Responsibility | PRs |
|---|---|---|
| `src/p2.txt` | renderer, `scene.fog`, `M` table, `UniformsLib` patches, `scene.environment`, the grade chunk | 2, 3, 4 |
| `src/p4.txt` | `updateRig`, the light pool, glow-plane build + per-frame drive, the light-object facade | 2, 3, 5, 8 |
| `src/p9.txt` | wrist meter, `VR.glowCap`, the VR LIGHTING page | 1, 5, 7 |
| `src/p1.txt` | the desk LIGHTING panel DOM + cache-bust | 1, 6 |
| `src/p7.txt` | desk panel wiring | 6 |
| `tests/vr.js` | meter numbers, `VR.glowCap`, the VR page | 1, 5, 7 |
| `tests/full14.js` | environment, fog, grade, glow geometry | 2, 3, 4, 5 |
| `tests/show.js` | the light-object facade against the pool | 8 |
| `tools/glow.js` | **new probe** — counts glow instances and their screen coverage | 5 |
| `docs/superpowers/specs/2026-08-13-roblox-lighting-design.md` | **written already** — rulings DJ–DQ, the reasoning, the rejected alternatives. **Read first.** | committed in 1 |

---

## Task 0: Baseline — **TAKEN, 2026-08-13, and it changed the round**

**25ms in the empty Palace with nothing loaded. 48ms in Beetlejuice** — 1.8× and
3.5× over the 13.9ms budget, and the 48 was **clamped** (see RULING DJ). Foveation is
pegged at 1.00 and has no travel left. **Read [the spec's §7.2](../specs/2026-08-13-roblox-lighting-design.md)
before starting Task 2:** a performance investigation belongs between Task 1 and Task
2, PRs 2–5 all add per-pixel cost to a build that cannot afford it, and **Task 10 is
cut** — its justification does not need the upgrade and could not fix an empty house
anyway. The original text of this task is kept below as the record of what was asked.

## Task 0 (as originally written): Baseline, and it is his to take

**This is not code and not a PR.** Everything downstream is judged against it and there is no baseline on record.

- [ ] **Step 1: Ask him for four wrist-meter readings**

The meter is already on his left wrist. At `?v=27`, in a session, glance at it and read `avg ms`, `pk` and `fov` at four moments:

1. Standing in the empty Palace, house lights up, no show loaded.
2. Beetlejuice loaded, pre-show, sign lit.
3. The 1:00 cue — proscenium and sign red, eight blinders in.
4. Standing at the proscenium looking up into the neon frame.

- [ ] **Step 2: Write them into HANDOFF.md's headset checklist**

Four lines. Without them, every performance claim in PRs 2–5 is an estimate, and PR 10's justification cannot be evaluated at all.

---

## Task 1: The wrist meter reports draw calls and triangles

**Ruling DJ.** Multiview does not exist, so the only lever on draw calls is our own batching — and nothing currently reports the count where it can be read. `renderer.info` has both numbers for free.

**Files:**
- Modify: `src/p9.txt` — `vrDrawMeter` at [p9.txt:153](../../../src/p9.txt), `vrPerf` at [p9.txt:130](../../../src/p9.txt)
- Modify: `src/p1.txt:915` area — cache-bust to `?v=28`
- Create: `docs/superpowers/specs/2026-08-13-roblox-lighting-design.md`
- Test: `tests/vr.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/vr.js` (use the **end** anchor — different branches take different anchors to avoid textual conflict):

```js
/* RULING DJ — the wrist meter reports draw calls and triangles, so the one
   number multiview would have moved is legible in the headset. */
{
  const W = boot();                    // the suite's existing harness entry
  W.VR = W.VR || {};
  W.VR.active = true;
  W.VR.grips = [ new W.THREE.Group() ];
  W.VR.targetHz = 72;
  W.VR.perf = null;
  for(let i=0;i<40;i++) W.vrPerf(1/72);   // fill the window past its 30-frame gate
  W.VR.perf.t = 1;                        // force the 0.5s judge
  W.vrPerf(1/72);
  assert(typeof W.VR.perf.calls === 'number', 'DJ: meter records draw calls');
  assert(typeof W.VR.perf.tris  === 'number', 'DJ: meter records triangle count');
  assert(W.VR.meter && W.VR.meter.tex, 'DJ: the meter still draws');
}
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd tests && node vr.js
```
Expected: FAIL — `DJ: meter records draw calls`, because `VR.perf` has no `calls` field.

- [ ] **Step 3: Record the two numbers in `vrPerf`**

In `src/p9.txt`, in `vrPerf`, immediately after `P.avg = sum/P.n; P.worst = worst;` (line ~141):

```js
  /* RULING DJ — three.js has no multiview at any version, so both eyes cost
     two passes and the only lever on draw calls is our own batching.  Report
     it where it can be read: renderer.info costs nothing to ask. */
  P.calls = renderer.info.render.calls;
  P.tris  = renderer.info.render.triangles;
```

- [ ] **Step 4: Draw them, and give the canvas the room**

In `vrDrawMeter`, change the canvas and plane (they must keep their aspect or the wrist plate skews) — replace `const c = cvs(256, 96);` with `const c = cvs(256, 128);` and `new T.PlaneGeometry(0.08, 0.03)` with `new T.PlaneGeometry(0.08, 0.04)`. Replace `g.clearRect(0,0,256,96)` and the `fillRect` with `256,128`. Then after the existing `pk · fov` line:

```js
  g.font = '500 22px Helvetica, Arial, sans-serif';
  g.fillStyle = '#8b95a3';
  g.fillText((P.calls|0) + ' calls · ' + Math.round((P.tris|0)/1000) + 'k tri', 10, 104);
```

- [ ] **Step 5: Build, test, negative-check**

```bash
sh build.sh && cd tests && npm test
```
Expected: `built ... syntax OK`, then all 19 suites at `--- failures: 0 ---`.

Negative check: change `P.calls = renderer.info.render.calls;` to `P.calls = undefined;`, rebuild, `grep -c "P.calls = undefined" the-house.html` → must be ≥ 1, byte count must differ from baseline, `node vr.js` must FAIL on `DJ: meter records draw calls`. Revert, rebuild, confirm byte-identical, retest.

- [ ] **Step 6: Bump the cache-bust**

In `src/p1.txt`, change the `?v=27` cache-buster to `?v=28`.

The spec **already exists** at [`docs/superpowers/specs/2026-08-13-roblox-lighting-design.md`](../specs/2026-08-13-roblox-lighting-design.md) — written in the planning session, carrying rulings DJ–DQ, the four findings, the route-1 rejection and the Unity/Unreal verdict. **Read it before Task 2; its rulings are binding.** It is untracked until this PR, so commit it here.

- [ ] **Step 7: Commit and open the PR**

```bash
git checkout -b lighting-meter-info
git add src/p9.txt src/p1.txt the-house.html tests/vr.js docs/superpowers/specs/2026-08-13-roblox-lighting-design.md
git commit -F "$SCRATCH/msg.txt"
git push -u origin lighting-meter-info
```

---

## Task 2: `scene.environment` — the metals stop rendering black

**Ruling DK.** Nothing sets `scene.environment`. Every imported GLTF material is a `MeshStandardMaterial` with `envMapIntensity = 1` and no environment to sample, so every metal surface in his 181MB of models renders near-black. This is the largest visible change per line in the whole round.

**Files:**
- Modify: `src/p2.txt` — after the renderer block ([p2.txt:116](../../../src/p2.txt))
- Modify: `src/p4.txt` — `updateRig`, near the `bed` computation (line ~1121)
- Test: `tests/full14.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/full14.js`:

```js
/* RULING DK — the room has an environment, so imported metal is not black. */
{
  assert(W.scene.environment && W.scene.environment.isTexture,
         'DK: scene.environment is a texture');
  assert(typeof W.ENV_INTENSITY === 'number' && W.ENV_INTENSITY > 0,
         'DK: ENV_INTENSITY is a live constant');
  const m = new W.THREE.MeshStandardMaterial({metalness:1, roughness:0.2});
  W.envApply(m);
  assert(m.envMapIntensity === W.ENV_INTENSITY,
         'DK: envApply sets an imported material to the house intensity');
}
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd tests && node full14.js
```
Expected: FAIL — `DK: scene.environment is a texture`.

- [ ] **Step 3: Build the environment with core three.js only**

`RoomEnvironment` lives in `examples/jsm` and the CDN UMD bundle does not carry it, so build the source scene by hand. In `src/p2.txt`, after `renderer.toneMappingExposure = 1.35;`:

```js
/* ============================================================================
   RULING DK — THE ROOM HAS AN ENVIRONMENT.
   Nothing set scene.environment, and every material arriving from a GLTF is a
   MeshStandardMaterial carrying envMapIntensity 1 with nothing to sample — so
   every metal surface in his models rendered near-black.  This is the diffuse
   and specular ambience Roblox calls EnvironmentDiffuseScale /
   EnvironmentSpecularScale.
   NOT RoomEnvironment: that is examples/jsm and the CDN UMD build has no
   addons.  A six-plane box of emissive greys is enough — an interior's
   ambience is a dark ceiling, a mid floor and dim walls, and PMREM only ever
   sees it blurred.
   ONE knob, not two: r128's standard material scales diffuse and specular
   together through envMapIntensity.  Splitting them is a chunk patch and it
   waits for RULING DM's grade work rather than being faked here.
   ========================================================================== */
const ENV_INTENSITY = 0.55;
let ENV_RT = null;
function envBuild(){
  const es = new T.Scene();
  const face = (col, w, h, pos, rot)=>{
    const m = new T.Mesh(new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({color:col, side:T.DoubleSide}));
    m.position.set(pos[0], pos[1], pos[2]);
    if(rot) m.rotation.set(rot[0], rot[1], rot[2]);
    es.add(m);
  };
  face(0x0a0c12, 40, 40, [0, 20, 0], [ Math.PI/2, 0, 0]);   // ceiling, darkest
  face(0x24262b, 40, 40, [0,  0, 0], [-Math.PI/2, 0, 0]);   // floor, mid
  face(0x14171d, 40, 20, [0, 10,-20], [0, 0, 0]);           // walls
  face(0x14171d, 40, 20, [0, 10, 20], [0, Math.PI, 0]);
  face(0x11141a, 40, 20, [-20, 10, 0], [0,  Math.PI/2, 0]);
  face(0x11141a, 40, 20, [ 20, 10, 0], [0, -Math.PI/2, 0]);
  const pm = new T.PMREMGenerator(renderer);
  ENV_RT = pm.fromScene(es, 0.04);
  pm.dispose();
  es.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material) o.material.dispose(); });
  scene.environment = ENV_RT.texture;
}
function envApply(m){
  if(!m || !('envMapIntensity' in m)) return;
  m.envMapIntensity = ENV_INTENSITY;
}
envBuild();
```

- [ ] **Step 4: Reach the imported materials**

`envApply` must run over every material arriving from a GLTF. In `src/p5i.txt` find the existing per-material sweep that `bjApplyModel` runs over imported meshes (the one that registers materials for the RULING CC set fill) and add `envApply(mat)` inside it, beside the existing emissive work. Do **not** write a second traversal — one sweep, one pass.

- [ ] **Step 5: Let the room's own light move it**

A fixed environment lights a blackout as brightly as a full stage. In `src/p4.txt`, in `updateRig`, immediately after `scene.fog.color.setRGB(...)` (line ~1125):

```js
  /* RULING DK — the environment is ambience, so it follows the bed the room
     actually has.  A fixed environment lights a blackout as brightly as a
     full stage, which is the exact fault RULING BH fixed for the ambient. */
  scene.environmentIntensity = undefined;            // r128 has no such field
  ENV_LIVE = ENV_INTENSITY * (0.25 + 0.75*bed);
```

and declare `let ENV_LIVE = ENV_INTENSITY;` beside `ENV_INTENSITY` in `p2`. Then in `envApply`, use `ENV_LIVE`. Because r128 has no scene-level environment intensity, the per-frame drive has to walk the registered imported materials — reuse the array the CC set fill already keeps rather than traversing the scene.

- [ ] **Step 6: Build, test, negative-check**

```bash
sh build.sh && cd tests && npm test
```

Negative check: change `ENV_INTENSITY = 0.55` to `0`, rebuild, prove present and prove changed, `node full14.js` must FAIL on `DK: ENV_INTENSITY is a live constant`. Revert, rebuild, byte-identical, retest.

- [ ] **Step 7: Commit and open the PR** (branch `lighting-environment`, same recipe as Task 1 Step 7)

---

## Task 3: Atmosphere — height fog with haze and glare

**Ruling DL.** `scene.fog` is a flat `FogExp2` at density 0.0055 whose colour is driven off the light bed. Roblox's Atmosphere is height-based with a haze term and a sun glare. The patch goes into the fog chunks so it reaches every `fog: true` material — including the smoke — without touching a single material by hand.

**The load-order requirement:** `THREE.UniformsLib.fog` is merged into every fog-enabled material's uniforms **at compile time**, so the extension must happen in `p2` **before any material is created**. `p2` is second in `build.sh` and every material lives at or after it. This is why the part order is load-bearing.

**Files:**
- Modify: `src/p2.txt` — the fog block ([p2.txt:114](../../../src/p2.txt))
- Modify: `src/p4.txt` — `updateRig` fog drive (line ~1125)
- Test: `tests/full14.js`

- [ ] **Step 1: Write the failing test**

```js
/* RULING DL — the atmosphere is height-based, and every fogged material
   can see the new uniforms. */
{
  const U = W.THREE.UniformsLib.fog;
  assert(U.atmHeight && typeof U.atmHeight.value === 'number',
         'DL: fog uniforms carry atmHeight');
  assert(U.atmHaze && U.atmGlare, 'DL: fog uniforms carry haze and glare');
  const src = W.THREE.ShaderChunk.fog_fragment;
  assert(/atmHeight/.test(src), 'DL: the fog fragment chunk uses atmHeight');
  assert(/vAtmY/.test(W.THREE.ShaderChunk.fog_vertex),
         'DL: the fog vertex chunk passes world height');
  assert(W.ATM.density > 0 && W.ATM.height > 0, 'DL: ATM is a live constant block');
}
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd tests && node full14.js
```
Expected: FAIL — `DL: fog uniforms carry atmHeight`.

- [ ] **Step 3: Extend the fog uniforms and patch all four chunks**

In `src/p2.txt`, replace `scene.fog = new T.FogExp2(0x07080e, 0.0055);` with:

```js
/* ============================================================================
   RULING DL — THE ATMOSPHERE IS HEIGHT-BASED, WITH HAZE AND GLARE.
   A flat FogExp2 fogs the grid as heavily as the deck.  Roblox's Atmosphere is
   height-banded with a haze lift and a glare term, and the theatre wants it:
   haze pools low and the fly tower should stay clear.
   PATCHED INTO THE CHUNKS, NOT PER MATERIAL, because UniformsLib.fog is merged
   into every fog-enabled material at compile time — one patch reaches the
   shared M table, the smoke (p5e sets fog:true explicitly) and every imported
   GLTF material at once.  IT MUST RUN IN p2, BEFORE ANY MATERIAL EXISTS.
   The FogExp2 stays: it is what makes three.js emit the fog code path at all.
   ========================================================================== */
const ATM = { density:0.0055, height:9.0, haze:1.8, glare:0.4 };
scene.fog = new T.FogExp2(0x07080e, ATM.density);

T.UniformsLib.fog.atmHeight = { value: ATM.height };
T.UniformsLib.fog.atmHaze   = { value: ATM.haze };
T.UniformsLib.fog.atmGlare  = { value: ATM.glare };

T.ShaderChunk.fog_pars_vertex = T.ShaderChunk.fog_pars_vertex +
  '\n#ifdef USE_FOG\n varying float vAtmY;\n#endif\n';
T.ShaderChunk.fog_vertex = T.ShaderChunk.fog_vertex +
  '\n#ifdef USE_FOG\n vAtmY = (modelMatrix * vec4(position, 1.0)).y;\n#endif\n';
T.ShaderChunk.fog_pars_fragment = T.ShaderChunk.fog_pars_fragment +
  '\n#ifdef USE_FOG\n varying float vAtmY;\n uniform float atmHeight;\n' +
  ' uniform float atmHaze;\n uniform float atmGlare;\n#endif\n';
T.ShaderChunk.fog_fragment =
  '#ifdef USE_FOG\n' +
  '  #ifdef FOG_EXP2\n' +
  '    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );\n' +
  '  #else\n' +
  '    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );\n' +
  '  #endif\n' +
  '  float atmBand = 1.0 - clamp( vAtmY / max( atmHeight, 0.001 ), 0.0, 1.0 );\n' +
  '  fogFactor *= mix( 1.0, atmBand * atmHaze, 0.75 );\n' +
  '  fogFactor = clamp( fogFactor, 0.0, 1.0 );\n' +
  '  vec3 atmCol = fogColor * ( 1.0 + atmGlare * fogFactor );\n' +
  '  gl_FragColor.rgb = mix( gl_FragColor.rgb, atmCol, fogFactor );\n' +
  '#endif\n';
```

**Note on `vFogDepth`:** r128's fog chunks use `vFogDepth`. Confirm the varying's name in the r128 build before trusting this block — `grep -o 'vFogDepth' the-house.html` will not find it (three.js is a CDN fetch), so check against `https://unpkg.com/three@0.128.0/build/three.module.js`. If r128 uses `fogDepth` instead, substitute it throughout; getting this wrong produces a shader compile error that surfaces through the `__glErr` catcher at [p1.txt:938](../../../src/p1.txt), not a test failure.

- [ ] **Step 4: Drive it off the bed each frame**

In `src/p4.txt`, `updateRig`, right after the existing `scene.fog.color.setRGB(...)`:

```js
  /* RULING DL — haze thickens as the room darkens and the glare rides the
     rig, so a full stage in smoke blooms at the edges and a blackout does
     not.  Uniform objects are shared by every fogged material, so one write
     here reaches all of them. */
  T.UniformsLib.fog.atmHaze.value  = ATM.haze * (1.35 - 0.35*bed);
  T.UniformsLib.fog.atmGlare.value = ATM.glare * Math.min(1, bedRig*1.4);
```

- [ ] **Step 5: Build, test, and check the shader actually compiled**

```bash
sh build.sh && cd tests && npm test && node real.js
```
Expected: 19 suites green, and `real.js` reporting `"fatal": null`. **jsdom stubs `WebGLRenderer`, so it will never compile this shader** — a broken chunk passes every suite. The compile is verified in a browser: load the built file and confirm `window.__glErr` is falsy.

- [ ] **Step 6: Negative-check**

Change `atmBand * atmHaze` to `atmBand * 0.0`, rebuild, prove present and prove changed. The suite cannot catch a shader-body change — so the assertion being negative-checked here is the **uniform and chunk wiring**, not the maths. Instead mutate `T.UniformsLib.fog.atmHeight = { value: ATM.height };` to delete the line: `node full14.js` must FAIL on `DL: fog uniforms carry atmHeight`. Revert, rebuild, byte-identical, retest. **State plainly in the PR body that the shader body itself is covered by a browser check and not by an assertion.**

- [ ] **Step 7: Commit and open the PR** (branch `lighting-atmosphere`)

---

## Task 4: The colour grade

**Ruling DM.** Roblox's `ColorCorrectionEffect` is a post-tonemap curve — brightness, contrast, saturation, tint. ACES already sits at exactly that point in the pipeline, so the grade goes into the tonemapping chunk. Unlike fog there is no `UniformsLib` for tonemapping, so the uniforms travel through one shared object and an `onBeforeCompile` helper that every material must pass through — which is a **new invariant** and goes into INVARIANTS.md.

**Files:**
- Modify: `src/p2.txt` — after the DL block
- Modify: `src/p4.txt` — per-frame grade drive
- Modify: `docs/guide/INVARIANTS.md`
- Test: `tests/full14.js`

- [ ] **Step 1: Write the failing test**

```js
/* RULING DM — the grade rides the tonemapping stage, and gradeApply wires
   a material to the shared uniform block. */
{
  assert(W.GRADE && W.GRADE.u && W.GRADE.u.gradeSat, 'DM: GRADE holds uniforms');
  assert(/gradeSat/.test(W.THREE.ShaderChunk.tonemapping_pars_fragment),
         'DM: the tonemapping chunk carries the grade');
  const m = new W.THREE.MeshStandardMaterial();
  W.gradeApply(m);
  assert(typeof m.onBeforeCompile === 'function', 'DM: gradeApply hooks the compile');
  const sh = { uniforms:{} };
  m.onBeforeCompile(sh);
  assert(sh.uniforms.gradeSat === W.GRADE.u.gradeSat,
         'DM: the material shares the ONE uniform object, not a copy');
  assert(W.M.serge.userData.graded === true,
         'DM: the shared M table went through gradeApply at build time');
}
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd tests && node full14.js
```
Expected: FAIL — `DM: GRADE holds uniforms`.

- [ ] **Step 3: Patch the tonemapping chunk and write the helper**

In `src/p2.txt`, after the RULING DL block:

```js
/* ============================================================================
   RULING DM — THE COLOUR GRADE RIDES THE TONEMAPPING STAGE.
   Roblox's ColorCorrectionEffect is a post-tonemap curve, and ACES already
   sits at that point, so this is a chunk patch and not a composer pass — it
   costs nothing, it works in both eyes, and it keeps fixed foveation, which a
   hand-rolled stereo composer would forfeit.  Foveation is the only governor
   vrPerf has (p9); trading it for bloom would be trading the safety net.
   NO UniformsLib FOR TONEMAPPING, unlike fog — so ONE shared uniform object
   travels via onBeforeCompile, and every material must pass through
   gradeApply.  That is an invariant, and it is in INVARIANTS.md.
   ========================================================================== */
const GRADE = {
  bright:0.0, contrast:0.12, sat:-0.05, tint:0xffeedd,
  u:{ gradeBC:{value:new T.Vector2(0.0, 0.12)},
      gradeSat:{value:-0.05},
      gradeTint:{value:new T.Color(0xffeedd)} }
};
T.ShaderChunk.tonemapping_pars_fragment = T.ShaderChunk.tonemapping_pars_fragment +
  '\nuniform vec2 gradeBC;\nuniform float gradeSat;\nuniform vec3 gradeTint;\n' +
  'vec3 houseGrade( vec3 c ){\n' +
  '  c += gradeBC.x;\n' +
  '  c = ( c - 0.5 ) * ( 1.0 + gradeBC.y ) + 0.5;\n' +
  '  float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );\n' +
  '  c = mix( vec3( l ), c, 1.0 + gradeSat );\n' +
  '  c *= gradeTint;\n' +
  '  return max( c, vec3( 0.0 ) );\n' +
  '}\n';
T.ShaderChunk.tonemapping_fragment =
  '#if defined( TONE_MAPPING )\n' +
  '  gl_FragColor.rgb = houseGrade( toneMapping( gl_FragColor.rgb ) );\n' +
  '#endif\n';

function gradeApply(m){
  if(!m || m.userData.graded) return m;
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = function(sh, rn){
    if(prev) prev.call(this, sh, rn);
    sh.uniforms.gradeBC   = GRADE.u.gradeBC;      // the SAME object, never a copy —
    sh.uniforms.gradeSat  = GRADE.u.gradeSat;     // a copy would freeze at build time
    sh.uniforms.gradeTint = GRADE.u.gradeTint;
  };
  m.userData.graded = true;
  m.needsUpdate = true;
  return m;
}
```

- [ ] **Step 4: Route the shared table and the raw materials through it**

Two groups do **not** get tonemapping for free and must be handled by name, or half the picture ends up ungraded:

1. **The `M` table.** After `M` is fully populated in `p2`, add `Object.keys(M).forEach(k=>{ if(M[k] && M[k].isMaterial) gradeApply(M[k]); });`
2. **The beam shader and the additive gobo planes.** The beam material is a raw `ShaderMaterial` ([p4.txt:86](../../../src/p4.txt)) and the gobo flares are `MeshBasicMaterial` with `AdditiveBlending` ([p4.txt:564](../../../src/p4.txt), [p4.txt:572](../../../src/p4.txt)). A raw `ShaderMaterial` never includes the tonemapping chunk at all. **Set `toneMapped = false` on all three and leave them out of the grade deliberately** — additive light sources graded twice (once as themselves, once through the surfaces they light) double-apply the tint. Write that reasoning into the comment; it is the kind of thing that gets "fixed" later by someone who reads it as an omission.
3. **Imported GLTF materials.** Add `gradeApply(mat)` to the same single sweep that Task 2 Step 4 touched.

- [ ] **Step 5: Drive it and record the invariant**

In `src/p4.txt`, `updateRig`, after the DL lines:

```js
  /* RULING DM — nothing animates the grade today; it is his to tune from the
     panel (DO).  The write stays here so a cue can reach it later without a
     second place to look. */
  GRADE.u.gradeBC.value.set(GRADE.bright, GRADE.contrast);
  GRADE.u.gradeSat.value = GRADE.sat;
  GRADE.u.gradeTint.value.set(GRADE.tint);
```

Add to `docs/guide/INVARIANTS.md`:

```markdown
- **Every material must pass through `gradeApply` (RULING DM).** The colour
  grade travels on ONE shared uniform object via `onBeforeCompile`; a material
  that skips it renders ungraded, and a material that copies the uniform
  instead of sharing it freezes at build time. The `M` table, the imported-GLTF
  sweep and every new material creation go through it. The beam shader and the
  additive gobo planes are `toneMapped = false` **on purpose** — additive light
  graded twice double-applies the tint.
```

- [ ] **Step 6: Build, test, negative-check**

```bash
sh build.sh && cd tests && npm test
```

Negative check: in `gradeApply`, change `sh.uniforms.gradeSat = GRADE.u.gradeSat;` to `sh.uniforms.gradeSat = { value: GRADE.u.gradeSat.value };`. Rebuild, prove present and prove changed. `node full14.js` must FAIL on `DM: the material shares the ONE uniform object, not a copy` — this is the mutation that matters, because a copied uniform is the failure mode that would look correct on load and then never change again. Revert, rebuild, byte-identical, retest.

- [ ] **Step 7: Commit and open the PR** (branch `lighting-grade`)

---

## Task 5: Route 2 — additive glow planes, capped

**Ruling DN.** The bloom substitute. One additive instanced plane per lit emitter, driven off the `f._lvl` `updateRig` already computes, with a **screen-space radius clamp** so a source close to the face cannot fill the display, and `InstancedMesh.count` truncation so dark fixtures cost nothing. `VR.beamCap` (10) is the precedent — additive geometry in haze is overdraw, and it is already capped for exactly this reason.

**Files:**
- Modify: `src/p4.txt` — build near the pool ([p4.txt:480](../../../src/p4.txt)), drive at the end of `updateRig`
- Modify: `src/p9.txt` — `VR.glowCap` beside `VR.beamCap` ([p9.txt:70](../../../src/p9.txt), [p9.txt:93](../../../src/p9.txt))
- Create: `tools/glow.js`
- Test: `tests/full14.js`, `tests/vr.js`

- [ ] **Step 1: Write the failing test**

```js
/* RULING DN — glow planes exist, are ONE draw call, skip dark fixtures, and
   clamp their screen size. */
{
  assert(W.GLOW && W.GLOW.mesh && W.GLOW.mesh.isInstancedMesh,
         'DN: the glow is one InstancedMesh');
  assert(W.GLOW.mesh.material.blending === W.THREE.AdditiveBlending,
         'DN: additive');
  assert(W.GLOW.mesh.material.depthWrite === false, 'DN: no depth write');
  assert(W.GLOW.mesh.material.side === W.THREE.FrontSide,
         'DN: FrontSide — a camera-facing plane needs one face, not two');
  // every fixture dark -> nothing drawn at all
  W.FIXTURES.forEach(f=>{ f._lvl = 0; });
  W.glowUpdate(W.camera);
  assert(W.GLOW.mesh.count === 0, 'DN: a dark rig draws zero glow instances');
  // one fixture lit -> exactly one instance
  W.FIXTURES[0]._lvl = 1;
  W.glowUpdate(W.camera);
  assert(W.GLOW.mesh.count === 1, 'DN: one lit fixture, one instance');
  // and it cannot fill the view
  const s = new W.THREE.Vector3();
  new W.THREE.Matrix4().fromArray(W.GLOW.mesh.instanceMatrix.array, 0)
    .decompose(new W.THREE.Vector3(), new W.THREE.Quaternion(), s);
  const dist = W.camera.position.distanceTo(W.FIXTURES[0]._org);
  const halfView = dist * Math.tan(W.camera.fov*Math.PI/360);
  assert(s.x <= halfView*2*W.GLOW_MAX_FRAC + 1e-4,
         'DN: the glow is clamped in screen space, not just in world size');
}
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd tests && node full14.js
```
Expected: FAIL — `DN: the glow is one InstancedMesh`.

- [ ] **Step 3: Build the glow**

In `src/p4.txt`, after the `LIGHT_POOL` block (line ~493):

```js
/* ============================================================================
   RULING DN — GLOW PLANES INSTEAD OF SCREEN-SPACE BLOOM (route 2).
   True bloom needs a composer, a composer needs its own render target, and
   rendering into our own target forfeits driver fixed-foveated rendering —
   which is the ONLY governor vrPerf has mid-session (p9).  Bloom would be
   bought by removing the safety net.  So: an additive camera-facing plane per
   lit emitter, which is the idiom this file already speaks five times over
   (the beam shader, the two gobo flares, three materials in p5c).
   THREE THINGS MAKE IT CHEAP, and all three are load-bearing:
     - ONE InstancedMesh, one material, one geometry -> one draw call.
     - `count` is TRUNCATED to the lit fixtures.  An additive quad at opacity
       zero still rasterises and still blends; fading it to nothing saves
       nothing.  Across a 94-cue plot most of the rig is out.
     - A SCREEN-SPACE clamp.  World size alone is unbounded: a source a metre
       from the face fills the display, and that is the one case that would
       show — it is where he stands to look at the neon.
   Capped in a session by VR.glowCap, beside VR.beamCap, for the same reason.
   ========================================================================== */
const GLOW_MAX_FRAC = 0.22;      // most of the view height one glow may cover
const GLOW_MIN_LVL   = 0.04;     // below this the fixture is not drawn at all
const GLOW_SIZE      = 1.9;      // world metres at full level, before clamping
const GLOW = { mesh:null, max:0 };
function glowBuild(){
  const c = cvs(64, 64), g = c.getContext('2d');
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0.0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.35, 'rgba(255,255,255,0.42)');
  rg.addColorStop(1.0, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
  const tex = new T.CanvasTexture(c);
  GLOW.max = FIXTURES.length + 24;          // + the practicals and the marquee
  const mat = new T.MeshBasicMaterial({
    map:tex, transparent:true, blending:T.AdditiveBlending,
    depthWrite:false, side:T.FrontSide, toneMapped:false });
  const mesh = new T.InstancedMesh(new T.PlaneGeometry(1, 1), mat, GLOW.max);
  mesh.name = 'glow';
  mesh.frustumCulled = false;               // instances move every frame
  mesh.raycast = ()=>{};                    // never a grab or a ground hit
  mesh.instanceColor = new T.InstancedBufferAttribute(
    new Float32Array(GLOW.max*3), 3);
  mesh.renderOrder = 20;
  mesh.count = 0;
  GLOW.mesh = mesh;
  scene.add(mesh);
}
const _gm = new T.Matrix4(), _gp = new T.Vector3(), _gq = new T.Quaternion(),
      _gs = new T.Vector3();
function glowUpdate(cam){
  const mesh = GLOW.mesh;
  if(!mesh || !cam) return;
  const cap = (VR && VR.active && VR.glowCap !== undefined)
    ? VR.glowCap : GLOW.max;
  if(!cap){ mesh.count = 0; return; }
  const tanHalf = Math.tan(cam.fov*Math.PI/360);
  let n = 0;
  for(const f of FIXTURES){
    if(n >= cap) break;
    const lvl = f._lvl || 0;
    if(lvl < GLOW_MIN_LVL) continue;        // not drawn: a zero quad still costs
    _gp.copy(f._org);
    const dist = cam.position.distanceTo(_gp);
    /* the clamp: GLOW_MAX_FRAC of the view height at this distance */
    const lim = dist * tanHalf * 2 * GLOW_MAX_FRAC;
    const sz = Math.min(GLOW_SIZE * (0.45 + 0.55*lvl), lim);
    _gs.set(sz, sz, 1);
    _gq.copy(cam.quaternion);               // camera-facing, both eyes share it
    _gm.compose(_gp, _gq, _gs);
    mesh.setMatrixAt(n, _gm);
    mesh.instanceColor.setXYZ(n,
      f.color.r*lvl, f.color.g*lvl, f.color.b*lvl);
    n++;
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
}
glowBuild();
```

- [ ] **Step 4: Drive it, and cap it in a session**

At the very end of `updateRig` in `src/p4.txt` (after the `FLY.forEach` practical block, before the closing brace):

```js
  glowUpdate(VR && VR.active && VR.cam ? VR.cam : camera);
```

In `src/p9.txt`, beside `VR.beamCap = 10;` in the quality-on block (line ~70):

```js
  VR.glowCap = 14;                            /* RULING DN — additive glow is
    overdraw, exactly like the beams above it.  Same knob family, same reason,
    and it sits in the perf backlog beside VR.beamCap. */
```

and beside `VR.beamCap = 0;` in the quality-off block (line ~93): `VR.glowCap = undefined;`

- [ ] **Step 5: Write the probe**

Create `tools/glow.js`, modelled on `tools/wing.js`. It must print, for a given cue: the number of instances drawn, the summed screen-area fraction, and the single worst instance's fraction. **No backticks anywhere in the probe template, including in comments** — run `node probe-lint.js` immediately after writing it, before anything else.

- [ ] **Step 6: Add the VR assertion**

Append to `tests/vr.js`:

```js
/* RULING DN — the glow is capped in a session, like the beams. */
{
  const W = boot();
  W.vrQualityOn();
  assert(W.VR.glowCap > 0 && W.VR.glowCap <= W.GLOW.max,
         'DN: a session caps the glow instances');
  W.vrQualityOff();
  assert(W.VR.glowCap === undefined, 'DN: leaving a session lifts the cap');
}
```

- [ ] **Step 7: Build, test, negative-check twice**

```bash
sh build.sh && cd tests && node probe-lint.js && npm test
```

**Two** negative checks, because two separate claims carry the performance argument:

1. Change `if(lvl < GLOW_MIN_LVL) continue;` to `if(false) continue;`. Rebuild, prove present and prove changed. `node full14.js` must FAIL on `DN: a dark rig draws zero glow instances`.
2. Change `const sz = Math.min(GLOW_SIZE * (0.45 + 0.55*lvl), lim);` to drop the `Math.min`. Rebuild, prove present and prove changed. `node full14.js` must FAIL on `DN: the glow is clamped in screen space, not just in world size`.

Revert each, rebuild, byte-identical, retest.

- [ ] **Step 8: Commit and open the PR** (branch `lighting-glow`)

---

## Task 6: The LIGHTING panel on the desk

**Ruling DO.** Layer 2's authoring surface. Roblox Studio's property grid, drawn as a console page. Every row drives a constant that already exists — this is a facade, not a new engine.

**Files:**
- Modify: `src/p1.txt` — the panel DOM, beside the existing desk panels
- Modify: `src/p7.txt` — the wiring, beside the existing panel handlers ([p7.txt:1043](../../../src/p7.txt) is the quality-select model)
- Test: `tests/full14.js`

- [ ] **Step 1: Read the existing pattern first**

Open `src/p1.txt` and find the quality panel whose select is wired at [p7.txt:1043](../../../src/p7.txt). **Copy its DOM shape and its wiring shape exactly** — id naming, class names, the `$('#id').addEventListener` idiom, and the `toast()` confirmation. Do not invent a new panel idiom.

- [ ] **Step 2: Write the failing test**

```js
/* RULING DO — the LIGHTING page exists on the desk and its rows drive the
   real constants.  Through the DOM, never the model: a detached row fires
   its handler perfectly well (TRAPS). */
{
  const rows = W.document.querySelectorAll('#lightingPanel [data-lk]');
  assert(rows.length >= 6, 'DO: the panel has at least six property rows');
  const keys = [...rows].map(r=>r.getAttribute('data-lk'));
  ['brightness','exposure','envIntensity','atmHaze','gradeSat','clockTime']
    .forEach(k=> assert(keys.indexOf(k) !== -1, 'DO: row present: ' + k));
  const sat = W.document.querySelector('#lightingPanel [data-lk="gradeSat"] input');
  sat.value = '0.4';
  sat.dispatchEvent(new W.window.Event('input', {bubbles:true}));
  assert(Math.abs(W.GRADE.sat - 0.4) < 1e-6,
         'DO: moving the saturation row moves GRADE.sat');
  const exp = W.document.querySelector('#lightingPanel [data-lk="exposure"] input');
  exp.value = '1.8';
  exp.dispatchEvent(new W.window.Event('input', {bubbles:true}));
  assert(Math.abs(W.renderer.toneMappingExposure - 1.8) < 1e-6,
         'DO: the exposure row reaches the renderer');
}
```

- [ ] **Step 3: Run it and watch it fail**

```bash
cd tests && node full14.js
```
Expected: FAIL — `DO: the panel has at least six property rows`.

- [ ] **Step 4: Add the panel**

In `src/p1.txt`, beside the other desk panels, following their exact class idiom:

```html
<div id="lightingPanel" class="panel">
  <div class="ph">LIGHTING</div>
  <div class="prow" data-lk="brightness"><label>Brightness</label>
    <input type="range" min="0" max="5" step="0.05" value="2.4"><span class="pv">2.40</span></div>
  <div class="prow" data-lk="exposure"><label>ExposureComp</label>
    <input type="range" min="0.2" max="3" step="0.05" value="1.35"><span class="pv">1.35</span></div>
  <div class="prow" data-lk="envIntensity"><label>EnvSpecularScale</label>
    <input type="range" min="0" max="2" step="0.05" value="0.55"><span class="pv">0.55</span></div>
  <div class="prow" data-lk="atmHaze"><label>Atmosphere haze</label>
    <input type="range" min="0" max="4" step="0.05" value="1.8"><span class="pv">1.80</span></div>
  <div class="prow" data-lk="gradeSat"><label>Saturation</label>
    <input type="range" min="-1" max="1" step="0.01" value="-0.05"><span class="pv">-0.05</span></div>
  <div class="prow" data-lk="clockTime"><label>ClockTime</label>
    <input type="range" min="0" max="24" step="0.25" value="19.33"><span class="pv">19:20</span></div>
</div>
```

- [ ] **Step 5: Wire it**

In `src/p7.txt`, beside the quality-select handler:

```js
/* RULING DO — the LIGHTING page.  Roblox's property grid over constants this
   file already has: every row is a pointer at something real, and nothing
   here is a new engine.  ClockTime is the one row with no Palace meaning —
   it drives the Arc's GLAZED FOYER, which is a room you can stand in. */
const LK = {
  brightness:   v=>{ HOUSE.house = v/5; },
  exposure:     v=>{ renderer.toneMappingExposure = v; },
  envIntensity: v=>{ ENV_INTENSITY = v; },
  atmHaze:      v=>{ ATM.haze = v; },
  gradeSat:     v=>{ GRADE.sat = v; },
  clockTime:    v=>{ HOUSE.clock = v; }
};
document.querySelectorAll('#lightingPanel [data-lk]').forEach(row=>{
  const k = row.getAttribute('data-lk'), inp = row.querySelector('input'),
        out = row.querySelector('.pv');
  inp.addEventListener('input', ()=>{
    const v = parseFloat(inp.value);
    if(LK[k]) LK[k](v);
    out.textContent = k === 'clockTime'
      ? (Math.floor(v) + ':' + String(Math.round((v%1)*60)).padStart(2,'0'))
      : v.toFixed(2);
  });
});
```

`ENV_INTENSITY` must become a `let` in `p2` for this to assign (it is declared `const` in Task 2 Step 3 — change it to `let` in this PR and say so in the body).

- [ ] **Step 6: Build, test, negative-check**

Negative check: change `gradeSat: v=>{ GRADE.sat = v; }` to `gradeSat: v=>{}`. Rebuild, prove present and prove changed, `node full14.js` must FAIL on `DO: moving the saturation row moves GRADE.sat`. Revert, rebuild, byte-identical, retest.

- [ ] **Step 7: Commit and open the PR** (branch `lighting-panel-desk`)

---

## Task 7: The LIGHTING page in the headset

**Ruling DP.** A control that exists only in the DOM does not exist in VR (CV/CW). Same model, headset surface, found by **META** and never by pixel — `tests/vr.js` pins some older buttons at literal y 312/366/448/502 and those canvas layouts must not shift.

**Files:**
- Modify: `src/p9.txt` — the console pages, modelled on the SETS page (CV)
- Test: `tests/vr.js`

- [ ] **Step 1: Read the SETS page first**

In `src/p9.txt`, find the SETS page added by RULING CV and the goods picker VR.md names as "the model" for META regions. **Copy their structure**: how a page registers, how `vrHit` finds a region by `{...}` meta rather than by coordinates, and how the canvas is redrawn.

- [ ] **Step 2: Write the failing test**

```js
/* RULING DP — the LIGHTING page is in the headset too, and its rows are found
   by META.  Never by pixel: vr.js pins the FOH/SPK rows at literal y and
   those layouts must not move. */
{
  const W = boot();
  W.vrBuildDesks();
  const page = W.vrPageByName('LIGHTING');
  assert(page, 'DP: the headset has a LIGHTING page');
  const hit = page.hits.find(h=>h.meta && h.meta.lk === 'gradeSat' && h.meta.d > 0);
  assert(hit, 'DP: a saturation up-region exists, found by meta');
  const before = W.GRADE.sat;
  W.vrHitRun(hit);
  assert(W.GRADE.sat > before, 'DP: pressing it moves the same constant the desk does');
  assert(W.GRADE.sat <= 1, 'DP: and it clamps');
}
```

- [ ] **Step 3: Run it and watch it fail**

```bash
cd tests && node vr.js
```
Expected: FAIL — `DP: the headset has a LIGHTING page`.

- [ ] **Step 4: Add the page**

Add a LIGHTING page to the VR console with one row per `LK` key, each row carrying a **down** and an **up** region with meta `{lk:<key>, d:-1|+1}` and a step sized to the row. Both regions call the **same `LK[k]`** the desk uses — one code path, two surfaces. Clamp to the same min/max as the desk sliders; a headset row that can drive a constant out of the desk's range is two different controls wearing one name.

- [ ] **Step 5: Build, test, negative-check**

Negative check: change the up-region's handler to call `LK[k]` with the current value rather than the stepped value. Rebuild, prove present and prove changed, `node vr.js` must FAIL on `DP: pressing it moves the same constant the desk does`. Revert, rebuild, byte-identical, retest.

- [ ] **Step 6: Commit and open the PR** (branch `lighting-panel-vr`)

---

## Task 8: Droppable light objects — a facade with an honest slot count

**Ruling DQ.** Roblox lets you drop unlimited `PointLight`/`SpotLight`/`SurfaceLight`. There are 8 pool slots, 3 shadow-capable, 4 in a session, and **RANK decides who gets a real light (RULING BC, load-bearing)**. So the facade offers the objects honestly and reports the slot count — `Shadows: on` means *requests* a shadow slot, never *gets* one. A checkbox that silently does nothing is worse than no checkbox.

**Files:**
- Modify: `src/p4.txt` — the facade beside `FIXTURES`
- Test: `tests/show.js`

- [ ] **Step 1: Write the failing test**

```js
/* RULING DQ — a dropped light is a real fixture in the rank queue, and asking
   for a shadow is a REQUEST.  The pool is the pool. */
{
  const before = W.FIXTURES.length;
  const l = W.lightAdd({kind:'PointLight', x:0, y:6, z:-4,
                        brightness:2, range:20, shadows:true});
  assert(W.FIXTURES.length === before + 1, 'DQ: a dropped light joins FIXTURES');
  assert(l.rank > 0, 'DQ: it carries a rank, so BC still decides');
  assert(l.shadowWanted === true, 'DQ: the shadow request is recorded');
  assert(l.shadowGranted === false,
         'DQ: and it is not granted at creation — the pool grants it');
  assert(typeof W.lightSlots === 'function', 'DQ: the slot count is reportable');
  const s = W.lightSlots();
  assert(s.total === W.LIGHT_POOL.length && s.shadow === 3,
         'DQ: it reports the REAL pool, not a promise');
  W.lightRemove(l);
  assert(W.FIXTURES.length === before, 'DQ: removing it leaves no fixture behind');
}
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd tests && node show.js
```
Expected: FAIL — `W.lightAdd is not a function`.

- [ ] **Step 3: Write the facade**

In `src/p4.txt`, after the fixture definitions:

```js
/* ============================================================================
   RULING DQ — DROPPABLE LIGHTS, AND THE SLOT COUNT IS TOLD THE TRUTH.
   Roblox drops unlimited PointLight/SpotLight/SurfaceLight.  We have 8 pool
   slots, 3 shadow-capable, 4 in a session — and RANK decides who gets one
   (RULING BC, load-bearing).  So a dropped light is a REAL fixture that joins
   the rank queue like any lantern, and `shadows` is a REQUEST: shadowWanted is
   what the panel asked for, shadowGranted is what the pool did.  A checkbox
   that silently does nothing is worse than no checkbox at all.
   A SurfaceLight is a wide-angle spot: r128 has no area light in the standard
   material, and faking one with four spots would eat half the pool.
   ========================================================================== */
const LIGHT_KINDS = {
  PointLight:   { angle:170, rank:0.5 },
  SpotLight:    { angle:32,  rank:0.6 },
  SurfaceLight: { angle:120, rank:0.45 }
};
function lightAdd(o){
  const k = LIGHT_KINDS[o.kind] || LIGHT_KINDS.PointLight;
  const f = addFixture({
    name: o.name || (o.kind + ' ' + (FIXTURES.length+1)),
    x:o.x||0, y:o.y||6, z:o.z||0,
    angle: o.angle || k.angle,
    beamLen: o.range || 20,
    power: o.brightness === undefined ? 2 : o.brightness,
    rank: o.rank === undefined ? k.rank : o.rank,
    kind: o.kind
  });
  f.dropped = true;
  f.shadowWanted  = !!o.shadows;
  f.shadowGranted = false;         // only the pool hand-out can grant it
  return f;
}
function lightRemove(f){
  const i = FIXTURES.indexOf(f);
  if(i !== -1) FIXTURES.splice(i, 1);
  if(f && f.beam && f.beam.parent) f.beam.parent.remove(f.beam);
}
function lightSlots(){
  return { total: LIGHT_POOL.length, shadow: SHADOW_LIGHTS,
           inSession: (VR && VR.lightCap) || LIGHT_POOL.length,
           granted: FIXTURES.filter(f=>f._live).length };
}
```

`addFixture` is the existing constructor — **read its real signature in `p4` and match it**; the field names above must be the ones it already uses, not new ones.

- [ ] **Step 4: Record the grant**

In `updateRig`'s hand-out loop, where `f._live = true;` is set (line ~1076), add:

```js
    f.shadowGranted = !!f.shadowWanted && i < SHADOW_LIGHTS;
```

and set `f.shadowGranted = false` in the `FIXTURES.forEach(f=>f._live=false)` sweep just above, so a light that loses its slot loses the flag with it.

- [ ] **Step 5: Park the state**

**New per-stage state parks in `p2k` or it leaks across the stage swap** (INVARIANTS). Dropped lights are per-stage: add them to the `p2k` park/restore lists beside `FIXTURES`, and verify with `node stages.js`.

- [ ] **Step 6: Build, test, negative-check**

Negative check: change `f.shadowGranted = false;` in `lightAdd` to `f.shadowGranted = !!o.shadows;`. Rebuild, prove present and prove changed, `node show.js` must FAIL on `DQ: and it is not granted at creation — the pool grants it`. Revert, rebuild, byte-identical, retest.

- [ ] **Step 7: Commit and open the PR** (branch `lighting-objects`)

---

## Task 9: The record

**Files:** `STATE.md`, `HANDOFF.md`, `docs/guide/TRAPS.md`, `docs/guide/INVARIANTS.md`, `docs/guide/VR.md`

- [ ] **Step 1: Correct VR.md, which is stale**

VR.md says "Session paced at 72Hz (`VR.targetHz`)". The code sets `VR.targetHz = 90` then negotiates down to the lowest supported rate ≥ 72 ([p9.txt:205](../../../src/p9.txt)). Fix the line to describe the negotiation, and add `VR.glowCap` to the perf-knob list beside `VR.beamCap`.

- [ ] **Step 2: Add the new traps**

```markdown
- **A published build can vanish between versions.** three.js's UMD
  `build/three.min.js` returns 200 through r160.1 and **404 from r161** — the
  game loads it as a CDN global and relies on cross-part function hoisting, so
  r160.1 is the architecture's ceiling. Check the artifact exists before
  planning on the version.
- **An absent feature reads exactly like a feature you have not found yet.**
  Multiview was the entire performance case for the upgrade. Grepping the
  actual builds for `multiview` returns **zero** in r128, r160, r162 and r170.
  Grep the artifact, not the changelog.
- **A shader chunk patch cannot be negative-checked by the suites.** jsdom
  stubs `WebGLRenderer`, so a broken chunk body passes all 19. Assert on the
  *wiring* (uniforms present, chunk text contains the symbol) and verify the
  compile in a browser through `window.__glErr`.
- **A copied uniform freezes at build time.** `sh.uniforms.x = {value: v}` in
  `onBeforeCompile` looks identical to sharing on the first frame and never
  changes again. Share the object.
- **An additive quad at opacity zero still rasterises.** Fading a glow to
  nothing saves nothing; truncate `InstancedMesh.count` instead.
- **The instrument was already on his wrist.** Two sessions of advice said
  "put the frame time in the headset" — `vrPerf`/`vrDrawMeter` had been doing
  it since the VR perf round. Read VR.md before proposing an instrument.
```

- [ ] **Step 3: STATE.md and the HANDOFF Done block**

Rulings now at **DQ**. Cache-bust `?v=28`. Record the four baseline readings from Task 0 and the headset questions this round opens: does the environment read as ambience or as a wash; is height fog right at 9.0m; does the grade's tint read on the ivory wall; do the glow planes read as bloom or as sprites; is `GLOW_MAX_FRAC` 0.22 enough at the proscenium.

- [ ] **Step 4: Commit and open the PR** (branch `lighting-record`)

---

## Task 10: three.js r128 → r160.1 — **CUT, 2026-08-13**

**Do not do this.** Verified against the artifacts rather than the changelog: the
non-module addon folder `examples/js/` died at **r148**, so r160.1 has no drop-in
addons; **meshopt already works on r128** (the decoder is 200 at r128 and the
vendored loader carries `setMeshoptDecoder` and the `EXT_MESHOPT_COMPRESSION`
handler); and **KTX2Loader was ESM-only at every version**, so it costs a hand-port
either way. The asset pipeline — the upgrade's only surviving justification — **is
not gated on the upgrade**, and per Task 0 it could not have fixed the 25ms empty
house regardless, because nothing was loaded in that reading. Full reasoning in
[the spec's §7.1](../specs/2026-08-13-roblox-lighting-design.md).

**What replaces it:** meshopt on r128 as its own small PR, and KTX2 judged separately.
**The one live question** is r160's per-instance `computeBoundingSphere`, which would
retire the r128 culling workaround at 26 sites — decide it on the draw-call number
Task 1 now puts on the wrist, not before.

The original text is kept below as the record of what was planned and why it went.

### Task 10 (as originally written)

**Do not start this until Tasks 1–9 have merged and had a headset run.** Nothing above depends on it.

**The honest case.** Multiview does not exist, so there is **no frame-rate argument**. What r160.1 actually buys:

- **KTX2/Basis** (`KTX2Loader`, r131+) and **`EXT_meshopt_compression`** (r132+) — the real answer to 181MB of models with ~70MB discarded at load. Less texture memory is also real GPU pressure relief on a Quest.
- 32 releases of fixes and better colour management.

**The bill.** `useLegacyLights` flips to physically-correct in r155, which changes what every intensity number means. That invalidates `BLIND_POWER` 4.6, `AUDM_POWER` 2.8, **`BLIND_RANK` 0.9 / `AUDM_RANK` 0.8 (RULING BC, load-bearing)**, `BJ_FILL_MAX` 0.55, the house at 0.15, `AUD_LIGHT_RESERVE`, and every constant in STATE.md's feel-constants block. **He ruled on all of those in a headset.** They become guesses again.

- [ ] **Step 1: Pin the version and prove the artifact exists**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://unpkg.com/three@0.160.1/build/three.min.js
```
Expected: `200`. If it is not 200, **stop** — the single-file architecture has no version to move to and this task is dead.

- [ ] **Step 2: Set `useLegacyLights = true` FIRST, as its own commit**

Before changing the version, add `renderer.useLegacyLights = true;` to `src/p2.txt`. On r128 this is a no-op; on r160 it preserves r128's light maths exactly. **This is what keeps every ruled intensity meaning what it meant.** Build, full suite, commit alone.

- [ ] **Step 3: Change the version in three places, not one**

- `src/p1.txt:915` — the cdnjs URL
- `src/p1.txt:919` — the unpkg fallback
- `tests/package.json` — `"three": "0.160.1"`, then `cd tests && npm install`

A suite harness on r128 against a game on r160 will pass and mean nothing.

- [ ] **Step 4: Run everything and expect breakage**

```bash
sh build.sh && cd tests && npm test && node real.js
```

Expect failures in: `outputEncoding` (renamed to `outputColorSpace` around r152 — keep both assignments so either version works), `PMREMGenerator.fromScene` signature, `InstancedBufferAttribute` defaults, and the fog varying name the Task 3 note flags. Fix them one at a time, rebuilding between each.

- [ ] **Step 5: Confirm the chunk patches survived**

Tasks 3 and 4 patch `fog_*` and `tonemapping_*` chunks by string append. **Chunk contents changed between r128 and r160.** Re-read both chunks in r160.1 and re-derive the patches; do not assume the append still lands somewhere valid. Verify in a browser via `window.__glErr`, because the suites cannot see a shader.

- [ ] **Step 6: A headset run before the asset work**

The upgrade's whole payoff is KTX2/meshopt, which is a **separate PR after this one merges**. Get a headset reading on the wrist meter first and compare against Task 0's four numbers. If r160.1 with `useLegacyLights = true` is not at least neutral, revert — there is no frame-rate case to trade against a regression.

- [ ] **Step 7: Commit and open the PR** (branch `three-r160`)

---

## Self-review

**Spec coverage.** Layer 1: environment (Task 2), atmosphere (Task 3), colour grade + exposure (Task 4), bloom via route 2 (Task 5). Layer 2: the property panel on the desk (Task 6), in VR (Task 7), droppable light objects (Task 8). Upgrade (Task 10). Instrumentation (Task 1) and baseline (Task 0). Record (Task 9). **Covered.** Roblox's `Technology` dropdown (Voxel/ShadowMap/Future) is deliberately **out of scope** — he chose layers 1 and 2 only, and the panel shows it fixed rather than hidden.

**Known gap, stated rather than hidden.** r128's standard material scales environment diffuse and specular together through `envMapIntensity`, so `EnvironmentDiffuseScale` and `EnvironmentSpecularScale` collapse to one knob (Task 2 Step 3). Splitting them is a chunk patch and belongs with Task 4's work or after the upgrade. Task 6's panel therefore shows one row, named `EnvSpecularScale`.

**Type consistency.** `GRADE.u.{gradeBC,gradeSat,gradeTint}`, `ATM.{density,height,haze,glare}`, `GLOW.{mesh,max}`, `GLOW_MAX_FRAC`/`GLOW_MIN_LVL`/`GLOW_SIZE`, `ENV_INTENSITY` (a `let` from Task 6 onward)/`ENV_LIVE`/`envApply`/`envBuild`, `gradeApply`, `glowBuild`/`glowUpdate`, `lightAdd`/`lightRemove`/`lightSlots`, `f.shadowWanted`/`f.shadowGranted`, `VR.glowCap`, `VR.perf.calls`/`.tris`, `LK` — each used with one name and one shape throughout.

**Two things in this plan are read-then-write, not copy-paste.** Task 6 Step 1 and Task 7 Step 1 require reading the existing desk-panel and VR-page idioms first, because inventing a second panel pattern in a file that already has one is how `ls.ui` happened. Task 8 Step 3 requires reading `addFixture`'s real signature.
