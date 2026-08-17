# Traps — bugs this codebase has actually had

Every one of these cost real time. None are obvious. Check your change
against this list before opening a PR; **add new traps as you hit them.**

## three.js r128

- **Instanced bounding spheres.** r128 sizes an `InstancedMesh` bounding
  sphere from the base geometry — 1,400 seats look like one seat at the
  origin and get culled. Widening the sphere fixes culling **and breaks
  per-instance raycasts** (same sphere per instance). Rule: things you
  must stand on keep an honest local sphere + `frustumCulled = false`;
  decorative batches get the wide sphere + `raycast = ()=>{}`.
- **`visible` is only a drawing flag.** Raycasts sail through and hit
  the geometry anyway. Scenery that is "off" also needs
  `layers.disableAll()`.
- **`camera.position` stops being world** once `VR.rig.add(camera)` —
  use `getWorldPosition` for anything comparing against the camera.
- **Orientation signs** (bitten four separate times): `rotateX(-π/2)`
  maps shape-y to world −z; `rotateY(π/2)` mirrors; a box's long axis is
  local Y. Draw a probe before trusting your mental picture.

## The stage swap

- **DOM cached on a per-stage object.** Each lineset once cached its
  table row in `ls.ui`; rebuilding the table for another stage detached
  the rows and the old stage kept updating a table nobody could see.
  Rebuild-and-requery, never cache DOM across swaps.
- **Timers and holds crossing the swap**: cue-follow timeouts, running
  scripts, held VR ropes, audio loops — all have driven the WRONG
  stage's rig after a walk. Anything live must be parked, cancelled, or
  re-based on `stageSwitch`.
- `vrClearRopes` opens only ROPE holds on purpose — a carried body or
  cart survives the stage walk.

## JavaScript / concatenated-file effects

- **`typeof` does not protect a `const` declared later in the same
  script** — it throws. Function declarations hoist across the WHOLE
  concatenated file, so early code can reach late globals. `VR` is a
  `var` for this reason.
- **Duplicate function names**: two `function damaskTex()` existed once;
  hoisting means the later part's silently wins everywhere. Grep before
  naming.
- **Never hand a shared temp to a function that writes it** (the
  aliasing trap, bitten twice): `snapQuantize`'s first line overwrites
  its argument — passing the shared `_aq2` made every "lie flat" offer
  stand pieces bolt upright. `vrTapeLine` grew its own temps for the
  same reason. If a helper writes to a vector/quat argument, callers
  must not pass a shared scratch object.
- **A flag used for two purposes will eventually mean the wrong one.**
  `userData.moves` meant both "don't freeze" and "crew keep off" — the
  jungle-gym bars were never struck. Split flags.

## VR (p9)

- **vr.js pins some buttons by LITERAL PIXEL** (the fly-page RAISE/LOWER
  rows) — shifting canvas layout silently breaks them. New screens
  should use `vrHit` META so regions are found by meaning, not pixel
  (the goods picker does this; prefer it).
- Held bodies follow the grip KINEMATICALLY — never re-parent to the
  hand. The ONE exception is the paint roller (deliberate; release
  always re-racks it, including from `vrOnEnd` BEFORE the hold drops).
- Grab arbitration is nearest-wins across classes with per-class radii —
  see VR.md. Adding a grab class means extending the cross-checks.
- **A control that exists only in the DOM does not exist in VR.** Every
  Arc door — including the two warehouse rollers that are the ONLY way
  into the Arc shed — opened solely from the `#arcDoorList` panel, so in
  a headset the whole shed (order screen, carpenters screen, both saws,
  paint rack, forklift, cart) was unreachable and nobody noticed for
  four rounds. The Palace was fine only because its shed door carries an
  `[E]` station and the VR trigger runs the same `pickAll` →`describe` →
  `useInfo` chain the crosshair does. **Anything a headset must reach
  needs a physical thing in the room**; a station is the cheapest one,
  and it serves both input paths from a single test.
- **A hold that only writes `position` cannot be turned.** The `asm`
  hold shipped that way while loose wood got the grip-relative carry, so
  every assembly the carpenters ever built — and they build LYING FLAT —
  was stuck face-up on the deck for good. When a carry rule changes,
  walk every `VR.held.kind` that carries a world object, not just the
  one in front of you.

## The crew and the carpenters (p6b/p6c)

- **`crewPutDown` DISPOSES what it holds.** The show crew carry a minted
  dummy, and put-down destroys it. A real body must never ride that
  path — real carry is `h.hands.attach` / `venueRoot().attach`
  (`carpPickUp`/`carpSetDown`), the forklift's shape.
- **A carried body cannot be `'held'`** — `updateBodies` demotes any
  `'held'` body that is not the player's to `'loose'` EVERY frame, and
  the loose settle then drags it floorward while still parented to the
  walking hand. That is what the `'carried'` state is for.
- **The settle cannot see wood under wood.** `groundAt` sees
  architecture only, so a loose piece posed on other wood sinks through
  it between frames — unless its `restH` carries the stack height
  (which is exactly what restH means: where this piece rests).
- **An `'off'` crew hand still counts as free in the assign loop.** A
  new job kind must either wake its workers or watch ghosts eat the
  queue at stale positions.
- **The finish walk must skip figures that sat the run out** — or the
  lead (through a show) and the six hands (through a carpenter call)
  parade invisibly-turned-visible across the stage at every finish.
- **`sawCut` seats the off side 0.01 off the inch grid** — a second cut
  computed off the remainder's low end snaps one inch short unless a
  pencil `tick` carries the exact mark (the tick beats the snap; that
  is its job).
- **The saw bench is cleared the moment the next job is not a cut.**
  `carpCut` decides whether to keep the remainder seated by peeking at
  `CREW.jobs[0]`, and it only knew about another `carpCut` — so the
  re-seat that turns a sheet round to rip it (a `carpFetch` with no body
  of its own) found an empty bench and both skin strips silently went
  missing: 8 pieces instead of 10, with no error anywhere. Any new job
  kind that means to carry on with what is on a bench must be named in
  that peek.
- **A sheet's cut number means different things on different axes.** A
  crosscut's schedule length is the piece's LENGTH; a rip's is its
  WIDTH. Blueprint pieces that come off a rip therefore have to declare
  `w`, and anything checking a piece against its cut has to know which
  axis the entry asked for.
- **Cut schedules that exactly consume a stick are a float knife-edge**:
  a remainder within a millimetre of `SAW_MIN` lets binary float decide
  whether the saw mints an off-cut body or bins it — and the planner's
  cap count and the saw then disagree by one. Leave a fat off-cut or
  honest scrap.

## Per-frame cost in the build system

- **A settled body used to be re-tested every single frame.**
  `updateBodies` cast a recursive raycast (`groundAt`) AND scanned the
  whole body registry (`tableTopAt`) for every LOOSE piece each frame —
  including pieces lying perfectly still. At `BUILD_CAP` that is 150 of
  each per frame to conclude nothing moved: 1.565 ms on a desktop, 11.3%
  of a 72Hz budget, and a headset CPU is several times slower. A piece
  at rest is now re-tested on a rota (`REST_ROTA`), and `grabBody` wakes
  its venue so the rota is only a backstop. **If you add a way for a
  resting piece to lose its support that does not go through a grab, it
  must call `wakeBodies`** — otherwise the piece hangs for up to a rota.
  Measure with `tools/buildload.js`, which times the STEADY state rather
  than the fall; timing pieces while they are still settling measures the
  one case that was never the problem.
- **Per-frame allocation is a lag source, not a tidiness issue.**
  `groundAt` minted two `Vector3`s a call — thousands of throwaway
  objects a second once a build was standing. GC churn shows up as
  intermittent hitching rather than steady slowness, which is exactly
  what "it lags" describes and exactly what a frame-average hides.

## Merged geometry (`mergeParts`, p2)

- **A merged mesh sits at the ORIGIN.** `mergeParts` bakes each part's
  transform into its vertices, so the parts stop existing as objects. Any
  test that located a feature by `child.position` — "the nose is the mesh
  at z < −0.1" — silently finds NOTHING once that cluster merges, and
  reports the feature missing rather than moved. Pin merged features by
  `geometry.boundingBox` instead. Cost half of Task 4 before anyone
  noticed the assertion was wrong rather than the gun.
- **Only merge what never moves, is never grabbed and is never
  recoloured.** Four things in the shed are deliberately unmerged and a
  test guards each: the saw `cutter` (slides, is a grab class), the lift
  `forks` (rides the mast, pallets `attach()` to it), the paint
  `roller.head` (p9 assigns `ro.head.material = woodMat(...)` to show the
  last dip — merging it makes every dip invisible and nothing throws),
  and the cans. Merging any of them fails silently, which is the danger.
- **Parts in one call must all carry the same attributes.** Normals and
  UVs are concatenated per part; a part missing one does not pad the
  buffer, it SHIFTS it, and every subsequent vertex gets a normal
  belonging to its neighbour. Nothing throws; the object just lights
  wrong. `mergeParts` computes missing normals per part now — per part,
  because computing them on the merged result would flatten every
  cylinder's smooth shading.
- **No negative scale.** It reverses triangle winding against the shading
  normals. r128 compensates for mirroring on a live mesh via the matrix
  determinant, but baked vertices carry no determinant, so a mirrored
  part vanishes under the default `FrontSide`.

## Neon, and curves through corners

