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
