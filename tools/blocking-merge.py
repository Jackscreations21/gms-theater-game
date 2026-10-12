#!/usr/bin/env python3
"""assets/hamilton-blocking.json from the blocking writers' segment files (RULINGS FF-FN).

    python -I tools/blocking-merge.py <segment dir> [--out assets/hamilton-blocking.json] [--check]

<segment dir> holds seg1.json ... seg8.json (any seg*.json), each

    { "segment": 3, "tracks": ["1-12", ...],
      "waypoints": { "<actor id>": [ WAYPOINT, ... ], ... },
      "notes": "free text" }

holding ONLY its own tracks' waypoints.  WAYPOINT is the format of
docs/hamilton-blocking-format.md, with one convenience: `y` may be a LEVEL
NAME instead of a number, filled here from the measured floor map
(tools/hamilton-floor.json, measured in the page at Real size):

    "deck"     the deck-level floor at (x, z)            (absent y means this too)
    "gallery"  2.743, checked against the map's top level at (x, z)
    "top"      the highest floor at (x, z) (a stair tread, a landing, a gallery)

The cast (ids, names, colours, the labels each may show) is
tools/hamilton-cast.json; the track list and lengths come from
assets/hamilton-show.json.

ERRORS (nothing is written): an unknown actor id or track id; `at` outside its
track; a label the cast does not allow that actor; time not strictly
increasing for an actor across the whole show; a malformed waypoint; two
segments writing the same track.
WARNINGS (written anyway, printed): a waypoint outside the measured stage
(x beyond +-9.5, z beyond -6.5 .. +5.3); standing on a prop or a stair at deck
level; a "gallery" waypoint where the map has no gallery; a leg between two
gallery waypoints that leaves the gallery floor on the way; a level change of
more than 1 m over more than 3.5 m of floor (split it at a stair's foot and
top); a stair leg climbed faster than 0.7 m/s across the floor; a leg faster
than 3.5 m/s; a dwell that runs past the next waypoint; an offstage waypoint in
plain view (the body would vanish in front of the house).
Then a summary per track: who has waypoints in it, and how many.

Standard library only.
"""
import glob, json, math, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GALLERY = 2.743
STAGE = {'x': (-9.5, 9.5), 'z': (-6.5, 5.3)}
IN_VIEW = {'x': (-5.5, 5.5), 'z': (-2.8, 5.0)}      # an `off` waypoint in here vanishes in plain sight


def load(p):
    with open(p, encoding='utf-8') as f:
        return json.load(f)


class Floor:
    def __init__(self, d):
        self.x0, self.z0, self.st, self.nx, self.nz = d['x0'], d['z0'], d['step'], d['nx'], d['nz']
        self.deck, self.top = d['deck'], d['top']

    def _at(self, grid, x, z):
        i = round((x - self.x0) / self.st); j = round((z - self.z0) / self.st)
        if not (0 <= i < self.nx and 0 <= j < self.nz):
            return None
        return grid[j][i]

    def deck_at(self, x, z): return self._at(self.deck, x, z)
    def top_at(self, x, z): return self._at(self.top, x, z)