- **`neonTube` runs a CatmullRom curve THROUGH its points, so it overshoots a
  right angle.** Drawing a rectangle as five corner points gave a frame 14.5 m
  wide from a specified 12.6, dipping 0.53 m through the deck. It is the right
  tool for an organic run of tube and the wrong one for a hard-edged frame —
  those are four merged bars, registered on `SHOW.neon` by hand so the fade,
  the mains hum and the one-in-five flicker still work.
- **A material per neon tube is REQUIRED, not a draw-call mistake.**
  `updateNeon` writes a colour into every registered mesh every frame, so
  sharing one material fades them all together. This is the one place the
  shared-material rule is inverted, and a test asserts the count.

## Measuring a video (`tools/video.js`)

- **Scene detection structurally CANNOT see a fade.** `scdet` (and
  `select='gt(scene,…)'`) score the difference between *adjacent* frames. A
  four-second fade barely changes one frame to the next, so it scores near
  zero — while every camera cut scores huge. Point scene detection at a
  recording and it hands back the EDIT, not the cue list, and the count
  looks plausible enough to believe: 723 hits on a file whose defensible
  cue count was 109. Cues come from `blackdetect` plus brightness slopes
  measured strictly INSIDE cut-free windows, never across a cut.
- **Whole-frame brightness is only a lighting measurement if the camera is
  locked off.** Check that FIRST — compare a frame's normalised layout
  against the frame five seconds later; a fixed camera scores ~0.95, a
  re-framing one scored 0.676. On a moving camera a cut to a close-up
  brightens the frame with no lighting change at all, and frame regions do
  not map to stage areas, so per-area levels are not measurable at any
  threshold. Handheld is worse than edited: a smooth zoom inside one held
  shot moves brightness and no cut detector will flag it.
- **"Measure the right thing" bites in the selection step too.** A first
  pass looking for wide shots scored frames for bright EDGES — reasoning
  that a wide shot fills the frame — and returned nothing but close-ups.
  From a seat a wide shot is the *opposite*: a lit stage inside a DARK
  proscenium surround, so the score is centre/edge ratio. The heuristic was
  backwards, not merely weak, and it looked like it was working.
- **Nothing off a video is ever committed** — no frame, clip or audio.
  `tools/video.js` caches extracted numbers to the OS temp dir. Looking at
  a picture is fine and well-precedented (the locking rail came off a
  photograph); committing it is the line.

## Tests / jsdom

- **A test that proves a function EXISTS is not a test that it is
  RIGHT.** `mergeParts` shipped with four assertions that all passed
  against FIVE deliberately wrong implementations — including one that
  drops a `clone()` and mutates the caller's cached geometry, the
  shared-cache trap this codebase has hit three times. Every input was a
  fresh `BoxGeometry`, so the non-indexed branch was never exercised and
  no geometry was ever reused. **Negative-check against a WRONG
  implementation, not merely an absent one** — "it failed before the
  function existed" only proves the name resolves. Name the wrong
  version you are killing, and check it dies.
- **`canMeshes` holds Groups, not Meshes.** A paint can is a Group: a
  shared `M.steel` body plus a band coloured from the `woodMat` cache. So
  `canMeshes[i].material` is `undefined`, and an assertion about "one
  material per can" has to aim at the BANDS. The tempting fix — merging
  body and band so the can has one material — would make the whole can
  take the paint instead of just its band.
- **`vrBuildBelt()` needs `VR.rig`, which is null outside a session.**
  `VR.rig` is only built by `vrOnStart`, off a WebXR `sessionstart` that
  never fires in a probe or a plain suite, so calling the belt builder
  cold throws `Cannot read properties of null`. Make the rig first (a
  bare named Group added to `scene` — what `vrOnStart` does with it), or
  go the full route `tests/vr.js` takes with its `FakeXR`.
- **jsdom's `MouseEvent` has no `movementX`/`movementY`** — not 0,
  undefined. The game guards to 0, so synthetic hauls do nothing and it
  looks like broken game code. Shim the event (`full14.js` has it).
- **A test PROBE template eats EVERY backslash, not just regex ones.**
  The template literal is processed once when the probe string is built,
  so `/\d/` arrives as `/d/` — and an escaped apostrophe in an error
  message (`'the first one\'s height'`) arrives as an unescaped one and
  the whole probe dies with `missing ) after argument list`, pointing at
  the eval rather than the line. Build regexes from doubled-backslash
  strings, and just reword around apostrophes.
- **And no BACKTICKS anywhere in a probe — including inside comments.**
  The probe is one template literal, so a backtick used to quote a field
  name in a comment closes it early and the suite dies at PARSE time with
  something unrelated (`SyntaxError: Unexpected identifier`). It is the same
  family as the backslash and the apostrophe, and it is easier to hit,
  because quoting an identifier in prose is a natural thing to do.
- **Test through the DOM, not the model** — a detached row still fires
  its handler perfectly well. Go through `document.querySelectorAll`.
- **Measure the right thing.** Past tests passed while wrong: a darkness
  probe swept in chandeliers 30m away through a shut door; a floor probe
  found the fly gallery instead of the stage; "is anything below zero"
  says nothing about whether a set sits on the deck (compare the SAME
  production across stages). And a weak test can be masked by a stronger
  neighbouring clamp — test the barest case (the dressed-pipe/`asmH`
  lesson).
- `tests/build.js` boots a SECOND jsdom world to round-trip the save —
  it needs `url:` on JSDOM; `about:blank` has no localStorage.
- **Indexing a material that is not an array writes a stray property and
  the test reads it straight back.** The saw test set `sheet.mesh.material[2]
  = red` to paint one face, then asserted the cut pieces carried
  `material[2] === red`. Once wood held a single material, `[2] = red`
  just hung a numeric property on the SHARED cache entry — which both cut
  pieces point at — so the assertion passed while testing nothing, and
  quietly polluted that material for the rest of the run. It never went
  red. Read and write wood paint through `woodFaces`/`woodSetFaces`; more
  generally, a test that poke-sets state it later reads back proves only
  that assignment works.
- **The set is FROZEN, so `position.x` on a scene group moves nothing.**
  `lockShowStatic` walks `SHOW.group` and sets `matrixAutoUpdate = false`
  on everything in it — scenery does not move on its own. When the mover
  arrived (RULING AP), writing `sc.group.position.x` therefore updated
  the record while the house stood perfectly still on the stage, and the
  first crossing test read `position.x` straight back and passed. The
  walkable test, which reads a **world matrix**, is what caught it.
  Anything that must actually travel needs `userData.sceneTravels` (the
  freeze skips it) *and* `matrixAutoUpdate = true` set on itself, because
  the freeze can run either side of it. **Assert world matrices, never
  `position`** — same shape as the `material[2]` false green above.
- **`updateMatrixWorld(true)` on a CHILD composes against its parent's
  stale `matrixWorld`.** Call it on the root (`scene`) instead, or a
  child of a group you just moved reports the position it used to have.
  This is what made the walkable test read a movement of exactly 0.00.
- **`SHOW.goods` is the DELETE list, not the hang list.** `showStrike`
  runs `delete GOODS[k]` over every key on it, so registering a STOCK
  good there (`sky`, `cyc`, `house`…) destroys it for every production
  that loads afterwards. Three suites went down with `Cannot read
  properties of undefined (reading 'wt')`. Only goods the show MADE go
  on `SHOW.goods`; stock goods are hung and never registered.
- **A cloth is the last thing upstage, and nothing asserted it.** The
  Beetlejuice backdrop was hung on line 8 (z −6.10) while the interior
  wall stands at −9.20 and the cemetery reaches −16.15 — the thing meant
  to BACK the show was masking it, and every suite was green. Found by a
  throwaway probe printing per-scene bounding boxes against the hung
  linesets. **Order is not enough either:** the first clearance
  assertion checked only which was upstage and happily accepted 7cm
  between a cloth and a roof, against a `drape()` that waves ±0.05.
- **Move a building and its furniture stays behind.** The Palace shed
  shifted 4.5m upstage with the back wall, but `buildCart`, both
  `buildSaw`s, `buildRack` and `buildTrash` carry hardcoded `z` measured
  against the old interior — so the layout drifted to the front wall and
  the trash drum ended up 0.1m THROUGH the brick, standing on the stage.
  Anything positioned inside a movable structure must be expressed
  relative to it.
- **A probe-scope `const` SHADOWS the game function of the same name, for every
  assertion below it, whatever arguments you pass.** `tests/beetlejuice.js`
  declared `const audLive = ()=> GROUPS.house.filter(n=>chan(n)._live).length` —
  "how many lights the audience rig holds" — 165 lines above two assertions that
  call the GAME's `audLive(tr)`, "is this track really playing". The argument is
  simply ignored, so `if(audLive(tr)) throw …` was reading the number of lit
  audience lamps and **passing because the lamps happened to be dark**. Both
  assertions were decoration for a whole round, and the only symptom was a *later*
  test failing with "act one is still playing" against a build where act one was
  provably paused. The probe is one long scope and the game is in the same scope:
  **a helper in a suite must not take a name the game already uses** — grep the
  built file before naming one, the same rule the duplicate-function trap states.
- **A negative check that does not fail means the ASSERTION is weak.**
  Twice in one round the wrong build passed: a shed check that tested
  position accepted a shed trimmed from 13m to 9.4m (it should test
  DEPTH), and the clearance check above. Treat a passing negative check
  as a finding about the test, never as confirmation of the code.

- **`sceneMoveTo` on a scene that never got `sceneTravel` is a silent
  null no-op.** The act-two exterior's "flies out" cue shipped and stayed
  green for two full rounds while the drop never moved — the mover was
  never wired, and the tests read cue *state* instead of watching
  *motion*. A cue that commands movement needs a test that observes
  world-space movement over stepped `dt`. Corollary from the same round:
  a mover parked at OUT proves nothing about the geometry — the hills
  "ran off" while their full-width meshes still crossed the picture;
  assert clearance from world bounding boxes, never from mover offsets.
