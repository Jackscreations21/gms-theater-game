"""Stage 4 - floor positions (RULINGS FY-4, GA): every body's feet in a calibrated shot, through the shot's camera,
onto the floor.

    python tools/vision/run.py floor <clip> [--unjudged]       # every usable shot -> tools/vision/out/<track>.json
    python tools/vision/run.py floor-check <clip> <shot>        # cache/<clip>/floor-s<shot>.jpg: the frame + a plan

A shot is used when calib/<clip>.json has a `solve` for it, no `skipped`, and `judged` "good" or "fair" (`--unjudged`
also takes a shot with no verdict yet, at the moving shot's weight 0.3).  Per body per frame:

- the foot pixel: the mean of the two ankles (COCO 15, 16) when both have conf > 0.3; else the lower hip (11/12,
  conf > 0.3) plus 0.85 m of leg, in pixels scaled by the box height taken as 1.7 m (so half the box); else none.
- the ray from the camera through it, and the floor it meets:
  * the UPSTAGE gallery first, by the ruling's own test: the deck intersection lands beyond the gallery's front
    line (z < -3.0, or nowhere: a rising ray) while the foot pixel is above that line in the image (setpoints
    gal-us-sr .. gal-us-sl, the front edge AT THE FLOOR, with 0.3 m of height as slack - the rail TOP at y 3.6 is
    not used: from a house lens 1.6 m up a gallery foot sits ~0.8 m below it in the image) -> the y 2.743 plane,
    wherever it lands (a lens near 2.7 m sees that plane edge-on and puts the foot metres off: kept, offMap);
  * else the first of: the deck plane y 0.045; the gallery plane y 2.743 where tools/hamilton-floor.json's `top`
    grid has gallery floor (the one large component at 2.55-2.95 m inside the proscenium, 0.3 m of slack) - the
    side galleries, and the upstage one seen from above; the ray meets it first exactly when the deck point lies
    beyond it;
  * a stair: the `top` grid's mid-height components (0.25-2.55 m, at least 8 cells, rising at least 1 m) as a
    height field the ray is marched against (0.05 m steps): it meets a tread when it is within 0.35 m under the
    tread's top (a ray that passes low through the risers is a foot hidden behind the stair: on to the deck).  A
    stair body is placed where its ray meets the tread and flagged `stair` for a human (RULING GA): the deck plane
    would put it tens of metres upstage from a low lens.  A deck point that falls on a stair cell is `stair` too.
  Nothing is clamped.  A deck point outside the grid or on the house floor beyond the lip is kept, flagged offMap.
- conf = the frame's tconf x the verdict (good 1, fair 0.6, moving or unjudged 0.3) x the least keypoint conf used.

Output tools/vision/out/<track>.json (committed): {format, track, frame, clips: {<clip>: {source{sha256, url}, shots
{<shot>: {camera, fovDeg, rms, judged, moving}}, positions{<tid>: [[at, x, z, level, conf], ...]}}}}; a sample off
the floor map carries a sixth element {"offMap": true}.  A run replaces only its own clip's entry in each track.
"""
import os, sys, json, math, colorsys, zlib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, 'out')
CALIB = os.path.join(HERE, 'calib')
FLOOR = os.path.join(ROOT, 'tools', 'hamilton-floor.json')
BLOCKING = os.path.join(ROOT, 'assets', 'hamilton-blocking.json')
INDEX = os.path.join(ROOT, 'video', 'INDEX.json')
SETPOINTS = os.path.join(HERE, 'setpoints.json')

DECK_Y, GAL_Y = 0.045, 2.743
KP_MIN = 0.3                     # a keypoint is used above this confidence
LEG_OVER_BODY = 0.85 / 1.7       # the hip-to-foot drop as a share of the box height
GAL_SLACK = 0.3                  # metres of gallery edge slack (plan) and of the image test (height)
VERDICT = {'good': 1.0, 'fair': 0.6}
MOVING_W = 0.3
FORMAT = 'hamilton-vision 1'


def _load(p):
    with open(p, encoding='utf-8') as f: return json.load(f)


