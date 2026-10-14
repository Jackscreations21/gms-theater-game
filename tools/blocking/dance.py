#!/usr/bin/env python3
"""The Hamilton dance moves (RULING FV): writes segments/dance.json for tools/blocking-merge.py.

    python -I dance.py               # writes segments/dance.json (then run the merge)
    python -I dance.py --check N     # writes it, then merges segments/segN.json + dance.json in a TEMP folder
                                     # (nothing in assets/ is touched) and prints the merge's errors and warnings

A FIRST PASS. Each entry puts a move from the library (tools/hamilton-moves.json; what each one is and where it comes
from: docs/hamilton-dance-moves.md) on some of the company for some counts, from a moment in a song. The moment is a
cue label's time (assets/hamilton-show.json, Binkley's cues and the reconstructions, which name the song's sections)
moved on by whole BARS of the song's beat grid (assets/hamilton-beats.json) and snapped to a downbeat — or a bar and
beat named outright. Which bar a lyric lands on is a reading of the album, not a measurement: every entry says what it
is meant to hit, and Jack's eye (and the editor's Dance button) is the judge.
ROUND 2 (RULING GF): the reviewers' stand-ins swapped for the moves they asked for (each section says which, citing
research/segN.md "Review 3"); `sit` wherever the blocking seats someone on a chair, bench, stool or box prop, from the
first beat after she arrives at it (a bar and beat, not `at=`, which snaps to a downbeat that may come before her) to
when she gets up; the two-body moves' partner (`with_`). A move overrides a sit and the sit does not come back, so a
seated body that does something (a roar, a mic drop) is given `sit` again after it.

A move given to someone who is offstage at that moment is harmless (an unseen body is not posed), so a number's
company is named whole where the sources say "the company" or "the ensemble".

Format written (the merge validates it; docs/hamilton-blocking-format.md):

    { "moves": { "<actor id>": [ { "track", "at", "move", "counts", "mirror"?, "canon"?, "speed"?, "reverse"?,
                                   "with"?, "note"? }, ... ] } }

HOW AN ENTRY IS WRITTEN. One `dict(...)` per entry, in a segment's list:

    who     the actors: a list of ids (tools/hamilton-cast.json), or a group below (FOUR, ENS, SISTERS, EVERYONE,
            SOLDIERS; `ENS[:8]` is ens1..ens8). Each one gets the move.
    track   the album track, '1-01' ... '2-23'.
    WHEN — one of:
      at=<s> [, bars=<n>]   a time in seconds into the track (a cue's time, read off the show file or the page),
                            SNAPPED to the nearest downbeat, then moved on `bars` whole bars (negative = earlier).
      bar=<n> [, beat=<b>]  the downbeat of bar n (or its beat b), both counted from 1 from the track's first
                            downbeat (`firstBeat` in the beats file). Find a bar with beats.py (below).
    move    a name in tools/hamilton-moves.json (the file checks it, and lists every name the library lacks).
    counts  how many beats it lasts: a number, or `until=<s>` in place of counts to run it to that time (whole beats).
    with_   RULING GF, a two-body move: the PARTNER's id (written `with_=`, as `with` is Python's), on the lead's entry
            only (`who` is the one lead; the mate gets no entry, the page poses her from the lead's); written out as
            "with"; required for lift, catch, partner-lift and comfort.
    mirror  True: left for right. 'alt': every second actor in `who` mirrored (couples facing, rowers either side).
    canon   seconds: the k-th actor in `who` starts k * canon late, after the snap (a ripple; finer than a beat is fine).
    speed   beats of the move per beat of the song (2 = double time, 0.5 = half), default 1.
    reverse True: the move runs backwards.
    note    what it is meant to hit (the lyric, the cue, the source). Always write one.

Two examples:

    dict(who=FOUR + ENS, track='1-03', at=73.9, bars=2, move='my-shot', counts=8,
         note='the signature phrase (chorus at cue 73.9 + 2 bars)'),
    dict(who=['ens8', 'ens9'], track='2-22', bar=89, beat=3, move='row', counts=8, mirror='alt', canon=0.25,
         note='the rowers beside him, a quarter-second apart'),

FINDING A BEAT'S TIME without the page: tools/blocking/beats.py (standard library, the page's own grid):

    python -I beats.py 2-22 202.0            # -> its bar and beat, and the nearest downbeat's time
    python -I beats.py 2-22 --bar 89 --beat 3  # -> the time of bar 89, beat 3
    from beats import beat_time; beat_time('2-22', 89, 3)   # the same, in Python

EIGHT SECTIONS, ONE PER SEGMENT, like props.py: `# ===== SEGMENT 1 (1-01..1-06) =====` … `# ===== END SEGMENT 8 =====`.
Each holds a plain list (`SEGMENT_1` … `SEGMENT_8`) of entries; the file concatenates them in show order.
  - An entry goes in the section of its track. Keep a section's entries in show order (track, then time).
  - THE RULE FOR REVIEWERS: edit ONLY your own segment's section, with small exact replacements (never rewrite the
    file whole: seven other reviewers are editing it too). A group you need that is not above: define it INSIDE your
    section, above your list.
  - Then check: `python -I dance.py --check N` (N = your segment) from tools/blocking. Read the errors (all must be
    gone) and only the warnings for your own tracks. It never writes assets/; the real merge is done once, after.
Standard library only.
"""
import json, os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from beats import beat_time, downbeat, counts_between  # noqa: E402

OUT = os.path.join(HERE, 'segments', 'dance.json')
MOVES = json.load(open(os.path.join(ROOT, 'tools', 'hamilton-moves.json'), encoding='utf-8'))['moves']

FOUR = ['hamilton', 'laurens', 'lafayette', 'mulligan']          # "the four" of My Shot
ENS = ['ens%d' % k for k in range(1, 11)]
SISTERS = ['angelica', 'eliza', 'peggy']
EVERYONE = ['hamilton', 'burr', 'eliza', 'angelica', 'peggy', 'washington', 'lafayette', 'mulligan', 'laurens'] + ENS
SOLDIERS = FOUR + ENS[:9]                                         # Yorktown


