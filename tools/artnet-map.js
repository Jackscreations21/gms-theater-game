/* THE ART-NET CHANNEL LIST, GENERATED OFF THE CODE      (RULINGS EO and FA)

   RULING EO says the map file "cannot drift from the code because it is read
   off the code".  RULING FA says what SHAPE it takes: ONE LINE PER CHANNEL,
   channel 1 to the last channel in use, in numeric order, no gaps, and
   essentially nothing else — a patch list to work down at a desk rather than
   a document to read.  This is the probe that writes it:

     export NODE_PATH=../tests/node_modules
     node artnet-map.js > ../docs/ARTNET.md

   and `tests/artnet.js` fails if the committed file and this output disagree.

   FA IS A PRESENTATION RULING AND IT CHANGED NO MEASUREMENT.  Everything this
   file used to print as prose is still DRIVEN.  What left the output went one
   of two ways: onto the channel's own line as a short suffix, or into a
   SELF-CHECK that throws.  The second is the stronger of the two and it is
   deliberate — a measurement whose only home was a sentence can be quietly
   weakened by rewording the sentence, and a measurement that throws cannot.

   WHY IT PRINTS THE BUILT FILE'S BYTE SIZE FIRST.  Every probe in this repo
   that reads `the-house.html` measures the LAST BUILD, so an src-only edit
   leaves it describing bytes that are no longer what anyone is running
   (TRAPS, the last entry in the file).  The size line says which bytes were
   read, and the suite COMPARES it — the committed number and the probe's own
   must agree, or the list was generated against a different build.  It still
   does NOT catch a stale BUILD: an src-only edit leaves a stale
   the-house.html, this probe reads it, the suite stats the same stale file,
   and everything agrees.  `sh build.sh` first, always.

   THE SECOND HEADER LINE IS WHICH SHOW IS LOADED, and it is there because the
   set-mover lines and the lineset goods are that show's.  That is the whole
   header; RULING FA asks for nothing else.

   NOTHING BELOW IS TYPED FROM A TABLE.  The rulings' own prose has already
   been wrong about this data once — RULING ET says "the attic tracking in
   from x -14.20" where the built record reads home 0, out -19.50 — so every
   name, band, metre and channel number here is either read off a live record
   or MEASURED by calling the game's own apply functions with a synthesised
   frame and reading what moved.  THE WHOLE WARRANT OF RULING EO IS THAT THIS
   FILE MEASURES RATHER THAN RESTATES: a block that re-indexes the same consts
   the game indexes, in the order this file believes the game uses, is a table
   with a script in front of it and would survive the mutation it exists to
   catch.  So `artLights`, `artFlys`, `artMovers`, `artMoverSet`, `artBands`
   AND `artSign` are all called, and what moved is written down.  The
   self-checks:

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
        is long enough to be told apart (the degenerate ones are named on
        their own line), plus a sentinel check: a mover artMoverSet returned
        early on keeps the sentinel, and a comparison would then pass by
        agreeing with itself
     4  a fortieth lantern is pushed onto FIXTURES and every base after the
        light block must move by exactly ART_CH_FIX.  TRAPS: a map written
        from literals silently repoints when the rig grows, and an assertion
        that the base EQUALS the formula is satisfied by the literal too —
        the derivation is proved by growing the rig
     5  the fade durations really are zeroed, per fixture, not asserted from
        RULING EP's prose
     6  a fly speed byte of 0 really parks a line that is MID-TRAVEL, and the
        traveler is parked by its own line's speed byte
     7  the band channel really does write on a band CHANGE only.  ONE
        channel, not two: RULING EZ took the sign off the bands and gave it
        two channels of its own, so 307 is all that is left banded
     8  loading a production did not re-point one light channel
     9  `sc.mv` records carry no `group` and `sc.pmv` records do — as
        MEMBERSHIP, not as two counts that happen to agree
     10 the emitted list is one line per channel with NO GAPS, from the first
        channel to the last one in use.  That is RULING FA itself, and it is
        what fires if a future ruling inserts a channel and forgets a line
     11 RULING EZ's sign: the target channel spans a real travel, a speed byte
        of 0 writes NOTHING, byte 255 is the haul's OWN declared speed, the
        speed byte scales, and every stop the show declares is reachable by
        some byte.  IT IS ELEVENTH AND NOT FOURTH ON PURPOSE.  EZ wrote it as
        "SELF-CHECK 4" when this file carried three; FA had already given 4 to
        the fortieth-lantern check and 10 to its own no-gap rule, and
        `tests/artnet.js` names SELF-CHECK 10 by number.  Renumbering FA's
        block to make room would have moved the number the suite cites, so the
        newcomer takes the free number at the end.

   WHAT SURVIVED INTO THE LIST AS A WARNING.  "Nothing else" is not licence to
   throw away a fact that stops somebody breaking a show, so these ride on the
   line of the channel they concern, compressed to a suffix: the one-way mover
   channel; that every mover metre was measured with NO model file loaded and
   which channels `bjWingPack` re-points when one lands; that the traveler
   channel's LINE changes with the loaded show; that the house selector acts
   on a band CHANGE only; that a fixture's pan and tilt bytes are ignored on a
   lantern that does not move; that a fly speed byte of 0 is PARKED; and that
   PARKED on the SIGN's speed byte means SILENCE rather than a stop, because
   the sign is a scene mover and a haul the show started runs on (RULING EZ).

   WHAT THIS PROBE CANNOT MEASURE, AND SAYS SO ON EVERY LINE IT AFFECTS.
   jsdom fetches nothing, so every set here is the BUILT STAND-IN.
   `bjWingPack` re-measures each wing set's box and rewrites `out` on its
   movers when one of Jack's model files lands in a real browser, and the list
   names the channels that changes — measured, by poisoning every `out` and
   running the pack.

   A probe that judges has to be checkable, and a list nobody can check is a
   table with a script in front of it.                                      */

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
   is loaded — which lands in the middle of the list and would be committed as
   part of it.  This file's only output is the list. */
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
                 'artMoverHauled','artBands','artSign','artSignRange','artPros',
                 'artProsBase','minTrimOf',
                 'showLoad','flyExtraStops',
                 'flyExtraMover','flyTo','updateFly','bjRedress','bjWingPack'])
  if(typeof w[fn] !== 'function')
    throw new Error('the probe cannot see ' + fn + '() on the window');

