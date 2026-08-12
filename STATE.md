# STATE — 2026-08-13

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## THIRTEEN THINGS IN ONE MESSAGE — rulings CF–CM

He watched it and came back with thirteen items. Two are features, one is a
fault report against RULING CA, one is a piece of building, and the other nine
are corrections to his own plot. He also gave the reading order himself, and it
is load-bearing:

> (all of these are in order od there appearance)

**ALL FIVE MERGED: #149, #150, #151, #152, #153.** `main` is at `ce79daf`.
Nothing is open. Verified after the merge: `main` rebuilds **byte-identical**
and the full suite is green on the merged result.

| PR | What | His items |
|---|---|---|
| **#149** | the sign's lights come off the box and onto the sign (**CF**) | 1 |
| **#150** | the Palace goes deeper again (**CL**) | 10 |
| **#151** | a START OF SHOW call on the fly rail (**CM**) | 12 |
| **#152** | the neon proscenium, and nothing happens at GO (**CH**, **CG**) | 13, 2 |
| **#153** | his nine retimings, and two gates (**CK**, **CI**, **CJ**) | 3–9, 11 |

Cache-bust for the next headset run: **`?v=24`**. Suites 18/18.

Spec: `docs/superpowers/specs/2026-08-13-the-neon-proscenium-and-his-corrections-design.md`.
**Rulings are at CM.**

### RULING CF — the sign's lights are HIS OWN sign, lit

*"The lights for the beetlejuice sign arent on the sign they are just a box
around it."* **He was describing what the code did, exactly.** With his file in:

```
  Mesh10        98,984 tris   x [-4.65.. 3.85]  y [3.99..8.01]  z [0.05..0.15]
  bj:signBulbs   3,472 tris   x [-4.63.. 3.82]  y [4.01..7.99]  z [0.19..0.38]
  bj:signNeon       48 tris   x [-4.30.. 3.51]  y [4.33..7.67]  z [0.25..0.32]
```

RULING CA read *"you just have to add the lights"* as new geometry and hung a
bead ring and a tube outline round his model's **bounding box**.

**And the sign was dark underneath them**, which is the half nothing was looking
at: `bjApplyModel` registered it for the RULING CC set fill, which drives
`emissiveIntensity` off the **stage rig's** output — and the plot's first cue is
*"PRE-SHOW … the sign lit"* with the rig at zero. His marquee sat at 0.000 for
the whole pre-show while our ring burned at 1.8.

His own materials are the lamps now, self-lit at `BJ_SIGN_GLOW` 0.95 off his
painted detail. CA's silent-failure guard is kept: a file with no usable material
leaves the stand-in registry alone.

### RULING CG — nothing is red at GO, and the house is at 15 five times

**THE ONE NUMBER THREE HANDOFFS CARRIED AS UNRESOLVED IS SETTLED.** *"1 minute
into the audio (not acounting for the 32 seconds or whaterver it was)"* was read
as `at:60` and never confirmed; *"time stamp 1:00 in the audio"* is the same
number said plainly. **It is his now, not our reading.**

| | before | after |
|---|---|---|
| pre-show | house 0.30 | **0.15**, frame blue (supersedes BM and BT) |
| GO 0:35 | house 0, eight red blinders | **0.15**, nothing red — the music only |
| **1:00 — new** | — | house out, the **frame** goes red, the sign goes red |
| interval | house 0.5 | **0.15**, frame blue |
| act two's GO | house 0.5 | **0.15** |
| the end | house 0.5 | **0.15**, frame blue |

**An assertion found the fifth one** — act two's GO, the tail of the interval
with the audience coming back in. "The intermission" covers the whole of it.

**THE SIGN'S RED MOVED WITH THE PROSCENIUM'S, and that is a judgement call.**
His original act-one line was ONE sentence about both. Leaving the sign red at GO
would put the only red thing in the house on a stage he has just said should not
be red yet. **One line back if he meant otherwise.**

### RULING CH — the proscenium neon

*"remove the current neon stuff and replace it with a thicker bar going all the
way around … For the rest it is off. And move the blinders to inside of the neon
thing."*

`bj:portalTrim` (a blue-green tube frame with wing returns and hoops, **always
lit**) is gone. `bj:portalFrame` is one closed rectangle of **0.34m bar**,
13.60m across, four boxes merged to one mesh on one material, **built dark**, and
driven by a `portal:{col,lvl}` cue field applied on **every** cue. Measured:
**8 cues light it, 87 leave it out, red only at 1:00.** The engine is the shelved
`bj-portal` branch (`a22bd36`) rebased — after three handoffs of "start from
there", it was right and only the geometry and the plot changed.

The blinders moved from x ±8.12 / y up to 10.95 (round the architectural arch) to
**x ±6.2, top row y 8.5**, still at z 1.35 and so 0.60m downstage of the frame.
**It moves them in all five productions** — the honest consequence of a rig
change, and two named constants (`BLIND_X`, `BLIND_TOP_Y`) to undo.

