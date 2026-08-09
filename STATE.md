# RUNNING STATE — live session file

This is the **working state file**: it records where things stand RIGHT
NOW and is updated as work happens. `HANDOFF.md` is the durable record
written at session end; this file is the scratchpad between those
writes. If the two disagree, this file is newer.

Last updated: **2026-08-08** (housekeeping session — this clone caught
up with `main` and was pruned).

---

## Position

- **The carpenters round is DONE and landed** — spec #68, PRs #69–#73, chain tip brought to `main` by #74 (see the merge-mishap note in the session log). Work branches can be deleted once #74 is in.
- **Suite status: 16/16 GREEN** (the new 16th suite is `tests/carp.js`), boot check `"fatal": null`, and `main` + the chain rebuilds byte-identical from `src/`. Node v24.19.0 at `C:\Program Files\nodejs` — still not on a fresh shell's PATH; prefix with `export PATH="/c/Program Files/nodejs:$PATH"` (Git Bash) or `$env:Path = "C:\Program Files\nodejs;$env:Path"`.
- Pages is live: `https://jackscreations21.github.io/gms-theater-game/the-house.html` — load with `?v=12` on the Quest (bumped for the carpenters merge).
- **This clone is current and clean:** `main` @ `b22c299` = `origin/main`, rebuilds byte-identical (`built 850229 bytes syntax OK`). The sixteen fully-merged local branches and all three `.claude/worktrees/agent-*` worktrees are gone; `main` is the only local branch. `origin` still carries its merged branches — see Open items.

## Current focus: nothing in flight — next is THE HEADSET RUN

The carpenters landed 2026-08-08 (spec #68, PRs #69–#73, chain tip via
#74): pick a piece on the CARPENTERS screen in either shed, stamp the
deck with the crayon (fourth belt tool, small of the back), CALL — the
lead cuts real stock on the real saws, the six hands carry each plank
to the mark and nail it into one rigid, un-anchored, grabbable
assembly that rides the save for free. Rulings X–AC bind; the spec and
`docs/guide/` (TRAPS has a new crew/carpenters section) are current.

**Nothing from #48 onward has met hardware.** The next session should
be the headset run: HANDOFF's "NEXT SESSION: THE HEADSET RUN" section
has the full question list, including this round's five new questions
(belt crowding, mark legibility, build pace, seventh-figure frame
cost, screen readability). Owner on `?v=12`; **write the wrist-meter
numbers down.**

## Open items (rough order)

- **Headset run owed.** Everything from #48 onward (usability round, nine build-feel PRs, both goods PRs, the carpenters round) has met hardware NEVER. Owner on `?v=12`; work the question blocks at the bottom of HANDOFF and **write the wrist-meter numbers down**.
- **RULING W standing:** the hang and its paint are NOT saved — owner's to revisit; if reversed, save hang + paint together in one versioned blob, its own round.
- **Housekeeping:** `pr6.json` untracked in repo root (owner never ruled).
- **Remote branch backlog:** ~40 fully-merged branches still on `origin` (`carp-*`, `feel-*`, the `handoff-*` series, and every older feature branch). Local is pruned; deleting them on GitHub is the owner's call. Suggested keep if it happens: `carpenters-landing` and the `handoff-*` series as the round record, prune the rest.
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
- jsdom `MouseEvent` has no `movementX/Y` — shim it (full14.js has one). Regex literals in test probe templates lose backslashes — build from doubled-backslash strings.
- Test through the DOM, not cached rows; write a `tools/` probe when you cannot picture it.

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
