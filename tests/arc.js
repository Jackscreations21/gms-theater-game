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
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,200):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); window.__errs.push(name+': '+e.message); } };
  const run = (n, dt)=>{ for(let i=0;i<n;i++){ updateArc(dt); updateFades(dt); updateFly(dt); } };
  const meshes = g=>{ let n=0; g.traverse(o=>{ if(o.isMesh) n++; }); return n; };
  const seen = o=>{ let p=o; while(p){ if(!p.visible) return false; p=p.parent; } return true; };

  console.log('--- three stages, one set of dimensions ---');

  P('every stage in the game is the same box', ()=>{
    // the palace, straight off D
    const palace = {procW:D.procW, procH:D.procH, stageW:D.stageW,
                    stageD:D.stageD, grid:D.gridY};
    const rows = [['THE PALACE', palace]];
    for(const k of ['main','studio']){
      const H = ARC.houses[k];
      if(!H) throw new Error('no '+k);
      rows.push([H.label, {procW:H.pros.w, procH:H.pros.h, stageW:H.x1 - H.x0,
                           stageD:H.zPros - H.zBack, grid:AS.GRID}]);
    }
    const ref = rows[0][1];
    for(const [name, d] of rows.slice(1))
      for(const key of Object.keys(ref))
        if(Math.abs(d[key] - ref[key]) > 0.01)
          throw new Error(name+' has '+key+' = '+d[key]+', the Palace has '+ref[key]);
    return rows.map(r=>r[0]+': '+r[1].procW+'x'+r[1].procH+' opening, '+
                    r[1].stageW+'w '+r[1].stageD+'d, grid '+r[1].grid);
  });

  P('the studio is a theatre now, not a black box', ()=>{
    const H = ARC.houses.studio;
    if(!H.pros) throw new Error('it still has no proscenium');
    if(Math.abs(H.pros.w - D.procW) > 0.01) throw new Error('its opening is '+H.pros.w);
    if(!H.seats || H.seats < 150) throw new Error('only '+H.seats+' seats');
    if(STAGES.arcStudio.fly.length !== 14 && FLY.length !== 14)
      throw new Error('no fly system');
    // and it has a raked floor rather than a flat one
    const a = groundAt(ARC.X + H.cx, H.zPros + 4, 6);
    const b = groundAt(ARC.X + H.cx, H.zPros + 18, 8);
    if(a === null || b === null) throw new Error('no floor in the auditorium');
    if(b - a < 2) throw new Error('the floor only rises '+(b-a).toFixed(1)+'m — still flat');
    return H.seats+' seats on a rake rising '+(b-a).toFixed(1)+'m, '+
           H.pros.w+'x'+H.pros.h+' opening';
  });

  console.log('--- the roofs ---');

  P('there are no holes in the roof over either stage', ()=>{
    goToView(15);
    const up = new THREE.Vector3(0, 1, 0);
    const ray = new THREE.Raycaster();
    const holes = [];
    for(const k of ['main','studio']){
      const H = ARC.houses[k];
      const R = ARC.rooms[H.room];
      for(let i=0;i<=8;i++){
        for(let j=0;j<=6;j++){
          const x = ARC.X + H.cx - AS.W/2 + 2 + i*(AS.W - 4)/8;
          const z = H.zBack + 1.5 + j*(AS.DEPTH - 3)/6;
          ray.set(new THREE.Vector3(x, 2.0, z), up);
          ray.near = 0; ray.far = 60;
          const hits = ray.intersectObject(R, true).filter(h=>h.point.y > AS.GRID);
          if(!hits.length) holes.push(H.label+' ('+(x-ARC.X-H.cx).toFixed(0)+', '+z.toFixed(0)+')');
        }
      }
    }
    if(holes.length)
      throw new Error(holes.length+' of 126 points see the sky: '+holes.slice(0,3).join('; '));
    return '126 probes over the two stages, every one of them roofed';
  });

  P('there is a floor everywhere you are allowed to stand', ()=>{
    const holes = [];
    for(const [view, key] of [[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const st = STAGES[key], H = ARC.houses[st.arcHouse];
      /* sweep the whole house on a half-metre grid: stage, auditorium and
         the dock bay.  Anywhere arcBounds lets you walk has to have ground
         under it, and the step up to it has to be one you could take. */
      for(let x = H.cx - AS.W/2; x <= H.cx + AS.W/2; x += 1.0){
        for(let z = H.zBack; z <= H.zHouse; z += 1.0){
          const wx = ARC.X + x;
          if(!arcBounds(wx, z)) continue;
          /* probe from six metres: above the back row and the dock pad, but
             under the fly gallery and the dock roof, so what comes back is
             the floor you would be standing on rather than the one over it */
          const g = groundAt(wx, z, 6.0);
          if(g === null){ holes.push(H.label+' ('+x.toFixed(0)+', '+z.toFixed(0)+') no floor'); continue; }
          if(g < -1.2 || g > 6.0) holes.push(H.label+' ('+x.toFixed(0)+', '+z.toFixed(0)+') floor at '+g.toFixed(1));
        }
      }
    }
    if(holes.length)
      throw new Error(holes.length+' bad spots, e.g. '+holes.slice(0,4).join('; '));
    return 'both houses swept on a one-metre grid, no holes';
  });

  P('the seating is solid — you cannot see under the rows', ()=>{
    const bad = [];
    for(const [view, key] of [[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const H = ARC.houses[STAGES[key].arcHouse];
      scene.updateMatrixWorld(true);
      const ray = new THREE.Raycaster();
      /* look along under the rows from the stage end, at knee height and
         below: a rake built out of floating treads is see-through, a rake
         built as blocks is not */
      for(const dx of [-6, -2, 2, 6]){
        for(const y of [-0.9, -0.45, -0.15]){
          const from = new THREE.Vector3(ARC.X + H.cx + dx, y, H.zPros + 3.0);
          const to   = new THREE.Vector3(ARC.X + H.cx + dx, y, H.zHouse - 1.0);
          const dir  = new THREE.Vector3().subVectors(to, from).normalize();
          ray.set(from, dir); ray.near = 0; ray.far = from.distanceTo(to);
          const hits = ray.intersectObject(ARC.rooms[H.room], true);
          if(!hits.length)
            bad.push(H.label+' sees clean through at x+'+dx+', y='+y);
        }
      }
    }
    if(bad.length)
      throw new Error(bad.length+' of 24 lines of sight go under the seating: '+
                      bad.slice(0,3).join('; '));
    return '24 sightlines under the rows in both houses, every one of them stopped';
  });

  P('every seat stands on its tread, in both houses', ()=>{
    /* the rows were laid out from 0.4 + i*RISE while the treads top out at
       Y0 + i*RISE + 0.2 — a metre lower.  Both houses' seating floated.
       Now each seat base must sit on its pedestal, and the pedestal on the
       tread: base bottom a plinth-height above the tread top, everywhere. */
    const out = [];
    for(const [view, key] of [[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const H = ARC.houses[STAGES[key].arcHouse];
      const room = ARC.rooms[H.room];
      let baseMesh = null, plinthMesh = null;
      room.traverse(c=>{
        if(!c.isInstancedMesh || !c.geometry.parameters) return;
        const q = c.geometry.parameters;
        if(Math.abs(q.width-0.54)<1e-6 && Math.abs(q.height-0.12)<1e-6 &&
           Math.abs(q.depth-0.5)<1e-6) baseMesh = c;
        if(Math.abs(q.width-0.34)<1e-6 && Math.abs(q.height-0.16)<1e-6 &&
           Math.abs(q.depth-0.44)<1e-6) plinthMesh = c;
      });
      if(!baseMesh) throw new Error(H.label + ' has no seat-base batch');
      if(!plinthMesh || plinthMesh.count !== baseMesh.count)
        throw new Error(H.label + ' seats have no pedestals under them (' +
          (plinthMesh ? plinthMesh.count : 0) + ' for ' + baseMesh.count + ' seats)');
      const rake = H.rake, m = new THREE.Matrix4(), v = new THREE.Vector3(),
            q4 = new THREE.Quaternion(), s = new THREE.Vector3();
      let worst = 0.16, worstAt = 'nowhere';   // 0.16 IS the plinth: zero deviation
      for(let i=0;i<baseMesh.count;i++){
        baseMesh.getMatrixAt(i, m); m.decompose(v, q4, s);
        const row = Math.round((v.z - rake.zFirst)/rake.RUN);
        const tread = rake.Y0 + row*rake.RISE + 0.2;
        const gap = (v.y - 0.06) - tread;      // base bottom above its tread
        if(Math.abs(gap - 0.16) > Math.abs(worst - 0.16)){ worst = gap; worstAt = 'row ' + row; }
      }
      if(worst > 0.35 || worst < 0.0)
        throw new Error(H.label + ': a seat base floats ' + worst.toFixed(2) +
                        'm over its tread (' + worstAt + ') — wanted the 0.16m plinth gap');
      out.push(H.label + ': ' + baseMesh.count + ' seats, worst gap ' + worst.toFixed(2) + 'm');
    }
    return out;
  });

  P('the rake runs the whole way from the front row to the back wall', ()=>{
    const out = [];
    for(const [view, key] of [[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      const H = ARC.houses[STAGES[key].arcHouse];
      let last = null, worst = 0;
      // walk up the centre line a metre at a time; no step may be a cliff
      for(let z = H.zPros + 2; z <= H.zHouse - 0.5; z += 0.5){
        const g = groundAt(ARC.X + H.cx, z, 6.0);
        if(g === null) throw new Error(H.label+' has no floor at z='+z.toFixed(1));
        if(last !== null) worst = Math.max(worst, Math.abs(g - last));
        last = g;
      }
      if(worst > 0.75)
        throw new Error(H.label+' has a '+worst.toFixed(2)+'m step in the rake');
      if(Math.abs(last - AS.BACKY) > 0.4)
        throw new Error(H.label+' finishes at '+last.toFixed(2)+', the foyer is at '+AS.BACKY);
      out.push(H.label+': biggest step '+worst.toFixed(2)+'m, ends at '+last.toFixed(1)+'m');
    }
    return out;
  });

  console.log('--- the fly systems ---');

  P('both new stages have one', ()=>{
    const out = [];
    for(const [view, key] of [[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      if(STAGE !== key) throw new Error('the board did not follow me to '+key);
      if(FLY.length !== 14) throw new Error(key+' has '+FLY.length+' linesets');
      const hung = FLY.filter(l=>l.goodsKey !== 'none').map(l=>l.goodsKey);
      for(const want of ['house','border','legs','electric','cyc'])
        if(hung.indexOf(want) < 0) throw new Error(key+' has no '+want);
      out.push(STAGES[key].label+': '+FLY.length+' linesets, '+hung.length+' hung');
    }
    return out;
  });

  P('the linesets actually fly', ()=>{
    goToView(15);
    const ls = FLY[4];
    flyIn(ls); run(700, 0.05);
    const inAt = ls.pos;
    if(Math.abs(inAt - inTrimOf(ls)) > 0.2)
      throw new Error('it stopped at '+inAt.toFixed(2)+' instead of '+inTrimOf(ls));
    flyOut(ls); run(700, 0.05);
    if(Math.abs(ls.pos - OUT_TRIM) > 0.2)
      throw new Error('it did not go out, it is at '+ls.pos.toFixed(2));
    if(Math.abs(inAt - OUT_TRIM) < 4) throw new Error('in and out are the same place');
    flyIn(ls); run(700, 0.05);
    return 'in to '+inAt.toFixed(1)+'m, out to '+OUT_TRIM.toFixed(1)+'m';
  });

  P('nothing hangs below the stage floor when it is in', ()=>{
    const bad = [];
    for(const view of [15, 19]){
      goToView(view);
      FLY.forEach(ls=>{ if(ls.goodsKey !== 'none') flyIn(ls); });
      run(900, 0.05);
      for(const ls of FLY){
        if(!ls.goods) continue;
        ls.group.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(ls.goods);
        if(box.min.y < -0.5)
          bad.push(STAGES[STAGE].label+' lineset '+ls.id+' ('+ls.goodsKey+
                   ') reaches '+box.min.y.toFixed(2)+'m');
      }
    }
    if(bad.length) throw new Error(bad.slice(0,4).join('; '));
    return 'every cloth on both stages hangs above its deck';
  });

  P('all in and all out work on a whole house', ()=>{
    goToView(15);
    FLY.forEach(flyOut); run(900, 0.05);
    if(FLY.some(l=>Math.abs(l.pos - OUT_TRIM) > 0.2)) throw new Error('something is still in');
    // and the studio next door is untouched
    goToView(19);
    if(FLY.every(l=>Math.abs(l.pos - OUT_TRIM) < 0.2))
      throw new Error('the studio went out with the main house');
    goToView(15);
    FLY.forEach(ls=>{ if(ls.goodsKey !== 'none') flyIn(ls); }); run(900, 0.05);
    return 'the two rails are independent';
  });

  console.log('--- the docks ---');

  P('both new stages have a loading dock', ()=>{
    const out = [];
    for(const k of ['main','studio']){
      const H = ARC.houses[k];
      if(!H.dock) throw new Error(H.label+' has no dock');
      // it is off the outer side of the stage house
      if(Math.abs(H.dock.inner - (H.cx + H.dock.dir*AS.W/2)) > 0.01)
        throw new Error(H.label+' dock is not against the stage-house wall');
      if(Math.sign(H.dock.outer - H.dock.inner) !== H.dock.dir)
        throw new Error(H.label+' dock runs the wrong way');
      // and you can stand on the pad
      const g = groundAt(ARC.X + (H.dock.inner + H.dock.outer)/2, H.dock.z, 6.0);
      if(g === null) throw new Error(H.label+' dock has no floor');
      // it has to be level with the deck, which is the point of a dock
      if(Math.abs(g - AS.DECK) > 0.2)
        throw new Error(H.label+' dock pad is at '+g.toFixed(2)+'m, the deck is at '+AS.DECK);
      out.push(H.label+': pad at '+g.toFixed(2)+'m, '+
               Math.abs(H.dock.outer - H.dock.inner).toFixed(0)+'m deep');
    }
    return out;
  });

  P('the dock shutter is the way from the dock onto the stage', ()=>{
    for(const k of ['main','studio']){
      const H = ARC.houses[k];
      const d = ARC.doorMap[k + 'Dock'];
      if(!d) throw new Error(H.label+' has no shutter');
      const onStage = ARC.X + H.cx + H.dock.dir*(AS.W/2 - 2);
      const onPad   = ARC.X + H.dock.inner + H.dock.dir*2;
      arcDoorSet(d.key, false); run(200, 0.05);
      if(!arcWallBlocks(onPad, H.dock.z, onStage, H.dock.z, 0))
        throw new Error(H.label+' shutter does not stop you when it is shut');
      arcDoorSet(d.key, true); run(200, 0.05);
      if(arcWallBlocks(onPad, H.dock.z, onStage, H.dock.z, 0))
        throw new Error(H.label+' shutter still blocks when it is open');
      arcDoorSet(d.key, false); run(200, 0.05);
    }
    return 'both shutters open and shut, and mean it';
  });

  console.log('--- the doors ---');

  P('both stages have openable doors', ()=>{
    const out = [];
    for(const k of ['main','studio']){
      const mine = ARC.doors.filter(d=>d.house === k);
      if(mine.length < 3) throw new Error(k+' has '+mine.length+' doors');
      if(!mine.some(d=>d.kind === 'roll')) throw new Error(k+' has no roller shutter');
      if(mine.filter(d=>d.kind === 'swing').length < 2)
        throw new Error(k+' has fewer than two pass doors');
      out.push(k+': '+mine.map(d=>d.kind).join(', '));
    }
    return out;
  });

  /* the warehouse doors are the only way into the Arc shed, and every Arc
     door used to open ONLY from the DOM panel — which a headset cannot
     reach, so the whole shed was unreachable in VR.  These two prove the
     physical control exists and that the shared pick list finds it: the
     desktop crosshair and the VR trigger both run pickAll -> describe ->
     useInfo, so testing that chain tests both. */
  P('each Arc warehouse door has a control the room ray finds', ()=>{
    const out = [];
    for(const k of ['main','studio']){
      const H = ARC.houses[k];
      const ctl = INTERACT.find(o=>o.userData.station &&
                                   o.userData.station.id === 'arcDoor:'+k+'Rear');
      if(!ctl) throw new Error(k+' has no control for its warehouse door');
      const p = new T.Vector3(); ctl.getWorldPosition(p);
      if(p.z < H.zBack + 0.001)
        throw new Error(k+' control is at z='+p.z.toFixed(2)+', behind the wall at '+H.zBack);
      if(Math.abs(p.x - (ARC.X + H.cx)) < 1.6)
        throw new Error(k+' control stands in the 3.2m doorway');
      if(p.y < 0.9 || p.y > 1.9)
        throw new Error(k+' control is at y='+p.y.toFixed(2)+' — not at hand height');
      const g = groundAt(p.x, p.z + 1.0, 2);
      if(g === null || Math.abs(g - AS.DECK) > 0.05)
        throw new Error(k+': nothing to stand on in front of it ('+g+')');
      const r = new T.Raycaster(new T.Vector3(p.x, p.y, p.z + 1.6),
                                new T.Vector3(0, 0, -1), 0, 6);
      const hit = pickAll(r);
      const info = hit ? describe(hit.object) : null;
      if(!info || info.kind !== 'station' || info.st.id !== 'arcDoor:'+k+'Rear')
        throw new Error(k+': the ray found '+(info ? info.kind : 'nothing'));
      out.push(k+': '+info.label);
    }
    return out;
  });

  P('the control rolls the warehouse door up, and back down', ()=>{
    const out = [];
    for(const k of ['main','studio']){
      const d = ARC.doorMap[k+'Rear'];
      arcDoorSet(d.key, false); run(240, 0.05);
      const shutY = d.group.position.y;
      const ctl = INTERACT.find(o=>o.userData.station &&
                                   o.userData.station.id === 'arcDoor:'+k+'Rear');
      useInfo(describe(ctl));          // where [E] and the VR trigger both land
      if(d.target !== 1) throw new Error(k+': one press did not call for open');
      run(240, 0.05);
      const rose = d.group.position.y - shutY;
      if(rose < 3.0) throw new Error(k+': the leaf only rose '+rose.toFixed(2)+'m');
      useInfo(describe(ctl));
      if(d.target !== 0) throw new Error(k+': the second press did not shut it');
      run(240, 0.05);
      if(Math.abs(d.group.position.y - shutY) > 0.01)
        throw new Error(k+': it never came back down');
      out.push(k+': '+rose.toFixed(1)+'m up and shut again on a second press');
    }
    return out;
  });

  P('a pass door swings, and stops you until it does', ()=>{
    const H = ARC.houses.main;
    const d = ARC.doorMap.mainPassSL;
    const at = ARC.X + d.at;
    const front = [at, H.zPros + 1.2], back = [at, H.zPros - 1.2];
    arcDoorSet(d.key, false); run(240, 0.05);
    const shutAngle = d.leaves[0].group.rotation.y;
    if(!arcWallBlocks(back[0], back[1], front[0], front[1], 0))
      throw new Error('you can walk through a shut door');
    arcDoorSet(d.key, true); run(240, 0.05);
    if(Math.abs(d.leaves[0].group.rotation.y - shutAngle) < 1.0)
      throw new Error('the leaf only moved '+
        Math.abs(d.leaves[0].group.rotation.y - shutAngle).toFixed(2)+' rad');
    if(arcWallBlocks(back[0], back[1], front[0], front[1], 0))
      throw new Error('it still blocks when it is open');
    const swung = Math.abs(d.leaves[0].group.rotation.y - shutAngle);
    arcDoorSet(d.key, false); run(240, 0.05);
    return 'swings '+swung.toFixed(2)+' rad and blocks only while shut';
  });

  P('the proscenium wall is solid except where it should not be', ()=>{
    const H = ARC.houses.studio;
    arcDoorsAll('studio', false); run(240, 0.05);
    const front = H.zPros + 1.2, back = H.zPros - 1.2;
    // straight through the opening: fine
    if(arcWallBlocks(ARC.X + H.cx, back, ARC.X + H.cx, front, 0))
      throw new Error('the proscenium opening is blocked');
    // out at the sides: not fine
    const wide = ARC.X + H.cx + AS.PROCW/2 + 6;
    if(!arcWallBlocks(wide, back, wide, front, 0))
      throw new Error('you can walk through the proscenium wall beside the opening');
    return 'through the opening, not through the wall';
  });

  P('you can walk out of the foyer into either house', ()=>{
    for(const k of ['main','studio']){
      const H = ARC.houses[k];
      const x = ARC.X + H.cx;
      const inFoyer = [x, H.zHouse + 2.0], inHouse = [x, H.zHouse - 2.0];
      // the two walls between them both have to let you through
      if(arcWallBlocks(inHouse[0], inHouse[1], inFoyer[0], inFoyer[1], AS.BACKY + 1))
        throw new Error('the way into the '+H.label+' is blocked');
      // and there is a floor on both sides of it, at the same height
      const a = groundAt(x, H.zHouse + 2.0, AS.BACKY + 2);
      const b = groundAt(x, H.zHouse - 2.0, AS.BACKY + 2);
      if(a === null) throw new Error('no foyer floor outside the '+H.label);
      if(b === null) throw new Error('no floor inside the '+H.label+' doorway');
      if(Math.abs(a - b) > 0.55)
        throw new Error(H.label+': a '+Math.abs(a-b).toFixed(2)+
                        'm step between the foyer and the house');
      // and just to the side of the doorway the wall is solid again
      const off = x + H.doorW/2 + 3;
      if(!arcWallBlocks(off, inHouse[1], off, inFoyer[1], AS.BACKY + 1))
        throw new Error('you can walk through the back wall of the '+H.label);
    }
    return 'foyer to stalls, level, through the doorway and not through the wall';
  });

  P('the rake lands on the foyer floor in both houses', ()=>{
    const out = [];
    for(const k of ['main','studio']){
      const H = ARC.houses[k];
      const front = groundAt(ARC.X + H.cx, H.zPros + 4.5, 4);
      const back  = groundAt(ARC.X + H.cx, H.zHouse - 3.0, AS.BACKY + 2);
      if(front === null || back === null) throw new Error(H.label+' has a gap in its floor');
      if(Math.abs(back - AS.BACKY) > 0.5)
        throw new Error(H.label+' backs onto '+back.toFixed(2)+', the foyer is at '+AS.BACKY);
      out.push(H.label+': '+front.toFixed(1)+'m at the front, '+back.toFixed(1)+'m at the back');
    }
    return out;
  });

  console.log('--- and everything else still works ---');

  P('you can teleport to all of it and land on a floor', ()=>{
    const out = [];
    for(const n of Object.keys(VIEWS)){
      const v = VIEWS[n];
      if(v.venue !== 'arc') continue;
      goToView(+n);
      if(VENUE !== 'arc') throw new Error(v.name+' did not cross town');
      const g = groundAt(Player.pos.x, Player.pos.z, Player.pos.y + 1);
      if(g === null) throw new Error(v.name+' has no floor under it');
      if(Math.abs(g - Player.pos.y) > 0.7)
        throw new Error(v.name+' left you '+(Player.pos.y-g).toFixed(1)+'m off the floor');
      out.push(v.name);
    }
    if(out.length < 9) throw new Error('only '+out.length+' arc views');
    return out.length+' arc views, all of them on a floor';
  });

  P('you can see the stage from the stalls in both houses', ()=>{
    const out = [];
    for(const [k, view] of [['main',15],['studio',19]]){
      // the house curtain is in as standing hang — take it out first
      goToView(view);
      FLY.forEach(flyOut); run(900, 0.05);
      const H = ARC.houses[k], pr = H.pros;
      const eye = new THREE.Vector3(ARC.X + pr.cx, 5.0, pr.z + 22);
      const ray = new THREE.Raycaster();
      let through = 0, n = 0;
      for(let i=0;i<9;i++) for(const y of [2.0, 5.0, 8.0]){
        const x = ARC.X + pr.cx + (-pr.w/2 + 1 + i*(pr.w-2)/8);
        const dir = new THREE.Vector3(x - eye.x, y - eye.y, pr.z - eye.z).normalize();
        ray.set(eye, dir); ray.near = 0; ray.far = 120;
        const hit = ray.intersectObject(ARC.rooms[H.room], true)[0];
        n++;
        if(hit && hit.point.z < pr.z - 0.5) through++;
      }
      if(through < n - 2)
        throw new Error(H.label+': only '+through+' of '+n+' sightlines get through');
      out.push(H.label+' '+through+'/'+n);
    }
    return out;
  });

  P('only the building you are in is drawn', ()=>{
    goToView(1);
    if(ARC.group.visible) throw new Error('the arc is drawn from the palace');
    goToView(14);
    if(SHARED.visible) throw new Error('the palace is drawn from the arc');
    let palace = 0;
    world.traverse(o=>{ if(o.isMesh && seen(o)) palace++; });
    if(palace) throw new Error(palace+' palace meshes drawn from the arc');
    goToView(18);
    if(ARC.rooms.main.visible) throw new Error('the main house is drawn from the studio');
    goToView(1);
    let arc = 0;
    ARC.group.traverse(o=>{ if(o.isMesh && seen(o)) arc++; });
    if(arc) throw new Error(arc+' arc meshes drawn from the palace');
    return 'neither building draws a mesh from inside the other';
  });

  P('the palace walls do not follow you across town', ()=>{
    goToView(11);
    if(backWallBlocks(ARC.X, 20, 24)) throw new Error('the palace back wall is in the foyer');
    if(dockWallBlocks(ARC.X, 20, ARC.X + 1)) throw new Error('the palace dock wall is in the foyer');
    goToView(3);
    /* PAL_BACK: the Palace brick stands deeper than the box it is written to */
    if(!backWallBlocks(0, PAL_BACK - 1, 0)) throw new Error('the palace wall stopped working');
    return 'off across town, on at home';
  });

  P('the arc has its own switch and the palace board does not reach it', ()=>{
    goToView(11);
    setArcHouse(1); run(200, 0.05);
    if(!ARC.lights.every(l=>l.light.intensity > 0.5)) throw new Error('the lamps did not come up');
    const ambUp = ARC.amb.intensity;
    setArcHouse(0); run(200, 0.05);
    if(ARC.lights.some(l=>l.light.intensity > 0.02)) throw new Error('they never went out');
    if(ARC.amb.intensity >= ambUp) throw new Error('the bed light did not follow them');
    HOUSE.house = 1; run(40, 0.05);
    if(ARC.lights.some(l=>l.light.intensity > 0.02))
      throw new Error('the palace house master lit the arc');
    setArcHouse(0.85); run(200, 0.05);
    return 'own fader, own bed light, deaf to the palace board';
  });

  P('the palace still works after all that', ()=>{
    goToView(11); goToView(1);
    if(!showLoad('goeswrong')) throw new Error('the show would not load');
    wrongTrigger('upper');
    for(let i=0;i<200;i++){ updateFades(0.05); updateFly(0.05); updateStorm(0.05); }
    if(wrongFind('upper').state !== 'down') throw new Error('the collapse stopped working');
    fireCue(2);
    for(let i=0;i<120;i++){ updateFades(0.05); updateFly(0.05); }
    if(!FIXTURES.some(f=>f.level > 0.2)) throw new Error('the rig did not come up');
    return 'shows, cues and collapses all still run';
  });

  P('400 frames round the arc with the rail and the doors moving', ()=>{
    goToView(11);
    let err = null;
    try{
      for(let i=0;i<400;i++){
        if(i === 60){ goToView(15); FLY.forEach(flyIn); arcDoorsAll('main', true); }
        if(i === 180){ goToView(19); FLY.forEach(flyIn); arcDoorsAll('studio', true); }
        if(i === 300){ FLY.forEach(flyOut); arcDoorsAll(null, false); }
        updateFades(0.016); updateFly(0.016); updateStorm(0.016);
        updateSmoke(0.016); updateArc(0.016); updateRooms();
      }
    }catch(e){ err = e.message; }
    if(err) throw new Error(err);
    let m = 0; ARC.group.traverse(o=>{ if(o.isMesh) m++; });
    goToView(1);
    return 'no errors, '+m+' pieces in the building';
  });

  console.log('--- RULING DW: a light that serves no one leaves the loop ---');

  /* Every clause that asks whether a light is IN THE LOOP reads GATHERED
     visibility, never the light's own flag.  r128 walks the graph in
     projectObject and its first line returns on visible === false, above both
     the pushLight and the recursion into children (three.js r128:17954-17974)
     — so a light whose own flag is true under a switched-off root is not in
     any material light loop, and a test that read light.visible would call the
     Arc lit while standing in the Palace.  seen() up at the top of this file
     is that same ancestor walk.  (The yard-light case below reads its OWN flag
     once, deliberately — there it is the gate itself under test, not litness.) */
  const dwLights = (root)=>{ const out = []; root.traverse(o=>{ if(o.isLight) out.push(o); }); return out; };
  const dwOn = (root)=>dwLights(root).filter(seen).length;
  /* The Palace own lights hang off world (buildRooms files every light-carrying
     child into SHARED); the pool, the two beds and the lightning sit on scene
     itself because they are machinery shared by whichever stage is live, and
     are deliberately not part of either venue set. */
  const dwPalace = ()=>dwLights(world);
  const dwArc = ()=>dwLights(ARC.group);

  P('the venue you are not standing in gathers not one light, both ways round', ()=>{
    /* Established away first and then walked back, rather than read where the
       suite happens to have left the player: an assertion made in the state it
       claims is never reached proves nothing (TRAPS).  goToView is the real
       crossing — it is what the VENUES panel and the number keys call. */
    if(VENUE !== 'palace') throw new Error('this block wanted to start at home, VENUE is '+VENUE);
    goToView(11); run(4, 0.016); updateRooms(); run(4, 0.016);
    if(VENUE !== 'arc') throw new Error('goToView(11) did not cross town');
    const arcHere = dwOn(ARC.group), palThere = dwOn(world);
    if(arcHere === 0) throw new Error('standing in the arc, not one of its own lights is gathered');
    if(palThere !== 0)
      throw new Error(palThere+' of the palace '+dwPalace().length+
        ' lights are still gathered from four hundred metres away');
    goToView(1); run(4, 0.016); updateRooms(); run(4, 0.016);
    if(VENUE !== 'palace') throw new Error('goToView(1) did not come home');
    const arcThere = dwOn(ARC.group), palHere = dwOn(world);
    if(arcThere !== 0)
      throw new Error(arcThere+' of the arc '+dwArc().length+
        ' lights are gathered while standing in the palace');
    if(palHere === 0) throw new Error('back home and the palace gathers nothing');
    return 'in the arc '+arcHere+'/'+dwArc().length+' arc and '+palThere+' palace; '+
           'at home '+palHere+'/'+dwPalace().length+' palace and '+arcThere+' arc';
  });

  P('the palace house circuits are all in the loop, and the yard light is not', ()=>{
    /* The other half of the gate: being right about what is OFF is worth
       nothing if the gate also took something the room needs.  Named by
       circuit, not by count, so moving a lamp does not fail this. */
    const want = [];
    if(CHANDELIER) want.push(['the chandelier', CHANDELIER.light]);
    houseLights.forEach((l,i)=>want.push(['house cove '+(i+1), l]));
    workLights.forEach((l,i)=>want.push(['work light '+(i+1), l]));
    FOH.lamps.forEach((l,i)=>want.push(['foyer chandelier '+(i+1), l]));
    want.push(['the dock light', BOH.light], ['the second dock light', BOH.light2]);
    for(const [name, l] of want)
      if(!seen(l)) throw new Error(name+' is not gathered, so its circuit cannot light anything');
    /* RULING DW: BOH.light3 is the yard light over the road and nothing has
       ever driven it — intensity 0 since the day it was minted.  At intensity 0
       it was still a full point-light iteration in every standard fragment.  If
       somebody drives it off HOUSE.backstage one day, this clause is the thing
       that will tell them to move it up into the list above. */
    if(BOH.light3.visible)
      throw new Error('the yard light is back in the light loop and still driven by nothing');
    if(seen(BOH.light3)) throw new Error('the yard light is gathered');
    return want.length+' circuits gathered, the undriven yard light out of the loop';
  });

  P('the arc bed leaves the loop on a stage, on the same test that zeroes it', ()=>{
    /* p2j drives the foyer bed to EXACTLY 0 inside a house (RULING BH), by
       room and with no fade, so the flag rides that same predicate.  Asserted
       as a pair: the intensity and the flag must agree in both rooms, because
       the failure this guards against is one of them being changed alone. */
    goToView(11); run(30, 0.05);
    if(ARC.cur !== 'lobby') throw new Error('view 11 is not the foyer, it is '+ARC.cur);
    setArcHouse(1); run(60, 0.05);
    if(!seen(ARC.hemi)) throw new Error('the foyer bed is out of the loop in the foyer');
    if(!(ARC.hemi.intensity > 0.01)) throw new Error('the foyer bed is dark in the foyer');
    const inFoyer = dwOn(ARC.group);
    let stage = null, stageRoom = null;
    for(const k of ['15','19','16','20','12','13','14','17','18']){
      if(!VIEWS[k]) continue;
      goToView(k); run(6, 0.05);
      if(ARC.cur !== 'lobby'){ stage = k; stageRoom = ARC.cur; break; }
    }
    if(stage === null) throw new Error('no arc view stands inside a house');
    run(20, 0.05);
    if(ARC.hemi.intensity > 0.0001)
      throw new Error('inside a house the bed reads '+ARC.hemi.intensity.toFixed(4));
    if(seen(ARC.hemi))
      throw new Error('inside a house the bed is at zero and still in the light loop');
    if(seen(ARC.amb))
      throw new Error('inside a house the ambient bed is at zero and still gathered');
    const onStage = dwOn(ARC.group);
    if(!(onStage < inFoyer))
      throw new Error('a stage gathers '+onStage+' lights and the foyer '+inFoyer);
    // and back out to the foyer it returns, or the building goes dark for good
    goToView(11); run(30, 0.05);
    if(!seen(ARC.hemi)) throw new Error('back in the foyer the bed never came back');
    setArcHouse(0.85); goToView(1); run(4, 0.016); updateRooms();
    return 'foyer gathers '+inFoyer+', the '+stageRoom+' stage '+onStage+' (view '+stage+')';
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
