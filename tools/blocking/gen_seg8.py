# Generates segments/seg8.json (Hamilton 2-17 .. 2-23 blocking). Run: python -I gen_seg8.py
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'segments', 'seg8.json')
os.makedirs(os.path.join(HERE, 'segments'), exist_ok=True)

LEN = {'2-17': 111.0, '2-18': 270.0, '2-19': 237.0, '2-20': 150.0, '2-21': 47.0, '2-22': 302.0, '2-23': 217.0}
ORDER = ['2-17', '2-18', '2-19', '2-20', '2-21', '2-22', '2-23']
OFS = {}
_s = 0.0
for _t in ORDER:
    OFS[_t] = _s; _s += LEN[_t]

def T(tr, at): return OFS[tr] + at
def TR(abs_t):
    for tr in reversed(ORDER):
        if abs_t >= OFS[tr] - 1e-9:
            return tr, abs_t - OFS[tr]
    raise ValueError(abs_t)

A = {}          # actor -> list of waypoints (with '_T')

def wp(a, tr, at, x, z, y=None, dwell=None, facing=None, off=False, label=None):
    assert 0 <= at <= LEN[tr], (a, tr, at)
    w = {'track': tr, 'at': round(at, 2), 'x': round(x, 3), 'z': round(z, 3)}
    if y is not None: w['y'] = y
    if dwell is not None: w['dwell'] = dwell
    if facing is not None: w['facing'] = round(facing, 1)
    if off: w['off'] = True
    if label: w['label'] = label
    w['_T'] = T(tr, w['at'])
    L = A.setdefault(a, [])
    if L: assert w['_T'] > L[-1]['_T'] + 1e-6, (a, tr, at, L[-1]['track'], L[-1]['at'])
    L.append(w)
    return w

def wpa(a, abs_t, x, z, **kw):
    tr, at = TR(abs_t)
    return wp(a, tr, at, x, z, **kw)

def last(a): return A[a][-1]

def face(p, q):
    return math.degrees(math.atan2(q[0] - p[0], q[1] - p[1]))

C = (0.0, 0.95)
def clock(r, deg, c=C):
    t = math.radians(deg)
    return (c[0] + r * math.sin(t), c[1] - r * math.cos(t))

# entrances: (off point, y, walk-throughs from the off point towards the stage)
ENT = {
    'W-DSR': ((-7.3, 4.6), None, [(-5.8, 4.75)]),
    'W-DSL': ((7.3, 4.6), None, [(5.8, 4.75)]),
    'W-USR': ((-8.5, -3.0), None, [(-3.3, -2.95)]),
    'W-USL': ((8.5, -3.0), None, [(4.75, -2.95), (4.55, -1.1)]),
    'W-MSL': ((8.0, -0.5), None, [(6.2, -0.5), (4.6, 0.45)]),
    'D-UC':  ((1.25, -4.9), None, [(1.15, -3.6)]),
    'G-UC':  ((0.6, -4.8), 'gallery', [(0.6, -3.35)]),
}

def chain_len(pts):
    return sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:]))

USE = {}
def clash(ent, t_off, t_door, gap=1.6):
    """two bodies on one entrance route: they must pass the off point AND the door gap s apart, in the same order."""
    for u_off, u_door in USE.get(ent, []):
        if abs(t_off - u_off) < gap or abs(t_door - u_door) < gap or (t_off - u_off) * (t_door - u_door) <= 0:
            return True
    return False
def enter(a, ent, target, t_arr, facing, speed=1.3, label=None, ty=None, dwell=None, via=None):
    """off waypoint at the entrance, walk-throughs, arrival at target at t_arr (abs time)."""
    (ox, oz), oy, wts = ENT[ent]
    pts = [(ox, oz)] + list(wts) + list(via or []) + [target]
    total = chain_len(pts)
    t0 = max(0.0, t_arr - total / speed)
    floor_t = (A[a][-1]['_T'] + 0.2) if A.get(a) else 0.0
    dd = chain_len(pts[:len(wts) + 1])
    door = lambda t0: t0 + dd * (t_arr - t0) / total
    t_try = t0
    while clash(ent, t_try, door(t_try)) and t_try - 0.25 >= floor_t and (t_arr - t_try) < total / 0.6:
        t_try -= 0.25
    if not clash(ent, t_try, door(t_try)):
        t0 = t_try
    USE.setdefault(ent, []).append((t0, door(t0)))
    speed = total / (t_arr - t0)
    wpa(a, t0, ox, oz, y=oy, off=True, dwell=0, label=label)
    acc = 0.0
    for p, q in zip(pts, pts[1:-1]):
        pass
    for k in range(1, len(pts) - 1):
        acc += math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1])
        wpa(a, t0 + acc / speed, pts[k][0], pts[k][1], y=oy if (ent == 'G-UC' and k <= len(wts)) else None, dwell=0)
    return wpa(a, t_arr, target[0], target[1], y=ty, facing=facing, dwell=dwell)

def leave(a, ent, t_dep, speed=1.3, via=None, label=None):
    """from the actor's current position: walk-throughs, the off waypoint. Returns the off time."""
    p0 = (last(a)['x'], last(a)['z'])
    (ox, oz), oy, wts = ENT[ent]
    pts = [p0] + list(via or []) + list(reversed(wts)) + [(ox, oz)]
    total = chain_len(pts)
    dd = chain_len(pts[:len(via or []) + 2])
    n_try = 0
    while clash(ent, t_dep + total / speed, t_dep + dd / speed) and n_try < 40:
        t_dep += 0.25; n_try += 1
    USE.setdefault(ent, []).append((t_dep + total / speed, t_dep + dd / speed))
    acc = 0.0
    nvia = len(via or [])
    for k in range(1, len(pts)):
        acc += math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1])
        t = t_dep + acc / speed
        if k < len(pts) - 1:
            yk = oy if (ent == 'G-UC' and k > nvia) else None
            if ent == 'G-UC' and k <= nvia: yk = 'gallery'
            wpa(a, t, pts[k][0], pts[k][1], y=yk, dwell=0)
        else:
            wpa(a, t, ox, oz, y=oy, off=True, label=label)
    return t_dep + acc / speed

def circle(a, r, a0, a1, t0, t1, step=40.0, c=C, end_facing=None, end_dwell=None):
    """walk the circle from angle a0 (where she already stands, at t0) to a1, arriving t1."""
    n = max(1, int(math.ceil(abs(a1 - a0) / step - 1e-9)))
    if A[a][-1]['_T'] < t0 - 0.05:
        w = A[a][-1]
        wpa(a, t0, w['x'], w['z'], y=w.get('y'), facing=w.get('facing'), dwell=0)
    else:
        A[a][-1]['dwell'] = 0
    for k in range(1, n + 1):
        f = k / n
        ang = a0 + (a1 - a0) * f
        x, z = clock(r, ang, c)
        t = t0 + (t1 - t0) * f
        if k < n:
            wpa(a, t, x, z, dwell=0)
        else:
            if end_facing is None:
                wpa(a, t, x, z, dwell=0 if end_dwell is None else end_dwell)
            else:
                wpa(a, t, x, z, facing=end_facing, dwell=end_dwell)

def walk(a, abs_t, p, facing=None, dwell=None, y=None):
    return wpa(a, abs_t, p[0], p[1], facing=facing, dwell=dwell, y=y)

def hold(a, abs_t, facing, dwell=None):
    """a facing change on the spot (a new stop at the same place)."""
    w = last(a)
    return wpa(a, abs_t, w['x'], w['z'], y=w.get('y'), facing=facing, dwell=dwell)

ENS = ['ens%d' % i for i in range(1, 11)]

import itertools
def best_assign(srcs, dsts, center=None):
    """match sources to destinations: brute force for small sets, else by angle round `center`."""
    n = len(srcs); assert n == len(dsts)
    if n <= 7:
        best = None
        for perm in itertools.permutations(range(n)):
            c = sum(math.hypot(srcs[i][0] - dsts[j][0], srcs[i][1] - dsts[j][1]) for i, j in enumerate(perm))
            if best is None or c < best[0]: best = (c, perm)
        return [dsts[j] for j in best[1]]
    ang = lambda p: math.atan2(p[0] - center[0], -(p[1] - center[1]))
    si = sorted(range(n), key=lambda i: ang(srcs[i])); dj = sorted(range(n), key=lambda j: ang(dsts[j]))
    out = [None] * n
    for i, j in zip(si, dj): out[i] = dsts[j]
    return out
def pos(a): return (last(a)['x'], last(a)['z'])
def hungarian(srcs, dsts):
    n = len(srcs); INF = float('inf')
    cost = [[(p[0] - d[0]) ** 2 + (p[1] - d[1]) ** 2 for d in dsts] for p in srcs]
    u = [0.0] * (n + 1); v = [0.0] * (n + 1); pp = [0] * (n + 1); way = [0] * (n + 1)
    for i in range(1, n + 1):
        pp[0] = i; j0 = 0; minv = [INF] * (n + 1); used = [False] * (n + 1)
        while True:
            used[j0] = True; i0 = pp[j0]; delta = INF; j1 = 0
            for j in range(1, n + 1):
                if not used[j]:
                    cur = cost[i0 - 1][j - 1] - u[i0] - v[j]
                    if cur < minv[j]: minv[j] = cur; way[j] = j0
                    if minv[j] < delta: delta = minv[j]; j1 = j
            for j in range(n + 1):
                if used[j]: u[pp[j]] += delta; v[j] -= delta
                else: minv[j] -= delta
            j0 = j1
            if pp[j0] == 0: break
        while True:
            j1 = way[j0]; pp[j0] = pp[j1]; j0 = j1
            if j0 == 0: break
    out = [None] * n
    for j in range(1, n + 1): out[pp[j] - 1] = dsts[j - 1]
    return out


def ang_of(p, c=C):
    return math.degrees(math.atan2(p[0] - c[0], -(p[1] - c[1]))) % 360
def rad_of(p, c=C):
    return math.hypot(p[0] - c[0], p[1] - c[1])
def revolve(a, d_ang, t0, t1, step=25.0, end_facing=None):
    """the turntable carries her round C by d_ang degrees (+ clockwise seen from above, i.e. 12 -> 3)."""
    p = pos(a); r = rad_of(p); a0 = ang_of(p)
    circle(a, r, a0, a0 + d_ang, t0, t1, step=step, end_facing=end_facing)

