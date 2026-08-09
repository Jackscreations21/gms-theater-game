/* tools/census.js — prints the mesh count of every object this round
   touches.  Not pass/fail: it is the BASELINE for the RULING AK budget. */
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

const probe = `
;(function(){
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  const count = o => { let n=0; if(!o) return -1; o.traverse(c=>{ if(c.isMesh) n++; }); return n; };
  /* The belt hangs off VR.rig, and VR.rig is null until vrOnStart runs off a
     WebXR sessionstart event that never fires in a probe.  Making the rig
     here is exactly what vrOnStart does with it (a bare named Group added to
     the scene), and the tool geometry is identical either way — which is all
     a mesh census reads.  tests/vr.js takes the fuller route, firing a real
     sessionstart at a FakeXR, because it is testing the session itself. */
  if(!VR.rig){ VR.rig = new THREE.Group(); VR.rig.name = 'vr:rig'; scene.add(VR.rig); }
  vrBuildBelt();
  const rows = [];
  rows.push(['nailgun', count(VR.toolMesh.nailgun)]);
  rows.push(['hammer',  count(VR.toolMesh.hammer)]);
  rows.push(['tape',    count(VR.toolMesh.tape)]);
  rows.push(['crayon',  count(VR.toolMesh.crayon)]);
  rows.push(['saw:track', count(SAWS.palace.track.group)]);
  rows.push(['saw:chop',  count(SAWS.palace.chop.group)]);
  rows.push(['rack',   count(RACKS.palace.group)]);
  rows.push(['trash',  count(TRASH.palace.group)]);
  rows.push(['lift',   count(LIFTS.palace.group)]);
  rows.push(['cart',   count(CARTS.palace.group)]);
  console.log('BASELINE CENSUS');
  rows.forEach(r=>console.log('  ' + r[0].padEnd(12) + r[1]));
  console.log('JSON ' + JSON.stringify(rows.reduce((a,r)=>{a[r[0]]=r[1]; return a;},{})));
})();
`;
const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); }
catch(e){ console.log('TOP LEVEL THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
