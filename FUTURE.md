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
**The last one used is `EK`** (the stepladder). The next spec starts at `EL`.

When something in here ships, **delete it from this file** — this is a list of
what is *not* done. It stops being useful the moment it becomes a history.

---
---

# PART 1 — LIVE: the GMS Studios round (PAUSED mid-round)

**Paused 2026-08-14 at Jack's word.** Three PRs merged, two branches in
flight, three PRs never started.

- **Binding spec:** `docs/superpowers/specs/2026-08-14-gms-studios-design.md`
  — **RULINGS DZ–EK**. Read it before touching any of this.
- **`main` is `ce1de31`.** Suite count is **20** (`tests/studios.js` is new),
  all 20 green.
- **Cache-bust is still `?v=29`.** Nothing in this round has been on hardware.
  **Bump to `?v=30` before judging any of it in the headset.**

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

### `gms-studios-shed` — PR 2, state UNKNOWN

Its final report had not arrived when this was written. **Read it before
touching the branch, and do not assume it is complete.** Expected conflicts:
`src/p9.txt` (#195 changed the order-screen layout for lists over six rows) and
`tests/orders.js` (three branches have now appended at the END anchor; two have
already collided once).

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

# PART 1a — A BUG THAT EATS SAVES, found by the grids branch

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

**The fix on `gms-studio-grids`:** `buildTick` refuses to write until
`buildLoad` has been called, whatever it found (`var _buildLoaded` in `p4c`).
That is two lines and it is right, but it is currently buried in an unmerged
feature branch.

**Decide:** cherry-pick it into its own PR now, or let it ride with PR 3. It
belongs in `TRAPS.md` either way.

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