# =====================================================================================
# 2-17 STAY ALIVE (REPRISE)   0.36 shot / 2.86 the doctor and the table / 8.66 Lose Wedge /
# 32.46 Philip to his father / 59.64 Eliza enters / 75.19 mother and son / 94.82 counting /
# 106.78 Philip dies / 109.6 blackout (scream)
# REVIEW (seg 8 reviewer): fan accounts of the Broadway staging (ironinkpen.tumblr.com, Act II notes) put Philip on a
# table on the turning platform at the centre, Hamilton at his side, Eliza entering from centre (upstage), and only
# then the table moving to the front of the stage where the platform stops (the film editor's front-facing three-shot).
# =====================================================================================
# SPOTLIGHT (seg 8 spotlight agent): Binkley's own 1104 chain puts the family DOWNSTAGE from the shot on: his shot
# pool for Philip (ch8, preset 1023 "Pools") lands at (-0.68, 4.13); the auto-follow ch7 ("AF- start move around")
# ends at (-0.83, 3.87); "DS to CTO" warms the DS pair ch7/ch9 (+-0.8, 3.95); "add Ring" brings the table wash ch98
# up on (0, 4.13). Nothing at all lights C in 1104.3-1113, so the table is at the front from the start (the editor's
# front-of-stage three-shot), not carried there at 80 s.
TABLE_F = (-0.3, 3.9)       # the table at the front, between the DS pools ch7/ch9
H_T = (-1.15, 3.55); E_T = (0.6, 3.6); DOC_T = (-0.35, 3.0)
E_SL = (2.0, 2.65)          # Eliza's special SL (ch14, 1112)

# Philip: handed over from seg 7 downstage of centre, his back to the house (coordinator's re-ruled mark);
# shot, he staggers downstage into his pool and onto the table the bearers bring under him
wp('laurens', '2-17', 0.0, -0.4, 2.4, facing=180, dwell=0.5, label='Philip')
walk('laurens', T('2-17', 2.2), (-0.45, 3.6), facing=0)
walk('laurens', T('2-17', 5.0), TABLE_F, facing=0)
hold('laurens', T('2-17', 32.46), -35)       # to his father
hold('laurens', T('2-17', 75.19), 20)        # to his mother
hold('laurens', T('2-17', 106.78), 0)        # dies

# George Eacker: handed over from seg 7 upstage on the turntable, facing away (re-ruled mark); he whirls round on
# the shot to face Philip, fires, and goes off upstage SL
wp('ens5', '2-17', 0.0, 1.6, -1.0, facing=180, dwell=0.0, label='George Eacker')
hold('ens5', T('2-17', 0.36), face((1.6, -1.0), (-0.4, 2.4)), dwell=1.2)
leave('ens5', 'W-USL', T('2-17', 1.56), speed=1.3, label='Ensemble 5')

# the Doctor and two bearers bring the table on from SR, under Philip at the front
enter('ens2', 'W-DSR', (-1.25, 4.3), T('2-17', 4.0), 90, speed=1.8, label='Ensemble 2')
enter('ens3', 'W-DSR', (0.6, 4.35), T('2-17', 4.8), 90, speed=1.8, label='Ensemble 3')
enter('ens4', 'W-DSR', DOC_T, T('2-17', 5.6), 160, speed=1.6, label='The Doctor')
walk('ens2', T('2-17', 9.0), clock(3.0, 235), facing=face(clock(3.0, 235), C))   # back to the ring
walk('ens3', T('2-17', 11.0), (1.3, 4.75), dwell=0)
walk('ens3', T('2-17', 14.5), clock(3.0, 80), facing=face(clock(3.0, 80), C))

# Hamilton runs in from SR on "Lose Wedge", to the table's SR side (in the DS pool ch7)
enter('hamilton', 'W-DSR', H_T, T('2-17', 11.0), 70, speed=2.4, label='Hamilton')
hold('hamilton', T('2-17', 32.46), 80)
hold('ens4', T('2-17', 32.46), 180)

# Eliza comes in from upstage centre, down the SL side of the ring into her special, then to the table
enter('eliza', 'D-UC', E_SL, T('2-17', 59.64), -120, speed=2.0, label='Eliza')
walk('eliza', T('2-17', 75.19), E_T, facing=-70)
hold('hamilton', T('2-17', 75.5), 60)
walk('ens4', T('2-17', 94.82), (-1.45, 2.15), facing=40)      # the doctor gives up, steps back
hold('eliza', T('2-17', 94.82), -80)
hold('hamilton', T('2-17', 107.5), 70)
hold('eliza', T('2-17', 107.5), -60)

# the company on the upstage gallery, watching (G-UC in, 2.06 "start move around")
USG_X = {'ens1': -3.6, 'ens7': -2.4, 'ens6': -1.2, 'ens5': 0.0, 'ens8': 1.2, 'ens9': 2.4, 'ens10': 3.6}
for k, e in enumerate(['ens1', 'ens10', 'ens7', 'ens9', 'ens6', 'ens8', 'ens5']):
    x = USG_X[e]
    lbl = 'Ensemble %s' % e[3:]
    enter(e, 'G-UC', (x, -3.35), T('2-17', 6.0 + 1.3 * k + abs(x - 0.6) / 1.3), 0, label=lbl, ty='gallery')
    hold(e, T('2-17', 32.46 + 0.4 * k), face((x, -3.35), C))
    hold(e, T('2-17', 87.0 + 0.4 * k), face((x, -3.35), TABLE_F))

# =====================================================================================
# 2-18 IT'S QUIET UPTOWN   0 dark / 8.6 Angelica DS / 23.6 company in / 31 the move uptown /
# 38.4 his verse / 60.45 his prayer / 68 the company: the couple seen in the street / 89.35 pull in /
# 96.2 Hamilton DSC / 104.72 his plea to Eliza / 132.4 vow / 163.92 company returns /
# 193.66 ensemble / 208.28 couple centre / 215.86 her hand / 220.76 forgiveness /
# 250.04 company falls away / 260.5 fade to black
# REVIEW: the film editor (ProVideo Coalition) - the turntable carries the couple off SR as Angelica begins; two fan
# accounts - Angelica DSL at the top and DSR for her second solo, Hamilton alone in an empty circle at centre with the
# company round him, Eliza entering from upstage centre and walking down to front centre while he sings to her, the
# two swapping places, then side by side, then centre where she takes his hand; they leave together, arm in arm.
# The cue file's "Eliza's verse / Eliza's prayer" are his verse and his prayer: Eliza has no lines in this number.
# =====================================================================================
# the platform turns the family away towards SR; they are carried off in the dark
for a in ('laurens', 'hamilton', 'eliza', 'ens4'):
    revolve(a, 70, T('2-18', 0.4), T('2-18', 6.5), step=25, end_facing=-100)
leave('ens2', 'W-DSR', T('2-18', 0.3), speed=1.2)
leave('ens3', 'W-MSL', T('2-18', 0.3), speed=1.2)
leave('laurens', 'W-DSR', T('2-18', 6.8), speed=1.0)
leave('ens4', 'W-DSR', T('2-18', 7.0), speed=1.0, label='Ensemble 4')
leave('hamilton', 'W-DSR', T('2-18', 7.2), speed=1.1)
leave('eliza', 'W-DSR', T('2-18', 7.4), speed=1.1)
for k, e in enumerate(['ens7', 'ens8', 'ens6', 'ens9', 'ens5', 'ens10', 'ens1']):
    leave(e, 'G-UC', T('2-18', 0.5 + 1.2 * k), speed=1.2)

# Angelica narrates DSL, in black
# SPOTLIGHT: her tight special (ch4, 1121) is DS just SR of centre at (-0.71, 4.0); she stands in it, downstage of
# the couples' circle (the fan accounts' DSL would need the special re-aimed)
ANG_DS = (-0.25, 4.6)
enter('angelica', 'W-DSL', ANG_DS, T('2-18', 8.6), -15, label='Angelica')
walk('angelica', T('2-18', 38.5), (3.4, 3.9), dwell=0)                # round the outside of the circling couples
walk('angelica', T('2-18', 42.0), (4.1, -0.3), facing=-60)           # her special goes; she watches from UL
hold('angelica', T('2-18', 89.35), face((4.1, -0.3), (-1.95, 2.0)))  # turns to Hamilton
leave('angelica', 'W-USL', T('2-18', 98.0))
enter('angelica', 'W-DSR', (-3.2, 4.25), T('2-18', 166.0), 20)       # her second solo, DSR
hold('angelica', T('2-18', 208.28), 45)
leave('angelica', 'W-DSR', T('2-18', 250.5), speed=1.0)

# the company: five couples circling the outer ring round Hamilton
COUPLE = [0, 72, 144, 216, 288]
QU_ENS = {}
for i, base in enumerate(COUPLE):
    QU_ENS[ENS[2 * i]] = base
    QU_ENS[ENS[2 * i + 1]] = base + 14
def ent_for(ang):
    ang %= 360
    if ang < 40 or ang >= 330: return 'D-UC', None
    if ang < 170: return 'W-MSL', None
    if ang < 240: return 'W-DSR', None
    return 'W-USR', None
R1 = 2.9
# SPOTLIGHT: "Hamilton alone on the ring - his special SR" / "Pull in to Hamilton" (ch12 at (-2.43, 2.31), full,
# 68-96 s, the only bright light at 89-96): he walks out of the centre to the SR side, inside the couples' circle
H_QC = (-1.95, 2.0)
for k, e in enumerate(ENS):
    a0 = QU_ENS[e]
    p = clock(R1, a0)
    ent, _ = ent_for(a0)
    enter(e, ent, p, T('2-18', 25.0 + 2.0 * (k % 2)), face(p, C) - 90, speed=1.2, label='Ensemble %s' % e[3:])
    # 27 -> 68: one slow revolution counter-clockwise (the healthy direction)
    circle(e, R1, a0, a0 - 360, T('2-18', 27.0), T('2-18', 68.0), step=45)
    # 68 -> 89.35: the wrong way round, clockwise, during his grief
    circle(e, R1, a0 - 360, a0 - 180, T('2-18', 68.0), T('2-18', 89.35), step=45, end_facing=None)
    end = clock(R1, a0 - 180)
    hold(e, T('2-18', 90.5), face(end, H_QC))
    ang = (a0 - 180) % 360
    # recede to the wings (D-UC is kept free for Eliza's entrance)
    if 100 <= ang < 180: ex = 'W-DSL'
    elif 180 <= ang < 260: ex = 'W-DSR'
    elif ang >= 260 or ang < 0: ex = 'W-USR'
    elif 0 <= ang < 30: ex = 'W-USL'
    else: ex = 'W-USL'
    if ang >= 330: ex = 'W-USR'
    leave(e, ex, T('2-18', 96.2 + 0.2 * k), speed=1.1)

