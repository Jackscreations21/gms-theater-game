#!/usr/bin/env python3
"""assets/mannequin-woman-rig.glb: the mannequin cut into rigid parts at her joints (RULING FS).

    python -I tools/mannequin-rig.py assets/mannequin-woman.glb assets/mannequin-woman-rig.glb [--report]

The input is the committed body (tools/mannequin-glb.py made it from Jack's STL), so the rig can be remade
without the STL.  Standard library only (no numpy on this machine).

THE FRAME is the input's: metres, Y up, feet at y 0, facing +Z.  She faces +Z, so HER LEFT IS +X ("_L" parts
are at +x, "_R" at -x).

THE JOINTS ARE MEASURED FROM THE MESH (horizontal cross-sections; `--report` prints them):
  - the CROTCH is the lowest height at which the two legs' sections join (one ring, not two);
  - the ANKLE is each leg's narrowest section between 0.08 and 0.14 m (the shoe's collar); the pivot sits
    ANKLE_DROP below it, inside the shoe;
  - the KNEE is where the leg's section centroid moves forward fastest (the kneecap; the trousers hide any
    narrowing), 0.30 - 0.60, over a 4 cm window;
  - the HIP joint is HIP_ABOVE_CROTCH over the crotch, on the thigh's axis (its centroids 0.50 - 0.70, carried up);
  - the NECK is the narrowest section between 1.38 and 1.50;
  - the ELBOW: the sleeve hides it.  It is the middle of the span where the arm's section is a ring of its own,
    clear of the torso (the elbow bows out from the body there);
  - the SHOULDER is SHOULDER_BELOW_TOP under the top of the arm's column (the highest section wider than 0.14 m
    out), the upper arm's radius in from the outside;
  - the WRIST is each arm's narrowest section between 0.76 and 0.86 (the sleeve's cuff); its x / z from the
    hand's own free sections below it (the cuff is fused to her hip);
  - the FINGERTIPS are the lowest section with a ring of its own outboard of the thigh;
  - the WAIST joint (spine on pelvis) is the sweater's hem, WAIST_Y.
Otherwise each joint's x and z are the section's centroid there (the limb's own axis).  Measured 2026-10-13:
ankle 0.095 / 0.100, knee 0.430 / 0.440, hip 0.845, waist 0.985, wrist 0.807 / 0.820, elbow 1.045 / 1.056,
shoulder 1.323 / 1.327, neck 1.432, fingertips 0.670 / 0.677 (L / R; the crotch 0.795).

THE CUT.  Every triangle goes to one part, by its centroid: an ARM if it is within ARM_K x the arm's radius of
the arm's axis (shoulder - elbow - wrist - fingertip) — ARM_K_IN on her body's side of it — and outboard of the
shoulder's cut plane (her arms hang against her sides: the scan fused sleeve to torso at the hip and the
armpit, so a distance rule, not connectivity, finds them); else the HEAD above the neck; a THIGH below the
groin line (from the crotch, rising GROIN_RISE), split left / right at x 0, a SHIN below the knee, a FOOT below
the ankle cut; else the PELVIS below the waist and the TORSO above it.  Then teeth are voted away, every part
keeps only its largest connected piece (strays go to the neighbour most of their edges touch), and flaps (a
triangle with two open edges) are trimmed off the rims.  The parts meet exactly at rest.

UNDER THE CUTS.  A cut scan is open at every joint and wherever an arm lay against her.  Fan caps over those
rims looked torn (zigzag rims; the clustering left non-manifold edges), so each part carries a LINER: her
volume on a LINER_CELL grid (the scan rasterised, the outside flooded in), the cells wholly inside her
labelled by the same rule, each part's share surfaced (a cuberille, Taubin-smoothed), set LINER_IN inside, and
kept only within LINER_NEAR of the rims the cut made (not the scan's own pinholes).  Each child part also
carries a JOINT BALL at its pivot (an icosphere, BALL_K x the section's mean radius, never past the nearest
point of its own or its parent's surface) that fills the wedge a bend opens.

THE GLB: one node per part, named, in a tree (pelvis -> spine -> head; pelvis -> thigh -> shin -> foot; spine
-> upperarm -> forearm -> hand), each node's translation its joint relative to its parent's, each mesh's
vertices relative to its own joint: rotate a node and the part turns about its joint.  One material.  The
measured joints are in asset.extras.joints (world metres).
"""
import json, math, struct, sys

