# STATE — 2026-08-13 (THE FIRST FRAME TIMES EVER MEASURED, and they are bad)

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## READ THIS FIRST: THE HEADSET HAS A NUMBER NOW AND IT CHANGES THE ROUND

**He took the wrist-meter readings at `?v=27`. Cache-bust is `?v=28` from here.**

| Moment | avg ms | vs the 13.9ms budget | ≈ fps |
|---|---|---|---|
| Empty Palace, nothing loaded | **25** | **1.8× over** | 40 |
| Beetlejuice | **48**, and it was *clamped* | **3.5× over** | ≤21 |

**The 48 was a floor, not a measurement.** `p7` clamps `dt` to 50ms so a model load
cannot teleport the show, and `vrPerf` was reading that clamped figure — so every
frame worse than 50ms was recorded as exactly 50 and the meter could not report below
20Hz however bad it got. He was reading two off a ceiling nobody knew was there.
**RULING DJ fixes it** and proves it: drive 120ms frames against the pre-change build
and the average reads **exactly 50.0**.

**Three things follow, and all three are structural:**

1. **Foveation is spent, not standing by.** It pegs at **1.00 within ~2s of
   entering** and never relaxes. RULING DN rejected the composer route to *preserve
   the only mid-session lever* — the lever has **no travel left**. DN's conclusion
   survives and is stronger: we cannot afford to give up the fill-rate saving
   foveation is already delivering flat out.
2. **25ms with NOTHING LOADED is the building, not his models.** The leading suspect
   is that this file's instanced batches are never culled — **26 sites across 7
   files** carry the r128 bounding-sphere workaround. DJ's new draw-call number
   settles it. **A performance investigation belongs before PRs 2–5** and is not in
   the plan.
3. **PR 10 is CUT.** Its only surviving justification did not need the upgrade
   (meshopt already works on r128 — the decoder is there and `p5i`'s vendored loader
   already has `setMeshoptDecoder`) and could not have fixed an empty house anyway.
   See the spec's §7.1. **The one live question** is r160's per-instance
   `computeBoundingSphere` — decide it on the draw-call number, not before.

## THE ROBLOX LIGHTING ROUND: SEVEN OF NINE MERGED, RULINGS AT DP

**`origin/main` is at `e84e2e6`.** Rulings are at **DP**. Cache-bust **`?v=28`**.

| PR | Ruling | What |
|---|---|---|
| **#174** | **DJ** | the wrist meter reports draw calls and triangles, and its average stops lying above 50ms |
| **#175** | **DK** | `scene.environment` — imported metal stops rendering near-black |
| **#176** | **DL** | the atmosphere is height-based, with haze and glare |
| **#177** | **DM** | the colour grade rides the tonemapping stage |
| **#178** | **DN** | additive glow planes instead of screen-space bloom |
| **#179** | **DO** | the LIGHTING page on the desk |
| **#180** | **DP** | the LIGHTING page in the headset |

**LAYER 1 IS COMPLETE** (the look: environment, atmosphere, grade, glow) and
**layer 2 is built on both surfaces** (the property panel). Every merge verified:
`main` rebuilds **byte-identical**, 20 lines of `failures: 0`, `real.js` fatal
null. Every branch deleted local and remote.

### NOT MERGED, AND IT ONLY EXISTS IN A WORKTREE

**RULING DQ (droppable lights) is committed at `4d9254f` on `lighting-objects`,
inside `.claude/worktrees/agent-a47840c5a83c1de1c`.** Green in isolation with 21
negative checks — verified independently, not just self-reported. **DO NOT DELETE
THAT WORKTREE: the work exists nowhere else.**

It branched from `f4e2628` and `main` has moved four PRs since, so it needs a
**rebase onto fresh `main` and a full re-verify** before it can open. One real
interaction to settle in that rebase: **DN's `GLOW_CAP` is a fixed 64** against a
39-fixture rig, and every dropped light eats that headroom. Its own advice, which
is sound: truncating the glow batch in array order is wrong *independent* of DQ —
sort by `_lvl` and drop the dimmest, report the count from `lightSlots()`, and
never refuse the drop.