# ---------------------------------------------------------------- the floor map

class Floor:
    """tools/hamilton-floor.json as masks: deck (stage floor, not the house), gallery, stair (with its height)."""

    def __init__(self):
        import numpy as np, cv2
        d = _load(FLOOR)
        self.x0, self.z0, self.step = float(d['x0']), float(d['z0']), float(d['step'])
        self.deck = np.array(d['deck'], dtype=np.float64); self.top = np.array(d['top'], dtype=np.float64)
        self.nz, self.nx = self.top.shape
        t = self.top
        # gallery: the large component at gallery height that reaches into the playing area (the SL box beyond the
        # proscenium, x 5.8..9.4 z 3.8..6, reads 2.64 too and is not a gallery anyone plays on)
        m = ((t >= 2.55) & (t <= 2.95)).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(m, connectivity=4)
        gal = np.zeros_like(m)
        for k in range(1, n):
            if st[k, cv2.CC_STAT_AREA] >= 100 and self.z0 + st[k, cv2.CC_STAT_TOP] * self.step < 3.6: gal[lab == k] = 1
        self.gallery = gal.astype(bool)
        dist = cv2.distanceTransform((1 - gal).astype(np.uint8), cv2.DIST_L2, 5) * self.step
        self.gallery_near = dist <= GAL_SLACK
        # stairs: mid-height components that rise (a flat ledge at 1.45 or a plinth is not a stair)
        s = ((t >= 0.25) & (t < 2.55)).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(s, connectivity=8)
        stair = np.zeros(t.shape, dtype=bool)
        for k in range(1, n):
            vals = t[lab == k]
            if st[k, cv2.CC_STAT_AREA] >= 8 and vals.max() - vals.min() >= 1.0: stair |= (lab == k)
        self.stair = stair

    def cell(self, x, z):
        """-> (row, col, inside) for arrays of x, z (nearest sample)."""
        import numpy as np
        c = np.rint((np.asarray(x) - self.x0) / self.step).astype(int); r = np.rint((np.asarray(z) - self.z0) / self.step).astype(int)
        inside = (c >= 0) & (c < self.nx) & (r >= 0) & (r < self.nz)
        return np.clip(r, 0, self.nz - 1), np.clip(c, 0, self.nx - 1), inside

    def extent(self):
        return self.x0, self.x0 + (self.nx - 1) * self.step, self.z0, self.z0 + (self.nz - 1) * self.step


# ---------------------------------------------------------------- the camera

class Camera:
    def __init__(self, solve, frame_size):
        import numpy as np
        self.K = np.array(solve['K'], dtype=np.float64); self.R = np.array(solve['R'], dtype=np.float64)
        self.t = np.array(solve['t'], dtype=np.float64).reshape(3)
        self.C = -self.R.T @ self.t
        fw, fh = solve.get('frameSize', frame_size)
        self.sx, self.sy = fw / float(frame_size[0]), fh / float(frame_size[1])    # body pixels -> solve pixels
        self.Kinv = np.linalg.inv(self.K)

    def ray(self, u, v):
        import numpy as np
        d = self.R.T @ (self.Kinv @ np.array([u * self.sx, v * self.sy, 1.0]))
        return d / np.linalg.norm(d)

    def project(self, P):
        import numpy as np
        X = self.R @ np.asarray(P, dtype=np.float64).reshape(3) + self.t
        if X[2] <= 1e-6: return None
        uv = self.K @ X
        return uv[0] / uv[2] / self.sx, uv[1] / uv[2] / self.sy


def plane_hit(cam, d, y):
    """the ray's t where it meets the plane at height y (> 0, in front of the camera) or None."""
    if abs(d[1]) < 1e-9: return None
    t = (y - cam.C[1]) / d[1]
    return t if t > 1e-6 else None