- **Move-vs-changeover order in `showCueExtras` is load-bearing in BOTH
  directions.** Moves applied after the changeover hide an outgoing
  whole-mover set instantly (it flies out dark); moves applied before are
  clobbered by the incoming branch's snap-to-OUT-then-home (a cue jump
  refills the stage the cue says to empty). The SPLIT RULE comment in
  `p5c` is the canonical writeup: outgoing-scene moves land before,
  everything else after — and each plain ordering fails a different
  behavioural test, which is how it must stay pinned.
- **An async test tail that hangs makes node exit 0 — a vacuous green.**
  When every remaining promise is unresolved, the event loop drains and
  the process exits cleanly without reaching the exit-code logic, and a
  runner that reads exit codes reports a pass for a suite that never
  finished. Any suite that moves its exit into async code needs a
  non-unref'd watchdog timer that fails the run if the tail never
  reports (see the AZ tail in `tests/beetlejuice.js`).

## Cue plots, sound and the pattern engine

- **A cue that omits `backdrop` does not leave the cloth alone — it flies it
  OUT.** `plotBeetlejuice` writes `FLY[13].target` on EVERY cue from the
  `backdrop` field, so a missing field is not "no change", it is a backdrop
  sailing up mid-scene with nothing in the diff to suggest it. Same for `sky`.
  Cue fields split into two kinds and it is worth knowing which you are adding:
  ones read with `=== undefined` (leave alone — `signCol`, `neon`) and ones read
  unconditionally (`backdrop`, `house`, `haze`). `fireCue` assigns
  `HOUSE.house = c.house` flat, so a partial cue record writes `undefined` into
  the masters.
- **`play()` on a media element in jsdom prints "Not implemented:
  HTMLMediaElement.prototype.play" onto the console of every suite that fires a
  cue.** It does not throw, so a try/catch will not silence it. The fix is also
  the better design: a cue records the *intent* (`want`, `seek`) and a per-frame
  pump does the talking once `readyState >= 1`. That makes the no-audio path
  total — with no file, readyState never leaves 0, so nothing is ever asked to
  play — and it gets slow loading right for nothing.
- **An effect engine scoped to one group WILL be pointed at the wrong group.**
  The 9:01 "all lights flash brite to white" was very nearly armed as
  `fx:{on:'all'}` when the engine only drove the audience rig, which would have
  flashed eight blinders and left the stage dark — the right effect on the wrong
  fourteen lamps, and nothing anywhere to say so. Unknown target names now move
  NOTHING and log it, because a typo that moves the wrong lamps is worse than
  one that moves none, and a test pins each target to its own channels.
- **Two clocks must never both drive the cue stack.** When the audio owns the
  transport it fires cues off `currentTime` AND cancels any follow the firing
  armed. Miss the cancel and every cue fires twice — once on timecode and once
  on the stopwatch a few seconds later.
- **Firing a cue by hand does not take the transport with it, and a jump-seek is
  not the same thing as a stop.** RULING BO makes an operator jump seek the music
  to the cue, and the previous round's spec therefore predicted that TOP firing
  cue 0 "composes with BO for free". It does not, and the seek is not what bites:
  the pre-show cue declares `audio:{play:'preshow'}` and **nothing in it stops act
  one** (only the GO cue does, via `stop:'preshow'`). So a hand-fired cue 0 leaves
  a `clock:true` track live, `showAudioTick` keeps the clock, and on the very NEXT
  FRAME it fires the GO cue off a playhead already past 0:35 — up to `AUD_CATCHUP`
  (40) cues at a time. Measured: TOP then GO put the board back at Q1.1 with the
  house at 0 **in two frames**, which is exactly what "when i try to press go to
  go to top os show it starts the show" describes. **Any operator action that
  means "go somewhere the music is not" has to stop the transport first** — and
  before the fire, not after, or it kills the music the cue itself asks for.

## Tests, again — two more ways to pass while wrong

- **Measuring "fast" by how FAR something travelled.** The pattern test compared
  total pan travel between the slow and fast effects, and a slow pattern with a
  wider throw covers more ground than a fast one with a narrow throw — so a
  "random" effect running at the wander frequencies sailed through on amplitude
  alone. Fast means OFTEN: count direction changes, not distance.
- **Grepping `.gitignore` for a pattern proves nothing** — commenting the rule
  out leaves the pattern text sitting in the line, so `indexOf('assets/audio/*')`
  passes against a file that ignores nothing. Ask git: `git check-ignore -q
  <path>` answers the question you actually meant.
- **And the backtick trap bit again, in a COMMENT.** Quoting a field name in
  prose inside a probe closes the template literal and the suite dies at parse
  time pointing somewhere unrelated. It is already listed above; it is listed
  twice now because it is the easiest one in this file to walk into.

## Negative checks — the one that fools you

- **A negative check whose MUTATION does not apply reads exactly like an
  assertion that does not fire.** Both look like `ok` where you expected `ERR`,
  and the wrong conclusion ("my assertion is weak") is the same shape as the
  right one, so you go and strengthen a test that was fine. It happened in the
  BF/BG round: the mutation was `s/const BLIND_RANK = 0.9/…/`, and the two
  constants share one statement — `const BLIND_POWER = 4.6, BLIND_RANK = 0.9;`
  — so sed matched nothing, built an unchanged file, and the suite correctly
  passed. **Prove the mutation landed before you read the result:** `grep` the
  built line back, or have the patch step fail loudly when its pattern misses.
  This is the sibling of "a negative check that does not fail means the
  ASSERTION is weak" above — and the two are told apart only by looking.

- **A negative-check harness that restores `src/` but not the BUILD leaves
  every later run testing the mutant.** The suites run against
  `the-house.html`, so `cp` -ing the backup over `src/p4.txt` at the end of a
  case restores the source and leaves the built file carrying the last
  mutation. The next thing you run is then measuring the wrong program, and it
  does not announce itself: it showed up as `uHaze` frozen at 0.42 for every
  cue while `hazeNow()` correctly returned 0.7, which reads exactly like a real
  bug in the rig and cost a round of instrumenting `updateRig` before anyone
  checked what was in the build. **Rebuild in the restore step, not just in the
  mutate step.**

- **A test that reimplements the thing it is testing agrees with itself
  whatever the code does.** The first RULING BM assertion recomputed the beam
  formula (`0.25 + haze*1.15`) in the test and compared cue records to each
  other. Replacing the whole `uHaze` line in the shader with a constant did not
  move it one bit — the plot still said what it said, and the test was only ever
  reading the plot. Assert on the value the ENGINE produces: fire the cue, run a
  frame, read the uniform off a real beam.

- **A mutation can land in the TEXT and not in the BEHAVIOUR, and that reads
  exactly like a weak assertion too.** The BY/CB round's distortion check
  replaced `root.scale.multiplyScalar(s)` with a version that stretched x by
  `(targetW / size.x) / s` — and for a width-filling set `s` already IS
  `targetW / size.x`, so the factor was 1.0 and the "mutant" was the original
  program. The harness proved the literal was replaced (the fix for the sibling
  trap above) and still told you nothing. **Make the mutation change an
  OBSERVABLE**, and sanity-check that the mutant's own numbers differ from the
  clean build's before believing an `ok`.

- **A bound that nothing in the delivery exercises cannot be negative-checked at
  all.** Deleting the back-wall clamp from `bjFitAndSeat` changed no number
  anywhere, because his deepest set reaches 12.98m against 16.70m of stage. The
  clamp was unobservable, not sound. **A guard whose limit is never approached
  needs a fixture that approaches it** — a deliberately 6m-deep box, which
  measures 42.95m without the clamp and 16.70m with it.

- **`undefined` in a comparison passes the test and says nothing.**
  `box.max.z > -az.BJ_FIT_AIR + 0.01` where the constant does not exist yet is
  `5.45 > NaN`, which is `false` — so an assertion written to catch a set
  hanging five metres over the audience passed against the build that did
  exactly that. Every comparison against a constant fetched out of the build
  needs an explicit `=== undefined` guard first, or the whole test is decoration
  until the feature exists.

- **A mutation that breaks an EARLIER clause never reaches the clause it was
  meant to prove — and the run still prints `ERR` against the case by name, so
  it reads exactly like a check that fired.** A case throws on its first
  failure; everything below that line is untested. PR 7's M4 (the mover block
  read one channel late) was written to prove the *"and the block STOPS"* tail
  and broke the channel-order clause forty lines above it; the tail had never
  run at all. **Read WHICH message came back, not just that one did** — if it
  is not the clause you aimed at, the check has not been done. The fix is a
  mutation built to leave the earlier clauses green: M5 wrote the last mover a
  second time from the channel just *past* the block, which is silent under the
  first frame (that channel is 0, and RULING EX makes 0 silence) and bites only
  under the boundary frame. It named `roof:all`, the last mover, and nothing
  else failed. Sibling of "a mutation can prove the wrong CLAUSE" — that one is
  a guard swallowing the mutation, this one is the case aborting before it
  arrives.

- **A test frame built by arithmetic into a `Uint8Array` wraps silently.** The
  mover channel-order case gives each channel a distinct byte, `20 + i*17`, so
  that two movers which swapped places land on wrong metres. Twelve movers fit;
  a fifteenth would compute 258, and `Uint8Array` stores that as **2**. The case
  would then compare a target against what 258 should have meant while the game
  had been handed a 2, and fail for a reason with nothing to do with the code.
  The set is data-driven — a show can grow a scene — so the case throws if its
  last byte exceeds 255.

