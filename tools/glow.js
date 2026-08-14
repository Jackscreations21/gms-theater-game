/* PROBE — HOW MUCH OF THE SCREEN DO THE GLOW PLANES ACTUALLY COVER?  (RULING DN)

   DN's whole performance argument is three numbers and none of them were
   visible anywhere: how many additive quads get drawn, how much of the display
   they cover between them, and how big the WORST single one is.  The spec sizes
   an uncapped worst case at 1.5-3ms of fill on a Quest 3 and says it happens
   "exactly where he stands to look at the neon" — so the probe stands there.

   The numbers are taken off the instance matrices the batch will really draw,
   not recomputed from the formula, and the screen area is measured by
   projecting each quad's four corners through the camera and clipping to the
   viewport, so an instance half off the edge is counted at half.

   It prints, per eye position: instances drawn, the summed screen-area
   fraction, and the single worst instance's fraction.  It is a picture, not a
   pass or a fail — the budget lives in HANDOFF's headset checklist.

     export NODE_PATH=../tests/node_modules
     node glow.js                 the default cue
     node glow.js 41              a cue by index
     node glow.js 41 --headset    with the session caps applied              */
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
     with it at load, so fromScene runs here too and needs these four. */
  compile(){}
  getRenderTarget(){ return this._rt || null; }
  setRenderTarget(t){ this._rt = t || null; }
  getClearColor(c){ return c.set(0x000000); }
};
w.THREE = THREE;
w.AudioContext = undefined;
w.requestAnimationFrame = cb => { w.__raf = cb; return 1; };
if(!w.URL.createObjectURL){ w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {}; }

const HEADSET = process.argv.indexOf('--headset') >= 0;
const ARG_CUE = process.argv.slice(2).filter(a => /^[0-9]+$/.test(a))[0];

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g, '');
/* GLOW, FIXTURES, CUES, camera, scene and the three DN constants are all
   CONSTS of the eval program and never become window properties.  A const
   missing from this handout arrives as undefined and the probe prints a
   confident wrong answer (TRAPS), so the sweep below throws instead. */
w.eval(script + ';window.__P = {GLOW:GLOW, FIXTURES:FIXTURES, CUES:CUES,' +
       ' camera:camera, scene:scene, VR:VR, RIG:RIG, D:D,' +
       ' GLOW_MAX_FRAC:GLOW_MAX_FRAC, GLOW_SIZE:GLOW_SIZE, GLOW_MIN_LVL:GLOW_MIN_LVL};');
for(let i = 0; i < 60; i++){ const cb = w.__raf; w.__raf = null; if(cb) cb(1000 + i*16); }

const P = w.__P, T = REAL;
for(const k of ['GLOW','FIXTURES','CUES','camera','scene','GLOW_MAX_FRAC','GLOW_SIZE','GLOW_MIN_LVL'])
  if(P[k] === undefined) throw new Error('the probe cannot see ' + k + ' — add it to the __P handout');

w.showLoad('beetlejuice');
const CUE = ARG_CUE === undefined ? Math.min(41, P.CUES.length - 1) : (+ARG_CUE);
if(!P.CUES[CUE]) throw new Error('there is no cue ' + CUE + ' — the stack holds ' + P.CUES.length);

if(HEADSET){
  /* what a session does to it, without a headset in the room: the caps are the
     whole of DN's VR story and they are two assignments in vrQualityOn */
  P.VR.active = true;
  w.vrQualityOn();
}

const cam = P.camera, glow = P.GLOW.mesh;
const f2 = (v, n) => (Math.round(v*Math.pow(10, n||2))/Math.pow(10, n||2)).toFixed(n === undefined ? 2 : n);

/* WHERE A HEAD IS.  The stalls are the ordinary case and the proscenium is the
   binding one — the spec names standing at the arch looking at the neon as the
   unbounded case the clamp exists for.  The last row is the pathological one:
   a nose against the nearest lit lantern. */
function eyes(){
  const lit = P.FIXTURES.filter(f => (f._lvl || 0) >= P.GLOW_MIN_LVL);
  const rows = [
    ['stalls, row H       ', new T.Vector3(0, 2.10, 12), new T.Vector3(0, 5.0, -4)],
    ['stalls, extreme side', new T.Vector3(9.5, 2.10, 9), new T.Vector3(0, 5.0, -4)],
    ['standing at the arch', new T.Vector3(0, 1.65, 3.2), new T.Vector3(0, 6.0, -6)],
    ['downstage centre    ', new T.Vector3(0, 1.65, -1.0), new T.Vector3(0, 6.0, -8)]
  ];
  if(lit.length){
    /* nearest lit emitter to the arch, then stand a metre off its lens */
    const at = new T.Vector3(0, 1.65, 3.2);
    let best = lit[0];
    for(const f of lit) if(f._org.distanceTo(at) < best._org.distanceTo(at)) best = f;
    const eye = best._org.clone().add(new T.Vector3(0, -0.6, 1.0));
    rows.push(['a metre off ch ' + String(best.ch).padStart(2) + '   ', eye, best._org.clone()]);
  }
  return rows;
}

