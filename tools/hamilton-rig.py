#!/usr/bin/env python3
"""assets/hamilton-rig.json from the ETC Hamilton Programming Project's patch.

    python -E tools/hamilton-rig.py <THPP Scene dir> assets/hamilton-rig.json

<Scene dir> is `Scene/` inside the show file's `working.a3d` (Patch.json,
Fixture.json, Primitive.json).  If the pack's `Resources/` folder sits beside
it, the set's COLLADA is read too, for two numbers it can confirm (below); it
is optional.  Standard library only.  The pack is ETC's, NON-COMMERCIAL (see
assets/README.md); it is not in this repository and must not be copied in.

One record per PHYSICAL lighting unit, in the frame of assets/hamilton-set.glb
exactly as GLTFLoader loads it, plus six units the pack does not patch
(three followspots, three hazers) placed by hand.

THE FRAME (ETC world -> GLB)
----------------------------
ETC's world is Z-up: x across the stage (+x stage left, as on the plot, with
the house at the bottom of the page), y depth (+y UPSTAGE: the FOH truss is
at y -17.8, the back-wall footlights at y 7.55), z height.  Primitive.json
places the "Hamilton Full Set" model at P = (0, 0.1354, -0.2651) with scale
0.001 (the model is in mm) and no rotation, so ETC = P + 0.001 * L for a
model-local point L (Z-up, mm).

The set's DAE (Y-up, written by Augment3d through Assimp) holds the same
model as D = (Lx, Lz, -Ly) in mm, under a node matrix of scale 0.001 and a
translation t = +3.8246 m along z.  Proof of the -Ly: the DAE's raw z runs
-9430.95 .. 1781.84 and Primitive.json's local_bounds y runs 1781.84 ..
9430.95 (centre 3824.555 mm, size 11212.79) - the same span, negated - and t
is that centre, i.e. Assimp re-centred the depth.  tools/blender/hamilton_set
.py then maps DAE (x,y,z) -> Blender (x,-z,y) -> glTF (x,y,z), i.e. the GLB is
the DAE in metres, untouched.  So, with the mm scales cancelling:

    GLB.x =  ETC.x
    GLB.y =  ETC.z - P.z            = ETC.z + 0.2651
    GLB.z = -(ETC.y - P.y) + t      = 3.9600 - ETC.y

a proper rotation (-90 deg about x; det +1) plus an offset.  In the GLB,
upstage is -z and the house is +z (the game's own convention - p5i seats the
file with no turn).  Checks this script prints: the pack's turntable
primitive (ETC y 2.96) lands at GLB z 1.00, where hamilton_set.py's ring
search found the revolve centre (+0.95); the proscenium's front face (DAE
grey 34) is at GLB z 3.79, i.e. ETC y 0.17; the back-wall footlights land
0.4 m downstage of the set's inner brick back wall (GLB z -4.0).

The x sign is the one thing the bounds cannot prove (the set is nearly
symmetric).  Two weak geometric tests agree with +x = +x (the pack's own
'wall' blocker boxes hold set geometry 26:12 that way; the "LED Column up"
units stand nearer the timber posts that way, 17:13 within 0.6 m), and it is
what a proper Z-up -> Y-up conversion gives.

THE DECK.  The pack's set floor slab is 0.229 m thick (DAE grey 221, faces at
y 0 and 0.229); hamilton_set.py drops it, so the GLB's lowest point (y 0, the
slab's underside, where the walls stand) is what the game seats on its deck.
The pack's floor units stand at ETC z -0.26 .. -0.18 = GLB y 0.007 .. 0.085,
i.e. on that underside, not on the slab top (the pack's people stand at
ETC z -0.05 = GLB 0.215).  Every deck-level floor unit is put at y 0.000.

WHAT ETC's world.pos IS
-----------------------
The fixture's own origin.  Movers: the hang point (the bounding box hangs
0.35 / 0.43 / 0.25 m below it for the Viper / VL3500 / X4 - exactly half
their heights).  Conventionals: the pack's generic body is centred on it, and
on the electrics it sits at the pipe height the movers hang from (8.547), so
it is the hang point too.  Floor units: the base (the box sits 0.06 m above).
The models' origins are the same points (assets/fixtures/README.md: hang
point for hung units, floor under the base for floor units), so `pos` is the
ETC origin mapped, with two corrections: hung units on an electric whose
origin sits up to 0.6 m under that electric's pipe (the Lustrs, at 8.05 ..
8.49) are raised onto the pipe, and deck-level floor units go to y 0.

ORIENTATION
-----------
ETC's rest pose (identity) for every unit is HUNG: origin at the top, body
below, beam straight down its local -z (a mover with eulers (0,0,-180) is a
pure turn and its beam is straight down; floor units carry a 180 deg y-turn
that stands them up, beam up).  Its quaternion is (w,x,y,z) and turns
coordinates the usual way, v' = q v q*: confirmed against world.eulers (this
script prints the Euler order that reproduces every beam) and by the beams
themselves - FOH units point upstage, the booms point on stage, the
electrics point down.  ETC beam in the GLB = C(q_etc * (0,0,-1)), C being the
frame map above.

The models' rest pose is different: Y-up, the beam (lens local -Z) is
HORIZONTAL for most of them (+Z), +X for birdie / hazer / s4-lustr / vl3500,
straight up for mini-10 and straight down for colorsource-par - this script
reads it from each GLB's `lens` node.  So a unit's quaternion cannot be ETC's
own turned through C; it is built from the beam:

  * conventionals and floor units:  quat = Ry(pan) * Rx(tilt) * R0, the one
    rotation with no roll that takes the model's rest beam onto ETC's beam
    (R0 is a quarter turn about Y for the +X-beam models, else identity).
    Applied whole, the beam is right but the clamp tilts with the body (a
    unit pointing straight down lies on its side).  To keep the clamp on the
    pipe, split it - the quaternion is exactly three.js Euler order 'YXZ':
    root.rotation.y = pan, head.rotation.x = tilt (for the +X-beam models:
    root.rotation.y = pan - 90 deg, head.rotation.z = -tilt).
  * movers (mac-viper, vl3500, glp-x4): quat = Ry(pan) * R0 only - they hang
    head-down from the pipe as modelled.  `beam` is then where the lens
    points in the model's rest pose (horizontal).  ETC's home for a mover is
    straight down: head.rotation.x = +90 deg (Viper, X4) or head.rotation.z =
    -90 deg (VL3500) gives it.  Pan maps ETC's local -y onto the model's +Z.

`beam` in the JSON is always quat applied to the model's rest lens direction,
so `new Vector3(...rest).applyQuaternion(quat)` reproduces it.

THE BATTENS
-----------
"Chroma Q Color Force II 12" entries are one-foot cells.  Cells in a straight
run - same depth, height and orientation, along x, 0.14 .. 0.17 m apart - are
one batten (12 cells = 6 ft, 8 cells = 4 ft); a gap over 0.2 m starts the
next batten, and cells at one spot (a "Part 2" duplicate) fold together.  The
pack labels the lowest channel of each run ("LED Wall ups"), which confirms
the split.  Model by measured length: >= 1.5 m colorblaze-72, else
colorblaze-48 (so a lone one-foot cell is drawn as a 4 ft batten - there is
no one-foot model).
"""
import collections
import glob
import json
import math
import os
import re
import struct
import sys
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)

