"""Stage 5 - identities (RULINGS FY-5, GB): every tracklet of every clip of a track gets a cast id, then the clips merge
into per-character tracks in tools/vision/out/<track>.json.

    python tools/vision/ident.py <track> [--clip <clip>] [--labels <dir>] [--hist-stats]
    python tools/vision/run.py ident <track> [--clip <clip>]          # the same, through the CLI

The clips of a track: those in out/<track>.json (stage 4) and every cached clip whose frames.json saw the track; a
tracklet belongs to the track when any of its frames is in it.  A tracklet in an uncalibrated shot has no position
and still gets an identity (RULING GA); its samples carry x, z, level null.  Per clip, in this order (GB):

1. label - tools/vision/labels/<clip>.json {"clip": ..., "labels": {"<tid>": "<castId>"}} (the Calibrate mode
   writes it, one click per body per shot) -> conf 1.0.  An absent file is no labels.
2. continuity - shot by shot: a tracklet starting within 0.5 s (album time) of the end of a label/continuity
   tracklet of the previous shot, its first floor position within 0.6 m of that one's last -> its id, conf x 0.8.
   Both ends need a floor position within 0.6 s of the cut.
3. appearance - the torso box (shoulders 5/6 to hips 11/12, at least one of each over 0.3) of up to 12 frames per
   tracklet, an HSV histogram (18 H x 8 S x 4 V, each frame's normalised, averaged), compared by the Bhattacharyya
   coefficient to the label/continuity tracklets of the same clip.  The nearest decides the group (principals or
   ensemble - the parchment costumes only match among themselves); it must reach APP_MIN and beat the next other id
   of its group by APP_MARGIN.  An ensemble match that does not beat another ensemble id (or with only one ensemble
   id labelled in the clip) pools as ens?.  conf =
   0.7 x similarity x the matched tracklet's conf.
4. blocking - the committed assets/hamilton-blocking.json's on-stage character nearest the tracklet's median floor
   position at its median time (same level: gallery only with gallery, deck only with deck, a stair with either),
   under 1.5 m -> conf 0.3, fromBlocking (never evidence for the blocking: it agrees with it by construction).
Else the pool, `ens?` (rule `pool`): bodies nobody can name, kept with their positions so a formation's count and
shape can still be measured.  No id is held by two tracklets that overlap in time within a clip (greedy, nearest
first) - except ens?.

Output, added to the same out/<track>.json beside stage 4's keys (which are kept as written):
  identities: {<clip>: {<tid>: {id, rule, conf, fromBlocking?}}}
  characters: {<castId>|"ens?": [{at, x, z, level, conf, clip, shot, tid, rule, fromBlocking?, offMap?}, ...]}
sorted by at; a sample's conf = the position's conf x the identity's (a pooled body: the position's alone).
Re-running is idempotent; re-running stage 4 (floor) on any clip of the track drops both keys - run ident again.
"""
import os, sys, re, json, math, argparse, bisect

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, 'out')
CACHE = os.path.join(HERE, 'cache')
LABELS = os.path.join(HERE, 'labels')
CAST = os.path.join(ROOT, 'tools', 'hamilton-cast.json')
BLOCKING = os.path.join(ROOT, 'assets', 'hamilton-blocking.json')
SHOW = os.path.join(ROOT, 'assets', 'hamilton-show.json')

POOL = 'ens?'
KP_MIN = 0.3
CONT_DT, CONT_DIST, CONT_W = 0.5, 0.6, 0.8      # GB rule 2
CONT_END = 0.6                                   # a floor position this close (s) to the cut stands for the tracklet's end
APP_MIN, APP_MARGIN, APP_W = 0.80, 0.05, 0.7     # GB rule 3 (Bhattacharyya coefficient; see --hist-stats)
APP_FRAMES = 12
HBINS = (18, 8, 4)
BLK_DIST, BLK_CONF = 1.5, 0.3                    # GB rule 4
WALK = 1.3                                       # the page's walking speed between waypoints (m/s)
LEAD, TAIL = 10.0, 10.0                          # RULING FQ, as tools/blocking-merge.py's track_table
GAL_Y_SPLIT = 2.0                                # a blocking y above this is the gallery level


