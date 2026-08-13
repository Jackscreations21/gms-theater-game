# STATE — 2026-08-13 (his headset run)

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## HE DID THE HEADSET RUN AND CAME BACK WITH NINE THINGS — rulings CZ–DF

The first time anybody has looked at any of it. Nine items, **seven built and
ALL OF THEM ON `main`, two still to build.** Rulings are at **DF**.

**#164, #165, #166 and #167 are all merged.** Each was based on `main` and named
its dependency in the body, which is the CLAUDE.md rule and the lesson of the
#155–#162 round — four PRs, four clean merges, no recovery PR this time.

| PR | What | His items | State |
|---|---|---|---|
| **#164** | the interval assembles in order; act two keeps its neon (**CZ DA**) | 1, 2 | **merged** |
| **#165** | his two retimings (**DB DC**) | 7, 8 | **merged** |
| **#166** | the netherworld shallower, the exterior back (**DD DE**) | 5, 6 | **merged** |
| **#167** | sets park PAST the wing (**DF**) | 3 | **merged** |
| — | the gold goes, the neon onto the black portal | 4 | **NOT BUILT** |
| — | the sign gets three positions | 9 | **NOT BUILT** |

Suites **19/19** green on every one. **18 negative checks fired**, each mutation
proved present in the BUILT file *and* proved to have changed it before the
result was read. Cache-bust for the next run: **`?v=26`**.

## WHAT IS LEFT — TWO ITEMS, BOTH SPECIFIED

### 1. ITEM 4 — the gold goes, the neon moves onto the black portal

*"just for beetlejuice remove the gold prosinium and put the neon where the
black is right now."*

**HE CONFIRMED WHICH BLACK, so this is not open:** `bj:portal`, the dark board
false portal, **not** the masking legs. Asked and answered with the two
readings drawn out; he also confirmed the blinders follow the neon in, in all
five productions.

Three parts, and the third is the one with a trap in it:

- **p2b `proscenium()`** — the gold has to become findable and hideable. Today
  it is `moulding(pts, 0.26, M.gold, g, 130)` plus a `goldDk` inner, a keystone
  box and its `head` sphere, all pushed to `STATIC` and never named. Give them
  a named sub-group, expose it, hide it for BJ on load and **restore it on
  `showStrike`** — the precedent is `SHOW.offstage` (RULING CN): detach or
  hide, never dispose. **It must not touch the other four productions**, and
  the stage swap must not leave a hidden gold arch on a stage BJ has left.
- **p5h, the frame geometry** (`bj:portalFrame`, ~line 1110). Re-cut to trace
  the portal instead of the gold band:

  | | today (the gold) | wanted (the black portal) |
  |---|---|---|
  | legs x | ±7.75 (`D.procW/2 + 0.25`) | **±7.11** (`BJ.opW/2 + BJ.frame/2`) |
  | top | raked, 10.375 → 8.6 | **flat at y 9.51** (`BJ.opH + BJ.frame/2`) |
  | width | chord across ±7.75 | **14.84** (`BJ.opW + 2*BJ.frame`) |
  | z | `BJ.pz + 0.81` = 1.26 | **`BJ.pz + 0.42`** = 0.87, a hair proud of the portal's 0.70 face |

  Still **no sill** (his own line), still **one merged mesh on one material**
  (`updateNeon`'s per-tube rule does not apply — this is not on `SHOW.neon`),
  still **built dark**.
- **p4 `buildRig`** — `BLIND_X` 7.75 → **7.11**, and `BLIND_SLANT` becomes the
  portal's **flat** top so RULING CY still holds (the light comes out of the
  bar). He confirmed this moves them in all five shows.

**THIS PARTLY REPEALS RULING CX** (*"basically where the gold is"*) — the gold
is going, so "where the gold is" has stopped being a place. **And it supersedes
his own CY rake:** the portal's top is flat, so a raked bar would cut across it
instead of tracing it. Keep `BJ_NEON_RAKE` and `BLIND_RAKE` live as one-line
switches and **say so in the PR** — reversing his own correction on the
strength of a chosen option needs to be visible.

**Assertions to reverse in place** (the AO/AV/BA/BI/BZ precedent, ninth time),
each exemption NAMED rather than the rule loosened:
`the proscenium neon traces the gold, straight-topped and open at the deck (CX)`
— currently asserts ±7.75 and a top at 10.72 — plus the CY rake check and the
blinder-line check. **Measure the BUILT GEOMETRY against the line, never
re-compute the line:** that is the whole CY lesson, where the blinders and
their own assertion carried the same wrong sign and agreed perfectly.

### 2. ITEM 9 — the sign to pre-show, the floor, or all the way up

*"make it so i can make the beeltjuice sign got to pre show postion to the
floor or all the way up."*

