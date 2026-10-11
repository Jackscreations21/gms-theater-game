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
