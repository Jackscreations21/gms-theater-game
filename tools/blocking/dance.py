#!/usr/bin/env python3
"""The Hamilton dance moves (RULING FV): writes segments/dance.json for tools/blocking-merge.py.

    python -I dance.py            # writes segments/dance.json (then run the merge)

A FIRST PASS. Each entry puts a move from the library (tools/hamilton-moves.json; what each one is and where it comes
from: docs/hamilton-dance-moves.md) on some of the company for some counts, from a moment in a song. The moment is a
cue label's time (assets/hamilton-show.json, Binkley's cues and the reconstructions, which name the song's sections)
moved on by whole BARS of the song's beat grid (assets/hamilton-beats.json) and snapped to a downbeat. Which bar a lyric
lands on is a reading of the album, not a measurement: every entry says what it is meant to hit, and Jack's eye (and the
editor's Dance button) is the judge.

A move given to someone who is offstage at that moment is harmless (an unseen body is not posed), so a number's
company is named whole where the sources say "the company" or "the ensemble".

Format (the merge validates it):

    { "moves": { "<actor id>": [ { "track", "at", "move", "counts", "mirror"?, "canon"?, "speed"?, "reverse"?,
                                   "note"? }, ... ] } }

SECTIONS. One per number, `# ---- DANCE: <track> <title>`; edit one with small exact replacements. Standard library only.
"""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, 'segments', 'dance.json')
BEATS = json.load(open(os.path.join(ROOT, 'assets', 'hamilton-beats.json'), encoding='utf-8'))['tracks']
MOVES = json.load(open(os.path.join(ROOT, 'tools', 'hamilton-moves.json'), encoding='utf-8'))['moves']

FOUR = ['hamilton', 'laurens', 'lafayette', 'mulligan']          # "the four" of My Shot
ENS = ['ens%d' % k for k in range(1, 11)]
SISTERS = ['angelica', 'eliza', 'peggy']
OUT_MOVES = {}


def grid(tid):
    t = BEATS[tid]
    segs = [(t['firstBeat'], 0, 60.0 / t['bpm'])]
    for c in sorted(t.get('changes') or [], key=lambda c: c['at']):
        a, b, p = segs[-1]
        if c['at'] <= a:
            if len(segs) == 1 and c['at'] == a: segs[0] = (a, 0, 60.0 / c['bpm'])
            continue
        segs.append((c['at'], round(b + (c['at'] - a) / p), 60.0 / c['bpm']))
    return segs, t.get('meter', 4)


def beat_of(tid, t):
    segs, _ = grid(tid)
    s = segs[0]
    for q in segs:
        if q[0] <= t: s = q
    return s[1] + (t - s[0]) / s[2]


def time_of(tid, beat):
    segs, _ = grid(tid)
    s = segs[0]
    for q in segs:
        if q[1] <= beat: s = q
    return s[0] + (beat - s[1]) * s[2]


def bar(tid, t, bars=0):
    """The time of the downbeat nearest t, moved on by `bars` whole bars."""
    _, meter = grid(tid)
    b = round(beat_of(tid, t) / meter) * meter + bars * meter
    return round(time_of(tid, b), 2)


def counts_between(tid, t0, t1):
    return max(1, round(beat_of(tid, t1) - beat_of(tid, t0)))


def put(who, tid, at, move, counts, note, **kw):
    assert move in MOVES, move
    for k, a in enumerate(who):
        o = {'track': tid, 'at': at, 'move': move, 'counts': counts}
        for key, v in kw.items():
            if key == 'canon_step':
                if v: o['canon'] = round(v * k, 3)
            elif key == 'mirror_alt':
                if v and k % 2: o['mirror'] = True
            elif v: o[key] = v
        o['note'] = note
        OUT_MOVES.setdefault(a, []).append(o)


# ---- DANCE: 1-03 My Shot
# Blankenbuehler (WSJ): the signature phrase is "just like my country I'm young, scrappy and hungry, and I'm not throwing
# away my shot". Each half-chorus is 4 bars: two lines of "I am not throwing away my shot", then "Hey yo, I'm just like my
# country…" — so the phrase starts 2 bars into each half (cues 109 / 110, 121 / 122, 135 / 136: the chorus sections).
for cue in (73.9, 84.4, 168.2, 180.0, 296.4, 307.1):
    put(FOUR + ENS, '1-03', bar('1-03', cue, 2), 'my-shot', 8, 'the signature phrase, "Hey yo, I\'m just like my country…" (chorus at cue %.1f + 2 bars)' % cue)

