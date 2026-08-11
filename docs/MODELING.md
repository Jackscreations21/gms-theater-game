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

| Budget | Cap |
|---|---|
| Triangles per set | 30,000 |
| Materials per set | 8 |
| Texture size | 2048 × 2048 max |

A model over budget is refused at import with a message saying which budget
and by how much. Fewer materials beats fewer triangles: 8 materials at 30k
triangles is far cheaper than 20 materials at 10k.

## The sets, with target sizes

Targets, not straitjackets — but the **height cap is real**: anything taller
than 30 ft gets cropped by the portal.

| Set | Width | Height | Depth | Notes |
|---|---|---|---|---|
| **The house** (the wagon) | ≤ 42' | **≤ 29'** | ~20' | The big one. It SLIDES on and off, so it must clear the 30' opening with air to spare. One architecture, three dressings (Maitlands / Deetz / Beetlejuice): either one shell `bj-house.glb` plus three dressing files (`bj-dress-maitland.glb` etc.), or three complete variants — whichever is easier for you. Floors and stairs named `walk_*`. |
| **Graveyard** | ~44' | hills ~16' | ~20' | The hills, the mound, the black tree, crosses, small mausoleums. Do NOT model the sky or the moon — the cloud sky with the cratered moon is a painted drop and is made in-game. |
| **Attic** | ~44' | ~26' | ~16' | Two open-front junk sheds either side, slatted junk wall centre with the double doors, the hung rafter fragment. |
| **Closet** | ~20' | ~13' | ~10' | The bright pink one, spiral door. |
| **Bedroom** | ~33' | ~20' | ~13' | Lydia's: purple, bed, doors, picture frames. |
| **Roof** | ~44' | ~20' | ~16' | Blue shingle ridge, dormers, brick chimney. If actors stand on it, name that face `walk_roof`. |
| **Netherworld** | ~44' | ~30' | ~33' | The nested glowing rectangles receding upstage. The in-game version is already close — model it only if you want it better. |

## Handing one over

Put the `.glb` in the repo's `assets/` folder (or just give me the file and
I'll commit it). Each delivered set is its own PR: scaled, placed, walkables
wired, budgets verified, suites green — and it replaces the built stand-in
inside the same scene group, so it rides the same wagon and the same
choreography with nothing else touched. Until a set arrives, the built
stand-in keeps playing, so the show is never broken while you model.
