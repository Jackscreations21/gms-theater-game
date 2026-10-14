# The Hamilton dance moves (RULING FV)

The move library that `midtown.html` dances. The moves are written out to `tools/hamilton-moves.json`, which the merge
(`tools/blocking-merge.py`) and the editor (`blocking.html`, its **Dance** button) read. The binding rules are in
`docs/superpowers/specs/2026-10-12-automatic-actors-design.md`, ruling FV. The file format (an actor's `moves`) is in
`docs/hamilton-blocking-format.md`.

**A move** is joint angles on the jointed mannequin (FS). They are a pure function of how many beats into the move she is,
on the song's beat grid (`assets/hamilton-beats.json`, made by `tools/beats.html`).

- **COUNTS** is a loop's length in beats, or, for a move played once, how long it takes. Once played, it holds its last shape
  until the entry's own `counts` run out.
- **The entry's `counts`** is how many beats she dances it, whatever the loop's length.
- **Blend.** A move blends in from what she was doing, walking, standing or the move before, in about 0.25 s. It blends back
  out over about 0.3 s after its last count.
- **Moving her.** A move that "moves her" adds a small offset that comes back by its last count. The path still says where
  she is.
- **Mirror** swaps left and right.

## This show's moves

Each one is named for the moment it comes from. The sources are listed at the end.

| move | counts | kind | what it is |
|---|---|---|---|
| `my-shot` | 8 | once, then held | "Just like my country I'm young, scrappy and hungry, and I'm not throwing away my shot": second position, reach out to the people, hand to the heart, the hand flicks out, the boxer's groove, the roundhouse punch, the shot snapped down |
| `legacy` | 8 | once, then held | the My Shot phrase as it returns at "Legacy" at the end of the show: the same, but the shot is thrown UP |
| `equals` | 2 | once, then held | The Schuyler Sisters, "…that all men are created equal": the forearms held level one above the other in front of her — an equals sign |
| `work` | 2 | once, then held | The Schuyler Sisters, "…include women in the sequel. Work!": a hand up (the two fingers), the other on the hip, the hip popped |
| `gavotte` | 4 | loops, moves her a little | Helpless / Satisfied: the formal court dance — upright, up on the toes, one palm raised to her partner's, step and close each way (mirror her partner) |
| `grind` | 2 | loops | Helpless: twenty seconds after the palms touched, "they want to grind" — the hips rolling low, the arms round a partner |
| `rewind` | 4 | loops, runs backwards | Satisfied's rewind: the slow-motion walk run backwards (the slow walk with reverse); travelling, she turns her back to her path |
| `imagine-death` | 8 | once, then held | Yorktown, "I imagined death so much it feels more like a memory": a hand behind the head, a hand across the chest, chin up; a knee up and a punch for "on my feet, enemy ahead of me"; arms crossed for "if this is the end of me" |
| `command` | 4 | once, then held | Yorktown, "weapon in my hand, a command, and boom": the rifle overhead, the forearm across the face, fists up and shoulders squared, the hands on the epaulets |
| `heartbeat` | 2 | loops | Yorktown, thinking of Eliza: a contraction on each "boom" of the heartbeat, then a point to the head |
| `hiphop-march` | 4 | loops | Yorktown, "we gotta go, we gotta get the job done": a hip-hop step like a march — out with the arms wide, the shoulders brushed off, a foot pushed out, down |
| `musket` | 2 | loops | firing a musket that weighs 35 pounds: a wide stance, the back used, aim, and the recoil through the whole body on the beat |
| `upside-down` | 4 | once, then held, lifts a carried prop and turns it over | Yorktown, "the world turned upside down": furniture lifted overhead and turned upside down, held there (a carried prop flips over) |
| `shimmy` | 2 | loops | The Room Where It Happens: Burr's ego mocking him — the Fosse-like upper-body shimmy, knees bent and turned in, jazz hands, the head cocked |
| `jazz-roll` | 4 | loops | The Room Where It Happens' "ooey-gooey jazz": a slow hip roll, the shoulders sliding against it, the hands drifting up and down |
| `hoist` | 2 | once, then held, lifts a carried prop | Hurricane: what she carries hoisted overhead, arms straight up, like the storm lifting it (a carried prop rises with her hands) |
| `crawl-back` | 4 | loops | Hurricane, the "cockroaches": on hands and knees, crawling backward in slow motion (travelling, she turns her back to her path, so she crawls backward along it) |
| `wall-ooze` | 8 | once, then held | The Reynolds Pamphlet, round Angelica: slow motion into an invisible wall, the hit, then oozing down and out of it |
| `bojangles` | 2 | loops | Fred Astaire's "Bojangles of Harlem" (one in front, many behind doing the same): a heel dig forward each beat, the arms swinging, a clap on the "and" of 2 |
| `bullet` | 4 | loops | The World Was Wide Enough, the Bullet: walking in slow motion, one arm out ahead carrying the bullet toward him (one stride every four counts; the path carries her) |
| `row` | 4 | loops | the rowers at Hamilton's death (and the duellists' boats): kneeling, a long stroke — reach forward, pull to the chest, lean back, recover |