# Hamilton: alone at the centre of the circle
enter('hamilton', 'D-UC', C, T('2-18', 31.0), 0, speed=1.1)
hold('hamilton', T('2-18', 38.4), 0)                 # his verse
hold('hamilton', T('2-18', 60.45), -10)              # his prayer
walk('hamilton', T('2-18', 70.0), H_QC, facing=20)   # seen in the street, alone on the SR side of the ring
hold('hamilton', T('2-18', 89.35), 0)
# SPOTLIGHT: "Hamilton DSC" is Binkley's preset 151 "Ham DSC" (ch43, focus (0.27, 2.53)); her special for the plea
# (ch1, 1130) is re-aimed beside it at (1.60, 2.44). The couple's front-centre business is played there, not at z 4.
H_PLEA = (0.3, 2.45)
walk('hamilton', T('2-18', 100.0), H_PLEA, facing=60)
# Eliza comes down from upstage centre to the front, beside him; he sings to her
enter('eliza', 'D-UC', (1.45, 2.5), T('2-18', 104.72), -90, speed=1.3)
hold('hamilton', T('2-18', 132.4), 75)               # the vow
# they swap places: he goes round behind her to her SL side
walk('hamilton', T('2-18', 144.5), (1.3, 1.35), dwell=0)
walk('hamilton', T('2-18', 146.5), (2.3, 2.45), facing=-100)
walk('eliza', T('2-18', 149.0), (0.9, 2.35), facing=80)
# side by side, she looking straight out
walk('eliza', T('2-18', 165.5), (0.5, 2.25), facing=0)
walk('hamilton', T('2-18', 166.5), (1.4, 2.35), facing=-10)
# the couple go to centre together
walk('eliza', T('2-18', 208.28), (-0.35, 0.95), facing=0)
walk('hamilton', T('2-18', 208.6), (0.35, 0.95), facing=-10)
hold('eliza', T('2-18', 215.86), 0)                  # she takes his hand without looking at him
hold('hamilton', T('2-18', 216.3), -35)              # his head to her shoulder
hold('eliza', T('2-18', 220.76), 75)                 # they hold each other
hold('hamilton', T('2-18', 221.1), -75)
hold('hamilton', T('2-18', 250.04), -20)
hold('eliza', T('2-18', 250.3), 20)
# they leave together, arm in arm
leave('hamilton', 'W-MSL', T('2-18', 260.8), speed=1.0, via=[(2.4, 0.45)])
leave('eliza', 'W-MSL', T('2-18', 260.8), speed=1.0, via=[(2.3, 1.05)])

