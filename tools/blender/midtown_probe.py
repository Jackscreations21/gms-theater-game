# Measure parts of the Midtown scan for midtown_theatre.py (prints only; optional mark render file).
# Run: blender -b --factory-startup --python midtown_probe.py -- <scene.gltf> [marked.glb]
import bpy, sys
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=argv[0])
for n in ('Object_2', 'Object_3'):
    o = bpy.data.objects.get(n)
    if o: bpy.data.objects.remove(o, do_unlink=True)

def tex_of(m):
    return next((n.image for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image), None) if m and m.use_nodes else None
cache = {}
def arr_of(img):
    if img.name not in cache:
        w, h = img.size; a = np.empty(w * h * 4, np.float32); img.pixels.foreach_get(a); cache[img.name] = a.reshape(h, w, 4)
    return cache[img.name]

faces = []   # (obj, poly index, centre, normal, colour)
for o in bpy.context.scene.objects:
    if o.type != 'MESH' or not o.material_slots: continue
    img = tex_of(o.material_slots[0].material); uvl = o.data.uv_layers.active
    mw = o.matrix_world; n3 = mw.to_3x3()
    for p in o.data.polygons:
        col = (0, 0, 0)
        if img is not None and uvl is not None:
            a = arr_of(img); h, w = a.shape[:2]
            uv = sum((uvl.data[li].uv for li in p.loop_indices), Vector((0, 0))) / p.loop_total
            col = tuple(a[min(h - 1, int(uv.y % 1 * h)), min(w - 1, int(uv.x % 1 * w)), :3])
        faces.append((o, p.index, mw @ p.center, (n3 @ p.normal).normalized(), col))

def brown(c):
    r, g, b = c; mx = max(r, g, b); mn = min(r, g, b)
    return mx > 0.015 and r >= g * 0.98 and r > b * 1.12 and (mx - mn) / mx > 0.10

# Back wall: faces facing downstage (+y) near the upstage limit.
bw = [f for f in faces if f[2].y < -8.0 and f[3].y > 0.6]
print("BACKWALL n", len(bw), "y median", round(float(np.median([f[2].y for f in bw])), 3))
for x0 in range(-10, 10):
    sel = [f for f in bw if x0 <= f[2].x < x0 + 1 and 0.9 < f[2].z < 8]
    if sel:
        c = np.median([f[4] for f in sel], axis=0)
        print("  x %3d..%3d n=%3d col=%s brown=%.2f zmax=%.1f" % (x0, x0 + 1, len(sel), np.round(c, 3),
              np.mean([brown(f[4]) for f in sel]), max(f[2].z for f in sel)))

# Proscenium legs / valance (same rule as the recolour).
def in_region(p):
    if not (-4.5 <= p.y <= 1.0 and 0.85 <= p.z <= 7.5 and abs(p.x) <= 6.5): return False
    return abs(p.x) >= 2.6 or p.z >= 4.0
pk = [f for f in faces if in_region(f[2]) and brown(f[4])]
for name, sel in (("LEFT", [f for f in pk if f[2].x < -2.6 and f[2].z < 4.0]),
                  ("RIGHT", [f for f in pk if f[2].x > 2.6 and f[2].z < 4.0]),
                  ("TOP", [f for f in pk if f[2].z >= 4.0])):
    if not sel: continue
    P = np.array([tuple(f[2]) for f in sel])
    print(name, "n", len(sel), "min", np.round(P.min(0), 2), "max", np.round(P.max(0), 2), "median", np.round(np.median(P, 0), 2))

# Upstage freestanding panels.
fp = [f for f in faces if 3.6 <= abs(f[2].x) <= 6.2 and -8.6 <= f[2].y <= -4.2 and 0.9 <= f[2].z <= 7.5 and abs(f[3].z) < 0.5]
for side, sel in (("PANEL_L", [f for f in fp if f[2].x < 0]), ("PANEL_R", [f for f in fp if f[2].x > 0])):
    if sel:
        P = np.array([tuple(f[2]) for f in sel])
        print(side, "n", len(sel), "min", np.round(P.min(0), 2), "max", np.round(P.max(0), 2))

# Over-stage scan geometry by height.
for z0 in range(5, 9):
    n = sum(1 for f in faces if f[2].y < -2.8 and z0 <= f[2].z < z0 + 1)
    print("OVERSTAGE z %d..%d faces %d" % (z0, z0 + 1, n))

if len(argv) > 1:   # paint the panel candidates cyan and export, for a look
    import bmesh
    m = bpy.data.materials.new("MARK"); m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0, 1, 1, 1)
    m.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0, 1, 1, 1)
    m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 1
    by = {}
    for f in fp: by.setdefault(f[0].name, set()).add(f[1])
    for on, idx in by.items():
        o = bpy.data.objects[on]; o.data.materials.append(m); mi = len(o.data.materials) - 1
        for i in idx: o.data.polygons[i].material_index = mi
    bpy.ops.export_scene.gltf(filepath=argv[1], export_format='GLB')
print("PROBE DONE")
