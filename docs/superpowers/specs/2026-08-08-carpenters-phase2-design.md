# The carpenters, phase 2 — a build list, doors and windows, and the skin as a choice

**Date:** 2026-08-08 (the same day the carpenters round landed, straight
off the headset run that followed it)
**Source:** the owner's asks, verbatim:

1. "make ti so you can have them build multiple thigns at once"
2. "add morethins for them to build like flats with door holes cut in
   it and a flat with a window hol cut in it"
3. "make it so woth the flats you can have them build it with or
   without the sheets on it"
4. "also it wont let me rotate stuff once it is built"

Shaping answers, given live: the batch is **a build list worked in
order**, the list **stacks on the one mark**, and the skin is **a
SKIN ON/OFF switch**, not extra catalogue rows.

Four PRs, sequential (they share p6c, p6b and p9). Rulings continue the
sequence; the carpenters round ended at AC.

---

## What this is

The carpenters build one thing per CALL, lying flat at one crayon mark,
always skinned. This round makes the call a **list**, adds two flats
with openings in them, lets you order the bare frame instead of the
skinned flat, and fixes the thing that makes all of it useless: **a
finished assembly cannot be turned over.**

Everything still goes through the functions the player's own hands use
(`regWood`, `seatWood`/`sawSetCut`/`sawCut`, `addNail`/`asmAdopt`), so
the work stays ordinary bodies and assemblies and rides the build save
with no new save code. That constraint is not negotiable and it shapes
every decision below.

## The trap this round is built around

**A held assembly has no orientation.** `vrHold`'s `asm` branch
(`src/p9.txt:2517-2532`) copies `position` and nothing else — the
root's quaternion is never written. Loose wood got the grip-relative
carry in build-feel #53 (`src/p9.txt:2368-2374`: `relQ` off the
controller, the grabbed point kept in the palm) and the 45° grid with
HOLD-X to free it; the `asm` hold got neither, because #53 only ever
touched `kind:'body'`.

The carpenters assemble lying flat on the deck (RULING AC). So every
flat they have ever built is lying face-up on the deck permanently: you
can slide it around and you can never stand it up. The owner found this
in the headset within minutes of the round landing. A flat you cannot
raise is not scenery, and door and window flats would ship the same
defect on day one — so this is PR 1, before any catalogue work.

---

## The rulings

### RULING AD — a built assembly turns in the hand, exactly as a plank does

The `asm` hold takes the carry a single piece already has: the pose is
kept relative to the **controller** (RULING R) about the point you
grabbed, and it squares to the 45° grid on all three axes with HOLD-X
to free it (RULING M). Tip a flat up, it snaps upright; set it down.

`snapAsm` (`src/p4c.txt:665`) is **unchanged** and still offers only
the drop — a deck or pipe under the work, `dy` only, never a
re-orientation. The hand decides which way the work faces; the snap
decides where it rests. An anchored assembly still refuses the grab
("nailed down — the hammer first"), and a one-nail piece still swings
on its pivot instead: this ruling touches only the free-assembly hold.

### RULING AE — a hole is FRAMED, never cut

A sheet can never have a hole in it. Wood is parametric — one shared
unit `BoxGeometry` scaled per body (`src/p4c.txt:38-47`) — and the
build spec forbids a cut ever minting geometry. So an opening is made
the way a real flat is made: **framed** with jambs, a header and (for a
window) a sill, and **skinned in pieces around the opening**.

The saws already do everything this needs. A sheet body carries
`dims {L, W}`, `seatWood` reads which axis the hand offered
(`src/p4c.txt:865-872`) and `sawCut` writes the surviving dimension
either way (`src/p4c.txt:1040`) — the player can already rip a sheet.
Only the **carpenter's schedule** cannot ask for it: `carpCut` forces
every sheet to seat `'L'` so the schedule's lengths mean what they say
(`src/p6b.txt:536-544`). So a cut entry gains an axis, and that block
presents the sheet turned when the entry says `'W'`. Nothing else
changes, and the player's saws are untouched.

