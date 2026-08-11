# The audience light, the lobby and the split track — three PRs

Spec: `docs/superpowers/specs/2026-08-11-audience-light-lobby-and-the-split-track-design.md`
(rulings BF, BG, BH, BI — **BF amends BC, BI amends BA**).

**A linear chain.** Each PR opens only after the one before it merges, rebased
onto fresh `main` and retested. PR 2 and PR 3 both edit `p5h.txt`; PR 1 does
not touch it at all.

---

## PR 1 — the audience rig lights the audience (BF, BG)

The owner's first two complaints, which the probe showed are one fault.

**`src/p4.txt`**

1. `addFixture` gains `rank` (defaults to `power` when not given) and
   `audience:false`. Nothing else in the patch changes value.
2. `_active.sort` keys on `rank`; `l.intensity` keeps keying on `power`.
3. `AUD_LIGHT_RESERVE = 2`. After the sort, up to two of the pool go to the
   highest-ranked lit fixtures carrying `audience`; the rest is handed out in
   rank order as before. The hand-out list is what sets `_live`.
4. `BLIND_POWER 4.6 / BLIND_RANK 0.9`, `AUDM_POWER 2.8 / AUDM_RANK 0.8`, both
   named constants beside the audience rig with the reasoning, because they
   are headset retunes like `BJ_FLY_SPEED`.
5. Both audience builders set `audience:true`.

**`tests/beetlejuice.js`** — five assertions, every one negative-checked
against the pre-change build:

- a blinder at full is now brighter than a stage profile at full, and the
  1:16 flash puts more light in the room than it did (the fault, measured);
- **BC still holds**: at no level does an audience unit outrank a lit stage
  lantern for a light — sweep the level range, do not spot-check one value;
- the pre-show hands the audience rig 2 real lights where it had 2 of 6, and
  **still 2 with `VR.lightCap` at 4**, where it had none (the headset case,
  which is the one that was actually broken);
- the reserve is a ceiling: 6 movers lit, never more than 2 in the pool;
- an all-stage cue with the audience rig dark claims no reserve — all 8 to
  the stage, which is the regression the reserve could cause.

## PR 2 — the front of house goes out with the house (BH)

**`src/p6.txt`** — `recordCue` snapshots `lobby: HOUSE.lobby`; `fireCue`
applies it **only when defined**. `syncMasters` already reads `HOUSE`.

**`src/p5h.txt`** — four cues gain a `lobby`: pre-show `0.9`, GO `0`, the
interval `0.9`, act two `0`. The cue builder passes `lobby:L.lobby` through
(undefined stays undefined).

**Tests** — a cue with no lobby field leaves the foyer alone (the four other
shows); the Beetlejuice plot takes it out at GO and brings it back at the
interval; it parks and restores across a stage swap.

## PR 3 — the show track in two halves (BI)

**`src/p5j.txt`** — manifest entries gain `offset` and `clock`; `audPlay`
seeks `at - offset`; the transport finds the live clock track instead of
`AUD.tracks.show` and reads `offset + currentTime`.

**`src/p5h.txt`** — five audio cue fields renamed to `act1`/`act2`. **No `at`
changes.**

**`assets/audio/`** — `act1.m4a`, `act2.m4a`, `preshow.mp3` committed.
`.gitignore` stops ignoring them. **`.gitattributes` gains explicit binary
rules** — the repo pins `* text=auto eol=lf`, and a media file that lost the
binary heuristic would be corrupted on checkout in a way nothing here could
see.

**`docs/AUDIO.md`** rewritten: three rows in the File column, the offsets, the
ffmpeg split commands, and BA's amendment.

**Tests** — the bidirectional manifest↔doc pin extended to three files; the
offsets pinned against the cue timeline (a cue at 5000 is 708s into act2); and
**the "recordings cannot be committed by accident" assertion reversed in
place**, saying what it used to guard and why that changed — not deleted.
