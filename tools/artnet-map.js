/* THE ART-NET CHANNEL MAP, GENERATED OFF THE CODE          (RULING EO, PR 8)

   RULING EO says the map file "cannot drift from the code because it is read
   off the code".  This is the probe that reads it.  It emits `docs/ARTNET.md`
   on stdout:

     export NODE_PATH=../tests/node_modules
     node artnet-map.js > ../docs/ARTNET.md

   and `tests/artnet.js` fails if the committed file and this output disagree.

   WHY IT PRINTS THE BUILT FILE'S BYTE SIZE FIRST.  Every probe in this repo
   that reads `the-house.html` measures the LAST BUILD, so an src-only edit
   leaves it describing bytes that are no longer what anyone is running
   (TRAPS, the last entry in the file).  The size line says which bytes were
   read.  It is also the ONE line the suite does not compare, and the reasoning
   for that is written down in tests/artnet.js beside the assertion.

   NOTHING BELOW IS TYPED FROM A TABLE.  The rulings' own prose has already
   been wrong about this data once — RULING ET says "the attic tracking in
   from x -14.20" where the built record reads home 0, out -19.50 — so every
   name, band, metre and channel number here is either read off a live record
   or MEASURED by calling the game's own apply functions with a synthesised
   frame and reading what moved.  Where the two could disagree, three
   self-checks throw:

     1  every fixture's intensity channel is found by driving that ONE byte
        and watching exactly one fixture light
     2  every lineset's target and speed channels the same way
     3  every set mover's channel the same way, for every mover whose travel
        is long enough to be told apart (the degenerate ones are named)

   A probe that judges has to be checkable, and a map nobody can check is a
   table with a script in front of it.                                     */

const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const HOUSE_FILE = path.join(ROOT, 'the-house.html');

/* the suites' node_modules, whether or not NODE_PATH was exported.  The other
   probes require the env var; this one is also SPAWNED BY A SUITE, and a map
   that only matches when an environment variable happens to be set is a map
   that fails for a reason that has nothing to do with the channels. */
function need(mod){
  try{ return require(mod); }
  catch(e){ return require(path.join(ROOT, 'tests', 'node_modules', mod)); }
}

const {JSDOM} = need('jsdom');
const html = fs.readFileSync(HOUSE_FILE, 'utf8');
const dom = new JSDOM(html.replace(/<script src=.*?<\/script>/, ''),
                      {runScripts: 'outside-only', pretendToBeVisual: true});
const w = dom.window;
/* THE PAGE'S OWN console GOES NOWHERE.  jsdom forwards it to this process's
   stdout, and the loader prints a line about the stand-ins the moment a show
   is loaded — which lands in the middle of the map and would be committed as
   part of it.  This file's only output is the map. */
{
  const noop = ()=>{};
  const quiet = {};
  for(const k of ['log','info','warn','error','debug','trace','dir','table','group',
                  'groupEnd','groupCollapsed','time','timeEnd','timeLog','count',
                  'countReset','assert','clear'])
    quiet[k] = noop;
  Object.defineProperty(w, 'console', {value: quiet, writable: true, configurable: true});
}
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
const REAL = need('three');
const THREE = Object.create(REAL);
THREE.WebGLRenderer = class {
  constructor(){ const c = w.document.createElement('canvas');
    c.requestPointerLock = ()=>{};
    this.domElement = c; this.shadowMap = {enabled:false, type:0}; }
  setPixelRatio(){} setSize(){}
  render(scene, camera){ scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); }
  compile(){}
  getRenderTarget(){ return this._rt || null; }
  setRenderTarget(t){ this._rt = t || null; }
  getClearColor(c){ return c.set(0x000000); }
};
w.THREE = THREE;
w.AudioContext = undefined;
w.requestAnimationFrame = cb => { w.__raf = cb; return 1; };
w.performance = {now: ()=>Date.now()};
if(!w.URL.createObjectURL){ w.URL.createObjectURL = () => 'blob:stub'; w.URL.revokeObjectURL = () => {}; }

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g, '');
/* FIXTURES, FLY, SHOW and every ART_ tunable are CONSTS of the eval program and
   never become window properties.  TRAPS: a const missing from this handout
   arrives as `undefined` and the probe prints a confident wrong answer — so
   every name is fetched here and every one of them is checked below. */
w.eval(script + ';window.__P = {FIXTURES:FIXTURES, FLY:FLY, GOODS:GOODS,' +
       ' SECTIONS:SECTIONS, SHOW:SHOW, HOUSE:HOUSE, OUT_TRIM:OUT_TRIM,' +
       ' ART_CH_FIX:ART_CH_FIX, ART_PAN:ART_PAN, ART_TILT_LO:ART_TILT_LO,' +
       ' ART_TILT_HI:ART_TILT_HI, ART_FLY_MAX:ART_FLY_MAX, ART_HOUSES:ART_HOUSES,' +
       ' GOBO_NAMES:GOBO_NAMES, GOBOS:GOBOS, STAGE:STAGE};');

const P = w.__P;
for(const k of ['FIXTURES','FLY','GOODS','SECTIONS','SHOW','HOUSE','OUT_TRIM',
                'ART_CH_FIX','ART_PAN','ART_TILT_LO','ART_TILT_HI','ART_FLY_MAX',
                'ART_HOUSES','GOBO_NAMES','GOBOS','STAGE'])
  if(P[k] === undefined) throw new Error('the probe cannot see ' + k + ' — add it to the __P handout');
for(const fn of ['artFixBase','artFlyBase','artHouseBase','artSelBase','artMoverBase',
                 'artBandOf','artLights','artFlys','artMovers','artMoverSet','artMoverOut',
                 'artMoverHauled','minTrimOf','showLoad','flyExtraStops'])
  if(typeof w[fn] !== 'function')
    throw new Error('the probe cannot see ' + fn + '() on the window');

