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
   read, and the suite COMPARES it — the committed number and the probe's own
   must agree, or the map was generated against a different build.  It used to
   be the one line nobody diffed, which meant the one number in this file that
   nothing verified; the reasoning either way is written down in
   tests/artnet.js beside the assertion.  It still does NOT catch a stale
   BUILD: an src-only edit leaves a stale the-house.html, this probe reads it,
   the suite stats the same stale file, and everything agrees.  `sh build.sh`
   first, always.

   NOTHING BELOW IS TYPED FROM A TABLE.  The rulings' own prose has already
   been wrong about this data once — RULING ET says "the attic tracking in
   from x -14.20" where the built record reads home 0, out -19.50 — so every
   name, band, metre and channel number here is either read off a live record
   or MEASURED by calling the game's own apply functions with a synthesised
   frame and reading what moved.  THE WHOLE WARRANT OF RULING EO IS THAT THIS
   FILE MEASURES RATHER THAN RESTATES: a block that re-indexes the same consts
   the game indexes, in the order this file believes the game uses, is a table
   with a script in front of it and would survive the mutation it exists to
   catch.  So `artLights`, `artFlys`, `artMovers`, `artMoverSet` AND `artBands`
   are all called, and what moved is written down.  Where a claim could
   disagree with the code, these throw:

     1  every fixture's intensity channel is found by driving that ONE byte
        and watching exactly one fixture light; and each of the seven offsets
        must move exactly ONE property of the record, which is where the
        offset gets the name printed against it (a red/blue swap in artLights
        moves the names, not just the numbers)
     2  every lineset's target and speed channels the same way; and the
        traveler channel is checked against the linesets whose goods DECLARE
        `traveler`, because artFlys resolves it with findIndex and would drive
        only the first of two silently
     3  every set mover's channel the same way, for every mover whose travel
        is long enough to be told apart (the degenerate ones are named), plus
        a sentinel check: a mover artMoverSet returned early on keeps the
        sentinel, and a comparison would then pass by agreeing with itself

   WHAT THIS PROBE CANNOT MEASURE, AND SAYS SO IN THE OUTPUT.  jsdom fetches
   nothing, so every set here is the BUILT STAND-IN.  `bjWingPack` re-measures
   each wing set's box and rewrites `out` on its movers when one of Jack's
   model files lands in a real browser, and the map names the channels that
   changes — measured, by poisoning every `out` and running the pack.

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
       ' GOBO_NAMES:GOBO_NAMES, GOBOS:GOBOS, STAGE:STAGE, ART:ART};');

const P = w.__P;
for(const k of ['FIXTURES','FLY','GOODS','SECTIONS','SHOW','HOUSE','OUT_TRIM',
                'ART_CH_FIX','ART_PAN','ART_TILT_LO','ART_TILT_HI','ART_FLY_MAX',
                'ART_HOUSES','GOBO_NAMES','GOBOS','STAGE','ART'])
  if(P[k] === undefined) throw new Error('the probe cannot see ' + k + ' — add it to the __P handout');
for(const fn of ['artFixBase','artFlyBase','artHouseBase','artSelBase','artMoverBase',
                 'artBandOf','artLights','artFlys','artMovers','artMoverSet','artMoverOut',
                 'artMoverHauled','artBands','artSign','artSignRange',
                 'minTrimOf','showLoad','flyExtraStops',
                 'flyExtraMover','flyTo','updateFly','bjRedress','bjWingPack'])
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
   traveler at all (every curtain in the building was shut).

   TWO BYTES, NOT ONE, and that is the same trap one step further out: 128 is
   half-open only if the line is not ALREADY sitting at 128/255.  Nothing
   stops a saved hang or a cue from leaving it exactly there, and the failure
   would read as "no line answered it" — a confident wrong answer, which is
   the one thing this file may not print.  If the first byte moves nothing the
   second is tried before that conclusion is reached. */
const TRAV_BYTES = [128, 200];
const flySnapOf = ()=>FLY.map(ls=>({target: ls.target, pos: ls.pos, artSpeed: ls.artSpeed,
                                    travTarget: ls.travTarget, locked: ls.locked, relock: ls.relock}));
const flyPutBack = was=>FLY.forEach((ls, i)=>{ ls.target = was[i].target; ls.pos = was[i].pos;
  ls.artSpeed = was[i].artSpeed; ls.travTarget = was[i].travTarget;
  ls.locked = was[i].locked; ls.relock = was[i].relock; });
/* THE LINESETS WHOSE GOODS DECLARE THEMSELVES A TRAVELER, counted off FLY and
   GOODS directly.  Counting the lines that ANSWERED cannot fail — artFlys
   resolves the traveler with `FLY.findIndex` and writes exactly one
   `travTarget`, so that count is 0 or 1 by construction, and the case worth
   catching is the opposite one: a hang with TWO declaring linesets, where the
   code drives the FIRST and says nothing about the other.  p2i's own comment
   ("a show can hang its own") says the game contemplates more than one. */
function travelersDeclared(){
  return FLY.map((ls, i)=>({i: i, id: ls.id, key: ls.goodsKey}))
            .filter(x=>FLY[x.i].goods && P.GOODS[FLY[x.i].goodsKey] &&
                       P.GOODS[FLY[x.i].goodsKey].traveler);
}
function travelerNow(where){
  const declared = travelersDeclared();
  if(declared.length > 1)
    throw new Error('SELF-CHECK 2 FAILED: ' + declared.length + ' linesets on ' + where +
      ' hang goods that declare themselves a traveler (lines ' + declared.map(x=>x.id).join(', ') +
      ') — artFlys takes FLY.findIndex and would drive line ' + declared[0].id +
      ' alone, so channel ' + (SELB + 3) + ' cannot be printed as belonging to one line');
  const was = flySnapOf();
  let hit = null, usedByte = null;
  for(const byte of TRAV_BYTES){
    const b = frame();
    for(let j = 0; j < FLY.length; j++) put(b, FLYB + j * 2 + 1, 255);   // every line driven
    put(b, SELB + 3, byte);
    w.artFlys(b);
    const moved = FLY.map((ls, i)=>({i: i, id: ls.id, key: ls.goodsKey}))
                     .filter(x=>FLY[x.i].travTarget !== was[x.i].travTarget);
    flyPutBack(was);
    if(moved.length > 1)
      throw new Error('SELF-CHECK 2 FAILED: channel ' + (SELB + 3) + ' moved ' + moved.length +
        ' travelers on ' + where + ' — the map claims it belongs to exactly one line');
    if(moved.length === 1){ hit = moved[0]; usedByte = byte; break; }
  }
  /* the two answers, checked against each other rather than one of them
     printed and the other trusted */
  if(declared.length === 1 && !hit)
    throw new Error('SELF-CHECK 2 FAILED: line ' + declared[0].id + ' on ' + where +
      ' hangs goods that declare `traveler` and no byte on channel ' + (SELB + 3) +
      ' moved it — the channel and the declaration disagree');
  if(!declared.length && hit)
    throw new Error('SELF-CHECK 2 FAILED: channel ' + (SELB + 3) + ' moved line ' + hit.id +
      ' on ' + where + ' and no lineset there declares a traveler');
  if(hit && declared.length && hit.i !== declared[0].i)
    throw new Error('SELF-CHECK 2 FAILED: channel ' + (SELB + 3) + ' moved line ' + hit.id +
      ' on ' + where + ' and the declaring lineset is line ' + declared[0].id);
  return hit ? Object.assign({byte: usedByte}, hit) : null;
}
const travBare = travelerNow('the Palace\'s standing hang');
const travBareGoods = travBare ? (P.GOODS[travBare.key] || {}).label : null;

