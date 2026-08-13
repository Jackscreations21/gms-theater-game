# STATE — 2026-08-13 (past the legs — #172 OPEN)

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## OPEN RIGHT NOW: #172, RULING DI — THE SETS PARK PAST THE LEGS

Branch `bj-past-the-legs`, based on `main` at `05374fc`, **one commit, base
verified `main`, mergeable clean**. Nothing else is open. He has not merged it.

He looked at the DF parks in the headset and said the attic, bedroom and closet
were **still in the wings**; then **"i meant past the physical legs. past the
black curtains"**; then **"there is plenty of room between the fly rail and the
legs to fit all three sets"**. Right all three times.

**DF measured the wrong line.** It sized every park against the PICTURE edge at
6.80. A leg is 5.6m of cloth spanning |x| **6.60 .. 12.20**, so all three parks
started inside the masking — the attic 4.33m deep in it.

**AND THE RAIL WAS NEVER AT −19.2.** CE, CS and DF all quote it and all cite
`p9`, which says `fr ? fr.rail : -D.stageW/2 + 2.8` — and −19.2 is the
**fallback**. The live value is `crewFrame().rail` = `XR + 2.8` = **−30.2**,
because `XR` carries `D.wingSR`. The gap between the legs and the rail is
**18.00m, not 7.00m**. His 13.06m attic fits with 2.94m to spare.

So all three park **stage right, 2.00m past the cloth, one behind another**, and
the attic crosses from stage left — CQ picked that side *because* of the rail
that is not there, and stage left (9.80m past the legs) is the one wing that
cannot hold it.

**The three typed offsets are gone.** `BJ_ATTIC_SIDE`, `BJ_SIDE_ROOM` and
`BJ_CLOSET_BACK` could not place his file and the stand-in at once — the attic
is 13.06 × 10.00 with his model against 10.40 × 9.60 without it, and differently
centred, which is why DF left one 2.00m clear and the other 0.57m. `bjWingPack`
measures each set's own box; `bjApplyModel` packs again when a file lands. Both
cases now land at exactly 2.00m past the cloth.

**Found on the way past:** the **auditorium side wall** is a 1.0 × 22.0 × 32.0
box at x −15.50 reaching **z −1.00**, through the middle of the stage-right wing
— his attic acts at z −0.30 and its old park left it at its acting z, 0.70m
inside the wall. And the VR set menu asked about depth before side, so a park
both in a wing and upstage of the backdrop read as "upstage".

Suites **19/19** before and after; **7 mutations negative-checked**, each proved
present in the BUILT file and proved to have changed it, revert byte-identical.
New probe **`tools/wing.js`**.

**What is still his to answer here:** all three sets now enter from stage right
and stage left is empty. That is a real change to the traffic and it was ours to
make (his words were only "one of the sides"), but he may want the attic back on
its own side — which, past the legs, it cannot be.

## HE DID THE HEADSET RUN, ASKED FOR NINE THINGS, AND ALL NINE ARE BUILT

The first time anybody had looked at any of it. Rulings are at **DH**.

**EVERYTHING IS ON `main`**, at `65de73f`. Verified after the merges: `main`
rebuilds **byte-identical** and the full suite is green on the merged result.

| PR | What | His items |
|---|---|---|
| **#164** | the interval assembles in order; act two keeps its neon (**CZ DA**) | 1, 2 |
| **#165** | his two retimings (**DB DC**) | 7, 8 |
| **#166** | the netherworld shallower, the exterior back (**DD DE**) | 5, 6 |
| **#167** | sets park PAST the wing (**DF**) | 3 |
| **#168** | the record | — |
| **#169** | the gold down, the neon on the black portal (**DG**) | 4 |
| **#170** | the sign gets three positions (**DH**) | 9 |

**SEVEN PRs, SEVEN CLEAN MERGES, NO RECOVERY PR.** Each was based on `main` and
named its dependency in the body — the CLAUDE.md rule, and the lesson of the
#155–#162 round where six stacked PRs collapsed into their own bases and needed
an eighth to land. **Verify the base really is `main` after opening**, every time.

Suites **19/19**. **31 negative checks fired** across the round, every mutation
proved present in the BUILT file *and* proved to have changed it before the
result was read.

Cache-bust for the next headset run: **`?v=26`**.

## WHAT IS LEFT: ANOTHER HEADSET RUN