ANKLE_DROP = 0.03            # m: the ankle's pivot under the shoe collar's narrowest section
HIP_ABOVE_CROTCH = 0.05      # m: the hip joint's centre above the crotch
SHOULDER_BELOW_TOP = 0.05    # m: the shoulder joint's centre under the top of the arm's column
WAIST_Y = 0.985              # m: the sweater's hem (seen in the renders), where the torso meets the pelvis
ANKLE_CUT = 0.115            # m: the foot is everything under this (the trouser cuff stays on the shin)
ARM_K = 1.45                 # a triangle within ARM_K x the arm's radius of its axis is the arm's ...
ARM_K_IN = 1.0               # ... or within ARM_K_IN on her body's side of the arm, where the scan fused sleeve and body:
                             # there the body keeps the crease, so an arm swung away leaves her side whole
BALL_K = 0.8                 # a joint ball's radius: this x the section's mean radius there
LINER_CELL = 0.018           # m: the liner's grid
LINER_SMOOTH = 8             # Taubin passes
LINER_IN = 0.003             # m: the liner sits this far inside the scan
LINER_NEAR = 0.035           # m: and only this close to a part's open edges
GROIN_RISE = 0.25            # the groin line rises this many m per m out from the crotch

# ---------------------------------------------------------------- reading the body

def read_glb(path):
    d = open(path, 'rb').read()
    jl = struct.unpack_from('<I', d, 12)[0]
    gl = json.loads(d[20:20 + jl]); bo = 20 + jl + 8
    acc, bv = gl['accessors'], gl['bufferViews']
    def get(i, n):
        a = acc[i]; v = bv[a['bufferView']]; off = bo + v.get('byteOffset', 0) + a.get('byteOffset', 0)
        fmt = {5126: 'f', 5123: 'H', 5125: 'I'}[a['componentType']]
        return struct.unpack_from('<%d%s' % (a['count'] * n, fmt), d, off)
    pr = gl['meshes'][0]['primitives'][0]
    p = get(pr['attributes']['POSITION'], 3); nn = get(pr['attributes']['NORMAL'], 3); ix = get(pr['indices'], 1)
    P = [tuple(p[i:i + 3]) for i in range(0, len(p), 3)]
    N = [tuple(nn[i:i + 3]) for i in range(0, len(nn), 3)]
    F = [tuple(ix[i:i + 3]) for i in range(0, len(ix), 3)]
    return P, N, F, gl['asset'].get('extras', {})


