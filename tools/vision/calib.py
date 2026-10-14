"""Stage 3 - the camera of a shot (RULING GA), solved from named set points and their pixels.

    python tools/vision/run.py calib <clip> <shot> grid                 # cache/<clip>/grid-s<shot>.jpg: the frame with a labelled 100 px grid
    python tools/vision/run.py calib <clip> <shot> solve name=u,v ...   # solve; write calib/<clip>.json and cache/<clip>/calib-s<shot>.jpg
    python tools/vision/run.py calib <clip> <shot> solve --from FILE    # the points from a JSON {name: [u, v]}
    python tools/vision/run.py calib <clip> list                        # the named points and how to find them
    python tools/vision/run.py calib <clip> all resolve                 # re-solve every shot of the clip from its stored points
    python tools/vision/run.py calib <clip> census                      # the per-point residual census over every calib file
    python -I tools/vision/calib.py resolve all [--no-bodies] [--dry]   # the same over every clip; --dry writes nothing
    python -I tools/vision/calib.py census [--loo]                      # --loo: each point predicted by a solve without it

The lens is unknown: the focal length is grid-searched (horizontal field of view 12-70 deg) and for each the camera
is solved held inside a physical PRIOR (not under the deck, not inside the set: y 0-14, z >= 3.5, |x| <= 14, off the
turntables, at most 60 m from the set centre - the film had pit and on-stage cameras too); a point set that does not pin the lens/distance trade-off is settled by the bodies' shoulder height (1.40 m)
or, without bodies, by the nearest known house camera - see solve_pnp.  Pixels are in
the CACHE frame (720 high, the stage-1 decode), not the source video.  The result per shot: K (fx, fy, cx, cy),
R (3x3), t, the camera's position in set metres, its look direction, the horizontal fov, the RMS and per-point
residuals, and the points used.  The overlay draws the set's wireframe (setpoints.json "wire") through the solved
camera so the fit is judged by eye: the rings, the deck lip, the galleries' edges and rails, the posts.
"""
import os, sys, json, math

HERE = os.path.dirname(os.path.abspath(__file__))
SETPOINTS = os.path.join(HERE, 'setpoints.json')
CALIB = os.path.join(HERE, 'calib')


def setpoints():
    with open(SETPOINTS, encoding='utf-8') as f: return json.load(f)


# The physical prior: a camera of the film is in the house, a side box, the pit, or on the stage downstage of the
# galleries and off the turntables - never under the deck, inside the set or past the back of the house.  Set metres;
# the set centre is the turntable's centre on the deck.  A camera breaking one of these is not a camera that shot this.
# (A first version held cameras to z >= 6, y >= 0.8, fov <= 70; the film's pit camera at deck height with a 80-94 deg
# lens and its on-stage cameras near the SR lip broke it, so the low-wide/far-long choice is the body cue's, not a bound's.)
PRIOR = {'zMin': 3.5, 'yMin': 0.0, 'yMax': 14.0, 'xAbs': 14.0, 'ringR': 3.82, 'dMax': 60.0, 'fovMin': 12.0, 'fovMax': 100.0}
FLAT_PX, FLAT_FOV = 1.5, 30.0     # no body cue and the rms within FLAT_PX over more than FLAT_FOV deg of lens: degenerate
CENTRE = (0.0, 0.045, 0.95)
TOL_PX, TOL_FRAC = 1.5, 0.15      # the rms window inside which the most plausible geometry wins over the least rms
POOR_SPAN = 0.25                  # the window's camera distances spanning more than this share of the best's: poorly conditioned
# the film's cameras that well-conditioned solves found (2026-10-14): the centre-stalls camera (Non-Stop p1 s4, p3 s14,
# What'd I Miss s47, s50), the high close one (Room Where It Happens s52, s65), the pit/front-row cameras (One Last Time
# s37/43/46, 1-03 s42; Washington on Your Side s46), the on-stage camera near the SR lip (We Know s1, s24).  (A rear-house
# 45 m / 24 deg entry from Guns and Ships s16 is gone: misidentified posts - that shot is a pit camera.)
# [x, y, z, fov]: the tie-break of a poorly conditioned solve with no body cue.
HOUSE_CAMERAS = [(0.0, 2.1, 18.0, 33.5), (0.0, 4.5, 14.5, 52.5), (0.0, 0.3, 9.0, 88.0), (-0.1, 0.1, 13.5, 67.0),
                 (-2.6, 1.7, 4.9, 70.0)]
# the body-height depth cue: a standing adult's shoulders are ~1.40 m up (1.25-1.55; a dancer mid-move lower, never
# higher); a candidate is scored rms + LAMBDA * |median implied shoulder height - 1.40|, 0.3 m costing what 5 px does
# among the candidates within CUE_CAP_PX of the best rms only: the cue decides what the points leave open, it does not
# overrule them (a judged-good 4 px fit was pushed to 20 px by bodies standing on a riser without the cap)
SHOULDER_M, NOSE_OVER_SHOULDER_M, LAMBDA, CUE_CAP_PX = 1.40, 0.22, 5.0 / 0.3, 5.0
MIN_BODIES = 3
DECK_Y = 0.045


def _K(fov, w, h):
    import numpy as np
    f = (w / 2.0) / math.tan(math.radians(fov) / 2.0)
    return np.array([[f, 0, w / 2.0], [0, f, h / 2.0], [0, 0, 1]], dtype=np.float64)


def _R0():
    import numpy as np
    return np.diag([1.0, -1.0, -1.0])     # a camera looking straight upstage (-z), image-up = set-up; rotations are relative to it


def _rot(r):
    import cv2, numpy as np
    return cv2.Rodrigues(np.asarray(r, dtype=np.float64).reshape(3, 1))[0] @ _R0()


def _err(obj, img, r, C, K):
    """the pixel error vectors (N x 2) and each point's depth in front of the camera, for rotation r (relative to _R0)
    and camera centre C."""
    import numpy as np
    Pc = _rot(r) @ (obj - np.asarray(C)).T
    uv = K @ Pc
    uv = uv[:2] / np.where(np.abs(uv[2]) < 1e-9, 1e-9, uv[2])
    return uv.T - img, Pc[2]


def _dist(C):
    return math.sqrt(sum((float(C[k]) - CENTRE[k]) ** 2 for k in range(3)))


