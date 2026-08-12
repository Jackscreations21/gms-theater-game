# The neon proscenium, and his corrections — design

2026-08-13. Rulings **CF–CM**, continuing the sequence (CE was the last).

He watched it and came back with thirteen things in one message. Two are
features (the neon proscenium, a start-of-show call on the fly rail), one is a
fault report against RULING CA, one is a piece of building, and the other nine
are corrections to his own plot — nine numbers he has now measured himself
against the recording.

He gave the order himself, and it matters for reading the list:

> (all of these are in order od there appearance)

That single line is what disambiguates two of the nine, because more than one
cue in the plot could answer to the words he used.

---

## The list, as he wrote it, mapped to what it touches

| # | His words | Where it lands |
|---|---|---|
| 1 | the sign's lights "arent on the sign they are just a box around it" | `bjSignLamps`, p5i — RULING **CF** |
| 2 | no red and no house-out at GO; both at 1:00; house at 15 only at start, interval, end | cues 1 / 0 / 23 / 57 — RULING **CG** |
| 3 | Maitlands house 2s earlier, and it cannot start until the backdrop is out | cue 7 — RULINGS **CK**, **CI** |
| 4 | the roof 5s earlier, no light change | cue 18 — RULING **CK** |
| 5 | the act-one blackout instant; house to 15 only once the curtain is shut | cues 22 / 23 — RULINGS **CK**, **CJ** |
| 6 | Beetlejuice house → attic 25s earlier, set only | cue 34 — RULING **CK** |
| 7 | attic → Beetlejuice house 55s later | cue 35 — RULING **CK** |
| 8 | the house set slides back on 15s later | cue 40 — RULING **CK** |
| 9 | that blackout 10s earlier | cue 41 — RULING **CK** |
| 10 | the Palace back wall further back, to fit the whole house set | `PAL_DEEP`, p2 — RULING **CL** |
| 11 | at the end, house to 15 only once the curtain is shut | cue 57 — RULING **CJ** |
| 12 | a START OF SHOW button in the flys | p1/p7/p9 — RULING **CM** |
| 13 | the proscenium neon; blinders inside it | p5h/p5c/p4 — RULING **CH** |

---

## 1. RULING CF — the sign's lights are HIS OWN geometry, lit

> "The lights for the beetlejuice sign arent on the sign they are just a box
> around it."

**He is describing exactly what the code does, and the probe says so.** With his
`bj-sign.glb` landed, the sign scene holds three meshes:

```
  Mesh10           98,984 tris   x [-4.65.. 3.85]  y [3.99..8.01]  z [0.05..0.15]  [mapped]
  bj:signBulbs      3,472 tris   x [-4.63.. 3.82]  y [4.01..7.99]  z [0.19..0.38]  <- lamp material 0
  bj:signNeon          48 tris   x [-4.30.. 3.51]  y [4.33..7.67]  z [0.25..0.32]  <- lamp material 1
```

`bjSignLamps` measures his model's bounding box and hangs a ring of beads and a
tube outline round its **perimeter**. That is a box around the sign, drawn
against a 99k-triangle marquee that already has its own bulbs and tubes modelled
in. Two crude rings outside his detail.

**AND THE SIGN IS DARK UNDERNEATH THEM, which is the other half of why it reads
as a box.** `bjApplyModel` calls `bjFillRegister` on everything it lands,
including the sign — so his sign face is on the RULING CC list, which sets
`emissiveIntensity = 0` and then drives it from **the stage rig's own output**.
The sign hangs downstage of the house curtain and the plot's very first cue is
labelled *"PRE-SHOW — house low, curtain in, the sign lit"* with the stage rig at
zero. So the marquee is at 0.000 for the whole pre-show and the only lit thing on
it is our bead ring.

**RULING CF: the sign is not a set, and its lamp is its own material.**

- The sign comes **off** the RULING CC fill list. CC exists because the rig aims
  where our stand-ins were and cannot reach the back of a 13m room; a marquee
  hanging in front of the curtain has the opposite problem, and tying it to the
  stage rig makes it dark in the one cue that names it.
- Instead it takes the stand-in panel's own treatment — `emissive` white,
  `emissiveMap` = its map, `emissiveIntensity` 0.95 — so it is self-lit off his
  painted detail exactly as our panel always was.
- `SHOW.signLamps` is re-registered onto **his** material, with the original
  values remembered, so `signCol:'#ff1e10'` turns HIS sign red and `signCol:null`
  restores it. The bead and tube box is gone.

This keeps RULING CA's actual requirement — *"you just have to add the lights"*,
and no `signCol` cue anywhere in the plot tinting nothing — while dropping the
geometry that was our reading of it and is what he objected to. The stand-in
sign is untouched: its beads sit on the panel edge and are a marquee, which is
why nobody looked twice at the imported path.