function pump(n){
  for(let i = 0; i < n; i++){ const cb = w.__raf; w.__raf = null; if(cb) cb(Date.now() + i*16); }
}
pump(6);
if(w.__fatal) throw new Error('the file did not boot: ' + w.__fatal);

if(P.STAGE !== 'palace')
  throw new Error('the list is the Palace patch (RULING EN) and the board is on ' + P.STAGE);

const FIX = P.FIXTURES, FLY = P.FLY;
const CH_FIX = P.ART_CH_FIX;
/* THE RIG AND THE RAIL BELONG TO THE STAGE, NOT TO THE SHOW, so every base is
   already final before a production is loaded — which is why the light lines
   and the house circuits below are the same in all five. */
const FIXB = w.artFixBase(), FLYB = w.artFlyBase(), HOUB = w.artHouseBase(),
      SELB = w.artSelBase(), MVB  = w.artMoverBase();

/* THE SELECTOR CHANNELS, NAMED ONCE AND DERIVED — never written down.  The
   ONE banded channel is the first of the selector block; the sign's TARGET
   and SPEED are the next two (RULING EZ, which took the sign off the bands
   and gave it the RULING EQ fly idiom); the traveler is the LAST channel
   before the mover block, which is what it is in the layout rather than a
   coincidence of today's arithmetic, and it is the form that survives a
   ruling inserting a selector channel above it.  EZ IS EXACTLY THAT RULING
   AND THIS FORM ALREADY SURVIVED IT: the traveler was SELB + 2 and is SELB +
   3, and only the sign's two lines had to be written.  Both readings are the
   same channel today (SELB + 3 === MVB - 1), and neither is trusted: the
   traveler channel is DRIVEN below and the line that answered is checked
   against the linesets that declare one. */
const HOUSE_BAND_CH = SELB;
const SIGN_T_CH     = SELB + 1;
const SIGN_S_CH     = SELB + 2;
const TRAV_CH       = SELB + 3;
const PROSB         = w.artProsBase();        // RULING FC — four, after the traveler
/* THE FIXED BLOCK IS CHECKED FOR SHAPE, NOT ASSUMED.  It has been renumbered
   twice in one day — EZ gave the sign a second channel, FC added four for the
   proscenium — and each time a stale base would have quietly stacked one
   reading on top of another with nothing else noticing.  So the two ends are
   asserted against each other: the proscenium starts where the traveler ends,
   and the movers start where the proscenium ends. */
if(PROSB !== TRAV_CH + 1)
  throw new Error('the selector block does not fit: the traveler is ' + TRAV_CH +
    ' and the proscenium base is ' + PROSB + ' — artProsBase() must be artSelBase() + 4');
if(MVB !== PROSB + 4)
  throw new Error('the selector block does not fit: the proscenium is ' + PROSB + '..' +
    (PROSB + 3) + ' and the movers start at ' + MVB + ' — artMoverBase() must be artProsBase() + 4');

const f2 = v => (Math.round(v * 100) / 100).toFixed(2);
const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
/* right-aligned, so a two-digit rig does not stagger the columns */
const pad  = (s, n) => ' '.repeat(Math.max(0, n - String(s).length)) + String(s);
const padR = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));
function frame(){ return new Uint8Array(512); }
function put(b, ch, v){ b[ch - 1] = v; }              // channel numbers are 1-based

/* SELF-CHECK 4 — THE BASES ARE COMPUTED, AND IT IS PROVED BY GROWING THE RIG.
   TRAPS: "A CHANNEL MAP MUST BE COMPUTED OR IT SILENTLY REPOINTS", and a test
   that asserts `base === 1 + 7 * FIXTURES.length` is satisfied by a literal
   too.  So a fortieth lantern is pushed onto FIXTURES and every base after
   the light block must move by exactly ART_CH_FIX.  This used to be a
   sentence at the foot of the file ("add a fortieth lantern and the fly block
   starts at 281"); as a check it cannot be reworded into agreement. */
{
  const names = ['artFlyBase', 'artHouseBase', 'artSelBase', 'artMoverBase'];
  const before = names.map(n=>w[n]());
  let after;
  FIX.push({name: 'a lantern that is not there'});
  try{ after = names.map(n=>w[n]()); }
  finally{ FIX.pop(); }
  for(let i = 0; i < names.length; i++)
    if(after[i] - before[i] !== CH_FIX)
      throw new Error('SELF-CHECK 4 FAILED: a fortieth lantern moved ' + names[i] + '() by ' +
        (after[i] - before[i]) + ' and not ' + CH_FIX + ' — the bases are not computed off ' +
        'FIXTURES.length, so every channel in this list would silently repoint the day ' +
        'the rig grows');
}

