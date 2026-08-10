# BEETLEJUICE, re-timed — the owner's own scene plot

**Date:** 2026-08-10
**Source:** the owner watched the recording and wrote out the set changes
himself, with timestamps. That list is the authority for this round. Where it
disagrees with what #93–#100 built, **the list wins.**

Rulings continue the sequence; the last round ended at **AO**. This one takes
**AP–AU**.

---

## Why this round exists

The fifth show landed with ten scenes and forty-six cues, its scene changes
placed where the *measurement* put them — blackouts found by `tools/video.js`,
plus four covers invented where the recording gave nothing (cues 7, 12, 25,
32.3, each admitting so in its own comment). Those four inventions were flagged
in HANDOFF as "the ones to distrust".

They were right to be distrusted, and so were several of the measured ones: the
owner has now supplied the actual plot. It is not a small correction. Six of
his seventeen set states map onto a built scene; three sets do not exist; one
built set (the crypt) is not in the show at all; and the spine of the evening
moves by as much as nine and a half minutes in places.

**One thing validates the whole exercise.** His act break, `1:11:02`, is second
**4262** — which is exactly `at:4262`, the built act-break cue, taken off the
13.3-second blackout that `blackdetect` found at 71:02. His timestamps and our
measurements share a time base, so every other number he gave can be dropped
straight into `looks[].at` with no offset.

## The plot, as given

Verbatim structure, with each timestamp converted. `up` = flies out, `down` =
flies in — a reading his own list makes unambiguous, because the backdrop is
**in** for every enclosed set (attic, closet) and **out** for every one of the
sliding houses.

### Act one

| # | Time | s | What happens |
|---|---|---|---|
| — | pre-show | — | curtain in, **the BEETLEJUICE sign in**, house open. Holds until START. |
| — | START | — | the opening light sequence; **the sign flies out** at the end of it; main curtain lifts on **the graveyard** |
| 1 | 9:45 | 585 | the graveyard empties — **backdrop alone** |
| 2 | 10:40 | 640 | graveyard backdrop **flies out**; the house **slides on** (Maitlands) |
| 3 | 32:16 | 1936 | the house **slides off** |
| 4 | 32:50 | 1970 | backdrop **flies in**; **the attic** |
| 5 | 42:34 | 2554 | **the closet** |
| 6 | 48:49 | 2929 | **the attic** again |
| 7 | 52:00 | 3120 | **the bedroom** |
| 8 | 56:00 | 3360 | **the roof** |
| 9 | 1:02:51 | 3771 | roof off, backdrop **flies out**, the house **slides on** (Deetz) |
| 10 | 1:11:02 | 4262 | blackout, main curtain in — **end of half** |

### Act two

| # | Time | s | What happens |
|---|---|---|---|
| — | INTERVAL | — | holds until a button on the console |
| — | START | — | the second-half light sequence; curtain lifts on **the outside of the house, sky behind** |
| 11 | 1:14:30 | 4470 | exterior and sky **fly out**; the house **slides on** (Beetlejuice) |
| 12 | 1:25:25 | 5125 | house **slides off**, backdrop **flies in**, **the attic** |
| 13 | 1:30:00 | 5400 | attic off, backdrop **flies out**, the house **slides on** |
| 14 | 1:39:00 | 5940 | house **slides off**, **the netherworld** |
| 15 | 1:53:00 | 6780 | netherworld off, the house **slides on** |
| 16 | 2:13:05 | 7985 | house **slides off**, backdrop **stays out** — **the curtain call** |
| 17 | 2:15:00 | 8100 | **confetti**, curtain in, house lights to half — end |

---

## RULING AP — the wagon is real, and you watch it travel

Asked whether a house that "slides forward" should be seen doing it, the owner
chose **real sliding wagon, seen**, over a change in the dark.

This is the one piece of genuinely new machinery in the round. `sceneShow`
(`p5c.txt:113`) is an instant swap: layers on, layers off. Nothing in the scene
system moves.

**The mechanism is a MOVER on the scene group, not a new kind of scene.** A
scene may carry a travel: an axis, a home offset, a stored offset, a speed. The
frame loop advances it off `dt` — **never `setTimeout`** (the standing rule; the
`follow` chain is the one violation and this round does not add a second). A cue
carries the target offset the same way it already carries a fly snapshot, so the
auto-cue drives the wagon for free.

