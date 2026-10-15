"""GD - dance timing from the skeletons (RULING GD, v1: timing first, shapes later).

    python tools/vision/motion.py <track> [--all] [--dry] [--check] [--top N]

Reads tools/vision/out/<track>.json (stages 4 and 5: `identities` per clip) and, per clip, cache/<clip>/frames.json
(each frame's track, album `at`, tconf, shot) and cache/<clip>/bodies.json (COCO-17 keypoints per tracklet); writes
`motion` and `proposals` into the same out file, every other key kept byte-for-byte.  Run it AFTER `floor` and `ident`:
`floor` rebuilds the out file (dropping `identities`, `characters`, `motion`, `proposals`) and `ident` rewrites it.

1. Per body per frame (the box at least MIN_BOX px high), nine 2D angles from the keypoints over KP_MIN (radians):
   elbow L/R (shoulder-elbow-wrist), shoulder L/R (hip-shoulder-elbow: the arm's raise), knee L/R (hip-knee-ankle),
   hip L/R (shoulder-hip-knee), and the torso lean (mid-hip to mid-shoulder against the image vertical, signed); and
   the wrists' height over the shoulders divided by the box height (the matcher's only length, so a body's size in
   the frame does not matter).
2. Motion energy between two frames of one tracklet (at most MAX_GAP frames apart): the absolute angle changes over
   the album time between them (rad/s), each angle's change capped at DTH_CAP (a left/right swap of the pose model is
   not a move); `arms` = the 4 arm angles, `legs` = the 4 leg angles, each the mean of the angles seen x 4 (2 of 4 at
   least), `energy` = arms + legs + the lean's.  A pair counts in the bar of its midpoint on the track's beat grid
   (assets/hamilton-beats.json through tools/blocking/beats.py: bars from 1 at `firstBeat`, as the blocking counts).
3. `motion`: {"<castId>" | "ens?" | "company": {"<bar>": {energy, arms, legs, n, conf}}} - the mean over the bar's
   pairs (n); conf = the mean of the identity's conf x the frames' tconf (a pooled body: the tconf alone, as `ident`
   does).  "company" is every body of the track, whoever it is, with `bodies` (distinct tracklets) beside n.
4. The matcher (per labelled character - every identity that is not the pool; `--all` adds the pool, as castId
   "ens?"): per tracklet, per window - 8 counts on the bar grid (stride: 8 counts in whole bars), or the tracklet's
   whole run in its shot when that is shorter (the film cuts every few seconds, so most are), at least MIN_BEATS
   beats and MIN_T frames, a frame used when MIN_ANGLES of the 8 limb angles are seen - the window's feature
   sequence against every library move: the move's joint curves (tools/vision/motion/moves.json, exported from
   midtown.html's DANCE by motion/moves2d.js) projected to 2D orthographically - frontal, and turned +-VIEW_DEG -
   mirrored and not, resampled to the window's frames per beat, the SAME features.  Subsequence DTW (slopes 1/2..2):
   a looping move is tiled and the window matched inside it (any phase); a one-shot (played once + HOLD beats held)
   is matched inside the window when it is shorter, else the window inside it.  The distance per frame is 0.65 x
   the arms' mean absolute difference (the 4 angles, and the wrist heights x 2) + 0.35 x the legs' (4 angles and the
   lean); unseen features are skipped.  score = 1 - d / d_still, d_still the same distance from the footage to its
   own mean pose held still over the same frames: 0 when the move explains the window no better than standing
   still, 1 when it explains all of it.  A move whose loop is shorter than ALIAS_FRAMES frames at the window's rate
   (a 1-count bounce at 136 BPM and 5 fps is 2.2 frames) or whose template is under MIN_T frames is not tried.
   `proposals`: [{castId, bar, beat, move, score, span, clip, shot, tid, mirror?, proposed}] - per tracklet the best
   move per window (a window no move scores above 0 on lists nothing); bar and beat where the matched move starts,
   span the beats of footage matched, shot the tracklet's stage-2 shot (its tid's s<n>, the key calib, out and
   ident use); overlapping repeats of one move merged; `proposed` is score > PROPOSE (0.7).  Not evidence on its
   own: a reviewer looks.
A cut in frames.json breaks a tracklet's pairs and windows even where bodies.json has none (frames.json's shot ids
can run ahead of bodies.json's when stage 1 is re-run with new cuts).
--check prints the sanity numbers: the company's energy inside and outside the bars that tools/blocking/segments/
dance.json fills, and the top bars against it.  --dry writes nothing.  Idempotent.
"""
import os, sys, json, math, hashlib, argparse, warnings
import numpy as np

