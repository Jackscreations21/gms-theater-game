# BRIEF: the video → cues round

**Written 2026-08-10 for a fresh session.** This is a *brief*, not a spec —
there are no RULINGS in it yet, because the owner has not shaped it. Your
first job is to earn the spec, not to write code.

---

## 0. The ask, verbatim

> "if i give you a video of a full show can you make the real cues and sets
> for it and make an auto cue feature for it that is timed currectley"

Three things, and they are not equally hard. Read §1 before you plan anything.

## 0.1 Read these first

`CLAUDE.md` is auto-loaded, so you already have the hard rules. Beyond it:
`STATE.md`, then HANDOFF's last two Done blocks, then
`docs/guide/ARCHITECTURE.md` + `INVARIANTS.md` + `TRAPS.md` + `TESTING.md` +
`WORKFLOW.md`. If you touch VR, `VR.md`.

**The letters continue: the next RULING is AO.** The workshop round ended at AN.

---

## 1. The honest split — read this before promising anything

**You cannot watch video and you cannot hear audio.** No tool changes that.
What you *can* do is **measure** video with ffmpeg, which for lighting cues is
better than an eye, because a cue is physically a change in brightness and
colour distribution over time — a number, not a judgement.

| The three asks | Difficulty | Why |
|---|---|---|
| **Timing / auto-cue** | Easiest, and mostly already built | `Prog` is already dt-stepped; cues already have a `follow` field. See §4. |
| **Cues** | Very doable, with one caveat | Times and fade *durations* are measurable. Channel *levels* are interpreted — see §3.3. |
| **Sets** | The expensive half | Scenery is hand-written polygon code (55–96 pieces per existing show). See §5. |

**The single most valuable thing you can do early is §2 — measure the file and
report numbers to the owner before anyone commits to a build.** That is cheap,
touches no game code, and turns the scope question from a guess into evidence.

---

## 2. Phase 0 + 1 — prerequisites, then measure. NO repo changes.

### 2.1 Prerequisites

`ffmpeg` is **not installed** on this machine as of 2026-08-10, and there is
**no Python** (the `python` on PATH is the Microsoft Store stub — it prints an
install nag and exits). `winget` is present and is how Node got here.

```bash
winget install Gyan.FFmpeg
```

Then **open a fresh shell** — this machine does not put new installs on an
existing shell's PATH. Same quirk Node has:
`export PATH="/c/Program Files/nodejs:$PATH"`.

You need **ffmpeg only**. Do not install Python, OpenCV, or a model. ffmpeg
plus a Node script that parses its stdout does the whole job.

### 2.2 What video to ask for

Do **not** let anyone transcode "to help" — ask for the original file, local
path only, nothing uploaded. What actually affects accuracy, in order:

1. **A locked-off wide shot of the whole proscenium, one continuous take.**
   Worth more than every other factor combined.
2. **Fixed exposure and fixed white balance.** Auto-exposure fights every fade:
   the camera brightens as the stage dims and flattens the slope you are
   measuring. Auto-WB does the same to colour cues.
3. **Not re-compressed small.** Low bitrate turns near-black into blocky mud,
   and near-black is where blackouts, fade-outs and cyc washes live.
4. **Audio track kept**, any quality.
5. **Pre-show included** (house lights up, before anything happens) — a known
   baseline to measure everything else against.

Resolution, frame rate, container and codec are all near-irrelevant. The one
format to refuse if there is a choice: **a screen recording of a streaming
player** — variable frame rate makes timestamps squishy and it is already
re-compressed.

### 2.3 Probe the file first and report what you got

Before extracting anything, establish what you are working with:

```bash
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,avg_frame_rate,duration -show_entries format=duration,bit_rate -of default=noprint_wrappers=1 show.mp4
```

Compare `r_frame_rate` against `avg_frame_rate` — if they disagree the file is
VFR and every timestamp downstream carries slop. **Say so to the owner.**

