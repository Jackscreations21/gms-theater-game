# The top of the show, parked sets, and the neon proscenium

**Rulings: BW, BQ, BR, BS, BT, BU** — all four of the portal rulings and both of
the others were specified in §9 and §10 of
`2026-08-11-the-balcony-the-beams-and-the-cue-clock-design.md` and none were
built. This document is the build design, and it records what measurement added
to each of them.

## What he asked for, and in what order

Three messages, the order revised twice:

> do the sturck sets still stay backstage first. then add the neon prosinium like
> the piture that chages colors at the right time. then fix the lighting cues at
> the start(the red lights coming on to soon and the house lights bieng to bright
> and going out too soon)

> dont do the lights once you finnish the sets and prosinium just wait

> first make it so when you press top of show it automaticall sets it to cue one
> beuase when i try to press go to go to top os show it starts the show

So the round is **BW, then BQ, then the portal**, and **the lighting cues at the
start are NOT in it** — he wants to give that verdict himself after seeing this.

### The lighting item is deferred, but two of the portal rulings land inside it

Worth stating plainly, because it will look like scope creep otherwise. His
item-3 complaint has two halves and the portal round already answers both:

- **"the red lights coming on to soon."** RULING BS reinterprets his own act-one
  line "the lights around the prosinum all turn red", which was built as *the
  eight blinders going red at GO*. He has ruled that the **neon tube** is what he
  meant and that it happens at **1:00**, not at GO. Building BS therefore takes
  the red off GO. That is not the lighting round; it is what "changes colours at
  the right time" means.
- **"the house lights bieng to bright and going out too soon."** RULING BT:
  **0.12 in the pre-show, out when the tube turns red.** His number, verbatim,
  from the same message as the neon, and his item-3 complaint independently
  confirms both halves of it. Today it is 0.30 and it goes out at GO.

**BT is therefore built.** It is his own ruling with his own number attached to
the neon's red, and doing the portal without it would leave the tube going red at
1:00 while the house still snaps out at GO — precisely the fault he reported. If
he wants a different number it is one line. **Nothing else about the start
lighting is touched**: the blinder flash at 1:16, the purple sweeps at 1:03–1:09,
`BLIND_POWER`, the haze, and every level in the plot stay exactly as they are.

---

## 1. RULING BW — TOP fires the first cue, and lets go of the transport

> make it so when you press top of show it automaticall puts it on first cue
> instead of making you press go to get to first cue

> first make it so when you press top of show it automaticall sets it to cue one
> beuase when i try to press go to go to top os show it starts the show

Today both TOP buttons only move the pointer:

| where | what it does |
|---|---|
| `p7` `#btnTop` | `nextCue = 0; refreshCues(); toast('Standing by at the top')` |
| `p9` `vrPageCues` | `nextCue = 0; vrDrawConsole(true)` |

Nothing fires, so the look on stage is still whatever was up, and GO is the only
way forward — which is his complaint.

### The spec said this composes with RULING BO for free. It does not.

The previous doc predicted: *"cue 0 carries its own `audio`, so firing it starts
the pre-show music and the jump-seek declines."* The seek half is right —
`showCueSeek` returns false on `c.audio` — **and it is not the seek that bites.
It is the transport.**

Measured on the built file, with act one live:

```
HE PRESSES TOP OF SHOW
  nextCue 0 — and NOTHING else moved: house still 0.000, so the 50:00 look
  is still on stage.  Which is why pressing GO feels like the only way forward.

HE PRESSES GO
  fired index 0 — house now 0.300, nextCue 1
  act one was NEVER STOPPED: want true, playhead 35, live true
  ONE FRAME later -> nextCue 2  (Q1.1)
  settled after 2 frames -> index 2  (Q1.1), house 0.000
```

**The pre-show cue does not stop act one.** Only the GO cue does, via
`audio:{play:'act1', at:35, stop:'preshow'}`. So firing cue 0 by hand leaves a
`clock:true` track live, `showAudioTick` keeps the clock, and on the very next
frame it fires the GO cue off a playhead already past 0:35 — up to
`AUD_CATCHUP` (40) cues a frame. **Two frames after asking for the top of the
show, the board is at Q1.1 and the show is running.** That is his sentence,
mechanically.

### The build

A `cueTop()` beside `go()`/`goBack()` in `p6`, and both buttons call it:

1. `cancelFollow()` — an armed follow from the look that was up must not GO a
   cue into the pre-show.
