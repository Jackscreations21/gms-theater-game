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
/* a stubbed WebXR manager: enough of one that the VR module can be driven
   from a test without a headset in the room */
class FakeXR {
  constructor(){
    this.enabled = false; this._h = {}; this._ctrl = []; this._grip = [];
    this._session = null; this.refSpace = ''; this.foveation = 0;
  }
  addEventListener(k, fn){ (this._h[k] = this._h[k] || []).push(fn); }
  fire(k){ (this._h[k]||[]).forEach(f=>f()); }
  getController(i){ return this._ctrl[i] || (this._ctrl[i] = new REAL.Group()); }
  getControllerGrip(i){ return this._grip[i] || (this._grip[i] = new REAL.Group()); }
  setReferenceSpaceType(t){ this.refSpace = t; }
  setSession(s){ this._session = s; return Promise.resolve(); }
  getSession(){ return this._session; }
  setFoveation(v){ this.foveation = v; }
  setFramebufferScaleFactor(v){ this.fbScale = v; }
}
THREE.WebGLRenderer = class {
  constructor(){ const c = w.document.createElement('canvas');
    c.requestPointerLock = ()=>{};
    this.domElement = c; this.shadowMap = {enabled:false, type:0};
    this.renderCount = 0; this.xr = new FakeXR(); this._loop = null; this._pr = 1;
    /* the real WebGLRenderer carries render statistics and this stub did not,
       so vrPerf (RULING DJ) had nothing to read.  Left plainly settable: the
       meter's job is to report whatever the renderer says, and a test that
       sets a distinctive number and looks for it on the wrist is testing the
       wiring rather than three.js's counting. */
    this.info = {render:{calls:0, triangles:0, frame:0, lines:0, points:0},
                 memory:{geometries:0, textures:0}}; }
  setPixelRatio(v){ this._pr = v; } getPixelRatio(){ return this._pr; }
  setSize(){}
  setAnimationLoop(fn){ this._loop = fn; }
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
w.navigator.xr = {
  isSessionSupported: ()=>Promise.resolve(true),
  requestSession: ()=>Promise.resolve({ inputSources: [], end(){} })
};
w.THREE = THREE;
w.AudioContext = undefined;
w.requestAnimationFrame = cb => { w.__raf = cb; return 1; };

const probe = `
;(function(){
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  window.__errs = [];
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,200):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message);
      if(e.stack) console.log('      '+e.stack.split(String.fromCharCode(10)).slice(1,3).join(' | '));
      window.__errs.push(name+': '+e.message); } };
  const run = (n, dt)=>{ for(let i=0;i<n;i++){ updateFades(dt); updateFly(dt); vrUpdate(dt); } };
  /* pretend a headset is on: the runtime fires sessionstart, and the sticks
     come off a fake input source */
  const sticks = {left:[0,0,0,0], right:[0,0,0,0]};
  const btns = {left:  [0,1,2,3,4,5].map(()=>({pressed:false})),
                right: [0,1,2,3,4,5].map(()=>({pressed:false}))};
  const enterVR = ()=>{
    renderer.xr._session = {
      inputSources: [
        {handedness:'left',  gamepad:{axes:sticks.left,  buttons:btns.left}},
        {handedness:'right', gamepad:{axes:sticks.right, buttons:btns.right}}
      ],
      /* what a Quest 3 offers, deliberately unsorted: the game must pick
         the LOWEST rate at or above 72, not the first it happens upon */
      supportedFrameRates: [90, 120, 80, 72],
      updateTargetFrameRate(r){
        (this.ratesAsked = this.ratesAsked || []).push(r);
        return Promise.resolve();
      }
    };
    renderer.xr.fire('sessionstart');
  };
  const exitVR = ()=>{ renderer.xr._session = null; renderer.xr.fire('sessionend'); };
  const stick = (hand, x, y)=>{ sticks[hand][2] = x; sticks[hand][3] = y; };
  /* one press-and-release of the A button, one frame each */
  const tapA = ()=>{
    btns.right[4].pressed = true;  vrUpdate(0.016);
    btns.right[4].pressed = false; vrUpdate(0.016);
  };

  console.log('--- vr: getting in ---');

  P('the desktop is untouched until a session starts', ()=>{
    if(VR.active) throw new Error('it thinks it is in VR already');
    goToView(1);
    updatePlayer(0.016);
    const p = camera.position.clone();
    if(Math.abs(p.y - (Player.pos.y + Player.eye)) > 0.2)
      throw new Error('the camera is not being placed the desktop way');
    if(!renderer.shadowMap.enabled && VR.saved)
      throw new Error('the VR quality tier is applied on the desktop');
    return 'camera at eye height, nothing switched off';
  });

  P('a session builds a rig and puts the camera inside it', ()=>{
    enterVR();
    if(!VR.active) throw new Error('sessionstart did not take');
    if(!VR.rig) throw new Error('no rig');
    if(camera.parent !== VR.rig)
      throw new Error('the camera is still hanging off ' + (camera.parent && camera.parent.name));
    goToView(1);
    updatePlayer(0.016);
    if(VR.rig.position.distanceTo(Player.pos) > 0.01)
      throw new Error('the rig is not where the player is');
    if(Math.abs(VR.rig.rotation.y - Player.yaw) > 0.001)
      throw new Error('the rig is not facing where the player faces');
    return 'rig at the player, camera inside it';
  });

  P('the rail wakes up locked, and every lever stands upright', ()=>{
    /* a counterweight rail at rest is locked off, so the ropes a session
       builds must all carry their levers IN — straight up */
    /* only the counterweight lines carry a lever — a rope without one
       (a hand line, if the stage has one) has no lock to stand upright */
    const rail = VR.ropes.filter(r=>r.lever);
    if(!rail.length) throw new Error('the session built no ropes');
    for(const r of rail){
      if(!r.ls.locked)
        throw new Error('lineset ' + r.ls.id + ' started with its lock off');
      if(r.lever.rotation.z !== 0)
        throw new Error('lineset ' + r.ls.id + ' lever leans at ' +
                        r.lever.rotation.z.toFixed(2) + ' with the lock in');
    }
    return rail.length + ' levers in — the rail is locked off at rest';
  });

  P('the quality tier comes on for the headset', ()=>{
    if(renderer.shadowMap.enabled) throw new Error('shadows are still on');
    if(RIG.shadowBudget !== 0) throw new Error('the shadow budget is ' + RIG.shadowBudget);
    if(!VR.beamCap) throw new Error('the beams are not capped');
    if(camera.far > 200) throw new Error('the far plane is still ' + camera.far);
    if(renderer.xr.foveation < 0.2) throw new Error('foveation was not asked for');
    if(VR.beamCap > 10) throw new Error('the beam cap is ' + VR.beamCap + ' — 10 was the tune-down');
    /* the framebuffer scale must be asked for BEFORE any session existed */
    if(Math.abs((renderer.xr.fbScale || 0) - 0.85) > 0.001)
      throw new Error('framebuffer scale is ' + renderer.xr.fbScale + ', wanted 0.85');
    return 'shadows off, beams capped to ' + VR.beamCap + ', far ' + camera.far +
           ', eyes at ' + renderer.xr.fbScale;
  });

  P('the session is paced at 72Hz, not the 90 it could not hold', ()=>{
    const s = renderer.xr._session;
    if(!s.ratesAsked || !s.ratesAsked.length)
      throw new Error('updateTargetFrameRate was never called');
    if(s.ratesAsked[s.ratesAsked.length-1] !== 72)
      throw new Error('asked for ' + s.ratesAsked.join(',') + ' — wanted 72, the lowest rate at or above 72');
    if(VR.targetHz !== 72)
      throw new Error('VR.targetHz is ' + VR.targetHz);
    return 'asked for 72 of [' + Array.from(s.supportedFrameRates).join(', ') + '], and remembers it';
  });

  P('and only that many beams are ever alight', ()=>{
    FIXTURES.forEach(f=>{ f.level = 1; f.lvlDur = 0; });
    RIG.haze = 1;
    for(let i=0;i<20;i++){ updateFades(0.05); }
    updateRig(0.05, 1);
    vrCapBeams();
    const on = FIXTURES.filter(f=>f.beam && f.beam.visible).length;
    if(on > VR.beamCap) throw new Error(on + ' beams alight, the cap is ' + VR.beamCap);
    FIXTURES.forEach(f=>{ f.level = 0; });
    return on + ' of ' + FIXTURES.length + ' beams alight';
  });

  P('and only four real spotlights back them up in a session', ()=>{
    if(!VR.lightCap) throw new Error('there is no light cap');
    FIXTURES.forEach(f=>{ f.level = 1; f.lvlDur = 0; });
    for(let i=0;i<20;i++){ updateFades(0.05); }
    updateRig(0.05, 1);
    const lit = LIGHT_POOL.filter(l=>l.intensity > 0).length;
    if(lit > 4) throw new Error(lit + ' real lights alight in VR — the cap is 4');
    /* the cap is the session's, not the game's: on the desktop the whole
       pool must come back without a single saved value to restore */
    VR.active = false;
    updateRig(0.05, 1);
    const flat = LIGHT_POOL.filter(l=>l.intensity > 0).length;
    VR.active = true;
    updateRig(0.05, 1);
    if(flat <= 4)
      throw new Error('the desktop only lit ' + flat + ' — the cap leaked out of the session');
    FIXTURES.forEach(f=>{ f.level = 0; });
    return lit + ' of ' + LIGHT_POOL.length + ' spots in VR, all ' + flat + ' on the desktop';
  });

  console.log('--- vr: moving ---');

  P('the left stick walks you and the right stick turns you', ()=>{
    goToView(3);
    const p0 = Player.pos.clone(), y0 = Player.yaw;
    stick('left', 0, -1);            // forward is negative on a thumbstick
    for(let i=0;i<40;i++){ vrUpdate(0.05); updatePlayer(0.05); }
    const walked = Player.pos.distanceTo(p0);
    if(walked < 1) throw new Error('it only walked ' + walked.toFixed(2) + 'm');
    stick('left', 0, 0);
    stick('right', 1, 0);
    for(let i=0;i<20;i++){ vrUpdate(0.05); updatePlayer(0.05); }
    if(Math.abs(Player.yaw - y0) < 0.5)
      throw new Error('it only turned ' + (Player.yaw - y0).toFixed(2) + ' rad');
    stick('right', 0, 0);
    return 'walked ' + walked.toFixed(1) + 'm, turned ' +
           Math.abs(Player.yaw - y0).toFixed(2) + ' rad';
  });

  P('a stick half over walks at half pace', ()=>{
    goToView(3);
    const full = (()=>{ const p = Player.pos.clone(); stick('left', 0, -1);
      for(let i=0;i<20;i++){ vrUpdate(0.05); updatePlayer(0.05); }
      const d = Player.pos.distanceTo(p); stick('left',0,0); return d; })();
    goToView(3);
    const half = (()=>{ const p = Player.pos.clone(); stick('left', 0, -0.5);
      for(let i=0;i<20;i++){ vrUpdate(0.05); updatePlayer(0.05); }
      const d = Player.pos.distanceTo(p); stick('left',0,0); return d; })();
    if(half > full*0.75) throw new Error('half a stick walked ' + half.toFixed(2) +
                                         ' against ' + full.toFixed(2));
    return 'full ' + full.toFixed(2) + 'm, half ' + half.toFixed(2) + 'm';
  });

  P('the walls still stop you in VR', ()=>{
    goToView(3);
    Player.pos.set(0, 0, -14);
    stick('left', 0, -1);
    for(let i=0;i<200;i++){ vrUpdate(0.05); updatePlayer(0.05); }
    stick('left', 0, 0);
    if(Player.pos.z < D.backWall)
      throw new Error('walked through the back wall to z=' + Player.pos.z.toFixed(1));
    return 'stopped at z=' + Player.pos.z.toFixed(1) + ', the wall is ' + D.backWall;
  });

  P('the stick walks where the LEFT CONTROLLER points', ()=>{
    /* build-feel RULING O: point the controller right, push forward, walk
       right — whatever way the headset and the rig happen to face */
    if(typeof vrMoveYaw !== 'function') throw new Error('vrMoveYaw is not defined');
    goToView(3);
    Player.pos.set(2, 0, -6); Player.yaw = 0;
    Player.vel.set(0, 0, 0);
    const c0 = VR.controllers[0];
    const q0 = c0.quaternion.clone();
    c0.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/2); // points +x
    c0.updateMatrixWorld(true);
    stick('left', 0, -1);                     // push straight forward
    for(let i=0;i<20;i++){ vrUpdate(0.05); updatePlayer(0.05); }
    stick('left', 0, 0);
    const dx = Player.pos.x - 2, dz = Player.pos.z + 6;
    if(!(dx > 0.8) || Math.abs(dz) > 0.35*dx)
      throw new Error('walked ('+dx.toFixed(2)+', '+dz.toFixed(2)+') — the rig yaw won');
    /* a controller aimed at the floor has no direction: the headset's yaw
       takes over, and nothing goes NaN */
    Player.pos.set(2, 0, -6);
    c0.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI/2*0.98);
    c0.updateMatrixWorld(true);
    stick('left', 0, -1);
    for(let i=0;i<10;i++){ vrUpdate(0.05); updatePlayer(0.05); }
    stick('left', 0, 0);
    if(isNaN(Player.pos.x) || isNaN(Player.pos.z)) throw new Error('NaN in the walk');
    if(!(Player.pos.z < -6.3))
      throw new Error('the floor-aimed fallback never walked the headset way: z='+Player.pos.z.toFixed(2));
    c0.quaternion.copy(q0);
    c0.updateMatrixWorld(true);
    return 'the controller steers the walk; the floor aim falls back';
  });

  console.log('--- vr: jump and fly ---');

  /* let the player fall to the floor AND run the VR clock on, so a tap in
     one test can never read as the double of a tap in the last one */
  const settle = ()=>{ for(let i=0;i<30;i++){ vrUpdate(0.05); updatePlayer(0.05); } };

  P('a tap of A is a jump', ()=>{
    goToView(3);
    settle();
    if(!Player.onGround) throw new Error('not on the ground to start');
    tapA();
    if(Player.vel.y < 3) throw new Error('vel.y is ' + Player.vel.y.toFixed(2));
    if(VR.fly) throw new Error('one tap put it in the air for good');
    let peak = Player.pos.y;
    for(let i=0;i<60;i++){ updatePlayer(0.05); peak = Math.max(peak, Player.pos.y); }
    if(peak < 0.3) throw new Error('it only rose ' + peak.toFixed(2) + 'm');
    if(!Player.onGround) throw new Error('it never came back down');
    return 'up ' + peak.toFixed(2) + 'm and back on the deck';
  });

  P('two quick taps and you are flying', ()=>{
    goToView(3);
    settle();
    tapA(); tapA();
    if(!VR.fly) throw new Error('two taps did not lift it');
    for(let i=0;i<40;i++){ vrUpdate(0.05); updatePlayer(0.05); }
    if(!VR.fly) throw new Error('flying did not hold with no floor contact');
    tapA(); tapA();
    if(VR.fly) throw new Error('two more taps did not set it down');
    return 'on with two taps, off with two more';
  });

  P('two SLOW taps stay on the ground', ()=>{
    goToView(3);
    settle();
    tapA();
    for(let i=0;i<12;i++){ vrUpdate(0.05); updatePlayer(0.05); }   // 0.6s between
    tapA();
    if(VR.fly) throw new Error('a slow pair of taps went flying');
    for(let i=0;i<60;i++){ updatePlayer(0.05); }
    return 'two jumps, no flight';
  });

  P('flying goes where the head looks', ()=>{
    goToView(3);
    settle();
    /* centre stage, facing the open house, so there is room to fly */
    Player.pos.set(0, 0, -5); Player.yaw = Math.PI;
    tapA(); tapA();
    if(!VR.fly) throw new Error('could not take off');
    /* look up 30 degrees and push forward: must climb AND advance */
    camera.rotation.set(0.52, 0, 0);
    const p0 = Player.pos.clone();
    stick('left', 0, -1);
    for(let i=0;i<20;i++){ vrUpdate(0.05); updatePlayer(0.05); }
    stick('left', 0, 0);
    const rose = Player.pos.y - p0.y;
    const flat = Math.hypot(Player.pos.x - p0.x, Player.pos.z - p0.z);
    if(rose < 1) throw new Error('looking up it only rose ' + rose.toFixed(2) + 'm');
    if(flat < 1) throw new Error('it went straight up — no forward drift');
    /* and with the stick centred it hangs there, no gravity */
    const hold = Player.pos.y;
    for(let i=0;i<20;i++){ vrUpdate(0.05); updatePlayer(0.05); }
    if(Math.abs(Player.pos.y - hold) > 0.01) throw new Error('it fell while hovering');
    camera.rotation.set(0, 0, 0);
    return 'rose ' + rose.toFixed(1) + 'm over ' + flat.toFixed(1) + 'm, then hung there';
  });

  P('flying down to the floor lands you walking', ()=>{
    if(!VR.fly) throw new Error('should still be airborne from the last test');
    camera.rotation.set(-1.1, 0, 0);          // look well down
    stick('left', 0, -1);
    let landed = false;
    for(let i=0;i<200 && !landed;i++){ vrUpdate(0.05); updatePlayer(0.05); landed = !VR.fly; }
    stick('left', 0, 0);
    camera.rotation.set(0, 0, 0);
    if(!landed) throw new Error('it never touched down');
    if(!Player.onGround) throw new Error('landed but not on its feet');
    settle();
    if(VR.fly) throw new Error('still flying after the landing');
    return 'touched down at y=' + Player.pos.y.toFixed(2);
  });

  P('the walls still stop you mid-air', ()=>{
    goToView(3);
    settle();
    tapA(); tapA();
    if(!VR.fly) throw new Error('could not take off');
    Player.pos.set(0, 2.5, -10); Player.yaw = 0;
    camera.rotation.set(0, 0, 0);
    stick('left', 0, -1);                     // straight at the back wall
    for(let i=0;i<200;i++){ vrUpdate(0.05); updatePlayer(0.05); }
    stick('left', 0, 0);
    /* the warehouse PR cut a doorway at x=0: the flyer may now nose right up
       to the wall plane (D.backWall - 0.3) where its shut roller door stops
       him, but never through the wall's thickness into the shed */
    /* PAL_BACK: the Palace brick is 4.5m deeper than the stage box */
    if(Player.pos.z < PAL_BACK - 0.35)
      throw new Error('flew through the back wall to z=' + Player.pos.z.toFixed(1));
    tapA(); tapA();                           // back on the ground for the rest
    settle();
    return 'stopped at z=' + Player.pos.z.toFixed(1) + ' at altitude';
  });

  console.log('--- vr: the desks ---');

  P('there is a desk in every house', ()=>{
    if(VR.desks.length < 5) throw new Error('only ' + VR.desks.length + ' desks');
    const labels = VR.desks.map(d=>d.label);
    for(const want of ['THE PALACE'])
      if(!labels.some(l=>l.indexOf(want) === 0)) throw new Error('no desk for ' + want);
    if(!labels.some(l=>/TECH TABLE/.test(l))) throw new Error('no tech table');
    if(!labels.some(l=>/CONTROL ROOM/.test(l))) throw new Error('no control room desk');
    return labels;
  });

  P('each one is in its own room, at a sensible height', ()=>{
    scene.updateMatrixWorld(true);
    const out = [];
    for(const d of VR.desks){
      const p = d.group.getWorldPosition(new THREE.Vector3());
      const g = groundAt(p.x, p.z, p.y + 2);
      if(g === null) throw new Error(d.label + ' has no floor under it');
      if(Math.abs(p.y - g) > 0.7)
        throw new Error(d.label + ' floats ' + (p.y - g).toFixed(2) + 'm off its floor');
      out.push(d.label + ' @ ' + p.y.toFixed(1) + 'm');
    }
    return out;
  });

  P('the Palace desk faces the operator, not the stage', ()=>{
    scene.updateMatrixWorld(true);
    const d = VR.desks.find(x=>x.label.indexOf('THE PALACE') === 0);
    if(!d) throw new Error('no Palace desk');
    /* the raked face is a plane: its world +Z is the way the screen looks.
       The stage is at -z, the house is at +z, so a readable desk points +z
       and the operator stands behind it looking downstage over the top. */
    const n = d.face.getWorldDirection(new THREE.Vector3());
    if(!(n.z > 0.3))
      throw new Error('the screen normal is z=' + n.z.toFixed(3) +
                      ' — it is turned toward the stage, so the operator has their back to it');
    const p = d.group.getWorldPosition(new THREE.Vector3());
    if(Math.abs(p.y - D.mezzY) > 1)
      throw new Error('the desk left the balcony: y=' + p.y.toFixed(2) +
                      ' against mezzY ' + D.mezzY);
    if(Math.abs(p.x) > 0.5)
      throw new Error('the desk is off centre at x=' + p.x.toFixed(2));
    return 'face normal z ' + n.z.toFixed(3) + ', desk at (' +
           p.x.toFixed(2) + ', ' + p.y.toFixed(2) + ', ' + p.z.toFixed(2) + ')';
  });

  P('and all four Arc desks face their operators too', ()=>{
    /* the Arc houses share the Palace's orientation — stage at −z, house
       at +z — so the same ruling holds: a readable screen's world normal
       points UP the house.  All four were built turned to the stage. */
    scene.updateMatrixWorld(true);
    const arcs = VR.desks.filter(x=>x.label.indexOf('THE PALACE') !== 0);
    if(arcs.length !== 4) throw new Error(arcs.length + ' Arc desks, wanted 4');
    const out = [];
    for(const d of arcs){
      const n = d.face.getWorldDirection(new THREE.Vector3());
      if(!(n.z > 0.3))
        throw new Error(d.label + ': screen normal z=' + n.z.toFixed(3) +
                        ' — turned toward the stage, back to the operator');
      out.push(d.label + ' z ' + n.z.toFixed(2));
    }
    return out;
  });

  /* the seat pans: the one instanced batch of BoxGeometry(.50,.13,.60) in M.seat */
  const seatPanMesh = ()=>{
    let found = null, n = 0;
    scene.traverse(c=>{
      if(!c.isInstancedMesh) return;
      const q = c.geometry.parameters || {};
      if(c.material !== M.seat) return;
      if(Math.abs(q.width - 0.50) > 1e-6 || Math.abs(q.height - 0.13) > 1e-6 ||
         Math.abs(q.depth - 0.60) > 1e-6) return;
      found = c; n++;
    });
    if(n !== 1) throw new Error(n + ' seat-pan batches in the scene, wanted 1');
    return found;
  };

  P('the control position on the balcony is clear of seats', ()=>{
    scene.updateMatrixWorld(true);
    const mesh = seatPanMesh();
    const m = new THREE.Matrix4(), v = new THREE.Vector3();
    const q = new THREE.Quaternion(), s = new THREE.Vector3();
    let mezz = 0, inside = 0;
    const worst = [];
    for(let i = 0; i < mesh.count; i++){
      mesh.getMatrixAt(i, m);
      m.decompose(v, q, s);
      v.applyMatrix4(mesh.matrixWorld);
      /* only the balcony bank: a mezz pan sits exactly 0.44 above the mezz
         rake at its own z.  The orchestra shares this x/z footprint four
         metres below and must not be counted either way. */
      if(v.y < D.mezzY - 1.5 || v.y > D.balcY) continue;
      if(Math.abs(v.y - (mezzFloorY(v.z) + 0.44)) > 0.05) continue;
      mezz++;
      if(Math.abs(v.x) <= 2.2 && v.z >= D.mezzZ && v.z <= D.mezzZ + 3.6){
        inside++;
        if(worst.length < 4) worst.push('(' + v.x.toFixed(2) + ',' + v.z.toFixed(2) + ')');
      }
    }
    if(inside) throw new Error(inside + ' seats still standing in the desk keep-out: ' +
                               worst.join(' '));
    if(mezz <= 100) throw new Error('only ' + mezz + ' seats left on the balcony');
    return mezz + ' balcony seats, none of them inside |x|<=2.2 and z ' +
           D.mezzZ + '..' + (D.mezzZ + 3.6);
  });

  P('the console draws, and the buttons on it are hittable', ()=>{
    vrDrawConsole(true);
    if(!VR.canvas) throw new Error('no canvas');
    if(VR.hits.length < 8) throw new Error('only ' + VR.hits.length + ' hit regions');
    const pages = [];
    for(const t of ['cues','lights','fly','shows','venues','smoke','script']){
      VR.page = t; vrDrawConsole(true);
      if(VR.hits.length < 3) throw new Error(t + ' drew ' + VR.hits.length + ' regions');
      pages.push(t + ':' + VR.hits.length);
    }
    VR.page = 'cues'; vrDrawConsole(true);
    return pages;
  });

  P('pressing GO on the console fires the next cue', ()=>{
    goToView(3);
    showLoad('lostboys');
    VR.page = 'cues'; vrDrawConsole(true);
    const before = nextCue;
    // find the GO region and fire it the way a trigger would
    const goHit = VR.hits.find(h=>h.w === 280 && h.h === 120);
    if(!goHit) throw new Error('no GO button on the cue page');
    goHit.fn(goHit.x + 10, goHit.y + 10);
    if(nextCue <= before) throw new Error('the cue did not advance');
    return 'Q' + (CUES[before] ? CUES[before].n : '?') + ' fired, next is Q' +
           (CUES[nextCue] ? CUES[nextCue].n : '—');
  });

  /* RULING BW — and a control that exists only in the DOM does not exist in VR.
     The headset reaches this button far more often than the desk does, so the
     wiring is pinned on BOTH paths: proving cueTop while never proving what
     calls it is the mistake this file has made four times. */
  P('pressing TOP on the console fires the first cue (RULING BW)', ()=>{
    goToView(3);
    showLoad('beetlejuice');
    VR.page = 'cues'; vrDrawConsole(true);
    /* found by MEANING, not by pixel: BACK and TOP are the same 134x56 box, so
       the dimension hunt the GO test uses cannot tell them apart */
    const topHit = VR.hits.find(h=>h.btn === 'top');
    if(!topHit) throw new Error('no TOP button on the cue page');
    const mid = CUES.findIndex(c=>c.at >= 640);
    if(mid < 1) throw new Error('no cue at or past 10:40 to stand on');
    fireCue(mid);
    const midHouse = HOUSE.house;
    if(midHouse === CUES[0].house)
      throw new Error('the mid-show house matches the pre-show, so this proves nothing');
    topHit.fn(topHit.x + 10, topHit.y + 10);
    if(nextCue !== 1)
      throw new Error('the headset TOP left the stack at index ' + nextCue);
    if(HOUSE.house !== CUES[0].house)
      throw new Error('the pre-show look never landed from the headset: house ' + HOUSE.house);
    return 'one press, the first cue fired, house ' + midHouse + ' to ' + HOUSE.house;
  });

  P('the fly page on the desk moves this stage rail', ()=>{
    VR.page = 'fly'; vrDrawConsole(true);
    const ls = FLY[4];
    flyOut(ls); run(600, 0.05);
    // the IN button on row 5
    const rows = VR.hits.filter(h=>h.w === 84);
    if(rows.length < 10) throw new Error('only ' + rows.length + ' row buttons');
    VR.hits.find(h=>h.w === 84 && Math.abs(h.y - (86 + 4*44 + 3)) < 3).fn();
    run(700, 0.05);
    if(Math.abs(ls.pos - inTrimOf(ls)) > 0.3)
      throw new Error('lineset 5 is at ' + ls.pos.toFixed(2));
    return 'lineset 5 in at ' + ls.pos.toFixed(1) + 'm from the desk';
  });

  P('the FOH bar comes down from the desk fly page', ()=>{
    VR.page = 'fly'; vrDrawConsole(true);
    if(typeof FOHBAR === 'undefined' || !FOHBAR) throw new Error('there is no FOH bar');
    /* the RAISE/LOWER pair sits under ALL IN / ALL OUT in the right column */
    const raise = VR.hits.find(h=>h.w === 116 && h.h === 46 && h.y === 86 + 136);
    const lower = VR.hits.find(h=>h.w === 116 && h.h === 46 && h.y === 86 + 190);
    if(!raise || !lower) throw new Error('no RAISE/LOWER pair on the fly page');
    for(let i=0;i<40;i++) updateRig(0.05, 1);
    const y0 = FOHBAR.y;
    const foh = FIXTURES.filter(f=>f.name.indexOf('FOH ') === 0);
    const org0 = foh.map(f=>f._org.y);
    lower.fn();
    for(let i=0;i<120;i++) updateRig(0.05, 1);
    if(!(FOHBAR.y < y0 - 1.0))
      throw new Error('the desk button left the bar at '+FOHBAR.y.toFixed(2));
    foh.forEach((f,i)=>{
      if(!(f._org.y < org0[i] - 1.0)) throw new Error(f.name+' stayed put');
    });
    raise.fn();
    for(let i=0;i<200;i++) updateRig(0.05, 1);
    if(Math.abs(FOHBAR.y - y0) > 0.05) throw new Error('RAISE did not bring it home');
    return 'bar '+y0.toFixed(2)+'m, down 1.2 and home again, six lanterns riding';
  });

  /* ══ RULING CM — AND IT EXISTS IN THE HEADSET ═════════════════════════
     "A control that exists only in the DOM does not exist in VR" is in TRAPS
     with four rounds of unreachable Arc doors behind it.  Found by its META and
     not by its pixel, which is what TRAPS says new screens should do — the
     RAISE/LOWER finds above are the counter-example, and the reason this button
     went at the foot of the column rather than under ALL OUT. */
  P('the fly rail START OF SHOW call is reachable in a headset too', ()=>{
    showLoad('beetlejuice');
    VR.page = 'fly'; vrDrawConsole(true);
    const btn = VR.hits.find(h=>h.railCall === 'startOfShow');
    if(!btn) throw new Error('no start-of-show call on the VR fly page');
    if(!CUES.length || !CUES[0].fly) throw new Error('no fly snapshot on cue 0');
    const want = CUES[0].fly.slice();
    /* off cue 0 first — see the writeup in tests/show.js: the board stands AT
       cue 0 after a load, so "it did not fire cue 0" is unobservable there */
    const mid = CUES.findIndex(c=>c.lx && c.lx.some(x=>x.lvl > 0.5) && c.n > 3);
    if(mid < 0) throw new Error('no lit mid-show cue to run the board on to');
    fireCue(mid);
    FLY.forEach(l=>{ l.locked = false; l.target = l.pos = OUT_TRIM; l.travTarget = l.open = 1; });
    const pointer = nextCue, house = HOUSE.house;
    btn.fn();
    if(HOUSE.house !== house) throw new Error('the VR call moved the house master to '+HOUSE.house);
    for(const r of want){
      const ls = FLY[r.id-1]; if(!ls) continue;
      if(Math.abs(ls.target - r.target) > 1e-6)
        throw new Error('lineset '+r.id+' at '+ls.target.toFixed(2)+', the show says '+r.target.toFixed(2));
    }
    if(nextCue !== pointer) throw new Error('the VR call fired the cue as well');
    const moved = want.filter(r=>Math.abs(r.target - OUT_TRIM) > 0.01).length;
    if(!moved) throw new Error('cue 0 hangs everything out — this proves nothing');
    /* and it did not shift the pixel-pinned pairs above it */
    if(!VR.hits.find(h=>h.w === 116 && h.h === 46 && h.y === 86 + 136))
      throw new Error('the FOH RAISE row moved — the new button pushed the column down');
    return moved+' linesets preset from the desk in VR, nothing fired';
  });

  /* ══ RULING CW — THE SIGN IS ON THE FLY MENU ══════════════════════════════
     "add the beetlejuice sign to the fly menu."  It is not a lineset and cannot
     be one — every lineset lives upstage of the plaster line and the sign hangs
     downstage of the house curtain (RULINGS AS, AT) — so the rail carries it as
     a haul the SHOW declares.  Found by META, like the START OF SHOW call. */
  P('RULING CW: the sign is a haul on the VR fly rail, and it flies from there', ()=>{
    showLoad('beetlejuice');
    VR.page = 'fly'; vrDrawConsole(true);
    /* REVERSED IN PLACE BY RULING DH — "make it so i can make the beeltjuice sign
       got to pre show postion to the floor or all the way up."  IN and OUT became
       three NAMED stops, so the buttons are found by their stop rather than by a
       direction.  Everything below — that it really travels, that it lands on the
       number, that it took nothing from the numbered lines — is untouched, which is
       what asking by META rather than by pixel bought.

       AND THE FLOOR IS THE ONE THE OLD SHAPE COULD NOT EXPRESS: it is BELOW the
       offset the two-state haul called IN, so a direction had no word for it. */
    const x = (SHOW.flyExtras || []).find(y=>y.key === 'bjSign');
    if(!x) throw new Error('the sign is not a declared haul');
    const stops = flyExtraStops(x);
    if(!stops || stops.length !== 3)
      throw new Error('the sign declares ' + (stops ? stops.length : 0) +
                      ' stops; he asked for three — the floor, pre-show, and all the way up');
    const btn = nm => VR.hits.find(h=>h.flyExtra === 'bjSign' && h.stopName === nm);
    for(const nm of ['FLOOR', 'PRE-SHOW', 'UP'])
      if(!btn(nm)) throw new Error('the VR fly page has no ' + nm + ' button for the sign');
    const sg = sceneFind('bjSign');
    if(!sg || !sg.mv) throw new Error('the sign does not travel');
    if(Math.abs(sg.mv.off) > 0.01) throw new Error('it does not start in');
    /* each stop, driven from the headset button and watched all the way there */
    const go = nm => {
      btn(nm).fn();
      for(let i = 0; i < 900 && sceneTravelling(sg); i++) updateStorm(1/60);
      return sg.mv.off;
    };
    const want = nm => stops.find(s=>s.name === nm).off;
    for(const nm of ['UP', 'FLOOR', 'PRE-SHOW']){
      const got = go(nm);
      if(Math.abs(got - want(nm)) > 0.05)
        throw new Error(nm + ' left the sign at ' + got.toFixed(2) + ', not ' + want(nm).toFixed(2));
    }
    if(Math.abs(want('UP') - BJ_SIGN_OUT) > 0.01)
      throw new Error('UP is ' + want('UP') + ', not the plot own BJ_SIGN_OUT ' + BJ_SIGN_OUT);
    if(Math.abs(want('PRE-SHOW')) > 0.01)
      throw new Error('PRE-SHOW is ' + want('PRE-SHOW') + ', not the home offset the plot starts at');
    /* THE FLOOR REALLY PUTS IT ON THE DECK, measured off the geometry rather than
       off the constant — which is the whole reason that offset is derived from the
       sign own bounding box instead of typed in. */
    go('FLOOR');
    scene.updateMatrixWorld(true);
    const fb = new THREE.Box3().setFromObject(sg.group);
    if(Math.abs(fb.min.y) > 0.15)
      throw new Error('at FLOOR the sign lowest point is y ' + fb.min.y.toFixed(2) +
                      ', not on the deck');
    if(!(want('FLOOR') < -1))
      throw new Error('FLOOR is ' + want('FLOOR') + ' — it has to travel DOWN, below the pre-show');
    go('PRE-SHOW');
    /* AND IT TOOK NOTHING FROM THE NUMBERED LINES.  The fourteen rows and the
       pixel-pinned right-hand column are exactly where they were — this row
       lives in the 36px strip the fourteen leave at the bottom. */
    const rows = VR.hits.filter(h=>h.w === 84 && h.h === 34);
    if(rows.length < 10) throw new Error('only ' + rows.length + ' numbered row buttons left');
    if(!VR.hits.find(h=>h.w === 116 && h.h === 46 && h.y === 86 + 136))
      throw new Error('the FOH RAISE row moved — the sign row pushed the column down');
    if(!VR.hits.find(h=>h.railCall === 'startOfShow'))
      throw new Error('the START OF SHOW call was pushed off the page');
    return 'the sign hauled out to ' + BJ_SIGN_OUT + ' and back from the headset rail';
  });

  P('RULING CW: a show that declares no hauls draws none', ()=>{
    showLoad('outsiders');
    VR.page = 'fly'; vrDrawConsole(true);
    if(VR.hits.some(h=>h.flyExtra))
      throw new Error('a show with no flyExtras drew a haul row anyway');
    if(SHOW.flyExtras && SHOW.flyExtras.length)
      throw new Error('the outsiders declares ' + SHOW.flyExtras.length + ' hauls');
    showLoad('beetlejuice');
    return 'declared, never assumed — the other productions are untouched';
  });

  /* ══ RULING CV — A MENU FOR THE SETS, IN THE HEADSET ══════════════════════
     "Make a menu to control what sets are on."  The desk has had one all along
     (#sceneList); VR_TABS did not, and he works this show on a Quest. */
  P('RULING CV: the SETS page calls a set on, choreographed', ()=>{
    showLoad('beetlejuice');
    if(!VR_TABS.some(t=>t.id === 'sets')) throw new Error('there is no SETS tab');
    VR.page = 'sets'; vrDrawConsole(true);
    const calls = VR.hits.filter(h=>h.setCall);
    const sets = SHOW.scenes.filter(sc=>!sc.always);
    if(calls.length < 2) throw new Error('only ' + calls.length + ' sets on the page');
    /* an ALWAYS piece is not one of the sets that take turns — the sign is on
       the stage whatever is up, so it has no business in a list you pick from */
    if(calls.some(c=>c.setCall === 'bjSign'))
      throw new Error('the sign is in the set list, and it is never the set that is on');
    /* THE SUBJECT IS PICKED FOR THE FAULT THIS TEST IS FOR, not for convenience.
       The first non-current set happened to be the exterior, which parks on its
       own whole-group mover and carries no part movers at all — so a mutant that
       replaced sceneChangeTo with the instant sceneShow swap sailed through,
       because there was nothing to watch travel.  Take a set with an all-of-it
       wrapper: that is the one a pop is visible on. */
    const want = sets.find(sc=>sc.name !== SHOW.scene && sc.pmv && sc.pmv.all);
    if(!want) throw new Error('no set with a whole-set mover to watch');
    const btn = calls.find(c=>c.setCall === want.name);
    if(!btn) throw new Error('no call for ' + want.name);
    btn.fn();
    /* CHOREOGRAPHED, not swapped: it goes through sceneChangeTo, so the set
       travels on and is drawn the whole way (RULING AY) */
    if(SHOW.scene !== want.name) throw new Error('the call did not change the set');
    if(!sceneTravelling(want))
      throw new Error(want.name + ' was already home the frame it was called — that is a pop');
    let frames = 0;
    while(sceneTravelling(want) && frames < 900){
      updateStorm(1/60); frames++;
      if(want.group.userData.sceneOff)
        throw new Error('it went dark mid-travel, ' + frames + ' frames in');
    }
    if(frames >= 900) throw new Error('still travelling after 15s');
    if(frames < 30) throw new Error('it arrived in ' + frames + ' frames — that is a pop, not a travel');
    if(want.group.userData.sceneOff) throw new Error('it never came on');
    return calls.length + ' sets on the headset page, ' + want.name + ' called on over ' +
           (frames/60).toFixed(1) + 's, drawn the whole way';
  });

  P('RULING CV: the set menu says WHERE each struck set is standing', ()=>{
    showLoad('beetlejuice');
    /* RULING BQ made that a real question, and it is what this menu is for now:
       a struck set is in a wing, or upstage behind the backdrop, or in the tower. */
    sceneChangeTo('interior');
    sceneMoveTo('interior', 0);
    for(let i = 0; i < 900 && sceneTravelling(sceneFind('interior')); i++) updateStorm(1/60);
    if(vrSetWhere(sceneFind('interior')) !== 'ON STAGE')
      throw new Error('the set that is on does not read as on: ' + vrSetWhere(sceneFind('interior')));
    /* THE ATTIC CHANGED SIDES (RULING DI) and this is the third place the old
       side was written down — the park, the suite, and this menu fixture.  It
       stays a stated expectation rather than being derived from the mover it is
       checking, which would make it agree with anything; what it is worth is
       exactly that it had to be changed by hand when the traffic changed.  The
       closet joins it, so all three of the wing sets are named here now. */
    const CHECK = {interior:'upstage', attic:'stage right', bedroom:'stage right',
                   closet:'stage right', roof:'flown'};
    sceneChangeTo('cemetery');
    for(let i = 0; i < 1500; i++) updateStorm(1/60);
    const said = {};
    for(const n of Object.keys(CHECK)){
      said[n] = vrSetWhere(sceneFind(n));
      if(said[n] !== CHECK[n])
        throw new Error(n + ' reads as "' + said[n] + '", and it is parked ' + CHECK[n]);
    }
    return Object.keys(said).map(k=>k + ': ' + said[k]).join(', ');
  });

  P('the speaker bars are on the VR fly page', ()=>{
    VR.page = 'fly'; vrDrawConsole(true);
    if(typeof SPKBARS === 'undefined' || !SPKBARS) throw new Error('no speaker bars');
    const lRaise = VR.hits.find(h=>h.w === 116 && h.h === 46 && h.y === 86 + 312);
    const lLower = VR.hits.find(h=>h.w === 116 && h.h === 46 && h.y === 86 + 366);
    const rRaise = VR.hits.find(h=>h.w === 116 && h.h === 46 && h.y === 86 + 448);
    const rLower = VR.hits.find(h=>h.w === 116 && h.h === 46 && h.y === 86 + 502);
    if(!lRaise || !lLower || !rRaise || !rLower) throw new Error('missing RAISE/LOWER pairs');
    const y0 = SPKBARS.R.y;
    rLower.fn();
    for(let i=0;i<120;i++) updateRig(0.05, 1);
    if(!(SPKBARS.R.y < y0 - 1.0)) throw new Error('R LOWER left the bar at '+SPKBARS.R.y.toFixed(2));
    SPKBARS.R.target = SPKBARS.R.max;
    for(let i=0;i<400;i++) updateRig(0.05, 1);
    return 'VR pairs wired';
  });

  P('the desk shows the board of the room it is in', ()=>{
    goToView(15);
    vrDrawConsole(true);
    if(STAGE !== 'arcMain') throw new Error('the board did not follow');
    VR.page = 'fly'; vrDrawConsole(true);
    const n = FLY.length;
    if(!n) throw new Error('the fly page has no linesets');
    goToView(3);
    vrDrawConsole(true);
    return 'the same console, patched to whichever house you are standing in';
  });

  console.log('--- vr: the triggers ---');

  /* pose a hand: put it at FROM, point its ray (-Z) at AT — world coords */
  const aim = (hand, from, at)=>{
    VR.rig.position.set(0,0,0); VR.rig.rotation.set(0,0,0);
    VR.rig.updateMatrixWorld(true);
    const c = VR.controllers[hand];
    c.position.copy(from);
    const d = at.clone().sub(from).normalize();
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1), d);
    c.updateMatrixWorld(true);
  };

  P('the ray reads the desk where you point it', ()=>{
    goToView(3);
    const face = VR.desks[0].face;
    scene.updateMatrixWorld(true);
    /* a point three quarters across and three quarters up the face:
       u must be 0.75 and v (canvas, y down) 0.25 — the flip in vrPointAt */
    const at = face.localToWorld(new THREE.Vector3(1.42*0.25, 0.9*0.25, 0));
    const n = face.getWorldDirection(new THREE.Vector3());
    aim(1, at.clone().add(n.multiplyScalar(1.2)), at);
    const p = vrPointAt();
    if(!p) throw new Error('the ray missed the desk face');
    if(Math.abs(p.u - 0.75) > 0.02 || Math.abs(p.v - 0.25) > 0.02)
      throw new Error('u,v = ' + p.u.toFixed(3) + ',' + p.v.toFixed(3) +
                      ' — wanted 0.75,0.25');
    return 'u ' + p.u.toFixed(2) + ', v ' + p.v.toFixed(2);
  });

  /* find a door leaf the world ray can actually see, from any of four sides */
  const aimAtDoor = (hand)=>{
    for(const d of DOORS){
      const p = d.group.getWorldPosition(new THREE.Vector3()); p.y += 1.0;
      for(const off of [[0,0,2],[0,0,-2],[2,0,0],[-2,0,0]]){
        const from = p.clone().add(new THREE.Vector3(off[0], off[1], off[2]));
        aim(hand, from, p);
        const w = vrCastWorld(hand);
        if(w && w.info.kind === 'door') return {d, w};
      }
    }
    return null;
  };

  P('a trigger pull works the house doors from where you stand', ()=>{
    goToView(1);
    scene.updateMatrixWorld(true);
    const found = aimAtDoor(1);
    if(!found) throw new Error('no door leaf answered the ray');
    const dw = found.w.info.dw;
    const before = dw.leaves[0].target;
    vrSelect(1, true);
    if(dw.leaves[0].target === before) throw new Error('the trigger did not toggle it');
    return 'doors ' + (dw.leaves[0].target > 0.5 ? 'opening' : 'closing');
  });

  P('the left trigger is a trigger too', ()=>{
    scene.updateMatrixWorld(true);
    const found = aimAtDoor(0);
    if(!found) throw new Error('no door leaf answered the left ray');
    const dw = found.w.info.dw;
    const before = dw.leaves[0].target;
    vrSelect(0, true);
    if(dw.leaves[0].target === before) throw new Error('the left trigger did nothing');
    return 'toggled back with the left hand';
  });

  P('the floating label says what a pull would do', ()=>{
    scene.updateMatrixWorld(true);
    const found = aimAtDoor(1);
    if(!found) throw new Error('no door leaf answered the ray');
    vrUpdate(0.016);
    if(!VR.labelSpr || !VR.labelSpr.visible) throw new Error('no label came up');
    if(!/DOOR/.test(VR.labelTxt)) throw new Error('the label says "' + VR.labelTxt + '"');
    if(/\\[E\\]/.test(VR.labelTxt)) throw new Error('the label still says [E]: "' + VR.labelTxt + '"');
    const said = VR.labelTxt;
    aim(1, new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0, 60, 0));  // at the sky
    vrUpdate(0.016);
    if(VR.labelSpr.visible) throw new Error('the label did not clear');
    return '"' + said + '" — and it clears';
  });

  P('on the desk, the trigger stays on the desk', ()=>{
    goToView(3);
    scene.updateMatrixWorld(true);
    const face = VR.desks[0].face;
    /* dead centre of the face is BETWEEN the buttons on every page — a pull
       there must do nothing at all, and must never reach through the desk */
    const at = face.localToWorld(new THREE.Vector3(0, -0.05, 0));
    const n = face.getWorldDirection(new THREE.Vector3());
    aim(1, at.clone().add(n.multiplyScalar(1.0)), at);
    if(!vrPointAt()) throw new Error('the ray is not on the desk');
    const doors = DOORS.map(d=>d.target);
    vrSelect(1, true);
    if(DOORS.some((d,i)=>d.target !== doors[i]))
      throw new Error('the trigger reached through the desk into the room');
    return 'swallowed by the desk, as it should be';
  });

  console.log('--- vr: the ropes and the GO button ---');

  P('there is a rope for everything hanging', ()=>{
    goToView(3);
    vrBuildRopes();
    const hung = FLY.filter(l=>l.goodsKey !== 'none').length;
    /* every hung line gets its operating loop at the rail — and a hung
       traveler gets a second, smaller hand line at the proscenium on top,
       so the count is hung + 1 whenever a house curtain is up */
    const trav = FLY.some(l=>l.goodsKey !== 'none' &&
                             GOODS[l.goodsKey] && GOODS[l.goodsKey].traveler) ? 1 : 0;
    if(VR.ropes.length !== hung + trav)
      throw new Error(VR.ropes.length + ' ropes for ' + hung + ' hung linesets' +
                      (trav ? ' and a traveler' : ''));
    scene.updateMatrixWorld(true);
    for(const r of VR.ropes){
      const p = r.mesh.getWorldPosition(new THREE.Vector3());
      if(Math.abs(p.z - r.ls.z) > 1.2)
        throw new Error('the rope for ' + r.ls.id + ' is at z=' + p.z.toFixed(1) +
                        ', its lineset is at ' + r.ls.z.toFixed(1));
    }
    return VR.ropes.length + ' ropes: the pin rail, plus the traveler hand line';
  });

  /* put a hand on a rope's grab section and squeeze */
  const takeHold = (r, hand)=>{
    scene.updateMatrixWorld(true);
    const at = r.mesh.getWorldPosition(new THREE.Vector3());
    const c = VR.controllers[hand];
    VR.rig.updateMatrixWorld(true);
    c.position.copy(VR.rig.worldToLocal(at.clone()));
    c.updateMatrixWorld(true);
    vrSqueeze(hand, true);
    return c;
  };
  /* put a hand anywhere in the world (hand 1, so hand 0 can hold a rope) */
  const handAt = (world)=>{
    const c = VR.controllers[1];
    VR.rig.updateMatrixWorld(true);
    c.position.copy(VR.rig.worldToLocal(world.clone()));
    c.updateMatrixWorld(true);
    return c;
  };
  /* work the lock's red handle the way a hand now must: close a grip ON the
     knob, lean it to the detent wanted, and let go.  Nothing else moves it. */
  const leverTo = (r, on)=>{
    scene.updateMatrixWorld(true);
    handAt(r.knob.getWorldPosition(new THREE.Vector3()));
    vrSqueeze(1, true);
    if(!VR.heldLever || VR.heldLever.rope !== r)
      throw new Error('the hand did not close on the lever');
    const pivot = r.lever.getWorldPosition(new THREE.Vector3());
    handAt(on ? pivot.clone().add(new THREE.Vector3(0, 0.3, 0))
              : pivot.clone().add(new THREE.Vector3(r.inw*0.3, 0.05, 0)));
    scene.updateMatrixWorld(true);
    vrUpdateRopes(0.016);
    vrSqueeze(1, false);
    const c = VR.controllers[1];
    c.position.set(0, 0, 0); c.updateMatrixWorld(true);
  };
  const throwLever = r => leverTo(r, true);    // push it IN: locked
  const pullLever  = r => leverTo(r, false);   // pull it OUT: released
  /* the deck limit a runaway line stops at — guarded the way p3 guards it */
  const floorOf = ls => (typeof minTrimOf === 'function') ? minTrimOf(ls) : 0.6;
  const anElectric = ()=>{
    /* an electric hangs nothing below its pipe, so the deck limit is the
       bottom of the load as well as the bottom of the batten */
    const r = VR.ropes.find(x=>x.ls.goodsKey === 'electric');
    if(!r) throw new Error('nothing electric on the rail to haul');
    return r;
  };

  P('hauling a rope down brings the lineset in', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = VR.ropes[0], ls = r.ls;
    flyOut(ls); run(700, 0.05);
    const out = ls.pos;
    // put a hand on it and pull down half a metre
    const c = takeHold(r, 0);
    if(!VR.held) throw new Error('the hand did not take hold of it');
    pullLever(r);          // the rail wakes locked off — lever out with the load in hand
    c.position.y -= 0.5;
    c.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    if(ls.pos >= out - 1)
      throw new Error('pulling down moved it to ' + ls.pos.toFixed(2) + ' from ' + out.toFixed(2));
    const pulled = out - ls.pos;
    /* push the little red lever in before you let go, or it runs away */
    throwLever(r);
    if(!ls.locked) throw new Error('the lever did not lock it off');
    vrSqueeze(0, false);
    if(VR.held) throw new Error('it would not let go');
    if(ls.runaway) throw new Error('it ran away with the lock thrown');
    const stopped = ls.pos;
    run(200, 0.05);
    if(Math.abs(ls.pos - stopped) > 0.2)
      throw new Error('it kept moving after the hand let go');
    return 'half a metre of rope brought it in ' + pulled.toFixed(1) +
           'm, and the lever held it there';
  });

  P('let go of a rope with the lever off and the line runs to the deck', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = anElectric(), ls = r.ls;
    flyOut(ls); run(700, 0.05);
    const out = ls.pos;
    takeHold(r, 0);
    if(!VR.held) throw new Error('the hand did not take hold of it');
    pullLever(r);                               // lever out: only the hand holds it now
    vrUpdateHold(0.05);                         // one still frame: let go at rest
    vrSqueeze(0, false);
    if(!ls.runaway) throw new Error('letting go with the lock off held it anyway');
    let after1s = null;
    for(let i=0;i<400;i++){
      updateFly(0.05);
      if(i === 19) after1s = ls.pos;
      if(ls.pos - (ls.h||0) < -0.1)
        throw new Error('it went through the deck: batten ' + ls.pos.toFixed(2) +
                        ', bottom ' + (ls.pos - (ls.h||0)).toFixed(2));
    }
    if(after1s >= out - 0.5)
      throw new Error('a second later it had only moved to ' + after1s.toFixed(2));
    const lo = floorOf(ls);
    if(Math.abs(ls.pos - lo) > 1e-6)
      throw new Error('it came to rest at ' + ls.pos.toFixed(3) + ', the floor is ' + lo);
    if(ls.runaway) throw new Error('it is still marked as running away');
    if(ls.flyVel !== 0) throw new Error('it still has ' + ls.flyVel.toFixed(2) + ' m/s on it');
    return 'let go at ' + out.toFixed(1) + 'm, on the deck at ' + ls.pos.toFixed(2) +
           'm and stopped';
  });

  P('the hand itself cannot drag a line through the deck', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = VR.ropes[0], ls = r.ls;
    flyOut(ls); run(700, 0.05);
    const c = takeHold(r, 0);
    if(!VR.held) throw new Error('the hand did not take hold of it');
    pullLever(r);                      // lever out, so the hand really has the weight
    c.position.y -= 8;                 // an impossible single pull — 44m of line
    c.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    const lo = floorOf(ls);
    if(ls.pos < lo - 1e-6)
      throw new Error('the hand dragged it to ' + ls.pos.toFixed(2) +
                      'm, under the floor of ' + lo.toFixed(2) + 'm');
    throwLever(r);                     // hold it, let go, and leave the rail tidy
    vrSqueeze(0, false);
    ls.locked = false;
    flyOut(ls); run(700, 0.05);
    return 'a full-arm yank stopped at the floor of ' + lo.toFixed(2) + 'm';
  });

  P('let go while hauling out and it slows, stops and comes back down', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = anElectric(), ls = r.ls;
    flyTo(ls, 12, true); run(4, 0.05);
    const c = takeHold(r, 0);
    if(!VR.held) throw new Error('the hand did not take hold of it');
    pullLever(r);                               // lever out before the haul
    /* push the rope UP over ten frames — the batten flies OUT under the hand */
    for(let i=0;i<10;i++){
      c.position.y += 0.018;
      c.updateMatrixWorld(true);
      vrUpdateHold(0.05);
    }
    const release = ls.pos;
    if(release <= 12.05)
      throw new Error('pushing up did not fly it out: ' + release.toFixed(2));
    if(VR.held.vel <= 0.5)
      throw new Error('the haul read ' + VR.held.vel.toFixed(2) + ' m/s going out');
    vrSqueeze(0, false);
    if(!ls.runaway) throw new Error('letting go did not start it');
    let peak = ls.pos;
    for(let i=0;i<20;i++){ updateFly(0.05); peak = Math.max(peak, ls.pos); }
    if(peak <= release + 0.1)
      throw new Error('it stopped dead instead of running on: peak ' + peak.toFixed(2) +
                      ' against a release at ' + release.toFixed(2));
    for(let i=0;i<80;i++) updateFly(0.05);
    if(ls.pos >= peak - 1)
      throw new Error('it never turned round: ' + ls.pos.toFixed(2) +
                      ' against a peak of ' + peak.toFixed(2));
    for(let i=0;i<400;i++) updateFly(0.05);
    const lo = floorOf(ls);
    if(Math.abs(ls.pos - lo) > 1e-6)
      throw new Error('it finished at ' + ls.pos.toFixed(3) + ', the floor is ' + lo);
    return 'let go at ' + release.toFixed(2) + 'm going out, ran on to ' +
           peak.toFixed(2) + 'm, then down to the deck';
  });

  P('the red lever stops a runaway, and only the lever gives the lock back', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = anElectric(), ls = r.ls;
    flyTo(ls, 14, true); run(4, 0.05);
    takeHold(r, 0);
    pullLever(r);                               // lever out while the hand has the weight
    vrUpdateHold(0.05);
    vrSqueeze(0, false);
    if(!ls.runaway) throw new Error('it is not running away to begin with');
    for(let i=0;i<10;i++) updateFly(0.05);
    const caught = ls.pos;
    if(caught >= 14) throw new Error('it never started falling');
    throwLever(r);
    if(!ls.locked) throw new Error('the lever did not throw the lock on');
    if(ls.runaway) throw new Error('it is still running away with the lock on');
    updateFly(0.05); updateFly(0.05);
    if(Math.abs(ls.pos - caught) > 0.02)
      throw new Error('it fell another ' + (caught - ls.pos).toFixed(3) + 'm after the lock');
    /* taking hold of the rope again leaves the lock exactly where it is */
    const c = takeHold(r, 0);
    if(!VR.held) throw new Error('the hand did not take hold of it');
    if(!ls.locked) throw new Error('grabbing the rope took the lock off — only the lever may');
    /* and hauling against a thrown lock moves nothing: the rail has the weight */
    c.position.y -= 0.5;
    c.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    if(Math.abs(ls.pos - caught) > 1e-6)
      throw new Error('a haul moved a locked line to ' + ls.pos.toFixed(2));
    /* pull the lever out with a hand still on the rope: released, no runaway */
    pullLever(r);
    if(ls.locked) throw new Error('pulling the lever out did not release it');
    if(ls.runaway) throw new Error('it ran away with a hand still on the rope');
    /* and the haul picks up smoothly from here — no jump for the half metre
       pulled while the lock had the weight */
    const freed = ls.pos;
    c.position.y -= 0.3;
    c.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    if(ls.pos >= freed) throw new Error('the freed line would not haul');
    if(freed - ls.pos > 2.5)
      throw new Error('the pull made while locked was banked and let fly: it jumped ' +
                      (freed - ls.pos).toFixed(2) + 'm');
    throwLever(r);                              // tie it off before we walk away
    vrSqueeze(0, false);
    if(ls.runaway) throw new Error('a locked line ran away on release');
    ls.locked = false;
    return 'caught at ' + caught.toFixed(2) + 'm and held within two frames';
  });

  P('a hand takes the rope anywhere along it — and the back run hauls in reverse', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = anElectric(), ls = r.ls;
    flyTo(ls, 12, true); run(4, 0.05);
    scene.updateMatrixWorld(true);
    /* the front run, high over the whipped grab section */
    const front = r.runs[0].getWorldPosition(new THREE.Vector3());
    const c0 = VR.controllers[0];
    VR.rig.updateMatrixWorld(true);
    c0.position.copy(VR.rig.worldToLocal(new THREE.Vector3(front.x, 5.0, front.z)));
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.rope !== r)
      throw new Error('a hand five metres up the front run grabbed nothing');
    if(Math.abs(r.mesh.position.y - 5.0) > 0.01)
      throw new Error('the grab section did not slide to the hand: y=' +
                      r.mesh.position.y.toFixed(2));
    pullLever(r);                               // lever out before the haul
    c0.position.y -= 0.4;
    c0.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    if(ls.pos >= 12) throw new Error('pulling the front run down did not bring it in');
    vrSqueeze(0, false);
    /* the board takes the runaway back: a non-instant call writes a target
       away from pos, which is what cancels one (updateFly, p3) */
    flyTo(ls, 12); run(150, 0.05);
    /* the back run is the other half of the loop: down hauls the batten OUT */
    scene.updateMatrixWorld(true);
    const back = r.runs[1].getWorldPosition(new THREE.Vector3());
    c0.position.copy(VR.rig.worldToLocal(new THREE.Vector3(back.x, 5.0, back.z)));
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.rope !== r)
      throw new Error('a hand on the back run grabbed nothing');
    c0.position.y -= 0.4;
    c0.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    if(ls.pos <= 12) throw new Error('pulling the back run down did not send it out');
    vrSqueeze(0, false);
    flyTo(ls, 12); run(150, 0.05);
    c0.position.set(0, 0, 0); c0.updateMatrixWorld(true);
    return 'took hold at 5m up both runs; front hauled in, back hauled out';
  });

  P('the levers never move on their own', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = VR.ropes[0], ls = r.ls;
    ls.locked = true;
    for(let i=0;i<80;i++) vrUpdateRopes(0.05);  // settle into the detent
    scene.updateMatrixWorld(true);
    const pose = r.lever.rotation.z;
    /* a hand right on the knob without a squeeze — the old rail toggled on
       proximity alone, and a knuckle mid-haul threw locks nobody asked for */
    const at = r.knob.getWorldPosition(new THREE.Vector3());
    const c = VR.controllers[0];
    VR.rig.updateMatrixWorld(true);
    c.position.copy(VR.rig.worldToLocal(at.clone()));
    c.updateMatrixWorld(true);
    const g = VR.grips[0];
    g.position.copy(c.position);
    g.updateMatrixWorld(true);
    for(let i=0;i<80;i++) vrUpdateRopes(0.016);
    if(!ls.locked) throw new Error('a hand near the knob took the lock off by itself');
    if(Math.abs(r.lever.rotation.z - pose) > 1e-6)
      throw new Error('the lever moved with nobody holding it');
    c.position.set(0, 0, 0); c.updateMatrixWorld(true);
    g.position.set(0, 0, 0); g.updateMatrixWorld(true);
    /* hauling the rope does not touch the lever either */
    takeHold(r, 0);
    if(!VR.held) throw new Error('the hand did not take hold of it');
    for(let i=0;i<10;i++) vrUpdateRopes(0.016);
    if(!ls.locked) throw new Error('grabbing the rope threw the lever');
    if(Math.abs(r.lever.rotation.z - pose) > 1e-6)
      throw new Error('the lever leaned when the rope was grabbed');
    vrSqueeze(0, false);
    if(ls.runaway) throw new Error('a locked line ran away on release');
    ls.locked = false;
    return 'a loitering hand and a full haul, and the lever never stirred';
  });

  P('pull the lever out with nothing on the rope and the load is released', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = anElectric(), ls = r.ls;
    flyTo(ls, 14, true); run(4, 0.05);
    throwLever(r);
    if(!ls.locked) throw new Error('could not lock it to begin with');
    pullLever(r);
    if(ls.locked) throw new Error('pulling the lever out did not release it');
    if(!ls.runaway) throw new Error('released with no hand on it, and it just hung there');
    for(let i=0;i<20;i++) updateFly(0.05);
    if(ls.pos >= 14) throw new Error('released, and it never started to fall');
    throwLever(r);                              // catch it on the way down
    if(ls.runaway) throw new Error('the lever did not catch it');
    const caught = ls.pos;
    ls.locked = false;
    flyTo(ls, 14, true); run(4, 0.05);
    return 'out is released — it fell to ' + caught.toFixed(2) + 'm until the lever caught it';
  });

  P('a runaway is never ended by a relock — only the lever or the deck stops it', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = anElectric(), ls = r.ls;
    if(!ls.locked) throwLever(r);               // tie it off the way the rail rests
    flyTo(ls, 16, true); run(4, 0.05);
    if(Math.abs(ls.pos - 16) > 0.01)
      throw new Error('the board could not work the lock: it sits at ' + ls.pos.toFixed(2));
    if(!ls.locked) throw new Error('the board did not lock it off on arrival');
    pullLever(r);                               // released with no hand on it: away it goes
    if(!ls.runaway) throw new Error('released with nothing on it, and it hung there');
    for(let i=0;i<400 && ls.runaway;i++){
      updateFly(0.05);
      if(ls.locked) throw new Error('the runaway relocked itself at ' + ls.pos.toFixed(2) + 'm');
    }
    if(ls.runaway) throw new Error('twenty seconds on and it is still falling');
    if(ls.locked) throw new Error('the deck stop threw the lock on by itself');
    if(Math.abs(ls.pos - floorOf(ls)) > 1e-6)
      throw new Error('it came to rest at ' + ls.pos.toFixed(3));
    return 'fell from 16m to ' + ls.pos.toFixed(2) + 'm with the lock off the whole way';
  });

  P('every rope is a loop — a head block at the grid, a floor block on the deck', ()=>{
    const look = (label)=>{
      vrBuildRopes();
      scene.updateMatrixWorld(true);
      if(!VR.ropes.length) throw new Error(label + ' has no ropes at all');
      const loops = VR.ropes.filter(x=>!x.traveler);
      for(const r of loops){
        const h = r.head.getWorldPosition(new THREE.Vector3());
        const f = r.foot.getWorldPosition(new THREE.Vector3());
        const g = r.mesh.getWorldPosition(new THREE.Vector3());
        const k = r.knob.getWorldPosition(new THREE.Vector3());
        const at = label + ': lineset ' + r.ls.id + ' ';
        if(Math.abs(h.y - D.gridY) > 1.5)
          throw new Error(at + 'head block at y=' + h.y.toFixed(2) + ', the grid is ' + D.gridY);
        if(f.y < 0.05 || f.y > 0.6)
          throw new Error(at + 'floor block at y=' + f.y.toFixed(2));
        if(Math.abs(h.x - f.x) > 1e-6 || Math.abs(h.z - f.z) > 1e-6)
          throw new Error(at + 'blocks are not one over the other');
        if(r.runs.length !== 2)
          throw new Error(at + 'has ' + r.runs.length + ' runs of rope, wanted 2');
        const sp = Math.abs(r.runs[0].position.x - r.runs[1].position.x);
        if(Math.abs(sp - 0.12) > 1e-6)
          throw new Error(at + 'runs are ' + sp.toFixed(3) + 'm apart');
        if(Math.abs(g.y - 1.55) > 0.6)
          throw new Error(at + 'grab section is at y=' + g.y.toFixed(2));
        if(k.y < 0.8 || k.y > 1.6)
          throw new Error(at + 'lever is at y=' + k.y.toFixed(2) + ' — out of reach');
        /* the locking rail: a lock housing and a number plate for every line,
           and the red handle on the OPERATOR'S side of the ropes — the front */
        if(!r.lock)  throw new Error(at + 'has no rope-lock housing');
        if(!r.plate) throw new Error(at + 'has no number plate on the rail');
        if(!r.plate.material.map)
          throw new Error(at + 'number plate has nothing painted on it');
        if(r.lever.position.x * r.inw < 0.05)
          throw new Error(at + 'lever is behind the ropes, not in front');
        if(r.plate.position.x * r.inw <= r.lever.position.x * r.inw)
          throw new Error(at + 'number plate is behind the lock');
        /* pulled OUT, the handle lies toward the flyman, never the other way */
        if(!r.ls.locked && r.lever.rotation.z * r.inw > -0.5)
          throw new Error(at + 'released handle leans the wrong way: ' +
                          r.lever.rotation.z.toFixed(2));
      }
      const beam = VR.ropeRoot.children.find(o=>o.name === 'vr:rail');
      if(!beam) throw new Error(label + ' has no locking-rail beam at all');
      /* and one rope that is NOT a fly loop: the traveler's hand line, a
         small loop of its own at the proscenium.  No lock, no lever, no
         number plate — a traveler has no counterweight to lock off. */
      const hand = VR.ropes.filter(x=>x.traveler);
      if(hand.length !== 1)
        throw new Error(label + ' has ' + hand.length + ' traveler hand lines, wanted exactly 1');
      const tr = hand[0];
      const th = tr.head.getWorldPosition(new THREE.Vector3());
      const tf = tr.foot.getWorldPosition(new THREE.Vector3());
      if(th.y < 3.5 || th.y > 5.5)
        throw new Error(label + ': traveler head block at y=' + th.y.toFixed(2) +
                        ' — that is a fly loop, not a hand line');
      if(tf.y < 0.05 || tf.y > 0.6)
        throw new Error(label + ': traveler floor block at y=' + tf.y.toFixed(2));
      if(tr.runs.length !== 2)
        throw new Error(label + ': the hand line has ' + tr.runs.length + ' runs, wanted 2');
      if(tr.knob || tr.lever || tr.lock)
        throw new Error(label + ': the hand line grew a rope lock — a traveler has none');
      return loops.length;
    };
    goToView(3);
    const pal = look('the palace');
    goToView(15);
    const arc = look('the arc');
    goToView(3);
    return pal + ' loops and a hand line at the palace, ' + arc + ' and one at the arc';
  });

  /* ---- the traveler hand line: pull a rope at the side of the proscenium
     and the house curtain slides open to both sides ---- */
  const travRope = ()=>VR.ropes.find(x=>x.traveler);
  /* put a hand on a given RUN of the hand line at a given height and squeeze */
  const takeRun = (r, i, y)=>{
    scene.updateMatrixWorld(true);
    const run = r.runs[i].getWorldPosition(new THREE.Vector3());
    const c = VR.controllers[0];
    VR.rig.updateMatrixWorld(true);
    c.position.copy(VR.rig.worldToLocal(new THREE.Vector3(run.x, y, run.z)));
    c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    return c;
  };

  P('the traveler hand line hangs at the side of the arch — in both buildings', ()=>{
    const look = (label)=>{
      vrBuildRopes();
      scene.updateMatrixWorld(true);
      const r = travRope();
      if(!r) throw new Error(label + ' has no traveler hand line');
      if(!(GOODS[r.ls.goodsKey] && GOODS[r.ls.goodsKey].traveler))
        throw new Error(label + ': the hand line is tied to ' + r.ls.goodsKey +
                        ', which is no traveler');
      const p = r.mesh.getWorldPosition(new THREE.Vector3());
      const org = stageOrigin();
      /* stage right of the opening, just offstage of the arch, and not lost
         down the wing */
      if(p.x - org.x > -(D.procW/2 + 0.4))
        throw new Error(label + ': the hand line is inside the opening at x=' +
                        (p.x - org.x).toFixed(2));
      if(p.x - org.x < -(D.procW/2 + 2.5))
        throw new Error(label + ': the hand line is lost in the wing at x=' +
                        (p.x - org.x).toFixed(2));
      /* workable from the deck: the grab section at hand height */
      if(p.y < 0.8 || p.y > 2.2)
        throw new Error(label + ': the grab section is at y=' + p.y.toFixed(2));
      return (p.x - org.x).toFixed(1);
    };
    goToView(3);
    const pal = look('the palace');
    goToView(15);
    const arc = look('the arc');
    goToView(3);
    return 'offstage of the arch at x ' + pal + ' (palace) and ' + arc + ' (arc)';
  });

  P('haul the hand line and the curtain slides — front run opens, back run closes', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = travRope();
    if(!r) throw new Error('no traveler hand line to haul');
    const ls = r.ls;
    ls.open = ls.travTarget = 0;
    updateFly(0.05);                              // settle the halves shut
    const pipe = ls.pos;
    /* take the FRONT run mid-height and pull a metre of rope down */
    const c = takeRun(r, 0, 2.0);
    if(!VR.held || VR.held.rope !== r)
      throw new Error('a hand on the front run grabbed nothing');
    c.position.y -= 1.0;
    c.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    if(ls.open < 0.25)
      throw new Error('a metre of rope only opened it to ' + ls.open.toFixed(2));
    if(Math.abs(ls.travTarget - ls.open) > 1e-9)
      throw new Error('the hand and the board target disagree: open ' +
                      ls.open.toFixed(2) + ', target ' + ls.travTarget.toFixed(2));
    if(Math.abs(ls.pos - pipe) > 1e-6)
      throw new Error('hauling the hand line flew the pipe to ' + ls.pos.toFixed(2));
    /* p3 slides the halves apart: side * x grows as it opens */
    updateFly(0.05);
    for(const half of ls.goods.children){
      if(half.userData.side === undefined) continue;
      const reach = half.userData.side * half.position.x;
      if(reach < (D.procW/4 - 0.4) + 0.5)
        throw new Error('a half only reached ' + reach.toFixed(2) +
                        ' — the curtain did not slide out');
    }
    vrSqueeze(0, false);
    const was = ls.open;
    /* the BACK run is the other half of the loop: down closes */
    takeRun(r, 1, 2.0);
    if(!VR.held || VR.held.rope !== r)
      throw new Error('a hand on the back run grabbed nothing');
    c.position.y -= 0.5;
    c.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    if(ls.open >= was)
      throw new Error('pulling the back run down did not close it: ' + ls.open.toFixed(2));
    vrSqueeze(0, false);
    c.position.set(0, 0, 0); c.updateMatrixWorld(true);
    ls.open = ls.travTarget = 0; updateFly(0.05);
    return 'front run opened it to ' + was.toFixed(2) + ', the back run took it back';
  });

  P('let go of the hand line mid-travel and the curtain stays exactly where it is', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = travRope();
    if(!r) throw new Error('no traveler hand line to let go of');
    const ls = r.ls;
    ls.open = ls.travTarget = 0; updateFly(0.05);
    const c = takeRun(r, 0, 1.8);
    if(!VR.held) throw new Error('the hand did not take hold of it');
    c.position.y -= 1.2;               // haul, and let go while it is moving
    c.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    const at = ls.open;
    if(at <= 0.2) throw new Error('nothing to release mid-travel: open ' + at.toFixed(2));
    vrSqueeze(0, false);
    /* no counterweight on a hand line: nothing to run away, nothing to fall */
    if(ls.runaway) throw new Error('a traveler ran away — it has no counterweight to lose');
    if(Math.abs(ls.open - at) > 1e-9)
      throw new Error('the release itself moved it to ' + ls.open.toFixed(2));
    const pipe = ls.pos;
    for(let i=0;i<100;i++){ updateFly(0.05); vrUpdateRopes(0.05); }
    if(Math.abs(ls.open - at) > 1e-6)
      throw new Error('five seconds later the curtain had crept to ' + ls.open.toFixed(2));
    if(Math.abs(ls.pos - pipe) > 1e-6)
      throw new Error('the pipe moved to ' + ls.pos.toFixed(2) + ' after the hand let go');
    c.position.set(0, 0, 0); c.updateMatrixWorld(true);
    ls.open = ls.travTarget = 0; updateFly(0.05);
    return 'let go at ' + at.toFixed(2) + ' and it stayed put';
  });

  P('the board still travels the curtain with no hand on the rope', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = travRope();
    if(!r) throw new Error('no traveler hand line — nothing to prove it keeps clear of');
    const ls = r.ls;
    if(VR.held) throw new Error('a hand is still on a rope from the last test');
    ls.open = ls.travTarget = 0; updateFly(0.05);
    ls.travTarget = 1;                 // the desk's OPEN button writes exactly this
    for(let i=0;i<70;i++){ updateFly(0.05); vrUpdateRopes(0.05); }
    const got = ls.open;
    if(got < 0.99)
      throw new Error('three and a half seconds of travel only got it to ' + got.toFixed(2));
    ls.open = ls.travTarget = 0; updateFly(0.05);
    return 'travTarget alone walked it open to ' + got.toFixed(2) + ', the way the desk does';
  });

  P('a traveler held through the walk is let go, and the far house has its own', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = travRope();
    if(!r) throw new Error('no traveler hand line at the palace');
    const ls = r.ls;
    const at = ls.open;
    takeHold(r, 0);
    if(!VR.held || VR.held.rope !== r) throw new Error('the hand did not take hold of it');
    goToView(15);                      // walk into the other venue mid-squeeze
    if(VR.held) throw new Error('the hand is still holding the parked hand line');
    const r2 = travRope();
    if(!r2) throw new Error('the arc house has no traveler hand line');
    if(r2 === r) throw new Error('the arc is showing the palace hand line');
    const c = VR.controllers[0];
    c.position.y -= 0.5; c.updateMatrixWorld(true);
    vrUpdateHold(0.05);                // must be a no-op with nothing in hand
    if(Math.abs(ls.open - at) > 1e-9)
      throw new Error('the parked curtain slid to ' + ls.open.toFixed(2));
    vrSqueeze(0, false);
    c.position.set(0, 0, 0); c.updateMatrixWorld(true);
    goToView(3);
    return 'the swap opened the hand, and each house keeps its own hand line';
  });

  P('the floating label on the hand line says which run does what', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = travRope();
    if(!r) throw new Error('no traveler hand line to point at');
    scene.updateMatrixWorld(true);
    const at = r.mesh.getWorldPosition(new THREE.Vector3());
    /* point from a pace toward centre stage, the way the flyman stands */
    aim(1, at.clone().add(new THREE.Vector3(1.4, 0.2, 0)), at);
    vrUpdate(0.016);
    if(!VR.labelSpr || !VR.labelSpr.visible)
      throw new Error('no label came up on the hand line');
    if(!/TRAVELER/.test(VR.labelTxt) || !/open/i.test(VR.labelTxt) || !/close/i.test(VR.labelTxt))
      throw new Error('the label says "' + VR.labelTxt + '"');
    const said = VR.labelTxt;
    aim(1, new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0, 60, 0));  // at the sky
    vrUpdate(0.016);
    if(VR.labelSpr.visible) throw new Error('the label did not clear');
    return '"' + said + '" — and it clears';
  });

  P('reaching for the GO button on the desk fires a cue', ()=>{
    goToView(3);
    showLoad('outsiders');
    const before = nextCue;
    const b = VR.goButtons[0];
    scene.updateMatrixWorld(true);
    const at = b.mesh.getWorldPosition(new THREE.Vector3());
    const grip = VR.grips[0];
    VR.rig.updateMatrixWorld(true);
    grip.position.copy(VR.rig.worldToLocal(at.clone()));
    grip.updateMatrixWorld(true);
    b.cool = 0;
    vrUpdateButtons(0.016);
    if(nextCue <= before) throw new Error('reaching for it did nothing');
    // and it does not machine-gun
    const after = nextCue;
    vrUpdateButtons(0.016);
    if(nextCue !== after) throw new Error('it fired twice from one press');
    grip.position.set(0, 0, 0);
    return 'one press, one cue';
  });

  P('the ropes change with the theatre you walk into', ()=>{
    goToView(3);
    const palaceRopes = VR.ropes.length;
    const first = VR.ropes[0] && VR.ropes[0].ls;
    goToView(15);
    if(VR.ropes[0] && VR.ropes[0].ls === first)
      throw new Error('the arc is showing the palace ropes');
    scene.updateMatrixWorld(true);
    if(VR.ropes.length){
      const p = VR.ropes[0].mesh.getWorldPosition(new THREE.Vector3());
      if(Math.abs(p.x - ARC.X) > 60)
        throw new Error('the arc ropes are at x=' + p.x.toFixed(0));
    }
    goToView(3);
    return 'palace ' + palaceRopes + ' ropes, arc rebuilt on arrival';
  });

  P('the beam cap keeps the beams nearest your head at the arc', ()=>{
    goToView(15);
    /* in VR the rig carries the camera — stand it in the arc main house,
       a little stage-right, so "nearest" has a right answer */
    VR.rig.position.set(ARC.X + STAGES.arcMain.cx - 6, 0, STAGES.arcMain.zPros + 6);
    VR.rig.updateMatrixWorld(true);
    for(let c=1;c<=FIXTURES.length;c++) setLevel(c, 1, 0);
    RIG.haze = 0.6;
    updateRig(0.05, 1);
    scene.updateMatrixWorld(true);
    const cam = camera.getWorldPosition(new THREE.Vector3());
    const lit = FIXTURES.filter(f=>f.beam && f.beam.visible);
    if(lit.length <= VR.beamCap) throw new Error('only '+lit.length+' beams lit — nothing to cap');
    vrCapBeams();
    const kept = FIXTURES.filter(f=>f.beam && f.beam.visible);
    if(kept.length !== VR.beamCap) throw new Error(kept.length+' beams kept');
    const dist = f=>f._org.distanceTo(cam);
    const worstKept  = Math.max.apply(null, kept.map(dist));
    const bestKilled = Math.min.apply(null,
      lit.filter(f=>!f.beam.visible).map(dist));
    if(worstKept > bestKilled + 1e-6)
      throw new Error('kept a beam '+worstKept.toFixed(1)+'m away and killed one '+
                      bestKilled.toFixed(1)+'m away');
    for(let c=1;c<=FIXTURES.length;c++) setLevel(c, 0, 0);
    updateRig(0.05, 1);
    VR.rig.position.set(0, 0, 0); VR.rig.updateMatrixWorld(true);
    goToView(3);
    return 'the cap is by real distance, worst kept '+worstKept.toFixed(1)+'m';
  });

  P('a rope held through the walk is let go, not carried', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = VR.ropes[0], ls = r.ls;
    const before = ls.pos;
    scene.updateMatrixWorld(true);
    const at = r.mesh.getWorldPosition(new THREE.Vector3());
    const c = VR.controllers[0];
    VR.rig.updateMatrixWorld(true);
    c.position.copy(VR.rig.worldToLocal(at.clone()));
    c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held) throw new Error('the hand did not take hold of it');
    goToView(15);                     // stick-walk into the other venue mid-squeeze
    if(VR.held) throw new Error('the hand is still holding the parked rope');
    c.position.y -= 0.5; c.updateMatrixWorld(true);
    vrUpdateHold();                   // must be a no-op with nothing in hand
    if(Math.abs(ls.pos - before) > 1e-6)
      throw new Error('the parked lineset moved to ' + ls.pos.toFixed(2));
    vrSqueeze(0, false);
    goToView(3);
    /* and a lever held through the walk is dropped the same way */
    scene.updateMatrixWorld(true);
    const r2 = VR.ropes[0];
    const k2 = r2.knob.getWorldPosition(new THREE.Vector3());
    const c2 = VR.controllers[1];
    VR.rig.updateMatrixWorld(true);
    c2.position.copy(VR.rig.worldToLocal(k2.clone()));
    c2.updateMatrixWorld(true);
    vrSqueeze(1, true);
    if(!VR.heldLever) throw new Error('the hand did not close on the lever');
    goToView(15);
    if(VR.heldLever) throw new Error('the hand is still holding the parked lever');
    vrSqueeze(1, false);
    c2.position.set(0, 0, 0); c2.updateMatrixWorld(true);
    goToView(3);
    return 'the swap opened the hand';
  });

  console.log('--- vr: the meter ---');

  P('the frame meter measures what the frames cost', ()=>{
    if(typeof vrPerf !== 'function') throw new Error('there is no vrPerf');
    /* 160 frames of exactly 16ms: more than the 120-slot window, so any
       history from the tests above is fully overwritten */
    for(let i=0;i<160;i++) vrUpdate(0.016);
    const Pm = VR.perf;
    if(!Pm || !Pm.n) throw new Error('nothing was recorded');
    if(Math.abs(Pm.avg - 16) > 0.5)
      throw new Error('avg reads ' + Pm.avg.toFixed(2) + 'ms for 16ms frames');
    if(Math.abs(Pm.worst - 16) > 0.5)
      throw new Error('worst reads ' + Pm.worst.toFixed(2) + 'ms for 16ms frames');
    return 'avg ' + Pm.avg.toFixed(1) + 'ms, worst ' + Pm.worst.toFixed(1) +
           'ms over a ' + Pm.buf.length + '-frame window';
  });

  P('the meter rides the left wrist', ()=>{
    if(!VR.meter || !VR.meter.mesh) throw new Error('no meter was built');
    if(VR.meter.mesh.parent !== VR.grips[0])
      throw new Error('the meter is hanging off ' +
        (VR.meter.mesh.parent && VR.meter.mesh.parent.name));
    return 'a tag on the left grip, redrawn twice a second';
  });

  P('over budget, the peripheral goes first — foveation climbs', ()=>{
    /* 16ms frames against an 11.1ms budget (no rate negotiated in this
       harness, so the default 90Hz stands): the controller must push
       foveation up from the 0.4 base, and stop at 1.0 */
    const f0 = renderer.xr.foveation;
    for(let i=0;i<400;i++) vrUpdate(0.016);
    if(!(renderer.xr.foveation > 0.41))
      throw new Error('foveation stayed at ' + renderer.xr.foveation);
    if(renderer.xr.foveation > 1.0001)
      throw new Error('foveation overflowed to ' + renderer.xr.foveation);
    return 'foveation ' + f0.toFixed(2) + ' -> ' + renderer.xr.foveation.toFixed(2);
  });

  P('with headroom it relaxes to the 0.4 base, never below', ()=>{
    /* 6ms frames: miles under budget.  It must come all the way back down
       and sit at the base the quality tier asked for, not sink past it */
    for(let i=0;i<1400;i++) vrUpdate(0.006);
    if(Math.abs(renderer.xr.foveation - 0.4) > 0.001)
      throw new Error('foveation settled at ' + renderer.xr.foveation);
    if(!VR.perf || Math.abs(VR.perf.fov - 0.4) > 0.001)
      throw new Error('the controller believes ' + (VR.perf && VR.perf.fov) +
                      ' while the runtime is at 0.4');
    return 'back to 0.4 and no further';
  });

  console.log('--- vr: getting out ---');

  P('leaving the session puts everything back', ()=>{
    exitVR();
    if(VR.active) throw new Error('it still thinks it is in VR');
    if(camera.parent === VR.rig) throw new Error('the camera is still in the rig');
    if(RIG.shadowBudget === 0) throw new Error('the shadow budget was not restored');
    if(camera.far < 200) throw new Error('the far plane is still ' + camera.far);
    goToView(1);
    updatePlayer(0.016);
    if(Math.abs(camera.position.y - (Player.pos.y + Player.eye)) > 0.2)
      throw new Error('the desktop camera is not being placed again');
    return 'camera back, shadows back, desktop as it was';
  });

  P('and you can go back in again', ()=>{
    enterVR();
    if(!VR.active) throw new Error('it would not restart');
    if(camera.parent !== VR.rig) throw new Error('the camera did not go back in the rig');
    if(VR.desks.length > 5) throw new Error(VR.desks.length + ' desks — they were built twice');
    exitVR();
    return 'in, out and in again with no duplicates';
  });

  P('600 frames in a session with a show running', ()=>{
    enterVR();
    goToView(3);
    showLoad('goeswrong');
    stick('left', 0.4, -0.8);
    let err = null;
    try{
      for(let i=0;i<600;i++){
        if(i === 150) goToView(15);
        if(i === 300) goToView(19);
        if(i === 450) { go(); }
        vrUpdate(0.016);
        updatePlayer(0.016); updateFades(0.016); updateFly(0.016);
        updateStorm(0.016); updateSmoke(0.016); updateArc(0.016); updateRooms();
      }
    }catch(e){ err = e; }
    stick('left', 0, 0);
    if(err) throw err;
    exitVR();
    return 'no errors';
  });

  console.log('--- the warehouse cart ---');
  P('a squeeze on the handle pushes the cart, walls stop it', ()=>{
    if(typeof CARTS === 'undefined' || !CARTS.palace) throw new Error('no cart');
    enterVR();                        // the last test left the session
    goToView(3);
    /* park the rig at the origin, the way aim() does for the trigger tests,
       so a controller's local position IS its world position */
    VR.rig.position.set(0,0,0); VR.rig.rotation.set(0,0,0);
    VR.rig.updateMatrixWorld(true);
    const cart = CARTS.palace;
    cart.x = 8.5; cart.z = -27.5; cart.yaw = 0; cartPose(cart);
    const c = VR.controllers[0];
    c.quaternion.set(0,0,0,1);
    c.position.set(cart.x, cart.handleH, cart.z + cart.handleZ);
    c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'cart') throw new Error('the handle did not take');
    const z0 = cart.z;
    for(let i=0;i<40;i++){
      c.position.z += 0.05; c.updateMatrixWorld(true);
      vrUpdateHold(0.05);
    }
    if(!(cart.z > z0 + 1.2)) throw new Error('cart stayed at z='+cart.z.toFixed(2));
    vrSqueeze(0, false);
    /* INSIDE the shed, taken off the shed: the side wall it is meant to be
       stopped by only exists between z0 and z1, and a literal -25 is out on the
       stage since RULING CL moved the brick (PAL_DEEP 4.5 -> 8.5) */
    cart.x = SHEDS.palace.x0 + 1.0; cart.z = SHEDS.palace.z1 - 2.0;
    cart.yaw = 0; cartPose(cart);
    c.position.set(cart.x, cart.handleH, cart.z + cart.handleZ);
    c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    for(let i=0;i<40;i++){
      c.position.x -= 0.05; c.updateMatrixWorld(true);
      vrUpdateHold(0.05);
    }
    vrSqueeze(0, false);
    if(cart.x < SHEDS.palace.x0 + 0.3) throw new Error('cart went through the wall to x='+cart.x.toFixed(2));
    cart.x = 8.5; cart.z = -27.5; cartPose(cart);
    c.position.set(0, 0, 0); c.updateMatrixWorld(true);
    exitVR();
    return 'pushes and stops';
  });
  P('the forklift answers the hand, and the right stick runs the forks', ()=>{
    if(typeof LIFTS === 'undefined' || !LIFTS.palace) throw new Error('no forklift');
    enterVR();
    goToView(3);
    VR.rig.position.set(0,0,0); VR.rig.rotation.set(0,0,0);
    VR.rig.updateMatrixWorld(true);
    const L = LIFTS.palace;
    const hx = L.x, hz = L.z;
    L.yaw = 0; cartPose(L);
    const c = VR.controllers[0];
    c.quaternion.set(0,0,0,1);
    c.position.set(L.x, L.handleH, L.z + L.handleZ);
    c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'cart' || !VR.held.cart.lift)
      throw new Error('the handle did not take: '+JSON.stringify(VR.held && VR.held.kind));
    /* stick pushed away = forks up; the game reads it out of VR.axes.ry */
    VR.axes.ry = -1;
    for(let i=0;i<20;i++){ vrUpdateHold(0.05); updateLifts(0.05); }
    VR.axes.ry = 0;
    if(!(L.forkY > 0.3)) throw new Error('the forks never rose: '+L.forkY.toFixed(2));
    VR.axes.ry = 1;
    for(let i=0;i<40;i++){ vrUpdateHold(0.05); updateLifts(0.05); }
    VR.axes.ry = 0;
    if(L.forkY > 0.001) throw new Error('the forks never came home: '+L.forkY.toFixed(2));
    vrSqueeze(0, false);
    L.x = hx; L.z = hz; L.forkY = 0; cartPose(L);
    c.position.set(0, 0, 0); c.updateMatrixWorld(true);
    exitVR();
    return 'held like a cart, forks on the stick';
  });

  console.log('--- vr: the belt ---');
  P('the belt rides the hips, and a squeeze at the hip draws the gun', ()=>{
    enterVR();
    goToView(3);
    VR.rig.position.set(0,0,0); VR.rig.rotation.set(0,0,0);
    camera.position.set(0, 1.7, 1.5); camera.quaternion.set(0,0,0,1);
    if(!VR.belt) throw new Error('no belt came with the session');
    vrUpdateBelt();
    VR.rig.updateMatrixWorld(true);
    const hp = VR.holsters.nailgun.getWorldPosition(new THREE.Vector3());
    if(Math.abs(hp.y - (1.7 - 0.72)) > 0.05) throw new Error('the belt is at y='+hp.y.toFixed(2));
    const c = VR.controllers[1];
    c.quaternion.set(0,0,0,1);
    c.position.copy(hp);
    c.updateMatrixWorld(true);
    vrSqueeze(1, true);
    if(VR.tools[1] !== 'nailgun') throw new Error('the holster did not give up the gun: '+VR.tools[1]);
    if(VR.toolMesh.nailgun.parent !== c) throw new Error('drawn but not in the hand');
    vrSqueeze(1, false);
    if(VR.tools[1]) throw new Error('the open hand kept the tool');
    if(VR.toolMesh.nailgun.parent !== VR.holsters.nailgun) throw new Error('never went home');
    return 'drawn at the hip, holstered on release';
  });
  P('gun nails a lined-up stud; the hammer pulls it back out', ()=>{
    const tgt = regWood('s2x4'), held = regWood('s2x4');
    tgt.mesh.position.set(0.5, 1.22, -0.6);
    held.mesh.position.set(1.4, 1.22, -0.6);
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0], c1 = VR.controllers[1];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(1.4, 1.22, -0.6);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== held)
      throw new Error('the stud was not taken: '+(VR.held && VR.held.kind));
    /* offer it against the other stud: the ghost snap engages in the hold */
    c0.position.set(0.58, 1.22, -0.6);
    c0.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    if(!VR.snap || !VR.snap.target || VR.snap.target.body !== tgt)
      throw new Error('no joint offered');
    /* the other hand draws the gun and fires into it */
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c1.position.copy(VR.holsters.nailgun.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    c1.position.set(0.55, 1.2, -0.55);
    c1.updateMatrixWorld(true);
    const asmBefore = ASSEMBLIES.length;
    vrSelect(1, true);
    if(ASSEMBLIES.length !== asmBefore + 1) throw new Error('the shot never joined them');
    if(VR.held) throw new Error('the nailed piece is still in the hand');
    if(held.state !== 'fixed' || tgt.state !== 'fixed') throw new Error('states: '+held.state+'/'+tgt.state);
    const asm = held.asm, nail = asm.nails[0];
    vrSqueeze(0, false);
    vrSqueeze(1, false);                       // gun home
    /* the hammer, on the nail's head */
    c1.position.copy(VR.holsters.hammer.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    if(VR.tools[1] !== 'hammer') throw new Error('the hammer never drew: '+VR.tools[1]);
    c1.position.copy(nail.mesh.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSelect(1, true);
    if(ASSEMBLIES.indexOf(asm) >= 0) throw new Error('the assembly survived its only nail');
    if(held.state !== 'loose' || tgt.state !== 'loose') throw new Error('never came loose');
    vrSqueeze(1, false);
    return 'joined by the gun, parted by the hammer';
  });
  P('an 8ft stick is a handful anywhere along it', ()=>{
    const b = regWood('s2x4');
    b.mesh.rotation.set(0, 0, 0);
    b.mesh.position.set(4, 1.22, -0.6);        // upright: ends at y=0 and y=2.44
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(4, 2.49, -0.6);            // 5cm past the TOP END — 1.27m from centre
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== b)
      throw new Error('the end of the stick was not taken: '+(VR.held && VR.held.kind));
    vrSqueeze(0, false);
    /* and the tolerance is a tolerance, not a beam: 35cm off is a miss */
    c0.position.set(4, 2.79, -0.6);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(VR.held && VR.held.kind === 'body' && VR.held.body === b)
      throw new Error('a hand 35cm off the end still took it');
    if(VR.held) vrSqueeze(0, false);
    return 'held at the end, missed at 35cm';
  });
  P('held wood rides IN the hand: the grabbed end stays in the palm', ()=>{
    /* the old carry stored a world-space CENTRE offset and turned the piece
       about its centre — grab an 8ft stick by the end, turn your wrist, and
       the end you grabbed swept away from your palm (build-feel RULING R) */
    const b = regWood('s2x4');
    b.mesh.rotation.set(0, 0, Math.PI/2);      // long axis X, lying level
    b.mesh.position.set(4, 1.5, 2.0);          // high and downstage: no snap offer
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(5.21, 1.5, 2.0);           // 1cm inside the +x END
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== b)
      throw new Error('the end was not taken: '+(VR.held && VR.held.kind));
    /* remember the grabbed spot in the PIECE's own frame */
    const grabL = b.mesh.worldToLocal(new THREE.Vector3(5.21, 1.5, 2.0));
    /* move the hand and turn the wrist a quarter round */
    c0.position.set(4.0, 1.6, 2.5);
    c0.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
    c0.updateMatrixWorld(true);
    vrUpdateHold(0.016);
    scene.updateMatrixWorld(true);
    if(VR.snap) throw new Error('a snap offer crept under this test: rewrite it clear of targets');
    const wp = b.mesh.localToWorld(grabL.clone());
    const d = wp.distanceTo(new THREE.Vector3(4.0, 1.6, 2.5));
    vrSqueeze(0, false);
    BODIES.splice(BODIES.indexOf(b), 1);
    if(d > 0.06)
      throw new Error('the grabbed end is '+d.toFixed(2)+'m from the palm');
    return 'the end stays in the palm through a quarter turn';
  });
  P('held wood squares to the nearest 45 — and X holds it free', ()=>{
    /* build-feel RULING M: with no offer standing, a held piece sits on
       the 45-degree grid on every axis; holding X suspends the grid; the
       grabbed point stays in the palm through the quantize */
    const b = regWood('s2x4');
    b.mesh.rotation.set(0, 0, Math.PI/2);
    b.mesh.position.set(4, 1.5, 2.0);
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(5.21, 1.5, 2.0);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== b)
      throw new Error('not taken: '+(VR.held && VR.held.kind));
    const grabL = b.mesh.worldToLocal(new THREE.Vector3(5.21, 1.5, 2.0));
    /* an odd wrist, nowhere near the grid */
    c0.quaternion.setFromEuler(new THREE.Euler(0.22, 0.3, 0.13, 'YXZ'));
    c0.updateMatrixWorld(true);
    vrReadSticks();                            // no X pressed
    vrUpdateHold(0.016);
    if(VR.snap) throw new Error('a snap offer crept under this test');
    scene.updateMatrixWorld(true);
    const off45 = v => Math.abs(v/(Math.PI/4) - Math.round(v/(Math.PI/4)));
    let e = new THREE.Euler().setFromQuaternion(
      b.mesh.getWorldQuaternion(new THREE.Quaternion()), 'YXZ');
    if(off45(e.x) > 1e-3 || off45(e.y) > 1e-3 || off45(e.z) > 1e-3)
      throw new Error('off the grid: '+e.x.toFixed(3)+'/'+e.y.toFixed(3)+'/'+e.z.toFixed(3));
    const wp = b.mesh.localToWorld(grabL.clone());
    if(wp.distanceTo(new THREE.Vector3(5.21, 1.5, 2.0)) > 0.06)
      throw new Error('the quantize pulled the piece out of the palm');
    /* X held: the grid lets go and the wrist is followed exactly */
    btns.left[4].pressed = true;
    vrReadSticks();
    vrUpdateHold(0.016);
    btns.left[4].pressed = false;
    scene.updateMatrixWorld(true);
    e = new THREE.Euler().setFromQuaternion(
      b.mesh.getWorldQuaternion(new THREE.Quaternion()), 'YXZ');
    if(off45(e.x) < 0.02 && off45(e.y) < 0.02 && off45(e.z) < 0.02)
      throw new Error('X held, but the piece is still snapped to the grid');
    vrReadSticks();                            // X back up for the next test
    vrSqueeze(0, false);
    BODIES.splice(BODIES.indexOf(b), 1);
    return 'on the grid bare-handed, free under X';
  });
  /* ---- carpenters phase 2, RULING AD ------------------------------------
     The asm hold copied POSITION and never touched the root's quaternion,
     so nothing built could be turned over — and the carpenters assemble
     lying flat (RULING AC), which left every flat they ever made face-up
     on the deck for good.  It now carries exactly as a plank does. */
  const mkAsm = ()=>{
    const p1 = regWood('s2x4'), p2 = regWood('s2x4');
    p1.mesh.rotation.set(0, 0, Math.PI/2);     // long axis X, lying level
    p2.mesh.rotation.set(0, 0, Math.PI/2);
    p1.mesh.position.set(4, 1.5, 2.0);         // high and downstage: no offer
    p2.mesh.position.set(4, 1.5, 2.089);       // alongside, faces flush
    scene.updateMatrixWorld(true);
    const ax = new THREE.Vector3(0, 0, 1);
    addNail(p1, {body:p2}, new THREE.Vector3(4.0, 1.5, 2.0445), ax);
    addNail(p1, {body:p2}, new THREE.Vector3(4.6, 1.5, 2.0445), ax);
    return {a:p1.asm, p1, p2};
  };
  const dropAsm = (a, p1, p2)=>{
    if(a.root.parent) a.root.parent.remove(a.root);
    const i = ASSEMBLIES.indexOf(a); if(i >= 0) ASSEMBLIES.splice(i, 1);
    [p1, p2].forEach(b=>{ const j = BODIES.indexOf(b); if(j >= 0) BODIES.splice(j, 1); });
  };
  P('a built assembly turns in the hand, and stays in the palm', ()=>{
    const {a, p1, p2} = mkAsm();
    if(!a) throw new Error('the two sticks never became an assembly');
    if(a.anchor) throw new Error('this test needs an un-anchored assembly');
    if(a.pieces.length !== 2) throw new Error('pieces: '+a.pieces.length);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(5.21, 1.5, 2.0);           // 1cm inside the +x END of p1
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'asm' || VR.held.asm !== a)
      throw new Error('the assembly was not taken: '+(VR.held && VR.held.kind));
    const q0 = a.root.getWorldQuaternion(new THREE.Quaternion()).clone();
    const grabL = a.root.worldToLocal(new THREE.Vector3(5.21, 1.5, 2.0));
    /* move the hand and turn the wrist a quarter round */
    c0.position.set(4.0, 1.6, 2.5);
    c0.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
    c0.updateMatrixWorld(true);
    vrReadSticks();
    vrUpdateHold(0.016);
    scene.updateMatrixWorld(true);
    const q1 = a.root.getWorldQuaternion(new THREE.Quaternion());
    const turned = 2*Math.acos(Math.min(1, Math.abs(q0.dot(q1))));
    const wp = a.root.localToWorld(grabL.clone());
    const d = wp.distanceTo(new THREE.Vector3(4.0, 1.6, 2.5));
    vrSqueeze(0, false);
    /* and a nailed-down assembly still refuses the hand entirely */
    a.anchor = {type:'deck'};
    c0.position.set(5.21, 1.5, 2.0);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    const refused = !VR.held;
    if(VR.held) vrSqueeze(0, false);
    delete a.anchor;
    dropAsm(a, p1, p2);
    if(turned < 1.0)
      throw new Error('the root only turned '+turned.toFixed(3)+' rad');
    if(d > 0.06)
      throw new Error('the grabbed point is '+d.toFixed(2)+'m from the palm');
    if(!refused) throw new Error('a deck-anchored assembly came away in the hand');
    return 'turns '+turned.toFixed(2)+' rad about the palm; anchored still refuses';
  });
  P('a held assembly squares to the nearest 45 — and X holds it free', ()=>{
    const {a, p1, p2} = mkAsm();
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(5.21, 1.5, 2.0);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'asm')
      throw new Error('not taken: '+(VR.held && VR.held.kind));
    const grabL = a.root.worldToLocal(new THREE.Vector3(5.21, 1.5, 2.0));
    /* a wrist far enough round that the grid lands on a NON-ZERO multiple:
       an assembly root starts at identity, so a small angle would quantize
       back to identity and "on the grid" would be true without the code
       ever running */
    c0.quaternion.setFromEuler(new THREE.Euler(0.22, 0.95, 0.13, 'YXZ'));
    c0.updateMatrixWorld(true);
    vrReadSticks();                            // no X pressed
    vrUpdateHold(0.016);
    scene.updateMatrixWorld(true);
    const off45 = v => Math.abs(v/(Math.PI/4) - Math.round(v/(Math.PI/4)));
    let e = new THREE.Euler().setFromQuaternion(
      a.root.getWorldQuaternion(new THREE.Quaternion()), 'YXZ');
    const onGrid = off45(e.x) <= 1e-3 && off45(e.y) <= 1e-3 && off45(e.z) <= 1e-3
                   && Math.abs(e.y - Math.PI/4) <= 1e-3;
    const wp = a.root.localToWorld(grabL.clone());
    const palm = wp.distanceTo(new THREE.Vector3(5.21, 1.5, 2.0));
    btns.left[4].pressed = true;
    vrReadSticks();
    vrUpdateHold(0.016);
    btns.left[4].pressed = false;
    scene.updateMatrixWorld(true);
    e = new THREE.Euler().setFromQuaternion(
      a.root.getWorldQuaternion(new THREE.Quaternion()), 'YXZ');
    const freeUnderX = !(off45(e.x) < 0.02 && off45(e.y) < 0.02 && off45(e.z) < 0.02);
    vrReadSticks();                            // X back up for the next test
    vrSqueeze(0, false);
    dropAsm(a, p1, p2);
    if(!onGrid) throw new Error('off the grid: '+e.x.toFixed(3)+'/'+e.y.toFixed(3)+'/'+e.z.toFixed(3));
    if(palm > 0.06) throw new Error('the quantize pulled it out of the palm');
    if(!freeUnderX) throw new Error('X held, but it is still snapped to the grid');
    return 'on the grid bare-handed, free under X';
  });
  P('Y parks the piece exactly where it is, and a grab frees it', ()=>{
    /* build-feel RULING N: Y while wood is in hand releases it FROZEN —
       exact pose, mid-air included, never settles, grab to unfreeze */
    /* fail BEFORE touching shared state, so a pre-change run cannot strand
       a held piece and cascade into later tests */
    if(typeof vrButtonFreeze !== 'function') throw new Error('vrButtonFreeze is not defined');
    const b = regWood('s2x4');
    b.mesh.rotation.set(0, 0, Math.PI/2);
    b.mesh.position.set(4, 1.5, 2.0);
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(5.21, 1.5, 2.0);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== b)
      throw new Error('not taken: '+(VR.held && VR.held.kind));
    vrUpdateHold(0.016);
    scene.updateMatrixWorld(true);
    const pose = b.mesh.position.clone(), quat = b.mesh.quaternion.clone();
    btns.left[5].pressed = true;
    vrButtonFreeze();
    btns.left[5].pressed = false;
    vrButtonFreeze();
    if(VR.held) throw new Error('Y did not open the hand');
    if(!b.frozen || b.state !== 'loose')
      throw new Error('not parked: frozen='+b.frozen+' state='+b.state);
    for(let i = 0; i < 80; i++) updateBodies(0.05);
    if(b.mesh.position.distanceTo(pose) > 1e-4 ||
       Math.abs(b.mesh.quaternion.dot(quat)) < 0.9999)
      throw new Error('the parked piece moved: y='+b.mesh.position.y.toFixed(2));
    /* the grab takes the park off */
    vrSqueeze(0, true);
    if(!VR.held || VR.held.body !== b) throw new Error('could not regrab it');
    if(b.frozen) throw new Error('still frozen in the hand');
    vrSqueeze(0, false);
    BODIES.splice(BODIES.indexOf(b), 1);
    return 'parked mid-air at its angle, freed by the grab';
  });
  P('the work table is a handful at its edge, and carries in the hand', ()=>{
    /* the owner's report: "I can't move the work table."  The old grab
       measured hand-to-origin against 0.35 — and a table's origin is its
       FEET, on the floor, under the middle of the top: to grab the table
       you had to reach through it (build-feel RULING Q) */
    const t = regBody('table', makeBodyMesh('table'), null);
    t.state = 'loose'; t.restH = 0;
    t.mesh.position.set(14, 0, 2.0);
    t.mesh.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(14.79, 0.9, 2.0);          // at the +x edge, under the lip
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== t)
      throw new Error('the edge was not taken: '+(VR.held && VR.held.kind));
    /* it carries like wood now: the grabbed spot stays in the palm */
    const grabL = t.mesh.worldToLocal(new THREE.Vector3(14.79, 0.9, 2.0));
    c0.position.set(13.5, 1.1, 2.6);
    c0.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), 0.6);
    c0.updateMatrixWorld(true);
    vrUpdateHold(0.016);
    scene.updateMatrixWorld(true);
    const wp = t.mesh.localToWorld(grabL.clone());
    if(wp.distanceTo(new THREE.Vector3(13.5, 1.1, 2.6)) > 0.06)
      throw new Error('the table does not ride in the hand');
    vrSqueeze(0, false);
    /* and the #51 landing contract still holds: upright, yaw on a 45 */
    const e = new THREE.Euler().setFromQuaternion(
      t.mesh.getWorldQuaternion(new THREE.Quaternion()), 'YXZ');
    const y8 = e.y / (Math.PI/4);
    if(Math.abs(e.x) > 1e-3 || Math.abs(e.z) > 1e-3 ||
       Math.abs(y8 - Math.round(y8)) > 1e-3)
      throw new Error('did not land square: '+e.x.toFixed(3)+'/'+e.y.toFixed(3)+'/'+e.z.toFixed(3));
    BODIES.splice(BODIES.indexOf(t), 1);
    return 'edge grab, in-hand carry, square landing';
  });
  P('the fly page changes what is on a pipe', ()=>{
    /* goods round RULING U: the goods label on the VR fly page is a
       button — it opens a picker for that lineset, and choosing hangs it */
    if(typeof vrPageGoods !== 'function') throw new Error('vrPageGoods is not defined');
    VR.page = 'fly';
    vrDrawConsole(true);
    const ls = FLY[11];
    hangGoods(ls, 'none');
    vrDrawConsole(true);
    /* the row's goods cell: the hit that opens the picker */
    const row = VR.hits.find(h=>h.goodsFor === ls);
    if(!row) throw new Error('no goods button on the fly row');
    row.fn();
    if(VR.page !== 'goods' || VR.goodsFor !== ls)
      throw new Error('the picker did not open: page='+VR.page);
    vrDrawConsole(true);
    const pick = VR.hits.find(h=>h.goodsKey === 'house');
    if(!pick) throw new Error('the picker offers no house curtain');
    pick.fn();
    if(ls.goodsKey !== 'house')
      throw new Error('the pipe still carries '+ls.goodsKey);
    if(VR.page !== 'fly') throw new Error('it did not come back to the rail');
    /* and the rail was rebuilt, so the new line has a rope to haul */
    if(!VR.ropes.some(r=>r.ls === ls))
      throw new Error('the newly hung line has no rope at the rail');
    hangGoods(ls, 'none');
    vrBuildRopes();
    return 'picked from the console, hung, and roped';
  });
  P('the roller paints a curtain it is held against', ()=>{
    /* goods round RULING T: the trigger with a dipped roller against cloth
       colours the whole of that lineset's goods */
    const rack = RACKS.palace;
    const ls = FLY.find(l=>l.goodsKey === 'legs');
    if(!ls) throw new Error('nothing masking to paint');
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.copy(rack.roller.mesh.getWorldPosition(new THREE.Vector3()));
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'roller') throw new Error('no roller in hand');
    rack.roller.color = PAINT_COLORS[6].c;             // GREEN, as if dipped
    /* stand the roller head on the cloth */
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(ls.goods);
    const at = box.getCenter(new THREE.Vector3());
    const head = rack.roller.head.getWorldPosition(new THREE.Vector3());
    c0.position.add(at.clone().sub(head));
    c0.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    vrSelect(0, true);
    let hit = 0;
    ls.goods.traverse(o=>{
      if(o.isMesh && o.material && o.material.isMeshStandardMaterial &&
         o.material.color.getHex() === PAINT_COLORS[6].c) hit++;
    });
    vrSqueeze(0, false);
    rack.roller.color = null;
    if(!hit) throw new Error('the trigger did not paint the cloth');
    return hit + ' cloths took the colour';
  });
  P('painting says how it works, step by step', ()=>{
    /* the owner's report: "I can't figure out how to do the painting."
       The mechanic stands; the room now SAYS it (build-feel, ask 4). */
    if(typeof vrPaintLabel !== 'function') throw new Error('vrPaintLabel is not defined');
    const rack = RACKS.palace;
    const rp = rack.roller.mesh.getWorldPosition(new THREE.Vector3());
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.copy(rp).add(new THREE.Vector3(0.3, 0, 0));
    c0.updateMatrixWorld(true);
    vrLabel(null);
    vrPaintLabel(1);                           // dt=1 beats the throttle
    if(VR.labelTxt !== 'SQUEEZE TO TAKE THE ROLLER')
      throw new Error('an empty hand at the rack hears: '+VR.labelTxt);
    /* the roller in hand, dry: the label moves to the cans */
    c0.position.copy(rp);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'roller')
      throw new Error('the roller was not taken: '+(VR.held && VR.held.kind));
    vrLabel(null);
    vrPaintLabel(1);
    if(VR.labelTxt !== 'DIP THE HEAD IN A CAN')
      throw new Error('the dry roller hears: '+VR.labelTxt);
    /* dipped, wood at the head: the trigger line */
    rack.roller.color = PAINT_COLORS[0].c;
    const wd = regWood('s2x4');
    wd.mesh.rotation.set(0, 0, Math.PI/2);
    wd.mesh.position.copy(rack.roller.head.getWorldPosition(new THREE.Vector3()));
    scene.updateMatrixWorld(true);
    vrLabel(null);
    vrPaintLabel(1);
    if(VR.labelTxt !== 'TRIGGER TO PAINT')
      throw new Error('the dipped roller hears: '+VR.labelTxt);
    vrSqueeze(0, false);                       // re-racks the roller
    rack.roller.color = null;
    BODIES.splice(BODIES.indexOf(wd), 1);
    vrLabel(null);
    return 'the rack, the can and the trigger all speak up';
  });
  P('a piece released over the drum is gone', ()=>{
    /* build-feel RULING P: the trash can outranks every release snap */
    if(typeof TRASH === 'undefined' || !TRASH.palace) throw new Error('no drum in the shed');
    const b = regWood('s2x4');
    b.mesh.rotation.set(0, 0, Math.PI/2);
    const dp = TRASH.palace.group.getWorldPosition(new THREE.Vector3());
    b.mesh.position.set(dp.x, 1.2, dp.z);      // centre over the mouth
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(dp.x + 1.21, 1.2, dp.z);   // held by the end
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== b)
      throw new Error('not taken: '+(VR.held && VR.held.kind));
    vrSqueeze(0, false);
    if(BODIES.indexOf(b) >= 0) throw new Error('the drum did not take it');
    if(b.mesh.parent) throw new Error('the mesh is still in the scene');
    return 'binned on release';
  });
  P('a sheet is a handful at its corner', ()=>{
    const s = regWood('sheet');
    s.mesh.rotation.set(0, 0, 0);
    s.mesh.position.set(4, 1.5, -1.2);         // corner at x=5.22, y=2.11
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(5.25, 2.14, -1.2);         // 3cm past the corner both ways
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== s)
      throw new Error('the corner of the sheet was not taken: '+(VR.held && VR.held.kind));
    vrSqueeze(0, false);
    return 'the corner is in reach';
  });
  P('a built frame comes by the end of any plank', ()=>{
    const a1 = regWood('s2x4'), a2 = regWood('s2x4');
    a1.mesh.rotation.set(0, 0, 0); a2.mesh.rotation.set(0, 0, 0);
    a1.mesh.position.set(6, 1.22, -0.6);
    a2.mesh.position.set(6.038, 1.22, -0.6);   // faces kissing in x
    scene.updateMatrixWorld(true);
    addNail(a1, {body:a2}, new THREE.Vector3(6.019, 1.9, -0.6), new THREE.Vector3(1,0,0));
    addNail(a1, {body:a2}, new THREE.Vector3(6.019, 0.6, -0.6), new THREE.Vector3(1,0,0));
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(6, 2.47, -0.6);            // 3cm past a1's top end
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'asm')
      throw new Error('the frame was not taken whole: '+(VR.held && VR.held.kind));
    vrSqueeze(0, false);
    const asm = a1.asm;
    while(a1.asm && a1.asm.nails.length) removeNail(a1.asm.nails[0]);   // tidy
    if(ASSEMBLIES.indexOf(asm) >= 0) throw new Error('tidy-up failed');
    return 'the whole frame by one plank end';
  });
  P('the gun nails two pieces already lying together', ()=>{
    const a = regWood('s2x4'), b = regWood('s2x4');
    a.mesh.rotation.set(0, 0, Math.PI/2);      // both lying flat, long axis X
    b.mesh.rotation.set(0, 0, Math.PI/2);
    a.mesh.position.set(8, 0.019, -1.0);
    b.mesh.position.set(8, 0.019, -1.089);     // side by side, faces kissing in z
    scene.updateMatrixWorld(true);
    const c1 = VR.controllers[1];
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c1.position.copy(VR.holsters.nailgun.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    if(VR.tools[1] !== 'nailgun') throw new Error('the gun never drew: '+VR.tools[1]);
    c1.position.set(8, 0.1, -1.045);           // over the seam, nothing in the other hand
    c1.updateMatrixWorld(true);
    const before = ASSEMBLIES.length;
    vrSelect(1, true);
    if(ASSEMBLIES.length !== before + 1) throw new Error('the shot never joined them');
    if(a.state !== 'fixed' || b.state !== 'fixed') throw new Error('states: '+a.state+'/'+b.state);
    const n = a.asm.nails[0];
    if(Math.abs(n.axis.z) < 0.9) throw new Error('the nail went in sideways: '+JSON.stringify(n.axis));
    vrSqueeze(1, false);                       // gun home
    const asm = a.asm;
    while(a.asm && a.asm.nails.length) removeNail(a.asm.nails[0]);   // tidy
    if(ASSEMBLIES.indexOf(asm) >= 0) throw new Error('tidy-up failed');
    return 'two loose pieces, one trigger, one frame';
  });
  P('the gun refuses pieces apart, and a seam out of reach', ()=>{
    const a = regWood('s2x4'), b = regWood('s2x4');
    a.mesh.rotation.set(0, 0, Math.PI/2);
    b.mesh.rotation.set(0, 0, Math.PI/2);
    a.mesh.position.set(8, 0.019, -3.0);
    b.mesh.position.set(8, 0.019, -3.289);     // 0.2m of daylight between them
    scene.updateMatrixWorld(true);
    const c1 = VR.controllers[1];
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c1.position.copy(VR.holsters.nailgun.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    c1.position.set(8, 0.1, -3.14);
    c1.updateMatrixWorld(true);
    let before = ASSEMBLIES.length;
    vrSelect(1, true);
    if(ASSEMBLIES.length !== before) throw new Error('it nailed across 0.2m of air');
    /* close the gap so they touch, but fire from too far away */
    b.mesh.position.set(8, 0.019, -3.089);
    scene.updateMatrixWorld(true);
    c1.position.set(8, 0.1, -3.75);            // ~0.66m from the seam
    c1.updateMatrixWorld(true);
    before = ASSEMBLIES.length;
    vrSelect(1, true);
    if(ASSEMBLIES.length !== before) throw new Error('it nailed from across the room');
    vrSqueeze(1, false);
    a.mesh.position.set(8, 0.019, -5.0);       // tidy: part them so later tests
    scene.updateMatrixWorld(true);             // never see this pair as a seam
    return 'daylight refused, long reach refused';
  });
  P('nails go where the gun POINTS, not to the nearest seam', ()=>{
    /* build-feel RULING L: the trigger casts the gun's ray; the hit spot
       is where the nail drives, and the piece it touches there is the
       partner.  A near seam OFF the ray must lose to a far seam ON it. */
    if(typeof nailRay !== 'function') throw new Error('nailRay is not defined');
    /* pair 1 — NEAR the muzzle (seam ~0.36m) but off the ray, up and behind */
    const a1 = regWood('s2x4'), b1 = regWood('s2x4');
    a1.mesh.rotation.set(0, 0, Math.PI/2); b1.mesh.rotation.set(0, 0, Math.PI/2);
    a1.mesh.position.set(16, 1.331, 0.1);
    b1.mesh.position.set(16, 1.369, 0.1);      // stacked, faces kissing in y
    /* pair 2 — 0.85m out along the ray */
    const a2 = regWood('s2x4'), b2 = regWood('s2x4');
    a2.mesh.rotation.set(0, 0, Math.PI/2); b2.mesh.rotation.set(0, 0, Math.PI/2);
    a2.mesh.position.set(16, 1.0, -0.9);
    b2.mesh.position.set(16, 1.038, -0.9);     // stacked at ray height
    scene.updateMatrixWorld(true);
    const c1 = VR.controllers[1];
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c1.position.copy(VR.holsters.nailgun.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    if(VR.tools[1] !== 'nailgun') throw new Error('the gun never drew: '+VR.tools[1]);
    c1.position.set(16, 1.0, 0);
    c1.quaternion.set(0, 0, 0, 1);             // ray straight down -z, at pair 2
    c1.updateMatrixWorld(true);
    const before = ASSEMBLIES.length;
    vrSelect(1, true);
    if(ASSEMBLIES.length !== before + 1) throw new Error('the shot joined nothing');
    if(a2.state !== 'fixed' || b2.state !== 'fixed')
      throw new Error('the RAY pair was not the one joined: '+a2.state+'/'+b2.state);
    if(a1.state !== 'loose' || b1.state !== 'loose')
      throw new Error('the shot went to the near pair the gun was not pointing at');
    /* the nail sits where the ray landed, on the pieces, not at the muzzle */
    const nl = a2.asm.nails[0].mesh.getWorldPosition(new THREE.Vector3());
    if(Math.abs(nl.x - 16) > 0.1 || Math.abs(nl.z + 0.9) > 0.15)
      throw new Error('the nail landed at '+nl.x.toFixed(2)+','+nl.z.toFixed(2));
    const asm2 = a2.asm;
    while(a2.asm && a2.asm.nails.length) removeNail(a2.asm.nails[0]);
    if(ASSEMBLIES.indexOf(asm2) >= 0) throw new Error('tidy-up failed');
    /* a lone piece under the ray: nothing behind it to bite — refusal.
       Clear of the pair 2 pieces still standing at x=16. */
    a1.mesh.position.set(17.6, 1.0, -0.9); b1.mesh.position.set(20, 0.019, 8);
    scene.updateMatrixWorld(true);
    c1.position.set(17.6, 1.0, 0);
    c1.updateMatrixWorld(true);
    const before2 = ASSEMBLIES.length;
    vrSelect(1, true);
    if(ASSEMBLIES.length !== before2) throw new Error('it nailed a lone piece to thin air');
    vrSqueeze(1, false);                       // gun home
    [a1, b1, a2, b2].forEach(x=>BODIES.splice(BODIES.indexOf(x), 1));
    return 'the ray picks the joint; a lone piece refuses';
  });
  P('the gun talks when a seam is in reach', ()=>{
    /* fail BEFORE touching shared state, so a pre-change run cannot
       strand the gun in the hand and cascade into later tests */
    if(typeof vrGunLabel !== 'function') throw new Error('vrGunLabel is not defined');
    const a = regWood('s2x4'), b = regWood('s2x4');
    a.mesh.rotation.set(0, 0, Math.PI/2);
    b.mesh.rotation.set(0, 0, Math.PI/2);
    a.mesh.position.set(10, 0.019, -1.0);
    b.mesh.position.set(10, 0.019, -1.089);
    scene.updateMatrixWorld(true);
    const c1 = VR.controllers[1];
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c1.position.copy(VR.holsters.nailgun.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    c1.position.set(10, 0.1, -1.045);
    c1.updateMatrixWorld(true);
    vrLabel(null);
    vrGunLabel(1);                             // dt=1 beats the 0.12s throttle
    if(VR.labelTxt !== 'TRIGGER TO NAIL')
      throw new Error('the gun said nothing: '+VR.labelTxt);
    c1.position.set(10, 0.1, -3.5);            // walk away
    c1.updateMatrixWorld(true);
    vrLabel(null);
    vrGunLabel(1);
    if(VR.labelTxt === 'TRIGGER TO NAIL') throw new Error('it is still talking from 2.5m');
    vrSqueeze(1, false);
    a.mesh.position.set(10, 0.019, -5.0);      // tidy: part the pair
    scene.updateMatrixWorld(true);
    return 'label at the seam, silence away from it';
  });
  P('the gun refuses the table — a work surface, never a joint', ()=>{
    const t = regBody('table', makeBodyMesh('table'), null);
    t.state = 'loose'; t.restH = 0;
    t.mesh.position.set(12, 0, -1.0);
    t.mesh.rotation.set(0, 0, 0);
    const w = regWood('s2x4');
    w.mesh.rotation.set(0, 0, Math.PI/2);
    w.mesh.position.set(12, 1.15, -1.0);
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0], c1 = VR.controllers[1];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(12, 1.15, -1.0);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);                          // wood in hand over the table
    if(!VR.held || !VR.held.body || VR.held.body !== w) throw new Error('the wood was not taken');
    vrUpdateHold(0.05);
    if(!VR.snap || !VR.snap.target || !VR.snap.target.table)
      throw new Error('no tabletop offer under the hold');
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c1.position.copy(VR.holsters.nailgun.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    c1.position.set(12, 1.0, -1.0);
    c1.updateMatrixWorld(true);
    const before = ASSEMBLIES.length;
    vrSelect(1, true);
    if(ASSEMBLIES.length !== before) throw new Error('it nailed the work to the table');
    if(VR.snap) throw new Error('the refused offer still stands');
    vrSqueeze(1, false);
    vrSqueeze(0, false);
    BODIES.splice(BODIES.indexOf(w), 1);
    BODIES.splice(BODIES.indexOf(t), 1);
    return 'the table holds it — no nail needed';
  });
  P('the tape stretches to a hand and marks the wood', ()=>{
    const c0 = VR.controllers[0], c1 = VR.controllers[1];
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c0.position.copy(VR.holsters.tape.getWorldPosition(new THREE.Vector3()));
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(VR.tools[0] !== 'tape') throw new Error('the tape never drew');
    c0.position.set(0, 1.2, -0.6); c0.updateMatrixWorld(true);
    const tab = VR.toolMesh.tape.getWorldPosition(new THREE.Vector3());
    c1.position.copy(tab); c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    if(!VR.held || VR.held.kind !== 'tapetab') throw new Error('the tab was not taken');
    c1.position.set(0.61, 1.2, -0.6); c1.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    if(Math.abs(VR.held.len - 0.61) > 0.12) throw new Error('the tape reads '+VR.held.len);
    /* trigger on the tape hand: a pencil tick on the wood nearest the tab
       (two loose studs stand together here — either may take the mark) */
    scene.updateMatrixWorld(true);
    vrSelect(0, true);
    if(!BODIES.some(b=>b.kind==='wood' && b.tick)) throw new Error('no mark on the wood');
    vrSqueeze(1, false);
    vrSqueeze(0, false);
    if(VR.tapeLn && VR.tapeLn.visible) throw new Error('the line outlived the hold');
    return 'stretched, read in ft-in, marked';
  });
  P('wood let go over the table seats, and the cutter cuts under the trigger', ()=>{
    const st = SAWS.palace.track;
    const sheet = regWood('sheet');
    scene.updateMatrixWorld(true);
    const over = st.seat.getWorldPosition(new THREE.Vector3()); over.y += 0.35;
    sheet.mesh.position.copy(over);
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.copy(over);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== sheet)
      throw new Error('the sheet was not taken: '+(VR.held && VR.held.kind));
    vrSqueeze(0, false);
    if(sheet.state !== 'seated' || sheet.station !== st) throw new Error('never seated: '+sheet.state);
    /* the cutter: grab, slide, trigger */
    scene.updateMatrixWorld(true);
    const grip = st.cutter.getWorldPosition(new THREE.Vector3()); grip.y += 0.15;
    c0.position.copy(grip);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'saw') throw new Error('the cutter was not taken: '+(VR.held && VR.held.kind));
    c0.position.x += 0.4;
    c0.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    const before = BODIES.length;
    vrSelect(0, true);
    if(BODIES.length !== before + 1) throw new Error('the trigger never cut');
    vrSqueeze(0, false);
    /* tidy: both halves off the table and loose */
    st.pieces.slice().forEach(p=>{ grabBody(p); p.state = 'loose'; });
    return 'seated on release, cut on the trigger';
  });
  P('the roller dips at the rack and paints at the trigger', ()=>{
    const rack = RACKS.palace;
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.copy(rack.roller.mesh.getWorldPosition(new THREE.Vector3()));
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'roller') throw new Error('the roller was not taken: '+(VR.held && VR.held.kind));
    /* dip: the head to the red can (poured in by the build suite? no — this
       suite's rack has its four stock cans; use the first, black) */
    const can = rack.canMeshes[0], color = can.userData.paintColor;
    scene.updateMatrixWorld(true);
    const at = can.getWorldPosition(new THREE.Vector3());
    c0.position.copy(at); c0.position.y += 0.02;
    c0.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    if(rack.roller.color !== color) throw new Error('the dip never took');
    /* paint a sheet standing by the rack */
    const sheet = regWood('sheet');
    sheet.mesh.position.copy(at); sheet.mesh.position.z -= 0.8;
    scene.updateMatrixWorld(true);
    c0.position.copy(sheet.mesh.getWorldPosition(new THREE.Vector3()));
    c0.updateMatrixWorld(true);
    vrSelect(0, true);
    if(!sheet.mesh.material.some(m=>m === woodMat(color))) throw new Error('no face took the coat');
    vrSqueeze(0, false);
    if(rack.roller.mesh.parent !== rack.roller.home) throw new Error('the roller never re-racked');
    BODIES.splice(BODIES.indexOf(sheet), 1);
    return 'dipped black, painted, re-racked on release';
  });
  P('a held hinge under the gun makes a door swing; a hand slides the run', ()=>{
    /* a standing stud and a loose panel beside it, mid-stage */
    const post = regWood('s2x4'), door = regWood('s2x4');
    post.mesh.position.set(-0.6, 1.22, -0.8);
    door.mesh.position.set(-0.45, 1.22, -0.8);
    scene.updateMatrixWorld(true);
    const keep = BUILD_VENUE; BUILD_VENUE = 'palace';
    const hb = regBody('hinge', makeBodyMesh('hinge'), null);
    const t1 = regBody('track', makeBodyMesh('track'), null);
    const t2 = regBody('track', makeBodyMesh('track'), null);
    const car = regBody('carriage', makeBodyMesh('carriage'), null);
    BUILD_VENUE = keep;
    hb.state = t1.state = t2.state = car.state = 'loose';
    hb.mesh.position.set(-0.52, 1.22, -0.75);
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0], c1 = VR.controllers[1];
    /* hand 0 takes the hinge, hand 1 draws the gun and fires */
    c0.quaternion.set(0,0,0,1);
    c0.position.copy(hb.mesh.position); c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.body !== hb) throw new Error('the hinge was not taken');
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c1.position.copy(VR.holsters.nailgun.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    c1.position.set(-0.5, 1.2, -0.7); c1.updateMatrixWorld(true);
    vrSelect(1, true);
    if(door.asm !== post.asm || !door.asm) throw new Error('the shot never hinged them');
    if(!(door.pivot || post.pivot)) throw new Error('nothing swings');
    vrSqueeze(0, false); vrSqueeze(1, false);
    /* the track: lay one section by hand-of-god, ride the carriage, slide */
    t1.mesh.position.set(2.2, 0.05, -0.8); t1.mesh.updateMatrixWorld(true);
    const run = layTrack(t1, null);
    layTrack(t2, run);
    car.mesh.position.copy(run.root.localToWorld(new THREE.Vector3(0, 0.1, 0)));
    car.mesh.updateMatrixWorld(true);
    rideTrack(car, run);
    scene.updateMatrixWorld(true);
    c0.position.copy(car.mesh.getWorldPosition(new THREE.Vector3()));
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'slide') throw new Error('the carriage hand is '+(VR.held && VR.held.kind));
    c0.position.x += 0.5; c0.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    if(car.slider.position.x < 0.2) throw new Error('the run never slid: x='+car.slider.position.x.toFixed(3));
    vrSqueeze(0, false);
    return 'hinged by the gun, slid by the hand';
  });
  P('a session end holsters everything', ()=>{
    const c0 = VR.controllers[0];
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c0.position.copy(VR.holsters.nailgun.getWorldPosition(new THREE.Vector3()));
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(VR.tools[0] !== 'nailgun') throw new Error('setup: no gun');
    exitVR();
    if(VR.tools[0]) throw new Error('the session ended with a tool in hand');
    if(VR.toolMesh.nailgun.parent !== VR.holsters.nailgun) throw new Error('the gun never went home');
    return 'tools home, snap cleared';
  });

  console.log('--- vr: bodies ---');
  P('a squeeze takes a lantern off its pipe, and the channel dies in the hand', ()=>{
    enterVR();
    goToView(3);
    VR.rig.position.set(0,0,0); VR.rig.rotation.set(0,0,0);
    VR.rig.updateMatrixWorld(true);
    FIXTURES.forEach(f=>{ f.level = 0; });
    const f = FIXTURES.find(x=>x.type==='fresnel' && x.ls>=0);
    f.level = 1;
    updateRig(0.05, 1);
    if(!(f._lvl > 0.5)) throw new Error('channel dark before the grab: '+f._lvl);
    const c = VR.controllers[0];
    c.quaternion.set(0,0,0,1);
    scene.updateMatrixWorld(true);
    const at = f.body.getWorldPosition(new THREE.Vector3());
    c.position.copy(at); c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body') throw new Error('the hand did not take the lantern');
    const b = VR.held.body;
    if(f.body) throw new Error('grabbed, but the point still names a body');
    updateRig(0.05, 1);
    if(f._lvl !== 0) throw new Error('off the pipe, the channel still reads '+f._lvl);
    c.position.x += 1.0; c.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    scene.updateMatrixWorld(true);
    const p = b.mesh.getWorldPosition(new THREE.Vector3());
    if(Math.abs(p.x - (at.x + 1.0)) > 0.05)
      throw new Error('the hand went to '+(at.x+1).toFixed(2)+', the lantern to '+p.x.toFixed(2));
    c.position.copy(at); c.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    vrSqueeze(0, false);
    if(b.state !== 'hung' || f.body !== b.mesh)
      throw new Error('release at the empty point left it '+b.state);
    updateRig(0.05, 1);
    if(!(f._lvl > 0.5)) throw new Error('re-hung, the channel is still dead');
    f.level = 0;
    exitVR();
    return 'off the pipe dark, back on the pipe lit';
  });
  P('release over the cart files the lantern on a shelf', ()=>{
    enterVR();
    goToView(3);
    VR.rig.position.set(0,0,0); VR.rig.rotation.set(0,0,0);
    VR.rig.updateMatrixWorld(true);
    const cart = CARTS.palace;
    cart.x = 8.5; cart.z = -27.5; cart.yaw = 0; cartPose(cart);
    const f = FIXTURES.find(x=>x.type==='fresnel' && x.ls>=0);
    const b = BODIES.find(x=>x.mesh===f.body);
    const c = VR.controllers[0];
    c.quaternion.set(0,0,0,1);
    scene.updateMatrixWorld(true);
    c.position.copy(f.body.getWorldPosition(new THREE.Vector3()));
    c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body') throw new Error('no grab');
    scene.updateMatrixWorld(true);
    const seat = cart.slots[3].getWorldPosition(new THREE.Vector3());
    c.position.set(seat.x, seat.y + 0.1, seat.z); c.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    vrSqueeze(0, false);
    if(b.state !== 'slotted' || b.slot !== cart.slots[3])
      throw new Error('release over the shelf left it '+b.state);
    if(cart.slots[3].userData.body !== b) throw new Error('the slot does not name it');
    grabBody(b);
    if(!hangBody(b, f)) throw new Error('re-hanging failed');
    exitVR();
    return 'stowed on the cart shelf';
  });
  P('the hand takes whichever is nearer — rope or lantern', ()=>{
    enterVR();
    goToView(3);
    VR.rig.position.set(0,0,0); VR.rig.rotation.set(0,0,0);
    VR.rig.updateMatrixWorld(true);
    vrBuildRopes();
    const r = VR.ropes[0];
    r.ls.locked = true;                 // a locked line cannot run away on release
    const f = FIXTURES.find(x=>x.type==='fresnel' && x.ls>=0);
    const b = BODIES.find(x=>x.mesh===f.body);
    unhangBody(b);
    scene.updateMatrixWorld(true);
    const runAt = r.runs[0].getWorldPosition(new THREE.Vector3());
    b.mesh.position.set(runAt.x + 0.25, 1.4, runAt.z);   // the venue root is the world frame
    scene.updateMatrixWorld(true);
    const c = VR.controllers[0];
    c.quaternion.set(0,0,0,1);
    c.position.set(runAt.x, 1.4, runAt.z); c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || !VR.held.rope) throw new Error('with the hand on the run, the rope should take');
    vrSqueeze(0, false);
    c.position.set(runAt.x + 0.25, 1.4, runAt.z); c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body') throw new Error('with the hand on the lantern, it should take');
    vrSqueeze(0, false);
    if(!hangBody(b, f)) throw new Error('re-hanging failed');
    exitVR();
    return 'rope in hand takes the rope, lantern in hand takes the lantern';
  });
  P('a carried lantern survives the walk, and a session end sets it down', ()=>{
    enterVR();
    goToView(3);
    VR.rig.position.set(0,0,0); VR.rig.rotation.set(0,0,0);
    VR.rig.updateMatrixWorld(true);
    const f = FIXTURES.find(x=>x.type==='fresnel' && x.ls>=0);
    const b = BODIES.find(x=>x.mesh===f.body);
    const c = VR.controllers[0];
    c.quaternion.set(0,0,0,1);
    scene.updateMatrixWorld(true);
    c.position.copy(f.body.getWorldPosition(new THREE.Vector3()));
    c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body') throw new Error('no grab');
    /* the walk to the Arc parks the palace board — the lantern is venue
       state and must stay in the hand (vrClearRopes only opens rope holds) */
    goToView(15);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== b)
      throw new Error('the stage swap opened the hand');
    goToView(3);
    c.position.set(2, 1.5, -6); c.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    exitVR();
    if(VR.held) throw new Error('vrOnEnd left a hold record');
    updateBodies(0.05);
    if(b.state !== 'loose') throw new Error('after the session it reads '+b.state);
    for(let i=0;i<200;i++) updateBodies(0.05);
    scene.updateMatrixWorld(true);
    const p = b.mesh.getWorldPosition(new THREE.Vector3());
    /* it settles onto whatever is UNDER it — an earlier test leaves a show
       standing, so the floor here may be a set piece, not the deck */
    if(p.y > 0.8) throw new Error('it never came down: y='+p.y.toFixed(2));
    if(!hangBody(b, f)) throw new Error('re-hanging failed');
    return 'carried through the walk; set down by the session end';
  });
  P('the ray presses the warehouse order screen', ()=>{
    enterVR();
    goToView(3);
    vrBuildOrderScreens();
    const sc = VR.orders.palace;
    scene.updateMatrixWorld(true);
    /* the first GEAR row's + button: canvas px (468, 132) on a 560x520
       canvas (the rows sit under the tab strip now), through the same
       v = 1 - uv.y flip the desks use */
    const u = 468/560, v = 132/520;
    const at = sc.face.localToWorld(new THREE.Vector3((u - 0.5)*1.3, (0.5 - v)*1.2, 0));
    const n = sc.face.getWorldDirection(new THREE.Vector3());
    aim(1, at.clone().add(n.multiplyScalar(1.0)), at);
    const p = vrPointAt();
    if(!p || !p.obj || p.obj.userData.orderScreen !== 'palace')
      throw new Error('the ray missed the screen');
    const c0 = sc.counts.profile || 0;   // counts start empty now, not zeroed
    vrSelect(1, true);
    if(sc.counts.profile !== c0 + 1)
      throw new Error('the press did not land: profile count '+sc.counts.profile);
    sc.counts.profile = 0; sc.status = ''; vrDrawOrder(sc);
    exitVR();
    return 'uv to pixel to a landed press';
  });

  /* ---- the crayon: the build mark (carpenters spec RULING Z) ---------- */
  P('the crayon draws from the back of the belt and stamps the deck', ()=>{
    enterVR();
    VR.rig.position.set(0,0,0); VR.rig.rotation.set(0,0,0);
    const c0 = VR.controllers[0];
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    if(!VR.holsters.crayon) throw new Error('no crayon on the belt');
    c0.position.copy(VR.holsters.crayon.getWorldPosition(new THREE.Vector3()));
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(VR.tools[0] !== 'crayon') throw new Error('the crayon never drew');
    /* down-forward at the palace deck: 60 degrees below level, facing -z.
       An earlier test left a show loaded — its floor rides at y 0.3, and
       the crayon wants the BARE deck: refuse first, strike, then stamp */
    c0.position.set(-4, 1.6, -5);
    c0.quaternion.setFromEuler(new THREE.Euler(-Math.PI/3, 0, 0));
    c0.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    if(SHOW && SHOW.key){
      vrSelect(0, true);
      if(CARP.mark) throw new Error('the show floor took the mark');
      showStrike();
      scene.updateMatrixWorld(true);
    }
    vrSelect(0, true);
    if(!CARP.mark) throw new Error('no mark was stamped');
    if(CARP.mark.venue !== 'palace' || CARP.mark.stage !== 'palace')
      throw new Error('the mark thinks it is at '+CARP.mark.venue+'/'+CARP.mark.stage);
    if(Math.abs(CARP.mark.x - -4) > 0.05 || Math.abs(CARP.mark.z - -5.924) > 0.05)
      throw new Error('the mark landed at '+CARP.mark.x.toFixed(2)+','+CARP.mark.z.toFixed(2));
    if(Math.abs(Math.abs(CARP.mark.yaw) - Math.PI) > 0.02)
      throw new Error('the mark faces yaw '+CARP.mark.yaw);
    if(!CARP.markMesh || CARP.markMesh.parent !== world)
      throw new Error('the marker is not on the venue root');
    if(Math.abs(CARP.markMesh.position.y - 0.02) > 0.001)
      throw new Error('the marker floats at y '+CARP.markMesh.position.y);
    /* paint on the floor, not a thing */
    const rc = new THREE.Raycaster(new THREE.Vector3(CARP.mark.x, 1, CARP.mark.z),
                                   new THREE.Vector3(0, -1, 0), 0, 5);
    if(rc.intersectObject(CARP.markMesh, true).length)
      throw new Error('the marker is raycastable');
    return 'stamped at '+CARP.mark.x.toFixed(1)+','+CARP.mark.z.toFixed(1);
  });
  P('the crayon refuses the fly gallery and keeps the standing mark', ()=>{
    const c0 = VR.controllers[0];
    if(VR.tools[0] !== 'crayon') throw new Error('the crayon is not in hand');
    const was = {x: CARP.mark.x, z: CARP.mark.z};
    /* the operating gallery is WALKABLE at y ~8 — a floor, but not a deck */
    c0.position.set(XR + 1.6, 9.5, -6);
    c0.quaternion.setFromEuler(new THREE.Euler(-Math.PI/2, 0, 0));
    c0.updateMatrixWorld(true);
    vrSelect(0, true);
    if(CARP.mark.x !== was.x || CARP.mark.z !== was.z)
      throw new Error('the gallery took the mark');
    return 'the gallery refused; the mark stood';
  });
  P('a second stamp moves the one mark — Arc deck, offset corrected', ()=>{
    const c0 = VR.controllers[0];
    if(VR.tools[0] !== 'crayon') throw new Error('the crayon is not in hand');
    const mesh = CARP.markMesh;
    const fr = STAGES.arcMain.crew;
    const ax = (fr.xMin + fr.xMax)/2, az = (fr.zMin + fr.zMax)/2;
    c0.position.set(ax, 1.6, az);
    c0.quaternion.setFromEuler(new THREE.Euler(-Math.PI/2, 0, 0));
    c0.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    vrSelect(0, true);
    if(CARP.mark.venue !== 'arc' || CARP.mark.stage !== 'arcMain')
      throw new Error('the Arc mark thinks it is at '+CARP.mark.venue+'/'+CARP.mark.stage);
    if(CARP.markMesh !== mesh) throw new Error('a second marker was minted');
    if(CARP.markMesh.parent !== ARC.group) throw new Error('the Arc marker is not under ARC.group');
    if(Math.abs((CARP.markMesh.position.x + ARC.X) - CARP.mark.x) > 0.05)
      throw new Error('the Arc offset was not corrected: local x '+CARP.markMesh.position.x.toFixed(2));
    vrSqueeze(0, false);
    if(VR.tools[0]) throw new Error('the crayon did not holster');
    exitVR();
    return 'one mark, moved to the Arc, -ARC.X corrected';
  });

  /* ---- the CARPENTERS screen (carpenters spec RULING X, PR 5) ---------- */
  P('the carpenter screens hang beside the order screens and answer the ray', ()=>{
    enterVR();
    goToView(3);
    vrBuildOrderScreens();
    if(!VR.carps || !VR.carps.palace || !VR.carps.arc) throw new Error('no carpenter screens');
    scene.updateMatrixWorld(true);
    for(const k of ['palace','arc']){
      const sc = VR.carps[k];
      if(sc.face.userData.carpScreen !== k) throw new Error('the '+k+' face is untagged');
      if(VR.deskMeshes.indexOf(sc.face) < 0) throw new Error('the '+k+' face is not in the pick list');
      if(sc.canvas.width !== 560 || sc.canvas.height !== 520)
        throw new Error('the '+k+' canvas is '+sc.canvas.width+'x'+sc.canvas.height);
      /* beside its order screen on the same wall: offset in x, same z,
         and far enough apart that the two glasses never overlap */
      const op = VR.orders[k].face.getWorldPosition(new THREE.Vector3());
      const cp = sc.face.getWorldPosition(new THREE.Vector3());
      const dx = Math.abs(cp.x - op.x);
      if(dx < 1.44 || dx > 3) throw new Error('the '+k+' screens sit '+dx.toFixed(2)+'m apart in x');
      if(Math.abs(cp.z - op.z) > 0.05 || Math.abs(cp.y - op.y) > 0.3)
        throw new Error('the '+k+' screen left the wall of its order screen');
    }
    /* the right hand resolves it the way it resolves every desk */
    const face = VR.carps.palace.face;
    const at = face.localToWorld(new THREE.Vector3(0, 0, 0));
    const n = face.getWorldDirection(new THREE.Vector3());
    aim(1, at.clone().add(n.multiplyScalar(1.0)), at);
    const p = vrPointAt();
    if(!p || p.obj !== face) throw new Error('the ray did not resolve the carpenter screen');
    if(Math.abs(p.u - 0.5) > 0.03 || Math.abs(p.v - 0.5) > 0.03)
      throw new Error('dead centre read u,v = '+p.u.toFixed(2)+','+p.v.toFixed(2));
    return 'two screens, tagged, in the pick list, beside their order screens';
  });
  P('a catalogue row pressed through the glass selects, and the line follows', ()=>{
    const sc = VR.carps.palace;
    CARP.mark = null;                    // the crayon tests left a mark standing
    sc.sel = null; sc.status = '';
    vrDrawCarp(sc);
    if(sc.markLine !== 'NO MARK') throw new Error('the mark line says '+sc.markLine);
    /* the row found by META on the hit record, never by pixel (VR.md) */
    const row = sc.hits.find(h=>h.carpKey === 'flat4x8');
    if(!row) throw new Error('no flat4x8 row found by META');
    const u = (row.x + row.w/2)/sc.canvas.width, v = (row.y + row.h/2)/sc.canvas.height;
    const at = sc.face.localToWorld(new THREE.Vector3((u - 0.5)*1.3, (0.5 - v)*1.2, 0));
    const n = sc.face.getWorldDirection(new THREE.Vector3());
    aim(1, at.clone().add(n.multiplyScalar(1.0)), at);
    vrSelect(1, true);
    if(sc.sel !== 'flat4x8') throw new Error('the press selected '+sc.sel);
    if(sc.stockLine !== 'TAKES 1× SHEET · 3× 2x4')
      throw new Error('the stock line says: '+sc.stockLine);
    return 'selected by a real press; no mark, so the line claims nothing';
  });
  P('the half-second shed tick keeps the carpenter glass live', ()=>{
    const sc = VR.carps.palace;
    if(sc.markLine !== 'NO MARK') throw new Error('setup: the mark line reads '+sc.markLine);
    carpSetMark('palace', 'palace', 0, -6, 0);     // stamp, but press nothing
    if(sc.markLine !== 'NO MARK')
      throw new Error('something redrew early — the tick is not what is under test');
    updateOrders(0.6);                   // p2m: one 0.5s tick for ALL the wall screens
    if(sc.markLine !== 'MARK: PALACE')
      throw new Error('after the tick the mark line reads '+sc.markLine);
    return 'the mark reached the glass on the shed tick, no press needed';
  });
  P('every refusal lands as its spec string through the glass', ()=>{
    const sc = VR.carps.palace;
    const press = ()=>{
      vrDrawCarp(sc);
      const h = sc.hits.find(x=>x.carpCall);
      if(!h) throw new Error('no CALL on the glass');
      const u = (h.x + h.w/2)/sc.canvas.width, v = (h.y + h.h/2)/sc.canvas.height;
      const at = sc.face.localToWorld(new THREE.Vector3((u - 0.5)*1.3, (0.5 - v)*1.2, 0));
      const n = sc.face.getWorldDirection(new THREE.Vector3());
      aim(1, at.clone().add(n.multiplyScalar(1.0)), at);
      vrSelect(1, true);
      return sc.status;
    };
    scene.updateMatrixWorld(true);
    sc.sel = null; sc.status = ''; CARP.mark = null;
    if(press() !== 'PICK A PIECE') throw new Error('no selection said: '+sc.status);
    sc.sel = 'flat4x8';
    if(press() !== 'NO MARK') throw new Error('no mark said: '+sc.status);
    carpSetMark('arc', 'arcMain', ARC.X + 1, -5, 0);
    if(press() !== 'MARK IS IN THE OTHER HOUSE') throw new Error('other house said: '+sc.status);
    carpSetMark('palace', 'palace', 0, -6, 0);
    /* an empty shed: park every full palace stick out of the survey for one
       press ('carried' passes every switch untouched — p6b), restored after */
    const parked = [];
    BODIES.forEach(b=>{
      if(b.kind === 'wood' && b.venue === 'palace' &&
         (b.state === 'loose' || b.state === 'slotted') && carpFullStick(b)){
        parked.push({b, state:b.state}); b.state = 'carried';
      }
    });
    const needSaid = press();
    parked.forEach(x=>{ x.b.state = x.state; });
    if(needSaid !== 'NEED 1× SHEET · 3× 2x4') throw new Error('the need line says: '+needSaid);
    /* the cap, enforced at THIS screen too (RULING Y): stock in, book full */
    const keep = BUILD_VENUE; BUILD_VENUE = 'palace';
    regWood('sheet'); regWood('s2x4'); regWood('s2x4'); regWood('s2x4');
    BUILD_VENUE = keep;
    const fakes = [];
    while(venueBuildCount('palace') < 149){
      const f = {kind:'paint', venue:'palace', mesh:new THREE.Object3D(), state:'loose', point:null, slot:null};
      fakes.push(f); BODIES.push(f);
    }
    const fullSaid = press();
    fakes.forEach(f=>BODIES.splice(BODIES.indexOf(f), 1));
    if(fullSaid !== 'PIECES FULL') throw new Error('the cap says: '+fullSaid);
    /* one queue with the show crew (RULING AA) */
    const ran = CREW.running; CREW.running = 'in';
    const busySaid = press();
    CREW.running = ran;
    if(busySaid !== 'CREW BUSY') throw new Error('busy says: '+busySaid);
    if(CREW.running) throw new Error('a refused call left the crew running');
    exitVR();
    return 'PICK A PIECE / NO MARK / OTHER HOUSE / NEED list / PIECES FULL / CREW BUSY';
  });

  console.log('--- vr: the meter tells the truth (RULING DJ) ---');

  P('the wrist meter reports draw calls and triangles', ()=>{
    /* multiview does not exist at any three.js version, so both eyes cost
       two passes and our own batching is the only lever left on the draw
       call count.  Nothing reported it where it could be read. */
    enterVR();
    renderer.info.render.calls = 137;
    renderer.info.render.triangles = 24000;
    for(let i=0;i<160;i++) vrUpdate(0.016, 0.016);
    const Pm = VR.perf;
    if(!Pm) throw new Error('nothing was recorded');
    if(Pm.calls !== 137)
      throw new Error('the meter reads ' + Pm.calls + ' draw calls, the renderer says 137');
    if(Pm.tris !== 24000)
      throw new Error('the meter reads ' + Pm.tris + ' triangles, the renderer says 24000');
    return '137 calls and 24k triangles reached the wrist';
  });

  P('the average reports PAST the game clock clamp of 50ms', ()=>{
    /* p7 clamps dt to 50ms so a model load cannot teleport the show, and
       the meter used to read that clamped figure — so every frame worse
       than 50 was recorded as exactly 50.  The first headset readings came
       back at 48ms, two off a ceiling nobody knew was there, which made
       them a floor rather than a measurement.  p7 hands the raw frame time
       over beside the clamped one now: a 120ms frame must read 120. */
    for(let i=0;i<160;i++) vrUpdate(0.05, 0.120);
    const Pm = VR.perf;
    if(Math.abs(Pm.avg - 120) > 1)
      throw new Error('120ms frames average ' + Pm.avg.toFixed(1) + 'ms');
    if(Pm.worst < 119)
      throw new Error('the peak saturated at ' + Pm.worst.toFixed(1) + 'ms');
    return 'a 120ms frame reads ' + Pm.avg.toFixed(0) + ', not 50';
  });

  P('a load hitch is capped so it cannot poison the window', ()=>{
    /* the meter has its OWN ceiling, four times the game clamp.  Uncapped,
       one three-second stall sits in the 120-frame ring and adds 25ms to
       the average for two seconds after it ended. */
    for(let i=0;i<160;i++) vrUpdate(0.05, 3.0);
    const Pm = VR.perf;
    if(Pm.worst > PERF_CEIL + 0.001)
      throw new Error('a 3000ms hitch recorded as ' + Pm.worst.toFixed(0) + 'ms');
    if(Pm.worst < PERF_CEIL - 0.001)
      throw new Error('the ceiling reads ' + Pm.worst.toFixed(0) + ', not ' + PERF_CEIL);
    exitVR();
    return 'capped at the meter ceiling of ' + PERF_CEIL + 'ms';
  });

  console.log('--- vr: RULING DK, the session samples the environment ---');

  P('a session mints geometry, and every bit of it follows the light bed', ()=>{
    /* THE GAP THIS EXISTS FOR.  vrOnStart runs five builders — controllers,
       desks, ropes, belt, console — long after init(), so a session mints ~142
       standard materials that the boot walk could never have seen.  Left alone
       they sit at the default 1: 1.8x the driven value at full bed and 7.27x in
       a blackout, and the largest block of them is the rope rail.  The desktop
       assertion in full14 cannot see this, because it never enters a session. */
    const ours = ()=>{
      const out = [], seen = [];
      scene.traverse(o=>{
        if(!o.isMesh || !o.material) return;
        const list = Array.isArray(o.material) ? o.material : [o.material];
        for(const m of list){
          if(!m || !m.isMeshStandardMaterial || seen.indexOf(m) >= 0) continue;
          seen.push(m); out.push(m);
        }
      });
      return out;
    };
    enterVR();
    if(!VR.active) throw new Error('sessionstart did not take');
    /* the guard is that the session's OWN geometry is standing and measurable —
       not a before/after delta, because earlier cases in this suite have already
       been in and out of a session and the builders all return early the second
       time */
    if(!VR.ropes || !VR.ropes.length) throw new Error('the session built no ropes to measure');
    if(!VR.rig) throw new Error('the session built no rig to measure');
    const ropeMats = [];
    for(const r of VR.ropes){
      const m = r.mesh && r.mesh.material;
      if(m && m.isMeshStandardMaterial && ropeMats.indexOf(m) < 0) ropeMats.push(m);
    }
    if(!ropeMats.length) throw new Error('no rope carries a standard material');
    const after = ours();
    for(const m of ropeMats)
      if(after.indexOf(m) < 0)
        throw new Error('a rope material is not reachable from the scene — the sweep would miss it');
    /* run the real frame so ENV_LIVE is whatever the room says, then read the
       session's own geometry back off it */
    let clock = 0;
    const step = dt=>{ clock += dt; updateFades(dt); updateRig(dt, clock); };
    for(let i=0;i<30;i++) step(1/72);
    const stray = after.filter(m=>m.envMapIntensity !== ENV_LIVE);
    if(stray.length){
      exitVR();
      throw new Error(stray.length + ' of ' + after.length +
        ' standard materials read ' + stray[0].envMapIntensity +
        ' in a session against ENV_LIVE ' + ENV_LIVE);
    }
    /* and they MOVE: a session held at a fixed value is the BH fault wearing
       a headset */
    const lit = ENV_LIVE;
    const keepH = HOUSE.house, keepW = HOUSE.work, keepP = HOUSE.practical;
    HOUSE.house = 0; HOUSE.work = 0; HOUSE.practical = 0;
    FIXTURES.forEach(f=>{ f.level = 0; });
    for(let i=0;i<90;i++) step(1/72);
    const dark = ENV_LIVE;
    const darkStray = after.filter(m=>m.envMapIntensity !== dark);
    HOUSE.house = keepH; HOUSE.work = keepW; HOUSE.practical = keepP;
    exitVR();
    if(darkStray.length)
      throw new Error(darkStray.length + ' session materials stuck at ' +
                      darkStray[0].envMapIntensity + ' through a blackout');
    if(!(lit > dark + 0.01))
      throw new Error('the session does not follow the bed: lit ' + lit.toFixed(4) +
                      ' against a blackout ' + dark.toFixed(4));
    return ropeMats.length + ' rope materials among ' + after.length +
           ' in a session, all driven, blackout ' + dark.toFixed(3) + ' -> lit ' + lit.toFixed(3);
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