function pump(n){
  for(let i = 0; i < n; i++){ const cb = w.__raf; w.__raf = null; if(cb) cb(Date.now() + i*16); }
}
pump(6);
if(w.__fatal) throw new Error('the file did not boot: ' + w.__fatal);

if(P.STAGE !== 'palace')
  throw new Error('the map is the Palace patch (RULING EN) and the board is on ' + P.STAGE);

const FIX = P.FIXTURES, FLY = P.FLY;
const CH_FIX = P.ART_CH_FIX;
/* THE RIG AND THE RAIL BELONG TO THE STAGE, NOT TO THE SHOW, so every base is
   already final before a production is loaded — which is why the light block
   and the house circuits below are the same in all five. */
const FIXB = w.artFixBase(), FLYB = w.artFlyBase(), HOUB = w.artHouseBase(),
      SELB = w.artSelBase(), MVB  = w.artMoverBase();

const f2 = v => (Math.round(v * 100) / 100).toFixed(2);
const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
/* right-aligned, so a two-digit rig does not stagger the tables */
const pad = (s, n) => ' '.repeat(Math.max(0, n - String(s).length)) + String(s);
function frame(){ return new Uint8Array(512); }
function put(b, ch, v){ b[ch - 1] = v; }              // channel numbers are 1-based

/* WHICH LINE THE TRAVELER CHANNEL BELONGS TO IS A PROPERTY OF THE HANG, and a
   production re-hangs the rail — so it is measured TWICE, once on the Palace's
   own standing hang and once on the show this map is generated with.  Driven
   half-open, because a write of the value a field already holds changes
   nothing and the first version of this reported that no line carried the
   traveler at all (every curtain in the building was shut). */
const TRAV_BYTE = 128;
function travelerNow(){
  const was = FLY.map(ls=>({target: ls.target, pos: ls.pos, artSpeed: ls.artSpeed,
                            travTarget: ls.travTarget, locked: ls.locked, relock: ls.relock}));
  const b = frame();
  for(let j = 0; j < FLY.length; j++) put(b, FLYB + j * 2 + 1, 255);   // every line driven
  put(b, SELB + 2, TRAV_BYTE);
  w.artFlys(b);
  const hit = FLY.map((ls, i)=>({i: i, id: ls.id, key: ls.goodsKey}))
                 .filter(x=>FLY[x.i].travTarget !== was[x.i].travTarget);
  FLY.forEach((ls, i)=>{ ls.target = was[i].target; ls.pos = was[i].pos;
    ls.artSpeed = was[i].artSpeed; ls.travTarget = was[i].travTarget;
    ls.locked = was[i].locked; ls.relock = was[i].relock; });
  if(hit.length > 1)
    throw new Error('channel ' + (SELB + 2) + ' moved ' + hit.length +
      ' travelers — the map claims it belongs to exactly one line');
  return hit[0] || null;
}
const travBare = travelerNow();
const travBareGoods = travBare ? (P.GOODS[travBare.key] || {}).label : null;

/* WHICH SHOW IS LOADED CHANGES THIS FILE, so the choice is made here and said
   out loud in the output.  Beetlejuice is the only production carrying set
   movers at all (RULING ET is for it), and it is also the show whose own
   goods hang on the fly rail — so the mover block and the lineset labels both
   come from it. */
const SHOW_KEY = 'beetlejuice';
if(!w.showLoad(SHOW_KEY)) throw new Error('the probe could not load ' + SHOW_KEY);
pump(4);

/* ---------------------------------------------------------------------------
   THE LABELS, read off the records BEFORE the rig is driven.  Every
   measurement below writes the rig, and a label taken afterwards would be a
   label taken from a rig this probe had just scribbled on.  The one thing
   already driven is the traveler probe above, which puts back every field it
   writes — and `travelerNow` is called again, after these, on the show's hang.
   ------------------------------------------------------------------------- */
function sectionOf(f){
  for(const s of P.SECTIONS)
    if(s.chans && s.chans.indexOf(f.ch) >= 0) return s.name.replace(/<br>/g, ' ');
  /* sectionOfChannel() answers 0 (FRONT WASH) for a channel in no section —
     `Math.max(0, findIndex)` — so it cannot be used to ANSWER this question,
     only to act on it.  A fixture off the board says so. */
  return 'NO SECTION ON THE BOARD';
}
const fixRows = FIX.map((f, i)=>({
  i: i, ch: f.ch, name: f.name, type: f.type, mover: !!f.mover,
  section: sectionOf(f), base: FIXB + i * CH_FIX
}));
const flyRows = FLY.map((ls, i)=>{
  const g = P.GOODS[ls.goodsKey] || null;
  return {i: i, id: ls.id, key: ls.goodsKey, label: g ? g.label : 'UNKNOWN GOODS',
          traveler: !!(ls.goods && g && g.traveler), lo: w.minTrimOf(ls),
          base: FLYB + i * 2};
});

/* the mover walk, exactly as RULING ET reads it: SHOW.scenes in declaration
   order, sc.mv first and then sc.pmv in declaration order, and a scene the
   rail hauls skipped — asked of the game's own artMoverHauled(), not of a
   list copied out of the show. */
const mvRows = [];
const hauled = [];
let mvCh = MVB;
for(const sc of P.SHOW.scenes){
  const has = !!(sc.mv || (sc.pmv && Object.keys(sc.pmv).length));
  if(w.artMoverHauled(sc)){ if(has) hauled.push(sc.name); continue; }
  if(sc.mv) mvRows.push({ch: mvCh++, scene: sc.name, part: 'mv', m: sc.mv});
  if(sc.pmv) for(const k in sc.pmv) mvRows.push({ch: mvCh++, scene: sc.name, part: k, m: sc.pmv[k]});
}
for(const r of mvRows){
  r.axis = r.m.axis;
  r.home = r.m.home;
  r.out  = w.artMoverOut(r.m);
  r.declaresOut = (typeof r.m.out === 'number');
  r.hasGroup = !!r.m.group;
}