/* THE RIG AND THE HOUSE CIRCUITS ARE THE STAGE'S, NOT THE SHOW'S — and this
   file used to say so as reasoning rather than as a reading.  A signature of
   the light block is taken here, before any production exists, and again
   after one is loaded; the two are compared below and the answer printed.  It
   is two shows, not five, and the output says that too. */
const lightSig = ()=>JSON.stringify({
  fixBase: w.artFixBase(), chFix: CH_FIX, flyBase: w.artFlyBase(), houseBase: w.artHouseBase(),
  fixtures: FIX.map(f=>[f.ch, f.name, f.type, !!f.mover]),
  circuits: Object.keys(P.HOUSE)});
const lightSigBare = lightSig();

/* WHICH SHOW IS LOADED CHANGES THIS FILE, so the choice is made here and said
   out loud in the output.  Beetlejuice is the only production carrying set
   movers at all (RULING ET is for it), and it is also the show whose own
   goods hang on the fly rail — so the mover block and the lineset labels both
   come from it. */
const SHOW_KEY = 'beetlejuice';
if(!w.showLoad(SHOW_KEY)) throw new Error('the probe could not load ' + SHOW_KEY);
pump(4);
const lightSigLoaded = lightSig();
const lightBlockMoved = lightSigBare !== lightSigLoaded;

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
                      r:f.color.r, g:f.color.g, b:f.color.b,
                      lvlDur:f.lvlDur, colDur:f.colDur}));
}
/* THE RIG'S OWN LOOK, TAKEN BEFORE ANY OF IT IS DRIVEN AND PUT BACK AFTER.
   The sweeps below leave all 39 fixtures dark, black, gobo 0 and every house
   circuit at zero.  Nothing printed after them reads a fixture or HOUSE today
   — which is exactly the kind of "harmless" that stops being harmless the day
   somebody adds a pump() here, and then every later measurement is taken on a
   blacked-out rig with no error anywhere. */
const fixWas = fixSnap();
const houseKeys = Object.keys(P.HOUSE);
const houseWas = {};
for(const k of houseKeys) houseWas[k] = P.HOUSE[k];
function rigPutBack(){
  FIX.forEach((f, i)=>{ const s = fixWas[i];
    f.level = s.level; f.gobo = s.gobo; f.panT = s.panT; f.tiltT = s.tiltT;
    f.lvlDur = s.lvlDur; f.colDur = s.colDur; f.color.setRGB(s.r, s.g, s.b); });
  for(const k of houseKeys) P.HOUSE[k] = houseWas[k];
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

/* THE SEVEN OFFSETS, AND WHAT EACH ONE IS CALLED, MEASURED.  Red, green and
   blue used to be typed into a string array here and then folded into ONE
   `colour` counter, so swapping red and blue inside artLights produced a
   byte-identical map — the block that names three channels could not tell
   them apart.  Every component is counted separately now, and the NAME each
   offset is printed under is the name of the one record field that answered
   it.  Move a component in artLights and the names move with it. */
const zero = frame();
const FIELDS = ['level', 'r', 'g', 'b', 'gobo', 'panT', 'tiltT'];
const FIELD_LABEL = {level:'intensity', r:'red', g:'green', b:'blue',
                     gobo:'gobo', panT:'pan', tiltT:'tilt'};
const FIELD_PLURAL = {level:'levels', r:'reds', g:'greens', b:'blues',
                      gobo:'gobos', panT:'pans', tiltT:'tilts'};
const FIELD_WRITE = {
  level: '`f.level` = byte/255, `f.lvlDur` = 0',
  r:     '`f.color` red = byte/255, `f.colDur` = 0',
  g:     '`f.color` green = byte/255, `f.colDur` = 0',
  b:     '`f.color` blue = byte/255, `f.colDur` = 0',
  gobo:  '`f.gobo`, clamped to the gobo count',
  panT:  '`f.panT` degrees',
  tiltT: '`f.tiltT` degrees'};
const slotEffect = [];
for(let s = 0; s < CH_FIX; s++){
  w.artLights(zero);
  const dark = fixSnap();
  const b = frame();
  for(let i = 0; i < FIX.length; i++) put(b, FIXB + i * CH_FIX + s, 255);
  w.artLights(b);
  const now = fixSnap();
  const moved = {};
  for(const k of FIELDS) moved[k] = 0;
  for(let i = 0; i < FIX.length; i++)
    for(const k of FIELDS) if(now[i][k] !== dark[i][k]) moved[k]++;
  slotEffect.push(moved);
}
w.artLights(zero);
/* SELF-CHECK 1 — one fixture channel is one property of the record. */
const slotField = slotEffect.map((m, s)=>{
  const ks = FIELDS.filter(k=>m[k]);
  if(ks.length !== 1)
    throw new Error('SELF-CHECK 1 FAILED: offset +' + s + ' (channel ' + (FIXB + s) +
      ') moved ' + (ks.length ? ks.map(k=>FIELD_LABEL[k]).join(' and ') : 'nothing at all') +
      ' — one fixture channel is one property, and this map names each offset after ' +
      'the property that answered it');
  return ks[0];
});
function slotOf(field){
  const s = slotField.indexOf(field);
  if(s < 0)
    throw new Error('SELF-CHECK 1 FAILED: no fixture channel writes ' + FIELD_LABEL[field] +
      ' — the seven offsets measured as ' + slotField.map(k=>FIELD_LABEL[k]).join(', '));
  return s;
}
/* AND THE FADE DURATIONS ARE ZEROED, measured rather than asserted from
   RULING EP's prose: every duration is set to nine seconds first, one frame
   is applied, and what is left at zero is counted. */
const durProof = (()=>{
  for(const f of FIX){ f.lvlDur = 9; f.colDur = 9; }
  const b = frame();
  for(let i = 0; i < FIX.length; i++) put(b, FIXB + i * CH_FIX, 128);
  w.artLights(b);
  return {lvl: FIX.filter(f=>f.lvlDur === 0).length,
          col: FIX.filter(f=>f.colDur === 0).length};
})();

/* WHICH LANTERNS ACTUALLY TURN.  Not read off `f.mover` and printed as though
   it had been measured: the pan and tilt bytes are driven and the records
   that answered are the movers. */
const PAN_S = slotOf('panT'), TILT_S = slotOf('tiltT');
const ptAt = v=>{ const b = frame();
  for(let i = 0; i < FIX.length; i++){ put(b, FIXB + i*CH_FIX + PAN_S, v); put(b, FIXB + i*CH_FIX + TILT_S, v); }
  w.artLights(b); return fixSnap(); };
const turnedHi = ptAt(255), turnedLo = ptAt(0), turnedMid = ptAt(128);
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
  put(b, FIXB + slotOf('gobo'), v);
  w.artLights(b);
  const g = FIX[0].gobo;
  const last = goboBands[goboBands.length - 1];
  if(!last || last.gobo !== g) goboBands.push({from: v, to: v, gobo: g});
  else last.to = v;
}
const goboName = {};
for(const k in P.GOBO_NAMES) goboName[P.GOBO_NAMES[k]] = k;

