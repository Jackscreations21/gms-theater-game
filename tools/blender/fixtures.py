"""Game-ready lighting fixtures from the picked source models.

    blender -b --python tools/blender/fixtures.py -- <source dir> <out dir> [name ...]

Reads tools/blender/fixtures.json (one entry per fixture) and, for each, imports
<source dir>/<name>.glb, splits it into three parts and exports
<out dir>/<name>.glb with this node tree, Z-up in Blender, Y-up in the file:

    base            the clamp (hung units) or the floor base - FIXED to the hang point
      yoke          rotates about the pan axis (vertical through the base)
        head        rotates about the tilt axis (horizontal through the yoke trunnions)
          beam      an empty at the lens centre, its -Y (Blender) = out of the lens

The origin is the HANG POINT: the top of the clamp for a hung unit, the floor
under the base for a floor unit.  Units are metres.  Every part is one mesh,
decimated to its budget, materials merged by colour (textures kept).

Part assignment is by rule (fixtures.json: "yoke"/"base" regex lists matched
against "<parent chain>/<mesh name>"), with a geometric fallback: the biggest
mesh is the head; meshes that sit entirely above the head's top are the base
(clamp); meshes that overlap the head in height but reach above its centre are
the yoke.  Check the colour-coded contact sheet (tools/blender/fixtures_sheet.py)
after any rule change - the heuristic is wrong often enough to need it.
"""
import bpy, bmesh, sys, os, json, re, math
CHAIN = {}
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = argv[0], argv[1]
ONLY = set(argv[2:])
HERE = os.path.dirname(os.path.abspath(__file__))
RULES = json.load(open(os.path.join(HERE, 'fixtures.json'), encoding='utf-8'))
os.makedirs(OUT, exist_ok=True)

def chain_of(o):
    c = []; p = o.parent
    while p: c.append(p.name); p = p.parent
    return '/'.join(reversed(c)) + '/' + o.name

def world_bbox(objs):
    """from the vertices, not o.bound_box: the cached box goes stale after mesh.transform() and measured the
    PRE-scale model for a whole round (the hang point, tilt axis and lens all landed in the wrong place)"""
    mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        mw = o.matrix_world
        for v in o.data.vertices:
            p = mw @ v.co
            if p.x < mn.x: mn.x = p.x
            if p.y < mn.y: mn.y = p.y
            if p.z < mn.z: mn.z = p.z
            if p.x > mx.x: mx.x = p.x
            if p.y > mx.y: mx.y = p.y
            if p.z > mx.z: mx.z = p.z
    return mn, mx

def tri_count(o):
    o.data.calc_loop_triangles(); return len(o.data.loop_triangles)

def matches(patterns, s):
    return any(re.search(p, s) for p in patterns)

def classify(meshes, rule):
    """-> {mesh: 'head'|'yoke'|'base'}"""
    cls = {}
    named = {m: CHAIN.get(m, chain_of(m)) for m in meshes}
    for m in meshes:
        s = named[m]
        if matches(rule.get('drop', []), s): cls[m] = 'drop'
        elif rule.get('single'): cls[m] = 'base'
        elif matches(rule.get('head', []), s): cls[m] = 'head'
        elif matches(rule.get('yoke', []), s): cls[m] = 'yoke'
        elif matches(rule.get('base', []), s): cls[m] = 'base'
    zones = rule.get('zones')          # {"base": [z0, z1], "yoke": [...], "head": [...]} on mesh centres, SOURCE frame
    if zones:
        for m in meshes:
            if m in cls: continue
            mn, mx = world_bbox([m]); cz = (mn.z + mx.z) / 2
            for part, (z0, z1) in zones.items():
                if z0 <= cz <= z1: cls[m] = part; break
    if rule.get('yoke_biggest'):      # the largest unclassified mesh by bbox volume is the yoke (the arch of an LED mover)
        rest = [m for m in meshes if m not in cls]
        if rest:
            def vol0(m):
                a, b = world_bbox([m]); d = b - a; return d.x * d.y * d.z
            cls[max(rest, key=vol0)] = 'yoke'
    if rule.get('auto', True):
        rest = [m for m in meshes if m not in cls]
        if rest:
            def vol(m):
                a, b = world_bbox([m]); d = b - a; return d.x * d.y * d.z
            big = max(rest, key=vol)
            hmn, hmx = world_bbox([big]); hc = (hmn.z + hmx.z) / 2
            up = rule.get('mount', 'hang') == 'hang'
            for m in rest:
                mn, mx = world_bbox([m])
                if m is big: cls[m] = 'head'
                elif up and mn.z >= hmx.z - 0.01: cls[m] = 'base'       # wholly above the head: clamp
                elif (not up) and mx.z <= hmn.z + 0.01: cls[m] = 'base' # wholly below: floor base
                elif up and mx.z > hc and (mn.x < hmn.x or mx.x > hmx.x or mn.y < hmn.y or mx.y > hmx.y): cls[m] = 'yoke'
                elif (not up) and mn.z < hc and (mn.x < hmn.x or mx.x > hmn.x or mn.y < hmn.y or mx.y > hmx.y): cls[m] = 'yoke'
                else: cls[m] = 'head'
    else:
        for m in meshes: cls.setdefault(m, rule.get('rest', 'head'))   # 'rest': where unmatched meshes go when auto is off
    return cls

