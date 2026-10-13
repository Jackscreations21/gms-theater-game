# The cues against the blocking — notes for Jack (2026-10-12)

After the whole show was blocked (RULING FO), a spotlight pass checked every cue of
`assets/hamilton-show.json` for each segment. For every light meant for one person, it asked whether that person
stands in it. Where the blocking was wrong, the blocking was moved; that is done and in `assets/hamilton-blocking.json`.
**This file lists the rest: the places where the evidence says the CUE (or the rig, or the page) is wrong.** None of
these is edited. They are yours to rule or fix. The sources are the eight agents' notes in
`tools/blocking/research/seg1.md` … `seg8.md` (each segment's `## Spotlights` section).

**Read with this:**
- The pool data the pass used was dumped from the page on branch `actors`, before Binkley's cue revisions 3–5 (your
  checklist notes, on `cue-blackouts`, PR #233). **2026-10-13: `cue-blackouts` is merged into `actors`, the pools are
  re-dumped from the merged page, and `assets/hamilton-pools.json` is regenerated from them.** What that settled is in
  the next section.
- The agents allowed for the known differences: the Cabinet Battle sides, and 1-03 Q119's refocus of ch13 to
  centre. Where a note below may already be fixed by those revisions, it says so.
- Positions are set-local metres: x + is stage left, z + is downstage, and the deck is at y 0.045.

## Two blocking questions only you can rule

1. **1-05 The Schuyler Sisters — the sisters' order.**
   - Binkley's light (Q152/Q153 shafts, the verse pools) puts **Angelica SR and Eliza centre**.
   - The review captions and the well-known title photo (pink centre) put **Angelica centre and Eliza SR**.
   - The blocking follows the light.
   - If the photo is right, these channels swap: Q152's shaft goes to ch98 and Q153's to ch96; ch47/ch97 go to
     centre; ch52 goes to SR.
   - The blocking swap is ready in `tools/blocking/seg1/t105.py` (the `KEYS` / `SHAFT` tables).
2. **2-22 The World Was Wide Enough — which side each man fires from.**
   - Binkley's preset names at the shot put **Burr SR-upstage** (1130 "Burr R", (−2.0, −0.99)) and **Hamilton
     SL-downstage** (1137 "AH duel": ch91 (−2.68, −1.93), ch95 (1.57, 3.43)). By those names, the turntables have
     carried the pair half way round during the monologue.
   - The blocking keeps the ruled sides, Hamilton SR and Burr SL, and stands them in the same pools the other way round.
   - If the preset names are right, the sides at the shot should swap.

## After merging #233 (2026-10-13): what its cue revisions settled, and what is still open

Every item below was checked in the re-dump. For each, the cue's landing points in the old dump were compared with
the landing points in the new one.

- **SETTLED by revision 5: 2-02 Cabinet Battle #1's sides.** The mirrors this file asked for are in the data:
  - ch94 (Jefferson) is now at (−1.39, 3.75) and ch92 (Hamilton) at (1.39, 3.75), in 742–760;
  - 760's gloat pool, ch94, is now DR at (−3.15, 3.65);
  - 761–763.5: ch8 is now at (−0.83, 2.22) and ch92 at (1.29, 2.40).
  - These now agree with the blocking, which was already on the ruled sides.
  - **Still open from that item: ch99** at (3.68, 1.25) is not on Washington's chair at (1.0, −1.4).
- **SETTLED by revision 4: 1-07's top.** Binkley's FTB 190 has gone; 190.01 cross-fades out of Farmer Refuted.
  - The "Kings men DS" pools at 190.01 are unchanged: ch2 / ch4 at (±1.3, 4.1), ch25 / ch26 at (±1.5, 5.0). They
    are still empty, and question 3 still stands.
- **Now visible in the data: 1-03 Q120's focus leak.** Revision 4 added Q119's centre refocus of ch13. The page holds
  ch13 at (0, 1.15) through Q120–Q126 and restores (0, 2.40) only at Q129, as the item below predicted. Still open.
- **Unchanged, still open:**
  - 1-02 ch44 at (−0.69, 3.35);
  - 1-07 Q194–Q200 ch12 / ch13 / ch14;
  - 1-08 Q204's Kill-1 X4s. Revision 3 dropped one cue in 1-08, but the X4s still hold only from 204.01 to 204.02;
  - 1-15 Q452 / Q474;
  - 1-20 589 / 595 / 596. Revision 5 changed Guns and Ships' top (Viper 93 on the balcony, the sweep), not these;
  - 2-01 733 / 737. This item said "may be fixed by the sides revision"; it was not;
  - 2-07 Cabinet Battle #2's sides. Revision 5 moved its mic-drop and punchline in time only; the x → −x list below
    stands.
- Nothing in this file concerns 1-04 to 1-06, 1-09, 1-17, 1-18 or 2-08, the other tracks the revisions touched. The
  2-23 items are about reconstructions the revisions did not change.

## Added after notes2 (2026-10-13: Jack's notes on 1-01 to 1-03)

- **1-01 Q61–Q65, the roll call ("I fought with him", "I died for him", "I trusted him", "I loved him").** Jack: *"everyone
  who has one of those lines is on the balcony except Burr who is at center stage when he does his line."*
  - The singers sing from the galleries, placed by an eyewitness account (Jack's Reddit notes, `hamilton choreo
    info.txt` lines 144–150; its right and left are the audience's). All at y 2.74:
    - Lafayette (Jefferson) at (−0.5, −3.35) and Mulligan (Madison) at (0.5, −3.35), side by side near the centre of
      the upstage gallery;
    - Laurens at (2.2, −3.35), a person's length to their stage left;
    - the three sisters as a group on the SL end balcony (Guns and Ships' balcony): Angelica (5.1, 1.7), Eliza
      (5.55, 2.3), Peggy (5.1, 2.9);
    - Washington on the SR balcony at (−5.5, 2.2).
  - They stay up there for the line-up.
  - Burr sings Q65 at centre, (0, 2.5), downstage of Hamilton in the centre shaft at (0, 1.0).
  - **The cues still light the deck**:
    - Q61 ch47 / ch49 / ch51 at (−2.76, 3.06), (−0.60, 3.47), (1.99, 3.27);
    - Q62 ch51;
    - Q63 ch12 at (−0.57, −0.59);
    - Q64 ch52 / ch48 at (2.55, 1.92), (−1.99, 2.02);
    - Q65 Burr's AF, ch2, at (−1.82, 4.25).
    - These are from the re-dump after #233.
  - On the gallery, Q61–Q64 light only VL3500 ch74, at (1.9, −3.61) and level 0.3.
  - Q66's line-up does light the whole gallery, ch181–ch192 at 0.6, so the singers are lit there for it.
  - **Wanted:**
    - Q61 (the friends): ch47 / ch49 / ch51 to Lafayette (−0.5, −3.35), Mulligan (0.5, −3.35) and Laurens
      (2.2, −3.35);
    - Q62: ch51 stays on Laurens (2.2, −3.35);
    - Q63: ch12 to Washington on the SR balcony (−5.5, 2.2);
    - Q64 (the women): ch52 / ch48 to the sisters on the SL balcony, about (5.3, 2.3). Revision 5's Viper 93 on the
      1st Electric is already aimed at chest height on that balcony for Guns and Ships, and may serve;
    - all at y 2.74;
    - Q65: move ch2 to centre, (0, 2.5).
- **1-02 the street lamp (cue 80's practical) is struck at 80.0**, just before the friends carry the picnic table on at Q86.
  Any later cue that brings the lamp's practical up lights an empty spot.
- **1-02 / 1-03 the picnic table stands UPSTAGE RIGHT, (−2.4, −1.0)**, not DSC. 1-03 Q132's "Cntr Table" no longer
  has a table: the table is struck in the blue of Q119.

## Added after review 2 (2026-10-13: Jack's verdict — the ensemble far less, the invented formations cut)

Review 2 moved the blocking in every segment. The research notes record what moved, each under its
`## Review 2 (Jack's verdict)` section. Some cues now light places nobody stands, or follow the old staging. These
are new or changed:

- **1-10 Q302 (Two Weeks), ch25 (−3.51, 4.01) and ch26 (2.86, 2.10).**
  - Binkley's real cue raises these two keys in part 3, from about 124 s.
  - The restaged scene follows photo 302 and the fan accounts:
    - the sisters on a bench at (0, 3.0), backs to the house;
    - Hamilton and Schuyler (in his chair) upstage on the disc.
  - So both keys now light nobody. Either re-aim them onto that geometry, or the photo is not Q302's moment.
- **1-20 cue 596** (a reconstruction): its gallery specials, Vipers 25/26 on the upstage gallery, now light nobody,
  because the gallery soldiers were cut. Drop them, or put the soldiers back.
- **1-23 cue 631.1** (a reconstruction) puts Hamilton in his downstage special, **X4 44**, to address the jury.
  - Since review 2 the jury sits facing the defence table, as real 631.01 shows, and he addresses them from the table.
    X4 44 at 21.6 s lights nobody.
  - If the jury should face the house instead, turn the six chairs (`tools/blocking/props.py`, segment 4) and move
    him back to (−1.05, 3.4).
- **2-09 992–995, ch25 (−0.55, −3.02).** Washington takes over the reading downstage centre in ch13, and Hamilton
  finishes it at Washington's desk. ch25 still lands on the upstage gallery, where nobody is. **Refocus ch25 onto the
  desk, about (−0.55, 0.2).**
- **2-07 the sides (unchanged, still open).** The blocking is on the ruled sides: Jefferson and Madison SR, Hamilton
  SL. The cue data still has the old sides. The mirror list is below under Act Two.
- **1-23 659 / 661** (Washington "high centre") are unchanged. They still light empty air while he is on the SL
  gallery.
- **Not counted as cue faults.** The plotter's spot-check (`tools/blocking-plot.py --pools`, 18 moments across all
  eight segments) finds the principals in their person lights wherever the cue data lights them. Every miss it shows is
  one of the items in this file.

### Questions for Jack from review 2

3. **1-07, the top: "Kings men DS".**
   - Photo 190.01 shows two figures in the downstage side pools (preset 203 "Kings men DS") for the first 7 s.
   - Nobody knows who they are; perhaps Hamilton and Seabury held over from Farmer Refuted.
   - They are left out. Adding them needs segment 1 to set them in the 1-06 / 1-07 blackout.
4. **1-09 / 1-10, the side flip the photos forced.**
   - Photo 300.3 (Binkley's real top of Helpless) has the three sisters SR and two men SL. The fan write-up has the men
     leave SL.
   - Review 2 flipped the earlier passes, which had the sisters SL, to match. So Burr is DL for the ball and the sisters
     cross to SR on Q293.
   - Confirm the flip.
5. **2-11, the King's stool: which side?**
   - It is set UL (4.2, −1.6), the ruled "King UL".
   - The fan account has him set up a little chair "on the left". As the audience sees it, that is SR.
   - Viper 17 "King UL" lands near the SL stair, so the cue data agrees with SL.
   - SR or SL?

## The rig and the page (not single cues)

- **The FOH X4s ch41–46 hit house geometry about 0.8–1.2 m from their lenses**, at about (x, 5.5, 8.4) set-local:
  something in the scanned house ceiling in front of the FOH position.
  - The page draws no pool for them where this happens.
  - ch43 never reaches the stage. ch43 is preset 151 "Ham DSC" / preset 24 "DSC -Z-", meant as Hamilton's and
    Washington's front key all show.
  - ch42 (preset 1127 "AH DR", 1127.1 "Ham/Burr"), ch41, ch44, ch45 and ch46 are lost at some foci.

  Cues affected (the blocking stands everyone on the deck points the beams would reach):

  | Track | Cues | Unit(s) |
  |---|---|---|
  | 1-03 | (My Shot) | ch43 |
  | 1-07 | Q194.2 | X4 43 |
  | 1-08 | Q206 | ch41/42/43 |
  | 1-20 / 1-23 | 568–572, 597, 642, 649, 659, 666 | X4 43 |
  | 2-11 | 1014 | ch43 |
  | 2-12 | 1025/1026 | ch43, ch45 |
  | 2-13 | 1034–1038.4 | ch43 (Hamilton's writing key, deck point (0.33, 2.28)) |
  | 2-13 | 1038.5 | ch44 |
  | 2-14 | 1045–1046.5 | ch46 (Angelica's special, (1.29, 2.35)) |
  | 2-15 | 1052–1063 | ch42 (Eliza's front fill) |
  | 2-17 | 1110–1114 | ch42/43 |
  | 2-18 | 1129–1135 | ch42/43 |
  | 2-19 | 1166–1171 | ch42/43 |
  | 2-22 | 1248–1258 | ch42/43 |

  **Fix:** trim the hanging position or cut the house geometry there (`RIG_TRIM` / the walls cut). Check with
  `MIDTOWN.lx.beam(43)`.
- **The apron Vipers ch2/ch4 stop about 0.8 m from the lens too** (hit (±2.17, 5.6, 8.4)) in **2-06 935/938**. These
  are Eliza's and Philip's warm front keys.
  - Their focus is also at floor height, 3.8 m apart, for two people reading one paper.
  - Suggested: focus at y ≈ 3.6, x ≈ ±0.9.
- **2-05 866–876.1 and 887: a preset reference the page does not resolve to a focus.**
  - 866 part 2 "table USC" calls ch13/ch18 by `ref: preset 767`, with no pan or tilt. The page keeps their previous
    focus (preset 25 "MSC Cntr T/T") and lands them at (0, −1.94), 2 m upstage of the table.
  - Preset 767 itself is focused at (−0.035, 0.70) / (−0.054, 0.93), on the table.
  - 887 "Table cloth pull" (`ref: preset 805`, (0.05, 1.81)) has the same problem.
  - This is an import / player problem (`showCompile`'s focus from a preset reference), not a cue.
- **The cue round's pool data class "special"** (zoom ≤ 14°, or a pool ≤ 1 m) misses the 14.5–18.5° face keys and
  duet pools. The plotter now counts any unit at zoom ≤ 18.5° as a person light.

## Per track

### Act One
- **1-02 Q81–Q83, ch44 ("Ham dsc", preset 259).** The page lands it at (−0.69, 3.35). The preset's focus is
  (−1.21, 3.74), and 1-06 Q185 lands the same channel at (−0.28, 2.93). Check which is meant.
- **1-03 Q120 (revision 4): a focus leak.**
  - Q119 refocuses ch13 to (0, 0.3, 1.1). Q120 restores colour but not focus or zoom, so ch13 tracks at centre
    through Q126, until Q129 sets (0, 0.3, 2.3).
  - Q120 probably wants `focus [0, 0.3, 2.3], zoom 10`.
- **1-07 Q190.01:** ch2/ch4 (±1.3, 4.1) and ch25/26 (±1.5, 5.0), preset 203 "Kings men DS", are empty pools.
- **1-07 Q194–Q198:** ch13 lands at (0, −0.13), preset 22's focus. The cue also names preset 222 "King DSC", which
  puts ch13 at (0.03, 4.95), on the King. **Q200 BUTTON**, "snap to George in white", puts ch12/13/14 at
  (−1.45, −0.93) / (0, −0.13) / (1.45, −0.93); preset 222 has all three at about (0, 5.0).
  - Which preset wins? With 222 the King stands at z 4.6–5.0.
- **1-08 Q204:** its own Kill-1 X4s hold for only 0.35 s (204/204.01 GO together, then 204.02 drops them).
- **1-10 Q301.2 "Angelica crosses":** two pools at (±2.23, 1.69). The SL one lands on a dancing couple; the SR one
  lights nobody. Re-aim one to the SL stair's foot (2.4, −2.2), or drop them.
- **1-10 Q314–Q318:** ch12/ch14 (∓0.47, 2.31) at 0.7 while the couple is apart; they light passers-by only.
- **1-11 Q369 (71.64) and Q370 (79.77, "First sight of Hamilton"):** both light the UL pool, ch14 (3.81, −1.02). The
  blocking (and the accounts) freeze Hamilton in the DR pool (−3.2, 3.0) from 57.5 to 91.
  - **Mirror both to preset 325 ch12, (−3.21, 3.04).**
- **1-11 Q384–Q387:** ch14 (UL) held at 0.9–1.0 with nobody in it (Q387 is "Angelica isolated DC in white"). Drop ch14.
- **1-11 Q366.01–Q370, X4 48/51:** they land at (∓2.74, 1.65), preset 25's focus, on nobody. Binkley's preset 325
  "3 pools" has them at centre, (0.38, 0.90) / (0.08, 0.97): Angelica's isolated special. Which preset should win?
- **1-15 Q474, the shot:** ch97/ch99 land on the very lip (z 5.05 / 5.34), and DL is 0.3 m further downstage than DR.
  The seconds are only just inside.
- **1-15 Q452 "#1":** a full steel-blue unit (ch18) lands UC on nobody. If it is meant as a special, the cue should say
  for whom.
- **1-20 596:** the label names soldiers on the SR, SL and back galleries, but its only gallery specials are Vipers
  25/26 on the upstage gallery. The soldiers on the SR arm and the SL gallery are unlit.
- **1-20 595/596:** twelve deck pools for seven deck bodies. Vipers 1, 2, 5, 6 and 16 light nobody, because six of
  the company are up on the galleries.
- **X4 48/51** (±2.74, 1.65), at lopsided levels (38 % / 16 %), in 1-20 589 and 1-23 646 / 658, are never on a
  principal. They look like a stray in the tracked state.
- **1-23 633–635 (AF):** the AF X4s are not a special on Hamilton. Viper 4 lands on the delegates' side
  ((−0.46, −1.24), then (0.77, 0.29)). These are Binkley's real cues; left.
- **1-23 646–647, Viper 12** (−3.28, 3.17), full, SR, is lit for 24 s before anyone is there. Eliza enters into it at
  231.4, when 648 refocuses it to (−3.05, 2.31). It looks like her key coming up early.
- **1-23 646 does not use preset 732 "Woman SL"'s focus.** The preset is Viper 13 at (3.38, 0.22); the cue lights
  Viper 14 at (3.81, −1.02). Angelica stands where both reach.
- **1-23 659 (Viper 18, deck point (0, −0.66)) and 661 (Vipers 25/26, (±1.02, −0.93)) light empty air.** By ruling
  Washington is on the SL gallery at (4.9, −1.5) for the finale. **Refocus them there.**

### Act Two
- **2-01 733 / 737 (the Cabinet sides):** 733 ch94 (3.06, 3.65) DL should go DR, where Madison enters; 737 ch92
  (−3.06, 3.65) DR should go DL, onto Hamilton. *May be fixed by the sides revision on `cue-blackouts`.*
- **2-02 742–759, mirror ch92/ch94** (∓1.3, 3.75): in the data Jefferson's key is +x and Hamilton's −x, against the
  ruled sides (Jefferson and Madison SR, Hamilton SL).
  - Also mirror: 756 "the DL pool on the targets"; 760 ch94 (3.0, 3.6), the gloat pool, should go DR.
  - 761–763.5: ch8 (Washington, 0.8, 2.2) to (−0.8, 2.2); ch92 (Hamilton alone, −1.2, 2.4) to (1.2, 2.4).
  - **Not ch99** (the chair pool, 3.6, 1.2). It lands on the ensemble, not on Washington's chair at (1.0, −1.4);
    re-aim it there.
  - *The mirrors may be in the sides revision on `cue-blackouts`.*
- **2-04 preset 769 "DL Ham/James":** four of its five units are focused DR (ch92, ch93, ch97, ch98). Only ch21 is DL.
  Cue 806 lights ch97/98 DR, and its note says "Reynolds' DR special"; the blocking puts James Reynolds DR. If the
  label is right, the preset is mirrored, and James goes back DL (3.4, 3.5).
- **2-05 867.4–867.6 "the chess game":** the eight X4 pools ring (0, −1.7), round the mis-landed table special (see
  above). They should centre on the table (0, 0.2). ch59 also hits the upstage-gallery rail at (−2.0, 3.66, −2.98).
- **2-05 894 Button:** Burr must leave at 315.15 to be off by the segment's end, so the single button special holds him
  for 0.15 s. A later blackout would fix it.
- **2-07 Cabinet Battle #2, mirror (x → −x)** to the ruled sides:
  - 945–949: ch10 (2.59, 3.05) / ch5 (2.56, 2.75), Jefferson's keys.
  - 949: ch94 (2.23, 3.02), the mic-drop.
  - 951–953: ch1 (−2.56, 2.75) / ch6 (−2.59, 3.05), Hamilton's keys.
  - 953: ch92 (−2.34, 3.02).
  - 955: ch92 (−1.30, 2.61) Hamilton's top, ch93 (0.52, 2.16) Washington's.
  - 957: ch94 (1.51, 3.02).
  - The beam fan ch71–76 is asymmetric too (ch76 lands on the SL gallery, ch71 high SR). ch93 on centre needs nothing.
  - *May be in the sides revision.*
- **2-11 1010–1011, Viper 17 "King UL":** it lands on the SL stair's third riser (2.68, 0.69, −2.48); on a body it
  lights about (1.9, −2.45). The ruled King UL is (4.2, −1.6). Re-aim.
- **2-11 1013–1014, X4 44 "Ham dsc"** (−1.3, 3.5): Hamilton is on the upstage gallery for the papers drop. It needs a
  gallery focus near (0, −3.2).
- **2-12 1023, X4 44 at 0.8:** on nobody while Hamilton is at the SL cabinet.
- **2-14 1046 / 1046.5, Viper 94** (Eliza's pool, 3.5, 2.4): the reviewed blocking has no Eliza in the Pamphlet.
  Either the cue goes, or Eliza comes back.
- **2-16 1071–1075, Viper 13 "Eacker's box SL":** it lands on the DECK at (3.4, 2.7). The accounts and the cue's own
  words put Eacker in a box on the SL gallery, which this beam cannot reach.
- **2-16 1087–1089, X4 42 / 45 duel pools** (DSR (−3.0, 3.8), DSL (3.05, 3.7)) are on nobody during the count
  (169.9–172.5). The RULED end marks are Philip at (−0.4, 2.4) and Eacker at (1.6, −1.0). Refocus onto the marks.
- **2-18 1121 ch4** is downstage just SR of centre; the accounts put Angelica DSL. **1124 ch1** (2.43, 2.75) "Eliza's
  verse — Eliza SL" and **1125 ch14** (2.23, 2.93) "Eliza's prayer" light the SL side of the ring for 30 s. Eliza is
  not on until the plea, so either re-aim them to C (Hamilton alone) or put a silent Eliza there.
- **2-19 1166–1171 ch43 "Hamilton DSC"** for the endorsement: the accounts put him at the centre of the upper level,
  and ch43 is blocked anyway (see the rig).
- **2-20 1196–1205:** ch2 (−2.82, 2.96) "Hamilton's desk DR" and ch13 "snap to Burr" are inverted against the
  blocking. The blocking follows the fan account: one desk at centre, Hamilton at it, Burr SL. So ch13 (Burr's desk)
  lights Hamilton, and ch2 lights an empty DR spot at full for about 45 s. Point ch2 at Burr's SL place (3.1, 3.0),
  or go back to two desks.
- **2-22 "GW UL Steps", ch12** (preset 1169 "GW", focus (6.41, −1.50)) lands off the SL gallery on a wall. Washington
  stays on the SL stair.
- **2-22 the duel line:** see question 2 above.
- **2-23 has no real Binkley cues** (the real chain ends at 1271, 2-22's FTB); the finale and the gasp are
  reconstructions.
