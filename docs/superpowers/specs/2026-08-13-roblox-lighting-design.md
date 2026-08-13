# Roblox-style lighting — design

**2026-08-13.** Rulings **DJ–DQ**, continuing from **DI**.

His ask, in his words: **"would you be able to rebuild the lighting engine to look
and work like the one roblox uses"**, then **"1 and 2"** of the four layers offered,
then — on being asked whether a desktop-only graded look was acceptable — **"It has
to match in VR"**, and **"why would number 1 only be for desktop (answer then
wait)"**. Then **"how much would rout 2 hurt frame rate"**, **"would turning it into
a normal vr game coded in c# or c++ be worth it"**, and finally a plan covering the
upgrade, route 2, and all of layers 1 and 2.

The plan is [2026-08-13-roblox-lighting-prs1-10.md](../plans/2026-08-13-roblox-lighting-prs1-10.md).
**This file is the reasoning; the plan is the steps.** Rulings here are BINDING.

---

## 1. What "the Roblox lighting engine" was decomposed into

Four separable layers were put to him. He chose **1 and 2**.

| Layer | What it is | Chosen |
|---|---|---|
| **1 — the look** | Bloom, ColorCorrection, Atmosphere, plus a scene environment | **yes** |
| **2 — the authoring model** | A `Lighting` property panel, droppable PointLight/SpotLight/SurfaceLight | **yes** |
| 3 — voxel bleed | Baked irradiance over the static building | no |
| 4 — Future per-light shadows | More than 3 shadow casters, real specular | no |

Roblox's `Technology` dropdown (Voxel / ShadowMap / Future) is therefore **out of
scope**, and the panel shows it **fixed rather than hidden** — leaving it out
entirely would misrepresent the model he asked for.

---

## 2. Four findings that changed the answer

All four were verified against the code or the network, not recalled.

**2.1 — three.js has no multiview, at any version.** Grepping the published builds
for `multiview` returns **zero** occurrences in r128, r160, r162 *and* r170. The
−15% to −30% frame-time credit quoted for the upgrade earlier in the conversation
was predicated entirely on multiview and **does not exist**. Grep the artifact, not
the changelog.

**2.2 — the UMD build disappears after r160.** On unpkg, `build/three.min.js`
returns HTTP 200 for r128 … r160.1 and **404 from r161 onward**. The game loads
three.js as a CDN global (`p1.txt:915`, with an unpkg fallback at `:919`) and relies
on function declarations hoisting across all 30 concatenated parts. ESM breaks both.
**r160.1 is the architecture's ceiling.**

**2.3 — the wrist meter already existed.** `vrPerf` / `vrDrawMeter` (`p9.txt:130`)
has been keeping a 120-frame ring buffer and drawing avg ms, peak ms and live
foveation on the left wrist since the VR perf round. Advice given twice in this
conversation to "put the frame time in the headset" was **describing something
already built**. RULING DJ only adds two numbers to it.

**2.4 — the budget is 13.9ms and VR has its own governor.** `vrOnStart`
(`p9.txt:199`) asks for the lowest supported rate ≥ 72Hz, with the comment *"the
first headset run could not hold it [90]; a held 72 beats a 90 that drops"*. And
`vrPerf` runs a closed feedback loop on foveation: +0.15 toward 1.0 when avg >
budget × 1.06, −0.05 when avg < budget × 0.82. The earlier claim that "autoTune has
no working lever in VR" was wrong — desktop `autoTune` is inert in a session, but
foveation is a live lever.

---

## 3. Why the post-processing route was rejected — RULING DN's reasoning

**The mechanical problem.** `EffectComposer` renders the scene to an offscreen
target then runs full-screen quad passes. In an XR session: the XR framebuffer is
**opaque by spec** so it cannot be read or bound as a texture; one frame carries
**two viewports** and `renderer.render` substitutes an ArrayCamera whose viewports
are sized for the XR framebuffer, not for a composer target; and
`setRenderTarget(null)` stops meaning "the canvas" because `WebXRManager` calls
`renderer.setFramebuffer()` with the layer's framebuffer.

None of that is a GPU limit — it is hand-rollable. **The reason it is still
rejected is finding 2.4.** Rendering into our own target forfeits driver
fixed-foveated rendering, and foveation is the **only** governor `vrPerf` has
mid-session. Route 1 would buy bloom by **removing the safety net**, at a fixed
2–4ms cost that is paid whether anything is glowing or not.