2. **Stop the show transport** (`showSoundStop`, guarded by `typeof` like every
   other cross-part call), so no `clock:true` track is live to take the stack
   back. It also clears the pattern engine, which is right: the top of the show
   has no effects running.
3. `cueFiredByHand(0)` — fires the first cue, which is what he asked for. Cue 0
   declares `audio:{play:'preshow'}`, so the pre-show music starts, and
   `showCueSeek` declines because the cue has already spoken.

Order matters: the stop comes **before** the fire, or it would stop the pre-show
music the fire just asked for.

**It stays generic.** `cueTop()` fires index 0 of whatever stack is loaded; the
four productions with no `at` and no audio get "fire the first cue", which is
what TOP has always meant, and `showCueSeek` declines on a missing `at`.

---

## 2. RULING BQ — a set that comes off is never gone

> make it so when i set comes off it is never gone it is always somewhere
> backstage

Today `sceneApply(sc, false)` makes a struck set **cease to exist**: invisible,
`layers.disableAll()` on every descendant, walkables off `WALKABLE`. That is what
makes seven configurations affordable, and in a theatre you can walk around it is
also wrong.

### What measurement changed about this ruling

The previous doc called this "two to three times the models PR". **It is
smaller than that, because the park positions already exist** — the AZ
changeover round built every one of them:

| scene | how it is struck today | where that leaves it |
|---|---|---|
| cemetery | part movers `hillR`/`hillL` on x | the wings, ±9.5 |
| interior | whole-group `mv` on z | upstage, `BJ_WAGON_BACK` −10 |
| exterior | whole-group `mv` on y | flown |
| attic, roof, bedroom, closet, netherworld | `bjFlyWhole` part mover `all` on y | flown, `BJ_PART_OUT` 10.5 |
| the flown sign | whole-group `mv` on y, and it is `always` | flown, `BJ_SIGN_OUT` 9.0 |

So a struck set **already travels somewhere legitimate** and is then switched
off on arrival. BQ is mostly: **stop switching it off.**

A flown park is genuinely masked — `BJ_PART_OUT` 10.5 puts the bottom edge 1.3m
above the 9.2m visible opening — and 10.5 + a 12.76m set tops out at 23.3m
against `D.gridY` 25. Both to be confirmed by the probe, not by this arithmetic.

### The one park that does not work, and it is his own models

`BJ_WAGON_BACK` −10 was measured against the **stand-in** dressings. His interior
is **12.98m deep**, and TRAPS already records the parked world box as
**z −24.8..−11.8** against `PAL_BACK` −21.5 — so the parked house stands **3.3m
through the Palace brick, out in the street.** Invisible today only because it is
switched off. **The moment BQ keeps it drawn, that is a house in the road.**

There is no upstage answer: hiding a 12.98m set inside a 17m stage whose acting
position is z −14.8..−1.8 would need 13m of upstage travel and the brick is at
−21.5. **So the interior parks in a WING**, which is what a wagon actually does.
`D.stageW` 44 against `D.procW` 15 leaves 14.5m each side — room for a 13.6m
house. Measured in the probe before a number is chosen.

### The design

- **A park is declared, never assumed.** `scenePark(sc, axis, out)` wraps the
  scene's children in one group — the `bjFlyWhole` pattern, so nothing
  repositions at build — and registers it as a named part mover `park`. The
  existing changeover machinery then drives it for free: `sceneChangeTo` already
  sends every part mover to its `out` on strike and `home` on entry.
- **A wrapper, not `sc.mv`.** The interior's whole-group mover is already spent
  on the cue-authored wagon z, and a scene has only one. A wrapper on x composes
  with it instead of fighting it.
- **A scene with no declared park keeps today's behaviour exactly** — switched
  off on strike. That is what keeps the other four productions byte-identical:
  they have no parks, so nothing about them changes.
- **A parked set stays off `WALKABLE`.** You can see the attic in the dock; you
  cannot climb it there, because a set that flies in with a player standing on it
  is a bug with no good ending.
- **The dressings stay switched off.** `bjRedress` is layer-based and must keep
  working: a parked interior shows ONE dressing, not three.

### MEASURED — `tools/parked.js`, with his real models loaded