def stair_hit(cam, d, floor, t_max):
    """march the ray over the stairs' height field: the first t (< t_max) where it meets a tread (within 0.35 m under
    its top - a ray that passes low through a stair's risers is a foot hidden behind it, and goes on to the deck)."""
    import numpy as np
    x0, x1, z0, z1 = floor.extent()
    C = cam.C; lo, hi = 0.0, t_max if t_max is not None else 1e4
    for a, b0, b1 in ((0, x0, x1), (2, z0, z1)):       # clip to the grid's box in plan
        if abs(d[a]) < 1e-12:
            if not (b0 <= C[a] <= b1): return None
            continue
        ta, tb = (b0 - C[a]) / d[a], (b1 - C[a]) / d[a]
        lo, hi = max(lo, min(ta, tb)), min(hi, max(ta, tb))
    if hi <= lo: return None
    dp = math.hypot(d[0], d[2])
    if dp < 1e-9: return None
    ts = np.arange(lo, hi, 0.05 / dp)
    if not len(ts): return None
    P = C[None, :] + ts[:, None] * d[None, :]
    r, c, inside = floor.cell(P[:, 0], P[:, 2])
    top = floor.top[r, c]
    hit = inside & floor.stair[r, c] & (P[:, 1] <= top + 0.05) & (P[:, 1] >= top - 0.35)   # on a tread, not through a riser
    k = np.flatnonzero(hit)
    return float(ts[k[0]]) if len(k) else None


class UpstageEdge:
    """the upstage gallery's front line (at the floor) in the image, for the ruling's 'ankle above the rail' test."""

    def __init__(self, cam):
        sp = _load(SETPOINTS)['points']
        self.cam = cam
        self.a, self.b = sp['gal-us-sr']['p'], sp['gal-us-sl']['p']

    def above(self, u, v, x):
        """is pixel (u, v) above the projected front line (with GAL_SLACK of height at that x)?"""
        za, zb = self.a[2], self.b[2]
        xa = min(max(x, self.a[0]), self.b[0])
        z = za + (zb - za) * (xa - self.a[0]) / max(1e-9, self.b[0] - self.a[0])
        p0 = self.cam.project([xa, GAL_Y, z]); p1 = self.cam.project([xa, GAL_Y - GAL_SLACK, z])
        pa, pb = self.cam.project(self.a), self.cam.project(self.b)
        if None in (p0, p1, pa, pb): return True
        if abs(pb[0] - pa[0]) < 1e-6: return True
        line_v = pa[1] + (pb[1] - pa[1]) * (u - pa[0]) / (pb[0] - pa[0])
        return v <= line_v + abs(p1[1] - p0[1])


def foot_pixel(b, frame_h):
    """-> (u, v, kp conf used, 'ankle'|'hip') or None."""
    kp = b['kp']
    la, ra = kp[15], kp[16]
    if la[2] > KP_MIN and ra[2] > KP_MIN:
        return (la[0] + ra[0]) / 2.0, (la[1] + ra[1]) / 2.0, min(la[2], ra[2]), 'ankle'
    hips = [kp[k] for k in (11, 12) if kp[k][2] > KP_MIN]
    if hips:
        h = max(hips, key=lambda p: p[1])
        bh = b['box'][3] - b['box'][1]
        return h[0], h[1] + LEG_OVER_BODY * bh, h[2], 'hip'
    return None


