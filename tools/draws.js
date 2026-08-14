/* PROBE — WHAT DOES THE EMPTY HOUSE ACTUALLY SUBMIT?  (RULING DX)

   The 2026-08-14 audit read the empty Palace at 205-310 meshes submitted per
   eye — 410-620 GL draw calls a frame, because there is no multiview on this
   renderer and every eye is a full second pass — against a Quest comfort band
   of roughly 100-200.  Triangles were never the problem (125-135k an eye is
   comfortable); the count of DRAWS is.  That number lived in a scratchpad
   script, so it could not be re-read after a change, and a performance round
   whose headline figure cannot be re-measured is a round of opinions.

   This is that measurement, as a probe.  It boots the built file the way the
   suites do, stands the player at a handful of named viewpoints, runs real
   frames so the real gates (the room cull, the glow gate, the light gate) have
   run, and then walks the graph exactly the way r128 walks it in
   projectObject (three.js r128:17954-18024):

     visible === false prunes the whole subtree, above the recursion
     layers.test(camera.layers) decides whether this node is considered
     a Mesh / Line / Points is submitted if frustumCulled is false, or if its
       geometry bounding sphere transformed by matrixWorld hits the frustum
     one push per VISIBLE material — an array material pushes once per
       geometry group whose material is visible, which is why a two-material
       mesh is two draws and not one

   WHY IT CANNOT PRINT A CONFIDENT LIE.  TRAPS is full of probes that measured
   the wrong thing and said so firmly.  The culling walk here is parameterised
   by its frustum test, and two self-checks run before any view is measured:

     with a test that always PASSES, the walk must agree exactly with a second,
       independently written count (traverseVisible plus the layer and material
       rules).  A walk that loses or double-counts a branch fails here.
     with a test that always FAILS, the walk must submit exactly the drawables
       that carry frustumCulled === false, counted independently.  This is the
       one that catches the honest mistake: 26 sites in this file carry the
       r128 instanced-bounding-sphere workaround, and a simulation that forgets
       frustumCulled would quietly under-report every one of them.

   Both self-checks throw.  A probe that judges has to be checkable.  The first
   run of this file failed SELF-CHECK 2 against its own author: the walk asked
   its frustum test about frustumCulled instead of asking above it, the way
   projectObject does, and every uncullable batch in the building was being
   reported as culled.  That is the check earning its place on day one.

   WHAT IT FOUND, AND IT IS NOT WHAT THE PLAN EXPECTED  (2026-08-14, a55bfcd)

   The plan predicted the architecture: walls, mouldings, balcony fronts,
   per-baluster and per-panel pieces in p2b/p2c/p2e/p2g.  It is not the
   architecture.  The architecture is ALREADY MERGED and the merger did its job
   — 124 separate blocks account for 136 draws between them, about 1.1 draws a
   block, which is mergeParts working exactly as ARCHITECTURE.md describes.

   It is the LIGHTING RIG.  39 fixtures, 540 drawables, 62% of everything in
   the building, and 423 of those 540 are the lantern BODIES at 10.8 draws
   each.  From the boot camera the rig is 135 of 350 draws an eye (38.6%);
   from downstage centre facing upstage it is 213 of 321 (66.4%).  The fly
   system is second at 109, and the whole rest of the building is noise.

   So the next bite is a lantern, not a wall — and it is a real bite, because a
   body's ten pieces are barrel, knobs, colour frame, hook clamp and cable,
   none of which is addressed on its own.  What IS addressed is the body as a
   whole (it is a BODIES.mesh — detachable, raycast, hoverable), the yoke
   (pans and tilts), and the lens (recoloured through the LENSM cache), so a
   merge has to stop at those three.  That is PR-sized work and it is stated
   here rather than guessed at, which is the whole point of the file.

     export NODE_PATH=../tests/node_modules
     node draws.js                                                          */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const {JSDOM} = require('jsdom');
const html = fs.readFileSync(path.join(ROOT, 'the-house.html'), 'utf8');
const dom = new JSDOM(html.replace(/<script src=.*?<\/script>/, ''),
                      {runScripts: 'outside-only', pretendToBeVisual: true});