/* THE INTENSITY AND COLOUR RAMPS, EACH BYTE DRIVEN ALONE AND THE MATCHING
   COMPONENT READ BACK.  The old version drove all four bytes together and
   read `level` and `r` — which cannot tell red from blue, and printed only
   the level anyway, leaving "colour the same, per component" as the one
   sentence in this block that was neither measured nor shown. */
const rampOf = field=>{
  const s = slotOf(field);
  return [0, 128, 255].map(v=>{
    const b = frame();
    put(b, FIXB + s, v);
    w.artLights(b);
    const f = FIX[0];
    return {byte: v, val: field === 'level' ? f.level
                        : field === 'r' ? f.color.r : field === 'g' ? f.color.g : f.color.b};
  });
};
const rampAt = {level: rampOf('level'), r: rampOf('r'), g: rampOf('g'), b: rampOf('b')};
w.artLights(zero);

/* ---- 2: the house circuits, in the order the code writes them -----------
   Each one is driven from a MEASURED floor — a frame of zeros is applied and
   the five circuits read back — rather than from whatever the house happened
   to be at, so a circuit that was already up cannot hide by not changing. */
const houseChan = [];
for(let s = 0; s < 5; s++){
  w.artLights(zero);
  const before = {};
  for(const k of houseKeys) before[k] = P.HOUSE[k];
  const b = frame();
  put(b, HOUB + s, 255);
  w.artLights(b);
  const hit = houseKeys.filter(k=>P.HOUSE[k] !== before[k] && P.HOUSE[k] === 1);
  if(hit.length !== 1)
    throw new Error('SELF-CHECK 1 FAILED: channel ' + (HOUB + s) + ' moved ' + hit.length +
      ' house circuits [' + hit.join(',') + '] — one channel is one circuit');
  houseChan.push({ch: HOUB + s, key: hit[0]});
}
/* and the rig and the house go back to the look they were found in */
rigPutBack();

/* ---- 3: the flys, both channels, one line at a time --------------------- */
const flyWas = flySnapOf();
const flyRestore = ()=>flyPutBack(flyWas);

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
/* AND WHAT A SPEED BYTE OF 0 DOES: THE LINE IS STOPPED WHERE IT STANDS.
   THE SETUP HAS TO CREATE THE THING BEING PROVED, or the proof is of the
   setup.  At the restore point every line is standing AT its own target, so
   `|target - pos| < 1e-9` is already true of all fourteen and a version that
   simply sent speed 0 and asserted it passed with `ls.target = ls.pos` cut
   clean out of artFlys.  So each line is first driven off its position
   through the game's own `flyTo` — mid-travel, target far from pos, which is
   the state RULING EQ's stop exists for — and only THEN parked. */
const parkedProof = (()=>{
  const away = [];
  for(let i = 0; i < FLY.length; i++){
    const ls = FLY[i], lo = flyRows[i].lo;
    const far = Math.abs(P.OUT_TRIM - ls.pos) >= Math.abs(lo - ls.pos) ? P.OUT_TRIM : lo;
    w.flyTo(ls, far);
    if(Math.abs(ls.target - ls.pos) > 0.01) away.push(ls.id);
  }
  const b = frame();
  for(let j = 0; j < FLY.length; j++){ put(b, FLYB + j * 2, 255); put(b, FLYB + j * 2 + 1, 0); }
  w.artFlys(b);
  const still = FLY.filter(ls=>Math.abs(ls.target - ls.pos) >= 1e-9).map(ls=>ls.id);
  flyRestore();
  return {away: away.length, still: still};
})();

/* ---- 4: the traveler on THIS show's hang, and the speed-byte park ------- */
const travDriven = travelerNow('the ' + SHOW_KEY.toUpperCase() + ' hang');
/* driven with the byte that DID move it above — a park proved with a byte the
   field already holds proves nothing at all */
const travParked = travDriven ? (()=>{
  const b = frame();
  for(let j = 0; j < FLY.length; j++) put(b, FLYB + j * 2 + 1, 0);      // every line parked
  put(b, SELB + 3, travDriven.byte);
  w.artFlys(b);
  const moved = FLY.filter((ls, i)=>ls.travTarget !== flyWas[i].travTarget).length;
  flyRestore();
  return moved === 0;
})() : null;

