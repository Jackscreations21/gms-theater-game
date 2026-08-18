# FUTURE — the book of things to build

**This is where an idea lives before it is code.**

`STATE.md` is where things stand *right now*. `HANDOFF.md` is the durable
record of what has *already been done*. **This file is the other direction:**
anything Jack wants built, sketched well enough that a session can pick it up
cold and start, plus whatever is mid-build and paused.

Write an idea in here the moment you have it. A one-line idea is worth
recording; it can be grown into a real spec later. Nothing in here is a
commitment and nothing in here is binding — **a spec in
`docs/superpowers/specs/` is binding, this is not.**

---

## How something in here becomes code

```
   an idea in FUTURE.md          ← rough. one line is fine.
        ↓  Jack says do it, and answers the open questions
   docs/superpowers/specs/YYYY-MM-DD-<name>-design.md
                                 ← BINDING. lettered RULINGS. read before code.
        ↓
   docs/superpowers/plans/YYYY-MM-DD-<name>-prsN-M.md
                                 ← one concern per PR, in order
        ↓
   a linear chain of PRs to main ← never stacked; each rebased on fresh main
        ↓
   STATE.md + HANDOFF.md updated, entry deleted from here
```

The lettered rulings are one continuous sequence across the whole project.
**The last one BUILT is `FD`; `FE`–`FW` are RULED AND RESERVED (see below), so
the next spec starts at `FX`.** `FD` was Art-Net: `docs/ARTNET.md` remade as a
grouped patch sheet — it supersedes `FA` and keeps the generation, ruled and
built 2026-08-16, merged as #214. Before it, `FC` put the proscenium neon on four channels —
intensity and RGB — ruled a LIGHT rather than scenery, so it has no takeover
byte and a dead universe blacks it along with the 39 lanterns; ruled and built
2026-08-16 as #213. Before those: `FB` raised `ART_STALE` 2s → 5s after
the first real QLC+ desk was measured idling at ~1.8s between packets, `EZ`
moved the Beetlejuice sign onto two fly channels, and `FA` made
`docs/ARTNET.md` a flat one-line-per-channel list — all the same day.
**`EY` — the band channels on a dead universe — is ruled and NOT built; see
PART 1a item 4.**

**`FE`–`FW` are RESERVED by the Maker Pen round**
(`docs/superpowers/specs/2026-08-17-maker-pen-design.md`, ruled 2026-08-17,
being built now — a Rec Room style building pen alongside the wood system,
plus a props shelf and Circuits). **The next spec after that one starts at
`FX`.** Ruled and reserved is not built: check the spec's own phase list and
STATE.md before assuming any of FE–FW is in the code.

When something in here ships, **delete it from this file** — this is a list of
what is *not* done. It stops being useful the moment it becomes a history.

---
---

# PART 1 — LIVE: the GMS Studios round (PAUSED mid-round)

**Paused 2026-08-14 at Jack's word.** Three PRs merged, two branches in
flight, three PRs never started.

- **Binding spec:** `docs/superpowers/specs/2026-08-14-gms-studios-design.md`
  — **RULINGS DZ–EK**. Read it before touching any of this.
- **`main` was `ce1de31` when this round paused**, with a suite count of 20
  (`tests/studios.js` was new). Both have moved since — the Art-Net round took
  `main` well past it and the suite to **21** — so **rebase and re-count before
  trusting either of the two in-flight branches below.**
- **Cache-bust is `?v=31`** from here. `?v=30` was allocated by the Art-Net
  round and never loaded on hardware, so nothing is cached under it; `?v=31`
  is simply the next unused value. Nothing in THIS round has been on a headset.
  **Bump before judging any of it there.**

## The brief, verbatim, because the round is answering it

> add a movie and game show studio with 2 floors and a warhouse. the first
> building is for tv shows and game shows and officses. and the warehouse is
> for filming movies. make it so in the areas for tv shows it has bars on the
> celling and you can hang lights from them and in the ware house make it so
> you can lower them like the fly sytem. make it so you can order differnt
> lights to hang. make it have the building sytem like the stages

> make it have 4 tv show spacses in the main building on the first floor. and
> offises on the second floor. and then one big warehouse space. and dont have
> prebuilt sets in any off them just make it have the same building ssytem as
> the theater.

> [starting rig] Empty — nothing at all hung
> [build shop] A separate shed behind the complex

