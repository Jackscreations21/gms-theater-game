# THE HOUSE — code audit, 2026-08-06

Findings only — nothing has been changed. Baseline before the audit: all twelve
suites green (`real.js` boots with `"fatal": null`, the other eleven at
`--- failures: 0 ---`). Line numbers are into the `src/*.txt` parts as committed.

Method: six independent read-only passes (global state, the p2k stage swap,
dead weight, show-file duplication, coordinate discipline, test coverage), each
verifying by reading the code end to end; the global-state pass additionally
booted the built file under jsdom and probed it live. Findings reported by more
than one pass are marked *(corroborated ×N)*; the three most surprising
single-source findings were re-verified by hand against the source.

**The through-line.** The p2k swap covers the five documented globals
(`FIXTURES`/`FLY`/`CUES`/`SHOW`/`HOUSE`) plus the rig/pool/fly groups cleanly —
the old detached-DOM-row bug is properly fixed and defended. What it does not
cover is every subsystem written against the single-stage world: **the smoke
rack (`SMOKE`), the crew (`CREW`), the script runner (`Prog`), the loose-scenery
store (`SET`/`setGroup`), submasters/`selCue`, WebAudio loops, and `setTimeout`
timers.** Almost everything high-severity below is one of those seven straddling
a swap. The two timer-shaped things (follow timeouts, audio loops) are invisible
to a splice-based swap by construction.

---

## HIGH

### H1. The smoke system is a Palace-rooted global singleton *(corroborated ×3, probe-verified)*
- `p5e:98-104` — `smokeRoot()` memoizes `SMOKE.group` into the Palace's
  `ROOM_GROUP.stage` forever; `p5e:40-44` — every unit parents there and takes
  raw stage coordinates as world.
- **Load a show at the Arc and its foggers rig on the Palace's deck, 420 m from
  the set** (probe-verified: Outsiders loaded from the Arc Studio put its three
  units at world x ≈ 0, parent `"smoke"`). Meanwhile `hazeNow()` (`p4:8-11`)
  reads the global `SMOKE.haze`, so the Arc's beams thicken from smoke that is
  physically in the other building.
- `p5e:86-97` — `removeShowSmoke()` strips every `u.show` unit **game-wide**
  and is called from `showStrike` (`p5c:154`): loading any show on stage B
  removes stage A's rigged show smoke and disposes it while A's parked
  `st.show.smoke` still holds the references.
- The smoke panel (desktop and VR `p9:426-447`) follows the board, so from the
  Arc you fader machines in the other building.
- `showRoot()` (`p5c:43-55`) was taught about stages; `smokeRoot()` was not —
  that's the whole fix shape.

### H2. Crew jobs mix plan-time and execution-time stages *(corroborated ×2)*
- Jobs capture stage A's lineset objects and show pieces at `crewPlan` time
  (`p6b:246-267`), but every execution-time read — `crewFrame()` gate/rail/
  doors (`p6b:42-46, 377-405`), `crewSpot` clamps (`p6b:446-453`) — resolves
  the **live** stage.
- Walk from a Palace get-in into the Arc: door jobs open the **Arc's** dock
  shutter, hands walk to the Arc's rail while their meshes are still parented
  to the Palace stage room, and `flyIn(job.ls)` retargets the Palace's parked
  linesets — which all animate at once the moment you walk back in.
- `updateCrew` runs unconditionally every frame (`p7:1351`); `stageSwitch`
  (`p2k:73-95`) has no crew guard. User-reachable by simply walking during a
  load-in. Nearest test (`stages.js:647-685`) always `crewStop(true)`s before
  moving, so nothing catches it.

### H3. The crew's saved show look is restored onto whichever board is live when they finish *(corroborated ×2)*
- `crewLoadShow` snapshots the live board into the **global** `CREW.savedLook`/
  `savedHouse` and sets `CREW.onDone → crewWorkLight(false)` (`p6b:276-311`).
- Finish a Palace get-in while standing at the Arc: the Palace's show look and
  house levels are faded up **on the Arc's fixtures by channel number**, while
  the Palace stays parked in work light indefinitely.