# ===== SEGMENT 1 (1-01..1-06) =====
# REVIEW 3 (video evidence; sources and timings in research/seg1.md). Times of the sung words come from two independent
# synced-lyric files of the cast album (lrclib.net) checked against the cue times; the moves are then put on the
# nearest beat of the grid. No lyrics here: the moments are named by cue, bar and description.
# 1-01 Alexander Hamilton. The company's gestures the sources name:
#  - Washington's line telling the boy to look after himself (bar 63): Blankenbuehler (BroadwayWorld 2016) -- that line "unlocked how the
#    show would rotate": "the counter clockwise gesture would be [Hamilton]'s destiny", "the momentum would keep falling
#    left". The company on deck takes a quarter turn to its left (counter-clockwise) and holds it. The shape of the
#    gesture is my reading; the moment and the direction are his.
#  - Angelica hands him the book (Q56, about 171.6): "when she takes the book all the ensemble point and fall back,
#    foreshadowing his death" (a viewer of the official Disney+ Clip 2): `point-fall` (RULING GF; was `point`).
#  - The women's line that ends on his taking his time (bar 96): "all the company inhale close to in-sync" before its
#    last word (Jack's reddit notes): `breath` (RULING GF; was `rise`), from beat 4 of bar 95 so the inhale is in by the
#    word and held through it (seg1.md Review 3: "on the 'and' before 1 the chest lifts ... held through 1").
#  - Q56, the women send him off: Eliza puts on his coat (Clip 2's comments): `coat-on` as she reaches him (168.8-170.2).
#  - SEATED (RULING GF `sit`, held to the end of its counts): Hamilton sick in the cousin's chair (props cousin-chair,
#    set behind him at 99.4) until he recovers (t101 104.6; the clip: he "slowly stands up from the chair"), and on it
#    again at his table writing (t101 Q51, 131.4-140.2).
# 1-03 My Shot. The signature phrase (WSJ, Blankenbuehler) starts on the downbeat after the pickup into the line naming
# his country, and is one 8-count (the tutorial uJkX2IBkuAY counts it as one "step" = 8). RULING GF re-gridded the track
# against the album's onsets (assets/hamilton-beats.json `changes`: the album drifts behind a constant 91 from ~124 s,
# and is half a bar late after the death verse), so every chorus now sits the same way on the grid: the sung pickup on
# beat 4-and of the bar before (words at 79.2, 89.8, 174.4, 185.0, 301.8 = bars 30, 34, 66, 70, 114 beat 4.1-4.6) and
# the phrase on BEAT 1 of bars 31, 35, 67, 71 and 115. (Round 1's beat-2 / beat-3 work-arounds are gone; the times
# barely move: 67 and 71 are 0.23 s earlier, 115 is the same 302.4.)
# The old sixth entry (cue 307.1 + 2 bars) is CUT: the last chorus has the phrase once; its second half is the
# rising chant, with no phrase in the words.
# Burr reads in his tavern chair UR (props burr-chair / burr-book; "Aaron Burr just reading a book in the background",
# seg1.md Review 3) from 6.8 until he goes at Q118: `sit`.
# 1-04 The Story of Tonight: the four settle at their chairs by candlelight (t104 Q140, props tavern-chair-1..4) and get
# up to draw together at Q141 (16.0): `sit`.
# 1-05 The Schuyler Sisters (the Disney+ clip POHVE9uCNAY's viewers, timestamps about 1 s behind the album):
#  - the equals sign (Jack's reddit notes) on Angelica's declaration (bar 47) AND on the same line in the counterpoint
#    (bar 63): the gesture goes with the line;
#  - the two fingers ("work") on the shout after her line about the sequel: bar 49 beat 3 (it was bar 50, on the next
#    line, 1.8 s late);
#  - "the rotating floor ... the characters walk in place": the sisters walk on the spot through the street walk
#    (slow-walk at double speed = a step a beat), and Eliza and Peggy again "walk to the beat on that rolling floor"
#    (1:18) through Burr's summer verse;
#  - the city's "grandpa walk" as it comes on (0:09): `old-walk` (RULING GF), a gait laid on their walk-on (10.2-17.4);
#  - Burr: "I love Burr's dance at the beginning when the sisters are being introduced" (two-step: the sources do not
#    say what; KEPT, not `strut`: he stands in the DSR corner at bar 10, and a gait shows only on a walk); his "angel
#    wings" behind Peggy at her last name (2:48): `angel-wings` (RULING GF; was `reach-up`);
#  - Lafayette and Mulligan's "secret handshake on the railing" (1:23) on the upstage gallery: `handshake`, the pair;
#  - Peggy's startled jump (1:05, three comments), Eliza's "little jumps" (2:12) and her last jump (3:07);
#  - the city "doing their choreography" in the anthem and the reprise, the book guy "going wild": the sources do not
#    say what, so the simplest general move, step-touch, in sync, on those two choruses only (Burr with them in the
#    reprise: "dancing with the ensemble").
DECK01 = ['ens1', 'ens2', 'ens4', 'ens5', 'ens8', 'ens9', 'ens10']     # the company standing in the upstage line at bar 63
CITY05 = ['ens%d' % k for k in range(1, 9)]                             # t105's city
SEGMENT_1 = [
    dict(who=['hamilton'], track='1-01', bar=53, beat=3, move='sit', until=104.6, note='sick in the cousin\'s chair (set behind him at 99.4) until he recovers (seg1.md Review 3: the clip has him in a chair, standing up where he recovers)'),
    dict(who=DECK01, track='1-01', bar=63, move='spin-quarter', counts=4, note='Washington\'s line to the boy: the counter-clockwise gesture, "falling left" (Blankenbuehler, BroadwayWorld); the shape a reading'),
    dict(who=['hamilton'], track='1-01', bar=71, move='sit', until=140.2, note='Q51: at his table on the cousin\'s chair, writing (t101; props cousin-chair), until he leaves it for Q52'),
    dict(who=['hamilton'], track='1-01', bar=92, beat=2, move='coat-on', counts=4, note='Q56: Eliza puts on his coat (168.8-170.2; Disney+ Clip 2 comments, seg1.md Review 3)'),
    dict(who=ENS, track='1-01', bar=93, beat=3, move='point-fall', counts=4, note='Q56: Angelica hands him the book -- "all the ensemble point and fall back" (Disney+ Clip 2 comment; seg1.md Review 3 move 1)'),
    dict(who=ENS + ['burr', 'lafayette', 'laurens', 'mulligan', 'eliza', 'angelica', 'peggy', 'washington'], track='1-01', bar=95, beat=4, move='breath', counts=3,
         note='the company\'s in-sync inhale before the last word of the women\'s line (bar 96; Jack\'s reddit notes): in on beat 4, held through the word (seg1.md Review 3 move 2)'),
    dict(who=['burr'], track='1-03', bar=3, beat=3, move='sit', until=123.3, note='reading in his tavern chair UR (props burr-chair, burr-book; "just reading a book in the background", seg1.md Review 3) until he goes at Q118'),
    dict(who=FOUR + ENS, track='1-03', bar=31, move='my-shot', counts=8, note='chorus 1, first half: the signature phrase on the downbeat after the pickup (words at 79.2 = bar 30 beat 4.5)'),
    dict(who=FOUR + ENS, track='1-03', bar=35, move='my-shot', counts=8, note='chorus 1, second half (words at 89.8 = bar 34 beat 4.6)'),
    dict(who=FOUR + ENS, track='1-03', bar=67, move='my-shot', counts=8, note='chorus 2, first half (words at 174.4-174.6 = bar 66 beat 4.2-4.5 on the GF grid)'),
    dict(who=FOUR + ENS, track='1-03', bar=71, move='my-shot', counts=8, note='chorus 2, second half (words at 185.0-185.1 = bar 70 beat 4.3-4.5)'),
    dict(who=FOUR + ENS, track='1-03', bar=115, move='my-shot', counts=8, note='the last chorus: its only phrase (words at 301.8-302.1 = bar 114 beat 4.1-4.6: the GF grid has the death verse\'s half bar)'),
    dict(who=['lafayette', 'hamilton', 'laurens', 'mulligan'], track='1-04', bar=1, beat=3, move='sit', until=16.0, note='Q140: the four settled at their chairs by candlelight (t104; props tavern-chair-1..4) until they draw together (Q141)'),
    dict(who=CITY05, track='1-05', bar=5, beat=3, move='old-walk', until=20.0, note='"0:09 ensemble\'s grandpa walk" as the city comes on (seg1.md Review 3 move 4): the gait on their walk-on'),
    dict(who=['burr'], track='1-05', bar=10, move='two-step', counts=12, note='"Burr\'s dance at the beginning when the sisters are being introduced" (Disney+ clip comments); the step not named, so the two-step (he stands DSR: no strut)'),
    dict(who=SISTERS, track='1-05', bar=18, beat=3, move='slow-walk', speed=2, until=50.6, note='the street walk: walking on the spot against the turning floor, a step a beat ("the characters walk in place", clip comments)'),
    dict(who=['peggy'], track='1-05', bar=28, beat=3, move='jump', counts=2, note='Q161: the men close in (Laurens behind her): Peggy\'s startled jump (1:05, three comments)'),
    dict(who=['eliza', 'peggy'], track='1-05', bar=34, beat=3, move='slow-walk', speed=2, until=91.5, note='"Eliza and Peggy\'s walk to the beat on that rolling floor" (1:18) through Burr\'s summer verse'),
    dict(who=['lafayette'], track='1-05', bar=36, beat=3, move='handshake', counts=4, with_='mulligan', note='"Lafayette and Mulligan\'s secret handshake on the railing" (1:23; seg1.md Review 3), side by side on the upstage gallery'),
    dict(who=SISTERS, track='1-05', bar=47, move='equals', counts=4, note='Angelica\'s declaration, its last word: the equals sign (Jack\'s reddit notes; the words at 108.1-110)'),
    dict(who=SISTERS, track='1-05', bar=49, beat=3, move='work', counts=2, note='the shout after her line about the sequel: two fingers up (Jack\'s reddit notes; the line runs 112.1-114.4)'),
    dict(who=CITY05 + ['laurens'], track='1-05', bar=52, move='step-touch', counts=16, note='the anthem: the city dances (sources: "their choreography", the book guy "going wild"; the step not named: step-touch, in sync)'),
    dict(who=['eliza'], track='1-05', bar=57, move='jump', counts=4, note='Q169, the shouted line: "Eliza\'s little jumps" (2:12)'),
    dict(who=SISTERS, track='1-05', bar=63, move='equals', counts=4, note='the counterpoint: the same declaration again (the gesture goes with the line)'),
    dict(who=CITY05 + ['burr', 'laurens', 'lafayette'], track='1-05', bar=64, move='step-touch', counts=16, note='the reprise: the city dances, Burr "dancing with the ensemble" (comments); step-touch, in sync'),
    dict(who=['burr'], track='1-05', bar=72, move='angel-wings', counts=4, note='Peggy\'s last name: Burr\'s "angel wings" behind her (2:48, two comments; seg1.md Review 3 move 3)'),
    dict(who=['eliza'], track='1-05', bar=78, beat=3, move='jump', counts=2, note='the button: "Eliza\'s little jump at 3:07"'),
]
# ===== END SEGMENT 1 =====

# ===== SEGMENT 2 (1-07..1-11) =====
# REVIEW 3 (video evidence; tools/blocking/research/seg2.md "Review 3"). Groups for this section:
RING196 = ['ens2', 'ens3', 'ens6', 'ens7', 'ens4', 'ens5', 'ens8', 'ens9']    # 1-07 Q196 the ring (gen_seg2.py)
FIN8 = ['ens8', 'ens7', 'ens3', 'ens2', 'ens4', 'ens6', 'ens5', 'ens10']      # 1-08 the company line from Q286
COUPLES = ['ens2', 'ens6', 'ens3', 'ens7', 'ens5', 'ens8', 'ens10', 'ens9']   # man, woman: 'alt' mirrors the women
# 1-07 You'll Be Back. Q196 "Group Enters" for the last sing-along: the eight on the ring sway, in sync, half time
# (no source names a move; the simplest one for a sing-along, per the brief).
# 1-08 Right Hand Man. Blankenbuehler (TheaterMania): the My Shot phrase is done "in the middle of Right Hand Man". The
# libretto gives that line to the COMPANY (not Hamilton) just after Washington's offer: the pickup lands on bar 88
# beat 2 (269.4, the album's line at 269.65), the phrase runs 8 counts to the end of the line (275.4). Washington draws
# his sword at the end (the clip's comments): `sword-draw` (RULING GF; was `point`) on the last line.
# 1-09 A Winter's Ball. The ball: palms first (Blankenbuehler) - the couples gavotte from the ball's downbeat to the
# turntable (Q293). ens3 leaves his partner to talk to Peggy and is shouldered away by Lafayette (gen_seg2.py).
# The one lady crossing behind the men's lineup ends her walk on a little shimmy (the clip's comments).
# 1-10 Helpless. Gavotte from the ball memory (Q300.6, bar 10), the grind ON the word the lyric names (bar 14 beat 2,
# 42.2 on the album: "about 20 seconds later" in Blankenbuehler's telling is a round number), the gavotte again until
# chorus 2's turn. Peggy's little shoulder dance as the letters begin (the clip's 1:43-1:45, bar 34): `shoulder-pop`;
# Hamilton's celebration dance after the blessing (2:28-2:31; "the Tootsie Roll") with Eliza copying him in the back
# (2:30): `tootsie-roll` for both (RULING GF; all three were `two-step`, seg2.md Review 3 "Moves that do not exist").
# SEATED (RULING GF `sit`): Q302, as the letters end - the sisters on their bench at the disc's downstage edge, backs to the
# house, and Papa Schuyler in his chair upstage on the disc (hamilton-lyrics; props sisters-bench, schuyler-chair),
# each from her arrival until she gets up. Angelica and Peggy sit 0.7 m in front of the bench's long side, 0.9 m from
# its centre (it is 1.5 m long).
# NOT placed: the men lifting the women in Helpless and Satisfied, and the floor-slide round Angelica in the rewind
# (seg2.md Review 3): no time or body is given for either.
# 1-11 Satisfied. The rewind for everyone on stage EXCEPT Angelica and Laurens, who keep their glasses up and do not go
# backwards (the side-by-side's comments). The replay mirrors the ball and Helpless exactly (the side-by-side): the
# gavotte where the ball's falls (91.9), again where Helpless's falls (155.8), the grind where Helpless's grind falls
# (167.5, the matching line) until the freeze (Q374 172.35); Peggy's dance again (bar 118, "the same" dance:
# `shoulder-pop`).
SEGMENT_2 = [
    dict(who=RING196, track='1-07', bar=94, move='sway', until=196.48, speed=0.5, note="Q196 the ring's sing-along: a sway in sync, half time (the simplest move; no source names one)"),
    dict(who=FIN8, track='1-08', bar=88, beat=2, move='my-shot', counts=8, note="the My Shot phrase \"in the middle of Right Hand Man\": the company's line after Washington's offer (album 269.65)"),
    dict(who=['washington'], track='1-08', bar=102, beat=2, move='sword-draw', counts=4, note="the last line: he draws his sword and raises it (the clip's comments; seg2.md Review 3)"),
    dict(who=['ens1'], track='1-09', at=36.2, move='shimmy', counts=3, note="the lady crossing behind the men ends her walk on \"the little shimmy\" (the clip's comments)"),
    dict(who=[a for a in COUPLES if a != 'ens3'], track='1-09', at=50.9, move='gavotte', until=63.84, mirror='alt', note="the ball (Q292): palm to palm first (Blankenbuehler), to the turntable (Q293)"),
    dict(who=['ens3'], track='1-09', at=50.9, move='gavotte', counts=4, note="the ball, until he goes to talk to Peggy"),
    dict(who=['ens3'], track='1-09', at=56.4, move='gavotte', until=63.84, note="back with his partner after Lafayette shoulders him away"),
    dict(who=COUPLES, track='1-10', bar=10, move='gavotte', counts=17, mirror='alt', note="the ball memory (Q300.6): the gavotte, palm to palm"),
    dict(who=COUPLES, track='1-10', bar=14, beat=2, move='grind', counts=8, mirror='alt', note="the grind on the word (album 42.2); Blankenbuehler: palms first, then \"they're grinding\""),
    dict(who=COUPLES, track='1-10', bar=16, beat=2, move='gavotte', counts=17, mirror='alt', note="the gavotte again until chorus 2's turn (Q301.4)"),
    dict(who=['peggy'], track='1-10', bar=34, beat=2, move='shoulder-pop', counts=4, note="Peggy's little shoulder dance as the letters begin (the clip's 1:43-1:45; seg2.md Review 3)"),
    dict(who=['eliza'], track='1-10', bar=38, beat=3, move='sit', until=125.2, note="Q302, as the letters end: on the sisters' bench, back to the house (hamilton-lyrics; props sisters-bench) until she goes to him"),
    dict(who=['angelica'], track='1-10', bar=38, beat=4, move='sit', until=139.5, note="Q302: on the bench, SR end (hamilton-lyrics; props sisters-bench)"),
    dict(who=['peggy'], track='1-10', bar=39, move='sit', until=139.5, note="Q302: on the bench, SL end (hamilton-lyrics; props sisters-bench)"),
    dict(who=['ens4'], track='1-10', bar=39, beat=2, move='sit', until=126.3, note='Q302: "Papa Schuyler sits in a chair on the turntable" (hamilton-lyrics; props schuyler-chair)'),
    dict(who=['hamilton'], track='1-10', bar=48, beat=3, move='tootsie-roll', counts=4, note="his celebration dance after the blessing (the clip's 2:28-2:31, \"the Tootsie Roll\"; seg2.md Review 3)"),
    dict(who=['eliza'], track='1-10', bar=49, move='tootsie-roll', counts=4, note="Eliza in the back copying his dance (the clip's 2:30)"),
    dict(who=[a for a in EVERYONE if a not in ('angelica', 'laurens')], track='1-11', at=46.74, move='rewind', until=57.62, note="the rewind (cues 366.2 to 366.8); Angelica and Laurens keep their glasses up and do not go backwards"),
    dict(who=COUPLES, track='1-11', at=91.9, move='gavotte', until=107.9, mirror='alt', note="the ball replayed: where the ball's gavotte falls in the side-by-side"),
    dict(who=COUPLES, track='1-11', at=155.84, move='gavotte', until=167.47, mirror='alt', note="Helpless replayed: where its gavotte falls"),
    dict(who=COUPLES, track='1-11', at=167.47, move='grind', until=172.35, mirror='alt', note="Helpless's grind replayed, on the matching line, to the freeze (Q374)"),
    dict(who=['peggy'], track='1-11', bar=118, beat=2, move='shoulder-pop', counts=8, note="Peggy's little dance again (the side-by-side: \"the same\" in both songs)"),
]
# ===== END SEGMENT 2 =====