def violations(C, fov=None):
    """the prior's bounds this camera breaks -> ['y>=0.8', ...] (empty: inside them all)."""
    x, y, z = (float(v) for v in C); d = _dist(C); e = 1e-3; out = []
    if z < PRIOR['zMin'] - e: out.append('z>=%g' % PRIOR['zMin'])
    if y < PRIOR['yMin'] - e: out.append('y>=%g' % PRIOR['yMin'])
    if y > PRIOR['yMax'] + e: out.append('y<=%g' % PRIOR['yMax'])
    if abs(x) > PRIOR['xAbs'] + e: out.append('|x|<=%g' % PRIOR['xAbs'])
    if math.hypot(x, z - CENTRE[2]) < PRIOR['ringR'] - e: out.append('off the turntable')
    if d > PRIOR['dMax'] + e: out.append('dist<=%g' % PRIOR['dMax'])
    if fov is not None and fov < PRIOR['fovMin'] - 0.05: out.append('fov>=%g' % PRIOR['fovMin'])
    if fov is not None and fov > PRIOR['fovMax'] + 0.05: out.append('fov<=%g' % PRIOR['fovMax'])
    return out


def _look_at(C, T):
    """the rotation (relative to _R0, as a rotation vector) of a camera at C looking at T, its image upright."""
    import cv2, numpy as np
    z = np.asarray(T, dtype=np.float64) - np.asarray(C, dtype=np.float64); z /= np.linalg.norm(z)
    x = np.cross(z, [0.0, 1.0, 0.0]); x /= np.linalg.norm(x); y = np.cross(z, x)
    R = np.array([x, y, z])
    return cv2.Rodrigues(R @ _R0().T)[0].reshape(3)


def _bounded(obj, img, K, starts):
    """the least-squares pose at a fixed lens with the camera held inside the prior (a box on its centre, the distance
    and the points' being in front of it as stiff penalties).  -> (rms, r, C) of the best start, or None."""
    import numpy as np
    from scipy.optimize import least_squares
    P = PRIOR; Cc = np.array(CENTRE)
    lo = np.array([-np.inf] * 3 + [-P['xAbs'], P['yMin'], P['zMin']])
    hi = np.array([np.inf] * 3 + [P['xAbs'], P['yMax'], Cc[2] + P['dMax']])

    def fun(x):
        e, z = _err(obj, img, x[:3], x[3:], K)
        d = np.linalg.norm(x[3:] - Cc)
        pen = [100.0 * max(0.0, P['ringR'] - math.hypot(x[3], x[5] - Cc[2])), 100.0 * max(0.0, d - P['dMax'])]
        return np.concatenate([e.ravel(), pen, 100.0 * np.maximum(0.0, 0.5 - z)])

    best = None
    for r0, C0 in starts:
        x0 = np.concatenate([np.asarray(r0, dtype=np.float64).reshape(3), np.clip(np.asarray(C0, dtype=np.float64).reshape(3), lo[3:] + 1e-3, hi[3:] - 1e-3)])
        try: s = least_squares(fun, x0, bounds=(lo, hi), method='trf', x_scale=np.array([0.05] * 3 + [1.0] * 3), max_nfev=400)
        except Exception: continue
        e, z = _err(obj, img, s.x[:3], s.x[3:], K)
        if (z <= 0).any(): continue
        rms = float(np.sqrt((e ** 2).sum(axis=1).mean()))
        if violations(s.x[3:]): rms += 1e3          # a distance penalty that did not bite enough
        if best is None or rms < best[0]: best = (rms, s.x[:3].copy(), s.x[3:].copy())
    return best


def _free(obj, img, K):
    """the unconstrained PnP at a fixed lens (SQPNP, then iterative) -> (rms, r, C) or None."""
    import cv2, numpy as np
    o = obj.reshape(-1, 1, 3); i = img.reshape(-1, 1, 2)
    ok, rv, tv = cv2.solvePnP(o, i, K, None, flags=cv2.SOLVEPNP_SQPNP)
    if not ok: return None
    ok2, rv2, tv2 = cv2.solvePnP(o, i, K, None, rvec=rv.copy(), tvec=tv.copy(), useExtrinsicGuess=True, flags=cv2.SOLVEPNP_ITERATIVE)
    if ok2: rv, tv = rv2, tv2
    R = cv2.Rodrigues(rv)[0]; C = (-R.T @ tv).reshape(3)
    r = cv2.Rodrigues(R @ _R0().T)[0].reshape(3)
    e, z = _err(obj, img, r, C, K)
    return float(np.sqrt((e ** 2).sum(axis=1).mean())), r, C


def body_samples(bodies, fi, first=None, last=None, k=3):
    """from bodies.json, the bodies of frames fi-k..fi+k (inside the shot) with both ankles over 0.3 and both shoulders
    (or else the nose) over 0.3 -> [(foot [u, v], top [u, v], top's height over the shoulders in m)]."""
    if not bodies: return []
    lo, hi = fi - k, fi + k
    if first is not None: lo = max(lo, first)
    if last is not None: hi = min(hi, last)
    out = []
    for f in bodies['frames']:
        if not (lo <= f['i'] <= hi): continue
        for b in f['bodies']:
            kp = b['kp']
            if kp[15][2] <= 0.3 or kp[16][2] <= 0.3: continue
            foot = [(kp[15][0] + kp[16][0]) / 2.0, (kp[15][1] + kp[16][1]) / 2.0]
            if kp[5][2] > 0.3 and kp[6][2] > 0.3: out.append((foot, [(kp[5][0] + kp[6][0]) / 2.0, (kp[5][1] + kp[6][1]) / 2.0], 0.0))
            elif kp[0][2] > 0.3: out.append((foot, [kp[0][0], kp[0][1]], NOSE_OVER_SHOULDER_M))
    return out


def body_height(samples, r, C, K):
    """the median shoulder height the camera (r, C, K) implies for the body samples: the foot pixel's ray meets the deck,
    the top pixel's ray is brought to the vertical through that point (closest approach).  Bodies whose foot lands off
    the deck are left out.  -> (median m, count)."""
    import numpy as np
    R = _rot(r); Ki = np.linalg.inv(K); C = np.asarray(C, dtype=np.float64); hs = []
    for foot, top, off in samples:
        d = R.T @ (Ki @ np.array([foot[0], foot[1], 1.0]))
        if d[1] >= -1e-9: continue
        s = (DECK_Y - C[1]) / d[1]
        X = C + s * d
        if not (abs(X[0]) <= 7.0 and -4.3 <= X[2] <= 5.5): continue
        e = R.T @ (Ki @ np.array([top[0], top[1], 1.0])); e /= np.linalg.norm(e)
        # the vertical line X + t (0,1,0) and the ray C + q e: closest approach
        w0 = X - C; b = e[1]; dd = float(e @ w0); den = 1.0 - b * b
        if den < 1e-9: continue
        t = (b * dd - float(w0[1])) / den
        hs.append(float(X[1] + t - DECK_Y - off))
    if not hs: return None, 0
    return float(np.median(hs)), len(hs)


