#!/usr/bin/env python3
"""assets/hamilton-blocking.json from the blocking writers' segment files (RULINGS FF-FN).

    python -I tools/blocking-merge.py <segment dir> [--out assets/hamilton-blocking.json] [--check]

<segment dir> holds seg1.json ... seg8.json (any seg*.json), each

    { "segment": 3, "tracks": ["1-12", ...],
      "waypoints": { "<actor id>": [ WAYPOINT, ... ], ... },
      "notes": "free text" }

holding ONLY its own tracks' waypoints.  The folder may also hold PROPS.JSON
(RULING FR; tools/blocking/props.py writes it):

    { "props": [ { "id", "kind", "label", "size": [w, h, d], "color",
                   "waypoints": [ { "track", "at", "x", "z", "facing"?, "off"?,
                                    "carriedBy"?: "<actor id>" | ["<id>", "<id>"], "note"? }, ... ],
                   "model"?: "assets/props/<file>.glb" } ] }

merged into the file's "props" list after the actors.  And DANCE.JSON (RULING FV;
tools/blocking/dance.py writes it):

    { "moves": { "<actor id>": [ { "track", "at", "move", "counts", "mirror"?, "canon"?,
                                   "speed"?, "reverse"?, "note"? }, ... ] } }

merged into each actor as "moves" after her path: a move from tools/hamilton-moves.json (the library
midtown.html dances), counts > 0 beats, `at` (+ `canon`) inside its track, snapped by the page to the
nearest beat of assets/hamilton-beats.json (a warning here when that is more than 0.1 s away); `canon`
(seconds) is added after that snap, so a ripple can be finer than a beat.

THE CLOCK'S EDGES (RULING FQ): `at` runs 0 ... the track's length, except
-10 ... 0 is also allowed on the first track of each act (1-01, and the track
the show file marks `hold`: 2-01), up to length + 10 on the last track of Act
One (1-23), and with no upper bound on the album's last track (2-23).

WAYPOINT is the format of
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
track (with its lead-in and tail, FQ); a label the cast does not allow that
actor; time not strictly increasing for an actor across the whole show; a malformed waypoint; two
segments writing the same track; for a prop: an unknown kind, a bad size or
colour, a duplicate id, `carriedBy` not a cast id, time not strictly
increasing, a placed waypoint without x / z.
WARNINGS (written anyway, printed): a waypoint outside the measured stage
(x beyond +-9.5, z beyond -6.5 .. +5.3); standing on a prop or a stair at deck
level; a "gallery" waypoint where the map has no gallery; a leg between two
gallery waypoints that leaves the gallery floor on the way; a level change of
more than 1 m over more than 3.5 m of floor (split it at a stair's foot and
top); a stair leg climbed faster than 0.7 m/s across the floor; a leg faster
than 3.5 m/s; a dwell that runs past the next waypoint; an offstage waypoint in
plain view (the body would vanish in front of the house); a prop placed off the
measured stage; a prop carried by an actor who has no waypoints.
Then a summary per track: who has waypoints in it, and how many.

Standard library only.
"""
import glob, json, math, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GALLERY = 2.743
STAGE = {'x': (-9.5, 9.5), 'z': (-6.5, 5.3)}
IN_VIEW = {'x': (-5.5, 5.5), 'z': (-2.8, 5.0)}      # an `off` waypoint in here vanishes in plain sight
LEAD, TAIL = 10.0, 10.0                               # RULING FQ: the lead-in before each act's first track, the tail after Act One
# RULING FR: the prop kinds and their default sizes [w (across), h, d (deep)] in metres
PROP_KINDS = {'desk': [1.2, 0.75, 0.6], 'table': [1.5, 0.75, 0.9], 'chair': [0.45, 0.9, 0.45], 'bench': [1.4, 0.45, 0.4],
              'stool': [0.4, 0.6, 0.4], 'box': [0.5, 0.45, 0.5], 'crate': [0.6, 0.5, 0.6], 'lantern': [0.2, 0.35, 0.2],
              'bucket': [0.3, 0.35, 0.3], 'custom': [0.5, 0.5, 0.5]}


