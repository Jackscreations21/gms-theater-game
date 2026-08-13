# STATE — 2026-08-13 (late)

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## ELEVEN THINGS IN ONE MESSAGE — rulings CN–CY

He watched the parked-sets round and came back with eleven items. Nine of them
are one subject — **where every set comes from and where it stands when it is
off**, which is a traffic plan, and traffic plans have to be settled all at once
or the sets stand inside each other. The other two are the neon and the
blinders.

**ALL SEVEN PRs ARE MERGED — AND ONLY #155 REACHED `main`.**

| PR | What | His items | on `main`? |
|---|---|---|---|
| **#155** | the traffic plan (**CO CP CQ CR CS**) | 2, 3, 4, 5, 6 | **yes** |
| **#156** | a flown set is thin (**CT**) | 7 | merged into `bj-traffic-plan` |
| **#157** | one house in the world (**CN**) | 1 | merged into `bj-thin-flown` |
| **#158** | the marquee goes dark as it flies (**CU**) | 8 | merged into `bj-one-house` |
| **#159** | the two menus (**CV CW**) | 9 | merged into `bj-sign-lamps` |
| **#160** | the neon on the gold, the blinders out of it (**CX CY**) | 10, 11 | merged into `bj-menus` |
| **#161** | the record | — | merged into `bj-neon-gold` |

**A STACKED CHAIN MERGES INTO ITS BASE, NOT INTO `main`.** Each PR was opened
with the previous branch as its base — that is what keeps a stacked diff
readable — and pressing Merge on all seven collapsed them **up the stack** rather
than down onto `main`. `main` carries the traffic plan and nothing else;
`bj-eleven-record` carries all of it, and against `main` it is **18 files, 2,415
insertions**.

**ONE PR CLOSES IT: `bj-eleven-record` → `main`.** No conflicts — the merge base
is #155's own commit and nothing has moved on `main` since. Verified on the stack
tip: rebuilds **byte-identical**, suites **19/19**.

**The lesson, and it is a workflow one:** CLAUDE.md's "never stack PRs" exists
for exactly this. When his standing instruction is to keep going without waiting
for merges, the base of every PR after the first should still be **`main`**, with
the dependency named in the body — a wider diff to read, but a chain that lands
where it is pointed.

Cache-bust for the next headset run: **`?v=25`**. Suites **19/19** — the
nineteenth is `tests/probe-lint.js`, new this round.

Spec: `docs/superpowers/specs/2026-08-13-one-house-the-traffic-plan-and-the-gold-line-design.md`.
**Rulings are at CY.**

### THE TRAFFIC PLAN — CO, CP, CQ, CR, CS

Four slots, and every set has exactly one:

| slot | what stands there | measured |
|---|---|---|
| upstage, behind the backdrop | **the house wagon, and nothing else** | z −24.78..−11.80 |
| stage left | the attic | x 7.37..20.43 |
| stage right | the bedroom and the closet | x −16.11..−7.09 |
| the fly tower | the roof, the netherworld, the exterior | y 10.50..19.40 |

**RULING CO turns on a comment that stopped being true.** RULING BQ parked the
wagon in a wing and wrote down why it could not go upstage: *"12.98m does not fit
between the backdrop at −10.90 and the brick at −21.5."* True when written.
**RULING CL moved the brick to −25.5 for a completely unrelated reason** — his
house was standing 3.28m out in the street at the curtain call — and the gap went
**10.60m → 14.60m**. His room fits with 1.62m to spare, at the offset the wagon
already has, so CO changes *which mover parks the house* and not one number.

**RULING CS needed measuring rather than choosing.** The bedroom is 8.62m wide
and the closet 9.02m: **17.64m of room for a 14.5m wing.** They do not fit
abreast and no number makes them, so they stand one behind the other — both
track in on x, and the closet parks 6m further upstage on a second mover. Without
it they park inside each other by 8.6 × 5.6 × 4.2m.

**And `tools/parked.js` now reports what it has never reported: `none — every
parked set has its own space`.**

### RULING CT — a flown set is thin