**Task 9 (this record) is the last one. Nothing else is planned.**

| File | What |
|---|---|
| [docs/superpowers/specs/2026-08-13-roblox-lighting-design.md](docs/superpowers/specs/2026-08-13-roblox-lighting-design.md) | **the reasoning** — rulings DJ–DQ, the findings, why route 1 and Unity were rejected, and why PR 10 was cut. **Binding.** |
| [docs/superpowers/plans/2026-08-13-roblox-lighting-prs1-10.md](docs/superpowers/plans/2026-08-13-roblox-lighting-prs1-10.md) | the steps — **and read its "TEST CODE IS PSEUDOCODE" warning before trusting any code block in it** |

### THE PLAN WAS WRONG IN SIX PLACES, AND FIVE WOULD HAVE PASSED A GREEN SUITE

This is the finding of the round. The suites cannot see a shader, so every one of
these ships silently:

1. **`UniformsLib` cannot be extended after load.** `ShaderLib` merges and
   **clones** at module init, and `getUniforms` clones again per material. The
   plan's fog uniforms would have been declared and never supplied — **and its
   own assertion would have passed**, because it read `UniformsLib` directly.
2. **r128's fog varying is `fogDepth`, not `vFogDepth`.** The rename came later.
   A compile error, invisible to all nineteen suites.
3. **`VR.cam` does not exist anywhere in the repo.** The glow's
   `VR.active && VR.cam ? VR.cam : camera` was a permanently dead branch — and
   `camera.fov` is never written in a session either, so the screen-space clamp
   would have used a stale desk value in the headset, inert in exactly the case
   it exists to protect.
4. **The test code is pseudocode.** `assert(W.x)` and `boot()` exist in neither
   suite; both use `P(name, fn)` and reach globals bare.
5. **`?v=N` is not in `src/`** — it is typed onto the URL.
6. **The panel markup was invented** — the house idiom is a `page`/`card`/
   `label.f` shape, not `panel`/`prow`/`data-lk`.

### WHAT THE REVIEWS CAUGHT THAT THE AUTHOR DID NOT

Every one of these was green when it was handed over:

- **DK reached only imported models.** 120 of 120 of the building's own standard
  materials sat at `envMapIntensity` 1 — **7.27× the driven value in a blackout**,
  which is RULING BH's exact fault on all the geometry you stand inside.
- **A VR session mints ~142 more that nothing registered**, the largest block
  being the rope rail you stand at.
- **The Arc's smoke racks build lazily on stage switch**, after the collect point.
- **`goodsMat` clones `M.serge`, and `clone()` copies `envMapIntensity`** — a
  dyed drape froze at whatever the room was when it was pulled and drifted from
  the next cue on. *Right at the instant it is made, and quietly wrong after.*
- **The "six-plane box" was five planes.** The floor sat at `y = 0` and so does
  PMREM's camera, so it was edge-on and contributed **0.00%**.
- **DN's session cap kept the wrong twelve.** In rig order, at downstage centre,
  **all twelve drawn halos scored zero screen area** — the first twelve fixtures
  are the FOH bar behind you. Nearest-first only moved the blind spot. The rule
  that works is a generous view cone, then nearest within it.
- **Two assertions passed against builds they should have failed.** A
  stage-switch case healed by other suites' show loads, and a crew case that
  measured only the lead, whose materials a second hook already covered.

### What he asked for

*"rebuild the lighting engine to look and work like the one roblox uses"* →
layers **1 (the look)** and **2 (the authoring model)**, and when asked whether a
desktop-only graded look would do: **"It has to match in VR."** Then route 2 over
route 1, and a plan covering the three.js upgrade as well.

