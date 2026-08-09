# The workshop, made real — the belt and the shed, rebuilt to look like tools

**Date:** 2026-08-09
**Source:** the owner's ask, verbatim:

> "make everthing on the tool belt and in the warhouse look mor
> realistic (saws, nail gun, tape measure, hammer, shelves, etc).
> would it help if i found 3d models for everything and you just had to
> scale them and put it in or do you want to do it all yourself"

Shaping answers, given live: **build it procedurally, no downloaded
models**; push the detail **as far as textures**; **the owner's
judgment is delegated** — no reference photos, revise off the headset
instead; and **appearance only this round**, with motion (spinning
blades, recoiling guns, extending tape) deferred to its own round.

Four PRs, sequential. Rulings continue the sequence; carpenters phase 2
ended at AH.

---

## What this is

Every tool on the belt and every fixture in the two sheds is currently
a placeholder: two or three untextured primitives standing in for an
object. The whole toolbelt is **nine boxes and cylinders** — the nail
gun is three boxes, the hammer is a cylinder and a box, the tape is two
boxes. They are held at arm's length in a headset, constantly, and they
read as what they are.

This round rebuilds their appearance and nothing else. It is the same
job **#33** did for the lanterns — five flat stand-ins became real
lanterns with barn doors, gel frames, C-clamps and shutter handles —
and that is still the best-looking hardware in the building.

## Why there are no downloaded models

The owner offered to source 3D models. Four things in this project make
that a bad trade, and they are recorded here because the question will
come round again:

1. **The tests.** All sixteen suites boot the whole file in jsdom and
   assert on real geometry, synchronously. `.glb` loading is async and
   jsdom cannot fetch the assets, so every assertion touching a tool, a
   saw or the rack would need stubbing. That is a permanent tax on the
   project's only safety net.
2. **`file://` stops working.** three.js already comes from a CDN, so
   the page is not network-free — but `GLTFLoader` fetches model files
   over XHR, and a `file://` page is blocked from doing that. Today
   `the-house.html` runs on a double-click. With external assets it
   would need a server every time.
3. **It stops being one file** — the first line of `CLAUDE.md`. The
   escape hatch, base64-embedding models into the JS, keeps one file
   but bloats it badly and parses at boot.
4. **Licensing.** The repo may go public. "Free" models are often not
   redistributable, and CC-BY carries an attribution obligation
   forever. Procedural geometry has no license question.

And these are the ideal procedural objects: a nail gun, a hammer, a
tape, a chop saw and pallet racking are boxes and cylinders with
details on them. Nothing here is organic.

**What would help instead is photographs.** The locking rail reads well
precisely because the owner sent a photo of a real one (2026-08-07).
For this round the owner delegated judgment instead — so the first pass
is my read of a professional scene shop, and the headset is the review.

---

## The rulings

### RULING AI — the game stays one file; no external assets, ever

Geometry is built in code. Textures are drawn on a `<canvas>` and
wrapped in `T.CanvasTexture`, the way `deckTex`, `brickTex`, `goldTex`,
`velourTex` and twenty others already are. **No `.glb`, no `.png`, no
loader, no `models/` directory.** If a future round genuinely needs a
mesh that cannot be written as code, that is a decision to take
deliberately and separately, with the four costs above priced in.

### RULING AJ — this round is COSMETIC; behaviour is frozen

Geometry and materials change. Nothing else does. Every grab radius,
holster position, seat envelope, snap distance, trigger action and
station id stays exactly as it is. Function names, signatures and
returned record shapes stay as they are, so no caller changes.

**The enforcement is that the existing suites must pass UNEDITED.**
`vr.js`, `build.js`, `warehouse.js`, `carp.js`, `full14.js` and the
rest are the behaviour spec. If any of them needs a change to go green,
that is proof the round changed behaviour, and the change is wrong —
not the test. This is the ruling that makes a large cosmetic sweep safe
to do at all.

### RULING AK — detail is paid for by merging, not charged to the frame

r128's core ships no `BufferGeometryUtils`. This round adds
`mergeParts(list)` to p2: it takes `[{geo, pos, rot, scale}]`, bakes
each transform into the vertices, and concatenates position, normal and
uv into one `BufferGeometry`. Hand-built `BufferGeometry` is already an
idiom here (`p2b`, `p2g`), so this is house style.

Every static cluster in this round goes through it, grouped by
material. The standing requirement:

> **No object in this round may finish with more meshes than it has
> today.**

The chop bench is seven meshes right now to draw a table and an arm;
detailed and merged it is two — one static body, one moving cutter. The
nail gun is three meshes to draw three boxes; a full framing nailer is
one. The round should come out **net-neutral or better on draw calls
while looking dramatically better**, which is what makes it safe to
land before the frame-rate reading.

`mergeParts()` is also the tool item 4 of the frame-rate list already
asks for — merging the lantern bodies' static steel. This round builds
it and proves it in service of something else.

### RULING AL — four things never merge

Merging is the risk in this round. A part that must be found, moved,
grabbed or recoloured at runtime has to stay its own mesh:

| Part | Why |
|---|---|
| the saw `cutter` group | slides along table X, is a grab class, carries `userData.moves` |
| the lift `forks` group | moves on the mast; pallets `attach()` to it |
| the paint `roller.head` | `p9:2528` assigns `ro.head.material = woodMat(ro.color)` to show the last dip — a pointer swap that needs its own mesh |
| the paint cans | one material per colour, individually takeable |

A test asserts all four are still separate meshes after the round. Any
future addition to the merge treatment checks this list first.

### RULING AM — textures are SHARED, never minted per object

New canvas textures are the real cost in a headset: each is VRAM and a
texture bind. The round adds **one** worn galvanised steel, **one**
dark cast iron, **one** moulded plastic, **one** rubber grip, **one**
chipped safety-yellow, **one** plywood, and a small stencil-label
helper — and every object in the round draws from that set.

