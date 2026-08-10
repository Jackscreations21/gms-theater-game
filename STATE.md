# RUNNING STATE — live session file

This is the **working state file**: it records where things stand RIGHT
NOW and is updated as work happens. `HANDOFF.md` is the durable record
written at session end; this file is the scratchpad between those
writes. If the two disagree, this file is newer.

Last updated: **2026-08-10, later the same day** — the owner supplied his OWN
scene plot off the video, with timestamps, and it does not match what the
fifth show built. A re-time round is IN FLIGHT: six PRs merged
(#104–#109), two more to go. **Read "THE RE-TIME ROUND" below before
anything else.**

---

## THE RE-TIME ROUND — in flight, 2026-08-10

The owner watched the recording and wrote out the set changes himself. **That
list is the authority.** Where it disagrees with what #93–#100 built, the list
wins. Spec: `docs/superpowers/specs/2026-08-10-beetlejuice-scene-plot-design.md`
(**RULINGS AP–AV, all binding**). Plan:
`docs/superpowers/plans/2026-08-10-beetlejuice-scene-plot-prs1-7.md` — the
chain grew past seven, see below.

**The cross-check that validates the whole thing:** his act break, `1:11:02`,
is second **4262** — exactly the built act-break cue, taken off the 13.3s
blackout `blackdetect` found at 71:02. His timestamps and our measurements
share a time base, so every number he gave drops straight into `looks[].at`
with no offset.

### The rulings

- **AP** — the wagon is real and you WATCH it travel. A dt-driven mover on the
  scene group, never `setTimeout`.
- **AQ** — ONE house, THREE dressings (Maitlands / Deetz / Beetlejuice), not
  three houses. `interior` and `redecorated` merge into it. **Confirmed off the
  owner's photographs** — same swooping ceiling, same staircase, same
  fireplace, redressed three times.
- **AR** — the show ends at **2:15:00**. The measured tail from 8100s on is
  dropped: a deliberate override of a measurement by the man who watched it.
- **AS** — the sign FLIES (in at pre-show, out at the top) and **there is no
  crypt** — "i dont know what a crypt is but i dont think there is one".
- **AT** — cloths on real fly lines, structures on movers.
- **AU** — the two waits are the two GO presses (`follow:null`).
- **AV** — **RULING AO IS REPEALED.** "remove the cluase entirely that it has
  to be our onw shapes. make the sets look as close to the real stuff as you
  can get it." Beetlejuice is now MODELLED ON THE PRODUCTION. **Scoped to this
  show only** — the other four keep their interpretation note, and there is an
  assertion pinning that the repeal did not leak.

### Landed so far

| PR | What |
|---|---|
| [#104](https://github.com/Jackscreations21/gms-theater-game/pull/104) | the spec + plan (rulings AP–AU) |
| [#105](https://github.com/Jackscreations21/gms-theater-game/pull/105) | **the mover** — `sceneTravel` / `sceneMoveTo` / `sceneMoveStep(dt)` |
| [#106](https://github.com/Jackscreations21/gms-theater-game/pull/106) | everything that flies — backdrop, sky, the flown sign |
| [#107](https://github.com/Jackscreations21/gms-theater-game/pull/107) | **a defect in #106** — the cloths were hung in FRONT of the show |
| [#108](https://github.com/Jackscreations21/gms-theater-game/pull/108) | RULING AV — the marquee and the cloth follow the photograph |
| [#109](https://github.com/Jackscreations21/gms-theater-game/pull/109) | **the Palace runs 4.5m deeper**, warehouse moved back with it |

### Still to build

1. **The wagon and its three dressings** (RULING AQ) — the big one. `interior`
   becomes the wagon, `redecorated` becomes its Deetz dressing, a Beetlejuice
   dressing is new. Park offset is about **z −7.9** (puts the set at −17.10 ..
   −11.50, behind the last lineset at −10.90 with 4.4m to spare behind it).
2. **The closet (42:34) and the roof (56:00)**, delete the crypt, retire the
   `signset` scene.
3. **Confetti** (2:15:00) — does not exist; a burst, not a state.
4. **The re-timed cue list** — every `at` onto the owner's seventeen beats.

### The plot, as the owner gave it

`up` = flies out, `down` = flies in. Act one: pre-show (holds for START) ·
opening lights, **sign flies out**, curtain up on the graveyard · 9:45 (585)
stage empties to the backdrop · 10:40 (640) backdrop out, house slides on
(Maitlands) · 32:16 (1936) house off · 32:50 (1970) backdrop in, attic · 42:34
(2554) closet · 48:49 (2929) attic · 52:00 (3120) bedroom · 56:00 (3360) roof ·
1:02:51 (3771) roof off, backdrop out, house on (Deetz) · **1:11:02 (4262)
blackout, curtain in, end of half**. Act two: holds for a console button ·
lights, curtain up on the exterior + sky · 1:14:30 (4470) exterior and sky fly
out, house on (Beetlejuice) · 1:25:25 (5125) house off, backdrop in, attic ·
1:30:00 (5400) attic off, backdrop out, house on · 1:39:00 (5940) house off,
netherworld · 1:53:00 (6780) netherworld off, house on · 2:13:05 (7985) house
slides ALL THE WAY back, backdrop stays out, **curtain call on an empty
stage** · 2:15:00 (8100) confetti, curtain in, house to half. **END.**

### Reference photographs the owner supplied

Ten so far, and they are the build reference now that AV is in force: the
graveyard (black tree on a mound, crosses, an enormous cratered moon, painted
cloud sky), the netherworld (nested blue neon rectangles in forced
perspective), the Maitlands house warm, the Deetz house grey and modern, the
Beetlejuice house purple and striped — **all three plainly the same
architecture** — the attic (two open sheds either side, junk wall centre,
string lights on a rafter), the roof set, the exterior, the marquee, and **the
closet (the bright pink one)**.

**Two things they changed:** the show portal is a **blue-green neon tube frame**
round the whole opening — ours is weathered clapboard and is wrong. And the
graveyard plainly has a painted cloud sky BEHIND cut hills, which settles an
open question the other way: the cemetery's three hills need to come downstage
of the cloth, not the cloth upstage of them.

**Still needed:** the purple photo with the picture frames is unidentified (my
guess is Lydia's bedroom, unconfirmed). Nothing yet for the Deetz exterior —
though the owner has since said **the house exterior never changes**.

### The one architectural thing to know

**`D.backWall` and `PAL_BACK` are different numbers and must stay different.**
`D.backWall` (−17) is the STAGE-COORDINATE reference every show, every plot and
both Arc houses are written to. `PAL_BACK` (−21.5) is where the Palace's brick
actually stands. Structural Palace geometry uses `PAL_BACK`; anything
stage-relative keeps `D.backWall`. This is a deliberate, scoped break of "every
stage is the same box" (owner: "only do this with the palace theater").

---

Previous entry: **2026-08-10** (the fifth show is DONE and landed — ten PRs,
ten scenes, forty-six cues. The auto-cue runs on the measured timeline.
Next session CONFIRMS the scene timing).

---

## Position

- **THE AUTO-CUE RUNS.** The thing the owner asked for — "an auto cue feature timed correctly" — is in, and it cost no new code: every cue's `follow` field now carries the gap between two MEASURED cue times, so the show runs itself on the recording's own timeline. The chain spans **8627s = 144 min** against a 143-minute recording, reaching the act break at exactly **71:02** and the curtain call at **141:02**. **Show him this before anything else, and before any transport is specced** — it may be the whole feature. Two honest caveats travel with it, both in the code comments: `follow` uses `setTimeout` (the one surviving violation of the rule) and a **stage swap cancels it**, so an unattended show dies if you change venue; and chained relative waits drift where absolute timecode would not. Rulings **AP onward** are still open and still unguessed.
- **NOTHING IN FLIGHT. The BEETLEJUICE round is DONE and landed** — twelve PRs (#90–#102), [#90](https://github.com/Jackscreations21/gms-theater-game/pull/90) the probe, [#91](https://github.com/Jackscreations21/gms-theater-game/pull/91) the spec + RULING AO, [#92](https://github.com/Jackscreations21/gms-theater-game/pull/92) the plan, then all seven build PRs (#93–#98, #100), the record (#99), the next-session block (#101) and the cache-bust (#102). All `base=main`, each merged only after its gates passed: suites green, every new assertion negative-checked against a WRONG implementation, boot clean, byte-identical rebuild, branch deleted. The owner asked for the chain to be merged without him watching; it was, on those gates and not on judgement.
- **Ten scenes, forty-six cues, ~110 pieces** — cemetery, interior, attic, bedroom, crypt, house exterior, redecorated room, afterlife, the sign, bare stage, plus a portal that never leaves. One scene is ever live; the rest have their layers disabled, so they cost no draw call and no raycast.
- **Suite status: 18/18 GREEN**, boot `"fatal": null`. The 18th suite is `tests/beetlejuice.js`. **`main` now rebuilds at 964663** (was 895034 before the fifth show). Node v24.16.0 at `C:\Program Files\nodejs` — still not on a fresh shell's PATH; prefix with `export PATH="/c/Program Files/nodejs:$PATH"` (Git Bash) or `$env:Path = "C:\Program Files\nodejs;$env:Path"`.
- **`ffmpeg` 9.0 is now on this machine** (`winget install Gyan.FFmpeg`) and has the SAME PATH quirk as Node — it is not on a fresh shell's PATH. `tools/video.js` finds it under `AppData/Local/Microsoft/WinGet/Packages` by itself, so a probe run needs no export. There is still **no Python** (the `python` on PATH is the Store stub) and none is needed.
- **Two things got cheaper, and both are measured, not guessed.** Workshop draw calls per venue **63 → 38 meshes** across eleven objects, while every one of them gained substantial detail (`tools/census.js`). The build system's per-frame CPU at `BUILD_CAP` went **1.565 ms → 0.146 ms**, 11.3% of a 72Hz budget down to 1.0% (`tools/buildload.js`).
- Pages serves `main`. **Bust the Quest cache with `?v=16`** — the build went 895034 → 964663 on 2026-08-10 (the whole fifth show). The Quest Browser caches hard, and confirming the scene timing against a CACHED old build would read as a timing fault that is not there. Bump it again after any further merge.
- **This clone:** `main` @ `35eb3e4` = `origin/main`. `pr6.json` still untracked. (Do not trust this line — `git log main..origin/main` is the first move of any session that did not watch the last one land.)

## Current focus: **NEXT SESSION CONFIRMS THE SCENE TIMING** (owner, 2026-08-10)

The round is built and merged. **Nobody has watched it run.** The full protocol
is in HANDOFF's "NEXT SESSION: CONFIRMING THE SCENE TIMING" — read that first.
The short version:

**The suites cannot answer this, and that is the finding.** `follow` arms the
next cue with `setTimeout`, so the chain runs on the wall clock. jsdom asserts
the follow VALUES — the chain reconstructs 8627s, the act break at 71:02, the
call at 141:02 — but it cannot watch cues fire without sitting through 144 real
minutes. **A dt-driven transport would be suite-testable**, because
`stepProgram(dt)` can be stepped 8627 seconds in a loop. Put that to the owner
in those words; it is the strongest argument for ruling AP and it was not
obvious before the cheap version existed.

**Confirm, in order:** does it start itself off one GO; does **drift**
accumulate (note the wall clock at the act break, due 71:02, and at the call,
due 141:02 — if the call is more than a few seconds late, the cheap version has
answered AP by itself); does a stage swap kill it (it should — `cancelFollow`
runs on the swap); do the six scene changes land in the dark; does the pace read
over 46 cues in 144 minutes.

**Four soft spots, and they are the ones to distrust** — covers invented because
the recording gave nothing to measure, each saying so in its own comment: cue 7
(out to the interior), cue 12 (up into the attic), cue 25 (back inside), cue
32.3 (out to the sign). The measured covers should feel right; those four are
guesses.

**Still open: rulings AP–AR** — cheap `follow` versus a real timecode transport,
whether it must be VR-reachable, and what a running show does on a stage swap.
Two facts for that discussion: `follow` uses `setTimeout`, the one surviving
violation of the rule, and a stage swap **cancels** it, so an unattended show
dies when you change venue; and chained relative waits drift where absolute
timecode does not.

## The round that produced it: **BEETLEJUICE** — a fifth show, off a video

The new feature is decided. The owner supplied a video of a full
performance and asked for "the real cues and sets for it and an auto cue
feature timed correctly". Spec:
**`docs/superpowers/specs/2026-08-10-beetlejuice-design.md`** — read it
before touching anything in this round; **RULING AO** is binding.

**What Phase 1 established, and it changed the scope** (`tools/video.js`):
the file is a **bootleg compilation**, not a locked-off wide shot — 723
hard cuts at 5.0/min, layout stability median r = 0.676 where a fixed
camera scores ~0.95. So **per-area channel levels are NOT measurable**
from it. What survived: CFR timestamps, real black (darkest frame Y =
16.8), fixed exposure (+1.1 Y drift through a 13.3 s blackout), **33
blackouts ≥ 1 s**, **76 strong fades** (an optimistic ceiling — a handheld
zoom inside a held shot moves brightness with no lighting change), fade
times median 2.2 s, the act break at **71:02**, and the curtain call in
the last 2.5 min.

**The scenery came to 10 configurations, all built** (surveyed off contact
sheets, catalogued in the spec) — ~110 pieces, at the top of the existing
shows' 55–114. `SHOWS` is declared in `p5c`, so the fifth show is a **new
part appended after `p5g`** — never a reorder.

**The `follow` demonstration is DONE** — that was the instruction and it has
been carried out. All ten scenes were built, then every cue's `follow` filled
with the gap between two measured times, and the show runs itself with no new
code. What is left is for the owner to WATCH it and then rule AP–AR; see
Current focus above.

**How a feature round runs here** (this repo has a shape, and it works):

1. **Shape it with the owner first.** The five-question pattern in
   HANDOFF's carpenters brief is the model: ask what decides the shape,
   one question at a time, before any code.
2. **Spec it** to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
   with numbered RULINGS inline. **The letters continue — the Beetlejuice
   spec used AO, so the next is AP.** Rulings are how decisions stop
   being re-litigated; the models question (RULING AI) is the example.
3. **Plan it** to `docs/superpowers/plans/`, then build it as a **linear
   chain: one concern per PR, never stacked**, each branch cut after its
   parent merges, rebased onto fresh `main`, retested before opening.
4. **Suites green before AND after, every new assertion negative-checked
   against a WRONG implementation** — not merely an absent one. That
   distinction cost real time this round; see TRAPS.md.

**What a new feature must respect** (the traps that bite newcomers):

- Anything a headset must reach **needs a physical thing in the room** —
  a DOM control does not exist in VR. A `station()` is the cheapest.
- Build through the same functions the player's hands use and **the work
  rides the save for free**; poke meshes directly and it is invisible to
  the save.
- Detail is paid for by **`mergeParts`**, not by adding meshes
  (ARCHITECTURE.md). Never merge anything grabbed, moved or recoloured.
- If it can take the ground out from under a resting body, it must call
  **`wakeBodies`** (BUILD-SYSTEM.md).
- **Never `setTimeout` for game timing** — time comes off the frame `dt`.

## Still owed, and not superseded: THE FRAME-RATE ROUND

It runs **through** the headset run, not instead of it: the numbers can
only be taken on hardware, so it is one trip — take the meter readings
first, then work the feel questions while the headset is on. Full
protocol in HANDOFF's "NEXT SESSION: THE FRAME-RATE ROUND", including a
blank table to fill in.

**Step zero is a diagnosis, not a fix.** The wrist tag (#22) has never
met hardware, and the foveation level it reports is the tell, because
foveation is a FRAGMENT-side knob — it does nothing for draw calls:

- foveation climbs to 1.0 and frames recover → **fill-bound**; cut
  beams, framebuffer scale, smoke. Do NOT merge.
- foveation pinned at 1.0, still red → **submission-bound**; batch the
  rail, merge the lantern steel, then consider the assembly merge.
- foveation sits at 0.4, green → **stop, ship nothing.**

Two of the three say do not build the merge. That is why the round opens
with a measurement.

**The unmeasured worst case is a real build standing under a lit rig** —
wood is one draw call per piece, `BUILD_CAP` is 150 a venue, r128 draws
each eye separately, and nobody has ever stood in that room with the
meter up. Note the piece count alongside the numbers.

**Two costs have now been measured OFF hardware, which narrows what the
meter has to explain.** The workshop's own geometry is 38 meshes a venue
where it was 63 (`tools/census.js`), and the build system's per-frame
CPU at `BUILD_CAP` is 0.146 ms where it was 1.565 (`tools/buildload.js`).
So if the headset still reads red with a build standing, it is very
unlikely to be the shed furniture or the settle loop — which points at
the wood's own draw calls (the assembly merge) or at fill.

**Nothing from #48 onward has met hardware** except the two findings
that produced #76 and #78, so the feel questions are still owed too —
HANDOFF's headset section carries them, oldest first.

## Open items (rough order)

- **THE BEETLEJUICE ROUND is in flight** — see Current focus. Seven sequential PRs after the spec: the portal + cemetery (stands the plot builder up), the house exterior, the interior shell, its dressings, the afterlife, the remainder, then the cue list. The auto-cue half waits on rulings AP onward.
- **A video of a real show cannot give per-area levels unless the camera is locked off.** If a fixed-camera capture of anything ever turns up, `tools/video.js` re-runs on it in one command and the region measurement becomes valid. Worth asking for before any future video round.
- **The frame-rate round, and the headset run it rides on.** Everything from #48 onward (usability round, nine build-feel PRs, both goods PRs, the carpenters round, phase 2 + the Arc door button) has met hardware NEVER. One trip: numbers first, then the question blocks at the bottom of HANDOFF.
- **THE ASSEMBLY MERGE is specced-but-deferred** (owner, 2026-08-09) — merge a nailed assembly into one mesh, hammer un-merges. Gated on the meter reading submission-bound. The design constraints are written down in HANDOFF's frame-rate section so it can be picked up cold; the honest arithmetic is there too (after #81 a five-flat scene is ~50 draw calls of wood, and the merge takes it to ~5 — forty-five is the whole prize).
- **The outside geometry review is answered and closed** (2026-08-09): keep polygon meshes, no voxels, no SDF, no CSG-first. GLTF is a "later, for richness" — not a frame-rate move. If the question comes round again, the reasoning is in HANDOFF's 2026-08-09 Done block.
- **The other six Arc doors are still DOM-only.** #76 gave the two warehouse rollers a physical `[E]` control; both dock shutters and all four pass doors still open only from the ARC DOORS panel, so a headset cannot work them. One branch on the same `arcDoor:<key>` station id finishes it — owner's call whether it is wanted.
- **RULING W standing:** the hang and its paint are NOT saved — owner's to revisit; if reversed, save hang + paint together in one versioned blob, its own round.
- **Housekeeping:** `pr6.json` untracked in repo root (owner never ruled).
- **Remote branch backlog:** ~43 fully-merged branches still on `origin` (`carp-*`, `carp2-*`, `arc-door-button`, `feel-*`, the `handoff-*` series, and every older feature branch). Local is pruned; deleting them on GitHub is the owner's call. Suggested keep if it happens: `carpenters-landing` and the `handoff-*` series as the round record, prune the rest.
- **Owner-taste leftovers:** audit items 20 (dead weight) and 22 (duplication).
- **Accepted drifts** (documented, not bugs unless owner promotes): swung pivot re-baselines stops on reload; pipe-anchored work reloads at saved pose regardless of trim; runaway resumes on stage re-entry; rope runs pass through fly-gallery floor at y=8; cold-dropped table keeps held tilt.

## Ground rules (quick card)

- All work via PRs to `main`, one concern per PR, **never stack** — linear chain: rebase onto fresh `main` after parent merges, retest, then open.
- Suites green before and after; every new assertion **negative-checked** against the pre-change build.
- Multi-branch work: **seam check mandatory** — merge all open branches into a throwaway, rebuild, full suite.
- `gh` not installed — PRs via GitHub API with stored git credential.
- PowerShell 5.1 mangles quoted `git commit -m` — write message to file, use `-F`.
- Never `git add -A` while agent worktrees exist under `.claude/`.
- Commits use the owner's GitHub no-reply address.
- `build.sh` part order is dependency order — never sort it. Rebuild with `sh build.sh` after editing `src/`.
- jsdom `MouseEvent` has no `movementX/Y` — shim it (full14.js has one). Test probe templates eat EVERY backslash — regexes from doubled-backslash strings, and reword around apostrophes (an escaped `\'` kills the whole probe with `missing ) after argument list`).
- Test through the DOM, not cached rows; write a `tools/` probe when you cannot picture it.
- **Anything a headset must reach needs a physical thing in the room** — a DOM control does not exist in VR. A `station()` is the cheapest one and serves the desktop crosshair and the VR trigger from a single test.

## Session log

- 2026-08-08 — session opened; read HANDOFF.md; created this file.
- 2026-08-08 — tried to verify the suites: no Node.js on this machine. Repo itself verified: `main` @ `a571f18`, tree clean.
- 2026-08-08 — user installed Node v24.19.0 (winget); `npm install` in `tests/` (59 packages), full suite run: **15/15 green, `"fatal": null`**. Blocker cleared — this machine can now build and test.
- 2026-08-08 — STATE.md landed on `main` via [PR #66](https://github.com/Jackscreations21/gms-theater-game/pull/66) (merged same day).
- 2026-08-08 — created the agent documentation system: `CLAUDE.md` (root entry point, auto-loaded by Claude Code) + `docs/guide/` (ARCHITECTURE, INVARIANTS, TRAPS, TESTING, WORKFLOW, VR, BUILD-SYSTEM) — HANDOFF.md distilled into topical files; HANDOFF stays the chronological record. PR'd on branch `agent-docs`, merged as #67.
- 2026-08-08 — owner answered the five carpenter questions (catalogue on a warehouse screen / cut in the shed, build at a marked spot / real stock / hybrid: hands + a lead carpenter / VR only; planks really carried one per trip). Three scout agents mapped p6b, p4c+p2m, and the toolbelt+spec system. Spec (RULINGS X–AC) and 5-PR plan written on branch `carpenters-spec`; merged as #68.
- 2026-08-08 — carpenters PR 1/5 `carp-mark` (RULING Z): the crayon on the belt (small of the back, 0/-0.17 — every holster pair > the 0.22 draw radius), WALKABLE forward ray, ankle-height rule (bare deck only: the y≈8 gallery AND a loaded show's y=0.3 floor both refuse), one standing mark with -ARC.X correction. 3 new vr.js tests, negative-checked; 15/15 green. Merged as #69.
- 2026-08-08 — carpenters PRs 2–5 built by four sequential agents as a linear chain off #69 (owner's call: "all at once"; each link reviewed line-by-line, suites verified independently at every link): `carp-plan` (p6c: CARP_CAT 3 rows, carpSurvey, pure carpPlan with NEED/cap contracts; 16th suite tests/carp.js), `carp-lead` (the 7th figure, trade guards before the queue shift, real carry via attach + the 'carried' state, carpFetch/carpCut on the real saws with the pencil-tick fix), `carp-build` (carpHaul/carpNail, mark-yaw transform, restH-carries-the-stack settle decision, wrong-deck kill test on the Arc, save round-trip), `carp-screen` (CARPENTERS wall panel beside each order screen, META hits only — order canvas untouched — RULING X refusal strings, end-to-end-through-the-glass test). Six new traps recorded in TRAPS.md. 16/16 green at the chain tip.
- 2026-08-08 — the chain PRs #70–#73 opened at once (each targeting its parent). **Merge mishap:** the owner merged all four, but #71–#73 landed INTO their parent branches, not `main` (the retarget-after-delete step got skipped) — `main` briefly held only PRs 1–2. No work lost: the chain tip still held everything. Landed via [PR #74](https://github.com/Jackscreations21/gms-theater-game/pull/74) (`carpenters-landing` = `main` + `origin/carp-screen`), verified on that exact branch: byte-identical rebuild, 16/16, fatal null.
- 2026-08-08 — the round's record written and riding #74: HANDOFF Done block + THE CARPENTERS BRIEF marked superseded + new "NEXT SESSION: THE HEADSET RUN" with the five carpenter questions; STATE refreshed; suite count 15→16 in CLAUDE.md/TESTING.md (+ carp.js row); ARCHITECTURE parts table + crew line updated for p6c and the lead; BUILD-SYSTEM binding-specs pointer. Cache-bust is now `?v=12`.
- 2026-08-08 — **new session opened on a STALE clone**: it was parked on `handoff-carpenters` with `main` at `4986f25`, 19 commits behind — the whole carpenters round (#65–#74) plus STATE.md and the `docs/guide/` system had landed from elsewhere. Fast-forwarded to `origin/main` @ `b22c299`; verified byte-identical rebuild. **The lesson worth keeping: fetch and compare BEFORE trusting any local checkout or any memory of "what is next" — this clone's idea of the next session was three rounds out of date.**
- 2026-08-08 — clone hygiene: the three `.claude/worktrees/agent-*` worktrees removed (each verified clean first, then `git worktree prune`), and the sixteen fully-merged local branches deleted with `-d` (safe delete — git refuses anything unmerged; `git branch --no-merged origin/main` was empty first). One local branch left: `main`. `pr6.json` still untracked.
- 2026-08-08 — **the headset went on, and produced two findings.** (1) "there is no but to open iether of the garages in the arc theaters" — true, and worse than it read: every Arc door opened only from the DOM panel, and those two rollers are the only way into the Arc shed, so the whole shed was unreachable in VR. Fixed by [#76](https://github.com/Jackscreations21/gms-theater-game/pull/76): an `[E]` station on the stage side of each rear door, plus one `arcDoor:<key>` branch in `useStation` keyed off `ARC.doorMap`. Two arc.js tests driving the real `pickAll`→`describe`→`useInfo` chain, which is what the crosshair AND the VR trigger both run. (2) "i cant find the screen for the carpenters in iether warhouse" — the Arc half was finding (1); in the Palace the screen was verified present by probe, 1.7m to the right of the order glass, and the owner confirmed the build was current (the crayon was on his belt).
- 2026-08-09 — session opened by fetching FIRST (the standing lesson): this clone's `main` was 2 commits behind — #80 had landed the phase-2 record from elsewhere while STATE still said "`main` the only local branch". Fast-forwarded to `badfb98`, verified byte-identical rebuild (873188), 16/16 baseline green.
- 2026-08-09 — **the owner had the object system reviewed from outside.** Verdict accepted: keep polygon meshes; no voxels, no SDF, no CSG-first; GLTF a "later". Three corrections recorded in HANDOFF — its CSG condition is already MET (phase 2 shipped a door and a window flat; RULING AE frames and skins around an opening, and `buildLoad` replays functions a boolean result has no path through), seats have been instanced since the beginning, and its "11 InstancedMesh uses" misses that `instanced()` at `p2.txt:359` has 30 call sites.
- 2026-08-09 — **costing the review's one open idea (merge nailed wood) turned up the real finding instead.** Every wood mesh carried the same material six times; r128 submits a draw call per geometry group for an array material, so a bare plank cost six. [#81](https://github.com/Jackscreations21/gms-theater-game/pull/81) opened: one material until the faces disagree, 900 → 150 draw calls at the cap, save format unchanged, 16/16 green, all five new/changed assertions negative-checked against `main`'s build. **The merge itself deferred by the owner** pending the meter. One false green found and fixed en route (a test poked `material[2]` on a single-material mesh and read its own stray property back) — in TRAPS.
- 2026-08-09 — record updated for the next session: **THE FRAME-RATE ROUND**, with the foveation decision table, the four places to stand, a blank numbers table, the knob order, and the deferred merge's design constraints.
- 2026-08-10 — session opened by fetching FIRST (the standing lesson, and it paid again): this clone sat on the **already-merged** `workshop-record` branch with `main` 3 commits behind — #89 had landed from elsewhere. Any branch cut from this checkout would have been based on a stale `main`.
- 2026-08-10 — **the new feature is a fifth show taken off a video.** The owner asked "if i give you a video of a full show can you make the real cues and sets for it and make an auto cue feature for it that is timed currectley", then supplied `beetlejuice/videoplayback.mp4` (2 h 23 m 47 s) and "skip the first 33 seconds". `ffmpeg` installed via winget — **same PATH quirk as Node**, not on a fresh shell.
- 2026-08-10 — **Phase 1: the file measured, and the headline changed the scope.** Five ffmpeg passes (a 16×9 area-averaged grid at 5 fps — one pass instead of the brief's 24 crops — plus per-frame scene scores, `blackdetect`, `silencedetect`, `astats`). Three independent tests agree the camera is **not locked off**: layout stability median r = 0.676 (a fixed camera scores ~0.95), 723 hard cuts at 5.0/min with median shot 6.8 s, and a cut rate steady across all 143 min. Extracted frames confirmed **a bootleg compilation shot from seats**. So the brief's §2.4(c) region measurement — "the one that matters most" — is unavailable from this file. What survived: CFR, real black at Y = 16.8, **fixed exposure** (+1.1 Y through a 13.3 s blackout), 33 blackouts ≥ 1 s, 76 strong fades, fade times median 2.2 s, the act break at 71:02, no interval in the file, and the **curtain call found in the last 2.5 min** — 82 events of lights bumping every 1–3 s, ending in a 7.0 s fade to a 7.3 s black. That last one is the best evidence the method works: the bows were located without seeing a frame.
- 2026-08-10 — **two measurement lessons worth keeping.** (1) `scdet` is a frame-to-frame difference and therefore **structurally cannot see a fade** — a 4 s fade barely changes adjacent frames — so scene detection finds the EDIT, and cues have to come from `blackdetect` plus slopes measured strictly inside cut-free windows. (2) A first pass at finding wide shots scored for bright frame EDGES and returned close-ups; from a seat a wide shot is the opposite — a bright stage inside a **dark** proscenium surround, so the score is centre/edge ratio. Both are in TRAPS-worthy territory if a second video round happens.
- 2026-08-10 — `tools/video.js` landed as [#90](https://github.com/Jackscreations21/gms-theater-game/pull/90): the probe, its README entry, and the brief. Post-merge verified on `main` — byte-identical rebuild at **895034**, 17/17, `"fatal": null`, work branch deleted local and remote.
- 2026-08-10 — **the scenic arc surveyed and RULING AO taken.** 35 held wide frames, one per ~4 min, read as three contact sheets: **10–12 distinct configurations** (cemetery under a moon, the house interior, attic, bedroom, crypt, house exterior, the redecorated interior, a nested-frame afterlife, a sign set, a large angular structure, bare-stage looks), with the portal constant in nearly every frame. Owner's calls: **sets and all**, **the whole scenic arc**, and **RULING AO — same vocabulary, our own shapes**, which is what HANDOFF §3 already ruled for the other four. The tension is real and was put to him rather than decided quietly: a video makes tracing an authored scenic design easy for the first time.
- 2026-08-10 — **the spec (#91) and the plan (#92) landed, then PR 1 of 7.** Two discoveries in PR 1 reshaped everything after it, both recorded in the plan. (1) **Beetlejuice was in this repo before and was removed** — `tests/sets.js` carried an assertion, present since the initial commit, that `SHOWS.beetlejuice` must not exist. `SHOWS.beetlejuice` appears nowhere in git history, so the removal predates the repo and **no reason for it was ever recorded**. The owner has since supplied the video, asked for the show and ruled AO, so the removal is reversed deliberately, with the old assertion rewritten in place to say why rather than quietly deleted. (2) **The scene machinery in p5c was built for this show and orphaned with it** — `sceneAdd`/`sceneShow`, a cue that carries a `scene`, and a p7 UI, described in HANDOFF as "general machinery that no current show uses". This is the first production to use it, and it is what makes 10–12 configurations affordable: a scene that is off has its layers disabled, so it costs no draw call and no raycast. Only `p2d` is genuinely dead.
- 2026-08-10 — **`show.js` turned out to enforce a whole-evening structure that is documented nowhere else**, and PR 1 grew from 14 cues to 30 to meet it: a cue 0.5 and a cue 1 behind the curtain, exactly two cues that take it out, a three-cue interval 25–65% of the way in, and a curtain call exactly four cues from the end followed by blackout / warmers-on-the-cloth / house up. The full contract is now written down in the plan. The measured act break (71:02, the show's longest blackout at 13.3s) and the measured curtain call (141:02, 82 events) land exactly where that convention wants them.
- 2026-08-08 — **carpenters phase 2 specced and built in one session** off four owner asks (build several at once; a flat with a door hole; one with a window hole; with or without the sheets — plus "it wont let me rotate stuff once it is built"). Shaped live: a LIST worked in order, STACKED on the one mark, and SKIN as a switch rather than eight rows. Spec (RULINGS AD–AH) merged as [#77](https://github.com/Jackscreations21/gms-theater-game/pull/77); [#78](https://github.com/Jackscreations21/gms-theater-game/pull/78) the rotate fix; [#79](https://github.com/Jackscreations21/gms-theater-game/pull/79) the rip, the two new rows and the build list. Every PR `base=main` — the #71–#73 mishap did not repeat. Post-merge verified: `main` tree identical to the tested tip, byte-identical rebuild (873188), 16/16, `"fatal": null`, and Pages already serving the same bytes.