const w = dom.window;
w.HTMLCanvasElement.prototype.getContext = function(){
  const noop = ()=>{};
  if(this.__ctx) return this.__ctx;
  return this.__ctx = {fillRect:noop, fillStyle:'', strokeStyle:'', lineWidth:1, font:'',
    beginPath:noop, moveTo:noop, lineTo:noop, arc:noop, ellipse:noop, stroke:noop, fill:noop,
    save:noop, restore:noop, translate:noop, rotate:noop, scale:noop, drawImage:noop,
    clearRect:noop, createPattern:()=>null, fillText:noop, strokeText:noop, strokeRect:noop,
    rect:noop, arcTo:noop, setLineDash:noop, measureText:()=>({width:100}),
    bezierCurveTo:noop, quadraticCurveTo:noop, closePath:noop, clip:noop, setTransform:noop,
    globalAlpha:1, globalCompositeOperation:'',
    createLinearGradient:()=>({addColorStop:noop}), createRadialGradient:()=>({addColorStop:noop}),
    getImageData:(x,y,ww,hh)=>({data:new Uint8ClampedArray(Math.max(4,ww*hh*4))}), putImageData:noop};
};
const REAL = require('three');
const THREE = Object.create(REAL);
THREE.WebGLRenderer = class {
  constructor(){ const c = w.document.createElement('canvas');
    c.requestPointerLock = ()=>{};
    this.domElement = c; this.shadowMap = {enabled:false, type:0}; }
  setPixelRatio(){} setSize(){}
  render(scene, camera){ scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); }
  /* PMREMGenerator is CORE three.js and RULING DK builds the room environment
     with it at load, so fromScene runs here too.  getClearColor MUTATES its
     target (r128:17534 does target.copy) — a version that returns the argument
     untouched leaves PMREM reading its own module-level WHITE. */
  compile(){}
  getRenderTarget(){ return this._rt || null; }
  setRenderTarget(t){ this._rt = t || null; }
  getClearColor(c){ return c.set(0x000000); }
};
w.THREE = THREE;
w.AudioContext = undefined;
w.requestAnimationFrame = cb => { w.__raf = cb; return 1; };
w.performance = {now: ()=>Date.now()};
if(!w.URL.createObjectURL){ w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {}; }

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g, '');
/* scene, camera, world, D, ROOM_GROUP, SHARED and Player are all CONSTS of the
   eval program and never become window properties.  TRAPS: a const missing
   from this handout arrives as undefined and the probe prints a confident
   wrong answer, so every name is fetched here and checked below. */
w.eval(script + ';window.__P = {scene:scene, camera:camera, world:world, D:D,' +
       ' ROOM_ORDER:ROOM_ORDER, ROOM_GROUP:ROOM_GROUP, SHARED:SHARED, Player:Player,' +
       ' XL:XL, XR:XR, PAL_BACK:PAL_BACK, FOH:FOH, QUALITY:QUALITY,' +
       ' FIXTURES:FIXTURES, FLY:FLY, GOODS:GOODS, BODIES:BODIES, WALKABLE:WALKABLE,' +
       ' STATIC:STATIC, DOORWAYS:DOORWAYS, SEATS:(typeof SEATS === "undefined" ? null : SEATS)};');

const P = w.__P, T = REAL;
for(const k of ['scene','camera','world','D','ROOM_ORDER','ROOM_GROUP','SHARED',
                'Player','XL','XR','PAL_BACK','FOH','QUALITY','FIXTURES','FLY','GOODS',
                'BODIES','WALKABLE','STATIC','DOORWAYS'])
  if(P[k] === undefined) throw new Error('the probe cannot see ' + k + ' — add it to the __P handout');
for(const fn of ['updateRooms','roomsLive','groundAt'])
  if(typeof w[fn] !== 'function') throw new Error('the probe cannot see ' + fn + '() on the window');

function pump(n){
  for(let i = 0; i < n; i++){ const cb = w.__raf; w.__raf = null; if(cb) cb(Date.now() + i*16); }
}
pump(90);
if(w.__fatal) throw new Error('the file did not boot: ' + w.__fatal);