**Both new rows, on the inch grid** (4'0" wide × 8'0" tall, the
existing flat's frame):

- **4x8 DOOR FLAT** — a 30" × 80" opening. Two jamb studs land on the
  opening edges, 9" in from each side; a 41" header crosses at 80"
  (the same 41" cut the plain flat's rails already use). Skin: one 48"
  × 16" panel over the opening, crosscut; two 9" × 80" strips beside
  it, ripped. The 30" × 80" centre panel is a real off-cut and goes
  back to the shed as stock — it is not scrap.
- **4x8 WINDOW FLAT** — a 30" × 36" opening with its sill 36" up. A
  41" sill at 36" and a 41" header at 72", two 36" jambs between them.
  Skin: a 48" × 36" panel below the sill, a 48" × 24" panel above the
  head, two 9" × 36" strips beside the opening.

Both skins come out of **one sheet each**, which is the check that the
cut schedules are honest: the door flat crosscuts 16" off, then rips
two 9" strips, leaving a 30" × 80" panel; the window flat crosscuts 36"
and 24" off, then rips the remainder into two 9" strips and a 30" × 36"
panel. Both leftovers are stock, not scrap.

Both openings are **holes**, as asked: no door leaf, no glazing, no
hardware.

### RULING AF — the skin is a switch, not a row

**SKIN ON/OFF** is one control on the CARPENTERS screen and applies to
whichever flat is picked. OFF drops the sheet pieces from the
blueprint, the nails that fasten them, and the sheets from the stock
list — so a frame's NEED line asks for lumber only, and its piece count
against `BUILD_CAP` falls accordingly. The catalogue stays five rows.

The switch is a property of the **call**, not of the row: it is passed
into `carpPlan` and never stored on `CARP_CAT`, which stays pure data.
It reads only on rows that declare themselves skinnable — the three
flats. The platform's deck and the 2-STEP UNIT's treads are sheet too,
but they are structure rather than skin: those rows ignore the switch
and build the same either way.

### RULING AG — one CALL takes a LIST, and the list stacks on the one mark

The screen carries a count per row. CALL plans **every** item in one
go and runs them as one queue, in list order, one piece at a time — the
crew engine and the lead are untouched; it is a longer queue, not a
concurrent one.

**RULING Z still stands: one mark.** Items stack on it, the way a crew
really stacks flats: each item's blueprint is lifted by the total
height already standing at the mark, so item two lands on item one.
`restH` already carries a stack (the settle cannot see wood under
wood), which is why this costs nothing at the physics end. Every item
is still its own un-anchored assembly (RULING AC): you peel them off
the top one at a time — and with RULING AD you can turn each one as you
take it.

### RULING AH — the whole list is judged before a single cut

`carpPlan` stays pure and grows a list form. The NEED list **sums
across every item** and is reported once; `BUILD_CAP` is checked
against the pieces the **whole list** will mint, not each item in turn
(extending RULING Y). A list that would overrun the cap is refused
whole with PIECES FULL — the crew never starts a list it cannot
finish, and never leaves half a flat on the deck because the cap fell
in the middle of it.

---

## The screen

The CARPENTERS glass is hit-by-meaning — every region carries META on
its hit record and no test pins it by pixel (RULING X) — so it can be
relaid out freely. Five rows at a tighter pitch, a count with `+`/`−`
per row, a SKIN switch and one CALL on the footer, the live verdict off
the pure planner as today. The ORDER screen beside it is pixel-pinned
by tests and is **not touched**.

Refusals keep their spec order and wording, with the list summed:
PICK A PIECE / NO MARK / MARK IS IN THE OTHER HOUSE / CREW BUSY /
NEED 2× SHEET · 7× 2x4 / PIECES FULL.

## What this round does NOT do

- No door leaf, glazing or hardware in the openings — holes only.
- No concurrent building: one queue, worked in order.
- No skinning a frame that already stands (that would need the
  carpenters to add to an existing assembly; it is a round of its own).
- No second mark, and no change to RULING Z.
- No change to the player's own saws, snap, or nail gun.

## Testing

`tests/carp.js` (the planner and the run) and `tests/vr.js` (the hold):

- a carried assembly rotates with the grip and squares to 45°, and
  HOLD-X frees it — driven through the real hold, not the model;
- an anchored assembly still refuses the grab, and a one-nail piece
  still swings rather than carrying;
- a ripped sheet: the schedule asks for `'W'`, the lead seats it that
  way, and the piece that comes off is 9" wide and full length;
- SKIN OFF: the plan drops the sheet pieces and their nails, the NEED
  line asks for lumber only, and the built frame is one rigid assembly
  with the right piece count;
- the list: summed NEED, the cap refused for the list as a whole at
  its boundary, stack heights that put item two on top of item one;
- end to end through the glass: a list of a door flat and a window
  flat, called once, both standing stacked at the mark, un-anchored
  and grabbable — and the save round trip through a second world.

Every new assertion negative-checked against the pre-change build, as
ever; suites green before and after each PR.

## The PRs

1. **`carp2-turn`** — RULING AD: the `asm` hold takes the plank's
   carry. Carries this spec.
2. **`carp2-rip`** — RULING AE's mechanism: a cut entry names its
   axis; `carpCut` presents the sheet accordingly.
3. **`carp2-openings`** — the DOOR FLAT and WINDOW FLAT rows, and the
   SKIN switch through the planner (RULINGS AE + AF).
4. **`carp2-list`** — counts on the glass, the summed plan, the stack
   at the mark, one CALL (RULINGS AG + AH).

Linear chain, one at a time: each branch cut after its parent merges,
rebased onto fresh `main`, rebuilt and green before it opens.