def locate(cam, floor, edge, u, v):
    """foot pixel -> (x, z, level, offMap) or None (the ray meets no floor)."""
    d = cam.ray(u, v)
    t_d = plane_hit(cam, d, DECK_Y)
    t_g = plane_hit(cam, d, GAL_Y)
    # the ruling's test, on the upstage gallery: the deck intersection lands beyond its front line (or nowhere) while
    # the foot pixel is above that line in the image -> the gallery plane, wherever it puts the foot (a grazing view
    # of the plane from a lens near 2.7 m puts it metres off; it is then kept and flagged offMap, not clamped)
    if t_g is not None:
        Pd = cam.C + t_d * d if t_d is not None else None
        Pg = cam.C + t_g * d
        span = edge.a[0] - GAL_SLACK <= Pg[0] <= edge.b[0] + GAL_SLACK
        if span and (Pd is None or Pd[2] < edge.a[2]) and edge.above(u, v, Pg[0]):
            r, c, inside = floor.cell(Pg[0], Pg[2])
            return float(Pg[0]), float(Pg[2]), 'gallery', bool(not (inside and floor.gallery_near[r, c]))
    cands = []
    if t_d is not None: cands.append((t_d, 'deck'))
    if t_g is not None:
        # any gallery (the side ones too): the ray meets gallery floor before the deck
        P = cam.C + t_g * d
        r, c, inside = floor.cell(P[0], P[2])
        if inside and floor.gallery_near[r, c]:
            upstage = P[2] <= -2.7 and edge.a[0] - GAL_SLACK <= P[0] <= edge.b[0] + GAL_SLACK
            if not upstage or edge.above(u, v, P[0]): cands.append((t_g, 'gallery'))
    t_lim = min([t for t, _ in cands], default=None)
    t_s = stair_hit(cam, d, floor, t_lim)
    if t_s is not None: cands.append((t_s, 'stair'))
    if not cands: return None
    t, level = min(cands)
    P = cam.C + t * d
    r, c, inside = floor.cell(P[0], P[2])
    if level == 'deck' and inside and floor.stair[r, c]: level = 'stair'
    off = (not inside) or (level == 'deck' and floor.deck[r, c] < -0.1)
    return float(P[0]), float(P[2]), level, bool(off)


# ---------------------------------------------------------------- per clip

def usable_shots(calib, unjudged=False):
    """{shot id (int): (record, verdict weight)} for the shots stage 4 may use."""
    out = {}
    for s, rec in calib.get('shots', {}).items():
        if rec.get('skipped') or not rec.get('solve'): continue
        j = rec.get('judged')
        if j in VERDICT: w = VERDICT[j]
        elif j is None and unjudged: w = MOVING_W
        else: continue
        if rec.get('moving'): w = min(w, MOVING_W)
        out[int(s)] = (rec, w)
    return out


def shot_positions(sid, rec, weight, frames, bodies_by_i, floor, frame_size):
    """-> list of samples {tid, i, track, at, x, z, level, conf, offMap, src, u, v} and a count of misses."""
    cam = Camera(rec['solve'], frame_size)
    edge = UpstageEdge(cam)
    sh = frames['shots'][sid]
    out, miss = [], {'noFoot': 0, 'noFloor': 0, 'noTime': 0}
    for i in range(sh['first'], sh['last'] + 1):
        f = frames['frames'][i]
        for b in bodies_by_i.get(i, []):
            fp = foot_pixel(b, frame_size[1])
            if fp is None: miss['noFoot'] += 1; continue
            u, v, kc, src = fp
            if f.get('track') is None or f.get('at') is None: miss['noTime'] += 1; continue
            loc = locate(cam, floor, edge, u, v)
            if loc is None: miss['noFloor'] += 1; continue
            x, z, level, off = loc
            nb = locate(cam, floor, edge, u, v + 1)          # how far one pixel lower moves it: the depth's fragility
            mpp = None if level == 'stair' else (math.hypot(nb[0] - x, nb[1] - z) if nb and nb[2] == level else float('inf'))
            out.append({'tid': b['tid'], 'i': i, 'track': f['track'], 'at': f['at'], 'x': x, 'z': z, 'level': level,
                        'conf': (f.get('tconf') or 0.0) * weight * kc, 'offMap': off, 'src': src, 'u': u, 'v': v, 'mpp': mpp})
    return out, miss


def _r(v): return round(float(v), 3)


def dumps(o, ind=0):
    """indent-1 JSON with every list of scalars (a sample, a camera) on one line."""
    flat = lambda x: not isinstance(x, (list, dict)) or (isinstance(x, dict) and all(not isinstance(v, (list, dict)) for v in x.values()))
    pad = ' ' * (ind + 1)
    if isinstance(o, dict):
        if not o: return '{}'
        return '{\n' + ',\n'.join(pad + json.dumps(k, ensure_ascii=False) + ': ' + dumps(v, ind + 1) for k, v in o.items()) + '\n' + ' ' * ind + '}'
    if isinstance(o, list):
        if all(flat(x) for x in o): return json.dumps(o, ensure_ascii=False, separators=(', ', ': '))
        return '[\n' + ',\n'.join(pad + dumps(v, ind + 1) for v in o) + '\n' + ' ' * ind + ']'
    return json.dumps(o, ensure_ascii=False)


