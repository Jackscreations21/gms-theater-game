// carp.js — the carpenters (spec 2026-08-08-carpenters-design.md).
// PR 2: the catalogue and the pure planner — CARP_CAT, carpSurvey,
// carpPlan, the NEED list and the cap (RULING Y).  No crew, no VR here:
// the planner is pure and is tested as data in, data out.
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
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,210):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); if(e.stack) console.log('      '+e.stack.split('\\n').slice(1,4).join(' | ')); window.__errs.push(name+': '+e.message); } };

  console.log('--- the catalogue ---');
  P('three rows, every schedule honest on a real saw, every blueprint sound', ()=>{
    const labels = {flat4x8:'4x8 FLAT', plat4x8:'4x8 PLATFORM', steps2:'2-STEP UNIT'};
    const keys = Object.keys(labels);
    if(Object.keys(CARP_CAT).join(',') !== keys.join(','))
      throw new Error('rows: '+Object.keys(CARP_CAT).join(','));
    keys.forEach(key=>{
      const row = CARP_CAT[key];
      if(row.label !== labels[key]) throw new Error(key+' is labelled '+row.label);
      /* the stock is real profiles, expanded to units */
      const units = [];
      row.stock.forEach(s=>{
        if(!WOOD_PROF[s.prof]) throw new Error(key+' orders an unreal profile: '+s.prof);
        for(let i=0;i<s.n;i++) units.push(s.prof);
      });
      /* every cut schedule runs on the right saw and inside the stick:
         products on the inch grid (sawSetCut snaps to it), nothing under
         SAW_MIN on either side of the blade except an honest final scrap */
      const usedBy = units.map(()=>0);
      row.cuts.forEach((c, ci)=>{
        if(units[c.stock] === undefined) throw new Error(key+' cuts a unit that is not in the stock');
        usedBy[c.stock]++;
        const wantSaw = units[c.stock] === 'sheet' ? 'track' : 'chop';
        if(c.saw !== wantSaw) throw new Error(key+' sends '+units[c.stock]+' to the '+c.saw);
        let rem = WOOD_LEN;
        c.make.forEach((len, k)=>{
          const inches = len/0.0254;
          if(Math.abs(inches - Math.round(inches)) > 1e-6)
            throw new Error(key+' schedule '+ci+' cut '+k+' is off the inch grid: '+len);
          if(len < SAW_MIN - 1e-9) throw new Error(key+' schedule '+ci+' makes scrap: '+len);
          rem -= len;
          if(rem < -1e-9) throw new Error(key+' schedule '+ci+' cuts more wood than the stick holds');
          if(rem < SAW_MIN - 1e-9 && k < c.make.length - 1)
            throw new Error(key+' schedule '+ci+' saws on after the stick is spent');
        });
      });
      /* every stock unit consumed exactly once — by one schedule or one uncut piece */
      row.blueprint.pieces.forEach(p=>{ if(p.src.stock !== undefined) usedBy[p.src.stock]++; });
      usedBy.forEach((n, i)=>{ if(n !== 1) throw new Error(key+' stock unit '+i+' is used '+n+' times'); });
      /* every piece poses a real box, on or above the deck (deck y=0,
         lying flat — RULING AC), its length agreeing with its source */
      const boxes = row.blueprint.pieces.map((p, pi)=>{
        if(p.src.cut !== undefined){
          const c = row.cuts[p.src.cut[0]];
          if(!c || c.make[p.src.cut[1]] === undefined)
            throw new Error(key+' piece '+pi+' comes off a cut that never happens');
          if(Math.abs(c.make[p.src.cut[1]] - p.len) > 1e-6)
            throw new Error(key+' piece '+pi+' disagrees with its cut about length');
        } else if(Math.abs(p.len - WOOD_LEN) > 1e-6){
          throw new Error(key+' uncut piece '+pi+' is not a full stick: '+p.len);
        }
        const PR = WOOD_PROF[p.prof];
        const m = new THREE.Mesh(new THREE.BoxGeometry(1,1,1));
        if(p.prof === 'sheet') m.scale.set(p.len, PR.W, PR.t);
        else m.scale.set(PR.a, p.len, PR.b);
        m.rotation.set(p.rot[0], p.rot[1], p.rot[2]);
        m.position.set(p.pos[0], p.pos[1], p.pos[2]);
        m.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(m);
        if(box.min.y < -0.001) throw new Error(key+' piece '+pi+' lies through the deck: '+box.min.y.toFixed(4));
        return box;
      });
      /* two nails per joint (RULING G — rigid), each at a real seam, and
         the nails knit the pieces into ONE assembly */
      const per = {};
      row.blueprint.nails.forEach((n, ni)=>{
        if(n.i === n.j || !boxes[n.i] || !boxes[n.j]) throw new Error(key+' nail '+ni+' names bad pieces');
        per[n.i+':'+n.j] = (per[n.i+':'+n.j]||0)+1;
        const wp = new THREE.Vector3(n.p[0], n.p[1], n.p[2]);
        if(!boxes[n.i].clone().expandByScalar(0.02).containsPoint(wp) ||
           !boxes[n.j].clone().expandByScalar(0.02).containsPoint(wp))
          throw new Error(key+' nail '+ni+' is nowhere near the seam of '+n.i+' and '+n.j);
        if(Math.abs(Math.hypot(n.ax[0], n.ax[1], n.ax[2]) - 1) > 1e-6)
          throw new Error(key+' nail '+ni+' axis is not unit length');
      });
      for(const jk in per) if(per[jk] !== 2)
        throw new Error(key+' joint '+jk+' carries '+per[jk]+' nails — RULING G says two');
      if(!row.blueprint.nails.length) throw new Error(key+' has no nails at all');
      const parent = row.blueprint.pieces.map((x, i)=>i);
      const find = i=>parent[i] === i ? i : (parent[i] = find(parent[i]));
      row.blueprint.nails.forEach(n=>{ parent[find(n.i)] = find(n.j); });
      const roots = {};
      row.blueprint.pieces.forEach((x, i)=>{ roots[find(i)] = 1; });
      if(Object.keys(roots).length !== 1)
        throw new Error(key+' nails up '+Object.keys(roots).length+' separate assemblies');
    });
    return '3 rows, cuts on the inch grid inside the stick, 2 nails a joint, one assembly each';
  });

  console.log('--- the survey ---');
  P('the survey counts loose and pallet stock, and nothing on a bench', ()=>{
    const keep = BUILD_VENUE; BUILD_VENUE = 'palace';
    const a = regWood('s2x4'), b = regWood('s2x4'), sh = regWood('sheet');
    BUILD_VENUE = keep;
    const anchor = new THREE.Object3D();
    world.add(anchor);
    if(!slotBody(b, anchor)) throw new Error('could not slot the test stick');
    let sv = carpSurvey('palace');
    if(sv.s2x4.indexOf(a) < 0) throw new Error('a loose stick was not counted');
    if(sv.s2x4.indexOf(b) < 0) throw new Error('pallet stock was not counted');
    if(sv.sheet.indexOf(sh) < 0) throw new Error('the sheet was not counted');
    if(!seatWood(SAWS.palace.chop, a)) throw new Error('could not seat the stick');
    sv = carpSurvey('palace');
    if(sv.s2x4.indexOf(a) >= 0) throw new Error('a seated piece was counted as stock');
    if(sv.s2x4.indexOf(b) < 0) throw new Error('the slotted stick fell out of the count');
    if(carpSurvey('arc').s2x4.length) throw new Error('palace stock answered the Arc survey');
    grabBody(a); a.state = 'loose';               // off the bench, back on the floor
    return 'loose and slotted in, seated out, venues kept apart';
  });

  console.log('--- the planner ---');
  P('an understocked shed gets the exact NEED list', ()=>{
    const mark = {venue:'arc', stage:'arcMain', x:ARC.X + 1, z:-5, yaw:0};
    let plan = carpPlan('flat4x8', mark);
    if(!plan || !plan.need) throw new Error('no need list from an empty shed');
    if(plan.jobs || plan.full) throw new Error('it planned work with no stock');
    if(JSON.stringify(plan.need) !== JSON.stringify([{prof:'sheet', n:1}, {prof:'s2x4', n:3}]))
      throw new Error('wrong list: '+JSON.stringify(plan.need));
    const keep = BUILD_VENUE; BUILD_VENUE = 'arc';
    window.__arcStick = regWood('s2x4');
    window.__arcShort = regWood('s2x4', {L:1.0});   // an off-cut is not an 8ft stick
    BUILD_VENUE = keep;
    plan = carpPlan('flat4x8', mark);
    if(JSON.stringify(plan.need) !== JSON.stringify([{prof:'sheet', n:1}, {prof:'s2x4', n:2}]))
      throw new Error('the full stick was not counted off, or the off-cut fooled it: '+JSON.stringify(plan.need));
    if(carpPlan('noSuchThing', mark) !== null) throw new Error('planned a row that does not exist');
    if(carpPlan('flat4x8', null) !== null) throw new Error('planned with no mark');
    window.__mark = mark;
    return 'NEED 1 sheet + 2 sticks, and the metre off-cut did not fool it';
  });
  P('a stocked shed gets the whole queue, phased, and the planner stays pure', ()=>{
    const keep = BUILD_VENUE; BUILD_VENUE = 'arc';
    const s1 = regWood('s2x4'), s2 = regWood('s2x4'), sh = regWood('sheet');
    BUILD_VENUE = keep;
    const bodiesBefore = BODIES.length;
    const catBefore = JSON.stringify(CARP_CAT);
    const plan = carpPlan('flat4x8', window.__mark);
    if(!plan || !plan.jobs) throw new Error('no jobs: '+JSON.stringify(plan));
    /* pure: nothing minted, nothing moved, nothing written on the table */
    if(BODIES.length !== bodiesBefore) throw new Error('the planner minted or destroyed bodies');
    if(JSON.stringify(CARP_CAT) !== catBefore) throw new Error('the planner wrote on the catalogue');
    if([s1, s2, sh, window.__arcStick].some(b=>b.state !== 'loose'))
      throw new Error('the planner moved the stock');
    const J = plan.jobs, kinds = J.map(j=>j.kind);
    /* phases: every cut before the first haul, holds between the phases */
    const lastCut = Math.max(kinds.lastIndexOf('carpCut'), kinds.lastIndexOf('carpFetch'));
    const firstHaul = kinds.indexOf('carpHaul'), lastHaul = kinds.lastIndexOf('carpHaul');
    const firstNail = kinds.indexOf('carpNail');
    if(firstHaul < lastCut) throw new Error('a haul is queued before the benches finish');
    if(kinds.slice(lastCut + 1, firstHaul).indexOf('hold') < 0)
      throw new Error('no hold between the saws and the haul');
    if(firstNail < lastHaul) throw new Error('a nail is queued before the deck is set');
    if(kinds.slice(lastHaul + 1, firstNail).indexOf('hold') < 0)
      throw new Error('no hold between the haul and the nails');
    /* the saw phase: one stick to the chop bench, two rail cuts off it */
    const fetches = J.filter(j=>j.kind === 'carpFetch');
    if(fetches.length !== 1) throw new Error(fetches.length+' fetches for one cut stick');
    if(fetches[0].saw !== 'chop' || !fetches[0].body || fetches[0].body.prof !== 's2x4')
      throw new Error('the fetch does not take a 2x4 to the chop bench');
    if(Math.abs(fetches[0].body.dims.L - WOOD_LEN) > 0.001) throw new Error('it fetched an off-cut');
    const cuts = J.filter(j=>j.kind === 'carpCut');
    if(cuts.length !== 2) throw new Error(cuts.length+' cuts');
    if(cuts.some(c=>Math.abs(c.len - 1.0414) > 1e-6)) throw new Error('wrong rail length off the saw');
    if(cuts[0].piece !== 3 || cuts[1].piece !== 4) throw new Error('the cuts do not name their blueprint pieces');
    /* the haul phase: one walk per piece, real bodies for the uncut ones */
    const hauls = J.filter(j=>j.kind === 'carpHaul');
    if(hauls.length !== 5) throw new Error(hauls.length+' hauls for 5 pieces');
    if(hauls.map(h=>h.piece).join(',') !== '0,1,2,3,4') throw new Error('haul order is off');
    const carried = hauls.filter(h=>h.body);
    if(carried.length !== 3) throw new Error(carried.length+' hauls carry standing stock; want the sheet and two stiles');
    if(new Set(carried.map(h=>h.body).concat([fetches[0].body])).size !== 4)
      throw new Error('one stick was promised to two jobs');
    if(hauls.some(h=>!h.pos || h.pos.length !== 3 || !h.rot || h.rot.length !== 3))
      throw new Error('a haul is missing its mark-local pose');
    if(hauls[0].pos === CARP_CAT.flat4x8.blueprint.pieces[0].pos)
      throw new Error('the plan handed out the catalogue arrays themselves');
    /* the nails: one job per joint, both nails riding it */
    const nailsJ = J.filter(j=>j.kind === 'carpNail');
    if(nailsJ.length !== 8) throw new Error(nailsJ.length+' joints, want 8');
    if(nailsJ.some(n=>n.nails.length !== 2)) throw new Error('a joint job without its two nails');
    if(nailsJ.some(n=>!n.nails.every(x=>x.p && x.p.length === 3 && x.ax && x.ax.length === 3)))
      throw new Error('a nail without its mark-local point and axis');
    if(plan.piecesAfter !== venueBuildCount('arc') + 2)
      throw new Error('piecesAfter says '+plan.piecesAfter+', book says '+venueBuildCount('arc')+' + 2 cuts');
    return J.length+' jobs: 1 fetch, 2 cuts, hold, 5 hauls, hold, 8 joints of 2 nails';
  });
  P('the cap: the planner refuses PIECES FULL at the boundary', ()=>{
    /* pad the venue book the way build.js does — build kinds that are not
       wood, so the stock survey stays satisfied while the cap fills */
    const fakes = [];
    while(venueBuildCount('arc') < 149){
      const f = {kind:'paint', venue:'arc', mesh:new THREE.Object3D(), state:'loose', point:null, slot:null};
      fakes.push(f); BODIES.push(f);
    }
    let plan = carpPlan('flat4x8', window.__mark);   // 149 + 2 cuts = 151: past the cap
    if(!plan || plan.full !== true) throw new Error('sailed past the cap: '+JSON.stringify(plan && (plan.piecesAfter || plan.need)));
    if(plan.jobs || plan.need) throw new Error('a PIECES FULL refusal still planned work');
    if(plan.pieces !== 151) throw new Error('it counted '+plan.pieces+' pieces, want 151');
    BODIES.splice(BODIES.indexOf(fakes.pop()), 1);   // one piece fewer: 148 + 2 = 150, exactly at the cap
    plan = carpPlan('flat4x8', window.__mark);
    if(!plan.jobs) throw new Error('refused at exactly the cap: '+JSON.stringify(plan));
    if(plan.piecesAfter !== 150) throw new Error('piecesAfter '+plan.piecesAfter+', want 150');
    fakes.forEach(f=>BODIES.splice(BODIES.indexOf(f), 1));
    return 'refused at 151, planned at exactly 150';
  });

  console.log('--- the lead and the saws (PR 3) ---');
  P('the lead exists only after a carpenter call, and is the seventh', ()=>{
    if(CREW.people.some(h=>h.trade === 'carpenter'))
      throw new Error('a carpenter existed before any call');
    const lead = carpLead();
    if(CREW.people.length !== 7) throw new Error(CREW.people.length+' people, want 7');
    if(CREW.people[6] !== lead) throw new Error('the lead is not the seventh');
    if(lead.trade !== 'carpenter') throw new Error('the lead has no trade');
    if(carpLead() !== lead) throw new Error('a second call minted a second lead');
    if(lead.cap.visible) throw new Error('the lead is wearing a cap');
    /* the show census (RULING AA): crewSpawn(6) never hands out the lead */
    const hands = crewSpawn(6);
    if(hands.length !== 6 || hands.indexOf(lead) >= 0)
      throw new Error('the lead is in the show six');
    if(hands.some(h=>h.trade === 'carpenter')) throw new Error('a show hand carries the trade');
    return 'seventh figure, trade carpenter, no cap, show six unchanged';
  });
  P('a fetch really carries: the same mesh rides the hands to the bench', ()=>{
    const keep = BUILD_VENUE; BUILD_VENUE = 'palace';
    const sticks = [regWood('s2x4'), regWood('s2x4'), regWood('s2x4')];
    const psheet = regWood('sheet');
    BUILD_VENUE = keep;
    sticks.concat([psheet]).forEach((b, i)=>{
      venueRoot('palace').add(b.mesh);
      b.mesh.position.set(-9 + i*0.4, 0.1, -21);   // on the shed floor, near the benches
    });
    const mark = {venue:'palace', stage:'palace', x:0, z:-6, yaw:0};
    window.__mark2 = mark;
    const plan = carpPlan('flat4x8', mark);
    if(!plan || !plan.jobs) throw new Error('no plan: '+JSON.stringify(plan && (plan.need || plan)));
    const holdAt = plan.jobs.findIndex(j=>j.kind === 'hold');
    const fetch = plan.jobs.find(j=>j.kind === 'carpFetch');
    const b = fetch.body, mesh = b.mesh, before = BODIES.length;
    if(!carpRun(plan.jobs.slice(0, holdAt + 1))) throw new Error('the run refused');
    if(CREW.running !== 'carp') throw new Error('running is '+CREW.running);
    const lead = CREW.people[6];
    /* fixed-dt drive to the moment the plank is in the lead's arms —
       watching the guard the whole way: no show hand ever holds a saw job */
    let carried = false;
    for(let i=0;i<20000 && !carried;i++){
      updateCrew(0.05); updateBodies(0.05);
      for(const h of CREW.people)
        if(h !== lead && h.job && (h.job.kind === 'carpFetch' || h.job.kind === 'carpCut'))
          throw new Error('a show hand took '+h.job.kind);
      if(mesh.parent === lead.hands) carried = true;
    }
    if(!carried) throw new Error('the stick never rode the hands');
    if(b.state !== 'carried') throw new Error('mid-carry state is '+b.state);
    if(BODIES.length !== before) throw new Error('the pickup minted or destroyed a body');
    if(carpSurvey('palace').s2x4.indexOf(b) >= 0)
      throw new Error('a carried stick still answers the survey as stock');
    let seated = false;
    for(let i=0;i<20000 && !seated;i++){
      updateCrew(0.05); updateBodies(0.05);
      if(b.state === 'seated') seated = true;
    }
    if(!seated) throw new Error('never seated on the saw');
    if(b.station !== SAWS.palace.chop) throw new Error('seated on the wrong station');
    if(b.mesh !== mesh) throw new Error('the mesh changed identity on the way');
    if(mesh.parent !== SAWS.palace.chop.seat) throw new Error('the mesh did not land on the seat');
    if(BODIES.length !== before) throw new Error('the fetch changed the body count');
    return 'same mesh: floor -> arms -> saw seat, body count unchanged';
  });
  P('the cuts land on the schedule and the run state records them', ()=>{
    if(!CARP_RUN || !CARP_RUN.bench.chop) throw new Error('no run state on the bench');
    const before = BODIES.length;
    let guard = 0;
    while(CREW.running && guard++ < 40000){ updateCrew(0.05); updateBodies(0.05); }
    if(CREW.running) throw new Error('the cutting phase never finished');
    /* two rails kept, recorded under their blueprint piece indices (PR 4 reads this) */
    const r3 = CARP_RUN.made[3], r4 = CARP_RUN.made[4];
    if(!r3 || !r4) throw new Error('the cuts were not recorded by piece index');
    if(r3 === r4) throw new Error('one body recorded under two indices');
    if(Math.abs(r3.dims.L - 1.0414) > 0.0254 || Math.abs(r4.dims.L - 1.0414) > 0.0254)
      throw new Error('rails came out '+r3.dims.L.toFixed(4)+' and '+r4.dims.L.toFixed(4));
    if(r3.mesh.geometry !== WOODG || r4.mesh.geometry !== WOODG)
      throw new Error('a cut minted geometry');
    if(r3.state !== 'loose' || r4.state !== 'loose')
      throw new Error('rails are '+r3.state+'/'+r4.state+', not set aside loose');
    /* exactly the planner's mint count: both off sides clear SAW_MIN, so +2 */
    if(BODIES.length !== before + 2)
      throw new Error('the body count grew by '+(BODIES.length - before)+', want 2');
    /* the bench is clear and the honest 14in off-cut is back in stock, loose */
    if(SAWS.palace.chop.pieces.length)
      throw new Error(SAWS.palace.chop.pieces.length+' pieces left seated on the bench');
    const off = BODIES.filter(x=>x.kind === 'wood' && x.venue === 'palace' &&
      x.prof === 's2x4' && x.state === 'loose' && Math.abs(x.dims.L - 0.3556) < 0.0254);
    if(!off.length) throw new Error('the 14in off-cut never went back to the shed');
    const lead = CREW.people[6];
    if(lead.group.visible || lead.state !== 'off') throw new Error('the lead never went home');
    return 'two 41in rails under their indices, +2 bodies, bench clear, 14in in stock';
  });
  P('a show queue never reaches the lead', ()=>{
    const lead = CREW.people[6];
    crewStart('in');                       // no show loaded: the stock-scenery plan
    if(!CREW.running) throw new Error('no show run started');
    let handWorked = false;
    for(let i=0;i<2000 && CREW.running;i++){
      updateCrew(0.05);
      if(lead.job) throw new Error('the lead took a show job: '+lead.job.kind);
      if(lead.group.visible) throw new Error('the lead turned up to a load in');
      if(CREW.people.some((h, hi)=>hi < 6 && h.job)) handWorked = true;
    }
    if(!handWorked) throw new Error('nobody worked at all — the guard is too wide');
    crewStop(true);
    return 'the hands worked, the lead never stirred';
  });
  P('stand down mid-fetch leaves the stick loose where the lead stands', ()=>{
    const plan = carpPlan('flat4x8', window.__mark2);
    if(!plan || !plan.jobs) throw new Error('no second plan: '+JSON.stringify(plan && plan.need));
    const fetch = plan.jobs.find(j=>j.kind === 'carpFetch');
    const b = fetch.body, mesh = b.mesh;
    const holdAt = plan.jobs.findIndex(j=>j.kind === 'hold');
    if(!carpRun(plan.jobs.slice(0, holdAt + 1))) throw new Error('the run refused');
    const lead = CREW.people[6];
    let carrying = false;
    for(let i=0;i<20000 && !carrying;i++){
      updateCrew(0.05); updateBodies(0.05);
      if(mesh.parent === lead.hands && lead.state === 'walk') carrying = true;
    }
    if(!carrying) throw new Error('never caught the lead mid-carry');
    const before = BODIES.length, lx = lead.x, lz = lead.z;
    crewStop(true);                        // the stage swap's stand-down path (p2k)
    if(BODIES.indexOf(b) < 0) throw new Error('the stick was disposed');
    if(b.state !== 'loose') throw new Error('set down as '+b.state);
    if(mesh.parent !== venueRoot('palace'))
      throw new Error('set down into '+(mesh.parent && mesh.parent.name));
    if(mesh.geometry !== WOODG) throw new Error('the geometry was replaced');
    scene.updateMatrixWorld(true);
    const wp = mesh.getWorldPosition(new THREE.Vector3());
    const drift = Math.hypot(wp.x - lx, wp.z - lz);
    if(drift > 1.5) throw new Error('the stick teleported '+drift.toFixed(1)+'m from the lead');
    if(BODIES.length !== before) throw new Error('stand down changed the body count');
    if(CARP_RUN) throw new Error('a stood-down run left its state behind');
    return 'loose at the lead, nothing disposed, run state cleared';
  });

  console.log('--- the haul and the nails (PR 4) ---');
  P('the wrong-deck kill: the flat stands AT the arcMain mark, one rigid assembly', ()=>{
    stageSwitch('arcMain', true);
    if(CREW.running) throw new Error('crew already running');
    /* fresh full stock, minted arc; it and the earlier tests' stray arc
       sticks are all laid by the benches, so nearest-first never sends a
       hand walking 420m to the palace origin */
    const keep = BUILD_VENUE; BUILD_VENUE = 'arc';
    regWood('sheet'); regWood('s2x4'); regWood('s2x4'); regWood('s2x4');
    BUILD_VENUE = keep;
    const root = venueRoot('arc');
    root.updateMatrixWorld(true);
    const chopW = SAWS.arc.chop.group.getWorldPosition(new THREE.Vector3());
    let laid = 0;
    BODIES.forEach(b=>{
      if(b.kind !== 'wood' || b.venue !== 'arc' || b.state !== 'loose') return;
      root.add(b.mesh);
      b.mesh.rotation.set(b.prof === 'sheet' ? -Math.PI/2 : 0, 0,
                          b.prof === 'sheet' ? 0 : Math.PI/2);
      const p = chopW.clone();
      p.x += -3 + (laid % 6) * 0.6; p.z += 2.0 + Math.floor(laid / 6) * 1.4;
      p.y = 0.1; laid++;
      b.mesh.position.copy(root.worldToLocal(p));
      b.mesh.updateMatrixWorld(true);
      b.restH = woodRestH(b);
    });
    /* equal legs for the six hands — the race is not what is under test */
    crewSpawn(6).forEach(h=>{ h.speed = 2.4; });
    const fr = STAGES.arcMain.crew;
    const mark = {venue:'arc', stage:'arcMain',
                  x:(fr.xMin + fr.xMax)/2 + 0.8, z:(fr.zMin + fr.zMax)/2, yaw:Math.PI/5};
    window.__mark4 = mark;
    const preAsms = ASSEMBLIES.slice();
    const plan = carpStart('flat4x8', mark);
    if(!plan || !plan.jobs) throw new Error('the call refused: ' + JSON.stringify(plan));
    if(CREW.running !== 'carp') throw new Error('running is ' + CREW.running);
    window.__carryErr = null; window.__poseAtNail = null;
    for(let i = 0; i < 120000 && CREW.running; i++){
      updateCrew(0.05); updateBodies(0.05);
      /* RULING AB watched the whole way: never two planks in one pair of
         hands, and what rides them is a real 'carried' body */
      if(!window.__carryErr) for(const h of CREW.people){
        let wood = 0;
        for(const c of h.hands.children) if(c.geometry === WOODG) wood++;
        if(wood > 1) window.__carryErr = 'two planks in one pair of hands';
        else if(wood !== (h.carryB ? 1 : 0)) window.__carryErr = 'hands and carryB disagree (' + wood + ' planks)';
        else if(h.carryB && h.carryB.state !== 'carried') window.__carryErr = 'mid-carry state ' + h.carryB.state;
      }
      /* the instant the first nail lands, every piece must already stand
         at its blueprint world pose (the hold barrier at work) */
      if(!window.__poseAtNail){
        const na = ASSEMBLIES.find(a=>preAsms.indexOf(a) < 0);
        if(na){
          scene.updateMatrixWorld(true);
          window.__poseAtNail = [0,1,2,3,4].map(pi=>{
            const b = (typeof CARP_RUN !== 'undefined') && CARP_RUN && CARP_RUN.placed && CARP_RUN.placed[pi];
            if(!b) return 'piece ' + pi + ' was never placed before nailing began';
            const bp = CARP_CAT.flat4x8.blueprint.pieces[pi];
            const want = new THREE.Vector3(bp.pos[0], bp.pos[1], bp.pos[2])
              .applyAxisAngle(new THREE.Vector3(0, 1, 0), mark.yaw);
            want.x += mark.x; want.z += mark.z;
            return b.mesh.getWorldPosition(new THREE.Vector3()).distanceTo(want);
          });
        }
      }
    }
    if(CREW.running) throw new Error('the build never finished');
    window.__run4 = CARP_RUN;
    const made = ASSEMBLIES.filter(a=>preAsms.indexOf(a) < 0);
    if(made.length !== 1) throw new Error(made.length + ' assemblies stand where one flat should');
    const a = made[0];
    window.__flat = a;
    if(a.pieces.length !== 5) throw new Error(a.pieces.length + ' pieces, want 5');
    if(a.pieces.some(p=>p.state !== 'fixed')) throw new Error('a piece is not fixed');
    if(a.anchor) throw new Error('the carpenters nailed it to the deck — RULING AC says never');
    if(a.pieces.some(p=>p.pivot)) throw new Error('a pivot joint — the flat is not rigid');
    scene.updateMatrixWorld(true);
    const sheet = a.pieces.find(p=>p.prof === 'sheet');
    const sp = sheet.mesh.getWorldPosition(new THREE.Vector3());
    if(Math.abs(sp.x - mark.x) > 2)
      throw new Error('WRONG DECK: the flat stands at x ' + sp.x.toFixed(1) + ', the mark at ' + mark.x.toFixed(1));
    if(Math.hypot(sp.x - mark.x, sp.z - mark.z) > 0.05)
      throw new Error('the skin is ' + Math.hypot(sp.x - mark.x, sp.z - mark.z).toFixed(3) + 'm off the mark');
    /* the yaw really composed: a stile stands at the yaw-rotated offset */
    const st1 = window.__run4.placed[1];
    const w1 = new THREE.Vector3(0, 0.019, -0.5651)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), mark.yaw);
    w1.x += mark.x; w1.z += mark.z;
    if(!st1 || st1.mesh.getWorldPosition(new THREE.Vector3()).distanceTo(w1) > 0.05)
      throw new Error('the stile ignored the mark yaw');
    if(CREW.people.some(h=>h.group.visible || h.state !== 'off'))
      throw new Error('somebody never went home');
    return 'one un-anchored rigid assembly of 5 at the mark, yaw composed, crew home';
  });
  P('real carry: one piece a trip, every piece at its pose before the first nail', ()=>{
    if(window.__carryErr) throw new Error(window.__carryErr);
    if(!window.__poseAtNail) throw new Error('nailing never began — no assembly ever formed');
    window.__poseAtNail.forEach((d, i)=>{
      if(typeof d === 'string') throw new Error(d);
      if(d > 0.05) throw new Error('piece ' + i + ' was ' + d.toFixed(3) + 'm off its pose when nailing began');
    });
    return 'never two planks in a pair of hands; 5 poses held at the first nail';
  });
  P('nail honesty: 16 nails, two a joint, each buried in its own two pieces', ()=>{
    const a = window.__flat, run = window.__run4;
    if(!a || !run) throw new Error('no flat to inspect');
    const cat = CARP_CAT.flat4x8.blueprint.nails;
    if(a.nails.length !== cat.length)
      throw new Error(a.nails.length + ' nails, the catalogue says ' + cat.length);
    const idxOf = b=>{
      for(const k in run.placed) if(run.placed[k] === b) return +k;
      return -1;
    };
    const per = {};
    a.nails.forEach(n=>{
      if(!n.a || !n.b || !n.b.mesh) throw new Error('a deck or pipe nail crept in');
      const jk = idxOf(n.a) + ':' + idxOf(n.b);
      per[jk] = (per[jk] || 0) + 1;
    });
    const want = {};
    cat.forEach(n=>{ want[n.i + ':' + n.j] = (want[n.i + ':' + n.j] || 0) + 1; });
    if(Object.keys(per).length !== Object.keys(want).length)
      throw new Error(Object.keys(per).length + ' joints, the catalogue draws ' + Object.keys(want).length);
    for(const jk in want) if(per[jk] !== want[jk])
      throw new Error('joint ' + jk + ' carries ' + (per[jk] || 0) + ' nails, want ' + want[jk]);
    scene.updateMatrixWorld(true);
    a.root.updateMatrixWorld(true);
    a.nails.forEach((n, ni)=>{
      const wp = a.root.localToWorld(n.p.clone());
      const A = new THREE.Box3().setFromObject(n.a.mesh).expandByScalar(0.03);
      const B = new THREE.Box3().setFromObject(n.b.mesh).expandByScalar(0.03);
      if(!A.containsPoint(wp) || !B.containsPoint(wp))
        throw new Error('nail ' + ni + ' is not at the seam of its two pieces');
    });
    return '16 nails on the blueprint joints, every point inside both boxes';
  });
  P('the finished flat rides the save with zero new save code', ()=>{
    const a = window.__flat;
    if(!a) throw new Error('no flat to save');
    scene.updateMatrixWorld(true);
    window.__flatPoses = a.pieces.map(p=>{
      const wp2 = p.mesh.getWorldPosition(new THREE.Vector3());
      return [p.prof, +wp2.x.toFixed(4), +wp2.y.toFixed(4), +wp2.z.toFixed(4)];
    });
    window.__saveJson = buildSerialize();
    const j = JSON.parse(window.__saveJson);
    const flat = j.asms.find(x=>!x.track && x.pieces && x.pieces.length === 5 &&
                               x.nails && x.nails.length === 16);
    if(!flat) throw new Error('the flat is not in the save');
    if(flat.anchor) throw new Error('the save grew an anchor');
    return '5 pieces and 16 nails to storage; the second boot checks the rest';
  });
  P('stand down mid-haul: the plank lies loose at the hand, nothing lost', ()=>{
    const keep = BUILD_VENUE; BUILD_VENUE = 'arc';
    const st = [regWood('sheet'), regWood('s2x4'), regWood('s2x4'), regWood('s2x4')];
    BUILD_VENUE = keep;
    const root = venueRoot('arc');
    root.updateMatrixWorld(true);
    const chopW = SAWS.arc.chop.group.getWorldPosition(new THREE.Vector3());
    st.forEach((b, i)=>{
      root.add(b.mesh);
      b.mesh.rotation.set(b.prof === 'sheet' ? -Math.PI/2 : 0, 0,
                          b.prof === 'sheet' ? 0 : Math.PI/2);
      const p = chopW.clone(); p.x += -2.6 + i*0.5; p.z += 2.0; p.y = 0.1;
      b.mesh.position.copy(root.worldToLocal(p));
      b.mesh.updateMatrixWorld(true);
      b.restH = woodRestH(b);
    });
    const mk2 = {venue:'arc', stage:'arcMain', x:window.__mark4.x - 3.5,
                 z:window.__mark4.z, yaw:0};
    const plan = carpStart('flat4x8', mk2);
    if(!plan || !plan.jobs) throw new Error('the second call refused: ' + JSON.stringify(plan));
    /* catch the crew with one piece already placed and another still riding:
       the five hauls run concurrently, so the first set-down always leaves
       planks in the air behind it */
    let caught = false;
    for(let i = 0; i < 120000 && CREW.running && !caught; i++){
      updateCrew(0.05); updateBodies(0.05);
      if(typeof CARP_RUN !== 'undefined' && CARP_RUN && CARP_RUN.placed &&
         Object.keys(CARP_RUN.placed).length &&
         CREW.people.some((h, hi)=>hi < 6 && h.carryB)) caught = true;
    }
    if(!caught) throw new Error('never caught a hand mid-haul with work already placed');
    const carrier = CREW.people.find((h, hi)=>hi < 6 && h.carryB);
    const cb = carrier.carryB, cmesh = cb.mesh;
    const hx = carrier.x, hz = carrier.z;
    const pk = +Object.keys(CARP_RUN.placed)[0];
    const pb = CARP_RUN.placed[pk];
    const bp = CARP_CAT.flat4x8.blueprint.pieces[pk];
    const before = BODIES.length;
    crewStop(true);                       // the stage swap stand-down path (p2k)
    if(BODIES.length !== before) throw new Error('stand down changed the body count');
    if(BODIES.indexOf(cb) < 0) throw new Error('the carried plank was disposed');
    if(cb.state !== 'loose') throw new Error('the plank came down as ' + cb.state);
    if(cmesh.parent !== root) throw new Error('the plank came down into the wrong parent');
    if(cmesh.geometry !== WOODG) throw new Error('the geometry changed identity');
    scene.updateMatrixWorld(true);
    const wp3 = cmesh.getWorldPosition(new THREE.Vector3());
    if(Math.hypot(wp3.x - hx, wp3.z - hz) > 1.5)
      throw new Error('the plank teleported ' + Math.hypot(wp3.x - hx, wp3.z - hz).toFixed(1) + 'm from the hand');
    if(CARP_RUN) throw new Error('a stood-down run left CARP_RUN behind');
    /* the piece already placed stays at its blueprint pose — honest
       workshop state (RULING AC) */
    if(pb.state !== 'loose') throw new Error('a placed piece is ' + pb.state);
    const want3 = new THREE.Vector3(bp.pos[0], bp.pos[1], bp.pos[2]);
    want3.x += mk2.x; want3.z += mk2.z;   // yaw 0 on this mark
    if(pb.mesh.getWorldPosition(new THREE.Vector3()).distanceTo(want3) > 0.05)
      throw new Error('the placed piece wandered off its pose');
    /* the finished flat from the first call is untouched */
    if(window.__flat.pieces.length !== 5 || window.__flat.nails.length !== 16)
      throw new Error('the stand down disturbed the finished flat');
    return 'plank loose at the hand, placed work standing, CARP_RUN cleared';
  });
  P('the settle holds a placed, un-nailed skin at its blueprint height', ()=>{
    const keep = BUILD_VENUE; BUILD_VENUE = 'arc';
    const st = [regWood('sheet'), regWood('s2x4'), regWood('s2x4'), regWood('s2x4')];
    BUILD_VENUE = keep;
    const root = venueRoot('arc');
    root.updateMatrixWorld(true);
    const chopW = SAWS.arc.chop.group.getWorldPosition(new THREE.Vector3());
    st.forEach((b, i)=>{
      root.add(b.mesh);
      b.mesh.rotation.set(b.prof === 'sheet' ? -Math.PI/2 : 0, 0,
                          b.prof === 'sheet' ? 0 : Math.PI/2);
      const p = chopW.clone(); p.x += -2.6 + i*0.5; p.z += 3.4; p.y = 0.1;
      b.mesh.position.copy(root.worldToLocal(p));
      b.mesh.updateMatrixWorld(true);
      b.restH = woodRestH(b);
    });
    const mk3 = {venue:'arc', stage:'arcMain', x:window.__mark4.x,
                 z:window.__mark4.z + 3.2, yaw:0};
    const plan = carpStart('flat4x8', mk3);
    if(!plan || !plan.jobs) throw new Error('the third call refused: ' + JSON.stringify(plan));
    let sheetB = null;
    for(let i = 0; i < 120000 && CREW.running && !sheetB; i++){
      updateCrew(0.05); updateBodies(0.05);
      if(typeof CARP_RUN !== 'undefined' && CARP_RUN && CARP_RUN.placed && CARP_RUN.placed[0])
        sheetB = CARP_RUN.placed[0];
    }
    if(!sheetB) throw new Error('the skin was never placed');
    crewStop(true);
    /* the decision under test: the skin poses at 0.0475 — its 0.0095
       half-box ON the 0.038 frame.  groundAt sees architecture, not the
       frame, so woodRestH would let updateBodies drag the skin through it
       between haul and nail; the set-down stores the POSE height as the
       rest height instead. */
    if(Math.abs(sheetB.restH - 0.0475) > 1e-6)
      throw new Error('restH is ' + sheetB.restH + ', not the pose height 0.0475');
    scene.updateMatrixWorld(true);
    const y0 = sheetB.mesh.getWorldPosition(new THREE.Vector3()).y;
    if(Math.abs(y0 - 0.0475) > 0.01) throw new Error('placed at y ' + y0.toFixed(4));
    /* the control: prove the settle is LIVE on this patch of deck — under
       the natural half-box the skin sinks at once... */
    sheetB.restH = 0.0095;
    for(let i = 0; i < 40; i++) updateBodies(0.05);
    const yc = sheetB.mesh.getWorldPosition(new THREE.Vector3()).y;
    if(yc > 0.02) throw new Error('the control never sank (y ' + yc.toFixed(4) + ') — the settle is dead here');
    /* ...and under the pose height it comes back up and HOLDS */
    sheetB.restH = 0.0475;
    for(let i = 0; i < 60; i++) updateBodies(0.05);
    const y1 = sheetB.mesh.getWorldPosition(new THREE.Vector3()).y;
    if(Math.abs(y1 - 0.0475) > 0.003)
      throw new Error('60 settle frames later the skin sits at y ' + y1.toFixed(4));
    return 'restH carries the stack: 0.0475 held across 60 settle frames';
  });

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;
const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); } catch(e){ console.log('THREW '+e.message); console.log(e.stack.split('\n').slice(0,5).join('\n')); process.exit(1); }
let errs = (w.__errs||[]).length;

