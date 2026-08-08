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

  console.log('--- nails and assemblies ---');
  P('one nail pivots, a second makes it rigid (RULING G)', ()=>{
    const a = regWood('s2x4'), b = regWood('s2x4');
    a.mesh.position.set(30, 1.22, 30);
    b.mesh.position.set(30.1, 1.22, 30);
    scene.updateMatrixWorld(true);
    const before = ASSEMBLIES.length;
    const n1 = addNail(a, {body:b}, new THREE.Vector3(30.05, 1.22, 30), new THREE.Vector3(0,0,1));
    if(!n1 || ASSEMBLIES.length !== before + 1) throw new Error('no assembly formed');
    if(a.asm !== b.asm || a.state !== 'fixed' || b.state !== 'fixed') throw new Error('membership wrong');
    if(!a.pivot || !b.pivot) throw new Error('one nail each, but no pivots');
    /* swing b half a turn about the nail: its far end must move, a must not */
    scene.updateMatrixWorld(true);
    const aBefore = a.mesh.getWorldPosition(new THREE.Vector3());
    const bBefore = b.mesh.getWorldPosition(new THREE.Vector3());
    b.pivot.quaternion.setFromAxisAngle(b.pivot.userData.axis, 0.6);
    scene.updateMatrixWorld(true);
    const bAfter = b.mesh.getWorldPosition(new THREE.Vector3());
    if(bAfter.distanceTo(bBefore) < 0.005) throw new Error('the pivot never moved it');
    if(a.mesh.getWorldPosition(new THREE.Vector3()).distanceTo(aBefore) > 1e-6)
      throw new Error('swinging b moved a');
    b.pivot.quaternion.identity();
    const n2 = addNail(a, {body:b}, new THREE.Vector3(30.05, 2.0, 30), new THREE.Vector3(1,0,0));
    if(!n2) throw new Error('the second nail refused');
    if(a.pivot || b.pivot) throw new Error('two nails and still swinging');
    window.__n1 = n1; window.__n2 = n2; window.__wA = a; window.__wB = b;
    return 'one nail swings, two hold';
  });
  P('the hammer takes it back apart', ()=>{
    const a = window.__wA, b = window.__wB;
    removeNail(window.__n2);
    if(!a.pivot || !b.pivot) throw new Error('down to one nail, no pivots back');
    const asmCount = ASSEMBLIES.length;
    removeNail(window.__n1);
    if(ASSEMBLIES.length !== asmCount - 1) throw new Error('the assembly never dissolved');
    if(a.state !== 'loose' || b.state !== 'loose') throw new Error('pieces not loose: '+a.state+'/'+b.state);
    if(a.asm || b.asm) throw new Error('membership never cleared');
    return 'two pulls, two loose studs';
  });
  P('a deck nail anchors it, and an anchored piece still pivots free of it', ()=>{
    const a = window.__wA;
    a.mesh.position.set(31, 0.045, 31); a.mesh.rotation.set(Math.PI/2, 0, 0);
    scene.updateMatrixWorld(true);
    const n = addNail(a, {deck:true}, new THREE.Vector3(31, 0, 31), new THREE.Vector3(0,-1,0));
    if(!n) throw new Error('the deck refused the nail');
    if(!a.asm || !a.asm.anchor || a.asm.anchor.type !== 'deck') throw new Error('no anchor');
    removeNail(n);
    if(a.asm || a.state !== 'loose') throw new Error('the anchor never cleared');
    return 'pinned to the deck and freed again';
  });
  P('nailed to a pipe it flies — and stops at the deck (the #15 rule)', ()=>{
    /* the BAREST pipe, so the built work is what binds the clamp — on a
       dressed pipe the goods clamp masks it and the test proves nothing */
    const ls = FLY.reduce((p, q)=> ((p.h || 0) <= (q.h || 0) ? p : q));
    const m0 = minTrimOf(ls);
    const a = window.__wA;
    scene.updateMatrixWorld(true);
    const py = ls.group.getWorldPosition(new THREE.Vector3());
    a.mesh.rotation.set(0, 0, 0);
    a.mesh.position.set(py.x, py.y - 1.25, py.z);
    scene.updateMatrixWorld(true);
    const n = addNail(a, {ls}, new THREE.Vector3(py.x, py.y - 0.05, py.z), new THREE.Vector3(0,1,0));
    if(!n) throw new Error('the pipe refused the nail');
    if(a.asm.root.parent !== ls.group) throw new Error('not hanging off the pipe group');
    if(!(ls.asmH > 2)) throw new Error('hang depth never measured: '+ls.asmH);
    const m1 = minTrimOf(ls);
    if(!(m1 >= ls.asmH)) throw new Error('the clamp ignores the work: '+m1.toFixed(2)+' vs hang '+ls.asmH.toFixed(2));
    if(!(m1 > m0 + 1)) throw new Error('the clamp never moved: '+m0.toFixed(2)+' -> '+m1.toFixed(2));
    flyTo(ls, 0);
    if(!(ls.target >= ls.asmH)) throw new Error('the pipe may bury the work: target '+ls.target.toFixed(2));
    removeNail(n);
    if(ls.asmH > 0.001) throw new Error('the hang depth never cleared');
    if(minTrimOf(ls) > m0 + 0.001) throw new Error('the clamp never came back');
    a.mesh.position.set(30, 1.22, 30);
    return 'clamp '+m0.toFixed(2)+' -> '+m1.toFixed(2)+'m with the work hung';
  });
  P('a held sheet squares itself up to a stud', ()=>{
    const stud = window.__wB;
    stud.mesh.position.set(40, 1.22, 40); stud.mesh.rotation.set(0, 0, 0);
    const sheet = regWood('sheet');
    sheet.mesh.position.set(40.08, 1.3, 40);
    sheet.mesh.rotation.set(0.06, 0.35, 0.08);   // offered at a sloppy angle
    scene.updateMatrixWorld(true);
    const s = snapWood(sheet);
    if(!s) throw new Error('no offer made');
    if(!s.target || s.target.body !== stud) throw new Error('snapped to the wrong thing');
    /* the pose is QUANTIZED: yaw to 45s, pitch and roll to 90s */
    const e = new THREE.Euler().setFromQuaternion(s.quat, 'YXZ');
    const q45 = v => Math.abs(v - Math.round(v/(Math.PI/4))*(Math.PI/4)) < 1e-4;
    const q90 = v => Math.abs(v - Math.round(v/(Math.PI/2))*(Math.PI/2)) < 1e-4;
    if(!q45(e.y) || !q90(e.x) || !q90(e.z)) throw new Error('not squared: '+[e.x,e.y,e.z].map(v=>v.toFixed(3)));
    if(!s.point || !s.axis) throw new Error('no nail offer with the pose');
    BODIES.splice(BODIES.indexOf(sheet), 1);
    return 'squared and flush, nail offered';
  });
  P('the tape reads feet and inches', ()=>{
    if(ftIn(2.4384) !== "8'0\\"") throw new Error('8ft reads '+ftIn(2.4384));
    if(ftIn(0.3048 + 3*0.0254) !== "1'3\\"") throw new Error("1'3 reads "+ftIn(0.3048+3*0.0254));
    return ftIn(2.4384);
  });

  console.log('--- the saws ---');
  P('each shed has a track table and a chop bench, and they know their stock', ()=>{
    if(typeof SAWS === 'undefined' || !SAWS.palace || !SAWS.arc) throw new Error('stations missing');
    if(!SAWS.palace.track || !SAWS.palace.chop || !SAWS.arc.track || !SAWS.arc.chop)
      throw new Error('a shed is missing a station');
    const sheet = regWood('sheet'), stud = regWood('s2x4');
    if(seatWood(SAWS.palace.chop, sheet)) throw new Error('the chop bench took a sheet');
    if(seatWood(SAWS.palace.track, stud)) throw new Error('the track table took a stud');
    if(!seatWood(SAWS.palace.track, sheet)) throw new Error('the table refused its sheet');
    if(!seatWood(SAWS.palace.chop, stud)) throw new Error('the bench refused its stud');
    if(sheet.state !== 'seated' || stud.state !== 'seated') throw new Error('never seated');
    /* seated pieces do not settle: they live on the table, not the floor */
    for(let i=0;i<40;i++) updateBodies(0.05);
    scene.updateMatrixWorld(true);
    const y = sheet.mesh.getWorldPosition(new THREE.Vector3()).y;
    if(y < 0.7) throw new Error('the sheet sank to y='+y.toFixed(2));
    window.__sheet = sheet; window.__stud = stud;
    return 'both stations, right stock, nothing sinks';
  });
  P('the cutter snaps to the inch — and a pencil tick wins', ()=>{
    const st = SAWS.palace.track, sheet = window.__sheet;
    const lo = sheet.mesh.position.x - seatLen(sheet)/2;
    sawSetCut(st, lo + 0.617);                   // 24.3 inches from the edge
    const at = st.cut - lo;
    if(Math.abs(at - 24*0.0254) > 1e-6) throw new Error('snapped to '+(at/0.0254).toFixed(2)+'in');
    /* a tape tick at 13in beats the inch grid */
    scene.updateMatrixWorld(true);
    const wp = new THREE.Vector3(lo + 13*0.0254, 0, 0);
    st.group.localToWorld(wp);
    sheet.tick = {p: sheet.mesh.worldToLocal(wp.clone())};
    sawSetCut(st, lo + 13.4*0.0254);
    if(Math.abs((st.cut - lo) - 13*0.0254) > 1e-3)
      throw new Error('the tick lost: cut at '+((st.cut-lo)/0.0254).toFixed(2)+'in');
    return 'the grid is inches, the pencil wins';
  });
  P('a cut makes two pieces on one geometry, and the paint rides it', ()=>{
    const st = SAWS.palace.track, sheet = window.__sheet;
    const red = woodMat(PAINT_COLORS[4].c);
    sheet.mesh.material[2] = red;                // paint one face first
    const lo = sheet.mesh.position.x - seatLen(sheet)/2;
    sawSetCut(st, lo + 24*0.0254);
    const before = BODIES.length;
    const r = sawCut(st);
    if(!r || !r.off) throw new Error('no second piece came');
    if(BODIES.length !== before + 1) throw new Error('registry off by '+(BODIES.length-before));
    if(Math.abs(seatLen(r.kept) - 24*0.0254) > 1e-3) throw new Error('kept side is '+seatLen(r.kept));
    if(Math.abs(seatLen(r.off) + seatLen(r.kept) - 2.4384) > 0.01) throw new Error('the sides do not sum');
    if(r.off.mesh.geometry !== r.kept.mesh.geometry) throw new Error('the cut minted geometry');
    if(r.off.mesh.material[2] !== red || r.kept.mesh.material[2] !== red)
      throw new Error('the paint fell off the cut');
    if(st.pieces.length !== 2) throw new Error(st.pieces.length+' pieces on the table');
    return '24in and 72in, both painted, one geometry';
  });
  P('scrap under six inches vanishes', ()=>{
    const st = SAWS.palace.chop, stud = window.__stud;
    const lo = stud.mesh.position.x - seatLen(stud)/2;
    sawSetCut(st, lo + 4*0.0254);                // four inches: scrap
    const before = BODIES.length;
    const r = sawCut(st);
    if(!r || r.off) throw new Error('the scrap end survived');
    if(BODIES.length !== before) throw new Error('the registry grew for scrap');
    if(Math.abs(stud.dims.L - (2.4384 - 4*0.0254)) > 1e-3) throw new Error('trimmed to '+stud.dims.L);
    /* a grab takes it off the bench and the station forgets it */
    grabBody(stud);
    if(stud.station || st.pieces.indexOf(stud) >= 0) throw new Error('the bench never let go');
    stud.state = 'loose';
    return 'four inches to the bucket, the rest to hand';
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
