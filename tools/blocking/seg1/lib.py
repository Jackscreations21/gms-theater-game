# Segment-writing helpers: a show-clock timeline per actor, entrances/exits,
# formations, revolves, and a simulator/checker that mimics the page's motion rules.
import math, json
from collections import defaultdict

TRACKS = [('1-01', 236.0), ('1-02', 156.0), ('1-03', 333.0), ('1-04', 91.0), ('1-05', 186.0), ('1-06', 112.0)]
T0 = {}
_s = 0.0
for _k, _L in TRACKS:
    T0[_k] = _s; _s += _L
SEG_END = _s
LEAD_IN = -10.0   # REVIEW2: 1-01 may run from -10 (the lead-in; the music starts at 0)
LEN = dict(TRACKS)

def S(tr, at):
    return round(T0[tr] + at, 3)

def to_track(t):
    if t < 0:   # REVIEW2: the 10 s lead-in before 1-01 (RULING FQ): 1-01 at -10 ... 0
        return TRACKS[0][0], round(t, 2)
    for i, (k, L) in enumerate(TRACKS):
        if T0[k] - 1e-9 <= t < T0[k] + L - 1e-9:
            return k, round(t - T0[k], 2)
    k, L = TRACKS[-1]
    return k, round(t - T0[k], 2)

C = (0.0, 0.95)
WINGS = {
    'W_DSR': (-7.3, 4.6), 'W_DSL': (7.3, 4.6), 'W_MSR': (-8.5, 0.0), 'W_MSL': (8.0, -0.5),
    'W_USR': (-8.5, -3.0), 'W_USL': (8.5, -3.0), 'D_UC': (1.25, -4.9),
}
G_UC = (0.6, -4.8)
GAL = 'gallery'

W = defaultdict(list)
DEFAULT = {'hamilton': 'Hamilton', 'burr': 'Burr', 'eliza': 'Eliza', 'angelica': 'Angelica', 'peggy': 'Peggy',
           'washington': 'Washington', 'lafayette': 'Lafayette', 'mulligan': 'Mulligan', 'laurens': 'Laurens',
           'king': 'King George'}
for i in range(1, 11):
    DEFAULT['ens%d' % i] = 'Ensemble %d' % i
ENS = ['ens%d' % i for i in range(1, 11)]

def ring(r, theta_deg, c=C):
    th = math.radians(theta_deg)
    return (round(c[0] + r * math.sin(th), 3), round(c[1] - r * math.cos(th), 3))

def face_to(frm, to, clamp=None):
    dx, dz = to[0] - frm[0], to[1] - frm[1]
    if abs(dx) < 1e-9 and abs(dz) < 1e-9:
        return 0.0
    f = math.degrees(math.atan2(dx, dz))
    if clamp is not None:
        f = max(-clamp, min(clamp, f))
    return round(f, 1)

def last(a):
    return W[a][-1]

def pos(a):
    w = W[a][-1]; return (w['x'], w['z'])

def put(a, t, x, z=None, f=None, d=None, y=None, label=None, off=False):
    if z is None:  # a point tuple
        x, z = x
    t = round(t, 3)
    if W[a]:
        assert t > W[a][-1]['t'] + 1e-6, (a, t, W[a][-1]['t'])
    w = {'t': t, 'x': round(x, 3), 'z': round(z, 3)}
    if y is not None: w['y'] = y
    if f is not None: w['f'] = round(f, 1)
    if d is not None: w['d'] = round(d, 2)
    if off: w['off'] = True
    if label: w['label'] = label
    W[a].append(w)
    return w

def start(a, wing, label=None, t=0.0, y=None):
    p = WINGS[wing] if isinstance(wing, str) else wing
    put(a, t, p, off=True, label=label or DEFAULT[a], y=y)

def move(a, tl, ta, p, f=None, d=None, y=None, label=None):
    """Leave at tl (None: just in time at 1.3 m/s), arrive at p at ta."""
    prev = W[a][-1]
    if tl is not None and prev.get('d') is None:
        dw = tl - prev['t']
        assert dw >= -1e-6, (a, 'leave before arrival', tl, prev['t'])
        prev['d'] = round(max(0.0, dw), 2)
    return put(a, ta, p, f=f, d=d, y=y, label=label)

def via(a, ta, p, y=None):
    return put(a, ta, p, d=0, y=y)

def dist(p, q):
    return math.hypot(p[0] - q[0], p[1] - q[1])

def nearest_wing(p, allowed=None):
    best = None
    for k, q in WINGS.items():
        if allowed and k not in allowed: continue
        dd = dist(p, q)
        if best is None or dd < best[0]: best = (dd, k)
    return best[1]