/* WHICH LINE THE TRAVELER CHANNEL BELONGS TO IS A PROPERTY OF THE HANG, and a
   production re-hangs the rail — so it is measured TWICE, once on the Palace's
   own standing hang and once on the show this list is generated with.  Driven
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
      ' alone, so channel ' + TRAV_CH + ' cannot be printed as belonging to one line');
  const was = flySnapOf();
  let hit = null, usedByte = null;
  for(const byte of TRAV_BYTES){
    const b = frame();
    for(let j = 0; j < FLY.length; j++) put(b, FLYB + j * 2 + 1, 255);   // every line driven
    put(b, TRAV_CH, byte);
    w.artFlys(b);
    const moved = FLY.map((ls, i)=>({i: i, id: ls.id, key: ls.goodsKey}))
                     .filter(x=>FLY[x.i].travTarget !== was[x.i].travTarget);
    flyPutBack(was);
    if(moved.length > 1)
      throw new Error('SELF-CHECK 2 FAILED: channel ' + TRAV_CH + ' moved ' + moved.length +
        ' travelers on ' + where + ' — the list claims it belongs to exactly one line');
    if(moved.length === 1){ hit = moved[0]; usedByte = byte; break; }
  }
  /* the two answers, checked against each other rather than one of them
     printed and the other trusted */
  if(declared.length === 1 && !hit)
    throw new Error('SELF-CHECK 2 FAILED: line ' + declared[0].id + ' on ' + where +
      ' hangs goods that declare `traveler` and no byte on channel ' + TRAV_CH +
      ' moved it — the channel and the declaration disagree');
  if(!declared.length && hit)
    throw new Error('SELF-CHECK 2 FAILED: channel ' + TRAV_CH + ' moved line ' + hit.id +
      ' on ' + where + ' and no lineset there declares a traveler');
  if(hit && declared.length && hit.i !== declared[0].i)
    throw new Error('SELF-CHECK 2 FAILED: channel ' + TRAV_CH + ' moved line ' + hit.id +
      ' on ' + where + ' and the declaring lineset is line ' + declared[0].id);
  return hit ? Object.assign({byte: usedByte}, hit) : null;
}
const travBare = travelerNow('the Palace\'s standing hang');
const travBareGoods = travBare ? (P.GOODS[travBare.key] || {}).label : null;

/* SELF-CHECK 8 — THE RIG AND THE HOUSE CIRCUITS ARE THE STAGE'S, NOT THE
   SHOW'S.  This file used to say so as reasoning, then measured it and
   printed the answer as a paragraph.  RULING FA has no room for the
   paragraph, so it is a check: a signature of the light block is taken here,
   before any production exists, and again after one is loaded, and they must
   be identical.  If a production ever DOES re-point a light channel this
   throws rather than printing a list that is silently one show's. */
const lightSig = ()=>JSON.stringify({
  fixBase: w.artFixBase(), chFix: CH_FIX, flyBase: w.artFlyBase(), houseBase: w.artHouseBase(),
  fixtures: FIX.map(f=>[f.ch, f.name, f.type, !!f.mover]),
  circuits: Object.keys(P.HOUSE)});
const lightSigBare = lightSig();

/* WHICH SHOW IS LOADED CHANGES THIS FILE, so the choice is made here and said
   out loud in the header.  Beetlejuice is the only production carrying set
   movers at all (RULING ET is for it), and it is also the show whose own
   goods hang on the fly rail — so the mover lines and the lineset labels both
   come from it. */
const SHOW_KEY = 'beetlejuice';
if(!w.showLoad(SHOW_KEY)) throw new Error('the probe could not load ' + SHOW_KEY);
pump(4);
if(lightSig() !== lightSigBare)
  throw new Error('SELF-CHECK 8 FAILED: loading ' + SHOW_KEY.toUpperCase() + ' moved the light ' +
    'block — a base, a fixture channel, name, type or mover flag, or a house circuit name. ' +
    'The light lines in this list would then be the LOADED SHOW\'S rather than the stage\'s, ' +
    'and the header says only which show the movers and the goods came from');

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
/* SELF-CHECK 9 — `sc.mv` records carry no `group` field and `sc.pmv` records
   do, and anything walking this block that wants the moving GROUP has to take
   it from the SCENE for a whole-group travel and from the RECORD for a part.
   Asked as MEMBERSHIP and not as two counts that happen to agree — one `mv`
   with a group and one `pmv` without would leave both totals equal. */
{
  const odd = mvRows.filter(r=>r.hasGroup !== (r.part !== 'mv'));
  if(odd.length)
    throw new Error('SELF-CHECK 9 FAILED: ' + odd.map(r=>'ch ' + r.ch + ' ' + r.scene + ':' + r.part +
      (r.hasGroup ? ' is a whole-group travel and carries a group'
                  : ' is a part mover and carries none')).join('; ') +
      ' — anything walking the mover channels for a moving group would take it from the ' +
      'wrong place');
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
      lit.map(x=>x + 1).join(',') + '] — the fixture block is not where this list says');
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
      ' — one fixture channel is one property, and this list names each offset after ' +
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
const PAN_S = slotOf('panT'), TILT_S = slotOf('tiltT'), GOBO_S = slotOf('gobo');

/* WHAT EVERY FIXTURE CHANNEL DOES AT THREE BYTES, PER FIXTURE.  RULING FA
   puts one line per channel, so the numbers on a line have to be that
   channel's own: the previous file measured the ramps on FIXTURE 1 and
   printed them as the rig's, which is a sentence rather than a reading for
   the other 38 lines.  One sweep per offset per byte, every fixture driven at
   once (artLights writes each record independently) and every record read
   back. */
const BYTES3 = [0, 128, 255];
const slotAt = [];
for(let s = 0; s < CH_FIX; s++){
  const perByte = {};
  for(const v of BYTES3){
    const b = frame();
    for(let i = 0; i < FIX.length; i++) put(b, FIXB + i * CH_FIX + s, v);
    w.artLights(b);
    perByte[v] = fixSnap();
  }
  slotAt.push(perByte);
}
const slotVal = (s, v, i) => slotAt[s][v][i][slotField[s]];

/* the gobo bands, swept byte by byte rather than divided by 43 here — and per
   fixture, for the same reason as the ramps */
const goboSweep = [];
for(let v = 0; v < 256; v++){
  const b = frame();
  for(let i = 0; i < FIX.length; i++) put(b, FIXB + i * CH_FIX + GOBO_S, v);
  w.artLights(b);
  goboSweep.push(FIX.map(f=>f.gobo));
}
function goboBandsOf(i){
  const bands = [];
  for(let v = 0; v < 256; v++){
    const g = goboSweep[v][i], last = bands[bands.length - 1];
    if(!last || last.gobo !== g) bands.push({from: v, to: v, gobo: g});
    else last.to = v;
  }
  return bands;
}
const goboName = {};
for(const k in P.GOBO_NAMES) goboName[P.GOBO_NAMES[k]] = k;