- **AN ASSERTION CAN READ GREEN BECAUSE OF THE ORDER ITS OWN SETUP RUNS IN, and
  this is the sharpest instance the project has had.** RULING EY was found only
  because a reviewer moved a line. The Art-Net band channels write on a band
  CHANGE and their memories start at `-1`, so the first frame of an *unpatched*
  universe reads band 0 and acts on it — it hauled the Beetlejuice sign 11.36m
  to its FLOOR stop. (RULING EZ has since taken the sign off a band entirely,
  so that reproduction no longer fires — the LESSON is what this entry is for,
  not the case.) The case written to prove the sign SAFE calls `deskOn()`
  (which delivers a frame, which establishes band 0) **before** it puts the sign
  on its stop, so its 120 measured frames are a no-change band and it passes.
  **The assertion written to prove the thing safe is the thing that concealed
  the hole.** When a system is change-driven, ask what state the SETUP left the
  change-detector in, and place the subject before the detector is armed.

- **A generated document is only as honest as the set it MEASURES; the rest is
  prose wearing a measurement's clothes.** `tools/artnet-map.js` claimed
  "nothing here is typed from a table" and then rebuilt two of its channel
  tables by re-indexing the same constants the game indexes, never calling
  `artBands` at all. Three mutations — swapping the two channels, reversing the
  bands, killing one outright — each produced a **byte-identical map**. Same for
  red/green/blue, folded into one measurement, so swapping red and blue changed
  nothing. **For every block a generated file claims, name the function it
  DRIVES and mutate that function to prove the file moves.** If it does not
  move, the claim is prose and the warrant is void for that block.

## Tests — stepping the frame, and state that carries

- **The real frame is `updateFades` → `updateRig` → `updateStorm`, and stepping
  only the last one measures a rig that never moves.** `updateFades` walks
  `f.level` along the cue's fade and `updateRig` turns that into `f._lvl`, which
  is what everything downstream reads. A loop of `updateStorm(1/60)` after
  `fireCue` therefore leaves the fixtures wherever the PREVIOUS test left them —
  which made a correct RULING CC build fail its own blackout assertion at 0.550.
  Step all three, and carry a clock: `updateRig` takes `(dt, t)`.

- **A test that reloads the show proves nothing about per-frame state.** The
  first CC blackout check called `showLoad` and then asserted `SHOW.bjFillNow`
  was low — but a fresh load has nothing registered, `bjUpdateSetFill` returns
  on its first line, and `undefined > 0.02` is false. It passed against a
  mutation that made the fill a fixed level and would have lit every blackout in
  the show. **If a per-frame system needs registered state, register it inside
  the test**, then assert.

- **Deriving "which scenes are still stand-in" is not the same as knowing.** Two
  attempts at the shared-material assertion both reported a leak that was not
  there: naming four scenes as "the ones he never modelled" (earlier tests in
  the same file land fixtures INTO the cemetery), then deriving the list from
  `userData.bjApplied` (which `loadSetModels` sets and `bjApplyModel` does not,
  so a suite calling the apply directly leaves every scene looking untouched).
  **A test about "ours versus theirs" should build its own state**: reload,
  snapshot, land exactly one thing, compare.

- **Snapshot the property, not a pattern that resembles it.** "No stand-in
  material has a white emissive" flagged two — the sign's panel and its arrow
  are BUILT with `emissive:0xffffff` and an `emissiveMap`. What mattered was
  that nothing CHANGED, so record `{emissive, emissiveIntensity, emissiveMap}`
  before and diff after.

## Parked sets, and stand-ins (RULINGS BQ / CE)

- **A position fitted to HIS model parks the STAND-IN in the picture.** The
  exterior's wing park was sized off his fitted 8.6m house and measured clear;
  the stand-in it replaces is a **12.6m painted drop** — a drop fills the opening,
  which is why it used to fly — so the same offset parked the fallback at x −4.70,
  in the middle of a 13.6m picture. The attic went the same way in the other
  direction: sized to his model it put the stand-in **0.90m through the Palace
  brick**. **The stand-in is the BIGGER case and it is the one that plays** on a
  fresh clone, over slow wifi before a 27MB file lands, and in **every suite**,
  because jsdom fetches nothing. Size a park to the stand-in and let his model be
  the comfortable case. Two new assertions caught both, and only because they
  measured world boxes rather than reading the constants back.
- **`sceneOff` meant two things and BQ split them.** It meant *not drawn* AND
  *not seen*, and those were the same thing while a struck set was switched off.
  A parked set is drawn ON PURPOSE, so every test of "can the audience see it"
  written as `!sceneOff` silently inverted: the dress deferral (RULING AY) decided
  a parked wagon was in full view and **deferred the swap for ever**, so the room
  was called on still wearing the old dressing — the exact pop AY exists to
  prevent. The condition is now drawn **and** (`sc.on` or still travelling): on is
  seen, mid-exit is seen, parked is not. Same family as `userData.moves` meaning
  both "don't freeze" and "crew keep off".
- **Layers were doing two jobs too** — not drawn and not raycast — and BQ only
  wants the first back. A parked mesh gets `raycast = NOOP` instead, restored only
  for meshes that did not already carry their own (a decorative instanced batch
  does, deliberately, and deleting it would put 1,400 seats back on every pick).
  Measured: leaving parked sets pickable costs **9.23ms — 83% of a 90Hz frame —
  from the wings looking at the parked house**, against 1.11ms with the opt-out,
  and only 1.0x from a seat, because off-axis the bounding sphere rejects for
  nothing. Where you point is the whole cost; the seat figure is the misleading
  one. `tools/parked.js` keeps both.
- **A wrapper group inserted to carry a park breaks whatever reads the scene's
  structure.** The first version wrapped each scene's children and the model
  importer — which strips the built-in shell out of `sc.group` before landing a
  whole house — found the wrapper instead of the shell, so his house landed **on
  top of** ours. `sceneMvAdvance` writes one axis and nothing else, so two movers
  over the SAME group are free as long as the axes differ: the wagon keeps z and
  the park takes x. And if you do wrap, wrap **after** the scene is fully built —
  registered beside `sceneTravel`, the interior's park wrapped the shell only and
  the parked room measured 27.6m wide, three dressings still standing on stage.

## Probes

- **A probe that reports a ruling as a fault is worse than no probe.**
  `tools/models.js` was written before RULINGS CA/CB/CD and went on calling
  their deliberate results defects: "OVER the opening by 3.56m" for a set the
  owner ruled may overrun the border, "DOWNSTAGE of the arch" for a sign that
  hangs there on purpose. Three false faults in a five-row table is enough to
  stop trusting the two real ones. **A probe that judges has to read the same
  declaration the code does** — it consults the manifest now and prints "3.56m
  masked by the border (CB)".

- **Measure a set in its CONTAINER's frame, not the world's.** The same probe
  read the three houses at z −24.8..−11.8 and called them 2.98m too deep,
  because the wagon parks at `BJ_WAGON_BACK` −10 and a world box reports the
  parked offset as the set's position. On stage they sit −14.8..−1.8.
  `box.applyMatrix4(inv(container.matrixWorld))` — and `updateWorldMatrix(true,
  …)` first, because the landed subtree is frozen and its ancestors may be
  stale.

- **The number you would have guessed is not the number.** RULING BY's cost went
  into a spec as "~0.031ms, affordable" and measured at **4.29ms — 38.6% of a
  90Hz frame**, a factor of 100 out, against 0.0018ms for the 12-triangle
  stand-in it replaced. `groundAt` raycasts every `WALKABLE` entry once for the
  player *plus once per settling body*, and three.js `intersectObjects` collects
  and sorts EVERY intersection, so **there is no early exit and a miss costs the
  same as a hit.** A 99k-triangle mesh cannot go on `WALKABLE`. The estimate
  would have shipped a frame-rate cliff onto the one platform the whole budget
  system exists to protect. `tools/walkcost.js` keeps the number.

## The CF–CM round — six more ways to be wrong

- **A BACKTICK IN A PROBE COMMENT BIT THREE TIMES IN ONE ROUND.** It is listed
  twice above already and it is listed a third time because frequency is the
  finding: quoting an identifier in prose (`` `portal` ``, `` `follow > 0` ``,
  `` `open` ``) is the single most natural thing to type in a comment, and the
  probe is one template literal, so it closes the string and the suite dies at
  PARSE time pointing at an unrelated line. **Sweep for it mechanically** rather
  than trusting care — find the `const probe = ` line and its closing backtick
  and grep every line between:
  ```sh
  node -e "s=require('fs').readFileSync('tests/beetlejuice.js','utf8').split('\n');
           /* ...report any line between the probe delimiters containing a backtick */"
  ```
  Three parse failures in one round is three round-trips that a five-second check
  removes.

- **`null >= 0` is TRUE in JavaScript.** A follow-chain assertion read
  `!(CUES[i].follow > 0)`, and RULING CK introduced a legitimate follow of ZERO
  (two cues on the same second), so it was loosened to `>= 0` — which silently
  reclassified the two deliberate `follow:null` holds as cues that arm the next
  one. The suite said "0 holds, expected 2" and the *code* was right. Loosening a
  strictly-positive test to non-negative is never a safe edit where `null` is a
  meaningful value: test the type first.

