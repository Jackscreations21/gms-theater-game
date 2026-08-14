const {JSDOM} = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname,'..','the-house.html'),'utf8');
const dom = new JSDOM(html.replace(/<script src=.*?<\/script>/,''), {runScripts:'outside-only', pretendToBeVisual:true});
const w = dom.window;
w.HTMLCanvasElement.prototype.getContext = function(){
  const noop=()=>{};
  /* one context per canvas, the way a browser does it — otherwise nothing that
     sets state on the context and reads it back later can be tested          */
  if(this.__ctx) return this.__ctx;
  return this.__ctx = {fillRect:noop, fillStyle:'', strokeStyle:'', lineWidth:1, font:'',
    beginPath:noop, moveTo:noop, lineTo:noop, arc:noop, ellipse:noop, stroke:noop, fill:noop,
    save:noop, restore:noop, translate:noop, rotate:noop, scale:noop, drawImage:noop, clearRect:noop, createPattern:()=>null, fillText:noop, strokeText:noop, strokeRect:noop, rect:noop, arcTo:noop, setLineDash:noop, measureText:()=>({width:100}), bezierCurveTo:noop, quadraticCurveTo:noop, closePath:noop, clip:noop, setTransform:noop,
    globalAlpha:1, globalCompositeOperation:'',
    createLinearGradient:()=>({addColorStop:noop}), createRadialGradient:()=>({addColorStop:noop}),
    getImageData:(x,y,ww,hh)=>({data:new Uint8ClampedArray(Math.max(4,ww*hh*4))}), putImageData:noop};
};
const REAL = require('three');
const THREE = Object.create(REAL);
THREE.WebGLRenderer = class {
  constructor(){ const c = w.document.createElement('canvas');
    c.requestPointerLock = ()=>{};
    this.domElement = c; this.shadowMap = {enabled:false, type:0};
    this.renderCount = 0; }
  setPixelRatio(){} setSize(){}
  render(scene, camera){ this.renderCount++;
    // walk the graph the way the renderer would, to catch bad matrices
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); }
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
const SHOWKEY = process.argv[2] || 'outsiders';
const probe = `
;(function(){
  for(let i=0;i<60;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  goToView(19);
  ARC.group.traverse(o=>{ if(o.isInstancedMesh) delete o.raycast; });
  FLY.forEach(flyOut);
  for(let i=0;i<900;i++){ updateFly(0.05); updateArc(0.05); }
  scene.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const chars = '#%*+=-:.';
  const shot = (title, eye, look, halfW, top, bot, W, H, band)=>{
    console.log(''); console.log('=== ' + title + ' ===');
    for(let j=0;j<H;j++){
      let line = '';
      for(let i=0;i<W;i++){
        const u = -halfW + (i/(W-1))*halfW*2;
        const v = top - (j/(H-1))*(top-bot);
        const fwd = new THREE.Vector3().subVectors(look, eye).setY(0).normalize();
        const rgt = new THREE.Vector3(fwd.z, 0, -fwd.x);
        const tgt = new THREE.Vector3().addVectors(look, rgt.multiplyScalar(u));
        tgt.y = v;
        const dir = new THREE.Vector3().subVectors(tgt, eye).normalize();
        ray.set(eye, dir); ray.near = 0; ray.far = 160;
        const hits = ray.intersectObjects([ARC.group], true);
        if(!hits.length){ line += ' '; continue; }
        line += chars[Math.min(chars.length-1, Math.max(0, Math.floor((hits[0].distance-4)/band)))];
      }
      console.log('|'+line+'|');
    }
  };
  const X = ARC.X, H = ARC.houses.studio;
  shot('STUDIO — from the stage, looking back at the seating',
       new THREE.Vector3(X + H.cx, 1.4, H.zPros - 2), new THREE.Vector3(X + H.cx, 2, 6),
       13, 7, -2.0, 104, 24, 2.6);
})();
`;
const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); } catch(e){ console.log('THREW '+e.message); console.log(e.stack.split('\n').slice(0,5).join('\n')); }
