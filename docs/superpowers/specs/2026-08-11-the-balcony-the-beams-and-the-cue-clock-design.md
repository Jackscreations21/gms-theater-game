# The balcony, the beams, and the cue clock — rulings BJ–BO

**Date:** 2026-08-11
**Owner's brief, verbatim:**

> first i still cant see the purple sweeps when im on the balcony and make it
> so in pre show and the start of show light stuff you can see the actual
> beams better. and label each cue not by how long it is but by what timestamp
> in the show it is and make it so if you skip a cue it skips to the correct
> spot in the music

Four asks. The first two are the second headset verdict on the audience rig —
the BF/BG round answered "the blinders arent bright enoug" and "the purple
sweeps at the start are not happening", and half of the second complaint
survived it. The last two are the cue list telling the truth about where in
the show you are standing.

---

## 1. What the probe found, before a line was written

`tools/audience-balcony.js`. It fires the pre-show cue and the 1:03 sweep,
steps them through the frame loop, and measures the light actually arriving at
a head on all three levels — the same shape of probe that turned the BF round,
and it turned this one too.

### The pre-show drift barely touches the balcony, and half of it is outside the building

The first version of this section said "exactly zero", off a single frame, and
it was **wrong** — a slow drift sampled at one instant tells you nothing about
a slow drift, which is the "measure the right thing" trap in TRAPS wearing a
new hat. Over a full 40-second cycle, the truth:

| seat | share of a cycle in the drift | peak |
|---|---|---|
| stalls z=16 | 20% | 1.00 |
| stalls z=24 | 41% | 1.56 |
| mezz z=18 | 35% | 2.11 |
| **BALCONY z=26** | **12%** | 1.02 |
| **BALCONY z=29** | **7%** | 0.91 |

Seven per cent of forty seconds is **three seconds in forty** at the back of
the balcony. That is what "i still cant see the purple sweeps" looks like when
you measure it, and it is a much more useful number than a zero would have
been, because it says the effect is not absent — it is *rare*.

And a large part of the reason is that a third of the effect is not in the
room at all. Two of the six beam tips landed at **x = 22.0**, where the side
wall stands at 15, and **z = 37.8**, where the back wall is at 30. The
wander's **±62° pan** throws the drift through the brick.

The probe (`tools/audience-balcony.js`) reports peak and share per seat, and
splits the light by which kind of audience unit emitted it — see §3 for why
that second part turned out to matter more than the first.

### At 1:03 the purple holds no real light AT ALL — anywhere

```
26-33  BLINDER 1-8    lvl 0.85  rank 0.90   holds a real light: YES  (all 8)
34-39  AUD MOVER 1-6  lvl 0.75  rank 0.80   holds a real light:  -   (all 6)
audience units LIT: 14      holding a real light: 8      (reserve 2, pool 8)
```

**RULING BG's reserve is a ceiling on the audience rig as a whole, and the
blinders are audience units too.** They outrank the movers — 0.85 × 0.9 =
0.765 against 0.75 × 0.8 = 0.60 — so the reserve's two slots go to blinders,
the remaining six go to blinders, and the purple sweep renders on **zero** real
lights. In a headset the cap is four and it is still four blinders and no
movers.

So what the owner saw at 1:03 was the red flash. The purple was beam cone only,
and beam cone at that moment is `uHaze = 0.25 + 0.20×1.15 = 0.48` — see §4.

**This is BG working exactly as written and still being wrong.** The reserve
was built to stop the *stage* starving the audience rig. Nobody asked what
happens when the audience rig starves itself, because in the BF round no cue
had both groups up at once. Two do.

---

## 2. RULING BJ — the two purple sweeps are the movers ALONE

**Owner's ruling, this session, asked because it changes his plot:** at 1:03
the eight blinders **drop out entirely**. Purple movers alone in a black house.

His sheet:

> From 1:03 to 1:05 have all the lights that are in the audience area be purple
> and sweep up then at 1:05 they go dark (make sure the beetljuice sign still
> stays lit up red).

"All the lights that are in the audience area" includes the eight round the
arch; the thing that stays red is **the sign**, and the sign is `signCol`, not
the blinders.

**And the labels already said so while the looks did not.** Q1.2 is labelled
*"1:05 — the house goes dark, the sign stays red"* and its look is
`all(0); set(BLIND, 0.85, '#ff1e10')` — eight red lamps pointed at the audience
in a cue whose own name says the house is dark. Same for Q1.4, *"1:09 — dark
again"*. "At 1:05 they go dark" is his line and it covers the blinders, so:

| Cue | at | Was | Becomes |
|---|---|---|---|
| Q1 | 0:35 | arch red 0.85 | **unchanged** — his red opening statement |
| Q1.1 | 1:03 | arch red + movers purple | movers purple, **arch out** |
| Q1.2 | 1:05 | arch red 0.85 | **all out**; the sign stays red |
| Q1.3 | 1:06 | arch red + movers purple | movers purple, **arch out** |
| Q1.4 | 1:09 | arch red 0.85 | **all out**; the sign stays red |
| Q1.5 | 1:16 | blinders flash white | **unchanged** |

