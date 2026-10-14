#!/usr/bin/env python
"""Stage 1's cuts again, from the cached frames - no decode, no alignment (docs/guide/VISION.md stage 1, "Cuts").

    tools/vision/.venv/Scripts/python -I tools/vision/run.py recut <clip>|all [--dry] [--rebase]
    tools/vision/.venv/Scripts/python -I tools/vision/recut.py remap <clip>|all [--write]

recut: run.py's detect_cuts over cache/<clip>/frames/, cuts.json applied, and frames.json rewritten in place: its
`shots`, every `frames[].shot`, `cuts` and `diffs` are new; everything else (align, at, tconf, written, ...) is
written back as it was read.  cache/<clip>/shotmap.json says what became of every OLD shot:

    {"old": {"16": [{"new": 16, "first": 330, "last": 346}, {"new": 17, "first": 347, "last": 360}], ...},
     "new": {"17": [16], ...}, "base": [the old shots], "newShots": [[id, first, last], ...], "frames": N, ...}

The OLD shots are the ones frames.json had the first time recut ran (kept in shotmap.json `base`), so running recut
again (a threshold changed, a cuts.json edit) still maps from the shots the bodies, calib and labels files were made
on.  --rebase forgets them and maps from the shots frames.json has now.

remap: a calib/<clip>.json keyed by the old shot ids -> keyed by the new ones.  Each entry goes to the new shot that
holds its `frame` (an entry with no frame - most skipped ones - to the one holding the old shot's middle frame, the
frame calib.py shows by default); an entry whose old shot split carries `"split": [new ids]`, and one whose id
changed carries `"was": old id`.  Two old entries landing in one new shot (a lighting change that is no longer a
cut) keep the better one (a good solve, a fair one, any solve, a skip) and put the other under its `"merged"`.  The
file gets `"shotmap": <shotmap.json's written>`, and a file that already has it is left alone.  Without --write it
only prints.  bodies.json (tracklet ids s<shot>-t<n>) and labels are NOT remapped: re-run `bodies` after a recut.
"""
import sys, os, json, time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import run  # noqa: E402

CALIB = os.path.join(HERE, 'calib')


def _load(p):
    with open(p, encoding='utf-8') as f: return json.load(f)


def _dump_compact(o):
    return json.dumps(o, separators=(',', ':')) + '\n'


def shotmap_of(base, new_shots):
    """old shots, new shots -> ({old id: [{new, first, last}]}, {new id: [old ids]})."""
    old, inv = {}, {}
    for o in base:
        pieces = []
        for s in new_shots:
            a, b = max(o['first'], s['first']), min(o['last'], s['last'])
            if a <= b:
                pieces.append({'new': s['id'], 'first': a, 'last': b})
                inv.setdefault(str(s['id']), []).append(o['id'])
        old[str(o['id'])] = pieces
    return old, inv


def recut(stem, dry=False, rebase=False):
    """re-detect one clip's cuts from its cached frames.  -> a summary dict (and frames.json + shotmap.json written
    unless dry)."""
    cdir = os.path.join(run.CACHE, stem); fdir = os.path.join(cdir, 'frames'); fjson = os.path.join(cdir, 'frames.json')
    if not os.path.isfile(fjson) or not os.path.isdir(fdir): run.die('run frames first for %s' % stem)
    with open(fjson, encoding='utf-8') as f: raw = f.read()
    prev = json.loads(raw)
    files = sorted(os.listdir(fdir))
    if len(files) != len(prev['frames']) or any(fr['file'] != f for fr, f in zip(prev['frames'], files)):
        run.die('%s: the frames/ folder (%d) is not the one frames.json lists (%d): run frames again' % (stem, len(files), len(prev['frames'])))
    thr = prev.get('cuts', {}).get('threshold', 12.0); hthr = prev.get('cuts', {}).get('histThreshold', 0.2)
    cuts, diffs = run.detect_cuts(fdir, files, thr, hthr)
    detected = list(cuts)
    cuts = run.apply_cuts_json(cdir, cuts)
    shots, shot_of = run.make_shots(cuts, len(files))
    smp = os.path.join(cdir, 'shotmap.json')
    had = _load(smp) if os.path.isfile(smp) and not rebase else None
    base = had['base'] if had else [{k: s[k] for k in ('id', 'first', 'last', 'n')} for s in prev['shots']]
    old_cuts = {s['first'] for s in base} - {0}; new_cuts = {s['first'] for s in shots} - {0}
    summary = {'clip': stem, 'before': len(base), 'after': len(shots), 'added': sorted(new_cuts - old_cuts),
               'removed': sorted(old_cuts - new_cuts), 'cuts': sorted(new_cuts)}
    if dry: return summary
    # frames.json: only shots, frames[].shot, cuts, diffs change; the rest goes back as it was read
    if _dump_compact(prev) != raw:
        run.log('NOTE: %s frames.json does not round-trip byte for byte (it was not written by run.py?)' % stem)
    for fr, k in zip(prev['frames'], shot_of): fr['shot'] = k
    rec = {**run.cuts_record(thr, hthr, None), 'detected': detected, 'recut': time.strftime('%Y-%m-%d %H:%M')}
    out = {}
    for k, v in prev.items():
        out[k] = {'shots': shots, 'cuts': rec, 'diffs': diffs}.get(k, v)
    for k, v in (('shots', shots), ('cuts', rec), ('diffs', diffs)): out.setdefault(k, v)
    with open(fjson, 'w', encoding='utf-8', newline='\n') as f: f.write(_dump_compact(out))
    old, inv = shotmap_of(base, shots)
    sm = {'clip': stem,
          'what': 'stage 1 recut (VISION.md): for every OLD shot id (the shots bodies/calib/labels were made on), the new '
                  'shot(s) it became, by frame range; recut.py remap re-keys calib/<clip>.json with it',
          'old': old, 'new': inv, 'newShots': [[s['id'], s['first'], s['last']] for s in shots], 'frames': len(files),
          'cutsAdded': summary['added'], 'cutsRemoved': summary['removed'], 'base': base,
          'baseWritten': had['baseWritten'] if had else prev.get('written'), 'written': time.strftime('%Y-%m-%d %H:%M:%S')}
    with open(smp, 'w', encoding='utf-8', newline='\n') as f: json.dump(sm, f, indent=1); f.write('\n')
    return summary


