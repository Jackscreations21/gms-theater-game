# Turn the Midtown Atlanta scan into a theatre house for THE HOUSE.
#
#   1. delete the "Free Chapel" projection screen, its scanned frame, the screen glow baked on the
#      wall behind it, and the two freestanding masking slabs (and braces) upstage
#   2. replace the brown proscenium curtains with a solid proscenium wall in the house-wall colour;
#      brown scan faces downstage of the wall are recoloured to wall grey
#   3. open a fly tower over the stage (scan geometry above FLY_CUT removed, walls + roof to FLY_TOP)
#   4. back wall: tiled from a clean crop of the scanned brick (assets/source/midtown/brick_tile.png)
#   5. fill the holes the scan never captured: house ceiling, wall-top slits, deck and floor gaps
#   6. matte the mirror-glossy floor pieces, decimate the 16k-face speaker boxes
#   7. second pass (2026-10-10, from an inside-out raycast audit): close the void east of the
#      stage-right wall and the slits under the wall-top fills, delete the valance scraps and
#      curtain-leg stubs the first pass missed, match the tiled brick to the scanned brick and
#      make it repeat without mirroring, soften the fill mottle, grey the pure-black speakers
#
# Coordinates are Blender world, Z up; the stage is toward -Y, the house toward +Y.
# Run: blender -b --factory-startup --python midtown_theatre.py -- <scene.gltf> <out.glb>
import bpy, bmesh, sys, os
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, dst = argv[0], argv[1]
SRC_DIR = os.path.dirname(os.path.abspath(src))

# Layout constants (measured with tools/blender/midtown_probe.py).
PROS_Y = -2.30            # proscenium wall plane, just downstage of the scanned curtain legs (y ~ -2.5)
OPEN_X0, OPEN_X1 = -4.30, 4.30   # proscenium opening, inside edges of the old legs
OPEN_TOP = 5.20           # opening height above the house floor
PIER_X0, PIER_X1 = -6.6, 6.4     # piers run past the stage side walls (x -5.94 / +5.62) and behind the
                                 # house's return walls: at their old width a slit beside each pier
                                 # showed the brick (left) and the void panel (right) from the house
FLY_CUT = 6.20            # scan geometry above this, upstage of the wall, is removed
FLY_TOP = 16.0            # fly tower roof
BACK_Y = -8.90            # the plane of the real scanned brick (y -8.85..-8.98), so the fill is flush with it
BRICK_REAL_X = -4.0       # real scanned brick is kept for x < this, below FLY_CUT
X0, X1, Y0, Y1 = -9.8, 10.0, -9.1, 14.9   # outer box just outside the scan
HOUSE_TOP = 8.05          # house ceiling
SKIRT_Z = 2.5             # house wall-top fills start here: above every doorway (tallest ~2.4 m), below the
                          # slits the raycast audit found at 2.6-3.3 m
VOID_Y1 = 3.6             # the east void (x 6..10, y -3.8..1.5) is outside the scanned walls; closed to here

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
rng = np.random.default_rng(7)

for n in ('Object_2', 'Object_3'):       # the logo screen overlay
    o = bpy.data.objects.get(n)
    if o: bpy.data.objects.remove(o, do_unlink=True)
# The two speaker arrays over the proscenium and their fly bar (Object_16..24, the only users of
# Material.002): Jack marked them for deletion in the markup tool (2026-10-11). The game hangs
# its own PA.
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.material_slots
          and o.material_slots[0].material and o.material_slots[0].material.name.startswith('Material.002')]:
    bpy.data.objects.remove(o, do_unlink=True)

def meshes():
    return [o for o in bpy.context.scene.objects if o.type == 'MESH']

def tex_of(mat):
    if not mat or not mat.use_nodes: return None
    return next((n.image for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image), None)

cache = {}
def pixels(img):
    if img.name not in cache:
        w, h = img.size
        a = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(a)
        cache[img.name] = [a.reshape(h, w, 4), False]
    return cache[img.name]