| set | where it parks | seen from a stalls eye | verdict |
|---|---|---|---|
| attic, bedroom, afterlife, closet, roof | y 10.50, flown, tops 15.63–19.70 vs a grid at 25 | **0 of 1025 rays** | the park already existed; declare it |
| interior | **x −20.80..−7.20, a wing**, at acting depth | 0 | needed a new park — see below |
| house (exterior) | y 10.50..19.40, flown | 0 | had **no park at all**: 20.0% visible |
| cemetery | hills to ±9.5 → x −23.40..23.40 | 8.4% | **cannot park** — see below |
| bare | does not move | 15.1% | no park; it *is* the masking |

**The interior could not park upstage, and it is his own models that decided
it.** `BJ_WAGON_BACK` −10 was measured against the stand-in dressings. His
interior is 12.98m deep, so parked there it measures **z −24.78..−11.80 against
the Palace brick at −21.5 — 3.28m through the back wall, out in the street.**
Invisible today only because a struck set is switched off. And there is no depth
that works: it must clear the backdrop at −10.90 in front and stay downstage of
the brick at −21.5 behind, and 12.98m does not fit between them. **So it tracks
into a wing** (`BJ_HOUSE_PARK_X` −14.0) and the strike puts the wagon back to its
acting offset, which is what takes the brick out of the question.

**The cemetery cannot park, and the ruling has to allow that.** Parted to the
wings it measures x −23.40..23.40 — **wider than the 44m stage**, already 1.40m
past both side walls — and 8.4% of a stalls eye still lands on it. There is no
wing wide enough and it cannot fly, because it is ground rows. It keeps the old
behaviour, and *a set with nowhere to go is a fact about the building, not a bug.*

### What it costs, measured and not assumed

**582,736 triangles** across 54 meshes if all nine stand parked (his models:
interior 280,540, roof 99,568, attic 99,446, exterior 97,920).

**And the pick is where it would have hurt — RULING BY's shape exactly.** One
crosshair ray, 200 calls:

| | from a seat, straight upstage | **from the wings, at the parked house** |
|---|---|---|
| parked with the raycast opt-out | 1.63 ms | **1.11 ms** |
| parked and left pickable | 1.65 ms (1.0×) | **9.23 ms — 8.3×, 83% of a 90Hz frame** |

`layers.disableAll()` was doing **two** jobs — not drawn *and* not raycast — and
BQ only wants the first one back. So a parked mesh gets `raycast = NOOP`, the
trick TRAPS already records for decorative instanced batches, restored only for
meshes this put it on (a decorative batch carries its own deliberately).

Note **where you point is the whole cost**: off-axis the bounding sphere rejects
for nothing, which is why the seat figure barely moves and the wings figure is
8.3×. Walking backstage to look at the parked set is the case BQ *invites*.
Parked sets stay off `WALKABLE`, so `groundAt` never sees them at all.

RULING BY is the precedent — a guess of 0.031ms measured at 4.29ms. The layer
trick being removed is load-bearing, so this needs a number:

- **what is DRAWN from a seat**, and from the wings, parked versus switched off;
- **the raycast cost**, because `layers.disableAll()` was also what kept a struck
  set off every pick and `groundAt` — and his sets are 93k–99.5k triangles each,
  which is the exact shape of the cost that killed BY;
- **whether a park fouls anything** — the brick, the grid, the sky cloth on line
  13, the other parked sets.

A parked set must not go on `WALKABLE`, so `groundAt` is unaffected by
construction. The pick path is the one to watch.

---

## 2b. RULING CE — as few sets fly as possible

> make it so as little sets as posible are flown just like roof and the bedroom
> and closet should eb flown the otheres should come on from the sides or back

Six of the nine flew. He names three that should. `bjFlyWhole` becomes
`bjTrackWhole(sc, axis, out, speed)` and flying is just the **y** case of it —
nothing else about the choreography changes, because `sceneChangeTo` already
drives the `all` mover to its `out` on strike and back to `home` on entry, so a
set that tracks on from stage left is the same machinery pointed sideways.

**And it makes the parking better, which was not the reason for it.** Flying
preserves x and z, so every flown set wants the same volume in the one grid.
Measured, the four that still fly stand *inside each other* there:

```
bedroom x afterlife  overlap 8.62 x 5.60 x 4.61m
afterlife x roof     overlap 12.30 x 7.95 x 8.18m      ... six pairs in all
```

Tracking gives each set its own floor space instead, and **the three tracked sets
each have theirs, with no overlap at all.**

### The building allows exactly three horizontal slots

A wing is 14.5m (`D.stageW` 44 less the 15m proscenium, halved) and there is 6.7m
between the acting area and the brick. So:

