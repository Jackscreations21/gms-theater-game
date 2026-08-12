# STATE — 2026-08-12

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## THE SECOND HEADSET VERDICT, AND HIS MODELS — rulings BJ–BP

The owner ran the BF–BI round in the headset and came back with four asks in one
line: he still could not see the purple sweeps from the balcony; the beams at
the pre-show and the top of the show were too faint; cues should be labelled by
their timestamp in the show rather than their fade; and skipping a cue should
skip the music with it. Mid-round he delivered **all seven of his set models**,
twice — a first export, then a re-export at 100k.

**ALL MERGED: #129, #130, #131, #132, #133, #134.** `main` rebuilds
byte-identically at **1,213,284 bytes**, 94 cues, 18/18 suites. Cache-bust for
the next headset run: **`?v=21`**.

### The finding that shaped the round

`tools/audience-balcony.js` is new and kept. It measures the light arriving at a
head on all three levels and **splits it by which kind of audience unit emitted
it** — that second part is what turned the round, because a brightness number
that does not say what colour it is answers the wrong question.

At 1:03 the balcony was getting **7.1** of light and **every bit of it was red**:

| | holds a real light? |
|---|---|
| the 8 blinders, red, at 1:03 | **8 of 8** (4 of 4 in a headset) |
| the 6 movers, purple, at 1:03 | **0** |

RULING BG's reserve is a ceiling on the audience rig **as a whole**, and the
blinders are audience units at rank 0.9 against the movers' 0.8. So the two
reserved slots went to blinders, the other six went to blinders, and the purple
sweep he asked about rendered on nothing at all.

### What the five PRs were

- **#129 — the purple sweep is seen (BJ, BK, BL).** **BJ**: the arch drops out
  for both sweeps and both blackouts after them — his ruling, and his own labels
  already said "the house goes dark" while their looks held eight red lamps on
  it. **BK**: a sweep sweeps *up*; it read −84 → −10, which because a head sits
  at tilt+90 is 6° below horizontal down to 80° below — the number went up and
  the light went down. It also snaps to its start when armed, because tilt slews
  on a ~0.3s time constant and the first third of a two-second sweep was being
  eaten by the lag. **BL**: the reserve divides the audience rig a group at a
  time; BG's invariant (at most `AUD_LIGHT_RESERVE`, ceiling never floor,
  nothing claimed when dark) is untouched. Measured after — purple only, at a
  balcony head: **0.000 / 0% → 5.93 peak / 37% flat, 3.97 in a headset**; the
  pre-show drift at the back of the balcony **7% of a cycle → 57%**, stalls held
  at 80%.
- **#130 — the beams read at the top (BM).** The pre-show carried **haze 0.15**,
  the lowest of all 94 cues, in the one stretch that is nothing *but* beams
  because the curtain is in. A beam draws at `0.25 + hazeNow()*1.15`, so it was
  **45% of a mid-show beam**; now 0.50 at the pre-show and 0.60–0.65 through to
  the graveyard, and the faintest top-of-show beam is **108%** of mid-show. The
  house went 0.45 → 0.30 for the same reason, measured: at 0.45 the house lights
  put ~2.0–2.4 on a seat against the audience rig's ~1.0 peak. **Both numbers
  are ours** — his four text files say nothing about haze anywhere. *(0.30 is
  already superseded — see BT below.)*
- **#131 — cues labelled by their place in the show (BN).** Both lists printed
  the fade: `refreshCues` in p6 and `vrPageCues` in p9. They print `cueTimeText`
  now — 0:33, 1:03, 9:45, 1:11:02, 2:14:52, the way he writes them. **A cue with
  no `at` keeps the fade**, which is every cue in four of five productions and
  everything recorded off the board.
