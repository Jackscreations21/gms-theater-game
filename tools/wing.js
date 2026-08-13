/* PROBE — HOW WIDE IS A WING, REALLY?  (RULING DI)

   "the attic, bedrrom and closet sets are still in the wings … i meant past the
    physical legs. past the black curtains … there is plenty of room between the
    fly rail and the legs to fit all three sets."

   He is right, and the reason nobody had built it is that THREE RULINGS QUOTE A
   RAIL THAT IS NOT THERE.  CE, CS and DF all state the flyman's locking rail at
   x -19.2, and every one of them cites p9 for it.  What p9 actually says is:

     const railX = fr ? fr.rail : -D.stageW/2 + 2.8;

   -19.2 is the FALLBACK, taken only when there is no crew frame.  There always
   is one, and crewPalaceFrame gives XR + 2.8 — where XR is
   -(D.stageW/2 + D.wingSR), because stage right runs D.wingSR further out than
   stage left.  So the rail is at -30.2 and the stage-right wing is nearly twice
   the width three rulings have been sizing parks against.

   That is a fact about the building, so it is measured here rather than argued:
   the leg edge off the built goods, the rail off crewFrame(), and then a sweep
   of the strip between them for anything standing in it.  A park is only "past
   the legs" if there is somewhere past the legs to stand.

     export NODE_PATH=../tests/node_modules
     node wing.js                                                            */
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
  /* PMREMGenerator is CORE three.js, not an addon, and RULING DK builds the
     room environment with it at load — so fromScene runs in every suite.  It
     asks the renderer for exactly these four things and this stub had none of
     them.  An incomplete stub is a fault in the harness, not a reason to make
     the game degrade: with them, fromScene completes and scene.environment is
     a real texture here as well as in a browser.
     getClearColor MUTATES ITS TARGET and does not merely return it (r128
     three.js :17534 does target.copy).  A version that returns the argument
     untouched leaves PMREM reading its own module-level Color, which is WHITE,
     while a real renderer clears BLACK — so a stubbed run would build a white
     environment from a scene with no background and report success. */
  compile(){}
  getRenderTarget(){ return this._rt || null; }
  setRenderTarget(t){ this._rt = t || null; }
  getClearColor(c){ return c.set(0x000000); }
};
w.THREE = THREE;
w.AudioContext = undefined;
w.requestAnimationFrame = cb => { w.__raf = cb; return 1; };
if(!w.URL.createObjectURL){ w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {}; }

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g, '');
/* XL, XR, D and GOODS are CONSTS of the eval program and never become window
   properties.  A const missing from this handout arrives as undefined and the
   probe prints a confident wrong answer — TRAPS records that, so the sweep
   below throws rather than reads a hole. */
w.eval(script + ';window.__P = {D:D, XL:XL, XR:XR, GOODS:GOODS, scene:scene,' +
       ' PAL_BACK:PAL_BACK, DOCK:DOCK, SHOW:SHOW};');
for(let i = 0; i < 60; i++){ const cb = w.__raf; w.__raf = null; if(cb) cb(1000 + i*16); }

const P = w.__P, T = REAL, D = P.D;
for(const k of ['D', 'XL', 'XR', 'GOODS', 'scene'])
  if(P[k] === undefined) throw new Error('the probe cannot see ' + k + ' — add it to the __P handout');

console.log('');
console.log('THE BOX, AND WHY THE TWO SIDES ARE NOT THE SAME');
console.log('  D.stageW  ' + D.stageW + '      half of it            ' + (D.stageW/2).toFixed(2));
console.log('  D.wingSR  ' + D.wingSR + '      stage right runs that much further out');
console.log('  D.procW   ' + D.procW.toFixed(1) + '    the opening');
console.log('  XL  stage-left wall   x ' + P.XL.toFixed(2));
console.log('  XR  stage-right wall  x ' + P.XR.toFixed(2) + '   <-- not -22');
console.log('');