/* SELF-CHECK 5 — THE FADE DURATIONS ARE ZEROED, measured rather than asserted
   from RULING EP's prose: every duration is set to nine seconds first, one
   frame is applied, and any fixture still carrying one throws.  It was a
   printed count ("39 of 39") until RULING FA; a count in a sentence can be
   read down to 38 without anything failing, and a check cannot. */
{
  for(const f of FIX){ f.lvlDur = 9; f.colDur = 9; }
  const b = frame();
  for(let i = 0; i < FIX.length; i++) put(b, FIXB + i * CH_FIX, 128);
  w.artLights(b);
  const lvl = FIX.filter(f=>f.lvlDur !== 0).length, col = FIX.filter(f=>f.colDur !== 0).length;
  if(lvl || col)
    throw new Error('SELF-CHECK 5 FAILED: an applied frame left ' + lvl + ' of ' + FIX.length +
      ' lvlDur and ' + col + ' of ' + FIX.length + ' colDur non-zero — RULING EP says every ' +
      'Art-Net write is RAW, and a surviving duration means the fade engine fights the desk');
}

/* WHICH LANTERNS ACTUALLY TURN.  Not read off `f.mover` and printed as though
   it had been measured: the pan and tilt bytes are driven and the records
   that answered are the movers. */
for(let i = 0; i < FIX.length; i++){
  const responds = slotVal(PAN_S, 255, i) !== slotVal(PAN_S, 0, i) ||
                   slotVal(TILT_S, 255, i) !== slotVal(TILT_S, 0, i);
  fixRows[i].turns = responds;
  fixRows[i].gobo = goboBandsOf(i);
  if(responds !== fixRows[i].mover)
    throw new Error('SELF-CHECK 1 FAILED: fixture ' + (i + 1) + ' declares mover=' +
      fixRows[i].mover + ' and ' + (responds ? 'moved' : 'did not move') + ' under a pan/tilt byte');
}
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
  /* AND WHAT THE BYTES MEAN IS READ BACK, NOT TYPED.  This line used to print
     the string '0=out 255=full' — so a square-law house fader, or one where a
     dead universe brought the house to HALF, produced a byte-identical map
     with no throw.  A review proved both.  Three ends, driven and read. */
  const at = {};
  for(const v of [0, 128, 255]){
    const bb = frame();
    put(bb, HOUB + s, v);
    w.artLights(bb);
    at[v] = P.HOUSE[hit[0]];
  }
  if(!(at[0] === 0 && at[255] === 1))
    throw new Error('SELF-CHECK 1 FAILED: house circuit ' + hit[0] + ' on channel ' +
      (HOUB + s) + ' reads ' + at[0] + ' at byte 0 and ' + at[255] +
      ' at 255 — a house circuit spans out..full');
  houseChan.push({ch: HOUB + s, key: hit[0], at: at});
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
        ' — the fly block is not where this list says');
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
  for(const v of BYTES3){
    const b = frame();
    for(let j = 0; j < FLY.length; j++) put(b, FLYB + j * 2 + 1, 255);
    put(b, FLYB + r.i * 2, v);
    w.artFlys(b);
    r.at.push(FLY[r.i].target);
  }
  flyRestore();
}
/* SELF-CHECK 6 — AND WHAT A SPEED BYTE OF 0 DOES: THE LINE IS STOPPED WHERE
   IT STANDS.  THE SETUP HAS TO CREATE THE THING BEING PROVED, or the proof is
   of the setup.  At the restore point every line is standing AT its own
   target, so `|target - pos| < 1e-9` is already true of all fourteen and a
   version that simply sent speed 0 and asserted it passed with
   `ls.target = ls.pos` cut clean out of artFlys.  So each line is first driven
   off its position through the game's own `flyTo` — mid-travel, target far
   from pos, which is the state RULING EQ's stop exists for — and only THEN
   parked.  Both halves throw: a line that would not go mid-travel is a setup
   that proves nothing, and it used to be printed as a count. */
{
  const away = [];
  for(let i = 0; i < FLY.length; i++){
    const ls = FLY[i], lo = flyRows[i].lo;
    const far = Math.abs(P.OUT_TRIM - ls.pos) >= Math.abs(lo - ls.pos) ? P.OUT_TRIM : lo;
    w.flyTo(ls, far);
    if(Math.abs(ls.target - ls.pos) > 0.01) away.push(ls.id);
  }
  if(away.length !== FLY.length)
    throw new Error('SELF-CHECK 6 FAILED: only ' + away.length + ' of ' + FLY.length +
      ' lines could be driven off their own position, so a park measured on the rest ' +
      'would be measuring a line that was standing still anyway');
  const b = frame();
  for(let j = 0; j < FLY.length; j++){ put(b, FLYB + j * 2, 255); put(b, FLYB + j * 2 + 1, 0); }
  w.artFlys(b);
  const still = FLY.filter(ls=>Math.abs(ls.target - ls.pos) >= 1e-9).map(ls=>ls.id);
  flyRestore();
  if(still.length)
    throw new Error('SELF-CHECK 6 FAILED: with every speed byte at 0, ' + still.length +
      ' lines (ids ' + still.join(', ') + ') still held a target they were not at — ' +
      'RULING EQ says a speed byte of 0 STOPS the line where it stands, and every ' +
      'speed line in this list says PARKED');
}

/* ---- 4: the traveler on THIS show's hang, and the speed-byte park ------- */
const travDriven = travelerNow('the ' + SHOW_KEY.toUpperCase() + ' hang');
/* SELF-CHECK 6 — driven with the byte that DID move it above; a park proved
   with a byte the field already holds proves nothing at all */