# ===== SEGMENT 3 (1-12..1-17) =====
# REVIEW 3 (the sources and the clip-to-album timings: research/seg3.md, "Review 3"). The film clips are Jack's playlist's
# (e4NAz2TWA4I reprise, pd3L7mI19q8 Stay Alive, TW3-3Xy0kCo Ten Duel Commandments); what they say is from their comments.
# 1-12: the four's drunk, goofy sway after the toast (clip 0:40-0:46: "Anthony couldn't do the sway that good", "goofy
# dance"); the two passed-out wedding guests (ens2, ens9; seg3gen.py) slumped till one helps the other up at the end:
# `fold` (RULING GF; was `kneel`), folded down where they lie, then `rise`.
# 1-13: the watcher far SL (ens8, cue 410 "the woman on the chair") sits on the chair she brought (props watcher-chair).
# 1-13: the six on the gallery and Burr sway together on the three choruses - sourced only that they move as he moves
# (Blankenbuehler, Playbill); the sway is the simplest fitting move, a reading, not a sighting.
# 1-14: the Bullet's slow crossing at the top (Odyssey Online, clip 0:10-0:17); Hamilton's small arm on the vocal gun
# (clip 0:58, "his small arm movement": `aim`, RULING GF; was `point`); the soldiers' rifle work ("the rifle choreography", "the
# British soldiers choreography") on the raids and in Monmouth, Burr among them (hamilton-lyrics: he dances in the war
# scenes).
# 1-15: the duellists spin as the seconds pass them the guns, then the bounce on #4 (clip 0:39-0:41: "the seconds pass the
# gun and they spin around, and immediately do the bouncing thing", "in number 4 ... bouncing up and down"); the company
# at #6 and #7 with Hamilton and the Bullet "moving through the choreography in sync" (Odyssey) - what they do is not
# described, so the #4 bounce, the number's own motif; the ten paces counted out (march at the count's speed) and the shot.
# RULING GF adds (seg3.md Review 3 "Moves the library does not have"): the head snap at #1 ("the little head snap the
# ensemble and Charles Lee do", 0:14) for the two at the centre then, Lee (ens3) and Laurens - the renders have no
# company on at #1, so it is the duellists'; and `gun-pass` in the Company Vocal before #4: each second hands his
# duellist the pistol (Hamilton to Laurens, Burr to Lee), the two beats before they spin (bar 12 beat 3).
# 1-17 That Would Be Enough: Hamilton on his little bench (ironinkpen; cue 490 "Hamilton (seated)"; props office-chair)
# from the top until the chorus (89.55), where they revolve together; "he's sitting there" (1:21). Eliza `comfort`s him
# as the dialogue starts (cue 491, 19.75: the pool comes up on the couple): standing beside him, hands on his shoulders
# (seg3.md Review 3; her lines to him are the comfort - the time is a reading: the source names the move, not the bar).
SEC3_GAL = ['ens7', 'ens6', 'ens1', 'ens5', 'ens2', 'ens9']          # 1-13: the six on the upstage gallery
SEC3_SOLD = ['ens1', 'ens2', 'ens5', 'ens6']                        # 1-14: the four soldiers
SEC3_LINE = ['laurens', 'hamilton', 'ens1', 'ens2', 'ens5', 'ens6', 'ens7', 'ens9', 'burr', 'ens3']   # 1-15 #6
SEGMENT_3 = [
    dict(who=['ens9'], track='1-12', at=3.6, move='fold', until=107.2, note='passed out on the SL stair (clip: "the ensemble member on the stairs"; seg3.md Review 3)'),
    dict(who=['ens2'], track='1-12', bar=3, move='fold', until=104.3, note='passed out below the stair'),
    dict(who=['hamilton', 'laurens', 'lafayette', 'mulligan'], track='1-12', at=38.6, move='sway', counts=8,
         note='the drunk, goofy sway after the toast (cue 402; clip 0:40-0:46)'),
    dict(who=['ens2'], track='1-12', bar=36, beat=3, move='rise', counts=2, note='he gets up to help his friend'),
    dict(who=['ens9'], track='1-12', bar=37, beat=3, move='rise', counts=2, note='"Thayne helping Ephraim get up" (clip 1:50)'),
    dict(who=['ens8'], track='1-13', bar=4, beat=3, move='sit', until=51.0, note='the woman far SL (cue 410) on the chair she brought, in her pool (seg3gen.py; props watcher-chair), until she takes it off'),
    dict(who=['burr'] + SEC3_GAL, track='1-13', at=31.15, move='sway', until=51.1, note='chorus 1 and the hook (cues 411-412): they move as he moves'),
    dict(who=['burr'] + SEC3_GAL, track='1-13', at=72.0, move='sway', until=92.5, note='chorus 2 (cue 415) to the bridge'),
    dict(who=['burr'] + SEC3_GAL, track='1-13', bar=63, beat=2, move='sway', until=175.2, note='the final chorus (cue 424) to the broken-off line'),
    dict(who=['ens1'], track='1-14', at=10.0, move='bullet', until=19.5, note='the Bullet passes Hamilton at the top; Laurens blocks her'),
    dict(who=['hamilton'], track='1-14', bar=19, beat=3, move='aim', counts=2, note='the vocal gun (cue 434, 58.55): his small arm movement, the pistol levelled (seg3.md Review 3)'),
    dict(who=SEC3_SOLD, track='1-14', at=77.5, move='musket', counts=8, note='the raids (cue 437): the British, guns on the friends'),
    dict(who=SEC3_SOLD + ['burr'], track='1-14', at=98.6, move='musket', counts=2, note='Monmouth opens (cue 440)'),
    dict(who=SEC3_SOLD + ['burr'], track='1-14', at=105.0, move='musket', counts=8, note='the battle steadies under Washington (cue 443)'),
    dict(who=['ens3', 'laurens'], track='1-15', bar=5, move='head-snap', counts=1, note='#1 (cue 452, the shout at 15.0): "the little head snap the ensemble and Charles Lee do" (clip 0:14; seg3.md Review 3)'),
    dict(who=['hamilton'], track='1-15', bar=12, move='gun-pass', counts=2, with_='laurens', note='the Company Vocal before #4 (cue 457): "the seconds pass the gun" - Hamilton, his second, to Laurens (clip 0:39)'),
    dict(who=['burr'], track='1-15', bar=12, move='gun-pass', counts=2, with_='ens3', note='the Company Vocal before #4: Burr, his second, to Lee (clip 0:39)'),
    dict(who=['laurens', 'ens3'], track='1-15', bar=12, beat=3, move='spin-full', counts=2, note='the guns passed, they spin round (clip 0:39)'),
    dict(who=['laurens', 'ens3'], track='1-15', bar=13, move='bounce', counts=8, note='#4 (cue 458): "the bouncing thing"'),
    dict(who=SEC3_LINE, track='1-15', bar=19, move='bounce', counts=8, note='#6 (cue 462): the line of ten, the Bullet beside Hamilton, in sync'),
    dict(who=['ens2', 'ens5', 'ens6', 'ens7', 'ens9', 'hamilton', 'ens1'], track='1-15', bar=21, beat=2, move='bounce', counts=8,
         note='#7 (cue 464): the cluster, and Hamilton with the Bullet at his side'),
    dict(who=['laurens', 'ens3'], track='1-15', bar=33, beat=2, move='march', counts=3, speed=3.33,
         note='the ten paces, counted (cue 472): ten steps in the three beats to the turn'),
    dict(who=['laurens', 'ens3'], track='1-15', bar=34, move='musket', counts=2, note='the turn and the shot (cue 474, 104.85)'),
    dict(who=['hamilton'], track='1-17', bar=2, beat=4, move='sit', until=89.0, note='on his little bench (cue 490 "Hamilton (seated)"; ironinkpen; props office-chair) until the chorus turns the two (89.55)'),
    dict(who=['eliza'], track='1-17', bar=12, move='comfort', counts=16, with_='hamilton', note='cue 491: the dialogue starts, she comforts him on his bench, hands on his shoulders (seg3.md Review 3; the moment a reading)'),
]
# ===== END SEGMENT 3 =====

