# The Hamilton rig — fixtures, counts, and the models Jack picked (2026-10-11)

The equipment list is the real Broadway one, pasted by Jack (`docs/hamilton-equipment-list.txt`,
verbatim). It supersedes the ETC training pack's patch (`Scene/Patch.json`, 445 channels, 15
fixture types), which hangs Lustrs and ColorSource PARs where Broadway has conventionals and
models the ColorBlazes as Chroma-Q Color Force II 12s.

The candidate sheet Jack chose from is the artifact https://claude.ai/artifact/YFMCghYoCM12CRC1NRoaqz
(74 candidates over 18 rows, with pictures and licences; his picks live in its `choices`
collection). The game-ready GLBs are in `assets/fixtures/`, credits in `assets/fixtures/README.md`.

| game file | fixture (Broadway list) | units | pick | tris | notes |
|---|---|---|---|---|---|
| `source-four` | ETC Source Four 14°/19°/26°/36°/50°/70° | 359 | JoeChaps, 3D Warehouse | 4.0k | one body; barrel length per degree is still to do |
| `s4-par` | ETC Source Four PAR VNSP | 44 | StefPotters, 3DW | 3.8k | |
| `par64` | Altman PAR 64 VNSP 1 kW | 52 | Nid, 3DW | 3.8k | straightened 50° to hang level |
| `birdie` | MR-16 birdie VNSP / WFL | 13 + 6 | Adam A., 3DW | 2.0k | source had a 1 m stray bar; clipped to the can |
| `stickup` | GAM Stickup | 13 | Allan Reiss LED pinspot, 3DW | 1.9k | stand-in; no Stik-Up model exists anywhere |
| `mini-10` | Altman Mini-10 1 kW / 300 W | 8 + 10 | TheArchitect borderlight, 3DW | 2.5k | stand-in, scaled to 1.1 m, floor-mounted, lens up |
| `mac-viper` | Martin MAC Viper Performance | 35 | Axilum Viper Profile, 3DW | 10.0k | from 197k; base/yoke/head |
| `vl3500` | Vari-Lite VL3500Q Wash FX | 7 | ETC Augment3d (THPP) | 1.5k | non-commercial; base/yoke/head came named |
| `glp-x4` | GLP impression X4 XL | 26 | Jacob E. X4, 3DW | 6.0k | X4 body, the XL is the same shape larger |
| `s4-revolution` | ETC Source Four Revolution | 7 | Jamie V. (hung), 3DW | 3.7k | |
| `colorblast` | Color Kinetics ColorBlast 12 TR | 56 | Tatsurou S., 3DW | 1.4k | floor base, bracket yoke |
| `colorblaze-48/-72` | Color Kinetics ColorBlaze 48 / 72 TR4 | 5 + 9 | Allan Reiss COLORband, 3DW | 2.5k | stretched to 1.22 / 1.83 m |
| `elar-108` | Elation ELAR 108 LED PAR | 12 | Ryan D. Seven Par, 3DW | 4.4k | stand-in |
| `pixelpar` | Pixel Range PixelPAR 90 | 26 | LDDLS3D PAR 64 LED, 3DW | 3.8k | stand-in |
| `lycian` | Lycian 1290 followspot | 3 | Axilum RJ Lancelot, 3DW | 8.0k | stand-in; Lycian publishes no 3D |
| `hazer` | MDG Atmosphere hazer | 3 | LDDLS3D Atmosphere APS, 3DW | 4.0k | single part |
| `s4-lustr` | (ETC training rig only) S4 LED Lustr 2 | 30 in pack | Jean V. Lustr 3, 3DW | 3.5k | |
| `colorsource-par` | (ETC training rig only) ColorSource PAR | 9 in pack | Oleg Puzankin, 3DW | 3.7k | |

Not modelled (not lights): dimmer racks, opto splitters, switches, SHoW DMX, concentric rings
(an accessory on the X4 XL), side arms.

Where the pack's own fixture models still sit: `Resources/*.dae` inside `working.a3d` inside the
`.esf3d` — MAC Viper Performance, VL3500 Wash FX, Fresnel, PAR 64, ColorSource PAR, Irideon FPZ
(all ~500–1,600 tris with albedo/normal maps). Jack picked the 3D Warehouse Viper and PAR 64 over
them; they remain the fallback.

## The rig file

`assets/hamilton-rig.json` is the ETC pack's own rig — the TRAINING patch, not the Broadway list
above — as one record per physical lighting unit: where it hangs and where it points, in the frame
of `assets/hamilton-set.glb`, and which `assets/fixtures/*.glb` draws it. It is generated, not
hand-edited, and derived from the non-commercial pack (`assets/README.md`). Not yet wired in.

    python -E tools/hamilton-rig.py <THPP Scene dir> assets/hamilton-rig.json