def sample(arr, uv):
    h, w = arr.shape[:2]
    x = min(w - 1, int((uv[0] % 1.0) * w)); y = min(h - 1, int((uv[1] % 1.0) * h))
    return arr[y, x, :3]

def face_colour(o, poly):
    img = tex_of(o.material_slots[0].material) if o.material_slots else None
    uvl = o.data.uv_layers.active
    if img is None or uvl is None: return None
    uvs = [uvl.data[li].uv for li in poly.loop_indices]
    return sample(pixels(img)[0], sum(uvs, Vector((0, 0))) / len(uvs))

def face_colours(o, poly):
    img = tex_of(o.material_slots[0].material) if o.material_slots else None
    uvl = o.data.uv_layers.active
    if img is None or uvl is None: return []
    arr = pixels(img)[0]
    uvs = [uvl.data[li].uv.copy() for li in poly.loop_indices]
    return [sample(arr, u) for u in uvs + [sum(uvs, Vector((0, 0))) / len(uvs)]]

def brown(c):
    r, g, b = c; mx = max(r, g, b); mn = min(r, g, b)
    return mx > 0.015 and r >= g * 0.98 and r > b * 1.12 and (mx - mn) / mx > 0.10

def stats(pred):
    cols = []
    for o in meshes():
        mw = o.matrix_world; n3 = mw.to_3x3()
        for p in o.data.polygons:
            c = face_colour(o, p)
            if c is not None and pred(mw @ p.center, (n3 @ p.normal).normalized(), c):
                cols.append(c)
    cols = np.array(cols) if cols else np.full((1, 3), 0.1)
    return np.median(cols, axis=0), len(cols)

# Measure colours before anything is edited.
# The house walls either side of the proscenium: what the proscenium wall should match.
WALL = stats(lambda p, n, c: -2.0 < p.y < 2.5 and 5.9 < abs(p.x) < 8.8 and 1.0 < p.z < 6.0 and abs(n.z) < 0.3
             and not brown(c))
CEIL = stats(lambda p, n, c: p.z > 6.5 and n.z < -0.6)
DECK = stats(lambda p, n, c: -4 <= p.x <= 4 and -8 <= p.y <= -1 and 0.5 <= p.z <= 1.2 and n.z > 0.9)
HOUSE = stats(lambda p, n, c: p.y > 2.0 and p.z < 0.3 and n.z > 0.9)
# The scanned brick that stays (x < BRICK_REAL_X): the tiled brick is toned to match it.
BRICK = stats(lambda p, n, c: p.x < BRICK_REAL_X and p.y < -8.5 and 0.9 < p.z < 6.0 and n.y > 0.6)
for k, v in (('WALL', WALL), ('CEIL', CEIL), ('DECK', DECK), ('HOUSE', HOUSE), ('BRICK', BRICK)):
    print("STATS", k, np.round(v[0], 3), "n", v[1])
deck_z = [ (o.matrix_world @ p.center).z for o in meshes() for p in o.data.polygons
           if (lambda c, n: -4 <= c.x <= 4 and -8 <= c.y <= -1 and 0.5 <= c.z <= 1.2 and n.z > 0.9)(
               o.matrix_world @ p.center, (o.matrix_world.to_3x3() @ p.normal).normalized()) ]
DECK_Z = float(np.median(deck_z)) if deck_z else 0.82
print("DECK_Z", round(DECK_Z, 3))