def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def add(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def mul(a, k): return (a[0] * k, a[1] * k, a[2] * k)
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def norm(a):
    l = math.sqrt(dot(a, a)); return (a[0] / l, a[1] / l, a[2] / l) if l > 1e-20 else (0.0, 1.0, 0.0)

# ---------------------------------------------------------------- sections

def section(P, F, h):
    """The horizontal section at height h: a list of segments ((x0, z0), (x1, z1))."""
    out = []
    for f in F:
        a, b, c = P[f[0]], P[f[1]], P[f[2]]
        if min(a[1], b[1], c[1]) > h or max(a[1], b[1], c[1]) < h:
            continue
        s = []
        for u, v in ((a, b), (b, c), (c, a)):
            if (u[1] - h) * (v[1] - h) < 0:
                t = (h - u[1]) / (v[1] - u[1]); s.append((u[0] + t * (v[0] - u[0]), u[2] + t * (v[2] - u[2])))
        if len(s) == 2:
            out.append((s[0], s[1]))
    return out


def rings(segs, eps=0.003):
    """The section's separate rings (segments chained by shared ends, within eps): a list of segment lists."""
    key = lambda p: (round(p[0] / eps), round(p[1] / eps))
    at = {}
    for i, (p, q) in enumerate(segs):
        for e in (p, q):
            k = key(e)
            for dx in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    at.setdefault((k[0] + dx, k[1] + dz), []).append(i)
    seen, out = set(), []
    for i in range(len(segs)):
        if i in seen:
            continue
        st, grp = [i], []; seen.add(i)
        while st:
            j = st.pop(); grp.append(segs[j])
            for e in segs[j]:
                for o in at.get(key(e), ()):
                    if o not in seen:
                        seen.add(o); st.append(o)
        out.append(grp)
    return out


def ring_stats(segs):
    """→ (perimeter, centroid x, centroid z, mean radius about the centroid)"""
    L = cx = cz = 0.0
    for (x0, z0), (x1, z1) in segs:
        l = math.hypot(x1 - x0, z1 - z0); L += l; cx += (x0 + x1) / 2 * l; cz += (z0 + z1) / 2 * l
    if L <= 0:
        return 0.0, 0.0, 0.0, 0.0
    cx /= L; cz /= L
    r = sum(math.hypot((x0 + x1) / 2 - cx, (z0 + z1) / 2 - cz) * math.hypot(x1 - x0, z1 - z0) for (x0, z0), (x1, z1) in segs) / L
    return L, cx, cz, r


def side_ring(P, F, h, side, xmin=0.0):
    """The stats of the section's segments on one side (x * side > xmin)."""
    return ring_stats([s for s in section(P, F, h) if (s[0][0] + s[1][0]) / 2 * side > xmin])


def frange(a, b, step):
    n = int(round((b - a) / step)); return [a + step * k for k in range(n + 1)]


def fit_line(pts):            # least squares z = m y + c
    n = len(pts); sy = sum(p[0] for p in pts); sz = sum(p[1] for p in pts)
    syy = sum(p[0] * p[0] for p in pts); syz = sum(p[0] * p[1] for p in pts)
    m = (n * syz - sy * sz) / (n * syy - sy * sy); return m, (sz - m * sy) / n


def measure(P, F, report):
    J, R, log = {}, {}, []
    # the crotch: the lowest height with ONE ring spanning x 0 (the legs joined)
    crotch = None
    for h in frange(0.70, 0.90, 0.0025):
        rs = rings(section(P, F, h))
        if any(min(min(a[0], b[0]) for a, b in r) < -0.02 and max(max(a[0], b[0]) for a, b in r) > 0.02 for r in rs):
            crotch = h; break
    log.append(f'crotch (the legs\' sections join): {crotch:.3f}')
    for side, s in (('L', 1), ('R', -1)):
        # the ankle: the leg's narrowest section, 0.08 - 0.14
        best = min((side_ring(P, F, h, s)[0], h) for h in frange(0.08, 0.14, 0.0025))
        ah = best[1]; st = side_ring(P, F, ah - ANKLE_DROP, s)
        J['ankle_' + side] = (st[1], ah - ANKLE_DROP, st[2]); R['ankle_' + side] = side_ring(P, F, ah, s)[3]
        log.append(f'ankle {side}: narrowest section at {ah:.3f} (perimeter {best[0]:.3f}); pivot {ah - ANKLE_DROP:.3f}')
        # the knee: the kneecap — where the leg's centroid moves forward fastest (a 4 cm window, 0.30 - 0.60)
        zs = [(h, side_ring(P, F, h, s)[2]) for h in frange(0.30, 0.60, 0.01)]
        rate = [((zs[i + 2][0] + zs[i - 2][0]) / 2, (zs[i + 2][1] - zs[i - 2][1]) / 0.04) for i in range(2, len(zs) - 2)]
        kh, kr = max(rate, key=lambda r: r[1]); st = side_ring(P, F, kh, s)
        J['knee_' + side] = (st[1], kh, st[2]); R['knee_' + side] = st[3]
        log.append(f'knee {side}: the centroid of the leg moves forward fastest at {kh:.3f} ({kr:.2f} m/m)')
        # the hip: over the crotch, on the thigh's axis (its section centroids 0.50 - 0.70, carried up)
        th = [(h, side_ring(P, F, h, s)) for h in frange(0.50, 0.70, 0.01)]
        hh = crotch + HIP_ABOVE_CROTCH
        mx, cx = fit_line([(h, a[1]) for h, a in th]); mz, cz = fit_line([(h, a[2]) for h, a in th])
        J['hip_' + side] = (mx * hh + cx, hh, mz * hh + cz); R['hip_' + side] = side_ring(P, F, crotch - 0.03, s)[3]
    # the neck: the narrowest section 1.38 - 1.50
    best = min((ring_stats(section(P, F, h))[0], h) for h in frange(1.38, 1.50, 0.0025))
    st = ring_stats(section(P, F, best[1]))
    J['neck'] = (st[1], best[1], st[2]); R['neck'] = st[3]
    log.append(f'neck: narrowest section at {best[1]:.3f} (perimeter {best[0]:.3f})')
    # the waist joint: the torso's section (its largest ring) at the sweater's hem
    def torso(h):
        rs = rings(section(P, F, h)); rs.sort(key=lambda r: -ring_stats(r)[0]); return ring_stats(rs[0])
    st = ring_stats([g for g in section(P, F, WAIST_Y) if abs(g[0][0] + g[1][0]) / 2 < 0.12])   # the arms (fused at the hem) left out
    J['waist'] = (0.0, WAIST_Y, st[2]); R['waist'] = torso(WAIST_Y)[3]
    for side, s in (('L', 1), ('R', -1)):
        # the arm's own rings: those whose centroid is outboard of 0.12
        def arm(h):
            rs = [ring_stats(r) for r in rings(section(P, F, h))]
            rs = [r for r in rs if r[1] * s > 0.12 and r[0] > 0.05]
            return rs[0] if len(rs) == 1 else None
        # the elbow: the middle of the span where the arm's section is free of the torso (the elbow bows out)
        free = [h for h in frange(0.95, 1.30, 0.0025) if arm(h)]
        eh_s = (min(free) + max(free)) / 2; st = arm(eh_s) or side_ring(P, F, eh_s, s, 0.13)
        J['elbow_' + side] = (st[1], eh_s, st[2]); R['elbow_' + side] = st[3]
        log.append(f'elbow {side}: the arm is free of the torso {min(free):.3f} - {max(free):.3f}; pivot {eh_s:.3f}')
        # the shoulder: the top of the arm's column is the highest section still wider than the neck's root (0.14 m out);
        # the pivot SHOULDER_BELOW_TOP under it, the upper arm's radius in from the outside
        top = max(h for h in frange(1.25, 1.45, 0.0025) if any(max(a[0] * s, b[0] * s) > 0.14 for a, b in section(P, F, h)))
        sh = top - SHOULDER_BELOW_TOP
        ru = sum(arm(h)[3] for h in free if h > eh_s) / max(1, sum(1 for h in free if h > eh_s))
        segs = section(P, F, sh); out = max(max(a[0] * s, b[0] * s) for a, b in segs)
        st = side_ring(P, F, sh, s, 0.135)
        J['shoulder_' + side] = (s * (out - ru), sh, st[2]); R['shoulder_' + side] = ru
        log.append(f'shoulder {side}: the column of the arm tops out at {top:.3f}; pivot {sh:.3f}, {out:.3f} - {ru:.3f} out')
        best = min((side_ring(P, F, h, s, 0.135)[0], h) for h in frange(0.76, 0.86, 0.0025))
        st = side_ring(P, F, best[1], s, 0.135)
        J['wrist_' + side] = (st[1], best[1], st[2]); R['wrist_' + side] = st[3]
        log.append(f'wrist {side}: narrowest arm section at {best[1]:.3f} (perimeter {best[0]:.3f})')
        # the fingertips: the lowest section with a ring of its own outboard of the thigh (centroid 0.15 out)
        th = min(h for h in frange(0.60, best[1], 0.0025) if any(ring_stats(r)[1] * s > 0.15 for r in rings(section(P, F, h))))
        hand = [p for p in P if th <= p[1] < best[1] and p[0] * s > 0.15]
        tip = (0, th, 0)
        J['tip_' + side] = (sum(p[0] for p in hand) / len(hand), th, sum(p[2] for p in hand) / len(hand))
        # the wrist's x / z: the cuff is fused to her hip, so the hand's own free rings (under the fusion) say where its axis is
        own = [ring_stats(r) for h in frange(th + 0.02, 0.78, 0.005) for r in rings(section(P, F, h)) if ring_stats(r)[1] * s > 0.15]
        J['wrist_' + side] = (sum(r[1] for r in own) / len(own), J['wrist_' + side][1], sum(r[2] for r in own) / len(own))
        R['wrist_' + side] = sum(r[3] for r in own) / len(own)
        log.append(f'fingertips {side}: {tip[1]:.3f}')
    J['root'] = ((J['hip_L'][0] + J['hip_R'][0]) / 2, J['hip_L'][1], (J['hip_L'][2] + J['hip_R'][2]) / 2)
    if report:
        print('\n'.join(log))
    return J, R, crotch

# ---------------------------------------------------------------- the cut

PARTS = [  # name, parent, joint
    ('pelvis', None, 'root'), ('spine', 'pelvis', 'waist'), ('head', 'spine', 'neck'),
    ('thigh_L', 'pelvis', 'hip_L'), ('shin_L', 'thigh_L', 'knee_L'), ('foot_L', 'shin_L', 'ankle_L'),
    ('thigh_R', 'pelvis', 'hip_R'), ('shin_R', 'thigh_R', 'knee_R'), ('foot_R', 'shin_R', 'ankle_R'),
    ('upperarm_L', 'spine', 'shoulder_L'), ('forearm_L', 'upperarm_L', 'elbow_L'), ('hand_L', 'forearm_L', 'wrist_L'),
    ('upperarm_R', 'spine', 'shoulder_R'), ('forearm_R', 'upperarm_R', 'elbow_R'), ('hand_R', 'forearm_R', 'wrist_R'),
]
PI = {p[0]: i for i, p in enumerate(PARTS)}


def seg_dist(p, a, b):
    ab = sub(b, a); t = max(0.0, min(1.0, dot(sub(p, a), ab) / dot(ab, ab)))
    q = add(a, mul(ab, t)); d = sub(p, q); return math.sqrt(dot(d, d)), t, q


def classify(c, J, R, crotch):
    x, y, z = c
    for side, s in (('L', 1), ('R', -1)):
        S, E, W, T = J['shoulder_' + side], J['elbow_' + side], J['wrist_' + side], J['tip_' + side]
        if y > S[1] + 0.12 or y < T[1] - 0.02 or x * s < 0.08:
            continue
        # outboard of the shoulder's cut: a plane through the shoulder joint, its normal out and a little down
        nrm = norm((s * 1.0, -0.55, 0.0))
        if dot(sub(c, (S[0] - s * 0.035, S[1], S[2])), nrm) < 0:
            continue
        ru, rf, rh = R['shoulder_' + side], R['elbow_' + side], max(R['wrist_' + side], 0.035)
        best = None
        for a, b, ra, rb, part in ((S, E, ru, rf, 'upperarm_'), (E, W, rf, rf, 'forearm_'), (W, T, rh, rh, 'hand_')):
            d, t, q = seg_dist(c, a, b); r = ra + (rb - ra) * t
            k = d / r
            if best is None or k < best[0]:
                best = (k, part, q)
        q = best[2]
        u = (c[0] - q[0], c[2] - q[2]); w = (J['root'][0] - q[0], J['root'][2] - q[2])
        lu, lw = math.hypot(*u), math.hypot(*w)
        inner = (u[0] * w[0] + u[1] * w[1]) / (lu * lw) if lu > 1e-9 and lw > 1e-9 else 0.0
        if best[0] < (ARM_K_IN if inner > 0.25 else ARM_K):
            # which bone along the arm: by height against the joints (the cut planes are horizontal)
            if y > E[1]: return PI['upperarm_' + side]
            if y > W[1]: return PI['forearm_' + side]
            return PI['hand_' + side]
    if y > J['neck'][1]:
        return PI['head']
    if y < crotch + GROIN_RISE * abs(x) - 0.005:
        side = 'L' if x > 0 else 'R'
        if y < ANKLE_CUT: return PI['foot_' + side]
        if y < J['knee_' + side][1]: return PI['shin_' + side]
        return PI['thigh_' + side]
    return PI['pelvis'] if y < J['waist'][1] else PI['spine']


def clean(F, lab, P):
    """Each part keeps its largest connected piece; smaller pieces join the neighbouring part most of their edges touch."""
    edge = {}
    for i, f in enumerate(F):
        for a, b in ((f[0], f[1]), (f[1], f[2]), (f[2], f[0])):
            edge.setdefault((min(a, b), max(a, b)), []).append(i)
    nb = [[] for _ in F]
    for ts in edge.values():
        for i in ts:
            for j in ts:
                if i != j: nb[i].append(j)
    moved = 0
    for _ in range(3):                         # teeth: a triangle two of whose neighbours agree on another part joins them
        new = lab[:]
        for i in range(len(F)):
            cnt = {}
            for j in nb[i]: cnt[lab[j]] = cnt.get(lab[j], 0) + 1
            for l, n in cnt.items():
                if l != lab[i] and n >= 2: new[i] = l
        moved += sum(1 for i in range(len(F)) if new[i] != lab[i]); lab[:] = new
    for _ in range(4):
        comp = [-1] * len(F); comps = []
        for i in range(len(F)):
            if comp[i] >= 0: continue
            st = [i]; comp[i] = len(comps); grp = []
            while st:
                j = st.pop(); grp.append(j)
                for k in nb[j]:
                    if comp[k] < 0 and lab[k] == lab[i]:
                        comp[k] = comp[i]; st.append(k)
            comps.append(grp)
        big = {}
        for ci, g in enumerate(comps):
            l = lab[g[0]]
            if l not in big or len(g) > len(comps[big[l]]): big[l] = ci
        changed = 0
        for ci, g in enumerate(comps):
            if big[lab[g[0]]] == ci: continue
            votes = {}
            for j in g:
                for k in nb[j]:
                    if comp[k] != ci: votes[lab[k]] = votes.get(lab[k], 0) + 1
            if votes:
                new = max(votes, key=votes.get)
                for j in g: lab[j] = new
                changed += len(g)
        moved += changed
        if not changed: break
    return moved


def icosphere(r, sub_n=1):
    t = (1 + 5 ** 0.5) / 2
    V = [norm(v) for v in [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t), (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]]
    Fs = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8),
          (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)]
    for _ in range(sub_n):
        mid, nf = {}, []
        def m(a, b):
            k = (min(a, b), max(a, b))
            if k not in mid: mid[k] = len(V); V.append(norm(mul(add(V[a], V[b]), 0.5)))
            return mid[k]
        for a, b, c in Fs:
            ab, bc, ca = m(a, b), m(b, c), m(c, a); nf += [(a, ab, ca), (b, bc, ab), (c, ca, bc), (ab, bc, ca)]
        Fs = nf
    return [mul(v, r) for v in V], list(V), Fs