# the company returns: couples circling (SPOTLIGHT: on the outer ring, r 2.75, clear of the couple keyed at
# z 2.3), then the standing ring, then round again
R2 = 2.75
for k, e in enumerate(ENS):
    base = COUPLE[k // 2] + (20 if k % 2 else 0)
    p = clock(R2, base)
    ent, _ = ent_for(base)
    if ent == 'W-DSL': ent = 'W-MSL'
    enter(e, ent, p, T('2-18', 167.2 + 2.0 * (k % 2)), face(p, C) - 90, speed=1.2)
    circle(e, R2, base, base - 330, T('2-18', 169.6), T('2-18', 193.66), step=55)
    # out to the standing ring (a gap downstage for the couple)
    stand = [16.7, 50, 83.3, 116.7, 150, 210, 243.3, 276.7, 310, 343.3][k]
    sp = clock(R1, stand)
    walk(e, T('2-18', 198.0 + 0.2 * k), sp, facing=face(sp, C) * 0.5)
    # forgiveness: round again, counter-clockwise, then away
    circle(e, R1, stand, stand - 250, T('2-18', 220.76), T('2-18', 249.5), step=50, end_facing=face(clock(R1, stand - 250), C) * 0.5)
    ang = (stand - 250) % 360
    if 100 <= ang < 180: ex = 'W-DSL'
    elif 180 <= ang < 260: ex = 'W-DSR'
    elif 260 <= ang < 330: ex = 'W-USR'
    elif 30 <= ang < 100: ex = 'W-USL'
    else: ex = 'D-UC'
    leave(e, ex, T('2-18', 251.0 + 0.4 * k), speed=1.0)

# =====================================================================================
# 2-19 THE ELECTION OF 1800   0.6 company look / 7.56 Jefferson DSR / 19.5 Burr UL /
# 36.04 Madison DR / 50.28 Burr's vamp / 65.05 Burr's campaign / 78.94 townspeople /
# 92.96 letters / 99.25 Hamilton UC / 107.13 split stage / 121.52 Burr meets Hamilton DSC /
# 141.64 deadlock / 152.37 to Hamilton / 157.94 Hamilton's endorsement /
# 184.92 Burr UL / 187.73 Jefferson wins / 201.77 Jefferson and Burr DC / 215.1 to the crowd /
# 229.72 band stops, Burr alone
# REVIEW: fan account (ironinkpen.tumblr.com, Act II): Jefferson and Madison open it (Madison enters wiping his eyes);
# Burr darts from person to person with pamphlets; the townspeople line up facing the house while Burr crouches and
# weaves between them; the company in two parallel lines facing each other, holding their letters out to Hamilton;
# Burr and Hamilton nearly alone for their exchange; Hamilton gives his endorsement from the centre of the upper level
# (the upstage gallery); Burr left alone on the deck.
# =====================================================================================
J = 'lafayette'; M = 'mulligan'
# SPOTLIGHT: centred in their apron specials (Jefferson ch2 at (-1.99, 3.58), Madison ch5 at (-0.97, 3.79))
J_DSR = (-2.3, 3.7); M_DR = (-1.1, 3.85)
enter(J, 'W-DSR', J_DSR, T('2-19', 5.0), 15, label='Jefferson')
enter(M, 'W-DSR', (-1.3, 3.15), T('2-19', 6.8), -40, label='Madison')    # wiping his eyes
hold(J, T('2-19', 7.56), 15)
walk(M, T('2-19', 36.04), M_DR, facing=-40)
hold(J, T('2-19', 37.0), 40)
hold(J, T('2-19', 50.28), 50)                     # watches Burr's vamp
walk(J, T('2-19', 79.0), (-3.6, 1.3), facing=60)  # the townspeople take the floor; J & M aside SR
walk(M, T('2-19', 79.6), (-3.75, 2.3), facing=60)
hold(J, T('2-19', 92.96), 140)                    # Madison urges the letter to Hamilton
hold(M, T('2-19', 93.5), 10)
J_SPLIT = (-3.0, 1.75); M_SPLIT = (-3.6, 2.5)
walk(J, T('2-19', 107.13), J_SPLIT, facing=40)
walk(M, T('2-19', 107.6), M_SPLIT, facing=40)
hold(J, T('2-19', 121.52), 90)
walk(J, T('2-19', 152.37), (-2.6, 2.4), facing=160)   # all eyes up to Hamilton
walk(M, T('2-19', 152.9), (-3.4, 3.2), facing=160)
walk(J, T('2-19', 190.5), (-0.5, 3.4), facing=0)  # Jefferson wins: to DC
hold(J, T('2-19', 201.77), 40)                    # with Burr
hold(J, T('2-19', 215.1), 180)                    # to the crowd
hold(J, T('2-19', 228.63), 0)
leave(J, 'W-DSR', T('2-19', 230.0))
walk(M, T('2-19', 195.0), (-2.4, 3.0), facing=40)
leave(M, 'W-DSR', T('2-19', 230.3))

B_UL = (4.2, -1.6)
enter('burr', 'W-USL', B_UL, T('2-19', 19.5), -30, label='Burr')
# the vamp: Burr from voter to voter with his pamphlets, then the centre of their ring
for t, p, f in ((52.5, (2.55, 1.05), 60), (55.0, (1.3, 1.4), 0), (57.5, (-0.65, 1.3), 180), (60.0, (-1.95, 1.25), -90)):
    walk('burr', T('2-19', t), p, facing=f, dwell=0.7)
walk('burr', T('2-19', 62.6), C, facing=0)
hold('burr', T('2-19', 65.05), 0)                  # the company chants for him
# the townspeople's line: he crouches and weaves behind it, lunges at the one who likes him
for t, p, f in ((81.5, (2.9, 2.45), 0), (84.0, (1.35, 2.45), 0), (86.5, (-0.35, 2.45), 0)):
    walk('burr', T('2-19', t), p, facing=f, dwell=0.5)
walk('burr', T('2-19', 88.5), (-1.65, 2.55), facing=0, dwell=1.0)
walk('burr', T('2-19', 91.5), (-2.6, 1.6), facing=60)
walk('burr', T('2-19', 103.5), (-1.3, 3.7), dwell=0)
walk('burr', T('2-19', 105.5), (1.3, 3.7), dwell=0)
walk('burr', T('2-19', 107.13), (3.2, 2.2), facing=-40)
walk('burr', T('2-19', 121.52), (0.8, 3.45), facing=-70)   # meets Hamilton DSC (SPOTLIGHT: in ch1 of 1162)
walk('burr', T('2-19', 145.0), (2.8, 2.9), facing=-40)
hold('burr', T('2-19', 158.5), face((2.8, 2.9), (0.0, -3.35)))   # looks up at Hamilton's endorsement
walk('burr', T('2-19', 175.0), (4.4, 0.2), dwell=0)
walk('burr', T('2-19', 177.5), B_UL, facing=-40)
hold('burr', T('2-19', 184.92), -55)               # the verdict on him
walk('burr', T('2-19', 197.5), (4.4, 0.2), dwell=0)
walk('burr', T('2-19', 201.77), (0.5, 3.4), facing=-40)
hold('burr', T('2-19', 215.1), -20)
walk('burr', T('2-19', 229.72), (0.7, 3.2), facing=0)  # alone in his special (ch1 at (0.87, 3.16))

# Hamilton: in at the back for the letters (the echo UC), down to Burr, then up to the gallery for his endorsement
# SPOTLIGHT: the echo's cold centre-top (ch13, 1158/1160) lands at (0, -0.83): he stands in it, at the head of the alley
enter('hamilton', 'D-UC', (0.0, -1.45), T('2-19', 99.25), 0, speed=1.1)
walk('hamilton', T('2-19', 121.52), (-0.75, 3.45), facing=70)    # SPOTLIGHT: in ch4 of 1162
leave('hamilton', 'D-UC', T('2-19', 135.0), speed=1.3)
enter('hamilton', 'G-UC', (0.0, -3.35), T('2-19', 152.37), 0, ty='gallery')
hold('hamilton', T('2-19', 157.94), 0)
hold('hamilton', T('2-19', 184.92), 45)
leave('hamilton', 'G-UC', T('2-19', 188.5), speed=1.3)

# the voters
CROWD = [(-2.6, 2.2), (-1.3, 2.4), (0.0, 2.2), (1.3, 2.4), (2.6, 2.2),
         (-1.95, 0.1), (-0.65, 0.3), (0.65, 0.1), (1.95, 0.3), (3.1, 0.6)]
CROWD_ENT = ['W-DSR', 'W-DSR', 'D-UC', 'W-DSL', 'W-DSL', 'W-USR', 'D-UC', 'D-UC', 'W-USL', 'W-USL']
CAMP_R = [(-2.2, 0.9), (-1.6, 2.4), (-2.3, 3.4), (-1.3, 1.5), (-2.9, 0.1)]
CAMP_L = [(2.3, 1.2), (1.6, 2.6), (2.3, 3.4), (1.3, 1.6), (2.5, 0.2)]
for k, e in enumerate(ENS):
    p = CROWD[k]
    enter(e, CROWD_ENT[k], p, T('2-19', 3.4 + 0.3 * k), 0, speed=1.8, label='Ensemble %s' % e[3:])
    hold(e, T('2-19', 7.56 + 0.15 * k), face(p, J_DSR) * 0.6)
    hold(e, T('2-19', 19.5 + 0.15 * k), face(p, B_UL) * 0.6)
def formation(t, spots, facing_fn, stagger=0.15):
    """move the ten from where they are to these spots (matched to keep paths short), arriving t + k*stagger."""
    dst = hungarian([pos(e) for e in ENS], spots)
    for k, e in enumerate(ENS):
        walk(e, t + stagger * k, dst[k], facing=facing_fn(dst[k]))
    return dict(zip(ENS, dst))
# Burr's campaign: a ring round him at centre
formation(T('2-19', 63.3), [clock(1.55, 36 * k) for k in range(10)], lambda p: 0)
# the townspeople: a line facing the house
formation(T('2-19', 80.0), [(-3.0 + 0.6667 * i, 3.3) for i in range(10)], lambda p: 0, stagger=0.1)
# the letters: two lines facing each other, an alley up to Hamilton UC, papers held out to him
ALLEY = [(-1.0, -1.2 + 0.95 * i) for i in range(5)] + [(1.0, -1.2 + 0.95 * i) for i in range(5)]
formation(T('2-19', 95.0), ALLEY, lambda p: 125 if p[0] < 0 else -125, stagger=0.15)
# the split: Jefferson's camp SR, Burr's SL
CAMP = formation(T('2-19', 110.0), CAMP_R + CAMP_L, lambda p: 40 if p[0] < 0 else -40, stagger=0.3)
# the camps fall back for the two men's exchange DSC
for k, e in enumerate(ENS):
    q = (CAMP[e][0], CAMP[e][1] - 1.2)
    walk(e, T('2-19', 121.52 + 0.1 * k), q, facing=face(q, (0.0, 4.3)) * 0.8)
# the deadlock: two lines upstage
LINES = [(-2.6 + 1.3 * i, -0.5) for i in range(5)] + [(-1.95 + 1.3 * i, -1.6) for i in range(4)] + [(3.1, -1.25)]
DL = formation(T('2-19', 144.0), LINES, lambda p: 0, stagger=0.35)
for k, e in enumerate(ENS):
    hold(e, T('2-19', 157.94 + 0.1 * k), face(DL[e], (0.0, -3.35)))    # up to Hamilton on the gallery
# Jefferson wins: the company erupts, a line upstage of him
ER = formation(T('2-19', 191.0), [(-3.6 + 0.8 * k, -0.3) for k in range(10)], lambda p: 0, stagger=0.12)
for k, e in enumerate(ENS):
    hold(e, T('2-19', 215.1 + 0.1 * k), face(ER[e], (-0.5, 3.4)) * 0.5)
    x = ER[e][0]
    ex = 'W-USR' if x < -1.5 else ('D-UC' if x < 1.5 else 'W-USL')
    leave(e, ex, T('2-19', 230.0 + 0.2 * k), speed=1.3)

# =====================================================================================
# 2-20 YOUR OBEDIENT SERVANT   0.2 Burr in a steel shaft / 17.38 the steel fan /
# 28.44 tight on Burr / 32.54 minuet, Burr's desk centre / 38.59 he writes / 67.44 the letter goes /
# 74.81 Hamilton replies / 92 Burr's aside / 102.18 the reply goes / 111.09 escalates /
# 119.69 / 128.19 the challenge / 134.46 / 136.61 both sign, the company surrounds them /
# 147.68 blackout
# REVIEW: fan account (ironinkpen): ONE desk at centre that both men use - Burr at it first, an ensemble member carries
# his letter to Hamilton, Hamilton takes the desk to write his list while Burr stands SL and several of the company
# bring Burr the long letter a page at a time; for Weehawken one of the company stands SL and one SR staring out.
# The film editor: the company leans toward the two men.
# =====================================================================================
DESK = (0.0, 0.6); B_SL = (3.1, 3.0)     # SPOTLIGHT: Burr's SL place moved into the challenge pool ch45 (3.05, 3.68)
walk('burr', T('2-20', 9.0), (-0.35, 3.05), facing=-20)     # the rant (SPOTLIGHT: inside his steel shaft ch93)
walk('burr', T('2-20', 17.38), (0.0, 2.2), facing=0)
walk('burr', T('2-20', 32.54), DESK, facing=0)              # sits at the desk centre
hold('burr', T('2-20', 67.44), 0)                           # signs
walk('burr', T('2-20', 73.0), B_SL, facing=-75)             # gives up the desk, stands SL
hold('burr', T('2-20', 92.0), -80)                          # his aside, towards Hamilton
hold('burr', T('2-20', 99.0), -20)
hold('burr', T('2-20', 128.19), -80)                        # the challenge
hold('burr', T('2-20', 136.61), 0)
leave('burr', 'W-DSL', T('2-20', 148.0), speed=1.3)

enter('hamilton', 'W-DSR', (-2.4, 2.5), T('2-20', 70.0), 60, speed=1.3)
walk('hamilton', T('2-20', 74.81), DESK, facing=0)         # takes the desk, writes his list
hold('hamilton', T('2-20', 119.69), 55)                     # refuses: towards Burr
hold('hamilton', T('2-20', 136.61), 10)

FAN = {}
for k, e in enumerate(ENS):
    ang = 270 + 20 * k
    FAN[e] = ang
    p = clock(3.0, ang)
    ent = 'W-USR' if ang < 320 else ('D-UC' if ang < 400 else ('W-USL' if ang < 420 else 'W-MSL'))
    enter(e, ent, p, T('2-20', 13.0 + 0.6 * k), face(p, DESK) * 0.4, speed=1.4)
    hold(e, T('2-20', 38.59 + 0.1 * k), face(p, DESK))      # lean to the desk
# the couriers: ens6 carries Burr's letter to Hamilton
cr = 'ens6'
walk(cr, T('2-20', 67.6), (0.55, 1.1), dwell=0.6, facing=-120)
walk(cr, T('2-20', 70.8), (-1.75, 2.2), facing=-110, dwell=0.8)
walk(cr, T('2-20', 76.5), clock(3.0, FAN[cr]), facing=face(clock(3.0, FAN[cr]), DESK))
# the pages of Hamilton's list, brought to Burr one at a time
for e, t, stop in (('ens7', 79.5, (2.45, 2.4)), ('ens8', 83.5, (2.35, 3.25)), ('ens9', 87.5, (2.6, 2.05))):
    home = clock(3.0, FAN[e])
    if e == 'ens9': walk(e, T('2-20', t - 1.3), (2.2, 0.9), dwell=0)
    walk(e, T('2-20', t), stop, facing=face(stop, B_SL), dwell=0.8)
    if e == 'ens9': walk(e, T('2-20', t + 2.4), (2.2, 0.9), dwell=0)
    walk(e, T('2-20', t + 4.2), home, facing=face(home, DESK))
# Hamilton's signed reply goes across
walk('ens7', T('2-20', 103.2), (0.6, 1.05), dwell=0.6, facing=-120)
walk('ens7', T('2-20', 106.5), (2.45, 2.4), facing=50, dwell=0.6)
walk('ens7', T('2-20', 110.5), clock(3.0, FAN['ens7']), facing=0)
# 111.09 escalates: the country leans in; 130.1 Weehawken: one SR, one SL staring out;
# 136.61 the company surrounds both men
SUR_C = (1.55, 1.8)
SUR = [36 * k + 15 for k in range(10)]
SURP = hungarian([clock(2.55, FAN[e]) for e in ENS], [clock(2.9, a, SUR_C) for a in SUR])
WEE = {'ens1': (-3.7, 3.6), 'ens10': (4.2, 1.2)}
for k, e in enumerate(ENS):
    q = clock(2.55, FAN[e])
    walk(e, T('2-20', 115.0 + 0.2 * k), q, facing=face(q, DESK))
    if e in WEE:
        walk(e, T('2-20', 130.1), WEE[e], facing=0)
    s = SURP[k]
    walk(e, T('2-20', 136.61 + 0.15 * k), s, facing=face(s, SUR_C))

# =====================================================================================
# 2-21 BEST OF WIVES AND BEST OF WOMEN   0.44 pre-dawn, Hamilton at his desk / 7.72 Eliza behind him /
# 19.96 her plea / 34.9 she goes / 40.16 Hamilton alone / 44.0 FTB
# REVIEW: fan account (ironinkpen): Hamilton at a desk near SR; Eliza comes up behind him and puts her arms round him;
# she starts back to bed and he catches her hand to stop her for his last words.
# =====================================================================================
for k, e in enumerate(ENS):
    s = (last(e)['x'], last(e)['z'])
    if s[0] < -0.5 and s[1] < 0.5: ex = 'W-USR'
    elif s[0] < -0.5: ex = 'W-DSR'
    elif s[0] > 3.3: ex = 'W-MSL'
    elif s[0] > 0.5 and s[1] > 1.0: ex = 'W-DSL'
    elif s[0] > 0.5: ex = 'W-MSL'
    else: ex = 'D-UC'
    leave(e, ex, T('2-20', 148.0 + 0.2 * k), speed=1.5)
H_DESK = (-2.8, 2.6)
walk('hamilton', T('2-21', 0.44), H_DESK, facing=0)          # the desk, now near SR, in the dark
E_BEHIND = (-2.75, 1.85)
enter('eliza', 'W-DSR', E_BEHIND, T('2-21', 7.72), 10, speed=1.3, via=[(-3.8, 2.4)])
walk('eliza', T('2-21', 19.96), (-2.05, 2.25), facing=-70)     # her plea, at his side
hold('hamilton', T('2-21', 21.0), 40)
walk('eliza', T('2-21', 36.6), (-3.35, 2.05), facing=60)       # starts back to bed; he catches her hand
hold('hamilton', T('2-21', 35.5), -70)
hold('hamilton', T('2-21', 40.16), -30)
leave('eliza', 'W-DSR', T('2-21', 41.0), speed=1.1)
leave('hamilton', 'W-DSR', T('2-21', 44.5), speed=1.3, via=[(-3.6, 3.7)])

# =====================================================================================
# 2-22 THE WORLD WAS WIDE ENOUGH   3.1 the count begins / 9.84 Burr narrates SL /
# 21.86 Hamilton surveys the ground SR / 34.45 his place / 46.18 Philip's ground UR /
# 58.5 Burr's confession / 71.42 Hamilton / 83.13 Burr's daughter / 94.36 the count /
# 101.42 FIRE (freeze) / 103.42 the monologue / 129.9 Hamilton DR / 142.4 centre pose /
# 149.9 to centre / 151.8 off the box / 155.46 eyes up / 162.5 Philip UR / 166.46 GW UL steps /
# 168.94 restore / 174.5 Eliza / 185.28 the fight / 191.18 the shot / 200.67 Burr ushered SL /
# 206.92 Hamilton rowed away / 215.22 the city mourns / 239.22 Burr DSC / 252.44 the replay /
# 266.44 Burr centre / 281.83 tight / 292.8 FTB
# REVIEW: fan accounts of the Broadway staging (hamilton-lyrics.tumblr.com "The World Was Wide Enough staging";
# ironinkpen, Act II) and the cast/swing posts on BroadwayWorld: Hamilton and his second come down from upstage right,
# Burr and his second to SL; the seconds meet at centre; Philip appears and walks away upstage before Hamilton can reach
# him; at the count the company clears and the duellists meet at centre and turn; the Bullet catches Burr's shot and
# drifts slowly TOWARD CENTRE along the line between the men; the company returns for the monologue (dancing behind
# Hamilton DR, a pose round him on the box, a pose round the Bullet at centre, then blown out to the edges as if by an
# explosion); Washington appears beside him and runs up to the upper level; Philip is up on the bridge; Eliza takes
# his hand, pulls him to centre, then walks off diagonally upstage right; the company scatters, leaving the two men;
# after the shot an ensemble member holds Burr back, two others sit either side of Hamilton miming rowing while the
# platform turns; Hamilton rises facing upstage with Eliza and Angelica either side of him and walks up the stairs
# towards the bridge; the company mirrors the women, turns out, closes round Burr DSC and falls back; all leave but Burr.
# =====================================================================================
# SPOTLIGHT (seg 8 spotlight agent), from Binkley's real 1238-1270 chain in hamilton-eos.json:
#  - FIRE (1242): the duel pools of preset 1123 - ch17 (-2.10, 0.26) and ch19 (3.12, 3.02): Hamilton SR, Burr SL
#  - before the count: Hamilton's SR shaft ch11 (-2.38, 1.69), Burr's SL special ch2 (3.0, 2.75)
#  - the monologue: Burr's own pool, preset 1126 "Burr", ch19 at (2.71, -0.04) from 1248 (full in 1250); the turntable
#    has carried him round; ch49 (-0.69, 1.53) is up near the centre 129.9-149.9 (the Bullet's hold)
#  - the box: preset 24 "DSC -Z-", ch43 (0.0, 3.43)
#  - ELIZA / "Freedom" Fight / the shot (1262-1270): ch12 preset 1130 (-2.0, -0.99) and ch91 preset 1137 (-2.68, -1.93)
#    SR-upstage, ch14/ch95 preset 1137 (2.26, 3.65)/(1.57, 3.43) DSL: the duel line has turned. Kept on the ruled
#    sides (Hamilton SR, Burr SL), Hamilton takes the SR-upstage pools and Burr the DSL ones.
HD = (-2.1, 0.35)                 # FIRE, in ch17
BD = (3.05, 2.95)                 # FIRE, in ch19 (and his SL special ch2 before the count)
H_PLACE = (-2.45, 1.55)           # his place before the count, in ch11
B_MON = (2.71, -0.04)             # Burr in the monologue, ch19 / preset 1126
H_SHOT = (-2.2, -1.15)            # at the shot, ch12 / ch91
B_SHOT = clock(2.85, 146)         # at the shot, ch95 / ch14
BULLET_HOLD = (-0.4, 1.2)         # ch49, near the turntable's centre
_L = math.hypot(BD[0] - HD[0], BD[1] - HD[1])
_U = ((BD[0] - HD[0]) / _L, (BD[1] - HD[1]) / _L)
_MID = ((HD[0] + BD[0]) / 2, (HD[1] + BD[1]) / 2)
H_CNT = (_MID[0] - 0.3 * _U[0], _MID[1] - 0.3 * _U[1]); B_CNT = (_MID[0] + 0.3 * _U[0], _MID[1] + 0.3 * _U[1])
B_PISTOL = (BD[0] - 0.65 * _U[0], BD[1] - 0.65 * _U[1])
def arc(a, c0, c1, r0, r1, t0, t1, n, end_facing):
    """carried by the turntable from angle c0 to c1 (degrees, round C) while the radius goes r0 -> r1"""
    if A[a][-1]['_T'] < t0 - 0.05:
        w = A[a][-1]; wpa(a, t0, w['x'], w['z'], facing=w.get('facing'), dwell=0)
    else:
        A[a][-1]['dwell'] = 0
    for k in range(1, n + 1):
        f = k / n; x, z = clock(r0 + (r1 - r0) * f, c0 + (c1 - c0) * f)
        if k < n: wpa(a, t0 + (t1 - t0) * f, x, z, dwell=0)
        else: wpa(a, t1, x, z, facing=end_facing)
# the company comes on with the duel music, a sombre upstage arc
ARC22 = {'ens5': 330, 'ens6': 350, 'ens7': 10, 'ens8': 30, 'ens9': 50, 'ens10': 70}
for k, (e, a) in enumerate(ARC22.items()):
    p = clock(3.5, a)
    ent = 'W-USR' if a > 300 else ('D-UC' if a < 40 else 'W-USL')
    enter(e, ent, p, T('2-22', 5.0 + 0.8 * k), face(p, C) * 0.6, speed=1.3, label='Ensemble %s' % e[3:])
# Burr and Van Ness (ens2) come on SL
enter('burr', 'W-MSL', (3.2, 2.3), T('2-22', 9.84), -40, label='Burr')
enter('ens2', 'W-MSL', (3.85, 1.3), T('2-22', 11.4), -60, label='Ensemble 2')
# Hamilton and Pendleton (ens3) walk down from upstage right; the Doctor (ens4) follows
enter('hamilton', 'W-USR', (-2.6, -1.2), T('2-22', 17.0), 160, label='Hamilton')
enter('ens3', 'W-USR', (-3.3, -0.85), T('2-22', 18.6), 160, label='Ensemble 3')
enter('ens4', 'W-USR', (-3.3, -0.6), T('2-22', 25.0), 60, label='The Doctor')
walk('hamilton', T('2-22', 21.86), (-2.65, 1.95), facing=-30)   # surveys the ground SR (in ch11)
walk('ens3', T('2-22', 22.8), (-3.75, 0.6), facing=60)
hold('burr', T('2-22', 22.5), -60)
walk('burr', T('2-22', 27.0), (3.3, 3.2), facing=-25)
walk('hamilton', T('2-22', 26.0), (-3.3, 3.0), facing=40)
walk('hamilton', T('2-22', 31.0), (-2.2, 3.4), facing=-20)
walk('hamilton', T('2-22', 34.45), H_PLACE, facing=face(H_PLACE, BD))
walk('burr', T('2-22', 34.45), BD, facing=face(BD, H_PLACE))
walk('ens2', T('2-22', 27.0), (3.75, 0.55), facing=face((3.75, 0.55), BD))
# the seconds meet at centre and check the pistols, then go back
walk('ens2', T('2-22', 40.0), (0.4, 0.95), facing=-90)
walk('ens3', T('2-22', 40.3), (-0.4, 0.95), facing=90)
hold('ens2', T('2-22', 43.5), -90)
walk('ens2', T('2-22', 47.0), (3.75, 0.55), facing=face((3.75, 0.55), BD))
walk('ens3', T('2-22', 47.0), (-3.75, 0.6), facing=60)
# Philip's ground: Philip appears UR; Hamilton goes to him; he turns and walks away upstage
# SPOTLIGHT: the "philip" preset (1167, ch19) is caught by the upstage gallery at (-2.32, -3.32): he appears up there,
# on the bridge, as he does again for "Phillip UR"
enter('laurens', 'G-UC', (-2.35, -3.35), T('2-22', 46.18), 20, label='Philip', ty='gallery')
walk('hamilton', T('2-22', 49.0), (-2.5, -1.0), facing=180)
leave('laurens', 'G-UC', T('2-22', 52.5), speed=1.1)
walk('hamilton', T('2-22', 56.0), H_PLACE, facing=face(H_PLACE, BD))
walk('burr', T('2-22', 58.5), (2.6, 3.4), facing=-15)   # his confession, out to us
walk('burr', T('2-22', 71.42), (3.0, 2.3), facing=-80)  # reads Hamilton
hold('hamilton', T('2-22', 72.0), 75)
walk('burr', T('2-22', 83.13), (3.1, 3.3), facing=0)    # his daughter
# the count: the company clears; the two meet at centre and pace out
walk('hamilton', T('2-22', 94.36), H_CNT, facing=face(H_CNT, HD))
walk('burr', T('2-22', 94.36), B_CNT, facing=face(B_CNT, BD))
walk('hamilton', T('2-22', 100.6), HD, facing=face(HD, BD))
walk('burr', T('2-22', 100.6), BD, facing=face(BD, HD))
# the turntable carries the frozen Burr round to his monologue pool, and later on to the DSL end of the line
arc('burr', ang_of(BD), ang_of(B_MON), rad_of(BD), rad_of(B_MON), T('2-22', 104.0), T('2-22', 128.0), 4, face(B_MON, (-3.5, 3.4)))
arc('burr', ang_of(B_MON), 146, rad_of(B_MON), 2.85, T('2-22', 175.0), T('2-22', 187.0), 4, face(B_SHOT, H_SHOT))
leave('ens2', 'W-MSL', T('2-22', 94.4), speed=1.2)
leave('ens3', 'W-USR', T('2-22', 94.4), speed=1.2)
leave('ens4', 'W-USR', T('2-22', 94.6), speed=1.2)
for k, (e, a) in enumerate(ARC22.items()):
    leave(e, 'W-USR' if a > 300 else ('D-UC' if a < 40 else 'W-USL'), T('2-22', 94.4 + 0.3 * k), speed=1.2)

# The Bullet: catches the shot at Burr's pistol at FIRE, drifts slowly along the line to centre, then on to Hamilton
BL = 'ens1'
enter(BL, 'W-USL', B_PISTOL, T('2-22', 100.4), face(B_PISTOL, HD), speed=1.0, label='The Bullet')
hold(BL, T('2-22', 101.42), face(B_PISTOL, HD), dwell=0)
walk(BL, T('2-22', 129.0), BULLET_HOLD, facing=face(BULLET_HOLD, HD), dwell=40.0)   # near centre: the company round her
walk(BL, T('2-22', 182.0), (-1.2, 0.15), dwell=0)
walk(BL, T('2-22', 191.18), (-1.75, -0.6), facing=face((-1.75, -0.6), H_SHOT))
leave(BL, 'W-DSR', T('2-22', 193.0), speed=1.3)

# Hamilton's monologue: he moves through the frozen picture
hold('hamilton', T('2-22', 103.42), face(HD, BD))
walk('hamilton', T('2-22', 115.0), (-2.7, 3.6), facing=20)
walk('hamilton', T('2-22', 129.9), (-3.5, 3.4), facing=15)     # Legacy / Hamilton DR, off the turntable
walk('hamilton', T('2-22', 140.4), (-2.0, 4.7), dwell=0)
walk('hamilton', T('2-22', 142.4), (0.0, 3.45), facing=0)      # "America" centre pose (on a box), preset 24
hold('hamilton', T('2-22', 149.9), 0)
H_EYES = (1.5, 3.75)
walk('hamilton', T('2-22', 153.0), (0.7, 3.95), facing=0)      # off the box
walk('hamilton', T('2-22', 155.46), H_EYES, facing=160)        # eyes up
hold('hamilton', T('2-22', 162.5), face(H_EYES, (-3.0, -3.35)))     # Philip on the bridge
hold('hamilton', T('2-22', 166.46), face(H_EYES, (3.35, -2.45)))    # Washington on the SL steps
hold('hamilton', T('2-22', 168.94), 0)
hold('hamilton', T('2-22', 174.5), -120)                       # Eliza
walk('hamilton', T('2-22', 176.5), (0.95, 2.6), facing=-110)   # she pulls him to centre
walk('hamilton', T('2-22', 185.0), (-2.6, 1.0), dwell=0)       # the fight: back to his place
walk('hamilton', T('2-22', 188.0), H_SHOT, facing=face(H_SHOT, B_SHOT))   # aims at the sky
H_HIT = (-2.4, -0.85)
walk('hamilton', T('2-22', 193.38), H_HIT, facing=40)          # hit
# Washington appears beside him, then runs up the SL stair: on the steps for "GW UL Steps", off along the gallery
enter('washington', 'W-DSL', (2.3, 3.0), T('2-22', 160.0), -90, speed=1.6, label='Washington')
walk('washington', T('2-22', 161.0), (2.3, 3.0), facing=-120, dwell=0)
walk('washington', T('2-22', 162.0), (1.75, 1.8), dwell=0)
walk('washington', T('2-22', 163.6), (1.9, -0.6), dwell=0)
walk('washington', T('2-22', 164.6), (2.2, -2.45), dwell=0)
wpa('washington', T('2-22', 166.46), 3.35, -2.45, y='top', facing=-30, dwell=3.0)
wpa('washington', T('2-22', 171.5), 4.5, -2.45, y='gallery', dwell=0)
wpa('washington', T('2-22', 172.3), 4.5, -3.3, y='gallery', dwell=0)
wpa('washington', T('2-22', 175.5), 0.6, -3.35, y='gallery', dwell=0)
wpa('washington', T('2-22', 176.7), 0.6, -4.8, y='gallery', off=True)
# Philip up on the bridge
wpa('laurens', T('2-22', 158.9), 0.6, -4.8, y='gallery', off=True, dwell=0)
wpa('laurens', T('2-22', 160.0), 0.6, -3.35, y='gallery', dwell=0)
wpa('laurens', T('2-22', 162.5), -3.0, -3.35, y='gallery', facing=20)
wpa('laurens', T('2-22', 169.0), -3.0, -3.35, y='gallery', facing=20, dwell=0)
wpa('laurens', T('2-22', 171.8), 0.6, -3.35, y='gallery', dwell=0)
wpa('laurens', T('2-22', 172.9), 0.6, -4.8, y='gallery', off=True)
# Eliza: in from upstage SL, takes his hand and pulls him to centre, then walks off diagonally upstage right
enter('eliza', 'W-USL', (0.85, 2.45), T('2-22', 174.0), 60, speed=1.4)
walk('eliza', T('2-22', 176.5), (0.3, 2.1), facing=75)
walk('eliza', T('2-22', 181.0), (-0.6, -0.9), dwell=0)
leave('eliza', 'W-USR', T('2-22', 181.1), speed=1.3)

# the company in the monologue (ens2..ens10): behind him DR, round him on the box, round the Bullet at centre,
# blown out to the edges at the restore, gone before the shot
MON = ['ens2', 'ens3', 'ens4', 'ens5', 'ens6', 'ens7', 'ens8', 'ens9', 'ens10']
DRB = [(x, z) for z in (2.35, 1.45, 0.55) for x in (-3.7, -2.8, -1.9)]
DRB_ENT = {(-1.9, 2.35): 'D-UC', (-1.9, 1.45): 'D-UC', (-1.9, 0.55): 'D-UC'}
for k, (e, p) in enumerate(zip(MON, DRB)):
    enter(e, DRB_ENT.get(p, 'W-USR'), p, T('2-22', 118.0 + 1.3 * k), 20,
          label='Ensemble %s' % e[3:])
BOX = (0.0, 3.45)
POSE = [clock(1.4, a, BOX) for a in (-70, -35, 0, 35, 70)] + [clock(2.2, a, BOX) for a in (-80, -45, 45, 80)]
P1 = dict(zip(MON, hungarian([pos(e) for e in MON], POSE)))
def seg_dist(a, b, q):
    dx, dz = b[0] - a[0], b[1] - a[1]; L2 = dx * dx + dz * dz or 1e-9
    f = max(0.0, min(1.0, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dz) / L2))
    return math.hypot(a[0] + f * dx - q[0], a[1] + f * dz - q[1]), f