**An existing assertion inverts** and is reversed in place — the AO/AV/BA/BI/BQ
precedent, sixth time. `tests/beetlejuice.js` asserts *"BOTH of the sign's lamp
materials still have geometry after the swap (CA)"*, which was the guard against
the silent failure CA was written for. The guard is still wanted; what it must
now check is that the lamp registry points at geometry that is **in the picture**
rather than at two rings around it — that the registered material is one his file
actually uses, and that `setSignLamps` still tints and restores through it.

---

## 2. RULING CG — nothing is red at GO, and the house is at 15 three times

> "the red lights shouldnt come on as soon as you press go and the house light
> shouldnt go don when you press go. They should both happen at time stamp 1:00
> in the audio. And the house light shouldn only be at 15 at the start,
> intermission and the end."

**THIS SETTLES THE ONE NUMBER THE LAST THREE HANDOFFS HAVE CARRIED AS
UNRESOLVED.** *"1 minute into the audio (not acounting for the 32 seconds or
whaterver it was)"* was read as `at:60` and never confirmed; "time stamp 1:00 in
the audio" is the same number said plainly. **`at:60` is now his, not our
reading.**

It supersedes RULINGS BM (pre-show house 0.30) and BT (house 0.12).

| | before | after |
|---|---|---|
| pre-show (cue 0.5, `at:33`) | house 0.30 | **house 0.15** |
| GO (cue 1, `at:35`) | house 0, eight blinders red 0.85 | **house 0.15**, nothing red |
| **1:00 (cue 1.05, `at:60`) — NEW** | — | **house 0, the proscenium goes red** |
| interval (cue 23, `at:4269`) | house 0.5 | **house 0.15** |
| **act two's GO (cue 24, `at:4292`)** | house 0.5 | **house 0.15** |
| the end (cue 57, `at:8100`) | house 0.5 | **house 0.15** |

**Cue 24 was missed in the first pass and an assertion found it.** "The
intermission" is not only the cue that starts the interval — the audience is
still coming back in at act two's GO, and the house does not go out until his
own 1:11:47 line fifteen seconds later. Five cues carry the house at 15; every
other cue in the plot has it at 0.

"15" is read as 15% — `house:0.15` — because every other level he has given in
this project is a percentage and the master runs 0..1.

**THE SIGN'S RED MOVES WITH IT, and this is a judgement call worth naming.** His
original act-one line was one sentence — *"The lights around the prosinum all
turn red and all the lights on the beetlejuice sign go bright red"* — so the
proscenium red and the sign red were always one statement fired by one cue. He
has now moved "the red lights" off GO and onto 1:00. Splitting the sentence
(proscenium at 1:00, sign still at 0:35) would leave one red thing alone on a
stage he has just said should not be red yet. So `signCol:'#ff1e10'` moves to the
new 1:00 cue with the proscenium. **If he meant the sign to stay red from GO,
that is one line back.**

Between GO and 1:00 the stage is therefore the pre-show picture with the music
running and the house at 15 — twenty-five seconds of nothing but the track, which
is what he has asked for twice now.

---

## 3. RULING CH — the proscenium neon

> "remove the current neon stuff and replace it with a thicker bar going all the
> way around that lights up red at the start when the blinders would have been
> red and blue for the netherworld and blue at pre show intermission and after
> the show. For the rest it is off. And move the blinders to inside of the neon
> thing"

This supersedes RULINGS BR/BS/BT/BU and the shelved RULING AX, and it is the
first time the frame's plot has come from him rather than from a photograph.

**The engine is the shelved `bj-portal` branch (`a22bd36`), rebased.** It already
built: a frame **built dark**, `SHOW.bjPortal` registered so the stage swap parks
it, a `portal:{col,lvl}` cue field applied on **every** cue so a cue that says
nothing darkens the frame, and a fade on the frame `dt` riding `updateStorm`.
"For the rest it is off" is that default-dark behaviour word for word. What
changes is the geometry and the plot.

**THE GEOMETRY: one thick bar, all the way round.** The shelved version was two
concentric thin tube runs read off his photographs. He has now said what he
wants: *a thicker bar going all the way around*. So it is one closed rectangle of
square-section bar — two legs, a header, a sill — replacing `bj:portalTrim`'s
four thin tubes, two returns per side and three hoops entirely. Constraints that
survive from TRAPS and do not move:

- **Not `neonTube`.** Its CatmullRom overshoots a right angle: a rectangle drawn
  as five corner points came out 14.5m wide from a specified 12.6 and dipped
  0.53m through the deck. Four merged bars.
- **It stays inside x ±7.4**, because the beetlejuice suite's portal check
  refuses anything scenic wider than the house opening.
- The whole frame is **one merged mesh on one material**. The "a material per
  tube is REQUIRED" rule is `updateNeon`'s, and this frame is not on `SHOW.neon`
  — `updatePortal` writes one colour into one material, so one material is
  correct here and the netherworld's tubes are untouched.