### RULING CI — a move waits for the fly line it needs

*"make it so the house cant start sliding till the backdrop is fully up."*
`move:{scene:'interior', off:0, after:14}`. A gate on the **move**, not a delay
on the cue. Declared, never assumed — the other eight moves in this plot and all
four other productions are untouched. Measured: the wagon holds **716 frames**
while the cloth flies and sets off on 717.

### RULING CJ — the house lights wait for the curtain

He says it twice. `houseAfterCurtain:true` holds the master at 0 until the front
traveler is home **and** its halves are together. This show's curtain flies, so
the halves clause is never exercised by the delivery — **it has its own fixture**
(pipe home, halves held wide) after a negative check found the guard unobservable.

### RULING CK — his nine retimings, and a set change never moves a light cue

Six of the nine carry *"(dont change any light cues just the set change)"* in his
own parentheses. That is a rule: where a cue does both, retiming **splits** it.

| his ask | before | after |
|---|---|---|
| maitlands house 2s earlier | 10:40 | **10:38** (whole cue — CI is the rest of that sentence) |
| the roof 5s earlier | 56:00 | **55:55** set / 56:00 light |
| act-one blackout instant | fade 4 | **fade 0** |
| bj house → attic 25s earlier | 1:25:25 | **1:25:00** set / 1:25:25 light |
| attic → bj house 55s later | 1:30:00 | **1:30:55** |
| the house slides back on 15s later | 1:53:00 | **1:53:15** |
| that blackout 10s earlier | 1:53:32 | **1:53:22** |

**Item 7 lands on his own blackout and that is the point** — 1:30:00 + 55 is
1:30:55, his *"Lights blackout"*, so the house comes on and the stage goes black
over it. **Item 8 is the one his ordering line resolves** ("slide back **on**" is
1:53:00, not 1:39:19; and against 1:39:19 the following blackout is 3s later, so
moving it 10s earlier would put it before the change it covers).

### RULING CL — the Palace goes deeper again

`PAL_DEEP` **4.5 → 8.5**, `PAL_BACK` −21.5 → **−25.5**. His interior slid back
measured **z −24.78 .. −11.80** against a brick at −21.50: **3.28m out in the
street**, in the cue that plays in full view at the curtain call. The stand-in
(7.68m deep) cleared by 2.26m, which is why nothing saw it — **his model is the
binding case here**, the inverse of the RULING BQ trap. `D.backWall` stays at
−17. New probe: `tools/deeper.js`.

### RULING CM — the fly rail has a START OF SHOW call

The loaded show's **own first cue** — `CUES[0]` already carries a full fly
snapshot — applied through `flyTo`. A rail call, not a cue: it fires nothing.
On the desk **and** the VR fly page, at the foot of the column so the
pixel-pinned FOH/speaker rows do not move.

## WHAT IS LEFT

### 1. THE HEADSET RUN — `?v=24`, and it is now the ONLY thing left

**Nothing about how any of this looks has been observed** — not the sets from two
rounds ago, not the parks, not the netherworld, and now not the neon frame.

New with this round:
- **Does the neon bar read at 0.34m?** `BJ_NEON_BAR` is a guess against "thicker";
  `BJ_NEON_BLUE` 0x4fa8ff and the 1.2/s fade are guesses too.
- **Are the blinders right inside the portal?** They are 2m further inboard in
  every production now, and the 1:16 white flash still has to read on the cloth.
- **Does 25 seconds of nothing at the top play?** GO now starts the music and
  changes no light until 1:00. On paper it is a held pre-show; in the room it may
  read as a dead patch.
- **Is the house at 15 low enough to see the beams, and high enough to be a
  house?** 0.45 → 0.30 → (0.12, never built) → 0.15, and this one is his.

Carried from before: do the houses read at 13.6 × 12.76 with 3.56m behind the
border; do the tracked entrances read; is `BJ_FILL_MAX` 0.55 lit or glowing; is
the netherworld right at 6.90m over black; is `BLIND_POWER` 4.6 too much.

### 2. Still his to decide

- **The sign's red at GO** — moved to 1:00 with the proscenium's on a judgement
  call. One line back.
- **The cue at 1:14:30 still flies the exterior out.** His own plot line.
- **The cemetery declares no park** (46.8m parted against a 44m stage).
- **His files are 181MB and ~70MB is discarded at load** — re-encoding to 2048
  JPEG would rewrite HIS asset.
- **The netherworld is the one flown set he did not name.** Narrower is what
  would buy it a wing.

### 3. Still owed from earlier rounds

- **RULING BY** — standing on his geometry costs **4.29ms, 38.6% of a 90Hz
  frame** (`tools/walkcost.js`). Deferred, three ways out, none free.