def m_per_px(sol):
    """metres of deck one pixel (down the frame) moves the floor point at the set centre's pixel - the stage-4 measure
    of how fragile the depth of a foot is in this shot."""
    import numpy as np
    K = np.array(sol['K']); R = np.array(sol['R']); t = np.array(sol['t']).reshape(3)
    C = -R.T @ t
    pc = K @ (R @ np.array(CENTRE) + t)
    if pc[2] <= 0: return None
    u, v = pc[:2] / pc[2]; Ki = np.linalg.inv(K); out = []
    for vv in (v, v + 1):
        d = R.T @ (Ki @ np.array([u, vv, 1.0]))
        if abs(d[1]) < 1e-9: return None
        s = (CENTRE[1] - C[1]) / d[1]
        if s <= 0: return None
        out.append(C + s * d)
    return round(float(np.linalg.norm(out[1] - out[0])), 4)


def conditioning(obj, img, r, C, fov, w, h):
    """how well the points pin the camera: the 3D cloud's spread (singular values of the centred cloud / sqrt(n), m),
    its spread in height and along the look (sd, m), and the camera distance's and the lens's 1-sigma for 1 px of
    point noise (from the Jacobian of the residuals in rotation, centre and fov)."""
    import numpy as np
    sv = np.linalg.svd(obj - obj.mean(axis=0), compute_uv=False) / math.sqrt(len(obj))
    look = _rot(r)[2]
    depth = (obj - C) @ look
    p0 = np.concatenate([r, C, [fov]])

    def res(p): return _err(obj, img, p[:3], p[3:6], _K(p[6], w, h))[0].ravel()
    steps = np.array([1e-4] * 3 + [1e-3] * 3 + [1e-3])
    J = np.zeros((2 * len(obj), 7))
    for k in range(7):
        dp = np.zeros(7); dp[k] = steps[k]
        J[:, k] = (res(p0 + dp) - res(p0 - dp)) / (2 * steps[k])
    g = np.zeros(7); dC = np.asarray(C) - np.array(CENTRE); g[3:6] = dC / max(1e-9, np.linalg.norm(dC))
    try:
        cov = np.linalg.inv(J.T @ J)
        sd_d = float(math.sqrt(max(0.0, g @ cov @ g))); sd_f = float(math.sqrt(max(0.0, cov[6, 6])))
    except np.linalg.LinAlgError:
        sd_d = sd_f = float('inf')
    rd = lambda v, n=2: (round(v, n) if math.isfinite(v) else 1e9)
    return {'sv': [round(float(s), 2) for s in sv], 'heightSd': round(float(obj[:, 1].std()), 2), 'depthSd': round(float(depth.std()), 2),
            'sdDistPerPx': rd(sd_d), 'sdFovPerPx': rd(sd_f)}


def solve_pnp(obj, img, w, h, fov_lo=None, fov_hi=None, prior=True, bodies=None):
    """obj: Nx3 set points, img: Nx2 pixels, (w, h) the frame, bodies: body_samples() of the shot or None.
    -> dict with K, R, t, rvec, camera, look, fovDeg, rms, residuals, frameSize, and the prior's record: free (the
    unconstrained best), degenerate (the bounds the points alone break, when no unconstrained candidate keeps inside
    the prior), choice, window, depthCue, bodyHeightM, mPerPx, cond.

    The lens is grid-searched; at each the camera is solved twice: free (PnP) and bounded (least squares with the
    camera held inside PRIOR).  With MIN_BODIES or more bodies on the deck, the candidate with the least rms +
    LAMBDA * |implied shoulder height - 1.40| wins among those within CUE_CAP_PX of the best rms (depthCue "bodies").  Else the best bounded rms sets a window
    (TOL_PX or TOL_FRAC, the larger): if its camera distances span more than POOR_SPAN of the best's (the points do
    not pin the lens/distance trade-off), the candidate nearest one of HOUSE_CAMERAS wins, else the least rms."""
    import numpy as np
    obj = np.asarray(obj, dtype=np.float64).reshape(-1, 3); img = np.asarray(img, dtype=np.float64).reshape(-1, 2)
    P = PRIOR
    lo = P['fovMin'] if fov_lo is None else fov_lo; hi = P['fovMax'] if fov_hi is None else fov_hi
    # free: every lens 12-100, to say what the points alone want
    free = []
    for fov in np.arange(min(lo, 12.0), max(hi, 100.0) + 0.01, 1.0):
        s = _free(obj, img, _K(fov, w, h))
        if s: free.append((s[0], float(fov), s[1], s[2]))
    if not prior:
        if not free: return None
        rms, fov, r, C = min(free, key=lambda c: c[0])
        return _pack(obj, img, r, C, fov, w, h, {'prior': False})
    free_in = [c for c in free if not violations(c[3], c[1])]
    fb = min(free, key=lambda c: c[0]) if free else None
    # bounded: every lens in the prior's range, warm-started from the previous lens, the free pose, and look-ats
    T = obj.mean(axis=0); cands = []; prev = None
    for fov in np.arange(lo, hi + 0.01, 1.0):
        K = _K(fov, w, h); starts = []
        if prev is not None: starts.append(prev)
        s = _free(obj, img, K)
        if s: starts.append((s[1], s[2]))
        for C0 in ([0.0, 2.0, 14.0], [0.0, 3.0, 25.0], [0.0, 3.0, 40.0], [0.0, 5.0, 55.0], [0.0, 0.4, 9.0], [-2.5, 1.2, 5.5], [2.5, 1.2, 5.5]):
            starts.append((_look_at(C0, T), C0))
        b = _bounded(obj, img, K, starts)
        if b is None or b[0] >= 1e3: continue
        cands.append((b[0], float(fov), b[1], b[2])); prev = (b[1], b[2])
    if not cands: return None
    best = min(cands, key=lambda c: c[0])
    tol = max(TOL_PX, TOL_FRAC * best[0])
    win = [c for c in cands if c[0] <= best[0] + tol]
    ds = [_dist(c[3]) for c in win]
    poor = (max(ds) - min(ds)) > POOR_SPAN * _dist(best[3])

    def bscore(c):          # rms + LAMBDA |h - 1.40|, or None when too few bodies land on the deck
        hm, n = body_height(bodies, c[2], c[3], _K(c[1], w, h))
        return (None, hm, n) if n < MIN_BODIES else (c[0] + LAMBDA * abs(hm - SHOULDER_M), hm, n)

    scored = []; cue_note = None
    if bodies and len(bodies) >= MIN_BODIES:
        hs = []
        for c in cands:
            if c[0] > best[0] + CUE_CAP_PX: continue
            s = bscore(c)
            if s[0] is not None: scored.append((s[0], c)); hs.append(s[1])
        # the cue only when it says something: the implied height must move along the candidates (else it is noise
        # pulling to a bound) and reach a standing adult's somewhere (else the bodies are not standing on the deck)
        if scored and max(hs) - min(hs) < 0.15:
            cue_note = 'uninformative: shoulders %.2f-%.2f m over every lens' % (min(hs), max(hs)); scored = []
        elif scored and not any(1.25 <= x <= 1.55 for x in hs):
            cue_note = 'implausible: shoulders %.2f-%.2f m, never 1.25-1.55' % (min(hs), max(hs)); scored = []
    elif bodies is not None:
        cue_note = 'fewer than %d bodies' % MIN_BODIES
    cue = 'bodies' if scored else 'none'
    if scored:
        pick = min(scored, key=lambda x: x[0])[1]; choice = 'least rms + %.1f px/m x |shoulders - %.2f m|' % (LAMBDA, SHOULDER_M); key = lambda c: bscore(c)[0]
    elif poor:
        near = lambda c: min(math.dist(c[3], k[:3]) for k in HOUSE_CAMERAS)
        pick = min(win, key=near); choice = 'nearest house camera within %.1f px of the best' % tol; key = None
    else:
        pick = best; choice = 'least rms'; key = lambda c: c[0]
    if key is not None:     # a finer lens search around the pick, by the same score
        k0 = key(pick)
        for fov in np.arange(pick[1] - 0.9, pick[1] + 0.901, 0.1):
            if not (lo - 1e-6 <= fov <= hi + 1e-6): continue
            b = _bounded(obj, img, _K(fov, w, h), [(pick[2], pick[3])])
            if not b or b[0] >= 1e3: continue
            c = (b[0], float(fov), b[1], b[2]); kc = key(c)
            if kc is not None and kc < k0: pick, k0 = c, kc
    rms, fov, r, C = pick
    extra = {'prior': 'house', 'choice': choice, 'depthCue': cue, 'depthCueNote': cue_note,
             'window': {'tolPx': round(tol, 2), 'fov': [min(c[1] for c in win), max(c[1] for c in win)],
                        'dist': [round(min(ds), 1), round(max(ds), 1)], 'poor': bool(poor)}}
    if bodies:
        hm, n = body_height(bodies, r, C, _K(fov, w, h))
        extra['bodyHeightM'] = round(hm, 2) if hm is not None else None; extra['bodies'] = n
    if fb: extra['free'] = {'camera': [round(float(v), 2) for v in fb[3]], 'fovDeg': round(fb[1], 1), 'rms': round(fb[0], 2),
                            'breaks': violations(fb[3], fb[1])}
    # degenerate: no body cue to decide and the points flat over a wide range of lens - the honest label
    flat = [c[1] for c in cands if c[0] <= best[0] + FLAT_PX]
    if cue == 'none' and max(flat) - min(flat) > FLAT_FOV:
        extra['degenerate'] = 'rms within %.1f px over fov %.0f-%.0f' % (FLAT_PX, min(flat), max(flat))
    elif not free_in:
        extra['degenerate'] = 'the points alone want ' + ', '.join((violations(fb[3], fb[1]) if fb else []) or ['no free solve'])
    return _pack(obj, img, r, C, fov, w, h, extra)