`<Scene dir>` is `Scene/` inside `working.a3d` inside the `.esf3d` (it needs `Patch.json`,
`Fixture.json`, `Primitive.json`; if `Resources/` sits beside it the set's DAE is read too, to
confirm two numbers). Standard library only. The run prints its checks: the transform, the set's
and the rig's extents side by side, the unit arithmetic, a count per type, every hanging position
with its heights, and the scenic elements it skipped.

**The frame** is the GLB exactly as GLTFLoader loads it — metres, Y up, deck y 0 (the set's lowest
point: the pack's 0.229 m floor slab is not in the GLB), **upstage −z, the house +z, stage left
+x**. ETC's world is Z-up with +y upstage, and the pack places the set model at (0, 0.1354,
−0.2651) at scale 0.001; the DAE re-centres depth by 3.8246 m. So ETC (x, y, z) → GLB
(x, z + 0.2651, 3.9600 − y). Check: the pack's turntable (ETC y 2.96) lands at GLB z 1.00, where
`hamilton_set.py` found the revolve centre (+0.95); the arch's front face is GLB z 3.79.

**A record**: `id` (`ch<channel>`, the lowest channel for a batten; hand-placed ones are
`lycian-1`…), `channels`, `label`, `type`, `model`, `hung`, `pos` (the model's ORIGIN — the clamp
for a hung unit, the floor under the base for a floor unit), `quat` [x, y, z, w], `beam` (unit
vector: `quat` applied to the model's rest lens direction), `gel`, `tags` (verbatim), `position`
(inferred: FOH Truss, FOH Electric, Apron Electric, 1st…10th Electric, SL/SR Boom n, Downstage
lip, Back-wall foots, Deck, On the set, Under the gallery), `placed` (`patch` / `by hand`).

**The aim.** The models rest with the beam horizontal (+Z; +X for birdie, hazer, s4-lustr and
vl3500; up for mini-10, down for colorsource-par); ETC's rest is hung, beam straight down. So the
quaternion is built from ETC's beam: `Ry(pan)·Rx(tilt)`, no roll, which is three.js Euler order
`'YXZ'`. Applied whole, the beam is right but the clamp tilts with the body; to keep it on the
pipe, set `root.rotation.y = pan` and `head.rotation.x = tilt` instead (for the four +X models:
`root.rotation.y = pan − 90°`, `head.rotation.z = −tilt`). Movers (mac-viper, vl3500, glp-x4)
get pan only, hanging head-down as modelled, so their `beam` is horizontal; ETC's home for them
is straight down — `head.rotation.x = +90°` (Viper, X4) or `head.rotation.z = −90°` (VL3500).

**Corrections to ETC's positions.** Hung units up to 0.6 m under their electric's pipe (the
Lustrs, 0.05–0.49 m) are raised onto it (8.812 above the deck); deck-level floor units (pack z
−0.26…−0.07) are put at y 0.

**The battens.** The pack's 161 "Color Force II 12" entries are one-foot cells. A straight run of
cells (same depth, height and aim, 0.14–0.17 m apart along x) is one batten; a gap over 0.2 m
starts the next, and two cells at one spot fold together. The pack labels each run's lowest
channel, which agrees with every split. ≥ 1.5 m long → `colorblaze-72`, else `colorblaze-48`:
7 six-foot runs, 4 four-foot runs, and 44 one-foot units (43 lone cells plus ch619's two parts)
that are drawn as 4 ft battens because there is no one-foot model — they are the colorblaze-48
records with one or two channels.

| type | units | from |
|---|---|---|
| `source-four` | 96 | Generic Dimmer (none is labelled PAR) |
| `colorblaze-48` | 48 | Color Force cells: 4 runs of 8, 44 single spots |
| `mac-viper` | 41 | both Viper types |
| `s4-lustr` | 30 | |
| `glp-x4` | 24 | |
| `par64` | 12 | |
| `colorblast` | 11 | |
| `birdie` | 10 | |
| `colorsource-par` | 9 | |
| `s4-par` | 9 | |
| `colorblaze-72` | 7 | Color Force cells: 7 runs of 12 |
| `vl3500` | 6 | |
| `mini-10` | 4 | |
| `lycian` | 3 | by hand: GLB z 23.15 (12 m from the arch after midtown's 0.62), y 4, x 0 / ±4 |
| `hazer` | 3 | by hand: wings x ±9.3, z 1.0, and upstage centre z −6.0, all on the deck |
| **total** | **313** | 445 entries − 32 scenic − 106 cells merged + 6 by hand |

The 32 scenic elements (people, tables, "Stairs SR", "GW on Stairs SL", "Street Lamps") are
skipped; most sit at a placeholder origin (ETC 0, 3.69), so their places are not usable as is.