# 1-3. Deletions, decided per face from its world centre, normal and photo colour.
def doomed(c, n, cols):
    if -3.9 <= c.x <= 3.9 and -8.0 <= c.y <= -2.5 and 1.15 <= c.z <= 5.7: return 'screen'
    if -4.2 <= c.x <= 4.2 and c.y < -7.0 and 0.85 <= c.z <= 6.0: return 'glow'
    # The black upstage wall left of the real brick (x > 4.2): the brick plane replaces it.
    if 4.2 < c.x <= X1 and c.y < -8.0 and 0.85 <= c.z <= FLY_CUT and n.y > 0.6: return 'blackwall'
    if 3.6 <= abs(c.x) <= 6.2 and -8.6 <= c.y <= -4.2 and 0.9 <= c.z <= 7.5 and abs(n.z) < 0.5: return 'slab'
    if c.y < PROS_Y - 0.05 and c.z > FLY_CUT: return 'fly'
    # Flat ceiling fragments left just under the fly cut (the real header's soffit at z 6.19).
    if c.y < PROS_Y - 0.05 and c.z > 5.95 and abs(n.z) > 0.8: return 'soffit'
    # Curtain-leg scraps right behind the piers (not brown enough to be caught below); the stage
    # side walls sit at x -5.94 / +5.62, so the band stops short of them.
    if -3.15 <= c.y <= PROS_Y + 0.25 and 0.85 <= c.z <= 7.5 and (-5.85 <= c.x <= OPEN_X0 or OPEN_X1 <= c.x <= 5.55):
        return 'legs'
    # Valance scraps above the opening, just upstage of the wall: single-face shards at the
    # opening's top corners that read as black triangles from the house.
    if -3.1 <= c.y <= PROS_Y + 0.25 and 4.9 <= c.z <= FLY_CUT and abs(c.x) <= 6.5: return 'valance'
    in_pros = -4.5 <= c.y <= 1.0 and 0.85 <= c.z <= 7.5 and abs(c.x) <= 6.5 and (abs(c.x) >= 2.6 or c.z >= 4.0)
    if in_pros and c.y <= PROS_Y + 0.25 and sum(brown(k) for k in cols) >= 2: return 'curtain'
    return None

counts = {}
for o in meshes():
    mw = o.matrix_world; n3 = mw.to_3x3()
    kill = []
    for p in o.data.polygons:
        why = doomed(mw @ p.center, (n3 @ p.normal).normalized(), face_colours(o, p))
        if why: kill.append(p.index); counts[why] = counts.get(why, 0) + 1
    if kill:
        bm = bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[bm.faces[i] for i in kill], context='FACES')
        bm.to_mesh(o.data); bm.free()
print("DELETED", counts)

# Stray islands: small disconnected scraps standing on the deck at the pier bases (curtain-leg
# bottoms the band above does not reach, because they sit at the side walls). A box, and the
# most faces an island inside it may have and still be junk; the walls themselves are huge islands.
STRAY = [(-6.6, -3.8, -3.6, -2.5, 0.7, 2.6, 12), (3.8, 6.6, -3.6, -2.5, 0.7, 2.6, 12)]
stray = 0
for o in meshes():
    me = o.data; mw = o.matrix_world
    n = len(me.vertices)
    if n < 20: continue
    co = np.empty(n * 3, np.float32); me.vertices.foreach_get('co', co)
    M = np.array(mw); W = co.reshape(n, 3) @ M[:3, :3].T + M[:3, 3]
    parent = list(range(n))
    def find(a):
        while parent[a] != a: parent[a] = parent[parent[a]]; a = parent[a]
        return a
    ek = np.empty(len(me.edges) * 2, np.int32); me.edges.foreach_get('vertices', ek)
    for a, b in ek.reshape(-1, 2):
        ra, rb = find(a), find(b)
        if ra != rb: parent[ra] = rb
    roots = np.array([find(i) for i in range(n)])
    proot = roots[[p.vertices[0] for p in me.polygons]]
    kill = []
    for r in np.unique(proot):
        fm = proot == r; nf = int(fm.sum())
        P = W[roots == r]; mn, mx = P.min(0), P.max(0)
        for x0, x1, y0, y1, z0, z1, maxf in STRAY:
            if nf <= maxf and mn[0] >= x0 and mx[0] <= x1 and mn[1] >= y0 and mx[1] <= y1 and mn[2] >= z0 and mx[2] <= z1:
                kill.extend(np.nonzero(fm)[0].tolist()); break
    if kill:
        bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[bm.faces[i] for i in kill], context='FACES')
        bm.to_mesh(me); bm.free(); stray += len(kill)
