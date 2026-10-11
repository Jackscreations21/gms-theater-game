"""Low-detail copies of the game-ready fixtures, for the far level of a THREE.LOD.

    blender -b --python tools/blender/fixtures_lod.py -- assets/fixtures assets/fixtures/lod [name ...]

For each <in dir>/<name>.glb: import, keep the node names, the tree, the transforms and the
materials exactly, decimate every mesh except `lens` (Decimate, collapse) to a per-file budget,
and export <out dir>/<name>.glb, Y-up, like the source.  The lens (the 22-triangle disc whose
local -Z is the beam) is never touched, so the aim and the glow are the same at both levels.

Budget per unit, lens included: 800 triangles (1,000 for the big movers and the followspot),
shared between the parts in proportion to their triangles now, never below 80 a part (a part
already under 80 is left alone).  A file already under budget is copied through unchanged.
(1,200 / 1,500 was tried first: Back of house still drew 585k triangles; 800 / 1,000 gets the
whole picture under 500k.)  The hang point (top of a hung unit, floor of a floor unit) is pinned
so the collapse cannot move it.  Check: node tools/fixtures-check.js assets/fixtures/lod --lod
"""
import bpy, sys, os, glob

argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = argv[0], argv[1]
ONLY = set(argv[2:])
os.makedirs(OUT, exist_ok=True)

BUDGET = 800
BIG = {'mac-viper': 1000, 'vl3500': 1000, 'glp-x4': 1000, 'lycian': 1000}
FLOOR = 80                     # never decimate a part below this
FLOOR_UNITS = {'colorblast', 'colorblaze-48', 'colorblaze-72', 'lycian', 'hazer', 'mini-10'}   # README: origin at the floor

def tris(o):
    o.data.calc_loop_triangles(); return len(o.data.loop_triangles)

def pin_extremes(meshes, floor, eps=0.002):
    """a vertex group 'pin' on each part holding the vertices within eps of the unit's highest world Z (a
    hung unit: the hang point is the top of the clamp) or its lowest (a floor unit) - Blender is Z-up -
    and only that end: pinning both left the followspot's head 600 triangles over.  An an unpinned collapse dropped mac-viper's clamp top 2.6 cm and lifted a ColorBlaze off the
    floor.  Measured from the vertices through matrix_world, never bound_box (TRAPS.md)."""
    zs = [(o.matrix_world @ v.co).z for o in meshes for v in o.data.vertices]
    end = min(zs) if floor else max(zs)
    for o in meshes:
        if o.data.users > 1: o.data = o.data.copy()
        idx = [v.index for v in o.data.vertices if abs((o.matrix_world @ v.co).z - end) < eps]
        if idx:
            g = o.vertex_groups.new(name='pin'); g.add(idx, 1.0, 'REPLACE')

def decimate_to(o, target):
    """collapse until at or under target (one pass usually lands; a second pass mops up the overshoot
    that seams and hard edges cause).  The data is made single-user first: a glTF import can share
    mesh data, and modifier_apply refuses multi-user data like transform_apply does."""
    if o.data.users > 1: o.data = o.data.copy()
    bpy.context.view_layer.objects.active = o
    target = max(FLOOR, target)
    for i in range(4):
        n = tris(o)
        if n <= target: break
        aim = target if i == 0 else max(FLOOR + 2, 0.97 * target)   # first pass straight at it; then a little under
        md = o.modifiers.new('lod', 'DECIMATE')
        md.decimate_type = 'COLLAPSE'; md.ratio = max(0.01, aim / n); md.use_collapse_triangulate = True
        if 'pin' in o.vertex_groups:   # weight 1 = keep: invert so the pinned vertices are the ones NOT collapsed
            md.vertex_group = 'pin'; md.invert_vertex_group = True; md.vertex_group_factor = 1000.0
        bpy.ops.object.modifier_apply(modifier=md.name)
    return tris(o)

def lod(path):
    name = os.path.splitext(os.path.basename(path))[0]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    before = {o.name: tris(o) for o in meshes}
    budget = BIG.get(name, BUDGET)
    lens = sum(n for k, n in before.items() if k == 'lens')
    parts = {k: n for k, n in before.items() if k != 'lens'}
    room = budget - lens
    total = sum(parts.values())
    after = dict(before)
    if total > room:
        pin_extremes([o for o in meshes if o.name != 'lens'], name in FLOOR_UNITS)
        # parts too small to cut keep their triangles; the rest share what is left, pro rata
        small = {k: n for k, n in parts.items() if n <= FLOOR}
        big = {k: n for k, n in parts.items() if n > FLOOR}
        left = room - sum(small.values())
        bigsum = sum(big.values())
        for o in meshes:
            if o.name not in big: continue
            target = max(FLOOR, int(left * big[o.name] / bigsum))
            after[o.name] = decimate_to(o, target)
        # a pinned part can stall above its share (mac-viper's clamp top): take the overshoot from the biggest part
        for _ in range(3):
            over = sum(after[k] for k in big) + sum(small.values()) - room
            if over <= 0: break
            k = max(big, key=lambda k: after[k])
            o = bpy.context.scene.objects[k]
            after[k] = decimate_to(o, after[k] - over - 2)
    for o in meshes:
        for g in list(o.vertex_groups): o.vertex_groups.remove(g)   # the pin is a build aid, not export data
    for o in bpy.context.scene.objects: o.select_set(True)
    out = os.path.join(OUT, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
                              export_materials='EXPORT', export_image_format='AUTO')
    return name, before, after, budget, os.path.getsize(out)

rows = []
for p in sorted(glob.glob(os.path.join(SRC, '*.glb'))):
    n = os.path.splitext(os.path.basename(p))[0]
    if ONLY and n not in ONLY: continue
    try: rows.append(lod(p))
    except Exception as e:
        import traceback; traceback.print_exc(); print(f"LOD {n}: FAILED {e}")

print('\nLOD table (triangles, old -> new)')
print(f"{'file':<18}{'budget':>7}{'old':>7}{'new':>7}   parts")
grand = [0, 0, 0]
for name, b, a, budget, size in rows:
    order = [k for k in ('base', 'yoke', 'head', 'lens') if k in b] + [k for k in b if k not in ('base', 'yoke', 'head', 'lens')]
    ob, nb = sum(b.values()), sum(a.values())
    grand[0] += ob; grand[1] += nb; grand[2] += size
    flag = '' if nb <= budget else '  OVER BUDGET'
    print(f"LOD {name:<14}{budget:>7}{ob:>7}{nb:>7}   " + '  '.join(f"{k} {b[k]}->{a[k]}" for k in order) + f"   {size//1024} KB{flag}")
print(f"LOD total{'':<16}{grand[0]:>7}{grand[1]:>7}   {grand[2]//1024} KB in {len(rows)} files")
