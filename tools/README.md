# Probes

Not pass/fail — they print pictures. Run them when something *looks* wrong;
every "that's not right" report in this project was found in seconds once
one of these drew it.

    export NODE_PATH=../tests/node_modules      # after npm install in tests/
    node audience.js       what a ray grid from an orchestra seat lands on
    node goes-wrong.js     the Haversham study, before and after it falls down
    node arc-foyer.js      the Arc foyer, from just inside the glass
    node arc-studio.js     the Studio seating, from the stage
    node warehouse.js      both warehouse sheds — the Palace's from its
                           doorway, the Arc's from the main house rear door
    node buildload.js      what a standing build costs per frame — times
                           updateBodies at 0/25/50/100/150 loose pieces
    node census.js         the mesh count of every tool and shed fixture
    node wing.js           how wide a wing REALLY is — the leg edge off the
                           built goods, the rail off crewFrame(), and a sweep
                           of the strip between them
    node draws.js          how many draw calls the EMPTY house submits, per
                           eye, from four named viewpoints — and which blocks
                           are paying for them

Each is ~40 lines of probe on top of the same jsdom harness the tests use.
Copy one and change the eye position to look at something else.

One that measures TIME, and refused a feature:

    node walkcost.js

What it costs to stand on an imported set. RULING BY was going to put the
landed mesh straight onto `WALKABLE`, since his exports name no `walk_` node
and cannot. Measured: **4.29 ms per `groundAt` against his 99k-triangle roof
against 0.0018 ms for the 12-triangle stand-in it replaces** — 38.6% of a 90 Hz
frame, once for the player plus once per settling body, with no early exit
because three.js collects and sorts every intersection. The flag was written,
measured, and taken back out; the number lives here so nobody has to
rediscover it.

Two that measure FILES rather than a view:

    node models.js [--from <dir of his raw Meshy exports>]

What a delivered `.glb` actually does when the real importer lands it. Two
halves on purpose: a container scan straight off the glb bytes (triangles,
materials, texture sizes, stray lights, the raw box — exact, because jsdom
decodes no PNG and anything measured through the loader would be guessing),
then a real import run that serves the files to the actual `loadSetModels`
fetch and measures what lands **in world space against the frame it has to be
seen through**. The second half is the point: the budgets are all about cost,
and nothing else in the repo checks that a fitted set is SEEABLE. It is what
found RULING BX — five sets landing over the audience, three of them a third
taller than the picture — and it reports walkables lost to a file that names
no `walk_` mesh.

One outlier — it measures a video, not the game, so it loads no harness at
all, only ffmpeg (`winget install Gyan.FFmpeg`, then a FRESH shell):

    node video.js <video> [--skip=SECONDS] [--fresh]

What can be read off a recording of a real show: whether the camera is
locked off (everything else depends on that), where the blackouts are, how
long the fades take, and how the acts break. It sorts findings by how much
they can be trusted, because a camera cut looks exactly like a cue. First
run takes a few minutes and caches to the OS temp dir; `--fresh` re-measures.
Nothing from the video is written into the repo — derived numbers only.

Characters are distance bands: `#` nearest … `.` furthest, space = nothing hit.

## `wing.js` — how wide is a wing, really? (RULING DI)

Written because three rulings sized parks against a rail that is not there.
CE, CS and DF all state the flyman's locking rail at **x −19.2** and all three
cite `p9` for it. What `p9` says is `fr ? fr.rail : -D.stageW/2 + 2.8` — and
−19.2 is the **fallback**. There is always a crew frame, and it gives
`XR + 2.8` = **−30.2**, because `D.wingSR` runs stage right 11m further out
than stage left. So the gap between the legs and the rail is **18.00m**, not
7.00m, and a 13.06m set fits in it with room to spare.

It measures rather than argues: the leg edge off the **built** `GOODS.legs`
(one leg, not the pair — measuring the pair gives a box whose |x| min and max
are both the outboard edge, and it printed `0.00m of cloth` on the first run),
the rail off `crewFrame()`, and then rays through the strip between them at
four heights. That sweep is what found the **auditorium side wall** — a
1.0 × 22.0 × 32.0 box at x −15.50 whose upstage face reaches z −1.00, straight
through the middle of the wing, which no park had ever been measured against.

## `draws.js` — what does the empty house submit? (RULING DX)

The 2026-08-14 audit read the empty Palace at **205–310 meshes submitted per eye
= 410–620 GL draw calls a frame** (no multiview: each eye is a full
`projectObject` pass) against a Quest comfort band of roughly 100–200.
Triangles were never the problem. That number lived in a scratchpad script, so
it could not be re-read after a change — and a performance round whose headline
figure cannot be re-measured is a round of opinions. This is it as a probe.

It simulates r128 `projectObject` (three.js r128:17954–18024) faithfully:
`visible === false` prunes the subtree *above* the recursion, `layers.test`
gates the node, a drawable is submitted if `frustumCulled` is false **or** its
geometry bounding sphere transformed by `matrixWorld` hits the frustum, and an
array material pushes **once per geometry group** whose material is visible.

**Two self-checks run before any view is measured, and both throw.** With a
frustum test that always passes, the walk must agree exactly with an
independently written count; with one that always fails, it must submit exactly
the drawables carrying `frustumCulled === false`. The second one caught this
probe's author on the first run — the walk was asking its frustum test about
`frustumCulled` instead of asking above it, which silently under-reports every
InstancedMesh in the building (r128's constructor sets `frustumCulled = false`
on all of them — the bounding-sphere workaround; 15 are visible in the empty
Palace).

Measured on `a55bfcd`, empty Palace, per eye (double it for the frame):

| view | draws/eye | ×2 eyes | tris/eye |
|---|---|---|---|
| boot camera (stalls centre, facing the stage) | **350** | 700 | 130k |
| a stalls seat, facing the stage | 185 | 370 | 118k |
| downstage centre, facing upstage | **321** | 642 | 132k |
| on stage, facing the house | 83 | 166 | 22k |

**And it is not the architecture.** The plan predicted walls, mouldings,
balcony fronts, per-baluster pieces in p2b/p2c/p2e/p2g. Those are already
merged and the merger did its job: 124 separate blocks account for 136 draws
between them, ~1.1 draws a block. It is the **lighting rig** — 39 fixtures,
**476 of the scene's 878 visible drawables (54.2%)**, of which **423 are the
lantern bodies at 10.8 draws each**. (By raw traverse, hidden beams and glows
included, the rig is 540 drawables — mind which denominator you quote.) From
the boot camera the rig is 135 of 350 draws an eye; from downstage centre
facing upstage its block is 158 of 321 (49.2%). The fly system is second at
109. Everything else is noise.

So the next bite is a lantern, not a wall — and a body's ten pieces (barrel,
knobs, colour frame, hook clamp, cable) are not individually addressed. What
*is* addressed and must survive any merge: the body as a whole (a
`BODIES.mesh` — detachable, raycast, hoverable), the **yoke** (pans and tilts)
and the **lens** (recoloured through the `LENSM` cache).

## `deeper.js` — does the Palace hold what slides back into it? (RULING CL)

Every dressing of the interior wagon at its most upstage cue target, as a world
box, against the Palace brick — plus every part mover that travels upstage, and
where the shed and its furniture ended up when the wall moved. Run it both ways:
his house is 12.98m deep and the stand-in 7.68m, so **his model is the binding
case here**, the inverse of the RULING BQ trap.

```sh
export NODE_PATH=../tests/node_modules
node deeper.js                    # his files
PROBE_STANDIN=1 node deeper.js    # the fallback that plays on a fresh clone
```