Consequences that must hold:

- A scene mid-travel is **on**. Its layers stay enabled for the whole move, or
  the house vanishes halfway across the deck.
- Anything walkable on a travelling scene moves with it. `sceneWalk` files the
  objects; the mover translates the group, so this is free — but a test must
  pin it, because "you can stand on a house that has driven out from under you"
  is exactly the class of bug this codebase keeps having.
- A stage swap parks the offset with everything else in `p2k`. A wagon must not
  be found halfway on when you walk back in.
- The travel is **dt-driven and interruptible**: a cue fired during a move
  retargets, it does not queue.

## RULING AQ — one house, three dressings

Asked whether the Maitlands house, the Deetz house and the Beetlejuice house
are three sets, the owner chose **one house, three dressings**.

So there is one built structure on one wagon, and a `dressing` switch changes
what hangs on it: Maitlands plain and lived-in, Deetz pale and redecorated,
Beetlejuice's warped and striped. This is also the cheapest answer by a wide
margin — three separate houses would have pushed the show past ~140 pieces
against the other four shows' 55–114.

The existing `interior` and `redecorated` scenes are the Maitlands and Deetz
dressings respectively; they are **merged into the one house**, not kept as two
scenes. A dressing swap is instant and always happens under a blackout or
behind the backdrop, so it needs no travel of its own.

**The constraint this buys, and it must be written down:** one wagon cannot be
in two states at once. No cue may ask for two dressings simultaneously, and the
plot above never does.

## RULING AR — the show ends at 2:15:00

The owner's last beat is `2:15:00` (8100 s). The recording runs to `2:23:47`,
and Phase 1's measurement located the largest cluster of light bumps — 82 of
them, every 1–3 s — starting at `141:02` (8462 s), which is what the built cue
list used for its curtain call.

Asked which to believe, the owner chose **his own times**. The show therefore
ends at 8100 s and **the measured tail from 8100 onward is dropped**. Cues 34,
35, 36 and 37 as built (call at 8462, blackout at 8615, warmers at 8640, house
up at 8660) are re-anchored onto 7985 and 8100 and the surplus is deleted.

This is a deliberate override of a measurement by the person who watched the
show, and it is recorded as such rather than reconciled quietly. If the tail
ever needs explaining, the 8-minute gap is the open question — but it does not
block anything.

## RULING AS — the sign flies, and there is no crypt

The owner's answer, verbatim:

> "i just forgot to pu the beeltjuice sign witch is down at pre show and then
> goes upi at the end of the start of sho light stuff and i dont know what a
> crypt is but i dont think there is one in the show"

Two decisions in one:

1. **The sign is not a set.** The built `signset` scene is retired. The sign
   becomes a **flying piece that is IN at pre-show and flies OUT at the end of
   the opening light sequence** — before the main curtain lifts.

   It follows that the sign hangs **downstage of the house curtain**, because
   the audience must see it while the curtain is still in. Every lineset lives
   upstage of the plaster line (`makeLineset`, `z = -0.50 - i*0.80`), so there
   is no fly line in front of the curtain and the sign cannot be a good on a
   line. It takes a **Y-axis mover** — the same machinery RULING AP builds for
   the wagon, on a different axis. One mechanism, two uses.

2. **The crypt is cut.** It is not in the show. `sceneAdd('crypt', …)` and its
   three cues come out, and the `sets.js` assertions that pin it come out with
   them.

## RULING AV — AO IS REPEALED. Build it to look like the real thing.

The owner, 2026-08-10, on being shown the sign built to RULING AO:

> "remove the cluase entirely that it has to be our onw shapes. make the sets
> look as close to the real stuff as you can get it"

**RULING AO is withdrawn in full**, for this production only. The scenery is no
longer "the show's vocabulary, not its drawing" — it is modelled on the
production the recording came from, as closely as the tools here allow:
proportions, colours, lettering, the lot. He supplied a photograph of the show
curtain and the marquee and asked for those two to match it.

What this changes in practice:

- The `note:` on `SHOWS.beetlejuice` no longer disclaims copying. It says what
  is true instead — that it is modelled on the production.
