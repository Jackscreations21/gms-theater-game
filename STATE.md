# STATE — 2026-08-11

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## THE ROUND IS DONE — his sound and his light plot (rulings BA–BE)

**All three PRs are in: #121, #122 and this one.** The show is now HIS: two
recorded tracks, an audience rig, and sixty-six of his own timestamped looks
across both acts. `main` rebuilds at **1,184,074 bytes**, 18/18 suites,
`real.js` fatal null. Cache-bust for the headset: **`?v=19`**.

**What only hardware can answer** is at the bottom of HANDOFF — and this round
added a new kind of unanswerable: *nothing about how any of this SOUNDS has been
tested either, and no suite in this repo can hear.* The lights sitting on the
music is the whole point of RULING BB and it has never been observed.

**The audio files are not in the repo and never will be** (RULING BA). To hear
it locally, `docs/AUDIO.md` has the two copy commands. **On Pages the Quest runs
silent** until the owner hosts the files and a manifest entry points at a URL —
one line, no code change.

### What the three PRs were

The owner delivered **four hand-written cue files**
(`C:\Users\patri\Documents\beetlejuice light cues\`: `pre show.txt`,
`act one.txt`, `act 2.txt`, `set cues.txt`) and asked for three PRs: the new
lights + the audio + the pre-show, then act one, then act two with the set
times checked. Spec:
`docs/superpowers/specs/2026-08-11-beetlejuice-sound-and-house-design.md`;
plan: `docs/superpowers/plans/2026-08-11-beetlejuice-sound-house-prs1-3.md`.
It was built as a **linear chain** — each link opened only after the one
before it merged, rebased onto fresh `main` and retested.

- **#121** — the audience rig (8 blinders round the arch, 6 movers
  over the seating; the patch is 25 → **39 channels on every stage**), the
  sound (**RULING BA**: two tracks read from `assets/audio/`, never committed,
  missing = silent), the **audio-locked transport** (**RULING BB**: while the
  show track plays it IS the cue clock, so nothing drifts), the **pattern
  engine** (**RULING BD**: wander/sweep/random/flash off the frame `dt`), and
  the top of the show as he wrote it.
- **#122** — **act one is his now.** 28 of his timestamps became
  cues, the ten set changes all stayed on their own seconds, and the invented
  looks from the measuring round ("the moon takes the upstage", "the mourners",
  "a hard green across the frames") are gone. His snaps have no fade times, his
  30-second fade at 30:00 is 30 seconds, and both his mid-act blackouts cover
  the set change that follows them. **The act break takes the house to HALF** —
  the second thing he changed; that assertion was reversed in place, not
  deleted. Measured fade durations from #90 survive only where he gave no time
  of his own.
- **#123** — **act two is his too**, and his set list is now DATA:
  38 more of his timestamps, the show track resuming at 1:11:32, the confetti
  moved to his own 2:14:52 (eight seconds ahead of the curtain, where the built
  plot had it on the same cue), and the audio fading out on the last line he
  wrote. **The one set-time change landed: the netherworld 1:39:00 → 1:39:19.**
  A test walks his whole set list end to end — every time, scene, dressing,
  backdrop side and wagon offset — so the next round diffs it in one command
  instead of by eye, which is how the 1:39:00 drift survived unnoticed in the
  first place. **RULING BE** widened the pattern engine off two of his own
  lines (a purple light crawling on the curtain, and the lights flashing green
  really fast): an effect names a group, and an unknown name moves nothing and
  says so on one console line.

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

1. **PUT IT ON THE HEADSET — with the sound in place.** `?v=19`, and copy the
   two files in first (`docs/AUDIO.md`) or the whole point of RULING BB cannot
   be judged. The full list is at the bottom of HANDOFF; the sharpest ones are
   whether a blinder flash at FULL hurts from a metre away, whether the
   audience movers read as slow and the 1:16 pattern as fast, and whether 14
   extra channels cost frames.
2. **Getting the sound onto Pages is the owner’s call.** The recordings cannot
   enter the repo (RULING BA). A manifest entry accepts an absolute URL — one
   line, no code change — so if he hosts them, say so and point it there.
3. **The owner’s models arrive** — one PR per `.glb`: file into `assets/` named
   per MODELING.md’s File column, manifest already fetches it, budgets
   auto-refuse, suites green, done. No code needed unless routing surprises.
4. `tests/smoke.js` still flakes under full-suite load (wall-clock dt
   sensitivity; passes alone every time). It flaked twice across this round and
   is NOT a regression of it. A task chip exists.
5. `pr6.json` in the repo root is still untracked and unruled (pre-dates all
   of this).

## Feel constants for the headset (one-line retunes)

In `p5h` (movement, from the AW–AZ round):

- `BJ_FLY_SPEED` 1.8 — fly-outs take ~5.8s; on the flown-set cues the outgoing
  set is still rising 2–3s after the next look is lit. Theatre, unless it reads
  slow.
- `BJ_HILL_SPEED` 2.0 / `BJ_HILL_OUT` 9.5 — the 9:45 run fits its 5s fade.
- `BJ_PART_OUT` 10.5 — fly-out clearance over the 9.2m header.

In `p5j` (this round):

- `AUD_WANDER_RATE` 1.0 — the pre-show drift. He asked for "slowly".
- `AUD_RANDOM_RATE` 1.0 — the 1:16 chaos. He asked for "fast".
- `AUD_STROBE_HZ` 9.0 — "really fast". **The one constant here with a reason
  not to raise it:** 15–20Hz is the photosensitive-seizure band, and this one
  points at the audience.
- The pre-show house at `0.45` and the blinder flash at `1.0` are both
  judgements about words he wrote ("low", "as bright as posible").

## Standing facts

Suite count is 18 (`npm test` in tests/). The patch is **39 channels** on every
stage since RULING BC. The show curtain, sign and marquee keep their pre-round
look by the owner's word — the sign's LAMPS go red on a cue, which is a cue
state and not a repaint. RULING AV (model on the production, Beetlejuice only)
still governs; AO stays repealed; RULING B still holds (the flown PA boxes are
rigging, and the show's sound comes out of the browser, not out of them). All
work via PRs, linear chains, negative-checked assertions — see CLAUDE.md and
docs/guide/WORKFLOW.md.

**Every timestamp in the Beetlejuice plot is a position in `show.m4a`**, not
elapsed show time; the two differ by the 35 seconds the track is already into
itself when the show starts. That is what `at` means, and RULING BB makes it
literal.
