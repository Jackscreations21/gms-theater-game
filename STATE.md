# STATE — 2026-08-12 (evening)

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## HIS SEVEN MODELS ARE IN THE GAME — rulings BX–CD

The owner delivered all seven `.glb` files and said: *"can you just use the
pcitrue i gave you as a backdrop for the netherworld. and start with adding the
sets in"*, then *"dont wait for me to merge pr's to keep going just keep
going"*. Mid-round he corrected the sizing twice and added two more asks.

**MERGED: #136, #137, #138, #139, #140.** `main` is at `cf4686b`.
**OPEN AND UNMERGED: #141, #142, #143, #144 — they must merge in that order.**

Cache-bust for the next headset run: **`?v=22`**. Suites 18/18.

Spec for the whole round:
`docs/superpowers/specs/2026-08-12-his-sets-into-the-house-design.md`.

### The delivery, measured

`tools/models.js` is new and kept. Two halves, because neither alone answers
the question: a **container scan** off the glb bytes (exact — jsdom decodes no
PNG, so anything measured through the loader would be guessing about textures),
then a **real import run** that serves his files to the actual `loadSetModels`
fetch and measures what lands **in world space against the frame it has to be
seen through**. Nothing in the repo checked that before; every budget is about
cost.

| file | MB | triangles | materials |
|---|---|---|---|
| `bj-attic.glb` | 25.8 | 99,446 | 1 |
| `bj-roof.glb` | 26.3 | 99,568 | 1 |
| `bj-house-maitland.glb` | 27.5 | 93,510 | 1 |
| `bj-house-deetz.glb` | 27.2 | 93,528 | 1 |
| `bj-house-beetlejuice.glb` | 27.9 | 93,502 | 1 |
| `bj-house-exterior.glb` | 30.8 | 97,920 | 1 |
| `bj-sign.glb` | 15.7 | 98,984 | 1 |

**Every one passes every budget** — one material, one primitive, one draw call,
no stray lights, all inside the 150,000 RULING BP raised the cap to. 181MB
total, all committed.

**The three houses are one house painted three times** — identical bounding box
to three decimals, triangle counts within 26, all out of the tool named
`deetz_house`. The naming was verified by decoding the base-colour PNG out of
each file, not trusted: warmth (mean R−B) **+15.3 / −4.4 / −10.9** orders them
**Maitland / Deetz / Beetlejuice** unambiguously. If it is ever wrong it is a
rename, not a rebuild.

### What the nine PRs were

- **#136 — a set is fitted to the ROOM, not just its width (BX).** The finding
  that stopped the file copy being a file copy. `bjFitAndSeat` scaled width and
  seated only y, and his models are proportionally much taller and deeper than
  MODELING.md's targets: the houses landed **12.01m tall in a 9.20m opening**,
  every set was 0.26–2.22m deeper than the stage, and both flying sets landed
  **centred on z = 0 where the proscenium stands** — 5.13m and 5.45m of set out
  over the audience. The scale is now the smallest of three ratios, still
  uniform; the downstage face seats just upstage of the arch.
- **#137 — the five straight swaps.** Files plus one assertion: every `.glb` on
  disk is really in the index, and `assets/` holds nothing no manifest entry
  fetches. Same reasoning as the recordings (BI) — on Pages the fallback is
  silent, so there-but-untracked would read as "the sets never arrived".
- **#138 — the exterior is a model (BZ).** A tenth slot, and **two assertions
  reversed in place** (the AO/AV/BA precedent, fourth time): the one that
  forbade an entry targeting the `house` scene now requires exactly one and
  still refuses an interior misaimed at it; *"the exterior IS a painted drop"*
  became *"the exterior STAND-IN is"*, because the fallback is silent and the
  drop is what plays until the file arrives.
- **#139 — the houses fill the picture side to side (CB).** His ruling, and he
  confirmed the cost: *"its fine if the house is a little taller than the
  prosinium"*. They were 9.49m wide in a 13.6m opening — two metres of bare
  stage each side. Measured before choosing, by binning triangle **area** by
  height: filling the width puts **7.1% of the surface behind the border** (the
  bottom 0.6m alone holds 26.8%), the profile of a roof tapering away. Uniform
  scale — 43% of horizontal stretch would have distorted every door. **Opt-in
  per entry**, and he confirmed the scope: *"only the 3 main houses needed to be
  changed not any other set"*.
