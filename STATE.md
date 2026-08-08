# RUNNING STATE — live session file

This is the **working state file**: it records where things stand RIGHT
NOW and is updated as work happens. `HANDOFF.md` is the durable record
written at session end; this file is the scratchpad between those
writes. If the two disagree, this file is newer.

Last updated: **2026-08-08** (session start).

---

## Position

- **Branch:** `main` at `a571f18` (merge of #65, the carpenters handoff). Working tree clean.
- **Everything is merged. Nothing is in flight.** No open PRs, no work branches.
- **Suite status this session: 15/15 GREEN on this machine** (`npm test` on `main` @ `a571f18`, 2026-08-08), boot check `"fatal": null`. Node was freshly installed for this — v24.19.0 at `C:\Program Files\nodejs` — note it is **not yet on this session's shell PATH**; prefix commands with `$env:Path = "C:\Program Files\nodejs;$env:Path"` or open a fresh shell.
- Pages is live: `https://jackscreations21.github.io/gms-theater-game/the-house.html` — Quest cache-bust is at `?v=11` (bump it after the next merge).

## Current focus: THE CARPENTERS

Crew members who build scenery for you, using the build system the
player already has. **The owner answered all five shaping questions
(2026-08-08)**: (1) a catalogue list chosen on a warehouse screen;
(2) cut in the warehouse, erected at a spot the player marks with a
new toolbelt tool; (3) real stock, nothing conjured; (4) hybrid — the
six hands haul and nail, one new lead carpenter runs the job and owns
the saws; (5) VR only, called from a new wall screen beside the order
screen. Plus: planks are **really carried, one piece per trip** — not
the show-load-in dummy look.

**Spec:** `docs/superpowers/specs/2026-08-08-carpenters-design.md`
(RULINGS X, Y, Z, AA, AB, AC — after Z the letters double), merged #68.
**Plan:** `docs/superpowers/plans/2026-08-08-carpenters-prs1-5.md`.
**Status: ALL FIVE PRs BUILT.** #69 `carp-mark` merged; the remaining
four are open as a linear chain (owner waived never-stack for this
round — each PR targets its parent, merge top to bottom, chain tip
held 16/16 green at every link): `carp-plan` → `carp-lead` →
`carp-build` → `carp-screen`. After the last merge: rebuild check on
`main`, bump the Pages cache-buster past `?v=11`, HANDOFF "Done"
block, and the headset questions (spec §headset) onto HANDOFF's list.

Key reuse (do NOT rebuild): crew engine `p6b` (add job kinds, not an
engine), build primitives in `p4c` (`regWood`, `sawCut`, `addNail`,
`asmAdopt`, `addHinge`, `layTrack`, `paintWood`), and **build through
the same functions the hands use so the work rides the save for free**.
Constraints: `BUILD_CAP` 150 (order screen is the enforcement point),
no `setTimeout` for game time (frame `dt` family), only the live stage
ticks, carpenters need the `crewFrame()` treatment or they build on the
wrong deck, cuts never mint geometry.

## Open items (rough order)

- **Headset run owed.** Everything from #48 onward (usability round, nine build-feel PRs, both goods PRs) has met hardware NEVER. Owner on `?v=11`; work the question blocks at the bottom of HANDOFF and **write the wrist-meter numbers down**.
- **RULING W standing:** the hang and its paint are NOT saved — owner's to revisit; if reversed, save hang + paint together in one versioned blob, its own round.
- **Housekeeping:** `pr6.json` untracked in repo root (owner never ruled).
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
