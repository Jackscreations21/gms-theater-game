# BEETLEJUICE — implementation plan (PRs 1–7)

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fifth production whose **cue times and fade durations are
measured off a recording of a real performance**, and whose scenery and
channel levels are interpretations in the show's own vocabulary. Six scenic
PRs then one cue PR. The auto-cue transport is **not** in this chain.

**Spec:** `docs/superpowers/specs/2026-08-10-beetlejuice-design.md` —
**RULING AO is binding.** Read it before starting. The measurements it quotes
came from `tools/video.js` and can be reproduced with
`node tools/video.js <video> --skip=33`.

**Tech stack:** three.js r128 (CDN, no build step), one concatenated HTML
file, jsdom + real three.js with a stubbed `WebGLRenderer` for tests.

---

## Architecture

A **new part, `src/p5h.txt`, appended after `p5g` in `build.sh`.** `SHOWS` is
declared at `src/p5c.txt:14`, so any part registering a show must load after
it. **Never sort or reorder `build.sh`** — its order is a dependency order.

The part registers one record in the shape the other four use
(`SHOWS.lostboys`, `src/p5d.txt:227`, is the closest model):

```js
SHOWS.beetlejuice = {
  name:  'BEETLEJUICE',
  blurb: '…',
  note:  'An interpretation in the show’s own vocabulary, not a copy of anyone’s design.',
  load(){ /* scenery into showRoot() */ }
};
```

That `note` field is not decoration — all four shows carry it, and p5c's own
header says the same thing in prose: *"These are interpretations, not
reproductions. Nobody's ground plan or light plot went into them."* **RULING
AO is already the house position; this show must not be the exception.**

**Show state goes in `showBlank()` (`src/p5c.txt`), nowhere else.** The
comment above it records why: three hand-copies of SHOW's shape had drifted
apart, and keys a show wrote ad hoc leaked across stage swaps because
`Object.assign` can overwrite but never remove. If Beetlejuice needs new
state, it is added there and it is added once.

Scenery is built into `showRoot()`, walkable surfaces are registered with
`showWalk(m)`, textures are **canvas textures only** (RULING AI — no external
assets, ever), and **detail is paid for by `mergeParts` (p2), not by adding
meshes**. Never merge anything grabbed, moved or recoloured.

## Ground rules (the ones that actually bite)

The full list is `CLAUDE.md` and `docs/guide/WORKFLOW.md`. These are the ones
this round will trip over:

1. **`the-house.html` is committed BUILT.** After editing `src/`, run
   `sh build.sh` and commit both. Never hand-edit the built file.
2. **This round DOES add a part** — `p5h` goes **after `p5g`**, appended.
   Adding it anywhere else, or sorting the file, breaks the load order.
3. **Never stack PRs.** Open each only after its parent merges, rebased onto
   fresh `main`, retested.
4. **Suites green before AND after every change, and every new assertion
   negative-checked against a WRONG implementation** — not merely an absent
   one. Four `mergeParts` assertions once passed against five deliberately
   wrong implementations; that is its own TRAPS entry.
5. **The deck is `y = 0` on every stage.** The proscenium is **15.0 m ×
   10.4 m**, the stage 44 m wall to wall, 17 m deep, grid at 25 m (`D` in
   `src/p2.txt:24`). This set interprets onto that opening at roughly 1:1 —
   **no metric scale is needed from the video.**
6. **A light plot is written in STAGE coordinates; a fixture `aim` is in
   WORLD space.** `stageToWorld()` in p4 converts.
7. **Never `setTimeout` for game timing.** Relevant in PR 7.
8. **Commits use the owner's no-reply address**; PowerShell mangles quoted
   `-m`, so write the message to a file and use `-F`; never `git add -A`.
9. **Node and ffmpeg are both absent from a fresh shell's PATH.** Prefix
   `export PATH="/c/Program Files/nodejs:$PATH"`. `tools/video.js` locates
   ffmpeg itself.
10. **Test probe templates eat every backslash**, and one escaped `\'` kills
    the whole probe. Build regexes from doubled-backslash strings and avoid
    apostrophes inside probe strings.
11. **jsdom's 2D canvas context is a noop stub.** A canvas texture cannot be
    pixel-asserted; assert on the material/texture wiring instead.

## Suite

A new suite, `tests/beetlejuice.js`, takes the count **17 → 18**. That number
appears in `CLAUDE.md`, `docs/guide/TESTING.md` and the runner — all three get
updated in PR 1, not later.

## Two things PR 1 found that change everything after it