warnings.filterwarnings('ignore', 'Mean of empty slice', RuntimeWarning)   # an unseen feature is nan, on purpose

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, 'out')
CACHE = os.path.join(HERE, 'cache')
MOVES = os.path.join(HERE, 'motion', 'moves.json')
MIDTOWN = os.path.join(ROOT, 'midtown.html')
DANCE_JSON = os.path.join(ROOT, 'tools', 'blocking', 'segments', 'dance.json')
sys.path.insert(0, os.path.join(ROOT, 'tools', 'blocking'))
import beats  # noqa: E402  (the page's beat grid, standard library)

POOL = 'ens?'
COMPANY = 'company'
KP_MIN = 0.3
MIN_BOX = 60            # px (of the 720-high cache frame): a smaller body's angles are noise
MAX_GAP = 2             # frames: a pair further apart is not one motion
DTH_CAP = 1.5           # rad: one angle's change between two frames counts at most this
COUNTS = 8              # the matcher's window (beats)
HOLD = 2                # beats a one-shot is held after it, in its template
VIEW_DEG = 35           # the template is also turned this much each way
ALIAS_FRAMES = 3.0      # a loop shorter than this many frames cannot be seen at the clip's rate
MIN_T = 6               # the shortest template (frames) worth matching
MIN_BEATS = 4           # a window needs this many beats of footage (half an 8-count)
MIN_ANGLES = 4          # a frame is matched when at least this many of the 8 limb angles are seen
W_ARMS, W_LEGS = 0.65, 0.35
WRIST_W = 2.0           # the wrist heights (box heights) weighed against radians
PROPOSE = 0.7           # RULING GD

ARM = ['elbowL', 'elbowR', 'shoulderL', 'shoulderR']
LEG = ['kneeL', 'kneeR', 'hipL', 'hipR']
ANG = ARM + LEG + ['lean']
FEAT = ANG + ['wristL', 'wristR']
F = {n: i for i, n in enumerate(FEAT)}
# (a, b, c): the angle at b, COCO-17 indices; the moves' points by the same names
TRI = {'elbowL': (5, 7, 9), 'elbowR': (6, 8, 10), 'shoulderL': (11, 5, 7), 'shoulderR': (12, 6, 8),
       'kneeL': (11, 13, 15), 'kneeR': (12, 14, 16), 'hipL': (5, 11, 13), 'hipR': (6, 12, 14)}
MOVE_PT = {'shoulderL': 5, 'shoulderR': 6, 'elbowL': 7, 'elbowR': 8, 'wristL': 9, 'wristR': 10,
           'hipL': 11, 'hipR': 12, 'kneeL': 13, 'kneeR': 14, 'ankleL': 15, 'ankleR': 16, 'head': 0}
MIRROR = [F[n.replace('L', '#').replace('R', 'L').replace('#', 'R')] if n != 'lean' else F[n] for n in FEAT]


def _load(p):
    with open(p, encoding='utf-8') as f: return json.load(f)


def _r(v): return round(float(v), 3)


# ---------------------------------------------------------------- features