His roof lands **10.00m deep** and his exterior **8.77m**, and neither hangs on a
batten. `BJ_THIN` **0.28** squashes the recession about the **downstage face**,
which does not move — the BV fix, pointed at two more sets. Roof → 2.80m,
exterior → 2.46m, the stand-in roof 5.00 → 1.50m with its walkable deck coming
with it.

**It is a non-uniform scale, which this file otherwise refuses** (RULING CB kept
the fit uniform to avoid distorting every door in the house). A thinned roof IS a
squashed roof: its slope steepens. That is what "really thin" asks for on a piece
that lives on a batten, and `BJ_THIN` is one line back to 1.0.

**What the thinning did NOT buy, tried before it was written down.** Thin sets
should hang on separate lines instead of inside each other. They cannot:

- **our exterior is not where his is** — ours is a cloth at z −7.35 (deliberately,
  so it plays against its own sky on line 13), his seats at the arch at −2.76.
  A park is an OFFSET, so no single number lines both up: every set of offsets
  that separated his three left the stand-ins inside each other, and the reverse;
- **the depth is not there** — thinned, the three are 12.41m of set against
  11.50m of tower downstage of the stored wagon.

So they go on sharing it, as RULING CE said. The honest gain is the SIZE: the
deepest set-inside-set went **8.77m → 2.46m**. **What would fix it is a park
stated as an absolute LINE measured off whichever geometry is standing there** —
and models land asynchronously, long after a park is declared, so that is an
engine change and not a number. Flagged, not smuggled in.

### RULING CN — one house in the world

RULING AQ already said this and the code did not do it: `bjRedress` darkened the
other two dressings and left them **in the world**, which was fair while a
dressing was our own furniture and became **280,540 triangles — three complete
houses of his in the same 13.6m of stage** once RULING BP landed.

A dressing that is not worn is **detached from the scene graph** and held on
`SHOW.offstage`. **Not a dispose**: re-fetching a 27MB file nine times an evening
is worse. Two sweeps had to learn about it and both would have failed silently —
`lockShowStatic` would have left a held house unfrozen, and `showStrike` would
have **leaked a house and a half of geometry per show change**.

### RULING CU — the marquee goes dark as it flies

A **gate**, not a repaint: what a cue asked for is remembered and the gate
multiplies it, so a `signCol` red survives underneath and comes back when the
sign does. Rides the sign's own mover offset and the frame `dt`. Measured 1.80 →
2.10 red → 1.75 a tenth of a second into the rise → 0.00 up → still red coming
down. A sign with **no** mover is left alone rather than switched off for ever.

### RULINGS CV, CW — the two menus

**CV: the desk has had a set menu all along and the headset has not.** A SETS
page on the VR console, calling sets on through `sceneChangeTo` so the change is
choreographed — and it says **where** each struck set is standing, because BQ
made that a real question. The tab strip moved from x 380 to 300: eight tabs at
112 would have drawn SCRIPT off a 1200-wide canvas.

**CW: the sign cannot be a lineset** (every lineset is upstage of the plaster
line; the sign hangs downstage of the curtain — AS, AT). So the rail carries
hauls the show declares, `SHOW.flyExtras`, drawn on the desk and in the headset.
Declared, never assumed.

### RULINGS CX, CY — the neon and the blinders

The gold band runs at **x ±7.75**, springing **8.6**, **z 1.26**, and its arch
**peaks at 10.375** — a quadratic sits at a quarter/half/quarter of its three
points, not at the control point, and reading the control point as the apex would
have put the neon a metre and a half too high.

**AND THE TOP IS RAKED ONE WAY, WHICH IS HIS CORRECTION.** *"can you make it
slanted just one way not from the center."* It was built as two chords meeting at
the centre and flagged as the open reading; it is now **one bar right across**,
low at the springing on one side and high at the peak on the other, so **the two
legs are different heights**. It rakes down toward **stage left**, the way the
marquee's own arrow rakes (`rotation.z −0.20` toward +x) — `BJ_NEON_RAKE` is one
sign to mirror it, and the blinders read the same line. **No sill.**

**A sign error in that line got through the blinders and their own assertion**,
because both carried it and agreed with each other. What caught it was the check
that measures the BUILT GEOMETRY against the line instead of re-computing the
line: *"the top stands 1.79m above its line at x=−7.92"*. Sibling of the test
that reimplemented the beam formula.