### H4. `CREW.loads` is cached by show key alone, not by stage
- `p6b:223-241` (`loadsFor === SHOW.key`), never invalidated on `stageSwitch`
  (`crewForgetLoads` is only called on load/strike, `p5c` — not `p2k`).
- Same show up on two stages: LOAD OUT at the Palace reuses the **Arc's**
  cached load list — `crewStrike`/`crewDeliver` (`p6b:465-485`)
  `setPieceVisible` the Arc's parked pieces, so the Arc's set vanishes while
  the Palace's stands untouched and the crew mime carrying it out. Same via
  the `'(stock)'` key with two bare stages.

### H5. The crew's stock-set plan is stage coordinates executed as world *(corroborated ×2)*
- The plan (`p6b:232-235`) hard-codes Palace deck coordinates; `crewSpot`
  returns them raw for scenic loads (`p6b:446-448`, no venue offset — contrast
  the show-load path, which uses `worldBox2` and clamps to ARC-aware bounds);
  `placeScenic` (`p5:155-165`) parents into the global `setGroup` at the world
  origin.
- LOAD IN at an Arc stage with no show: hands pick flats at the Arc dock, walk
  through the Arc's walls and 420 m of nothing, and **build the stock set on
  the Palace's deck**. The load-out then strikes a set in the wrong building.

### H6. A running light-show program follows the board to the other theatre *(corroborated ×2)*
- `stepProgram(dt)` runs unconditionally (`p7:1345`; body `p6:332-372`) and
  resolves everything live: `chan(n)` on the live `FIXTURES`, `cue` ops into
  the live `CUES`, `fly` ops into the live `FLY`. `stageSwitch` never halts or
  parks `Prog`.
- RUN SHOW at the Palace, walk into the Arc mid-show: the remaining ops drive
  the **Arc's** rig and cue stack — curtains fly, blackouts fire, in a theatre
  with no show loaded — while the Palace's run silently dies.

---

## MEDIUM

### M1. GOES WRONG calls `makeFire` with an obsolete signature — the fireplace fire is all-NaN *(hand-verified)*
- `p5g:314-315` passes `{x, y, z, w, h, n:16}`; `makeFire` (`p5c:467-509`)
  reads `count/embers/x0/x1/z0/z1`. Every flame seeds at
  `rnd(undefined, undefined)` → NaN; both point lights sit at NaN; 260+130
  instances are allocated and none ever renders. The channel-flicker half
  (`setFirelight`) still works, which is why it half-looks right. The other two
  callers (`p5c:1065-1066`, `p5d:487`) use the current signature — this one
  missed the migration. (Cosmetic aside: `SHOW.fire =` is redundant; `makeFire`
  assigns it itself at `p5c:508`.)

### M2. `plotOutsiders` is missing the post-loop `restoreAims` the other three plots have *(hand-verified)*
- `p5c:1261-1263` goes straight from the `FIXTURES.forEach` reset to
  `RIG.haze = savedHaze`; `p5d:671`, `p5f:510`, `p5g:762` all call
  `restoreAims(homeAims)` there. After plotting THE OUTSIDERS the FOH is left
  aimed where the final look's `aimFrontAt` put it. Currently masked because
  `standByAtTheTop()` fires cue 0 and per-cue snapshots re-apply aims — luck,
  not design. Classic fixed-in-the-copies-not-the-original.

### M3. `updateNeon` is called unguarded from the core frame path
- `updateStorm` (`p5c:392`) calls `updateNeon()` — defined in **p5d** — with no
  `typeof` guard, while `updateRevolve`/`updateWrong` three lines down *are*
  guarded (`p5c:394-395`). Remove or reorder the Lost Boys file and the whole
  frame loop dies with a ReferenceError. Same class, lower stakes: `p7:768-785`
  references `wrongTrigger`/`wrongAll`/`wrongReset`/`wrongStanding`/`setRevolve`
  (p5g/p5f) unguarded in click handlers.