def features(kp, box):
    """kp: 17 x (x, y, c) in pixels (y down) -> FEAT vector (nan where unseen).  box: (x1, y1, x2, y2)."""
    k = np.asarray(kp, dtype=float)
    ok = k[:, 2] > KP_MIN
    xy = k[:, :2]
    h = box[3] - box[1]
    f = np.full(len(FEAT), np.nan)
    for n, (a, b, c) in TRI.items():
        if ok[a] and ok[b] and ok[c]:
            u, v = xy[a] - xy[b], xy[c] - xy[b]
            nu, nv = np.hypot(*u), np.hypot(*v)
            if nu > 1e-6 and nv > 1e-6: f[F[n]] = math.acos(max(-1.0, min(1.0, float(u @ v) / (nu * nv))))
    sh = [i for i in (5, 6) if ok[i]]; hp = [i for i in (11, 12) if ok[i]]
    if len(sh) == 2 and len(hp) == 2:
        d = xy[[5, 6]].mean(0) - xy[[11, 12]].mean(0)
        f[F['lean']] = math.atan2(d[0], -d[1])
    for s, w, sh_i in (('L', 9, 5), ('R', 10, 6)):
        if ok[w] and ok[sh_i] and h > 0: f[F['wrist' + s]] = (xy[sh_i, 1] - xy[w, 1]) / h
    return f


def move_features(pts, top, yaw_deg):
    """A move's samples (13 points x (x her left, y up, z forward)) seen from the front, turned yaw_deg -> FEAT rows."""
    th = math.radians(yaw_deg)
    out = []
    for P, t in zip(pts, top):
        P = np.asarray(P, dtype=float)
        x = P[:, 0] * math.cos(th) + P[:, 2] * math.sin(th)       # her left is the image's right, facing the camera
        y = -P[:, 1]                                              # image y down
        kp = np.zeros((17, 3))
        for name, i in MOVE_PT.items():
            j = ['head', 'shoulderL', 'shoulderR', 'elbowL', 'elbowR', 'wristL', 'wristR', 'hipL', 'hipR', 'kneeL', 'kneeR',
                 'ankleL', 'ankleR'].index(name)
            kp[i] = (x[j], y[j], 1.0)
        box = (0, -t, 0, -min(P[11, 1], P[12, 1]) + 0.05)
        out.append(features(kp, box))
    return np.array(out)


def ang_diff(a, b):
    d = np.abs(a - b)
    return np.minimum(d, 2 * math.pi - d)


def pair_energy(f0, f1, dt):
    """-> (energy, arms, legs) in rad/s, or None."""
    d = np.minimum(ang_diff(f0[:len(ANG)], f1[:len(ANG)]), DTH_CAP) / dt
    def grp(names):
        v = d[[F[n] for n in names]]; v = v[~np.isnan(v)]
        return float(v.mean() * len(names)) if len(v) >= 2 else None
    arms, legs = grp(ARM), grp(LEG)
    if arms is None and legs is None: return None
    lean = d[F['lean']]; lean = 0.0 if np.isnan(lean) else float(lean)
    return (arms or 0.0) + (legs or 0.0) + lean, arms, legs


# ---------------------------------------------------------------- the track's bodies

class Body:
    """One tracklet's samples on this track: rows of (frame i, at, beat, tconf, frames.json shot, feature vector)."""
    def __init__(self, clip, tid, ident):
        self.clip, self.tid, self.id, self.rule, self.iconf = clip, tid, ident['id'], ident['rule'], ident.get('conf', 0.0)
        self.rows = []
        self.shot = None                      # stage 2's shot (the tid's s<shot>, the key calib/out/ident use)