## General moves

| move | counts | kind | what it is |
|---|---|---|---|
| `step-touch` | 4 | loops, moves her a little | step right, touch left beside it, step left, touch right |
| `grapevine` | 8 | loops, moves her a little | to the right: side, behind, side, touch; then back to the left |
| `box-step` | 4 | loops, moves her a little | right foot forward, left crosses over, right back, left to the side: a square |
| `sway` | 2 | loops | her weight side to side, arms floating |
| `bounce` | 1 | loops | a pulse: the knees dip on every beat (also "pulse") |
| `clap` | 1 | loops | the hands meet in front of her chest on every beat |
| `point` | 4 | loops | the right arm points up and out on 1, holds, comes down on 4 |
| `lunge` | 4 | loops, moves her a little | the right foot forward into a lunge on 1, held, back on 4 |
| `kneel` | 2 | once, then held | down onto the right knee over two counts, and stay there |
| `rise` | 2 | once, then held | up from a kneel to standing tall, the arms opening up and out |
| `spin-quarter` | 1 | once, then held | a quarter turn to her left on the spot (mirror: to the right) |
| `spin-half` | 2 | once, then held | a half turn on the spot |
| `spin-full` | 2 | once, then held | a full turn on the spot, arms in, then out |
| `reach-up` | 2 | once, then held | both arms up over her head on 1, up on her toes, held |
| `arm-sweep` | 4 | loops | the right arm sweeps from low across her up to high on the right, the body turning with it |
| `salute` | 2 | once, then held | the right hand to her brow, standing tall, held |
| `bow` | 4 | loops | a bow from the waist: down by 2, held, up by 4; one hand across her, one behind |
| `curtsy` | 4 | loops | the right foot slides behind, the knees dip, a little bow; the hands out as if holding a skirt |
| `freeze` | 1 | once, then held | she holds the pose she had on its first count, still as a statue |
| `slow-walk` | 4 | loops | the walk in slow motion on the spot — one stride every four counts (reverse: the "rewind", the walk run backwards) |
| `stomp` | 2 | loops | a knee up on the "and", stamped down on the beat; right then left |
| `jump` | 2 | loops, moves her a little | down on 1, up in the air on the "and", landing on 2 |
| `kick` | 2 | loops | a kick forward with the right leg, then the left |
| `two-step` | 2 | loops | the hip-hop two-step: out to the side and together, right then left, a bounce on every beat |
| `march` | 2 | loops | marching on the spot: the knees up in turn, the arms swinging straight |
| `pulse` | the same as `bounce` | | |

## What the sources say, move by move

- **`my-shot`** — the WSJ video "Choreographing 'Hamilton': The Meaning Behind the Moves" (auto-captions read, and
  frames seen at 70–145 s). Blankenbuehler counts it "six, seven, and…". The order is:
  - *just like my country*: second position, "reaching out as if we're gesturing to all those people over there";
  - *I'm young*: "we lean, hand to heart … almost like a Pledge of Allegiance";
  - *scrappy*: "the hand flips out … like we're flicking paint off our hands";
  - *and hungry*: "a boxing stance … almost like a dance groove";
  - *I'm not throwing away*: "a big roundhouse punch";
  - *my shot*: "we snap it down", meaning he is not going to miss any opportunities. "At the end of the show … we're throwing
    the bullet up in the air". That is `legacy`.

  "This step happens much faster in the show": the page plays it over the 8 counts (two bars) of the music. TheaterMania
  (2016): the phrase "repeats several other times in the show in pieces … in the middle of Right Hand Man … at the very end of
  the show when he says Legacy, what is a legacy?".
- **`imagine-death`, `command`, `heartbeat`, `hiphop-march`** — the WSJ video "'Hamilton' Choreographer Breaks Down His
  Moves" (auto-captions read in full, frames seen). As they march into Yorktown the troops freeze and "bring to life this
  lyric". The shapes:
  - a hand to "the back of my head" (memory);
  - "a knife to my neck and I'm not going to change how I feel" (pride, chin up);
  - "on my feet, enemy ahead of me";
  - the baseball pitch that becomes "my rifle which gets held up over my head";
  - "a command, and boom", which is "the rank, my epaulets, the uniform … the musculature of being totally in charge";
  - the heartbeat when he thinks of Eliza ("a contraction that starts to point to my head");
  - "a hip-hop step that feels like a march", with the clothes brushed off and the foot pushed out.

  The baseball pitch is not built (FUTURE.md).