def _pack(obj, img, r, C, fov, w, h, extra):
    import cv2, numpy as np
    K = _K(fov, w, h); R = _rot(r); t = -R @ np.asarray(C)
    e, _ = _err(obj, img, r, C, K); res = np.linalg.norm(e, axis=1)
    rvec = cv2.Rodrigues(R)[0].reshape(3)
    out = {'K': K.tolist(), 'R': R.tolist(), 't': t.reshape(3).tolist(), 'rvec': rvec.tolist(),
           'camera': [round(float(v), 3) for v in C], 'look': [round(float(v), 3) for v in R[2]],
           'fovDeg': round(float(fov), 1), 'rms': round(float(np.sqrt((res ** 2).mean())), 2), 'residuals': [round(float(x), 1) for x in res],
           'frameSize': [w, h]}
    out.update(extra)
    out['mPerPx'] = m_per_px(out)
    out['cond'] = conditioning(obj, img, np.asarray(r, dtype=np.float64), np.asarray(C, dtype=np.float64), fov, w, h)
    return out


def project(points, sol):
    """set points (Nx3) -> pixels (Nx2) and a mask of those in front of the camera."""
    import numpy as np
    K = np.array(sol['K']); R = np.array(sol['R']); t = np.array(sol['t']).reshape(3, 1)
    P = np.asarray(points, dtype=np.float64).reshape(-1, 3).T
    C = R @ P + t
    z = C[2]
    uv = (K @ C)
    uv = (uv[:2] / np.where(np.abs(uv[2]) < 1e-9, 1e-9, uv[2])).T
    return uv, z > 0.05