SOURCE = ("ETC Eos Family Augment3d: The Hamilton Programming Project – Intro – Rev A, "
          "Scene/Patch.json (non-commercial, see assets/README.md)")

# fixture type name in Fixture.json -> model key; None = not a light
TYPES = {
    'Custom Mac Viper Performance hamilton  main': 'mac-viper',
    'Martin Mac Viper Performance Hamilton 91-100': 'mac-viper',
    'Custom VL3500 Wash FX HAMILTON': 'vl3500',
    'GLP Impression X4 XL High Res': 'glp-x4',
    'Custom S4 LED S2 Lustr Direct HAMILTON': 's4-lustr',
    'ETC Fixtures ColorSource PAR DB 5ch': 'colorsource-par',
    'Chroma Q Color Force II 12 RGBA x4 Off': 'colorblaze',      # resolved to -48 / -72 per batten
    'Generic Dimmer': 'source-four',                               # s4-par if its label says PAR
    'Custom PAR 64': 'par64',
    'Custom S4 PAR': 's4-par',
    'Custom Dimmer mini 10': 'mini-10',
    'Custom Dimmer birdie': 'birdie',
    'Philips Color Kinetics ColorBlast 12 TR': 'colorblast',
    'ETC Fixtures Scenic Element': None,
    'ETC Fixtures Scenic Element Movable': None,
}
FLOOR = {'colorblast', 'colorblaze-48', 'colorblaze-72', 'lycian', 'hazer', 'mini-10'}
MOVERS = {'mac-viper', 'vl3500', 'glp-x4'}
CELL = 0.32                 # a Color Force cell's length (Fixture.json layout.cell_size.x)
BATTEN_GAP = 0.20           # cells further apart than this are different battens
LONG = 1.5                  # a batten at least this long is a 72, else a 48
PIPE_SNAP = 0.6             # hung units up to this far under their electric's pipe go onto it
ARCH_Z_MEASURED = 3.792     # GLB z of the proscenium's front face (DAE grey 34), if the DAE is absent
DAE_T_MEASURED = 3.8245561  # the DAE node's z translation, if the DAE is absent
MIDTOWN_SCALE = 0.62        # midtown.html scales the set (and the rig under it) by this


# ---------------------------------------------------------------- quaternions, [x, y, z, w]
def qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return [aw*bx + ax*bw + ay*bz - az*by, aw*by - ax*bz + ay*bw + az*bx,
            aw*bz + ax*by - ay*bx + az*bw, aw*bw - ax*bx - ay*by - az*bz]


def qrot(q, v):
    x, y, z, w = q
    p = qmul(qmul(q, [v[0], v[1], v[2], 0.0]), [-x, -y, -z, w])
    return p[:3]


def qaxis(axis, ang):
    s = math.sin(ang / 2)
    return [axis[0]*s, axis[1]*s, axis[2]*s, math.cos(ang / 2)]


def Rx(a):
    return qaxis((1, 0, 0), a)


def Ry(a):
    return qaxis((0, 1, 0), a)


def Rz(a):
    return qaxis((0, 0, 1), a)


def qnorm(q):
    n = math.sqrt(sum(c*c for c in q))
    q = [c / n for c in q]
    return q if q[3] >= 0 else [-c for c in q]       # one hemisphere, so files diff cleanly


def unit(v):
    n = math.sqrt(sum(c*c for c in v))
    return [c / n for c in v]


def etc_rot(q, v):
    """turn v by an ETC quaternion {w,x,y,z}"""
    return qrot([q['x'], q['y'], q['z'], q['w']], v)


def wrap(a):
    while a > math.pi:
        a -= 2*math.pi
    while a <= -math.pi:
        a += 2*math.pi
    return a


