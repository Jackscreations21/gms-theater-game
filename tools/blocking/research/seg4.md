# Segment 4 research: 1-18 Guns and Ships to 1-23 Non-Stop

The generator is `scratchpad/act/gen4.py`. It writes `segments/seg4.json`, and its notes are in `seg4-notes.txt`. To change the blocking, edit the script and rerun it with `python -I gen4.py`. The script checks time order, speeds, standing bodies closer than 0.5 m, and deck legs that cross a stair, a post or a prop. It routes those legs round the obstacle with A* on `tools/hamilton-floor.json`. `snap4.py 1-20@86 ...` prints an ASCII top-down plan of where everyone is at a given moment.

`blocking-merge.py --check` reports 0 errors and 0 warnings. The file has 1,346 waypoints.

## Sources consulted

The web gave very little about the staging of these six numbers. Fandom wiki pages returned 402, Dance Magazine and Backstage returned 403, and the searches found reviews and plot summaries rather than blocking. What I could use:

- Dance Spirit, "Hamilfilm's almost here…": the Yorktown battle "plays out entirely through movement", and the cast "seems to quadruple" through shifting formations.
  https://dancespirit.com/hamilfilms-almost-here-these-are-the-dance-moments-weve-been-thinking-about-non-stop/
- Slate, the 2016 Tonys: Yorktown was performed without muskets. Slate quotes Blankenbuehler (via Playbill) on the ending: the soldiers take up guns for the first time and immediately set them down, and he says the soldiers have no guns in the battle itself (pantomime).
  https://www.slate.com/blogs/browbeat/2016/06/12/hamilton_tonys_cast_performs_yorktown_the_world_turned_upside_down_video.html
- Dance Magazine, "10 Minutes With Andy Blankenbuehler" (2014): the battle is pantomime, with no guns (seen in the search snippet only).
  https://dancemagazine.com/10_minutes_with_andy_blankenbuehler_/
- CUNY Academic Works, "The Impact of the Revolving Stage in Hamilton", and Boing Boing / HuffPost on the turntables: the double turntable carries movement through space and time, and its direction is read as time passing.
  https://academicworks.cuny.edu/cgi/viewcontent.cgi?article=2104&context=ny_pubs
  https://boingboing.net/2018/06/05/what-inspired-the-hamilton.html
- Wikipedia, Yorktown (The World Turned Upside Down): the plot points (the bullets out of the guns, redoubts 9 and 10, the British drinking song).
  https://en.wikipedia.org/wiki/Yorktown_(The_World_Turned_Upside_Down)
- Wikipedia, Non-Stop (Hamilton song): the plot order of the number (the Weeks trial, the Convention, the Federalist Papers, Angelica to London, Eliza's plea, Washington's offer, the act-one counterpoint).
  https://en.wikipedia.org/wiki/Non-Stop_(Hamilton_song)
- Disney+ press images (index only): https://press.disneyplus.com/disney-plus/hamilton/images

The most useful sources were the cue round's own research, as it appears in the cue reasons in `assets/hamilton-show.json` and `brief/tracks/1-18..1-23.txt`:

- **1-18**: a Disney+ frame shows a fan of pale beams converging on Lafayette, with the company in warm side light. Washington has one special at centre on the calls for Hamilton (59.2). The button is Washington's special plus Hamilton's DS special.
- **1-19**: a Disney+ frame shows Washington in a warm-white key in the sepia tent.
- **1-20**: a Joan Marcus photo shows Hamilton on a box near the lip. A Disney+ frame shows the night attack with each soldier in his own small pool on the turntable. At 85.4 the gallery specials pick out soldiers on the SR, SL and back galleries. Lafayette is in a DR pool (100.1), and a cool special is upstage centre for the surrender flag (155). LSA: the number ends with the company on the turntable, each brandishing a weapon, isolated in his own pool.
- **1-21**: the King is in a tight special at the lip.
- **1-22**: a Disney+ frame shows Burr seated SL and Hamilton SR, each in his own warm pool with dark between.
- **1-23**: Binkley's real labels are Move to center (633), AF-Center (634), Men on Ring (635) and Burr/Men (638); preset 766 is "AH Burr DR". A Disney+ frame of the finale shows Washington high centre (aimed about 2.4 m up), Hamilton below, Angelica SL and Eliza SR. The Federalist section is a night study at a desk.

What I could not do: I could not watch video. My memory of the Disney+ film fills some gaps below. Each such point is marked **(memory)**, and the reviewer should check it against the film.

## Per track: what is staged, what is sourced, and what is invented

### 1-18 Guns and Ships (partly sourced)
- **Burr** narrates DR (enters W-DSR at the top) and steps aside SR at the build. He joins the chant DS and leaves W-DSR at 100. **Invented** (narrator position by analogy with other numbers).
- **Lafayette**: walks the USG and the SLG in the dark (from G-UC, 8 to 17 s) to the G&S balcony spot. He is there for the build (17.6) and the reveal (31.3). He leaves the spot at 36 and comes down the SL stair (top at 40.4, foot at 44.9) to centre at 48.8, the plan cue. **The balcony start is from the coordinator's brief and the glossary.** Cue 562 says the beams converge on "Lafayette centre" at 31.3, which conflicts with a balcony reveal at 31.3. *Reviewer: check whether he raps on the balcony or is already down by 31.3.* **(memory)** He comes down to the deck fairly early in the rap.
- **Washington** enters through D-UC to centre for 59.2 (his special). He moves DC for his anthem (80) and goes back to centre (1.2) for the build and the button. The **centre** comes from the cue; the moves are invented.
- **Hamilton** enters W-DSR at 112 and is in his DS special (−0.8, 4.0) facing upstage to Washington at the button. Sourced as to the button state.
- **Company** (ens1 to ens10, Laurens and Mulligan as soldiers, 12 bodies): they march on into two blocks (7 s) and turn to the balcony at 17.6. At 31.3 they stand on the outer ring facing the balcony, then walk the ring 120 degrees in 42.3 to 48.8 ("the fan opens"). At 59.2 they make an upstage arc watching the centre. At 69.6 the chant is two blocks, which step in at 75. At 80 they make an arc round Washington DC, tightening at 93.7. At 104.4 they make a V opening to the house behind Washington, and step down at 109.6. At 120 they fall back to an upstage "watchers" line (z −3.1 and −2.2), where they stay through 1-19. **All of this is invented**; it follows the cue states (the ring at 42.3, full stage at 48.8 and 69.6).

### 1-19 History Has Its Eyes On You (cue-led, mostly invented)
- Washington tells Hamilton about his first command. Washington is at (0.2, 1.6), moves DS (15), crosses towards Hamilton at verse 2 (52.9, 65.2), and comes back to centre for the gospel finish (74.7) and the last line (87.1). At the transition he exits D-UC.
- Hamilton is SR of him (−1.4, 3.4), cheated out and turned towards him.
- The company comes out of the dark into an upstage arc at chorus 1 (27), into a closer arc at chorus 2 (39.5), back to the dark line at verse 2 (56), and into a full arc at the finale (77). At 94.5 they form the Yorktown line (z −1.4). Mulligan slips out W-USL (he enters as the spy in 1-20). **(memory)** Ensemble backing in the dark behind Washington; the arcs are invented.

