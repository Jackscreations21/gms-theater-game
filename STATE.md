# STATE — 2026-10-14 (`actors` = PR #234: THE AUTOMATIC ACTORS, THE EDITOR, NOTES2 (FU), THE DANCING (FV), REVIEW 3 (FW), AND NOW THE VIDEO CAPTURE'S STAGES 1–2 (FX–GE, PART); IT CARRIES `cue-blackouts` = PR #233 — BOTH OPEN)

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## NEWEST — 2026-10-14 (second session): THE AGENTS' ROUND RAN — STAGES 4–5, THE CALIBRATE UI, ~55 CAMERAS OF ~190 WIDE SHOTS, THE SOLVER REWRITTEN UNDER THEM — PR #234

**Read this block first, then `docs/guide/VISION.md` §7** (the manual: findings and the ordered list). Jack: *"finish
everything using agents"*, then *"everything has to be at a point it can pause by 11"*. Fourteen agents ran in this
worktree (`actors`). **Commit `62f7ddf`**: stage 4 `tools/vision/floor.py` (`run.py floor`/`floor-check`), stage 5
`tools/vision/ident.py` (`run.py ident`), the Calibrate mode in `blocking.html` (Advanced; `window.CALIB`; its JS PnP
matches `calib.py` to 1e-7), stage 1's wrong-beat drop + tempo-matched refine + tempo prior (every clip re-aligned, no
shot id changed; 1-04 aligns, its hand `anchors.json` force-added), `tools/vision/aligncheck.py` (one honest failure
left: My Shot ×1.03 coverage), `AGENT-COMMON.md`. **Landed as `5efc9aa` (the solver finished before the pause):** the solver agent's
`calib.py` (a physical prior + the body-height depth cue + `resolve`/`census` commands; it was told to soften the
bounds — y ≥ 0, z ≥ 3.5, fov ≤ 100 — because pit and on-stage cameras are real) and its `resolve all` over the 43
`tools/vision/calib/<clip>.json` files the nine agents wrote; `tools/vision/out/` (4 tracks, STALE against the
re-aligned `at`s until `floor` + `ident` re-run). `floor` ran on every calibrated clip and `ident` on all 20 tracks after the re-solve; `calib.py`, `calib/` and `out/`
are committed. 59 solves kept, 2 degenerate; the census is in the commit message and VISION.md §7.

- **The cameras:** the brief's 45 m / 24° reference was a wrong solve (misidentified posts); G&S s16 is a pit camera
  at deck height, 85–90°. The real families and the degeneracy (lens vs distance from one-plane points; the body
  cue fixes it) are in VISION.md §7. Set points to fix from the solver's census: rail height (+10–15 %), both stairs
  (and they move between numbers), lip-c (the lip bows ~0.5–1 m), the SR strip; add the rolling staircases and the
  light rig. Missed cuts 15–20 % — the structure test is written down, not applied (it re-keys everything).
- **Stage 2:** imgsz 1280 finds 2–3× the bodies in wide shots at ~16 fps; not re-run (the spawning session's call).
- **Stage 5 has no labels yet** — every identity is `blocking` (conf 0.3, `fromBlocking`) or `ens?`; not evidence.
- **Not started:** `compare.py` (GC), GD dance timing, the UI solver carrying the prior.
- Nothing in `src/`; suites unaffected (not run). Dance round 2 still PAUSED; Jack's five rulings still open.

---

## NEWEST — 2026-10-14: THE FOOTAGE IS IN, STAGE 1 RAN ON ALL OF IT, STAGE 2 WAITS ON A PYTHON 3.13 VENV — PR #234

**Read this block first.** Jack downloaded the playlist (JDownloader; 34 of the 36 available clips — 1-09 and 2-13
did not finish, 10 of 46 are unavailable on YouTube) and then 11 more from elsewhere (`Downloads\Jack - ham\`:
1-01, 1-07, 1-11, 1-13, Yorktown in four parts, Non-Stop in three) — **45 files, 40 of the 46 tracks**. The spec's
stages 1–2 were built the same morning in `tools/vision/run.py` (`tools/README.md` has the commands). His Python
was 3.15 (no torch wheel); he ran `py install 3.13` and the venv `tools/vision/.venv` was made from it in this
worktree. Stage 1 ran over every clip, ~10 s each.

- **Where the footage is:** copied (his download folders untouched) into `C:\Users\jackf\Videos\hamilton-clips\`,
  and `video/` in this worktree is a directory junction to that folder (the repo is in OneDrive; 1.8 GB must not
  sync). `video/INDEX.json` (committed) names the 45 files, their sha256, duration, size, fps, the playlist's URL
  per clip, a `note` on the odd ones, and `elsewhere.stillWanted`: **1-09, 2-13 (on the playlist, did not
  download), 2-02, 2-15, 2-22, 2-23, and a full 1-01** (what came is Disney's 104 s promo montage — cut up, it
  does not align). A fresh clone needs the junction remade (TRAPS). `index --import` skips a file whose bytes are
  already here, so a folder can be re-imported after a download finishes.
- **Stage 1 results** (`tools/vision/cache/<clip>/frames.json` + `shots.jpg`, git-ignored, 1.9 GB of frames):
  43 of 45 clips aligned to the album by the envelope matcher — median residual ≤ 0.2 s on 40 of them, 0.26–0.77 s
  on 1-16, 1-19 and 2-11 (dialogue-heavy, few anchors). **Not aligned: 1-04 The Story of Tonight** (every window
  under 0.5, no two agree — it wants `cache/1-04-the-story-of-tonight/anchors.json` by hand) **and the 1-01
  montage**. The film runs at the album's tempo to within 20 ms on most numbers, drifts 1.5 s through Aaron Burr,
  Sir's rap and 10 s over One Last Time (the film's is 25 s longer). The "LIVE AUDIO" Satisfied and the sing-along
  Wait for It are the film's performance (0.01–0.02 s residuals). Cuts: 3 to 95 shots a clip, judged by eye on
  Aaron Burr, Sir and Guns and Ships (every detected cut real; the sheets are there for the rest). Each frame
  carries `tconf` (1 between anchors, falling at the ends where the offset is extrapolated through applause).
- **The alignment's own checks** (not a suite — stdlib has no numpy; run in the venv): a stretched slice of the
  album envelope with applause in front recovers its time to ≤ 0.1 s on ten tracks at ±3 % tempo, and a slice of
  every other track yields no anchor against My Shot's span (except Story of Tonight, which really starts inside
  it). The recipe is in `tools/README.md`.
- **Stage 2 ran** on Schuyler Defeated (316 frames in 22 s, 17.6 fps on his CPU, 1,183 bodies, 71 tracklets, right by
  eye in `draw`), then over every clip in the background at ~40 fps once warm — all 45 done.
- **Stage 3, the camera, is BUILT AND PROVEN ON ONE SHOT, not yet precise** (`tools/vision/calib.py`,
  `tools/vision/setpoints.json`: 47 named set points from the editor's measured plan and the GLB's posts, a
  wireframe; `run.py calib <clip> <shot> grid|solve|refine`). *"can you figure out now how to figure out the camera
  angle"* → Guns and Ships shot 16 (the whole set from the house): nine points read off gridded crops of the frame
  by the agent gave a camera **45 m back, 2.5 m up, 24° lens** (a long lens from the rear of the house — plausible)
  with the lip fitting to 8 px but posts 25–50 px off: **at 720p the agent cannot tell one timber post from
  another; a human click would give ~3 px.** `tools/vision/calib/1-18-guns-and-ships.json` holds that solve, the
  overlay is `cache/1-18-guns-and-ships/calib-s16.jpg`. Jack's word: *"once you figure out the best way to do it
  have opus agents do the rest"* — see HANDOFF for where that stands.
- **Nothing in `src/`**; suites unaffected (not run: no Node on the PATH). `the-house.html` and `docs/ARTNET.md` untouched.
- Dance round 2 is still PAUSED (below). Jack's five rulings still open.

---

## 2026-10-13 (end of day): DANCE ROUND 2 PAUSED, THE VIDEO-CAPTURE SPEC WRITTEN, JACK OUT OF CREDITS — PR #234

**Read this block first.** `actors` on origin is **`ec5ea08`** (review 3 merged, RULING FW) plus this record commit.
PR #234 holds everything: the actors, the editor (`blocking.html`, Simple mode = dots + music + drag records), the
limbs, the dancing (47 moves, the beat grid), three review rounds (written → references → Jack's verdict → video
evidence), 72 props, 859 placed moves, and #233's 14 commits (the sound tap, the cue revisions). Jack works on
http://localhost:8093 from this worktree. Checklist: https://claude.ai/artifact/4Q5Xh37ZmSinhtsJbVhAub (v5, the
review-3 watch lists; his `songs` rows are the brief).

- **Dance round 2 is PAUSED, not lost:** ~40 moves the video reviewers asked for (sit — the first seated pose —
  head-bob, shoulder-pop, king-walk, sword-draw, the two-body lift/catch, hand props …) and the beat-grid fixes for
  My Shot (~160 s and the death verse) and 1-18. The agent had verified the grid fix and coded nothing in the
  worktree when Jack paused it. Its note: session scratch `scratchpad/dance/WIP-round2.md` (the 2026-10-12 session,
  `a0b0b830…`); the reviewers' move descriptions are the `## Review 3` sections of `tools/blocking/research/segN.md`,
  the stand-ins are marked in `tools/blocking/dance.py`. It takes RULING **GF** when it lands.
- **The video-capture system is SPECCED, not built:** `docs/superpowers/specs/2026-10-13-video-blocking-capture-design.md`
  (RULINGS FX–GE). It needs Jack's downloads and a venv before any code.
- **Open, Jack's rulings** (the checklist's "Your call" bullets; `docs/hamilton-blocking-cue-notes.md`): the sisters'
  order in 1-05; the duel sides at the shot in 2-22 (two sources say they swap); the King's stool (end of 2-10, sits
  stage right?); 1-07's two "Kings men" figures; the 1-09/1-10 side flip. Plus the cue items listed there.
- **Frame cost:** the jointed bodies cost up to ~+30 ms a frame at the busiest dance moment (the Pamphlet freestyle)
  on his Intel GPU. A far-body LOD was offered, not started.
- Suites not run all day (no Node; nothing in `src/`). `the-house.html` and `docs/ARTNET.md` untouched by this branch.

---

## 2026-10-13 (latest): REVIEW 3 MERGED — THE VIDEO EVIDENCE, THE DANCE ASSIGNMENTS (RULING FW) — PR #234

Eight reviewers went through the video evidence: the clips' titles, descriptions and top comments, the written accounts,
and Blankenbuehler's interviews. Nobody here can watch video. They edited:
- the generators (marked `REVIEW 3`);
- their sections of `tools/blocking/props.py` and `tools/blocking/dance.py`;
- `## Review 3 (video evidence)` in each `tools/blocking/research/segN.md`.

This session merged and checked the result.

- **Integrity.**
  - `props.py` and `dance.py` are whole, with each of the eight sections present exactly once, and both run.
  - All eight generators run. Their own checks report only these:
    - seg4: Washington at 3.2–3.3 m/s at 1-23 384, Non-Stop's last second;
    - seg5: a near pass, Burr and ens3 at 2-05 317;
    - seg7: ens6, ens7 and ens8 close together in Hurricane's hoist (2-13 110–114), and the King against the SR stair
      at 2-14 37–39;
    - an off-to-off jump for ens6 in 2-16, which is harmless.
- **Tool fixes.**
  - `props.py --check` used a partial size table and crashed on a `crate`. It now uses the full `PROP_KINDS`.
  - A hand prop, carried on and off with no set-down, is legal (RULING FW). `schuyler-book` now reads "a hand prop", not
    a warning.
  - The lyric quotes in `dance.py`'s SEGMENT 4 header are reworded, and so is one in `seg7_gen.py`.
- **The lyric scan (5-word runs) over everything this round touched.** The hits left are song titles, cue labels or
  plain English ("at the end of the").
  - The dance agent's committed `docs/hamilton-dance-moves.md` and `tools/hamilton-moves.json` still quote lyrics:
    15 lines.
  - I asked the dance agent to reword them in its next commit. It is editing those files now.
- **RULING FW.** At 2-16 → 2-17 the seven at the count carry over: ens2, 3, 4, 6, 7, 8 and 9, at the coordinator's
  spots, facing 0. Both ends match exactly in the merge. Philip, Eacker and the King are unchanged.
- **Totals, before → after:**

  | | before | after |
  |---|---|---|
  | waypoints | 6,596 | **7,153** |
  | moves | 322 | **859** |
  | props | 62 | **72** |
  | prop waypoints | 335 | 382 |

  - The merge has 0 errors and 0 warnings; `props.py --check` gives 0 warnings.
- **Checked on :8095:**
  - `MIDTOWN.actors.check()` passes, with props, limbs and the 859 moves; 0 problems, 0 warnings.
  - `show.check()`'s seek equivalence passes, with references resolved and the timeline monotonic. Its overall
    `pass: false` is the 16 channels with no unit, as before.
  - The lead-in: Burr walks on at −6 s.
  - The console is clean.
- **Frame cost.** Measured at 1280 × 800 on this Intel GPU, as the median of three runs of six frames, with the bodies
  shown and then hidden:

  | moment | visible bodies | with | without | the bodies cost |
  |---|---|---|---|---|
  | Yorktown's phrase (1-20 55) | 12 | 51.7 ms | 37.2 ms | 14.5 ms |
  | the Room's bridge (2-05 225) | 12 | 62.9 ms | 37.5 ms | 25.4 ms |
  | the Pamphlet freestyle (2-14 103) | 13 | 77.6 ms | 46.4 ms | **31.2 ms** |
  | the 1-01 roll call (1-01 205), for comparison | 19 | — | — | 14.3 ms |

- **Renders:** 15 "watch first" moments and a contact sheet, in scratch `act/shots/review3/`.
- **For the dance agent, next:** about 40 missing moves, and the beat grid. My Shot needs tempo changes (about 160 s
  and the death verse). 1-18's downbeats are about two beats off the cue hits. Segment 7's clip timestamps were 0–7 s
  off. All of this is in FUTURE.md.
- **Open for Jack** (`docs/hamilton-blocking-cue-notes.md`, "Added after review 3"):
  - The King's stool: brought at the end of 2-10 by a cast member, and he sits stage right? Or set UL at 2-11, as now?
  - The duel's sides at the shot: two sources now point to a swap.
  - The new cue items: 2-05 872 and 867.6 / 867.7, 1-13 420, 1-14 443 / 445, 1-20 61–66, 1-18 120, and Hurricane's
    gallery sides.

## 2026-10-13: THE DANCING — A BEAT GRID, 47 MOVES, THE SHOW'S OWN CHOREOGRAPHY, THE DANCE BUTTON (RULING FV) — PR #234