- Every comment in `p5h` that says "ours, not theirs" is wrong and comes out.
- The sign says what the real sign says. The cloth carries the real cloth's
  scrollwork.
- The test that pinned AO is rewritten to pin AV. It is not deleted, because
  the ruling it guarded is part of the record.

**The other four shows keep their interpretation note.** AO's repeal is scoped
to Beetlejuice, which is the one taken off a recording and the one the owner
asked about. Nothing in `p5c`, `p5d`, `p5f` or `p5g` is touched.

AO stays in its own spec, marked superseded — a ruling that got reversed is
worth more on the record than one quietly deleted, and this is the first
reversal in the sequence.

## RULING AT — cloths on lines, structures on movers

The round adds flying scenery in two different ways, and the rule for which is
which is physical, not convenient:

- **A cloth flies on a real fly line.** The graveyard backdrop and the sky are
  hung goods with a trim, driven by the fly snapshot every cue already carries.
  Six of the fourteen linesets are free (7, 9–13); the hang uses 0–6 and 8.
  No new machinery at all — this half of "the backdrop lifts" is a trim change.
- **A structure travels on a mover.** The wagon, the sign, and the act-two
  exterior — things with depth that cannot honestly be a drop on a batten.

The act-two exterior is the one judgement call here. The owner wrote that it
"flies out", and it is a built scene, so it goes out on a **Y mover** rather
than being demoted to a painted drop. That keeps the built exterior and does
what he described.

## RULING AU — the two waits are the two GO presses

The owner asked for the pre-show to advance "when you press start" and for the
second half to start "when you press a button on the consol". Both already
exist and cost nothing: a cue with `follow:null` arms nothing, so the chain
stops there until GO is pressed.

**Exactly two cues in the show carry `follow:null`** other than the last one:
the pre-show preset, and the interval. Everything between them auto-follows on
the measured gaps. This is worth stating as a rule because the auto-cue loop
currently fills *every* `follow` from the gap to the next cue and blanks only
the last — it must learn about the two holds.

---

## What this does to the cue list

Forty-six cues exist. Their **fade times and channel levels stay** — those were
measured off held shots and the owner's list says nothing about light. What
changes is **when each cue fires and which scene it names**, plus the covers.

| Built scene | Fate |
|---|---|
| `cemetery` | stays — the graveyard, plus a new **backdrop-alone** state at 9:45 |
| `interior` | becomes the **Maitlands dressing** of the one house |
| `redecorated` | becomes the **Deetz dressing** of the one house |
| — | new: the **Beetlejuice dressing** |
| `attic` | stays; now used **three times** (32:50, 48:49, 1:25:25) |
| `bedroom` | stays, moves 54:23 → 52:00 |
| `crypt` | **deleted** (RULING AS) |
| — | new: **the closet** (42:34) |
| — | new: **the roof** (56:00) |
| `house` (exterior) | stays — act two's opening, and it now flies out |
| `afterlife` | becomes **the netherworld**, re-timed to 1:39–1:53 |
| `signset` | **retired** into the flying sign (RULING AS) |
| `bare` | stays — the curtain call at 2:13:05 |

Net: ten scenes become nine, plus one wagon with three dressings, two flown
cloths, one flying sign, and confetti.

## Confetti

Does not exist. `rain`, `storm`, `fire` and smoke do, and the cue record
already carries `rain` and `fire` fields, so confetti is a fourth effect of the
same family — a burst, not a state, fired once at 2:15:00 and falling under
gravity off `dt`.

## What must not break

- **`follow` still spans the measured evening.** After the re-time the chain
  must still reach 4262 at the act break and 8100 at the end, both asserted.
- **Every change still lands in the dark or behind something** — a blackout, the
  curtain, or the backdrop. Sixteen changes now instead of six; the existing
  test that pins this must grow with them.
- The suite count is 18. Every new assertion is **negative-checked against a
  wrong implementation**, not merely an absent one.
- `SHOWS` is declared in `p5c`; the show lives in `p5h`, appended after `p5g`.
  **`build.sh` is never reordered.**
- A scene that is off keeps its layers disabled — no draw call, no raycast.
  The mover must not defeat that.
