# The Hamilton dance moves (RULINGS FV and GF)

The move library that `midtown.html` dances: **87 moves**, 47 from the first round (RULING FV) and 40 from the second
(RULING GF, from the reviewers' video evidence). The moves are written out to `tools/hamilton-moves.json`, which the merge
(`tools/blocking-merge.py`) and the editor (`blocking.html`, its **Dance** button) read. The binding rules are in
`docs/superpowers/specs/2026-10-12-automatic-actors-design.md`, rulings FV and GF. The file format (an actor's `moves`,
`with`, a hand prop's `kind` and `item`) is in `docs/hamilton-blocking-format.md`.

No lyric is quoted here. A moment is named by its number, its character, its section and its gesture; the reviewers'
notes (`tools/blocking/research/segN.md`) and the generator (`tools/blocking/dance.py`) give its cue and bar.

**A move** is joint angles on the jointed mannequin (FS). They are a pure function of how many beats into the move she is,
on the song's beat grid (`assets/hamilton-beats.json`, made by `tools/beats.html`).

- **COUNTS** is a loop's length in beats, or, for a move played once, how long it takes. Once played, it holds its last shape
  until the entry's own `counts` run out.
- **The entry's `counts`** is how many beats she dances it, whatever the loop's length.
- **Blend.** A move blends in from what she was doing, walking, standing or the move before, in about 0.25 s. It blends back
  out over about 0.3 s after its last count. A pair move, and `sit`, blend over 0.5 s each way.
- **Moving her.** A move that "moves her" adds a small offset that comes back by its last count. The path still says where
  she is.
- **Mirror** swaps left and right.

**The kinds**, as the tables below name them:

- **once, then held**: played over its counts, then its last shape held to the entry's end;
- **loops**: repeated over its counts for as long as the entry runs;
- **gait**: an overlay on her own walk, keyed to its stride; the path still carries her (standing, the posture keeps time);
- **pair**: two bodies, one entry (`with`, below); `required` must name a partner, `optional` may, and without one she
  dances her half alone.

## This show's moves

Each one is named for the moment it comes from. The sources are listed at the end.

| move | counts | kind | what it is |
|---|---|---|---|
| `my-shot` | 8 | once, then held | My Shot, the chorus's signature phrase, one 8-count from the line naming his country to his vow not to waste his chance: second position, reach out to the people, hand to the heart, the hand flicks out, the boxer's groove, the roundhouse punch, the shot snapped down |
| `legacy` | 8 | once, then held | the My Shot phrase as it returns in Hamilton's last monologue, on his legacy: the same, but the shot is thrown UP |
| `equals` | 2 | once, then held | The Schuyler Sisters, Angelica's declaration in the street (the line she takes from the Declaration of Independence): the forearms held level one above the other in front of her — an equals sign |
| `work` | 2 | once, then held | The Schuyler Sisters, the one-word shout that caps Angelica's declaration: a hand up (the two fingers), the other on the hip, the hip popped |
| `gavotte` | 4 | loops, moves her a little | Helpless / Satisfied: the formal court dance — upright, up on the toes, one palm raised to her partner's, step and close each way (mirror her partner) |
| `grind` | 2 | loops | Helpless: about twenty seconds after the palms touched, the couples grinding — the hips rolling low, the arms round a partner |
| `rewind` | 4 | loops, runs backwards | Satisfied's rewind: the slow-motion walk run backwards (the slow walk with reverse); travelling, she turns her back to her path |
| `imagine-death` | 8 | once, then held | Yorktown, the phrase's first shapes, as Hamilton faces his own death: a hand behind the head, a hand across the chest, chin up; a knee up and a punch toward the enemy; the arms crossed as he wonders whether this is the end |
| `command` | 4 | once, then held | Yorktown, the gun in his hand and the command: the rifle overhead, the forearm across the face, fists up and shoulders squared, the hands on the epaulets |
| `heartbeat` | 2 | loops | Yorktown, thinking of Eliza: a contraction on each pulse of the heartbeat, then a point to the head |
| `hiphop-march` | 4 | loops | Yorktown, the troops' call to move out and finish the job: a hip-hop step like a march — out with the arms wide, the shoulders brushed off, a foot pushed out, down |
| `musket` | 2 | loops | firing a musket that weighs 35 pounds: a wide stance, the back used, aim, and the recoil through the whole body on the beat |
| `upside-down` | 4 | once, then held, lifts a carried prop and turns it over | Yorktown, the company's title phrase after the surrender: furniture lifted overhead and turned upside down, held there (a carried prop flips over) |
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

## Round 2 (RULING GF): forty moves from the video evidence

The third review read the text round the videos (the viewers' timestamped comments under the Disney+ film's clips, the
written staging accounts, Blankenbuehler's interviews) and each segment's reviewer listed the moves the library lacked,
with the stand-in used for each. These forty are those moves. Each one replaced its stand-in where the reviewer placed it
(`dance.py`'s comments say "was …"). Where the sources came from is in "What the sources say", below.

### Hands and arms

| move | counts | kind | what it is |
|---|---|---|---|
| `aim` | 2 | once, then held | a pistol arm levelled at the target straight ahead, the elbow locked, the head down the arm; on 2 the other hand comes up under it to steady it (Burr's book held like a pistol; the duel) |
| `aim-up` | 2 | once, then held | the pistol arm thrown straight up at the sky, the other arm down at her side, the chin up (the duel: Hamilton fires into the air) |
| `point-down` | 2 | once, then held | the right arm thrust down and forward at 45 degrees, pointing at the floor, the left fist on the hip; on 1 |
| `point-fall` | 4 | once, then held, moves her | the point straight at him on 1, held; on 3 the chest caves and she is thrown back half a step as if shot, the arms flung forward and dropping; upright again on 4, half a step back (the opening, as the book changes hands) |
| `beckon` | 2 | loops | the right arm out toward someone at chest height, palm up; the hand curls in on each count, the head tipping toward them |
| `shoo` | 2 | loops | the right hand up at chest height, palm out, flicked outward from the wrist three times over the two counts, the head turned away |
| `air-quotes` | 2 | loops | both hands up beside the face, palms forward, flexed twice on 1 (the quotation marks), held up through 2 |
| `finger-wag` | 1 | loops | the right forearm up in front of her, the finger raised, wagging side to side twice a beat; the left fist on the hip |
| `make-it-rain` | 1 | loops | a stack of pages (or bills) at her chest in the left hand; the right flicks them out and down on every beat; the knees bouncing |
| `angel-wings` | 4 | once, then held | both arms spread wide behind her, a little above the shoulders, wrists leading; they beat twice like wings on 3 and 4, then are held spread (standing behind someone, as her wings) |
| `breath` | 2 | once, then held | a slow breath in: the chest lifts, the chin rises, the shoulders go back and the arms float a little out from her sides |
| `gasp` | 2 | once, then held, moves her | a sharp breath: a hand flies to her mouth and the other to her chest, the body jerks back |
| `handshake` | 4 | once, then held; pair, optional (reach 1.2 m) | the right hand out at waist height, pumped twice from the elbow on 1 and 2, held on 3 and 4 (with: the two meet face to face and their hands join) |
| `coat-on` | 4 | once, then held | into a coat, mimed: the arms back and down behind her into the sleeves on 1 and 2, a shrug of both shoulders on 3, the hands smooth the lapels on 4 |
| `sword-draw` | 4 | once, then held | the right hand crosses to the left hip on 1, draws up and out across her on 2, ends overhead and forward at 45 degrees on 3 |
| `sword-take` | 4 | once, then held; pair, optional (reach 1.2 m) | taking a sword handed over: both hands forward low, palms up, on 1; the right closes on it on 2 and lifts it before her on 3 (with: the partner presents it on both hands, lets it go and bows) |
| `gun-pass` | 2 | once, then held; pair, optional (reach 1.2 m) | a pistol held out at full stretch, handle first, on the right palm with the left hand under it (with: the partner reaches in on 1, takes it by the grip and draws it back to her side on 2) |

### Head and body

| move | counts | kind | what it is |
|---|---|---|---|
| `head-bob` | 1 | loops | the chin drives forward and down on each beat and springs back on the "and", the shoulders loose, the knees giving |
| `head-snap` | 1 | once, then held | the head whips round to her left on the hit and holds there, the body still (mirror: to the right) |
| `laugh-bob` | 1 | loops | laughing: the head thrown back, the shoulders shaking three times a beat, the knees giving with it |
| `chest-pump` | 1 | loops | fists at the breastbone, the elbows back; the chest popped forward on every beat, the knees pulsing under it |
| `shoulder-pop` | 4 | loops | the shoulders pop up in turn on each beat, right, left, right, left; the elbows bent at the waist, a small knee bounce, the head bobbing |
| `tootsie-roll` | 4 | loops | the forearms rolling over each other in front of her on every beat, the knees in and out, the hips rolling side to side over the four |
| `prance-fan` | 4 | loops | a high-knee prance on the balls of the feet, a knee up on every beat, the right hand fanning her face with a flick each count, the left wrist limp (mocking the court) |
| `scrub` | 4 | loops | on both knees, bent low over the floor, both hands scrubbing it side to side |
| `lean-in` | 2 | once, then held | the weight onto the front foot and the torso tipped forward toward someone (or a desk), the feet planted |
| `fold` | 4 | once, then held | folding to the floor: onto both knees, then back on the heels, then the torso down over the knees, the arms on the floor ahead (the passed-out guest, the hit) |
| `hold-side` | 2 | once, then held | wounded: the right hand clutching the left side of the ribs, the torso curled over it, the knees soft |
| `floor-slide` | 4 | once, then held, moves her | down onto the right knee on 1, then sliding 0.8 m to her right along the floor on 2 and 3, the arms swept back (mirror: to the left). In the library, not placed |
| `floor-freestyle` | 8 | loops, moves her | floor work, round and round: down to a crouch, a kick-through to sitting, rolled back onto the shoulders with the legs in the air, and up again |

### Gaits: overlays on her own walk

A gait does not move her: her path does. It changes how she walks it, keyed to the walk's own stride. Standing, the
posture is kept and keeps time to the beat.

| move | counts | kind | what it is |
|---|---|---|---|
| `strut` | 2 | gait, loops | a swagger: chest up and leaning back, the shoulders rolling with each step, a bigger arm swing, the right hand swinging low (Jefferson) |
| `king-walk` | 2 | gait, loops | the King's walk: small quick steps up on the toes, the chin up and the head held still, the hips swaying, the right hand raised with the wrist limp, the left at the waist |
| `old-walk` | 2 | gait, loops | an old man's walk: stooped at the waist, short shuffling steps, a hand on the small of the back, the other on an imaginary cane, the head nodding |
| `moonwalk` | 4 | gait, loops | up on the ball of one foot while the other slides back flat past it, changing feet each count; travelling, she turns her back to her path and glides backward along it; standing, she slides back 0.25 m a count for three counts and glides back to her mark on 4 |

### Seated

| move | counts | kind | what it is |
|---|---|---|---|
| `sit` | 1 | once, then held, moves her | sitting on the chair, bench, stool or box nearest her as the move starts (the rule below), facing its front; the thighs level, the feet forward, the hands on the thighs |
| `comfort` | 2 | once, then held; pair, required, lead only (reach 1.2 m) | comforting someone seated: she stands close behind or beside her, one hand on her near shoulder, the head bowed (with: the seated one, who keeps her own `sit`) |

### Two bodies

| move | counts | kind | what it is |
|---|---|---|---|
| `lift` | 4 | once, then held; pair, required (reach 1.2 m) | the lead lifts the mate: a dip, then hands at her waist carry her 0.5 m up by 2, the lead's arms up under her, her legs trailing behind and her arms up; held, and down again over the entry's last count |
| `catch` | 4 | once, then held; pair, required (reach 1.2 m) | the mate pitches forward, straight from her feet, the head and arms hanging; the lead behind her catches her round the waist by 2, leaning in after her; held, and drawn back upright over the entry's last count |
| `partner-lift` | 4 | once, then held; pair, required (reach 1.2 m) | a ballroom lift: the lead's hands at the mate's waist, she rises 0.55 m and turns a quarter in the air, one leg stretched behind, the other bent, the arms out; held, and down over the entry's last count |
| `sabre` | 4 | loops; pair, optional (reach 2 m) | swordplay: a fencing lunge with the right arm thrust forward on 1, recovered, then a parry across the body on 3, the free arm up behind (with: the partner runs the same loop two counts later, so her parry meets the thrust and her thrust meets the parry) |

## Pairs (`with`)

A two-body move is ONE entry, written on the LEAD's moves with `with: "<the partner's id>"`. The partner (the mate) has no
entry for it: the page poses her from the lead's.

- **The lead is the one doing the verb:** the lifter (`lift`, `partner-lift`), the catcher (`catch`), the comforter
  (`comfort`), the giver in `gun-pass`, the taker in `sword-take`, the one who offers her hand in `handshake`, the first to
  thrust in `sabre`.
- **Where they stand.** From both paths at the move's time, each body slides half the gap's excess toward the other (the
  excess over the move's own gap, 0.34–1.3 m), at most 0.6 m; two too close are pushed apart, up to 0.3 m. Both turn to face.
  `catch`'s mate turns her back to the lead (he is behind her). `comfort` is lead-only: the comforter takes the whole slide,
  and the seated one stays on her seat. The paths are not changed; the slide comes back as the move blends out.
- **Timing.** A pair move blends in and out over 0.5 s (`lift`, `catch`, `partner-lift` out over 0.6 s). The held shape of
  a lift or a catch comes down over the entry's last count, so an entry longer than its four counts holds it longer.
- **One lead, one mate.** A move lifted by three is written with one lifter (2-22: ens6 lifts the Bullet; the rest of the
  knot keep `hoist` under her).
- **The check** (`MIDTOWN.actors.check()`) reports as problems: a `pair: "required"` move with no `with`; a `with` naming no
  other actor; a mate not on stage when the move starts (she dances it alone). A `with` on a move with no `pair` is a
  warning. The merge's own errors and warnings for `with` are in the format doc ("Pair moves").
- **The editor.** Simple mode's Dance picker marks a pair move ⇄ and then asks who it is with (the format doc, "Dance").

## Seated

`sit` puts her on a seat; it is a move like any other, played once and held for the entry's counts.

- **The seat.** At the move's first beat, the placed, visible chair, bench, stool or box nearest her, within 0.8 m of its
  nearest point (along a bench, the spot nearest her, 0.15 m in from its ends). Of two about as near (within 0.1 m), the one
  BEHIND her: she sits back onto it, not forward onto the one she faces. A carried seat does not count.
- **How she sits.** Her hips 0.04 m behind the seat's point, facing its front, at the seat's height: a chair's seat (the
  lower of 0.46 m and 0.52 of its height), or the top of a bench, stool or box. The pelvis drop is measured off the rig's own
  mesh (the back of the thigh, 0.11 m below the hip joint). With no seat in reach she sits where she stands at chair height
  (0.46 m), on nothing.
- **Getting up.** The `sit` ends where its counts end (`until=` in the generator: when the blocking has her get up).
- **A move overrides a sit, and the sit does not come back.** A seated body that stands for something (a roar, a mic drop)
  is given `sit` again after it. An upper-body move on a seated body (a seated layer) is NOT built, so two seated actions are
  HELD, commented in `dance.py`: the 2-02 cabinet's heads nodding through each verse (`head-bob`), and the King jamming on
  his stool in 2-11 (`bounce`). They go back when the page can lay a move on a seated body.
- **Not seated** (no seat prop there in the blocking): Burr in 1-02 and 2-13, Jefferson on the 2-14 desk, the rowers, the
  2-03 piano.

## Hand props

A prop of `kind: "hand"` (a book, a quill, a letter, a pistol, a sword, a glass: its `item`) rides in the carrier's RIGHT
hand, set from her hand bone after the moves have posed her, and her arm is NOT put in the carry pose: she dances as she
would empty-handed, and the prop follows the hand (a pistol's barrel and a sword's blade out along the fingers, a book or a
letter flat along them, a glass upright). So `aim` with a pistol in her hand points the pistol, and `make-it-rain` throws
from wherever the hand is. Today the two books (`burr-book`, `schuyler-book`) are the only hand props in the blocking. The
format, the six items and their sizes, and how the editor and the plotter draw one are in `docs/hamilton-blocking-format.md`
("Hand props").

## What the sources say, move by move

### Round 1 (RULING FV)

- **`my-shot`** — the WSJ video "Choreographing 'Hamilton': The Meaning Behind the Moves" (auto-captions read, and
  frames seen at 70–145 s). Blankenbuehler counts it "six, seven, and…". The order, one shape to each group of words:
  - on the line naming his country: second position, "reaching out as if we're gesturing to all those people over there";
  - on his first boast: "we lean, hand to heart … almost like a Pledge of Allegiance";
  - on the second: "the hand flips out … like we're flicking paint off our hands";
  - on the third: "a boxing stance … almost like a dance groove";
  - on his refusal: "a big roundhouse punch";
  - on the title word: "we snap it down", meaning he is not going to miss any opportunities. At the end of the show, he
    says, "we're throwing the bullet up in the air". That is `legacy`.

  "This step happens much faster in the show": the page plays it over the 8 counts (two bars) of the music. TheaterMania
  (2016): the phrase "repeats several other times in the show in pieces": in the middle of Right Hand Man, and at the very
  end, in Hamilton's monologue on his legacy.
- **`imagine-death`, `command`, `heartbeat`, `hiphop-march`** — the WSJ video "'Hamilton' Choreographer Breaks Down His
  Moves" (auto-captions read in full, frames seen). As they march into Yorktown the troops freeze and "bring to life this
  lyric". The shapes:
  - a hand to "the back of my head" (memory);
  - "a knife to my neck" (pride, chin up);
  - a knee up and a punch, the enemy ahead;
  - the baseball pitch that becomes "my rifle which gets held up over my head";
  - the command, which is "the rank, my epaulets, the uniform" and "the musculature of being totally in charge";
  - the heartbeat when he thinks of Eliza ("a contraction that starts to point to my head");
  - "a hip-hop step that feels like a march", with the clothes brushed off and the foot pushed out.

  The baseball pitch is not built (FUTURE.md).
- **`musket`** — TheaterMania (2016): "you better put your legs wide … and you'd better use your back", because the gun
  still weighs 35 pounds.
- **`shimmy`, `jazz-roll`** — TheaterMania: in The Room Where It Happens the ensemble is Burr's ego, "a burlesque move,
  like an upper-body shimmy", "sort of a Fosse-esque thing". Dance Magazine (the Hamilfilm list): "delicious, ooey-gooey
  jazz".
- **`gavotte`, `grind`** — TheaterMania: Helpless / Satisfied is "a traditional gavotte", the formality of conversation and
  the distance between their bodies; "they're only touching with their hands". The first thing they do is touch palms, and
  "about 20 seconds later, they're grinding".
- **`rewind`** — Dance Magazine: in Satisfied "he literally rewinds portions of the choreography from Helpless". The
  research for segment 2 (`tools/blocking/research/seg2.md`): the turntable reverses and the cast moves backward.
- **`equals`, `work`** — Jack's reddit notes. On Angelica's line from the Declaration, "they put their arms parallel to each
  other making an equals sign"; on the shout that follows her line about women, "two fingers in the air". The fingers are
  not modelled (the hand is one rigid part), so the hand goes up.
- **`upside-down`** — Jack's reddit notes, on Yorktown: as the company sings the title phrase "they are picking up the
  furniture and holding it upside-down".
- **`hoist`, `crawl-back`** — Backstage, "Inside the choreographic storytelling of Hamilton". In Hurricane "ensemble
  members swivel around him on a turntable, hoisting furniture overhead as in a storm". Some crawl backward across the stage
  in slow motion: "the men are crawling backward like cockroaches".
- **`wall-ooze`** — Backstage: as Angelica confronts Hamilton, the dancers round her are in slow motion, "but they're
  hitting a wall, and they kind of ooze out of it".
- **`bojangles`** — TheaterMania: Fred Astaire's Bojangles number, with taps on his hands and feet "and then there's 50 of
  him behind him. And I imitate that a little bit." Round 1 had no source for the number. Round 2 found it: Blankenbuehler
  at #Ham4Ham (Aug 2015, ZJVc88LbZrA) dances "the ensemble part of the bridge" of The Room Where It Happens as his imitation
  of the Astaire film (seg5.md Review 3), and it is placed there.
- **`bullet`** — Dance Magazine: the bullet "traverses across the stage toward him in slow motion" (#thebullet, Ariana
  DeBose). The segment 8 research: she takes Burr's bullet and carries it slowly to Hamilton.
- **`row`** — TheaterMania: "the rowers at the end of the show when Hamilton's dying". The segment 8 research: two ensemble
  members mime rowing him across the river on the turntables.

### Round 2 (RULING GF)

Each reviewer's `## Review 3 (video evidence)` section in `tools/blocking/research/segN.md` has the sources in a table
(the video or page, what text was read, what it settled). Nobody could watch a video: the text read was each clip's
title, description and top comments (YouTube's own comment endpoint), and captions where the player gave them. A comment's
timestamp was lined up with the album by the clip's own landmarks. Most of the moves below come from those comments;
the rest from the written staging accounts and Blankenbuehler's interviews.

- **`point-fall`, `breath`, `coat-on`** (1-01; seg1.md Review 3) — viewers of Disney's official "Alexander Hamilton" Clip 2
  (CurgvjZ7hcM): Eliza puts on his coat, Angelica hands him the book, and "when she takes the book all the ensemble point
  and fall back", foreshadowing his death. The breath is Jack's reddit notes: "all the company inhale close to in-sync"
  before the last word of the women's line.
- **`angel-wings`, `old-walk`, `handshake`** (1-05; seg1.md) — viewers of the Schuyler Sisters clip (POHVE9uCNAY): Burr's
  "angel wings" behind Peggy at her last name (2:48); the "ensemble's grandpa walk" as the city comes on (0:09); Lafayette
  and Mulligan's "secret handshake on the railing" (1:23).
- **`sword-draw`** (1-08; seg2.md) — viewers of the Right Hand Man clip (FmnDhbCd3N4): Washington draws his sword at the end.
- **`shoulder-pop`, `tootsie-roll`** (1-10, 1-11; seg2.md) — viewers of the Helpless clip (Or-M9E0C27Q): Peggy's little
  dance with a letter in her hand (1:43–1:45), Hamilton's celebration dance after the blessing (2:28–2:31) with Eliza copying
  it in the back (2:30); the side-by-side of the ball and Satisfied (wD2LdRGyhwY): Peggy's dance is the same in both songs.
- **`lift`, `floor-slide`** (seg2.md) — the hamilton-lyrics staging write-up: the men lift the women in Helpless, and lift
  them backwards in Satisfied; a comment on the rewind: one ensemble man slides in a circle on the floor round Angelica. No
  time or body is given for either, so neither is placed there. `lift` is placed in 2-22 (below).
- **`fold`** (1-12; seg3.md) — viewers of the Story of Tonight (Reprise) clip (e4NAz2TWA4I): the two passed-out wedding
  guests, one helping the other up at the end. And 2-22 (seg8.md): Hamilton folds when hit (the hamilton-lyrics account).
- **`aim`** — 1-14 (seg3.md): viewers of the Stay Alive clip (pd3L7mI19q8), Hamilton's "small arm movement" on the vocal gun
  (0:58). 2-05 (seg5.md): Burr's "finger gun" in the Room clip (e_FWUW6SnDo, 1:00). 2-13 (seg7.md): viewers of the Hurricane
  clip (9rVURq5isnY), Burr "looming up in the foreground" holding his book like a pistol (2:02–2:03). 2-22 (seg8.md): Burr's
  aim from the fire command (hamilton-lyrics; PBS's "Embodying the Bullet": the Bullet takes the shot at his pistol).
- **`head-snap`, `gun-pass`** (1-15; seg3.md) — viewers of the Ten Duel Commandments clip (TW3-3Xy0kCo): "the little head
  snap the ensemble and Charles Lee do" (0:14); the seconds pass the gun, and the two spin round (0:39–0:41).
- **`sit`, `comfort`** (seg3.md and every segment) — the seated staging is the blocking's own (the reviewers' chairs and
  benches, each a prop). 1-17: viewers of That Would Be Enough (KghsrSY10fo), "he's sitting there" (1:21), and cue 490
  "Hamilton (seated)"; the reviewer read Eliza's comfort from the scene and the pool on the couple (cue 491). Others: the
  Dear Theodosia clip (GgxPJRN_LVI, the two "sitting as if having an earnest conversation"), I Know Him (the King's stool),
  Your Obedient Servant (Hamilton "needed his own chair"), Best of Wives (he "sits in a chair writing").
- **`coat-on`, `sword-take`, `handshake`** (1-18 to 1-20; seg4.md) — viewers of the Guns and Ships clip (0D3zz6byFT4):
  Eliza gives him his coat on the gallery. Viewers of the History Has Its Eyes on You clip (ws_pklV1cP8, three comments) and a
  reaction video (Kodkbh1MbEY, "the passing of the sword"): Washington gives Hamilton a sword. CinemaBlend's "20 Background
  Details" (OAMOh17f7FU) and MsMojo's two lists: the Bullet shakes Laurens' hand in Yorktown.
- **`scrub`, `strut`, `moonwalk`, `laugh-bob`, `partner-lift`, `handshake`** (2-01; seg5.md) — viewers of the What'd I Miss
  clip (t8xQU1hkYao): Jefferson "moonwalking" (1:40), his strut (2:56), an ensemble lift at 3:14 (a viewer: the dancer tore a
  tendon doing it), Jefferson laughing off Hamilton's handshake (3:38). The scrubbing company as Jefferson comes down the
  stairs: WatchMojo's hidden details and ironinkpen's Act II notes.
- **`prance-fan`, `laugh-bob`** (2-02; seg5.md) — viewers of a Cabinet Battle #1 excerpt (dEUBn4VJNr8): "the prancing and
  fanning at 1:29", Hamilton mocking Jefferson's dance moves (TVLine); Jefferson's laugh on the gloat (the head moves in
  Jack's notes belong to this number). In 2-14 the King's prancing fan is the segment 7 generator's staging (dancing,
  fanning himself with a pamphlet).
- **`point-down`, `beckon`, `chest-pump`** (2-04, 2-05; seg5.md) — the gallery company pointing down at Hamilton on the
  refusals (the reviewer's reading; was `point`, which points up); Burr "points at the ground" on the last click
  (ironinkpen). Viewers of the Room clip: Madison motions Hamilton to come, the same way both times (0:40, 2:57); Burr pumps
  his chest in his build (4:34; the Press Herald's "chest pops").
- **`lean-in`** — 2-07 (seg6.md): the head in the basket (ironinkpen, hamilton-lyrics: he mimes pulling the head out and
  being it), built of `point-down`, `point` and `lean-in`. 2-20 (seg8.md): the ensemble leans toward the two men (the
  film's editor; the staging accounts).
- **`head-bob`, `finger-wag`** (2-08; seg6.md) — viewers of the Washington on Your Side clip (o0uncfmN_cM): Jefferson's head
  bob "right on the downbeat"; Madison wagging a finger in "the walk".
- **`king-walk`, `shoo`, `air-quotes`** (2-09, 2-10; seg6.md) — Jonathan Groff teaching his King's walk (03IpD4QWPgQ,
  captions): one foot in front of the other, as on a tightrope, the head level under the crown. Viewers of the I Know Him
  clip (FAgwoLO0S-4): "that catwalk", "that hand wave". ironinkpen and hamilton-lyrics: the King's finger quotes.
- **`make-it-rain`, `floor-freestyle`** (2-14; seg7.md) — viewers of ClownOwO's Reynolds Pamphlet compilation
  (LMaM6godYSk): the ensemble improvise; Jefferson bouncing on the desk making it rain; one dancer on the floor ("the worm",
  "rolling in the pages like a pool").
- **`catch`** (2-18; seg8.md) — the film's editor, Jonah Moran (ProVideo Coalition, "Art of the Cut"): in It's Quiet Uptown
  the women lean forward and the men catch them and pull them back, and the company's rotation reverses.
- **`hold-side`** (2-20; seg8.md) — viewers of the Your Obedient Servant clip (V6_qvZFRlJQ): the Charles Lee actor "comes out
  holding his side" (1:01).
- **`aim-up`, `sabre`, `lift`** (2-22; seg8.md) — the hamilton-lyrics staging account: Hamilton aims upward, away from Burr;
  Washington "swordfighting the air"; the knot lifts the Bullet at his mother. Blankenbuehler (Broadway Direct, 2020):
  "every cast member joins her to help slow down the bullet".
- **`gasp`** (2-23; seg8.md) — viewers of the official audio upload (ppXigfLHZog): Eliza's gasp, "her hands to her heart".

## Path styles: a rule for the generators, not a move

**Burr walks in straight lines; Hamilton walks in arcs.** Burr does not see possibilities; Hamilton sees nothing else.
Sources: Jack's reddit notes, citing the show's book; Hamilton: The Revolution.

The page already walks a path as a curve through walk-through waypoints (FH). So the blocking generators can honour this
with no new field:

- **Burr:** give his legs no walk-through points. Every waypoint is a stop, so he walks straight lines.
- **Hamilton:** give his legs one or two `dwell: 0` waypoints off the straight line, so he walks arcs.

**The Room Where It Happens.** Burr circles the lit circle round the table and does not cross into it until the end, when
nobody is left inside it (the reddit notes). That is also a generator's rule, for segment 5.

The reddit notes also say the three come into the room three times, from different sides, on three of the song's early
lines. Review 3 staged the three entries (seg5.md: the same walk into the room each time, from three points of view).

## Where the moves are assigned

**Generator.** `tools/blocking/dance.py` writes `segments/dance.json`, and the merge folds it into the actors.

**Timing.** Each entry is placed by a cue label's time, moved on by whole bars and snapped to a downbeat, or by a bar and
beat named outright. Since GF, 1-03 and 1-18 are re-gridded (the format doc, "The beat grid"): My Shot's phrases start on
beat 1 of bars 31, 35, 67, 71 and 115, and every 1-18 entry that round 1 put on "beat 3" is now on beat 1.

**Status.** A reading of the album and of the video evidence, not a measurement. Each entry's `note` says what it means to
hit and cites its source (`research/segN.md` Review 3 for round 2). Round 2 took the file from 177 entries to 260, and
from 859 moves on bodies to 974, on 20 actors: 13 pairs and 46 `sit`s.

### The first pass (round 1)

- **1-03 My Shot:** `my-shot` for the four and the ensemble on the choruses (five times since review 3: the last chorus has
  the phrase once).
- **1-05 The Schuyler Sisters:** `equals` and `work` for the three sisters, on Angelica's declaration.
- **1-08 Right Hand Man:** `my-shot` once, for the company, just after Washington's offer.
- **1-10 Helpless:**
  - `gavotte` at the ball, the couples mirrored;
  - `grind` on the bar the lyric names.
- **1-11 Satisfied:**
  - `rewind` for everyone on stage through the rewind, except Angelica and Laurens;
  - `gavotte` and `grind` where the replay mirrors the ball and Helpless.
- **1-20 Yorktown:**
  - `my-shot` at the reprise;
  - `imagine-death`, then `command`, then `heartbeat`, then `hiphop-march`, for the troops;
  - `musket` at the drill and the battle;
  - `upside-down` on the company's title phrase, the furniture carried on for it.
- **1-23 Non-Stop:** `my-shot` for Hamilton on his last chorus line (cue 665), the whole phrase in one bar.
- **2-05 The Room Where It Happens:** `shimmy`, then `jazz-roll`, for the ensemble on the choruses; `bojangles` on the
  bridge.
- **2-13 Hurricane:**
  - `hoist` for the ring in the montage;
  - `crawl-back` for ens2 and ens4 along the downstage edge.
- **2-14 The Reynolds Pamphlet:** `wall-ooze` for the ensemble, from Angelica's arrival and again as she turns to Eliza.
- **2-22 The World Was Wide Enough:**
  - `bullet` for ens1 from Burr's pistol to the centre;
  - `legacy` for Hamilton (and the company) at his monologue (cue 1248);
  - `my-shot` at 4x for the eight round the box, its end shape held: the My Shot pose round him;
  - `row` for ens8 and ens9 beside him after the shot.

### Round 2 (RULING GF): where the forty went

In Act 2, lafayette's track is Jefferson and mulligan's is Madison; laurens's is Philip.

- **1-01 Alexander Hamilton:** the company `breath` before the last word of the women's line; the ensemble `point-fall` as
  the book changes hands; Hamilton `coat-on` as Eliza reaches him; Hamilton `sit` in the cousin's chair and again at his table.
- **1-03 to 1-05:** Burr `sit` reading in his tavern chair (1-03); the four `sit` by candlelight (1-04); the city's
  `old-walk` on its walk-on, Burr's `angel-wings` behind Peggy, Lafayette and Mulligan's `handshake` on the railing (1-05).
- **1-08 to 1-11:** Washington's `sword-draw` on the last line (1-08); Peggy's `shoulder-pop` (1-10, again in 1-11);
  Hamilton's and Eliza's `tootsie-roll` after the blessing; the sisters on their bench and Schuyler in his chair, `sit` (1-10).
- **1-12 to 1-17:** the two passed-out guests `fold` (1-12); the watcher `sit`s on her chair (1-13); Hamilton's `aim` on the
  vocal gun (1-14); Laurens and Lee `head-snap` at the first commandment, and each second's `gun-pass` to his duellist
  (Hamilton to Laurens, Burr to Lee) (1-15); Hamilton `sit` on his bench and Eliza's `comfort` (1-17).
- **1-18 to 1-23:** Hamilton's `coat-on` on the gallery (1-18); Hamilton's `sword-take` from Washington (1-19); the Bullet's
  `handshake` with Laurens (1-20); Burr and Hamilton `sit` in the chairs they bring on (1-22); the jury `sit` (1-23).
- **2-01 What'd I Miss:** the company `scrub`s; Jefferson's `strut` on his walks, `moonwalk` on hook 1, `laugh-bob` at
  Hamilton's `handshake`; ens3 and ens6's `partner-lift` on hook 2.
- **2-02 to 2-05:** Hamilton's `prance-fan` and Jefferson's `laugh-bob` (2-02), the cabinet `sit` in its V of chairs, up for
  the roar and the mic drops and down again; the galleries' `point-down` (2-04); Madison's `beckon`, Burr's `aim`,
  `chest-pump` and closing `point-down`, Jefferson's `strut`, the three `sit` at the table (2-05).
- **2-07 to 2-11:** Hamilton's head in the basket, `point-down`, `point`, `lean-in`, and the six `sit` (2-07); Jefferson's
  `head-bob` and Madison's `finger-wag` (2-08); the King's `king-walk` (2-09, 2-10), `shoo` and `air-quotes` (2-10); the King
  `sit` on his stool (2-11).
- **2-13 to 2-16:** Burr's `aim` with his book (2-13); Hamilton `sit` at his desk (2-13, 2-14); Jefferson and the three DS
  `make-it-rain`, the King's `prance-fan`, one dancer's `floor-freestyle` in the freestyle (2-14); Eliza `sit` on her bench
  (2-15); the theatre's audience `sit` (2-16).
- **2-18 to 2-23:** four couples' `catch` (2-18); Lee's `hold-side`, the six `lean-in`, Burr and Hamilton `sit` at the desk
  (2-20); Hamilton `sit` writing (2-21); Burr's `aim`, Hamilton's `aim-up` and `fold`, Washington's `sabre`, ens6's `lift` of
  the Bullet, Hamilton `sit` at the top until he rises (2-22); Eliza's `gasp` (2-23).

**Not placed:** the lifts in Helpless and Satisfied and the rewind's `floor-slide` (no time or body in the sources);
`floor-slide` is in the library, unused. **Held** for a seated layer: the 2-02 nodding and the 2-11 jamming (above).

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
  - the equals sign and the two fingers;
  - Yorktown's upside-down furniture;
  - Burr's straight lines and Hamilton's arcs;
  - the Room's circle;
  - the three entrances;
  - the company's in-sync breath in the opening;
  - Jefferson moving in time in What'd I Miss.
- Round 2 (each in its segment's Review 3 table): BroadwayWorld, "All the Right Moves" (2016); Broadway Direct (2020) and
  Playbill on the turns and the Bullet; ironinkpen's Act II staging notes and the hamilton-lyrics staging write-ups (Tumblr);
  ProVideo Coalition's interview with the film's editor; PBS "We Are Broadway" on the Bullet; the Press Herald; TVLine.

**Videos read, from their captions and frames:**
- **The WSJ, "'Hamilton' Choreographer Breaks Down His Moves"** — https://www.youtube.com/watch?v=gb67f2HLVGM (4:23).
  Blankenbuehler and Stephanie Klemons teach the Yorktown phrase. The auto-captions were read in full (the four shapes:
  memory, command, heartbeat, the hip-hop march), and frames were seen at 5–257 s.
- **The WSJ, "Choreographing 'Hamilton': The Meaning Behind the Moves"** — https://www.youtube.com/watch?v=VmYTsOrnWP0 (3:14).
  The My Shot phrase, explained and then danced. The auto-captions were read in full, and frames were seen at 70–145 s.

**Videos read from their comments (round 2):** the Disney+ film's clips in Jack's playlist and the official uploads, about
120–400 top comments each, listed with their ids per segment in `research/segN.md` Review 3. Also Groff's King walk
(03IpD4QWPgQ, captions), Blankenbuehler at #Ham4Ham on the Room (ZJVc88LbZrA, captions), CinemaBlend's and MsMojo's
background-detail videos (captions), and ClownOwO's Pamphlet compilation.

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

  Their descriptions are the lyrics. Round 2 read their comments (above).
- **Blankenbuehler at #Ham4Ham, 8/3/15** — YMQ5ogjlnUM ("a taste of the moves from the show").
- **"Building Broadway: HAMILTON Choreographer Andy Blankenbuehler"** (Broadway.com) — R49vKv8f0Wc.
- **The Tony Awards, 2016** — Fb4GlOabb1M (History Has Its Eyes On You and Yorktown), e7Zg0qL17zc (The Schuyler Sisters,
  the closing).
- **Beginner Dance Tutorials, "My Shot"** — uJkX2IBkuAY. Its chapters are the 8-counts, each titled by its line; the phrase
  naming his country is one 8-count (`my-shot`'s 8).
- **Sheila Watko, "The Schuyler Sisters" dance tutorial** — R5r3U0dBYD4.
- **Nick Lenz, "Yorktown" (Original Broadway Choreography)** — diewPW1rs-s.
- **Stop Drop And Dance, Yorktown full class** — yZnYXYmGkMQ (it teaches the WSJ phrase above).
- **Gareth Withers, "The Bullet - Hamilton"** — lLJj5ohEcQo.

**Not reached.** The YouTube transcript endpoints are gated. The two WSJ captions were read from the player's own caption
request in the browser. In round 2 the caption routes were shut for most clips (seg1.md, seg3.md Review 3 say how).

**Published tempos, for the beat grid:** songbpm.com's pages for the cast album and its instrumentals, and tunebat.com for
Burn.
