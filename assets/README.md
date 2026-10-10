# assets/

Delivered set models go here: `bj-<set>.glb` (and `bj-dress-<dressing>.glb`), modelled to `docs/MODELING.md`.
A missing file is a NORMAL state — the game falls back silently and the built stand-in keeps playing.
Each delivered model lands via its own PR: scaled, placed, walkables wired, budgets verified, suites green.

## Third-party models

`midtown-auditorium.glb` — NOT yet wired into the game. Built from `source/midtown/scene.gltf` by
`tools/blender/midtown_theatre.py` (screen removed, brown proscenium recoloured to the walls' grey,
speakers decimated). Credit, required by its licence:

> This work is based on "Midtown Atlanta Auditorium - Photogrammetry (HD)"
> (https://sketchfab.com/3d-models/midtown-atlanta-auditorium-photogrammetry-hd-b5736d651f6347d8a1e146b1ce0ca1eb)
> by Cody Setchfield (https://sketchfab.com/SMOUSE) licensed under CC-BY-4.0
> (http://creativecommons.org/licenses/by/4.0/)
