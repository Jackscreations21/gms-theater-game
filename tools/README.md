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

Characters are distance bands: `#` nearest … `.` furthest, space = nothing hit.