/* ---------------------------------------------------------------------------
   THE MEASUREMENTS.  A frame is 512 bytes and the apply functions are called
   directly, which is the same code artnetTick reaches (it adds only the
   gates, and the gates are RULINGS EM/EN/EV, not the map).
   ------------------------------------------------------------------------- */

/* ---- 1: the seven fixture channels, driven one at a time ---------------- */
const SENTINEL = -12345;
function fixSnap(){
  return FIX.map(f=>({level:f.level, gobo:f.gobo, panT:f.panT, tiltT:f.tiltT,
                      r:f.color.r, g:f.color.g, b:f.color.b}));
}
/* SELF-CHECK 1 — one byte at a time, and exactly one fixture may answer it. */
for(let i = 0; i < FIX.length; i++){
  const b = frame();
  put(b, FIXB + i * CH_FIX, 255);
  w.artLights(b);
  const lit = [];
  for(let j = 0; j < FIX.length; j++) if(FIX[j].level > 0.5) lit.push(j);
  if(lit.length !== 1 || lit[0] !== i)
    throw new Error('SELF-CHECK 1 FAILED: channel ' + (FIXB + i * CH_FIX) +
      ' was meant to be fixture ' + (i + 1) + ' alone and lit [' +
      lit.map(x=>x + 1).join(',') + '] — the fixture block is not where this map says');
}

/* the seven offsets, measured on one fixture: what a byte of 255 in each slot
   does to the record. */
const zero = frame();
w.artLights(zero);
const dark = fixSnap();
const slotEffect = [];
for(let s = 0; s < CH_FIX; s++){
  const b = frame();
  for(let i = 0; i < FIX.length; i++) put(b, FIXB + i * CH_FIX + s, 255);
  w.artLights(b);
  const now = fixSnap();
  const moved = {level:0, colour:0, gobo:0, pan:0, tilt:0};
  for(let i = 0; i < FIX.length; i++){
    if(now[i].level !== dark[i].level) moved.level++;
    if(now[i].r !== dark[i].r || now[i].g !== dark[i].g || now[i].b !== dark[i].b) moved.colour++;
    if(now[i].gobo !== dark[i].gobo) moved.gobo++;
    if(now[i].panT !== dark[i].panT) moved.pan++;
    if(now[i].tiltT !== dark[i].tiltT) moved.tilt++;
  }
  slotEffect.push(moved);
  w.artLights(zero);
}

/* WHICH LANTERNS ACTUALLY TURN.  Not read off `f.mover` and printed as though
   it had been measured: the pan and tilt bytes are driven and the records
   that answered are the movers. */
const b_pt = frame();
for(let i = 0; i < FIX.length; i++){ put(b_pt, FIXB + i*CH_FIX + 5, 255); put(b_pt, FIXB + i*CH_FIX + 6, 255); }
w.artLights(b_pt);
const turnedHi = fixSnap();
const b_pt0 = frame();
for(let i = 0; i < FIX.length; i++){ put(b_pt0, FIXB + i*CH_FIX + 5, 0); put(b_pt0, FIXB + i*CH_FIX + 6, 0); }
w.artLights(b_pt0);
const turnedLo = fixSnap();
const b_ptM = frame();
for(let i = 0; i < FIX.length; i++){ put(b_ptM, FIXB + i*CH_FIX + 5, 128); put(b_ptM, FIXB + i*CH_FIX + 6, 128); }
w.artLights(b_ptM);
const turnedMid = fixSnap();
for(let i = 0; i < FIX.length; i++){
  const responds = turnedHi[i].panT !== turnedLo[i].panT || turnedHi[i].tiltT !== turnedLo[i].tiltT;
  fixRows[i].turns = responds;
  if(responds !== fixRows[i].mover)
    throw new Error('SELF-CHECK 1 FAILED: fixture ' + (i + 1) + ' declares mover=' +
      fixRows[i].mover + ' and ' + (responds ? 'moved' : 'did not move') + ' under a pan/tilt byte');
}
const aMover = fixRows.find(r=>r.turns);
const panAt = aMover ? {lo: turnedLo[aMover.i].panT, mid: turnedMid[aMover.i].panT, hi: turnedHi[aMover.i].panT} : null;
const tiltAt = aMover ? {lo: turnedLo[aMover.i].tiltT, mid: turnedMid[aMover.i].tiltT, hi: turnedHi[aMover.i].tiltT} : null;

/* the gobo bands, swept byte by byte rather than divided by 43 here */
const goboBands = [];
for(let v = 0; v < 256; v++){
  const b = frame();
  put(b, FIXB + 4, v);
  w.artLights(b);
  const g = FIX[0].gobo;
  const last = goboBands[goboBands.length - 1];
  if(!last || last.gobo !== g) goboBands.push({from: v, to: v, gobo: g});
  else last.to = v;
}
const goboName = {};
for(const k in P.GOBO_NAMES) goboName[P.GOBO_NAMES[k]] = k;

/* the intensity and colour maps, measured at three bytes */
const levelAt = [];
for(const v of [0, 128, 255]){
  const b = frame();
  put(b, FIXB, v); put(b, FIXB + 1, v); put(b, FIXB + 2, v); put(b, FIXB + 3, v);
  w.artLights(b);
  levelAt.push({byte: v, level: FIX[0].level, r: FIX[0].color.r});
}
w.artLights(zero);