def join(objs, name):
    for o in bpy.context.scene.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name; o.data.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o

def merge_materials(o, keep_textured=True):
    """materials with the same rounded base colour and no texture collapse to one slot"""
    slots = list(o.material_slots)
    if not slots: return
    key_of = {}
    for i, s in enumerate(slots):
        m = s.material
        if m is None: key_of[i] = ('none',); continue
        tex = None
        bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if m.node_tree else None
        col = tuple(round(c, 1) for c in (bsdf.inputs['Base Color'].default_value[:3] if bsdf else m.diffuse_color[:3]))
        if bsdf:
            lnk = bsdf.inputs['Base Color'].links
            if lnk and lnk[0].from_node.type == 'TEX_IMAGE' and lnk[0].from_node.image: tex = lnk[0].from_node.image.name
        key_of[i] = ('tex', tex) if tex else ('col', col)
    first = {}
    remap = {}
    for i, k in key_of.items():
        if k in first: remap[i] = first[k]
        else: first[k] = i; remap[i] = i
    for p in o.data.polygons: p.material_index = remap[p.material_index]
    # drop unused slots (highest index first)
    used = {p.material_index for p in o.data.polygons}
    for i in sorted(range(len(slots)), reverse=True):
        if i not in used:
            o.active_material_index = i
            bpy.ops.object.material_slot_remove({'object': o}) if False else None
    # material_slot_remove needs context; rebuild slots instead
    mats = [slots[i].material for i in sorted(used)]
    idx = {i: n for n, i in enumerate(sorted(used))}
    for p in o.data.polygons: p.material_index = idx[p.material_index]
    o.data.materials.clear()
    for m in mats: o.data.materials.append(m)

def decimate(o, budget):
    n = tri_count(o)
    if n <= budget: return n
    md = o.modifiers.new('dec', 'DECIMATE'); md.ratio = budget / n; md.use_collapse_triangulate = True
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=md.name)
    return tri_count(o)

def set_origin(o, point):
    """move the object's origin to a world point without moving the geometry"""
    d = o.matrix_world.inverted() @ Vector(point)
    o.data.transform(Matrix.Translation(-d))
    o.matrix_world = o.matrix_world @ Matrix.Translation(d)