**Nothing of his is unbuilt.** What has not happened is anybody seeing this
round. The questions, in the order they will bite:

1. **Does the neon read on the black portal?** It came in from ±7.75 to **±7.11**
   and its top went from a rake to **flat at 9.51** — a different shape again from
   the two he has already seen, and **it supersedes his own CY rake** (below).
2. **Does the arch look right with no gold?** Four pieces are hidden for
   Beetlejuice: the moulded band, the goldDk inner, the keystone and its head.
   The ivory wall, the sounding board and the lyre all stay.
3. **Is the netherworld right at 4.42m?** Third number on that constant.
4. ~~**Do the parks read as out of the way?**~~ **ANSWERED, AND HE SAID NO** —
   twice. That is RULING DI and #172: they were standing among the legs, and the
   wing they were being squeezed into was 11m wider than three rulings thought.
   The new question is whether **2.00m past the cloth** reads as stored, and
   whether all three coming from stage right is right.
5. **Is FLOOR / PRE-SHOW / UP the right set of three for the sign**, and does the
   desk row naming the stop read better than a percentage?
6. Carried: the houses at 13.6 × 12.76, `BJ_FILL_MAX` 0.55, `BLIND_POWER` 4.6,
   the house at 0.15, 25 seconds of nothing at the top.

## THE ONE PLACE THIS ROUND ARGUES WITH HIM

**RULING DG turns his own CY rake off.** CY was his correction — *"can you make
it slanted just one way not from the center"* — and it was right about the
**gold**, whose top is a quadratic arch: a straight bar across it must lean one
way or the other, and leaning beats fighting a curve. The black portal's top is
**flat**, so a raked bar would cut diagonally across a horizontal member and the
two legs would come out different heights against a frame whose legs match.

`BJ_NEON_RAKE_ON` puts his lean back — **and it is one line in `p5h` AND one in
`p4`, not one line altogether.** That was measured rather than assumed: flipping
it alone leans the frame and leaves the eight blinders on a flat line, floating
off the bar they are meant to be the light from. RULING CY's own assertion
catches it. The pair is left coupled deliberately.

## WHAT THIS ROUND FOUND THAT NOBODY ASKED ABOUT

- **`tools/parked.js` was lying in three ways at once, and had been trusted for
  two rounds.** It cast from **ONE** eye at (0, 1.35, 12) — the middle of the
  stalls, the kindest seat in the house, when the extreme side seats are what
  look diagonally into the opposite wing. It **aimed at the picture opening**
  rather than at the sets, so it could only find a park by accident. And its
  first surface sampling used **bounding-box corners**, which gave his imported
  houses — ONE merged mesh each — nine sample points with eight in mid-air:
  every ray missed and it printed a confident `0/450 UNSEEN`. Fifty eyes and
  real surface points now.
- **Neither the netherworld's depth nor the exterior's seating was pinned by
  anything.** A 36% depth change and a 1.5m move both passed 19/19.
- **An assertion caught the act-two blackout carrying a changeover.** With Q40
  moved behind Q41 the *blackout* became the first cue to declare
  `scene:'interior'`, so the netherworld vanished and the room appeared while
  the blackout's own one-second fade was still going down.
- **The neon's first cut overhung its own legs.** Running the top bar to the
  portal *header's* full width (14.84) left it 0.31m proud of each leg, so the
  frame measured 7.59 wide against a gold band at 7.75 — 0.16m of daylight for a
  ruling whose whole point is coming in by 0.64m.

## WHAT THE ROUND TAUGHT

- **When a request collides with an existing ruling, the collision is the thing
  to ask about — and I asked one question too late.** Read strictly, "no set
  should be parked in a wing" leaves only the fly tower, so three sets went into
  the air: six of seven flying, inverting his own RULING CE and throwing away
  the CQ/CS side entrances, at a cost of four assertion reversals. He corrected
  it in one sentence. **The empty space was BEHIND the sets, not in front of
  them** — the bedroom cleared the masking by 0.49m with six metres of wing
  standing unused outboard.
- **Establishing what a complaint is NOT can be most of the work.** Fifty eyes
  at ~12,000 rays proved every park already invisible from every seat, so any
  assertion written on visibility would have passed against the very build he
  objected to.
- **A mutation can prove the wrong clause.** Giving the flash cue a `portal`
  field trips the assertion's own *guard* and never reaches the emissive check
  underneath it.