/* ---- 2: the house circuits, in the order the code writes them ----------- */
const houseKeys = Object.keys(P.HOUSE);
const houseBefore = {};
for(const k of houseKeys) houseBefore[k] = P.HOUSE[k];
const houseChan = [];
for(let s = 0; s < 5; s++){
  for(const k of houseKeys) P.HOUSE[k] = houseBefore[k];
  const b = frame();
  put(b, HOUB + s, 255);
  w.artLights(b);
  const hit = houseKeys.filter(k=>P.HOUSE[k] !== houseBefore[k] && P.HOUSE[k] === 1);
  if(hit.length !== 1)
    throw new Error('SELF-CHECK 1 FAILED: channel ' + (HOUB + s) + ' moved ' + hit.length +
      ' house circuits [' + hit.join(',') + '] — one channel is one circuit');
  houseChan.push({ch: HOUB + s, key: hit[0]});
}
for(const k of houseKeys) P.HOUSE[k] = houseBefore[k];

/* ---- 3: the flys, both channels, one line at a time --------------------- */
const flySnap = ()=>FLY.map(ls=>({target: ls.target, pos: ls.pos, artSpeed: ls.artSpeed,
                                  travTarget: ls.travTarget, locked: ls.locked, relock: ls.relock}));
const flyWas = flySnap();
const flyRestore = ()=>FLY.forEach((ls, i)=>{ ls.target = flyWas[i].target; ls.pos = flyWas[i].pos;
  ls.artSpeed = flyWas[i].artSpeed; ls.travTarget = flyWas[i].travTarget;
  ls.locked = flyWas[i].locked; ls.relock = flyWas[i].relock; });

/* SELF-CHECK 2 — the target channel is the EVEN one and the speed channel the
   odd one, per line, proved by driving each alone. */
for(let i = 0; i < FLY.length; i++){
  const b = frame();
  for(let j = 0; j < FLY.length; j++) put(b, FLYB + j * 2 + 1, 255);   // every line free to move
  put(b, FLYB + i * 2, 255);                                          // this one to the grid
  w.artFlys(b);
  for(let j = 0; j < FLY.length; j++){
    const want = j === i ? P.OUT_TRIM : flyRows[j].lo;
    if(Math.abs(FLY[j].target - want) > 1e-6)
      throw new Error('SELF-CHECK 2 FAILED: channel ' + (FLYB + i * 2) + ' left line ' +
        FLY[j].id + ' at ' + f2(FLY[j].target) + 'm, expected ' + f2(want) +
        ' — the fly block is not where this map says');
  }
  const sb = frame();
  put(sb, FLYB + i * 2 + 1, 255);
  w.artFlys(sb);
  for(let j = 0; j < FLY.length; j++){
    const want = j === i ? P.ART_FLY_MAX : 0;
    if(Math.abs(FLY[j].artSpeed - want) > 1e-9)
      throw new Error('SELF-CHECK 2 FAILED: speed channel ' + (FLYB + i * 2 + 1) +
        ' gave line ' + FLY[j].id + ' ' + FLY[j].artSpeed + 'm/s, expected ' + want);
  }
  flyRestore();
}
/* the target range, measured per line at three bytes */
for(const r of flyRows){
  r.at = [];
  for(const v of [0, 128, 255]){
    const b = frame();
    for(let j = 0; j < FLY.length; j++) put(b, FLYB + j * 2 + 1, 255);
    put(b, FLYB + r.i * 2, v);
    w.artFlys(b);
    r.at.push(FLY[r.i].target);
  }
  flyRestore();
}
/* and what a speed byte of 0 does: the line is STOPPED WHERE IT STANDS */
const parkedProof = (()=>{
  const b = frame();
  for(let j = 0; j < FLY.length; j++){ put(b, FLYB + j * 2, 255); put(b, FLYB + j * 2 + 1, 0); }
  w.artFlys(b);
  const held = FLY.every((ls, i)=>Math.abs(ls.target - ls.pos) < 1e-9);
  flyRestore();
  return held;
})();

/* ---- 4: the traveler on THIS show's hang, and the speed-byte park ------- */
const travDriven = travelerNow();
const travParked = (()=>{
  const b = frame();
  for(let j = 0; j < FLY.length; j++) put(b, FLYB + j * 2 + 1, 0);      // every line parked
  put(b, SELB + 2, TRAV_BYTE);
  w.artFlys(b);
  const moved = FLY.filter((ls, i)=>ls.travTarget !== flyWas[i].travTarget).length;
  flyRestore();
  return moved === 0;
})();

/* ---- 5: the two banded channels ----------------------------------------- */
const bands = [];
for(let v = 0; v < 256; v++){
  const band = w.artBandOf(v);
  const last = bands[bands.length - 1];
  if(!last || last.band !== band) bands.push({from: v, to: v, band: band});
  else last.to = v;
}
const signX = (P.SHOW.flyExtras || []).find(x=>x.key === 'bjSign') || null;
const signStops = signX ? w.flyExtraStops(signX) : null;
const dressScene = P.SHOW.scenes.find(s=>s.dress && P.ART_HOUSES.every(k=>s.dress[k])) || null;

/* ---- 6: the set movers -------------------------------------------------- */
const mvWas = mvRows.map(r=>r.m.target);
const mvRestore = ()=>mvRows.forEach((r, i)=>{ r.m.target = mvWas[i]; });
/* what a byte MEANS, asked of artMoverSet itself rather than restated from
   RULING ET.  The sentinel answers the one question the ruling's wording and
   its successor disagree about: whether byte 0 is a command at all. */
for(const r of mvRows){
  r.at = {};
  for(const v of [0, 1, 128, 255]){
    r.m.target = SENTINEL;
    w.artMoverSet(r.m, v);
    r.at[v] = r.m.target;
  }
}
mvRestore();
const zeroIsNoCommand = mvRows.length ? mvRows.every(r=>r.at[0] === SENTINEL) : false;
const zeroIsHome = mvRows.length ? mvRows.every(r=>r.at[0] === r.home) : false;
if(!zeroIsNoCommand && !zeroIsHome)
  throw new Error('byte 0 is neither home nor a no-op on every mover — read artMoverSet ' +
                  'and say what it does; this probe will not guess');

/* SELF-CHECK 3 — every mover with a travel long enough to be told apart is
   driven ALONE, through artMovers, and must land where artMoverSet says. */