/* HOW FAST A TRAVELER DRAWS, measured off one frame of the game's own
   `updateFly` rather than copied out of the spec — where it had picked up a
   unit it does not have.  `ls.open` is a FRACTION of the full draw, not
   metres, so the rate is per-second of that fraction; the metres are taken
   off the panels themselves, which is the number an operator would see. */
const travRate = travDriven ? (()=>{
  const ls = FLY[travDriven.i];
  const was = flySnapOf();
  const extra = FLY.map(l=>({open: l.open, moving: l.moving, flyVel: l.flyVel, runaway: l.runaway}));
  const panels = (ls.goods ? ls.goods.children : [])
                   .filter(c=>c.userData && c.userData.side !== undefined);
  /* hold every line where it stands, so the only thing one frame can move is
     the traveler's own draw */
  FLY.forEach(l=>{ l.target = l.pos; l.runaway = false; l.relock = false; });
  ls.open = 0; ls.travTarget = 0;
  w.updateFly(0);                                   // seat the panels at shut
  const x0 = panels.map(c=>c.position.x);
  ls.travTarget = 1;
  w.updateFly(1);                                   // one second of asking it open
  const rate = ls.open;
  const metres = panels.reduce((m, c, i)=>Math.max(m, Math.abs(c.position.x - x0[i])), 0);
  flyPutBack(was);
  FLY.forEach((l, i)=>{ l.open = extra[i].open; l.flyVel = extra[i].flyVel;
    l.runaway = extra[i].runaway; });
  w.updateFly(0);                                   // re-seat the geometry off the restored numbers
  flyPutBack(was);
  FLY.forEach((l, i)=>{ l.moving = extra[i].moving; });
  return {rate: rate, metres: metres, panels: panels.length};
})() : null;

/* ---- 5: the two banded channels, DRIVEN THROUGH artBands ----------------
   The splits themselves come out of `artBandOf`, swept byte by byte.  What
   each band then DOES is the part this file used to restate: it re-indexed
   `ART_HOUSES[band]` and `signStops[band]` the way its author believed
   artBands worked, and never called artBands at all — so swapping 307 and
   308, reversing the dressings, or nailing the sign to stop 0 each produced a
   byte-identical map.  Both tables are now read back off the stage.

   TWO THINGS MAKE THAT AWKWARD AND NEITHER IS OPTIONAL.  The channels write
   on a band CHANGE only (RULINGS ER, ES), so stepping the byte inside one
   band does nothing and the band memory has to be cleared between readings;
   and `bjRedress` really detaches and re-attaches scene-graph nodes, so
   everything touched here is put back at the end. */
const bands = [];
for(let v = 0; v < 256; v++){
  const band = w.artBandOf(v);
  const last = bands[bands.length - 1];
  if(!last || last.band !== band) bands.push({from: v, to: v, band: band});
  else last.to = v;
}
const signX = (P.SHOW.flyExtras || []).find(x=>x.key === 'bjSign') || null;
const signStops = signX ? w.flyExtraStops(signX) : null;
const signMv = signX ? w.flyExtraMover(signX) : null;

const DRESS_NOBODY = '(nothing wrote this)';
const SIGN_NOBODY = -98765;
const dressScenes = (P.SHOW.scenes || []).filter(s=>s.dress);
const bandWas = {
  dress: dressScenes.map(s=>s.dressOn),
  pend: P.SHOW.pendDress,
  sign: signMv ? {target: signMv.target, off: signMv.off, speed: signMv.speed,
                  artSpeed: signMv.artSpeed} : null,
  art: {bandSc: P.ART.bandSc, houseBand: P.ART.houseBand}
};
function bandFrame(v307){
  const b = frame();
  put(b, SELB, v307);
  return b;
}
/* RULING EZ - the sign is two channels of its own now, driven through artSign */
function signFrame(tv, sv){
  const b = frame();
  put(b, SELB + 1, tv); put(b, SELB + 2, sv);
  return b;
}
/* drive 307 at one byte and read back WHICH scene took WHICH dressing.  Every
   dressable scene is stamped with a value no dressing key can equal first, so
   the scene that comes back stamped is the one artBands did not write. */
function driveHouse(byte){
  for(const s of dressScenes) s.dressOn = DRESS_NOBODY;
  P.ART.bandSc = null; P.ART.houseBand = -1;         // make the band say itself again
  w.artBands(bandFrame(byte));
  const wrote = dressScenes.filter(s=>s.dressOn !== DRESS_NOBODY);
  return {n: wrote.length, scene: wrote.length ? wrote[0].name : null,
          dress: wrote.length ? wrote[0].dressOn : null, sc: wrote[0] || null};
}
/* RULING EZ — drive the sign's TARGET channel at one byte, with a speed byte
   alongside, and read back the metre it was COMMANDED to and the speed it was
   given.  Both come out of `artSign` itself; nothing here restates the range,
   which is the whole warrant for this file. */
function driveSign(byte, sp){
  if(!signMv) return {target: null, stop: -1, speed: null};
  signMv.target = SIGN_NOBODY;
  signMv.artSpeed = SIGN_NOBODY;
  w.artSign(signFrame(byte, sp === undefined ? 255 : sp));
  const t = signMv.target;
  if(t === SIGN_NOBODY) return {target: null, stop: -1, speed: null};
  let stop = -1;
  /* 0.005m, not 1e-6: a stop is reachable if a BYTE lands on it, and 255
     steps across an 11.36m travel is 4.5cm a byte. An exact-equality test
     would report every named stop unreachable and be believed. */
  if(signStops) for(let i = 0; i < signStops.length; i++)
    if(Math.abs(t - signStops[i].off) < 0.005){ stop = i; break; }
  return {target: t, stop: stop,
          speed: signMv.artSpeed === SIGN_NOBODY ? null : signMv.artSpeed};
}
/* the byte that lands nearest each declared stop, computed off the MEASURED
   ends rather than off artSignRange, so the two have to agree */
function signByteFor(off, lo, hi){
  if(!(hi - lo)) return null;
  return Math.round(((off - lo) / (hi - lo)) * 255);
}
/* every band, at BOTH ends of its byte range, so a boundary that disagreed
   with artBandOf would show up as two different answers inside one band */
const houseBands = bands.map(bd=>{
  const ends = [bd.from, bd.to].map(v=>Object.assign({byte: v}, driveHouse(v)));
  return {band: bd.band, from: bd.from, to: bd.to, ends: ends,
          same: ends[0].dress === ends[1].dress && ends[0].scene === ends[1].scene,
          scene: ends[0].scene, dress: ends[0].dress, n: ends[0].n};
});
/* RULING EZ — the sign's own travel, measured at the two ends and the middle,
   plus the byte each declared stop answers to, plus the two things that make
   it a FLY: a speed byte of 0 writes nothing at all, and 255 is the haul's own
   declared speed. */