### 2.4 The four measurements

Write **one probe**, `tools/video.js`, in the house style: ~40 lines on the
existing jsdom-free harness, not pass/fail, **prints a picture**. It shells out
to ffmpeg and parses stdout. Follow `tools/README.md` and copy the shape of
`tools/buildload.js` (it is the closest — it prints a table of numbers).

**(a) Scene-change timestamps — the raw candidate cue list.**

```bash
ffmpeg -i show.mp4 -vf "select='gt(scene,0.1)',showinfo" -an -f null - 2>&1 | grep showinfo
```

Tune the `0.1` threshold against the file; report what you settled on and why.

**(b) Per-frame mean brightness — blackouts, fade-ups, and fade DURATIONS.**
A 4-second fade is a 4-second slope, and the slope *shape* distinguishes linear
from profiled. `signalstats` gives you YAVG per frame:

```bash
ffmpeg -i show.mp4 -vf "fps=5,signalstats,metadata=print:file=-" -an -f null - 2>&1
```

5 fps is plenty for fade slopes and keeps the output parseable.

**(c) Region brightness — the one that matters most.** Whole-frame average
cannot tell you *which part of the stage* changed, and that is exactly what
maps onto channels. Crop into a grid and measure each cell independently:
stage L / C / R × up / downstage, plus cyc and FOH bands. Use `crop` + `split`
in one filter graph, or one pass per region if that is clearer — clarity wins,
this is a probe.

**(d) Audio loudness envelope — act and scene structure, free.**

```bash
ffmpeg -i show.mp4 -vn -af "ebur128=metadata=1,ametadata=print:file=-" -f null - 2>&1
```

You cannot hear it, and you **cannot identify music or dialogue** — only where
sound starts and stops. Music starts, applause and blackout silence all have
unmistakable timestamps, and that gives you act breaks.

### 2.5 The Phase 1 deliverable

An ASCII timeline plus a table, printed by `tools/video.js`, and a short
written report to the owner covering:

- how many scene changes, and **your estimate of how many are camera cuts
  versus lighting cues** (say how you told them apart)
- whether the camera was fighting the fades (auto-exposure)
- the detected act structure from audio
- a first count: "this looks like ~N cues"

**Stop there and report.** Do not proceed to §3 until the owner has seen this.
`tools/video.js` is a probe and probes are not game code, but it is still a
repo change — it rides a PR like everything else.

---

## 3. Phase 2 — measurements into a cue list

### 3.1 The target artifact is already defined by the codebase

Do **not** invent a cue file format or a persistence layer. The four existing
shows author their cues as **source code**: a `looks` array, walked once to
push `CUES` records. Read `src/p5d.txt:640–676` (`plotLostBoys`) — that is the
pattern to copy. The others: `plotOutsiders` `src/p5c.txt:1140`, `plotHamilton`
`src/p5f.txt:367`, `plotGoesWrong` `src/p5g.txt:609`.

The shape, from p5d:

```js
const looks = [ {n, label, fade, house, haze, drop, curtain, look(){ … }}, … ];
CUES.length = 0;
const savedHaze = RIG.haze, savedFly = snapshotFly(), homeAims = captureAims();
looks.forEach(L=>{
  FIXTURES.forEach(f=>{ f.gobo = 0; });
  restoreAims(homeAims);            // every look starts from the rig's own focus
  L.look();
  setCurtainForCue(L.curtain || 'out');
  CUES.push({ n:L.n, label:L.label, fade:L.fade, follow:null,
              lx:snapshotLX(), fly:snapshotFly(), sfx:null,
              house:L.house, work:0, practical:0, haze:L.haze, … });
});
/* restore everything */ SHOW.cues = CUES.length; nextCue = 0;
```

**So the output of the video pipeline is a `looks` array with real timings.**
That is the whole deliverable of Phase 2. It slots into the existing engine
with no new machinery.

