# Helpers for writing segment 5 (show-clock based, converted to track/at on output).
import math, json, re

import os
SP = os.path.dirname(os.path.abspath(__file__))
TRACKS = [("2-01", 4258.0, 236.0), ("2-02", 4494.0, 215.0), ("2-03", 4709.0, 286.0),
          ("2-04", 4995.0, 242.0), ("2-05", 5237.0, 318.0)]
START = {t: s for t, s, l in TRACKS}

def T(tr, at):
    return START[tr] + at

def to_track(g):
    for t, s, l in TRACKS:
        if s - 1e-6 <= g < s + l - 1e-6:
            return t, round(g - s, 2)
    t, s, l = TRACKS[-1]
    return t, round(g - s, 2)

WINGS = {'W-DSR': (-7.3, 4.6), 'W-DSL': (7.3, 4.6), 'W-MSR': (-8.5, 0.0), 'W-MSL': (8.0, -0.5),
         'W-USR': (-8.5, -3.0), 'W-USL': (8.5, -3.0), 'D-UC': (1.25, -4.9)}
# the deck-side approach points that keep a body clear of the proscenium posts / the door frame
VIA = {'W-DSR': [(-6.0, 4.65)], 'W-DSL': [(6.0, 4.65)], 'D-UC': [(1.25, -3.6)],
       'W-MSL': [(6.6, -0.15), (4.4, 0.1)], 'W-USL': [(6.5, -3.0)], 'W-USR': [(-5.4, -3.15)], 'W-MSR': []}
GUC = [(0.6, -4.8, 'g'), (0.6, -3.35, 'g')]

W = {}      # actor -> list of dict(g, x, z, lvl, dwell, facing, off, label)

def P(p):
    return (p[0], p[1], p[2] if len(p) > 2 else 'd')

def last(a):
    return W[a][-1]

def add(a, g, x, z, lvl='d', dwell=None, facing=None, off=False, label=None):
    W.setdefault(a, [])
    if W[a] and g <= W[a][-1]['g'] + 0.009:
        raise ValueError("time not increasing for %s at %.2f (%s) after %.2f" % (a, g, to_track(g), W[a][-1]['g']))
    W[a].append(dict(g=g, x=x, z=z, lvl=lvl, dwell=dwell, facing=facing, off=off, label=label))

def face(frm, to):
    dx, dz = to[0] - frm[0], to[1] - frm[1]
    return round(math.degrees(math.atan2(dx, dz)), 1)

def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])

STAIR = 4.6

def legtime(p, q, speed):
    if p[2] != q[2]:
        return STAIR
    return dist(p, q) / speed

def go(a, pts, t_end=None, t_start=None, speed=1.3, facing=None, last_off=False, label=None, hold=True):
    """Walk actor a from where she is through pts (list of (x,z) or (x,z,'g')).
    Give t_end (arrival) or t_start (departure). Intermediates are walk-throughs."""
    cur = last(a)
    p0 = (cur['x'], cur['z'], cur['lvl'])
    pts = [P(p) for p in pts]
    seq = [p0] + pts
    durs = [legtime(seq[i], seq[i + 1], speed) for i in range(len(pts))]
    tot = sum(durs)
    if tot < 0.05 and len(pts) == 1 and not last_off:
        add(a, t_end if t_end is not None else t_start, cur['x'], cur['z'], cur['lvl'], facing=facing)
        return last(a)['g']
    if t_end is None:
        t_end = t_start + tot
    if t_start is None:
        t_start = max(t_end - tot, cur['g'])
    # stretch evenly if the given window is longer than needed
    scale = (t_end - t_start) / tot if tot > 0 else 1
    if hold and t_start > cur['g'] + 0.3:
        add(a, t_start, cur['x'], cur['z'], cur['lvl'], facing=cur['facing'] if not cur['off'] else None, off=cur['off'])
    t = t_start
    for i, p in enumerate(pts):
        t += durs[i] * scale
        lastp = i == len(pts) - 1
        add(a, t, p[0], p[1], p[2], dwell=None if lastp else 0,
            facing=(facing if lastp and not last_off else None), off=(last_off and lastp),
            label=(label if lastp else None))
    return t

