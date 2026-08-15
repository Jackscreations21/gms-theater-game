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
      /* RULING EG took GEAR from six kinds to nine, which is past the six a
         48px pitch fits, so the rows draw at the PAINT tab's small pitch and
         its button geometry (40 wide, at 340 and 460) */
      const minus = sc.hits.filter(h=>h.w===40 && h.x===340);
      const plus  = sc.hits.filter(h=>h.w===40 && h.x===460);
      const order = sc.hits.filter(h=>h.w===300 && h.h===56);
      if(minus.length !== 9 || plus.length !== 9) throw new Error(k+': '+minus.length+'/'+plus.length+' count buttons');
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
    const plusOf = row => sc.hits.find(h=>h.x===460 && h.y===112 + row*28);
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

  /* ---- RULING EG — the studio kit, ordered and delivered ------------------
     Appended at the END of this file on purpose: parallel branches of the same
     round take the top and the middle, and three anchors never conflict.     */
  console.log('--- RULING EG — the lights you can order ---');
  P('the three studio kinds are the last three GEAR rows, labelled and orderable', ()=>{
    const rows = orderRows(0);
    if(rows.length !== 9) throw new Error(rows.length + ' gear rows, wanted 9');
    /* the six that were there have not MOVED — the row order is what a hand
       learns and what four suites press by index, so a new kind goes last */
    const head = rows.slice(0, 6).map(r=>r.key).join(',');
    if(head !== 'profile,fresnel,par,cyc,mover,speaker')
      throw new Error('the old rows moved: ' + head);
    const want = [['soft','SOFTLIGHT'], ['panel','LED PANEL'], ['hmi','HMI FRESNEL']];
    rows.slice(6).forEach((r, i)=>{
      if(r.key !== want[i][0]) throw new Error('row ' + (6+i) + ' is ' + r.key);
      if(r.label !== want[i][1]) throw new Error(r.key + ' is labelled ' + JSON.stringify(r.label));
      if(!r.unit || r.unit.kind !== want[i][0]) throw new Error(r.key + ' orders ' + JSON.stringify(r.unit));
    });
    return rows.slice(6).map(r=>r.label).join(' / ');
  });
  P('a softlight, a panel and an HMI pressed off the glass arrive as hangable bodies', ()=>{
    const sc = VR.orders.palace;
    sc.tab = 0; sc.counts = {}; sc.status = ''; vrDrawOrder(sc);
    const plusOf = row => sc.hits.find(h=>h.x===460 && h.y===112 + row*28);
    [6, 7, 8].forEach(r=>{
      const b = plusOf(r);
      if(!b) throw new Error('no + button on gear row ' + r);
      b.fn();
    });
    sc.hits.find(h=>h.w===300 && h.h===56).fn();          // ORDER
    if(ORDERS.palace.pending.length !== 1) throw new Error('the slip did not take: ' + sc.status);
    const before = BODIES.length;
    for(let i=0;i<620;i++) updateSheds(0.05);             // 31 seconds of game time
    if(BODIES.length !== before + 3) throw new Error((BODIES.length - before) + ' bodies delivered');
    const fresh = BODIES.slice(-3);
    const kinds = fresh.map(b=>b.kind).sort().join(',');
    if(kinds !== 'hmi,panel,soft') throw new Error('delivered: ' + kinds);
    /* each is its OWN lantern, not the profile makeBodyMesh falls back to.
       Measured on the body's own box, because a merged shell sits at the
       ORIGIN and its pieces have stopped existing as objects (TRAPS). */
    const sizeOf = m => { const b = new THREE.Box3().setFromObject(m);
      return [b.max.x-b.min.x, b.max.y-b.min.y, b.max.z-b.min.z].map(n=>n.toFixed(2)).join('x'); };
    const pro = sizeOf(makeBodyMesh('profile'));
    const got = {};
    fresh.forEach(b=>{
      got[b.kind] = sizeOf(b.mesh);
      if(got[b.kind] === pro)
        throw new Error(b.kind + ' is the profile body: both ' + pro);
      if(!b.mesh.userData.lens) throw new Error(b.kind + ' has no lens to repaint');
      if(!b.mesh.userData.clamp) throw new Error(b.kind + ' has no clamp — it never meets a pipe');
      /* RULING A: any lantern body hangs on any lantern point, and none of
         them is rigging — canHang reads only these two fields */
      if(!canHang(b, {body:null, spk:false})) throw new Error(b.kind + ' cannot hang on a lantern point');
      if(canHang(b, {body:null, spk:true})) throw new Error(b.kind + ' was taken for a PA box');
    });
    if(new Set(Object.keys(got).map(k=>got[k])).size !== 3)
      throw new Error('two of the three are the same body: ' + JSON.stringify(got));
    return got;
  });
  P('rank and power are two numbers, and the HMI is ranked above what it burns (BF/EG)', ()=>{
    const at = x => ({pos:new THREE.Vector3(x, 8, -2), aim:new THREE.Vector3(x, 0, 0)});
    const soft = addFixture(Object.assign({name:'EG SOFT', type:'soft'}, at(-14)));
    const panel = addFixture(Object.assign({name:'EG PANEL', type:'panel'}, at(-15)));
    const hmi = addFixture(Object.assign({name:'EG HMI', type:'hmi'}, at(-16)));
    const pro = addFixture(Object.assign({name:'EG PRO', type:'profile'}, at(-17)));
    const table = {soft:[70, 5.0, 12, 2.2, 2.2], panel:[60, 4.2, 11, 1.8, 1.8], hmi:[24, 2.0, 26, 3.4, 3.6]};
    [soft, panel, hmi].forEach(f=>{
      const w = table[f.type];
      ['angle','beamRad','beamLen','power','rank'].forEach((k, i)=>{
        if(Math.abs(f[k] - w[i]) > 1e-9)
          throw new Error(f.type + '.' + k + ' is ' + f[k] + ', the ruling says ' + w[i]);
      });
    });
    /* the one place they must NOT agree — a rank that fell out of power would
       read 3.4 here and nothing else in the record would look wrong */
    if(hmi.rank === hmi.power) throw new Error('the HMI rank defaulted to its power, ' + hmi.rank);
    if(!(hmi.rank > pro.rank)) throw new Error('the HMI (' + hmi.rank + ') does not outrank a profile (' + pro.rank + ')');
    if(!(hmi.rank > soft.rank && hmi.rank > panel.rank)) throw new Error('the key light does not outrank the wash');
    /* and the glow sits at the LENS of a flat body, not a hand's width in front */
    if(!(panel.glow.position.z < 0.12)) throw new Error('the panel glow floats at z ' + panel.glow.position.z);
    if(Math.abs(pro.glow.position.z - 0.4) > 1e-9) throw new Error('a profile glow moved to ' + pro.glow.position.z);
    [soft, panel, hmi, pro].forEach(f=>{ f.level = 0; });
    return {hmi:{power:hmi.power, rank:hmi.rank}, profileRank:pro.rank, panelGlowZ:panel.glow.position.z};
  });
  P('a diffuse source gets the soft edge and the wash; the HMI keeps its shaft', ()=>{
    const was = FIXTURES.map(f=>f.level), g0 = RIG.grand, b0 = RIG.blackout;
    FIXTURES.forEach(f=>{ f.level = 0; });
    RIG.grand = 1; RIG.blackout = false;
    const named = n => FIXTURES.filter(f=>f.name === n).pop();
    const soft = named('EG SOFT'), panel = named('EG PANEL'), hmi = named('EG HMI'), pro = named('EG PRO');
    if(!soft || !panel || !hmi || !pro) throw new Error('the last test left no fixtures to drive');
    [soft, panel, hmi, pro].forEach(f=>{ f.level = 1; });
    updateRig(1/60, 0);
    /* read what the ENGINE produced, never the formula: the beam uniform off a
       real beam and the penumbra off the pool light that actually took it */
    const beamOf = f => f.beam.material.uniforms.uInt.value;
    const lightOf = f => LIGHT_POOL.find(l=>l.intensity > 0 && l.position.distanceTo(f._org) < 0.01);
    const shaft = beamOf(pro);
    if(!(shaft > 0)) throw new Error('nothing is lit — the rig never ran');
    if(Math.abs(beamOf(hmi) - shaft) > 1e-9) throw new Error('the HMI beam is not a shaft: ' + beamOf(hmi) + ' against ' + shaft);
    [soft, panel].forEach(f=>{
      if(!(beamOf(f) < shaft * 0.6)) throw new Error(f.type + ' burns a shaft in haze: ' + beamOf(f) + ' against ' + shaft);
      const l = lightOf(f);
      if(!l) throw new Error(f.type + ' never took a real light');
      if(Math.abs(l.penumbra - 0.85) > 1e-9) throw new Error(f.type + ' has a hard edge: penumbra ' + l.penumbra);
    });
    const lh = lightOf(hmi);
    if(!lh) throw new Error('the HMI never took a real light');
    if(Math.abs(lh.penumbra - 0.45) > 1e-9) throw new Error('the HMI went soft: penumbra ' + lh.penumbra);
    /* read the numbers BEFORE the restore — the rig is re-run below, and a
       report line taken after it prints the dark rig */
    const out = {wash:+beamOf(soft).toFixed(3), shaft:+shaft.toFixed(3),
                 softEdge:lightOf(soft).penumbra, hardEdge:lh.penumbra};
    FIXTURES.forEach((f, i)=>{ f.level = was[i] === undefined ? 0 : was[i]; });
    RIG.grand = g0; RIG.blackout = b0;
    updateRig(1/60, 0);
    return out;
  });

  /* ---- the stepladder (RULING EK) ------------------------------------------
     Appended at the END of this probe on purpose, so parallel branches taking
     the top or the middle of this file never collide with it. */
  console.log('--- the stepladder ---');
  P('a stepladder is ordered off the HDWE tab and delivered lying down', ()=>{
    const sc = VR.orders.palace;
    const tabs = sc.hits.filter(h=>h.w===122 && h.h===40);
    tabs[2].fn();                                     // HDWE
    const ri = orderRows(2).findIndex(r=>r.key === 'ladder');
    if(ri < 0) throw new Error('no stepladder on the hardware tab');
    const plus = sc.hits.find(h=>h.x===440 && h.y===112 + ri*48);
    if(!plus) throw new Error('the stepladder row has no + button on the screen');
    plus.fn();
    sc.hits.find(h=>h.w===300 && h.h===56).fn();      // ORDER
    if(sc.status) throw new Error('the screen refused the slip: '+sc.status);
    const o = ORDERS.palace;
    const pend = o.pending[o.pending.length - 1];
    if(!pend || pend.items.length !== 1 || pend.items[0].kind !== 'ladder')
      throw new Error('the slip did not say ladder');
    const before = BODIES.length;
    for(let k=0;k<620;k++) updateSheds(0.05);         // 31 seconds of game time
    if(BODIES.length !== before + 1)
      throw new Error((BODIES.length-before)+' bodies delivered, wanted 1');
    const lad = BODIES[BODIES.length - 1];
    if(lad.kind !== 'ladder') throw new Error('a '+lad.kind+' turned up instead');
    if(lad.venue !== 'palace') throw new Error('tagged for '+lad.venue);
    if(lad.state !== 'slotted') throw new Error('it is '+lad.state+', not on the pallet');
    /* 3.9m of stepladder lies DOWN with the long stock — stood upright in a
       smalls seat it is a mast through the shed roof */
    scene.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(lad.mesh);
    if(bb.max.y > 2.0)
      throw new Error('it stands '+bb.max.y.toFixed(2)+'m up off the pallet');
    if(bb.max.x - bb.min.x < 3.0)
      throw new Error('it is not lying along the boards: '+(bb.max.x-bb.min.x).toFixed(2)+'m of x');
    tabs[0].fn();
    return 'one stepladder, ordered and delivered flat, '+(bb.max.x-bb.min.x).toFixed(2)+'m along the pallet';
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
