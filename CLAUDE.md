# THE HOUSE — agent entry point

A 3D theatre sim in ONE HTML file (~875KB, three.js r128, no framework,
no build step beyond concatenating `src/` text files). Two venues, three
stages sharing one board, four productions, a six-hand crew, a full VR
mode (Quest 3), and a physical build system (order wood, saw, nail,
paint, save).

## Read order — do this before touching anything

1. **STATE.md** — where things stand right now (live file, newest truth).
2. **HANDOFF.md** — the durable record; at minimum the last two "Done"
   blocks and the NEXT SESSION section.
3. **FUTURE.md** — the other direction: what is wanted and NOT built yet,
   plus anything mid-build and paused. Read it before starting new work, so
   you do not build something that is half-built already, and write any new
   idea into it. It is not binding — a spec in `docs/superpowers/specs/` is.
4. **docs/guide/** — topical deep dives, listed below. Read the ones your
   task touches. If your task touches a recent feature, its spec in
   `docs/superpowers/specs/` has binding RULINGS — read it.

## The guide

| File | Read when |
|---|---|
| [docs/guide/ARCHITECTURE.md](docs/guide/ARCHITECTURE.md) | always — the parts, the build order, the global-swap design |
| [docs/guide/INVARIANTS.md](docs/guide/INVARIANTS.md) | always — break these and things go quietly wrong |
| [docs/guide/TRAPS.md](docs/guide/TRAPS.md) | always — bugs this codebase has actually had, and will have again |
| [docs/guide/TESTING.md](docs/guide/TESTING.md) | before writing or trusting any test |
| [docs/guide/WORKFLOW.md](docs/guide/WORKFLOW.md) | before your first commit — PR rules, seam checks, this machine's quirks |
| [docs/guide/VR.md](docs/guide/VR.md) | touching p9, grabs, controllers, VR perf |
| [docs/guide/BUILD-SYSTEM.md](docs/guide/BUILD-SYSTEM.md) | touching p4c, wood, assemblies, the save |

## Commands

```sh
sh build.sh          # rebuild the-house.html from src/ (syntax-checked)
cd tests && npm test # all 20 suites; exits non-zero on any failure
cd tests && node real.js  # boot the whole file, expect "fatal": null
```

`the-house.html` is committed BUILT — after editing `src/`, rebuild and
commit both.

## Hard rules (non-negotiable, owner's or learned the hard way)

- **All work via PRs to `main`. Never commit to `main` directly. Never
  stack PRs** — linear chain: open a dependent PR only after its parent
  merges, rebased onto fresh `main`, retested.
- **Commits use the owner's GitHub no-reply address**
  (`314018971+Jackscreations21@users.noreply.github.com`).
- **Never sort or reorder `build.sh`** — the part order is a dependency
  order with load-bearing positions (see ARCHITECTURE.md).
- **Suites green before AND after every change; every new assertion
  negative-checked** (verified to fail against the pre-change build).
- **Never `git add -A` while agent worktrees exist under `.claude/`.**
- `gh` is not installed — PRs go through the GitHub API with the stored
  git credential (recipe in WORKFLOW.md).
- PowerShell 5.1 mangles quoted `git commit -m` — write the message to a
  file and use `-F`.
- **Never `setTimeout` for game timing** — time comes off the frame `dt`.

## Update the record

Before ending a session: update **STATE.md** (always) and append the
session's "Done" block to **HANDOFF.md** (when work merged). If you hit
a new trap, add it to TRAPS.md — that file only earns its keep if it
grows.
