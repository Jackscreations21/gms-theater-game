"""Stage 3 - the camera of a shot (RULING GA), solved from named set points and their pixels.

    python tools/vision/run.py calib <clip> <shot> grid                 # cache/<clip>/grid-s<shot>.jpg: the frame with a labelled 100 px grid
    python tools/vision/run.py calib <clip> <shot> solve name=u,v ...   # solve; write calib/<clip>.json and cache/<clip>/calib-s<shot>.jpg
    python tools/vision/run.py calib <clip> <shot> solve --from FILE    # the points from a JSON {name: [u, v]}
    python tools/vision/run.py calib <clip> list                        # the named points and how to find them

The lens is unknown: the focal length is grid-searched (horizontal field of view 12-100 deg) and for each a PnP
pose is solved; the one with the least reprojection error wins, then both are refined together.  Pixels are in
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


def solve_pnp(obj, img, w, h, fov_lo=12, fov_hi=100):
    """obj: Nx3 set points, img: Nx2 pixels, (w, h) the frame.  -> dict with K, R, t, rms, residuals, fovDeg."""
    import cv2, numpy as np
    obj = np.asarray(obj, dtype=np.float64).reshape(-1, 1, 3); img = np.asarray(img, dtype=np.float64).reshape(-1, 1, 2)
    cx, cy = w / 2.0, h / 2.0
    best = None
    for fov in np.arange(fov_lo, fov_hi + 0.01, 1.0):
        f = (w / 2.0) / math.tan(math.radians(fov) / 2.0)
        K = np.array([[f, 0, cx], [0, f, cy], [0, 0, 1]], dtype=np.float64)
        ok, rvec, tvec = cv2.solvePnP(obj, img, K, None, flags=cv2.SOLVEPNP_SQPNP if hasattr(cv2, 'SOLVEPNP_SQPNP') else cv2.SOLVEPNP_ITERATIVE)
        if not ok: continue
        proj, _ = cv2.projectPoints(obj, rvec, tvec, K, None)
        res = np.linalg.norm(proj.reshape(-1, 2) - img.reshape(-1, 2), axis=1)
        rms = float(np.sqrt((res ** 2).mean()))
        if best is None or rms < best[0]: best = (rms, fov, K, rvec, tvec)
    if best is None: return None
    rms, fov, K, rvec, tvec = best
    # refine the pose at the best focal, then the focal by a finer search around it
    for fov2 in np.arange(fov - 1, fov + 1.001, 0.1):
        f = (w / 2.0) / math.tan(math.radians(fov2) / 2.0)
        K2 = np.array([[f, 0, cx], [0, f, cy], [0, 0, 1]], dtype=np.float64)
        ok, rv, tv = cv2.solvePnP(obj, img, K2, None, rvec=rvec.copy(), tvec=tvec.copy(), useExtrinsicGuess=True, flags=cv2.SOLVEPNP_ITERATIVE)
        if not ok: continue
        proj, _ = cv2.projectPoints(obj, rv, tv, K2, None)
        res = np.linalg.norm(proj.reshape(-1, 2) - img.reshape(-1, 2), axis=1)
        r2 = float(np.sqrt((res ** 2).mean()))
        if r2 < rms: rms, fov, K, rvec, tvec = r2, float(fov2), K2, rv, tv
    R, _ = cv2.Rodrigues(rvec)
    cam = (-R.T @ tvec).reshape(3)                     # the camera's position in set metres
    look = (R.T @ np.array([0, 0, 1.0])).reshape(3)    # where it looks (+z of the camera, in the set frame)
    proj, _ = cv2.projectPoints(obj, rvec, tvec, K, None)
    res = np.linalg.norm(proj.reshape(-1, 2) - img.reshape(-1, 2), axis=1)
    return {'K': K.tolist(), 'R': R.tolist(), 't': tvec.reshape(3).tolist(), 'rvec': rvec.reshape(3).tolist(),
            'camera': [round(float(v), 3) for v in cam], 'look': [round(float(v), 3) for v in look],
            'fovDeg': round(float(fov), 1), 'rms': round(float(rms), 2), 'residuals': [round(float(r), 1) for r in res],
            'frameSize': [w, h]}


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


def cmd_calib(args, cache_dir, frames):
    """args.shot, args.what ('grid' | 'solve' | 'list'), args.points, args.from_file, args.frame"""
    import cv2
    sp = setpoints()
    if args.what == 'list':
        for n, d in sp['points'].items(): print('%-18s %-22s %s' % (n, d['p'], d['see']))
        return
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
    sol = solve_pnp([sp['points'][n]['p'] for n in names], [pts[n] for n in names], w, h)
    if sol is None: sys.exit('no solve')
    data = load_calib(clip)
    data['shots'][str(shot)] = {'frame': fi, 'points': pts, 'solve': sol, 'moving': None}
    save_calib(clip, data)
    out = os.path.join(cache_dir, 'calib-s%d.jpg' % shot)
    draw_overlay(frame_path, sol, pts, out, label='%s shot %d' % (clip, shot))
    print('%s shot %d: %d points, fov %.1f deg, rms %.1f px, camera at (%.2f, %.2f, %.2f) looking (%.2f, %.2f, %.2f) -> %s' %
          (clip, shot, len(pts), sol['fovDeg'], sol['rms'], *sol['camera'], *sol['look'], out))
    for n, r in zip(names, sol['residuals']): print('   %-18s %5.1f px' % (n, r))