def source_of(clip):
    if os.path.isfile(INDEX):
        for e in _load(INDEX).get('files', []):
            if os.path.splitext(e['file'])[0] == clip: return {'sha256': e.get('sha256', ''), 'url': e.get('url', '')}
    return {'sha256': '', 'url': ''}


def cmd_floor(clip, cache_dir, unjudged=False):
    frames = _load(os.path.join(cache_dir, 'frames.json')); bodies = _load(os.path.join(cache_dir, 'bodies.json'))
    cp = os.path.join(CALIB, clip + '.json')
    calib = _load(cp) if os.path.isfile(cp) else {'shots': {}}
    shots = usable_shots(calib, unjudged)
    floor = Floor()
    by_i = {x['i']: x['bodies'] for x in bodies['frames']}
    fsize = bodies.get('frameSize', [1280, 720])
    per_track = {}
    skipped = {s: str(r.get('skipped') or r.get('judged') or 'unjudged')[:40] for s, r in calib.get('shots', {}).items() if int(s) not in shots}
    print('%s: %d calibrated shot(s) used%s' % (clip, len(shots), ('; not used: ' + ', '.join('%s (%s)' % kv for kv in skipped.items())) if skipped else ''))
    for sid in sorted(shots):
        rec, w = shots[sid]
        samples, miss = shot_positions(sid, rec, w, frames, by_i, floor, fsize)
        summary(clip, sid, rec, w, samples, miss)
        for s in samples:
            T = per_track.setdefault(s['track'], {'shots': {}, 'positions': {}})
            sol = rec['solve']
            T['shots'][str(sid)] = {'camera': [_r(v) for v in sol['camera']], 'fovDeg': sol['fovDeg'], 'rms': sol.get('rms'),
                                    'judged': rec.get('judged'), 'moving': rec.get('moving')}
            row = [_r(s['at']), _r(s['x']), _r(s['z']), s['level'], _r(s['conf'])]
            if s['offMap']: row.append({'offMap': True})
            T['positions'].setdefault(s['tid'], []).append(row)
    os.makedirs(OUT, exist_ok=True)
    frame_sentence = _load(BLOCKING).get('frame', '')
    src = source_of(clip)
    written = []
    for track, T in sorted(per_track.items()):
        p = os.path.join(OUT, track + '.json')
        data = _load(p) if os.path.isfile(p) else {}
        data = {'format': FORMAT, 'track': track, 'frame': frame_sentence, 'clips': data.get('clips', {})}
        for tid in T['positions']: T['positions'][tid].sort(key=lambda r: r[0])
        data['clips'][clip] = {'source': src, 'shots': dict(sorted(T['shots'].items(), key=lambda kv: int(kv[0]))),
                               'positions': T['positions']}
        data['clips'] = dict(sorted(data['clips'].items()))
        _write(p, data); written.append(track)
    # a track this clip no longer feeds loses its stale entry
    if os.path.isdir(OUT):
        for fn in sorted(os.listdir(OUT)):
            if not fn.endswith('.json') or fn[:-5] in per_track: continue
            p = os.path.join(OUT, fn); data = _load(p)
            if clip in data.get('clips', {}):
                del data['clips'][clip]
                if data['clips']: _write(p, data)
                else: os.remove(p)
                print('  removed the stale %s entry from out/%s%s' % (clip, fn, '' if data['clips'] else ' (now empty: deleted)'))
    print('-> ' + (', '.join('tools/vision/out/%s.json' % t for t in written) if written else 'nothing written (no usable shot)'))


def _write(p, data):
    with open(p, 'w', encoding='utf-8', newline='\n') as f: f.write(dumps(data) + '\n')


