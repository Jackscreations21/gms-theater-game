# THE HOUSE — handoff

A 3D theatre you work in. Two buildings, three stages, a lighting rig you can
plot, a counterweight fly rail you can haul, productions that load in, a crew
that carries them, and a VR mode for a Quest 3. One HTML file, ~875KB, three.js
r128, no build step beyond concatenating text files.

---

## 0. Layout

```
theater_game/
  the-house.html     the game — open this, or serve it (VR needs HTTPS)
  index.html         one-line redirect so the bare Pages URL lands in the game
  build.sh           rebuilds the-house.html from src/
  HANDOFF.md         this
  AUDIT.md           the 2026-08-06 code audit — findings, evidence, line numbers
  VR-SETUP.md        getting it onto a Quest 3 — routes, controls, first-run list
  README.md          the GitHub front page
  src/               the 26 parts it is built from (build.sh has the order)
  tests/             fifteen suites — npm install, then node real.js
  tools/             probes that draw pictures — see tools/README.md
```

`the-house.html` is committed built. You only need `build.sh` if you edit `src/`.

Git: the remote is `https://github.com/Jackscreations21/gms-theater-game`
(private as of 2026-08-06). Commits use the owner's GitHub no-reply address —
**keep it that way**; the repo may go public. `.gitattributes` pins LF because
`build.sh` breaks under CRLF.

**All work goes through pull requests** (owner's rule, 2026-08-06, so there
is a record): branch off `main`, commit there, push, open a PR with `gh`, and
let the owner review/merge. No direct commits to `main`. Everything up to
`6d635ce` predates the rule.

---

## 1. Build it

```sh
sh build.sh          # concatenates src/ into the-house.html and syntax-checks
```

**The order in `build.sh` is not alphabetical and must not be sorted.** It is a
dependency order, and a few positions are load-bearing:

| Part | What it is | Why it sits where it does |
|---|---|---|
| `p1` | HTML, CSS, all the DOM panels | must be first — opens `<script>` at the end |
| `p2` | dimensions `D`, `scene`, `camera`, `renderer`, materials `M`, textures `TX` | everything reads `D` |
| `p2b p2c p2e p2g p2h p2f` | auditorium, stage house, FOH, dock, doors, seats | |
| `p3` | fly system: `FLY`, `GOODS`, `TRIMS`, `drape()` | `p4` reads `FLY[n].z` when it builds the rig |
| `p4` | lighting: `FIXTURES`, light pool, beam shader, `stageToWorld` | after `p3` |
| `p5 p5e` | scenic stock, smoke | |
| `p6 p6b` | cue engine + console UI, the crew | |
| `p5c` | `SHOWS`/`SHOW`, scenes, rain/fire, helpers | after the crew (`crewForgetLoads`) |
| `p5d p5f p5g` | Lost Boys, Hamilton, The Play That Goes Wrong | `p5f`/`p5g` reuse `LB_CLOTH_W` from `p5d` |
| `p2j` | **the Arc Centre** (second venue) | after the shows, before the stages |
| `p2k` | **three stages, one board** | needs `ARC` and `buildRig`/`makeLineset` |
| `p2i` | room/portal culling — `buildRooms()` sorts `world.children` | **must be late**: it files whatever exists at that moment |
| `p7` | camera, movement, all UI wiring, the frame loop | |
| `p9` | **VR** | needs `frame`, `renderer`, `SHOWS`, `STAGES` |
| `pz` | `</script></body></html>` | **split out of `p7` on purpose** — anything appended after `p7` would land outside the script tag. It did, once. |

`p2d` is orphaned and unused. Leave it or delete it.

---

## 2. Test it

jsdom plus the **real** three.js with a stubbed `WebGLRenderer`. There is no
browser and no GPU in the loop, so it catches structure, geometry, state and
wiring, and cannot catch anything about how it looks or how fast it runs.

```sh
cd tests
npm install       # once — jsdom and three@0.128
npm test          # all fourteen suites, exits non-zero if any fail
node real.js      # boots the whole file, reports "fatal": null
node full14.js    # the building
node rooms.js     # portal culling
node holes.js     # no gaps in the shell you can see or walk through
node crew.js      # the stagehands
node smoke.js     # the machines
node show.js      # productions, cue stacks, the saved hang
node sets.js      # scene changes, the collapsing set, the revolves
node arc.js       # the Arc Centre
node stages.js    # three stages, one board
node legs.js      # goods, including the half legs
node warehouse.js # the warehouse sheds, their doors, the carts, the slots
node orders.js    # the supply screens, the pallet, rulings C/D/E
node build.js     # the build system: wood stock, the tabbed screen, caps
node vr.js        # WebXR: rig, sticks, desks, ropes, GO, bodies
```

All fifteen are at `--- failures: 0 ---`. Keep them there. Every suite exits
non-zero on failure (including a failure to boot), and `npm test` runs the lot.

`full14.js` wraps `window.MouseEvent` at the top of its harness: jsdom has no
pointer-lock support, so a stock jsdom `MouseEvent` silently drops
`movementX`/`movementY`, and the five fly-haul tests pull with undefined force
and fail in cascade. Any new test that synthesizes mouse movement needs the
same shim (or belongs in `full14.js`, which already has it).

`tools/` holds **probes**, which are not pass/fail but print pictures —
`audience.js`, `goes-wrong.js`, `arc-foyer.js`, `arc-studio.js`. They cast a
grid of rays and print what each one hits as ASCII, banded by distance. Between
them they found the Outsiders frame hidden behind a drop, the crossed rafters,
the bricked-up proscenium and the see-through seating.

**Write a probe when you cannot picture it.** Every single "it looks wrong"
report in this project was found in seconds once something drew it.

---

## 3. What is in it

**Two venues.** The Palace (a Broadway house: fly tower, dock, foyer) at the
origin, and the Arc Centre 420m out along +x — a glazed foyer with a bar and box
office, a Main House and a Studio Theatre. Only the venue you are standing in is
drawn; neither draws a single mesh from inside the other.

**Three stages, and one board.** `p2k`. There is one `FIXTURES`, one `FLY`, one
`CUES`, one `SHOW`, one `HOUSE` — and walking into a theatre **swaps their
contents** rather than threading a stage argument through two hundred functions.
Every existing function carries on working; it just describes a different room.
`STAGE` names the live one, `STAGES[key]` parks the others.

**Five productions.** THE OUTSIDERS, THE LOST BOYS, HAMILTON (two concentric
revolves that turn), THE PLAY THAT GOES WRONG (seven pieces that fall over under
their own weight and can be stood back up), and BEETLEJUICE (seven scenes that
take turns on the one stage, its cue times measured off a recording). All
interpretations in each show's vocabulary — no reproduction of anyone's
drawings; **RULING AO** restates that for the one taken off a video.

**A crew.** Six stagehands with a job queue who bring a set in through the dock
of whichever stage the board is patched to, hang the goods, and strike it again.

**VR** (`p9`). Quest 3, 90Hz target. Auto-detected — the desktop is untouched.
Smooth stick walking and smooth turning, five physical consoles (Palace balcony;
tech table and control room in each Arc house), ropes at the pin rail you grab
and haul, a GO button you reach out and press.

---

## 4. Invariants — break these and things go quietly wrong

**The deck is `y = 0`, on every stage.** Every set, every fly trim and every
fixture aim is written to it. The Arc's decks were built a metre up once and it
buried every production that loaded onto them.

**Every stage is the same box.** `AS` in `p2j` takes `procW`, `procH`, `stageW`,
`stageD`, `gridY` straight off the Palace's `D`. Both Arc houses are built by one
function called twice, and their rigs and fly systems are the *Palace's own
builders* run into a translated group. Change `D` and all three change.

**A fixture's `aim` is in WORLD space; a light plot is written in STAGE
coordinates.** `stageToWorld()` in `p4` converts. With one theatre these were the
same thing; with three, a plot aimed every lantern in the Arc back across town.

**Trims are the height of the PIPE.** Goods hang below it. Setting a trim to
where you want the bottom edge hangs the cloth through the floor.

**Upstage is −z. Downstage is +z. Stage right is −x.**

**Anything computed in world space needs a container at the world origin.** The
Arc's rooms sit at x = 420, so its floor-pool group, its crew root and its rope
holder all carry `position.x = -ARC.X` to cancel it back out.

---

## 5. Traps this codebase has actually fallen into

Listed because every one of them cost real time and none of them are obvious.

**three.js r128 instanced bounding spheres.** r128 sizes an `InstancedMesh`
bounding sphere from the base geometry, so a batch of 1,400 seats looks like one
seat at the origin and gets culled. Widening the sphere fixes the culling **and
breaks per-instance raycasts**, because r128 uses the same sphere per instance.
So: things you must stand on keep an honest local sphere and set
`frustumCulled = false`; decorative batches get the wide sphere and
`raycast = ()=>{}`.

**`visible` is only a drawing flag.** A raycast goes straight through it and hits
the geometry anyway. Scenery that is off is switched off with `layers.disableAll()`
as well.

**A flag used for two purposes will eventually mean the wrong one.**
`userData.moves` meant both "don't freeze this" and "crew keep off", which is why
the jungle-gym bars were never struck. Split into `userData.effect` plus a light
check.

**DOM cached on a per-stage object.** Each lineset cached its table row in
`ls.ui`. Rebuilding the table for another stage detached the old rows, and the
stage you came from went on updating a table nobody could see. The fly rail
"stopped working" from exactly this.

**Test through the DOM, not the model.** The bug above survived a test that
clicked `ls.ui.row` — a *detached* row still fires its handler perfectly well.
Go through `document.querySelectorAll`.

**`typeof` does not protect a `const` declared later in the same script.** It
throws instead of returning `'undefined'`. Function declarations hoist across the
whole concatenated file, so `updatePlayer` could reach the VR guard before `p9`
had run. `VR` is a `var` for this reason.

**Orientation sign errors, four separate times** (gable rafters, the dock ramp,
which side the dock was on, the street wall). `rotateX(-π/2)` maps shape-y to
world −z. `rotateY(π/2)` mirrors. A box's long axis is local Y.

**jsdom's `MouseEvent` has no `movementX`/`movementY` at all** — not 0,
undefined. The game guards it to 0, so synthetic hauling events do nothing and
the failure looks like broken game code. It isn't; shim the event (see §2).
Cost half a session before anyone checked what jsdom actually constructs.

**Measure the right thing.** Two tests passed while being wrong: a darkness
comparison that swept in the Palace's foyer chandeliers 30m away through a shut
door, and a floor probe that found the fly gallery instead of the stage. And "is
anything below zero" is a useless test of whether a set sits on the deck —
compare the *same* production across stages instead.

---

## NEXT SESSION: **PUT IT ON THE HEADSET** (2026-08-10)

The re-time round is BUILT, GREEN and **entirely unseen**. Eleven PRs, and
nobody has looked at a second of it through a Quest. The full list of what
only hardware can answer is in **STATE.md** — read that. What belongs here
is why the suites stop where they do, and it is not a shortcoming: jsdom
has no GPU and `fillText` is a noop, so *nothing about how any of this
looks has ever been tested, and no test in this repo claims otherwise.*

**Cache-bust `?v=17`.** The build went 964663 → ~1000763 across the round.
Confirming a timing or a look against a cached old build reads as a fault
that is not there, and this repo has been caught by that before.

**The one number most likely to be wrong** is the wagon's crossing time:
4.0 seconds over 10 metres. It is a guess. The assertion allows 2–12s
precisely so it can be retuned without a fight.

## DONE — 2026-08-10: the owner's own scene plot (#104–#113)

The owner watched the recording and wrote the set changes out himself with
timestamps, and **his list became the authority.** Where it disagreed with
what #93–#100 had measured, his list won — which was most of act one.

**The cross-check that made it trustworthy:** his act break, 1:11:02, is
second 4262, exactly where `blackdetect` found the show's longest blackout.
His timestamps and `tools/video.js` share a time base, so a plot written
from a sofa dropped straight into `looks[].at` with no offset.

**Eight rulings, and the first REVERSAL in the sequence.** AP the wagon is
real and seen; AQ one house three dressings; AR the show ends at 2:15:00
(the owner overruling a measurement); AS the sign flies and there is no
crypt; AT cloths on lines, structures on movers; AU the two waits are the
two GO presses; **AV repeals AO** — the scenery is no longer "our own
vocabulary", Beetlejuice is modelled on the production, scoped to that
show alone. AO is left in its own spec marked superseded, because a
reversed ruling is worth more on the record than a deleted one.

**The Palace is now deeper than the box.** `D.backWall` (−17) stays the
STAGE-COORDINATE reference every show and both Arc houses are written to;
`PAL_BACK` (−21.5) is where the Palace's brick actually stands. Structural
Palace geometry uses `PAL_BACK`, anything stage-relative keeps
`D.backWall`. A deliberate, scoped break of "every stage is the same box",
at the owner's instruction — "only do this with the palace theater".

**Six defects, and the suites caught two of them.** The mover that moved
nothing (a frozen group takes the write and stands still); the cloths hung
in FRONT of the show; `SHOW.goods` being the delete list; a building that
moved while its furniture stayed; a park offset measured against the
shallowest dressing; and a test helper that tripped the stale-parent trap
recorded three PRs earlier. **Two were found by throwaway probes** — the
TRAPS.md advice working exactly as written.

**And the lesson that outranks the rest, now in TRAPS.md:** *a negative
check that does not fail means the ASSERTION is weak.* It happened FIVE
times in one round — a clearance test that checked order and accepted 7cm,
a shed test that checked position and accepted a shed trimmed by a third,
a travel test whose window scaled with the speed it was testing, a
dressing test that never exercised its own hooks, and a confetti feature
with no test at all. Every one was about to ship as false comfort.

## SUPERSEDED — the in-flight block (#104–#109)

**This supersedes the "CONFIRMING THE SCENE TIMING" section below.** Nobody is
confirming the built timing, because the owner watched the recording himself
and wrote out the set changes with timestamps, and **his list is the
authority.** Full position, the plot, the rulings and what is left: **STATE.md,
"THE RE-TIME ROUND"** — read that, not this. What belongs here is what the
round has already taught.

**The cross-check worth remembering:** his act break, 1:11:02, is second 4262 —
exactly the built act-break cue taken off the measured 13.3s blackout. The
owner's timestamps and `tools/video.js` share a time base, so his numbers drop
straight into `looks[].at` with no offset. That is why a plot written from a
sofa could be trusted against a probe.

