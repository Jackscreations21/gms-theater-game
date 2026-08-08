# Workflow

## The PR rules (owner's, 2026-08-06, so there is a record)

- Branch off `main`, commit there, push, open a PR, owner reviews and
  merges. **No direct commits to `main`.**
- **One concern per PR. Never stack.** Stacked PRs bit hard once (#3–#5
  merged onto stale bases; #6 was the cleanup). For dependent work, run
  a **linear chain**: build PR B on PR A's branch, but open B only after
  A merges — rebase onto fresh `main`, rebuild, retest, then open.
- Commits use the owner's no-reply address:
  `Jackscreations21 <314018971+Jackscreations21@users.noreply.github.com>`
  — the repo may go public; keep it that way.
- Remote: `https://github.com/Jackscreations21/gms-theater-game`.

## Opening a PR without `gh`

`gh` is not installed. Use the GitHub API with the stored credential
(from Bash — PowerShell mangles the credential-helper input):

```sh
token=$(printf "protocol=https\nhost=github.com\n" | git credential fill | sed -n 's/^password=//p')
curl -s -X POST -H "Authorization: token $token" \
  -H "Accept: application/vnd.github+json" \
  --data-binary @pr-body.json \
  https://api.github.com/repos/Jackscreations21/gms-theater-game/pulls
```

with `pr-body.json` holding `{"title", "head", "base": "main", "body"}`.
Write the JSON to a file — don't inline it.

## Committing on this machine

- PowerShell 5.1 mangles `git commit -m` when the message has double
  quotes — write the message to a file and `git commit -F` it.
- Never `git add -A` while agent worktrees exist under `.claude/`.
- Node lives at `C:\Program Files\nodejs` (may not be on an old shell's
  PATH).

## The shape of a feature round (the process that works)

1. **Spec first** for anything non-trivial:
   `docs/superpowers/specs/YYYY-MM-DD-<name>-design.md`, owner's rulings
   inline (lettered, continuing the sequence — at **X** as of
   2026-08-08). Rulings are BINDING; read a feature's spec before
   touching its code.
2. **Plan**: `docs/superpowers/plans/YYYY-MM-DD-<name>-prsN-M.md`, one
   concern per PR.
3. **Build failing-test-first** (see TESTING.md). Independent concerns
   may go to parallel worktree agents — one branch per concern, each
   reviewed line-by-line (two-stage: spec compliance, then quality)
   before push. Dependent chains are built SOLO and SEQUENTIAL.
4. **Seam check** before opening multi-branch PRs: merge all open
   branches into a throwaway, rebuild, full suite. (For a linear chain,
   the chain tip passing IS the seam check.)
5. **Post-merge verification**: `main` rebuilds byte-identical, full
   suite green on the merged result, work branches deleted local and
   remote.
6. **Update the record**: STATE.md as you go; HANDOFF.md's "Done" block
   when it lands; new traps into TRAPS.md.

## Deploy

GitHub Pages serves `main`:
`https://jackscreations21.github.io/gms-theater-game/the-house.html` —
live within a couple of minutes of a merge. The Quest Browser caches
hard: bump the cache-buster (`?v=N`, current value in STATE.md/HANDOFF)
before judging any fix on hardware.

## What jsdom cannot answer

Frame rate, comfort, legibility, feel — those go on the headset
checklist at the bottom of HANDOFF.md as QUESTIONS, and the answers get
written back there after a headset run. Feel constants are deliberately
one-line tunes; the list of them lives in HANDOFF's "still owed" block.