`SHOW.flyExtras` (RULING CW) is a **two-state** haul today —
`{key, label, scene, inOff, outOff, speed}` with IN/OUT buttons on the desk
(`p6`, `refreshFlyExtraRows`/`syncFlyExtraRows`) and in the headset (`p9`,
`vrBtnBox` at literal x 790 and 882). It needs **three named stops**:

- **pre-show** — its home in the picture, offset 0
- **the floor** — down onto the deck. **MEASURE IT:** the sign hangs centred
  at y 6.00 and is 8.5m wide; the offset is whatever puts its bottom edge on
  y 0, and that number is not written down anywhere yet.
- **all the way up** — `BJ_SIGN_OUT` 9.0, or higher if 9.0 does not read as
  "all the way" once it is measured against the header.

Keep it **declared** (a show with no `flyExtras` draws exactly what it draws
today — that is what leaves the other four productions alone), and keep the
two-stop form working so nothing else has to change.

**TRAP: `tests/vr.js` pins some fly-page rows by LITERAL PIXEL** and three
buttons will not fit where two did. Prefer `vrHit` META so regions are found by
meaning rather than by pixel — the goods picker already does this and TRAPS says
to prefer it.

## WHAT THIS ROUND FOUND THAT NOBODY ASKED ABOUT

- **`tools/parked.js` was lying in three ways at once, and it had been trusted
  for two rounds.** It cast from **ONE** eye at (0, 1.35, 12) — the middle of
  the stalls, the kindest seat in the house, when the extreme side seats are
  what look diagonally into the opposite wing. It **aimed at the picture
  opening** rather than at the sets, so it could only find a park by accident.
  And its first surface sampling used **bounding-box corners**, which gave his
  imported houses — ONE merged mesh each — exactly nine sample points with
  eight of them in mid-air metres from any geometry: every ray missed and it
  printed a confident `0/450 UNSEEN`. Fifty eyes and real surface points now.
- **Neither the netherworld's depth nor the exterior's seating was pinned by
  anything.** A 36% depth change and a 1.5m move both passed with all nineteen
  suites green. Both have assertions now.
- **An assertion caught the act-two blackout carrying a changeover.** With Q40
  moved behind Q41, the *blackout* became the first cue to declare
  `scene:'interior'`, so the netherworld vanished and the room appeared while
  the blackout's own one-second fade was still going down.

## WHAT THE ROUND TAUGHT

- **When a request collides with an existing ruling, the collision is the thing
  to ask about — and I asked one question too late.** Read strictly, "no set
  should be parked in a wing" leaves only the fly tower, so I moved three sets
  into it: six of seven flying, inverting his own RULING CE and throwing away
  the CQ/CS side entrances. He corrected it in one sentence
  (*"the nether world extirior and roof should be the only things that fly"*,
  *"there is plenty of room for the sets to go"*). Four assertion reversals
  built and reverted. **The empty space was BEHIND the sets, not in front of
  them** — the bedroom cleared the masking by 0.49m with six metres of wing
  standing unused outboard.
- **Establishing what a complaint is NOT can be most of the work.** Fifty eyes
  at ~12,000 rays proved every park already invisible from every seat, so any
  assertion written on visibility would have passed against the very build he
  objected to. He was asking for the wings to be clear, not for a sightline.
- **A mutation can prove the wrong clause.** The first DA-2 check gave the
  flash cue a portal field, which trips the assertion's own guard and never
  reaches the emissive check underneath it. Re-aimed at the mechanism, it fires.
- **`updateHouseWait` splitting an audio field is the whole of CZ.** Act one is
  the CLOCK track, so holding the `stop` along with the `play` would have left
  the transport firing act two's cues while the curtain was still flying in.
- **The backtick trap bit for the sixth time** and `probe-lint.js` caught it in
  five seconds — I had simply not re-run it after editing the probe. The lesson
  is not care, it is **run the lint after every probe edit**.
- **A box has vertices only at its corners, wearing its other hat.** The old
  trap measured nothing BETWEEN the corners; this one aimed at nothing BUT the
  corners.

## Still his to decide

- **The cemetery still declares no park** (46.8m parted against a 44m stage),
  and the probe now prices it: **running the hills further does NOT hide it** —
  visibility falls 186 rays → 45 and then RISES again, because `bj:hill`,
  `bj:gate` and `bj:moon` come back into view from the far side. Not a live
  defect: it is switched off outright when struck.
- **The sign's red at GO**, moved to 1:00 with the proscenium's. One line.
- **His files are 181MB and ~70MB is discarded at load.**
- **The netherworld is the one flown set he never named.** Now 4.42m deep.

## Still owed from earlier rounds