def draw_overlay(frame_path, sol, points_used, out_path, label=''):
    """the frame with the wireframe, the used points (yellow: clicked, green: reprojected) and the residuals."""
    import cv2, numpy as np
    im = cv2.imread(frame_path)
    sp = setpoints(); wire = sp['wire']
    for line in wire['lines']:
        uv, ok = project(line, sol)
        for a in range(len(line) - 1):
            if ok[a] and ok[a + 1]:
                cv2.line(im, (int(uv[a][0]), int(uv[a][1])), (int(uv[a + 1][0]), int(uv[a + 1][1])), (255, 200, 0), 1, cv2.LINE_AA)
    for cx, y, cz, r in wire['circles']:
        pts = [[cx + r * math.cos(a), y, cz + r * math.sin(a)] for a in np.linspace(0, 2 * math.pi, 73)]
        uv, ok = project(pts, sol)
        for a in range(len(pts) - 1):
            if ok[a] and ok[a + 1]:
                cv2.line(im, (int(uv[a][0]), int(uv[a][1])), (int(uv[a + 1][0]), int(uv[a + 1][1])), (0, 200, 255), 1, cv2.LINE_AA)
    names = list(points_used.keys())
    obj = [sp['points'][n]['p'] for n in names]
    uv, ok = project(obj, sol)
    for k, n in enumerate(names):
        u, v = points_used[n]
        cv2.circle(im, (int(u), int(v)), 5, (0, 255, 255), 1)
        cv2.circle(im, (int(uv[k][0]), int(uv[k][1])), 3, (0, 255, 0), -1)
        cv2.line(im, (int(u), int(v)), (int(uv[k][0]), int(uv[k][1])), (0, 255, 0), 1)
        cv2.putText(im, '%s %.0f' % (n, sol['residuals'][k]), (int(u) + 6, int(v) - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
    cv2.putText(im, '%s  fov %.1f  rms %.1f px  cam (%.1f, %.1f, %.1f)' % (label, sol['fovDeg'], sol['rms'], *sol['camera']),
                (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    if 'mPerPx' in sol:
        cv2.putText(im, '%.3f m/px at centre  cue %s%s%s' % (sol['mPerPx'] or -1, sol.get('depthCue', '-'),
                    ('  shoulders %.2f m' % sol['bodyHeightM']) if sol.get('bodyHeightM') is not None else '',
                    ('  DEGENERATE: ' + sol['degenerate']) if sol.get('degenerate') else ''),
                    (8, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255) if sol.get('degenerate') else (255, 255, 255), 2)
    cv2.imwrite(out_path, im, [cv2.IMWRITE_JPEG_QUALITY, 85])


def draw_grid(frame_path, out_path, step=100):
    """the frame with a labelled grid every `step` px, to read pixel positions off a picture."""
    import cv2
    im = cv2.imread(frame_path); h, w = im.shape[:2]
    big = cv2.resize(im, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)       # 2x so a label is legible when viewed scaled down
    for x in range(0, w, step):
        cv2.line(big, (x * 2, 0), (x * 2, h * 2), (0, 255, 255) if x % 500 == 0 else (0, 160, 160), 1)
        cv2.putText(big, str(x), (x * 2 + 3, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        cv2.putText(big, str(x), (x * 2 + 3, h * 2 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    for y in range(0, h, step):
        cv2.line(big, (0, y * 2), (w * 2, y * 2), (0, 255, 255) if y % 500 == 0 else (0, 160, 160), 1)
        cv2.putText(big, str(y), (3, y * 2 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        cv2.putText(big, str(y), (w * 2 - 40, y * 2 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    cv2.imwrite(out_path, big, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return w, h


def wire_samples(step=0.15):
    """the wireframe as a cloud of 3D points every `step` m along its lines and circles."""
    import numpy as np
    sp = setpoints(); wire = sp['wire']; pts = []
    for line in wire['lines']:
        for a in range(len(line) - 1):
            p0, p1 = np.array(line[a]), np.array(line[a + 1]); n = max(2, int(np.linalg.norm(p1 - p0) / step))
            for k in range(n + 1): pts.append(p0 + (p1 - p0) * k / n)
    for cx, y, cz, r in wire['circles']:
        for a in np.linspace(0, 2 * math.pi, int(2 * math.pi * r / step)): pts.append([cx + r * math.cos(a), y, cz + r * math.sin(a)])
    return np.array(pts, dtype=np.float64)


def refine_edges(frame_path, sol, points_used=None, sigmas=(8, 4, 2), point_weight=0.5):
    """slide the solved camera until the wireframe lies on the image's edges: maximise the mean blurred gradient
    magnitude under the projected wire samples (coarse to fine), penalised by the clicked points' residuals.
    Returns the refined solve dict (same shape as solve_pnp's) and the edge score before/after."""
    import cv2, numpy as np
    from scipy.optimize import minimize
    im = cv2.imread(frame_path); h, w = im.shape[:2]
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3); gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.sqrt(gx * gx + gy * gy); mag /= (np.percentile(mag, 99) + 1e-6); mag = np.clip(mag, 0, 1)
    W = wire_samples()
    sp = setpoints()
    names = list(points_used.keys()) if points_used else []
    obj = np.array([sp['points'][n]['p'] for n in names], dtype=np.float64) if names else None
    img = np.array([points_used[n] for n in names], dtype=np.float64) if names else None
    cx, cy = w / 2.0, h / 2.0

    def unpack(x):
        rvec = x[:3].reshape(3, 1); tvec = x[3:6].reshape(3, 1); fov = x[6]
        f = (w / 2.0) / math.tan(math.radians(fov) / 2.0)
        K = np.array([[f, 0, cx], [0, f, cy], [0, 0, 1]], dtype=np.float64)
        return rvec, tvec, K

    def score(x, blurred):
        rvec, tvec, K = unpack(x)
        if not (8 <= x[6] <= 120): return 1e3
        R, _ = cv2.Rodrigues(rvec)
        C = (R @ W.T + tvec); z = C[2]
        uv = (K @ C); uv = uv[:2] / np.where(np.abs(uv[2]) < 1e-9, 1e-9, uv[2])
        u, v = uv[0], uv[1]
        ok = (z > 0.1) & (u >= 0) & (u < w - 1) & (v >= 0) & (v < h - 1)
        if ok.sum() < 20: return 1e3
        s = blurred[v[ok].astype(int), u[ok].astype(int)].mean()
        pen = 0.0
        if obj is not None:
            proj, _ = cv2.projectPoints(obj.reshape(-1, 1, 3), rvec, tvec, K, None)
            res = np.linalg.norm(proj.reshape(-1, 2) - img, axis=1)
            pen = point_weight * float(np.sqrt((res ** 2).mean())) / 100.0     # 100 px of rms costs 0.5 of edge score
        return -s + pen

    x0 = np.array(list(sol['rvec']) + list(sol['t']) + [sol['fovDeg']], dtype=np.float64)
    before = -score(x0, cv2.GaussianBlur(mag, (0, 0), 2))
    x = x0
    for sg in sigmas:
        blurred = cv2.GaussianBlur(mag, (0, 0), sg)
        r = minimize(score, x, args=(blurred,), method='Nelder-Mead',
                     options={'xatol': 1e-4, 'fatol': 1e-6, 'maxiter': 4000, 'initial_simplex': None})
        x = r.x
    after = -score(x, cv2.GaussianBlur(mag, (0, 0), 2))
    rvec, tvec, K = unpack(x)
    R, _ = cv2.Rodrigues(rvec)
    cam = (-R.T @ tvec).reshape(3); look = (R.T @ np.array([0, 0, 1.0])).reshape(3)
    out = dict(sol)
    out.update({'K': K.tolist(), 'R': R.tolist(), 't': tvec.reshape(3).tolist(), 'rvec': rvec.reshape(3).tolist(),
                'camera': [round(float(v), 3) for v in cam], 'look': [round(float(v), 3) for v in look], 'fovDeg': round(float(x[6]), 1),
                'edgeScore': {'before': round(float(before), 4), 'after': round(float(after), 4)}, 'refined': 'edges'})
    if obj is not None:
        proj, _ = cv2.projectPoints(obj.reshape(-1, 1, 3), rvec, tvec, K, None)
        res = np.linalg.norm(proj.reshape(-1, 2) - img, axis=1)
        out['rms'] = round(float(np.sqrt((res ** 2).mean())), 2); out['residuals'] = [round(float(v), 1) for v in res]
    return out


def draw_zooms(frame_path, sol, out_dir, shot, names=None, box=60, scale=4):
    """for every named set point the solve puts inside the frame (or the `names` given), a crop `box` px around
    its predicted pixel at `scale`x with a 10 px grid labelled in frame pixels and a crosshair at the prediction:
    an agent (or a person) reads the TRUE pixel off it and re-solves.  Writes zoom-s<shot>-<name>.jpg; returns
    {name: [u, v] predicted}."""
    import cv2, numpy as np
    im = cv2.imread(frame_path); h, w = im.shape[:2]
    sp = setpoints(); all_names = list(sp['points'].keys())
    uv, ok = project([sp['points'][n]['p'] for n in all_names], sol)
    pred = {}
    for k, n in enumerate(all_names):
        if names and n not in names: continue
        u, v = uv[k]
        if not ok[k] or not (0 <= u < w and 0 <= v < h): continue
        pred[n] = [round(float(u), 1), round(float(v), 1)]
        x0, y0 = int(max(0, u - box)), int(max(0, v - box)); x1, y1 = int(min(w, u + box)), int(min(h, v + box))
        crop = cv2.resize(im[y0:y1, x0:x1], ((x1 - x0) * scale, (y1 - y0) * scale), interpolation=cv2.INTER_CUBIC)
        for x in range((x0 // 10) * 10, x1, 10):
            if x < x0: continue
            X = (x - x0) * scale; cv2.line(crop, (X, 0), (X, crop.shape[0]), (0, 200, 200) if x % 50 else (0, 255, 255), 1)
            if x % 50 == 0: cv2.putText(crop, str(x), (X + 2, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
        for y in range((y0 // 10) * 10, y1, 10):
            if y < y0: continue
            Y = (y - y0) * scale; cv2.line(crop, (0, Y), (crop.shape[1], Y), (0, 200, 200) if y % 50 else (0, 255, 255), 1)
            if y % 50 == 0: cv2.putText(crop, str(y), (2, Y - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
        cu, cv_ = int((u - x0) * scale), int((v - y0) * scale)
        cv2.drawMarker(crop, (cu, cv_), (0, 0, 255), cv2.MARKER_CROSS, 40, 2)
        cv2.putText(crop, '%s  predicted (%.0f, %.0f): %s' % (n, u, v, sp['points'][n]['see'][:70]), (4, crop.shape[0] - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
        cv2.imwrite(os.path.join(out_dir, 'zoom-s%d-%s.jpg' % (shot, n)), crop, [cv2.IMWRITE_JPEG_QUALITY, 88])
    return pred


def wide_shots(frames, bodies, max_h=0.4, min_bodies=3):
    """the shots that look wide: bodies small (median box height under max_h of the frame) and several of them -
    the shots worth calibrating (RULING GA skips the close-ups)."""
    import numpy as np
    H = bodies['frameSize'][1]
    by_i = {x['i']: x['bodies'] for x in bodies['frames']}
    out = []
    for sh in frames['shots']:
        hs, counts = [], []
        for i in range(sh['first'], sh['last'] + 1):
            bs = by_i.get(i, []); counts.append(len(bs))
            hs += [(b['box'][3] - b['box'][1]) / H for b in bs]
        if not hs: continue
        med_h, med_n = float(np.median(hs)), float(np.median(counts))
        if med_h <= max_h and med_n >= min_bodies:
            f0 = frames['frames'][sh['first']]
            out.append({'shot': sh['id'], 'frames': [sh['first'], sh['last']], 'n': sh['n'], 'track': f0['track'], 'at': f0['at'],
                        'bodyH': round(med_h, 2), 'bodies': med_n})
    return out


def load_calib(clip):
    p = os.path.join(CALIB, clip + '.json')
    if os.path.isfile(p):
        with open(p, encoding='utf-8') as f: return json.load(f)
    return {'clip': clip, 'what': 'per-shot camera solves (RULING GA); pixels in the 720-high cache frame', 'shots': {}}


def save_calib(clip, data):
    os.makedirs(CALIB, exist_ok=True)
    with open(os.path.join(CALIB, clip + '.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, indent=1); f.write('\n')


CACHE = os.path.join(HERE, 'cache')


def _json(p):
    if not os.path.isfile(p): return None
    with open(p, encoding='utf-8') as f: return json.load(f)


def shot_bodies(cache_dir, frames, fi):
    """the body samples for a solve at frame fi (fi +- 3, inside its shot)."""
    bo = _json(os.path.join(cache_dir, 'bodies.json'))
    if not bo or not frames: return []
    s = frames['frames'][fi].get('shot')
    sh = frames['shots'][s] if s is not None and s < len(frames['shots']) else None
    return body_samples(bo, fi, sh['first'] if sh else None, sh['last'] if sh else None)


def resolve(clip, use_bodies=True, write=True, quiet=False):
    """re-solve every shot of a clip that has 5+ stored points, through the prior (and the body cue): the record's
    points, frame, judged, moving, skipped, note are kept; only `solve` is replaced, the overlay redrawn.  The file is
    re-read just before writing and a shot is only patched if its points did not change meanwhile (other agents write
    these files).  -> rows for the table."""
    import cv2
    sp = setpoints()['points']
    cache_dir = os.path.join(CACHE, clip)
    frames = _json(os.path.join(cache_dir, 'frames.json'))
    data = load_calib(clip); rows = []; new = {}
    for s, rec in sorted(data['shots'].items(), key=lambda kv: int(kv[0])):
        pts = rec.get('points') or {}
        if len(pts) < 5: continue
        names = [n for n in pts if n in sp]
        if len(names) < 5: continue
        fi = rec.get('frame'); old = rec.get('solve') or {}
        fsize = old.get('frameSize') or [1280, 720]; frame_path = None
        if frames and fi is not None:
            frame_path = os.path.join(cache_dir, 'frames', frames['frames'][fi]['file'])
            im = cv2.imread(frame_path)
            if im is not None: fsize = [im.shape[1], im.shape[0]]
            else: frame_path = None
        bodies = (shot_bodies(cache_dir, frames, fi) if fi is not None else []) if use_bodies else None
        sol = solve_pnp([sp[n]['p'] for n in names], [pts[n] for n in names], fsize[0], fsize[1], bodies=bodies)
        if sol is None: continue
        new[s] = (pts, sol)
        rows.append({'clip': clip, 'shot': int(s), 'n': len(names), 'skipped': bool(rec.get('skipped')), 'judged': rec.get('judged'),
                     'rmsBefore': old.get('rms'), 'camBefore': old.get('camera'), 'fovBefore': old.get('fovDeg'), 'rms': sol['rms'],
                     'cam': sol['camera'], 'fov': sol['fovDeg'], 'mPerPx': sol['mPerPx'], 'cue': sol['depthCue'],
                     'h': sol.get('bodyHeightM'), 'nb': sol.get('bodies', 0), 'deg': sol.get('degenerate'),
                     'poor': sol['window']['poor'], 'sdDist': sol['cond']['sdDistPerPx'], 'frame_path': frame_path, 'cache_dir': cache_dir})
    if write and new:
        data = load_calib(clip); changed = False
        for s, (pts, sol) in new.items():
            rec = data['shots'].get(s)
            if not rec or rec.get('points') != pts: continue      # changed under us: leave it
            rec['solve'] = sol; changed = True
            row = next(r for r in rows if r['shot'] == int(s))
            if row['frame_path']:
                draw_overlay(row['frame_path'], sol, {n: pts[n] for n in pts if n in sp}, os.path.join(row['cache_dir'], 'calib-s%s.jpg' % s),
                             label='%s shot %s' % (clip, s))
        if changed: save_calib(clip, data)
    if not quiet: print_rows(rows)
    return rows


def _cam(c): return '(%5.1f %4.1f %5.1f)' % tuple(c) if c else '(   -     -     -  )'


def print_rows(rows):
    print('%-5s %4s %2s %13s  %-20s -> %-20s %11s %7s %-6s %5s %s' % ('clip', 'shot', 'n', 'rms before->after', 'camera before', 'after', 'fov', 'm/px', 'cue', 'h', 'degenerate'))
    for r in rows:
        print('%-5s %4d %2d %6s -> %5.1f  %-20s -> %-20s %4s->%4.1f %7s %-6s %5s %s%s%s' % (
            r['clip'][:4], r['shot'], r['n'], ('%.1f' % r['rmsBefore']) if r['rmsBefore'] is not None else '-', r['rms'],
            _cam(r['camBefore']), _cam(r['cam']), ('%.0f' % r['fovBefore']) if r['fovBefore'] is not None else '-', r['fov'],
            ('%.3f' % r['mPerPx']) if r['mPerPx'] is not None else '-', r['cue'], ('%.2f' % r['h']) if r['h'] is not None else '-',
            r['deg'] or '', '  [poorly conditioned]' if r['poor'] else '', '  [skipped]' if r['skipped'] else ''))


def summarise(rows):
    import numpy as np
    low_b = sum(1 for r in rows if r['camBefore'] and r['camBefore'][1] < 0.8); low_a = sum(1 for r in rows if r['cam'][1] < 0.8)
    out_b = sum(1 for r in rows if r['camBefore'] and violations(r['camBefore'], r['fovBefore']))
    moved = sum(1 for r in rows if r['camBefore'] and math.dist(r['camBefore'], r['cam']) > 5.0)
    deg = sum(1 for r in rows if r['deg'])
    rb = [r['rmsBefore'] for r in rows if r['rmsBefore'] is not None]; ra = [r['rms'] for r in rows]
    q = lambda a: '%.1f / %.1f / %.1f' % (np.percentile(a, 25), np.median(a), np.percentile(a, 75)) if a else '-'
    print('%d shots re-solved: cameras below 0.8 m %d before, %d after; %d broke the prior before; %d moved more than 5 m; '
          '%d took the body cue; %d degenerate; %d poorly conditioned.'
          % (len(rows), low_b, low_a, out_b, moved, sum(1 for r in rows if r['cue'] == 'bodies'), deg, sum(1 for r in rows if r['poor'])))
    print('rms (25%% / median / 75%%) before %s px, after %s px' % (q(rb), q(ra)))


def census(loo=False, max_rms=30.0, quiet=False):
    """over every solved, unskipped, non-degenerate shot of every calib file: per named point, the uses, the mean
    signed residual (clicked - projected; +du = right of where the set says, +dv = below) in px and in metres at the
    point's depth, and the rms.  With loo, the residual is the prediction of a solve WITHOUT that point (5+ left) -
    a solve cannot absorb its own misplaced point then."""
    import glob, numpy as np
    sp = setpoints()['points']; per = {}; used = skipped = 0
    for p in sorted(glob.glob(os.path.join(CALIB, '*.json'))):
        d = _json(p); clip = os.path.basename(p)[:-5]
        for s, rec in d.get('shots', {}).items():
            sol = rec.get('solve'); pts = rec.get('points') or {}
            if rec.get('skipped') or not sol or len(pts) < 5: continue
            if sol.get('degenerate') or (sol.get('rms') or 0) > max_rms: skipped += 1; continue
            used += 1
            names = [n for n in pts if n in sp]
            w, h = sol.get('frameSize') or [1280, 720]
            for n in names:
                if loo:
                    rest = [m for m in names if m != n]
                    if len(rest) < 5: continue
                    s2 = solve_pnp([sp[m]['p'] for m in rest], [pts[m] for m in rest], w, h)
                    if s2 is None or s2.get('degenerate'): continue
                    use = s2
                else: use = sol
                uv, ok = project([sp[n]['p']], use)
                if not ok[0]: continue
                du, dv = pts[n][0] - uv[0][0], pts[n][1] - uv[0][1]
                import numpy as _np
                R = _np.array(use['R']); t = _np.array(use['t']); depth = float((R @ _np.array(sp[n]['p']) + t)[2]); f = use['K'][0][0]
                per.setdefault(n, []).append((du, dv, du * depth / f, dv * depth / f, '%s:%s' % (clip[:4], s)))
    rows = []
    for n, v in per.items():
        a = np.array([x[:4] for x in v])
        rows.append((n, len(v), a[:, 0].mean(), a[:, 1].mean(), float(np.sqrt((a[:, :2] ** 2).sum(axis=1).mean())), a[:, 2].mean(), a[:, 3].mean(),
                     a[:, 0].std(), a[:, 1].std(), [x[4] for x in v]))
    rows.sort(key=lambda r: -abs(r[2]) * r[1] ** 0.5 - abs(r[3]) * r[1] ** 0.5)
    if not quiet:
        print('census%s: %d shots used, %d left out (degenerate or rms > %g); residual = clicked - projected (+du right, +dv down)'
              % (' (leave-one-out)' if loo else '', used, skipped, max_rms))
        print('%-18s %3s %7s %7s %6s %6s %7s %7s  %s' % ('point', 'n', 'du px', 'dv px', 'sd du', 'sd dv', 'du m', 'dv m', 'rms px'))
        for n, k, du, dv, rms, dum, dvm, sdu, sdv, where in rows:
            print('%-18s %3d %7.1f %7.1f %6.1f %6.1f %7.2f %7.2f  %5.1f  %s' % (n, k, du, dv, sdu, sdv, dum, dvm, rms, ' '.join(where[:8]) + (' ...' if len(where) > 8 else '')))
    return rows


def cmd_calib(args, cache_dir, frames):
    """args.shot, args.what ('grid' | 'solve' | 'refine' | 'zoom' | 'list' | 'resolve'), args.points, args.from_file,
    args.frame.  `calib <clip> all resolve` re-solves every shot of the clip; `calib <clip> census` is the census."""
    import cv2
    sp = setpoints()
    if args.what == 'list':
        for n, d in sp['points'].items(): print('%-18s %-22s %s' % (n, d['p'], d['see']))
        return
    if args.shot == 'census': census(); return
    if args.what == 'resolve' or args.shot == 'resolve':
        if args.shot not in ('all', 'resolve'): sys.exit("resolve re-solves a whole clip: calib <clip> all resolve")
        summarise(resolve(frames['clip'])); return
    shot = int(args.shot)
    sh = frames['shots'][shot]
    fi = args.frame if args.frame is not None else sh['first'] + sh['n'] // 2
    frame_path = os.path.join(cache_dir, 'frames', frames['frames'][fi]['file'])
    if args.what == 'grid':
        out = os.path.join(cache_dir, 'grid-s%d.jpg' % shot)
        w, h = draw_grid(frame_path, out)
        print('shot %d frame %d (%dx%d) -> %s' % (shot, fi, w, h, out)); return
    clip = frames['clip']
    if args.what == 'zoom':
        data = load_calib(clip); rec = data['shots'].get(str(shot))
        if not rec: sys.exit('no solve for shot %d yet (solve first)' % shot)
        names = [s.split('=')[0] for s in (args.points or [])] or None
        pred = draw_zooms(frame_path, rec['solve'], cache_dir, shot, names)
        print('%s shot %d: %d zoom crops (zoom-s%d-<name>.jpg) around the solve\'s predictions:' % (clip, shot, len(pred), shot))
        for n, (u, v) in pred.items(): print('   %-18s predicted (%6.1f, %6.1f)%s' % (n, u, v, '  [used]' if n in rec['points'] else ''))
        return
    if args.what == 'refine':
        data = load_calib(clip); rec = data['shots'].get(str(shot))
        if not rec: sys.exit('no solve for shot %d yet (solve first)' % shot)
        sol = refine_edges(frame_path, rec['solve'], rec['points'])
        rec['solve'] = sol; save_calib(clip, data)
        out = os.path.join(cache_dir, 'calib-s%d.jpg' % shot)
        draw_overlay(frame_path, sol, rec['points'], out, label='%s shot %d (refined)' % (clip, shot))
        print('%s shot %d refined: edge score %.3f -> %.3f, fov %.1f, rms %.1f px, camera (%.2f, %.2f, %.2f) -> %s' %
              (clip, shot, sol['edgeScore']['before'], sol['edgeScore']['after'], sol['fovDeg'], sol['rms'], *sol['camera'], out))
        return
    pts = {}
    if args.from_file:
        with open(args.from_file, encoding='utf-8') as f: pts.update(json.load(f))
    for s in args.points or []:
        n, uv = s.split('='); u, v = uv.split(','); pts[n] = [float(u), float(v)]
    bad = [n for n in pts if n not in sp['points']]
    if bad: sys.exit('unknown set point(s): %s  (calib <clip> list)' % bad)
    if len(pts) < 5: sys.exit('need at least 5 points (RULING GA), got %d' % len(pts))
    im = cv2.imread(frame_path); h, w = im.shape[:2]
    names = list(pts.keys())
    sol = solve_pnp([sp['points'][n]['p'] for n in names], [pts[n] for n in names], w, h, bodies=shot_bodies(cache_dir, frames, fi))
    if sol is None: sys.exit('no solve')
    data = load_calib(clip)
    data['shots'][str(shot)] = {'frame': fi, 'points': pts, 'solve': sol, 'moving': None}
    save_calib(clip, data)
    out = os.path.join(cache_dir, 'calib-s%d.jpg' % shot)
    draw_overlay(frame_path, sol, pts, out, label='%s shot %d' % (clip, shot))
    print('%s shot %d: %d points, fov %.1f deg, rms %.1f px, camera at (%.2f, %.2f, %.2f) looking (%.2f, %.2f, %.2f) -> %s' %
          (clip, shot, len(pts), sol['fovDeg'], sol['rms'], *sol['camera'], *sol['look'], out))
    for n, r in zip(names, sol['residuals']): print('   %-18s %5.1f px' % (n, r))
    print('   m/px at the set centre %s, depth cue %s%s, conditioning %s%s' % (sol['mPerPx'], sol['depthCue'],
          (' (shoulders %.2f m from %d bodies)' % (sol['bodyHeightM'], sol['bodies'])) if sol.get('bodyHeightM') is not None else '',
          sol['cond'], ('  DEGENERATE: the points alone want ' + sol['degenerate']) if sol.get('degenerate') else ''))


def main():
    import argparse
    ap = argparse.ArgumentParser(description='stage 3 over many clips: resolve (re-solve stored points through the prior) and census')
    ap.add_argument('cmd', choices=['resolve', 'census'])
    ap.add_argument('clip', nargs='?', default='all', help="a calib/<clip>.json stem, or 'all'")
    ap.add_argument('--no-bodies', action='store_true', help='resolve without the body-height depth cue')
    ap.add_argument('--dry', action='store_true', help='resolve: print the table, write nothing')
    ap.add_argument('--loo', action='store_true', help='census: leave-one-out residuals (slow)')
    a = ap.parse_args()
    if a.cmd == 'census': census(loo=a.loo); return
    import glob
    clips = [os.path.basename(p)[:-5] for p in sorted(glob.glob(os.path.join(CALIB, '*.json')))] if a.clip == 'all' else [a.clip]
    rows = []
    for c in clips: rows += resolve(c, use_bodies=not a.no_bodies, write=not a.dry, quiet=True)
    print_rows(rows); summarise(rows)


if __name__ == '__main__': main()
