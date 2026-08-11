# The sound, the audience rig and the plot — three PRs

Spec: `../specs/2026-08-11-beetlejuice-sound-and-house-design.md` (rulings
BA–BD). The owner asked for exactly this split:

> "do a pr for adding the new lights and coding the audio and pre show. then a
> pr for act one. and a pr for act 2 and making sure the set times match the
> ones i gave you"

**A linear chain, not a stack.** PR 2 is built on PR 1's branch and opened only
after PR 1 merges (rebase onto fresh `main` → rebuild → retest → open); PR 3
the same behind PR 2. All three touch `plotBeetlejuice`, so they cannot be
parallel worktrees — and per WORKFLOW.md a dependent chain is built solo and
sequential anyway.

---

## PR 1 — the audience rig, the sound, and the top of the show

Carries the spec and this plan.

| File | Change |
|---|---|
| `src/p4.txt` | `bodyBlinder()`; 8 blinders (ch 26–33) around the arch and 6 audience movers (ch 34–39) over the seating, both in `buildRig` so all three stages get them; low `power` so they never steal a real light (BC) |
| `src/p6.txt` | `SECTIONS` rows BLINDERS + AUDIENCE; `GROUPS.all` off `FIXTURES.length` instead of a hardcoded 25 |
| `src/p5j.txt` | **new part**, after `p5i`: the `BJ_AUDIO` manifest and track player (BA), the audio-locked transport (BB), and `updateAudFX` — the pattern engine (BD) |
| `src/p5c.txt` | `showCueExtras` grows two fields: `audio` and `fx` |
| `src/p7.txt` | frame loop calls `updateAudFX(dt)` and `showAudioTick(dt)`; the first gesture arms a refused track |
| `src/p2k.txt` | `stageSwitch` stops the transport and the track, beside `cancelFollow` |
| `src/p5h.txt` | the pre-show and the top of the show, re-plotted off `pre show.txt` |
| `docs/AUDIO.md` | the File-column contract |
| `assets/audio/` | committed `README.md`, media gitignored |
| `tests/beetlejuice.js` | the new assertions (see below) |

**The sequence being built**, all in track-two positions:

| at | what |
|---|---|
| pre-show | house low, curtain in, sign lit, track one playing, blinders OFF, audience movers `wander` green↔purple. **Holds.** |
| 35 | GO: track one stops, **track two starts at 0:35**. Proscenium and sign hard red. |
| 63–65 | audience purple, **sweep up**; dark at 65. Sign stays red. |
| 66–69 | again. |
| 76 | blinders **flash white full**, then `random` fast — curtain and sign fly out under it |
| 86 | random stops, **one more white flash** |
| 88 | the stage fades up blue |

**Tests** (every one negative-checked against the pre-change build):
1. the patch is 39 channels on **all three** stages, and `chan(n).ch === n`
2. blinders and audience movers aim into the house (`aim.z` downstage of the
   arch), where every one of the old 25 aims at or upstage of it
3. no audience unit outranks a stage lantern in the `_active` sort at equal
   level — the "seen, not seeing" rule, asserted through `power`
4. `updateAudFX` stepped 10 s of `dt` **moves pan** on a `wander` cue and
   crossfades colour between the two given hues — the animator actually runs
5. `random` re-points faster than `wander` over the same stepped window
6. a cue with no `fx` clears a running effect
7. `BJ_AUDIO` ↔ `docs/AUDIO.md` File column, **both directions** (the AZ test)
8. **a missing track is silent and harmless**: no throw, the show still plots,
   still holds, still GOes — this is the state every suite runs in
9. the transport fires due cues off a faked `currentTime` and arms **no**
   follow timer while it owns the clock
10. `stageSwitch` stops the track and the transport
11. the pre-show holds; the blinders are at 0 on it ("dont have them on")
12. at 76 the curtain and the sign are both leaving, and by 86 both are out

**Watch:** `show.js:642` allows at most 10 bright channels on a curtain cue and
`show.js:662` wants no stage channels up — the top of the show now lights the
*house* through a shut curtain, which is the point. Those assertions get
narrowed to **stage** channels, deliberately, with the reason in the test.

---

## PR 2 — act one

`act one.txt`, ~30 looks from the blue opening to the act break. Only
`plotBeetlejuice` and `tests/beetlejuice.js` change.

Notable, beyond the colour work: 9:01 is a flash (an `fx`, not a level); the
closet change gets his "lights get darker … then go back up"; **1:11:09 takes
the house to HALF, not full** (the second thing he changed — see spec §6); and
track two **stops** at the act break.

**Tests:** every one of his timestamps is a cue at that `at`; the act break is
still a true blackout (the existing assertion must stay green); the interval
holds; the house lands at 0.5 and not 1.

---

## PR 3 — act two, and the set times

`act 2.txt` plus the set-list diff.

- track one loops through the interval; **track two resumes at 1:11:32** on GO
- ~35 looks, 1:11:47 → 2:15, including confetti at **2:14:52** (his number;
  the built confetti is on the 2:15:00 cue and moves)
- **the one set-time change: the netherworld goes 1:39:00 → 1:39:19**
  (`at:5940` → `at:5959`)
- a test that walks his set list and pins **every** set time and action, so the
  next round diffs in one command instead of by eye

---

## Order of work, and the checks that gate each step

1. suites green before (done: exit 0 on `676b771`)
2. write the assertion, watch it FAIL, then build — every new assertion
   negative-checked, because a passing negative check is a finding about the
   test (TRAPS)
3. `sh build.sh`, full suite, `node real.js` fatal null
4. commit built + source together
5. open the PR; **wait for merge**; only then rebase the next link
6. STATE.md as it goes, HANDOFF.md "Done" when it lands, new traps into TRAPS