/* ---------------------------------------------------------------------------
   THE WALK.  One implementation, parameterised by its frustum test, so the
   self-checks below exercise the same code the views do.
   ------------------------------------------------------------------------- */
const _sphere = new T.Sphere();

/* how many render-list pushes this object is worth — the array-material branch
   of projectObject is one push per group with a visible material */
function pushesOf(o){
  const m = o.material;
  if(Array.isArray(m)){
    const groups = (o.geometry && o.geometry.groups) || [];
    let n = 0;
    for(const gr of groups){ const gm = m[gr.materialIndex]; if(gm && gm.visible) n++; }
    return n;
  }
  return (m && m.visible) ? 1 : 0;
}
function trisOf(o){
  const g = o.geometry;
  if(!g) return 0;
  const idx = g.index;
  const n = idx ? idx.count/3 : (g.attributes && g.attributes.position ? g.attributes.position.count/3 : 0);
  return n * (o.isInstancedMesh ? o.count : 1);
}
function isDrawable(o){ return !!(o.isMesh || o.isLine || o.isPoints || o.isSprite); }

/* the r128 sphere test.  It is ONLY the frustum question: projectObject reads
   "!object.frustumCulled || _frustum.intersectsObject(object)", so the opt-out
   lives in the walk below, above the test — which is where SELF-CHECK 2 found
   it missing on this probe's first run, and the reason that check exists. */
function inFrustum(o, frustum){
  if(o.isSprite) return frustum.intersectsSprite(o);
  const g = o.geometry;
  if(!g) return false;
  if(!g.boundingSphere) g.computeBoundingSphere();
  if(!g.boundingSphere) return false;
  _sphere.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
  return frustum.intersectsSphere(_sphere);
}

/* THE SIMULATION.  test(obj) stands in for the frustum; camLayers stands in
   for camera.layers.  Returns draws, triangles and a per-object record. */
function walk(root, camLayers, test){
  const out = {draws: 0, tris: 0, objects: []};
  (function rec(o){
    if(o.visible === false) return;              // r128's first line, above the recursion
    if(o.layers.test(camLayers)){
      if(isDrawable(o) && (o.frustumCulled === false || test(o))){
        const n = pushesOf(o);
        if(n > 0){
          out.draws += n;
          out.tris += trisOf(o);
          out.objects.push({o: o, draws: n, tris: trisOf(o)});
        }
      }
    }
    for(const c of o.children) rec(c);
  })(root);
  out.tris = Math.round(out.tris);
  return out;
}

/* ---------------------------------------------------------------------------
   SELF-CHECKS.  Both throw.  See the header.
   ------------------------------------------------------------------------- */
const CAM_LAYERS = P.camera.layers;
P.scene.updateMatrixWorld(true);

/* (1) everything passes the frustum — must agree with an independent count */
let refDraws = 0, refTris = 0, refCulledOff = 0;
P.scene.traverseVisible(o => {
  if(!o.layers.test(CAM_LAYERS)) return;         // traverseVisible has no layer rule
  if(!isDrawable(o)) return;
  const n = pushesOf(o);
  if(n <= 0) return;
  refDraws += n;
  refTris += trisOf(o);
  if(o.frustumCulled === false) refCulledOff += n;
});
refTris = Math.round(refTris);
const all = walk(P.scene, CAM_LAYERS, ()=>true);
if(all.draws !== refDraws || all.tris !== refTris)
  throw new Error('SELF-CHECK 1 FAILED: the walk says ' + all.draws + ' draws / ' + all.tris +
                  ' tris where an independent count says ' + refDraws + ' / ' + refTris +
                  ' — the graph walk is wrong, so no number below can be trusted');

/* (2) nothing passes the frustum — only the uncullable may survive.  This is
   the check that catches a simulation which forgets frustumCulled === false,
   which is exactly the 26 instanced-bounding-sphere workaround sites. */
const none = walk(P.scene, CAM_LAYERS, ()=>false);
if(none.draws !== refCulledOff)
  throw new Error('SELF-CHECK 2 FAILED: with every frustum test failing the walk still submits ' +
                  none.draws + ' draws where exactly ' + refCulledOff +
                  ' carry frustumCulled === false — the frustumCulled opt-out is not being honoured');

