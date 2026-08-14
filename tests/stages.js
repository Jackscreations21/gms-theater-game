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
  /* PMREMGenerator is CORE three.js, not an addon, and RULING DK builds the
     room environment with it at load — so fromScene runs in every suite.  It
     asks the renderer for exactly these four things and this stub had none of
     them.  An incomplete stub is a fault in the harness, not a reason to make
     the game degrade: with them, fromScene completes and scene.environment is
     a real texture here as well as in a browser.
     getClearColor MUTATES ITS TARGET and does not merely return it (r128
     three.js :17534 does target.copy).  A version that returns the argument
     untouched leaves PMREM reading its own module-level Color, which is WHITE,
     while a real renderer clears BLACK — so a stubbed run would build a white
     environment from a scene with no background and report success. */
  compile(){}
  getRenderTarget(){ return this._rt || null; }
  setRenderTarget(t){ this._rt = t || null; }
  getClearColor(c){ return c.set(0x000000); }
};
w.THREE = THREE;
w.AudioContext = undefined;
w.requestAnimationFrame = cb => { w.__raf = cb; return 1; };

const probe = `
;(function(){
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  window.__errs = [];
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,210):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); if(e.stack) console.log('      '+e.stack.split('\\n').slice(1,4).join(' | ')); window.__errs.push(name+': '+e.message); } };
  const run = (n, dt)=>{ for(let i=0;i<n;i++){ updateArc(dt); updateFades(dt); updateFly(dt); updateStorm(dt); } };

  console.log('--- RULING DY: what the empty house submits ---');
  /* THE PIECE tools/draws.js DELIBERATELY WITHHELD.  RULING DX measured the
     empty Palace and could not pin it: a probe prints, it does not fail.  This
     is the ceiling, and it runs FIRST in this suite on purpose — nothing has
     switched a stage or loaded a production yet, so the scene is in the state
     the probe measures and the number is comparable to the one in tools/.

     WHY IT IS NOT A CALL INTO THE PROBE.  A pin that shares its counting code
     with the instrument it pins agrees with itself whatever either of them
     does (TRAPS, twice).  This is an independent re-implementation of r128
     projectObject (three.js r128:17954-18024): visible false prunes above the
     recursion, layers gate the node, a drawable is submitted when
     frustumCulled is false OR its geometry sphere hits the frustum, and an
     array material pushes once per group.

     PER EYE, at 90 degrees on a square panel, which is the Quest figure and
     the WIDER frustum — the desk camera at 60 degrees on a letterbox window
     is the flattering one, and there is no multiview, so a frame costs two of
     these passes. */
  P('RULING DY: the empty Palace stays under its submitted-draw ceiling', ()=>{
    /* MEASURED 294 an eye on this build; 350 with RULING DY backed out
       (BODY_MERGE false), which is what the ceiling has to be able to say.
       26 of slack — about 9% — is room for a bar of lanterns or a wing of
       architecture without a fight, and still 30 clear of the piece-built
       number, so an un-merge cannot hide inside the tolerance. */
    const DY_CEIL = 320;
    Player.mode = 'walk';
    Player.pos.set(0, 0, 13); Player.yaw = 0; Player.pitch = 0.02; Player.vel.set(0, 0, 0);
    updateRooms(true);
    const tick = n=>{ for(let i=0;i<n;i++){ const cb=window.__raf; window.__raf=null; if(cb) cb(Date.now()+i*16); } };
    tick(8);
    /* re-seat the player after the frames, because updatePlayer moves it */
    Player.pos.set(0, 0, 13); Player.yaw = 0; Player.pitch = 0.02; Player.vel.set(0, 0, 0);
    tick(2);
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    const eye = new THREE.PerspectiveCamera(90, 1.0, 0.08, 300);
    eye.matrixWorld.copy(camera.matrixWorld);
    eye.matrixWorldInverse.copy(eye.matrixWorld).invert();
    eye.updateProjectionMatrix();
    const fr = new THREE.Frustum().setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(eye.projectionMatrix, eye.matrixWorldInverse));
    const sph = new THREE.Sphere();
    const pushes = o=>{
      const m = o.material;
      if(Array.isArray(m)){
        let n = 0;
        const grs = (o.geometry && o.geometry.groups) || [];
        for(const gr of grs){ const gm = m[gr.materialIndex]; if(gm && gm.visible) n++; }
        return n;
      }
      return (m && m.visible) ? 1 : 0;
    };
    const inFr = o=>{
      if(o.isSprite) return fr.intersectsSprite(o);
      const g = o.geometry;
      if(!g) return false;
      if(!g.boundingSphere) g.computeBoundingSphere();
      if(!g.boundingSphere) return false;
      sph.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
      return fr.intersectsSphere(sph);
    };
    let draws = 0, all = 0;
    (function rec(o){
      if(o.visible === false) return;
      if(o.layers.test(camera.layers) && (o.isMesh || o.isLine || o.isPoints || o.isSprite)){
        all += pushes(o);
        if(o.frustumCulled === false || inFr(o)) draws += pushes(o);
      }
      for(const c of o.children) rec(c);
    })(scene);
    /* A CEILING THAT NOTHING REACHES IS NOT A MEASUREMENT (TRAPS).  If the walk
       ever finds nothing, or finds the whole building, it is the walk that
       broke and the ceiling would pass or fail for the wrong reason. */
    if(draws < 100) throw new Error('only ' + draws + ' draws an eye — the walk is measuring nothing');
    if(draws >= all) throw new Error('the frustum rejected nothing at all (' + draws + ' of ' + all + ')');
    if(draws > DY_CEIL)
      throw new Error(draws + ' draws an eye at the boot view against a ceiling of ' + DY_CEIL +
        ' — a lantern body is meant to be one draw per material group (RULING DY, BODY_MERGE); ' +
        'run tools/draws.js against the built file to see which block grew');
    return draws + ' draws/eye, ' + (draws*2) + ' a frame, ceiling ' + DY_CEIL +
           ' (of ' + all + ' visible in the building)';
  });

  console.log('--- the fly rail, through its own buttons ---');

  const rows = ()=>Array.prototype.slice.call(
    document.querySelectorAll('#lsTable tbody tr'));
  const rowBtn = (tr, text)=>Array.prototype.slice.call(tr.querySelectorAll('button'))
    .find(b=>b.textContent === text);
  const click = el=>{ const e = new window.MouseEvent('click', {bubbles:true}); el.dispatchEvent(e); };

  console.log('--- speaker bars ---');
  P('every stage hangs an L+R speaker pair', ()=>{
    goToView(3);
    if(typeof SPKBARS === 'undefined' || !SPKBARS || !SPKBARS.L || !SPKBARS.R)
      throw new Error('no speaker bars at the palace');
    const pal = SPKBARS;
    goToView(15);
    if(!SPKBARS || SPKBARS === pal) throw new Error('two stages share one speaker pair');
    goToView(3);
    if(SPKBARS !== pal) throw new Error('the palace pair did not come back');
    return 'per-stage pairs';
  });
  P('a parked pair does not move', ()=>{
    goToView(3);
    const pal = SPKBARS;
    spkBarStep('L', -1);
    goToView(15);
    const y0 = pal.L.y;
    for(let i=0;i<60;i++) updateRig(0.05, 1);
    if(pal.L.y !== y0) throw new Error('the parked palace bar moved on its own');
    goToView(3);
    for(let i=0;i<60;i++) updateRig(0.05, 1);
    if(!(SPKBARS.L.y < SPKBARS.L.max - 0.5)) throw new Error('the live bar never travelled');
    SPKBARS.L.target = SPKBARS.L.max;
    for(let i=0;i<400;i++) updateRig(0.05, 1);
    return 'parked holds, live travels';
  });
  P('speaker boxes come to hand at the bottom of travel', ()=>{
    goToView(3);
    const b = SPKBARS.L;
    const floor = houseFloorY(b.z);
    // six boxes hang SPK_DROP + half a box below the pipe
    const lowestBox = b.min - SPK_DROP - 0.23;
    if(lowestBox - floor > 1.8) throw new Error('lowest box stops '+(lowestBox-floor).toFixed(2)+'m up');
    if(b.wires[0].scale.y < 1) throw new Error('no drop wires');
    return 'boxes reach '+(lowestBox-floor).toFixed(2)+'m';
  });
  P('six boxes to an array, each on its own point', ()=>{
    goToView(3);
    ['L','R'].forEach(side=>{
      const b = SPKBARS[side];
      if(!b.points || b.points.length !== 6)
        throw new Error(side+' has '+(b.points?b.points.length:0)+' points, wanted 6');
      const empty = b.points.filter(p=>!p.body);
      if(empty.length) throw new Error(empty.length+' points on '+side+' hang nothing');
    });
    /* one grille material across every box — a fresh material per box was
       the old leak */
    const mats = new Set();
    SPKBARS.L.points.concat(SPKBARS.R.points).forEach(p=>{
      p.body.traverse(o=>{ if(o.isMesh && o.geometry.type==='PlaneGeometry') mats.add(o.material); });
    });
    if(mats.size !== 1) throw new Error(mats.size+' grille materials across 12 boxes');
    return '12 boxes, 12 points, one grille material';
  });
  P('the desktop rows drive the bars', ()=>{
    goToView(3);
    buildFlyUI();
    const spkRows = Array.prototype.slice.call(document.querySelectorAll('#lsTable tfoot tr.spkbar'));
    if(spkRows.length !== 2) throw new Error(spkRows.length+' spkbar rows, wanted 2');
    const btn = Array.prototype.slice.call(spkRows[0].querySelectorAll('button')).find(b=>b.textContent==='LOWER');
    if(!btn) throw new Error('no LOWER on the L row');
    const y0 = SPKBARS.L.target;
    btn.dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
    if(!(SPKBARS.L.target < y0)) throw new Error('the click moved nothing');
    SPKBARS.L.target = SPKBARS.L.max;
    for(let i=0;i<400;i++) updateRig(0.05, 1);
    return 'rows wired';
  });

  P('every lineset on every stage wakes up locked off', ()=>{
    /* a counterweight rail at rest is locked off — all three stages boot
       with every lock thrown, before anything has been called */
    const out = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio'],[3,'palace']]){
      goToView(view);
      const un = FLY.filter(l=>!l.locked).length;
      if(un) throw new Error(key+': '+un+' of '+FLY.length+' linesets started unlocked');
      out.push(key);
    }
    return out.slice(0,3).join(', ')+' — locked off at rest';
  });

  P('the table on screen belongs to the stage you are on', ()=>{
    const out = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio'],[3,'palace']]){
      goToView(view);
      refreshFlyUI();
      const tb = document.querySelector('#lsTable tbody');
      if(rows().length !== FLY.length)
        throw new Error(rows().length+' rows for '+FLY.length+' linesets');
      /* the important one: every row the table is showing must belong to a
         lineset of THIS stage, and every lineset of this stage must own a
         row that is still in the document */
      for(let i=0;i<FLY.length;i++){
        const ls = FLY[i];
        if(!ls.ui) throw new Error(key+': lineset '+ls.id+' has no row');
        if(!ls.ui.row.parentNode)
          throw new Error(key+': lineset '+ls.id+' is wired to a row that is not on screen');
        if(rows()[i] !== ls.ui.row)
          throw new Error(key+': row '+(i+1)+' on screen belongs to another stage');
      }
      if(tb.dataset.stage !== key)
        throw new Error('standing in '+key+' the table says '+tb.dataset.stage);
      out.push(key);
    }
    return out.join(' → ');
  });

  P('pressing IN and OUT on a row moves that lineset', ()=>{
    goToView(3);
    refreshFlyUI();
    const ls = FLY[4];
    flyOut(ls); run(900, 0.05);
    click(rowBtn(rows()[4], 'IN'));
    run(900, 0.05);
    if(Math.abs(ls.pos - inTrimOf(ls)) > 0.2)
      throw new Error('IN left it at '+ls.pos.toFixed(2)+', the trim is '+inTrimOf(ls));
    click(rowBtn(rows()[4], 'OUT'));
    run(900, 0.05);
    if(Math.abs(ls.pos - OUT_TRIM) > 0.2)
      throw new Error('OUT left it at '+ls.pos.toFixed(2));
    return 'in to '+inTrimOf(ls).toFixed(1)+'m and out to '+OUT_TRIM.toFixed(1)+'m from the buttons';
  });

  P('and it still works after walking to another theatre and back', ()=>{
    /* This is the one that was broken, and it only shows up if you press the
       button that is ACTUALLY ON SCREEN.  Reaching for ls.ui.row gets you the
       lineset's own cached row — which still fires correctly even when it has
       been detached from the document — so the test passed while the rail in
       front of the player did nothing.  Go through the table instead.     */
    goToView(3);   refreshFlyUI();
    goToView(15);  refreshFlyUI();
    goToView(3);   refreshFlyUI();
    const ls = FLY[6];
    flyOut(ls); run(900, 0.05);
    const arcBefore = STAGES.arcMain.fly.map(l=>+l.pos.toFixed(2));
    const tr = rows()[6];
    if(!tr) throw new Error('there is no seventh row on screen');
    click(rowBtn(tr, 'IN'));
    run(900, 0.05);
    if(Math.abs(ls.pos - inTrimOf(ls)) > 0.2)
      throw new Error('the row on screen did not move palace lineset 7: it is at '+
                      ls.pos.toFixed(2)+', the trim is '+inTrimOf(ls));
    const arcAfter = STAGES.arcMain.fly.map(l=>+l.pos.toFixed(2));
    const moved = arcAfter.filter((v,i)=>Math.abs(v - arcBefore[i]) > 0.05).length;
    if(moved) throw new Error(moved+' arc linesets moved from a palace button');
    return 'the row on screen moves the rail in front of you, not the one across town';
  });

  P('the row readout tracks the lineset it is wired to', ()=>{
    goToView(19); refreshFlyUI();
    const ls = FLY[3];
    flyOut(ls); run(900, 0.05); syncFlyUI();
    const outTxt = rows()[3].querySelector('.ht').textContent;
    flyIn(ls);  run(900, 0.05); syncFlyUI();
    const inTxt = rows()[3].querySelector('.ht').textContent;
    if(outTxt === inTxt) throw new Error('the readout says '+inTxt+' either way');
    /* the glass reads ft-in (build-feel RULING S): compare the STRING the
       formatter makes of the model — never parse the display back */
    if(inTxt !== ftIn(ls.pos))
      throw new Error('the readout says '+inTxt+' and it is at '+ls.pos.toFixed(2));
    return 'reads '+outTxt+' out and '+inTxt+' in';
  });

  P('hanging from the palette goes on the selected lineset of this stage', ()=>{
    goToView(15); refreshFlyUI();
    click(rows()[9]);                           // select it
    if(selLineset !== FLY[9]) throw new Error('the row click did not select it');
    goToView(19); refreshFlyUI();
    if(selLineset && FLY.indexOf(selLineset) === -1)
      throw new Error('the studio still has the main house lineset selected');
    click(rows()[9]);
    hangGoods(selLineset, 'legSL');
    if(FLY[9].goodsKey !== 'legSL') throw new Error('it hung on the wrong lineset');
    if(STAGES.arcMain.fly[9].goodsKey === 'legSL')
      throw new Error('it hung on the main house as well');
    hangGoods(FLY[9], 'none');
    return 'selection follows you, and the goods land on the rail in front of you';
  });

  console.log('--- the FOH bar hangs in all three houses ---');

  P('a bar spans the FOH lanterns on every stage', ()=>{
    const out = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      if(STAGE !== key) throw new Error('expected to be at '+key);
      if(typeof FOHBAR === 'undefined' || !FOHBAR) throw new Error(key+': no live FOH bar');
      updateRig(0.05, 1);
      scene.updateMatrixWorld(true);
      const foh = FIXTURES.filter(f=>f.name.indexOf('FOH ') === 0);
      if(foh.length !== 6) throw new Error(key+': '+foh.length+' FOH lanterns');
      let pipe = null;
      FOHBAR.group.traverse(o=>{ if(o.isMesh && o.geometry.parameters &&
        Math.abs((o.geometry.parameters.radiusTop||0) - 0.055) < 1e-6 &&
        (o.geometry.parameters.height||0) > 10) pipe = o; });
      if(!pipe) throw new Error(key+': the bar has no pipe mesh');
      const bp = pipe.getWorldPosition(new THREE.Vector3());
      const half = pipe.geometry.parameters.height/2;
      /* the bar hangs over THIS house's stalls in world space — height is
         the only state, so nothing can leak a building over (the M12 trap) */
      const ox = (STAGES[key].venue === 'arc') ? ARC.X + STAGES[key].cx : 0;
      if(Math.abs(bp.x - ox) > 1) throw new Error(key+': the bar is at world x '+bp.x.toFixed(1));
      for(const f of foh){
        const p = f.group.getWorldPosition(new THREE.Vector3());
        if(Math.abs(bp.y - (p.y + 0.45)) > 0.02)
          throw new Error(key+': '+f.name+' is not hanging 0.45 under the bar ('+
                          bp.y.toFixed(2)+' vs '+p.y.toFixed(2)+')');
        if(Math.abs(p.x - bp.x) > half + 0.01)
          throw new Error(key+': '+f.name+' hangs past the end of the pipe');
        if(Math.abs(p.z - bp.z) > 0.02)
          throw new Error(key+': '+f.name+' still floats on the old bow curve at z '+p.z.toFixed(2));
        if(f._org.distanceTo(p) > 0.5)
          throw new Error(key+': '+f.name+' emits from somewhere it is not');
      }
      if(!(FOHBAR.min > 2 && FOHBAR.min < FOHBAR.max - 0.4))
        throw new Error(key+': a useless clamp, '+FOHBAR.min.toFixed(2)+' .. '+FOHBAR.max.toFixed(2));
      out.push(key+' bar y '+bp.y.toFixed(2)+' clamp '+FOHBAR.min.toFixed(2));
    }
    goToView(3);
    return out;
  });

  P('each stage keeps its own bar where you left it', ()=>{
    goToView(3);
    fohBarTo(FOHBAR.min);
    for(let i=0;i<400;i++) updateRig(0.05, 1);
    const palaceLow = FOHBAR.y;
    if(!(palaceLow < FOHBAR.max - 0.8))
      throw new Error('the palace bar never came down: '+palaceLow.toFixed(2));
    goToView(15);
    if(FOHBAR === STAGES.palace.fohBar) throw new Error('two stages share one bar');
    if(Math.abs(FOHBAR.y - FOHBAR.max) > 0.01)
      throw new Error('the palace call moved the main house bar to '+FOHBAR.y.toFixed(2));
    for(let i=0;i<100;i++) updateRig(0.05, 1);
    if(Math.abs(STAGES.palace.fohBar.y - palaceLow) > 1e-6)
      throw new Error('the parked palace bar moved on its own');
    goToView(3);
    if(Math.abs(FOHBAR.y - palaceLow) > 0.01)
      throw new Error('the palace bar is at '+FOHBAR.y.toFixed(2)+
                      ', it was left at '+palaceLow.toFixed(2));
    fohBarTo(FOHBAR.max);
    for(let i=0;i<400;i++) updateRig(0.05, 1);
    return 'palace parked low at '+palaceLow.toFixed(2)+', the arc stayed home, both came back';
  });

  console.log('--- FOH bar: wires to the roof, lanterns to hand ---');

  P('palace wires anchor at the real ceiling', ()=>{
    goToView(3);
    if(FOHBAR.wireTop !== D.ceilY)
      throw new Error('wireTop '+FOHBAR.wireTop+' — the ceiling is '+D.ceilY);
    const want = FOHBAR.wireTop - FOHBAR.y;
    if(Math.abs(FOHBAR.wires[0].scale.y - want) > 0.02)
      throw new Error('wire is '+FOHBAR.wires[0].scale.y.toFixed(2)+'m, needs '+want.toFixed(2));
    return 'anchored at '+FOHBAR.wireTop+'m';
  });

  P('palace lanterns come to hand at the bottom of travel', ()=>{
    goToView(3);
    const floor = houseFloorY(FOHBAR.z);
    const lanternAtMin = FOHBAR.min - 0.45;
    if(lanternAtMin - floor > 1.7)
      throw new Error('lowest lantern is '+(lanternAtMin-floor).toFixed(2)+'m over the stalls floor');
    return 'lanterns reach '+(lanternAtMin-floor).toFixed(2)+'m';
  });

  P('the arc keeps its own anchor and reach', ()=>{
    goToView(15);
    if(FOHBAR.wireTop > 15.95)
      throw new Error('arc wireTop '+FOHBAR.wireTop+' is through the 15.95 soffit');
    const want = FOHBAR.wireTop - FOHBAR.y;
    if(Math.abs(FOHBAR.wires[0].scale.y - want) > 0.02)
      throw new Error('arc wire is '+FOHBAR.wires[0].scale.y.toFixed(2)+'m, needs '+want.toFixed(2));
    const H = ARC.houses.main;
    const row = Math.max(0, (H.zPros + FOHBAR.z - H.rake.zFirst)/H.rake.RUN);
    const floor = H.rake.Y0 + row*H.rake.RISE + 0.2;
    if(FOHBAR.min - 0.45 - floor > 1.7)
      throw new Error('arc lanterns stop '+(FOHBAR.min-0.45-floor).toFixed(2)+'m up');
    goToView(3);
    return 'ok';
  });

  console.log('--- how dark it gets ---');

  /* everything reaching a point on the stage: the two beds, every real light
     in range, and every unlit fitting you can see from there */
  const litness = (st)=>{
    const sx = (st.venue === 'arc' ? ARC.X : 0) + st.cx;
    const at = new THREE.Vector3(sx, 1.5, st.zPros - 6);
    let n = ambient.intensity + hemi.intensity;
    if(ARC.built && st.venue === 'arc') n += ARC.amb.intensity + ARC.hemi.intensity;
    const seen = o=>{ let p=o; while(p){ if(!p.visible) return false; p=p.parent; } return true; };
    scene.traverse(o=>{
      if(!o.isLight || !o.intensity) return;
      if(o.isAmbientLight || o.isHemisphereLight) return;
      if(!seen(o)) return;
      /* only what is in the room with you — the Palace's foyer chandeliers
         are thirty metres away through a shut door and have no business in
         a measurement of how dark its stage is */
      const d = o.getWorldPosition(new THREE.Vector3()).distanceTo(at);
      if(d < 26) n += o.intensity * (1 - d/26);
    });
    return n;
  };
  const blackout = ()=>{
    HOUSE.house = 0; HOUSE.work = 0; HOUSE.practical = 0;
    FIXTURES.forEach(f=>{ f.level = 0; f.lvlDur = 0; f.lvlTo = 0; });
    for(let i=0;i<80;i++){ updateFades(0.05); updateArc(0.05); }
    updateRig(0.05, 1);
    updateStageHouseLights();
    scene.updateMatrixWorld(true);
  };

  P('an arc house in a blackout is as dark as the palace in a blackout', ()=>{
    const out = {};
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      blackout();
      out[key] = +litness(STAGES[key]).toFixed(3);
    }
    for(const k of ['arcMain','arcStudio']){
      if(out[k] > out.palace + 0.01)
        throw new Error(k+' sits at '+out[k]+' in a blackout, the palace at '+out.palace);
      // and dark in absolute terms, not merely no worse than somewhere else
      if(out[k] > 0.02)
        throw new Error(k+' is at '+out[k]+' with everything out — that is not a blackout');
    }
    return out;
  });

  P('and nothing but the safety fittings is still lit', ()=>{
    goToView(15);
    blackout();
    const H = ARC.houses.main;
    const on = ARC.glow.filter(g=>g.room === 'main' && !g.keep &&
                               g.mesh.material.color.getHex() !== 0 &&
                               g.mesh.material.color.r > g.base.r*0.25);
    if(on.length) throw new Error(on.length+' fittings in the main house are still burning');
    const exits = ARC.glow.filter(g=>g.room === 'main' && g.keep);
    if(!exits.length) throw new Error('the main house has no exit signs at all');
    if(exits.some(g=>g.mesh.material.color.r < g.base.r*0.4))
      throw new Error('the exit signs went out with everything else');
    return exits.length+' safety fittings still on, nothing else';
  });

  P('the foyer stays lit while the house it opens onto is black', ()=>{
    goToView(15);
    setArcHouse(1);
    blackout();
    if(ARC.lights.some(l=>l.light.intensity < 0.5))
      throw new Error('the foyer went dark with the house');
    const foyer = ARC.glow.filter(g=>g.room === 'lobby');
    if(foyer.some(g=>g.mesh.material.color.r < g.base.r*0.5))
      throw new Error('the foyer fittings went out with the house');
    // but its bed light must not be lifting the auditorium
    if(ARC.amb.intensity > 0.001)
      throw new Error('the foyer bed light is at '+ARC.amb.intensity.toFixed(3)+
                      ' inside a blacked-out house');
    return 'foyer at full, house black, bed at '+ARC.amb.intensity.toFixed(3);
  });

  P('and the house lights still come up when you ask for them', ()=>{
    for(const [view, key] of [[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      blackout();
      const dark = litness(STAGES[key]);
      HOUSE.house = 1;
      for(let i=0;i<80;i++){ updateFades(0.05); updateArc(0.05); }
      updateRig(0.05, 1); updateStageHouseLights();
      const lit = litness(STAGES[key]);
      if(lit < dark + 0.5)
        throw new Error(key+' only went from '+dark.toFixed(2)+' to '+lit.toFixed(2));
      HOUSE.house = 0;
    }
    return 'both houses go from black to full and back';
  });

  console.log('--- the rig points at its own stage ---');

  P('every lantern aims at the stage it is hung in', ()=>{
    const out = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const st = STAGES[key];
      const sx = (st.venue === 'arc' ? ARC.X : 0) + st.cx;
      scene.updateMatrixWorld(true);
      let worst = 0, worstName = '';
      for(const f of FIXTURES){
        if(f.mover) continue;
        const d = Math.abs(f.aim.x - sx);
        if(d > worst){ worst = d; worstName = f.name; }
      }
      if(worst > 20)
        throw new Error(st.label+': '+worstName+' aims '+worst.toFixed(0)+
                        'm off the centre line — the rig is pointing at another building');
      out.push(st.label+': furthest aim '+worst.toFixed(1)+'m off centre ('+worstName+')');
    }
    return out;
  });

  P('and the beams actually land on the deck', ()=>{
    const out = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const st = STAGES[key];
      const sx = (st.venue === 'arc' ? ARC.X : 0) + st.cx;
      HOUSE.house = 0;
      FIXTURES.forEach(f=>{ f.level = 1; f.lvlDur = 0; });
      run(60, 0.05);
      updateRig(0.05, 1);
      scene.updateMatrixWorld(true);
      /* follow each beam down to y=0 and see where it meets the boards */
      let onStage = 0, total = 0;
      for(const f of FIXTURES){
        if(f.mover || f.type === 'cyc') continue;
        const dir = f._dir;
        if(dir.y > -0.06) continue;
        total++;
        const dist = (0 - f._org.y)/dir.y;
        const hx = f._org.x + dir.x*dist, hz = f._org.z + dir.z*dist;
        if(Math.abs(hx - sx) < 18 && hz < st.zPros + 4 && hz > st.zPros - AS.DEPTH - 2) onStage++;
      }
      if(total < 5) throw new Error(st.label+' has only '+total+' downward beams');
      if(onStage < total*0.6)
        throw new Error(st.label+': only '+onStage+' of '+total+' beams land on the stage');
      out.push(st.label+': '+onStage+'/'+total+' on the boards');
      FIXTURES.forEach(f=>{ f.level = 0; });
    }
    return out;
  });

  P('a cue aimed at the middle of the opening hits the middle of the opening', ()=>{
    const out = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const st = STAGES[key];
      const sx = (st.venue === 'arc' ? ARC.X : 0) + st.cx;
      aimFrontAt([1,2,3,4,5,6], 0, 7.2, -1.0);
      const c = chan(3);
      if(Math.abs(c.aim.x - sx) > 6)
        throw new Error(st.label+': aimFrontAt(0,...) put channel 3 at x='+
                        c.aim.x.toFixed(0)+', the centre line is '+sx.toFixed(0));
      if(Math.abs(c.aim.z - (st.zPros - 1.0)) > 0.5)
        throw new Error(st.label+': it aimed at z='+c.aim.z.toFixed(1)+
                        ', the plaster line is '+st.zPros);
      out.push(st.label+': ('+c.aim.x.toFixed(0)+', '+c.aim.z.toFixed(1)+')');
    }
    return out;
  });

  P('the floor pools land on the stage, not next door', ()=>{
    goToView(15);
    HOUSE.house = 0;
    FIXTURES.forEach(f=>{ f.level = 1; f.lvlDur = 0; });
    run(60, 0.05); updateRig(0.05, 1);
    scene.updateMatrixWorld(true);
    const st = STAGES.arcMain, sx = ARC.X + st.cx;
    const lit = FIXTURES.filter(f=>f.pool && f.pool.visible);
    if(!lit.length) throw new Error('not one floor pool is showing on the arc stage');
    for(const f of lit){
      const p = f.pool.getWorldPosition(new THREE.Vector3());
      if(Math.abs(p.x - sx) > 22)
        throw new Error(f.name+' put its pool at x='+p.x.toFixed(0)+', the stage is at '+sx.toFixed(0));
    }
    FIXTURES.forEach(f=>{ f.level = 0; });
    return lit.length+' pools, all of them on the arc main stage';
  });

  console.log('--- everything stands on the deck ---');

  P('every stage has its floor at the same height', ()=>{
    const out = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const st = STAGES[key];
      const x = (st.venue === 'arc' ? ARC.X : 0) + st.cx;
      const y = groundAt(x, st.zPros - 6, 6.0);
      if(y === null) throw new Error(st.label+' has no stage floor');
      if(Math.abs(y) > 0.15)
        throw new Error(st.label+' deck is at '+y.toFixed(2)+'m — every set in the game '+
                        'is built for a deck at 0');
      out.push(st.label+': '+y.toFixed(2)+'m');
    }
    return out;
  });

  P('a set sits at the same height whichever stage it loads onto', ()=>{
    /* The honest measure.  A set may legitimately contain pieces built with
       negative offsets, so "is anything below zero" tells you nothing — but
       the SAME production on three stages must come out at exactly the same
       height on all three.  A deck a metre out shows up here immediately. */
    const out = [];
    for(const show of ['lostboys','goeswrong','outsiders','hamilton']){
      const lows = {};
      for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
        goToView(view);
        if(!showLoad(show)) throw new Error(show+' would not load at '+key);
        SHOW.group.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(SHOW.group);
        lows[key] = +b.min.y.toFixed(3);
      }
      const vals = Object.keys(lows).map(k=>lows[k]);
      const spread = Math.max.apply(null, vals) - Math.min.apply(null, vals);
      if(spread > 0.05)
        throw new Error(show+' sits at '+JSON.stringify(lows)+
                        ' — '+spread.toFixed(2)+'m apart between stages');
      out.push(show+' @ '+vals[0].toFixed(2));
    }
    for(const view of [3, 15, 19]){ goToView(view); showStrike(); }
    return out;
  });

  P('and what you can stand on in a set is on the deck, not under it', ()=>{
    const bad = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      showLoad('lostboys');
      SHOW.group.updateMatrixWorld(true);
      for(const o of SHOW.walk){
        const b = new THREE.Box3().setFromObject(o);
        if(b.isEmpty()) continue;
        if(b.min.y < -0.35)
          bad.push(STAGES[key].label+': a walkable piece reaches '+b.min.y.toFixed(2)+'m');
      }
      showStrike();
    }
    if(bad.length) throw new Error(bad.slice(0,3).join('; '));
    return 'every deck and gallery in the set is at or above the boards';
  });

  P('the fly trims measure from the same deck everywhere', ()=>{
    const out = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const ls = FLY.find(l=>l.goodsKey === 'legs') || FLY[2];
      hangGoods(ls, 'legs');
      flyIn(ls); run(900, 0.05);
      ls.group.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(ls.goods);
      if(b.min.y < -0.4)
        throw new Error(STAGES[key].label+': a leg at its in trim reaches '+
                        b.min.y.toFixed(2)+'m, through the deck');
      if(b.min.y > 0.8)
        throw new Error(STAGES[key].label+': a leg at its in trim stops '+
                        b.min.y.toFixed(2)+'m short of the deck');
      out.push(STAGES[key].label+': '+b.min.y.toFixed(2)+'m');
    }
    return out;
  });

  P('the dock pad is level with the deck you wheel onto', ()=>{
    const out = [];
    for(const [view, key] of [[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const H = ARC.houses[STAGES[key].arcHouse];
      const pad = groundAt(ARC.X + (H.dock.inner + H.dock.outer)/2, H.dock.z, 6.0);
      const deck = groundAt(ARC.X + H.cx, H.zPros - 6, 6.0);
      if(pad === null || deck === null) throw new Error(H.label+' is missing a floor');
      if(Math.abs(pad - deck) > 0.2)
        throw new Error(H.label+': the pad is at '+pad.toFixed(2)+
                        ' and the deck at '+deck.toFixed(2)+' — a step to wheel over');
      out.push(H.label+': pad '+pad.toFixed(2)+', deck '+deck.toFixed(2));
    }
    return out;
  });

  P('you look up at the stage from the front row', ()=>{
    const out = [];
    for(const [view, key] of [[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const H = ARC.houses[STAGES[key].arcHouse];
      const front = groundAt(ARC.X + H.cx, H.zPros + 4.5, 6.0);
      const deck  = groundAt(ARC.X + H.cx, H.zPros - 6, 6.0);
      if(front >= deck)
        throw new Error(H.label+': the front row is at '+front.toFixed(2)+
                        ', the deck at '+deck.toFixed(2)+' — you look down on it');
      out.push(H.label+': front row '+(deck - front).toFixed(2)+'m below the deck');
    }
    return out;
  });

  console.log('--- one board, three stages ---');

  P('there are three of them and they know each other apart', ()=>{
    const keys = Object.keys(STAGES);
    if(keys.length !== 3) throw new Error(keys.length+' stages: '+keys.join(', '));
    for(const k of keys){
      const st = STAGES[k];
      const n = (k === STAGE) ? FIXTURES.length : st.fixtures.length;
      const f = (k === STAGE) ? FLY.length      : st.fly.length;
      if(n < 20) throw new Error(st.label+' has '+n+' channels');
      if(f !== 14) throw new Error(st.label+' has '+f+' linesets');
    }
    return keys.map(k=>STAGES[k].label);
  });

  P('walking into a theatre patches the board to it', ()=>{
    goToView(1);
    if(STAGE !== 'palace') throw new Error('at the palace the board is '+STAGE);
    goToView(14);
    if(STAGE !== 'arcMain') throw new Error('in the arc main house the board is '+STAGE);
    goToView(18);
    if(STAGE !== 'arcStudio') throw new Error('in the studio the board is '+STAGE);
    goToView(11);
    if(STAGE !== 'arcStudio') throw new Error('the foyer took the board off a stage');
    goToView(3);
    if(STAGE !== 'palace') throw new Error('back at the palace the board is '+STAGE);
    return 'palace → main → studio → foyer keeps the last → palace';
  });

  P('the channels you see are the ones in the room with you', ()=>{
    const where = {};
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const f = chan(9);                       // a wash channel
      if(!f) throw new Error('no channel 9 at '+key);
      f.group.updateMatrixWorld(true);
      const p = f.group.getWorldPosition(new THREE.Vector3());
      where[key] = [Math.round(p.x), Math.round(p.z)];
    }
    // each one has to be in its own building, on its own centre line
    if(Math.abs(where.palace[0]) > 12) throw new Error('the palace rig is at x='+where.palace[0]);
    for(const k of ['arcMain','arcStudio']){
      const st = STAGES[k];
      if(Math.abs(where[k][0] - (ARC.X + st.cx)) > 12)
        throw new Error(k+' rig is at x='+where[k][0]+', the house is at '+(ARC.X+st.cx));
      if(where[k][1] > st.zPros + 2)
        throw new Error(k+' rig is downstage of its own proscenium');
    }
    return where;
  });

  P('setting a level only lights the stage you are on', ()=>{
    goToView(15);
    setLevel(9, 1, 0); setLevel(10, 1, 0);
    run(60, 0.05);
    const mainUp = STAGES.arcMain.fixtures.length ? null : chan(9).level;
    if(chan(9).level < 0.9) throw new Error('the channel did not come up');
    const lit = FIXTURES.filter(f=>f.level > 0.5).length;
    goToView(3);                                  // over to the palace
    const palaceLit = FIXTURES.filter(f=>f.level > 0.5).length;
    if(palaceLit) throw new Error(palaceLit+' palace channels came up with the arc ones');
    goToView(15);
    if(chan(9).level < 0.9) throw new Error('the arc levels were lost on the way back');
    setLevel(9, 0, 0); setLevel(10, 0, 0); run(40, 0.05);
    return lit+' up in the arc main house, none at the palace, and still there on the way back';
  });

  P('the fly rail is the rail of the room you are in', ()=>{
    // put the palace's lineset 5 somewhere unmistakable first
    goToView(3);
    flyTo(FLY[4], 8.0); run(600, 0.05);
    const palaceAt = FLY[4].pos;
    if(Math.abs(palaceAt - 8.0) > 0.3) throw new Error('the palace one would not move');
    // then send the arc's to the other end
    goToView(15);
    flyOut(FLY[4]); run(600, 0.05);
    if(Math.abs(FLY[4].pos - OUT_TRIM) > 0.3)
      throw new Error('the arc one did not fly out, it is at '+FLY[4].pos.toFixed(1));
    goToView(3);
    if(Math.abs(FLY[4].pos - palaceAt) > 0.3)
      throw new Error('the palace lineset 5 moved to '+FLY[4].pos.toFixed(1)+
                      ' when the arc one went out');
    goToView(15);
    if(Math.abs(FLY[4].pos - OUT_TRIM) > 0.3) throw new Error('the arc one came back by itself');
    return 'palace 5 at '+palaceAt.toFixed(1)+'m, arc 5 at '+OUT_TRIM.toFixed(1)+
           'm, neither touching the other';
  });

  P('the linesets are over the right stage', ()=>{
    const out = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const st = STAGES[key];
      FLY[0].group.updateMatrixWorld(true);
      const p = FLY[0].group.getWorldPosition(new THREE.Vector3());
      const wantX = (key === 'palace') ? 0 : ARC.X + st.cx;
      if(Math.abs(p.x - wantX) > 1) throw new Error(key+' lineset 1 is at x='+p.x.toFixed(0));
      if(Math.abs(p.z - (st.zPros - 0.5)) > 1)
        throw new Error(key+' lineset 1 is at z='+p.z.toFixed(1)+', the plaster line is '+st.zPros);
      out.push(st.label+': ('+p.x.toFixed(0)+', '+p.z.toFixed(0)+')');
    }
    return out;
  });

  P('a show loads onto the stage you are standing on', ()=>{
    goToView(15);
    if(!showLoad('goeswrong')) throw new Error('it would not load');
    if(!SHOW.group) throw new Error('nothing was built');
    SHOW.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(SHOW.group);
    const c = box.getCenter(new THREE.Vector3());
    const st = STAGES.arcMain;
    if(Math.abs(c.x - (ARC.X + st.cx)) > 14)
      throw new Error('it was built at x='+c.x.toFixed(0)+', the arc main house is at '+
                      (ARC.X + st.cx).toFixed(0));
    if(c.z > st.zPros + 4)
      throw new Error('it was built downstage of the proscenium, at z='+c.z.toFixed(0));
    if(CUES.length < 15) throw new Error('the plot did not come with it: '+CUES.length+' cues');
    return 'built at ('+c.x.toFixed(0)+', '+c.z.toFixed(0)+') with '+CUES.length+' cues';
  });

  P('two shows on two stages at once, neither aware of the other', ()=>{
    goToView(15);  showLoad('goeswrong');
    const arcKey = SHOW.key, arcCues = CUES.length;
    goToView(3);   showLoad('outsiders');
    const palKey = SHOW.key, palCues = CUES.length;
    if(palKey !== 'outsiders') throw new Error('the palace has '+palKey);
    if(STAGES.arcMain.show.key !== 'goeswrong')
      throw new Error('the arc lost its show, it has '+STAGES.arcMain.show.key);
    goToView(15);
    if(SHOW.key !== arcKey) throw new Error('the arc show did not come back');
    if(CUES.length !== arcCues) throw new Error('the arc cue stack changed under it');
    if(!SHOW.wrong || !SHOW.wrong.length) throw new Error('the arc set lost its hinges');
    goToView(3);
    if(SHOW.key !== 'outsiders') throw new Error('the palace show did not come back');
    if(CUES.length !== palCues) throw new Error('the palace cue stack changed');
    return 'the play at the arc, the outsiders at the palace, '+
           arcCues+' and '+palCues+' cues, both kept';
  });

  P('cues fire on the stage that owns them', ()=>{
    // whatever the palace happens to be doing, firing a cue at the arc must
    // not change it — so measure it rather than assuming it is dark
    goToView(3);
    const before = FIXTURES.map(f=>+f.level.toFixed(3));
    goToView(15);
    fireCue(2); run(120, 0.05);
    const arcLit = FIXTURES.filter(f=>f.level > 0.1).length;
    if(!arcLit) throw new Error('the cue did nothing on its own stage');
    goToView(3);
    const after = FIXTURES.map(f=>+f.level.toFixed(3));
    const moved = after.filter((v,i)=>Math.abs(v - before[i]) > 0.02).length;
    if(moved) throw new Error(moved+' palace channels moved when an arc cue fired');
    return arcLit+' channels up in the arc, none of the palace channels moved';
  });

  P('each auditorium has its own house lights', ()=>{
    // take the studio's out while standing in it
    goToView(19);
    HOUSE.house = 0; updateStageHouseLights();
    if(ARC.houses.studio.lamps.some(l=>l.light.intensity > 0.05))
      throw new Error('the studio would not go out');
    // then walk next door and bring that one to full
    goToView(15);
    HOUSE.house = 1; updateStageHouseLights();
    if(!ARC.houses.main.lamps.every(l=>l.light.intensity > 0.5))
      throw new Error('the main house lamps stayed out');
    if(ARC.houses.studio.lamps.some(l=>l.light.intensity > 0.05))
      throw new Error('the studio came up with the main house');
    // and the studio is still out when you go back to it
    goToView(19);
    if(HOUSE.house > 0.02) throw new Error('the studio master was overwritten, it reads '+HOUSE.house);
    updateStageHouseLights();
    if(!ARC.houses.main.lamps.every(l=>l.light.intensity > 0.5))
      throw new Error('the main house went out when you left it');
    HOUSE.house = 0.7;
    return 'main house at full, studio out, at the same time, and both stay put';
  });

  P('the show curtain of one house does not cull the other', ()=>{
    goToView(15);
    const before = SHOW.key;
    goToView(19);
    updateRooms(true);
    if(!ARC.rooms.studio.visible) throw new Error('the studio is not being drawn while you stand in it');
    return 'rooms and stages agree';
  });

  P('the palace is exactly as it was', ()=>{
    goToView(1);
    if(STAGE !== 'palace') throw new Error('the board is '+STAGE);
    if(FIXTURES.length < 24) throw new Error(FIXTURES.length+' channels');
    if(FLY.length !== 14) throw new Error(FLY.length+' linesets');
    showLoad('lostboys');
    if(SHOW.key !== 'lostboys') throw new Error('it would not load');
    CUES.forEach((c,i)=>{ fireCue(i); run(30, 0.05); });
    run(300, 0.05);
    if(HOUSE.house < 0.4) throw new Error('the house did not come up at the end');
    showStrike();
    return 'loads, runs the whole stack and strikes clean';
  });

  P('the crew work at all three stages', ()=>{
    const out = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      if(!crewLoadShow('goeswrong')) throw new Error('they would not come to '+key);
      if(!CREW.running) throw new Error('nobody set off at '+key);
      if(!CREW.jobs.length) throw new Error('no jobs at '+key);
      out.push(STAGES[key].label+': '+CREW.jobs.length+' jobs');
      crewStop(true);
    }
    return out;
  });

  P('and they turn up in the right building', ()=>{
    for(const [view, key] of [[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      crewLoadShow('goeswrong');
      for(let i=0;i<80;i++) updateCrew(0.05);
      const live = CREW.people.filter(h=>h.group.visible);
      if(!live.length) throw new Error('nobody is visible at '+key);
      scene.updateMatrixWorld(true);
      const st = STAGES[key];
      for(const h of live){
        const p = h.group.getWorldPosition(new THREE.Vector3());
        if(Math.abs(p.x - (ARC.X + st.cx)) > 34)
          throw new Error(key+': a hand is at x='+p.x.toFixed(0)+
                          ', the house is at '+(ARC.X + st.cx).toFixed(0));
        if(p.z > st.zPros + 3)
          throw new Error(key+': a hand is out in the auditorium at z='+p.z.toFixed(0));
      }
      // and they are inside the room that is actually being drawn
      let root = CREW.group, inRoom = false;
      while(root){ if(root === ARC.rooms[st.room]) inRoom = true; root = root.parent; }
      if(!inRoom) throw new Error(key+': the crew are not in that house at all');
      crewStop(true);
    }
    goToView(3);
    return 'both arc crews walk their own stage, in their own room';
  });

  P('they open the dock door of the stage they are on', ()=>{
    goToView(15);
    arcDoorsAll(null, false);
    for(let i=0;i<300;i++) updateArc(0.05);
    crewLoadShow('goeswrong');
    for(let i=0;i<900;i++){ updateCrew(0.05); updateArc(0.05); }
    const main = ARC.doorMap.mainDock, studio = ARC.doorMap.studioDock;
    if(main.target < 0.5 && main.open < 0.5 && !CREW.running)
      throw new Error('the main house shutter never went up');
    if(studio.target > 0.5) throw new Error('they opened the studio shutter instead');
    crewStop(true);
    goToView(3);
    return 'the main house shutter, not the studio one';
  });

  P('a whole get-in on an arc stage puts the set on that stage', ()=>{
    goToView(19);
    crewLoadShow('goeswrong');
    for(let i=0;i<4000;i++){ updateCrew(0.05); updateArc(0.05); if(!CREW.running) break; }
    if(CREW.running) throw new Error('the get-in never finished');
    if(!SHOW.group) throw new Error('nothing was built');
    let hidden = 0;
    SHOW.group.children.forEach(o=>{ if(o.userData.crewHidden) hidden++; });
    if(hidden) throw new Error(hidden+' pieces were left on the lorry');
    SHOW.group.updateMatrixWorld(true);
    const c = new THREE.Box3().setFromObject(SHOW.group).getCenter(new THREE.Vector3());
    const st = STAGES.arcStudio;
    if(Math.abs(c.x - (ARC.X + st.cx)) > 14)
      throw new Error('the set ended up at x='+c.x.toFixed(0));
    if(c.z > st.zPros + 4) throw new Error('the set ended up at z='+c.z.toFixed(0));
    // and it is not the palace's set: a different group, in a different room
    const arcGroup = SHOW.group;
    goToView(3);
    if(SHOW.group === arcGroup)
      throw new Error('the palace and the studio are sharing one set');
    if(SHOW.group){
      SHOW.group.updateMatrixWorld(true);
      const pc = new THREE.Box3().setFromObject(SHOW.group).getCenter(new THREE.Vector3());
      if(Math.abs(pc.x - c.x) < 100)
        throw new Error('the palace set is at x='+pc.x.toFixed(0)+', same place as the studio');
    }
    return 'carried in and standing on the studio stage at ('+
           c.x.toFixed(0)+', '+c.z.toFixed(0)+')';
  });

  P('a walk-out mid get-in stands the crew down on their own stage', ()=>{
    /* earlier tests abandon get-ins with crewStop(true), which by design
       leaves the work light up and the snapshot parked — start clean */
    CREW.savedLook = null; CREW.savedHouse = null;
    for(const v of [15, 3]){ goToView(v); HOUSE.work = 0; }
    showStrike();
    crewLoadShow('goeswrong');            // work light on, snapshot parked
    for(let i=0;i<40;i++) updateCrew(0.05);
    if(!CREW.running) throw new Error('the crew never set off');
    if(!CREW.savedLook) throw new Error('no work-light snapshot was taken');
    const mainDock = ARC.doorMap.mainDock.target;
    const arcFly = STAGES.arcMain.fly.map(l=>+l.target.toFixed(2)).join(',');
    goToView(15);                          // walk out mid-job
    if(CREW.running) throw new Error('the crew followed the board to the arc');
    if(CREW.savedLook) throw new Error('the work-light snapshot is still parked');
    if(HOUSE.work > 0.05) throw new Error('the arc is in the palace crew work light');
    if(STAGES.palace.house.work > 0.05)
      throw new Error('the palace parked stuck in work light at '+STAGES.palace.house.work);
    for(let i=0;i<200;i++) updateCrew(0.05);
    if(ARC.doorMap.mainDock.target !== mainDock)
      throw new Error('the crew opened the arc dock');
    if(FLY.map(l=>+l.target.toFixed(2)).join(',') !== arcFly)
      throw new Error('the crew are flying the arc rail');
    goToView(3); showStrike();
    return 'stood down at the boundary, show look home, arc untouched';
  });

  P('the load list is the stage\\'s own, not the show\\'s last', ()=>{
    goToView(3); showLoad('goeswrong');
    const palaceParts = crewLoads()[0].parts[0];
    goToView(15); showLoad('goeswrong');
    const arcParts = crewLoads()[0].parts[0];
    if(arcParts === palaceParts) throw new Error('two stages share one load list');
    goToView(3);
    const again = crewLoads()[0].parts[0];
    if(again === arcParts) throw new Error('the palace crew were handed the arc list');
    let p = again, inPalace = false;
    while(p){ if(p === SHOW.group) inPalace = true; p = p.parent; }
    if(!inPalace) throw new Error('the palace list points at pieces not on its stage');
    for(const v of [15, 3]){ goToView(v); showStrike(); }
    return 'each stage builds its own list';
  });

  P('a stock load-in at the arc builds the set at the arc', ()=>{
    goToView(15);
    showStrike();
    crewStart('in');                       // no show loaded: the stock plan
    for(let i=0;i<6000;i++){ updateCrew(0.05); updateArc(0.05); if(!CREW.running) break; }
    if(CREW.running) throw new Error('the stock get-in never finished');
    if(!SET.length) throw new Error('nothing was built');
    scene.updateMatrixWorld(true);
    const st = STAGES.arcMain;
    for(const p of SET){
      const w = p.group.getWorldPosition(new THREE.Vector3());
      if(Math.abs(w.x - (ARC.X + st.cx)) > 16)
        throw new Error(p.label+' was built at world x='+w.x.toFixed(0));
    }
    crewStart('out');
    for(let i=0;i<6000;i++){ updateCrew(0.05); updateArc(0.05); if(!CREW.running) break; }
    if(SET.length) throw new Error(SET.length+' pieces left after the load out');
    goToView(3);
    return 'built at the arc, struck at the arc';
  });

  P('loose scenery is per-deck: a show load clears only its own stage', ()=>{
    goToView(3);
    showStrike();
    const pal = placeScenic('chair', 2, -3);
    goToView(15);
    const o = stageOrigin();
    const arc = placeScenic('table', o.x + 1, o.z - 4);
    showLoad('goeswrong');                 // must clear THIS deck for the set
    if(SET.indexOf(arc) !== -1) throw new Error('the arc deck was not cleared for the show');
    if(SET.indexOf(pal) === -1) throw new Error('loading at the arc struck the palace piece');
    showStrike();
    goToView(3);
    if(SET.indexOf(pal) === -1) throw new Error('the palace piece is gone');
    strikePiece(pal);
    return 'the arc cleared its own deck and left the palace alone';
  });

  P('the palette and FOCUS raycast the deck of the stage you are on', ()=>{
    goToView(15);
    const dk = stageDeck();
    if(dk === deck) throw new Error('the arc is still using the palace deck');
    scene.updateMatrixWorld(true);
    const w = dk.getWorldPosition(new THREE.Vector3());
    if(Math.abs(w.x - (ARC.X + STAGES.arcMain.cx)) > 5)
      throw new Error('the arc main deck is at x='+w.x.toFixed(0));
    goToView(3);
    if(stageDeck() !== deck) throw new Error('the palace is not using its own deck');
    return 'each board raycasts its own deck';
  });

  P('SHOW has one shape: blank after a strike, replaced whole at a swap', ()=>{
    goToView(3);
    showLoad('lostboys');                // writes wall, dropKey, neonT …
    showStrike();
    const blank = Object.keys(showBlank()).sort().join(',');
    const now = Object.keys(SHOW).sort().join(',');
    if(now !== blank) throw new Error('after a strike SHOW carries strays: '+now);
    SHOW.__marker = 1;                   // an ad-hoc key, like a show would write
    goToView(15);
    if('__marker' in SHOW) throw new Error('a palace key leaked onto the arc SHOW');
    goToView(3);
    if(SHOW.__marker !== 1) throw new Error('the palace SHOW lost its own key');
    delete SHOW.__marker;
    return 'blank after strike, wholesale at the swap';
  });

  P('the fly rail and the chip say which board you are at', ()=>{
    const seen = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      refreshStageNames(); refreshStageChip();
      const el = document.getElementById('flyStageName');
      const chip = document.getElementById('stageChip');
      if(!el || el.textContent !== STAGES[key].label)
        throw new Error('the rail header says "'+(el && el.textContent)+'" at '+key);
      if(!chip || chip.textContent.indexOf(STAGES[key].label) < 0)
        throw new Error('the chip says "'+(chip && chip.textContent)+'" at '+key);
      seen.push(el.textContent);
    }
    return seen;
  });

  P('the same show on two stages does not strike the other one bare', ()=>{
    goToView(15); showLoad('goeswrong');
    const arcKey = SHOW.curtainKey;
    goToView(19); showLoad('goeswrong');       // the same production, next door
    if(!GOODS[arcKey]) throw new Error('loading it next door removed the first one');
    showStrike();                              // strike the studio
    goToView(15);
    if(!GOODS[FLY[0].goodsKey])
      throw new Error('striking the studio took the main house cloth out of the catalogue');
    syncFlyUI();                               // this is what used to fall over
    showStrike();
    // it may still be up at the palace from an earlier call — clear every
    // stage and only then should it leave the catalogue
    for(const v of [3, 15, 19]){ goToView(v); showStrike(); }
    if(GOODS[arcKey]) throw new Error('the last one out did not clean up after itself');
    for(const v of [3, 15, 19]){
      goToView(v);
      const orphan = FLY.filter(ls=>ls.goodsKey !== 'none' && !GOODS[ls.goodsKey]);
      if(orphan.length)
        throw new Error(STAGES[STAGE].label+' has '+orphan.length+
                        ' linesets pointing at goods that no longer exist');
      syncFlyUI();
    }
    return 'both hang it, the first strike leaves it, the last one clears it';
  });

  P('a running show script halts when the board patches away', ()=>{
    goToView(3);
    runProgram('fade 0\\nat 1 thru 6 @ 80\\nwait 60\\nat 1 thru 6 @ 0');
    stepProgram(0.016);
    if(!Prog.running) throw new Error('the program never ran');
    goToView(15);
    if(Prog.running) throw new Error('the program followed the board to the arc');
    const lv = FIXTURES.map(f=>f.level).join(',');
    for(let i=0;i<200;i++) stepProgram(0.05);
    if(FIXTURES.map(f=>f.level).join(',') !== lv)
      throw new Error('a halted program is still driving the arc rig');
    goToView(3);
    for(let c=1;c<=6;c++) setLevel(c, 0, 0);
    return 'halted at the swap, the arc rig untouched';
  });

  P('an armed cue follow is cancelled when the board patches away', ()=>{
    goToView(3);
    const base = CUES.length;
    CUES.push({n:98, label:'armed', fade:0, follow:5, lx:null, fly:null, sfx:null,
               house:HOUSE.house, work:HOUSE.work, practical:HOUSE.practical, haze:RIG.haze});
    fireCue(base);
    if(followTimer === null) throw new Error('the follow never armed');
    goToView(15);
    if(followTimer !== null) throw new Error('the follow survived the swap');
    goToView(3);
    CUES.splice(base, 1);
    nextCue = 0; refreshCues();
    return 'armed at the palace, cancelled at the walk';
  });

  P('DELETE CUE after a walk cannot splice the other stage\\'s stack', ()=>{
    goToView(3);
    selCue = 2;                                // select a cue on the palace board
    goToView(15);
    if(selCue === 2) throw new Error('the selection walked to the arc with the board');
    const arcCues = CUES.length;
    click(document.querySelector('#btnDelQ')); // DELETE CUE with nothing selected here
    if(CUES.length !== arcCues) throw new Error('DELETE CUE spliced the arc stack');
    goToView(3);
    if(selCue !== 2) throw new Error('the palace selection did not come back');
    selCue = -1; refreshCues();
    return 'the selection parks with its stage';
  });

  P('a lineset mid-travel parks quiet and finishes after the walk back', ()=>{
    goToView(3);
    const ls = FLY[4];
    flyOut(ls); run(900, 0.05);
    flyIn(ls);  run(3, 0.05);              // just enough to get it moving
    if(!ls.moving) throw new Error('the lineset never started moving');
    goToView(15);
    if(STAGES.palace.fly[4].moving)
      throw new Error('the parked lineset still says its motor is running');
    goToView(3);
    run(900, 0.05);
    if(Math.abs(ls.pos - inTrimOf(ls)) > 0.2)
      throw new Error('it never finished its travel, at '+ls.pos.toFixed(2));
    flyOut(ls); run(900, 0.05);
    return 'motor flag cleared at the walk, travel finished on return';
  });

  P('the rain rumble does not follow you out of the building', ()=>{
    goToView(3); showLoad('outsiders');
    SHOW.rain.target = 1; updateStorm(0.05);
    if(!SHOW.rainSound) throw new Error('the rain never flagged its sound on');
    goToView(15);
    if(SHOW.rainSound) throw new Error('the arc thinks the rain is sounding');
    if(STAGES.palace.show.rainSound)
      throw new Error('the parked flag was not cleared — it can never re-arm');
    goToView(3);
    updateStorm(0.05);
    if(!SHOW.rainSound) throw new Error('the rain did not re-arm on return');
    SHOW.rain.target = 0; updateStorm(0.05); showStrike();
    return 'stopped at the walk, re-armed on return';
  });

  P('a show at the arc rigs its smoke in the arc, not the palace', ()=>{
    goToView(19);                    // the studio
    showLoad('outsiders');           // rigs FRAME SL/SR and the GALLERY hazer
    if(!SHOW.smoke || !SHOW.smoke.length) throw new Error('the show rigged no smoke');
    scene.updateMatrixWorld(true);
    const st = STAGES.arcStudio;
    for(const u of SHOW.smoke){
      const p = u.group.getWorldPosition(new THREE.Vector3());
      if(Math.abs(p.x - (ARC.X + st.cx)) > 20)
        throw new Error(u.name+' is at world x='+p.x.toFixed(0)+' — the palace, not the studio');
    }
    showStrike(); goToView(3);
    return 'every unit inside the studio walls';
  });

  P('each stage has its own smoke rack, parked and resumed across the walk', ()=>{
    goToView(3);
    const palaceUnits = SMOKE.units, palaceGroup = SMOKE.group;
    if(!palaceUnits.length) throw new Error('the palace has no machines');
    setSmoke(SMOKE.units[0], 0.8);                    // leave a fogger running
    for(let i=0;i<200;i++) updateSmoke(0.05);
    const hazeBefore = SMOKE.haze;
    if(hazeBefore < 0.02) throw new Error('the fogger never fed the haze');
    goToView(15);                                     // walk to the arc main
    if(SMOKE.units === palaceUnits) throw new Error('the arc is showing the palace rack');
    if(SMOKE.group === palaceGroup) throw new Error('one smoke group serves two stages');
    if(SMOKE.units.length < 4) throw new Error('the arc main got no house kit');
    if(SMOKE.haze > 0.001)
      throw new Error('the palace haze followed the board: '+SMOKE.haze.toFixed(3));
    scene.updateMatrixWorld(true);
    for(const u of SMOKE.units){
      const p = u.group.getWorldPosition(new THREE.Vector3());
      if(Math.abs(p.x - (ARC.X + STAGES.arcMain.cx)) > 20)
        throw new Error(u.name+' is at world x='+p.x.toFixed(0));
    }
    goToView(3);                                      // and back
    if(SMOKE.units !== palaceUnits) throw new Error('the palace rack did not come back');
    if(Math.abs(SMOKE.haze - hazeBefore) > 1e-6)
      throw new Error('the parked haze changed while we were away');
    setSmoke(SMOKE.units[0], 0); smokeClear();
    return 'palace haze '+hazeBefore.toFixed(2)+' parked and resumed, arc kit its own';
  });

  P('striking a show at one stage leaves the other stage\\'s show smoke rigged', ()=>{
    goToView(3); showLoad('outsiders');
    const palaceSmoke = SHOW.smoke.slice();
    if(!palaceSmoke.length) throw new Error('no smoke rigged at the palace');
    goToView(15); showLoad('outsiders');   // the same show next door
    showStrike();                          // struck next door
    for(const u of palaceSmoke)
      if(!u.group.parent) throw new Error(u.name+' was struck from the other building');
    goToView(3);
    if(!SHOW.smoke.length) throw new Error('the palace show lost its smoke list');
    if(SMOKE.units.indexOf(palaceSmoke[0]) < 0)
      throw new Error('the palace rack lost the show machines');
    showStrike();
    return 'the palace units survived an arc strike';
  });

  P('600 frames walking all three stages with shows on two of them', ()=>{
    goToView(15); showLoad('goeswrong');
    goToView(1);  showLoad('hamilton');
    let err = null;
    try{
      for(let i=0;i<600;i++){
        if(i === 100) goToView(15);
        if(i === 200) goToView(19);
        if(i === 300) goToView(11);
        if(i === 400) goToView(3);
        if(i === 500) goToView(14);
        updateFades(0.016); updateFly(0.016); updateStorm(0.016);
        updateSmoke(0.016); updateArc(0.016); updateRooms();
        updateStageHouseLights();
      }
    }catch(e){ err = e; }
    if(err) throw err;
    goToView(1);
    return 'no errors';
  });

  console.log('--- fixture bodies ---');
  P('every fixture type hangs from a real clamp', ()=>{
    // par is stocked, not hung — no rig hangs one today, but the order
    // screen (a later PR) sells them, so the builder must carry the clamp
    /* RULING DY: the clamp is a mesh the body still OWNS, but on four of the
       five it is now the merged steel shell the jaw became part of rather than
       a jaw of its own.  So the question the truthful version asks is not
       "is there an object here" — an orphan removed from the body would pass
       that — but "is it a mesh, and is it still under this body". */
    const missing = ['profile','fresnel','cyc','mover'].filter(t=>{
      const f = FIXTURES.find(x=>x.type===t);
      if(!f) return true;
      const c = f.body.userData.clamp;
      if(!c || !c.isMesh) return true;
      let p = c; while(p){ if(p === f.body) return false; p = p.parent; }
      return true;
    });
    if(typeof bodyPar !== 'function') missing.push('par');
    else { const pb = bodyPar(), pc = pb.userData.clamp;
      let ok = !!(pc && pc.isMesh), p = pc;
      while(ok && p){ if(p === pb) break; p = p.parent; if(!p) ok = false; }
      if(!ok) missing.push('par'); }
    if(missing.length) throw new Error('no clamp on: '+missing.join(', '));
    return '4 hung types + the stocked par, all clamped';
  });
  P('bodies share geometry across instances', ()=>{
    const profs = FIXTURES.filter(f=>f.type==='profile').slice(0,2);
    if(profs.length < 2) throw new Error('need two profiles to compare');
    const geoms = b=>{ const s=new Set(); b.traverse(o=>{ if(o.isMesh) s.add(o.geometry); }); return s; };
    const a = geoms(profs[0].body), bb = geoms(profs[1].body);
    /* RESTATED BY RULING DY, because the old form counted PIECES.  A profile
       held seventeen geometries and the test asked for ten or more shared;
       merged it holds three, so the threshold stopped saying anything about
       the cache and started saying something about the piece count.  The claim
       was never "many" — it is that NOTHING is minted per instance, which is
       what makes 117 bodies across three stages affordable.  So assert that
       instead: the same number of geometries on both, and every one of them
       the same object.  A merge that built its shell per body would fail this
       with three shared geometries out of three, which the old threshold could
       not have distinguished from success. */
    if(a.size !== bb.size)
      throw new Error('two profiles hold '+a.size+' and '+bb.size+' geometries — they are not built the same way');
    let shared = 0; a.forEach(g=>{ if(bb.has(g)) shared++; });
    if(shared !== a.size)
      throw new Error((a.size - shared)+' of '+a.size+' geometries are minted per body — the cache is not working');
    return a.size+' geometries, every one shared';
  });
  P('bodies stay inside the VR triangle budget', ()=>{
    const over = [];
    const count = b=>{ let tris = 0;
      b.traverse(o=>{ if(o.isMesh){ const p=o.geometry;
        tris += p.index ? p.index.count/3 : p.attributes.position.count/3; }});
      return tris; };
    ['profile','fresnel','cyc','mover'].forEach(t=>{
      const f = FIXTURES.find(x=>x.type===t);
      if(!f){ over.push(t+':missing'); return; }
      const tris = count(f.body);
      if(tris > 700) over.push(t+':'+Math.round(tris));
    });
    // par is stocked, not hung — build one and hold it to the same budget
    const pt = count(bodyPar());
    if(pt > 700) over.push('par:'+Math.round(pt));
    if(over.length) throw new Error('over budget: '+over.join(' '));
    return 'all under 700 tris';
  });
  P('RULING DY: the merged shell loses no geometry and moves none', ()=>{
    /* THE ONE THING BETWEEN THESE NUMBERS AND THE BUILD IS THE MERGE, and a
       merge is the kind of change that fails SILENTLY: a lantern that came out
       of it without its colour frame, or with a shutter handle baked at the
       wrong rotation, looks like a lantern and throws nothing.  Nothing else in
       nineteen suites would notice.

       Every figure below was measured on 274b267 — the piece-built build
       BEFORE this ruling — by walking each builder in isolation, with no beam
       and no glow attached.  Triangles are conserved by a correct merge
       (mergeParts expands an index, it does not drop a face), so a dropped
       piece shows up as a triangle deficit; a piece baked with the wrong
       transform moves the box.  The two together are what make it hard to lose
       something quietly.

       IF A BODY'S GEOMETRY IS DELIBERATELY CHANGED, re-measure and update the
       row.  This is a tripwire on the merge, not an opinion about the design —
       and it holds for the un-merged build too, which is the point: it tests
       losslessness, never merged-ness.  The draw ceiling at the top of this
       file is what tests merged-ness. */
    const WAS = {
      profile: {tris:514, min:[-0.222500, -0.222500, -0.262000], max:[0.222500, 0.485000, 0.615000]},
      fresnel: {tris:402, min:[-0.381586, -0.338931, -0.282000], max:[0.381586, 0.505000, 0.405890]},
      par:     {tris:454, min:[-0.180000, -0.180000, -0.252000], max:[0.180000, 0.475000, 0.420000]},
      cyc:     {tris:306, min:[-0.275000, -0.150000, -0.302000], max:[0.275000, 0.525000, 0.302000]},
      mover:   {tris:292, min:[-0.344000, -0.665000, -0.250000], max:[0.344000, 0.284000, 0.253000]},
      speaker: {tris: 26, min:[-0.310000, -0.230000, -0.270000], max:[0.310000, 0.290000, 0.271000]}
    };
    const MAKE = {profile:bodyProfile, fresnel:bodyFresnel, par:bodyPar, cyc:bodyCyc,
                  mover:bodyMover, speaker:bodySpeaker};
    const bad = [], shape = [];
    for(const k in WAS){
      if(typeof MAKE[k] !== 'function'){ bad.push(k+': no builder called body'+k); continue; }
      const g = MAKE[k]();
      g.updateMatrixWorld(true);
      let tris = 0, meshes = 0;
      g.traverse(o=>{ if(o.isMesh && o.geometry){ meshes++;
        const p = o.geometry;
        tris += p.index ? p.index.count/3 : p.attributes.position.count/3; }});
      tris = Math.round(tris);
      if(!meshes){ bad.push(k+' built nothing at all'); continue; }
      if(tris !== WAS[k].tris) bad.push(k+' is '+tris+' tris where the pieces were '+WAS[k].tris);
      const box = new THREE.Box3().setFromObject(g);
      ['x','y','z'].forEach((ax, i)=>{
        if(Math.abs(box.min[ax] - WAS[k].min[i]) > 1e-4)
          bad.push(k+' min.'+ax+' is '+box.min[ax].toFixed(6)+' where the pieces reached '+WAS[k].min[i]);
        if(Math.abs(box.max[ax] - WAS[k].max[i]) > 1e-4)
          bad.push(k+' max.'+ax+' is '+box.max[ax].toFixed(6)+' where the pieces reached '+WAS[k].max[i]);
      });
      shape.push(k+':'+meshes+'/'+tris);
    }
    if(bad.length) throw new Error('the merge is not lossless — '+bad.join('; '));
    /* and the handles still name meshes that are IN the body, so a re-pointed
       clamp can never be an orphan the merge left behind */
    for(const k of ['profile','fresnel','par','cyc','mover','speaker']){
      const g = MAKE[k]();
      for(const h of ['clamp','lens','base','yoke','head']){
        const v = g.userData[h];
        if(!v) continue;
        let p = v, inBody = false;
        while(p){ if(p === g){ inBody = true; break; } p = p.parent; }
        if(!inBody) throw new Error(k+' userData.'+h+' names something outside its own body');
      }
    }
    return 'meshes/tris ' + shape.join(' ');
  });
  P('RULING DY: the lens is still its own mesh and still repaints', ()=>{
    /* THE FAILURE THIS IS HERE FOR IS SILENT.  A lens merged into the shell
       keeps looking like a lens and never takes a colour again — the
       paint-roller head in TRAPS, which shipped once and threw nothing.
       Two halves, because the mechanism has two halves. */
    const f = FIXTURES.find(x=>x.type==='profile');
    if(!f) throw new Error('no profile in the rig to look at');
    const lens = f.body.userData.lens;
    if(!lens || !lens.isMesh) throw new Error('the profile has no lens mesh at all');
    if(lens.material === M.fixture || lens.material === M.steel)
      throw new Error('the lens is wearing a shell material — it went into the merge');
    if(!lens.geometry || lens.geometry.type !== 'CircleGeometry')
      throw new Error('the profile lens is no longer its own CircleGeometry');
    /* HALF ONE: a repaint is a pointer swap through the keyed cache, it takes,
       and it does not reach the next lantern along (INVARIANTS: shared
       materials are never tinted in place). */
    const was = lens.material, red = lensMat(0xcc2211);
    if(red === was) throw new Error('the premise is broken: the test colour is already the lens colour');
    lens.material = red;
    if(lens.material !== red) throw new Error('the lens would not take a new material');
    if(lensMat(0xcc2211) !== red) throw new Error('the keyed cache minted a second material for one colour');
    const others = FIXTURES.filter(x=>x.type==='profile' && x !== f);
    if(!others.length) throw new Error('the premise is broken: only one profile, so bleed cannot be seen');
    for(const o of others) if(o.body.userData.lens.material !== was)
      throw new Error('repainting one lens moved another body');
    lens.material = was;
    /* HALF TWO: THE GUARD, WITH THE FIXTURE THE RIG DOES NOT HAVE.  Every real
       body carries exactly one keyed-cache piece, so it is already alone in its
       material group and a group of one is never merged — meaning the
       exclusion in mergeShell has no live case and cannot be negative-checked
       against the rig (TRAPS: a bound nothing exercises is not a sound bound).
       Build the case it exists for: two lens-cache pieces and two
       shared-material pieces in one frame.  The two boxes must merge, or this
       proves nothing; the two lens planes must not. */
    const fr = new THREE.Group();
    const l1 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), lensMat(0x223344));
    const l2 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), lensMat(0x223344));
    l2.position.x = 2;
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), M.steel);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), M.steel);
    b2.position.x = 2;
    fr.add(l1); fr.add(l2); fr.add(b1); fr.add(b2);
    mergeShell('probeLensGuard', fr);
    if(fr.children.indexOf(b1) >= 0 || fr.children.indexOf(b2) >= 0)
      throw new Error('the premise is broken: mergeShell did not merge two shared-material boxes, so the lens half says nothing');
    if(fr.children.indexOf(l1) < 0 || fr.children.indexOf(l2) < 0)
      throw new Error('mergeShell merged two keyed-cache pieces — a repaint through the cache would be invisible');
    return 'lens separate, repaint took, and the cache guard holds against a two-piece frame';
  });
  P('the lens contract survives', ()=>{
    /* REVERSED IN PLACE BY RULING CY.  "Remove the body for the blinders just
       maek it basically comu out of the neon thing" — a blinder body is now an
       empty group, so it has no lens to carry, and it cannot: a lens is a mesh
       and there are no meshes.  Named as the exception rather than the rule
       loosened, so every body that HAS geometry still owes a lens. */
    const NO_BODY = ['blinder'];
    const bad = FIXTURES.filter(f=>NO_BODY.indexOf(f.type) < 0 && !f.body.userData.lens);
    if(bad.length) throw new Error(bad.length+' bodies lost userData.lens');
    /* and the exemption is not a licence to quietly empty another one */
    const empties = FIXTURES.filter(f=>{
      let m = 0; f.body.traverse(o=>{ if(o.isMesh) m++; }); return !m; });
    for(const f of empties) if(NO_BODY.indexOf(f.type) < 0)
      throw new Error(f.type + ' has no body geometry at all, and only ' + NO_BODY.join('/') + ' may');
    if(!empties.length) throw new Error('nothing is bodiless — RULING CY did not land');
    const m = FIXTURES.find(f=>f.type==='mover');
    if(!m.body.userData.base || !m.body.userData.yoke || !m.body.userData.head)
      throw new Error('mover lost base/yoke/head');
    return 'lens + mover parts intact';
  });

  console.log('--- the detach system ---');
  P('every lantern and PA box in the game is a registered body', ()=>{
    goToView(3);
    const hungFix = BODIES.filter(b=>b.kind!=='speaker' && b.state==='hung');
    const hungSpk = BODIES.filter(b=>b.kind==='speaker' && b.state==='hung');
    /* 39 a stage since RULING BC put the audience rig on every board: the 25
       that point at the stage, 8 blinders round the arch and 6 movers over the
       seating.  It was 75 (25 x 3) before that. */
    if(hungFix.length !== 117) throw new Error(hungFix.length+' lantern bodies, wanted 117 (39 x 3 stages)');
    if(hungSpk.length !== 36) throw new Error(hungSpk.length+' PA boxes, wanted 36 (12 x 3 stages)');
    const pal = BODIES.filter(b=>b.venue==='palace').length;
    const arc = BODIES.filter(b=>b.venue==='arc').length;
    /* 51 a stage: 39 lanterns + 12 PA boxes.  It was 37 before the audience
       rig, and the arc carries two stages' worth. */
    if(pal !== 51 || arc !== 102) throw new Error('venue split '+pal+'/'+arc+', wanted 51 palace / 102 arc');
    return '153 bodies: 51 palace, 102 arc, all hung';
  });
  P('an empty point is a dead channel — killed on the level path, never with visible', ()=>{
    goToView(3);
    FIXTURES.forEach(f=>{ f.level = 0; });
    const f = FIXTURES.find(x=>x.type==='fresnel' && x.ls>=0);
    f.level = 1;
    updateRig(0.05, 1);
    if(!(f._lvl > 0.5)) throw new Error('the channel is not live to begin with: '+f._lvl);
    if(!f.beam.visible) throw new Error('no beam before the test even starts');
    const b = BODIES.find(x=>x.mesh === f.body);
    unhangBody(b);
    updateRig(0.05, 1);
    if(f._lvl !== 0) throw new Error('unhung, the channel still reads '+f._lvl);
    if(f.beam.visible) throw new Error('unhung, the beam still draws');
    if(f.pool.visible) throw new Error('unhung, the floor pool still draws');
    if(f._live) throw new Error('unhung, it still holds a real light');
    if(f.level !== 1) throw new Error('the LEVEL was written — the gate must be the body, not the level');
    if(!f.group.visible) throw new Error('the point was hidden — visible is a drawing flag, not a gate (§5)');
    if(!hangBody(b, f)) throw new Error('it would not hang back on its own point');
    updateRig(0.05, 1);
    if(!(f._lvl > 0.5)) throw new Error('re-hung, the channel is still dead');
    f.level = 0;
    return 'dead while empty, live again on the pipe';
  });
  P('RULING A — the circuit lives in the pipe', ()=>{
    goToView(3);
    FIXTURES.forEach(f=>{ f.level = 0; });
    const foh = FIXTURES.find(x=>x.name.indexOf('FOH')===0);
    const e1  = FIXTURES.find(x=>x.type==='fresnel' && x.ls>=0);
    const bFoh = BODIES.find(x=>x.mesh===foh.body);
    const bE1  = BODIES.find(x=>x.mesh===e1.body);
    unhangBody(bFoh); unhangBody(bE1);
    if(!hangBody(bE1, foh)) throw new Error('the fresnel body would not take the FOH clamp');
    foh.level = 1;
    updateRig(0.05, 1);
    if(!(foh._lvl > 0.5)) throw new Error('a fresnel in the FOH point leaves FOH dead');
    if(e1._lvl !== 0) throw new Error('the body took its old channel with it — the circuit must stay in the pipe');
    unhangBody(bE1);
    if(!hangBody(bFoh, foh) || !hangBody(bE1, e1)) throw new Error('putting the rig back failed');
    foh.level = 0;
    updateRig(0.05, 1);
    return 'any body answers whatever the point is patched as';
  });
  P('rigging stays rigging — no PA box in a lantern clamp, no lantern on the bar', ()=>{
    goToView(3);
    const spkB = BODIES.find(b=>b.kind==='speaker' && b.venue==='palace' && b.state==='hung');
    const spkP = spkB.point;
    const boom = FIXTURES.find(x=>x.name.indexOf('BOOM')===0);
    const boomB = BODIES.find(x=>x.mesh===boom.body);
    unhangBody(spkB); unhangBody(boomB);
    if(hangBody(spkB, boom)) throw new Error('a PA box took a profile clamp');
    if(hangBody(boomB, spkP)) throw new Error('a lantern hung itself on the speaker bar');
    if(!hangBody(spkB, spkP) || !hangBody(boomB, boom)) throw new Error('putting them back failed');
    return 'the clamps know their own';
  });

  console.log('--- RULING DK: patching the board to a new stage ---');

  P('a stage the board has never been patched to still follows the light bed', ()=>{
    /* THE GAP THIS EXISTS FOR.  smokeRestore builds a stage fogger rack the
       FIRST time the board is patched there, so each Arc stage mints its own
       metalness-0.7 grilles long after init() collected the building.  A
       metallic grille is exactly what RULING DK is about, and nothing else
       would have healed it: only a show load or a strike rebuilds the registry,
       and patching the board to another stage is neither.

       RULING DT narrowed the environment to the metals, and this case was
       already about a metal: the vent grille is metalness .7 and stays a
       carrier, while the fogger body (.3) and its feet (0) do not — so the
       reachability half below still sweeps EVERY standard material and only the
       drive clauses take the carriers.  metals() reads ENV_METAL_MIN rather
       than a literal, so a retune of the threshold moves the test with it. */
    const ours = ()=>{
      const out = [], seen = [];
      scene.traverse(o=>{
        if(!o.isMesh || !o.material) return;
        const list = Array.isArray(o.material) ? o.material : [o.material];
        for(const m of list){
          if(!m || !m.isMeshStandardMaterial || seen.indexOf(m) >= 0) continue;
          seen.push(m); out.push(m);
        }
      });
      return out;
    };
    const metals = list=>list.filter(m=>m.metalness >= ENV_METAL_MIN);
    const home = STAGE;
    /* both Arc stages, because each builds its own rack the first time.  The
       guard is that the racks are STANDING and measurable, not a before/after
       delta: earlier cases in this suite have already walked the board round
       the building, and smokeRestore only builds once. */
    stageSwitch('arcMain', true);
    stageSwitch('arcStudio', true);
    const racks = [], rackMats = [];
    scene.traverse(o=>{ if(o.name === 'smoke') racks.push(o); });
    if(racks.length < 3)
      throw new Error(racks.length + ' fogger racks standing — the Palace and both Arc stages ' +
                      'should each have built one, so this test is measuring nothing');
    for(const g of racks) g.traverse(o=>{
      if(!o.isMesh || !o.material) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for(const m of list)
        if(m && m.isMeshStandardMaterial && rackMats.indexOf(m) < 0) rackMats.push(m);
    });
    if(!rackMats.length)
      throw new Error('the racks carry no standard material — this test is measuring nothing');
    const after = ours();
    for(const m of rackMats)
      if(after.indexOf(m) < 0)
        throw new Error('a rack material is not reachable from the scene — the sweep would miss it');
    /* the grille is the subject, so prove one of the rack materials really is a
       carrier — otherwise the clauses below would be measuring the feet */
    if(!metals(rackMats).length)
      throw new Error('no rack material reads metalness ' + ENV_METAL_MIN + ' or over — ' +
                      'this case would measure the fogger body and prove nothing about DK');
    let clock = 0;
    const step = dt=>{ clock += dt; updateFades(dt); updateRig(dt, clock); };
    for(let i=0;i<30;i++) step(1/60);
    const carriers = metals(after);
    const stray = carriers.filter(m=>m.envMapIntensity !== ENV_LIVE || m.envMap !== ENV_TEX);
    /* and DT's other half at the same seam: a stage patch must not hand the
       environment to the fogger body or its feet */
    const leak = after.filter(m=>m.envMap && !(m.metalness >= ENV_METAL_MIN));
    if(stray.length){
      stageSwitch(home, true);
      throw new Error(stray.length + ' of ' + carriers.length + ' metals read ' +
                      stray[0].envMapIntensity + ' after a stage patch, against ENV_LIVE ' + ENV_LIVE);
    }
    if(leak.length){
      stageSwitch(home, true);
      throw new Error(leak.length + ' non-metals carry an envMap after a stage patch (first at ' +
                      'metalness ' + leak[0].metalness + ')');
    }
    /* AND THE CLAUSE THAT CAN ACTUALLY FAIL.  The racks above state the OUTCOME,
       but they cannot pin the swap: every case in this suite that loads a show
       rebuilds the registry, so by the time this runs the racks are driven
       whether the swap registered them or not — the negative check proved
       exactly that, which is a finding about the test and not about the code.
       So mint one material into the scene the way a first patch mints a rack,
       patch the board, and require the swap to have picked it up. */
    const probeMat = new THREE.MeshStandardMaterial({metalness:0.7, roughness:0.5});
    const probeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), probeMat);
    probeMesh.name = 'dk:swapProbe';
    scene.add(probeMesh);
    stageSwitch('arcMain', true);
    const missed = !ENV_MATS.has(probeMat);
    const value = probeMat.envMapIntensity, probeTex = probeMat.envMap;
    scene.remove(probeMesh);
    probeMesh.geometry.dispose(); probeMat.dispose();
    envRecollect();
    if(missed)
      throw new Error('geometry standing in the scene at the moment of a stage patch ' +
                      'never reached the registry');
    if(value !== ENV_LIVE)
      throw new Error('the swap registered it but left it at ' + value +
                      ', against ENV_LIVE ' + ENV_LIVE);
    if(probeTex !== ENV_TEX)
      throw new Error('the swap registered it but handed it envMap ' + probeTex + ' (DT)');
    const lit = ENV_LIVE;
    const keepH = HOUSE.house, keepW = HOUSE.work, keepP = HOUSE.practical;
    HOUSE.house = 0; HOUSE.work = 0; HOUSE.practical = 0;
    FIXTURES.forEach(f=>{ f.level = 0; });
    for(let i=0;i<90;i++) step(1/60);
    const dark = ENV_LIVE;
    const darkStray = carriers.filter(m=>m.envMapIntensity !== dark);
    HOUSE.house = keepH; HOUSE.work = keepW; HOUSE.practical = keepP;
    stageSwitch(home, true);
    if(darkStray.length)
      throw new Error(darkStray.length + ' metals stuck at ' + darkStray[0].envMapIntensity +
                      ' through a blackout after a stage patch');
    if(!(lit > dark + 0.01))
      throw new Error('nothing moves: lit ' + lit.toFixed(4) + ' against a blackout ' + dark.toFixed(4));
    return rackMats.length + ' Arc rack materials among ' + after.length + ' (' + carriers.length +
           ' carrying the environment), all driven, blackout ' + dark.toFixed(3) +
           ' -> lit ' + lit.toFixed(3);
  });

  console.log('--- RULING DQ: a dropped light belongs to ONE stage ---');

  P('DQ: a dropped light parks with its stage and never follows the board', ()=>{
    const home = STAGE;
    stageSwitch('palace', true);
    const before = FIXTURES.length;
    const p = lightAdd({kind:'SpotLight', pos:{x:0, y:7, z:-2}, aim:{x:0, y:7.2, z:-1}});
    stageSwitch('arcMain', true);
    if(FIXTURES.indexOf(p) !== -1) throw new Error('the Palace drop followed the board to the Arc');
    if(p.group.parent === rigGroup) throw new Error('and it is hanging in the Arc rig as well');
    /* landmine 2: the plot is in STAGE coordinates and the aim is in WORLD.  A
       light dropped in the Arc must be aimed at the Arc, not back at the Palace */
    const st = STAGES.arcMain;
    const a = lightAdd({kind:'SpotLight', pos:{x:0, y:7, z:-2}, aim:{x:0, y:7.2, z:-1}});
    const wantX = ARC.X + st.cx, wantZ = st.zPros - 1;
    if(Math.abs(a.aim.x - wantX) > 0.02)
      throw new Error('an Arc drop is aimed at x '+a.aim.x.toFixed(2)+', not the Arc at '+wantX.toFixed(2));
    if(Math.abs(a.aim.z - wantZ) > 0.02)
      throw new Error('an Arc drop is aimed at z '+a.aim.z.toFixed(2)+', not '+wantZ.toFixed(2));
    const ab = BODIES.filter(b=>b.point === a);
    if(ab.length !== 1) throw new Error('an Arc drop filed '+ab.length+' bodies');
    if(ab[0].venue !== 'arc')
      throw new Error('a lantern dropped in the Arc is filed as '+ab[0].venue+' property');
    lightRemove(a);
    stageSwitch('palace', true);
    if(FIXTURES.indexOf(p) === -1) throw new Error('the Palace drop did not come home with its stage');
    if(FIXTURES.length !== before+1) throw new Error('the patch came back '+FIXTURES.length+' long, not '+(before+1));
    if(p.group.parent !== rigGroup) throw new Error('it came back off its own rig');
    lightRemove(p);
    if(FIXTURES.length !== before) throw new Error('it would not come off again');
    stageSwitch(home, true);
    return 'the Palace drop stayed at the Palace, the Arc drop aimed at the Arc';
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
