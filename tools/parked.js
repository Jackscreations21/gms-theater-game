/* PROBE — RULING BQ: where does a struck set actually GO, and can you see it?

   "make it so when i set comes off it is never gone it is always somewhere
   backstage."

   Today sceneApply(sc,false) makes a struck set cease to exist: invisible,
   layers.disableAll() on every descendant, walkables off WALKABLE.  BQ keeps it
   drawn and solid at a park position instead — which means three things nothing
   in this repo has ever checked:

     1. WHERE each park lands, as a WORLD BOX, against what it could foul: the
        Palace brick (PAL_BACK), the grid (D.gridY), the wing walls, the cloths.
     2. WHETHER IT IS MASKED FROM A SEAT.  A park you can see from row F is not a
        park, it is a set standing in the picture.
     3. WHAT IT COSTS to keep drawn and to pick, because layers.disableAll() was
        also what kept a struck set off every raycast.  RULING BY is the
        precedent there: the guessed number was 100x out.

   IT LOADS HIS REAL MODELS, because they are what ships and they are 93k-99.5k
   triangles each against a stand-in's few hundred.  Run it with PROBE_STANDIN=1
   to see the stand-ins instead.

   TWO THINGS THIS PROBE GOT WRONG FIRST, both of which reported a ruling as a
   fault — the failure mode tools/models.js is on record for:

     - TRAVEL MEASURED FROM THE CENTRE said the cemetery does not move at all.
       Its two hills run to OPPOSITE wings, so the centre is exactly where it
       was and the BOX is what changed.  Displacement is measured on the box.
     - VISIBILITY CAST AGAINST THE SET ALONE said all five flown sets are in the
       picture.  A ray through the top of the opening RISES as it goes upstage
       (0.65m per metre from a stalls eye), so at the fly floor it is level with
       a set parked 10.5m up — but the BORDER is in the way, and the probe was
       not looking at the border.  It takes the FIRST hit against everything
       that is actually drawn now, which is what "can you see it" means.

     export NODE_PATH=../tests/node_modules
     node parked.js                                                          */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const {JSDOM} = require('jsdom');
const html = fs.readFileSync(path.join(ROOT, 'the-house.html'), 'utf8');
const dom = new JSDOM(html.replace(/<script src=.*?<\/script>/, ''),
                      {runScripts: 'outside-only', pretendToBeVisual: true});
const w = dom.window;
w.HTMLCanvasElement.prototype.getContext = function(){
  const noop = ()=>{};
  if(this.__ctx) return this.__ctx;
  return this.__ctx = {fillRect:noop, fillStyle:'', strokeStyle:'', lineWidth:1, font:'',
    beginPath:noop, moveTo:noop, lineTo:noop, arc:noop, ellipse:noop, stroke:noop, fill:noop,
    save:noop, restore:noop, translate:noop, rotate:noop, scale:noop, drawImage:noop,
    clearRect:noop, createPattern:()=>null, fillText:noop, strokeText:noop, strokeRect:noop,
    rect:noop, arcTo:noop, setLineDash:noop, measureText:()=>({width:100}),
    bezierCurveTo:noop, quadraticCurveTo:noop, closePath:noop, clip:noop, setTransform:noop,
    globalAlpha:1, globalCompositeOperation:'',
    createLinearGradient:()=>({addColorStop:noop}), createRadialGradient:()=>({addColorStop:noop}),
    getImageData:(x,y,ww,hh)=>({data:new Uint8ClampedArray(Math.max(4,ww*hh*4))}), putImageData:noop};
};
const REAL = require('three');
const THREE = Object.create(REAL);
THREE.WebGLRenderer = class {
  constructor(){ const c = w.document.createElement('canvas');
    c.requestPointerLock = ()=>{};
    this.domElement = c; this.shadowMap = {enabled:false, type:0}; }
  setPixelRatio(){} setSize(){}
  render(scene, camera){ scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); }
};
/* jsdom decodes no images, so an honest TextureLoader never fires onLoad and
   GLTFLoader.parse hangs for ever waiting on its dependencies — the import then
   falls back SILENTLY BY DESIGN and the probe measures the stand-ins while
   reporting his models.  It did exactly that on the first run: every triangle
   count came back stand-in sized.  1x1 textures keep the shrink and the oversize
   backstop out of the way; this probe is about position and cost, not texels. */
THREE.TextureLoader = class {
  constructor(manager){ this.manager = manager; }
  setCrossOrigin(){ return this; } setPath(){ return this; }
  setRequestHeader(){ return this; } setWithCredentials(){ return this; }
  setResourcePath(){ return this; }
  load(url, onLoad){
    const t = new REAL.Texture();
    t.image = {width:1, height:1}; t.needsUpdate = true;
    if(onLoad) onLoad(t);
    return t;
  }
};
w.THREE = THREE;
w.AudioContext = undefined;
w.requestAnimationFrame = cb => { w.__raf = cb; return 1; };
if(!w.URL.createObjectURL){ w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {}; }

