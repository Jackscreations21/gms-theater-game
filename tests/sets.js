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

  P('beetlejuice is gone and the play is in', ()=>{
    if(SHOWS.beetlejuice) throw new Error('beetlejuice is still in the book');
    if(!SHOWS.goeswrong) throw new Error('the play is not in the book');
    const names = Object.keys(SHOWS).map(k=>SHOWS[k].name);
    if(names.indexOf('BEETLEJUICE') >= 0) throw new Error('still listed');
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

  console.log('--- the four of them together ---');

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

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); }
catch(e){ console.log('TOP LEVEL THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
process.exit((w.__errs||[]).length ? 1 : 0);