**RULING AV repealed RULING AO** — the first reversal in the sequence. The
scenery is no longer "our own vocabulary"; Beetlejuice is modelled on the
production, *scoped to that show alone*. AO is left in its own spec marked
superseded rather than deleted, and the assertion that guarded it was
**reversed in place** rather than removed, because the note is still
load-bearing and must not drift back.

**Four defects this round, and only one was found by a suite:**

1. **The mover moved nothing.** `lockShowStatic` freezes the set with
   `matrixAutoUpdate = false`, so writing `position.x` on a scene group updates
   the record while the house stands still. The first crossing test read
   `position.x` back and passed against a stationary wagon. In TRAPS.
2. **The cloths were hung in front of the show.** The backdrop went on line 8
   (z −6.10) with the interior wall at −9.20 and the cemetery at −16.15. Every
   suite was green: nothing asserted the one structural fact that makes a
   backdrop a backdrop. **Found by a throwaway probe printing per-scene
   bounding boxes** — the TRAPS advice working exactly as written.
3. **`SHOW.goods` is the DELETE list.** Registering the stock `sky` on it
   destroyed the good for every show that follows. Three suites went down.
   This one a suite did catch.
4. **A building moved and its furniture stayed.** The Palace shed shifted 4.5m
   upstage; `buildCart`, both `buildSaw`s, `buildRack` and `buildTrash` carry
   hardcoded z, so the fit-out drifted to the front wall and the trash drum
   ended up standing on the stage, through the brick.

**Two assertions had to be strengthened after their negative check passed** —
worth noting as a pattern, because both were nearly shipped as false comfort:
a clearance check that only tested ORDER and accepted 7cm between a cloth and a
roof, and a shed check that tested POSITION and accepted a shed trimmed from
13m to 9.4m. **A negative check that does not fail is telling you the assertion
is weak, not that the code is right.**

## NEXT SESSION: **CONFIRMING THE SCENE TIMING** (owner, 2026-08-10) — SUPERSEDED, see above