for k, e in enumerate(MON):
    a0 = pos(e); t1 = T('2-22', 142.4 + 0.1 * k)
    d_, f_ = seg_dist(a0, P1[e], BULLET_HOLD)
    if d_ < 0.8:      # step round her on the downstage side
        via = (BULLET_HOLD[0], BULLET_HOLD[1] + 0.95)
        t0 = t1 - (math.hypot(via[0] - a0[0], via[1] - a0[1]) + math.hypot(P1[e][0] - via[0], P1[e][1] - via[1])) / 1.3
        tv = t0 + math.hypot(via[0] - a0[0], via[1] - a0[1]) / 1.3
        walk(e, max(tv, last(e)['_T'] + 1.0), via, dwell=0)
    walk(e, t1, P1[e], facing=face(P1[e], BOX))
# SPOTLIGHT: ens10 leaves the pose for the 'mum' figure on the gallery (preset 1168, ch17 at 99.6% in "GW UL Steps",
# caught by the gallery at (0.72, -3.09)); the other eight ring the Bullet
leave('ens10', 'D-UC', T('2-22', 150.0), speed=1.5)
enter('ens10', 'G-UC', (0.75, -3.35), T('2-22', 165.6), -20, speed=1.3, ty='gallery')
leave('ens10', 'G-UC', T('2-22', 169.0), speed=1.3)
MON = [e for e in MON if e != 'ens10']
RB = [clock(1.25, 180 + (270.0 / 7) * k, BULLET_HOLD) for k in range(8)]
P2 = dict(zip(MON, hungarian([pos(e) for e in MON], RB)))
for k, e in enumerate(sorted(MON, key=lambda e: P2[e][1])):     # the upstage places fill first
    walk(e, T('2-22', 155.5 + 0.5 * k), P2[e], facing=face(P2[e], BULLET_HOLD))