def load_bodies(track, data):
    out = []
    for clip, ids in sorted(data.get('identities', {}).items()):
        cdir = os.path.join(CACHE, clip)
        if not (os.path.isfile(os.path.join(cdir, 'frames.json')) and os.path.isfile(os.path.join(cdir, 'bodies.json'))):
            print('  %s: no frames.json/bodies.json in the cache - skipped' % clip); continue
        frames = {fr['i']: fr for fr in _load(os.path.join(cdir, 'frames.json'))['frames']}
        bodies = _load(os.path.join(cdir, 'bodies.json'))
        by = {tid: Body(clip, tid, v) for tid, v in ids.items()}
        for tid, B in by.items(): B.shot = bodies.get('tracklets', {}).get(tid, {}).get('shot')
        for fb in bodies['frames']:
            fr = frames.get(fb['i'])
            if not fr or fr.get('track') != track or fr.get('at') is None: continue
            for b in fb['bodies']:
                B = by.get(b['tid'])
                if B is None: continue
                if b['box'][3] - b['box'][1] < MIN_BOX: continue
                B.rows.append((fb['i'], fr['at'], beats.beat_of(track, fr['at']), fr.get('tconf', 1.0), fr.get('shot'), features(b['kp'], b['box'])))
        for B in by.values():
            B.rows.sort(key=lambda r: r[0])
            if len(B.rows) >= 2: out.append(B)
    return out


# ---------------------------------------------------------------- motion per bar

