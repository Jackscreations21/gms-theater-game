// build.js — the build system (spec 2026-08-07-build-system-design.md).
// PR 1: the stock and the screen — wood as parametric bodies, the tabbed
// supply screen, manifest pallets, the piece cap.
const {JSDOM} = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname,'..','the-house.html'),'utf8');
/* a real URL: an opaque about:blank origin has no localStorage, and the
   save system (PR 7) needs one in both boots */
const dom = new JSDOM(html.replace(/<script src=.*?<\/script>/,''),
  {runScripts:'outside-only', pretendToBeVisual:true, url:'https://the.house/'});
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
    /* ONE material while the six faces agree: an array is a draw call PER
       GROUP in r128, so six identical entries draw one plank six times. */
    if(Array.isArray(s.mesh.material))
      throw new Error('a bare sheet carries '+s.mesh.material.length+' material slots, not one');
    if(Array.isArray(a.mesh.material))
      throw new Error('a bare stud carries '+a.mesh.material.length+' material slots, not one');
    if(s.mesh.material !== regWood('sheet').mesh.material)
      throw new Error('two bare sheets carry two materials');
    return 'one geometry, one shared material until a face disagrees';
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
  P('two 8ft sticks see each other end-to-end', ()=>{
    const t = regWood('s2x4'), h = regWood('s2x4');
    t.mesh.position.set(44, 1.22, 40); t.mesh.rotation.set(0, 0, 0);   // ends y 0 / 2.44
    h.mesh.position.set(44, 3.70, 40); h.mesh.rotation.set(0, 0, 0);   // its foot 4cm above t's top
    scene.updateMatrixWorld(true);
    const s = snapWood(h);
    if(!s || !s.target || s.target.body !== t)
      throw new Error('no end-to-end offer: '+JSON.stringify(s && s.target || null));
    if(Math.abs(s.pos.y - 3.66) > 0.01) throw new Error('not flush: pos.y='+s.pos.y.toFixed(3));
    if(Math.abs(s.point.y - 2.44) > 0.01) throw new Error('the nail is off the seam: '+s.point.y.toFixed(3));
    BODIES.splice(BODIES.indexOf(t), 1); BODIES.splice(BODIES.indexOf(h), 1);
    return 'butted end to end, nail on the seam';
  });
  P('a stud kisses a stud truly flush (the unit/metric fix)', ()=>{
    const t = regWood('s2x4'), h = regWood('s2x4');
    t.mesh.position.set(46, 1.22, 40); t.mesh.rotation.set(0, 0, 0);
    h.mesh.position.set(46.06, 1.22, 40); h.mesh.rotation.set(0, 0, 0); // 6cm off in x
    scene.updateMatrixWorld(true);
    const s = snapWood(h);
    if(!s || !s.target || s.target.body !== t) throw new Error('no side-by-side offer');
    if(Math.abs(s.pos.x - 46.038) > 0.005) throw new Error('not flush: pos.x='+s.pos.x.toFixed(4));
    if(Math.abs(s.point.x - 46.019) > 0.005) throw new Error('nail off the face: '+s.point.x.toFixed(4));
    BODIES.splice(BODIES.indexOf(t), 1); BODIES.splice(BODIES.indexOf(h), 1);
    return 'flush on the face, nail on the face';
  });
  P('past the edge is no joint at all', ()=>{
    const t = regWood('sheet'), h = regWood('s2x4', {L:0.5});
    t.mesh.position.set(50, 1.5, 40); t.mesh.rotation.set(0, 0, 0);    // spans x 48.78..51.22
    h.mesh.position.set(51.35, 2.5, 40); h.mesh.rotation.set(0, 0, 0); // past the edge AND above
    scene.updateMatrixWorld(true);
    const s = snapWood(h);
    if(s && s.target && s.target.body === t)
      throw new Error('offered a joint hanging off the edge');
    BODIES.splice(BODIES.indexOf(t), 1); BODIES.splice(BODIES.indexOf(h), 1);
    return 'no face overlap, no offer';
  });
  P('a work table is on the HDWE tab and delivers on the pallet', ()=>{
    const sc = VR.orders.palace;
    sc.tab = 2; sc.counts = {table:1};
    vrOrderPress(sc);
    if(ORDERS.palace.pending.length < 1) throw new Error('the slip was refused: '+sc.status);
    for(let i=0;i<620;i++) updateSheds(0.05);
    const t = BODIES[BODIES.length-1];
    if(t.kind !== 'table') throw new Error('delivered: '+t.kind);
    if(t.venue !== 'palace') throw new Error('wrong venue: '+t.venue);
    if(BODY_LABEL.table !== 'WORK TABLE') throw new Error('no label for the table');
    /* keep it: carried clear of the shed, stood on open floor */
    grabBody(t);
    t.mesh.position.set(5, 0, -6);
    t.mesh.rotation.set(0, 0, 0);
    t.state = 'loose'; t.restH = 0;
    window.__table = t;
    for(let i=0;i<130;i++) updateSheds(0.05);   // the emptied pallet clears
    scene.updateMatrixWorld(true);
    return 'WORK TABLE ordered, delivered, stood up';
  });
  P('wood released above the table rests on the top', ()=>{
    const w = regWood('s2x4');
    w.mesh.rotation.set(0, 0, Math.PI/2);        // lying flat
    w.mesh.position.set(5, 1.6, -6);            // above the table
    w.state = 'loose';
    w.restH = woodRestH(w);
    scene.updateMatrixWorld(true);
    for(let i=0;i<200;i++) updateBodies(0.05);
    scene.updateMatrixWorld(true);
    const y = w.mesh.getWorldPosition(new THREE.Vector3()).y;
    BODIES.splice(BODIES.indexOf(w), 1);
    if(Math.abs(y - 0.945) > 0.02) throw new Error('rests at '+y.toFixed(3));
    return 'stock settles onto the top, not through it';
  });
  P('held wood over the table is offered the top, flat', ()=>{
    const w = regWood('s2x4');
    w.mesh.rotation.set(0, 0, Math.PI/2);
    w.mesh.position.set(5, 1.15, -6);           // just above the top
    w.state = 'held';
    scene.updateMatrixWorld(true);
    const s = snapWood(w);
    BODIES.splice(BODIES.indexOf(w), 1);
    if(!s || !s.target || !s.target.table)
      throw new Error('no tabletop offer: '+JSON.stringify(s && s.target || null));
    if(Math.abs(s.pos.y - 0.944) > 0.02) throw new Error('lies at '+s.pos.y.toFixed(3));
    if(s.point.y > 1.0 && s.axis.y > -0.9) throw new Error('a nail was offered on the table');
    return 'lies flat ON the top, no nail in the offer';
  });
  P('the table itself rides the save', ()=>{
    const d = JSON.parse(buildSerialize());
    if(!d.bodies.some(b=>b.k === 'table')) throw new Error('the table missed the save');
    return 'saved standing where it stood';
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
    /* through the accessors: a bare sheet holds ONE material, so poking
       material[2] would write a stray property onto the shared cache entry
       and the assertion below would read it straight back and pass. */
    const pf = woodFaces(sheet.mesh); pf[2] = red;
    woodSetFaces(sheet.mesh, pf);                // paint one face first
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

  console.log('--- paint ---');
  P('each shed racks four stock colors, and a delivered can adds a fifth', ()=>{
    if(typeof RACKS === 'undefined' || !RACKS.palace || !RACKS.arc) throw new Error('racks missing');
    const rack = RACKS.palace;
    if(rack.colors.length !== 4) throw new Error(rack.colors.length+' stock colors');
    if(rack.canMeshes.length !== 4) throw new Error(rack.canMeshes.length+' cans on the shelf');
    /* a red can, as delivery would make it, released over the rack */
    const keep = BUILD_VENUE; BUILD_VENUE = 'palace';
    const can = regBody('paint', makeBodyMesh('paint', PAINT_COLORS[4].c), null);
    BUILD_VENUE = keep;
    can.color = PAINT_COLORS[4].c; can.state = 'loose';
    const before = BODIES.length;
    if(!rackTakeCan(rack, can)) throw new Error('the rack refused the can');
    if(rack.colors.length !== 5 || rack.canMeshes.length !== 5) throw new Error('the color never landed');
    if(BODIES.length !== before - 1) throw new Error('the can survived being poured');
    if(rackTakeCan(rack, {kind:'wood'})) throw new Error('the rack drank a plank');
    return 'four stock, red poured in as the fifth';
  });
  P('sheets take paint by the face, lumber whole — always from the cache', ()=>{
    const sheet = regWood('sheet'), stud = regWood('s2x4');
    sheet.mesh.position.set(44, 1.2, 44);
    /* regWood does not parent the mesh — refresh its own matrix, not the scene's */
    sheet.mesh.updateMatrixWorld(true);
    const red = PAINT_COLORS[4].c;
    /* a touch on the +z face (the sheet's front): local z > others */
    const wp = sheet.mesh.localToWorld(new THREE.Vector3(0.1, 0.1, 0.49));
    if(!paintWood(sheet, wp, red)) throw new Error('the sheet refused paint');
    /* one face differing PROMOTES the sheet to the six-slot form */
    if(!Array.isArray(sheet.mesh.material))
      throw new Error('a part-painted sheet stayed on one material');
    if(sheet.mesh.material[4] !== woodMat(red)) throw new Error('the +z face is not red');
    if(sheet.mesh.material[5] === woodMat(red)) throw new Error('the back took the front coat');
    if(!paintWood(stud, stud.mesh.getWorldPosition(new THREE.Vector3()), red))
      throw new Error('the stud refused paint');
    /* lumber coats WHOLE, so it never leaves the one-material form */
    if(Array.isArray(stud.mesh.material))
      throw new Error('a wholly-coated stud sits on six slots');
    if(stud.mesh.material !== woodMat(red)) throw new Error('the stud is patchy');
    /* one cache entry, however many things wear it */
    if(sheet.mesh.material[4] !== stud.mesh.material) throw new Error('two reds in the till');
    BODIES.splice(BODIES.indexOf(sheet), 1);
    BODIES.splice(BODIES.indexOf(stud), 1);
    return 'face for sheets, whole for sticks, one red';
  });
  P('a sheet painted right round collapses back to one material', ()=>{
    const s = regWood('sheet');
    s.mesh.position.set(46, 1.2, 46); s.mesh.updateMatrixWorld(true);
    const blue = PAINT_COLORS[5].c;
    const F = [[0.49,0,0],[-0.49,0,0],[0,0.49,0],[0,-0.49,0],[0,0,0.49],[0,0,-0.49]];
    F.forEach((f, i)=>{
      paintWood(s, s.mesh.localToWorld(new THREE.Vector3(f[0], f[1], f[2])), blue);
      if(i < 5 && !Array.isArray(s.mesh.material))
        throw new Error('the sheet collapsed early, after '+(i+1)+' faces');
    });
    if(Array.isArray(s.mesh.material))
      throw new Error('six faces of one colour stayed on six slots');
    if(s.mesh.material !== woodMat(blue)) throw new Error('the collapse lost the colour');
    BODIES.splice(BODIES.indexOf(s), 1);
    return 'promoted on face one, collapsed on face six, one blue';
  });

  console.log('--- hinges and track ---');
  P('a hinge joins a loose door to a frame, swings with stops, and comes off whole', ()=>{
    /* the frame: two studs nailed rigid; the door: a loose sheet leaning at it */
    const f1 = regWood('s2x4'), f2 = regWood('s2x4');
    f1.mesh.position.set(50, 1.22, 50); f2.mesh.position.set(50.1, 1.22, 50);
    scene.updateMatrixWorld(true);
    addNail(f1, {body:f2}, new THREE.Vector3(50.05, 1.0, 50), new THREE.Vector3(0,0,1));
    addNail(f1, {body:f2}, new THREE.Vector3(50.05, 1.5, 50), new THREE.Vector3(0,0,1));
    const door = regWood('sheet');
    door.mesh.position.set(50.8, 1.22, 50); door.mesh.rotation.set(Math.PI/2, 0, 0);
    door.mesh.updateMatrixWorld(true);
    const keep = BUILD_VENUE; BUILD_VENUE = 'palace';
    const hb = regBody('hinge', makeBodyMesh('hinge'), null);
    BUILD_VENUE = keep;
    hb.state = 'loose';
    hb.mesh.position.set(50.2, 1.22, 50);
    hb.mesh.updateMatrixWorld(true);
    const before = BODIES.length;
    const n = addHinge(hb, new THREE.Vector3(50.2, 1.22, 50), new THREE.Vector3(0,1,0));
    if(!n || !n.hinge) throw new Error('the hinge never installed');
    if(BODIES.length !== before - 1) throw new Error('the hinge body survived installation');
    if(door.asm !== f1.asm) throw new Error('the door joined nothing');
    if(!door.pivot) throw new Error('a hinged door with no pivot');
    if(n.range !== Math.PI/2) throw new Error('no stops on the swing');
    /* swing it, then pull the hinge: the body comes back, the door drops loose */
    door.pivot.quaternion.setFromAxisAngle(door.pivot.userData.axis, 0.8);
    scene.updateMatrixWorld(true);
    const after = BODIES.length;
    removeNail(n);
    if(BODIES.length !== after + 1) throw new Error('the pulled hinge never respawned');
    if(BODIES[BODIES.length-1].kind !== 'hinge') throw new Error('something else respawned');
    if(door.state !== 'loose') throw new Error('the door is still: '+door.state);
    window.__frame = f1;
    return 'hinged, swung, pulled — hardware again';
  });
  P('track chains into one run, a carriage rides it, wood slides with the carriage', ()=>{
    const keep = BUILD_VENUE; BUILD_VENUE = 'palace';
    const t1 = regBody('track', makeBodyMesh('track'), null); t1.state = 'loose';
    const t2 = regBody('track', makeBodyMesh('track'), null); t2.state = 'loose';
    const t3 = regBody('track', makeBodyMesh('track'), null); t3.state = 'loose';
    const car = regBody('carriage', makeBodyMesh('carriage'), null); car.state = 'loose';
    BUILD_VENUE = keep;
    t1.mesh.position.set(55, 0.05, 55);
    t1.mesh.updateMatrixWorld(true);
    const a = layTrack(t1, null);
    if(!a || !a.track || a.track.n !== 1) throw new Error('the first section never laid');
    if(!a.anchor || a.anchor.type !== 'deck') throw new Error('a run that is not nailed down');
    layTrack(t2, a); layTrack(t3, a);
    if(a.track.n !== 3 || a.pieces.length !== 3) throw new Error('the run is '+a.track.n+' long');
    if(a.pieces.some(p=>p.pivot)) throw new Error('a deck-nailed section is swinging');
    /* the carriage, dropped at the middle of the run */
    scene.updateMatrixWorld(true);
    car.mesh.position.copy(a.root.localToWorld(new THREE.Vector3(1.2, 0.1, 0)));
    car.mesh.updateMatrixWorld(true);
    if(!rideTrack(car, a)) throw new Error('the run refused the carriage');
    if(car.state !== 'riding' || !car.slider) throw new Error('not riding');
    /* a panel nailed to the carriage slides with it, and stops at the ends */
    const panel = regWood('sheet');
    panel.mesh.position.copy(car.mesh.getWorldPosition(new THREE.Vector3()));
    scene.updateMatrixWorld(true);
    if(!nailToCarriage(panel, car)) throw new Error('the carriage refused the panel');
    if(panel.pivot) throw new Error('a carriage nail must not swing');
    const p0 = panel.mesh.getWorldPosition(new THREE.Vector3());
    slideTo(a, car.slider, 99);
    scene.updateMatrixWorld(true);
    const p1 = panel.mesh.getWorldPosition(new THREE.Vector3());
    if(p0.distanceTo(p1) < 0.5) throw new Error('the panel never slid');
    if(Math.abs(car.slider.position.x - 2*1.2192) > 1e-6)
      throw new Error('no hard stop: x='+car.slider.position.x.toFixed(3));
    /* loaded carriage refuses to pop; unloaded pops clean */
    if(unrideTrack(car)) throw new Error('popped off under load');
    const pn = a.nails.find(x=>x.carriage);
    removeNail(pn);
    if(panel.state !== 'loose') throw new Error('the panel never came off');
    if(!unrideTrack(car)) throw new Error('the empty carriage stuck');
    if(car.state !== 'loose') throw new Error('carriage state: '+car.state);
    return 'three sections, one run, slid and stopped at 8ft';
  });

  console.log('--- painting the goods ---');
  P('a painted curtain does not repaint every drape in the building', ()=>{
    /* goods round RULING T: M.serge is ONE material shared by every border,
       leg and half leg on all three stages (and the Arc's dressing).  Paint
       must clone through a cache, never mutate the shared object. */
    if(typeof paintGoods !== 'function') throw new Error('paintGoods is not defined');
    const a = FLY.find(l=>l.goodsKey === 'border');
    const b = FLY.filter(l=>l.goodsKey === 'border')[1];
    if(!a || !b) throw new Error('the default hang has fewer than two borders');
    const sergeWas = M.serge.color.getHex();
    const bWas = (()=>{ let c = null; b.goods.traverse(o=>{ if(!c && o.isMesh) c = o.material; }); return c; })();
    const color = PAINT_COLORS[4].c;                    // RED
    if(!paintGoods(a, color)) throw new Error('nothing on the pipe took the coat');
    let painted = 0, wrong = 0;
    a.goods.traverse(o=>{
      if(!o.isMesh || !o.material || !o.material.isMeshStandardMaterial) return;
      if(o.material.color.getHex() === color) painted++; else wrong++;
    });
    if(!painted) throw new Error('the cloth is unchanged');
    if(wrong) throw new Error(wrong + ' cloths on the pipe missed the coat');
    if(M.serge.color.getHex() !== sergeWas)
      throw new Error('the SHARED serge material was mutated — every drape in the game just turned');
    let bNow = null; b.goods.traverse(o=>{ if(!bNow && o.isMesh) bNow = o.material; });
    if(bNow !== bWas) throw new Error('the other border changed material too');
    /* the cache: the same colour on another pipe is the SAME material */
    if(!paintGoods(b, color)) throw new Error('the second pipe refused');
    let aM = null, bM = null;
    a.goods.traverse(o=>{ if(!aM && o.isMesh && o.material.isMeshStandardMaterial) aM = o.material; });
    b.goods.traverse(o=>{ if(!bM && o.isMesh && o.material.isMeshStandardMaterial) bM = o.material; });
    if(aM !== bM) throw new Error('two pipes painted the same colour minted two materials');
    /* repaint is a pointer swap back to the cache, never clone-of-clone */
    paintGoods(a, PAINT_COLORS[5].c);
    paintGoods(a, color);
    let aBack = null;
    a.goods.traverse(o=>{ if(!aBack && o.isMesh && o.material.isMeshStandardMaterial) aBack = o.material; });
    if(aBack !== aM) throw new Error('repainting the original colour minted a new material');
    return 'the pipe took it; the shared serge and the other border did not';
  });
  P('the chandelier keeps its bulbs lit through a coat of paint', ()=>{
    const ls = FLY[11];
    hangGoods(ls, 'chand');
    const bulbs = [];
    ls.goods.traverse(o=>{ if(o.isMesh && o.material && o.material.isMeshBasicMaterial) bulbs.push(o.material); });
    if(!bulbs.length) throw new Error('the chandelier has no self-lit bulbs to protect');
    paintGoods(ls, PAINT_COLORS[0].c);
    let changed = 0;
    ls.goods.traverse(o=>{ if(o.isMesh && bulbs.indexOf(o.material) < 0 && o.material.isMeshBasicMaterial) changed++; });
    if(changed) throw new Error('a self-lit bulb was painted over');
    hangGoods(ls, 'none');
    return 'lit equipment is not cloth';
  });

  console.log('--- the settle, at rest ---');
  P('a settled piece stops paying a raycast every frame', ()=>{
    /* Every loose body used to cast a recursive ray AND scan the whole
       registry each frame just to conclude it had not moved.  At BUILD_CAP
       that was 150 of each, every frame.  A piece that has come to rest is
       now re-tested on a rota instead. */
    if(typeof REST_ROTA !== 'number') throw new Error('no REST_ROTA');
    const made = [];
    for(let i=0;i<40;i++){
      const b = regWood('s2x4');
      b.venue = 'palace';
      b.mesh.position.set(-6 + (i%10)*0.5, 0.25, -26 + Math.floor(i/10)*0.5);
      b.state = 'loose';
      made.push(b);
    }
    for(let i=0;i<400;i++) updateBodies(0.016);      // let them come to rest
    if(made.some(b=>!b.rest)) throw new Error('pieces never reached rest');
    const real = groundAt;
    let calls = 0;
    groundAt = function(){ calls++; return real.apply(null, arguments); };
    for(let i=0;i<REST_ROTA;i++) updateBodies(0.016);
    groundAt = real;
    /* over one full rota each resting piece is tested about once, not once
       a frame: allow generous slack and still catch a regression to N*ROTA */
    const everyFrame = made.length * REST_ROTA;
    if(calls > everyFrame / 3)
      throw new Error(calls + ' groundAt calls over a rota; every-frame would be ' + everyFrame);
    made.forEach(b=>removeBody(b));
    return calls + ' calls over ' + REST_ROTA + ' frames, not ' + everyFrame;
  });
  P('a grab wakes the venue, so a piece that loses its floor still falls', ()=>{
    /* the rota is only a backstop; anything that can pull the ground out
       from under a resting piece wakes it at once */
    const keepV = BUILD_VENUE; BUILD_VENUE = 'palace';
    const t = regBody('table', makeBuildMesh('table'), null);
    t.state = 'loose'; t.venue = 'palace';
    t.mesh.position.set(3, 0, -24);
    const plank = regWood('s2x4');
    plank.venue = 'palace';
    plank.mesh.position.set(3, TABLE_TOP + 0.3, -24);
    plank.state = 'loose';
    BUILD_VENUE = keepV;
    scene.updateMatrixWorld(true);
    for(let i=0;i<400;i++) updateBodies(0.016);
    const onTable = plank.mesh.position.y;
    if(!plank.rest) throw new Error('the plank never settled on the table');
    if(onTable < TABLE_TOP) throw new Error('the plank did not settle ON the table, y=' + onTable);
    grabBody(t);                                     // carry the table away
    if(plank.rest) throw new Error('the grab did not wake the plank');
    t.mesh.position.set(30, 0, -24);
    scene.updateMatrixWorld(true);
    for(let i=0;i<10;i++) updateBodies(0.016);
    if(plank.mesh.position.y >= onTable)
      throw new Error('the plank hung in the air after its table left');
    removeBody(plank); removeBody(t);
    return 'settled at ' + onTable.toFixed(3) + ', fell when the table went';
  });

  console.log('--- the trash ---');
  P('DELETE ALL WOOD clears the venue and nothing else', ()=>{
    /* build-feel RULING P: every wood body goes, through the machinery
       that owns each filing — hinges respawn as hardware, bare track
       runs stand, gear is untouched */
    if(typeof removeBody !== 'function' || typeof deleteAllWood !== 'function')
      throw new Error('the trash machinery is not defined');
    if(typeof TRASH === 'undefined' || !TRASH.palace || !TRASH.arc)
      throw new Error('a shed has no drum');
    const loose = regWood('s2x4');  loose.mesh.position.set(4, 0.019, 2);
    const parked = regWood('s2x4'); parked.mesh.position.set(4, 2.0, 3); parked.frozen = true;
    const s1 = regWood('s2x4'), s2 = regWood('s2x4');
    s1.mesh.rotation.set(0, 0, 0); s2.mesh.rotation.set(0, 0, 0);
    s1.mesh.position.set(70, 1.22, 70); s2.mesh.position.set(70.038, 1.22, 70);
    scene.updateMatrixWorld(true);
    addNail(s1, {body:s2}, new THREE.Vector3(70.019, 1.9, 70), new THREE.Vector3(1,0,0));
    /* an installed hinge (consumed into the joint) must come back loose */
    const keepV = BUILD_VENUE; BUILD_VENUE = 'palace';
    const hb = regBody('hinge', makeBodyMesh('hinge'), null); hb.state = 'loose';
    const t1 = regBody('track', makeBodyMesh('track'), null); t1.state = 'loose';
    BUILD_VENUE = keepV;
    const door = regWood('s2x4');
    door.mesh.rotation.set(0, 0, 0);
    door.mesh.position.set(70.095, 1.22, 70);
    hb.mesh.position.set(70.066, 1.22, 70);
    scene.updateMatrixWorld(true);
    if(!addHinge(hb, new THREE.Vector3(70.066, 1.22, 70), new THREE.Vector3(0,1,0)))
      throw new Error('test rig: the hinge would not install');
    /* a bare track run (no wood) must survive the button */
    t1.mesh.position.set(72, 0.05, 72); t1.mesh.updateMatrixWorld(true);
    const run = layTrack(t1, null);
    const hinges0 = BODIES.filter(b=>b.kind === 'hinge' && b.venue === 'palace').length;
    const gear0 = BODIES.filter(b=>!BUILD_KINDS[b.kind] && b.venue === 'palace').length;
    const n = deleteAllWood('palace');
    if(n < 5) throw new Error('only ' + n + ' pieces deleted');
    if(BODIES.some(b=>b.kind === 'wood' && b.venue === 'palace'))
      throw new Error('wood survived the button');
    if(ASSEMBLIES.indexOf(run) < 0) throw new Error('the bare track run was torn down');
    if(BODIES.filter(b=>b.kind === 'hinge' && b.venue === 'palace').length !== hinges0 + 1)
      throw new Error('the installed hinge never respawned as hardware');
    if(BODIES.filter(b=>!BUILD_KINDS[b.kind] && b.venue === 'palace').length !== gear0)
      throw new Error('the button touched the gear');
    /* removeBody alone: one piece, gone from registry and scene */
    const w2 = regWood('s2x4');
    if(!removeBody(w2) || BODIES.indexOf(w2) >= 0 || w2.mesh.parent)
      throw new Error('removeBody left something behind');
    /* and the button on the glass drives the same machinery */
    vrBuildOrderScreens();
    const sc = VR.orders.palace;
    const extra = regWood('s2x4');
    extra.mesh.position.set(4, 0.019, 2);
    vrDrawOrder(sc);
    const btn = sc.hits.find(h=>h.w === 196 && h.h === 25 && h.y > 430);
    if(!btn) throw new Error('no DELETE ALL WOOD button on the glass');
    btn.fn();
    if(BODIES.indexOf(extra) >= 0) throw new Error('the glass button cleared nothing');
    if(sc.status.indexOf('GONE') < 0) throw new Error('the status reads: '+sc.status);
    return n + ' wood gone; run standing, hinge respawned, gear whole';
  });

  console.log('--- the save ---');
  P('a parked piece hangs where it was parked, and a grab frees it', ()=>{
    /* build-feel RULING N: b.frozen skips the settle */
    const b = regWood('s2x4');
    b.mesh.rotation.set(0.3, 0.7, 0.1);
    b.mesh.position.set(4, 2.0, 2.0);            // over the Palace deck
    b.frozen = true;
    b.restH = woodRestH(b);                      // even with a rest height set
    scene.updateMatrixWorld(true);
    for(let i = 0; i < 80; i++) updateBodies(0.05);
    if(Math.abs(b.mesh.position.y - 2.0) > 1e-4)
      throw new Error('it settled to '+b.mesh.position.y.toFixed(2));
    grabBody(b);
    if(b.frozen) throw new Error('the grab left it frozen');
    b.state = 'loose';
    BODIES.splice(BODIES.indexOf(b), 1);
    return 'hangs mid-air where parked, freed by the grab';
  });
  P('a built world serializes, and the slate wipes clean', ()=>{
    /* the scene the second boot must give back */
    const s1 = regWood('s2x4'), s2 = regWood('s2x4');
    s1.mesh.position.set(60, 1.22, 60); s2.mesh.position.set(60.1, 1.22, 60);
    scene.updateMatrixWorld(true);
    addNail(s1, {body:s2}, new THREE.Vector3(60.05, 1.22, 60), new THREE.Vector3(0,0,1));
    s2.pivot.quaternion.setFromAxisAngle(s2.pivot.userData.axis, 0.4);   // left swung
    const painted = regWood('sheet');
    painted.mesh.position.set(61, 1.0, 61);
    const sf = woodFaces(painted.mesh); sf[2] = woodMat(PAINT_COLORS[4].c);
    woodSetFaces(painted.mesh, sf);            // one odd face — rides the save as six hexes
    const keep = BUILD_VENUE; BUILD_VENUE = 'palace';
    const t1 = regBody('track', makeBodyMesh('track'), null); t1.state = 'loose';
    const t2 = regBody('track', makeBodyMesh('track'), null); t2.state = 'loose';
    const car = regBody('carriage', makeBodyMesh('carriage'), null); car.state = 'loose';
    BUILD_VENUE = keep;
    t1.mesh.position.set(63, 0.05, 63); t1.mesh.updateMatrixWorld(true);
    const run = layTrack(t1, null); layTrack(t2, run);
    car.mesh.position.copy(run.root.localToWorld(new THREE.Vector3(0.6, 0.1, 0)));
    car.mesh.updateMatrixWorld(true);
    rideTrack(car, run);
    const panel = regWood('sheet');
    panel.mesh.position.copy(car.mesh.getWorldPosition(new THREE.Vector3()));
    scene.updateMatrixWorld(true);
    nailToCarriage(panel, car);
    if(orderPlace('palace', ['par']) !== 'OK') throw new Error('the slip refused');
    rackAddColor(RACKS.palace, PAINT_COLORS[5].c);   // blue on the rack
    LIFTS.palace.forkY = 0.5;
    /* a parked piece, mid-air at an odd angle, must ride the save (N) */
    const parked = regWood('s2x4');
    parked.mesh.rotation.set(0.3, 0.7, 0.1);
    parked.mesh.position.set(5, 2.2, 3.0);
    parked.frozen = true;
    scene.updateMatrixWorld(true);
    buildSave();
    const raw = localStorage.getItem('house.build');
    if(!raw) throw new Error('nothing landed in storage');
    const j = JSON.parse(raw);
    if(j.v !== 1) throw new Error('version '+j.v);
    if(!j.asms.length || !j.bodies.length || !j.pending.length) throw new Error('a hollow save');
    window.__saveJson = raw;
    /* the escape hatch wipes storage, not the room */
    const nWood = BODIES.filter(b=>b.kind==='wood').length;
    buildClearSave();
    if(localStorage.getItem('house.build')) throw new Error('CLEAR SAVE left the key');
    if(BODIES.filter(b=>b.kind==='wood').length !== nWood) throw new Error('CLEAR SAVE touched the room');
    return j.bodies.length+' bodies, '+j.asms.length+' assemblies to storage';
  });

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;

/* ---- the second boot: the saved world must come back (spec §8) ---------- */
const probe2 = `
;(function(){
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  window.__errs = [];
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,210):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); if(e.stack) console.log('      '+e.stack.split('\\n').slice(1,4).join(' | ')); window.__errs.push(name+': '+e.message); } };

  console.log('--- the save, second boot ---');
  P('the built world came back through the reload', ()=>{
    const j = JSON.parse(localStorage.getItem('house.build'));
    const woodSaved = j.bodies.filter(d=>d.k==='wood').length
      + j.asms.reduce((s,a)=>s + a.pieces.filter(p=>p.k==='wood').length, 0);
    const woodHere = BODIES.filter(b=>b.kind==='wood').length;
    if(woodHere < woodSaved) throw new Error(woodHere+' wood bodies of '+woodSaved+' saved');
    /* the one-nail pair: an assembly of two with both pieces on pivots,
       and the swung stud still where the swing left it */
    const pair = ASSEMBLIES.find(a=>!a.track && a.pieces.length===2 && a.nails.length===1 && !a.nails[0].hinge);
    if(!pair) throw new Error('the nailed pair never returned');
    if(!pair.pieces[0].pivot || !pair.pieces[1].pivot) throw new Error('the pivots never rebuilt');
    scene.updateMatrixWorld(true);
    const near60 = pair.pieces.some(p=>{
      const w2 = p.mesh.getWorldPosition(new THREE.Vector3());
      return Math.abs(w2.x - 60) < 1 && Math.abs(w2.z - 60) < 1;
    });
    if(!near60) throw new Error('the pair reloaded somewhere else');
    /* the track run, its rider, and the panel that slides */
    const run = ASSEMBLIES.find(a=>a.track && a.track.n===2);
    if(!run) throw new Error('the run never returned');
    const car = BODIES.find(b=>b.kind==='carriage' && b.tAsm===run);
    if(!car || car.state !== 'riding') throw new Error('the carriage is not riding');
    const panel = run.pieces.find(p=>p.slider);
    if(!panel) throw new Error('the panel lost its carriage');
    const p0 = panel.mesh.getWorldPosition(new THREE.Vector3());
    slideTo(run, car.slider, 99);
    scene.updateMatrixWorld(true);
    if(p0.distanceTo(panel.mesh.getWorldPosition(new THREE.Vector3())) < 0.3)
      throw new Error('the reloaded panel will not slide');
    /* the slip, the color, the forks */
    if(!ORDERS.palace.pending.length) throw new Error('the pending order was lost');
    if(ORDERS.palace.pending[0].t > 30.01) throw new Error('the countdown reset');
    if(RACKS.palace.colors.indexOf(${'0x1f3f7a'}) < 0) throw new Error('the blue washed off the rack');
    if(Math.abs(LIFTS.palace.forkY - 0.5) > 0.01) throw new Error('the forks dropped: '+LIFTS.palace.forkY);
    /* the paint: a sheet with one red face, from the one red in the till */
    const red = BODIES.find(b=>b.kind==='wood' && b.prof==='sheet' && !b.asm &&
      Array.isArray(b.mesh.material) && b.mesh.material[2] === woodMat(0xa8231d));
    if(!red) throw new Error('the painted face came back bare');
    /* serBody always writes SIX hexes, so every save — including every save
       written before this change — takes the collapse path on load */
    const bare = BODIES.find(b=>b.kind==='wood' && !Array.isArray(b.mesh.material));
    if(!bare) throw new Error('every reloaded piece came back on six slots');
    return 'wood, joints, run, slip, color, forks — all back';
  });
  P('a parked piece came back parked, mid-air', ()=>{
    const b = BODIES.find(x=>x.kind === 'wood' && x.frozen);
    if(!b) throw new Error('no parked piece returned');
    scene.updateMatrixWorld(true);
    const y0 = b.mesh.getWorldPosition(new THREE.Vector3()).y;
    if(Math.abs(y0 - 2.2) > 0.01) throw new Error('parked at y='+y0.toFixed(2));
    for(let i = 0; i < 80; i++) updateBodies(0.05);
    if(Math.abs(b.mesh.getWorldPosition(new THREE.Vector3()).y - 2.2) > 1e-3)
      throw new Error('it settled after the reload');
    return 'still mid-air in the reloaded world';
  });
  P('a corrupt save clears itself and the boot stands', ()=>{
    localStorage.setItem('house.build', '{"v":1, busted');
    buildLoad();
    if(localStorage.getItem('house.build')) throw new Error('the bad save survived');
    localStorage.setItem('house.build', JSON.stringify({v:99, bodies:[]}));
    buildLoad();
    if(localStorage.getItem('house.build')) throw new Error('the alien version survived');
    return 'bad JSON gone, wrong version gone, no throw';
  });

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); }
catch(e){ console.log('TOP LEVEL THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
let errs = (w.__errs||[]).length;

if(!errs && w.__saveJson){
  const dom2 = new JSDOM(html.replace(/<script src=.*?<\/script>/,''),
    {runScripts:'outside-only', pretendToBeVisual:true, url:'https://the.house/'});
  const w2 = dom2.window;
  w2.HTMLCanvasElement.prototype.getContext = w.HTMLCanvasElement.prototype.getContext;
  w2.THREE = THREE;
  w2.AudioContext = undefined;
  w2.requestAnimationFrame = cb => { w2.__raf = cb; return 1; };
  w2.localStorage.setItem('house.build', w.__saveJson);   // BEFORE the boot
  try{ w2.eval(script + probe2); }
  catch(e){ console.log('SECOND BOOT THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
  errs += (w2.__errs||[]).length;
}
process.exit(errs ? 1 : 0);
