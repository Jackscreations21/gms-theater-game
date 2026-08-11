# The show's sound — what to put where

**RULING BA.** The game plays two recorded tracks. **The files never go into
the repository.** They live in `assets/audio/`, which is gitignored, and a
missing track is a *normal state*: the show runs silent, complete, and nothing
logs an error. Every test suite in this repo runs that way, and so does a fresh
clone.

## The contract

The **File** column is the contract. `BJ_AUDIO` in `src/p5j.txt` is the other
half of it, and `tests/beetlejuice.js` pins the two together **in both
directions** — a name in the doc that is not in the manifest fails, and a name
in the manifest that is not in the doc fails too.

That test exists because the fallback is silent *by design*. Without it a
misnamed file would simply never play, and nothing would ever say why.

| Track | File | Loops | What it is |
|---|---|---|---|
| `preshow` | `preshow.mp3` | yes | the pre-show music. Plays from load until the show starts, and again all through the interval. |
| `show` | `show.m4a` | no | the show. Started at **0:35** on the first GO and resumed at **1:11:32** on the second. |

## Putting them in

From the repo root:

```sh
mkdir -p assets/audio
cp "/c/Users/patri/Downloads/Official Pre-Show Music  Beetlejuice The Musical.mp3" assets/audio/preshow.mp3
cp "/c/Users/patri/Downloads/videoplayback.m4a" assets/audio/show.m4a
```

Then open `the-house.html`, load BEETLEJUICE, and press GO.

## Why they are not committed

Three reasons, and any one of them is enough:

1. **It is not possible.** `show.m4a` is 134 MB. GitHub refuses any file over
   100 MB on push.
2. **The record already forbids it.** From TRAPS.md, written in the round that
   measured the recording: *"Nothing off a video is ever committed — no frame,
   clip or audio."*
3. **It is a commercial recording**, and GitHub Pages is enabled on this repo.

## Getting sound onto the headset

Pages serves what is in the repo, so with the files absent **the Quest will run
silent** — that is not a bug, it is this ruling working.

A manifest entry may be an **absolute URL** instead of a filename:

```js
show: {file:'https://example.com/private/show.m4a', loop:false, vol:1.0, …}
```

One line, no code change. Where the owner hosts them is his decision, and the
copyright question travels with that decision rather than with this repo.

## What the timestamps mean

Every timestamp in the owner's four cue files — lighting and sets alike — is a
**position in `show.m4a`**, not elapsed show time. The two differ by the 35
seconds the track is already into itself when the show starts.

This is why the transport works the way it does (**RULING BB**): while `show`
is really playing, it *is* the cue clock, and a cue fires when its `at` has
gone by. Absolute timecode, so nothing drifts across two and a quarter hours,
and a seek drags the lights to the music. With no audio present, the `follow`
chain drives the show exactly as it did before.
