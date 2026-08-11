# BEETLEJUICE — the look remake, the transitions, and the portal

**Date:** 2026-08-10 (evening)
**Source:** the owner's first headset run of the re-time round (#104–#113).
Three findings, verbatim:

> "the sets look nothing like there picture remake them all to make them look
> more like these pictures. and second of all make sure everyset change has an
> actual transition instad of it just instantly changing. and remove the neon
> tubes"

He re-supplied the reference photographs alongside the report. Rulings continue
the sequence; the last round ended at **AV**. This one takes **AW–AZ**.

**Amended the same evening:** the owner proposed modelling the sets himself —
"what if i 3d model each set myself then you just have to scale and paint
them", settled as "make anything that isnt a set like curtain and drops". So
the division of labour is: **he models the sets, this side builds everything
that is not a set** — curtains, drops, the sign, the marquee, the portal — and
all the machinery. RULING AZ carries the import pipeline.

---

## Why this round exists

The re-time round built the owner's plot and it runs green — and the first
pair of eyes on it found that (1) the scenery does not resemble the production
it is now, per RULING AV, supposed to resemble, and (2) the scene system still
changes sets the way it always has: `showCueExtras` (`p5c.txt:1477`) calls
`sceneShow(c.scene)` the instant a cue fires, while the light fade is only
*starting* — so a set pops into place on a lit stage. The covers the tests pin
are real lighting states, but the swap never waits for them.

The third finding, the neon, turned out to be a question rather than an order —
see RULING AX.

---

## RULING AW — every visual is remade to its photograph, paint-first

RULING AV said Beetlejuice is "modelled on the production". This ruling says
how close and how: **each named visual is rebuilt against its specific
reference photograph, as closely as the tools allow — and the tool is paint.**
The photographs are mostly scenic paint (the cloud sky, the cratered moon, the
swirl scrollwork, the wonky clapboard, the stripes), so the remake is
canvas-painted textures on cut profile geometry, merged with `mergeParts` so
detail costs no extra draw calls. No external assets — the single-file rule
stands; every texture is painted in a 2D canvas at build time, the way
`bjBackdropTex`, `bjSignTex` and `bjCurtainCanvas` already work.