if(travDriven){
  const b = frame();
  for(let j = 0; j < FLY.length; j++) put(b, FLYB + j * 2 + 1, 0);      // every line parked
  put(b, TRAV_CH, travDriven.byte);
  w.artFlys(b);
  const moved = FLY.filter((ls, i)=>ls.travTarget !== flyWas[i].travTarget).length;
  flyRestore();
  if(moved)
    throw new Error('SELF-CHECK 6 FAILED: with every speed byte at 0, byte ' + travDriven.byte +
      ' on channel ' + TRAV_CH + ' still moved the traveler — RULING EQ has it parked by its ' +
      'own line\'s speed byte, and an unpatched desk would run a curtain shut in front of ' +
      'the audience');
}

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

/* ---- 5: the ONE banded channel, DRIVEN THROUGH artBands, and the sign,
   DRIVEN THROUGH artSign ---------------------------------------------------
   The splits themselves come out of `artBandOf`, swept byte by byte.  What
   each band then DOES is the part this file used to restate: it re-indexed
   `ART_HOUSES[band]` the way its author believed artBands worked, and never
   called artBands at all — so swapping the selector channels or reversing the
   dressings produced a byte-identical map.  It is read back off the stage now.

   TWO THINGS MAKE THAT AWKWARD AND NEITHER IS OPTIONAL.  The channel writes
   on a band CHANGE only (RULING ER), so stepping the byte inside one band
   does nothing and the band memory has to be cleared between readings; and
   `bjRedress` really detaches and re-attaches scene-graph nodes, so
   everything touched here is put back at the end.

   THE SIGN IS NOT HERE ANY MORE (RULING EZ).  It was the second banded
   channel under RULING ES; it is now a TARGET and a SPEED in the RULING EQ
   fly idiom, written by `artSign`, and it has neither a band nor a band
   memory.  So it is driven through its own function below, and nothing on it
   is measured through `artBands` — which is the difference between reporting
   what the code does and reporting what a superseded ruling said. */
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
  /* `artSpeed` as well as `speed` — RULING EZ writes the desk's speed to the
     shadow field, and a restore that put back only `speed` would leave the
     show hauling the sign at whatever this probe last sent */
  sign: signMv ? {target: signMv.target, off: signMv.off, speed: signMv.speed,
                  artSpeed: signMv.artSpeed} : null,
  art: {bandSc: P.ART.bandSc, houseBand: P.ART.houseBand}
};
function bandFrame(vHouse){
  const b = frame();
  put(b, HOUSE_BAND_CH, vHouse);
  return b;
}
/* RULING EZ — the sign is two channels of its own now, driven through artSign */
function signFrame(tv, sv){
  const b = frame();
  put(b, SIGN_T_CH, tv); put(b, SIGN_S_CH, sv);
  return b;
}
/* drive the house band at one byte and read back WHICH scene took WHICH
   dressing.  Every dressable scene is stamped with a value no dressing key
   can equal first, so the scene that comes back stamped is the one artBands
   did not write. */
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
  if(t === SIGN_NOBODY) return {target: null, speed: null};
  /* WHICH STOP A BYTE LANDS ON IS NOT DECIDED HERE.  It needs a tolerance,
     the only honest tolerance is half a byte step, and a byte step is not
     known until the ends have been measured — which is what this function is
     for.  So the matching lives below, where the span exists. */
  return {target: t,
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
  /* HALF A BYTE STEP, DERIVED.  A stop is reachable if a BYTE lands on it,
     and rounding to the nearest byte can miss by half a step — so the fixed
     0.005m this used to carry was NINE TIMES tighter than its own comment
     reasoned, and false-failed on any geometry nudge: moving BJ_SIGN_OUT to
     9.05 made the probe exit 1 claiming PRE-SHOW unreachable when byte 53
     reaches it to 12mm. */
  const tol = Math.abs(hi - lo) / 510 + 1e-9;
  const stops = (signStops || []).map(s=>{
    const by = signByteFor(s.off, lo, hi);
    const got = driveSign(by).target;
    return {name: s.name, off: s.off, byte: by, got: got,
            miss: Math.abs(got - s.off), hits: Math.abs(got - s.off) < tol};
  });
  return {lo: lo, hi: hi, mid: mid, parked: parked, full: full, half: half,
          declared: signX ? signX.speed : null, stops: stops};
})() : null;
/* ---- RULING FC: the proscenium neon, DRIVEN through artPros ------------
   Four channels: intensity, R, G, B.  The record is SHOW.bjPortal, and the
   write has to be the RECORD rather than the material because updatePortal
   rewrites emissiveIntensity/emissive/color every frame from it — a material
   write survives exactly zero frames.  So the read-back is the record too. */
const prosWas = P.SHOW.bjPortal
  ? {lvl: P.SHOW.bjPortal.lvl, tLvl: P.SHOW.bjPortal.tLvl,
     col: P.SHOW.bjPortal.col.getHex(), tCol: P.SHOW.bjPortal.tCol.getHex()} : null;
function prosFrame(i, r, g, bl){
  const b = frame();
  put(b, PROSB, i); put(b, PROSB + 1, r); put(b, PROSB + 2, g); put(b, PROSB + 3, bl);
  return b;
}
function drivePros(i, r, g, bl){
  const p = P.SHOW.bjPortal;
  if(!p) return null;
  p.lvl = -1; p.tLvl = -1;                       // a value no byte can produce
  w.artPros(prosFrame(i, r, g, bl));
  return {lvl: p.lvl, tLvl: p.tLvl, r: p.col.r, g: p.col.g, b: p.col.b,
          tr: p.tCol.r, tg: p.tCol.g, tb: p.tCol.b};
}
const prosDrive = P.SHOW.bjPortal ? (()=>{
  const off   = drivePros(0, 0, 0, 0);
  const at0   = off;
  const at128 = drivePros(128, 0, 0, 0);
  const at255 = drivePros(255, 0, 0, 0);
  const red   = drivePros(255, 255, 0, 0);
  const green = drivePros(255, 0, 255, 0);
  const blue  = drivePros(255, 0, 0, 255);
  /* each colour byte driven ALONE, at both ends, and its OWN component read
     back — so the three lines in the list are measurements like every other */
  const colLo = [drivePros(255, 0, 255, 255).r,
                 drivePros(255, 255, 0, 255).g,
                 drivePros(255, 255, 255, 0).b];
  const colHi = [red.r, green.g, blue.b];
  return {lo: at0.lvl, mid: at128.lvl, hi: at255.lvl,
          raw: at255.lvl === at255.tLvl && red.r === red.tr,
          red: red, green: green, blue: blue, colLo: colLo, colHi: colHi};
})() : null;
if(prosWas){ const p = P.SHOW.bjPortal;
  p.lvl = prosWas.lvl; p.tLvl = prosWas.tLvl;
  p.col.setHex(prosWas.col); p.tCol.setHex(prosWas.tCol); }