- **RULING BY** — standing on his geometry costs 4.29ms, 38.6% of a 90Hz frame.
- **The graveyard.** He has supplied none and the show OPENS in it until 10:38.
- **Does the join at 4292 sound?**
- **The house floor pool** stays deferred.
- **A park stated as an absolute line** rather than an offset (see CT).
- **A blinder can no longer be carried** (CY). `BLIND_BODY` puts it back.
- `tests/smoke.js` still flakes under full-suite load. Not a regression.
- `pr6.json` in the repo root is still untracked and unruled.

## Feel constants for the headset (one-line retunes)

In `p4` (`buildRig`): `BLIND_POWER` 4.6 / `BLIND_RANK` 0.9, `BLIND_X` **7.75
(→ 7.11 when item 4 lands)**, `BLIND_BODY` false, `AUDM_POWER` 2.8 /
`AUDM_RANK` 0.8, `AUD_LIGHT_RESERVE` 2. **Rank is RULING BC and load-bearing.**

In `p5j`: `AUD_WANDER_RATE` 1.0, `AUD_RANDOM_RATE` 1.0, `AUD_STROBE_HZ` 9.0,
`AUD_SWEEP_LO` −15 / `AUD_SWEEP_HI` −98.

In `p5h` (the neon): `BJ_NEON_BAR` 0.34, `BJ_NEON_Z` **0.81 (→ 0.42 with item
4)**, `BJ_NEON_RAKE` −1 (**superseded by item 4's flat portal top; kept as a
one-line switch**), `BJ_NEON_FADE` 1.2, `BJ_NEON_BLUE` 0x4fa8ff, `BJ_NEON_RED`
0xff1e10, `BJ_NEON_DARK` 0x0d1116.

In `p5h` (the sign): `BJ_SIGN_GLOW` 0.95, `BJ_SIGN_LIT` 2.1,
`BJ_SIGN_LAMP_FADE` 2.5, `BJ_SIGN_LAMP_CUT` 0.05, `BJ_SIGN_OUT` 9.0.

In `p5h` (AW–AZ, CE): `BJ_FLY_SPEED` 1.8, `BJ_HILL_SPEED` 2.0 / `BJ_HILL_OUT`
9.5, `BJ_PART_OUT` 10.5, `BJ_TRACK_SPEED` 2.0.

In `p5h` (the traffic plan, CO–CS amended by **DF**): **`BJ_ATTIC_SIDE` 14.4,
`BJ_SIDE_ROOM` −14.0**, `BJ_CLOSET_BACK` −6.0, `BJ_THIN` 0.28, `BJ_WAGON_BACK`
−10.0. All sized by the STAND-IN as well as by his model.

In `p5h` (the netherworld, **DD**): **`BJ_AFT_DEEP` 0.35**, `BJ_AFT_TUBE` 0.15,
`BJ_AFT_BACK` 0x000000.

In `p2` (CL): `PAL_DEEP` 8.5.  In `p5c`: `SCENE_PARK_SPEED` 2.0.

In `p5i` (BP, BX, CB, CC, CD, CT, **DE**): `BJ_TRI_BUDGET` 150000,
`BJ_MAT_BUDGET` 8, `BJ_TEX_BUDGET` 2048, `BJ_FIT_AIR` 0.30, `BJ_SET_DEPTH`
10.0, `BJ_HOUSE_UPSTAGE` 1.5, **`BJ_EXT_UPSTAGE` 1.5**, `BJ_FILL_MAX` 0.55,
`BJ_FILL_RATE` 1.6, and each manifest entry's `fit` and `thin`.

## The park layout after DF

| set | parks | slot |
|---|---|---|
| interior (his 3 houses) | z −24.78..−11.80, x ±6.80 | **upstage, alone** (CO) |
| attic | x 7.87..20.93 | stage left, 1.07m clear of masking, 1.07m off the wall |
| bedroom | x −18.31..−9.69 | stage right, 2.89m clear, 0.89m off the **locking rail** |
| closet | x −18.51..−9.49, z −6.0 back | stage right behind the bedroom, 2.69m clear |
| house (exterior) | y 10.50..19.40 | **flown** |
| afterlife | y 10.50..19.70 | **flown** |
| roof | y 10.50..19.16 | **flown** |
| cemetery | — | no park; switched off outright |

**Only three sets fly, which is his correction.** Stage right stops at the
locking rail (x −19.2), not at the wall — RULING CE was written because the
wagon had been parked standing on the flyman's working space.

## Standing facts

Suite count is **19** (`npm test` in tests/) — `probe-lint.js` runs first and is
a test of the TESTS, not of the game. The patch is 39 channels on every stage.
RULING AV still governs; AO stays repealed; RULING B still holds. RULING BB is
untouched.

**Every timestamp in the Beetlejuice plot is a position in his WHOLE recording.**

**His photographs are never committed.**

## Shelved

**Nothing.**