The blinders have **no body at all** — the point, the beam and the lens glow, and
nothing between them — sitting **on** the frame at z 1.45, the bar's own
downstage face.

## WHAT THIS ROUND FOUND THAT NOBODY ASKED ABOUT

- **Every parked set stood, visible, in its acting position the moment the show
  loaded.** RULING BQ made a struck set stay DRAWN and `sceneShow` — the instant
  swap, which is what `showLoad` uses — drove the movers of the set coming ON and
  **nothing at all** for the sets going off. Nothing caught it because the probe
  and every assertion drive a CHANGE first. Found by the sets menu, fixed in
  #159, and there is now an assertion on the state nobody had looked at.
- **The exterior parked with its foot 0.2m inside the picture.** The cue at
  1:14:30 flew it to `BJ_SIGN_OUT` 9.0 — the SIGN's number, borrowed by a set —
  against a 9.2m opening. Invisible until BQ made a parked set stand there drawn.
- **`bjApplyModel` chose its route by COUNTING part movers**, so a set with a
  park as well as a wrapper took the cemetery's route. It showed up as the roof
  measuring as an **empty box**. A count is not a kind.

## WHAT IS LEFT

### 1. THE HEADSET RUN — `?v=25`, and it is still the only thing left

**Nothing about how any of this looks has been observed.** New with this round:

- **Does the neon read on the gold?** It is 15.88m across now with a straight top
  **raked one way** — high stage right at 10.72, low stage left at 8.6 — and
  nothing across the deck. A completely different shape from what CH built
  yesterday, and the rake is his own correction.
- **Do bodiless blinders read as light coming out of the bar**, or as light
  coming out of nowhere?
- **Is a thinned roof a roof?** `BJ_THIN` 0.28 steepens its slope. One line.
- **Do the new entrances read** — the attic from stage left, the bedroom and
  closet from stage right, the house from behind the backdrop?
- **Is the SETS page useful in a headset**, and is "where it is standing" the
  right thing for it to say?

Carried: the houses at 13.6 × 12.76 with 3.56m behind the border; `BJ_FILL_MAX`
0.55 lit or glowing; the netherworld at 6.90m over black; `BLIND_POWER` 4.6; the
house at 0.15; 25 seconds of nothing at the top.

### 2. Still his to decide

- **Which way the neon rakes.** It leans down toward stage left, off the arrow on
  his own marquee. `BJ_NEON_RAKE` is one sign, and the blinders follow it.
- **The sign's red at GO**, moved to 1:00 with the proscenium's. One line.
- **The cemetery declares no park** (46.8m parted against a 44m stage).
- **His files are 181MB and ~70MB is discarded at load.**
- **The netherworld is the one flown set he did not name.** Narrower would buy
  it a wing; he has not asked.

### 3. Still owed from earlier rounds

- **RULING BY** — standing on his geometry costs 4.29ms, 38.6% of a 90Hz frame.
- **The graveyard.** He has supplied none and the show OPENS in it until 10:38.
- **Does the join at 4292 sound?**
- **The house floor pool** stays deferred.
- **A park stated as an absolute line** rather than an offset (see CT).
- **A blinder can no longer be carried** (CY). `BLIND_BODY` puts it back.
- `tests/smoke.js` still flakes under full-suite load. Not a regression.
- `pr6.json` in the repo root is still untracked and unruled.

## Feel constants for the headset (one-line retunes)

In `p4` (`buildRig`): `BLIND_POWER` 4.6 / `BLIND_RANK` 0.9, **`BLIND_X` 7.75 and
the slant line (CY — the blinders on the neon), `BLIND_BODY` false**,
`AUDM_POWER` 2.8 / `AUDM_RANK` 0.8, `AUD_LIGHT_RESERVE` 2. **Rank is RULING BC
and load-bearing.**

In `p5j`: `AUD_WANDER_RATE` 1.0, `AUD_RANDOM_RATE` 1.0, `AUD_STROBE_HZ` 9.0,
`AUD_SWEEP_LO` −15 / `AUD_SWEEP_HI` −98.