- **A negative check can find a hole in the TEST rather than in the code, twice
  in one round.** The frame check would have *blocked* the rake switch it
  advertises (a fixed ±0.6 window cannot hold a bar whose ends move ±0.887), and
  the sign test never observed the haul mid-travel — so `flyExtraAtStop` reading
  the mover's TARGET instead of its live offset passed everything, and the row
  would have named the place it was heading for the whole way there.
- **A number that falls out of geometry should be measured, not typed.** The
  sign's floor stop is `-min.y` of its own world box, because its foot depends
  on a raked arrow's rotation; re-rake the arrow and the stop follows.
- **`updateHouseWait` splitting an audio field is the whole of CZ.** Act one is
  the CLOCK track, so holding the `stop` with the `play` would have left the
  transport firing act two's cues while the curtain was still flying in.
- **The backtick trap bit three more times and cost nothing**, because
  `probe-lint.js` was run BEFORE the suite each time. The rule is not care, it
  is **run the lint after every probe edit**.

## Still his to decide

- **The cemetery still declares no park** (46.8m parted against a 44m stage),
  and the probe now prices it: **running the hills further does NOT hide it** —
  visibility falls 186 rays → 45 and then RISES again, because `bj:hill`,
  `bj:gate` and `bj:moon` come back into view from the far side. Not a live
  defect: it is switched off outright when struck.
- **The sign's red at GO**, moved to 1:00 with the proscenium's. One line.
- **His files are 181MB and ~70MB is discarded at load.**
- **Which way the neon rakes, if at all** — see the argument above.

## Still owed from earlier rounds

- **RULING BY** — standing on his geometry costs 4.29ms, 38.6% of a 90Hz frame.
- **The graveyard.** He has supplied none and the show OPENS in it until 10:38.
- **Does the join at 4292 sound?**
- **The house floor pool** stays deferred.
- **A park stated as an absolute line** rather than an offset (see CT).
- **A blinder can no longer be carried** (CY). `BLIND_BODY` puts it back.
- `tests/smoke.js` still flakes under full-suite load. Not a regression.
- `pr6.json` in the repo root is still untracked and unruled.

## The park layout after DI (#172, his models — the stand-in packs differently
## and correctly, which is the point)

| set | parks | slot |
|---|---|---|
| interior (his 3 houses) | z −24.78..−11.80, x ±6.80 | **upstage, alone** (CO) |
| attic | x −27.26..−14.20, z −11.80..−1.80 | stage right, **2.00m past the cloth**, first in the queue |
| bedroom | x −22.82..−14.20, z −17.91..−13.30 | stage right, second |
| closet | x −23.22..−14.20, z −24.02..−19.41 | stage right, third |
| house (exterior) | y 10.50..19.40 | **flown** |
| afterlife | y 10.50..19.70 | **flown** |
| roof | y 10.50..19.16 | **flown** |
| cemetery | — | no park; switched off outright |

**Only three sets fly, which is his correction.** All three deck parks are in the
**stage-right** wing now, packed downstage-to-upstage by `bjWingPack` and every
offset measured off the set's own box. Stage left is empty.

**The limits they are packed against**, all read rather than typed: the leg's
outboard edge **LEG_OUT 12.20** (p3), the flyman's rail **crewFrame().rail
−30.20** (not −19.2 — see DI), the stage-right wall **XR −33**, the brick
**PAL_BACK −25.5**, and the auditorium side wall reaching **z −1.00** at x −15.50.

## Feel constants for the headset (one-line retunes)

In `p4` (`buildRig`): `BLIND_POWER` 4.6 / `BLIND_RANK` 0.9, **`BLIND_X` 7.11 and
`BLIND_TOP` 9.51 (DG — on the black portal, flat)**, `BLIND_BODY` false,
`AUDM_POWER` 2.8 / `AUDM_RANK` 0.8, `AUD_LIGHT_RESERVE` 2. **Rank is RULING BC
and load-bearing.**

In `p5j`: `AUD_WANDER_RATE` 1.0, `AUD_RANDOM_RATE` 1.0, `AUD_STROBE_HZ` 9.0,
`AUD_SWEEP_LO` −15 / `AUD_SWEEP_HI` −98.

