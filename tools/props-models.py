#!/usr/bin/env python3
"""assets/props/*.glb: prop models built from boxes and cylinders (RULING FU). Standard library only.

    python -I tools/props-models.py            # writes assets/props/picnic-table.glb and street-lamp.glb

Jack (1-02): "find a model for the lamp. find a model for the picnic bench and it should be this type of bench"
(a classic A-frame wooden picnic table with its benches attached on both sides, a dark red-brown stain). No
third-party model was downloaded: the agent may not download files without the owner's say-so, and both pieces
are a dozen boxes, so they are BUILT here — ours, no licence to track.

THE FRAME (what the page relies on, as the mannequin's): metres, Y up, the floor at y 0, centred on x and z,
the front +Z. The page scales a model to its prop's `size` [w, h, d] (the box of the model), so a model built
at its real size draws at its real size when the prop's size is the model's own (printed below).

  picnic-table.glb  an A-frame picnic table: five top planks, two seat planks a side, two A-frames of two
                    splayed legs, the seat bearers and top cleats, a centre brace; one material, a dark
                    red-brown stain.
  street-lamp.glb   an 1800s street lamp: a stepped base, a fluted post (12-sided), a ladder bar, a
                    four-paned lantern (warm, emissive panes) with a cap and a finial; two materials.
"""
import json, math, os, struct, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'props')


class Mesh:
    def __init__(self):
        self.P, self.N, self.I = [], [], []

    def quad(self, a, b, c, d):                       # four corners, counter-clockwise seen from outside
        n = norm(cross(sub(b, a), sub(d, a)))
        k = len(self.P)
        for v in (a, b, c, d):
            self.P.append(v); self.N.append(n)
        self.I += [k, k + 1, k + 2, k, k + 2, k + 3]

    def box(self, c, size, rx=0.0, ry=0.0, rz=0.0):
        """a box of `size` centred at c, turned rx about x, then ry about y, then rz about z (radians)"""
        sx, sy, sz = [v / 2 for v in size]
        def T(x, y, z):
            # rotate about x, then y, then z, then translate
            y, z = y * math.cos(rx) - z * math.sin(rx), y * math.sin(rx) + z * math.cos(rx)
            x, z = x * math.cos(ry) + z * math.sin(ry), -x * math.sin(ry) + z * math.cos(ry)
            x, y = x * math.cos(rz) - y * math.sin(rz), x * math.sin(rz) + y * math.cos(rz)
            return (c[0] + x, c[1] + y, c[2] + z)
        v = {(i, j, k): T(i * sx, j * sy, k * sz) for i in (-1, 1) for j in (-1, 1) for k in (-1, 1)}
        self.quad(v[1, -1, 1], v[1, -1, -1], v[1, 1, -1], v[1, 1, 1])        # +x
        self.quad(v[-1, -1, -1], v[-1, -1, 1], v[-1, 1, 1], v[-1, 1, -1])    # -x
        self.quad(v[-1, 1, 1], v[1, 1, 1], v[1, 1, -1], v[-1, 1, -1])        # +y
        self.quad(v[-1, -1, -1], v[1, -1, -1], v[1, -1, 1], v[-1, -1, 1])    # -y
        self.quad(v[-1, -1, 1], v[1, -1, 1], v[1, 1, 1], v[-1, 1, 1])        # +z
        self.quad(v[1, -1, -1], v[-1, -1, -1], v[-1, 1, -1], v[1, 1, -1])    # -z

    def cyl(self, c, r, h, n=12, r2=None):
        """an n-sided upright cylinder (or a frustum to r2) from y c[1] to c[1] + h, flat-shaded, capped"""
        r2 = r if r2 is None else r2
        x0, y0, z0 = c
        ring = lambda rr, y: [(x0 + rr * math.sin(2 * math.pi * k / n), y, z0 + rr * math.cos(2 * math.pi * k / n)) for k in range(n)]
        lo, hi = ring(r, y0), ring(r2, y0 + h)
        for k in range(n):
            j = (k + 1) % n
            self.quad(lo[k], lo[j], hi[j], hi[k])
        for ring_, y, up in ((hi, y0 + h, 1), (lo, y0, -1)):
            m = len(self.P)
            nn = (0.0, float(up), 0.0)
            self.P.append((x0, y, z0)); self.N.append(nn)
            for p in ring_: self.P.append(p); self.N.append(nn)
            for k in range(n):
                a, b = m + 1 + k, m + 1 + (k + 1) % n
                self.I += ([m, a, b] if up > 0 else [m, b, a])


