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