const mvUncheckable = [];
for(let k = 0; k < mvRows.length; k++){
  const r = mvRows[k];
  if(Math.abs(r.out - r.home) < 0.01){ mvUncheckable.push(r); continue; }
  const b = frame();
  put(b, r.ch, 255);
  mvRows.forEach(x=>{ x.m.target = SENTINEL; });
  w.artMovers(b);
  if(Math.abs(r.m.target - r.at[255]) > 1e-9)
    throw new Error('SELF-CHECK 3 FAILED: channel ' + r.ch + ' at 255 left ' + r.scene + ':' +
      r.part + ' at ' + f2(r.m.target) + 'm where its own record says ' + f2(r.at[255]));
  for(const x of mvRows){
    if(x === r) continue;
    const other = zeroIsNoCommand ? SENTINEL : x.home;
    if(Math.abs(x.m.target - other) > 1e-9)
      throw new Error('SELF-CHECK 3 FAILED: driving channel ' + r.ch + ' also moved ' +
        x.scene + ':' + x.part + ' to ' + f2(x.m.target) + 'm — the mover block is not ' +
        'in the order this map prints');
  }
}
mvRestore();

/* ---- 7: the caveat the code cannot state — a 40th lantern --------------- */
const flyBaseWith40 = (()=>{
  FIX.push({name: 'a lantern that is not there'});
  try{ return w.artFlyBase(); }
  finally{ FIX.pop(); }
})();

/* ---------------------------------------------------------------------------
   THE MAP.
   ------------------------------------------------------------------------- */
const L = [];
const out = s => L.push(s === undefined ? '' : s);

out('THE BUILT FILE  the-house.html  ' + fs.statSync(HOUSE_FILE).size +
    ' bytes  (generated by tools/artnet-map.js)');
out();
out('# Art-Net — the channel map                          RULING EO');
out();
out('**GENERATED. DO NOT EDIT.** `node tools/artnet-map.js > docs/ARTNET.md` rewrites');
out('this file, and `tests/artnet.js` fails if the committed text and the probe');
out('disagree. Every name, band, metre and channel number below was read off the');
out('BUILT `the-house.html` — booted under jsdom, driven with synthesised frames,');
out('and the answers copied down. Nothing here is typed from a table, because the');
out('rulings\' own prose has already been wrong about this data once.');
out();
out('The first line is the size of the built file this was read from: a probe that');
out('reads the BUILT artifact measures the last build, so an `src/`-only edit would');
out('otherwise leave the map describing bytes nobody is running.');
out();
out('Universe **0**, one universe, 512 channels, **the Palace only** (RULING EN). A');
out('desk patched to any other stage is received and ignored.');
out();
out('## Which show is loaded, and why it matters');
out();
out('This map was generated with **' + SHOW_KEY.toUpperCase() + ' loaded**. Two blocks below depend on that:');
out();
out('- **the set movers (310+)** — the block is derived every frame from `SHOW.scenes`,');
out('  and Beetlejuice is the only production that carries scene movers at all;');
out('- **the goods on each lineset (274..301)** — a production hangs its own cloths, so');
out('  the lineset LABELS are this show\'s. The channel numbers are not: they are');
out('  `FLY.length` and never move with a show.');
out();
out('The 273 light channels and the five house circuits are the same in every');
out('production, on the Palace.');
out();
out('## The blocks — every base is COMPUTED, never written down');
out();
out('| channels | what | how the base is reached | today |');
out('|---|---|---|---|');
out('| ' + FIXB + '..' + (FLYB - 1) + ' | ' + FIX.length + ' fixtures, ' + CH_FIX +
    ' channels each | `artFixBase()` | ' + FIXB + ' |');
out('| ' + FLYB + '..' + (HOUB - 1) + ' | ' + FLY.length +
    ' linesets, 2 each (target, speed) | `artFixBase() + ' + CH_FIX + ' * FIXTURES.length` | ' + FLYB + ' |');
out('| ' + HOUB + '..' + (HOUB + 4) + ' | the five house circuits | `artFlyBase() + 2 * FLY.length` | ' + HOUB + ' |');
out('| ' + SELB + ', ' + (SELB + 1) + ', ' + (SELB + 2) +
    ' | house selector, sign, traveler | `artHouseBase() + 5` | ' + SELB + ' |');
out('| ' + MVB + '..' + (MVB + mvRows.length - 1) + ' | the loaded show\'s set movers | `artSelBase() + 3` | ' + MVB + ' |');
out('| ' + (MVB + mvRows.length) + '..512 | nothing — unpatched | | |');
out();
out('A fortieth lantern moves every base after it by ' + CH_FIX + '. Measured, by pushing');
out('one onto `FIXTURES`: the fly block would start at **' + flyBaseWith40 + '** instead of ' + FLYB + '.');
out();

/* ---- the fixtures ------------------------------------------------------- */
out('## ' + FIXB + '..' + (FLYB - 1) + ' — the ' + FIX.length + ' fixtures (RULING EP)');
out();
out('One uniform ' + CH_FIX + '-channel footprint, so a desk needs exactly ONE generic');
out('fixture definition for the whole rig. The writes are RAW: every one of them zeroes');
out('the fixture\'s fade durations, so the desk\'s own fades stream through and the');
out('game\'s fade engine never fights them.');
out();
out('The seven, and what each one did when it was driven — the right-hand column is a');
out('count of records that MOVED under a byte of 255, across all ' + FIX.length + ' fixtures:');
out();
out('| offset | channel of fixture *n* | what it writes | what a byte of 255 moved |');
out('|---|---|---|---|');
const SLOT = ['intensity', 'red', 'green', 'blue', 'gobo', 'pan', 'tilt'];
const SLOT_WRITES = ['`f.level` = byte/255, `f.lvlDur` = 0',
                     '`f.color` red = byte/255, `f.colDur` = 0',
                     '`f.color` green = byte/255, `f.colDur` = 0',
                     '`f.color` blue = byte/255, `f.colDur` = 0',
                     '`f.gobo`, clamped to the gobo count',
                     '`f.panT` degrees — MOVERS ONLY',
                     '`f.tiltT` degrees — MOVERS ONLY'];
