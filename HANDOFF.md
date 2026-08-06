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
  build.sh           rebuilds the-house.html from src/
  HANDOFF.md         this
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

All twelve are at `--- failures: 0 ---`. Keep them there.

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

Working and tested. Nothing is known to be broken.

**Done 2026-08-06:** fixed the `full14.js` harness (the jsdom `movementY` shim
above — the game code was never wrong), created the git repo (there had never
been one), pushed to GitHub, rewrote both commits onto the no-reply address,
added `README.md`. GitHub Pages is **not** enabled yet — it needs the repo
public or a paid plan, and that decision is the owner's.

**NEXT SESSION IS A CODE AUDIT.** Read this file first, then audit — don't
refactor as you read. Findings before fixes: list what you find with
file/part and line, severity, and evidence, and let the owner pick what gets
changed. The tests are the safety net for anything that does get changed —
run all twelve before and after. Things an audit of this codebase should
actually look at:

- **Global state.** It is one concatenated script on purpose; ~everything is
  a top-level `let`/`const`/`var`. The question is not "are there globals"
  but whether any two parts write the same one for different reasons
  (see the `userData.moves` story in §5 — that class of bug).
- **The stage-swap in `p2k`.** Walking between theatres swaps the *contents*
  of `FIXTURES`/`FLY`/`CUES`/`SHOW`/`HOUSE`. Anything that keeps a stale
  reference across a swap is a latent bug of exactly the kind §5 documents
  for cached DOM rows.
- **Dead weight.** `p2d` is known-orphaned; the scene-change machinery in
  `p5c` (`SHOW.scenes`) has no user since Beetlejuice was cut. Confirm, and
  find whatever else nothing calls.
- **Duplication across the show files.** `p5f`/`p5g` already reach into
  `p5d` for `LB_CLOTH_W`; there is likely more copy-paste between the four
  productions worth flagging.
- **World/stage coordinate discipline.** Every invariant in §4 is a past
  bug. Grep for raw `.position` math near `ARC.X`, trims, and `aim` and
  check each against §4.
- **What the tests don't cover.** They catch structure and state, not looks
  or speed. Note untested seams (the VR paths especially — stubbed only).

**Not done:**

- **The VR build has never run on a headset.** There is no device here. The XR
  code paths are exercised against a stubbed `WebXRManager` in `vr.js`, but frame
  rate, comfort and whether the consoles are a readable size are unknown. That
  is the first thing to find out.
- **WebXR needs HTTPS.** It will not start from `file://`. Serve it — GitHub
  Pages, or a local server reached from the headset over the network.
- Only the live stage ticks. Leave a theatre mid-show and its fades and flys wait
  for you. Deliberate, but arguable.
- The Arc has no productions of its own; the four in the book are written for the
  Palace's stage box and load anywhere because all three boxes match.
- Hamilton is thinner than the other three (55 pieces against ~96).
- The scene-change system (`SHOW.scenes`, `p5c`) is general machinery that no
  current show uses — it was built for Beetlejuice, which was removed.

**Asked for and not yet built:** hosting the VR version (blocked on the
public/private decision above), and the "stage 2" VR work — grabbable faders
on the console, carrying scenery by hand.