def enter(a, via, dest, t_end, speed=1.3, facing=0, label=None, extra=None, t_off=None):
    """Off at an entrance, then on to dest (list of points after the approach)."""
    if via == 'G-UC':
        start = GUC[0]
        approach = [GUC[1]]
    else:
        start = WINGS[via] + ('d',)
        approach = list(VIA[via])
    pts = approach + (extra or []) + list(dest if isinstance(dest, list) else [dest])
    pts = [P(p) for p in pts]
    seq = [P(start)] + pts
    tot = sum(legtime(seq[i], seq[i + 1], speed) for i in range(len(pts)))
    t0 = t_end - tot
    if t_off is not None:
        t0 = min(t0, t_off)
    add(a, t0, start[0], start[1], P(start)[2], off=True, label=label)
    return go(a, pts, t_end=t_end, t_start=t0, speed=speed, facing=facing, hold=False)

def leave(a, via, t_start=None, t_end=None, speed=1.3, extra=None, label=None):
    if via == 'G-UC':
        pts = (extra or []) + [GUC[1], GUC[0]]
    else:
        pts = (extra or []) + list(reversed(VIA[via])) + [WINGS[via]]
    return go(a, pts, t_start=t_start, t_end=t_end, speed=speed, last_off=True, label=label)

def stand(a, g, facing=None, dwell=None):
    """A new stop at the same place (a turn to a new facing, or a hold)."""
    cur = last(a)
    add(a, g, cur['x'], cur['z'], cur['lvl'], facing=facing, dwell=dwell)

def ring(r, hour_deg, cx=0.0, cz=0.95):
    th = math.radians(hour_deg)
    return (round(cx + r * math.sin(th), 3), round(cz - r * math.cos(th), 3))

def revolve(a, r, th0, th1, t_start, t_end, step=30, facing=None, cx=0.0, cz=0.95):
    """Walk round a circle from angle th0 to th1 (degrees, clock-style) with walk-through points."""
    n = max(1, int(math.ceil(abs(th1 - th0) / step)))
    pts = [ring(r, th0 + (th1 - th0) * k / n, cx, cz) for k in range(1, n + 1)]
    return go(a, pts, t_start=t_start, t_end=t_end, facing=facing)

# ---------------------------------------------------------------- floor map
def load_map():
    rows = {}
    for line in open(SP + "/floor-map.txt", encoding="utf-8"):
        m = re.match(r'^([+-])\s?(\d+\.\d+)\s(.{81})', line.rstrip('\n'))
        if m:
            z = float(m.group(2)) * (1 if m.group(1) == '+' else -1)
            rows[round(z, 2)] = m.group(3)
    return rows
FMAP = load_map()

def mapchar(x, z):
    zr = round(round(z / 0.25) * 0.25, 2)
    xi = int(round((x + 10) / 0.25))
    row = FMAP.get(zr)
    if row is None or not (0 <= xi < 81):
        return '?'
    return row[xi]

# ---------------------------------------------------------------- output + checks
def pos_at(a, g):
    """Approximate position (x,z,visible) of actor a at show time g (page rules FH/FJ)."""
    L = W[a]
    if g <= L[0]['g']:
        w = L[0]; return (w['x'], w['z'], not w['off'])
    for i in range(len(L) - 1):
        p, q = L[i], L[i + 1]
        if p['g'] <= g <= q['g']:
            d = dist((p['x'], p['z']), (q['x'], q['z']))
            if p['dwell'] is not None:
                dep = p['g'] + p['dwell']
            else:
                dep = max(p['g'], q['g'] - d / 1.3)
            if p['off'] and q['off']:
                return (q['x'], q['z'], False)
            if g <= dep:
                return (p['x'], p['z'], not p['off'] or g > p['g'] + 1e-9 and False)
            f = (g - dep) / max(1e-6, q['g'] - dep)
            return (p['x'] + f * (q['x'] - p['x']), p['z'] + f * (q['z'] - p['z']), True)
    w = L[-1]; return (w['x'], w['z'], not w['off'])