**1. The configurations are SCENES, and the machinery already exists.** p5c
carries `sceneAdd` / `sceneWalk` / `sceneShow` / `sceneNext`, a cue can carry a
`scene` and firing it switches the set (`p5c:1377`), and p7 already lists them
in the UI. Its header says the intent outright: *"A show with eight locations
does not get eight stages. It gets one, and the sets take turns on it."*

That machinery was built for Beetlejuice, orphaned when the show was removed,
and recorded in HANDOFF as *"general machinery that no current show uses"*.
This round is the first production to use it. So **each later PR adds a scene
via `sceneAdd`, registers its walkables with `sceneWalk`, and points its cues
at it** — it does not pile every configuration into one load. A scene that is
off has its layers disabled, so it costs **no draw call and no raycast** while
it waits, which is why 10–12 configurations is affordable at all.

Only `p2d` is genuinely dead (it is not in `build.sh` at all); audit item 20's
inventory should be re-read before anyone deletes it, because the scene
machinery it is grouped with is now load-bearing.

**2. A production here is a whole EVENING, and `show.js` enforces the shape.**
This is not optional and it is not documented anywhere else, so:

- a cue **`0.5`** (preset) and a cue **`1`**, both with the curtain in
- **exactly two** cues take the curtain out — the top of each act
- an interval of three consecutive cues whose labels match `/act one ends/`,
  `/INTERVAL/`, `/act two/`: the first a true blackout with the house down, the
  second with the house at ≥ 0.9 and the rig dark, the third with the house at
  0.1–0.4. It must sit **25–65 %** of the way through the cue list.
- a **`curtain call`** exactly **four cues from the end**, lit, house down,
  curtain out; then a `blackout` that brings the curtain in, a
  `warmers`/`title` cue with the front of house aimed **up** at the cloth
  (y ≥ 5, ≥ 4 channels over 0.4, ≤ 10 channels lit), then `house up` at ≥ 0.45
  with a fade of ≥ 5 s and nothing above channel 8 still burning.
- the curtain may be in **only** for those cues — never mid-act.

PR 1 stands that whole skeleton up, which is why its cue list is 30 cues rather
than a handful. The measured act break (**71:02**, the show's longest blackout
at 13.3 s) and the measured curtain call (**141:02**, 82 events of lights
bumping) land exactly where the convention wants them, which is a good sign for
both. **Act two currently plays in the cemetery scene and says so in a comment**
— later PRs reassign those cues as their scenes arrive.

---

## PR 1 — the show, the portal, the cemetery

The cheapest geometry in the round, chosen deliberately: it stands the part
up so every later PR has somewhere to land, and it is provable.

- [ ] **Step 1: write the failing suite** — `tests/beetlejuice.js`:
  - `SHOWS.beetlejuice` exists and carries `name`, `blurb`, `note`, `load`.
  - its `note` states it is an interpretation (guards RULING AO in code).
  - `load()` populates `SHOW.group` and leaves `SHOW.key === 'beetlejuice'`.
  - the deck is walkable: `SHOW.walk.length > 0` and every walk mesh sits at
    `y ≈ 0` (guards the y=0 invariant).
  - nothing hangs below the deck; nothing sits outside the 15.0 m opening
    that is meant to read as inside it.
  - a **mesh budget**: the whole load costs no more than an agreed count.
- [ ] **Step 2: run it and verify it FAILS** — against the unchanged build,
  for the right reason (`SHOWS.beetlejuice` undefined), not a typo.