In `p5h` (the neon, CH/CX amended by **DG**): `BJ_NEON_BAR` 0.34, **`BJ_NEON_Z`
0.42** (+ `BJ.pz` 0.45 = 0.87), **`BJ_NEON_RAKE_ON` false and
`BJ_NEON_RAKE_FALL` 1.775 — the switch that puts his CY lean back; lean
`BLIND_SLANT` in p4 with it**, `BJ_NEON_RAKE` −1, `BJ_NEON_FADE` 1.2,
`BJ_NEON_BLUE` 0x4fa8ff, `BJ_NEON_RED` 0xff1e10, `BJ_NEON_DARK` 0x0d1116.

In `p5h` (the sign, CF/CU and **DH**): `BJ_SIGN_GLOW` 0.95, `BJ_SIGN_LIT` 2.1,
`BJ_SIGN_LAMP_FADE` 2.5, `BJ_SIGN_LAMP_CUT` 0.05, `BJ_SIGN_OUT` 9.0, and the
three stops — **FLOOR (measured, −2.36), PRE-SHOW (0), UP (`BJ_SIGN_OUT`)**.
The floor is derived from the sign's own bounding box, never typed.

In `p5h` (AW–AZ, CE): `BJ_FLY_SPEED` 1.8, `BJ_HILL_SPEED` 2.0 / `BJ_HILL_OUT`
9.5, `BJ_PART_OUT` 10.5, `BJ_TRACK_SPEED` 2.0.

In `p5h` (the traffic plan, CO–CS amended by **DF** and re-cut by **DI**):
**`BJ_ATTIC_SIDE`, `BJ_SIDE_ROOM` and `BJ_CLOSET_BACK` ARE GONE** — a typed
offset cannot place his file and the stand-in at once, which is what DI is
about. What is left to tune is **`BJ_PARK_PAST` 2.00** (how far past the leg
cloth a park stands), **`BJ_WING_Z0` −1.80** (the downstage limit, set by the
auditorium wall at z −1.00) and **`BJ_WING_GAP` 1.50** (between one parked set
and the next). Everything else falls out of `bjWingPack` measuring the boxes.
Still typed and still his: `BJ_THIN` 0.28, `BJ_WAGON_BACK` −10.0.

In `p5h` (the netherworld, **DD**): **`BJ_AFT_DEEP` 0.35**, `BJ_AFT_TUBE` 0.15,
`BJ_AFT_BACK` 0x000000.

In `p2` (CL): `PAL_DEEP` 8.5.  In `p5c`: `SCENE_PARK_SPEED` 2.0.

In `p5i` (BP, BX, CB, CC, CD, CT, **DE**): `BJ_TRI_BUDGET` 150000,
`BJ_MAT_BUDGET` 8, `BJ_TEX_BUDGET` 2048, `BJ_FIT_AIR` 0.30, `BJ_SET_DEPTH`
10.0, `BJ_HOUSE_UPSTAGE` 1.5, **`BJ_EXT_UPSTAGE` 1.5**, `BJ_FILL_MAX` 0.55,
`BJ_FILL_RATE` 1.6, and each manifest entry's `fit` and `thin`.

## Two new engine pieces worth knowing about

- **`PROS_GOLD` / `prosGoldSet(on)`** (p2b) — the four gold pieces of the house
  proscenium, collected rather than reparented (`buildRooms()` sorts
  `world.children` and they are all on `STATIC`). **`showStrike` restores them
  unconditionally**, so no production can leave the building altered and the
  stage swap cannot either.
- **`flyExtras` may carry `stops`** (p5c, RULING DH) — `flyExtraStops`,
  `flyExtraToStop`, `flyExtraAtStop`. Declared and optional: a haul with no
  stops behaves exactly as it did, and one with stops keeps its `inOff`/`outOff`
  so every existing caller is untouched. Buttons are found by **META**
  (`{flyExtra, stop, stopName}`), never by pixel.

## Standing facts

Suite count is **19** (`npm test` in tests/) — `probe-lint.js` runs first and is
a test of the TESTS, not of the game. The patch is 39 channels on every stage.
RULING AV still governs; AO stays repealed; RULING B still holds. RULING BB is
untouched.

**Every timestamp in the Beetlejuice plot is a position in his WHOLE recording.**

**His photographs are never committed.**

## Shelved

**Nothing.** One PR open: **#172 (RULING DI)**, above.