- **#140 — his sign, our lamps (CA).** His note: *"you just have to add the
  lights"*. The sign's lamps are two **materials**, not objects, and our
  stand-in geometry is what used them — so after the swap both would survive
  registered, tintable and used by nothing, and every `signCol` cue in the plot
  would tint a sign that never changes colour. 62 beads and a 4-piece tube
  outline are fitted to his own measured box (his file is one mesh; node names
  are not ours to use). The sign is **hung, not seated** — a new `centre` field,
  because seating it drops a marquee on the floor behind the curtain it hangs in
  front of.
- **#141 — the netherworld, his photograph (BV).** Five axis-aligned rectangles
  in green/cyan/magenta → **tilted trapezoids, all blue**, brightening upstage,
  over a **dark blue backing** the scene never had. His measured colour changes
  survive because `neon` on a cue is a **level, not a colour**.
- **#142 — the houses slide further upstage (CD).** `BJ_HOUSE_UPSTAGE` 1.5m.
- **#143 — the whole set is lit unless the cue says otherwise (CC).**
- **#144 — RULING BY measured and DEFERRED.** See below.

### RULING CC, and why it is not an ambient lift

The rig aims fixtures at stage positions chosen when the sets were our
stand-ins. His houses run **12.98m front to back** where the shell they replaced
was a wall and a staircase, so nothing reaches the upstage half and a set stood
half dark with no cue saying so.

It is **not** a global ambient lift: `p4` already took the rig almost out of the
ambient bed deliberately and says why — *"a bright stage lit the whole
auditorium … stage light belongs on the stage."* It is **not** new lights
either: BC/BG/BL share a pool of 8 (4 in a headset) very carefully.

So the set lights itself — each imported material takes **its own texture as an
emissive map**, so it keeps its painted detail instead of going flat, and costs
no draw call, no light and no shadow. Two guards, each with a test:

1. **Imported materials only.** Stand-in materials are shared across scenes and
   shows (the shared-material trap), so an emissive written onto one would light
   the same material in four other productions.
2. **A blackout stays black.** The default is not a fixed level, it is the
   **stage** rig's own output, audience units excluded. Measured: dark rig
   0.000, full rig 0.550, audience rig alone 0.000, `fill:0` 0.000.

`fill` on a cue overrides it and is read **per cue, not remembered** — the
opposite of `signCol` two lines above it. His words draw that distinction.

### RULING BY — measured, and it said no

`tools/walkcost.js`. His exports name no `walk_` node and **cannot** (one
primitive), so the roof lost `bj:roofDeck` — *"the roof slope you stand on, the
whole point of the set"* — and each house lost `bj:landing`.

```
the stand-in deck (12 tris), over it          0.0018 ms/call
HIS ROOF (99,568 tris), over it               4.2867 ms/call   2400x
HIS ROOF, ray 40m away (bounding-box reject)  0.0001 ms/call
```

**4.29ms is 38.6% of a 90Hz frame**, and `groundAt` runs once for the player
*plus once per settling body*. No early exit: three.js collects and sorts every
intersection, so a **miss costs the same as a hit** and the figure above is a
miss. The flag was written, measured and taken back out. **The estimate written
into the spec before measuring was 0.031ms — wrong by 100×.**

Neither cheap fallback is correct: the stand-in's walkables sit at **our**
co-ordinates inside his geometry (you would stand inside the slate), and a floor
plane at `min.y` is right for the interior and useless for the roof.

## WHAT IS LEFT

### 1. Merge #141 → #142 → #143 → #144, in that order

They are a linear chain built on each other. He asked not to be waited for, so
they were opened ahead of merging.

### 2. THE HEADSET RUN — `?v=22`, and it is the whole point now

Nothing about how any of this LOOKS has been observed. A real browser was used
to prove the models load, apply, are the right size and shrink their textures —
but the pane never composited, so **not one frame has been rendered**. Open
questions, in the order they will bite:

- **Do the houses read at 13.6 × 12.76, with 3.56m behind the border?** This is
  the biggest single unknown in the round.
- **Is `BJ_FILL_MAX` 0.55 lit, or glowing?** One line in `p5i`. If the sets look
  self-lit rather than lit, this is the number.
