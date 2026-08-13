# ONE HOUSE, THE TRAFFIC PLAN, AND THE GOLD LINE — design

2026-08-13. Rulings **CN–CY**, continuing from CM.

He watched the parked-sets round and came back with eleven things in one
message. Nine of them are one subject: **where every set comes from and where
it stands when it is off** — which is a traffic plan, and traffic plans have to
be settled all at once or the sets stand inside each other. The other two are
the neon and the blinders.

His message, whole, because the order in it is his:

> Make it so only one house exist in the world at a time and it switches
> between them when needed. Make it so no matter what they are always stored
> behind the backdrop and never anywher else. Also make it so they are the only
> one that can come in from behind the backdrop. Make the attic come i n from
> one of the sides. Make the roof nethereworld and house exterior flown. Make
> the bedroom and the closet come in from one side. But make the house exterior
> and roof set really thin to fit up in the fly area. Also make it so the lights
> on the bj sign turn off when it goes up. Make a menu to control what sets are
> on and add the beetlejuice sign to the fly menu. The neon proscenium should be
> basically where the gold is right now but the top is straitgs and slaantted
> down and it does not go across the floor. Remove the body for the blinders
> just maek it basically comu out of the neon thing.

**THIS REVISES RULING CE, WHICH IS HIS OWN AND ONLY A DAY OLD.** CE said "as few
sets fly as possible" and routed the exterior to a wing and the attic upstage;
he has now looked at the result and re-cut it. Where the two disagree, this
document wins, and CE stays on the record with the parts of it that survive
(bjTrackWhole, and flying being the y case of tracking) called out below.

---

## The measurement this whole round turns on

`tools/parked.js`, his models loaded, before any of this:

| set | acting box (x / y / z) | where it parks today |
|---|---|---|
| interior | 13.60 × 12.76 × 12.98 | stage left, x 7.20..20.80 |
| house (exterior) | 8.64 × 8.90 × 8.77 | stage right, x −17.82..−9.18 |
| attic | 13.06 × 6.30 × 10.00 | upstage, z −19.10..−9.10 |
| roof | 12.30 × 7.95 × 10.00 | flown, y 10.50..18.45 |
| afterlife | 14.40 × 9.20 × 6.90 | flown, y 10.50..19.70 |
| bedroom | 8.62 × 5.60 × 4.61 | flown, y 10.50..16.10 |
| closet | 9.02 × 5.60 × 4.61 | flown, y 10.50..16.10 |
| cemetery | 46.80 wide | **no park** — wider than the stage |

The room: picture 13.6 × 9.2, stage 44 × 17, grid 25, **Palace brick −25.5**,
the backdrop on line 14 at **z −10.90**, the flyman's locking rail at **x
−19.2**, the side walls at **x ±22**.

---

## RULING CN — only one house is in the world at a time

> "Make it so only one house exist in the world at a time and it switches
> between them when needed."

**RULING AQ already says this and the code does not do it.** AQ built one room
with three dressings that take turns; `bjRedress` turns the other two off by
clearing their layers, which stops them drawing and stops them being picked —
and leaves them **in the world**. That was a fair trade when a dressing was a
few hundred triangles of our own furniture. RULING BP then made each dressing a
**whole 93k-triangle house of his**, and the probe above measures the result:

```
  interior      280,540 tris     3 meshes
```

Three complete houses standing in the same 13.6m of stage, two of them switched
off inside the third. He has looked at that and said what he wants.

**A dressing that is not up is DETACHED from the scene graph**, not merely
darkened — `sc.group.remove(g)`, held on the scene's own record, and
`sc.group.add(g)` again when it is called. The three.js object survives whole,
so a swap costs one add and one remove and no re-fetch.

**IT IS NOT A DISPOSE.** Freeing the buffers would mean re-fetching a 27MB file
every time the plot changes dressing — nine times an evening, over the wifi that
already makes 165MB take minutes. "In the world" is the scene graph, and that is
what this ruling reads it as.

The layer work stays exactly as it is. It is what makes a dressing inert **while
it is attached**, which is still the state a dressing is in for the frame
between the two calls, and it is the guard that catches a detach that failed.

---

## RULING CO — a house is stored behind the backdrop, and nowhere else

> "Make it so no matter what they are always stored behind the backdrop and
> never anywher else."

The wagon parks **stage left** today, at `BJ_HOUSE_PARK_X` 14.0. That was RULING
BQ's choice and its own comment says why it was not upstage:

> His interior is 12.98m deep and there is NO upstage offset that works: it must
> clear the backdrop at z −10.90 in front of it and stay downstage of the brick
> at −21.5 behind it, and 12.98m does not fit between them.

**That was true when it was written and RULING CL made it false.** CL took
`PAL_BACK` from −21.5 to −25.5 for an unrelated reason — his house was standing
3.28m out in the street at the curtain call — and the gap between the backdrop
and the brick went from **10.60m to 14.60m**. His 12.98m room fits inside it
with 1.62m to spare.

**And the offset it fits at is the one the wagon already has.** The wagon's own
`home` is `BJ_WAGON_BACK` −10.0, and at that offset:

| | z at offset −10.0 | clear of the backdrop at −10.90 | clear of the brick at −25.5 |
|---|---|---|---|
| his interior | −24.78 .. −11.80 | 0.90m | 0.72m |
| the stand-in | −19.24 .. −11.56 | 0.66m | 6.26m |

Both fit. The window on the offset is **−10.72 .. −9.10** for his model, and
−10.0 sits inside it — so this ruling is a change of *which mover parks the
house*, not a new number.

So: `scenePark(inr, undefined, …, {mvAt: BJ_WAGON_BACK})` — the park drives the
wagon's own z mover upstage on a strike and declares nothing else.
`BJ_HOUSE_PARK_X` goes, and stage left goes with it, which is what pays for
RULING CQ.

---

## RULING CP — upstage is the house's door, and only the house's

> "Also make it so they are the only one that can come in from behind the
> backdrop."

One set breaks this today: **the attic**, which RULING CE routed upstage
(`BJ_ATTIC_BACK` −8.8) precisely because both wings were full. CO empties a
wing, so the reason has gone.

This is a rule about **entrances**, not about storage: nothing else may travel
on z through the backdrop line. A set standing in a wing at a deeper z is beside
the backdrop, not behind it, and RULING CS uses that.

**Declared, never assumed** — as everywhere else in this file, the other four
productions are untouched, and a test states the rule over the Beetlejuice
scenes rather than over the engine.

---

## RULING CQ — the attic takes a wing

> "Make the attic come i n from one of the sides."

Stage **LEFT** (+x), the wing CO just emptied. It is his choice of side to make
and he left it open ("one of the sides"), so it is measured:

- the attic is **13.06m** wide (his) against a **12.4m** stand-in;
- a 13.06m set parked stage right would reach the flyman's **locking rail at
  x −19.2** — the exact fault RULING CE found and fixed once already;
- stage left the wall is at +22 and there is no rail.

`BJ_ATTIC_SIDE` **+13.9**: his attic parks at x 7.37..20.43 — 0.57m outside the
picture edge at 6.8, behind the legs that start masking at 6.6, and 1.57m off
the wall. The stand-in parks at 7.70..20.10.

`bjTrackWhole(att, 'z', …)` becomes `bjTrackWhole(att, 'x', …)`. That is the
whole change, and it is the part of RULING CE that survives intact: flying is
the y case, a wing is the x case, and the machinery does not care.

---

## RULING CR — the exterior flies again

> "Make the roof nethereworld and house exterior flown."

The roof and the netherworld already fly. The exterior does not: CE tracked it
into the stage-right wing off his own earlier line, *"make the extiriot go out
towards the side of the stage with the fly rale."*

**He has superseded himself, and the earlier line is the one that was already
flagged.** The exterior carries a whole-group **y** mover (`sceneTravel(hse,
'y', 0, BJ_FLY_SPEED)`), and the plot's cue at 1:14:30 has always flown it out —
CE's own comment says it left that alone deliberately and marked it FLAGGED:

> if CE is meant to supersede that line too, it is one field in one cue.

It is. `bjTrackWhole(hse, 'x', …)` goes, and the exterior parks on the mover it
already has: `scenePark(hse, undefined, …, {mv: BJ_PART_OUT})`.

And it frees stage right, which is what pays for RULING CS.

---

## RULING CS — the bedroom and the closet share a wing

> "Make the bedroom and the closet come in from one side."

Stage **RIGHT** (−x), the wing CR just emptied, and the two of them are the
reason this ruling needed measuring rather than choosing:

| | width | the wing |
|---|---|---|
| bedroom | 8.62m | |
| closet | 9.02m | |
| **together, side by side** | **17.64m** | **14.5m** |

**They do not fit abreast, and no number makes them.** So they stand one behind
the other, which is how a real wing is packed:

- both track in on **x** at `BJ_SIDE_ROOM` **−11.6** — bedroom x −15.91..−7.29,
  closet x −16.11..−7.09. Both clear the picture edge at −6.8, both clear the
  locking rail at −19.2 by 3.1m.