### 1-20 Yorktown (partly sourced)
- **Hamilton is on the box near the lip at 0** (Joan Marcus photo, via the cue research). Lafayette enters W-DSL. At 22.4 they have the farewell exchange DSC, facing each other at ±45 degrees **(memory: the DSC handshake and exchange)**.
- **The line**: the company line (11 bodies at 0.8 m spacing) advances to z 1.2, falls back at 22.4, and surges to z 2.4 for the company's Shot reprise at 32.2. "The Yorktown line" is from the brief; its depth and moves are invented.
- 43.6: the first title phrase. The line becomes a ring (r 2.9, Lafayette joins it) and turns 60 degrees. 51.2: the ring recedes to the upstage dark, and Hamilton is alone DS for his facing-death verse (cue: stark, exposed). **Invented**, from the cue's turning gobos.
- **The night attack (70.8 to 90)**: six soldiers are in their own pools on the turntable (sourced: Disney+ frame), with Hamilton at centre. At 80 they creep 25 degrees round the disc (invented). The other six climb to the galleries for the gallery specials at 85.4, which are sourced as SR, SL and back galleries. ens6 and ens7 go to the SR arm (via the SR stair and the cross-walk), ens8 and ens9 to the SLG (via the SL stair), ens10 to the USG SL (via the SL stair), and ens1 to the USG SR (via the SR stair and the SR strip). The climbs are 4.5 s and staggered.
- 90.4: Hamilton narrates DS (cue). Laurens steps into a DL pool (93), which is **invented**: the lyric reports him elsewhere, and no pool is sourced. Lafayette takes the **DR pool at 100.1 (sourced, preset 968)**.
- 109.9: **Mulligan bursts in from D-UC** to (0.3, 2.0). The entrance moment is the cue's; the direction is invented. **(memory)** In the film he appears among the redcoats and throws off the disguise. The deck soldiers rally in an arc round him (120.1), and the gallery soldiers come down (112 to 124).
- The drill (129.9) is a 3x4 block with Hamilton and Lafayette in front. The battle (133.3 to 155) is a wedge to the house, a charge SL (137.5), a ring facing out (141.7, the cold turn), a wedge charging SR (146), and a surge DS (150.5). **Invented**; Dance Spirit says only "seamlessly shifting formations". No guns: this is pantomime, which does not matter for mannequins.
- **The surrender flag (155)**: ens5 leaves the battle at 146, goes out D-UC and up the back way (G-UC), and stands at USG centre (0, −3.35). The cue gives "a cool special upstage centre" for the redcoat on the parapet; the person is my reading. The soldiers stay in a few pools, turned towards him (158). At 169.8 the soldiers stand in a cold arc and Hamilton is in the one warm pool (cue).
- **Washington** enters D-UC for the surrender terms (179.8) at (0, −0.6) and goes upstage for the song (UC (0, −3.1)). The celebration (189.6) is spread full stage (invented).
- **The World Turned Upside Down (198.4)**: nine soldiers stand on the outer ring (r 3.2, 40 degrees apart) and four on the inner disc (r 1.6), with Hamilton at centre. At 204.2 to 217.1 they counter-rotate: outer +160 degrees, inner −120 degrees. At 217.1 the spin reverses (the cue says "the spin reverses"). At 230.6 they face front for victory. At 235.4 each steps out into his own pool (sourced: LSA). **(memory)** The slow-motion stagger of the British happens during this song; the bodies are walked slowly here (0.6 to 0.7 m/s).
- At the blackout (240.14) everyone exits by the nearest up or mid wing or D-UC, at 1.7 m/s, which clears the King's path along the DS edge.

### 1-21 What Comes Next? (place sourced, moves invented)
- The King walks on from W-DSL in the blackout and is at the lip special by 2.0 (cue: tight special at the lip). He makes small shifts on the stomp (16.5), the threat (54.5, a step to the edge) and the quiet line (63.4). He exits upstage through D-UC at the transition (96.8).
- *Reviewer: check the King's entrance side.* **(memory)** In his numbers he usually walks down from upstage centre. I used DSL only because the soldiers were still clearing the upstage area.