# ===== SEGMENT 4 (1-18..1-23) =====
# 1-20 Yorktown. Blankenbuehler's own breakdown (WSJ, "Breaks Down His Moves"): the marching troops freeze and act out
# Hamilton's thought as he sings it — his imagined death, his weapon and his command — then the heartbeat when he thinks
# of Eliza, and the hip-hop march into the battle. The musket weighs 35 pounds. At the title phrase the furniture is lifted
# and held upside down (the reddit staging notes); nobody carries furniture in Yorktown in props.py yet, so the arms go
# up empty (FUTURE.md).
# REVIEW 3 (video evidence; research/seg4.md "Review 3"). The bars: 1-20 is 98 BPM, a bar is 2.449 s, bar 21 = 51.36.
# Hamilton's verse is one line a bar from cue 592 to cue 593 (exactly 4 bars, 51.36 -> 61.16): bar 21 the imagined death,
# bar 22 standing up to the enemy, bar 23 the end and the friend beside him, bar 24 the weapon and the command; bars 25-26
# Eliza and the baby; bars 27-28 the march line; bar 29 (70.96) the night attack. The WSJ teaching order is the same:
# the memory and the knife-to-the-neck pride, the knee and punch at the enemy, arms crossed for the end, the baseball
# pitch into the rifle overhead for the friend, then the epaulets for the command. So imagine-death is stretched over 2.5
# bars (speed 0.8) and command starts on the friend (bar 23 beat 3) and lands its epaulets on bar 24 (speed 2/3). The
# march is 2 bars, not 4: it ends where the night attack starts, and they walk into the night pools on it.
# The troops dance it, not Hamilton (the WSJ piece: his marching troops freeze and bring the line to life, in formation
# behind him); he is alone at the lip singing it.
# RULING GF (seg4.md Review 3 "Moves wanted"): Eliza gives him his coat on the gallery in 1-18 (95): `coat-on`;
# Washington gives him a sword in 1-19 (three comments; untimed): `sword-take`, put while the two stand together at the
# verse-2 build (64.5-74.7, the only time they are within reach); the Bullet shakes Laurens' hand in 1-20 (94.6-96.8;
# CinemaBlend, MsMojo x2): `handshake`. 1-18's grid moved its downbeat on two beats (firstBeat 0.846 -> 1.716), so every
# "bar N beat 3" of round 1 is now "bar N beat 1": the same times, now on the downbeat.
# SEATED (`sit`): 1-22 Burr SL and Hamilton SR in the chairs they bring on (the Disney+ frame behind cue 618; props
# theo-chair-burr / -hamilton), each through his own verse; 1-23 the jury of six in their chairs, seats to the defence
# table (ETC's render of cue 631.01; props theo-chair-*, jury-chair-*), until they turn out to the house (41.5).
YT_CO = ENS + ['laurens', 'lafayette']                       # the company behind him (offstage bodies are not posed)
YT_UP = ENS + ['laurens', 'lafayette', 'mulligan']           # every soldier but Hamilton in the upside-down
GS_DECK = ['ens1', 'ens2', 'ens4', 'ens5', 'ens7', 'ens8']    # 1-18's deck company (ens3 goes upstairs, ens6 has the table)
JURY23 = ['ens1', 'ens6', 'ens7', 'ens8', 'ens9', 'ens10']   # 1-23's jury (gen4.py JURY)
SEGMENT_4 = [
    # 1-18 Guns and Ships (RULING GF grid: the cue hits and the phrases now start on the downbeats)
    dict(who=GS_DECK, track='1-18', bar=18, move='two-step', until=48.8, note='Lafayette\'s rap: the company dances round him (clip comments: "0:34 ... just dancing", "0:46 the Farmer Refuted dude at the back ... having the time of his life"); the move is a general hip-hop step, not seen'),
    dict(who=['ens3'], track='1-18', bar=18, move='two-step', until=46.0, note='as the deck company, until Lee leaves for the stair'),
    dict(who=['ens6'], track='1-18', bar=18, move='two-step', until=43.5, note='as the deck company, until she goes back for the table'),
    dict(who=['lafayette'], track='1-18', bar=21, move='jump', counts=2, note='he jumps down off the table mid-rap (clip 0:38-0:39 = album ~36.5)'),
    dict(who=['angelica', 'peggy', 'ens3'], track='1-18', bar=34, move='bounce', until=80.0, note='"everyone upstairs is dancing except for Burr" (clip 1:04); "Peggy and Angelica jamming on the rafter"; "1:16 Angelica\'s feeling it"'),
    dict(who=GS_DECK + ['ens6'], track='1-18', bar=40, move='two-step', until=80.0, note='the company chant (cue 567): the deck company dances it (a general step: the clips name no move)'),
    dict(who=['hamilton'], track='1-18', bar=55, move='coat-on', counts=4, note='on the gallery Eliza gives him his coat (95; Disney+ clip 1:50 "Eliza gives him his coat"; seg4.md Review 3)'),
    # 1-19 History Has Its Eyes on You
    dict(who=['hamilton'], track='1-19', bar=22, move='sword-take', counts=4, with_='washington', note='Washington gives him a sword (Disney+ clip comments, three; "the passing of the sword", G.O.T Games): placed while they stand together (64.5-74.7), a reading - the comments do not time it'),
    dict(who=['hamilton'], track='1-19', bar=28, beat=2, move='salute', until=94.5, note='"when Hamilton salutes and ... [looks] right into Washington\'s eyes" (clip comment, ws_pklV1cP8); placed on the last line (cue 583), the moment is not timed in the comment'),
    # 1-20 Yorktown
    dict(who=SOLDIERS, track='1-20', at=32.2, bars=2, move='my-shot', counts=8, note='the My Shot reprise (cue 590): the phrase\'s first line is bar 15 (36.67; the official album video\'s captions put it at 36.2)'),
    dict(who=YT_CO, track='1-20', bar=21, move='imagine-death', counts=10, speed=0.8, note='bars 21-23: the memory, the knee and punch at the enemy, arms crossed for the end (WSJ)'),
    dict(who=YT_CO, track='1-20', bar=23, beat=3, move='command', counts=6, speed=0.667, note='the friend beside him (the rifle overhead) into the command (the epaulets) on bar 24 (WSJ)'),
    dict(who=YT_CO, track='1-20', bar=25, move='heartbeat', counts=8, note='bars 25-26, Eliza and the baby: the heartbeat; they turn "home" to Eliza on the balcony above them (WSJ; gen4.py)'),
    dict(who=YT_CO, track='1-20', bar=27, move='hiphop-march', counts=8, note='bars 27-28, the march line: the march that "takes us into formation" (the night pools, bar 29)'),
    dict(who=['ens1'], track='1-20', bar=39, move='handshake', counts=2, with_='laurens', note='the Bullet shakes Laurens\' hand in his pool (94.6-96.8; CinemaBlend, MsMojo top 10 / top 20)'),
    dict(who=SOLDIERS, track='1-20', at=129.9, move='musket', until=141.7, note='the drill and the battle (cues 601-602): the 35-pound musket, mimed (Dance Magazine: the Americans have no guns in the battle, "it\'s a pantomime")'),
    dict(who=SOLDIERS, track='1-20', bar=58, move='freeze', until=146.0, note='the cold turn (cue 604): they stop dead in the aim, then move on in slow motion (Wyzant viewer; the 2016 Tonys frame "all of them frozen, pointing the invisible guns")'),
    dict(who=SOLDIERS, track='1-20', at=146.0, move='musket', counts=8, note='the battle resumes (cue 605)'),
    dict(who=YT_UP, track='1-20', bar=83, beat=3, move='upside-down', until=217.1, note='the company\'s first full title phrase (cue 609.2, hit 204.24): the furniture lifted and held upside down (props.py ytown-*; the arms go up empty for those without)'),
    dict(who=YT_UP, track='1-20', bar=89, move='upside-down', counts=4, reverse=True, note='the chant (cue 609.3): the furniture turned back the right way up ("then righted, matching the lyric", AllMusicals annotation)'),
    # 1-22 Dear Theodosia
    dict(who=['burr'], track='1-22', bar=3, beat=2, move='sit', until=29.0, note='seated SL in the chair he brings on (the Disney+ frame behind cue 618; props theo-chair-burr) through his verse'),
    dict(who=['hamilton'], track='1-22', bar=3, beat=2, move='sit', until=75.0, note='seated SR in his chair (the Disney+ frame; props theo-chair-hamilton) until his verse brings him forward'),
    # 1-23 Non-Stop
    dict(who=JURY23, track='1-23', bar=1, move='sit', until=41.0, note='the jury in its six chairs, seats to the defence table (ETC render of cue 631.01; props theo-chair-*, jury-chair-*), until they turn out at the first chorus (41.5)'),
    dict(who=['hamilton'], track='1-23', at=368.7, move='my-shot', counts=4, speed=2.0, note='his last Shot line (cue 665): the phrase in one bar, the shot snapped down on its last word (TheaterMania: the phrase "repeats several other times in the show in pieces"; placed by the words, not seen)'),
]
# ===== END SEGMENT 4 =====