- **`musket`** — TheaterMania (2016): "you better put your legs wide … and you'd better use your back, because that gun
  still weighs 35 pounds".
- **`shimmy`, `jazz-roll`** — TheaterMania: in The Room Where It Happens the ensemble is "Burr's ego … a burlesque move,
  like an upper-body shimmy, which is sort of a Fosse-esque thing". Dance Magazine (the Hamilfilm list): "delicious,
  ooey-gooey jazz".
- **`gavotte`, `grind`** — TheaterMania: Helpless / Satisfied "a traditional gavotte … the formality of conversation, the
  distance between their bodies. They're only touching with their hands … the first thing they do is just touch palms and
  then about 20 seconds later, they're grinding".
- **`rewind`** — Dance Magazine: in Satisfied "he literally rewinds portions of the choreography from Helpless". The
  research for segment 2 (`tools/blocking/research/seg2.md`): the turntable reverses and the cast moves backward.
- **`equals`, `work`** — Jack's reddit notes. "We hold these truths to be self-evident that all men are created equal: they
  put their arms parallel to each other making an equals sign". On "Work!", "two fingers in the air". The fingers are not
  modelled (the hand is one rigid part), so the hand goes up.
- **`upside-down`** — Jack's reddit notes, on Yorktown: "When they sing 'The world turned upside down' they are picking up
  the furniture and holding it upside-down".
- **`hoist`, `crawl-back`** — Backstage, "Inside the choreographic storytelling of Hamilton". In Hurricane "ensemble
  members swivel around him on a turntable, hoisting furniture overhead as in a storm. Some crawl backward across the stage in
  slow motion — the 'cockroaches' section … the men are crawling backward like cockroaches".
- **`wall-ooze`** — Backstage: as Angelica confronts Hamilton, "all the dancers around her are moving in slow motion — but
  they're hitting a wall, and they kind of ooze out of it".
- **`bojangles`** — TheaterMania: "Fred Astaire does this [dance from a] Bojangles movie musical where he has taps on his
  hands and taps on his feet and then there's 50 of him behind him. And I imitate that a little bit." Which number is not
  sourced, so the move is in the library but not assigned. The staging is one body in front and a block behind, all doing it
  in sync.
- **`bullet`** — Dance Magazine: "the bullet … traverses across the stage toward him in slow motion" (#thebullet, Ariana
  DeBose). The segment 8 research: she takes Burr's bullet and carries it slowly to Hamilton.
- **`row`** — TheaterMania: "the rowers at the end of the show when Hamilton's dying and they're rowing next to him". The
  segment 8 research: two ensemble members mime rowing him across the river on the turntables.

## Path styles: a rule for the generators, not a move

**Burr walks in straight lines; Hamilton walks in arcs.** Burr does not see possibilities; Hamilton sees nothing else.
Sources: Jack's reddit notes, citing the show's book; Hamilton: The Revolution.

The page already walks a path as a curve through walk-through waypoints (FH). So the blocking generators can honour this
with no new field:

- **Burr:** give his legs no walk-through points. Every waypoint is a stop, so he walks straight lines.
- **Hamilton:** give his legs one or two `dwell: 0` waypoints off the straight line, so he walks arcs.

**The Room Where It Happens.** Burr circles the lit circle round the table and does not cross into it until the end, when
nobody is left inside it (the reddit notes). That is also a generator's rule, for segment 5.

The reddit notes also say the three come into the room three times, from different sides, on "dinner", on "the menu, the
venue, the seating", and on "let's go". That has not been checked against the 2-05 blocking.

## Where the moves are assigned (the first pass)

**Generator.** `tools/blocking/dance.py` writes `segments/dance.json`, and the merge folds it into the actors.

**Timing.** Each entry is placed by a cue label's time, moved on by whole bars and snapped to a downbeat.

**Status.** It is a first pass: a reading of the album, not a measurement. Each entry's `note` says what it means to hit.

- **1-03 My Shot:** `my-shot` for the four and the ensemble, 2 bars into each half of each chorus (six times).
- **1-05 The Schuyler Sisters:** `equals` and `work` for the three sisters, on Angelica's declaration.
- **1-08 Right Hand Man:** `my-shot` once, where Hamilton accepts. The placement is a guess.
- **1-10 Helpless:**
  - `gavotte` at the ball, the couples mirrored;
  - `grind` 20 s later.
- **1-11 Satisfied:**
  - `rewind` for everyone on stage through the rewind (cues 366.2 to 366.8);
  - `gavotte` at the ball replayed.
- **1-20 Yorktown:**
  - `my-shot` at the reprise;
  - `imagine-death`, then `command`, then `heartbeat`, then `hiphop-march`;
  - `musket` at the drill and the battle;
  - `upside-down` from "the world turned upside down".

  Nobody carries furniture in Yorktown yet, so the arms go up empty.
