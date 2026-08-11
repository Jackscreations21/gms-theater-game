# The sound, the audience rig, and the owner's light plot — design

**Date:** 2026-08-11
**Source:** four text files the owner wrote —
`beetlejuice light cues/pre show.txt`, `act one.txt`, `act 2.txt`, `set cues.txt`.
**Rulings:** BA, BB, BC, BD (continuing from AZ).

His four files are the authority for this round the way his set list was the
authority for #104–#113. Where they disagree with what is built, **his files
win.**

---

## 0. What he asked for

Read the four files as one document. They describe:

1. **Sound.** Two recordings. Track one is pre-show music, played until the
   show starts and again through the interval. Track two is the show, started
   at its own position **0:35** on the first GO and resumed at **1:11:32** on
   the second. Every timestamp in all four files is a position in track two.
2. **An audience rig that does not exist yet.** Blinders all around the
   proscenium (off at pre-show, "they are for later"), and more moving lights
   over the seating doing slow random patterns, slowly fading green↔purple.
3. **A top-of-show sequence** — red proscenium and sign, two purple sweeps, a
   blinder flash into a fast random pattern while the curtain and sign fly
   out, a last flash, then blue.
4. **A full light plot for both acts** — about sixty-five timestamped looks.
5. **A revised set list.** One time moved; see §6.

---

## 1. RULING BA — the show has recorded sound, and the sound is never committed

The game gets file-based audio playback. The **files do not enter the
repository**, and that is not a limitation to be worked around later — it is
the ruling. Three independent reasons, any one of which is sufficient:

- **It is not possible.** `videoplayback.m4a` is **134 MB**. GitHub rejects any
  file over 100 MB on push. Track two cannot be committed at all without LFS.
- **The record already forbids it.** TRAPS.md, from the round that measured the
  recording: *"Nothing off a video is ever committed — no frame, clip or
  audio."* Track two is extracted from `videoplayback.mp4`. Looking at, and
  measuring, the owner's own media is well-precedented; committing it is the
  line, and that line was drawn before this round.
- **It is a commercial recording** of a musical still running, and Pages is on,
  which means the repo is either public or one setting away from it.

**The mechanism is the model-import pipeline over again (RULING AZ).** That
round solved this exact problem for `.glb` files the owner makes himself:

| | models (AZ) | audio (BA) |
|---|---|---|
| where | `assets/` | `assets/audio/` |
| the contract | `docs/MODELING.md` File column | `docs/AUDIO.md` File column |
| pinned by | a bidirectional test | a bidirectional test |
| missing | normal state, stand-in kept | **normal state, the show runs silent** |
| refusal | budgets, named console lines | unplayable/absent, named console lines |

`BJ_AUDIO` is the manifest. **A missing track is a normal state, not an
error** — every suite in this repo runs with no audio present, and so does a
fresh clone, and the show must be complete without it.

`assets/audio/` is **gitignored**, with a committed `README` so the directory
and the contract survive a clone.

**A manifest entry may be an absolute URL.** One line, and it costs nothing:
it is the only way the owner gets sound on the headset over Pages without
putting the recordings in the repo. Where he hosts them is his call, and the
copyright question travels with that call, not with this code.

**RULING B is not touched.** The flown PA boxes stay rigging with no audio
wired to them. Show sound comes out of the browser, not out of the modelled
speakers, and nothing in this round patches a speaker point.

**RULING AI is broken deliberately and narrowly**, the way AZ broke it: there
is now a second loader, for audio, and textures are still all canvas-drawn.

### The existing `Snd` engine is left alone

`Snd` (p5) is synthesised WebAudio — effects, busses, no assets — and it keeps
every job it has. Recorded tracks are a **separate concern with separate
state**, because they are long, seekable, and one at a time. Reasons not to
fold them in:

- `Snd.play(name)` **toggles** looping names. A cue-driven track needs
  set-to-a-state, never toggle.
- A track needs `currentTime`, which is the whole of §2.

New tracks route through `Snd`'s **`music` bus level** for one volume control,
so the existing fader still means something.

## 2. RULING BB — when the show's audio is playing, the audio is the clock

His instruction is *"Have all the set cues use the timestamps from the second
audio for there times"*, and every number in all four files is a position in
track two. So a cue's `at` **is** a position in track two — which is already
what `at` has held since #104 (his act break, 1:11:02, is `at:4262`).

Two clocks, one behaviour, chosen at GO time:

- **Track two loaded and playing → the audio is the clock.** A frame-`dt`
  transport reads `currentTime` and fires every cue whose `at` has passed.
  Absolute timecode: no drift, and a seek lands the lights where the music is.
- **No audio → the `follow` chain, exactly as it runs today.** Untouched, and
  it stays the tested path because it is the only one a suite or a fresh clone
  ever exercises.

The two must never both drive: when the audio is the clock, **no follow timer
is armed.**

This answers the drift half of the open question from rulings AP onward, and it
answers it for free. From #119's own record: *"chained relative waits drift,
because each timer fires a little late and the next is armed from the late
fire. Over 2h23m that accumulates. Absolute timecode would not."*

**The stage swap stops the transport and pauses the track.** TRAPS names this
one already — *"cue-follow timeouts, running scripts, held VR ropes, audio
loops — all have driven the WRONG stage's rig after a walk"* — and audio is on
that list because it has bitten here before. Walking to the Arc mid-show
stops the sound with the show, the same way `cancelFollow` already kills the
follow chain.

**A `hold` cue is where the sound changes.** The two holds are the pre-show and
the interval (RULING AU), and they are exactly the two places his files change
tracks. So the audio instruction rides the cue:

```js
audio:{track:2, at:35, from:1}   // start 2 at 0:35, stop 1
```