print("STRAY faces deleted", stray)

# Brown scan faces left downstage of the wall (proscenium returns, header) -> wall grey.
def raster(mask, P):
    h, w = mask.shape
    for i in range(1, len(P) - 1):
        (x0, y0), (x1, y1), (x2, y2) = P[0], P[i], P[i + 1]
        bx0 = max(0, int(min(x0, x1, x2)) - 2); bx1 = min(w, int(max(x0, x1, x2)) + 3)
        by0 = max(0, int(min(y0, y1, y2)) - 2); by1 = min(h, int(max(y0, y1, y2)) + 3)
        if bx1 <= bx0 or by1 <= by0: continue
        ys, xs = np.mgrid[by0:by1, bx0:bx1] + 0.5
        d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
        if abs(d) < 1e-9: continue
        l0 = ((y1 - y2) * (xs - x2) + (x2 - x1) * (ys - y2)) / d
        l1 = ((y2 - y0) * (xs - x2) + (x0 - x2) * (ys - y2)) / d
        pad = 2.5 / max(1.0, min(abs(d) ** 0.5, 50))
        mask[by0:by1, bx0:bx1] |= (l0 >= -pad) & (l1 >= -pad) & (1 - l0 - l1 >= -pad)

recoloured = 0
for o in meshes():
    img = tex_of(o.material_slots[0].material) if o.material_slots else None
    uvl = o.data.uv_layers.active
    if img is None or uvl is None: continue
    entry = pixels(img); arr = entry[0]; h, w = arr.shape[:2]
    mask = np.zeros((h, w), dtype=bool); mw = o.matrix_world
    for p in o.data.polygons:
        c = mw @ p.center
        if not (-4.5 <= c.y <= 1.0 and 0.85 <= c.z <= 7.5 and abs(c.x) <= 6.5 and (abs(c.x) >= 2.6 or c.z >= 4.0)): continue
        if sum(brown(k) for k in face_colours(o, p)) < 2: continue
        recoloured += 1
        raster(mask, [((uvl.data[li].uv.x % 1) * w, (uvl.data[li].uv.y % 1) * h) for li in p.loop_indices])
    if mask.any():
        px = arr[mask]
        lum = px[:, 0] * 0.2126 + px[:, 1] * 0.7152 + px[:, 2] * 0.0722
        px[:, :3] = np.clip((lum * 0.85)[:, None] * np.array([0.97, 0.98, 1.03], np.float32), 0, 1)
        arr[mask] = px; entry[1] = True
print("RECOLOURED faces", recoloured)
for name, (arr, dirty) in cache.items():
    if dirty:
        img = bpy.data.images[name]; img.pixels.foreach_set(arr.ravel()); img.update(); img.pack(); img.file_format = 'JPEG'

# 6. Speakers and glossy floor.
for o in meshes():
    m0 = o.material_slots[0].material if o.material_slots else None
    if len(o.data.polygons) > 15000 and m0 and m0.name.startswith('Material.002'):
        m = o.modifiers.new("dec", 'DECIMATE'); m.ratio = 0.04
        with bpy.context.temp_override(object=o, active_object=o):
            bpy.ops.object.modifier_apply(modifier=m.name)
for m in bpy.data.materials:
    if m.name.endswith('.001') and m.use_nodes:
        b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if b and not b.inputs['Roughness'].is_linked: b.inputs['Roughness'].default_value = 0.75
    # The speaker boxes shipped with a base colour of 0.001: pure black under any light.
    if m.name.startswith('Material.002') and m.use_nodes:
        b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if b:
            b.inputs['Base Color'].default_value = (0.05, 0.05, 0.055, 1.0)
            b.inputs['Roughness'].default_value = 0.85