### FOUR FINDINGS, and two of them corrected advice given in the same conversation

1. **three.js has NO MULTIVIEW at any version** — zero occurrences of `multiview`
   in the published r128, r160, r162 *and* r170 builds. That was the whole
   frame-rate case for the upgrade. **It does not exist.**
2. **The UMD build dies after r160.** `build/three.min.js` is HTTP 200 through
   r160.1 and **404 from r161**. The game loads `THREE` as a CDN global and needs
   cross-part function hoisting, so **r160.1 is the ceiling** unless the
   single-file architecture goes.
3. **The wrist meter already existed.** `vrPerf`/`vrDrawMeter` (`p9.txt:130`) has
   drawn avg ms, peak ms and live foveation on the left wrist since the VR perf
   round. Advice to "put the frame time in the headset" described something
   already built.
4. **The budget is 13.9ms, not 11.1ms, and VR HAS a governor.** `vrOnStart`
   negotiates to the lowest rate ≥72Hz because *"the first headset run could not
   hold [90]"*, and `vrPerf` runs a foveation feedback loop. Desktop `autoTune`
   is inert in a session; foveation is not.

**Finding 4 settles route 1 for good:** foveation is the only mid-session lever,
and a stereo composer forfeits it. Bloom would be bought by removing the safety
net. Route 1 is not in the plan.

**And RULING BY was miscited twice in that conversation.** Its 4.29ms is a CPU
`groundAt` **raycast** for a feature that was **measured and taken back out** —
not render cost, and not in the frame. **There is no measured VR frame time at
all.** Task 0 of the plan is his: four wrist-meter readings.

### The one thing to put to him

**The upgrade's case collapsed after he asked for it.** What survives is KTX2 +
meshopt for the 181MB and 32 releases of fixes — load time and memory, not frame
rate — against a bill that invalidates every intensity he ruled on in a headset
(`useLegacyLights` flips at r155: `BLIND_POWER`, `AUDM_POWER`, **`BLIND_RANK`
0.9 / `AUDM_RANK` 0.8 (BC)**, `BJ_FILL_MAX`, the house at 0.15). It is PR 10,
last and optional. **He was offered the cut and has not answered.**

## STILL TRUE IN THE CODE: #172, RULING DI — THE SETS PARK PAST THE LEGS

Verified after the merge: `main` rebuilds **byte-identical** and the full suite is
green on the merged result. **Nothing is open and nothing is shelved.** Rulings
are at **DI** — and **the DI headset run has still never happened.**

**Cache-bust for the next headset run: `?v=27`.**

He looked at the DF parks in the headset and said the attic, bedroom and closet
were **still in the wings**; then **"i meant past the physical legs. past the
black curtains"**; then **"there is plenty of room between the fly rail and the
legs to fit all three sets"**. Right all three times.

**DF measured the wrong line.** It sized every park against the PICTURE edge at
6.80. A leg is 5.6m of cloth spanning |x| **6.60 .. 12.20**, so all three parks
started inside the masking — the attic 4.33m deep in it.

**AND THE RAIL WAS NEVER AT −19.2.** CE, CS and DF all quote it and all cite
`p9`, which says `fr ? fr.rail : -D.stageW/2 + 2.8` — and −19.2 is the
**fallback**. The live value is `crewFrame().rail` = `XR + 2.8` = **−30.2**,
because `XR` carries `D.wingSR`. The gap between the legs and the rail is
**18.00m, not 7.00m**. His 13.06m attic fits with 2.94m to spare.

So all three park **stage right, 2.00m past the cloth, one behind another**, and
the attic crosses from stage left — CQ picked that side *because* of the rail
that is not there, and stage left (9.80m past the legs) is the one wing that
cannot hold it.

