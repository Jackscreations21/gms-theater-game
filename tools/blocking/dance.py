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

A move given to someone who is offstage at that moment is harmless (an unseen body is not posed), so a number's
company is named whole where the sources say "the company" or "the ensemble".

Format written (the merge validates it; docs/hamilton-blocking-format.md):

    { "moves": { "<actor id>": [ { "track", "at", "move", "counts", "mirror"?, "canon"?, "speed"?, "reverse"?,
                                   "note"? }, ... ] } }

HOW AN ENTRY IS WRITTEN. One `dict(...)` per entry, in a segment's list:

    who     the actors: a list of ids (tools/hamilton-cast.json), or a group below (FOUR, ENS, SISTERS, EVERYONE,
            SOLDIERS; `ENS[:8]` is ens1..ens8). Each one gets the move.
    track   the album track, '1-01' ... '2-23'.
    WHEN — one of:
      at=<s> [, bars=<n>]   a time in seconds into the track (a cue's time, read off the show file or the page),
                            SNAPPED to the nearest downbeat, then moved on `bars` whole bars (negative = earlier).
      bar=<n> [, beat=<b>]  the downbeat of bar n (or its beat b), both counted from 1 from the track's first
                            downbeat (`firstBeat` in the beats file). Find a bar with beats.py (below).
    move    a name in tools/hamilton-moves.json (the file asserts it).
    counts  how many beats it lasts: a number, or `until=<s>` in place of counts to run it to that time (whole beats).
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
# 1-03 My Shot. Blankenbuehler (WSJ): the signature phrase is "just like my country I'm young, scrappy and hungry, and
# I'm not throwing away my shot". Each half-chorus is 4 bars: two lines of "I am not throwing away my shot", then "Hey
# yo, I'm just like my country…" — so the phrase starts 2 bars into each half (cues 109 / 110, 121 / 122, 135 / 136: the
# chorus sections).
# 1-05 The Schuyler Sisters. Angelica's declaration (cue 166, 105.9): "We hold these truths to be self-evident that all
# men are created equal" — the equals-sign arms on the second bar; "…include women in the sequel. Work!" — the two
# fingers up, 4 bars in.
SEGMENT_1 = [
    dict(who=FOUR + ENS, track='1-03', at=73.9, bars=2, move='my-shot', counts=8, note='the signature phrase, "Hey yo, I\'m just like my country…" (chorus at cue 73.9 + 2 bars)'),
    dict(who=FOUR + ENS, track='1-03', at=84.4, bars=2, move='my-shot', counts=8, note='the signature phrase, "Hey yo, I\'m just like my country…" (chorus at cue 84.4 + 2 bars)'),
    dict(who=FOUR + ENS, track='1-03', at=168.2, bars=2, move='my-shot', counts=8, note='the signature phrase, "Hey yo, I\'m just like my country…" (chorus at cue 168.2 + 2 bars)'),
    dict(who=FOUR + ENS, track='1-03', at=180.0, bars=2, move='my-shot', counts=8, note='the signature phrase, "Hey yo, I\'m just like my country…" (chorus at cue 180.0 + 2 bars)'),
    dict(who=FOUR + ENS, track='1-03', at=296.4, bars=2, move='my-shot', counts=8, note='the signature phrase, "Hey yo, I\'m just like my country…" (chorus at cue 296.4 + 2 bars)'),
    dict(who=FOUR + ENS, track='1-03', at=307.1, bars=2, move='my-shot', counts=8, note='the signature phrase, "Hey yo, I\'m just like my country…" (chorus at cue 307.1 + 2 bars)'),
    dict(who=SISTERS, track='1-05', at=105.9, bars=1, move='equals', counts=4, note='"…that all men are created equal": the equals sign'),
    dict(who=SISTERS, track='1-05', at=105.9, bars=4, move='work', counts=2, note='"…include women in the sequel. Work!"'),
]
# ===== END SEGMENT 1 =====

# ===== SEGMENT 2 (1-07..1-11) =====
# 1-08 Right Hand Man. Blankenbuehler: the My Shot phrase returns "in the middle of Right Hand Man". Placed where
# Hamilton accepts (cue 286, 264.06) — a GUESS at the bar; check it with the music.
# 1-10 Helpless. Blankenbuehler: Helpless / Satisfied is a gavotte's formality — palms touching, the distance between
# them — "and then about 20 seconds later, they're grinding". The ball (cue 300.6, 28.24); the couples alternate sides.
# 1-11 Satisfied. The rewind (cues 366.2 to 366.8, 46.74 to 57.62): the company runs backwards in slow motion (Dance
# Magazine: "he literally rewinds portions of the choreography from Helpless"). Then the ball again from Angelica's side
# (cue 369, 71.64).
SEGMENT_2 = [
    dict(who=['hamilton'] + ENS, track='1-08', at=264.06, bars=2, move='my-shot', counts=8, note='the My Shot phrase in the middle of Right Hand Man (placement guessed)'),
    dict(who=ENS[:8], track='1-10', at=28.24, move='gavotte', counts=16, mirror='alt', note='the ball: the gavotte, palm to palm'),
    dict(who=ENS[:8], track='1-10', at=28.24 + 20.0, move='grind', counts=8, mirror='alt', note='"twenty seconds later, they\'re grinding"'),
    dict(who=EVERYONE, track='1-11', at=46.74, move='rewind', until=57.62, note='the rewind (cues 366.2 to 366.8)'),
    dict(who=ENS[:8], track='1-11', at=71.64, move='gavotte', counts=16, mirror='alt', note='the ball replayed from Angelica\'s side'),
]
# ===== END SEGMENT 2 =====

# ===== SEGMENT 3 (1-12..1-17) =====
SEGMENT_3 = [
]
# ===== END SEGMENT 3 =====

# ===== SEGMENT 4 (1-18..1-23) =====
# 1-20 Yorktown (The World Turned Upside Down). Blankenbuehler (WSJ, "Breaks Down His Moves"): the marching troops freeze
# and play out Hamilton's thought — "I imagined death so much it feels more like a memory" — then "weapon in my hand, a
# command, and boom"; the heartbeat as he thinks of Eliza; the hip-hop march for "we gotta go, we gotta get the job
# done". The 35-pound musket in the battle. "The world turned upside down": the furniture lifted and held upside down
# (the reddit staging notes) — nobody carries furniture in Yorktown in props.py yet, so the arms go up empty (FUTURE.md).
SEGMENT_4 = [
    dict(who=SOLDIERS, track='1-20', at=32.2, bars=2, move='my-shot', counts=8, note='the My Shot reprise (cue 590)'),
    dict(who=SOLDIERS, track='1-20', at=51.2, move='imagine-death', counts=8, note='"I imagined death so much it feels more like a memory" (cue 592)'),
    dict(who=SOLDIERS, track='1-20', at=51.2, bars=2, move='command', counts=4, note='"…weapon in my hand, a command, and boom"'),
    dict(who=SOLDIERS, track='1-20', at=61.2, move='heartbeat', counts=8, note='thinking of Eliza: the heartbeat (cue 593)'),
    dict(who=SOLDIERS, track='1-20', at=66.7, move='hiphop-march', counts=16, note='"we gotta go, we gotta get the job done" (cue 594)'),
    dict(who=SOLDIERS, track='1-20', at=129.9, move='musket', counts=8, note='the drill (cue 601)'),
    dict(who=SOLDIERS, track='1-20', at=146.0, move='musket', counts=8, note='the battle resumes (cue 605)'),
    dict(who=SOLDIERS, track='1-20', at=198.4, move='upside-down', counts=16, note='"the world turned upside down" (cue 609)'),
]
# ===== END SEGMENT 4 =====

# ===== SEGMENT 5 (2-01..2-05) =====
# 2-05 The Room Where It Happens. Blankenbuehler: the ensemble is Burr's ego, mocking him — the Fosse-like upper-body
# shimmy; Dance Magazine: "ooey-gooey jazz". On the choruses (cues 867.3, 867.8). Burr circles the lit circle and never
# crosses it until the end: a path rule, for the generators (docs/hamilton-dance-moves.md).
SEGMENT_5 = [
    dict(who=ENS, track='2-05', at=118.4, move='shimmy', counts=8, note='the chorus: Burr\'s ego, the shimmy (cue at 118.4)'),
    dict(who=ENS, track='2-05', at=118.4, bars=2, move='jazz-roll', counts=8, note='the chorus: ooey-gooey jazz'),
    dict(who=ENS, track='2-05', at=176.8, move='shimmy', counts=8, note='the chorus: Burr\'s ego, the shimmy (cue at 176.8)'),
    dict(who=ENS, track='2-05', at=176.8, bars=2, move='jazz-roll', counts=8, note='the chorus: ooey-gooey jazz'),
]
# ===== END SEGMENT 5 =====

# ===== SEGMENT 6 (2-06..2-10) =====
SEGMENT_6 = [
]
# ===== END SEGMENT 6 =====

# ===== SEGMENT 7 (2-11..2-16) =====
# 2-13 Hurricane. Blankenbuehler (Backstage): the ensemble swivels round him on the turntable "hoisting furniture overhead
# as in a storm"; the men crawl backward in slow motion — the "cockroaches". The crawl is ens2 and ens4 along the
# downstage edge (seg7_gen.py, its placement invented); the storm is the montage (cue 1037, 70.47).
# 2-14 The Reynolds Pamphlet. Blankenbuehler (Backstage): as Angelica confronts him, "all the dancers around her are
# moving in slow motion — but they're hitting a wall, and they kind of ooze out of it". From her arrival (cue 1045,
# 55.49) and again as she turns to Eliza (65.52).
SEGMENT_7 = [
    dict(who=['ens1', 'ens3', 'ens5', 'ens6', 'ens7', 'ens8', 'ens9', 'ens10'], track='2-13', at=70.47, move='hoist', counts=16, note='the storm: furniture overhead (nothing carried yet: the arms go up empty)'),
    dict(who=['ens2', 'ens4'], track='2-13', at=116.28, move='crawl-back', until=129.0, note='the cockroaches (seg7: ens2 and ens4 cross the downstage edge 116.28 to 129.0)'),
    dict(who=ENS, track='2-14', at=55.49, move='wall-ooze', counts=8, note='round Angelica: the slow-motion wall (cue at 55.49)'),
    dict(who=ENS, track='2-14', at=65.52, move='wall-ooze', counts=8, note='round Angelica: the slow-motion wall (cue at 65.52)'),
]
# ===== END SEGMENT 7 =====

# ===== SEGMENT 8 (2-17..2-23) =====
# 2-22 The World Was Wide Enough. The Bullet (ens1, gen_seg8.py): enters at Burr's pistol at 100.4 and drifts to the
# centre by 129.0 — the slow-motion walk with the bullet held out ahead. "Legacy, what is a legacy?" (cue 1248, 129.9):
# Hamilton's My Shot phrase, the shot thrown UP (Blankenbuehler: at the end of the show "we're throwing the bullet up in
# the air"). The rowers: ens8 and ens9 sit either side of him after the shot (201.5) and row (Blankenbuehler: "the
# rowers… rowing next to him").
SEGMENT_8 = [
    dict(who=['ens1'], track='2-22', at=100.4, move='bullet', until=129.0, note='the Bullet carries Burr\'s shot to the centre'),
    dict(who=['hamilton'], track='2-22', at=129.9, move='legacy', counts=8, note='"Legacy, what is a legacy?" (cue 1248)'),
    dict(who=['ens8', 'ens9'], track='2-22', at=202.0, move='row', counts=8, mirror='alt', note='the rowers beside him'),
]
# ===== END SEGMENT 8 =====


OUT_MOVES = {}
KEYS = {'who', 'track', 'at', 'bars', 'bar', 'beat', 'move', 'counts', 'until', 'mirror', 'canon', 'speed', 'reverse', 'note'}


def put(e):
    """One entry -> one move per actor in `who`, in OUT_MOVES."""
    bad = set(e) - KEYS
    assert not bad, f'{e.get("track")} {e.get("move")}: unknown key(s) {sorted(bad)}'
    tid, move = e['track'], e['move']
    assert move in MOVES, f'{tid}: no move "{move}" in tools/hamilton-moves.json'
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
    if argv[:1] == ['--check']:
        return check(int(argv[1]))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