const signDrive = signMv ? (()=>{
  const lo = driveSign(0).target, hi = driveSign(255).target;
  const mid = driveSign(128).target;
  const parked = (()=>{ const r = driveSign(255, 0); return r.target === null; })();
  const full = driveSign(255).speed;
  const half = driveSign(255, 128).speed;
  const stops = (signStops || []).map(s=>({name: s.name, off: s.off,
                  byte: signByteFor(s.off, lo, hi),
                  hits: Math.abs((driveSign(signByteFor(s.off, lo, hi)).target) - s.off) < 0.005}));
  return {lo: lo, hi: hi, mid: mid, parked: parked, full: full, half: half,
          declared: signX ? signX.speed : null, stops: stops};
})() : null;
/* SELF-CHECK 4 — the sign must be a real travel driven by a real speed byte.
   Every one of these can fail: a build that dropped the parked branch, one
   that wrote `speed` instead of `artSpeed`, one that used inOff/outOff (which
   would put the floor out of reach), or one whose range collapsed. */
if(signDrive){
  if(!(Math.abs(signDrive.hi - signDrive.lo) > 0.5))
    throw new Error('SELF-CHECK 4 FAILED: the sign channel spans ' +
      (signDrive.hi - signDrive.lo).toFixed(3) + 'm — that is not a travel');
  if(!signDrive.parked)
    throw new Error('SELF-CHECK 4 FAILED: a speed byte of 0 still commanded the sign');
  if(!(signDrive.full > 0) || Math.abs(signDrive.full - signDrive.declared) > 1e-6)
    throw new Error('SELF-CHECK 4 FAILED: speed 255 gave ' + signDrive.full +
      ', not the haul\'s declared ' + signDrive.declared);
  if(Math.abs(signDrive.half - signDrive.declared * (128 / 255)) > 1e-6)
    throw new Error('SELF-CHECK 4 FAILED: the speed byte does not scale');
  for(const s of signDrive.stops)
    if(!s.hits)
      throw new Error('SELF-CHECK 4 FAILED: no byte reaches the stop ' + s.name +
        ' at ' + s.off.toFixed(2) + 'm — RULING EZ says all three are reachable');
}
/* AND "ON A BAND CHANGE ONLY" IS ITSELF MEASURED: hold the same byte with the
   memory left alone and nothing may be written a second time. */
const changeOnly = (()=>{
  const top = bands[bands.length - 1];
  let house = null, sign = null;
  const h = driveHouse(top.from);
  if(h.sc){ h.sc.dressOn = DRESS_NOBODY;
    w.artBands(bandFrame(top.from));             // same byte, memory untouched
    house = h.sc.dressOn === DRESS_NOBODY; }
  /* RULING EZ - the sign is no longer band-change-only; it is a per-frame
     fly write like every other, so there is nothing change-only left to
     measure on it and saying otherwise would be the file restating a rule
     the code stopped having. */
  return {house: house, sign: null};
})();
/* put the stage back: the dressing through the show's own mechanism, the
   sign's mover by hand, and the band memory to what it was */
dressScenes.forEach((s, i)=>{ s.dressOn = bandWas.dress[i]; w.bjRedress(s); });
P.SHOW.pendDress = bandWas.pend;
if(signMv && bandWas.sign){ signMv.target = bandWas.sign.target; signMv.off = bandWas.sign.off;
                            signMv.speed = bandWas.sign.speed; }
P.ART.bandSc = bandWas.art.bandSc; P.ART.houseBand = bandWas.art.houseBand;
if(signMv) signMv.artSpeed = bandWas.sign ? bandWas.sign.artSpeed : undefined;

const dressScene = houseBands.find(h=>h.scene) || null;

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
/* THE SENTINEL IS ONLY A MEASUREMENT WHILE SOMETHING WRITES OVER IT.  -12345
   can never come out of the metre arithmetic, so it cannot collide — but
   `artMoverSet` RETURNS EARLY on a mover whose `home` is not finite, and then
   the sentinel is still sitting in `m.target` when self-check 3 compares
   m.target with r.at[255]: SENTINEL === SENTINEL, the check passes, and the
   table prints -12345.00m as a metre.  Every non-zero byte has to have
   written something before any of that is believed. */
for(const r of mvRows) for(const v of [1, 128, 255])
  if(r.at[v] === SENTINEL)
    throw new Error('artMoverSet wrote nothing into ' + r.scene + ':' + r.part +
      ' at byte ' + v + ' — it returned early (a non-finite home or out?), so the ' +
      'sentinel would be compared against itself and this map would print it as a metre');

let zeroIsNoCommand, zeroIsHome;
if(mvRows.length){
  zeroIsNoCommand = mvRows.every(r=>r.at[0] === SENTINEL);
  zeroIsHome = mvRows.every(r=>r.at[0] === r.home);
  if(!zeroIsNoCommand && !zeroIsHome)
    throw new Error('byte 0 is neither home nor a no-op on every mover — read artMoverSet ' +
                    'and say what it does; this probe will not guess');
} else {
  /* NO SHOW MOVER TO ASK, WHICH IS NOT THE SAME FAULT.  The old code let both
     flags fall to false here and threw the message above — blaming
     artMoverSet for a production that simply carries no scenery movers.  Ask
     a synthetic record instead: the question is about the function. */
  const probe = {axis: 'x', home: 0, out: 1, target: SENTINEL};
  w.artMoverSet(probe, 0);
  zeroIsNoCommand = probe.target === SENTINEL;
  probe.target = SENTINEL;
  w.artMoverSet(probe, 0);
  zeroIsHome = !zeroIsNoCommand && probe.target === probe.home;
  if(!zeroIsNoCommand && !zeroIsHome)
    throw new Error('this show carries no set movers, and byte 0 on a synthetic record is ' +
                    'neither home nor a no-op — read artMoverSet and say what it does');
}

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
  if(r.m.target === SENTINEL)
    throw new Error('SELF-CHECK 3 FAILED: channel ' + r.ch + ' at 255 wrote nothing at all into ' +
      r.scene + ':' + r.part + ' — the sentinel is still there, and comparing it would pass ' +
      'by agreeing with itself');
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