The red arch is now a 28-second opening statement (0:35–1:03), then purple
sweeps in a black house, then the white flash. That is his paragraph read
straight through.

**Q1.2 and Q1.4 were not separately ruled on** — he ruled on 1:03. They follow
from "at 1:05 they go dark" plus the ruling that the blinders are audience-area
lights, and the alternative is the arch coming back red for **one second**
between two sweeps. Recorded here so it is not rediscovered as a bug.

## 3. RULING BK — a sweep sweeps UP

The effect currently runs `tilt = -84 + 74u`, and because
`head.rotation.x = (tilt + 90)°` that is **6° below horizontal at u=0 to 80°
below at u=1**: it sweeps *down*, ending pointed at the stalls floor. The name
of the field was going up; the light was going down.

His words are "sweep up", and reversing it is the same change that puts the
sweep on the balcony — it now travels from the stalls floor, up the rake,
across the mezzanine and balcony fronts, and out over the balcony heads.
Confirmed by the owner this session.

The top of the travel must pass **above** horizontal, because a balcony head is
above the lens: from the upstage bar at (0, 17.1, 19) to a head at (0, 17.85,
26) is **6.1° above**. A real moving head tilts well past horizontal, and
nothing in the code clamps `tiltT`.

The pre-show **wander** gets two changes, and **a negative check had to teach
which one does what** — the first draft of this spec credited the wrong one:

| change | what it actually buys |
|---|---|
| pan **±62° → ±34°** | **the balcony.** Back row 7% of a cycle → **56%**. The old pan was not spreading the effect round the house, it was spraying a third of it through the side wall. |
| tilt **−62±24 → −55±42** | **the stalls.** Once the pan is reined in, the narrow tilt band leaves the drift working the upper house and skipping the lower: stalls 20% of a cycle → **80%**. |

Both are needed and they are not doing the same job. The way this was found is
worth keeping: the tilt mutation was run against the balcony assertion and
**sailed straight through**, which under TRAPS reads as "the assertion is
weak" — and the assertion *was* weak, but strengthening it revealed that the
tilt was never the balcony's fix in the first place. Two different findings
with the same symptom, again.

### And the measured result of BJ + BK + BL together

Purple — only light emitted by an audience **mover**, which is the question —
arriving at a balcony head:

| | before | after |
|---|---|---|
| the 1:03 sweep, balcony, flat | **0.000, 0% of the cue** | **5.93 peak, 37%** |
| the 1:03 sweep, balcony, headset | **0.000, 0%** | **3.97 peak** |
| the pre-show drift, back of balcony | 0.91 peak, 7% of a cycle | 0.94 peak, **57%** |
| the pre-show drift, stalls | 1.00 peak, 20% | 1.04 peak, **80%** |

## 4. RULING BL — the reserve DIVIDES the audience rig

`AUD_LIGHT_RESERVE` stays a ceiling and never becomes a floor — RULING BG is
right about that and is not being reopened. What changes is that the reserve is
shared out **per audience group** rather than first-come by rank, so the eight
blinders can never take the whole share and leave the six movers dark.

The invariant BG exists to protect is untouched: the audience rig as a whole
still never holds more than `AUD_LIGHT_RESERVE` of the pool, still claims
nothing when it is dark, and still cannot pull a light off a lit stage.

## 5. RULING BM — the pre-show and the top of the show carry enough haze to see a beam

A beam is drawn at `uHaze = 0.25 + hazeNow() × 1.15`, so the plotted haze is
most of what decides whether a beam reads:

| Where | plotted haze | uHaze | against a mid-show beam |
|---|---|---|---|
| pre-show (Q0.5) | 0.15 | **0.42** | **40%** |
| the top, Q1–Q1.4 | 0.20 | 0.48 | 46% |
| Q1.5–Q1.7 | 0.25–0.30 | 0.54–0.60 | 51%–57% |
| the graveyard (Q2) | 0.60 | 0.94 | 89% |
| mid-show typical | 0.55–0.70 | 0.88–1.06 | 100% |

**The stretch the owner is complaining about carries the least haze in the
entire 94-cue plot** — and it is the one stretch that is nothing *but* beams,
because the curtain is in and there is no stage picture to light. The show's
own blurb is "more haze than air".

These numbers are OURS, not his: his four text files say nothing about haze
anywhere. Raising them is a free retune of an invented value, not an
overruling of anything he wrote.

## 6. RULING BN — a cue is labelled by where it falls in the show

> label each cue not by how long it is but by what timestamp in the show it is

Both cue lists print `c.fade + 's'` — the DOM one in `refreshCues` (p6) and the
VR one in `vrPageCues` (p9). They print `c.at` as **h:mm:ss** instead.

**A cue with no `at` keeps the fade.** That is every cue in four of the five
productions, and every cue anyone ever records off the board with RECORD LIVE
STATE — they have no place in a show to be labelled by. Same bargain `signCol`
and `lobby` make: the field decides, and saying nothing leaves it alone.

## 7. RULING BO — a cue you jump to takes the music with it

> make it so if you skip a cue it skips to the correct spot in the music

