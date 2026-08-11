# BEETLEJUICE look & transitions — the build, eight PRs (then one per model)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** every scene change choreographed so nothing pops, the portal relit to
the photographs and cue-driven, the soft goods repainted to the photographs,
and a model-import pipeline so the owner's own set models drop in as they
arrive.

**Spec:** `docs/superpowers/specs/2026-08-10-beetlejuice-look-transitions-design.md`
— **read rulings AW–AZ before touching any of this.** AP–AV still bind.

**Architecture:** the changeover engine extends the existing scene mover in
`p5c` (part-movers + enter/exit data on the scene record); the portal and soft
goods are `p5h` rebuilds; the import pipeline is a new vendored-loader part
plus an `assets/` folder with mandatory silent fallback to the built
stand-ins.

**Linear chain, never stacked.** Each branch is cut after its parent merges,
rebased onto fresh `main`, rebuilt (`sh build.sh`), 18/18 green before the PR
opens. Every new assertion **negative-checked against a WRONG implementation**,
not an absent one — five weak assertions nearly shipped last round; the check
is the defence. Commits by `-F` message file, owner's no-reply address, never
`git add -A`.

---

## PR 1 — the spec, this plan, and the owner's modeling brief

Docs only: the spec (rulings AW–AZ), this plan, and `docs/MODELING.md` — the
per-set dimensions, budgets and export rules the owner models against. Lands
first so the rulings can be argued with before anything is built.

---

## PR 2 — the changeover engine (RULING AY)

**Where:** `src/p5c.txt`, beside the mover it extends (`sceneTravel` block,
p5c ~175–235). No p5h changes yet — the engine must work on scenes that have
no choreography data, behaving exactly as today (instant), or the other four
shows break.

**Part-movers.** A scene may carry several named movers over child groups,
alongside the whole-group `sc.mv`:

```
sc.pmv = { hillsL: {group, axis:'x', home:-3.1, out:-9.5, off, target, speed}, … }
sceneTravelPart(sc, name, group, axis, home, out, speed)   // registers one
```

- `sceneMoveStep(dt)` advances part movers exactly as it advances `sc.mv` —
  same EPS, same clamp, same dt discipline, **never `setTimeout`**.
- `sceneTravelling(sc)` is true while the whole-group mover OR any part mover
  is mid-travel — the deferred hide (`mvHide`) therefore waits for the last
  part to arrive before `sceneApply(sc, false)` lands.
- Part groups need `matrixAutoUpdate = true` and the `sceneTravels` flag, the
  same two-sided guard `sceneTravel` already applies (the frozen-group trap:
  a frozen group takes the write and stands still).

**The changeover.** New `sceneChangeTo(name)`:

- Outgoing scene (`SHOW.scene`): fire its exit — every part mover targets
  `out`, the whole-group mover (if any) targets its parked offset **only when
  the cue's explicit `move:` says so** (the wagon's moves stay cue-authored) —
  and set `mvHide` so it hides on arrival. A scene with no movers at all
  hides instantly, as today.
- Incoming scene: `sceneApply(sc, true)` **with every part at `out`**, then
  fire its enter — every part targets `home`. Overlapped: both run in the
  same frames, like a real changeover.
- Retarget, never queue: a changeover fired mid-changeover retargets all
  movers (the AP rule, extended).
- `showCueExtras` (`p5c.txt:1477`) calls `sceneChangeTo(c.scene)` instead of
  `sceneShow`; the scene panel's click path does the same. `sceneShow` itself
  survives untouched for boot/preset use (`plotBeetlejuice` tail,
  `standByAtTheTop`) — a preset is not a changeover.

**Dressing deferral (AY).** In `showCueExtras`, a `c.dress` while the wagon
is on stage or mid-travel is **not applied**: it parks on `SHOW.pendDress`
and `sceneMoveStep` applies it the moment the wagon's offset reaches its
parked position. Applied immediately only if the wagon is already parked off.

**p2k parking.** Part-mover offsets, `pendDress`, and any mid-changeover
state park and restore with `sc.mv.off` (find the existing scene-parking
block in `p2k` and extend it — a changeover must not be found half-done on
walking back in).

**Tests** (`tests/sets.js` for the engine on a synthetic scene,
`tests/beetlejuice.js` for the wagon/dress rules):

