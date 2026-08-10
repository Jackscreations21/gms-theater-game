# A fifth show, off a video — BEETLEJUICE, measured and interpreted

**Date:** 2026-08-10
**Source:** the owner's ask, verbatim:

> "if i give you a video of a full show can you make the real cues and sets
> for it and make an auto cue feature for it that is timed currectley"

and then, given a file: `beetlejuice/videoplayback.mp4`, "skip the first 33
seconds of it".

Shaping answers, given live: the probe rides its own PR (**#90**, opened
separately); the round is **sets and all**, not cues-only; the scenery covers
**the whole scenic arc**, not one unit; and **RULING AO** below settles how
close that scenery may sit to the real production.

Rulings continue the sequence; the workshop round ended at **AN**.

---

## What this is

Four shows are in the book, each authoring its cues as source code — a `looks`
array walked once to push `CUES` records (`plotLostBoys`, `src/p5d.txt:640`, is
the pattern). This round adds a fifth, and it is the first one taken off a
recording of a real performance rather than invented.

It is therefore two different kinds of work wearing one name. **Cue times and
fade durations are measurements.** **Scenery and channel levels are
interpretations.** The spec keeps that line visible everywhere, because the
value of the round is that the *timing* is real, and the cost of the round is
that nothing else can be.

## What Phase 1 established (`tools/video.js`, PR #90)

Run against the file, 2 h 23 m 47 s:

- **CFR 23.976** — timestamps carry no slop.
- 640×360 at 322 kbps, but the darkest frame measures **Y = 16.8** against a
  video-black floor of 16: **real black survived the compression**, so
  blackout detection is sound.
- **Not a locked-off wide shot.** Layout stability, frame vs frame + 5 s,
  median **r = 0.676** where a fixed camera scores ~0.95; **723 hard cuts at
  5.0/min**, median shot 6.8 s. Extracted frames confirm why: it is a
  **bootleg compilation**, shot from seats, spliced from several positions,
  handheld, with audience heads occluding the frame edges.
- **Consequence, and it is the expensive one:** frame regions do not map to
  stage areas, so **per-area channel levels are not measurable from this
  file**. The brief's §2.4(c), "the one that matters most", is unavailable.
- Auto-exposure drift through a 13.3 s blackout: **+1.1 Y**. Fixed exposure,
  so fade *slopes* can be trusted.
- **33 blackouts ≥ 1 s** (near-certain), **76 strong fades** in cut-free
  windows, measured fade times **median 2.2 s, p90 5.2 s**.
- Act break at **71:02** — the show's longest blackout, 13.3 s, in a cluster
  of eight. **No interval in the file** (longest sustained-bright stretch is
  87 s). **Curtain call in the last 2.5 min** — 82 events of lights bumping
  every 1–3 s, ending in a 7.0 s fade to a 7.3 s black at 143:35.

**A caveat that must travel with every number below.** Because the camera is
handheld, a zoom or pan *inside* a held shot changes frame brightness with no
lighting change at all. Cut detection catches splices, not smooth zooms. The
33 blackouts are unaffected — a dark stage is a dark stage — but **76 strong
fades is an optimistic ceiling**, not a count.

## RULING AO — the scenery is the show's vocabulary, not its drawing

> **SUPERSEDED, same day, by RULING AV** in
> `2026-08-10-beetlejuice-scene-plot-design.md`. The owner withdrew this clause
> in full — *"remove the cluase entirely that it has to be our onw shapes. make
> the sets look as close to the real stuff as you can get it"* — after seeing
> the sign built to it. Beetlejuice is now modelled on the production it was
> taken from. The other four shows are unaffected and still follow the rule
> below. Left standing here because a reversed ruling is worth more on the
> record than a deleted one.

**Same vocabulary, our own shapes.** Build a world that reads as this show —
clapboard house, curved panelled interior, a neon afterlife, a cemetery under
a moon — with **our own proportions, our own detailing, and no attempt to
match the real design element for element**. Signage carries our own words.