- **#132 — a cue you jump to takes the music with it (BO).** Firing by hand
  seeks the show track to that cue's timestamp; which half of the recording it
  lands in is `audPlay`'s problem, so jumping to Q33 at 5105s asks act two for
  813.0s into its own file. **Not in `fireCue`** — the transport calls that, and
  a seek there would feed it its own output. A cue carrying its own `audio` has
  already spoken, and a show running silent is never started by a jump (because
  `go()` is also what the follow chain calls).
- **#133 + #134 — his models load (BP).** Budget **30,000 → 150,000 triangles**,
  his ruling: the old number predated any model and was conservative for what
  these turned out to be — one material, one primitive, **one draw call** each.
  An oversized **texture is shrunk to 2048, not refused**, because a 4096 map is
  what the tool emits and not a number he chose. The house is **three whole
  houses, not a shell plus three dressings**; the first to land takes the
  built-in shell out. Manifest 10 entries → 9. **#134** adds **fit and seat**:
  every file arrived normalised to a ~1.9-unit box centred on the origin, so
  straight in each set would have stood a seventh of its size with half of it
  under the deck. It now scales to the width MODELING.md declares for that set,
  puts the lowest point on the deck and centres the footprint — so a re-export
  at any scale lands identically, and a model genuinely in metres fits at 1.00
  and is left alone.

## WHAT IS LEFT — his newest instructions, rulings BQ–BW

These came in during the round and **none of them are built.** Spec:
`docs/superpowers/specs/2026-08-11-the-balcony-the-beams-and-the-cue-clock-design.md`
— BP and BQ in §8–§9, BR–BW in §10.

### 1. His seven `.glb` files into `assets/` — nothing committed yet

The plumbing is in (#133/#134); the files are not. They sit in
`C:\Users\patri\Documents\beetlejuice sets`. The three houses are told apart by
**texture palette, not filename** — all three came out of the tool named
`deetz_house` — so **if Maitland and Deetz are swapped it is a rename, not a
rebuild**:

| his file | goes to | note |
|---|---|---|
| `attic/…attic_0812020523` | `assets/bj-attic.glb` | straight swap |
| `roof/…roof_0812020713` | `assets/bj-roof.glb` | straight swap |
| `house/…0812020736` (warm brown, cream, sage) | `assets/bj-house-maitland.glb` | |
| `house/…0812020721` (cool grey, slate, teal) | `assets/bj-house-deetz.glb` | |
| `house/…0812020729` (saturated purple) | `assets/bj-house-beetlejuice.glb` | |
| `house extirior/…0812020837` | `assets/bj-house-exterior.glb` | **needs a new manifest slot** |
| `beetlejuice sign/…0812020344` | `assets/bj-sign.glb` | **needs a slot AND our lamps** |

Two are not straight swaps:

- **The exterior** has no slot, because MODELING.md said the exterior was not
  his to model. `tests/beetlejuice.js` carries an assertion that **no entry may
  target the `house` scene**. That gets **reversed in place**, saying what it
  used to guard and why that changed — the AO/AV/BA precedent, fourth time.
- **The sign** is his geometry with *our* lamps on it — his note is "you just
  have to add the lights". `SHOW.signLamps` / `setSignLamps` drive them, so the
  swap has to re-attach lamp objects to a model whose node names we do not
  control. Its own PR.

He supplied **no graveyard**, and the netherworld is now ours to build (item 4).
Bedroom and closet keep their stand-ins — his note: "just use what you are
currently using for it".

### 2. RULING BR/BS/BT — the neon proscenium, and the house that goes with it

**START FROM THE SHELVED BRANCH.** `bj-portal` (RULING AX, commit a22bd36)
already built almost exactly this engine and was never reviewed or opened:
`bj:portalFrame` as concentric tube runs hugging the opening, ONE merged mesh on
ONE material, **built dark**, `SHOW.bjPortal`, a `portal:{col,lvl}` cue field
applied on **every** cue so a cue that says nothing leaves the frame dark, and a
fade on the frame `dt` at 1.2/s riding `updateStorm`. Registered in
`showBlank()` so the stage swap parks it. **The engine is right; only the plot
changes.** Expect conflicts rebasing — the split rule in `showCueExtras`, the
p5h repaints, and now BJ's edits to cues 1.1–1.4.

New beyond AX: his photographs read as **broad flat bands with bright edges**,
not thin tubes, so the frame wants widening.

- **BR** — the frame rebuilt to his photographs. RULING AV already permits
  modelling Beetlejuice on the production and the locking rail came off a
  photograph, so this is well precedented. **The images are never committed** —
  TRAPS draws the line at looking versus committing.
- **BS** — the tube is lit at exactly three times and dark otherwise:
  **pre-show blue**, **blue from GO until 1:00**, **red at 1:00**,
  **netherworld blue**. Default-dark is already how AX's field behaves.
- **BT** — the house starts at **0.12** in the pre-show, **stays up through GO**,
  and goes out the moment the tube turns red. This **supersedes the 0.30 that
  #130 set** and rewrites the GO cue, which currently takes the house to 0.

**ONE UNRESOLVED NUMBER, and it is one line.** *"1 minute into the audio (not
acounting for the 32 seconds or whaterver it was)"* was read as **`at:60`** —
the 1:00 mark of the recording, i.e. do not add the 35s pre-roll. The
alternative (35+60=95, his **1:35**) would put the red *after* the 1:16 white
blinder flash and the 1:28 stage-blue, which does not hang together. **He has
not confirmed it.**