**The three typed offsets are gone.** `BJ_ATTIC_SIDE`, `BJ_SIDE_ROOM` and
`BJ_CLOSET_BACK` could not place his file and the stand-in at once — the attic
is 13.06 × 10.00 with his model against 10.40 × 9.60 without it, and differently
centred, which is why DF left one 2.00m clear and the other 0.57m. `bjWingPack`
measures each set's own box; `bjApplyModel` packs again when a file lands. Both
cases now land at exactly 2.00m past the cloth.

**Found on the way past:** the **auditorium side wall** is a 1.0 × 22.0 × 32.0
box at x −15.50 reaching **z −1.00**, through the middle of the stage-right wing
— his attic acts at z −0.30 and its old park left it at its acting z, 0.70m
inside the wall. And the VR set menu asked about depth before side, so a park
both in a wing and upstage of the backdrop read as "upstage".

Suites **19/19** before and after; **7 mutations negative-checked**, each proved
present in the BUILT file and proved to have changed it, revert byte-identical.
New probe **`tools/wing.js`**.

**WHAT IS STILL HIS TO ANSWER HERE, and it is the first thing to look at on the
headset:** all three sets now enter from **stage right** and stage left is
**empty**. That is a real change to the traffic and it was ours to make — his
words were only "one of the sides" — but he may want the attic back on its own
side, and past the legs it cannot be: stage left is 9.80m from the leg edge to
the wall and the attic is 13.06m wide. If he wants it there, something else has
to give (fly it, thin it, or narrow the legs).

## THE ROUND BEFORE: HE ASKED FOR NINE THINGS AND ALL NINE ARE BUILT

The first time anybody had looked at any of it. Rulings were at **DH** here.

**All of it is on `main`**, at `65de73f`. Verified after the merges: `main`
rebuilds **byte-identical** and the full suite is green on the merged result.

| PR | What | His items |
|---|---|---|
| **#164** | the interval assembles in order; act two keeps its neon (**CZ DA**) | 1, 2 |
| **#165** | his two retimings (**DB DC**) | 7, 8 |
| **#166** | the netherworld shallower, the exterior back (**DD DE**) | 5, 6 |
| **#167** | sets park PAST the wing (**DF**) | 3 |
| **#168** | the record | — |
| **#169** | the gold down, the neon on the black portal (**DG**) | 4 |
| **#170** | the sign gets three positions (**DH**) | 9 |

**SEVEN PRs, SEVEN CLEAN MERGES, NO RECOVERY PR.** Each was based on `main` and
named its dependency in the body — the CLAUDE.md rule, and the lesson of the
#155–#162 round where six stacked PRs collapsed into their own bases and needed
an eighth to land. **Verify the base really is `main` after opening**, every time.

Suites **19/19**. **31 negative checks fired** across the round, every mutation
proved present in the BUILT file *and* proved to have changed it before the
result was read.

Cache-bust at the time: `?v=26`. **It is `?v=27` now — DI changed the build.**

## WHAT IS LEFT: ONE HEADSET RUN THAT NOW SERVES TWO PURPOSES

**Nothing of his is unbuilt.** What has not happened is anybody seeing this
round — and the lighting plan needs a baseline off the same run.

**Do both in one session at `?v=27`:** answer the DI questions below, *and* read
the left-wrist meter (`avg ms`, `pk`, `fov`) at the four moments named in Task 0
of the plan — empty Palace, Beetlejuice pre-show, the 1:00 cue with eight
blinders in, and standing at the proscenium looking up into the neon. Without
those four numbers every cost figure in the plan stays modelled.

The DI questions, in the order they will bite:

1. **Does the neon read on the black portal?** It came in from ±7.75 to **±7.11**
   and its top went from a rake to **flat at 9.51** — a different shape again from
   the two he has already seen, and **it supersedes his own CY rake** (below).
2. **Does the arch look right with no gold?** Four pieces are hidden for
   Beetlejuice: the moulded band, the goldDk inner, the keystone and its head.
   The ivory wall, the sounding board and the lyre all stay.