This is not a new rule; it is what HANDOFF §3 already ruled for the other four
("all interpretations in each show's vocabulary — no reproduction of anyone's
drawings"). It is recorded as a ruling because a video makes the temptation
concrete for the first time: the reference is *right there*, and the most
distinctive elements of the real staging are the easiest to trace.

Two consequences that bind the build:

- **No frame, clip or audio is ever committed.** Reference frames live outside
  the repo. `tools/video.js` caches to the OS temp dir. This is not RULING AI
  (which is about shipping `.glb` assets) — looking at a picture is
  well-precedented here, the locking rail reads right because the owner sent a
  photograph of one. Committing the picture is the line.
- **Measured layout is fair game; traced detail is not.** Where units sit and
  how the arc sequences are facts about a performance. Surface, colour and
  signage are ours.

## The scenic arc — what the survey found

One held wide frame every ~4 minutes, read off three contact sheets. Roughly
**10–12 distinct configurations**, plus one constant:

| # | Configuration | Seen at | Cost |
|---|---|---|---|
| 1 | Cemetery — hills silhouette, moon, mist | 3:09–9:31 | cheap |
| 2 | House interior — curved panelled walls, central stair, chandeliers | 15:57–31:34 | expensive, signature |
| 3 | Attic — miniature, sheets, string lights | 42:22 | medium |
| 4 | Bedroom — bed, hanging lamp | 54:23 | cheap |
| 5 | Stone structure / crypt | 56:46 | cheap |
| 6 | House exterior — two-storey clapboard, gables, porch | 62:44, 72:58 | expensive, signature |
| 7 | Redecorated interior — pale, ornate, framed pictures | 67:46–94:02 | medium, reuses #2's shell |
| 8 | Afterlife — nested concentric frames, emissive | 103:39–113:22 | **cheap, highest impact** |
| 9 | Illuminated-sign set | 118:04 | medium |
| 10 | Large angular structure + lit letters | 121:54 | medium |
| 11–12 | Wooden-floor interior (may be #7 relit); bare-stage ensemble looks | 123:54, 131:34, +5 | — |

The constant is **the portal**, present in nearly every frame, plus an
overhead beam fan in haze — which is a *lighting* signature, not scenery, and
comes free from the existing rig and smoke.

At 10–12 configurations × ~8 pieces that is **80–140 pieces**, at or above the
top of the existing shows' 55–96. `mergeParts` (p2) pays for the detail, not
extra meshes — and nothing grabbed, moved or recoloured may be merged.

## Where it goes in the build

`SHOWS` is declared in `src/p5c.txt:14`, so the fifth show is a **new part
appended after `p5g`** in `build.sh`. **Never reorder `build.sh`** — the part
order is a dependency order.

## The PR chain — one concern each, strictly sequential

Linear chain, and no PR opens until its parent merges, rebased onto fresh
`main` and retested.

1. **The frame and the opening** — the new show part, its registration, the
   portal and the cemetery. Cheapest geometry, and it stands the plot builder
   skeleton up so everything after it has somewhere to land.
2. **The house exterior** — #6.
3. **The house interior shell** — #2: walls, stair, chandeliers.
4. **The interior's dressings** — #7, #4, #3 on that shell.
5. **The afterlife** — #8 and #10.
6. **The remainder** — #5, #9, and the bare-stage looks.
7. **The cue list** — a `looks` array with the measured times and fades, each
   cue carrying a comment recording what was measured and what was
   interpreted. `restoreAims(homeAims)` before every look; omitting it was
   audit finding M2 and it is not to be repeated.

The transport is **not** in this chain. See below.

## Measured versus interpreted, per cue

Written into each cue as a comment, the way p5d's looks carry them:

- **Measured, trust it:** cue times, fade durations, blackouts, act structure.
- **Interpreted, say so:** every channel level and every focus. We are
  rendering lit *areas* onto **our** 25-channel rig, which is not the rig they
  used. That is what the existing four already do; it is not a defect.

## Still open — the auto-cue half, to be ruled before it is built

The brief's §4 questions are unanswered and deliberately not guessed at:

- **AP?** Cheap `follow` chaining or a real timecode transport. `follow`
  already exists (`p6.txt:180`) and is unused by all four shows — filling it
  with the measured gaps runs the show today, with no new code. **That should
  be demonstrated before anything is built**, because it may be the whole
  feature.
- **AQ?** Whether the transport must be reachable from inside VR. A DOM
  control does not exist in a headset; a `station()` is the cheapest physical
  answer. This is the question #76 was created by.
- **AR?** What a running show does when you walk into the other theatre —
  cancel (what `follow` does today), pause, or keep running on a parked stage.

Two facts to carry into that discussion: `follow` uses **`setTimeout`**, the
one surviving violation of "never `setTimeout` for game timing", and it is
cancelled by a stage swap — so an unattended show dies when you change venue.
And chained relative waits drift, where absolute timecode accumulated off the
frame `dt` does not. `stepProgram(dt)` (`p6.txt:353`) is the model to follow.

## What applies throughout

Every invariant in `docs/guide/INVARIANTS.md`, and in particular: the deck is
**y = 0** on every stage; the proscenium is **15.0 m × 10.4 m** with the stage
44 m wall to wall, 17 m deep, grid at 25 m — so this set interprets onto our
opening at roughly 1:1 and needs no metric scale from the video; a light plot
is written in **stage** coordinates and `stageToWorld()` converts; trims are
the height of the **pipe**.

Suites green before and after every change, every new assertion
negative-checked **against a wrong implementation** and not merely an absent
one, `the-house.html` committed built.

**And the standing one: none of this has met hardware.** Whether a
video-derived show reads as a show, and whether its pace is right, goes in
HANDOFF's headset section as a question — not asserted here as a fact.
