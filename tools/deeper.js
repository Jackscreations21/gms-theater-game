/* PROBE — RULING CL: does the Palace actually hold the sets it is asked to?

   "Make the back wall of the palace go a little farther back to fit the entir
   hous set."

   The Palace was made 4.5m deeper than the stage box in 2026-08-10 so the
   Beetlejuice wagon could park behind the last lineset (p2.txt, PAL_BACK).  That
   number was measured against the STAND-IN interior.  His three houses are
   12.98m deep, and nothing had re-measured.

   WHAT THIS PRINTS, and why each column is here:

     home / back    the set's WORLD BOX on stage and at its most upstage cue
                    target.  A box, never mv.off: a mover parked at its target
                    says nothing about the geometry (TRAPS), and the set is
                    frozen, so reading position back reports the record rather
                    than the room.
     brick          clearance against PAL_BACK, signed.  Negative is set
                    standing out in the street.
     shed           where the warehouse ends up, because it rides PAL_DEEP and
                    the first move of this wall left the trash drum 0.1m through
                    the brick with nothing to say so.

   RUN IT BOTH WAYS.  His model is the BIGGER case here, which is the exact
   inverse of the RULING BQ trap — a park fitted to his model put the STAND-IN
   in the picture, and this one is a wall fitted to the stand-in putting HIS
   house in the street.  Whichever is bigger is the one the number has to hold.

     export NODE_PATH=../tests/node_modules
     node deeper.js                 # his files
     PROBE_STANDIN=1 node deeper.js # the fallback that plays on a fresh clone  */
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
};
/* jsdom decodes no images, so an honest TextureLoader never fires onLoad and
   GLTFLoader.parse hangs for ever — the import then falls back SILENTLY BY
   DESIGN and the probe measures the stand-ins while reporting his models. */
THREE.TextureLoader = class {
  constructor(manager){ this.manager = manager; }
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

const STANDIN = !!process.env.PROBE_STANDIN;
if(!STANDIN) w.fetch = url => {
  const p = path.join(ROOT, String(url));
  if(!fs.existsSync(p)) return Promise.resolve({ok: false, status: 404});
  const b = fs.readFileSync(p);
  return Promise.resolve({ok: true, status: 200,
    arrayBuffer: () => Promise.resolve(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))});
};

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g, '');
/* consts of the eval program never become window properties — hand them out */
w.eval(script + ';window.__P = {SHOW:SHOW, D:D, PAL_BACK:PAL_BACK, PAL_DEEP:PAL_DEEP,' +
       ' BJ_WAGON_BACK:BJ_WAGON_BACK, scene:scene, FLY:FLY};');
for(let i = 0; i < 120; i++){ const cb = w.__raf; w.__raf = null; if(cb) cb(1000 + i*16); }

const g = w, P = w.__P, T = REAL;
const fmt = v => (v >= 0 ? ' ' : '') + v.toFixed(2);
function box(o){ P.scene.updateMatrixWorld(true); const b = new T.Box3();
  o.traverse(k => { if(k.isMesh) b.expandByObject(k); }); return b; }
/* a struck set is switched off; measure the FEATURE, not the present */
function unhide(sc){
  sc.group.userData.sceneOff = false;
  if(typeof g.setPieceVisible === 'function') g.setPieceVisible(sc.group);
  sc.group.traverse(o => { o.layers.set(0); o.visible = true; });
}
function settle(){
  for(let i = 0; i < 6000; i++){
    g.sceneMoveStep(1/60);
    let moving = false;
    for(const sc of P.SHOW.scenes) if(g.sceneTravelling(sc)) moving = true;
    if(!moving) return i;
  }
  return -1;
}

