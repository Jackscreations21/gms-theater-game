"""assets/hamilton-set.glb from the ETC Hamilton Programming Project set model.

    blender -b --python tools/blender/hamilton_set.py -- <Hamilton Full Set .dae> assets/hamilton-set.glb

The source is "Hamilton Full Set_*.dae" inside working.a3d inside the THPP .esf3d
(Rod Lemmond's model of David Korins' set, shipped by ETC for non-commercial
use).  Blender 5.x has no COLLADA importer, so the file is parsed here by hand:
it is Assimp-flat (one node, 22 geometries, ten flat-grey materials, no UVs).

What this does, in order:
  1. parse the DAE into one mesh per material group (the greys are the only
     grouping the model has, and they do map to real parts - see MAP below);
  2. drop what is the THEATRE rather than the set: the black proscenium
     surround (grey 34), the black borders (grey 68) and the stage floor
     (every face of grey 221 lying on y = 0 - the game keeps its own deck,
     because the revolves are cut into it and they turn);
  3. map the greys onto five materials with generated brick and timber maps;
  4. planar-dissolve then collapse-decimate the heavy groups until the whole
     thing is under the game's import budget (BJ_TRI_BUDGET 150,000, aim 100k);
  5. export a Y-up GLB in metres, origin on the deck, x centred, z as the
     model has it (p5i's HAM_MODEL.z then puts the real turntable centre
     where it stands, 2.96 m upstage of the arch).
It also prints the turntable ring radii it finds on the floor, which is where
p5f's REV numbers come from.
"""
import bpy, bmesh, sys, os, re, math, collections
import numpy as np
import xml.etree.ElementTree as ET

argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = argv[0], argv[1]
TRI_BUDGET, TRI_AIM = 150000, 100000

# ------------------------------------------------------------------ parse
NS = {'c': 'http://www.collada.org/2005/11/COLLADASchema'}
root = ET.parse(SRC).getroot()
bind = {}
for ig in root.findall('.//c:instance_geometry', NS):
    gid = ig.get('url').lstrip('#')
    for im in ig.findall('.//c:instance_material', NS):
        bind[(gid, im.get('symbol'))] = im.get('target').lstrip('#')
node = root.find('.//c:library_visual_scenes//c:node', NS)
M = np.eye(4)
mt = node.find('c:matrix', NS) if node is not None else None
if mt is not None:
    M = np.fromstring(mt.text, sep=' ').reshape(4, 4)
groups = collections.defaultdict(list)
for g in root.findall('.//c:library_geometries/c:geometry', NS):
    mesh = g.find('c:mesh', NS)
    sources = {}
    for s in mesh.findall('c:source', NS):
        fa = s.find('c:float_array', NS)
        acc = s.find('.//c:accessor', NS)
        sources[s.get('id')] = np.fromstring(fa.text, sep=' ').reshape(-1, int(acc.get('stride', '3')))
    verts = mesh.find('c:vertices', NS)
    pos_src = verts.find("c:input[@semantic='POSITION']", NS).get('source').lstrip('#')
    for prim in list(mesh):
        tag = prim.tag.split('}')[1]
        if tag not in ('triangles', 'polylist', 'polygons'):
            continue
        offs = {}
        maxoff = 0
        for i in prim.findall('c:input', NS):
            o = int(i.get('offset'))
            maxoff = max(maxoff, o)
            if i.get('semantic') == 'VERTEX':
                offs['v'] = o
        p = prim.find('c:p', NS)
        if p is None:
            continue
        idx = np.fromstring(p.text, sep=' ', dtype=np.int64)[offs['v']::maxoff + 1]
        if tag == 'triangles':
            faces = idx.reshape(-1, 3)
        else:
            vc = np.fromstring(prim.find('c:vcount', NS).text, sep=' ', dtype=np.int64)
            tri = []
            k = 0
            for n in vc:
                for j in range(1, n - 1):
                    tri.append((idx[k], idx[k + j], idx[k + j + 1]))
                k += n
            faces = np.array(tri, dtype=np.int64)
        mat = bind.get((g.get('id'), prim.get('material')), prim.get('material'))
        groups[re.search(r'(\d+)', mat).group(1)].append((sources[pos_src][:, :3], faces))


def concat(parts):
    V = []
    F = []
    base = 0
    for v, f in parts:
        V.append(v)
        F.append(f + base)
        base += len(v)
    return np.vstack(V), np.vstack(F)


def to_metres(V):
    return (np.c_[V, np.ones(len(V))] @ M.T)[:, :3]      # the node's scale (mm -> m) and offset