**Route 2 has a ceiling where route 1 has a floor.** Modelled at Quest 3 stereo
resolution, one full-screen additive layer is ≈1.5ms:

| Case | Coverage | Cost |
|---|---|---|
| Blinders and lamps from the stalls | 10–20% | 0.15–0.3ms |
| Neon frame plus eight blinders | 40–60% | 0.6–1.2ms |
| Standing at the proscenium, uncapped | 1–2 full-screen layers | 1.5–3ms |

The worst case is unbounded without a clamp, and it is **exactly where he stands to
look at the neon** — hence the screen-space clamp in DN, which is what turns an
unbounded case into a bounded one.

Three of the four layer-1 items **need no composer at all**, which is why "it has to
match in VR" did not kill layer 1: environment is `scene.environment`, atmosphere is
a fog-chunk patch, and the grade is a tonemapping-chunk patch. Only bloom needed one.

---

## 4. Why not Unity or Unreal

Asked directly and answered: **not worth it as a rewrite.**

Measured scale: **26,071 lines** of hand-written game code excluding the vendored
GLTF loader, **19,645 lines** of tests, **101 distinct rulings cited in the source
itself**, 14 probes, 5,163 lines of prose. Genuinely renderer-coupled: `p2`'s setup,
`p4`'s pool and the beam shader — 3–4k lines. **The other ~22k is a theatre**: the
fly system, the cue engine against positions in his own recording, the crew's job
queue, three stages on one board, the build system, the traffic plan.

The 19,645 lines of tests are jsdom plus real three.js with a stubbed renderer — the
entire harness **is** the thing being replaced, so a port restarts 101 rulings at
zero coverage, and most of those rulings are one number whose *reason* lives in
HANDOFF prose.

**And the iteration loop is the strongest argument.** Today: edit a text file,
`sh build.sh`, load `?v=N` on the Quest. Unity's Quest loop is build-and-install in
minutes, or Link preview through a *different* rendering path than the one shipped.
That gap is why 113 rulings exist at all.

Fairly stated gains, none of which outweigh the above: XR-correct post-processing,
a real profiler, baked lightmaps (a static theatre is the ideal case), a proper asset
pipeline for the 181MB, real physics for the build system. **If it were ever done:
Unity, not Unreal** — Quest is Unity's home turf and Unreal's mobile forward renderer
would fight one person.

**The one thing that would flip it:** shipping to the Quest store rather than
previewing his own shows. Open — see §7.

---

## 5. The rulings

**RULING DJ — the wrist meter tells the truth: draw calls, triangles, and an average
that does not stop at the game's dt clamp.** Multiview does not exist, so the only
lever on draw calls is our own batching, and nothing reported the count where it can
be read. `renderer.info.render.calls` / `.triangles` cost nothing to ask. The canvas
grows 256×96 → 256×128 and the plane 0.03 → 0.04 to keep aspect.

**And the meter was capped at 50ms without anyone knowing.** `p7`'s `tick` clamps
`dt` to 50ms — correctly, because every mover, fade and cue rides that number and a
model load must not teleport the show — and `vrPerf` was handed the *clamped* figure.
So **every frame worse than 50ms was recorded as exactly 50**, and the meter could
not report a frame rate below 20Hz however bad it got. His first readings came back
at **48ms**, two off a ceiling nobody knew was there: a floor, not a measurement.
`tick` now passes the raw frame time alongside the clamped one, for the meter only.
`PERF_CEIL` (200ms) is the meter's **own** ceiling and is deliberately four times the
game's — a 20ms frame is a frame rate and must be told the truth, while a
three-second model load is a hitch that would otherwise sit in the 120-frame window
poisoning the average for two seconds after it ended. Proved rather than argued: the
new assertion drives 120ms frames and, against the pre-change build, **the average
read exactly 50.0**.

**RULING DK — the room has an environment.** Nothing set `scene.environment`, and
every material arriving from a GLTF is a `MeshStandardMaterial` carrying
`envMapIntensity = 1` with nothing to sample, so **every metal surface in his 181MB
of models rendered near-black**. Built with core `PMREMGenerator` over a
six-plane box of emissive greys — **not `RoomEnvironment`**, which is `examples/jsm`
and absent from the UMD bundle. It follows the light bed, because a fixed environment
lights a blackout as brightly as a full stage — the exact fault RULING BH fixed for
the ambient. **One knob, not two:** r128 scales diffuse and specular together through
`envMapIntensity`; splitting them is a chunk patch and is deferred rather than faked.