def _load(p):
    with open(p, encoding='utf-8') as f: return json.load(f)


def _r(v): return None if v is None else round(float(v), 3)


def tid_key(tid):
    m = re.match(r'^s(\d+)-t(\d+)$', tid)
    return (int(m.group(1)), int(m.group(2)), '') if m else (1 << 30, 0, tid)


# ---------------------------------------------------------------- the cast and the blocking

def load_cast():
    actors = _load(CAST)['actors']
    ids = [a['id'] for a in actors]
    ens = {a['id'] for a in actors if a.get('name', '').startswith('Ensemble')}
    return ids, ens


def track_starts():
    """track id -> where its own 0 falls on the global show clock (tools/blocking-merge.py's track_table, RULING FQ)."""
    L = _load(SHOW)['tracks']; T, start = {}, 0.0
    for k, t in enumerate(L):
        pre = LEAD if k == 0 or t.get('hold') else 0.0
        post = 0.0 if k == len(L) - 1 else (TAIL if L[k + 1].get('hold') else 0.0)
        start += pre; T[t['id']] = start; start += float(t['len']) + post
    return T


class Blocking:
    """where each actor of the committed blocking is at a show time, and whether she is seen: she stands at a
    waypoint, leaves just in time to walk the next leg at 1.3 m/s (dwell absent), at once (dwell 0) or n s after
    arriving; legs are straight lines here (the page curves walk-throughs - close enough for a 1.5 m test).  Not seen
    while standing at an `off` waypoint or walking between two; before her first waypoint and after her last she
    stands at it; no waypoints, not on stage (format doc, FH/FJ)."""

    def __init__(self):
        self.starts = track_starts()
        self.actors = {}
        for a in _load(BLOCKING).get('actors', []):
            wps = []
            for w in a.get('path', []):
                if w.get('track') not in self.starts: continue
                wps.append((self.starts[w['track']] + float(w['at']), float(w['x']), float(w['z']), float(w.get('y') or 0.0),
                            bool(w.get('off')), w.get('dwell')))
            wps.sort(key=lambda w: w[0])
            if wps: self.actors[a['id']] = ([w[0] for w in wps], wps)

    def at(self, aid, track, at):
        """-> (x, z, y, seen) or None."""
        if aid not in self.actors or track not in self.starts: return None
        T = self.starts[track] + at
        ts, wps = self.actors[aid]
        k = bisect.bisect_right(ts, T) - 1
        if k < 0: w = wps[0]; return w[1], w[2], w[3], not w[4]
        if k >= len(wps) - 1: w = wps[-1]; return w[1], w[2], w[3], not w[4]
        a, b = wps[k], wps[k + 1]
        d = math.hypot(b[1] - a[1], b[2] - a[2])
        dw = a[5]
        if dw is None: dep = max(a[0], b[0] - d / WALK)
        else: dep = min(a[0] + float(dw), b[0])
        if T < dep or b[0] <= dep: return a[1], a[2], a[3], not a[4]
        f = (T - dep) / (b[0] - dep)
        return a[1] + f * (b[1] - a[1]), a[2] + f * (b[2] - a[2]), a[3] + f * (b[3] - a[3]), not (a[4] and b[4])


# ---------------------------------------------------------------- one clip's tracklets

