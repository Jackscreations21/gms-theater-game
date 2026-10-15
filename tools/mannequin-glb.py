#!/usr/bin/env python3
"""assets/mannequin-woman.glb from Jack's standing-woman STL (RULING FF).

    python -I tools/mannequin-glb.py <standing-woman.stl> assets/mannequin-woman.glb [cell_cm]

The source is `Downloads\\standing-woman.stl` on Jack's machine (binary STL,
158,010 triangles, 7.9 MB; its 80-byte header reads "MW 1.0 1219062 US",
which is only the header).  Jack supplied it; its licence is UNKNOWN (see
assets/README.md).  It is not committed; this script names where it lives.
Standard library only (no numpy on this machine).

THE STL'S FRAME, MEASURED (tools output, 2026-10-12)
----------------------------------------------------
No units: the figure is normalised to 2,000 units along +z (z -1000.2 ..
998.4), x -292 .. 299 (hands at the hips), y -161 .. 164.  +z is UP (the
narrow head and neck are at the top; the two feet, toes and all, at the
bottom).  The toes and the face stick out towards -y, the calves and heels
sit at +y: she FACES -y.

THE GLB'S FRAME (what the page relies on)
-----------------------------------------
Metres, Y up, feet at y = 0, centred on x and z, facing +Z:

    X = x * k,   Y = (z - zmin) * k,   Z = -y * k       (det +1, no mirror)

k = 1.65 / (zmax - zmin): she is 1.65 m tall.  +Z is her front, so with no
turn she faces the house in the set's frame (the set GLB's own: upstage -z,
house +z).

DECIMATION
----------
The STL is welded (exact vertex matches), then reduced by quadric-error
vertex CLUSTERING (Lindstrom 2000): a grid of `cell` metres; every face adds
its area-weighted plane quadric to its three vertices' cells; each cell's
vertex is the point that minimises its summed quadric (clamped to the cell,
the cell's mean when the quadric is singular).  Faces that collapse, and
duplicates, are dropped.  Smooth normals, area-weighted.  One primitive, one
material ("mannequin", a pale grey the page tints per actor).
"""
import json, math, struct, sys

HEIGHT = 1.65


def read_stl(path):
    d = open(path, 'rb').read()
    n = struct.unpack_from('<I', d, 80)[0]
    if 84 + 50 * n != len(d):
        raise SystemExit(f'{path}: not a binary STL of {n} triangles ({len(d)} bytes)')
    verts, index, faces = [], {}, []
    for i in range(n):
        v = struct.unpack_from('<9f', d, 84 + 50 * i + 12)
        f = []
        for j in range(3):
            key = (v[3 * j], v[3 * j + 1], v[3 * j + 2])
            k = index.get(key)
            if k is None:
                k = index[key] = len(verts)
                verts.append(key)
            f.append(k)
        if f[0] != f[1] and f[1] != f[2] and f[0] != f[2]:
            faces.append(f)
    return n, verts, faces


def to_frame(verts):
    xs = [v[0] for v in verts]; ys = [v[1] for v in verts]; zs = [v[2] for v in verts]
    zmin, zmax = min(zs), max(zs)
    k = HEIGHT / (zmax - zmin)
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    return [((x - cx) * k, (z - zmin) * k, -(y - cy) * k) for x, y, z in verts], k


def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def solve3(A, b):
    (a, bb, c), (d, e, f), (g, h, i) = A
    det = a * (e * i - f * h) - bb * (d * i - f * g) + c * (d * h - e * g)
    scale = max(abs(x) for row in A for x in row) or 1.0
    if abs(det) < 1e-9 * scale ** 3:
        return None
    inv = [[(e * i - f * h), -(bb * i - c * h), (bb * f - c * e)],
           [-(d * i - f * g), (a * i - c * g), -(a * f - c * d)],
           [(d * h - e * g), -(a * h - bb * g), (a * e - bb * d)]]
    return tuple(sum(inv[r][k] * b[k] for k in range(3)) / det for r in range(3))