/* THE SCREEN AREA OF ONE INSTANCE, projected rather than assumed.  The quad is
   camera-facing, so its four corners are the unit plane's corners under the
   instance matrix; project each, take the axis-aligned NDC box, clip it to the
   viewport and divide by the viewport's own area of 4.  Anything wholly behind
   the eye is dropped, because project() folds a point behind the camera back
   into the frame and would score it as coverage. */
const CORNER = [new T.Vector3(-0.5,-0.5,0), new T.Vector3(0.5,-0.5,0),
                new T.Vector3(0.5,0.5,0),   new T.Vector3(-0.5,0.5,0)];
const _im = new T.Matrix4(), _v = new T.Vector3(), _cv = new T.Vector3();
function instanceArea(i){
  _im.fromArray(glow.instanceMatrix.array, i*16);
  let x0 = 9e9, x1 = -9e9, y0 = 9e9, y1 = -9e9, infront = 0;
  for(const c of CORNER){
    _v.copy(c).applyMatrix4(_im);
    _cv.copy(_v).applyMatrix4(cam.matrixWorldInverse);
    if(_cv.z < -cam.near) infront++;
    _v.project(cam);
    x0 = Math.min(x0, _v.x); x1 = Math.max(x1, _v.x);
    y0 = Math.min(y0, _v.y); y1 = Math.max(y1, _v.y);
  }
  if(!infront) return 0;
  x0 = Math.max(-1, x0); x1 = Math.min(1, x1);
  y0 = Math.max(-1, y0); y1 = Math.min(1, y1);
  if(x1 <= x0 || y1 <= y0) return 0;
  return ((x1 - x0)*(y1 - y0))/4;
}
/* which fixture an instance belongs to — matched by its world position, so the
   label comes off the drawn matrix and not off a re-run of the loop */
function whose(i){
  _im.fromArray(glow.instanceMatrix.array, i*16);
  const p = new T.Vector3().setFromMatrixPosition(_im);
  for(const f of P.FIXTURES) if(f._org.distanceToSquared(p) < 1e-6) return f;
  return null;
}
function sizeOf(i){
  _im.fromArray(glow.instanceMatrix.array, i*16);
  const s = new T.Vector3();
  _im.decompose(new T.Vector3(), new T.Quaternion(), s);
  return s.x;
}

let clock = 0;
const step = dt => { clock += dt; w.updateFades(dt); w.updateRig(dt, clock); };

w.fireCue(CUE);
if(typeof w.cancelFollow === 'function') w.cancelFollow();
for(let i = 0; i < 90; i++) step(1/60);

const c = P.CUES[CUE];
console.log('');
console.log('THE GLOW PLANES  (RULING DN)   beetlejuice, cue ' + CUE +
            '  Q' + c.n + ' ' + (c.label || ''));
console.log('  GLOW_SIZE     ' + f2(P.GLOW_SIZE) + 'm at full level, before the clamp');
console.log('  GLOW_MAX_FRAC ' + f2(P.GLOW_MAX_FRAC) + '  of the view HEIGHT, per instance');
console.log('  GLOW_MIN_LVL  ' + f2(P.GLOW_MIN_LVL, 3) + '  below this a fixture is not drawn');
console.log('  allocation    ' + P.GLOW.max + ' instances for ' + P.FIXTURES.length + ' fixtures' +
            (HEADSET ? '   [HEADSET: VR.glowCap ' + P.VR.glowCap + ']' : ''));
const litNow = P.FIXTURES.filter(f => (f._lvl || 0) >= P.GLOW_MIN_LVL).length;
console.log('  this cue      ' + litNow + ' of ' + P.FIXTURES.length +
            ' fixtures are over the floor');
console.log('');
console.log('  EYE                    drawn   summed area   worst one   worst is       its size');
console.log('  ---------------------  -----   -----------   ---------   ------------   --------');

for(const [name, eye, look] of eyes()){
  cam.position.copy(eye);
  cam.lookAt(look);
  cam.updateMatrixWorld(true);
  cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  for(let i = 0; i < 3; i++) step(1/60);
  cam.updateMatrixWorld(true);
  cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  let sum = 0, worst = 0, worstI = -1;
  for(let i = 0; i < glow.count; i++){
    const a = instanceArea(i);
    sum += a;
    if(a > worst){ worst = a; worstI = i; }
  }
  const f = worstI >= 0 ? whose(worstI) : null;
  console.log('  ' + name + '   ' + String(glow.count).padStart(5) + '   ' +
              (f2(sum*100, 1) + '%').padStart(11) + '   ' +
              (f2(worst*100, 1) + '%').padStart(9) + '   ' +
              (f ? ('ch ' + f.ch + ' ' + (f.name || f.type)).slice(0, 12) : '-').padEnd(12) + '   ' +
              (worstI >= 0 ? f2(sizeOf(worstI)) + 'm' : '-'));
}
console.log('');
console.log('  summed area OVERCOUNTS where two glows overlap, which is the honest');
console.log('  direction for a fill-rate figure: overlapping additive quads are');
console.log('  drawn and blended twice.  100% is one full-screen additive layer,');
console.log('  which the spec models at about 1.5ms of a 13.9ms Quest 3 frame.');
console.log('');