# ---------------------------------------------------------------- the frame
class Frame:
    """ETC world (Z-up, metres) -> assets/hamilton-set.glb (Y-up, metres)"""

    def __init__(self, P, t):
        self.P, self.t = P, t

    def pos(self, p):
        return [p[0] - self.P[0], p[2] - self.P[2], -(p[1] - self.P[1]) + self.t]

    @staticmethod
    def dir(v):
        return [v[0], v[2], -v[1]]

    def etc_y(self, glb_z):
        return self.P[1] + self.t - glb_z


# ---------------------------------------------------------------- GLB reading
def glb_json(path):
    b = open(path, 'rb').read()
    n = struct.unpack('<I', b[12:16])[0]
    return json.loads(b[20:20+n]), b, 20 + n + 8


def model_rest(path):
    """the lens node's -Z in the model's rest pose, and the model's bounding box"""
    j, _, _ = glb_json(path)
    nodes = j['nodes']
    parent = {c: i for i, nd in enumerate(nodes) for c in nd.get('children', [])}

    def world(i):
        chain = []
        while i is not None:
            chain.append(i)
            i = parent.get(i)
        q, t = [0, 0, 0, 1], [0, 0, 0]
        for k in reversed(chain):
            nd = nodes[k]
            rt = qrot(q, nd.get('translation', [0, 0, 0]))
            t = [t[m] + rt[m] for m in range(3)]
            q = qmul(q, list(nd.get('rotation', [0, 0, 0, 1])))
        return t, q
    beam, mn, mx = None, [1e9]*3, [-1e9]*3
    for i, nd in enumerate(nodes):
        t, q = world(i)
        if nd.get('name') == 'lens':
            beam = unit(qrot(q, [0, 0, -1]))
        if 'mesh' in nd:
            for p in j['meshes'][nd['mesh']]['primitives']:
                a = j['accessors'][p['attributes']['POSITION']]
                for c in range(8):
                    v = qrot(q, [a['max'][k] if (c >> k) & 1 else a['min'][k] for k in range(3)])
                    v = [v[k] + t[k] for k in range(3)]
                    mn = [min(mn[k], v[k]) for k in range(3)]
                    mx = [max(mx[k], v[k]) for k in range(3)]
    if beam is None:
        raise SystemExit('%s has no lens node' % path)
    return [round(c) if abs(c - round(c)) < 1e-3 else c for c in beam], mn, mx


def set_geometry(path):
    """the set GLB's bounding box, and its big walls facing +-z (m2 per 5 cm of depth)"""
    j, b, bin0 = glb_json(path)
    mn, mx = [1e9]*3, [-1e9]*3
    walls = collections.Counter()

    def acc(i):
        a = j['accessors'][i]
        bv = j['bufferViews'][a['bufferView']]
        off = bin0 + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        comp = {5126: 'f', 5125: 'I', 5123: 'H', 5121: 'B'}[a['componentType']]
        k = {'SCALAR': 1, 'VEC3': 3}[a['type']]
        st = bv.get('byteStride', struct.calcsize(comp) * k)
        return [struct.unpack_from('<' + comp*k, b, off + e*st) for e in range(a['count'])]
    for m in j['meshes']:
        for p in m['primitives']:
            a = j['accessors'][p['attributes']['POSITION']]
            mn = [min(mn[k], a['min'][k]) for k in range(3)]
            mx = [max(mx[k], a['max'][k]) for k in range(3)]
            if m['name'] != 'ham_brick':
                continue
            V = acc(p['attributes']['POSITION'])
            I = [x[0] for x in acc(p['indices'])]
            for t in range(0, len(I), 3):
                A, B, Cc = V[I[t]], V[I[t+1]], V[I[t+2]]
                u = [B[k]-A[k] for k in range(3)]
                v = [Cc[k]-A[k] for k in range(3)]
                n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]]
                L = math.sqrt(sum(c*c for c in n))
                if L > 1e-9 and abs(n[2]) > 0.9*L:
                    walls[round((A[2]+B[2]+Cc[2])/3 * 20) / 20] += L/2
    return mn, mx, walls


def dae_numbers(scene_dir):
    """(node z translation, proscenium front z in metres) from the set's DAE, if it is there"""
    hits = glob.glob(os.path.join(scene_dir, '..', 'Resources', 'Hamilton Full Set*.dae'))
    if not hits:
        return None
    NS = {'c': 'http://www.collada.org/2005/11/COLLADASchema'}
    root = ET.parse(hits[0]).getroot()
    node = root.find('.//c:library_visual_scenes//c:node', NS)
    M = [float(v) for v in node.find('c:matrix', NS).text.split()]
    bind = {}
    for ig in root.findall('.//c:instance_geometry', NS):
        for im in ig.findall('.//c:instance_material', NS):
            bind[(ig.get('url').lstrip('#'), im.get('symbol'))] = im.get('target')
    zmax = -1e18
    for g in root.findall('.//c:library_geometries/c:geometry', NS):
        mesh = g.find('c:mesh', NS)
        mats = [bind.get((g.get('id'), pr.get('material')), pr.get('material') or '')
                for pr in mesh if pr.tag.endswith(('triangles', 'polylist'))]
        if not any(re.search(r'\b34\b|___34__', m or '') for m in mats):
            continue
        ps = mesh.find('c:vertices', NS).find("c:input[@semantic='POSITION']", NS).get('source').lstrip('#')
        for s in mesh.findall('c:source', NS):
            if s.get('id') == ps:
                a = [float(v) for v in s.find('c:float_array', NS).text.split()]
                zmax = max(zmax, max(M[8]*a[i] + M[9]*a[i+1] + M[10]*a[i+2] + M[11] for i in range(0, len(a), 3)))
    return M[11], (zmax if zmax > -1e17 else None)