def build(name, rule):
    src = os.path.join(SRC, rule.get('source', name + '.glb'))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)
    global CHAIN
    CHAIN = {o: chain_of(o) for o in bpy.context.scene.objects if o.type == 'MESH'}
    # flatten: apply every transform, drop empties
    for o in list(bpy.context.scene.objects):
        if o.type == 'MESH':
            if o.data.users > 1: o.data = o.data.copy()
            o.select_set(True); bpy.context.view_layer.objects.active = o
            mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    for o in list(bpy.context.scene.objects):
        if o.type == 'MESH':
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and len(o.data.polygons)]
    for o in list(bpy.context.scene.objects):
        if o.type != 'MESH' or not len(o.data.polygons): bpy.data.objects.remove(o)
    if 'clip' in rule:                    # {"x": [lo, hi], ...} in the SOURCE frame: vertices outside are deleted (stray fragments)
        for o in meshes:
            bm = bmesh.new(); bm.from_mesh(o.data)
            kill = [v for v in bm.verts if any(not (lo <= (o.matrix_world @ v.co)['xyz'.index(ax)] <= hi) for ax, (lo, hi) in rule['clip'].items())]
            if kill: bmesh.ops.delete(bm, geom=kill, context='VERTS')
            bm.to_mesh(o.data); bm.free()
        meshes = [o for o in meshes if len(o.data.polygons)]
    cls = classify(meshes, rule)          # in the SOURCE frame: zones and the auto heuristic read source z
    if rule.get('flip'):                  # models drawn with the clamp at the bottom: turn them over now
        for o in meshes: o.data.transform(Matrix.Rotation(math.pi, 4, 'X'))
    if 'rot' in rule:                     # [axis, degrees]
        for o in meshes: o.data.transform(Matrix.Rotation(math.radians(rule['rot'][1]), 4, rule['rot'][0].upper()))
    parts = {}
    for m, c in cls.items():
        if c == 'drop': bpy.data.objects.remove(m); continue
        parts.setdefault(c, []).append(m)
    if 'head' not in parts and rule.get('single'): parts['head'] = parts.pop('base')
    if 'head' not in parts: raise RuntimeError(name + ': no head')
    objs = {}
    for c in ('head', 'yoke', 'base'):
        if c in parts: objs[c] = join(parts[c], c)
    # scale to the real size
    allo = list(objs.values())
    mn, mx = world_bbox(allo)
    s = 1.0
    if 'scale' in rule: s = rule['scale']
    elif 'size' in rule:   # [axis, metres]: scale so that extent along axis is metres
        ax, target = rule['size']; cur = (mx - mn)['xyz'.index(ax)]; s = target / cur
    if abs(s - 1) > 1e-6:
        for o in allo: o.data.transform(Matrix.Scale(s, 4))
    mn, mx = world_bbox(allo)
    # hang point -> origin: top centre (hang) or bottom centre (floor); the base's own bbox if there is one
    ref = objs.get('base') or objs.get('yoke') or objs['head']
    bmn, bmx = world_bbox([ref])
    hang = rule.get('mount', 'hang') == 'hang'
    hp = Vector(((bmn.x + bmx.x) / 2, (bmn.y + bmx.y) / 2, bmx.z if hang else mn.z))
    if 'hang_point' in rule: hp = Vector(rule['hang_point'])
    for o in allo: o.data.transform(Matrix.Translation(-hp))
    # pivots: pan axis = vertical line through the hang point; tilt axis = through the head centre at the yoke's trunnion height
    hmn, hmx = world_bbox([objs['head']])
    headc = (hmn + hmx) / 2
    tilt = Vector((headc.x, headc.y, rule.get('tilt_z', headc.z)))
    if 'yoke' in objs:
        ymn, ymx = world_bbox([objs['yoke']])
        if 'tilt_z' not in rule:
            # the trunnions are where the yoke arms meet the head: use the yoke's extent clipped to the head
            tilt.z = max(hmn.z, min(hmx.z, (ymn.z + ymx.z) / 2 if hang else (ymn.z + ymx.z) / 2))
    # budgets and materials
    counts = {}
    for c, o in objs.items():
        merge_materials(o)
        counts[c] = decimate(o, rule.get('budget', {}).get(c, {'head': 3000, 'yoke': 800, 'base': 600}[c]))
    # origins and parenting
    pan = Vector((0, 0, 0))
    if 'base' in objs: set_origin(objs['base'], pan)
    if 'yoke' in objs: set_origin(objs['yoke'], pan)
    set_origin(objs['head'], tilt)
    if 'base' in objs and 'yoke' in objs: objs['yoke'].parent = objs['base']; objs['yoke'].matrix_parent_inverse = objs['base'].matrix_world.inverted()
    if 'yoke' in objs: objs['head'].parent = objs['yoke']; objs['head'].matrix_parent_inverse = objs['yoke'].matrix_world.inverted()
    elif 'base' in objs: objs['head'].parent = objs['base']; objs['head'].matrix_parent_inverse = objs['base'].matrix_world.inverted()
    # lens: a thin disc mesh at the lens centre, named 'lens'.  Its local +Y (Blender) = out of the lens,
    # which the Y-up export turns into local -Z: the three.js 'look' direction.  The game can also light it up.
    front = rule.get('front', '-y')   # which side of the head the lens is on, in the SOURCE frame
    ax = 'xyz'.index(front[1]); sign = -1 if front[0] == '-' else 1
    lens = Vector(headc); lens[ax] = hmx[ax] if sign > 0 else hmn[ax]
    other = [i for i in range(3) if i != ax]
    rad = rule.get('lens_r', 0.45 * min((hmx - hmn)[other[0]], (hmx - hmn)[other[1]]))
    bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, radius=rad, segments=24)
    bm.transform(Matrix.Rotation(math.radians(90), 4, 'X'))   # circle in XY (normal +Z) -> normal +Y
    me = bpy.data.meshes.new('lens'); bm.to_mesh(me); bm.free()
    lo = bpy.data.objects.new('lens', me); bpy.context.scene.collection.objects.link(lo)
    lm = bpy.data.materials.new('lens'); lm.use_nodes = True
    lb = lm.node_tree.nodes.get('Principled BSDF')
    if lb: lb.inputs['Base Color'].default_value = (0.05, 0.05, 0.06, 1); lb.inputs['Roughness'].default_value = 0.2
    me.materials.append(lm)
    want = Vector((0, 0, 0)); want[ax] = sign
    lo.matrix_world = Matrix.Translation(lens) @ Vector((0, 1, 0)).rotation_difference(want).to_matrix().to_4x4()
    lo.parent = objs['head']; lo.matrix_parent_inverse = objs['head'].matrix_world.inverted()
    # export
    for o in bpy.context.scene.objects: o.select_set(True)
    out = os.path.join(OUT, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
                              export_materials='EXPORT', export_image_format='AUTO')
    mn, mx = world_bbox(allo)
    print(f"FIXTURE {name}: parts {list(objs)} lens_r {round(rad,3)} tris {counts} dims {[round(v,3) for v in (mx-mn)]} "
          f"hang {'top' if hang else 'floor'} tilt_z {round(tilt.z,3)} mats {[len(o.data.materials) for o in objs.values()]} -> {os.path.getsize(out)//1024} KB")

for name, rule in RULES.items():
    if ONLY and name not in ONLY: continue
    try: build(name, rule)
    except Exception as e:
        import traceback; traceback.print_exc(); print(f"FIXTURE {name}: FAILED {e}")
