# STATE — 2026-08-11

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## THE FIRST HEADSET VERDICT ON THE SOUND ROUND — answered (rulings BF–BI)

The owner ran #121–#123 in the headset and came back with four things: the
blinders are not bright enough, the purple sweeps at the start are not
happening, the lobby lights should go out when the show starts, and the show
audio should be split in half so it fits.

**All three PRs are MERGED — #125, #126, #127.** `main` = **3287379**,
rebuilding byte-identically at **1,191,729 bytes**, **94 cues**, 18/18 suites,
`real.js` fatal null. Cache-bust for the headset: **`?v=20`**.

**And for the first time there will be sound on the headset**, because the
recordings are now in the repo and Pages serves them (RULING BI). Everything
about how this round SOUNDS and LOOKS is still unobserved — no suite here can
hear or render.

### The finding that shaped the round

**Two of his four complaints were ONE fault, and the pattern engine was never
part of it.** A probe stepped four seconds of the pre-show cue through the
frame loop before a line was written:

```
AUD MOVER 1  before:   {pan:0,    tilt:-64,   col:#2fbf5f, lvl:0.55}
AUD MOVER 1  after 4s: {pan:45.6, tilt:-42.9, col:#7e3fbe, lvl:0.55}
```

Pan swung, tilt lifted, green crossfaded to purple. RULING BD did exactly what
it says. What the audience rig could not do was **put light on the audience**:

| | won a real light? |
|---|---|
| the 6 audience movers, pre-show | 2 of 8 — and **none of the 4 a headset hands out** |
| the 8 blinders at 1:16, at FULL | 8 of 8, at intensity **0.866** each |
| one FOH lantern at **45%** | intensity **1.364** |

So eight blinders at "as bright as posible" were each 36% dimmer than one front
light at less than half, and the purple sweep ran perfectly and lit nobody.

### What the three PRs were

- **#125 — the audience rig lights the audience.** **RULING BF**: `power` was
  doing two jobs — ranking who wins one of the eight real lights *and* setting
  how bright it burns. RULING BC pushed the blinders to 0.9 for the first job,
  for a reason that still holds, and capped the second as a side effect nobody
  could see. `rank` is now the sort key and `power` the intensity; **rank
  defaults to power**, so all 25 stage channels in all three houses are
  unchanged to the byte. Blinders 4.6/0.9, audience movers 2.8/0.8.
  **RULING BG**: `AUD_LIGHT_RESERVE = 2` — a **ceiling, never a floor**,
  claimed only while an audience unit is actually lit, which across the 94-cue
  plot is the pre-show, four cues at the top and two moments in act two. No new
  lights. Measured after: the flash **0.866 → 4.427**, the sweep **0.43 →
  1.505** on two units flat *and two in a headset, where it had none*.
- **#126 — the front of house goes out when the show starts.** **RULING BH.**
  `HOUSE.lobby` had sat at 0.9 since the beginning and **no cue in any of the
  five shows had ever carried the field**, so the foyer burned through every
  performance. A cue may now say `lobby:`, and **saying nothing leaves it
  alone** — the `signCol` bargain, and for the same reason. 90 of the 94
  Beetlejuice cues stay silent and the other four shows carry it on no cue at
  all. His plot: up at the pre-show, out at GO, up at the interval, out for act
  two. Nothing had to be wired to the board (the LOBBY section re-reads `HOUSE`)
  or to the stage swap (`HOUSE` was already parked wholesale) — both asserted
  rather than assumed.
- **#127 — the show track in two halves, and committed.** **RULING BI, which
  amends BA.** Cut at **4292.000 to the sample**, and the cut point is FREE:
  the act-break cue stops the track at 4269 and act two resumes it at 4292, so
  the join sits inside a silence the show already had. **Not one timestamp in
  the plot changed** — each half carries the `offset` at which its file begins,
  the clock is `offset + currentTime`, and a seek is `at - offset`, so
  `{play:'act2', at:4292}` asks for the number it always asked for and gets
  0.0. `clock:true` says which tracks may drive the stack, replacing a
  hardcoded reach for `AUD.tracks.show`.

## RULING BA is amended, not repealed — and the reasoning is kept

