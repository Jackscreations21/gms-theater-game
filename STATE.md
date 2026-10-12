# STATE — 2026-10-11 (THE LIGHTING ENGINE: EVERY RIG UNIT DRIVEN, GOBOS, COLOURS, A PANEL, A CHECK AND A PREVIEW — `midtown-lights` ON TOP OF `midtown-walls`, UNMERGED; THE BODY AND THE CUES WAIT)

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## NEWEST — 2026-10-11 (night, second session): the lighting engine — `midtown-lights`, six commits on top of `midtown-walls`, UNMERGED

**Read this block first.** `main` is still **`e27fc1e`**; PR #229 still open; `midtown-walls` unmerged (its
question to Jack — one PR or in turn — still unanswered). **Branch `midtown-lights`** is `midtown-walls` +
`c0179c1` engine, `9da710c` panel, `5a2688e` gobos+colours, `768f9a5` check, the preview commit, and the record.
All `midtown.html` (now ~5,300 lines); nothing in `src/`; `the-house.html` / `docs/ARTNET.md` untouched; suites
not run (nothing they check moved; `node` still not on PATH). Jack: *"use opus agents to make the lighting engine
and to check that every light is working with the movements, gobos and colors"*, then *"make a preview of the
lights that shows a bunch of different gobos and stuff."* Five Opus 5.5 agents: G engine (alone), H gobos+colours
and I panel (at once, in worktrees `.claude/worktrees/lx-*` on ports 8091/8092, cherry-picked, removed), J check
(alone), K preview (alone). The recipe is in TRAPS ("the clean way").

- **The engine (`c0179c1`, `MIDTOWN.lx`)** — every one of the 313 units has state `unit.userData.lx`
  `{level, color, pan, tilt, panTo, tiltTo, gobo, goboRot, goboRate, zoom}`; a lit unit draws a lens glow, a point
  in one glare cloud, a volumetric cone (p4's shader, far side only, **budget 120 cones a frame**, strongest in
  view), a pool decal where the beam lands (a ray stepped through the walk's collision grid, cached, recast on aim
  or scene change — all 313 in ~36 ms) and the brightest four get real SpotLights (two shadowed, static maps; the
  house scan is unlit so real light shows on the set and built pieces only). Movers (41 Viper, 24 X4, 6 VL3500):
  pan on the yoke, tilt on the head, both LOD levels, at the type's speed unless `snap`; `lx.aim(sel, point)`.
  Fades, travel and gobo rotation in `lxTick(dt)`; idle still draws nothing. API: `select` (channel, "1-20",
  position, type, id, "all", array, predicate), `set/get/all/blackout/work/haze/aim/beam/refresh/groups/perf`.
  **Cost, Intel UHD, 1280×800: dark 31/24 ms (front/back), everything at full 54/34.** `LENS_GLOW` retired: a
  dark unit reads dark; the load picture is unchanged (work light 1, rig at 0).
- **Gobos and colours (`5a2688e`)** — 16 canvas-drawn patterns (512², seeded) named for the show's beam palettes:
  Open, Construction, Linear, Dust, Cobble stone, Alpha, Vignette, Nite sky, Brains, Pebbles, Blocks, Tribal,
  Leaves, Slot, Square, Pickup sticks; the beam shows the shafts and they turn with the pool. Wheels: Viper
  rotating 6 + framing + diffusion; VL3500 FX 3; **template Source Four systems from Binkley's magic sheet**
  (111–125 and 241–249 Pickup sticks, 131–149 Blocks, 201–208 Alpha, 291–298 Linear, Lustr 160–179 Construction,
  181–192 Pickup sticks) hold their template at load; everything else open. Colour per type: gel (3200 K, warms as
  it dims; `set({gel})` re-gels), Lycian xenon boomerang, CMY+CTO+colour wheel for Viper/VL3500 (R26 within 0.014
  of the gel), RGB/RGBW/RGBA/7-colour LEDs (`rgb`, `emitters`), hazers none. `GELS` extended to all of Roscolux
  01–99 plus the Lee codes the show names. `lx.wheel(sel)`, `lx.gels()`.
- **The panel (`9da710c`, Lights button, `MIDTOWN.lxPanel`)** — select by position (38), type, channel
  field ("1-20, 41"), or **click a fixture in the view** (shift adds), gold outline on the selection; level with
  fade, gel dropdown + colour picker, gobo dropdown from the unit's wheel, rotate rate, pan/tilt (movers only),
  snap, zoom, Aim at view centre; All on / Blackout / Work / Haze; **Step through** (one unit at a time with its
  label, Play off frame dt); **Looks** saved to localStorage, recall with fade, export/import. Keys `+ - [ ] 0`.
- **The check (`768f9a5`, `MIDTOWN.lx.check()`, panel "Check all" / "Watch all")** — measures what draws (lens,
  glare, cone matrix+uniforms, pool map, real lights), re-finds every landing point against all 159k triangles,
  drives travel by calling `lxTick(1/60)` by hand, restores the rig exactly, ~2 s. **301 / 313 pass at real
  size, 302 fitted.** Every fail is placement, not engine: **3 Source Four shins (ch234, 239, 240) have their lens
  under the deck** (clamped 0.33–0.39 m, lens 0.39 m below the clamp — sit them yoke-up or lift 15 cm) and **9
  ColorBlaze-48 strips (ch616, 715, 632–637) sit under set rails**. Notes, not fails: 55 strips draw no cone;
  Lustr can't make pure green/blue; 7 Apron Electric movers (ch24, 41–46) hit the house bridge when aimed at
  centre; 6 beams into nothing (3 Mini-10s rising through the cut back wall, 3 strips behind the scan). Fixed by
  J: **house booms SL/SR Boom 1 re-aimed after their wall move** (20/20, dot 1.0000) — they now land on Jack's
  baked proscenium posts box 17/19 (the booms hang inside the posts' depth; Jack's call: booms downstage of z −1.6
  or narrower posts); SL Boom 4's tower stepped clear of ch222's lens. Known: additive pools wash to white when
  many overlap; the gobo canvases draw on first use (Dust 342 ms).
- **The preview (`817ad37`, Preview button, `MIDTOWN.lxDemo`)** — a scripted show on the real rig: **12
  scenes, 132 s, looping**, each as data (view, haze, timed steps; ops set/aim/row/ring/work/haze/cam/fx):
  Curtain up, Gobo parade (nine Vipers, nine patterns on the deck), Every pattern every unit, Templates on the
  brick and deck, VL3500 soft patterns, Ballyhoo in haze, LED chases, Fan and ring, CMY mixing, Dimming gel
  against LED, Strips on the set, Finale with followspots and blackout. Prev/Play/Next/Stop in the panel; Stop
  restores the rig and the camera exactly; entering Walk stops it; heaviest scene 42 ms on the Intel chip. Built
  for Real size (aim points are 1:1 world). Contact sheet and one picture a scene in this session's scratchpad
  `agent-k/`. Rough: the wall scrapes land high behind the electrics; the VLs on the brick are steep from the
  10th Electric; the pane runs it at ~10 s per 12 (dt cap) — a full window is real time.