**RULING DL — the atmosphere is height-based, with haze and glare.** A flat `FogExp2`
fogs the grid as heavily as the deck. Patched into the **fog chunks**, not per
material, because `UniformsLib.fog` is merged into every fog-enabled material at
compile time — one patch reaches the `M` table, the smoke (`p5e` sets `fog:true`
explicitly) and every imported GLTF material at once. **It must run in `p2`, before
any material exists**, which is why the `build.sh` order is load-bearing. The
`FogExp2` stays: it is what makes three.js emit the fog code path at all.

**RULING DM — the colour grade rides the tonemapping stage.** Roblox's
`ColorCorrectionEffect` is a post-tonemap curve and ACES already sits at that point.
**No `UniformsLib` exists for tonemapping**, unlike fog, so one shared uniform object
travels via `onBeforeCompile` and every material must pass through `gradeApply` — a
new invariant. The beam shader (`p4.txt:86`, a raw `ShaderMaterial` that never
includes the chunk) and the two additive gobo planes (`p4.txt:564`, `:572`) are set
`toneMapped = false` **deliberately**: additive light graded twice double-applies the
tint. That is recorded so it is not later "fixed" as an omission.

**RULING DN — glow planes instead of screen-space bloom.** See §3. One additive
camera-facing `InstancedMesh` — the idiom this file already speaks five times over.
Three things make it cheap and all three are load-bearing: **one draw call**;
`count` **truncated** to the lit fixtures, because an additive quad at opacity zero
still rasterises and fading it to nothing saves nothing; and a **screen-space clamp**,
because world size alone is unbounded. Capped in a session by `VR.glowCap`, beside
`VR.beamCap` (10), which is already capped because additive beams in haze are
overdraw — same knob family, same reason.

**RULING DO — the LIGHTING page on the desk.** Roblox Studio's property grid drawn as
a console page. Every row is a pointer at a constant that already exists; nothing here
is a new engine. **`ClockTime` is kept** despite a windowless Broadway house, because
the Arc Centre has a **glazed foyer** — a room you can stand in where a sun angle
means something.

**RULING DP — the LIGHTING page in the headset.** *A control that exists only in the
DOM does not exist in VR* (CV/CW). Found by **META**, never by pixel — `tests/vr.js`
pins the FOH/SPK rows at literal y 312/366/448/502 and those layouts must not shift.
Both surfaces call the **same** `LK[k]` handler and clamp to the same range: a headset
row that can drive a constant out of the desk's range is two controls wearing one name.

**RULING DQ — droppable lights, and the slot count is told the truth.** Roblox drops
unlimited lights. There are **8 pool slots, 3 shadow-capable, 4 in a session**, and
**RANK decides who gets one (RULING BC, load-bearing)**. So a dropped light is a real
fixture joining the rank queue, and `shadows` is a **request**: `shadowWanted` is what
was asked, `shadowGranted` is what the pool did. **A checkbox that silently does
nothing is worse than no checkbox.** A SurfaceLight is a wide-angle spot — r128 has no
area light in the standard material and faking one with four spots would eat half the
pool.

---

## 6. What the suites structurally cannot check

**A shader-chunk patch cannot be negative-checked.** jsdom stubs `WebGLRenderer`, so a
broken chunk body passes all 19 suites. DL's and DM's assertions therefore test the
**wiring** — uniforms present, chunk text contains the symbol, the uniform object
shared rather than copied — and the compile is verified in a browser through
`window.__glErr` (`p1.txt:938`). **The plan says this in the PR body rather than
implying coverage that does not exist.**

Frame rate, legibility and feel go on the HANDOFF headset checklist as questions.

---

## 7. Open, and his to answer

**7.1 — the upgrade's case collapsed after he asked for it, and that is the
collision.** He asked for a plan covering the three.js upgrade. Findings 2.1 and 2.2
then removed its performance justification and capped it at r160.1. What survives is
**KTX2/Basis and meshopt for the 181MB problem** plus 32 releases of fixes — load
time and memory, not frame rate. The bill is unchanged and large: `useLegacyLights`
flips to physically-correct at r155, invalidating `BLIND_POWER` 4.6, `AUDM_POWER`
2.8, **`BLIND_RANK` 0.9 / `AUDM_RANK` 0.8 (BC)**, `BJ_FILL_MAX` 0.55, the house at
0.15 and every constant in STATE's feel block — **all of which he ruled on in a
headset**. It is PR 10, last, optional, and mitigated by setting
`useLegacyLights = true` as its own commit first.

