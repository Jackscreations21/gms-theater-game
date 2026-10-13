# Segment 1 research notes (1-01 to 1-06)

Output: `scratchpad/act/segments/seg1.json`, with 1294 waypoints, 19 actors (King George is not used) and 0 merge errors or warnings.
Generator: `scratchpad/seg1work/` (`lib.py` has the helpers and a checker that mimics the page's motion rules; `t101.py`…`t106.py` hold one number each; `export.py` writes the file). To change the blocking, edit a `t1xx.py` and run `python export.py`. Don't hand-edit the JSON, because the generator assigns slots so that paths don't cross.

## How well this is sourced: read this first

The web search turned up almost nothing usable on blocking for these six numbers. Several pages returned 403: the Backstage, Broadway Direct and Cincinnati Magazine Blankenbuehler interviews. Wikipedia and the review pages describe the songs but not the staging. The Playbill photo galleries caption performers but not scenes. So the sources fall into three tiers:

1. **The cue file's own labels** (Binkley's real cues and the reconstructed ones). These are the timing and place anchors: Burr Enters 2.0; Laurens SL; Jefferson SR; Hamilton revealed centre at 79.0; Eliza SL; Washington UC; the voyage; the women on the gallery; the roll-call pools; Burr's confession; the line-up; Seabury centre-left on his box; Hamilton on the podium; Hamilton DSC; the herald UC. All of them are honoured.
2. **A few documented facts**:
   - Blankenbuehler says the opening's first step has the ensemble "warp in slow motion". I used this at Q42.
   - The opening deliberately does NOT use the turntable. It sets up the clockwise/counter-clockwise rule through passing images. My hurricane swirl is walked, not revolved, but a reviewer may want it smaller.
   - The ensemble dances a unison "My Shot" phrase.
   - Seabury mounts a box early in Act 1, and Hamilton gets onto it.
3. **Memory of the Disney+ film, plus invention.** Most formations are this tier. Every line below marked *(invented)* is a plausible staging, not the real one.

### Sources consulted
- https://www.backstage.com/magazine/article/inside-choreographic-storytelling-hamilton-6542/ (403; search-snippet quotes on the slow-motion warp, the turntable rule and the "blurry surround")
- https://dancespirit.com/hamilfilms-almost-here-these-are-the-dance-moments-weve-been-thinking-about-non-stop/ (the My Shot movement theme; the bullet; Satisfied's rewind)
- https://dancemagazine.com/hamilton-movie/ (same piece)
- https://broadwaydirect.com/hamiltons-andy-blankenbuehler-on-his-tony-award-winning-choreography/ (403; snippet: the opening sets the show's rules, no turntable in the opening)
- https://en.wikipedia.org/wiki/Alexander_Hamilton_(song) (Burr narrates; the other characters enter to state their relation to him; modelled on the Sweeney Todd prologue)
- https://en.wikipedia.org/wiki/The_Farmer_Refuted and https://amex.substack.com/p/hamilton-the-musical (Seabury on a box)
- https://playbill.com/article/raise-a-glass-to-alexander-hamilton-on-his-birthday (Joan Marcus OBC stills: "Soo, Goldsberry and Jones" in the sisters' photo. That is the basis for Eliza SR, Angelica centre, Peggy SL, but the photo's left-to-right order was not seen directly.)
- https://itshamiltime.com/2015/01/25/second-impressions-hamilton-at-the-public/ (general only)