| set | where it goes | parked, measured |
|---|---|---|
| interior (13.6m wide) | wing, stage right | x −20.80..−7.20 |
| attic (13.06m wide) | wing, stage left | x 7.47..20.53 |
| exterior (8.6m wide, 8.8m deep) | **upstage** | z −18.07..−9.30 |
| roof, bedroom, closet | flown, as he asked | y 10.50 |
| **netherworld** | **flown — and he did not name it** | y 10.50 |

**The netherworld is the one exception and measurement forced it.** It is 14.4m
wide and 12.5m deep: wider than a whole wing, far too deep to hide upstage, and
both wings are already holding a house. So "as little as possible" comes out at
**four of nine**, not three. His call whether that is close enough.

**One thing left alone deliberately.** The cue at 1:14:30 carries
`move:{scene:'house', off:BJ_SIGN_OUT}` — *"the exterior flies out"*, **his own
plot line**. The exterior now enters and parks upstage, but that cue still flies
it out, because re-pointing a cue he wrote is his call and not a side effect of
this ruling. If CE is meant to supersede that line too, it is one field.

---

## 3. RULINGS BR/BS/BT/BU — the neon proscenium

> thsi si what the neon prosinium should look like and just use this as a
> backdrop for the netherworld. make it so the only times the lights in the neon
> tube are in pre show when it is blue at the start sequec it should be red and
> in the nether world it should be blue. put the blinders inside of the
> prosinium.

**Start from the shelved branch.** `bj-portal` (commit `a22bd36`, RULING AX)
already built the engine and was never opened: `bj:portalFrame` as one merged
mesh on one material, **built dark**, `SHOW.bjPortal` registered in
`showBlank()` so the stage swap parks it, a `portal:{col,lvl}` cue field applied
by `showCueExtras` on **every** cue so a cue that says nothing darkens the frame,
and a fade on the frame `dt` at 1.2/s riding `updateStorm`. That default-dark
behaviour is exactly what "the only times the lights in the neon tube are…"
asks for. **The engine is right and only the plot changes.**

Expect conflicts rebasing it: the split rule in `showCueExtras`, the p5h
repaints, BJ's edits to cues 1.1–1.4, and this round's own p5h/p5i work.

- **BR — the frame is rebuilt to his photographs.** AX built two thin concentric
  tube runs; the photographs read as **broad flat bands with bright edges**.
  Widen it. It must stay inside x ±7.4, because the portal check refuses anything
  scenic wider than the house opening.
- **BS — the tube is lit at exactly three times, dark otherwise:** blue in the
  pre-show, blue from GO, **red at 1:00**, blue in the netherworld, dark
  everywhere else. This takes the red off the eight blinders at GO (see the note
  at the top of this document).
- **BT — the house starts at 0.12 and goes out with the red**, superseding the
  0.30 of RULING BM.
- **BU — the blinders go inside the proscenium**, on the downstage face at
  z = 1.35, above and outboard of the arch. **Check the curtain's z first** — the
  1:16 white flash must still read from a seat, and RULING BJ already took them
  out of 1:03–1:09.

Two constraints from TRAPS that must survive the rebuild: **not `neonTube`** (its
CatmullRom overshoots a right angle — a 12.6m frame came out 14.5m wide and
dipped 0.53m through the deck), and **a material per tube is required**, because
`updateNeon` writes a colour into every registered mesh every frame.

### The one unresolved number, still unresolved

**"1 minute into the audio (not acounting for the 32 seconds or whaterver it
was)"** is read as **`at:60`** — the 1:00 mark of the recording, i.e. do not add
the 35s pre-roll. The alternative (35 + 60 = 95, his 1:35) would put the red
**after** the 1:16 blinder flash and the 1:28 stage-blue, by which point the
opening sequence is over.

**His "the red lights coming on to soon" does not settle it**, because the red he
saw is the blinders at GO (0:35) and both readings are later than that. So `at:60`
stands, and it is one line either way.

---

## What is NOT in this round

- **The lighting cues at the start**, beyond BS and BT above. His call, deferred
  at his instruction.
- **Re-encoding his 181MB of models.** ~70MB is a 4096 normal map that RULING BP
  shrinks to 2048 at load. It rewrites HIS asset, so it stays flagged and untaken.
- **RULING BY**, standing on his geometry. Measured at 4.29ms and deferred; three
  ways out, none free.
- **The graveyard.** He has supplied none and the show opens in it.