3. **Is the netherworld right at 4.42m?** Third number on that constant.
4. ~~**Do the parks read as out of the way?**~~ **ANSWERED, AND HE SAID NO** —
   twice. That is RULING DI and #172: they were standing among the legs, and the
   wing they were being squeezed into was 11m wider than three rulings thought.
   The new question is whether **2.00m past the cloth** reads as stored, and
   whether all three coming from stage right is right.
5. **Is FLOOR / PRE-SHOW / UP the right set of three for the sign**, and does the
   desk row naming the stop read better than a percentage?
6. Carried: the houses at 13.6 × 12.76, `BJ_FILL_MAX` 0.55, `BLIND_POWER` 4.6,
   the house at 0.15, 25 seconds of nothing at the top.

## THE ONE PLACE THIS ROUND ARGUES WITH HIM

**RULING DG turns his own CY rake off.** CY was his correction — *"can you make
it slanted just one way not from the center"* — and it was right about the
**gold**, whose top is a quadratic arch: a straight bar across it must lean one
way or the other, and leaning beats fighting a curve. The black portal's top is
**flat**, so a raked bar would cut diagonally across a horizontal member and the
two legs would come out different heights against a frame whose legs match.

`BJ_NEON_RAKE_ON` puts his lean back — **and it is one line in `p5h` AND one in
`p4`, not one line altogether.** That was measured rather than assumed: flipping
it alone leans the frame and leaves the eight blinders on a flat line, floating
off the bar they are meant to be the light from. RULING CY's own assertion
catches it. The pair is left coupled deliberately.

## WHAT THIS ROUND FOUND THAT NOBODY ASKED ABOUT

- **`tools/parked.js` was lying in three ways at once, and had been trusted for
  two rounds.** It cast from **ONE** eye at (0, 1.35, 12) — the middle of the
  stalls, the kindest seat in the house, when the extreme side seats are what
  look diagonally into the opposite wing. It **aimed at the picture opening**
  rather than at the sets, so it could only find a park by accident. And its
  first surface sampling used **bounding-box corners**, which gave his imported
  houses — ONE merged mesh each — nine sample points with eight in mid-air:
  every ray missed and it printed a confident `0/450 UNSEEN`. Fifty eyes and
  real surface points now.
- **Neither the netherworld's depth nor the exterior's seating was pinned by
  anything.** A 36% depth change and a 1.5m move both passed 19/19.
- **An assertion caught the act-two blackout carrying a changeover.** With Q40
  moved behind Q41 the *blackout* became the first cue to declare
  `scene:'interior'`, so the netherworld vanished and the room appeared while
  the blackout's own one-second fade was still going down.
- **The neon's first cut overhung its own legs.** Running the top bar to the
  portal *header's* full width (14.84) left it 0.31m proud of each leg, so the
  frame measured 7.59 wide against a gold band at 7.75 — 0.16m of daylight for a
  ruling whose whole point is coming in by 0.64m.

## WHAT THE ROUND TAUGHT

- **When a request collides with an existing ruling, the collision is the thing
  to ask about — and I asked one question too late.** Read strictly, "no set
  should be parked in a wing" leaves only the fly tower, so three sets went into
  the air: six of seven flying, inverting his own RULING CE and throwing away
  the CQ/CS side entrances, at a cost of four assertion reversals. He corrected
  it in one sentence. **The empty space was BEHIND the sets, not in front of
  them** — the bedroom cleared the masking by 0.49m with six metres of wing
  standing unused outboard.
- **Establishing what a complaint is NOT can be most of the work.** Fifty eyes
  at ~12,000 rays proved every park already invisible from every seat, so any
  assertion written on visibility would have passed against the very build he
  objected to.
- **A mutation can prove the wrong clause.** Giving the flash cue a `portal`
  field trips the assertion's own *guard* and never reaches the emissive check
  underneath it.