def exit_(a, tl, wing=None, speed=1.3, label=None):
    p = pos(a)
    wing = wing or nearest_wing(p)
    q = WINGS[wing]
    ta = tl + dist(p, q) / speed
    move(a, tl, ta, q, label=label)
    W[a][-1]['off'] = True
    return ta

def enter(a, tl, ta, p, f, wing=None, label=None):
    """Appear from a wing: an off waypoint at the wing at tl, onstage at p at ta (walks at the speed that takes)."""
    wing = wing or nearest_wing(p)
    q = WINGS[wing]
    put(a, tl, q, off=True)
    W[a][-1]['d'] = 0
    put(a, ta, p, f=f, label=label)

def _hungarian(cost):
    n, m = len(cost), len(cost[0])
    INF = float('inf')
    u = [0.0] * (n + 1); v = [0.0] * (m + 1); p = [0] * (m + 1); way = [0] * (m + 1)
    for i in range(1, n + 1):
        p[0] = i; j0 = 0
        minv = [INF] * (m + 1); used = [False] * (m + 1)
        while True:
            used[j0] = True; i0 = p[j0]; delta = INF; j1 = 0
            for j in range(1, m + 1):
                if not used[j]:
                    cur = cost[i0 - 1][j - 1] - u[i0] - v[j]
                    if cur < minv[j]: minv[j] = cur; way[j] = j0
                    if minv[j] < delta: delta = minv[j]; j1 = j
            for j in range(m + 1):
                if used[j]: u[p[j]] += delta; v[j] -= delta
                else: minv[j] -= delta
            j0 = j1
            if p[j0] == 0: break
        while True:
            j1 = way[j0]; p[j0] = p[j1]; j0 = j1
            if j0 == 0: break
    res = {}
    for j in range(1, m + 1):
        if p[j]: res[p[j] - 1] = j - 1
    return res

def assign(actors, slots):
    """REVIEW: minimum-total-distance assignment (no two straight paths cross), was greedy nearest."""
    actors = list(actors)
    cost = [[dist(pos(a), s[:2]) for s in slots] for a in actors]
    r = _hungarian(cost)
    return {a: slots[r[i]] for i, a in enumerate(actors)}

def assign_greedy(actors, slots):
    """Greedy nearest assignment of actors (by current position) to slots."""
    pairs = []
    for a in actors:
        for j, s in enumerate(slots):
            pairs.append((dist(pos(a), s[:2]), a, j))
    pairs.sort()
    used_a, used_s, out = set(), set(), {}
    for dd, a, j in pairs:
        if a in used_a or j in used_s: continue
        used_a.add(a); used_s.add(j); out[a] = slots[j]
    return out

def form(actors, slots, tl, ta, face=0, stagger=0.0, fixed=False, y=None):
    """Move actors into slots. face: number, ('at', (x,z)) toward a point, ('at', p, clamp), or 'slot' (third value)."""
    m = dict(zip(actors, slots)) if fixed else assign(actors, slots)
    for k, a in enumerate(actors):
        s = m[a]
        if face == 'slot':
            f = s[2]
        elif isinstance(face, tuple):
            f = face_to(s[:2], face[1], face[2] if len(face) > 2 else None)
        else:
            f = face
        move(a, tl + k * stagger if tl is not None else None, ta + k * stagger, s[:2], f=f, y=y)
    return m

def turn(actors, t, f, dt=0.6):
    """Change facing in place: a zero-length leg."""
    for a in actors:
        p = pos(a)
        ff = f(a, p) if callable(f) else f
        move(a, t, t + dt, p, f=ff)

def polar(p):
    dx, dz = p[0] - C[0], p[1] - C[1]
    r = math.hypot(dx, dz)
    th = math.degrees(math.atan2(dx, -dz))
    return r, th

def revolve(actors, t0, t1, dtheta, step=40, face_in=False, face=None, r=None):
    """Walk each body round the centre by dtheta degrees between t0 and t1 (they must be standing at t0)."""
    n = max(1, int(math.ceil(abs(dtheta) / step)))
    for a in actors:
        r0, th0 = polar(pos(a))
        rr = r if r is not None else r0
        prev = W[a][-1]
        if prev.get('d') is None:
            prev['d'] = round(max(0.0, t0 - prev['t']), 2)
        for k in range(1, n + 1):
            tt = t0 + (t1 - t0) * k / n
            p = ring(rr, th0 + dtheta * k / n)
            if k < n:
                via(a, tt, p)
            else:
                if face_in:
                    ff = face_to(p, C, 135)
                elif face is not None:
                    ff = face
                else:
                    ff = 0
                put(a, tt, p, f=ff)

# ---------------------------------------------------------------- simulation & checks
def level(w):
    y = w.get('y')
    if y == GAL: return 2.743
    if isinstance(y, (int, float)): return y
    return 0.045