- **A negative check against a state the assertion already satisfies proves
  nothing, and reads as a weak assertion.** "The START OF SHOW rail call fires
  nothing" was written straight after `showLoad`, which leaves the board standing
  **at** cue 0 — so a mutant that called `cueFiredByHand(0)` moved the pointer
  from 1 to 1 and the house from 0.30 to 0.30, and every check passed against a
  build where the fly rail started the show. **Move the system away from the
  state you are asserting it does not reach**, then assert. Sibling of "a test
  that reloads the show proves nothing about per-frame state".

- **A test that picks its subject by the property it then asserts agrees with
  itself.** The re-anchored focus-leak test first selected "the next cue whose
  aims are not up" and then checked its aims were not up. Take the subject **by
  position** (the next cue in the stack, whatever it holds), never by the
  measurement. Same family as the test that reimplemented the beam formula.

- **The furniture trap, one level up: it is the TESTS that go stale.** Moving
  `PAL_DEEP` 4.5 → 8.5 took the shed and every piece of furniture in it correctly,
  because they are all expressed off `PAL_BACK`/`PAL_DEEP` — that lesson had
  taken. What broke was **four suites** still probing literal `-25` and `-35`,
  numbers measured against the FIRST position of this wall, which are now shed
  floor and open stage. Anything a test probes inside a movable structure has to
  be expressed off the structure (`SHEDS.palace`, `ROOMS.shed`) or it fails on a
  building that is perfectly correct.

- **A wall fitted to the STAND-IN leaves HIS model in the street** — the exact
  inverse of the RULING BQ trap, and it hid for the same reason in reverse. The
  Palace was made 4.5m deeper for the wagon in 2026-08-10, measured against the
  stand-in interior (7.68m deep, clears by 2.26m). His house is **12.98m** and
  stood **3.28m through the brick**. The assertion that guards it lives in the
  synchronous probe, which fetches nothing, so it had only ever measured the
  stand-in and always passed. **Whichever is bigger is the case the number has to
  hold** — check both, every time, and put the assertion where the model
  actually loads.

- **A probe reading the wrong field prints an empty section, which is a probe
  lying quietly.** `tools/deeper.js` looked for `sc.park` (does not exist) and
  then `sc.pmv.park` (exists only for a set that grew a SECOND mover) and
  reported "nothing travels upstage" about a building with a 13m attic parked
  8.8m up it. RULING CE's tracked sets park on the mover they already have, so
  the field that names a park is exactly the one that misses them. **A section
  that prints nothing needs a line saying so** — and then you notice.

- **And the sibling of that, one field further out: a probe reading a game
  `const` that was never in its handout gets `undefined` and prints a confident
  wrong answer.** `tools/parked.js` reaches the game through `window.__P`,
  because `SHOW`, `D`, `FLY` and friends are `const`s of the eval program and
  never become window properties. A new helper read `P.CUES` — a `const` too,
  and **not** in the handout — so `for(const c of P.CUES || [])` iterated
  nothing, returned null, and the probe reported the house wagon as "DECLARES A
  PARK AND NEVER MOVES" about a wagon that moves ten metres. The `|| []` is what
  turns a missing handout into a silent lie. **Throw on a handout that is not
  there**, and add the name to the `__P` list the moment you first read it.

- **A comment that says something is IMPOSSIBLE is a fact with a date on it.**
  RULING BQ parked the house wagon sideways and wrote down why it could not go
  upstage: "12.98m does not fit between the backdrop at -10.90 and the brick at
  -21.5". True when written. RULING CL then moved the brick to -25.5 **for a
  completely unrelated reason** — his house stood in the street at the curtain
  call — and the gap became 14.60m. Nothing connected the two, because the
  impossibility was recorded as prose rather than as an assertion, and the set
  went on parking in a wing for a reason that had stopped being true. **When a
  comment rules something out on a number, name the number** — the next person
  to move it then has something to grep for.

- **A BOX HAS VERTICES ONLY AT ITS CORNERS, so sampling a merged frame per
  vertex measures nothing between them.** It bit twice in one PR, in opposite
  directions. Sampling "the top edge over x = −6" of a straight bar running from
  −7.9 to +0.2 found **no vertex at all** and threw against a perfectly correct
  frame. Then a sill test counting vertices under y 0.5 *between the legs* found
  none either — because the sill's four corners are at x ±7.75 — and **passed
  against a build with the sill put back**, which the negative check caught and
  nothing else would have. `mergeParts` output is boxes: 8 vertices each,
  wherever the geometry visually is. Ask a question a corner can answer —
  "is any vertex above this line", "does any TRIANGLE span the centre low
  down" — or walk the index buffer.

- **The escaped apostrophe in a probe bit for a fourth time**, and it is written
  up twice already. Worth only the frequency note, and one detail: it dies at
  EVAL with `missing ) after argument list` pointing at the eval CALL SITE, so
  the stack reads `tests/beetlejuice.js:<the eval line>` and looks like a fault
  in the game source rather than in the assertion you just typed.

## The CZ–DF round — the probe was the bug

- **A SIGHTLINE PROBE THAT CASTS FROM ONE EYE MEASURES THE KINDEST SEAT IN THE
  HOUSE.** `tools/parked.js` cast from `(0, 1.35, 12)` — the middle of the
  stalls — and reported every park MASKED for two rounds. The binding case is
  the **extreme side seat**, which looks diagonally across the picture and
  straight into the OPPOSITE wing; that is why real masking is set to the worst
  sightline in the house rather than to the axis. Fifty eyes (stalls, mezzanine,
  balcony) now, and the answer still held — but it was luck that it did.
- **AND IT AIMED AT THE OPENING RATHER THAN AT THE SET.** A grid of rays across
  the picture answers "what is in the picture"; it can only find a parked set by
  accident, and it reports a confident 0% for a set standing three metres to the
  side of where the rays were pointed. Cast from each eye **at sample points on
  the thing you are asking about**, and ask whether it is the FIRST hit.
- **A BOX HAS VERTICES ONLY AT ITS CORNERS, WEARING ITS OTHER HAT.** The known
  trap is that per-vertex sampling measures nothing BETWEEN the corners. This is
  the inverse: sampling each mesh's world-box corners plus its centre gave the
  imported houses — **ONE merged mesh each** — exactly nine sample points, eight
  of them in mid-air metres from any geometry. Every ray missed and the probe
  printed `0/450 UNSEEN`. Walk the **position attribute**, strided to a budget,
  so every sample is ON the surface.
- **ESTABLISHING WHAT A COMPLAINT IS *NOT* CAN BE MOST OF THE WORK, and it is
  what stops a wrong fix.** "Sets go fully out past the wings so they cant be
  seen" reads as a sightline fault. Twelve thousand rays from fifty seats proved
  every park already invisible, so **any assertion written on visibility would
  have passed against the very build he objected to.** He wanted the WINGS clear
  — working space, crew, entrances, the locking rail — which is a question about
  where a set stands, not about who can see it.