# ===== SEGMENT 5 (2-01..2-05) =====
# 2-05 The Room Where It Happens. Blankenbuehler: the ensemble is Burr's ego, mocking him — the Fosse-like upper-body
# shimmy; Dance Magazine: "ooey-gooey jazz". On the choruses (cues 867.3, 867.8). Burr circles the lit circle and never
# crosses it until the end: a path rule, for the generators (docs/hamilton-dance-moves.md).
# REVIEW 3 (video evidence; tools/blocking/research/seg5.md "Review 3"). seg5gen.py's company is ens1-ens8 in 2-01, 2-02 and
# 2-05 (S5_E8), six of them on the galleries in Say No (S5_SN); Jefferson is 'lafayette', Madison 'mulligan'.
# 2-01: the company kneels scrubbing as Jefferson strides down (reddit; WatchMojo) and rises to watch; the party hooks are
#   danced (Disney+ clip comments: "the ensemble ate"; no step named: step-touch). Jefferson "never stands still, moving in
#   time, even during Madison's part" (reddit), "bounces and struts" (ironinkpen): bounce under the verses, the hip-hop
#   two-step on the hooks ("1:38 Thomas dancing", "1:40 moonwalking").
# 2-02: a rap-battle crowd in the V of chairs (ironinkpen): the roar (741), heads nodding through each verse, arms up on
#   each mic drop. Hamilton bows when Washington names him (clip comment); he prances and fans, mocking Jefferson, on the
#   Monticello line (clip comments 1:25-1:29; TVLine "Hamilton mocking Jefferson's dance moves"); Jefferson's laughing
#   head-bob on the gloat (reddit; clip "that cackle").
# 2-04: the gallery company points down at him on the title hits (ironinkpen: they shout "No!" down at him).
# 2-05: the ensemble is Burr's ego mocking him (TheaterMania: the Fosse-like shimmy), "ooey-gooey jazz" (Dance Magazine) on
#   the choruses; the BRIDGE is the Bojangles step (Ham4Ham 8/3/15, Blankenbuehler dances "the ensemble part of the
#   bridge... the imitation of a Fred Astaire film", captions read) with the shimmy as Hamilton mocks Burr's motto; Burr dances
#   with the ensemble in his build and the final Dance (ironinkpen "unlike in Wait For It, Burr dances with the ensemble";
#   clip comments 4:26-4:41, 5:00). The three step forward on their lines in the company vocal (ironinkpen); Madison
#   motions Hamilton to come, twice the same (clip comment); Jefferson's kick on the second entry (clip "1:58 the leg").
# RULING GF (the moves seg5.md Review 3 asked for, "the library lacks"):
# 2-01: the company scrubs on its knees (`scrub`, was `kneel`). Jefferson: `strut` (the "pimp walk") laid on his walks -
#   the descent from the gallery through the scrubbing company, and his round of the room at 135.5-150 (the clip's 2:56
#   strut falls where the blocking has him standing, so it is put on the nearest walk); `bounce` stays under the verses
#   (the clip's "the bouncing" at 2:00, ironinkpen "bounces"); on hook 1 the two-step, then `moonwalk` from bar 39 ("1:38
#   Thomas dancing", "1:40 moonwalking"), then the two-step again; hooks 2 and 3 keep the two-step. The ensemble lift
#   in hook 2 (clip 3:14, "the dancer tore a tendon doing it"): `partner-lift`, ens3 lifting ens6, the nearest man and
#   woman there (1.2 m) - which two is a reading. The welcome: Hamilton takes Jefferson's hand (`handshake`, 213.8) and
#   Jefferson laughs it off (`laugh-bob`, "Jefferson laughs at him at 3:38") until the final build.
# 2-02: Hamilton's `prance-fan` mocking Jefferson (was `march`); Jefferson's laugh on the gloat: `laugh-bob` (was `bounce`;
#   the head-bob the reviewer described, with the laugh). SEATED: the eight in the V of chairs and Washington in his at
#   the SL vertex (ironinkpen; seg5gen.py; props cabinet-chair-1..8, washington-chair), up on their feet for the roar
#   and the two mic drops (`reach-up`) and back down. The heads nodding through each verse (round 1's `bounce`) are HELD:
#   a move overrides a sit and the sit does not come back, so a nod would stand them up for a minute; `head-bob` goes
#   back on the two lines commented below when the page can lay an upper-body move on a seated body.
# 2-04: `point-down` from the galleries (was `point`, which points up).
# 2-05: Madison's `beckon` (was `point`), twice the same; Burr's "finger gun" at the clip's 1:00 (`aim`, the target is
#   not named: he aims out front, where he faces); Burr's `chest-pump` in his build (4:34, Press Herald "chest pops"; was
#   the company's shimmy); Burr "points at the ground" on the final click-boom (cue 892, ironinkpen): `point-down`.
#   Jefferson `strut`s on his crossing to Madison and his walks into the room. SEATED: the three at the Room's table
#   (props room-chair-*, each chair set behind its man, facing the table) whenever they face it; Jefferson and Madison
#   stand for the company vocal (50-72, facing the house), Hamilton (facing the house across the table) only for his
#   step forward.
S5_E8 = ENS[:8]
S5_SN = ['ens1', 'ens2', 'ens3', 'ens5', 'ens7', 'ens8']
S5_LIFT = ['ens3', 'ens6']                                       # 2-01 hook 2: the lifting pair
SEGMENT_5 = [
    # 2-01 What'd I Miss
    dict(who=['lafayette'], track='2-01', bar=23, beat=3, move='strut', until=72.4, note='Jefferson strides down from the gallery through the scrubbing company (cue 726): the "pimp walk" (clip 2:56; seg5.md Review 3)'),
    dict(who=S5_E8, track='2-01', bar=24, beat=3, move='scrub', until=76.0, note='on their knees scrubbing as he strides down (cue 726; reddit, WatchMojo; seg5.md Review 3)'),
    dict(who=['lafayette'], track='2-01', bar=28, move='bounce', until=97.8, note='Jefferson never stands still: in time through verse 1 (cue 727)'),
    dict(who=S5_E8, track='2-01', bar=29, beat=3, move='rise', counts=2, note='they rise and watch him'),
    dict(who=['lafayette'], track='2-01', bar=38, move='two-step', counts=4, note='the hook: Jefferson dances ("1:38 Thomas dancing")'),
    dict(who=S5_E8, track='2-01', bar=38, move='step-touch', counts=16, note='the hook: the party (cue 728); no step named, the simplest'),
    dict(who=['lafayette'], track='2-01', bar=39, move='moonwalk', counts=8, note='the hook: "1:40 moonwalking" (clip comments; seg5.md Review 3)'),
    dict(who=['lafayette'], track='2-01', bar=41, move='two-step', counts=4, note='the hook\'s last bar'),
    dict(who=['lafayette'], track='2-01', bar=42, move='bounce', until=135.5, note='in time through the Paris aside, the letter and the journey (reddit: he "never stands still"; "the bouncing" at 2:00)'),
    dict(who=['lafayette'], track='2-01', bar=51, beat=4, move='strut', until=150.0, note='his round of the room (135.5-150): the strut ("pimp walk", clip 2:56 - the nearest walk to it)'),
    dict(who=['lafayette'], track='2-01', bar=57, move='bounce', until=188.4, note='in time on through Madison\'s verse (reddit: "even during Madison\'s part")'),
    dict(who=['lafayette'], track='2-01', bar=72, move='two-step', counts=12, note='the hook again (cue 735)'),
    dict(who=[a for a in S5_E8 if a not in S5_LIFT], track='2-01', bar=72, move='step-touch', counts=12, note='the hook again (cue 735)'),
    dict(who=S5_LIFT, track='2-01', bar=72, move='step-touch', counts=6, note='the hook again, up to the lift'),
    dict(who=['ens3'], track='2-01', bar=73, beat=3, move='partner-lift', counts=4, with_='ens6', note='hook 2: the ensemble lift (clip 3:14, "the dancer tore a tendon doing it"; seg5.md Review 3); the pair is a reading'),
    dict(who=S5_LIFT, track='2-01', bar=74, beat=3, move='step-touch', counts=2, note='back into the hook'),
    dict(who=['lafayette'], track='2-01', bar=76, move='bounce', until=211.6, note='the cabinet meeting ahead, until he goes to greet Washington'),
    dict(who=['hamilton'], track='2-01', bar=81, beat=3, move='handshake', counts=2, with_='lafayette', note='the welcome: Hamilton jumps in and takes Jefferson\'s hand (ironinkpen; clip 3:34-3:38)'),
    dict(who=['lafayette'], track='2-01', bar=82, move='laugh-bob', until=221.2, note='Jefferson laughs off the handshake ("Jefferson laughs at him at 3:38") and steps back'),
    dict(who=['lafayette'], track='2-01', bar=84, move='two-step', counts=16, note='the final build (cue 738)'),
    dict(who=S5_E8, track='2-01', bar=84, move='step-touch', counts=16, note='the final build in one line (cue 738)'),
    # 2-02 Cabinet Battle #1
    dict(who=S5_E8, track='2-02', bar=0, beat=4, move='sit', until=7.8, note='the company seated in the V of chairs (ironinkpen; props cabinet-chair-1..8), set in the snap (cue 739.5)'),
    dict(who=S5_E8, track='2-02', bar=3, beat=3, move='reach-up', counts=2, note='the crowd roars (cue 741): up out of their chairs'),
    dict(who=S5_E8, track='2-02', bar=4, move='sit', until=77.3, note='back in their chairs for Jefferson\'s verse'),
    # HELD for a seated layer (above): dict(who=S5_E8, track='2-02', bar=9, move='head-bob', until=77.3, note='heads nodding through Jefferson\'s verse'),
    dict(who=['hamilton'], track='2-02', bar=5, beat=2, move='bow', counts=4, note='he bows when Washington names his plan (clip comment)'),
    dict(who=['washington'], track='2-02', bar=5, beat=4, move='sit', until=77.9, note='in his chair at the SL vertex of the V (cue 742 "chair SL"; ironinkpen: seated with them; props washington-chair)'),
    dict(who=S5_E8, track='2-02', bar=29, move='reach-up', counts=2, note='Jefferson\'s mic drop (cue 749)'),
    dict(who=S5_E8, track='2-02', bar=29, beat=3, move='sit', until=145.5, note='back in their chairs for Hamilton\'s verse'),
    # HELD for a seated layer: dict(who=S5_E8, track='2-02', bar=32, move='head-bob', until=145.5, note='heads nodding through Hamilton\'s verse'),
    dict(who=['washington'], track='2-02', bar=31, beat=3, move='sit', until=145.6, note='back in his chair after the break'),
    dict(who=['hamilton'], track='2-02', bar=34, beat=3, move='prance-fan', counts=4, note='he prances and fans, mocking Jefferson, on the Monticello line (clip 1:25-1:29; TVLine; seg5.md Review 3)'),
    dict(who=S5_E8, track='2-02', bar=54, move='reach-up', counts=2, note='Hamilton\'s mic drop (cue 758)'),
    dict(who=S5_E8, track='2-02', bar=54, beat=3, move='sit', until=157.4, note='back down until the meeting breaks up (157.5 on)'),
    dict(who=['lafayette'], track='2-02', bar=58, move='laugh-bob', counts=8, note='Cabinet Battle #1, not #2 (segment 6 checked #2: no laugh): Jefferson\'s laughing head moves at the gloat (reddit; clip "that cackle" 2:35; seg5.md Review 3)'),
    # 2-04 Say No to This
    dict(who=S5_SN, track='2-04', bar=36, beat=4, move='point-down', counts=4, note='the title hits after the kiss: down at him from the galleries (cue 802; seg5.md Review 3)'),
    dict(who=S5_SN, track='2-04', bar=70, beat=4, move='point-down', counts=4, note='the answering hits (cue 826)'),
    # 2-05 The Room Where It Happens
    dict(who=['mulligan'], track='2-05', bar=15, move='beckon', counts=2, note='Madison motions Hamilton to come (clip comment; seg5.md Review 3)'),
    dict(who=['lafayette'], track='2-05', bar=16, beat=3, move='sit', until=50.0, note='at the table, in the chair he brought (props room-chair-jefferson), until he turns to the house'),
    dict(who=['mulligan'], track='2-05', bar=17, beat=2, move='sit', until=50.2, note='at the table, in the chair he brought (props room-chair-madison), until he turns to the house'),
    dict(who=['hamilton'], track='2-05', bar=17, beat=2, move='sit', until=60.38, note='at the table (props room-chair-hamilton), facing the house across it, until he steps forward'),
    dict(who=['hamilton'], track='2-05', bar=22, move='lunge', counts=4, note='Hamilton steps forward on the immigrant line (ironinkpen)'),
    dict(who=['burr'], track='2-05', bar=22, beat=2, move='aim', counts=2, note='Burr\'s "finger gun" (clip 1:00; seg5.md Review 3 open items): out front, where he faces - the target is not named'),
    dict(who=['hamilton'], track='2-05', bar=23, move='sit', until=97.3, note='back in his chair until he steps out of the room (97.3)'),
    dict(who=['lafayette', 'mulligan'], track='2-05', bar=24, move='lunge', counts=4, mirror='alt', note='Jefferson and Madison step forward on the Virginians line (ironinkpen)'),
    dict(who=['lafayette'], track='2-05', bar=26, beat=2, move='sit', until=96.1, note='back at the table, facing it'),
    dict(who=['mulligan'], track='2-05', bar=26, beat=3, move='sit', until=97.6, note='back at the table, facing it'),
    dict(who=S5_E8, track='2-05', bar=28, move='jazz-roll', counts=8, note='chorus 1, at the sides after the cross: ooey-gooey jazz'),
    dict(who=['lafayette'], track='2-05', bar=39, beat=3, move='strut', until=112.3, note='his account: he crosses DS to Madison (108.5-112.3), the strut ("pimp walk", seg5.md Review 3)'),
    dict(who=['lafayette'], track='2-05', bar=41, beat=4, move='strut', until=116.9, note='the second entry, strutting in, to the kick'),
    dict(who=['lafayette'], track='2-05', bar=42, beat=3, move='kick', counts=1, note='Jefferson\'s kick on the second entry (clip "1:58 the leg")'),
    dict(who=S5_E8, track='2-05', at=118.4, move='shimmy', counts=8, note='the chorus: Burr\'s ego, the shimmy (cue at 118.4)'),
    dict(who=S5_E8, track='2-05', at=118.4, bars=2, move='jazz-roll', counts=8, note='the chorus: ooey-gooey jazz'),
    dict(who=['hamilton'], track='2-05', bar=43, beat=2, move='sit', until=156.6, note='the second entry: at the table until he leaves it (156.6)'),
    dict(who=['lafayette'], track='2-05', bar=43, beat=2, move='sit', until=152.2, note='the second entry: at the table until his approach (152.2)'),
    dict(who=['mulligan'], track='2-05', bar=43, beat=2, move='sit', until=142.0, note='the second entry: at the table until he steps out (142.0)'),
    dict(who=['lafayette'], track='2-05', bar=55, beat=3, move='strut', until=155.4, note='his approach again (152.2-155.4), the strut'),
    dict(who=['mulligan'], track='2-05', bar=63, beat=3, move='beckon', counts=2, note='before chorus 3: Madison motions Hamilton to come, the same as at the top (clip comment)'),
    dict(who=['lafayette'], track='2-05', bar=63, beat=4, move='strut', until=179.2, note='the third entry, strutting in'),
    dict(who=S5_E8, track='2-05', at=176.8, move='shimmy', counts=8, note='the chorus: Burr\'s ego, the shimmy (cue at 176.8)'),
    dict(who=S5_E8, track='2-05', at=176.8, bars=2, move='jazz-roll', counts=8, note='the chorus: ooey-gooey jazz'),
    dict(who=['lafayette'], track='2-05', bar=65, beat=2, move='sit', until=272.4, note='the third entry: at the table through the bridge and the build, until he takes his chair off (882)'),
    dict(who=['mulligan'], track='2-05', bar=65, beat=2, move='sit', until=273.4, note='the third entry: at the table until he takes his chair off (882)'),
    dict(who=['hamilton'], track='2-05', bar=65, beat=2, move='sit', until=209.6, note='the third entry, until he goes DR on his banks line'),
    dict(who=S5_E8, track='2-05', bar=80, move='bojangles', counts=12, note='the bridge: the Bojangles step (Ham4Ham 8/3/15)'),
    dict(who=S5_E8, track='2-05', bar=83, move='shimmy', counts=8, note='the bridge: Hamilton mocks Burr\'s motto - Burr\'s ego'),
    dict(who=S5_E8, track='2-05', bar=85, move='bojangles', counts=12, note='the bridge: the Bojangles step to Hamilton\'s last question'),
    dict(who=['hamilton'], track='2-05', bar=89, beat=3, move='sit', until=271.6, note='back at the table until the three leave with their chairs (882)'),
    dict(who=['burr'] + S5_E8, track='2-05', bar=95, move='jazz-roll', counts=8, note='Burr dances with the ensemble in his build (ironinkpen; clip 4:26)'),
    dict(who=S5_E8, track='2-05', bar=97, move='shimmy', counts=4, note='the build, before Burr drives DS (clip 4:34)'),
    dict(who=['burr'], track='2-05', bar=97, move='chest-pump', counts=4, note='Burr pumps his chest in the build (clip 4:34; Press Herald "chest pops"; seg5.md Review 3)'),
    dict(who=['burr'] + S5_E8, track='2-05', bar=107, move='jazz-roll', counts=8, note='the Dance (cue 890): Burr with the ensemble'),
    dict(who=['burr'] + S5_E8, track='2-05', bar=109, move='shimmy', counts=8, note='the Dance: Burr\'s ego'),
    dict(who=['burr'] + S5_E8, track='2-05', bar=111, move='jazz-roll', counts=8, note='the Dance, to the last click-boom'),
    dict(who=['burr'], track='2-05', bar=113, beat=3, move='point-down', counts=2, note='the final click-boom (cue 892): he points at the ground (ironinkpen; seg5.md Review 3 open items)'),
]
# ===== END SEGMENT 5 =====