def summary(clip, sid, rec, w, samples, miss):
    from collections import Counter
    sol = rec['solve']
    lv = Counter(s['level'] for s in samples); src = Counter(s['src'] for s in samples)
    off = sum(1 for s in samples if s['offMap']); tids = len({s['tid'] for s in samples})
    head = '  shot %3d  %-7s w %.1f  rms %5.1f  cam (%.1f, %.1f, %.1f)  ' % (sid, rec.get('judged') or 'unjudged', w, sol.get('rms') or -1, *sol['camera'])
    if not samples:
        print(head + 'no positions  (%s)' % ', '.join('%s %d' % kv for kv in miss.items())); return
    on = [s for s in samples if not s['offMap']] or samples
    xs = sorted(s['x'] for s in on); zs = sorted(s['z'] for s in on)
    q = lambda a, p: a[min(len(a) - 1, int(p * (len(a) - 1) + 0.5))]
    inbox = sum(1 for s in samples if -7 <= s['x'] <= 7 and -5 <= s['z'] <= 6)
    print(head + '%d positions, %d tracklets; %d in x -7..7, z -5..6' % (len(samples), tids, inbox))
    print('            on the map: x %.2f..%.2f (5-95%% %.2f..%.2f)  z %.2f..%.2f (5-95%% %.2f..%.2f)' %
          (xs[0], xs[-1], q(xs, .05), q(xs, .95), zs[0], zs[-1], q(zs, .05), q(zs, .95)))
    print('            levels %s  offMap %d  feet from %s  missed %s' % (dict(lv), off, dict(src), ', '.join('%s %d' % kv for kv in miss.items())))
    m = sorted(s['mpp'] for s in samples if s['mpp'] is not None)
    if m: print('            one pixel of foot = %.2f m on the floor (median; 90%% %.2f) (deck/gallery) - over ~0.1 the depth is fragile' % (m[len(m) // 2], m[int(0.9 * (len(m) - 1))]))


# ---------------------------------------------------------------- the check picture

def colour(tid):
    h = (zlib.crc32(tid.encode()) % 360) / 360.0
    r, g, b = colorsys.hsv_to_rgb(h, 0.85, 1.0)
    return int(b * 255), int(g * 255), int(r * 255)


def cmd_floor_check(clip, cache_dir, sid, unjudged=True):
    """cache/<clip>/floor-s<shot>.jpg: the shot's middle frame with every foot pixel (top) over a plan of the floor
    map with every position of the shot (bottom), a colour per tracklet - judged by eye at a glance."""
    import cv2, numpy as np
    frames = _load(os.path.join(cache_dir, 'frames.json')); bodies = _load(os.path.join(cache_dir, 'bodies.json'))
    calib = _load(os.path.join(CALIB, clip + '.json'))
    rec = calib['shots'].get(str(sid))
    if not rec or not rec.get('solve'): sys.exit('no solve for %s shot %d' % (clip, sid))
    j = rec.get('judged'); w = VERDICT.get(j, MOVING_W)
    if rec.get('moving'): w = min(w, MOVING_W)
    floor = Floor(); by_i = {x['i']: x['bodies'] for x in bodies['frames']}
    fsize = bodies.get('frameSize', [1280, 720])
    samples, miss = shot_positions(sid, rec, w, frames, by_i, floor, fsize)
    summary(clip, sid, rec, w, samples, miss)
    # top: the middle frame, the foot pixels of the whole shot
    sh = frames['shots'][sid]; mi = sh['first'] + sh['n'] // 2
    im = cv2.imread(os.path.join(cache_dir, 'frames', frames['frames'][mi]['file']))
    for s in samples:
        cv2.circle(im, (int(s['u']), int(s['v'])), 3 if s['i'] != mi else 6, colour(s['tid']), -1 if s['src'] == 'ankle' else 1)
    for b in by_i.get(mi, []):
        x1, y1, x2, y2 = map(int, b['box']); cv2.rectangle(im, (x1, y1), (x2, y2), colour(b['tid']), 1)
        cv2.putText(im, b['tid'], (x1, max(12, y1 - 3)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, colour(b['tid']), 1)
    W = 1000
    top = cv2.resize(im, (W, int(im.shape[0] * W / im.shape[1])))
    # bottom: the plan, upstage at the top, stage left (+x) on the right - as a house camera sees it
    x0, x1, z0, z1 = floor.extent(); S = W / (x1 - x0 + 0.2)
    H = int((z1 - z0 + 0.2) * S)
    plan = np.full((H, W, 3), 24, np.uint8)
    px = lambda x, z: (int((x - x0 + 0.1) * S), int((z - z0 + 0.1) * S))
    for r in range(floor.nz):
        for c in range(floor.nx):
            x, z = x0 + c * floor.step, z0 + r * floor.step
            col = (70, 70, 70) if floor.deck[r, c] >= -0.1 else (35, 35, 35)
            if floor.stair[r, c]: col = (40, 110, 160)
            elif floor.gallery[r, c]: col = (120, 80, 50)
            a, b = px(x - floor.step / 2, z - floor.step / 2), px(x + floor.step / 2, z + floor.step / 2)
            cv2.rectangle(plan, a, (b[0] - 1, b[1] - 1), col, -1)
    for rr in (3.82, 2.59):
        cv2.circle(plan, px(0, 0.95), int(rr * S), (0, 200, 255), 1, cv2.LINE_AA)
    cv2.line(plan, px(-6.5, 5.4), px(6.5, 5.4), (255, 255, 255), 1)
    for xm in range(-10, 11, 2):
        cv2.putText(plan, str(xm), (px(xm, z1)[0] - 6, H - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (160, 160, 160), 1)
    for zm in range(-6, 7, 2):
        cv2.putText(plan, 'z%d' % zm, (2, px(x0, zm)[1] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (160, 160, 160), 1)
    cv2.putText(plan, 'UPSTAGE', (W // 2 - 30, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
    cv2.putText(plan, 'SR (-x)', (6, H // 2), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
    cv2.putText(plan, 'SL (+x)', (W - 64, H // 2), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
    cv2.putText(plan, 'HOUSE', (W // 2 - 24, H - 16), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
    last = {}; offplan = 0
    for s in samples:
        p = px(s['x'], s['z'])
        if not (0 <= p[0] < W and 0 <= p[1] < H): offplan += 1; continue
        col = colour(s['tid'])
        if s['level'] == 'gallery': cv2.rectangle(plan, (p[0] - 3, p[1] - 3), (p[0] + 3, p[1] + 3), col, 1)
        elif s['level'] == 'stair': cv2.drawMarker(plan, p, col, cv2.MARKER_TRIANGLE_UP, 8, 1)
        else: cv2.circle(plan, p, 3, col, -1)
        last[s['tid']] = p
    for tid, p in last.items(): cv2.putText(plan, tid, (p[0] + 4, p[1] - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, colour(tid), 1)
    sol = rec['solve']
    notes = ['%s shot %d  %s  rms %.1f px  camera (%.1f, %.1f, %.1f)  fov %.1f' % (clip, sid, j or 'UNJUDGED', sol.get('rms') or -1, *sol['camera'], sol['fovDeg']),
             'frame: feet of the whole shot, filled = ankles, hollow = hip + leg; big = this frame',
             'plan: %d positions (%d off the plan)  dot deck, square gallery, triangle stair; blue gallery, brown stair' % (len(samples), offplan)]
    for k, (n, y) in enumerate(zip(notes, (22, 44, 0))):
        tgt = top if k < 2 else plan
        yy = y if k < 2 else 34
        (tw, th), _ = cv2.getTextSize(n, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(tgt, (4, yy - th - 5), (12 + tw, yy + 5), (0, 0, 0), -1)
        cv2.putText(tgt, n, (8, yy), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    sheet = np.vstack([top, plan])
    out = os.path.join(cache_dir, 'floor-s%d.jpg' % sid)
    cv2.imwrite(out, sheet, [cv2.IMWRITE_JPEG_QUALITY, 85])
    print('-> ' + os.path.relpath(out, ROOT))