(async () => {
  let hook = null;
  if(!STANDIN){
    const real = w.loadSetModels;
    w.loadSetModels = function(){ const p = real.apply(this, arguments); if(!hook) hook = p; return p; };
  }
  g.showLoad('beetlejuice');
  if(hook){ try{ await hook; }catch(e){ console.log('import threw: ' + e.message); } }

  console.log('');
  console.log('RULING CL — DOES THE PALACE HOLD IT?   models: ' +
              (STANDIN ? 'THE STAND-INS' : 'HIS FILES'));
  console.log('  PAL_DEEP ' + P.PAL_DEEP + '   PAL_BACK ' + fmt(P.PAL_BACK) +
              '   D.backWall ' + P.D.backWall + '   BJ_WAGON_BACK ' + P.BJ_WAGON_BACK);
  const last = P.FLY[P.FLY.length - 1];
  console.log('  the last lineset (the backdrop) hangs at z ' + fmt(last.z));
  console.log('');

  /* ---- every dressing of the wagon, at its most upstage cue target -------- */
  console.log('  set                       deep    on stage            slid back           brick');
  console.log('  ' + '-'.repeat(84));
  const inr = g.sceneFind('interior');
  const dressings = inr && inr.dress ? Object.keys(inr.dress) : [];
  let worst = null;
  for(const d of dressings){
    g.bjDress(inr, d);
    unhide(inr);
    g.sceneMoveTo('interior', 0); settle();
    const home = box(inr.group);
    g.sceneMoveTo('interior', P.BJ_WAGON_BACK); settle();
    const back = box(inr.group);
    const clear = back.min.z - P.PAL_BACK;
    if(worst === null || clear < worst) worst = clear;
    console.log('  interior/' + d.padEnd(16) +
                (home.max.z - home.min.z).toFixed(2).padStart(6) + 'm' +
                '  [' + fmt(home.min.z) + '..' + fmt(home.max.z) + ']' +
                '  [' + fmt(back.min.z) + '..' + fmt(back.max.z) + ']  ' +
                (clear < 0 ? ('THROUGH by ' + (-clear).toFixed(2) + 'm')
                           : ('clear by ' + clear.toFixed(2) + 'm')));
    g.sceneMoveTo('interior', 0); settle();
  }

  /* ---- and the parks, which are the OTHER thing standing back there ------- */
  console.log('');
  /* EVERY PART MOVER THAT TRAVELS ON Z, whatever it is called.  Two wrong
     readings before this one, and both printed an empty section — which is a
     probe reporting "nothing goes upstage" about a building that has a 13m attic
     parked 8.8m up it:

       sc.park     does not exist.  scenePark records `sc.parks` plus a part
                   mover registered under the name 'park' (p5c).
       sc.pmv.park exists only for a set that grew a SECOND mover for parking.
                   RULING CE's tracked sets park on the one they already have —
                   the attic's upstage park IS its 'all' mover — so the ones this
                   section is about are precisely the ones that field misses. */
  console.log('  the parts that travel UPSTAGE, and where they end up:');
  let anyPark = 0;
  for(const sc of P.SHOW.scenes){
    if(!sc.pmv) continue;
    for(const k in sc.pmv){
      const m = sc.pmv[k];
      if(m.axis !== 'z' || !(m.out < 0)) continue;
      anyPark++;
      unhide(sc);
      /* drive it there and MEASURE.  A mover parked at OUT proves nothing about
         the geometry — that is in TRAPS twice over. */
      g.sceneMovePartTo(sc, k, m.out); settle();
      const b = box(sc.group);
      console.log('    ' + (sc.name + '.' + k).padEnd(20) + 'out ' + fmt(m.out) +
                  '  ->  z [' + fmt(b.min.z) + '..' + fmt(b.max.z) + ']' +
                  '   brick clearance ' + fmt(b.min.z - P.PAL_BACK) + 'm');
      g.sceneMovePartTo(sc, k, m.home); settle();
    }
  }
  if(!anyPark) console.log('    (none — every part goes to a wing or the grid)');

  /* ---- the shed rode the wall, and its furniture rode the shed ------------ */
  console.log('');
  const sh = g.SHEDS && g.SHEDS.palace;
  if(sh){
    console.log('  the warehouse: x [' + fmt(sh.x0) + '..' + fmt(sh.x1) + ']  z [' +
                fmt(sh.z0) + '..' + fmt(sh.z1) + ']  (' + (sh.z1 - sh.z0).toFixed(1) + 'm deep)');
    const furn = [];
    if(g.CARTS && g.CARTS.palace) furn.push(['cart', g.CARTS.palace.z]);
    if(g.LIFTS && g.LIFTS.palace) furn.push(['forklift', g.LIFTS.palace.z]);
    for(const [nm, z] of furn){
      const inside = z > sh.z0 && z < sh.z1;
      console.log('    ' + nm.padEnd(10) + 'z ' + fmt(z) + (inside ? '   inside' : '   OUTSIDE THE SHED'));
    }
  } else console.log('  (no palace shed)');

  console.log('');
  console.log('  VERDICT: the deepest thing that slides back clears the brick by ' +
              (worst === null ? '(nothing measured)' : worst.toFixed(2) + 'm') +
              (worst !== null && worst < 0 ? '   <<< IT DOES NOT FIT' : ''));
  console.log('');
})();