class Clip:
    """a clip's tracklets with their frames, album times and floor positions (from every out/*.json it feeds)."""

    def __init__(self, clip, out_files):
        cdir = os.path.join(CACHE, clip)
        self.clip, self.cdir = clip, cdir
        self.frames = _load(os.path.join(cdir, 'frames.json'))['frames']
        bodies = _load(os.path.join(cdir, 'bodies.json'))
        self.tracklets = bodies['tracklets']
        self.bodies = {}                                   # tid -> [(i, body)]
        for fr in bodies['frames']:
            for b in fr['bodies']: self.bodies.setdefault(b['tid'], []).append((fr['i'], b))
        # stage 4 rows -> frame index, by (track, at rounded as floor.py rounds it)
        key = {}
        for f in self.frames:
            if f.get('track') is not None and f.get('at') is not None: key[(f['track'], _r(f['at']))] = f['i']
        self.pos = {}                                      # tid -> [(i, track, row)]
        self.near = self.lost = self.rows = 0
        for track, data in out_files.items():
            c = data.get('clips', {}).get(clip)
            if not c: continue
            for tid, rows in c.get('positions', {}).items():
                mine = [(i, self.frames[i]['at']) for i, _ in self.bodies.get(tid, []) if self.frames[i].get('track') == track
                        and self.frames[i].get('at') is not None]
                for row in rows:
                    self.rows += 1
                    i = key.get((track, _r(row[0])))
                    if i is None or i not in {j for j, _ in mine}:
                        # frames.json re-aligned since stage 4 ran: the tracklet's own frame nearest in time (< 0.5 s)
                        best = min(mine, key=lambda e: abs(e[1] - row[0]), default=None)
                        if best is None or abs(best[1] - row[0]) > 0.5: self.lost += 1; continue
                        i = best[0]; self.near += 1
                    self.pos.setdefault(tid, []).append((i, track, row))
        for v in self.pos.values(): v.sort(key=lambda e: e[0])
        if self.near or self.lost:
            print('  %s: %d of %d stage-4 positions matched frames.json only by the nearest frame, %d not at all - stage 1 '
                  'ran after stage 4: re-run `run.py floor %s`, then ident' % (clip, self.near, self.rows, self.lost, clip))

    def album(self, i): return self.frames[i].get('album')

    def tracks_of(self, tid):
        t = self.tracklets[tid]
        return {self.frames[i].get('track') for i in range(t['first'], t['last'] + 1)} - {None}

    def end_pos(self, tid, last):
        """the floor position at the tracklet's end (last=True) or start, if one is within CONT_END s of it."""
        p = self.pos.get(tid)
        if not p: return None
        t = self.tracklets[tid]
        e = p[-1] if last else p[0]
        ref = self.album(t['last'] if last else t['first']); ae = self.album(e[0])
        if ref is None or ae is None or abs(ref - ae) > CONT_END: return None
        return e[2][1], e[2][2]

    def median_pos(self, tid):
        """-> (track, at, x, z, level) - the median of its floor positions (on-map ones when there are any)."""
        p = self.pos.get(tid)
        if not p: return None
        on = [e for e in p if not (len(e[2]) > 5 and isinstance(e[2][5], dict) and e[2][5].get('offMap'))] or p
        mid = on[len(on) // 2]
        xs = sorted(e[2][1] for e in on); zs = sorted(e[2][2] for e in on)
        lv = {}
        for e in on: lv[e[2][3]] = lv.get(e[2][3], 0) + 1
        level = max(sorted(lv), key=lambda k: lv[k])
        return mid[1], mid[2][0], xs[len(xs) // 2], zs[len(zs) // 2], level

    # ---- appearance
    def histograms(self, tids):
        """tid -> the mean normalised HSV histogram of its torso over up to APP_FRAMES frames (None if no torso)."""
        import numpy as np, cv2
        want = {}
        for tid in tids:
            fr = [(i, b) for i, b in self.bodies.get(tid, []) if torso_box(b) is not None]
            if not fr: continue
            k = len(fr)
            pick = sorted({int(round(j * (k - 1) / max(1, APP_FRAMES - 1))) for j in range(min(k, APP_FRAMES))})
            for j in pick: want.setdefault(fr[j][0], []).append((tid, fr[j][1]))
        acc = {}
        for i in sorted(want):
            im = cv2.imread(os.path.join(self.cdir, 'frames', self.frames[i]['file']))
            if im is None: continue
            hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
            for tid, b in want[i]:
                x1, y1, x2, y2 = torso_box(b, im.shape[1], im.shape[0])
                if (x2 - x1) * (y2 - y1) < 64: continue
                h = cv2.calcHist([hsv[y1:y2, x1:x2]], [0, 1, 2], None, list(HBINS), [0, 180, 0, 256, 0, 256]).ravel()
                s = h.sum()
                if s <= 0: continue
                a = acc.setdefault(tid, [np.zeros_like(h), 0]); a[0] += h / s; a[1] += 1
        return {tid: a[0] / a[1] for tid, a in acc.items()}


def torso_box(b, W=None, H=None):
    """the box from the shoulders (5, 6) to the hips (11, 12), at least one of each over KP_MIN; widened to 0.4 of
    its height when side-on.  None without both."""
    kp = b['kp']
    sh = [kp[k] for k in (5, 6) if kp[k][2] > KP_MIN]; hp = [kp[k] for k in (11, 12) if kp[k][2] > KP_MIN]
    if not sh or not hp: return None
    pts = sh + hp
    x1, x2 = min(p[0] for p in pts), max(p[0] for p in pts)
    y1, y2 = min(p[1] for p in sh), max(p[1] for p in hp)
    if y2 - y1 < 4: return None
    w = max(x2 - x1, 0.4 * (y2 - y1)); cx = (x1 + x2) / 2
    x1, x2 = cx - w / 2, cx + w / 2
    if W is None: return x1, y1, x2, y2
    return max(0, int(x1)), max(0, int(y1)), min(W, int(math.ceil(x2))), min(H, int(math.ceil(y2)))


def bhatta(p, q):
    import numpy as np
    return float(np.sum(np.sqrt(p * q)))


# ---------------------------------------------------------------- the rules

def identify(clip, C, cast_ids, ens_ids, blocking, labels_dir):
    """-> {tid: {id, rule, conf, fromBlocking?}} for every tracklet of the clip."""
    ident = {}
    tids = sorted(C.tracklets, key=tid_key)
    span = {tid: (C.tracklets[tid]['first'], C.tracklets[tid]['last']) for tid in tids}
    held = {}                                                        # cast id -> [(first, last)]

    def free(cid, tid):
        if cid == POOL: return True
        a, b = span[tid]
        return all(b < f or a > l for f, l in held.get(cid, []))

    def give(tid, cid, rule, conf, **extra):
        ident[tid] = dict(id=cid, rule=rule, conf=_r(conf), **extra)
        if cid != POOL: held.setdefault(cid, []).append(span[tid])

    # 1. labels
    lp = os.path.join(labels_dir, clip + '.json')
    if os.path.isfile(lp):
        for tid, cid in sorted(_load(lp).get('labels', {}).items(), key=lambda kv: tid_key(kv[0])):
            if tid not in span: print('  %s: label for unknown tracklet %s ignored' % (clip, tid)); continue
            if cid not in cast_ids: print('  %s: label %s -> unknown cast id %r ignored' % (clip, tid, cid)); continue
            give(tid, cid, 'label', 1.0)
    # 2. continuity, shot by shot (a chain carries on: conf x 0.8 each cut)
    by_shot = {}
    for tid in tids: by_shot.setdefault(C.tracklets[tid]['shot'], []).append(tid)
    for sid in sorted(by_shot):
        prev = [t for t in by_shot.get(sid - 1, []) if t in ident and ident[t]['rule'] in ('label', 'continuity')]
        if not prev: continue
        pairs = []
        for tid in by_shot[sid]:
            if tid in ident: continue
            ts = C.album(span[tid][0]); ps = C.end_pos(tid, last=False)
            if ts is None or ps is None: continue
            for pt in prev:
                te = C.album(span[pt][1]); pe = C.end_pos(pt, last=True)
                if te is None or pe is None or not (-0.05 <= ts - te <= CONT_DT + 1e-6): continue
                d = math.hypot(ps[0] - pe[0], ps[1] - pe[1])
                if d <= CONT_DIST: pairs.append((d, tid, pt))
        for d, tid, pt in sorted(pairs):
            cid = ident[pt]['id']
            if tid in ident or not free(cid, tid): continue
            give(tid, cid, 'continuity', ident[pt]['conf'] * CONT_W)
    # 3. appearance, against the clip's label/continuity tracklets
    known = [t for t in tids if t in ident]
    if known:
        hist = C.histograms(tids)
        refs = [(t, ident[t]['id'], ident[t]['conf']) for t in known if t in hist]
        cands = []
        for tid in tids:
            if tid in ident or tid not in hist: continue
            sims = sorted(((bhatta(hist[tid], hist[t]), cid, c) for t, cid, c in refs), reverse=True)
            if not sims or sims[0][0] < APP_MIN: continue
            group_ens = sims[0][1] in ens_ids
            g = [s for s in sims if (s[1] in ens_ids) == group_ens]
            best = {}
            for s, cid, c in g: best.setdefault(cid, (s, c))
            order = sorted(best.items(), key=lambda kv: -kv[1][0])
            cands.append((-order[0][1][0], tid, group_ens, order))
        for _, tid, group_ens, order in sorted(cands):
            for k, (cid, (s, c)) in enumerate(order):
                if s < APP_MIN: break
                nxt = order[k + 1][1][0] if k + 1 < len(order) else 0.0
                if s - nxt < APP_MARGIN or (group_ens and len(order) < 2):     # one labelled ensemble body names no one
                    if group_ens: give(tid, POOL, 'appearance', APP_W * s)
                    break
                if free(cid, tid): give(tid, cid, 'appearance', APP_W * s * c); break
                if group_ens: give(tid, POOL, 'appearance', APP_W * s); break
    # 4. the blocking's nearest on-stage character, else the pool
    pairs = []
    for tid in tids:
        if tid in ident: continue
        m = C.median_pos(tid)
        if m is None: continue
        track, at, x, z, level = m
        for aid in blocking.actors:
            if aid not in cast_ids: continue
            p = blocking.at(aid, track, at)
            if p is None or not p[3]: continue
            gal = p[2] > GAL_Y_SPLIT
            if (level == 'gallery' and not gal) or (level == 'deck' and gal): continue
            d = math.hypot(p[0] - x, p[1] - z)
            if d < BLK_DIST: pairs.append((d, tid, aid))
    for d, tid, aid in sorted(pairs):
        if tid in ident or not free(aid, tid): continue
        give(tid, aid, 'blocking', BLK_CONF, fromBlocking=True)
    for tid in tids:
        if tid not in ident: give(tid, POOL, 'pool', 0.0)
    return ident


# ---------------------------------------------------------------- the track

def clips_of(track, data):
    out = set(data.get('clips', {}))
    if os.path.isdir(CACHE):
        for c in sorted(os.listdir(CACHE)):
            fp = os.path.join(CACHE, c, 'frames.json')
            if c in out or not os.path.isfile(fp) or not os.path.isfile(os.path.join(CACHE, c, 'bodies.json')): continue
            fr = _load(fp)
            if any(f.get('track') == track for f in fr['frames']): out.add(c)
    return sorted(out)


def out_files_for(clip):
    res = {}
    if os.path.isdir(OUT):
        for fn in sorted(os.listdir(OUT)):
            if not fn.endswith('.json'): continue
            d = _load(os.path.join(OUT, fn))
            if clip in d.get('clips', {}): res[d.get('track', fn[:-5])] = d
    return res


def characters_of(track, clips, identities):
    chars = {}
    for clip, C in clips.items():
        ids = identities.get(clip, {})
        for tid, idn in ids.items():
            cid, rule = idn['id'], idn['rule']
            shot = C.tracklets[tid]['shot']
            extra = {'fromBlocking': True} if idn.get('fromBlocking') else {}
            iconf = 1.0 if cid == POOL else (idn['conf'] or 0.0)
            rows = [e for e in C.pos.get(tid, []) if e[1] == track]
            if rows:
                for i, _, row in rows:
                    s = {'at': _r(row[0]), 'x': _r(row[1]), 'z': _r(row[2]), 'level': row[3], 'conf': _r(row[4] * iconf),
                         'clip': clip, 'shot': shot, 'tid': tid, 'rule': rule, **extra}
                    if len(row) > 5 and isinstance(row[5], dict) and row[5].get('offMap'): s['offMap'] = True
                    chars.setdefault(cid, []).append(s)
            elif cid != POOL:
                for i, _ in C.bodies.get(tid, []):
                    f = C.frames[i]
                    if f.get('track') != track or f.get('at') is None: continue
                    chars.setdefault(cid, []).append({'at': _r(f['at']), 'x': None, 'z': None, 'level': None, 'conf': _r(iconf),
                                                      'clip': clip, 'shot': shot, 'tid': tid, 'rule': rule, **extra})
    for v in chars.values(): v.sort(key=lambda s: (s['at'], s['clip'], tid_key(s['tid'])))
    order = lambda k: (k == POOL, k)
    return {k: chars[k] for k in sorted(chars, key=order)}


def _inline(o): return json.dumps(o, ensure_ascii=False, separators=(', ', ': '))


def _dumps_s5(o, ind):
    """identities/characters: a dict of scalars (one identity, one sample) on one line."""
    pad = ' ' * (ind + 1)
    if isinstance(o, dict):
        if not o or all(not isinstance(v, (list, dict)) for v in o.values()): return _inline(o)
        return '{\n' + ',\n'.join(pad + json.dumps(k, ensure_ascii=False) + ': ' + _dumps_s5(v, ind + 1) for k, v in o.items()) + '\n' + ' ' * ind + '}'
    if isinstance(o, list):
        if not o: return '[]'
        return '[\n' + ',\n'.join(pad + _dumps_s5(v, ind + 1) for v in o) + '\n' + ' ' * ind + ']'
    return json.dumps(o, ensure_ascii=False)


def write(p, data):
    """stage 4's keys exactly as floor.py writes them (its dumps), then identities and characters."""
    sys.path.insert(0, HERE); import floor
    parts = []
    for k, v in data.items():
        body = _dumps_s5(v, 1) if k in ('identities', 'characters') else floor.dumps(v, 1)
        parts.append(' ' + json.dumps(k, ensure_ascii=False) + ': ' + body)
    with open(p, 'w', encoding='utf-8', newline='\n') as f: f.write('{\n' + ',\n'.join(parts) + '\n}\n')


def run(track, only_clip=None, labels_dir=None, hist_stats=False):
    labels_dir = labels_dir or LABELS
    p = os.path.join(OUT, track + '.json')
    data = _load(p) if os.path.isfile(p) else {}
    clip_names = clips_of(track, data)
    if only_clip and only_clip not in clip_names: sys.exit('%s is not a clip of track %s (%s)' % (only_clip, track, ', '.join(clip_names) or 'none'))
    if not clip_names: sys.exit('no clip of track %s in out/ or the cache' % track)
    cast_ids, ens_ids = load_cast()
    blocking = Blocking()
    old = data.get('identities', {})
    clips, identities = {}, {}
    for clip in clip_names:
        C = Clip(clip, out_files_for(clip)); clips[clip] = C
        in_track = {tid for tid in C.tracklets if track in C.tracks_of(tid)}
        reuse = only_clip and clip != only_clip and clip in old and set(old[clip]) == in_track
        if reuse: ident = old[clip]
        else: ident = identify(clip, C, cast_ids, ens_ids, blocking, labels_dir)
        identities[clip] = {tid: ident[tid] for tid in sorted(in_track, key=tid_key)}
        if hist_stats: print_hist_stats(C)
    chars = characters_of(track, clips, identities)
    if not data:
        sys.path.insert(0, HERE); import floor
        data = {'format': floor.FORMAT, 'track': track, 'frame': _load(BLOCKING).get('frame', ''), 'clips': {}}
    base = {k: v for k, v in data.items() if k not in ('identities', 'characters')}
    base['identities'] = identities; base['characters'] = chars
    os.makedirs(OUT, exist_ok=True)
    write(p, base)
    summary(track, clips, identities, chars)
    print('-> tools/vision/out/%s.json' % track)


def summary(track, clips, identities, chars):
    rules = ('label', 'continuity', 'appearance', 'blocking', 'pool')
    tot = {r: 0 for r in rules}; n = npos = pooled_pos = 0
    print('track %s: %d clip(s)' % (track, len(clips)))
    for clip, ids in identities.items():
        C = clips[clip]
        c = {r: 0 for r in rules}
        for idn in ids.values(): c[idn['rule']] += 1
        wp = sum(1 for tid in ids if any(e[1] == track for e in C.pos.get(tid, [])))
        pp = sum(1 for tid, idn in ids.items() if idn['id'] == POOL and any(e[1] == track for e in C.pos.get(tid, [])))
        ens_app = sum(1 for idn in ids.values() if idn['id'] == POOL and idn['rule'] == 'appearance')
        print('  %-45s %4d tracklets, %3d with positions | label %d  continuity %d  appearance %d%s  blocking %d  pool %d (%d with positions)' %
              (clip, len(ids), wp, c['label'], c['continuity'], c['appearance'], (' (%d as ens?)' % ens_app) if ens_app else '',
               c['blocking'], c['pool'], pp))
        n += len(ids); npos += wp; pooled_pos += pp
        for r in rules: tot[r] += c[r]
    print('  %-45s %4d tracklets, %3d with positions | %s | ens? with positions %d' %
          ('TOTAL', n, npos, '  '.join('%s %d' % (r, tot[r]) for r in rules), pooled_pos))
    for cid, ss in chars.items():
        wp = [s for s in ss if s['x'] is not None]
        print('    %-10s %4d samples (%d with x, z) from %d tracklet(s)%s' % (cid, len(ss), len(wp), len({(s['clip'], s['tid']) for s in ss}),
              ('  at %.1f..%.1f' % (ss[0]['at'], ss[-1]['at'])) if ss else ''))


def print_hist_stats(C):
    """the appearance threshold's evidence: the same tracklet's two halves vs two tracklets seen in one frame (two
    different people), Bhattacharyya coefficient."""
    import numpy as np
    halves_a, halves_b = {}, {}
    for tid, fr in C.bodies.items():
        fr = [(i, b) for i, b in fr if torso_box(b) is not None]
        if len(fr) < 6: continue
        halves_a[tid + '#a'] = fr[:len(fr) // 2]; halves_b[tid + '#b'] = fr[len(fr) // 2:]
    saved = C.bodies
    C.bodies = {**halves_a, **halves_b}
    H = C.histograms(list(C.bodies))
    C.bodies = saved
    same = [bhatta(H[t + '#a'], H[t + '#b']) for t in (k[:-2] for k in halves_a) if t + '#a' in H and t + '#b' in H]
    full = C.histograms(list(C.tracklets))
    diff = []
    for t1 in full:
        for t2 in full:
            if t1 < t2:
                a, b = C.tracklets[t1], C.tracklets[t2]
                if a['shot'] == b['shot'] and not (a['last'] < b['first'] or b['last'] < a['first']): diff.append(bhatta(full[t1], full[t2]))
    q = lambda v, p: float(np.percentile(v, p)) if v else float('nan')
    print('  %s appearance: same tracklet halves n %d  p10 %.3f  p50 %.3f | two people in one frame n %d  p50 %.3f  p90 %.3f  p95 %.3f'
          ' | at APP_MIN %.2f: %.0f%% of same kept, %.0f%% of different let through' %
          (C.clip, len(same), q(same, 10), q(same, 50), len(diff), q(diff, 50), q(diff, 90), q(diff, 95), APP_MIN,
           100.0 * sum(s >= APP_MIN for s in same) / max(1, len(same)), 100.0 * sum(d >= APP_MIN for d in diff) / max(1, len(diff))))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('track', help='album track id, e.g. 2-05')
    ap.add_argument('--clip', help='recompute only this clip\'s identities (the others keep theirs from the file)')
    ap.add_argument('--labels', help='the labels directory (default tools/vision/labels)')
    ap.add_argument('--hist-stats', action='store_true', help='print the torso-histogram similarity spreads per clip')
    a = ap.parse_args(argv)
    run(a.track, a.clip, a.labels, a.hist_stats)


if __name__ == '__main__':
    main()