def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def norm(v):
    L = math.sqrt(sum(c * c for c in v)) or 1.0
    return tuple(c / L for c in v)


def write_glb(path, parts, extras):
    """parts: [(name, Mesh, material dict)] -> one node per part, one material each"""
    binb, views, accs, meshes, mats, nodes = b'', [], [], [], [], []
    def add_view(data, target):
        nonlocal binb
        while len(binb) % 4: binb += b'\0'
        views.append({'buffer': 0, 'byteOffset': len(binb), 'byteLength': len(data), 'target': target})
        binb += data
        return len(views) - 1
    for name, m, mat in parts:
        pos = b''.join(struct.pack('<3f', *p) for p in m.P)
        nor = b''.join(struct.pack('<3f', *n) for n in m.N)
        idx = b''.join(struct.pack('<H', i) for i in m.I)
        vp, vn, vi = add_view(pos, 34962), add_view(nor, 34962), add_view(idx, 34963)
        mn = [min(p[k] for p in m.P) for k in range(3)]; mx = [max(p[k] for p in m.P) for k in range(3)]
        accs += [{'bufferView': vp, 'componentType': 5126, 'count': len(m.P), 'type': 'VEC3', 'min': mn, 'max': mx},
                 {'bufferView': vn, 'componentType': 5126, 'count': len(m.N), 'type': 'VEC3'},
                 {'bufferView': vi, 'componentType': 5123, 'count': len(m.I), 'type': 'SCALAR'}]
        mats.append(mat)
        meshes.append({'name': name, 'primitives': [{'attributes': {'POSITION': len(accs) - 3, 'NORMAL': len(accs) - 2}, 'indices': len(accs) - 1, 'material': len(mats) - 1}]})
        nodes.append({'name': name, 'mesh': len(meshes) - 1})
    while len(binb) % 4: binb += b'\0'
    gl = {'asset': {'version': '2.0', 'generator': 'tools/props-models.py', 'extras': extras}, 'scene': 0,
          'scenes': [{'nodes': list(range(len(nodes)))}], 'nodes': nodes, 'meshes': meshes, 'materials': mats,
          'buffers': [{'byteLength': len(binb)}], 'bufferViews': views, 'accessors': accs}
    js = json.dumps(gl, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binb)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(binb), 0x004E4942) + binb
    tmp = path + '.tmp'
    with open(tmp, 'wb') as f: f.write(out)
    os.replace(tmp, path)                          # never leave a half-written file (TRAPS: open('w') truncates first)
    tris = sum(len(m.I) // 3 for _, m, _ in parts)
    allP = [p for _, m, _ in parts for p in m.P]
    bb = [round(max(p[k] for p in allP) - min(p[k] for p in allP), 3) for k in range(3)]
    print(f'{os.path.relpath(path, ROOT)}: {tris} triangles, {len(out)} bytes, size {bb}')
    return bb


def lin(h):                                         # sRGB #rrggbb -> linear [r, g, b, 1] (glTF factors are linear)
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [round(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92, 4) for v in c] + [1]


def picnic_table():
    m = Mesh()
    L, TOP, SEAT, PL = 1.8, 0.75, 0.45, 0.04         # length, top height, seat height, plank thickness
    for z in (-0.28, -0.14, 0.0, 0.14, 0.28):        # the top: five planks along the length
        m.box((0, TOP - PL / 2, z), (L, PL, 0.13))
    for s in (-1, 1):                                # the seats: two planks a side
        for z in (0.56, 0.70):
            m.box((0, SEAT - PL / 2, s * z), (L, PL, 0.13))
    for x in (-0.62, 0.62):                          # the A-frames: two splayed legs each, foot out under the seat
        for s in (-1, 1):
            foot, head = (s * 0.66, 0.035), (s * 0.20, TOP - PL - 0.045)
            dz, dy = head[0] - foot[0], head[1] - foot[1]
            Lg = math.hypot(dz, dy); ang = math.atan2(dz, dy)
            m.box((x, (foot[1] + head[1]) / 2, (foot[0] + head[0]) / 2), (0.05, Lg, 0.09), rx=ang)
        m.box((x, SEAT - PL - 0.04, 0), (0.06, 0.08, 1.56))      # the seat bearer, through both legs
        m.box((x, TOP - PL - 0.035, 0), (0.06, 0.07, 0.68))      # the top cleat
    m.box((0, SEAT - PL - 0.04, 0), (1.24 + 0.06, 0.06, 0.06))    # the centre brace between the bearers
    for s in (-1, 1):                                # the diagonal braces, bearer to top centre
        a0, a1 = (s * 0.62, SEAT - PL - 0.04), (0.0, TOP - PL - 0.07)
        dx, dy = a1[0] - a0[0], a1[1] - a0[1]
        m.box(((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2, 0), (math.hypot(dx, dy), 0.05, 0.05), rz=math.atan2(dy, dx))
    mat = {'name': 'stain', 'pbrMetallicRoughness': {'baseColorFactor': lin('#5a2a1f'), 'metallicFactor': 0, 'roughnessFactor': 0.8}}
    return write_glb(os.path.join(OUT, 'picnic-table.glb'), [('table', m, mat)],
                     {'what': 'A-frame picnic table with attached benches', 'built': 'tools/props-models.py', 'licence': 'ours (built from boxes)'})


def street_lamp():
    iron, glass = Mesh(), Mesh()
    iron.box((0, 0.06, 0), (0.34, 0.12, 0.34)); iron.box((0, 0.17, 0), (0.24, 0.10, 0.24))   # a stepped base
    iron.cyl((0, 0.22, 0), 0.065, 0.25, 12, 0.05)                                         # the flared foot of the post
    iron.cyl((0, 0.47, 0), 0.05, 2.08, 12, 0.042)                                         # the post, tapering
    iron.box((0, 2.30, 0), (0.56, 0.035, 0.035))                                          # the ladder bar
    iron.cyl((0, 2.55, 0), 0.06, 0.06, 12)                                                # the collar under the lantern
    H0, H1 = 2.61, 2.97                                                                   # the lantern: frame, panes, cap
    iron.box((0, H0 + 0.015, 0), (0.30, 0.03, 0.30))
    for x in (-0.135, 0.135):
        for z in (-0.135, 0.135):
            iron.box((x, (H0 + H1) / 2, z), (0.03, H1 - H0, 0.03))
    glass.box((0, (H0 + H1) / 2, 0), (0.25, H1 - H0 - 0.03, 0.25))
    iron.cyl((0, H1, 0), 0.22, 0.12, 4, 0.03)                                             # the pyramid cap (4-sided)
    iron.cyl((0, H1 + 0.12, 0), 0.025, 0.08, 8)                                           # the finial
    m_iron = {'name': 'iron', 'pbrMetallicRoughness': {'baseColorFactor': lin('#232323'), 'metallicFactor': 0.4, 'roughnessFactor': 0.6}}
    m_glass = {'name': 'lantern', 'pbrMetallicRoughness': {'baseColorFactor': lin('#f3d9a4'), 'metallicFactor': 0, 'roughnessFactor': 0.3},
               'emissiveFactor': [1.0, 0.72, 0.36]}
    return write_glb(os.path.join(OUT, 'street-lamp.glb'), [('iron', iron, m_iron), ('lantern', glass, m_glass)],
                     {'what': '1800s street lamp: post, ladder bar, four-paned lantern', 'built': 'tools/props-models.py', 'licence': 'ours (built from boxes)'})


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    picnic_table()
    street_lamp()