# ---- DANCE: 1-05 The Schuyler Sisters
# Angelica's declaration (cue 166, 105.9): "We hold these truths to be self-evident that all men are created equal" — the
# equals-sign arms on the second bar; "…include women in the sequel. Work!" — the two fingers up, 4 bars in.
put(SISTERS, '1-05', bar('1-05', 105.9, 1), 'equals', 4, '"…that all men are created equal": the equals sign')
put(SISTERS, '1-05', bar('1-05', 105.9, 4), 'work', 2, '"…include women in the sequel. Work!"')

# ---- DANCE: 1-08 Right Hand Man
# Blankenbuehler: the My Shot phrase returns "in the middle of Right Hand Man". Placed where Hamilton accepts (cue 286,
# 264.06) — a GUESS at the bar; check it with the music.
put(['hamilton'] + ENS, '1-08', bar('1-08', 264.06, 2), 'my-shot', 8, 'the My Shot phrase in the middle of Right Hand Man (placement guessed)')

# ---- DANCE: 1-10 Helpless
# Blankenbuehler: Helpless / Satisfied is a gavotte's formality — palms touching, the distance between them — "and then
# about 20 seconds later, they're grinding". The ball (cue 300.6, 28.24); the couples alternate sides (mirrored).
put(ENS[:8], '1-10', bar('1-10', 28.24), 'gavotte', 16, 'the ball: the gavotte, palm to palm', mirror_alt=True)
put(ENS[:8], '1-10', bar('1-10', 28.24 + 20.0), 'grind', 8, '"twenty seconds later, they\'re grinding"', mirror_alt=True)

# ---- DANCE: 1-11 Satisfied
# The rewind (cues 366.2 to 366.8, 46.74 to 57.62): the company runs backwards in slow motion (Dance Magazine: "he literally
# rewinds portions of the choreography from Helpless"). Then the ball again from Angelica's side (cue 369, 71.64).
everyone = ['hamilton', 'burr', 'eliza', 'angelica', 'peggy', 'washington', 'lafayette', 'mulligan', 'laurens'] + ENS
put(everyone, '1-11', bar('1-11', 46.74), 'rewind', counts_between('1-11', 46.74, 57.62), 'the rewind (cues 366.2 to 366.8)')
put(ENS[:8], '1-11', bar('1-11', 71.64), 'gavotte', 16, 'the ball replayed from Angelica\'s side', mirror_alt=True)

# ---- DANCE: 1-20 Yorktown (The World Turned Upside Down)
# Blankenbuehler (WSJ, "Breaks Down His Moves"): the marching troops freeze and play out Hamilton's thought —
# "I imagined death so much it feels more like a memory" — then "weapon in my hand, a command, and boom"; the heartbeat as he
# thinks of Eliza; the hip-hop march for "we gotta go, we gotta get the job done". The 35-pound musket in the battle. "The
# world turned upside down": the furniture lifted and held upside down (the reddit staging notes) — nobody carries furniture
# in Yorktown in props.py yet, so the arms go up empty (FUTURE.md).
SOLDIERS = ['hamilton', 'laurens', 'lafayette', 'mulligan'] + ENS[:9]
put(SOLDIERS, '1-20', bar('1-20', 32.2, 2), 'my-shot', 8, 'the My Shot reprise (cue 590)')
put(SOLDIERS, '1-20', bar('1-20', 51.2), 'imagine-death', 8, '"I imagined death so much it feels more like a memory" (cue 592)')
put(SOLDIERS, '1-20', bar('1-20', 51.2, 2), 'command', 4, '"…weapon in my hand, a command, and boom"')
put(SOLDIERS, '1-20', bar('1-20', 61.2), 'heartbeat', 8, 'thinking of Eliza: the heartbeat (cue 593)')
put(SOLDIERS, '1-20', bar('1-20', 66.7), 'hiphop-march', 16, '"we gotta go, we gotta get the job done" (cue 594)')
put(SOLDIERS, '1-20', bar('1-20', 129.9), 'musket', 8, 'the drill (cue 601)')
put(SOLDIERS, '1-20', bar('1-20', 146.0), 'musket', 8, 'the battle resumes (cue 605)')
put(SOLDIERS, '1-20', bar('1-20', 198.4), 'upside-down', 16, '"the world turned upside down" (cue 609)')