def cluster(P, faces, cell):
    key = [(math.floor(p[0] / cell), math.floor(p[1] / cell), math.floor(p[2] / cell)) for p in P]
    ids = {}
    vc = [ids.setdefault(k, len(ids)) for k in key]
    m = len(ids)
    Q = [[0.0] * 10 for _ in range(m)]          # a2 ab ac ad b2 bc bd c2 cd d2
    S = [[0.0, 0.0, 0.0, 0] for _ in range(m)]
    for i, p in enumerate(P):
        s = S[vc[i]]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3] += 1
    for f in faces:
        a, b, c = P[f[0]], P[f[1]], P[f[2]]
        n = cross(sub(b, a), sub(c, a)); ln = math.sqrt(dot(n, n))
        if ln < 1e-20:
            continue
        w = ln / 2; nx, ny, nz = n[0] / ln, n[1] / ln, n[2] / ln; d = -(nx * a[0] + ny * a[1] + nz * a[2])
        q = (nx * nx, nx * ny, nx * nz, nx * d, ny * ny, ny * nz, ny * d, nz * nz, nz * d, d * d)
        for v in f:
            Qc = Q[vc[v]]
            for t in range(10):
                Qc[t] += w * q[t]
    reps, kinv = [None] * m, {v: k for k, v in ids.items()}
    for ci in range(m):
        q, s = Q[ci], S[ci]
        mean = (s[0] / s[3], s[1] / s[3], s[2] / s[3])
        A = ((q[0], q[1], q[2]), (q[1], q[4], q[5]), (q[2], q[5], q[7]))
        x = solve3(A, (-q[3], -q[6], -q[8]))
        k = kinv[ci]
        if x is None or any(not (k[j] * cell - cell * 0.5 <= x[j] <= (k[j] + 1) * cell + cell * 0.5) for j in range(3)):
            x = mean
        reps[ci] = x
    out, seen = [], set()
    for f in faces:
        a, b, c = vc[f[0]], vc[f[1]], vc[f[2]]
        if a == b or b == c or a == c:
            continue
        t = tuple(sorted((a, b, c)))
        if t in seen:
            continue
        seen.add(t); out.append((a, b, c))
    # compact: drop clusters no face uses
    used = sorted({v for f in out for v in f}); remap = {v: i for i, v in enumerate(used)}
    return [reps[v] for v in used], [(remap[a], remap[b], remap[c]) for a, b, c in out]


def normals(P, F):
    N = [[0.0, 0.0, 0.0] for _ in P]
    for a, b, c in F:
        n = cross(sub(P[b], P[a]), sub(P[c], P[a]))   # length = 2 x area: area-weighted
        for v in (a, b, c):
            N[v][0] += n[0]; N[v][1] += n[1]; N[v][2] += n[2]
    out = []
    for n in N:
        ln = math.sqrt(dot(n, n))
        out.append((n[0] / ln, n[1] / ln, n[2] / ln) if ln > 1e-20 else (0.0, 1.0, 0.0))
    return out


def write_glb(path, P, N, F, meta):
    pos = b''.join(struct.pack('<3f', *p) for p in P)
    nor = b''.join(struct.pack('<3f', *n) for n in N)
    big = len(P) > 65535
    idx = b''.join(struct.pack('<3I' if big else '<3H', *f) for f in F)
    pad = lambda b, c=b'\0': b + c * ((4 - len(b) % 4) % 4)
    idx = pad(idx)
    binb = pos + nor + idx
    mn = [min(p[j] for p in P) for j in range(3)]; mx = [max(p[j] for p in P) for j in range(3)]
    gl = {
        'asset': {'version': '2.0', 'generator': 'tools/mannequin-glb.py', 'extras': meta},
        'scene': 0, 'scenes': [{'nodes': [0]}],
        'nodes': [{'name': 'mannequin', 'mesh': 0}],
        'meshes': [{'name': 'mannequin', 'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1}, 'indices': 2, 'material': 0}]}],
        'materials': [{'name': 'mannequin', 'pbrMetallicRoughness': {'baseColorFactor': [0.82, 0.8, 0.78, 1], 'metallicFactor': 0, 'roughnessFactor': 0.65}}],
        'buffers': [{'byteLength': len(binb)}],
        'bufferViews': [{'buffer': 0, 'byteOffset': 0, 'byteLength': len(pos), 'target': 34962},
                        {'buffer': 0, 'byteOffset': len(pos), 'byteLength': len(nor), 'target': 34962},
                        {'buffer': 0, 'byteOffset': len(pos) + len(nor), 'byteLength': len(idx), 'target': 34963}],
        'accessors': [{'bufferView': 0, 'componentType': 5126, 'count': len(P), 'type': 'VEC3', 'min': mn, 'max': mx},
                      {'bufferView': 1, 'componentType': 5126, 'count': len(N), 'type': 'VEC3'},
                      {'bufferView': 2, 'componentType': 5125 if big else 5123, 'count': len(F) * 3, 'type': 'SCALAR'}],
    }
    js = pad(json.dumps(gl, separators=(',', ':')).encode(), b' ')
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binb))
    out += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(binb), 0x004E4942) + binb
    open(path, 'wb').write(out)
    return len(out), mn, mx


def main():
    src, dst = sys.argv[1], sys.argv[2]
    cell = float(sys.argv[3]) / 100 if len(sys.argv) > 3 else 0.015
    n, V, faces = read_stl(src)
    P, k = to_frame(V)
    Pc, F = cluster(P, faces, cell)
    N = normals(Pc, F)
    meta = {'source': 'standing-woman.stl (supplied by Jack, licence unknown)', 'sourceTriangles': n,
            'frame': 'metres, Y up, feet at y 0, centred on x/z, facing +Z', 'height': HEIGHT, 'cell': cell}
    size, mn, mx = write_glb(dst, Pc, N, F, meta)
    print(f'{src}: {n} triangles, {len(V)} welded vertices, scale {k:.7f} m/unit')
    print(f'{dst}: {len(F)} triangles, {len(Pc)} vertices, cell {cell * 100:.2f} cm, {size} bytes')
    print('bounds', [round(x, 3) for x in mn], [round(x, 3) for x in mx])


if __name__ == '__main__':
    main()