- **Is 1.5m of upstage push (`BJ_HOUSE_UPSTAGE`) enough, or too much?**
- **Was "slide up" upstage at all?** Read as upstage (the theatre sense). If he
  meant the wagon should PARK further off, that is `BJ_WAGON_BACK` (−10).
- **The exterior lands 8.63m wide** in a 13.6m opening — bigger side gaps than
  the houses had. Deliberately not filled: it is nearly a cube, so filling it
  would mask **28.5%** of its surface, and for a house seen from outside that is
  the roofline. His call.
- **The attic (13.06m) and roof (12.30m)** are within 0.6m of the opening. Same
  one-line change if he wants them flush.
- **Does the netherworld read as his picture** — tilted, blue, over a dark
  ground?
- **Does the sign read with 62 beads and a tube on his geometry?**
- **The exterior seats 8.77m deep** with its face at the arch, leaving ~1m to the
  sky cloth on line 13 at z −10.10, where the stand-in drop had 2.75m. Nothing
  fouls; whether the sky can still be LIT from in there is unanswerable here.

### 3. His files are 181MB and ~70MB of it is discarded on arrival

Each carries a **4096 normal map that RULING BP shrinks to 2048 at load**, so
roughly 40% of what a Quest downloads is thrown away on the way in. Re-encoding
to 2048 JPEG would take each file from ~27MB to a few MB. Same class of fix as
the texture shrink, but it **rewrites his asset** rather than changing what we do
with it, so it is his to say. Flagged with the numbers, not taken.

Related: 165MB took **17.4s from localhost**. Over wifi to a Quest it is minutes,
and the stand-ins play until each file lands — so **looking too early shows
ours**, which already caused one "it's still the old models" report.

### 4. RULING BY needs a decision, and none of the three is free

1. **Leave it** — walking on the roof is a sandbox nicety; the show never needs it.
2. **A collision proxy at import** — a coarse heightfield sampled off the mesh.
   Correct and cheap to raycast, ~0.6s of one-off cost that would show as a hitch.
3. **A `walk_` node in the file** — cheapest of all, and needs an exporter that
   can emit more than one mesh named `walk_roof`.

### 5. RULING BQ — a set that comes off is never gone

Spec §9 of the **previous** round's design doc, **not started**, and still the
biggest item on the list — two to three times the models PR. Today
`sceneApply(sc,false)` makes a struck set cease to exist, and that is what makes
seven configurations affordable. Needs a park position **per scene per stage,
expressed relative to the stage**, and the cost **measured, not assumed** — which
RULING BY has just demonstrated the value of. Parked sets stay off `WALKABLE`.

### 6. Still owed from earlier rounds

- **Is `BLIND_POWER` 4.6 too much?** Still unanswered, still the one change that
  could genuinely hurt. `AUD_STROBE_HZ` stays at 9 deliberately.
- **Does the join at 4292 sound?** Act two resumes out of a different file.
- **The house floor pool** stays deferred (spec §2 of the previous round).
- **The graveyard** — he supplied none, and the show OPENS in it and stays there
  until 10:40. Anyone loading the show and pressing GO sees **our** cemetery for
  ten minutes. The bedroom and closet keep their stand-ins by his word.
- `tests/smoke.js` still flakes under full-suite load (wall-clock dt; passes
  alone every time). Went once this round. Not a regression.
- `pr6.json` in the repo root is still untracked and unruled.

## WHERE HIS SETS APPEAR, because this caused a false alarm

The show opens in the cemetery, which is ours. His work starts at **10:40**.

| his set | first cue |
|---|---|
| **the interior** (all three houses) | **10:40, cue 7** — then 56 cues |
| the attic | 32:50, cue 13 |
| the roof | 56:00, cue 18 |
| the exterior | 1:11:32, cue 24 |