- a part mover steps to `home` in the expected time under stepped `dt`;
- mid-changeover, BOTH scenes have layers enabled; the outgoing scene's
  layers disable only after its last part arrives;
- **no-pop:** a scene coming on via a cue is at `out` on the first frame and
  strictly between `out` and `home` mid-travel — never at `home` instantly;
- a retarget mid-changeover does not queue;
- `dress` while the wagon is on stage defers, and applies the frame the wagon
  parks; `dress` while parked applies immediately;
- a stage swap parks part offsets and pending dress, and restores them;
- a scene with no `pmv` and no `mv` changes instantly (the other-shows
  guard) — Lost Boys/Hamilton suites stay green untouched.

**Negative checks:** an engine that calls `sceneApply` directly (instant
swap) must fail the no-pop and mid-changeover assertions; a dress applied at
cue time must fail the deferral test; a `sceneTravelling` that ignores part
movers must fail the deferred-hide test.

---

## PR 3 — the portal relit (RULING AX)

**Where:** `src/p5h.txt` portal block (~364–428) — the `bj:portalTrim` tube
mesh and its `neonB` material come out as built. The weathered-board
`bj:portal` frame and cornice stay.

**The new frame:** a lit tube rectangle round the opening, proportioned off
the photographs (tubes at the opening edge, mitred corners, a second inner
run — match the photos, one merged geometry, ONE material: the array-material
draw-call trap). Registered as `BJ_PORTAL = {mesh, mat, lvl:0, col:new
T.Color(), tLvl:0, tCol:new T.Color()}`.

**The cue field:** cue record grows `portal:{col:'#88ccff', lvl:1.2}`
(nullable; the compile tail at p5h ~1900 copies it the way `neon`/`dress`
are copied). Missing field = level 0 — dark unless asked for.

**The fade:** `updatePortal(dt)` lerps level and colour toward targets,
dt-driven, called where `sceneMoveStep` is called. `showCueExtras` sets the
targets. The netherworld's `SHOW.neon`/`setNeon` machinery is untouched —
that neon is the set, not the portal.

**Cue values (retunable one-liners):** blue `#7fd4ff` lvl 1.2 on the
exterior looks (act two's opening cues, the `scene:'house'` cues); purple
`#b06cff` lvl 1.0 on the Deetz house-on cues (3771→4262); level 0 everywhere
else. The owner retunes by eye on the headset.

**Tests:** the old trim mesh is gone (the assertion that pinned
`bj:portalTrim` is REWRITTEN IN PLACE to say what replaced it and why); the
new frame is one mesh/one material inside x ±7.4; cues carry `portal` through
the compile; the fade steps under `dt` and does not snap.

**Negative check:** against a fade that snaps (`lvl = tLvl` directly) — the
dt assertion must fail.

---

## PR 4 — the show curtain and the graveyard sky (RULING AW)

**Where:** `src/p5h.txt` — `bjCurtainCanvas` (~200) and `bjBackdropTex`
(~120), plus the goods that wear them.

- **Show curtain:** the photograph's purple-blue cloth with black swirl
  scrollwork — big irregular spirals, colour graded across the width the way
  the photo's light does. Painted at 2048-wide canvas.
- **Graveyard sky/backdrop:** the cloud sky with the enormous cratered moon —
  moon up-right per the photo, painted craters, cloud banks lit from below,
  deep blue field. This cloth is the `bjBackdrop` good on FLY[7]; the moon
  is painted, not a mesh.

**Tests are structural** (`fillText`/paint invisible to jsdom): canvas
dimensions, the goods still hang on their lines with their trims, materials
still from the expected caches. Likeness is a headset question and says so.

**Negative check:** whole-suite against `main`'s build (texture-shape
assertions must fail there where sizes/anchors changed).

---

## PR 5 — the exterior cloth, the sign, the marquee (RULING AW)

**Where:** `src/p5h.txt` — the `house` scene's painted cloth, the `bjSign`
scene build (~1426–1505), and the marquee/`bjSignTex` (~265–325).

- **House-exterior cloth:** the photo's wonky clapboard house with porch and
  bare trees, painted; it keeps its Y mover and its fly-out cue untouched.
- **The flown sign:** two stacked BETELGEUSE decks in red neon inside a bulb
  border, the long chevron arrow beneath — geometry re-proportioned to the
  photo, lettering repainted, the mover (`sceneTravel(sgnFly,'y',…)`)
  untouched.