def track_table(show):
    """id -> {i, len, start, pre, post, title}: the show clock with its lead-ins and tails (FQ). `start` is where the track's
    own 0 falls on the global clock, after its lead-in; the next track starts after this one's tail."""
    T, start, L = {}, 0.0, show['tracks']
    for k, t in enumerate(L):
        pre = LEAD if k == 0 or t.get('hold') else 0.0
        post = math.inf if k == len(L) - 1 else (TAIL if L[k + 1].get('hold') else 0.0)
        start += pre
        T[t['id']] = {'i': k, 'len': float(t['len']), 'start': start, 'pre': pre, 'post': post, 'title': t['title']}
        start += float(t['len']) + (post if post != math.inf else 0.0)
    return T


def at_ok(tr, at):
    return -tr['pre'] - 1e-6 <= at <= tr['len'] + tr['post'] + 1e-6


def at_range(tr):
    return f"{-tr['pre']:g}-{(tr['len'] + tr['post']) if tr['post'] != math.inf else 'open'}"


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
    tracks = track_table(show)
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
                if not at_ok(tracks[tid], at):
                    errors.append(f'{where}: at {at} outside {tid} ({at_range(tracks[tid])} s)')
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
    props = merge_props(segdir, tracks, byid, floor, paths, errors, warns)
    moves = merge_moves(segdir, tracks, byid, errors, warns)       # RULING FV
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
    if props: print('\nprops: ' + ', '.join(f"{p['id']} ({len(p['waypoints'])})" for p in props))
    if moves: print('moves: ' + ', '.join(f"{k} ({len(v)})" for k, v in moves.items()))
    print(f'\n{len(files)} segment file(s), {sum(len(P) for P in paths.values())} waypoints, {len(props)} prop(s), {len(errors)} error(s), {len(warns)} warning(s)')
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
            f.write(('\n  ' if a['path'] else '') + ']')
            if moves.get(a['id']):                      # RULING FV: her dance moves, after her path
                f.write(', "moves": [' + ','.join('\n   ' + json.dumps(m, ensure_ascii=False) for m in moves[a['id']]) + '\n  ]')
            f.write('}' + (',' if n + 1 < len(doc['actors']) else '') + '\n')
        if props:                                       # RULING FR: after the actors
            f.write(' ],\n "props": [\n')
            for n, p in enumerate(props):
                f.write('  {"id": ' + json.dumps(p['id']) + ', "kind": ' + json.dumps(p['kind']) + ', "label": ' + json.dumps(p['label'], ensure_ascii=False) +
                        ', "size": ' + json.dumps(p['size']) + ', "color": ' + json.dumps(p['color']) +
                        (', "model": ' + json.dumps(p['model']) if p.get('model') else '') + ', "waypoints": [')
                f.write(','.join('\n   ' + json.dumps(w, ensure_ascii=False) for w in p['waypoints']))
                f.write(('\n  ' if p['waypoints'] else '') + ']}' + (',' if n + 1 < len(props) else '') + '\n')
        f.write(' ]\n}\n')
    print('written', out)
    return 0


def beat_grid(beats):
    """RULING FV: assets/hamilton-beats.json -> {track: [(time, beat number, period)]} (midtown.html's beatCompile)."""
    out = {}
    for tid, t in (beats.get('tracks') or {}).items():
        try: segs = [(float(t['firstBeat']), 0, 60.0 / float(t['bpm']))]
        except Exception: continue
        for c in sorted(t.get('changes') or [], key=lambda c: c['at']):
            a, b, per = segs[-1]
            if c['at'] <= a:
                if len(segs) == 1 and c['at'] == a: segs[0] = (a, 0, 60.0 / c['bpm'])
                continue
            segs.append((float(c['at']), round(b + (c['at'] - a) / per), 60.0 / c['bpm']))
        out[tid] = segs
    return out


def beat_at(grid, tid, t):
    """-> (beat number, the segment it is in), or None without a grid."""
    segs = grid.get(tid)
    if not segs: return None
    s = segs[0]
    for q in segs:
        if q[0] <= t: s = q
        else: break
    return s[1] + (t - s[0]) / s[2], s