Cues are labelled by timestamp (#131), so these are findable in the list; firing
by hand takes the music with it (#132).

## What this round taught, beyond the features

- **The number you would have guessed is not the number.** RULING BY's cost went
  into a spec as 0.031ms and measured at 4.29ms — 100× out, and it would have
  shipped a frame-rate cliff onto the one platform the budget system exists to
  protect.
- **A mutation that lands in the TEXT but not in the BEHAVIOUR reads exactly
  like an assertion that does not fire.** A distortion mutation scaled x by
  `(targetW/size.x)/s` — and for a filling set `s` already IS that, so the factor
  was 1.0. The suite passed and the honest reading was "weak assertion".
  **Prove the mutation changed something**, not just that it applied.
- **A bound nothing exercises cannot be negative-checked.** Deleting the
  back-wall clamp changed nothing, because nothing he delivered makes it bind.
  It has its own fixture now.
- **`undefined` arithmetic makes an assertion pass silently.**
  `box.max.z > -undefined + 0.01` is `5.45 > NaN`, which is false — so a set
  hanging five metres over the audience sailed through its own test.
- **A test that reloads the show proves nothing about per-frame state.** The
  blackout check reloaded, so nothing was registered, the fill returned early,
  and `undefined > 0.02` passed.
- **The real frame is three calls, not one.** `updateFades` → `updateRig` →
  `updateStorm`. Stepping only `updateStorm` leaves the rig wherever the previous
  test left it, which made a correct build look broken.
- **Proving a function while never proving its wiring — fourth time.** The cue
  field was set by hand in the test, so a mutation making `showCueExtras` ignore
  it entirely passed.
- **A probe that reports a ruling as a fault is worse than no probe.**
  `tools/models.js` called CB's masked overflow and CA's downstage sign faults
  until it was taught to read the manifest first.
- **`const` in its temporal dead zone throws on a plain reference too**, not
  just `typeof`: `BJ_HOUSE_UPSTAGE` declared below the manifest that reads it
  took the whole build down at load.

## Feel constants for the headset (one-line retunes)

In `p4` (`buildRig`): `BLIND_POWER` 4.6 / `BLIND_RANK` 0.9, `AUDM_POWER` 2.8 /
`AUDM_RANK` 0.8, `AUD_LIGHT_RESERVE` 2. **Rank is RULING BC and load-bearing.**

In `p5j`: `AUD_WANDER_RATE` 1.0, `AUD_RANDOM_RATE` 1.0, `AUD_STROBE_HZ` 9.0,
`AUD_SWEEP_LO` −15 / `AUD_SWEEP_HI` −98.

In `p5h` (AW–AZ): `BJ_FLY_SPEED` 1.8, `BJ_HILL_SPEED` 2.0 / `BJ_HILL_OUT` 9.5,
`BJ_PART_OUT` 10.5.

In `p5i` (BP, BX, CB, CC, CD): `BJ_TRI_BUDGET` 150000, `BJ_MAT_BUDGET` 8,
`BJ_TEX_BUDGET` 2048 (a shrink target, not a refusal), `BJ_FIT_AIR` 0.30,
`BJ_SET_DEPTH` 10.0, **`BJ_HOUSE_UPSTAGE` 1.5**, **`BJ_FILL_MAX` 0.55**,
**`BJ_FILL_RATE` 1.6**, and each manifest entry's `fit`.

## Standing facts

Suite count is 18 (`npm test` in tests/). The patch is **39 channels** on every
stage. RULING AV (model on the production, Beetlejuice only) still governs; AO
stays repealed; RULING B still holds. RULING BB is untouched: while a **clock
track** is really playing it IS the cue clock.

**Every timestamp in the Beetlejuice plot is a position in his WHOLE recording**
— not elapsed show time, and not a position in whichever half is playing. The
two differ by the 35 seconds the track is already into itself when the show
starts. `offset` is what keeps that true across two files.

**His photographs are never committed.** TRAPS draws the line at looking versus
committing, and this round looked at one.

## Shelved — but still WANTED

**The portal rebuild (RULING AX) on the LOCAL branch `bj-portal`** (commit
a22bd36) is untouched by this round and still unopened. Rulings **BR/BS/BT/BU**
— the neon proscenium, its plot, the house at 0.12, and the blinders moving
inside the proscenium — are **all still unbuilt**, and BT still supersedes the
0.30 that #130 set. **One number in it is still unconfirmed**: *"1 minute into
the audio (not acounting for the 32 seconds or whaterver it was)"* was read as
`at:60`, because 95 would put the red after the 1:16 blinder flash. He has never
confirmed it.

**RULING BW — TOP fires the first cue** — is also still unbuilt, and small.
