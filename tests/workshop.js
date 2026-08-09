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
  P('mergeParts does not mutate a cached non-indexed geometry, and repeats do not drift', ()=>{
    const shape = new THREE.Shape();
    shape.moveTo(0,0); shape.lineTo(1,0); shape.lineTo(1,1); shape.lineTo(0,1); shape.closePath();
    const cached = new THREE.ExtrudeGeometry(shape, {depth:1, bevelEnabled:false});
    if(cached.index) throw new Error('test assumption failed: ExtrudeGeometry came out indexed');
    const before = Float32Array.from(cached.attributes.position.array);
    mergeParts([{geo:cached, pos:[10,0,0]}]);
    const after = cached.attributes.position.array;
    for(let i=0;i<before.length;i++){
      if(Math.abs(before[i]-after[i]) > 1e-9) throw new Error('cached geometry mutated at index '+i);
    }
    const a = mergeParts([{geo:cached, pos:[0,0,0]}]);
    const b = mergeParts([{geo:cached, pos:[0,0,0]}]);
    a.computeBoundingBox(); b.computeBoundingBox();
    if(Math.abs(a.boundingBox.max.x - b.boundingBox.max.x) > 1e-6 || Math.abs(a.boundingBox.min.x - b.boundingBox.min.x) > 1e-6)
      throw new Error('merging the same cached geometry twice drifted: '+a.boundingBox.max.x+' vs '+b.boundingBox.max.x);
    return 'cached geometry untouched across two merges';
  });
  P('mergeParts turns the normals with the geometry, not just the positions', ()=>{
    const g = mergeParts([{geo:new THREE.BoxGeometry(1,1,1), rot:[0, Math.PI/2, 0]}]);
    const p = g.attributes.position, n = g.attributes.normal;
    let sum = 0, count = 0;
    for(let i=0;i<n.count;i++){
      const nx = Math.round(n.getX(i)), ny = Math.round(n.getY(i)), nz = Math.round(n.getZ(i));
      if(nx === 1 && ny === 0 && nz === 0){ sum += p.getX(i); count++; }
    }
    if(count === 0) throw new Error('no vertex normal rounded to (1,0,0) after the turn');
    const meanX = sum / count;
    if(Math.abs(meanX - 0.5) > 1e-5) throw new Error('(1,0,0)-normal face sits at mean x ' + meanX + ', wanted 0.5');
    return 'the +X-normal face after the turn sits at x=' + meanX.toFixed(3);
  });
  P('mergeParts honours scale', ()=>{
    const g = mergeParts([{geo:new THREE.BoxGeometry(1,1,1), scale:[3,1,1]}]);
    g.computeBoundingBox();
    const b = g.boundingBox;
    if(Math.abs((b.max.x - b.min.x) - 3) > 1e-5) throw new Error('x span ' + (b.max.x-b.min.x) + ', wanted 3');
    if(Math.abs((b.max.y - b.min.y) - 1) > 1e-5) throw new Error('y span ' + (b.max.y-b.min.y) + ', wanted 1');
    return 'a 1x1x1 scaled 3x in x spans 3';
  });
  P('mergeParts applies the x Euler slot on its own, not swapped with z', ()=>{
    const g = mergeParts([{geo:new THREE.BoxGeometry(1,2,1), rot:[Math.PI/2,0,0]}]);
    g.computeBoundingBox();
    const b = g.boundingBox;
    if(Math.abs((b.max.x - b.min.x) - 1) > 1e-5) throw new Error('x span ' + (b.max.x-b.min.x) + ', wanted 1');
    if(Math.abs((b.max.y - b.min.y) - 1) > 1e-5) throw new Error('y span ' + (b.max.y-b.min.y) + ', wanted 1');
    if(Math.abs((b.max.z - b.min.z) - 2) > 1e-5) throw new Error('z span ' + (b.max.z-b.min.z) + ', wanted 2');
    return 'a 1x2x1 turned 90deg about x spans 1,1,2';
  });
  P('mergeParts keeps a UV per vertex', ()=>{
    const g = mergeParts([{geo:new THREE.BoxGeometry(1,1,1)}]);
    const uv = g.attributes.uv;
    if(!uv) throw new Error('no uv attribute on the merged geometry');
    if(uv.count !== g.attributes.position.count) throw new Error('uv.count ' + uv.count + ' != position.count ' + g.attributes.position.count);
    return uv.count + ' uvs, one per vertex';
  });

  console.log('--- the workshop palette (RULING AM) ---');
  P('the shed palette exists and every material is shared, not per object', ()=>{
    const want = ['galv','castIron','moulded','rubber','hazard','ply'];
    want.forEach(k=>{ if(!M[k]) throw new Error('no M.' + k); });
    if(!TX.galv) throw new Error('no TX.galv');
    if(M.galv.map !== TX.galv) throw new Error('M.galv is not wired to TX.galv');
    return want.join(', ');
  });
  P('the palette is six materials, not one per object', ()=>{
    const set = new Set([M.galv, M.castIron, M.moulded, M.rubber, M.hazard, M.ply]);
    if(set.size !== 6) throw new Error('the palette collapsed to ' + set.size + ' materials');
    return '6 distinct, all shared';
  });
  P('the palette is NEW material, not an alias of the old kit', ()=>{
    const old = [M.steel, M.pipe, M.fixture, M.wood, M.woodDk, M.black, M.plaster];
    ['galv','castIron','moulded','rubber','hazard','ply'].forEach(k=>{
      if(old.indexOf(M[k]) !== -1) throw new Error('M.' + k + ' is an alias of an existing material');
      if(!M[k].isMeshStandardMaterial) throw new Error('M.' + k + ' is not a standard material');
    });
    return 'six distinct new materials';
  });
  P('every workshop texture is a canvas texture, no asset files (RULING AI)', ()=>{
    ['galv','castIron','moulded','rubber','hazard','ply'].forEach(k=>{
      if(!TX[k]) throw new Error('no TX.' + k);
      if(!TX[k].isCanvasTexture) throw new Error('TX.' + k + ' is not a CanvasTexture');
    });
    return 'six canvas textures';
  });
  P('stencil draws a label texture without touching a shared one', ()=>{
    const a = stencilTex('SHOP', '#1a1a1a');
    const b = stencilTex('SHOP', '#1a1a1a');
    if(!a || !a.isTexture) throw new Error('stencilTex did not return a texture');
    if(a !== b) throw new Error('stencilTex is not cached — it would mint a texture per call');
    const c = stencilTex('BAY 2', '#1a1a1a');
    if(c === a) throw new Error('stencilTex cache ignores the text');
    return 'cached by text and colour';
  });

  console.log('--- the belt, rebuilt (RULING AK budget) ---');
  P('the belt tools cost no more meshes than they did', ()=>{
    if(!VR.rig){ VR.rig = new THREE.Group(); VR.rig.name = 'vr:rig'; scene.add(VR.rig); }
    if(!VR.belt) vrBuildBelt();
    const count = o => { let n=0; o.traverse(c=>{ if(c.isMesh) n++; }); return n; };
    const BUDGET = {nailgun:3, hammer:2, tape:2, crayon:2};
    const got = {};
    Object.keys(BUDGET).forEach(k=>{
      got[k] = count(VR.toolMesh[k]);
      if(got[k] > BUDGET[k]) throw new Error(k + ' is ' + got[k] + ' meshes, budget ' + BUDGET[k]);
    });
    return got;
  });
  P('the gun steel still reaches the same muzzle depth', ()=>{
    if(!VR.rig){ VR.rig = new THREE.Group(); VR.rig.name = 'vr:rig'; scene.add(VR.rig); }
    if(!VR.belt) vrBuildBelt();
    const g = VR.toolMesh.nailgun;
    let steel = null;
    g.traverse(c=>{ if(c.isMesh && c.geometry && c.geometry.attributes.position) {
      if(!c.geometry.boundingBox) c.geometry.computeBoundingBox();
      if(c.geometry.boundingBox.min.z < -0.1) steel = c;
    }});
    if(!steel) throw new Error('no mesh whose geometry reaches out to the muzzle end of the gun');
    if(steel.geometry.boundingBox.min.z > -0.19)
      throw new Error('muzzle only reaches z ' + steel.geometry.boundingBox.min.z.toFixed(3) + ', wanted <= -0.19 (nailRay has always cast from -0.16)');
    return 'merged steel geometry reaches z ' + steel.geometry.boundingBox.min.z.toFixed(3);
  });

  console.log('--- the cut stations (RULINGS AK + AL) ---');
  P('the saws cost no more meshes than they did', ()=>{
    const count = o => { let n=0; o.traverse(c=>{ if(c.isMesh) n++; }); return n; };
    const t = count(SAWS.palace.track.group), ch = count(SAWS.palace.chop.group);
    if(t > 7)  throw new Error('track saw is ' + t + ' meshes, budget 7');
    if(ch > 7) throw new Error('chop bench is ' + ch + ' meshes, budget 7');
    return {track:t, chop:ch};
  });
  P('the cutter survived the merge as its own moving group (RULING AL)', ()=>{
    ['track','chop'].forEach(k=>{
      const st = SAWS.palace[k];
      if(!st.cutter) throw new Error(k + ' lost its cutter');
      if(!st.cutter.userData.moves) throw new Error(k + ' cutter lost userData.moves');
      if(st.cutter.parent !== st.group) throw new Error(k + ' cutter was merged into the body');
      let n = 0; st.cutter.traverse(c=>{ if(c.isMesh) n++; });
      if(n < 1) throw new Error(k + ' cutter has no mesh of its own');
    });
    return 'both cutters still slide';
  });
  P('the saw record kept every field the logic reads', ()=>{
    const st = SAWS.palace.track;
    ['venue','kind','group','seat','cutter','pieces','cut','span','grabR','gripY']
      .forEach(f=>{ if(st[f] === undefined) throw new Error('saw record lost ' + f); });
    if(Math.abs(st.grabR - 0.28) > 1e-9) throw new Error('grabR moved to ' + st.grabR);
    return 'span ' + st.span.toFixed(2) + ', grabR ' + st.grabR;
  });

  console.log('--- the paint rack and the drum (RULINGS AK + AL) ---');
  P('the roller head survived as its own mesh with its own material', ()=>{
    const ro = RACKS.palace.roller;
    if(!ro || !ro.head) throw new Error('the rack lost its roller head');
    if(!ro.head.isMesh) throw new Error('the roller head is not a mesh');
    if(!ro.head.material) throw new Error('the roller head has no material of its own');
    const before = ro.head.material;
    ro.head.material = woodMat(0x884422);
    if(ro.head.material === before) throw new Error('the head material cannot be swapped');
    ro.head.material = before;
    return 'swappable, so a dip still shows';
  });
  P('the rack record kept every field the logic reads', ()=>{
    const r = RACKS.palace;
    ['venue','group','shelfW','shelfY','colors','canMeshes','roller'].forEach(f=>{
      if(r[f] === undefined) throw new Error('rack record lost ' + f); });
    if(Math.abs(r.roller.grabR - 0.22) > 1e-9) throw new Error('roller grabR moved');
    if(!r.roller.home) throw new Error('the roller lost its home — vrReRack would throw');
    return 'shelfY ' + r.shelfY + ', grabR ' + r.roller.grabR;
  });
  P('each can still carries its own colour, independently', ()=>{
    const r = RACKS.palace;
    if(!r.canMeshes.length) throw new Error('no cans on the rack');
    /* a can is a GROUP: a shared steel body plus a band in its own colour
       from the woodMat cache.  What matters is that the bands do not share
       a material, or every can on the shelf would be one colour. */
    const bands = r.canMeshes.map(g=>{
      let b = null;
      g.traverse(c=>{ if(c.isMesh && c.material !== M.steel) b = c; });
      if(!b) throw new Error('a can has no banded mesh of its own');
      return b;
    });
    const mats = new Set(bands.map(b=>b.material));
    if(mats.size !== bands.length) throw new Error('cans share band materials: ' + mats.size + ' for ' + bands.length + ' cans');
    r.canMeshes.forEach(g=>{ if(g.userData.paintColor === undefined) throw new Error('a can lost its paintColor'); });
    return bands.length + ' cans, ' + mats.size + ' distinct band materials';
  });
  P('the rack and the drum cost no more than they did', ()=>{
    const count = o => { let n=0; o.traverse(c=>{ if(c.isMesh) n++; }); return n; };
    const rk = count(RACKS.palace.group), tr = count(TRASH.palace.group);
    if(rk > 12) throw new Error('the rack is ' + rk + ' meshes, budget 12');
    if(tr > 3)  throw new Error('the drum is ' + tr + ' meshes, budget 3');
    if(Math.abs(TRASH.palace.r - 0.45) > 1e-9) throw new Error('the drum mouth radius moved');
    return {rack:rk, trash:tr};
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