/* ---------------------------------------------------------------------------
   THE VIEWS.  Set the player, run real frames (so updatePlayer writes the
   camera off Player exactly as p7 does, and every per-frame gate has run),
   then measure.
   ------------------------------------------------------------------------- */
const VIEWS = [
  {key:'boot',      label:'BOOT CAMERA (stalls centre, facing the stage)',
   pos:[0, 0, 13],      yaw:0,           pitch:0.02},
  {key:'stalls',    label:'A STALLS SEAT, FACING THE STAGE',
   pos:[4.5, 0.2, 8],   yaw:-0.16,       pitch:0.02},
  {key:'upstage',   label:'DOWNSTAGE CENTRE, FACING UPSTAGE',
   pos:[0, 0.4, -1.5],  yaw:Math.PI,     pitch:0.0},
  {key:'toHouse',   label:'ON STAGE, FACING THE HOUSE',
   pos:[0, 0.4, -3],    yaw:0,           pitch:0.02}
];

/* Per EYE, not per desktop window.  A Quest 3 eye is roughly 90 degrees
   vertical on a square-ish panel; the game camera is 60 degrees on whatever
   the window happens to be, which is a NARROWER frustum and therefore the
   flattering number.  Both are printed: the eye figure is the one the budget
   is about, and it is doubled for the two passes a frame costs. */
const EYE_FOV = 90, EYE_ASPECT = 1.0;
const eyeCam = new T.PerspectiveCamera(EYE_FOV, EYE_ASPECT, 0.08, 300);
eyeCam.layers.mask = P.camera.layers.mask;

function frustumFor(cam){
  const m = new T.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  return new T.Frustum().setFromProjectionMatrix(m);
}

/* WHERE A DRAW CAME FROM.  buildRooms() reparents every child of world into
   its room group, so the immediate child of a room group IS the top-level
   thing some builder made — which is the attribution that names a block of
   source rather than a leaf. */
const ROOM_ID = {};
for(const n of P.ROOM_ORDER) ROOM_ID[P.ROOM_GROUP[n].id] = n;
ROOM_ID[P.SHARED.id] = 'shared';

/* MOST OF THE TOP-LEVEL BLOCKS ARE ANONYMOUS GROUPS, and "shared / <Group>"
   naming 45% of a frame is a probe printing a shrug.  Label a nameless block
   by the first named thing INSIDE it — which is the builder's own vocabulary —
   and fall back to its index under the room group so two anonymous blocks are
   never conflated. */
const BLOCK_LABEL = new Map();
function labelTop(top, room, idx){
  if(BLOCK_LABEL.has(top)) return BLOCK_LABEL.get(top);
  let hint = top.name;
  if(!hint){
    const names = [];
    top.traverse(c => { if(c.name && names.length < 3 && names.indexOf(c.name) < 0) names.push(c.name); });
    hint = names.length ? '{' + names.join('+') + '}'
                        : '<' + ((top.geometry && top.geometry.type) || top.type) + ' #' + idx + '>';
  }
  const v = room + ' / ' + hint;
  BLOCK_LABEL.set(top, v);
  return v;
}
function blockOf(o){
  let node = o, room = null, top = o;
  while(node.parent){
    if(ROOM_ID[node.parent.id] !== undefined){ room = ROOM_ID[node.parent.id]; top = node; break; }
    node = node.parent;
    top = node;
  }
  if(!room) return '<not filed into a room>';
  const idx = (room === 'shared' ? P.SHARED : P.ROOM_GROUP[room]).children.indexOf(top);
  return labelTop(top, room, idx);
}
function leafOf(o){
  if(o.name) return o.name;
  let p = o.parent, guard = 0;
  while(p && guard++ < 4){ if(p.name) return p.name + ' > <' + ((o.geometry && o.geometry.type) || o.type) + '>'; p = p.parent; }
  return '<' + ((o.geometry && o.geometry.type) || o.type) + '>';
}

