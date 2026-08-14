const {JSDOM} = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname,'..','the-house.html'),'utf8');
const dom = new JSDOM(html.replace(/<script src=.*?<\/script>/,''), {runScripts:'outside-only', pretendToBeVisual:true});
const w = dom.window;
/* jsdom has no pointer-lock support, so MouseEvent drops movementX/movementY.
   A browser defines both on every mouse event (default 0) — match that, or the
   hauling tests pull with undefined force and mouse-look math goes NaN.       */
const RealMouseEvent = w.MouseEvent;
w.MouseEvent = class MouseEvent extends RealMouseEvent {
  constructor(type, init = {}){
    super(type, init);
    Object.defineProperty(this, 'movementX', {value: init.movementX || 0});
    Object.defineProperty(this, 'movementY', {value: init.movementY || 0});
  }
};
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
w.performance = {now:()=>Date.now()};
const probe = `
;(function(){
  window.__out = {};
  let n=0;
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); n++; } }
  window.__errs = [];
  window.__probe = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,90):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); window.__errs.push(name+': '+e.message); } };
  const P = window.__probe;
  console.log('--- fly rail buttons (single clicks) ---');
  document.querySelector('[data-p="fly"]').click();
  P('the rail wakes up locked off, every line', ()=>{
    /* a counterweight rail at rest is locked off — the boot state IS locked */
    const un = FLY.filter(l=>!l.locked);
    if(un.length) throw new Error(un.length+' of '+FLY.length+' linesets started unlocked');
    const dots = Array.prototype.slice.call(document.querySelectorAll('#lsTable tbody .dot'));
    if(dots.length !== FLY.length) throw new Error(dots.length+' dots for '+FLY.length+' linesets');
    if(!dots.every(d=>d.className.indexOf('lk') !== -1))
      throw new Error('the board does not show the locks');
    return FLY.length+' linesets locked off at rest';
  });
  P('the board reads in feet and inches', ()=>{
    /* build-feel RULING S: the glass reads ft-in; the bones stay metric */
    /* the probe rides a template literal, so the regex is built from a
       doubled-backslash string — a literal /\d/ would lose its backslash */
    const ftin = new RegExp("^\\\\d+'\\\\d+\\"$");
    syncFlyRow(FLY[2]);
    const ht = document.querySelectorAll('#lsTable tbody tr')[2].querySelector('.ht');
    if(!ftin.test(ht.textContent))
      throw new Error('a fly row height reads "'+ht.textContent+'"');
    if(typeof syncFohBarRow === 'function'){
      syncFohBarRow();
      const fh = document.querySelector('#lsTable tfoot tr.fohbar .ht');
      if(fh && !ftin.test(fh.textContent))
        throw new Error('the FOH row reads "'+fh.textContent+'"');
    }
    if(typeof syncSpkBarRows === 'function'){
      syncSpkBarRows();
      const sh = document.querySelector('#lsTable tfoot tr.spkbar .ht');
      if(sh && !ftin.test(sh.textContent))
        throw new Error('a SPK row reads "'+sh.textContent+'"');
    }
    /* and the model underneath is still metres: OUT_TRIM is a number of
       metres every invariant in the handoff is written against */
    if(OUT_TRIM < 10 || OUT_TRIM > 40) throw new Error('OUT_TRIM moved: '+OUT_TRIM);
    return 'rows read like a tape: '+ht.textContent;
  });
  P('button node survives 60 UI ticks', ()=>{
    const first = document.querySelector('#lsTable tbody tr button');
    for(let i=0;i<60;i++){ const cb=window.__raf; window.__raf=null; if(cb) cb(Date.now()+i*16); }
    const after = document.querySelector('#lsTable tbody tr button');
    if(first !== after) throw new Error('row rebuilt - clicks would be eaten');
    return 'same node';
  });
  P('ONE click on IN flies the lineset in', ()=>{
    const ls = FLY[9]; ls.target = ls.pos = OUT_TRIM;
    document.querySelectorAll('#lsTable tbody tr')[9].querySelectorAll('button')[0].click();
    if(Math.abs(ls.target - OUT_TRIM) < 0.01) throw new Error('one click did nothing');
    return 'target -> '+ls.target.toFixed(2);
  });
  P('ONE click on OUT flies it back', ()=>{
    const ls = FLY[9];
    document.querySelectorAll('#lsTable tbody tr')[9].querySelectorAll('button')[1].click();
    if(Math.abs(ls.target - OUT_TRIM) > 0.01) throw new Error('one click did nothing');
    return 'target -> '+ls.target.toFixed(2);
  });
  P('still one click after 200 ticks', ()=>{
    for(let i=0;i<200;i++){ const cb=window.__raf; window.__raf=null; if(cb) cb(Date.now()+i*16); }
    const ls = FLY[5]; ls.target = ls.pos = OUT_TRIM;
    document.querySelectorAll('#lsTable tbody tr')[5].querySelectorAll('button')[0].click();
    if(Math.abs(ls.target - OUT_TRIM) < 0.01) throw new Error('click lost');
    return 'target -> '+ls.target.toFixed(2);
  });
  P('the board flies a locked line, and locks it off again on arrival', ()=>{
    /* the lock is the hand's interlock; the board is the flyman — it takes
       the lock off itself, runs the line, and locks off again on arrival */
    const ls = FLY[3];
    const b = document.querySelectorAll('#lsTable tbody tr')[3].querySelectorAll('button');
    ls.target = ls.pos = OUT_TRIM; ls.group.position.y = ls.pos;
    if(!ls.locked) b[3].click();                    // lock it off at the rail first
    if(!ls.locked) throw new Error('setup: the LOCK button did not take');
    b[0].click();                                   // IN, from the board
    if(ls.locked) throw new Error('the board did not take the lock off for its move');
    if(Math.abs(ls.target - ls.pos) < 0.01) throw new Error('the board move was refused');
    for(let i=0;i<400;i++) updateFly(0.05);
    if(Math.abs(ls.pos - ls.target) > 0.01) throw new Error('it never arrived');
    if(!ls.locked) throw new Error('the flyman did not lock it off on arrival');
    return 'locked -> flown -> locked at '+ls.pos.toFixed(1)+'m';
  });
  P('a hand grabbing mid-move takes over from the flyman — no relock under it', ()=>{
    /* start a board move on a locked line, then grab it before it arrives:
       the pending relock must hand over to the hand, at the desktop rail
       exactly as at the VR one */
    const ls = FLY[3];
    const b = document.querySelectorAll('#lsTable tbody tr')[3].querySelectorAll('button');
    ls.target = ls.pos = OUT_TRIM; ls.group.position.y = ls.pos;
    if(!ls.locked) b[3].click();
    b[0].click();                                   // IN — relock now pending
    for(let k=0;k<10;k++) updateFly(0.05);          // in flight, not arrived
    if(!grabLineset(ls)) throw new Error('the grab was refused mid-move');
    for(let i=0;i<400;i++) updateFly(0.05);         // arrive under the hand
    if(ls.locked) throw new Error('the line locked itself under a live hand');
    releaseLineset();
    b[3].click();                                   // leave it locked off, as found
    return 'arrived under the hand, still free until the flyman is asked';
  });
  P('STOP halts travel on one click', ()=>{
    const ls = FLY[6]; flyOut(ls);
    for(let k=0;k<10;k++) updateFly(0.05);
    document.querySelectorAll('#lsTable tbody tr')[6].querySelectorAll('button')[2].click();
    if(Math.abs(ls.target-ls.pos) > 0.001) throw new Error('did not hold');
    return 'held at '+ls.pos.toFixed(2);
  });
  P('curtain OPEN/CLOSE on one click', ()=>{
    const ls = FLY[1];
    const b = document.querySelectorAll('#lsTable tbody tr')[1].querySelectorAll('button');
    const before = ls.travTarget; b[4].click();
    if(ls.travTarget === before) throw new Error('traveler did not move');
    return 'open -> '+ls.travTarget;
  });
  console.log('--- the FOH bar, from the board ---');
  P('LOWER on the board brings the bar and all six lanterns down', ()=>{
    if(typeof FOHBAR === 'undefined' || !FOHBAR) throw new Error('there is no FOH bar');
    const foh = FIXTURES.filter(f=>f.name.indexOf('FOH ') === 0);
    if(foh.length !== 6) throw new Error(foh.length+' FOH lanterns');
    const row = document.querySelector('#lsTable tfoot tr.fohbar');
    if(!row) throw new Error('no FOH BAR row on the rail panel');
    const btn = Array.prototype.slice.call(row.querySelectorAll('button'))
      .find(b=>b.textContent === 'LOWER');
    if(!btn) throw new Error('the FOH BAR row has no LOWER button');
    for(let i=0;i<40;i++) updateRig(0.05, 1);
    const y0 = FOHBAR.y;
    const org0 = foh.map(f=>f._org.y);
    const aim0 = foh.map(f=>f.aim.clone());
    btn.click();
    if(FOHBAR.target > y0 - 1.0) throw new Error('one click moved the target to '+FOHBAR.target.toFixed(2));
    for(let i=0;i<120;i++) updateRig(0.05, 1);
    if(!(FOHBAR.y < y0 - 1.0)) throw new Error('the bar did not come down: '+FOHBAR.y.toFixed(2));
    const dir = new THREE.Vector3(), want = new THREE.Vector3();
    foh.forEach((f,i)=>{
      if(!(f._org.y < org0[i] - 1.0)) throw new Error(f.name+' did not ride the bar down');
      if(f.aim.distanceTo(aim0[i]) > 1e-6) throw new Error(f.name+' lost its focus');
      /* the lantern must TILT to hold its focus: its +z looks at the aim */
      f.group.getWorldDirection(dir);
      want.copy(f.aim).sub(f._org).normalize();
      if(dir.dot(want) < 0.999) throw new Error(f.name+' is no longer pointed at its focus');
    });
    return 'bar '+y0.toFixed(2)+' -> '+FOHBAR.y.toFixed(2)+'m, six lanterns riding, aims held';
  });
  P('RAISE takes it home and the readout follows', ()=>{
    const row = document.querySelector('#lsTable tfoot tr.fohbar');
    const btn = Array.prototype.slice.call(row.querySelectorAll('button'))
      .find(b=>b.textContent === 'RAISE');
    if(!btn) throw new Error('no RAISE button');
    btn.click();
    for(let i=0;i<200;i++) updateRig(0.05, 1);
    if(Math.abs(FOHBAR.y - FOHBAR.max) > 0.01)
      throw new Error('RAISE left the bar at '+FOHBAR.y.toFixed(2));
    syncFlyUI();
    /* the glass reads ft-in now (build-feel RULING S): compare the STRING
       the formatter makes of the model — never parse the display back */
    const txt = row.querySelector('.ht').textContent;
    if(txt !== ftIn(FOHBAR.y))
      throw new Error('the readout says '+txt+' and the bar is at '+FOHBAR.y.toFixed(2));
    return 'home at '+txt;
  });
  P('the bar will not go below hand height or above home', ()=>{
    fohBarTo(-99);
    if(Math.abs(FOHBAR.target - FOHBAR.min) > 1e-9)
      throw new Error('drove to '+FOHBAR.target.toFixed(2)+' past the floor clamp '+FOHBAR.min.toFixed(2));
    fohBarTo(99);
    if(Math.abs(FOHBAR.target - FOHBAR.max) > 1e-9)
      throw new Error('drove to '+FOHBAR.target.toFixed(2)+' past the top clamp');
    /* the bar comes down INTO the stalls on purpose — low enough to take
       the lanterns off by hand (they hang 0.45 under the pipe), but the
       pipe itself never kisses the floor */
    if(FOHBAR.min < houseFloorY(FOHBAR.z) + 1.5)
      throw new Error('the floor clamp '+FOHBAR.min.toFixed(2)+' puts the pipe on the floor');
    if(FOHBAR.min - 0.45 - houseFloorY(FOHBAR.z) > 1.7)
      throw new Error('the floor clamp '+FOHBAR.min.toFixed(2)+' keeps the lanterns out of reach');
    for(let i=0;i<40;i++) updateRig(0.05, 1);
    return 'clamped '+FOHBAR.min.toFixed(2)+' .. '+FOHBAR.max.toFixed(2);
  });
  console.log('--- hauling + shift lock ---');
  P('hold LMB on an unlocked lineset hauls it', ()=>{
    const ls = FLY[9];
    const b9 = document.querySelectorAll('#lsTable tbody tr')[9].querySelectorAll('button');
    if(ls.locked) b9[3].click();   // the rail wakes locked — take the lock off through its button
    ls.target = ls.pos = 14.0;
    Player.mode='walk'; pointerLocked = true;
    hoverInfo = {kind:'lineset', ls:ls};
    dom.dispatchEvent(new window.MouseEvent('mousedown',{button:0,bubbles:true}));
    if(!flyDrag) throw new Error('did not grab');
    for(let i=0;i<20;i++) window.dispatchEvent(new window.MouseEvent('mousemove',{bubbles:true, movementY:-10}));
    const up = ls.target;
    if(up <= 14.0) throw new Error('pulling up did not raise it');
    for(let i=0;i<40;i++) window.dispatchEvent(new window.MouseEvent('mousemove',{bubbles:true, movementY:10}));
    if(ls.target >= up) throw new Error('pushing down did not lower it');
    window.dispatchEvent(new window.MouseEvent('mouseup',{bubbles:true}));
    if(flyDrag) throw new Error('did not release');
    return 'hauled '+up.toFixed(2)+' -> '+ls.target.toFixed(2);
  });
  P('a lineset the hand has not unlocked refuses the haul', ()=>{
    const ls = FLY[4];             // untouched since boot: its lock is still in
    if(!ls.locked) throw new Error('lineset 5 lost its boot lock');
    const before = ls.target;
    hoverInfo = {kind:'lineset', ls:ls};
    dom.dispatchEvent(new window.MouseEvent('mousedown',{button:0,bubbles:true}));
    if(flyDrag) throw new Error('grabbed a locked lineset');
    for(let i=0;i<20;i++) window.dispatchEvent(new window.MouseEvent('mousemove',{bubbles:true, movementY:-10}));
    window.dispatchEvent(new window.MouseEvent('mouseup',{bubbles:true}));
    if(Math.abs(ls.target-before) > 0.001) throw new Error('locked lineset moved');
    return 'held fast, straight off the boot';
  });
  P('hauling respects the travel limits', ()=>{
    const ls = FLY[9];
    const b9 = document.querySelectorAll('#lsTable tbody tr')[9].querySelectorAll('button');
    if(ls.locked) b9[3].click();   // unlock through the board so the grab takes
    hoverInfo = {kind:'lineset', ls:ls};
    dom.dispatchEvent(new window.MouseEvent('mousedown',{button:0,bubbles:true}));
    for(let i=0;i<600;i++) window.dispatchEvent(new window.MouseEvent('mousemove',{bubbles:true, movementY:-30}));
    const hi = ls.target;
    for(let i=0;i<900;i++) window.dispatchEvent(new window.MouseEvent('mousemove',{bubbles:true, movementY:30}));
    const lo = ls.target;
    window.dispatchEvent(new window.MouseEvent('mouseup',{bubbles:true}));
    if(hi > OUT_TRIM+0.45 || lo < 0.59) throw new Error('ran past the ends: '+hi+' / '+lo);
    return 'clamped '+lo.toFixed(2)+' .. '+hi.toFixed(2);
  });
  P('heavier goods haul slower than light ones', ()=>{
    const light = FLY[2], heavy = FLY[1];      // border 110 kg vs house curtain 420 kg
    const run = ls => { const row = document.querySelectorAll('#lsTable tbody tr')[FLY.indexOf(ls)];
      if(ls.locked) row.querySelectorAll('button')[3].click();   // unlock through the board
      ls.target = 12.0; hoverInfo={kind:'lineset', ls:ls};
      dom.dispatchEvent(new window.MouseEvent('mousedown',{button:0,bubbles:true}));
      for(let i=0;i<20;i++) window.dispatchEvent(new window.MouseEvent('mousemove',{bubbles:true, movementY:-10}));
      const d = ls.target - 12.0;
      window.dispatchEvent(new window.MouseEvent('mouseup',{bubbles:true}));
      return d; };
    const a = run(light), b = run(heavy);
    if(!(a > b)) throw new Error('weight is not being felt');
    return 'light '+a.toFixed(2)+'m vs heavy '+b.toFixed(2)+'m';
  });
  P('tap Shift locks the cursor, tap again releases', ()=>{
    /* jsdom has no pointer lock at all — mock the whole API so that
       requestPointerLock/exitPointerLock drive pointerlockchange the way a
       browser does, and the game's own handler keeps the chip honest */
    const el = renderer.domElement;
    window.__plk = null;
    Object.defineProperty(document, 'pointerLockElement', {configurable:true, get:()=>window.__plk});
    el.requestPointerLock = ()=>{ window.__plk = el; document.dispatchEvent(new window.Event('pointerlockchange')); };
    document.exitPointerLock = ()=>{ window.__plk = null; document.dispatchEvent(new window.Event('pointerlockchange')); };
    window.__tapShift = ()=>{
      window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Shift',code:'ShiftLeft',bubbles:true}));
      window.dispatchEvent(new window.KeyboardEvent('keyup',{key:'Shift',code:'ShiftLeft',bubbles:true}));
    };
    Player.mode='walk';
    document.dispatchEvent(new window.Event('pointerlockchange'));   // settle to unlocked
    window.__tapShift();
    if(!shiftLock) throw new Error('tap did not lock');
    if(!document.querySelector('#slChip').classList.contains('on')) throw new Error('chip did not light');
    window.__tapShift();
    if(shiftLock) throw new Error('second tap did not release');
    if(document.querySelector('#slChip').classList.contains('on')) throw new Error('chip stayed lit');
    return 'locks and releases';
  });
  P('holding Shift runs, and does NOT toggle the lock', ()=>{
    Player.mode='walk';
    const before = shiftLock;
    window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Shift',code:'ShiftLeft',bubbles:true}));
    const t0 = Date.now(); while(Date.now()-t0 < 300){}   // a HOLD, not a tap
    keys['KeyW']=true;
    const z0 = Player.pos.z; for(let i=0;i<30;i++) updatePlayer(0.016);
    const fast = Math.abs(Player.pos.z - z0);
    window.dispatchEvent(new window.KeyboardEvent('keyup',{key:'Shift',code:'ShiftLeft',bubbles:true}));
    if(shiftLock !== before) throw new Error('a hold toggled the lock');
    const z1 = Player.pos.z; for(let i=0;i<30;i++) updatePlayer(0.016);
    const slow = Math.abs(Player.pos.z - z1);
    keys['KeyW']=false;
    if(!(fast > slow*1.4)) throw new Error('held run was not faster ('+fast.toFixed(2)+' vs '+slow.toFixed(2)+')');
    return 'run '+fast.toFixed(2)+'m vs walk '+slow.toFixed(2)+'m, no toggle';
  });
  P('the browser Esc-unlock turns the chip off', ()=>{
    Player.mode='walk';
    if(!shiftLock) window.__tapShift();
    if(!shiftLock) throw new Error('setup: could not lock');
    /* the browser exits pointer lock on Esc without asking the page — all we
       get is the event, so the chip must follow it */
    window.__plk = null; document.dispatchEvent(new window.Event('pointerlockchange'));
    if(shiftLock) throw new Error('chip state did not follow the browser');
    if(document.querySelector('#slChip').classList.contains('on')) throw new Error('chip stayed lit');
    return 'chip follows pointerlockchange';
  });
  P('the L key toggles the cursor lock too', ()=>{
    Player.mode='walk';
    const before = shiftLock;
    window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'l',code:'KeyL',bubbles:true}));
    if(shiftLock === before) throw new Error('L did nothing');
    window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'l',code:'KeyL',bubbles:true}));
    if(shiftLock !== before) throw new Error('L did not toggle back');
    return 'toggles both ways';
  });
  P('no wall boxes left on the damask', ()=>{
    let n=0; world.traverse(o=>{ if(o.isMesh && o.material===M.crimson) n++; });
    return n+' crimson pieces (box fronts only)';
  });
  console.log('--- sections + blackout + apron ---');
  P('eight section faders, no channel strip', ()=>{
    const n = document.querySelectorAll('#chStrip .fx').length;
    if(n !== SECTIONS.length) throw new Error('expected '+SECTIONS.length+' got '+n);
    return n+' sections';
  });
  P('a section fader drives all its fixtures', ()=>{
    const s = SECTIONS[1];              // stage wash
    setSection(s, 0.75, 0);
    const bad = s.chans.filter(c=>Math.abs(chan(c).level-0.75) > 0.001);
    if(bad.length) throw new Error('channels not following: '+bad);
    return s.chans.length+' fixtures at 75%';
  });
  P('a section colour drives all its fixtures', ()=>{
    const s = SECTIONS[3];              // cyc
    setSectionColor(s, '#ff2a1e', 0);
    const bad = s.chans.filter(c=>chan(c).color.getHexString() !== 'ff2a1e');
    if(bad.length) throw new Error('colour not following: '+bad);
    return 'cyc is red';
  });
  P('the faders read the rig back', ()=>{
    SECTIONS[1].chans.forEach(c=>setLevel(c, 0, 0));
    setLevel(9, 0.31, 0); setLevel(10, 0.12, 0);
    syncSections();
    if(Math.abs(SECTIONS[1].level - 0.31) > 0.001) throw new Error('fader did not follow the rig');
    return 'fader shows '+Math.round(SECTIONS[1].level*100)+'%';
  });
  P('house + work sections drive the house circuits', ()=>{
    /* by ID, not by position.  This read SECTIONS[6]/[7] until RULING BC added
       the two audience-rig faders ahead of them on the board and it started
       driving the blinders instead — the assertion is about the HOUSE and WORK
       circuits, so it should say so. */
    const secOf = id => SECTIONS[SECTIONS.findIndex(s=>s.id===id)];
    setSection(secOf('house'), 0.5, 0); setSection(secOf('work'), 0.25, 0);
    if(Math.abs(HOUSE.house-0.5)>0.001 || Math.abs(HOUSE.work-0.25)>0.001) throw new Error('house not following');
    return 'house 50% / work 25%';
  });
  P('every section selectable', ()=>{ SECTIONS.forEach((s,i)=>selectSection(i)); return 'ok'; });
  P('EVERYTHING OFF is pitch black', ()=>{
    SECTIONS.forEach(s=>setSection(s,0,0));
    for(let i=0;i<10;i++){ updateFades(0.1); updateRig(0.1,1); }
    const amb = ambient.intensity, hem = hemi.intensity;
    const bg = scene.background.r + scene.background.g + scene.background.b;
    const pool = LIGHT_POOL.reduce((a,l)=>a+l.intensity,0);
    const house = houseLights.reduce((a,l)=>a+l.intensity,0);
    if(amb > 0.002 || hem > 0.002 || bg > 0.006 || pool > 0.002 || house > 0.002)
      throw new Error('still lit: amb '+amb.toFixed(3)+' hemi '+hem.toFixed(3)+' bg '+bg.toFixed(3)+
                      ' pool '+pool.toFixed(3)+' house '+house.toFixed(3));
    return 'ambient '+amb.toFixed(4)+', background '+bg.toFixed(4)+', all lights 0';
  });
  P('stage light stays on the stage, house light fills the room', ()=>{
    // the rig up on its own should barely lift the room
    SECTIONS.forEach(s=>setSection(s,0,0));
    setSection(SECTIONS[1], 1, 0);
    for(let i=0;i<10;i++){ updateFades(0.1); updateRig(0.1,1); }
    const rigAmb = ambient.intensity;
    if(rigAmb < 0.001) throw new Error('a full stage wash lifts nothing at all');
    if(rigAmb > 0.09) throw new Error('a stage wash floods the auditorium: '+rigAmb.toFixed(3));
    // the house lights, on the other hand, are meant to fill it
    const houseSec = SECTIONS.find(s=>s.id === 'house');
    setSection(houseSec, 1, 0);
    for(let i=0;i<10;i++){ updateFades(0.1); updateRig(0.1,1); }
    const houseAmb = ambient.intensity;
    if(houseAmb < 0.25) throw new Error('the house lights do not fill the room: '+houseAmb.toFixed(3));
    if(houseAmb < rigAmb*3) throw new Error('the house barely beats the rig');
    setSection(houseSec, 0, 0);
    for(let i=0;i<10;i++) updateRig(0.1,1);
    return 'stage wash '+rigAmb.toFixed(3)+' ambient, house lights '+houseAmb.toFixed(3);
  });
  P('the apron bow spans the whole stage width', ()=>{
    const mid = frontZ(0.5), endL = frontZ(0), endR = frontZ(1);
    const xL = frontX(0), xR = frontX(1);
    if(Math.abs(Math.abs(xL) - D.stageW/2) > 0.01) throw new Error('bow does not reach the sides');
    if(Math.abs(endL - D.apron) > 0.01 || Math.abs(endR - D.apron) > 0.01) throw new Error('ends not square');
    if(Math.abs(mid - (D.apron + D.thrust)) > 0.01) throw new Error('wrong sagitta');
    return 'edge '+xL.toFixed(1)+'..'+xR.toFixed(1)+' m, bows '+(mid-D.apron).toFixed(1)+' m at centre';
  });
  P('no damask left in the room', ()=>{
    let n=0; world.traverse(o=>{ if(o.isMesh && o.material && o.material.map === (TX.damask||null)) n++; });
    if(TX.damask) throw new Error('damask texture still built');
    return 'gone';
  });
  P('balcony soffits are smooth', ()=>{
    let n=0; world.traverse(o=>{ if(o.isInstancedMesh && o.geometry.parameters &&
      o.geometry.parameters.width === 2.5 && o.geometry.parameters.height === 0.1) n++; });
    if(n) throw new Error('coffers still under the balconies');
    return 'no coffers';
  });
  console.log('--- lobby, backstage, doors ---');
  P('the lobby and the loading dock are walkable', ()=>{
    const lob = groundAt(0, FOH.z0+5, FOH.y+2);
    const gal = groundAt(0, FOH.z0+3, FOH.gallY+2);
    const dock = groundAt(DOCK.inner + DOCK.dir*4, -7.5, 2);
    const street = groundAt(DOCK.outer + DOCK.dir*6, -7.5, 2);
    if(lob === null) throw new Error('no lobby floor');
    if(gal === null) throw new Error('no gallery floor');
    if(dock === null) throw new Error('no dock floor');
    if(Math.abs(dock) > 0.2) throw new Error('the dock is at '+dock+', it should be stage level');
    if(street > DOCK.road + 0.4) throw new Error('the road is not below the dock lip');
    if(street === null) throw new Error('no road outside the doors');
    return 'foyer '+lob.toFixed(1)+' / gallery '+gal.toFixed(1)+' / dock '+dock.toFixed(2);
  });
  P('nothing is left behind the stage but the warehouse', ()=>{
    /* the warehouse PR: a shed stands behind the back wall — floor inside it,
       and still nothing anywhere else.

       EVERY z HERE COMES OFF THE SHED rather than being typed.  This wall has
       now moved twice — PAL_DEEP 4.5 for the wagon, 8.5 for his house (RULING
       CL) — and the -25 / -35 written against the first move had quietly become
       "probe the shed floor and the stage deck", so the assertion failed on a
       building that was perfectly correct.  Same rule as the shed's own
       furniture: anything positioned inside a movable structure is expressed
       relative to it (TRAPS). */
    const sh = SHEDS.palace;
    if(!sh) throw new Error('no palace shed');
    const mid = (sh.z0 + sh.z1)/2;
    if(groundAt(0, mid, 2) === null) throw new Error('the warehouse shed has no floor');
    for(const z of [sh.z0 - 4, sh.z0 - 14])                   // beyond its rear wall
      for(const x of [-12, 0, 12])
        if(groundAt(x, z, 2) !== null)
          throw new Error('still a floor behind the warehouse at '+x+','+z.toFixed(1));
    for(const x of [sh.x0 - 4, sh.x1 + 6])                    // and beside it
      if(groundAt(x, mid, 2) !== null)
        throw new Error('a floor beside the shed at '+x.toFixed(1)+','+mid.toFixed(1));
    // and the old rooms are not in the room list any more
    if(ROOM_ORDER.indexOf('boh') !== -1 || ROOM_ORDER.indexOf('shop') !== -1)
      throw new Error('the culling still thinks there are rooms back there');
    return ROOM_ORDER.length+' rooms: '+ROOM_ORDER.join(', ');
  });
  P('the stage runs a long way out into the wings', ()=>{
    if(D.stageW < 40) throw new Error('the stage is only '+D.stageW+'m wide');
    const wingL = groundAt(-D.stageW/2 + 2, -6, 2);
    const wingR = groundAt( D.stageW/2 - 2, -6, 2);
    if(wingL === null || wingR === null) throw new Error('no floor out in the wings');
    const off = (D.stageW - D.procW)/2;
    return D.stageW+'m wide, '+off.toFixed(1)+'m of wing each side of a '+D.procW+'m opening';
  });
  P('the doors are hinged in place', ()=>{
    if(DOORS.length !== DOORWAYS.length*2) throw new Error('leaf count wrong');
    return DOORWAYS.length+' doorways, '+DOORS.length+' leaves';
  });
  P('a shut door blocks you, an open one lets you through', ()=>{
    const dw = DOORWAYS[1];                       // the centre stalls doors
    const y = houseFloorY(D.houseBack);
    setAllDoors(false); for(let i=0;i<80;i++) updateDoors(0.05);
    if(!doorBlocks(dw.x, FOH.z0, D.houseBack-1, y+0.5)) throw new Error('walked through a shut door');
    setAllDoors(true);  for(let i=0;i<80;i++) updateDoors(0.05);
    if(doorBlocks(dw.x, FOH.z0, D.houseBack-1, y+0.5)) throw new Error('open door still blocking');
    return 'blocks when shut, clear when open';
  });
  P('the wall between the doorways is always solid', ()=>{
    const y = houseFloorY(D.houseBack);
    setAllDoors(true); for(let i=0;i<80;i++) updateDoors(0.05);
    if(!doorBlocks(-4.5, FOH.z0, D.houseBack-1, y+0.5)) throw new Error('walked through the wall');
    return 'solid';
  });
  P('E on a door swings it', ()=>{
    setAllDoors(false); for(let i=0;i<80;i++) updateDoors(0.05);
    hoverInfo = {kind:'door', dw:DOORWAYS[0]};
    useTarget();
    if(DOORWAYS[0].leaves[0].target !== 1) throw new Error('did not open');
    useTarget();
    if(DOORWAYS[0].leaves[0].target !== 0) throw new Error('did not close');
    hoverInfo = null;
    return 'opens and closes';
  });
  P('the doors actually rotate', ()=>{
    setAllDoors(true);
    for(let i=0;i<80;i++) updateDoors(0.05);
    const a = DOORS[0].group.rotation.y, b = DOORS[1].group.rotation.y;
    if(Math.abs(a) < 1.0 || Math.abs(b) < 1.0) throw new Error('leaves did not swing');
    if(Math.sign(a) === Math.sign(b)) throw new Error('both leaves swung the same way');
    return 'swing '+(a*57.3).toFixed(0)+'deg / '+(b*57.3).toFixed(0)+'deg';
  });
  P('you cannot walk off the back of the dressing rooms', ()=>{
    Player.mode='walk'; Player.pos.set(0, 0, BOH.z2+1.5); keys['KeyS']=true; Player.yaw=0;
    for(let i=0;i<200;i++) updatePlayer(0.016);
    keys['KeyS']=false;
    if(Player.pos.z < BOH.z2 + 0.5) throw new Error('escaped at z='+Player.pos.z.toFixed(1));
    return 'held at z='+Player.pos.z.toFixed(1);
  });
  /* ---- the Palace is deeper than the box (owner, 2026-08-10) ----
     The Beetlejuice house is a wagon that tracks upstage and parks behind the
     last lineset with the backdrop on it.  The deck used to end at D.backWall,
     which left it standing in the brick.  These four pin the change AND its
     scoping, because a deeper Palace is a deliberate break of "every stage is
     the same box" and the danger is that it leaks into the Arc. */
  P('the Palace deck runs unbroken from the box to its own brick', ()=>{
    goToView(3);
    /* the old wall line is 17m; walk the floor from just inside it to just
       short of the new brick and there must be deck the whole way */
    for(let z = D.backWall + 0.5; z > PAL_BACK + 0.4; z -= 0.75){
      const y = groundAt(0, z, 3);
      if(y === null || y === undefined || Math.abs(y) > 0.05)
        throw new Error('no deck at z='+z.toFixed(1)+' (got '+y+')');
    }
    return 'deck continuous from '+D.backWall+' back to '+PAL_BACK.toFixed(1);
  });

  P('there is room to park the house behind the last lineset', ()=>{
    const last = FLY[FLY.length - 1];
    showLoad('beetlejuice');
    /* how deep is the set that has to fit back there */
    const sc = sceneFind('interior');
    const b = new THREE.Box3();
    sc.group.traverse(o=>{ if(o.isMesh){ o.updateMatrixWorld(true); b.expandByObject(o); } });
    const deep = b.max.z - b.min.z;
    const room = last.z - PAL_BACK;          // stage upstage of the last line
    /* it has to clear the lineset in front of it and the brick behind it */
    const need = deep + 0.6 + 1.5;
    if(room < need)
      throw new Error(room.toFixed(2)+'m behind the last lineset for a '+deep.toFixed(2)+
                      'm set needing '+need.toFixed(2));
    return room.toFixed(2)+'m of stage upstage of line '+(FLY.indexOf(last)+1)+
           ' for a '+deep.toFixed(2)+'m set';
  });

  P('the warehouse went back with the wall, not into the stage', ()=>{
    const sh = SHEDS.palace;
    if(!sh) throw new Error('no palace shed');
    /* the roller leaf legitimately hangs IN the wall plane — that is what a
       door is — so it is excluded by identity rather than by loosening the
       tolerance until it passes.  Everything else must be behind the brick. */
    const doorG = sh.door && sh.door.group;
    const under = o=>{ let p = o; while(p){ if(p === doorG) return true; p = p.parent; } return false; };
    const b = new THREE.Box3();
    sh.group.traverse(o=>{ if(o.isMesh && !under(o)){ o.updateMatrixWorld(true); b.expandByObject(o); } });
    if(b.max.z > PAL_BACK + 0.05)
      throw new Error('the shed reaches z='+b.max.z.toFixed(2)+', downstage of the brick at '+PAL_BACK);
    /* and it genuinely MOVED rather than merely being trimmed at the front.
       Depth, not position: trimming the front would satisfy any test that only
       looks at where the shed now ENDS, and the shed would quietly lose 4.5m
       of the floor the racks and saws stand on. */
    const deep = b.max.z - b.min.z;
    if(deep < 12)
      throw new Error('the shed is only '+deep.toFixed(1)+'m deep — it was shortened, not moved');
    return 'shed z '+b.min.z.toFixed(1)+' .. '+b.max.z.toFixed(1)+', all of it behind '+PAL_BACK;
  });

  /* the scoping half, and the one that matters most: the deeper Palace must
     not have moved the number every show and both Arc houses are written to */
  P('the BOX is unchanged — the Arc did not get deeper too', ()=>{
    if(D.backWall !== -17) throw new Error('D.backWall moved to '+D.backWall);
    if(D.stageD !== 17) throw new Error('D.stageD moved to '+D.stageD);
    if(PAL_BACK >= D.backWall) throw new Error('PAL_BACK is not upstage of the box');
    /* and the Arc's own deck still stops where the box says, not where the
       Palace's brick now is */
    goToView(11);
    const y = groundAt(ARC.X, D.backWall - 2.0, 3);
    if(y !== null && y !== undefined && Math.abs(y) < 0.05)
      throw new Error('the Arc grew a deck at z='+(D.backWall-2.0)+' — the deepening leaked');
    goToView(3);
    return 'box still '+D.stageD+'m to '+D.backWall+'; the Palace alone runs to '+PAL_BACK.toFixed(1);
  });

  P('the upstage wall is solid', ()=>{
    for(const x of [0, 6, 11.5, -11.5, 18]){
      /* PAL_BACK, not D.backWall: the Palace deck runs 4.5m deeper than the
         stage-coordinate box (p2.txt), so probing the old number now probes
         open stage floor and finds no wall because there is none there. */
      if(!backWallBlocks(x, PAL_BACK-1, PAL_BACK+1))
        throw new Error('you can walk through the back wall at x='+x);
    }
    if(backWallBlocks(0, -4, -3)) throw new Error('it blocks you out on the stage');
    return 'solid the whole way across';
  });
  P('lobby and backstage are their own light sections', ()=>{
    const lob = SECTIONS.find(s=>s.id==='lobby'), boh = SECTIONS.find(s=>s.id==='boh');
    if(!lob || !boh) throw new Error('sections missing');
    setSection(lob, 0, 0); setSection(boh, 0, 0);
    updateRig(0.1, 1);
    const on = FOH.lamps.reduce((a,l)=>a+l.intensity,0) + BOH.light.intensity;
    if(on > 0.001) throw new Error('still lit');
    setSection(lob, 1, 0); updateRig(0.1,1);
    if(FOH.lamps[0].intensity < 0.5) throw new Error('did not come back');
    return 'both dim to nothing and back';
  });
  P('views 7, 8 and 9 land where they say', ()=>{
    goToView(7); const a = Player.pos.z;
    if(a < D.houseBack) throw new Error('view 7 not in the lobby');
    goToView(8);
    if(Player.pos.x > DOCK.inner) throw new Error('view 8 is not out on the dock');
    goToView(9);
    if(Player.pos.x > -D.procW/2) throw new Error('view 9 is not in the stage right wing');
    goToView(1);
    return 'foyer z='+a.toFixed(0)+', dock x='+DOCK.inner.toFixed(0)+', stage right wing';
  });
  console.log('--- the rear wall reads clean ---');
  P('nothing is laid over the door openings', ()=>{
    setAllDoors(false); for(let i=0;i<80;i++) updateDoors(0.05);
    scene.updateMatrixWorld(true);
    const R = new THREE.Raycaster();
    const bad = [];
    DOORWAYS.forEach(dw=>{
      for(let gx=-4; gx<=4; gx++) for(let gy=1; gy<=5; gy++){
        const px = dw.x + (gx/4)*(dw.halfW-0.15);
        const py = dw.y + (gy/6)*dw.h;
        R.set(new THREE.Vector3(px, py, dw.z - 1.5), new THREE.Vector3(0,0,1)); R.far = 6;
        const hs = R.intersectObject(world, true);
        if(!hs.length){ bad.push([+px.toFixed(2), +py.toFixed(2), 'GAP']); continue; }
        let o = hs[0].object, isLeaf = false;
        while(o){ if(DOORS.some(d=>d.group===o)) { isLeaf = true; break; } o = o.parent; }
        if(!isLeaf) bad.push([+px.toFixed(2), +py.toFixed(2), 'occluded @'+hs[0].distance.toFixed(2)]);
      }
    });
    if(bad.length) throw new Error('occluded: '+JSON.stringify(bad));
    return 'all '+DOORWAYS.length+' doorways sealed, nothing laid over them';
  });
  P('with the doors open you see straight into the foyer', ()=>{
    setAllDoors(true); for(let i=0;i<80;i++) updateDoors(0.05);
    scene.updateMatrixWorld(true);
    const R = new THREE.Raycaster();
    const dw = DOORWAYS[1];
    R.set(new THREE.Vector3(dw.x+0.5, dw.y+1.6, dw.z-1.5), new THREE.Vector3(0,0,1)); R.far = 40;
    const hs = R.intersectObject(world, true);
    if(!hs.length) throw new Error('no hit at all');
    if(hs[0].distance < 5) throw new Error('something is still in the doorway at '+hs[0].distance.toFixed(1)+'m');
    return 'clear view '+hs[0].distance.toFixed(1)+'m into the lobby';
  });
  P('the old side-wall exit doors are gone', ()=>{
    let n = 0;
    world.traverse(o=>{ if(o.isMesh && o.material === M.exit) n++; });
    // only the backstage crossover + stage door signs should remain
    if(n > 3) throw new Error(n+' exit signs left');
    return n+' exit signs, all backstage';
  });
  P('the wainscot follows the rake', ()=>{
    let strip = null;
    world.traverse(o=>{ if(o.isInstancedMesh && o.geometry.parameters &&
      Math.abs(o.geometry.parameters.height - 1.36) < 0.001 &&
      Math.abs(o.geometry.parameters.width - 0.16) < 0.001) strip = o; });
    if(!strip) throw new Error('no wainscot found');
    const m = new THREE.Matrix4(), a = new THREE.Vector3(), b = new THREE.Vector3();
    strip.getMatrixAt(0, m); a.setFromMatrixPosition(m);
    strip.getMatrixAt(strip.count-2, m); b.setFromMatrixPosition(m);
    const rise = b.y - a.y;
    if(rise < 3.5) throw new Error('wainscot is not climbing with the floor (rise '+rise.toFixed(2)+')');
    return 'climbs '+rise.toFixed(1)+' m front to back';
  });
  console.log('--- doors you can actually walk through ---');
  P('there is floor in every doorway', ()=>{
    const bad = [];
    DOORWAYS.forEach(dw=>{
      const g = groundAt(dw.x, dw.z + 0.5, dw.y + 1.0);
      if(g === null) bad.push([dw.x, dw.z, 'no floor']);
      else if(Math.abs(g - dw.y) > 0.35) bad.push([dw.x, +g.toFixed(2), 'wrong level, want '+dw.y.toFixed(2)]);
    });
    if(bad.length) throw new Error(JSON.stringify(bad));
    return 'all '+DOORWAYS.length+' thresholds have a floor at the right level';
  });
  P('you can WALK from the stalls into the foyer', ()=>{
    setAllDoors(true); for(let i=0;i<80;i++) updateDoors(0.05);
    Player.mode='walk'; Player.yaw = Math.PI;          // face the back of the house
    Player.pos.set(0, houseFloorY(27), 27);
    keys['KeyW'] = true;
    for(let i=0;i<400;i++) updatePlayer(0.016);
    keys['KeyW'] = false;
    if(Player.pos.z < FOH.z0 + 0.5)
      throw new Error('stuck at z='+Player.pos.z.toFixed(2));
    return 'walked through to z='+Player.pos.z.toFixed(1)+' in the foyer';
  });
  P('and the shut doors stop you', ()=>{
    setAllDoors(false); for(let i=0;i<80;i++) updateDoors(0.05);
    Player.pos.set(0, houseFloorY(27), 27); Player.yaw = Math.PI;
    keys['KeyW'] = true;
    for(let i=0;i<400;i++) updatePlayer(0.016);
    keys['KeyW'] = false;
    if(Player.pos.z > FOH.z0 - 0.4) throw new Error('walked through a shut door to z='+Player.pos.z.toFixed(2));
    setAllDoors(true); for(let i=0;i<80;i++) updateDoors(0.05);
    return 'held at z='+Player.pos.z.toFixed(1);
  });
  P('the big door is the only way into the dock, and it works', ()=>{
    const big = DOCKDOORS.find(d=>d.big);
    if(!big) throw new Error('there is no big door in the stage-house wall');
    if(big.halfW < 4) throw new Error('the big door is only '+(big.halfW*2).toFixed(1)+'m wide');
    if(big.H < 6) throw new Error('the big door is only '+big.H+'m tall');
    const walk = ()=>{
      Player.mode = 'walk';
      Player.pos.set(DOCK.inner + 6, 0, big.z);
      Player.yaw = Math.PI/2;                     // face stage right, towards -x
      keys['KeyW'] = true;
      for(let i=0;i<420;i++) updatePlayer(0.016);
      keys['KeyW'] = false;
      return Player.pos.x;
    };
    big.target = 0; for(let i=0;i<300;i++) updateDockDoors(0.05);
    const shut = walk();
    if(shut < big.plane) throw new Error('walked through a shut big door, x='+shut.toFixed(2));
    big.target = 1; for(let i=0;i<300;i++) updateDockDoors(0.05);
    const open = walk();
    if(open > big.plane - 1.5) throw new Error('could not get in with it up, x='+open.toFixed(2));
    if(Math.abs(Player.pos.y) > 0.2)
      throw new Error('the dock is not flush with the stage, y='+Player.pos.y.toFixed(2));
    big.target = 0; for(let i=0;i<300;i++) updateDockDoors(0.05);
    return (big.halfW*2).toFixed(1)+'m x '+big.H+'m; stopped at '+shut.toFixed(1)+
           ' shut, walked to '+open.toFixed(1)+' with it up';
  });
  P('the wall either side of the big door still stops you', ()=>{
    const big = DOCKDOORS.find(d=>d.big);
    big.target = 1; for(let i=0;i<300;i++) updateDockDoors(0.05);
    // aim at the wall well upstage of the opening
    Player.pos.set(DOCK.inner + 6, 0, DOCK.z1 + 0.5); Player.yaw = Math.PI/2;
    keys['KeyW'] = true;
    for(let i=0;i<400;i++) updatePlayer(0.016);
    keys['KeyW'] = false;
    if(Player.pos.x < DOCK.inner) throw new Error('walked through the wall at z='+DOCK.z1);
    big.target = 0; for(let i=0;i<300;i++) updateDockDoors(0.05);
    return 'solid where it should be';
  });
  P('a shut roller door stops you, an open one does not', ()=>{
    setAllDockDoors(false);
    for(let i=0;i<200;i++) updateDockDoors(0.05);
    const start = DOCK.outer - DOCK.dir*2.5;      // inside the bay, facing the street door
    Player.pos.set(start, 0, DOCKDOORS[0].z); Player.yaw = Math.PI/2;
    keys['KeyW'] = true;
    for(let i=0;i<300;i++) updatePlayer(0.016);
    keys['KeyW'] = false;
    const stopped = Player.pos.x;
    if(stopped < DOCK.outer) throw new Error('walked out through a shut shutter, x='+stopped.toFixed(1));
    setAllDockDoors(true);
    for(let i=0;i<200;i++) updateDockDoors(0.05);
    Player.pos.set(start, 0, DOCKDOORS[0].z);
    keys['KeyW'] = true;
    for(let i=0;i<300;i++) updatePlayer(0.016);
    keys['KeyW'] = false;
    if(Player.pos.x > DOCK.outer - 0.5)
      throw new Error('could not get out with the door up, x='+Player.pos.x.toFixed(1));
    setAllDockDoors(false);
    for(let i=0;i<200;i++) updateDockDoors(0.05);
    return 'stopped at '+stopped.toFixed(1)+' shut, out to the road when up';
  });
  P('the roller doors roll', ()=>{
    if(DOCKDOORS.length !== 3) throw new Error(DOCKDOORS.length+' dock doors, want two street and one big');
    if(DOCKDOORS.filter(x=>x.big).length !== 1) throw new Error('not exactly one big door');
    const d = DOCKDOORS[0];
    setAllDockDoors(false); for(let i=0;i<200;i++) updateDockDoors(0.05);
    const down = d.slats.map(s2=>s2.position.y);
    toggleDockDoor(d);
    if(d.target !== 1) throw new Error('the control did not call for up');
    for(let i=0;i<200;i++) updateDockDoors(0.05);
    if(d.open < 0.99) throw new Error('it never got up, at '+d.open.toFixed(2));
    const up = d.slats.map(s2=>s2.position.y);
    if(up[0] <= down[0]) throw new Error('the bottom slat did not lift');
    const rolled = d.slats.filter(s2=>s2.scale.y < 0.2).length;
    if(rolled < d.N - 2) throw new Error('only '+rolled+' slats rolled into the drum');
    toggleDockDoor(d);
    for(let i=0;i<200;i++) updateDockDoors(0.05);
    if(d.open > 0.01) throw new Error('it did not come back down');
    if(Math.abs(d.slats[0].position.y - down[0]) > 0.01) throw new Error('the slats did not return');
    return d.N+' slats, up and rolled away, then back down';
  });
  P('the dock door buttons work', ()=>{
    document.querySelector('#dockOpen').click();
    if(DOCKDOORS.some(d=>d.target !== 1)) throw new Error('UP did not call both');
    document.querySelector('#dockShut').click();
    if(DOCKDOORS.some(d=>d.target !== 0)) throw new Error('DOWN did not call both');
    for(let i=0;i<200;i++) updateDockDoors(0.05);
    return 'both doors answer the console';
  });
  console.log('--- the workbench grid ---');
  P('the bench opens on the build grid', ()=>{
    openBench();
    if(!BENCH.open) throw new Error('did not open');
    if(BENCH.tab !== 'build') throw new Error('opened on '+BENCH.tab);
    if(!ED.ready) throw new Error('editor never initialised');
    return 'grid is '+ED.nx+' x '+ED.ny+' x '+ED.nz+' at '+ED.cell+' m';
  });
  P('the grid gets its own canvas inside the panel', ()=>{
    const view = document.querySelector('#buildView');
    if(!ED.renderer) throw new Error('no renderer for the editor');
    const cvs2 = view.querySelectorAll('canvas');
    if(cvs2.length !== 1) throw new Error(cvs2.length+' canvases in the viewport');
    if(cvs2[0] !== ED.renderer.domElement) throw new Error('wrong canvas parented');
    if(cvs2[0].style.width !== '100%') throw new Error('canvas not filling the panel');
    return 'own canvas, own renderer';
  });
  P('the editor renders when the panel has a size', ()=>{
    const view = document.querySelector('#buildView');
    Object.defineProperty(view, 'clientWidth',  {value:900, configurable:true});
    Object.defineProperty(view, 'clientHeight', {value:520, configurable:true});
    ED.renderer.renderCount = 0;
    edRender(); edRender();
    if(!ED.renderer.renderCount) throw new Error('never drew');
    if(Math.abs(ED.camera.aspect - 900/520) > 0.01) throw new Error('aspect not set from the panel');
    return 'drew at 900x520, aspect '+ED.camera.aspect.toFixed(2);
  });
  P('the theatre is not drawn behind the bench', ()=>{
    renderer.renderCount = 0;
    openBench('build');
    for(let i=0;i<10;i++){ const cb = window.__raf; window.__raf = null; if(cb) cb(Date.now()+i*16); }
    const behind = renderer.renderCount;
    closeBench();
    for(let i=0;i<10;i++){ const cb = window.__raf; window.__raf = null; if(cb) cb(Date.now()+i*16); }
    if(behind !== 0) throw new Error('still drawing the theatre '+behind+' times');
    if(renderer.renderCount === 0) throw new Error('theatre never came back');
    return 'skipped while open, back on close';
  });
  P('all eight shapes have geometry and an icon', ()=>{
    ED_SHAPES.forEach(sh=>{
      if(!ED.geo[sh]) throw new Error('no geometry for '+sh);
      if(!ED_ICONS[sh]) throw new Error('no icon for '+sh);
    });
    return ED_SHAPES.join(', ');
  });
  P('place a block on the plate', ()=>{
    edClear();
    if(!edPlace(0,0,0,'block','#c2a06a','paint',0)) throw new Error('would not place');
    if(ED.blocks.size !== 1) throw new Error('not in the map');
    return '1 block';
  });
  P('stack on top of a block by its face', ()=>{
    edPlace(0,1,0,'slab','#7d1420','paint',0);
    if(!ED.blocks.has('0,1,0')) throw new Error('nothing above');
    const m = ED.blocks.get('0,1,0').mesh;
    if(Math.abs(m.position.y - (1*ED.cell + ED.cell/2)) > 0.001) throw new Error('wrong height');
    return 'two high';
  });
  P('remove takes it away again', ()=>{
    if(!edRemove(0,1,0)) throw new Error('remove failed');
    if(ED.blocks.has('0,1,0')) throw new Error('still there');
    return ED.blocks.size+' left';
  });
  P('the grid refuses anything off the plate', ()=>{
    if(edPlace(99,0,0,'block','#fff','paint',0)) throw new Error('placed off the edge');
    if(edPlace(0,-1,0,'block','#fff','paint',0)) throw new Error('placed below the plate');
    if(edPlace(0,ED.ny+2,0,'block','#fff','paint',0)) throw new Error('placed above the ceiling');
    return 'bounds hold';
  });
  P('mirror places both sides at once', ()=>{
    edClear(); ED.mirror = true; ED.shape = 'wedge'; ED.colour = '#2f6bff';
    edAct({x:3,y:0,z:1}, 'place');
    if(ED.blocks.size !== 2) throw new Error('got '+ED.blocks.size+' blocks');
    if(!ED.blocks.has('-3,0,1')) throw new Error('no mirrored twin');
    ED.mirror = false;
    return 'placed at +3 and -3';
  });
  P('every shape places cleanly', ()=>{
    edClear();
    ED_SHAPES.forEach((sh,i)=>{ ED.shape = sh; edAct({x:i-4, y:0, z:0}, 'place'); });
    if(ED.blocks.size !== ED_SHAPES.length) throw new Error('only '+ED.blocks.size);
    return ED.blocks.size+' shapes down';
  });
  P('rotation is applied to the mesh', ()=>{
    edClear(); ED.shape='wedge'; ED.rot = 1;
    edAct({x:0,y:0,z:0}, 'place');
    const m = ED.blocks.get('0,0,0').mesh;
    if(Math.abs(m.rotation.y - Math.PI/2) > 0.001) throw new Error('not rotated');
    ED.rot = 0;
    return '90 degrees';
  });
  P('the paint tool recolours a placed block', ()=>{
    const before = ED.blocks.get('0,0,0').colour;
    ED.colour = '#e08a2a'; ED.finish = 'brick';
    edAct({x:0,y:0,z:0}, 'paint');
    const b = ED.blocks.get('0,0,0');
    if(b.colour === before) throw new Error('colour did not change');
    if(b.mesh.material.map !== TX.brick) throw new Error('finish did not change');
    ED.finish = 'paint';
    return 'repainted in brick';
  });
  P('materials are cached, not rebuilt per block', ()=>{
    edClear();
    for(let i=0;i<12;i++) edPlace(i-6,0,3,'block','#7d1420','paint',0);
    const mats = new Set();
    ED.blocks.forEach(b=>mats.add(b.mesh.material));
    if(mats.size !== 1) throw new Error(mats.size+' materials for one colour');
    return '12 blocks, 1 material';
  });
  P('layer and camera controls respond', ()=>{
    benchKey('e'); benchKey('e');
    if(ED.layer !== 2) throw new Error('layer is '+ED.layer);
    benchKey('q');
    if(ED.layer !== 1) throw new Error('layer did not come back');
    benchKey('r'); if(ED.rot !== 1) throw new Error('R did not rotate');
    benchKey('m'); if(!ED.mirror) throw new Error('M did not mirror');
    benchKey('p'); if(!ED.paintTool) throw new Error('P did not switch tool');
    benchKey('m'); benchKey('p'); ED.rot = 0; ED.layer = 0;
    return 'R, M, P, Q, E';
  });
  P('send the build to the stage', ()=>{
    edClear();
    for(let x=-3;x<=3;x++) for(let z=-1;z<=1;z++) edPlace(x,0,z,'block','#8a6a44','timber',0);
    for(let x=-3;x<=3;x++) edPlace(x,1,-1,'panel','#7d1420','paint',0);
    const n = ED.blocks.size, before = SET.length;
    if(!edSend()) throw new Error('send failed');
    if(SET.length !== before+1) throw new Error('not on the deck');
    const piece = SET[SET.length-1];
    if(piece.group.children.length !== n) throw new Error('lost blocks in transit');
    return n+' blocks delivered as one piece';
  });
  P('the delivered piece can be dragged and struck like any scenery', ()=>{
    const piece = SET[SET.length-1];
    piece.group.position.x = 2; piece.rot = 0.3; piece.group.rotation.y = 0.3;
    const before = SET.length;
    strikePiece(piece);
    if(SET.length !== before-1) throw new Error('would not strike');
    return 'moves and strikes';
  });
  P('clear empties the plate', ()=>{
    edClear();
    if(ED.blocks.size) throw new Error('still '+ED.blocks.size);
    return 'empty';
  });
  P('cloth and paint still work alongside', ()=>{
    const c = shopNewCloth(1);
    BENCH.paintOn = c;
    const v0 = c.tex.version;
    benchWash('sky'); benchPaintAt(400, 200);
    if(c.tex.version <= v0) throw new Error('cloth would not take paint');
    const before = Object.keys(GOODS).length;
    shopDeliverCloth(0);
    if(Object.keys(GOODS).length !== before+1) throw new Error('cloth did not reach the rail');
    return 'cut, painted, hung';
  });
  P('every tab still renders', ()=>{
    ['build','paint','stock'].forEach(t=>{
      benchTab(t);
      if(!document.querySelector('#b-'+t).classList.contains('on')) throw new Error(t+' did not show');
    });
    benchTab('build');
    return 'three benches';
  });
  P('the workshop is a menu, not a room', ()=>{
    // the old workshop is gone: nothing in its group, and no floor beyond the
    // warehouse shed's rear wall (the warehouse PR put a real floor at
    // z -30.2..-17.7, so probe upstage of that)
    if(shopGroup.children.length)
      throw new Error(shopGroup.children.length+' bits of the old shed are still there');
    for(const z of [D.backWall - 24, D.backWall - 34])
      if(groundAt(0, z, 2) !== null) throw new Error('there is still a floor at z='+z);
    // but the bench still opens, from the console and from the keyboard
    ['build','paint','stock'].forEach(id=>{
      openBench(id);
      if(!BENCH.open || BENCH.tab !== id) throw new Error(id+' would not open');
    });
    closeBench();
    document.querySelector('#openBench').click();
    if(!BENCH.open) throw new Error('the OPEN THE BENCH button does nothing');
    closeBench();
    return 'shed gone, bench opens on all three tabs';
  });
  P('the only stations left are the dock doors and the warehouse door', ()=>{
    const seen = [];
    world.traverse(o=>{ if(o.userData && o.userData.station) seen.push(o.userData.station.id); });
    if(!seen.length) throw new Error('no stations at all');
    // shedP is the warehouse roller-door control (the warehouse PR)
    if(seen.some(id=>id.indexOf('dock') !== 0 && id !== 'shedP'))
      throw new Error('a bench station survived: '+
        seen.filter(id=>id.indexOf('dock')!==0 && id !== 'shedP').join(', '));
    if(seen.indexOf('shedP') === -1) throw new Error('the warehouse door has no station');
    const wasTarget = SHEDS.palace.door.target;
    useStation({id:'shedP'});
    if(SHEDS.palace.door.target === wasTarget)
      throw new Error('the warehouse station did not work the door');
    useStation({id:'shedP'});
    useStation({id:'dock1'});
    if(DOCKDOORS[0].target !== 1) throw new Error('pressing the control did not open it');
    useStation({id:'dock1'});
    for(let i=0;i<200;i++) updateDockDoors(0.05);
    return seen.join(', ');
  });
  P('the ghost light is gone', ()=>{
    if(typeof ghostLight !== 'undefined') throw new Error('still defined');
    scene.updateMatrixWorld(true);
    const wp = new THREE.Vector3();
    let n = 0, where = [];
    world.traverse(o=>{
      if(!o.isPointLight) return;
      let p = o, inFly = false;
      while(p){ if(p === flyGroup) inFly = true; p = p.parent; }
      if(inFly) return;                       // chandeliers hung on a lineset are fine
      o.getWorldPosition(wp);
      if(wp.y < 3 && wp.z > D.backWall && wp.z < D.apron + D.thrust){
        n++; where.push([+wp.x.toFixed(1), +wp.y.toFixed(1), +wp.z.toFixed(1)]);
      }
    });
    if(n) throw new Error(n+' stray lights standing on the deck: '+JSON.stringify(where));
    return 'struck';
  });
  P('the build plate is the stage, curve and all', ()=>{
    openBench('build');
    // corners of the stage rectangle are in; beyond the bow is out
    const c = ED.cell;
    const midFront = Math.floor((D.apron + D.thrust - 0.3)/c);
    if(!edInBounds(0, 0, midFront)) throw new Error('centre of the bow is not on the plate');
    const sideFront = Math.floor((D.apron + 0.1)/c);
    const farX = Math.floor((D.stageW/2 - 0.5)/c);
    if(edInBounds(farX, 0, midFront))
      throw new Error('the corner beyond the bow is on the plate');
    if(!edInBounds(farX, 0, 0)) throw new Error('the full stage width is not usable');
    if(edInBounds(0, 0, Math.floor((D.backWall - 1)/c))) throw new Error('past the back wall');
    return 'bounded by z = apron + thrust(1 - (x/halfW)^2)';
  });
  P('the plate outline matches the stage front', ()=>{
    const at = x => stageFrontZ(x);
    if(Math.abs(at(0) - (D.apron + D.thrust)) > 0.001) throw new Error('centre wrong');
    if(Math.abs(at(D.stageW/2) - D.apron) > 0.001) throw new Error('edge wrong');
    if(Math.abs(at(-D.stageW/2) - D.apron) > 0.001) throw new Error('edge wrong');
    return 'centre '+at(0).toFixed(2)+' m, edges '+at(D.stageW/2).toFixed(2)+' m';
  });
  P('a build lands at the coordinates you built it at', ()=>{
    edClear();
    edPlace(6, 0, -12, 'block', '#c8412a', 'paint', 0);
    edPlace(6, 1, -12, 'block', '#c8412a', 'paint', 0);
    edSend();
    const piece = SET[SET.length-1];
    const m = piece.group.children[0];
    if(Math.abs(m.position.x - 6*ED.cell) > 0.001) throw new Error('x drifted');
    if(Math.abs(m.position.z - (-12*ED.cell)) > 0.001) throw new Error('z drifted');
    if(piece.group.position.length() > 0.001) throw new Error('group was offset');
    strikePiece(piece);
    return 'landed at x='+m.position.x.toFixed(2)+' z='+m.position.z.toFixed(2);
  });
  P('dragging places a whole run at once', ()=>{
    edClear();
    ED.drag = 'place'; ED.touched.clear(); ED.shape = 'block';
    for(let i=-5;i<=5;i++){
      const k = i+',0,-10';
      if(ED.touched.has(k)) continue;
      ED.touched.add(k);
      edAct({x:i, y:0, z:-10}, 'place');
    }
    ED.drag = null;
    if(ED.blocks.size !== 11) throw new Error('laid '+ED.blocks.size+' of 11');
    return '11 blocks in one drag';
  });
  P('a drag never doubles up on the same cell', ()=>{
    const before = ED.blocks.size;
    ED.drag = 'place'; ED.touched.clear();
    const k = '0,0,-10';
    ED.touched.add(k); edAct({x:0,y:0,z:-10}, 'place');
    if(ED.touched.has(k) && ED.blocks.size !== before) throw new Error('placed twice');
    ED.drag = null;
    return 'deduped';
  });
  P('dragging with the right button clears a run', ()=>{
    ED.drag = 'remove'; ED.touched.clear();
    for(let i=-5;i<=5;i++) edAct({x:i, y:0, z:-10}, 'remove');
    ED.drag = null;
    if(ED.blocks.size) throw new Error(ED.blocks.size+' left');
    return 'run cleared';
  });
  P('the CUT tool punches a real hole in the cloth', ()=>{
    const c = shopNewCloth(1);
    BENCH.paintOn = c;
    const v0 = c.tex.version;
    BENCH.tool = 'cut'; BENCH.size = 60;
    benchPaintAt(400, 280); benchPaintAt(500, 300);
    if(c.tex.version <= v0) throw new Error('nothing changed');
    BENCH.tool = 'brush';
    return 'cut with destination-out';
  });
  P('a cut cloth hangs see-through on the rail', ()=>{
    const before = Object.keys(GOODS).length;
    shopDeliverCloth(SHOP.cloth.length-1);
    const keys2 = Object.keys(GOODS);
    if(keys2.length !== before+1) throw new Error('did not reach the rail');
    const key = keys2[keys2.length-1];
    hangGoods(FLY[4], key);
    let mat = null;
    FLY[4].goods.traverse(o=>{ if(o.isMesh && o.material.map) mat = o.material; });
    if(!mat) throw new Error('no cloth mesh');
    if(!mat.transparent || !(mat.alphaTest > 0)) throw new Error('holes would not show');
    return 'transparent with alphaTest '+mat.alphaTest;
  });
  console.log('--- joints, drag preview, flown builds ---');
  P('the wings are clear of clutter', ()=>{
    let n = 0;
    world.traverse(o=>{
      if(!o.isMesh) return;
      const p = o.geometry && o.geometry.parameters;
      if(p && Math.abs(p.width - 3.4) < 0.01 && Math.abs(p.depth - 1.0) < 0.01) n++;   // prop tables
      if(p && Math.abs(p.width - 0.12) < 0.001 && Math.abs(p.height - 4.2) < 0.01) n++; // rack posts
    });
    if(n) throw new Error(n+' bits of clutter left in the wings');
    return 'clear';
  });
  P('the four joint blocks exist', ()=>{
    openBench('build');
    ['pivot','motor','slider','slidepow'].forEach(k=>{
      if(!ED_JOINTS[k]) throw new Error('no joint spec for '+k);
      if(!ED.geo[k]) throw new Error('no geometry for '+k);
      if(!ED_ICONS[k]) throw new Error('no icon for '+k);
    });
    if(ED_JOINTS.pivot.powered) throw new Error('a pivot should be passive');
    if(!ED_JOINTS.motor.powered) throw new Error('a motor should be powered');
    if(ED_JOINTS.slider.powered) throw new Error('a slider should be passive');
    if(!ED_JOINTS.slidepow.powered) throw new Error('a powered slider should be powered');
    return 'pivot, motor, slider, powered slider';
  });
  P('a drag spans a box and previews before it commits', ()=>{
    edClear(); edClearPreview();
    const a = {x:-2, y:0, z:-6}, b = {x:2, y:1, z:-4};
    const list = edSpan(a, b);
    if(list.length !== 5*2*3) throw new Error('span is '+list.length+', expected 30');
    ED.shape = 'block'; ED.mirror = false;
    const shown = edShowPreview(list, 'place');
    if(shown !== 30) throw new Error('preview shows '+shown);
    if(ED.blocks.size !== 0) throw new Error('the preview placed blocks early');
    // now commit, the way mouseup does
    let n = 0; for(const c of list) if(edAct(c, 'place')) n++;
    edClearPreview();
    if(n !== 30 || ED.blocks.size !== 30) throw new Error('committed '+n);
    if(ED.preview.count !== 0) throw new Error('preview not cleared');
    return '30 previewed, then 30 placed on release';
  });
  P('cancelling a drag places nothing', ()=>{
    edClear();
    edShowPreview(edSpan({x:0,y:0,z:-6},{x:4,y:0,z:-6}), 'place');
    ED.anchor = {x:0,y:0,z:-6};
    benchKey('escape');
    if(ED.anchor) throw new Error('anchor not dropped');
    if(ED.blocks.size) throw new Error('blocks landed anyway');
    return 'nothing placed';
  });
  P('a build splits into a base and a moving assembly', ()=>{
    edClear();
    // a plinth on the deck, a motor on top, a platform on the motor
    edPlace(0,0,-8,'block','#8a6a44','timber',0);
    edPlace(0,1,-8,'motor','#ffb340','paint',0);
    for(let x=-2;x<=2;x++) for(let z=-10;z<=-6;z++) edPlace(x,2,z,'slab','#7d1420','paint',0);
    const asm = edAssemble();
    if(asm.parts.length !== 1) throw new Error(asm.parts.length+' moving parts');
    if(asm.base.length !== 1) throw new Error('base is '+asm.base.length+' blocks');
    if(asm.parts[0].members.length !== 25) throw new Error('the revolve carries '+asm.parts[0].members.length);
    return 'base 1, revolve 25 blocks on a motor';
  });
  P('sending it registers a powered machine', ()=>{
    MACHINES.length = 0;
    edSend();
    if(MACHINES.length !== 1) throw new Error(MACHINES.length+' machines');
    const m = MACHINES[0];
    if(!m.powered || m.kind !== 'turn') throw new Error('wrong kind');
    m.target = 1; m.speed = 10;
    for(let i=0;i<40;i++) updateMachines(0.05);
    if(Math.abs(m.group.rotation.y - Math.PI*2) > 0.01) throw new Error('did not turn, at '+m.group.rotation.y);
    return 'motor drove the revolve a full turn';
  });
  P('a passive joint refuses the fader and takes a push', ()=>{
    edClear(); MACHINES.length = 0;
    edPlace(0,0,-8,'block','#8a6a44','timber',0);
    edPlace(0,1,-8,'slider','#7f8794','paint',0);
    edPlace(0,2,-8,'block','#7d1420','paint',0);
    edSend();
    const m = MACHINES[MACHINES.length-1];
    if(m.powered) throw new Error('a plain slider should be passive');
    m.target = 1;
    for(let i=0;i<20;i++) updateMachines(0.05);
    if(Math.abs(m.value) > 0.001) throw new Error('a passive part moved on its own');
    for(let i=0;i<50;i++) nudgeMachine(m, 0.02);
    updateMachines(0.05);
    if(m.value < 0.9) throw new Error('pushing did not move it, at '+m.value);
    if(Math.abs(m.group.position.x - (m.home.x + MACH_TRAVEL)) > 0.01)
      throw new Error('slider did not travel');
    return 'pushed to '+Math.round(m.value*100)+'% by hand';
  });
  P('a slider follows the axis the joint faces', ()=>{
    const m = MACHINES[MACHINES.length-1];
    m.rot = 1;
    if(machineAxis(m) !== 'z') throw new Error('rotating the joint did not swap the axis');
    m.rot = 0;
    return 'x when square, z when turned';
  });
  P('you can fly a build onto a lineset', ()=>{
    edClear(); MACHINES.length = 0;
    for(let x=-3;x<=3;x++) for(let y=0;y<=2;y++) edPlace(x,y,-6,'panel','#1d3f6e','paint',0);
    const n = ED.blocks.size;
    const before = Object.keys(GOODS).length;
    edSend({lineset: 6});
    if(Object.keys(GOODS).length !== before+1) throw new Error('no goods made');
    if(!FLY[6].goodsKey.startsWith('build')) throw new Error('not hung, key is '+FLY[6].goodsKey);
    flyIn(FLY[6]);
    for(let i=0;i<400;i++) updateFly(0.05);
    if(Math.abs(FLY[6].pos - TRIMS[FLY[6].goodsKey]) > 0.2) throw new Error('would not fly in');
    return n+' blocks flying on lineset 7 at '+FLY[6].pos.toFixed(1)+' m';
  });
  P('a machine on a flown build still works', ()=>{
    edClear(); MACHINES.length = 0;
    edPlace(0,0,-6,'block','#8a6a44','timber',0);
    edPlace(0,1,-6,'motor','#ffb340','paint',0);
    edPlace(0,2,-6,'block','#7d1420','paint',0);
    edSend({lineset: 7});
    if(!MACHINES.length) throw new Error('no machine registered');
    const m = MACHINES[0];
    if(!m.where.includes('lineset')) throw new Error('machine does not know where it is');
    m.target = 0.5; m.speed = 10;
    for(let i=0;i<40;i++) updateMachines(0.05);
    if(Math.abs(m.group.rotation.y - Math.PI) > 0.01) throw new Error('did not turn in the air');
    return 'a revolve, flying';
  });
  P('striking the scenery takes its machines with it', ()=>{
    edClear(); MACHINES.length = 0;
    edPlace(0,0,-8,'block','#8a6a44','timber',0);
    edPlace(0,1,-8,'pivot','#7f8794','paint',0);
    edPlace(0,2,-8,'block','#7d1420','paint',0);
    edSend();
    if(!MACHINES.length) throw new Error('none registered');
    strikePiece(SET[SET.length-1]);
    if(MACHINES.length) throw new Error(MACHINES.length+' machines left behind');
    return 'cleaned up';
  });
  P('the cloth cutting bench is gone', ()=>{
    if(typeof shopCutCloth !== 'undefined') throw new Error('the shears are still here');
    if(document.querySelector('#b-cloth')) throw new Error('the cloth panel is still in the page');
    if(!document.querySelector('#newBackdrop')) throw new Error('no way to get a backdrop');
    const c = shopNewCloth(2);
    if(!c) throw new Error('could not take a cloth off the shelf');
    return 'backdrops come off the shelf now';
  });
  P('a picture can be dropped onto a cloth', ()=>{
    const c = SHOP.cloth[SHOP.cloth.length-1];
    const g = c.canvas.getContext('2d');
    const v0 = c.tex.version;
    // stand in for the loaded Image the same way the file reader would
    g.drawImage({width:800, height:600}, 100, 40, 800, 600);
    c.tex.needsUpdate = true;
    if(c.tex.version <= v0) throw new Error('the cloth never refreshed');
    if(!document.querySelector('#importPic')) throw new Error('no import control');
    return 'import wired to the cloth canvas';
  });
  console.log('--- performance, sightlines, zoom, send ---');
  P('picking uses a short list, not the whole building', ()=>{
    let all = 0; world.traverse(()=>all++);
    if(INTERACT.length > 40) throw new Error(INTERACT.length+' things in the interact list');
    // the pick list must never contain the world root
    pickAll(castFromCamera());
    if(_pickList.includes(world)) throw new Error('still raycasting the whole world');
    return INTERACT.length+' stations + 4 groups, out of '+all+' objects';
  });
  P('beams are cullable and cheaper', ()=>{
    let culled = 0, segs = 0;
    FIXTURES.forEach(f=>{
      if(f.beam.frustumCulled) culled++;
      const p = f.beam.geometry.parameters;
      if(p) segs = p.radialSegments;
    });
    if(culled !== FIXTURES.length) throw new Error(culled+' of '+FIXTURES.length+' cullable');
    if(segs > 14) throw new Error('beams still '+segs+' segments');
    return FIXTURES.length+' beams, '+segs+' segments each, all cullable';
  });
  P('the editor shows the proscenium and the wings', ()=>{
    openBench('build');
    if(!ED.refs) throw new Error('no reference group');
    if(!ED.refs.children.length) throw new Error('reference group is empty');
    let lines = 0, planes = 0;
    ED.refs.traverse(o=>{ if(o.isLineSegments) lines++; if(o.isMesh) planes++; });
    if(lines < 3) throw new Error('only '+lines+' line sets — want arch, plaster line, back wall');
    if(planes < 4) throw new Error('only '+planes+' shaded pieces — want both wings');
    return lines+' outlines and '+planes+' shaded areas';
  });
  P('the sightline overlay toggles', ()=>{
    const was = ED.refs.visible;
    ED.refs.visible = !was;
    if(ED.refs.visible === was) throw new Error('would not toggle');
    ED.refs.visible = true;
    return 'on and off';
  });
  P('the wheel zooms the editor', ()=>{
    const view = document.querySelector('#buildView');
    ED.dist = 34;
    view.dispatchEvent(new window.WheelEvent('wheel', {deltaY:-100, bubbles:true, cancelable:true}));
    const inn = ED.dist;
    if(!(inn < 34)) throw new Error('wheel up did not zoom in, dist '+inn);
    for(let i=0;i<40;i++) view.dispatchEvent(new window.WheelEvent('wheel', {deltaY:100, bubbles:true, cancelable:true}));
    if(ED.dist > 80.1) throw new Error('zoom ran past its limit');
    for(let i=0;i<80;i++) view.dispatchEvent(new window.WheelEvent('wheel', {deltaY:-100, bubbles:true, cancelable:true}));
    if(ED.dist < 3.9) throw new Error('zoom ran past its near limit');
    ED.dist = 34; edCam();
    return 'zooms and clamps between 4 and 80';
  });
  /* the harness runs faster than a clock can measure, so drive the frame time */
  const edStep = n=>{ for(let i=0;i<n;i++){ ED.lastT = performance.now() - 16; edRender(); } };
  P('WASD walks the view about the plate', ()=>{
    openBench('build'); benchTab('build');
    edHome();
    const p0 = ED.focus.clone();
    keys['KeyW'] = true;
    edStep(40);
    keys['KeyW'] = false;
    if(ED.focus.distanceTo(p0) < 0.5) throw new Error('W moved the view '+ED.focus.distanceTo(p0).toFixed(3)+' m');
    // W must go the way the camera is looking, not backwards
    const look = new THREE.Vector3().subVectors(ED.focus, ED.camera.position).setY(0).normalize();
    const went = new THREE.Vector3().subVectors(ED.focus, p0).setY(0).normalize();
    if(look.dot(went) < 0.9) throw new Error('W did not go forward, dot '+look.dot(went).toFixed(2));
    const p1 = ED.focus.clone();
    keys['KeyD'] = true;
    edStep(40);
    keys['KeyD'] = false;
    const right = new THREE.Vector3().crossVectors(look, new THREE.Vector3(0,1,0)).normalize();
    const side = new THREE.Vector3().subVectors(ED.focus, p1).setY(0).normalize();
    if(right.dot(side) > -0.9 && right.dot(side) < 0.9) throw new Error('D did not strafe cleanly');
    return 'W and D move the view, and W goes where the camera looks';
  });
  P('space and ctrl take the view up and down', ()=>{
    edHome();
    const y0 = ED.focus.y;
    keys['Space'] = true; edStep(30); keys['Space'] = false;
    if(ED.focus.y <= y0) throw new Error('space did not lift the view');
    const up = ED.focus.y;
    keys['ControlLeft'] = true; edStep(60); keys['ControlLeft'] = false;
    if(ED.focus.y >= up) throw new Error('ctrl did not drop the view');
    return 'up to '+up.toFixed(1)+' m and back down';
  });
  P('shift makes it faster', ()=>{
    edHome();
    const a = ED.focus.clone();
    keys['KeyW'] = true; edStep(20); keys['KeyW'] = false;
    const slow = ED.focus.distanceTo(a);
    edHome();
    const b = ED.focus.clone();
    keys['KeyW'] = true; keys['ShiftLeft'] = true;
    edStep(20);
    keys['KeyW'] = false; keys['ShiftLeft'] = false;
    const fast = ED.focus.distanceTo(b);
    if(!(fast > slow*1.5)) throw new Error('shift barely helped: '+slow.toFixed(2)+' vs '+fast.toFixed(2));
    edHome();
    return 'shift is '+(fast/slow).toFixed(1)+'x';
  });
  P('the view cannot be flown off into nothing', ()=>{
    edHome();
    keys['KeyW'] = true; keys['ShiftLeft'] = true;
    edStep(600);
    keys['KeyD'] = true;
    edStep(600);
    keys['KeyW'] = false; keys['KeyD'] = false; keys['ShiftLeft'] = false;
    if(Math.abs(ED.focus.x) > 40.01) throw new Error('ran off sideways to '+ED.focus.x);
    if(ED.focus.y > 22.01 || ED.focus.y < -1.01) throw new Error('ran off vertically to '+ED.focus.y);
    edHome();
    if(Math.abs(ED.focus.x) > 0.001) throw new Error('RECENTRE did not bring it home');
    return 'clamped, and RECENTRE brings it back';
  });
  P('the player stands still while the bench is open', ()=>{
    openBench('build');
    Player.mode = 'walk';
    const was = Player.pos.clone();
    keys['KeyW'] = true;
    for(let i=0;i<60;i++) updatePlayer(0.016);
    keys['KeyW'] = false;
    if(Player.pos.distanceTo(was) > 0.001) throw new Error('the player walked off behind the UI');
    return 'the keyboard belongs to the bench';
  });
  P('held keys do not stick when the bench closes', ()=>{
    keys['KeyW'] = true; keys['ShiftLeft'] = true;
    closeBench();
    if(keys['KeyW'] || keys['ShiftLeft']) throw new Error('a key stayed down');
    openBench('build'); benchTab('build');
    return 'cleared on the way in and out';
  });
  P('the erase tool takes blocks away on a left drag', ()=>{
    openBench('build'); benchTab('build');
    edClear();
    ED.shape='block'; ED.colour='#7d1420'; ED.finish='paint'; ED.rot=0; ED.mirror=false;
    for(let i=0;i<6;i++) edPlace(i, 0, 0, 'block', '#7d1420', 'paint', 0);
    if(ED.blocks.size !== 6) throw new Error('setup failed');
    ED.erase = true; ED.paintTool = false;
    ED.dragMode = ED.erase ? (ED.paintTool ? 'strip' : 'remove') : 'place';
    if(ED.dragMode !== 'remove') throw new Error('erase did not select remove');
    const span = edSpan({x:0,y:0,z:0}, {x:5,y:0,z:0});
    let n = 0; for(const c of span) if(edAct(c, 'remove')) n++;
    if(ED.blocks.size !== 0) throw new Error(ED.blocks.size+' blocks survived the eraser');
    ED.erase = false;
    return 'dragged '+n+' blocks away in one go';
  });
  P('the erase tool strips paint when the paint tool is up', ()=>{
    edClear();
    edPlace(0,0,0,'block','#2f6bff','paint',0);
    edPlace(1,0,0,'block','#2f6bff','paint',0);
    edPlace(2,0,0,'motor','#2f6bff','paint',0);
    ED.erase = true; ED.paintTool = true;
    const mode = ED.erase ? (ED.paintTool ? 'strip' : 'remove') : 'place';
    if(mode !== 'strip') throw new Error('did not choose strip');
    edAct({x:0,y:0,z:0}, 'strip');
    edAct({x:1,y:0,z:0}, 'strip');
    const done = edAct({x:2,y:0,z:0}, 'strip');
    const b = ED.blocks.get(edKey(0,0,0));
    if(b.colour !== ED_BARE.colour || b.finish !== 'timber') throw new Error('paint did not come off');
    if(ED.blocks.size !== 3) throw new Error('stripping deleted a block');
    if(done) throw new Error('it stripped the paint off a motor');
    ED.erase = false; ED.paintTool = false; edClear();
    return 'back to bare timber, and it leaves hardware alone';
  });
  P('the erase button and X key both toggle it', ()=>{
    openBench('build'); benchTab('build');
    const btn = document.querySelector('#bErase');
    if(!btn) throw new Error('no erase button in the build bar');
    ED.erase = false;
    btn.click();
    if(!ED.erase) throw new Error('the button did nothing');
    if(!btn.classList.contains('on')) throw new Error('the button does not light up');
    if(!/ERASING/.test(btn.textContent)) throw new Error('the button does not say what it is doing');
    benchKey('x');
    if(ED.erase) throw new Error('X did not turn it off');
    benchKey('x');
    ED.paintTool = true; renderBuildBar();
    if(!/STRIPPING/.test(btn.textContent)) throw new Error('no strip label with the paint tool up');
    ED.erase = false; ED.paintTool = false; renderBuildBar();
    return 'button, X key and a label that tracks the mode';
  });
  P('picking a shape drops you out of erase', ()=>{
    ED.erase = true; ED.paintTool = true;
    document.querySelector('#shapeRow .shape').click();
    if(ED.erase || ED.paintTool) throw new Error('still erasing after picking a shape');
    return 'back to placing';
  });
  P('the erase preview only lands on blocks that exist', ()=>{
    edClear();
    edPlace(0,0,0,'block','#7d1420','paint',0);
    const n = edShowPreview([{x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0}], 'remove');
    if(n !== 1) throw new Error('previewed '+n+' cells, only one has a block');
    const s = edShowPreview([{x:0,y:0,z:0},{x:9,y:0,z:0}], 'strip');
    if(s !== 1) throw new Error('strip previewed '+s+' cells');
    edClearPreview(); edClear();
    return 'it only marks what is really there';
  });
  P('the cloth eraser rags paint off and patches a cut', ()=>{
    benchTab('paint');
    const c = shopNewCloth(3);
    BENCH.paintOn = c;
    const g = c.canvas.getContext('2d');
    /* the harness canvas has no pixels, so watch what is actually asked of it */
    const seen = [];
    const realStroke = g.stroke.bind(g);
    g.stroke = function(){ seen.push({op:g.globalCompositeOperation, col:g.strokeStyle, w:g.lineWidth}); return realStroke(); };
    BENCH.size = 40;
    const run = (tool)=>{ BENCH.tool = tool; BENCH.last = null;
                          benchPaintAt(600,300); benchPaintAt(640,300); return seen.pop(); };
    BENCH.colour = '#ffffff';
    const brush = run('brush');
    const cut   = run('cut');
    const rag   = run('erase');
    const patch = run('patch');
    g.stroke = realStroke;
    if(brush.op !== 'source-over' || brush.col !== '#ffffff') throw new Error('the brush changed');
    if(cut.op !== 'destination-out') throw new Error('cut no longer punches a hole');
    if(rag.op !== 'source-over') throw new Error('the eraser is punching holes instead of ragging');
    if(rag.col !== c.spec.col) throw new Error('the eraser rags to '+rag.col+', not the bolt colour');
    if(!(rag.w > 40)) throw new Error('the eraser is no wider than the brush');
    if(patch.op !== 'source-over') throw new Error('patch does not lay opaque cloth back down');
    if(patch.col !== c.spec.col) throw new Error('patch does not use the bolt colour');
    if(!document.querySelector('#tErase')) throw new Error('no eraser on the paint bench');
    if(!document.querySelector('#tUnerase')) throw new Error('no patch tool on the paint bench');
    BENCH.tool = 'erase'; markTool();
    if(!document.querySelector('#tErase').classList.contains('on')) throw new Error('the eraser does not light up');
    BENCH.tool = 'brush'; markTool();
    return 'rags back to '+rag.col+' at '+rag.w+'px, and patch refills the alpha';
  });
  P('right-click no longer opens the browser menu', ()=>{
    const view = document.querySelector('#buildView');
    const ev = new window.MouseEvent('contextmenu', {bubbles:true, cancelable:true});
    view.dispatchEvent(ev);
    if(!ev.defaultPrevented) throw new Error('context menu not suppressed');
    return 'suppressed';
  });
  P('the cloth bench has its own send button', ()=>{
    const btn = document.querySelector('#sendCloth');
    if(!btn) throw new Error('no send button on the paint bench');
    benchTab('paint');
    const c = shopNewCloth(2);
    BENCH.paintOn = c;
    const before = Object.keys(GOODS).length;
    btn.click();
    if(Object.keys(GOODS).length !== before+1) throw new Error('the button did not send it');
    if(SHOP.cloth.includes(c)) throw new Error('still in stock afterwards');
    return 'sends the cloth you are painting straight to the rail';
  });
  console.log('--- pitch black ---');
  P('everything off is genuinely black', ()=>{
    RIG.blackout = false;
    FIXTURES.forEach(f=>{ f.level = 0; f.lvlDur = 0; f.lvlTo = 0; });
    HOUSE.house = HOUSE.work = HOUSE.practical = 0;
    // the lobby and the dock stay lit — they must not leak into the house
    HOUSE.lobby = 1; HOUSE.backstage = 1;
    for(let i=0;i<30;i++){ updateFades(0.05); updateRig(0.05, 1); }
    if(ambient.intensity > 0.001) throw new Error('ambient is up at '+ambient.intensity.toFixed(3));
    if(hemi.intensity > 0.001) throw new Error('hemisphere is up at '+hemi.intensity.toFixed(3));
    const bg = scene.background;
    if(bg.r + bg.g + bg.b > 0.006) throw new Error('the background is not black');
    const fog = scene.fog.color;
    if(fog.r + fog.g + fog.b > 0.006) throw new Error('the fog is not black');
    if(LIGHT_POOL.some(l=>l.intensity > 0.001)) throw new Error('a pool light is still on');
    return 'ambient 0, hemi 0, background black, with the lobby and dock full up';
  });
  P('one channel up lifts it again', ()=>{
    setLevel(9, 1, 0);
    for(let i=0;i<20;i++){ updateFades(0.05); updateRig(0.05, 1); }
    if(ambient.intensity < 0.001) throw new Error('the room stayed dead with a lamp on');
    setLevel(9, 0, 0);
    for(let i=0;i<20;i++){ updateFades(0.05); updateRig(0.05, 1); }
    if(ambient.intensity > 0.001) throw new Error('it did not go back to black');
    HOUSE.house = 0.7; HOUSE.lobby = 0.9; HOUSE.backstage = 0.7;
    for(let i=0;i<20;i++) updateRig(0.05, 1);
    return 'black, up, and black again';
  });

  console.log('--- group calls on the rail ---');
  P('the group call rows are built', ()=>{
    const el = document.querySelector('#railGroups');
    if(!el) throw new Error('no group call panel');
    const rows = el.querySelectorAll('.grpRow');
    if(rows.length !== RAIL_GROUPS.length)
      throw new Error(rows.length+' rows for '+RAIL_GROUPS.length+' groups');
    const curtains = el.querySelector('.grpRow[data-g="curtains"]');
    if(!curtains.querySelector('button[data-do="open"]'))
      throw new Error('the curtains have no OPEN button');
    if(el.querySelector('.grpRow[data-g="legs"] button[data-do="open"]'))
      throw new Error('legs should not have a draw control');
    return rows.length+' groups, curtains get OPEN and SHUT';
  });
  P('a group finds its linesets by what is hung, not by number', ()=>{
    initHang();
    const e1 = railGroup('electrics').map(l=>l.id);
    if(!e1.length) throw new Error('no electrics found in the default hang');
    // move an electric to a lineset that has never held one
    const spare = FLY.find(l=>l.goodsKey === 'none') || FLY[10];
    hangGoods(spare, 'electric');
    const e2 = railGroup('electrics').map(l=>l.id);
    if(e2.indexOf(spare.id) === -1) throw new Error('the group did not follow the goods');
    hangGoods(spare, 'none');
    if(railGroup('electrics').indexOf(spare) !== -1) throw new Error('it did not let go');
    return 'default electrics on linesets '+e1.join(', ');
  });
  P('electrics in and out', ()=>{
    initHang();
    const list = railGroup('electrics');
    const r = railCall('electrics','out');
    if(r.moved !== list.length) throw new Error('moved '+r.moved+' of '+list.length);
    for(let i=0;i<400;i++) updateFly(0.05);
    list.forEach(ls=>{ if(ls.pos < OUT_TRIM - 0.5)
      throw new Error('lineset '+ls.id+' did not go out, at '+ls.pos.toFixed(1)); });
    railCall('electrics','in');
    for(let i=0;i<400;i++) updateFly(0.05);
    list.forEach(ls=>{ if(ls.pos > OUT_TRIM - 1)
      throw new Error('lineset '+ls.id+' did not come in, at '+ls.pos.toFixed(1)); });
    return list.length+' electrics out to '+OUT_TRIM.toFixed(1)+'m and back to trim';
  });
  P('legs and borders answer their own calls only', ()=>{
    initHang();
    const legs = railGroup('legs'), borders = railGroup('borders');
    if(!legs.length || !borders.length) throw new Error('nothing hung to test with');
    if(legs.some(l=>borders.indexOf(l) !== -1)) throw new Error('a lineset is in both groups');
    const legTrims = legs.map(l=>l.target);
    railCall('borders','out');
    for(let i=0;i<300;i++) updateFly(0.05);
    legs.forEach((l,i)=>{ if(Math.abs(l.target - legTrims[i]) > 0.01)
      throw new Error('calling borders moved the legs'); });
    borders.forEach(b=>{ if(b.pos < OUT_TRIM - 0.5) throw new Error('a border stayed in'); });
    railCall('borders','in');
    for(let i=0;i<300;i++) updateFly(0.05);
    return legs.length+' legs, '+borders.length+' borders, neither disturbs the other';
  });
  P('the curtains draw as well as fly', ()=>{
    initHang();
    const c = railGroup('curtains');
    if(!c.length) throw new Error('no curtain is hung');
    railCall('curtains','open');
    if(c.some(l=>l.travTarget < 0.9)) throw new Error('it did not open');
    for(let i=0;i<200;i++) updateFly(0.05);
    railCall('curtains','close');
    if(c.some(l=>l.travTarget > 0.1)) throw new Error('it did not close');
    railCall('curtains','out');
    for(let i=0;i<400;i++) updateFly(0.05);
    if(c.some(l=>l.pos < OUT_TRIM - 0.5)) throw new Error('it did not fly out');
    railCall('curtains','in');
    for(let i=0;i<400;i++) updateFly(0.05);
    return c.length+' traveler, opens, shuts, flies';
  });
  P('a locked lineset answers the call, and is locked off again on arrival', ()=>{
    initHang();
    const list = railGroup('electrics');
    const victim = list[0];
    victim.locked = true;
    victim.target = victim.pos = inTrimOf(victim);
    const r = railCall('electrics','out');
    if(r.moved !== list.length) throw new Error('the call moved '+r.moved+' of '+list.length);
    if(victim.locked) throw new Error('the call left the lock on for the travel');
    if(Math.abs(victim.target - OUT_TRIM) > 0.01) throw new Error('the locked lineset was not sent out');
    for(let i=0;i<400;i++) updateFly(0.05);
    if(!victim.locked) throw new Error('it was not locked off again on arrival');
    railCall('electrics','in');
    for(let i=0;i<400;i++) updateFly(0.05);
    return 'the flyman worked the lock: out, and locked off at '+victim.pos.toFixed(1)+'m';
  });
  P('a cue still flies a locked line, and it is locked again on arrival', ()=>{
    initHang();
    const ls = FLY[9];                       // the sky drop, out at boot
    ls.locked = true; ls.target = ls.pos = OUT_TRIM;
    CUES.push({n:99.9, label:'relock probe', fade:0, follow:null, lx:null,
               fly:[{id:ls.id, target:14.0, open:ls.travTarget}], sfx:null,
               house:HOUSE.house, work:HOUSE.work, practical:HOUSE.practical, haze:RIG.haze});
    fireCue(CUES.length-1);
    if(ls.locked) throw new Error('the cue left the lock on for the travel');
    if(Math.abs(ls.target - 14.0) > 0.01) throw new Error('the cue did not take the locked line: target '+ls.target.toFixed(2));
    for(let i=0;i<300;i++) updateFly(0.05);
    if(Math.abs(ls.pos - 14.0) > 0.05) throw new Error('it never arrived: '+ls.pos.toFixed(2));
    if(!ls.locked) throw new Error('not locked off again on arrival');
    CUES.pop();
    return 'the cue flew a locked line to 14m and the flyman locked it off';
  });
  P('calling an empty group is harmless', ()=>{
    FLY.forEach(ls=>hangGoods(ls,'none'));
    const r = railCall('electrics','out');
    if(r.total !== 0 || r.moved !== 0) throw new Error('it found something in an empty rail');
    syncRailGroups();
    const row = document.querySelector('.grpRow[data-g="electrics"]');
    if(!row.classList.contains('empty')) throw new Error('the row does not read as empty');
    if(!row.querySelector('button').disabled) throw new Error('the buttons are still live');
    initHang();
    syncRailGroups();
    if(document.querySelector('.grpRow[data-g="electrics"]').classList.contains('empty'))
      throw new Error('it did not come back');
    return 'no goods, no call, buttons go dead';
  });
  P('the counts follow the rail', ()=>{
    initHang();
    railCall('electrics','out');
    for(let i=0;i<400;i++) updateFly(0.05);
    syncRailGroups();
    const txt = document.querySelector('.grpRow[data-g="electrics"] .gc').textContent;
    if(txt.indexOf('0/') !== 0) throw new Error('with all out the count reads '+txt);
    railCall('electrics','in');
    for(let i=0;i<400;i++) updateFly(0.05);
    syncRailGroups();
    const txt2 = document.querySelector('.grpRow[data-g="electrics"] .gc').textContent;
    if(txt2.split('/')[0] === '0') throw new Error('with all in the count reads '+txt2);
    return 'out reads '+txt+', in reads '+txt2;
  });
  P('the buttons themselves work', ()=>{
    initHang();
    const btn = document.querySelector('.grpRow[data-g="borders"] button[data-do="out"]');
    btn.click();
    for(let i=0;i<300;i++) updateFly(0.05);
    if(railGroup('borders').some(b=>b.pos < OUT_TRIM - 0.5))
      throw new Error('the OUT button did nothing');
    document.querySelector('.grpRow[data-g="borders"] button[data-do="in"]').click();
    for(let i=0;i<300;i++) updateFly(0.05);
    initHang();
    return 'clicked, and the rail moved';
  });

  console.log('--- gameplay ---');
  P('run program', ()=>{ Prog.loop=false; runProgram(SNIPPETS['STORM']); return Prog.ops.length; });
  P('step program', ()=>{ for(let i=0;i<400;i++) stepProgram(0.05); return Prog.pc; });
  P('record cue', ()=>{ document.querySelector('#qNum').value='9'; document.querySelector('#qLabel').value='test'; recordCue(); return CUES.length; });
  P('go / back', ()=>{ go(); goBack(); return nextCue; });
  P('fly all in', ()=>{ FLY.forEach(flyIn); for(let i=0;i<500;i++) updateFly(0.05); return FLY.map(l=>+l.pos.toFixed(1)).join(','); });
  P('fly all out', ()=>{ FLY.forEach(flyOut); for(let i=0;i<500;i++) updateFly(0.05); return FLY[0].pos.toFixed(1); });
  P('fly to / lock', ()=>{ flyTo(FLY[3],12); FLY[4].locked=true; flyIn(FLY[4]); FLY[4].locked=false; return 'ok'; });
  P('hang every good on every lineset', ()=>{ Object.keys(GOODS).forEach(k=>FLY.forEach(ls=>hangGoods(ls,k))); return FLY[0].goodsKey; });
  P('restore default hang', ()=>{ initHang(); return FLY.map(l=>l.goodsKey).join(','); });
  P('place all scenic', ()=>{ Object.keys(SCENIC).forEach((k,i)=>placeScenic(k,-6+i*1.2,-3)); return SET.length; });
  P('select + rotate + strike', ()=>{ selPiece=SET[0]; selPiece.rot+=0.26; strikePiece(SET[0]); return SET.length; });
  P('save/load groundplan', ()=>{ document.querySelector('#setSave').click(); strikeAll(); document.querySelector('#setLoad').click(); return SET.length; });
  P('strike all', ()=>{ strikeAll(); return SET.length; });
  P('submaster record/run', ()=>{ FIXTURES.forEach(f=>f.level=0.5); recordSub(SUBS[0]); SUBS[0].val=0.8; runSub(SUBS[0]); return FIXTURES[0].level.toFixed(2); });
  P('select every section', ()=>{ SECTIONS.forEach((s,i)=>selectSection(i)); return selSec; });
  P('view teleports', ()=>{ [1,2,3,4,5,6].forEach(goToView); return curView; });
  P('toggle camera mode', ()=>{ toggleMode(); toggleMode(); return Player.mode; });
  P('walk 60 frames', ()=>{ Player.mode='walk'; keys['KeyW']=true; for(let i=0;i<60;i++) updatePlayer(0.016); keys['KeyW']=false; return Player.pos.z.toFixed(2); });
  P('orbit update', ()=>{ Player.mode='orbit'; updateOrbit(); Player.mode='walk'; return 'ok'; });
  P('aim mover', ()=>{ aimMoverAt(chan(23), new THREE.Vector3(0,1,-4)); return chan(23).panT.toFixed(1); });
  P('followspot', ()=>{ toggleFollow(); followTarget && followTarget.set(0,1,0); updateRig(0.016,1); toggleFollow(); return 'ok'; });
  P('blackout + restore', ()=>{ RIG.blackout=true; updateRig(0.016,1); RIG.blackout=false; updateRig(0.016,1); return 'ok'; });
  P('haze sweep', ()=>{ for(let h=0;h<=100;h+=10){ RIG.haze=h/100; updateRig(0.016,1);} RIG.haze=0.55; return 'ok'; });
  P('gobo sweep', ()=>{ for(let g=0;g<6;g++){ FIXTURES.forEach(f=>f.gobo=g); updateRig(0.016,1);} FIXTURES.forEach(f=>f.gobo=0); return 'ok'; });
  P('fire every cue', ()=>{ CUES.forEach((c,i)=>fireCue(i)); for(let i=0;i<200;i++){ updateFades(0.05); updateRig(0.05,1);} return nextCue; });
  P('run every sample show', ()=>{ Object.keys(SNIPPETS).forEach(k=>{ runProgram(SNIPPETS[k]); for(let i=0;i<900;i++){ stepProgram(0.05); updateFades(0.05); } }); return 'ok'; });
  P('refresh all UI', ()=>{ refreshCues(); refreshFlyUI(); refreshSetUI(); refreshSubs(); refreshChannelStrip(); syncMasters(); return 'ok'; });
  P('click every tab', ()=>{ document.querySelectorAll('#tabs button[data-p]').forEach(b=>b.click()); return 'ok'; });
  P('click fly rail buttons', ()=>{ ['#flyAllIn','#flyAllOut','#flyStop','#flyPreset'].forEach(s=>document.querySelector(s).click()); return 'ok'; });
  P('click light buttons', ()=>{ ['#btnBO','#btnAll','#btnFocus','#btnBO'].forEach(s=>document.querySelector(s).click()); return 'ok'; });
  P('click cue buttons', ()=>{ ['#btnGo','#btnBack','#btnTop','#btnStopFade'].forEach(s=>document.querySelector(s).click()); return 'ok'; });
  P('master sliders', ()=>{ ['#gm','#hz','#hl','#wl'].forEach(s=>{ const el=document.querySelector(s); el.value=42; el.oninput({target:el}); }); return 'ok'; });
  P('120 more frames', ()=>{ for(let i=0;i<120;i++){ const cb=window.__raf; window.__raf=null; if(cb) cb(Date.now()+i*16);} return 'ok'; });

  console.log('--- RULING DK: the room has an environment ---');
  P('the room has an environment for a metal surface to sample', ()=>{
    /* nothing set scene.environment, so every imported MeshStandardMaterial
       carried envMapIntensity 1 with nothing to reflect and rendered near-black */
    if(!scene.environment) throw new Error('scene.environment is ' + scene.environment);
    if(!scene.environment.isTexture)
      throw new Error('scene.environment is not a texture: ' + scene.environment.constructor.name);
    return 'environment texture, mapping ' + scene.environment.mapping;
  });
  P('ENV_INTENSITY is a live positive number', ()=>{
    if(typeof ENV_INTENSITY !== 'number')
      throw new Error('ENV_INTENSITY is ' + (typeof ENV_INTENSITY));
    if(!(ENV_INTENSITY > 0)) throw new Error('ENV_INTENSITY reads ' + ENV_INTENSITY);
    return 'ENV_INTENSITY ' + ENV_INTENSITY;
  });
  P('envTrack sets an imported-style standard material to the house intensity', ()=>{
    const m = new THREE.MeshStandardMaterial({metalness:1, roughness:0.2});
    /* the default is 1: an assertion that the field merely EXISTS would pass
       against a build where envTrack does nothing at all */
    if(m.envMapIntensity !== 1)
      throw new Error('three.js no longer defaults envMapIntensity to 1: ' + m.envMapIntensity);
    if(typeof envTrack !== 'function') throw new Error('envTrack is ' + (typeof envTrack));
    if(envTrack(m) !== m) throw new Error('envTrack does not hand the material back');
    if(typeof ENV_LIVE !== 'number') throw new Error('ENV_LIVE is ' + (typeof ENV_LIVE));
    if(m.envMapIntensity !== ENV_LIVE)
      throw new Error('envTrack left it at ' + m.envMapIntensity + ', ENV_LIVE is ' + ENV_LIVE);
    if(!(m.envMapIntensity > 0))
      throw new Error('the house intensity is ' + m.envMapIntensity);
    ENV_MATS.delete(m);                     // leave the registry as we found it
    return 'envMapIntensity ' + m.envMapIntensity.toFixed(4);
  });
  P('a dyed drape is TRACKED, not just correct at the moment it is dyed', ()=>{
    /* goodsMat CLONES M.serge, and clone() copies envMapIntensity — so an
       untracked drape carries whatever the room happened to be when it was
       pulled and then never moves again.  It looks right at the instant it is
       made and is silently wrong from the next cue on, which is the one shape
       none of the other cases here can see. */
    const step = ()=>{ updateFades(0.05); updateRig(0.05, 1); };
    const base = M.serge || M.velour;
    if(!base) throw new Error('no stock cloth material to dye');
    const drape = goodsMat(base, 0x8b1a2b);
    /* leave neither cache holding this dye, or the registry-size case below
       counts a material that only exists because this one ran */
    try{
    if(!drape || drape === base) throw new Error('goodsMat handed back the base material');
    if(!ENV_MATS.has(drape)) throw new Error('the dyed clone never reached the registry');
    const born = ENV_LIVE;
    /* move the room a long way, so a frozen clone cannot pass by luck */
    const keepH = HOUSE.house, keepW = HOUSE.work, keepP = HOUSE.practical,
          keepB = RIG.blackout, keepL = FIXTURES.map(f=>f.level);
    RIG.blackout = true; HOUSE.house = 0; HOUSE.work = 0; HOUSE.practical = 0;
    FIXTURES.forEach(f=>{ f.level = 0; });
    for(let i=0;i<60;i++) step();
    const now = ENV_LIVE, got = drape.envMapIntensity;
    HOUSE.house = keepH; HOUSE.work = keepW; HOUSE.practical = keepP;
    RIG.blackout = keepB; FIXTURES.forEach((f,i)=>{ f.level = keepL[i]; });
    for(let i=0;i<40;i++) step();
    if(!(born > now + 0.01))
      throw new Error('the room did not move, so a frozen clone would pass: ' +
                      born.toFixed(4) + ' -> ' + now.toFixed(4));
    if(got !== now)
      throw new Error('the drape reads ' + got + ' after the room went to ' +
                      now.toFixed(4) + ' — it froze at ' + born.toFixed(4));
    return 'dyed at ' + born.toFixed(3) + ', followed the room down to ' + now.toFixed(3);
    } finally {
      for(const k in GOODSM) if(GOODSM[k] === drape) delete GOODSM[k];
      ENV_MATS.delete(drape);
    }
  });
  P('the environment follows the bed, so a blackout is not lit like a full stage', ()=>{
    /* RULING BH fixed exactly this fault for the ambient.  Step the real frame
       (updateFades then updateRig), never updateRig alone (TRAPS). */
    const step = ()=>{ updateFades(0.05); updateRig(0.05, 1); };
    const keepH = HOUSE.house, keepW = HOUSE.work, keepP = HOUSE.practical,
          keepB = RIG.blackout, keepL = FIXTURES.map(f=>f.level);
    RIG.blackout = true; HOUSE.house = 0; HOUSE.work = 0; HOUSE.practical = 0;
    FIXTURES.forEach(f=>{ f.level = 0; });
    for(let i=0;i<60;i++) step();
    const dark = ENV_LIVE;
    RIG.blackout = false; HOUSE.house = 1; HOUSE.work = 1; HOUSE.practical = 1;
    for(let i=0;i<60;i++) step();
    const lit = ENV_LIVE;
    HOUSE.house = keepH; HOUSE.work = keepW; HOUSE.practical = keepP;
    RIG.blackout = keepB; FIXTURES.forEach((f,i)=>{ f.level = keepL[i]; });
    for(let i=0;i<40;i++) step();
    if(typeof dark !== 'number' || typeof lit !== 'number')
      throw new Error('ENV_LIVE is not a number: ' + dark + ' / ' + lit);
    if(!(lit > dark + 0.01))
      throw new Error('a blackout reads ' + dark.toFixed(4) + ' and a lit room ' + lit.toFixed(4));
    if(!(dark < ENV_INTENSITY))
      throw new Error('a blackout still sits at the full house intensity: ' + dark.toFixed(4));
    return 'blackout ' + dark.toFixed(3) + ' -> lit room ' + lit.toFixed(3);
  });
  P('a registered subtree is driven every frame, and a rebuild lets it go', ()=>{
    /* one registry, one walk.  envRegister collects a subtree; envDrive writes
       the whole Set each frame; envRecollect rebuilds from what is really in the
       scene, which is what stops an imported set per load piling up for ever. */
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({metalness:1, roughness:0.25});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1), mat));
    const before = ENV_MATS.size;
    envRegister(g);                         // g is NOT in the scene
    if(!ENV_MATS.has(mat)) throw new Error('envRegister did not put the material on the registry');
    if(ENV_MATS.size !== before + 1)
      throw new Error('the registry moved from ' + before + ' to ' + ENV_MATS.size + ' for one material');
    envRegister(g);                         // a Set, so registering twice is free
    if(ENV_MATS.size !== before + 1)
      throw new Error('registering the same subtree twice grew the registry to ' + ENV_MATS.size);
    if(mat.envMapIntensity !== ENV_LIVE)
      throw new Error('registration left it at ' + mat.envMapIntensity + ', ENV_LIVE is ' + ENV_LIVE);
    mat.envMapIntensity = 99;               // something no drive would produce
    updateFades(0.05); updateRig(0.05, 1);
    if(mat.envMapIntensity !== ENV_LIVE)
      throw new Error('one frame left it at ' + mat.envMapIntensity + ', ENV_LIVE is ' + ENV_LIVE);
    envRecollect();
    if(ENV_MATS.has(mat))
      throw new Error('a rebuild kept a material that is in no scene');
    if(ENV_MATS.size !== before)
      throw new Error('after the rebuild the registry reads ' + ENV_MATS.size + ', not ' + before);
    return 'registered, driven to ' + ENV_LIVE.toFixed(4) + ', and rebuilt away';
  });
  P('the BUILDING follows the bed too, not only the imported sets', ()=>{
    /* THE ASSERTION THAT WAS MISSING.  r128 hands scene.environment to EVERY
       standard material, so the bed clause governs the theatre itself — and a
       test that builds its own material or reads the ENV_LIVE global can never
       see 120 live materials sitting at the default 1.  Reach into the scene. */
    const imports = SHOW.bjFill || [];
    const mats = [], seen = [];
    scene.traverse(o=>{
      if(!o.isMesh || !o.material) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for(const m of list){
        if(!m || !m.isMeshStandardMaterial) continue;
        if(imports.indexOf(m) >= 0 || seen.indexOf(m) >= 0) continue;
        seen.push(m); mats.push(m);
      }
    });
    if(mats.length < 50)
      throw new Error('only ' + mats.length + ' of our own standard materials found in the scene');
    const step = ()=>{ updateFades(0.05); updateRig(0.05, 1); };
    const keepH = HOUSE.house, keepW = HOUSE.work, keepP = HOUSE.practical,
          keepB = RIG.blackout, keepL = FIXTURES.map(f=>f.level);
    RIG.blackout = true; HOUSE.house = 0; HOUSE.work = 0; HOUSE.practical = 0;
    FIXTURES.forEach(f=>{ f.level = 0; });
    for(let i=0;i<60;i++) step();
    const darkLive = ENV_LIVE, darkOff = mats.filter(m=>m.envMapIntensity !== darkLive);
    RIG.blackout = false; HOUSE.house = 1; HOUSE.work = 1; HOUSE.practical = 1;
    for(let i=0;i<60;i++) step();
    const litLive = ENV_LIVE, litOff = mats.filter(m=>m.envMapIntensity !== litLive);
    HOUSE.house = keepH; HOUSE.work = keepW; HOUSE.practical = keepP;
    RIG.blackout = keepB; FIXTURES.forEach((f,i)=>{ f.level = keepL[i]; });
    for(let i=0;i<40;i++) step();
    if(darkOff.length)
      throw new Error('in a blackout ' + darkOff.length + ' of ' + mats.length +
        ' of our standard materials read ' + darkOff[0].envMapIntensity + ', not ' + darkLive.toFixed(4));
    if(litOff.length)
      throw new Error('with the room lit ' + litOff.length + ' of ' + mats.length +
        ' read ' + litOff[0].envMapIntensity + ', not ' + litLive.toFixed(4));
    if(!(litLive > darkLive + 0.01))
      throw new Error('the building does not move: blackout ' + darkLive.toFixed(4) +
        ' against a lit room ' + litLive.toFixed(4));
    return mats.length + ' of our own materials, blackout ' + darkLive.toFixed(3) +
           ' -> lit ' + litLive.toFixed(3);
  });
  P('a figure minted after boot, and the dummy it carries, follow the bed', ()=>{
    /* two lazy paths the boot walk cannot see.  makeHand mints a cloth and a
       hat the first time anything asks for crew — which may be a carpenter call
       hours in — and crewPickUp mints a fresh material PER CARRY, which recurs
       right through a changeover, which is when the stage is dark. */
    const step = ()=>{ updateFades(0.05); updateRig(0.05, 1); };
    const matsUnder = root=>{
      const out = [];
      root.traverse(o=>{
        if(!o.isMesh || !o.material) return;
        const list = Array.isArray(o.material) ? o.material : [o.material];
        for(const m of list)
          if(m && m.isMeshStandardMaterial && out.indexOf(m) < 0) out.push(m);
      });
      return out;
    };
    const lead = carpLead();
    if(!lead || !lead.group) throw new Error('no lead carpenter to measure');
    /* EVERY figure, not just the lead.  carpLead spawns the six show hands
       before minting the seventh, and each of those gets its own cloth and hat
       out of makeHand — so a version measuring only the lead is blind to the
       hook that matters most, which is what the negative check found. */
    const figure = [];
    for(const h of CREW.people)
      for(const m of matsUnder(h.group)) if(figure.indexOf(m) < 0) figure.push(m);
    if(figure.length < 8)
      throw new Error('the crew carry ' + figure.length + ' standard materials across ' +
                      CREW.people.length + ' figures — too few to be measuring the hands');
    const hand = CREW.people[0];
    crewPickUp(hand, 'flat');
    const carried = hand.carry ? matsUnder(hand.carry) : [];
    if(!carried.length) throw new Error('the carried dummy has no standard material');
    for(let i=0;i<20;i++) step();
    const figStray = figure.filter(m=>m.envMapIntensity !== ENV_LIVE);
    const carStray = carried.filter(m=>m.envMapIntensity !== ENV_LIVE);
    if(hand.carry){ hand.hands.remove(hand.carry); hand.carry = null; }
    if(figStray.length)
      throw new Error(figStray.length + ' of ' + figure.length +
        ' materials on the lazily-minted crew read ' + figStray[0].envMapIntensity +
        ', against ENV_LIVE ' + ENV_LIVE);
    if(carStray.length)
      throw new Error(carStray.length + ' of ' + carried.length +
        ' materials on a carried dummy read ' + carStray[0].envMapIntensity +
        ', against ENV_LIVE ' + ENV_LIVE);
    return figure.length + ' across ' + CREW.people.length + ' figures and ' +
           carried.length + ' on the dummy, all at ' + ENV_LIVE.toFixed(4);
  });
  P('the environment box encloses the camera, floor included', ()=>{
    /* PMREM's cube camera sits at the ORIGIN, so a floor standing AT y 0 is
       edge-on and contributes nothing while half the sphere falls through to a
       background in a different encoding.  Sample directions, do not eye it. */
    if(!ENV_SRC) throw new Error('the environment source box was not kept');
    const faces = ENV_SRC.children.filter(o=>o.isMesh);
    if(faces.length !== 6) throw new Error(faces.length + ' faces in the box, not 6');
    ENV_SRC.updateMatrixWorld(true);
    const rc = new THREE.Raycaster(), org = new THREE.Vector3(0,0,0),
          dir = new THREE.Vector3();
    const hits = faces.map(()=>0);
    let miss = 0;
    const N = 4000;
    for(let i=0;i<N;i++){
      /* an even sphere: z uniform, longitude by the golden angle */
      const z = 1 - 2*(i + 0.5)/N, r = Math.sqrt(Math.max(0, 1 - z*z)),
            a = i * 2.399963229728653;
      dir.set(r*Math.cos(a), z, r*Math.sin(a));
      rc.set(org, dir);
      const hit = rc.intersectObjects(faces, false);
      if(!hit.length){ miss++; continue; }
      hits[faces.indexOf(hit[0].object)]++;
    }
    if(miss) throw new Error(miss + ' of ' + N + ' directions escaped the box to the background');
    const share = hits.map(h=>h/N);
    const worst = Math.min.apply(null, share);
    if(worst < 0.10)
      throw new Error('a face takes only ' + (worst*100).toFixed(2) + '% of the sphere: ' +
        share.map(s=>(s*100).toFixed(1)).join('/'));
    /* the floor is the face that was broken, so name it rather than trusting
       the minimum to have been it */
    const lowest = faces.indexOf(faces.slice().sort((a,b)=>a.position.y - b.position.y)[0]);
    if(share[lowest] < 0.10)
      throw new Error('the floor takes ' + (share[lowest]*100).toFixed(2) + '% of the sphere');
    return '6 faces, no escapes, shares ' + share.map(s=>(s*100).toFixed(1)).join('/') + '%';
  });

  console.log('--- RULING DL: the atmosphere is height-based ---');

  P('ATM is a live constant block', ()=>{
    if(!ATM || !(ATM.density > 0) || !(ATM.height > 0))
      throw new Error('ATM reads ' + JSON.stringify(ATM && {d:ATM.density, h:ATM.height}));
    if(scene.fog.density !== ATM.density)
      throw new Error('the fog density ' + scene.fog.density + ' drifted from ATM ' + ATM.density);
    return 'density ' + ATM.density + ', height ' + ATM.height + 'm';
  });

  P('the fog chunks carry the height band, and still name r128 fogDepth', ()=>{
    /* THE TRIPWIRE.  r128's varying is named fogDepth; a later release renamed
       it vFogDepth, and the plan for this ruling was written against the newer
       name.  A patched chunk that names the wrong varying is a shader that will
       not compile, and NO suite in this repo can see that — jsdom stubs
       WebGLRenderer, so a broken shader body passes all nineteen.  This is the
       cheapest thing that fires if three.js ever moves under us. */
    const frag = THREE.ShaderChunk.fog_fragment;
    if(!/fogDepth/.test(frag))
      throw new Error('the patched fog_fragment no longer names fogDepth at all');
    if(/vFogDepth/.test(frag))
      throw new Error('the patched fog_fragment names vFogDepth, which r128 does not have');
    if(!/atmBand/.test(frag)) throw new Error('fog_fragment carries no height band');
    if(!/vAtmY/.test(THREE.ShaderChunk.fog_vertex))
      throw new Error('fog_vertex never computes the world height');
    if(!/vAtmY/.test(THREE.ShaderChunk.fog_pars_vertex))
      throw new Error('fog_pars_vertex never declares the varying');
    if(!/atmHeight/.test(THREE.ShaderChunk.fog_pars_fragment))
      throw new Error('fog_pars_fragment never declares atmHeight');
    /* the sprite shader has fog_vertex but no begin_vertex, so the local
       transformed does not exist there — naming it would break the moment
       anything is a sprite, and that too is invisible to every suite */
    if(/transformed/.test(THREE.ShaderChunk.fog_vertex))
      throw new Error('fog_vertex names transformed, which the sprite shader does not define');
    return 'fogDepth kept, vAtmY added, band and glare in the fragment';
  });

  P('atmTrack hands a material the SAME uniform objects, never copies', ()=>{
    /* a copied uniform looks identical on the first frame and then never moves
       again — the failure this whole mechanism exists to avoid, and the reason
       UniformsLib could not be used: ShaderLib cloned it at module load. */
    const m = new THREE.MeshStandardMaterial();
    atmTrack(m);
    if(typeof m.onBeforeCompile !== 'function')
      throw new Error('atmTrack did not hook the compile');
    const sh = { uniforms:{} };
    m.onBeforeCompile(sh, renderer);
    if(sh.uniforms.atmHeight !== ATM.u.atmHeight)
      throw new Error('atmHeight is a COPY, so it would freeze at first compile');
    if(sh.uniforms.atmHaze !== ATM.u.atmHaze) throw new Error('atmHaze is a copy');
    if(sh.uniforms.atmGlare !== ATM.u.atmGlare) throw new Error('atmGlare is a copy');
    if(sh.uniforms.atmMix !== ATM.u.atmMix) throw new Error('atmMix is a copy');
    return 'four shared uniform objects reach the shader';
  });

  P('atmTrack does not throw away a hook the material already had', ()=>{
    /* RULING DK may have hooked it first, and a later ruling will hook it
       again — the chain has to survive, or whichever ran first is silently lost */
    const m = new THREE.MeshStandardMaterial();
    let ran = 0;
    m.onBeforeCompile = function(){ ran++; };
    atmTrack(m);
    const sh = { uniforms:{} };
    m.onBeforeCompile(sh, renderer);
    if(ran !== 1) throw new Error('the previous onBeforeCompile ran ' + ran + ' times');
    if(sh.uniforms.atmHeight !== ATM.u.atmHeight)
      throw new Error('chaining lost the atmosphere uniforms');
    return 'the earlier hook still runs, and the uniforms still land';
  });

  P('every fogged material in the live scene was hooked', ()=>{
    /* the coverage clause.  atmMix makes a miss render exactly as it did
       before this ruling, which is the right failure mode and also a SILENT
       one — so it has to be asserted rather than noticed. */
    const missed = [], seen = [];
    scene.traverse(o=>{
      if(!o.isMesh || !o.material) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for(const m of list){
        if(!m || m.fog !== true || m.isRawShaderMaterial) continue;
        if(seen.indexOf(m) >= 0) continue;
        seen.push(m);
        if(!m.userData.atmHooked) missed.push(m);
      }
    });
    if(seen.length < 50)
      throw new Error('only ' + seen.length + ' fogged materials found in the scene');
    if(missed.length)
      throw new Error(missed.length + ' of ' + seen.length +
        ' fogged materials were never hooked, first is a ' + missed[0].type);
    return seen.length + ' fogged materials, all hooked';
  });

  P('the haze and the glare ride the room, and it is THREE writes not one each', ()=>{
    const step = ()=>{ updateFades(0.05); updateRig(0.05, 1); };
    const keepH = HOUSE.house, keepW = HOUSE.work, keepP = HOUSE.practical,
          keepB = RIG.blackout, keepL = FIXTURES.map(f=>f.level);
    RIG.blackout = true; HOUSE.house = 0; HOUSE.work = 0; HOUSE.practical = 0;
    FIXTURES.forEach(f=>{ f.level = 0; });
    for(let i=0;i<60;i++) step();
    const darkHaze = ATM.u.atmHaze.value, darkGlare = ATM.u.atmGlare.value;
    RIG.blackout = false; HOUSE.house = 1; HOUSE.work = 1; HOUSE.practical = 1;
    FIXTURES.forEach(f=>{ f.level = 1; });
    for(let i=0;i<60;i++) step();
    const litHaze = ATM.u.atmHaze.value, litGlare = ATM.u.atmGlare.value;
    HOUSE.house = keepH; HOUSE.work = keepW; HOUSE.practical = keepP;
    RIG.blackout = keepB; FIXTURES.forEach((f,i)=>{ f.level = keepL[i]; });
    for(let i=0;i<40;i++) step();
    if(!(darkHaze > litHaze + 0.001))
      throw new Error('the haze does not thicken as the room darkens: blackout ' +
        darkHaze.toFixed(3) + ' against lit ' + litHaze.toFixed(3));
    if(!(litGlare > darkGlare + 0.001))
      throw new Error('the glare does not ride the rig: blackout ' +
        darkGlare.toFixed(3) + ' against lit ' + litGlare.toFixed(3));
    return 'haze ' + darkHaze.toFixed(2) + ' -> ' + litHaze.toFixed(2) +
           ', glare ' + darkGlare.toFixed(2) + ' -> ' + litGlare.toFixed(2);
  });

  console.log('--- RULING DM: the colour grade ---');

  P('GRADE is a live constant block and the chunk carries houseGrade', ()=>{
    if(!GRADE || !GRADE.u || !GRADE.u.gradeSat) throw new Error('GRADE holds no uniforms');
    const pars = THREE.ShaderChunk.tonemapping_pars_fragment;
    if(!/houseGrade/.test(pars)) throw new Error('the tonemapping chunk has no houseGrade');
    if(!/gradeMix/.test(pars)) throw new Error('the grade has no bypass term');
    /* substring, not regex: this file is a template literal, so a backslash in
       a pattern is eaten before the RegExp ever sees it and probe-lint does not
       sweep for that — it looks for backticks and singly-escaped quotes */
    if(THREE.ShaderChunk.tonemapping_fragment.indexOf('houseGrade( toneMapping') < 0)
      throw new Error('the grade is not applied AFTER toneMapping');
    return 'contrast ' + GRADE.contrast + ', sat ' + GRADE.sat;
  });

  P('the grade shares its uniform objects, and rides the SAME hook as the fog', ()=>{
    /* one hook carrying both rulings: two wrappers per material would be two
       chances for a later one to drop the earlier */
    const m = new THREE.MeshStandardMaterial();
    atmTrack(m);
    const sh = { uniforms:{} };
    m.onBeforeCompile(sh, renderer);
    if(sh.uniforms.gradeBC !== GRADE.u.gradeBC) throw new Error('gradeBC is a copy');
    if(sh.uniforms.gradeSat !== GRADE.u.gradeSat) throw new Error('gradeSat is a copy');
    if(sh.uniforms.gradeTint !== GRADE.u.gradeTint) throw new Error('gradeTint is a copy');
    if(sh.uniforms.gradeMix !== GRADE.u.gradeMix) throw new Error('gradeMix is a copy');
    if(sh.uniforms.atmHaze !== ATM.u.atmHaze)
      throw new Error('the grade hook displaced the atmosphere hook');
    return 'both rulings, one hook, four shared objects each';
  });

  P('an UNHOOKED material is bypassed, not rendered black', ()=>{
    /* THE ONE THAT MATTERS.  tonemapping_pars_fragment is included unguarded,
       so a material that declares these uniforms and never has them supplied
       reads gradeTint as vec3(0).  Without the bypass that multiply turns the
       surface BLACK — a miss would not be subtly wrong, it would be a hole in
       the picture.  GLSL defaults an unsupplied uniform to 0, so gradeMix 0
       must return the colour untouched. */
    const src = THREE.ShaderChunk.tonemapping_pars_fragment;
    const body = src.slice(src.indexOf('vec3 houseGrade'));
    if(body.indexOf('return mix( c,') < 0)
      throw new Error('houseGrade does not return a mix from the ORIGINAL colour');
    if(body.indexOf('gradeMix );') < 0)
      throw new Error('the mix is not driven by gradeMix, so 0 would not bypass');
    /* and the tint must sit inside the graded branch, never on the source */
    if(body.indexOf('c *= gradeTint') >= 0)
      throw new Error('gradeTint multiplies the source colour, so 0 would blacken it');
    return 'gradeMix 0 returns the ACES pixel untouched';
  });

  P('additive light is exempt from the grade, on purpose', ()=>{
    /* a beam and a gobo flare ARE the light; the surfaces they fall on are
       graded already, so grading the source too tints the same photon twice */
    const beams = [], flares = [];
    scene.traverse(o=>{
      if(!o.isMesh || !o.material || Array.isArray(o.material)) return;
      const m = o.material;
      if(m.isShaderMaterial && m.blending === THREE.AdditiveBlending) beams.push(m);
      else if(m.blending === THREE.AdditiveBlending && m.isMeshBasicMaterial) flares.push(m);
    });
    if(!beams.length) throw new Error('no beam materials found at all');
    if(!flares.length) throw new Error('no additive flare materials found at all');
    const litBeam = beams.filter(m=>m.toneMapped !== false);
    const litFlare = flares.filter(m=>m.toneMapped !== false);
    if(litBeam.length)
      throw new Error(litBeam.length + ' of ' + beams.length + ' beams are still toneMapped');
    if(litFlare.length)
      throw new Error(litFlare.length + ' of ' + flares.length + ' additive flares are still toneMapped');
    return beams.length + ' beams and ' + flares.length + ' flares exempt';
  });

  P('the shared M table went through the hook', ()=>{
    const missed = Object.keys(M).filter(k=>M[k] && M[k].isMaterial && !M[k].userData.atmHooked);
    if(missed.length)
      throw new Error(missed.length + ' M materials were never hooked, first is ' + missed[0]);
    return Object.keys(M).length + ' shared materials hooked';
  });

  console.log('--- RULING DN: glow planes instead of bloom ---');

  P('the glow is ONE additive instanced draw, and it is never culled', ()=>{
    if(typeof GLOW === 'undefined' || !GLOW || !GLOW.mesh)
      throw new Error('there is no GLOW at all');
    const gm = GLOW.mesh;
    if(!gm.isInstancedMesh)
      throw new Error('the glow is a ' + gm.type + ', not an InstancedMesh');
    /* ONE draw call is the whole performance argument, so it is the thing
       asserted: one batch in the scene, one material, one geometry.  A second
       glow mesh doubles exactly the cost this ruling exists to bound. */
    let batches = 0;
    scene.traverse(o=>{ if(o.isInstancedMesh && o.name === 'glow') batches++; });
    if(batches !== 1) throw new Error(batches + ' glow batches in the scene, not one');
    if(Array.isArray(gm.material)) throw new Error('the glow carries a material array');
    const mat = gm.material;
    if(mat.blending !== THREE.AdditiveBlending) throw new Error('the glow is not additive');
    if(mat.depthWrite !== false) throw new Error('the glow writes depth');
    if(mat.side !== THREE.FrontSide)
      throw new Error('a camera-facing plane needs one face, side is ' + mat.side);
    if(mat.toneMapped !== false)
      throw new Error('RULING DM: additive light is left out of the grade, and this is in');
    /* fogged, and that is a decision: a glow seen across a hazy stage should be
       eaten by the haze the way the lantern behind it is.  Stated here rather
       than left implied — init calls envRecollect, which walks the scene and
       would reach this material even if glowBuild forgot to, so this clause
       records the intent and the DL coverage clause above is the real guard. */
    if(!mat.userData.atmHooked)
      throw new Error('the glow material never reached envTrack, so it is fogged by nothing');
    /* the geometry is one quad and nothing else — 4 vertices, 2 triangles */
    const pos = gm.geometry.attributes.position;
    if(!pos || pos.count !== 4)
      throw new Error('the glow geometry has ' + (pos ? pos.count : 0) + ' vertices, not a quad');
    /* r128's InstancedMesh constructor already sets this, so the clause can
       only fail against a build that turns culling back ON.  That is what it
       is for: a batch whose instances move every frame must never be culled
       from a base-geometry bounding sphere (TRAPS, first entry), and later
       three.js dropped the constructor default. */
    if(gm.frustumCulled !== false) throw new Error('the glow batch is still frustum culled');
    const rays = [];
    gm.raycast(new THREE.Raycaster(), rays);
    if(rays.length) throw new Error('the glow answers raycasts — it is a grab and a ground hit');
    if(!gm.instanceColor)
      throw new Error('the glow carries no instanceColor, so every emitter is white');
    if(!(GLOW.max >= FIXTURES.length))
      throw new Error('the batch holds ' + GLOW.max + ' instances for ' + FIXTURES.length + ' fixtures');
    /* THE HALO CLEARS THE HOUSING, PINNED TO THE THING THAT ALREADY DOES.
       f._org is f.group's world position and it sits inside the lantern body;
       depthTest is on, so a halo centred there is occluded by its own housing,
       and the brightest part of a radial gradient is the part that gets buried.
       f.glow — the per-fixture LENS quad — already solves this with a local z of
       0.4 (0.24 on a cyc), a number that has been through a headset.  Whether a
       given offset is really unoccluded is a rasteriser question and jsdom has
       no rasteriser, so what is asserted is the RELATIONSHIP the comment in p4
       claims: the halo goes no closer in than the lens flare does, on any
       fixture.  Move f.glow.position.z out and this fires. */
    if(typeof GLOW_LENS_OUT === 'undefined')
      throw new Error('GLOW_LENS_OUT is not in the build at all');
    const tight = FIXTURES.filter(f=>f.glow && f.glow.position.z > GLOW_LENS_OUT);
    if(tight.length)
      throw new Error(tight.length + ' fixtures carry a lens flare further out (' +
        tight[0].glow.position.z + ') than the halo at ' + GLOW_LENS_OUT);
    return GLOW.max + ' instances, one draw call, ' + pos.count + ' vertices, halo at ' +
           GLOW_LENS_OUT + 'm';
  });

  P('a dark rig draws no glow at all, and a lit one draws its lit fixtures only', ()=>{
    /* driven through the REAL frame — updateFades then updateRig — because the
       claim is that the ENGINE truncates, not that a plot says so (TRAPS) */
    const keepB = RIG.blackout, keepG = RIG.grand, keepL = FIXTURES.map(f=>f.level);
    let clock = 0;
    const step = ()=>{ clock += 0.05; updateFades(0.05); updateRig(0.05, clock); };
    RIG.blackout = true; RIG.grand = 1;
    FIXTURES.forEach(f=>{ f.level = 0; });
    for(let i=0;i<30;i++) step();
    const dark = GLOW.mesh.count;
    RIG.blackout = false;
    FIXTURES[0].level = 1; FIXTURES[1].level = 1; FIXTURES[2].level = 1;
    for(let i=0;i<30;i++) step();
    const lit = GLOW.mesh.count;
    RIG.blackout = keepB; RIG.grand = keepG;
    FIXTURES.forEach((f,i)=>{ f.level = keepL[i]; });
    for(let i=0;i<20;i++) step();
    if(dark !== 0)
      throw new Error('a blacked-out rig still draws ' + dark + ' glow instances of ' + FIXTURES.length);
    if(lit !== 3)
      throw new Error('three lit fixtures drew ' + lit + ' glow instances');
    return 'blackout 0, three lit 3, of ' + FIXTURES.length + ' fixtures';
  });

  P('the glow clamps AT the declared share of the screen, measured not restated', ()=>{
    if(typeof GLOW_MAX_FRAC === 'undefined')
      throw new Error('GLOW_MAX_FRAC is not in the build at all');
    /* THE FIRST VERSION OF THIS CASE RECOMPUTED dist*tanHalf*2*GLOW_MAX_FRAC —
       the production line character for character — so dropping the *2 from the
       engine dropped it from the test too and both clauses stayed green.  It
       proved the clamp BOUND without proving what it bound to.  So: project the
       quad the batch will really draw and measure the share of the viewport it
       covers.  The viewport spans 2 NDC units top to bottom, hence the /2.
       Names the game does not use — a probe-scope helper that shadows a game
       function is silently wrong for every case below it. */
    const dnMat = (i)=> new THREE.Matrix4().fromArray(GLOW.mesh.instanceMatrix.array, i*16);
    const dnFrac = (i)=>{
      const m4 = dnMat(i);
      let lo = 9e9, hi = -9e9;
      const corners = [[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]];
      for(const c of corners){
        const v = new THREE.Vector3(c[0], c[1], 0).applyMatrix4(m4).project(camera);
        lo = Math.min(lo, v.y); hi = Math.max(hi, v.y);
      }
      return (hi - lo)/2;
    };
    const dnAim = (from, at)=>{
      camera.position.copy(from); camera.lookAt(at);
      camera.updateMatrixWorld(true);
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    };
    const keepB = RIG.blackout, keepG = RIG.grand, keepL = FIXTURES.map(f=>f.level),
          keepPos = camera.position.clone(), keepQ = camera.quaternion.clone();
    let clock = 0;
    const step = ()=>{ clock += 0.05; updateFades(0.05); updateRig(0.05, clock); };
    RIG.blackout = false; RIG.grand = 1;
    FIXTURES.forEach(f=>{ f.level = 0; });
    FIXTURES[0].level = 1;
    for(let i=0;i<20;i++) step();
    /* where the batch put it — read off the drawn matrix, so the lens offset
       is not restated here either */
    const gp = new THREE.Vector3().setFromMatrixPosition(dnMat(0));
    /* far off, dead on axis: the clamp must NOT be biting, or a build that
       simply drew a fixed small quad would satisfy the clause below */
    dnAim(gp.clone().add(new THREE.Vector3(0, 0, 40)), gp);
    for(let i=0;i<3;i++) step();
    dnAim(gp.clone().add(new THREE.Vector3(0, 0, 40)), gp);
    const far = dnFrac(0);
    /* and up against the lens, which is where he stands to look at the neon */
    dnAim(gp.clone().add(new THREE.Vector3(0, 0, 0.9)), gp);
    for(let i=0;i<3;i++) step();
    dnAim(gp.clone().add(new THREE.Vector3(0, 0, 0.9)), gp);
    const near = dnFrac(0);
    camera.position.copy(keepPos); camera.quaternion.copy(keepQ);
    camera.updateMatrixWorld(true);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    RIG.blackout = keepB; RIG.grand = keepG;
    FIXTURES.forEach((f,i)=>{ f.level = keepL[i]; });
    for(let i=0;i<20;i++) step();
    if(!(far < GLOW_MAX_FRAC*0.5))
      throw new Error('40m away the glow already covers ' + (far*100).toFixed(1) +
        '% of the view against a limit of ' + (GLOW_MAX_FRAC*100).toFixed(1) +
        '% — the clamp is on everywhere, so it is a shrink and not a clamp');
    if(Math.abs(near - GLOW_MAX_FRAC) > 0.004)
      throw new Error('at 0.90m the glow covers ' + (near*100).toFixed(1) +
        '% of the view height, not the declared ' + (GLOW_MAX_FRAC*100).toFixed(1) + '%');
    return 'far ' + (far*100).toFixed(1) + '% of the view, near ' +
           (near*100).toFixed(1) + '% against a declared ' + (GLOW_MAX_FRAC*100).toFixed(1) + '%';
  });

  P('dropped lights past GLOW_CAP truncate by rank, not by array order (DN+DQ)', ()=>{
    /* THE SEAM NEITHER RULING TESTED.  DN sized the halo buffer at GLOW_CAP 64
       against a 39-point rig; DQ lets you drop as many lights as you like, and
       every drop eats that headroom.  DQ was built before DN existed and its
       author flagged the risk that overflow would truncate in FIXTURES order —
       which would mean the halo you dropped last never glows however bright it
       is, while a dark rig lantern keeps a slot.

       It does not, and this is the clause that says so: the same rank DN uses
       for the session cap governs the buffer limit too, because the guard is
       a length-against-cap test and cap falls back to GLOW.max.  A near,
       bright drop must keep its halo when the batch is over-subscribed. */
    if(typeof lightAdd !== 'function') throw new Error('RULING DQ is not in this build');
    const before = FIXTURES.length, keepLvl = FIXTURES.map(f=>f._lvl);
    camera.position.set(0, 1.6, 6); camera.lookAt(0, 5, 0);
    camera.updateMatrixWorld(true);
    const drops = [];
    const need = (GLOW_CAP - before) + 6;      // over-subscribe, whatever the rig is
    /* THE PLACEMENT IS THE WHOLE TEST, and the first version of it proved
       nothing.  Spread evenly, the nearest drop landed EARLY in FIXTURES and
       survived array-order truncation too — so the assertion passed against
       the very build it was written to catch, and only the negative check
       said so.  The near one is therefore appended LAST, out past the buffer
       limit, where rig order is guaranteed to cut it and rank is guaranteed
       to keep it. */
    for(let i=0;i<need-1;i++)
      drops.push(lightAdd({kind:'PointLight', pos:new THREE.Vector3(-30 + i*0.3, 14, -22)}));
    const near = lightAdd({kind:'PointLight', pos:new THREE.Vector3(0, 2.2, 4.2)});
    drops.push(near);
    if(FIXTURES.length <= GLOW_CAP)
      throw new Error('only ' + FIXTURES.length + ' fixtures, never over-subscribed');
    if(FIXTURES.indexOf(near) < GLOW_CAP)
      throw new Error('the near drop sits at index ' + FIXTURES.indexOf(near) +
                      ', inside the cap, so rig order would keep it anyway');
    /* light everything, so the cap is choosing rather than the levels */
    FIXTURES.forEach(f=>{ f._lvl = 0.9; });
    glowUpdate(camera);
    const drawn = GLOW.mesh.count;
    if(drawn > GLOW_CAP)
      throw new Error('the batch drew ' + drawn + ', past its own buffer of ' + GLOW_CAP);
    if(drawn !== GLOW_CAP)
      throw new Error('over-subscribed, the batch drew ' + drawn + ' of ' + GLOW_CAP);
    const kept = _glit.slice(0, drawn);
    if(kept.indexOf(near) === -1)
      throw new Error('the nearest dropped light lost its halo to something further away');
    drops.forEach(f=>lightRemove(f));
    FIXTURES.forEach((f,i)=>{ f._lvl = keepLvl[i]; });
    if(FIXTURES.length !== before)
      throw new Error('removing the drops left ' + FIXTURES.length + ', not ' + before);
    glowUpdate(camera);
    return need + ' drops over the cap, ' + drawn + ' drawn, the nearest kept';
  });

  console.log('--- RULING DR: a lens quad that is dark does not draw ---');

  P('every lens quad in a dark rig is out of the frame, and one fader draws one', ()=>{
    /* AN ADDITIVE QUAD AT OPACITY ZERO STILL RASTERISES AND STILL COSTS A DRAW
       CALL.  RULING DN makes the rasterise half of that point about the halo —
       which is why the batch truncates count instead of fading instances away —
       the draw-call half is DR's own.  The 39 per-fixture
       LENS quads were the one thing in the rig that had never been told: their
       opacity was driven every frame and their visible flag was never written
       once, so a blackout submitted the whole rig's lenses for nothing.  The
       beam beside them and the floor pool below them are both gated on the same
       0.004, and now so is this.

       Driven through the REAL fader path — setSection/setLevel, then the frame
       updateFades -> updateRig — because the claim is that the ENGINE stops
       drawing them.  Poking f._lvl would test the line and not the rig, and a
       test that reads back what it wrote proves only that assignment works
       (TRAPS).  Names the game does not use, for the shadowing trap. */
    const keepB = RIG.blackout, keepG = RIG.grand,
          keepL = FIXTURES.map(f=>f.level),
          keepS = SECTIONS.map(s=>s.level);
    let clock = 0;
    const drStep = ()=>{ clock += 0.05; updateFades(0.05); updateRig(0.05, clock); };
    /* the blackout is taken on the FADERS, the desk's own road to nothing.  The
       sys sections (house, work, lobby, backstage) are left alone on purpose:
       setSection writes HOUSE and calls syncMasters, and this case has no
       business turning the building's lights off behind the later ones. */
    RIG.blackout = false; RIG.grand = 1;
    SECTIONS.filter(s=>!s.sys).forEach(s=>setSection(s, 0, 0));
    for(let i=0;i<20;i++) drStep();
    const drDrawn = FIXTURES.filter(f=>f.glow && f.glow.visible);
    /* the sample is taken HERE, in the blackout — read at the throw below it
       would report the opacity of the restored rig and name a level nobody in
       this case ever set */
    const drSample = drDrawn.length
      ? drDrawn[0].name + ' at opacity ' + drDrawn[0].glow.material.opacity : '';
    /* one channel up, on its fader, well past the gate's threshold */
    const drUp = chan(1), drOther = chan(FIXTURES.length);
    setLevel(1, 0.5, 0);
    for(let i=0;i<20;i++) drStep();
    const drLit = drUp.glow.visible, drDark = drOther.glow.visible, drLvl = drUp._lvl;
    /* and back down the way it came up, so the gate is a gate in both
       directions rather than a flag written once */
    setLevel(1, 0, 0);
    for(let i=0;i<20;i++) drStep();
    const drBack = drUp.glow.visible;
    RIG.blackout = keepB; RIG.grand = keepG;
    SECTIONS.forEach((s,i)=>{ s.level = keepS[i]; });
    FIXTURES.forEach((f,i)=>{ f.level = keepL[i]; f.lvlDur = 0; });
    for(let i=0;i<20;i++) drStep();
    if(drDrawn.length)
      throw new Error(drDrawn.length + ' of ' + FIXTURES.length + ' lens quads are still ' +
        'drawn with every rig fader at zero (' + drSample + ')');
    if(!(drLvl > 0.004))
      throw new Error('the fader never reached the rig: channel 1 reads ' + drLvl);
    if(!drLit)
      throw new Error('channel 1 is up at ' + drLvl.toFixed(2) + ' and its lens quad is not drawn');
    if(drDark)
      throw new Error('channel ' + FIXTURES.length + ' stayed dark and its lens quad is drawn anyway');
    if(drBack)
      throw new Error('channel 1 came back to zero and its lens quad is still drawn');
    return FIXTURES.length + ' quads dark and undrawn, one fader at ' +
           drLvl.toFixed(2) + ' drew exactly its own';
  });

  console.log('--- RULING DO: the LIGHTING page on the desk ---');

  P('the page and its nav button exist, and it is NOT the LIGHTS page', ()=>{
    const page = document.querySelector('#p-lighting');
    if(!page) throw new Error('there is no LIGHTING page');
    if(!document.querySelector('[data-p="lighting"]'))
      throw new Error('the LIGHTING page has no nav button, so it cannot be opened');
    if(!document.querySelector('#p-lights'))
      throw new Error('the LIGHTS page vanished');
    if(page === document.querySelector('#p-lights'))
      throw new Error('LIGHTING and LIGHTS are the same page');
    const rows = page.querySelectorAll('input[type="range"]');
    if(rows.length < 8)
      throw new Error('the panel has only ' + rows.length + ' property rows');
    return rows.length + ' rows, on its own page';
  });

  P('moving a row moves the REAL constant, driven through the DOM', ()=>{
    /* through the DOM and not the model: a detached row fires its handler
       perfectly well, and that is exactly how the fly rail once "worked"
       while nobody could see it (TRAPS) */
    const drive = (sel, raw)=>{
      const inp = document.querySelector(sel);
      if(!inp) throw new Error('no row at ' + sel);
      inp.value = String(raw);
      inp.oninput({target:inp});
    };
    const keepSat = GRADE.sat, keepExp = renderer.toneMappingExposure,
          keepEnv = ENV_INTENSITY, keepHaze = ATM.haze, keepH = HOUSE.house;
    drive('#lkSat', 40);
    if(Math.abs(GRADE.sat - 0.4) > 1e-6)
      throw new Error('saturation row left GRADE.sat at ' + GRADE.sat);
    drive('#lkExp', 180);
    if(Math.abs(renderer.toneMappingExposure - 1.8) > 1e-6)
      throw new Error('exposure row left the renderer at ' + renderer.toneMappingExposure);
    drive('#lkEnv', 120);
    if(Math.abs(ENV_INTENSITY - 1.2) > 1e-6)
      throw new Error('environment row left ENV_INTENSITY at ' + ENV_INTENSITY);
    drive('#lkHaze', 300);
    if(Math.abs(ATM.haze - 3.0) > 1e-6)
      throw new Error('haze row left ATM.haze at ' + ATM.haze);
    drive('#lkBright', 40);
    if(Math.abs(HOUSE.house - 0.4) > 1e-6)
      throw new Error('brightness row left HOUSE.house at ' + HOUSE.house);
    GRADE.sat = keepSat; renderer.toneMappingExposure = keepExp;
    ENV_INTENSITY = keepEnv; ATM.haze = keepHaze; HOUSE.house = keepH;
    lkSync();
    return 'five rows reach five real constants';
  });

  P('lkSet is the ONE clamp, so the headset cannot outrun the desk', ()=>{
    /* RULING DP will call this same function.  A VR row that can drive a
       constant past the desk's own range is two controls wearing one name. */
    const keep = GRADE.sat;
    lkSet('sat', 99);
    if(GRADE.sat !== LK.sat.max)
      throw new Error('a huge value left GRADE.sat at ' + GRADE.sat + ', not ' + LK.sat.max);
    lkSet('sat', -99);
    if(GRADE.sat !== LK.sat.min)
      throw new Error('a huge negative left GRADE.sat at ' + GRADE.sat);
    lkSet('sat', NaN);
    if(GRADE.sat !== LK.sat.min)
      throw new Error('NaN moved the constant to ' + GRADE.sat);
    GRADE.sat = keep; lkSync();
    return 'clamped both ways, and NaN is refused';
  });

  P('ClockTime drives the ARC foyer and leaves the Palace alone', ()=>{
    /* the row exists because the Arc has a GLAZED foyer.  If it moved nothing
       it would be the silently-dead control RULING DQ argues against. */
    if(typeof houseDaylight !== 'function')
      throw new Error('there is no daylight term at all');
    const noon = houseDaylight(12), night = houseDaylight(2);
    if(!(noon > night + 0.2))
      throw new Error('noon ' + noon.toFixed(2) + ' is not brighter than 02:00 ' + night.toFixed(2));
    const keepVen = VENUE, keepClock = HOUSE.clock, keepLobby = HOUSE.lobby;
    HOUSE.lobby = 1;
    const read = ()=>{ updateRig(0.05, 1); return FOH.lamps ? FOH.lamps[0].intensity : null; };
    VENUE = 'palace';
    HOUSE.clock = 12; const palaceNoon = read();
    HOUSE.clock = 2;  const palaceNight = read();
    VENUE = 'arc';
    HOUSE.clock = 12; const arcNoon = read();
    HOUSE.clock = 2;  const arcNight = read();
    VENUE = keepVen; HOUSE.clock = keepClock; HOUSE.lobby = keepLobby;
    updateRig(0.05, 1); lkSync();
    if(palaceNoon === null) throw new Error('no FOH lamps to measure');
    if(Math.abs(palaceNoon - palaceNight) > 1e-6)
      throw new Error('the windowless Palace changed with the clock: ' +
        palaceNoon.toFixed(3) + ' against ' + palaceNight.toFixed(3));
    if(!(arcNoon > arcNight + 1e-3))
      throw new Error('the Arc foyer ignored the clock: noon ' +
        arcNoon.toFixed(3) + ' against 02:00 ' + arcNight.toFixed(3));
    return 'Arc ' + arcNight.toFixed(2) + ' at 02:00 -> ' + arcNoon.toFixed(2) +
           ' at noon, Palace unmoved';
  });

  P('the desk redraws itself when a constant moves underneath it', ()=>{
    /* the headset will drive these too (DP), so the desk cannot cache what it
       last wrote — it has to read the constant back */
    const keep = ATM.haze;
    ATM.haze = 2.5; lkSync();
    const shown = document.querySelector('#lkHazeV').textContent;
    if(shown.indexOf('2.5') !== 0)
      throw new Error('the row still reads ' + shown + ' after the constant moved');
    ATM.haze = keep; lkSync();
    return 'the row follows the constant, not the last click';
  });

  window.__out = { fatal: window.__fatal||null,
    frames:n,
    cameraPos:[+camera.position.x.toFixed(2),+camera.position.y.toFixed(2),+camera.position.z.toFixed(2)],
    playerPos:[+Player.pos.x.toFixed(2),+Player.pos.y.toFixed(2),+Player.pos.z.toFixed(2)],
    onGround:Player.onGround, mode:Player.mode, yaw:Player.yaw,
    groundHere:groundAt(Player.pos.x,Player.pos.z,Player.pos.y),
    walkable:WALKABLE.length,
    seats: window.SEAT_COUNT,
    drawables:(function(){let m=0,inst=0,instTot=0;scene.traverse(o=>{if(o.isInstancedMesh){inst++;instTot+=o.count;}else if(o.isMesh)m++;});
      return {plainMeshes:m, instancedMeshes:inst, instancesTotal:instTot, totalDraws:m+inst};})(),
    triangles:(function(){let t=0;scene.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.index){
      t+=(o.geometry.index.count/3)*(o.isInstancedMesh?o.count:1);}else if(o.isMesh&&o.geometry&&o.geometry.attributes.position){
      t+=(o.geometry.attributes.position.count/3)*(o.isInstancedMesh?o.count:1);}});return Math.round(t);})(),
    staticLocked:(function(){let n=0;scene.traverse(o=>{if(o.matrixAutoUpdate===false)n++;});return n;})(),
    houseLevel:HOUSE.house, houseLightIntensity:houseLights[0].intensity,
    litFixtures:FIXTURES.filter(f=>f.level>0.01).length,
    poolIntensities:LIGHT_POOL.map(l=>+l.intensity.toFixed(2)),
    totalLights:(function(){let n=0;scene.traverse(o=>{if(o.isLight)n++;});return n;})(),
    liveFixtures:FIXTURES.filter(f=>f._live).map(f=>f.ch),
    sceneChildren:scene.children.length, worldChildren:world.children.length,
    renderCalls:renderer.renderCount,
    veil:document.querySelector('#veil').style.display,
    canvasParent: renderer.domElement.parentNode ? renderer.domElement.parentNode.id : null,
    dockHidden: document.querySelector('#dock').className
  };
})();
`;
const blocks = html.match(/<script>[\s\S]*?<\/script>/g).map(b=>b.replace(/^<script>/,'').replace(/<\/script>$/,''));
const js = 'window.FATAL=function(t,d){ window.__fatal=(t+" :: "+d); };\n' + blocks[blocks.length-1];
try { w.eval(js + probe); console.log('=== TOP LEVEL + init() OK ==='); }
catch(e){ console.log('!! CONSTRUCTION ERROR: '+e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
console.log('--- failures: '+(w.__errs||[]).length+' ---');
(w.__errs||[]).forEach(e=>console.log('  '+e));
process.exit((w.__errs||[]).length?1:0);
