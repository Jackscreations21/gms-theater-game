#!/usr/bin/env python
"""The synthetic check of stage 1's alignment (docs/guide/VISION.md section 4, stage 1).  Not a suite - it needs numpy.

    tools/vision/.venv/Scripts/python -I tools/vision/aligncheck.py [-v] [--tol 0.15]

It uses run.py's own functions (align, prep, the album envelope), so it checks the matcher as it is now.

1. Truth: ten tracks are sliced out of the album envelope (assets/hamilton-soundtrack-env.u8), stretched -3 % and
   +3 % in time (the film is not the album's tempo), with 8 s of noise put in front (the clip's lead-in), and aligned
   against their own track's span.  Every anchor must land within 0.15 s of where that clip time truly is on the
   album, and there must be anchors over most of the track.  (0.15 s: a 10 s window 3 % off tempo has +-0.15 s of
   jitter in itself.  run.py's refine pass, which resamples each window to the local tempo, takes nearly every
   anchor under 0.02 s; the ones it cannot refine - no neighbour within 25 s - keep the jitter.)
2. No false anchor: every OTHER track, sliced the same way, is searched over My Shot's span (1-03, +-30 s).  It must
   give no anchor - with the documented exceptions in EXCEPT, which are music that really is in that span, printed
   EXCEPT instead of PASS and never counted as failures:
   - 1-02 Aaron Burr, Sir and 1-04 The Story of Tonight: the span runs 30 s past each end of My Shot, so the last
     30 s of 1-02 and the first ~29 s of 1-04 really are inside it.  An anchor is allowed IF it lands on the truth,
     and only where the track's own audio is inside the span.
   - 1-23 Non-Stop: the company ends it on My Shot's own refrain, so its last 30 s find My Shot's climax, 310-330 s
     in.  An anchor is allowed only in those last 30 s; anywhere else it fails.

Prints one line per case, PASS or FAIL, and exits 1 on any failure.  An anchor off by more than the tolerance is
named by kind: 'jitter' (under 0.3 s - a 10 s window of music 3 % off tempo has no single best offset; it smears
+-0.15 s) or 'WRONG BEAT' (0.3 s and more - the local search took a beat or bar of the same groove, 1-2 s away).
"""
import sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import run  # noqa: E402  (the matcher under test)

import numpy as np  # noqa: E402

TOL = 0.15           # seconds: an anchor against the truth (the jitter of a 10 s window at 3 % off tempo)
LEAD = 8.0           # seconds of noise in front of every synthetic clip
STRETCH = 0.03       # +- tempo
TRUTH_TRACKS = ['1-02', '1-03', '1-05', '1-08', '1-11', '1-18', '1-23', '2-05', '2-09', '2-18']
MIN_COVER = 0.6      # the anchors must reach across at least this share of the track (else "every anchor is right"
                     # would pass on a matcher that finds one)
FALSE_SPAN = '1-03'  # whose span the other tracks are searched over
# part 2's documented exceptions (see the docstring): 'overlap' = the track's own audio is inside the span, an anchor
# there is allowed on the truth; ('tail', s) = an anchor is allowed in the track's last s seconds, wherever it lands
EXCEPT = {'1-02': 'overlap', '1-04': 'overlap', '1-23': ('tail', 30.0)}
SEED = 20261014


def synth(aenv, t, factor, rng):
    """the track's slice of the album envelope, played `factor` times as long (factor 1.03 = 3 % slower), with LEAD s
    of noise in front.  Returns the uint8 envelope; clip time c (>= LEAD) is album time t.file + (c - LEAD) / factor."""
    b = 1.0 / run.ENV_BIN
    i0, i1 = int(round(t['file'] * b)), int(round((t['file'] + t['len']) * b))
    src = aenv[i0:i1].astype(np.float32)
    n = int(round(len(src) * factor))
    out = np.interp(np.arange(n) / factor, np.arange(len(src)), src)
    # noise at the track's own level and spread: a room before the music, not silence (silence is too easy)
    noise = rng.normal(src.mean(), max(4.0, src.std()), int(LEAD * b))
    env = np.concatenate([noise, out])
    return np.clip(np.round(env), 0, 255).astype(np.uint8), i0 / b


def truth_of(c, t0, factor):
    return t0 + (c - LEAD) / factor


