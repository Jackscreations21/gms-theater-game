/* buildload.js — what does a standing build cost per frame?
   Stands loose wood in the Palace shed, lets it settle, then times
   updateBodies in the STEADY state — the case a player actually lives in.
   Not pass/fail: a measurement. See tools/README.md for how to run it. */
const {JSDOM} = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname,'..','the-house.html'),'utf8');
const dom = new JSDOM(html.replace(/<script src=.*?<\/script>/,''), {runScripts:'outside-only', pretendToBeVisual:true});
const w = dom.window;
w.HTMLCanvasElement.prototype.getContext = function(){
  const noop=()=>{};
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
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); }
};
w.THREE = THREE;
w.AudioContext = undefined;
w.requestAnimationFrame = cb => { w.__raf = cb; return 1; };
w.__now = () => Number(process.hrtime.bigint()) / 1e6;   // ms, monotonic

const probe = `
;(function(){
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }

  const time = (n, fn)=>{
    fn(); fn();                                   // warm
    const t0 = window.__now();
    for(let i=0;i<n;i++) fn();
    return (window.__now() - t0)/n;
  };
  const stand = (n)=>{
    for(let i=0;i<n;i++){
      const b = regWood('s2x4', {L:2.44});
      b.venue = 'palace';
      b.mesh.position.set(-6 + (i%12)*0.5, 0.25, -26 + Math.floor(i/12)*0.5);
      b.state = 'loose';
    }
  };

  console.log('=== a standing build, per frame ===');
  console.log('bodies already in the world: ' + BODIES.length);
  console.log('');

  const rows = [];
  let prev = 0;
  [0, 25, 50, 100, 150].forEach(n=>{
    stand(n - prev); prev = n;
    for(let i=0;i<400;i++) updateBodies(0.016);   // settle: time the STEADY state
    const ms = time(200, ()=>updateBodies(0.016));
    rows.push([n, ms]);
    console.log('  ' + String(n).padStart(3) + ' loose pieces -> ' + ms.toFixed(3) + ' ms/frame');
  });

  console.log('');
  console.log('=== what the work actually is, at ' + rows[rows.length-1][0] + ' pieces ===');
  const realGround = groundAt;
  window.__g = 0;
  groundAt = function(){ window.__g++; return realGround.apply(null, arguments); };
  const rota = (typeof REST_ROTA === 'number') ? REST_ROTA : 1;
  for(let i=0;i<rota;i++) updateBodies(0.016);
  groundAt = realGround;
  console.log('  groundAt calls over ' + rota + ' frame(s): ' + window.__g);
  console.log('  (each is a recursive raycast against WALKABLE)');

  let loose = 0, moving = 0;
  const before = [];
  BODIES.forEach(b=>{ if(b.state==='loose' && !b.frozen){ loose++; before.push([b, b.mesh.position.y]); } });
  updateBodies(0.016);
  before.forEach(p=>{ if(Math.abs(p[0].mesh.position.y - p[1]) > 1e-9) moving++; });
  console.log('  loose bodies: ' + loose + ', actually moving: ' + moving);

  console.log('');
  console.log('=== budget ===');
  const budget = 13.9;                            // 72Hz, the VR target
  const worst = rows[rows.length-1][1];
  console.log('  a 72Hz frame is ' + budget + ' ms for EVERYTHING.');
  console.log('  updateBodies at ' + rows[rows.length-1][0] + ' pieces: ' +
              (worst/budget*100).toFixed(1) + '% of it on this machine.');
  console.log('  a headset CPU is several times slower than a desktop one —');
  console.log('  read this as a ratio to watch, not an absolute.');
})();
`;
const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); }
catch(e){ console.log('TOP LEVEL THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