## Conventions I used
- **Ensemble bodies**: ens1, 6, 7, 8 and 9 are treated as the women (the OBC ensemble was five women and five men; ens1 is the Bullet). ens2, 3, 4, 5 and 10 are the men. This only matters for the mother (ens6) and the tavern (mostly men).
- **Act 1 labels in the opening**: Daveed Diggs and Okieriete Onaodowan sing the opening's Jefferson and Madison verses. So `lafayette` shows **Jefferson** from his entrance (34.0) to Q42, and `mulligan` shows **Madison** from his entrance (46.2) to Q42. Both then revert to Lafayette and Mulligan. The cast file allows both labels. **Coordinator: if you rule that Act 1 must never show the Act 2 names, delete those two `label`s and the reverting ones.**
- Exits at a blackout run across the track boundary (for example from 1-01's blackout into 1-02's first 2 s, while that number's street is navy). This is continuous show time within my segment. Every actor starts my segment `off` at 1-01 0.0 with a label, and ends `off` in 1-06 by 110.4.

## Per track

### 1-01 Alexander Hamilton: partly sourced (the cue places are sourced; the shapes are mostly invented)
- **Q36 2.0 Burr Enters**: from W-DSR to (−1.6, 3.6), then a step in to (−0.6, 3.9) for his verse. *Side SR as in the demo. In the film Leslie Odom Jr. walks out from the wings at the audience's left; this is memory and should be confirmed.*
- **Q37 15.8**: the company walks on from five wings into ten "pools" upstage of z 1.4, facing front. *(invented)*
- **Q38 18.6**: Laurens enters from W-MSL to (2.8, 2.7), on the cue's SL pin. **Q39 33.5**: Lafayette, labelled Jefferson, enters from W-MSR to (−2.6, 2.6), on the cue's SR pin.
- **Q40 48.4, the hurricane**: Madison (`mulligan`) stands at (0.9, 2.6) on the inner disc. The ten ensemble members walk a clockwise quarter-circle on the outer ring (r 3.2, 48.4 to 55.9) and stop facing in. *(invented. Blankenbuehler also had the opening avoid the turntable, so a reviewer may prefer a smaller storm image.)*
- **Q42 63.4**: a slow-motion move (5 s for about 2 m) into an upstage arc (r 3.2, θ −81…81). Burr narrates DSC. *(sourced idea, invented shape)*
- **Q43 71.2**: two diagonal lines open a V corridor from UC down to the centre. **Q44 79.0 Hamilton revealed**: he enters by D-UC at 74.4, walks up the corridor, and arrives in the centre shaft C at 79.0. The company turns to him. *The cue makes him centre at 79.0; whether he walks on or is already there (in the film he steps out of the company) is for review. I recall him entering upstage through the company.*
- **Q45 85.9**: the company closes in to r 2.0 round him. **Q46 89.5**: they spring out to r 3.0 and face front. *(invented)*
- **Q47 93.2**: Eliza enters from W-DSL and stands SL at (3.4, 3.2), on the cue's warm key SL. The company withdraws to an upstage line at z −1.9 with a centre gap.
- **Q48 105.2**: the mother (ens6) comes to him at C and then leaves SR. *(cue image; the body is invented)*
- **Q49 109.2**: Washington steps in from D-UC to UC (0, −2.3), into the gap in the line. Hamilton turns upstage to him.
- **Q50/Q51**: Burr reads DSC. Mulligan's verse is SL at (3.0, 3.4). The company dances in two loose rows. Hamilton is at (1.0, 1.5), writing.
- **Q52 141.3, the voyage**: the company forms a "ship" (two hull lines plus a bow and stern, facing SL, drifting 0.7 m). Hamilton crosses to the SL stair: foot at 144.0, top at 148.6 (4.6 s). He walks to USG (1.6, −3.35) as the prow for the city chorus. He comes down the SL stair from 155.0 to 162.7 and stands DC (0, 3.0) at 166.3. *(invented. The cue says the staircases evoke the ship.)*
- **Q53 148.2**: the New York company spreads out with a centre lane clear for his descent. Q54 154.5 is a cheat-in sweep.
- **Q56 166.3**: Angelica, Eliza and Peggy enter by G-UC onto the upstage gallery at x −1.2, 0 and 1.2. The ensemble splits into two side groups facing up to them, and Hamilton turns upstage. *(The cue cites Disney+ frames of the gallery warm for this; the women's being up there is my reading.)*
- **Q58 179.5, the anthem**: Hamilton DSC (0, 4.2), with Burr, Lafayette, Laurens and Mulligan in a wedge behind and the ensemble behind them. From 188 the women come down the SL stair in single file (Peggy, Eliza, Angelica, about 1.5 s apart) and wait UL.
- **Q60 201.2**: Hamilton goes to C (0, 1.0). All 18 others form a ring at r 3.2 facing him. Washington is at 12 o'clock, Burr at 6 o'clock (DSC), the women on the SL side.
- **Q61–64, the roll-call**: Mulligan, Lafayette and Laurens step in to r 2.5 and face out. Laurens stays alone. Washington steps in to UC (0, −1.5). Eliza and Angelica step in.
- **Q65 219.6**: Burr steps out of the ring to the lip (0, 4.75) for the confession.
- **Q66 223.3, the line-up**: nine principals across z 3.7: Washington −2.7, Lafayette −1.8, Burr −0.9, **Hamilton 0**, Laurens 0.85, Mulligan 1.7, Eliza 2.55, Angelica 3.4, Peggy 4.25. Ten ensemble in a row behind at z 2.2. Burr turns to Hamilton for the last question, and the principals cheat in on the button. *The line's order is invented. It is asymmetric (three to SR, five to SL), because the women came down SL and Washington walks round from UC through the gap in the ensemble row. A reviewer with a still of the line-up should reorder it.*

### 1-02 Aaron Burr, Sir: partly sourced (the cue sides are sourced; the moves are invented)
- Burr strolls the street from SR to centre (0.4 to 8.0). Hamilton comes in from W-DSL on Q81 12.0. At Q82 37.1 they circle each other, and Hamilton crosses to SR of Burr at 51. At Q83 56.0 Burr leads him SL toward the lamp. At Q84 62.3 Burr steps DS to give his advice.
- **Q86 83.4, the friends burst in**: Laurens from W-MSL, Lafayette from W-MSR, Mulligan from D-UC. Eight ensemble members fill the tavern upstage (z −2.6…0.2) facing the scene. Burr retreats to DSR.
- The verses follow the cue pins: Laurens SL (Q87), Lafayette SR (Q88), Mulligan down the centre (Q89).
- Q90 is the toast round Hamilton, with the tavern in an upstage arc. At Q91 everyone turns on Burr (he comes to (−2.6, 3.4)). At Q92 he retreats to the DSR corner. At Q93 151.6 Hamilton goes to DSC (0, 4.0).

### 1-03 My Shot: partly sourced (cue-cited still for chorus 1; the rest invented)
- Hamilton works the room in verse 1, three cross-and-return moves round DSC. Ensemble 6 and 9 join at 46.6 (Q106, "the company in"), and the company forms a V opening onto him.
- **Q109 73.9, chorus 1**: the four stand DSC (Lafayette −1.8, Hamilton −0.6, Laurens 0.6, Mulligan 1.8, at z 3.8–4.1), with the company in two rows behind. This follows the cue's Joan Marcus still ("the four DSC, fists up"). The friends' order is invented.
- The three verses use the cue pins: Lafayette SR (Q111), Mulligan SL (Q113), Laurens centre (Q115).
- **Q117 127.7**: Burr comes to (−2.2, 4.2) to caution them, then exits W-DSR at 138.9. *(Whether Burr stays through the rest of My Shot is a question for the reviewer.)*
- Q119 is the quiet moment DSC. At Q120 the friends gather.
- **Q121 168.2, chorus 2**: the four go to the inner disc and the company walks a full 360° circle round them on the outer ring (171.0 to 189.4, about 1 m/s). *(invented. My Shot is often remembered with the turntable revolving.)*
- Q123 189.9 is a single line of 14 along the downstage edge (cue: "the line DS"). Q124 203.5 is a flying V with Hamilton at the point. At Q125/126 the four stand DSC while the company forms two marching rows and advances 1 m on 220.7.
- **Q127 231.9, the death verse**: Hamilton is alone at C. The company circles him in slow motion (90° in 17 s at r 3.0), and the friends freeze in the DS corners. Q129 is the snap back into pools.
- Q131 brings the company in to r 2.2 round him at C. At Q132 (the centre table) they open to r 3.4. At Q133 the friends come to him.
- Q135 repeats the chorus-1 picture. At Q137 the line goes DS. At Q138 Hamilton steps to the lip and everyone else drops back to z 2.6. Everyone clears at the blackout, except the four, who settle into 1-04.

### 1-04 The Story of Tonight: partly sourced (cue: "the friends by candle DSC round their chairs")
- The four stay DSC: Lafayette, Mulligan, Hamilton, Laurens from SR to SL. They form a half-circle at Q141, a raised line at Q142, the half-circle again at Q143, and a tight line at Q146.
- **Q144 46.6**: the company hums in. Six stand in an upstage deck arc and four on the upstage gallery (entering by G-UC), all facing the four. They fall back a step at Q145 and lean in at Q146. *(invented)*
- At the Q149 blackout all exit. The gallery four leave by G-UC from 82.6 onward, during the fade.

### 1-05 The Schuyler Sisters: partly sourced
- **Q150 0.7**: Burr is DS at (−1.0, 4.0), having walked on in the change. **Q151 10.4**: the city walks on into ten places, keeping a centre lane, and drifts a step outward at 16. Burr steps to the DSR corner (−4.6, 4.3).
- **Q152–154, the sisters revealed**: each walks up from D-UC to her shaft: Angelica (0, 1.1) at 21.9, Eliza (−1.1, 1.5) at 24.2, Peggy (1.1, 1.5) at 25.9. **Q155 26.7**: down to DSC: Eliza SR (−1.1, 3.4), Angelica (0, 3.6), Peggy SL (1.1, 3.4). *In the film I believe they enter upstage and come down through the crowd; check against video. Q152 cites Joan Marcus "three steel-blue beams on the sisters".*
- **Q157 39.9, the street walk**: the three walk a full clockwise circle on the inner disc (r 2.0, 40.6 to 51.0) as a single file. The city moves to r 3.6 and counter-revolves 30°. *(The cue says Korins pitched the turntable for this. The walk itself is invented.)*
- Angelica's verse is DSC from 52.6. At Q160 Eliza comes to Angelica's side. Q161 is Burr's approach. At Q163 Eliza and Peggy step away while Burr works Angelica, coming to her SR and then circling behind her to her SL. At **Q164 91.5** he is rebuffed and exits W-DSL.
- **Q165 97.4**: Angelica's solo DSC (0, 4.2). At Q166 the city closes in. **Q167 115.5**: the sisters in a line DSC with the city in rows. Q170 134.2 is the counterpoint: the sisters on the inner disc while the city walks 180° round them. The rows return at Q171. The button pose is at Q174.5.
- At the blackout the sisters run off (Eliza SR, Angelica and Peggy SL; about 3 m/s, arriving 1-06 0.9 to 1.25). The city stays on and re-forms as Seabury's crowd ("the soapbox goes on in the dark").

### 1-06 Farmer Refuted: partly sourced (cue cites Disney+ frames for the box centre-left and Hamilton on the podium)
- **Q175 0.8**: ens2 is labelled **Samuel Seabury** on his box at (1.4, 2.4), facing −15. Nine of the crowd stand round him on his US and SL sides. Burr enters into the crowd SR (−2.2, 1.4).
- **Q177 15.8**: Hamilton enters from W-DSR to (−3.0, 3.6) and walks toward Seabury to (−0.8, 3.2). Laurens, Lafayette and Mulligan come in behind him from SR. *(The friends' presence is invented.)*
- At Q178 Hamilton gives a step. **Q180 46.1**: Hamilton at (0.8, 2.6) beside Seabury, who shifts to (1.8, 2.2). There is no box in the model, so "on the box" means standing at it. At Q181 Hamilton moves round to the front of the box.
- **Q183 78.0**: the crowd presses 0.5 m in and the friends join him. At Q184 Seabury squares off. **Q185 92.3**: Hamilton DSC (0.4, 4.3). **Q186 96.5**: Burr steps in to (−0.8, 4.6).
- **Q187/188, the herald**: ens5, the crowd member nearest UC, steps up to UC (0, −2.0). Everyone turns upstage to him.
- **Q189 106.9**: the stage clears to the nearest wings from 104.6 (about 2 m/s). The herald leaves last by D-UC, and everyone is off by 110.4. ens2 gets "Ensemble 2" back on his exit.

## Merge tool
`python -I tools/blocking-merge.py <dir with only seg1.json> --check` gives **0 errors, 0 warnings**. Along the way I fixed bodies standing on the SR stair's bottom treads at about x −4.0, z 0…1.7. Keep deck positions at x ≥ −3.7 there.

## My own checker's leftovers (not merge warnings)
`lib.check()` simulates the page's motion. About 50 sub-second "close" passes remain, where two bodies pass within 0.4 m during a formation change: crossings lasting 0.2–0.8 s, mostly ensemble with ensemble. None involves two people standing together. The worst are:
- 1-01 224–225: the women walk from the ring to the line-up past ensemble bodies.
- 1-03 204: the flying V.
- 1-03 297: chorus 3, as the friends cross to the four DSC.
- 1-05 149: Angelica returns DSC through the re-forming rows.
- the end-of-number dark exits.

Three legs run at about 3 m/s: the sisters' run off at the end of 1-05, into the dark. Everything else is at 2.7 m/s or under.

## Open questions for the reviewer, most important first
1. **1-01 line-up order and shape** (Q66). Check it against a Disney+ frame or Joan Marcus still, and reorder the `line` dict in `t101.py` accordingly.
2. **Hamilton's reveal** (Q44): does he walk on through the company, or is he discovered already standing among them? Which way does he enter?
3. **Is the Jefferson/Madison labelling in the opening wanted?** If Act 1 should never show Act 2 names, drop those labels.
4. **The voyage**: does Hamilton go up to the gallery, and do the women sing from the upstage gallery at Q56?
5. **Burr's entrance side** in 1-01, and whether Burr stays through the second half of My Shot.
6. **The Schuyler sisters' entrance** (upstage through the crowd, or already DS), their SR-to-SL order, and the turntable walk.
7. Whether Eliza, Angelica and Peggy (and the friends) are in the Farmer Refuted crowd. Here only the friends are.

## Review

The reviewer fixed this segment through the generator, not by hand. The edits are in `seg1work/t101.py` to `t106.py` and `lib.py`, marked `REVIEW:`. `python export.py` regenerates the segment. Do not hand-edit `seg1.json`. Result: 1280 waypoints and 0 merge errors or warnings. `lib.check()` reports 17 brief passes, all at 0.26 m or more and under 1 s. The worst before was 0.01 m.

### Sources checked
- Fan staging accounts written from the Public Theater and early Broadway runs (2015–16), song by song:
  - https://ironinkpen.tumblr.com/post/136570471307/neat-little-hamilton-staging-things-act-i (the most useful; the author says some details are from memory)
  - https://hamiltonsideblog.tumblr.com/post/137020626930/hamilton-staging-notes
  - http://hamilton-lyrics.tumblr.com/post/135188799432/my-hamilton-experience
- Searcy, "Bringing Dance Back to the Center in Hamilton", *American Music* 36/4 (2018), https://www.annesearcymusichistory.com/s/03_Searcy_AM_36_4_text.pdf
  - The ensemble ties up the ship as he steps off it in the opening.
  - In My Shot the ensemble lunges toward him (a Joan Marcus still), then shifts round him in groups.
- https://www.broadwayworld.com/article/BWW-Interview-All-the-Right-Moves--Tony-Nominee-Andy-Blankenbuehler-Explains-the-Inspiration-of-His-Revolutionary-HAMILTON-Choreography-20160528: the opening unlocked the show's rotation, which is counter-clockwise as Hamilton's motif.
- https://www.sheilaomalley.com/?p=106670: in the opening, the ensemble circles the stage, moving in and out.
- Photo captions, read in the usual left-to-right order:
  - Playbill and Broadway.com Joan Marcus stills captioned "Phillipa Soo, Renée Elise Goldsberry and Jasmine Cephas Jones": https://playbill.com/gallery/sisters-of-broadway-quiz-2 and https://www.broadway.com/shows/hamilton-broadway/photos/hamilton-show-photos/213296/hamilton-show-photos-815-phillipa-soo-renee-elise-goldsberry-jasmine-cephas-jones
- Tried and unusable:
  - VocalEyes' Disney+ audio introduction returned 403.
  - The CUNY paper on the revolve returned 403.
  - Live Design's Grammys piece returned 403.
  - The fandom transcript returned 402.
  - The Getty and Grammys captions give no left-to-right order.
  - Reviews of the film (Variety, THR, RogerEbert) and the Playbill clip page do not describe the blocking.

Nobody could watch the film itself. Nothing found gives the opening line-up's order or Hamilton's exact entrance path.

### The writer's questions
1. **The line-up order.** No source gives it. The new line is reasoned, not sourced:
   - It is symmetric, four each side of Hamilton: SR to SL, Washington, Lafayette, Laurens, Burr, Hamilton, Mulligan, Eliza, Angelica, Peggy, on z 3.7.
   - Burr stands beside him for the last question.
   - The sisters are SL because that is where they come down. Eliza is nearest him.
   - The ring's order was changed so that everyone walks straight into the line. Women are at 80/100/120 degrees.
   - The ensemble is in a row at z 2.2 with gaps for the crossings. The centre gap closes behind Hamilton once he has passed.
2. **Hamilton's reveal.** No written source settles it. The account says only that his entrance holds for applause. The writer's version stays: in by the deck door, up a corridor through the company, arriving in the centre shaft at 79.0. That fits Q44's "single shaft centre".
3. **The voyage and the gallery.**
   - Kept: he climbs the SL stair and comes back down. Searcy has him *step off* the ship while dancers tie it up, so two of the company now stand at the stair foot as he descends (157.6 to 160).
   - The women stay on the upstage gallery at Q56. The cue cites Disney+ frames of the lit gallery. Nothing contradicts it, but nothing confirms the women are up there either.
4. **Burr.**
   - Kept: he enters SR in 1-01. This is the writer's memory of the film; no source was found.
   - My Shot, changed: a fan account says Burr sits at the back of the stage reading a book until his verse. He now goes UR (-3.3, -2.2) at the top of 1-03, comes down through a lane for his verse (at 128.2), and exits DSR as before. His leaving after the verse is unverified.
5. **The Schuyler Sisters.**
   - The order Eliza SR, Angelica centre, Peggy SL is supported by caption order. Photos are taken from the house, so the audience's left is SR.
   - The entrance from the deck door into the shafts is kept.
   - The turntable walk is changed. A fan account says the sisters walk *against* the turning disc and so appear to travel down the street while staying in place. They now hold their row on the inner disc (39.4 to 50) and do not walk a lap. The city on the outer ring is carried 60 degrees counter-clockwise to show the turn, and its arc was re-centred so it ends balanced.
6. **The Farmer Refuted crowd.**
   - The writer was right: the friends are there and the sisters are not. A fan account has Mulligan and Lafayette nudging him toward the box, and Laurens delighted.
   - Added: Burr holds him back at his entrance, at (-1.6, 3.8) from 19.8.
   - Added: Lafayette and Mulligan close in behind him (40 to 42.8).
   - Added: Burr pulls him away at the end, and the two leave DSR together.

### Changes per track
- **1-01**
  - ens6 to ens9 start on the upstage gallery at Q37–Q39, where the cue says the gallery ensemble reads golden. They come down the SL stair (ens8, ens9) and the SR strip and stair (ens6, ens7) before Q42.
  - The hurricane is the six deck bodies at 60 degree spacing.
  - The mother is carried off by a second dancer (fan account).
  - A dancer stands on the centre chair as the cousin during Washington's verse (fan account). Hamilton steps aside to (1.0, 1.7).
  - Angelica enters SL to hand him a book at Q50 (fan account; when it happens is a guess).
  - Laurens brings him his pack before the voyage (fan account).
  - The ship's SL bodies wait until he has passed to the stair.
  - Ship tie-up at the stair foot (Searcy).
  - Anthem company slots are moved off the women's path.
  - Ring and line-up as above.
  - Blackout: the ensemble exits upstage and the principals downstage.
- **1-02**
  - Hamilton comes to 0.65 m of Burr at the drink (Burr's arm round him; fan account).
- **1-03**
  - Burr sits UR until his verse.
  - The sisters watch from the upstage gallery from 163 to about 305 (two fan accounts).
  - The back row is opened to x +/-2.0 so the four have a lane.
  - The V entrances are later.
  - Laurens and Mulligan swap in the flying V and at Q133, so nobody crosses.
  - Mulligan goes through a gap in the ring.
  - The final-chorus four arrive 1.8 s later, after the rows settle.
  - The vee, rows and death ring now use distance-minimising slots.
- **1-04**
  - The ten ensemble removed: a fan account says the four are the only ones on stage. Q144's "the company hums in" is a reconstruction, read here as offstage voices.
  - The order is Lafayette, Hamilton, Laurens, Mulligan, which is how they finish My Shot.
  - Laurens and Hamilton exit together to W-DSL.
- **1-05**
  - The street walk as above.
  - The counterpoint ring is re-slotted so nobody stands DSC.
  - The sisters wait for the rows before coming down (this removes the 0.01 m pass).
  - ens2 takes the row slot nearest Seabury's box.
  - The sisters' run-off is now 2.4 m/s from 183.0 (it was 3 m/s).
- **1-06**
  - Burr and the friends as above.
  - The crowd re-forms from 184.6.
- **lib.py**
  - `assign()` is now a minimum-total-distance (Hungarian) matching instead of greedy. This takes most of the crossing paths out of every formation change. The old greedy version is kept as `assign_greedy`.

### Not verified, left as the writer had it
- Laurens' and Jefferson's verse sides in 1-01.
- The hurricane and Q42 shapes.
- Washington standing UC from Q49 to Q60.
- My Shot's chorus order of the four. One CNN caption gives Laurens, Hamilton, Lafayette, Mulligan from left, but which number that photo shows could not be confirmed.
- All of 1-02's tavern shapes.
- Seabury's box position, which is cue-sourced.

## Spotlights

Wave 3, the spotlight pass. Changes are in the generator only (`seg1work/t101.py` to `t106.py`, marked `SPOT:`). `python export.py` rewrites `seg1.json`. Result: 1288 waypoints; `blocking-merge.py --check` gives 0 errors and 0 warnings. `lib.check()` leaves 2 brief passes, both from before this pass (1-01 61–63 at 0.43 m; 1-01 148.6 at 0.27 m); there were 17. The originals are backed up in `scratchpad/spot1/backup/`.

**Method.** `scratchpad/spot1/spotcheck.py` walks every cue of the six pool dumps. For each person light that lands on the deck or a gallery, it poses every actor with the plotter's own `pose()` at 25 %, 60 % and 95 % of the hold. It skips the gallery Lustr and birdie pins, as the brief says. A person light is a `special`, or a `wash` with zoom ≤ 18.5° (the coordinator's segment 5 finding). In this segment only two narrow washes come up: 1-01 Q52 ch13 (the voyage's white top light UC) and 1-02 Q83 ch52 (the lamplit pool at the drink). Both were checked. The named Eos presets were read from `assets/hamilton-eos.json`:
- 117 BURR: ch2 at (−1.84, 4.48)
- 259 Ham dsc: ch44 at (−1.21, 3.74)
- 151 Ham DSC: ch43 at (0.27, 2.53)
- 1169 GW: ch12
- 607 NEW RINGS: ch47–58

**The dump is older than the cues.** The pool dump was made on `actors` (bd34404). The cue revisions 3–5 (Jack's checklist notes) are on `cue-blackouts`, not yet on `actors`. Only one difference matters for the specials here: **1-03 Q119**. In revision 4 it is blue, with ch13 refocused to (0, 0.3, 1.1), which is the centre shaft at about (0, 1.15). In the dump it is warm, with ch43 only. The blocking follows revision 4: Hamilton is at (0, 1.15) from 159.8 to 165.6. One side effect of revision 4 is listed under the suspect cues below.

### 1-01 Alexander Hamilton
- **Burr, Q36.1 AF (ch2, (−1.82, 4.25)).** He walks on into it: from (−1.6, 3.6) and (−0.6, 3.9), to (−1.9, 4.05) and (−1.45, 4.2). Q42, Q43, Q50 and Q65 now have him in it too. At Q50 he moves from (−0.9, 4.0) to (−1.65, 4.15). At Q65 the confession moves from the lip (0, 4.75) to the AF (−1.82, 4.22).
- **Laurens, Q38 SL pin (ch51).** From (2.8, 2.7) to (2.9, 3.3).
- **Jefferson, Q39 SR pin (ch48).** From (−2.6, 2.6) to (−2.85, 3.15).
- **Madison, Q40 (ch52).** From (0.9, 2.6) to (1.1, 2.7).
- **Eliza, Q47 warm key SL (ch52, (2.14, 3.06)).** From (3.4, 3.2) to (2.2, 3.05), arriving at 93.6. The company withdraws 0.8 s earlier so that it is clear of her key.
- **Washington, Q49 (ch12, refocused onto the deck at (−0.57, −0.59)).** From UC (0, −2.3) to (−0.5, −0.65) for the verse. He goes back to UC at Q50, because the company's rows need that ground. Hamilton turns to him as before.
- **Mulligan, Q51 key SL (ch51, (1.78, 3.27)).** From (3.0, 3.4) to (1.8, 3.3). Laurens' two pack crossings go round him through (2.75, 2.9).
- **Q52 voyage, white top light UC (ch13, narrow wash, (0, −0.52)).** This is not a person label. Washington stands under it at (0, −1.25) until 148.2.
- **Q56 the women.** The cue lights Eliza's and Angelica's warm keys **on the deck**: ch52 SL (2.55, 1.92) and ch47 SR (−2.76, 2.43). Nobody was in them, because the women were on the upstage gallery. Changes:
  - Eliza walks on from W-DSL into ch52, arriving at 167.4, after the company has cleared it.
  - Angelica walks on from W-DSR into ch47.
  - Peggy alone comes through G-UC onto the warm gallery at (1.75, −3.4), into its special ch74.
  - The ensemble's side groups are reslotted off both keys.
  - Hamilton turns to Angelica, then to Eliza, then front.
  - In the anthem Eliza waits at (3.6, 1.0) and Angelica at (−4.6, 2.4). Only Peggy comes down the SL stair.
- **Q60–Q65, the roll-call ring.** The ring is reset so that each pool is on, or one step in from, its owner's place:
  - Lafayette at 228° (ch47)
  - Mulligan at 190° (ch49)
  - Laurens at 140° (ch51)
  - Burr at 210°, r 3.4 (his AF)
  - Eliza at 110° (ch52)
  - Angelica at 252°, r 3.4, stepping into ch48 at Q64
  - Washington at 0°, stepping into ch12 for Q63
  - The ensemble at 15–74° and 266–338°, which leaves the downstage arc open.

  The assignment of the three Q61 pools follows the line-up sides: Laurens' pool is fixed by Q62, and Lafayette's SR. Laurens slips round to (−1.2, 3.0) at 216, and Angelica crosses to the SL side in the dark of Q65, so that the kept line-up order needs no late crossings.
- **Q66, the line-up.** ch13 (centre shaft, (0, 1.15)) comes back at 0.9 on Q66. So Hamilton holds the shaft, framed by a corridor:
  - The ensemble row at z 2.2 now has no centre slot, and the principals' line has its gap at x 0.
  - He walks down into the line at (0, 3.7) on **Q67 (229.4, the last question)**.
  - The line order is unchanged.

### 1-02 Aaron Burr, Sir
- **Q81–Q85.** Burr's AF is ch2 at (−1.82, 4.25). Hamilton's key is ch44, which the dump lands at (−0.69, 3.35); preset 259 puts it at (−1.21, 3.74).
  - Burr strolls to (−1.8, 4.15), not (−0.8, 3.2).
  - Hamilton enters to (−0.55, 3.25) and circles inside his key, at (−0.75, 3.05) and (−0.85, 3.45).
- **Q83, the drink.** The lamplit pool (ch52, narrow wash at (0.89, 3.27)) holds both men: Hamilton at (0.25, 3.25), Burr at (−0.1, 3.85).
- **Q84.** Burr steps back into his AF.
- **Q89.** Mulligan goes from (0.6, 3.4) to his pool centre, ch50 at (0.4, 2.5).
- **Q91.** Burr goes from (−2.6, 3.4) into his AF at (−1.85, 4.15). The tavern turns to him there.
- **Q93, Hamilton's DSC special (ch13, (0, 2.40)).** He steps back to (0, 1.7) on Q92, then forward to (0.1, 2.45). Before, he went to (0, 4.0).

### 1-03 My Shot
- **ch13 at (0, 2.40) is Hamilton's special nearly the whole song.** Binkley's 'Ham DSC' preset 151 is ch43 at (0.27, 2.53). The writer had him at z ≈ 4, outside it in 22 cues. The whole picture moves up about a metre:
  - home H0 is (0.05, 2.4), and the verse-1 crosses stay inside the pool
  - Q104 and Q108 bring him back to H0
  - the four for chorus 1 and the final chorus: Lafayette (−1.3, 2.9), Hamilton (−0.1, 2.55), Laurens (1.1, 2.75), Mulligan (2.3, 3.0)
  - the company rows are at z −0.4 and 1.2
- **The verse pins.**
  - Q111 Lafayette in ch48 at (−2.45, 3.1)
  - Q113 Mulligan in ch51 at (2.25, 3.1)
  - Q115 Laurens in ch50 at (0.55, 3.45)
  - Hamilton stays in his special, which is dimmed.
- **Q117.** Burr comes down the SR side through the row gaps into his AF at (−1.75, 4.1). Before, he stood at (−2.6, 2.6), outside it.
- **Q118, all four keyed.** Hamilton is in ch13, Lafayette in ch48 (−2.35, 3.05), Laurens in ch50 (0.9, 3.6) and Mulligan in ch51 (2.2, 3.1). Before, ensemble 9 stood in Lafayette's key.
- **Q119, Jack's blue with one white centre spot (revision 4).** Hamilton goes up into (0, 1.15), and the friends hold their pools.
- **Q120 to Q126.** Hamilton stays near (0, 1.75)–(0, 2.05), which is inside ch13 at either focus.
  - Q123, the line DS: the line is at z 3.6 with a centre gap, and Hamilton calls to it from (0, 2.05) behind.
  - Q124, the flying V: the V's point is Hamilton at (0, 2.05), and the V runs upstage from him.
  - Q125 and Q126, the chant: the four are at z ≈ 2.1, and the marching rows are moved up.
- **Q129.** He goes to H0, not (0, 3.2).
- **Q131.** He stands at (0, 1.5), inside the tightened fan and ch13. The company ring is at r 2.6, out of his special.
- **Q133.** He stands at (0, 1.85). Laurens moves off ch13 to (1.0, 2.75).
- **Q138, the isolate (ch13 at (0, 1.15) in both cue versions).** He goes up into it; before, he went to the lip. The line opens to the sides and falls back to z 2.9. On the Q139 button he takes a step down to (0, 1.75).
- **Other fixes.**
  - The four no longer cross in the line or the V: the line order follows their current x.
  - In the death verse, Laurens and Mulligan swap corners.
  - At the blackout the company clears outermost first, each to its own side.

### 1-04 The Story of Tonight
- **Four chair pools, held all song:** ch48 (−1.26, 3.47), ch49 (−0.39, 3.78), ch50 (0.49, 3.79) and ch51 (1.37, 3.48). The four (Lafayette, Hamilton, Laurens, Mulligan) now sit in one pool each. Every shape (the round, the toasts) is a small move inside the pool. Before, Hamilton sat between ch48 and ch49, and Laurens in Hamilton's.
- Lafayette exits W-MSR, clear of Burr walking on DSR.

### 1-05 The Schuyler Sisters
- **Q150.** Burr goes from (−1.0, 4.0) into his AF at (−1.7, 4.2).
- **Q152–Q155.** The cue's reveal shafts and keys are:
  - **Angelica SR**: ch96 (−1.65, 2.81) on her name, then key ch48
  - **Eliza centre**: ch98 (0, 3.16), key ch50
  - **Peggy SL**: ch100 (1.65, 2.81), key ch51

  The cue is consistent about this all song:
  - Angelica's verse pool is ch47 at (−1.52, 3.27).
  - Her solo is ch97 + ch47 at about (−1.57, 3.2): a white pool with a white shaft over her. This is the "DC solo"; it lands just right of centre.
  - Eliza's question pool is ch52 at (1.10, 3.06).

  So the sisters now stand in that order:
  - They walk up from D-UC into their shafts at 21.9, 24.2 and 25.9, and down into their keys at Q155.
  - They hold the shafts through the street walk; the review's turntable reading is kept.
  - Angelica plays her verse and solo in her pools.
  - Eliza steps to ch52 for her question; Peggy gives way.
  - Burr works Angelica from inside his AF, at (−2.1, 4.35), (−1.3, 4.3) and (−2.45, 4.1), and exits DSR.
  - The city rows are moved off the shafts.
  - The counterpoint ring is at r 3.5.

  **This reverses the review's order (Eliza SR, Angelica centre).** That order rested on photo-caption order; the photo itself was not seen. See the suspect cues below.

### 1-06 Farmer Refuted
- **Q177.** Hamilton's key DSR is ch44 at (−1.53, 3.14). Hamilton goes to (−1.2, 3.15). Burr holds him back from (−2.5, 3.95), outside the key.
- **Q180.** Hamilton stands beside Seabury at (1.0, 2.65), in both ch12 and ch45.
- **Q185, "Hamilton DSC in his key (preset 259)".** ch44 lands at (−0.28, 2.93). Hamilton goes there, not (0.4, 4.3). Laurens, Lafayette and Mulligan give him the pool.
- **Q186.** Burr comes into his AF at (−1.75, 4.2). Before, he went to (−0.3, 4.7).
- **Q188, the herald.** The herald (the company member nearest it) stands in the one hard white special, ch13 at (0, 0.63), with the red disc ch18 just upstage. Before, he stood at (0, −2.0). The crowd steps back to 1.45 m. The herald leaves last, by D-UC, at 2.3 m/s.

### Cues I think are wrong, not the blocking
1. **1-05 Q152/Q153 (ch96 vs ch98) and the sisters' pools ch47/ch48/ch97 vs ch50/ch98/ch52.** The cue puts Angelica SR and Eliza centre. The review's caption order and the well-known Joan Marcus title picture (pink centre) put Angelica centre and Eliza SR. If Jack confirms that, then:
   - swap Q152's shaft to ch98 and Q153's to ch96
   - move Angelica's verse and solo pools (ch47, ch97) to centre, and Eliza's question pool (ch52) to SR
   - the blocking then needs Angelica and Eliza swapped back (the `KEYS` and `SHAFT` dicts in `t105.py`)
2. **1-03 Q120 (revision 4): a focus leak.** Q119 refocuses ch13 to (0, 0.3, 1.1). Q120 restores the colour but not the focus or zoom, so on `cue-blackouts` ch13 tracks at centre (0, 1.15) through Q126, until Q129 sets (0, 0.3, 2.3). The dump has it at (0, 2.40) for Q120–Q126. Hamilton's places there are inside both, but Q120 probably wants `focus [0, 0.3, 2.3], zoom 10` added.
3. **1-03 ch43, the FOH X4 for 'Ham DSC' (preset 151).** It is lit through most of My Shot, but its beam stops 1.1 m from the lens: hit (−1.28, 5.52, 8.41), lens (−1.5, 6.23, 9.22). It would land at (0.38, 2.21) on the deck. It is a rig or collision problem, not a cue: something in the house clips that position. Hamilton is placed where it would land anyway.
4. **1-02 Q81–Q83 ch44 ("Ham dsc", preset 259).** The dump lands it at (−0.69, 3.35), but the real preset's focus is (−1.21, 3.74), and at 1-06 Q185 the same channel lands at (−0.28, 2.93). The blocking follows the dump. Hamilton's places in 1-02 are inside both, except the drink.

### Left as is
- **Fan shafts** (ch91–99, ch6–10, ch93): a steel fan, not person lights. Ensemble bodies standing in them are fine.
- **ch224 and ch225**, "Clear ACL Streets" PAR64s in the preset and opening: scenery shafts.
- **The gallery Lustr and birdie pins on empty gallery spots.**
- **Walk-throughs (minor):**
  - city bodies crossing the sisters' shafts during the 1-05 counterpoint revolve (Q170)
  - Burr passing through Hamilton's key as he enters at 1-06 Q177
  - crowd bodies passing the herald's special and the red disc during the 1-06 clear
- **1-01 Q47 to Q51:** ch13 is off, so Hamilton is unlit there by design.

## Review 2 (Jack's verdict)

Jack watched 1-01 to 1-05 and gave notes per song; for 1-06 and anything his notes do not cover, his general verdict is
that the ensemble is used too much and the invented formations are wrong. All changes are in the generator
(`tools/blocking/seg1/t101.py`–`t106.py`, `lib.py`, marked `REVIEW2`) and in segment 1's section of
`tools/blocking/props.py`. The pre-change files are backed up in `scratchpad/act/review2/seg1/backup/`.
Result: 819 waypoints (was 1288). `blocking-merge.py --check` gives 0 errors; its one warning is another segment's
(`king-stool`). `lib.check()` leaves only sub-second passes at 0.26 m or more, and the run in 1-05 (3.0 m/s, wanted).

### Sources this round
- https://ironinkpen.tumblr.com/post/136570471307/neat-little-hamilton-staging-things-act-i (re-read for furniture):
  - the opening has a chair at centre, with the cousin on it;
  - in My Shot, Laurens stands on a table and Hamilton stands on things;
  - in The Story of Tonight, only the four are on stage;
  - The Schuyler Sisters has the street-walk turntable;
  - in Farmer Refuted, Seabury is on a soapbox, Burr holds Hamilton back and later pulls him away, and Seabury moves
    the soapbox away from Hamilton.
- https://hamiltonsideblog.tumblr.com/post/137020626930/hamilton-staging-notes: Burr sits at the back reading in My Shot.
- Binkley's own Eos presets in `assets/hamilton-eos.json`: 42 "Cntr Table", 45 "Cntr table", 43 "inner table",
  767 "Table USC", 768 "DS table", 805 "tight table", 606 "chairs", 703 "surround chairs", and 615/730/947 "desk". So
  the production has a centre table and chairs, but the presets do not say which number uses which.
- The show file's cue 80 (1-02): "a warm spill SL where the practical street lamp stands … Disney+ frames".
- Tried and unusable:
  - The ETC cue-photo PDF is 325 MB, beyond the reader's 100 MB limit, and this machine has no PDF tool.
  - A search for Farmer Refuted staging found only the song's Wikipedia page and LitCharts, which say nothing about
    the crowd.

### Per track
- **1-01** (ensemble 10 → 10, Jack's notes):
  - The show clock's 10 s lead-in is used. Burr walks on from DSR between −8.0 and −3.5 and is standing in his AF when
    the music starts at 0.
  - The six deck ensemble start walking on at 36.0, just after Jefferson's verse starts (Q39 33.5). They walk at about
    0.85 m/s, staggered 0.7 s, and are in their pools by about 46.
  - The gallery four come through the passage from 36.4, 1.4 s apart, at the same pace. Q39 is where the cue warms the
    gallery.
  - CUT: the hurricane swirl on the outer ring. It was marked invented, and it clashed with the later entrance. The six
    hold their pools through Q40 and Q41.
  - Furniture: the cousin's chair (fan account), preset UC by the SL stair foot at (1.6, −2.75) from the lead-in. The
    cousin (ens3, fixed now) carries it to (0, 0.35) for Washington's verse and stands on it.
  - Jack's table:
    - ens7 carries a table (1.2 × 0.6) on from W-DSR, with ens6 beside him, round Lafayette. It is set at (0, 1.6) at
      129.4, just before Q51.
    - Hamilton comes round its SL end and works at it from 130.8, standing at C with the chair behind him. Laurens
      brings the pack to the table's SL side.
    - At Q52 (141.3) ens7 takes the table off DSR and ens6 the chair. They come back for the New York burst (Q53).
    - The ship is made of the other eight.
  - The mother and her carrier now leave DSR round Lafayette. Their MSR line crossed the SR stair.
  - Burr's Q51 place moved to (−3.0, 4.4), out of the carriers' path.
- **1-02** (ensemble 8 → 0, Jack's note):
  - No ensemble.
  - At Q86 Laurens carries the picnic table (1.8 × 0.7) on from W-DSL, with Lafayette on its downstage side and Mulligan
    upstage. It is set DSC at (0, 3.3) at 88.0.
  - Each verse is played at the table and inside the spotlight pass's pools:
    - Laurens at its SL end (1.75, 3.35), in ch51
    - Lafayette at its SR end (−1.75, 3.2), in ch48
    - Mulligan behind it at (0.4, 2.45), in ch50
  - For the toast the four stand round the table. On Q93 Hamilton stands in ch13, just upstage of it.
  - Other furniture, both set in the 1-01 blackout:
    - a street lamp (custom, 0.3 × 2.2 m) at (3.6, 2.2) SL, from cue 80's "practical street lamp";
    - the tavern chair UR, for Burr.
- **1-03** (ensemble 10 → 5, Jack's note):
  - Five of the company (ens1, 4, 5, 8, 10) come on at Q106 and watch from a loose group upstage of him. They face front
    for the choruses.
  - At Q123 they go off. The four friends wander the room at random until Q124: a seeded stroll at about 1 m/s, clear of
    the table, the lamp and each other.
  - The five come back on at Q131 and stay to the end.
  - CUT (all marked invented):
    - the opening V
    - the chorus-2 revolve
    - the everyone-line on Q123 and Q137
    - the flying V
    - the marching rows
    - the death-verse ring
    - the Q131 ring
  - The picnic table stays DSC all song:
    - Laurens stands on it for his verse (fan account; Q115's ch50 lands on it). On Q118 he steps down to (1.25, 3.85),
      still in ch50.
    - Hamilton's verse-1 crosses are pulled up to z 2.5, behind the table.
    - On Q132 ("Cntr Table") Hamilton writes at it.
  - Burr walks to his chair UR at the top and reads until his verse. He then comes down the SR side into his AF, clear of
    the stair and of Lafayette.
  - The death verse is Hamilton alone in ch13 at (0, 1.15), with the friends frozen apart.
  - In the blackout ens8 strikes the table, ens10 the lamp and ens4 Burr's chair. The 1-04 candle table and chairs are
    set as before.
- **1-04**: unchanged (Jack: good).
- **1-05** (ensemble 10 → 8, Jack's notes):
  - Burr starts at W-USL and runs (3.0 m/s) to (−2.0, 4.15), in his AF DSR, from 0.2 to 4.4.
  - On Q164 he backs off to the DSR corner (−4.3, 4.35) and watches the start of Angelica's solo. He walks off only at
    Q166 (105.9).
  - Eight of the company (ens1–8). Nobody enters from W-MSR now.
  - Kept: the walk-on, the drift, the turntable carry (fan account) and the step-in at Q166.
  - CUT: the anthem's marching rows and the counterpoint's 180° revolve. Instead the city stands in two loose groups
    either side of the sisters and cheats in to them.
  - On Q171 ens2 drifts to (2.4, 1.5), by where the box will be set.
  - In the blackout ens4, ens6 and ens8 go. ens1, ens3, ens5, ens7 and Seabury stay for 1-06.
- **1-06** (ensemble 10 → 5, counting Seabury):
  - Four of the crowd stand round the box (was nine). The one nearest ch13 becomes the King's herald, as before.
  - Kept, sourced by the fan account: the friends, and Burr holding Hamilton back and pulling him away.
  - On Q184 Seabury carries his box away from Hamilton to (2.6, 2.0) and stands at it again (fan account). He strikes it
    at the end, as before.

### Furniture added (props.py, segment 1)

| prop | brought on by | where | taken off by |
|---|---|---|---|
| `cousin-chair` | preset before the music | UC (1.6, −2.75) | ens3 carries it to centre (0, 0.35) at 109.4; ens6 takes it off DSR at Q52 |
| `clerk-table` | ens7, with ens6 beside him | centre (0, 1.6) at 1-01 129.4 | ens7, off DSR at Q52 (141.3) |
| `street-lamp` | set in the 1-01 blackout | SL (3.6, 2.2) | ens10, in the My Shot blackout |
| `burr-chair` | set in the 1-01 blackout | UR (−3.54, −2.86) | ens4, in the My Shot blackout |
| `picnic-table` | Laurens, with Lafayette and Mulligan either side | DSC (0, 3.3) at 1-02 88.0 | ens8, in the My Shot blackout |
| `seabury-box` | already there: set in the 1-05 blackout | (1.4, 2.4) | Seabury moves it to (2.6, 2.0) at Q184, then strikes it |

### Not verified; the simplest staging chosen
- When Burr leaves after the rebuff in 1-05. Jack said only "too early"; Q166 is my choice.
- The five in My Shot and their places. Jack gave the count and the cues; the places are a plain loose group.
- Whether the company is on in Farmer Refuted at all. Q183 says the company shouts. Four bodies is the minimum that
  reads as a crowd and still gives the herald.
- The picnic table's spot DSC. It is chosen so that the verse pools sit at its ends and Laurens' Q115 pool lands on it.
  Binkley's "Cntr Table" presets light a table nearer centre (about (0, 1.0–1.2)), probably for another scene.
- The street lamp's exact place. The cue says only "SL".
