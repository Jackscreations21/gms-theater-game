# STATE — 2026-08-12 (late)

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## THE SETS STAND BACKSTAGE NOW — rulings BW, BQ, CE

Three asks in one evening, each revising the last. He named the order himself:

> do the sturck sets still stay backstage first. then add the neon prosinium like
> the piture that chages colors at the right time. then fix the lighting cues at
> the start(the red lights coming on to soon and the house lights bieng to bright
> and going out too soon)

> dont do the lights once you finnish the sets and prosinium just wait

> first make it so when you press top of show it automaticall sets it to cue one

**MERGED: #146, #147.** `main` is at `2199623`. Nothing is open.

Cache-bust for the next headset run: **`?v=23`**. Suites 18/18.

Spec: `docs/superpowers/specs/2026-08-12-the-top-parked-sets-and-the-neon-proscenium-design.md`.
**Rulings are at CE.**

### RULING BW — TOP fires the first cue, and lets go of the transport

His symptom: *"when i try to press go to go to top os show it starts the show."*
Both TOP buttons moved the pointer and nothing else, so the look on stage stayed
whatever was up and GO was the only way forward.

**The spec predicted this composed with RULING BO for free and it did not.** The
seek does decline — and the seek is not what bites, the **transport** is. The
pre-show cue does not stop act one (only the GO cue does), so a hand-fired cue 0
leaves a `clock:true` track live and on the **next frame** `showAudioTick` fires
the GO cue off a playhead already past 0:35. Measured: TOP then GO put the board
back at **Q1.1 with the house at 0 in two frames.** So `cueTop()` stops the sound
FIRST and fires second — that order, or the stop kills the pre-show music the cue
itself asks for.

### RULING BQ — a set that comes off is never gone

A scene may **declare a park** and stands there struck, solid and visible.
Declared, never assumed: a scene with no park is switched off exactly as before,
which is what leaves the other four productions untouched.

**A parked set is drawn but NOT PICKED, and that is measured.**
`layers.disableAll()` was doing two jobs — not drawn *and* not raycast — and BQ
only wants the first back. One crosshair ray, 200 calls, his models loaded:

| | from a seat, straight upstage | **from the wings, at the parked house** |
|---|---|---|
| with the raycast opt-out | 1.63 ms | **1.11 ms** |
| left pickable | 1.65 ms (1.0×) | **9.23 ms — 8.3×, 83% of a 90Hz frame** |

RULING BY's shape exactly. **Where you point is the whole cost**: off-axis the
bounding sphere rejects for nothing, so the seat figure is the misleading one —
and walking backstage to look at the parked set is the case the ruling *invites*.
Parked sets stay off `WALKABLE`, so `groundAt` never sees them. **582,736
triangles** across 54 meshes stand parked with his models in.

### RULING CE — as few sets fly as possible

> just like roof and the bedroom and closet should eb flown the otheres should
> come on from the sides or back

`bjFlyWhole` became `bjTrackWhole(sc, axis, out, speed)`; flying is the **y**
case of it. The changeover already drives that mover out on a strike and home on
an entry, so a set tracking on from stage left is the same machinery pointed
sideways.

**The fly rail is stage right** — read, not assumed: `p9` builds the locking rail
at `-D.stageW/2 + 2.8` = x −19.2, and the traveler hand line hangs stage right of
the arch.

| set | comes on from | parked, measured |
|---|---|---|
| exterior | **stage right, the fly-rail side** | x −19.80..−7.20 |
| interior | stage left | x 7.20..20.80 |
| attic | upstage | z −21.20..−11.60, behind the backdrop |
| roof, bedroom, closet | flown, as he asked | y 10.50 |
| **netherworld** | **flown — not one he named** | y 10.50 |

**The building has exactly three horizontal slots** — two wings of 14.5m and
6.7m of depth behind the acting area. That is why four of nine still fly.