MON_ORDER = sorted(MON, key=lambda e: P2[e][1])
def blown(a0):
    for d in (0, 12, -12, 24, -24, 36, -36):
        q = clock(3.4, a0 + d)
        if min(math.hypot(q[0] - o[0], q[1] - o[1]) for o in (B_MON, H_EYES, (0.95, 2.6), H_SHOT, (-2.6, 1.0), (-1.2, 0.15))) > 1.0: return q
    return clock(3.4, a0)
for k, e in enumerate(MON):
    q = blown(ang_of(P2[e]))
    walk(e, T('2-22', 169.6 + 0.08 * k), q, facing=face(C, q))      # blown out to the edges
for k, e in enumerate(MON):
    a = ang_of(pos(e))
    if 120 <= a < 240: ex = 'W-DSR' if a >= 180 else 'W-DSL'
    elif 240 <= a < 330: ex = 'W-USR'
    elif 30 <= a < 120: ex = 'W-USL'
    else: ex = 'D-UC'
    leave(e, ex, T('2-22', 184.0 + 0.2 * k), speed=1.6)

# after the shot: Burr starts toward him and is held back (ens2); two sit either side of Hamilton and row
walk('burr', T('2-22', 193.4), (0.8, 2.6), facing=-130)
enter('ens2', 'W-MSL', (0.15, 1.95), T('2-22', 197.6), 45, speed=2.2)
B_AWAY = (2.2, 3.35)            # SPOTLIGHT: "Burr is ushered away - Burr SL" is ch1 at (2.01, 3.37)
walk('burr', T('2-22', 200.67), B_AWAY, facing=-50)
walk('ens2', T('2-22', 201.3), (1.45, 2.75), facing=60)
leave('ens2', 'W-MSL', T('2-22', 205.0), speed=1.2)
HA = ang_of(H_HIT); HR = rad_of(H_HIT)
enter('ens8', 'W-USR', clock(HR, HA - 14), T('2-22', 201.5), 180, speed=2.0, label='Ensemble 8')
enter('ens9', 'D-UC', clock(HR, HA + 14), T('2-22', 201.8), 0, speed=1.6, label='Ensemble 9')
for e, d in (('hamilton', 0), ('ens8', -14), ('ens9', 14)):
    circle(e, HR, HA + d, 262 + d, T('2-22', 202.2), T('2-22', 213.0), step=8,
           end_facing=(-90 if e == 'hamilton' else (180 if d < 0 else 0)))
