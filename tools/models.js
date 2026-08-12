/* PROBE — what do the owner's delivered .glb files actually DO when the real
   importer lands them?

   Two halves, because neither alone answers the question:

     1. A CONTAINER SCAN, straight off the glb bytes — triangles, materials,
        texture sizes, stray lights, the raw bounding box.  Exact, and needs
        no harness: jsdom cannot decode a PNG, so anything measured through
        the loader would be guessing about textures.

     2. A REAL IMPORT RUN — boots the-house.html, serves his files to the
        actual `loadSetModels` fetch, and then measures the LANDED result in
        world space against the portal it has to be seen through.

   The second half is the point.  Every budget in the validator is about cost;
   nothing in the build has ever checked that a fitted set is SEEABLE, and
   `bjFitAndSeat` scales on width alone, so a model whose proportions differ
   from docs/MODELING.md's target lands correct-width and wrong-everything-else.
   That is not a thing you can picture — hence a probe (TRAPS.md).

       export NODE_PATH=../tests/node_modules
       node models.js                          # whatever is in ../assets
       node models.js --from "C:/Users/patri/Documents/beetlejuice sets"

   Textures are stubbed 1x1 through the loader (jsdom decodes no images), so
   the shrink path is NOT exercised here — half 1 reports the real sizes.     */
const {JSDOM} = require('jsdom');
const fs = require('fs');
const path = require('path');

/* ── his delivery, as it arrives out of the tool ────────────────────────────
   The three houses are geometrically IDENTICAL — same bounding box to three
   decimals, triangle counts within 26 of each other — and all three came out
   of the tool named `deetz_house`.  The PAINT is the only thing that tells
   them apart, so this mapping is by palette and nothing else:

     ...736   warmth R-B +15.3, 94% red/orange   warm brown, cream, sage
     ...721   warmth R-B  -4.4, red/violet/blue  cool grey, slate, teal
     ...729   warmth R-B -10.9, 49% blue 36% violet   saturated purple      */
const RAW = {
  'bj-attic.glb':             'attic/Meshy_AI_attic_0812020523_texture.glb',
  'bj-roof.glb':              'roof/Meshy_AI_roof_0812020713_texture.glb',
  'bj-house-maitland.glb':    'house/Meshy_AI_deetz_house_0812020736_texture.glb',
  'bj-house-deetz.glb':       'house/Meshy_AI_deetz_house_0812020721_texture.glb',
  'bj-house-beetlejuice.glb': 'house/Meshy_AI_deetz_house_0812020729_texture.glb',
  'bj-house-exterior.glb':    'house extirior/Meshy_AI_beetlejuie_extiriot_0812020837_texture.glb',
  'bj-sign.glb':              'beetlejuice sign/Meshy_AI_Neon_Betelgeuse_Sign_0812020344_texture.glb'
};

const fromArg = process.argv.indexOf('--from');
const FROM = fromArg > 0 ? process.argv[fromArg + 1] : null;
const ASSETS = path.join(__dirname, '..', 'assets');

/* where a given asset name can be read from on this machine, or null */
function locate(name){
  const inAssets = path.join(ASSETS, name);
  if(fs.existsSync(inAssets)) return inAssets;
  if(FROM && RAW[name]){
    const p = path.join(FROM, RAW[name]);
    if(fs.existsSync(p)) return p;
  }
  return null;
}

