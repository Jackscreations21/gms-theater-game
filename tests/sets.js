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
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  window.__errs = [];
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,180):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); window.__errs.push(name+': '+e.message); } };
  const run = (n, dt)=>{ for(let i=0;i<n;i++){ updateFades(dt); updateFly(dt); updateStorm(dt); updateSmoke(dt); } };
  const vis = o=>{ let p=o; while(p){ if(!p.visible) return false; p=p.parent; } return true; };
  const world4 = o=>{ SHOW.group.updateMatrixWorld(true);
                      return o.getWorldPosition(new THREE.Vector3()); };

  console.log('--- the murder at haversham manor ---');

  /* This assertion used to read "beetlejuice is gone and the play is in", and
     it guarded a removal that predates this repo's first commit — no reason for
     it was ever recorded anywhere.  The owner has since supplied a recording of
     a Beetlejuice performance and asked for the show, and RULING AO settles how
     close its scenery may sit to the real staging.  So the removal is REVERSED,
     deliberately and on the record, and what is worth guarding changed with it:
     the play must not have been displaced to make room, and the book must hold
     all five.  Its own suite is tests/beetlejuice.js. */
  P('the book holds five, beetlejuice among them, the play still in', ()=>{
    if(!SHOWS.beetlejuice) throw new Error('beetlejuice is not in the book');
    if(!SHOWS.goeswrong) throw new Error('the play was displaced to make room');
    const names = Object.keys(SHOWS).map(k=>SHOWS[k].name);
    if(names.indexOf('BEETLEJUICE') < 0) throw new Error('not listed');
    if(names.length !== 5) throw new Error(names.length+' productions, expected 5');
    return names;
  });

  P('it loads: a study with a second storey on it', ()=>{
    if(!showLoad('goeswrong')) throw new Error('would not load');
    let m = 0, tri = 0;
    SHOW.group.traverse(o=>{ if(o.isMesh){ m++;
      const g = o.geometry; if(g && g.index) tri += g.index.count/3;
      else if(g && g.attributes.position) tri += g.attributes.position.count/3; } });
    if(m < 40) throw new Error('only '+m+' pieces');
    if(CUES.length < 15) throw new Error(CUES.length+' cues');
    return m+' pieces, '+(tri/1000).toFixed(1)+'k triangles, '+CUES.length+' cues';
  });

  P('the fireplace fire is real: every seed finite and inside the firebox', ()=>{
    showLoad('goeswrong');
    if(!SHOW.fire) throw new Error('no fire was made');
    const f = SHOW.fire;
    const all = f.flames.concat(f.ember);
    for(const p of all)
      if(!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.z))
        throw new Error('a seed is not finite: '+JSON.stringify(p));
    for(const p of all)
      if(p.x < -8.3 || p.x > -7 || p.z < -7.2 || p.z > -5.2)
        throw new Error('a seed is outside the firebox: '+p.x.toFixed(2)+','+p.z.toFixed(2));
    for(const l of f.lights)
      if(!isFinite(l.position.x) || !isFinite(l.position.y) || !isFinite(l.position.z))
        throw new Error('a fire light sits at NaN');
    return f.flames.length+' flames, '+f.ember.length+' embers, all finite';
  });

  P('scenery the crew have not brought in yet cannot be stood on', ()=>{
    showLoad('lostboys');
    SHOW.group.updateMatrixWorld(true);
    /* find a piece the crew WILL hide (handleable) that you can stand on
       well above the deck — the upper gallery has a practical on it, so
       the crew leave that one alone, correctly */
    let at = null, before = null;
    for(const kid of SHOW.group.children){
      if(at || !crewHandleable(kid)) continue;
      kid.traverse(c=>{
        if(at || WALKABLE.indexOf(c) < 0) return;
        const p = new THREE.Box3().setFromObject(c).getCenter(new THREE.Vector3());
        const h = groundAt(p.x, p.z, p.y + 3);
        if(h !== null && h > 0.5){ at = p; before = h; }
      });
    }
    if(!at) throw new Error('no handleable walkable surface above the deck to test with');
    crewHideLoads(true);                 // what a get-in does before the carry
    const g = groundAt(at.x, at.z, at.y + 3);
    if(g !== null && g > before - 0.3)
      throw new Error('you can stand at y='+g.toFixed(2)+' on scenery that is not there');
    crewHideLoads(false);
    const after = groundAt(at.x, at.z, at.y + 3);
    if(after === null || Math.abs(after - before) > 0.01)
      throw new Error('bringing it back did not restore the floor: '+after);
    showLoad('goeswrong');               // the tests after this expect it up
    return 'hidden: '+(g === null ? 'no floor' : 'floor at '+g.toFixed(2))+
           ', shown again: '+after.toFixed(2)+'m';
  });

  P('everything that is meant to fall has a hinge of its own', ()=>{
    const want = ['post','upper','wallSL','wallUS','mantel','clock','chandelier'];
    const got = SHOW.wrong.map(p=>p.key);
    for(const k of want) if(got.indexOf(k) < 0) throw new Error('nothing called '+k);
    // each one has to be its own group, or they take each other with them
    const groups = new Set(SHOW.wrong.map(p=>p.group.uuid));
    if(groups.size !== SHOW.wrong.length) throw new Error('two of them share a group');
    // and none of them may be frozen, or they cannot move
    for(const p of SHOW.wrong)
      if(!p.group.userData.moves) throw new Error(p.key+' would be frozen by the set lock');
    return got;
  });

  P('the second storey comes down', ()=>{
    showLoad('goeswrong');
    const up = wrongFind('upper');
    const deck = up.walk[0];
    const before = world4(deck).clone();
    if(WALKABLE.indexOf(deck) < 0) throw new Error('you cannot stand on it to begin with');
    if(before.y < 3) throw new Error('it is only '+before.y.toFixed(1)+'m up');
    wrongTrigger('upper');
    run(200, 0.05);
    const after = world4(deck).clone();
    if(up.state !== 'down') throw new Error('it is still '+up.state+' after 10 seconds');
    if(before.y - after.y < 1.5)
      throw new Error('it only dropped '+(before.y-after.y).toFixed(2)+'m');
    if(Math.abs(up.ang) < 0.3) throw new Error('it came down flat, without tilting');
    if(WALKABLE.indexOf(deck) >= 0) throw new Error('you can still stand on a collapsed floor');
    return 'dropped '+(before.y-after.y).toFixed(2)+'m and tilted '+up.ang.toFixed(2)+' rad';
  });

  P('the walls go over', ()=>{
    showLoad('goeswrong');
    const out = [];
    for(const key of ['wallSL','wallUS']){
      const p = wrongFind(key);
      const top = new THREE.Vector3(0, 7.0, 0);
      p.group.updateMatrixWorld(true);
      const a = p.group.localToWorld(top.clone());
      wrongTrigger(key);
      run(260, 0.05);
      SHOW.group.updateMatrixWorld(true);
      const b = p.group.localToWorld(top.clone());
      if(p.state !== 'down') throw new Error(key+' is still '+p.state);
      if(a.y - b.y < 4) throw new Error(key+' only came down '+(a.y-b.y).toFixed(1)+'m');
      if(b.y > 2.5) throw new Error(key+' finished with its top still '+b.y.toFixed(1)+'m up');
      out.push(key+': top fell '+(a.y-b.y).toFixed(1)+'m');
    }
    return out;
  });

  P('the fireplace wall falls into the room, not out of the theatre', ()=>{
    showLoad('goeswrong');
    const p = wrongFind('wallSL');
    const top = new THREE.Vector3(0, 7.0, -5);
    p.group.updateMatrixWorld(true);
    const a = p.group.localToWorld(top.clone());
    wrongTrigger('wallSL'); run(260, 0.05);
    SHOW.group.updateMatrixWorld(true);
    const b = p.group.localToWorld(top.clone());
    if(b.x <= a.x + 2) throw new Error('it went outwards, to x='+b.x.toFixed(1));
    // and the back wall has to come downstage, towards the audience
    const q = wrongFind('wallUS');
    const t2 = new THREE.Vector3(0, 7.0, 0);
    q.group.updateMatrixWorld(true);
    const c2 = q.group.localToWorld(t2.clone());
    wrongTrigger('wallUS'); run(260, 0.05);
    SHOW.group.updateMatrixWorld(true);
    const d2 = q.group.localToWorld(t2.clone());
    if(d2.z <= c2.z + 2) throw new Error('the back wall went upstage, to z='+d2.z.toFixed(1));
    return 'the side wall falls in to x='+b.x.toFixed(1)+
           ', the back wall downstage to z='+d2.z.toFixed(1);
  });

  P('it falls under its own weight rather than on a timer', ()=>{
    showLoad('goeswrong');
    const p = wrongFind('wallUS');
    wrongTrigger('wallUS');
    const marks = [];
    for(let i=0;i<5;i++){ run(6, 0.02); marks.push(p.ang); }
    // the first stretch has to be slower than the last: it accelerates
    const early = marks[1] - marks[0], late = marks[4] - marks[3];
    if(late <= early) throw new Error('it goes over at a constant rate');
    run(400, 0.02);
    if(p.bounces < 1) throw new Error('it stopped dead instead of landing');
    return 'accelerates '+(late/early).toFixed(1)+'x on the way over, '+p.bounces+' bounces';
  });

  P('nothing finishes its fall in mid-air', ()=>{
    showLoad('goeswrong');
    wrongAll();
    run(600, 0.05);
    const stuck = SHOW.wrong.filter(p=>p.drop && p.fall < p.drop - 0.01);
    if(stuck.length)
      throw new Error(stuck.map(p=>p.key+' stopped '+(p.drop-p.fall).toFixed(2)+
                                    'm short').join('; '));
    // and the ones that were up in the air really did come down to the deck
    SHOW.group.updateMatrixWorld(true);
    const ch = wrongFind('chandelier');
    const y = ch.group.getWorldPosition(new THREE.Vector3()).y;
    if(y > 3.2) throw new Error('the chandelier settled at '+y.toFixed(1)+'m');
    return 'all seven reached the floor — the chandelier down to '+y.toFixed(1)+'m';
  });
  P('you can stand it all back up and do it again', ()=>{
    showLoad('goeswrong');
    const marks = SHOW.wrong.map(p=>({
      key:p.key,
      rot:{x:p.group.rotation.x, y:p.group.rotation.y, z:p.group.rotation.z},
      y:p.group.position.y
    }));
    wrongAll(); run(400, 0.05);
    if(wrongStanding() !== 0) throw new Error(wrongStanding()+' never went over');
    wrongReset();
    for(const m of marks){
      const p = wrongFind(m.key);
      if(p.state !== 'ok') throw new Error(m.key+' is still '+p.state);
      for(const ax of ['x','y','z'])
        if(Math.abs(p.group.rotation[ax] - m.rot[ax]) > 1e-6)
          throw new Error(m.key+' came back at the wrong angle');
      if(Math.abs(p.group.position.y - m.y) > 1e-6)
        throw new Error(m.key+' came back at the wrong height');
    }
    const deck = wrongFind('upper').walk[0];
    if(WALKABLE.indexOf(deck) < 0) throw new Error('you cannot stand on the balcony again');
    // and it will go over a second time
    wrongTrigger('upper'); run(200, 0.05);
    if(wrongFind('upper').state !== 'down') throw new Error('it will not fall twice');
    return 'seven pieces down, all seven back up, and down again';
  });

  P('the cues take it apart and the top of the show rebuilds it', ()=>{
    showLoad('goeswrong');
    const called = CUES.filter(c=>c.wrong).reduce((a,c)=>a.concat(c.wrong), []);
    if(called.length < 6) throw new Error('only '+called.length+' pieces are called in the plot');
    if(new Set(called).size !== called.length) throw new Error('a piece is called twice');
    if(!CUES[0].wrongReset) throw new Error('the preshow does not stand the set back up');
    // run the whole plot: it should end with everything down
    CUES.forEach((c,i)=>{ fireCue(i); run(40, 0.05); });
    run(400, 0.05);
    const still = SHOW.wrong.filter(p=>p.state === 'ok');
    if(still.length > 1)
      throw new Error(still.map(p=>p.key).join(', ')+' never went');
    // and going back to the top puts it together again
    fireCue(0); run(20, 0.05);
    if(wrongStanding() !== SHOW.wrong.length)
      throw new Error('the preshow left '+(SHOW.wrong.length-wrongStanding())+' on the floor');
    return called.length+' pieces called across the plot, all back up at the preshow';
  });

  P('the post goes before the storey it is holding', ()=>{
    showLoad('goeswrong');
    const qPost = CUES.findIndex(c=>c.wrong && c.wrong.indexOf('post') >= 0);
    const qUp   = CUES.findIndex(c=>c.wrong && c.wrong.indexOf('upper') >= 0);
    if(qPost < 0 || qUp < 0) throw new Error('one of them is not in the plot');
    if(qPost >= qUp) throw new Error('the storey comes down before the post is kicked out');
    return 'post on "'+CUES[qPost].label+'", storey on "'+CUES[qUp].label+'"';
  });

  P('the crew are not asked to carry the collapsing scenery about', ()=>{
    showLoad('goeswrong');
    crewForgetLoads();
    const loads = crewLoads();
    const carried = new Set();
    loads.forEach(l=>(l.parts||[]).forEach(o=>carried.add(o.uuid)));
    // a falling wall is scenery and may be carried, but nothing with a light in
    let lit = 0;
    for(const p of SHOW.wrong)
      p.group.traverse(o=>{ if(o.isLight && carried.has(p.group.uuid)) lit++; });
    if(lit) throw new Error('the crew are carrying '+lit+' lights off in the scenery');
    return loads.length+' armfuls, no lights in them';
  });

  console.log('--- hamilton ---');

  P('it loads, and it has two revolves', ()=>{
    if(!showLoad('hamilton')) throw new Error('would not load');
    if(!SHOW.revolve) throw new Error('no revolves');
    const o = SHOW.revolve.outer, i = SHOW.revolve.inner;
    if(!(o.r > i.r)) throw new Error('the outer one is not the bigger');
    return 'outer '+o.r+'m, inner '+i.r+'m, concentric';
  });

  P('they turn, and they take what is on them round', ()=>{
    const inner = SHOW.revolve.inner;
    const rider = inner.group.children.find(c=>c.isMesh && Math.abs(c.position.x) > 0.5);
    if(!rider) throw new Error('nothing is riding on it');
    inner.group.updateMatrixWorld(true);
    const before = rider.getWorldPosition(new THREE.Vector3());
    setRevolve('inner', 1);
    run(140, 0.05);
    if(Math.abs(inner.angle) < 0.3) throw new Error('it only turned '+inner.angle.toFixed(2)+' rad');
    SHOW.group.updateMatrixWorld(true);
    const after = rider.getWorldPosition(new THREE.Vector3());
    if(before.distanceTo(after) < 0.4) throw new Error('what is on it did not go round');
    setRevolve('inner', 0); run(60, 0.05);
    return 'turned '+inner.angle.toFixed(2)+' rad, the furniture moved '+before.distanceTo(after).toFixed(2)+'m';
  });

  P('they take a moment to get going and a moment to stop', ()=>{
    const o = SHOW.revolve.outer;
    o.speed = 0; o.rate = 0;
    setRevolve('outer', 1);
    run(1, 0.05);
    if(o.rate > 0.4) throw new Error('it went straight to '+o.rate.toFixed(2));
    run(120, 0.05);
    if(o.rate < 0.9) throw new Error('it never got up to speed: '+o.rate.toFixed(2));
    setRevolve('outer', 0); run(1, 0.05);
    if(o.rate < 0.5) throw new Error('it stopped dead');
    run(120, 0.05);
    if(o.rate > 0.05) throw new Error('it never stopped: '+o.rate.toFixed(2));
    return 'ramps up and coasts down instead of snapping';
  });

  P('the cues drive them, and the interval stops them', ()=>{
    const spun = CUES.filter(c=>c.rev && (c.rev.outer || c.rev.inner));
    if(spun.length < 4) throw new Error('only '+spun.length+' cues turn them');
    if(!spun.filter(c=>c.rev.outer * c.rev.inner < 0).length)
      throw new Error('they never counter-rotate');
    const iv = CUES.find(c=>/INTERVAL/.test(c.label));
    if(iv.rev && (iv.rev.outer || iv.rev.inner)) throw new Error('still turning in the interval');
    return spun.length+' cues turn them, stopped for the interval';
  });

  console.log('--- the five of them together ---');

  P('every show still stands on its own', ()=>{
    const out = [];
    for(const key of Object.keys(SHOWS)){
      showLoad(key);
      let m = 0; SHOW.group.traverse(o=>{ if(o.isMesh) m++; });
      if(m < 20) throw new Error(SHOWS[key].name+' only built '+m+' pieces');
      if(CUES.length < 12) throw new Error(SHOWS[key].name+' has '+CUES.length+' cues');
      if(!SHOW.curtainKey) throw new Error(SHOWS[key].name+' has no show curtain');
      out.push(SHOWS[key].name+': '+m+' pieces, '+CUES.length+' cues');
    }
    return out;
  });

  P('striking one leaves nothing behind for the next', ()=>{
    showLoad('goeswrong');
    if(!SHOW.wrong.length) throw new Error('nothing to strike');
    showStrike();
    if(SHOW.wrong.length) throw new Error('the falling scenery survived the strike');
    showLoad('hamilton');
    if(SHOW.wrong.length) throw new Error('hamilton inherited '+SHOW.wrong.length+' hinges');
    showStrike();
    if(SHOW.revolve) throw new Error('the revolves survived the strike');
    showLoad('goeswrong');
    if(SHOW.revolve) throw new Error('the play inherited the revolves');
    return 'hinges and revolves go with the show that brought them';
  });

  P('a set that has fallen down is struck as cleanly as one that has not', ()=>{
    showLoad('goeswrong');
    wrongAll(); run(400, 0.05);
    const before = WALKABLE.length;
    showStrike();
    const left = SHOW.walk.length;
    if(left) throw new Error(left+' walkables left behind');
    showLoad('goeswrong');
    if(wrongStanding() !== SHOW.wrong.length) throw new Error('it came back already collapsed');
    return 'struck flat and reloaded standing';
  });

  P('the crew can bring the play in', ()=>{
    crewLoadShow('goeswrong');
    for(let i=0;i<2000;i++){ updateCrew(0.05); if(!CREW.running) break; }
    if(CREW.running) throw new Error('the load in never finished');
    let hidden = 0;
    SHOW.group.children.forEach(o=>{ if(o.userData.crewHidden) hidden++; });
    if(hidden) throw new Error(hidden+' pieces left on the lorry');
    if(wrongStanding() !== SHOW.wrong.length)
      throw new Error('the crew put it up already fallen down');
    return 'brought in by hand, and standing when they finish';
  });

  P('every script in the CODE tab calls cues that exist', ()=>{
    const map = {'GOES WRONG':'goeswrong','HAMILTON':'hamilton',
                 'LOST BOYS':'lostboys','OUTSIDERS':'outsiders'};
    const out = [];
    for(const name of Object.keys(map)){
      const src = SNIPPETS[name];
      if(!src) throw new Error('no script for '+name);
      showLoad(map[name]);
      const want = (src.match(/^cue +[0-9.]+/gm) || []).map(l=>parseFloat(l.slice(4)));
      if(!want.length) throw new Error(name+' script fires no cues');
      const have = CUES.map(c=>c.n);
      const missing = want.filter(n=>have.indexOf(n) < 0);
      if(missing.length) throw new Error(name+' calls cue '+missing.join(', ')+' which is not in the plot');
      const unused = have.filter(n=>want.indexOf(n) < 0);
      if(unused.length) throw new Error(name+' script never fires cue '+unused.join(', '));
      out.push(name+': '+want.length+' cues, all of them');
    }
    return out;
  });

  P('400 frames with the whole set coming down', ()=>{
    showLoad('goeswrong');
    let err = null;
    try{
      for(let i=0;i<400;i++){
        if(i === 40) wrongAll();
        updateFades(0.016); updateFly(0.016); updateStorm(0.016);
        updateSmoke(0.016); updateRooms(true);
      }
    }catch(e){ err = e.message; }
    if(err) throw new Error(err);
    let calls = 0;
    SHOW.group.traverse(o=>{ if(o.isMesh) calls++; });
    if(calls > 130) throw new Error(calls+' draw calls for one set');
    return 'no errors, '+calls+' draw calls';
  });

  /* ---- the mover: scenery that travels, and you watch it (RULING AP) ---- */
  console.log('--- the mover: scenery that travels ---');

  /* every one of these builds its own travel.  No show uses the mover yet —
     that is PR 4's wagon — so the machinery is exercised directly. */
  /* from the ROOT, not from the object: updateMatrixWorld on a child composes
     against whatever its parent's matrixWorld happens to hold, and the group
     the mover just shifted has not recomputed its own yet */
  const wx = o => { scene.updateMatrixWorld(true); return o.matrixWorld.elements[12]; };

  /* read the WORLD matrix, never position.x.  lockShowStatic freezes the set
     with matrixAutoUpdate=false, and against a frozen group position.x takes
     the write and the stage never moves — a test that reads it back is
     reading its own assignment and will pass on a wagon that stands still. */
  P('a set crosses the deck off dt, and takes the time it should', ()=>{
    showLoad('beetlejuice');
    const sc = sceneTravel(sceneFind('attic'), 'x', -14, 2.0);   // 14m out, 2 m/s
    sceneShow('attic');
    sceneMoveTo('attic', 0);
    run(210, 1/60);                        // 3.5s — half of a 7 second crossing
    const half = wx(sc.group);
    if(!(half > -8.4 && half < -5.6))
      throw new Error('half way should be near -7.0, was '+half.toFixed(2));
    run(240, 1/60);                        // the rest of it, and a little over
    if(Math.abs(wx(sc.group)) > 0.01)
      throw new Error('never arrived: '+wx(sc.group).toFixed(3));
    if(sceneTravelling(sc)) throw new Error('still reports itself travelling');
    return 'from -14.00, half way '+half.toFixed(2)+', arrived 0.00 — in world space';
  });

  P('a set still travelling stays drawn, whatever the cue says', ()=>{
    showLoad('beetlejuice');
    const sc = sceneTravel(sceneFind('attic'), 'x', 0, 2.0);
    sceneShow('attic');
    sceneMoveTo('attic', -14);             // send it off into the wing
    run(60, 1/60);                         // one second into a seven second move
    sceneShow('cemetery');                 // and the cue moves on while it goes
    let lit = 0, dark = 0;
    sc.group.traverse(o=>{ if(o.isMesh) (o.layers.mask === 0 ? dark++ : lit++); });
    if(dark) throw new Error(dark+' meshes went dark halfway across the deck');
    if(!lit) throw new Error('the attic has no meshes to test');
    run(480, 1/60);                        // let it get where it is going
    let after = 0;
    sc.group.traverse(o=>{ if(o.isMesh && o.layers.mask !== 0) after++; });
    if(after) throw new Error(after+' meshes still live after it arrived and hid');
    if(sc.group.userData.sceneOff !== true) throw new Error('never marked off');
    return lit+' meshes drawn while travelling, all of them inert on arrival';
  });

  P('what you can stand on rides the set that is moving', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('bedroom');
    if(!sc.walk.length) throw new Error('the bedroom files nothing walkable');
    sceneTravel(sc, 'x', 0, 2.0);
    sceneShow('bedroom');
    const o = sc.walk[0], before = wx(o);
    sceneMoveTo('bedroom', -6);
    run(400, 1/60);
    const moved = before - wx(o);
    if(Math.abs(moved - 6) > 0.05)
      throw new Error('the floor moved '+moved.toFixed(2)+' where its set moved 6');
    if(WALKABLE.indexOf(o) < 0)
      throw new Error('it left WALKABLE while its own set was still on the stage');
    return 'travelled '+moved.toFixed(2)+'m with the room, still stood on';
  });

  P('a move fired mid-travel retargets — it does not queue', ()=>{
    showLoad('beetlejuice');
    const sc = sceneTravel(sceneFind('attic'), 'x', 0, 2.0);
    sceneShow('attic');
    sceneMoveTo('attic', -14);
    run(60, 1/60);
    const away = sc.group.position.x;
    sceneMoveTo('attic', 0);               // changed its mind one second in
    run(400, 1/60);
    if(Math.abs(sc.mv.off) > 0.01)
      throw new Error('ended at '+sc.mv.off.toFixed(2)+', so the first move was banked');
    return 'got to '+away.toFixed(2)+', turned round, ended 0.00';
  });

  P('a stage swap parks the wagon where it stood', ()=>{
    showLoad('beetlejuice');
    sceneTravel(sceneFind('attic'), 'x', 0, 2.0);
    sceneShow('attic');
    sceneMoveTo('attic', -5);
    run(400, 1/60);
    const parked = sceneFind('attic').mv.off;
    if(Math.abs(parked + 5) > 0.01) throw new Error('did not get there first');
    stageSwitch('arcMain', true);
    stageSwitch('palace', true);
    const back = sceneFind('attic');
    if(!back || !back.mv) throw new Error('the travel did not survive the walk');
    if(Math.abs(back.mv.off - parked) > 1e-6)
      throw new Error('came back at '+back.mv.off.toFixed(2)+', left at '+parked.toFixed(2));
    if(Math.abs(back.group.position.x - parked) > 1e-6)
      throw new Error('the record and the group disagree after the swap');
    return 'left at '+parked.toFixed(2)+', found at '+back.mv.off.toFixed(2);
  });

  P('a cue can send scenery travelling — one move, or several at once', ()=>{
    showLoad('beetlejuice');
    sceneTravel(sceneFind('attic'), 'x', 0, 3);
    sceneTravel(sceneFind('bedroom'), 'y', 0, 3);
    /* act two opens with the exterior flying out WHILE the house slides on,
       so one cue has to be able to move two things */
    showCueExtras({move:[{scene:'attic', off:-6}, {scene:'bedroom', off:9}]});
    if(sceneFind('attic').mv.target !== -6) throw new Error('the list left the first behind');
    if(sceneFind('bedroom').mv.target !== 9) throw new Error('the list left the second behind');
    if(sceneFind('bedroom').mv.axis !== 'y') throw new Error('the y axis was not honoured');
    showCueExtras({move:{scene:'attic', off:0}});
    if(sceneFind('attic').mv.target !== 0) throw new Error('a single move is not accepted');
    return 'a list of two and a bare single, both landed';
  });

  /* ---- the changeover: every change is choreographed travel (RULING AY) ---- */
  console.log('--- the changeover: parts travel, nothing pops ---');

  /* a synthetic scene with named PART movers, because no shipped show carries
     them yet — that is the choreography PR.  Each part gets a mesh of its own
     so the layer discipline can be read straight off it. */
  const partScene = (name, parts)=>{
    const sc = sceneAdd(name, name.toUpperCase());
    const gs = {};
    for(const p of parts){
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial()));
      sc.group.add(g);
      sceneTravelPart(sc, p.n, g, 'x', 0, p.out, p.speed);
      gs[p.n] = g;
    }
    return {sc, g:gs};
  };
  const litIn = g=>{ let n = 0; g.traverse(o=>{ if(o.isMesh && o.layers.mask !== 0) n++; }); return n; };

  P('a PART crosses off dt, and takes the time it should', ()=>{
    showLoad('beetlejuice');
    const s = partScene('__pm', [{n:'hill', out:-12, speed:2}]);
    sceneChangeTo('__pm');                 // on at OUT, and it travels home
    run(180, 1/60);                        // 3s of a 6 second travel
    const half = wx(s.g.hill);
    if(!(half > -7.4 && half < -4.6))
      throw new Error('half way should be near -6.0, was '+half.toFixed(2));
    run(240, 1/60);                        // the rest of it, and a little over
    if(Math.abs(wx(s.g.hill)) > 0.01) throw new Error('never arrived: '+wx(s.g.hill).toFixed(3));
    if(sceneTravelling(s.sc)) throw new Error('still reports itself travelling');
    return 'from -12.00, half way '+half.toFixed(2)+', arrived 0.00 — in world space';
  });

  P('a set the changeover brings on NEVER pops: at OUT first, never home at once', ()=>{
    showLoad('beetlejuice');
    const s = partScene('__np', [{n:'wall', out:9, speed:3}]);
    sceneChangeTo('__np');
    /* the FIRST visible frame: layers on, and the part at OUT, not at home */
    if(!litIn(s.sc.group)) throw new Error('it came on with no layers');
    if(Math.abs(wx(s.g.wall) - 9) > 0.01)
      throw new Error('first frame at '+wx(s.g.wall).toFixed(2)+', not at OUT 9.00');
    run(60, 1/60);                          // one second of a three second travel
    const mid = wx(s.g.wall);
    if(!(mid > 0.01 && mid < 8.99)) throw new Error('not strictly between: '+mid.toFixed(2));
    run(240, 1/60);
    if(Math.abs(wx(s.g.wall)) > 0.01) throw new Error('never made home: '+wx(s.g.wall).toFixed(3));
    return 'on at 9.00, seen at '+mid.toFixed(2)+', home 0.00 — no pop';
  });

  P('mid-changeover BOTH sets are drawn, and the outgoing waits for its LAST part', ()=>{
    showLoad('beetlejuice');
    const A = partScene('__ca', [{n:'fast', out:-6, speed:2}, {n:'slow', out:-6, speed:1}]);
    const B = partScene('__cb', [{n:'only', out:6, speed:2}]);
    sceneChangeTo('__ca'); run(500, 1/60);   // A is home and settled
    sceneChangeTo('__cb');                   // the changeover: A goes, B comes, together
    run(60, 1/60);                           // one second in
    if(!litIn(A.sc.group)) throw new Error('the outgoing went dark mid-move');
    if(!litIn(B.sc.group)) throw new Error('the incoming is not drawn mid-move');
    run(150, 1/60);                          // t=3.5s: the fast part is out, the slow is not
    if(Math.abs(wx(A.g.fast) + 6) > 0.01) throw new Error('the fast part never got out');
    if(!litIn(A.sc.group)) throw new Error('it hid on the FIRST part arriving, not the last');
    run(180, 1/60);                          // t=6.5s: the slow part lands, and so does the hide
    if(litIn(A.sc.group)) throw new Error('the outgoing never went inert');
    if(A.sc.group.userData.sceneOff !== true) throw new Error('never marked off');
    if(Math.abs(wx(B.g.only)) > 0.01) throw new Error('the incoming never arrived home');
    return 'both drawn in the same frames; the hide waited 6s for the slow part, not 3s';
  });

  P('a changeover fired mid-changeover RETARGETS — nothing queues', ()=>{
    showLoad('beetlejuice');
    const A = partScene('__ra', [{n:'p', out:-8, speed:2}]);
    const B = partScene('__rb', [{n:'p', out:8, speed:2}]);
    sceneChangeTo('__ra'); run(400, 1/60);    // A home
    sceneChangeTo('__rb');                    // A -> out, B in from out
    run(60, 1/60);                            // one second: A near -2, B near 6
    const aAt = wx(A.g.p);
    sceneChangeTo('__ra');                    // changed its mind mid-move
    if(Math.abs(wx(A.g.p) - aAt) > 0.01)
      throw new Error('the reversal SNAPPED a still-drawn set to '+wx(A.g.p).toFixed(2));
    if(A.sc.pmv.p.target !== 0) throw new Error('A is not headed home');
    if(B.sc.pmv.p.target !== 8) throw new Error('B is not headed back out');
    run(400, 1/60);                           // let everything land
    if(Math.abs(wx(A.g.p)) > 0.01) throw new Error('A ended at '+wx(A.g.p).toFixed(2));
    if(litIn(B.sc.group)) throw new Error('B never went inert after turning back');
    run(120, 1/60);                           // and nothing banked a second move
    if(sceneTravelling(A.sc) || sceneTravelling(B.sc))
      throw new Error('something is still travelling — a move was queued');
    if(Math.abs(wx(A.g.p)) > 0.01) throw new Error('a banked move ran A out to '+wx(A.g.p).toFixed(2));
    return 'A turned round at '+aAt.toFixed(2)+' and came home; B went back out and hid';
  });

  P('a set with NO part movers still changes instantly under the changeover', ()=>{
    showLoad('beetlejuice');
    sceneChangeTo('attic');                  // neither the attic nor the bedroom carries parts
    const a = sceneFind('attic'), b = sceneFind('bedroom');
    sceneChangeTo('bedroom');                // no run(): the swap must not wait a frame
    if(a.group.userData.sceneOff !== true) throw new Error('the attic waited to hide');
    if(litIn(a.group)) throw new Error('attic pieces still live after an instant change');
    if(b.group.userData.sceneOff !== false) throw new Error('the bedroom is not on');
    return 'attic off and inert, bedroom on, in the same call — the other shows keep their swap';
  });

  P('a cue with scene: runs the changeover, not an instant swap', ()=>{
    showLoad('beetlejuice');
    const s = partScene('__cue', [{n:'p', out:-10, speed:2}]);
    showCueExtras({scene:'__cue'});
    if(!litIn(s.sc.group)) throw new Error('the cue did not bring it on');
    if(Math.abs(wx(s.g.p) + 10) > 0.01)
      throw new Error('the cue POPPED the part to '+wx(s.g.p).toFixed(2)+' — an instant swap, not the changeover');
    run(120, 1/60);                          // two seconds of a five second travel
    const mid = wx(s.g.p);
    if(!(mid > -9.99 && mid < -0.01)) throw new Error('not travelling in: '+mid.toFixed(2));
    run(300, 1/60);
    if(Math.abs(wx(s.g.p)) > 0.01) throw new Error('never arrived home');
    return 'the cue put it on at -10.00, seen at '+mid.toFixed(2)+', home 0.00';
  });

  P('the mover runs on dt, and adds no timer of its own', ()=>{
    const src = document.documentElement.outerHTML;
    const i = src.indexOf('THE MOVER');
    if(i < 0) throw new Error('the mover is not in the build');
    const body = src.slice(i, i + 2600);
    if(/setTimeout|setInterval/.test(body))
      throw new Error('the mover reaches for a timer');
    return 'no setTimeout, no setInterval — it steps off the frame';
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
