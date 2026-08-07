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
  P('LOCK takes on one click and blocks the move', ()=>{
    const ls = FLY[3];
    const b = document.querySelectorAll('#lsTable tbody tr')[3].querySelectorAll('button');
    b[3].click();
    if(!ls.locked) throw new Error('lock did not take');
    const t = ls.target; b[0].click();
    if(ls.target !== t) throw new Error('locked lineset still moved');
    b[3].click();
    if(ls.locked) throw new Error('did not unlock');
    return 'locks and unlocks';
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
    const txt = row.querySelector('.ht').textContent;
    if(Math.abs(parseFloat(txt) - FOHBAR.y) > 0.15)
      throw new Error('the readout says '+txt+' and the bar is at '+FOHBAR.y.toFixed(2));
    return 'home at '+txt;
  });
  P('the bar will not go below heads or above home', ()=>{
    fohBarTo(-99);
    if(Math.abs(FOHBAR.target - FOHBAR.min) > 1e-9)
      throw new Error('drove to '+FOHBAR.target.toFixed(2)+' past the floor clamp '+FOHBAR.min.toFixed(2));
    fohBarTo(99);
    if(Math.abs(FOHBAR.target - FOHBAR.max) > 1e-9)
      throw new Error('drove to '+FOHBAR.target.toFixed(2)+' past the top clamp');
    if(FOHBAR.min < 3.2) throw new Error('the floor clamp '+FOHBAR.min.toFixed(2)+' is in the audience');
    for(let i=0;i<40;i++) updateRig(0.05, 1);
    return 'clamped '+FOHBAR.min.toFixed(2)+' .. '+FOHBAR.max.toFixed(2);
  });
  console.log('--- hauling + shift lock ---');
  P('hold LMB on an unlocked lineset hauls it', ()=>{
    const ls = FLY[9]; ls.locked=false; ls.target = ls.pos = 14.0;
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
  P('a LOCKED lineset refuses to be hauled', ()=>{
    const ls = FLY[4]; ls.locked = true; const before = ls.target;
    hoverInfo = {kind:'lineset', ls:ls};
    dom.dispatchEvent(new window.MouseEvent('mousedown',{button:0,bubbles:true}));
    if(flyDrag) throw new Error('grabbed a locked lineset');
    for(let i=0;i<20;i++) window.dispatchEvent(new window.MouseEvent('mousemove',{bubbles:true, movementY:-10}));
    window.dispatchEvent(new window.MouseEvent('mouseup',{bubbles:true}));
    ls.locked = false;
    if(Math.abs(ls.target-before) > 0.001) throw new Error('locked lineset moved');
    return 'held fast';
  });
  P('hauling respects the travel limits', ()=>{
    const ls = FLY[9]; hoverInfo = {kind:'lineset', ls:ls};
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
    const run = ls => { ls.locked=false; ls.target = 12.0; hoverInfo={kind:'lineset', ls:ls};
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
    setSection(SECTIONS[6], 0.5, 0); setSection(SECTIONS[7], 0.25, 0);
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
  P('nothing is left behind the stage', ()=>{
    // no floor and no walkable surface anywhere upstage of the back wall
    for(const z of [D.backWall - 2, D.backWall - 8, D.backWall - 18])
      for(const x of [-12, 0, 12])
        if(groundAt(x, z, 2) !== null)
          throw new Error('still a floor behind the stage at '+x+','+z);
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
  P('the upstage wall is solid', ()=>{
    for(const x of [0, 6, 11.5, -11.5, 18]){
      if(!backWallBlocks(x, D.backWall-1, D.backWall+1))
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
    // the shed is gone: nothing in its group, and no floor to stand on back there
    if(shopGroup.children.length)
      throw new Error(shopGroup.children.length+' bits of the old shed are still there');
    for(const z of [D.backWall - 4, D.backWall - 12, D.backWall - 24])
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
  P('the only stations left are the dock doors', ()=>{
    const seen = [];
    world.traverse(o=>{ if(o.userData && o.userData.station) seen.push(o.userData.station.id); });
    if(!seen.length) throw new Error('no stations at all');
    if(seen.some(id=>id.indexOf('dock') !== 0))
      throw new Error('a bench station survived: '+seen.filter(id=>id.indexOf('dock')!==0).join(', '));
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
  P('a locked lineset sits the call out', ()=>{
    initHang();
    const list = railGroup('electrics');
    const victim = list[0];
    victim.locked = true;
    const held = victim.target;
    const r = railCall('electrics','out');
    if(r.locked !== 1) throw new Error('the call did not report the lock');
    if(Math.abs(victim.target - held) > 0.01) throw new Error('the locked lineset moved anyway');
    victim.locked = false;
    railCall('electrics','in');
    return 'locked one held at '+held.toFixed(1)+'m while '+r.moved+' others moved';
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
