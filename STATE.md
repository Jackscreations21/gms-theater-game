# RUNNING STATE — live session file

This is the **working state file**: it records where things stand RIGHT
NOW and is updated as work happens. `HANDOFF.md` is the durable record
written at session end; this file is the scratchpad between those
writes. If the two disagree, this file is newer.

Last updated: **2026-08-09** (the object system was reviewed from
outside; the review's own question turned up a 6× draw-call finding in
the wood, and #81 is open with the fix).

---

## Position

- **[PR #81](https://github.com/Jackscreations21/gms-theater-game/pull/81) is OPEN and is the only thing in flight** — a piece of wood holds ONE material until its faces disagree. Every wood mesh was `new T.Mesh(WOODG, [m, m, m, m, m, m])`, the same material six times, and r128 submits a draw call PER GROUP for an array material: six draw calls to draw one bare plank, 900 at `BUILD_CAP`, per eye. Now 150. **Check it merged before building on it.**
- **Carpenters phase 2 is DONE and landed** — spec #77, PRs #78 and #79 (which carried the round's PRs 2–4), plus #76 for the Arc warehouse doors, and #80 the record. Every one merged with `base=main`.
- **Suite status: 16/16 GREEN** on the #81 branch, boot check `"fatal": null`. `main` verified byte-identical at `873188` before branching; the #81 build is `874544`. Node v24.19.0 at `C:\Program Files\nodejs` — still not on a fresh shell's PATH; prefix with `export PATH="/c/Program Files/nodejs:$PATH"` (Git Bash) or `$env:Path = "C:\Program Files\nodejs;$env:Path"`.
- Pages serves `main`, so it carries everything up to #80 — **`?v=13` today, `?v=14` once #81 merges.** Measuring on `?v=13` measures the OLD wood.
- **This clone:** `main` @ `badfb98` = `origin/main`, plus the open `wood-one-material` branch. `pr6.json` still untracked.

## Current focus: nothing merged in flight — next is THE FRAME-RATE ROUND

The owner's call. It runs **through** the headset run, not instead of
it: the numbers can only be taken on hardware, so it is one trip — take
the meter readings first, then work the feel questions while the headset
is on. Full protocol in HANDOFF's "NEXT SESSION: THE FRAME-RATE ROUND",
including a blank table to fill in.

**Step zero is a diagnosis, not a fix.** The wrist tag (#22) has never
met hardware, and the foveation level it reports is the tell, because
foveation is a FRAGMENT-side knob — it does nothing for draw calls:

- foveation climbs to 1.0 and frames recover → **fill-bound**; cut
  beams, framebuffer scale, smoke. Do NOT merge.
- foveation pinned at 1.0, still red → **submission-bound**; batch the
  rail, merge the lantern steel, then consider the assembly merge.
- foveation sits at 0.4, green → **stop, ship nothing.**

Two of the three say do not build the merge. That is why the round opens
with a measurement.

**The unmeasured worst case is a real build standing under a lit rig** —
wood is one draw call per piece, `BUILD_CAP` is 150 a venue, r128 draws
each eye separately, and nobody has ever stood in that room with the
meter up. Note the piece count alongside the numbers.

**Nothing from #48 onward has met hardware** except the two findings
that produced #76 and #78, so the feel questions are still owed too —
HANDOFF's headset section carries them, oldest first.

## Open items (rough order)

- **#81 awaiting merge** — the wood material fix. Nothing depends on it, but the frame-rate round wants it in before the meter is read.
- **The frame-rate round, and the headset run it rides on.** Everything from #48 onward (usability round, nine build-feel PRs, both goods PRs, the carpenters round, phase 2 + the Arc door button) has met hardware NEVER. One trip: numbers first, then the question blocks at the bottom of HANDOFF.
- **THE ASSEMBLY MERGE is specced-but-deferred** (owner, 2026-08-09) — merge a nailed assembly into one mesh, hammer un-merges. Gated on the meter reading submission-bound. The design constraints are written down in HANDOFF's frame-rate section so it can be picked up cold; the honest arithmetic is there too (after #81 a five-flat scene is ~50 draw calls of wood, and the merge takes it to ~5 — forty-five is the whole prize).
- **The outside geometry review is answered and closed** (2026-08-09): keep polygon meshes, no voxels, no SDF, no CSG-first. GLTF is a "later, for richness" — not a frame-rate move. If the question comes round again, the reasoning is in HANDOFF's 2026-08-09 Done block.
- **The other six Arc doors are still DOM-only.** #76 gave the two warehouse rollers a physical `[E]` control; both dock shutters and all four pass doors still open only from the ARC DOORS panel, so a headset cannot work them. One branch on the same `arcDoor:<key>` station id finishes it — owner's call whether it is wanted.
- **RULING W standing:** the hang and its paint are NOT saved — owner's to revisit; if reversed, save hang + paint together in one versioned blob, its own round.
- **Housekeeping:** `pr6.json` untracked in repo root (owner never ruled).
- **Remote branch backlog:** ~43 fully-merged branches still on `origin` (`carp-*`, `carp2-*`, `arc-door-button`, `feel-*`, the `handoff-*` series, and every older feature branch). Local is pruned; deleting them on GitHub is the owner's call. Suggested keep if it happens: `carpenters-landing` and the `handoff-*` series as the round record, prune the rest.
- **Owner-taste leftovers:** audit items 20 (dead weight) and 22 (duplication).
- **Accepted drifts** (documented, not bugs unless owner promotes): swung pivot re-baselines stops on reload; pipe-anchored work reloads at saved pose regardless of trim; runaway resumes on stage re-entry; rope runs pass through fly-gallery floor at y=8; cold-dropped table keeps held tilt.

## Ground rules (quick card)

- All work via PRs to `main`, one concern per PR, **never stack** — linear chain: rebase onto fresh `main` after parent merges, retest, then open.
- Suites green before and after; every new assertion **negative-checked** against the pre-change build.
- Multi-branch work: **seam check mandatory** — merge all open branches into a throwaway, rebuild, full suite.
- `gh` not installed — PRs via GitHub API with stored git credential.
- PowerShell 5.1 mangles quoted `git commit -m` — write message to file, use `-F`.
- Never `git add -A` while agent worktrees exist under `.claude/`.
- Commits use the owner's GitHub no-reply address.
- `build.sh` part order is dependency order — never sort it. Rebuild with `sh build.sh` after editing `src/`.
- jsdom `MouseEvent` has no `movementX/Y` — shim it (full14.js has one). Test probe templates eat EVERY backslash — regexes from doubled-backslash strings, and reword around apostrophes (an escaped `\'` kills the whole probe with `missing ) after argument list`).
- Test through the DOM, not cached rows; write a `tools/` probe when you cannot picture it.
- **Anything a headset must reach needs a physical thing in the room** — a DOM control does not exist in VR. A `station()` is the cheapest one and serves the desktop crosshair and the VR trigger from a single test.

## Session log

- 2026-08-08 — session opened; read HANDOFF.md; created this file.
- 2026-08-08 — tried to verify the suites: no Node.js on this machine. Repo itself verified: `main` @ `a571f18`, tree clean.
- 2026-08-08 — user installed Node v24.19.0 (winget); `npm install` in `tests/` (59 packages), full suite run: **15/15 green, `"fatal": null`**. Blocker cleared — this machine can now build and test.
- 2026-08-08 — STATE.md landed on `main` via [PR #66](https://github.com/Jackscreations21/gms-theater-game/pull/66) (merged same day).
- 2026-08-08 — created the agent documentation system: `CLAUDE.md` (root entry point, auto-loaded by Claude Code) + `docs/guide/` (ARCHITECTURE, INVARIANTS, TRAPS, TESTING, WORKFLOW, VR, BUILD-SYSTEM) — HANDOFF.md distilled into topical files; HANDOFF stays the chronological record. PR'd on branch `agent-docs`, merged as #67.
- 2026-08-08 — owner answered the five carpenter questions (catalogue on a warehouse screen / cut in the shed, build at a marked spot / real stock / hybrid: hands + a lead carpenter / VR only; planks really carried one per trip). Three scout agents mapped p6b, p4c+p2m, and the toolbelt+spec system. Spec (RULINGS X–AC) and 5-PR plan written on branch `carpenters-spec`; merged as #68.
- 2026-08-08 — carpenters PR 1/5 `carp-mark` (RULING Z): the crayon on the belt (small of the back, 0/-0.17 — every holster pair > the 0.22 draw radius), WALKABLE forward ray, ankle-height rule (bare deck only: the y≈8 gallery AND a loaded show's y=0.3 floor both refuse), one standing mark with -ARC.X correction. 3 new vr.js tests, negative-checked; 15/15 green. Merged as #69.
- 2026-08-08 — carpenters PRs 2–5 built by four sequential agents as a linear chain off #69 (owner's call: "all at once"; each link reviewed line-by-line, suites verified independently at every link): `carp-plan` (p6c: CARP_CAT 3 rows, carpSurvey, pure carpPlan with NEED/cap contracts; 16th suite tests/carp.js), `carp-lead` (the 7th figure, trade guards before the queue shift, real carry via attach + the 'carried' state, carpFetch/carpCut on the real saws with the pencil-tick fix), `carp-build` (carpHaul/carpNail, mark-yaw transform, restH-carries-the-stack settle decision, wrong-deck kill test on the Arc, save round-trip), `carp-screen` (CARPENTERS wall panel beside each order screen, META hits only — order canvas untouched — RULING X refusal strings, end-to-end-through-the-glass test). Six new traps recorded in TRAPS.md. 16/16 green at the chain tip.
- 2026-08-08 — the chain PRs #70–#73 opened at once (each targeting its parent). **Merge mishap:** the owner merged all four, but #71–#73 landed INTO their parent branches, not `main` (the retarget-after-delete step got skipped) — `main` briefly held only PRs 1–2. No work lost: the chain tip still held everything. Landed via [PR #74](https://github.com/Jackscreations21/gms-theater-game/pull/74) (`carpenters-landing` = `main` + `origin/carp-screen`), verified on that exact branch: byte-identical rebuild, 16/16, fatal null.
- 2026-08-08 — the round's record written and riding #74: HANDOFF Done block + THE CARPENTERS BRIEF marked superseded + new "NEXT SESSION: THE HEADSET RUN" with the five carpenter questions; STATE refreshed; suite count 15→16 in CLAUDE.md/TESTING.md (+ carp.js row); ARCHITECTURE parts table + crew line updated for p6c and the lead; BUILD-SYSTEM binding-specs pointer. Cache-bust is now `?v=12`.
- 2026-08-08 — **new session opened on a STALE clone**: it was parked on `handoff-carpenters` with `main` at `4986f25`, 19 commits behind — the whole carpenters round (#65–#74) plus STATE.md and the `docs/guide/` system had landed from elsewhere. Fast-forwarded to `origin/main` @ `b22c299`; verified byte-identical rebuild. **The lesson worth keeping: fetch and compare BEFORE trusting any local checkout or any memory of "what is next" — this clone's idea of the next session was three rounds out of date.**
- 2026-08-08 — clone hygiene: the three `.claude/worktrees/agent-*` worktrees removed (each verified clean first, then `git worktree prune`), and the sixteen fully-merged local branches deleted with `-d` (safe delete — git refuses anything unmerged; `git branch --no-merged origin/main` was empty first). One local branch left: `main`. `pr6.json` still untracked.
- 2026-08-08 — **the headset went on, and produced two findings.** (1) "there is no but to open iether of the garages in the arc theaters" — true, and worse than it read: every Arc door opened only from the DOM panel, and those two rollers are the only way into the Arc shed, so the whole shed was unreachable in VR. Fixed by [#76](https://github.com/Jackscreations21/gms-theater-game/pull/76): an `[E]` station on the stage side of each rear door, plus one `arcDoor:<key>` branch in `useStation` keyed off `ARC.doorMap`. Two arc.js tests driving the real `pickAll`→`describe`→`useInfo` chain, which is what the crosshair AND the VR trigger both run. (2) "i cant find the screen for the carpenters in iether warhouse" — the Arc half was finding (1); in the Palace the screen was verified present by probe, 1.7m to the right of the order glass, and the owner confirmed the build was current (the crayon was on his belt).
- 2026-08-09 — session opened by fetching FIRST (the standing lesson): this clone's `main` was 2 commits behind — #80 had landed the phase-2 record from elsewhere while STATE still said "`main` the only local branch". Fast-forwarded to `badfb98`, verified byte-identical rebuild (873188), 16/16 baseline green.
- 2026-08-09 — **the owner had the object system reviewed from outside.** Verdict accepted: keep polygon meshes; no voxels, no SDF, no CSG-first; GLTF a "later". Three corrections recorded in HANDOFF — its CSG condition is already MET (phase 2 shipped a door and a window flat; RULING AE frames and skins around an opening, and `buildLoad` replays functions a boolean result has no path through), seats have been instanced since the beginning, and its "11 InstancedMesh uses" misses that `instanced()` at `p2.txt:359` has 30 call sites.
- 2026-08-09 — **costing the review's one open idea (merge nailed wood) turned up the real finding instead.** Every wood mesh carried the same material six times; r128 submits a draw call per geometry group for an array material, so a bare plank cost six. [#81](https://github.com/Jackscreations21/gms-theater-game/pull/81) opened: one material until the faces disagree, 900 → 150 draw calls at the cap, save format unchanged, 16/16 green, all five new/changed assertions negative-checked against `main`'s build. **The merge itself deferred by the owner** pending the meter. One false green found and fixed en route (a test poked `material[2]` on a single-material mesh and read its own stray property back) — in TRAPS.
- 2026-08-09 — record updated for the next session: **THE FRAME-RATE ROUND**, with the foveation decision table, the four places to stand, a blank numbers table, the knob order, and the deferred merge's design constraints.
- 2026-08-08 — **carpenters phase 2 specced and built in one session** off four owner asks (build several at once; a flat with a door hole; one with a window hole; with or without the sheets — plus "it wont let me rotate stuff once it is built"). Shaped live: a LIST worked in order, STACKED on the one mark, and SKIN as a switch rather than eight rows. Spec (RULINGS AD–AH) merged as [#77](https://github.com/Jackscreations21/gms-theater-game/pull/77); [#78](https://github.com/Jackscreations21/gms-theater-game/pull/78) the rotate fix; [#79](https://github.com/Jackscreations21/gms-theater-game/pull/79) the rip, the two new rows and the build list. Every PR `base=main` — the #71–#73 mishap did not repeat. Post-merge verified: `main` tree identical to the tested tip, byte-identical rebuild (873188), 16/16, `"fatal": null`, and Pages already serving the same bytes.