/* WHICH OF THESE CHANNELS CHANGE MEANING WHEN ONE OF JACK'S MODEL FILES
   LANDS.  jsdom fetches nothing, so every metre above is the BUILT STAND-IN's
   — but the .glb files are committed and DO load in a browser, and p5i re-runs
   `bjWingPack` on every landing.  The pack re-measures each wing set's own box
   and rewrites `out` on its movers, off a CUMULATIVE z cursor, so a bigger
   attic also moves the sets behind it.

   MEASURED, not typed: every mover's `out` is poisoned, the pack is run, and
   the ones that come back written are the ones a model file re-points.  The
   values it writes are the same ones (the stand-ins have not changed size),
   which is why watching for a DIFFERENCE would find nothing — the question is
   which records the function touches at all. */
const OUT_POISON = -77777;
const packAffected = (()=>{
  if(typeof w.bjWingPack !== 'function' || !mvRows.length) return [];
  const was = mvRows.map(r=>({out: r.m.out, off: r.m.off, target: r.m.target,
                              gpos: r.m.group ? r.m.group.position[r.m.axis] : null}));
  mvRows.forEach(r=>{ r.m.out = OUT_POISON; });
  try{ w.bjWingPack(); }catch(e){ /* a pack that cannot run answers nothing */ }
  const hit = mvRows.filter(r=>r.m.out !== OUT_POISON);
  mvRows.forEach((r, i)=>{ r.m.out = was[i].out; r.m.off = was[i].off; r.m.target = was[i].target;
    if(r.m.group && was[i].gpos !== null) r.m.group.position[r.m.axis] = was[i].gpos; });
  return hit.map(r=>r.ch);
})();

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
out('The first line is the size of the built file this was read from, and the suite');
out('compares it: this map and `the-house.html` must have been generated together. It');
out('does NOT catch a stale BUILD — an `src/`-only edit leaves a stale `the-house.html`,');
out('the probe reads it and the suite stats the same stale file, and everything agrees.');
out('`sh build.sh` first, always.');
out();
out('Universe **0**, one universe, 512 channels, **the Palace only** (RULING EN). A');
out('desk patched to any other stage is received and ignored.');
out();
out('## Which show is loaded, and why it matters');
out();
out('This map was generated with **' + SHOW_KEY.toUpperCase() + ' loaded**. Two blocks below depend on that:');
out();
out('- **the set movers (' + MVB + '+)** — the block is derived every frame from `SHOW.scenes`,');
out('  and Beetlejuice is the only production that carries scene movers at all;');
out('- **the goods on each lineset (274..301)** — a production hangs its own cloths, so');
out('  the lineset LABELS are this show\'s. The channel numbers are not: they are');
out('  `FLY.length` and never move with a show.');
out();
out('The ' + (FLYB - 1) + ' light channels and the five house circuits belong to the STAGE, not to the');
out('show. Measured rather than reasoned: a signature of the whole light block — the');
out('three bases, and every fixture\'s board channel, name, type and mover flag, and the');
out('five circuit names — was taken before any production was loaded and again with');
out(SHOW_KEY.toUpperCase() + ' up, and the two are ' + (lightBlockMoved
    ? '**NOT THE SAME**, so loading a production DOES re-point light channels and this'
    : 'IDENTICAL. That is two productions, not five'));
out(lightBlockMoved
    ? 'map is the loaded show\'s throughout.'
    : '— what this file can say is that loading one did not move them.');
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
out('| ' + SELB + ', ' + (SELB + 1) + ', ' + (SELB + 2) + ', ' + (SELB + 3) +
    ' | house selector, sign target, sign speed, traveler | `artHouseBase() + 5` | ' + SELB + ' |');
/* THE OFFSET IS COMPUTED, NOT TYPED.  It was typed once, as `artSelBase() + 3`,
   and RULING EZ made it 4 — so the column whose whole job is to be the warrant
   for the table stated a derivation that gave 310 beside a measured 311, and a
   build mutated back to +3 printed a table that agreed with itself. */
out('| ' + MVB + '..' + (MVB + mvRows.length - 1) + ' | the loaded show\'s set movers | `artSelBase() + ' +
    (MVB - SELB) + '` | ' + MVB + ' |');
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
out('game\'s fade engine never fights them. Measured: with every fixture\'s `lvlDur` and');
out('`colDur` set to nine seconds first, one applied frame left ' + durProof.lvl + ' of ' + FIX.length +
    ' `lvlDur` and');
out(durProof.col + ' of ' + FIX.length + ' `colDur` at zero.');
out();
out('The seven, and what each one did when it was driven. **EACH OFFSET IS NAMED AFTER');
out('THE ONE RECORD FIELD THAT ANSWERED IT** — red, green and blue are driven alone and');
out('counted separately, so this table cannot survive two components being swapped. The');
out('right-hand column is a count of records that MOVED under a byte of 255, across all');
out(FIX.length + ' fixtures:');
out();
out('| offset | channel of fixture *n* | what it writes | what a byte of 255 moved |');
out('|---|---|---|---|');
const SLOT = slotField.map(k=>FIELD_LABEL[k]);
for(let s = 0; s < CH_FIX; s++){
  const k = slotField[s], n = slotEffect[s][k];
  const writes = FIELD_WRITE[k] + (n < FIX.length ? ' — ' + n + ' OF THE ' + FIX.length + ' ONLY' : '');
  out('| +' + s + ' | ' + (FIXB + s) + ', ' + (FIXB + CH_FIX + s) + ', ' + (FIXB + 2*CH_FIX + s) +
      ' ... | ' + writes + ' | ' + n + ' ' + FIELD_PLURAL[k] + ' |');
}
out();
out('Intensity is linear: byte ' + rampAt.level.map(x=>x.byte + ' -> ' + f2(x.val)).join(', ') + ' (measured).');
out('Colour is the same, and it is measured PER COMPONENT — each of the three bytes');
out('driven on its own and the matching component of `f.color` read back:');
out();
out('| byte | red (+' + slotOf('r') + ') | green (+' + slotOf('g') + ') | blue (+' + slotOf('b') + ') |');
out('|---|---|---|---|');
for(let i = 0; i < 3; i++)
  out('| ' + rampAt.r[i].byte + ' | ' + f2(rampAt.r[i].val) + ' | ' + f2(rampAt.g[i].val) +
      ' | ' + f2(rampAt.b[i].val) + ' |');
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
out('  Measured, and the measurement starts by breaking the thing it is proving: ' +
    parkedProof.away + ' of the');