for(let s = 0; s < CH_FIX; s++){
  const m = slotEffect[s];
  const moved = [];
  if(m.level) moved.push(m.level + ' levels');
  if(m.colour) moved.push(m.colour + ' colours');
  if(m.gobo) moved.push(m.gobo + ' gobos');
  if(m.pan) moved.push(m.pan + ' pans');
  if(m.tilt) moved.push(m.tilt + ' tilts');
  out('| +' + s + ' | ' + (FIXB + s) + ', ' + (FIXB + CH_FIX + s) + ', ' + (FIXB + 2*CH_FIX + s) +
      ' ... | ' + SLOT_WRITES[s] + ' | ' + (moved.length ? moved.join(', ') : 'nothing') + ' |');
}
out();
out('Intensity is linear: byte ' + levelAt.map(x=>x.byte + ' -> ' + f2(x.level)).join(', '));
out('(measured). Colour the same, per component.');
out();
out('**Gobo** — the byte is divided down onto the ' + P.GOBOS.length +
    ' gobos, swept here byte by byte:');
out();
out('| bytes | gobo | name |');
out('|---|---|---|');
for(const g of goboBands)
  out('| ' + g.from + '..' + g.to + ' | ' + g.gobo + ' | ' + (goboName[g.gobo] || '?') + ' |');
out();
if(aMover){
  out('**Pan and tilt** — `ART_PAN` ' + P.ART_PAN + ', `ART_TILT_LO` ' + P.ART_TILT_LO +
      ', `ART_TILT_HI` ' + P.ART_TILT_HI + '.');
  out('Measured on ' + aMover.name + ':');
  out();
  out('| byte | pan | tilt |');
  out('|---|---|---|');
  out('| 0 | ' + f1(panAt.lo) + ' deg | ' + f1(tiltAt.lo) + ' deg |');
  out('| 128 | ' + f1(panAt.mid) + ' deg | ' + f1(tiltAt.mid) + ' deg |');
  out('| 255 | ' + f1(panAt.hi) + ' deg | ' + f1(tiltAt.hi) + ' deg |');
  out();
  out('Tilt is NOT symmetric and that is deliberate: `updateRig` poses a head as');
  out('`rotation.x = (tilt + 90) * DEG`, so ' + P.ART_TILT_LO + ' is straight up, the middle');
  out('of the fader is horizontal and ' + P.ART_TILT_HI + ' is straight down. A symmetric');
  out('range wasted half the channel.');
} else {
  out('**Pan and tilt** — NO FIXTURE IN THIS RIG MOVES, which is itself a finding.');
}
out();
const movers = fixRows.filter(r=>r.turns), fixed = fixRows.filter(r=>!r.turns);
out('**' + movers.length + ' of the ' + FIX.length + ' fixtures answer a pan or tilt byte.**');
out('Driven, not read off a flag — and the two answers were checked against each other:');
out();
out('- MOVERS, pan and tilt live:');
if(movers.length) for(const r of movers)
  out('  - ch ' + r.base + '..' + (r.base + CH_FIX - 1) + ' — ' + r.name);
else out('  - none, which would itself be a finding');
out('- FIXED, pan and tilt bytes ignored and the plotted aim left exactly where the plot');
out('  put it: the other ' + fixed.length + ' fixtures. The bytes are still THERE — a uniform');
out('  footprint is what makes ' + FIX.length + ' heads patchable by hand as one definition.');
out();
out('| ch | fixture | section | this channel |');
out('|---|---|---|---|');
for(const r of fixRows){
  const who = ('0' + (r.i + 1)).slice(-2) + ' ' + r.name + ' [' + r.type + ']';
  for(let s = 0; s < CH_FIX; s++){
    let what = SLOT[s];
    if(s >= 5) what += r.turns ? ' (live)' : ' (IGNORED — this lantern does not move)';
    out('| ' + (r.base + s) + ' | ' + who + ' | ' + r.section + ' | ' + what + ' |');
  }
}
out();

/* ---- the flys ----------------------------------------------------------- */
out('## ' + FLYB + '..' + (HOUB - 1) + ' — the ' + FLY.length + ' linesets, two channels each (RULING EQ)');
out();
out('Target first, then speed, in `FLY` order. A fly moves through its own motor and');
out('never teleports: the target goes through `flyTo`, which works the lock itself and');
out('CLAMPS, so a desk cannot drive a cloth through the stage any more than a cue can.');
out();
out('- **Target** (' + (FLYB % 2 === 0 ? 'the even channel today' : 'the odd channel today') +
    ') — byte 0 is `minTrimOf(ls)`, the lowest that line may come with what is hung on');
out('  it, and 255 is `OUT_TRIM` = ' + f2(P.OUT_TRIM) + 'm. Linear between; the middle');
out('  column below is byte 128, measured.');
out('- **Speed** (the next channel) — byte 0 is **PARKED**: the line is stopped where it');
out('  stands, whatever its target says, and 255 is `ART_FLY_MAX` = ' + f2(P.ART_FLY_MAX) + ' m/s.');
out('  Measured: with every speed byte at 0, ' + (parkedProof ? 'every line held its own position' :
    'A LINE STILL MOVED, which contradicts RULING EQ') + '.');