def sim(a, t):
    P = W[a]
    if t <= P[0]['t']:
        w = P[0]; return (w['x'], w['z'], level(w), not w.get('off'), True)
    for wa, wb in zip(P, P[1:]):
        if wa['t'] <= t < wb['t']:
            dd = dist((wa['x'], wa['z']), (wb['x'], wb['z']))
            if wa.get('d') is not None:
                dep = wa['t'] + wa['d']
            else:
                dep = max(wa['t'], wb['t'] - dd / 1.3)
            if t < dep:
                return (wa['x'], wa['z'], level(wa), not wa.get('off'), True)
            u = (t - dep) / max(1e-6, wb['t'] - dep)
            x = wa['x'] + (wb['x'] - wa['x']) * u
            z = wa['z'] + (wb['z'] - wa['z']) * u
            y = level(wa) + (level(wb) - level(wa)) * u
            vis = not (wa.get('off') and wb.get('off'))
            if wa.get('off') or wb.get('off'):
                vis = vis and (-5.6 < x < 5.6) and (z < 5.2) and (z > -3.0 or y > 1)
            return (x, z, y, vis, False)
    w = P[-1]; return (w['x'], w['z'], level(w), not w.get('off'), True)

def check(min_d=0.55, dtt=0.2):
    issues = []
    # per-actor legs
    for a, P in W.items():
        for wa, wb in zip(P, P[1:]):
            dt = wb['t'] - wa['t']
            dd = dist((wa['x'], wa['z']), (wb['x'], wb['z']))
            leave = wa['t'] + (wa['d'] if wa.get('d') is not None else 0)
            walk = wb['t'] - leave
            if wa.get('off') and wb.get('off'): continue
            if walk <= 0 and dd > 0.01:
                issues.append(f'{a} dwell past next at {to_track(wa["t"])}')
            elif dd / max(walk, 1e-6) > 2.6:
                issues.append(f'{a} fast {dd/max(walk,1e-6):.2f} m/s {to_track(wa["t"])} -> {to_track(wb["t"])}')
            if wa.get('d') is not None and wa['d'] > dt + 1e-6:
                issues.append(f'{a} dwell {wa["d"]} > interval {dt:.2f} at {to_track(wa["t"])}')
        for w in P:
            stop = not w.get('off') and w.get('d') != 0
            if stop and 'f' not in w:
                issues.append(f'{a} stop without facing at {to_track(w["t"])}')
    # proximity
    actors = list(W)
    t = LEAD_IN
    hits = defaultdict(list)
    while t < SEG_END:
        st = {a: sim(a, t) for a in actors}
        for i in range(len(actors)):
            for j in range(i + 1, len(actors)):
                A, B = st[actors[i]], st[actors[j]]
                if not (A[3] and B[3]): continue
                if abs(A[2] - B[2]) > 1.0: continue
                dd = math.hypot(A[0] - B[0], A[1] - B[1])
                lim = min_d if (A[4] and B[4]) else 0.42
                if dd < lim:
                    hits[(actors[i], actors[j])].append((t, dd))
        t += dtt
    for k, v in hits.items():
        # group into runs
        run = [v[0]]
        for e in v[1:]:
            if e[0] - run[-1][0] > dtt * 1.5:
                issues.append(f'close {k[0]}-{k[1]} {to_track(run[0][0])}..{to_track(run[-1][0])[1]} min {min(r[1] for r in run):.2f}')
                run = [e]
            else:
                run.append(e)
        issues.append(f'close {k[0]}-{k[1]} {to_track(run[0][0])}..{to_track(run[-1][0])[1]} min {min(r[1] for r in run):.2f}')
    return issues

def export(path, notes):
    wps = {}
    for a, P in W.items():
        out = []
        for w in P:
            tr, at = to_track(w['t'])
            o = {'track': tr, 'at': at, 'x': w['x'], 'z': w['z']}
            if 'y' in w: o['y'] = w['y']
            if w.get('d') is not None: o['dwell'] = w['d']
            if 'f' in w: o['facing'] = w['f']
            if w.get('off'): o['off'] = True
            if w.get('label'): o['label'] = w['label']
            out.append(o)
        wps[a] = out
    doc = {'segment': 1, 'tracks': [k for k, _ in TRACKS], 'waypoints': wps, 'notes': notes}
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write('{\n "segment": 1,\n "tracks": ' + json.dumps(doc['tracks']) + ',\n "waypoints": {\n')
        keys = list(wps)
        for n, a in enumerate(keys):
            f.write('  ' + json.dumps(a) + ': [')
            f.write(','.join('\n   ' + json.dumps(o) for o in wps[a]))
            f.write('\n  ]' + (',' if n + 1 < len(keys) else '') + '\n')
        f.write(' },\n "notes": ' + json.dumps(notes, ensure_ascii=False) + '\n}\n')
    return sum(len(v) for v in wps.values())