**And CE improved the parking, which was not the reason for it.** Flying
preserves x and z, so every flown set wants the same volume in the one grid: the
four that fly overlap in **six pairs**, worst 12.30 × 7.95 × 8.15m. Four sets
5.6–9.2m tall cannot stack under a 25m grid, so that is inherent and is recorded
rather than asserted away. The three tracked sets each have their own floor space
and an assertion pins it.

### The netherworld

- **Not as deep** (his correction: *"i meant the set shouldnt be as deep"*).
  **12.45m → 6.90m.** `BJ_AFT_DEEP` squashes the *recession* about the downstage
  frame, which does not move, so the picture starts in the same place and simply
  does not reach as far upstage. The authored z values stay in the `rings` table
  as the full-depth layout; `bjAftZ` puts them on the stage.
- **Backdrop black**, `0x071c40` → `0x000000`.
- **All blue** was already true and its assertion still passes — five blue
  trapezoids brightening 1.50 → 2.54 upstage. Recorded so it is not re-litigated.
- The frame thickness was changed first on a misreading of "thinner" and **put
  back** to the 0.15 BV built it at.

### Two real defects the tests found, and they were mine

**The dress deferral broke on a parked room.** `showCueExtras` judged "can the
audience see this set" as `!sceneOff` — and its own comment says why: a set
mid-way out of a changeover is marked off while its layers are still on. BQ makes
a parked set drawn *on purpose*, so that test inverted. A dress cue on the parked
wagon **deferred for ever** and the room was called on still wearing the old
dressing — the exact pop RULING AY exists to prevent. Now: drawn **and** (`sc.on`
or still travelling).

**The parks were sized to his models and the stand-ins did not fit.** The
exterior's wing park was measured against his fitted 8.6m house; the stand-in is
a **12.6m painted drop** — a drop fills the opening, which is why it used to fly —
so the same offset parked the fallback at x −4.70, in the middle of a 13.6m
picture. The attic went the other way and put the stand-in **0.90m through the
Palace brick**. **The stand-in is the bigger case and the one that plays** on a
fresh clone, over slow wifi before a 27MB file lands, and in every suite, because
jsdom fetches nothing.

## WHAT IS LEFT

### 1. THE NEON PROSCENIUM — BR/BS/BT/BU, and it is next

He asked for it second and it is the only part of his three-item list not built.
**Start from the shelved local branch `bj-portal` (commit `a22bd36`, RULING AX)**,
which already built the engine and was never opened: `bj:portalFrame` as one
merged mesh on one material, **built dark**, `SHOW.bjPortal` registered in
`showBlank()` so the stage swap parks it, a `portal:{col,lvl}` cue field applied
on **every** cue so a cue that says nothing darkens the frame, and a fade on the
frame `dt` at 1.2/s riding `updateStorm`. That default-dark behaviour is exactly
what *"the only times the lights in the neon tube are…"* asks for. **The engine
is right and only the plot changes.** Expect conflicts rebasing it: the split
rule in `showCueExtras`, the p5h repaints, BJ's edits to cues 1.1–1.4, and now
BQ/CE's own p5c/p5h work.

- **BR** — widen the frame to the broad bright bands his photographs show. It
  must stay inside x ±7.4, because the portal check refuses anything scenic wider
  than the house opening.
- **BS** — lit at exactly three times, dark otherwise: blue in the pre-show, blue
  from GO, **red at 1:00**, blue in the netherworld. This **takes the red off the
  eight blinders at GO**, which was a misreading of his own act-one line.
- **BT** — the house starts at **0.12** and goes out with the red, superseding the
  0.30 RULING BM set.
- **BU** — the blinders go inside the proscenium, downstage face at z 1.35.
  **Check the curtain's z first** — the 1:16 white flash must still read.

Two constraints from TRAPS must survive: **not `neonTube`** (its CatmullRom
overshoots a right angle), and **a material per tube is required**, because
`updateNeon` writes a colour into every registered mesh every frame.

**The one unresolved number, still unresolved.** *"1 minute into the audio (not
acounting for the 32 seconds or whaterver it was)"* is read as **`at:60`**. His
"the red lights coming on to soon" does **not** settle it, because the red he saw
is the blinders at 0:35 and both readings are later than that. One line either
way, and he has never confirmed it.