- the closet additionally parks **upstage within the wing** on its own group,
  `BJ_CLOSET_BACK` **−6.0**: z −14.71..−10.10 against the bedroom's
  −8.31..−3.70. **No overlap on z, so no overlap at all.**

That second mover is free: `sceneTravelPart` writes one axis and nothing else,
and the wrapper carries x while the group carries z — the same two-movers-one-
scene trick the wagon already uses (`scenePark`'s own comment), pointed the
other way.

**AND IT IS NOT AN ENTRANCE FROM UPSTAGE.** The closet comes in from the side,
as he asked; the depth offset only says where in that wing it stands. RULING CP
is about travel through the backdrop line inside the picture, and x −16..−7 is
9m outside it.

---

## RULING CT — a flown set is thin

> "But make the house exterior and roof set really thin to fit up in the fly
> area."

He is right and the measurement is embarrassing:

| flown | depth today |
|---|---|
| the roof | **10.00m** |
| the exterior | **8.77m** |
| the netherworld | 6.90m (RULING BV, already squashed once) |

A 10m-deep set does not hang on a batten. It is the same fault BV fixed for the
netherworld and the same fix: **squash the recession about the downstage face,
which does not move**, so the picture starts where it always started and simply
does not reach as far upstage.

`BJ_THIN` **0.28** — the roof goes 10.00m → **2.80m**, the exterior 8.77m →
**2.46m**.

**BOTH THE STAND-IN AND HIS MODEL.** The stand-in is the bigger case and the one
that plays on a fresh clone, over slow wifi, and **in every suite, because jsdom
fetches nothing** — thinning only the imported model would leave this ruling
untestable in the only place anything tests. The stand-in roof goes from a 5.0m
deck to a 1.4m one; a 1.4m deep roof you can stand on is a thin flown piece,
which is what he asked for, and RULING BY already means his roof is not
standable at all while his file is in.

**AND IT BUYS BACK THE FLY TOWER.** The three flown sets all want the same
volume today — the probe reports the pairs — because flying preserves x and z.
Thin, they can hang at different depths like real battens do, so each takes a
`park` z of its own and the tower stops being a pile. That is stated here as the
payoff, and it is measured in the PR rather than asserted: if they still foul,
the numbers move, not the ruling.

---

## RULING CU — the marquee goes dark as it flies

> "Also make it so the lights on the bj sign turn off when it goes up."

The sign is an ALWAYS scene on its own y mover (RULINGS AS, AT); it goes out at
`BJ_SIGN_OUT` 9.0 at the end of the opening sequence, and its lamps burn all
night up in the grid.

A **gate** on the lamps, riding the sign's own mover offset and the frame `dt`
— never a timer:

- lit while the sign is home (offset under 0.05m), out above it;
- the gate travels at `BJ_SIGN_LAMP_FADE` per second, so the lights go out
  *while it rises* rather than snapping;
- it multiplies `emissiveIntensity`, so **the `signCol` cue state survives
  underneath it.** A cue that turned the sign red keeps it red; the sign simply
  is not lit while it is up, and comes back red if it comes back in.

`setSignLamps` therefore records what the cue asked for instead of writing final
values, and one applier writes the product. An imported material with no
emissive at all (RULING CF guards for it) gates on `color` toward black
instead — the one thing a MeshBasic can do.

---

## RULING CV — a menu for the sets

> "Make a menu to control what sets are on…"

**The desk already has one** — `#sceneList` on the SETS page, every non-ALWAYS
scene, click to change to it. **The headset does not.** `VR_TABS` is CUES,
LIGHTS, FLY RAIL, SHOWS, VENUES, SMOKE, SCRIPT, and he plays this show on a
Quest. So this is a VR page, built the way the fly page is built: one row per
scene, the live one marked, a touch changes to it through `sceneChangeTo` so the
change is choreographed exactly as a cue's would be.

It says **where each set is**, not just which is on, because RULING BQ made that
a real question: ON, or standing in the wing / upstage / flown. That is the
thing the menu is actually for now.

---

## RULING CW — the sign is on the fly rail

> "…and add the beetlejuice sign to the fly menu."

The sign is **not a lineset and cannot be one**: every lineset lives upstage of
the plaster line (`makeLineset`: z = −0.50 − i·0.80) and the sign hangs
downstage of the house curtain. RULINGS AS and AT settled that and it does not
move.

So the fly rail grows a place for **a haul that is not a lineset**: the show
declares `SHOW.flyExtras`, one entry naming the scene, its in and out offsets
and a label, and the fly page (desk **and** headset) draws them at the foot of
the column, below the numbered lines — the same place RULING CM put START OF
SHOW, and for the same reason: **the numbered rows are pinned by pixel in
`tests/vr.js` and that has been a trap twice.**

Declared, never assumed: a show with no `flyExtras` draws exactly what it draws
today.

---

## RULING CX — the neon takes the gold's line

> "The neon proscenium should be basically where the gold is right now but the
> top is straitgs and slaantted down and it does not go across the floor."

Where the gold is, measured off `p2b`'s `proscenium()`:

```
  the moulded band     x ±7.75      y 0.20 → 8.60 (the springing)
                       z 1.26       then an arc to y 10.375 at the centre
```

Against RULING CH's frame, one day old: a closed rectangle **13.60m** across at
**x ±6.80**, y 0 → 9.20, z 0.75, **with a sill on the deck**.

Three changes, and they are his three:

1. **OUT TO THE GOLD.** Legs at `BJ_NEON_X` **±7.75**, z `BJ_NEON_GOLD_Z`
   **1.26** — on the architectural proscenium, not inside the scenic one.
2. **A STRAIGHT TOP, RAKED ONE WAY.** The gold's arc is a quadratic that peaks at
   **y 10.375**. It was first built as two chords from (±7.75, 8.60) meeting at
   (0, 10.375) — straight, and slanting down to each side, which is what the arch
   does — and the other reading of that sentence was flagged here as open.

   **He corrected it:** *"can you make it slanted just one way not from the
   center."* So it is **one bar right across**, from (+7.75, 8.60) to (−7.75,
   10.375): the two heights are still the arch's, and the shape is a rake rather
   than an arch. The legs are consequently different heights. It leans down
   toward **stage left**, the way the marquee's own arrow rakes; `BJ_NEON_RAKE`
   mirrors it and the blinders follow the same line.
