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

  P('hauling a rope down brings the lineset in', ()=>{
    goToView(3);
    vrBuildRopes();
    const r = VR.ropes[0], ls = r.ls;
    flyOut(ls); run(700, 0.05);
    const out = ls.pos;
    // put a hand on it and pull down half a metre
    scene.updateMatrixWorld(true);
    const at = r.mesh.getWorldPosition(new THREE.Vector3());
    const c = VR.controllers[0];
    VR.rig.updateMatrixWorld(true);
    c.position.copy(VR.rig.worldToLocal(at.clone()));
    c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held) throw new Error('the hand did not take hold of it');
    c.position.y -= 0.5;
    c.updateMatrixWorld(true);
    vrUpdateHold();
    if(ls.pos >= out - 1)
      throw new Error('pulling down moved it to ' + ls.pos.toFixed(2) + ' from ' + out.toFixed(2));
    const pulled = out - ls.pos;
    vrSqueeze(0, false);
    if(VR.held) throw new Error('it would not let go');
    const stopped = ls.pos;
    run(200, 0.05);
    if(Math.abs(ls.pos - stopped) > 0.2)
      throw new Error('it kept moving after the hand let go');
    return 'half a metre of rope brought it in ' + pulled.toFixed(1) + 'm, and it stayed there';
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