### 2. The start-of-show lighting — deferred at his instruction

*"dont do the lights once you finnish the sets and prosinium just wait."* Worth
knowing that **BS and BT, both his own rulings, already answer both halves of his
complaint**: BS takes the red off GO, BT is the house at 0.12 out with the red.
Whatever he still sees after the proscenium is the real lighting round.

### 3. THE HEADSET RUN — `?v=23`, and it is still the whole point

**Nothing about how ANY of this looks has been observed** — not the sets from the
last round, not the parks, not the netherworld. The full list of open looking
questions is in HANDOFF's NEXT SESSION block. The biggest single unknown is still
whether the houses read at 13.6 × 12.76 with 3.56m behind the border.

New with this round:
- **Do the tracked entrances read?** A set sliding in from a wing instead of
  flying is a different piece of stagecraft, and `BJ_TRACK_SPEED` 2.0 is a guess.
- **Can you see a parked set from a seat?** Measured at 0 rays of 1025 for every
  park with the masking in, but that is geometry, not a look.
- **Is the netherworld right at 6.90m** with a black ground?

### 4. Four decisions that are his, all with numbers attached

- **The netherworld is the one flown set he did not name.** 14.4m wide fits no
  wing and 12.5m — now 6.90m — was too deep to hide upstage; both wings hold a
  house. Making it *narrower* is what would buy it a slot.
- **The cue at 1:14:30 still flies the exterior out.** That is his own plot line
  and re-pointing a cue he wrote is his call. One field.
- **The cemetery declares no park.** Parted to the wings it measures x
  −23.40..23.40 — wider than the 44m stage, 1.40m past both side walls — and 8.4%
  of a stalls eye still lands on it. No wing is wide enough and ground rows cannot
  fly. Re-measure when his graveyard model arrives.
- **His files are 181MB and ~70MB is discarded on arrival** — each carries a 4096
  normal map that RULING BP shrinks to 2048 at load. Re-encoding to 2048 JPEG
  takes each from ~27MB to a few MB, but it rewrites HIS asset.

### 5. Still owed from earlier rounds

- **RULING BY** — standing on his geometry costs **4.29ms, 38.6% of a 90Hz
  frame** (`tools/walkcost.js`). Deferred. Three ways out, none free: leave it, a
  collision proxy sampled at import (~0.6s hitch), or a `walk_` node in the file.
- **The graveyard.** He has supplied none, and the show OPENS in it and stays
  there until 10:40. Load, press GO, and the first ten minutes are OURS.
- **Is `BLIND_POWER` 4.6 too much?** Still unanswered, still the one change that
  could genuinely hurt. `AUD_STROBE_HZ` stays at 9 deliberately.
- **Does the join at 4292 sound?** Act two resumes out of a different file.
- **The house floor pool** stays deferred.
- `tests/smoke.js` still flakes under full-suite load (wall-clock dt; passes alone
  every time). Not a regression.
- `pr6.json` in the repo root is still untracked and unruled.

## WHERE HIS SETS APPEAR, because this caused a false alarm

The show opens in the cemetery, which is ours. His work starts at **10:40**.

| his set | first cue |
|---|---|
| **the interior** (all three houses) | **10:40, cue 7** — then 56 cues |
| the attic | 32:50, cue 13 |
| the roof | 56:00, cue 18 |
| the exterior | 1:11:32, cue 24 |

And 165MB takes minutes over wifi with the stand-ins playing until each lands —
**looking too early shows ours.**

## What this round taught, beyond the features

- **A flag that means two things will eventually mean the wrong one — again.**
  `sceneOff` meant *not drawn* AND *not seen*, which were the same thing until a
  parked set was drawn on purpose. Every test of "can they see it" written as
  `!sceneOff` silently inverted.
- **Fit a fallback, not the delivery.** A park sized to his measured geometry put
  the stand-in in the middle of the picture. The stand-in is the BIGGER case and
  the one that plays whenever a file has not landed — including in every suite.