function measure(v){
  P.Player.mode = 'walk';
  P.Player.pos.set(v.pos[0], v.pos[1], v.pos[2]);
  P.Player.yaw = v.yaw; P.Player.pitch = v.pitch;
  P.Player.vel.set(0, 0, 0);
  w.updateRooms(true);
  pump(8);                                       // let every per-frame gate settle
  P.Player.pos.set(v.pos[0], v.pos[1], v.pos[2]);
  P.Player.yaw = v.yaw; P.Player.pitch = v.pitch;
  pump(2);
  P.scene.updateMatrixWorld(true);
  P.camera.updateMatrixWorld(true);
  eyeCam.matrix.copy(P.camera.matrix);
  eyeCam.matrixWorld.copy(P.camera.matrixWorld);
  eyeCam.matrixWorldInverse.copy(eyeCam.matrixWorld).invert();
  eyeCam.updateProjectionMatrix();

  const eye = walk(P.scene, CAM_LAYERS, o => inFrustum(o, frustumFor(eyeCam)));
  const desk = walk(P.scene, CAM_LAYERS, o => inFrustum(o, frustumFor(P.camera)));
  return {eye: eye, desk: desk, rooms: w.roomsLive().join(',')};
}

const RES = {};
console.log('');
console.log('THE BUILT FILE  ' + fs.statSync(path.join(ROOT, 'the-house.html')).size + ' bytes');
console.log('  drawables in the whole scene, ignoring the frustum: ' + refDraws + ' draws, ' +
            refTris + ' tris');
console.log('  of those, ' + refCulledOff + ' carry frustumCulled === false and can never be culled');
console.log('  room culling is ' + (P.QUALITY.rooms ? 'ON' : 'OFF') + ' (QUALITY.rooms)');
console.log('  self-checks: both passed');
console.log('');
console.log('SUBMITTED PER FRAME, EMPTY PALACE, NOTHING LOADED');
console.log('  view                    per eye   x2 eyes    tris/eye    desk cam   rooms drawn');
for(const v of VIEWS){
  const r = measure(v);
  RES[v.key] = r;
  console.log('  ' + v.key.padEnd(22) + String(r.eye.draws).padStart(7) +
              String(r.eye.draws*2).padStart(10) +
              String(r.eye.tris).padStart(12) +
              String(r.desk.draws).padStart(12) + '   ' + r.rooms);
}
console.log('');
for(const v of VIEWS) console.log('  ' + v.key.padEnd(10) + v.label);
console.log('');

/* ---------------------------------------------------------------------------
   WHO IS PAYING.  Two tables per view family: the top-level block a draw
   descends from (which names a builder), and the leaf names inside it.
   ------------------------------------------------------------------------- */
function table(title, rows, limit){
  console.log(title);
  if(!rows.length){ console.log('  NOTHING SUBMITTED AT ALL — which is itself a finding'); return; }
  console.log('  ' + 'block'.padEnd(42) + 'draws'.padStart(7) + 'tris'.padStart(10) + '   share');
  const tot = rows.reduce((a, r)=>a + r.draws, 0);
  for(const r of rows.slice(0, limit))
    console.log('  ' + r.name.slice(0, 40).padEnd(42) + String(r.draws).padStart(7) +
                String(Math.round(r.tris)).padStart(10) +
                ('   ' + (100*r.draws/tot).toFixed(1) + '%').padStart(9));
  if(rows.length > limit)
    console.log('  ' + ('... and ' + (rows.length - limit) + ' more blocks').padEnd(42) +
                String(rows.slice(limit).reduce((a, r)=>a + r.draws, 0)).padStart(7));
  console.log('  ' + 'TOTAL'.padEnd(42) + String(tot).padStart(7));
  console.log('');
}
function group(objects, keyOf){
  const m = {};
  for(const rec of objects){
    const k = keyOf(rec.o);
    const r = m[k] || (m[k] = {name: k, draws: 0, tris: 0, n: 0});
    r.draws += rec.draws; r.tris += rec.tris; r.n++;
  }
  return Object.keys(m).map(k=>m[k]).sort((a, b)=>b.draws - a.draws);
}

