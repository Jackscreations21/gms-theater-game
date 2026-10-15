#!/usr/bin/env python3
"""assets/hamilton-pools.json: the PERSON LIGHTS lit at every cue, slimmed from the per-cue pool dump (RULING FP).

    python -I tools/blocking-pools.py <POOLS DIR> [--out assets/hamilton-pools.json] [--made 'where the dump came from']

<POOLS DIR>/<track>.json is the dump of every lit unit's landing point and radius, cue by cue, made in midtown.html
(MIDTOWN.show.seek + settle, MIDTOWN.lx.get / beam: what the page draws). It is 19 MB and lives in a session scratch
folder, not the repository; its README says how it was made. This keeps only the lights meant for one person -- a
`special`, or any unit at zoom 18.5 deg or less (the same test as tools/blocking-plot.py) -- that land on a floor (the deck,
a gallery, a stair) or point down at the deck, so the blocking editor (blocking.html) can draw them under the actors.

    { "what": "...", "made": "...", "fields": [...],
      "tracks": { "1-01": [ { "q": "44", "at": 79.0, "until": 85.9, "n": 31, "s": [ [x, z, r, ch, colour, level, y, special], ... ] } ] } }

- `at` / `until`: the cue's GO and the next cue's GO, seconds into the track; the look holds between them.
- `n`: how many units the dump saw lit in that cue (all kinds; 0 = nothing lit at all).
- `s`: the person lights: landing x, z (set-local metres), pool radius r, channel, colour (#rrggbb), level 0-1, the landing
  height y, and 1 for a `special` (0 for a narrow wash at zoom <= 18.5).

Regenerate after any change to the cues, the rig or the engine (dump first, see the dump's README). Standard library only.
"""
import glob, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main(argv):
    if not argv or argv[0].startswith('-'):
        print(__doc__); return 2
    src, out = argv[0], os.path.join(ROOT, 'assets', 'hamilton-pools.json')
    if '--out' in argv: out = argv[argv.index('--out') + 1]
    made = argv[argv.index('--made') + 1] if '--made' in argv else 'from the dump in ' + os.path.basename(os.path.normpath(src))
    tracks, n_s, n_c = {}, 0, 0
    for f in sorted(glob.glob(os.path.join(src, '[12]-*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        L = []
        for c in d['cues']:
            sp = []
            for q in c['pools']:
                if not (q.get('kind') == 'special' or (q.get('zoom', 99) <= 18.5 and q.get('kind') in ('wash', 'special'))):
                    continue
                lands = q.get('lands', '')
                if q.get('hit') and (lands in ('deck', 'gallery') or lands.startswith('floor')):
                    x, y, z = q['hit']; r = q['hitR']
                elif q.get('deck'):
                    (x, z), y, r = q['deck'], 0.045, q['deckR']
                else:
                    continue
                sp.append([round(x, 2), round(z, 2), round(r, 2), str(q['ch']), q['color'], round(q['level'], 2), round(y, 2), 1 if q.get('kind') == 'special' else 0])
            L.append({'q': c['q'], 'at': c['at'], 'until': c['until'], 'n': len(c['pools']), 's': sp})
            n_s += len(sp); n_c += 1
        tracks[d['track']] = L
    doc = {'what': 'The person lights (specials, and units at zoom <= 18.5 deg) lit in each cue, where they land: slimmed by '
                   'tools/blocking-pools.py from the per-cue pool dump of midtown.html. For blocking.html (RULING FP).',
           'made': made,
           'fields': ['x', 'z', 'r', 'ch', 'colour', 'level', 'y', 'special'], 'tracks': tracks}
    with open(out, 'w', encoding='utf-8', newline='\n') as f:
        f.write('{"what": ' + json.dumps(doc['what']) + ',\n "made": ' + json.dumps(doc['made']) + ',\n "fields": ' + json.dumps(doc['fields']) + ',\n "tracks": {\n')
        ids = list(tracks)
        for i, t in enumerate(ids):
            f.write('  ' + json.dumps(t) + ': ' + json.dumps(tracks[t], separators=(',', ':')) + (',' if i + 1 < len(ids) else '') + '\n')
        f.write(' }\n}\n')
    print(f'wrote {out}: {len(tracks)} tracks, {n_c} cues, {n_s} person lights, {os.path.getsize(out) / 1e6:.2f} MB')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