**THE PLOT: lit at exactly four kinds of moment, dark otherwise.**

| when | colour |
|---|---|
| the pre-show | blue |
| 1:00 — where the blinders would have been red (CG) | **red** |
| the netherworld (1:39:19 → 1:53:00) | blue |
| the interval | blue |
| after the show (the final cue) | blue |
| everything else | **off** |

"blue at pre show intermission and after the show" is three of those; "red at the
start when the blinders would have been red" is the 1:00 moment RULING CG has
just created, and the phrase **"would have been"** is what takes the red off the
eight blinders — the neon does that job now, not them.

**THE BLINDERS MOVE INSIDE IT.** They are built in `buildRig` (p4) round the
arch; they move to the downstage face of the neon frame. **Check the curtain's z
before choosing the number** — the 1:16 white flash must still read with the
house curtain in, and the curtain hangs at z −0.50.

---

## 4. RULING CI — a set change waits for the fly line it needs

> "make it so the house cant start sliding till the backdrop is fully up"

Cue 7 flies the backdrop out and slides the Maitlands house on in the same
breath. The backdrop is line 14 and the wagon travels 10m; today they simply both
start, and he has watched the house set off into a cloth that is still on its way
up.

**A cue move may declare a fly line it waits on.** `move:{scene:'interior',
off:0, after:14}` — the mover is not retargeted until `FLY[13]` has arrived at its
target. It is a **gate on the move, not a delay**: the cue fires, everything else
in it happens, and the one thing that would collide holds.

It has to ride the frame, never a timer (CLAUDE.md), so it is a pending record
`sceneMoveStep` checks each frame — the same shape as `sc.mvHide`, which already
defers a hide until the last part has arrived.

**Declared, never assumed.** A move with no `after` behaves exactly as it does
today, which is what leaves the other four productions and the other eight moves
in this plot untouched.

---

## 5. RULING CJ — the house lights wait for the curtain

> "the house lights dont come up to 15 until the main curtain is closed"
> "the lights dont come back up to 15 at the end till the curtain is fully
> closed"

He says it twice, at the two places the house comes up — the interval and the
end. Both are the same fault: the curtain is a traveler that flies, and it takes
`(OUT_TRIM − trim) / speed` seconds to come in, while the house cue fires seven
seconds after the blackout at the interval and on the same cue as the curtain at
the end. So the audience gets the house up on a stage that is still open.

**A cue may declare `houseAfterCurtain:true`.** `HOUSE.house` holds at its
previous value until the front traveler has reached its in trim, then goes to the
cue's level over the cue's own fade. Same gate shape as CI, same frame-driven
rule, same declared-never-assumed bargain.

The **curtain is judged on the LINESET, not on a cue field** — `frontCurtainLineset()`
already finds it, `ls.pos` is where the pipe actually is, and `ls.target` is where
it was sent. "Fully closed" is the pipe home **and** the halves together
(`ls.open`), because the show curtain flies rather than draws and both have to be
true for the picture to be shut.

---

## 6. RULING CK — his nine retimings, and a set change never moves a light cue

Six of the nine carry the same instruction in his own parentheses — *"(dont
change any light cues just the set change)"*, *"(dont change the lighting cues)"*.
That is a rule, not a note, and it is what decides the shape of the change:
**where a cue does both a set change and a look, retiming the set change SPLITS
the cue rather than moving it.** The set change goes to its new second carrying
the look that is already standing, and the light cue stays where it is with the
look it has.

| his ask | cue | `at` before | after | shape |
|---|---|---|---|---|
| Maitlands house 2s earlier | 7 | 640 | **638** | whole cue moves (his only untimed-light change) |
| the roof 5s earlier | 18 | 3360 | **3355** set / 3360 light | split |
| act-one blackout instant | 22 | fade 4 | **fade 0** | fade only |
| bj house → attic 25s earlier | 34 | 5125 | **5100** set / 5125 light | split |
| attic → bj house 55s later | 35 | 5400 | **5455** | whole cue moves; its look is identical to the standing one |
| the house slides back on 15s later | 40 | 6780 | **6795** | whole cue moves |
| that blackout 10s earlier | 41 | 6812 | **6802** | whole cue moves |

**Item 3 is the one exception, and it is his.** *"Make the maitlands house slide
forward 2 seconds earlier"* — the cue that slides it is also the cue that flies
the backdrop out, and the second half of the same sentence is RULING CI. Moving
the whole cue to 638 gives the backdrop the two-second head start the gate then
enforces; splitting it would give the wagon its gate and leave the cloth where it
was, which is the opposite of what the pair of instructions is for.