> also add a lader you can order and climb up and carry

**The two halves of the brief are deliberately two different mechanisms**, and
this is the thing most likely to be wrongly "simplified" later. A television
studio's bars are welded to the ceiling and you climb to them (RULINGS DZ +
EK). A film stage's bars **fly** and you bring them down to you. That is why
the ladder matters in the studios and not in the warehouse.

## ✅ DONE — merged and verified

Each merged only after: two-stage review, `main` rebuilding **byte-identical**,
full suite green **on the merged result**, branch deleted local and remote.

**PR #194 — the venue shell** (`src/p2n.txt`, 53 KB)
`STU` at x = −420, hung off `scene` not `world`. Four studios from **one
builder run four times** (`SS`: W 20, DEPTH 16, CEIL 7.4, GRID 5.2, PITCH 22;
centres `STU_CX = [−33, −11, 11, 33]`). A floor of offices at `SS.OFF_Y` 5.0
with a stair. The warehouse film-stage shell (`SW`: 60 × 46 × 18, grid 14, out
trim 12.4) — **bars not built, that is PR 4**. The yard, eight cull rooms,
work light per room, a bed that leaves the light loop, nine doors each with an
`[E]` control, views 21–28. `tests/studios.js`, 22 assertions.

**PR #195 — three lights to order** (RULING EG)
`soft` SOFTLIGHT, `panel` LED PANEL, `hmi` HMI FRESNEL. **Three draws each**,
which is what a par can costs; `tools/draws.js` unchanged at 580 drawables /
294 per eye.

**PR #196 — the stepladder** (RULING EK)
Ordered on HDWE, carried as a body, climbed **by being walkable** — no
climbing code added. 3.90 m overall, six treads at 0.44, platform 3.05. **It
is what sets `SS.GRID` to 5.2.**

## ⏸ IN FLIGHT — two branches, paused, NOT merged