**PUT TO HIM AND ANSWERED: CUT IT.** Four more things were checked against the
artifacts on 2026-08-13, and together they remove what was left of the case:

1. **The non-module addon folder died at r148.** `examples/js/` is HTTP 200 through
   **r147** and 404 from **r148**. r160.1 therefore has no drop-in addons at all —
   the same fact that killed `RoomEnvironment` in DK, one level worse.
2. **Meshopt needs no upgrade — it works on r128 today.**
   `examples/js/libs/meshopt_decoder.js` is 200 at r128, and the loader vendored in
   `p5i` already carries `setMeshoptDecoder` (`p5i.txt:160`), the
   `EXT_MESHOPT_COMPRESSION` constant (`:357`) and its full handler (`:801`). The
   plan's "meshopt is r132+" is the upstream date, not this file's. **It is sitting
   in the build unwired.**
3. **KTX2 costs the same at either version.** `KTX2Loader` was **ESM-only at every
   version checked** — `examples/js/loaders/KTX2Loader.js` is 404 at r128 *and* r144.
   It needs a hand-port plus the basis transcoder whether we move or not, and r128's
   loader already has the `KHR_texture_basisu` path waiting (`p5i.txt:353`, `:667`).
4. **So the asset pipeline — the upgrade's only surviving justification — is not
   gated on the upgrade.** And per §7.2 it could not fix the 25ms empty house anyway,
   because no models are loaded in that reading.

**The one argument that survives, and it is new:** r160's `InstancedMesh`
`computeBoundingSphere` unions each instance's transformed sphere, retiring the r128
trap that forces 26 sites across 7 files to never cull. That is a frame-rate argument
where §2.1 said none existed — but it is **unmeasured**, and DJ's draw-call number
tests it for free. **Decide it after a headset run, not before.**

Against all that: r160.1 is a **terminal** version (r161 has no UMD, and
`useLegacyLights` was itself deprecated shortly after), the vendored r128 GLTFLoader
could not be refreshed to match, and the DL/DM chunk patches — the one thing the
suites structurally cannot verify (§6) — would have to be re-derived blind.

**Verdict: PR 10 is cut as written.** What replaces it: **meshopt on r128** as its
own small PR, and **KTX2** judged separately on its own merits.

**7.2 — THE BASELINE EXISTS NOW, AND IT CHANGES THE ROUND.** He took the readings on
2026-08-13 at `?v=27`:

| Moment | avg ms | vs the 13.9ms budget | ≈ fps |
|---|---|---|---|
| Empty Palace, nothing loaded | **25** | **1.8× over** | 40 |
| Beetlejuice | **48**, and *clamped* — see DJ | **3.5× over** | ≤21 |

Two consequences, and both are structural:

**Foveation is spent, not standing by.** `vrPerf` climbs `+0.15` per half-second
judge whenever avg exceeds budget × 1.06 and caps at 1.0, so at 25ms it pegs at
**1.00 within about two seconds of entering and never relaxes**. §3 rejected route 1
to *preserve the only mid-session lever*. That reasoning needs restating: the lever
has **no travel left**. The conclusion survives and is stronger — we cannot afford to
surrender the fill-rate saving fixed foveation is already delivering at full tilt,
which is exactly what a hand-rolled stereo composer would do.

**The round as planned lands on a build that cannot afford it.** DK, DL, DM and DN
all add per-pixel fragment cost — environment sampling on every standard material,
extra varyings and fog maths on everything fogged, a grade on every tonemapped
surface, additive glow overdraw. Route 2 was sized against a 1.5–3ms decision. **You
do not tune a 1.2ms choice while 34ms over.** A performance investigation belongs
between DJ and DK, and it is not in the plan.

**And 25ms with nothing loaded is the building, not his models.** Whatever is wrong
is in the empty house. The leading suspect is that this file's instanced batches are
never culled — 26 sites across 7 files carry the r128 bounding-sphere workaround
(wide spheres, or `frustumCulled = false`). DJ's draw-call number is what settles it.

**7.3 — is this an instrument or a product?** §4's answer assumes he is previewing
his own shows. Shipping to the Quest store would make the native rewrite defensible.

**7.4 — the environment's two knobs.** DK ships one. The split needs a chunk patch or
the upgrade.