- **A negative check can find a hole in the TEST rather than in the code, twice
  in one round.** The frame check would have *blocked* the rake switch it
  advertises (a fixed ±0.6 window cannot hold a bar whose ends move ±0.887), and
  the sign test never observed the haul mid-travel — so `flyExtraAtStop` reading
  the mover's TARGET instead of its live offset passed everything, and the row
  would have named the place it was heading for the whole way there.
- **A number that falls out of geometry should be measured, not typed.** The
  sign's floor stop is `-min.y` of its own world box, because its foot depends
  on a raked arrow's rotation; re-rake the arrow and the stop follows.
- **`updateHouseWait` splitting an audio field is the whole of CZ.** Act one is
  the CLOCK track, so holding the `stop` with the `play` would have left the
  transport firing act two's cues while the curtain was still flying in.
- **The backtick trap bit three more times and cost nothing**, because
  `probe-lint.js` was run BEFORE the suite each time. The rule is not care, it
  is **run the lint after every probe edit**.

## Still his to decide — the four this round raised

1. **`f.glow` always draws.** A 0.55m additive lens quad per fixture whose
   opacity is driven but whose `visible` is never set, so **39 keep rasterising
   in a blackout**. That is verbatim what RULING DN's own comment argues against,
   which makes "one draw call" really 1 + 39. One line
   (`f.glow.visible = lvl > 0.004`), deliberately not taken because it is a
   separate concern from the halo batch.
2. **The `envTrack` rota backstop.** Nine call sites is an enumeration, not a
   guarantee — three review rounds each found sites the previous one had missed.
   The structural answer is a **sliced** rota (`REST_ROTA` is the precedent in
   TRAPS), costed at **1.09ms over 3,399 objects unsliced** against 0.0018ms for
   `envDrive`. Deferred deliberately: new per-frame machinery on a build already
   1.8× over budget is his call, not something to slip into an environment PR.
3. **`GLOW_CAP` ordering**, to be settled in the DQ rebase — see above.
4. **The performance investigation the spec asks for and nobody has done.**
   §7.2 says it belongs *between* DJ and DK; it did not happen, and DK–DN all
   added per-pixel cost on top. He was told and chose to carry on with the
   lighting, which is recorded here as his decision rather than an oversight.

## Still his to decide

- **The cemetery still declares no park** (46.8m parted against a 44m stage),
  and the probe now prices it: **running the hills further does NOT hide it** —
  visibility falls 186 rays → 45 and then RISES again, because `bj:hill`,
  `bj:gate` and `bj:moon` come back into view from the far side. Not a live
  defect: it is switched off outright when struck.
- **The sign's red at GO**, moved to 1:00 with the proscenium's. One line.
- **His files are 181MB and ~70MB is discarded at load.**
- **Which way the neon rakes, if at all** — see the argument above.

## Still owed from earlier rounds

- **RULING BY** — standing on his geometry costs 4.29ms, 38.6% of a 90Hz frame.
- **The graveyard.** He has supplied none and the show OPENS in it until 10:38.
- **Does the join at 4292 sound?**
- **The house floor pool** stays deferred.
- **A park stated as an absolute line** rather than an offset (see CT).
- **A blinder can no longer be carried** (CY). `BLIND_BODY` puts it back.
- `tests/smoke.js` still flakes under full-suite load. Not a regression.
- `pr6.json` in the repo root is still untracked and unruled.

## The park layout after DI (#172, his models — the stand-in packs differently
## and correctly, which is the point)

| set | parks | slot |
|---|---|---|
| interior (his 3 houses) | z −24.78..−11.80, x ±6.80 | **upstage, alone** (CO) |
| attic | x −27.26..−14.20, z −11.80..−1.80 | stage right, **2.00m past the cloth**, first in the queue |
| bedroom | x −22.82..−14.20, z −17.91..−13.30 | stage right, second |
| closet | x −23.22..−14.20, z −24.02..−19.41 | stage right, third |
| house (exterior) | y 10.50..19.40 | **flown** |
| afterlife | y 10.50..19.70 | **flown** |
| roof | y 10.50..19.16 | **flown** |
| cemetery | — | no park; switched off outright |