def cmd_recut(args):
    stems = sorted(d for d in os.listdir(run.CACHE) if os.path.isfile(os.path.join(run.CACHE, d, 'frames.json'))) \
        if args.clip == 'all' else [os.path.splitext(os.path.basename(args.clip))[0]]
    print('%-46s %6s %6s %6s %6s' % ('clip', 'before', 'after', '+cuts', '-cuts'))
    tot = [0, 0, 0, 0]
    for st in stems:
        s = recut(st, dry=args.dry, rebase=args.rebase)
        print('%-46s %6d %6d %6d %6d' % (st, s['before'], s['after'], len(s['added']), len(s['removed'])))
        if args.dry and len(stems) == 1:
            print('  new cuts:', ' '.join(map(str, s['cuts'])))
            print('  added:   ', ' '.join(map(str, s['added'])))
            print('  removed: ', ' '.join(map(str, s['removed'])))
        for k, v in enumerate((s['before'], s['after'], len(s['added']), len(s['removed']))): tot[k] += v
    if len(stems) > 1: print('%-46s %6d %6d %6d %6d' % ('all', *tot))
    if args.dry: print('(dry: nothing written)')


# ---------------------------------------------------------------- remap

def _rank(e):
    if e.get('skipped') or not e.get('solve'): return 0
    return {'good': 3, 'fair': 2}.get(e.get('judged'), 1)


def remap(calib, smap):
    """a calib dict keyed by old shot ids + a shotmap dict -> (the calib keyed by new shot ids, notes).  Pure: reads
    nothing, writes nothing."""
    new_shots = smap['newShots']; base = {str(s['id']): s for s in smap['base']}
    notes = []

    def holder(fi):
        for sid, a, b in new_shots:
            if a <= fi <= b: return sid
        return None
    placed = {}
    for k, e in sorted(calib.get('shots', {}).items(), key=lambda kv: int(kv[0])):
        pieces = smap['old'].get(k)
        if not pieces:
            notes.append('shot %s: not in the shotmap (kept under its own id)' % k)
            placed.setdefault(int(k), []).append((k, dict(e))); continue
        fi = e.get('frame')
        if fi is None: fi = base[k]['first'] + base[k]['n'] // 2
        nid = holder(fi)
        if nid is None: nid = pieces[0]['new']; notes.append('shot %s: frame %s is in no shot' % (k, fi))
        e2 = dict(e)
        if nid != int(k) or len(pieces) > 1: e2['was'] = int(k)
        if len(pieces) > 1:
            e2['split'] = [p['new'] for p in pieces]
            notes.append('shot %s -> %d (split into %s; frame %d)' % (k, nid, e2['split'], fi))
        elif nid != int(k):
            notes.append('shot %s -> %d' % (k, nid))
        placed.setdefault(nid, []).append((k, e2))
    shots = {}
    for nid in sorted(placed):
        group = sorted(placed[nid], key=lambda ke: -_rank(ke[1]))
        keep = dict(group[0][1])
        if len(group) > 1:
            keep['merged'] = [dict(e, was=int(k)) for k, e in group[1:]]
            notes.append('new shot %d: old %s merged (kept old %s)' % (nid, [k for k, _ in group], group[0][0]))
        shots[str(nid)] = keep
    out = {}
    for k, v in calib.items(): out[k] = shots if k == 'shots' else v
    out['shotmap'] = smap['written']
    return out, notes


def cmd_remap(clip, write):
    stems = sorted(os.path.splitext(f)[0] for f in os.listdir(CALIB) if f.endswith('.json')) if clip == 'all' else [clip]
    for st in stems:
        cp = os.path.join(CALIB, st + '.json'); sp = os.path.join(run.CACHE, st, 'shotmap.json')
        if not os.path.isfile(cp): print('%s: no calib file' % st); continue
        if not os.path.isfile(sp): print('%s: no shotmap.json (run recut first)' % st); continue
        cal, sm = _load(cp), _load(sp)
        if cal.get('shotmap') == sm['written']: print('%s: already remapped with this shotmap' % st); continue
        if cal.get('shotmap'): print('%s: remapped with an OLDER shotmap (%s) - not again; fix by hand' % (st, cal['shotmap'])); continue
        out, notes = remap(cal, sm)
        print('%s: %d entries -> %d%s' % (st, len(cal['shots']), len(out['shots']), '' if write else '  (dry: --write to save)'))
        for n in notes: print('   ' + n)
        if write:
            with open(cp, 'w', encoding='utf-8', newline='\n') as f: json.dump(out, f, indent=1); f.write('\n')


def main():
    import argparse
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    p = sub.add_parser('recut'); p.add_argument('clip'); p.add_argument('--dry', action='store_true'); p.add_argument('--rebase', action='store_true')
    p = sub.add_parser('remap'); p.add_argument('clip'); p.add_argument('--write', action='store_true')
    a = ap.parse_args()
    if a.cmd == 'recut': cmd_recut(a)
    else: cmd_remap(a.clip, a.write)


if __name__ == '__main__':
    main()