leave('ens8', 'W-DSR', T('2-22', 214.5), speed=1.2)
leave('ens9', 'W-USR', T('2-22', 214.8), speed=1.2)
# Hamilton rises, facing upstage; Eliza and Angelica either side of him; he walks up the SR stair to the bridge
E_D = (-3.0, 2.25); A_D = (-2.45, 0.95)
hold('hamilton', T('2-22', 222.0), 180)
enter('eliza', 'W-DSR', E_D, T('2-22', 226.0), 160, speed=1.2)
enter('angelica', 'W-USR', A_D, T('2-22', 226.5), -150, speed=1.2, label='Angelica')
walk('hamilton', T('2-22', 233.3), (-4.1, 2.25), dwell=0)
walk('hamilton', T('2-22', 234.0), (-4.5, 1.85), dwell=0)
wpa('hamilton', T('2-22', 239.5), -4.5, -0.3, y='gallery', dwell=0)
wpa('hamilton', T('2-22', 242.6), -4.5, -3.3, y='gallery', dwell=0)
wpa('hamilton', T('2-22', 247.0), 0.6, -3.35, y='gallery', dwell=0)
wpa('hamilton', T('2-22', 248.2), 0.6, -4.8, y='gallery', off=True)
hold('eliza', T('2-22', 233.0), face(E_D, A_D))        # the women turn to each other
hold('angelica', T('2-22', 233.3), face(A_D, E_D))
leave('eliza', 'W-DSR', T('2-22', 252.0), speed=1.0)
leave('angelica', 'W-USR', T('2-22', 252.5), speed=1.0)
# the city mourns: the company mirrors the women, then turns out, closes round Burr DSC and falls back
MOURN = ['ens3', 'ens4', 'ens5', 'ens6', 'ens7', 'ens10']
MP = [(-2.0, -0.3), (-1.2, -0.3), (-0.4, -0.3), (0.4, -0.3), (1.2, -0.3), (2.0, -0.3)]
MENT = ['W-USR', 'W-USR', 'D-UC', 'D-UC', 'W-USL', 'W-USL']
for k, (e, p, en) in enumerate(zip(MOURN, MP, MENT)):
    enter(e, en, p, T('2-22', 218.0 + 1.6 * (k % 2) + 0.4 * k), 0, speed=1.1)
    hold(e, T('2-22', 233.5 + 0.1 * k), 90 if k % 2 == 0 else -90)     # in pairs, facing each other like the women
BURR_DSC = (0.15, 2.95)        # SPOTLIGHT: "Burr DSC" is ch5 at (0.17, 2.75)
RING_B = [clock(1.35, a, BURR_DSC) for a in (-75, -45, -15, 15, 45, 75)]
RBP = dict(zip(MOURN, hungarian([pos(e) for e in MOURN], RING_B)))
for k, e in enumerate(MOURN):
    hold(e, T('2-22', 239.22 + 0.1 * k), 0)                       # turn out
    walk(e, T('2-22', 243.5 + 0.1 * k), RBP[e], facing=face(RBP[e], BURR_DSC))
    q = clock(2.0, ang_of(RBP[e], BURR_DSC), BURR_DSC)
    walk(e, T('2-22', 247.0 + 0.1 * k), q, facing=face(q, BURR_DSC))   # fall back
    a = ang_of(q, BURR_DSC)
    leave(e, 'W-USR' if q[0] < -0.5 else ('W-USL' if q[0] > 0.5 else 'D-UC'), T('2-22', 250.0 + 0.4 * k), speed=1.0)
hold('burr', T('2-22', 215.22), -25)
walk('burr', T('2-22', 239.22), BURR_DSC, facing=0)          # his reckoning DSC
hold('burr', T('2-22', 252.44), -45)                        # replays the moment
walk('burr', T('2-22', 266.44), (-0.1, 2.75), facing=0)    # alone, centre (SPOTLIGHT: ch4 at (-0.09, 2.75))
hold('burr', T('2-22', 281.83), 0)

# =====================================================================================
# 2-23 WHO LIVES, WHO DIES, WHO TELLS YOUR STORY   0.44 Washington centre / 12.89 title chorus /
# 16.76 Jefferson (top of the SR stair) / 30.01 Madison DSL / 43.27 Burr DS / 49.23 builds /
# 56.84 Eliza enters, all turn to her / 62.48 Eliza down front / 76.34 her work / 88.92 Angelica /
# 94.94 Angelica gone / 104.08 her years / 114.59 Washington's monument / 119.94 Washington bows his head /
# 126.93 the company closes in behind her / 153.42 it spreads upstage: Hamilton revealed / 156.78 he comes down /
# 170.96 hand in hand at centre / 197.16 he walks her down and gives her away / 204.04 to the house /
# 210.98 the gasp / 211.8 blackout / 214.8 bows
# REVIEW: fan accounts (hamilton-lyrics.tumblr.com "Who Lives, Who Dies, Who Tells Your Story"; ironinkpen Act II):
# Washington opens at centre; Jefferson at the top of the SR staircase with Burr on the floor looking up at him, then
# Burr crosses to watch Madison DSL; the company circles down into three diagonal lines UR->DL; Eliza enters at the
# end of that chorus and everyone turns to her; Jefferson, Madison and Philip form a small triangle behind her for the
# soldiers; Angelica and Eliza sing to each other; Washington comes up behind her and smiles at the monument; the company
# closes in behind her and then spreads upstage, revealing Hamilton where she first entered; he comes down past her,
# they stand side by side facing upstage, see each other, go up to centre where she takes his hand; on the last line
# he walks her down and gives her away; she gasps in a small pool DSC. Curtain call (Harmon Writes; BroadwayWorld
# forum): the company in cream, ensemble among the leads, Hamilton and Eliza at the centre.
# =====================================================================================
OUTER = {a: clock(3.3, a) for a in (240, 270, 300, 330, 30, 60, 90, 120)}
INNER = {a: clock(2.0, a) for a in (250, 277.5, 305, 332.5, 27.5, 55, 82.5, 110)}
W_SLOT = (-0.45, -2.45)
F = {
    J: OUTER[240], M: OUTER[120], 'angelica': INNER[250], 'burr': INNER[110],
    'peggy': INNER[277.5], 'laurens': INNER[82.5],
    'ens1': INNER[305], 'ens2': INNER[332.5], 'ens3': INNER[27.5], 'ens4': INNER[55],
    'ens5': OUTER[270], 'ens6': OUTER[300], 'ens7': OUTER[330], 'ens8': OUTER[30], 'ens9': OUTER[60], 'ens10': OUTER[90],
}
F_LABEL = {J: 'Jefferson', M: 'Madison', 'angelica': 'Angelica', 'peggy': 'Maria Reynolds', 'laurens': 'Philip',
           'washington': 'Washington'}
F_ENT = {M: 'W-DSL', 'angelica': 'W-DSR', 'peggy': 'W-DSR', 'laurens': 'W-MSL',
         'ens1': 'W-USR', 'ens2': 'W-USR', 'ens3': 'W-USL', 'ens4': 'W-USL', 'ens5': 'W-USR', 'ens6': 'W-USR',
         'ens7': 'D-UC', 'ens8': 'D-UC', 'ens9': 'W-USL', 'ens10': 'W-MSL', 'washington': 'W-DSL'}
FON = dict(F); FON['washington'] = (0.0, 4.0)
# the company files on in the dark after the FTB (Burr is already on; Jefferson goes up to the SR stair top)
walk('burr', T('2-23', 0.2), F['burr'], facing=0)
groups = {}
for a in FON:
    if a in ('burr', J): continue
    groups.setdefault(F_ENT[a], []).append(a)
for ent, members in groups.items():
    (ox, oz), oy, wts = ENT[ent]
    def dist_of(a):
        return chain_len([(ox, oz)] + list(wts) + [FON[a]])
    members.sort(key=lambda a: -dist_of(a))     # the farthest goes first
    n = len(members)
    for i, a in enumerate(members):
        t_arr = T('2-23', 3.0) - 1.8 * (n - 1 - i) if a != 'washington' else T('2-23', 0.44)
        lbl = F_LABEL.get(a) or 'Ensemble %s' % a[3:]
        enter(a, ent, FON[a], t_arr, 0, speed=1.35, label=lbl)
        first_off = [x for x in A[a] if x.get('off')][-1]
        if first_off['_T'] < T('2-22', 292.8): print('NOTE early finale entrance', a, first_off['track'], first_off['at'])