/* the legs, off the built goods rather than off the source */
const legPair = P.GOODS.legs.build();
legPair.updateMatrixWorld(true);
/* ONE leg, not the pair.  Measuring the pair gives a box spanning both cloths,
   whose |x| min and max are BOTH the outboard edge — it printed "0.00m of cloth"
   and "masks from 12.20" on the first run, which is the confidently-wrong-answer
   failure this file already warns about, one level down. */
if(!legPair.children.length) throw new Error('GOODS.legs built no children to measure');
const lb = new T.Box3().setFromObject(legPair.children[0]);
const LEG_OUT = Math.max(Math.abs(lb.min.x), Math.abs(lb.max.x));
const LEG_IN  = Math.min(Math.abs(lb.min.x), Math.abs(lb.max.x));
console.log('A LEG, BUILT AND MEASURED  (GOODS.legs, one of the pair)');
console.log('  it spans x ' + lb.min.x.toFixed(2) + ' .. ' + lb.max.x.toFixed(2) +
            '   (' + (LEG_OUT - LEG_IN).toFixed(2) + 'm of cloth)');
console.log('  the picture edge is |x| 6.80, so it masks from |x| ' + LEG_IN.toFixed(2));
console.log('  PAST THE LEGS MEANS |x| > ' + LEG_OUT.toFixed(2));
console.log('');

console.log('THE RAIL — the number three rulings quote, against the live one');
const fb = -D.stageW/2 + 2.8;
const live = w.crewFrame().rail;
console.log('  p9 fallback   -D.stageW/2 + 2.8  = ' + fb.toFixed(2) + '   <-- CE, CS and DF all cite this');
console.log('  crewFrame().rail                 = ' + live.toFixed(2) + '   <-- what p9 actually builds');
console.log('  they differ by ' + Math.abs(live - fb).toFixed(2) + 'm, which is D.wingSR');
console.log('');

console.log('SO HOW MUCH ROOM IS THERE PAST THE LEGS?');
console.log('  stage right   leg edge ' + (-LEG_OUT).toFixed(2) + '  ->  rail ' + live.toFixed(2) +
            '     ' + (Math.abs(live) - LEG_OUT).toFixed(2) + 'm');
console.log('  stage right   as the rulings had it (rail ' + fb.toFixed(2) + ')   ' +
            (Math.abs(fb) - LEG_OUT).toFixed(2) + 'm');
console.log('  stage left    leg edge ' + LEG_OUT.toFixed(2) + '  ->  wall ' + P.XL.toFixed(2) +
            '      ' + (P.XL - LEG_OUT).toFixed(2) + 'm');
console.log('');

/* WHAT IS ACTUALLY STANDING IN IT.  Rays fired outboard along -x at four
   heights, the full depth of the deck — because a strip of clear floor on a
   plan is not clear if the counterweight arbours run down through it. */
console.log('WHAT STANDS IN THE STRIP  (rays outboard from x ' + (-LEG_OUT).toFixed(1) +
            ', four heights, z 0.5 .. ' + P.PAL_BACK.toFixed(1) + ')');
const rc = new T.Raycaster();
rc.far = 40;
const dir = new T.Vector3(-1, 0, 0);
const hits = {};
let rays = 0;
for(let z = 0.5; z >= P.PAL_BACK; z -= 0.5){
  for(const y of [0.30, 1.20, 2.60, 4.60]){
    rays++;
    rc.set(new T.Vector3(-LEG_OUT, y, z), dir);
    for(const h of rc.intersectObject(P.scene, true)){
      const x = -LEG_OUT - h.distance;
      if(x < P.XR - 0.4) continue;                  // stop at the stage-right wall
      /* NAME IT PROPERLY.  Walking up to the first named ancestor lands on the
         cull-room group — every hit came back as "stage" or "shared", which says
         nothing about what is in the way.  Take the mesh's own name if it has
         one, and fall back to its geometry rather than to a room. */
      const ROOM = {stage:1, shared:1, house:1, shed:1, foyer:1};
      let n = h.object.name, p = h.object, guard = 0;
      while((!n || ROOM[n]) && p.parent && guard++ < 8){ p = p.parent; if(p.name && !ROOM[p.name]) n = p.name; }
      if(!n || ROOM[n]) n = (h.object.geometry && h.object.geometry.type) || h.object.type;
      const r = hits[n] || (hits[n] = {n:0, x0:99, x1:-99, y0:99, y1:-99});
      r.n++; r.x0 = Math.min(r.x0, x); r.x1 = Math.max(r.x1, x);
      r.y0 = Math.min(r.y0, y); r.y1 = Math.max(r.y1, y);
    }
  }
}
const rows = Object.keys(hits).map(k=>({name:k, r:hits[k]})).sort((a,b)=>b.r.n - a.r.n);
console.log('  ' + rays + ' rays');
if(!rows.length) console.log('  NOTHING AT ALL between the leg edge and the wall');
for(const r of rows)
  console.log('  ' + r.name.slice(0, 26).padEnd(28) + String(r.r.n).padStart(5) + ' hits    x ' +
              r.r.x0.toFixed(2).padStart(7) + ' ..' + r.r.x1.toFixed(2).padStart(7) +
              '    y ' + r.r.y0.toFixed(2) + ' ..' + r.r.y1.toFixed(2));