# ===== SEGMENT 6 (2-06..2-10) =====
# REVIEW 3 (video text; research/seg6.md "Review 3"). The sources: YouTube comments on the Disney+ clips (playlist
# PLSOfHhku9XxiQuGTppcAc4NPRkja13MSK) and the official clips, ironinkpen's and hamilton-lyrics' Act II staging notes,
# Groff on Colbert, Flicks And The City on the Bullet. No dance is described for 2-06 Schuyler Defeated.
# 2-07 Cabinet Battle #2: Hamilton's answer opens with a step up to the mic, then the outburst and "the hop" (he jumps
# up and down); then he mimes pulling the French king's head out of the basket and holding it up to talk to it - not a
# library move (built of three, below). NOT HERE: the "ha-ha-ha" head moves in Jack's notes are Cabinet
# Battle #1's (2-02, segment 5); #2 has no laugh.
# 2-08 Washington on Your Side: Jefferson's head bob on his rap; "a whole army forms behind them" for the chant (gen6.py
# WOYS_ARMY + ens1); the jump on the curse line (Jefferson and Madison; Burr sits it out, then bounces back in); the
# Bullet dancing round Jefferson and Burr at the digging; the spin at the end.
# 2-09 One Last Time: the company's salute as he leaves. 2-10 I Know Him: the shoo, the shoulder flair, the air quotes,
# the jumping laugh.
# RULING GF (seg6.md Review 3 "Moves the library does not have"):
# 2-07: the head in the basket is built of three library moves in its 8 counts - `point-down` (1-2: the hand down into
#   the basket), `point` (3-4: the head lifted to his face; `point` is the arm up and out), `lean-in` (5-8: his own head
#   tipped to it, asking it). `lean-in` reads closer than `fold` for 5-8 (a fold would put him on the floor). SEATED:
#   the six in their short V of chairs (gen6.py CB2; props cb2-chair-1..6), from the last one's arrival until the first
#   one gets up (956).
# 2-08: Jefferson's head bob "right on the downbeat": `head-bob` (was `bounce`); Madison wagging a finger in "the walk"
#   (973, 137.4-141.0): `finger-wag`.
# 2-09 / 2-10: the King's walk (Groff: one foot in front of the other, as on a tightrope, the crown level), `king-walk`,
#   on his entrance through the deck door (2-09 292.4-294.7), to UC at the top of 2-10 and down to the lip (12-24), and
#   as "that catwalk" from the band's entry (56.2) round the lip until the announcement (89); `shoo` (was `arm-sweep`)
#   and `air-quotes` (was `point`).
S6_ARMY = ['ens2', 'ens3', 'ens4', 'ens5', 'ens6']
S6_CB2 = ['ens1', 'ens2', 'ens3', 'ens4', 'ens5', 'ens6']             # 2-07's V of six (gen6.py CB2)
SEGMENT_6 = [
    dict(who=S6_CB2, track='2-07', bar=5, beat=3, move='sit', until=127.5, note='the six in the short V of chairs (ironinkpen: the same staging as #1; gen6.py; props cb2-chair-1..6) until they clear out (956)'),
    dict(who=['hamilton'], track='2-07', bar=42, beat=3, move='jump', counts=4, note='his answer opens (cue 951): the outburst, two jumps on the spot ("the hop", "jumps / jumps again": video comments; "Ham jumps around": hamilton-lyrics)'),
    dict(who=['hamilton'], track='2-07', bar=56, move='point-down', counts=2, note='the head in the basket (ironinkpen; "hand-puppeting a skull", video comments), counts 1-2: the hand down into the basket'),
    dict(who=['hamilton'], track='2-07', bar=56, beat=3, move='point', counts=2, note='counts 3-4: the head lifted to his face'),
    dict(who=['hamilton'], track='2-07', bar=57, move='lean-in', counts=4, note='counts 5-8: his head tipped to it, asking it, to the punchline snap (cue 953)'),
    dict(who=['lafayette'], track='2-08', at=115.9, move='head-bob', until=121.3, note='Jefferson\'s rap after he decides to quit (cues 970-971): the head bob "right on the downbeat" (video comments; seg6.md Review 3)'),
    dict(who=['ens1'] + S6_ARMY, track='2-08', at=130.25, move='bounce', until=133.83, note='the company has just formed behind the three ("a whole army forms behind them in a split second": video comments): the chant, a pulse'),
    dict(who=['lafayette', 'mulligan'], track='2-08', at=133.83, move='jump', counts=4, note='the curse line: Jefferson and Madison jump ("that jump", "Madison ... jumping": video comments at 2:10-2:12); Burr sits it out'),
    dict(who=S6_ARMY, track='2-08', at=133.83, move='bounce', until=151.6, note='the company keeps the pulse through the curse line, the money and the digging (cues 973-974); off on the final hook'),
    dict(who=['ens1'], track='2-08', at=133.83, move='bounce', until=144.58, note='the Bullet in the line'),
    dict(who=['burr'], track='2-08', at=135.62, move='bounce', counts=4, note='Burr "bounces back into" the chant after the line he does not sing (video comments)'),
    dict(who=['mulligan'], track='2-08', bar=77, move='finger-wag', until=141.0, note='"the walk" (973): Madison wagging a finger as the three walk SL in step (video comments; seg6.md Review 3)'),
    dict(who=['ens1'], track='2-08', at=144.58, move='sway', until=150.8, note='the Bullet "dancing around Jefferson and Burr" at the digging (video comments at 2:24; cue 974); sway stands in for her dance'),
    dict(who=['burr', 'lafayette', 'mulligan'], track='2-08', bar=100, beat=3, move='spin-full', counts=2, note='"the little spin they do at the end" (video comments): a full turn into the button (cue 977)'),
    dict(who=ENS, track='2-09', at=268.0, move='salute', until=281.4, note='"the entire company comes out to salute him" (buzzfeed readers\' list): as he heads upstage through them (cue 998) to his held note (cue 1000)'),
    dict(who=['king'], track='2-09', bar=103, beat=4, move='king-walk', until=294.7, note='he "wanders onto stage" through the deck door (video comments), the King\'s walk (Groff\'s tightrope walk; seg6.md Review 3)'),
    dict(who=['king'], track='2-10', bar=1, move='king-walk', until=2.0, note='on to UC for the first note'),
    dict(who=['king'], track='2-10', bar=7, beat=2, move='king-walk', until=24.0, note='down to the lip'),
    dict(who=['king'], track='2-10', at=42.64, move='shoo', counts=2, note='he shoos the messenger off ("that hand wave", video comments; seg6.md Review 3)'),
    dict(who=['king'], track='2-10', at=56.21, move='shimmy', counts=2, note='"his lil shoulder flair" as the band comes in (cue 1007.5; video comments)'),
    dict(who=['king'], track='2-10', bar=30, beat=3, move='king-walk', until=89.0, note='"that catwalk" on the band, side to side along the lip (video comments; seg6.md Review 3)'),
    dict(who=['king'], track='2-10', at=89.15, move='air-quotes', counts=2, note='the air quotes round one word of the announcement (ironinkpen, hamilton-lyrics)'),
    dict(who=['king'], track='2-10', bar=48, beat=3, move='jump', counts=4, note='the laugh: "when he started jumping and giggling" (video comments)'),
]
# ===== END SEGMENT 6 =====