The round is built and merged (#90-#100). What has NOT happened is anybody
watching it run. The next session confirms the timing — and the first thing to
know is that **the suites cannot do it for you.**

### Why a suite cannot answer this

`follow` arms the next cue with **setTimeout**, so the chain runs on the wall
clock. jsdom can assert the follow VALUES (and does — the chain reconstructs
8627s, the act break at 71:02, the call at 141:02) but it cannot observe the
cues actually firing without sitting through 144 real minutes. **That gap is
itself the strongest argument for ruling AP**: a dt-driven transport would be
testable in a suite, because `stepProgram(dt)` can be stepped 8627 seconds in
a loop. Worth putting to the owner in exactly those terms.

### What to confirm, in order

1. **Does it start itself?** Load BEETLEJUICE, press GO once. Cue 1 should arm
   cue 2 twenty-five seconds later with nothing else touched.
2. **Does DRIFT accumulate?** This is the real question. Each timer fires a
   little late and the next is armed from the late fire. Note the wall-clock
   time at the act break (due 71:02) and at the call (due 141:02) and compare
   against those two. **If the call lands more than a few seconds late, the
   cheap version has answered ruling AP by itself.**
3. **Does a stage swap kill it?** Start it, walk into the Arc, come back. It
   should be dead — `cancelFollow` runs on the swap. Confirm that is what
   happens, because it is the other half of the AP argument.
4. **Do the scene changes land in the dark?** Ten scenes, six changes. Every
   one is covered by a shut cloth or a blackout and a test asserts it, but
   whether the cover FEELS long enough is a judgement nobody has made.
5. **Does the pace read?** 46 cues over 144 minutes averages one every three
   minutes. Cues 8-12 (the interior) and 26-29 (the redecorated room) are the
   longest stretches; those are where it will feel slow if anywhere does.

### When each scene is due, off the recording

| Scene | Due | Cues |
|---|---|---|
| cemetery | 0:33 - 15:20 | 0.5 - 7 |
| interior | 15:57 - 31:34 | 8 - 12 |
| attic | 42:22 - 51:56 | 13 - 15 |
| bedroom | 54:23 - 55:45 | 16 - 17.3 |
| crypt | 56:46 - 71:30 | 17.5 - 20 |
| house exterior | 72:30 - 78:00 | 21 - 25 |
| redecorated | 78:28 - 99:38 | 26 - 29 |
| afterlife | 103:39 - 115:00 | 30 - 32.3 |
| the sign | 118:04 - 120:50 | 32.5 - 32.7 |
| afterlife again | 121:54 - 136:40 | 33 - 33.3 |
| bare stage | 137:57 - end | 33.5 - 37 |

### The four soft spots — where it is a DECISION, not a measurement

If something feels wrong, look here first. These covers were invented because
the recording gave nothing to measure, and each says so in its own comment:

- **cue 7**, out to the interior — no measured blackout anywhere 9:00-18:00.
- **cue 12**, up into the attic — none before 42:22 either.
- **cue 25**, back inside from the exterior — none between 94:02 and it.
- **cue 32.3**, out to the sign — none there.

The covers that ARE measured, and should feel right: cue 15 (8.6s at 51:56),
cue 17.3 (10.5s at 55:38), cue 19 (13.3s at 71:02, the act break), cue 29
(2.9s at 99:38), cue 32 (a 12.4s fade at 113:18), cue 35 (7.0s into black at
143:35).

### And the standing one

**None of this has met hardware.** Whether a self-running show reads as a show
or as a slideshow, whether the portal reads as a portal from a seat, and
whether ten scenes taking turns reads as one production — those are headset
questions and they belong in the section at the bottom of this file as
questions, not asserted here as facts.

## DONE — 2026-08-10: a fifth show, taken off a recording (#90-#98)

The owner asked: "if i give you a video of a full show can you make the real
cues and sets for it and make an auto cue feature for it that is timed
currectley", then supplied a 2h23m47s recording of BEETLEJUICE.

**Phase 1, the measurement (#90).** `tools/video.js` — the one probe that loads
no harness, only ffmpeg. Five passes: a 16x9 area-averaged grid at 5fps (one
pass instead of the brief's 24 crops), per-frame scene scores, blackdetect,
silencedetect, astats. The headline changed the scope: the file is a **bootleg
compilation, not a locked-off wide shot** — 723 hard cuts at 5.0/min, layout
stability median r=0.676 where a fixed camera scores ~0.95 — so **per-area
channel levels are not measurable from it at all**. What survived: CFR
timestamps, real black at Y=16.8, fixed exposure (+1.1Y drift through a 13.3s
blackout), 33 blackouts >=1s, fade times median 2.2s, the act break at 71:02,
and the curtain call located in the last 2.5 minutes — 82 events of lights
bumping — **without ever seeing a frame**.

**RULING AO (#91).** The scenery is the show's vocabulary, not its drawing:
our own proportions, our own detailing, our own words on any sign. It restates
what §3 already ruled for the other four, and it is written down because a
video makes tracing easy for the first time. All four older shows carry an
interpretation note on their record; Beetlejuice's is now a tested assertion.

**Beetlejuice was here before, and was removed.** `tests/sets.js` carried an
assertion since the INITIAL COMMIT that `SHOWS.beetlejuice` must not exist, and
it appears nowhere in git history under `src/` — so the removal predates the
repository and **no reason for it was ever recorded**. Reversed deliberately,
with the old assertion rewritten in place saying what it used to guard and why
that changed.

**The scene machinery was built for this show and orphaned with it.**
`sceneAdd`/`sceneShow`, a cue that carries a `scene`, and a p7 panel — recorded
here as "general machinery that no current show uses". This is the first
production to use it, and it is what makes seven configurations affordable: a
scene that is off has its **layers disabled**, so it costs no draw call and no
raycast. Only `p2d` is genuinely dead — re-read audit item 20 before deleting
anything near it.

**What shipped.** `src/p5h.txt`, appended after `p5g` (SHOWS is declared in
p5c). Seven scenes — cemetery, interior, attic, bedroom, house exterior,
redecorated room, afterlife — and a constant portal, ~80 pieces, one scene ever
live. 38 cues across a full evening.

**THE AUTO-CUE RUNS, and it cost no new code.** Every cue's `follow` field now
carries the gap between two measured cue times. The chain spans **8627s = 144
min** against a 143-minute recording, reaching the act break at exactly
**71:02** and the curtain call at **141:02**. Show him this before any
transport is specced.

**Still owed:** **PR 6 of 7**, the remainder scenery (crypt 56:46, sign set
118:04, bare-stage looks) — purely additive. And **rulings AP onward**: cheap
`follow` vs a real timecode transport, whether it must be VR-reachable, and
what a running show does on a stage swap. Two facts for that discussion:
`follow` uses `setTimeout` and a **stage swap cancels it**, so an unattended
show dies when you change venue; and chained relative waits drift where
absolute timecode does not.

**For the headset, as questions and not claims:** does a self-running show read
as a show, or as a slideshow? Is 144 minutes of it bearable, and is the pace
right at the act break? Does the portal read as a portal from a seat, or just
as a frame? None of this has met hardware.

## 6. Where it stands / what is next

All twelve suites green on `main`, audited, and the audit **worked off**:
of the 6 high / 17 medium / 6 low findings in **AUDIT.md** (repo root,
2026-08-06), 20 of the 22 queue items below are fixed and merged. The two
leftovers (items 20, 22) are owner-taste, not bugs.

**The game is LIVE on GitHub Pages:**

```
https://jackscreations21.github.io/gms-theater-game/the-house.html
```

The bare `…/gms-theater-game/` URL redirects there. Pages serves whatever
is on `main`, so a merged PR is live within a couple of minutes. The Quest
Browser caches hard — bust with `?v=2` or clear site data before deciding
a fix "didn't work". VR-SETUP.md (repo root) is the full guide: both
serving routes, the control scheme, the first-run checklist.

**Done 2026-08-06:** fixed the `full14.js` harness (the jsdom `movementY` shim
above — the game code was never wrong), created the git repo (there had never
been one), pushed to GitHub, rewrote both commits onto the no-reply address,
added `README.md`. GitHub Pages is **not** enabled yet — it needs the repo
public or a paid plan, and that decision is the owner's. Later the same day:
ran the code audit — six independent read-only passes (global state, the p2k
swap, dead weight, duplication, coordinates, test coverage), cross-checked,
the sharpest single-source claims re-verified by hand and one by a live jsdom
probe. No code was touched; AUDIT.md is the deliverable.

**Done 2026-08-06, evening session: worked the bug list — and it is all on
`main` (80b3521).** Twenty of the twenty-two items below fixed, one finding
per commit, ~30 new regression tests, every fix negative-checked against the
unfixed code. Delivered as four stacked PRs (#2–#5); the stacking bit us —
the PRs were merged without deleting each base branch, so #3/#4/#5 landed on
their stale *bases* instead of `main`, and it took a catch-all
[#6](https://github.com/Jackscreations21/gms-theater-game/pull/6) to bring
the missing 17 commits home. **Lesson: with this repo, PR straight to `main`
— don't stack.** Post-merge verification: `main`'s tree byte-identical to the
tested state, the build reproduces exactly, 12/12 suites green on `main`,
work branches deleted. Still open from the queue: item 20 (dead weight —
owner's deletion call), item 22 (duplication — now unblocked), and the M9
ruling (documented one-board; capture them in p2k if you disagree). `gh` is
not installed on this machine — PRs were opened through the GitHub API with
the stored git credential.

**Done 2026-08-07 (the Pages session):** the owner enabled Pages; verified
live and smoke-tested on desktop (boots clean over HTTPS, zero console
errors, four shows registered, `navigator.xr` present). Merged the same
day, one PR each, straight to `main`, no stacking: **#8** the `index.html`
redirect, **#9** VR-SETUP.md (the Quest guide — controls read out of p9,
not guessed), **#10** the shift-lock rework. That last one changed a
control: **tap Shift** (under 250ms) now toggles the pointer lock — cursor
locked to centre, mouse steers the camera, tap again to release — while a
**hold** is still run, so sprinting never drops the mouse. The old
run-latch is gone; the SHIFT LOCK chip now mirrors the *real* pointer-lock
state however it changed (tap, canvas click, or the browser's Esc), so it
cannot lie. Four new tests in `full14.js` drive real key events through a
full pointer-lock mock (jsdom has none). Post-merge: `main` verified
byte-identical per PR, work branches deleted, 12/12 green.

**Done 2026-08-06, the VR features session — two rounds in one day.**

*The first headset run happened.* Findings, for the record: the first
attempt never entered VR because the ENTER VR chip went untapped (not a
bug — the flat page is keyboard/mouse by design); the second attempt
loaded in fine, so `vrEnter()` and the session chain are proven on
hardware. Frame rate was "a little low" (owner's words, no number). No
verdict yet on pointing accuracy, console readability or comfort.

*Round one (merged: #12, #13, #14):* triggers act on whatever the ray
lands on, the way the desktop E key does — either hand, desks keep
priority, floating label says what a pull will do; tap A jumps,
double-tap A flies (gaze-directed, gravity off, walls still block,
landing or another double-tap puts you back on your feet); the mild perf
notch — beams 14 → 10 in-session, framebuffer scale 0.85 asked for at
wiring time.

*Round two (open as of this writing: #15, #16, #17 — check they merged
before building on them):* built by three parallel worktree agents, each
reviewed line-by-line and independently re-verified before push. The
review caught one real seam bug: the live VR haul still used the flat
0.6m floor, so a held rope could drag goods through the deck.

- **#15** — nothing hung can go below the deck. `minTrimOf(ls)` in p3:
  the pipe stops when its goods kiss the floor, but never above the
  goods' own working trim (the house curtain is cut to puddle — h 13.0
  on a 12.6 trim — and must still make it). `flyTo` and the desktop haul
  clamp against it. Known change: SHOW LOOK's cyc call was burying 2.9m
  of cloth; it now stops at 13.55m.
- **#16** — the pin rail is real now. Full operating loops (head block
  under the grid, floor block off the deck, two runs, sheaves that
  spin), and a little red lever per line: the rope lock, which IS
  `ls.locked`. Grabbing a rope takes the lock off; releasing without
  throwing the lever starts a runaway — down from rest, slow-stop-return
  if it was going out, ever on if it was coming in — integrated in p3
  `updateFly`, stopped by the deck floor or the lever. Board commands
  cancel a runaway. Stage swaps tie off (no runaway — the parked-stage
  regression stays green). Desktop hauling unchanged.
- **#17** — the Palace balcony desk faces its operator (yaw π → 0, face
  normal now +z) and the 24 seats crowding the control position are
  gone (keep-out rectangle in the p2b mezz bank; SEAT_COUNT 1392 → 1368).

`#15` and `#16` are written to merge in either order: `#16` reaches
`minTrimOf` only through `typeof` guards.

**Done 2026-08-07, the locking-rail rework (this PR).** The owner sent a
photograph of a real counterweight locking rail and three asks; all three
are in:

- **The rail looks like the photograph.** A steel locking rail now stands
  in FRONT of the rope loops: one beam the length of the hung lines, a
  kick rail, posts, and — per lineset — a rope-lock housing on top with
  its red handle facing the flyman, over a painted number plate on the
  rail's face (`ropePlateTex`, cached in `ROPE_PLATES` so stage walks
  don't leak canvases; `disposeTree` only ever disposed geometry).
- **Grab anywhere on the rope.** A squeeze takes the nearest point on
  EITHER run of any loop, deck to grid (distance-to-segment, radius
  0.32m), not just the whipped section at hand height — the whipped
  section now slides to meet the hand. The back run is the other half of
  the loop, so it hauls in reverse (`VR.held.dir`).
- **Levers never move on their own.** The old rail toggled a lock when
  any hand came within 0.11m of the knob — a knuckle mid-haul could
  throw it — and grabbing a rope silently took its lock off. Both gone.
  A lever moves ONLY while a hand is squeezed closed on its knob
  (nearest-wins against the rope, `VR.heldLever`): lean it IN (upright)
  and the line locks; pull it OUT (toward you, past ~70% of the throw)
  and the line is RELEASED — and a line released with no lock and no
  hand on it runs away to the deck, same physics as a let-go rope.
  Grabbing a rope still arrests a runaway (you have the weight) but no
  longer touches the lock; hauling against a thrown lock moves nothing,
  and the hold re-bases while locked so pulling the lever out mid-haul
  cannot bank the blocked pull and let it fly. Board/desk LOCK is still
  the same `ls.locked` flag.

Suites 12/12 before and after; the eight new/reworked assertions all fail
against the pre-change build (negative-checked). What only the headset
can answer is folded into the step-zero list below.

**Done 2026-08-07, frame-rate round one (PRs #21, #22, #23 — open as
of this writing, check they merged before building on them).** The
measure-first order above is honoured — #22 IS the readout — and two
of the cheap wins went in alongside it, each its own PR, each gated on
the session so the desktop is untouched:

- **[#21](https://github.com/Jackscreations21/gms-theater-game/pull/21)
  — the session is paced at 72Hz, not 90.** On sessionstart the game
  asks `updateTargetFrameRate` for the lowest supported rate at or
  above 72 and remembers it in `VR.targetHz`. 13.9ms of frame budget
  instead of 11.1 before any other knob turns; a held 72 beats a 90
  that drops. Browsers without the API are left alone. If the meter
  later shows miles of headroom, this is one line to retune.
- **[#22](https://github.com/Jackscreations21/gms-theater-game/pull/22)
  — the frame meter, and foveation on a feedback loop.** `vrPerf`
  (called from `vrUpdate`): a 120-frame ring buffer, avg/worst in
  `VR.perf`, evaluated twice a second, drawn on a small tag riding the
  LEFT WRIST — glance at your watch; green under budget, red over,
  peak and foveation level alongside. Over budget the controller steps
  foveation 0.4 → 1.0 by 0.15 (foveation is the one knob WebXR turns
  mid-session; framebuffer scale is start-only); with headroom it
  relaxes by 0.05 back to the 0.4 base, never below. Climb fast, relax
  slow. `vrOnEnd` resets the window.
- **[#23](https://github.com/Jackscreations21/gms-theater-game/pull/23)
  — four real spotlights in VR, not eight.** `VR.lightCap = 4` set by
  `vrQualityOn`, honoured by the p4 hand-out loop (`_active` was
  already sorted by workload, so the four that matter keep theirs).
  178 `MeshStandardMaterial` uses pay per-pixel for every live light,
  twice per frame in a headset — this halves that term. Beams, gobo
  pools and lens glows still draw for all 25 channels, so the rig
  still reads fully lit.

Seven new vr.js probes across the three PRs, every one verified to
fail against the pre-change build. The three branches were also merged
together locally (any order — they are written independent) and the
combined build passed 12/12; the per-PR builds did too.

**Done 2026-08-07, the owner's five asks (PRs #25–#29 — open as of this
writing, check they merged before building on them).** Five one-line
asks, five PRs, all off `main`, no stacking. #25/#26 by hand; #27/#28/#29
by three parallel worktree agents, each reviewed line-by-line. Every new
probe negative-checked; all open branches merged together locally in two
different orders, rebuilt, 12/12 on the combination:

- **[#25](https://github.com/Jackscreations21/gms-theater-game/pull/25)
  — all four Arc desks face their operators** (both tech tables, both
  control rooms): built at yaw π — the same bug #17 fixed on the Palace
  desk, the same ruling: yaw 0, screen normal up the house.
- **[#26](https://github.com/Jackscreations21/gms-theater-game/pull/26)
  — the Arc seats sit on their treads.** They floated exactly 0.96m:
  rows laid out from `0.4 + i*RISE` against treads that top out at
  `Y0 + i*RISE + 0.2`. Now on real pedestals (a fourth instanced
  batch), 1,273 seats across the two houses.
- **[#27](https://github.com/Jackscreations21/gms-theater-game/pull/27)
  — the rail starts locked, and the semantics are DECIDED: the lock is
  the hand's interlock; the board is the flyman.** `flyTo` (cues, group
  calls, crew, presets) takes a thrown lock off itself, runs the line,
  relocks on arrival (`ls.relock`); manual hauls still refuse while
  locked; runaways never relock; a grab — VR or desktop — clears a
  pending relock, so nothing relocks under a live hand. NOTE FOR THE
  OWNER: LOCK no longer makes a line refuse cues/group calls — say so
  if that reads wrong. The seam check earned its keep twice here: the
  desktop grab was missing the handover the VR grab had, and a lock
  test crashed on the traveler rope (no lever) only once both branches
  were merged.
- **[#28](https://github.com/Jackscreations21/gms-theater-game/pull/28)
  — the traveler hand line.** A small rope loop just offstage of the
  arch, stage right, on every stage with a house curtain hung: the
  front run pulled down slides the curtain OPEN out to both sides, the
  back run closes it, 2.5m of rope for the full travel. While held it
  writes `ls.open` AND `ls.travTarget` so the p3 animator never fights
  the hand; no lock, no runaway — let go and the curtain stays. Board
  OPEN/CLOSE untouched.
- **[#29](https://github.com/Jackscreations21/gms-theater-game/pull/29)
  — the FOH bar.** The six house-front lanterns hang on a steel pipe
  with drop wires (one `buildRig`, so all three theatres get it),
  raised and lowered from BOTH boards — a FOH BAR tfoot row on the
  desktop fly panel, a RAISE/LOWER pair on the VR fly page — 1.2m a
  press at 0.4 m/s, aims held so the lanterns tilt to keep their
  focus, per-stage park/restore via the p2k pattern, per-house floor
  clamp.

New headset questions from this round, for the step-zero list: does
the locked-at-rest rail read right (all red handles upright until you
pull one out); does the traveler rope fall to hand at the proscenium
and does the curtain answer it believably; does the FOH bar read as a
real position over the stalls, and is watching it travel from the
stalls comfortable; and at the rail, mind the frame rate again — #28
adds ~7 meshes per stage and #29 ~9, small but real.

**Session closed 2026-08-07: everything above is ON `main`.** The owner
merged #21–#30 the same day, `main` rebuilds byte-identical, 12/12
suites green on the merged result. Nothing is in flight.

**Done 2026-08-07, the rig/warehouse session (PRs #32–#35 — open as of
this writing; check they merged before building on them; they merge
clean in ANY order, seam-checked both ways, 13/13 on the combination).**
The owner deferred the VR build feature — "we have to do some other
things first" — and asked for six things. The spec is
`docs/superpowers/specs/2026-08-07-rig-warehouse-design.md` (approved,
five rulings inline — READ IT before touching any of this), the plan
for the first four is `docs/superpowers/plans/2026-08-07-rig-warehouse-prs1-4.md`,
and those four are built:

- **[#32](https://github.com/Jackscreations21/gms-theater-game/pull/32)
  — the FOH fix.** `wireTop` was one hard-coded 15.8 — Arc-sized; the
  Palace ceiling over the bar is 24.6 (`D.ceilY`), so its wires stopped
  8.8m short. `buildRig` now defaults to `D.ceilY` and `buildArcStage`
  overrides per house (15.8, re-posed). `FOHBAR.min` floor+3.2 → +2.0
  in all three houses: the lanterns come to chest height, the point
  being PR 5 makes them takeable. The full14 "below heads" test asserts
  the NEW rule now (to hand, pipe never on the floor). This PR also
  carries the spec and plan docs.
- **[#33](https://github.com/Jackscreations21/gms-theater-game/pull/33)
  — real lantern bodies.** The five p4 builders are real lanterns
  (barrel/gate/shutter handles, barn doors, gel frames, C-clamps),
  every geometry built once and shared (`FIXG` cache), lens materials
  cached (`LENSM` — shared, so never tint one per fixture;
  `userData.lens` is write-only today). Every body carries
  `userData.clamp` for PR 5. `buildRig` is byte-identical to before:
  **PAR is stocked, not hung** — no rig hangs one, the tests build one
  directly via `bodyPar()`, and the patch stays 25 channels.
- **[#34](https://github.com/Jackscreations21/gms-theater-game/pull/34)
  — speaker bars.** L+R flown PA per stage (short pipe, two wires,
  three boxes) at x ±(procW/2+1.6), z 2.8, home 9.4 — the FOH-bar
  pattern run twice: `SPKBARS` parked by p2k, SPK BAR L/R tfoot rows on
  the desktop fly panel, RAISE/LOWER pairs on the VR fly page at pixel
  y 312/366/448/502 (vr.js pins them by literal pixel — do not shift
  them, same trap as the FOH pair). No audio (RULING B). Boxes are
  static meshes until PR 5.
- **[#35](https://github.com/Jackscreations21/gms-theater-game/pull/35)
  — the warehouses.** A shed behind each venue — the first geometry
  that has EVER stood behind either back wall. Palace: doorway cut in
  the p2b brick wall at x=0, roller door, `shedP` [E] station, a
  fourth portal-culled room (`'shed'`, a z-slab past `D.backWall−0.7`).
  Arc: one shared shed behind both houses, a rear roller door per
  house (`mainRear`/`studioRear`, in each house's door UI);
  `arcRoomAt` answers `'shed'` BEFORE the main/studio sign test and
  `stageAt` returns null there, so crossing the shed's width does NOT
  swap the board — the foyer ruling. One 6-slot pushcart per shed,
  VR-only: squeeze the handle and it rolls through the SAME wall
  predicates the player walks against, nearest-wins against ropes and
  levers. Carts are venue-level on purpose (palace: `world` +
  `roomForce 'shared'`; arc: `ARC.group`) — review caught them
  vanishing in front of you when their shed room culled. Racks carry
  32 slot anchors per shed, waiting for PR 5. New 13th suite:
  `tests/warehouse.js`; probe: `tools/warehouse.js`.

Process notes that earned their keep: #33/#34/#35 by parallel worktree
agents with TWO-STAGE review (spec compliance, then quality) — the
reviews caught an agent quietly adding two PAR channels to make a test
pass (reverted: scope), the cart room-cull vanish, and a pitch-black
Arc shed (both sheds now carry dock-style keep lights). New trick,
keep it: give each branch a DIFFERENT insertion anchor in shared test
files (top / middle / end of the stages.js probe) — four branches,
zero textual conflicts.

**Done 2026-08-07, the detach/ordering session (PRs #37, #38 — #37
merged same day; #38 open as of this writing, check it merged before
building on it).** The rig/warehouse feature set is COMPLETE. Plan:
`docs/superpowers/plans/2026-08-07-detach-ordering-prs5-6.md`. Two
owner asks folded into #37: the speaker arrays went to SIX boxes per
side (was 3, J-array toe-in) and every box detaches individually.

- **[#37](https://github.com/Jackscreations21/gms-theater-game/pull/37)
  — the detach system** (spec §3+§4). Every FIXTURES record IS a
  hanging POINT; `BODIES` is the venue-level registry
  (hung / held / slotted / loose). An empty point's channel is DEAD via
  ONE gate — p4 `updateRig`, `lvl = f.body ? clamp(...)*master : 0`
  (the choke point is **p4:554** now, NOT ~418 — #34 moved it) — never
  via `visible`. RULING A holds: any lantern body answers whatever the
  point is patched as; speaker points take only PA boxes. The grab
  extends `vrSqueeze` nearest-wins (bodies 0.35 vs ropes 0.32 vs levers
  0.12 vs carts 0.30); held bodies follow the grip KINEMATICALLY, never
  re-parented to the hand, so `vrOnEnd`/`vrClearRopes` dropping the
  record cold is safe — `updateBodies` (p4) demotes and settles them.
  Release snaps: empty live point (0.4) → slot (0.4) → floor.
  **`vrClearRopes` now opens only ROPE holds** — a carried body or cart
  survives the stage walk (the Main→Studio carry the spec wanted).
- **[#38](https://github.com/Jackscreations21/gms-theater-game/pull/38)
  — ordering** (spec §6). A wall supply screen per shed (own canvas,
  own pixel hit list, `p.obj.userData.orderScreen` branch in
  `vrSelect`; screens build in `vrBuildOrderScreens`, called from
  `vrBuildDesks`). ORDER → ~30s (GAME time in `updateSheds`, never
  setTimeout — M7) → loaded pallet at the apron, six slots in the snap
  scan. RULING C free; D one pending per shed, pallet self-clears ~5s
  after emptied; E 24 loose bodies per venue → STOCK FULL. New 14th
  suite `tests/orders.js`.

Every new assertion (13 in #37, 6 in #38) verified to FAIL against the
pre-change build. #38 was built ON #37's branch and opened only after
#37 merged (rebase → retest → open): the clean way to ship dependent
PRs without stacking.

**Done 2026-08-07, the build-system session begins — THE VR BUILD
FEATURE HAS A SPEC NOW.** The owner specified it live: physically build
scenery from wood — order it, forklift the pallets, cut on shed saws,
nail with a gun / pull with a hammer, paint, hinges that swing, track
that slides, and the game's FIRST SAVE SYSTEM. Spec (rulings F–J
inline — read it before touching any of this):
`docs/superpowers/specs/2026-08-07-build-system-design.md`. Plan, all
seven PRs: `docs/superpowers/plans/2026-08-07-build-system-prs1-7.md`.
Built SOLO and STRICTLY SEQUENTIAL (owner's token ruling; the PRs are
a dependency chain on p9/p4c/p2m — do not parallelize them).

- **PR 1 (branch `build-ordering`, carries spec+plan) — ordering knows
  wood.** New part `src/p4c.txt` (after p4 in build.sh): wood as
  PARAMETRIC bodies — one shared unit BoxGeometry for every piece of
  every profile (sheet/2x4/4x4/2x8, all born 8ft), scaled per piece,
  six material slots per mesh from the color-keyed `WOODM` cache; a
  cut must NEVER mint geometry (spec invariant). Hardware (hinge /
  track / carriage) and paint cans (10-color `PAINT_COLORS`, band
  material from the same cache) are bodies too. `canHang` refuses
  build kinds (wood joins assemblies, PR 3 — never a patch point).
  Ordering: `ORDERS[v]` is now `{pending:[], pallets:[]}` — RULING D'
  is THREE orders out per shed, `ORDER_MAX` 12 units, pallets lay
  their anchors FROM the manifest (sheets flat-stack, long stock in
  columns, smalls on seats) at one of three apron spots. `BUILD_CAP`
  150 build pieces per venue (p4c, shown on the glass as PIECES
  n/150, refusal 'PIECES FULL'); gear keeps its own 24 book —
  `venueLooseCount` now skips build kinds. The screen grew a tab
  strip (GEAR/WOOD/HDWE/PAINT, rows at y=112 pitch 48 — vr.js pins
  the first + at px 468,132; sc.counts starts EMPTY, `|| 0` your
  reads). New 15th suite `tests/build.js`; every new assertion
  negative-checked (whole-suite vs main's build; the canHang guard
  by rebuild-without-it).

- **PR 2 (branch `build-forklift`, built on PR 1's branch — open it
  only after PR 1 merges, rebase first) — the forklift.** RULING H:
  walk-behind. `buildLift` in p2m parks one per shed; the record lives
  in `LIFTS[venue]` AND in `CARTS[venue+'Lift']`, so the p9 cart grab /
  chase / wall machinery drives it with NO fork of the arbitration —
  the only p9 additions are the toast and the fork stick (RIGHT stick
  Y while held; rx is turn, lx/ly walk — ry was free). `updateLifts`
  (called from `updateSheds`): forks crossing y=0.13 upward under a
  pallet's boards take it (`forks.attach`, spot freed); forks lowered
  home while riding set it down — snapped to the nearest `PALLET_SLOTS`
  paint within 0.6 (4 per shed, 2 per stage wing, palace west wall /
  wings ±16.5 z −15.5; arc shed ±31/±16 z −52 + per-house wings), else
  flat where it stands via `groundAt`. Pallets reparent by `attach()`
  only — venue root when down (they LEAVE the shed now; the old
  shed-group cull note is dead), fork group when riding.

- **PR 3 (branch `build-tools`, on PR 2's branch) — the toolbelt and
  the joints, the CORE.** New in p9: `VR.tools[hand]` — tools are a
  slot of their own so `VR.held` stays the single world hold it always
  was; one hand carries the plank, the other works the gun. Belt rides
  the hips (`vrUpdateBelt`, camera x/z − 0.72, head yaw); squeeze at a
  holster draws, open hand ANYWHERE holsters (tools cannot be lost);
  the trigger of a tool hand IS the tool (vrSelect head). p4c:
  `ASSEMBLIES` (root Group at venue root, pieces, nails as DATA);
  RULING G is `asmJoints` — one nail → a pivot group at the nail
  (grab = kind `'swing'`, hand drives the angle), two+ → rigid; the
  hammer (`removeNail`) is the only way apart; a piece at zero nails
  demotes to loose. Anchors ride their nails: 'deck' pins the root
  (grab refuses), 'pipe' hangs the root off `ls.group` so it FLIES —
  `ls.asmH` (asmHangDepth) extends p3 `minTrimOf`, so a flown flat
  floors at the deck (#15's rule; the negative check here caught a
  WEAK TEST first — on a dressed pipe the goods clamp masks the built
  clamp; the test now uses the barest pipe and pins the movement).
  The ghost snap (`snapWood`): held wood turns with the wrist
  (`relQ`), then squares to offered wood (yaw 45s, pitch/roll 90s,
  faces flush via |R|·h), the deck, or a live pipe; `VR.snap` is the
  standing offer and the gun confirms it. `snapAsm` makes the same
  offer for a carried assembly (no re-orientation). Tape: other hand
  takes the tab, ft-in on the label (`ftIn`), trigger marks
  `body.tick` for the saw fences (PR 4). Wood settles FLAT now —
  `b.restH` (woodRestH) replaces the lantern 0.25 in updateBodies.
  Watch for: `vrTapeLine` had to grow its OWN temps — callers pass
  the shared `_vecA` in as an argument (aliasing bit once already).

- **PR 4 (branch `build-saws`, on PR 3's branch) — the saws.** One
  station pair per shed (geometry in p2m `buildSaw`, logic in p4c): a
  TRACK TABLE (sheets only) and a CHOP BENCH (lumber only, 90°). One
  mechanic for both: wood released over a station SEATS (`seatWood` —
  length along table X, sheets keep whichever axis the hand offered,
  `'seated'` pieces never settle and `grabBody` unfiles them); the
  CUTTER is a sixth grab class (0.28, nearest-wins extended — bod /
  cart / lever / rope / saw all cross-check now); sliding it snaps to
  the INCH with a tape tick (body.tick) snapping FIRST (`sawSetCut`);
  the trigger with the cutter in hand cuts whichever piece lies under
  the blade (`sawCut`) — one body re-scaled, one registered, paint
  rides both (copied material array, shared entries), a side under
  six inches is scrap and vanishes, cuts at the piece cap are legal
  (the screen is the enforcement point). vrLabel is the readout —
  no per-station canvases.

- **PR 5 (branch `build-paint`, on PR 4's branch) — paint.** A rack
  per shed (`buildRack` in p2m, logic p4c): open cans for the colors
  the shed OWNS (four stock; a delivered can released within 1.8 of
  the rack pours in as a new color and the body is consumed —
  `rackTakeCan`), and ONE roller — a seventh grab class, parented to
  the controller ON PURPOSE (the one carried thing that is): release
  ALWAYS re-racks it (`vrReRack`), including from `vrOnEnd` BEFORE the
  hold record drops. Dip = hold the head within 0.16 of a can (tints
  the head); trigger = `paintWood`: sheets take the touched FACE (box
  material-group order px nx py ny pz nz, computed in unit-box local
  coords — worldToLocal already divides out the scale), lumber
  whole-piece; every entry from the WOODM cache, repaint is a pointer
  swap. Cans never run out (RULING C's spirit).

- **PR 6 (branch `build-hinges`, on PR 5's branch) — hinges & track.**
  A HINGE is a NAIL THAT SWINGS: hold the hinge body at the seam
  between a LOOSE piece and its neighbour, fire the gun — `addHinge`
  consumes the body into a range-limited (±90°) pivot whose axis is
  the hinge's OWN PIN (you place it the way it should swing); nail
  the door shut later and it goes rigid, hammer that nail and it
  swings again, hammer the HINGE and the body respawns loose. TRACK:
  held sections snap to a run's end (or the deck) and the gun lays
  them (`layTrack`) — one deck-anchored assembly per run, `a.track.n`
  sections along root-local X; a carriage released onto the run RIDES
  it (`rideTrack` — a slider Group: the pivot pattern with
  translation); wood gun-nailed to the carriage mounts UNDER the
  slider; grabbing any of it is a `'slide'` hold, hard stops at the
  ends (`slideTo`); the hammer pops an EMPTY carriage. `asmJoints`
  learned the difference: world nails (deck/pipe) and carriage nails
  never pivot — only piece-to-piece singles and hinges swing.

- **PR 7 (branch `build-save`, on PR 6's branch) — the save system,
  the game's FIRST.** All in p4c: `buildSerialize` → localStorage
  (`house.build`, versioned) → `buildLoad` at the p7 boot tail, which
  REPLAYS the same functions the hands use (makeSerBody → asmAdopt →
  addNail → layTrack → rideTrack), so the loaded world obeys every
  rule the built one did. Saved: build bodies everywhere (pose, dims,
  per-face paint by hex — the WOODM cache re-keys), shed/cart slot
  addresses, saw seats, assemblies (world-posed pieces, nails, hinges
  with ranges, deck/pipe anchors — pipes addressed as {stage, fly
  index} via `lsAddress`/`lsResolve`), track runs re-laid n-long with
  riders and their mounts, pallets with per-slot loads, pending
  orders with time left, rack colors, lift poses. NOT saved (spec):
  shows, cues, fly positions, patch. Dirty writes flush ≤1s; a 10s
  heartbeat backstops any missed dirty call. Load is wrapped WHOLE:
  any throw (bad JSON, alien version) clears the key and boots empty.
  CLEAR SAVE button on the order-screen footer wipes STORAGE only.
  The test is a true round trip: `build.js` boots a SECOND jsdom
  world seeded with the first one's save (needs `url:` on JSDOM —
  about:blank has no localStorage) and asserts it all came back.
  Known drift, accepted: a swung pivot reloads at its swung POSE but
  its stops re-baseline there (range measures from the reloaded
  pose); pipe-anchored work reloads at saved world pose whatever trim
  the pipe wakes at (fly positions are not saved, by spec).

**THE BUILD SYSTEM IS FULLY ON `main` (2026-08-07, same day):** all
seven PRs merged in order — #40 ordering, #41 forklift, #42 toolbelt,
#43 saws, #44 paint, #45 hinges & track, #46 save — each one rebased
onto the fresh `main`, retested 15/15, opened only after its parent
merged. Post-merge verification: `main` rebuilds byte-identical,
15/15 on the merged result, all seven work branches deleted local and
remote. The game on Pages now carries the whole feature; bust the
Quest cache with `?v=9`.

**Done 2026-08-07, the build-usability round (PRs #48–#51 — ALL
MERGED same day).** The owner's first bug list, straight off the
first headset run of the build system, four asks in one line: grab
the wood from anywhere on the wood; a table for building on; wood
auto-detects other wood and finds the best connection; "i wasnt able
to get the nail gun to work" (he laid two pieces together on the
ground and pulled the trigger — the gun only confirmed a ghost offer
on a HELD piece, so the natural move did nothing).  Specced first
(`docs/superpowers/specs/2026-08-07-build-usability-design.md`,
RULING K inline: the table is orderable and movable, and never takes
a nail), planned (`docs/superpowers/plans/2026-08-07-build-usability-
prs1-2.md` + addendum), then shipped failing-test-first, one concern
per PR, each branch cut after its parent merged:

- **[#48](https://github.com/Jackscreations21/gms-theater-game/pull/48)
  — grab wood by its SURFACE, not its centre.** The vrSqueeze body
  loop measured hand-to-centre against 0.35, so an 8ft stick was
  grabbable only across its middle 0.7m.  Wood now measures to the
  nearest point on the piece (unit-box local clamp, exact); constant
  `GRAB_WOOD 0.15`.  Sheets gained their corners; a built frame comes
  by any plank end.  Compact bodies keep the centre test.
- **[#49](https://github.com/Jackscreations21/gms-theater-game/pull/49)
  — the gun fires into a SEAM.** With no held offer standing, the
  trigger seeks the nearest touching wood pair within `SEAM_REACH
  0.45` of the muzzle (OBB touch on the target's axes, `SEAM_TOUCH
  0.05`) and drives the nail at the contact; addNail already knew how
  to join any mix of loose and fixed.  A throttled seek floats
  TRIGGER TO NAIL at a reachable seam while the gun is in hand.
  Same-assembly pairs stay nailable on purpose (that is how a
  swinging piece is nailed rigid).  Precedence: hinge in the other
  hand → held ghost offer → seam → refusal.
- **[#50](https://github.com/Jackscreations21/gms-theater-game/pull/50)
  — snapWood rebuilt.** The old step 1 picked targets by CENTRE
  distance ≤1.4 (end-to-end 8ft butts have centres 2.48m apart — they
  could NEVER see each other), picked its axis with no overlap test,
  and mixed unit-box coordinates with metric flush distances.  Now:
  candidates by surface gap (`SNAP_SEEK 0.35`), a face is a joint
  only if the cross axes overlap (`SNAP_SLACK 0.08`), daylight axes
  beat overlapped ones, smallest flush error ≤ `SNAP_OFFER 0.22`
  wins, all metric.  Ghost/quantize/gun-confirm contract untouched.
- **[#51](https://github.com/Jackscreations21/gms-theater-game/pull/51)
  — the WORK TABLE (RULING K).** A build kind on the HDWE tab:
  pallet-delivered, carried like a body, lands square on release
  (upright, yaw to 45).  Its top (`TABLE_TOP 0.925`) is a raised
  piece of deck — loose stock settles ONTO it (`tableTopAt`, asked by
  updateBodies before the floor), held wood is offered flat ON it
  (snapWood step 2a), the gun refuses the table target with its own
  toast; you build on it and carry the work off whole.  Counts
  against BUILD_CAP, canHang refuses it, rides the save for free
  (serBody is generic by kind).  EN ROUTE, a latent bug: the deck
  offer passed `_aq2` into snapQuantize, whose FIRST LINE overwrites
  `_aq2` — rel came out identity and every "lie flat" offer stood the
  piece bolt upright.  Both flat offers now use a real identity quat
  (`_IDQ`).  The aliasing trap strikes again — never hand a shared
  temp to a function that writes it.

Post-merge verification done: `main` rebuilds byte-identical, 15/15
on the merged result, all four work branches deleted local and
remote.  Pages carries it all — bust the Quest cache with `?v=10`.
Ten new regression tests across vr.js and build.js, every one
verified failing against its pre-change build.

**Done 2026-08-08, the build-feel round — the owner's second headset
list, nine asks, nine PRs, ALL MERGED (#53, #55–#62; #54 the handoff).**
Spec (rulings L–S inline — READ IT before touching any of this):
`docs/superpowers/specs/2026-08-08-build-feel-round-design.md`; plan:
`docs/superpowers/plans/2026-08-08-build-feel-prs1-9.md`.  Landed one
at a time, each branch rebased onto fresh `main` after its parent
merged, rebuilt and 15/15 before opening — the linear-chain discipline
that replaces stacking.  Post-merge: `main` rebuilds byte-identical,
15/15 on the merged result, work branches deleted.  What went in:

1. `feel-carry` = **#53** — wood rides IN the hand: the hold keeps
   the pose relative to the CONTROLLER (relQ + grabV, the grabbed
   point metric in the piece's frame); the wrist pivots about the
   palm, not about a centre four feet up the stick.  Lanterns keep
   the fixed centre carry.  Carries the spec+plan docs.
2. `feel-table` — the table was never immovable, it was UNGRABBABLE:
   the 0.35 test measured to its origin, which is its FEET on the
   floor under the middle of the top.  It now grabs by its frame box
   (RULING Q) and carries grip-relative; #51's square landing is
   re-pinned.
3. `feel-45` — held wood squares to the 45° grid on all three axes
   about the grab point; HOLD X frees it (`VR.btnX`, read in
   vrReadSticks, guarded for 4-button pads); a snapWood offer
   overrides both (RULING M).
4. `feel-freeze` — Y parks the held piece exactly where it is, mid-air
   included (`b.frozen`, RULING N): updateBodies skips it, grabBody
   and asmAdopt clear it, `fz:1` rides the save.  A parked piece is a
   legal snap target ON PURPOSE — park it, build against it.
5. `feel-nail-ray` — nails go where the gun POINTS (RULING L):
   `nailRay` (p4c) casts the muzzle ray 1.2m, drives the nail at the
   hit spot, partners with the piece touching there (or the nearest
   seam ON the hit piece within SEAM_REACH); lone wood refuses
   ("nothing behind it to bite"), NO cosmetic nails; a ray that hits
   nothing falls back to #49's muzzle seam.  Label = same cast.
6. `feel-compass` — the stick walks where the LEFT CONTROLLER points
   (`vrMoveYaw`, RULING O); keyboard and FLYING unchanged; ~14° of
   vertical falls back to headset yaw.
7. `feel-trash` — a steel drum by each shed's rack (`buildTrash`,
   p2m; `TRASH` in p4c): any held BUILD body released with its centre
   over the mouth is destroyed; DELETE ALL WOOD on the order screen
   footer (stacked under CLEAR SAVE, both 196×25 now) empties the
   venue's wood through `removeBody`/`deleteAllWood` — installed
   hinges respawn as hardware, bare track runs stand, gear untouched,
   a piece in a live hand skipped (RULING P).
8. `feel-paint-signs` — painting says how it works: `vrPaintLabel`
   floats SQUEEZE TO TAKE THE ROLLER / DIP THE HEAD IN A CAN /
   TRIGGER TO PAINT at the right moments; the PAINT tab's idle line
   is the two-line how-to.
9. `feel-ftin` — every player-facing LENGTH readout through `ftIn()`
   (RULING S): desktop fly rows + toasts, FOH/SPK rows, VR fly page,
   "bars in".  The MODEL stays metric — this was formatting, not a
   unit migration.  Two old tests that parsed the display were
   updated to compare the formatter's string of the model.

Process notes: ~14 new regression tests, every one verified failing
against its pre-change build (the freeze save-leg at the exact
midpoint: runtime in, serialization not).  The chain tip passed all
fifteen suites, which IS the seam check for a linear chain.  One
trap re-confirmed: a regex literal inside a test PROBE template
loses its backslashes (`/\d/` arrives as `/d/`) — build regexes from
doubled-backslash strings there (full14's ft-in test).

**Done 2026-08-08, the goods round — two asks, two PRs, both merged
(#63, #64).**  Spec (rulings T–W):
`docs/superpowers/specs/2026-08-08-goods-round-design.md`.

- **[#63](https://github.com/Jackscreations21/gms-theater-game/pull/63)
  — the roller paints the goods** (RULING T).  Cloth as well as wood,
  and WHOLE: a pull against any cloth on a lineset colours every cloth
  on that lineset (both halves of a house curtain, both legs of a
  pair).  The trap it is written around: `M.serge` and `M.velour` (p2)
  are ONE material object each, shared by every border, leg, half leg
  and house curtain on ALL THREE stages plus the Arc's dressing and
  the Cornley velvet — tinting one would have repainted the masking of
  the whole game.  So paint clones through `GOODSM`, keyed by the
  ORIGINAL base plus the colour (`userData.goodsBase` stops
  clone-of-clone chains): repaint is a pointer swap, two pipes the
  same colour share one material.  **The WOODM/LENSM lesson, third
  time — if you add any paintable class, do it this way.**  Reach is
  to the goods' BOUNDING BOX (a 13m curtain's centre is five metres
  up — the 8ft-stick bug); wood keeps priority under the roller; only
  `isMeshStandardMaterial` takes a coat, so the chandelier's self-lit
  bulbs stay lit; the paint labels learn goods.
- **[#64](https://github.com/Jackscreations21/gms-theater-game/pull/64)
  — the VR goods picker** (RULINGS U + V).  The fly page's goods cell
  is a button: it opens a per-lineset picker (every `GOODS` entry with
  its weight, current one lit, own BACK) and choosing calls the same
  `hangGoods` the desktop palette calls.  **Hanging rebuilds the rail**
  (`vrBuildRopes`), or a newly hung pipe would have no rope and no
  lock and a stripped one would keep a rope to nowhere.  `vrHit` now
  takes optional META so the picker's regions are findable by meaning
  rather than by pixel (vr.js pinning rows by literal pixel has been a
  trap twice).  **RULING V, a real bug it flushed out:** `minTrimOf`
  (#15) is enforced by everything that MOVES a pipe, and hanging is
  not a move — a 13m house curtain hung on a pipe standing at 2m put
  ten metres of cloth through the stage.  `hangGoods` now lifts a pipe
  that is below its new floor; one with clearance never moves.  This
  fixed the desktop palette too.

**RULING W stands and is the owner's to revisit: the hang is NOT
saved, and neither is its paint.**  The build save deliberately
excludes shows, cues, fly positions and the patch; what is on each
pipe belongs with those.  Saving paint without the hang under it would
be incoherent.  If the owner wants persistence, save the hang (key per
lineset per stage) AND its paint together in the same versioned blob —
its own small round, not a bolt-on.

**Done 2026-08-08, the carpenters round — spec #68, PRs #69–#73,
landed via #74.**  (The chain lesson, so it is on the record: the
owner waived never-stack and the four chain PRs were opened at once,
each targeting its parent; on merge day #71–#73 were merged INTO
their parent branches instead of being retargeted to `main` after
each parent landed, so `main` briefly held only PRs 1–2 and #74
carried the verified chain tip across.  Never-stack earned its keep.)
RULINGS X–AC — after Z the letters double.  What shipped:

- **The crayon** (#69, RULING Z): fourth belt tool at the small of
  the back (0/-0.17 — every holster pair beyond the 0.22 draw radius,
  first-in-range wins); forward ray at `WALKABLE`, ankle-height
  floors only — the y≈8 gallery AND a loaded show's y=0.3 floor both
  refuse: the crayon wants the BARE deck.  One mark stands; re-fire
  moves it; palletSlot-style paint, `-ARC.X` corrected, yaw from the
  controller's facing.
- **The catalogue and planner** (#70, RULING Y): new part `p6c`
  between `p6b` and `p5c`; `CARP_CAT` (4x8 FLAT / 4x8 PLATFORM /
  2-STEP UNIT) with inch-grid cut schedules and mark-local
  blueprints, two nails per joint (RULING G — carpenters build
  rigid); `carpSurvey`; `carpPlan` PURE — NEED list, or PIECES FULL
  counting the bodies the cuts will MINT (a new cap enforcement
  point: nothing downstream of the order screen checked it), or the
  phased job queue.  16th suite `tests/carp.js`.
- **The lead and the saws** (#71, RULINGS AA + AC): the seventh
  figure — apron, no cap, `trade:'carpenter'`, always `people[6]`;
  trade guards BEFORE the queue shift so the head job waits for the
  right person; REAL carry (`attach` both ways, the new `'carried'`
  state — `'held'` demotes to loose every frame and would sink the
  plank out of the walking arms); `carpFetch`/`carpCut` through
  `seatWood`/`sawSetCut`/`sawCut` with a pencil tick so scheduled
  lengths beat the saw's 0.01 seat offset; `CARP_RUN` records what
  each cut kept.
- **The haul and the nails** (#72, RULINGS AB + AC): the six hands
  wake for the run; ONE piece per trip to the mark (poses composed
  through the mark's yaw); both blueprint nails per joint via
  `addNail` on live transforms; NO deck nail — the finished piece
  lies un-anchored and grabbable at the mark; `restH` carries the
  stack (the settle cannot see wood under wood); the work rides the
  save with zero new save code (round-tripped in a second world);
  a stood-down run leaves honest workshop state and the CALL itself
  is not saved.
- **The CARPENTERS screen** (#73, RULING X): a second wall panel
  beside each shed's order screen (the order canvas is pixel-pinned
  by tests and UNTOUCHED); META hits only; the selected row's live
  verdict off the pure planner; refusals in spec order — PICK A
  PIECE / NO MARK / MARK IS IN THE OTHER HOUSE / CREW BUSY /
  NEED 1× SHEET · 3× 2x4 / PIECES FULL; a called build runs under
  the show crew's work light.

Built by four sequential agents on a reviewed linear chain — every
link 16/16 green with the suites re-run independently, every new
assertion negative-checked, six new TRAPS.md entries (the crew /
carpenters section).  **NONE of it has met hardware** — the new
question block rides the headset section below.

**Done 2026-08-08, housekeeping — a stale clone caught up, and the
branch list swept.**  No game code changed.  A second working copy was
still parked on `handoff-carpenters` with its `main` at `4986f25`,
**nineteen commits behind**: the entire carpenters round, `STATE.md`
and the `docs/guide/` system had all landed from another machine while
that clone sat still.  Fast-forwarded to `origin/main` @ `b22c299`
(clean, no divergence, nothing local discarded) and verified the
standing rule — `sh build.sh` reproduces the committed
`the-house.html` byte for byte (`built 850229 bytes syntax OK`).

Then the sweep: the three `.claude/worktrees/agent-*` worktrees from
the rig/warehouse round removed (each checked clean first, then
`git worktree prune`), and the **sixteen** fully-merged local branches
deleted — the thirteen feature/handoff branches plus the three
`worktree-agent-*` pointers.  `git branch --no-merged origin/main` was
empty beforehand and `-d` was used throughout, so git itself was the
backstop.  `main` is now the only local branch.

**The lesson, which is the reason this is in the record at all: fetch
and compare before trusting a local checkout — or a handoff — about
what comes next.**  This clone, and the session memory that went with
it, both confidently said "NEXT = CARPENTERS" for a round that had
already shipped.  `git log main..origin/main` is the first move of any
session that did not personally watch the last one land.

Left deliberately undone: `origin` still carries ~40 merged branches
(`carp-*`, `feel-*`, the `handoff-*` series and every older feature
branch).  Local pruning is private; deleting them on GitHub changes
what everyone else sees, so it stays the owner's call — the suggestion
if it happens is to keep `carpenters-landing` and the `handoff-*`
series as the round record and prune the rest.  `pr6.json` is still
untracked, still unruled.

**Done 2026-08-08, the first headset findings — and CARPENTERS PHASE 2,
specced and built the same session (PRs #76–#79, all merged).**

The headset finally went on, and two things came back.

**"there is no but to open iether of the garages in the arc theaters"**
— true, and worse than it read. Every one of the Arc's eight doors
opened ONLY from the DOM panel (`p7`, `#arcDoorList`), and the two
warehouse rollers are the ONLY way into the Arc shed — so in VR the
whole shed was unreachable: order screen, carpenters screen, both saws,
paint rack, trash drum, forklift, cart. The Palace was never affected
because its shed door carries an `[E]` station and the VR trigger runs
the same `pickAll` → `describe` → `useInfo` chain the desktop crosshair
does. [#76](https://github.com/Jackscreations21/gms-theater-game/pull/76)
puts a control box on the stage side of each rear door (0.8m clear of
the opening, at hand height, filed with the HOUSE room because the shed
room can be culled from where you stand) and one `arcDoor:<key>` branch
in `useStation`, keyed off `ARC.doorMap` so any Arc door that grows a
control later needs no branch of its own. **The other six Arc doors are
still DOM-only** — deliberately left, one branch away.

**"i cant find the screen for the carpenters in iether warhouse"** — the
Arc half was the bug above. In the Palace the screen was where it
should be: a probe on the committed build put it at (9.1, 1.7, −30.1),
1.7m to the RIGHT of the order glass on the same wall, and the deployed
Pages file was byte-identical to `main`. The owner confirmed the build
was current (the crayon was on his belt), so it was a finding-it
problem, not a missing-it one.

**Then phase 2**, off four asks: build several things at once; a flat
with a door hole; one with a window hole; flats with or without the
sheets — plus **"it wont let me rotate stuff once it is built"**. Shaped
live: the batch is a LIST worked in order, it STACKS on the one mark,
and the skin is a SWITCH rather than eight catalogue rows. Spec
(RULINGS AD–AH):
`docs/superpowers/specs/2026-08-08-carpenters-phase2-design.md`; plan,
with an as-built section recording five deviations:
`docs/superpowers/plans/2026-08-08-carpenters-phase2-prs1-4.md`.

- **[#78](https://github.com/Jackscreations21/gms-theater-game/pull/78)
  — RULING AD: a built assembly turns in the hand.** The `asm` hold
  copied `position` and never touched the root's quaternion; loose wood
  got the grip-relative carry and the 45° grid in build-feel #53, the
  `asm` hold got neither. And the carpenters assemble LYING FLAT
  (RULING AC) — so every flat they had ever built was stuck face-up on
  the deck for good. It now takes `relQ` + `grabV` exactly as a plank
  does, squares to 45° unless X is held, and `snapAsm` is untouched: it
  still offers only the drop, never a re-orientation.
- **[#79](https://github.com/Jackscreations21/gms-theater-game/pull/79)
  — the rip, the two new rows, and the build list**, three commits:
  - **RULING AE's mechanism.** A sheet can never have a hole cut in it
    (parametric wood; a cut must not mint geometry), so an opening is
    FRAMED and skinned in pieces AROUND it. The saws already rip —
    `dims {L, W}`, `seatWood` reads the offered axis, `sawCut` writes
    either dimension — only the schedule could not ask, because
    `carpCut` seated every sheet `'L'`. A cut entry now names its axis;
    two entries may name one stick; a second entry wanting it turned
    emits a fetch with no body, meaning *re-seat what is on that bench*.
  - **The DOOR FLAT and WINDOW FLAT** (30×80″ and 30×36″ openings, the
    window's sill 36″ up), each framed with two 89″ jambs and a 30″
    header (**RULING AE amended mid-build**: the original 41″ header
    made the jambs 76.5″, and the saw snaps to the inch). Both skins
    come out of ONE sheet each — the check that the schedules are
    honest — and both leftovers go back as stock, not scrap. **SKIN is
    a switch on the CALL** (RULING AF) via `carpParts(row, skin)`, one
    pure helper the planner and the glass share; piece INDICES never
    move, so a dropped piece leaves a hole in the numbering and
    `flat4x8` never had to be reordered.
  - **The build LIST** (AG + AH): a count per row, one CALL, worked in
    order and stacked on the one mark (RULING Z stands — `restH`
    already carries a stack). Stock and cap are judged for the WHOLE
    list before a single cut, and piece indices are offset per item or
    item two's piece 0 overwrites item one's.

Every new assertion negative-checked **against its own parent build**,
not just against `main`, so each link genuinely fails before its fix.
16/16 at every link and at the tip. Post-merge: all four PRs merged
with `base=main` (the #71–#73 mishap did not repeat), `main`'s tree
identical to the tested branch, byte-identical rebuild (873188),
`"fatal": null`, and Pages already serving the same bytes. **Bust the
Quest cache with `?v=13`** — the game changed twice that day.

One real bug the work flushed out, now in TRAPS: `carpCut` decides
whether to keep the remainder seated by peeking at `CREW.jobs[0]`, and
it only knew about another `carpCut` — so the re-seat that turns a
sheet round to rip it found an empty bench and both skin strips
silently went missing (8 pieces instead of 10, no error anywhere).

**Done 2026-08-09, the geometry review — and the draw call it turned up
([#81](https://github.com/Jackscreations21/gms-theater-game/pull/81),
OPEN as of this writing; check it merged before building on it).**

The owner had the object system reviewed from outside. **Verdict: keep
polygon meshes — no voxels, no SDF/raymarching, no CSG-first
architecture**, and it rated the current approach 8.5/10 for this kind
of game. That verdict is accepted and is the standing answer if the
question comes round again. Three things about it are worth the record,
because the review was working off the file rather than this document:

- **Its CSG condition is already met, and the answer is still no.**
  "Only if players start cutting holes in scenery or constructing
  custom geometry" describes the build system exactly, and phase 2
  shipped a DOOR FLAT and a WINDOW FLAT the day before. We already
  ruled on it: RULING AE frames and skins AROUND an opening because a
  cut must never mint geometry — which is also how a real flat is
  built, so it reads right at arm's length. And the deeper reason:
  `buildLoad` persists a world by REPLAYING the functions the hands
  use, and a boolean result has no such replay, so it would be
  invisible to the save.
- **Two of its four recommendations were already done.** Seats have
  been instanced since the beginning (1,368 Palace, 1,273 Arc); the
  culling code it noticed IS the r128 instanced-bounding-sphere fix.
  And its "InstancedMesh: 11 uses" counts constructor sites — one of
  them is the `instanced()` helper at `p2.txt:359` with **30 call
  sites**. Geometry reuse is done too, and was learned here as a bug
  three times over (WOODM, LENSM, GOODSM).
- **GLTF stays out for now**, and the reason is priority, not purity:
  it buys visual richness, not frame rate, and the frame-rate question
  is the open one. (The page already pulls three.js off cdnjs with a
  unpkg fallback, so the network dependency is precedent, not a
  blocker — this is a "later", not a "never".)

**Then, costing out the one idea the review did leave open** — merge
nailed wood into a single mesh and un-merge on the hammer — the real
finding turned up, and it was in the file all along:

```js
const mesh = new T.Mesh(WOODG, [m, m, m, m, m, m]);   // the SAME material, six times
```

`BoxGeometry` has six groups and r128 submits **one render item per
group** whenever a material is an array — so six identical entries cost
**six draw calls to draw one bare plank**. 900 for the wood alone at
`BUILD_CAP`, per eye, doubled for stereo. Only a sheet can ever be
patchy (`paintWood` coats lumber whole), so #81 gives a piece ONE
material while its six faces agree and promotes to the six-slot form
only when one differs: 10 pieces 60 → 10 draw calls, 150 pieces
900 → 150, painted sheets unchanged. `woodFaces`/`woodSetFaces` are the
only two functions that know which form a mesh is in, and both COPY
rather than alias (the shared-temp trap, fourth time). **The save format
does not change** — `serBody` still writes six hexes either way, so old
saves load and new saves load on old code.

**THE MERGE ITSELF WAS DEFERRED, deliberately, by the owner** — see the
next section for the gate and for the design work already done on it, so
it can be picked up cold.

One false green found and fixed en route, now in TRAPS: the saw test
painted a face by poking `sheet.mesh.material[2] = red`. On a
single-material mesh that hangs a stray numeric property on the SHARED
cache entry both cut pieces point at, so `material[2] === red` read its
own poke straight back and passed while testing nothing — and polluted
that material for the rest of the run. Nothing ever went red.

**Done 2026-08-09, the workshop round — the belt and the shed made real
(spec #83, PRs #84–#87), and then the settle fix (#88).**

The owner's ask, verbatim: *"make everthing on the tool belt and in the
warhouse look mor realistic (saws, nail gun, tape measure, hammer,
shelves, etc). would it help if i found 3d models for everything and you
just had to scale them and put it in or do you want to do it all
yourself"*

**The models question is answered on the record as RULING AI: no
external assets, ever.** Four reasons, all specific to this repo, so it
does not have to be re-litigated: all seventeen suites boot the whole
file in jsdom and assert on geometry SYNCHRONOUSLY, and `.glb` loading
is async; `GLTFLoader` fetches over XHR, which a `file://` page is
blocked from doing, so double-click-to-open would die; it ends the
one-file property; and free models carry licences a repo that may go
public cannot. What helps instead is **photographs** — the locking rail
reads well because the owner sent a photo of a real one. For this round
the owner delegated judgment, so the headset run is the review.

Spec: `docs/superpowers/specs/2026-08-09-workshop-realism-design.md`
(RULINGS AI–AN). Plan:
`docs/superpowers/plans/2026-08-09-workshop-realism-prs1-4.md`.

- **#84 — the palette, the merge helper, the belt.** `mergeParts()` in
  p2 (r128's core ships no `BufferGeometryUtils`): bake each part's
  transform into its vertices, concatenate, one draw call for a cluster
  of static detail. Six SHARED canvas textures — galvanised, cast iron,
  moulded plastic, rubber grip, chipped hazard yellow, ply — plus a
  cached stencil helper. Then the four tools: a pneumatic framing nailer
  with an angled magazine, depth-adjust nose, contact tip and hose
  fitting; a 20oz framing hammer with a claw and a waffled face; a cased
  tape with a brake button, belt clip and hooked blade; and a
  carpenter's pencil that is actually flat. New 17th suite,
  `tests/workshop.js`.
- **#85 — the cut stations.** A fence, T-slots, stretchers and a real
  saw head with motor, guard and dust port on the track table; a kerf
  plate, feed rollers, pivot boss, motor and handle on the chop bench.
- **#86 — the paint rack, the roller and the drum.** Shelving with
  uprights, brackets, a back rail and drip-stained ply; a roller with a
  grip and crank; a ribbed drum with hoop bands.
- **#87 — the heavy plant.** The forklift becomes a walk-behind pallet
  stacker (mast channels, tie, hydraulic ram, lift chain, tiller control
  head, counterweight); the cart gets gussets, a lower rail, castors
  with yokes and ply deck boards; the racking gets punched uprights,
  beams, braces and footplates.

**The whole point, and it held: every object gained substantial detail
and the set costs 40% FEWER draw calls.** Measured by `tools/census.js`
against the pre-round build, per venue:

| object | before | after |   | object | before | after |
|---|---|---|---|---|---|---|
| nail gun | 3 | 3 | | trash drum | 3 | 2 |
| hammer | 2 | 2 | | track table | 7 | 4 |
| tape | 2 | 2 | | chop bench | 7 | 4 |
| crayon | 2 | 2 | | forklift | 12 | 4 |
| paint rack | 12 | 12 | | pushcart | 13 | 3 |
| | | | | **total** | **63** | **38** |

**RULING AJ is why a sweep this wide was safe: the round was cosmetic
and behaviour was frozen, enforced by every pre-existing suite passing
UNEDITED.** Across all four PRs the only change under `tests/` is the
new `workshop.js` plus one line in `run-all.js`. RULING AL named four
things that must never merge, each with an assertion: the saw `cutter`,
the lift `forks`, the paint `roller.head`, and the cans.

**Then #88, and it is the one that most likely answers "it lags".** The
owner asked for the build feature to lag less. Measured first with a new
probe, `tools/buildload.js`: `updateBodies` cast a recursive raycast AND
scanned the whole body registry for every loose piece every frame —
**including pieces lying perfectly still.** At `BUILD_CAP` that is 150
of each per frame; the probe reported 150 loose bodies and 0 moving.

| loose pieces | before | after |
|---|---|---|
| 25 | 0.259 ms | 0.027 ms |
| 100 | 1.044 ms | 0.096 ms |
| 150 | 1.565 ms | 0.146 ms |

11.3% of a 72Hz budget down to 1.0%, on a desktop; a headset CPU is
several times slower. A settled piece is re-tested on a rota
(`REST_ROTA` 12) spread by body index; `grabBody` wakes its venue, so
the rota is only a backstop and nothing visibly hangs in the air.
`groundAt` also stopped minting two `Vector3`s a call — GC churn, which
reads as hitching rather than slowness, and it was hurting the player's
own movement too.

**Process notes worth keeping.** Three plan defects were found by the
implementing agents ESCALATING rather than working around them, and each
would have shipped a lie: the census probe called `vrBuildBelt()` cold
when `VR.rig` is null outside a session; a muzzle assertion checked
`mesh.position` for geometry that had just been merged to the origin;
and an assertion about paint-can materials was simply wrong about the
data (`canMeshes` holds Groups). The last one is the sharpest — the
tempting "fix" was to merge the can body with its colour band so the
assertion became true, which would have made the whole can take the
paint. **A review of `mergeParts` also found its first four assertions
passed against five deliberately wrong implementations**, including one
that drops a `clone()` and mutates a caller's cached geometry. That is
now a TRAPS entry in its own right: negative-check against a WRONG
implementation, not merely an absent one.

**None of it has met hardware.** New questions ride the headset section.

---

## THE CARPENTERS BRIEF (2026-08-08 — superseded the same day)

Kept for the record; the round above answered it.  The owner's
answers to the five shaping questions: (1) a catalogue on a warehouse
screen; (2) cut at the shed saws, erect at a crayon-marked spot;
(3) real stock; (4) hybrid — hands haul and nail, a lead carpenter
owns the saws; (5) VR only.  Plus: planks visibly carried, one piece
per trip — never the show-load-in dummy look.

**The questions that decide the whole shape** (ask these first):

1. **What do you point them at?**  A named thing from a catalogue
   ("build me a 4x8 flat", "a 2-step platform"), a cut list, or
   something you have already built once and want copied?
2. **Where do they work** — at the shed saws and carry it out, or on
   the deck where it will stand?
3. **Do they consume real stock?**  The honest version orders wood,
   forklifts the pallet, cuts on the saws and nails it — every step
   the player does.  The cheap version conjures the timber.  The
   honest one is much better and MOSTLY ALREADY BUILT (see below).
4. **Are they the existing hands or a new trade?**  `CREW.people` are
   six generic stagehands; carpenters could be a new job kind in the
   same queue, or their own crew with their own frame and log.
5. **Can you call them from inside VR**, or is it a desktop-console
   call like CALL THE CREW?  (The VR fly page and order screens are
   the two precedents for a VR button.)

**What already exists that a carpenter should reuse — do not rebuild
any of this:**

- **The crew engine, `p6b`.**  `CREW.jobs` is a plain queue of
  `{kind, …}` records; `crewAssign(h)` switches on `job.kind`
  ('doors' | 'fly' | 'on' | 'off' | 'hold'); a hand walks with
  `handGoTo(h, x, z, then)` and works with
  `h.state='work'; h.wait=…; h.then=…`.  **Adding a trade is adding
  job kinds**, not a new engine.  `crewPlan(dir)` is the model for
  planning a sequence; `'hold'` is the barrier that waits for everyone
  to finish.
- **Every build primitive, `p4c`.**  `regWood(prof, dims)` mints
  stock, `seatWood`/`sawSetCut`/`sawCut` cut it on a real station,
  `addNail(a, target, wp, wax)` joins anything to anything and builds
  or merges the assembly, `asmAdopt`, `addHinge`, `layTrack`,
  `paintWood`/`paintGoods`.
- **THE BIG WIN: build through the same functions the hands use and
  the work rides the SAVE for free.**  `buildLoad` already replays
  exactly those calls (makeSerBody → asmAdopt → addNail → layTrack) to
  rebuild a saved world, so anything a carpenter assembles the same
  way serializes with no new save code.  A carpenter that pokes meshes
  directly would be invisible to the save — **do not do that.**

**Constraints a carpenter plan must respect:**

- `BUILD_CAP` is 150 build pieces per venue and the ORDER SCREEN is
  the enforcement point — a carpenter must check it too, or it will
  quietly walk past the cap the player is refused at.
- **Never `setTimeout` for game timing** (ruling M7): time comes off
  the frame `dt`, the way `updateSheds`/`updateOrders`/`updateLifts`
  do.  A carpenter tick belongs in that family.
- **Only the LIVE stage ticks** (documented limitation, §6): walk away
  mid-build and the carpenters freeze until you come back.  Decide
  deliberately whether that is acceptable or whether this is the
  feature that finally makes parked stages tick.
- The crew work out of the PALACE dock for `CALL THE CREW` (LOAD IN
  NOW works anywhere) — a carpenter needs the same `crewFrame()`
  treatment or it will build on the wrong stage's deck.  Read the
  §4 invariants on stage coordinates before writing any placement.
- Wood is PARAMETRIC and a cut must NEVER mint geometry (build spec
  §9): re-scale one body, register a second.

**Likely first PRs, if the owner's answers are the obvious ones:** the
carpenter job kinds + a trade in `CREW` (or `SHOP`) ; a catalogue of
buildable items with cut lists ; the call button (VR + desktop) ; the
saw/nail choreography so it reads as work rather than teleporting
timber ; the piece-cap and stock refusals.
(What actually shipped differs only where the owner ruled: VR only,
no desktop call, and the mark tool nobody had predicted.)

---

## NEXT SESSION: **THE FRAME-RATE ROUND**

The owner's call, 2026-08-09. It runs THROUGH the headset run below —
you cannot do this one at a desk — so put the headset on, take the
numbers FIRST while the questions are still unanswered and the room is
fresh, then work the feel questions in the section below while it is on
anyway.

**Load `…/the-house.html?v=14` once #81 has merged** (`?v=13` is the
pre-#81 build — if #81 is still open, you are measuring the OLD wood and
the numbers are not the ones this round wants). Bump the number either
way: the Quest Browser caches hard.

### Step zero: read the meter, and let it choose the round

The wrist tag (#22, LEFT WRIST — glance at your watch) has **never met
hardware**. It reports avg/worst against budget plus the live foveation
level, and that second number is the diagnostic, because **foveation is
a FRAGMENT-side knob**: it cuts pixel work at the periphery and does
nothing whatever for draw calls or vertex work.

| The tag reads | The wall you are hitting | What to do |
|---|---|---|
| foveation climbs 0.4 → 1.0, frames recover | fill / fragment | knobs 2, 3, 5 below. **Do not merge.** |
| foveation pinned at 1.0, still red | not fragment — submission / CPU | knobs 1, 4, then THE MERGE |
| foveation sits at 0.4, green | headroom | **stop. Ship nothing.** |

Two of the three outcomes say do not build the merge. That is the point
of measuring first.

### Stand in these four places and write the numbers down

Blank on purpose — fill it in and this section becomes the record:

| Where | avg ms | worst ms | foveation | notes |
|---|---|---|---|---|
| centre stage, full rig, haze | | | | |
| at the locking rail, full hang | | | | |
| anywhere a rig fills the view (#33's bodies) | | | | |
| **a real build standing under a lit rig** | | | | THE UNMEASURED ONE |

That last row is the case nobody has ever measured and the reason this
round exists: wood is one draw call per piece, `BUILD_CAP` is 150 to a
venue, and r128 draws each eye separately. Stand a full stack of flats
up and read the tag. Note the piece count when you do.

### What has already been spent on frame rate (do not redo it)

- **#21** — the session is paced at 72Hz, not 90 (13.9ms of budget
  instead of 11.1). One line to retune if the meter shows headroom.
- **#22** — the meter itself, plus foveation on a feedback loop:
  climbs by 0.15 when over budget, relaxes by 0.05 toward a 0.4 base.
- **#23** — `VR.lightCap = 4`: four real spotlights in VR, not eight.
  178 `MeshStandardMaterial` uses pay per-pixel for every live light.
- **#81** — wood holds ONE material until its faces disagree: 6× fewer
  draw calls on every unpainted piece (900 → 150 at the cap, per eye).
  **This is already in — the meter reads the world AFTER it.**

### The knobs, in order, gated on what the meter said

One change per PR, retest after each:

1. **Batch the locking rail** — merge its static per-line meshes
   (housings, number plates via a shared atlas, runs, blocks) into
   shared geometry or instanced draws in `vrBuildRopes`. Only the
   lever, knob and grab section actually move per line. ~11 unbatched
   meshes per line today. Built correctness-first on purpose; this is
   the deliberate follow-up.
2. **`VR.beamCap` below 10.** Additive beams in haze are overdraw — the
   thing a mobile tile GPU hates most. Fragment-side.
3. **Framebuffer scale below 0.85** (`setFramebufferScaleFactor`, p9
   wiring). **MUST be set before any session exists** — start-only.
4. **Merge the lantern bodies' static steel** (gel frame 4→1, shutter
   handles 4→1, yoke+stem+bolt+safety→1 per yoke radius). Keep the jaw
   and lens separate — the jaw IS `userData.clamp` and is grabbable.
   17 meshes → ~8 per profile, zero visual change. Spec'd in #33's
   quality review.
5. **Cut `SMOKE.n`; preselect RENDER *low* before entering.**

### THE MERGE — deferred 2026-08-09, gated on row four above

Merge the pieces of a nailed assembly into one mesh; the hammer
un-merges. Deferred by the owner in favour of #81's cheap half. The
design work is done, so it can be picked up cold — but **only if the
meter says submission-bound**, and note the honest arithmetic first:
after #81 a five-flat scene is ~50 draw calls of wood, and merging takes
it to ~5. Forty-five draw calls is the whole prize. Do not spend a round
on it blind.

If it is built, the rule that makes it safe is: **the merge is a
RENDERING representation, never a model change.** `a.pieces` stays the
truth — dims, pose, paint, nail count — and the merged mesh is a derived
artifact rebuilt on any structural change. That is the same discipline
`buildLoad` already runs on, so un-merging on the hammer is a replay
that is mostly written. What it constrains:

- **Only rigid pieces merge.** A one-nail piece rides a pivot and swings
  by hand (RULING G) — it must stay its own mesh. Candidates are
  2+-nail pieces sharing a material inside one assembly.
- **`BUILD_CAP` must not move.** The cap counts pieces of wood in the
  venue — the fiction, not the mesh count. Keep the count on the
  records or a player quietly builds four times the wood.
- **`nailRay` needs to know which piece it hit.** It casts the muzzle
  ray 1.2m; against a merged mesh you get a point but no identity. Map
  the hit to a piece by its OBB — `snapWood` already does metric
  surface-gap maths worth borrowing.
- **Paint and cut both invalidate the merge** and need a rebuild call.
- **Disposal.** Merging mints a real geometry per assembly. `disposeTree`
  (p3:168) only ever disposes GEOMETRY, never materials — which is
  correct here, but it means the merged geometries are the thing that
  will leak if nobody disposes them.
- `mergeBufferGeometries` lives in `BufferGeometryUtils`, an examples
  module **not in the cdnjs `three.min.js` this page loads**. It is ~40
  lines of hand-written concatenation, not a library call.

### While the headset is on

Everything in the section below is still owed and this is the same trip.
Take the numbers first, then work those question blocks oldest-first.

---

## NEXT SESSION (cont.): **THE HEADSET RUN** (owed since #48)

Everything from #48 onward — the usability round, all nine build-feel
PRs, both goods PRs, the carpenters round and now PHASE 2 — has met
hardware NEVER, except the two things the 2026-08-08 run turned up
(#76, #78).  Put the owner on `…/the-house.html?v=16` (the game changed
five times on 2026-08-09) and work the question blocks below, oldest
first.

**New questions, THE WORKSHOP ROUND (#84–#88) — record the answers here:**

- **Do the tools read as tools?** They are held at arm's length
  constantly, which is where proportion is unforgiving and texture
  detail is not. Does the nail gun read as a framing nailer, the hammer
  as a 20oz framing hammer, the tape as a tape? **No reference photos
  were used — the owner delegated judgment — so some of this will be
  wrong, and this is the review.** Naming what is wrong is more useful
  than a verdict: too big, too small, wrong shape, wrong colour.
- **Is the muzzle still where your hand expects it?** The gun now has a
  visible nose, depth adjuster and contact tip. `nailRay` casts from the
  same place it always did, but a visible muzzle changes where you
  *think* you are pointing.
- **Does the shed read as a working scene shop**, or as a room with
  objects in it? The saws, the racking and the plant all gained the
  parts that make them identifiable; the question is whether the room
  now reads as somewhere work happens.
- **Is the hazard-yellow forklift too loud?** It is the only saturated
  colour in either shed and it will pull the eye. If it does, the
  material is one entry in `M` and the fix is a line.
- **THE LAG QUESTION, the one that matters most.** #88 cut the build
  system's per-frame CPU 11× (1.565 ms → 0.146 ms at `BUILD_CAP`) and
  the workshop round cut the shed's draw calls 40% (63 → 38 meshes a
  venue). **Stand a real build under a lit rig and read the wrist
  meter.** If it is still red, the remaining suspects are the wood's own
  draw calls (the assembly merge, specced and deferred) and fill —
  because the two things measured off hardware are now small.
- **Does anything hang in the air?** #88 re-tests a settled piece on a
  rota rather than every frame, with `grabBody` waking the venue. If a
  piece ever visibly hangs for a beat after losing its support, that is
  a route to `wakeBodies` nobody found — worth reporting precisely.

**New questions, PHASE 2 — record the answers here:**

- **Standing a flat up.** A finished flat now turns with the wrist and
  squares to 45°.  Does tipping one upright off the deck feel like
  handling a flat, or does the 45° grid fight you halfway?  Is HOLD-X
  discoverable when you want it free?  Can you carry a 4x8 through the
  roller door without it snagging?
- **The openings.** Do the door and window read as real openings at
  arm's length, or does the framed-and-skinned construction show as
  seams?  Is the 30×80″ door big enough to walk through in VR (the
  bottom rail is a 3.5″ sill you step over — trip hazard or fine)?
- **The SKIN switch.** Is ON/OFF beside the CALL obvious, and does a
  bare frame read as deliberate rather than unfinished?
- **The list, and the STACK.** Press + a few times, CALL once: does
  watching a stack build read as work, or does the wait get long at
  three or four items?  **Is a stack usable** — can you get the top one
  off cleanly, or do they fight each other on the way up?
- **The five-row glass.** Rows dropped from an 86px pitch to 64px to
  fit five plus the counters.  Still readable at arm's length?  Are the
  −/+ boxes (46px) big enough to hit with a controller ray?
- **The Arc button.** Walk up to a rear door on the stage side and
  press it — does it read as the way in, and is it where your hand
  expects it (0.8m clear of the opening, 1.25m up)?
- **Frame rate with a real build standing.** THE UNMEASURED WORST CASE:
  wood is one draw call per piece, `BUILD_CAP` is 150 a venue, and r128
  draws each eye separately.  Stand a full stack of flats under a lit
  rig and read the wrist meter.

**Older blocks follow — the questions below are still owed too:**

- **The belt is four now.**  Crayon at the small of the back
  (0/-0.17): can you draw it without catching the tape?  Is a
  behind-the-back reach comfortable in a headset, or does the crayon
  want a hip?
- **The mark:** legible on the deck from standing height?  Is the yaw
  obvious from the nose notch, or does the build's facing surprise?
- **Watching the build:** does the pace read as WORK, or does it
  drag?  (Work-waits are one-line tunes in p6b's carp branches.)  Is
  one-plank-per-trip theatre or tedium at platform scale — nine
  hauls?
- **The seventh figure:** wrist-meter numbers with a build running —
  at the saws, and at the mark with the rig up.
- **The CARPENTERS screen:** readable beside the order screen?  Do
  the refusal strings land?

Candidates after the run, owner's call, no order — phase 2 took the
build list and the openings, so what is left of that list is: the
furniture catalogue (RULING J); "copy something I already built"
(shaping question 1's third answer — still out of scope); carpenters
that paint; RULING W revisited (save the hang + its paint together,
one versioned blob, its own round); the other six Arc doors, which
are still DOM-only and so still unreachable in VR (one branch on the
`arcDoor:<key>` station id #76 already established).

**Also still open, in rough order:**

- **The next headset run.** The build system has met hardware TWICE
  (each run produced a bug list — the usability round, then the
  build-feel round).  **Everything from #48 onward — the whole
  usability round, all nine build-feel PRs, both goods PRs and the
  carpenters round — has met hardware NEVER.**  Put the owner on
  `…/the-house.html?v=13` (bump the number, the Quest Browser caches
  hard) and work the question blocks at the bottom of this section.
  Feel constants, all one-line tunes: `GRAB_WOOD 0.15`,
  `SEAM_TOUCH 0.05`, `SEAM_REACH 0.45`, `SNAP_SEEK 0.35`,
  `SNAP_OFFER 0.22`, `SNAP_SLACK 0.08`, `TABLE_TOP 0.925` — plus the
  older radii (0.32 rope, 0.28 saw, 0.30 cart/lift, 0.22 tool/roller,
  0.12 lever, 0.35 compact bodies).
- **Known accepted drifts** (documented, may get promoted to bugs by
  the owner): a swung pivot reloads at its pose but its stops
  re-baseline there; pipe-anchored work reloads at saved pose
  whatever trim the pipe wakes at; a runaway resumes when a parked
  stage is re-entered; rope runs pass through the fly-gallery floor
  at y=8 (cosmetic); a cold-dropped table (session end mid-carry)
  settles standing but keeps its held tilt — only a live release
  squares it.
- **Small housekeeping:** `pr6.json` is still untracked in the repo
  root (leftover PR-body file; the owner never ruled on deleting it).
  And `origin` still carries ~40 fully-merged branches (`carp-*`,
  `feel-*`, the `handoff-*` series, every older feature branch) — the
  local copies were pruned 2026-08-08, but a remote prune is
  outward-facing and unruled.
- **Standing owner-taste leftovers:** audit items 20 (dead weight)
  and 22 (duplication) — decisions, not defects.

After the bugs: PHASE 2 is the furniture catalogue (doors, lamps,
tables, nightstands — RULING J; they slot straight in as ordered
bodies — and the WORK TABLE body from #51 is the pattern to copy),
and the headset checklist below still stands.

**STILL OWED WHENEVER THE HEADSET NEXT GOES ON** (no recorded run since
2026-08-06; the meter shipped in #22 but has never met hardware — put
the owner on `…/the-house.html?v=13`, bump the number, Quest Browser
caches hard):

**Read the wrist meter and WRITE THE NUMBERS HERE.** The worst cases,
now three: centre stage under a full rig in haze, at the locking rail
with a full hang (~11 unbatched meshes per line), and — new with #33 —
anywhere a rig fills the view: the real lantern bodies grew per-stage
body meshes ~3.8× (~94 → ~359; r128 WebXR draws each eye separately).
Also note what the foveation level settles at in each spot — if it is
pinned at 1.0 the controller is out of headroom and the next knob is
needed; if it sits at 0.4 we are done tuning.

**The remaining knobs, if the meter still reads over budget** (retest
after each — one change per PR):

1. Batch the rail: merge the locking rail's static per-line meshes
   (housings, plates via a shared atlas, runs, blocks) into shared
   geometry / instanced draws in `vrBuildRopes`. Only the lever, knob
   and grab section actually move per line; everything else can be one
   draw. Built correctness-first on purpose — this is the deliberate
   follow-up.
2. `VR.beamCap` lower still (10 today). Additive beams in haze are
   overdraw, the thing a mobile tile GPU hates most.
3. Framebuffer scale below 0.85 (`setFramebufferScaleFactor`, wiring
   section of p9 — MUST be set before any session exists).
4. Merge the new lantern bodies' static steel clusters (gel frame 4→1,
   shutter handles 4→1, yoke+stem+bolt+safety→1 per yoke radius — keep
   the jaw and lens separate: the jaw IS `userData.clamp` and PR 5
   grabs by it). Spec'd in #33's quality review; brings a profile from
   17 meshes to ~8 with zero visual change.
5. Cut `SMOKE.n`; RENDER *low* preselected before entering. (Thinning
   `LIGHT_POOL` is done — that was #23.)

**While the headset is on anyway**, collect the deferred verdicts and
write them here: does the locking rail read as the photograph, does
grab-anywhere land (0.32m to either run, deck to grid), does
pull-out-to-release / push-in-to-lock feel right, does a runaway read
as a load getting loose; do desk buttons land where the cursor sits
(the `v: 1 - h.uv.y` flip has a regression test but has never met real
hardware); console text size, smooth turn (`VR.turn` 2.1 rad/s — offer
snap if it turns stomachs), walk 3.2, fly 8, the 0.35s double-tap
window, label legibility. New from this round: is the wrist tag
readable and sized like a watch; does 72Hz feel smoother than the
dropping 90 did; is the four-light stage look visibly poorer in a busy
cue (if so, `VR.lightCap` is one number); is the foveated edge
noticeable when the controller leans on it. New from the rig/warehouse
round (#32–#35): do the new lantern bodies read as real lanterns at
arm's length (lower the FOH bar all the way and look); does pushing
the cart feel right — grab height 1.02m, 1:1 chase, yaw easing at 2.5
rad/s — and is pushing it through a doorway comfortable or claustro;
do the sheds read as real rooms (lit enough? the keep lights are
deliberate dusk, not work light); does the speaker-bar travel read
believably from the stalls. New from the detach/ordering round
(#37/#38): does the grab feel right at 0.35m and the snap at 0.4m
(both are one constant in p9); does carrying a lantern through the
roller door and hanging it read believably; is the wall order screen
legible at arm's length (560×520 canvas, 22px rows); does the pallet
read as a delivery; mind the frame rate holding a body under a full
rig, and do the 6-box arrays read as real PA from the stalls. New from
the build round (PR 1): is the tabbed supply screen still legible at
arm's length (the paint rows are 28px against everything else's 48),
and do the stacked wood pallets read as lumber stock on the apron.
(PR 2): does walking the forklift feel like a pallet jack or like
dragging furniture; is the right-stick fork control discoverable and
comfortable (push away = up); is steering a loaded pallet through the
roller door claustro; do the painted floor slots read as parking.
(PR 3): does the belt sit where hands expect it (drop 0.72, holster
reach 0.22); does drawing/holstering feel right or fumbly; does wood
turning with the wrist feel natural after the lanterns' fixed carry;
does the ghost snap GRAB the piece too eagerly (0.14 gap) or not
eagerly enough; is one squeeze + other-hand trigger workable for
gun-work at arm's length; does the swing of a one-nail piece read as
hinged; tape legibility and the tab grab at 0.2.
(PR 4): does seating wood on the table feel deliberate or accidental
(the release envelope is span/2+0.3 by 1.0); is the CUT AT label
readable while sliding; does the inch snap feel like a fence or like
stickiness; two stations 6.5m apart — is the shed getting crowded.
(PR 5): does the dip read (head tint + toast) without looking down;
is per-face painting discoverable or does everyone expect strokes;
can you find the roller on the rack at 0.22.
(PR 6): does placing the hinge BY ITS PIN read as choosing the swing
axis, or does it need a ghost arc; ±90° stops — enough for a door;
does the track chain-snap at 0.45 feel magnetic; sliding a panel by
grabbing the panel (not a handle) — natural or weird.
(PR 7): reload with a real build standing — does everything come
back where it stood (walk the shed AND the stage); is CLEAR SAVE too
easy to fat-finger next to ORDER (it only wipes storage, but say so);
and mind the frame rate with a 100-piece saved build restoring at
boot.
New from the usability round (grab + gun): does GRAB_WOOD 0.15 feel
like grabbing lumber or like a magnet (one constant, p9); does the
gun-at-seam read — point at two touching pieces, TRIGGER TO NAIL label,
fire — or does the SEAM_REACH 0.45 leash feel short; does SEAM_TOUCH
0.05 accept the seams a real stack of lumber offers.
New from the usability round (snap + table): does the earlier ghost
(SNAP_OFFER 0.22, was 0.14) help or grab too eagerly; do end-to-end
butts and T-joints offer the joint you meant (SNAP_SLACK 0.08 is the
overlap forgiveness); does the WORK TABLE (HDWE tab) carry comfortably
and land square on release; is building at 0.925m height right in VR;
and does 'the table holds it — no nail needed' read as design, not
refusal.
New from the build-feel round (once the chain lands): does the 45°
carry grid read as helpful or sticky, and is HOLD-X-to-free
discoverable without being told; does Y-park mid-air read as a
feature or a glitch (the toast says "parked"); does ray-nailing feel
like pointing a real gun (NAIL_RAY 1.2m — one constant); does
controller-compass walking fight the fork-stick habit when driving
the lift; is the drum obvious as a bin and is DELETE ALL WOOD too
easy to fat-finger next to CLEAR SAVE (both act instantly; the wood
button reports its count); do the three paint labels appear at the
right moments on hardware; do the ft-in fly rows read at arm's
length (they replaced "12.2m" with "40'0\"").
New from the goods round (#63/#64): does painting a curtain read as
painting the WHOLE hang (both legs of a pair go together — is that
right, or do you want a leg at a time); is the roller's reach to a
curtain comfortable, or does cloth grab the roller when you meant the
plank in front of it (wood has priority, but the box reach is
generous); is the goods picker legible at arm's length and is the
weight useful; does a pipe LIFTING when you hang something tall on it
read as sensible or as the board moving on its own; and the standing
question — do you want the hang and its paint SAVED (RULING W says
they are not, and both must be done together if so).
Known cosmetic, unfixed:
rope runs pass through the fly-gallery floor at y=8 (real rails have
rope slots).

Ground rules unchanged: suites green before and after; what jsdom can
test gets a regression test, what only a headset can verify gets written
here; PR straight to `main`, one concern per PR, never stack; `gh` is
not installed — PRs go through the GitHub API with the stored git
credential; PowerShell 5.1 mangles `git commit -m` when the message has
double quotes in it — write the message to a file and `-F` it. The
parallel-worktree-agents pattern (one branch per concern, review and
revise before push) has now worked well twice — and the SEAM CHECK is
no longer optional: before opening multi-branch PRs, merge every open
branch into a throwaway, rebuild, and run the full suite. On 2026-08-07
it caught two real bugs that every branch passed alone (a desktop grab
missing the relock handover; a lock test crashing on the lever-less
traveler rope only once both branches were merged). One more trap from
that day: never `git add -A` while agent worktrees exist under
`.claude/` — three gitlink pointers rode into a commit that way
(`.gitignore` covers it now).

After VR holds up on hardware, the leftovers: item 20, item 22, the
"stage 2" VR asks at the bottom of this section, and the deferred VR
BUILD feature (no spec — ask the owner what it means first) — plus the
small ones from earlier rounds: rope slots in the fly-gallery floor
(cosmetic), and clearing `runaway` when a stage is parked mid-fall
(today it resumes when you walk back in; arguably fine, documented
here so it is a decision rather than a surprise).

---

**The 2026-08-06 fix queue, for the record** (details in AUDIT.md; ground
rules were: suites green before and after every item, one finding one
commit, in-flight regression tests at the swap boundary):

Quick wins first — each is small, self-contained, and already hand-verified:

- [x] 1. **M16** — make the other eleven suites exit non-zero on failure the
      way `full14.js` does, and add an `npm test` script that runs all
      twelve. Do this first; it hardens every item after it.
- [x] 2. **M1** — `p5g:314` calls `makeFire` with the obsolete
      `{x,y,z,w,h,n}` shape, so every flame seeds at NaN and the GOES WRONG
      fireplace never renders. Convert to `{count, embers, y, x0,x1,z0,z1}`
      (the two correct callers are p5c:1065 and p5d:487).
- [x] 3. **M2** — `plotOutsiders` is missing `restoreAims(homeAims)` before
      `RIG.haze = savedHaze` (p5c:1261); the other three plots all have it.
- [x] 4. **M3** — guard the `updateNeon()` call at p5c:392 like its
      neighbours two lines down, and the unguarded `wrong*`/`setRevolve`
      references in p7:768-785.
- [x] 5. **M14** — two `function damaskTex()` (p2:218 Palace crimson,
      p5g:104 Cornley green); hoisting means p5g's silently wins everywhere.
      Rename the p5g one.

The swap boundary — decide the design ONCE, then the fixes are mechanical.
The choice per subsystem: PARK it (capture/restore in p2k) or HALT it (stop
on `stageSwitch`). AUDIT's recommendation: crew finish-or-stop, script stop,
follow cancel, audio stop, smoke gets a per-stage root exactly the way
`showRoot()` (p5c:43) already solved this for scenery:

- [x] 6. **H1** — smoke: `smokeRoot()` is memoized to the Palace forever, so
      shows loaded at the Arc rig their foggers 420m away (probe-verified);
      `removeShowSmoke()` strips units game-wide; `hazeNow()` reads global
      haze into whichever rig you're under.
- [x] 7. **H2–H5 + M5** — the crew, as one cluster: jobs mix plan-time and
      execution-time stages; `CREW.savedLook` restores onto whichever board
      is live; the loads cache is keyed by show only (LOAD OUT can strike
      the other stage's set); the stock plan is stage coordinates executed
      as world (Arc LOAD IN builds on the Palace deck); `crewStop` un-hides
      the wrong show, leaving scenery invisible with no UI recovery.
- [x] 8. **H6** — a running `Prog` script follows the board across a swap
      and drives the other theatre's rig and cue stack.
- [x] 9. **M7** — cue-follow `setTimeout` survives the swap and can GO the
      wrong stage's cue; cancel or park it.
- [x] 10. **M8** — `selCue` isn't swapped; DELETE CUE after a walk splices
      the wrong stack.
- [x] 11. **M9** — `SUBS` are one-board while `CUES` are per-stage. Possibly
      deliberate — owner rules: document it or capture them. *Documented as
      one-board (p6, comment above `SUBS`); if the owner rules the other
      way, capture them in p2k the way `CUES` are.*
- [x] 12. **M10** — rail-motor audio loop leaks for a lineset mid-travel at
      swap (and collides with the other stage's same-id lineset); the rain
      rumble has the same shape.
- [x] 13. **M11** — VR: `vrClearRopes` must null `VR.held`, or a held rope
      keeps flying the parked lineset and repositioning a disposed mesh.
- [x] 14. **M4** — the scenic palette and FOCUS raycast only the Palace's
      `deck` (and from the Arc can hit it *invisibly* through the walls —
      §5's own trap — aiming FOH across town); `setGroup` is one global
      store for three stages, and `showLoad`'s `strikeAll()` clears it
      cross-venue.

Coordinate/cosmetic — only ever visible at the Arc or in a headset:

- [x] 15. **M12** — the VR beam cap sorts fixtures' *local* positions
      against the camera's *world* position; on the Arc "nearest 14" means
      "most stage-left 14". Use `f._org` (p4:361).
- [x] 16. **M13** — fire billboards yaw from a stage-local centre toward the
      world camera; flames render edge-on at the Arc.
- [x] 17. **L2** — `camera.position` stops being world once
      `VR.rig.add(camera)`; smoke puffs (p5e:219) and lens glows (p4:378)
      need `getWorldPosition`.
- [x] 18. **M17** — the Outsiders show curtain never got the split-texture
      fix the other three have; its painted sun renders twice. A probe
      (tools/) confirms in seconds.

Structural / owner-taste — read the AUDIT sections before deciding:

- [x] 19. **M6** — `setPieceVisible` hides with `visible` only; crew-hidden
      scenery is still raycastable, so you can stand on invisible galleries.
      Fix shape depends on item 20 — the dead scene machinery contains the
      correct hide implementation.
- [ ] 20. Dead weight — `p2d` (orphaned, not even built), the Beetlejuice
      scene-change machinery (~110 lines plus a visible inert panel), eight
      functions, eight variables, two CSS blocks. Full inventory in AUDIT,
      including the `shopGroup` tombstone assertion in full14.js that must
      move with any deletion.
- [x] 21. **M15** — `SHOW`'s shape is defined in three drifting places and
      ad-hoc keys leak across swaps via `Object.assign`; unify the template.
- [ ] 22. Duplication — the four plot builders, show curtains, and the neon
      machinery want shared homes in p5c; bulk, not bugs. AUDIT lists every
      cluster with lines.

**Not done:**

- **No recorded headset run.** Hosting is solved (Pages, above), but as of
  this writing no Quest 3 findings have been written down. The XR code
  paths are exercised against a stubbed `WebXRManager` in `vr.js`; frame
  rate, comfort, real pointing and console readability are unknown. Next
  session opens by collecting exactly this — see step zero above.
- Only the live stage ticks. Leave a theatre mid-show and its fades and flys wait
  for you. Deliberate, but arguable.
- The Arc has no productions of its own; the four in the book are written for the
  Palace's stage box and load anywhere because all three boxes match.
- Hamilton is thinner than the other three (55 pieces against ~96).
- The scene-change system (`SHOW.scenes`, `p5c`) is general machinery that no
  current show uses — it was built for Beetlejuice, which was removed.

**Asked for and not yet built:** the "stage 2" VR work — grabbable faders
on the console, carrying scenery by hand. Worth folding into the VR fix
session only after the basics survive the headset.