out('  ' + FLY.length + ' lines were first driven off their own position through `flyTo`, so every one of');
out('  them was mid-travel with a target it was not at. Then, with every speed byte at 0, ' +
    (parkedProof.still.length
      ? '**' + parkedProof.still.length + ' still held a target it was not at (lines ' +
        parkedProof.still.join(', ') + '), which contradicts RULING EQ**.'
      : 'every'));
if(!parkedProof.still.length)
  out('  one of them snapped its target back to where it stood.');
out('- **AND THE TARGET CHANNEL IS PARKED BY THE SPEED CHANNEL TOO.** Byte 0 on a target');
out('  only reaches `minTrimOf` if that line\'s speed byte is non-zero: `artFlys` takes the');
out('  park branch and never reaches `flyTo` at all. The target column above was measured');
out('  with every speed byte at 255. It is the same dependency spelled out on channel ' +
    (SELB + 3) + '.');
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
out('## ' + SELB + ', ' + (SELB + 1) + ', ' + (SELB + 2) + ', ' + (SELB + 3) + ' — the selector channels');
out();
out('### ' + SELB + ' — the BEETLEJUICE house (RULING ER)');
out();
out('His splits come out of `artBandOf`, swept byte by byte. **What each band then DOES');
out('is not read off `ART_HOUSES` here — the channel is DRIVEN through `artBands` at both');
out('ends of every band and the dressing the scene actually took is read back off the');
out('scene.** Re-indexing the same const the game indexes would print a plausible table');
out('for a build with 307 and 308 crossed over, or the bands reversed.');
out();
out('| bytes | band | the scene that answered | the dressing it took |');
out('|---|---|---|---|');
for(const h of houseBands)
  out('| ' + h.from + '..' + h.to + ' | ' + h.band + ' | ' +
      (h.n === 1 ? '`' + h.scene + '`' : h.n === 0 ? 'NOTHING ANSWERED' : h.n + ' SCENES ANSWERED') +
      ' | ' + (h.dress ? '`' + h.dress + '`' + (h.same ? '' : ' — AND THE TWO ENDS OF THIS BAND DISAGREED')
                       : 'none') + ' |');
out();
out('Applied by setting `sc.dressOn` and calling `bjRedress` — the show\'s own mechanism,');
out('which holds two of the three houses out of the graph (RULING CN). **On a band CHANGE');
out('only**: that call detaches and re-attaches scene-graph nodes and must not run 44');
out('times a second. Measured, by holding the same byte with the band memory left alone: ' +
    (changeOnly.house === null ? 'NO SCENE ANSWERED AT ALL, so there was nothing to hold.'
     : changeOnly.house ? 'a second frame at the same byte wrote nothing.'
     : '**A SECOND FRAME AT THE SAME BYTE REDRESSED THE SCENE AGAIN**, which is the'));
if(changeOnly.house === false) out('scene graph being rebuilt at packet rate.');
out((dressScene ? 'The scene it dresses is `' + dressScene.scene +
    '`, which is the one carrying all ' + P.ART_HOUSES.length + ' dressings.'
  : 'NO LOADED SCENE CARRIES ALL THREE DRESSINGS, so this channel does nothing right now.'));
out('A production with no such scenery ignores this channel entirely.');
out();
out('### ' + (SELB + 1) + ', ' + (SELB + 2) + ' — the BEETLEJUICE sign (RULING EZ)');
out();
if(signDrive){
  out('**A fly, not three buttons.** ' + (SELB + 1) + ' is TARGET and ' + (SELB + 2) +
      ' is SPEED, the same idiom as every');
  out('lineset. This SUPERSEDES the sign half of RULING ES; the three named stops are still');
  out('the show\'s own (RULING DH) and still on both surfaces, but the DESK is no longer a');
  out('three-position switch. Everything below was driven through `artSign` and read back.');
  out();
  out('| ' + (SELB + 1) + ' target | commanded to |');
  out('|---|---|');
  out('| 0 | ' + f2(signDrive.lo) + 'm |');
  out('| 128 | ' + f2(signDrive.mid) + 'm |');
  out('| 255 | ' + f2(signDrive.hi) + 'm |');
  out();
  if(signDrive.stops.length){
    out('The named stops, and the byte that reaches each:');
    out();
    out('| stop | metres | ' + (SELB + 1) + ' byte |');
    out('|---|---|---|');
    for(const s of signDrive.stops)
      out('| `' + s.name + '` | ' + f2(s.off) + 'm | ' + s.byte + ' |');
    out();
  }
  out('**' + (SELB + 2) + ' SPEED, and byte 0 is PARKED.** Measured: a speed byte of 0 wrote ' +
      (signDrive.parked ? 'NOTHING at all' : '**A TARGET ANYWAY**'));
  out('— so an unpatched universe cannot haul the sign. Byte 255 is ' + signDrive.full +
      'm/s, the haul\'s');
  out('OWN declared speed, and 128 gives ' + signDrive.half.toFixed(3) + 'm/s, so it scales.');
  out();
  out('Parked here means SILENCE, not a stop: the sign is a SCENE mover, so a haul the show');
  out('started runs on to its stop rather than freezing where it stands (RULINGS EX, EZ).');
  out();
  out('The sign is hauled by the rail, so it takes no mover channel — see the mover block.');
} else {
  out('NO SIGN IS DECLARED BY THE LOADED SHOW, so these two channels do nothing.');
}
out();
out('### ' + (SELB + 3) + ' — the traveler');
out();
out('0 = shut, 255 = open, written as `travTarget` on whichever lineset carries goods');
out('that declare themselves a traveler. WHICH LINE THAT IS was not counted off a list:');
out('the channel was driven half-open and the line that answered is the one named here.');
out('The two answers are then checked against each other — the line that ANSWERED against');
out('the linesets whose goods DECLARE `traveler` — because `artFlys` resolves it with');
out('`FLY.findIndex` and would drive the first of two silently. The count that matters is');
out('the declared one; the answering one cannot exceed 1 by construction.');
out();
if(travDriven){
  const row = flyRows[travDriven.i];
  out('- **Line ' + row.id + '**, carrying ' + row.label + ' (`' + row.key + '`). Its own');
  out('  target channel is ' + row.base + ' and its speed channel is ' + (row.base + 1) + '.');
} else {
  out('- NO LINE ANSWERED IT. Nothing hung on this rail declares itself a traveler, so');
  out('  channel ' + (SELB + 3) + ' does nothing in this production.');
}
out('- **AND IT IS A PROPERTY OF THE HANG, NOT OF THE RAIL.** Measured again before any');
out('  production was loaded, on the Palace\'s own standing hang, ' + (travBare
    ? 'it is **line ' + travBare.id + '** carrying ' + travBareGoods + ' (`' + travBare.key + '`)'
    : 'NO line carried it') + '.');