- **The graveyard.** He has supplied none and the show OPENS in it until 10:40.
- **Is `BLIND_POWER` 4.6 too much?** Still the one change that could hurt.
- **Does the join at 4292 sound?**
- **The house floor pool** stays deferred.
- `tests/smoke.js` still flakes under full-suite load. Not a regression.
- `pr6.json` in the repo root is still untracked and unruled.

## Feel constants for the headset (one-line retunes)

In `p4` (`buildRig`): `BLIND_POWER` 4.6 / `BLIND_RANK` 0.9, **`BLIND_X` 6.2 /
`BLIND_TOP_Y` 8.5 (CH — where the blinders sit inside the portal)**,
`AUDM_POWER` 2.8 / `AUDM_RANK` 0.8, `AUD_LIGHT_RESERVE` 2. **Rank is RULING BC
and load-bearing.**

In `p5j`: `AUD_WANDER_RATE` 1.0, `AUD_RANDOM_RATE` 1.0, `AUD_STROBE_HZ` 9.0,
`AUD_SWEEP_LO` −15 / `AUD_SWEEP_HI` −98.

In `p5h` (the neon, CH): **`BJ_NEON_BAR` 0.34, `BJ_NEON_FADE` 1.2,
`BJ_NEON_BLUE` 0x4fa8ff, `BJ_NEON_RED` 0xff1e10, `BJ_NEON_Z` 0.30,
`BJ_NEON_DARK` 0x0d1116**.

In `p5h` (the sign, CF): **`BJ_SIGN_GLOW` 0.95, `BJ_SIGN_LIT` 2.1**.

In `p5h` (AW–AZ, CE): `BJ_FLY_SPEED` 1.8, `BJ_HILL_SPEED` 2.0 / `BJ_HILL_OUT`
9.5, `BJ_PART_OUT` 10.5, `BJ_TRACK_SPEED` 2.0.

In `p5h` (BQ/CE — where a struck set stands): `BJ_HOUSE_PARK_X` 14.0,
`BJ_EXT_SIDE` −13.5, `BJ_ATTIC_BACK` −8.8. All three sized by the STAND-IN.

In `p5h` (the netherworld, BV amended): `BJ_AFT_DEEP` 0.55, `BJ_AFT_TUBE` 0.15,
`BJ_AFT_BACK` 0x000000.

In `p2` (CL): **`PAL_DEEP` 8.5** — how much deeper the Palace runs than the box.

In `p5c`: `SCENE_PARK_SPEED` 2.0.

In `p5i` (BP, BX, CB, CC, CD): `BJ_TRI_BUDGET` 150000, `BJ_MAT_BUDGET` 8,
`BJ_TEX_BUDGET` 2048, `BJ_FIT_AIR` 0.30, `BJ_SET_DEPTH` 10.0,
`BJ_HOUSE_UPSTAGE` 1.5, `BJ_FILL_MAX` 0.55, `BJ_FILL_RATE` 1.6.

## Standing facts

Suite count is 18 (`npm test` in tests/). The patch is **39 channels** on every
stage. RULING AV (model on the production, Beetlejuice only) still governs; AO
stays repealed; RULING B still holds. RULING BB is untouched: while a **clock
track** is really playing it IS the cue clock.

**Every timestamp in the Beetlejuice plot is a position in his WHOLE recording**
— not elapsed show time, and not a position in whichever half is playing.

**His photographs are never committed.**

## What this round taught, beyond the features

- **A backtick in a probe COMMENT bit three times in one round.** It is already
  in TRAPS twice; the finding is the frequency. Sweep for it mechanically.
- **`null >= 0` is TRUE in JavaScript.** Loosening a strictly-positive test to
  non-negative silently reclassified two deliberate `follow:null` holds as cues
  that arm the next one — and the code was right.
- **A negative check against a state the assertion already satisfies proves
  nothing.** "It fires nothing" written straight after `showLoad` passed against
  a build where the fly rail started the show, because the board was already at
  cue 0 and firing it moved nothing.
- **A test that picks its subject by the property it then asserts agrees with
  itself.** Take the subject by POSITION.
- **The furniture trap, one level up: it is the TESTS that go stale.** The shed
  and everything in it rode `PAL_DEEP` correctly; four suites still probing
  literal −25 and −35 did not.
- **A wall fitted to the STAND-IN leaves HIS model in the street** — the exact
  inverse of the RULING BQ trap, hidden because the assertion that guards it
  lives in the probe that fetches nothing.
- **A probe reading the wrong field prints an empty section.** `sc.park` does not
  exist and `sc.pmv.park` misses exactly the sets RULING CE gave a single mover.

## Shelved

**Nothing.** The portal rebuild (RULING AX) has landed inside #152 and the
`bj-portal` branch is spent.