def merge_moves(segdir, tracks, byid, errors, warns):
    """RULING FV: <segdir>/dance.json, validated -> {actor id: [move, ...]} in time order (empty when there is none)."""
    p = os.path.join(segdir, 'dance.json')
    if not os.path.exists(p):
        return {}
    try:
        d = load(p)
        lib = load(os.path.join(ROOT, 'tools', 'hamilton-moves.json'))['moves']
    except Exception as e:
        errors.append(f'dance.json / tools/hamilton-moves.json: not JSON ({e})'); return {}
    try: grid = beat_grid(load(os.path.join(ROOT, 'assets', 'hamilton-beats.json')))
    except Exception: grid = {}; warns.append('dance.json: no assets/hamilton-beats.json: the moves are not checked against the beat')
    out = {}
    for aid, L in (d.get('moves') or {}).items():
        if aid not in byid:
            errors.append(f'dance.json: unknown actor id "{aid}"'); continue
        for k, m in enumerate(L if isinstance(L, list) else []):
            where = f'dance.json: {aid} move #{k + 1}'
            tid = str(m.get('track', ''))
            if tid not in tracks: errors.append(f'{where}: unknown track "{tid}"'); continue
            name = str(m.get('move', ''))
            if name not in lib: errors.append(f'{where}: no move "{name}" (tools/hamilton-moves.json)'); continue
            try: at, counts = float(m['at']), float(m['counts'])
            except Exception: errors.append(f'{where}: at and counts must be numbers'); continue
            if counts <= 0: errors.append(f'{where}: counts must be more than 0'); continue
            canon = float(m.get('canon') or 0)
            if not at_ok(tracks[tid], at + canon): errors.append(f'{where}: at {at + canon} outside {tid} ({at_range(tracks[tid])} s)'); continue
            o = {'track': tid, 'at': round(at, 2), 'move': name, 'counts': round(counts, 3)}
            if m.get('mirror'): o['mirror'] = True
            if canon: o['canon'] = round(canon, 3)
            if m.get('speed') not in (None, 1, 1.0):
                try:
                    sp = float(m['speed'])
                    if sp <= 0: raise ValueError
                    o['speed'] = sp
                except Exception: errors.append(f'{where}: speed must be a number above 0')
            if m.get('reverse'): o['reverse'] = True
            if m.get('note'): o['note'] = str(m['note'])
            ba = beat_at(grid, tid, at)                    # `at` snaps to its beat; `canon` is added after the snap
            if ba is not None:
                b, sg = ba; off = (round(b) - b) * sg[2]
                if abs(off) > 0.1: warns.append(f'{where}: {name} at {at:.2f} s is {off:+.2f} s off the beat (the page snaps it)')
            o['_T'] = tracks[tid]['start'] + at + canon
            out.setdefault(aid, []).append(o)
    for aid in out:
        out[aid].sort(key=lambda o: o['_T'])
        for o in out[aid]: del o['_T']
    return out


