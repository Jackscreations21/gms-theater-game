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
  const enterVR = ()=>{
    renderer.xr._session = {
      inputSources: [
        {handedness:'left',  gamepad:{axes:sticks.left}},
        {handedness:'right', gamepad:{axes:sticks.right}}
      ]
    };
    renderer.xr.fire('sessionstart');
  };
  const exitVR = ()=>{ renderer.xr._session = null; renderer.xr.fire('sessionend'); };
  const stick = (hand, x, y)=>{ sticks[hand][2] = x; sticks[hand][3] = y; };

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
    return 'shadows off, beams capped to ' + VR.beamCap + ', far ' + camera.far;
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