Today a jump desynchronises the show. Jump **forward** to a cue at 5000 while
the track is at 100 and the lights snap to that look while the transport sits
and waits eighty minutes for the music to catch up. Jump **backward** and the
transport rush-fires every cue in between at 40 a frame.

So: **an operator jump seeks the show track to that cue's `at`.** Which half of
the recording that lands in is `audPlay`'s problem and nobody else's — RULING
BI already made the plot blind to the split, and this rides the same
arithmetic.

Two constraints, both load-bearing:

- **It must NOT live inside `fireCue`.** `showAudioTick` calls `fireCue`, and a
  seek there would feed the transport its own output every frame. It goes in
  the operator paths — `go`, `goBack`, the DOM row handlers, the VR row tap and
  the VR GO/BACK/TOP buttons — and nowhere else.
- **A cue carrying its own `audio` field has already spoken.** The four cues
  that name a track — the pre-show, the top of the show, the interval, and act
  two's GO — say exactly what they want and the jump must not argue. This
  matters most at the interval, whose cue deliberately stops act one and starts
  the pre-show music: seeking the show track there would resume the show under
  the interval. Third outing for the `signCol` bargain.

## 8. RULING BP — the model budget rises to 150k, and the house is three houses

The owner delivered seven `.glb` files this session. Measured against the
budgets before anything else happened:

| file | tris | budget 30,000 |
|---|---|---|
| attic | 1,086,932 | 36× |
| beetlejuice sign | 177,804 | 6× |
| house ×3 (identical geometry, three textures) | 1,896,362 each | 63× |
| house exterior | 1,877,378 | 63× |
| roof | 1,883,794 | 63× |

Everything else about them is already right: `.glb`, embedded 2048² textures,
**one material each**, no lights, no animations, no cameras. Only the triangle
count is out, and it is out by one to two orders of magnitude.

**Two rulings, both the owner's, this session:**

- **The triangle budget goes to 150,000**, and he re-exports at ~100k. 30,000
  was set for the Quest and it is conservative for a mesh with **one
  material**: the cost that actually hurts a Quest is draw calls and per-pixel
  light, and each of these sets is a single draw call. One 100k set on the
  stage at a time is a very different proposition from 100k of scenery spread
  over twenty materials. The other budgets do not move.
- **The house is three whole houses, not a shell plus three dressings.** He
  built it that way and it is his call. So `bj-house.glb` +
  `bj-dress-{maitland,deetz,beetlejuice}.glb` — four entries — become three,
  each replacing the whole interior, and `bjRedress` swaps which one is up
  instead of swapping a dressing on a shared shell.

`docs/MODELING.md`'s File column is the contract and a test pins it to the
manifest in both directions, so that table moves with the manifest or the suite
says so. **The bedroom and closet keep their stand-ins** — his note reads "just
use what you are currently using for it" — and **the sign is his model with our
lamps on it**: "you just have to add the lights".

Still to come from him: the graveyard and the netherworld.

## 9. RULING BQ — a set that comes off is never gone

> make it so when i set comes off it is never gone it is always somewhere
> backstage

Today `sceneApply(sc, false)` makes a struck set **cease to exist**: invisible,
`layers.disableAll()` on every descendant, walkables pulled off `WALKABLE`. It
is why seven configurations are affordable — an off scene costs no draw call
and no raycast — and it is also, in a theatre you can walk around, wrong. Sets
do not evaporate; they go to the dock and the wings and stand there for the
rest of the run.

So a struck set **travels to a park position backstage and stays there, solid
and visible**, and the stage is empty because the set is somewhere else rather
than because it has been switched off.

Three things this has to answer, and each is a test:

- **Where.** A park per scene per stage, inside the stage house — the Palace
  has a dock, both Arc houses have their own. It must be expressed relative to
  the stage, because "every stage is the same box" and a hardcoded z is the
  trap TRAPS already records under *move a building and its furniture stays*.
- **What it costs.** This is the real risk and it is a headset risk, so it gets
  measured, not assumed: seven sets standing in the dock instead of one on the
  deck. `p2i`'s room culling and the frustum should carry most of it — a set in
  the dock is behind the stage house wall — but the layer trick was load-bearing
  and removing it needs a number, not a hope. `tools/census.js` counts meshes;
  a new probe should count what is actually *drawn* from a seat and from the
  wings.
- **What you can stand on.** A parked set stays off `WALKABLE`. You can see the
  attic in the dock; you cannot climb it there, because a set that flies in
  with a player standing on it is a bug with no good ending.

---

## What is NOT in this round, and why

- **The house floor pool** (STATE item 3) stays deferred. With the sweep
  travelling up the house and the movers guaranteed a share of the pool, the
  reason to build it may not survive the next headset run.
- **The patch stays at 39 channels.** Covering the balcony with light rather
  than with aim would mean new fixtures on the balcony rail, which renumbers
  nothing (they append) but does change the patch count on all three stages and
  costs real lights in a headset that only hands out four. Aim is free; try aim
  first.
- **`AUD_STROBE_HZ` stays at 9.** Unchanged and for the unchanged reason.