def checks(verbose=True):
    msgs = []
    for a, L in W.items():
        for i in range(len(L) - 1):
            p, q = L[i], L[i + 1]
            d = dist((p['x'], p['z']), (q['x'], q['z']))
            dt = q['g'] - p['g'] - (p['dwell'] or 0)
            if dt <= 0:
                msgs.append("%s dwell overrun at %s" % (a, to_track(p['g'])))
                continue
            v = d / dt
            if v > 3.5:
                msgs.append("%s FAST %.2f m/s %s -> %s" % (a, v, to_track(p['g']), to_track(q['g'])))
            if p['lvl'] != q['lvl'] and not (p['off'] and q['off']):
                if d / (q['g'] - p['g']) > 0.7:
                    msgs.append("%s STAIR fast %s" % (a, to_track(p['g'])))
            # deck leg through obstacles
            if p['lvl'] == 'd' and q['lvl'] == 'd' and not (p['off'] and q['off']):
                n = max(2, int(d / 0.1))
                hits = set()
                for k in range(n + 1):
                    x = p['x'] + (q['x'] - p['x']) * k / n
                    z = p['z'] + (q['z'] - p['z']) * k / n
                    c = mapchar(x, z)
                    if c not in '.G_?':
                        hits.add((round(x, 1), round(z, 1), c))
                if hits:
                    msgs.append("%s leg %s->%s crosses %s" % (a, to_track(p['g']), to_track(q['g']), sorted(hits)[:3]))
        for w in L:
            if w['lvl'] == 'd' and not w['off']:
                c = mapchar(w['x'], w['z'])
                if c not in '.G':
                    msgs.append("%s stands on '%s' at %s (%.2f,%.2f)" % (a, c, to_track(w['g']), w['x'], w['z']))
    # proximity
    ids = list(W)
    gmin = min(L[0]['g'] for L in W.values()); gmax = max(L[-1]['g'] for L in W.values())
    near = {}
    g = gmin
    while g <= gmax:
        ps = {a: pos_at(a, g) for a in ids}
        for i in range(len(ids)):
            for j in range(i + 1, len(ids)):
                A, B = ps[ids[i]], ps[ids[j]]
                if A[2] and B[2] and abs(A[0]) < 6.6 and abs(B[0]) < 6.6:
                    if math.hypot(A[0] - B[0], A[1] - B[1]) < 0.45:
                        key = (ids[i], ids[j])
                        near.setdefault(key, []).append(g)
        g += 0.25
    for (a, b), gs in near.items():
        # group into episodes
        eps = []
        for x in gs:
            if eps and x - eps[-1][1] <= 0.5:
                eps[-1][1] = x
            else:
                eps.append([x, x])
        for s, e in eps:
            msgs.append("NEAR %s/%s %s..%s" % (a, b, to_track(s), to_track(e)[1]))
    if verbose:
        for m in msgs:
            print(m)
    return msgs

def dump(path, notes):
    out = {}
    for a, L in W.items():
        arr = []
        lastg = None
        for w in L:
            tr, at = to_track(w['g'])
            d = {"track": tr, "at": at, "x": round(w['x'], 3), "z": round(w['z'], 3)}
            if w['lvl'] == 'g':
                d['y'] = 'gallery'
            if w['dwell'] is not None:
                d['dwell'] = round(w['dwell'], 2)
            if w['facing'] is not None and not w['off']:
                d['facing'] = round(((w['facing'] + 180) % 360) - 180, 1)
            if w['off']:
                d['off'] = True
            if w['label']:
                d['label'] = w['label']
            arr.append(d)
        out[a] = arr
    doc = {"segment": 5, "tracks": [t for t, s, l in TRACKS], "waypoints": out, "notes": notes}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1)
    return doc

# ---------------------------------------------------------------- formations
def cur(a):
    return (last(a)['x'], last(a)['z'])

def assign(bodies, targets):
    """Greedy nearest assignment of bodies (current positions) to target points."""
    pairs = sorted((dist(cur(a), p), a, i) for a in bodies for i, p in enumerate(targets))
    used_a, used_i, m = set(), set(), {}
    for d, a, i in pairs:
        if a in used_a or i in used_i:
            continue
        m[a] = targets[i]; used_a.add(a); used_i.add(i)
    return m

def form(bodies, targets, t_end=None, t_start=None, facing=lambda p: 0, stagger=0.1, speed=1.3):
    m = assign(bodies, targets)
    for k, a in enumerate(bodies):
        p = m[a]
        if t_end is not None:
            go(a, [p], t_end=t_end + stagger * k, facing=facing(p), speed=speed)
        else:
            go(a, [p], t_start=t_start + stagger * k, facing=facing(p), speed=speed)
    return m

def theta_of(p, cx=0.0, cz=0.95):
    return math.degrees(math.atan2(p[0] - cx, cz - p[1]))

def revolve_by(a, r, dth, t0, t1, step=30, facing=None, cx=0.0, cz=0.95):
    th0 = theta_of(cur(a), cx, cz)
    return revolve(a, r, th0, th0 + dth, t0, t1, step=step, facing=facing, cx=cx, cz=cz)