### 1-22 Dear Theodosia (sourced frame, moves invented)
- **Burr SL (2.8, 2.0) and Hamilton SR (−2.8, 2.0)**, each in his pool, from the Disney+ frame in the cue research. Each stands and comes DS on his own verse: Burr at 29.5 and 44.1, Hamilton at 75.5 and 87.5. Both are full at 114.2. They close to ±1.3 m of DC for the duet (135.6) and turn towards each other for the last tag (162.5). In the dark at the end they take their marks DS for the top of Non-Stop, keeping their sides so they do not cross.
- Not on the album, so not staged: "Tomorrow There'll Be More of Us" (Laurens' death letter), which plays in the show between these two numbers.

### 1-23 Non-Stop (cue-led; Binkley's labels anchor the Convention)
- 0.7: Burr narrates. The courtroom: a jury of six (ens1 and ens6 to ens10) on chairs in two rows SR, Levi Weeks (ens4) at the defence table at C, a judge (ens2) UC, and two onlookers (ens3, ens5) SL. **Invented** layout; the cue gives chairs and a desk. Hamilton addresses the jury from his DS special (21.6, cue) and walks towards them (30).
- 41.5: the first chorus, with the company in an arc round the two lawyers. 52.3: the hook, with the company on the outer ring and Hamilton at C. 62.5: the ring turns 108 degrees. 73.8: Hamilton's brag at DSC (cue).
- **The Convention**: the women of the company leave (78.5), and six delegates sit in an upstage arc (85.2). **Move to center (633)**: Hamilton arrives at C at 95.6 for AF-Center. **Men on Ring (635, 99.5)**: the delegates ring him and walk 60 degrees. At 636 (104.6) they close in to r 2.2, and Burr steps in DS of him. **Burr/Men (638, 115.1)**: Burr is DSC with the men in a wedge behind him, and Hamilton is pushed upstage. Sourced as to the moments and the ring; the shapes are invented.
- **Midnight at Burr's DR (125.3, preset 766 "AH Burr DR")**: the men exit, and Burr (−3.9, 3.3) and Hamilton (−2.9, 3.0) talk. Hamilton presses closer at 169.9.
- 187.9: Burr's Wait for It reprise, alone in a blue column at C (cue: from straight above). Hamilton exits W-DSR.
- 198.1: "the watchers on both galleries" (cue). Four come on the USG through G-UC, three go to the SR arm via W-MSR and the SR stair, and three go to the SLG via D-UC and the SL stair.
- 207.3: Angelica's farewell SL (3.4, 3.0) (cue: her key SL). 225.4: Hamilton in his DS special. 231.4: Eliza's plea SR (−3.4, 3.0) (cue: her SR key). Angelica leaves W-MSL at 245 and Eliza leaves W-MSR at 249.
- 251.6: the Federalist Papers night study, with Hamilton at his desk at C (0, 1.5) (cue: the desk). Burr counts the essays DR. 272 to 286: the watchers come down onto the outer ring, and the ring turns 108 degrees (286 to 300.7).
- 304.3: **Washington high centre**, on the USG at (0, −3.35), entering through G-UC (cue: "Washington high centre, aimed 2.4 m up, on his stand"). *Reviewer: "his stand" may be a raised box on the deck rather than the gallery.* The gallery gives about 2.74 m of floor; the aim of 2.4 m fits a head on a box of about 0.8 m better. Burr crosses to DSL (2.6, 4.6).
- 327.1: the sisters' pools. Eliza (−4.1, 3.1) and Angelica (4.1, 3.1) stand outside the ring so the turning ring does not run through them. 332.2: the finale: Washington high, Hamilton below at C, Angelica SL, Eliza SR (sourced). 352.4 to 364.8: the full counterpoint with the ring turning 108 degrees (cue: turning turntable). 368.7: they step out to r 3.5. 372: the two at 6 o'clock open the gap. 374: Hamilton walks to DSC for his name (cue).
- At the blackout (382.16) everyone is off by 384.4, the segment limit. They run 2.0 to 3.4 m/s in the black: Hamilton, Burr and two ensemble to W-DSL, Eliza and two ensemble to W-DSR, Angelica to W-MSL, Washington through G-UC, and the rest to the nearest up or mid wing or D-UC.
- Kept off in Non-Stop: Laurens (dead by now), Lafayette (gone to France), Mulligan (the cast file allows Madison only in Act 2), Peggy and the King.

## Merge-tool warnings left standing
None. `--check` reports 0 errors and 0 warnings. The script's own checks still flag one point: Hamilton's final run in the 1-23 blackout is 3.3 to 3.4 m/s, under the 3.5 m/s limit, and it is forced by the 384.5 s segment limit.

## Open questions for the reviewer (most important first)
1. **Guns and Ships, Lafayette's balcony timing**: is he on the G&S spot for the reveal (31.3) and the start of the rap, as written, or already down by 31.3, which is what cue 562's "converging on Lafayette centre" suggests?
2. **Non-Stop, where Washington stands for 304 to 382**: on the USG gallery, as written, or on a raised stand/box at the deck?
3. **Yorktown, the redcoat with the white flag**: which ensemble member, and where? I used ens5 at USG centre.
4. **Yorktown, Mulligan's entrance**: direction and disguise. I used D-UC, running to centre.
5. **What Comes Next?, the King's entrance**: DSL (written) or upstage centre.
6. **Non-Stop, the courtroom layout**: which side the jury sits; Burr's narrator position at the top.
7. **Which principals are in the company in Non-Stop's finale**: I left out Laurens, Lafayette, Mulligan and Peggy.
8. **The battle formations (133 to 155)**: wholly invented shapes; the reviewer may want to replace them with the film's actual patterns.

## Review

Reviewer for segment 4. I fixed it by editing the generator, not the JSON. The writer's original is kept as `review/seg4/gen4.writer.py` and its output as `review/seg4/seg4.writer.json`. The revised `gen4.py` regenerates `segments/seg4.json` byte for byte; every change is marked `# REVIEW:` in the script. Result: 1,403 waypoints, `blocking-merge.py --check` 0 errors 0 warnings. Plots of the changed moments: `review/seg4/after/`.

### Sources checked (my own)
- BroadwayWorld forum, "Another Richard Rogers Theatre Hamilton seating question", page 3 (posts of 3/1/16 and 6/13/16, OBC era, the same company the film recorded): Burr gives the opening of Guns and Ships from the stage-left balcony (a second patron in the next seat confirms seeing Burr there at the start of the song); Washington at the end of Non-Stop is on the upper balcony, stage left. https://forum.broadwayworld.com/thread/Another-Richard-Rogers-Theatre-Hamilton-seating-question-1085460/3
- Playbill, "Andy Blankenbuehler on Making History with Hamilton" (via search summary): the two revolves were planned so they can go in opposite directions; Yorktown's ending is the soldiers' first time with guns, set down at once. https://playbill.com/article/andy-blankenbuehler-on-making-history-with-hamilton
- Slate on the 2016 Tonys Yorktown (no muskets). https://www.slate.com/blogs/browbeat/2016/06/12/hamilton_tonys_cast_performs_yorktown_the_world_turned_upside_down_video.html
- Wyzant viewer answer on the Yorktown battle: formations that outmanoeuvre the British; at one point the dancers stop, then seem to move in slow motion. https://www.wyzant.com/resources/answers/820794/thoughts-on-the-battle-of-yorktown-from-hamilton
- Hamilton Simulator fandom wiki (game wiki, weak): a redcoat appears to wave a white flag after the battle. https://hamilton-simulator.fandom.com/wiki/Yorktown_Battlefield
- The repo's own record: Binkley's real preset names (docs/HAMILTON-LIGHTING-STYLE.md section 7) include "King DSC", "AH Burr DR", "GW"; the focus points of cues 562, 655, 659 and 661 in assets/hamilton-show.json, and the rig positions (assets/hamilton-rig.json).
- Jack's per-song checklist (artifact database): no notes on 1-18 to 1-22; 1-23's note is about the intermission cue, not staging.
- Could not reach: fandom wiki pages (bot wall), Dance Magazine (403), the Hamilton shot-by-shot podcast (audio only), the Olmstead book chapter on Yorktown. No written shot-by-shot of these numbers turned up.

### 1-18 Guns and Ships
- **Wrong: Lafayette on the balcony at the top.** The forum puts **Burr** on the stage-left balcony for the opening, which is what Jack's "the balcony is lit at the top" lights. Cue 562's ring of ten Vipers is focused round (0, 2.0) on the deck, with the front key at (0, 2.3). There is no way for a body on the G&S spot at 31.0 to be in that ring by 34.2: the gallery, the stair and the deck take at least about 6.5 s. Changed: Burr enters through G-UC at 0, walks the USG and the SLG at about 1.9 m/s while he starts singing (the album has no lead-in), and is on the G&S spot by 6.3. He leaves the same way from 20.5 and is off at 29.5. Lafayette bursts in through D-UC up centre on the shout (17.0 to 19.0), raps on the deck (24.5, 28.0), and is at (0, 2.1) in the ring of beams by 31.3. He travels with the rap at 42.3 and 45.7, and is at the writer's (0, 1.8) at 48.8. The writer's Burr at DR through the chant (to 100) is removed: Burr is not in the rest of the number.
- The company now faces Burr on the balcony at 7.0, faces Lafayette's entrance at 17.6, and faces Lafayette in the centre at 31.3 (it faced the balcony before).
- Unverified, left as written: Washington's D-UC entrance and centre special, the chant shapes, Hamilton entering DSR for the button.

### 1-19 History Has Its Eyes on You
- No staging account found. The cue research (Washington in a warm key, the company's backing) matches the plot. Left as written.

### 1-20 Yorktown
- **Battle 133.3 to 155 replaced (writer's Q7).** The invented wedge, charges and outward ring are gone. Now: two ranked lines of six with Hamilton and Lafayette leading (133.3); the ranks charge 0.8 m while the commanders peel out to the flanks (135.8); the front rank goes onto the outer ring and the back rank onto the inner disc, and they walk 90 degrees against each other (138.4 to 141.7); on the cold turn they stop, each in his own pool, and drift 0.6 m outward in slow motion (to 145.6); then the lines re-form upstage (148.0) and charge to the lip behind Hamilton and Lafayette (150.5). ens5 still leaves at 146 to become the redcoat. These are the attested kinds of pattern (lines, counter-turning revolves, a freeze and slow motion, pools). The exact counts and positions are still mine.
- Q3, the white-flag redcoat: no source names the actor. The game wiki and the cue ("a cool special upstage centre") support a single redcoat seen high and upstage. Kept ens5 on the USG centre.
- Q4, Mulligan's entrance: no written account found. Kept D-UC (upstage, from the British side, which fits the spy). **Look at the film.**
- The final "world turned upside down" counter-rotation and the step into pools (235.4) match the Blankenbuehler two-revolve note and the LSA pools. Left as written.

### 1-21 What Comes Next?
- Q5: Binkley's real preset "King DSC" confirms where he stands. The entrance cannot be upstage centre in this segment. The King must be at the lip by the 0.6 cue, after a 1.9 s blackout, and D-UC to the lip is 9.4 m: 3.8 m/s, a run. W-DSL is 7 m and is walked in the dark. Kept W-DSL. If the film has him walking down from UC, it would have to start under the Yorktown tableau, before 240.

### 1-22 Dear Theodosia
- Matches the cue research frame (two pools, Burr SL, Hamilton SR). Not independently verified. Left as written.

### 1-23 Non-Stop
- **Q2, Washington: wrong place.** The forum says he ends Non-Stop on the upper balcony, stage left. Nothing supports a raised box on the deck, and the set has none. A numeric `y` would float him. Changed: he enters through D-UC and makes the offer in his deck special by Hamilton at 304.3 ((0.3, 1.9); cue 655 focuses Viper 93 and the front X4 on (0, 1.8) to (0, 2.1)). Hamilton turns to him from (-0.9, 1.2). From 320 he crosses to the SL stair (foot 324.0, top 328.5) and stands on the SL gallery at (4.9, -1.5) from 330.2, turning out at 349.8 when he joins the counterpoint. In the blackout he runs the gallery to G-UC (3.1 to 3.3 m/s, off at 384.45).
  **Lighting conflict for Jack:** cue 659 aims unit 18 at (0, 2.4, -1.2), a head on a stand of about 0.8 m just upstage of centre, and cue 661 puts two shafts "behind him" at (+-1, -1). Those now light empty air. If the forum account is accepted, refocus them onto the SL gallery; if the film frame ("high centre") is right, the set would need a stand. I did not touch the cues.
- Q6, the courtroom: no layout source found. Kept the writer's jury SR. One change from the scene's own logic: Burr is Hamilton's co-counsel, so he goes to the defence table beside Weeks at 32.0 ((0.85, 1.15)) before the first chorus. Laurens, Lafayette, Mulligan and Peggy are kept out of the finale company. The cast album credits "Company" without naming them, and showing the labels "Laurens" (dead by now) or "Lafayette" (gone to France) would mislead. Madison is Act 2 only. Unverified: whether those actors stand in the finale ensemble on the night.
- Left as written: the Convention (Binkley's 633 to 638 labels), Burr's DR scene (preset "AH Burr DR"), the galleries' watchers, the sisters' pools, the ring turning.

### Warnings left standing
None from the merge. The generator's own over-3.0 m/s flags are the blackout runs at the end of 1-23: Hamilton 3.3 to 3.4 m/s, as the writer had it, and now Washington 3.1 to 3.3 m/s along the gallery. Both are in the dark, both are forced by the 384.5 segment end, and both are under the merge's 3.5 limit.

### For a human with the music playing
1. 1-18 0 to 7: Burr walks the gallery to the balcony while he is already singing. Is it acceptable that he arrives about 6 s in?
2. 1-18 17 to 31: Lafayette's entrance, up centre through the company, and the beams on him at 31.3 to 34.2.
3. 1-20 133 to 151: the new battle shapes against the beat (the counter-turn at 138.6 to 141.7, the freeze and drift at 141.7 to 145.6).
4. 1-20 109.9: Mulligan's entrance direction.
5. 1-23 304 to 332: the offer in the deck special, Washington's climb to the SL gallery, and the finale specials (cues 659 and 661) that still point at centre.

## Spotlights

Spotlight pass for segment 4. Every special of every cue in 1-18 to 1-23 was walked against the blocking at three moments in its hold (`spot/seg4/check4.py`, output `out0.txt` before and `out1.txt` after). The named person-specials are checked by `spot/seg4/verify4.py`: 44 were not fully on their actor before, and 11 after. All 11 are entrances or exits at the edge of a cue. Fixes are in `gen4.py` and marked `# SPOT:` (27 places). The patch is `spot/seg4/patch_spot.py`, plus two timing tweaks and the tableau ordering. The pre-pass generator, JSON and notes are kept as `spot/seg4/*.pre-spot.*`. Result: 1,412 waypoints, `blocking-merge.py --check` 0 errors 0 warnings. Plots of the changed moments are in `spot/seg4/`.

### 1-18 Guns and Ships
- Checked: Burr's balcony pin (lustr 181, the G&S spot), cue 562's ring of ten Vipers round Lafayette at (0, 2.1) (kept), Washington's Viper 93 (566-572), and Hamilton's X4 44 at the button.
- Moved **Washington** for his anthem and build (80-109.6): from DC (0, 2.6)-(0, 2.9) to (0, 1.65)/(0, 1.55), inside Viper 93 at (0, 1.54). Cues 568-570 hold the special ("the warm ring under his special"), and he had stood 1.36 m out of it. The company's anthem arcs are re-centred on him (WDC (0, 1.6)).
- Left: Burr reaches the balcony at 6.3 and leaves at 20.5, so lustr 181 lights the empty balcony to 31.3. That is the reviewer's timing, and a pin on an empty gallery is normal.

### 1-19 History Has Its Eyes on You
- Moved **Washington**: every cue (576-583) holds Viper 93 at (0, 1.96), r 0.82. The writer walked him out of it towards Hamilton (to (0.6-1.2, 3.3-3.5)) from 15 to 74.7. He now turns and shifts inside the special: (0.3, 2.3), (0.5, 2.2), (-0.2, 2.25), (-0.45, 2.3), (0, 2.0), (0, 1.9). His facings are kept.

### 1-20 Yorktown
- **Hamilton** at 52 to (0, 4.55) for "alone, facing death". Cue 592's centre unit, Viper 98, runs over the lip (deck point (0, 5.55)) and crosses a body there. At 61.2 he goes to (-1.1, 3.7), into his DS special X4 44, which cue 593 warms. Before, he was at (0.4, 4.5), 1.97 m away.
- **The night attack (595/596)**: the writer's six pools were invented positions, and the bodies then crept 25 degrees round the disc, out of the real pools. Now each deck body stands in one of the cue's Viper pools: Hamilton in Viper 4 (DSC), Laurens in Viper 13 (SL), and ens2-5 and Lafayette in Vipers 15/18/8/10/11 (by nearness). They arrive by 72.0, and the creep is a slow 0.6 m advance inside the pool (80-84). Hamilton narrates at 92 from (0.05, 3.0), the focus of his 597 key (X4 43, see below). **Laurens** stays in Viper 13 through 597-598, the only deck special left up for "the friends' fortunes". Before, he walked to an invented DL spot at (3.0, 3.4).
- **The redcoat (ens5)** at 155 is now on the DECK at (0, -1.6), not on the USG centre. Cue 606's cool UC special is Viper 18, lens (0, 6.21, -2.09) pointing almost straight down onto (0, -1.58), so it cannot light the gallery 1.8 m upstage. He comes back through D-UC (152 to 155) and leaves the same way (169 to 172). The reviewer's evidence (the cue, a game wiki) gives "a redcoat high and upstage". The light is upstage centre on the floor.
- **After a week (606)**: the four inner spots of the writer's twelve are now the cue's four warm soldier pools (Vipers 16, 13, 5, 1). Hamilton is in Viper 8 at (0, 2.01) from 155.5, the same pool cue 607 keeps on him ("one warm pool centre"). Before, he was at (0, 4.0).
- **The final tableau (609.7)**: each body steps into one of the cue's twelve pools. Principals choose first: Hamilton Viper 10, Lafayette 8, Laurens 4, Mulligan 15. The company takes the nearest free pool. The two left over (ens4, ens7) step back out to r 4.0, into the dark. Before, they stood at r 3.4/1.8, mostly between pools.
- Left: the gallery specials at 85.4 are only Vipers 25/26 on the USG (ens1 and ens10 are in them). See the cue list below for the SR arm and SLG soldiers.

### 1-21 What Comes Next?
- The King is in his lip specials (Vipers 4/2/13) in every cue. He reaches them 1.4 s after 610's GO, because he enters in the blackout (the reviewer's timing). No change.

### 1-22 Dear Theodosia
- Moved **Burr and Hamilton**: they stay in their own pools, Viper 10 (2.38, 2.32) and Viper 6 (-2.38, 2.32), for the whole number. Cue 627 says "the pools still separate" and 629 "only the two pools". The writer closed them to (+-1.3, 3.6) for the duet, 1.4 to 1.7 m out of both pools, from 126.5 to 162.5. Their moves are now small shifts and turns towards each other inside the pools.

### 1-23 Non-Stop
- **Hamilton's brag (631.5, 73.8)**: to (-1.05, 3.35), inside his DS special X4 44 (-1.31, 3.53). Before, he was at (0, 4.3), 1.5 m out. ens2 had been standing in it. The hook ring's revolve ends 9 degrees short (99, not 108), so the ring straddles him.
- **Midnight at Burr's (640-643)**: preset 766's narrow unit is Viper 2 at (-1.82, 4.25), with the DR washes round (-3, 3.5). Hamilton is in Viper 2 at (-2.1, 4.05) and (-1.9, 4.1), and Burr is in the wash at (-3.2, 3.6). On 642 ("the two men move in, one warm-white special on them") both step into Viper 93 at (-1.25, 2.79): Hamilton (-0.9, 2.95), Burr (-1.6, 2.6). Before, they were 2.0 and 2.65 m from it.
- **Burr's column (644)**: he is in Viper 13 (0, 1.24) at 189.0, not 191.0.
- **Angelica (646-647)**: to (3.75, -0.85), up left, which is the focus of her warm SL key Viper 14 (3.81, -1.02), preset 732 "Woman SL". She enters by W-MSL. Before, she was at (3.4, 3.0), 4 m away.
- **The Federalist study (649-651)**: Hamilton's desk is at (-1.0, 2.65). From there both his warm-white key, X4 44, and the slanted window, Vipers 16/17 round (-0.95, 1.1), reach him. Before, the desk was at C (0, 1.5), which neither reaches (there is no desk prop). At 304.3 he stands at (-1.3, 1.4), off the edge of Washington's special.
- **The sisters (658-668)**: at 327.1 Eliza is at (-3.4, 3.55) and Angelica at (3.4, 3.65), centred in their narrow 658 pools (Vipers 2/12 and 4/14). At 332.2 they step into cue 659's finale specials: Angelica in Viper 13 (3.31, 1.56), which holds to the end, and Eliza in Viper 11 (-3.21, 1.58). Before, both were 1.75 m out. At 368.7 Eliza moves into the fan's SR beam and the X4 that flies to her at 378.9. Hamilton "below" is at (0.05, 2.3), the focus of X4 43. Because the sisters now stand on the outer ring's line, the company's counterpoint turn (352.4-364.8) runs on the inner disc (r 2.4). They step out to r 2.9 (not 3.5), and the 6 o'clock pair opens to (+-2.8, 3.2), clear of X4 44.
- **Hamilton's name (666-668)**: at (-0.4, 3.5), in X4 44, the overhead white Viper 93 (0, 2.99) and the fan's Viper 9 (0, 4.0) together. Before, he was at (0, 4.4), outside 44 and 93. His blackout exit is now W-DSR, 3.2 m/s. W-DSL would have been 3.5 m/s.
- Kept as ruled: Washington is on the SL gallery (4.9, -1.5) from 330.2, and the Convention (633-638) is unchanged (Hamilton at C in the centre washes).

### Cues that look wrong (for Jack, not edited)
1. **1-23 cue 659, unit 18** (Viper, deck point (0, -0.66), aimed at a head 2.4 m up just upstage of centre) and **cue 661, Vipers 25/26** (shafts at (+-1.02, -0.93)) light empty air. Washington is on the SL gallery at (4.9, -1.5) by ruling. Refocus them there.
2. **X4 43 never reaches the stage.** Its lens is at (-1.5, 6.23, 9.22), and in every cue its beam hits something about 0.8 m from the lens, at about (-1.3, 5.5, 8.41). Its SL twin X4 44 lands fine. It is meant as Washington's front key (568-572, focus (0.06, 1.63)), Hamilton's warm key in 597 (0.06, 2.98), 642's special (-1.19, 2.77), the night study 649 (0.33, 2.28), Hamilton "below" in 659 (0.06, 2.36), and 666. The blocking stands at its focus points anyway. This is a rig or collision problem to look at.
3. **1-20 cue 596**: the label names soldiers on the SR, SL and back galleries, but its only gallery specials are Vipers 25/26 on the USG. ens6 and ens7 on the SR arm and ens8 and ens9 on the SLG have no unit, so they are unlit.
4. **1-20 cues 595/596**: twelve deck pools, seven deck bodies. Vipers 1, 2, 5, 6 (downstage) and 16 (UC) are lit with no one in them, because six of the company are on the galleries.
5. **X4 48/51** (at (+-2.74, 1.65), levels 38 % / 16 %) land on the company line in 1-20 589 and on the ensemble ring in 1-23 646 and 658, never on a principal, and the levels are lopsided. They are NOT preset 402 (the Eos file's "3 pools" is Vipers 2/12, 13 and 4/14; see the second pass below). They look like a stray in the tracked state.
6. **1-23 646-647, Viper 12** at (-3.28, 3.17), warm, full, SR, is lit for 24 s before anyone is there. Eliza enters into it at 231.4, when 648 refocuses it to (-3.05, 2.31) for her. It looks like her key coming up early.
7. **1-23 633-635 (AF)**: the AF X4s do not appear as a special on Hamilton. The centre is lit by the Viper 92/94/97/99 washes, and he is in them at C. Narrow Viper 4 sits at (-0.46, -1.24) in 633-634 and at (0.77, 0.29) in 635, and lands on the delegates' side, not on him. Binkley's real cues, so left as is.

### Left as is
- Edge-of-cue misses, all transitions: Burr's balcony walk-on and walk-off (560/561), the King's blackout entrance (610), Hamilton arriving at Burr's door (640), Angelica arriving (646), Eliza's exit before 648 ends, and Washington leaving his special at 320 for the SL stair while 656 holds to 327.1 (the reviewer's climb).
- 1-20 609.3 (the chant): X4 44/41/45 at 40 % while the company counter-rotates through them and Hamilton is at C. This is a preset look, not a special for anyone.
- Beam fans and rings (562, 563, 571, 602, 609.5, 650-651, 663-668) were treated as looks, not person-specials.

### Warnings
`blocking-merge.py --check`: 0 errors, 0 warnings. The generator's own over-3 m/s flags are only the blackout runs at the end of 1-23 (Washington 3.1-3.3 m/s on the gallery, Hamilton 3.2 m/s), under the merge's 3.5 limit.

### Second pass: narrow washes and the Eos presets
The pool dump labels a unit `wash` when its floor pool is wider than 1 m, even at zoom 14.5-18.5 (a face key, a duet pool), so the first pass did not count those. `spot/seg4/check5.py` lists every unit with zoom 18.5 or less that lands on a floor, with who stands in it. The focus of each named real preset was read from `assets/hamilton-eos.json`. Fixes are in `gen4.py`, marked `# SPOT2:` (patch `spot/seg4/patch_spot2.py`; the pass-1 generator is `spot/seg4/gen4.pass1.py`).
- **1-20 cue 589 (preset 402 "3 pools")**: the Eos preset is Vipers 2/12 SR (-3.1, 3.65), Viper 13 centre (-0.04, 1.78) and Vipers 4/14 SL (3.2, 3.8), zoom 14.5-16.7, all at 75 %. Hamilton and Lafayette had stood at (+-0.7, 3.7), in none of them. The farewell is now in the centre pool: Hamilton (-0.45, 1.9), Lafayette (0.4, 1.9), facing each other. The line falls back to z 0.2 by 22.4 (it was 26.0) to clear the pool. The two side pools stay empty (a cue question: the same three pools serve the sisters and Hamilton in 658).
- **1-23 cue 631.01 / 631.1 (preset 615 "Desk")**: eight narrow X4s (55-64, zoom 14.9, full) in a row at z -0.2 to -0.8 across the stage. The writer's jury sat SR at z -0.2 and 1.0 and caught only the edges. Now the jury sits along the desk, three each side of the judge, each in a desk pool: ens7 (-3.4, -0.6), ens6 (-2.2, -0.65), ens1 (-1.55, -0.65), ens8 (1.55, -0.65), ens9 (2.2, -0.65), ens10 (3.82, -0.3). ens8, ens9 and ens10 now enter SL. The judge (ens2) is at (0, -0.67) in the centre pair, and the SL onlookers have moved to (3.1, 0.9) and (3.6, 1.8), out of the row. (-3.85, -0.2) has a 0.23 m prop on the floor, so ens7 sits just onstage of it.
- **1-23 cue 646 (preset 732 "Woman SL")**: in the Eos file this preset is Viper 13 focused at (3.38, 0.22), zoom 16.7. The reconstructed cue lights Viper 14 at (3.81, -1.02) instead, and Viper 13 is elsewhere. Angelica is moved to (3.6, -0.4), inside the lit Viper 14 and 0.65 m from the preset's own focus, so she is right whichever is fixed. **Cue question:** 646 does not use 732's real focus.
- **1-23 cue 658 (presets 402 and 732)**: the sisters are in 402's SR and SL pools (from pass 1). Burr at (2.6, 4.6) and the company ring's 126/234 slots at r 3.2 stood in the edges of those pools. Burr is now at (1.8, 4.7) from 306.5, and the company moves in to r 2.4 at 312.5 instead of 351.8.
- Checked, no change: preset 766 "AH Burr DR" is Vipers 8/92/94, all wide (zoom 25-35), round (-3.2, 3.25) and (-2.3, 4.1), and both men are inside it. 151/259 "Ham DSC" are X4 43 (0.27, 2.53) and 44 (-1.2, 3.74), consistent with pass 1. 222 "King DSC" puts the King at the lip, as blocked. 968 "king SR" is Lafayette's DR pool in 1-20, as blocked. Viper 93 (zoom 16) in 642/643 has both men in it. Also in this range: the 1-19 and 1-20 X4 rows (47-64) are company looks, not person lights. Viper 18 at (-1.62, -1.31) in 592-604 is a shaft on the upstage company.
- Result: 1,391 waypoints, `blocking-merge.py --check` 0 errors 0 warnings. `verify4.py` still shows only the same 11 edge-of-cue transitions.

## Review 2 (Jack's verdict)

Jack watched the show: "the ensemble members are being used too much. a lot of the choreo is wrong." This pass cuts the
company back to what evidence puts on stage, removes every formation the earlier passes marked invented, and adds the
furniture. Every change is in `gen4.py`, marked `# REVIEW2:`; the props are in `props.py`, section SEGMENT 4. The
pre-pass generator, JSON, props and notes are kept in the scratchpad at `review2/seg4/before/`. Result: 769 waypoints
(was 1,391); `blocking-merge.py --check` on seg4.json + props.json: 0 errors, 0 warnings; `props.py --check`: every
segment-4 carry is OK. Plots: `review2/seg4/plots/`.

Ensemble on stage, measured (ensemble-seconds, sampled every 0.5 s; for 1-18/1-19 Laurens and Mulligan counted as
soldiers): 1-18 1,493 -> 835 (peak 12 -> 8); 1-19 1,164 -> 12 (only the walk-on into the Yorktown line in the last 3 s);
1-20 2,408 -> 2,346 but moving 795 -> 466 (the company is kept, the invented traffic is cut); 1-23 3,020 -> 1,507
(moving 788 -> 153).

### The new evidence: ETC's renders of Binkley's real Non-Stop cues
`THPP - Cue Photos.pdf` pages 45-52 are ETC's Augment3d renders of Binkley's REAL cues 631.01, 632, 633, 633.01, 634,
635, 636 and 638 (rendered to `review2/seg4/pdf/`; no page covers 560-630 or 640-670). Caveat as segment 5 found:
the stock figures on the side galleries and the SR stair are in every render, so only the deck figures count.
- **631.01 "Non Stop"** (the courtroom): a table up centre in the row of narrow X4 pools (z about -0.6), one lit figure
  at it and one either side, and **six chairs** in two rows of three in the diamond of Viper pools in front. The chairs'
  **seats face upstage**, to the table (the blue seat shows behind each back panel). Matching the pools dump: the flank
  figures stand in X4 59 (-1.73, -0.67) and X4 64 (1.68, -0.81); the chairs are in Vipers 12 (-2.12, 1.87), 13 (0.70,
  1.81), 15 (3.50, 1.71) and 6 (-3.50, 3.60), 8 (-0.59, 3.65), 9 (2.31, 3.55). The spotlight pass's reading of this
  row ("preset 615 Desk", the jury along it) was wrong: the row is the table's.
- **632 "Constitutional"**: the same table and chairs under the ring.
- **633 / 633.01 / 634**: no table or chairs; Hamilton in the white centre special, four men round him (634: about six,
  close).
- **635 "Men on Ring"**: Hamilton and four men across the centre. **636**: about seven men spread round a centre pool.
- **638 "Burr/Men"**: one figure downstage (Burr), four men loose upstage.

### Web sources tried this pass
Searches for staging accounts of Guns and Ships, History Has Its Eyes On You, Yorktown and Non-Stop (fan write-ups,
tumblr, reviews) found plot summaries and general praise only, e.g. the Bucknell chapter on the Non-Stop ensemble
(https://digitalcommons.bucknell.edu/fac_books/224, abstract only: the ensemble drives transitions) and a Cincinnati
review (https://www.citybeat.com/arts/the-hamilton-cincinnati-staging-is-on-par-with-broadways-original-12213440/:
the company "constantly in motion", general). Neither places bodies. Where nothing better was found the simplest
staging was chosen, as the brief says.

### 1-18 Guns and Ships - company 12 -> 8
- Kept (ruled): Burr on the SL balcony for the opening; Lafayette bursting in up centre and in cue 562's ring of beams by
  31.3; Washington's centre special; Hamilton in from DSR for the button.
- Company: eight soldiers (ens1-8). Laurens and Mulligan are out (their labels would read as the characters; Mulligan's
  entrance belongs to Yorktown). Evidence for a company at all: the Disney+ frame behind cue 562 (research 1-18) has "the
  company in warm amber side light" round Lafayette. They walk on WITH his entrance (from about 19 s, cue 561 "the
  build") into two loose groups either side of the centre ((+-2.3 .. 3.7, -1.1 .. 1.3)), and from then on only turn: to
  Lafayette (31.3), to Washington (59.2), a step in for the chant (69.6), to Washington for his anthem (80), out front
  for the build (104.4). They go off in the button (120), which cue 572 leaves to Washington and Hamilton.
- Cut (invented): the march-on during Burr's intro (0-7.5), the outer-ring walk "the fan opens" (42.3; cue 563's fan
  is the BEAMS), the upstage arc (59.2), the chant blocks (69.6/75), the arcs round Washington (80/93.7), the V and its
  step (104.4/109.6), and the upstage watchers' line held through History.

### 1-19 History Has Its Eyes On You - company 12 -> 0
- Washington and Hamilton only, as the spotlight pass placed them. The company is heard, not seen: nothing places bodies
  (the cue labels "ensemble's backing" / "with the full company" describe the vocals), so by the brief's rule they are
  off. Cut: the four invented arcs (27, 39.5, 56, 77) and the upstage line.
- The transition (cue 584, 94.5, "the cold column ... troops in line"): ten walk on from the nearest wings and the deck
  door into the Yorktown line (z -1.4) by 1-20 2.5. ens10 brings the Yorktown box on from W-DSL at the lip (94.5, in the
  dark of 583/584) and takes the SL end of the line.

### 1-20 Yorktown - company kept (10 + Laurens, Lafayette, Mulligan), traffic cut
Yorktown genuinely uses the company; kept what the evidence shows (the line, the night pools, the redcoat, the final
tableau) and cut the rest.
- Kept: Hamilton on the box near the lip (Joan Marcus photo); the Yorktown line advancing, falling back and surging; the
  farewell in preset 402's centre pool; Hamilton alone at the lip, then his DS special; the redcoat (ens5) in the cool
  UC special on the deck; Washington through D-UC for the terms; Mulligan's entrance from D-UC.
- The night attack (cue 595; Disney+ frame: each soldier in his own small pool, black between): all twelve pools are
  now filled - Hamilton (Viper 4), Laurens (Viper 13), Lafayette in the DSR pool (-3.18, 3.37) (next to his DR pool of
  100.1, so no cross), and nine soldiers - instead of seven bodies and five empty lit pools. The creep is a 0.4 m
  advance inside the pool.
- Cut: the line-into-a-walking-ring at 43.6 (invented from cue 591's turning GOBOS); the march block (69.5); **the six
  gallery climbs** to the SR arm, the SL gallery and the USG and their descents (cue 596 is a reconstruction, only two
  USG units are lit, and these were the busiest invented traffic in the number); the counter-walked rings in the battle
  (138.4-141.7) and the outward drift; the line reshuffle at 148 (each rank now just steps straight back 3.1 m); the arc
  at "it is over" (170.5); the full-stage celebration spread (189.6); **the counter-rotating rings of The World Turned
  Upside Down** (204.2-230.6; cues 609.2/609.3's "spin" is the Construction gobos turning).
- Now: the battle is two ranks that charge (135.8), freeze on the cold turn (141.7) and move on in slow motion to 145.6
  (Wyzant viewer account: the dancers stop, then seem to move in slow motion,
  https://www.wyzant.com/resources/answers/820794/thoughts-on-the-battle-of-yorktown-from-hamilton), step back and
  charge to the lip (150.5). After the battle the soldiers hold in the dark where they stand. In The World Turned Upside
  Down each walks slowly (204.2 -> 217.1, a stagger, not a march) to his own pool of the final tableau and holds it
  (LSA: "the company on the turntable ... each isolated in his own pool"). Thirteen bodies, eleven free pools: two hold
  in the dark at r 4.0.
- Furniture: **the Yorktown box** (0, 4.7): on with ens10 in the 1-19 transition, Hamilton stands on it 0-22 and
  43.6-61; ens10 comes in from DL on the march (66.7) and takes it off by 70-75.

### 1-21 What Comes Next? - no company
Unchanged: the King alone in his lip special (preset 222 "King DSC"). No furniture.

### 1-22 Dear Theodosia - no company
- Unchanged blocking: Burr in his SL pool (Viper 10), Hamilton in his SR pool (Viper 6).
- Furniture: the Disney+ frame behind cue 618 has Burr SEATED SL and Hamilton SR, so **each brings his own chair** on in
  the change (from W-MSL / W-MSR, set 0.7 m behind his first place: (2.93, 1.37) and (-2.93, 1.37)). In the fade
  (176.9) each picks his chair up and sets it as a jury chair of Non-Stop (back row, (3.50, 1.71) and (-2.12, 1.87), seat
  upstage), then goes to the defence table. Unverified: whether they are chairs or stools.

### 1-23 Non-Stop - company 10 everywhere -> jury 6, delegates 4, finale 7
- **The courtroom (0.7-78.5), from real cue 631.01** (above): Levi Weeks (ens4) behind the table at (0, -1.25); Hamilton
  and Burr in the two flank pools; the jury of six (ens1, ens6-10) standing at their chairs facing the table (the
  mannequins stand; each chair is 0.7 m behind its sitter, per props.py). Hamilton addresses them from just in front of
  the table (21.6-38); Burr steps in to sit him down (32). The jury turns out to the house for the first chorus (41.5)
  and to Hamilton for his brag (74.5, his DS special X4 44). At the end of the trial each juror takes her chair off and
  Weeks the table (78.5, cues 631.6/631.7: the restore and the move in the dark). Cut (invented): the judge, the two SL
  onlookers, the company arc at the first chorus, the hook's outer ring and its 99-degree revolve.
- **The Convention (85.2-125.3)**: four delegates (ens2, ens3, ens5, and ens4 back in without the table), as the real
  renders of 633/633.01/635/638 show four men round Hamilton. Hamilton to centre on 633 (Move to center); the four on the
  outer ring walking 45 degrees on 635 (Binkley's own label "Men on Ring"); in to r 2.2 on 636; loose behind Burr DS on
  638 (the render: one far SR, two up centre, one SL). Cut: the six-man arc and the wedge.
- **Burr's reprise (187.9-207)**: no watchers on the galleries (cue 645 is a reconstruction; the ten climbs to three
  galleries were invented). Burr alone in his column, as the spotlight pass placed him.
- **The Federalist papers**: ens8 brings Hamilton's desk on from SR as the sisters go (246-251) and sets it at
  (-1.0, 2.1); Hamilton writes DS of it in his DS key. ens8 strikes it from DR as the music drops for Washington (304.3).
- **The company chorus and the finale (281.7-382)**: seven (ens1-7) walk on into a loose arc upstage (r 2.9, -80 ..
  +80 degrees, clear of the sisters' specials and Washington's path to the SL stair) and hold it; they turn out for the
  counterpoint (352.4) and take one step in on the final Shot (368.7). The finale genuinely has the company; the
  evidence does not say how they move, so they stand. Cut: the watchers coming down three stairs, the outer-ring walk
  (286-300.7), the inner-disc revolve (352.4-364.8) and the 6 o'clock gap.
- Kept as ruled or placed: Washington's offer in his deck special and the climb to the SL gallery (ruling); midnight at
  Burr's DR (preset 766); Angelica's and Eliza's keys; the sisters' finale specials; Hamilton's name DC.

### Furniture added (props.py, SEGMENT 4)
| prop | on (who, when) | off (who, when) |
|---|---|---|
| yorktown-box (0, 4.7) | ens10 from W-DSL, 1-19 90 -> 94.5 | ens10 to W-DSL, 1-20 70 -> 75 |
| theo-chair-burr (2.93, 1.37) | Burr from W-MSL, 1-21 90 -> 1-22 4.5 | Burr moves it to jury b3 (1-22 177-179.5); ens7 takes it off W-MSL, 1-23 78.5 |
| theo-chair-hamilton (-2.93, 1.37) | Hamilton from W-MSR, same | Hamilton moves it to jury b1; ens1 off W-MSR, 1-23 78.5 |
| jury-chair-b2 / f1 / f2 / f3 | ens6 (W-USL) / ens8 (W-DSR) / ens9 (W-DSL) / ens10 (W-DSL), 1-22 176.9 -> 183.5, in the dark | the same juror, the same wing, 1-23 78.5 |
| court-table (0, -0.6), 1.4 x 0.7 | ens4 (Weeks) through D-UC, 1-22 176.9 -> 182.5 | ens4 through D-UC, 1-23 78.5 |
| hamilton-desk (-1.0, 2.1) | ens8 from W-MSR, 1-23 245.8 -> 251 | ens8 to W-DSR, 1-23 305.5 -> 310 (was: hidden in the Act One blackout) |
No lamp or lantern: nothing in these numbers shows one.

### Lighting conflicts this pass creates (for Jack, cues not edited)
1. **1-23 cue 631.1** (a reconstruction) puts Hamilton in his DS special X4 44 to address the jury. With the jury seated
   facing the table, as the real 631.01 shows, he addresses them from the table, inside the real X4 row; X4 44 at 21.6
   lights nobody. If the jury should face the house, turn the chairs (props.py) and move him back to (-1.05, 3.4).
2. **1-20 cue 596** (a reconstruction): Vipers 25/26 on the USG now light nobody; the gallery soldiers are cut.
3. Unchanged from the spotlight pass: cue 659/661's "Washington high centre" units light empty air (Washington is on
   the SL gallery by ruling); X4 43 never reaches the stage.

### Could not verify; simplest staging chosen
- Guns and Ships: how many soldiers and what they dance. Chose eight, standing in two groups, turning.
- The courtroom: who the lit figure at the table is (chose Weeks behind it), and whether the jury really faces upstage
  in performance (the render's chairs do).
- Yorktown: Mulligan's entrance direction (kept D-UC), the battle's real patterns (kept ranks, freeze, slow motion).
- Non-Stop finale: how the company moves (chose a still arc and one step).
- Whether Laurens, Lafayette or Mulligan stand in the Non-Stop finale company (kept out, as review 1).

### For Jack to watch first
1. 1-23 0-80: the courtroom - table, six chairs with their backs to the house, Hamilton and Burr at the table.
2. 1-20 66-90: the night attack with every pool filled, and the box going off with ens10.
3. 1-18 17-35: the eight soldiers coming on with Lafayette.
4. 1-20 198-240: the slow walk into the tableau pools in place of the counter-rotating rings.
5. 1-22 176-184 into 1-23 0.7: the fathers' chairs becoming jury chairs in the dark.


## Review 3 (video evidence)

Third pass, from what video text could be read: titles, descriptions, auto-captions (read through the YouTube player
API's ANDROID client, whose caption URLs are not token-gated; the WEB ones and the transcript endpoint are), comments
(the `next` endpoint, up to 25 pages each), and the captions of reaction and "details" videos, whose hosts describe
what they see. Every change is in `gen4.py` marked `REVIEW 3`; props in `props.py` SEGMENT 4; moves in `dance.py`
SEGMENT 4. The pre-pass generator and JSON are kept at `scratchpad/act/review3/seg4/before/`; the plots are in
`scratchpad/act/review3/seg4/` (moments and the 1-18 / 1-20 / 1-23 sheets). Result: 903 waypoints (was 769); the merge
`--check` on seg4.json + props.json + dance.json: 0 errors, 0 warnings; `props.py --check`: every segment-4 carry OK;
the generator's own flags are only the pre-existing blackout runs at the end of 1-23. Scripts used:
`scratchpad/ytcap.sh`, `ytcap.py` (captions), `ytcom.py` (comments), `ytsearch.py` (search).

Clip time vs album time: Guns and Ships clip = album + ~1.9 s (Washington's call, clip 1:21.9 = cue 568 at 80.0);
History clip = album + ~4 s; the official "from HAMILTON" uploads are the album itself (their captions give album time).

### Videos used (27 read, 14 of them useful)
| video | text read | what it settled |
|---|---|---|
| WSJ, "'Hamilton' Choreographer Breaks Down His Moves", gb67f2HLVGM | captions, in full | the Yorktown phrase order (memory, pride, enemy, end, friend into rifle, command, heartbeat, march); "his group of marching troops ... freeze", "I'm in marching formation behind him"; **"Eliza is right over our head on the balcony, we turn home"**; the march "takes us into formation" |
| Guns and Ships, Disney+ clip (Jack's playlist), 0D3zz6byFT4 | captions + 499 comments | **Lafayette raps on a table and jumps off mid-rap** (0:38-0:39, many comments); **"everyone upstairs is dancing except for Burr"**, "the guy that comes up to him is the one who played Lee" (1:04); **"Peggy and Angelica jamming on the rafter"**, "1:16 Angelica's feeling it"; **the letter chain** "on the top raft" (1:22-1:33: Laurens to Lee 1:30, Burr hesitates 1:31, a spare letter with Peggy, to Hamilton); "Washington could've just turned around and given Hamilton the letter himself"; **Eliza gives him his coat**, he looks at "Eliza and the baby" (1:50); Lafayette "sprints with the letter ... held above his head"; the company dancing during the rap ("0:34", Seabury "at the back" 0:46) |
| CinemaBlend, "Hamilton: 20 Background Details", OAMOh17f7FU | captions | Burr "glaring angrily from above" while Lafayette talks to Washington; **Laurens shakes hands with the Bullet** in Yorktown; Burr brings Hamilton's green jacket at the top of Non-Stop |
| MsMojo, "Top 10 Hidden Details" 2q1PTOSbdhM and "Top 20" YyqT13_N_aw | captions | the Bullet shakes Laurens' hand in Yorktown (second and third source) |
| G.O.T Games, "NON Musical Fan REACTS ... Yorktown & History", Kodkbh1MbEY | captions | **"they're holding the furniture upside down"** said over the company's first full title phrase (album ~204-212); History: "the passing of the sword" |
| History Has Its Eyes on You, Disney+ clip, ws_pklV1cP8 | captions + comments | Washington gives Hamilton a **sword** (three comments); "when Hamilton salutes" looking into Washington's eyes; "1:08 Washington sharing a touching moment with Alexander" (album ~64) |
| What Comes Next?, Disney+ clip, ERYukmba5Vg | comments | the King "walks in looking absolutely bewildered" while "the other actors are walking off stage"; he walks away at the end |
| Dear Theodosia, Disney+ clip, GgxPJRN_LVI | captions + comments | they sit ("sitting as if having an earnest conversation with the audience"); **Eliza walks in at the end** holding the letter (2:31, the last tag) |
| Musical Theatre Coach reacts to Non-Stop (Disney+), N0LaZYfm_XU | captions | **Eliza's plea: "the stage brings them together"** - she comes into view on the turntable while Hamilton still looks at Angelica; the staging moves from street to courtroom to Burr's house |
| Mortius & Casper Fox, Non-Stop reaction, Jk8_nyTSo8k | captions | "genius way of using the circular stage" over Eliza's lines |
| "Yorktown ... from HAMILTON" (official album upload), 41qJIfzaqlM | captions + comments | album timing: the reprise's first phrase line at ~36.2 (bar 15 = 36.67), the narration 159-196; "0:56 imagine death" |
| Musical Theatre Coach reacts to Yorktown, QIR3lu_1rb8 | captions | general (the battle relies on lighting); no staging |
| 2016 Tonys, Fb4GlOabb1M | comments | "all of them frozen, pointing the invisible guns" (no muskets that night) |
| Dance Magazine, "10 Minutes With Andy Blankenbuehler" (page fetched directly) | text | "The American soldiers will never have guns in the Battle of Yorktown - it's a pantomime. And there's one whole battle sequence where you only see the Americans. Then another with only the British." |

Read, nothing usable: Mortius G&S reaction thpZYOit_yU (audio reaction), BrosReact owEq_xQPkKQ, SalvoG npJkpD2jC94, Howard Ho
ro8uhPr2PSM (music only), Flicks and the City 782gnhUox64, the Non-Stop / Yorktown "Part N" re-uploads and Ripley's Realm
(comments are lyrics), the Tony "History/Yorktown" 5upLudfimso. The rest of Jack's playlist (36 clips) was listed; it has
no Yorktown or Non-Stop clip. Reddit's API is blocked here; the AllMusicals Yorktown annotations (via WebFetch) say the
furniture is "turned over ... then righted, matching the lyric" (weak, one annotator). Jack's notes add Mulligan on the
balcony in Non-Stop (the Philip tour's Madison/Mulligan, Fergie L. Philippe, confirmed with a producer's smile).

### 1-18 Guns and Ships (7 videos) - staging changes
- **Burr stays upstairs** the whole number (was: off at 20.5): balcony (ruled), then the SL gallery glaring down
  (51.8), then his place in the letter chain on the USG (70.8); out through G-UC in the button.
- **Lafayette's table**: ens6 carries a small table on from SL in the build (28.5, `gs-table`), Lafayette raps standing
  in it in the ring of beams (31.3) and jumps down at 36.4-37.0 (the `jump` move), ens6 strikes it at 46.
- **Lafayette runs Washington's letter** on the chant (70.0-72.3) to the foot of the SL stair, where Laurens takes it up.
- **The upstairs company and the letter chain** (USG, SL to centre): Laurens (4.6), Lee = ens3 (3.6, he climbs from the
  deck and "comes up to" Burr on the SL gallery at ~58-62), Burr (2.8), Peggy (2.0), Hamilton (1.2), with Eliza (0.3) and
  Angelica (-1.0). The passes at 87.2-91.6; Eliza gives him his coat (95); the look at her (108); Hamilton goes down the SR
  strip and stair (109-118) into his DS special for the button (120.5). The sisters come on at 56.
- New bodies: Angelica, Peggy, Eliza, Laurens upstairs; Hamilton enters upstairs (was: from DSR at 112). Deck company
  7 (ens3 goes up).
- Moves: `two-step` for the deck company in the rap (bar 18 b3 -> 48.8) and on the chant (bar 40 b3 -> 80); `bounce`
  for Angelica, Peggy and ens3 upstairs (bar 34 b3 -> 80; Burr does not dance); `jump` for Lafayette (bar 21 b3).
  The 1-18 grid's downbeats fall about two beats off the cue hits, so these are named by bar and beat.

### 1-19 History Has Its Eyes on You (3 videos)
- Hamilton steps up beside Washington at the edge of his special at the verse-2 build (64.5), back DS at 74.7.
- Move: `salute` for Hamilton from bar 28 b2 (86.9) to the end; the comment does not time it (placement mine).
- Not done: **the sword** Washington gives him (three comments). There is no prop kind for it ('custom' would be a 0.5 m
  box); timing unknown. For Jack: a sword prop handed over near the end would match the film.

### 1-20 Yorktown (6 videos + Dance Magazine)
- **Bars, checked against the album and the WSJ order** (98 BPM, bar 21 = 51.36): the reprise phrase at bar 15 is right;
  `imagine-death` now bar 21, 10 counts at speed 0.8 (it reaches the arms-crossed end on bar 23); `command` bar 23 b3,
  6 counts at speed 2/3 (rifle overhead on the friend, epaulets on bar 24); `heartbeat` bar 25 x 8; `hiphop-march` bar 27
  x 8 (was 16: the night attack is bar 29). These four are the company's (not Hamilton's: he sings it alone at the lip).
- The company falls back into its formation by 51.0 (was 56.0), so it stands still for the phrase instead of walking.
- **Eliza on the balcony** (USG centre, 58.2-66.8) for the heartbeat; the company turns upstage to her at 61.2 ("we turn
  home") and back out at 65.6.
- **The Bullet (ens1) shakes Laurens' hand** in his pool (94.6-96.8) and goes back to her pool.
- The battle: `musket` from the drill to the cold turn, `freeze` on bar 58 (141.99) to 146, `musket` again at 146.
- **The furniture**: five soldiers on the dark outer ring (ens4, ens8, ens10 with chairs, ens9 and ens6 with crates) go
  off with the escort (182) and come back carrying their piece (188.5 -> 197). `upside-down` for every soldier but
  Hamilton on bar 83 b3 (204.44, the full-band hit) held to 217.1, then the same move reversed on bar 89 (217.91), the
  furniture righted; set down beside their tableau pools at 230.8; carried off in the blackout. Those without furniture
  lift empty arms.
- The blackout exits are a walk (1.3 m/s, was 1.7): the King arrives while they are still going (1-21 comments).
- Kept: Mulligan's D-UC entrance and the redcoat (no new evidence); "one battle sequence with only the Americans, another
  with only the British" (Dance Magazine) is NOT staged - the company does not split; for Jack.

### 1-21 What Comes Next? (1 video)
- The King looks round after the departing soldiers (2.0 up left, 4.0 up right) before facing out at 6.0.

### 1-22 Dear Theodosia (1 video)
- **Eliza walks in** in the last tag (from W-USR, at (-1.0, 1.4) by 168, Hamilton turns to her at 170.5) and leaves the
  way she came in the fade (176.9), clear of the chair moves.

### 1-23 Non-Stop (3 videos + Jack's notes)
- **Eliza's plea rides the turntable**: on the outer ring up right at 228, carried round into her SR key by 231.4 (cue
  648), and on round to beside Hamilton in his DS special by 240; Hamilton keeps looking SL to Angelica until 242, when
  they turn to each other.
- **Mulligan on the balcony** (USG at (-2.4, -3.35)) from the company chorus (279) to the end; out through G-UC ahead of
  Washington in the blackout.
- Move: `my-shot` for Hamilton on his last Shot line (cue 665, 368.45), the whole phrase in one bar (speed 2). No source
  describes the company's dancing in Non-Stop, so none is added; the "legacy" phrase is Act 2's (2-22/2-23), not here.
- Not done: Burr bringing Hamilton's green jacket at the top (CinemaBlend) - no coat prop.

### Moves wanted that the library lacks
- **handshake** (1-20, the Bullet and Laurens): facing a partner 0.6 m away, the right forearm forward to waist height,
  the hand closed; two small pumps from the elbow on counts 1 and 2, held on 3-4. 4 counts, once then held; mirror for
  a left-handed partner. Used now: none (they only face each other).
- **coat-on** (1-18, Eliza helps him into his coat; 1-23 Burr with the green jacket): the arms back and down behind the
  body, a shrug of both shoulders on 3, the hands smooth the lapels on 4. 4 counts, once.
- **sword-take** (1-19): both hands forward at chest height, palms up, then the right hand closes and lifts to the
  shoulder. 4 counts, once (pairs with a sword prop).
- The baseball pitch (WSJ) is still folded into `command` (FUTURE.md has it).

### Lighting notes for Jack (cues not edited)
1. 1-18: the gallery specials ch181-188 light the upstairs bodies well; Lafayette in the table at 31.3 is in the cue's
   ring of washes (no narrow special), as before.
2. 1-20 61-66: nothing lights Eliza on the USG (cue 593 is Hamilton's DS special only).
3. 1-18 120: Hamilton arrives in his DS special 0.5 s after the button cue (he comes down from the gallery).

### For Jack to watch first
1. 1-18 80-121: the letter chain on the gallery, the coat, the look at Eliza, Hamilton down the SR stair.
2. 1-18 22-52: the table on, Lafayette on it and the jump at 36.5, the table off.
3. 1-20 51-67: the frozen phrase in formation, Eliza over their heads, the turn home, the march into the pools.
4. 1-20 182-241: the furniture fetched, lifted upside down at 204.4, righted at 217.9, set down, carried off.
5. 1-23 222-249: Eliza carried in on the ring to Hamilton.