# 4-5. New surfaces. Each is a flat polygon with a tiling texture.
def tile_image(name, rgb, rel, size=512):
    n = rng.normal(0, 1, (size, size)).astype(np.float32)
    for _ in range(8):   # soften into a scan-like mottle (2 passes read as static); np.roll wraps, so it tiles
        n = (n + np.roll(n, 1, 0) + np.roll(n, -1, 0) + np.roll(n, 1, 1) + np.roll(n, -1, 1)) / 5
    n /= n.std() + 1e-6
    a = np.ones((size, size, 4), dtype=np.float32)
    a[..., :3] = np.clip(np.asarray(rgb, np.float32)[None, None, :] * (1 + rel * n[..., None]), 0, 1)
    img = bpy.data.images.new(name, size, size)
    img.pixels.foreach_set(a.ravel()); img.pack(); img.file_format = 'JPEG'
    return img

def material(img, mirror=False):
    mat = bpy.data.materials.get("mat_" + img.name)
    if mat is None:
        mat = bpy.data.materials.new("mat_" + img.name); mat.use_nodes = True
        mat.use_backface_culling = False            # exported doubleSided
        nt = mat.node_tree; bsdf = nt.nodes["Principled BSDF"]
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img
        if mirror: t.extension = 'MIRROR'
        nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
        bsdf.inputs['Roughness'].default_value = 0.9
    return mat

def quad(name, pts, mat, tile=(2.0, 2.0)):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    f = bm.faces.new([bm.verts.new(p) for p in pts])
    uv = bm.loops.layers.uv.new()
    f.normal_update(); nrm = f.normal
    ax = max(range(3), key=lambda i: abs(nrm[i]))
    a, b = [i for i in range(3) if i != ax]
    for l in f.loops:
        l[uv].uv = (l.vert.co[a] / tile[0], l.vert.co[b] / tile[1])
    bm.to_mesh(me); bm.free(); me.materials.append(mat)
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)

def box_x(name, x, ya, yb, za, zb, mat, tile=(3, 3)):   # wall in a constant-x plane
    quad(name, [(x, ya, za), (x, yb, za), (x, yb, zb), (x, ya, zb)], mat, tile)
def box_y(name, y, xa, xb, za, zb, mat, tile=(3, 3)):   # wall in a constant-y plane
    quad(name, [(xa, y, za), (xb, y, za), (xb, y, zb), (xa, y, zb)], mat, tile)
def box_z(name, z, xa, xb, ya, yb, mat, tile=(3, 3)):   # floor / ceiling
    quad(name, [(xa, ya, z), (xb, ya, z), (xb, yb, z), (xa, yb, z)], mat, tile)

m_wall = material(tile_image("fill_wall", WALL[0], 0.12))
m_ceil = material(tile_image("fill_ceiling", CEIL[0], 0.15))
m_deck = material(tile_image("fill_deck", DECK[0], 0.12))
m_house = material(tile_image("fill_house_floor", HOUSE[0], 0.15))
src_brick = bpy.data.images.load(os.path.join(SRC_DIR, "brick_tile.png"))
# The crop carries a conduit elbow in its top-right corner, which a tiled wall repeats as a row
# of brackets: keep the conduit-free left 760 px. Then flatten the photo's lighting falloff
# (divide by a wide blur) so the tiling does not pulse.
bw_, bh_ = src_brick.size
ba = np.empty(bw_ * bh_ * 4, np.float32); src_brick.pixels.foreach_get(ba); ba = ba.reshape(bh_, bw_, 4)
BRICK_CROP_W = min(760, bw_)
ba = np.ascontiguousarray(ba[:, :BRICK_CROP_W]); bw_ = BRICK_CROP_W
def blur(a, r):                      # wrapped box blur, both axes
    for axis in (0, 1):
        n = a.shape[axis]
        pad = np.concatenate([a.take(range(n - r, n), axis), a, a.take(range(0, r), axis)], axis)
        c = np.cumsum(pad, axis)
        c = np.concatenate([np.zeros_like(c.take([0], axis)), c], axis)
        a = (c.take(range(2 * r + 1, 2 * r + 1 + n), axis) - c.take(range(0, n), axis)) / (2 * r + 1)
    return a