Jack: *"have an agent build the dancing system"* — and his sources (`Downloads\hamilton choreo info.txt`: a playlist of the
film's clips, the reddit staging notes, the Blankenbuehler interviews) and *"also look on youtube"*.

- **The beat grid** `assets/hamilton-beats.json` (`tools/beats.html` decodes Jack's soundtrack in the browser): 46 tracks,
  measured vs published BPM median 0.04 % (largest 4.2 %), 57–96 % of clear onsets within 50 ms; tempo changes in 18
  tracks for Jack's ear. `MIDTOWN.show.beatAt / beatTime`.
- **47 moves** (`midtown.html` `DANCE`, `tools/hamilton-moves.json`, `docs/hamilton-dance-moves.md` with sources): 25
  general and 22 of this show's — the My Shot phrase and `legacy`, Yorktown's I-imagined-death / command / heartbeat /
  hip-hop march (from Blankenbuehler's WSJ breakdown, captions read and frames seen), musket, upside-down furniture, the
  Room's shimmy and ooey-gooey jazz, Hurricane's hoist and cockroach crawl, the gavotte and grind, equals and work, the
  Pamphlet's wall, Bojangles, the Bullet, the rowers, the rewind.
- **`moves` in the file**, a first pass of assignments for 11 numbers by `tools/blocking/dance.py` (322 entries), merged and
  validated by `tools/blocking-merge.py`, marked by `tools/blocking-plot.py`. `MIDTOWN.actors.check()` compares limbs and
  body offsets in the middle of moves: passes (45 moments, 421 body-moments, worst 0); negative-checked.
- **Cost:** posing 0.1–0.2 → 0.2–0.3 ms with 13 dancing; frames 72–74 ms either way (noise).
- **The editor:** ♪ Dance… (D) on the selection (counts, mirror, canon step), dancing badges, beat ticks, `moves` in the
  recording file, undo / Clear / Restore / Delete / X. Also (the coordinator's ask) two-person carries ("two carry it
  (with…)") and props' `model` kept: the whole-file export is byte-identical again and the editor shows 0 errors.
- Checked on 8115 (scratch) and 8116 (the worktree); never 8093 / 8080. Shots: session scratch `dance/shots/`.
- Suites not run (no Node; nothing in `src/`).

## 2026-10-13 (later still): `cue-blackouts` (PR #233) MERGED INTO `actors` — THE SOUND TAP IN THE 3D PAGE — PR #234

Jack: *"the sound in the 3D page gets out of sync when he skips a lot and no longer resyncs."* The envelope sound tap
(`sndStart` / `sndTick`, `assets/hamilton-soundtrack-env.u8`, `showSoundSeek` with the seek table, `MIDTOWN.show.sound`,
the HUD) existed only on `cue-blackouts`. That branch is now merged into `actors` with a merge commit, so **PR #234
carries #233's 14 commits**. Either #233 merges first, or #234 absorbs it.

- **Conflicts, each resolved by keeping both sides:**
  - **`midtown.html`, five places where the FQ clock edges met the sound tap:**
    - `showPause` keeps FQ's `!SHW.gap` (a lead-in or tail is silent) and the tap's `sndStart` on the Play click;
    - `showTick` keeps the `!SHW.gap` tests and the interval guard after `showSoundTick`;
    - `loadedmetadata` seeks by the table and arms the check; `ended` goes to FQ's tail when the track has one;
    - `showSoundTick` reads `currentTime + soundOff` and then takes FQ's tail test on that true time;
    - `showScrubMax` (FQ) and `showHud` (#233) are both kept.
  - **`STATE.md`, `docs/guide/TRAPS.md`:** both blocks kept, newest first.
  - **Auto-merged:** `HANDOFF.md`. `assets/hamilton-show.json` is #233's (cue revisions 3–5; `actors` never changed it).
- **`assets/hamilton-pools.json` regenerated.** The pools were re-dumped from the merged page: 46 tracks, 891 cues,
  13,346 person lights. On an unchanged track, 2,376 shared lights landed within 0.05 m of the old dump.
  `docs/hamilton-blocking-cue-notes.md` says what #233 settled:
  - Cabinet Battle #1's sides;
  - 1-07's FTB.
  - And what is still open, including 1-03 Q120's focus leak, which the data now shows.
- **Checked on :8095 with the soundtrack, the Play button clicked (the tap needs the gesture):**

  | skip | landing error | moved | result |
  |---|---|---|---|
  | forward 20 min, to 1-07 | 0.7 s | yes | "sound synced" |
  | back 10 min, to 1-03 | 10.9 s | yes | "sound synced" |
  | across the interval, forward to 2-03 | 2.5 s | yes | "sound synced" |
  | across the interval, back to 1-20 | −15.6 s | yes | "sound synced" |

  - The HUD showed each note.
  - Playing into 1-23's tail held at the interval, on 670, with the house up.
  - `actors.check()` passes. `show.check()`'s seek equivalence passes, its references resolve and its timeline is
    monotonic. Its overall `pass: false` is the 16 channels with no unit, as before.
  - The console is clean.
- **Two bugs that test found, now FIXED (`sndTick`, `showTail`, `showHold`):**
  - **A back skip resumed about its landing error away from the asked time** (1-03 ~11 s early, 1-20 ~16 s late).
    - The cause: the check kept the FIRST request's want / req. The corrective seek did land right: a played
      stretch is off by one constant, so subtracting the measured error lands it.
    - But the second check re-measured that same error against the old relation and moved it back again (twice,
      at most), undoing the fix.
    - Now each corrective seek re-arms the check with its own target and request:
      - the target is the asked time + what the element has played since the last request;
      - the check judges the POSITION error, within 0.25 s, with up to 3 corrective seeks.
    - If it cannot converge, the clock stays on the measured position (sound and picture agree). The HUD then says
      "sound synced, N s after/before the skip's time (the file would not land there)" instead of pretending.
  - **A stale "moving it" note.** A check cut short by a tail or the interval left the note up. `showTail` /
    `showHold` now clear the pending check and its note.
  - `MIDTOWN.show.sound.err` is the last measured position error.
- **Verified after the fix**, on :8095 with the soundtrack, the back targets primed by playing them first:
  - Resume error = the show clock − (asked time + what the element played since), sampled every 0.1 s. The tap's
    own figure is in brackets.

    | skip | resume error |
    |---|---|
    | forward 20 min, to 1-07 | +0.01 s (0.05) |
    | back 9.6 min, to 1-03 | +0.13 s (0.00) — it landed −6.0 s off, was moved once, then synced |
    | across the interval, forward to 2-03 | −0.06 s (−0.07) |
    | across the interval, back to 1-20 | +0.06 s (0.00) |
    | 1-11 → 1-03 | +0.15 s (−0.01) — it landed −10.0 s off, was moved once, then synced |
    | 2-20 → 2-05 | +0.12 s (0.03) |

  - Into 1-23's tail mid-check, the note cleared at the tail.
  - `actors.check()` and the show's seek equivalence pass; the console is clean.

## 2026-10-13: NOTES2 — TWO CARRY IT, A BETTER CARRY, PROP MODELS, THE ROLL CALL ON THE GALLERY (RULING FU) — PR #234

Jack's notes on 1-01 to 1-03: *"make two people carry it on and make the carrying look better"*; *"everyone who has one of
those lines is on the balcony except Burr who is at center stage"*; *"find a model for the lamp. find a model for the
picnic bench"*; *"the bench should go onto upstage right. two people should carry the table on. the street light should
come off right before the table comes on"*; *"the table should come off about halfway through"*.

- **RULING FU.**
  - `carriedBy` may be `[a, b]`: the prop rides between the two at hand height, its long side along them, and each
    holds her end.
  - One carrier holds it in front at hip height, forearms under it, leaning back; a chair or a stool one-handed at her
    side; a tall piece upright at her side.
  - A prop may name `model` (a GLB in `assets/props/`), scaled to its size; the boxes stand in until it loads.
  - Built in `midtown.html`, the plotter, the merge, `props.py` and the format doc. **`blocking.html` does not have it
    yet**: it is the editor round's work (that agent was fixing the clock this round).
- **The models are built, not downloaded:** `tools/props-models.py` writes `assets/props/picnic-table.glb` (an A-frame
  table with attached benches, dark red-brown) and `street-lamp.glb` (an iron post, a glowing lantern). The 2-04 lamps
  use the lamp model too.
- **1-01.**
  - The clerk's table is carried on and off between ens7 and ens6. The cousin strikes the chair. Lafayette steps off
    DSR while they pass.
  - The roll-call singers sing from the galleries and stay there for the line-up. Burr sings Q65 at (0, 2.5).
    - Re-placed by an eyewitness account (Jack's Reddit notes): Lafayette and Mulligan side by side at the upstage
      gallery's centre (∓0.5), Laurens at 2.2.
    - The three sisters are on the SL end balcony (Guns and Ships' balcony, about (5.3, 2.3)); Washington is on the
      SR balcony (−5.5, 2.2).
  - **Crowding:** the deck's centre third (|x| < 1.83) held up to 10 bodies, more than 8 at four moments. Now it never
    holds more than 8:
    - Q45 closes in an oval (it was a 2 m circle);
    - Q58's company stands to the sides;
    - the roll-call ring is looser.
- **1-02.** The lamp is struck at 80.0, just before Q86. Mulligan and Laurens carry the picnic table on, between them,
  to upstage right at (−2.4, −1.0).
- **1-03.** ens1 and ens4 strike the table in the blue of Q119 (159.8, the cue nearest the middle). Laurens is no longer
  up on it.
- **Checked on :8095:**
  - merge: 0 errors, 0 warnings;
  - `props.py --check`: 0 warnings, both pairs walk 2.28–2.30 m apart;
  - `actors.check()` passes;
  - `show.check()`'s seek equivalence passes (its overall `pass: false` is the 16 channels with no unit, as before);
  - the console is clean;
  - renders are in scratch `act/shots/notes2/`.
- **The cues still light the deck for the roll call.** The refocus asks are in `docs/hamilton-blocking-cue-notes.md`.

## 2026-10-13: FIXED — THE EDITOR'S SOUND DRIFTING OUT OF SYNC (blocking.html) — PR #234

Jack: *"the sound is getting out of sync and it isn't resyncing itself anymore."*

- **Cause:** each song's clock was clamped to its length − 1 ms, which the music test counted as not-music, so the silent
  clock crossed every song boundary and then force-SEEKED the element into the next song (2 seeks per boundary, measured on
  the old build); each seek landed by Chrome's VBR index and stalled the clock — the drift the soak saw (1,125 s in 1,231 s).
- **Fix:** `S.clock` is 'audio' while the element plays — the clock IS `currentTime` + the seek offset, every frame, across
  boundaries and the silences between songs, never re-seeked; 'silent' only for lead-ins, tails, no file; one seek hands
  over. A resume does not re-seek. The Music line shows "clock: audio / silent".
- Checked on localhost:8093: 1-01 → 1-02 with 0 seeks and clock = element; the lead-in hands over at 0:00 (1 seek); pause /
  resume 0 seeks; a scrub during play 1 seek then exact; 5 s with no frames then one frame: exact; 1-23's tail goes silent,
  the interval holds at 2-01 −10, its lead-in hands over at 0 (1 seek). The envelope resync stays on `cue-blackouts`.

## 2026-10-13 (review 2 merged): THE ENSEMBLE CUT BACK, THE FURNITURE CARRIED, PROPS GLIDE (RULING FT) — PR #234

Jack watched the blocking: *"the ensemble is used far too much and much of the choreography is wrong"*. He wanted the
furniture carried on by named people at named cues. Eight reviewers edited the eight generators and their own
sections of `tools/blocking/props.py`; this session merged and checked the result.

- **Integrity first.**
  - `props.py` had been corrupted twice mid-round by concurrent edits, and repaired. It reads whole: eight sections once
    each, and it runs.
  - Every generator parses and runs.
  - All eight segments and the props were regenerated. The merge has 0 errors and 0 warnings, and
    `props.py --check` against the full merge gives 0 warnings.
- **Totals, before → after:**
  - waypoints 9,410 → **6,491**;
  - props 28 → **62** (335 prop waypoints);
  - ensemble time on stage 52,375 → **33,732 body-seconds** (−36 %), measured with the plotter's pose every 0.5 s;
  - principals 28,284 → 26,557.
- **RULING FT, placed props glide.** Between two placed waypoints (neither carried, neither off) a prop moves and turns
  linearly in time; an `off` or a carry breaks it.
  - It is the same in `midtown.html`, `blocking.html` (Simple mode's furniture keyframes now glide, as dots walk) and
    `tools/blocking-plot.py`, which now draws props.
  - Philip's table in 2-17 rides the ring on 7 + 3 points instead of 60 steps. It moves at most 0.04 m in 0.1 s and
    stays within 0.1 m of Philip. The page and the editor agree to the centimetre.
- **Dolly and Martha** (ens6 / ens7) are allowed in `tools/hamilton-cast.json`. Segment 7 labels the two women of 2-16
  with them and hands the names back in the wing.
- **Checked in the page** (worktree on 8095, never 8093):
  - `MIDTOWN.actors.check({n: 60})` passes: positions, yaw, labels, visibility, limbs (19 bodies) and props, seek
    against play.
  - `show.check()`: seek-equivalence passes; overall false only on the 16 channels with no unit, as on `main`.
  - Labels are right at every doubling, including Dolly / Martha in 2-16.
  - The 1-01 lead-in: Burr walks on from −10 and is in place at 0.
  - Console clean.
- **The limbs cost frame time.** At the 1-01 line-up, 19 bodies at 1280 × 800 on the Intel UHD: medians 89.5 / 106.4 ms
  with the actors against 60.7 / 70.2 ms without, about +30 ms. In FUTURE.md.
- **Spot-check with `blocking-plot.py --pools`** (18 moments, all segments): principals are in their person lights wherever
  the cue data lights them. The misses are the listed cue items: 1-10 Q302, 1-11 Q369/370, the 2-02 / 2-07 sides, 2-05's
  table special, 2-09 ch25, ch43 blocked.
- **Renders:** 13 house-camera frames of the reviewers' "watch first" moments are in session scratch
  `act/shots/review2/` (`sheet.png`).
- **blocking.html with a changed source file:** a recording saved against the old file still restores, with the banner
  "it was made on a different blocking file", and plays. Checked on port 8095 with a planted recording, which was then
  removed. No change was needed.
- **`docs/hamilton-blocking-cue-notes.md`** now has the review-2 cue items and three new questions for Jack: the 1-07
  "Kings men DS", the 1-09 / 1-10 side flip, and the King's stool side.
- Suites not run (no Node; nothing in `src/`).

## 2026-10-13 (latest): THE LIMBS — THE MANNEQUIN WALKS, IDLES, TURNS AND CARRIES (RULING FS) — PR #234

Jack: *"start working on the system for moving body parts while I work on the choreo."*

- **The body is jointed:** `assets/mannequin-woman-rig.glb` (new, 451 KB, 23,156 triangles) is the same mannequin cut by
  `tools/mannequin-rig.py` (new; from the committed body, no STL) into fifteen rigid parts at joints MEASURED from the mesh
  (ankle 0.095 / 0.100, knee 0.430 / 0.440, hip 0.845, waist 0.985, wrist 0.807 / 0.820, elbow 1.045 / 1.056, shoulder
  1.323 / 1.327, neck 1.432 m), with a voxel liner under every cut and a ball at every joint.
- **`midtown.html` animates it** through FL's hook (`rigAnimate`), a pure function of the pose: the walk's phase is the
  distance walked (two 0.65 m steps a cycle, feet planted by two-bone IK, pelvis bob / sway / twist, arms opposite), blended
  by speed from an idle (breath, weight shift); stairs lift the knee (the floor 0.35 m ahead); a turn on the spot leads with
  the head and steps round; a carried prop takes both arms forward. `?rig=0` or a missing file: the whole mannequin as before.
- **Checked on my own port (8113 / 8114, not 8093):** `MIDTOWN.actors.check()` passes with the limbs compared too (40 and 60
  moments, 416 / 641 body-moments, worst 0); negative-checked (a smoothed arm fails all 40). Frame cost at the bows (20
  bodies): ~75 ms → 74–76 ms a synchronous frame on this machine (noise); the limbs 0.10–0.16 ms, the stair ray 0.06 ms.
  Shots: session scratch `limbs/shots/` (a walk from the side and front, Washington's real walk, Hamilton's stair climb,
  a turn, an idle, a carried desk, the house).
- Up close the fused hip and armpit read patched when an arm swings away (FUTURE.md). Suites not run (no Node; nothing in
  `src/`).

## 2026-10-13 (later): FIXED — "IT WASN'T LETTING ME LET SOMEONE STOP CARRYING AN OBJECT" — PR #234

- **Cause:** a carried square was drawn under its carrier's dot, only d/2 + 0.22 m ahead of her, and the hit test takes the
  nearest centre: 45 % of a desk's visible square (more for a chair or a lantern, all of it at small zoom) grabbed the
  PERSON, so a drag moved her instead of setting the prop down; the picker's only release was a line labelled "Nobody".
- **Fix:** carried squares are drawn after the people, clear of the dot, tagged "carried by X", with a ⬇ put down button;
  the carry ▾ list starts with "Set down here, now" and "Off stage, now". Now 100 % of the square grabs the prop.
- Checked (localhost:8093): put down while paused (1-01 100.0), a drag-down while playing (recorded at the drop, 105.5),
  Off stage now, Ctrl+Z, export → wipe → load replays identically.

## 2026-10-13: SIMPLE MODE — SELECT SEVERAL, DELETE A TRACK IN A SONG OR FROM NOW ON — PR #234

Jack: *"make it so I can delete the track for a specific person, or it can delete the track in front of the position of the
song I am at. Make it so I can select multiple people at once to delete tracks for."*

- Select: click, Shift / Ctrl-click, a box on the empty plan, Ctrl+A, Esc; the cast list mirrors it (Shift-click ranges).
- Delete (their whole track in this song), Shift+Delete ("Delete from 0:30 on in this song": the current song only, from the
  clock on), X (one keyframe). Confirm with song, time, who, count; one Ctrl+Z each; nobody left frozen.
- The recording file carries `deletions` per song and body (`deleted: "all"` / `deletedFrom`); format doc updated.
- Checked on http://localhost:8093 with real input: a box round Hamilton and Lafayette, Shift-click Mulligan, Shift+Delete at
  1-04 30 s (they walk off by ~41 s; earlier untouched), click Laurens + Delete (she walks off in the song's first 4 s), Ctrl+Z
  twice restores, X removes a keyframe and Ctrl+Z brings it back, Ctrl+A selects 20, cast-row Shift range, export → wipe →
  load replays identically.
- Suites not run (no Node; nothing in `src/`).

## 2026-10-12 (latest, round 3): THE EDITOR'S SIMPLE MODE — DRAG THE DOTS WHILE THE MUSIC PLAYS, CARRY THE FURNITURE — PR #234

Jack: *"just make it so every person has a dot, then I can play the music and I move the people to where they need to be, and
make it so I pause it with space bar … then make it export that so I can give it to you"*; *"when I add furniture it creates a
square for it, and it has a button, then when I press it I can choose who carries it at that time."*

- `blocking.html` opens in **Simple**: a dot per person (big, named), a square per prop, the plan, the music, the blackout
  indicator, the scrub bars; Space anywhere; ← → ±1 s (Shift 5), Home; drag = a keyframe now; drop in a wing = offstage; ⇅ / L =
  level; Ctrl+Z; "Keyframes: N in this song" and ticks; Clear this song / Restore / Export; Add furniture + carry ▾ (nearest
  first, or nobody); notes per song and on the show; saved at every keyframe and back on reload. **Advanced ▸** is the editor
  as it was.
- **The rule** (format doc, spec FP): keyframes replace a body's loaded waypoints in that song from the first keyframe on.
- **The recording file** `hamilton-blocking-recording-<date>.json` and how to apply it: the format doc.
- **Checked on http://localhost:8093** with real mouse drags: Laurens dragged while paused (1-04 30.0), Lafayette while playing
  (recorded at the drag's end, 39.23), Space toggling, a desk carried on by Laurens (66.1), set down at centre (77.4) and
  carried off by Hamilton (85.6) all live with the music playing; Ctrl+Z; Clear (nobody frozen; a body with a keyframe walks
  on from the wing); ⇅ to the gallery (y 2.743); export → wipe → load back replays identically (141 sampled poses equal).
  A 20-minute play soak: see below. Shots: session scratch `act/shots/editor/simple-*.jpg`.
- Suites not run (no Node; nothing in `src/`).

## 2026-10-12 (latest, round 2): THE EDITOR — MUSIC CHECKED ON 8093, CLEAR / RESTORE A SONG, THE LEVEL BUTTON, A CLEAN PLAN — PR #234

Jack: *"The audio isn't playing"*; *"for each song I can choose to start with none of the lines already in there"*; *"add a
button so if it is in a place with a second level I can choose what level it is on"*; *"make the map of the stage look better"*.

- **Music:** the cause was the soundtrack missing from the worktree (git-ignored); it is now in its `assets/audio/` (copied by
  the coordinator). Checked on http://localhost:8093/blocking.html with a real click: the element plays, `currentTime` and the
  readout advance with wall time (2.9 s in 3 s), and from 1-01 −3 the Music line says "lead-in — the music starts at 0:00" and
  the music joins at 0 (file 0.4 + at). Fixed on the way: the frame dt clamp (0.25 s) slowed the silent clock in a throttled
  pane (now 1 s); a refused `play()` is shown and stops the clock; loading shows a percentage; a missing file says to press
  "Choose the MP3…" and lights that button.
- **Clear this song / Restore this song** (one undo step each; the change file's `clear-track`). Ruled: the clear leaves
  `off` holds so nobody stands frozen from the song before (format doc). Checked on 1-02, 1-04, 2-17: only walk-offs in the
  first seconds and walk-ons in the last; 0 errors, 0 warnings; undo returns the file byte for byte.
- **The level button**: Lower · deck / Upper · gallery on the form, a ⇅ tab by the disc, the L key; enabled only on two-level
  floor; drag keeps it over gallery floor; the change file names the level.
- **The plan redrawn** as clean vector shapes with non-overlapping labels, a key and a scale bar (before / after:
  session scratch `act/shots/editor/plan-BEFORE-*.jpg`, `plan-AFTER-*.jpg`).
- **From the props helper:** the YouTube time guard (`showState` no longer throws when the video is unavailable);
  `actors.check` samples 5 ms off waypoint instants (its only failures were the two sides of a step there); Washington's chair
  (2-02) and the 2-16 desk now have carriers (Washington, Hamilton; `props.py --check` warns Hamilton is 1.77 m from the desk).
- Suites not run (no Node; nothing in `src/`).

## 2026-10-12 (latest): THE BLOCKING EDITOR `blocking.html`, THE CLOCK'S LEAD-INS AND TAILS, PROPS (RULINGS FP–FR) — PR #234 grows

Jack: *"make a software that i can make paths for the people … make this a different html … play the music and it shows me
where they would be … export a file that tells you what to change … an indicator for when it is a blackout … a 2d view from
the top and add text showing what each part is"*; then *"give me 10 seconds before the first song starts at the start of the
first and second act, and give me 10 seconds at the end of act 1, and as much time as I want at the end of act 2"*; then
*"make it so i can also put in props i want people to carry on like desks or stuff."*

- **`blocking.html`** (repo root; on the worktree server `/blocking.html`): the plan from the top, labelled part by part from
  the measured floor; every actor at the moment with her label; the selected actor's / prop's path; drag, click-to-add at the
  current time, a waypoint form, delete, undo / redo, nudges, snapping 0.05 m; the merge tool's checks live (the committed file:
  0 errors, 0 warnings); the music (Jack's soundtrack fetched as a Blob, or chosen from disk, or silent; the VBR seek table);
  BLACKOUT / LIT with brightness and the cue, blackout bands on both scrub bars; the person lights; Notes for Claude per track
  and on the show; downloads: the change file (format in `docs/hamilton-blocking-format.md`), its Markdown, the whole edited
  blocking file (byte-identical when unedited). A draft is kept in the browser and offered on reload.
- **Checked:** the editor's pose = `MIDTOWN.actors.pose` at 360 random moments (0 m, 0 rad, labels and visibility alike) and =
  `blocking-plot.py`'s printout; its BLACKOUT agrees with the page's per-cue pool dump on all 892 cues (after it learnt to skip
  the channels no unit answers — TRAPS); export round-trips byte for byte; drag / add / delete / undo / redo / draft restore;
  the clock through 1-01's lead-in into the music, a corrected skip into 1-11, 1-23's tail, the interval stop at 2-01 −10;
  console clean. Shots: session scratch `act/shots/editor/`.
- **FQ in the page** (`midtown.html` show player): `at` −10 … 0 on 1-01 and 2-01 (silent; the preshow / interval look held),
  1-23 runs 10 s past its music before the interval hold, 2-23 has an open tail. `show.check` passes at points inside every
  edge; `actors.check({ n: 40 })` passes. The merge (`track_table`, `at_ok`) and `blocking-plot.py` lay the clock out the same.
  NOT seen: Play with real frames through a lead-in in the 3D page — the Browser pane was hidden (no animation frames); the
  hand-driven clock and the editor's (same rules) were.
- **FR props** in the page (boxes, a desk a top on legs, lit, name tags, carried in front of the carrier at waist height,
  pure function of time, in `actors.check`), in the merge (validated, written after the actors), in the editor (a Props panel,
  "Carry from now", the change file's `prop-*` ops). **The seed:** `tools/blocking/props.py` (written by a helper agent) —
  28 props (the tavern table and chairs, Seabury's box, Washington's desk, Hamilton's desk through Act Two, the ten Cabinet
  chairs and Washington's, the Room's table and three chairs, the King's stool, Burn's bench / bucket / lantern, Philip's
  table), carried on and off by the actors its notes name, else set in the dark; merged: 0 errors, 0 warnings; the editor
  loads it with 0 problems.
- **`assets/hamilton-pools.json`** (0.6 MB, `tools/blocking-pools.py`): the person lights per cue, slimmed from the page dump —
  a snapshot of the cue data on `actors` (before #233's revisions 3–5).
- Suites not run (no Node; nothing in `src/`).

## 2026-10-12 (late night): THE WHOLE OF HAMILTON BLOCKED — 9,410 WAYPOINTS, MERGED AND CHECKED (RULING FO) — PR #234

Jack: *"put the choreography for every character in hamilton"*, then *"run agents to check each section using reference
pictures, documents, and videos then have them fix anything that is wrong"*, then *"make sure that spotlights are on their
actor."*

- **The pipeline.** Eight agents wrote one segment each, eight reviewed them against references, and eight checked them
  against the spotlights. The merge (`tools/blocking-merge.py`) reads their outputs: 0 errors, 0 warnings.
- **`assets/hamilton-blocking.json`** (720 KB) has the twenty bodies over all 46 tracks:
  - Hamilton 667 waypoints, Burr 400, Eliza 271, the ensemble about 590–690 each.
  - 2–20 actors per number.
  - The merge prints the per-track table.
- **The ruled segment edges are continuous to the number:**
  - 2-10 → 2-11: the King at (0, 3.41).
  - 2-16 → 2-17: Philip at (−0.4, 2.4) and Eacker at (1.6, −1.0), both facing 180.
  - 2-23: ends on the bows with all twenty on stage.
- **Regenerable.**
  - The eight generators, their notes and research are in `tools/blocking/` (stdlib; `docs/hamilton-blocking-format.md`
    has the eight commands).
  - Run from the repo, they reproduce every segment byte for byte, and the merge reproduces the committed file byte for
    byte.
  - Their output folder `tools/blocking/segments/` and `__pycache__/` are git-ignored (two lines in `.gitignore`).
  - Lyric scan (5-word runs against the album's synced lyrics): only song titles and Binkley's own cue labels. One phrase
    in `research/seg7.md` was reworded.
- **Checked in the page** (worktree served on 8093):
  - `MIDTOWN.actors.check({n: 40})` passes: seek = play at 40 moments, 0 m / 0 rad, labels equal. This came after a fix:
    the page's speed check had flagged 19 legs between two OFFSTAGE waypoints (up to 128 m/s, unseen). Like the merge, it
    now skips them.
  - `show.check()`: seek-equivalence passes. Overall still false on the 16 channels with no unit, as on `main`.
  - Labels at the doublings are right: 1-01 Jefferson / Madison verses, 2-01 Jefferson, 2-04 Maria and James Reynolds,
    2-16 George Eacker, 2-22 the Bullet, plus Seabury, Lee, the Doctor and Philip.
  - Console clean apart from the git-ignored soundtrack's 404.
- **Frame cost**, 19 on stage at the 1-01 line-up, house camera, 1280 × 800, Intel UHD:
  - Medians 94.7 ms with the actors and 91.2 ms without, run-to-run 60–130 ms. The look's 142 lit pools dominate.
  - On a tiny canvas (CPU-bound) the actors add about 2.5 ms (24.3 vs 21.8).
- **Twelve proof renders** from the house: session scratch `act/shots/final/` (`01-1-01.png` … `12-2-23.png`, `sheet.png`).
- **For Jack: `docs/hamilton-blocking-cue-notes.md`.**
  - The cue, rig and page problems the passes found, per track: the 2-02 / 2-07 mirrors, 1-11 Q369/370, 1-23 659/661,
    the FOH X4s ch41–46 and apron Vipers ch2/ch4 stopped by house geometry at z ≈ 8.4, 2-05's unresolved preset-767
    focus, and more.
  - Two blocking questions: the 1-05 sisters' order and the 2-22 duel sides.
  - The pool data the spotlight pass used was dumped from `actors`, which lacks the cue revisions 3–5 on `cue-blackouts`
    (#233). The agents allowed for the Cabinet Battle sides and 1-03 Q119.
- **`tools/blocking-plot.py`'s person-light test** now counts any unit at zoom ≤ 18.5°. The dump's `special` cut-off
  misses those face keys.
- Suites not run (no Node; nothing in `src/`).

## 2026-10-12 (night): NAMES OVER THEIR HEADS, THE COMPANY OF TWENTY, AND THE TOOLS FOR EIGHT BLOCKING WRITERS (RULING FN) — PR #234 grows

Jack: *"dont focus on any costumes or arm or feet movements. but i want you to put the choreography for every character in
hamilton. for now just use the blank mannequin and put a thing over their head with what character they are."* The
preparation for eight parallel writers (one per cue-round segment); their merged blocking is the next commit on `actors`.

- **Head labels (midtown.html):** a constant-screen-size name tag 0.25 m over every crown, drawn over everything, hidden with
  her, left out of the lighting engine's passes; a waypoint `label` changes it from that waypoint on (Lafayette → Jefferson);
  part of the pose, so `MIDTOWN.actors.check()` compares labels — and the check now SEEKS FIRST, as a jump from 600 s away,
  then plays (negative-checked: a label that updates only on small steps fails it; it passed the old order). A body with no
  waypoints is not on stage (was: at centre). Pose lookup is a binary search (6,131 random waypoints: load 78 ms, check
  passes). Panel: a `label` field per waypoint, a Names box.
- **The company:** `tools/hamilton-cast.json` — 20 ids (10 principals, ens1–ens10 in grey), colours, and the only labels each
  may show (Maria Reynolds, Jefferson, Madison, Philip; the Bullet ens1, Seabury ens2, Charles Lee ens3, Philip Schuyler /
  James Reynolds / the Doctor ens4, George Eacker ens5). `assets/hamilton-blocking.json` is now that cast with NO waypoints
  (the demo is kept in the session scratch `act/brief/example-demo-1-01.json`).
- **Measured, not guessed:** `tools/hamilton-floor.json` (the floor at deck level and at the top, every 0.2 m, x −10…10,
  z −7…6, from `MIDTOWN.actors.floor` at Real size); the glossary in the brief and the format doc: deck points, the
  turntables (centre (0, 0.95), inner r 2.59, outer to 3.82), the SL stair (foot (2.2, −2.45) → top (4.5, −2.45)), the SR
  stair (foot (−4.5, 1.85) → top (−4.5, −0.3)), the galleries at 2.743 (USG x −4.75…5 z −3.8…−3; SR strip, cross-walk and
  SR arm; SLG x 4.6…6 with a hole in its outer half at z −1.8…−1.4), entrances checked hidden from six house seats.
- **`tools/blocking-merge.py`** (stdlib): seg*.json → `assets/hamilton-blocking.json`; errors on ids, tracks, `at`, labels,
  time not strictly increasing per actor, a track claimed twice; warns on off-stage positions, props, gallery legs leaving
  the gallery, level changes away from a stair, fast stairs/legs, overrunning dwells, `off` in plain view, a segment's first
  waypoint without a label; fills `y` from "deck" / "gallery" / "top"; prints a per-track summary. Tested on a broken set
  (5 errors, 6 warnings, nothing written) and on the demo (written).
- **The brief** (session scratch `act/brief/README.md`, with `tracks/*.txt` — every track's cues as timing anchors, no
  lyrics — `floor-map.txt`, `pictures/`, `segments-template/`): segmentation = the cue round's (1-01…06 · 07…11 · 12…17 ·
  18…23 · 2-01…05 · 06…10 · 11…16 · 17…23).
- Suites not run (no Node; nothing in `src/`).

## 2026-10-12 (evening): AUTOMATIC ACTORS — the Blocking panel, RULINGS FF–FM — branch `actors`, PR #234 OPEN

Jack: *"make a system for automatic actors. Make a software where you can create their paths and stuff. Right now
just make them using this mannequin but later we will add arm and feet movement."* Branched from `main` at
**`5d24188`** ALONGSIDE the open **#233** (`cue-blackouts`) — not stacked on it; both touch `midtown.html` (this one
adds one CSS block and one code region, and touches none of #233's lines: a test merge of the two is clean in
`midtown.html`; the record files will conflict and want a hand merge).

- **The mannequin:** `assets/mannequin-woman.glb` from his `Downloads\standing-woman.stl` by the new
  `tools/mannequin-glb.py` (standard library; weld, quadric vertex clustering at 1.5 cm, smooth normals, GLB
  writer): 158,010 → **18,096 triangles, 8,864 vertices, 322,508 bytes**; the STL is +z up facing −y,
  unitless (2,000 units tall) → metres, Y up, feet at 0, facing +Z, **1.65 m**. Licence UNKNOWN (assets/README.md).
- **Actors on the page (midtown.html, region "AUTOMATIC ACTORS: THE BLOCKING"):** a group per actor with a `body`
  child, under the set's root (set-local metres, scale with the set), in her own colour. Paths of waypoints
  `{track, at, x, z, y?, dwell?, facing?, off?}` on the show clock; the pose is a PURE function of show time
  (centripetal Catmull–Rom through walk-throughs, straight into stops, eased 0.6 s, facing turns 0.6 s, auto
  dwell walks at 1.3 m/s, offstage flag); the floor by a ray down the walk's collision grid (she climbs the
  stage-left stair onto the 2.74 m gallery). Lit by the show: the pools' depth band is widened per frame round
  any actor in a cone (without it a pool lit her to the shins).
- **The Blocking panel** (header button): the show clock (the player's own Play/seek), actors (add, rename,
  colour, remove), the path in the view (line + discs), **Click to place** at the current show time, drag a disc
  to move it, a waypoint form, Download / Load… / Copy JSON, a draft in this browser offered on reload.
  `MIDTOWN.actors` on the console; `MIDTOWN.frame()` poses them first.
- **`assets/hamilton-blocking.json`:** a DEMONSTRATION through 1-01 — Burr enters SR at "Burr Enters"; Hamilton
  walks into the centre shaft at "Hamilton revealed" and climbs the SL stair to the gallery at "the Voyage";
  Eliza on the upstage gallery at 93 s and again at 166 s. Format: `docs/hamilton-blocking-format.md`.
  Spec: `docs/superpowers/specs/2026-10-12-automatic-actors-design.md`.
- **Verified in the Browser pane** (the worktree served on 8093, not Jack's 8080): console clean but the
  soundtrack HEAD 404 (his file is not in the worktree; pre-existing); `MIDTOWN.actors.check()` **passes**
  (12 moments, seek = play to 0 mm / 0 rad; negative-checked with a position lerp and a yaw smoothing — both
  fail it); `MIDTOWN.show.check()` seek-equivalence still passes (overall `pass` false on the 16 channels with no
  unit, as on `main`); `lx.check()` 301/313 as before; a real click dropped a waypoint at 0:05, a drag moved it
  without orbiting the camera; Download → Load round-trips byte-identical; real-time Play walks Burr on at
  1.7 m/s and turns him to the house on arrival. Renders in the session scratch `act/shots/`
  (`stair-climb.png`, `play-burr-walking.png`, `lit-on.png` / `lit-off.png`).
- **Found on `main`, not fixed (FUTURE.md):** `MIDTOWN.show.state` throws once the YouTube adapter is the audio
  and YouTube cannot play (`showState` → `SHW.A.currentTime.toFixed`).
- **Suites NOT run** (no Node on the PATH; nothing in `src/` moved, so `the-house.html` and `docs/ARTNET.md` are
  untouched). The new GLB is declared in `assets/README.md`, which the `beetlejuice.js` assets assertion reads.

---

## 2026-10-12 (merged into `actors` 2026-10-13): Jack's first full watch — his notes answered twice over, the skip synced by the sound, the readout, the checklist — `cue-blackouts`, PR #233 OPEN

**Read this block first.** `main` is **`5d24188`**: #230 (the show), #231 (its record) and #232 (`fixture-glbs`, the 38
model files) merged by Jack — the rig hangs on Pages. **PR #233 (`cue-blackouts`, 13 commits) is open:**
https://github.com/Jackscreations21/gms-theater-game/pull/233. Everything below is on it. Nothing in `src/`, so
`the-house.html` and `docs/ARTNET.md` are untouched and the suites are unaffected (not run: no Node on the PATH).
**Until it merges, all of this is live only in the working copy on the local server (localhost:8080), not on Pages.**

**Where his notes come from now:** the checklist artifact https://claude.ai/artifact/FpiGBBW8LicWbaRb1nTUjg ("Hamilton
Cue Checklist", one row per album track, Good / Need work + a notes field, saved to its database: collection `songs`, doc
id = track id, fields `status` / `notes` / `updatedAt`). **Read it with `ArtifactData` `list` (or `query` on
`status != good`) at the start of every round** — it is the brief. He marked act 1 (18 good, 5 notes) and act 2 (4
notes) today; all nine notes are answered once (revisions 4 and 5) and the rows still carry his marks until he re-checks.

The day, in order (each step a commit on the branch):

1. **Revision 3 — the blackouts he named by ear** (`assets/hamilton-show.json`, 892 → 890 cues, the 124 real untouched).
   Checked the clock first and found it right (his one-file soundtrack's `tracks[].file` starts all sit on measured
   silences; the YouTube uploads are the album's length to the second). A luminance scanner in the page (`CAP.scan` /
   `CAP.dark`, `CAP.sheet` — session scratch `capture.js`, recipe in HANDOFF) showed the eight reviewers' "pull-ins"
   at 3–5 % of the frame and true black for 1.5–4 s at every song change. No blackout out of Alexander Hamilton, The Story
   of Tonight, The Schuyler Sisters, Right Hand Man (their zeros folded into the next song's first look); My Shot's
   pull-ins at a third; Farmer Refuted's middle one warm palette; Right Hand Man's 283 and the tent lit; That Would Be
   Enough's fade on the cut-off and complete; Yorktown's last chord keeps the stage. `why` fields start "Revision 3".
2. **The checklist** (above) and **the readout** (`#sh-hud`, `showHud()` from `showUI`): the song (id, act, number,
   title), the time into it to a tenth, the live cue and label, paused / the interval, the sound tap's state. Hidden when
   the show stops.
3. **The skip, first pass (open loop):** his soundtrack is variable-bitrate with a Xing table and Chrome seeks it by that
   table — up to 52 s from the requested time while `currentTime` reports the request (+17 / −18 / −33 s measured by
   tapping the element through Web Audio and matching its loudness against the file's stored 20 ms envelope).
   `soundtrack.seek.toc` in the show file = the true time of every table cell from the file's frame index (scratch
   `ham/mp3toc.py`), checked in all 100 cells against what Chrome played (`ham/probes.py`; cells 37 and 79 decode from
   the cell before); `showSoundSeek(P)` asks for the time whose cell lands on P and reads the clock as
   `currentTime + err`. Right for regions the page has not played.
4. **Revision 4 — his act-1 notes** (889 cues, 123 real): My Shot's "did I talk too loud" blue with a white centre spot
   (119; 120 restores the warm colours); no blackout Farmer Refuted → You'll Be Back (189.5 and Binkley's 190 FTB left
   out of the show; 190.01 cross-fades); Ten Duel Commandments fades into 452 (451.5) and the number cues land on the
   number word; Guns and Ships holds its special to 31 before the sweep.
5. **The skip, second pass (closed loop — the sound tap):** *"going forward works but doesn't go back correctly"* — the
   browser indexes every frame it reads with the time it believes it is at, so a skip back into a played region lands on
   those entries and the table mis-corrects. Now the element's output is tapped through Web Audio (`sndStart`, on the Play
   click; the element is tapped only once the context runs, or it would mute) into 20 ms bins and matched (normalised
   cross-correlation, ±75 s) against **`assets/hamilton-soundtrack-env.u8`** (new asset, one byte per 20 ms,
   `soundtrack.envelope`) after every seek — one corrective seek if the landing is far off — and every half-minute
   (`sndTick`). The readout says "checking the sound…" / "the sound landed −14.5 s off — moving it" / "sound synced";
   `MIDTOWN.show.sound` for the console. Tested the way it failed: detected, moved, synced. **The interval bug** he found
   (act 2's first cue at the hold) was the tick firing to the clock the hold had just put on the next track's start: fixed,
   checked with the audio running (holds on 670, house up, 720 next).
6. **Revision 5 — his act-2 notes, and Guns and Ships twice more** (891 cues, 123 real): Cabinet Battle #1's Jefferson
   and Hamilton specials mirrored (the sides were swapped); Cabinet Battle #2's mic-drop and French-king punchline on
   their lines; a blackout (977.5) into One Last Time; the finale fades up to the full warm look 3 s after the final
   blackout (1298, the bows). **Guns and Ships' top:** the balcony is the railed platform at the stage-left end of the
   gallery (floor by raycast at set-local 5.49, 2.78, 2.36); a floor pool from above was invisible from the house and the
   apron unit's beam was clipped by the proscenium, so **Viper 93 on the 1st Electric** (upstage of the arch) is aimed at
   chest height on it, zoom 16 — checked from the house and the front row; the sweep is **the upstage row (9th and 10th
   Electric Vipers) snapping on white at their feet at 31.0 and tilting out over the audience in 0.6 s**, the full warm
   look at 32.0, the ring of beams on Lafayette at 34.2.

**Checks after every step:** `MIDTOWN.show.check()` seek-equivalence passes, references resolve, timeline monotonic;
every changed moment rendered and looked at (session scratch `shots/r3*.png`, `r4.png`, `r5*.png`, `balcony*.png`).
The seek and sound work is specific to HIS copy of the album: a different file needs `mp3toc.py` (the table) and a new
envelope (decoded in the browser, 20 ms RMS, quantised `255·(log10(rms)+4)/4`); YouTube on Pages seeks exactly and
is untouched. Session scratch: `ham/` (`edit3.py`–`edit6.py` the revision scripts, `mp3toc.py`, `probes.py`,
`seekcheck.py`, `audio.py` + the envelope, the before-files), `capture.js`, `shotrecv.py`, `shots/`.

**Open:** his re-check of the nine noted songs (and anything new he marks); the post-merge protocol when #233 lands
(fast-forward, delete `cue-blackouts` and the five landed branches both sides, suites when Node is on the PATH); then
the older list — the rig placements the photos exposed (FUTURE.md), `edge`/`frost`, the 238 effects, the body, the
headset.

---

## (earlier today, landed as #230) 2026-10-12: the engine calibrated to Binkley's cue photos, every cue re-judged from renders, the preshow and the interval

Jack: *"go through all the cues and compare them to pictures to make sure they are all correct"*, *"the main problem i saw
where spotlight places, timing and brightness"*, and *"you didnt do the preshow lighting and make it so at the end of
nonstop it blacks out then the lights go back to what they where at preshow an it waits for me to press play"*.

- **The method this time was renders, not JSON.** `MIDTOWN.frame()` (new on the console handle) draws one full frame
  synchronously, so a hidden Browser pane can capture; a receiver on 127.0.0.1:8099 takes `canvas.toDataURL()` POSTs.
  Every cue of the show was rendered from a house camera (`{p:[0,3.4,-6.5], t:[0,1.9,4], fov:52}`) into contact sheets,
  and the 109 photographed real cues were rendered beside Binkley's photos (session scratch `shots/final-*.png`,
  `shots/full/sheet-*.png`; the recipe is in TRAPS "From the cue-review round").
- **The engine, calibrated to the photos (one Opus agent, the lighting-engine region only):** pools now accumulate in
  LINEAR light in an off-screen buffer with a knee (`LX_ACC_KNEE` 0.55) so overlaps keep their colour instead of going
  white; beams are filled shafts (`LX_BEAM_FILL`); the Viper wheel gained Linear; ColorBlaze strips get a sixth of a real
  light; X4 power 1.3 → 0.7; the near-field cap 0.8 → 1.2 (narrow pools are hot); `LX_POOL_GAIN` 3 → 6; Open beams have a
  hard edge. Pool SIZE needed no change (the stored zoom is the angle the photos draw: measured 1.81 vs 1.75 m). Mean
  luminance ours ÷ photo: 0.73 → 0.98 over the 20 fitting cues, 1.22 over all 109. lx.check() 301/313, show.check()
  seek-equivalence passes, frame cost +4 %. Pre-change copy in session scratch `midtown.before-engine.html`.
- **Colour: the Viper's cyan flag is blue.** C88/Y55 drew teal here and blue in the photos (and the production stills);
  `lxCmyColour` now mixes with per-flag transmissions (`LX_CMY_FLAGS`, cyan [0.05, 0.3, 1]); the ambers are unchanged.
  The old TRAPS line "the data is right, the renderer differs" is corrected in place.
- **Converter bug fixed (`tools/hamilton-cues.py`, `assets/hamilton-eos.json` regenerated, only gobo fields changed):**
  the second Viper profile (channels 91–100) learnt no gobo table, so 654 gobo changes came out as `"slot:N"` and the
  player dropped them; the table is now shared across the Viper profiles and 6.4 = Open.
- **The cues (eight Opus reviewers, one per segment, each rendering its own cues in its own tab):**
  `assets/hamilton-show.json` is now **892 cues (124 real, 768 reconstructed)**, down from 911: ~20 invisible cues
  removed, 3 added, every reconstructed cue re-judged; no real cue's `at` moved. The repeated findings: the FOH Truss
  and Apron Electric movers (36–39, 41–46, X4s 43/44) and Binkley's wide presets land in Midtown's pit, house ceiling
  and side walls at the Rodgers' aims — out of every reconstructed look now (the REAL cues 194, 200, 300.3, 1044, 1110,
  1238.01 still carry them); the boom shins at full crossed the haze and whited out centre — capped ~25; "BLUE LED"
  (cp 4) and C70/M85 draw violet on the Vipers — blues re-mixed to C100/M30–55; the Take a Break family and Eliza's
  gallery specials were under the gallery, now on it; every GO re-checked against the album's hits (seg8 moved 58,
  mostly < 0.1 s). The eight reports are in the segments' `notes` ("Revision 2:"). Stale `slot:N` gobos in two
  segments broke seek = play on one dark unit (ch94); fixed, and the validator now rejects them.
- **The player: preshow and the interval.** Opening the Show panel puts the show at its top paused — the real 24.01
  preset up, the house lights UP (`SHW.houseUp`); the first Play takes the house to 0.35. A track with `hold` in the
  show file (2-01: "Intermission") is not entered: at the end of 1-23 the clock stops at the track's end with its last
  cues fired (668 button, 669 blackout on the cut-off, 670 = exactly real 24.01), the audio pauses, the house comes up,
  the panel says "Intermission — press Play for What'd I Miss"; Play steps into 2-01 (720 fires on its first beat) and
  takes the house out. Works on the silent clock, his one-file soundtrack (`showSoundTick` holds) and per-track audio
  (`showAudioEnded`). A roll-over tolerance bug (384.99 + 0.01 lands an ulp short of 385 and the next track's 0.0 cue
  fired through `showFireTo`'s own 1e-9) is fixed. Verified in the page: states captured in session scratch
  `shots/states.png`.
- **Still open, Jack's:** the three 10th-Electric VL3500s (71/73/76) focused behind Midtown's back wall burn the upper
  brick; the back-wall foots under the upstage gallery never reach the brick; the Deck strips point at the deck edge
  (FUTURE.md has the options); Binkley's `edge`/`frost` not drawn; the 238 effects not run; the Cabinet Battle sides
  still unsourced. Suites not run (nothing in `src/`); the fixture GLBs still untracked.
- **MERGED: #229 (`midtown-walk`) and #230 (everything else on the chain), both by Jack, 2026-10-12.** `main` is
  **`8961616`**. Local `main` fast-forwarded. Not yet done of the post-merge protocol: the suites (Node still not on
  the PATH; nothing in `src/` moved, so `the-house.html` and `docs/ARTNET.md` are as they were) and deleting the
  landed branches `midtown-walk`, `midtown-walls`, `midtown-lights` (local and remote — the sandbox refused the
  delete; Jack or a `git push origin --delete` from a terminal).
- **On GitHub Pages:** https://jackscreations21.github.io/gms-theater-game/midtown.html — BUT the 38 fixture GLBs
  (`assets/fixtures/*.glb`, `lod/*.glb`) are still untracked by Jack's instruction, so on Pages the rig has no models:
  the page loads, the set and the house are there, and the lights are not. Commit the GLBs (one PR) and the show
  works there; locally (python http.server on 8080, `.claude/launch.json` `the-house`) it is all there. His
  soundtrack is local only; Pages falls back to the official YouTube uploads for the audio.

---

## 2026-10-11 (third session, final): every cue revised against pictures, writing and the real audio — superseded by the block above

Jack: *"do a revision of the cues. go over all of them and look at pictures online and fix anything that is wrong"*, and
*"make an md file of an in-depth explanation of the style of lighting used in hamilton"*.

- **Research** (two Opus agents, notes in session scratch `ham/research/`): ~120 production pictures (Disney+ press stills,
  per-song film frames, Joan Marcus photos) → notes for 45 numbers; written sources (LSA Oct 2015, Live Design's
  "Birth of a Nation" set, Korins / Blankenbuehler / Steinberg / Arch interviews) → notes for 40.
- **Timing evidence**: Jack's soundtrack decoded to 20 ms loudness; `ham/audio.py <track> [from to]` prints its hits and
  rests in track seconds. Every GO in the show was checked against it.
- **Revision** (the eight segment agents, resumed): looks re-palette'd to the evidence (Say No to This blue/cyan not red;
  Wait for It, That Would Be Enough, Burn, Quiet Uptown deep blue; Washington on Your Side's red deck; Satisfied's rewind
  drains to sidelight; Yorktown ends on isolated pools, no flashes; What Comes Next snaps red→blue; the finale ends on a
  lavender-magenta gasp), staging fixed where known, real cues RE-PLACED on the audio (474 gunshot now the END of 1-15;
  200 button on the chord; the 1104 and 1270 duel chains on their shot onsets; 1039 FTB on Hurricane's cut-off…), content
  untouched; leak checks green in every segment (segment 1 found real 190 FTB leaves 106 channels on — fixed with 189.5).
- `assets/hamilton-show.json`: **911 cues (124 real, 787 reconstructed)**, 2.6 MB; lyric scan clean.
- **`docs/HAMILTON-LIGHTING-STYLE.md`**: the design explained in depth — philosophy, the rig, the palette by gel, the
  look-book, space, his systems (group names), the movers, how the cues are built (from the 124 real cues: median 0.5 s,
  82 part cues, 76 move-in-dark marks, "AF" = auto-follow, MIDI-fired from sound), the famous moments, all 46 numbers, a
  "light like Binkley" checklist, what is unknown, sources.
- Checks: show.check() seek-equivalence passes (Lustr colour now judged at the engine's own 0.005), refs resolve, 142:13;
  lx.check() 301/313 with the show stopped; console clean.

---

## 2026-10-11 (third session, last): the music, and the light made real — UNCOMMITTED on `midtown-lights`

Jack: *"you forgot to put in the audio and … the lights looked too bright and unrealistic"*, then his own file
(`Downloads\Hamilton The Musical [Full Soundtrack].mp3`, the album as ONE 8,555.8 s file), then *"when a light is shining
on a wall it loses its texture and just looks like one solid color."*

- **Audio, three sources, in order:** his own per-track files (Load album audio…) → **his one-file soundtrack**, copied to
  `assets/audio/hamilton-soundtrack.mp3` (ignored by the EXISTING `assets/audio/*` rule — never committed; the committed
  Beetlejuice files there are untouched) → the **official album on YouTube** (`tracks[].yt`, all 46 artist/Topic uploads,
  embeddable, within 2 s of the album; a 320×180 player card bottom-left while it plays, as YouTube's terms want) → silent.
  The soundtrack's track starts (`tracks[].file`) were found from its silences in the browser (decoded in 1-minute
  chunks): 30 real gaps of 0.1–1.6 s, **15 album segues with no silence** (there: previous start + length); the last track
  ends 0.25 s from the file's end. The file loads into a Blob: **python's http.server has no Range requests, so a streamed
  file cannot seek** (TRAPS). Verified: seek lands on the file position; playing across the Winter's Ball→Helpless segue
  changes track at 1716.95 s and fires 300.3.
- **The light is now light × surface.** The depth pass also renders every mesh in its own UNLIT colour (albedo, the house
  scan at its undimmed base); a pool multiplies by it — brick, grain and the scan's photo show through every pool. Dark
  textures are scaled up (×4), not floored (a floor flattened them); the house deck fill (and his slab wearing it, avg ~0.9%)
  reads as a stained deck ×11 in the light pass only. Pools carry the type's output (`LX_TYPES.power`); strips 0.22→0.08;
  near-field cap 1.3→0.8; the set's brick texture graded at load (sat ×0.5, lift 1.12: it was sRGB 98/28/14, near pure red);
  show haze 0.6→0.35; **house lights fade to 0.35 at the show's start** (restored on Stop).
- **Calibrated against the cue photos** (8 real cues, side by side, session scratch `shots/cmpA/B.png`): mean luminance now
  within ~0.5–1.8× of Augment3d's renders (was blown out); walls dark, deck templates carry the light. Left as is: Augment3d
  draws the Vipers' CMY cyan/teal as indigo/lavender (its colour model, not the data — the raw rows are C88/Y55 etc.); a few
  specials missing (16 channels with no unit); templates are hard-edged where Augment3d softens by `edge`.
- Checks: show.check() seek-equivalence passes, refs resolve; **lx.check() 301/313 — run it with the show STOPPED** (230
  while the show drives the rig); all lamps at full 62–70 ms a frame front row, Intel UHD 1280×800.

---

## 2026-10-11 (third session, later): THE WHOLE SHOW, AUTO-TIMED — and the desk drives it. UNCOMMITTED on `midtown-lights`

Jack: *"use these files and anything you can find online to make as accurate of an auto timed light sequence for the
entirety of Hamilton"*, then *"make it so on the lighting console i can skip to songs and it brings the cues to the right
place."* **Everything below is in the working tree, uncommitted** (with the projected pools under it).

- **The sources, as found.** The Eos Nomad CSV (Intro file) holds **128 real Binkley cues in 12 islands** (0.5–36.1 opening,
  190–204.02 You'll Be Back, 273–278 Right Hand Man, 300–304 Helpless, 366–368.01 Satisfied, 450–476 Ten Duel → Meet Me
  Inside, 631–638 Non-Stop, 780–784 Say No, 864–894 Room Where It Happens, 1039–1050.1 Reynolds Pamphlet, 1104–1110 Stay
  Alive (Reprise), 1238–1271 World Was Wide Enough) plus 4 utility cues; real levels, CMY/RGB, gobos, zooms, part times,
  follows, and the movers' X/Y/Z focus points. The 110 cue photos are renders of those same cues (index in session scratch).
  The Advanced file has no more cues ("all fixtures … and not much else"). **The playlist and his Guns-and-Ships link are fan
  lighting-design videos on the album audio, not a soundtrack file.**
- **`tools/hamilton-cues.py` → `assets/hamilton-eos.json`** (1.6 MB, deterministic): channels → our fixture types, 280
  groups WITH membership (Group rows' TIME_DATA), 111 presets, palettes, effects, gobo-slot names learnt from labelled beam
  palettes, and the real cues as tracked deltas. Focus: Eos (X, Y, Z) → set-local (X, Z+0.2651, 3.96−Y), the rig's own
  transform, verified against stored tilt within ~1°. Gobo rotation encoding is a medium-confidence guess (mode 25 = index).
- **`assets/hamilton-show.json`** (2.8 MB): **910 cues over the album's 46 tracks (142:13): 124 real, 786 reconstructed**,
  each at (track, seconds). Eight Opus agents, one per stretch of songs, each placed the real cues on their moments and
  filled the rest in Binkley's own presets/palettes/groups, against time-synced lyric data (LRCLIB; **scratch only — no
  lyrics in the repo**, a 4-gram scan run). Every segment re-establishes the exact real state before each real island so
  his cues land as programmed. Spec: `docs/hamilton-cues-format.md`.
- **The show player** (midtown.html, region "THE SHOW PLAYER (agent L)", `MIDTOWN.show`): Show button; album clock from his
  own audio files ("Load album audio…" / folder, matched by disc+track or title; object URLs only) or a silent frame-dt
  clock; Eos tracking, up/down/focus/colour/beam times, part delays, follows, mark (move-in-dark) cues; seek folds every cue
  up to t (check() proves seek = play-through); start/stop restore the rig and camera; Walk keeps the show running.
- **The desk screens** ("THE DESK SCREENS"): the two monitors on the stalls desk are live canvases — LEFT the 46 songs (click
  one: the show jumps to its top with every cue before it folded in, and plays), RIGHT cue list 1 around the live cue (click
  to jump) with soft keys SONG◀ CUE◀ GO/PAUSE CUE▶ SONG▶ STOP. Clicks from orbit by pointer, walking by the crosshair.
- **Pools now fall off as 1/R²** (they were 1/R with a floor of 0.25): at full-show levels 36 ColorBlaze strips flooded the
  set white-orange; Binkley's cue 872 is a dark lavender room. Calibrated equal at a 1.5 m Source Four pool.
- **Checked:** show.check() — seek equivalence passes, every reference resolves, timeline monotonic; lx.check() 301/313
  (unchanged); biggest cue fires in < 2 ms; console clean on load.
- **Known, not done:** effects (238 channel entries) are not run; 16 channels have no rig unit; the engine's aim solver
  lands near-vertical heads up to 20 cm off (the player re-solves; TRAPS); FOH Vipers focused at the Rodgers' corners land
  on Midtown's nearer side walls; the gunshot between 1-15/1-16 and a few other placements are flagged in the segment notes
  (session scratch `ham/out/notes.json`). Suites not run (nothing in `src/`).

---

## 2026-10-11 (third session): the pools are projected — UNCOMMITTED on `midtown-lights`

Jack (two screenshots): *"the light isnt rendering correctly onto surfaces … when something is projected onto an uneven
surface the shape stays flat."* The flat decal pool is replaced by a **deferred decal**: one depth pass of the scenery per
drawn frame (`lxDepthPass`, `LXDEP`), then each lit pool a cone over its depth band that rebuilds the surface under every
pixel and projects the gobo onto it (`LX_POOL_VS/FS`). Gobos now wrap stairs, seat rows, set brick, rails and built
pieces, lit by the angle they meet. The band is fitted by twelve rays across the cone once per aim (`lxPoolBand`, ~0.5 ms a
unit); a travelling head or a zoom fade uses the plane estimate (`lxPoolDepth`). **No shadows:** a surface behind a lit one
in the same cone is lit too. Measured, Intel UHD 1280 × 800, all 304 pools lit: +3–4 ms front row, ~0 back of house.
`lx.check()` still **301 / 313** (the same 12 placement fails); its pool case now checks the projector's centre and band.
`midtown.html` only; nothing in `src/`. Six traps in TRAPS.md. **Not committed: waiting on Jack.**

---

## (superseded by the block above for the pools) 2026-10-11 (night, second session): the lighting engine — `midtown-lights`, six commits on top of `midtown-walls`, UNMERGED

**Read this block first.** `main` is still **`e27fc1e`**; PR #229 still open; `midtown-walls` unmerged (its
question to Jack — one PR or in turn — still unanswered). **Branch `midtown-lights`** is `midtown-walls` +
`c0179c1` engine, `9da710c` panel, `5a2688e` gobos+colours, `768f9a5` check, the preview commit, and the record.
All `midtown.html` (now ~5,300 lines); nothing in `src/`; `the-house.html` / `docs/ARTNET.md` untouched; suites
not run (nothing they check moved; `node` still not on PATH). Jack: *"use opus agents to make the lighting engine
and to check that every light is working with the movements, gobos and colors"*, then *"make a preview of the
lights that shows a bunch of different gobos and stuff."* Five Opus 5.5 agents: G engine (alone), H gobos+colours
and I panel (at once, in worktrees `.claude/worktrees/lx-*` on ports 8091/8092, cherry-picked, removed), J check
(alone), K preview (alone). The recipe is in TRAPS ("the clean way").

- **The engine (`c0179c1`, `MIDTOWN.lx`)** — every one of the 313 units has state `unit.userData.lx`
  `{level, color, pan, tilt, panTo, tiltTo, gobo, goboRot, goboRate, zoom}`; a lit unit draws a lens glow, a point
  in one glare cloud, a volumetric cone (p4's shader, far side only, **budget 120 cones a frame**, strongest in
  view), a pool decal where the beam lands (a ray stepped through the walk's collision grid, cached, recast on aim
  or scene change — all 313 in ~36 ms) and the brightest four get real SpotLights (two shadowed, static maps; the
  house scan is unlit so real light shows on the set and built pieces only). Movers (41 Viper, 24 X4, 6 VL3500):
  pan on the yoke, tilt on the head, both LOD levels, at the type's speed unless `snap`; `lx.aim(sel, point)`.
  Fades, travel and gobo rotation in `lxTick(dt)`; idle still draws nothing. API: `select` (channel, "1-20",
  position, type, id, "all", array, predicate), `set/get/all/blackout/work/haze/aim/beam/refresh/groups/perf`.
  **Cost, Intel UHD, 1280×800: dark 31/24 ms (front/back), everything at full 54/34.** `LENS_GLOW` retired: a
  dark unit reads dark; the load picture is unchanged (work light 1, rig at 0).
- **Gobos and colours (`5a2688e`)** — 16 canvas-drawn patterns (512², seeded) named for the show's beam palettes:
  Open, Construction, Linear, Dust, Cobble stone, Alpha, Vignette, Nite sky, Brains, Pebbles, Blocks, Tribal,
  Leaves, Slot, Square, Pickup sticks; the beam shows the shafts and they turn with the pool. Wheels: Viper
  rotating 6 + framing + diffusion; VL3500 FX 3; **template Source Four systems from Binkley's magic sheet**
  (111–125 and 241–249 Pickup sticks, 131–149 Blocks, 201–208 Alpha, 291–298 Linear, Lustr 160–179 Construction,
  181–192 Pickup sticks) hold their template at load; everything else open. Colour per type: gel (3200 K, warms as
  it dims; `set({gel})` re-gels), Lycian xenon boomerang, CMY+CTO+colour wheel for Viper/VL3500 (R26 within 0.014
  of the gel), RGB/RGBW/RGBA/7-colour LEDs (`rgb`, `emitters`), hazers none. `GELS` extended to all of Roscolux
  01–99 plus the Lee codes the show names. `lx.wheel(sel)`, `lx.gels()`.
- **The panel (`9da710c`, Lights button, `MIDTOWN.lxPanel`)** — select by position (38), type, channel
  field ("1-20, 41"), or **click a fixture in the view** (shift adds), gold outline on the selection; level with
  fade, gel dropdown + colour picker, gobo dropdown from the unit's wheel, rotate rate, pan/tilt (movers only),
  snap, zoom, Aim at view centre; All on / Blackout / Work / Haze; **Step through** (one unit at a time with its
  label, Play off frame dt); **Looks** saved to localStorage, recall with fade, export/import. Keys `+ - [ ] 0`.
- **The check (`768f9a5`, `MIDTOWN.lx.check()`, panel "Check all" / "Watch all")** — measures what draws (lens,
  glare, cone matrix+uniforms, pool map, real lights), re-finds every landing point against all 159k triangles,
  drives travel by calling `lxTick(1/60)` by hand, restores the rig exactly, ~2 s. **301 / 313 pass at real
  size, 302 fitted.** Every fail is placement, not engine: **3 Source Four shins (ch234, 239, 240) have their lens
  under the deck** (clamped 0.33–0.39 m, lens 0.39 m below the clamp — sit them yoke-up or lift 15 cm) and **9
  ColorBlaze-48 strips (ch616, 715, 632–637) sit under set rails**. Notes, not fails: 55 strips draw no cone;
  Lustr can't make pure green/blue; 7 Apron Electric movers (ch24, 41–46) hit the house bridge when aimed at
  centre; 6 beams into nothing (3 Mini-10s rising through the cut back wall, 3 strips behind the scan). Fixed by
  J: **house booms SL/SR Boom 1 re-aimed after their wall move** (20/20, dot 1.0000) — they now land on Jack's
  baked proscenium posts box 17/19 (the booms hang inside the posts' depth; Jack's call: booms downstage of z −1.6
  or narrower posts); SL Boom 4's tower stepped clear of ch222's lens. Known: additive pools wash to white when
  many overlap; the gobo canvases draw on first use (Dust 342 ms).
- **The preview (`817ad37`, Preview button, `MIDTOWN.lxDemo`)** — a scripted show on the real rig: **12
  scenes, 132 s, looping**, each as data (view, haze, timed steps; ops set/aim/row/ring/work/haze/cam/fx):
  Curtain up, Gobo parade (nine Vipers, nine patterns on the deck), Every pattern every unit, Templates on the
  brick and deck, VL3500 soft patterns, Ballyhoo in haze, LED chases, Fan and ring, CMY mixing, Dimming gel
  against LED, Strips on the set, Finale with followspots and blackout. Prev/Play/Next/Stop in the panel; Stop
  restores the rig and the camera exactly; entering Walk stops it; heaviest scene 42 ms on the Intel chip. Built
  for Real size (aim points are 1:1 world). Contact sheet and one picture a scene in this session's scratchpad
  `agent-k/`. Rough: the wall scrapes land high behind the electrics; the VLs on the brick are steep from the
  10th Electric; the pane runs it at ~10 s per 12 (dt cap) — a full window is real time.
- **Still:** fixture GLBs untracked (38); PR question; the body; the cues ("timed against what"); headset.

---

## NEWEST — 2026-10-11 (late night): walk, lobby, the house cut for the set at 1:1, his first walls baked, the rig trimmed — `midtown-walls`, five commits, UNMERGED

**Read this block first.** `main` is **`e27fc1e`** (#228 merged by Jack: the rig, rigging, frame rate,
booth and desk). **PR #229 (`midtown-walk`, one commit `edd07eb`) is OPEN and unmerged.** Branch
**`midtown-walls`** carries it plus four more — `0be6c01` lobby, `b0028db` walls cut, `1fba90a` bake 3,
`af02c26` rig trim (cherry-picked from a worktree) — and the record commit. All `midtown.html`;
nothing in `src/`; `the-house.html` / `docs/ARTNET.md` untouched; suites not run (no `node` on PATH
this session; nothing they check moved). Linear chain: walk → lobby → walls → bake → rig; the question
put to Jack and unanswered: close #229 and open ONE PR from `midtown-walls`, or merge #229 and open the
rest in turn. **Every agent this session was Opus 5.5 by his instruction** ("use opus agents"); five
of them, one at a time except the last two (bake in the main checkout, rig in a worktree — the two
regions did not overlap and the cherry-pick was clean; the combined page loads with every round's
console line and no errors).

- **Walk (`edd07eb`)** — Jack: *"walk around like i do in the palace or like how a roblox player does."*
  First person on the Palace's numbers (3.1 / 6.4 m/s, jump 4.6, gravity 13.5, eye 1.6): pointer lock
  on a click in Walk mode (Esc frees; the pane refuses it, so after two refusals drag-to-look carries on
  silently), floors and walls from the geometry via one 0.5 m grid of the house + set + rig structures +
  booth + desk + lobby + proscenium + baked pieces (159k tris, ~30 ms, rebuilt after a cut / Real size /
  Rig toggle / restore). **Step-up 0.40** (0.62 climbed the seat rows), radius 0.25, **crouch on C**
  (the fitted galleries were 1.5 m off the deck), the stage lip needs the jump. `MIDTOWN.player`,
  `MIDTOWN.walk.{step,setMode,groundAt,grid,perf}`. Walk cost 0.02–0.05 ms a frame.
  **Jack's two follow-ups, NOT done, paused on his "wait a second": *"the person is too tall, and
  also give them a body."*** (Palace eye is 1.68; Roblox is ~1.4 m; a visible body + maybe third
  person.) A worktree for it was made and later removed; start fresh off the branch tip.
- **Lobby (`0be6c01`)** — *"add a lobby to the building."* 19.8 × 7 m room behind the back wall
  (z −15.12…−22.12), floor y 0.875 — **the rear doorways are passages from the side aisles at y
  0.85/0.90, NOT the cross-aisle's 2.10** (house right x −4.77…−3.57, house left 3.78…5.08, heads
  ~3.0, the scan stops at z ≈ −14.0). Box office house right, bar house left, six glazed entrance
  doors with a canopy, the booth boxed in as a projection room, posters, stanchions, benches, lit
  STALLS signs, carpet; lit materials + 30 glowing discs + 3 shadowless spots (`MIDTOWN.lobby.lights`
  to switch off). `v-lobby` button. 15 meshes, 4,962 tris, +13–16 draws when in view, 125 ms load.
- **Walls cut (`b0028db`)** — *"lets change the theater walls so we can fit the hamilton set at full
  size … have an opus agent cut out the area of the walls that needs to be, then i will put walls in
  that are needed on my own."* **Real size is now the default** (`placeSet(1)` on load; both buttons
  still work and each rebuilds the collision grid and the rigging). The set at 1:1: x ±8.66 (17.31 m),
  y 0.80…10.17, z −0.35…9.72 — **0.82 m through the back brick and 0.72 m past the deck's end**;
  ±6.82 downstage of z 1.5 (its own portal posts at x ±6.5…6.7 on the arch plane). Four `WALL_CUTS`
  (world boxes, applied through `applyCut` after his/booth/desk cuts, listed on the console): the
  stage house x ±9.46 from z 0.5 to 10.72 up to the fly roof (side walls and back brick gone; the
  outer walls at |x| 9.5–9.6 and the fly walls stay); the front over the deck x ±7.62; the piers'
  feet in the stalls; the page's whole proscenium frame (the set passes through all three pieces).
  `wallSplit` first splits every house triangle a box would only partly take (fill planes are two
  triangles the size of a wall). **Cuts and copies now record the set scale they were made at**
  (`set: 1`; old ones count as fitted) and re-seat to it when re-applied. `MIDTOWN.walls.check()`
  prints: house tris left in the boxes 0, touching the set 0, 93 front-corner tris kept on purpose.
  **Problems he will meet building:** stage right has NO deck downstage of z 3.9 (`deck_fill` runs
  x −5.8…5.6 there; a 0.86 m drop to y −0.06 under the set at x 5.6…8.66); the set's back overhangs
  the deck; the viewpoints "On stage" / "Stage-left wing" may start inside set geometry at 1:1.
- **Bake 3 (`1fba90a`)** — his `Downloads\midtown-build (3).json` (copy in this session's scratchpad):
  13 pieces → 3 exact duplicates dropped (the doubling) → **10 baked, all "(bake 3)"**: the black
  panel, two rail blocks (`box 6b` is his moved one at x 4.34), two 10 m posts at x ±6.2…6.4 on the
  arch, a rail, a 17.5 m header at y 8, **a 42 × 39 m floor slab in deck_fill, top y 0.845, z −1.4…40.9**
  (4.5 cm above the deck — the set's feet are buried; it runs far past every wall), a shelf, and
  `copy 24` (a set stair copied at 1:1 to x 4.27 z 2.0, turned 90°). **He had pressed "Edit the baked
  pieces", so the pieces REPLACED the old bake**: gone are the inner timber proscenium (box 1–3), box 5,
  the bake-2 rail strip and `copy 5 (bake 2)`. **Cuts were APPENDED, not replaced (8 baked)**: "Edit the
  baked pieces" never lifts cuts, so an export cannot drop one; old cuts 3–4 still take the scan's
  house-left apron stair under his block. His two new `set: 1` cuts remove nothing now (they deleted his
  own pieces mid-session). The set passes through his posts (1133 / 1506 vertices), the panel (529),
  the slab (628), the shelf (128) — kept as placed. **Tell him Clear all before reloading.**
- **Rig trim (`af02c26`)** — *"the lights got raised too high so fix that."* At 1:1 the rig hung at
  its Rodgers heights (electrics y 9.61, FOH 7.3–9.6 through the 8.05 ceiling, 64 units outside the
  house). `RIG_TRIM` (world metres, real size only; fitted keeps the scaled file + the old 0.75 m FOH
  Electric drop, now `RIG_FIT_DROP`): **FOH Electric y 7.20 at z −7.05; Apron Electric y 7.20 moved
  to z −5.20** (its real line at z −2.6 collides with the scan's own lighting bridge at every height);
  **FOH Truss y 7.20 at z −12.0, x ×0.6** (the side-wall soffits); **the ten electrics level at y 7.60**
  (6.8 m over the deck, 3.1 m over the gallery); booms, floor booms and on-set units untouched;
  followspots on the booth stands. Every fixed-focus unit that moved is **re-aimed at the point where
  the file's beam met the deck** (77 units, dot 1.0000); movers hang head-down and need nothing.
  `rigPlace` runs inside `placeSet`, so **Set fitted / Real size rebuild booms, trusses, grid and
  towers against the cut house** (booms find the kept outer walls at x 10.0 / −9.56 — fitted they
  move ~5 m out to them, odd-looking; cables end on `house_ceiling` 12/12, hangers on `fly_roof`
  12/12, grid pipes stop 0.1 m short of the fly walls or the set's piers). Rigging raycasts batched
  (`trussRays` via `towerNear`): a rebuild 1.3 s → 150 ms. **Outside the house now: 13 units, all
  on the set past z 9.1 where the back brick was, and SR Boom 8's tower; house-side zero.** From
  the back row the electrics still hide behind the room's own bridge. SR Boom 2/3/4 towers stand
  down to y −0.06 (no deck there). `MIDTOWN.rigTrim`.
- **Cues: still not started, still one question** (recording, or album lengths with no audio).
- **Still untracked, by his instruction: `assets/fixtures/*.glb` (19) + `lod/*.glb` (19).** Pages shows
  no rig until they are committed. The suite's one red is them.
- **Local serving:** `.claude/launch.json` `the-house` on 8080 serves the repo root; a server from an
  EARLIER chat still holds 8080 (`preview_start` says so; just navigate — same files). A worktree
  needs its own port entry in its own gitignored `.claude/launch.json` and a copy of the fixture GLBs.
  Full-size frames: `renderer.setSize(1280,800)`, render, `toDataURL`, POST to a local receiver.
- **Headset run still owed.**

---

## NEWEST — 2026-10-11 (night): the rig is hung, rigged, lit for the eye, and fast enough — PR #226 grew four commits

**Read this block first.** `main` is still `692f3d3`; **PR #226 (`midtown-preview`) is open at
`15703ae`**, twenty commits, UNMERGED. Nothing in `src/`; the suites were not run (nothing they
check moved; the one red is still the untracked fixture GLBs).

- **Jack's ask was "do all the lighting cues timed correctly"**, with resources in his Downloads
  (`hamilton lighitn resoucses\` — the THPP cue photos (112), focus charts, magic sheet, ML preset
  charts, the project guide; a YouTube playlist link in `more hmailton things.txt`; the Eos Nomad
  CSV; both zips). **He redirected: "first put in all the lights in the correct spots so I can
  see what they look like."** That is done. **THE CUES ARE NOT STARTED.** The open question I
  put to him and he has not answered: timed against WHAT — (1) a recording he supplies, the
  Beetlejuice route (audio clock, exact), or (2) the cast album's track lengths with no audio in
  the game. Ask again before building.
- **What landed, in order (all `midtown.html` unless said):**
  1. `b39f86e` **the rig**: `tools/hamilton-rig.py` reads the ETC pack's `Scene/Patch.json` +
     `Fixture.json` (extracted in this session's scratchpad; the pack lives in
     `Downloads\Hamilton THPP\*.esf3d`, NOT the repo) → `assets/hamilton-rig.json` (committed,
     313 units, non-commercial like the set, declared in `assets/README.md`). Frame: the set
     GLB's own (Y up, deck 0, **upstage −z, house +z**, stage left +x); ETC (x,y,z) → GLB
     (x, z+0.2651, 3.96−y). 161 Color Force cells merged to 7 six-foot + 4 four-foot battens +
     44 single cells (drawn as ColorBlasts). Three Lycians and three hazers placed by hand.
     The page hangs one model per unit under the set's root (so Set fitted / Real size apply),
     `quat` split into yaw on the unit and tilt on the head, movers head-down, lens tinted by
     gel, a Rig toggle. Units carry `userData.{id,channels,type,label,gel,position,hung,placed}`.
  2. `b7776ce` **the rigging** (three of his screenshots): SL/SR Boom 1 moved onto the Midtown
     side walls on boom pipes with brackets (their bottom metre hangs over the exit-door
     recess, unsupported); 12-inch box trusses on four cables for Apron Electric, FOH Electric
     (dropped 0.75 m real to clear a ledge in the scanned ceiling) and FOH Truss; a pipe grid
     wall-to-wall at the electrics' height with 12 hangers to the fly roof; 13 floor towers for
     the wing booms (SL Boom 5's top clips `ham_brick`, SR Boom 6 is 0.14 m from `ham_iron`).
  3. `5d57fde` **the frame rate** (he said it lags): measured on the Intel UHD — **his Chrome was
     not on the RTX 5060**; he has since set Chrome to High performance in Windows (screenshot
     seen), unverified. Code side: overhead specials cast no shadow, static shadow maps,
     pixel cap 1 (adaptive to 0.8), render on demand (idle = 0 draws), `compileAsync` behind
     the loader, cuts applied once, and **LOD**: `tools/blender/fixtures_lod.py` →
     `assets/fixtures/lod/*.glb` (800 tris, 1,000 for movers; hang point pinned; checker
     `--lod`), swapped in past 7 m. GPU ms Back/Front/Fly 24.9/41.3/28.1 → 16.2/22.5/17.4, then
     the LOD halves the rig's share (1.46M → 467k tris). The page prints its GPU on load.
  4. `15703ae` **house works**: a followspot booth cut into the back wall (5.9 m window between
     the alcove jambs; room behind; spots on stands, re-aimed) and a lighting desk on a riser
     where rows 7–8 of the centre block were (tech table, Eos-style console, monitors, chairs).
     Their delete boxes are `BOOTH_CUTS` / `DESK_CUTS`, applied with `BAKED_CUTS`.
- **STILL UNTRACKED, by his instruction: `assets/fixtures/*.glb` (19) and now
  `assets/fixtures/lod/*.glb` (19, 1.0 MB).** The page fetches both; on Pages after the merge
  the rig will not appear until they are committed. **Ask him.** The suite's red case is them.
- **Known rough edges for his eye:** eleven downstage-lip units and the first booms float over
  the house floor in front of the deck edge (the real stage is bigger); the up-lighters under
  the gallery sit a hand's width under it; Real size throws the FOH rows and the booth's spots
  out through the walls (expected — the rig scales with the set, the house does not).
- **Cue resources, for the next step:** the Eos CSV has 128 cues in 13 islands with labels
  ("+++1/7"BeBack"", "Burr Enters", "Helpless", "Satisfied 3 pools", "Non Stop"…), fade/delay
  per part, follow/hang — a fifth of the show; the cue photos PDF (112 pages, "CUE n" labelled,
  render with pymupdf at dpi 40 to look). The game's HAMILTON plot (p5f `plotHamilton`, 20
  looks, `follow`-driven from the p7 script) is the thing to replace or extend; Beetlejuice
  (p5h, `at:` seconds off `BJ_AUDIO`) is the timed model. The preview page has no cue engine
  at all — the cues either go into the game (p5f) or the preview grows a player.
- **Local serving:** `.claude/launch.json` `the-house` on 8080; the pane is ~500 px wide, so
  screenshots are small — agents rendered the canvas at 1600×900 and posted it to a local
  receiver instead. Chrome at the same URL is the better window for him.
- **Headset run still owed**, as below.

---

## NEWEST — 2026-10-11 (end of session): the Midtown preview round is in PR #226, 16 commits, UNMERGED

**Read this block, then the evening block below it only for the placement numbers.**

- **`main` is `692f3d3`** (#224 `hamilton-set` and #225 `fixture-models`, both merged by Jack). The
  post-merge protocol has NOT been run for either. **PR #226 (`midtown-preview`) is open**:
  https://github.com/Jackscreations21/gms-theater-game/pull/226 — on Pages after merge at
  `https://jackscreations21.github.io/gms-theater-game/midtown.html`.
- **What `midtown.html` is now:** a standalone preview (NOT the second game) of the Midtown scan
  with the Hamilton set on its stage, plus a **build mode** he used all evening:
  - the house unlit and dimmable, the set lit (hemisphere, two FOH spots, two over-stage specials),
    orbit or drag-to-look walk, six viewpoints, `window.MIDTOWN` console handle;
  - the proscenium moved to the front of the stage (z 0.20) and rebuilt as a real frame in the wall's
    own grey (1.5 m members, 0.6 m deep) round an opening fitted to the set; the set scaled 0.62
    ("Real size" toggle shows 1:1 through the walls); the scan's hanging iron over the stage cut
    (`cutBeams`); **no built stairs** — three placements were wrong for him, so he got tools instead;
  - **Build:** add box / cylinder / sphere / plane / wedge where the view looks; texture dropdown of
    the set's and house's materials plus colours; image by picker or drop; tiling, tint; gizmo
    move/rotate/scale (G/R/S), numeric fields, snap, duplicate, delete; **Area box**: Copy area (C)
    makes what is inside a new piece, Delete area (Enter) cuts it away, Undo delete; autosave to
    localStorage; Export / Copy / Import JSON.
  - **Baked so far:** `BAKED` 8 pieces, `BAKED_CUTS` 6 — his inner timber proscenium (two posts and a
    header), a black masking panel stage left, two rail-grain corner blocks over the apron corners
    where his cuts removed the scan's little stairs, a rail strip house left, and the set's own
    stair COPIED to house right (x 2.13 / z 2.05, turned 90°) with two tidy-up cuts.
- **THE BAKE RECIPE (works, run twice):** he exports (`C:/Users/jackf/Downloads/midtown-build*.json`)
  or pastes JSON → append its `pieces` to `BAKED` and its `cuts` to `BAKED_CUTS` in `midtown.html`
  (session names restart at "box 1": suffix them, e.g. "(bake 3)") → reload, look, commit. **Replace
  instead of append** only if he pressed "Edit the baked pieces" before exporting (the export then
  already holds the old ones). A copy's `src` box is taken on the pristine geometry at load, before
  any cut — safe unless a later cut overlaps a copy's source. **Tell him to Clear all** after a bake
  or his browser shows the pieces doubled.
- **Suites on this tree: 20/21** with the portable Node. The red is `beetlejuice`'s on-disk index
  check tripping on the **19 untracked `assets/fixtures/*.glb`** (his "don't commit the files yet"),
  not on `main` or the branch. Nothing in `src/` changed all session.
- **Local serving:** `.claude/launch.json` (gitignored) has `the-house`, Python http.server on 8080
  over the repo root; `preview_start` it. **It dies whenever the Browser pane is closed** — restart
  before navigating. Pointer lock fails inside the pane; a normal browser window is fine.
- **Headset run still owed**, as below.

---

## NEWEST — 2026-10-11 (evening), the Midtown preview page (branch `midtown-preview`, PR #226 OPEN)

- **`main` is `692f3d3`: #225 (`fixture-models`) MERGED by Jack**, on top of #224. The post-merge
  protocol has NOT been run for either (rebuild byte-identical, map, 21/21, delete the branches).
- **Jack asked to go into "the new one with the 3d model theater and the hamilton set."** That game is
  not built (FUTURE.md PART 2), so a PREVIEW page was made: **`midtown.html`** at the repo root — the
  Midtown scan drawn unlit with `assets/hamilton-set.glb` seated on its deck, turned to face the house,
  lit, walk or orbit. **PR #226**, https://github.com/Jackscreations21/gms-theater-game/pull/226. On
  Pages after merge: `https://jackscreations21.github.io/gms-theater-game/midtown.html`.
- **Three calls he made watching it, all in the page, none in the GLB:** the proscenium moved to the
  front of the stage (z 0.20 from the GLB's 2.30, the ceiling/skirts/fly walls/roof stretched to meet
  it); the proscenium rebuilt as a real FRAME round the set (the GLB's flat grey planes read as "no
  proscenium" when widened, and a dark lit frame read as nothing at all — now 1.5 m piers and
  header, 0.6 m deep, in the proscenium wall's OWN unlit grey, opening x ±5.6 / top y 6.9); and the
  "metal beam" over the stage cut out — it is the SCAN's hanging iron (pipes, a cross bar, two beams
  on cables, left upstage of the wall below the fly cut), not the set's: `cutBeams` drops every scan
  triangle with a vertex in a box over the stage. **Two misreadings cost rounds:** "fill in the
  stairs on the front of the stage" meant the SET's side staircases — the gallery is a U whose two
  arms end in railed platforms at x ±3.5..4.5, z 0.5..2.0, gallery floor y 3.00, and the ETC model
  gives them no way down — so `buildSideStairs` adds an open flight each (treads on stringers, rails,
  12 risers, plank material) down toward centre stage; not the scan's corner steps, which got blocks
  for two rounds and are now back untouched. (`ham_iron` is only the posts' foot blocks.) The set is scaled 0.62 to clear the scanned side
  walls, with a "Real size" toggle. If the second game wants these in the asset itself, `tools/blender/midtown_theatre.py`'s
  `PROS_Y`, `OPEN_X0/X1` and `OPEN_TOP` are where they go.
- **`midtown.html` has a BUILD MODE** (Jack: *"make something where i can add geometries and use a
  dropdown to choose their texture and i can move and resize them … make it so you can see the
  things i add then add them to the actual geometry"*). The Build button opens a panel: add box /
  cylinder / sphere / plane / wedge (they land where the view is looking), a texture dropdown of the
  set's and house's own materials plus flat colours, an image picker or an image dropped on the
  view, tiling and tint, a move/rotate/scale gizmo (G/R/S) with numeric position/size/turn fields,
  snap, duplicate, delete. Autosaves to localStorage; Export JSON / Copy JSON / Import.
  **A DELETE BOX** too (*"a delete box where you scale it over an area then select confirm and it
  gets rid of it"*): Place delete box → a red translucent cube on the gizmo → Confirm (or Enter)
  drops every triangle whose centroid is inside it, from the scan, the fills, the set, the side
  stairs, the proscenium, and removes pieces centred inside; Undo last re-applies the rest from the
  meshes' original indices. Cuts are saved, exported as `cuts`, and bake into `BAKED_CUTS`.
  **THE BAKE RECIPE:** he exports (`C:/Users/jackf/Downloads/midtown-build.json`) or pastes the
  JSON; the agent pastes its `pieces` into the page's `const BAKED = [...]` and its `cuts` into
  `BAKED_CUTS`, and commits — they are
  then scenery for everyone, and "Edit the baked pieces" lifts them back into the editor.
- **Suites on this tree: 20/21.** The red is `beetlejuice`'s on-disk index check tripping on the **19
  untracked `assets/fixtures/*.glb`** still sitting in the working tree (his "don't commit the files
  yet") — not `main`, not the branch. It goes green the moment they are committed or moved out.
- **Local serving:** `.claude/launch.json` (gitignored) has a `the-house` entry — Python's http.server
  on 8080 over the repo root; `the-house.html` and `midtown.html` both need http, not file://.
  Pointer lock fails inside the app's browser pane; a normal browser window at the same URL is fine.
- **Headset run still owed**, as below.

---

## NEWEST — 2026-10-11 (later), the fixture models and the Hamilton-game brief (branch `fixture-models`)

- **`main` is `1ca0a14`: #224 (`hamilton-set`) MERGED by Jack.** The post-merge protocol for
  it has NOT been run (rebuild byte-identical, map, 21/21, delete the branch) — do it first;
  local `main` was still at `4125f6f` when this session started.
- **Jack's brief for a second game** (his words, his four answers) is in **FUTURE.md PART 2
  "THE HAMILTON GAME"**: same repo, second HTML; Midtown house + Hamilton set; better-looking
  light, the full Broadway rig, real fixture models, "a better way to control the lights";
  spatial PA sound, sound fired from the desk, a mixer. **Not specced, no ruling letters
  issued** (next is FF). The engine split is surveyed in
  `docs/hamilton-game-dependency-survey.md`.
- **The fixture models are DONE and in the working tree, NOT committed** (Jack: *"download,
  but don't commit the files yet"*): `assets/fixtures/*.glb`, 19 files, 4.8 MB, every one
  `base > yoke > head > lens` (or `head > lens`), budgets met, `node tools/fixtures-check.js`
  **0 failures**, loaded and posed in three.js r128. **The sources are not in the repo**: the
  17 raw 3D Warehouse GLBs plus `picks.json` are in `C:\Users\jackf\Downloads\fixture-sources\`
  (and re-downloadable — `assets/fixtures/README.md` has the URL pattern). The tools ARE on the
  branch: `tools/blender/fixtures.py` + `fixtures.json` (the rules, one entry per fixture),
  `fixtures_sheet.py` (colour-coded check renders), `tools/fixtures-check.js`.
- **The rig and the picks:** `docs/HAMILTON-RIG.md` (every fixture, count, source, author,
  tris); the equipment list verbatim in `docs/hamilton-equipment-list.txt`; the chooser he
  picked from is https://claude.ai/artifact/YFMCghYoCM12CRC1NRoaqz (his picks are its
  `choices` collection).
- **Fixture follow-ups, small:** the Source Four is one body (the plot wants six barrel
  lengths); the X4 is the X4 not the XL (same shape, 20% bigger — scale it); five are
  stand-ins (Stickup, Mini-10, ELAR, PixelPAR, Lycian) because no model of the real thing
  exists; the 3D Warehouse licence allows use in the game but not redistributing the files
  alone; the VL3500 is ETC's, non-commercial.
- **Node is still the portable copy** in the OLD session scratch
  (`…\fcf2674c-d68f-48b7-816b-bbf0793541d1\scratchpad\node_dl\node-v24.21.0-win-x64\node.exe`);
  it ran the check. `winget install OpenJS.NodeJS.LTS` — Jack runs it. The suites were NOT run
  this session (nothing in `src/` changed; `the-house.html` and `docs/ARTNET.md` untouched).
- **Headset run still owed**, as below.

---

## NEWEST — 2026-10-11, the Hamilton set (branch `hamilton-set`, RULING FE)

- **Where it stands: committed (`f4d9a90`) and pushed, PR NOT YET OPENED.** The
  permission layer refused the GitHub API call, so Jack opens it from
  https://github.com/Jackscreations21/gms-theater-game/compare/main...hamilton-set
  (the body is in the chat of 2026-10-11). Until it merges, `main` is `4125f6f`
  with the red `beetlejuice.js` case below. After the merge: rebuild `main`
  byte-identical, 21/21, delete the branch both sides — the post-merge protocol.
- **RULING FE (Jack, 2026-10-11): "can you put the set model onto the stage."**
  HAMILTON is now *modelled on the production* — AV's repeal of AO extends to
  it, scoped to it; the other three shows still carry the interpretation note
  and `beetlejuice.js` pins that. The set is the model ETC ships inside the
  *Hamilton Programming Project* (Rod Lemmond's model of David Korins' design,
  **non-commercial licence** — see `assets/README.md`).
- **What landed:** `assets/hamilton-set.glb` (65,949 tris, 5 materials, 6.8 MB),
  built by `tools/blender/hamilton_set.py` from the `Hamilton Full Set` COLLADA
  inside the show file — the theatre's proscenium, borders and floor stripped,
  walls brick, flats timber, 400k CAD triangles planar-dissolved to 66k. `p5i`
  `loadHamiltonSet` fetches it at show load and `hamApplyModel` seats it
  (metres, deck at 0, x centred, `HAM_MODEL.z` −3.91 so the model's turntable
  centre lands at **z −2.96**); the hand-built structure is now the **stand-in**
  (`SHOW.hamStand`, p5f) and leaves with its walkables and lanterns. The
  revolves moved and shrank to the real turntables, **r 3.82 / 2.59 at z −2.96**,
  measured off the model's own floor rings; `HAM_MODEL.tt` and `REV` are held
  together by a test. New cases in `tests/sets.js` (five) plus a node-side read
  of the GLB's budgets; `beetlejuice.js`'s on-disk check now also accepts
  `HAM_MODEL` and README-declared third-party files.
- **Not done, deliberately (FUTURE.md PART 2):** the model is scenery only —
  no `walk_` meshes, so the galleries and stairs are not climbable (a 66k mesh
  cannot go on `WALKABLE`; it wants low-poly walk boxes); the lanterns went
  with the stand-in; textures are generated brick/grain, not photographs; the
  rig, the cues and the Art-Net patch are untouched.
- **Finding: `main` had a red suite since #221.** `beetlejuice.js` "every
  delivered .glb is in the index …" fails on `midtown-auditorium.glb`
  (committed, fetched by no manifest) and nobody saw it because that round had
  no Node. Fixed in this branch by letting `assets/README.md` declare a
  not-yet-wired file; the lesson is in TRAPS.
- **This machine now has Node**, portable, at
  `C:\Users\jackf\AppData\Local\Temp\claude\…\scratchpad\node_dl\node-v24.21.0-win-x64`
  (session scratch — install it properly with `winget install OpenJS.NodeJS.LTS`,
  and run that yourself, see TRAPS "the sandbox"). `tests/npm install` is done.
  **Eos Nomad v3.3.10 is installed** (`C:\Program Files\ETC\EosFamily\v3\Eos`).
- **The Hamilton cue data is exported:** `C:\Users\jackf\Downloads\The Hamilton
  Programming Project - Intro - Rev A.csv` — 128 distinct cues in 13 islands,
  111 presets, 659 channels, 200,900 level rows. **It is not the whole show**
  (about a fifth of the cue stack); FUTURE.md PART 2 has the breakdown and
  what a reconstruction would mean. Nothing of it is in the repo yet.
- **Headset run still owed**, as below.

---

## NEWEST — 2026-10-10, read this before the Art-Net sections below

- **`main` moved on after the Art-Net record below was written:** #217
  (`artnet-desk-record`), #218 (`build-load-gate`), #221 (`midtown-scan`) and
  #222 (`midtown-holes`) merged; `main` is **`7d27c9d`**. The Art-Net sections
  below were not updated for #217/#218. Read those two PRs before trusting the
  Art-Net numbers below.
- **#222 was merged with only its first commit.** The markup tool and Jack's two
  applied rounds landed on the branch after the merge and never reached `main`;
  the `midtown-rounds` PR carries them. Until it merges, `main`'s GLB still has
  the speakers and the vent-recess holes.
- **New machine:** Jack's, at `C:\Users\jackf\OneDrive\Documents\gms-theater`.
  Git 2.55 and Blender 5.2 are installed. **Node is not**, so the suites cannot
  run here yet (`winget install OpenJS.NodeJS.LTS`). The relay path below
  (`C:/Users/patri/...`) is the OLD machine.
- **`midtown-scan` (#221) and `midtown-holes` (#222) are merged; `midtown-rounds`
  is the rest of the second pass** (assets and tools only, all three). Nothing in
  `src/` changed, so `the-house.html` and `docs/ARTNET.md` need no regenerating.
  - `assets/midtown-auditorium.glb` is a CC BY scan of a real auditorium, edited
    into a theatre house: a solid proscenium, a fly tower, a brick back wall and
    filled holes.
  - The second pass closed what an inside-out raycast audit found (a void east of
    the stage-right wall, slits under the wall-top fills, wing-door lintels, wall
    bases), deleted the shards the first pass missed, and matched the tiled brick
    to the real one. **Escaped rays: 4807 → 501, of which 498 go out through the
    two rear doorways Jack chose to leave open.**
  - Rebuild it with `tools/blender/midtown_theatre.py`. Walk it in
    `tools/midtown-viewer/` (re-exported). **Jack marks it up at
    https://claude.ai/artifact/LwSoKjQ911xowE1DQa4syv** (`markup.html`: delete a
    region, retexture a panel, pin a note); his edits land in that artifact's
    `edits` collection — **read it at the start of the next scan session and
    apply them in the script.** Recipe in HANDOFF. **Two rounds are already
    applied and cleared** (speakers out, piers widened, vent recesses closed),
    so the list starts empty.
  - The full record is in HANDOFF.md, the two "DONE — 2026-10-10" blocks.
- **Not wired into the game.** Three decisions are Jack's (FUTURE.md PART 2,
  "Realism"):
  1. Which venue it becomes.
  2. The fly rail for its new fly tower.
  3. Merging its 16 materials down to the 8 budget.

  The rest of the realism options list is there too, unchosen.
- **The headset run is still owed**, as below. Nothing in this session touched
  the game's rendering.

---

## (2026-08-16) ART-NET: THE ROUND IS CLOSED — RULINGS EL–FD, NOTHING OPEN

## READ THIS FIRST

The desk drives the Palace, **and the Art-Net round is finished** — #200 to
#216 with no gaps, of which #206 is an extra written mid-round. **Nothing is
open, nothing is shelved, and no branch is unlanded.** `main` is at
**`a3eecce`**, the suite count is **21**, rulings are at **FD**, and the
cache-bust is **`?v=31`** from here.

**RULING FD is the last ruling in** (#214), and it came from Jack at a desk with
the channel file open: *"make it so the list isnt generated it is just what it
is for beetlejuice and make it easier to read."* **The "not generated" half was
put back to him** — that was one instruction with two halves pulling opposite
ways, because un-generating the file removes the only reason it can be
trusted — **and he chose reformat-and-keep-generated.** So `docs/ARTNET.md` is
now a six-block patch sheet, 326 flat lines down to 219, and it is still
measured. See "HOW TO ACTUALLY RUN IT" below.

**#216 carries it into a spreadsheet.** `node tools/artnet-map.js --csv` emits
the same measurements in the three columns of his Google Sheet — `channel
number,what is does,where it is`, **header copied verbatim, typo and all,
because it is HIS sheet and a column whose name does not match will not line
up when he pastes.** `where it is` is the column the data never had, and it is
read off the built rig (`f.pos`, `f.ls`), so a lantern that is re-hung moves in
the sheet too. **It is a flag, not a third committed file** — see the open
decision at the bottom of this file.

**#213 (RULING FC, the proscenium neon) went in before it** — it was the one
branch this file previously listed as finished-but-unpushed, and the three
things it still owed are all discharged:

1. **It is merged.** Post-merge protocol run: `main` rebuilds byte-identical
   (`94084f5e`), `node tools/artnet-map.js` reproduces `docs/ARTNET.md`
   exactly, 21/21 on the merged result, branch deleted local and remote.
2. **The unreviewed post-review fixes were reviewed, and the review found a
   real hole.** The fix for the first review's finding had widened the gate
   from the portal to a `deskOwnsIt` that **also gates `HOUSE.house`** — a
   second behaviour change with **no assertion behind it**. Two assertions
   added, both on a sentinel, both negative-checked and both firing. The
   general lesson is now in TRAPS: **a fix written in response to a review is
   itself unreviewed code.**
3. **The two corrections this file owed are applied** — the Pages parenthetical
   below is rewritten, and the PR table's premature #213 self-healed on merge
   exactly as predicted.

## IT HAS NOW BEEN RUN AGAINST A REAL DESK, AND THAT IS NEW

Everything before 2026-08-16 came out of jsdom. On that evening Jack patched a
real QLC+ into the relay, and the session is worth reading for what it found:

- **The universe was the whole problem, and the default was right.** QLC+ sends
  Art-Net **universe 0**, which is what `docs/ARTNET.md` and the relay default
  say. A `--universe 1` suggestion from me broke a working setup for an hour.
- **QLC+ holds UDP 6454 itself**, on IPv6 `::`, while the relay holds IPv4
  `0.0.0.0`. With QLC+ open, packets to 127.0.0.1 still reach the relay.

  **CORRECTED 2026-08-16, off his machine, and the earlier verdict was too
  broad.** This bullet used to conclude *"no `EADDRINUSE` is ever raised — the
  relay's comment claims that refusing `reuseAddr` makes a clash loud, and it
  does not."* **The comment is right; the test was against the wrong
  opponent.** Measured on his machine, both ways:
  - **QLC+ vs the relay: genuinely no clash.** Seen with QLC+ holding **both**
    `0.0.0.0` and `::` — the relay still bound and still counted packets in.
    QLC+ sets `SO_REUSEADDR`, which on Windows lets a second socket take the
    same address, so the relay slots in beside it.
  - **Relay vs relay: a real, loud `EADDRINUSE`,** exactly as the comment
    claims. With one relay already up, a second printed
    `[artnet] UDP error: bind EADDRINUSE 0.0.0.0:6454` and died rather than
    silently splitting the packet stream. **That is the guard working.**

  So the relay's reasoning stands and this file was wrong about it for a day.
  It is the round's **second** hardware-sourced finding after RULING FB.
- **The ARTNET row cannot tell three failures apart.** A tab that is not
  rendering (the frame loop stops, so `artnetTick` never consumes what has
  arrived), a page whose socket can never reach a relay, and a desk that simply
  is not talking all read `ON — no desk yet`. That cost most of an evening, and
  it is unfixed.

  **CORRECTED 2026-08-16 — and the correction is the whole point of the
  bullet.** An earlier draft of this line said `file://` and Pages both make
  `artUrl` return null. **They do not, and they are two different failures with
  two different console signatures**, which matters enormously when the row
  says the same thing for both. `artUrl` (`p6d:172`) returns null **only when
  there is no host at all** — that is `file://`, where `artOpen` is a genuinely
  silent no-op and the console stays clean. **From Pages there IS a host**, so
  it returns `wss://jackscreations21.github.io/artnet`, a socket really is
  constructed, and it **fails to connect** — a visible WebSocket error, just
  not one that says anything about Art-Net. Telling a tester "it will fail
  silently" when their console is showing them an error is how an evening goes.
- **A REAL DESK IDLES AT ~1.8s BETWEEN PACKETS**, not at Art-Net's nominal
  44Hz — which is what RULING FB is, and it is the first number in this whole
  round that came off hardware rather than out of reasoning.

**Everything else below is still jsdom**, and no part of this round has been
in the headset.

| PR | Ruling | What |
|---|---|---|
| **#200** | **EL** | `tools/artnet-relay.js` — zero-dep Art-Net→WebSocket relay, and the 21st suite |
| **#201** | **EM state, EN, EU, EV** | `src/p6d.txt` — the socket, the reconnect off frame `dt`, `artnetTick` |
| **#202** | **EP, EN, EO** | the lights are raw writes; the Palace only; the channel bases |
| **#203** | **EM gates, EV, EW** | the board yields; the ARTNET row on both surfaces |
| **#204** | **EQ** | the flys, through their own motor |
| **#205** | **ER, ES** | the Beetlejuice house selector and the sign |
| **#206** | — | the mid-round record, written when the chain paused at six |
| **#207** | **ET, EX** | the set movers — parked unless driven |
| **#208** | **EO** | `tools/artnet-map.js` and the generated `docs/ARTNET.md` |
| **#209** | **EY** | the record: the QLC+ recipe, the rulings, the one bug left standing |
| **#210** | **EZ** | the sign is a fly — target and speed, and it retires EY’s sign half |
| **#211** | **FA** | `docs/ARTNET.md` becomes a flat list, one line per channel |
| **#212** | **FB** | `ART_STALE` 2s → 5s, measured against his real QLC+ desk |
| **#213** | **FC** | the proscenium neon: intensity and RGB, written raw — channels **311..314**, movers to **315** |
| **#214** | **FD** | `docs/ARTNET.md` becomes a grouped patch sheet — supersedes FA, still generated |
| **#215** | — | the record for FC and FD |
| **#216** | — | `tools/artnet-map.js --csv`, the same measurements in his spreadsheet columns |

Every merge verified: `main` rebuilds **byte-identical**, 21/21 suites on the
merged result, branches deleted local and remote. Two-stage review on every
PR — and on #207 that review was the first the mover code had ever had, and on
**#213 a THIRD pass** was needed, because the fixes closing out review two had
never been read by anybody.

## THE REST OF WHAT IS LEFT, in the order it will bite

**None of it is a branch, and none of it is mine to finish** — the first is
hardware, the rest want a ruling.

1. **A HEADSET RUN, now three rounds owed.** `?v=29` never happened, DR–DY has
   never been seen, and no part of the Art-Net round has been in the headset
   either. **All of the desk work is desktop-only.** Read all four wrist lines
   (`avg`, `pk`, `fov`, `calls · tri`) at the four moments: empty Palace,
   Beetlejuice pre-show, the 1:00 cue with eight blinders, and — new for this
   round — **at the proscenium looking up into the neon, with a desk driving
   311..314**. Prediction on record: **~590 calls empty at the boot view**; if
   it reads ~700 the build is stale.
2. **RULING EY, ruled and not built** — a dead universe still redresses the
   house on its first frame, channel 307. Jack ruled the fix and ruled that it
   waits. FUTURE.md PART 1a item 4.
3. **`ART_PROVE` and the relay's sequence guard** — both sized off Art-Net's
   nominal 44Hz, both disproved by the same measurement that produced FB.
   FUTURE.md PART 1a item 5. Neither is urgent; both are wrong.
4. **The ARTNET row cannot tell three failures apart** (above). It cost most of
   an evening and nothing has been done about it. **No ruling yet, and this is
   the one most likely to cost another evening.**
5. **Three spellings of "a desk is driving THIS rig", two disagreeing** —
   latent only, because `STAGE` is always defined. New this session, from the
   #213 review. FUTURE.md PART 1a item 7.
6. **The `tests/smoke.js` flake**, ~1 run in 12. FUTURE.md PART 1a item 6.
   **It fired once in this session** — a full `npm test` came back
   `20/21 FAILED: smoke`, and `smoke` alone then passed three times running and
   the next full run was 21/21. That is the documented flake behaving exactly
   as documented, and it is the first sighting recorded with a re-run count
   attached: **a lone red `smoke` after an unrelated change is this, and one
   re-run settles it.**

## THE ONE THING LEFT, AND IT IS RULED BUT NOT BUILT (and it is smaller than it was)

**RULING EY — a dead universe still redresses the HOUSE.** Jack ruled the fix
and ruled that it waits: *"Don't fix it — just record it."* The work is
**PART 1a item 4 of FUTURE.md**.

**THE SIGN HALF IS FIXED.** As first written EY was mostly about the sign,
which a dead universe hauled 11.36m to the deck in full view. **RULING EZ
retired that** by taking the sign off a band and onto its own target/speed
pair — a zero speed byte parks it. What is left is channel 307 alone.

`artBands` writes channel 307 on a band CHANGE only and `ART.houseBand` starts
at **-1**. A change from -1 is a change — so the FIRST frame of an unpatched
universe reads band 0 and redresses whichever house is standing back to the
Maitlands. A dress swap rather than a move, and band 0 is also the load
default, so usually a no-op — but "usually" is doing real work there.

**The third time the same collision was found in one round.** EQ gave the flys
a speed byte; 309 was parked by its own lineset's speed byte after an unpatched
desk ran the house curtain shut in front of the audience; EX made byte 0 "no
command" on the set movers. The bands were the only ones left, and they were
left because nobody had measured them.

**IT WAS HIDDEN BY CASE ORDERING**, and that is the finding worth keeping even
though the case that carried it is gone. The round's safety case for the sign
called `deskOn()` — which delivers a frame, which established band 0 — BEFORE
it put the sign on its stop, so its 120 measured frames were a no-change band
and it passed. The assertion written to prove the sign safe was the thing
concealing the hole. **That reproduction no longer fires**, because EZ took
the sign off the band; the lesson is in TRAPS, and 307 has no equivalent case
to reorder.

## HOW TO ACTUALLY RUN IT

```sh
node C:/Users/patri/Documents/theater_game/tools/artnet-relay.js
```

**THE ABSOLUTE PATH IS DELIBERATE AND IT COST HIM A ROUND.** `node
tools/artnet-relay.js` is what this file used to say, and run from anywhere but
the repo root it fails with `Cannot find module`. The relay resolves the
directory it SERVES from the script’s own location, so an absolute path is
safe from any working directory — there is no reason to make anyone `cd`
first.

**AND IT HAS TO BE RUNNING EVERY TIME.** It is a plain Node process, not a
service: close the window and `localhost:8080` stops answering, which presents
as `ERR_CONNECTION_REFUSED` and reads like the game is broken. Both of this
session’s “it isn’t coming up” reports were this.

Then open `http://localhost:8080/the-house.html`, LIGHTING page, throw ARTNET.
QLC+ outputs Art-Net to **127.0.0.1, universe 0**. **Patch off
`docs/ARTNET.md`** — it is generated from the build and the suite fails if it
drifts. VR-SETUP.md §8 is the full recipe.

**RULING FD made that file a PATCH SHEET** (#214): six blocks — LANTERNS 1-273,
FLY RAIL 274-301, HOUSE CIRCUITS 302-306, BEETLEJUICE dressing/sign/traveler
307-310, PROSCENIUM NEON 311-314, SET MOVERS 315-326 — each heading carrying
its own channel range, the 39 lanterns collapsed to one 7-channel pattern plus
a roster of base channels. **It is still generated and still measured**, and
there are now three guards on it: the probe refuses to emit a sheet whose
blocks do not tile the whole range, and the suite re-checks that tiling from
the committed file so the guarantee survives somebody deleting the probe's own
check.

Headset: `adb reverse tcp:8080 tcp:8080`, then the same localhost URL in the
Quest. **Art-Net from the GitHub Pages URL cannot work** — `artUrl()` only ever
builds a SAME-ORIGIN socket, so from an HTTPS Pages page it attempts
`wss://jackscreations21.github.io/artnet`, and there is no WebSocket endpoint
there. (Mixed content is what kills the obvious workaround — hard-coding a LAN
`ws://` — not the default path. The console error will not say "mixed
content", which is worth knowing before anyone debugs it.)

The relay binds **127.0.0.1 by default** and serves **the repo** — resolved
from the script's own location, so you cannot redirect it by `cd`-ing
elsewhere. `--host 0.0.0.0` opens the LAN; the UDP socket is unaffected either
way, so a desk on another machine still reaches it.

## STILL HIS TO DECIDE — three, and one to know about

(1, 2 and 3 want an answer. 4 does not — it is here because it will otherwise
be found at a desk.)

1. **Should the CSV be COMMITTED and guarded, or stay an on-demand flag?**
   Asked at the end of the desk session and **not answered.** Today it is a
   flag: `--csv` emits it, nothing is checked in, and **nothing warns when the
   sheet he has pasted goes stale.** `docs/ARTNET.md` has a suite case that
   fails the moment it drifts from the build; the CSV has no such guard, so his
   tripwire is indirect — a red ARTNET.md case means the patch moved and the
   sheet needs regenerating too, but only if somebody runs the suite. **The
   argument against committing it** is that this repo already carries two
   generated files that must be regenerated with every `src/` change, and a
   third is a third thing to forget. **The argument for** is that a spreadsheet
   he has actually pasted into a shared sheet is the copy most likely to be
   consulted and least likely to be regenerated. One small PR either way.
2. **Audio from QLC+ — asked and unanswered, twice now.** Art-Net carries DMX
   only. A QLC+ audio function plays on the PC's own sound card, outside the
   game entirely. The offer on the table: a **4-channel sound block** (track
   select, play/stop, master volume, seek) so a desk cue fires the game's OWN
   recordings in sync with its transport — the machinery already exists from
   RULING BO. One PR. Or volume only (1 channel). Or leave it out.
3. **Channel 317 is one-way and nothing can be done about it without a
   ruling.** (It was 312 when first written — RULINGS EZ and FC have each
   renumbered the mover block since. **Patch off `docs/ARTNET.md`, which is
   generated and cannot drift; never off this file, which just proved it
   can.**) The Maitlands exterior is a whole-group travel with `home` 0 and
   no `out`, so every byte from 1 to 255 commands it HOME and no byte sends it
   back out — and it hangs a 12.6m drop dead centre of a 15m opening. Widening
   it means consulting `sc.parkMv`, which the plan's correction #2 forbids.
   `docs/ARTNET.md` prints it rather than hiding it.
4. **Channel 310's traveler moves with the production — nothing to rule on,
   but worth knowing before you patch it.** RULING EO always said "the first
   lineset whose hung goods declare `traveler:true`, and the map probe prints
   which line that is", and was right; the loose sentences were `p6d`'s comment
   and this file's, and both are corrected. On the Palace standing hang it is
   line 2, the house curtain. **With Beetlejuice loaded it is line 1**,
   because the show hangs its own `bjCurtain` and `FLY.findIndex` takes the
   first — the Palace house curtain is not hung at all under Beetlejuice. The
   map measures and prints both. Nothing is broken; the DOCUMENT was wrong.

## CARRIED, AND STILL UNSEEN

**The `?v=29` headset run never happened**, and it is still owed — now two
rounds deep. Read all four wrist lines (`avg`, `pk`, `fov`, `calls · tri`) at
the four moments: empty Palace, Beetlejuice pre-show, the 1:00 cue with eight
blinders, at the proscenium looking up into the neon. Prediction on record:
**~590 calls empty at the boot view**; if it reads ~700 the build is stale.

Everything else in "STILL HIS TO DECIDE" from the perf round stands: the neon
rake, the sign's red at GO, the cemetery's missing park, 181MB of models, the
graveyard, the audio join at 4292, the house floor pool, `BLIND_BODY`,
`pr6.json` (still untracked, still unruled), the `envTrack` rota backstop.

**And a pre-existing flake worth knowing about before it wastes an hour:**
`tests/smoke.js` "the puffs drift, spread and die" fails about **1 run in 12**
— a puff whose random drift stays under the case's 0.3m threshold. Found
during this round on a build it does not touch. Not fixed; it is in FUTURE.md.

## Standing facts

Suite count **21** (`npm test` in tests/); probe-lint runs first and is a test
of the TESTS. The patch is 39 channels on every stage and the rail is 14 lines
— which is where 274 and 302 come from, computed not written. three.js has
**no multiview at any version**; r160.1 is the UMD ceiling. **His photographs
are never committed.** **Every timestamp in the Beetlejuice plot is a position
in his WHOLE recording.**

## Shelved

**Nothing.**