# ===== SEGMENT 7 (2-11..2-16) =====
# REVIEW 3 (video evidence: the comments on the Disney+ clips in Jack's playlist, read as text - tools/blocking/research/
# seg7.md "Review 3"). The names below are seg7_gen.py's.
# 2-11 The Adams Administration. The King "jamming out on his chair" UL from 0:07 until he runs off after the papers drop
# (clip jpFsc2bDXUk; Burr turns at 0:12 and sees him): bounce.
# 2-12 We Know. "Daveed's backwards walk" on Burr's line (~0:32) and again as he recoils from the letter (1:28): Jefferson
# walks backwards (rewind: her back to her path) on the two legs seg7_gen.py slows down for it.
# 2-13 Hurricane. Blankenbuehler (Backstage): the ensemble swivels round him on the turntable "hoisting furniture overhead
# as in a storm"; the clip (9rVURq5isnY) at 1:38: "the people holding the furniture ... like debris flying all around".
# ens1-ens4 carry chairs (props.py: pamphlet-chair, pamphlet-chair-2, storm-chair-1/2) and hoist them on the storm memory
# (cue 1033, 23.76, as the ring is flung out) and through the montage (cues 1037 to the still point 1038, 70.47-97.38),
# rippled a fifth of a second apart. ens5-ens8 (the mother and her bearers among them) carry nothing and do not hoist.
# The "cockroaches": the men crawl backward in slow motion (ens2 and ens4 along the DS edge, 116.28-129.0; the place is
# invented, the lyric about ego is Blankenbuehler's). Burr "looms up in the foreground" holding his book like a pistol at
# his motif (clip 2:02-2:03): point (the nearest move to an aim; see the report).
# 2-14 The Reynolds Pamphlet. Jefferson "bopping" on the desk (35.5-41); the King dancing at King DR (cue 1042, 41) and
# his raucous tag and gloat (51.16-53.8); round Angelica the dancers move in slow motion into a wall and ooze out
# (Blankenbuehler): wall-ooze from her arrival (55.49) through her verse (to about 79), 8 counts at a time. Chorus 2 (88):
# the mocking ring dances round him in sync (two-step, double time on the 71-BPM grid = the song's 142), the three DS
# bounce; then "six to eight bars of freestyle ... paper flying everywhere and everyone's letting loose" (an ensemble
# member, Jack's notes) - placed on "at least he was honest with our money" (cue 101.45; "the ensemble dancing during
# the 'at least he was honest' part" - clip comments): 16 grid counts = 8 bars at 142, from bar 30. Freestyle is each
# dancer doing her own thing (comments: "the background actors don't have any choreography, they just dance around
# however they want"), so each gets a different general move.
# 2-16 Blow Us All Away. The Bullet (ens1, as Martha) twirls as Philip leaves the two women (clip A1ufXcZwBxI: "her
# twirl at 0:50", the second hook).
# RULING GF (seg7.md Review 3 "Moves needed that do not exist"): Burr's book held like a pistol, `aim` (was `point`);
# Jefferson on the desk "making it rain" and the three DS "hurling pages", `make-it-rain` (was `bounce`); the King DR
# "fanning himself with a pamphlet", `prance-fan` (was `two-step`: the King's prancing fan); in the freestyle one dancer
# down on the floor ("the worm", "rolling in the pages like a pool": `floor-freestyle`, was `jump`) and one throwing the
# pages (`make-it-rain`, was `bounce`), the rest as round 1.
# SEATED (`sit`): 2-11 the King on his stool UL (seg7_gen.py "a stool is brought; he sits and watches"; props
# king-stool) until he runs off. His jamming there (clip 0:07, round 1's `bounce`) is HELD: a move overrides a sit and the
# sit does not come back, so the bounce would stand him up for the whole number; it goes back on the line commented below
# when the page can lay an upper-body move on a seated body. 2-13/2-14 Hamilton at his desk on his chair at C, set
# behind him at the decision (2-13 133.0; props pamphlet-chair, "his chair behind it", hamilton-lyrics), until he climbs
# onto the desk (2-14 19.5). 2-15 Eliza on her bench whenever the blocking puts her back on it (seg7_gen.py BENCH; props
# burn-bench). 2-16 the four on the theatre chairs, the play's audience (ironinkpen; props theatre-chair-1..4), until
# they turn to watch the quarrel (59.6).
FREESTYLE7 = [('ens5', 'grind', 1), ('ens1', 'two-step', 2), ('ens6', 'shimmy', 1), ('ens7', 'floor-freestyle', 1), ('ens8', 'make-it-rain', 2),
              ('ens2', 'stomp', 2), ('ens9', 'jazz-roll', 1), ('ens3', 'kick', 2), ('ens10', 'arm-sweep', 1)]
RING7 = ['ens1', 'ens2', 'ens3', 'ens5', 'ens6', 'ens7', 'ens8', 'ens9']       # the Pamphlet horseshoe / ring (E8)
SEGMENT_7 = [
    dict(who=['king'], track='2-11', bar=3, beat=2, move='sit', until=34.5, note='on his stool UL, watching (seg7_gen.py; props king-stool) until he runs off after the papers drop (34.6)'),
    # HELD for a seated layer (above): dict(who=['king'], track='2-11', at=6.0, move='bounce', until=33.28, note='jamming on his stool UL (clip 0:07)'),
    dict(who=['lafayette'], track='2-12', at=29.9, move='rewind', until=33.72, note='Jefferson\'s backwards walk down to DSC (clip ~0:32)'),
    dict(who=['lafayette'], track='2-12', bar=29, move='rewind', until=83.4, note='he recoils from the letter, walking backwards (clip 1:28)'),
    dict(who=['ens1', 'ens2', 'ens3', 'ens4'], track='2-13', at=23.76, move='hoist', until=34.33, canon=0.2, note='the storm memory: the chairs hoisted overhead as the ring is flung out (cue 1033)'),
    dict(who=['ens1', 'ens2', 'ens3', 'ens4'], track='2-13', at=70.47, move='hoist', until=97.38, canon=0.2, note='the montage: furniture overhead like debris round him (clip 1:38), to the still point'),
    dict(who=['ens2', 'ens4'], track='2-13', at=116.28, move='crawl-back', until=129.0, note='the cockroaches (seg7: ens2 and ens4 cross the downstage edge 116.28 to 129.0)'),
    dict(who=['burr'], track='2-13', at=116.28, move='aim', counts=4, note='his motif: the book held like a pistol (clip 2:02-2:03; seg7.md Review 3)'),
    dict(who=['hamilton'], track='2-13', bar=46, beat=4, move='sit', until=142.8, note='the decision: his chair set behind him at C (133.0; props pamphlet-chair), at the desk'),
    dict(who=['hamilton'], track='2-14', bar=0, beat=2, move='sit', until=18.5, note='at his desk, his chair behind it (hamilton-lyrics), until he climbs onto the desk (19.5)'),
    dict(who=['lafayette'], track='2-14', bar=10, beat=4, move='make-it-rain', until=41.0, speed=2, note='bouncing on the desk, making it rain (ClownOwO comments; seg7.md Review 3)'),
    dict(who=['king'], track='2-14', bar=12, beat=2, move='prance-fan', until=51.16, speed=2, note='King DR (cue 1042): dancing, fanning himself with a pamphlet'),
    dict(who=['king'], track='2-14', bar=15, beat=2, move='shimmy', until=53.8, note='the raucous tag (51.16) and the gloat, then the prissy step to Hamilton'),
    dict(who=RING7, track='2-14', bar=16, beat=3, move='wall-ooze', counts=8, note='round Angelica: the slow-motion wall, from her arrival (cue 1045, 55.49)'),
    dict(who=RING7, track='2-14', bar=19, beat=3, move='wall-ooze', counts=8, note='round Angelica: the wall again as the ring closes round the pair (66)'),
    dict(who=RING7, track='2-14', bar=21, beat=3, move='wall-ooze', counts=8, note='round Angelica: and again, to her climax (81.17)'),
    dict(who=RING7, track='2-14', bar=26, beat=3, move='two-step', until=100.9, speed=2, note='chorus 2: the mocking ring dances round him (in sync; the sources say they dance, not what)'),
    dict(who=['lafayette', 'mulligan', 'burr'], track='2-14', bar=26, beat=3, move='make-it-rain', until=115.66, speed=2, note='chorus 2: the three DS, bopping and hurling pages'),
    *[dict(who=[a], track='2-14', bar=30, move=mv, counts=16, speed=sp, note='the freestyle with the pages: each her own (8 bars at 142)')
      for a, mv, sp in FREESTYLE7],
    dict(who=['eliza'], track='2-15', bar=3, beat=2, move='sit', until=41.8, note='on the bench in the window light (seg7_gen.py; props burn-bench) until she stands and circles behind it'),
    dict(who=['eliza'], track='2-15', bar=24, beat=3, move='sit', until=73.8, note='rereading on the bench'),
    dict(who=['eliza'], track='2-15', bar=57, move='sit', until=148.0, note='she withdraws to the bench'),
    dict(who=['eliza'], track='2-15', bar=78, beat=3, move='sit', until=211.0, note='quieter, the bench, until she takes the lantern'),
    dict(who=['ens1'], track='2-16', bar=19, beat=3, move='spin-full', counts=2, note='the Bullet\'s twirl as Philip leaves them (clip 0:50, the second hook)'),
    dict(who=['ens7', 'ens2'], track='2-16', bar=19, beat=3, move='sit', until=59.0, note='the theatre: the play\'s audience on the chairs SL facing SR (ironinkpen; props theatre-chair-1, -2) until they turn to the quarrel'),
    dict(who=['ens4', 'ens3'], track='2-16', bar=20, beat=2, move='sit', until=59.0, note='the theatre audience (props theatre-chair-4, -3)'),
]
# ===== END SEGMENT 7 =====

