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

## Environment

- PowerShell 5.1 mangles `git commit -m` with double quotes — message to
  file, `-F` it.
- Never `git add -A` while agent worktrees exist under `.claude/` —
  gitlink pointers ride into the commit (`.gitignore` covers it now,
  but don't lean on it).
- The Quest Browser caches HARD — bust Pages with `?v=N` (bump N) or
  clear site data before deciding a fix "didn't work".
- `.gitattributes` pins LF because `build.sh` breaks under CRLF.
