#!/usr/bin/env python3
"""The beat grid without the page (RULING FV): assets/hamilton-beats.json, as midtown.html reads it.

    python -I beats.py <track> <seconds>              # -> its bar and beat (and the nearest downbeat's time)
    python -I beats.py <track> --bar N [--beat B]     # -> the time of bar N, beat B (both from 1)

BARS AND BEATS COUNT FROM 1, from the track's first downbeat (`firstBeat`): bar 1 beat 1 is `firstBeat`; bar 0 and below
run backwards before it. A tempo change starts a new tempo at its time and the beat count carries on (beatCompile in
midtown.html). Times are seconds into the album track, the cues' and the blocking's clock. Standard library only.

In a generator:  from beats import beat_time, bar_of, downbeat, counts_between
    beat_time('1-03', 31, 1)      the time of bar 31's downbeat in My Shot
    bar_of('1-03', 80.5)          (bar, beat as a fraction, e.g. (31, 2.4))
    downbeat('1-03', 73.9, 2)     the downbeat nearest 73.9 s, moved on 2 whole bars
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRACKS = json.load(open(os.path.join(ROOT, 'assets', 'hamilton-beats.json'), encoding='utf-8'))['tracks']


def grid(tid):
    """-> ([(time, beat number, seconds per beat)], meter)"""
    t = TRACKS[tid]
    segs = [(t['firstBeat'], 0, 60.0 / t['bpm'])]
    for c in sorted(t.get('changes') or [], key=lambda c: c['at']):
        a, b, p = segs[-1]
        if c['at'] <= a:
            if len(segs) == 1 and c['at'] == a: segs[0] = (a, 0, 60.0 / c['bpm'])
            continue
        segs.append((c['at'], round(b + (c['at'] - a) / p), 60.0 / c['bpm']))
    return segs, t.get('meter', 4)


def beat_of(tid, t):
    """The beat number (0 = the first downbeat, fractional) at t seconds into the track."""
    segs, _ = grid(tid)
    s = segs[0]
    for q in segs:
        if q[0] <= t: s = q
    return s[1] + (t - s[0]) / s[2]


def time_of(tid, beat):
    """The time (s into the track) of a beat number: beat_of's inverse."""
    segs, _ = grid(tid)
    s = segs[0]
    for q in segs:
        if q[1] <= beat: s = q
    return s[0] + (beat - s[1]) * s[2]


def beat_time(tid, bar, beat=1):
    """The time of bar `bar`, beat `beat` (both counted from 1)."""
    _, meter = grid(tid)
    return time_of(tid, (bar - 1) * meter + (beat - 1))


def bar_of(tid, t):
    """-> (bar, beat): where t falls, both from 1 (the beat fractional)."""
    _, meter = grid(tid)
    b = beat_of(tid, t)
    bar = int(b // meter)
    return bar + 1, b - bar * meter + 1


def downbeat(tid, t, bars=0):
    """The time of the downbeat nearest t, moved on by `bars` whole bars, rounded to the hundredth (dance.py's `bar`)."""
    _, meter = grid(tid)
    b = round(beat_of(tid, t) / meter) * meter + bars * meter
    return round(time_of(tid, b), 2)


def counts_between(tid, t0, t1):
    """Whole beats from t0 to t1 (at least 1)."""
    return max(1, round(beat_of(tid, t1) - beat_of(tid, t0)))


if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) >= 2 and a[1] != '--bar':
        tid, t = a[0], float(a[1]); bar, bt = bar_of(tid, t)
        print(f'{tid} at {t:.2f} s: bar {bar}, beat {bt:.2f} ({TRACKS[tid]["bpm"]} BPM); the nearest downbeat is at {downbeat(tid, t):.2f} s')
    elif len(a) >= 3:
        tid, bar = a[0], int(a[2]); bt = float(a[4]) if len(a) >= 5 and a[3] == '--beat' else 1
        print(f'{tid} bar {bar} beat {bt:g}: {beat_time(tid, bar, bt):.3f} s')
    else:
        print(__doc__)