def build_part(P, N, F, tris, pivot):
    """The part's own scan surface: vertices (relative to its pivot), normals, faces, and its OPEN vertices (world: the rims
    of its cuts and of the patches where an arm lay against her)."""
    # flaps first: a triangle of the part with two or more edges no other triangle of the part shares is a tooth of the
    # cut's ragged rim (the liner under it is the surface there); twice, for the teeth behind the teeth
    for _ in range(2):
        cnt = {}
        for i in tris:
            f = F[i]
            for a, b in ((f[0], f[1]), (f[1], f[2]), (f[2], f[0])):
                k = (min(a, b), max(a, b)); cnt[k] = cnt.get(k, 0) + 1
        tris = [i for i in tris if sum(1 for a, b in ((F[i][0], F[i][1]), (F[i][1], F[i][2]), (F[i][2], F[i][0])) if cnt[(min(a, b), max(a, b))] == 1) < 2]
    vmap, Pv, Nv, Fo = {}, [], [], []
    for i in tris:
        g = []
        for v in F[i]:
            if v not in vmap:
                vmap[v] = len(Pv); Pv.append(sub(P[v], pivot)); Nv.append(N[v])
            g.append(vmap[v])
        Fo.append(tuple(g))
    und = {}
    for f in Fo:
        for a, b in ((f[0], f[1]), (f[1], f[2]), (f[2], f[0])):
            k = (min(a, b), max(a, b)); und[k] = und.get(k, 0) + 1
    rim = {v for k, n in und.items() if n == 1 for v in k}
    return Pv, Nv, Fo, [add(Pv[v], pivot) for v in rim]


