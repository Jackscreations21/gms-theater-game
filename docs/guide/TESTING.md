# Testing

jsdom plus the REAL three.js (0.128) with a stubbed `WebGLRenderer`. No
browser, no GPU: the suites catch structure, geometry, state and wiring;
they cannot catch how it LOOKS or how FAST it runs — that's the headset
checklist in HANDOFF.md.

## Commands

```sh
cd tests
npm install       # once — jsdom and three@0.128
npm test          # all 15 suites, exits non-zero if any fail
node real.js      # boots the whole file, expect "fatal": null
```

## The suites

| Suite | Covers |
|---|---|
| `real.js` | the whole file boots |
| `full14.js` | the building (has the pointer-lock/MouseEvent shims) |
| `rooms.js` | portal culling |
| `holes.js` | no gaps in the shell you can see or walk through |
| `crew.js` | the stagehands |
| `smoke.js` | the machines |
| `show.js` | productions, cue stacks, the saved hang |
| `sets.js` | scene changes, the collapsing set, the revolves |
| `arc.js` | the Arc Centre |
| `stages.js` | three stages, one board |
| `legs.js` | goods, including the half legs |
| `warehouse.js` | sheds, doors, carts, slots |
| `orders.js` | supply screens, pallets, rulings C/D/E |
| `build.js` | wood stock, tabbed screen, caps, the save round-trip |
| `vr.js` | WebXR: rig, sticks, desks, ropes, GO, bodies |

All 15 are at `--- failures: 0 ---`. **Keep them there.** Every suite
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