3. **NO SILL.** The bottom bar goes. Nothing crosses the deck.

**THIS BREAKS AN ASSERTION AND THE ASSERTION IS REVERSED IN PLACE** — the
AO/AV/BA/BI/BZ precedent, sixth time. `tests/beetlejuice.js` refuses anything
scenic outside x ±7.4, which is right and stays right: **scenery** wider than
the picture is a fault. The neon at his instruction is no longer scenery inside
the picture — it is the house's own proscenium, lit — so it is named as the
exception and the rule keeps its teeth for everything else.

The engine does not move: one merged mesh, one material, built dark, driven by
the `portal:{col,lvl}` field on every cue, faded on the frame `dt`. **Not
`neonTube`** (its CatmullRom overshoots a right angle) and **one material here
because `updatePortal` writes one colour into one material** — both scars, both
still binding.

---

## RULING CY — the blinders have no body

> "Remove the body for the blinders just maek it basically comu out of the neon
> thing."

RULING CH moved the eight blinders inside the frame (x ±6.2, top row y 8.5) and
he has watched eight lantern boxes hanging in his picture.

- `bodyBlinder()` builds **no geometry** — the point stays, the beam stays, the
  lens glow stays, and there is nothing to look at between them.
- the eight points move **onto the frame**: two per leg at x ±7.75, four along
  the slanted top, all at the neon's own z 1.26, so the light leaves the bar.

**What it costs, stated rather than discovered:** a body with no mesh cannot be
raycast, so a blinder can no longer be taken off its point and carried. Nothing
in the plot or the crew does that, and the point/patch/level path is untouched —
but it is a real capability spent, and one line (`BLIND_BODY`) puts it back.

**It moves them in all five productions**, exactly as CH did, and for the same
reason: this is a rig change, and the rig is shared. Two named constants undo
it.

---

## The plan — six PRs, one concern each, linear

| PR | Ruling | What |
|---|---|---|
| 1 | CO CP CQ CR CS | the traffic plan: where every set comes from and stands |
| 2 | CT | a flown set is thin, and the tower stops being a pile |
| 3 | CN | one house in the world |
| 4 | CU | the marquee goes dark as it flies |
| 5 | CV CW | the two menus |
| 6 | CX CY | the neon on the gold, the blinders out of it |

PR 1 is first because every other park depends on which wing is free. PR 2
follows it because the flown parks are only worth measuring once the exterior is
flown again.

**Every park is measured with `tools/parked.js`, not chosen** — the probe
already answers "does it foul", "do they collide", "can a stalls eye see it",
and it got four things wrong before it got them right, which is written into its
own header.
