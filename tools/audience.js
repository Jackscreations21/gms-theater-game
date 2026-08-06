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
  const process_env_show = '${SHOWKEY}';
;(function(){
  for(let i=0;i<60;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  showLoad(process_env_show || 'outsiders');
  window.__probeCurtain = false;   // set true to look at the show curtain instead
  world.updateMatrixWorld(true);
  world.updateMatrixWorld(true);
  /* scenery batches have raycasting switched off for speed; put it back just
     for the probe by dropping the own-property and revealing the prototype */
  SHOW.group.traverse(o=>{ if(o.isInstancedMesh && o !== (SHOW.rain&&SHOW.rain.mesh)) delete o.raycast; });

  /* Cast a grid of rays from an orchestra seat through the proscenium and
     print what each one lands on.  A crude picture, but enough to tell a
     house frame from a picket fence.                                      */
  const eye = new THREE.Vector3(0, 2.0, 12.0);
  const W = 118, H = 42;
  const halfW = 8.6, top = 11.4, bot = -0.2, planeZ = -11.6;
  const drop = SHOW.wall;
  const targets = [SHOW.group];
  if(typeof SHOW.showCurtainProbe !== 'undefined' || true){
    const cl = FLY.find(l=>l.goodsKey === SHOW.curtainKey);
    if(cl && cl.goods && window.__probeCurtain){ targets.length = 0; targets.push(cl.goods); }
  }
  const ray = new THREE.Raycaster();
  const rows = [];
  for(let j=0;j<H;j++){
    let line = '';
    for(let i=0;i<W;i++){
      const x = -halfW + (i/(W-1))*halfW*2;
      const y = top - (j/(H-1))*(top-bot);
      const dir = new THREE.Vector3(x - eye.x, y - eye.y, planeZ - eye.z).normalize();
      ray.set(eye, dir); ray.near = 0; ray.far = 60;
      const hits = ray.intersectObjects(targets, true);
      if(!hits.length){ line += ' '; continue; }
      const o = hits[0].object;
      line += (o === SHOW.wall) ? '.' : (o.material && o.material.color && o.material.color.getHex() === 0x14110c) ? ':' : '#';
    }
    rows.push(line);
  }
  console.log('=== what the audience sees (# set, . wall behind) ===');
  rows.forEach(r=>console.log('|'+r+'|'));
})();
`;
const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); } catch(e){ console.log('THREW '+e.message); console.log(e.stack.split('\n').slice(0,5).join('\n')); }