def motion_of(track, bodies):
    meter = beats.grid(track)[1]
    acc = {}                                   # key -> bar -> [sum e, sum arms, n arms, sum legs, n legs, n, sum conf, tids]
    def add(key, bar, e, conf, tid):
        a = acc.setdefault(key, {}).setdefault(bar, [0.0, 0.0, 0, 0.0, 0, 0, 0.0, set()])
        a[0] += e[0]
        if e[1] is not None: a[1] += e[1]; a[2] += 1
        if e[2] is not None: a[3] += e[2]; a[4] += 1
        a[5] += 1; a[6] += conf; a[7].add(tid)
    for B in bodies:
        w = 1.0 if B.id == POOL else B.iconf
        for r0, r1 in zip(B.rows, B.rows[1:]):
            if r1[0] - r0[0] > MAX_GAP or r1[4] != r0[4]: continue
            dt = r1[1] - r0[1]
            if dt <= 0.05: continue
            e = pair_energy(r0[5], r1[5], dt)
            if e is None: continue
            bar = int(((r0[2] + r1[2]) / 2) // meter) + 1
            conf = w * min(r0[3], r1[3])
            add(B.id, bar, e, conf, (B.clip, B.tid))
            add(COMPANY, bar, e, min(r0[3], r1[3]), (B.clip, B.tid))
    out = {}
    order = sorted(acc, key=lambda k: (k == COMPANY, k == POOL, k))
    for key in [COMPANY] + [k for k in order if k != COMPANY]:
        if key not in acc: continue
        out[key] = {}
        for bar in sorted(acc[key]):
            a = acc[key][bar]
            ent = {'energy': _r(a[0] / a[5]), 'arms': _r(a[1] / a[2]) if a[2] else None, 'legs': _r(a[3] / a[4]) if a[4] else None,
                   'n': a[5], 'conf': _r(a[6] / a[5])}
            if key == COMPANY: ent['bodies'] = len(a[7])
            out[key][str(bar)] = ent
    return out


# ---------------------------------------------------------------- the move library

class Library:
    def __init__(self):
        d = _load(MOVES)
        self.source = d.get('source')
        src = open(MIDTOWN, encoding='utf-8', newline='').read()
        code = src[src.index('const DV_N = '):src.index('function danceBaseAt(')]
        self.stale = hashlib.sha256(code.encode('utf-8')).hexdigest()[:16] != self.source
        self.moves = {}
        for name, m in d['moves'].items():
            if name == 'pulse': continue                              # the same as bounce
            views = {}
            for yaw in (0, VIEW_DEG, -VIEW_DEG):
                f = move_features(m['pts'], m['top'], yaw)
                views[(yaw, False)] = f
                views[(yaw, True)] = f[:, MIRROR] * np.where(np.arange(len(FEAT)) == F['lean'], -1, 1)
            self.moves[name] = dict(counts=m['counts'], once=m['once'], spb=m['spb'], views=views)

    def template(self, name, key, spb_obs, beats_len=None):
        """The move's FEAT rows resampled to spb_obs frames per beat: a loop tiled to beats_len beats; a one-shot + HOLD."""
        m = self.moves[name]; f = m['views'][key]; spb = m['spb']
        if m['once'] or beats_len is None: beats_len = m['counts'] + HOLD if m['once'] else COUNTS
        n = max(2, int(round(beats_len * spb_obs)))
        b = np.linspace(0, beats_len, n, endpoint=False)
        if m['once']: idx = np.minimum(b, m['counts']) * spb
        else: idx = np.mod(b, m['counts']) * spb
        lo = np.floor(idx).astype(int); fr = (idx - lo)[:, None]
        L = len(f)
        lo = np.minimum(lo, L - 1); hi = np.minimum(lo + 1, L - 1) if m['once'] else (lo + 1) % L
        return f[lo] * (1 - fr) + f[hi] * fr


def frame_cost(T, O):
    """T (m x F), O (n x F) -> m x n per-frame distances (nan where nothing comparable)."""
    d = ang_diff(T[:, None, :], O[None, :, :])
    wi = [F['wristL'], F['wristR']]
    d[:, :, wi] = np.abs(T[:, None, wi] - O[None, :, wi]) * WRIST_W
    arm_i = [F[n] for n in ARM] + wi; leg_i = [F[n] for n in LEG] + [F['lean']]
    with np.errstate(invalid='ignore', all='ignore'):
        a = np.nanmean(d[:, :, arm_i], axis=2); l = np.nanmean(d[:, :, leg_i], axis=2)
    out = np.where(np.isnan(a), l, np.where(np.isnan(l), a, W_ARMS * a + W_LEGS * l))
    return np.where(np.isnan(out), 1.5, out)                      # unseen: a poor match, not a free one


def sdtw(C):
    """Subsequence DTW: the whole template (rows) inside the observation (cols), steps (1,1), (1,2), (2,1).
    -> (mean cost along the best path, the observation index where it starts, where it ends)."""
    m, n = C.shape
    INF = np.inf
    D = np.full((m, n), INF); L = np.ones((m, n)); S = np.zeros((m, n), dtype=int)
    D[0] = C[0]; S[0] = np.arange(n)
    for j in range(1, m):                       # a row needs only the two rows before it: vectorised along the observation
        cands = []
        c = np.full(n, INF); l = np.ones(n); s = np.zeros(n, dtype=int)
        c[1:] = D[j - 1, :-1] + C[j, 1:]; l[1:] = L[j - 1, :-1] + 1; s[1:] = S[j - 1, :-1]
        cands.append((c, l, s))
        c = np.full(n, INF); l = np.ones(n); s = np.zeros(n, dtype=int)
        c[2:] = D[j - 1, :-2] + C[j, 1:-1] + C[j, 2:]; l[2:] = L[j - 1, :-2] + 2; s[2:] = S[j - 1, :-2]
        cands.append((c, l, s))
        if j >= 2:
            c = np.full(n, INF); l = np.ones(n); s = np.zeros(n, dtype=int)
            c[1:] = D[j - 2, :-1] + C[j - 1, 1:] + C[j, 1:]; l[1:] = L[j - 2, :-1] + 2; s[1:] = S[j - 2, :-1]
            cands.append((c, l, s))
        avg = np.array([c / l for c, l, s in cands]); k = np.argmin(avg, axis=0); ar = np.arange(n)
        D[j] = np.array([c for c, l, s in cands])[k, ar]; L[j] = np.array([l for c, l, s in cands])[k, ar]
        S[j] = np.array([s for c, l, s in cands])[k, ar]
    last = D[m - 1] / L[m - 1]
    e = int(np.argmin(last))
    return float(last[e]), int(S[m - 1, e]), e


def windows(track, bt):
    """A shot's run of one tracklet (its frames' beats, sorted) -> index arrays, one per window: 8-count windows on
    the bar grid (stride: 8 counts in whole bars), or the whole run when it is shorter than 8 counts (the film cuts
    every few seconds: most runs are)."""
    meter = beats.grid(track)[1]
    stride = max(1, round(COUNTS / meter))
    if bt[-1] - bt[0] < COUNTS: return [np.arange(len(bt))]
    out = []
    bar = int(bt[0] // meter) + 1; bar -= (bar - 1) % stride
    while (bar - 1) * meter <= bt[-1]:
        w0 = (bar - 1) * meter
        idx = np.nonzero((bt >= w0) & (bt < w0 + stride * meter))[0]
        if len(idx): out.append(idx)
        bar += stride
    return out


def match_window(lib, O, ob):
    """The best move for one window's features O (k x F) at beats ob -> (score, move, mirror, start beat, beats seen)."""
    k = len(O)
    spb_obs = (k - 1) / max(1e-6, ob[-1] - ob[0])
    null = {}
    def still(s, e):                         # the footage held still at its own mean pose over frames s..e: the yardstick
        if (s, e) not in null:
            with np.errstate(all='ignore'): mu = np.nanmean(O[s:e + 1], axis=0)
            null[(s, e)] = float(np.mean(frame_cost(np.where(np.isnan(mu), 0.0, mu)[None, :], O[s:e + 1])))
        return null[(s, e)]
    best = None
    for name, m in lib.moves.items():
        if not m['once'] and m['counts'] * spb_obs < ALIAS_FRAMES: continue      # faster than the frames can see
        for key in m['views']:
            if m['once']:
                T = lib.template(name, key, spb_obs)
                if len(T) < MIN_T: continue
                if len(T) <= k:                                   # the whole gesture inside the window
                    d, s, e = sdtw(frame_cost(T, O)); start = ob[s]; dn = still(s, e)
                else:                                             # the window inside the gesture (a short shot)
                    d, s, e = sdtw(frame_cost(O, T)); start = ob[0] - s / spb_obs; dn = still(0, k - 1)
            else:                                                 # a loop: the window inside it, tiled, any phase
                T = lib.template(name, key, spb_obs, beats_len=(ob[-1] - ob[0]) + m['counts'] + 1)
                d, s, e = sdtw(frame_cost(O, T)); start = ob[0]; dn = still(0, k - 1)
            score = max(0.0, 1 - d / dn) if dn > 1e-9 else 0.0
            if best is None or score > best[0]: best = (score, name, key[1], float(start))
    return best and best + (float(ob[-1] - ob[0]) + 1 / spb_obs,)


def match_body(track, B, lib):
    """-> [(score, bar, beat, move, mirror, shot, beats seen)] per window, the best move of each."""
    meter = beats.grid(track)[1]
    out = []
    runs = {}
    for r in B.rows: runs.setdefault(r[4], []).append(r)
    for shot, rows in runs.items():
        rows = [r for r in rows if np.count_nonzero(~np.isnan(r[5][:8])) >= MIN_ANGLES]   # a frame showing too little of her
        if len(rows) < MIN_T: continue
        bt = np.array([r[2] for r in rows]); X = np.array([r[5] for r in rows])
        for idx in windows(track, bt):
            if len(idx) < MIN_T or bt[idx[-1]] - bt[idx[0]] < MIN_BEATS: continue
            best = match_window(lib, X[idx], bt[idx])
            if best and best[0] > 0:                 # 0: no move explains it better than standing still - nothing to list
                sb = best[3]; bar = int(sb // meter)
                out.append((best[0], bar + 1, sb - bar * meter + 1, best[1], best[2], B.shot, best[4]))
    return out


def proposals_of(track, bodies, lib, include_pool):
    meter = beats.grid(track)[1]
    props = []
    for B in bodies:
        if B.id == POOL and not include_pool: continue
        res = match_body(track, B, lib)
        res.sort(key=lambda x: (x[1], x[2]))
        kept = []
        for r in res:                          # one move found by two neighbouring windows: keep the better
            if kept and kept[-1][3] == r[3] and abs((kept[-1][1] - 1) * meter + kept[-1][2] - ((r[1] - 1) * meter + r[2])) < COUNTS / 2:
                if r[0] > kept[-1][0]: kept[-1] = r
                continue
            kept.append(r)
        for score, bar, beat, move, mirror, shot, span in kept:
            p = {'castId': B.id, 'bar': bar, 'beat': round(beat, 1), 'move': move, 'score': _r(score), 'span': round(span, 1),
                 'clip': B.clip, 'shot': shot, 'tid': B.tid}
            if mirror: p['mirror'] = True
            p['proposed'] = score > PROPOSE
            props.append(p)
    props.sort(key=lambda p: (p['bar'], p['beat'], p['castId'], p['clip'], p['tid']))
    return props


# ---------------------------------------------------------------- the out file

def split_top(text):
    """The out file's top-level keys -> their raw value text, in order (so every other key is kept byte-for-byte)."""
    dec = json.JSONDecoder()
    i = text.index('{') + 1
    out = []
    while True:
        while text[i] in ' \t\r\n,': i += 1
        if text[i] == '}': break
        key, i = dec.raw_decode(text, i)
        while text[i] in ' \t\r\n:': i += 1
        _, j = dec.raw_decode(text, i)
        out.append((key, text[i:j])); i = j
    return out


def _line(o): return json.dumps(o, ensure_ascii=False, separators=(', ', ': '))


def dumps_motion(m):
    if not m: return '{}'
    parts = []
    for key, bars in m.items():
        inner = ',\n'.join('   ' + json.dumps(b) + ': ' + _line(v) for b, v in bars.items())
        parts.append('  ' + json.dumps(key, ensure_ascii=False) + ': {\n' + inner + '\n  }')
    return '{\n' + ',\n'.join(parts) + '\n }'


def dumps_props(p):
    if not p: return '[]'
    return '[\n' + ',\n'.join('  ' + _line(x) for x in p) + '\n ]'


def write(path, text, motion, props):
    parts = [(k, v) for k, v in split_top(text) if k not in ('motion', 'proposals')]
    parts += [('motion', dumps_motion(motion)), ('proposals', dumps_props(props))]
    body = '{\n' + ',\n'.join(' ' + json.dumps(k, ensure_ascii=False) + ': ' + v for k, v in parts) + '\n}\n'
    with open(path, 'w', encoding='utf-8', newline='\n') as f: f.write(body)


# ---------------------------------------------------------------- the sanity check

def placed_bars(track):
    """Bars that tools/blocking/segments/dance.json fills on this track -> {bar: set(moves)}."""
    if not os.path.isfile(DANCE_JSON): return {}
    meter = beats.grid(track)[1]
    out = {}
    for actor, L in _load(DANCE_JSON).get('moves', {}).items():
        for m in L:
            if m.get('track') != track: continue
            b0 = round(beats.beat_of(track, m['at']))
            for b in range(b0, b0 + max(1, int(math.ceil(m['counts'])))):
                out.setdefault(b // meter + 1, set()).add(m['move'])
    return out


def check(track, motion, props, top):
    comp = motion.get(COMPANY, {})
    placed = placed_bars(track)
    if not comp: print('  no company energy'); return
    inside = [v['energy'] for b, v in comp.items() if int(b) in placed and v['n'] >= 3]
    outside = [v['energy'] for b, v in comp.items() if int(b) not in placed and v['n'] >= 3]
    mi = float(np.median(inside)) if inside else float('nan'); mo = float(np.median(outside)) if outside else float('nan')
    print('  company energy (median rad/s, bars with n>=3): in placed-move bars %.2f (%d bars), elsewhere %.2f (%d bars), ratio %.2f'
          % (mi, len(inside), mo, len(outside), mi / mo if mo else float('nan')))
    ranked = sorted(((v['energy'], int(b), v) for b, v in comp.items() if v['n'] >= 3), reverse=True)[:top]
    hit = sum(1 for _, b, _ in ranked if b in placed)
    share = len(inside) / max(1, len(inside) + len(outside))
    print('  top %d company bars: %d inside placed moves (chance: %.1f)' % (len(ranked), hit, share * len(ranked)))
    for e, b, v in ranked:
        print('    bar %4d  at %6.1f s  energy %5.2f  arms %s  legs %s  n %3d  bodies %2d  %s' % (
            b, beats.beat_time(track, b), e, v['arms'], v['legs'], v['n'], v['bodies'], ', '.join(sorted(placed.get(b, []))) or '-'))
    if props:
        prop = [p for p in props if p['proposed']]
        print('  proposals: %d listed, %d proposed (> %.1f)' % (len(props), len(prop), PROPOSE))
        for p in sorted(props, key=lambda p: -p['score'])[:top]:
            print('    %.3f  %-10s bar %4d beat %.1f  %-14s %s %s s%s %s  placed: %s' % (
                p['score'], p['castId'], p['bar'], p['beat'], p['move'], 'M' if p.get('mirror') else ' ', p['clip'][:4], p['shot'], p['tid'],
                ', '.join(sorted(placed.get(p['bar'], []))) or '-'))


# ---------------------------------------------------------------- main

def run(track, include_pool=False, dry=False, do_check=False, top=12):
    p = os.path.join(OUT, track + '.json')
    if not os.path.isfile(p): sys.exit('no tools/vision/out/%s.json - run floor and ident first' % track)
    with open(p, encoding='utf-8') as f: text = f.read()
    data = json.loads(text)
    if 'identities' not in data: sys.exit('out/%s.json has no identities - run ident first (floor drops them)' % track)
    if track not in beats.TRACKS: sys.exit('no beat grid for track %s in assets/hamilton-beats.json' % track)
    lib = Library()
    if lib.stale: print('  WARNING: midtown.html\'s move code changed since motion/moves.json was made - re-export it (motion/moves2d.js)')
    bodies = load_bodies(track, data)
    motion = motion_of(track, bodies)
    props = proposals_of(track, bodies, lib, include_pool)
    named = sorted({B.id for B in bodies if B.id != POOL})
    print('%s: %d tracklets with 2+ usable frames (%d of them named, as: %s); motion for %d ids over %d bars; %d proposals, %d over %.1f'
          % (track, len(bodies), sum(1 for B in bodies if B.id != POOL), ', '.join(named) or 'none',
             len([k for k in motion if k != COMPANY]), len(motion.get(COMPANY, {})), len(props), sum(p['proposed'] for p in props), PROPOSE))
    if do_check: check(track, motion, props, top)
    if dry: print('  --dry: nothing written'); return motion, props
    if include_pool: print('  --all: the pool\'s bodies are matched too (castId "ens?")')
    write(p, text, motion, props)
    print('-> tools/vision/out/%s.json' % track)
    return motion, props


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('track')
    ap.add_argument('--all', action='store_true', help='match the pooled bodies (ens?) too')
    ap.add_argument('--dry', action='store_true', help='write nothing')
    ap.add_argument('--check', action='store_true', help='print the sanity numbers against dance.json')
    ap.add_argument('--top', type=int, default=12)
    a = ap.parse_args(argv)
    run(a.track, a.all, a.dry, a.check, a.top)


if __name__ == '__main__':
    main()