- **Still:** fixture GLBs untracked (38); PR question; the body; the cues ("timed against what"); headset.

---

## NEWEST — 2026-10-11 (late night): walk, lobby, the house cut for the set at 1:1, his first walls baked, the rig trimmed — `midtown-walls`, five commits, UNMERGED

**Read this block first.** `main` is **`e27fc1e`** (#228 merged by Jack: the rig, rigging, frame rate,
booth and desk). **PR #229 (`midtown-walk`, one commit `edd07eb`) is OPEN and unmerged.** Branch
**`midtown-walls`** carries it plus four more — `0be6c01` lobby, `b0028db` walls cut, `1fba90a` bake 3,
`af02c26` rig trim (cherry-picked from a worktree) — and the record commit. All `midtown.html`;
nothing in `src/`; `the-house.html` / `docs/ARTNET.md` untouched; suites not run (no `node` on PATH
this session; nothing they check moved). Linear chain: walk → lobby → walls → bake → rig; the question
put to Jack and unanswered: close #229 and open ONE PR from `midtown-walls`, or merge #229 and open the
rest in turn. **Every agent this session was Opus 5.5 by his instruction** ("use opus agents"); five
of them, one at a time except the last two (bake in the main checkout, rig in a worktree — the two
regions did not overlap and the cherry-pick was clean; the combined page loads with every round's
console line and no errors).

- **Walk (`edd07eb`)** — Jack: *"walk around like i do in the palace or like how a roblox player does."*
  First person on the Palace's numbers (3.1 / 6.4 m/s, jump 4.6, gravity 13.5, eye 1.6): pointer lock
  on a click in Walk mode (Esc frees; the pane refuses it, so after two refusals drag-to-look carries on
  silently), floors and walls from the geometry via one 0.5 m grid of the house + set + rig structures +
  booth + desk + lobby + proscenium + baked pieces (159k tris, ~30 ms, rebuilt after a cut / Real size /
  Rig toggle / restore). **Step-up 0.40** (0.62 climbed the seat rows), radius 0.25, **crouch on C**
  (the fitted galleries were 1.5 m off the deck), the stage lip needs the jump. `MIDTOWN.player`,
  `MIDTOWN.walk.{step,setMode,groundAt,grid,perf}`. Walk cost 0.02–0.05 ms a frame.
  **Jack's two follow-ups, NOT done, paused on his "wait a second": *"the person is too tall, and
  also give them a body."*** (Palace eye is 1.68; Roblox is ~1.4 m; a visible body + maybe third
  person.) A worktree for it was made and later removed; start fresh off the branch tip.
- **Lobby (`0be6c01`)** — *"add a lobby to the building."* 19.8 × 7 m room behind the back wall
  (z −15.12…−22.12), floor y 0.875 — **the rear doorways are passages from the side aisles at y
  0.85/0.90, NOT the cross-aisle's 2.10** (house right x −4.77…−3.57, house left 3.78…5.08, heads
  ~3.0, the scan stops at z ≈ −14.0). Box office house right, bar house left, six glazed entrance
  doors with a canopy, the booth boxed in as a projection room, posters, stanchions, benches, lit
  STALLS signs, carpet; lit materials + 30 glowing discs + 3 shadowless spots (`MIDTOWN.lobby.lights`
  to switch off). `v-lobby` button. 15 meshes, 4,962 tris, +13–16 draws when in view, 125 ms load.
- **Walls cut (`b0028db`)** — *"lets change the theater walls so we can fit the hamilton set at full
  size … have an opus agent cut out the area of the walls that needs to be, then i will put walls in
  that are needed on my own."* **Real size is now the default** (`placeSet(1)` on load; both buttons
  still work and each rebuilds the collision grid and the rigging). The set at 1:1: x ±8.66 (17.31 m),
  y 0.80…10.17, z −0.35…9.72 — **0.82 m through the back brick and 0.72 m past the deck's end**;
  ±6.82 downstage of z 1.5 (its own portal posts at x ±6.5…6.7 on the arch plane). Four `WALL_CUTS`
  (world boxes, applied through `applyCut` after his/booth/desk cuts, listed on the console): the
  stage house x ±9.46 from z 0.5 to 10.72 up to the fly roof (side walls and back brick gone; the
  outer walls at |x| 9.5–9.6 and the fly walls stay); the front over the deck x ±7.62; the piers'
  feet in the stalls; the page's whole proscenium frame (the set passes through all three pieces).
  `wallSplit` first splits every house triangle a box would only partly take (fill planes are two
  triangles the size of a wall). **Cuts and copies now record the set scale they were made at**
  (`set: 1`; old ones count as fitted) and re-seat to it when re-applied. `MIDTOWN.walls.check()`
  prints: house tris left in the boxes 0, touching the set 0, 93 front-corner tris kept on purpose.
  **Problems he will meet building:** stage right has NO deck downstage of z 3.9 (`deck_fill` runs
  x −5.8…5.6 there; a 0.86 m drop to y −0.06 under the set at x 5.6…8.66); the set's back overhangs
  the deck; the viewpoints "On stage" / "Stage-left wing" may start inside set geometry at 1:1.