### 3. RULING BU — the blinders go inside the proscenium

They sit on the downstage face at z=1.35, above and outboard of the arch (RULING
BC's positions). This became **affordable only because of BS**: with the neon
carrying the red, no cue needs the blinders visible through a closed house
curtain. **Check the curtain's z before moving them** — the 1:16 white flash
must still read from a seat.

### 4. RULING BV — the netherworld, skewed to his photographs

Today `aft` (p5h ~line 1316) is five nested **axis-aligned** rectangles in
green/cyan/magenta. His picture is nested **tilted trapezoids** receding
upstage, all blue with bright edges, over a dark blue backing — and *"just use
this as a backdrop for the netherworld"* makes the picture the look, not a new
set. Two constraints there are load-bearing and must survive: **not `neonTube`**
(its CatmullRom overshoots a right angle — a 12.6m frame came out 14.5m wide and
0.53m through the deck), and **a material per tube is required**, because
`updateNeon` writes a colour into every registered mesh every frame.

### 5. RULING BW — TOP fires the first cue

`vrPageCues`'s TOP button does `nextCue = 0` and stops, so the operator has to
press GO as well. It should fire. Composes with BO for free: cue 0 carries its
own `audio`, so firing it starts the pre-show music and the jump-seek declines.

### 6. RULING BQ — a set that comes off is never gone

Spec §9, **not started**. Today `sceneApply(sc,false)` makes a struck set cease
to exist — invisible, `layers.disableAll()`, walkables pulled — and that is what
makes seven configurations affordable. Replacing it needs a park position **per
scene per stage, expressed relative to the stage** (a hardcoded z is the trap
TRAPS records under *move a building and its furniture stays*), and the cost
must be **measured, not assumed**, because it is a headset risk. Parked sets
stay off `WALKABLE` — a set that flies in with the player standing on it ends
badly.

**This is the biggest item here**, two to three times the models PR. It splits
into "park them and prove they are really there" then "measure and optimise".

### 7. Still owed from earlier rounds

- **The headset run of all of this**, `?v=21`. Nothing about how any of it
  sounds or looks has been observed; no suite here can hear or render.
- **Is `BLIND_POWER` 4.6 too much?** Still unanswered, still the one change that
  could genuinely hurt. `AUD_STROBE_HZ` stays at 9 deliberately.
- **Does the join at 4292 sound?** Act two resumes out of a different file.
- **The house floor pool** stays deferred — with the sweep now travelling up the
  house and the movers guaranteed a share, the reason to build it may not
  survive the next headset run. First thing to build if he says the purple still
  reads thin. Spec §2.
- `tests/smoke.js` still flakes under full-suite load (wall-clock dt; passes
  alone every time). Not a regression of any round.
- `pr6.json` in the repo root is still untracked and unruled.

## What this round taught, beyond the features

- **A probe can measure the wrong thing just as confidently as no probe at
  all.** Sampling a SLOW effect at one instant read "the balcony gets exactly
  zero", and that went into a spec before a full-cycle run showed 7–20%. For a
  periodic effect, measure **peak and share of a cycle**, never one frame.
- **A test that reimplements the thing it is testing agrees with itself whatever
  the code does** — and its sibling, **proving a function while never proving
  its wiring**, which happened **three times in this one round**: the BM
  assertion recomputed the beam formula instead of reading the uniform; the
  texture shrink was tested directly and not through the fetch round; and fit
  and seat was tested directly and not through `bjApplyModel`. All three
  negative checks came back green and all three were holes.
- **The negative-check harness must rebuild after restoring `src/`**, or every
  later run measures the last mutant. It presented as `uHaze` frozen at 0.42
  while `hazeNow()` returned 0.7 — which reads exactly like a bug in the rig.
  The mutation harness is now a **node literal-replacer**, because perl
  delimiters kept colliding with the code being mutated and a mutation that does
  not land is indistinguishable from a weak assertion.
- **And one already written down that bit anyway:** a commit pushed to a branch
  whose PR is already merged is **stranded** and nothing says so. It happened to
  the fit-and-seat commit on `bj-models` after #133 merged; #134 is the
  recovery. `git merge-base --is-ancestor <sha> origin/main` after every
  follow-up push.

## Feel constants for the headset (one-line retunes)

In `p4` (`buildRig`): `BLIND_POWER` 4.6 / `BLIND_RANK` 0.9, `AUDM_POWER` 2.8 /
`AUDM_RANK` 0.8, `AUD_LIGHT_RESERVE` 2. **Rank is RULING BC and still
load-bearing.**

In `p5j`: `AUD_WANDER_RATE` 1.0, `AUD_RANDOM_RATE` 1.0, `AUD_STROBE_HZ` 9.0
(item 7), and new this round **`AUD_SWEEP_LO` −15 / `AUD_SWEEP_HI` −98** — the
ends of a sweep's travel. The *sign* of that travel is not a tune; "sweep up" is
his word for it.

In `p5h` (AW–AZ): `BJ_FLY_SPEED` 1.8, `BJ_HILL_SPEED` 2.0 / `BJ_HILL_OUT` 9.5,
`BJ_PART_OUT` 10.5.

In `p5i` (BP): `BJ_TRI_BUDGET` 150000, `BJ_MAT_BUDGET` 8, `BJ_TEX_BUDGET` 2048
(a shrink target now, not a refusal), and each manifest entry's `fit` width.

## Standing facts

Suite count is 18 (`npm test` in tests/). The patch is **39 channels** on every
stage. RULING AV (model on the production, Beetlejuice only) still governs; AO
stays repealed; RULING B still holds. RULING BB is untouched: while a **clock
track** is really playing it IS the cue clock.

**Every timestamp in the Beetlejuice plot is a position in his WHOLE recording**
— not elapsed show time, and not a position in whichever half is playing. The
two differ by the 35 seconds the track is already into itself when the show
starts. `offset` is what keeps that true across two files, and it is what makes
the unresolved number in §2 a real question rather than a typo.

## Shelved — but now WANTED

**The portal rebuild (RULING AX) on the LOCAL branch `bj-portal`** (commit
a22bd36, built on the old #116 base) is no longer shelved: his newest
instruction is precisely that feature. It passed implementation, had **no review
passes**, and was never opened. See §2 above.
