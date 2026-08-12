# Modeling the Beetlejuice sets — the owner's brief

You model the sets; the game imports them (RULING AZ,
`docs/superpowers/specs/2026-08-10-beetlejuice-look-transitions-design.md`).
This page is everything a model needs to obey to drop straight in. Everything
that is NOT a set — curtains, drops, the sign, the marquee, the portal — is
built in-game and is not your problem.

## The stage, in real numbers

| Thing | Meters | Feet |
|---|---|---|
| **The picture opening** (show portal — the frame everything plays inside) | 13.6 w × 9.2 h | **44'7" wide × 30'2" tall** |
| Hard width cap (wider than this is refused by the tests) | 14.8 | 48'6" |
| Proscenium behind it | 15.0 w × 10.4 h | 49' × 34' |
| Stage depth available to a set | ~10 deep | ~33' |

A "full stage" set should be **~44–45 ft wide**. Anything past 44'7" is behind
the portal legs and unseen; anything past 48'6" fails the build.

## Export rules

- **Format:** `.glb` (binary glTF, textures embedded). One file per set,
  named `bj-<set>.glb` — e.g. `bj-attic.glb`.
- **Scale: real-world meters** is still ideal — **but if it comes out
  normalised, that is fine now.** Every set is **scaled to fit the table
  below**, measured off the model's own bounding box, so a file that arrives
  1.9 units across and one that arrives 13.4 m across end up the same size on
  stage. Your Meshy exports are the former; nothing needs re-exporting for it.
- **It is scaled to fit ALL THREE dimensions, not just the width** (RULING BX).
  The scale is one number — nothing is ever stretched — and it is the smallest
  of what the width allows, what the **9.2 m picture opening** allows, and what
  the **~10 m of stage depth** allows. **A set drawn to the proportions in the
  table is limited by its width and lands at exactly the width it asks for**,
  so this never bites a set built to this page. What it catches is a set that
  is proportionally taller or deeper than its target: that one lands smaller
  than the Width column says, because the alternative is a third of it above
  the picture and the rest of it through the back wall.
  **If a set arrives narrower than you expected, it was too tall or too deep** —
  flatten it or shallow it and the width comes back.
- **Origin:** centre of the set's footprint, **floor at height 0** — and this
  is **fixed up on import too**: the model's lowest point is put on the deck,
  its footprint centred left-to-right, and its **downstage face set just
  upstage of the proscenium**, because the deck is y = 0 and the arch is z = 0
  on every stage. Getting it right in the file is still better, but a set
  centred on the origin will no longer arrive half-buried under the stage or
  hanging out over the audience.
- **Facing:** the audience is +Z. Build the set facing you in front view.
- **No lights, no cameras, no animations** in the export. Lighting is the
  rig's job; movement is the wagon's and the flies' job.
- **Floors you can walk on** (the house's floors and stairs, the roof's
  playing deck): name those meshes `walk_` + anything, e.g. `walk_floor1`,
  `walk_stairs`. Everything else is scenery.

## Budgets (the Quest is why — every material is a draw call, twice)

| Budget | Cap | |
|---|---|---|
| Triangles per set | **150,000** | refused above this |
| Materials per set | 8 | refused above this |
| Texture size | 2048 × 2048 | **shrunk on import, not refused** |

**Triangles went 30,000 → 150,000 (RULING BP).** The old number was set before
a single model existed and was conservative for the shape these turned out to
be — one material, one primitive, **one draw call** each. What costs a headset
is draw calls and per-pixel light, not raw triangles, and only one set is on
the deck at a time. Aim at ~100k.

**A texture over 2048 is brought down to 2048 at load rather than refused**,
so a 4096 map the export tool chose for you is not your problem. Do not read
that as "size does not matter": 4096 × 4096 RGBA is 67 MB of GPU memory before
mipmaps, and every set stays resident once struck sets park backstage. Smaller
is still better; it just will not fail the build.

A model over budget is refused at import with a message saying which budget
and by how much. Fewer materials beats fewer triangles: 8 materials at 30k
triangles is far cheaper than 20 materials at 10k.

## The sets, with target sizes

