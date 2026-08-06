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
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,170):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); window.__errs.push(name+': '+e.message); } };

  /* run the world forward, the way the frame loop does */
  function run(seconds, dt){
    dt = dt || 0.05;
    const n = Math.ceil(seconds/dt);
    for(let i=0;i<n;i++){
      updateCrew(dt); updateFly(dt); updateDockDoors(dt);
    }
  }

  console.log('--- the crew ---');
  P('there is a crew and a panel to call them with', ()=>{
    for(const id of ['#crewIn','#crewOut','#crewStop','#crewSpeed','#crewStat','#crewLog'])
      if(!document.querySelector(id)) throw new Error('missing '+id);
    if(typeof CREW === 'undefined') throw new Error('no crew');
    return 'panel and crew present';
  });
  P('a stagehand is a person, not a box', ()=>{
    const h = crewSpawn(1)[0];
    let meshes = 0;
    h.group.traverse(o=>{ if(o.isMesh) meshes++; });
    if(meshes < 6) throw new Error('only '+meshes+' parts');
    if(!h.legL || !h.legR || !h.armL || !h.armR || !h.hands)
      throw new Error('missing limbs');
    // the legs have to actually swing when walking
    h.state = 'walk'; h.x = 0; h.z = 0; h.ax = 10; h.az = 0;
    const a = [];
    for(let i=0;i<20;i++){ updateHand(h, 0.05); a.push(h.legL.rotation.x); }
    const swing = Math.max.apply(null,a) - Math.min.apply(null,a);
    if(swing < 0.4) throw new Error('the legs barely move: '+swing.toFixed(2));
    h.state = 'off'; updateHand(h, 0.05);
    return meshes+' parts, legs swing '+swing.toFixed(2)+' rad';
  });

  console.log('--- a load in ---');
  P('calling the load in queues real work', ()=>{
    showLoad('outsiders');
    const n = crewStart('in');
    if(n < 6) throw new Error('only '+n+' jobs in a whole load in');
    const kinds = {};
    CREW.jobs.forEach(j=>kinds[j.kind] = (kinds[j.kind]||0)+1);
    if(!kinds.on) throw new Error('nothing gets carried on');
    if(!kinds.fly) throw new Error('nothing gets flown in');
    if(!kinds.doors) throw new Error('the dock doors are never called');
    if(!kinds.hold) throw new Error('nothing holds the rail back');
    // every piece of scenery is queued before the first lineset
    const firstFly = CREW.jobs.findIndex(j=>j.kind === 'fly');
    const lastOn   = CREW.jobs.map(j=>j.kind).lastIndexOf('on');
    if(lastOn > firstFly) throw new Error('the rail is called before the deck is finished');
    return n+' jobs: '+Object.keys(kinds).map(k=>kinds[k]+' '+k).join(', ');
  });
  P('the stage starts empty and the crew are on the dock', ()=>{
    const hidden = SHOW.group.children.filter(o=>o.userData.crewHidden).length;
    if(!hidden) throw new Error('the set is already standing');
    const out = CREW.people.filter(h=>h.x < DOCK.inner).length;
    if(out < 4) throw new Error('only '+out+' hands turned up on the dock');
    return hidden+' pieces struck, '+out+' hands waiting';
  });
  P('they work: things move while it runs', ()=>{
    const before = SHOW.group.children.filter(o=>o.visible).length;
    run(30);
    const after = SHOW.group.children.filter(o=>o.visible).length;
    if(after <= before) throw new Error('30 seconds in and nothing has come on');
    if(!CREW.log.length) throw new Error('no work logged');
    return before+' pieces up at the start, '+after+' after 30 seconds';
  });
  P('a load in finishes, and finishes the job', ()=>{
    run(400);
    if(CREW.running) throw new Error('still going after 7 minutes, '+CREW.jobs.length+' jobs left');
    const hidden = SHOW.group.children.filter(o=>o.userData.crewHidden).length;
    if(hidden) throw new Error(hidden+' pieces never made it on');
    const dark = SHOW.group.children.filter(o=>!o.visible && crewHandleable(o)).length;
    if(dark) throw new Error(dark+' pieces are still invisible');
    if(CREW.people.some(h=>h.group.visible)) throw new Error('the crew never went home');
    return 'set standing, crew away, log: '+CREW.log[0];
  });
  P('the goods came in with it', ()=>{
    const hung = FLY.filter(l=>l.goodsKey !== 'none');
    const inTrim = hung.filter(l=>l.pos < OUT_TRIM - 1);
    if(inTrim.length < 3) throw new Error('only '+inTrim.length+' of '+hung.length+' linesets came in');
    return inTrim.length+' of '+hung.length+' linesets at trim';
  });
  P('the dock doors opened and shut again', ()=>{
    if(DOCKDOORS.some(d=>d.target > 0.5)) throw new Error('a door was left up');
    return 'all shut';
  });

  P('nothing flies in until the whole deck is on', ()=>{
    crewStop(true);
    showStrike();
    crewLoadShow('outsiders');
    const hung = FLY.filter(l=>l.goodsKey !== 'none');
    if(!hung.length) throw new Error('nothing is hung to watch');
    let firstInAt = -1, deckDoneAt = -1;
    for(let i=0;i<12000 && CREW.running;i++){
      updateCrew(0.05); updateFly(0.05); updateDockDoors(0.05);
      if(deckDoneAt < 0 && !SHOW.group.children.some(o=>o.userData.crewHidden))
        deckDoneAt = i;
      if(firstInAt < 0 && hung.some(l=>l.target < OUT_TRIM - 1))
        firstInAt = i;
      if(firstInAt >= 0 && deckDoneAt >= 0) break;
    }
    if(firstInAt < 0) throw new Error('nothing ever came in');
    if(deckDoneAt < 0) throw new Error('the deck was never finished');
    if(firstInAt < deckDoneAt)
      throw new Error('a lineset came in at '+(firstInAt*0.05).toFixed(1)+'s, before the deck was done at '+
                      (deckDoneAt*0.05).toFixed(1)+'s');
    for(let i=0;i<12000 && CREW.running;i++){ updateCrew(0.05); updateFly(0.05); updateDockDoors(0.05); }
    if(CREW.running) throw new Error('the load in never finished');
    return 'deck finished at '+(deckDoneAt*0.05).toFixed(0)+'s, first lineset in at '+
           (firstInAt*0.05).toFixed(0)+'s';
  });
  P('the hold really blocks — nobody takes a job past it', ()=>{
    crewStop(true); showStrike(); crewLoadShow('outsiders');
    // run until the hold is at the head of the queue
    let guard = 0;
    while(CREW.running && CREW.jobs.length && CREW.jobs[0].kind !== 'hold' && guard++ < 20000){
      updateCrew(0.05); updateFly(0.05); updateDockDoors(0.05);
    }
    if(!CREW.jobs.length || CREW.jobs[0].kind !== 'hold')
      throw new Error('never reached the hold');
    /* Step one frame at a time and catch the moment the hold is consumed.
       At that instant the deck must be finished and nobody may still be
       carrying anything.                                                  */
    let held = 0, released = false, hidden = -1, carrying = -1;
    while(CREW.running && held++ < 20000){
      const wasHold = CREW.jobs.length && CREW.jobs[0].kind === 'hold';
      updateCrew(0.05); updateFly(0.05); updateDockDoors(0.05);
      const stillHold = CREW.jobs.length && CREW.jobs[0].kind === 'hold';
      if(wasHold && !stillHold){
        released = true;
        hidden = SHOW.group.children.filter(o=>o.userData.crewHidden).length;
        carrying = CREW.people.filter(h=>h.carry).length;
        break;
      }
    }
    if(!released) throw new Error('the hold was never released');
    if(hidden) throw new Error('the rail was let go with '+hidden+' pieces still to come on');
    if(carrying) throw new Error(carrying+' hands were still carrying when the rail was let go');
    for(let i=0;i<12000 && CREW.running;i++){ updateCrew(0.05); updateFly(0.05); updateDockDoors(0.05); }
    if(CREW.running) throw new Error('it never got past the hold');
    return 'the queue stopped dead until the deck was clear';
  });

  console.log('--- and a load out ---');
  P('the load out strikes it all', ()=>{
    const n = crewStart('out');
    if(n < 6) throw new Error('only '+n+' jobs');
    run(400);
    if(CREW.running) throw new Error('still going, '+CREW.jobs.length+' jobs left');
    const still = SHOW.group.children.filter(o=>o.visible && crewHandleable(o)).length;
    if(still) throw new Error(still+' pieces are still standing');
    const inTrim = FLY.filter(l=>l.goodsKey !== 'none' && l.pos < OUT_TRIM - 1);
    if(inTrim.length) throw new Error(inTrim.length+' linesets never went out');
    return 'stage clear, everything flown out';
  });
  P('and it can all be brought back in again', ()=>{
    crewStart('in');
    run(400);
    if(CREW.running) throw new Error('the second load in never finished');
    const hidden = SHOW.group.children.filter(o=>o.userData.crewHidden).length;
    if(hidden) throw new Error(hidden+' pieces missing on the second run');
    return 'in, out and back in again';
  });

  console.log('--- calling a show in ---');
  P('the button calls the whole show in from nothing', ()=>{
    crewStop(true);
    showStrike();
    if(SHOW.key) throw new Error('the stage is not clear to start with');
    const btn = document.querySelector('#showCrewBtn');
    if(!btn) throw new Error('no CALL THE CREW button');
    btn.click();
    if(SHOW.key !== 'outsiders') throw new Error('it did not load the show');
    if(!CREW.running) throw new Error('the crew were not called');
    const up = SHOW.group.children.filter(o=>o.visible && crewHandleable(o)).length;
    if(up) throw new Error(up+' pieces are already standing before they start');
    return 'show built, struck, crew called — '+CREW.jobs.length+' jobs';
  });
  P('a get-in happens under work light', ()=>{
    if(HOUSE.work < 0.5) throw new Error('the work light is not on, at '+HOUSE.work);
    if(FIXTURES.some(f=>f.level > 0.05)) throw new Error('the rig is still lit during the get-in');
    if(RIG.haze > 0.01) throw new Error('the haze is on during a get-in');
    return 'work light at '+Math.round(HOUSE.work*100)+'%, rig out';
  });
  P('the rail starts out so the crew really haul it in', ()=>{
    const hung = FLY.filter(l=>l.goodsKey !== 'none');
    const inAlready = hung.filter(l=>l.pos < OUT_TRIM - 1);
    if(inAlready.length) throw new Error(inAlready.length+' linesets were already at trim');
    return hung.length+' linesets sitting out, waiting to be hauled in';
  });
  P('and when they finish, the show look comes up', ()=>{
    run(500);
    if(CREW.running) throw new Error('the get-in never finished');
    const hidden = SHOW.group.children.filter(o=>o.userData.crewHidden).length;
    if(hidden) throw new Error(hidden+' pieces never came on');
    // the fade is running, so step the board on a little
    for(let i=0;i<200;i++) updateFades(0.05);
    if(HOUSE.work > 0.05) throw new Error('the work light stayed on at '+HOUSE.work);
    // the get-in hands you the show at the top: preset up, house open, cue 1 next
    if(HOUSE.house < 0.4) throw new Error('the house did not open, at '+HOUSE.house);
    if(nextCue !== 1) throw new Error('standing by at '+nextCue+', not the top of the show');
    const inTrim = FLY.filter(l=>l.goodsKey !== 'none' && l.pos < OUT_TRIM - 1).length;
    if(inTrim < 3) throw new Error('only '+inTrim+' linesets got hauled in');
    return 'work light out, preset up, house at '+Math.round(HOUSE.house*100)+
           '%, standing by at the top, '+inTrim+' linesets at trim';
  });
  P('the crew LOAD IN button calls the selected show too', ()=>{
    crewStop(true); showStrike();
    showSel = 'outsiders';
    document.querySelector('#crewIn').click();
    if(SHOW.key !== 'outsiders') throw new Error('it did not pick up the selection');
    if(!CREW.running) throw new Error('nothing was called');
    run(500);
    for(let i=0;i<200;i++) updateFades(0.05);
    if(CREW.running) throw new Error('it never finished');
    return 'same job from the crew panel';
  });
  P('a load out drops back to work light and leaves it there', ()=>{
    document.querySelector('#crewOut').click();
    if(HOUSE.work < 0.5) throw new Error('no work light for the get-out');
    run(500);
    if(CREW.running) throw new Error('the get-out never finished');
    if(HOUSE.work < 0.5) throw new Error('the work light went off after the get-out');
    const still = SHOW.group.children.filter(o=>o.visible && crewHandleable(o)).length;
    if(still) throw new Error(still+' pieces still standing');
    return 'stage bare under work light';
  });

  P('the climbing frames go out with everything else', ()=>{
    crewStop(true); showStrike();
    crewLoadShow('outsiders');
    if(!SHOW.gyms || !SHOW.gyms.length) throw new Error('no climbing frames in this show');
    const frames = SHOW.gyms.map(g=>g.group);
    // they must be part of the crew's load list, not left behind as an effect
    if(!frames.every(f=>crewHandleable(f)))
      throw new Error('a climbing frame is flagged as an effect');
    if(frames.some(f=>f.visible))
      throw new Error('the frames are still standing at the top of a get-in');
    for(let i=0;i<14000 && CREW.running;i++){ updateCrew(0.05); updateFly(0.05); updateDockDoors(0.05); }
    if(CREW.running) throw new Error('the get-in never finished');
    if(frames.some(f=>!f.visible)) throw new Error('a frame never came on');
    // now take it out again
    crewStart('out');
    for(let i=0;i<14000 && CREW.running;i++){ updateCrew(0.05); updateFly(0.05); updateDockDoors(0.05); }
    if(CREW.running) throw new Error('the get-out never finished');
    const left = frames.filter(f=>f.visible).length;
    if(left) throw new Error(left+' climbing frames are still on the stage after the strike');
    // and nothing else is left either
    const standing = SHOW.group.children.filter(o=>o.visible && crewHandleable(o)).length;
    if(standing) throw new Error(standing+' pieces of scenery are still standing');
    return 'both frames struck, stage clear';
  });
  P('the rain and the fire are never carried off', ()=>{
    crewStop(true); showStrike(); crewLoadShow('outsiders');
    if(!SHOW.rain) throw new Error('no rain to check');
    if(crewHandleable(SHOW.rain.mesh)) throw new Error('the rain is on the crew list');
    if(SHOW.fire && crewHandleable(SHOW.fire.group))
      throw new Error('the fire is on the crew list');
    // and no light anywhere in the set is hideable
    const lit = SHOW.group.children.filter(o=>{
      let l = false; o.traverse(c=>{ if(c.isLight) l = true; }); return l;
    });
    if(lit.some(crewHandleable)) throw new Error('a light-carrying piece is on the crew list');
    for(let i=0;i<14000 && CREW.running;i++){ updateCrew(0.05); updateFly(0.05); updateDockDoors(0.05); }
    if(!SHOW.rain.mesh.parent) throw new Error('the rain was disposed of');
    return lit.length+' light-carrying pieces and the effects all left alone';
  });

  console.log('--- behaviour ---');
  P('nobody walks through the back wall or off the stage', ()=>{
    crewStart('in');
    let bad = null;
    for(let i=0;i<8000;i++){
      updateCrew(0.05); updateFly(0.05); updateDockDoors(0.05);
      for(const h of CREW.people){
        if(!h.group.visible) continue;
        if(h.z < D.backWall - 0.5) bad = 'z='+h.z.toFixed(1);
        if(h.z > 3) bad = 'out in the house, z='+h.z.toFixed(1);
        if(h.x > XL) bad = 'through the stage-left wall, x='+h.x.toFixed(1);
        if(h.x < DOCK.outer) bad = 'out on the street, x='+h.x.toFixed(1);
      }
      if(bad) break;
      if(!CREW.running) break;
    }
    if(bad) throw new Error('a hand went ' + bad);
    return 'everyone stayed inside the building';
  });
  P('stand down clears them away mid job', ()=>{
    crewStart('out');
    run(20);
    crewStop(true);
    if(CREW.running) throw new Error('still running');
    if(CREW.people.some(h=>h.group.visible)) throw new Error('a hand is still standing there');
    if(CREW.people.some(h=>h.carry)) throw new Error('somebody is still holding a case');
    const hidden = SHOW.group.children.filter(o=>o.userData.crewHidden).length;
    if(hidden) throw new Error('standing down left '+hidden+' pieces struck');
    return 'gone, and the set put back';
  });
  P('the pace control drives it', ()=>{
    const sl = document.querySelector('#crewSpeed');
    sl.value = 300; sl.oninput({target:sl});
    if(CREW.speed < 2.9) throw new Error('the slider did nothing');
    crewStart('in');
    let fast = 0;
    for(let i=0;i<4000 && CREW.running;i++){ updateCrew(0.05); updateFly(0.05); updateDockDoors(0.05); fast++; }
    sl.value = 100; sl.oninput({target:sl});
    if(CREW.running) throw new Error('even at treble pace it did not finish');
    return 'finished in '+(fast*0.05).toFixed(0)+' seconds at 3x';
  });
  P('it works with no show loaded, building out of stock', ()=>{
    showStrike();
    crewStart('in');
    const before = SET.length;
    run(400);
    if(CREW.running) throw new Error('never finished with no show up');
    if(SET.length <= before) throw new Error('no stock scenery was set: '+SET.length);
    crewStart('out');
    run(400);
    if(SET.length) throw new Error(SET.length+' pieces left on the deck after the strike');
    return 'built a set out of stock and struck it again';
  });
  P('the crew are cheap enough to keep around', ()=>{
    let meshes = 0;
    CREW.group.traverse(o=>{ if(o.isMesh) meshes++; });
    if(CREW.people.length > 8) throw new Error(CREW.people.length+' hands is too many');
    if(meshes > 90) throw new Error(meshes+' meshes for the crew');
    return CREW.people.length+' hands, '+meshes+' meshes total';
  });

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;
const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); } catch(e){ console.log('THREW '+e.message); console.log(e.stack.split('\n').slice(0,5).join('\n')); }