/* serve his files to the real importer, the tools/models.js way */
const STANDIN = !!process.env.PROBE_STANDIN;
if(!STANDIN) w.fetch = url => {
  const p = path.join(ROOT, String(url));
  if(!fs.existsSync(p)) return Promise.resolve({ok: false, status: 404});
  const b = fs.readFileSync(p);
  return Promise.resolve({ok: true, status: 200,
    arrayBuffer: () => Promise.resolve(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))});
};

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g, '');
/* SHOW, D, PAL_BACK, scene and FLY are CONSTS of the eval program, so they never
   become properties of the window the way a function declaration does.  Hand
   them out explicitly — the same thing tests/beetlejuice.js does for its tail. */
w.eval(script + ';window.__P = {SHOW:SHOW, D:D, PAL_BACK:PAL_BACK, scene:scene,' +
       ' WALKABLE:WALKABLE, FLY:FLY, GOODS:GOODS, CUES:CUES,' +
       /* added the moment it was first read — a const missing from this handout
          arrives as undefined and the probe prints a confident wrong answer */
       ' BJ_HILL_OUT:BJ_HILL_OUT, BJ_ATTIC_SIDE:BJ_ATTIC_SIDE,' +
       ' BJ_SIDE_ROOM:BJ_SIDE_ROOM, BJ_CLOSET_BACK:BJ_CLOSET_BACK};');
for(let i = 0; i < 90; i++){ const cb = w.__raf; w.__raf = null; if(cb) cb(1000 + i*16); }

const g = w, P = w.__P, T = REAL;
const D = P.D, PAL_BACK = P.PAL_BACK;
const OPEN_W = 13.6, OPEN_H = 9.2;             // the PICTURE, inside the border

const fmt = v => (v >= 0 ? ' ' : '') + v.toFixed(2);
const bx = b => '[' + fmt(b.min.x) + '..' + fmt(b.max.x) + ']';
const by = b => '[' + fmt(b.min.y) + '..' + fmt(b.max.y) + ']';
const bz = b => '[' + fmt(b.min.z) + '..' + fmt(b.max.z) + ']';

function box(o){ P.scene.updateMatrixWorld(true); return new T.Box3().setFromObject(o); }
function tris(o){
  let t = 0, m = 0;
  o.traverse(k => {
    if(!k.isMesh || !k.geometry) return;
    m++;
    const gg = k.geometry;
    const n = gg.index ? gg.index.count : (gg.attributes.position ? gg.attributes.position.count : 0);
    t += (n / 3) * (k.isInstancedMesh ? k.count : 1);
  });
  return {tris: Math.round(t), meshes: m};
}
function settle(limit){
  for(let i = 0; i < (limit || 3000); i++){
    g.sceneMoveStep(1/60);
    let moving = false;
    for(const sc of P.SHOW.scenes) if(g.sceneTravelling(sc)) moving = true;
    if(!moving) return i;
  }
  return -1;
}
/* BQ would leave these on; today the strike disables them.  Turn them back on so
   the probe measures the FEATURE and not the present.  BOTH FLAGS: the strike
   sets group.visible = false as well as clearing the layers, and a version of
   this that only did the layers left every parked set still undrawn — so the
   pick measurement below reported the same mesh count and 1.0x either way, which
   read as "parking is free" when nothing had been parked. */
function unhide(sc){
  sc.group.userData.sceneOff = false;
  if(typeof g.setPieceVisible === 'function') g.setPieceVisible(sc.group);
  sc.group.traverse(o => { o.layers.set(0); o.visible = true; });
}
/* how far the BOX moved, not the centre — two hills running to opposite wings
   leave the centre exactly where it was */
function boxShift(a, b){
  return Math.max(Math.abs(b.min.x - a.min.x), Math.abs(b.max.x - a.max.x),
                  Math.abs(b.min.y - a.min.y), Math.abs(b.max.y - a.max.y),
                  Math.abs(b.min.z - a.min.z), Math.abs(b.max.z - a.max.z));
}
/* everything actually DRAWN right now: layers on, and visible all the way up.
   A raycast ignores `visible` (TRAPS), so a probe about seeing must not. */
/* the show curtain is OUT during the show, and this harness cannot reliably part
   it: updateFly reports open = 1.00 while the cloth is still across the picture,
   which made the first four runs of the visibility test measure a drape.  So the
   traveler's own goods are excluded by MEMBERSHIP rather than by hoping — and the
   count is printed, so the exclusion is visible rather than silent. */
