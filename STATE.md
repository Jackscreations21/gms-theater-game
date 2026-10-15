# STATE — 2026-10-15 (OPEN ITEMS ONLY — `second-house` = PR #235 OPEN; `cue-blackouts` = PR #233 OPEN; nothing is local-only)

**Do not trust this file for what is next without fetching first.** `git fetch`, compare `origin/main`, then read
this. **This file holds only what is open.** Everything finished is in HANDOFF.md (the "DONE" blocks, newest first)
and everything wanted-but-not-built is in FUTURE.md. Do not append finished rounds here; write them to HANDOFF.md.

## Where things stand

- **`main` is `5d24188`**: #230 (the show), #231 (its record) and #232 (`fixture-glbs`, the 38 model files) merged by
  Jack. The Midtown page with the rig, the set and the whole of Hamilton auto-timed is on Pages:
  https://jackscreations21.github.io/gms-theater-game/midtown.html
- **PR #235 (`second-house`, off `main`) is OPEN**: https://github.com/Jackscreations21/gms-theater-game/pull/235.
  Jack: *"use the same theater we used for the hamilton one. just copy it over then remove the hamilton set. also make
  the lobby bigger to fit the second theater."* Theatre 2 is a second, uncut copy of the scanned house at x +20
  (`HOUSE2.dx`) with an empty stage — no set, no rig, no cuts, no bakes, the GLB's own proscenium and hanging iron —
  and the lobby runs behind both houses (x −9.80…30.00, four doorways, "THEATRE 2" signs over the new pair). A
  "Theatre 2" view button; the walk grid covers it; `MIDTOWN.house2` / `house2Spec` / `house2Mesh`. Jack's baked
  stage-floor slab (box 21) is trimmed at x 10.4, where it ran into Theatre 2. Built by one Opus agent. Nothing in
  `src/`. **Independent of #233** — different regions of `midtown.html`. The record for #233 (its HANDOFF and the
  earlier STATE) lives only on `cue-blackouts`; whichever merges second will conflict in HANDOFF.md at its top block
  and in this file — keep both HANDOFF blocks, keep this file's shape. **Both branches match their remotes; no
  local-only commits anywhere** (2026-10-15). Local server: `http://localhost:8080/midtown.html` (`preview_start`
  `the-house` if it is down).
- **Also on #235 (2026-10-15, two Opus agents, merged `bb74206`):** Theatre 2 has the followspot booth and the lighting desk
  (the same functions, moved `HOUSE2.dx`, measured against its own scan; three Lycians as props, no beams; the desk's
  monitors dark — no show), and all four auditorium doorways have double doors that open for the walker and close behind.
  Checked on the merge at localhost:8080: no errors or warnings, house 1's booth/desk/lobby lines unchanged, `walls.check()`
  and `lx.check()` unchanged, the walk passed lobby → house-right doorway → house with the doors opening ahead and closing
  behind (the live loop). Pages will not show it until #235 merges.
- **PR #233 (`cue-blackouts`) is OPEN**: https://github.com/Jackscreations21/gms-theater-game/pull/233. It carries the
  2026-10-12 day — cue revisions 3, 4 and 5 (`assets/hamilton-show.json`, 891 cues, 123 real), the song/time readout
  (`#sh-hud`), the skip synced by the sound itself (`assets/hamilton-soundtrack-env.u8`, `soundtrack.seek.toc`), and the
  interval fix. Nothing in `src/`, so `the-house.html` and `docs/ARTNET.md` are untouched and the suites are unaffected.
  **Until it merges, that work is live only on the local server (localhost:8080), not on Pages.**
- Rulings are at **FE** (FF next).

## Open, in the order it will bite

1. **Land #235 and #233 (either order), then the post-merge protocol for each:** fast-forward local `main`; delete
   the landed branch and the five older landed branches `midtown-walk`, `midtown-walls`, `midtown-lights`,
   `record-230`, `fixture-glbs` both sides (the sandbox refuses `git push --delete`; Jack or a terminal); suites when
   Node is on the PATH (`winget install OpenJS.NodeJS.LTS`, Jack runs it — the sandbox cannot).