out();
out('| ch | lineset | goods | this channel |');
out('|---|---|---|---|');
for(const r of flyRows){
  const who = 'line ' + pad(r.id, 2);
  const goods = r.label + (r.key === 'none' ? '' : ' (`' + r.key + '`)') + (r.traveler ? ' — TRAVELER' : '');
  out('| ' + r.base + ' | ' + who + ' | ' + goods + ' | target: 0 = minTrimOf ' + f2(r.at[0]) +
      'm, 128 = ' + f2(r.at[1]) + 'm, 255 = OUT_TRIM ' + f2(r.at[2]) + 'm |');
  out('| ' + (r.base + 1) + ' | ' + who + ' | ' + goods + ' | speed: 0 = parked, 255 = ART_FLY_MAX ' +
      f2(P.ART_FLY_MAX) + ' m/s |');
}
out();

/* ---- the house circuits ------------------------------------------------- */
out('## ' + HOUB + '..' + (HOUB + 4) + ' — the house circuits');
out();
out('One byte each, `HOUSE.<circuit>` = byte/255. Driven one at a time here, so the');
out('order is the code\'s and not a list copied from the ruling.');
out();
out('| ch | circuit |');
out('|---|---|');
for(const h of houseChan) out('| ' + h.ch + ' | `HOUSE.' + h.key + '` |');
out();

/* ---- the three selector channels ---------------------------------------- */
out('## ' + SELB + ', ' + (SELB + 1) + ', ' + (SELB + 2) + ' — the selector channels');
out();
out('### ' + SELB + ' — the BEETLEJUICE house (RULING ER)');
out();
out('His bands exactly, swept out of `artBandOf` byte by byte:');
out();
out('| bytes | band | dressing |');
out('|---|---|---|');
for(const b of bands)
  out('| ' + b.from + '..' + b.to + ' | ' + b.band + ' | `' + (P.ART_HOUSES[b.band] || '?') + '` |');
out();
out('Applied by setting `sc.dressOn` and calling `bjRedress` — the show\'s own mechanism,');
out('which holds two of the three houses out of the graph (RULING CN). **On a band CHANGE');
out('only**: that call detaches and re-attaches scene-graph nodes and must not run 44');
out('times a second. ' + (dressScene ? 'The scene it dresses is `' + dressScene.name +
    '`, which is the one carrying all ' + P.ART_HOUSES.length + ' dressings.'
  : 'NO LOADED SCENE CARRIES ALL THREE DRESSINGS, so this channel does nothing right now.'));
out('A production with no such scenery ignores this channel entirely.');
out();
out('### ' + (SELB + 1) + ' — the BEETLEJUICE sign (RULING ES)');
out();
if(signStops){
  out('The same three splits, driving the sign\'s own named stops (RULING DH) through');
  out('`flyExtraToStop`, on a band change only:');
  out();
  out('| bytes | band | stop | offset |');
  out('|---|---|---|---|');
  for(const b of bands){
    const st = signStops[b.band];
    out('| ' + b.from + '..' + b.to + ' | ' + b.band + ' | ' +
        (st ? st.name : 'NO SUCH STOP — this band does nothing') + ' | ' +
        (st ? f2(st.off) + 'm' : '') + ' |');
  }
  out();
  out('The sign is hauled by the rail, not by a mover channel — see the mover block.');
} else {
  out('NO SIGN IS DECLARED BY THE LOADED SHOW, so this channel does nothing.');
}
out();
out('### ' + (SELB + 2) + ' — the traveler');
out();
out('0 = shut, 255 = open, written as `travTarget` on whichever lineset carries goods');
out('that declare themselves a traveler. WHICH LINE THAT IS was not counted off a list:');
out('the channel was driven half-open and the line that answered is the one named here.');
out();
if(travDriven){
  const row = flyRows[travDriven.i];
  out('- **Line ' + row.id + '**, carrying ' + row.label + ' (`' + row.key + '`). Its own');
  out('  target channel is ' + row.base + ' and its speed channel is ' + (row.base + 1) + '.');
} else {
  out('- NO LINE ANSWERED IT. Nothing hung on this rail declares itself a traveler, so');
  out('  channel ' + (SELB + 2) + ' does nothing in this production.');
}
out('- **AND IT IS A PROPERTY OF THE HANG, NOT OF THE RAIL.** Measured again before any');
out('  production was loaded, on the Palace\'s own standing hang, ' + (travBare
    ? 'it is **line ' + travBare.id + '** carrying ' + travBareGoods + ' (`' + travBare.key + '`)'
    : 'NO line carried it') + '.');
out('  ' + ((travBare && travDriven && travBare.i !== travDriven.i)
    ? 'A production that hangs its own show curtain therefore MOVES this channel\'s effect'
      : 'It is the same line either way today, and nothing guarantees it stays that way'));
out('  ' + ((travBare && travDriven && travBare.i !== travDriven.i)
    ? 'onto a different lineset — patch 309 against the show that is playing.'
      : '— patch ' + (SELB + 2) + ' against the show that is playing.'));
out('- **It is PARKED BY THAT LINE\'S OWN SPEED BYTE.** Measured: with every speed byte at');
out('  0, driving ' + (SELB + 2) + ' moved ' + (travParked ? 'nothing at all' :
    'the traveler anyway — which contradicts the note under RULING EO') + '.');
out('  Written unconditionally this was the one piece of scenery a dead universe DID move:');
out('  the house curtain ran itself shut at 0.42 m/s in front of the audience the instant');
out('  the switch went on with nothing patched. Patch that line\'s speed byte and ' + (SELB + 2));
out('  does exactly what the table says.');
out();

/* ---- the movers --------------------------------------------------------- */
out('## ' + MVB + '..' + (MVB + Math.max(0, mvRows.length - 1)) + ' — the set movers of ' +
    SHOW_KEY.toUpperCase() + ' (RULING ET)');
out();
out('`SHOW.scenes` in declaration order; inside a scene its whole-group travel `mv`');
out('first, then its part movers in declaration order. **One channel each and no speed');
out('channel** — speed was asked for on the flys only. The write is `m.target` and');
out('nothing else: the mover walks there at its own `m.speed` on the scene tick that');
out('already exists, so a desk move looks exactly like a cue move.');
out();
out('**Byte 0 is ' + (zeroIsNoCommand ? 'NO COMMAND — the target is not touched at all, and' :
    'the mover\'s HOME, and') + '**');