- **A wrapper group inserted to carry a mover breaks whatever reads the scene's
  structure.** The importer strips the built-in shell out of `sc.group`; with a
  wrapper in the way his house landed on top of ours. Two movers over the same
  group are free if the axes differ.
- **A probe got four things wrong before it got them right**, and each is in its
  header: travel measured from the CENTRE said the cemetery never moves (its
  hills go to opposite wings, so the BOX is what changed); visibility cast against
  the set alone said every flown set is in the picture (a ray through the top of
  the opening rises 0.65m per metre upstage — but the border is in the way); it
  measured a shut house curtain for four runs; and an `unhide` that restored only
  layers left every "parked" set undrawn, so the pick read 1.0× because nothing
  had been parked.
- **A helper in a suite must not take a name the game already uses.** A
  probe-scope `const audLive` shadowed the game's `audLive(tr)` for 165 lines, so
  two assertions were reading the number of lit audience lamps and passing because
  the lamps were dark.
- **My own proxy was the wrong one.** "It has vacated its acting box" is not "out
  of the picture": the brick bounds the attic to 8.8m against a 9.6m stand-in, so
  0.8m of the old footprint stays occupied, harmlessly. What hides an upstage park
  is the backdrop at −10.90 in front of it.

## Feel constants for the headset (one-line retunes)

In `p4` (`buildRig`): `BLIND_POWER` 4.6 / `BLIND_RANK` 0.9, `AUDM_POWER` 2.8 /
`AUDM_RANK` 0.8, `AUD_LIGHT_RESERVE` 2. **Rank is RULING BC and load-bearing.**

In `p5j`: `AUD_WANDER_RATE` 1.0, `AUD_RANDOM_RATE` 1.0, `AUD_STROBE_HZ` 9.0,
`AUD_SWEEP_LO` −15 / `AUD_SWEEP_HI` −98.

In `p5h` (AW–AZ, CE): `BJ_FLY_SPEED` 1.8, `BJ_HILL_SPEED` 2.0 / `BJ_HILL_OUT`
9.5, `BJ_PART_OUT` 10.5, **`BJ_TRACK_SPEED` 2.0**.

In `p5h` (BQ/CE — where a struck set stands): **`BJ_HOUSE_PARK_X` 14.0** (stage
left), **`BJ_EXT_SIDE` −13.5** (stage right, the fly-rail side), **`BJ_ATTIC_BACK`
−8.8** (upstage). All three are sized by the STAND-IN, not by his model.

In `p5h` (the netherworld, BV amended): **`BJ_AFT_DEEP` 0.55**, `BJ_AFT_TUBE`
0.15, `BJ_AFT_BACK` 0x000000.

In `p5c`: `SCENE_PARK_SPEED` 2.0.

In `p5i` (BP, BX, CB, CC, CD): `BJ_TRI_BUDGET` 150000, `BJ_MAT_BUDGET` 8,
`BJ_TEX_BUDGET` 2048, `BJ_FIT_AIR` 0.30, `BJ_SET_DEPTH` 10.0,
`BJ_HOUSE_UPSTAGE` 1.5, `BJ_FILL_MAX` 0.55, `BJ_FILL_RATE` 1.6, and each
manifest entry's `fit`.

## Standing facts

Suite count is 18 (`npm test` in tests/). The patch is **39 channels** on every
stage. RULING AV (model on the production, Beetlejuice only) still governs; AO
stays repealed; RULING B still holds. RULING BB is untouched: while a **clock
track** is really playing it IS the cue clock.

**Every timestamp in the Beetlejuice plot is a position in his WHOLE recording**
— not elapsed show time, and not a position in whichever half is playing. The two
differ by the 35 seconds the track is already into itself when the show starts.
`offset` is what keeps that true across two files.

**His photographs are never committed.** TRAPS draws the line at looking versus
committing.

## Shelved — but still WANTED

**The portal rebuild (RULING AX) on the LOCAL branch `bj-portal`** (commit
`a22bd36`) is still unopened and is the next thing to build. **RULING BW is now
done**, so the only unbuilt rulings are BR/BS/BT/BU.