### 3.2 The cue record, for reference

`src/p6.txt:145` (`recordCue`) and `:163` (`fireCue`) are authoritative:

```js
{ n, label, fade, follow,
  lx:  [{lvl, col, gobo, pan, tilt, aim}]   // one per FIXTURES entry, 25 channels
  fly: [{id, target, open}],
  sfx, house, work, practical, haze }
```

`snapshotLX` is `p6.txt:138`. Note `restoreAims(homeAims)` before every look —
`plotOutsiders` was missing it once and it was audit finding M2. Don't repeat it.

### 3.3 Measurable versus interpreted — be honest about this line

- **Measurable, trust it:** cue *times*, fade *durations*, blackouts, which
  region of the stage changed, relative brightness between regions, colour
  *shifts*, act structure.
- **Interpreted, say so:** per-channel levels and focus. You are seeing lit
  *areas* and rendering them onto **our** 25-channel rig, which is not the rig
  they used. There is no way around this and it is not a defect — it is the
  same thing the four existing shows already do.

Write the interpretation down per cue as a code comment, the way p5d's looks
carry comments ("the house comes up under the title"). That is how the next
person understands a choice instead of re-deriving it.

### 3.4 The IP line — a standing constraint, not a discussion

A production's lighting plot and scenic design are authored work. This repo
already ruled on it and the rule is in HANDOFF §3: *"All interpretations in
each show's vocabulary — no reproduction of anyone's drawings."*

So: **real timings and real cue structure off the video; look and scenery as an
interpretation.** Do not trace a designer's plot and do not reproduce the video
or its frames into the repo.

Video frames as *reference* are well-precedented — the locking rail reads right
because the owner sent a photograph of a real one. **RULING AI (no external
assets, ever) is about shipping `.glb` files, not about looking at pictures** —
but it does mean **no frame, clip or audio from the video is ever committed**.
Keep the media outside the repo; commit only derived numbers and code.

---

## 4. Phase 3 — the auto-cue feature

### 4.1 The cheap version already exists. Say so before building anything.

`CUES` records have a **`follow`** field: fire a cue and it arms the next one
`follow` seconds later (`p6.txt:180`). Fill each cue's `follow` with the gap
you measured off the video and **the show runs itself today**, with no new
code. All four existing shows ship `follow:null` and are driven by manual GO,
so this field is built and unused.

**Tell the owner this first.** It may be the whole feature he wanted, and it is
one field. Do not spend a round on a transport before he has seen the cheap
version run.

### 4.2 Why a real transport is still the better answer

Three concrete reasons, all worth putting to the owner:

1. **`follow` uses `setTimeout`** (`p6.txt:183`) — the one surviving violation
   of "never `setTimeout` for game timing". The comment at `p6.txt:127` is
   honest about the cost: wall-clock timers cannot be spliced into a stage
   swap, so the swap **cancels** them. An unattended show dies when you walk
   into the other theatre.
2. **Chained relative waits drift.** Each timer fires a little late and the
   next is armed from the late fire. Over a 2½-hour show that accumulates.
   Absolute timecode does not drift.
3. **No scrub.** You cannot jump to "the top of act two". A video-derived show
   is exactly the case where you want to.

### 4.3 Design constraints if the transport is built

- **Absolute timecode, accumulated off the frame `dt`.** A cue is stamped with
  a time, not a gap. `stepProgram(dt)` at `p6.txt:353` is the model — it is
  already dt-driven and already handles waits, and `p2k.txt:53` shows how
  per-stage state is parked. Follow that family:
  `updateSheds`/`updateOrders`/`updateLifts` are the others.
- **Decide the stage-swap behaviour deliberately and get it ruled.** `follow`
  cancels. A transport could cancel, pause, or keep running on a parked stage.
  This is a RULING, not an implementation detail — the "only the live stage
  ticks" limitation (HANDOFF §"Not done") is the context.