BA said the recordings could never be committed and gave three independent
reasons. **The first is gone**: one 134MB file could not be pushed at all
(GitHub's hard limit is 100MB), and the halves are **69.4MB and 70.1MB** with
`preshow.mp3` at 42MB. **The other two were the owner's to overrule and he
did**, with all three in front of him — off a video (TRAPS forbids it for
frames and clips still), and a commercial recording on a repo with Pages on.
Git history is permanent: the ~180MB is in every clone from here on.

`docs/AUDIO.md` carries the whole reasoning, both sides, the offsets and the
ffmpeg split commands. **The assertion that said the opposite is reversed in
place**, not deleted — it now checks the three named files are really *in the
index* and that the directory still refuses everything else.

**`.gitattributes` names media `binary`, and that is load-bearing.** The repo
pins `* text=auto eol=lf` because `build.sh` breaks under CRLF, and `text=auto`
decides by content heuristic — a 70MB AAC file that lost that coin toss would
be rewritten on checkout and **nothing in this repo can hear**. `.glb` is on
the list before a single model has arrived, on the same reasoning.

## What is next

1. **PUT IT ON THE HEADSET — and this time there will be sound**, because the
   files are in the repo and Pages serves them. `?v=20`, and the Quest Browser
   caches hard. The full list is at the bottom of HANDOFF; the sharpest below.
2. **Is 4.6 too much?** Eight blinders at full, a metre from the face, five
   times the light they had. It is the one change in this round that could
   genuinely hurt, and it is one constant (`BLIND_POWER` in `buildRig`).
   `AUD_STROBE_HZ` stays at 9 deliberately — five times the light is a reason
   to be *more* careful about the 15–20Hz photosensitive band, not less.
3. **Does the purple sweep read now**, with two real lights and four beams? If
   it still reads thin, **the answer is already written down**: the floor pool
   is clipped to the stage box (`p4`), so the four unreserved movers land
   nothing on the seats. A purple decal crawling over the stalls costs no
   per-pixel light, which is the right shape for a Quest. It needs a
   seating-floor model per venue — the Palace rakes linearly through
   `houseFloorY`, each Arc house carries a stepped `H.rake`. **This is the
   first thing to build** if he reports it thin. Spec §2.
4. **Does the join sound?** Act two resumes at 4292 out of a different file.
   No suite in this repo can hear.
5. **The owner's models** — one PR per `.glb`, `docs/MODELING.md`'s File column
   is the contract. Unblocked and still owed.
6. `tests/smoke.js` still flakes under full-suite load (wall-clock dt; passes
   alone every time). Not a regression of this round. A task chip exists.
7. `pr6.json` in the repo root is still untracked and unruled.

## Decisions taken in this round that were NOT asked about

Both are in the spec so they are not rediscovered as bugs:

- **The lobby is scoped to the Palace foyer.** The Arc's foyer is a different
  circuit (`ARC.house` / `setArcHouse`) and it is **shared between two
  auditoria** — dimming it because one house went up would black out the other
  house's front of house mid-interval. A shared foyer answering one show's cue
  stack is a decision, and it was not this round's to make.
- **The house floor pool is deferred**, for the reasons in item 3 above.

## Feel constants for the headset (one-line retunes)

In `p4` (`buildRig`, this round):

- `BLIND_POWER` 4.6 / `BLIND_RANK` 0.9 — brightness and rank. **Rank is RULING
  BC and is still load-bearing**; power is what the owner was complaining about.
- `AUDM_POWER` 2.8 / `AUDM_RANK` 0.8 — the same pair for the audience movers.
- `AUD_LIGHT_RESERVE` 2 — how much of the eight (four in VR) the audience rig
  may ever hold at once.

In `p5j` (from the BA–BE round): `AUD_WANDER_RATE` 1.0, `AUD_RANDOM_RATE` 1.0,
`AUD_STROBE_HZ` 9.0 — see item 2. In `p5h` (from AW–AZ): `BJ_FLY_SPEED` 1.8,
`BJ_HILL_SPEED` 2.0 / `BJ_HILL_OUT` 9.5, `BJ_PART_OUT` 10.5.

## Standing facts

Suite count is 18 (`npm test` in tests/). The patch is **39 channels** on every
stage. RULING AV (model on the production, Beetlejuice only) still governs; AO
stays repealed; RULING B still holds (the flown PA boxes are rigging, and the
show's sound comes out of the browser, not out of them). RULING BB is untouched
by the split: while a **clock track** is really playing it IS the cue clock.

**Every timestamp in the Beetlejuice plot is a position in his WHOLE recording**
— not elapsed show time, and not a position in whichever half is playing. The
two differ by the 35 seconds the track is already into itself when the show
starts. `offset` is what keeps that true across two files.

## Shelved, deliberately

**The portal rebuild (RULING AX) sits on the LOCAL branch `bj-portal`** (commit
a22bd36, built on the old #116 base). It passed implementation but had NO review
passes and was never opened — the owner trimmed it out of scope. If he ever
wants it: rebase onto main (expect conflicts with the split rule in
`showCueExtras` and the p5h repaints), retest, review, open.