/* SELF-CHECK 12 — the proscenium block is four real channels, and the write is
   RAW.  Each of these can fail: a build that wrote only the target (the fader
   would then crossfade, which RULING EP forbids), one whose colour bytes were
   ordered wrongly, or one whose intensity did not span out..full. */
if(prosDrive){
  if(!(prosDrive.lo === 0 && Math.abs(prosDrive.hi - 1) < 1e-9))
    throw new Error('SELF-CHECK 12 FAILED (RULING FC): the proscenium intensity reads ' +
      prosDrive.lo + ' at byte 0 and ' + prosDrive.hi + ' at 255 — it spans out..full');
  if(Math.abs(prosDrive.mid - 0.5) > 0.01)
    throw new Error('SELF-CHECK 12 FAILED (RULING FC): byte 128 gave ' + prosDrive.mid +
      ' — the middle of the fader is half');
  if(!prosDrive.raw)
    throw new Error('SELF-CHECK 12 FAILED (RULING FC): the write is not RAW — the value and ' +
      'its target disagree, so updatePortal will crossfade a desk fader (RULING EP)');
  if(!(prosDrive.red.r === 1 && prosDrive.red.g === 0 && prosDrive.red.b === 0))
    throw new Error('SELF-CHECK 12 FAILED (RULING FC): the red byte gave rgb ' +
      [prosDrive.red.r, prosDrive.red.g, prosDrive.red.b].join(','));
  if(!(prosDrive.green.g === 1 && prosDrive.green.r === 0))
    throw new Error('SELF-CHECK 12 FAILED (RULING FC): the green byte gave rgb ' +
      [prosDrive.green.r, prosDrive.green.g, prosDrive.green.b].join(','));
  if(!(prosDrive.blue.b === 1 && prosDrive.blue.r === 0))
    throw new Error('SELF-CHECK 12 FAILED (RULING FC): the blue byte gave rgb ' +
      [prosDrive.blue.r, prosDrive.blue.g, prosDrive.blue.b].join(','));
}

/* SELF-CHECK 11 — the sign must be a real travel driven by a real speed byte.
   Every one of these can fail: a build that dropped the parked branch, one
   that wrote `speed` instead of `artSpeed`, one that used inOff/outOff (which
   would put the floor out of reach), or one whose range collapsed.  This is
   the check RULING EZ wrote as "SELF-CHECK 4"; see the header for why it
   carries the last number instead of the fourth. */
if(signDrive){
  if(!(Math.abs(signDrive.hi - signDrive.lo) > 0.5))
    throw new Error('SELF-CHECK 11 FAILED: the sign channel spans ' +
      (signDrive.hi - signDrive.lo).toFixed(3) + 'm — that is not a travel');
  if(!signDrive.parked)
    throw new Error('SELF-CHECK 11 FAILED: a speed byte of 0 still commanded the sign');
  if(!(signDrive.full > 0) || Math.abs(signDrive.full - signDrive.declared) > 1e-6)
    throw new Error('SELF-CHECK 11 FAILED: speed 255 gave ' + signDrive.full +
      ', not the haul\'s declared ' + signDrive.declared);
  if(Math.abs(signDrive.half - signDrive.declared * (128 / 255)) > 1e-6)
    throw new Error('SELF-CHECK 11 FAILED: the speed byte does not scale');
  for(const s of signDrive.stops)
    if(!s.hits)
      throw new Error('SELF-CHECK 11 FAILED: no byte reaches the stop ' + s.name +
        ' at ' + s.off.toFixed(3) + 'm — byte ' + s.byte + ' gave ' + s.got.toFixed(3) +
        ', a miss of ' + s.miss.toFixed(4) + 'm against half a byte step. ' +
        'RULING EZ says all three are reachable.');
}
/* SELF-CHECK 7 — AND "ON A BAND CHANGE ONLY" IS ITSELF MEASURED: hold the
   same byte with the memory left alone and nothing may be written a second
   time.  It was a printed sentence; it throws now, because the sentence had
   a branch that read "A SECOND FRAME REDRESSED THE SCENE AGAIN" and printing
   a fault is not catching one. */
{
  const top = bands[bands.length - 1];
  const h = driveHouse(top.from);
  if(h.sc){ h.sc.dressOn = DRESS_NOBODY;
    w.artBands(bandFrame(top.from));                // same byte, memory untouched
    if(h.sc.dressOn !== DRESS_NOBODY)
      throw new Error('SELF-CHECK 7 FAILED: a second frame at the same byte redressed ' +
        h.sc.name + ' again — bjRedress detaches and re-attaches scene-graph nodes, so ' +
        'channel ' + HOUSE_BAND_CH + ' would rebuild the graph at packet rate'); }
  /* RULING EZ — THERE IS NO SECOND HALF TO THIS CHECK ANY MORE.  The sign was
     band-change-only under ES; it is a per-frame fly write now, so a second
     frame at the same byte SHOULD re-command it, and asserting otherwise would
     be this file restating a rule the code stopped having.  What replaces it
     is SELF-CHECK 11, which is about the thing that now protects the sign: the
     speed byte. */
}
/* put the stage back: the dressing through the show's own mechanism, the
   sign's mover by hand, and the band memory to what it was */