# ---------------------------------------------------------------- aiming
def aim(b, d, fallback_pan):
    """quat = Ry(pan) Rx(tilt) R0 taking the model's rest beam b onto d, no roll"""
    R0 = [0, 0, 0, 1]
    if abs(b[0]) > 0.9:
        R0 = Ry(-math.pi/2 if b[0] > 0 else math.pi/2)        # +X -> +Z
        b = qrot(R0, b)
    by, bz = b[1], b[2]
    R = math.hypot(by, bz)
    phi = math.atan2(bz, by)
    c = max(-1.0, min(1.0, d[1] / R))
    cands = [wrap(math.acos(c) - phi), wrap(-math.acos(c) - phi)]
    tilt = min(cands, key=abs)
    v = qrot(Rx(tilt), b)
    if math.hypot(d[0], d[2]) < 1e-6 or math.hypot(v[0], v[2]) < 1e-6:
        pan = fallback_pan
    else:
        pan = math.atan2(d[0], d[2]) - math.atan2(v[0], v[2])
    return qnorm(qmul(Ry(pan), qmul(Rx(tilt), R0)))


def model_x_pan(q_etc):
    """pan that lays the model's X along ETC's local x (used when the beam is vertical)"""
    ax = Frame.dir(etc_rot(q_etc, [1, 0, 0]))
    return math.atan2(-ax[2], ax[0])


def mover_quat(b, q_etc):
    R0 = [0, 0, 0, 1]
    if abs(b[0]) > 0.9:
        R0 = Ry(-math.pi/2 if b[0] > 0 else math.pi/2)
    face = Frame.dir(etc_rot(q_etc, [0, -1, 0]))
    return qnorm(qmul(Ry(math.atan2(face[0], face[2])), R0))


# ---------------------------------------------------------------- the patch
def channel_of(o):
    s = o['console_data']
    return int(s) if re.fullmatch(r'\d+', s) else float(s)


GEL = re.compile(r'^(?:Gel_)?([RLGrlg]\d+)$')


def gel_of(tags):
    plain = [t for t in tags if re.fullmatch(r'[RLGrlg]\d+', t)]
    pref = [GEL.match(t).group(1) for t in tags if GEL.match(t)]
    g = plain[0] if plain else (pref[0] if pref else None)
    return g.upper() if g else None