out((zeroIsNoCommand ? '**1..255 spans' : '**0..255 spans') + ' home to out.** That was not read out of the ruling:');
out('`artMoverSet` was called with a sentinel in `m.target` and the answer copied down —');
out('the metres in the table are the same measurement, per mover, per byte.');
out();
if(!zeroIsNoCommand){
  out('So an unpatched universe — 512 zeros, which is exactly what a desk patched only for');
  out('the ' + (FLYB - 1) + ' light channels sends — commands EVERY mover in the loaded show home.');
  out('RULING EQ\'s stated principle is that a dead universe moves no scenery, and the flys');
  out('and the traveler are parked by a speed byte; a set mover has none to be parked by.');
  out('That is the collision, printed rather than hidden.');
  out();
}
if(hauled.length){
  out('**Scenes the rail hauls are not on this map at all** (RULINGS CW, ES): ' +
      hauled.map(n=>'`' + n + '`').join(', ') + '.');
  out('That scenery is addressed by channel ' + (SELB + 1) + ', which writes on a band change only —');
  out('and this block writes EVERY FRAME. A mover channel there would not merely duplicate');
  out((SELB + 1) + ', it would make it dead on arrival: the stop lands and the next packet hauls');
  out('it back.');
  out();
}
/* THE NEAR END GETS ITS OWN COLUMN WHEN BYTE 0 STOPS BEING A POSITION.  With
   RULING EX in the build, printing only bytes 0 and 255 says "no command" and
   the far end and NOWHERE says where the mover starts — an operator would
   have the top of every fader's travel and not the bottom.  Byte 1 is the
   bottom, and it is measured off artMoverSet like every other cell here. */
out('| ch | scene | mover | axis | byte 0 |' + (zeroIsNoCommand ? ' byte 1 |' : '') +
    ' byte 255 | out declared |');
out('|---|---|---|---|---|' + (zeroIsNoCommand ? '---|' : '') + '---|---|');
for(const r of mvRows)
  out('| ' + r.ch + ' | ' + r.scene + ' | ' + r.part + ' | ' + r.axis + ' | ' +
      (r.at[0] === SENTINEL ? 'no command' : f2(r.at[0]) + 'm') + ' | ' +
      (zeroIsNoCommand ? f2(r.at[1]) + 'm | ' : '') + f2(r.at[255]) + 'm | ' +
      (r.declaresOut ? 'yes, ' + f2(r.out) + 'm' : 'NO — so 255 is 0 on its own axis') + ' |');
out();
if(mvUncheckable.length){
  out('**' + mvUncheckable.length + ' of these is ONE-WAY, and it is not a fault in the block:**');
  out(mvUncheckable.map(r=>r.ch + ' `' + r.scene + ':' + r.part + '` (' +
      f2(r.home) + 'm -> ' + f2(r.out) + 'm)').join(', ') + '. A whole-group travel declares no');
  out('`out`, so where its home is 0 the whole of its range is 0.');
  if(zeroIsNoCommand){
    out('**It is not inert and calling it dead would be the more dangerous mistake:** every byte');
    out('from 1 to 255 commands that set HOME, and no byte sends it back out. If it is flown or');
    out('parked when you touch that fader it comes in, and the desk cannot put it back. Hold any');
    out('non-zero byte and nothing else may move that scene either, because this block writes');
    out('every frame. Byte 0 leaves it entirely alone (RULING EX), so an unpatched universe');
    out('cannot reach it at all.');
  } else {
    out('Dead is not inert: while a desk drives, that channel writes its one value every frame,');
    out('so nothing else may move that scene either.');
  }
  out('Self-check 3 drives every OTHER mover alone and proves its channel;');
  out('these are the ones no measurement can tell apart, so they are named rather than');
  out('quietly asserted.');
  out();
}
out('The block is derived EVERY FRAME, so loading another show re-bases it for free — and');
out('a production with no scene movers leaves ' + MVB + ' onwards doing nothing at all.');
out();

/* ---- the two things the code cannot say --------------------------------- */
out('## Two things the code cannot tell you');
out();
out('**1. "Even channel is target, odd is speed" is TRUE TODAY AND IS NOT A RULE.** The fly');
out('block starts at ' + FLYB + ' because the Palace patch is ' + FIX.length + ' fixtures of ' + CH_FIX +
    ' channels, and ' + FLYB + ' is even —');
out('so every target lands on an even channel. The bases are COMPUTED, never written down,');
out('which is the point: a literal would silently repoint every channel after a rig change.');
out('Add a fortieth lantern and the block starts at **' + flyBaseWith40 + '** — measured above — and every');
out('fly TARGET is then on an ODD channel. Patch off this file, never off the parity.');
out();
out('**2. `sc.mv` records carry no `group` field and `sc.pmv` records do.** Anything walking');
out('the mover block that wants the moving GROUP has to take it from the SCENE for a');
out('whole-group travel and from the RECORD for a part. Measured on this show: ' +
    mvRows.filter(r=>r.hasGroup).length + ' of the ' + mvRows.length + ' mover');
out('records carry a `group`, and they are exactly the ' +
    mvRows.filter(r=>r.part !== 'mv').length + ' part movers.');
out();
out('## The suite\'s check');
out();
out('`tests/artnet.js` runs this probe and compares its output with this file **from the');
out('second line down**. The first line is the built file\'s byte size, which changes on');
out('every build — comparing it would fail this suite for a change in any part of the');
out('game, teaching everyone to regenerate the map without reading the diff. It carries no');
out('channel information, so excluding it costs the check nothing; the suite asserts its');
out('SHAPE instead, on both sides, so the line cannot be quietly dropped or widened.');
out();

process.stdout.write(L.join('\n') + '\n');