- **Seek must be a state restore, not a replay.** Jumping to cue 80 means
  firing cue 80's snapshot with a zero fade, not running 79 cues fast.
  `fireCue` already takes the whole state, so this is nearly free.
- **VR: anything a headset must reach needs a physical thing in the room.** A
  DOM control does not exist in VR. A `station()` is the cheapest, and the VR
  trigger and desktop crosshair then run the same `pickAll` → `describe` →
  `useInfo` chain from one test. This bit the Arc doors (#76) — do not repeat
  it. **Ask the owner whether the transport needs to be VR-reachable at all**
  before building the physical control.
- **Never `setTimeout`.** If the transport reintroduces one, it is wrong.

---

## 5. Phase 4 — the sets, if the owner wants them

This is a **separate round** and probably several PRs. Do not fold it in.

- Scenery is hand-written polygon builders. The existing shows run 55–96 pieces
  (`p5d` Lost Boys, `p5f` Hamilton — thinner at 55, `p5g` Goes Wrong).
- Frames give you **proportion and layout** well, and nothing else. **You cannot
  get real dimensions from one camera angle** — you need a calibration
  reference in frame: the proscenium width, or a person standing. Ask for it.
- The geometry review is closed and the answer stands: **polygon meshes, no
  voxels, no SDF, no CSG-first, GLTF is a "later"** (HANDOFF, 2026-08-09).
- Detail is paid for by **`mergeParts`** (p2), not by adding meshes. Never merge
  anything grabbed, moved or recoloured.
- Every invariant in `docs/guide/INVARIANTS.md` applies, and the deck is `y=0`
  on every stage.

**Sequencing recommendation to put to the owner:** if the video is of a show we
do not already have, build **the transport first against an existing show**.
Then the timing work is testable before any scenery exists, and the two rounds
do not block each other.

---

## 6. Accuracy caveats to carry into every claim you make

- **Auto-exposure lies** about absolute brightness. Region *comparisons*
  survive it; absolute values do not.
- **Every camera cut looks exactly like a cue.** An edited multi-cam capture
  will produce a large pile of false positives. Report your split.
- **VFR files have squishy timestamps.** Check §2.3 and say so if they are.
- **You cannot identify music or dialogue** — only onset and offset.
- **"Measure the right thing"** is a live trap in this codebase (TRAPS.md): two
  tests once passed while being wrong, including a darkness comparison that
  swept in chandeliers 30m away through a shut door. A brightness measurement
  that includes the auditorium, the surtitle screen, or an exit sign is that
  same bug. Mask the regions you actually mean.

---

## 7. Process — non-negotiable, and CLAUDE.md is the authority

The killers, restated because they cost real time when skipped:

- **All work via PRs to `main`. Never commit to `main`. Never stack** — linear
  chain: open a dependent PR only after its parent merges, rebased onto fresh
  `main`, retested.
- **Suites green before AND after every change** (`cd tests && npm test`, 17
  suites), boot clean (`node real.js`, expect `"fatal": null`).
- **Every new assertion negative-checked against a WRONG implementation**, not
  merely an absent one. That distinction cost real time in the workshop round —
  four `mergeParts` assertions passed against five deliberately wrong
  implementations. It is a TRAPS entry in its own right.
- `the-house.html` is committed **BUILT** — `sh build.sh` after editing `src/`,
  commit both. Never sort `build.sh`.
- `gh` is not installed — PRs go through the GitHub API with the stored git
  credential (recipe in `docs/guide/WORKFLOW.md`).
- PowerShell 5.1 mangles quoted `git commit -m` — write the message to a file
  and use `-F`.
- Never `git add -A` while agent worktrees exist under `.claude/`.
- Commits use the owner's GitHub no-reply address.
- **Fetch and compare before trusting this checkout** about what is next. That
  is a standing lesson here: `git log main..origin/main` is the first move of
  any session that did not personally watch the last one land.

**Then update the record:** `STATE.md` always, a HANDOFF "Done" block when work
merges, and a `TRAPS.md` entry for any new trap. Spec goes to
`docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` with numbered RULINGS
inline **starting at AO**; plan to `docs/superpowers/plans/`.

---

## 8. Ask the owner these before writing any game code

The repo's five-question pattern (HANDOFF's carpenters brief is the model):
**one question at a time**, and do not assume the obvious answer.

