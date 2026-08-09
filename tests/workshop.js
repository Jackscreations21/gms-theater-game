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

const probe = `
;(function(){
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  window.__errs = [];
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,210):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); if(e.stack) console.log('      '+e.stack.split('\\n').slice(1,4).join(' | ')); window.__errs.push(name+': '+e.message); } };

  console.log('--- the merge helper (RULING AK) ---');
  P('mergeParts bakes a translation into the vertices', ()=>{
    const g = mergeParts([{geo:new THREE.BoxGeometry(1,1,1), pos:[5,0,0]}]);
    const p = g.attributes.position;
    let minX = Infinity, maxX = -Infinity;
    for(let i=0;i<p.count;i++){ minX = Math.min(minX, p.getX(i)); maxX = Math.max(maxX, p.getX(i)); }
    if(Math.abs(minX - 4.5) > 1e-6) throw new Error('minX ' + minX + ', wanted 4.5');
    if(Math.abs(maxX - 5.5) > 1e-6) throw new Error('maxX ' + maxX + ', wanted 5.5');
    return 'x spans ' + minX.toFixed(2) + ' to ' + maxX.toFixed(2);
  });
  P('mergeParts bakes a rotation, and the normals turn with it', ()=>{
    const g = mergeParts([{geo:new THREE.BoxGeometry(2,1,1), rot:[0, Math.PI/2, 0]}]);
    g.computeBoundingBox();
    const b = g.boundingBox;
    if(Math.abs((b.max.x - b.min.x) - 1) > 1e-5) throw new Error('x span ' + (b.max.x-b.min.x) + ', wanted 1');
    if(Math.abs((b.max.z - b.min.z) - 2) > 1e-5) throw new Error('z span ' + (b.max.z-b.min.z) + ', wanted 2');
    const n = g.attributes.normal;
    if(!n) throw new Error('no normals on the merged geometry');
    let len = 0;
    for(let i=0;i<n.count;i++){ len += Math.hypot(n.getX(i), n.getY(i), n.getZ(i)); }
    if(Math.abs(len/n.count - 1) > 1e-3) throw new Error('normals not unit length: ' + (len/n.count));
    return 'a 2x1x1 turned 90deg spans 1 in x and 2 in z';
  });
  P('mergeParts concatenates: two boxes make one geometry', ()=>{
    const one = mergeParts([{geo:new THREE.BoxGeometry(1,1,1)}]);
    const two = mergeParts([{geo:new THREE.BoxGeometry(1,1,1), pos:[-1,0,0]},
                            {geo:new THREE.BoxGeometry(1,1,1), pos:[ 1,0,0]}]);
    if(two.attributes.position.count !== one.attributes.position.count * 2)
      throw new Error('expected ' + (one.attributes.position.count*2) + ' verts, got ' + two.attributes.position.count);
    two.computeBoundingBox();
    if(Math.abs(two.boundingBox.max.x - 1.5) > 1e-6) throw new Error('bbox did not grow to the second box');
    return two.attributes.position.count + ' verts, one buffer';
  });
  P('mergeParts gives the result a bounding sphere', ()=>{
    const g = mergeParts([{geo:new THREE.BoxGeometry(1,1,1), pos:[0,3,0]}]);
    if(!g.boundingSphere) throw new Error('no bounding sphere — it would be culled wrong');
    if(Math.abs(g.boundingSphere.center.y - 3) > 1e-6) throw new Error('sphere centre at y=' + g.boundingSphere.center.y);
    return 'centre y ' + g.boundingSphere.center.y;
  });

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); }
catch(e){ console.log('TOP LEVEL THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
process.exit((w.__errs||[]).length ? 1 : 0);
