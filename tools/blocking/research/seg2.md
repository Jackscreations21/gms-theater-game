# Segment 2 research: 1-07 You'll Be Back · 1-08 Right Hand Man · 1-09 A Winter's Ball · 1-10 Helpless · 1-11 Satisfied

Output: `scratchpad/act/segments/seg2.json`, made by `scratchpad/act/gen_seg2.py` (edit the script and re-run it;
the JSON's `notes` come from `scratchpad/act/seg2-notes.txt`). 1,236 waypoints, 20 actors.
`python -I tools/blocking-merge.py <dir> --check` gives 0 errors and 0 warnings. A spacing check I added
(`scratchpad/act/sim_seg2.py`: positions every 0.25 s, the page's stand-then-walk-at-1.3 m/s rule) finds no leg over
2.6 m/s. A few pairs come within 0.45 m for up to about 2.6 s. Those are listed under "Known rough edges".

What the web had: there was no written beat-by-beat account of the Broadway blocking for You'll Be Back,
Right Hand Man or A Winter's Ball. For Helpless and Satisfied there is one detailed fan staging write-up, plus the
choreographer on which way the turntable turns. The lighting cue labels (Binkley's real ● cues, and the ○
reconstructions with their photo references) are the strongest evidence of WHERE people are, so I anchored to them.
No video was watched (the agents cannot watch video). Everything below that says "invented" should be checked
against the Disney+ film first.

## Sources

- Fan staging write-up of Helpless and Satisfied, very detailed (who crosses where, the processional order, the
  rewind, the ending): https://hamilton-lyrics.tumblr.com/post/139127842879/helpless-and-satisfied-staging
- Fan answer on how the rewind is done (the turntable reverses, the cast moves backward, the scene ends as Helpless
  ended): https://hamilton-lyrics.tumblr.com/post/132738644892/in-satisfied-how-do-they-do-the-rewind-and-then
- Blankenbuehler (via Washington Post, quoted in search summaries): all of Helpless goes counterclockwise; the rewind in
  Satisfied goes clockwise for a moment. Also Dance Magazine: the Helpless choreography is literally rewound.
  https://dancemagazine.com/hamilton-movie/ (403 to the fetcher; summary from search),
  https://www.whatsonstage.com/news/new-video-shows-how-hamiltons-helpless-and-satisfied-sync-up-perfectly_52120/
  (Ye Olde Bard's side-by-side sync video of Winter's Ball/Helpless against Satisfied: the best video to check against)
- The Odyssey: the turntable runs counterclockwise in Helpless (time passing) and clockwise in Satisfied's look
  back, then counterclockwise again back to the wedding. https://www.theodysseyonline.com/hamilton-2646383612
- Broadway in Cincinnati interview: counterclockwise = time passing; two revolves turning against each other.
  https://broadwayincincinnati.news/2020/06/26/andy-blankenbuehlers-pride-and-joy-in-hamilton/
- Boing Boing on David Korins' turntables (an inner disc and an independent outer ring).
  https://boingboing.net/2018/06/05/what-inspired-the-hamilton.html
- Looper and The Odyssey: just after You'll Be Back, the Bullet's actor (Ariana DeBose) plays a spy handed a letter
  whose neck is snapped by a redcoat, the first death of the war.
  https://www.looper.com/228322/small-details-you-missed-in-hamilton/ ,
  https://www.theodysseyonline.com/piece-foreshadowing-hamilton-misses
- King George's staging is nearly stationary: Screen Rant ("all of King George's solo numbers are quite still") and
  Jim McDermott ("almost entirely stationary"). He enters slowly in a heavy cape and crown (Looper).
  https://screenrant.com/hamilton-musical-king-george-songs-love-reason/ ,
  https://jimmcdermott.substack.com/p/episode-525-wait-for-it
- Mary Clarke on Satisfied (the rewind returns to the Winter's Ball, then replays Helpless from Angelica's side):
  https://maryclarke.substack.com/p/hamiltons-satisfied-remains-a-technical
- Not reachable: the TDF event narrative PDF (too large for the fetcher:
  https://www.tdf.org/media/3m1l4xk0/hamilton-event-narrative.pdf). It is an access-performance scene-by-scene
  narrative and probably the best written source for all five numbers. **A reviewer should read it.** The Delfont
  Mackintosh relaxed visual story PDF returned 404. Backstage, Broadway Direct and Live Design all returned 403.
- The lighting tracks `brief/tracks/1-07.txt` … `1-11.txt`: positions named in cue labels (George UC → DC; Kill DR;
  Hamilton DSC; Washington in the centre lane; company peeled SR; Washington alone DC; Burr/Hamilton at the tent; Burr
  DSC; the desk; the sisters centre and Eliza far SL; sisters SL and men SR; the three DC; Hamilton UL; Eliza UL;
  Angelica DC).

## Convention I had to pick

There is no ruling on which ensemble bodies are women. I used ens1 and ens6–ens9 as the women, and ens2–ens5 and
ens10 as the men. The OBC ensemble had five of each, and ens1 is the Bullet's track, so a woman. Couples are always
man + woman under that split.

## 1-07 You'll Be Back (PARTLY SOURCED)

- King: walks on from the upstage door (D-UC) and is at UC by 3.5 s (Q190.01 has him revealed UC in the vamp). He holds
  there, then on Q194 (41.8) walks DC slowly (1 m/s, the heavy cape). After that he is nearly still: a step to the lip
  on each threat (Q194.2 66.96, Q195.4 159.54), DSC for the band drop (Q195 121.58), small drifts SL and SR on the
  sing-alongs and the patter (**invented**, so the waypoint density is above zero). He leaves SL in the dark after
  Q202 (the transition) and is off by 1-08 4.6.
- Ensemble: Q196 Group Enters (181.26). All ten come on from the four side wings into a semicircle of radius 2.4 m
  behind him (the cue says "the ensemble ring enters around him"). They do one arc-step sway and back (**invented**),
  and leave on Q198 (196.48).
- To check: does George enter from UC or from a wing, and does the ensemble at the end come from upstage or the sides?

## 1-08 Right Hand Man (PARTLY SOURCED; the battle and night march are invented)

- Top (Q202.01 "DR bax up"): the company in two rows across mid-stage, marching forward a step. Burr narrates DL. The
  spy (ens1) is DR with a redcoat (ens5) behind her. On Q204 "Kill DR" (22.22) she is killed. Both go off DSR.
  ens1 keeps the label "Ensemble 1" (the spy is not a named part). Sourced: the spy death after You'll Be Back.
  The DR place is inferred from the cue name. **Check** whether the DR pair in photo 204 really is the spy.
- Q206 (28.06): Hamilton out to DSC for his verse; the company presses forward on the build.
- Q274 (53.58, "Here Comes The General"): the company splits into two files either side of a centre lane. Washington
  comes from the door down the lane to DC, with a two-man file (ens2, ens3) behind him. Burr announces from DL, then
  leaves at 72. The lane is from the cue ("Washington and his file of soldiers in the blue-white centre lane"). Who
  the file is, is invented.
- Q278 (77.58): Washington's verse DC, the whole company in a block SR (the cue's photo 278 says "the company peeled to
  SR"). A flinch at the cannon (101.22) is invented.
- Q279.5 chorus 2: the company floods back in two rows behind him.
- Q280–282.5 battle (**invented**): the company scatters across the deck and Hamilton is at centre "at the guns".
  Washington commands from UR. Each cannon boom makes the bodies on that side recoil. Then the retreat runs upstage
  and off.
- Q283 (162.95): Washington alone DC (from the cue).
- Q283.5 night march (**invented** direction): the twelve soldiers file across upstage at z −1.8 from the SL wing to
  the SR wing.
- Tent (Q284 177.18 onward): Washington at an imagined desk near centre (−0.4, 1.4). Burr enters from SR. Hamilton
  enters DL of the desk on Q284.5 (202.30). Burr is sent out SR on Q285 (212.74). The two men then draw together,
  and Hamilton steps out DSC on his acceptance (Q286). The desk's real place and whether furniture rolls on are
  unknown.
- Q288 finale (300.46): the company (13) in an arc on the outer ring behind the two men DC. Q288.5 the company
  recedes and leaves. The two men are off in the blackout after Q289.5.

## 1-09 A Winter's Ball (PARTLY SOURCED)

- Burr DSC narration (Q290). He steps DR as the desk lights (Q290.5), comes back to DSC for his aside (Q291.5), and
  is DR for the ball. Washington at the desk with Hamilton at his right hand, i.e. on the SR side (Q290.5 "Hamilton at
  Washington's right hand"). Washington leaves when the men take over (Q291). Laurens, Lafayette, Mulligan and the
  five ensemble men gather round Hamilton (**invented** shape).
- Q292 (48.36) the ball: the five ensemble women enter, and five couples stand on the upstage half of the
  turntables (man r 1.6, woman r 2.2).
- Q292.5 (52.32): Angelica and Peggy enter from the door into the centre pool. Eliza is in her own pool far SL (both
  from the cue).
- From the fan write-up: Angelica sees Hamilton and crosses on the diagonal toward him with Lafayette at her side.
  Hamilton pushes Lafayette aside, kisses her hand, circles her and goes back to Burr. I put Hamilton and Burr DR,
  because Helpless opens with the men SR (Q300.3). The write-up says the men exit SL there, so it conflicts with the
  cue. I followed the cue.
- Q293 (63.84): the turntable starts. The couples begin walking counterclockwise, and Angelica goes back to her
  sisters SL.

## 1-10 Helpless (SOURCED in outline; positions invented)

- Turning: the couples make one full counterclockwise turn from Q293 to the ball memory (28.24) and another in chorus
  2 (60.64–84.5). Blankenbuehler: "all of Helpless goes counterclockwise". They end each turn on the upstage half, so
  Eliza's DSC and the three DC stay clear.
- Eliza spirals out from SL to DSC for her first chorus (Q300.4). The sisters' triangle at centre (ball memory) is
  from the fan write-up: Angelica in the middle, Eliza and Peggy either side. Then Angelica partners Washington, and
  Mulligan sweeps Peggy away; later Laurens takes Peggy (also from the write-up).
- Q300.8 (35.55) Hamilton walks in UL from the SL upstage wing. Washington goes to shake his hand (the write-up) on the
  open SL side. Eliza pulls Angelica downstage as he passes (the write-up). Hamilton then waits "on the steps", i.e. at
  the foot of the SL stair (2.7, −1.9).
- Q301.2 Angelica crosses to him there. Q301.6 she brings him round the outside of the ring to Eliza: the three DC
  (both from the write-up and the cue).
- Q301.8 the letters: the ensemble leaves. Hamilton DR, Eliza DL ("two pools apart"). Peggy brings the letters,
  Angelica snatches them, Eliza takes them back, and Peggy turns out (the write-up).
- ens4 goes off at 113 and comes back as **Philip Schuyler** (the label changes at an offstage waypoint).
- Q302 (115.09): Hamilton and Schuyler on the SR side of the inner disc, the three sisters on a bench on the SL side.
  The disc turns counterclockwise about 36°. Eliza runs to him and they swirl at centre (the write-up). Schuyler steps
  away upstage and turns back on Q302.5 (the father crosses, her panic), then shakes Hamilton's hand on Q303. The two
  share a drink SR while the three sisters are upstage on Q304 (the cue: "the three upstage"). The sisters come down
  to centre for the climax.
- Q306 Hamilton's verse: the couple in one pool DC, the others gone. On Q310 he spins her round (the write-up).
- Q312–Q322 the wedding (the write-up's processional order):
  - The five ensemble women bring the signed letters in a line.
  - Laurens pulls Hamilton DR to Washington for a pep talk, and the bride goes SL to her sisters (box and veil).
  - The guests dance on the ring, counterclockwise, then form an aisle.
  - The processional comes down the centre lane: Angelica + Laurens, then Peggy + Lafayette, then Mulligan with the
    petals (the write-up names "Hercules", Okieriete Onaodowan's Mulligan role), then Eliza on Schuyler's arm.
  - Schuyler hands her to Hamilton DC; the kiss is on the final chord. Washington stands downstage SR of the couple
    as the officiant (**invented**).

## 1-11 Satisfied (SOURCED in outline; positions invented)

- Reception (Q324–Q332): Laurens sweeps round the room and ens2 carries the tray round first (the write-up: "a soldier
  … brings in a tray"). The company (14) is in a semicircle on the outer ring across the back (the write-up). Angelica
  is DC with Peggy and Laurens beside her, and the couple has moved DL (the write-up).
- The rewind (Q366.2–366.8, 46.74–57.62): the semicircle walks CLOCKWISE 45° (Blankenbuehler; The Odyssey). The couple
  walks backward from DL to centre, holds a beat (the kiss reversed), and turns out. Hamilton goes into the UL pool,
  Eliza to SR and off. Angelica takes one step back. The write-up's backward lifts of the women can't be shown.
- Q368 the outside pools go. The ensemble re-forms as the ball, couples on small radii (r 1.3/1.9), and turns
  counterclockwise as silhouettes (Q369). Burr DR, Schuyler and Washington upstage SR, Mulligan SL, and Lafayette
  near Angelica.
- Q370 (79.77): first sight, Hamilton in the UL pool (cue). He comes down, pushes Lafayette aside and meets her DC
  (Q371, nose to nose), then counters round her to Burr DR (the write-up).
- Q372 Angelica's rap: the ball starts again, couples counterclockwise. Eliza and Peggy do the double twirl with her
  (the write-up), and Washington dances with her (the write-up).
- Hamilton is back at the SL stair foot. Washington reaches to shake his hand (the first-sight tableau, from the
  write-up). Eliza is in the UL pool on Q373 (cue).
- Q374 freeze. Count 1. Angelica fetches Hamilton from the steps and leads him to Eliza (Q376 "Eliza and Hamilton in
  the UL pool").
- Count 2 (Q377): Hamilton in a spotlight, the men line up with him and turn him to face Eliza (the write-up).
- Q380 letters revisited (the women hold letters upstage; Eliza and Peggy meet Angelica). Q381 night fantasy:
  Hamilton DR, Eliza in the opposite upstage corner (the write-up). Eliza puts the letters in Peggy's box.
- Q383 (266.10) rewind forward: the company walks back on and turns COUNTERCLOCKWISE into the semicircle. On Q384 the
  toast resumes. Washington's pep talk with Hamilton, the tray man's loop round Angelica, and Eliza's kiss on
  Angelica's cheek, then the couple's kiss at centre (all from the write-up).
- Q387: the company falls away. Eliza goes to Angelica, then off DSR. Hamilton walks past, stops in front of Angelica,
  looks at her, and follows Eliza off (the write-up). Angelica stays alone DC until Q388, then leaves SL in the dark.
- Angelica's DC spot in Satisfied is (0, 3.6), a touch below DC, so the ensemble's turning rings stay clear of her.

## Known rough edges (for the reviewer)

- From my spacing check, pairs under 0.45 m for more than 1.5 s:
  - Right Hand Man finale exit, 1-08 ≈ 315–318: neighbouring arc members converge on the same wing. This happens in
    the blackout fade.
  - Satisfied 1-11 ≈ 262: re-entry from the same wing.
  - Helpless 1-10 ≈ 227: Laurens walks round the outside past the dancing couples.
  - Satisfied 1-11 ≈ 222: Laurens and ens5 leave by the same wing.
  - 1-09 48: Angelica and Peggy enter through the same door together.
  - Eliza and Schuyler (0.6 m, arm in arm) and the kiss pairs are close on purpose.
- Nobody rides the turntable with the disc truly turning except where I walked them round. A reviewer may want more
  revolve in Right Hand Man (Blankenbuehler built the show to rotate), which I did not source.
- The two transitions with walking in the dark: the King leaves SL after his button, which overlaps the first seconds
  of Right Hand Man. Burr walks on from DSR during Right Hand Man's button, to be DSC for A Winter's Ball at 0.4.
- Open questions, in priority order:
  1. Read the TDF event narrative (above) for all five numbers.
  2. Right Hand Man's battle and night march as filmed.
  3. Where Washington's desk stands.
  4. Whether Winter's Ball's men exit SL (the write-up) or stay SR (the cue).
  5. Where exactly Hamilton stands for the first sight (the write-up says "on the steps"; the cues say UL).


## Review (seg 2 reviewer, 2026-10-12)

Method: I fixed the file by editing `gen_seg2.py` and re-running it (the writer's original generator and JSON are kept
in `review/seg2/gen_seg2.orig.py` and `seg2.orig.json`). The strongest new evidence was not on the web. It was in the
repo: `assets/hamilton-eos.json` holds Binkley's real presets with their focus points converted to set-local metres.
Those are the places his specials were aimed, by name. I also checked every actor against the specials the page
actually lights (`pools/`, script `review/seg2/tools/inpools.py`). I added a leg-through-obstacle check
(`review/seg2/tools/obst.py`) and a spacing check that ignores bodies already in the wings (`tools/sim_vis.py`).

Web sources consulted:
- TDF event narrative PDF (downloaded to `review/seg2/src/tdf.pdf`, text in `tdf.txt`). It is an 11-page social story
  for an autism-friendly performance: venue, restrooms, clapping, the song list. **No staging at all**, so it is a
  dead end.
- Fan staging notes, Act I: https://ironinkpen.tumblr.com/post/136570471307/neat-little-hamilton-staging-things-act-i
  The relevant points: the King is alone and walks right up to the front, and the others come on only at his call.
  In Right Hand Man, dancers surround Washington at the start and most of them leave over the number (desertion), a
  desk stands on "the left side of the stage", and Washington offers Hamilton a quill. In A Winter's Ball, Hamilton
  kisses Angelica's hand centre. In Helpless, Hamilton and Schuyler stand on the turntable with their backs to the
  house.
- Fan staging write-up of Helpless and Satisfied (the writer's source, re-read for exact directions):
  https://hamilton-lyrics.tumblr.com/post/139127842879/helpless-and-satisfied-staging . For Helpless, the light strip
  runs from the upper stage left corner to downstage right, where Eliza stands. For Satisfied, Hamilton is frozen
  downstage right, about to come and greet her.
- Odyssey on the spy: https://www.theodysseyonline.com/piece-foreshadowing-hamilton-misses (no stage position).
- Christopher Jackson (CinemaBlend summary): just before Right Hand Man he takes his sword from a hook in a moment
  filmed from upstage looking downstage. This is consistent with Washington entering from upstage.
  https://www.cinemablend.com/news/2549885/hamilton-star-christopher-jackson-reveals-personal-moment-in-the-disney-film-that-surprised-him
- WhatsOnStage, CinemaBlend and Theatre Haus on the Ye Olde Bard side-by-side video confirm that the numbers mirror,
  but none gives positions.
- BroadwayWorld interview with Blankenbuehler: the show rotates counterclockwise continuously. This confirms the
  writer's direction convention.

Real Binkley data used (preset -> focus, set-local x, z):
- Q194 "George DC", part 10: ch 93 at (0.0, 4.2). Q192: George's UC special at (-0.1, -2.4).
- Q204 "Kill DR": preset 224 "Kill 1", X4s at x -1.2 ... -2.3, z 2.4 ... 3.7.
- Q274 "Here comes the General": preset 250 "path 1" is a lane at x about -0.6 from z -1.4 to 3.6. Preset 259
  "Ham dsc" at (-1.2, 3.7) is lit at 54%. Q274.01: lane at x 0. Q278 "Path up": preset 284, the centre path x 0,
  z -1.1 ... 3.5.
- Q300.3 "Helpless" has a part labelled **"Sister DR out"**: a sister is in a DR pool at the top of Helpless.
- Q366.01 has a part labelled **"pools DR UL"**: preset 325 "3 pools", ch 12 at (-3.2, 3.0) and ch 14 at (3.7, -1.0).
- Preset 766 "AH Burr DR": (-3.2, 3.2) and (-2.3, 4.1). This agrees with the writer's Hamilton and Burr DR in A
  Winter's Ball.

### 1-07 You'll Be Back
- Checked against: the fan notes (the King alone, walks to the front), Q190.01/Q192 (UC) and Q194 ch 93.
- Wrong: his DC spot was at z 3.4, and Binkley's DC special lands at z 4.2. Also, his exit SL ran 206.8 -> 1-08 4.6,
  head-on with Burr walking in from the same wing (W-DSL) at 1-08 3.0.
- Changed: every DC stop moved downstage by about 0.7 m (base 4.1, threats 4.6 and 4.7). The ensemble semicircle was
  re-centred on him. He holds through the button and leaves brisk (1.8 m/s) in the Q202 transition, off at 1-08 2.0,
  before Burr starts.
- Not verified, left as is: the D-UC entrance, and the ensemble entering from the four side wings.

### 1-08 Right Hand Man
- Checked against: the fan notes (dancers desert Washington; a desk on one side), the Odyssey (the spy is the Bullet's
  track), and the real Q204/Q274/Q278 presets.
- Wrong: the spy and the redcoat were at x -3.4 ... -4.0, about 1.5 m outside Binkley's "Kill 1" pools. Hamilton's
  verse spot was (0, 4.4), but the real "Ham dsc" (-1.2, 3.7) is lit when the General arrives, and the writer had moved
  Hamilton into the SL file. Washington and Hamilton walked off before the button: no dwell, so they left at about 316
  while the Q289 specials snapped onto them. Burr walked across in front of them during the button. The finale's
  neighbours converged on the same wing.
- Changed: the spy is at (-2.1, 3.65) -> (-2.0, 3.7), with the redcoat (ens5) behind her at (-2.9, 3.0) ->
  (-2.3, 3.2). Hamilton holds at (-1.2, 3.7) from his verse until the General has arrived beside him, then joins the
  SR block on Q278. Washington now ends his lane walk at (-0.2, 3.0). The two men hold in the DC specials until the
  318.94 blackout (dwell), then leave SR in the dark. Burr walks on from SL after the blackout and is DSC at 1-09 1.6
  rather than 0.4. The finale company goes to the wing nearest each body (DSR, MSR, USR, D-UC, USL, MSL, DSL by clock
  position). Washington's file men stop clear of the lane rows.
- Not verified, left as is (invented): the battle, the cannon recoils, the night march and the tent geometry. No
  written or pictorial source for the filmed battle was found. The fan note's "most of them go off over the number"
  agrees with the writer's retreat off at 158 and Washington alone at 163. The desk: the fan note says "left side of
  the stage" without saying whose left, and Binkley's "Desk" presets (615, 730, 947) cannot be tied to this scene. So I
  left the writer's near-centre desk.

### 1-09 A Winter's Ball
- Checked against: the fan write-up and the real presets 766/402.
- Changed: Angelica and Peggy now come through the door side by side (x 0.7 and 1.25), not from one point. Burr is
  late by 1.2 s (above). Washington and Hamilton now leave RHM to W-MSR/W-DSR and re-enter as before.
- Open conflict, writer's choice kept: the write-up has the men walk off **stage left** at the end. The Q300.3 photo
  description ("sisters SL, men SR") and the real part "Sister DR out" (a sister still DR at the top of Helpless) both
  put the action SR, so the men stay SR. A human should check this against the film.

### 1-10 Helpless
- Checked against: the fan write-up and Q300.3/Q302.
- Wrong: Angelica ran from DR to SL straight through the dancing couples at the top. Eliza was DSC at the first sight;
  the write-up puts her DR, at the end of the light strip from his UL. Hamilton's "on the steps" was 0.5 m downstage
  of the stair. Laurens, Angelica and Peggy cut through the r 2.6 dancing ring on their way to the processional.
- Changed: Angelica holds DR until 1-10 2.5 (Sister DR out), goes round the downstage edge of the ring, and joins
  Peggy SL at 9.5. Eliza goes to (-2.3, 3.9) at 35.0, then pulls Angelica down. Hamilton perches on the SL stair's
  lowest treads, (2.45, -2.45) with `y: "top"`, at 47 and 85. The wedding party now goes round outside the ring by
  way of (-2.4, -2.35), (1.8, -2.25) and (1.6, -2.6).
- Not verified: the Two Weeks geometry. Binkley's Q302 lights two specials at (-3.5, 4.0) and (2.9, 2.1), which the
  writer's turntable scene does not use. Someone may be meant DR there, perhaps Eliza singing out; I could not
  establish who.

### 1-11 Satisfied
- Checked against: the fan write-up and the real Q366.01 "pools DR UL".
- Wrong: the rewind ended with Hamilton in the UL pool and Eliza SR, the reverse of the evidence. The real cue's two
  outside pools are DR (-3.2, 3.0) and UL (3.7, -1.0), and the write-up has Hamilton frozen downstage right for the
  replayed ball. The couple's backward walk from DL crossed their paths (0.2 m). The tray man's toast-replay loop ran
  straight through Angelica at 280-285 (0.2 m). Washington's return from the pep talk crossed the centre kiss.
- Changed: the couple's DL spot is Hamilton (2.4, 3.9) and Eliza (3.0, 3.4), here and on the return. The rewind kiss
  is at centre with Hamilton on the SR side. Hamilton then goes to the DR pool and Eliza to the UL pool, and Eliza slips
  off SL on Q368. Peggy goes off DSR, and Burr waits beside the DR pool at (-4.0, 3.9). On Q370 Hamilton walks up from
  DR round her downstage side and pushes Lafayette aside on her SL side. Afterwards he returns to Burr at (-2.9, 3.5).
  On the steps he is again on the lowest treads. The pep talk moved to (1.9, 2.4) and (2.6, 2.65), clear of Eliza's
  DL spot. The tray man (ens2) now swirls counterclockwise right round Angelica, outside Peggy and Laurens
  (271.5-278.3). Washington holds the pep talk until 281, then goes back round upstage of the kiss.
- Not done: the write-up's reverse loop of the tray man during the rewind. The centre is full of the couple's backward
  walk then; it can be added by hand. **Lighting note for the cue team:** the reconstructed Q369/Q370 relight the UL
  pool for Hamilton's first sight. Under this blocking the pool should be the DR one, preset 325 ch 12 (-3.2, 3.0).

### All tracks: mechanics
80 deck legs ran straight through the SR stair's footprint, the SL stair or a proscenium post. Almost all were
entrances and exits to W-MSR, which the SR stair blocks from most of the stage. Each now has a walk-through detour
point round the obstacle, timed so the arrival is unchanged (`detour_all()` in the generator).

After the fixes: `blocking-merge --check` gives 0 errors and 0 warnings, 1,330 waypoints. No leg is over 2.6 m/s
except Angelica's walk off in the final blackout (2.5 m/s). Visible pairs under 0.45 m for 0.7 s or more:
- the couples meeting in the ball, 1-11 64 (partners);
- the handshake, 1-10 43.5;
- Laurens passing Hamilton as the men drift DR, 1-09 49;
- the women regrouping upstage, 1-11 184 and 239;
- the men's line breaking up round Hamilton, 1-11 215-218.


## Spotlights (seg 2 spotlight agent, 2026-10-12)

### Method
- **The checker.** `spot/seg2/check2b.py` walks every cue of 1-07 … 1-11 in `pools/`. It poses every actor with the plotter's own `pose()` at three moments in each hold: GO + 0.7 s, the middle, and until − 0.2 s. For each unit it lists who stands within hitR + 0.3 m at the same level.
- **Which units it counts.**
  - Every `special`.
  - Every `wash` with zoom ≤ 18.5°, marked `K` in the output. The dump calls these washes, but they are person lights: ch93, ch13, ch25/26, ch1/2/4/5 and the X4s 42/56.
- **Which units it drops.** These are lattices, not person lights:
  - the overhead Viper grid (ch6–11, 15–20) when six or more are lit;
  - the X4 ring (ch47–64) when eight or more are lit;
  - the birdies;
  - gallery pins with nobody in them.
- **Outputs.** `spot/seg2/outb0.txt` is before the pass and `outb1.txt` after. Real preset foci came from the worktree's `assets/hamilton-eos.json`.
- **The fixes.** They are in `gen_seg2.py`, applied by `spot/seg2/patch_spot.py`, and each edit is marked `SPOT`. The copies from before this pass are `spot/seg2/gen_seg2.pre-spot.py`, `seg2.pre-spot.json` and `seg2-notes.pre-spot.txt`.
- **Result.**
  - 1,401 waypoints. Merge check: 0 errors, 0 warnings.
  - `review/seg2/tools/sim_vis.py`: no leg is faster than 2.6 m/s.
  - New close passes, all 0.5–1.3 s: Angelica with Lafayette (1-09 56.5, "at her side"); the couple walking DL together (1-11 3.8); Hamilton passing the turning couples on his way to the steps (1-11 145–147).
  - Moment plots `spot/seg2/<track>_<t>.png` were re-run for every changed moment.

### 1-07 You'll Be Back: nothing moved
- **Where the King is lit.**
  - ch93 UC (0, −2.6) in Q192/193: 0.3 m.
  - ch93 DC (0, 4.27) through Q194 … Q198: 0.2–0.7 m.
  - At the button he is in the X4 ring's 49/50.
- **Lit with nobody in them, left as cue notes:**
  - **Q190.01: ch2/ch4 (±1.3, 4.1) and ch25/26 (±1.5, 5.0).** The photo's "two side pools" (preset 203, 'Kings men DS') are empty pools in the photo description.
  - **Q194–Q198: ch13 lands at (0, −0.13).** This is preset 22's focus. The cue's ref list also names preset 222 'King DSC', which puts ch13 at (0.03, 4.95), on the King.
  - **Q200 BUTTON: ch12/13/14 snap to full at (−1.45, −0.93), (0, −0.13), (1.45, −0.93).** The cue says "snap to George in white". Preset 222 puts all three at about (0, 5.0).

  The cue team should check which preset wins for ch12–14 in 194/200. With preset 222 the King should stand a step further down, at about z 4.6–5.0.

### 1-08 Right Hand Man
Moved:
- **Washington, Q274.01/276** (the MIDI hit, the chorus): (−0.2, 3.0) → (−0.1, 3.5). He is now in the DSC X4s ch45 (−0.1, 4.05) at 0.5 m and ch42 at 0.6 m. Before, he was 1.1 m out.
- **Washington alone, Q283**: (0, 3.4) → (0, 2.45). The white shaft ch93 lands at (0, 2.37), r 0.75. He was at 1.0 m and is now at 0.1 m.
- **Night march, Q283.5**: the file line moves from z −1.8 to z −0.45. The soldiers now walk through the four blue VL3500 shafts ch72–75 at z −0.41. Before, the shafts lit nobody.
- **The tent, Q285 and Q285.5** ("the two specials tighten").
  - Washington's places at 226 and 251: (−0.4, 2.6) and (0.1, 3.0) → (−0.3, 1.75) and (0.15, 1.8). He is now in the desk shaft VL ch74 (−0.06, 1.14) at 0.7 m and in the desk pool ch13. Before, he was 1.5–1.9 m out.
  - Hamilton's places: (1.1, 2.6) and (0.95, 2.4), in his pool ch4 (1.37, 2.33) at 0.4 m.
- **The duet, Q286–Q287.5.** The two keys are ch4 (1.37, 2.33) and ch2 (−1.78, 2.54). Before, both were empty: Hamilton went DSC (0.4, 4.2).
  - Hamilton now steps out to (1.25, 2.85), then (1.25, 2.6), in ch4 at 0.3–0.5 m.
  - Washington takes the chorus at (−1.6, 2.75), in ch2 at 0.3 m.
- **Finale, Q288.5/Q289** ("the two men DC caught in white"): the men move from (±0.4, 3.4) to (∓0.47, 2.52). Washington is in ch12 and Hamilton in ch14, both at 0.0 m. Both are in ch93 at 0.5 m. Before, they were at 0.9–1.1 m.

Confirmed:
- The spy (ens1) and redcoat (ens5) are in Q204.01's Kill-1 X4 washes.
- Hamilton is in "Ham dsc" ch44 at 0.2 m from Q206 to Q276.
- Burr is in ch2 at 0.3 m and Washington in ch74 at 0.4 m in Q284/284.5.

Cue notes:
- X4 ch41/42/43 stop at about (−1.3 … −4, y 5.5, z 8.4), out in the house near their own lens. They never reach the deck: the ch43 in "Ham DSC" (Q206) and the "X4 43" key in Q194.2 are dark on the floor. This is a rig or engine collision to look at.
- Q204's own Kill-1 X4s hold for only 0.35 s (204/204.01 GO together, and 204.02 drops them).

### 1-09 A Winter's Ball
Moved:
- **Burr's DSC narration (Q290) and aside (Q291.5)**: (0, 4.4/4.3) → (0, 3.0). The near-vertical shaft ch93 lands at (0, 2.99). Before, it had nobody in it. Now he is in it at 0.0 m.
- **Angelica and Peggy, Q292.5**: they enter to (∓0.4, 1.6), in the sisters' centre pool ch13 (−0.04, 1.84) at 0.4–0.5 m. Before, they were at (∓0.4, 0.5), 1.4 m out.
- **Eliza**: (3.5, 1.4) → (3.1, 1.8), in her far-SL pool ch14 (3.05, 1.89) at 0.1 m.

Confirmed: Lafayette at her side (0.9 m).

Left: ch13 in Q293 lights only Lafayette after Angelica crosses to Hamilton. That cross is in the write-up, and the pool tracks on from 292.5.

### 1-10 Helpless
Moved:
- **Eliza's chorus spot (Q300.4, and again for chorus 2)**: (0, 4.4) → (0.1, 3.75). The "DSC" key ch13 lands at (0.1, 2.9), r 1.06. She is now at 0.9 m; before, she was 1.5 m out. She is still 0.6 m downstage of the dancing ring as it passes 6 o'clock.
- **The meeting, Q301.6** ("the three held in cool-white specials DC"). The three specials are ch12 (−0.78, 2.31), ch13 (0, 1.97) and ch14 (0.78, 2.31). Before, the three stood at z 3.0–3.8 and only Angelica touched one.
  - Eliza now stands in ch12 at 0.0 m, Hamilton in ch13 at 0.0 m (Angelica brings him to her) and Angelica in ch14 at 0.0 m.
  - They come round downstage of the parked couples.
  - For the letters, Hamilton goes round upstage of Eliza to DR, and Eliza goes round downstage of Angelica to DL, so nobody crosses.
- **Two weeks, Q302 → Q303** (the reviewer's open question). Binkley's real Q302 brings up two units in part 3, with a 5 s delay and a 4 s fade, so they are full from about 124: ch25 at (−3.51, 4.01) and ch26 at (2.86, 2.10). In the dump they are wide-ish keys, ch25 r 1.71 and ch26 r 1.47. The reconstructed 301.8 already uses them for the letters: Hamilton DR, Eliza SL. Continuing that:
  - **ch25 DR is Hamilton and Philip Schuyler's talk.** They stand on the outer ring's DR edge, r 3.5 at 7.5–8 o'clock, 1.4–1.8 m from the pool's centre. That keeps the fan note "on the turntable, backs to the house".
  - **ch26 is the sisters' bench** on the outer ring SL, r 3.2 at 3–4.5 o'clock, 0.3–1.2 m from its centre.
  - The ring turns counterclockwise half an hour under both groups (117–124).
  - Schuyler now enters from W-DSR at 113, and the label change is offstage as before.
  - Eliza runs across (a 5 m run, about 2 m/s) and the couple swirls inside ch25. The sisters stay on the bench in ch26.
  - Schuyler steps away upstage to (−3.5, 1.5), out of the pool. On Q302.5 he crosses back into it. The Q303 handshake is in it: Hamilton at 1.6 m and Schuyler at 1.7 m.
  - Before this, ch25 had nobody in it after 116 and ch26 had nobody after the middle of Q302.
- **His verse, Q306/Q308/Q310**: the couple moves from z 3.3–3.4 to (0.4, 2.45) and (−0.4, 2.55). The DC pool ch13 lands at (0, 2.28). For Q308 the special is r 0.85: Hamilton is at 0.4 m now, 1.1 m before. The spin was shifted 0.8 m upstage, and it ends in Q312's keys: Hamilton in ch12 at 0.1 m, Eliza in ch14 at 0.2 m.
- **Q320 handover** ("the stage gathers onto the couple DC"). Before, Hamilton was not in either key and was waiting at (0.35, 3.8). Now he steps up to (0.45, 2.45), in ch14 at 0.1 m. Eliza is at (−0.35, 2.4), in ch12 at 0.1 m. Schuyler is at (−1.1, 2.0).

Cue notes (left):
- **Q301.2 "Angelica crosses"**: two pools at (±2.23, 1.69) "on the turntable circle". The write-up has Hamilton waiting on the SL stair's steps and Angelica crossing to him there. The SL pool lands on a parked dancing couple (ens1/ens10), and the SR pool lights nobody. A reconstruction; re-aim one pool to the stair foot (about (2.4, −2.2)), or drop them.
- **Q314–Q318**: ch12/ch14 (∓0.47, 2.31) stay at 0.7 while the couple is apart (the pep talk DR, the bride SL). They light passers-by only.

### 1-11 Satisfied
Moved:
- **Angelica's place for the freeze and the three counts.**
  - Q374 is "alone DC in two warm X4 specials ON her": X4 48/51 at (∓0.13, 2.22), r 0.83.
  - Q375/Q377/Q379 put the white shaft ch93 at (0, 2.27), r 0.70.
  - Q381/Q382 are "only her own X4 specials", the same 48/51.
  - She was at (0, 3.6), 1.35 m out. Four ensemble bodies stood in her shaft instead: ens3/5/7/9, couples parked at 5–7 o'clock.

  Now:
  - She walks up to (0, 2.25) at 173.8 and returns there after fetching Hamilton (203.5) and after the confession (242). She is in 48/51 at 0.1 m and in ch93 at 0.0 m.
  - Her route to and from the steps goes round the frozen men.
  - The ball couples in her rap now make a full counterclockwise turn (130.4–158.5), at 0.43 m/s for the outer partner, instead of three and a half hours. They park on the upstage half, clear of her DC specials.
  - Her rewind step back ends at the centre (0, 2.25), not (0, 2.6). This follows the photo descriptions: Q366.01 "Angelica centre" and Q368 "held centre".
  - She goes back down to her toast spot (0, 3.6) at 269.6, after Peggy passes.
  - For the rewind forward, Hamilton's centre point moves to (0, 1.4), upstage of her.
  - At 238 Eliza stands at (1.0, 2.95), 0.67 m from Angelica.
- **Kept**: the toast, the conversation and the last lines at (0, 3.3–3.6). Those cues use Binkley's real preset 283 'Ang Center Down' (ch12/13/14 at about (0, 0.9–1.7), zoom about 27°). These are washes, and she is inside ch12's pool there at 1.5–1.9 m. Binkley's own focus puts "centre down" at the turntable centre, about (0, 1.2). If the toast should match it exactly, Angelica, Peggy and Laurens and the tray man's loop would all need to move up about 1 m. I did not do that, because the toast replay's choreography is built round (0, 3.6).

**Cues to mirror or re-aim (the cue team's):**
- **Q369 (71.64) and Q370 (79.77, "First sight of Hamilton").** Both light the UL pool, ch14 at (3.81, −1.02) (preset 325 ch14). The blocking and the write-up have Hamilton frozen in the DR pool, (−3.2, 3.0), from 57.5 to 91. **Mirror both to preset 325 channel 12, at (−3.21, 3.04).** In 369 the UL pool lights nobody; in 370 it should be the DR pool on Hamilton.
- **Q384, Q385, Q386 and Q387.** They hold ch14 (the UL pool) at 0.9–1.0 with nobody in it: only Lafayette and ens10 at its edge in the semicircle. Q387 is "Angelica isolated DC in white". Drop ch14 from these four.
- **Q366.01–Q370: X4 48/51.** In the dump they land at (∓2.74, 1.65): preset 25's focus, two pools nobody stands in. Binkley's preset 325 '3 pools' has them at the centre, (0.38, 0.90) and (0.08, 0.97): Angelica's "isolated special" of photo 368.01. Check which preset should win.
- **Q366.01 (real), 42.56.** Its DR and UL pools come up in 3 s while the couple is still DL. In the real show this cue holds through the whole rewind until Q368, so the couple's arrival in the pools at the end of the rewind is right. Only the reconstructed split (366.2 dark, 366.8 back) shows the 4 s of empty pools at the top. Left.

Confirmed:
- Eliza is in the UL pool for Q373–Q378 (0.7 m) and Hamilton joins her for Q376 (1.0 m).
- Hamilton is in the DR pool at 0.2 m for Q366.8.

Left:
- Hamilton "on the steps" in Q372 is 2 m from the UL pool that the reconstruction lights during the rap. This follows the write-up; he reaches the pool for Q376.
- The VL3500 fans (Q288 in 1-08, Q386 here) are beams over the company, so they were not treated as person specials.



## Review 2 (Jack's verdict)

Jack said the ensemble is used too much and much of the choreography is wrong. The rule for this round: the ensemble is
off unless evidence puts it on. Where there is no evidence, I chose the simplest staging. I edited the generator,
`gen_seg2.py`. The copy from before this pass is `scratchpad/act/review2/seg2/gen_seg2.pre-r2.py`, with
`seg2.pre-r2.json`. The props are in `props.py` SEGMENT_2.

### Evidence used
- **ETC "THPP – Cue Photos.pdf"** (Jack's Downloads), pages 6–26.
  - **What they are:** Augment3d renders of Binkley's REAL cue states, with mannequins standing where the cue needs
    bodies. The pages I used are labelled 190.01, 192, 193, 194, 196, 198, 200, 202, 202.01, 204, 204.01, 204.02, 274,
    274.01, 278, 300.3, 302, 304, 366.01, 368 and 368.01.
  - **Orientation:** the camera is in the house, so STAGE RIGHT IS ON THE LEFT of the picture. I checked this three ways:
    the SR stair runs upstage on the left, the SL stair climbs to the right, and in 366.01 the near pool is the DR one.
  - **What counts:** ETC keeps a stock set of figures on the galleries and the SR stair in every cue, so I ignored
    those. Only deck figures that change from cue to cue count as evidence.
  - The rendered pages are in `scratchpad/act/review2/seg2/pdf/`.
- **Fan write-up of Helpless and Satisfied**, re-read in full this pass:
  https://hamilton-lyrics.tumblr.com/post/139127842879/helpless-and-satisfied-staging . New from it this pass:
  - In Two Weeks, Philip Schuyler sits in a chair on the turntable, and the sisters sit on a bench on the opposite side.
  - At the end of A Winter's Ball, the men exit stage left.
  - The ensemble women bring papers for Hamilton to sign.
  - In Satisfied the ensemble stands in a semicircle at the back.
  - In Satisfied a line of men turns Hamilton to face Eliza.
- **Fan notes, Act I:** https://ironinkpen.tumblr.com/post/136570471307/neat-little-hamilton-staging-things-act-i
  - The King is alone until he calls the others on.
  - In Right Hand Man there is a desk, and Washington sits at it or stands by it.
  - The soldiers leave Washington gradually (desertion).
  - Hamilton and Philip Schuyler stand upstage on the turntable, facing away from the house.
- I searched for a beat-by-beat account of Right Hand Man (the battle, the night march, the finale) and found nothing.

### 1-07 You'll Be Back — ensemble 10 → 8 (on for 12 s, Q196 → Q198)
- **The evidence:** photo 196 (a top-down render) shows **eight** figures standing on the X4 ring pools. There are four
  a side, at 8–11 o'clock and 1–4 o'clock, and the downstage side is open for the King. Photo 198 has the King alone
  again.
- **Now:** ens2, ens3, ens6 and ens7 stand SR on ch60, ch59, ch53 and ch47. ens4, ens5, ens8 and ens9 stand SL on ch63,
  ch64, ch58 and ch52. They stand still, facing him.
- **Cut:** the ten-body semicircle behind him and its sway, both invented.
- **King:** unchanged. Photos 192 and 193 have him UC inside the ring; photos 194, 198 and 200 have him DC.
- **Not added:** photo 190.01 has two figures in the DS side pools (preset 203 "Kings men DS") for the first 7 s.
  - Nobody knows who they are; they may be Hamilton and Seabury held over from Farmer Refuted.
  - Adding them would need segment 1 to pre-set them in the 1-06/1-07 blackout.
  - I left them out. This is a question for Jack.

### 1-08 Right Hand Man — ensemble 10 → 8; Laurens, Lafayette and Mulligan out
- **Top (Q202.01–Q204).**
  - Photos 202, 202.01 and 204 show only a figure at the centre of the disc and the pair DR.
  - Now: Hamilton stands at the centre (0, 0.6) from the transition. The spy (ens1) and the redcoat (ens5) are DR as
    before.
  - **Cut:** the two rows of the company marching forward, and the build. Both were invented.
- **Q274.**
  - Photos 274 and 274.01 show Washington at the head of a **single file** standing in the centre lane, with a figure
    DSR of its head. That figure is Hamilton in 'Ham dsc'.
  - Now: Washington and seven ensemble (ens2, 3, 4, 6, 7, 8, 10) walk down from the door in the red climax. They are
    standing in the lane on the snap.
  - **Cut:** the two-man file, and the company splitting to either side of the lane.
- **Q278.**
  - Photo 278 shows Washington in the path DC with Hamilton just SR of him. **Eight** figures stand in a loose block on
    **stage LEFT**.
  - The reconstruction's label said SR. The photo and the page's own Q278 pools both put the block SL.
  - Now: the seven plus ens5 stand in a block SL, and Hamilton stands beside Washington.
- **Battle (Q280–Q282.5) and night march (Q283.5).**
  - No evidence supports the scatter, the cannon recoils, the retreat or the file across upstage. **Cut** all of it.
  - I kept only what the fan note says: the soldiers desert Washington one by one, from 128 to 153, each to the nearest
    SL wing.
  - Hamilton goes off SR at 132. Washington is alone on Q283, in his shaft (unchanged).
- **Tent:** unchanged. The spotlight placements of Washington, Burr and Hamilton are kept. The furniture is listed below.
- **Finale (Q288).**
  - **Cut:** the thirteen-body arc on the ring.
  - The libretto gives the company the last chorus, and the reconstruction calls this "the big company look of the
    stills". I found no picture of it.
  - Simplest staging: the eight stand in one line upstage of the desk (z −1.6) from 302, and leave on the last line
    (Q288.5). **Unverified.**

### 1-09 A Winter's Ball — ensemble 10 → 8, and only from 42 s
- **Cut:** the five ensemble men who stood behind Hamilton in the refrain (invented). Only Laurens, Lafayette and
  Mulligan are round him now.
- **The ball:** four couples (ens2/6, ens3/7, ens5/8, ens10/9) come on at Q292 and stand on the upstage half. There were
  five. They start to turn only on Q293, when the fan write-up says "the turntable begins rotating".
- **Sides flipped (the big correction).**
  - Photo 300.3, Binkley's real top of Helpless, has the three women together **SR** and two men **SL**. The fan
    write-up has the men leave SL.
  - The earlier passes had it the other way round: the sisters SL and the men SR.
  - Now: Burr is DL for the ball, and Hamilton goes back to him DL. Laurens and Mulligan dance off SL.
  - On Q293 the sisters go round the downstage half, where no couple is, to SR.
  - Eliza still enters into her lit pool far SL (ch14, the spotlight placement). She crosses on Q293, at a brisk pace.
- Angelica's diagonal toward Hamilton (Lafayette at her side), the hand-kiss and the circle are now at centre / DL.

### 1-10 Helpless — couples 5 → 4; the Two Weeks scene restaged
- **Top.**
  - Following photo 300.3, the sisters are SR, and Hamilton and Burr are SL and go off at once.
  - **Cut:** Laurens, Mulligan and Lafayette standing SR at the top (invented), and Angelica's cross from DR to SL.
  - Mulligan now enters only to sweep Peggy away, and Laurens only to take her. Both come from the write-up.
- **Couples:** four, down from five. ens1 and ens4 are out. They still turn CCW in the same shape (Blankenbuehler).
- **Two weeks (Q302–Q304), the evidence.**
  - Photo 302: three figures at the downstage edge of the disc with their backs to the house, and two figures upstage SL.
  - Photo 304: the three upstage centre, facing out.
  - Both fan accounts: Schuyler in a chair on the turntable with the sisters on a bench opposite (hamilton-lyrics), and
    the two men upstage on the turntable (ironinkpen).
- **Two weeks, now.**
  - The sisters sit on a **bench** at (0, 3.0), facing upstage.
  - Hamilton and Schuyler face each other upstage on the disc. Schuyler's **chair** is at (2.0, −0.9).
  - Eliza runs up to Hamilton and they swirl at centre. Her father turns away and back, then shakes Hamilton's hand.
  - On Q304 the sisters walk up to the upstage centre spot of photo 304. In the real show the turntable carries the
    bench round; the page cannot turn the disc, so the walk shows the half-turn.
  - The men take their drink SL by the chair.
- **Two weeks, changed from the spotlight pass.** That pass had put this scene in the Q302 viper keys, ch25 DR and
  ch26 SL. The real photo does not, so those two keys now light nobody. This is a cue note for the cue team.
- **Wedding.**
  - Four women bring the papers (there were five).
  - Four couples dance on the ring and make the aisle. There were five, with ens1 spare.
  - The processional is unchanged.
  - Washington had stood DS of the couple with his back to the house, an invented "officiant" place. He now stands at
    the foot of the aisle SR.

### 1-11 Satisfied — semicircle 14 → 10; ball couples 5 → 4
- **Semicircle** (sourced: "the ensemble forms a semicircle along the back").
  - Now: eight ensemble, with Washington and Lafayette.
  - **Cut from it:** Burr, Mulligan, Philip Schuyler (ens4) and ens1. Mulligan and Schuyler leave at the top.
- **Ball replay.**
  - Four couples. Laurens no longer partners ens8; he goes off after the rewind and comes back for the men's line.
  - **Cut:** Washington, Schuyler and Mulligan standing round watching the replay (invented).
  - Washington now leaves after the rewind and comes back from DSR to dance with Angelica (sourced). He then goes round
    outside the turning couples to the handshake at the steps.
  - Burr comes on DR only for the replay. This is sourced: Hamilton goes to talk to Burr.
- **Men's line:** Laurens and four ensemble; Lafayette is dropped. **Letters:** four women (there were five).
- Everything else is unchanged: the rewind, the pools DR / UL, the counts, the fantasy, the rewind forward and the
  ending.

### Furniture (props.py SEGMENT_2)
| prop | where | brought on | taken off |
|---|---|---|---|
| Washington's desk | (−0.35, 0.85), 1-08 tent and 1-09 | ens4, from W-USR, set at 1-08 174.0 (night-march light) | Washington, at 1-09 33.3 → W-USR (unchanged) |
| Chair (Washington, the tent) — NEW | (−0.35, −0.45), behind the desk | ens10, from W-USR, set at 1-08 174.5 | hidden in the Right Hand Man blackout (1-09 0.2) |
| Bench (the sisters) — NEW | (0, 3.0), facing upstage | ens1, from W-DSR, set at 1-10 114.0 as the letters end | Peggy, at 1-10 159.8 → W-DSL, as the room drops to the couple |
| Chair (Philip Schuyler) — NEW | (2.0, −0.9), facing SR | ens4 as Schuyler, from W-MSL, set at 1-10 117.5 | ens4, at 1-10 163.9 → W-MSL |
| Tavern table (for 1-12) | unchanged | Hamilton, at 1-11 328.5 | — |

- The id `washington-chair` was already taken by segment 5's Cabinet Battle chair, so the tent chair is
  `washington-tent-chair`.
- Not modelled: the letters, Peggy's box, the veil, the tray and the glasses. These are hand props.
- The desk's carrier changed: it had been ens9 in the night march, which is now cut.

### Unverified: the simplest staging was chosen
- Who stands at the centre of the disc in 202, 202.01 and 204. I took it to be Hamilton.
- Right Hand Man's finale line, and where Hamilton is during the battle (off).
- The two "King's men" of photo 190.01 (left out).
- The exact position of the Two Weeks pair upstage (photo 302 is a long shot), and whether the bench faces upstage.

### Checks
- **Merge:** `blocking-merge.py <dir with seg2.json + props.json> --check` gives 0 errors and 0 warnings. 1,081
  waypoints, down from 1,401.
- **Props:** `props.py --check segments/seg2.json` passes every segment-2 carry. The set-down distances are: desk 0.65 m,
  tent chair 0.74 m, bench 0.87 m, Schuyler's chair 0.70 m. The strikes are clean. Other segments' warnings in that
  output belong to their own actors, who are not in this file.
- **Speed and spacing:** `review/seg2/tools/sim_vis.py` finds no leg over 2.6 m/s. Every close pass under 0.45 m lasts
  0.5–1.2 s: partners, the swirl, the turning couples.
- **Ensemble load:** ensemble-seconds on stage, from `scratchpad/act/review2/seg2/tools/ensload.py`.

  | track | before | after |
  |---|---|---|
  | 1-07 | 218 | 177 |
  | 1-08 | 1633 | 935 |
  | 1-09 | 298 | 178 |
  | 1-10 | 1561 | 1304 |
  | 1-11 | 2761 | 2249 |
