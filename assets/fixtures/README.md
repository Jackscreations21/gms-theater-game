# assets/fixtures/

Game-ready models of the lighting fixtures on the Hamilton Broadway rig, one GLB per type,
built by `tools/blender/fixtures.py` from `tools/blender/fixtures.json`. **Jack picked every
one** from the candidate sheet (the chooser artifact, 2026-10-11); the picks are recorded in
`docs/HAMILTON-RIG.md`.

## What a file is

- Y-up, metres, origin at the **hang point** (the top of the clamp) for a hung unit, or at the
  **floor** under the base for a floor unit (`colorblast`, `colorblaze-*`, `lycian`, `hazer`, `mini-10`).
- Node tree, each node one mesh: `base` (fixed to the hang point) → `yoke` (rotate about local Y
  to **pan**) → `head` (rotate about local X to **tilt**, pivot at the trunnions) → `lens` (a thin
  disc at the lens centre; its local **−Z points out of the lens**, so `lens.getWorldDirection()`
  is the beam, and its material can be lit as the glow). Single-part units are `head` → `lens`.
- Budgets: ≤ 12k triangles, ≤ 8 materials (most are 2–6k and 2–3). `node tools/fixtures-check.js`
  reads every file's JSON chunk and fails on a broken tree, a budget, or a hang point off the origin.

## `lod/` — the far level

`lod/<name>.glb` is the same fixture cut to **800 triangles a unit** (1,000 for `mac-viper`,
`vl3500`, `glp-x4`, `lycian`), lens included, for the far level of a `THREE.LOD`: same node
names, tree, transforms and materials, the lens disc untouched, the hang (or floor) point pinned
so the collapse cannot move it. `midtown.html` swaps to it past 7 m (world) from the camera; 313
units go from 1.37M triangles to about 0.4M seen from the back of the house. Made by

    blender -b --python tools/blender/fixtures_lod.py -- assets/fixtures assets/fixtures/lod
    node tools/fixtures-check.js assets/fixtures/lod --lod

Rerun it whenever a full model changes. A missing lod file is one console warning; its units
draw full detail at every distance.

## Sources and licences

Seventeen are from **SketchUp 3D Warehouse**, under its General Model License: free to use and
modify inside a larger work, including a commercial one, but the model files may not be
redistributed on their own. One (`vl3500`) is ETC's own Augment3d model from the *Hamilton
Programming Project*, **non-commercial** like the set.

| file | fixture | source model, author |
|---|---|---|
| `source-four.glb` | ETC Source Four (all barrels) | ETC Source Four Leko Spotlight, JoeChaps |
| `s4-par.glb` | ETC Source Four PAR | ETC S4 par, StefPotters |
| `par64.glb` | Altman PAR 64 | PAR64 (Long), Nid |
| `birdie.glb` | MR-16 birdie | PAR CAN Birdie Par 16, Adam A. |
| `stickup.glb` | GAM Stickup (stand-in) | LED Pinspot 2, Allan Reiss |
| `mini-10.glb` | Altman Mini-10 (stand-in) | Border Lights, TheArchitect |
| `mac-viper.glb` | Martin MAC Viper Performance | Martin Mac Viper Profile, Axilum |
| `vl3500.glb` | Vari-Lite VL3500 Wash FX | ETC Augment3d (THPP), non-commercial |
| `glp-x4.glb` | GLP impression X4 XL | GLP Impression X4, Jacob E. |
| `s4-revolution.glb` | ETC Source Four Revolution | ETC Source 4 Revolution (Hung), Jamie V. |
| `colorblast.glb` | Color Kinetics ColorBlast 12 TR | Color Blast 12, Tatsurou S. |
| `colorblaze-48.glb`, `colorblaze-72.glb` | Color Kinetics ColorBlaze 48 / 72 | COLORband PiX-M, Allan Reiss (scaled to 4 ft / 6 ft) |
| `elar-108.glb` | Elation ELAR 108 (stand-in) | Elation seven par 7IP, Ryan D. |
| `pixelpar.glb` | Pixel Range PixelPAR 90 (stand-in) | PAR 64 LED, LDDLS3D |
| `lycian.glb` | Lycian 1290 followspot (stand-in) | Robert Juliat Lancelot, Axilum |
| `hazer.glb` | MDG Atmosphere hazer | MDG Atmosphere APS, LDDLS3D |
| `s4-lustr.glb` | ETC Source Four LED Lustr (ETC training rig only) | ETC LUSTR 3 S4 X8 15-30, Jean V. |
| `colorsource-par.glb` | ETC ColorSource PAR (ETC training rig only) | ETC ColorSource PAR, Oleg Puzankin |

Rebuild: download the sources (`tools/blender/fixtures.json` names them; the 3D Warehouse GLB is
`https://3dwarehouse.sketchup.com/warehouse/v1.0/entities/<id>/binaries/glb?download=true`), export
the VL3500 DAE to GLB with three.js (Blender 5 has no COLLADA importer), then

    blender -b --python tools/blender/fixtures.py -- <source dir> assets/fixtures
    blender -b --python tools/blender/fixtures_sheet.py -- assets/fixtures <png dir>   # colour-coded part check
    node tools/fixtures-check.js