Scope is **everything** (owner's pick, 2026-08-10: "Redo everything") — but
split (the same evening's amendment): **the owner models the sets himself;
this ruling now covers only what is not a set** — the show curtain, the
graveyard sky/backdrop cloth, the house-exterior cloth, the flown sign and the
marquee. The last two were built to photo in #108 and did not read; they are
redone, which supersedes #108's execution but not AV itself. The built scenes
as they stand today remain in place as **stand-ins** until the owner's model
of each set arrives and replaces it (RULING AZ) — the show is never broken
while he works.

### The reference table

| Visual | Photograph | What the photo shows |
|---|---|---|
| Graveyard | moon/tree wide shot | painted cloud-sky cloth, enormous cratered moon; CUT black hills downstage of it — the mound with the bare black tree, crooked crosses, small mausoleums on the wing hills, forced perspective |
| House, Maitlands dressing | warm interior | the swooping curved ceiling sweeps, centre staircase with newel, fireplace left, panelled walls, doors and windows where the photo puts them, warm and lived-in |
| House, Deetz dressing | grey interior | same architecture, grey-lavender, modern: panelling, sofa, dining set, chandelier |
| House, Beetlejuice dressing | purple interior | same architecture, purple, black-white stripes, the striped snake shapes, antler chairs |
| Attic | attic wide shot | two open-front junk sheds either side, slatted junk wall centre with double doors, a hung rafter fragment with string lights, moon and clouds behind |
| Roof | rooftop shot | blue shingle ridge, dormer windows, brick chimney right, moon in cloud |
| Closet | pink bootleg still | bright pink walls, the spiral door |
| Bedroom | purple bootleg still | Lydia's bedroom: purple walls, bed, doors, picture frames |
| Netherworld | nested-frames shot | nested neon rectangles receding upstage in forced perspective, haze — the neon IS this set and stays |
| House exterior | schoolgirl-and-cloth shot | painted cloth: wonky clapboard house with porch and trees |
| Flown sign | BETELGEUSE sign photo | two stacked BETELGEUSE decks in red neon inside a bulb border, the long arrow underneath |
| Show curtain | same photo, background | purple-blue cloth with black swirl scrollwork |
| Marquee | marquee photo | as photographed |

### What a suite can and cannot pin

`fillText` is a noop in the harness and jsdom has no GPU, so **likeness is a
headset judgement**. The suites pin structure instead: piece counts, dims,
positions, material colours, names — enough that a regression that deletes the
chimney or turns the closet beige fails a test, while "does the moon read"
stays a headset question, stated as such.

The piece budget holds: the show stays at or under ~140 pieces, and detail is
bought with paint and `mergeParts`, never with loose meshes.

## RULING AX — the portal is not removed; it is rebuilt to the photographs

The owner's words were "remove the neon tubes". The photographs he supplied
show a lit tube frame round the opening as part of the production's own design
— blue in the exterior scenes, purple in the Deetz scenes. The tension was put
to him rather than resolved quietly (the AO/AV pattern), with three options:
remove the tubes only, remove the whole false portal, or rebuild the frame to
match the photos. **He chose: rebuild it to match the photos.**

So:

- The blue-green tube frame and wing returns built last round come out as
  built. The weathered-board false portal stays as the picture frame.
- A new lit tube frame goes round the opening, proportioned off the
  photographs, and its **colour and level come from the cue**: a new cue field
  `portal:{col, lvl}` — blue for the exterior looks, purple for the Deetz
  looks, level 0 wherever the photo of that scene shows the frame dark.
  Missing field = level 0: the frame is dark unless a cue asks for it.
- The fade is dt-driven, riding the same style of machinery as the
  netherworld's `neon` field (which stays exactly as it is — that neon is the
  netherworld set, not the portal).

## RULING AY — nothing ever pops: every scene change is choreographed travel

The owner chose **"everything moves"** over hidden swaps and over a mix: every
set change is a watchable move, even in a blackout.

### The mechanism

Scene enter/exit choreography becomes **data on the scene itself**, not code
in the cue list:

- A scene may carry **several named part-movers**, not just today's single
  whole-group travel — `sceneTravelPart(sc, part, axis, home, off, speed)`
  alongside the existing `sceneTravel`. The graveyard hills part and run to
  the wings (±x); enclosed sets (attic, closet, bedroom, roof, netherworld)
  fly (y), like the flown pieces they are; the houses slide (z, the wagon as
  built); cloths stay on their real fly lines and need nothing new.
- A scene declares `enter` and `exit` move lists over those parts. A cue that
  names a scene now runs a **changeover** instead of a raw `sceneShow`:
  outgoing parts travel out, incoming scene's layers come on at their parked
  offsets, incoming parts travel in, overlapped like a real changeover. The
  deferred-hide machinery (`mvHide`) already exists and is the model: layers
  stay enabled for the whole move, and the hide lands only when the move does.
- The manual scene panel takes the same path, so a hand-clicked change
  choreographs identically for free.

### Consequences that must hold (extending RULING AP's list)

- **dt-driven, never `setTimeout`** — the standing rule; the `follow` chain
  remains the one violation and this round does not add a second.
- **Interruptible and retargeting**: a cue fired mid-changeover retargets the
  movers; it never queues.
- **A scene mid-travel is on** — layers enabled the whole move; a scene that
  is fully off keeps its layers disabled: no draw call, no raycast. The
  part-movers must not defeat that, exactly as AP required of the wagon.
- **A stage swap parks everything** — offsets, part offsets, and any
  changeover in flight — with the rest of the p2k parked state. A changeover
  must not be found half-done on walking back in.
- **Dressing swaps only apply while the wagon is parked off** in the wings —
  genuinely hidden, so instant is honest there. If a cue carries `dress` while
  the wagon is on, the swap defers until the wagon parks (and a test pins the
  deferral).
- Walkable pieces keep riding their movers (`sceneWalk` files them; the mover
  translates the group), pinned by test per part-mover.

### What "covered" means now

The existing assertions that every change lands in the dark or behind
something **stay** — the lighting states are unchanged this round — and a new
family joins them: **no piece reaches the stage except by travelling.** The
old assertion protects the lighting plot; the new one protects the point of
this ruling.

## RULING AZ — the owner models the sets; the game learns to import them

The owner's proposal, verbatim: "what if i 3d model each set myself then you
just have to scale and paint them" — settled to a split where he models
anything that is a set and this side makes "anything that isnt a set like
curtain and drops".

This pulls forward what the 2026-08-09 outside review filed under "later, for
richness": model import. The terms:

- **Format:** `.glb` (binary glTF, textures embedded), one file per set,
  committed under `assets/` in the repo. Real-world scale in **meters**
  (Blender's default export), +Y up, origin at the centre of the set's
  footprint with the floor at 0. The full brief the owner models against —
  per-set target dimensions, the budgets, the naming rules — lives in
  **`docs/MODELING.md`** and is part of this round's first PR.
- **The loader** is three r128's own `GLTFLoader`, vendored into a new `src/`
  part (the single-file rule holds for CODE; the models are assets, fetched at
  runtime). **Graceful fallback is mandatory:** if a fetch fails — `file://`,
  offline, a model not yet delivered — the scene keeps its built stand-in and
  says nothing. A missing model is a normal state of the world, not an error.
- **Budgets, enforced at import** (the Quest is the reason: r128 draws every
  eye separately and every material is a draw call): ≤ 30k triangles per set,
  ≤ 8 materials per set, textures ≤ 2048px. A model over budget is refused
  with a console line saying which budget and by how much — never silently
  accepted.
- **Naming rules:** meshes named `walk_*` become walkable floors
  (`sceneWalk`); everything else is scenery. No lights, no cameras, no
  animations in the export.
- **The swap-in:** a delivered model replaces the built stand-in inside the
  same scene group, so it rides the same wagon, the same movers, the same
  layer discipline and the same choreography (RULING AY) untouched. One PR per
  delivered set: scale, place, wire walkables, verify budgets, suites green.

---

## What this does to the cue list

Fade times, channel levels and `at` times **do not change** — the owner's plot
stands as re-timed in #104–#113. What changes per cue:

- `scene:` now triggers a changeover, not an instant swap.
- Explicit `move:` entries stay for the plot's named moves (the wagon, the
  sign, the exterior); the changeover engine supplies everything else from the
  scene's enter/exit data.
- `portal:{col,lvl}` is added per the photographs (RULING AX).
- `dress:` keeps its cues but gains the parked-only rule (RULING AY).

## What must not break

- **`follow` still spans the evening** — the chain still reaches 4262 at the
  act break and 8100 at the end, both already asserted.
- The suite count is 18 and stays green before and after every PR; **every new
  assertion is negative-checked against a wrong implementation**, not merely
  an absent one — five weak assertions shipped nearly-false-comfort last
  round; the check is the defence.
- `SHOWS` is declared in `p5c`; the show lives in `p5h`. **`build.sh` is never
  reordered.**
- The other four shows are untouched: AW/AX/AY are scoped to Beetlejuice, and
  the assertion pinning that AV's repeal did not leak stays green.
- `D.backWall` (−17) vs `PAL_BACK` (−21.5) stay different numbers — every
  stage-relative position in the remake is written to `D.backWall`.

## Delivery

The usual linear chain, one concern per PR, never stacked: spec+plan+modeling
brief first, then the changeover engine, then the portal, then the soft goods
(show curtain and backdrop cloth; exterior cloth, sign and marquee), then the
model-import pipeline, then the choreography data and cue wiring, then the
record — about 8 PRs. After that, **one PR per set the owner delivers**, for
as long as the models keep coming.
