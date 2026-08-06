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
};
w.THREE = THREE;
w.AudioContext = undefined;
w.requestAnimationFrame = cb => { w.__raf = cb; return 1; };
const SHOWKEY = process.argv[2] || 'outsiders';
const probe = `
;(function(){
  for(let i=0;i<60;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  goToView(11);
  ARC.group.traverse(o=>{ if(o.isInstancedMesh) delete o.raycast; });
  world.updateMatrixWorld(true); scene.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const chars = '#%*+=-:.';
  const shot = (title, eye, look, halfW, top, bot, W, H)=>{
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
        ray.set(eye, dir); ray.near = 0; ray.far = 140;
        const hits = ray.intersectObjects([ARC.group], true);
        if(!hits.length){ line += ' '; continue; }
        line += chars[Math.min(chars.length-1, Math.max(0, Math.floor((hits[0].distance-6)/6)))];
      }
      console.log('|'+line+'|');
    }
  };
  const X = ARC.X;
  shot('THE ARC — the foyer, from just inside the glass',
       new THREE.Vector3(X, 1.7, 33), new THREE.Vector3(X, 5, 9), 20, 12.5, -0.5, 104, 26);
  shot('THE ARC — the main house from the back of the stalls',
       new THREE.Vector3(X-16, 6.6, 4), new THREE.Vector3(X-16, 5, -34), 15, 12, -1, 104, 26);
  shot('THE ARC — the studio',
       new THREE.Vector3(X+20, 1.7, 5), new THREE.Vector3(X+20, 3.5, -20), 12, 8.4, -0.4, 104, 24);
})();
`;
const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); } catch(e){ console.log('THREW '+e.message); console.log(e.stack.split('\n').slice(0,5).join('\n')); }