def euler_check(items):
    """which Euler order rebuilds ETC's beam from world.eulers - reported, not used"""
    best = []
    for order in ('XYZ', 'XZY', 'YXZ', 'YZX', 'ZXY', 'ZYX'):
        worst = 0.0
        for o in items:
            e = o['world']['eulers']
            q = [0, 0, 0, 1]
            for ax in order:                       # q = R_first * R_second * R_third (intrinsic order)
                q = qmul(q, {'X': Rx, 'Y': Ry, 'Z': Rz}[ax](math.radians(e[ax.lower()])))
            a = qrot(q, [0, 0, -1])
            bq = etc_rot(o['world']['quat'], [0, 0, -1])
            worst = max(worst, math.sqrt(sum((a[k]-bq[k])**2 for k in range(3))))
        best.append((worst, order))
    best.sort()
    return best


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__.split('\n\n')[1])
    scene, out = sys.argv[1], sys.argv[2]
    patch = json.load(open(os.path.join(scene, 'Patch.json'), encoding='utf-8'))['items']
    ftypes = {it['obj']['uid']: it['obj'] for it in json.load(open(os.path.join(scene, 'Fixture.json'), encoding='utf-8'))['items']}
    prims = json.load(open(os.path.join(scene, 'Primitive.json'), encoding='utf-8'))['items']
    setp = [it['obj'] for it in prims if it['obj']['name'] == 'Hamilton Full Set']
    assert len(setp) == 1, 'no single "Hamilton Full Set" in Primitive.json'
    setp = setp[0]
    w = setp['world']
    assert abs(w['quat']['w']) > 0.999999, 'the set primitive is turned: %r' % w['quat']
    assert all(abs(w['scale'][k] - 0.001) < 1e-6 for k in 'xyz'), 'the set primitive is not mm: %r' % w['scale']
    P = [w['pos']['x'], w['pos']['y'], w['pos']['z']]
    t_bounds = setp['local_bounds']['center']['y'] * 0.001
    dae = dae_numbers(scene)
    if dae:
        t, arch_z = dae[0], (dae[1] if dae[1] is not None else ARCH_Z_MEASURED)
        print('DAE read: node z translation %.7f, proscenium front at GLB z %.3f' % (t, arch_z))
    else:
        t, arch_z = DAE_T_MEASURED, ARCH_Z_MEASURED
        print('DAE not beside the Scene dir: using the measured t %.7f and arch z %.3f' % (t, arch_z))
    assert abs(t - t_bounds) < 0.001, 'DAE translation %.4f != local_bounds centre %.4f' % (t, t_bounds)
    F = Frame(P, t)
    print('set primitive at ETC (%.4f, %.4f, %.4f), scale 0.001; depth re-centring t = %.4f '
          '(local_bounds centre y says %.4f)' % (P[0], P[1], P[2], t, t_bounds))
    print('ETC (x, y, z) -> GLB (x, z %+.4f, %.4f - y)' % (-P[2], P[1] + t))
    print('as a matrix [GLB x y z 1] = M [ETC x y z 1]:')
    for row in ([1, 0, 0, -P[0]], [0, 0, 1, -P[2]], [0, -1, 0, P[1] + t]):
        print('   [%5.1f %5.1f %5.1f %8.4f]' % tuple(row))

    # models
    rest = {}
    for key in sorted(set(v for v in TYPES.values() if v) - {'colorblaze'}
                      | {'colorblaze-48', 'colorblaze-72', 'lycian', 'hazer'}):
        path = os.path.join(REPO, 'assets', 'fixtures', key + '.glb')
        if not os.path.exists(path):
            raise SystemExit('missing model ' + path)
        rest[key] = model_rest(path)
    print('\nmodel rest beams (lens -Z, model frame):')
    for k, (b, mn, mx) in sorted(rest.items()):
        print('   %-16s beam %-18s y %.2f .. %.2f  %s' % (k, b, mn[1], mx[1], 'floor' if k in FLOOR else 'hung'))

    lights = [it['obj'] for it in patch if TYPES[ftypes[it['obj']['fixture_uid']]['name']]]
    scenic = [it['obj'] for it in patch if TYPES[ftypes[it['obj']['fixture_uid']]['name']] is None]
    unknown = {ftypes[it['obj']['fixture_uid']]['name'] for it in patch} - set(TYPES)
    assert not unknown, 'fixture types with no model: %r' % unknown
    eo = euler_check(lights)
    print('\nETC quaternion vs eulers: Euler order %s rebuilds every beam to %.1e (next best %s, %.2f)'
          % (eo[0][1], eo[0][0], eo[1][1], eo[1][0]))

    # ------------------------------------------------ group patch entries into physical units
    groups = []                                    # (type key, [entries])
    cells = []
    for o in lights:
        key = TYPES[ftypes[o['fixture_uid']]['name']]
        if key == 'colorblaze':
            cells.append(o)
            continue
        if key == 'source-four' and re.search(r'\bPAR\b', ' '.join(o['tags']), re.I):
            key = 's4-par'
        groups.append((key, [o]))
    # identical spots fold together (a "Part 2" at the same place is the same lamp)
    folded = 0
    merged = []
    for key, es in groups:
        o = es[0]
        for g in merged:
            p, r = g[1][0]['world']['pos'], o['world']['pos']
            if g[0] == key and all(abs(p[k] - r[k]) < 0.02 for k in 'xyz') and \
                    all(abs(g[1][0]['world']['eulers'][k] - o['world']['eulers'][k]) < 1 for k in 'xyz'):
                g[1].append(o)
                folded += 1
                break
        else:
            merged.append((key, [o]))
    groups = merged
    # battens
    lines = []
    for o in sorted(cells, key=lambda o: (o['world']['pos']['z'], o['world']['pos']['y'], o['world']['pos']['x'])):
        p, e = o['world']['pos'], o['world']['eulers']
        for ln in lines:
            q, f = ln[0]['world']['pos'], ln[0]['world']['eulers']
            if abs(p['y'] - q['y']) < 0.03 and abs(p['z'] - q['z']) < 0.03 and \
                    all(abs(wrap(math.radians(e[k] - f[k]))) < math.radians(1.5) for k in 'xyz'):
                ln.append(o)
                break
        else:
            lines.append([o])
    battens = []
    for ln in lines:
        ln.sort(key=lambda o: o['world']['pos']['x'])
        run = [ln[0]]
        for o in ln[1:]:
            if o['world']['pos']['x'] - run[-1]['world']['pos']['x'] > BATTEN_GAP:
                battens.append(run)
                run = [o]
            else:
                run.append(o)
        battens.append(run)
    tag_ok = sum(1 for bt in battens if [o for o in bt if o['tags'][0]] and
                 min(bt, key=channel_of)['tags'][0])
    tag_bad = [min(channel_of(o) for o in bt) for bt in battens if len(bt) > 1 and not min(bt, key=channel_of)['tags'][0]]
    for bt in battens:
        xs = sorted(set(round(o['world']['pos']['x'], 3) for o in bt))
        pitch = (xs[-1] - xs[0]) / (len(xs) - 1) if len(xs) > 1 else CELL
        length = (xs[-1] - xs[0]) + pitch
        key = 'colorblaze-72' if length >= LONG else 'colorblaze-48'
        groups.append((key, sorted(bt, key=channel_of), length))
    print('\nColor Force: %d cells -> %d battens (%d runs of 2+ cells, %d single cells); '
          '%d battens carry their label on their lowest channel; runs whose lowest channel is unlabelled: %s'
          % (len(cells), len(battens), sum(1 for b in battens if len(b) > 1), sum(1 for b in battens if len(b) == 1),
             tag_ok, tag_bad or 'none'))
    for bt in sorted(battens, key=lambda b: -len(b)):
        if len(bt) > 1:
            xs = [o['world']['pos']['x'] for o in bt]
            print('   run ch%-5s %2d cells  x %6.2f .. %6.2f  ETC y %5.2f z %5.2f  %-14r' % (
                min(channel_of(o) for o in bt), len(bt), min(xs), max(xs), bt[0]['world']['pos']['y'],
                bt[0]['world']['pos']['z'], [o['tags'][0] for o in bt if o['tags'][0]]))

    # ------------------------------------------------ units
    units = []
    for g in groups:
        key, es = g[0], g[1]
        o = es[0]
        chans = sorted(channel_of(e) for e in es)
        if key.startswith('colorblaze'):
            xs = [e['world']['pos']['x'] for e in es]
            p = [(min(xs) + max(xs)) / 2, o['world']['pos']['y'], o['world']['pos']['z']]
            lab = next((e for e in es if e['tags'][0]), min(es, key=channel_of))
        else:
            p = [o['world']['pos'][k] for k in 'xyz']
            lab = o
        q_etc = o['world']['quat']
        b = rest[key][0]
        d = unit(Frame.dir(etc_rot(q_etc, [0, 0, -1])))
        if key in MOVERS:
            q = mover_quat(b, q_etc)
        else:
            q = aim(b, d, model_x_pan(q_etc))
            got = qrot(q, b)
            assert max(abs(got[k] - d[k]) for k in range(3)) < 1e-6, (o['name'], got, d)
        units.append({
            'etc': p, 'key': key, 'chans': chans, 'q': q, 'beam': unit(qrot(q, b)), 'etc_beam': d,
            'label': lab['tags'][0] or lab['name'], 'gel': gel_of(lab['tags']),
            'tags': list(lab['tags']), 'name': min(es, key=channel_of)['name'],
            'length': g[2] if len(g) > 2 else None, 'n_entries': len(es),
        })

    # ------------------------------------------------ hanging positions (ETC coordinates)
    for u in units:
        u['position'] = None
    # over-stage electrics: hung units 7.5 m up, inside the cyc ladders (|x| 7.7), between the
    # arch's apron and the back wall; a pipe is a run of units less than 0.2 m apart in depth
    over = [u for u in units if u['key'] not in FLOOR and u['etc'][2] >= 7.5 and abs(u['etc'][0]) < 7.0
            and -4 < u['etc'][1] < 8.0]
    arch_y = F.etc_y(arch_z)
    clusters = []
    for u in sorted(over, key=lambda u: u['etc'][1]):
        if clusters and u['etc'][1] - clusters[-1][-1]['etc'][1] <= 0.2:
            clusters[-1].append(u)
        else:
            clusters.append([u])
    # a pipe of one or two units is a stray: it joins the nearest pipe in depth
    mean_y = lambda c: sum(u['etc'][1] for u in c) / len(c)
    while len(clusters) > 1 and min(len(c) for c in clusters) < 3:
        i = min(range(len(clusters)), key=lambda i: len(clusters[i]))
        c = clusters.pop(i)
        j = min(range(len(clusters)), key=lambda j: abs(mean_y(clusters[j]) - mean_y(c)))
        clusters[j] = sorted(clusters[j] + c, key=lambda u: u['etc'][1])
    n_apron =sum(1 for c in clusters if sum(u['etc'][1] for u in c) / len(c) < arch_y)
    ordn = lambda n: '%d%s' % (n, {1: 'st', 2: 'nd', 3: 'rd'}.get(n if n < 20 else n % 10, 'th'))
    k = 0
    for c in clusters:
        if sum(u['etc'][1] for u in c) / len(c) < arch_y:
            name = 'Apron Electric' if n_apron == 1 else 'Apron Electric %d' % (clusters.index(c) + 1)
        else:
            k += 1
            name = '%s Electric' % ordn(k)
        for u in c:
            u['position'] = name
    for u in units:
        x, y, z = u['etc']
        if u['position']:
            continue
        if y < -15:
            u['position'] = 'FOH Truss'
        elif -10 < y < -5 and z > 7:
            u['position'] = 'FOH Electric'
        elif u['key'] == 'birdie':
            u['position'] = 'Under the gallery'
        elif u['key'] in FLOOR and z < 0 and y < 0:
            u['position'] = 'Downstage lip'
        elif u['key'] in FLOOR and z < 0 and y > 7 and u['n_entries'] > 2:
            u['position'] = 'Back-wall foots'
        elif u['key'] in FLOOR and z < 0:
            u['position'] = 'Deck'
        elif u['key'] in FLOOR:
            u['position'] = 'On the set'
    side = [u for u in units if not u['position'] and u['key'] not in FLOOR and abs(u['etc'][0]) >= 5.5]
    for sgn, sname in ((1, 'SL'), (-1, 'SR')):
        cl = []
        for u in sorted((u for u in side if u['etc'][0] * sgn > 0), key=lambda u: u['etc'][1]):
            if cl and u['etc'][1] - cl[-1][-1]['etc'][1] <= 0.4:
                cl[-1].append(u)
            else:
                cl.append([u])
        for i, c in enumerate(cl):
            for u in c:
                u['position'] = '%s Boom %d' % (sname, i + 1)

    # ------------------------------------------------ GLB positions, with the two corrections
    snapped = []
    pipes = {}
    for u in units:
        if u['position'] and u['position'].endswith('Electric'):
            pipes[u['position']] = max(pipes.get(u['position'], -1e9), u['etc'][2])
    for u in units:
        x, y, z = u['etc']
        u['hung'] = u['key'] not in FLOOR
        if u['hung'] and u['position'] in pipes and 1e-4 < pipes[u['position']] - z <= PIPE_SNAP:
            snapped.append(pipes[u['position']] - z)
            z = pipes[u['position']]
        g = F.pos([x, y, z])
        u['deck_fix'] = None
        if not u['hung'] and u['etc'][2] < 0:
            u['deck_fix'] = g[1]
            g[1] = 0.0
        u['pos'] = g

    # ------------------------------------------------ six by hand
    tt_z = F.pos([0, 2.96, 0])[2]
    target = [0.0, 1.5, tt_z]                 # head height over the turntable centre
    fs_z = arch_z + 12.0 / MIDTOWN_SCALE      # 12 m from the arch once midtown.html scales the rig
    hand = []
    for i, x in enumerate((0.0, -4.0, 4.0)):
        p = [x, 4.0, fs_z]
        d = unit([target[k] - p[k] for k in range(3)])
        q = aim(rest['lycian'][0], d, 0.0)
        hand.append(('lycian', p, q, 'Followspot %d (%s)' % (i + 1, ('centre', 'house left', 'house right')[i]),
                     'Followspots (back of the house)'))
    for p, d, lab, pos in (([9.3, 0.0, tt_z], [-1, 0, 0], 'Hazer SL wing', 'SL wing'),
                           ([-9.3, 0.0, tt_z], [1, 0, 0], 'Hazer SR wing', 'SR wing'),
                           ([0.0, 0.0, -6.0], [0, 0, 1], 'Hazer upstage centre', 'Behind the set, upstage centre')):
        hand.append(('hazer', p, aim(rest['hazer'][0], d, 0.0), lab, pos))
    for key, p, q, lab, pos in hand:
        units.append({'etc': None, 'key': key, 'chans': [], 'q': q, 'beam': unit(qrot(q, rest[key][0])),
                      'label': lab, 'gel': None, 'tags': [], 'name': None, 'position': pos, 'hung': False,
                      'pos': p, 'deck_fix': None, 'hand': True, 'length': None})

    # ------------------------------------------------ write
    def r(v, n):
        v = round(v, n)
        return 0.0 if v == 0 else v

    def uid(u, i):
        if u.get('hand'):
            return '%s-%d' % (u['key'], sum(1 for w in units[:i] if w.get('hand') and w['key'] == u['key']) + 1)
        return 'ch%s' % u['chans'][0]
    recs = []
    for i, u in enumerate(units):
        recs.append(collections.OrderedDict([
            ('id', uid(u, i)),
            ('channels', u['chans']),
            ('label', u['label']),
            ('type', u['key']),
            ('model', 'assets/fixtures/%s.glb' % u['key']),
            ('hung', u['hung']),
            ('pos', [r(c, 3) for c in u['pos']]),
            ('quat', [r(c, 4) for c in u['q']]),
            ('beam', [r(c, 4) for c in u['beam']]),
            ('gel', u['gel']),
            ('tags', u['tags']),
            ('position', u['position']),
            ('placed', 'by hand' if u.get('hand') else 'patch'),
        ]))
    ids = [rc['id'] for rc in recs]
    dup = [i for i, c in collections.Counter(ids).items() if c > 1]
    assert not dup, 'duplicate ids %r' % dup
    doc = collections.OrderedDict([
        ('source', SOURCE),
        ('generated_by', 'tools/hamilton-rig.py'),
        ('frame', 'assets/hamilton-set.glb as GLTFLoader loads it: metres, Y up, deck y 0 (the set\'s lowest point; '
                  'the pack\'s floor slab, dropped from the GLB, was 0.229 thick), upstage is -z (ETC +y) and the '
                  'house +z, stage left is +x (ETC +x); ETC (x, y, z) -> GLB (x, z + %.4f, %.4f - y)' % (-P[2], P[1] + t)),
        ('units', recs),
    ])
    body = json.dumps(doc, indent=1, ensure_ascii=False)
    # one unit per line: easier to read and to diff
    lines_out = ['{']
    for kk in ('source', 'generated_by', 'frame'):
        lines_out.append(' %s: %s,' % (json.dumps(kk), json.dumps(doc[kk], ensure_ascii=False)))
    lines_out.append(' "units": [')
    for i, rc in enumerate(recs):
        lines_out.append('  ' + json.dumps(rc, ensure_ascii=False, separators=(', ', ': ')) + (',' if i < len(recs) - 1 else ''))
    lines_out.append(' ]')
    lines_out.append('}')
    text = '\n'.join(lines_out) + '\n'
    assert json.loads(text) == json.loads(body)
    with open(out, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(text)

    # ------------------------------------------------ checks and the numbers
    bad = [rc['id'] for rc in recs if not all(math.isfinite(c) for c in rc['pos'] + rc['quat'] + rc['beam'])]
    assert not bad, 'non-finite numbers in %r' % bad
    missing = sorted({rc['model'] for rc in recs if not os.path.exists(os.path.join(REPO, rc['model']))})
    assert not missing, 'missing models %r' % missing
    for rc in recs:
        assert abs(math.sqrt(sum(c*c for c in rc['quat'])) - 1) < 1e-3 and abs(math.sqrt(sum(c*c for c in rc['beam'])) - 1) < 1e-3
    n_patch = len(patch)
    n_cells_merged = len(cells) - len(battens)
    n_units = len(units)
    print('\nunits: %d patch entries - %d scenic - %d Color Force cells merged into battens (%d cells -> %d) '
          '- %d same-spot parts folded + %d by hand = %d'
          % (n_patch, len(scenic), n_cells_merged, len(cells), len(battens), folded, len(hand),
             n_patch - len(scenic) - n_cells_merged - folded + len(hand)))
    assert n_units == n_patch - len(scenic) - n_cells_merged - folded + len(hand) == len(recs)
    print('every model path exists; every number is finite; wrote %s (%d units, %d bytes)'
          % (out, len(recs), os.path.getsize(out)))

    print('\ntype -> units')
    for key, c in sorted(collections.Counter(u['key'] for u in units).items()):
        print('   %-16s %3d   (%d by hand)' % (key, c, sum(1 for u in units if u['key'] == key and u.get('hand'))))

    print('\nhanging positions (GLB: x range, z = depth, y = height above the deck)')
    bypos = collections.OrderedDict()
    for u in sorted(units, key=lambda u: (u['pos'][2], u['pos'][0])):
        bypos.setdefault(u['position'], []).append(u)
    for name, us in sorted(bypos.items(), key=lambda kv: (kv[0] is None, -sum(u['pos'][2] for u in kv[1]) / len(kv[1]))):
        xs = [u['pos'][0] for u in us]
        ys = [u['pos'][1] for u in us]
        zs = [u['pos'][2] for u in us]
        print('   %-32s %3d  x %6.2f..%6.2f  z %6.2f..%6.2f  y %5.2f..%5.2f  %s' % (
            name, len(us), min(xs), max(xs), min(zs), max(zs), min(ys), max(ys),
            dict(collections.Counter(u['key'] for u in us))))

    smn, smx, walls = set_geometry(os.path.join(REPO, 'assets', 'hamilton-set.glb'))
    rig = [u['pos'] for u in units if not u.get('hand')]
    print('\nextents        x                 y (up)            z (depth, + = house)')
    print('   set GLB   %6.2f .. %6.2f   %6.2f .. %6.2f   %6.2f .. %6.2f' % (smn[0], smx[0], smn[1], smx[1], smn[2], smx[2]))
    print('   rig       %6.2f .. %6.2f   %6.2f .. %6.2f   %6.2f .. %6.2f   (patch units)' % (
        min(p[0] for p in rig), max(p[0] for p in rig), min(p[1] for p in rig), max(p[1] for p in rig),
        min(p[2] for p in rig), max(p[2] for p in rig)))
    big = sorted(walls.items(), key=lambda kv: -kv[1])[:6]
    print('   the set\'s biggest brick walls facing +-z, at GLB z:', ', '.join('%.2f (%d m2)' % kv for kv in sorted(big)))

    print('\nsanity')
    print('   pack turntable primitive (ETC y 2.96) -> GLB z %.2f; hamilton_set.py found the revolve centre at +0.95' % tt_z)
    print('   proscenium front face: GLB z %.2f = ETC y %.2f (the arch)' % (arch_z, arch_y))
    foots = [u for u in units if u['position'] == 'Back-wall foots']
    fz = [u['pos'][2] for u in foots]
    wall_up = max((z for z, a in walls.items() if a > 20 and z < min(fz)), default=None)
    print('   back-wall foots (ETC y 7.55, z -0.26): %d battens at GLB z %.2f..%.2f, y 0 (were %.3f..%.3f); '
          'nearest big brick wall upstage of them at z %s -> %.2f m behind them'
          % (len(foots), min(fz), max(fz), min(u['deck_fix'] for u in foots), max(u['deck_fix'] for u in foots),
             wall_up, min(fz) - wall_up if wall_up is not None else float('nan')))
    lip = [u for u in units if u['position'] == 'Downstage lip']
    print('   downstage lip (ColorBlasts, mini-10s; ETC y -1.5..-0.7): %d units at GLB z %.2f..%.2f, %.2f..%.2f m '
          'downstage of the arch; the set GLB\'s front edge is z %.2f'
          % (len(lip), min(u['pos'][2] for u in lip), max(u['pos'][2] for u in lip),
             min(u['pos'][2] for u in lip) - arch_z, max(u['pos'][2] for u in lip) - arch_z, smx[2]))
    elec = [u for u in units if u['position'] and u['position'].endswith(' Electric') and u['position'] != 'FOH Electric']
    ex = [u['pos'][0] for u in elec]
    print('   over-stage electrics: %d units, pipe height(s) %s m above the deck; x centre %.2f (set x centre %.2f); '
          'z %.2f..%.2f (set z %.2f..%.2f)'
          % (len(elec), sorted({round(u['pos'][1], 3) for u in elec if u['hung']}), (min(ex) + max(ex)) / 2,
             (smn[0] + smx[0]) / 2, min(u['pos'][2] for u in elec), max(u['pos'][2] for u in elec), smn[2], smx[2]))
    foh = [u for u in units if u['position'] == 'FOH Truss']
    print('   FOH truss: %d units at GLB z %.2f..%.2f = %.2f m downstage of the arch, %.2f m above the deck'
          % (len(foh), min(u['pos'][2] for u in foh), max(u['pos'][2] for u in foh),
             sum(u['pos'][2] for u in foh) / len(foh) - arch_z, sum(u['pos'][1] for u in foh) / len(foh)))
    up = [u for u in units if u['position'] and 'Electric' in u['position'] and u['hung']]
    print('   beams: every electric unit points down? %s;  FOH units point upstage (-z)? %s;  SL booms point to -x, SR to +x? %s'
          % (all(u['beam'][1] < -0.2 for u in up if u['key'] not in MOVERS),
             all(u['beam'][2] < 0 for u in foh if u['key'] not in MOVERS),
             all((u['beam'][0] < 0) == u['position'].startswith('SL') for u in units
                 if u['position'] and 'Boom' in u['position'] and abs(u['beam'][0]) > 0.3)))
    print('   pipe snap: %d hung units raised onto their electric\'s pipe (by %.3f..%.3f m)'
          % (len(snapped), min(snapped) if snapped else 0, max(snapped) if snapped else 0))
    fixes = [u['deck_fix'] for u in units if u['deck_fix'] is not None]
    print('   deck snap: %d floor units put at y 0 (they were at y %.3f..%.3f)' % (len(fixes), min(fixes), max(fixes)))
    print('   by hand: followspots at z %.2f (%.2f m from the arch = 12 m after the 0.62 scale), y 4, x 0 / +-4; '
          'hazers at x +-9.3, z %.2f, y 0, and x 0, z -6.0 (the set\'s back is z %.2f)'
          % (fs_z, fs_z - arch_z, tt_z, smn[2]))

    print('\nscenic elements in the patch (not lights; skipped):')
    for o in sorted(scenic, key=channel_of):
        p = o['world']['pos']
        print('   %-10s %-34s %-16s ETC (%.2f, %.2f, %.2f) -> GLB (%.2f, %.2f, %.2f)' % (
            o['name'], o['tags'][0], ftypes[o['fixture_uid']]['name'].replace('ETC Fixtures ', ''),
            p['x'], p['y'], p['z'], *F.pos([p['x'], p['y'], p['z']])))


if __name__ == '__main__':
    main()