# ===== SEGMENT 8 (2-17..2-23) =====
# 2-22 The World Was Wide Enough. The Bullet (ens1, gen_seg8.py) takes Burr's shot at his pistol at FIRE and walks it in
# slow motion, the bullet held out ahead. At "Legacy" (cue 1248, 129.9): Hamilton's My Shot phrase, the shot thrown UP
# (Blankenbuehler: at the end of the show "we're throwing the bullet up in the air"). The rowers: ens8 and ens9 sit either
# side of him after the shot and row (Blankenbuehler: "the rowers… rowing next to him").
# REVIEW 3 (video evidence; tools/blocking/research/seg8.md "Review 3" has every source):
# 2-18: the film's editor - "the women start leaning forward and the men catch them ... the men pull them back and then the
# entire ensemble starts to rotate in the other direction" (the rotation reverses at 68.0): one of each couple pitches
# forward from the waist and comes back up, the bar before: RULING GF `catch` - the catcher (the lead, who does the
# catching) with the one who pitches forward (the mate): ens2 / ens1, ens3 / ens4, ens5 / ens6, ens8 / ens7, the four
# couples of gen_seg8.py, 0.6 m apart (the reviewer's "woman of each couple" is the mate).
# 2-19: the Disney+ clip's comments (it runs ~5 s ahead of the album): one of the townspeople "did an extra spin" (clip
# 1:33); Jefferson's "lil jump" at the endorsement (clip 2:55).
# 2-20: "the dancers swayed" through Burr's rant about the room (bars 8-14); the editor's "lean thing" as it escalates.
# 2-22: hamilton-lyrics' staging account - the ensemble pats their hearts (Burr's pulse) at his confession; the seconds kneel
# as he cuts through them and rise as he passes back; he points at Hamilton. The Bullet creeps the whole way (Dance
# Magazine: "traverses across the stage toward him in slow motion"). At "Legacy" the ensemble dances behind him - a comment
# on the film: they do the My Shot phrase in the monologue - and forms the My Shot pose round him on the box. From "Eyes
# UP" the knot round her slows the bullet with her (Blankenbuehler, Broadway Direct: "every cast member joins her to help
# slow down the bullet") and lifts her at his mother (hamilton-lyrics). Washington "swordfighting the air". Hamilton aims
# upward, away from Burr; hit, he folds and is rowed (clockwise, gen_seg8.py), and "slowly stands, facing upstage".
# 2-23: the bows (Harmon Writes: they bow in place), on the ruled line.
# RULING GF (seg8.md Review 3 "Moves wanted"): 2-20 Charles Lee "comes out holding his side" (`hold-side`, ens3, 60.5 to
# 66) and the six's lean toward the desk (`lean-in`, was `lunge`); 2-22 Burr's aim from FIRE (he takes his place facing
# Hamilton at 100.6; the Bullet takes the shot at his pistol), held frozen through his ride to the shot (191.18) - the
# page turns a carried body with its path, so the aim turns with the ride (seg8.md "Evidence for Jack"); Hamilton aims
# UP (`aim-up`, was `point`), and folds when hit (`fold`, was `kneel`; the seconds still `kneel`, as the account has
# it); Washington "swordfighting the air" (`sabre`, was `lunge`); the Bullet lifted at his mother (`lift`: ens6, beside
# her in the knot, lifts her; the rest of the knot keep `hoist` under her - one `with` per lead, so one lifter is
# written, two or three are described); 2-23 Eliza's gasp (cue 1296, 210.98; "her hands to her heart"): `gasp`.
# SEATED (`sit`): 2-20 Burr at the desk centre (cue 1193 "Burr seated at a desk"; props desk-chair) and then Hamilton at
# it writing his list (gen_seg8.py); 2-21 Hamilton at his desk near SR, writing (ironinkpen; the clip: "He sits in a
# chair writing"), into the top of 2-22, where he rises from it (hamilton-lyrics).
KNOT22 = ['ens2', 'ens3', 'ens4', 'ens5', 'ens6', 'ens7', 'ens8']    # 2-22: the knot round the Bullet (gen_seg8.py)
SEGMENT_8 = [
    dict(who=['ens2'], track='2-18', bar=36, move='catch', counts=4, with_='ens1', note='Quiet Uptown: the women lean forward and the men catch them and pull them back (the film\'s editor; seg8.md Review 3); the rotation then reverses (68.0)'),
    dict(who=['ens3'], track='2-18', bar=36, move='catch', counts=4, with_='ens4', note='the second couple'),
    dict(who=['ens5'], track='2-18', bar=36, move='catch', counts=4, with_='ens6', note='the third couple'),
    dict(who=['ens8'], track='2-18', bar=36, move='catch', counts=4, with_='ens7', note='the fourth couple'),
    dict(who=['ens2'], track='2-19', at=88.0, move='spin-full', counts=2, note='the townspeople: one of them does an extra spin (Disney+ clip comment at 1:33)'),
    dict(who=['lafayette'], track='2-19', at=170.0, move='jump', counts=2, note='Jefferson\'s little jump of joy at the endorsement (clip comment at 2:55)'),
    dict(who=['ens1', 'ens6', 'ens7', 'ens8', 'ens9', 'ens10'], track='2-20', bar=8, move='sway', until=29.2, note='"the dancers swayed" through Burr\'s rant about the room (clip comments; "everyone was dancing")'),
    dict(who=['burr'], track='2-20', bar=15, beat=3, move='sit', until=67.0, note='Burr seated at the desk centre (cue 1193; gen_seg8.py; props desk-chair), until he gives it up'),
    dict(who=['ens3'], track='2-20', bar=27, move='hold-side', until=66.0, note='"the actor who plays Charles Lee comes out holding his side" (clip 1:01; seg8.md Review 3), on and off SR'),
    dict(who=['hamilton'], track='2-20', bar=35, beat=2, move='sit', until=147.5, note='Hamilton takes the desk and writes his list (gen_seg8.py; props desk-chair) until the blackout (cue 1206)'),
    dict(who=['ens1', 'ens6', 'ens7', 'ens8', 'ens9', 'ens10'], track='2-20', bar=52, move='lean-in', counts=3, note='the editor\'s "lean thing": the country leans in toward the two men as it escalates (seg8.md Review 3)'),
    dict(who=['hamilton'], track='2-21', bar=1, beat=2, move='sit', until=46.5, note='at his desk near SR, writing (ironinkpen; "He sits in a chair writing", clip; props desk-chair)'),
    dict(who=['hamilton'], track='2-22', bar=0, beat=4, move='sit', until=3.6, note='still at the desk; he rises from it at the top (hamilton-lyrics)'),
    dict(who=['ens5', 'ens6', 'ens7', 'ens8', 'ens9', 'ens10'], track='2-22', bar=26, move='heartbeat', counts=8, note='Burr\'s confession: the ensemble pats their hearts, his pulse rising (hamilton-lyrics)'),
    dict(who=['ens2', 'ens3'], track='2-22', bar=32, beat=3, move='kneel', counts=8, note='the seconds kneel as Burr cuts through them (hamilton-lyrics)'),
    dict(who=['burr'], track='2-22', bar=33, move='point', counts=4, note='he points and shouts at Hamilton (hamilton-lyrics)'),
    dict(who=['ens2', 'ens3'], track='2-22', bar=34, beat=3, move='rise', counts=2, note='they rise as he passes back'),
    dict(who=['burr'], track='2-22', bar=44, beat=2, move='aim', until=191.18, note='FIRE (cue 1242): at his place facing Hamilton, the pistol levelled; frozen in the aim through his ride to the shot (gen_seg8.py "the frozen Burr")'),
    dict(who=['ens1'], track='2-22', bar=44, beat=3, move='bullet', until=155.46, note='the Bullet creeps from Burr\'s pistol to the centre: "creeps closer throughout", at the centre on "eyes up"'),
    dict(who=['hamilton'], track='2-22', at=129.9, move='legacy', counts=8, note='"Legacy" (cue 1248): the My Shot phrase, the shot thrown up'),
    dict(who=['ens2', 'ens3', 'ens4', 'ens5', 'ens6', 'ens7', 'ens8'], track='2-22', at=129.9, move='legacy', counts=8, note='the ensemble dances behind him DR (hamilton-lyrics; a film comment: the My Shot phrase in the monologue)'),
    dict(who=['ens2', 'ens3', 'ens4', 'ens5', 'ens6', 'ens7', 'ens8', 'ens9'], track='2-22', bar=63, beat=3, move='my-shot', speed=4, until=149.9, note='"America" Center pose: the My Shot pose round him on the box (hamilton-lyrics); the phrase at 4x to its end shape, held'),
    dict(who=['ens2', 'ens3', 'ens4', 'ens5', 'ens6', 'ens7', 'ens8'], track='2-22', at=155.46, move='bullet', until=164.4, note='"Eyes UP": the knot round the Bullet - every cast member joins her to slow the bullet down (Blankenbuehler)'),
    dict(who=['washington'], track='2-22', at=160.0, move='sabre', counts=4, note='Washington beside him, "swordfighting the air" (hamilton-lyrics; seg8.md Review 3)'),
    dict(who=['ens6'], track='2-22', bar=73, move='lift', until=168.9, with_='ens1', note='the Bullet lifted into the air at his mother (hamilton-lyrics; seg8.md Review 3): ens6, beside her in the knot, lifts her'),
    dict(who=[a for a in KNOT22 if a != 'ens6'], track='2-22', bar=73, move='hoist', until=168.9, note='the rest of the knot under her, arms up (nothing carried)'),
    dict(who=['ens1'], track='2-22', at=174.5, move='bullet', until=191.18, note='ELIZA: the knot blown away, she carries it on to him'),
    dict(who=['hamilton'], track='2-22', bar=83, beat=2, move='aim-up', until=191.18, note='he aims upward, away from Burr (hamilton-lyrics; seg8.md Review 3)'),
    dict(who=['hamilton'], track='2-22', bar=84, beat=4, move='fold', until=221.0, note='hit: he folds at the waist and hangs there (hamilton-lyrics; seg8.md Review 3)'),
    dict(who=['ens8', 'ens9'], track='2-22', bar=89, beat=3, move='row', until=213.0, mirror='alt', note='the rowers either side of him while the platform turns him (clockwise)'),
    dict(who=['hamilton'], track='2-22', at=222.0, move='rise', counts=2, note='"Hamilton slowly stands, facing upstage" (hamilton-lyrics)'),
    dict(who=['eliza'], track='2-23', bar=65, beat=3, move='gasp', counts=2, note='the gasp (cue 1296, 210.98): both hands to her heart (the official upload\'s comments; seg8.md Review 3), held into the blackout'),
    dict(who=EVERYONE + ['king'], track='2-23', bar=66, beat=4, move='bow', counts=2, note='the bows: in the line, a bow from the waist (Harmon Writes: they bow in place)'),
]
# ===== END SEGMENT 8 =====


OUT_MOVES = {}
MISSING = []                                                          # moves named here that the library lacks
KEYS = {'who', 'track', 'at', 'bars', 'bar', 'beat', 'move', 'counts', 'until', 'mirror', 'canon', 'speed', 'reverse', 'with_',
        'note'}
CAST = {a['id'] for a in json.load(open(os.path.join(ROOT, 'tools', 'hamilton-cast.json'), encoding='utf-8'))['actors']}
PAIR_REQUIRED = {'lift', 'catch', 'partner-lift', 'comfort'}           # RULING GF (the library's `pair: "required"` once exported)


def put(e):
    """One entry -> one move per actor in `who`, in OUT_MOVES."""
    bad = set(e) - KEYS
    assert not bad, f'{e.get("track")} {e.get("move")}: unknown key(s) {sorted(bad)}'
    tid, move = e['track'], e['move']
    if move not in MOVES:
        MISSING.append(f'{tid} {e["who"]}: no move "{move}" in tools/hamilton-moves.json')
    assert all(a in CAST for a in e['who']), f'{tid} {move}: {e["who"]} has an id not in tools/hamilton-cast.json'
    mate = e.get('with_')
    if mate is not None:                                              # RULING GF: the partner, on the lead's entry only
        assert len(e['who']) == 1, f'{tid} {move}: `with` goes on ONE lead (who={e["who"]})'
        assert mate in CAST and mate != e['who'][0], f'{tid} {move}: with_={mate!r} must be another cast id'
    elif (MOVES[move].get('pair') == 'required') if move in MOVES else move in PAIR_REQUIRED:
        raise AssertionError(f'{tid} {e["who"]}: {move} needs with_=<the partner\'s id> (RULING GF)')
    assert ('at' in e) != ('bar' in e), f'{tid} {move}: give at= (seconds) or bar= (and beat=), not both'
    assert ('counts' in e) != ('until' in e), f'{tid} {move}: give counts= or until=, not both'
    if 'at' in e:
        at = downbeat(tid, e['at'], e.get('bars', 0))
    else:
        at = round(beat_time(tid, e['bar'], e.get('beat', 1)), 3)
    counts = e['counts'] if 'counts' in e else counts_between(tid, e['at'] if 'at' in e else at, e['until'])
    for k, a in enumerate(e['who']):
        o = {'track': tid, 'at': at, 'move': move, 'counts': counts}
        m = e.get('mirror')
        if m == 'alt':
            if k % 2: o['mirror'] = True
        elif m: o['mirror'] = True
        if e.get('canon') and k: o['canon'] = round(e['canon'] * k, 3)
        for key in ('speed', 'reverse'):
            if e.get(key): o[key] = e[key]
        if mate: o['with'] = mate
        if e.get('note'): o['note'] = e['note']
        OUT_MOVES.setdefault(a, []).append(o)


def check(n):
    """Merge segments/segN.json + dance.json in a temp folder; print what the merge says."""
    seg = os.path.join(HERE, 'segments', f'seg{n}.json')
    tmp = tempfile.mkdtemp(prefix='dance-check-')
    try:
        shutil.copy(seg, tmp); shutil.copy(OUT, tmp)
        r = subprocess.run([sys.executable, '-I', os.path.join(ROOT, 'tools', 'blocking-merge.py'), tmp,
                            '--out', os.path.join(tmp, 'merged.json')], capture_output=True, text=True, encoding='utf-8')
        print(r.stdout + r.stderr)
        return r.returncode
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main(argv):
    for e in SEGMENT_1 + SEGMENT_2 + SEGMENT_3 + SEGMENT_4 + SEGMENT_5 + SEGMENT_6 + SEGMENT_7 + SEGMENT_8:
        put(e)
    for a in OUT_MOVES:
        OUT_MOVES[a].sort(key=lambda o: (o['track'], o['at']))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        json.dump({'by': 'tools/blocking/dance.py (RULING FV)', 'moves': OUT_MOVES}, f, indent=1, ensure_ascii=False)
    n = sum(len(v) for v in OUT_MOVES.values())
    print(f'{OUT}: {n} moves for {len(OUT_MOVES)} actors')
    for m in MISSING: print('ERROR  ', m)                       # written anyway: the merge rejects them too
    if argv[:1] == ['--check']:
        return check(int(argv[1])) or (1 if MISSING else 0)
    return 1 if MISSING else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