function travelerMeshes(){
  const set = new Set();
  for(const l of P.FLY){
    if(!l.goods || !P.GOODS[l.goodsKey] || !P.GOODS[l.goodsKey].traveler) continue;
    l.goods.traverse(o => { if(o.isMesh) set.add(o); });
  }
  return set;
}
let SKIP = new Set();
function drawn(){
  const out = [];
  P.scene.traverse(o => {
    if(!o.isMesh || !o.geometry) return;
    if(SKIP.has(o)) return;
    if(!o.layers.test(RAYL)) return;
    for(let k = o; k; k = k.parent) if(!k.visible) return;
    out.push(o);
  });
  return out;
}
const RAYL = new T.Layers();                   // layer 0, what a camera sees
function ownerScene(o){
  for(let k = o; k; k = k.parent) if(k.userData && k.userData.scene) return k.userData.scene;
  return null;
}
/* THE CURTAIN HAS TO BE OUT.  The show loads at the pre-show with the house
   curtain shut, and a shut curtain is the first thing every single ray hits — so
   the first run of this probe called all nine parks "masked" and was measuring a
   cloth.  A parked set has to be judged against the picture the audience gets
   during the show, which is the curtain open. */
function openCurtain(){
  /* OPEN EVERY TRAVELER, not the first one found.  Beetlejuice hangs its own
     show curtain on lineset 1 and the HOUSE curtain from the default hang is
     still in and shut on lineset 2 — so opening one left the other filling 70%
     of the picture, and the probe called all nine parks masked twice over. */
  const trav = P.FLY.filter(l => l.goods && P.GOODS[l.goodsKey] && P.GOODS[l.goodsKey].traveler);
  if(!trav.length){ console.log('  (no traveler hung — nothing to open)'); return null; }
  trav.forEach(l => { l.travTarget = 1; });
  /* the halves are moved by updateFly and `open` ramps at 0.42/s — so it takes
     frames, not an assignment.  Writing ls.open directly moves nothing, the same
     trap as writing position on a frozen scene group. */
  for(let i = 0; i < 400 && trav.some(l => l.open < 0.999); i++) g.updateFly(1/60);
  return trav;
}
/* FIRST HIT from a stalls eye, across the whole picture opening */
const NX = 41, NY = 25;
function firstHits(from){
  const rc = new T.Raycaster(); rc.far = 140;
  const list = drawn();
  const tally = {};
  let n = 0;
  for(let i = 0; i < NX; i++) for(let j = 0; j < NY; j++){
    const tx = -OPEN_W/2 + OPEN_W * (i/(NX-1));
    const ty = 0.05 + OPEN_H * (j/(NY-1));
    rc.set(from, new T.Vector3(tx - from.x, ty - from.y, 0 - from.z).normalize());
    const hit = rc.intersectObjects(list, false)[0];
    n++;
    let key = '(nothing)';
    if(hit){
      key = ownerScene(hit.object);
      if(!key){
        /* NAME IT.  "(the room)" told the first run nothing at all — a probe that
           lumps every miss into one bucket cannot say what is in the way. */
        const o = hit.object;
        /* the NEAREST NAMED ancestor.  Lumping every non-scene hit into one
           "(the room)" bucket told the first run nothing about what was in the
           way, and the way was most of the answer. */
        let nm = null;
        for(let k = o; k && !nm; k = k.parent) if(k.name) nm = k.name;
        key = 'room:' + (nm || 'unnamed') + ' @z' + hit.point.z.toFixed(1);
      }
    }
    tally[key] = (tally[key] || 0) + 1;
  }
  return {tally, n};
}