for(const v of VIEWS){
  const r = RES[v.key];
  table('TOP CONTRIBUTORS BY BLOCK — ' + v.label + '  (' + r.eye.draws + ' draws/eye)',
        group(r.eye.objects, blockOf), 14);
}
const worst = VIEWS.map(v=>({v: v, r: RES[v.key]})).sort((a, b)=>b.r.eye.draws - a.r.eye.draws)[0];
table('TOP LEAF NAMES — the worst view, ' + worst.v.label,
      group(worst.r.eye.objects, leafOf), 24);

/* AND WHAT IS IN THE BUILDING AT ALL, cull or no cull.  A block that is big
   here but small above is a block the frustum is already handling; a block
   that is big in both is where a merge pays. */
const SCENE_BLOCKS = group(all.objects, blockOf);
table('EVERY BLOCK IN THE SCENE, frustum ignored  (the ceiling on any saving)',
      SCENE_BLOCKS, 18);

/* ---------------------------------------------------------------------------
   AND NAME THEM.  A block called <Group #36> that is 38% of a frame is the
   probe shrugging.  For the biggest blocks, print what they are made OF: the
   world box, the shared-material grouping, and the shape signature of the
   leaves — which is enough to find the builder in src/ by grep.
   ------------------------------------------------------------------------- */
function topOf(o){
  let node = o, top = o;
  while(node.parent){
    if(ROOM_ID[node.parent.id] !== undefined){ top = node; break; }
    node = node.parent; top = node;
  }
  return top;
}
/* WHICH REGISTRY CLAIMS IT.  Almost nothing in the building carries a name —
   the two blocks that are half of every frame are both anonymous Groups — so
   the honest way to say what a block IS is to ask the game's own registries
   which of them holds something inside it.  That also answers the question a
   merge has to answer first: is this thing addressed at runtime? */
const CLAIM = new Map();
function claim(obj, label){
  if(!obj || !obj.isObject3D) return;
  const prev = CLAIM.get(obj);
  if(prev){ if(prev.indexOf(label) < 0) CLAIM.set(obj, prev + '+' + label); return; }
  CLAIM.set(obj, label);
}
for(const f of P.FIXTURES){ claim(f.body, 'FIXTURES.body'); claim(f.group, 'FIXTURES.group');
  claim(f.beam, 'FIXTURES.beam'); claim(f.glow, 'FIXTURES.glow'); claim(f.pool, 'FIXTURES.pool');
  claim(f.yoke, 'FIXTURES.yoke'); claim(f.mesh, 'FIXTURES.mesh'); }
for(const ls of P.FLY){ claim(ls.pipe, 'FLY.pipe'); claim(ls.group, 'FLY.group');
  claim(ls.goods, 'FLY.goods'); claim(ls.mesh, 'FLY.mesh'); }
for(const k of Object.keys(P.GOODS)) claim(P.GOODS[k].mesh, 'GOODS.' + k);
for(const b of P.BODIES){ claim(b.mesh, 'BODIES.mesh'); claim(b.group, 'BODIES.group'); }
for(const o of P.WALKABLE) claim(o, 'WALKABLE');
for(const dw of P.DOORWAYS) for(const l of dw.leaves) claim(l.mesh || l.group, 'DOORWAYS.leaf');
function claimsIn(top){
  const found = {};
  top.traverse(c => { const v = CLAIM.get(c); if(v) found[v] = (found[v] || 0) + 1; });
  const keys = Object.keys(found).sort((a, b)=>found[b] - found[a]);
  return keys.length ? keys.slice(0, 4).map(k=>k + ' x' + found[k]).join('   ')
                     : 'NOTHING IN ANY REGISTRY — pure cosmetic architecture';
}

