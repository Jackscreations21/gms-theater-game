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
- **Scale: real-world meters** (Blender's default glb export). If you model
  in feet, say so when you hand the file over and it gets scaled on import.
- **Origin:** centre of the set's footprint, **floor at height 0**. The game
  puts the origin on the deck; if your floor is at 0, the set stands on the
  stage.
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

Targets, not straitjackets — but the **height cap is real**: anything taller
than 30 ft gets cropped by the portal.

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
