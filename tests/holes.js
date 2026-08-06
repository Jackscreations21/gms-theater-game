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
  for(let i=0;i<60;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  window.__errs = [];
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,160):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); window.__errs.push(name+': '+e.message); } };
  world.updateMatrixWorld(true);

  /* Fire rays outwards from inside the building.  Anything that reaches a long
     way without hitting something is a hole in the shell.                    */
  const solids = [];
  world.traverse(o=>{
    if(!o.isMesh || !o.geometry) return;
    if(o.material && o.material.visible === false) return;
    if(o.material && o.material.transparent && o.material.opacity < 0.3) return;
    solids.push(o);
  });
  const ray = new THREE.Raycaster();
  function leaks(from, dirs, far){
    const out = [];
    for(const d of dirs){
      ray.set(from, d.clone().normalize());
      ray.far = far;
      const h = ray.intersectObjects(solids, true);
      if(!h.length) out.push(d);
    }
    return out;
  }
  const V = (x,y,z)=>new THREE.Vector3(x,y,z);

  console.log('--- is the shell closed? ---');
  P('you cannot see out of the stage house sideways', ()=>{
    const bad = [];
    for(let z=-15; z<=0; z+=1.5) for(let y=1.2; y<=18; y+=2.2){
      // stage left
      if(!leaks(V(XL-2, y, z), [V(1,0,0)], 60).length === false) {}
      if(leaks(V(XL-2, y, z), [V(1,0,0)], 60).length) bad.push('SL y='+y+' z='+z);
      // stage right, aiming past the dock as well
      if(leaks(V(XR+2, y, z), [V(-1,0,0)], 80).length) bad.push('SR y='+y+' z='+z);
    }
    if(bad.length) throw new Error(bad.length+' leaks, first: '+bad.slice(0,4).join(', '));
    return 'both side walls solid from the deck to the grid';
  });
  P('you cannot see out of the back of the stage house', ()=>{
    const bad = [];
    for(let x=XR+2; x<=XL-2; x+=2.5) for(let y=1.2; y<=22; y+=2.6)
      if(leaks(V(x, y, D.backWall+2), [V(0,0,-1)], 60).length) bad.push('x='+x.toFixed(0)+' y='+y.toFixed(0));
    if(bad.length) throw new Error(bad.length+' leaks through the back wall, first: '+bad.slice(0,4).join(', '));
    return 'the upstage wall is solid the whole width and height';
  });
  P('there is no gap beside the proscenium', ()=>{
    // stand in each wing and look straight out into the auditorium
    const bad = [];
    for(const x of [XR+3, XR+8, -D.procW/2-2, D.procW/2+2, XL-3]){
      for(let y=1.2; y<=16; y+=2.0){
        if(leaks(V(x, y, -1.5), [V(0,0,1)], 70).length) bad.push('x='+x.toFixed(0)+' y='+y.toFixed(0));
      }
    }
    if(bad.length) throw new Error(bad.length+' sightlines straight from the wings into the house: '+
      bad.slice(0,4).join(', '));
    return 'the proscenium wall closes the whole stage house';
  });
  P('the roof is on', ()=>{
    const bad = [];
    // upstage of the proscenium the building is the full stage width; out in
    // front of it, it is only as wide as the auditorium
    for(let z=-15; z<=D.houseBack-2; z+=4){
      const lim = z < 1.3 ? [XR+3, XL-3] : [-D.houseW/2+2, D.houseW/2-2];
      for(let x=lim[0]; x<=lim[1]; x+=3)
        if(leaks(V(x, 2, z), [V(0,1,0)], 60).length) bad.push(x.toFixed(0)+','+z.toFixed(0));
    }
    if(bad.length) throw new Error(bad.length+' holes in the roof, first: '+bad.slice(0,4).join(', '));
    return 'no sky anywhere inside';
  });
  P('the street wall is actually there', ()=>{
    const cz = (DOCK.z0 + DOCK.z1)/2;
    const bad = [];
    // with the shutters down there should be no way to see out at all
    setAllDockDoors(false);
    for(let i=0;i<300;i++) updateDockDoors(0.05);
    world.updateMatrixWorld(true);
    solids.length = 0;
    world.traverse(o=>{ if(o.isMesh && o.geometry &&
      !(o.material && o.material.visible === false) &&
      !(o.material && o.material.transparent && o.material.opacity < 0.3)) solids.push(o); });
    for(let z=DOCK.z1+1; z<=DOCK.z0-1; z+=1.2) for(let y=0.6; y<=DOCK.h-0.4; y+=1.0)
      if(leaks(V(DOCK.inner + DOCK.dir*3, y, z), [V(DOCK.dir,0,0)], 40).length)
        bad.push('z='+z.toFixed(0)+' y='+y.toFixed(1));
    if(bad.length) throw new Error(bad.length+' holes in the street wall: '+bad.slice(0,4).join(', '));
    return 'sealed from the deck to the roof with the shutters down';
  });
  P('rolling a shutter up opens a hole and only there', ()=>{
    // the lorry is parked outside, so "can you see infinity" is the wrong
    // question — ask how far the ray gets before it hits anything
    const reach = (z)=>{
      ray.set(V(DOCK.inner + DOCK.dir*3, 2.0, z), V(DOCK.dir,0,0).normalize());
      ray.far = 60;
      const h = ray.intersectObjects(solids, true);
      return h.length ? h[0].point.x : -999;
    };
    const rebuild = ()=>{ world.updateMatrixWorld(true); solids.length = 0;
      world.traverse(o=>{ if(o.isMesh && o.geometry &&
        !(o.material && o.material.visible === false) &&
        !(o.material && o.material.transparent && o.material.opacity < 0.3)) solids.push(o); }); };
    const d = DOCKDOORS.find(x=>!x.big), other = DOCKDOORS.find(x=>!x.big && x !== d);
    setAllDockDoors(false); for(let i=0;i<300;i++) updateDockDoors(0.05); rebuild();
    const shutReach = reach(d.z);
    if(shutReach < DOCK.outer - 0.5)
      throw new Error('a shut shutter did not stop the ray, it got to '+shutReach.toFixed(1));
    d.target = 1; for(let i=0;i<300;i++) updateDockDoors(0.05); rebuild();
    const openReach = reach(d.z);
    if(openReach > DOCK.outer - 0.5)
      throw new Error('the shutter went up but the ray still stops at '+openReach.toFixed(1));
    if(reach(other.z) < DOCK.outer - 0.5) throw new Error('the other door opened too');
    setAllDockDoors(false); for(let i=0;i<300;i++) updateDockDoors(0.05); rebuild();
    return 'shut stops at '+shutReach.toFixed(1)+', open reaches '+openReach.toFixed(1);
  });
  P('the dock bay is closed except for its doors', ()=>{
    const cz = (DOCK.z0 + DOCK.z1)/2;
    const bad = [];
    // up, and off both ends
    for(let x=DOCK.x0+2; x<=DOCK.x1-2; x+=2.5){
      if(leaks(V(x, 2, cz), [V(0,1,0)], 40).length) bad.push('roof x='+x.toFixed(0));
      if(leaks(V(x, 2, DOCK.z1+1), [V(0,0,-1)], 40).length) bad.push('US end x='+x.toFixed(0));
      if(leaks(V(x, 2, DOCK.z0-1), [V(0,0,1)], 40).length) bad.push('DS end x='+x.toFixed(0));
    }
    if(bad.length) throw new Error(bad.length+' holes in the dock: '+bad.slice(0,4).join(', '));
    return 'roof and both ends closed';
  });

  console.log('--- which side is which ---');
  P('the dock is on stage right, which is negative x', ()=>{
    if(DOCK.inner >= 0) throw new Error('the dock is at x='+DOCK.inner+', that is stage left');
    if(DOCK.outer >= DOCK.inner) throw new Error('the bay runs the wrong way');
    // a performer facing the audience (+z) has stage right on their -x side
    // facing x up, not up x facing: a performer looking at the house has their
    // right hand towards -x
    const facing = new THREE.Vector3(0,0,1);
    const right = new THREE.Vector3().crossVectors(facing, new THREE.Vector3(0,1,0)).normalize();
    if(right.x > 0) throw new Error('stage right came out positive, check the convention');
    return 'dock inner face at x='+DOCK.inner.toFixed(1)+', street wall at '+DOCK.outer.toFixed(1);
  });
  P('stage right runs further out than stage left', ()=>{
    const l = Math.abs(XL), r = Math.abs(XR);
    if(r <= l) throw new Error('stage right is '+r+'m, stage left is '+l+'m');
    const wingR = r - D.procW/2, wingL = l - D.procW/2;
    return 'stage right wing '+wingR.toFixed(1)+'m, stage left '+wingL.toFixed(1)+'m';
  });
  P('the deck reaches both walls', ()=>{
    for(const x of [XR+1, XR+6, XR+12, -10, 0, 10, XL-1]){
      const g = groundAt(x, -6, 2);
      if(g === null) throw new Error('no deck at x='+x.toFixed(1));
      if(Math.abs(g) > 0.05) throw new Error('the deck at x='+x.toFixed(1)+' is at y='+g.toFixed(2));
    }
    // and the dock is flush with it, not a step up
    const dk = groundAt(DOCK.outer + DOCK.dir*-2, -7.5, 2);
    if(dk === null || Math.abs(dk) > 0.05) throw new Error('the dock is not level with the stage, y='+dk);
    return 'deck runs '+XR.toFixed(0)+' to '+XL.toFixed(0);
  });
  P('the fly floor and pin rail moved with the wall', ()=>{
    const gal = groundAt(XR+1.6, -6, 9);
    if(gal === null || Math.abs(gal - 8.15) > 0.4)
      throw new Error('the fly gallery is not against the stage-right wall, got '+gal);
    return 'fly floor at x='+(XR+1.6).toFixed(1)+', y='+gal.toFixed(2);
  });

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;
const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); } catch(e){ console.log('THREW '+e.message); console.log(e.stack.split('\n').slice(0,5).join('\n')); }
