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
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,210):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); if(e.stack) console.log('      '+e.stack.split('\\n').slice(1,4).join(' | ')); window.__errs.push(name+': '+e.message); } };
  const run = (n, dt)=>{ for(let i=0;i<n;i++){ updateArc(dt); updateFades(dt); updateFly(dt); updateStorm(dt); } };

  console.log('--- the fly rail, through its own buttons ---');

  const rows = ()=>Array.prototype.slice.call(
    document.querySelectorAll('#lsTable tbody tr'));
  const rowBtn = (tr, text)=>Array.prototype.slice.call(tr.querySelectorAll('button'))
    .find(b=>b.textContent === text);
  const click = el=>{ const e = new window.MouseEvent('click', {bubbles:true}); el.dispatchEvent(e); };

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
    if(Math.abs(parseFloat(inTxt) - ls.pos) > 0.15)
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

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); }
catch(e){ console.log('TOP LEVEL THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
process.exit((w.__errs||[]).length ? 1 : 0);