Both based on `359e212` (**before** #195 and #196) and therefore need
**rebasing and a seam check** before they go near `main`. **Do not assume
either is complete — they were interrupted.**

### `gms-studio-grids` — PR 3, commit `71a675d`, **NOT ready to merge**

The ceiling bars, the empty hanging points (RULING EB), the four studio boards.
**20/20 on its own build**, tree clean, rebuilds byte-identical. Four new
assertions, each negative-checked with the mutation proved present in the BUILT
file and proved to move its sha. *(One mutation left the byte count identical at
1539949 — the hash caught it. **Byte count is not a check.**)*

**Why it is not ready:** five designed assertions in `tests/stages.js` were never
written — `stageAt` across every room plus the keep-the-board walk, the empty
rail through the DOM, the per-studio work master, `FOHBAR`/`SPKBARS` null on a
studio board, `stageOrigin`/`stageDeck` naming the studio. The behaviour is
implemented and was exercised by hand, **but it is only pinned indirectly.**
Next step: append that block after the last `P(...)` in `tests/stages.js` and
negative-check each.

Two *existing* assertions were **edited**, not added, so they carry no negative
check: `stages.js` "there are three of them" → seven, and `beetlejuice.js`
"39 channels on every board" now names the three theatre boards instead of
walking `Object.keys(STAGES)`. **Review both by eye before merging** — the
second was also leaving the board parked on a studio when it threw, taking 60
further cases down with it.

**What it built:** 5 bars on 3 m centres × 5 points on 4 m centres = 25 points a
studio, 100 across the venue; bars 17 m in a 20 m room; lanterns hang 0.35 m
under the pipe at `SS.GRID` 5.2; bars merged 13 tubes to one mesh, cached across
all four studios. **`DY_CEIL` did not move** — still 320, still 294 draws/eye,
scene still 580 drawables.

**Rebase notes:** `src/p2n.txt` **untouched**. `src/p4.txt` is ONE hunk (the
`_sx/_sz` init at the top of `updateRig`) — **#195's `DIFFUSE_FIX`/`GLOW_Z` work
is in that same function, so expect a conflict there.** `src/p4c.txt` two hunks,
not near `removeBody`, so #196 is textually clean. `src/p2k.txt` is the bulk.

### `gms-studios-shed` — PR 2, commit `bd16a56`, **COMPLETE**

The full concern, not WIP. `SHEDS.studio`, `CARTS.studio`, `LIFTS.studio`,
`TRASH.studio`, `SAWS.studio` (track + chop), `RACKS.studio` (+ roller),
`ORDERS.studio`; racking (32 slots), forklift, 4 painted pallet slots in the
shed plus 2 in the film-stage wings, the wall order screen with all four tabs;
`venueRoot('studio')` → `STU.group`; every cap on the studio's own book.
Footprint x 34…58, z −76…−36 as the spec's plan says.

**20/20 green**, tree clean, rebuilds byte-identical. **Nine new assertions,
sixteen mutations**, each proved to land in the BUILT file (mutant present,
original absent, sha moved) and each restore proved byte-identical back to
clean. The cap mutations deliberately aim at the **mechanism** rather than the
constant — mutating `ORDER_MAX` proves nothing, because the test reads the
constant out of the build.

**Two things to review first:**

1. **It modifies PR 1's warehouse wall, and had to.** The spec's x 34 is four
   metres off the film stage's flank at x 30, so there is no shared wall to
   punch. The opening is cut through the film stage's own stage-left flank *in
   `p2n`, where that wall is built* (`SW_SHED_DOOR` names z/W/H/key once, both
   files read it), with a floored and roofed **link bay** between. `stuBounds`
   gained a clause for the bay — the film stage's walkable stops at 29.5 and
   the shed's starts at 34.4, so without it the door opens onto three metres of
   nothing.
2. **The link slab runs wall-centre to wall-centre, not the clear span.** Cut
   to the clear span it leaves a strip of nothing *under* each wall and the
   ground probe drops through — in the one place the player must cross. Its own
   test caught this (`floor@33.75`).

**One existing assertion was moved:** `tests/studios.js` "the shell holds you
in" probed `STU.X + SW.W/2 + 6` as *"through the film stage flank"*. **That
point is shed floor now.** It moved to the stage-**right** flank, which still
means what it meant, and the new block tests the stage-left flank away from the
doorway. Coverage is not lost, but see it with your own eyes.

**Known to break on rebase:** its `orders.js` O1 asserts exactly **6**
minus/plus buttons on GEAR with hit rects at `x===300`/`x===440`, `w===56`.
**#195 makes that 9 at `x===340`/`x===460`, `w===40`** — whatever #195 did to
the existing screen test needs doing to this one. Files touched: `p2n` (the
flank + `SW_SHED_DOOR` + the bounds clause), `p2m` (biggest diff; `venueOX()`
replaces six copies of the venue-offset ternary), `p4` (`venueRoot` only),
`p4c` (three `var` lines — **`var TRASH` sits directly above `removeBody`,
which #196 changed: likely conflict**), `p9`, `p7` (view 29).

### Both

Rebase, rebuild (**do not trust a clean text-merge of `the-house.html`**),
seam-check, review, merge — in that order.

## ⬜ NOT STARTED

**PR 4 — the film stage flies** (RULING DZ). His words: *"in the ware house
make it so you can lower them like the fly sytem"*. Ten linesets through
**`p3`'s own `makeLineset`** into the `stuFilm` stage's `flyGroup` — same
`flyTo` / `updateFly` / `minTrimOf`, same desktop haul, same VR rope.
`SW.BARS` 10 and `SW.OUT` 12.4 are already declared in `p2n` and unused,
waiting for it. **The goods palette here is not the theatre's** — `GOODS` is a
receiving-house stock list (house curtains, legs, borders, a cyc); a film
stage's pipes carry lanterns and whatever you nail to them. Offer `pipe` and
`electric` and stop. *Depends on PR 3.*

**PR 7 — VR** (RULING EJ). **A venue with no VR is a venue Jack cannot
visit** — the Quest is where this game is actually played. At parity with the
Arc: the venue in the travel list and the wrist zone line, the shed's order
screen as a VR panel, the rope on the film stage's ten bars, the desks.

**PR 8 — the record.** `STATE.md`, `HANDOFF.md`'s Done block, `docs/guide/`
(ARCHITECTURE's part table needs `p2n`; BUILD-SYSTEM needs the third shed),
and **`TRAPS.md`** — which is owed the entries in Part 3 below. That file only
earns its keep if it grows.

## 🥽 The headset run this round is waiting on

Nothing here has been seen on hardware. jsdom has no eyes and no GPU.

1. **Does the ladder actually get you to the grid, with a lantern in one
   hand?** 5.2 m is derived from the ladder's reach *on paper*, and paper has
   no arms. **The most important thing to try** — if it fails, the brief
   fails. Climb, clamp a lantern, get down. Watch the platform edge and
   whether the clamp is above comfortable hand height.
2. **Does an empty studio read as a room, or as a void?** Four bare boxes with
   work light and nothing hung is a deliberate choice (RULING EA), and the one
   most likely to feel wrong.
3. **Do ten flown bars in a 60 m room read as a fly system?** The Palace's
   fourteen sit in a 15 m opening; the same rail across 60 m may read sparse.
4. **The draw cost of a third venue.** Switched off when you are elsewhere, so
   the frame should not notice — but the boot does. `tools/draws.js`, and the
   wrist meter's `calls · tri` in each new room.

---
---

# PART 1a — SEVEN LISTED, **SIX** STILL WRONG ON `main` RIGHT NOW

**Item 3 is FIXED — it merged as #218 on 2026-08-17.** It keeps its number and
its place until the Maker Pen round's record commit, because STATE.md cites
these items BY NUMBER ("PART 1a item 4", 5, 6, 7) and renumbering here before
STATE.md is rewritten would leave it pointing at the wrong things. The record
commit removes item 3 and renumbers all three places together. **So the
heading says seven listed and six live, and the two numbers are both true.**

Six of the seven are **live in merged code**. Three came
out of the paused GMS Studios branches — this heading said "two" while it
already carried three, and then said "four" while it carried five, which is
why the number is supposed to be checked against the list before this file is
saved. **It was not, twice more:** the heading then read "SIX" over a body
that opened "All five", and the closing "suggested order" paragraph called
item 5 a flake when the flake is item 6. Both are corrected here, and the
count is now stated in three places that must agree — heading, first
sentence, and the closing paragraph. Item 4 came out of the Art-Net round's
own review and is **RULED but deliberately not built**; item 6 is a test flake
rather than a bug in the game, and is here because it will otherwise be
diagnosed from scratch; item 7 is latent rather than live.

## 1. The venue's work lights all share ONE material — the shared-material trap

**This is a defect in PR #194 and it is mine.** `p2n`'s `MAT.workLamp` is a
single `MeshBasicMaterial` used behind **every** work light in GMS Studios —
all four studios, reception, the offices and the warehouse — and `updateStu`
does `g.mesh.material.color.copy(g.base).multiplyScalar(k)` once per glow
entry. Last write wins, so every fitting in the venue reads back whichever
room was tinted last.

**RULING EH's per-room masters cannot actually reach the fittings.** It is
INVARIANTS' named trap — *shared materials are never tinted in place* — which
has now bitten four times (`M.serge`/`M.velour`, `LENSM`, `WOODM`, this).

**It is invisible today** only because every room still falls back to the venue
level (the studio stages do not exist until PR 3 lands). **The moment PR 3
lands with per-studio work masters, this goes wrong on screen.** Fix it before
or with PR 3.

The Arc does not have this bug: `p2j` mints a fresh `MeshBasicMaterial` inline
at each fitting. The shed branch dodged it by minting its own lamp material
rather than joining the pile. The fix is to give each glow entry its own
material — or to drive the tint per-material rather than per-mesh.

## 2. The order and carpenter screens never reach `envTrack` — in any venue

`vrBuildOrderScreens` runs **after** `envRecollect`, so its two materials per
screen stay unhooked: four in the Palace's `world` today, plus two under
`STU.group` once the studio screen is built. They render with the fog and the
grade **bypassed rather than broken**, which is the silent failure INVARIANTS
describes.

**And it is a tripwire under the new suite:** `tests/studios.js`'s RULING EI
assertion passes only because that suite never calls `vrBuildOrderScreens`.
**The day anything calls it at boot, that assertion goes red for a
pre-existing reason** — and whoever sees it will go looking in the wrong place.

## 3. A bug that eats saves, found by the grids branch

**This is not a studio problem and it should probably be lifted out into a PR
of its own, ahead of the rest of the round.**

`p7`'s boot runs **one eager frame before `buildLoad()`**, and that frame runs
`buildTick`. So anything that marks the save dirty during construction gets its
**empty world flushed over the player's saved build**, moments before
`buildLoad` goes to read it — and the load then faithfully restores the nothing
it just wrote. Every piece of wood the player had built is gone.

It has been latent since the save shipped, because **nothing at boot had ever
called `buildDirty`**. The grids branch called it 100 times (through
`removeBody`, stripping each grid point per RULING EB) and the trap sprang
immediately: `build.js` and `carp.js` both fell over with *"the nailed pair
never returned"*.

**LANDED as #218** — lifted out of `gms-studio-grids` into a PR of its own,
which is what the "Decide" below asked for. `buildTick` refuses to write until
`buildLoad` has been called, whatever it found (`var _saveReadDone` in `p4c` —
renamed from the branch's `_buildLoaded`, which sat two letters from the
existing `_buildLoading` that `buildLoad` also sets). **This item stays on the
list, with its number, until the record commit rewrites STATE.md** — item
numbers here are cited by STATE.md, so renumbering before that would leave it
pointing at the wrong things.

**Decide:** cherry-pick it into its own PR now, or let it ride with PR 3. It
belongs in `TRAPS.md` either way.

---

## 4. A dead universe still redresses the house — RULING EY, ruled and NOT built

**HALF OF THIS IS ALREADY FIXED.** As first written this item was about the
BEETLEJUICE SIGN, which a dead universe hauled 11.36m to the deck in full
view. **RULING EZ retired that** on 2026-08-16 by moving the sign off a band
and onto a target/speed pair — a speed byte of 0 parks it, so an unpatched
desk cannot touch the sign at all. What is left is channel 307.

**Binding ruling:** `docs/superpowers/specs/2026-08-15-artnet-control-design.md`,
RULING EY. Jack ruled the fix and ruled that it waits — *"Don't fix it — just
record it."* This entry is the work.

`artBands` writes channel 307 on a band **change** only, and `ART.houseBand`
starts at **-1**. A change from -1 is a change. So the **first frame of an
unpatched universe reads band 0 and acts on it**: band 0 is the Maitlands
house, so 512 zeros redress whichever house is standing. A dress swap rather
than a move, and band 0 is also the load default, so usually a no-op — but it
is the same mechanism, and "usually" is doing real work in that sentence.

*(The sign was the other half and was the serious one — 11.356m of world
travel from its UP stop, in full view. RULING EZ fixed it by giving the sign a
speed byte, which is what a banded channel does not have. That is also the
shape of the fix here, if a fourth way of saying "0 means nobody is driving
this" is ever wanted.)*

**This is the same collision for the third time in one round**: RULING EQ gave
the flys a speed byte; channel 309 was parked by its own lineset's speed byte
after an unpatched desk ran the house curtain shut in front of the audience;
RULING EX made byte 0 "no command" on the set movers. The bands were the only
ones left, and they were left **because nobody had measured them**.

**IT WAS HIDDEN BY CASE ORDERING, and that lesson is the part worth keeping**
even though the case that carried it is gone. The round's safety case for the
sign — `tests/artnet.js`, *"a scene the RAIL hauls takes no mover channel at
all"* — called `deskOn()`, which delivers a frame, which established band 0,
**before** it put the sign on its stop; so its 120 measured frames were a
no-change band and it passed. The assertion written to prove the sign safe was
the thing concealing the hole. **That reproduction no longer fires**, because
RULING EZ took the sign off the band entirely — moving `deskOn()` now changes
nothing, and anyone who tries it as a check on this item will wrongly conclude
the item is imaginary. The lesson lives in `docs/guide/TRAPS.md`; only 307 is
left here, and 307 has no equivalent case to reorder.

**The fix:** byte 0 on a band channel is NO COMMAND, exactly as RULING EX made
it on a mover channel and RULING EZ made it on the sign's speed. Band 307
becomes 1–85 / 86–170 / 171–255, and `ART.houseBand` stays at -1 so the first
real command still registers as a change. It costs one byte off the bottom of
Jack's stated 0–85 band — the same price EX, EQ and EZ all paid.

**The negative check** is a Beetlejuice loaded on the deetz or bj house, then a
dead desk connected: against today's `main` the house must snap back to the
Maitlands on the first frame, and after the fix it must not. Regenerate
`docs/ARTNET.md` afterwards — it measures 307 by driving it, so the map moves
with the fix.

---

## 5. Two more numbers sized off Art-Net's NOMINAL rate, both still live — found by RULING FB

RULING FB fixed `ART_STALE` after a real QLC+ was measured idling at ~1.8s
between packets. **Two other constants were sized off the same wrong
assumption and are unchanged**, deliberately — one concern per PR, and each
wants its own ruling. Recorded here because a flag that lives only in a PR
description is not a record.

**`ART_PROVE` (`src/p6d.txt`).** Its comment says *"a desk sends ~44 frames a
second, so this is about a second of real traffic"*. At the measured idle
cadence, 44 packets is about **79 seconds**, and `ART.got` resets per socket —
so a fresh socket needs ~79 idle seconds before the backoff ladder resets.
**It is less bad than that sounds and the note should say so:** `ART.step` is
also reset by throwing the switch, and the ladder is capped at 8s, so the whole
realised cost is that repeated flaps against an idle desk retry at 8s instead
of 1s. Bounded, self-correcting, and arguably what an anti-storm backoff is
for. Not a show-stopper — but the sentence in the comment is false.

**The relay's sequence guard (`tools/artnet-relay.js`).** *"A desk sends ~44
packets a second, so a second of silence is a desk that stopped"* — and then
`if(now - lastPacketAt > 1000) lastSeq = 0;`. A real desk goes silent for
~1.8s routinely and has **not** stopped, so against an idle QLC+ `lastSeq` is
cleared before essentially every packet and the Art-Net ordering guard is
effectively off while the desk idles. Impact is low — idle packets carry the
same values, and during an active cue packets are well under a second apart —
but it is the same bug, in the same feature, and the relay suite even names
the one-second window.

**The lesson both share** is already in TRAPS: a timeout sized off a
datasheet number rather than a measurement is the same bug waiting. These are
the two that are left.

---

## 6. A flake in `tests/smoke.js`, about 1 run in 12

*"the puffs drift, spread and die"* fails intermittently — a puff whose random
drift stays under the case's 0.3m threshold. Found during the Art-Net round on
a build that does not touch it; a re-run is clean. Not fixed, and worth knowing
before it wastes somebody's afternoon: **a lone red `smoke` after an unrelated
change is probably this.**

---

## 7. Three spellings of "a desk is driving THIS rig", and two of them disagree

**Latent, not live** — which is why it is last, and why RULING FC recorded it
rather than fixing it.

The test *"is a desk talking, and to the Palace"* is written out THREE times,
each differently, and the three do not agree on `typeof STAGE === 'undefined'`:

| Site | Spelling | Undefined STAGE means |
|---|---|---|
| `artnetTick` (`p6d`) | `if(typeof STAGE === 'undefined' \|\| STAGE !== 'palace') return;` | **do not write** — its comment says a "never write unless" ruling should fail shut |
| `artHandover` (`p6d`) | `artDriving() && (typeof STAGE === 'undefined' \|\| STAGE === 'palace')` | **the desk is driving** |
| `updateHouseWait` (`p5c`) | `artDriving() && typeof STAGE !== 'undefined' && STAGE === 'palace'` | **the desk is not driving** (mirrors `artnetTick`, deliberately) |

`artHandover` is the odd one out: with `STAGE` undefined it would halt every
fixture's fade — `f.lvlDur = 0`, `f.colDur = 0` — for a desk that `artnetTick`
then refuses to write a single byte for. The rig would be frozen mid-fade and
handed to nobody.

**It cannot bite today.** `STAGE` is unconditionally defined in `p2k`, so the
undefined branch is unreachable in the built game; all three agree on every
value that actually occurs. It is on this list because the *next* place this
predicate is written will copy whichever one the author happened to read, and
because a defined-everywhere assumption is exactly the kind that a fourth
stage, a test harness, or an early-boot call quietly breaks.

**The fix** is one exported predicate — `artDrivingHere()` in `p6d`, on
`artnetTick`'s polarity — called from all three sites. That reverses
`artHandover`'s behaviour in the unreachable branch, which is why it needs a
ruling rather than a tidy-up: it is a behaviour change on paper even though no
frame can reach it.

---

**Suggested order on resuming**, given the above: fix (1) and (3) as their own
small PRs first — they are live defects and both are cheap — then rebase the
shed, then the grids, then PRs 4, 7, 8. **RULING EY (4) is independent of the
GMS round entirely** and can go at any time; **(6) is a flake, not a blocker,
and wants fixing only when a red `smoke` is costing somebody time**; **(7) is
latent and can wait for whoever next touches the Art-Net gates.**

---
---

# PART 2 — QUEUED: things wanted, not yet specced

Rough is fine. Add to this freely.

### Rulings the grids branch needs before it can be finished

- **The floor-pool footprint is still the Palace's shape.** `updateRig` clamps a
  pool to `|hit.x − _sx| < 16` and a z band taken from `D.apron`/`D.backWall`.
  In a studio (local z −8…+8) that suppresses pools over the downstage ~4 m.
  It is strictly better than before — there were *no* pools in a studio at all
  until `stageOrigin()` was wired in — but the proper fix is a **per-stage
  footprint, which is new per-stage state and collides head-on with RULING EE's
  "no new per-stage state".** *That collision is the thing to rule on.* It only
  bites once a lantern can actually be hung there.
- **Patching the board to a studio mints a fogger rack in it.** `stageRestore` →
  `smokeRestore(null)` → `buildSmoke()`, first visit only. That is the existing
  per-stage design and the Arc does it too — but RULING EA says these rooms are
  structure and work light, and the puffs `InstancedMesh` carries
  `frustumCulled = false`, so it always submits: ~16 draws a studio once
  visited, up to 64 seen from reception. Do studios get foggers at all?
- **What should a studio grid point default to?** It is `fresnel` today. #195
  landed `panel` after that choice was made, and **an LED panel is arguably the
  more honest default for a television grid.** One word.
- **`S.bars` holds the hanging POINTS, not the bars.** It was named by PR 1 and
  filled by PR 3, and `tests/studios.js` already ships `S.bars.some(b => b.body)`
  — "has a lantern on its grid at boot" — so filling it with bar records would
  have made that assertion vacuous. `S.points` is the better name; renaming
  means touching that line too.
- **Spec §10 names the wrong function.** It says work lights answer `HOUSE.work`
  "through `stageHouseLevel`". `stageHouseLevel` returns `.house`. The grids
  branch added `stageWorkLevel`, which is what `p2n` already called. Fix the
  spec when PR 3 lands.
- **`vrBuildRopes` files a studio venue's rope holder into the PALACE's
  `ROOM_GROUP.stage`** — it only knows `st.venue === 'arc'`. The holder is empty
  so nothing draws, but it is wrong. **PR 7's ground.**

### From the studios round, for Jack to decide

- **Is 5.2 m the right grid height**, once he has climbed the ladder to it?
  If not, **the ladder moves first and the grid follows it** — that is the
  stated relationship, not a free tune.
- **Four studios on four separate boards** is what the plan builds. If walking
  between them re-patching the console is a nuisance rather than the feature
  it is at the Arc, that is a design question, not a bug.
- **Cameras, a vision mixer, a gallery desk.** Explicitly cut from this round
  as scope nobody asked for. A television plant with no cameras is an obvious
  next thing to want, and it is a round of its own.
- **Audience seating / a bleacher for the game-show studio.** Cut on the
  grounds that it is better built out of the wood than minted as furniture —
  but if building one by hand is tedious, an orderable rostrum is the answer.
- **A lift** to the office floor. The stair reaches it; a lift is comfort.

### Carried from STATE.md, still his

The neon rake (`BJ_NEON_RAKE_ON`), the sign's red at GO, the cemetery's
missing park, **181 MB of models** (meshopt works on r128 today; KTX2 is a
hand-port either way), the graveyard (still unsupplied — the show opens in
it), the audio join at 4292, the house floor pool, a park stated as an
absolute line (CT), `BLIND_BODY`, **`pr6.json`** (still untracked, still
unruled, still sitting in the working tree), the `envTrack` rota backstop.

### Performance, recorded but not taken

All written at their sites in the source:

- **Room-gating the Palace's own 12 point lights.** The work lights carry 40 m
  of range across the whole auditorium, so this **changes the picture** — it
  is not a free gate.
- **The FLY system's 109 draws.**
- **`LIGHTNING`'s flappy gate** — no stable armed flag.

### Known and accepted

`tests/smoke.js` flakes under full-suite load. Rerun it standalone; it passes.
Not a regression.

---
---

# PART 3 — FINDINGS OWED TO `TRAPS.md`

These cost real time to learn in the studios round. **PR 8 moves them into
`docs/guide/TRAPS.md`;** until it does, they live here so they are not lost.

**`groundAt` returns the highest surface in a COLUMN, so a realistic
stepladder cannot be climbed.** Treads that overlap in *plan* put three of
them in your own column: a 1.32 m step, which `tryMove` then refuses in every
direction — a wall you can neither get onto nor off. **The going must equal
the tread depth so the plan tiles**, which is the shape the Arc's feature
stair already has. Rake is the mechanism, not a look. The same rule bit the
office stair from the other side: it climbed *underneath* the slab it was
trying to reach, reported as a 1.94 m step.

**A body that is walkable must come off `WALKABLE` when destroyed.** Removing
a mesh from the scene graph does **not** remove it from the raycast list — a
destroyed ladder's treads are found for ever, at whatever matrix they last
held, and you climb thin air. And it must be the **root group** that is
registered, not the treads: `mergeShell` removes each tread mesh and puts
merged shells back, so individually-registered treads stay in `WALKABLE` while
no longer being children of anything. Measured: a test lantern rests at 0.268
instead of 3.30.

**One eager frame runs before `buildLoad()`, and `buildTick` is in it** — so
anything that marks the save dirty during construction flushes an empty world
over the player's saved build seconds before the load reads it. Latent since the
save shipped because nothing at boot called `buildDirty`; the grids branch
called it 100 times and it fired at once. See Part 1a.

**The shared-material trap bit a FOURTH time** (`M.serge`/`M.velour`, `LENSM`,
`WOODM`, and now `p2n`'s `MAT.workLamp`). A `MeshBasicMaterial` reused as "the
lamp look" across eight rooms is one object, and per-mesh tinting writes it
eight times a frame with only the last surviving. **If a thing is tinted at
runtime it needs its own material, or a keyed cache — never a shared constant.**

**A mutation can change a file without changing its length.** One negative check
in the grids branch left the built file at exactly 1539949 bytes. **Verify a
mutation landed by SHA, never by byte count.**

**A negative check that does not fail is a finding about the TEST.**
`envRegister(STU.group)` was written, passed the suite, and removing it
changed nothing — `envRecollect()` at the boot tail already walks the whole
scene. It was dead code that looked load-bearing. Related: **a merged body
hides an uncached piece**, so the obvious geometry-cache assertion passes
against its own mutant — `mergeParts` clones its inputs and `mergeShell`
caches the *result*, so the assertion must ask `FIXG` **by name**.

**A predicate that names what it means cannot rot.** `inPalace()` read
`VENUE !== 'arc'` while the town had two buildings. With a third it answers
YES four hundred metres away and hangs the Palace's proscenium, dock and shed
walls across a television studio.

**`makeBodyMesh` has no default for an unnamed gear kind** — it falls through
to `bodyProfile()`. Every delivered ladder, and every ladder off the *save*,
came back a 0.485 m profile spot, silently. Name any new gear kind in that
chain. Related: **`canHang`'s last line is permissive** (*"anything that is
not a speaker answers a lighting point"*), which was true only while every
non-build body was a lantern. `NO_HANG` is a deny-list **by name**.

**A generated file that merges cleanly is not to be trusted.** `the-house.html`
is committed BUILT, and git will happily text-merge two branches into
something matching neither `src/`. **Always rebuild after a rebase or merge
and confirm the built file matches the source.**

**Parallel branches must take DIFFERENT insertion anchors in a shared test
file.** Three branches of this round appended at the *end* of
`tests/orders.js` and two conflicted. Top / middle / end is only three
anchors.

**The backtick-in-a-probe-comment trap bit for the seventh time.** A backtick
anywhere in a probe template — *including in a comment* — kills the suite at
parse time pointing somewhere unrelated. `probe-lint.js` catches it. The rule
is **"run the lint after every probe edit"**, not "be careful".

---

## A template, for adding something new

```markdown
### <name> — one line on what it is

**What Jack said:** (verbatim, if he said it — his words beat a paraphrase)

**Why:** what it is for, in one or two sentences.

**Open questions:** the things that would change the work depending on the
answer. These are what a spec session asks him first.

**Rough shape:** which parts it touches, anything already in the code waiting
for it, anything it would collide with.

**Size:** a guess at the number of PRs.
```