2. **Jack's eye on Theatre 2, its booth and desk, the doors and the long lobby** (PR #235). Decisions it raises, none
   made: Theatre 2's own show, or stays empty (its desk screens are dark until there is one); the doors' swing — they
   open INTO the house (a leaf lies flat on its reveal; swinging toward the lobby would hit the projection rooms), where
   real auditorium doors open toward the way out; whether the doors should also open for the orbit camera (they stay
   shut unless you are walking); a runner meets a leaf mid-swing and loses 2–3 frames; the 0.68 m void between the two
   houses' outer walls (sealed by the lobby's wall, invisible from inside); the signs ("STALLS" over house 1's doors,
   "THEATRE 2" over the new pair, "PROJECTION" on both projection rooms); Build mode's "add piece" / delete box still
   land on house 1 only (`houseScene()` — one line to include Theatre 2); house 1's desk measure costs ~1.3 s of the
   load and the faster copy Theatre 2 uses would save ~0.9 s but moves its geometry by ~1e-8 m (TRAPS); Theatre 2's
   followspot props stay full size when house 1's set is "fitted" (house 1's spots shrink with the set).
3. **His re-check through the checklist.** The brief is the artifact https://claude.ai/artifact/FpiGBBW8LicWbaRb1nTUjg
   ("Hamilton Cue Checklist": collection `songs`, doc id = track id, fields `status` / `notes` / `updatedAt`). **Read
   it with `ArtifactData` `list` (or `query` on `status != good`) at the start of every cue round.** Nine songs carry
   notes answered once and not yet re-checked — act 1: My Shot, Farmer Refuted, Ten Duel Commandments, Guns and Ships,
   Non-Stop; act 2: Cabinet Battle #1, Cabinet Battle #2, Washington on Your Side, Who Lives. The method for a note is
   in HANDOFF.md's NEXT SESSION block for #233 (on `cue-blackouts`): render the suspect seconds, edit with a
   state-folding script, `show.check()`.
4. **The rig placements the cue photos exposed** — Jack's to rule on; the options are in FUTURE.md ("Rig placements the
   cue photos expose"): the three 10th-Electric VL3500s burning the upper brick, the back-wall foots under the gallery,
   the Deck strips pointing at the deck edge; and the six REAL cues that still throw into Midtown's house at the
   Rodgers' aims (194, 200, 300.3, 1044, 1110, 1238.01) — a focus clamp in the player, or leave them.
5. **Still not drawn / not run in the show:** Binkley's `edge` and `frost`; the 238 effect entries; the turntable
   moves (in no file); 16 channels with no rig unit; the Cabinet Battle sides still unsourced beyond his word.
6. **The player's body.** Jack, on the walk (2026-10-11), paused on his "wait a second": *"the person is too tall,
   and also give them a body."* Eye is 1.6 m (Palace 1.68; Roblox ~1.4); a visible body, maybe third person. Not
   started; start fresh off the branch tip.
7. **The Hamilton game spec is not written** (FUTURE.md PART 2 "THE HAMILTON GAME"): `midtown.html` is a preview
   page, not the second build target. Rulings letter from FF.
8. **A headset run, now four rounds owed** (`?v=29`, DR–DY, the Art-Net round, and nothing of Midtown has been in the
   Quest). Read the four wrist lines (`avg`, `pk`, `fov`, `calls · tri`) at: empty Palace, Beetlejuice pre-show, the
   1:00 cue with eight blinders, and at the proscenium looking up into the neon with a desk driving 311..314.
   Prediction on record: **~590 calls empty at the boot view**; ~700 means the build is stale.
9. **Art-Net, still his to decide** (the round itself is closed, EL–FD; the built facts are in `docs/ARTNET.md`,
   which is generated and cannot drift — never patch off this file):
   - **Commit the `--csv` output of `tools/artnet-map.js` and guard it, or leave it an on-demand flag?** Asked twice,
     unanswered. Today nothing warns when the sheet he pasted goes stale.
   - **Audio from QLC+?** Art-Net is DMX only. The offer: a 4-channel sound block (track, play/stop, volume, seek)
     so a desk cue fires the game's own recordings; or volume only; or nothing. Also named in the Hamilton game brief.
   - **Channel 317 is one-way:** the Maitlands exterior has `home` 0 and no `out`, so every byte sends it home and
     none sends it back. Widening it means consulting `sc.parkMv`, which the plan forbids. Needs a ruling.
   - **Channel 310's traveler moves with the production** (line 2 on the Palace hang, line 1 under Beetlejuice).
     Nothing to rule; know it before patching.
   - The rest — RULING EY ruled and not built, `ART_PROVE` and the relay's sequence guard sized off the nominal
     44 Hz, the ARTNET row that cannot tell three failures apart, the three spellings of "a desk drives this rig",
     the `smoke.js` flake (~1 in 12; one re-run settles it) — are FUTURE.md PART 1a items 4–7.
10. **Carried from the perf round, still his:** FUTURE.md "Carried from STATE.md, still his" (neon rake, the sign's
    red at GO, 181 MB of models, `pr6.json` untracked and unruled, …).

## Facts you need to work on the Midtown page (not history)