# ---------------------------------------------------------------- the liner: what is under the scan where it is cut

def solid(P, F, h):
    """Her volume on a grid of h-metre cells: the scan's surface rasterised (its shell), the outside flooded in from the
    grid's corner; the rest is inside (the decimated scan has pinholes; one smaller than a cell does not leak)."""
    lo = [min(p[j] for p in P) - 2 * h for j in range(3)]; hi = [max(p[j] for p in P) + 2 * h for j in range(3)]
    n = [int(math.ceil((hi[j] - lo[j]) / h)) + 1 for j in range(3)]
    idx = lambda i, j, k: (i * n[1] + j) * n[2] + k
    shell = shell_of(P, F, h, lo, n)
    out = bytearray(len(shell)); st = [idx(0, 0, 0)]; out[st[0]] = 1
    while st:
        c0 = st.pop(); k = c0 % n[2]; j = (c0 // n[2]) % n[1]; i = c0 // (n[1] * n[2])
        for di, dj, dk in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)):
            a_, b_, c_ = i + di, j + dj, k + dk
            if 0 <= a_ < n[0] and 0 <= b_ < n[1] and 0 <= c_ < n[2]:
                q = idx(a_, b_, c_)
                if not out[q] and not shell[q]:
                    out[q] = 1; st.append(q)
    return lo, n, out


