# Testing

jsdom plus the REAL three.js (0.128) with a stubbed `WebGLRenderer`. No
browser, no GPU: the suites catch structure, geometry, state and wiring;
they cannot catch how it LOOKS or how FAST it runs — that's the headset
checklist in HANDOFF.md.

## Commands

```sh
cd tests
npm install       # once — jsdom and three@0.128
npm test          # all 21 suites, exits non-zero if any fail
node real.js      # boots the whole file, expect "fatal": null
```

## The suites

| Suite | Covers |
|---|---|
| `probe-lint.js` | **the suites themselves** — the three characters that break a probe template. Runs first, before anything boots. |
| `real.js` | the whole file boots |
| `full14.js` | the building (has the pointer-lock/MouseEvent shims) |
| `rooms.js` | portal culling |
| `holes.js` | no gaps in the shell you can see or walk through |
| `crew.js` | the stagehands |
| `smoke.js` | the machines |
| `show.js` | productions, cue stacks, the saved hang |
| `sets.js` | scene changes, the collapsing set, the revolves |
| `arc.js` | the Arc Centre |
| `studios.js` | GMS Studios: the third venue, the four-studios-one-builder box, the two floors and the stair, the empty-by-design rooms, the room cull and the bed leaving the light loop |
| `stages.js` | three stages, one board |
| `legs.js` | goods, including the half legs |
| `warehouse.js` | sheds, doors, carts, slots |
| `orders.js` | supply screens, pallets, rulings C/D/E |
| `build.js` | wood stock, tabbed screen, caps, the save round-trip |
| `vr.js` | WebXR: rig, sticks, desks, ropes, GO, bodies |
| `carp.js` | the carpenters: catalogue, planner, the lead, the build at the mark, the screen |
| `workshop.js` | the workshop round: `mergeParts`, the mesh census budget, and the parts that must never be merged |
| `beetlejuice.js` | the fifth show: RULING AO's interpretation note, the portal inside the house opening, the scene machinery going inert when it is off, and the measured fade times |
| `artnet.js` | Art-Net (RULINGS EL–EV). **Not a probe suite** — it spawns `tools/artnet-relay.js` as a child process on free ports and speaks to it over real UDP and a real WebSocket, because a relay cannot be tested any other way. Plain node, no jsdom. |

All 21 are at `--- failures: 0 ---`. **Keep them there.** Every suite
exits non-zero on failure, including a failure to boot.

## The discipline

- **Failing-test-first**: write the assertion, watch it fail against the
  pre-change build, then fix. Every new assertion must be
  **negative-checked** — verified to fail without the change. A test
  that passes against the broken build is measuring the wrong thing
  (it has happened; see TRAPS.md "Measure the right thing").
- **Suites green before AND after** every change.
- **Seam check for multi-branch work**: before opening PRs from several
  branches, merge them all into a throwaway branch, rebuild, run the
  full suite. Branches that pass alone have failed together twice.
- **Run `node probe-lint.js` before wondering why a suite died at parse time.**
  A backtick anywhere inside a probe template — *including in a comment* — and a
  singly-escaped quote both close or corrupt the template, and the failure points
  at the eval rather than at the line you typed. It is in TRAPS three times; the
  lint is the mechanical sweep, and it runs first in `npm test`.
- Tests that synthesize mouse movement need the `MouseEvent` shim
  (jsdom drops `movementX/Y` — see `full14.js` top), or belong in
  `full14.js`.
- Different branches editing the same test file: give each a DIFFERENT
  insertion anchor (top / middle / end) — zero textual conflicts.

## Probes (`tools/`)

Not pass/fail — they draw ASCII pictures by casting a ray grid
(`audience.js`, `goes-wrong.js`, `arc-foyer.js`, `arc-studio.js`,
`warehouse.js`; see `tools/README.md`). **Write a probe when you cannot
picture it.** Every "it looks wrong" report in this project was found in
seconds once something drew it.