lum = ba[..., :3].mean(-1)
low = blur(lum, 90)
ba[..., :3] = np.clip(ba[..., :3] * (lum.mean() / np.maximum(low, 1e-3))[..., None], 0, 1)
# Tone it to the scanned brick it butts against (measured above), channel by channel.
ba[..., :3] = np.clip(ba[..., :3] * (BRICK[0] / np.maximum(ba[..., :3].mean((0, 1)), 1e-3))[None, None, :], 0, 1)
# Make it repeat without mirroring (MIRROR folded the mortar lines into butterflies): cross-fade
# each edge into the opposite edge over an eighth of the size, then drop the faded-over band.
def seamless(a, axis, frac=0.125):
    n = a.shape[axis]; b = max(2, int(n * frac)); keep = n - b
    t = (np.arange(b, dtype=np.float32) + 0.5) / b
    shape = [1, 1, 1]; shape[axis] = b; t = t.reshape(shape)
    head = a.take(range(0, b), axis); tail = a.take(range(keep, n), axis)
    out = a.take(range(0, keep), axis).copy()
    idx = [slice(None)] * 3; idx[axis] = slice(0, b)
    out[tuple(idx)] = head * t + tail * (1 - t)
    return out
ba = seamless(seamless(ba, 1), 0)
bh_, bw_ = ba.shape[:2]
brick = bpy.data.images.new("brick_tile", bw_, bh_)
brick.pixels.foreach_set(np.ascontiguousarray(ba).ravel()); brick.update(); brick.pack(); brick.file_format = 'JPEG'
m_brick = material(brick, mirror=False)
BRICK_TILE = (2.5 * BRICK_CROP_W / src_brick.size[0], 0)   # the full crop was 2.5 m wide
BRICK_TILE = (BRICK_TILE[0], BRICK_TILE[0] * bh_ / bw_)