In `p5h` (the neon, CH amended by CX): `BJ_NEON_BAR` 0.34, **`BJ_NEON_Z` 0.81**
(+ `BJ.pz` = 1.26, the gold's own z), **`BJ_NEON_RAKE` −1 (which way the top
leans; `BLIND_RAKE` in p4 mirrors it)**, `BJ_NEON_FADE` 1.2, `BJ_NEON_BLUE`
0x4fa8ff, `BJ_NEON_RED` 0xff1e10, `BJ_NEON_DARK` 0x0d1116.

In `p5h` (the sign, CF and CU): `BJ_SIGN_GLOW` 0.95, `BJ_SIGN_LIT` 2.1,
**`BJ_SIGN_LAMP_FADE` 2.5, `BJ_SIGN_LAMP_CUT` 0.05**.

In `p5h` (AW–AZ, CE): `BJ_FLY_SPEED` 1.8, `BJ_HILL_SPEED` 2.0 / `BJ_HILL_OUT`
9.5, `BJ_PART_OUT` 10.5, `BJ_TRACK_SPEED` 2.0.

In `p5h` (the traffic plan, CO–CT): **`BJ_ATTIC_SIDE` 13.9, `BJ_SIDE_ROOM` −11.6,
`BJ_CLOSET_BACK` −6.0, `BJ_THIN` 0.28**, `BJ_WAGON_BACK` −10.0. All sized by the
STAND-IN as well as by his model.

In `p5h` (the netherworld, BV amended): `BJ_AFT_DEEP` 0.55, `BJ_AFT_TUBE` 0.15,
`BJ_AFT_BACK` 0x000000.

In `p2` (CL): `PAL_DEEP` 8.5.

In `p5c`: `SCENE_PARK_SPEED` 2.0.

In `p5i` (BP, BX, CB, CC, CD, CT): `BJ_TRI_BUDGET` 150000, `BJ_MAT_BUDGET` 8,
`BJ_TEX_BUDGET` 2048, `BJ_FIT_AIR` 0.30, `BJ_SET_DEPTH` 10.0,
`BJ_HOUSE_UPSTAGE` 1.5, `BJ_FILL_MAX` 0.55, `BJ_FILL_RATE` 1.6, and each
manifest entry's `fit` and `thin`.

## Standing facts

Suite count is **19** (`npm test` in tests/) — `probe-lint.js` runs first and is
a test of the TESTS, not of the game. The patch is 39 channels on every stage.
RULING AV still governs; AO stays repealed; RULING B still holds. RULING BB is
untouched.

**Every timestamp in the Beetlejuice plot is a position in his WHOLE recording.**

**His photographs are never committed.**

## What this round taught, beyond the features

- **A comment that says something is IMPOSSIBLE is a fact with a date on it.**
  BQ's "12.98m does not fit" was true, and CL made it false for an unrelated
  reason, and nothing connected the two because the impossibility was prose
  rather than an assertion.
- **A BoxGeometry has vertices only at its CORNERS**, so per-vertex sampling of a
  merged frame measures nothing between them. It bit twice in one PR, once
  throwing against a correct build and once **passing against a broken one**.
- **A count is not a kind.** Routing by "how many part movers" broke the moment a
  set had a park as well as a wrapper.
- **A test that picks its subject for convenience agrees with itself.** "The set
  call is choreographed" picked the exterior, which carries no part movers at
  all, so a mutant that replaced the choreographed change with an instant swap
  had nothing to travel and sailed through.
- **And so does a test that shares a formula with the thing it tests.** The
  neon's rake line had its sign inverted, and the BLINDERS and their assertion
  both carried the same wrong line — so they agreed perfectly and passed. Only
  the check that measures the BUILT GEOMETRY against the line, rather than
  re-computing it, disagreed.
- **The probe template ate an escaped quote for the fourth time**, and a backtick
  in a comment for the fifth. `tests/probe-lint.js` is the mechanical sweep TRAPS
  has been asking for.
- **A probe reading a game `const` that was never in its handout** gets
  `undefined` and prints a confident wrong answer — `|| []` is what turns a
  missing handout into a silent lie.

## Shelved

**Nothing.**