# ---- DANCE: 2-05 The Room Where It Happens
# Blankenbuehler: the ensemble is Burr's ego, mocking him — the Fosse-like upper-body shimmy; Dance Magazine: "ooey-gooey
# jazz". On the choruses (cues 867.3, 867.8). Burr circles the lit circle and never crosses it until the end: a path rule,
# for the generators (docs/hamilton-dance-moves.md).
for cue in (118.4, 176.8):
    put(ENS, '2-05', bar('2-05', cue), 'shimmy', 8, 'the chorus: Burr\'s ego, the shimmy (cue at %.1f)' % cue)
    put(ENS, '2-05', bar('2-05', cue, 2), 'jazz-roll', 8, 'the chorus: ooey-gooey jazz')

# ---- DANCE: 2-13 Hurricane
# Blankenbuehler (Backstage): the ensemble swivels round him on the turntable "hoisting furniture overhead as in a storm"; the
# men crawl backward in slow motion — the "cockroaches". The crawl is ens2 and ens4 along the downstage edge (seg7_gen.py,
# its placement invented); the storm is the montage (cue 1037, 70.47).
put(['ens1', 'ens3', 'ens5', 'ens6', 'ens7', 'ens8', 'ens9', 'ens10'], '2-13', bar('2-13', 70.47), 'hoist', 16, 'the storm: furniture overhead (nothing carried yet: the arms go up empty)')
put(['ens2', 'ens4'], '2-13', bar('2-13', 116.28), 'crawl-back', counts_between('2-13', 116.28, 129.0), 'the cockroaches (seg7: ens2 and ens4 cross the downstage edge 116.28 to 129.0)')

# ---- DANCE: 2-14 The Reynolds Pamphlet
# Blankenbuehler (Backstage): as Angelica confronts him, "all the dancers around her are moving in slow motion — but they're
# hitting a wall, and they kind of ooze out of it". From her arrival (cue 1045, 55.49) and again as she turns to Eliza (65.52).
for cue in (55.49, 65.52):
    put(ENS, '2-14', bar('2-14', cue), 'wall-ooze', 8, 'round Angelica: the slow-motion wall (cue at %.2f)' % cue)

# ---- DANCE: 2-22 The World Was Wide Enough
# The Bullet (ens1, gen_seg8.py): enters at Burr's pistol at 100.4 and drifts to the centre by 129.0 — the slow-motion walk
# with the bullet held out ahead. "Legacy, what is a legacy?" (cue 1248, 129.9): Hamilton's My Shot phrase, the shot thrown UP
# (Blankenbuehler: at the end of the show "we're throwing the bullet up in the air"). The rowers: ens8 and ens9 sit either
# side of him after the shot (201.5) and row (Blankenbuehler: "the rowers… rowing next to him").
put(['ens1'], '2-22', bar('2-22', 100.4), 'bullet', counts_between('2-22', 100.4, 129.0), 'the Bullet carries Burr\'s shot to the centre')
put(['hamilton'], '2-22', bar('2-22', 129.9), 'legacy', 8, '"Legacy, what is a legacy?" (cue 1248)')
put(['ens8', 'ens9'], '2-22', bar('2-22', 202.0), 'row', 8, 'the rowers beside him', mirror_alt=True)


def main():
    for a in OUT_MOVES:
        OUT_MOVES[a].sort(key=lambda o: (o['track'], o['at']))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        json.dump({'by': 'tools/blocking/dance.py (RULING FV)', 'moves': OUT_MOVES}, f, indent=1, ensure_ascii=False)
    n = sum(len(v) for v in OUT_MOVES.values())
    print(f'{OUT}: {n} moves for {len(OUT_MOVES)} actors')


if __name__ == '__main__':
    main()