def merge_props(segdir, tracks, byid, floor, paths, errors, warns):
    """RULING FR: <segdir>/props.json, validated and normalised -> the file's "props" list (empty when there is none)."""
    p = os.path.join(segdir, 'props.json')
    if not os.path.exists(p):
        return []
    try:
        d = load(p)
    except Exception as e:
        errors.append(f'props.json: not JSON ({e})'); return []
    out, seen = [], set()
    for n, q in enumerate(d.get('props') or []):
        pid = str(q.get('id') or '').strip()
        where = f'props.json: {pid or "#" + str(n + 1)}'
        if not pid or pid in seen:
            errors.append(f'{where}: a prop needs a unique id'); continue
        seen.add(pid)
        kind = str(q.get('kind') or 'custom')
        if kind not in PROP_KINDS:
            errors.append(f'{where}: kind "{kind}" is not one of {sorted(PROP_KINDS)}'); continue
        size = q.get('size') or PROP_KINDS[kind]
        try:
            size = [round(float(v), 3) for v in size]
            assert len(size) == 3 and all(v > 0 for v in size)
        except Exception:
            errors.append(f'{where}: size must be [w, h, d], three positive metres'); continue
        color = str(q.get('color') or '#8a6a48').lower()
        if not (len(color) == 7 and color[0] == '#' and all(c in '0123456789abcdef' for c in color[1:])):
            errors.append(f'{where}: color "{color}" is not #rrggbb'); continue
        wps = []
        for k, w in enumerate(q.get('waypoints') or []):
            wh = f'{where} #{k + 1}'
            tid = str(w.get('track', ''))
            if tid not in tracks:
                errors.append(f'{wh}: unknown track "{tid}"'); continue
            try:
                at = float(w['at'])
            except Exception:
                errors.append(f'{wh}: at must be a number'); continue
            if not at_ok(tracks[tid], at):
                errors.append(f'{wh}: at {at} outside {tid} ({at_range(tracks[tid])} s)')
            o = {'track': tid, 'at': round(at, 2)}
            cb = w.get('carriedBy')
            has_xz = w.get('x') is not None and w.get('z') is not None
            if not cb and not has_xz:
                errors.append(f'{wh}: a placed waypoint needs x and z'); continue
            if has_xz:
                try:
                    x, z = float(w['x']), float(w['z'])
                except Exception:
                    errors.append(f'{wh}: x and z must be numbers'); continue
                o['x'], o['z'] = round(x, 3), round(z, 3)
                if not cb and not w.get('off') and not (STAGE['x'][0] <= x <= STAGE['x'][1] and STAGE['z'][0] <= z <= STAGE['z'][1]):
                    warns.append(f'{wh}: ({x}, {z}) is outside the measured stage')
            y = w.get('y')
            if isinstance(y, str) and has_xz:
                lv = y.strip().lower()
                y = GALLERY if lv == 'gallery' else (floor.top_at(o['x'], o['z']) if lv == 'top' else None)
            if y is not None and not isinstance(y, str) and float(y) > 0.1:
                o['y'] = round(float(y), 3)
            if w.get('facing') is not None:
                try: o['facing'] = round(float(w['facing']), 1)
                except Exception: errors.append(f'{wh}: facing must be a number (degrees)')
            if w.get('off'): o['off'] = True
            if cb:
                # RULING FU: one carrier (a cast id) or two ([a, b]: the prop rides between them, its long side along them)
                ids = [str(v) for v in cb] if isinstance(cb, list) else [str(cb)]
                if len(ids) not in (1, 2) or (len(ids) == 2 and ids[0] == ids[1]):
                    errors.append(f'{wh}: carriedBy must be one cast id or a list of two different ones')
                for c1 in ids:
                    if c1 not in byid:
                        errors.append(f'{wh}: carriedBy "{c1}" is not a cast id')
                    elif not paths.get(c1):
                        warns.append(f'{wh}: carriedBy {c1}, who has no waypoints (never on stage)')
                o['carriedBy'] = ids if len(ids) == 2 else ids[0]
            if w.get('note'): o['note'] = str(w['note'])
            o['_T'] = tracks[tid]['start'] + at
            wps.append(o)
        wps.sort(key=lambda o: o['_T'])
        for a, b in zip(wps, wps[1:]):
            if b['_T'] <= a['_T'] + 1e-6:
                errors.append(f'{where}: time does not increase: {a["track"]} {a["at"]} then {b["track"]} {b["at"]}')
        rec = {'id': pid, 'kind': kind, 'label': str(q.get('label') or pid), 'size': size, 'color': color}
        if q.get('model'):                       # RULING FU: a GLB drawn in place of the boxes (scaled to `size`)
            mdl = str(q['model'])
            if not (mdl.startswith('assets/props/') and mdl.endswith('.glb')):
                errors.append(f'{where}: model "{mdl}" must be an assets/props/*.glb')
            elif not os.path.exists(os.path.join(ROOT, *mdl.split('/'))):
                warns.append(f'{where}: model {mdl} is not in the repository (the page draws the boxes)')
            rec['model'] = mdl
        rec['waypoints'] = [{k: v for k, v in o.items() if not k.startswith('_')} for o in wps]
        out.append(rec)
    return out


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