# Proscenium wall: two piers and a header round the opening, then full width above the house ceiling.
box_y("pros_pier_l", PROS_Y, PIER_X0, OPEN_X0, DECK_Z - 0.02, HOUSE_TOP, m_wall)
box_y("pros_pier_r", PROS_Y, OPEN_X1, PIER_X1, DECK_Z - 0.02, HOUSE_TOP, m_wall)
box_y("pros_header", PROS_Y, OPEN_X0, OPEN_X1, OPEN_TOP, HOUSE_TOP, m_wall)
box_y("pros_upper", PROS_Y, X0, X1, HOUSE_TOP, FLY_TOP, m_ceil)
# Fly tower: side walls and back wall up to the roof, and the roof.
box_x("fly_wall_w", X0, Y0, PROS_Y, 3.5, FLY_TOP, m_ceil)
box_x("fly_wall_e", X1, Y0, PROS_Y, 3.5, FLY_TOP, m_ceil)
box_z("fly_roof", FLY_TOP, X0, X1, Y0, PROS_Y, m_ceil)
# Back wall: brick everywhere except the real scanned brick (x < BRICK_REAL_X, below FLY_CUT).
# The low panel starts 5 cm past the real brick's end (x -3.96) so the two planes barely overlap;
# the tower's back wall behind both runs to the floor, so the seam between them cannot leak.
box_y("back_brick_lo", BACK_Y, BRICK_REAL_X + 0.05, X1, DECK_Z - 0.02, FLY_CUT, m_brick, BRICK_TILE)
box_y("back_brick_hi", BACK_Y, X0, X1, FLY_CUT, FLY_TOP, m_brick, BRICK_TILE)
box_y("back_tower", Y0, X0, X1, -0.06, FLY_TOP, m_ceil)
# East of the stage-right wall (x > 6, y -3.8..1.5) the scan has nothing at all: the house's
# front-right wall runs diagonally and the stage's side wall stops at y -3.9. Close it from the
# floor to the fills above; nothing inside the house can see this panel except through slits.
box_x("void_e", X1, Y0, VOID_Y1, -0.06, 3.5, m_ceil)
# Stage-left wing doorways have no lintels in the scan (a wedge of sky above each frame): a strip
# behind them, above door height. The front-left vestibule (x -9.5..-7.3, y -2..3.3, entered
# through the house's front-left exit) has gaps in its outer wall at every height: a full panel.
box_x("wing_w_top", X0, -6.0, PROS_Y, 2.3, 3.5, m_ceil)
box_x("front_w", X0, PROS_Y, 3.5, -0.06, 3.5, m_ceil)
# House: ceiling, wall-top skirts (above SKIRT_Z so the doorways stay open), floor under the scan.
box_z("house_ceiling", HOUSE_TOP, X0, X1, PROS_Y, Y1, m_ceil)
box_x("house_skirt_w", X0, PROS_Y, Y1, SKIRT_Z, HOUSE_TOP, m_ceil)
box_x("house_skirt_e", X1, PROS_Y, Y1, SKIRT_Z, HOUSE_TOP, m_ceil)
box_y("house_skirt_s", Y1, X0, X1, SKIRT_Z, HOUSE_TOP, m_ceil)
box_z("house_floor", -0.06, X0, X1, Y0, Y1, m_house)
# Skirting: the scanned side walls do not reach the floor everywhere (a slit at the base behind
# the front rows, and the cavity under the raked rear floor is open to the sides). The side walls
# carry no doorways between y 2 and the rear corners, and from y 8 back the rake is above 0.8 m
# and the rear corners leak up to 2.3 m, so the rear halves rise to the skirt. The rear wall's
# doorways sit on the top of the rake (threshold ~1.5 m), so the rear strip stays low across
# the two door zones only.
box_x("skirting_w", X0, 2.0, 8.0, -0.06, 0.35, m_ceil)
box_x("skirting_e", X1, 3.5, 8.0, -0.06, 0.35, m_ceil)
box_x("skirting_w_rear", X0, 8.0, Y1, -0.06, SKIRT_Z, m_ceil)
box_x("skirting_e_rear", X1, 8.0, Y1, -0.06, SKIRT_Z, m_ceil)
for nm, xa, xb, zt in (("skirting_s_w", X0, -5.8, SKIRT_Z), ("skirting_s_doorw", -5.8, -3.3, 1.3), ("skirting_s_mid", -3.3, 3.3, SKIRT_Z),
                       ("skirting_s_doore", 3.3, 5.8, 1.3), ("skirting_s_e", 5.8, X1, SKIRT_Z)):
    box_y(nm, Y1, xa, xb, -0.06, zt, m_ceil)
# Stage deck under the scanned deck (2 cm down: 5 mm z-fought at distance), outline following the
# deck and its chamfered apron.
zd = DECK_Z - 0.02
me = bpy.data.meshes.new("deck_fill"); bm = bmesh.new()
pts = [(-9.5, -9.0), (9.9, -9.0), (9.9, -3.9), (5.6, -3.9), (5.6, -0.45), (4.2, 0.35),
       (-4.3, 0.35), (-5.8, -0.45), (-5.8, -3.9), (-9.5, -3.9)]
f = bm.faces.new([bm.verts.new((x, y, zd)) for x, y in pts]); uv = bm.loops.layers.uv.new()
for l in f.loops: l[uv].uv = (l.vert.co.x / 2, l.vert.co.y / 2)
bm.to_mesh(me); bm.free(); me.materials.append(m_deck)
bpy.context.scene.collection.objects.link(bpy.data.objects.new("deck_fill", me))

tot = sum(len(o.data.polygons) for o in meshes())
mats = {s.material.name for o in meshes() for s in o.material_slots if s.material}
print("FACES total:", tot, "MATERIALS:", len(mats))
os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=88)
print("EXPORTED", dst)
