# The audience rig that lights the audience, the lobby, and the split track — design

**Date:** 2026-08-11
**Source:** the owner, after the first headset run of the sound-and-plot round
(#121–#123):

> the blinders arent bright enoug. its not doing the purple light seewps at the
> start. make sure the lobby lights get turned of at the start of a show too.
> and for the audio being to big. audio number one is small enought to fit. and
> can you just split the bugger audio in half one for each half but make sure
> the cues still line up

**Rulings:** BF, BG, BH, BI (continuing from BE). **BF amends BC. BI amends BA.**

---

## 0. The measurement that shaped this round

The first two complaints look like two bugs. They are one, and a probe found it
before a line was written — the TRAPS advice working as written again.

**The purple sweep is not broken. It runs.** Stepping four seconds of the
pre-show cue through the frame loop:

```
AUD MOVER 1  before: {pan:0,    tilt:-64,   col:#2fbf5f, lvl:0.55}
AUD MOVER 1  after 4s: {pan:45.6, tilt:-42.9, col:#7e3fbe, lvl:0.55}
```

Pan swings, tilt lifts, green crossfades to purple. RULING BD's engine does
exactly what it says. What happens next is the whole of this round:

| | wins a real light? | floor pool? |
|---|---|---|
| the 6 audience movers, pre-show | **2 of 6** (0 in a headset) | none, ever |
| the 8 blinders, the 1:16 flash | 8 of 8, at intensity **0.866** each | none, ever |
| one FOH lantern at **45%** | yes | — at intensity **1.364** |

So eight blinders at "as bright as posible" are each **36% dimmer than a single
front-of-house lantern at less than half**, and two thirds of the purple sweep
is a beam with nothing at the end of it. In a headset it is worse: `VR.lightCap`
is 4, the six FOH units take all four, and the audience rig gets **nothing at
all**.

**Neither complaint is about the plot, the colours or the timing.** Both are
about the same thing: the audience rig cannot put light on the audience.

---

## 1. RULING BF — rank and brightness are two different numbers

`power` has been doing two jobs since the rig was built:

```js
_active.sort((a,b)=> (b._lvl*b.power) - (a._lvl*a.power));   // WHO gets a light
l.intensity = f._lvl * f.power * (…);                        // HOW BRIGHT it is
```

RULING BC set the blinders to `power 0.9` for the first of those jobs, and gave
a good reason: *"a blinder that outranked a stage lantern would pull a real
light off the stage at the exact moment the stage matters."* That reason is
still correct. But the same number then capped how bright a blinder is allowed
to be, and nobody noticed, because nothing in this repo can see.

**So the two jobs get two numbers.** `rank` decides who is handed one of the
eight real lights; `power` decides how bright that light burns. `rank` defaults
to `power`, so all 25 stage channels and both Arc houses are unchanged to the
byte.

| | rank (was power) | power (new) |
|---|---|---|
| blinder | 0.9 — unchanged, still under every stage lantern | **4.6** |
| audience mover | 0.8 — unchanged | **2.8** |

**BC's mechanism survives intact and is still testable in its own words:** no
audience unit at any level ever *outranks* a stage lantern. What changes here
is only what happens once it has a light. (BC's *effect* is then amended — but
by RULING BG below, deliberately and to a stated ceiling of two, not by this
one. The two rulings are separate on purpose: BF alone would leave the purple
sweep exactly as dark as the owner found it.)

4.6 is above the followspot's 4.2 on purpose. A blinder is a 66° flood at 38m;
a profile is 8° of the same intensity landing on a body. A wide unit needs more
power to read as bright, not less — and "as bright as posible" is the owner's
own phrase for this cue.

## 2. RULING BG — the audience rig is guaranteed a share of the pool

Raising `power` fixes the flash, because at 1:16 the blinders are the only
thing lit and already take all eight. It does **not** fix the purple sweep,
where six movers compete with six FOH lanterns for eight lights and lose four
of them — all of them, in a headset.

`AUD_LIGHT_RESERVE = 2`. Of the pool (8 flat, `VR.lightCap` in a session), up
to two go to the highest-ranked fixtures aimed **into the house**, whenever any
such fixture is lit at all. The rest of the pool is handed out exactly as
before.

Three things make this cheap rather than a tax on the stage:

- **It only bites when the audience rig is lit**, which across 94 cues is the
  pre-show, four cues at the top of the show, and two moments in act two. Every
  other cue in the plot sets `all(0)` and then names stage channels, so the
  reserve claims nothing and the stage keeps all eight.
- **It is a ceiling, not a floor.** Two, never three, however many are lit.
- **It costs no new lights.** The pool is the same size it has always been;
  this is only who stands in it.

`f.audience` is the flag, set by the two audience-rig builders in `buildRig`.
One flag, one meaning (§5): *this unit is aimed into the house.*

**What this deliberately does NOT do** is give the four unreserved movers
anything to land on. The floor pool is clipped to the stage box (`p4`), so a
lantern aimed at the seating paints nothing on them — a purple decal crawling
over the stalls would finish the picture and cost no per-pixel light, which is
the right shape for a Quest. It is left out of this round because it needs a
seating-floor model per venue (the Palace rakes linearly through
`houseFloorY`; each Arc house carries a stepped `H.rake`), and because with two
real lights at 2.8 landing on the seats it may simply not be needed. **This is
the first thing to build if the headset says the sweep still reads thin**, and
it is written down here so the next session does not have to rediscover it.

## 3. RULING BH — the front of house goes out when the show starts

`HOUSE.lobby` has been 0.9 since the beginning and **no cue in any of the five
shows has ever carried a lobby field**, so the foyer burns through every
performance. A cue may now say `lobby:`, and:

- **saying nothing leaves it alone.** `undefined` is not `0`. Four shows and
  every hand-recorded cue keep the behaviour they have, which is the same
  bargain `signCol` already makes with the sign.
- it parks and restores per stage, because `HOUSE` is already per-stage state
  in `p2k` and `lobby` is already one of its fields.

In the Beetlejuice plot: **up at the pre-show** (the audience is still coming
in), **out at GO**, **up again at the interval**, **out again for act two**.

**Scoped to the Palace foyer, on purpose.** The Arc's foyer is a different
circuit (`ARC.house`, driven by `setArcHouse`) and it is **shared between two
auditoria** — dimming it because one house went up would black out the other
house's front of house mid-interval. A shared foyer answering one show's cue
stack is a decision, not an oversight, and it is not this round's to make.

## 4. RULING BI — the show track is two files, and it is committed

**This amends RULING BA, and the owner made the call after being shown the
three reasons behind it.** The record keeps BA rather than deleting it, the way
AO was kept when AV repealed it.

BA gave three independent reasons the recordings could not be committed. The
owner's instruction removes the first and overrules the other two:

1. ~~**It is not possible.** 134 MB against GitHub's 100 MB hard limit.~~
   **Gone.** Split at the act break the halves are **69.4 MB and 70.1 MB**, and
   `preshow.mp3` is 42 MB. All three are under the limit. (All three are over
   GitHub's 50 MB *warning* threshold; a warning is not a refusal.)
2. **Off a video** — TRAPS: *"Nothing off a video is ever committed."*
   **Overruled by the owner for this repo's own recordings.** The rule stands
   for frames and clips; the line moves for the audio he supplied.
3. **A commercial recording on a repo with Pages on.** **The owner's call**,
   made with the fact in front of him: git history is permanent, so the ~180 MB
   is in every clone from here on even if the files are later removed, and
   Pages serves them from a public URL.

**The split point is free, and that is what makes "the cues still line up"
true.** The track is stopped at **4269** by the act-break cue and resumed at
**4292** by the act-two cue, so nothing between those is ever heard. Cutting at
**4292.000** exactly:

```
act1  0 → 4292.023   69,413,206 bytes
act2  4292.000 → end  70,104,528 bytes
(4292.023 + 4334.794 = 8626.817 against a whole of 8626.794 — a 23 ms overlap,
 one AAC frame, inside the stretch that is never played)
```

**Not one timestamp in the plot changes.** Every `at` stays a position in the
whole recording, exactly as RULING BB made it, and each manifest entry carries
the `offset` at which its file begins:

```js
act1: {file:'act1.m4a', offset:0,    clock:true, …}
act2: {file:'act2.m4a', offset:4292, clock:true, …}
```

- the transport's clock is `offset + el.currentTime` — so a cue at 5000 fires
  when act2 is 708 seconds in, and BB's "absolute timecode, nothing drifts"
  holds across the join;
- `audPlay(key, at)` seeks to `at - offset`, so `{play:'act2', at:4292}` seeks
  to 0.0 — the act-two cue asks for the same number it always did;
- **`clock:true` is what makes a track the cue clock**, replacing the hardcoded
  `AUD.tracks.show`. Whichever clock track is really playing drives the stack;
  the pre-show track never can, which is what it means for it to be
  underscore rather than the show.

The silent fallback is untouched and still total. A missing file is still a
normal state, still logged once, still runs the `follow` chain.

---

## 5. What this round does not touch

- The plot. Not one colour, level, fade or timestamp of the owner's 94 cues.
- RULING BB. The transport is generalised over two files; its rule is the same.
- RULING BD/BE. The pattern engine was never the fault.
- The 25 stage channels, the other four shows, and both Arc houses — `rank`
  defaults to `power` and no cue outside Beetlejuice says `lobby`.
- `AUD_STROBE_HZ` stays at 9. Blinders getting five times brighter is a
  reason to be **more** careful about the photosensitive band, not less.

## 6. What only the headset can answer, after this

1. **Is 4.6 now too much?** Eight blinders at full, a metre from the face, five
   times the light they had. This is the one change in the round that could
   hurt, and it is one constant.
2. **Does the purple sweep read with two real lights and four beams**, or does
   it want the house floor pool of §2?
3. **Does the foyer going out at GO read from a seat**, or only from the door?
4. **Does the join sound?** Act two resumes at 4292 from a different file. The
   suites cannot hear it.