**Only three sets fly, which is his correction.** All three deck parks are in the
**stage-right** wing now, packed downstage-to-upstage by `bjWingPack` and every
offset measured off the set's own box. Stage left is empty.

**The limits they are packed against**, all read rather than typed: the leg's
outboard edge **LEG_OUT 12.20** (p3), the flyman's rail **crewFrame().rail
−30.20** (not −19.2 — see DI), the stage-right wall **XR −33**, the brick
**PAL_BACK −25.5**, and the auditorium side wall reaching **z −1.00** at x −15.50.

## Feel constants for the headset (one-line retunes)

**THE ROBLOX-LIGHTING ONES ARE ALL REASONED AND NONE HAVE BEEN SEEN.** Nothing in
jsdom has eyes, so every number below is an argument, not evidence — and all of
them are now on the **LIGHTING page**, on the desk *and* in the headset, so they
can be tuned live rather than rebuilt.

In `p2`: **`ENV_INTENSITY` 0.55** (DK — one knob, not two: r128 scales
environment diffuse and specular together), the six-plane box at **`ENV_HALF`
10**; **`ATM`** `density` 0.0055 / **`height` 9.0** / `haze` 1.8 / `glare` 0.4 /
`mix` 0.75 (DL); **`GRADE`** `contrast` 0.12 / `sat` −0.05 / `tint` 0xffeedd /
`mix` 1.0 (DM). In `p4`: **`GLOW_MAX_FRAC` 0.22**, `GLOW_SIZE` 1.9,
`GLOW_MIN_LVL` 0.04, `GLOW_LENS_OUT` 0.45, `GLOW_CONE` 2.2, `GLOW_CAP` 64 (DN);
`HOUSE.clock` 19.33 (DO). In `p9`: **`VR.glowCap` 12** (DN).

**`atmMix` and `gradeMix` are not feel constants — they are safety.** At 0 each
bypasses its effect entirely, so a material that misses the registry renders
*exactly as it did before the ruling* instead of losing its fog or, in the
grade's case, **rendering black**. Do not "tidy them away".

**The questions this round opens, none of them answerable without a headset:**
does the environment read as ambience or as a wash; is height fog right at 9.0m;
does the grade's tint read on the ivory wall; do the halos read as bloom or as
sprites; is `GLOW_MAX_FRAC` 0.22 enough at the proscenium — and note that in a
session the clamp uses the **desk** frustum, so close-up halos are **42–52%
smaller in the headset than on the monitor** (bounded, safe direction, written
into the comment).

In `p4` (`buildRig`): `BLIND_POWER` 4.6 / `BLIND_RANK` 0.9, **`BLIND_X` 7.11 and
`BLIND_TOP` 9.51 (DG — on the black portal, flat)**, `BLIND_BODY` false,
`AUDM_POWER` 2.8 / `AUDM_RANK` 0.8, `AUD_LIGHT_RESERVE` 2. **Rank is RULING BC
and load-bearing.**

In `p5j`: `AUD_WANDER_RATE` 1.0, `AUD_RANDOM_RATE` 1.0, `AUD_STROBE_HZ` 9.0,
`AUD_SWEEP_LO` −15 / `AUD_SWEEP_HI` −98.

In `p5h` (the neon, CH/CX amended by **DG**): `BJ_NEON_BAR` 0.34, **`BJ_NEON_Z`
0.42** (+ `BJ.pz` 0.45 = 0.87), **`BJ_NEON_RAKE_ON` false and
`BJ_NEON_RAKE_FALL` 1.775 — the switch that puts his CY lean back; lean
`BLIND_SLANT` in p4 with it**, `BJ_NEON_RAKE` −1, `BJ_NEON_FADE` 1.2,
`BJ_NEON_BLUE` 0x4fa8ff, `BJ_NEON_RED` 0xff1e10, `BJ_NEON_DARK` 0x0d1116.