dressScenes.forEach((s, i)=>{ s.dressOn = bandWas.dress[i]; w.bjRedress(s); });
P.SHOW.pendDress = bandWas.pend;
if(signMv && bandWas.sign){ signMv.target = bandWas.sign.target; signMv.off = bandWas.sign.off;
                            signMv.speed = bandWas.sign.speed; }
P.ART.bandSc = bandWas.art.bandSc; P.ART.houseBand = bandWas.art.houseBand;
/* RULING EZ — `ART.signBand` and `ART.bandSign` no longer exist; the sign's
   desk speed lives on the mover record as `artSpeed`, and that is what has to
   go back */
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
   line prints -12345.00m as a metre.  Every non-zero byte has to have written
   something before any of that is believed. */
for(const r of mvRows) for(const v of [1, 128, 255])
  if(r.at[v] === SENTINEL)
    throw new Error('artMoverSet wrote nothing into ' + r.scene + ':' + r.part +
      ' at byte ' + v + ' — it returned early (a non-finite home or out?), so the ' +
      'sentinel would be compared against itself and this list would print it as a metre');

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
        'in the order this list prints');
  }
}
mvRestore();
for(const r of mvUncheckable) r.unproved = true;

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

/* ---------------------------------------------------------------------------
   THE LIST (RULING FA).  One row per channel, built in block order, and then
   checked for gaps: the rows are NOT sorted into place, because the order is
   the measurement.
   ------------------------------------------------------------------------- */
const ROWS = [];
function row(ch, subject, fn, detail, notes){
  ROWS.push({ch: ch, subject: subject, fn: fn, detail: detail || '',
             notes: (notes || []).filter(Boolean)});
}

/* ---- the fixtures ------------------------------------------------------- */
for(const r of fixRows){
  const who = ('0' + (r.i + 1)).slice(-2) + ' ' + r.name + ' [' + r.type + '] ' + r.section;
  for(let s = 0; s < CH_FIX; s++){
    const k = slotField[s];
    let detail;
    if(k === 'gobo')
      detail = r.gobo.map(g=>g.from + '-' + g.to + '=' + (goboName[g.gobo] || '?')).join(' ');
    else if(k === 'panT' || k === 'tiltT')
      detail = r.turns ? BYTES3.map(v=>v + '=' + f1(slotVal(s, v, r.i)) + 'deg').join(' ')
                       : 'ignored: not a mover';
    else
      detail = BYTES3.map(v=>v + '=' + f2(slotVal(s, v, r.i))).join(' ');
    row(r.base + s, who, FIELD_LABEL[k], detail, []);
  }
}

/* ---- the linesets ------------------------------------------------------- */
for(const r of flyRows){
  const who = 'line ' + pad(r.id, 2) + ' ' + r.label + (r.key === 'none' ? '' : ' (' + r.key + ')');
  row(r.base, who, 'target',
      '0=' + f2(r.at[0]) + 'm lowest 128=' + f2(r.at[1]) + 'm 255=' + f2(r.at[2]) + 'm grid',
      ['dead while speed byte ' + (r.base + 1) + ' is 0',
       r.traveler ? 'carries the traveler, drawn from channel ' + TRAV_CH : null]);
  row(r.base + 1, who, 'speed',
      '0=PARKED (the line stops where it stands) 255=' + f2(P.ART_FLY_MAX) + ' m/s', []);
}

/* ---- the house circuits ------------------------------------------------- */
for(const h of houseChan)
  row(h.ch, 'house circuit HOUSE.' + h.key, 'level',
      '0=' + f2(h.at[0]) + ' 128=' + f2(h.at[128]) + ' 255=' + f2(h.at[255]), []);

/* ---- the selector channels ---------------------------------------------- */
{
  const bandNote = 'acts on a BAND CHANGE only';
  const houseDetail = houseBands.map(h=>h.from + '-' + h.to + '=' +
    (h.n === 1 ? h.dress : h.n === 0 ? 'NOTHING ANSWERED' : h.n + ' SCENES ANSWERED') +
    (h.same ? '' : ' ENDS-DISAGREE')).join(' ');
  row(HOUSE_BAND_CH, 'BEETLEJUICE house selector', 'dressing',
      dressScene ? houseDetail : 'nothing in this production answers it',
      [dressScene ? 'on scene ' + dressScene.scene : null,
       dressScene ? bandNote + ', and a first frame from a dead universe IS a change, to ' +
                    houseBands[0].dress : null]);

  /* RULING EZ — TWO LINES, NOT ONE.  The sign is a fly: a target and a speed,
     the same idiom as every lineset, and every number on both lines came out
     of `artSign` rather than out of the ruling's prose. */
  const signHauled = hauled.length
    ? 'the rail hauls ' + hauled.join(', ') + ' from here, so that scene takes no mover channel'
    : null;
  if(signDrive){
    const named = signDrive.stops.length
      ? signDrive.stops.map(s=>s.byte + '=' + s.name).join(' ')
      : 'the show declares no named stops';
    row(SIGN_T_CH, 'BEETLEJUICE sign (fly extra bjSign)', 'target',
        '0=' + f2(signDrive.lo) + 'm 128=' + f2(signDrive.mid) + 'm 255=' + f2(signDrive.hi) + 'm',
        ['stops: ' + named,
         'dead while speed byte ' + SIGN_S_CH + ' is 0',
         signHauled]);
    row(SIGN_S_CH, 'BEETLEJUICE sign (fly extra bjSign)', 'speed',
        '0=PARKED (no target is commanded; the speed is written as 0) 255=' + signDrive.full +
        ' m/s, the haul\'s OWN declared speed',
        ['PARKED here is SILENCE, not a stop: the sign is a scene mover, so a haul ' +
         'the show started runs on to its stop']);
  } else {
    row(SIGN_T_CH, 'BEETLEJUICE sign', 'target',
        'no sign is declared by this production', [signHauled]);
    row(SIGN_S_CH, 'BEETLEJUICE sign', 'speed',
        'no sign is declared by this production', []);
  }

  const travWho = travDriven
    ? 'traveler on line ' + flyRows[travDriven.i].id + ' ' + flyRows[travDriven.i].label
    : 'traveler — no line in this production carries one';
  row(TRAV_CH, travWho, 'open',
      travDriven ? '0=shut 255=open   draws ' + f2(travRate.rate) + ' of its full draw a second, ' +
                   travRate.panels + ' panels, each travelling ' + f2(travRate.metres) + 'm in that second'
                 : 'nothing answers it in this production',
      travDriven ? ['PARKED by line ' + flyRows[travDriven.i].id + '\'s own speed byte ' +
                      (flyRows[travDriven.i].base + 1),
                    'THE LINE MOVES WITH THE SHOW — on the standing hang it is line ' +
                      (travBare ? travBare.id + ' ' + travBareGoods : 'NONE')]
                 : []);

  /* RULING FC — the proscenium neon.  Four lines, and the numbers on them are
     read back off SHOW.bjPortal after driving artPros. */
  const prosNote = 'the NEON BAR only (bj:portalFrame) — not the gold arch and not the black portal, ' +
                   'neither of which is a lit thing and both of whose materials are shared';
  const prosNames = ['intensity', 'red', 'green', 'blue'];
  for(let i = 0; i < 4; i++){
    row(PROSB + i, 'proscenium neon', prosNames[i],
        prosDrive ? (i === 0 ? '0=' + f2(prosDrive.lo) + ' 128=' + f2(prosDrive.mid) +
                               ' 255=' + f2(prosDrive.hi)
                             /* MEASURED, not typed: each colour byte is driven
                                alone and its own component read back */
                             : '0=' + f2(prosDrive.colLo[i - 1]) +
                               ' 255=' + f2(prosDrive.colHi[i - 1]))
                  : 'no lit proscenium in this production — four dead channels',
        prosDrive ? (i === 0 ? [prosNote, 'RAW: the fader tracks, it does not crossfade (RULING EP)']
                             : [])
                  : []);
  }
}