/* ══ HALF 1 — the container, off the bytes ═════════════════════════════════ */
function scan(file){
  const b = fs.readFileSync(file);
  let off = 12, g = null, bin = null;
  while(off < b.length){
    const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4);
    const body = b.slice(off + 8, off + 8 + len);
    if(type === 0x4e4f534a) g = JSON.parse(body.toString('utf8'));
    else if(type === 0x004e4942) bin = body;
    off += 8 + len + ((len % 4) ? 4 - (len % 4) : 0);
  }
  let tris = 0, prims = 0;
  const mats = new Set(), walks = [], lights = [];
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  const visit = ni => {
    const n = g.nodes[ni];
    if(n.extensions && n.extensions.KHR_lights_punctual) lights.push(n.name || ni);
    if(n.mesh !== undefined){
      if(/^walk_/.test(n.name || '')) walks.push(n.name);
      for(const p of g.meshes[n.mesh].primitives){
        prims++;
        if(p.material !== undefined) mats.add(p.material);
        const c = (p.indices !== undefined) ? g.accessors[p.indices].count
                                            : g.accessors[p.attributes.POSITION].count;
        if((p.mode === undefined ? 4 : p.mode) === 4) tris += c / 3;
        const a = g.accessors[p.attributes.POSITION];
        if(a.min && a.max) for(let k = 0; k < 3; k++){
          if(a.min[k] < lo[k]) lo[k] = a.min[k];
          if(a.max[k] > hi[k]) hi[k] = a.max[k];
        }
      }
    }
    for(const c of (n.children || [])) visit(c);
  };
  for(const ni of g.scenes[g.scene || 0].nodes) visit(ni);

  const px = (im) => {
    const bv = g.bufferViews[im.bufferView];
    const buf = bin.slice(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
    if(buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47)
      return buf.readUInt32BE(16) + 'x' + buf.readUInt32BE(20) + ' png';
    if(buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8){
      let i = 2;
      while(i < buf.length - 9){
        if(buf[i] !== 0xff){ i++; continue; }
        const m = buf[i + 1];
        if(m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
          return buf.readUInt16BE(i + 7) + 'x' + buf.readUInt16BE(i + 5) + ' jpg';
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
    return '?';
  };
  return {
    mb: b.length / 1048576,
    tris: Math.round(tris), prims, mats: mats.size,
    tex: (g.images || []).map(px),
    lights, walks,
    size: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]],
    minY: lo[1],
    tops: g.scenes[g.scene || 0].nodes.map(ni => g.nodes[ni].name || '(unnamed)')
  };
}

/* ══ HALF 2 — the real import, in the real build ════════════════════════════ */
const html = fs.readFileSync(path.join(__dirname, '..', 'the-house.html'), 'utf8');
const dom = new JSDOM(html.replace(/<script src=.*?<\/script>/, ''),
                      {runScripts: 'outside-only', pretendToBeVisual: true});
const w = dom.window;
w.HTMLCanvasElement.prototype.getContext = function(){
  const noop = () => {};
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
  setPixelRatio(){} setSize(){} render(s, c){ s.updateMatrixWorld(true); c.updateMatrixWorld(true); }
};
/* jsdom decodes no images, so an honest TextureLoader would never fire onLoad
   and GLTFLoader.parse would hang forever waiting on its dependencies.  1x1
   keeps the shrink and the oversize backstop both out of the way — half 1 is
   where the real texture sizes are reported. */
THREE.TextureLoader = class {
  constructor(manager){ this.manager = manager; }
  /* GLTFParser calls the whole THREE.Loader surface on it before parsing */
  setCrossOrigin(){ return this; } setPath(){ return this; }
  setRequestHeader(){ return this; } setWithCredentials(){ return this; }
  setResourcePath(){ return this; }
  load(url, onLoad){
    const t = new REAL.Texture();
    t.image = {width:1, height:1}; t.needsUpdate = true;
    if(onLoad) onLoad(t);
    return t;
  }
};
w.THREE = THREE;
w.AudioContext = undefined;
w.requestAnimationFrame = cb => { w.__raf = cb; return 1; };
if(!w.URL.createObjectURL){ w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {}; }

/* what we can actually serve */
const served = {};
for(const name of Object.keys(RAW)){
  const p = locate(name);
  if(p) served[name] = p;
}

/* The build's top-level `const`s — BJ, BJ_MODELS, SHOW, scene — live in the
   eval's own scope and are invisible from out here (only functions and vars
   reach the window).  So half 2 runs INSIDE the page, exactly as the other
   probes do, and hands its lines back on window.__out. */
const PROBE = `
window.__done = (async function(){
  const out = [];
  const P = s => out.push(s);
  for(let i=0;i<60;i++){ const cb=window.__raf; window.__raf=null; if(cb) cb(16*i); }

  showLoad('beetlejuice');
  const before = {};
  for(const sc of SHOW.scenes) before[sc.name] = sc.walk.map(o=>o.name||'(unnamed)');

  /* loadSetModels swallows a fetch/parse failure into out.missing on purpose
     (the fallback is silent by design), which is exactly wrong when you are
     trying to find out WHY nothing landed — so parse one by hand first and
     say what happened. */
  if(window.__debug){
    try{
      const rr = await fetch('assets/bj-attic.glb');
      const bb = await rr.arrayBuffer();
      P('manual: ' + bb.byteLength + ' bytes, a ' + bb.constructor.name +
        ' (instanceof page ArrayBuffer: ' + (bb instanceof ArrayBuffer) + ')');
      await new Promise(res=>{
        new THREE.GLTFLoader().parse(bb, '',
          g=>{ P('manual parse OK: ' + g.scene.children.length + ' top nodes'); res(); },
          e=>{ P('manual parse FAILED: ' + (e && (e.message||e))); res(); });
      });
    }catch(e){
      P('manual parse THREW: ' + e.message);
      P((e.stack||'').split('\\n').slice(1,5).join('\\n'));
    }
  }

  const r = await loadSetModels();
  /* showLoad's own hook already ran the import, so THIS call's tallies are the
     leftovers — what actually landed is recorded on the scene groups. */
  const applied = [];
  for(const sc of SHOW.scenes)
    for(const k of Object.keys(sc.group.userData.bjApplied || {})) applied.push(k);
  P('landed  : ' + (applied.join(', ') || 'none'));
  P('refused : ' + (r.refused.map(x=>x.key+' ('+x.why+')').join(', ') || 'none'));
  P('absent  : ' + r.missing + ' (of the 9 the manifest asks for)');
  P('');
  P('the picture opening is ' + BJ.opW + 'm wide x ' + BJ.opH + 'm tall, and it stands at z=0;');
  P('the stage runs ~10m UPSTAGE of it, which is -z.  Anything at +z is in the auditorium.');
  P('');
  P('set / dressing          fitted box (w x h x d)      y base    z span        verdict');
  P('-'.repeat(104));

  let landed = 0, bad = 0;
  for(const key of Object.keys(BJ_MODELS)){
    const e = BJ_MODELS[key];
    const name = e.url.replace(/^assets\\//,'');
    if(!window.__served[name]) continue;
    const sc = sceneFind(e.scene);
    /* measure the LANDED subtree — the dressing group for a whole house, the
       scene group otherwise.  In the CONTAINER's own frame, not the world's:
       the wagon parks at BJ_WAGON_BACK and its mover carries the dressings, so
       a world box reports the parked offset as the set's position and every
       depth verdict below is then measuring the wrong thing.  A frozen group
       also makes .position a liar, hence the matrix walk (TRAPS). */
    const root = e.dress ? sc.dress[e.dress] : sc.group;
    root.updateWorldMatrix(true, true);
    const box = new THREE.Box3();
    root.traverse(o=>{ if(o.isMesh) box.expandByObject(o); });
    if(box.isEmpty()){ P(key.padEnd(24) + 'nothing landed'); continue; }
    if(e.dress) box.applyMatrix4(new THREE.Matrix4().copy(root.matrixWorld).invert());
    const s = box.getSize(new THREE.Vector3());
    landed++;
    /* THE VERDICT HAS TO KNOW WHAT WAS ASKED FOR.  A probe that calls a ruling
       a fault is worse than no probe: it reported CB's masked overflow and CA's
       downstage sign as three faults each until it was taught the manifest. */
    const over = [], why = [];
    if(s.x > BJ.opW + 0.01) over.push('wider than the opening by ' + (s.x-BJ.opW).toFixed(2) + 'm');
    if(box.min.y < -0.01)   over.push('BELOW the deck by ' + (-box.min.y).toFixed(2) + 'm');
    if(s.y > BJ.opH + 0.01){
      if(e.fillWidth) why.push((s.y-BJ.opH).toFixed(2) + 'm masked by the border (CB)');
      else over.push('OVER the opening by ' + (s.y-BJ.opH).toFixed(2) + 'm');
    }
    const depthCap = e.fillWidth ? (Math.abs(D.backWall) - 0.30 - (e.upstage||0)) : 10.0;
    if(s.z > depthCap + 0.01)
      over.push('deeper than its ' + depthCap.toFixed(1) + 'm allowance by ' + (s.z-depthCap).toFixed(2) + 'm');
    if(box.min.z < D.backWall - 0.01)
      over.push('THROUGH the back wall by ' + (D.backWall - box.min.z).toFixed(2) + 'm');
    if(box.max.z > 0.01){
      if(e.centre) why.push('hangs ' + box.max.z.toFixed(2) + 'm downstage of the arch (CA)');
      else over.push('DOWNSTAGE of the arch by ' + box.max.z.toFixed(2) + 'm');
    }
    if(e.upstage) why.push(e.upstage + 'm further upstage (CD)');
    if(e.centre && box.min.y > 1.0) why.push('flown, not seated');
    if(over.length) bad++;
    P(key.padEnd(24) +
      (s.x.toFixed(2)+' x '+s.y.toFixed(2)+' x '+s.z.toFixed(2)).padEnd(27) +
      box.min.y.toFixed(2).padStart(6) + '   ' +
      (box.min.z.toFixed(1)+'..'+box.max.z.toFixed(1)).padEnd(13) +
      (over.length ? over.join('; ') : ('fits' + (why.length ? ' — ' + why.join(', ') : ''))));

    const now = sc.walk.map(o=>o.name||'(unnamed)');
    const lost = (before[e.scene]||[]).filter(n=>now.indexOf(n) < 0);
    if(lost.length)
      P(' '.repeat(24) + 'WALKABLE LOST: ' + lost.join(', ') +
        '  (the file names no walk_ mesh, so nothing replaced it)');
  }
  P('-'.repeat(96));
  P(bad ? bad + ' of ' + landed + ' landed sets do not fit what they are seen through'
        : 'all ' + landed + ' landed sets fit');
  window.__out = out.join('\\n');
})();
`;

(async () => {
  console.log('=== HALF 1 — the containers, straight off the bytes\n');
  const scans = {};
  for(const name of Object.keys(RAW)){
    const p = served[name];
    if(!p){ console.log(name.padEnd(26) + 'NOT PRESENT'); continue; }
    const s = scans[name] = scan(p);
    const bad = [];
    if(s.tris > 150000) bad.push('TRIS');
    if(s.mats > 8) bad.push('MATS');
    if(s.lights.length) bad.push('LIGHTS');
    console.log(name.padEnd(26) + s.mb.toFixed(1).padStart(5) + 'MB  ' +
                String(s.tris).padStart(7) + ' tris  ' + s.mats + ' mat  ' +
                (bad.length ? 'REFUSED: ' + bad.join('+') : 'passes every budget'));
    console.log(' '.repeat(26) + 'raw box ' + s.size.map(v => v.toFixed(3)).join(' x ') +
                '   textures ' + s.tex.join(', '));
    console.log(' '.repeat(26) + 'top nodes: ' + s.tops.join(', ') +
                '   walk_: ' + (s.walks.length ? s.walks.join(', ') : 'NONE'));
  }

  console.log('\n=== HALF 2 — the real importer, and what lands on the stage\n');
  w.__served = served; w.__debug = !!process.env.PROBE_DEBUG;
  w.fetch = url => {
    const name = String(url).replace(/^assets\//, '');
    const p = served[name];
    if(process.env.PROBE_DEBUG) console.log('  [fetch] ' + url + ' -> ' + (p || 'NOT SERVED'));
    if(!p) return Promise.reject(new Error('not delivered'));
    const b = fs.readFileSync(p);
    return Promise.resolve({ok: true, status: 200,
      arrayBuffer: () => Promise.resolve(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))});
  };

  const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g, '');
  try{ w.eval(script + PROBE); }
  catch(e){
    console.log('PROBE DIED: ' + e.message);
    console.log(e.stack.split('\n').slice(0, 6).join('\n'));
    process.exit(1);
  }
  await w.__done;
  console.log(w.__out);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