- **Bake 3 (`1fba90a`)** — his `Downloads\midtown-build (3).json` (copy in this session's scratchpad):
  13 pieces → 3 exact duplicates dropped (the doubling) → **10 baked, all "(bake 3)"**: the black
  panel, two rail blocks (`box 6b` is his moved one at x 4.34), two 10 m posts at x ±6.2…6.4 on the
  arch, a rail, a 17.5 m header at y 8, **a 42 × 39 m floor slab in deck_fill, top y 0.845, z −1.4…40.9**
  (4.5 cm above the deck — the set's feet are buried; it runs far past every wall), a shelf, and
  `copy 24` (a set stair copied at 1:1 to x 4.27 z 2.0, turned 90°). **He had pressed "Edit the baked
  pieces", so the pieces REPLACED the old bake**: gone are the inner timber proscenium (box 1–3), box 5,
  the bake-2 rail strip and `copy 5 (bake 2)`. **Cuts were APPENDED, not replaced (8 baked)**: "Edit the
  baked pieces" never lifts cuts, so an export cannot drop one; old cuts 3–4 still take the scan's
  house-left apron stair under his block. His two new `set: 1` cuts remove nothing now (they deleted his
  own pieces mid-session). The set passes through his posts (1133 / 1506 vertices), the panel (529),
  the slab (628), the shelf (128) — kept as placed. **Tell him Clear all before reloading.**
- **Rig trim (`af02c26`)** — *"the lights got raised too high so fix that."* At 1:1 the rig hung at
  its Rodgers heights (electrics y 9.61, FOH 7.3–9.6 through the 8.05 ceiling, 64 units outside the
  house). `RIG_TRIM` (world metres, real size only; fitted keeps the scaled file + the old 0.75 m FOH
  Electric drop, now `RIG_FIT_DROP`): **FOH Electric y 7.20 at z −7.05; Apron Electric y 7.20 moved
  to z −5.20** (its real line at z −2.6 collides with the scan's own lighting bridge at every height);
  **FOH Truss y 7.20 at z −12.0, x ×0.6** (the side-wall soffits); **the ten electrics level at y 7.60**
  (6.8 m over the deck, 3.1 m over the gallery); booms, floor booms and on-set units untouched;
  followspots on the booth stands. Every fixed-focus unit that moved is **re-aimed at the point where
  the file's beam met the deck** (77 units, dot 1.0000); movers hang head-down and need nothing.
  `rigPlace` runs inside `placeSet`, so **Set fitted / Real size rebuild booms, trusses, grid and
  towers against the cut house** (booms find the kept outer walls at x 10.0 / −9.56 — fitted they
  move ~5 m out to them, odd-looking; cables end on `house_ceiling` 12/12, hangers on `fly_roof`
  12/12, grid pipes stop 0.1 m short of the fly walls or the set's piers). Rigging raycasts batched
  (`trussRays` via `towerNear`): a rebuild 1.3 s → 150 ms. **Outside the house now: 13 units, all
  on the set past z 9.1 where the back brick was, and SR Boom 8's tower; house-side zero.** From
  the back row the electrics still hide behind the room's own bridge. SR Boom 2/3/4 towers stand
  down to y −0.06 (no deck there). `MIDTOWN.rigTrim`.
- **Cues: still not started, still one question** (recording, or album lengths with no audio).
- **Still untracked, by his instruction: `assets/fixtures/*.glb` (19) + `lod/*.glb` (19).** Pages shows
  no rig until they are committed. The suite's one red is them.
- **Local serving:** `.claude/launch.json` `the-house` on 8080 serves the repo root; a server from an
  EARLIER chat still holds 8080 (`preview_start` says so; just navigate — same files). A worktree
  needs its own port entry in its own gitignored `.claude/launch.json` and a copy of the fixture GLBs.
  Full-size frames: `renderer.setSize(1280,800)`, render, `toDataURL`, POST to a local receiver.
- **Headset run still owed.**

---

## NEWEST — 2026-10-11 (night): the rig is hung, rigged, lit for the eye, and fast enough — PR #226 grew four commits

**Read this block first.** `main` is still `692f3d3`; **PR #226 (`midtown-preview`) is open at
`15703ae`**, twenty commits, UNMERGED. Nothing in `src/`; the suites were not run (nothing they
check moved; the one red is still the untracked fixture GLBs).

- **Jack's ask was "do all the lighting cues timed correctly"**, with resources in his Downloads
  (`hamilton lighitn resoucses\` — the THPP cue photos (112), focus charts, magic sheet, ML preset
  charts, the project guide; a YouTube playlist link in `more hmailton things.txt`; the Eos Nomad
  CSV; both zips). **He redirected: "first put in all the lights in the correct spots so I can
  see what they look like."** That is done. **THE CUES ARE NOT STARTED.** The open question I
  put to him and he has not answered: timed against WHAT — (1) a recording he supplies, the
  Beetlejuice route (audio clock, exact), or (2) the cast album's track lengths with no audio in
  the game. Ask again before building.
- **What landed, in order (all `midtown.html` unless said):**
  1. `b39f86e` **the rig**: `tools/hamilton-rig.py` reads the ETC pack's `Scene/Patch.json` +
     `Fixture.json` (extracted in this session's scratchpad; the pack lives in
     `Downloads\Hamilton THPP\*.esf3d`, NOT the repo) → `assets/hamilton-rig.json` (committed,
     313 units, non-commercial like the set, declared in `assets/README.md`). Frame: the set
     GLB's own (Y up, deck 0, **upstage −z, house +z**, stage left +x); ETC (x,y,z) → GLB
     (x, z+0.2651, 3.96−y). 161 Color Force cells merged to 7 six-foot + 4 four-foot battens +
     44 single cells (drawn as ColorBlasts). Three Lycians and three hazers placed by hand.
     The page hangs one model per unit under the set's root (so Set fitted / Real size apply),
     `quat` split into yaw on the unit and tilt on the head, movers head-down, lens tinted by
     gel, a Rig toggle. Units carry `userData.{id,channels,type,label,gel,position,hung,placed}`.
  2. `b7776ce` **the rigging** (three of his screenshots): SL/SR Boom 1 moved onto the Midtown
     side walls on boom pipes with brackets (their bottom metre hangs over the exit-door
     recess, unsupported); 12-inch box trusses on four cables for Apron Electric, FOH Electric
     (dropped 0.75 m real to clear a ledge in the scanned ceiling) and FOH Truss; a pipe grid
     wall-to-wall at the electrics' height with 12 hangers to the fly roof; 13 floor towers for
     the wing booms (SL Boom 5's top clips `ham_brick`, SR Boom 6 is 0.14 m from `ham_iron`).
  3. `5d57fde` **the frame rate** (he said it lags): measured on the Intel UHD — **his Chrome was
     not on the RTX 5060**; he has since set Chrome to High performance in Windows (screenshot
     seen), unverified. Code side: overhead specials cast no shadow, static shadow maps,
     pixel cap 1 (adaptive to 0.8), render on demand (idle = 0 draws), `compileAsync` behind
     the loader, cuts applied once, and **LOD**: `tools/blender/fixtures_lod.py` →
     `assets/fixtures/lod/*.glb` (800 tris, 1,000 for movers; hang point pinned; checker
     `--lod`), swapped in past 7 m. GPU ms Back/Front/Fly 24.9/41.3/28.1 → 16.2/22.5/17.4, then
     the LOD halves the rig's share (1.46M → 467k tris). The page prints its GPU on load.
  4. `15703ae` **house works**: a followspot booth cut into the back wall (5.9 m window between
     the alcove jambs; room behind; spots on stands, re-aimed) and a lighting desk on a riser
     where rows 7–8 of the centre block were (tech table, Eos-style console, monitors, chairs).
     Their delete boxes are `BOOTH_CUTS` / `DESK_CUTS`, applied with `BAKED_CUTS`.
- **STILL UNTRACKED, by his instruction: `assets/fixtures/*.glb` (19) and now
  `assets/fixtures/lod/*.glb` (19, 1.0 MB).** The page fetches both; on Pages after the merge
  the rig will not appear until they are committed. **Ask him.** The suite's red case is them.
- **Known rough edges for his eye:** eleven downstage-lip units and the first booms float over
  the house floor in front of the deck edge (the real stage is bigger); the up-lighters under
  the gallery sit a hand's width under it; Real size throws the FOH rows and the booth's spots
  out through the walls (expected — the rig scales with the set, the house does not).
- **Cue resources, for the next step:** the Eos CSV has 128 cues in 13 islands with labels
  ("+++1/7"BeBack"", "Burr Enters", "Helpless", "Satisfied 3 pools", "Non Stop"…), fade/delay
  per part, follow/hang — a fifth of the show; the cue photos PDF (112 pages, "CUE n" labelled,
  render with pymupdf at dpi 40 to look). The game's HAMILTON plot (p5f `plotHamilton`, 20
  looks, `follow`-driven from the p7 script) is the thing to replace or extend; Beetlejuice
  (p5h, `at:` seconds off `BJ_AUDIO`) is the timed model. The preview page has no cue engine
  at all — the cues either go into the game (p5f) or the preview grows a player.
- **Local serving:** `.claude/launch.json` `the-house` on 8080; the pane is ~500 px wide, so
  screenshots are small — agents rendered the canvas at 1600×900 and posted it to a local
  receiver instead. Chrome at the same URL is the better window for him.
- **Headset run still owed**, as below.

---

## NEWEST — 2026-10-11 (end of session): the Midtown preview round is in PR #226, 16 commits, UNMERGED

**Read this block, then the evening block below it only for the placement numbers.**

- **`main` is `692f3d3`** (#224 `hamilton-set` and #225 `fixture-models`, both merged by Jack). The
  post-merge protocol has NOT been run for either. **PR #226 (`midtown-preview`) is open**:
  https://github.com/Jackscreations21/gms-theater-game/pull/226 — on Pages after merge at
  `https://jackscreations21.github.io/gms-theater-game/midtown.html`.
- **What `midtown.html` is now:** a standalone preview (NOT the second game) of the Midtown scan
  with the Hamilton set on its stage, plus a **build mode** he used all evening:
  - the house unlit and dimmable, the set lit (hemisphere, two FOH spots, two over-stage specials),
    orbit or drag-to-look walk, six viewpoints, `window.MIDTOWN` console handle;
  - the proscenium moved to the front of the stage (z 0.20) and rebuilt as a real frame in the wall's
    own grey (1.5 m members, 0.6 m deep) round an opening fitted to the set; the set scaled 0.62
    ("Real size" toggle shows 1:1 through the walls); the scan's hanging iron over the stage cut
    (`cutBeams`); **no built stairs** — three placements were wrong for him, so he got tools instead;
  - **Build:** add box / cylinder / sphere / plane / wedge where the view looks; texture dropdown of
    the set's and house's materials plus colours; image by picker or drop; tiling, tint; gizmo
    move/rotate/scale (G/R/S), numeric fields, snap, duplicate, delete; **Area box**: Copy area (C)
    makes what is inside a new piece, Delete area (Enter) cuts it away, Undo delete; autosave to
    localStorage; Export / Copy / Import JSON.
  - **Baked so far:** `BAKED` 8 pieces, `BAKED_CUTS` 6 — his inner timber proscenium (two posts and a
    header), a black masking panel stage left, two rail-grain corner blocks over the apron corners
    where his cuts removed the scan's little stairs, a rail strip house left, and the set's own
    stair COPIED to house right (x 2.13 / z 2.05, turned 90°) with two tidy-up cuts.
- **THE BAKE RECIPE (works, run twice):** he exports (`C:/Users/jackf/Downloads/midtown-build*.json`)
  or pastes JSON → append its `pieces` to `BAKED` and its `cuts` to `BAKED_CUTS` in `midtown.html`
  (session names restart at "box 1": suffix them, e.g. "(bake 3)") → reload, look, commit. **Replace
  instead of append** only if he pressed "Edit the baked pieces" before exporting (the export then
  already holds the old ones). A copy's `src` box is taken on the pristine geometry at load, before
  any cut — safe unless a later cut overlaps a copy's source. **Tell him to Clear all** after a bake
  or his browser shows the pieces doubled.
- **Suites on this tree: 20/21** with the portable Node. The red is `beetlejuice`'s on-disk index
  check tripping on the **19 untracked `assets/fixtures/*.glb`** (his "don't commit the files yet"),
  not on `main` or the branch. Nothing in `src/` changed all session.
- **Local serving:** `.claude/launch.json` (gitignored) has `the-house`, Python http.server on 8080
  over the repo root; `preview_start` it. **It dies whenever the Browser pane is closed** — restart
  before navigating. Pointer lock fails inside the pane; a normal browser window is fine.
- **Headset run still owed**, as below.

---

## NEWEST — 2026-10-11 (evening), the Midtown preview page (branch `midtown-preview`, PR #226 OPEN)

- **`main` is `692f3d3`: #225 (`fixture-models`) MERGED by Jack**, on top of #224. The post-merge
  protocol has NOT been run for either (rebuild byte-identical, map, 21/21, delete the branches).
- **Jack asked to go into "the new one with the 3d model theater and the hamilton set."** That game is
  not built (FUTURE.md PART 2), so a PREVIEW page was made: **`midtown.html`** at the repo root — the
  Midtown scan drawn unlit with `assets/hamilton-set.glb` seated on its deck, turned to face the house,
  lit, walk or orbit. **PR #226**, https://github.com/Jackscreations21/gms-theater-game/pull/226. On
  Pages after merge: `https://jackscreations21.github.io/gms-theater-game/midtown.html`.
- **Three calls he made watching it, all in the page, none in the GLB:** the proscenium moved to the
  front of the stage (z 0.20 from the GLB's 2.30, the ceiling/skirts/fly walls/roof stretched to meet
  it); the proscenium rebuilt as a real FRAME round the set (the GLB's flat grey planes read as "no
  proscenium" when widened, and a dark lit frame read as nothing at all — now 1.5 m piers and
  header, 0.6 m deep, in the proscenium wall's OWN unlit grey, opening x ±5.6 / top y 6.9); and the
  "metal beam" over the stage cut out — it is the SCAN's hanging iron (pipes, a cross bar, two beams
  on cables, left upstage of the wall below the fly cut), not the set's: `cutBeams` drops every scan
  triangle with a vertex in a box over the stage. **Two misreadings cost rounds:** "fill in the
  stairs on the front of the stage" meant the SET's side staircases — the gallery is a U whose two
  arms end in railed platforms at x ±3.5..4.5, z 0.5..2.0, gallery floor y 3.00, and the ETC model
  gives them no way down — so `buildSideStairs` adds an open flight each (treads on stringers, rails,
  12 risers, plank material) down toward centre stage; not the scan's corner steps, which got blocks
  for two rounds and are now back untouched. (`ham_iron` is only the posts' foot blocks.) The set is scaled 0.62 to clear the scanned side
  walls, with a "Real size" toggle. If the second game wants these in the asset itself, `tools/blender/midtown_theatre.py`'s
  `PROS_Y`, `OPEN_X0/X1` and `OPEN_TOP` are where they go.
- **`midtown.html` has a BUILD MODE** (Jack: *"make something where i can add geometries and use a
  dropdown to choose their texture and i can move and resize them … make it so you can see the
  things i add then add them to the actual geometry"*). The Build button opens a panel: add box /
  cylinder / sphere / plane / wedge (they land where the view is looking), a texture dropdown of the
  set's and house's own materials plus flat colours, an image picker or an image dropped on the
  view, tiling and tint, a move/rotate/scale gizmo (G/R/S) with numeric position/size/turn fields,
  snap, duplicate, delete. Autosaves to localStorage; Export JSON / Copy JSON / Import.
  **A DELETE BOX** too (*"a delete box where you scale it over an area then select confirm and it
  gets rid of it"*): Place delete box → a red translucent cube on the gizmo → Confirm (or Enter)
  drops every triangle whose centroid is inside it, from the scan, the fills, the set, the side
  stairs, the proscenium, and removes pieces centred inside; Undo last re-applies the rest from the
  meshes' original indices. Cuts are saved, exported as `cuts`, and bake into `BAKED_CUTS`.
  **THE BAKE RECIPE:** he exports (`C:/Users/jackf/Downloads/midtown-build.json`) or pastes the
  JSON; the agent pastes its `pieces` into the page's `const BAKED = [...]` and its `cuts` into
  `BAKED_CUTS`, and commits — they are
  then scenery for everyone, and "Edit the baked pieces" lifts them back into the editor.
- **Suites on this tree: 20/21.** The red is `beetlejuice`'s on-disk index check tripping on the **19
  untracked `assets/fixtures/*.glb`** still sitting in the working tree (his "don't commit the files
  yet") — not `main`, not the branch. It goes green the moment they are committed or moved out.
- **Local serving:** `.claude/launch.json` (gitignored) has a `the-house` entry — Python's http.server
  on 8080 over the repo root; `the-house.html` and `midtown.html` both need http, not file://.
  Pointer lock fails inside the app's browser pane; a normal browser window at the same URL is fine.
- **Headset run still owed**, as below.

---

## NEWEST — 2026-10-11 (later), the fixture models and the Hamilton-game brief (branch `fixture-models`)

- **`main` is `1ca0a14`: #224 (`hamilton-set`) MERGED by Jack.** The post-merge protocol for
  it has NOT been run (rebuild byte-identical, map, 21/21, delete the branch) — do it first;
  local `main` was still at `4125f6f` when this session started.
- **Jack's brief for a second game** (his words, his four answers) is in **FUTURE.md PART 2
  "THE HAMILTON GAME"**: same repo, second HTML; Midtown house + Hamilton set; better-looking
  light, the full Broadway rig, real fixture models, "a better way to control the lights";
  spatial PA sound, sound fired from the desk, a mixer. **Not specced, no ruling letters
  issued** (next is FF). The engine split is surveyed in
  `docs/hamilton-game-dependency-survey.md`.
- **The fixture models are DONE and in the working tree, NOT committed** (Jack: *"download,
  but don't commit the files yet"*): `assets/fixtures/*.glb`, 19 files, 4.8 MB, every one
  `base > yoke > head > lens` (or `head > lens`), budgets met, `node tools/fixtures-check.js`
  **0 failures**, loaded and posed in three.js r128. **The sources are not in the repo**: the
  17 raw 3D Warehouse GLBs plus `picks.json` are in `C:\Users\jackf\Downloads\fixture-sources\`
  (and re-downloadable — `assets/fixtures/README.md` has the URL pattern). The tools ARE on the
  branch: `tools/blender/fixtures.py` + `fixtures.json` (the rules, one entry per fixture),
  `fixtures_sheet.py` (colour-coded check renders), `tools/fixtures-check.js`.
- **The rig and the picks:** `docs/HAMILTON-RIG.md` (every fixture, count, source, author,
  tris); the equipment list verbatim in `docs/hamilton-equipment-list.txt`; the chooser he
  picked from is https://claude.ai/artifact/YFMCghYoCM12CRC1NRoaqz (his picks are its
  `choices` collection).
- **Fixture follow-ups, small:** the Source Four is one body (the plot wants six barrel
  lengths); the X4 is the X4 not the XL (same shape, 20% bigger — scale it); five are
  stand-ins (Stickup, Mini-10, ELAR, PixelPAR, Lycian) because no model of the real thing
  exists; the 3D Warehouse licence allows use in the game but not redistributing the files
  alone; the VL3500 is ETC's, non-commercial.
- **Node is still the portable copy** in the OLD session scratch
  (`…\fcf2674c-d68f-48b7-816b-bbf0793541d1\scratchpad\node_dl\node-v24.21.0-win-x64\node.exe`);
  it ran the check. `winget install OpenJS.NodeJS.LTS` — Jack runs it. The suites were NOT run
  this session (nothing in `src/` changed; `the-house.html` and `docs/ARTNET.md` untouched).
- **Headset run still owed**, as below.

---

## NEWEST — 2026-10-11, the Hamilton set (branch `hamilton-set`, RULING FE)

- **Where it stands: committed (`f4d9a90`) and pushed, PR NOT YET OPENED.** The
  permission layer refused the GitHub API call, so Jack opens it from
  https://github.com/Jackscreations21/gms-theater-game/compare/main...hamilton-set
  (the body is in the chat of 2026-10-11). Until it merges, `main` is `4125f6f`
  with the red `beetlejuice.js` case below. After the merge: rebuild `main`
  byte-identical, 21/21, delete the branch both sides — the post-merge protocol.
- **RULING FE (Jack, 2026-10-11): "can you put the set model onto the stage."**
  HAMILTON is now *modelled on the production* — AV's repeal of AO extends to
  it, scoped to it; the other three shows still carry the interpretation note
  and `beetlejuice.js` pins that. The set is the model ETC ships inside the
  *Hamilton Programming Project* (Rod Lemmond's model of David Korins' design,
  **non-commercial licence** — see `assets/README.md`).
- **What landed:** `assets/hamilton-set.glb` (65,949 tris, 5 materials, 6.8 MB),
  built by `tools/blender/hamilton_set.py` from the `Hamilton Full Set` COLLADA
  inside the show file — the theatre's proscenium, borders and floor stripped,
  walls brick, flats timber, 400k CAD triangles planar-dissolved to 66k. `p5i`
  `loadHamiltonSet` fetches it at show load and `hamApplyModel` seats it
  (metres, deck at 0, x centred, `HAM_MODEL.z` −3.91 so the model's turntable
  centre lands at **z −2.96**); the hand-built structure is now the **stand-in**
  (`SHOW.hamStand`, p5f) and leaves with its walkables and lanterns. The
  revolves moved and shrank to the real turntables, **r 3.82 / 2.59 at z −2.96**,
  measured off the model's own floor rings; `HAM_MODEL.tt` and `REV` are held
  together by a test. New cases in `tests/sets.js` (five) plus a node-side read
  of the GLB's budgets; `beetlejuice.js`'s on-disk check now also accepts
  `HAM_MODEL` and README-declared third-party files.
- **Not done, deliberately (FUTURE.md PART 2):** the model is scenery only —
  no `walk_` meshes, so the galleries and stairs are not climbable (a 66k mesh
  cannot go on `WALKABLE`; it wants low-poly walk boxes); the lanterns went
  with the stand-in; textures are generated brick/grain, not photographs; the
  rig, the cues and the Art-Net patch are untouched.
- **Finding: `main` had a red suite since #221.** `beetlejuice.js` "every
  delivered .glb is in the index …" fails on `midtown-auditorium.glb`
  (committed, fetched by no manifest) and nobody saw it because that round had
  no Node. Fixed in this branch by letting `assets/README.md` declare a
  not-yet-wired file; the lesson is in TRAPS.
- **This machine now has Node**, portable, at
  `C:\Users\jackf\AppData\Local\Temp\claude\…\scratchpad\node_dl\node-v24.21.0-win-x64`
  (session scratch — install it properly with `winget install OpenJS.NodeJS.LTS`,
  and run that yourself, see TRAPS "the sandbox"). `tests/npm install` is done.
  **Eos Nomad v3.3.10 is installed** (`C:\Program Files\ETC\EosFamily\v3\Eos`).
- **The Hamilton cue data is exported:** `C:\Users\jackf\Downloads\The Hamilton
  Programming Project - Intro - Rev A.csv` — 128 distinct cues in 13 islands,
  111 presets, 659 channels, 200,900 level rows. **It is not the whole show**
  (about a fifth of the cue stack); FUTURE.md PART 2 has the breakdown and
  what a reconstruction would mean. Nothing of it is in the repo yet.
- **Headset run still owed**, as below.

---

## NEWEST — 2026-10-10, read this before the Art-Net sections below

- **`main` moved on after the Art-Net record below was written:** #217
  (`artnet-desk-record`), #218 (`build-load-gate`), #221 (`midtown-scan`) and
  #222 (`midtown-holes`) merged; `main` is **`7d27c9d`**. The Art-Net sections
  below were not updated for #217/#218. Read those two PRs before trusting the
  Art-Net numbers below.
- **#222 was merged with only its first commit.** The markup tool and Jack's two
  applied rounds landed on the branch after the merge and never reached `main`;
  the `midtown-rounds` PR carries them. Until it merges, `main`'s GLB still has
  the speakers and the vent-recess holes.
- **New machine:** Jack's, at `C:\Users\jackf\OneDrive\Documents\gms-theater`.
  Git 2.55 and Blender 5.2 are installed. **Node is not**, so the suites cannot
  run here yet (`winget install OpenJS.NodeJS.LTS`). The relay path below
  (`C:/Users/patri/...`) is the OLD machine.
- **`midtown-scan` (#221) and `midtown-holes` (#222) are merged; `midtown-rounds`
  is the rest of the second pass** (assets and tools only, all three). Nothing in
  `src/` changed, so `the-house.html` and `docs/ARTNET.md` need no regenerating.
  - `assets/midtown-auditorium.glb` is a CC BY scan of a real auditorium, edited
    into a theatre house: a solid proscenium, a fly tower, a brick back wall and
    filled holes.
  - The second pass closed what an inside-out raycast audit found (a void east of
    the stage-right wall, slits under the wall-top fills, wing-door lintels, wall
    bases), deleted the shards the first pass missed, and matched the tiled brick
    to the real one. **Escaped rays: 4807 → 501, of which 498 go out through the
    two rear doorways Jack chose to leave open.**
  - Rebuild it with `tools/blender/midtown_theatre.py`. Walk it in
    `tools/midtown-viewer/` (re-exported). **Jack marks it up at
    https://claude.ai/artifact/LwSoKjQ911xowE1DQa4syv** (`markup.html`: delete a
    region, retexture a panel, pin a note); his edits land in that artifact's
    `edits` collection — **read it at the start of the next scan session and
    apply them in the script.** Recipe in HANDOFF. **Two rounds are already
    applied and cleared** (speakers out, piers widened, vent recesses closed),
    so the list starts empty.
  - The full record is in HANDOFF.md, the two "DONE — 2026-10-10" blocks.
- **Not wired into the game.** Three decisions are Jack's (FUTURE.md PART 2,
  "Realism"):
  1. Which venue it becomes.
  2. The fly rail for its new fly tower.
  3. Merging its 16 materials down to the 8 budget.

  The rest of the realism options list is there too, unchosen.
- **The headset run is still owed**, as below. Nothing in this session touched
  the game's rendering.

---

## (2026-08-16) ART-NET: THE ROUND IS CLOSED — RULINGS EL–FD, NOTHING OPEN

## READ THIS FIRST

The desk drives the Palace, **and the Art-Net round is finished** — #200 to
#216 with no gaps, of which #206 is an extra written mid-round. **Nothing is
open, nothing is shelved, and no branch is unlanded.** `main` is at
**`a3eecce`**, the suite count is **21**, rulings are at **FD**, and the
cache-bust is **`?v=31`** from here.

**RULING FD is the last ruling in** (#214), and it came from Jack at a desk with
the channel file open: *"make it so the list isnt generated it is just what it
is for beetlejuice and make it easier to read."* **The "not generated" half was
put back to him** — that was one instruction with two halves pulling opposite
ways, because un-generating the file removes the only reason it can be
trusted — **and he chose reformat-and-keep-generated.** So `docs/ARTNET.md` is
now a six-block patch sheet, 326 flat lines down to 219, and it is still
measured. See "HOW TO ACTUALLY RUN IT" below.

**#216 carries it into a spreadsheet.** `node tools/artnet-map.js --csv` emits
the same measurements in the three columns of his Google Sheet — `channel
number,what is does,where it is`, **header copied verbatim, typo and all,
because it is HIS sheet and a column whose name does not match will not line
up when he pastes.** `where it is` is the column the data never had, and it is
read off the built rig (`f.pos`, `f.ls`), so a lantern that is re-hung moves in
the sheet too. **It is a flag, not a third committed file** — see the open
decision at the bottom of this file.

**#213 (RULING FC, the proscenium neon) went in before it** — it was the one
branch this file previously listed as finished-but-unpushed, and the three
things it still owed are all discharged:

1. **It is merged.** Post-merge protocol run: `main` rebuilds byte-identical
   (`94084f5e`), `node tools/artnet-map.js` reproduces `docs/ARTNET.md`
   exactly, 21/21 on the merged result, branch deleted local and remote.
2. **The unreviewed post-review fixes were reviewed, and the review found a
   real hole.** The fix for the first review's finding had widened the gate
   from the portal to a `deskOwnsIt` that **also gates `HOUSE.house`** — a
   second behaviour change with **no assertion behind it**. Two assertions
   added, both on a sentinel, both negative-checked and both firing. The
   general lesson is now in TRAPS: **a fix written in response to a review is
   itself unreviewed code.**
3. **The two corrections this file owed are applied** — the Pages parenthetical
   below is rewritten, and the PR table's premature #213 self-healed on merge
   exactly as predicted.

## IT HAS NOW BEEN RUN AGAINST A REAL DESK, AND THAT IS NEW

Everything before 2026-08-16 came out of jsdom. On that evening Jack patched a
real QLC+ into the relay, and the session is worth reading for what it found:

- **The universe was the whole problem, and the default was right.** QLC+ sends
  Art-Net **universe 0**, which is what `docs/ARTNET.md` and the relay default
  say. A `--universe 1` suggestion from me broke a working setup for an hour.
- **QLC+ holds UDP 6454 itself**, on IPv6 `::`, while the relay holds IPv4
  `0.0.0.0`. With QLC+ open, packets to 127.0.0.1 still reach the relay.

  **CORRECTED 2026-08-16, off his machine, and the earlier verdict was too
  broad.** This bullet used to conclude *"no `EADDRINUSE` is ever raised — the
  relay's comment claims that refusing `reuseAddr` makes a clash loud, and it
  does not."* **The comment is right; the test was against the wrong
  opponent.** Measured on his machine, both ways:
  - **QLC+ vs the relay: genuinely no clash.** Seen with QLC+ holding **both**
    `0.0.0.0` and `::` — the relay still bound and still counted packets in.
    QLC+ sets `SO_REUSEADDR`, which on Windows lets a second socket take the
    same address, so the relay slots in beside it.
  - **Relay vs relay: a real, loud `EADDRINUSE`,** exactly as the comment
    claims. With one relay already up, a second printed
    `[artnet] UDP error: bind EADDRINUSE 0.0.0.0:6454` and died rather than
    silently splitting the packet stream. **That is the guard working.**

  So the relay's reasoning stands and this file was wrong about it for a day.
  It is the round's **second** hardware-sourced finding after RULING FB.
- **The ARTNET row cannot tell three failures apart.** A tab that is not
  rendering (the frame loop stops, so `artnetTick` never consumes what has
  arrived), a page whose socket can never reach a relay, and a desk that simply
  is not talking all read `ON — no desk yet`. That cost most of an evening, and
  it is unfixed.

  **CORRECTED 2026-08-16 — and the correction is the whole point of the
  bullet.** An earlier draft of this line said `file://` and Pages both make
  `artUrl` return null. **They do not, and they are two different failures with
  two different console signatures**, which matters enormously when the row
  says the same thing for both. `artUrl` (`p6d:172`) returns null **only when
  there is no host at all** — that is `file://`, where `artOpen` is a genuinely
  silent no-op and the console stays clean. **From Pages there IS a host**, so
  it returns `wss://jackscreations21.github.io/artnet`, a socket really is
  constructed, and it **fails to connect** — a visible WebSocket error, just
  not one that says anything about Art-Net. Telling a tester "it will fail
  silently" when their console is showing them an error is how an evening goes.
- **A REAL DESK IDLES AT ~1.8s BETWEEN PACKETS**, not at Art-Net's nominal
  44Hz — which is what RULING FB is, and it is the first number in this whole
  round that came off hardware rather than out of reasoning.

**Everything else below is still jsdom**, and no part of this round has been
in the headset.

| PR | Ruling | What |
|---|---|---|
| **#200** | **EL** | `tools/artnet-relay.js` — zero-dep Art-Net→WebSocket relay, and the 21st suite |
| **#201** | **EM state, EN, EU, EV** | `src/p6d.txt` — the socket, the reconnect off frame `dt`, `artnetTick` |
| **#202** | **EP, EN, EO** | the lights are raw writes; the Palace only; the channel bases |
| **#203** | **EM gates, EV, EW** | the board yields; the ARTNET row on both surfaces |
| **#204** | **EQ** | the flys, through their own motor |
| **#205** | **ER, ES** | the Beetlejuice house selector and the sign |
| **#206** | — | the mid-round record, written when the chain paused at six |
| **#207** | **ET, EX** | the set movers — parked unless driven |
| **#208** | **EO** | `tools/artnet-map.js` and the generated `docs/ARTNET.md` |
| **#209** | **EY** | the record: the QLC+ recipe, the rulings, the one bug left standing |
| **#210** | **EZ** | the sign is a fly — target and speed, and it retires EY’s sign half |
| **#211** | **FA** | `docs/ARTNET.md` becomes a flat list, one line per channel |
| **#212** | **FB** | `ART_STALE` 2s → 5s, measured against his real QLC+ desk |
| **#213** | **FC** | the proscenium neon: intensity and RGB, written raw — channels **311..314**, movers to **315** |
| **#214** | **FD** | `docs/ARTNET.md` becomes a grouped patch sheet — supersedes FA, still generated |
| **#215** | — | the record for FC and FD |
| **#216** | — | `tools/artnet-map.js --csv`, the same measurements in his spreadsheet columns |

Every merge verified: `main` rebuilds **byte-identical**, 21/21 suites on the
merged result, branches deleted local and remote. Two-stage review on every
PR — and on #207 that review was the first the mover code had ever had, and on
**#213 a THIRD pass** was needed, because the fixes closing out review two had
never been read by anybody.

## THE REST OF WHAT IS LEFT, in the order it will bite

**None of it is a branch, and none of it is mine to finish** — the first is
hardware, the rest want a ruling.

1. **A HEADSET RUN, now three rounds owed.** `?v=29` never happened, DR–DY has
   never been seen, and no part of the Art-Net round has been in the headset
   either. **All of the desk work is desktop-only.** Read all four wrist lines
   (`avg`, `pk`, `fov`, `calls · tri`) at the four moments: empty Palace,
   Beetlejuice pre-show, the 1:00 cue with eight blinders, and — new for this
   round — **at the proscenium looking up into the neon, with a desk driving
   311..314**. Prediction on record: **~590 calls empty at the boot view**; if
   it reads ~700 the build is stale.
2. **RULING EY, ruled and not built** — a dead universe still redresses the
   house on its first frame, channel 307. Jack ruled the fix and ruled that it
   waits. FUTURE.md PART 1a item 4.
3. **`ART_PROVE` and the relay's sequence guard** — both sized off Art-Net's
   nominal 44Hz, both disproved by the same measurement that produced FB.
   FUTURE.md PART 1a item 5. Neither is urgent; both are wrong.
4. **The ARTNET row cannot tell three failures apart** (above). It cost most of
   an evening and nothing has been done about it. **No ruling yet, and this is
   the one most likely to cost another evening.**
5. **Three spellings of "a desk is driving THIS rig", two disagreeing** —
   latent only, because `STAGE` is always defined. New this session, from the
   #213 review. FUTURE.md PART 1a item 7.
6. **The `tests/smoke.js` flake**, ~1 run in 12. FUTURE.md PART 1a item 6.
   **It fired once in this session** — a full `npm test` came back
   `20/21 FAILED: smoke`, and `smoke` alone then passed three times running and
   the next full run was 21/21. That is the documented flake behaving exactly
   as documented, and it is the first sighting recorded with a re-run count
   attached: **a lone red `smoke` after an unrelated change is this, and one
   re-run settles it.**

## THE ONE THING LEFT, AND IT IS RULED BUT NOT BUILT (and it is smaller than it was)

**RULING EY — a dead universe still redresses the HOUSE.** Jack ruled the fix
and ruled that it waits: *"Don't fix it — just record it."* The work is
**PART 1a item 4 of FUTURE.md**.

**THE SIGN HALF IS FIXED.** As first written EY was mostly about the sign,
which a dead universe hauled 11.36m to the deck in full view. **RULING EZ
retired that** by taking the sign off a band and onto its own target/speed
pair — a zero speed byte parks it. What is left is channel 307 alone.

`artBands` writes channel 307 on a band CHANGE only and `ART.houseBand` starts
at **-1**. A change from -1 is a change — so the FIRST frame of an unpatched
universe reads band 0 and redresses whichever house is standing back to the
Maitlands. A dress swap rather than a move, and band 0 is also the load
default, so usually a no-op — but "usually" is doing real work there.

**The third time the same collision was found in one round.** EQ gave the flys
a speed byte; 309 was parked by its own lineset's speed byte after an unpatched
desk ran the house curtain shut in front of the audience; EX made byte 0 "no
command" on the set movers. The bands were the only ones left, and they were
left because nobody had measured them.

**IT WAS HIDDEN BY CASE ORDERING**, and that is the finding worth keeping even
though the case that carried it is gone. The round's safety case for the sign
called `deskOn()` — which delivers a frame, which established band 0 — BEFORE
it put the sign on its stop, so its 120 measured frames were a no-change band
and it passed. The assertion written to prove the sign safe was the thing
concealing the hole. **That reproduction no longer fires**, because EZ took
the sign off the band; the lesson is in TRAPS, and 307 has no equivalent case
to reorder.

## HOW TO ACTUALLY RUN IT

```sh
node C:/Users/patri/Documents/theater_game/tools/artnet-relay.js
```

**THE ABSOLUTE PATH IS DELIBERATE AND IT COST HIM A ROUND.** `node
tools/artnet-relay.js` is what this file used to say, and run from anywhere but
the repo root it fails with `Cannot find module`. The relay resolves the
directory it SERVES from the script’s own location, so an absolute path is
safe from any working directory — there is no reason to make anyone `cd`
first.

**AND IT HAS TO BE RUNNING EVERY TIME.** It is a plain Node process, not a
service: close the window and `localhost:8080` stops answering, which presents
as `ERR_CONNECTION_REFUSED` and reads like the game is broken. Both of this
session’s “it isn’t coming up” reports were this.

Then open `http://localhost:8080/the-house.html`, LIGHTING page, throw ARTNET.
QLC+ outputs Art-Net to **127.0.0.1, universe 0**. **Patch off
`docs/ARTNET.md`** — it is generated from the build and the suite fails if it
drifts. VR-SETUP.md §8 is the full recipe.

**RULING FD made that file a PATCH SHEET** (#214): six blocks — LANTERNS 1-273,
FLY RAIL 274-301, HOUSE CIRCUITS 302-306, BEETLEJUICE dressing/sign/traveler
307-310, PROSCENIUM NEON 311-314, SET MOVERS 315-326 — each heading carrying
its own channel range, the 39 lanterns collapsed to one 7-channel pattern plus
a roster of base channels. **It is still generated and still measured**, and
there are now three guards on it: the probe refuses to emit a sheet whose
blocks do not tile the whole range, and the suite re-checks that tiling from
the committed file so the guarantee survives somebody deleting the probe's own
check.

Headset: `adb reverse tcp:8080 tcp:8080`, then the same localhost URL in the
Quest. **Art-Net from the GitHub Pages URL cannot work** — `artUrl()` only ever
builds a SAME-ORIGIN socket, so from an HTTPS Pages page it attempts
`wss://jackscreations21.github.io/artnet`, and there is no WebSocket endpoint
there. (Mixed content is what kills the obvious workaround — hard-coding a LAN
`ws://` — not the default path. The console error will not say "mixed
content", which is worth knowing before anyone debugs it.)

The relay binds **127.0.0.1 by default** and serves **the repo** — resolved
from the script's own location, so you cannot redirect it by `cd`-ing
elsewhere. `--host 0.0.0.0` opens the LAN; the UDP socket is unaffected either
way, so a desk on another machine still reaches it.

## STILL HIS TO DECIDE — three, and one to know about

(1, 2 and 3 want an answer. 4 does not — it is here because it will otherwise
be found at a desk.)

1. **Should the CSV be COMMITTED and guarded, or stay an on-demand flag?**
   Asked at the end of the desk session and **not answered.** Today it is a
   flag: `--csv` emits it, nothing is checked in, and **nothing warns when the
   sheet he has pasted goes stale.** `docs/ARTNET.md` has a suite case that
   fails the moment it drifts from the build; the CSV has no such guard, so his
   tripwire is indirect — a red ARTNET.md case means the patch moved and the
   sheet needs regenerating too, but only if somebody runs the suite. **The
   argument against committing it** is that this repo already carries two
   generated files that must be regenerated with every `src/` change, and a
   third is a third thing to forget. **The argument for** is that a spreadsheet
   he has actually pasted into a shared sheet is the copy most likely to be
   consulted and least likely to be regenerated. One small PR either way.
2. **Audio from QLC+ — asked and unanswered, twice now.** Art-Net carries DMX
   only. A QLC+ audio function plays on the PC's own sound card, outside the
   game entirely. The offer on the table: a **4-channel sound block** (track
   select, play/stop, master volume, seek) so a desk cue fires the game's OWN
   recordings in sync with its transport — the machinery already exists from
   RULING BO. One PR. Or volume only (1 channel). Or leave it out.
3. **Channel 317 is one-way and nothing can be done about it without a
   ruling.** (It was 312 when first written — RULINGS EZ and FC have each
   renumbered the mover block since. **Patch off `docs/ARTNET.md`, which is
   generated and cannot drift; never off this file, which just proved it
   can.**) The Maitlands exterior is a whole-group travel with `home` 0 and
   no `out`, so every byte from 1 to 255 commands it HOME and no byte sends it
   back out — and it hangs a 12.6m drop dead centre of a 15m opening. Widening
   it means consulting `sc.parkMv`, which the plan's correction #2 forbids.
   `docs/ARTNET.md` prints it rather than hiding it.
4. **Channel 310's traveler moves with the production — nothing to rule on,
   but worth knowing before you patch it.** RULING EO always said "the first
   lineset whose hung goods declare `traveler:true`, and the map probe prints
   which line that is", and was right; the loose sentences were `p6d`'s comment
   and this file's, and both are corrected. On the Palace standing hang it is
   line 2, the house curtain. **With Beetlejuice loaded it is line 1**,
   because the show hangs its own `bjCurtain` and `FLY.findIndex` takes the
   first — the Palace house curtain is not hung at all under Beetlejuice. The
   map measures and prints both. Nothing is broken; the DOCUMENT was wrong.

## CARRIED, AND STILL UNSEEN

**The `?v=29` headset run never happened**, and it is still owed — now two
rounds deep. Read all four wrist lines (`avg`, `pk`, `fov`, `calls · tri`) at
the four moments: empty Palace, Beetlejuice pre-show, the 1:00 cue with eight
blinders, at the proscenium looking up into the neon. Prediction on record:
**~590 calls empty at the boot view**; if it reads ~700 the build is stale.

Everything else in "STILL HIS TO DECIDE" from the perf round stands: the neon
rake, the sign's red at GO, the cemetery's missing park, 181MB of models, the
graveyard, the audio join at 4292, the house floor pool, `BLIND_BODY`,
`pr6.json` (still untracked, still unruled), the `envTrack` rota backstop.

**And a pre-existing flake worth knowing about before it wastes an hour:**
`tests/smoke.js` "the puffs drift, spread and die" fails about **1 run in 12**
— a puff whose random drift stays under the case's 0.3m threshold. Found
during this round on a build it does not touch. Not fixed; it is in FUTURE.md.

## Standing facts

Suite count **21** (`npm test` in tests/); probe-lint runs first and is a test
of the TESTS. The patch is 39 channels on every stage and the rail is 14 lines
— which is where 274 and 302 come from, computed not written. three.js has
**no multiview at any version**; r160.1 is the UMD ceiling. **His photographs
are never committed.** **Every timestamp in the Beetlejuice plot is a position
in his WHOLE recording.**

## Shelved

**Nothing.**