### M4. The scenic-placement/focus tooling is venue-locked to the Palace while its UI follows the board *(corroborated ×2)*
- `p7:465` raycasts `deck` only (the Palace slab, `p2b:63`); `p7:476` (FOCUS)
  raycasts `[deck, setGroup]`; drag clamps are Palace bounds (`p7:516-517`);
  `edSend` (`p2g:589-591`) places onto the Palace deck regardless of the board.
- At the Arc: palette and FOCUS silently do nothing — except a westward click
  can hit the *invisible* Palace deck through every wall (raycasts ignore
  `visible=false`, the codebase's own §5 trap) and aim the Arc's FOH 420 m
  across town.
- Related: `SET`/`setGroup` is one world-origin global (`p5:24`), not swapped;
  `showLoad` calls `strikeAll()` (`p5c:233`), so loading a show at the Arc
  strikes loose scenery you placed on the Palace's deck.

### M5. `crewStop` / cross-stage strike un-hides the wrong show
- `crewHideLoads` (`p6b:347-353`) reads the **live** `SHOW`. Call the crew on
  stage A, walk to B, press CREW STOP (or trigger `showStrike` there): B's
  pieces get un-hidden (no-op) while A's keep `userData.crewHidden = true`
  forever — return to A and the show is invisible with no UI path to fix it
  short of a reload.

### M6. Crew-hidden scenery is still raycastable — you can stand on invisible galleries
- `setPieceVisible` (`p5c:71-74`) sets `visible` only — no
  `layers.disableAll()`, no WALKABLE removal — while the (dead) scene system
  right below does both (`p5c:106-111`). Per the project's own §5 rule,
  raycasts ignore `visible`, so during a get-in `groundAt` lands on scenery the
  crew "haven't brought in yet" and the player stands mid-air.

### M7. Cue auto-follow: a wall-clock `setTimeout` guarded by a swapped global *(corroborated ×2)*
- `p6:165-167`: `setTimeout(()=>{ if(nextCue===idx+1) go(); }, …)`. `nextCue`
  is per-stage (`p2k:45,55`); fire a follow at the Palace and cross to the Arc
  before it expires — if the two boards happen to sit at the same position
  (common: both at the top), `go()` fires the **Arc's** next cue unbidden.
  Either way the Palace's follow is lost and never re-arms. No built-in cue
  uses `follow` (all `follow:null`); the record panel (`#qFollow`) is the only
  writer, and no test sets it.

### M8. `selCue` is not per-stage — DELETE CUE after a swap deletes the wrong cue *(corroborated ×2)*
- `p6:119` (declaration), not in `stageCapture/Restore`, not reset by
  `refreshCues`. Select a cue on one stage, walk to another, press DELETE CUE:
  `p7:949` splices the same index out of the **new** stage's stack.

### M9. `SUBS` are one-board while `CUES` are per-stage — possibly deliberate, owner should rule
- `p6:103-116`. A submaster recorded at the Palace replays onto the Arc's rig
  by channel number. By-value, so no stale objects — but inconsistent with the
  captured cue stack. If "the board's submasters travel with you" is the
  intent, document it; if not, capture them.

### M10. Rail-motor audio loop leaks for a lineset mid-travel at swap
- `railNodes` is keyed by `ls.id` (`p5:322-337`) and `railStop` fires only from
  `updateFly` on arrival (`p3:173-199`) — a parked lineset never arrives. Haul
  LS 5 and walk out mid-travel: the motor hum follows you to the Arc forever;
  the Arc's own LS 5 then can't start its sound (`railNodes[5]` occupied) and
  its stop kills the Palace's node instead. Same class, milder: the rain-rumble
  loop (`p5c:409-413`) keeps playing at the Arc where the board can't cue it
  off.

### M11. VR: a held rope survives the stage swap and keeps flying the parked lineset
- `vrClearRopes` (`p9:588-593`) empties `VR.ropes` but never nulls `VR.held`;
  `vrUpdateHold` (`p9:652-664`) writes `ls.target`, `ls.pos` **and**
  `ls.group.position.y` directly. Squeeze a rope, stick-walk into the other
  venue: every frame keeps hauling the parked lineset and repositioning a
  disposed mesh until the squeeze is released.

### M12. VR beam cap sorts local positions against a world camera — culls the wrong beams on both Arc stages
- `p9:92-94` sorts by `f.group.position` (local to `rigGroup`) against
  `camera.getWorldPosition`. On the Palace local==world; on the Arc every
  fixture measures ~394-446 m out, so "nearest 14" degenerates to "most
  stage-left 14" — the beams over your head get killed wherever you stand.
  `f._org` (`p4:361`) is the world emit position, sitting right there.

### M13. Fire billboards yaw toward the world camera from a stage-local centre
- `p5c:520-521` mixes `camera.position` (world) with `o.x0/x1` (stage-local,
  inside `showRoot()`). At the Palace it cancels; light a fire show at the Arc
  and every flame/ember quad faces the stage-left wall — paper-thin from the
  house. (Rain, same file, is clean.)

### M14. Two `function damaskTex()` in one script — last hoisted declaration wins everywhere *(hand-verified)*
- `p2:218` (crimson Palace damask) vs `p5g:104` (green Cornley wallpaper). The
  p2 version is unreachable from the moment the script parses. Only caller
  today is `p5g:240`, so nothing is visibly wrong — but any future call from
  p2's texture table silently gets the green paper, and `node --check` can't
  catch it. Only duplicate top-level name in all 599 declarations.

### M15. `SHOW`'s shape is defined in three drifting places, and `Object.assign` can't delete keys
- The literal (`p5c:15-22`), the Arc template (`p2k:220-225`), and the
  strike-reset (`p5c:148-155`) disagree. Shows write fields in none of the
  three: `wall`, `window`, `dropKey`, `neonT`, `loadedHang`. `stageRestore`
  uses `Object.assign(SHOW, st.show)` (`p2k:56`), which overwrites but never
  removes — so after a swap the live `SHOW` still carries the other stage's
  `wall`/`window`/`dropKey` objects. Latent today (all readers set-before-read
  or gate on `SHOW.key`), but it is exactly the documented trap class and
  drifts further with every show that adds a field.

### M16. Eleven of twelve suites always exit 0 — and `real.js` asserts nothing
- Only `full14.js` does `process.exit(errs?1:0)`. The others print
  `--- failures: N ---` and exit success, and their top-level
  `catch(e){console.log(…)}` (e.g. `stages.js:802-803`) turns a suite that
  fails to *boot* into a green exit. `real.js` prints a JSON diagnostic a human
  must eyeball. No `npm test` aggregator exists. Any future CI hook silently
  passes 11 suites. Fix is mechanical: mirror full14's exit-code tail.

### M17. THE OUTSIDERS' show curtain never got the split-texture fix — doubled sun
- `p5c:1010-1030` applies one un-split material to both over-wide traveler
  halves; `p5d:437-444` exists precisely to fix that ("wordmark runs across the
  overlap instead of doubling up") and p5f/p5g inherited it. The Outsiders'
  painted low sun renders once per half, roughly ±procW/4 from centre. A probe
  would confirm on sight (severity med-low; it's the oldest copy).

---

## LOW

- **L1. `ARBORS` cross-stage write** — `updateFly` indexes the Palace-only
  arbor wall with the live stage's lineset ids (`p3:187`; built `p2b:519-524`).
  Probe-verified: hauling the Arc's LS 5 moves the Palace's arbor. Invisible
  today (far venue culled, re-tracked on return); becomes visible the moment
  anything renders both.
- **L2. `camera.position` as a world point breaks under the VR rig** —
  smoke-puff billboards (`p5e:219`) and lens glows (`p4:378`) orient toward the
  headset pose *relative to the rig* (a point near the world origin) once
  `VR.rig.add(camera)` runs (`p9:122`). Cosmetic; correct pattern
  (`getWorldPosition`) is used two lines away in p9.
- **L3. `userData.moves` written where nothing reads it** — Arc dock shutter
  and pass doors (`p2j:336, 372`); the only reader traverses `SHOW.group`. A
  no-op that documents a false belief the flag is honored globally — invites
  the §5 trap back.
- **L4. Write-only flags/vars** — `userData.spread` (`p5c:323`),
  `userData.machine` (`p2h:17`, `machinePart` is the real flag), `heldPiece`
  (`p5:26`), `_cA`/`_cB` (`p6:5`).
- **L5. Local `const box` shadows the global `box()` helper** inside the two
  functions that file the world into rooms (`p2i:50, 129`; also `p5c:302`).
  Harmless; a rename hazard.
- **L6. `selLineset`-class check for `followTarget`** — not swapped, but
  re-resolved per frame; verified sound. Listed so nobody re-audits it.

---

## Dead weight (confirmed by grep across src, tests, tools, and the built file)

| What | Where | Notes |
|---|---|---|
| `p2d.txt` — THE WORKSHOP, entire file (6.7 KB) | not in `build.sh`'s list | Confirmed orphaned; a whole parallel workshop implementation that misleads readers. Ships 0 bytes. |
| Scene-change machinery (Beetlejuice remnant) | `p5c:75-122`, `p7:731-749, 780-781`, `p1:404-408`, `p2k:223` | `sceneAdd` has **zero** call sites, so `SHOW.scenes` is empty for life; `sceneShow`/`sceneNext` callers are permanently-false guards; `#sceneList`/`#scPrev`/`#scNext` is a visible panel that can never do anything. **Keep `setPieceVisible` (`p5c:71-74`) — it's alive (crew).** ~2-3 KB shipped. |
| `refreshShopUI` | `p7:1310` | Only callers were in p2d. |
| `stationOf` | `p7:1311-1314` | Live path walks `userData.station` directly. |
| `worldToStage` + `_w2s` | `p4:197-205` | The documented inverse of `stageToWorld`; zero callers. |
| `runAlong`, `runCurve` | `p2:392-407` | Ornament helpers, zero callers. |
| `arcHouseAt` | `p2j:829-832` | Accessor over the (alive) `arcRoomAt`. |
| `roomsLive` | `p2i:226-234` | Debug accessor, unused even by probes. |
| `stageOf` | `p2k:64` | `stageLive` is the one everything uses. |
| `STATIONS` | `p2c:299` | Never pushed or read; `station()` pushes to `INTERACT`. |
| `shopGroup`, `M_TIMBER`, `M_SHOP`, `M_CONC` | `p2e:25-28` | Shed remnants. `shopGroup` is a regression tombstone — `full14.js:708-709` asserts it stays empty; removing it means updating that test. |
| CSS: `.chip2` rules; `#jigWrap` + `.slot*` block | `p1:196-209` | Nothing creates them; the manual copy at `p1:893` still narrates "frame it up in the jig" — check it matches the real p2f bench. |

Cleared as false positives (alive, don't re-flag): the `Snd` SFX bank (reached
via `buildSoundUI` + the cue DSL), `boot`/`rearWall` (named IIFEs), the
`p-*`/`b-*` panels (constructed ids), `#cueChip` (child updated).

---

## Duplication across the show files (beyond M1/M2/M17)

- **Cross-file reaches (remove-a-show landmines):** `LB_CLOTH_W` (`p5d:129`)
  read by p5f:309-310 and p5g:572-573 — a `const`, so even `typeof` throws
  (§5); the whole neon/practicals machinery lives in p5d but p5f/p5g feed it;
  `updateNeon` unguarded (M3). Natural home for all of it: p5c.
- **The cue-stack builder is four diverging copies**: identical channel-group
  header (`p5c:1105`, `p5d:516`, `p5f:368`, `p5g:607`) and near-identical
  save/loop/restore footer — already drifted (M2). The interval cue triple and
  the warmer tail are pasted into all four looks arrays; warmer aim is 7.2 in
  three shows, 7.4 in Lost Boys (`p5d:636,643`) — intentional or typo,
  indistinguishable.
- **Show-curtain builder ×4** with parameter drift (weights 400/410/420, pleats
  7/.18 vs 9/.22) — and the Outsiders copy predates the split-texture fix (M17).
- **Geometry recipes**: deck slab ×3 (character-identical), back wall ×3
  (p5d↔p5f an exact pair), zigzag stair ×3, oil drum ×2.
- **Hang-plot boilerplate ×5** (four shows + `p2k:203-211`), stylistically
  diverging (p5g dropped the redundant `'none'` lines the others carry).
- Redundant `SHOW.neon = []…` resets ×3 (`showStrike` already does it); the
  channel-group map is really one rig constant that belongs beside p4/p6.

---

## What the tests don't cover (ranked by regression risk)

The §5 traps are all properly regression-tested now (detached row via
querySelectorAll, `moves`/`effect` split from both sides, same-production-
across-stages, bounded darkness measure). The gaps are elsewhere:

1. **[high] Anything in flight across a stage swap** — crew mid-job (H2-H5),
   running fades/fly moves resuming correctly, programs (H6), follow timers
   (M7). Every existing test parks the world before walking.
2. **[high] The three structural VR bypasses** — `vrEnter` (the real
   `requestSession` promise chain is skipped; the stub fires `sessionstart`
   itself), the render-loop swap (`setAnimationLoop`/`LOOP_XR` — the stub never
   calls `_loop`, so `tick()` runs exactly once with `VR.active`), and the
   pointing path (`vrSelect`→`vrPointAt` — tests fire `hit.fn()` directly, so a
   broken UV flip passes while every console on the headset is dead: the VR
   analogue of the detached-row lesson).
3. **[med] Suite exit codes / `real.js` assertions / no `npm test`** (M16).
4. **[med] Crew-hidden scenery floor probe** (M6) — `groundAt` over a hidden
   gallery should find bare deck.
5. **[med] Desktop input**: pointer-lock change handler, mouse-look clamp,
   orbit, hover targeting — all driven directly or fabricated in tests today.
6. **[low-med] `resize()`/`autoTune`**; saved hang across stages (`SHOW_HANGS`
   is per-show by design — assert or document that trims carry to the Arc).
7. **[low] Cue-engine edges** (GO mid-fade asserted, not incidental; goBack at
   0; delete/re-record), and the vacuous spots: `full14.js:1394-1427` is
   crash-only, `holes.js:68` is a dead statement (`if(!x === false){}`),
   `stages.js:502` computes `mainUp` and never uses it.

---

## Checked and sound

So the next audit doesn't re-tread: the `ls.ui` DOM-row fix is solid and
defended (`p6:485-493, 544-550`); per-fixture fade state genuinely parks and
resumes; `stageToWorld` discipline holds everywhere (exactly one conversion per
plot value, cue snapshots strictly per-stage, no double conversion found);
every `-ARC.X` cancel is complete (rooms carry only the x offset); all TRIMS
writes/compares treat trim as pipe height; all three decks are y = 0 and
everything assumes it consistently; `goodsInUse` guards cross-stage GOODS
deletion; no accidental globals (dynamic probe); no other duplicate top-level
declarations besides `damaskTex`; `userData` flags are single-meaning
post-§5-fix; VR desks/ropes rebuild per stage correctly (except M11).

---

## Suggested order, if/when fixes are picked

1. **The swap boundary** (H1-H6, M5, M7, M8, M10, M11): either park the seven
   uncovered subsystems in `stageCapture/Restore`, or halt them on
   `stageSwitch` (crew: finish-or-stop; Prog: stop; follow: cancel; audio:
   stop; smoke: per-stage root à la `showRoot()`). One design decision, many
   small fixes.
2. **The two one-line show bugs** (M1 signature, M2 `restoreAims`).
3. **The unguarded cross-file calls** (M3) and `damaskTex` rename (M14).
4. **Test infrastructure** (M16 exit codes + an `npm test` script) — cheap, and
   it hardens everything else.
5. Dead weight and duplication as taste dictates — with the note that the
   scene-change machinery's fate (delete vs. revive) decides M6's fix shape,
   since the dead code contains the correct hide implementation.

Run all twelve suites before and after anything on this list.