- **2-05 The Room Where It Happens:** `shimmy`, then `jazz-roll`, for the ensemble on both choruses.
- **2-13 Hurricane:**
  - `hoist` for the ring in the montage, with nothing carried yet;
  - `crawl-back` for ens2 and ens4 along the downstage edge (seg7's placement).
- **2-14 The Reynolds Pamphlet:** `wall-ooze` for the ensemble, from Angelica's arrival and again as she turns to Eliza.
- **2-22 The World Was Wide Enough:**
  - `bullet` for ens1 from Burr's pistol to the centre;
  - `legacy` for Hamilton at "Legacy" (cue 1248);
  - `row` for ens8 and ens9 beside him after the shot.

## Sources

**Interviews and articles**, mostly from Jack's notes (`Downloads\hamilton choreo info.txt`):
- TheaterMania, "Go Behind Hamilton's Tony-Nominated Choreography With Andy Blankenbuehler" (Bethany Rickwald, 2016-06-08):
  the phrase and where it repeats, the shimmy, Bojangles, the 35-pound gun, the gavotte and grind, and the rowers.
- Backstage, "Inside the choreographic storytelling of Hamilton": the cockroaches, the furniture overhead, and the wall
  round Angelica.
- Dance Magazine, June 2016 cover story (Suzannah Friscia), and its Hamilfilm list: Fosse hands, the soldiers, the
  courtship dance, ooey-gooey jazz, the rewind, and #thebullet.
- Dance Magazine, "Learn a Phrase From Hamilton": the WSJ clips.
- Dance Australia, an interview with Blankenbuehler: his idols (Kelly, Astaire, Jackson, Robbins, Fosse).
- Reddit, "What were some choreography ah-ha moments…" (Jack's notes):
  - the equals sign and "work";
  - Yorktown's upside-down furniture;
  - Burr's straight lines and Hamilton's arcs;
  - the Room's circle;
  - the three entrances;
  - Jefferson moving in time in What'd I Miss.

**Videos read, from their captions and frames:**
- **The WSJ, "'Hamilton' Choreographer Breaks Down His Moves"** — https://www.youtube.com/watch?v=gb67f2HLVGM (4:23).
  Blankenbuehler and Stephanie Klemons teach the Yorktown phrase. The auto-captions were read in full (I imagined death /
  command / heartbeat / the hip-hop march), and frames were seen at 5–257 s.
- **The WSJ, "Choreographing 'Hamilton': The Meaning Behind the Moves"** — https://www.youtube.com/watch?v=VmYTsOrnWP0 (3:14).
  The My Shot phrase, explained and then danced. The auto-captions were read in full, and frames were seen at 70–145 s.

**Videos listed, but only their titles and descriptions were read:**
- **Jack's playlist** "Hamilfilm song clips in actual good quality - [Hamilton HD]" (channel Asaki Takaya):
  https://youtube.com/playlist?list=PLSOfHhku9XxiQuGTppcAc4NPRkja13MSK. It has 36 clips of the Disney+ film, one per song,
  from Aaron Burr, Sir (KAnVd7Fxb0g, the second link in his notes) to Best of Wives and Best of Women. Notable ones:
  - My Shot: wk01z2f5akg
  - The Schuyler Sisters: POHVE9uCNAY
  - Helpless: Or-M9E0C27Q
  - The Room Where It Happens: e_FWUW6SnDo
  - Hurricane: 9rVURq5isnY
  - The Reynolds Pamphlet: x_MQRNkRaUE

  Their only text is the lyrics.
- **Blankenbuehler at #Ham4Ham, 8/3/15** — YMQ5ogjlnUM ("a taste of the moves from the show").
- **"Building Broadway: HAMILTON Choreographer Andy Blankenbuehler"** (Broadway.com) — R49vKv8f0Wc.
- **The Tony Awards, 2016** — Fb4GlOabb1M (History Has Its Eyes On You and Yorktown), e7Zg0qL17zc (The Schuyler Sisters,
  the closing).
- **Beginner Dance Tutorials, "My Shot"** — uJkX2IBkuAY. Its chapters are the 8-counts by lyric: "I'm just like my
  country…", "We're gonna rise up…", "It's time to take a shot…".
- **Sheila Watko, "The Schuyler Sisters" dance tutorial** — R5r3U0dBYD4.
- **Nick Lenz, "Yorktown" (Original Broadway Choreography)** — diewPW1rs-s.
- **Stop Drop And Dance, Yorktown full class** — yZnYXYmGkMQ (it teaches the WSJ phrase above).
- **Gareth Withers, "The Bullet - Hamilton"** — lLJj5ohEcQo.

**Not reached.** The YouTube transcript endpoints are gated. The two WSJ captions were read from the player's own caption
request in the browser.

**Published tempos, for the beat grid:** songbpm.com's pages for the cast album and its instrumentals, and tunebat.com for
Burn.
