// build.js — the build system (spec 2026-08-07-build-system-design.md).
// PR 1: the stock and the screen — wood as parametric bodies, the tabbed
// supply screen, manifest pallets, the piece cap.
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

  console.log('--- the stock ---');
  P('every piece of wood is the same box, scaled', ()=>{
    const a = regWood('s2x4'), b = regWood('s2x4'), s = regWood('sheet');
    if(a.mesh.geometry !== b.mesh.geometry || a.mesh.geometry !== s.mesh.geometry)
      throw new Error('wood minted geometry');
    if(Math.abs(a.mesh.scale.y - 2.4384) > 0.001) throw new Error('an 8ft stud is '+a.mesh.scale.y+'m');
    if(Math.abs(s.mesh.scale.x - 2.4384) > 0.001 || Math.abs(s.mesh.scale.y - 1.2192) > 0.001)
      throw new Error('a sheet is '+s.mesh.scale.x.toFixed(3)+' x '+s.mesh.scale.y.toFixed(3));
    if(!Array.isArray(s.mesh.material) || s.mesh.material.length !== 6)
      throw new Error('a sheet has '+(Array.isArray(s.mesh.material)?s.mesh.material.length:1)+' material slots');
    if(s.mesh.material[0] !== regWood('sheet').mesh.material[0])
      throw new Error('two bare sheets carry two materials');
    return 'one geometry, six shared material slots';
  });
  P('wood never hangs on a patch point', ()=>{
    const f = FIXTURES.find(x=>x.body);
    const lantern = BODIES.find(x=>x.mesh === f.body);
    unhangBody(lantern);
    const plank = regWood('s2x4');
    if(hangBody(plank, f)) throw new Error('a 2x4 answered a lighting channel');
    if(!hangBody(lantern, f)) throw new Error('re-hanging the lantern failed');
    return 'the point refused it, the lantern went back';
  });

  console.log('--- the screen ---');
  P('four tabs, and the wood is on the second', ()=>{
    vrBuildOrderScreens();
    const sc = VR.orders.palace;
    const tabs = sc.hits.filter(h=>h.w===122 && h.h===40);
    if(tabs.length !== 4) throw new Error(tabs.length+' tabs');
    tabs[1].fn();
    if(sc.tab !== 1) throw new Error('the tab never switched');
    const plus = sc.hits.filter(h=>h.x===440 && h.w===56);
    if(plus.length !== 4) throw new Error(plus.length+' wood rows');
    tabs[3].fn();
    const small = sc.hits.filter(h=>h.w===40);
    if(small.length !== 20) throw new Error(small.length+' paint buttons for ten colors');
    tabs[0].fn();
    return 'GEAR / WOOD / HDWE / PAINT';
  });
  P('an order of sheets becomes a stacked pallet', ()=>{
    const sc = VR.orders.palace;
    sc.counts = {sheet:3, s2x4:2};
    vrOrderPress(sc);
    const o = ORDERS.palace;
    if(o.pending.length !== 1 || o.pending[0].items.length !== 5)
      throw new Error('the slip did not take: '+sc.status);
    const before = BODIES.length;
    for(let i=0;i<620;i++) updateSheds(0.05);
    if(BODIES.length !== before + 5) throw new Error((BODIES.length-before)+' bodies delivered, wanted 5');
    const fresh = BODIES.slice(-5);
    if(fresh.some(b=>b.kind !== 'wood' || b.state !== 'slotted')) throw new Error('not slotted wood');
    const sheets = fresh.filter(b=>b.prof === 'sheet');
    if(sheets.length !== 3) throw new Error(sheets.length+' sheets came');
    /* the flat stack: each sheet a little above the last, thickness up */
    scene.updateMatrixWorld(true);
    const ys = sheets.map(b=>b.mesh.getWorldPosition(new THREE.Vector3()).y).sort((a,b)=>a-b);
    if(!(ys[1] > ys[0] && ys[2] > ys[1])) throw new Error('the stack is not a stack: '+ys.map(y=>y.toFixed(3)).join(' '));
    if(ys[2] - ys[0] > 0.1) throw new Error('the stack is loose: '+(ys[2]-ys[0]).toFixed(3)+'m tall');
    return '3 sheets stacked flat, 2 studs in the columns';
  });
  P('PIECES FULL at the cap — and the gear book is a different book', ()=>{
    const sc = VR.orders.palace;
    const have = venueBuildCount('palace');
    const fakes = [];
    for(let i = have; i < 150; i++){
      const f = {kind:'wood', venue:'palace', mesh:new THREE.Object3D(), state:'loose', point:null, slot:null};
      fakes.push(f); BODIES.push(f);
    }
    if(orderPlace('palace', [{kind:'wood', prof:'s2x4'}]) !== 'PIECES FULL')
      throw new Error('took wood past the cap');
    const r = orderPlace('palace', ['par']);
    if(r !== 'OK') throw new Error('the piece cap blocked a lantern: '+r);
    ORDERS.palace.pending.pop();   // withdraw it — this test is about the caps
    sc.counts = {s2x4:1}; vrOrderPress(sc);
    if(sc.status !== 'PIECES FULL') throw new Error('the screen says: '+sc.status);
    sc.counts = {}; sc.status = '';
    fakes.forEach(f=>BODIES.splice(BODIES.indexOf(f), 1));
    vrDrawOrder(sc);
    return 'wood refused at 150, a lantern still welcome';
  });
  P('paint and hardware deliver as bodies', ()=>{
    const sc = VR.orders.arc;
    sc.counts = {hinge:1, track:1, p4:2};   // p4 — PAINT_COLORS[4], the red
    vrOrderPress(sc);
    if(ORDERS.arc.pending.length !== 1) throw new Error('the arc refused the slip: '+sc.status);
    for(let i=0;i<620;i++) updateSheds(0.05);
    const fresh = BODIES.slice(-4);
    const kinds = fresh.map(b=>b.kind).sort().join(',');
    if(kinds !== 'hinge,paint,paint,track') throw new Error('delivered: '+kinds);
    const cans = fresh.filter(b=>b.kind === 'paint');
    if(cans.some(b=>b.color !== PAINT_COLORS[4].c)) throw new Error('the cans lost their color');
    if(cans[0].mesh.children[1].material !== cans[1].mesh.children[1].material)
      throw new Error('two cans of one color carry two materials');
    if(fresh.some(b=>b.venue !== 'arc')) throw new Error('arc stock tagged for the wrong venue');
    /* tidy: everything off, pallets clear */
    fresh.forEach(b=>{ grabBody(b); b.state = 'loose'; });
    for(let i=0;i<130;i++) updateSheds(0.05);
    return 'a hinge, a track section and two red cans, 420m out';
  });

  console.log('--- the forklift ---');
  P('each shed parks a forklift, and the floors are painted for pallets', ()=>{
    if(typeof LIFTS === 'undefined' || !LIFTS.palace || !LIFTS.arc) throw new Error('lifts missing');
    if(!LIFTS.palace.lift || !CARTS.palaceLift) throw new Error('the lift is not on the cart books');
    const pal = PALLET_SLOTS.filter(s=>s.venue==='palace');
    const arc = PALLET_SLOTS.filter(s=>s.venue==='arc');
    if(pal.length !== 6) throw new Error(pal.length+' palace slots, wanted 4 shed + 2 wing');
    if(arc.length !== 8) throw new Error(arc.length+' arc slots, wanted 4 shed + 2 per house');
    /* the wing slots are ON the stages */
    if(!pal.some(s=>Math.abs(s.x - 16.5) < 0.1 && s.z > -17)) throw new Error('no palace SL wing slot');
    if(!arc.some(s=>s.x > 400)) throw new Error('the arc slots missed their venue');
    return '6 palace + 8 arc, lifts parked';
  });
  P('the lift minds the walls the cart minds', ()=>{
    const L = LIFTS.palace;
    if(!cartBlocked(L, L.x, SHEDS.palace.z0 - 1)) throw new Error('drove through the shed rear wall');
    const x0 = L.x;
    cartMoveTo(L, L.x + 0.5, L.z);
    if(Math.abs(L.x - (x0 + 0.5)) > 0.01) throw new Error('a legal move refused');
    cartMoveTo(L, x0, L.z);
    return 'blocked and free, same book as the cart';
  });
  P('forks under the boards take the pallet, and a wing slot takes it back', ()=>{
    const L = LIFTS.palace;
    if(orderPlace('palace', ['par']) !== 'OK') throw new Error('the slip was refused');
    for(let i=0;i<620;i++) updateSheds(0.05);
    const o = ORDERS.palace;
    if(!o.pallets.length) throw new Error('no pallet came');
    /* the sheet test's loaded pallet still stands — ours is the newest */
    const pal = o.pallets[o.pallets.length - 1];
    scene.updateMatrixWorld(true);
    const pw = pal.group.getWorldPosition(new THREE.Vector3());
    /* walk the lift up to it, forks toward the boards */
    L.x = pw.x; L.z = pw.z - 0.85; L.yaw = 0; L.forkY = 0; L.prevForkY = 0; cartPose(L);
    for(let i=0;i<30;i++){ L.forkY = Math.min(0.4, L.forkY + 0.02); updateLifts(0.05); }
    if(L.riding !== pal) throw new Error('the forks came up empty');
    if(pal.spot !== -1) throw new Error('the apron spot never freed');
    /* it rides: move the lift, the pallet and its load move with it */
    const body = BODIES[BODIES.length-1];
    const b0 = body.mesh.getWorldPosition(new THREE.Vector3());
    L.x += 2.5; cartPose(L); scene.updateMatrixWorld(true);
    const b1 = body.mesh.getWorldPosition(new THREE.Vector3());
    if(Math.abs(b1.x - b0.x - 2.5) > 0.1) throw new Error('the load stayed behind: '+(b1.x-b0.x).toFixed(2));
    /* carry it to the SL wing and set it down on the paint */
    L.x = 16.4; L.z = -15.5 - 0.85; cartPose(L);
    for(let i=0;i<40;i++){ L.forkY = Math.max(0, L.forkY - 0.02); updateLifts(0.05); }
    if(L.riding) throw new Error('the forks never let go');
    scene.updateMatrixWorld(true);
    const dw = pal.group.getWorldPosition(new THREE.Vector3());
    if(Math.abs(dw.x - 16.5) > 0.1 || Math.abs(dw.z - (-15.5)) > 0.1)
      throw new Error('missed the slot: '+dw.x.toFixed(2)+','+dw.z.toFixed(2));
    if(pal.group.parent !== world) throw new Error('the pallet came down in the wrong tree');
    if(body.state !== 'slotted') throw new Error('the load fell off: '+body.state);
    /* the pallet still clears itself once emptied, wherever it stands */
    grabBody(body); body.state = 'loose';
    for(let i=0;i<130;i++) updateSheds(0.05);
    if(o.pallets.indexOf(pal) >= 0) throw new Error('the emptied pallet stayed');
    return 'lifted at the apron, set down on the SL wing paint';
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