In `p5h` (the sign, CF/CU and **DH**): `BJ_SIGN_GLOW` 0.95, `BJ_SIGN_LIT` 2.1,
`BJ_SIGN_LAMP_FADE` 2.5, `BJ_SIGN_LAMP_CUT` 0.05, `BJ_SIGN_OUT` 9.0, and the
three stops — **FLOOR (measured, −2.36), PRE-SHOW (0), UP (`BJ_SIGN_OUT`)**.
The floor is derived from the sign's own bounding box, never typed.

In `p5h` (AW–AZ, CE): `BJ_FLY_SPEED` 1.8, `BJ_HILL_SPEED` 2.0 / `BJ_HILL_OUT`
9.5, `BJ_PART_OUT` 10.5, `BJ_TRACK_SPEED` 2.0.

In `p5h` (the traffic plan, CO–CS amended by **DF** and re-cut by **DI**):
**`BJ_ATTIC_SIDE`, `BJ_SIDE_ROOM` and `BJ_CLOSET_BACK` ARE GONE** — a typed
offset cannot place his file and the stand-in at once, which is what DI is
about. What is left to tune is **`BJ_PARK_PAST` 2.00** (how far past the leg
cloth a park stands), **`BJ_WING_Z0` −1.80** (the downstage limit, set by the
auditorium wall at z −1.00) and **`BJ_WING_GAP` 1.50** (between one parked set
and the next). Everything else falls out of `bjWingPack` measuring the boxes.
Still typed and still his: `BJ_THIN` 0.28, `BJ_WAGON_BACK` −10.0.

In `p5h` (the netherworld, **DD**): **`BJ_AFT_DEEP` 0.35**, `BJ_AFT_TUBE` 0.15,
`BJ_AFT_BACK` 0x000000.

In `p2` (CL): `PAL_DEEP` 8.5.  In `p5c`: `SCENE_PARK_SPEED` 2.0.

In `p5i` (BP, BX, CB, CC, CD, CT, **DE**): `BJ_TRI_BUDGET` 150000,
`BJ_MAT_BUDGET` 8, `BJ_TEX_BUDGET` 2048, `BJ_FIT_AIR` 0.30, `BJ_SET_DEPTH`
10.0, `BJ_HOUSE_UPSTAGE` 1.5, **`BJ_EXT_UPSTAGE` 1.5**, `BJ_FILL_MAX` 0.55,
`BJ_FILL_RATE` 1.6, and each manifest entry's `fit` and `thin`.

## Two new engine pieces worth knowing about

- **`PROS_GOLD` / `prosGoldSet(on)`** (p2b) — the four gold pieces of the house
  proscenium, collected rather than reparented (`buildRooms()` sorts
  `world.children` and they are all on `STATIC`). **`showStrike` restores them
  unconditionally**, so no production can leave the building altered and the
  stage swap cannot either.
- **`flyExtras` may carry `stops`** (p5c, RULING DH) — `flyExtraStops`,
  `flyExtraToStop`, `flyExtraAtStop`. Declared and optional: a haul with no
  stops behaves exactly as it did, and one with stops keeps its `inOff`/`outOff`
  so every existing caller is untouched. Buttons are found by **META**
  (`{flyExtra, stop, stopName}`), never by pixel.

## Standing facts

Suite count is **19** (`npm test` in tests/) — `probe-lint.js` runs first and is
a test of the TESTS, not of the game. The patch is 39 channels on every stage.
RULING AV still governs; AO stays repealed; RULING B still holds. RULING BB is
untouched.

**Every timestamp in the Beetlejuice plot is a position in his WHOLE recording.**

**His photographs are never committed.**

## Shelved

**Nothing.**
