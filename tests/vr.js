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
    this.renderCount = 0; this.xr = new FakeXR(); this._loop = null; this._pr = 1; }
  setPixelRatio(v){ this._pr = v; } getPixelRatio(){ return this._pr; }
  setSize(){}
  setAnimationLoop(fn){ this._loop = fn; }
  render(scene, camera){ this.renderCount++;
    // walk the graph the way the renderer would, to catch bad matrices
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); }
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
  const btns = {left:  [0,1,2,3,4].map(()=>({pressed:false})),
                right: [0,1,2,3,4].map(()=>({pressed:false}))};
  const enterVR = ()=>{
    renderer.xr._session = {
      inputSources: [
        {handedness:'left',  gamepad:{axes:sticks.left,  buttons:btns.left}},
        {handedness:'right', gamepad:{axes:sticks.right, buttons:btns.right}}
      ]
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
    if(Player.pos.z < D.backWall)
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
    if(VR.ropes.length !== hung)
      throw new Error(VR.ropes.length + ' ropes for ' + hung + ' hung linesets');
    scene.updateMatrixWorld(true);
    for(const r of VR.ropes){
      const p = r.mesh.getWorldPosition(new THREE.Vector3());
      if(Math.abs(p.z - r.ls.z) > 1.2)
        throw new Error('the rope for ' + r.ls.id + ' is at z=' + p.z.toFixed(1) +
                        ', its lineset is at ' + r.ls.z.toFixed(1));
    }
    return VR.ropes.length + ' ropes at the pin rail';
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
  /* push the little red lever with a hand, the way the GO button is pushed */
  const throwLever = (r)=>{
    scene.updateMatrixWorld(true);
    const at = r.knob.getWorldPosition(new THREE.Vector3());
    const grip = VR.grips[1];
    VR.rig.updateMatrixWorld(true);
    grip.position.copy(VR.rig.worldToLocal(at.clone()));
    grip.updateMatrixWorld(true);
    r.cool = 0;
    vrUpdateRopes(0.016);
    grip.position.set(0, 0, 0); grip.updateMatrixWorld(true);
  };
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
    if(ls.locked) throw new Error('taking hold did not take the lock off');
    c.position.y -= 0.5;
    c.updateMatrixWorld(true);
    vrUpdateHold(0.05);
    if(ls.pos >= out - 1)
      throw new Error('pulling down moved it to ' + ls.pos.toFixed(2) + ' from ' + out.toFixed(2));
    const pulled = out - ls.pos;
    /* throw the little red lever before you let go, or it runs away */
    throwLever(r);
    if(!ls.locked) throw new Error('the lever did not lock it off');
    vrSqueeze(0, false);
    if(VR.held) throw new Error('it would not let go');
    if(ls.runaway) throw new Error('it ran away with the lock thrown');
    const stopped = ls.pos;
    run(200, 0.05);
    if(Math.abs(ls.pos - stopped) > 0.2)
      throw new Error('it kept moving after the hand let go');
    vrRopeLock(r, false);                       // leave the rail as we found it
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

  P('let go while hauling out and it slows, stops and comes back down', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = anElectric(), ls = r.ls;
    flyTo(ls, 12, true); run(4, 0.05);
    const c = takeHold(r, 0);
    if(!VR.held) throw new Error('the hand did not take hold of it');
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

  P('the red lever stops a runaway, and taking hold takes the lock off again', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = anElectric(), ls = r.ls;
    flyTo(ls, 14, true); run(4, 0.05);
    takeHold(r, 0);
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
    /* and taking hold of the rope again takes the lock straight off */
    takeHold(r, 0);
    if(!VR.held) throw new Error('the hand did not take hold of it');
    if(ls.locked) throw new Error('grabbing it left the lock on');
    vrRopeLock(r, true);                        // tie it off before we walk away
    vrSqueeze(0, false);
    if(ls.runaway) throw new Error('a locked line ran away on release');
    vrRopeLock(r, false);
    return 'caught at ' + caught.toFixed(2) + 'm and held within two frames';
  });

  P('every rope is a loop — a head block at the grid, a floor block on the deck', ()=>{
    const look = (label)=>{
      vrBuildRopes();
      scene.updateMatrixWorld(true);
      if(!VR.ropes.length) throw new Error(label + ' has no ropes at all');
      for(const r of VR.ropes){
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
      }
      return VR.ropes.length;
    };
    goToView(3);
    const pal = look('the palace');
    goToView(15);
    const arc = look('the arc');
    goToView(3);
    return pal + ' loops at the palace, ' + arc + ' at the arc';
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
    return 'the swap opened the hand';
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

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); }
catch(e){ console.log('TOP LEVEL THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
process.exit((w.__errs||[]).length ? 1 : 0);