walk('washington', T('2-23', 15.0), W_SLOT, facing=0)        # back into the company
# Jefferson: up the backstage stair, along the gallery, to the top of the SR stair
wpa(J, T('2-23', 8.0), 0.6, -4.8, y='gallery', off=True, dwell=0, label='Jefferson')
wpa(J, T('2-23', 9.1), 0.6, -3.35, y='gallery', dwell=0)
wpa(J, T('2-23', 13.1), -4.5, -3.3, y='gallery', dwell=0)
wpa(J, T('2-23', 16.6), -4.5, -0.45, y='gallery', facing=30)
wpa(J, T('2-23', 27.0), -4.5, -0.3, y='gallery', dwell=0)
walk(J, T('2-23', 32.0), (-4.5, 1.85), dwell=0)
walk(J, T('2-23', 35.0), F[J], facing=0)
# Burr on the floor looks up at Jefferson, crosses to watch Madison, takes his own lines DS, then SL
walk('burr', T('2-23', 16.76), (-2.4, 2.9), facing=face((-2.4, 2.9), (-4.5, -0.45)))
walk('burr', T('2-23', 30.01), (1.3, 3.0), facing=55)
walk(M, T('2-23', 30.01), (2.6, 3.9), facing=-15)
walk(M, T('2-23', 42.0), F[M], facing=0)
walk('burr', T('2-23', 43.27), (0.6, 3.7), facing=0)
walk('burr', T('2-23', 47.5), F['burr'], facing=-20)
# the company builds: three diagonal lines, upstage right to downstage left
LIN = [J, M, 'burr', 'angelica', 'peggy', 'laurens', 'washington'] + ENS
U = (0.781, 0.625); V = (0.625, -0.781); CEN = (0.2, 1.4)
DIAG = []
for s, cnt in ((-1.3, 6), (0.0, 6), (1.3, 5)):
    for i in range(cnt):
        t = (i - (cnt - 1) / 2.0) * 1.0
        DIAG.append((CEN[0] + t * U[0] + s * V[0], CEN[1] + t * U[1] + s * V[1]))
DG = dict(zip(LIN, hungarian([pos(a) for a in LIN], DIAG)))
for k, a in enumerate(LIN):
    walk(a, T('2-23', 50.0 + 0.1 * k), DG[a], facing=20)
SLOT = dict(F); SLOT['washington'] = W_SLOT
ELIZA_IN = (0.1, -1.4)
for k, a in enumerate(LIN):
    walk(a, T('2-23', 56.0 + 0.08 * k), SLOT[a], facing=face(SLOT[a], ELIZA_IN) * 0.7)
for k, a in enumerate(LIN):
    hold(a, T('2-23', 62.6 + 0.08 * k), face(SLOT[a], (0.0, 4.0)) * 0.7)
# Eliza: enters where the company parts, everyone turns to her; she comes down to the front
enter('eliza', 'D-UC', ELIZA_IN, T('2-23', 58.3), 0, label='Eliza', dwell=0)
walk('eliza', T('2-23', 62.48), (0.0, 4.0), facing=0)
# SPOTLIGHT: her shaft (ch93 at (0, 3.62), full from 62.48 to the gasp) keeps her; the triangle stands just outside it
hold('eliza', T('2-23', 80.0), 15)                               # her work: interviewing the soldiers
for a, p in ((J, (-0.85, 2.85)), (M, (0.85, 2.85)), ('laurens', (0.0, 2.2))):
    walk(a, T('2-23', 78.5), p, facing=0)
    walk(a, T('2-23', 86.5), F[a], facing=face(F[a], (0.0, 4.0)) * 0.7)
walk('angelica', T('2-23', 88.92), (-2.1, 4.1), facing=60)      # at her side (ch4 re-aimed to (-1.54, 3.16))
walk('eliza', T('2-23', 89.9), (-1.15, 3.75), facing=-60)
hold('angelica', T('2-23', 95.5), 0)                             # her burial: Angelica turns out
walk('eliza', T('2-23', 96.5), (-0.35, 3.5), facing=-40)         # back into her shaft
walk('angelica', T('2-23', 103.0), F['angelica'], facing=face(F['angelica'], (0.8, 4.1)) * 0.7)
# Eliza's small circle, inside her shaft
walk('eliza', T('2-23', 100.0), (-0.2, 3.25), dwell=0)
walk('eliza', T('2-23', 102.0), (0.35, 3.4), dwell=0)
walk('eliza', T('2-23', 104.0), (0.4, 3.95), dwell=0)
walk('eliza', T('2-23', 106.0), (0.1, 4.0), facing=-10)
# Washington comes up behind her and smiles; bows his head
walk('washington', T('2-23', 114.59), (0.6, 3.25), facing=15)
hold('washington', T('2-23', 119.94), 15)
# the company closes in behind her (two rows round her)
def garc(r, phi): return (r * math.sin(math.radians(phi)), 4.4 - r * math.cos(math.radians(phi)))
ROW1 = [garc(3.0, phi) for phi in (-75, -55, -35, -12, 12, 35, 55, 75)]
ROW2 = [garc(4.3, phi) for phi in (-70, -52.5, -35, -17.5, 0, 17.5, 35, 52.5, 70)]
CLOSE = [a for a in F] + ['washington']
G = dict(zip(CLOSE, hungarian([pos(a) for a in CLOSE], ROW1 + ROW2)))
for k, a in enumerate(CLOSE):
    walk(a, T('2-23', 124.5 + 0.15 * k), G[a], facing=face(G[a], (0.0, 4.4)) * 0.5)
walk('eliza', T('2-23', 126.93), (0.0, 3.95), facing=0)
# Hamilton comes on behind them, where she first entered
enter('hamilton', 'D-UC', (0.0, -1.6), T('2-23', 150.0), 0, speed=1.0, label='Hamilton')
# the company spreads upstage: he is revealed
SPREAD = [clock(3.4, a) for a in (225, 250, 275, 300, 325, 35, 60, 85, 110, 135)] + \
         [clock(2.3, a) for a in (240, 270, 300, 330, 30, 60, 90)]
SP = dict(zip(CLOSE, hungarian([pos(a) for a in CLOSE], SPREAD)))
for k, a in enumerate(CLOSE):
    walk(a, T('2-23', 153.42 + 0.12 * k), SP[a], facing=face(SP[a], (0.0, 3.0)) * 0.6)
hold('eliza', T('2-23', 156.78), -20)
# he comes down past her; side by side facing upstage; they see each other; up to centre, her hand in his
walk('hamilton', T('2-23', 163.0), (0.7, 4.15), facing=0)
hold('hamilton', T('2-23', 165.0), 180)
hold('eliza', T('2-23', 165.3), 180)
hold('hamilton', T('2-23', 167.0), -90)
hold('eliza', T('2-23', 167.2), 90)
# SPOTLIGHT: "Hamilton leads her DS - a golden-white key" is ch5 at (-0.56, 2.96), up to the final refrain
walk('eliza', T('2-23', 172.0), (-0.85, 2.6), facing=90)
walk('hamilton', T('2-23', 172.2), (-0.15, 2.6), facing=-90)
walk('washington', T('2-23', 183.36), (-0.5, 1.45), facing=0)  # Washington behind them
# the last line: he walks her down and gives her away; she goes into her pool DSC
# SPOTLIGHT: her shaft ch93 (0, 3.62) r 0.7 is the gasp's pool; she stands in it alone, the men step back out of it
walk('eliza', T('2-23', 199.6), (0.0, 4.2), facing=0)
walk('hamilton', T('2-23', 199.4), (0.55, 3.85), facing=-30)
walk('hamilton', T('2-23', 204.04), (0.85, 2.75), facing=-15)
walk('washington', T('2-23', 204.5), (-0.85, 2.75), facing=15)
hold('eliza', T('2-23', 204.04), 0)                               # to the house
hold('eliza', T('2-23', 210.98), 0)                               # the gasp
# BOWS: the lights come back 3 s after the blackout on the company in two rows, ensemble among the leads,
# Hamilton and Eliza at the centre; King George (in cream, not in the finale) walks on SL beside Jefferson
FRONT = ['mulligan', 'ens9', 'angelica', 'burr', 'hamilton', 'eliza', 'washington', 'ens1', 'lafayette', 'king']
BACK = ['ens2', 'ens3', 'peggy', 'ens4', 'ens5', 'ens6', 'laurens', 'ens7', 'ens8', 'ens10']
BOWP = {a: (-4.05 + 0.9 * i, 4.15) for i, a in enumerate(FRONT)}
BOWP.update({a: (-4.5 + 0.9 * i, 3.05) for i, a in enumerate(BACK)})
for a in FRONT + BACK:
    if a == 'king':
        enter('king', 'W-DSL', BOWP[a], T('2-23', 214.6), 0, speed=1.3, label='King George')
        continue
    hold(a, T('2-23', 211.9), last(a).get('facing', 0))
    walk(a, T('2-23', 214.6), BOWP[a], facing=0)
# =====================================================================================
out = {'segment': 8, 'tracks': ORDER, 'waypoints': {}, 'notes': ''}
for a in ['hamilton', 'burr', 'eliza', 'angelica', 'peggy', 'washington', 'lafayette', 'mulligan', 'laurens', 'king'] + ENS:
    if a in A:
        out['waypoints'][a] = [{k: v for k, v in w.items() if not k.startswith('_')} for w in A[a]]
NOTES = os.path.join(HERE, 'seg8-notes.txt')
if os.path.exists(NOTES):
    out['notes'] = open(NOTES, encoding='utf-8').read().strip()
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write('{\n "segment": 8,\n "tracks": ' + json.dumps(ORDER) + ',\n "waypoints": {\n')
    names = list(out['waypoints'])
    for n, a in enumerate(names):
        f.write('  ' + json.dumps(a) + ': [')
        f.write(','.join('\n   ' + json.dumps(w) for w in out['waypoints'][a]))
        f.write('\n  ]' + (',' if n + 1 < len(names) else '') + '\n')
    f.write(' },\n "notes": ' + json.dumps(out['notes']) + '\n}\n')
print('wrote', OUT, sum(len(v) for v in out['waypoints'].values()), 'waypoints')