- **Theatre 2's works and the doors (PR #235, 2026-10-15).** `buildSpotBooth(root, {dx, mesh, props})` and
  `buildDeskPosition(root, {dx, scan, live})` build both houses' booths and desks; Theatre 2's cuts are `HOUSE2_CUTS`
  (`only: 'house2'`, applied by `reapplyAll` with the rest — a cut applied anywhere else vanishes on the first bake or
  undo); `MIDTOWN.house2Works` = { booth, desk, spots, cuts, cut() }. Both houses' groups share the names `followspot
  booth` / `lighting desk` (`userData.house` tells them apart) — never look a booth up by name. The doors: `DOORS`,
  `buildDoors`, `doorsTick(dt)` in the frame loop, `doorsHit` inside `builtHit` (ray-tested directly, NOT in the walk's
  grid); `MIDTOWN.doors.state()` prints every pair's angle and the walker's distance. **The Browser pane runs the page at
  ~1.5 fps when the Claude window is not in front** (dt capped at 0.1 s, so game time crawls 6×): a 0.7 s door takes
  ~5 s of wall time there; measure with `requestAnimationFrame` before trusting any timing in the pane.
- **Two houses now (PR #235).** House 1 is `houseRoot` (`MIDTOWN.house`), the cut one with the set, rig, booth, desk
  and bakes; everything that treats scan meshes by the `Object_` name or traverses `houseRoot` (booth, lobby measure,
  `cutBeams`, `wallSplit`/`wallCheck`, `applyCut`, the rigging, the lighting check) is house 1's and must stay so.
  Theatre 2 is `house2Root` (`MIDTOWN.house2`), meshes named `h2: <name>`, its own geometry (a clone of the loaded GLB
  taken before anything touches house 1 — two clones of one GLB share buffers otherwise, TRAPS). Its materials are in
  `houseMats`, so the House light slider and the show's house fades dim both. The lobby is one room behind both
  (`LOBBY`, `buildLobby(house1, house2)`, four `doors` each with `house` and `side`).
- **Local serving:** `.claude/launch.json` (gitignored) entry `the-house`, Python `http.server` on 8080 over the repo
  root; `preview_start` it. **It dies when the Browser pane is closed** — restart before navigating. Pointer lock
  fails inside the pane; a normal Chrome window at the same URL is the better window for him. His Chrome must be
  on the RTX 5060 (set to High performance in Windows), unverified.
- **His soundtrack is local only** (`assets/audio/hamilton-soundtrack.mp3`, never committed; the one-file album). The
  seek table and the loudness envelope (#233) are specific to HIS copy — a different file needs `mp3toc.py` (the
  table) and a new envelope (20 ms RMS, `255·(log10(rms)+4)/4`). Python's `http.server` has no Range requests, so the
  file loads into a Blob. **Pages falls back to the official YouTube uploads**, which seek exactly.
- **Checks after any cue edit:** `MIDTOWN.show.check()` (seek = play-through, references resolve, timeline
  monotonic); `MIDTOWN.lx.check()` 301/313 **with the show STOPPED**; console clean. Render what you changed and
  look at it (`MIDTOWN.frame()` draws one frame synchronously for a hidden pane; TRAPS "From the cue-review round").
- **Preshow and the interval:** opening the Show panel puts the show at its top paused, preset up, house up; at the
  end of 1-23 it holds (blackout, preset, house up) until Play. Works on all three clocks.
- **Bakes:** he exports `Downloads\midtown-build*.json`; append `pieces` to `BAKED` and `cuts` to `BAKED_CUTS`
  (replace only if he pressed "Edit the baked pieces" first); suffix names "(bake N)"; **tell him Clear all** after.
  **Check every baked piece's extent against Theatre 2** (x 10.2…30.0): box 21 reached into it once.
- **Node is not on the PATH** on this machine; a portable copy may survive in an old session scratch. Suites were
  last green 20/21 on 2026-10-11 (the one red was the then-untracked GLBs, since committed).
- **`gh` is not installed**, so the app cannot bind a PR to a session; PRs open through the API (WORKFLOW.md) and
  Jack merges them on GitHub.
- **Never commit:** his photographs, his soundtrack, the Broadway plot PDFs, lyrics. ETC's set and rig are
  non-commercial (`assets/README.md`).

## Standing facts

Suite count **21** (`npm test` in tests/); probe-lint runs first. The patch is 39 channels on every stage and the
rail is 14 lines. three.js has **no multiview at any version**; r128 in the game, r160.1 is the UMD ceiling. Every
timestamp in the Beetlejuice plot is a position in his WHOLE recording. **Patch a desk off `docs/ARTNET.md`.**

## Shelved

**Nothing.**
