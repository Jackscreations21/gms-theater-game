"""Colour-coded check renders of the built fixtures.

    blender -b --python tools/blender/fixtures_sheet.py -- <glb dir> <png dir> [name ...]

One 512x512 Workbench render per GLB: head RED, yoke GREEN, base BLUE, the beam
empty drawn as arrows, a 10 cm grid floor for scale, camera on a three-quarter
view framed to the model.  A part in the wrong colour is a rule to fix in
fixtures.json; a beam arrow pointing anywhere but out of the lens is a "front" to fix.
"""
import bpy, sys, os, glob, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
D, OUT = argv[0], argv[1]
ONLY = set(argv[2:])
os.makedirs(OUT, exist_ok=True)
COL = {'head': (0.85, 0.15, 0.15, 1), 'yoke': (0.15, 0.7, 0.2, 1), 'base': (0.2, 0.35, 0.9, 1), 'lens': (1, 0.85, 0.1, 1)}

for f in sorted(glob.glob(os.path.join(D, '*.glb'))):
    name = os.path.basename(f)[:-4]
    if ONLY and name not in ONLY: continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=f)
    sc = bpy.context.scene
    objs = [o for o in sc.objects if o.type == 'MESH']
    pts = []
    for o in objs:
        o.color = COL.get(o.name.split('.')[0], (0.6, 0.6, 0.6, 1))
        pts += [o.matrix_world @ v.co for v in o.data.vertices]
    for o in sc.objects:
        if o.type == 'EMPTY': o.empty_display_size = 0.15; o.empty_display_type = 'SINGLE_ARROW'
    mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
    c = (mn + mx) / 2; r = max((mx - mn).length / 2, 0.05)
    # a thin grid plane 20 cm below the lowest point for scale
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=20, y_subdivisions=20, size=r * 4, location=(c.x, c.y, mn.z - 0.02))
    g = bpy.context.active_object; g.color = (0.9, 0.9, 0.9, 1); g.display_type = 'WIRE'
    cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
    cam.type = 'ORTHO'; cam.ortho_scale = r * 2.4; cam.clip_start = 0.001; cam.clip_end = 100
    d = r / math.sin(math.radians(20)) * 1.15
    az, el = math.radians(35), math.radians(22)
    co.location = (c.x + d * math.cos(el) * math.sin(az), c.y - d * math.cos(el) * math.cos(az), c.z + d * math.sin(el))
    co.rotation_mode = 'QUATERNION'; co.rotation_quaternion = (c - co.location).to_track_quat('-Z', 'Y')
    sc.render.engine = 'BLENDER_WORKBENCH'
    sh = sc.display.shading; sh.light = 'STUDIO'; sh.color_type = 'OBJECT'; sh.show_object_outline = True; sh.show_cavity = True
    sc.display.shading.show_backface_culling = False
    sc.render.resolution_x = sc.render.resolution_y = 512; sc.render.film_transparent = False
    sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.82, 0.84, 0.87)
    bpy.context.view_layer.update()
    if False: print('CAMOBJ', sc.camera.name, [round(v,3) for v in sc.camera.matrix_world.translation], 'objs', [(o.name, o.type, [round(v,2) for v in o.matrix_world.translation]) for o in sc.objects])
    print('CAM', name, 'c', [round(v,3) for v in c], 'r', round(r,3), 'd', round(d,3), 'cam', [round(v,3) for v in co.location], 'clip', cam.clip_start)
    sc.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)
    print('SHEET', name, 'min', [round(v,3) for v in mn], 'dims', [round(v, 3) for v in (mx - mn)], 'parts', sorted({o.name.split('.')[0] for o in objs}))
