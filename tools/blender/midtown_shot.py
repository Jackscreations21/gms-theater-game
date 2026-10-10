# Render named views of a glTF/GLB with emissive photo colour.
# Run: blender -b --factory-startup --python midtown_shot.py -- <model> <outdir> <hide,list|-> name:x,y,z:tx,ty,tz:lens ...
import bpy, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, out, hide = argv[0], argv[1], argv[2]
shots = argv[3:]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
if src.endswith('.blend'):
    bpy.ops.wm.open_mainfile(filepath=src)
else:
    bpy.ops.import_scene.gltf(filepath=src)
sc = bpy.context.scene
for n in ([] if hide == '-' else hide.split(',')):
    o = bpy.data.objects.get(n)
    if o: o.hide_render = True
sc.render.engine = 'BLENDER_EEVEE'
res = [int(v) for v in os.environ.get("SHOT_RES", "1280,720").split(',')]
sc.render.resolution_x, sc.render.resolution_y = res
if os.environ.get("SHOT_STD"):              # faithful texture colours (for texture capture)
    sc.view_settings.view_transform = 'Standard'
w = sc.world or bpy.data.worlds.new("W"); sc.world = w
w.use_nodes = True
bg = [float(v) for v in os.environ.get("SHOT_BG", "0.8,0.8,0.8").split(',')]
# The background is seen only by camera rays (so holes show it), never in reflections or lighting.
wn = w.node_tree.nodes; wl = w.node_tree.links
bgn = wn["Background"]; bgn.inputs[0].default_value = (*bg, 1)
dark = wn.new('ShaderNodeBackground'); dark.inputs[0].default_value = (0, 0, 0, 1)
lp = wn.new('ShaderNodeLightPath'); mix = wn.new('ShaderNodeMixShader')
wl.new(lp.outputs['Is Camera Ray'], mix.inputs[0])
wl.new(dark.outputs[0], mix.inputs[1]); wl.new(bgn.outputs[0], mix.inputs[2])
wl.new(mix.outputs[0], wn["World Output"].inputs[0])
for m in bpy.data.materials:
    if not m.use_nodes: continue
    nt = m.node_tree
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    tex = next((n for n in nt.nodes if n.type == 'TEX_IMAGE'), None)
    if bsdf and tex and not bsdf.inputs['Emission Color'].is_linked:
        nt.links.new(tex.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 1.0
cd = bpy.data.cameras.new("C"); cam = bpy.data.objects.new("C", cd)
sc.collection.objects.link(cam); sc.camera = cam
cd.clip_start, cd.clip_end = 0.05, 1000
for s in shots:
    name, p, t, lens = s.split(':')
    p = Vector([float(v) for v in p.split(',')]); t = Vector([float(v) for v in t.split(',')])
    cam.location = p
    cam.rotation_euler = (t - p).to_track_quat('-Z', 'Y').to_euler()
    if lens.startswith('o'):               # o<scale> = orthographic
        cd.type = 'ORTHO'; cd.ortho_scale = float(lens[1:])
    else:
        cd.type = 'PERSP'; cd.lens = float(lens)
    sc.render.filepath = os.path.join(out, name + ".png")
    bpy.ops.render.render(write_still=True)
print("DONE")
