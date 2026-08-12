/* PROBE — what does standing on his geometry cost?

   RULING BY was going to make an imported single-mesh set standable by putting
   the landed mesh itself on WALKABLE, because his exports name no `walk_` node
   and cannot (the tool emits one primitive).  The ruling said to MEASURE the
   cost rather than assume it.  This is that measurement, and it refused the
   feature:

       the stand-in deck (12 tris)        0.0018 ms/call
       HIS ROOF (99,568 tris)             4.2867 ms/call     2400x
       HIS ROOF, ray 40m away             0.0001 ms/call

   4.29ms is 38.6% of a 90Hz frame, and groundAt runs once for the player PLUS
   once per settling body — so a build with loose pieces would spend several
   frames' worth of time per frame deciding where the floor is.  Worse, three.js
   collects every intersection and sorts, so there is no early exit: a ray that
   MISSES costs the same as one that lands, and the 4.29ms above is a miss.

   The bounding box does reject cheaply, which is the only good news: a ray
   nowhere near the set costs nothing. But the player standing on the set is
   exactly the case that matters.

   So the feature is deferred rather than built, and the number is kept here so
   the next person does not have to rediscover it.  What it would take: a coarse
   collision proxy generated at import (a heightfield sampled off the mesh), or
   a `walk_` node in the file, or an r128 without a linear raycast.

     export NODE_PATH=../tests/node_modules
     node walkcost.js                                                        */
const fs = require('fs'), path = require('path');
const ROOT = 'C:/Users/patri/Documents/theater_game';
const REAL = require('three');

function loadMesh(file, targetW){
  const b = fs.readFileSync(file);
  let off = 12, g = null, bin = null;
  while(off < b.length){
    const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4);
    const body = b.slice(off + 8, off + 8 + len);
    if(type === 0x4e4f534a) g = JSON.parse(body.toString('utf8'));
    else if(type === 0x004e4942) bin = body;
    off += 8 + len + ((len % 4) ? 4 - (len % 4) : 0);
  }
  const acc = i => {
    const a = g.accessors[i], bv = g.bufferViews[a.bufferView];
    const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
    const comp = {SCALAR:1, VEC2:2, VEC3:3}[a.type];
    const n = a.count * comp;
    if(a.componentType === 5126){
      const o = new Float32Array(n);
      for(let k = 0; k < n; k++) o[k] = bin.readFloatLE(base + k*4);
      return o;
    }
    const o = new Uint32Array(n);
    for(let k = 0; k < n; k++)
      o[k] = a.componentType === 5125 ? bin.readUInt32LE(base + k*4) : bin.readUInt16LE(base + k*2);
    return o;
  };
  const prim = g.meshes[0].primitives[0];
  const geo = new REAL.BufferGeometry();
  geo.setAttribute('position', new REAL.BufferAttribute(acc(prim.attributes.POSITION), 3));
  if(prim.indices !== undefined) geo.setIndex(new REAL.BufferAttribute(acc(prim.indices), 1));
  geo.computeBoundingBox(); geo.computeBoundingSphere();
  const m = new REAL.Mesh(geo, new REAL.MeshBasicMaterial());
  /* fit it the way the importer does, so the ray crosses a realistic span */
  const sz = geo.boundingBox.getSize(new REAL.Vector3());
  const s = targetW / sz.x;
  m.scale.setScalar(s);
  m.updateMatrixWorld(true);
  const b2 = new REAL.Box3().setFromObject(m);
  m.position.y -= b2.min.y;
  m.updateMatrixWorld(true);
  return {mesh: m, tris: (prim.indices !== undefined
    ? g.accessors[prim.indices].count : g.accessors[prim.attributes.POSITION].count) / 3};
}

/* the stand-in it replaces: bj:roofDeck, an 11.0 x 0.4 x 5.2 box */
const deck = new REAL.Mesh(new REAL.BoxGeometry(11.0, 0.4, 5.2), new REAL.MeshBasicMaterial());
deck.position.set(-0.6, 2.2, -6.4); deck.rotation.x = -0.16;
deck.updateMatrixWorld(true);

const roof = loadMesh(path.join(ROOT, 'assets/bj-roof.glb'), 12.30);
console.log('his roof: ' + roof.tris.toLocaleString() + ' triangles, fitted 12.30m wide');
console.log('the stand-in deck it replaces: 12 triangles\n');

const ray = new REAL.Raycaster(new REAL.Vector3(), new REAL.Vector3(0, -1, 0), 0, 28);
const o = new REAL.Vector3(), d = new REAL.Vector3(0, -1, 0);

function time(label, list, x, z, n){
  /* warm up: three.js builds nothing lazily here, but V8 does */
  for(let i = 0; i < 200; i++){ ray.set(o.set(x, 4.0, z), d); ray.intersectObjects(list, true); }
  const t0 = process.hrtime.bigint();
  let hits = 0;
  for(let i = 0; i < n; i++){
    ray.set(o.set(x + (i % 7) * 0.01, 4.0, z), d);
    hits += ray.intersectObjects(list, true).length ? 1 : 0;
  }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / n;
  console.log('  ' + label.padEnd(46) + ms.toFixed(4) + ' ms/call   ' +
              (hits ? 'lands' : 'no hit'));
  return ms;
}

const N = 4000;
console.log('a groundAt-shaped ray, straight down from y=4.0:');
const a = time('the stand-in deck (12 tris), over it', [deck], -0.6, -6.4, N);
const b = time('HIS ROOF (' + roof.tris.toLocaleString() + ' tris), over it', [roof.mesh], 0, -5.0, N);
const c = time('HIS ROOF, ray 40m away (bounding-box reject)', [roof.mesh], 40, -5.0, N);

console.log('');
console.log('his roof costs ' + (b / a).toFixed(1) + 'x the stand-in when you are standing on it,');
console.log('and ' + (b / c).toFixed(0) + 'x less than that when the ray is nowhere near it.');
console.log('one frame at 90Hz is 11.1ms; groundAt runs once for the player plus');
console.log('once per settling body, so ' + b.toFixed(3) + 'ms is ' +
            (100 * b / 11.1).toFixed(2) + '% of a frame per call.');