**Item 7 lands exactly on the blackout, and that is not a coincidence.** 1:30:00
plus 55 seconds is 1:30:55, which is cue 36, *"1:30:55. Lights blackout"* — his
own line. The set change is placed immediately before it in the stack at the same
`at`, so the house starts on and the stage goes black over it. The follow chain
must survive a zero gap between two cues.

**Item 8 is the one his ordering line resolves.** *"Make the hous set slide back
on 15 seconds later than it currently does"* could name cue 39 (1:39:19, *"house
slides back"*, the netherworld coming on) or cue 40 (1:53:00, *"the house slides
on again"*). It is **cue 40**, for two reasons: "slide back **on**" is coming on,
not going off, and his set list's own words for cue 40 are *"beetlejuice house
come on"*; and item 9's blackout has to fall after item 8 in his stated order —
against cue 39 the next blackout is 1:39:22, three seconds later, and moving that
ten seconds earlier would put the blackout before the set change it is meant to
cover.

**Nothing about the audio moves.** Every `at` is a position in his whole
recording (RULING BB) and the four cues carrying `audio` are untouched.

---

## 7. RULING CL — the Palace goes deeper again

> "Make the back wall of the palace go a little farther back to fit the entir
> hous set"

**Measured, not guessed.** With his models loaded, the interior wagon sent to
`BJ_WAGON_BACK` measures **z −24.78 .. −11.80** against the Palace brick at
`PAL_BACK` −21.50: **3.28m of house standing out in the street.** The stand-in
in the same place measures −19.24 .. −11.56 and clears by 2.26m, which is why
this was invisible until he had his own sets in — and it is the one case in this
project where **his model is the bigger case and the stand-in is the comfortable
one**, the exact inverse of the RULING BQ trap.

It is already a known number: the RULING BQ writeup says so in a comment at the
interior's `sceneTravel` and parked the room stage LEFT instead, because upstage
did not fit. He has now chosen the other answer — make it fit.

`PAL_DEEP` **4.5 → 8.5**, so `PAL_BACK` goes −21.5 → −25.5 and his house clears
by 0.72m. `D.backWall` stays at −17: it is the STAGE-COORDINATE reference every
plot, both Arc houses and every drag limit are written to, and the split between
the two numbers is the whole of the safety of the original change (p2.txt).
Everything structural is already expressed off `PAL_BACK`/`PAL_DEEP` — the deck,
the stage-house wall, the dock and crossover (p2c), the cull rooms (p2i), the
shed and every piece of furniture in it (p2m), the walk block (p7) — because the
first move of this wall left the trash drum 0.1m through the brick and that is in
TRAPS. This move is the test of whether that lesson took.

---

## 8. RULING CM — the fly rail has a START OF SHOW call

> "Add a button in the flys that puts into start of show position with is just
> where everything needs to be for the start of the show."

The rail already has ALL IN / ALL OUT / STOP ALL / SHOW LOOK. SHOW LOOK is a
hardcoded list of lineset indices from before there were productions; this is the
production-aware one.

**It is the loaded show's own first cue, and nothing invented.** `CUES[0]` carries
a full `fly` snapshot — every lineset's target and the traveler's open — recorded
by `plotBeetlejuice` from the cue's own declared state. The call applies that
snapshot through `flyTo`, which works the lock and clamps to the deck like any
other board move. With no show loaded, or a stack with no fly snapshot, it says
so and does nothing.

**It is a rail call, not a cue.** It moves the fly system and nothing else — it
does not fire cue 0, does not touch the lights, the sound or the cue pointer.
TOP already does that (RULING BW) and doing both from one button would make the
fly rail start the show.

**AND IT MUST EXIST IN THE HEADSET.** *"A control that exists only in the DOM
does not exist in VR"* is in TRAPS with four rounds of the Arc doors behind it,
and the fly rail is a place he stands in VR. The VR fly page gets the same button
beside its own ALL IN / ALL OUT, calling the same function — and the VR buttons
there are placed by `vrBtnBox` coordinates, so the third one goes where the
layout has room rather than where a pixel constant happens to be.

---

## What is NOT in this round

- **The graveyard.** He has still supplied no model and the show opens in it.
- **RULING BY** — standing on his geometry, 4.29ms, still deferred.
- **The house floor pool**, still deferred.
- **`pr6.json`**, still untracked and unruled in the repo root.

## The order the work goes in

Five PRs, a linear chain, because four of them touch `p5h` and two touch the
plot array:

1. **the sign's own lights** (CF) — p5i, `tests/beetlejuice.js`
2. **the Palace goes deeper** (CL) — p2, a probe
3. **START OF SHOW** (CM) — p1, p7, p9
4. **the neon proscenium and the top of the show** (CH, CG) — p5h, p5c, p4
5. **the retimings and the two gates** (CK, CI, CJ) — p5h, p5c

Suites green before and after each; every new assertion negative-checked against
a wrong implementation, with the mutation proved to have landed.