### Autoplay

Browsers refuse audio before a user gesture, and there is no gesture between
loading the page and the pre-show cue. So: the pre-show track is **armed** by
the pre-show cue and **starts on the first gesture** that reaches the game —
which is what `Snd.init()` already does for the synth engine. A refused play is
reported on one named console line and the show carries on silent.

## 3. RULING BC — the audience is lit now, and the audience lights are seen, not seeing

Blinders around the arch and movers over the seating are **real channels**, not
a new subsystem: `addFixture` gives them levels, colour, fades, cue snapshot,
the board, and the hang/detach system for nothing. They are appended, because
`chan(n)` is `FIXTURES[n-1]` and inserting mid-array renumbers the patch.

| Channels | What | Where |
|---|---|---|
| 26–33 | **8 blinders** | around the proscenium arch, facing the house |
| 34–39 | **6 audience movers** | over the seating, aimed into the house |

The patch goes **25 → 39** on **every stage**, because they go in `buildRig`,
which is the FOH-bar/speaker-bar precedent (*"one `buildRig`, so all three
theatres get it"*) and keeps "every stage is the same box" true.

**They are seen, not seeing.** `_active` is sorted by `_lvl * power`, and there
are only 8 real lights (4 in VR), so a bright audience unit would steal a real
`SpotLight` from a stage lantern at exactly the moment the stage matters. Every
new fixture therefore carries **low `power`** — it lights its own lens and its
own beam and never wins the pool. Their glow is the effect; their draw on the
pool is nothing.

What they cost: three draw calls each (beam, pool decal, lens glow). Two of the
three are close to free here — the beam only draws when `hazeNow() > 0.005`,
and the floor pool is clipped to the stage box, so anything aimed into the
auditorium produces no pool at all. Fourteen new channels is a real number for
a Quest and it goes on the headset list, not in an assertion.

New `SECTIONS` rows (BLINDERS, AUDIENCE) and `GROUPS.all` — hardcoded
`{length:25}` — move with the patch.

## 4. RULING BD — a pattern runs on the frame, never on a timer

His asks are *behaviours over time*: "moving slowly doing random patterns",
"slowly fading between green and purple", "sweep up", "do a random pattern
fast", "flash white as bright as posible". The cue system applies static levels
and fades; none of it can express a pattern.

So a cue may arm a **named audience effect**, and the engine steps it off the
frame `dt`:

```js
fx:{aud:'wander', rate:0.06, cols:['#2fbf5f','#7f3fbf']}
```

| effect | what it does |
|---|---|
| `wander` | slow random pan/tilt, slow crossfade between two colours — the pre-show |
| `sweep` | levels and tilt run UP together over the cue's own window |
| `random` | fast random re-point and re-level — the 1:16 chaos |
| `flash` | everything to full for a beat, then out |
| `off` | no effect (the default; a cue that says nothing clears the effect) |

**Never `setTimeout`** — the standing rule, and the reason this is an engine and
not five timers. Everything is derived from an accumulating phase, so it is
steppable in a suite: 600 calls of `updateAudFX(1/60)` is ten seconds, and the
assertions can watch pan actually change.

There is **no pan/tilt animator anywhere in this codebase** — the two stage
movers ease toward a target and nothing writes the target over time. This is
new machinery, and it is the one genuinely new mechanism in the round.

---

## 5. The timestamps, and the 35 seconds

He wrote: *"The timestamps i gave for the lighting dont scout for the 35
seconds."* Read against the files, that is a warning about what the numbers
**are**, not an offset to apply:

**Every timestamp in all four files is a raw position in track two.** The
proof is that the same event carries the same number in two files written for
different purposes — the act break is `1:11:02` in `act one.txt` (lighting) and
`1:11:02` in `set cues.txt` (sets, explicitly on track two's clock). If the
light times needed +35 they would disagree with the set times by 35 seconds for
one event. They agree exactly, and they agree with the built `at:4262`, which
came off `blackdetect` in #90.

So nothing is offset. The 35 seconds is the gap between a track-two position
and elapsed show time, because the show starts 35 s into the file: his `1:03`
fires 28 seconds after GO, not 63.

`at` therefore keeps meaning exactly what it has meant since #104, and §2 makes
it literal.

## 6. His set list against what is built

Diffed line by line against the list recorded in
`2026-08-10-beetlejuice-scene-plot-design.md` §Act one/§Act two. He said *"i
think i changed 2 things"*. **One numeric change exists:**

| | built | his new list |
|---|---|---|
| netherworld on, house slides off | 1:39:00 (`at:5940`) | **1:39:19** (`at:5959`) |

Every other set time and every set action is identical. The second change he
half-remembers is in the **lighting**, not the sets, and it is real: at the act
break his `act one.txt` says *"1:11:09 house lights fade up to half"*, where
the built interval cue takes the house to **full** (`house:1`). Both are
applied; anything else he meant, he can say.

---

## 7. What jsdom cannot answer — for the headset list

- Whether the audience movers read as *slow* and the random pattern as *fast*.
  `AUD_WANDER_RATE` and `AUD_RANDOM_RATE` are one-line tunes.
- Whether "house lights low" at pre-show is right. `house:0.45` is a
  judgement about the word "low" — under half, still bright enough to find a
  seat by, and still unmistakably not a running show (which is what `show.js`
  has always asserted the difference to be). A one-line retune.
- Whether a blinder flash at full is punishing in a headset at 1 m from the
  arch. It is the one thing here that could genuinely hurt, and it wants a
  verdict before it stays at 1.0.
- Whether fourteen new channels cost frames.
- Whether the lights actually sit on the music — which needs the files present,
  and is the whole point of §2.

No suite in this repo can hear anything, and none of them claims to.
