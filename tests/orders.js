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
(function(){
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }

  window.__errs = [];
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,210):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); if(e.stack) console.log('      '+e.stack.split(String.fromCharCode(10)).slice(1,4).join(' | ')); window.__errs.push(name+': '+e.message); } };

  console.log('--- the order screens ---');
  P('each shed hangs an order screen with the full stock list', ()=>{
    vrBuildOrderScreens();
    if(!VR.orders || !VR.orders.palace || !VR.orders.arc) throw new Error('screens missing');
    ['palace','arc'].forEach(k=>{
      const sc = VR.orders[k];
      const minus = sc.hits.filter(h=>h.w===56 && h.x===300);
      const plus  = sc.hits.filter(h=>h.w===56 && h.x===440);
      const order = sc.hits.filter(h=>h.w===300 && h.h===56);
      if(minus.length !== 6 || plus.length !== 6) throw new Error(k+': '+minus.length+'/'+plus.length+' count buttons');
      if(order.length !== 1) throw new Error(k+': no ORDER button');
    });
    /* on the wall of its own shed, so it culls with the room */
    let o = VR.orders.palace.face, inShed = false;
    while(o){ if(o === SHEDS.palace.group) inShed = true; o = o.parent; }
    if(!inShed) throw new Error('the palace screen is not in its shed');
    return 'six lines and an ORDER button, each shed';
  });

  console.log('--- the delivery ---');
  P('an order becomes a loaded pallet on the apron, thirty seconds later', ()=>{
    const sc = VR.orders.palace;
    const plusOf = row => sc.hits.find(h=>h.x===440 && h.y===112 + row*48);
    plusOf(0).fn(); plusOf(0).fn();          // two profiles
    plusOf(5).fn();                          // one PA box
    sc.hits.find(h=>h.w===300 && h.h===56).fn();   // ORDER
    const o = ORDERS.palace;
    if(o.pending.length !== 1 || o.pending[0].items.length !== 3)
      throw new Error('no pending order: '+JSON.stringify(o.pending));
    const before = BODIES.length;
    for(let i=0;i<620;i++) updateSheds(0.05);      // 31 seconds of game time
    if(o.pending.length) throw new Error('thirty seconds on, still pending');
    if(!o.pallets.length) throw new Error('no pallet came');
    if(BODIES.length !== before + 3) throw new Error((BODIES.length-before)+' bodies delivered, wanted 3');
    const fresh = BODIES.slice(-3);
    if(fresh.some(b=>b.venue !== 'palace')) throw new Error('delivered stock tagged for the wrong venue');
    if(fresh.some(b=>b.state !== 'slotted')) throw new Error('delivered stock not on the pallet');
    const kinds = fresh.map(b=>b.kind).sort().join(',');
    if(kinds !== 'profile,profile,speaker') throw new Error('wrong stock: '+kinds);
    /* the pallet stands INSIDE the shed, at the roller-door apron */
    const p = new THREE.Vector3(); o.pallets[0].group.getWorldPosition(p);
    if(p.z < SHEDS.palace.z0 || p.z > SHEDS.palace.z1) throw new Error('the pallet is not in the shed: z='+p.z.toFixed(1));
    return 'two profiles and a PA box, palleted at z='+p.z.toFixed(1);
  });
  P('the emptied pallet clears itself away', ()=>{
    const o = ORDERS.palace;
    if(!o.pallets.length) throw new Error('no pallet from the last test');
    const palletGroup = o.pallets[0].group;
    const fresh = BODIES.slice(-3);
    fresh.forEach(b=>{ grabBody(b); b.state = 'loose'; });
    for(let i=0;i<130;i++) updateSheds(0.05);      // 6.5 seconds
    if(o.pallets.length) throw new Error('the empty pallet is still on the books');
    if(palletGroup.parent) throw new Error('the empty pallet is still in the scene');
    /* the freed stock is ordinary loose bodies — file them on the racks */
    fresh.forEach((b, i)=>{
      if(!slotBody(b, SHEDS.palace.slots[8 + i])) throw new Error('the racks refused delivered stock');
    });
    return 'gone a few seconds after the last body came off';
  });
  P("RULING D' — three orders out at once, a fourth refused", ()=>{
    const o = ORDERS.palace;
    if(orderPlace('palace', ['par']) !== 'OK') throw new Error('the first slip was refused');
    if(orderPlace('palace', ['cyc']) !== 'OK') throw new Error('the second slip was refused');
    if(orderPlace('palace', ['mover']) !== 'OK') throw new Error('the third slip was refused');
    if(orderPlace('palace', ['par']) !== 'BUSY') throw new Error('a fourth order was taken');
    const sc = VR.orders.palace;
    sc.counts.par = 1; vrOrderPress(sc);
    if(sc.status !== 'THREE ORDERS OUT ALREADY') throw new Error('the screen says: '+sc.status);
    sc.counts = {};
    for(let i=0;i<620;i++) updateSheds(0.05);
    if(o.pallets.length !== 3) throw new Error(o.pallets.length+' pallets on the apron');
    /* three pallets, three SPOTS — nobody delivers onto somebody's stack */
    const xs = o.pallets.map(p=>p.group.position.x.toFixed(1));
    if(new Set(xs).size !== 3) throw new Error('pallets share a spot: '+xs.join(' '));
    BODIES.slice(-3).forEach(b=>{ grabBody(b); b.state = 'loose'; });
    for(let i=0;i<130;i++) updateSheds(0.05);
    if(o.pallets.length) throw new Error('the pallets never cleared');
    return 'three pallets at '+xs.join(' / ')+', a fourth slip refused';
  });

  console.log('--- the rulings ---');
  P('RULING E — the venue refuses stock past twenty-four loose bodies', ()=>{
    const have = venueLooseCount('palace');
    const fakes = [];
    for(let i = have; i < 24; i++){
      const f = {kind:'par', venue:'palace', mesh:new THREE.Object3D(), state:'loose', point:null, slot:null};
      fakes.push(f); BODIES.push(f);
    }
    const r = orderPlace('palace', ['par']);
    if(r !== 'STOCK FULL') throw new Error('took the order anyway: '+r);
    /* and the screen says so */
    const sc = VR.orders.palace;
    sc.counts.par = 1; vrOrderPress(sc);
    if(sc.status !== 'STOCK FULL') throw new Error('the screen says: '+sc.status);
    sc.counts.par = 0;
    fakes.forEach(f=>{ BODIES.splice(BODIES.indexOf(f), 1); });
    if(orderPlace('palace', []) === 'OK') throw new Error('an empty slip was accepted');
    return 'STOCK FULL at the cap, and an empty slip refused';
  });
  P('the arc shed orders for the arc', ()=>{
    const r = orderPlace('arc', ['cyc']);
    if(r !== 'OK') throw new Error('the arc refused a clean order: '+r);
    for(let i=0;i<620;i++) updateSheds(0.05);
    const b = BODIES[BODIES.length-1];
    if(!ORDERS.arc.pallets.length) throw new Error('no arc pallet');
    if(b.venue !== 'arc' || b.kind !== 'cyc') throw new Error('wrong stock: '+b.venue+' '+b.kind);
    /* the arc pallet lands in the shared shed behind both houses */
    const p = new THREE.Vector3(); b.mesh.getWorldPosition(p);
    if(Math.abs(p.x - (ARC.X - 26)) > 3) throw new Error('the pallet missed the apron: x='+p.x.toFixed(1));
    grabBody(b); b.state = 'loose';
    if(!slotBody(b, SHEDS.arc.slots[0])) throw new Error('the arc racks refused it');
    for(let i=0;i<130;i++) updateSheds(0.05);
    if(ORDERS.arc.pallets.length) throw new Error('the arc pallet never cleared');
    return 'a cyc unit, delivered 420m from the palace';
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