def shell_of(P, F, h, lo, n):
    """The cells the scan's surface passes through."""
    idx = lambda i, j, k: (i * n[1] + j) * n[2] + k
    shell = bytearray(n[0] * n[1] * n[2])
    for f in F:
        a, b, c = P[f[0]], P[f[1]], P[f[2]]
        L = max(math.dist(a, b), math.dist(b, c), math.dist(c, a))
        m = max(1, int(L / (h * 0.4)) + 1)
        for u in range(m + 1):
            for v in range(m + 1 - u):
                w = m - u - v
                q = [(a[j] * u + b[j] * v + c[j] * w) / m for j in range(3)]
                shell[idx(*[int((q[j] - lo[j]) / h) for j in range(3)])] = 1
    return shell


def liners(P, F, lab, J, R, crotch, opens):
    """Per part, a smooth closed surface of its share of her volume (the cells the scan passes through labelled by its
    triangles, the inside ones by the same rule), shrunk LINER_IN inside the scan and kept only within LINER_NEAR of the
    part's open vertices: under a cut, or under her side where an arm lay, there is a surface to see and never a hole."""
    h = LINER_CELL
    lo, n, out = solid(P, F, h)
    N2 = n[1] * n[2]
    lab_c = {}
    # only the cells wholly inside her (not the ones the scan passes through), labelled by the rule the scan's triangles were:
    # the liner's faces are then under the scan, never through it
    sh = shell_of(P, F, h, lo, n)
    for c0 in range(len(out)):
        if out[c0] or sh[c0]: continue
        k = c0 % n[2]; j = (c0 // n[2]) % n[1]; i = c0 // N2
        lab_c[c0] = classify((lo[0] + (i + 0.5) * h, lo[1] + (j + 0.5) * h, lo[2] + (k + 0.5) * h), J, R, crotch)
    res = {}
    for part in range(len(PARTS)):
        near = {}
        for q in opens[part]:
            near.setdefault(tuple(int(q[j] // LINER_NEAR) for j in range(3)), []).append(q)
        def close(p):
            b = tuple(int(p[j] // LINER_NEAR) for j in range(3))
            for di in (-1, 0, 1):
                for dj in (-1, 0, 1):
                    for dk in (-1, 0, 1):
                        for q in near.get((b[0] + di, b[1] + dj, b[2] + dk), ()):
                            if math.dist(p, q) < LINER_NEAR: return True
            return False
        # the cuberille: a quad on every face between one of the part's cells and a cell that is not
        corner, V, Q = {}, [], []
        def cv(g):
            key = tuple(g)
            if key not in corner:
                corner[key] = len(V); V.append([lo[0] + g[0] * h, lo[1] + g[1] * h, lo[2] + g[2] * h])
            return corner[key]
        for c0, l in lab_c.items():
            if l != part: continue
            k = c0 % n[2]; j = (c0 // n[2]) % n[1]; i = c0 // N2
            for ax, sg in ((0, 1), (0, -1), (1, 1), (1, -1), (2, 1), (2, -1)):
                d = [0, 0, 0]; d[ax] = sg
                nb = ((i + d[0]) * n[1] + (j + d[1])) * n[2] + (k + d[2])
                if lab_c.get(nb) == part: continue
                f0 = [i, j, k]
                if sg > 0: f0[ax] += 1
                u, v = (ax + 1) % 3, (ax + 2) % 3
                cs = []
                for du, dv in ((0, 0), (1, 0), (1, 1), (0, 1)):
                    g = f0[:]; g[u] += du; g[v] += dv; cs.append(cv(g))
                Q.append(cs if sg > 0 else cs[::-1])     # wound to face out of the part's cell
        if not Q or not near:
            res[part] = ([], [], []); continue
        # Taubin smoothing (it does not shrink the surface by itself), the normals, then in along them
        nbs = [set() for _ in V]
        for q in Q:
            for t in range(4):
                nbs[q[t]].add(q[(t + 1) % 4]); nbs[q[t]].add(q[(t + 3) % 4])
        for it in range(LINER_SMOOTH * 2):
            lam = 0.6 if it % 2 == 0 else -0.62
            W = []
            for vi, s_ in enumerate(nbs):
                m = [sum(V[o][a] for o in s_) / len(s_) for a in range(3)]
                W.append([V[vi][a] + lam * (m[a] - V[vi][a]) for a in range(3)])
            V = W
        T = [(q[0], q[1], q[2]) for q in Q] + [(q[0], q[2], q[3]) for q in Q]
        Nn = [[0.0, 0.0, 0.0] for _ in V]
        for a, b, c in T:
            nn = cross(sub(V[b], V[a]), sub(V[c], V[a]))
            for vv in (a, b, c):
                Nn[vv][0] += nn[0]; Nn[vv][1] += nn[1]; Nn[vv][2] += nn[2]
        Nn = [norm(x) for x in Nn]
        V = [tuple(V[i][a] - Nn[i][a] * LINER_IN for a in range(3)) for i in range(len(V))]
        keep = [t for t in T if close(mul(add(add(V[t[0]], V[t[1]]), V[t[2]]), 1 / 3))]
        used = sorted({v for t in keep for v in t}); rm = {v: i for i, v in enumerate(used)}
        res[part] = ([V[v] for v in used], [tuple(Nn[v]) for v in used], [(rm[a], rm[b], rm[c]) for a, b, c in keep])
    return res


def write_glb(path, parts, meta):
    pad = lambda b, ch=b'\0': b + ch * ((4 - len(b) % 4) % 4)
    binb, views, accs, meshes, nodes = b'', [], [], [], []
    for k, pt in enumerate(parts):
        P, N, F = pt['P'], pt['N'], pt['F']
        prim = {}
        for name, data, fmt, typ, tgt in (('POSITION', P, '<3f', 'VEC3', 34962), ('NORMAL', N, '<3f', 'VEC3', 34962), ('idx', F, '<3H', 'SCALAR', 34963)):
            b = pad(b''.join(struct.pack(fmt, *x) for x in data))
            views.append({'buffer': 0, 'byteOffset': len(binb), 'byteLength': len(b), 'target': tgt}); binb += b
            a = {'bufferView': len(views) - 1, 'componentType': 5123 if name == 'idx' else 5126, 'count': len(data) * (3 if name == 'idx' else 1), 'type': typ}
            if name == 'POSITION':
                a['min'] = [min(p[j] for p in P) for j in range(3)]; a['max'] = [max(p[j] for p in P) for j in range(3)]
            accs.append(a); prim[name] = len(accs) - 1
        meshes.append({'name': pt['name'], 'primitives': [{'attributes': {'POSITION': prim['POSITION'], 'NORMAL': prim['NORMAL']}, 'indices': prim['idx'], 'material': 0}]})
        node = {'name': pt['name'], 'mesh': k, 'translation': list(pt['t'])}
        kids = [j for j, q in enumerate(parts) if q['parent'] == pt['name']]
        if kids: node['children'] = kids
        nodes.append(node)
    gl = {'asset': {'version': '2.0', 'generator': 'tools/mannequin-rig.py', 'extras': meta},
          'scene': 0, 'scenes': [{'nodes': [len(parts)]}],
          'nodes': nodes + [{'name': 'mannequin-rig', 'children': [0]}],
          'meshes': meshes,
          'materials': [{'name': 'mannequin', 'pbrMetallicRoughness': {'baseColorFactor': [0.82, 0.8, 0.78, 1], 'metallicFactor': 0, 'roughnessFactor': 0.65}}],
          'buffers': [{'byteLength': len(binb)}], 'bufferViews': views, 'accessors': accs}
    js = pad(json.dumps(gl, separators=(',', ':')).encode(), b' ')
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binb))
    out += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(binb), 0x004E4942) + binb
    open(path, 'wb').write(out)
    return len(out)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    report = '--report' in sys.argv
    P, N, F, extras = read_glb(src)
    J, R, crotch = measure(P, F, report)
    lab = [classify(mul(add(add(P[a], P[b]), P[c]), 1 / 3), J, R, crotch) for a, b, c in F]
    moved = clean(F, lab, P)
    built = [build_part(P, N, F, [i for i, l in enumerate(lab) if l == k], J[PARTS[k][2]]) for k in range(len(PARTS))]
    # the scan's own pinholes (edges open before any cut) need no liner: only the rims the cut made
    und = {}
    for f in F:
        for a, b in ((f[0], f[1]), (f[1], f[2]), (f[2], f[0])):
            k = (min(a, b), max(a, b)); und[k] = und.get(k, 0) + 1
    pin = {P[v] for k, n in und.items() if n != 2 for v in k}
    lin = liners(P, F, lab, J, R, crotch, [[q for q in b[3] if q not in pin] for b in built])
    parts, total, lin_n, balls = [], 0, 0, {}
    for k, (name, parent, joint) in enumerate(PARTS):
        piv = J[joint]
        Pv, Nv, Fo, _ = built[k]
        ns = len(Fo)
        lp, ln, lf = lin[k]
        o = len(Pv); Pv += [sub(q, piv) for q in lp]; Nv += ln; Fo += [(a + o, b + o, c + o) for a, b, c in lf]
        lin_n += len(lf)
        if parent and joint not in ('waist',):        # the joint ball (the waist's section is too wide for one)
            # inside her at rest: never past the nearest point of this part's surface or its parent's
            near = [q for i in range(len(F)) if lab[i] in (k, PI[parent]) for q in (P[v] for v in F[i])]
            jr = min(BALL_K * R[joint], 0.92 * min(math.sqrt(dot(sub(q, piv), sub(q, piv))) for q in near))
            balls[joint] = jr
            bp, bn, bf = icosphere(jr, 1)
            o = len(Pv); Pv += bp; Nv += bn; Fo += [(a + o, b + o, c + o) for a, b, c in bf]
        ppiv = J[PARTS[PI[parent]][2]] if parent else (0.0, 0.0, 0.0)
        parts.append({'name': name, 'parent': parent, 't': sub(piv, ppiv), 'P': Pv, 'N': Nv, 'F': Fo})
        total += len(Fo)
        if report:
            print(f'{name:11s} joint {joint:11s} ({piv[0]:+.3f}, {piv[1]:.3f}, {piv[2]:+.3f})  {ns:5d} triangles of scan + {len(lf):4d} of liner' + (f' + a {balls[joint] * 100:.1f} cm ball' if joint in balls else ''))
    meta = {'source': extras.get('source', 'standing-woman.stl'), 'from': src.replace('\\', '/'), 'frame': 'metres, Y up, feet at y 0, facing +Z; her left is +X',
            'height': extras.get('height', 1.65), 'joints': {k: [round(v, 4) for v in J[k]] for k in sorted(J)}, 'crotch': round(crotch, 4), 'balls': {k: round(v, 4) for k, v in balls.items()},
            'parts': [p[0] for p in PARTS]}
    size = write_glb(dst, parts, meta)
    print(f'{src}: {len(F)} triangles -> {dst}: {len(PARTS)} parts, {total} triangles ({lin_n} of them liner, {moved} triangles tidied), {size} bytes')


if __name__ == '__main__':
    main()
