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
  for(let i=0;i<60;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  window.__errs = [];
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,160):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); window.__errs.push(name+': '+e.message); } };
  const run = (secs)=>{ const n = Math.ceil(secs/0.05); for(let i=0;i<n;i++) updateSmoke(0.05); };

  console.log('--- the smoke machines ---');
  P('there are machines and a tab to run them from', ()=>{
    for(const id of ['#p-smoke','#smokeRack','#smkShot','#smkOn','#smkOff','#smkFill',
                     '#smkClear','#smkMaster','#smokeStat'])
      if(!document.querySelector(id)) throw new Error('missing '+id);
    if(!document.querySelector('#tabs button[data-p="smoke"]')) throw new Error('no SMOKE tab');
    if(SMOKE.units.length < 4) throw new Error('only '+SMOKE.units.length+' machines');
    const kinds = {};
    SMOKE.units.forEach(u=>kinds[u.kind] = (kinds[u.kind]||0)+1);
    if(!kinds.fog || !kinds.haze) throw new Error('want both foggers and hazers');
    return SMOKE.units.length+' machines: '+SMOKE.units.map(u=>u.name).join(', ');
  });
  P('each machine is a real box on the deck', ()=>{
    for(const u of SMOKE.units){
      let meshes = 0;
      u.group.traverse(o=>{ if(o.isMesh) meshes++; });
      if(meshes < 4) throw new Error(u.name+' is only '+meshes+' parts');
      if(Math.abs(u.group.position.y) > 0.1) throw new Error(u.name+' is floating');
      if(Math.abs(u.x) > D.stageW/2) throw new Error(u.name+' is off the stage');
    }
    return 'all four sitting on the boards';
  });
  P('a fader makes smoke', ()=>{
    smokeClear();
    const u = SMOKE.units[0];
    setSmoke(u, 1);
    run(4);
    const live = SMOKE.list.filter(p=>p.live).length;
    if(!live) throw new Error('nothing came out');
    if(!SMOKE.puffs.visible) throw new Error('the puffs are not being drawn');
    if(u.out < 0.5) throw new Error('the machine never came up to output');
    setSmoke(u, 0);
    run(3);
    if(u.out > 0.05) throw new Error('it did not shut off');
    return live+' puffs from one machine at full';
  });
  P('the puffs drift, spread and die', ()=>{
    smokeClear();
    const u = SMOKE.units[0];
    setSmoke(u, 1); run(1.5); setSmoke(u, 0);
    const p = SMOKE.list.find(x=>x.live);
    if(!p) throw new Error('no puff to follow');
    const x0 = p.x, z0 = p.z, t0 = p.t;
    run(2);
    if(Math.hypot(p.x - x0, p.z - z0) < 0.3 && p.live)
      throw new Error('the puff never moved');
    // and eventually the air clears on its own
    run(30);
    const left = SMOKE.list.filter(x=>x.live).length;
    if(left) throw new Error(left+' puffs are still hanging about after 30 seconds');
    return 'drifts, then clears in under half a minute';
  });
  P('a burst overrides the fader and then stops', ()=>{
    smokeClear();
    const u = SMOKE.units[1];
    setSmoke(u, 0);
    smokeBurst(u, 2);
    run(0.6);
    if(u.out < 0.4) throw new Error('the burst did not fire, out '+u.out.toFixed(2));
    run(6);
    if(u.out > 0.05) throw new Error('the burst never let go, out '+u.out.toFixed(2));
    return 'fires hard, then drops back to the fader';
  });
  P('running a machine costs fluid, and it can run dry', ()=>{
    smokeClear(); smokeRefill();
    const u = SMOKE.units[0];
    const full = u.tank;
    setSmoke(u, 1); run(60);
    if(u.tank >= full) throw new Error('the tank never went down');
    u.tank = 0.005;
    run(2);
    if(u.emit > 0.001) throw new Error('an empty machine is still making smoke');
    smokeRefill();
    if(u.tank < 0.99) throw new Error('filling did not fill it');
    run(2);
    if(u.emit < 0.1) throw new Error('it did not come back after a fill');
    if(u.tank > 0.999) throw new Error('running it costs nothing after a fill');
    setSmoke(u, 0); smokeClear();
    // and a very long run drops it below temperature
    smokeRefill(); u.heat = 1; setSmoke(u, 1); run(200);
    if(u.heat > 0.25) throw new Error('it never needs to re-heat');
    if(u.emit > 0.001) throw new Error('a cold machine is still making smoke');
    setSmoke(u, 0); run(60);
    if(u.heat < 0.9) throw new Error('it never came back up to temperature');
    smokeClear(); smokeRefill();
    return 'runs down, refuses when dry, needs a re-heat after a long run';
  });
  P('smoke in the air thickens the haze the beams read', ()=>{
    smokeClear(); smokeRefill();
    RIG.haze = 0.2;
    const dry = hazeNow();
    smokeAll(1); run(40);
    const wet = hazeNow();
    if(!(wet > dry + 0.1)) throw new Error('the haze did not thicken: '+dry.toFixed(2)+' to '+wet.toFixed(2));
    if(wet > 1.001) throw new Error('the haze went past full');
    smokeAll(0); smokeClear();
    if(Math.abs(hazeNow() - dry) > 0.01) throw new Error('it did not come back down');
    return 'haze '+dry.toFixed(2)+' dry, '+wet.toFixed(2)+' with all four running';
  });
  P('the panel buttons drive it', ()=>{
    smokeClear(); smokeRefill();
    document.querySelector('#smkOn').click();
    if(SMOKE.units.some(u=>u.target < 0.5)) throw new Error('ALL ON missed a machine');
    document.querySelector('#smkOff').click();
    if(SMOKE.units.some(u=>u.target > 0.01)) throw new Error('ALL OFF missed a machine');
    document.querySelector('#smkShot').click();
    if(SMOKE.units.some(u=>u.burst <= 0)) throw new Error('the big shot missed a machine');
    run(8);
    document.querySelector('#smkClear').click();
    if(SMOKE.list.some(p=>p.live)) throw new Error('CLEAR AIR left puffs behind');
    const m = document.querySelector('#smkMaster');
    m.value = 0; m.oninput({target:m});
    setSmoke(SMOKE.units[0], 1); run(3);
    if(SMOKE.units[0].out > 0.05) throw new Error('the master does not hold it down');
    m.value = 100; m.oninput({target:m});
    run(3);
    if(SMOKE.units[0].out < 0.5) throw new Error('the master does not let it back up');
    smokeAll(0); smokeClear();
    return 'all on, all off, big shot, clear and master all work';
  });
  P('the fader on each strip drives its own machine', ()=>{
    buildSmokeUI();
    const strips = document.querySelectorAll('#smokeRack .smk');
    if(strips.length !== SMOKE.units.length)
      throw new Error(strips.length+' strips for '+SMOKE.units.length+' machines');
    const f = strips[2].querySelector('.smkFader');
    f.value = 80; f.oninput({target:f});
    if(Math.abs(SMOKE.units[2].target - 0.8) > 0.01) throw new Error('the fader did nothing');
    strips[2].querySelector('button').click();
    if(SMOKE.units[2].burst <= 0) throw new Error('the BURST button did nothing');
    smokeAll(0); smokeClear(); syncSmokeUI();
    if(!document.querySelector('#smokeStat').innerHTML) throw new Error('no readout');
    return 'per-machine fader and burst both live';
  });
  P('it is not expensive', ()=>{
    if(SMOKE.n > 500) throw new Error(SMOKE.n+' puffs is too many');
    let meshes = 0;
    SMOKE.group.traverse(o=>{ if(o.isMesh) meshes++; });
    // one instanced batch plus the machine boxes
    if(meshes > 30) throw new Error(meshes+' meshes for the smoke');
    if(!SMOKE.puffs.isInstancedMesh) throw new Error('the puffs are not instanced');
    return SMOKE.n+' puffs in one draw call, '+meshes+' meshes all told';
  });
  P('the crew never carry a smoke machine off', ()=>{
    if(!crewHandleable) throw new Error('no crew');
    if(crewHandleable(SMOKE.puffs)) throw new Error('the puffs are on the crew list');
    // and the machines live outside the show group entirely
    if(SHOW.group && SHOW.group.children.indexOf(SMOKE.group) !== -1)
      throw new Error('the smoke rig is inside the show');
    return 'the rig is the house kit, not the show';
  });
  P('300 frames with all four running', ()=>{
    smokeRefill(); smokeAll(1);
    for(let i=0;i<300;i++){ const cb=window.__raf; window.__raf=null; if(cb) cb(Date.now()+i*16); }
    smokeAll(0); smokeClear();
    return 'no errors';
  });

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;
const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); } catch(e){ console.log('THREW '+e.message); console.log(e.stack.split('\n').slice(0,5).join('\n')); }
