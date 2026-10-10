# Inspect the Midtown Atlanta scan: list meshes, then render overview views.
# Run: blender --background --factory-startup --python tools/blender/midtown_inspect.py -- <scene.gltf> <outdir>
import bpy, sys, os, math
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, out = argv[0], argv[1]
os.makedirs(out, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)

lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9))
for o in bpy.context.scene.objects:
    if o.type != 'MESH':
        print("OBJ", o.type, o.name); continue
    ws = [o.matrix_world @ Vector(c) for c in o.bound_box]
    a = Vector((min(v.x for v in ws), min(v.y for v in ws), min(v.z for v in ws)))
    b = Vector((max(v.x for v in ws), max(v.y for v in ws), max(v.z for v in ws)))
    lo = Vector((min(lo.x, a.x), min(lo.y, a.y), min(lo.z, a.z)))
    hi = Vector((max(hi.x, b.x), max(hi.y, b.y), max(hi.z, b.z)))
    mats = [s.material.name if s.material else None for s in o.material_slots]
    print("MESH %-50s faces=%7d mats=%s min=(%.2f,%.2f,%.2f) max=(%.2f,%.2f,%.2f)" % (
        o.name, len(o.data.polygons), mats, a.x, a.y, a.z, b.x, b.y, b.z))
print("SCENE min", tuple(round(x, 2) for x in lo), "max", tuple(round(x, 2) for x in hi))

# Render setup: Eevee, flat bright world so the baked photo colour shows.
sc = bpy.context.scene
sc.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
sc.render.resolution_x, sc.render.resolution_y = 1280, 720
world = bpy.data.worlds.new("W"); sc.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
# Make materials emissive-ish so the photogrammetry reads without lights.
for m in bpy.data.materials:
    if not m.use_nodes: continue
    nt = m.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    tex = next((n for n in nt.nodes if n.type == 'TEX_IMAGE'), None)
    if bsdf and tex:
        nt.links.new(tex.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 1.0

cam_data = bpy.data.cameras.new("C"); cam = bpy.data.objects.new("C", cam_data)
sc.collection.objects.link(cam); sc.camera = cam
ctr = (lo + hi) / 2; size = hi - lo

def shoot(name, loc, target, lens=18, ortho=None):
    cam.location = loc
    d = Vector(target) - Vector(loc)
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    if ortho:
        cam_data.type = 'ORTHO'; cam_data.ortho_scale = ortho
    else:
        cam_data.type = 'PERSP'; cam_data.lens = lens
    cam_data.clip_end = 1000
    sc.render.filepath = os.path.join(out, name + ".png")
    bpy.ops.render.render(write_still=True)

shoot("top", (ctr.x, ctr.y, hi.z + 50), (ctr.x, ctr.y, ctr.z), ortho=max(size.x, size.y) * 1.05)
shoot("side_x", (hi.x + 60, ctr.y, ctr.z), (ctr.x, ctr.y, ctr.z), ortho=max(size.y, size.z) * 1.05)
shoot("side_y", (ctr.x, hi.y + 60, ctr.z), (ctr.x, ctr.y, ctr.z), ortho=max(size.x, size.z) * 1.05)
# Interior perspectives from inside the room, each looking toward the opposite end.
for i, (ax, sgn) in enumerate([('x', 1), ('x', -1), ('y', 1), ('y', -1)]):
    p = ctr.copy(); t = ctr.copy()
    if ax == 'x':
        p.x = ctr.x + sgn * size.x * 0.38; t.x = ctr.x - sgn * size.x * 0.5
    else:
        p.y = ctr.y + sgn * size.y * 0.38; t.y = ctr.y - sgn * size.y * 0.5
    p.z = lo.z + size.z * 0.45; t.z = lo.z + size.z * 0.3
    shoot("in_%s%s" % (ax, '+' if sgn > 0 else '-'), tuple(p), tuple(t), lens=16)
print("DONE")