- **WHEN A REQUEST COLLIDES WITH AN EXISTING RULING, THE COLLISION IS THE THING
  TO ASK ABOUT.** Read strictly, "no set should be parked in a wing" leaves only
  the fly tower, because the wings ARE the sides of a 44m stage. Acting on that
  put six of seven sets in the air, inverted RULING CE ("as few sets fly as
  possible"), threw away the CQ/CS side entrances, and cost four assertion
  reversals — all reverted by one sentence of correction. Two questions had
  already been asked; the third was the one that mattered and it came last.
  **The empty space was BEHIND the sets, not in front of them:** the bedroom
  cleared the masking by 0.49m with six metres of wing standing unused outboard.
- **A MUTATION CAN PROVE THE WRONG CLAUSE.** A negative check that gives the
  flash cue a `portal` field trips the assertion's own *guard* clause and never
  reaches the emissive check underneath it — so it reads as a fired check while
  leaving the real one unexercised. Aim a mutation at the MECHANISM (here,
  breaking "a cue that says nothing puts it out"), and confirm which clause
  spoke.
- **A CLAUSE THAT CANNOT FIRE SHOULD SAY SO IN THE FILE.** CZ's ordering check
  compares the frame and the music against the house, and all three land in ONE
  call — so it can only ever be equal. It is kept as a guard for whoever splits
  `updateHouseWait` later, and labelled, rather than left looking live.
- **A LITERAL MEASURED FROM A CONSTANT BECOMES A TRIPWIRE FOR THAT CONSTANT.**
  "The netherworld is not thinned as well" was written as "deeper than 4m", a
  number taken when `BJ_AFT_DEEP` was 0.55. RULING DD took the set to 4.42m —
  0.34m from tripping a bound that was never about depth at all. Express the
  check against the constant it is really about (`BJ_AFT_DEEP`, `BJ_THIN`), or
  the next retune fights an unrelated literal.
- **HIDING ARCHITECTURE FOR ONE PRODUCTION: THE RESTORE DOES NOT BELONG TO THE
  SHOW THAT HID IT.** RULING DG takes the gold proscenium down for Beetlejuice.
  The obvious place to put it back is the show — and that leaves the arch down
  the first time a strike happens by another path, which the **stage swap** is.
  `prosGoldSet(true)` lives in `showStrike`, unconditionally, so it runs for a
  production that never touched it and costs four visibility flags. The negative
  check fires from the other side: with the restore removed, the next show finds
  0 of 4 pieces up. Also **collect, do not reparent** — `p2i`'s `buildRooms()`
  sorts `world.children` and files whatever exists at that moment, and these are
  all on `STATIC`; a group slipped in between changes what both see for five
  productions to serve one. And **visible-false is not hidden**: the layers have
  to go off too, or the arch is still in every raycast.
- **A TEST CAN BLOCK THE SWITCH ITS OWN COMMENT ADVERTISES.** DG keeps the CY
  rake as a one-line switch — and flipping it failed the suite with "nothing on
  the top side", because a fixed ±0.6 window round a flat header cannot contain
  a bar whose ends move ±0.887. The escape hatch was nominal until a negative
  check tried it. **If a comment says "one line to undo", spend the build
  proving that.** The same check also showed it is one line in `p5h` AND one in
  `p4`: leaning the frame alone leaves the blinders on a flat line, which is CY's
  own assertion doing its job.
- **A CHECK THAT ALWAYS STEPS TO COMPLETION CANNOT SEE A MID-TRAVEL BUG.** Every
  clause of the sign-stops test drove a haul and then stepped until it arrived,
  so `flyExtraAtStop` reading the mover's **target** instead of its live offset
  passed all of them — the desk row would have named the place it was heading for
  the whole way there. Assert the in-between state explicitly: eight frames in,
  the row must read "moving".
- **AND THE BACKTICK IN A PROBE COMMENT BIT A SIXTH TIME.** `probe-lint.js`,
  written last round for exactly this, caught it in five seconds — it had simply
  not been re-run after the probe was edited. The rule is not "be careful", it
  is **run the lint after every probe edit**.

## The EL–EW round — one test mistake, fifteen times

- **THE COMMONEST WEAK ASSERTION IN THIS REPO IS A SETUP THAT ALREADY SATISFIES
  IT.** Fifteen assertions in one round were green against builds that did the
  OPPOSITE of what the assertion's own name claimed, and almost all of them
  were this: a duration check on a rig whose durations were already zero; a
  "switching off snaps nothing" comparison taken on a rig already dark; a
  parked-line case that began with the line standing still; a BACK case entered
  at a pointer where refused and worked both leave 1; a "walked into the Palace"
  case that began with the handover already cleared. The rule that catches it:
  **move the system away from the state you are asserting it does not reach,
  and prove you moved it** — then assert. Every one was found by a negative
  check that did not fire, and by nothing else.
- **A MUTATION CAN BE MASKED BY A CLAMP THAT AGREES AT BOTH ENDS.** RULING EQ
  maps a fly target onto `[minTrimOf, OUT_TRIM]` through `flyTo`, which clamps.
  A mutant that ramped from the DECK instead landed on the right value at byte
  0 (clamped up) AND at byte 255 (the grid is the grid) — only byte 128
  differed, 11.75m against 13.56m. **Assert the middle of any mapped range**,
  not only its ends.
- **AND BY A SECOND GUARD THAT DOES THE SAME JOB.** Two band guards each
  covered the case the other missed, so removing either alone left the suite
  green — which is how a band memory keyed on `SHOW.key` survived, and it is
  wrong, because **reloading the same show builds fresh scene objects and the
  name has not changed.** A redundant guard and a missing test read identically
  from outside; the only way to tell them apart is to go and look at each check
  that did not fire.
- **"IT DID NOT MOVE" IS NOT THE ONLY OBSERVABLE.** A parked lineset that keeps
  its old target does not move — the speed is zero — so a position assertion
  passed. What was wrong was `ls.moving`, which never cleared, so `Snd.railStop`
  never ran and the rail motor loop played for the rest of the session on a
  line that had not moved for ten minutes. Ask what ELSE a wrong version would
  leave behind: a flag, a sound, a commanded-but-unreachable target.
- **A GATE LIST WRITTEN FROM THE UI MISSES EVERY PER-FRAME WRITER.** RULING EM
  named the writers to gate by walking the board's controls. A control writes
  when a hand moves; the ones it missed write every frame and therefore always
  win — the firelight, `audFxStep`, a running script, and two sliders that
  bypass `setSection*` entirely. **And one of them could never be turned off
  again**: `SHOW.flicker`/`AUD.fx` are cleared only by `showCueFx`, which only
  `fireCue` reaches, and the gate was on `fireCue`. Gate on the RULE ("nothing
  writes a fixture or a circuit while X"), never on a list of callers.
- **A HALF-REFUSAL IS WORSE THAN EITHER WHOLE ANSWER.** `standByAtTheTop`
  called `fireCue`, took its refusal *and its toast*, then wrote all 39
  fixtures itself. The operator got told the board had yielded, and watched it
  write anyway.
- **AN UNPATCHED UNIVERSE IS THE LIKELIEST FIRST REAL USE, AND ZERO IS A
  COMMAND.** A desk patched only for the light channels sends zeros on
  everything else. Zeros shut the house curtain in front of the audience
  (channel 309) at **0.42 of its full draw a second** — about 2.4s end to end;
  `ls.open` is a FRACTION and "0.42/s" read as metres for two rounds — and, as
  ET was first written, commanded every set mover home, walking a parked 19.5m
  attic onto the deck while it is drawn. Anything that reads a byte as a
  POSITION needs an answer to "what does 0 mean when nobody is driving this",
  and the flys' answer (a speed byte, where 0 is parked) is the pattern.
  **Updated 2026-08-16, twice in one day.** The traveler is answered by its
  lineset's speed byte; the set movers by RULING EX making 0 no command; and
  **the SIGN by RULING EZ**, which took it off a band and onto its own
  target/speed pair, so a zero speed byte parks it. **Only channel 307, the
  house dressing, is still unanswered** — RULING EY rules the fix and
  FUTURE.md carries the work. Four ways of saying "0 means nobody is driving
  this", arrived at one at a time, each after somebody measured a dead
  universe — which is itself the lesson: **nobody found any of them by
  reading the code.**

  **And RULING FC then added a fifth family that is ruled to have NO answer at
  all.** The proscenium neon's intensity is a LIGHT, so byte 0 is a real
  command meaning black, exactly as it is for the 39 lanterns — the same 512
  zeros black those too, so it reads as "the desk is dark" rather than "the
  game broke". That is not an oversight; it is the line between scenery and
  light, and FC is the first time this project has had to draw it. The test
  for it needs a SENTINEL rather than a starting position, because `deskOn()`
  delivers zeros and "byte 0 blacks it" is otherwise the state the setup left.
- **A FIX WRITTEN IN RESPONSE TO A REVIEW IS ITSELF UNREVIEWED CODE, AND IT IS
  THE LEAST-WATCHED CODE ON THE BRANCH.** The branch has just been read
  end-to-end, the findings are being closed out, and the fixes go in under the
  glow of a review that happened *before they existed*. RULING FC's first
  review found the interval gate failing open on the portal; the fix widened
  the gate from `a.portal` to a `deskOwnsIt` that **also gated `HOUSE.house`** —
  a second behaviour change, correct as it happens, with **no assertion behind
  it at all**, because the case had been written for the portal. It merged as
  "reviewed" on the strength of a review that never saw it. **Read the fixes as
  a diff of their own, and ask what each one WIDENED**, not just whether it
  closes the finding.

  **And the same trap the branch had just documented reappeared inside the
  fix.** One commit earlier this file gained the note that the FC case needs a
  SENTINEL because `deskOn()` delivers zeros. The gate added in the very next
  commit had exactly that hole again — the desk's own frame writes
  `HOUSE.house` to 0, so *"it is not 0.5"* is the state the setup left. Writing
  a trap down does not inoculate the next commit against it; the assertion
  plants `HOUSE.house = -1`, a level no byte and no queue can produce.

  **The mirror clause is what proves a gate has not simply failed the other
  way.** "The desk did not stomp it" and "nothing wrote it at all" look
  identical from one assertion. The Palace clause asserts the level is
  *withheld*; the Arc clause asserts the same level *lands*. Without the
  second, a gate that failed SHUT everywhere would have read as a pass — which
  is the exact failure the first review had just caught in the other direction.
- **A NEGATIVE RESULT IS ONLY AS GOOD AS THE OPPONENT YOU TESTED IT AGAINST.**
  The relay refuses `SO_REUSEADDR` and its comment says a port clash will
  therefore be loud. A session measured QLC+ running alongside the relay, saw
  no `EADDRINUSE`, and wrote into STATE that **no clash is ever raised and the
  comment's reasoning is wrong.** Both halves of that were too broad. Measured
  again on real hardware: **QLC+ vs the relay genuinely does not clash** —
  QLC+ sets `SO_REUSEADDR`, so the relay binds beside it even when QLC+ holds
  `0.0.0.0` *and* `::` — but **relay vs relay raises exactly the loud
  `bind EADDRINUSE 0.0.0.0:6454` the comment promised**, and the second process
  dies instead of silently splitting the packet stream. The guard was never
  aimed at QLC+; it was aimed at a second copy of itself. **Before writing off
  a defence as unnecessary, check which attack it was written for** — "I did
  not see it fire" is evidence about the case you ran, not about the guard.
- **A BUILT ARTIFACT IN A MERGE CONFLICT HAS EXACTLY ONE CORRECT RESOLUTION:
  REBUILD IT.** `the-house.html` is committed built, so two branches touching
  `src/` always conflict in it too. Never resolve it by hand or by taking a
  side — resolve `src/`, then `sh build.sh`. And stripping conflict markers
  mechanically can WELD TWO COMMENT BLOCKS together: the `=======` line sat
  between one block's `*/` and the next block's `/*`, and removing it made the
  whole of the second header live code.
- **`decodeURIComponent` IS NOT THE ONLY WAY A URL KILLS A SERVER.** `GET /%`
  throws `URIError` out of an http handler and exits the process. Guarding the
  decoder does not help `GET /a%00b`: `%00` decodes cleanly and `fs.stat` then
  validates its path SYNCHRONOUSLY and throws before the callback exists. Guard
  the decoded STRING.
- **A LEXICAL PATH GUARD DOES NOT SEE THE FILE'S OTHER NAMES.** NTFS keeps 8.3
  aliases, so a dot-segment refusal that reads the URL served `/GIT~1/config` —
  4040 bytes of `.git/config` — while `/.git/config` correctly returned 403.
  Judge the RESOLVED path (`fs.realpathSync.native`), which also collapses a
  symlink out of the tree. Keep the lexical test too, BEFORE it: a dotfile that
  does not exist must be *forbidden*, not *not-found*, and inside a git
  worktree `.git` is a FILE, so the difference is reachable.
- **`reuseAddr` TURNS "PORT TAKEN" INTO "RUNNING FINE, NO PACKETS".** A second
  UDP bind succeeds, the FIRST binder keeps receiving everything, and the new
  process prints a banner claiming success. EADDRINUSE is the diagnostic that
  saves the evening.
- **TCP AND UDP PORT SPACES ARE SEPARATE** — reserving a free port with a TCP
  socket says nothing about the UDP port of that number.
- **A TEST THAT SKIPS WHEN IT CANNOT FIND ITS SUBJECT ASSERTS NOTHING.** A VR
  case guarded with `if(hit)` passed for a whole round because `VR.hits` is
  empty until the console is DRAWN. Draw it, then fail loudly if the region is
  missing.
- **A SUITE CAN LACK THE `requestAnimationFrame` SHIM AND CALL THE FRAME LOOP
  UNTESTABLE.** `stages.js` pumps `window.__raf` by hand; a suite that does not
  install `w.requestAnimationFrame = cb => { w.__raf = cb; }` cannot step the
  loop, and everything that only happens on a frame gets written off.
- **A CHANNEL MAP MUST BE COMPUTED OR IT SILENTLY REPOINTS.** 274 is
  `1 + 7 × 39` and 302 is `274 + 2 × 14`. Written as literals, one more lantern
  moves every channel after it and the map file lies. And a test that asserts
  `base === 1 + 7 * FIXTURES.length` is satisfied by the literal too — **prove
  the derivation by growing the rig** and watching the bases move.
- **A SPEC'S OWN PROSE CAN BE WRONG ABOUT THE DATA.** RULING ET says "the attic
  tracking in from x −14.20"; the built record is home 0, out −19.50. Read the
  records, and say in the report that the sentence will not match.
- **A PROTOCOL'S NOMINAL RATE IS NOT A DEVICE'S ACTUAL RATE, AND A TIMEOUT SIZED
  OFF THE NOMINAL ONE HAS NO MARGIN AT ALL.** `ART_STALE` was 2.0s because
  Art-Net "sends ~44 frames a second", which reads as 88 frames of headroom. The
  first real QLC+ run printed 5–6 packets per 10 SECONDS while idle — the desk
  sends on change plus a slow keepalive — so the real margin was 0.2s, and in
  the slowest window none (RULING FB raised it to 5.0s). **Every timeout in this
  repo that was sized off a datasheet number rather than a measurement is the
  same bug waiting**, and the way it surfaces is not a crash: it is a gate that
  flaps, which reads as flakiness rather than as a wrong constant. Ask what the
  device does when NOTHING is happening — that is the case the spec sheet never
  covers.

## Environment

- **A `const` in its temporal dead zone throws on a PLAIN reference, not just
  through `typeof`.** The `typeof` half is recorded above; this is the same trap
  reached the ordinary way. `BJ_HOUSE_UPSTAGE` was declared with the other fit
  constants, ~300 lines BELOW the `const BJ_MODELS = {…}` that reads it — and
  because a manifest is an initialiser rather than a function body, it runs at
  load, in the dead zone, and took the entire build down with "Cannot access
  BJ_HOUSE_UPSTAGE before initialization". Function declarations hoist and
  `const`s do not: **anything a top-level object literal reads must be declared
  above it**, not merely somewhere in the same part.

- **`* text=auto eol=lf` decides binary by CONTENT HEURISTIC, and media is a
  coin toss.** The blanket rule exists because `build.sh` breaks under CRLF, but
  a `.m4a` or `.glb` that lost that guess would be rewritten on checkout — and
  nothing in this repo can hear or render, so it would never be caught. Since
  RULING BI committed the recordings, `.gitattributes` names the extensions
  `binary` explicitly and a test asserts it. Add new media extensions there
  before committing the first file, not after.
- **A commit pushed to a branch whose PR is ALREADY MERGED is stranded, and
  nothing says so.** GitHub does not reopen the PR and does not open a new one;
  the push succeeds, the branch moves ahead of `main`, and the work simply is
  not on `main`. It happened to the record corrections at the end of the
  BA–BE round — merged `#123`, then pushed a follow-up to `bj-act-two`, and the
  owner spotted the missing PR before the repo did. **After any follow-up push,
  check it actually landed:**
  ```sh
  git fetch && git merge-base --is-ancestor <sha> origin/main && echo on main
  ```
  A late correction needs a NEW branch off fresh `main` and its own PR — and
  its text usually needs rewriting too, because "open as of this writing" stops
  being true the moment the parent merges.
- **A literal copied out of a conditional's FALLBACK branch, and quoted for
  three rulings as if it were the value.** `p9` builds the fly ropes at
  `const railX = fr ? fr.rail : -D.stageW/2 + 2.8`. Someone read that line,
  wrote down **x −19.2**, and RULINGS CE, CS and DF each sized a park against
  it and each cited `p9` for it. There is always a crew frame, so the branch
  that runs is `fr.rail` = `XR + 2.8` = **−30.2** — an 11m error, because `XR`
  carries `D.wingSR` and `-D.stageW/2` does not. It cost the wider half of a
  wing: the gap between the legs and the rail was believed to be 7.00m and is
  **18.00m**, so a 13.06m set that "obviously did not fit" fits with 2.94m to
  spare. **A number read out of a `?:` is only the number if you also checked
  which branch runs.** Read the value, don't read the expression — and if a
  ruling turns on it, have a probe print it (`tools/wing.js` does).
- **The two side walls are NOT at the same |x|, and four places assumed they
  were.** `XL` is `D.stageW/2` = 22; `XR` is `-(D.stageW/2 + D.wingSR)` = −33.
  Two suite sweeps and `tools/parked.js` all tested both sides against
  `±D.stageW/2`, which declares an 11m strip of real deck to be outside the
  building. `D.wingSR` exists precisely to say the stage is not symmetric, and
  every one of those checks was written as though it did not.
- **Measuring a symmetric PAIR gives you the same edge twice.** `tools/wing.js`
  measured `GOODS.legs` — both cloths — and reported `0.00m of cloth` and a leg
  masking from 12.20, because the pair's box has |x| min and max both equal to
  the *outboard* edge. Measure ONE of them. Same family as the box-has-corners
  trap: the geometry answered honestly and the question was wrong.
- **A classifier whose tests are not mutually exclusive answers with whichever
  it asks first.** `vrSetWhere` asked "is it upstage of the backdrop" before
  "which wing", and a park can be both — so a set standing in the stage-right
  wing at z −12.90 read as `upstage`, sending a man in a headset behind the
  cloth to look for something beside him. When the buckets overlap, order them
  by which answer is *useful*, and say so in the file.
- **AN INSTRUMENT THAT BORROWS A CLAMP INHERITS ITS CEILING.** `vrPerf` recorded
  the game's `dt`, which `p7` clamps to 50ms so a model load cannot teleport the
  show. Correct for the movers; fatal for a meter — **every frame worse than 50ms
  was recorded as exactly 50**, so it could not report below 20Hz however bad the
  frame was. Two rounds of readings were taken through it. The tell was there in
  the number: **48ms is two off a ceiling**, and a reading that lands just under a
  known limit should be suspected of *being* the limit before it is believed. The
  meter now takes the raw figure and carries its own, far higher, ceiling.
- **A capability can already be sitting in a vendored file.** The lighting plan
  justified a three.js upgrade partly on `EXT_meshopt_compression`, dated "r132+"
  from the upstream changelog. The GLTFLoader vendored in `p5i` **already has
  `setMeshoptDecoder`, the extension constant and its full handler**, and the
  decoder script is published for r128. An upstream version number tells you when
  a feature appeared upstream, not whether this repo has it. Grep the repo first.
- **A published addon FOLDER can vanish, not just a build.** three.js's
  non-module `examples/js/` is 200 through **r147** and 404 from **r148** — so the
  version the UMD ceiling points at has no drop-in addons at all. And
  `KTX2Loader` was **never** in `examples/js` at any version, only ESM: a thing
  can be missing from every version rather than added in a later one, which reads
  identically to "not found yet" until you check two versions instead of one.
- **Test code inside a PLAN is prose until somebody runs it.** The lighting plan's
  assertions were written against a `boot()` / `assert(W.thing)` harness that
  exists in neither `vr.js` nor `full14.js` — both use `P(name, fn)`, which throws
  on failure, and reach game globals bare because they eval the script in their
  own scope. Read the neighbouring cases and copy their shape; a plan's code block
  is a statement of intent about what to assert.
- **A cache-buster can live nowhere at all.** `?v=N` is typed onto the URL by
  hand — it is not a string in `src/`. A plan step saying "bump it in `p1.txt`"
  sends you looking for something that was never there; bumping it means writing
  the new number into STATE.md and HANDOFF.md.
- **A BACKSLASH IN A REGEX INSIDE A PROBE TEMPLATE IS EATEN BEFORE `RegExp`
  EVER SEES IT, AND `probe-lint` DOES NOT SWEEP FOR IT.** The suites and probes
  are template literals, so `/houseGrade\(\s*x/` reaches the evaluator as
  `/houseGrade(s*x/` — *"Unterminated group"*, at parse time, taking the whole
  file down before a single case runs. The lint catches backticks and singly
  escaped *quotes*; this is a third member of that family it does not know
  about. Either double the backslash or, better for asserting generated text,
  use `indexOf` — exact and immune.
- **A CAP THAT DECIDES *HOW MANY* WITHOUT DECIDING *WHICH* KEEPS THE WRONG
  ONES — AND THE TWO OBVIOUS REPAIRS ARE BOTH ALSO WRONG.** `vrCapBeams`
  already records half of this ("sorting that against a world camera kept the
  wrong 14 beams"); RULING DN's glow cap walked into all three versions of it
  in one round, and only a *ratio* test found any of them.
  1. **List order.** `FIXTURES` is in rig order and rig order starts at the FOH
     bar, so a cap of 12 taken off the top keeps twelve lanterns *behind* a
     player at downstage centre facing upstage: 2.6% of screen uncapped,
     **0.0% capped**, while still paying for twelve instances.
  2. **Nearest-first** moves the blind spot instead of closing it. From a
     stalls seat the nearest twelve are that same FOH bar directly overhead:
     1.7% uncapped, **0.0% capped** — *worse* than the bug it replaced.
  3. **"In front of the eye plane"** keeps a lantern 80° off axis, which is
     ahead and comfortably off the screen. At downstage centre that is most of
     the near rig: the capped session kept **4% of the glow the eye could
     see**, and every clause of the test was green, because they all asked
     "did it draw something" rather than "did it draw what is there".
  The rule that works is a generous view **cone** then nearest-within-it, and
  the cone is deliberately wider than the frustum you can measure — the desk
  projection is the only one reachable in an XR session, a Quest's vertical is
  ~2.06× it and the screen diagonal ~2.04×, so erring wide costs a slot while
  erring narrow drops a halo the headset can see, with no tell. **The
  assertion that finds all three is the same seat measured twice, capped and
  uncapped, compared as a ratio.** "It drew something" is not the claim.

- **`instanceColor` REACHES A FRAGMENT ON r128 ONLY BECAUSE THE TWO SHADER
  PREFIXES DISAGREE — and the obvious "fix" makes every instance BLACK.**
  `T.ShaderChunk.color_pars_fragment` in r128 declares `vColor` for
  `USE_COLOR` alone; it has never heard of `USE_INSTANCING_COLOR`, so on the
  chunk text alone a per-instance colour could not survive into a fragment.
  What saves it is `WebGLProgram`: the **fragment** prefix emits `#define
  USE_COLOR` when *either* `vertexColors` **or** `instancingColor` is set,
  while the **vertex** prefix emits it for `vertexColors` only. Read the chunk,
  conclude it is broken, and set `vertexColors = true` to "repair" it, and the
  vertex shader then declares `attribute vec3 color`, the geometry has none,
  WebGL supplies `(0,0,0,1)` for a missing generic attribute, `vColor *= color`
  zeroes it, and the whole batch renders black — with no error anywhere.
  RULING DN's glow leaves `vertexColors` off for exactly this reason. **Check
  the prefix, not just the chunk**; the two are not the same source of truth.

- **`UniformsLib` cannot be extended after load, and the test that checks it
  will pass anyway.** `ShaderLib` merges and **clones** its uniforms at module
  load — `ShaderLib.standard.uniforms.fogColor` is not the same object as
  `UniformsLib.fog.fogColor` — and `WebGLPrograms.getUniforms` clones again per
  material. Adding `UniformsLib.fog.myThing` reaches nothing, while an assertion
  that reads `UniformsLib` directly goes green over a shader that will not
  compile. The only seam that hands a material a **shared** uniform object is
  `onBeforeCompile`.
- **A shader chunk names r128's varying, not the one in the docs.** r128 calls
  it `fogDepth`; a later release renamed it `vFogDepth`. Getting it wrong is a
  compile error that **passes all nineteen suites**, because jsdom stubs
  `WebGLRenderer`. Read the chunk out of the vendored artifact
  (`T.ShaderChunk.fog_fragment`) and assert the name, so the tripwire fires if
  three.js ever moves under you.
- **`transformed` does not exist in every shader that includes `fog_vertex`.**
  The SPRITE shader includes `fog_vertex` but neither `begin_vertex` nor
  `project_vertex`. Read world position off `position` (always declared) and
  apply `instanceMatrix` under `#ifdef USE_INSTANCING` the way `project_vertex`
  does.
- **An unsupplied uniform is 0, and 0 is rarely neutral.** A material that
  declares `gradeTint` and never receives it reads `vec3(0)` and renders
  **black** — a hole in the picture, not a subtle drift. Give every injected
  effect a `mix` term that defaults to 0 = bypass, so an incomplete registry
  degrades to "exactly as before" instead of to a fault. Then assert the
  coverage, because that failure is now silent.
- **A byte count is a proxy; the hash is the proof.** A negative check that
  swaps two strings of EQUAL LENGTH leaves `the-house.html` the same size, so
  "prove the mutation changed the build" stays silent while the build really did
  change. Compare the sha, and prove the ORIGINAL string absent as well as the
  mutant present.
- PowerShell 5.1 mangles `git commit -m` with double quotes — message to
  file, `-F` it.
- Never `git add -A` while agent worktrees exist under `.claude/` —
  gitlink pointers ride into the commit (`.gitignore` covers it now,
  but don't lean on it).
- The Quest Browser caches HARD — bust Pages with `?v=N` (bump N) or
  clear site data before deciding a fix "didn't work".
- `.gitattributes` pins LF because `build.sh` breaks under CRLF.
- **A tunable uniform is not a kill switch.** `scene.environment` put cube-UV
  sampling — up to 16 dependent texture taps — into every standard fragment,
  and `ENV_INTENSITY`/`envMapIntensity` only scale the RESULT: the taps run
  identically at intensity 0, so a blackout paid full price and the LIGHTING
  page's knob could not recover a microsecond. If the cost is in the shader,
  the off-switch must change what compiles or what is bound (RULING DT), not
  what a uniform multiplies by.
- **Opacity 0 is not hidden, and neither is intensity 0.** An additive quad at
  opacity 0 still submits a draw call and still rasterises (39 of them did,
  every frame, for two rounds — RULING DR), and a light at intensity 0 is
  still a full per-fragment iteration in every standard material (a yard lamp
  nothing ever drove — RULING DW). `visible = false` is the only gate the
  renderer respects, on meshes and on lights.
- **The r128 lights-state hash carries `castShadow`'s VALUE and the light
  COUNT.** A same-value assignment is free; a flip re-acquires a program for
  every lit material (a compile the first time). So write `castShadow` only on
  change, keep churn out of the shadow slots (RULING DS's permutation), and
  gate lights on MEMBERSHIP — a venue walk — never on a driven number that
  fades through zero (RULING DW).
- **r128 `Texture.needsUpdate` is SET-ONLY.** Reading it returns `undefined`
  forever, so a test that observes it passes vacuously against any build — the
  DV assertions' first draft passed against a build with no gate at all.
  Observe `texture.version`, which is what `WebGLTextures` actually compares
  before uploading.
- **Count the GATHERED set, not the object census.** A light whose own
  `visible` is true under a switched-off root is not in any fragment loop —
  `projectObject` returns above both the push and the recursion. The audit
  read "13 always-on PointLights from both buildings" out of a census; all 13
  were one building's, and the venue gate had existed all along (RULING DW).
  Walk ancestors the way the renderer does before declaring anything on.
- **A ratio with mixed denominators prints a confident lie, and a probe that
  reads the BUILT file measures stale bytes.** A raw `traverse` numerator over
  a `traverseVisible` denominator printed "62%" where like-for-like was 54%
  (tools/draws.js, caught in review); and an src-only edit leaves the probe
  measuring the previous build — `sh build.sh` before every re-measure, and
  the probe prints the built file's byte size so a stale build shows itself.

- **One eager frame runs before `buildLoad()`, and `buildTick` is in it.** The
  p7 boot tail is `init()` → one deliberate eager frame → `buildLoad()`, so
  anything marking the save dirty during construction flushes an EMPTY world
  over the player's build seconds before the load reads it — and the load then
  faithfully restores the nothing it just wrote. Latent from the day the save
  shipped, because nothing at boot had ever called `buildDirty`; the studio
  grids called it a hundred times through `removeBody` and it fired at once.
  Fixed by `_saveReadDone` (#218): **the gate is the READ, not the flag** —
  set it as `buildLoad`'s FIRST line so its early returns open it too, or a
  player with no save yet can never make one. **If you add anything that
  builds or strips at boot, this is the trap it springs.**
- **A path only ever asserted NEGATIVE is a path with no test at all.**
  `buildTick` has two write routes — the 1s dirty flush and the 10s heartbeat.
  Both were held shut by assertions and neither was ever proved to *write*:
  neutering the heartbeat branch outright left all 21 suites green. "It did
  not fire when it shouldn't" is not evidence it fires when it should. Every
  gate wants both directions, which is the mirror clause of RULING FC wearing
  a second hat.
- **A `sed` rename stops at the files you list, and the docs are not in them.**
  Renaming `_buildLoaded` → `_saveReadDone` across `src/` and `tests/` left
  `FUTURE.md` naming a symbol that existed nowhere in the tree. A reader greps
  it, finds nothing, and concludes the fix was never landed. **Grep the WHOLE
  repo after a rename**, docs included.