- [ ] **Step 3: create `src/p5h.txt`** and append it after `p5g` in
  `build.sh`. Register the show record. `load()` builds:
  - the deck (model p5d's extruded apron+thrust shape),
  - **the portal** — a rectangular frame standing in the proscenium
    opening, our own proportions and section, emissive-trimmed. This is the
    constant present in nearly every reference frame.
  - **the cemetery** — a rolling-hill silhouette cut as a polygon profile,
    a disc moon upstage, ground mist left to the existing smoke system.
  - all static clusters through `mergeParts`.
- [ ] **Step 4: add the suite to the runner** and bump the count 17 → 18 in
  `CLAUDE.md` and `docs/guide/TESTING.md`.
- [ ] **Step 5: `sh build.sh`, verify the new suite PASSES.**
- [ ] **Step 6: negative-check** every new assertion — break each one
  deliberately (a walk mesh at `y = 0.3`; a `note` without the
  interpretation line; a mesh count over budget) and confirm the test fails.
- [ ] **Step 7: verify the other 17 suites are green, UNEDITED**, and
  `node real.js` still reports `"fatal": null`.
- [ ] **Step 8: commit** `src/p5h.txt`, `build.sh`, `the-house.html`,
  `tests/beetlejuice.js`, the runner, `CLAUDE.md`, `TESTING.md`.

## PR 2 — the house exterior

The first signature unit. Two-storey clapboard mass with gables, a porch and
a chimney, in our own proportions.

- [ ] Failing test first: the unit exists in `SHOW.group`, sits inside the
  opening, its footprint clears the apron, and it holds a mesh budget.
- [ ] Build it; clad it with a canvas clapboard texture; `mergeParts` the
  static shell. Anything intended to move later stays unmerged and a test
  says so.
- [ ] Negative-check, full suite, boot clean, commit built.

## PR 3 — the house interior shell

Curved panelled walls, a central staircase, chandeliers. Reference shows it
under at least five different looks, so **the shell must light well from many
angles** — that is a geometry decision, not a lighting one.

- [ ] Failing test first: the shell exists, the stair is walkable and its
  treads rise from `y = 0`, the chandeliers hang from real trims and none
  goes below the deck.
- [ ] Build, merge statics, negative-check, full suite, commit built.

## PR 4 — the interior's dressings

The redecorated variant, the bedroom, and the attic, built **on PR 3's
shell** rather than as new rooms — that is what the reference shows and it is
also the cheap way.

- [ ] Failing test first: each dressing can be applied and removed without
  leaving state behind; nothing leaks into `SHOW` outside `showBlank()`.
- [ ] Negative-check, full suite, commit built.

## PR 5 — the afterlife

**The cheapest high-impact geometry in the round**: nested concentric frames
with an emissive material, in our own proportions and colours. Plus the large
angular structure that shares its language.

- [ ] Failing test first: the nest exists, its frames are concentric and
  ordered, the emissive material is shared not per-frame (the shared-material
  rule — and the array-material draw-call corollary in TRAPS).
- [ ] Negative-check, full suite, commit built.

## PR 6 — the remainder

The crypt, the sign set (**our own words**, per RULING AO), and the
bare-stage looks, which mostly cost nothing but a cue.

- [ ] Failing test first, negative-check, full suite, commit built.

## PR 7 — the cue list

The point of the round: a `looks` array with the **measured** times and fades.

- [ ] Copy the authoring pattern from `plotLostBoys` (`src/p5d.txt:640–676`)
  exactly: snapshot haze/fly/aims, then per look —
  **`restoreAims(homeAims)` before every `L.look()`.** Omitting it was audit
  finding **M2** on `plotOutsiders`; it is not to be repeated, and a test
  should guard it.
- [ ] Each cue carries a comment recording **what was measured and what was
  interpreted**, the way p5d's looks carry theirs. Times, fade durations,
  blackouts: measured. Every channel level and focus: interpreted onto our
  25-channel rig, which is not the rig they used.
- [ ] Seed from the Phase 1 output: **33 blackouts ≥ 1 s** (near-certain),
  the **76 strong fades** (an optimistic ceiling — a handheld zoom inside a
  held shot moves brightness with no lighting change), fade times **median
  2.2 s**, the act break at **71:02**, the curtain call in the last 2.5 min.
- [ ] **Demonstrate `follow` here.** Fill each cue's `follow` with the
  measured gap and the show runs itself with no new code (`p6.txt:180`). All
  four existing shows leave it `null`. **This is the cheap version the owner
  should see before any transport is specced** — it may be the whole feature.
- [ ] Failing test first: the cue count matches, fades are the measured
  numbers, `follow` gaps reconstruct the measured timeline, and firing a cue
  restores the whole state.
- [ ] Negative-check, full suite, boot clean, commit built.

---

## What this chain does NOT do

The **timecode transport** is a separate round, gated on rulings **AP onward**:
cheap `follow` chaining versus a real dt-driven transport, whether it must be
reachable from inside VR, and what a running show does on a stage swap.

Two facts to carry into that discussion: `follow` uses **`setTimeout`** — the
one surviving violation of "never `setTimeout` for game timing" — and a stage
swap **cancels** it, so an unattended show dies when you walk into the other
theatre. Chained relative waits also drift where absolute timecode does not.
`stepProgram(dt)` (`p6.txt:353`) is the model to follow if it is built.

## Done means

- 18/18 suites green, every new assertion negative-checked against a wrong
  implementation.
- `node real.js` → `"fatal": null`.
- `main` rebuilds byte-identical after each merge; work branches deleted
  local and remote.
- `STATE.md` updated as work lands, a HANDOFF "Done" block when the round
  closes, and any new trap into `TRAPS.md`.
- **None of it has met hardware.** Whether a video-derived show reads as a
  show, and whether its pace is right, goes in HANDOFF's headset section as a
  question — not asserted anywhere as a fact.