Targets, not straitjackets — but the **height cap is real and now enforced**:
rather than let anything taller than 30 ft get cropped by the portal, the
import shrinks the whole set until it fits (RULING BX). The Width column is
what you get *if* the height and depth allow it.

Measured against what you delivered, that means: the attic and the roof are
limited by their **depth** and land 13.06 m and 12.30 m wide; the three houses
are limited by their **height** and land 9.49 m wide (31 ft) rather than 42 ft.
Flattening the houses — they came out nearly as tall as they are wide, where
this table asks for roughly 42 × 29 — is what would win that width back.

**The File column is the contract**: the import fetches EXACTLY these names
(and the fallback is silent, so a file named anything else would simply never
load). A test pins this list to the game's manifest, both directions.

| Set | File | Width | Height | Depth | Notes |
|---|---|---|---|---|---|
| **The house** (the wagon) | `bj-house-maitland.glb`, `bj-house-deetz.glb`, `bj-house-beetlejuice.glb` | ≤ 42' | **≤ 29'** | ~20' | The big one. It SLIDES on and off, so it must clear the 30' opening with air to spare. **Three WHOLE houses** — architecture and dressing together, one file per state (Maitlands / Deetz / Beetlejuice), which is how you built them (RULING BP). Each replaces the entire interior; the first one to load takes the built-in shell out. Floors and stairs named `walk_*`. |
| **Graveyard** | `bj-graveyard.glb` | ~44' | hills ~16' | ~20' | The hills, the mound, the black tree, crosses, small mausoleums. Do NOT model the sky or the moon — the cloud sky with the cratered moon is a painted drop and is made in-game. |
| **Attic** | `bj-attic.glb` | ~44' | ~26' | ~16' | Two open-front junk sheds either side, slatted junk wall centre with the double doors, the hung rafter fragment. |
| **Closet** | `bj-closet.glb` | ~20' | ~13' | ~10' | The bright pink one, spiral door. |
| **Bedroom** | `bj-bedroom.glb` | ~33' | ~20' | ~13' | Lydia's: purple, bed, doors, picture frames. |
| **Roof** | `bj-roof.glb` | ~44' | ~20' | ~16' | Blue shingle ridge, dormers, brick chimney. If actors stand on it, name that face `walk_roof`. |
| **Netherworld** | `bj-netherworld.glb` | ~44' | ~30' | ~33' | The nested glowing rectangles receding upstage. The in-game version is already close — model it only if you want it better. |
| **The house, from OUTSIDE** | `bj-house-exterior.glb` | ~44' | **≤ 29'** | ~20' | Added after you delivered it (RULING BZ). This page used to say the exterior was not yours to model — RULING AW read the production photograph as a painted cloth, and the in-game version still is one. Your model replaces that cloth in the same scene, so it keeps the whole-group fly-out at 1:14:30 with nothing else touched. It came out nearly as deep and tall as it is wide, so the opening caps it: it lands 8.63 m wide. |

## How your model is routed

The import keeps the show's choreography working by landing your model inside
the same machinery the stand-in used:

- A **whole house** (`bj-house-maitland.glb` etc.) lands in that dressing's
  own group on the wagon and the built-in shell — wall, arch, stairs,
  fireplace — is taken out, so your architecture is the only architecture.
  The other two dressing groups stand; the show goes on choosing between the
  three exactly as it chose between three dressings.
- A **flying set** (attic, closet, bedroom, roof, netherworld) lands inside
  its flyer, so it still travels out through the header on its cue.
- The **graveyard** routes each top-level node by its side of centre:
  negative x rides the stage-right hill (the tree side), positive x — and a
  piece centred at exactly x 0 — the stage-left one (the moon side), unless
  you name a node with a `part_hillR_` / `part_hillL_` prefix, which routes
  it explicitly.
- **Floors stay `walk_*`**: named that, they are standable the moment the set
  is on and stop being standable the moment it goes off.

## Handing one over

Put the `.glb` in the repo's `assets/` folder (or just give me the file and
I'll commit it). Each delivered set is its own PR: scaled, placed, walkables
wired, budgets verified, suites green — and it replaces the built stand-in
inside the same scene group, so it rides the same wagon and the same
choreography with nothing else touched. Until a set arrives, the built
stand-in keeps playing, so the show is never broken while you model.