/* ---- the set movers ----------------------------------------------------- */
for(const r of mvRows){
  const who = 'set mover ' + r.scene + ':' + r.part + ' (' + r.axis + ')';
  const notes = [];
  notes.push(packAffected.indexOf(r.ch) >= 0
    ? 'STAND-IN METRES — bjWingPack re-points this channel when a model file lands'
    : 'stand-in metres, no model file loaded');
  if(r.unproved)
    notes.push('ONE-WAY: any byte from 1 flies it in, none flies it out' +
               ' (travel too short for the channel self-check to tell it apart)');
  row(r.ch, who, 'target',
      (zeroIsNoCommand ? '0=no command (any other byte HOLDS this set every frame, so the show cannot move it) '
                       : '0=' + f2(r.at[0]) + 'm ') +
      '1=' + f2(r.at[1]) + 'm 128=' + f2(r.at[128]) + 'm 255=' + f2(r.at[255]) + 'm' +
      (r.declaresOut ? '' : ' (no out declared, so 255 is 0 on its own axis)'),
      notes);
}

/* SELF-CHECK 10 — RULING FA ITSELF: one line per channel, in numeric order,
   from the first channel to the last one in use, and NO GAPS.  This is what
   fires the day a ruling inserts a channel and forgets to give it a line —
   which is exactly what RULING EZ does to the selector block. */
const LAST_CH = mvRows.length ? mvRows[mvRows.length - 1].ch : MVB - 1;
for(let i = 0; i < ROWS.length; i++){
  const want = FIXB + i;
  if(ROWS[i].ch !== want)
    throw new Error('SELF-CHECK 10 FAILED (RULING FA): the list is one line per channel with ' +
      'no gaps, and row ' + (i + 1) + ' is channel ' + ROWS[i].ch + ' where ' + want +
      ' was due' + (ROWS[i].ch > want
        ? ' — channels ' + want + '..' + (ROWS[i].ch - 1) + ' have no line at all'
        : ' — a channel is listed twice'));
}
if(!ROWS.length || ROWS[ROWS.length - 1].ch !== LAST_CH)
  throw new Error('SELF-CHECK 10 FAILED (RULING FA): the list ends at channel ' +
    (ROWS.length ? ROWS[ROWS.length - 1].ch : 'nothing') + ' and the last channel in use is ' +
    LAST_CH);

/* ---------------------------------------------------------------------------
   THE OUTPUT.  Two header lines and then the list: the built file's byte size
   (the probe rule, and the suite compares it) and which show is loaded (the
   mover lines and the lineset goods are that show's).  RULING FA asks for
   nothing else, so there is nothing else.

   The column widths are COMPUTED off the rows, so a longer fixture name or a
   fifteenth lineset re-aligns the whole file instead of staggering it.
   ------------------------------------------------------------------------- */
const L = [];
const out = s => L.push(s === undefined ? '' : s);

out('THE BUILT FILE  the-house.html  ' + fs.statSync(HOUSE_FILE).size +
    ' bytes  (generated by tools/artnet-map.js)');
out('UNIVERSE 0 — the Palace only (RULING EN); on any other stage packets are counted and nothing is written');
out('SHOW LOADED  ' + SHOW_KEY.toUpperCase() +
    '  (the set mover lines and the lineset goods are this show\'s)');
out();

const CHW = String(LAST_CH).length;
const SW = ROWS.reduce((m, r)=>Math.max(m, r.subject.length), 0);
const FW = ROWS.reduce((m, r)=>Math.max(m, r.fn.length), 0);
for(const r of ROWS){
  let line = pad(r.ch, CHW) + '  ' + padR(r.subject, SW) + ' — ' + padR(r.fn, FW) + '  ' + r.detail;
  for(const n of r.notes) line += '   ' + n;
  out(line.replace(/[ ]+$/, ''));
}

process.stdout.write(L.join('\n') + '\n');
