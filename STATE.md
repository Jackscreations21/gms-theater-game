# STATE — 2026-08-11

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## IN FLIGHT — his sound and his light plot (rulings BA–BD)

The owner delivered **four hand-written cue files**
(`C:\Users\patri\Documents\beetlejuice light cues\`: `pre show.txt`,
`act one.txt`, `act 2.txt`, `set cues.txt`) and asked for three PRs: the new
lights + the audio + the pre-show, then act one, then act two with the set
times checked. Spec:
`docs/superpowers/specs/2026-08-11-beetlejuice-sound-and-house-design.md`;
plan: `docs/superpowers/plans/2026-08-11-beetlejuice-sound-house-prs1-3.md`.
**A linear chain — each link opens only after the one before it merges.**

- **PR 1 (this one)** — the audience rig (8 blinders round the arch, 6 movers
  over the seating; the patch is 25 → **39 channels on every stage**), the
  sound (**RULING BA**: two tracks read from `assets/audio/`, never committed,
  missing = silent), the **audio-locked transport** (**RULING BB**: while the
  show track plays it IS the cue clock, so nothing drifts), the **pattern
  engine** (**RULING BD**: wander/sweep/random/flash off the frame `dt`), and
  the top of the show as he wrote it.
- **PR 2 (this one)** — **act one is his now.** 28 of his timestamps became
  cues, the ten set changes all stayed on their own seconds, and the invented
  looks from the measuring round ("the moon takes the upstage", "the mourners",
  "a hard green across the frames") are gone. His snaps have no fade times, his
  30-second fade at 30:00 is 30 seconds, and both his mid-act blackouts cover
  the set change that follows them. **The act break takes the house to HALF** —
  the second thing he changed; that assertion was reversed in place, not
  deleted. Measured fade durations from #90 survive only where he gave no time
  of his own.
- **PR 3** — act two, plus the set-time diff. **One numeric change found in
  his new set list: the netherworld goes 1:39:00 → 1:39:19.** Everything else
  matches what is built. The second thing he half-remembers changing is in the
  lighting: the act break takes the house to **half**, where the built
  interval cue takes it to full.

**The audio files cannot be committed and that is the ruling, not a TODO:**
`videoplayback.m4a` is 134 MB (GitHub's hard limit is 100 MB), it comes off a
video (TRAPS forbids committing that), and it is a commercial recording on a
repo with Pages on. `docs/AUDIO.md` is the File-column contract; the owner
drops the two files into `assets/audio/` locally. **On Pages the Quest will
run silent** until he points a manifest entry at a URL he hosts — one line, no
code change.

## Where things stand

**The look-and-transition round (rulings AW–AZ) is MERGED — five PRs,
#115–#119.** `main` = ae45e8f, rebuilds byte-identical at **1,131,737
bytes**, 18/18 suites, `real.js` fatal null. Cache-bust for the headset:
**`?v=18`**.

The owner headset-ran the re-time round and gave three findings (sets look
nothing like the pictures; every change pops; remove the neon tubes), then
reshaped the round mid-flight: **he models the sets himself** ("make anything
that isnt a set like curtain and drops"), the show curtain stays as it was
(he likes it), the sign/marquee repaints are cut, and the neon-tube removal
— put back to him against his own photographs — became "rebuild it to match",
then was **shelved** with the rest of the portal work when he trimmed scope
to "the curtains, the set movement and the model import".

What merged:

- **#115** — spec (AW look, AX portal, AY nothing-pops, AZ model import),
  plan (`docs/superpowers/plans/2026-08-10-beetlejuice-look-prs1-8.md`), and
  **docs/MODELING.md** — the owner's modeling brief. The File column in its
  set table IS the contract: exact filenames, budgets (≤30k tris, ≤8
  materials, ≤2048 textures, no lights), `walk_*` floors, meters, origin at
  footprint centre.
- **#116** — the changeover engine (p5c): named part-movers (`sc.pmv`,
  `sceneTravelPart`), `sceneChangeTo` overlapped changeovers with deferred
  hide, dressing deferral (`SHOW.pendDress`), panel + prev/next choreograph.
  Scenes without data change instantly — the other four shows untouched.
- **#117** — the movement data: graveyard hills (HALF-WIDTH per side, so the
  run truly clears the 13.6m opening — review catch, clearance pinned by a
  world-box test) run to the wings at the 9:45 beat; attic/closet/bedroom/
  roof/netherworld fly on 'all' wrappers (out y +10.5); cue `move:` can
  address parts. Cemetery's empty dressing pair retired.
- **#118** — the cloths: graveyard sky repainted (2048x1024, cratered moon
  aspect-corrected, underlit cloud banks); the exterior house is now ONE
  painted drop (`bjHouseClothTex`, metre-scaled helpers, tunable); **the
  exterior finally flies** — its mover was never wired AND the cue engine
  hid sets before moves landed. The fix is the **SPLIT RULE** in
  `showCueExtras` (p5c): outgoing-scene moves land BEFORE the changeover,
  all others AFTER — each plain ordering fails a different behavioural test;
  the comment in p5c is the canonical writeup. Return moves authored on
  cues 24/25 (goBack convention: the engine never homes a whole-group mover).
- **#119** — the model importer (new part `p5i`, appended after p5h in
  build.sh): vendored r128 GLTFLoader, `BJ_MODELS` manifest contract-pinned
  against MODELING.md by a bidirectional test (filenames AND scene/dress
  keys), budgets + stray-light refusal with named console lines, silent
  fallback (a missing model is a normal state), routing that inherits the
  choreography (flyers/hill-sides/dressings/shell), walkable eviction incl.
  `wasWalkable` clearing, landed models join the static freeze, stage-swap/
  strike-safe via scenes-array identity pinning. Boot hook: guarded call in
  `showLoad`.

## Shelved, deliberately

**The portal rebuild (RULING AX) sits on the LOCAL branch `bj-portal`**
(commit a22bd36, built on the old #116 base): old blue-green trim out, a
photo-proportioned cue-driven frame in (`portal:{col,lvl}` cue field, dt
fade), tests negative-checked. It passed implementation but had NO review
passes and was never opened — the owner trimmed it out of scope. If he ever
wants it: rebase onto main (expect conflicts with the split rule in
showCueExtras and the p5h repaints), retest, review, open.

## What is next

1. **The owner's models arrive** — one PR per `.glb`: file into `assets/`
   named per MODELING.md's File column, manifest already fetches it, budgets
   auto-refuse, suites green, done. No code needed unless routing surprises.
2. **The headset checklist** (below, and in HANDOFF) — the changeovers,
   the 9:45 empty, the two repainted cloths. `?v=18`.
3. `tests/smoke.js` flakes intermittently under full-suite load (wall-clock
   dt sensitivity; ~2 in 9 full runs, never in isolation). A follow-up task
   chip was left; it is NOT this round's regression.
4. `pr6.json` in the repo root is still untracked and unruled (pre-dates
   the round).

## Feel constants for the headset (one-line retunes, all in p5h)

- `BJ_FLY_SPEED` 1.8 — fly-outs take ~5.8s; on cues 15/16/17/29/34 the
  outgoing set is still rising 2–3s after the next look is lit. Theatre,
  unless it reads slow.
- `BJ_HILL_SPEED` 2.0 / `BJ_HILL_OUT` 9.5 — the 9:45 run fits its 5s fade.
- `BJ_PART_OUT` 10.5 — fly-out clearance over the 9.2m header.

## Standing facts

Suite count is 18 (`npm test` in tests/). The show curtain, sign and marquee
keep their pre-round look by the owner's word. RULING AV (model on the
production, Beetlejuice only) still governs; AO stays repealed. All work via
PRs, linear chains, negative-checked assertions — see CLAUDE.md and
docs/guide/WORKFLOW.md.
