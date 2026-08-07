# THE HOUSE — handoff

A 3D theatre you work in. Two buildings, three stages, a lighting rig you can
plot, a counterweight fly rail you can haul, productions that load in, a crew
that carries them, and a VR mode for a Quest 3. One HTML file, ~583KB, three.js
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
  src/               the 24 parts it is built from
  tests/             twelve suites — npm install, then node real.js
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
npm test          # all twelve suites, exits non-zero if any fail
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
node vr.js        # WebXR: rig, sticks, desks, ropes, GO
```

All twelve are at `--- failures: 0 ---`. Keep them there. Every suite exits
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

**Four productions.** THE OUTSIDERS, THE LOST BOYS, HAMILTON (two concentric
revolves that turn), THE PLAY THAT GOES WRONG (seven pieces that fall over under
their own weight and can be stood back up). All interpretations in each show's
vocabulary — no reproduction of anyone's drawings.

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

**NEXT SESSION: PR 5 — THE DETACH SYSTEM (spec §3), then PR 6 —
ORDERING (spec §6).** Step zero: confirm #32–#35 merged (merge them if
not — each is double-reviewed, green, negative-checked). Then write
the PR 5/6 plan the way the 1–4 plan was written — explore first,
bite-sized tasks; the existing plan file covers 1–4 ONLY. PR 5 in one
breath: every hanging position becomes a POINT (per-stage, p2k-parked,
owns the channel and the plot — RULING A, "the circuit lives in the
pipe") and every lantern/speaker box becomes a BODY (venue-level;
hung / held / slotted / loose) grabbable via `vrSqueeze` (extend the
arbitration the cart joined — never fork it); an empty point's channel
is DEAD via ONE gate at the single choke point, p4's
`const lvl = clamp(f.level,0,1) * master` (~p4:418) — NEVER via
`visible` (§5). Bodies snap to empty points, cart slots and rack
slots. The hooks are already on `main` once #33/#35 merge:
`userData.clamp` on every body, `SHEDS[*].slots`, `CARTS[*].slots`,
and the cart's `kind:'cart'` `VR.held` record as the
discriminated-union precedent. PR 6 after: the order screen per shed
(VR console pattern — five precedents in p9), ~30s pallet delivery,
RULINGS C (free), D (one pending order, self-clearing pallet), E
(24-loose-body venue cap). The deferred **VR BUILD FEATURE** (owner's
words, "adding a vr build feature" — still no spec; ask before coding)
comes after this feature set is done.

**STILL OWED WHENEVER THE HEADSET NEXT GOES ON** (no recorded run since
2026-08-06; the meter shipped in #22 but has never met hardware — put
the owner on `…/the-house.html?v=7`, bump the number, Quest Browser
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
believably from the stalls. Known cosmetic, unfixed:
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
