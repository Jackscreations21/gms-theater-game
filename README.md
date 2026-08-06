# THE HOUSE

A 3D theatre you *work in*, not just look at. Two venues, three stages, a
lighting rig you can plot, a counterweight fly system you can haul by hand,
four productions that load in and out, a six-person crew that carries them,
and a VR mode for the Quest 3.

The whole game is **one HTML file** — [`the-house.html`](the-house.html)
(~583 KB, three.js r128). No install, no build, no server required for the
desktop version.

## Play it

Download or clone, then open `the-house.html` in a browser. That's it.

For **VR** you need HTTPS — WebXR refuses to start from `file://`. Serve the
file (GitHub Pages works) and open the URL in the headset's browser.

## Controls

| Key | Does |
|---|---|
| `W A S D` + mouse | walk and look (click the canvas to capture the mouse) |
| `Shift` / `L` | run / latch the run on |
| `Space` | jump — or **GO** when the console is focused |
| `V` | toggle walk / orbit camera |
| `1`–`9` | jump to orchestra, balcony, deck, wings, rail, grid, foyer, dock, scene shop |
| `E` | use what you're looking at (doors, consoles, machines) |
| hold `LMB` | haul an unlocked lineset up and down — heavier goods pull slower |
| `Tab` | show / hide the console |
| `B` / `Shift+B` | scene shop bench / blackout |
| `G` | GO the next cue |
| `F` | followspot on you / release |
| `H` | the full operator's manual, in game |

## What's inside

- **Two venues.** The Palace — a 1913 Broadway house with a fly tower,
  loading dock and foyer — and the Arc Centre, a modern glazed complex
  420 m down the road with a Main House and a Studio Theatre. Only the
  venue you're standing in is drawn.
- **Three stages, one board.** One lighting console, one fly rail, one cue
  stack — walking into a theatre patches the board into that room.
- **Four productions.** *The Outsiders*, *The Lost Boys*, *Hamilton* (two
  concentric revolves that turn), and *The Play That Goes Wrong* (seven set
  pieces that collapse under their own weight and can be stood back up).
  All are original interpretations in each show's visual vocabulary — no
  reproduction of anyone's actual designs.
- **A crew.** Six stagehands with a job queue who bring a set in through
  the dock, hang the goods, and strike it again.
- **VR** (Quest 3, auto-detected). Smooth locomotion, five physical
  consoles, ropes at the pin rail you grab and haul, a GO button you press
  with your hand. *Not yet tested on real hardware — exercised only against
  a stubbed WebXR in the test suite.*

## Hacking on it

The game is built by concatenating the parts in [`src/`](src/):

```bash
sh build.sh
```

**The order in `build.sh` is a dependency order — never sort it.**
[`HANDOFF.md`](HANDOFF.md) documents why each part sits where it does, the
coordinate conventions, the invariants, and every trap this codebase has
already fallen into once. Read it before changing anything.

## Tests

Twelve suites run the real three.js under jsdom with a stubbed renderer —
they catch structure, geometry, state and wiring (not looks or speed):

```bash
cd tests
npm install
node real.js     # boots the whole game, expects "fatal": null
node full14.js   # ...and eleven more, see HANDOFF.md §2
```

All twelve pass at `--- failures: 0 ---`. Keep them there.

[`tools/`](tools/) holds **probes** — not pass/fail tests but ray-casting
scripts that print ASCII pictures of what the player would actually see.
Every "it looks wrong" bug in this project was found in seconds once
something drew it. Write a probe when you can't picture it.