console.log('WHAT THE BIGGEST BLOCKS ARE MADE OF  (so they can be found in src/ by grep)');
const named = new Map();
for(const rec of all.objects){
  const t = topOf(rec.o);
  const k = blockOf(rec.o);
  if(!named.has(k)) named.set(k, {top: t, recs: []});
  named.get(k).recs.push(rec);
}
for(const row of SCENE_BLOCKS.slice(0, 8)){
  const ent = named.get(row.name);
  if(!ent) continue;
  const box = new T.Box3().setFromObject(ent.top);
  const shapes = {}, mats = {};
  for(const rec of ent.recs){
    const g = rec.o.geometry, pr = g && g.parameters;
    const sig = (g ? g.type : '?') +
      (pr ? '(' + ['width','height','depth','radiusTop','radius','segments']
          .map(kk => pr[kk] === undefined ? null : (+pr[kk]).toFixed(2))
          .filter(x => x !== null).join(',') + ')' : '');
    shapes[sig] = (shapes[sig] || 0) + rec.draws;
    const m = Array.isArray(rec.o.material) ? rec.o.material[0] : rec.o.material;
    /* a ShaderMaterial has no .color, and the beams and glows are exactly that */
    const mk = m ? (m.name || ((m.color ? '#' + m.color.getHexString() : m.type) + ' m' +
                    (m.metalness === undefined ? '-' : m.metalness.toFixed(2)))) : 'none';
    mats[mk] = (mats[mk] || 0) + rec.draws;
  }
  const sh = Object.keys(shapes).sort((a, b)=>shapes[b] - shapes[a]);
  const mk = Object.keys(mats).sort((a, b)=>mats[b] - mats[a]);
  console.log('  ' + row.name + '   ' + row.draws + ' draws, ' + Math.round(row.tris) + ' tris');
  console.log('      world box  x ' + box.min.x.toFixed(1) + '..' + box.max.x.toFixed(1) +
              '   y ' + box.min.y.toFixed(1) + '..' + box.max.y.toFixed(1) +
              '   z ' + box.min.z.toFixed(1) + '..' + box.max.z.toFixed(1));
  console.log('      shapes     ' + sh.slice(0, 4).map(s=>s + ' x' + shapes[s]).join('   ') +
              (sh.length > 4 ? '   (+' + (sh.length - 4) + ' more)' : ''));
  console.log('      materials  ' + mk.slice(0, 4).map(s=>s + ' x' + mats[s]).join('   ') +
              (mk.length > 4 ? '   (+' + (mk.length - 4) + ' more)' : '') +
              '     ' + mk.length + ' distinct');
  console.log('      claimed by ' + claimsIn(ent.top));
}
console.log('');

/* ---------------------------------------------------------------------------
   THE RIG, ON ITS OWN.  It turned out to be the answer, so it gets a section:
   how many draws ONE lantern is worth, and which part of a lantern they are.
   ------------------------------------------------------------------------- */
console.log('ONE LANTERN, ITEMISED  (' + P.FIXTURES.length + ' fixtures in the Palace rig)');
const PART = {};
let rigDraws = 0;
for(const f of P.FIXTURES){
  for(const key of ['body','beam','glow','pool','yoke']){
    const sub = f[key];
    if(!sub || !sub.isObject3D) continue;
    let n = 0;
    sub.traverse(c => { if(isDrawable(c)) n += pushesOf(c); });
    PART[key] = (PART[key] || 0) + n;
    rigDraws += n;
  }
}
const partKeys = Object.keys(PART).sort((a, b)=>PART[b] - PART[a]);
for(const k of partKeys)
  console.log('  ' + k.padEnd(10) + String(PART[k]).padStart(5) + ' draws over the rig   ' +
              (PART[k]/P.FIXTURES.length).toFixed(1) + ' per fixture');
console.log('  ' + 'TOTAL'.padEnd(10) + String(rigDraws).padStart(5) + ' draws           ' +
            (rigDraws/P.FIXTURES.length).toFixed(1) + ' per fixture');
console.log('  the whole scene is ' + refDraws + ' drawables, so the rig alone is ' +
            (100*rigDraws/refDraws).toFixed(0) + '% of everything in the building');
console.log('');

console.log('READING IT');
console.log('  The budget is about DRAWS, and the x2 column is what the headset pays,');
console.log('  because there is no multiview: each eye is a full projectObject pass.');
console.log('  A block whose draws are close to its own scene-wide total is one the');
console.log('  frustum cannot help with — it is inside the room you are standing in and');
console.log('  in front of you.  Those are the ones worth merging.');
console.log('');