/* ---- the second boot (PR 4): the finished flat must ride the save --------
   build.js's two-world pattern; the second JSDOM needs url: (TRAPS.md —
   about:blank has no localStorage).  The expected world poses come out of
   the FIRST world, interpolated into the probe below. */
if(!errs && w.__saveJson && w.__flatPoses){
  const dom2 = new JSDOM(html.replace(/<script src=.*?<\/script>/,''),
    {runScripts:'outside-only', pretendToBeVisual:true, url:'https://the.house/'});
  const w2 = dom2.window;
  w2.HTMLCanvasElement.prototype.getContext = w.HTMLCanvasElement.prototype.getContext;
  w2.THREE = THREE;
  w2.AudioContext = undefined;
  w2.requestAnimationFrame = cb => { w2.__raf = cb; return 1; };
  w2.localStorage.setItem('house.build', w.__saveJson);   // BEFORE the boot
  const probe2 = `
;(function(){
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  window.__errs = [];
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,210):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); window.__errs.push(name+': '+e.message); } };
  console.log('--- the built flat, second boot (PR 4) ---');
  P('the flat came back whole: 5 fixed pieces, 16 nails, poses held, still rigid', ()=>{
    const want = ${JSON.stringify(w.__flatPoses)};
    const a = ASSEMBLIES.find(x=>!x.track && x.pieces.length === 5 &&
                                 x.nails && x.nails.length === 16);
    if(!a) throw new Error('no 5-piece 16-nail assembly after the reload');
    if(a.anchor) throw new Error('the reload grew an anchor');
    if(a.pieces.some(p=>p.state !== 'fixed')) throw new Error('a piece came back un-fixed');
    if(a.pieces.some(p=>p.pivot)) throw new Error('a pivot grew in the reload');
    scene.updateMatrixWorld(true);
    const left = a.pieces.slice();
    for(const wp of want){
      const i = left.findIndex(p=>p.prof === wp[0] &&
        p.mesh.getWorldPosition(new THREE.Vector3())
          .distanceTo(new THREE.Vector3(wp[1], wp[2], wp[3])) < 0.02);
      if(i < 0) throw new Error('a ' + wp[0] + ' lost its world pose in the reload');
      left.splice(i, 1);
    }
    return '5 pieces matched by world pose, 16 nails, rigid, un-anchored';
  });
  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;
  try{ w2.eval(script + probe2); }
  catch(e){ console.log('SECOND BOOT THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); errs++; }
  errs += (w2.__errs||[]).length;
} else if(!errs){
  console.log('  ERR the save round trip never ran — no save came out of the first world');
  errs++;
}
process.exit(errs ? 1 : 0);