def main():
    import argparse
    ap = argparse.ArgumentParser(description='the synthetic check of stage 1 alignment')
    ap.add_argument('-v', action='store_true', help='every anchor, and every track of part 2')
    ap.add_argument('--tol', type=float, default=TOL, help='seconds an anchor may be off the truth (default %(default)s)')
    args = ap.parse_args()
    verbose, tol = args.v, args.tol
    ts = run.tracks(); by = {t['id']: t for t in ts}
    aenv = run.album_envelope()
    rng = np.random.default_rng(SEED)
    fails = 0

    print('-- 1. truth: ten tracks at -3 %% and +3 %% tempo, %g s of noise in front, against their own span; every '
          'anchor within %g s' % (LEAD, tol))
    kinds = {'jitter': 0, 'WRONG BEAT': 0}; n_anchors = 0
    for tid in TRUTH_TRACKS:
        t = by[tid]
        for factor in (1.0 - STRETCH, 1.0 + STRETCH):
            cenv, t0 = synth(aenv, t, factor, rng)
            anchors, info = run.align(cenv, aenv, ts, [tid])
            errs = [abs(a - truth_of(c, t0, factor)) for c, a, _ in anchors]
            worst = max(errs) if errs else None
            cover = (anchors[-1][0] - anchors[0][0]) / (t['len'] * factor) if len(anchors) > 1 else 0.0
            bad = [(c, round(a - truth_of(c, t0, factor), 3)) for (c, a, _), e in zip(anchors, errs) if e > tol]
            n_anchors += len(anchors)
            for _, e in bad: kinds['jitter' if abs(e) < 0.3 else 'WRONG BEAT'] += 1
            ok = bool(anchors) and not bad and cover >= MIN_COVER
            fails += not ok
            why = ''
            if not anchors: why = '  no anchors'
            elif bad: why = '  off by more than %g s at (clip time, error): %s' % (tol, ', '.join(
                '(%g, %+.3f%s)' % (c, e, '' if abs(e) < 0.3 else ' WRONG BEAT') for c, e in bad[:8]))
            elif cover < MIN_COVER: why = '  anchors cover only %.0f %% of the track' % (100 * cover)
            print('%s  %s %-28s x%.2f  %2d anchors, worst %s s, cover %3.0f %%, stats %s%s' % (
                'PASS' if ok else 'FAIL', tid, t.get('title', '')[:28], factor, len(anchors),
                '-' if worst is None else '%.3f' % worst, 100 * cover, run.anchor_stats(anchors), why))
            if verbose:
                for (c, a, cc), e in zip(anchors, errs): print('        %7.2f -> %8.3f  corr %.3f  err %.3f' % (c, a, cc, e))
    print('      %d anchors in all: %d jitter (%g-0.3 s), %d WRONG BEAT (>= 0.3 s)' % (
        n_anchors, kinds['jitter'], tol, kinds['WRONG BEAT']))

    sp = by[FALSE_SPAN]
    span0, span1 = sp['file'] - 30.0, sp['file'] + sp['len'] + 30.0
    print('-- 2. no false anchor: every other track (x1.00, %g s of noise in front) searched over %s %s\'s span '
          '(%.1f-%.1f s)' % (LEAD, FALSE_SPAN, sp.get('title', ''), span0, span1))
    for t in ts:
        if t['id'] == FALSE_SPAN: continue
        cenv, t0 = synth(aenv, t, 1.0, rng)
        anchors, info = run.align(cenv, aenv, ts, [FALSE_SPAN])
        # the track's own audio inside the span (only the neighbours have any): an anchor there is a true find
        ov0, ov1 = max(span0, t['file']), min(span1, t['file'] + t['len'])
        overlap = ov1 - ov0 if ov1 > ov0 else 0.0
        ex = EXCEPT.get(t['id'])
        if ex == 'overlap':
            allowed = lambda c, a: abs(a - truth_of(c, t0, 1.0)) <= tol and ov0 <= a <= ov1
        elif isinstance(ex, tuple) and ex[0] == 'tail':
            allowed = lambda c, a: truth_of(c, t0, 1.0) >= t['file'] + t['len'] - ex[1]
        else:
            allowed = lambda c, a: False
        wrong = [(c, a) for c, a, _ in anchors if not allowed(c, a)]
        ok = not wrong
        fails += not ok
        if ex == 'overlap':
            note = ('  (documented: really inside the span, its %s %.1f s - %d anchor(s) there, all on the truth)'
                    % ('first' if t['file'] >= sp['file'] else 'last', overlap, len(anchors) - len(wrong)))
        elif ex:
            note = ("  (documented: it ends on My Shot's refrain - %d anchor(s) in its last %g s)"
                    % (len(anchors) - len(wrong), ex[1]))
        else:
            note = ''
        if wrong: note += '  FALSE anchor(s) at clip/album %s' % [(round(c, 2), round(a, 2)) for c, a in wrong[:6]]
        if verbose or not ok or ex or anchors:
            print('%s  %s %-28s  %d anchor(s)%s' % ('FAIL' if not ok else 'EXCEPT' if ex else 'PASS', t['id'],
                                                  t.get('title', '')[:28], len(anchors), note))
    if not verbose: print('      (%d tracks searched; a line is printed only for an anchor, an exception or a failure; -v '
                          'for all)' % (len(ts) - 1))

    print('%s: %d failure(s)' % ('FAIL' if fails else 'PASS', fails))
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
