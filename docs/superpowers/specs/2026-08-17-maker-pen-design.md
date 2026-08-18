# The Maker Pen — design

**Status:** BINDING. Rulings **FE**–**FW**, continuing the project sequence
(last used: `FD`). Read this before touching `p4d`, `p6e`, `p9b`, or any of
the kind-switches in §9.

**Date:** 2026-08-17. **Base:** `main` at `809dee5` when written; `7b71066`
when this landed, after PR 1 (#218) merged. Suite 21 → 22 with `tests/maker.js`.
Cache-bust `?v=31`, and **nothing in this round has been in a headset.**

---

## 1. What Jack asked for

> add a building featyre like rec rooms building pen. use these wbsites as help

with ten reference URLs, then: *"run everthing via subagents and in parralel
if possible"* and *"merge everything yourself and dont stop till i tell you
to or you finnish"*.

**What was actually readable.** The Circuits handbook and recroom.com/studio
fetched in full. recroom.com/creative had no concrete feature claims. **Six
of the ten could not be read**: every `rec.net` URL fails a TLS handshake
from this machine, the Fandom Maker Pen page returns HTTP 402, forum.rec.net
does not resolve, and the YouTube page yields only its own footer. The pen's
mechanics below come from search results and the Circuits handbook. **If
those six pages contradict a ruling here, the pages win.**

Recorded because it dates the material: recroom.com carries a notice that
**Rec Room shut down on 2026-06-01**. These references describe a closed
product.

### His decisions

| Question | Answer |
|---|---|
| Pen vs the wood build system | **Alongside**, as close to Rec Room as the engine allows |
| Scope | **All of it** — core pen, props, Circuits |
| Reach | Pen objects and wood. **Never the building.** |
| Surface | **VR only** |
| Shape in the codebase | **Bodies + a MAKER layer** |
| Freeze | *"pen objects dont need nails unless you unfreez it"* |
| Carry | **Widen the belt to five holsters** |
| Circuits | Pen objects **+ the theatre**. Not Art-Net. |
| Undo | **Undo and redo**, pen actions only |

---

## 2. Three new parts

| Part | `build.sh` position | What | Headset? |
|---|---|---|---|
| **`p4d`** | after `p4c` | the maker MODEL — shapes, groups, freeze, ink, undo/redo, serialisation | **No** |
| **`p6e`** | after `p5c` | Circuits — chips, ports, wires, the tick, the theatre bridge | **No** |
| **`p9b`** | between `p9` and `pz` | the VR surface — tool, palette, gizmos, create ray | Yes |

**RULING FE — the model is headless, the surface is thin.** The pen is
VR-only and every suite runs in jsdom with no headset and no GPU. `p4d` and
`p6e` hold every decision and are driven directly by tests; `p9b` only maps a
controller onto a call already proved correct. **Checkable rule: `p9b` may
not contain the word `ink`, the word `cap`, or arithmetic on a shape's
dimensions.** If it does, the logic is in the wrong file.

**RULING FF — `p6e` sits after `p5c`, and `build.sh` is never sorted.**
`p6e` needs `SHOWS`, `SHOW` and the cue engine. It therefore follows `p5c`
even though `p6d` precedes it. That is already the house pattern. `p6e`'s
header must say so, or the next reader will tidy it.

---

## 3. The freeze boundary

**RULING FG — frozen is the Maker Pen; unfrozen is wood.**

- **Frozen** (the born state): `b.rest` true, `updateBodies` skips it. Hangs
  where put. No nail, no support, no gravity. In no assembly. `canHang`
  refuses it. The crew cannot see it. The gizmos own it.
- **Unfrozen**: wood with an unusual shape. Falls, settles, takes a nail,
  the hammer pulls it, joins an assembly, the carpenters survey it, the
  gizmos let go.

One question — *is it frozen?* — answers six that would each have needed a
ruling.

**RULING FH — `makerUnfreeze` calls `wakeBodies(venue)` unconditionally**,
first thing. BUILD-SYSTEM names this as the one contract a new feature can
break: anything that can take the ground from under a resting body must wake
it. The failure mode is a plank hanging in mid-air for up to a rota, and it
reads as a physics bug. **Its own assertion.**

**RULING FI — the wood filters widen to *unfrozen build kind*, never to
"any body".** Six sites filter `b.kind !== 'wood'` across the snap, nail and
ghost-target scans (p4c:483, 614, 791, 826, 845, 861). RULING FG requires an
unfrozen pen shape to take a nail, so each widens — but a lantern must not
become nailable as a side effect.

---

## 4. Ink

**RULING FJ — ink is the frame budget, and its numbers are set on hardware.**

Every pen shape is its own draw call for ever: ARCHITECTURE permits merging
only for things that never move, are never grabbed and are never recoloured,
and a pen shape is all three. Ink is two numbers on the palette: a **shape
count** (draw calls) and a **triangle total**. Either at cap refuses the
next shape.

**Both ship deliberately low and are set by a headset run.** The last real
reading was 47ms avg empty against a 13.9ms budget; the DR–DY round that
fixed it has never been measured. RULING FB exists precisely because a
constant sized off a datasheet rather than a measurement was wrong. This
spec will not repeat it.

**RULING FK — a shape never mints geometry.** Seven cached unit primitives
— cube, sphere, cylinder, cone, wedge, torus, plane — scaled per shape,
cached the way `TOOLG`/`SAWG`/`RACKG` are. Exactly as a wood cut re-scales
rather than mints (INVARIANTS).

---

## 5. Phase 1 — the pen core

**RULING FL — the gizmos are move, rotate, scale, clone, delete, colour,
freeze.** Move and rotate snap to configurable increments. The rotation
increment **reuses the 45° carry grid of RULING M** rather than inventing a
second quantiser: `Math.PI/4` is currently a bare literal six times over
(p9:3007–3009, 3071–3073) and is hoisted to one named constant. The
release-time land-square snap at p9:2590 is a different rule and does **not**
follow it. `VR.btnX` stays the free-rotation modifier; no second one.

**RULING FM — undo and redo cover pen actions only.** A bounded stack. It
does not reach wood, the shed, the rig, the rail or the cue stack — an undo
that reached the theatre would be a second competing way to change state
that nothing else in the game knows about.

**RULING FN — the pen carries its own raycaster.** `vrCastWorld` cannot be
reused: it delegates to `pickAll` (p7:527), a curated four-group list, and
`describe` (p7:537) returns null for anything unrecognised — loose `BODIES`
are invisible to it. `layers.disableAll()` and per-mesh `raycast = ()=>{}`
protect a new ray for free. **The pen must not assign `raycast` on scenery
meshes itself** — `sceneParkPick` (p5c:313) guards on the own property.

### The belt

**RULING FO — the fifth holster goes at (+0.24, −0.18) and its `mk()` call
goes LAST.** Zero existing holsters move. Minimum pairwise distance 0.240.

**And the comment above the belt is wrong about what the separation buys.**
It says pairs stay >0.22 apart because 0.22 is the draw radius and first hit
wins. To guarantee a hand inside 0.22 of one holster is never inside 0.22 of
another needs **>0.44**. Only `nailgun`–`hammer` (0.480) clears that today;
the current minimum is 0.264. **Overlapping draw zones already exist and
insertion order silently resolves them.** The comment is corrected to say so,
and the new holster is appended last so it can never steal a draw from a tool
with existing muscle memory. There is provably no position on the current
ring that clears 0.22 from all four — the fifth sits 18cm forward at r=0.30,
where a tape clips on a real belt.

---

## 6. Phase 2 — the props palette

**RULING FP — pen-summoned props serialise through the MAKER layer, not
through `BUILD_KINDS`.**

`buildSerialize` skips every body whose kind is not in `BUILD_KINDS`
(p4c:1206), so a summoned lantern, PA box or stepladder would not survive a
reload — ten minutes of rigging, gone. **The fix is not to widen that gate**,
which is load-bearing for the whole build save. The MAKER layer keeps its own
list of what the pen summoned — kind, pose, colour, frozen — and replays it
through `regBody`/`makeBodyMesh` at load, exactly as `makeSerBody` does. The
build save is untouched.

**RULING FQ — the shelf is a deny-list, and three items are named on it.**

- **BLINDER is not on the shelf.** `BLIND_BODY = false` (p4:476) — it has no
  mesh at all. Summoning one gives an invisible, un-grabbable body.
- **PA BOX is speaker-points-only**, both directions (`canHang`, p4:719).
  The palette filters the point list or every attempt silently returns false.
- **STEPLADDER carries three flags at once**: it is on `NO_HANG`, it is the
  only `WALKABLE` body, and at 3.90m it is a mast. It needs a ground-clearance
  check before it is placed.

**RULING FR — the pen books against the caps itself.** `orderPlace`
(p2m:719) is the only place `BUILD_CAP` 150 and `STOCK_CAP` 24 are enforced,
and the pen bypasses it entirely. `venueBuildCount()` / `venueLooseCount()`
are called before any mint. Without this a pen floods a venue with 200 loose
par cans and nothing stops it.

**RULING FS — any new kind string is named in `makeBodyMesh` AND
`BODY_LABEL`.** An unnamed kind returns a 0.485m profile spot with no throw
(p4:672); a kind that joined `BUILD_KINDS` instead returns a **paint can**
(p4c:117). Two different silent wrong answers depending on which list was
joined.

**The shelf**: profile, fresnel, par, cyc, mover, panel, hmi, soft; PA box,
stepladder, work table; 2x4, 4x8 sheet, paint (one row, ten swatches);
platform; chair/table/crate.

---

## 7. Phase 3 — Circuits

**RULING FT — a chip holds ids, never object references.** `p2k` swaps
`FIXTURES`, `CUES`, `FLY`, `SHOW` and `HOUSE` wholesale on a stage walk. A
chip holding a fixture across a walk points at the parked theatre. Chips hold
channel numbers and lineset ids and resolve through `chan(n)` / `FLY[id-1]`
on every read.

**RULING FU — the runtime takes ONE top-level `artDriving()` hold.**
`setLevel` and `setColorCh` are ungated while every hand control on the board
refuses, so a chip would override a live desk while the operator watches a
dead board move a live rig. The runtime holds the way `stepProgram` holds the
whole script engine — never per-op refusals, which produce one toast per
frame (the documented toast storm, p6:492). RULING EW already names the
half-refusal as worse than either whole answer.

**RULING FV — chips write targets, never positions.** `ls.target` not
`ls.pos`; `f.panT` not `f.pan`; `fade = 0` for anything driven per frame,
because a faded write arms `lvlDur` and `updateFades` carries it for the
whole fade. **`ls.speed` is never written** — `hangGoods` recomputes it from
goods weight.

**RULING FW — the loop-toggling sound names are edge-only.** `Snd.play`
toggles for `wind, rain, crowd, sea, hum, preshow`; per-frame calls flip the
loop sixty times a second. The sound chip goes through `Snd.isLooping` +
`Snd.toggleLoop`.

Also binding on the implementation, from the bridge sweep: `showLoad` is a
demolition, not a setting — never on a repeatable edge. `showCueSeek` must
never be reached from anything the transport calls. `fireCue` arms the
codebase's only wall-clock `setTimeout`.

---

## 8. Prerequisites — two live bugs, fixed before the feature

**PR 1 — the eager-frame save bug.** `p7` runs `init()`, one eager frame,
then `buildLoad()`, and `buildTick` is in that frame. Anything dirtying the
save during construction flushes an empty world over the player's build. The
`_buildLoaded` guard existed only on the unmerged `gms-studio-grids`. A pen
that conjures at boot inherits it. **Opened as #218.**

**PR 2 — the VR tab strip is overflowed and the ARTNET switch is behind it.**
`VR_TABS` has nine entries; the strip starts at 300 and steps 112 with
106-wide boxes, so the ninth (`LIGHTING`, RULING DP) draws at x 1196–1302 on
a **1200**-wide canvas. Its label centres off-canvas at 1249; its hit region
is the 4 pixels from 1196 to 1200 — **about 4.7mm on a 1.42m desk face.** The
comment directly above that loop was written to prevent exactly this for
eight tabs, and a ninth was added without moving the start.

`vrPageLighting` carries the ARTNET row (p9:1049), so **the entire Art-Net
round's VR surface sits behind a 4.7mm target.** Unreported because no part
of that round has ever been in a headset. A tenth tab is impossible until the
strip is re-fitted, so this is also a hard prerequisite for a PEN tab.

---

## 9. What this round does NOT do

- Touch the building. The pen refuses every mesh that is not a pen shape,
  a pen prop, or wood.
- Reach Art-Net. No chip reads a DMX channel this round.
- Ship a desktop surface.
- Merge the paused GMS Studios branches.

---

## 10. Testing

Every assertion negative-checked **by sha** against the pre-change BUILT
file. `p4d` and `p6e` are driven headlessly in a new `tests/maker.js` —
suite count 21 → 22, one line in `tests/run-all.js` (`probe-lint` reads the
directory and sweeps a new file for free). `p9b` is covered through
`tests/vr.js` by placing a controller at a holster and squeezing, the way the
existing belt cases do — they read
`VR.holsters.<key>.getWorldPosition()` rather than hard-coded coordinates, so
the fifth holster does not disturb them.

**Two things to assert that the codebase does not currently assert:**

1. `vrUpdateHold` is a flat `if(kind===…) return;` chain that **falls
   through to the rope branch** (p9:3118). Any new `VR.held.kind` without its
   own branch crashes on `VR.held.rope.ls`. The pen's kind gets a branch
   *before* 3118, and a case proving it.
2. `vrLabel` is a **singleton** shared by `vrHoverWorld`, `vrGunLabel` and
   `vrPaintLabel`, which coordinate by early-returning on each other. The
   pen's label joins that chain or it flickers every frame.