console.log('');
console.log('  a name here is only in the way if it is BELOW the deck-plus-set height');
console.log('  the fly floor and its arbours are the ones to watch for.');

/* AND NAME THE UNNAMED ONES.  Anything standing between the leg edge and the
   rail decides whether a park can go there at all, so an anonymous BoxGeometry
   is not an answer — walk the whole ancestor chain and print it. */
console.log('');
console.log('WHATEVER IS INBOARD OF THE RAIL, NAMED PROPERLY  (chains for hits x > -30.2)');
const seen = {};
for(let z = 0.5; z >= P.PAL_BACK; z -= 0.5){
  for(const y of [0.30, 1.20, 2.60, 4.60]){
    rc.set(new T.Vector3(-LEG_OUT, y, z), dir);
    for(const h of rc.intersectObject(P.scene, true)){
      const x = -LEG_OUT - h.distance;
      if(x <= live) continue;                       // the rail and beyond is not the question
      const chain = [];
      let p = h.object, guard = 0;
      while(p && guard++ < 10){ chain.push(p.name || ('<' + ((p.geometry && p.geometry.type) || p.type) + '>')); p = p.parent; }
      const key = chain.join(' < ');
      const r = seen[key] || (seen[key] = {n:0, x0:99, x1:-99, z0:99, z1:-99, y0:99, y1:-99, obj:h.object});
      r.n++;
      r.x0 = Math.min(r.x0, x); r.x1 = Math.max(r.x1, x);
      r.z0 = Math.min(r.z0, z); r.z1 = Math.max(r.z1, z);
      r.y0 = Math.min(r.y0, y); r.y1 = Math.max(r.y1, y);
    }
  }
}
const keys = Object.keys(seen).sort((a,b)=>seen[b].n - seen[a].n);
if(!keys.length) console.log('  NOTHING between the leg edge and the rail — the strip is clear');
for(const k of keys){
  const r = seen[k];
  console.log('  ' + r.n + ' hits   x ' + r.x0.toFixed(2) + '..' + r.x1.toFixed(2) +
              '   y ' + r.y0.toFixed(2) + '..' + r.y1.toFixed(2) +
              '   z ' + r.z1.toFixed(1) + '..' + r.z0.toFixed(1));
  console.log('      ' + k);
  const o = seen[k].obj;
  if(o){
    const pp = o.geometry && o.geometry.parameters;
    console.log('      built at (' + o.position.x.toFixed(2) + ', ' + o.position.y.toFixed(2) +
                ', ' + o.position.z.toFixed(2) + ')' +
                (pp ? '  size ' + [pp.width, pp.height, pp.depth].map(v=>v === undefined ? '-' : (+v).toFixed(2)).join(' x ') : '') +
                '   its own world box:');
    const wb = new T.Box3().setFromObject(o);
    console.log('      x ' + wb.min.x.toFixed(2) + '..' + wb.max.x.toFixed(2) +
                '   y ' + wb.min.y.toFixed(2) + '..' + wb.max.y.toFixed(2) +
                '   z ' + wb.min.z.toFixed(2) + '..' + wb.max.z.toFixed(2));
  }
}