def main(argv):
    if not argv or argv[0].startswith('-'):
        print(__doc__); return 2
    segdir, out, check = argv[0], os.path.join(ROOT, 'assets', 'hamilton-blocking.json'), False
    i = 1
    while i < len(argv):
        if argv[i] == '--out': out = argv[i + 1]; i += 2
        elif argv[i] == '--check': check = True; i += 1
        else: print('unknown argument', argv[i]); return 2
    cast = load(os.path.join(ROOT, 'tools', 'hamilton-cast.json'))['actors']
    show = load(os.path.join(ROOT, 'assets', 'hamilton-show.json'))
    floor = Floor(load(os.path.join(ROOT, 'tools', 'hamilton-floor.json')))
    tracks, start = {}, 0.0
    for k, t in enumerate(show['tracks']):
        tracks[t['id']] = {'i': k, 'len': float(t['len']), 'start': start, 'title': t['title']}
        start += float(t['len'])
    byid = {a['id']: a for a in cast}
    errors, warns = [], []
    paths = {a['id']: [] for a in cast}
    owner = {}
    files = sorted(glob.glob(os.path.join(segdir, 'seg*.json')), key=lambda p: int(''.join(c for c in os.path.basename(p) if c.isdigit()) or 0))
    if not files:
        print('no seg*.json in', segdir); return 2
    for p in files:
        name = os.path.basename(p)
        try:
            seg = load(p)
        except Exception as e:
            errors.append(f'{name}: not JSON ({e})'); continue
        own = set(seg.get('tracks') or [])
        for tid in own:
            if tid in owner: errors.append(f'{name}: track {tid} is also claimed by {owner[tid]}')
            owner[tid] = name
        for aid, wps in (seg.get('waypoints') or {}).items():
            if aid not in byid:
                errors.append(f'{name}: unknown actor id "{aid}"'); continue
            if not isinstance(wps, list):
                errors.append(f'{name}: {aid}: waypoints must be a list'); continue
            for k, w in enumerate(wps):
                where = f'{name}: {aid} #{k + 1}'
                if not isinstance(w, dict):
                    errors.append(f'{where}: not an object'); continue
                tid = str(w.get('track', ''))
                if tid not in tracks:
                    errors.append(f'{where}: unknown track "{tid}"'); continue
                if own and tid not in own:
                    warns.append(f'{where}: track {tid} is not one of this segment\'s tracks')
                try:
                    at, x, z = float(w['at']), float(w['x']), float(w['z'])
                except Exception:
                    errors.append(f'{where}: at, x and z must be numbers'); continue
                if not (0 <= at <= tracks[tid]['len'] + 1e-6):
                    errors.append(f'{where}: at {at} outside {tid} (0-{tracks[tid]["len"]} s)')
                o = {'track': tid, 'at': round(at, 2), 'x': round(x, 3), 'z': round(z, 3)}
                y = w.get('y')
                if isinstance(y, str):
                    lv = y.strip().lower()
                    if lv == 'deck':
                        d = floor.deck_at(x, z); y = d if d is not None else 0.045
                    elif lv == 'gallery':
                        t = floor.top_at(x, z)
                        if t is None or abs(t - GALLERY) > 0.1:
                            warns.append(f'{where}: "gallery" at ({x}, {z}) but the measured top floor there is {t}')
                        y = GALLERY
                    elif lv == 'top':
                        t = floor.top_at(x, z); y = t if t is not None else 0.045
                    else:
                        errors.append(f'{where}: y "{y}" is not deck / gallery / top or a number'); continue
                elif y is not None:
                    try: y = float(y)
                    except Exception: errors.append(f'{where}: y must be a number or a level name'); continue
                if y is not None and y > 0.1:
                    o['y'] = round(y, 3)
                    t = floor.top_at(x, z)
                    if abs(y - GALLERY) < 0.15 and (t is None or abs(t - GALLERY) > 0.1):
                        warns.append(f'{where}: y {y:.2f} (gallery) at ({x}, {z}) where the measured top floor is {t}')
                elif y is not None:
                    o['y'] = round(y, 3)
                if (y is None or y < 0.1):
                    d = floor.deck_at(x, z)
                    if d is not None and d > 0.15:
                        warns.append(f'{where}: on the deck at ({x}, {z}) but something {d:.2f} m high is there (a prop or a stair tread)')
                if 'dwell' in w and w['dwell'] is not None:
                    try: o['dwell'] = round(max(0.0, float(w['dwell'])), 2)
                    except Exception: errors.append(f'{where}: dwell must be a number')
                if 'facing' in w and w['facing'] is not None:
                    try: o['facing'] = round(float(w['facing']), 1)
                    except Exception: errors.append(f'{where}: facing must be a number (degrees)')
                if w.get('off'): o['off'] = True
                if w.get('label'):
                    lab = str(w['label']).strip()
                    if lab != byid[aid]['name'] and lab not in byid[aid].get('labels', []):
                        errors.append(f'{where}: label "{lab}" is not {byid[aid]["name"]} or one of {byid[aid].get("labels", [])}')
                    o['label'] = lab
                if not (STAGE['x'][0] <= x <= STAGE['x'][1] and STAGE['z'][0] <= z <= STAGE['z'][1]):
                    warns.append(f'{where}: ({x}, {z}) is outside the measured stage')
                if o.get('off') and IN_VIEW['x'][0] < x < IN_VIEW['x'][1] and IN_VIEW['z'][0] < z < IN_VIEW['z'][1] and (y is None or y < 0.1):
                    warns.append(f'{where}: offstage at ({x}, {z}) — in plain view of the house; she vanishes there')
                o['_T'] = tracks[tid]['start'] + at
                o['_src'] = where
                o['_file'] = name
                paths[aid].append(o)
            mine = [o for o in paths[aid] if o.get('_file') == name]
            if mine and 'label' not in min(mine, key=lambda o: o['_T']):
                warns.append(f'{name}: {aid}: the first waypoint in this segment has no `label` (labels hold across segments: name it)')
    # per actor: order, strictly increasing time, the legs
    for aid, P in paths.items():
        P.sort(key=lambda o: (o['_T']))
        for a, b in zip(P, P[1:]):
            if b['_T'] <= a['_T'] + 1e-6:
                errors.append(f'{aid}: time does not increase: {a["_src"]} ({a["track"]} {a["at"]}) then {b["_src"]} ({b["track"]} {b["at"]})')
                continue
            dt = b['_T'] - a['_T']
            if 'dwell' in a and a['_T'] + a['dwell'] > b['_T'] + 1e-6:
                warns.append(f'{a["_src"]}: its {a["dwell"]} s dwell runs past the next waypoint ({dt:.2f} s later)')
            leave = a['_T'] + min(a.get('dwell', 0.0), dt) if 'dwell' in a else a['_T']   # auto dwell: judged on the whole interval
            walk = b['_T'] - leave
            dist = math.hypot(b['x'] - a['x'], b['z'] - a['z'])
            ya, yb = a.get('y', 0.045), b.get('y', 0.045)
            if a.get('off') and b.get('off'):
                continue
            if walk > 1e-6 and dist / walk > 3.5:
                warns.append(f'{a["_src"]} -> {b["_src"]}: {dist:.1f} m in {walk:.1f} s ({dist / walk:.1f} m/s)')
            if abs(yb - ya) > 1.0:
                if dist > 3.5:
                    warns.append(f'{a["_src"]} -> {b["_src"]}: changes level {ya:.2f} -> {yb:.2f} over {dist:.1f} m of floor — put waypoints at the stair\'s foot and top')
                elif walk > 1e-6 and dist / walk > 0.7:
                    warns.append(f'{a["_src"]} -> {b["_src"]}: a stair climbed at {dist / walk:.2f} m/s across the floor (give it 3.5 s or more)')
            if abs(ya - GALLERY) < 0.15 and abs(yb - GALLERY) < 0.15 and dist > 0.3:
                n = max(2, int(dist / 0.1))
                for k in range(1, n):
                    f = k / n; x = a['x'] + (b['x'] - a['x']) * f; z = a['z'] + (b['z'] - a['z']) * f
                    t = floor.top_at(x, z)
                    if t is None or abs(t - GALLERY) > 0.1:
                        warns.append(f'{a["_src"]} -> {b["_src"]}: leaves the gallery floor near ({x:.2f}, {z:.2f}) (top {t}) — route it along the gallery')
                        break
    for e in errors: print('ERROR  ', e)
    for w in warns: print('warning', w)
    # the summary
    print()
    print('track  title                                   actors  waypoints  (actor: count)')
    for tid, t in sorted(tracks.items(), key=lambda kv: kv[1]['i']):
        cnt = {aid: sum(1 for o in P if o['track'] == tid) for aid, P in paths.items()}
        cnt = {k: v for k, v in cnt.items() if v}
        print(f'{tid}  {t["title"][:38]:38s}  {len(cnt):6d}  {sum(cnt.values()):9d}  ' + ' '.join(f'{k}:{v}' for k, v in cnt.items()))
    missing = sorted(set(tracks) - set(owner))
    if missing: print('\ntracks no segment claimed:', ' '.join(missing))
    print(f'\n{len(files)} segment file(s), {sum(len(P) for P in paths.values())} waypoints, {len(errors)} error(s), {len(warns)} warning(s)')
    if errors:
        print('NOT written (errors).'); return 1
    if check:
        print('--check: not written.'); return 0
    doc = {
        'format': 'hamilton-blocking 1',
        'frame': 'set-local metres: the frame of assets/hamilton-set.glb (upstage -z, the house +z, the deck y 0, stage right -x); times on the show clock (album track, seconds into it)',
        'model': 'assets/mannequin-woman.glb',
        'note': 'Merged by tools/blocking-merge.py from ' + ', '.join(os.path.basename(p) for p in files) + '. The company of Hamilton as blank mannequins named over their heads (RULING FN).',
        'actors': [{'id': a['id'], 'name': a['name'], 'color': a['color'],
                    'path': [{k: v for k, v in o.items() if not k.startswith('_')} for o in paths[a['id']]]} for a in cast],
    }
    with open(out, 'w', encoding='utf-8', newline='\n') as f:
        f.write('{\n "format": ' + json.dumps(doc['format']) + ',\n "frame": ' + json.dumps(doc['frame']) + ',\n "model": ' + json.dumps(doc['model']) +
                ',\n "note": ' + json.dumps(doc['note'], ensure_ascii=False) + ',\n "actors": [\n')
        for n, a in enumerate(doc['actors']):
            f.write('  {"id": ' + json.dumps(a['id']) + ', "name": ' + json.dumps(a['name']) + ', "color": ' + json.dumps(a['color']) + ', "path": [')
            f.write(','.join('\n   ' + json.dumps(w, ensure_ascii=False) for w in a['path']))
            f.write(('\n  ' if a['path'] else '') + ']}' + (',' if n + 1 < len(doc['actors']) else '') + '\n')
        f.write(' ]\n}\n')
    print('written', out)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