1. **Which show is the video of — one of the four already in the book, or a
   fifth?** This decides everything. If it is a production of THE LOST BOYS or
   HAMILTON, the set exists and this is purely cues + timing — the tractable,
   high-value two-thirds. If it is a show we do not have, it is two rounds.
2. **Is the deliverable one authored show, or a reusable importer?** "THE SHOW,
   timed" is data plus a plot builder, like the existing four. "A feature that
   eats a measured cue list and plays it to timecode" is a tool. Both are
   legitimate; they are different rounds.
3. **Cheap `follow` chaining, or a real timecode transport?** Show him §4.1
   running before he decides.
4. **Does the transport need to be reachable from inside VR**, or is desktop
   enough? A physical station is cheap but it is not free, and this is the
   question #76 was created by.
5. **What happens to a running show when you walk into the other theatre** —
   cancel (what `follow` does today), pause, or keep running? This is a RULING.

Plus the practical one: **is there a locked-off wide shot with fixed exposure,
and does the video include the pre-show?** §2.2 explains why it matters.

---

## 9. Codebase facts you will need (verified 2026-08-10)

| Thing | Where |
|---|---|
| `CUES` array, `nextCue`, `selCue` | `src/p6.txt:125` |
| `followTimer`, `cancelFollow` — the setTimeout to replace | `src/p6.txt:130`, `:180` |
| `snapshotLX` / `snapshotFly` / `captureAims` | `src/p6.txt:138`, `:143` |
| `recordCue` — the authoritative cue shape | `src/p6.txt:145` |
| `fireCue`, `go`, `goBack` | `src/p6.txt:163`, `:190`, `:196` |
| `Prog` + `stepProgram(dt)` — the dt-driven model to follow | `src/p6.txt:201`, `:353` |
| `showCueExtras` — rain, storm, firelight per cue | `src/p5c.txt:1371` |
| The `looks` → `CUES` authoring pattern (copy this) | `src/p5d.txt:640–676` |
| The four plot builders | `p5c:1140`, `p5d:515`, `p5f:367`, `p5g:609` |
| Per-stage park/restore of `CUES` | `src/p2k.txt:53`, `:70` |
| Probe conventions + how to run one | `tools/README.md` |
| Closest probe to copy (prints a number table) | `tools/buildload.js` |

Rig size: **25 channels**, one `FIXTURES` / `FLY` / `CUES` / `SHOW` / `HOUSE`
swapped by stage (`p2k`). Suite count: **17**. Node is v24.16.0 at
`C:\Program Files\nodejs` and is **not** on a fresh shell's PATH.

---

## 10. What "done" looks like for each phase

- **Phase 1** — `tools/video.js` merged; a timeline and a numbers table printed
  from the real file; a written report to the owner with the camera-cut split
  and a cue count. No game code touched.
- **Phase 2** — a `looks` array in a show part, real times and fades, comments
  recording each interpretation; cues fire; suites green; new assertions
  negative-checked.
- **Phase 3** — either `follow` chaining demonstrated (nearly free), or a
  dt-driven timecode transport with seek, a ruled stage-swap behaviour, and no
  `setTimeout` anywhere in it.
- **Phase 4** — scenery, its own round, only if asked.

**And the standing one: none of this has met hardware.** Anything about how it
*feels* — whether a self-running show reads as a show, whether the pace is
right — goes in HANDOFF's headset section as a question, not asserted as a fact.