out('  ' + ((travBare && travDriven && travBare.i !== travDriven.i)
    ? 'A production that hangs its own show curtain therefore MOVES this channel\'s effect'
      : 'It is the same line either way today, and nothing guarantees it stays that way'));
out('  ' + ((travBare && travDriven && travBare.i !== travDriven.i)
    ? 'onto a different lineset — patch ' + (SELB + 3) + ' against the show that is playing.'
      : '— patch ' + (SELB + 3) + ' against the show that is playing.'));
out('- **It is PARKED BY THAT LINE\'S OWN SPEED BYTE.** Measured: with every speed byte at');
out('  0, byte ' + (travDriven ? travDriven.byte : '?') + ' on ' + (SELB + 3) + ' — the same byte that DID move it above — moved');
out('  ' + (travParked === null ? 'nothing, because no line carries a traveler here'
     : travParked ? 'nothing at all' :
    'the traveler anyway, which contradicts the note under RULING EO') + '.');
out('  Written unconditionally this was the one piece of scenery a dead universe DID move:');
out('  the instant the switch went on with nothing patched, the curtain ran itself shut in');
if(travRate)
  out('  front of the audience. How fast, measured off one frame of `updateFly` rather than');
if(travRate)
  out('  copied out of the spec — where it had been written as m/s, which `ls.open` is not:');
if(travRate)
  out('  **' + f2(travRate.rate) + ' of its full draw a second**, about ' + f1(1 / travRate.rate) +
      's end to end, each of its ' + travRate.panels + ' panels');
if(travRate)
  out('  travelling ' + f2(travRate.metres) + 'm in that second. On the standing hang that is line ' +
      (travBare ? travBare.id : '?') + ',');
if(travRate)
  out('  the house curtain — which is where the story comes from.');
out('  Patch that line\'s speed byte and ' + (SELB + 3) + ' does exactly what the table says.');
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
  out('That scenery is addressed by channels ' + (SELB + 1) + ' and ' + (SELB + 2) +
      ' — its own target and speed (RULING EZ) —');
  out('and a mover channel here would be a SECOND per-frame writer on the same record. Whichever');
  out('ran later in artnetTick would win silently, so the rail keeps what the rail hauls.');
  out('(Under RULING ES this reasoning was different: ' + (SELB + 1) + ' wrote on a band change');
  out('only, so a mover channel would have hauled it straight back off its stop. EZ replaced the');
  out('mechanism; the exclusion survives it, for the reason above rather than that one.)');
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
/* B4 — WHOSE METRES THESE ARE.  The probe boots under jsdom, which fetches
   nothing, so every set it can measure is the BUILT STAND-IN.  Said here
   because this is the table an operator patches from. */
out('**THE METRES ABOVE ARE THE BUILT STAND-INS\'.** This map is generated under jsdom,');
out('which fetches nothing, so no `.glb` is loaded when it runs. The model files ARE');
out('committed and they DO load in a browser, and `bjWingPack` re-measures each wing set\'s');
out('own box and rewrites `out` on its movers every time one lands — off a CUMULATIVE');
out('z cursor, so a bigger attic moves the sets behind it too.');
out();
if(packAffected.length){
  out('Measured, by poisoning every mover\'s `out` and running the pack: **' + packAffected.length +
      ' of the ' + mvRows.length);
  out('channels are re-pointed by it** — ' + packAffected.join(', ') + '. Those metres mean');
  out('something else in a browser that has the model files; the CHANNEL NUMBERS do not move.');
  out('The rest of the block is the show\'s own declared travel and is the same either way.');
} else {
  out('Measured, by poisoning every mover\'s `out` and running the pack: it re-points NONE');
  out('of these channels, so the metres above are the metres either way.');
}
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
out('whole-group travel and from the RECORD for a part. Measured on this show, as');
out('MEMBERSHIP and not as two counts that happen to agree — one `mv` with a group and one');
out('`pmv` without would leave both totals equal and this sentence a lie:');
{
  const withGroup = mvRows.filter(r=>r.hasGroup);
  const parts = mvRows.filter(r=>r.part !== 'mv');
  const odd = mvRows.filter(r=>r.hasGroup !== (r.part !== 'mv'));
  if(!odd.length)
    out(withGroup.length + ' of the ' + mvRows.length + ' mover records carry a `group`, and they are exactly the ' +
        parts.length + ' part movers.');
  else {
    out(withGroup.length + ' of the ' + mvRows.length + ' carry a `group` and ' + parts.length +
        ' are part movers, **and they are NOT the same set**:');
    for(const r of odd)
      out('- ch ' + r.ch + ' `' + r.scene + ':' + r.part + '` ' +
          (r.hasGroup ? 'is a whole-group travel and carries a `group`'
                      : 'is a part mover and carries none'));
  }
}
out();
out('## The suite\'s check');
out();
out('`tests/artnet.js` runs this probe and compares its output with this file, line for');
out('line, the body from the second line down and the first line as a number.');
out();
out('The first line — the built file\'s byte size — is compared as a VALUE, not diffed as');
out('text, so the failure can say what actually happened: this map was generated against a');
out('different build of `the-house.html` than the one in the tree. That is the only check');
out('on the one number in this file that no measurement produces. **The cost is that any');
out('change to `src/` needs this file regenerated along with the build** — one command,');
out('`node tools/artnet-map.js > docs/ARTNET.md`, and the diff is one line when nothing');
out('else moved. The shape of the line is asserted on both sides too, so it cannot be');
out('quietly dropped or widened into something that always matches.');
out();
out('What NEITHER check catches is a stale BUILD. An `src/`-only edit leaves a stale');
out('`the-house.html`; the probe reads it, the suite stats the same stale file, and every');
out('number here agrees with every other. `sh build.sh` first.');
out();

process.stdout.write(L.join('\n') + '\n');