# ------------------------------------------------------------------ what each grey is
# Read off colour-coded renders: 34 = proscenium surround, 68 = borders,
# 221 = the floor plus the brick walls, 187 = plank walls and gallery floors,
# 204 = the back-wall boards and stair treads, 136 = the big timber uprights,
# 170 = rails and frames, 119 = odd warm timber, 238 = sconce blocks,
# 255 = tiny white bits.
MAP = {'221': 'brick', '204': 'split', '187': 'split', '136': 'post', '119': 'post',
       '170': 'rail', '238': 'iron', '255': 'iron'}
DROP = {'34', '68'}
SPLIT = {'187', '204'}
MATS = {   # name: (base colour, roughness, metalness, texture kind)
    'brick': ((0.55, 0.30, 0.22), 0.95, 0.0, 'brick'),
    'plank': ((0.62, 0.48, 0.32), 0.90, 0.0, 'wood'),
    'post':  ((0.40, 0.28, 0.17), 0.90, 0.0, 'wood'),
    'rail':  ((0.30, 0.17, 0.11), 0.85, 0.0, 'wood'),
    'iron':  ((0.16, 0.17, 0.18), 0.60, 0.6, None),
}


# ------------------------------------------------------------------ textures (generated here, no image files)
def tex_image(kind, tint=(1.0, 1.0, 1.0), size=1024):
    rng = np.random.default_rng(7)
    img = np.ones((size, size, 4), dtype=np.float32)
    if kind == 'brick':
        bh, bw, mortar = size // 16, size // 8, 3
        base = np.array([0.58, 0.31, 0.23])
        img[..., :3] = np.array([0.72, 0.68, 0.62])       # mortar
        for r in range(0, size, bh):
            off = (r // bh % 2) * bw // 2
            for c in range(-bw, size, bw):
                tint = base * (0.78 + 0.44 * rng.random()) + (rng.random(3) - 0.5) * 0.06
                y0, y1 = r + mortar, min(size, r + bh - mortar)
                x0, x1 = max(0, c + off + mortar), min(size, c + off + bw - mortar)
                if y1 > y0 and x1 > x0:
                    img[y0:y1, x0:x1, :3] = np.clip(tint, 0, 1)
        img[..., :3] *= (0.86 + 0.14 * rng.random((size, size, 1)))
    elif kind == 'wood':
        y = np.arange(size)[:, None]
        x = np.arange(size)[None, :]
        grain = 0.5 + 0.5 * np.sin(y * 0.35 + 0.8 * np.sin(x * 0.02) + 0.6 * np.sin(y * 0.07))
        plank = ((x // (size // 6)) % 2) * 0.05
        v = 0.74 + 0.09 * grain - plank + 0.05 * rng.random((size, size))
        img[..., 0] = v
        img[..., 1] = v * 0.86
        img[..., 2] = v * 0.70
    img[..., :3] *= np.array(tint, dtype=np.float32)
    im = bpy.data.images.new('ham_%s_%s' % (kind, '_'.join('%d' % round(t * 100) for t in tint)), size, size, alpha=False)
    im.pixels = img.ravel().tolist()
    im.pack()
    return im


images = {}


def material(name):
    col, rough, metal, kind = MATS[name]
    m = bpy.data.materials.new('ham_' + name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Base Color'].default_value = (*col, 1)
    if kind:
        # a linked map exports with factor 1, so each timber tone gets its own
        # copy of the grain, tinted; the brick keeps its drawn colours
        key = (kind, col)
        if key not in images:
            tint = (1.0, 1.0, 1.0) if kind == 'brick' else tuple(c / 0.62 for c in col)
            images[key] = tex_image(kind, tint, 1024 if kind == 'brick' else 512)
        t = m.node_tree.nodes.new('ShaderNodeTexImage')
        t.image = images[key]
        t.extension = 'REPEAT'
        m.node_tree.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    return m


# ------------------------------------------------------------------ build
bpy.ops.wm.read_factory_settings(use_empty=True)
mats = {}
by_mat = collections.defaultdict(list)     # material name -> [(V, F)] in metres
for grey, parts in groups.items():
    if grey in DROP:
        continue
    V, F = concat(parts)
    V = to_metres(V)
    if grey == '221':
        # the floor: every face whose three corners lie on the deck.  The game
        # keeps its own deck - but measure the turntable rings before dropping it.
        # the slab is 0.2 m thick: a face is floor when all three corners are
        # below 0.3 m (a wall face spans far taller than that, so it survives)
        on = (V[F[:, 0], 1] < 0.3) & (V[F[:, 1], 1] < 0.3) & (V[F[:, 2], 1] < 0.3)
        top = on & (np.abs(V[F[:, 0], 1] - V[F[:, 1], 1]) < 0.01) & (np.abs(V[F[:, 0], 1] - V[F[:, 2], 1]) < 0.01)
        floorV = V[np.unique(F[top])]
        best = None
        for zc in np.arange(-3, 4, 0.05):
            r = np.hypot(floorV[:, 0], floorV[:, 2] - zc)
            h, e = np.histogram(r, bins=np.arange(0, 8, 0.02))
            top = np.sort(h)[-2:].sum()
            if best is None or top > best[0]:
                best = (top, zc, h, e)
        _, zc, h, e = best
        peaks = sorted(((int(h[i]), round(float(e[i] + 0.01), 2)) for i in np.argsort(h)[-6:]), reverse=True)
        print('TURNTABLE centre z (model frame)', round(float(zc), 2), 'ring radii (count, m):', peaks)
        F = F[~on]
    name = MAP[grey]
    if grey in SPLIT:
        # these two groups mix wall panels with gallery floors and treads; in
        # this set every vertical surface is brick and every flat one is timber
        n = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
        flat = np.abs(n[:, 1]) > 0.7 * (np.linalg.norm(n, axis=1) + 1e-12)
        by_mat['plank'].append((V, F[flat]))
        by_mat['brick'].append((V, F[~flat]))
        continue
    by_mat[name].append((V, F))

scene = bpy.context.scene
objs = []
for name, parts in by_mat.items():
    V, F = concat(parts)
    # DAE is Y-up with +z downstage; Blender is Z-up: (x, y, z) -> (x, -z, y)
    Vb = np.c_[V[:, 0], -V[:, 2], V[:, 1]]
    me = bpy.data.meshes.new('ham_' + name)
    me.from_pydata(Vb.tolist(), [], F.tolist())
    me.validate(clean_customdata=False)
    me.update()
    ob = bpy.data.objects.new('ham_' + name, me)
    scene.collection.objects.link(ob)
    if name not in mats:
        mats[name] = material(name)
    me.materials.append(mats[name])
    objs.append(ob)


def tri_count(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def select_only(ob):
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob


def apply_mod(ob, mod):
    select_only(ob)
    bpy.ops.object.modifier_apply(modifier=mod.name)


def report(label):
    print('---', label, {o.name: tri_count(o) for o in objs}, 'total', sum(tri_count(o) for o in objs))


report('before')
# 1) merge doubles + planar dissolve: CAD boxes carry thousands of coplanar faces
for ob in objs:
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.002)
    bm.to_mesh(ob.data)
    bm.free()
    ob.data.update()
    d = ob.modifiers.new('planar', 'DECIMATE')
    d.decimate_type = 'DISSOLVE'
    d.angle_limit = math.radians(4)
    apply_mod(ob, d)
report('after planar')
# 2) collapse the heavy ones down to the aim
for ob in sorted(objs, key=tri_count, reverse=True):
    total = sum(tri_count(o) for o in objs)
    if total <= TRI_AIM:
        break
    n = tri_count(ob)
    want = max(2000, n - (total - TRI_AIM))
    ratio = want / n
    if ratio < 0.98:
        d = ob.modifiers.new('collapse', 'DECIMATE')
        d.decimate_type = 'COLLAPSE'
        d.ratio = ratio
        d.use_collapse_triangulate = True
        apply_mod(ob, d)
report('after collapse')
# 3) UVs: a box projection in metres so the maps tile at a sensible scale
for ob in objs:
    if MATS[ob.name[4:]][3] is None:
        continue
    select_only(ob)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.cube_project(cube_size=2.0 if ob.name.endswith('brick') else 1.2,
                            correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
# 4) flat CAD shading
for ob in objs:
    ob.data.shade_flat()
# 5) report and export
total = sum(tri_count(o) for o in objs)
assert total <= TRI_BUDGET, 'over the import budget: %d' % total
allv = np.vstack([np.array([v.co[:] for v in o.data.vertices]) for o in objs])
print('--- bounds (blender x, y=-z_dae, z=up):', allv.min(0).round(2), allv.max(0).round(2))
print('--- materials', len(mats), 'triangles', total)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True,
                          export_yup=True, export_materials='EXPORT', export_image_format='AUTO',
                          export_normals=True, export_texcoords=True)
print('wrote', OUT, os.path.getsize(OUT), 'bytes')