(async () => {
  /* CAPTURE THE HOOK'S OWN PROMISE instead of importing a second time.  showLoad
     fires loadSetModels() and ignores what it returns, so a probe that awaits its
     own second call runs the whole import TWICE — which printed every import line
     twice and left the measurement standing on doubled state. */
  let hook = null;
  if(!STANDIN){
    const real = w.loadSetModels;
    w.loadSetModels = function(){ const p = real.apply(this, arguments); if(!hook) hook = p; return p; };
  }
  g.showLoad('beetlejuice');
  if(hook){ try{ await hook; }catch(e){ console.log('import threw: ' + e.message); } }
  const NAMES = P.SHOW.scenes.map(s => s.name);
  const landed = P.SHOW.scenes.filter(s => s.group.userData.bjApplied).map(s => s.name);

  console.log('');
  console.log('RULING BQ — WHERE A STRUCK SET GOES' +
              (STANDIN ? '  (the stand-ins)' : '  (HIS MODELS)'));
  console.log('the room: picture ' + OPEN_W + ' x ' + OPEN_H + ', stage ' + D.stageW +
              ' x ' + D.stageD + ', grid ' + D.gridY + ', Palace brick ' + PAL_BACK);
  if(!STANDIN) console.log('his models landed on: ' + (landed.join(', ') || 'NOTHING'));
  console.log('');

  /* -------------------------------------------------------------- the parks */
  /* WHERE A SET ACTS IS NOT ALWAYS WHERE sceneChangeTo LEAVES IT, and reading it
     that way made this probe measure the house wagon PARKED TWICE and then call
     its own reading "NO PARK" (RULING CO).  sceneChangeTo drives the part movers
     and deliberately never drives a whole-group one — the split rule says why —
     so a scene whose acting position is cue-authored has to be asked for it.

     ASKED OF THE PLOT, not assumed to be zero: the first cue that plays in this
     scene and states its offset is where the set acts.  A scene no cue moves
     keeps whatever the changeover gave it, which is right for every other set. */
  function actingOff(name){
    /* LOUD, not silent.  This whole helper exists because a probe read a field
       that was not there and printed a confident wrong answer; reading CUES off
       a handout that never carried it would be the same mistake one level up. */
    if(!P.CUES) throw new Error('the probe cannot see CUES — add it to the __P handout');
    for(const c of P.CUES){
      if(c.scene !== name) continue;
      const l = Array.isArray(c.move) ? c.move : (c.move ? [c.move] : []);
      const m = l.filter(x => x && x.scene === name && !x.part)[0];
      if(m) return m.off;
    }
    return null;
  }
  const rows = [];
  for(const name of NAMES){
    const sc = g.sceneFind(name);
    if(sc.always){ rows.push({name, note: 'ALWAYS — never struck'}); continue; }
    g.sceneChangeTo(name);
    const act = actingOff(name);
    if(act !== null && sc.mv) g.sceneMoveTo(name, act);
    settle();
    const onBox = box(sc.group);
    const cost = tris(sc.group);
    g.sceneChangeTo(name === 'bare' ? 'cemetery' : 'bare');
    settle(); unhide(sc);
    const offBox = box(sc.group);
    rows.push({name, onBox, offBox, cost, parks: !!sc.parks,
               shift: boxShift(onBox, offBox)});
  }

  console.log('SET           acting z            ->  parked x            parked y            parked z          moved');
  for(const r of rows){
    if(r.note){ console.log(r.name.padEnd(13) + ' ' + r.note); continue; }
    console.log(r.name.padEnd(13) + bz(r.onBox).padEnd(20) + '  ' + bx(r.offBox).padEnd(19) + ' ' +
                by(r.offBox).padEnd(19) + ' ' + bz(r.offBox).padEnd(18) + fmt(r.shift) + 'm');
  }

  /* ------------------------------------------------------ what the park fouls */
  console.log('');
  console.log('WHAT THE PARK FOULS  (a park that is not clear is not a park)');
  let faults = 0;
  for(const r of rows){
    if(r.note) continue;
    const b = r.offBox, bad = [];
    /* DECLARING a park and MOVING are two different failures and they used to be
       reported as one.  A scene with no park is the ruling working as written
       (the cemetery is 46.8m wide and has nowhere to go); a scene that declares
       one and then stands still is a wiring fault. */
    if(!r.parks) bad.push('NO PARK — it is struck where it acts, and BQ would leave it there');
    else if(r.shift < 0.01) bad.push('DECLARES A PARK AND NEVER MOVES — the mover is not wired');
    if(b.min.z < PAL_BACK) bad.push('through the Palace brick by ' + (PAL_BACK - b.min.z).toFixed(2) + 'm');
    if(b.max.y > D.gridY) bad.push('through the grid by ' + (b.max.y - D.gridY).toFixed(2) + 'm');
    if(b.min.x < -D.stageW/2) bad.push('past the stage-right wall by ' + (-D.stageW/2 - b.min.x).toFixed(2) + 'm');
    if(b.max.x > D.stageW/2) bad.push('past the stage-left wall by ' + (b.max.x - D.stageW/2).toFixed(2) + 'm');
    if(bad.length){ faults++; console.log('  ' + r.name.padEnd(11) + bad.join('; ')); }
    else console.log('  ' + r.name.padEnd(11) + 'clear');
  }

  /* ----------------------------------- and they all stand there AT THE SAME TIME */
  /* one set is on; the other eight are parked TOGETHER.  Nothing checked that they
     do not stand inside each other, and two houses in one wing is the obvious way
     for this ruling to go wrong. */
  console.log('');
  console.log('DO THE PARKS COLLIDE?  eight sets stand backstage at once');
  let clashes = 0;
  /* only sets that actually DECLARE a park stand there drawn.  Filtering on "did
     it move" instead counted the cemetery, which parts its hills but declares no
     park and is therefore switched off — an overlap with something nobody can see
     is not an overlap, and reporting it would be the probe calling a ruling a
     fault again. */
  const parked = rows.filter(r => !r.note && g.sceneFind(r.name).parks);
  for(let i = 0; i < parked.length; i++) for(let j = i+1; j < parked.length; j++){
    const a = parked[i], b = parked[j];
    if(!a.offBox.intersectsBox(b.offBox)) continue;
    const o = a.offBox.clone().intersect(b.offBox);
    const d = o.getSize(new T.Vector3());
    /* a graze along one face is not two sets in the same place */
    if(Math.min(d.x, d.y, d.z) < 0.05) continue;
    clashes++;
    console.log('  ' + a.name + ' x ' + b.name + '  overlap ' +
                d.x.toFixed(2) + ' x ' + d.y.toFixed(2) + ' x ' + d.z.toFixed(2) + 'm');
  }
  if(!clashes) console.log('  none — every parked set has its own space');

  /* ------------------------------------------- can you see it from a seat */
  console.log('');
  console.log('SEEN FROM A SEAT?  ' + (NX*NY) + ' rays from a stalls eye across the whole');
  console.log('picture, FIRST HIT against everything drawn — so the border counts.');
  const eye = new T.Vector3(0, 1.35, 12.0);
  const cur = openCurtain();
  if(cur) console.log('  opened ' + cur.length + ' traveler(s): ' +
                      cur.map(l => 'lineset ' + l.id + ' ' + l.goodsKey +
                                   ' (' + l.open.toFixed(2) + ')').join(', '));
  SKIP = travelerMeshes();
  console.log('  and excluded the ' + SKIP.size + ' traveler meshes: a show curtain is OUT');
  /* the whole tally for ONE case, printed so a reader can see the probe is
     looking at the room and not at a cloth — the mistake it made first time */
  g.sceneChangeTo('cemetery'); settle();
  const diag = firstHits(eye);
  console.log('  what the picture is made of with the cemetery ON and the curtain out:');
  for(const k of Object.keys(diag.tally).sort((a,b)=>diag.tally[b]-diag.tally[a]))
    console.log('      ' + String(diag.tally[k]).padStart(4) + '  ' + k);
  for(const r of rows){
    if(r.note) continue;
    const sc = g.sceneFind(r.name);
    g.sceneChangeTo(r.name); settle();
    g.sceneChangeTo(r.name === 'bare' ? 'cemetery' : 'bare'); settle();
    /* RE-HIDE EVERY OTHER SET FIRST.  Each pass unhides one, and without this the
       ones unhidden by earlier passes stay drawn and mask the one being measured
       — so the probe would report a park as invisible because a DIFFERENT park
       was standing in front of it. */
    for(const o of P.SHOW.scenes) if(!o.always && o !== sc && !o.on) g.sceneApply(o, false);
    unhide(sc);
    const {tally, n} = firstHits(eye);
    const mine = tally[r.name] || 0;
    console.log('  ' + r.name.padEnd(11) + String(mine).padStart(4) + ' / ' + n + '  ' +
                (100*mine/n).toFixed(1).padStart(5) + '%   ' +
                (mine === 0 ? 'MASKED — a real park' : 'VISIBLE IN THE PICTURE'));
  }

  /* ------------------------------------- can you see it from ANY seat, not one
     RULING DF, AND THE REASON THIS SECTION EXISTS.  The pass above casts from ONE
     eye at (0, 1.35, 12) — the middle of the stalls — and it reported every park
     MASKED while the owner, sitting in a headset, could see sets in the wings.
     Both are true.  A theatre has hundreds of seats and the middle one is the
     KINDEST: the extreme side seats look diagonally across the picture and
     straight into the OPPOSITE wing, which is the whole reason real masking is
     set to the worst sightline in the house rather than to the axis.

     AND IT AIMS AT THE SET, NOT AT THE OPENING.  Aiming a grid across the picture
     asks "what is in the picture"; it can only find a park by accident, and it
     reports 0% for a set that is plainly visible three metres to the side of
     where the rays were pointed.  This casts from every eye toward sample points
     ON the parked set and asks whether the set is the FIRST thing the ray meets.

     It is a SAMPLE and says so: mesh world-box corners and centres, not every
     vertex, so a thin set seen edge-on through a small gap can slip between the
     samples.  A count of 0 here means "no sampled ray reached it", which is
     weaker than a proof and much stronger than one eye on the axis. */
  console.log('');
  const eyes = [];
  {
    const at = (x, y, z, where) => eyes.push({p:new T.Vector3(x, y, z), where});
    /* THE STALLS.  Front row close enough to the plaster line to have the widest
       angle across it, back row at the rear of the orchestra.  x runs out to
       within a metre of the side walls at +-D.houseW/2. */
    const sx = D.houseW/2 - 1;
    for(const z of [2.5, 6, 10, 14])
      for(const x of [-sx, -sx*0.6, 0, sx*0.6, sx])
        at(x, 1.35, z, 'stalls');
    /* THE TWO BALCONIES.  Higher, further back, and they see DOWN into a wing
       past the top of a masking leg rather than round the side of it. */
    for(const z of [D.mezzZ + 0.5, D.mezzZ + 4, D.mezzZ + 7])
      for(const x of [-sx*0.85, -sx*0.5, 0, sx*0.5, sx*0.85])
        at(x, D.mezzY + 0.9, z, 'mezzanine');
    for(const z of [D.balcZ + 0.5, D.balcZ + 4, D.balcZ + 7])
      for(const x of [-sx*0.75, -sx*0.45, 0, sx*0.45, sx*0.75])
        at(x, D.balcY + 0.9, z, 'balcony');
  }
  console.log('SEEN FROM ANY SEAT IN THE HOUSE?  ' + eyes.length +
              ' eyes (stalls, mezzanine, balcony),');
  console.log('each casting at sample points ON the parked set — first hit wins.');
  /* AND SAY WHAT THIS PASS IS FORCING, because a probe that reports a state the
     show never reaches is the "probe that calls a ruling a fault" trap.  unhide()
     sets sceneOff false and turns every layer on, which is exactly right for a set
     that DECLARES a park — RULING BQ keeps those drawn on purpose.  For a scene
     with NO park, BQ switches it off entirely, so the row below measures a
     hypothetical: what you WOULD see if it were left standing.  cemetery and bare
     are both in that class and neither is a defect. */
  console.log('NOTE: this pass forces every set DRAWN.  For a set that declares a');
  console.log('park that is what the show really does (BQ); for one that does not,');
  console.log('the row is a hypothetical, because BQ switches those off outright.');

  /* SAMPLE THE REAL SURFACE, NOT THE BOUNDING BOX, and the first version of this
     probe got it wrong in the way TRAPS predicts.  Sampling each mesh's world-box
     corners plus its centre gave the sets that matter most — his imported houses,
     which are ONE merged mesh each — exactly NINE points: eight box corners, all
     of them in mid-air metres away from any geometry, plus a centre buried inside.
     Every ray missed the set and hit the room behind it, and the probe reported a
     confident 0/450 UNSEEN.  Walking the position attribute instead puts every
     sample ON the set, which is the only place a sample is worth casting at. */
  const SAMPLE_CAP = 240;
  const samplesOf = sc => {
    const pts = [], meshes = [];
    sc.group.updateWorldMatrix(true, true);
    sc.group.traverse(o => { if(o.isMesh && o.visible && !SKIP.has(o)) meshes.push(o); });
    let total = 0;
    for(const m of meshes){
      const a = m.geometry && m.geometry.attributes && m.geometry.attributes.position;
      if(a) total += a.count;
    }
    if(!total) return pts;
    const stride = Math.max(1, Math.floor(total / SAMPLE_CAP));
    const v = new T.Vector3();
    let k = 0;
    for(const m of meshes){
      const a = m.geometry && m.geometry.attributes && m.geometry.attributes.position;
      if(!a) continue;
      for(let i = 0; i < a.count; i++, k++){
        if(k % stride) continue;
        v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld);
        pts.push(v.clone());
      }
    }
    return pts;
  };

  const seenRows = [];
  for(const r of rows){
    if(r.note) continue;
    const sc = g.sceneFind(r.name);
    g.sceneChangeTo(r.name); settle();
    g.sceneChangeTo(r.name === 'bare' ? 'cemetery' : 'bare'); settle();
    for(const o of P.SHOW.scenes) if(!o.always && o !== sc && !o.on) g.sceneApply(o, false);
    unhide(sc);
    const pts = samplesOf(sc);
    const list = drawn();
    const rc = new T.Raycaster(); rc.far = 200;
    const byWhere = {};
    let hits = 0, shots = 0, worst = null;
    for(const e of eyes){
      let mine = 0;
      for(const p of pts){
        const d = new T.Vector3().subVectors(p, e.p);
        const len = d.length(); if(len < 0.01) continue;
        rc.set(e.p, d.normalize());
        shots++;
        const hit = rc.intersectObjects(list, false)[0];
        if(hit && ownerScene(hit.object) === r.name){ mine++; hits++; }
      }
      byWhere[e.where] = (byWhere[e.where] || 0) + mine;
      if(mine && (!worst || mine > worst.n))
        worst = {n:mine, where:e.where, x:e.p.x, z:e.p.z};
    }
    seenRows.push({name:r.name, hits, shots, pts:pts.length, byWhere, worst});
  }
  for(const s of seenRows){
    const where = Object.keys(s.byWhere).filter(k => s.byWhere[k] > 0)
                    .map(k => k + ':' + s.byWhere[k]).join(' ');
    console.log('  ' + s.name.padEnd(11) + String(s.hits).padStart(5) + ' / ' +
                String(s.shots).padStart(5) + ' rays  ' +
                (s.hits === 0 ? 'UNSEEN from every sampled seat'
                              : 'SEEN — worst eye ' + s.worst.where + ' at x ' +
                                s.worst.x.toFixed(1) + ' z ' + s.worst.z.toFixed(1) +
                                '   [' + where + ']'));
  }
  {
    const bad = seenRows.filter(s => s.hits > 0 && s.name !== 'bare' && s.name !== 'cemetery');
    console.log('  ' + (bad.length
      ? bad.length + ' park(s) visible from a real seat: ' + bad.map(s => s.name).join(', ')
      : 'none — every park is out of sight from every sampled seat'));
    console.log('  (bare and cemetery declare NO park and are expected here: the bare');
    console.log('   stage IS the picture, and the cemetery is struck where it acts.)');
  }

  /* --------------------------------- HOW FAR WOULD THE HILLS HAVE TO RUN?
     The cemetery is the one set with no park: RULING CE ran its two hills to
     opposite wings and left them struck where they act, and the section above
     measures them still SEEN from the stalls.  So sweep the offset and find the
     first one that is not.

     Driven through sceneMoveApply — the very call a cue makes — so this measures
     the engine's own travel and not an idea of it, and no rebuild is needed to try
     a number.  BJ_HILL_OUT is the constant it is pricing. */
  console.log('');
  console.log('HOW FAR WOULD THE CEMETERY HILLS HAVE TO RUN?  BJ_HILL_OUT is ' +
              (P.BJ_HILL_OUT === undefined ? '(not in the handout)' : P.BJ_HILL_OUT) + 'm today.');
  console.log('This PRICES THE OPEN QUESTION of giving the cemetery a park — it is');
  console.log('switched off in the real show, so none of this is a live defect.');
  console.log('The answer is the useful part: running them further does NOT hide it.');
  {
    const cem = g.sceneFind('cemetery');
    const wall = D.stageW/2;
    for(const off of [9.5, 12, 14, 16, 18, 20, 22, 24]){
      g.sceneChangeTo('cemetery'); settle();
      g.sceneChangeTo('bare'); settle();
      for(const o of P.SHOW.scenes) if(!o.always && o !== cem && !o.on) g.sceneApply(o, false);
      unhide(cem);
      g.sceneMoveApply({scene:'cemetery', part:'hillR', off:-off});
      g.sceneMoveApply({scene:'cemetery', part:'hillL', off: off});
      for(let i = 0; i < 2400; i++) g.updateStorm(1/60);      // let it finish travelling
      const pts = samplesOf(cem);
      const list = drawn();
      const rc = new T.Raycaster(); rc.far = 200;
      let mine = 0, worst = null;
      const culprit = {};
      for(const e of eyes){
        let n = 0;
        for(const p of pts){
          const d = new T.Vector3().subVectors(p, e.p);
          const len = d.length(); if(len < 0.01) continue;
          rc.set(e.p, d.normalize());
          const hit = rc.intersectObjects(list, false)[0];
          if(hit && ownerScene(hit.object) === 'cemetery'){
            n++; mine++;
            /* WHICH PIECE.  Running the hills further did not empty the picture, and
               a count alone cannot say why — the answer turned out to be that not
               everything in this scene is ON a hill mover, so some of it never
               travels however big the offset gets. */
            let nm = null;
            for(let k = hit.object; k && !nm; k = k.parent) if(k.name) nm = k.name;
            culprit[nm || 'unnamed'] = (culprit[nm || 'unnamed'] || 0) + 1;
          }
        }
        if(n && (!worst || n > worst.n)) worst = {n, where:e.where, x:e.p.x, z:e.p.z};
      }
      cem.group.updateWorldMatrix(true, true);
      const b = new T.Box3().setFromObject(cem.group);
      console.log('  ' + String(off).padStart(5) + 'm  ->  ' + String(mine).padStart(5) +
                  ' rays  x [' + b.min.x.toFixed(2).padStart(7) + '..' + b.max.x.toFixed(2).padStart(7) + ']' +
                  '  through the wall by ' +
                  Math.max(0, Math.max(-wall - b.min.x, b.max.x - wall)).toFixed(2) + 'm  ' +
                  (mine === 0 ? 'UNSEEN'
                              : 'seen from ' + worst.where + ' x ' + worst.x.toFixed(1)));
      if(mine){
        const top = Object.keys(culprit).sort((a,b)=>culprit[b]-culprit[a]).slice(0, 4);
        console.log('           what is showing: ' +
                    top.map(k => k + ' x' + culprit[k]).join(', '));
      }
    }
    console.log('  the outer ends going THROUGH the side wall is not the problem — the');
    console.log('  wall masks them.  What matters is the INNER end clearing the sightline.');
  }

  /* -------------------------------------------------- what it costs to draw */
  console.log('');
  console.log('WHAT KEEPING THEM DRAWN COSTS');
  let tt = 0, tm = 0;
  for(const r of rows){
    if(r.note) continue;
    tt += r.cost.tris; tm += r.cost.meshes;
    console.log('  ' + r.name.padEnd(11) + String(r.cost.tris).padStart(9) + ' tris  ' +
                String(r.cost.meshes).padStart(4) + ' meshes');
  }
  console.log('  ' + 'ALL PARKED'.padEnd(11) + String(tt).padStart(9) + ' tris  ' +
              String(tm).padStart(4) + ' meshes');
  console.log('  today only the set on the deck is drawn; the rest cost nothing at all.');

  /* ------------------------------------------------------------- the pick */
  console.log('');
  console.log('THE PICK — one ray straight upstage, 200 calls');
  /* WHERE YOU POINT IS THE WHOLE COST.  A parked set off the ray axis is rejected
     by its bounding sphere for almost nothing (RULING BY measured that too: the
     same 99k mesh costs 4.2867ms under the ray and 0.0001ms 40m away).  So the
     honest case is a player IN THE WINGS looking straight at the parked house,
     which is precisely what BQ invites them to do. */
  function pickMs(from, at){
    P.scene.updateMatrixWorld(true);
    const list = drawn();
    const rc = new T.Raycaster(); rc.far = 140;
    const dir = at.clone().sub(from).normalize();
    const t0 = process.hrtime.bigint();
    for(let i = 0; i < 200; i++){ rc.set(from, dir); rc.intersectObjects(list, false); }
    return {ms: Number(process.hrtime.bigint() - t0) / 1e6 / 200, n: list.length};
  }
  const CENTRE = {from: new T.Vector3(0, 1.6, 6),      at: new T.Vector3(0, 1.0, -14)};
  const WING   = {from: new T.Vector3(-9, 1.6, -8),    at: new T.Vector3(-16, 4.0, -8)};
  g.sceneChangeTo('cemetery'); settle();
  const off = pickMs(CENTRE.from, CENTRE.at);
  const offW = pickMs(WING.from, WING.at);
  console.log('  parked, with the raycast opt-out (RULING BQ as built)');
  console.log('    from a seat, straight upstage:   ' + off.ms.toFixed(4) + ' ms');
  console.log('    FROM THE WINGS, at the house:    ' + offW.ms.toFixed(4) + ' ms');
  /* AND THE VERSION THAT WAS REJECTED, so the number stays in the repo rather
     than only in a commit message: parked, drawn AND pickable.  This is what
     removing the layer sweep costs if you stop there. */
  const restored = [];
  P.scene.traverse(o => {
    if(o.isMesh && o.userData.parkRc){ delete o.raycast; restored.push(o); }
  });
  const on = pickMs(CENTRE.from, CENTRE.at);
  const onW = pickMs(WING.from, WING.at);
  console.log('  parked and PICKABLE (the version measurement refused)');
  console.log('    from a seat, straight upstage:   ' + on.ms.toFixed(4) + ' ms   (' +
              (on.ms/off.ms).toFixed(1) + 'x)');
  console.log('    FROM THE WINGS, at the house:    ' + onW.ms.toFixed(4) + ' ms   (' +
              (onW.ms/offW.ms).toFixed(1) + 'x)  <-- ' +
              (100*onW.ms/11.11).toFixed(0) + '% of a 90Hz frame');
  console.log('  ' + restored.length + ' parked meshes put back on the pick to measure that.');
  restored.forEach(o => { o.raycast = ()=>{}; });
  console.log('  a 90Hz frame is 11.11ms.  groundAt reads WALKABLE, a DIFFERENT list, and');
  console.log('  a parked set must stay off it — which is what makes that cost zero by design.');
  console.log('');
  console.log(faults ? 'PARKS THAT FOUL SOMETHING: ' + faults + ' of ' +
                       rows.filter(r=>!r.note).length
                     : 'every park is clear');
})();