- **The marquee:** repainted to its photograph.

**Tests:** sign still downstage of `FLY[0].z`, still travels out above the
header; structural pins on the new proportions; marquee mesh count unchanged
or accounted.

---

## PR 6 — the model-import pipeline (RULING AZ)

**Where:** new part `src/p5i.txt` appended in `build.sh` immediately after
`p5h` (**append — never reorder**); vendor three r128's `GLTFLoader` from
`tests/node_modules/three/examples/js/loaders/GLTFLoader.js` into the part
(code in the file, per the single-file rule for code); new `assets/` folder
with a `README` line; manifest + loader:

```
const BJ_MODELS = { attic:'assets/bj-attic.glb', house:'assets/bj-house.glb', … };
loadSetModels()          // called once at boot, after the show registers
loadSetModel(scene, url) // fetch → parse → validate → swap in
```

- **Fallback is mandatory and silent:** fetch fails (file://, offline, not
  yet delivered) → the built stand-in stays, one muted console line, no
  throw. A missing model is a normal state.
- **Budgets enforced:** >30k triangles, >8 materials, or textures >2048
  refuse the model with a console line naming the budget and the excess —
  the stand-in stays.
- **Wiring on accept:** meshes named `walk_*` go through `sceneWalk`; the
  stand-in children of the scene group are removed and the model's root
  added **inside the same group**, then `sceneApply(sc, sc.on)` re-runs so
  layers/raycast discipline holds whatever state the scene was in.
- Scale: meters 1:1; a per-entry `scale` field in the manifest for a model
  delivered in feet.

**Tests** (`tests/beetlejuice.js`): a tiny synthetic `.glb` fixture (built in
the test as a buffer — a two-triangle mesh with one `walk_floor` node) parses
via the vendored loader in jsdom, swaps into a scene, wires the walkable, and
respects layers when the scene is off; an over-budget fixture (9 materials)
is refused and the stand-in survives; a failing fetch leaves the stand-in
untouched.

**Negative checks:** budget check disabled must fail the refusal test;
swap-in that skips `sceneApply` must fail the layers test.

---

## PR 7 — the choreography data and the cue wiring (RULINGS AY + AX together)

**Where:** `src/p5h.txt` — each scene's build gains its part-movers and
enter/exit registration; the cue list gains the `portal:` fields per PR 3's
table. Fade times, levels and `at` times DO NOT change.

The choreography, per scene (speeds are feel constants, one-line retunes):

| Scene | Parts and moves |
|---|---|
| cemetery | hills split and run to the wings (x, ±), tree/mound with the SR hill; crosses ride their hills |
| attic | flies (y): whole scene rises to above the header, like the flown piece it is |
| closet, bedroom, roof | fly (y), same pattern |
| afterlife (netherworld) | flies (y) |
| house (exterior cloth) | keeps its existing Y mover and cue-authored moves |
| interior (the wagon) | keeps its existing Z mover and cue-authored moves |
| bjSign | keeps its existing Y mover |
| bare | nothing to move — changes instantly, and the no-pop test exempts scenes with no parts |

Fly-out height: parts clear the 9.2m opening plus a margin (out = +10.5 on
y), matching `BJ_SIGN_OUT`'s logic.

**Tests:** every non-bare scene has enter/exit data (a sweep assertion, so a
future scene cannot ship popless); the full cue list run under a stepped
clock never pops a scene (drive `fireCue` through the show's spine with
`sceneMoveStep` stepping, assert the no-pop invariant at every step); covers
still hold (the existing assertion family, untouched); portal fields present
on the exterior/Deetz cues.

**Negative check:** strip one scene's enter data — the sweep must fail; wire
one scene to `sceneShow` directly — the no-pop run must fail.

---

## PR 8 — the record

STATE.md rewritten for the round; HANDOFF.md Done block + a fresh NEXT
SESSION (headset: do the changeovers read, does the portal colour read, are
the soft goods right — and the standing frame-rate round); any new traps to
TRAPS.md; cache-bust bumps to `?v=18`. The suite count stays 18.

---

## After the chain: one PR per delivered model

As `bj-<set>.glb` files arrive from the owner: commit the asset, add its
manifest entry (+ scale if feet), verify budgets pass, walkables wire, suites
green, and the stand-in retires inside an unchanged scene group. Each is
independent once PR 6 is in — these may go in any order, as they come.