They live in `p2` next to `TX` and `M`, which is where every shared
texture and material in this game already lives.

**The shared-material trap applies with full force** (TRAPS.md; it has
bitten three times — `M.serge`/`M.velour`, `LENSM`, `WOODM`). None of
these materials may ever be tinted in place: a shared material mutated
for one object repaints every object using it. Anything needing a
per-object colour uses the cache-and-swap pattern (`WOODM`/`GOODSM`),
never `material.color.set`.

### RULING AN — motion is a separate round

Spinning blades, a recoiling gun with an emptying magazine, a tape
blade that extends to the measured length, a hammer claw that bites:
all deferred. Each touches live code paths that have tests on them, and
the owner's call is to see the appearance in the headset first and
price the motion after. **Nothing in this round animates that does not
animate today.**

---

## The build

### Where it lives

- **The workshop palette → `src/p2.txt`**, alongside `TX` and `M`: the
  new canvas textures, the new materials, and `mergeParts()`.
- **The belt tools → `src/p9.txt`**, in place: `vrToolGun`,
  `vrToolHammer`, `vrToolTape`, `vrToolCrayon` are rewritten. Their
  signatures and the `TOOLG` geometry cache are unchanged.
- **The shed fixtures → `src/p2m.txt`**, in place: `buildSaw`,
  `buildRack`, `buildTrash`, `buildLift`, `buildCart`, `shedRack`.
  Every signature and returned record shape is unchanged.

**`build.sh` is not touched.** Its order is a dependency order with
load-bearing positions and this round needs no new part.

### What each object becomes

**The belt (four):**

- **Nail gun** — a pneumatic framing nailer: angled stick magazine,
  depth-adjust nose, contact tip, hose fitting at the heel, moulded
  housing with a rubber grip. The muzzle stays exactly where `nailRay`
  casts from.
- **Hammer** — a 20oz framing hammer: forged head with a claw and a
  waffled face, tapered neck, wood haft with a grip wrap.
- **Tape** — a cased 25ft: rounded ABS shell, brake button, belt clip,
  a hooked blade tip standing proud of the case. The tab the other hand
  grabs stays at its current offset.
- **Crayon** — a carpenter's pencil: flat oval body, sharpened chisel
  tip, printed band.

**The shed (seven):**

- **Track table** — cast top with T-slots, fence, leg braces; the rail
  carries a real saw head with a guard, motor housing and dust port.
- **Chop bench** — a mitre saw on a stand: base with a slotted kerf
  plate, fence, blade guard, motor, handle, feed arms.
- **Paint rack** — timber-and-steel shelving with uprights and
  brackets, drip-stained boards; cans with rims and lids; the roller in
  a tray.
- **Trash drum** — a ribbed steel drum, hoop bands, dents, chipped
  paint.
- **Forklift** — a walk-behind pallet stacker: mast channels, lift
  chain, hydraulic ram, control head on the tiller, castors, hazard
  stripes.
- **Pushcart** — welded tube frame, mesh shelves, swivel castors.
- **Storage racking** — pallet racking: punched uprights, beams,
  footplates, diagonal braces.

### The PRs — four, linear chain, never stacked

1. **The workshop palette and the belt.** The textures, the materials,
   `mergeParts()` and its tests, and the four tools rebuilt. Carries
   this spec and the plan.
2. **The cut stations.** Track table and chop bench, both sheds.
3. **The paint rack, the roller, the cans and the drum.**
4. **The heavy plant.** Forklift, pushcart and the storage racking.

Each is cut after its parent merges, rebased onto fresh `main`,
rebuilt, and re-run 16/16 before it is opened. PR 1 is genuinely first:
everything after it draws on the palette and the merge helper.

---

## Testing

**The existing suites are the specification of behaviour and they run
unedited** (RULING AJ). That is the primary test of this round: sixteen
suites, green before and after, with no test file touched. A failure is
a behaviour change and must be reverted, not accommodated.

Three new assertions, each negative-checked against the pre-change
build in the usual way:

1. **`mergeParts()` bakes transforms.** A box merged at an offset and a
   rotation has its vertices where the loose mesh's world-space
   vertices were — compared numerically, not by eye.
2. **The mesh census.** For every object in the round, count the meshes
   under its group and assert it is **at or below** the pre-round count
   (RULING AK). This is the guard that stops "more realistic" from
   silently meaning "more expensive", and it is why detail can be added
   before the frame-rate reading rather than after it.
3. **The four survivors.** The saw `cutter`, the lift `forks`, the
   paint `roller.head` and the cans are each still their own mesh with
   their own material, and the roller head's material can still be
   swapped (RULING AL).

Beyond jsdom: what the suites cannot judge is whether any of it *looks*
right. That goes to the headset, and the questions belong in HANDOFF's
next-session block alongside the frame-rate readings.

---

## Risks, stated plainly

- **Textures are the real cost**, not the geometry. RULING AM's shared
  set is the mitigation; if the frame-rate reading comes back
  fill-bound, texture detail is the first thing to trim and the shared
  set makes that a small edit rather than a sweep.
- **Merging is where this round could break something.** RULING AL
  lists what is known to matter and the third test guards it, but a
  careless merge of something grabbable is the realistic failure mode.
- **The frame-rate reading still has not happened.** This design is
  written to help rather than hurt either way — fewer draw calls if
  submission-bound, trimmable textures if fill-bound — but it is more
  triangles and more texture than today, and that is an honest cost.
- **No reference photos.** By the owner's call. The first pass is a
  judgment call about what a scene shop looks like, and some of it will
  be wrong; the headset run is the review, and revisions are cheap
  because every object is a function.
