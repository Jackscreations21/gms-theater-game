const {JSDOM} = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname,'..','the-house.html'),'utf8');
const dom = new JSDOM(html.replace(/<script src=.*?<\/script>/,''), {runScripts:'outside-only', pretendToBeVisual:true});
const w = dom.window;
w.HTMLCanvasElement.prototype.getContext = function(){
  const noop=()=>{};
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
  const box = o=>{ SHOW.group.updateMatrixWorld(true); return new THREE.Box3().setFromObject(o); };
  const byName = n=>{ let f=null; SHOW.group.traverse(o=>{ if(!f && o.name===n) f=o; }); return f; };

  console.log('--- BEETLEJUICE is in the book (RULING AV) ---');

  P('the show is registered, with the four fields a production needs', ()=>{
    if(!SHOWS.beetlejuice) throw new Error('beetlejuice is not in the book');
    const s = SHOWS.beetlejuice;
    for(const k of ['name','blurb','note','load'])
      if(!s[k]) throw new Error('no '+k);
    if(s.name !== 'BEETLEJUICE') throw new Error('named '+s.name);
    if(typeof s.load !== 'function') throw new Error('load is not a function');
    return s.name+' — '+Object.keys(SHOWS).length+' productions in the book';
  });

  /* This pinned RULING AO — "an interpretation, not a copy" — until the owner
     repealed AO in full on 2026-08-10 and asked for the sets to look as close
     to the real production as they can get.  The assertion is REVERSED rather
     than removed, because the note is still load-bearing: it is what the
     record says this show is, and it must not silently drift back.  The other
     four shows are untouched and still carry the interpretation note, so the
     second half of this pins that AV's repeal stayed scoped to Beetlejuice. */
  P('its record says it is MODELLED on the production (RULING AV)', ()=>{
    const n = (SHOWS.beetlejuice.note || '').toLowerCase();
    if(n.indexOf('modelled on the production') < 0)
      throw new Error('the note does not say what this show is: '+n);
    if(n.indexOf('not a copy') >= 0)
      throw new Error('the note still disclaims copying, which AV repealed: '+n);
    for(const k of ['outsiders','lostboys','hamilton','goeswrong']){
      const o = (SHOWS[k] && SHOWS[k].note || '').toLowerCase();
      if(o.indexOf('not a copy') < 0)
        throw new Error(k+' lost its interpretation note — AV was scoped to beetlejuice');
    }
    return SHOWS.beetlejuice.note;
  });

  console.log('--- it loads ---');

  P('it loads a set, and enough of one to be a production', ()=>{
    if(!showLoad('beetlejuice')) throw new Error('would not load');
    if(SHOW.key !== 'beetlejuice') throw new Error('SHOW.key is '+SHOW.key);
    let m = 0, tri = 0;
    SHOW.group.traverse(o=>{ if(o.isMesh){ m++;
      const g = o.geometry; if(g && g.index) tri += g.index.count/3;
      else if(g && g.attributes.position) tri += g.attributes.position.count/3; } });
    if(m < 20) throw new Error('only '+m+' pieces');
    return m+' pieces, '+(tri/1000).toFixed(1)+'k triangles';
  });

  P('the deck is at the deck: y = 0, not a metre up', ()=>{
    showLoad('beetlejuice');
    const d = byName('bj:deck');
    if(!d) throw new Error('no deck was built');
    if(WALKABLE.indexOf(d) < 0) throw new Error('the deck is not walkable');
    const b = box(d);
    if(b.max.y > 0.2) throw new Error('the deck top is at y='+b.max.y.toFixed(2));
    if(b.max.y < -0.01) throw new Error('the deck is below the stage at y='+b.max.y.toFixed(2));
    /* and it reaches upstage, not out into the auditorium */
    if(b.min.z > -10) throw new Error('the deck does not reach upstage: min z='+b.min.z.toFixed(1));
    return 'top y='+b.max.y.toFixed(2)+', z '+b.min.z.toFixed(1)+' to '+b.max.z.toFixed(1);
  });

  console.log('--- the portal, which never leaves ---');

  P('the portal stands INSIDE the house proscenium, fouling nothing', ()=>{
    showLoad('beetlejuice');
    const p = byName('bj:portal');
    if(!p) throw new Error('no portal');
    /* the frame, the cornice and the trim together must clear the opening */
    const all = new THREE.Box3();
    SHOW.group.traverse(o=>{ if(o.isMesh && o.name && o.name.indexOf('bj:portal') === 0)
      all.union(box(o)); });
    const t = byName('bj:portalFrame');
    if(!t) throw new Error('no portal frame');
    /* the cornice carries no name, so take the widest thing near the top */
    let topY = all.max.y, wide = Math.max(Math.abs(all.min.x), Math.abs(all.max.x));
    SHOW.group.traverse(o=>{ if(!o.isMesh || o.name === 'bj:deck') return;
      const b = box(o);
      if(b.max.y > 6 && b.max.z > -2){ topY = Math.max(topY, b.max.y);
        wide = Math.max(wide, Math.abs(b.min.x), Math.abs(b.max.x)); } });
    if(wide > D.procW/2) throw new Error('the portal is '+(wide*2).toFixed(2)+'m wide, the opening is '+D.procW);
    if(topY > D.procH) throw new Error('the portal reaches y='+topY.toFixed(2)+', the opening is '+D.procH);
    return 'portal '+(wide*2).toFixed(2)+'m x '+topY.toFixed(2)+'m inside a '+D.procW+' x '+D.procH+' opening';
  });

  /* one material for the whole frame: a material per object is the
     draw-call trap, and an array material is worse (TRAPS.md).

     THIS IS THE ONE PLACE THAT RULE IS NOT INVERTED.  "A material per tube is
     REQUIRED" belongs to updateNeon, which writes a colour into every mesh
     registered on SHOW.neon every frame — the netherworld's tubes.  The
     proscenium frame is not on that list: updatePortal writes ONE colour into
     ONE material, so merging is correct here and the two must not be confused. */
  P('the proscenium frame is ONE merged mesh on ONE material', ()=>{
    showLoad('beetlejuice');
    const t = byName('bj:portalFrame');
    if(!t) throw new Error('no portal frame');
    if(Array.isArray(t.material)) throw new Error('the frame uses an array material');
    let strips = 0;
    t.traverse(o=>{ if(o.isMesh) strips++; });
    if(strips !== 1) throw new Error('the frame is '+strips+' meshes, it should be merged to one');
    if(!t.material.emissive) throw new Error('the frame does not glow');
    /* and it is NOT one of the netherworld's tubes, which are the ones that
       genuinely need a material each */
    if((SHOW.neon||[]).some(r=>r.mesh === t))
      throw new Error('the frame is registered on SHOW.neon — updateNeon would fight updatePortal for it');
    return 'one merged mesh, one emissive material, off SHOW.neon';
  });

  /* ══ RULING CH — REVERSED IN PLACE ══════════════════════════════════════
     This asserted a blue-green tube frame that RETURNS INTO THE WINGS and is
     always lit, which is what RULING AX read off his photographs.  He has now
     said what he wants in his own words:

       "remove the current neon stuff and replace it with a thicker bar going all
        the way around ... For the rest it is off."

     So the wings, the hoops and the permanent blue-green all go, and what the
     assertion has to guard changes with them: a CLOSED loop, THICKER than the
     tube it replaces, and DARK when no cue has spoken.  Two clauses survive
     untouched and are still load-bearing — a sill on the deck (it surrounds the
     picture, it does not sit across the top of it) and never wider than the
     house opening. */
  P('the proscenium neon is a thick closed bar, and it is built DARK (CH)', ()=>{
    showLoad('beetlejuice');
    const t = byName('bj:portalFrame');
    const b2 = box(t);
    /* it must SURROUND the picture, not sit across the top of it */
    if(b2.min.y > 0.4) throw new Error('there is no sill: the neon starts at y='+b2.min.y.toFixed(2));
    if(b2.max.y < BJ.opH - 0.2) throw new Error('the neon does not reach the header');
    /* CLOSED, and that is measured rather than counted: a loop missing a leg
       would still be four bars and still pass a mesh count.  Cast a box at each
       of the four sides of the opening and demand geometry in all four. */
    const pos = t.geometry.attributes.position;
    const side = {left:0, right:0, top:0, bottom:0};
    for(let i = 0; i < pos.count; i++){
      const x = pos.getX(i), y = pos.getY(i);
      if(x < -BJ.opW/2 + 0.5) side.left++;
      if(x >  BJ.opW/2 - 0.5) side.right++;
      if(y >  BJ.opH   - 0.5) side.top++;
      if(y <  0.5)            side.bottom++;
    }
    for(const k in side)
      if(!side[k]) throw new Error('the loop is open: no bar on the '+k+' side');
    /* THICKER than the 0.075-radius tube it replaces — his one adjective */
    const thick = b2.max.z - b2.min.z;
    if(thick < 0.2)
      throw new Error('the bar is '+thick.toFixed(2)+'m thick; the tube it replaces was 0.15');
    /* and the wings are GONE — a frame that still ran upstage would be 5m deep */
    if(thick > 1.0)
      throw new Error('the frame is '+thick.toFixed(2)+'m deep — the wing returns are still there');
    /* never wider than the house opening, and inside the portal check's own +-7.4 */
    const wide = Math.max(Math.abs(b2.min.x), Math.abs(b2.max.x));
    if(wide > D.procW/2) throw new Error('the neon is '+(wide*2).toFixed(2)+'m across a '+D.procW+' opening');
    if(wide > 7.4) throw new Error('the neon is '+wide.toFixed(2)+' from centre; the portal check refuses past 7.4');
    /* BUILT DARK.  "For the rest it is off" — so the frame exists unlit, and a
       cue is the only thing that ever lights it. */
    if(t.material.emissiveIntensity > 0.001)
      throw new Error('the frame is built lit at '+t.material.emissiveIntensity+' — it must be dark until a cue says');
    if(!SHOW.bjPortal) throw new Error('the frame is not registered on SHOW.bjPortal — the stage swap would lose it');
    if(SHOW.bjPortal.mesh !== t) throw new Error('SHOW.bjPortal points at something else');
    return (wide*2).toFixed(2)+'m across, a '+thick.toFixed(2)+'m bar closed on all four sides, built dark';
  });

  console.log('--- the cemetery is a SCENE, and this is the first show to use them ---');

  P('the set is registered as a scene and is the live one', ()=>{
    showLoad('beetlejuice');
    if(!SHOW.scenes.length) throw new Error('no scenes were registered');
    const c = sceneFind('cemetery');
    if(!c) throw new Error('there is no cemetery scene');
    if(!c.on) throw new Error('the cemetery is not the live scene');
    if(SHOW.scene !== 'cemetery') throw new Error('the live scene is '+SHOW.scene);
    if(c.group.name !== 'scene:cemetery') throw new Error('group named '+c.group.name);
    let m = 0; c.group.traverse(o=>{ if(o.isMesh) m++; });
    if(m < 12) throw new Error('the cemetery is only '+m+' pieces');
    return SHOW.scenes.length+' scene(s), cemetery live with '+m+' pieces';
  });

  /* a scene that is off must be INERT, not merely invisible — otherwise a
     raycast stands you on a hill that is not on the stage */
  P('a scene that goes off is inert, not just unseen', ()=>{
    showLoad('beetlejuice');
    const c = sceneFind('cemetery');
    const moon = byName('bj:moon');
    if(!moon) throw new Error('no moon to test with');
    sceneAdd('__probe', 'PROBE');
    sceneShow('__probe');
    if(c.on) throw new Error('the cemetery is still on');
    if(c.group.visible) throw new Error('the cemetery still draws');
    let lit = 0;
    c.group.traverse(o=>{ if(o.layers && o.layers.mask !== 0) lit++; });
    if(lit) throw new Error(lit+' pieces of the off scene still test against a ray');
    sceneShow('cemetery');
    if(!c.on) throw new Error('it did not come back');
    if(moon.layers.mask === 0) throw new Error('the moon did not come back into the layers');
    return 'off: nothing drawn and nothing raycastable; on again: back';
  });

  console.log('--- the house, from outside ---');

  /* REWRITTEN IN PLACE FOR RULING BZ.  It used to assert flatly that the
     exterior IS a painted drop — one cloth, RULING AW, because the production
     photograph showed a cloth and MODELING.md said the exterior was not the
     owner's to model.  He has now modelled and delivered it, so that is no
     longer the whole truth.

     It is still HALF of it, and the half that matters most, because the model
     import falls back SILENTLY by design: until the file is actually fetched —
     a fresh clone with no assets, a failed request, a refused budget — the drop
     is what plays, so the drop has to stay correct.  What is pinned now is that
     the STAND-IN is one cloth painted at full size with nothing walkable on it,
     exactly as before.  jsdom has no fetch and loads no model, so this measures
     the stand-in, which is precisely the state it now exists to guard. */
  P('the exterior STAND-IN is a painted drop, one cloth and nothing walkable (AW, BZ)', ()=>{
    showLoad('beetlejuice');
    const h = sceneFind('house');
    if(!h) throw new Error('there is no house scene');
    if(h.on) throw new Error('the house is live at the top of the show — the cemetery is');
    sceneShow('house');
    let m = 0; h.group.traverse(o=>{ if(o.isMesh) m++; });
    if(m !== 1) throw new Error('a drop is ONE cloth — the house is '+m+' pieces');
    const d = byName('bj:house');
    if(!d) throw new Error('the cloth is not named bj:house');
    if(!d.material.map || !d.material.map.image)
      throw new Error('the drop carries no painted canvas');
    const img = d.material.map.image;
    if(img.width !== 1024 || img.height !== 1024)
      throw new Error('painted at '+img.width+'x'+img.height+', pinned at 1024x1024');
    /* the modelled porch went with the model, and a cloth is not a floor */
    if(h.walk.length) throw new Error('a painted drop filed '+h.walk.length+' walkable(s)');
    return 'one painted cloth, 1024x1024, nothing walkable';
  });

  /* it has to read THROUGH the portal, or the portal crops it */
  P('the house fits inside the portal opening it is seen through', ()=>{
    showLoad('beetlejuice');
    sceneShow('house');
    const h = sceneFind('house');
    const b = box(h.group);
    if(b.max.y > BJ.opH)
      throw new Error('the house reaches y='+b.max.y.toFixed(2)+', the portal opening is '+BJ.opH);
    const wide = Math.max(Math.abs(b.min.x), Math.abs(b.max.x));
    if(wide*2 > BJ.opW + 0.01)
      throw new Error('the house is '+(wide*2).toFixed(2)+'m wide, the opening is '+BJ.opW);
    if(b.min.y < -0.01) throw new Error('the house goes below the deck to '+b.min.y.toFixed(2));
    return (wide*2).toFixed(2)+'m x '+b.max.y.toFixed(2)+'m through a '+BJ.opW+' x '+BJ.opH+' opening';
  });

  /* RULING AT promised the exterior flies out on a whole-group Y mover, and
     for two rounds that was never true: sceneTravel was never called on the
     house, so the plot cue's move:{scene:'house'} hit sceneMoveTo's null
     branch and did NOTHING — a silent no-op the suites never noticed.  The
     structural half pins the mover exists and the cue still names it. */
  P('the exterior carries the whole-group Y mover RULING AT promised', ()=>{
    showLoad('beetlejuice');
    const h = sceneFind('house');
    if(!h.mv) throw new Error('the exterior does not travel — the AT mover is unwired again');
    if(h.mv.axis !== 'y') throw new Error('it travels on '+h.mv.axis+', not up through the header');
    if(h.mv.home !== 0) throw new Error('its home is '+h.mv.home+', not the deck');
    const i = CUES.findIndex(c=>/1:14:30/.test(c.label));
    if(i < 0) throw new Error('the 1:14:30 cue is gone');
    const mv = Array.isArray(CUES[i].move) ? CUES[i].move : [CUES[i].move];
    const me = mv.find(m=>m && m.scene === 'house' && !m.part);
    if(!me) throw new Error('the cue no longer flies the exterior');
    /* REVERSED IN PLACE BY RULING CR.  It read BJ_SIGN_OUT — the number the SIGN
       flies to, borrowed by a set — and 9.0 leaves the foot of an 8.7m cloth at
       y 9.0 in a 9.2m picture.  That was invisible while a struck set went dark
       on arrival and stopped being invisible when RULING BQ made a parked set
       stand there drawn.  BJ_PART_OUT is the flown family's own out and clears
       the header with a margin.  What this line MEANS is unchanged: the cue at
       1:14:30 flies the exterior, and it flies it far enough. */
    if(Math.abs(me.off - BJ_PART_OUT) > 1e-9)
      throw new Error('it flies to '+me.off+', not to BJ_PART_OUT');
    if(!(BJ_PART_OUT >= BJ.opH))
      throw new Error('the fly-out at '+BJ_PART_OUT+' does not clear the '+BJ.opH+'m picture');
    /* and the WAGON CONVENTION: the engine never homes a whole-group mover
       on its own, so every cue that plays in the house must state the
       exterior's offset — or a goBack after 1:14:30 opens act two on an
       empty stage, the drop still parked in the flies */
    for(const q of CUES){
      if(q.scene !== 'house') continue;
      const l = Array.isArray(q.move) ? q.move : (q.move ? [q.move] : []);
      if(!l.some(m=>m && m.scene === 'house' && !m.part && m.off === 0))
        throw new Error('cue '+q.n+' plays in the house without homing the drop');
    }
    return 'y mover, home 0, flown to +'+me.off+' by cue '+CUES[i].n+
           ', homed by every house cue';
  });

  /* the behavioural half, through the REAL cue path: the act-two cue names a
     new scene AND flies the exterior — the whole-group mover must read as
     travelling when the changeover judges it, so the drop stays DRAWN all the
     way up and goes dark only once it arrives at BJ_SIGN_OUT.  World-matrix
     reads, never mover offsets (the frozen-group trap). */
  P('1:14:30 — the exterior flies out IN VIEW, and parks instead of vanishing', ()=>{
    showLoad('beetlejuice');
    const h = sceneFind('house');
    const i24 = CUES.findIndex(c=>c.scene === 'house');
    const i26 = CUES.findIndex(c=>/1:14:30/.test(c.label));
    if(i24 < 0 || i26 < 0 || i24 >= i26) throw new Error('the act-two cues moved');
    fireCue(i24);
    for(let k = 0; k < 360; k++) updateStorm(1/60);        // the changeover lands
    if(h.group.userData.sceneOff) throw new Error('act two never put the exterior on');
    const wy = ()=>{ scene.updateMatrixWorld(true);
      return byName('bj:house').matrixWorld.elements[13]; };
    const y0 = wy();
    fireCue(i26);                       // sky out, wagon on — and the drop FLIES
    for(let k = 0; k < 120; k++) updateStorm(1/60);        // 2s of a 5s fly
    const yMid = wy() - y0;
    if(h.group.userData.sceneOff)
      throw new Error('hidden two seconds into the fly — the instant swap is back');
    if(!(yMid > 0.5 && yMid < BJ_PART_OUT - 0.5))
      throw new Error('not mid-flight at 2s: y=+'+yMid.toFixed(2));
    let frames = 0;
    while(sceneTravelling(h) && frames < 900){
      updateStorm(1/60); frames++;
      if(frames % 10 === 0 && h.group.userData.sceneOff && (wy() - y0) < BJ_PART_OUT - 0.05)
        throw new Error('went dark mid-flight at y=+'+(wy() - y0).toFixed(2));
    }
    if(frames >= 900) throw new Error('still travelling after 17s');
    /* REVERSED IN PLACE BY RULING BQ.  This used to demand it went dark on
       arrival.  The exterior declares a park, so it arrives and stands there —
       and everything above is untouched, which is the point of keeping this
       assertion: it still proves the cue at 1:14:30 FLIES it (his own plot line,
       kept deliberately through RULING CE) and still proves nothing winks out
       mid-flight.  What changed is only what happens at the end of the move. */
    if(h.group.userData.sceneOff !== false)
      throw new Error('the exterior vanished on arrival instead of parking');
    let live = 0;
    h.group.traverse(o=>{ if(o.isMesh && o.layers.mask !== 0) live++; });
    if(!live)
      throw new Error('the parked exterior has no live meshes — BQ says it stands backstage');
    const yEnd = wy() - y0;
    /* REVERSED IN PLACE BY RULING CR, with its sibling above: BJ_PART_OUT, and
       the drop's own foot is what the number has to clear now that it stands
       there drawn. */
    if(Math.abs(yEnd - BJ_PART_OUT) > 0.05)
      throw new Error('it stopped at +'+yEnd.toFixed(2)+', not at BJ_PART_OUT');
    const foot = box(h.group).min.y;
    if(foot < BJ.opH)
      throw new Error('parked, the foot of the drop hangs at y '+foot.toFixed(2)+
                      ' inside a '+BJ.opH+'m picture');
    if(SHOW.scene !== 'interior') throw new Error('the cue never changed the scene');
    return 'in view at +'+yMid.toFixed(2)+' after 2s, dark at +'+yEnd.toFixed(2)+
           ' after '+((frames + 120)/60).toFixed(1)+'s';
  });

  /* the way BACK: goBack is a first-class board control, and the engine
     never homes a whole-group mover on its own — the recall is cue 24's
     own move:{scene:'house', off:0}, and the drop must be seen coming
     down, not found parked in the flies */
  P('goBack to the top of act two brings the flown drop back to the deck', ()=>{
    showLoad('beetlejuice');
    const h = sceneFind('house');
    const i24 = CUES.findIndex(c=>c.scene === 'house');
    const i26 = CUES.findIndex(c=>/1:14:30/.test(c.label));
    fireCue(i24);
    for(let k = 0; k < 360; k++) updateStorm(1/60);
    fireCue(i26);
    for(let k = 0; k < 600; k++) updateStorm(1/60);          // flown, arrived, dark
    /* REVERSED IN PLACE BY RULING CR: BJ_PART_OUT is where a flown SET goes */
    if(Math.abs(h.mv.off - BJ_PART_OUT) > 0.01)
      throw new Error('the exterior never flew out: '+h.mv.off.toFixed(2));
    const wy = ()=>{ scene.updateMatrixWorld(true);
      return byName('bj:house').matrixWorld.elements[13]; };
    const yOut = wy();
    fireCue(i24);                        // the operator goes BACK to cue 24
    if(h.group.userData.sceneOff) throw new Error('the recall did not bring the house on');
    for(let k = 0; k < 120; k++) updateStorm(1/60);          // 2s of a 5s fly-in
    const yMid = wy();
    if(h.group.userData.sceneOff) throw new Error('it went dark on the way down');
    if(!(yMid < yOut - 0.5))
      throw new Error('not descending — still at +'+(yMid - yOut + BJ_PART_OUT).toFixed(2));
    for(let k = 0; k < 600; k++) updateStorm(1/60);
    if(Math.abs(h.mv.off) > 0.01) throw new Error('never came home: '+h.mv.off.toFixed(2));
    if(Math.abs(wy() - (yOut - BJ_PART_OUT)) > 0.05)
      throw new Error('the world disagrees: cloth centre at '+wy().toFixed(2));
    if(h.group.userData.sceneOff) throw new Error('home, and hidden anyway');
    return 'recalled from +'+BJ_PART_OUT.toFixed(2)+', seen at +'+
           (yMid - yOut + BJ_PART_OUT).toFixed(2)+
           ' on the way down, footed on the deck and lit';
  });

  /* The real invariant is that the audience never SEES a set change. A shut
     cloth does that; so does a blackout, which is how a mid-act change is
     covered in a house that is not going to fly the curtain in every time. */
  P('the set never changes in view: a shut cloth or a blackout covers every one', ()=>{
    showLoad('beetlejuice');
    const ls = frontCurtainLineset();
    let changes = 0; const inView = [], how = [];
    for(let i = 1; i < CUES.length; i++){
      if(CUES[i].scene === CUES[i-1].scene) continue;
      changes++;
      const r = CUES[i].fly.find(x=>x.id === ls.id);
      const clothIn = r && r.target < OUT_TRIM - 1;
      /* The cue BEFORE it must have left the stage dark, because the swap is
         instant and the incoming cue's fade starts from wherever it starts.
         A dark RIG is not enough: with the house up the audience can see the
         stage perfectly well, which is why the interval house has to be
         checked too.  A negative check caught this — narrowing it to the rig
         alone let an interval re-dress pass with the cloth out. */
      const prev = CUES[i-1];
      const cameFromDark = !prev.lx.some(x=>x.lvl > 0.02) && prev.house <= 0.05;
      /* THE OWNER'S PLOT ADDED TWO MORE COVERS, and one of them is not a
         cover at all.  The backdrop masks everything upstage of it, so a
         change behind a backdrop that is IN is hidden.  And a cue that
         MOVES the wagon is meant to be seen — RULING AP is "you watch it
         travel", so a set arriving on the wagon in full view is the
         feature, not the fault this test was written to catch. */
      const bd = CUES[i].fly.find(x=>x.id === 14);
      const backdropIn = bd && bd.target < OUT_TRIM - 1;
      if(clothIn) how.push(CUES[i].n + ':cloth');
      else if(cameFromDark) how.push(CUES[i].n + ':blackout');
      else if(backdropIn) how.push(CUES[i].n + ':backdrop');
      else if(CUES[i].move) how.push(CUES[i].n + ':wagon');
      else inView.push(CUES[i].n);
    }
    if(!changes) throw new Error('no cue changes the set');
    if(inView.length)
      throw new Error('the set changes in full view on cue '+inView.join(', '));
    return changes+' set change(s), covered by — '+how.join(', ');
  });

  P('firing the act two cue actually swaps the set — through a changeover', ()=>{
    showLoad('beetlejuice');
    const i = CUES.findIndex(c=>c.scene === 'house');
    if(i < 0) throw new Error('no cue plays in the house');
    fireCue(i);
    if(SHOW.scene !== 'house') throw new Error('the live scene is still '+SHOW.scene);
    const cem = sceneFind('cemetery');
    if(cem.on) throw new Error('the cemetery is still on with the house');
    /* since the choreography landed the cemetery LEAVES BY TRAVELLING
       (RULING AY): the moment the cue fires it is marked off but still
       drawn, its hills on their way to the wings */
    let lit = 0; cem.group.traverse(o=>{ if(o.layers && o.layers.mask !== 0) lit++; });
    if(!lit) throw new Error('the cemetery popped off instead of travelling out');
    for(let k = 0; k < 600; k++) updateStorm(1/60);
    lit = 0; cem.group.traverse(o=>{ if(o.layers && o.layers.mask !== 0) lit++; });
    if(lit) throw new Error(lit+' cemetery pieces still test against a ray after the changeover');
    return 'cue '+CUES[i].n+' put the house on; the cemetery travelled off and went inert';
  });

  console.log('--- the house, from inside ---');

  P('the interior is its own scene, and fits the portal it is seen through', ()=>{
    showLoad('beetlejuice');
    const s = sceneFind('interior');
    if(!s) throw new Error('there is no interior scene');
    sceneShow('interior');
    let m = 0; s.group.traverse(o=>{ if(o.isMesh) m++; });
    if(m < 10) throw new Error('the interior is only '+m+' pieces');
    if(!byName('bj:innerWall')) throw new Error('no wall');
    if(!byName('bj:arch')) throw new Error('no arch');
    const b = box(s.group);
    if(b.max.y > BJ.opH) throw new Error('it reaches y='+b.max.y.toFixed(2)+' through a '+BJ.opH+' opening');
    const wide = Math.max(Math.abs(b.min.x), Math.abs(b.max.x));
    if(wide*2 > BJ.opW + 0.01) throw new Error('it is '+(wide*2).toFixed(2)+'m wide, the opening is '+BJ.opW);
    if(b.min.y < -0.01) throw new Error('it goes below the deck to '+b.min.y.toFixed(2));
    return m+' pieces, '+(wide*2).toFixed(2)+'m x '+b.max.y.toFixed(2)+'m';
  });

  /* the wall is curved so it takes light ACROSS its face — the reference shows
     the interior under five looks, and a flat wall reads the same in all five */
  P('the back wall is curved, not flat', ()=>{
    showLoad('beetlejuice');
    sceneShow('interior');
    const wl = byName('bj:innerWall');
    const b = box(wl);
    const depth = b.max.z - b.min.z, width = b.max.x - b.min.x;
    if(depth < 2) throw new Error('the wall is '+depth.toFixed(2)+'m deep — that is flat');
    if(width < 6) throw new Error('the wall is only '+width.toFixed(2)+'m across');
    return 'wraps '+width.toFixed(1)+'m across and '+depth.toFixed(1)+'m upstage';
  });

  P('the landing is walkable only while the interior is on, and it is upstairs', ()=>{
    showLoad('beetlejuice');
    const l = (()=>{ let r=null; SHOW.group.traverse(o=>{ if(!r && o.name==='bj:landing') r=o; }); return r; })();
    if(!l) throw new Error('no landing was built');
    if(WALKABLE.indexOf(l) >= 0) throw new Error('you can stand upstairs with the cemetery up');
    sceneShow('interior');
    if(WALKABLE.indexOf(l) < 0) throw new Error('the landing is not walkable with the interior on');
    const b = box(l);
    if(b.max.y < 1.5) throw new Error('the landing is only at y='+b.max.y.toFixed(2)+' — that is not a storey');
    sceneShow('cemetery');
    if(WALKABLE.indexOf(l) >= 0) throw new Error('the landing stayed walkable after the interior went off');
    return 'landing at y='+b.max.y.toFixed(2)+', walkable only with the interior live';
  });

  /* 'redecorated' is gone from this list and that is the point of RULING AQ:
     it is no longer a SCENE, it is the Deetz DRESSING of the one room the
     wagon carries.  The photographs settled it — Maitlands, Deetz and
     Beetlejuice are the same architecture three times over. */
  /* the crypt and the sign set are GONE (RULING AS): the crypt is not in the
     show — "i dont know what a crypt is but i dont think there is one" — and
     the sign is a flown piece, not a set.  The closet and the roof replace
     them, off the owner's plot and his photographs.  Their two tests were
     removed with them rather than left asserting nothing. */
  const SCENES = ['cemetery','house','interior','attic','closet','roof','bedroom','afterlife','bare'];
  const DRESSINGS = ['maitland','deetz','bj'];

  /* This used to read "exactly one is ever live" and count SHOW.scenes flat.
     The flown sign broke both halves on purpose: it is a scene so that it can
     carry a travel and be flown, but it is NOT one of the sets that take
     turns — it hangs downstage of the house curtain and is on the stage
     whatever is up (RULING AS, sc.always).  So the count is the sets PLUS the
     always pieces, and "exactly one live" means exactly one SET live.  The
     rewrite is also stronger than what it replaces: it now pins that the sign
     survives every one of the ten changes. */
  const ALWAYS = ['bjSign'];

  P('every scene is registered and exactly one SET is ever live', ()=>{
    showLoad('beetlejuice');
    if(SHOW.scenes.length !== SCENES.length + ALWAYS.length)
      throw new Error(SHOW.scenes.length+' scenes, expected '+(SCENES.length+ALWAYS.length));
    for(const n of ALWAYS){
      const a = sceneFind(n);
      if(!a) throw new Error('no scene called '+n);
      if(!a.always) throw new Error(n+' is not marked always, so a set change will sweep it off');
      if(!a.on) throw new Error(n+' is not on at load');
    }
    for(const n of SCENES){
      if(!sceneFind(n)) throw new Error('no scene called '+n);
      sceneShow(n);
      const on = SHOW.scenes.filter(s=>s.on && !s.always);
      if(on.length !== 1) throw new Error(on.length+' sets live at once with '+n+' up');
      if(on[0].name !== n) throw new Error('asked for '+n+', got '+on[0].name);
      if(!sceneFind('bjSign').on) throw new Error('the sign went off when '+n+' came on');
    }
    return SHOW.scenes.map(s=>s.name);
  });

  console.log('--- the confetti ---');

  P('the confetti fires on his own second, and it falls and clears itself', ()=>{
    showLoad('beetlejuice');
    /* It used to be the LAST cue, because the built plot hung it on 2:15:00
       with the curtain.  His act 2.txt separates them — "2:14:52 confetti
       shoots over the audiane" and then "2:15 curtain comes in" — so it goes
       off eight seconds ahead of the cloth, over a lit house, and the curtain
       cue is the one that ends the show. */
    const fired = CUES.filter(c=>c.confetti);
    if(fired.length !== 1)
      throw new Error(fired.length + ' cues fire confetti, there is one moment for it');
    const last = fired[0];
    if(last.at !== 8092)
      throw new Error('the confetti is at ' + last.at + 's, he wrote 2:14:52');
    const after = CUES[CUES.indexOf(last) + 1];
    if(!after) throw new Error('nothing follows the confetti — the curtain never comes in');
    if(after.at - last.at !== 8)
      throw new Error('the curtain is ' + (after.at - last.at) + 's after it, he wrote eight');
    showCueExtras(last);
    const c = SHOW.confetti;
    if(!c) throw new Error('the cue did not fire it');
    if(WALKABLE.indexOf(c.mesh) >= 0) throw new Error('you can stand on the confetti');
    const high = c.bits.filter(b=>b.y > 1).length;
    if(high < 200) throw new Error('only '+high+' pieces, and they start on the floor');
    /* it falls off dt, and it is not instant.  Measure the DROP, not how
       many have landed: a second in they have fallen a metre or two and are
       all still in the air, which is exactly right for confetti. */
    const avg = ()=>c.bits.reduce((a2,b2)=>a2+b2.y,0)/c.bits.length;
    const y0 = avg();
    for(let i=0;i<60;i++) updateStorm(1/60);
    const y1 = avg();
    if(y1 >= y0 - 0.5) throw new Error('a second in it has fallen '+(y0-y1).toFixed(2)+'m');
    if(y1 < 1) throw new Error('it dropped '+(y0-y1).toFixed(1)+'m in a second — that is a stone, not confetti');
    /* and it clears itself rather than sitting on the deck for the night */
    for(let i=0;i<3000;i++) updateStorm(1/60);
    if(SHOW.confetti) throw new Error('the confetti never cleared');
    return high+' pieces, fell '+(y0-y1).toFixed(2)+'m in the first second, gone by the end';
  });

  console.log('--- the house is a wagon (RULING AP) ---');

  const zBox = name => { const sc = sceneFind(name); const b = new THREE.Box3();
    scene.updateMatrixWorld(true);
    sc.group.traverse(o=>{ if(o.isMesh) b.expandByObject(o); }); return b; };

  P('the house loads PARKED, hidden behind the last lineset', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('interior');
    if(!sc.mv) throw new Error('the house does not travel');
    if(sc.mv.axis !== 'z') throw new Error('it travels on '+sc.mv.axis+', not up and down stage');
    if(Math.abs(sc.mv.off - BJ_WAGON_BACK) > 1e-6)
      throw new Error('it loads at '+sc.mv.off+', not parked at '+BJ_WAGON_BACK);
    const b = zBox('interior'), last = FLY[FLY.length - 1];
    /* parked, every part of it must be UPSTAGE of the cloth it hides behind */
    if(b.max.z > last.z)
      throw new Error('parked it still pokes out to z='+b.max.z.toFixed(2)+
                      ' past the backdrop at '+last.z.toFixed(2));
    /* and clear of the brick behind it — this is what the deeper Palace bought */
    if(b.min.z < PAL_BACK)
      throw new Error('parked it stands in the brick: z='+b.min.z.toFixed(2)+' against '+PAL_BACK);
    return 'parked z '+b.min.z.toFixed(2)+' .. '+b.max.z.toFixed(2)+
           ', behind the backdrop at '+last.z.toFixed(2)+', clear of '+PAL_BACK;
  });

  P('it slides on, and you can watch it do it', ()=>{
    showLoad('beetlejuice');
    sceneShow('interior');
    const sc = sceneFind('interior');
    sceneMoveTo('interior', 0);
    /* TIME the crossing.  The first version of this checked the position half
       way through a window computed FROM the speed — which is no test at all,
       because it scales with whatever speed is set and a 400 m/s wagon passed
       it happily.  What RULING AP actually asks for is that the travel takes
       long enough to watch, so that is what is measured. */
    let frames = 0, dark = 0, mid = null;
    while(sceneTravelling(sc) && frames < 3600){
      updateStorm(1/60); frames++;
      if(mid === null && sc.mv.off > BJ_WAGON_BACK/2) mid = sc.mv.off;
      /* a dressing that is NOT being worn is legitimately dark (RULING AQ),
         so only the room the audience is looking at is counted */
      sc.group.traverse(o=>{ if(!o.isMesh || o.layers.mask !== 0) return;
        let p = o, off = false;
        while(p){ if(p.userData && p.userData.sceneOff && p.name &&
                     p.name.indexOf('dress:') === 0) off = true; p = p.parent; }
        if(!off) dark++; });
    }
    const secs = frames/60;
    if(secs < 2)  throw new Error('the house crossed in '+secs.toFixed(2)+'s — nobody can watch that');
    if(secs > 12) throw new Error('the house took '+secs.toFixed(1)+'s — the show would wait on it');
    if(dark) throw new Error(dark+' mesh-frames were dark while it travelled on');
    if(Math.abs(sc.mv.off) > 0.01) throw new Error('it never arrived: '+sc.mv.off);
    /* on stage, it plays where it was built */
    const b = zBox('interior');
    if(b.max.z < FLY[FLY.length-1].z)
      throw new Error('it arrived still behind the backdrop');
    return 'parked '+BJ_WAGON_BACK+' -> on at 0.00 in '+(frames/60).toFixed(1)+'s, lit throughout';
  });

  P('the landing you can stand on rides the house on and off', ()=>{
    showLoad('beetlejuice');
    sceneShow('interior');
    const sc = sceneFind('interior');
    const land = sc.walk[0];
    if(!land) throw new Error('the house files nothing walkable');
    scene.updateMatrixWorld(true);
    const parked = land.matrixWorld.elements[14];
    sceneMoveTo('interior', 0);
    for(let i=0;i<900;i++) updateStorm(1/60);
    scene.updateMatrixWorld(true);
    const on = land.matrixWorld.elements[14];
    if(Math.abs((on - parked) - Math.abs(BJ_WAGON_BACK)) > 0.05)
      throw new Error('the landing moved '+(on-parked).toFixed(2)+' where the house moved '+Math.abs(BJ_WAGON_BACK));
    if(WALKABLE.indexOf(land) < 0) throw new Error('it left WALKABLE while the house was on');
    return 'the landing travelled '+(on-parked).toFixed(2)+'m with the house, still stood on';
  });

  console.log('--- everything that flies ---');

  /* A CLOTH IS THE LAST THING UPSTAGE.  This is the rule the first hang broke:
     the backdrop went on line 8 (z=-6.10), downstage of the interior wall at
     -9.20 and of most of every other set, so the thing meant to back the show
     would have masked it.  Nothing caught that, because nothing asserted the
     one structural fact that makes a backdrop a backdrop. */
  P('the cloths are the two DEEPEST hung lines, or they mask the show', ()=>{
    showLoad('beetlejuice');
    const hung = FLY.filter(ls=>ls.goodsKey && ls.goodsKey !== 'none');
    const cloths = hung.filter(ls=>ls.goodsKey === 'bjBackdrop' || ls.goodsKey === 'sky');
    if(cloths.length !== 2) throw new Error('expected two cloths hung, found '+cloths.length);
    const deepest = hung.slice().sort((a,b)=>a.z - b.z).slice(0, 2);
    for(const c of cloths)
      if(deepest.indexOf(c) < 0)
        throw new Error(c.goodsKey+' at z='+c.z.toFixed(2)+' is not one of the two deepest hung lines');
    return cloths.map(c=>c.goodsKey+' at z='+c.z.toFixed(2)).join(', ');
  });

  P('every set that shares the stage with a cloth stands in FRONT of it', ()=>{
    showLoad('beetlejuice');
    /* update from the ROOT.  updateMatrixWorld(true) on a child composes
       against its parent's stale matrixWorld, so a set the mover has just
       driven reports the position it used to be at (TRAPS.md). */
    const zOf = name => { const sc = sceneFind(name); let z = 0;
      scene.updateMatrixWorld(true);
      sc.group.traverse(o=>{ if(o.isMesh){
        z = Math.min(z, new THREE.Box3().setFromObject(o).min.z); } }); return z; };
    const bd = FLY.find(ls=>ls.goodsKey === 'bjBackdrop');
    const sk = FLY.find(ls=>ls.goodsKey === 'sky');
    /* CLEARANCE, not merely order.  drape() waves the cloth +-0.05 and a
       lineset is hauled by hand, so a set standing 7cm off its own backing is
       touching it in practice.  Ask for room to work in. */
    const CLEAR = 0.35;
    /* act two opens on the exterior AND its sky together — the pairing the
       owner's plot makes, and the one that was broken */
    const hz = zOf('house');
    if(hz - sk.z < CLEAR)
      throw new Error('the house exterior reaches '+hz.toFixed(2)+' against its sky at '+
                      sk.z.toFixed(2)+' — '+(hz - sk.z).toFixed(2)+'m of clearance');
    /* and the room the wagon carries plays against the backdrop — measured
       where it PLAYS, not where it parks.  The house is a wagon now (RULING
       AP) and it loads parked upstage of the backdrop, which is the whole
       point of parking it; asking about its clearance back there answers a
       question nobody has. */
    sceneMoveTo('interior', 0);
    for(let i=0;i<900;i++) updateStorm(1/60);
    const iz = zOf('interior');
    if(iz - bd.z < CLEAR)
      throw new Error('the interior reaches '+iz.toFixed(2)+' against the backdrop at '+
                      bd.z.toFixed(2)+' — '+(iz - bd.z).toFixed(2)+'m of clearance');
    return 'house clears its sky by '+(hz - sk.z).toFixed(2)+'m, interior clears the backdrop by '+
           (iz - bd.z).toFixed(2)+'m';
  });

  P('the backdrop and the sky are CLOTHS, on real linesets', ()=>{
    showLoad('beetlejuice');
    const bd = FLY[13], sk = FLY[12];
    if(bd.goodsKey !== 'bjBackdrop') throw new Error('line 14 carries '+bd.goodsKey);
    if(sk.goodsKey !== 'sky')        throw new Error('line 13 carries '+sk.goodsKey);
    /* the backdrop is on the LAST line, because that is what the wagon hides
       behind (owner, 2026-08-10) */
    if(bd !== FLY[FLY.length-1]) throw new Error('the backdrop is not on the final lineset');
    /* the graveyard's backdrop is IN at the top; act two's sky waits out */
    if(Math.abs(bd.pos - TRIMS.bjBackdrop) > 0.01)
      throw new Error('the backdrop is not at its trim: '+bd.pos.toFixed(2));
    if(Math.abs(sk.pos - OUT_TRIM) > 0.01)
      throw new Error('the sky is not flown out: '+sk.pos.toFixed(2));
    /* a cloth trimmed too low hangs through the deck — the standing rule */
    const foot = TRIMS.bjBackdrop - GOODS.bjBackdrop.h;
    if(foot < -0.1 || foot > 0.6)
      throw new Error('the backdrop foots at y='+foot.toFixed(2)+', not on the deck');
    /* RULING AW repainted it to the photograph, and the moon a third the
       cloth height wants pixels: pinned so a later repaint cannot silently
       ship the sky at postage-stamp resolution */
    let img = null;
    bd.goods.traverse(o=>{ if(!img && o.isMesh && o.material.map) img = o.material.map.image; });
    if(!img) throw new Error('the backdrop carries no painted canvas');
    if(img.width !== 2048 || img.height !== 1024)
      throw new Error('the backdrop canvas is '+img.width+'x'+img.height+', pinned at 2048x1024');
    return 'backdrop in at '+bd.pos.toFixed(2)+' footing at '+foot.toFixed(2)+', sky out at '+sk.pos.toFixed(2)+
           ', painted at '+img.width+'x'+img.height;
  });

  P('lifting and dropping the backdrop is a TRIM, not new machinery', ()=>{
    showLoad('beetlejuice');
    const bd = FLY[7];
    flyTo(bd, OUT_TRIM);                      // "the backdrop lifts up"
    for(let i=0;i<900;i++) updateFly(1/60);
    if(Math.abs(bd.pos - OUT_TRIM) > 0.05)
      throw new Error('it did not fly out: '+bd.pos.toFixed(2));
    flyTo(bd, TRIMS.bjBackdrop);              // "the backdrop drops down"
    for(let i=0;i<900;i++) updateFly(1/60);
    if(Math.abs(bd.pos - TRIMS.bjBackdrop) > 0.05)
      throw new Error('it did not come back in: '+bd.pos.toFixed(2));
    return 'out to '+OUT_TRIM.toFixed(2)+' and back in to '+TRIMS.bjBackdrop.toFixed(2)+', on the fly system';
  });

  P('the sign hangs DOWNSTAGE of the curtain, where no batten can reach', ()=>{
    showLoad('beetlejuice');
    const p = byName('bj:flySign');
    if(!p) throw new Error('no flown sign');
    const z = box(p).max.z;
    if(z <= FLY[0].z)
      throw new Error('the sign is at z='+z.toFixed(2)+', upstage of the curtain at '+FLY[0].z);
    /* and there is genuinely no line in front of it — that is WHY it moves */
    const downstage = FLY.filter(ls=>ls.z > FLY[0].z);
    if(downstage.length) throw new Error(downstage.length+' linesets are downstage of the curtain after all');
    return 'sign at z='+z.toFixed(2)+', curtain line at '+FLY[0].z+', no batten downstage of it';
  });

  /* measured on the WHOLE sign, not the panel.  The arrow rakes down off the
     bottom corner and is the lowest thing on it, so a panel-only check would
     happily pass with the arrow still hanging in the opening. */
  P('the sign flies out clear of the opening, arrow and all', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('bjSign');
    const low = ()=>box(sc.group).min.y;
    const inLow = low();
    if(inLow > D.procH) throw new Error('the sign is masked before it even flies');
    if(byName('bj:flySignArrow') && box(byName('bj:flySignArrow')).min.y >= box(byName('bj:flySign')).min.y)
      throw new Error('the arrow is not the lowest thing on the sign — check what this measures');
    sceneMoveTo('bjSign', BJ_SIGN_OUT);
    for(let i=0;i<900;i++) updateStorm(1/60);
    const outLow = low();
    if(outLow < D.procH)
      throw new Error('flown out it still hangs into the opening: y='+outLow.toFixed(2));
    sceneMoveTo('bjSign', 0);
    for(let i=0;i<900;i++) updateStorm(1/60);
    if(Math.abs(low() - inLow) > 0.05) throw new Error('it did not come back to its in trim');
    return 'in at y='+inLow.toFixed(2)+', out at y='+outLow.toFixed(2)+' over a '+D.procH+' opening';
  });

  /* What the photograph is: two decks of name in a bulb surround, and an arrow
     raking off it.  jsdom cannot see a canvas — fillText is a noop in this
     harness — so the LOOK is not testable here and is not claimed to be.
     What is testable is that the parts exist, that the arrow rakes rather than
     sitting square, that it all stays inside the portal it is seen through,
     and that the bulbs are one merged mesh rather than fifty. */
  P('the marquee is a panel, a bulb surround and a raking arrow', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('bjSign');
    const arrow = byName('bj:flySignArrow');
    if(!arrow) throw new Error('no arrow on the sign');
    if(Math.abs(arrow.parent.rotation.z) < 0.05)
      throw new Error('the arrow sits square instead of raking');
    const face = byName('bj:flySign');
    if(!face.material.emissiveMap) throw new Error('the marquee face is not lit as neon');
    if(!arrow.material.emissiveMap) throw new Error('the arrow is not lit as neon');
    let meshes = 0;
    sc.group.traverse(o=>{ if(o.isMesh) meshes++; });
    if(meshes > 8) throw new Error(meshes+' meshes on one sign — the bulbs are not merged');
    /* and it must read through the portal, like everything else */
    const b = box(sc.group);
    const wide = Math.max(Math.abs(b.min.x), Math.abs(b.max.x));
    if(wide*2 > BJ.opW) throw new Error('the sign is '+(wide*2).toFixed(2)+'m across a '+BJ.opW+' opening');
    if(b.max.y > D.procH) throw new Error('the sign tops out at '+b.max.y.toFixed(2)+' in a '+D.procH+' opening');
    return meshes+' meshes, '+(wide*2).toFixed(2)+'m across, raking '+
           arrow.parent.rotation.z.toFixed(2)+' rad';
  });

  P('the sign is not one of the sets you can pick from', ()=>{
    showLoad('beetlejuice');
    refreshSceneUI();
    const rows = Array.from(document.querySelectorAll('#sceneList .cue')).map(e=>e.dataset.s);
    if(rows.indexOf('bjSign') >= 0) throw new Error('the sign is offered as a set to change to');
    if(rows.length !== SCENES.length) throw new Error(rows.length+' rows for '+SCENES.length+' sets');
    /* and asking for it directly must not empty the stage */
    sceneShow('cemetery');
    sceneShow('bjSign');
    if(SHOW.scene !== 'cemetery') throw new Error('asking for the sign changed the set to '+SHOW.scene);
    return rows.length+' sets listed, the sign not among them';
  });

  P('striking the show takes ITS backdrop and leaves the stock sky alone', ()=>{
    showLoad('beetlejuice');
    if(!GOODS.bjBackdrop) throw new Error('the backdrop was never made');
    showStrike();
    if(GOODS.bjBackdrop) throw new Error('the made backdrop outlived the show');
    /* SHOW.goods is the DELETE list on strike, so a stock good put on it is
       destroyed for every show that follows.  sky is stock: it is hung, never
       registered.  This cost three suites the first time. */
    if(!GOODS.sky) throw new Error('the stock sky was deleted with the show');
    if(!GOODS.cyc || !GOODS.house) throw new Error('the stock catalogue was damaged');
    showLoad('lostboys');
    return 'backdrop gone, sky and the rest of the catalogue intact';
  });

  console.log('--- the three dressings ---');

  /* every scene has to read through the ONE portal, and every scene has to be
     substantial enough to be worth a change — checked in a single sweep so a
     new scene cannot be added later without meeting both */
  /* Two OPPOSITE rules, which is why this is one sweep and not one limit.
     A piece standing in the acting area sits close to the portal, so it must
     fit INSIDE the opening or it shows past the frame.  A backing far upstage
     must be WIDER than the opening, or the portal reveals its edge instead of
     cropping it — masking a backdrop to the opening exactly is the classic
     mistake.  Split on the piece's centre, not its near face, so one long
     rafter does not read as a backing. */
  const UPSTAGE_OF = -11;

  P('every scene is substantial, and fits what it is seen through', ()=>{
    showLoad('beetlejuice');
    const out = [];
    for(const n of SCENES){
      const s = sceneFind(n);
      sceneShow(n);
      let m = 0, backing = 0;
      s.group.traverse(o=>{
        if(!o.isMesh) return;
        m++;
        const b = box(o);
        if(b.min.y < -0.01) throw new Error(n+' has a piece below the deck at '+b.min.y.toFixed(2));
        const cz = (b.min.z + b.max.z)/2;
        const wide = (b.max.x - b.min.x);
        const H = BJ.opW/2;
        /* WIDER THAN THE HOLE IS MASKING, wherever it stands.  The
           cemetery's cut hills came downstage of the backdrop when the cloth
           moved to the last lineset (the owner's photograph has them in FRONT
           of a painted sky), and a 27m ground row is not an acting-area piece
           that has escaped the opening — it is the thing that frames it. */
        if(wide > BJ.opW){ backing++; return; }
        if(cz > UPSTAGE_OF){
          if(b.max.y > BJ.opH)
            throw new Error(n+' has an acting-area piece at y='+b.max.y.toFixed(2)+
                            ' through a '+BJ.opH+' opening');
          /* it must lie WITHIN the opening, not merely be narrow enough — a
             piece off to one side hides behind a portal leg and shows from
             the side seats, which is worse than not building it */
          if(b.min.x < -H - 0.01 || b.max.x > H + 0.01)
            throw new Error(n+' has an acting-area piece spanning x '+
                            b.min.x.toFixed(2)+' to '+b.max.x.toFixed(2)+
                            ', the opening is +-'+H.toFixed(2));
        } else if(wide > BJ.opW){
          backing++;                       // a proper backing: wider than the hole
        }
      });
      /* the exterior is a painted DROP now (RULING AW): one cloth IS the
         whole scene, and that is the point of it — every other set still
         has to be worth a change */
      const need = (n === 'house') ? 1 : 6;
      if(m < need) throw new Error(n+' is only '+m+' piece(s)');
      out.push(n+':'+m+(backing ? '+'+backing+'backing' : ''));
    }
    return out.join(' ');
  });

  /* The sweep above COUNTS backings; it cannot demand one, because a room with
     walls does not have a backdrop. So the one scene that is backed by a
     backdrop gets its own assertion: every hill must be wider than the opening
     it masks, or the portal reveals its edge. (The sweep alone passed happily
     with the hills narrowed to 8m — a negative check found that.) */
  P('the cemetery hills mask the opening rather than sitting inside it', ()=>{
    showLoad('beetlejuice');
    sceneShow('cemetery');
    /* by NAME, not by width — guessing "anything wide and upstage" swept in the
       moon's halo at 6.2m and reported it as a backdrop with a visible edge */
    const hills = [];
    sceneFind('cemetery').group.traverse(o=>{
      if(o.isMesh && o.name === 'bj:hill') hills.push(box(o));
    });
    if(hills.length < 3) throw new Error('only '+hills.length+' upstage backing piece(s)');
    for(const b of hills){
      const w = b.max.x - b.min.x;
      if(w <= BJ.opW)
        throw new Error('a backing is '+w.toFixed(2)+'m across a '+BJ.opW+'m opening — its edge shows');
    }
    return hills.length+' backings, narrowest '+
           Math.min.apply(null, hills.map(b=>b.max.x-b.min.x)).toFixed(1)+'m across a '+BJ.opW+'m opening';
  });

  /* The frames are neon, so the existing p5d machinery drives them off each
     cue's neon field.  A material per tube is REQUIRED here, because
     updateNeon writes a colour into every tube every frame — this is the one
     place in this show where sharing one material would be the bug.
     NOTE: no backticks anywhere in this probe. The whole thing is a template
     string, so one backtick in a COMMENT ends it and the suite dies at parse
     time — the same family as the backslash and apostrophe traps. */
  P('the afterlife frames are registered as neon, and nest', ()=>{
    showLoad('beetlejuice');
    sceneShow('afterlife');
    const rings = [];
    sceneFind('afterlife').group.traverse(o=>{ if(o.isMesh && o.name === 'bj:ring') rings.push(o); });
    if(rings.length < 5) throw new Error('only '+rings.length+' frames');
    if(!SHOW.neon || SHOW.neon.length < 5)
      throw new Error('the frames are not on SHOW.neon, so no cue can fade them');
    /* each tube its own material, or updateNeon would drive them all together */
    const mats = new Set(rings.map(r=>r.material.uuid));
    if(mats.size !== rings.length)
      throw new Error(mats.size+' materials for '+rings.length+' tubes — they would fade as one');
    /* and they must actually nest: narrower the further upstage */
    const by = rings.map(r=>{ const b = box(r);
      return {w:b.max.x - b.min.x, z:(b.min.z + b.max.z)/2}; })
      .sort((a,b)=>b.z - a.z);                    // downstage first
    for(let i = 1; i < by.length; i++)
      if(by[i].w >= by[i-1].w)
        throw new Error('frame '+i+' is '+by[i].w.toFixed(2)+'m, no narrower than the one downstage');
    return rings.length+' frames, '+by[0].w.toFixed(1)+'m down to '+by[by.length-1].w.toFixed(1)+'m';
  });

  /* RULING BV — the netherworld skewed to HIS PHOTOGRAPH.  "just use this as a
     backdrop for the netherworld", so the picture is the LOOK: nested TILTED
     TRAPEZOIDS receding upstage, all blue with bright edges, over a dark blue
     backing.  The photograph itself is never committed (TRAPS draws the line at
     looking versus committing), so what is testable is the three things it
     changed, and those are all measurable. */
  P('the netherworld frames are TRAPEZOIDS, tilted, and all blue (RULING BV)', ()=>{
    showLoad('beetlejuice');
    sceneShow('afterlife');
    const rings = [];
    sceneFind('afterlife').group.traverse(o=>{ if(o.isMesh && o.name === 'bj:ring') rings.push(o); });
    if(rings.length < 5) throw new Error('only '+rings.length+' frames');

    for(const r of rings){
      /* TRAPEZOID: narrower at the top than the bottom.  Measured off the
         geometry rather than off the numbers that built it — a test that
         re-reads its own input agrees with itself whatever the code does. */
      r.geometry.computeBoundingBox();
      const p = r.geometry.attributes.position;
      let topX = 0, botX = 0;
      const bb = r.geometry.boundingBox;
      const hiY = bb.max.y - (bb.max.y - bb.min.y)*0.1;
      const loY = bb.min.y + (bb.max.y - bb.min.y)*0.1;
      for(let i = 0; i < p.count; i++){
        const y = p.getY(i), x = Math.abs(p.getX(i));
        if(y >= hiY) topX = Math.max(topX, x);
        if(y <= loY) botX = Math.max(botX, x);
      }
      if(!(botX - topX > 0.30))
        throw new Error('a frame is '+(2*botX).toFixed(2)+'m at the foot and '+
                        (2*topX).toFixed(2)+'m at the head — that is a rectangle, not a trapezoid');
      /* TILTED: a canted frame, not an axis-aligned one */
      if(Math.abs(r.rotation.z) < 0.02)
        throw new Error('a frame is not canted at all (rotation.z '+r.rotation.z.toFixed(3)+')');
      /* ALL BLUE: blue dominant over both other channels, by a clear margin */
      const c = SHOW.neon.find(n=>n.mesh === r);
      if(!c) throw new Error('a frame is not registered on SHOW.neon');
      const {r:cr, g:cg, b:cb} = c.base;
      if(!(cb > cg + 0.05 && cb > cr + 0.20))
        throw new Error('a frame base is '+c.base.getHexString()+' — not blue');
      /* and NOTHING through the deck: the cant rotates the frame about its own
         centre precisely so a bottom corner does not go under the stage */
      const b = box(r);
      if(b.min.y < 0)
        throw new Error('a canted frame dips '+b.min.y.toFixed(3)+'m through the deck');
    }
    /* BRIGHTENING UPSTAGE, which is what draws the eye down the tunnel */
    const byZ = rings.map(r=>({z:box(r).min.z, lum:(()=>{ const c = SHOW.neon.find(n=>n.mesh===r).base;
      return c.r + c.g + c.b; })()})).sort((a,b)=>b.z - a.z);
    if(!(byZ[byZ.length-1].lum > byZ[0].lum + 0.3))
      throw new Error('the furthest frame is not brighter than the nearest — the tunnel has no draw');
    return rings.length + ' blue trapezoids, canted, brightening ' +
           byZ[0].lum.toFixed(2) + ' -> ' + byZ[byZ.length-1].lum.toFixed(2) + ' upstage';
  });

  P('the netherworld stands against a BLACK backing that is NOT neon', ()=>{
    showLoad('beetlejuice');
    sceneShow('afterlife');
    const back = byName('bj:aftBacking');
    if(!back) throw new Error('there is no backing — his picture has the frames over a dark ground');
    const c = back.material.color;
    /* REVERSED IN PLACE, and only half of it.  RULING BV read a dark blue ground
       off his photograph and this demanded blue; he has since said "makes its
       backdrop black", so the colour half flips — but every other clause below is
       untouched and load-bearing, which is exactly why the assertion is turned
       round rather than deleted. */
    if(c.r + c.g + c.b > 0.03)
      throw new Error('the backing is '+c.getHexString()+', and he asked for black');
    /* it must NOT be a tube: updateNeon writes a colour into every registered
       mesh every frame, so a registered backing would hum and flicker with them */
    if(SHOW.neon.some(n=>n.mesh === back))
      throw new Error('the backing is registered as neon — it would flicker');
    /* MeshBasic, because the netherworld plays in a blackout and a lit
       material would go black with the rig, taking the ground with it */
    if(back.material.type !== 'MeshBasicMaterial')
      throw new Error('the backing is a ' + back.material.type + ' — it would go dark with the rig');
    /* upstage of every frame, and inside the picture it is seen through */
    const bb = box(back);
    const rings = [];
    sceneFind('afterlife').group.traverse(o=>{ if(o.isMesh && o.name === 'bj:ring') rings.push(o); });
    for(const r of rings)
      if(box(r).min.z <= bb.max.z)
        throw new Error('a frame is level with or behind the backing');
    if(bb.max.x - bb.min.x > BJ.opW + 0.01)
      throw new Error('the backing is '+(bb.max.x - bb.min.x).toFixed(2)+'m across a '+BJ.opW+' opening');
    return 'a ' + c.getHexString() + ' MeshBasic ground, ' +
           (bb.max.x - bb.min.x).toFixed(1) + 'm x ' + (bb.max.y - bb.min.y).toFixed(1) +
           'm at z=' + bb.max.z.toFixed(1) + ', upstage of all ' + rings.length + ' frames, unregistered';
  });

  P('the cue drives the neon, and the level is not stuck at one', ()=>{
    showLoad('beetlejuice');
    const lv = CUES.map(c=>c.neon);
    if(lv.some(v=>v === undefined)) throw new Error('a cue carries no neon level');
    const distinct = new Set(lv);
    if(distinct.size < 3)
      throw new Error('only '+distinct.size+' distinct neon level(s) — the cue field is being ignored');
    /* the show no longer ENDS in a blackout — RULING AR ends it at 2:15:00
       with confetti, the curtain in and the house to half — so the check
       moves to the act break, which is still a true blackout, and to the
       last cue, where the frames must be out however the show finishes. */
    const dark = CUES.filter(c=>/END OF HALF/.test(c.label));
    if(!dark.length) throw new Error('no act-break blackout to check');
    if(dark[0].neon > 0.02) throw new Error('the frames are still lit in the act break');
    if(CUES[CUES.length-1].neon > 0.02) throw new Error('the frames are still lit at the end');
    /* and it actually moves the tubes */
    const aftCue = CUES.findIndex(c=>c.scene === 'afterlife' && c.neon > 1);
    fireCue(aftCue);
    for(let i=0;i<200;i++) updateNeon(0.05);
    if(SHOW.neonLevel < 0.5) throw new Error('the neon did not come up: '+SHOW.neonLevel.toFixed(2));
    return distinct.size+' distinct levels, live at '+SHOW.neonLevel.toFixed(2);
  });

  P('the chevron spans the opening it is seen through', ()=>{
    showLoad('beetlejuice');
    sceneShow('afterlife');
    const c = byName('bj:chevron');
    if(!c) throw new Error('no chevron');
    const b = box(c);
    if(b.max.x - b.min.x < 10)
      throw new Error('the chevron is only '+(b.max.x-b.min.x).toFixed(2)+'m across');
    if(b.max.y > BJ.opH) throw new Error('it reaches y='+b.max.y.toFixed(2));
    return (b.max.x-b.min.x).toFixed(1)+'m across, '+b.max.y.toFixed(1)+'m up';
  });

  /* act two now follows the MEASURED order, which PR 4 had inverted */
  P('act two runs in the order the recording puts it in', ()=>{
    showLoad('beetlejuice');
    const iv = CUES.findIndex(c=>/INTERVAL/.test(c.label));
    const seq = [];
    CUES.slice(iv + 1).forEach(c=>{ if(seq[seq.length-1] !== c.scene) seq.push(c.scene); });
    /* the afterlife appears TWICE on purpose: 118:04 sits between the
       afterlife looks and the chevron at 121:54, so the set goes out to the
       sign and comes back.  That is what the recording says happened. */
    /* the owner's order, not the measurement's: the exterior, the house on
       its wagon, the attic, the house again, the netherworld, and the house
       one last time for the call. */
    const want = ['house','interior','attic','interior','afterlife','interior'];
    if(seq.join('>') !== want.join('>'))
      throw new Error('act two runs '+seq.join(' > ')+', the recording says '+want.join(' > '));
    return seq.join(' > ');
  });

  console.log('--- the remainder: the crypt, the sign, the bare stage ---');


  /* RULING AO again, and this is where it bites hardest: the real production's
     signage is precisely the authored detail the ruling excludes. */

  P('the bare stage is masking and a ghost light, not an empty group', ()=>{
    showLoad('beetlejuice');
    sceneShow('bare');
    const b = sceneFind('bare');
    let m = 0; b.group.traverse(o=>{ if(o.isMesh) m++; });
    if(m < 6) throw new Error('the bare stage is only '+m+' pieces');
    if(!byName('bj:masking')) throw new Error('no masking — that is an empty stage, not a bare one');
    if(!byName('bj:ghostLight')) throw new Error('no ghost light');
    /* THE CALL NO LONGER HAPPENS ON IT.  The owner's plot ends with the house
       sliding all the way back and staying in view — "House slide back but
       backdrop stay up. Curtain call" — so the bare stage is kept, reachable
       from the scene panel and costing nothing with its layers off, but no
       cue plays on it.  What follows used to assert a cue did. */
    if(CUES.some(c=>c.scene === 'bare'))
      throw new Error('a cue plays on the bare stage — the plot puts the call on the parked house');
    return m+' pieces, masking and a ghost light, no cue on it';
  });

  P('act one runs across five sets and act two across five', ()=>{
    showLoad('beetlejuice');
    const iv = CUES.findIndex(c=>/INTERVAL/.test(c.label));
    const one = new Set(CUES.slice(0, iv).map(c=>c.scene));
    const two = new Set(CUES.slice(iv + 1).map(c=>c.scene));
    /* act one carries six now (cemetery, the house, attic, closet, bedroom,
       roof) and act two four, because the owner's plot works the ONE house
       three times in act two rather than giving each a set of its own. */
    if(one.size < 6) throw new Error('act one uses only '+one.size+' set(s)');
    if(two.size < 4) throw new Error('act two uses only '+two.size+' set(s)');
    return 'act one: '+[...one].join(', ')+' | act two: '+[...two].join(', ');
  });

  /* This used to show two SCENES and compare their walls to argue they were
     the same room.  Under RULING AQ they are literally the same room, so the
     assertion is stronger now: the three dressings hang on ONE shell, exactly
     one is ever lit, and the architecture they share never goes off. */
  P('the three dressings hang on one room, and one is ever lit', ()=>{
    showLoad('beetlejuice');
    sceneShow('interior');
    const sc = sceneFind('interior');
    if(!sc.dress) throw new Error('the room carries no dressings');
    for(const d of DRESSINGS) if(!sc.dress[d]) throw new Error('no '+d+' dressing');
    if(Object.keys(sc.dress).length !== DRESSINGS.length)
      throw new Error(Object.keys(sc.dress).length+' dressings, expected '+DRESSINGS.length);
    const lit = key => { let n = 0; sc.dress[key].traverse(o=>{ if(o.isMesh && o.layers.mask !== 0) n++; }); return n; };
    for(const d of DRESSINGS){
      bjDress('interior', d);
      if(!lit(d)) throw new Error(d+' is not lit when it is the one worn');
      for(const o of DRESSINGS) if(o !== d && lit(o))
        throw new Error(o+' is still lit with '+d+' on');
    }
    /* a SET CHANGE must not light all three on the way back.  sceneShow
       enables every descendant, so without the sceneApply hook the room comes
       back wearing all three dressings at once. */
    bjDress('interior', 'bj');
    sceneShow('cemetery');
    sceneShow('interior');
    for(const o of DRESSINGS) if(o !== 'bj' && lit(o))
      throw new Error(o+' lit up again when the room came back on');
    /* and a CUE is what chooses the dressing, the way it chooses the set —
       fired while the room is OFF, because a dress on a room in view now
       DEFERS (RULING AY).  The deferral has its own test below. */
    sceneShow('cemetery');
    showCueExtras({scene:'interior', dress:'deetz'});
    if(!lit('deetz')) throw new Error('a cue cannot put a dressing on');
    if(lit('bj')) throw new Error('the old dressing stayed on under the new one');

    /* and the shell — the stairs you climb — belongs to none of them */
    bjDress('interior', 'deetz');
    const land = byName('bj:landing');
    if(!land) throw new Error('the landing went with a dressing');
    let p = land, inDress = false;
    while(p){ if(p.name && p.name.indexOf('dress:') === 0) inDress = true; p = p.parent; }
    if(inDress) throw new Error('the staircase is part of a dressing, not the shell');
    if(!byName('bj:settee')) throw new Error('the deetz dressing is unfurnished');
    /* REVERSED IN PLACE BY RULING CN.  This read both walls out of the WORLD with
       byName, which worked only because all three dressings stood in the scene at
       once — the very thing he has ruled against.  The dressing that is not worn
       is not in the world to be found, so the walls are read out of the dressing
       groups themselves.  What the assertion means is untouched: the three
       dressings are the same room, measured. */
    /* NOT called inDress — this function already has a local of that name eleven
       lines up, and a duplicate const inside the probe template dies at PARSE
       time pointing at the eval.  Sibling of the shadowing trap in TRAPS. */
    const fromDress = (key, nm)=>{ let r = null;
      sc.dress[key].traverse(o=>{ if(!r && o.name === nm) r = o; }); return r; };
    const rw = fromDress('deetz', 'bj:redWall'), bw = fromDress('bj', 'bj:bjWall');
    if(!rw || !bw) throw new Error('a dressing lost its wall');
    const b = box(rw), a = box(bw);
    if(Math.abs((a.max.x - a.min.x) - (b.max.x - b.min.x)) > 0.4)
      throw new Error('the dressings are not the same room');
    return 'both walls '+(b.max.x-b.min.x).toFixed(1)+'m across, '+(b.max.z-b.min.z).toFixed(1)+'m deep';
  });

  P('the bed can be sat on, only while the bedroom is on the stage', ()=>{
    showLoad('beetlejuice');
    const q = (()=>{ let r=null; SHOW.group.traverse(o=>{ if(!r && o.name==='bj:bed') r=o; }); return r; })();
    if(!q) throw new Error('no bed was built');
    if(WALKABLE.indexOf(q) >= 0) throw new Error('you can sit on the bed during the cemetery');
    sceneShow('bedroom');
    if(WALKABLE.indexOf(q) < 0) throw new Error('the bed is not walkable with the bedroom on');
    sceneShow('attic');
    if(WALKABLE.indexOf(q) >= 0) throw new Error('the bed stayed walkable in the attic');
    return 'the bed enters and leaves WALKABLE with its scene';
  });

  P('the attic has a roof over it and a model under it', ()=>{
    showLoad('beetlejuice');
    sceneShow('attic');
    const r = byName('bj:rafters'), m = byName('bj:model');
    if(!r) throw new Error('no rafters');
    if(!m) throw new Error('no model');
    const rb = box(r), mb = box(m);
    if(rb.max.y < 4) throw new Error('the roof is only '+rb.max.y.toFixed(2)+'m up');
    /* on a table means it STARTS at table height and is still model-sized —
       not sitting on the floor, and not a full-size building */
    if(mb.min.y < 0.85) throw new Error('the model starts at '+mb.min.y.toFixed(2)+'m — not on a table');
    if(mb.max.y > 1.8) throw new Error('the model reaches '+mb.max.y.toFixed(2)+'m — too tall to be a model');
    return 'roof to '+rb.max.y.toFixed(1)+'m, model on a table at '+mb.max.y.toFixed(2)+'m';
  });

  console.log('--- the changeover, and the dress that waits (RULING AY) ---');

  P('a dress on a room in view DEFERS, and lands the moment the room goes off', ()=>{
    showLoad('beetlejuice');
    sceneShow('interior');
    const sc = sceneFind('interior');
    const lit = key => { let n = 0; sc.dress[key].traverse(o=>{ if(o.isMesh && o.layers.mask !== 0) n++; }); return n; };
    if(sc.dressOn !== 'maitland') throw new Error('the room starts in '+sc.dressOn);
    showCueExtras({dress:'bj'});           // no scene: the room in view is the target
    if(sc.dressOn === 'bj') throw new Error('the dress POPPED in full view');
    if(!lit('maitland')) throw new Error('the worn dressing went dark on a deferred cue');
    if(!SHOW.pendDress || SHOW.pendDress.key !== 'bj' || SHOW.pendDress.scene !== 'interior')
      throw new Error('nothing was parked for later');
    sceneShow('cemetery');                 // the room goes off — NOW it lands
    if(sc.dressOn !== 'bj') throw new Error('the parked dress never landed');
    if(SHOW.pendDress) throw new Error('the parked dress was left on the hook');
    /* REVERSED IN PLACE BY RULING BQ.  This demanded the room be INERT once it
       went off; it is PARKED now, so its pieces are live by design.  What replaces
       that clause is the thing BQ actually put at risk here — a parked room is
       drawn with every descendant's layers enabled, so without the bjRedress hook
       in sceneApply it would stand in the wings wearing ALL THREE dressings at
       once.  A stronger assertion than the one it replaces. */
    let live = 0; sc.group.traverse(o=>{ if(o.isMesh && o.layers.mask !== 0) live++; });
    if(!live) throw new Error('the parked room went dark — BQ says it stands in the wings');
    if(!lit('bj')) throw new Error('the parked room is not wearing the dress that just landed');
    for(const d of DRESSINGS) if(d !== 'bj' && lit(d))
      throw new Error(d+' is lit on the parked room too — it is wearing more than one');
    sceneShow('interior');
    if(!lit('bj')) throw new Error('it came back not wearing the parked dress');
    return 'deferred in view, landed on going off, parked wearing exactly one of '+
           DRESSINGS.length+', worn on the way back';
  });

  P('a dress on a HIDDEN room lands at once — the wagon is dressed in the wings', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('interior');
    if(sc.on) throw new Error('the room is on at the top of the show');
    /* the plot pattern (cue 20): ONE cue re-dresses the parked wagon AND
       calls it on.  The dress is judged where the set stands as the cue
       FIRES — parked, hidden — so it lands at once and the room slides on
       already wearing it.  Judged after the changeover instead, it would
       defer, and the Deetz house would slide on wearing the Maitlands room. */
    showCueExtras({scene:'interior', dress:'deetz'});
    if(sc.dressOn !== 'deetz') throw new Error('the hidden room was not dressed at once');
    if(SHOW.pendDress) throw new Error('a dress on a hidden room has no business deferring');
    const lit = key => { let n = 0; sc.dress[key].traverse(o=>{ if(o.isMesh && o.layers.mask !== 0) n++; }); return n; };
    if(!lit('deetz')) throw new Error('it came on not wearing the cue dress');
    return 'dressed in the wings, called on already wearing it — nothing parked';
  });

  P('a dress fired MID-EXIT defers — a set on its way out is still in view', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('interior');
    const g = new THREE.Group(); sc.group.add(g);
    sceneTravelPart(sc, 'probe', g, 'x', 0, -8, 2.0);   // a four second exit
    sceneShow('interior');
    sceneChangeTo('cemetery');                  // the room starts on its way out
    for(let i=0;i<60;i++) updateStorm(1/60);    // one second in: marked off, still drawn
    if(sc.on) throw new Error('mid-exit the record says on — the gap is not being tested');
    if(sc.group.userData.sceneOff) throw new Error('already hidden — no gap to test');
    showCueExtras({dress:'deetz', scene:'interior'});   // a hand-fired redress, mid-exit
    if(sc.dressOn === 'deetz') throw new Error('the dress POPPED on a set still in view');
    if(!SHOW.pendDress || SHOW.pendDress.key !== 'deetz')
      throw new Error('nothing was parked for later');
    /* the cue also RECALLED the room — it turns round and stays in its old
       clothes; the parked dress keeps waiting for it to genuinely go off */
    sceneChangeTo('cemetery');
    for(let i=0;i<60;i++) updateStorm(1/60);    // on its way out again, not there yet
    if(sc.dressOn === 'deetz') throw new Error('it landed before the last part arrived');
    for(let i=0;i<600;i++) updateStorm(1/60);   // the last part lands, and so does the dress
    /* REVERSED IN PLACE BY RULING BQ: it parks rather than hides.  What this line
       was really standing in for is that the exit FINISHED, so it says that
       directly now — and the clauses either side, which are the actual subject of
       the test, are untouched. */
    if(sc.group.userData.sceneOff !== false)
      throw new Error('the room vanished instead of parking');
    if(sceneTravelling(sc)) throw new Error('still travelling after ten seconds');
    if(sc.dressOn !== 'deetz') throw new Error('the parked dress never landed');
    if(SHOW.pendDress) throw new Error('the parked dress was left on the hook');
    return 'deferred mid-exit, held through a recall, landed when the exit finished';
  });

  P('a stage swap parks the changeover: part offsets and the waiting dress', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('interior');
    const g = new THREE.Group(); sc.group.add(g);
    sceneTravelPart(sc, 'probe', g, 'x', 0, -8, 2.0);
    sceneShow('interior');
    showCueExtras({dress:'bj'});               // defers — the room is in view
    sceneChangeTo('cemetery');                 // the room leaves: its part heads out
    for(let i=0;i<90;i++) updateStorm(1/60);   // 1.5s of a 4 second travel
    const off = sc.pmv.probe.off;
    if(!(off < -1 && off > -7)) throw new Error('the part is not mid-travel: '+off);
    stageSwitch('arcMain', true);
    if(SHOW.pendDress) throw new Error('the other stage inherited the waiting dress');
    stageSwitch('palace', true);
    const back = sceneFind('interior');
    if(!back.pmv || !back.pmv.probe) throw new Error('the part mover did not park');
    if(Math.abs(back.pmv.probe.off - off) > 1e-6)
      throw new Error('came back at '+back.pmv.probe.off.toFixed(2)+', left at '+off.toFixed(2));
    if(!SHOW.pendDress || SHOW.pendDress.key !== 'bj')
      throw new Error('the waiting dress was lost in the walk');
    for(let i=0;i<600;i++) updateStorm(1/60);  // the changeover finishes where it left off
    /* REVERSED IN PLACE BY RULING BQ, same as its neighbour: parks rather than
       hides, and "finished" is asserted directly instead of through sceneOff. */
    if(back.group.userData.sceneOff !== false)
      throw new Error('the room vanished instead of parking');
    if(sceneTravelling(back)) throw new Error('the changeover never finished after the walk');
    if(back.dressOn !== 'bj') throw new Error('the deferred dress never landed after the swap');
    return 'left mid-travel at '+off.toFixed(2)+', found there, finished, and dressed';
  });

  console.log('--- the choreography data: every set travels (RULING AY) ---');

  /* the sets that legitimately carry NO part movers: the bare stage changes
     instantly on purpose, the wagon and the exterior keep their whole-group
     movers and cue-authored moves, and the sign is an always piece with a
     travel of its own.  EVERYTHING else must choreograph. */
  const CHOREO_EXEMPT = ['bare','interior','house','bjSign'];

  P('every set that plays carries a part mover with a real throw', ()=>{
    showLoad('beetlejuice');
    const missing = [], has = [];
    for(const sc of SHOW.scenes){
      if(CHOREO_EXEMPT.indexOf(sc.name) >= 0) continue;
      const ks = sc.pmv ? Object.keys(sc.pmv) : [];
      const real = ks.filter(k=>Math.abs(sc.pmv[k].out - sc.pmv[k].home) > 1);
      if(!real.length) missing.push(sc.name);
      else has.push(sc.name+':'+real.join('+'));
    }
    if(missing.length)
      throw new Error(missing.join(', ')+' would POP — no part mover with a real throw');
    /* swept over SHOW.scenes, so a scene added later cannot ship popless —
       and the count pins that the sweep is actually sweeping */
    if(has.length < 6) throw new Error('only '+has.length+' choreographed sets');
    return has.join(' ');
  });

  /* ==========================================================================
     RULING CE — AS FEW SETS FLY AS POSSIBLE, and RULING BQ — a struck set parks
     ========================================================================== */

  /* REVERSED IN PLACE BY RULINGS CQ, CR AND CS — the AO/AV/BA/BI/BZ precedent,
     sixth time.  RULING CE's list was his and it lasted a day: "Make the roof
     nethereworld and house exterior flown ... Make the bedroom and the closet
     come in from one side."  Three of the four names in FLY_OK swap out.

     WHAT THIS ASSERTION MEANS DOES NOT CHANGE, which is why it turns rather than
     going: every set is on exactly one list, the lists are stated rather than
     derived, and a set that quietly changes how it arrives fails here.  Turning
     it also keeps the half CE got right — flying is the y case of tracking, so
     the axis is still what the test reads. */
  P('RULINGS CQ/CR/CS: every set arrives the way he asked, and only that way', ()=>{
    showLoad('beetlejuice');
    /* the exterior joins the flown three (CR) and it flies on its own WHOLE-GROUP
       mover, not on a wrapper — a second y mover over the same scene would apply
       on top of the first and put an 8.9m drop through the 25m grid. */
    const FLY_OK = ['roof', 'afterlife', 'house'];
    const flying = [], tracking = [];
    for(const sc of SHOW.scenes){
      const ks = sc.pmv ? Object.keys(sc.pmv) : [];
      const ax = ks.map(k=>sc.pmv[k].axis);
      if(sc.mv && sc.parkMv !== undefined) ax.push(sc.mv.axis);
      if(!ax.length) continue;
      if(ax.indexOf('y') >= 0) flying.push(sc.name);
      else tracking.push(sc.name + ':' + ax.join(''));
    }
    for(const n of flying) if(FLY_OK.indexOf(n) < 0)
      throw new Error(n + ' flies, and he asked for it from a side or the back');
    for(const n of FLY_OK) if(flying.indexOf(n) < 0)
      throw new Error(n + ' stopped flying, and he asked for that one to fly');
    /* and the four that travel on the deck do it on the axis he named.  The
       bedroom and the closet come in from a SIDE (x) — the closet's second mover
       is the z it stands at in that wing, and that is a park, not an entrance. */
    const SIDE = ['attic', 'bedroom', 'closet'];
    for(const n of SIDE){
      const sc = sceneFind(n), m = sc.pmv && sc.pmv.all;
      if(!m) throw new Error(n + ' carries no whole-set mover at all');
      if(m.axis !== 'x')
        throw new Error(n + ' comes in on ' + m.axis + ', and he asked for a side');
    }
    /* RULING CP — and the house is the ONE set that travels through the backdrop
       line.  This is the whole of "they are the only one that can come in from
       behind the backdrop", stated over the scenes rather than over the engine. */
    const inr = sceneFind('interior');
    if(!inr.mv || inr.mv.axis !== 'z')
      throw new Error('the house no longer comes in from upstage');
    for(const sc of SHOW.scenes){
      if(sc.name === 'interior' || sc.always) continue;
      const ax = [];
      if(sc.mv) ax.push(sc.mv.axis);
      if(sc.pmv) for(const k in sc.pmv) if(k === 'all') ax.push(sc.pmv[k].axis);
      if(ax.indexOf('z') >= 0)
        /* NO ESCAPED QUOTE IN HERE.  The probe is a template literal, so a
           singly-escaped quote is consumed by IT and the eval sees a bare
           apostrophe closing a single-quoted string.  Same family as the
           backtick trap in TRAPS, and tests/probe-lint.js sweeps for both. */
        throw new Error(sc.name + ' arrives on z, and upstage is the door of the house alone');
    }
    return 'flown: ' + flying.join(', ') + '  |  tracked: ' + tracking.join(' ');
  });

  /* REVERSED IN PLACE BY RULING CR.  This pinned RULING CE's routing — the
     exterior into the stage-right wing, off his line about the fly rail — and CE's
     own comment left the 1:14:30 cue FLAGGED as the thing to change if he ever
     meant to supersede it.  He has: "Make the roof nethereworld and house exterior
     flown."

     THE THING THIS ASSERTION IS FOR SURVIVES WHOLE and is why it turns rather than
     goes: a struck exterior must end up OUT OF THE PICTURE, and it was this test
     that caught the 12.6m stand-in drop parking at x -4.70 in the middle of the
     opening while his 8.6m house cleared fine.  The stand-in is still the bigger
     case; only the direction it clears in has changed, from sideways to up. */
  P('RULING CR: the exterior FLIES, on the mover it already had, and clears the picture', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('house');
    if(!sc.mv) throw new Error('the exterior carries no whole-group mover');
    if(sc.mv.axis !== 'y') throw new Error('the exterior travels on ' + sc.mv.axis + ', not up');
    /* it parks ON that mover rather than growing a wrapper: two y movers over one
       scene both apply, and 21m of travel puts an 8.9m drop through the 25m grid */
    if(sc.pmv && sc.pmv.all)
      throw new Error('the exterior grew a second whole-set mover — the two would compound');
    if(sc.parkMv === undefined) throw new Error('the exterior declares no park on its own mover');
    sceneShow('house');
    sceneChangeTo('bare');
    for(let i = 0; i < 900 && sceneTravelling(sc); i++) updateStorm(1/60);
    const b = box(sc.group);
    if(b.min.y < BJ.opH)
      throw new Error('parked with its foot at y ' + b.min.y.toFixed(2) +
                      ', inside the ' + BJ.opH + 'm picture');
    if(b.max.y > D.gridY)
      throw new Error('parked ' + (b.max.y - D.gridY).toFixed(2) + 'm through the grid');
    /* AND THE WING IT USED TO STAND IN IS EMPTY, which is what pays for RULING CS:
       the bedroom and the closet take stage right now, and two sets cannot have it */
    if(b.min.x < -BJ.opW/2 - 0.01)
      throw new Error('it is still standing out in the stage-right wing at x ' + b.min.x.toFixed(2));
    return 'flown, parked y ' + b.min.y.toFixed(2) + '..' + b.max.y.toFixed(2) +
           ' over a ' + BJ.opH + 'm picture, under a ' + D.gridY + 'm grid, wing clear';
  });

  P('RULING CU: the marquee goes dark as it flies, and keeps what the cue said', ()=>{
    showLoad('beetlejuice');
    const sg = sceneFind('bjSign');
    if(!sg || !sg.mv) throw new Error('the sign does not travel, so it can never go up');
    if(!SHOW.signLamps || !SHOW.signLamps.length) throw new Error('the sign has no lamps');
    const lamp = SHOW.signLamps[0];
    const lit = ()=>lamp.mat.emissive ? lamp.mat.emissiveIntensity
                                      : (lamp.mat.color.r + lamp.mat.color.g + lamp.mat.color.b)/3;
    /* home, and the sign is lit — this is the pre-show, "the sign lit" */
    updateStorm(1/60);
    const home = lit();
    if(!(home > 0.1)) throw new Error('the sign is dark before it has gone anywhere: ' + home.toFixed(3));
    /* a cue turns it red.  The gate must not lose that. */
    setSignLamps('#ff1e10');
    const redHome = lit();
    if(!(redHome > 0.1)) throw new Error('the red cue left it dark on the deck');
    /* UP IT GOES.  The lamps start going out as it rises, and are out well
       before it has finished travelling — a marquee switched off, not dimmed. */
    sceneMoveTo('bjSign', BJ_SIGN_OUT);
    let frames = 0, midLit = null;
    while(sceneTravelling(sg) && frames < 900){
      updateStorm(1/60); frames++;
      if(frames === 6) midLit = lit();       // a tenth of a second into the rise
    }
    if(frames >= 900) throw new Error('the sign never arrived');
    if(!(lit() < 0.02))
      throw new Error('it is up at ' + sg.mv.off.toFixed(2) + 'm and still lit at ' + lit().toFixed(3));
    /* IT IS A FADE, NOT A SNAP, and that is what the intermediate frame is for:
       strictly between full and out a tenth of a second in.  A snap would read
       as a lamp failing rather than a marquee being switched off. */
    if(midLit === null || !(midLit > 0.02 && midLit < redHome - 0.02))
      throw new Error('the lamps snapped rather than faded: ' +
                      (midLit === null ? 'never sampled' : midLit.toFixed(3)));
    /* AND THE CUE STATE SURVIVED UNDERNEATH.  Bring it back in and it is still
       the colour the cue asked for — the gate multiplies, it does not repaint. */
    if(SHOW.signWant !== '#ff1e10')
      throw new Error('the cue colour was forgotten while the sign was up');
    sceneMoveTo('bjSign', 0);
    for(let i = 0; i < 900 && sceneTravelling(sg); i++) updateStorm(1/60);
    for(let i = 0; i < 60; i++) updateStorm(1/60);
    if(!(lit() > 0.1)) throw new Error('it came home dark at ' + lit().toFixed(3));
    if(lamp.mat.emissive && Math.abs(lamp.mat.emissive.getHex() - 0xff1e10) > 0)
      throw new Error('it came home the wrong colour: #' + lamp.mat.emissive.getHexString());
    setSignLamps(null);
    for(let i = 0; i < 60; i++) updateStorm(1/60);
    return 'home ' + home.toFixed(2) + ' -> red ' + redHome.toFixed(2) +
           ' -> rising ' + midLit.toFixed(2) + ' -> up 0.00 -> home again still red';
  });

  P('RULING CU: a sign with no mover is left alone, not switched off', ()=>{
    showLoad('beetlejuice');
    const sg = sceneFind('bjSign');
    if(!SHOW.signLamps || !SHOW.signLamps.length) throw new Error('the sign has no lamps');
    const lamp = SHOW.signLamps[0];
    const lit = ()=>lamp.mat.emissive ? lamp.mat.emissiveIntensity
                                      : (lamp.mat.color.r + lamp.mat.color.g + lamp.mat.color.b)/3;
    /* DECLARED, NEVER ASSUMED, the habit of this whole file: a production whose
       sign cannot fly — or a sign built before its travel is wired — must keep
       its lamps rather than have them switched off for ever by a missing field. */
    const keep = sg.mv;
    sg.mv = null;
    for(let i = 0; i < 120; i++) updateStorm(1/60);
    const out = lit();
    sg.mv = keep;
    if(!(out > 0.1)) throw new Error('a sign that cannot fly was switched off anyway: ' + out.toFixed(3));
    return 'no mover, still lit at ' + out.toFixed(2) + ' after two seconds';
  });

  P('RULING CN: only one house is in the world, and it switches when called', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('interior');
    const groups = DRESSINGS.map(d=>sc.dress[d]);
    const inWorld = ()=>groups.filter(g=>g.parent === sc.group);
    const held = ()=>groups.filter(g=>SHOW.offstage.indexOf(g) >= 0);
    /* "Make it so only one house exist in the world at a time and it switches
        between them when needed."  RULING AQ said this and the code darkened the
        other two instead of removing them — which was fair while a dressing was
        our own furniture, and became three complete 93k houses of his standing in
        the same 13.6m of stage when RULING BP landed. */
    if(inWorld().length !== 1)
      throw new Error(inWorld().length + ' houses are in the world at once');
    if(held().length !== DRESSINGS.length - 1)
      throw new Error(held().length + ' held offstage, expected ' + (DRESSINGS.length - 1));
    /* AND IT SWITCHES.  Each in turn: the one worn is the one in the world, the
       other two are held, and nothing is lost on the way round. */
    const counts = {};
    for(const d of DRESSINGS){
      let n = 0; sc.dress[d].traverse(o=>{ if(o.isMesh) n++; });
      counts[d] = n;
      if(!n) throw new Error(d + ' has no meshes to begin with');
    }
    for(const d of DRESSINGS){
      bjDress('interior', d);
      const on = inWorld();
      if(on.length !== 1) throw new Error(on.length + ' houses in the world with ' + d + ' called');
      if(on[0] !== sc.dress[d]) throw new Error('the house in the world is not ' + d);
      for(const o of DRESSINGS){
        let n = 0; sc.dress[o].traverse(x=>{ if(x.isMesh) n++; });
        if(n !== counts[o]) throw new Error(o + ' lost meshes being held offstage');
      }
    }
    /* a SET CHANGE must not put all three back, the way it once lit all three */
    bjDress('interior', 'bj');
    sceneShow('cemetery');
    sceneShow('interior');
    if(inWorld().length !== 1)
      throw new Error(inWorld().length + ' houses came back on with the room');
    /* and a held house is not merely invisible — it is not there to be hit */
    let reach = 0;
    SHOW.group.traverse(o=>{ if(o.isMesh && groups.some(g=>{
      for(let k = o; k; k = k.parent) if(k === g) return true; return false; })) reach++; });
    let mine = 0; sc.dress[sc.dressOn].traverse(o=>{ if(o.isMesh) mine++; });
    if(reach !== mine)
      throw new Error(reach + ' dressing meshes are reachable from the show, and the worn one has ' + mine);
    return 'one of ' + DRESSINGS.length + ' in the world (' + sc.dressOn + '), ' +
           held().length + ' held offstage, ' + mine + ' meshes reachable';
  });

  P('RULING CN: a held house is frozen with the rest, and disposed with it', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('interior');
    const held = sc.dress[DRESSINGS.find(d=>d !== sc.dressOn)];
    if(!held) throw new Error('every dressing is being worn at once');
    if(SHOW.offstage.indexOf(held) < 0) throw new Error('nothing is being held offstage');
    /* THE FREEZE.  lockShowStatic sweeps SHOW.group, which a held set is not
       under — so without the offstage list it comes back with live matrices
       while everything around it is frozen. */
    let live = 0, n = 0;
    held.traverse(o=>{ if(o === held) return; n++; if(o.matrixAutoUpdate) live++; });
    if(!n) throw new Error('the held dressing is empty, so this proves nothing');
    if(live) throw new Error(live + ' of ' + n + ' held objects were never frozen');
    /* THE DISPOSE.  showStrike disposes SHOW.group's tree; a held set is not in
       it, so two of his houses would leak per show change. */
    const geos = [];
    held.traverse(o=>{ if(o.isMesh && o.geometry) geos.push(o.geometry); });
    if(!geos.length) throw new Error('the held dressing has no geometry, so this proves nothing');
    let disposed = 0;
    for(const g of geos){ const f = g.dispose; g.dispose = function(){ disposed++; return f.apply(this, arguments); }; }
    showStrike();
    if(!disposed)
      throw new Error('a held house survived the strike undisposed — that leaks a house per show');
    return n + ' held objects frozen, ' + disposed + ' of ' + geos.length + ' geometries disposed on strike';
  });

  P('RULING CT: a flown set is thin, and its downstage face does not move', ()=>{
    showLoad('beetlejuice');
    const rof = sceneFind('roof');
    sceneShow('roof');
    const b = box(rof.group);
    const depth = b.max.z - b.min.z;
    /* A BATTEN IS THE POINT.  "make the house exterior and roof set really thin
       to fit up in the fly area" — the stand-in roof was 5.00m front to back and
       his model 10.00m, and neither of those hangs on a line.  The bound is
       stated rather than derived: a flown piece that is more than a couple of
       metres deep is not a flown piece. */
    if(depth > 2.0)
      throw new Error('the roof is ' + depth.toFixed(2) + 'm deep — that does not hang on a batten');
    /* AND THE PICTURE STARTS WHERE IT STARTED, which is the whole reason the
       squash is about the downstage face.  The gutter is the downstage-most
       thing the roof is built with: authored at z -3.9 on a 0.30 box, so its
       face is -3.75, and BJ_THIN must leave it exactly there. */
    if(Math.abs(b.max.z - (-3.75)) > 0.02)
      throw new Error('the downstage face moved to z ' + b.max.z.toFixed(2) + ', not -3.75');
    /* the deck you stand on came with it — a thin roof with a full-depth deck
       inside it is not thin, it is a thin roof standing in a thick one */
    const deck = rof.walk[0];
    if(!deck) throw new Error('the roof files nothing walkable, so half of this proves nothing');
    const db = box(deck);
    if(db.max.z - db.min.z > 2.0)
      throw new Error('the deck is still ' + (db.max.z - db.min.z).toFixed(2) + 'm deep');
    /* and the netherworld is NOT thinned — he named two sets and RULING BV
       already cut this one to 6.90m on his own correction */
    sceneShow('afterlife');
    const ab = box(sceneFind('afterlife').group);
    if(ab.max.z - ab.min.z < 4)
      throw new Error('the netherworld was thinned too, and he did not ask for that');
    return 'the roof ' + depth.toFixed(2) + 'm deep, face still at z ' + b.max.z.toFixed(2) +
           ', deck ' + (db.max.z - db.min.z).toFixed(2) + 'm; the netherworld left at ' +
           (ab.max.z - ab.min.z).toFixed(2) + 'm';
  });

  P('RULING CT: only the two he named are thinned, and the manifest says so', ()=>{
    /* the model half of the same ruling.  It is stated on the ENTRY, so a set
       that quietly grows a squash — or loses one — fails here rather than in a
       headset. */
    const want = ['roof', 'houseExterior'];
    const has = Object.keys(BJ_MODELS).filter(k=>{
      const e = BJ_MODELS[k];
      return e && typeof e === 'object' && e.thin !== undefined;
    });
    for(const k of want) if(has.indexOf(k) < 0)
      throw new Error(k + ' is not thinned, and he named it');
    for(const k of has) if(want.indexOf(k) < 0)
      throw new Error(k + ' is thinned, and he did not name it');
    for(const k of has) if(!(BJ_MODELS[k].thin > 0 && BJ_MODELS[k].thin < 1))
      throw new Error(k + ' thins by ' + BJ_MODELS[k].thin + ', which squashes nothing');
    return has.join(', ') + ' at ' + BJ_THIN;
  });

  P('RULING CO: the house is stored BEHIND THE BACKDROP, and nothing else is', ()=>{
    showLoad('beetlejuice');
    /* "make it so no matter what they are always stored behind the backdrop and
        never anywher else" — and RULING BQ parked it in the stage-left wing
        because, at the brick of the day, 12.98m of his room did not fit between
        the cloth and the wall.  RULING CL took PAL_BACK to -25.5 for an unrelated
        reason and the gap went 10.60m -> 14.60m. */
    const BACKDROP_Z = -10.90;             // line 14: z = -0.50 - 13*0.80
    const inr = sceneFind('interior');
    if(!inr.parks) throw new Error('the house declares no park at all');
    if(inr.pmv && inr.pmv.park)
      throw new Error('the house parks on a second mover — CO parks it on its own z');
    sceneShow('interior');
    sceneMoveTo('interior', 0);            // called on, the way every cue calls it
    for(let i = 0; i < 900 && sceneTravelling(inr); i++) updateStorm(1/60);
    const on = box(inr.group);
    if(on.max.z < BACKDROP_Z)
      throw new Error('it never came downstage of the cloth: z ' + on.max.z.toFixed(2));
    sceneChangeTo('bare');
    for(let i = 0; i < 1200 && sceneTravelling(inr); i++) updateStorm(1/60);
    const b = box(inr.group);
    if(b.max.z > BACKDROP_Z)
      throw new Error('stored with its face at z ' + b.max.z.toFixed(2) +
                      ', downstage of the backdrop at ' + BACKDROP_Z);
    if(b.min.z < PAL_BACK)
      throw new Error('stored ' + (PAL_BACK - b.min.z).toFixed(2) + 'm through the brick');
    /* "and never anywher else" is the other half, and it is the half that has a
       number in it: BQ's wing park moved the room 14m sideways, so a room that
       still slid sideways would satisfy every line above and break the ruling. */
    if(Math.abs(b.min.x - on.min.x) > 0.05 || Math.abs(b.max.x - on.max.x) > 0.05)
      throw new Error('it moved sideways to store: x ' + on.min.x.toFixed(2) + '..' +
                      on.max.x.toFixed(2) + ' -> ' + b.min.x.toFixed(2) + '..' + b.max.x.toFixed(2));
    return 'acting z ' + on.min.z.toFixed(2) + '..' + on.max.z.toFixed(2) +
           ' -> stored ' + b.min.z.toFixed(2) + '..' + b.max.z.toFixed(2) +
           ', ' + (BACKDROP_Z - b.max.z).toFixed(2) + 'm behind the cloth and ' +
           (b.min.z - PAL_BACK).toFixed(2) + 'm off the brick, and it never left its own x';
  });

  P('RULING BQ: a parked set is drawn, unpickable, and cannot be stood on', ()=>{
    showLoad('beetlejuice');
    /* the roof, because it is the one with a deck you climb — the whole reason a
       parked set must stay off WALKABLE is that a set flying in with a player on
       it is a bug with no good ending */
    const sc = sceneFind('roof');
    if(!sc.parks) throw new Error('the roof declares no park');
    if(!sc.walk.length) throw new Error('the roof files nothing walkable, so half of this proves nothing');
    sceneShow('roof');
    const deck = sc.walk[0];
    if(WALKABLE.indexOf(deck) < 0) throw new Error('the deck is not walkable with the roof on');
    sceneChangeTo('bare');
    for(let i = 0; i < 900 && sceneTravelling(sc); i++) updateStorm(1/60);
    let live = 0, pickable = 0;
    sc.group.traverse(o=>{
      if(!o.isMesh) return;
      if(o.layers.mask !== 0) live++;
      if(o.raycast === THREE.Mesh.prototype.raycast) pickable++;
    });
    if(!live) throw new Error('the parked roof went dark — it is meant to be standing backstage');
    if(pickable) throw new Error(pickable + ' parked meshes are still in front of the crosshair');
    if(WALKABLE.indexOf(deck) >= 0) throw new Error('you can still stand on the parked roof');
    /* and it all comes back when it is called */
    sceneChangeTo('roof');
    for(let i = 0; i < 900 && sceneTravelling(sc); i++) updateStorm(1/60);
    if(WALKABLE.indexOf(deck) < 0) throw new Error('the deck never came back into WALKABLE');
    let stillOff = 0;
    sc.group.traverse(o=>{ if(o.isMesh && o.raycast !== THREE.Mesh.prototype.raycast) stillOff++; });
    if(stillOff) throw new Error(stillOff + ' meshes are still unpickable with the set back on');
    return live + ' meshes parked and drawn, none pickable, deck off WALKABLE and back';
  });

  P('RULING BQ: every park is clear of the brick, the grid and both walls', ()=>{
    showLoad('beetlejuice');
    const bad = [], boxes = {};
    for(const sc of SHOW.scenes){
      if(sc.always || !sc.parks) continue;
      sceneShow(sc.name);
      sceneChangeTo('bare');
      for(let i = 0; i < 1200 && sceneTravelling(sc); i++) updateStorm(1/60);
      const b = box(sc.group);
      boxes[sc.name] = b;
      if(b.min.z < PAL_BACK) bad.push(sc.name + ' is ' + (PAL_BACK - b.min.z).toFixed(2) + 'm through the brick');
      if(b.max.y > D.gridY) bad.push(sc.name + ' is ' + (b.max.y - D.gridY).toFixed(2) + 'm through the grid');
      if(b.min.x < -D.stageW/2) bad.push(sc.name + ' is past the stage-right wall');
      if(b.max.x > D.stageW/2) bad.push(sc.name + ' is past the stage-left wall');
    }
    if(bad.length) throw new Error(bad.join('; '));
    if(Object.keys(boxes).length < 7)
      throw new Error('only ' + Object.keys(boxes).length + ' parks measured — the sweep is not sweeping');
    /* the sets that stand ON THE DECK each get their own floor space.  The flown
       ones share the grid and always will: flying preserves x and z, so every
       flown set wants the same volume.  Measured, documented, and deliberately
       not asserted away.

       REVERSED IN PLACE BY THE TRAFFIC PLAN: the list was interior/attic/house
       and it is now the four that RULINGS CO, CQ and CS put on the floor — the
       exterior flies (CR) and joins the ones that share the tower, and the
       bedroom and the closet come down out of it.  Which makes this the assertion
       that has to catch RULING CS's whole problem: 8.62 and 9.02 metres of room
       in one 14.5m wing only fit because the closet stands BEHIND the bedroom. */
    /* RULING CT SHRANK THE OVERLAP AND DID NOT REMOVE IT, and that was tried
       before it was written down (the argument is in p5h, at the flown sets).
       Our exterior is a cloth hanging at z -7.35 and HIS seats at the arch: a
       park is an offset, so no single number lines both up, and every set of
       offsets that separated his three left the stand-ins inside each other.
       So the flown sets go on sharing the tower — with the deepest set-inside-set
       down from 8.77m to 2.46m, which is what the thinning actually bought. */
    const TRACKED = ['interior', 'attic', 'bedroom', 'closet'];
    for(let i = 0; i < TRACKED.length; i++) for(let j = i+1; j < TRACKED.length; j++){
      const a = boxes[TRACKED[i]], b = boxes[TRACKED[j]];
      if(!a || !b) throw new Error('a parked set has no measured park');
      if(!a.intersectsBox(b)) continue;
      const o = a.clone().intersect(b), d = o.getSize(new THREE.Vector3());
      if(Math.min(d.x, d.y, d.z) > 0.05)
        throw new Error(TRACKED[i] + ' and ' + TRACKED[j] + ' park inside each other by ' +
                        d.x.toFixed(2) + ' x ' + d.y.toFixed(2) + ' x ' + d.z.toFixed(2) + 'm');
    }
    return Object.keys(boxes).length + ' parks all clear, and not one of them stands inside another';
  });

  /* the plot's own spine, driven through the REAL cue path — fireCue and
     showCueExtras, time stepped through updateStorm — with the no-pop
     invariant read off WORLD matrices at every few frames (the frozen-group
     trap: position.x reads back your own write) */
  P('the spine of the plot never pops: every entrance starts at OUT', ()=>{
    showLoad('beetlejuice');
    const AX = {x:12, y:13, z:14};
    const raw = m => m.group.matrixWorld.elements[AX[m.axis]];
    scene.updateMatrixWorld(true);
    const base = {};
    for(const sc of SHOW.scenes){ if(!sc.pmv) continue; base[sc.name] = {};
      for(const k in sc.pmv) base[sc.name][k] = raw(sc.pmv[k]); }
    const wOff = (sc, k) => sc.pmv[k].home + raw(sc.pmv[k]) - base[sc.name][k];
    const check = when => {
      scene.updateMatrixWorld(true);
      for(const sc of SHOW.scenes){
        if(!sc.pmv || CHOREO_EXEMPT.indexOf(sc.name) >= 0) continue;
        for(const k in sc.pmv){
          const m = sc.pmv[k], wo = wOff(sc, k);
          const lo = Math.min(m.home, m.out) - 0.02, hi = Math.max(m.home, m.out) + 0.02;
          if(wo < lo || wo > hi)
            throw new Error(sc.name+'.'+k+' is off its track at '+wo.toFixed(2)+' ('+when+')');
          /* a HIDDEN set may be silently parked toward OUT by a changeover —
             layers off, nobody sees it — so darkness is not asserted against
             travel.  What darkness must never show is a lit piece: */
          if(sc.group.userData.sceneOff && sc.group.visible)
            throw new Error(sc.name+' draws while marked off ('+when+')');
        }
      }
    };
    const fire = i => {
      const c = CUES[i];
      const sc = c.scene ? sceneFind(c.scene) : null;
      const wasDrawn = sc ? !sc.group.userData.sceneOff : true;
      fireCue(i);
      /* the ruling itself: no piece reaches the stage except by travelling.
         A hidden set a cue brings on shows its FIRST frame at OUT — never,
         ever at home. */
      if(sc && sc.pmv && !wasDrawn && CHOREO_EXEMPT.indexOf(sc.name) < 0){
        scene.updateMatrixWorld(true);
        for(const k in sc.pmv){
          const m = sc.pmv[k], wo = wOff(sc, k);
          if(Math.abs(wo - m.home) < 0.05)
            throw new Error(c.label+' brought '+sc.name+' on with '+k+' already HOME — a pop');
          if(Math.abs(wo - m.out) > 0.05)
            throw new Error(sc.name+'.'+k+' came on at '+wo.toFixed(2)+', not at OUT '+m.out);
        }
      }
      check('cue '+c.n+' fired');
    };
    const step = n => { for(let f = 0; f < n; f++){ updateStorm(1/60); if(f % 10 === 0) check('travelling'); } };
    const at = re => { const i = CUES.findIndex(c=>re.test(c.label)); if(i < 0) throw new Error('no cue matches '+re); return i; };
    fire(at(/9:45/));      step(480);    // the graveyard empties to the wings
    fire(at(/10:38/));     step(480);    // the wagon on; the emptied set hides
    fire(at(/32:50/));     step(480);    // the attic flies in
    fire(at(/42:34/));     step(480);    // attic out, closet in, both moving
    fire(at(/48:49/));     step(480);    // and back to the attic
    fire(at(/52:00/));     step(480);    // the bedroom
    fire(at(/56:00/));     step(480);    // the roof
    fire(at(/1:02:51/));   step(480);    // roof out, the Deetz wagon on
    fire(at(/1:25:25/));   step(480);    // the attic again, act two
    fire(at(/1:39:19/));   step(480);    // the netherworld flies in (his new time)
    fire(at(/1:53:15/));   step(480);    // and out, the house back on (CK: 15s later)
    return 'eleven changeovers stepped: every entrance from OUT, every part on its track';
  });

  P('9:45 — the hills RUN TO THE WINGS and the cloth stays on its line', ()=>{
    showLoad('beetlejuice');
    const i = CUES.findIndex(c=>/9:45/.test(c.label));
    if(i < 0) throw new Error('the 9:45 cue is gone');
    const c = CUES[i];
    /* the beat is PART MOVES on the cue — a dress on a drawn set defers
       (RULING AY), so a dress-only cue here would be an invisible no-op */
    const mv = Array.isArray(c.move) ? c.move : (c.move ? [c.move] : []);
    const parts = mv.filter(m=>m && m.scene === 'cemetery' && m.part);
    if(parts.length < 2)
      throw new Error('the cue does not move the hills by name — the beat would not play');
    if(!parts.some(m=>m.off < -5) || !parts.some(m=>m.off > 5))
      throw new Error('the hills do not split to BOTH wings');
    if(c.scene !== 'cemetery') throw new Error('the beat became a scene change to '+c.scene);
    const sc = sceneFind('cemetery');
    const wx = o => { scene.updateMatrixWorld(true); return o.matrixWorld.elements[12]; };
    const gR = sc.pmv.hillR.group, gL = sc.pmv.hillL.group;
    const r0 = wx(gR), l0 = wx(gL);
    const bd = FLY[13], trim0 = bd.target;
    fireCue(i);
    if(sc.group.userData.sceneOff) throw new Error('the set went off — only the scenery leaves');
    for(let k = 0; k < 120; k++) updateStorm(1/60);         // two seconds in
    const rMid = wx(gR), lMid = wx(gL);
    if(!(rMid < r0 - 1)) throw new Error('the right hill has not RUN: '+rMid.toFixed(2));
    if(!(lMid > l0 + 1)) throw new Error('the left hill has not RUN: '+lMid.toFixed(2));
    for(let k = 0; k < 300; k++) updateStorm(1/60);         // and the rest
    if(Math.abs(wx(gR) - (r0 - BJ_HILL_OUT)) > 0.05 || Math.abs(wx(gL) - (l0 + BJ_HILL_OUT)) > 0.05)
      throw new Error('the hills never reached the wings');
    /* THE CLEARANCE, read off world boxes, never mover offsets: parked, no
       cemetery mesh may reach into the opening (+-6.8) below the y=5
       sightline.  The mover arriving at OUT proves nothing about geometry —
       a ground row built wider than its own run still lies across the
       picture with its mover happily at -9.5, which is exactly what the
       first full-width hills did.  This is the assertion that catches it,
       and it will catch an over-wide owner model too (RULING AZ). */
    scene.updateMatrixWorld(true);
    const EDGE = BJ.opW/2;                                  // 6.8
    let nearest = 999;
    sc.group.traverse(o=>{
      if(!o.isMesh) return;
      const b = new THREE.Box3().setFromObject(o);
      if(b.min.y > 5) return;                               // above the sightline
      if(b.max.x > -EDGE && b.min.x < EDGE)
        throw new Error((o.name || 'a piece')+' parks INSIDE the opening: x '+
                        b.min.x.toFixed(2)+' to '+b.max.x.toFixed(2)+' against +-'+EDGE);
      const e = b.min.x > 0 ? b.min.x : -b.max.x;
      if(e < nearest) nearest = e;
    });
    /* the painted cloth is a GOOD on line 14; the beat leaves its trim alone */
    if(Math.abs(bd.target - trim0) > 0.01) throw new Error('the beat moved the backdrop line');
    if(Math.abs(bd.target - TRIMS.bjBackdrop) > 0.01) throw new Error('the backdrop is not in for the beat');
    if(!sc.on || sc.group.userData.sceneOff) throw new Error('the emptied stage went dark');
    return 'hills out to +-'+BJ_HILL_OUT+' in view, nearest parked edge at x '+
           nearest.toFixed(2)+' against +-'+EDGE+', cloth still at '+bd.target.toFixed(1);
  });

  /* a JUMP lands the cue's OWN picture, not a half-cue: fired from another
     scene, 9:45 must end with the graveyard on and EMPTIED — the split rule
     in showCueExtras exists for this.  Moves applied before the changeover
     get overwritten by the incoming branch's snap-to-OUT-then-home, which
     sent the hills back to centre: a full graveyard on the emptying cue. */
  P('a JUMP to 9:45 from another scene still lands an EMPTIED graveyard', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('cemetery');
    const wx = o => { scene.updateMatrixWorld(true); return o.matrixWorld.elements[12]; };
    const gR = sc.pmv.hillR.group, gL = sc.pmv.hillL.group;
    const r0 = wx(gR), l0 = wx(gL);                    // home, read at load
    const i945  = CUES.findIndex(c=>/9:45/.test(c.label));
    const i1040 = CUES.findIndex(c=>/10:38/.test(c.label));
    fireCue(i1040);                                    // the wagon cue first
    for(let k = 0; k < 600; k++) updateStorm(1/60);
    if(SHOW.scene !== 'interior') throw new Error('the wagon cue did not land');
    fireCue(i945);                                     // the operator JUMPS back
    for(let k = 0; k < 600; k++) updateStorm(1/60);
    if(!sc.on || sc.group.userData.sceneOff)
      throw new Error('the jump did not bring the graveyard on');
    if(Math.abs(wx(gR) - (r0 - BJ_HILL_OUT)) > 0.05)
      throw new Error('the right hill ended at '+(wx(gR) - r0).toFixed(2)+
                      ', not parked at -'+BJ_HILL_OUT);
    if(Math.abs(wx(gL) - (l0 + BJ_HILL_OUT)) > 0.05)
      throw new Error('the left hill ended at '+(wx(gL) - l0).toFixed(2)+
                      ', not parked at +'+BJ_HILL_OUT);
    /* and the cue's own fly snapshot holds: the cloth is in at its trim */
    if(Math.abs(FLY[13].target - TRIMS.bjBackdrop) > 0.01)
      throw new Error('the backdrop is not at its trim after the jump');
    return 'jumped from the wagon: graveyard on, hills parked at +-'+BJ_HILL_OUT+
           ', cloth at trim';
  });

  /* ══ RULING CI — A MOVE WAITS FOR THE LINE IT NEEDS ═════════════════════ */
  P('the house cannot start sliding until the backdrop is out (CI)', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('interior'), cloth = FLY[13];
    /* WORLD MATRIX, never position: the set is frozen and writing position on a
       frozen group updates the record while the room stands still (TRAPS) */
    const wz = () => { scene.updateMatrixWorld(true); return sc.group.matrixWorld.elements[14]; };
    const i = CUES.findIndex(c=>/10:38/.test(c.label));
    if(i < 0) throw new Error('no cue at 10:38 to fire');
    const m = (Array.isArray(CUES[i].move) ? CUES[i].move : [CUES[i].move])
                .filter(x=>x && x.scene === 'interior')[0];
    if(!m) throw new Error('the cue does not move the wagon at all');
    if(m.after === undefined) throw new Error('the wagon move names no line to wait for');

    /* the cloth starts IN, so the gate is really shut when the cue fires */
    if(!(cloth.pos < OUT_TRIM - 1))
      throw new Error('the backdrop is already out before the cue; nothing to wait for');
    fireCue(i); cancelFollow();
    const z0 = wz();

    /* STEP THE FLY AS WELL AS THE MOVERS.  updateStorm alone never moves a pipe,
       so a version of this that stepped only the movers would watch a gate that
       could never open and call it a pass. */
    let held = 0, clothOut = -1, moved = -1;
    for(let f = 0; f < 3000; f++){
      updateFly(1/60); updateStorm(1/60);
      const out = Math.abs(cloth.target - cloth.pos) < 0.02;
      if(out && clothOut < 0) clothOut = f;
      if(!out){
        if(Math.abs(wz() - z0) > 0.02)
          throw new Error('the wagon set off at frame ' + f + ' with the cloth still ' +
                          Math.abs(cloth.target - cloth.pos).toFixed(2) + 'm from its trim');
        held++;
      }
      if(moved < 0 && Math.abs(wz() - z0) > 0.05) moved = f;
      if(clothOut >= 0 && Math.abs(sc.mv.off) < 1e-4) break;
    }
    if(clothOut < 0) throw new Error('the backdrop never got out — this proves nothing');
    if(!held) throw new Error('the cloth was already out on the first frame; the gate never bound');
    if(moved < 0) throw new Error('the wagon never moved at all, even once the cloth was clear');
    if(moved < clothOut)
      throw new Error('the wagon moved at frame ' + moved + ', before the cloth arrived at ' + clothOut);
    if(Math.abs(sc.mv.off) > 1e-3)
      throw new Error('it never finished its travel: mover at ' + sc.mv.off.toFixed(2));
    return 'held ' + held + ' frames while the cloth flew, set off at frame ' + moved +
           ' (cloth clear at ' + clothOut + '), home at 0.00';
  });

  P('a move with no line to wait for still goes at once (CI stays declared)', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('interior');
    const wz = () => { scene.updateMatrixWorld(true); return sc.group.matrixWorld.elements[14]; };
    /* 1:02:51 slides the Deetz house on and names no line — the eight other moves
       in this plot must behave exactly as they always have */
    const i = CUES.findIndex(c=>/1:02:51/.test(c.label));
    if(i < 0) throw new Error('no 1:02:51 cue');
    const m = (Array.isArray(CUES[i].move) ? CUES[i].move : [CUES[i].move])
                .filter(x=>x && x.scene === 'interior')[0];
    if(m.after !== undefined) throw new Error('this cue gates its move; pick an ungated one');
    fireCue(i); cancelFollow();
    const z0 = wz();
    for(let f = 0; f < 30; f++) updateStorm(1/60);
    if(Math.abs(wz() - z0) < 0.01)
      throw new Error('an ungated move did not start on its own cue');
    return 'ungated moves are untouched: away inside half a second';
  });

  P('the graveyard never returns in the plot, but a recall brings the hills home', ()=>{
    showLoad('beetlejuice');
    const i945 = CUES.findIndex(c=>/9:45/.test(c.label));
    /* the plot never plays the cemetery again after 10:40 — the recall path
       is the MANUAL scene panel, and it must not find a hollow set */
    for(let k = i945 + 1; k < CUES.length; k++)
      if(CUES[k].scene === 'cemetery')
        throw new Error('cue '+CUES[k].n+' recalls the cemetery — this test is out of date');
    const sc = sceneFind('cemetery');
    const wx = o => { scene.updateMatrixWorld(true); return o.matrixWorld.elements[12]; };
    const gR = sc.pmv.hillR.group;
    const rHome = wx(gR);
    fireCue(i945);
    for(let k = 0; k < 400; k++) updateStorm(1/60);        // emptied, parked out
    fireCue(i945 + 1);                                     // 10:40 — wagon on, cemetery off
    for(let k = 0; k < 400; k++) updateStorm(1/60);
    if(!sc.group.userData.sceneOff) throw new Error('the cemetery never went off');
    if(Math.abs(wx(gR) - (rHome - BJ_HILL_OUT)) > 0.05)
      throw new Error('the hills are not parked in the wings');
    /* the choreographed recall: on at OUT, and it travels home */
    sceneChangeTo('cemetery');
    if(sc.group.userData.sceneOff) throw new Error('the recall did not bring the set on');
    if(Math.abs(wx(gR) - rHome) < 0.5) throw new Error('the recall POPPED the hills home');
    for(let k = 0; k < 400; k++) updateStorm(1/60);
    if(Math.abs(wx(gR) - rHome) > 0.02)
      throw new Error('the hills never travelled home: '+wx(gR).toFixed(2));
    /* and the INSTANT recall — boot and preset path — snaps them home */
    sceneChangeTo('interior');
    for(let k = 0; k < 60; k++) updateStorm(1/60);         // a second on its way out
    sceneShow('cemetery');
    if(Math.abs(wx(gR) - rHome) > 0.02)
      throw new Error('sceneShow left a hill at '+wx(gR).toFixed(2));
    return 'no plot recall; changeTo travelled the hills home, sceneShow snapped them';
  });

  P('what you stand on rides its part: the roof deck flies with the roof', ()=>{
    showLoad('beetlejuice');
    /* structural first: every walkable of a flying set lives INSIDE the part
       group, so no future piece can be filed outside the thing that moves */
    for(const n of ['attic','closet','bedroom','roof']){
      const sc2 = sceneFind(n);
      for(const o of sc2.walk){
        let p = o, inside = false;
        while(p){ if(sc2.pmv && sc2.pmv.all && p === sc2.pmv.all.group) inside = true; p = p.parent; }
        if(!inside) throw new Error(n+' files a walkable outside its own mover');
      }
    }
    sceneShow('roof');
    const sc = sceneFind('roof');
    const deck = sc.walk[0];
    if(!deck) throw new Error('the roof files nothing walkable');
    if(WALKABLE.indexOf(deck) < 0) throw new Error('the deck is not walkable with the roof on');
    const wy = o => { scene.updateMatrixWorld(true); return o.matrixWorld.elements[13]; };
    const y0 = wy(deck);
    sceneChangeTo('bare');                                 // the roof flies out
    for(let k = 0; k < 120; k++) updateStorm(1/60);        // two seconds up
    const yMid = wy(deck);
    if(!(yMid > y0 + 1)) throw new Error('the deck did not ride the roof up: '+yMid.toFixed(2));
    if(WALKABLE.indexOf(deck) < 0) throw new Error('the deck left WALKABLE while the roof was still drawn');
    for(let k = 0; k < 400; k++) updateStorm(1/60);        // gone
    if(WALKABLE.indexOf(deck) >= 0) throw new Error('you can stand on a roof that has flown out');
    sceneShow('roof');
    if(Math.abs(wy(deck) - y0) > 0.02) throw new Error('the deck came back at '+wy(deck).toFixed(2));
    if(WALKABLE.indexOf(deck) < 0) throw new Error('the deck did not come back into WALKABLE');
    return 'deck rode y '+y0.toFixed(2)+' through '+yMid.toFixed(2)+', left WALKABLE only once gone';
  });

  P('the attic TRACKS out of the picture in view, and parks where it lands', ()=>{
    showLoad('beetlejuice');
    const sc = sceneFind('attic');
    const m = sc.pmv && sc.pmv.all;
    if(!m) throw new Error('the attic carries no all-of-it part');
    /* REVERSED IN PLACE TWICE OVER.  It demanded axis 'y' and a clearance of the
       9.2m header, because the attic used to fly — RULING CE tracks it UPSTAGE
       instead ("the otheres should come on from the sides or back"), and RULING BQ
       stops it going dark at the end.

       Neither of those specifics was ever the guarantee.  The guarantee is that a
       set LEAVES THE PICTURE IN VIEW, over a time the show can wear, without ever
       being seen to vanish while it is still inside the opening — so it is written
       on whatever axis the set uses now, and the next re-routing will not need the
       test rewritten a third time.

       THIRD TIME, AND THE GENERIC HALF HELD.  RULING CQ sends it to a WING —
       "make the attic come i n from one of the sides" — so the axis moves from z
       to x and everything below this line is untouched, which is what the last
       round wrote it that way for. */
    if(m.axis !== 'x') throw new Error('the attic tracks on '+m.axis+', not to a side');
    sceneShow('attic');
    const acting = box(sc.group);
    sceneChangeTo('closet');                               // the 42:34 change
    let frames = 0;
    while(sceneTravelling(sc) && frames < 900){
      updateStorm(1/60); frames++;
      let lit = 0; sc.group.traverse(o=>{ if(o.isMesh && o.layers.mask !== 0) lit++; });
      if(!lit) throw new Error('it vanished mid-move, '+frames+' frames in');
    }
    if(frames >= 900) throw new Error('still travelling after 15s');
    if(sc.group.userData.sceneOff !== false)
      throw new Error('it vanished on arrival instead of parking');
    /* AND IT IS BEHIND THE THING THAT MASKS IT.  "Vacated its own acting box" was
       the first proxy here and it is the wrong one: the brick at PAL_BACK bounds
       the upstage offset to 8.8m against a 9.6m-deep stand-in, so 0.8m of the old
       footprint is still occupied — and that is harmless, because what hides an
       upstage park is the BACKDROP in front of it, not the ground it used to
       stand on.  -10.90 is the last lineset, the one that carries the cloth, and
       p5h's own wagon comment is written to the same number. */
    const parked = box(sc.group), a = m.axis;
    const BACKDROP_Z = -10.90;
    if(a === 'z'){
      if(parked.max.z > BACKDROP_Z)
        throw new Error('parked with its face at z '+parked.max.z.toFixed(2)+
                        ', downstage of the backdrop at '+BACKDROP_Z);
    } else if(a === 'x'){
      /* a WING park has a stronger thing to clear than its own footprint: the
         PICTURE.  A set standing in the wing at x 6.5 has vacated its acting box
         and is still in the opening, so this asks the question the audience asks
         (RULING CQ). */
      const edge = BJ.opW/2;
      if(m.out > 0 ? parked.min.x < edge : parked.max.x > -edge)
        throw new Error('parked at x '+parked.min.x.toFixed(2)+'..'+parked.max.x.toFixed(2)+
                        ', still inside the +-'+edge.toFixed(2)+' picture');
      if(parked.max.x > D.stageW/2 || parked.min.x < -D.stageW/2)
        throw new Error('parked through a side wall at x '+
                        parked.min.x.toFixed(2)+'..'+parked.max.x.toFixed(2));
    } else {
      const gap = (m.out < 0) ? acting.min[a] - parked.max[a] : parked.min[a] - acting.max[a];
      if(gap < -0.01)
        throw new Error('parked still overlaps its acting position by '+(-gap).toFixed(2)+'m on '+a);
    }
    const moved = Math.abs(parked.min[a] - acting.min[a]);
    if(moved < 5) throw new Error('it only travelled '+moved.toFixed(2)+'m on '+a);
    const secs = frames/60;
    if(secs < 3) throw new Error('it cleared in '+secs.toFixed(2)+'s — that is a pop, not a track');
    if(secs > 10) throw new Error('it took '+secs.toFixed(1)+'s — the show would wait on it');
    return 'tracked '+moved.toFixed(2)+'m on '+a+' to '+a+' '+
           parked.min[a].toFixed(2)+'..'+parked.max[a].toFixed(2)+
           ', out of the picture, over '+secs.toFixed(1)+'s, drawn the whole way';
  });

  /* act one now plays across four sets; the interval re-dresses for act two */
  console.log('--- the plot: measured times, interpreted levels ---');

  P('it stands by at the top with a preset and the house open', ()=>{
    showLoad('beetlejuice');
    if(CUES.length < 12) throw new Error('only '+CUES.length+' cues');
    if(nextCue !== 1) throw new Error('stands by at '+nextCue);
    if(CUES[0].n > 1) throw new Error('the first cue is '+CUES[0].n+', not a preset');
    /* this read "house below 0.4" and was quietly pinned to the pre-show 0.45,
       so RULING BM's retune to 0.30 tripped it — a feel constant had a test
       hanging off it by accident.  What it MEANS is "it loaded the pre-show,
       not a mid-show look", so say that: the masters are the preset's own
       values, and the house is up rather than in a blackout (every mid-show
       cue in the plot carries house:0). */
    const pre = CUES.filter(c=>c.n === 0.5)[0];
    if(!pre) throw new Error('there is no pre-show cue to stand by on');
    if(HOUSE.house !== pre.house)
      throw new Error('loads at house '+HOUSE.house+', not the pre-show preset '+pre.house);
    if(HOUSE.house <= 0.1) throw new Error('loads with the house down, that is mid-show');
    return CUES.length+' cues, standing by at '+CUES[1].label+', house '+HOUSE.house;
  });

  /* the numbers that came off the recording, not out of anyone's head */
  P('the measured fade times are in the cue list', ()=>{
    showLoad('beetlejuice');
    const f = CUES.map(c=>c.fade);
    if(f.indexOf(2.2) < 0) throw new Error('the measured 2.2s median fade is not in the plot');
    if(f.indexOf(1.6) < 0) throw new Error('the measured 1.6s fast fade is not in the plot');
    if(!CUES.some(c=>c.fade === 0)) throw new Error('the preset has a fade time');
    return 'fades: '+f.join(', ');
  });

  P('every cue carries the scene it plays in, so a cue can change the set', ()=>{
    showLoad('beetlejuice');
    const without = CUES.filter(c=>!c.scene);
    if(without.length) throw new Error(without.length+' cues do not name a scene');
    return 'all '+CUES.length+' cues name their scene';
  });

  P('walking the cues takes the curtain out and brings the stage up', ()=>{
    showLoad('beetlejuice');
    const before = SHOW.scene;
    const ls = frontCurtainLineset();
    const lvl = ()=>{ let s = 0; FIXTURES.forEach(f=>{ s += f.level; }); return s; };
    /* the top of the night is behind the cloth, with the warmers on it */
    if(ls.pos > OUT_TRIM - 1) throw new Error('the preset does not have the cloth in');
    let guard = 0;
    /* the top of the show is ten cues now, not four — RULING BD split his
       opening into its separate beats (two purple sweeps, the blinder flash,
       the fast pattern, the second flash) — so the walk needs the headroom to
       actually reach cue 2, which is the one that brings the stage up blue. */
    while(CUES[nextCue] && CUES[nextCue].n <= 2 && guard++ < 14){
      go(); for(let i=0;i<500;i++){ updateFades(0.05); updateFly(0.05); }
    }
    if(ls.pos < OUT_TRIM - 1) throw new Error('the cloth never flew out, it is at '+ls.pos.toFixed(1));
    if(lvl() <= 0) throw new Error('act one brought nothing up');
    if(SHOW.scene !== before) throw new Error('the scene changed to '+SHOW.scene);
    return 'cloth out at '+ls.pos.toFixed(1)+'m, act one reads '+lvl().toFixed(2)+' on the rig';
  });

  /* The act break is the single strongest measurement in the file: the longest
     blackout in the show, 13.3s at 71:02, inside a cluster of eight.  If it
     ever stops being a real blackout the measurement has been thrown away. */
  P('the measured act break is a true blackout, and the interval follows it', ()=>{
    showLoad('beetlejuice');
    const i = CUES.findIndex(c=>/END OF HALF/.test(c.label));
    if(i < 0) throw new Error('nothing ends act one');
    const down = CUES[i];
    const up = CUES[i+1];
    if(down.lx.some(r=>r.lvl > 0.02))
      throw new Error('the act break is not a blackout: a channel is at '+
                      down.lx.filter(r=>r.lvl > 0.02)[0].lvl);
    if(down.house > 0.02) throw new Error('the house is up before the cloth is in');
    if(!/INTERVAL/.test(up.label)) throw new Error('no interval after the act break');
    /* REVERSED IN PLACE TWICE OVER, and neither time deleted.  It wanted FULL,
       then HALF when he wrote "1:11:09 house lights fade up to half" in his own
       act one; RULING CG now says "the house light shouldn only be at 15 at the
       start, intermission and the end" and this is the intermission.  The job
       has never changed: the house must genuinely come up, and it must come up
       to the number HE last gave, so a later round cannot drift it back or leave
       it dark. */
    if(Math.abs(up.house - 0.15) > 0.001)
      throw new Error('the interval house is at '+up.house+', and RULING CG says 15');
    if(up.at - down.at !== 7)
      throw new Error('the interval is '+(up.at - down.at)+'s after the blackout, he wrote 7');
    /* RULING CK: "Make it so the blackout at the end of act one happens
       instantly."  Four seconds was OURS — the measured median fade-down standing
       in for a number he never gave — and he has now given one. */
    if(down.fade !== 0)
      throw new Error('the act break has a '+down.fade+'s fade on it; he asked for instant');
    return 'act break snaps dark at cue '+down.n+', interval house at '+up.house+' seven seconds later';
  });

  /* ══ RULING CJ — THE HOUSE LIGHTS WAIT FOR THE CURTAIN ══════════════════ */
  P('the house does not come up until the curtain is really in (CJ)', ()=>{
    for(const which of ['INTERVAL', '2:15:00']){
      showLoad('beetlejuice');
      const i = CUES.findIndex(c=>c.label.indexOf(which) >= 0);
      if(i < 0) throw new Error('no ' + which + ' cue');
      const c = CUES[i];
      if(!c.houseAfterCurtain) throw new Error(which + ' does not declare the gate');
      if(!(c.house > 0.02)) throw new Error(which + ' brings no house up, so nothing is gated');

      /* OPEN THE PICTURE FIRST.  Both of these cues follow a stage that is in
         view, and if the cloth were already in the gate would pass on frame one
         and the assertion would be measuring nothing. */
      const ls = frontCurtainLineset();
      if(!ls) throw new Error('no front traveler hung');
      ls.target = ls.pos = OUT_TRIM;
      ls.open = ls.travTarget = 0;
      HOUSE.house = 0;

      fireCue(i); cancelFollow();
      if(HOUSE.house > 0.001)
        throw new Error(which + ': the house came up on the same frame, with the cloth ' +
                        Math.abs(ls.pos - TRIMS.bjCurtain).toFixed(1) + 'm out');

      let up = -1;
      for(let f = 0; f < 3000; f++){
        updateFly(1/60); updateStorm(1/60);
        if(up < 0 && HOUSE.house > 0.001){
          up = f;
          const trim = TRIMS[ls.goodsKey] !== undefined ? TRIMS[ls.goodsKey] : TRIMS.house;
          if(Math.abs(ls.pos - trim) > 0.05)
            throw new Error(which + ': the house came up at frame ' + f + ' with the cloth ' +
                            Math.abs(ls.pos - trim).toFixed(2) + 'm off its trim');
          if((ls.open || 0) > 0.02)
            throw new Error(which + ': the house came up with the halves ' +
                            ls.open.toFixed(2) + ' apart');
        }
      }
      if(up < 0) throw new Error(which + ': the house never came up at all');
      if(!up) throw new Error(which + ': it came up on frame 0 — the gate never bound');
      if(Math.abs(HOUSE.house - c.house) > 1e-9)
        throw new Error(which + ': it settled at ' + HOUSE.house + ', not the cue own ' + c.house);
    }
    return 'both cues held the master at 0 until the cloth was home, then went to 0.15';
  });

  /* FULLY CLOSED IS TWO THINGS, AND THIS SHOW ONLY EXERCISES ONE OF THEM.
     The Beetlejuice curtain FLIES rather than draws, so its halves sit together
     the whole time and their open value is 0 throughout — so a version of the gate
     that judged the trim ALONE passes every other assertion in this file.  A
     negative check deleting the halves clause changed nothing at all, which is
     the "a bound that nothing in the delivery exercises cannot be negative-checked"
     trap.  So this builds the fixture that approaches it: pipe home, halves held
     wide, and the gate must stay shut. */
  P('fully closed means the halves too, not just the trim (CJ)', ()=>{
    showLoad('beetlejuice');
    const i = CUES.findIndex(c=>c.label.indexOf('INTERVAL') >= 0);
    const ls = frontCurtainLineset();
    const trim = TRIMS[ls.goodsKey] !== undefined ? TRIMS[ls.goodsKey] : TRIMS.house;
    /* the pipe is exactly where a shut curtain hangs — and the halves are parted */
    ls.target = ls.pos = trim;
    ls.open = ls.travTarget = 1;
    HOUSE.house = 0;
    fireCue(i); cancelFollow();
    /* the cue itself asks for them to close, so hold them open to keep the
       fixture standing while the frames run */
    for(let f = 0; f < 400; f++){
      ls.travTarget = 1; ls.open = 1;
      updateFly(1/60); updateStorm(1/60);
      if(HOUSE.house > 0.001)
        throw new Error('the house came up at frame ' + f + ' with the pipe home but the ' +
                        'halves wide open — the gate is reading the trim alone');
    }
    /* let them shut, and it comes up */
    ls.travTarget = 0;
    let up = -1;
    for(let f = 0; f < 600 && up < 0; f++){
      updateFly(1/60); updateStorm(1/60);
      if(HOUSE.house > 0.001) up = f;
    }
    if(up < 0) throw new Error('the halves closed and the house still never came up');
    return 'held 400 frames on a parted curtain at its trim, up ' + up + ' frames after they shut';
  });

  P('a cue that does not ask for the gate raises the house at once (CJ stays declared)', ()=>{
    showLoad('beetlejuice');
    const i = CUES.findIndex(c=>/PRE-SHOW/.test(c.label));
    const c = CUES[i];
    if(c.houseAfterCurtain) throw new Error('the pre-show gates its house; pick an ungated cue');
    const ls = frontCurtainLineset();
    ls.target = ls.pos = OUT_TRIM; ls.open = ls.travTarget = 0;
    HOUSE.house = 0;
    fireCue(i); cancelFollow();
    if(Math.abs(HOUSE.house - c.house) > 1e-9)
      throw new Error('an ungated cue held the house at ' + HOUSE.house + ' instead of ' + c.house);
    return 'ungated cues are untouched: the master takes the cue value on the frame it fires';
  });

  console.log('--- it does not disturb the other four ---');

  P('the other four still load and still stand on their own', ()=>{
    const out = [];
    for(const key of ['outsiders','lostboys','hamilton','goeswrong']){
      if(!showLoad(key)) throw new Error(key+' would not load');
      let m = 0; SHOW.group.traverse(o=>{ if(o.isMesh) m++; });
      if(m < 20) throw new Error(SHOWS[key].name+' built '+m+' pieces');
      if(CUES.length < 12) throw new Error(SHOWS[key].name+' has '+CUES.length+' cues');
      out.push(SHOWS[key].name+': '+m);
    }
    return out;
  });

  P('striking beetlejuice leaves nothing behind for the next show', ()=>{
    showLoad('beetlejuice');
    showLoad('goeswrong');
    if(SHOW.scenes.length) throw new Error(SHOW.scenes.length+' scenes survived the strike');
    if(SHOW.scene) throw new Error('the live scene survived: '+SHOW.scene);
    if(SHOW.curtainKey === 'bjCurtain') throw new Error('the beetlejuice curtain survived');
    let bj = 0; SHOW.group.traverse(o=>{ if(o.name && o.name.indexOf('bj:') === 0) bj++; });
    if(bj) throw new Error(bj+' beetlejuice pieces are still on the stage');
    return 'clean: no scenes, no curtain, no pieces';
  });

  console.log('--- the auto-cue: the show runs itself off the measured timeline ---');

  /* the whole point of the round. follow already existed and was unused. */
  P('every cue but the last arms the next one, off a measured gap', ()=>{
    showLoad('beetlejuice');
    /* EXACTLY TWO cues arm nothing on purpose — the pre-show and the
       interval — because the owner asked to advance from pre-show "when you
       press start" and to begin the second half "when you press a button on
       the consol".  A hold IS follow:null; that is the whole mechanism. (AU) */
    /* A FOLLOW OF ZERO IS ARMING, NOT FAILING TO ARM.  RULING CK puts the
       attic-to-house change on the same second as his own 1:30:55 blackout, so
       one pair in the plot has a zero gap — and a strictly-positive test counted
       that as a cue that arms nothing, which is exactly what a silent run would
       then do.  Only null is a stop.

       AND THE TEST FOR IT HAS TO BE EXPLICIT, because null >= 0 is TRUE in
       JavaScript — a straight swap to a non-negative test made both holds look
       like cues that arm the next one, and the suite said "0 holds, expected 2".
       A cue arms the next one when its follow is a real number. */
    const missing = [], holds = [];
    for(let i = 0; i < CUES.length - 1; i++){
      const f = CUES[i].follow;
      const arms = (typeof f === 'number') && !isNaN(f) && f >= 0;
      if(!arms){ (CUES[i].hold ? holds : missing).push(CUES[i].n); }
    }
    if(missing.length)
      throw new Error(missing.length+' cue(s) do not arm the next: '+missing.slice(0,6).join(', '));
    if(holds.length !== 2)
      throw new Error(holds.length+' holds, expected 2 (pre-show and interval): '+holds.join(', '));
    if(CUES[CUES.length-1].follow !== null)
      throw new Error('the last cue arms something after it');
    return (CUES.length-1-holds.length)+' follow gaps set, '+holds.length+' holds, last one null';
  });

  P('the follow chain reconstructs the running time of the recording', ()=>{
    showLoad('beetlejuice');
    let total = 0;
    for(const c of CUES) total += (c.follow || 0);
    /* RULING AR: the show ends at 2:15:00 = 8100s, which is the owner
       overruling a measurement — the probe put the biggest cluster of light
       bumps at 8462.  The chain therefore spans 33s to 8100s MINUS the two
       holds, which arm nothing and so contribute no gap. */
    let holdGap = 0;
    for(let i = 0; i < CUES.length - 1; i++)
      if(CUES[i].hold) holdGap += CUES[i+1].at - CUES[i].at;
    const want = (8100 - 33) - holdGap;
    if(Math.abs(total - want) > 1)
      throw new Error('the chain runs '+total.toFixed(1)+'s, expected '+want.toFixed(1)+'s');
    const mins = (8100 - 33)/60;
    if(mins < 120 || mins > 170) throw new Error('a '+mins.toFixed(0)+' minute show is not this one');
    return total.toFixed(0)+'s of armed gaps across a '+mins.toFixed(0)+' minute show';
  });

  /* the act break is the strongest measurement in the file; the chain has to
     put it where the recording put it, not merely somewhere plausible */
  P('the measured act break falls at 71:02 along the chain', ()=>{
    showLoad('beetlejuice');
    /* from the cue GO starts act one on — the pre-show HOLDS before it, so
       the clock starts when somebody presses the button, not at 33s */
    const i = CUES.findIndex(c=>/END OF HALF/.test(c.label));
    const start = CUES.findIndex(c=>c.hold) + 1;
    let t = CUES[start].at;
    for(let k = start; k < i; k++) t += (CUES[k].follow || 0);
    const want = 71*60 + 2;
    if(Math.abs(t - want) > 2)
      throw new Error('the chain reaches the act break at '+(t/60).toFixed(1)+
                      ' min, measured 71:02');
    return 'act break at '+Math.floor(t/60)+':'+String(Math.round(t%60)).padStart(2,'0');
  });

  P('the curtain call falls at 141:02 along the chain', ()=>{
    showLoad('beetlejuice');
    /* 2:13:05 = 7985s, the owner's time, not the measured 141:02.  Act two
       runs on its OWN chain because the interval holds for the console
       button, so the clock starts at the cue GO fires after it. */
    const i = CUES.findIndex(c=>/CURTAIN CALL/.test(c.label));
    if(i < 0) throw new Error('nothing is the curtain call');
    const holds = CUES.map((c,k)=>c.hold?k:-1).filter(k=>k>=0);
    const start = holds[holds.length-1] + 1;
    let t = CUES[start].at;
    for(let k = start; k < i; k++) t += (CUES[k].follow || 0);
    const want = 2*3600 + 13*60 + 5;
    if(Math.abs(t - want) > 2)
      throw new Error('the chain reaches the call at '+(t/60).toFixed(1)+' min, the plot says 2:13:05');
    return 'call at '+Math.floor(t/60)+':'+String(Math.round(t%60)).padStart(2,'0');
  });

  /* p5d's plot was audited for this: restoreAims before EVERY look, or one
     cue's focus leaks into the next. plotOutsiders shipped without it once
     and that was finding M2. */
  P('no cue leaks its focus into the next one (audit finding M2)', ()=>{
    showLoad('beetlejuice');
    /* the warmers cue throws the front of house UP at the cloth; a later cue
       that never touches aims must not inherit that */
    /* Anchored on the cue that throws the front of house UP at the cloth and
       the first cue after it that sets no aim at all.

       THE ANCHOR MOVED ONE CUE LATER under RULING CG.  It used to be the
       pre-show and GO, because GO set no aim; CG makes GO hold the pre-show
       picture — the same cloth aim — and puts the first no-aim cue at 1:00.  The
       demonstration is identical and if anything tighter: two cues in a row aim
       at the cloth, the third says nothing, and it must not inherit.  Written
       against "the last cue with a cloth aim" rather than a timestamp, so the
       next retiming does not silently un-anchor it.

       AND THE PAIR IS TAKEN BY POSITION, NOT BY AIM.  Selecting the second cue
       as "the next one whose aims are not up" and then asserting its aims are
       not up is a test agreeing with itself — the shape TRAPS records for a test
       that reimplements what it tests.  The anchor is the cue that throws the
       front up, and the subject is literally THE NEXT CUE IN THE STACK, whatever
       it turns out to hold. */
    const warm = CUES.find(c=>/GO — the show track starts/.test(c.label));
    if(!warm) throw new Error('no GO cue to anchor on');
    const up = warm.lx.slice(0, 6).filter(r=>r.aim && r.aim[1] > 5);
    if(up.length < 4) throw new Error('GO does not aim the front up at the cloth');
    const plain = CUES[CUES.indexOf(warm) + 1];
    if(!plain) throw new Error('nothing follows GO to inherit it');
    const leaked = plain.lx.slice(0, 6).filter(r=>r.aim && r.aim[1] > 5);
    if(leaked.length)
      throw new Error(leaked.length+' front channels carry the cloth aim into a cue that never set it');
    return 'the cloth aim stays on the cloth cues';
  });

  /* if a transport is ever built it must not reintroduce a wall-clock timer,
     and nothing THIS show added may contain one */
  P('the show part introduces no setTimeout of its own', ()=>{
    const src = document.documentElement.outerHTML;
    const i = src.indexOf('BEETLEJUICE — the fifth production');
    if(i < 0) throw new Error('cannot find the show part in the build');
    const j = src.indexOf('function plotBeetlejuice');
    const end = src.indexOf('SHOW.cues = CUES.length', j);
    const part = src.slice(i, end > 0 ? end : i + 60000);
    /* A CALL, not the word — the part's own comments discuss setTimeout at
       length, because explaining why follow uses one is the point.  Plain
       indexOf rather than a regex: the probe template eats every backslash,
       so \\s and \\( would arrive broken (TRAPS.md). */
    if(part.indexOf('setTimeout(') >= 0 || part.indexOf('setInterval(') >= 0)
      throw new Error('the show part calls a wall-clock timer');
    return 'no setTimeout in the show part; the follow field is p6 machinery, not ours';
  });

  /* ====================================================================== *
     THE AUDIENCE RIG, THE SOUND AND THE TOP OF THE SHOW (rulings BA-BD)
     ====================================================================== */
  console.log('--- the audience rig (RULING BC) ---');

  P('the patch is 39 channels on every board, and every channel knows its number', ()=>{
    const home = STAGE, seen = [];
    Object.keys(STAGES).forEach(k=>{
      stageSwitch(k, true);
      seen.push(k + ':' + FIXTURES.length);
      if(FIXTURES.length !== 39)
        throw new Error(k + ' has ' + FIXTURES.length + ' channels, wanted 39');
      for(let i = 0; i < FIXTURES.length; i++)
        if(FIXTURES[i].ch !== i + 1)
          throw new Error(k + ' index ' + i + ' carries ch ' + FIXTURES[i].ch);
    });
    stageSwitch(home, true);
    if(GROUPS.all.length !== 39)
      throw new Error('GROUPS.all still covers ' + GROUPS.all.length + ' channels');
    return seen.join('  ');
  });

  /* The first fixtures in this game that point the other way.  Worth pinning in
     both directions: it is the whole of what makes them the AUDIENCE rig, and
     an aim typo would simply light the stage twice and never look wrong. */
  P('the audience rig aims at the audience, and the original 25 never do', ()=>{
    showLoad('beetlejuice');
    const tmp = new THREE.Vector3();
    const az = f => { worldToStage(f.aim, tmp); return tmp.z; };
    let worstOld = -99;
    for(let n = 1; n <= 25; n++) worstOld = Math.max(worstOld, az(chan(n)));
    let nearestNew = 99;
    GROUPS.house.forEach(n=>{ nearestNew = Math.min(nearestNew, az(chan(n))); });
    if(worstOld >= 8)
      throw new Error('one of the original 25 aims into the house at z ' + worstOld.toFixed(1));
    if(nearestNew < 8)
      throw new Error('an audience unit still aims at the stage, z ' + nearestNew.toFixed(1));
    return 'the 25 reach z ' + worstOld.toFixed(1) + ' at most, the 14 start at z ' + nearestNew.toFixed(1);
  });

  /* SEEN, NOT SEEING.  There are eight real lights (four in a headset) handed
     out by level*rank, so a blinder that outranked a stage lantern would take a
     real light off the stage at the worst possible moment.

     This asserted on the POWER field until RULING BF, when the two jobs it was
     doing were split.  The GUARANTEE is unchanged and the assertion is the same
     sentence — it just names the field that now carries it.  BF is why:
     ranking low and burning dim were the same number, so BC quietly capped the
     blinders at a fifth of a front-of-house lantern and nothing here could
     see it.  What BC's EFFECT gives up is in the reserve tests below, which is
     a stated ceiling of two rather than an accident. */
  P('an audience unit can never outrank a stage lantern for a real light', ()=>{
    let maxAud = 0, minStage = 99;
    GROUPS.house.forEach(n=>{ maxAud = Math.max(maxAud, chan(n).rank); });
    for(let n = 1; n <= 25; n++) minStage = Math.min(minStage, chan(n).rank);
    if(maxAud >= minStage)
      throw new Error('an audience unit at rank ' + maxAud +
                      ' can beat a stage lantern at rank ' + minStage);
    return 'audience tops out at ' + maxAud + ', the dimmest stage lantern is ' + minStage;
  });

  console.log('--- the audience rig actually lights the audience (BF, BG) ---');

  /* the whole of the owner's "the blinders arent bright enoug", in the units
     the renderer uses.  Behavioural, not a comparison of two constants: light
     ONE unit, run a frame, and read what the real light it was handed burns at.
     Before BF a blinder at FULL burned 0.87 while one FOH lantern at 45% burned
     1.36 — eight of them "as bright as posible" and every one of them dimmer
     than half a single front light. */
  const soloIntensity = (ch)=>{
    FIXTURES.forEach(f=>{ f.level = 0; });
    chan(ch).level = 1;
    updateRig(1/60, 0);
    let best = 0;
    for(const l of LIGHT_POOL) best = Math.max(best, l.intensity);
    return best;
  };
  P('a blinder at full now burns brighter than a stage profile at full', ()=>{
    showLoad('beetlejuice');
    const blind = soloIntensity(26), prof = soloIntensity(1), foh45 = (()=>{
      FIXTURES.forEach(f=>{ f.level = 0; }); chan(1).level = 0.45; updateRig(1/60, 0);
      let b = 0; for(const l of LIGHT_POOL) b = Math.max(b, l.intensity); return b;
    })();
    if(blind <= prof)
      throw new Error('a blinder at full burns ' + blind.toFixed(2) +
                      ' against a profile at full on ' + prof.toFixed(2));
    if(blind <= foh45 * 3)
      throw new Error('a blinder at full is only ' + (blind/foh45).toFixed(1) +
                      'x one FOH lantern at 45% — that is the fault, not the fix');
    FIXTURES.forEach(f=>{ f.level = 0; });
    return 'blinder ' + blind.toFixed(2) + ' vs profile ' + prof.toFixed(2) +
           ' vs one FOH at 45% ' + foh45.toFixed(2);
  });

  /* how many of the pool the audience rig is holding right now.
     NAMED audLampsLive AND NOT audLive ON PURPOSE: the game has its own
     audLive(tr) — "is this TRACK really playing" — and a probe-scope const of
     that name shadows it for every assertion below, whatever the argument.  It
     did: the two "reports itself live" checks in the audio block were reading
     the number of lit audience lamps and passing because the lamps were dark. */
  const audLampsLive = ()=> GROUPS.house.filter(n=>chan(n)._live).length;
  const stageLive = ()=>{ let k = 0; for(let n = 1; n <= 25; n++) if(chan(n)._live) k++; return k; };

  /* THE ONE THAT WAS ACTUALLY BROKEN.  In a headset the pool is VR.lightCap —
     four — and the six FOH lanterns of the pre-show took all four, so the
     owner's purple sweep ran perfectly and put NOTHING on anybody.  "its not
     doing the purple light seewps at the start" is this line. */
  P('the pre-show sweep gets real light, in a headset as well as flat', ()=>{
    showLoad('beetlejuice');
    fireCue(0); cancelFollow();
    for(let i = 0; i < 30; i++){ showAudioTick(1/60); updateRig(1/60, i/60); }
    const flat = audLampsLive();
    const wasActive = VR.active, wasCap = VR.lightCap;
    VR.active = true; VR.lightCap = 4;
    updateRig(1/60, 0);
    const headset = audLampsLive(), headsetStage = stageLive();
    VR.active = wasActive; VR.lightCap = wasCap;
    if(flat < 2) throw new Error('the sweep holds ' + flat + ' of the 8 flat');
    if(headset < 2) throw new Error('the sweep holds ' + headset + ' of the 4 in a headset');
    if(headsetStage < 1) throw new Error('the reserve took the whole headset pool');
    return flat + ' of 8 flat, ' + headset + ' of 4 in a headset (' +
           headsetStage + ' left to the stage)';
  });

  /* A CEILING, NOT A FLOOR — the regression the reserve itself could cause.
     Fourteen audience units at full must still only ever hold two. */
  P('the reserve is a ceiling: fourteen audience units at full hold two lights', ()=>{
    showLoad('beetlejuice');
    FIXTURES.forEach(f=>{ f.level = 0; });
    GROUPS.house.forEach(n=>{ chan(n).level = 1; });
    for(let n = 1; n <= 25; n++) chan(n).level = 1;
    updateRig(1/60, 0);
    const a = audLampsLive(), s = stageLive();
    FIXTURES.forEach(f=>{ f.level = 0; });
    if(a !== 2) throw new Error('the audience rig holds ' + a + ' of the pool, wanted 2');
    if(a + s !== LIGHT_POOL.length)
      throw new Error('the pool handed out ' + (a + s) + ' of ' + LIGHT_POOL.length);
    return a + ' to the audience, ' + s + ' to the stage, whole rig at full';
  });

  /* RULING BL — AND IT DIVIDES THE RIG.  The line above has always passed and
     was never enough: BG handed the reserve out by rank, and the blinders ARE
     audience units at rank 0.9 against the movers' 0.8, so "two" meant "two
     blinders" every time.  At 1:03 that spent all eight real lights on eight
     red lamps and left the purple sweep with none, which is half of the reason
     the owner could not see it.  Both groups lit means one of each. */
  P('RULING BL: the reserve divides the audience rig — one of each, not two of one', ()=>{
    showLoad('beetlejuice');
    FIXTURES.forEach(f=>{ f.level = 0; });
    GROUPS.house.forEach(n=>{ chan(n).level = 1; });
    for(let n = 1; n <= 25; n++) chan(n).level = 1;
    updateRig(1/60, 0);
    const held = GROUPS.house.filter(n=>chan(n)._live).map(n=>chan(n).type);
    FIXTURES.forEach(f=>{ f.level = 0; });
    if(held.length !== 2)
      throw new Error('the audience rig holds ' + held.length + ' of the pool, wanted 2');
    if(held.indexOf('blinder') < 0 || held.indexOf('mover') < 0)
      throw new Error('both reserved lights went to ' + held.join(' and ') +
                      ' — one group starved the other');
    return 'one ' + held[0] + ' and one ' + held[1];
  });

  /* the same thing where it actually bites hardest: a headset hands out FOUR
     lights, and act two's 1:53:33 puts all fourteen audience units up at once */
  P('RULING BL: at 1:53:33 in a headset the movers are not shut out', ()=>{
    showLoad('beetlejuice');
    fireCue(CUES.findIndex(c=>c.at === 6813)); cancelFollow();
    const wasActive = VR.active, wasCap = VR.lightCap;
    VR.active = true; VR.lightCap = 4;
    let sawMover = false;
    for(let i = 0; i < 120; i++){
      audFxStep(1/60); updateRig(1/60, i/60);
      if(GROUPS.aud.some(n=>chan(n)._live)) sawMover = true;
    }
    VR.active = wasActive; VR.lightCap = wasCap;
    if(!sawMover)
      throw new Error('two seconds of the red-and-orange chaos and not one mover ever held a light');
    return 'the movers get a share of the four';
  });

  /* and the other half of that: with the audience rig DARK the reserve claims
     nothing, so all 94 stage cues in the plot are untouched by any of this */
  P('a dark audience rig claims no reserve — the stage keeps all eight', ()=>{
    showLoad('beetlejuice');
    FIXTURES.forEach(f=>{ f.level = 0; });
    for(let n = 1; n <= 25; n++) chan(n).level = 1;
    updateRig(1/60, 0);
    const a = audLampsLive(), s = stageLive();
    FIXTURES.forEach(f=>{ f.level = 0; });
    if(a !== 0) throw new Error(a + ' dark audience units are holding a light');
    if(s !== LIGHT_POOL.length)
      throw new Error('the stage got ' + s + ' of ' + LIGHT_POOL.length);
    return 'all ' + s + ' to the stage, nothing reserved';
  });

  console.log('--- the pattern engine (RULING BD) ---');

  /* A cue cannot say "drift slowly and fade between two colours".  This is the
     test that the ENGINE runs rather than that the field parses: ten seconds
     stepped off dt, watching pan actually move. */
  P('a wander really moves, and really crossfades between the two colours', ()=>{
    showLoad('beetlejuice');
    showCueFx({on:'aud', kind:'wander', cols:['#2fbf5f','#7f3fbf']});
    const f = chan(GROUPS.aud[0]);
    const pan0 = f.panT, shades = {};
    let moved = 0;
    for(let i = 0; i < 600; i++){
      audFxStep(1/60);
      moved = Math.max(moved, Math.abs(f.panT - pan0));
      shades[f.color.getHexString()] = 1;
    }
    const n = Object.keys(shades).length;
    if(moved < 5)
      throw new Error('ten seconds of wander moved pan by ' + moved.toFixed(2) + ' degrees');
    if(n < 20) throw new Error('the colour did not crossfade: only ' + n + ' shades in 10s');
    return 'pan moved ' + moved.toFixed(0) + ' degrees through ' + n + ' shades';
  });

  /* FAST MEANS OFTEN, NOT FAR.  Total pan travel was the first measurement
     here and it was the wrong one: a slow pattern with a wider throw covers
     more ground than a fast one with a narrow throw, so the wrong build — a
     random effect running at the wander frequencies — sailed straight through
     it on amplitude alone.  Count direction changes instead. */
  P('the fast pattern changes direction far more often than the slow one', ()=>{
    const reversals = kind => {
      showCueFx({on:'aud', kind:kind, cols:['#2fbf5f','#7f3fbf']});
      const f = chan(GROUPS.aud[0]);
      let last = f.panT, dir = 0, n = 0;
      for(let i = 0; i < 600; i++){
        audFxStep(1/60);
        const d = f.panT - last;
        if(Math.abs(d) > 1e-6){
          const s = d > 0 ? 1 : -1;
          if(dir !== 0 && s !== dir) n++;
          dir = s;
        }
        last = f.panT;
      }
      return n;
    };
    const slow = reversals('wander'), fast = reversals('random');
    if(fast < 8)
      throw new Error('the fast pattern only turned round ' + fast + ' times in ten seconds');
    if(!(fast > slow * 3))
      throw new Error('random turned round ' + fast + ' times against wander ' + slow);
    return 'wander turns ' + slow + ' times in 10s, random turns ' + fast;
  });

  P('a cue that says nothing about the audience rig clears a running effect', ()=>{
    showCueFx({on:'blind', kind:'random'});
    if(!AUD.fx.blind) throw new Error('the effect never armed');
    showCueFx(null);
    if(AUD.fx.blind || AUD.fx.aud) throw new Error('an effect outlived the cue that wanted it');
    return 'armed, then cleared by the next cue';
  });

  console.log('--- the sound (rulings BA, BB) ---');

  /* THE STATE EVERY SUITE RUNS IN.  jsdom never fetches media, so this is the
     no-audio path end to end: the show plots, holds, GOes and never throws,
     and the transport never touches the clock. */
  P('a missing track is silent and harmless, and the follow chain still drives', ()=>{
    showLoad('beetlejuice');
    const tr = audTrack('act1'), pre = audTrack('preshow');
    if(!tr || !pre) throw new Error('the manifest built no track records');
    if(audLive(tr)) throw new Error('a track with no file reports itself live');
    fireCue(0);
    showAudioTick(0.016);
    if(AUD.clock) throw new Error('the transport took the clock with no audio');
    if(!pre.want) throw new Error('the pre-show cue did not ask for the pre-show music');
    go();
    if(nextCue !== 2) throw new Error('GO off the hold did not advance: nextCue ' + nextCue);
    if(CUES[1].follow === null) throw new Error('the follow chain is not driving either');
    /* WANTED IS NOT PLAYING, and that distinction is the whole silent fallback.
       The GO above asked for the show track by name; with no file behind it the
       transport must still refuse the clock.  Checking this only BEFORE anything
       wanted the track let an audLive that believed intent pass. */
    if(!tr.want) throw new Error('GO did not ask for the show track at all');
    if(audLive(tr)) throw new Error('a wanted-but-absent track reports itself live');
    showAudioTick(0.016);
    if(AUD.clock) throw new Error('the transport took the clock off a track with no file');
    if(followTimer === null) throw new Error('nothing is driving the show: no clock and no follow');
    return 'silent, wanted, refused the clock, still driven by follow at ' + CUES[1].follow + 's';
  });

  /* and the other half: when it IS playing it owns the clock.  A fake element
     is the seam — readyState 4 and not paused is all "really playing" means. */
  P('with the track really playing the music is the clock, and no follow is armed', ()=>{
    showLoad('beetlejuice');
    const tr = audTrack('act1'), real = tr.el;
    const fake = {paused:false, readyState:4, currentTime:40, volume:1,
                  play(){ return null; }, pause(){ this.paused = true; }};
    tr.el = fake; tr.want = true; tr.blocked = false;
    showAudioTick(0.016);
    if(!AUD.clock) throw new Error('the transport did not take the clock');
    if(nextCue !== 2) throw new Error('the 35s cue did not fire off currentTime: nextCue ' + nextCue);
    if(followTimer !== null) throw new Error('a follow timer was armed while the music is the clock');
    /* and that cue really did SEEK — "start the audio at time stamp 35
       seconds" is a move of the playhead, not a note in a comment.  It lands on
       the next frame, because the cue states the intent and the pump does the
       talking to the browser. */
    showAudioTick(0.016);
    if(Math.abs(fake.currentTime - 35) > 0.001)
      throw new Error('the GO cue did not seek the track to 0:35, it is at ' + fake.currentTime);
    fake.currentTime = 70;
    showAudioTick(0.016);
    /* DERIVED, NOT TYPED.  This was a literal 6, and RULING CG's new cue at 1:00 made
       it 7 — a literal that goes stale every time the plot grows a cue at the
       top of the show, and whose failure reads like a broken transport.  The
       thing under test is the TRANSPORT, so the plot is allowed to say how many
       cues are due and the transport has to have fired exactly those. */
    const due = CUES.filter(c=>c.at !== undefined && c.at <= 70).length;
    if(nextCue !== due)
      throw new Error('the transport is at nextCue ' + nextCue + ' with ' + due + ' cues due by 70s');
    if(followTimer !== null) throw new Error('a follow timer is armed while the music is the clock');
    /* and it stops dead at a hold rather than running through the interval */
    const iv = CUES.findIndex(c=>c.hold && c.at > 4000);
    if(iv < 0) throw new Error('the interval hold is missing');
    nextCue = iv; fake.currentTime = 8200;
    showAudioTick(0.016);
    if(nextCue !== iv) throw new Error('the transport ran straight through the interval hold');
    tr.el = real; tr.want = false;
    return 'fired off timecode, caught up, and waited at the interval';
  });

  /* THE JOIN (RULING BI).  The half above proves act one drives; this proves the
     OFFSET does, which is the only genuinely new arithmetic in the split.  Act
     two's file starts at zero and his plot counts from 4292, so a transport that
     forgot to add the offset would sit at second 100 of a two-and-a-quarter-hour
     show and fire nothing for the rest of the night — silently, because a cue
     that never comes due looks exactly like a cue that is not due yet. */
  P('act two drives the stack off its own file, with the offset added back', ()=>{
    showLoad('beetlejuice');
    const two = audTrack('act2'), real = two.el;
    const ivIdx = CUES.findIndex(c=>c.hold && c.at > 4000);
    /* park the stack where the interval leaves it, then start act two */
    nextCue = ivIdx + 1;
    const fake = {paused:false, readyState:4, currentTime:0, volume:1,
                  play(){ return null; }, pause(){ this.paused = true; }};
    two.el = fake; two.want = true; two.blocked = false;
    showAudioTick(0.016);
    if(!AUD.clock) throw new Error('act two did not take the clock');
    const firstUp = CUES[nextCue];
    /* LET THE CUE'S OWN SEEK LAND FIRST.  The act-two cue this just fired says
       {play:'act2', at:4292}, which the pump turns into currentTime = 0 on the
       next frame — so a test that writes the playhead before that frame is
       racing the thing it is testing, and watches its own value get overwritten. */
    showAudioTick(0.016);
    if(Math.abs(fake.currentTime) > 0.001)
      throw new Error('his 4292 did not seek act two to its own 0.0, it is at ' + fake.currentTime);
    /* 100 seconds into the FILE is 4392 in his numbers */
    fake.currentTime = 100;
    showAudioTick(0.016);
    const fired = CUES.slice(ivIdx + 1, nextCue);
    if(!fired.length) throw new Error('100s into act two fired nothing at all');
    const late = fired.filter(c=>c.at > 4392);
    if(late.length) throw new Error('it fired ' + late.length + ' cues that are not due yet');
    const due = CUES.slice(ivIdx + 1).filter(c=>c.at <= 4392);
    if(fired.length !== due.length)
      throw new Error('fired ' + fired.length + ' of the ' + due.length + ' cues due by 4392');
    /* the giveaway if the offset were dropped: cue 24 sits at 4292 and would
       still be waiting, because 100 is not 4292 */
    if(firstUp.at > 4392)
      throw new Error('the stack was parked past the join to begin with');
    two.el = real; two.want = false;
    showSoundStop();
    return fired.length + ' cues fired by 100s into act2 (his 4392), none early';
  });

  P('walking to the other theatre stops the sound with the show', ()=>{
    showLoad('beetlejuice');
    const tr = audTrack('act1'), real = tr.el;
    let paused = false;
    tr.el = {paused:false, readyState:4, currentTime:100, volume:1,
             play(){ return null; }, pause(){ paused = true; this.paused = true; }};
    tr.want = true; tr.blocked = false;
    showAudioTick(0.016);
    if(!AUD.clock) throw new Error('the transport never took the clock');
    showCueFx({on:'blind', kind:'random'});
    const home = STAGE, other = Object.keys(STAGES).filter(k=>k !== home)[0];
    stageSwitch(other, true);
    if(!paused) throw new Error('the track played on into the other theatre');
    if(AUD.clock) throw new Error('the transport still holds the clock on the other stage');
    if(tr.want) throw new Error('the track is still wanted on the other stage');
    if(AUD.fx.blind) throw new Error('a pattern followed the board into the other theatre');
    stageSwitch(home, true);
    tr.el = real;
    return 'paused, clock dropped, pattern cleared at the boundary';
  });

  console.log('--- the top of the show, as he wrote it ---');

  P('the pre-show holds, the blinders are dark on it, and the music is asked for', ()=>{
    showLoad('beetlejuice');
    const pre = CUES[0];
    if(!pre.hold) throw new Error('the pre-show does not hold');
    if(pre.follow !== null) throw new Error('the pre-show arms a follow');
    const lit = GROUPS.blind.filter(n=>pre.lx[n-1].lvl > 0.01);
    if(lit.length)
      throw new Error(lit.length + ' blinders are up at the pre-show — they are for later');
    const drifting = GROUPS.aud.filter(n=>pre.lx[n-1].lvl > 0.01);
    if(!drifting.length) throw new Error('no audience mover is up at the pre-show');
    if(!pre.fx || pre.fx.kind !== 'wander') throw new Error('the pre-show drifts nothing');
    if(!pre.fx.cols || pre.fx.cols.length !== 2)
      throw new Error('the pre-show does not fade between two colours');
    if(!pre.audio || pre.audio.play !== 'preshow')
      throw new Error('the pre-show does not start the pre-show music');
    if(!(pre.house > 0.02 && pre.house < 0.6))
      throw new Error('the house is not LOW at the pre-show, it is at ' + pre.house);
    return 'holds, 0 of 8 blinders up, ' + drifting.length + ' movers drifting, house at ' + pre.house;
  });

  /* THE FRONT OF HOUSE (RULING BH).  The owner: "make sure the lobby lights get
     turned of at the start of a show".  It had never gone out in any of the
     five productions — HOUSE.lobby sat at 0.9 through every performance,
     because no cue anywhere had ever carried the field. */
  P('the foyer is up at the pre-show and out at GO, and comes back at the interval', ()=>{
    showLoad('beetlejuice');
    const at = t => CUES.filter(c=>c.at === t)[0];
    const pre = CUES[0], go = at(35), interval = at(4269), two = at(4292);
    if(!(pre.lobby > 0.5)) throw new Error('the foyer is not up at the pre-show: ' + pre.lobby);
    if(go.lobby !== 0) throw new Error('GO leaves the foyer at ' + go.lobby);
    if(!(interval.lobby > 0.5)) throw new Error('the interval leaves the foyer at ' + interval.lobby);
    if(two.lobby !== 0) throw new Error('act two leaves the foyer at ' + two.lobby);
    /* and it must really reach the circuit, not just sit in the record */
    fireCue(0); cancelFollow();
    const onAtPre = HOUSE.lobby;
    fireCue(CUES.indexOf(go)); cancelFollow();
    const offAtGo = HOUSE.lobby;
    fireCue(CUES.indexOf(interval)); cancelFollow();
    const backAtInterval = HOUSE.lobby;
    if(!(onAtPre > 0.5)) throw new Error('firing the pre-show left the circuit at ' + onAtPre);
    if(offAtGo !== 0) throw new Error('firing GO left the circuit at ' + offAtGo);
    if(!(backAtInterval > 0.5))
      throw new Error('firing the interval left the circuit at ' + backAtInterval);
    return 'pre-show ' + onAtPre + ' -> GO ' + offAtGo + ' -> interval ' + backAtInterval;
  });

  /* SAYING NOTHING LEAVES IT ALONE.  A field that defaulted to a value would
     reach back through four other productions and black out their foyers. */
  P('a cue that says nothing about the foyer leaves it exactly where it was', ()=>{
    showLoad('beetlejuice');
    const bare = CUES.filter(c=>c.lobby === undefined);
    if(bare.length < 80)
      throw new Error('only ' + bare.length + ' of ' + CUES.length + ' cues stay silent about it');
    HOUSE.lobby = 0.37;
    fireCue(CUES.indexOf(bare[bare.length - 1])); cancelFollow();
    if(HOUSE.lobby !== 0.37)
      throw new Error('a silent cue moved the foyer to ' + HOUSE.lobby);
    /* the four other shows carry the field on no cue at all */
    const others = [];
    ['outsiders','lostboys','hamilton','goeswrong'].forEach(k=>{
      if(!SHOWS[k]) return;
      showLoad(k);
      const said = CUES.filter(c=>c.lobby !== undefined).length;
      if(said) throw new Error(k + ' has ' + said + ' cues touching the foyer');
      others.push(k + ':' + CUES.length);
    });
    showLoad('beetlejuice');
    HOUSE.lobby = 0.9;
    return bare.length + ' of ' + (bare.length + 4) + ' beetlejuice cues silent; ' + others.join(' ');
  });

  /* HOUSE is per-stage state that p2k parks and restores, and the lobby field
     has always been one of its fields — so a foyer taken out by a cue must
     still be out when you walk back from the other building.  The trap this
     guards is the §5 one: state that looks right because you never left. */
  P('a foyer taken out by a cue survives the walk to the other venue', ()=>{
    showLoad('beetlejuice');
    const home = STAGE;
    fireCue(CUES.filter(c=>c.at === 35)[0] && CUES.findIndex(c=>c.at === 35)); cancelFollow();
    const outHere = HOUSE.lobby;
    const other = Object.keys(STAGES).filter(k=>k !== home)[0];
    stageSwitch(other, true);
    const overThere = HOUSE.lobby;
    stageSwitch(home, true);
    const backHere = HOUSE.lobby;
    if(outHere !== 0) throw new Error('the cue left this foyer at ' + outHere);
    if(overThere === 0)
      throw new Error('walking to ' + other + ' took ITS foyer out too — the swap is leaking');
    if(backHere !== 0)
      throw new Error('walking back found the foyer at ' + backHere + ', not out');
    HOUSE.lobby = 0.9;
    return 'out here (' + outHere + '), ' + other + ' still at ' + overThere +
           ', still out on return (' + backHere + ')';
  });

  /* ══ RULING CG — REVERSED IN PLACE ══════════════════════════════════════
     This demanded eight red blinders and a red sign ON GO, off his own act-one
     line: "The lights around the prosinum all turn red and all the lights on the
     beetlejuice sign go bright red."  He has watched it and moved both halves:

       "the red lights shouldnt come on as soon as you press go and the house
        light shouldnt go don when you press go.  They should both happen at time
        stamp 1:00 in the audio."

     So GO keeps only the half that was never in question — the transport — and
     the red moves to its own cue.  The audio clauses are untouched. */
  P('GO starts the show track at 0:35 and changes NO light (CG)', ()=>{
    showLoad('beetlejuice');
    const c = CUES.filter(x=>x.at === 35)[0];
    if(!c) throw new Error('there is no cue at 35s, which is where the show starts');
    if(!c.audio || c.audio.play !== 'act1' || c.audio.at !== 35)
      throw new Error('GO does not start the show track at 0:35');
    if(c.audio.stop !== 'preshow') throw new Error('GO does not stop the pre-show music');
    /* nothing red anywhere: not the arch, not the sign, not the frame */
    const lit = GROUPS.blind.filter(n=>c.lx[n-1].lvl > 0.02);
    if(lit.length) throw new Error(lit.length + ' blinders are still up at GO');
    if(c.signCol !== undefined)
      throw new Error('GO still speaks about the sign (' + c.signCol + ')');
    if(c.portal && /ff1e10|ff0000/i.test(String(c.portal.col)))
      throw new Error('GO still turns the proscenium red');
    /* and the house does NOT go out — it is one of the three moments at 15 */
    if(Math.abs(c.house - 0.15) > 0.001)
      throw new Error('GO takes the house to ' + c.house + ', and CG says it stays at 15');
    const stage = GROUPS.stage.filter(n=>c.lx[n-1].lvl > 0.02);
    if(stage.length) throw new Error(stage.length + ' stage channels are up behind a shut curtain');
    return 'track from 0:35, nothing red, house still at 0.15, the stage dark behind the cloth';
  });

  P('1:00 is where the red comes on and the house goes out (CG)', ()=>{
    showLoad('beetlejuice');
    const c = CUES.filter(x=>x.at === 60)[0];
    if(!c) throw new Error('there is no cue at 60s — "time stamp 1:00 in the audio"');
    if(Math.abs(c.house) > 0.001)
      throw new Error('the house is at ' + c.house + ' at 1:00, he asked for it to go down here');
    if(c.signCol !== '#ff1e10') throw new Error('1:00 does not turn the sign red');
    if(!c.portal) throw new Error('1:00 does not light the proscenium at all');
    const col = new THREE.Color(c.portal.col);
    if(!(col.r > 0.5 && col.g < 0.4 && col.b < 0.4))
      throw new Error('the proscenium is not red at 1:00: ' + col.getHexString());
    if(!(c.portal.lvl > 0.5)) throw new Error('the proscenium comes up to only ' + c.portal.lvl);
    /* "red at the start when the blinders WOULD HAVE BEEN red" — so the neon
       takes the moment and the eight blinders stay dark.  That is also what
       RULING BJ measured: the blinders outrank the movers, so red on the arch
       ate every real light in the room. */
    const arch = GROUPS.blind.filter(n=>c.lx[n-1].lvl > 0.02);
    if(arch.length) throw new Error(arch.length + ' blinders are red at 1:00 — the frame takes that now');
    /* it is 25 seconds after GO, and it is the first cue that darkens the house */
    const go = CUES.filter(x=>x.at === 35)[0];
    if(c.at - go.at !== 25) throw new Error('1:00 is ' + (c.at - go.at) + 's after GO');
    return 'red on the frame at 60s, house 0.15 -> 0, the arch dark';
  });

  /* ══ RULING CH — THE FRAME IS LIT AT FOUR MOMENTS AND OUT THE REST ══════
     "blue at pre show intermission and after the show ... red at the start ...
     and blue for the netherworld ... For the rest it is off."

     READ OFF THE MATERIAL, NOT OFF THE PLOT.  A version of this that walked
     CUES and checked the portal field would agree with itself whatever
     setPortal and updatePortal did — the shape TRAPS records for the RULING BM
     assertion that recomputed the beam formula.  So every cue is FIRED and the
     frame is run out through the real three-call frame, and what is measured is
     the emissive the renderer would actually see. */
  P('the proscenium frame is lit at exactly four kinds of moment (CH)', ()=>{
    showLoad('beetlejuice');
    const b = SHOW.bjPortal;
    if(!b) throw new Error('there is no portal frame registered');
    let clock = 0;
    const settle = ()=>{ for(let k = 0; k < 240; k++){
      clock += 1/60; updateFades(1/60); updateRig(1/60, clock); updateStorm(1/60); } };

    const lit = [];
    for(let i = 0; i < CUES.length; i++){
      fireCue(i); cancelFollow();
      settle();
      if(b.mat.emissiveIntensity > 0.05)
        lit.push({n:CUES[i].n, at:CUES[i].at, label:CUES[i].label,
                  hex:b.mat.emissive.getHexString(),
                  red:b.mat.emissive.r > 0.5 && b.mat.emissive.g < 0.4});
    }
    if(!lit.length) throw new Error('the frame never lights at all');

    /* the four moments, by what the cue IS rather than by its number.

       THE PRE-SHOW RUNS THROUGH GO.  RULING CG leaves GO holding the pre-show
       picture — house at 15, nothing red, the music the only thing that changed
       — so the frame stays blue for those twenty-five seconds and 1:00 is where
       it turns.  Both cues before the red count as the pre-show here. */
    const isPre  = c => /PRE-SHOW/.test(c.label) || /GO — the show track starts/.test(c.label);
    const isRed  = c => c.at === 60;
    const isIntv = c => /INTERVAL/.test(c.label);
    const isEnd  = c => c.at === 8100;
    const isAft  = c => /netherworld|1:39|1:39:22|1:39:41/.test(c.label) ||
                        CUES.filter(x=>x.n === c.n)[0].scene === 'afterlife';
    for(const L of lit){
      const c = CUES.filter(x=>x.n === L.n)[0];
      if(!(isPre(c) || isRed(c) || isIntv(c) || isEnd(c) || isAft(c)))
        throw new Error('the frame is lit on a cue that is none of his four: Q' +
                        L.n + ' ' + L.label);
    }
    /* each of the four really happens — a frame stuck off would pass the loop */
    for(const [nm, fn] of [['the pre-show', isPre], ['1:00', isRed],
                           ['the interval', isIntv], ['after the show', isEnd],
                           ['the netherworld', isAft]])
      if(!lit.some(L=>fn(CUES.filter(x=>x.n === L.n)[0])))
        throw new Error('the frame is never lit for ' + nm);

    /* and only 1:00 is RED; everything else he named is blue */
    for(const L of lit){
      const c = CUES.filter(x=>x.n === L.n)[0];
      if(isRed(c) && !L.red) throw new Error('1:00 lights the frame ' + L.hex + ', not red');
      if(!isRed(c) && L.red) throw new Error('Q' + L.n + ' lights the frame red: ' + L.hex);
    }
    /* THE DARK IS THE POINT.  Ninety-odd cues say nothing and the frame is out
       for all of them; if that number ever collapses the default has inverted. */
    const dark = CUES.length - lit.length;
    if(dark < CUES.length * 0.8)
      throw new Error('only ' + dark + ' of ' + CUES.length + ' cues leave the frame dark');
    return lit.length + ' cues light it, ' + dark + ' leave it out; red only at 1:00';
  });

  P('a cue that says nothing about the frame puts it OUT (CH)', ()=>{
    showLoad('beetlejuice');
    const b = SHOW.bjPortal;
    let clock = 0;
    const settle = n=>{ for(let k = 0; k < n; k++){
      clock += 1/60; updateFades(1/60); updateRig(1/60, clock); updateStorm(1/60); } };
    /* light it from a cue that asks */
    const on = CUES.findIndex(c=>c.portal && c.portal.lvl > 0.5);
    if(on < 0) throw new Error('no cue lights the frame — nothing to darken');
    fireCue(on); cancelFollow(); settle(240);
    if(!(b.mat.emissiveIntensity > 0.5))
      throw new Error('the frame did not come up: ' + b.mat.emissiveIntensity.toFixed(3));
    /* now a cue that carries no portal field at all */
    const off = CUES.findIndex(c=>!c.portal);
    if(off < 0) throw new Error('every cue carries a portal field — the default cannot be tested');
    fireCue(off); cancelFollow(); settle(240);
    if(b.mat.emissiveIntensity > 0.02)
      throw new Error('a cue that says nothing left the frame at ' +
                      b.mat.emissiveIntensity.toFixed(3) + ' — it must go out');
    return 'up to 1.00 on a cue that asks, out to 0.000 on the very next that does not';
  });

  /* ══ RULING CG — THE HOUSE IS AT 15 AT EXACTLY THREE MOMENTS ════════════ */
  P('the house sits at 15 at the start, the interval and the end, and nowhere else (CG)', ()=>{
    showLoad('beetlejuice');
    const up = CUES.filter(c=>c.house > 0.02);
    for(const c of up)
      if(Math.abs(c.house - 0.15) > 0.001)
        throw new Error('Q' + c.n + ' takes the house to ' + c.house + ', and CG says 15');
    /* which cues those are: the pre-show, GO (the house has not gone out yet),
       the interval and the final cue.  Named by what they are. */
    /* FIVE, not four, and an assertion is what found the fifth: act two's own GO
       sat at 0.5 — the tail of the interval, with the audience coming back in —
       and "the intermission" covers the whole of it, not just the cue that starts
       it. */
    const want = ['PRE-SHOW', 'GO — the show track starts', 'INTERVAL',
                  'GO — act two', '2:15:00'];
    for(const w of want)
      if(!up.some(c=>c.label.indexOf(w) >= 0))
        throw new Error('the house is not at 15 for ' + w);
    if(up.length !== want.length)
      throw new Error('the house is up on ' + up.length + ' cues, and CG names ' + want.length);
    /* and it goes OUT at 1:00 and stays out through the act */
    const red = CUES.filter(c=>c.at === 60)[0];
    if(red.house > 0.001) throw new Error('1:00 does not take the house out');
    return up.length + ' cues at 0.15 (' + up.map(c=>c.n).join(', ') + '), 0 everywhere else';
  });

  /* ══ RULING CH — THE BLINDERS MOVED INSIDE IT ═══════════════════════════ */
  P('the blinders sit INSIDE the neon frame, and downstage of it (CH)', ()=>{
    showLoad('beetlejuice');
    const f = byName('bj:portalFrame');
    if(!f) throw new Error('no portal frame');
    const fb = box(f);
    let outside = 0, behind = 0;
    GROUPS.blind.forEach(n=>{
      const p = chan(n).pos;
      if(Math.abs(p.x) > Math.abs(fb.max.x) || p.y > fb.max.y || p.y < fb.min.y) outside++;
      if(p.z <= fb.max.z) behind++;
    });
    if(outside) throw new Error(outside + ' of 8 blinders are outside the neon rectangle');
    if(behind) throw new Error(behind + ' of 8 blinders are upstage of the frame they should sit in front of');
    /* and the 1:16 white flash still has the shut curtain behind it to read on */
    const curt = frontCurtainLineset();
    if(curt && chan(GROUPS.blind[0]).pos.z <= curt.z)
      throw new Error('the blinders are upstage of the house curtain at z=' + curt.z);
    return '8 blinders inside a ' + (fb.max.x*2).toFixed(2) + ' x ' + fb.max.y.toFixed(2) +
           ' frame, all of them downstage of it at z=' + chan(GROUPS.blind[0]).pos.z;
  });

  /* "make sure the beetljuice sign still stays lit up red" — which is a
     statement about the cues in BETWEEN saying nothing about it. */
  P('the sign keeps its red without being told again, and gets its own back at the end', ()=>{
    showLoad('beetlejuice');
    [63, 65, 66, 69, 76, 77, 86].forEach(t=>{
      const c = CUES.filter(x=>x.at === t)[0];
      if(!c) throw new Error('no cue at ' + t + 's');
      if(c.signCol !== undefined)
        throw new Error('the cue at ' + t + 's restates the sign colour instead of leaving it alone');
    });
    const blue = CUES.filter(x=>x.at === 88)[0];
    if(blue.signCol !== null) throw new Error('the sign never gets its own colour back');
    if(!SHOW.signLamps || !SHOW.signLamps.length) throw new Error('the sign registered no lamps');
    setSignLamps('#ff1e10');
    const lit = SHOW.signLamps[0].mat.color.getHexString();
    setSignLamps(null);
    const back = SHOW.signLamps[0].mat.color.getHexString();
    if(lit === back) throw new Error('setSignLamps changed nothing on the lamp material');
    return 'red ' + lit + ', restored ' + back;
  });

  P('the two purple sweeps are there, and each goes dark after itself', ()=>{
    showLoad('beetlejuice');
    [[63, 65], [66, 69]].forEach(pair=>{
      const up = CUES.filter(x=>x.at === pair[0])[0], out = CUES.filter(x=>x.at === pair[1])[0];
      if(!up || !out) throw new Error('the sweep at ' + pair[0] + 's is not a pair');
      if(!up.fx || up.fx.kind !== 'sweep') throw new Error(pair[0] + 's does not sweep');
      if(out.fx) throw new Error(pair[1] + 's leaves the sweep running');
      const lit = GROUPS.aud.filter(n=>out.lx[n-1].lvl > 0.01);
      if(lit.length) throw new Error(lit.length + ' audience movers are still up at ' + pair[1] + 's');
    });
    return 'up at 1:03 and 1:06, dark at 1:05 and 1:09';
  });

  /* RULING BJ.  The arch is out for both sweeps and for both blackouts after
     them, and the red the owner asked to keep is the SIGN.  The mechanical
     half of why: the blinders outrank the movers, so eight red lamps took all
     eight real lights and the purple rendered on none. */
  /* RULING BM.  "make it so in pre show and the start of show light stuff you
     can see the actual beams better."  Pinned to the quantity the SHADER
     actually reads, not to the plotted number — a beam's opacity is
     uHaze = 0.25 + hazeNow()*1.15, so asserting on the plotted haze alone
     would pass a build where the shader had stopped reading it. */
  P('RULING BM: the top of the show draws beams as strongly as mid-show does', ()=>{
    showLoad('beetlejuice');
    /* READ THE UNIFORM THE SHADER IS ACTUALLY GIVEN, not a copy of its formula.
       The first version of this test recomputed 0.25 + haze*1.15 itself, and a
       negative check that replaced the whole uHaze line with a constant sailed
       straight through it — a test that reimplements the thing it is testing
       agrees with itself no matter what the code does.  Fire the cue, run a
       frame, ask a beam how bright it is. */
    const beamOf = idx => {
      fireCue(idx); cancelFollow();
      updateRig(1/60, 0);
      return chan(34).beam.material.uniforms.uHaze.value;
    };
    /* what a beam is worth once the show is properly running */
    const midIdx = CUES.map((c,i)=>[c,i]).filter(p=>p[0].at >= 88 && p[0].at < 4269);
    const midAvg = midIdx.map(p=>beamOf(p[1])).reduce((a,b)=>a+b, 0)/midIdx.length;
    /* every cue from the pre-show to the graveyard: the stretch he named, and
       the one stretch with no stage picture in it at all */
    const top = CUES.map((c,i)=>[c,i]).filter(p=>p[0].at !== undefined && p[0].at <= 88);
    if(top.length < 9) throw new Error('only found ' + top.length + ' cues at the top of the show');
    let worst = null, worstU = 99;
    for(const p of top){ const u = beamOf(p[1]); if(u < worstU){ worstU = u; worst = p[0]; } }
    const ratio = worstU/midAvg;
    /* it was 0.42 against a mid-show 0.94 — 45% — and the pre-show, the one
       cue that is nothing but beams for minutes on end, was the worst of them */
    if(ratio < 0.85)
      throw new Error('the faintest beam at the top of the show is ' +
                      Math.round(ratio*100) + '% of a mid-show beam (Q' + worst.n +
                      ', haze ' + worst.haze + ', uHaze ' + worstU.toFixed(2) + ')');
    /* and the shader has to be the thing reading it: a build that ignores the
       plotted haze reports the same uHaze for the pre-show and the graveyard */
    if(Math.abs(beamOf(CUES.findIndex(c=>c.n === 0.5)) - midAvg) < 1e-6)
      throw new Error('every cue draws beams identically — the shader is not reading the plot');
    /* and the pre-show in particular, by name, because that is where he sits */
    const pre = CUES.filter(c=>c.n === 0.5)[0];
    const preU = beamOf(CUES.findIndex(c=>c.n === 0.5));
    if(!(preU >= 0.75))
      throw new Error('the pre-show draws beams at ' + preU.toFixed(2) + ' (was 0.42)');
    /* the house must not be brighter than the effect running in it: 0.45 put
       ~2.0-2.4 on a seat against the audience rig's ~1.0 peak */
    if(!(pre.house <= 0.35))
      throw new Error('the pre-show house is ' + pre.house + ' — it washes the beams out');
    if(!(pre.house > 0))
      throw new Error('the pre-show house went out entirely; he asked for low, not off');
    return 'faintest top-of-show beam ' + worstU.toFixed(2) + ' = ' + Math.round(ratio*100) + '% of mid-show (was 45%), ' +
           'pre-show house ' + pre.house;
  });

  /* ---- RULING BO: a cue you jump to takes the music with it ---- */

  /* the show, running with sound, at the top.  jsdom never fetches media so
     readyState stays 0 and audLive is false for ever — which is exactly the
     silent-fallback path, and why every assertion below reads the INTENT
     (want/seek) the pump would act on rather than a currentTime. */
  const runningShow = ()=>{
    showLoad('beetlejuice');
    fireCue(CUES.findIndex(c=>c.n === 1)); cancelFollow();   // GO: asks for act1 at 35
    if(!AUD.tracks.act1 || !AUD.tracks.act1.want)
      throw new Error('the GO cue did not ask for act one');
    AUD.tracks.act1.seek = null;                             // clear it so a new seek shows
    return AUD.tracks;
  };
  const idxAt = t => CUES.findIndex(c=>c.at === t);

  P('RULING BO: skipping forward inside act one seeks the track', ()=>{
    const tr = runningShow();
    const i = CUES.map((c,k)=>[c,k]).filter(p=>p[0].at > 2000 && p[0].at < 4000 && !p[0].audio)[0];
    if(!i) throw new Error('no plain act-one cue to jump to');
    cueFiredByHand(i[1]);
    if(tr.act1.seek === null || tr.act1.seek === undefined)
      throw new Error('the jump left the music where it was');
    /* act one begins at 0, so the seek IS his timestamp */
    if(Math.abs(tr.act1.seek - i[0].at) > 1e-6)
      throw new Error('seeked to ' + tr.act1.seek + ', wanted ' + i[0].at);
    return 'Q' + i[0].n + ' at ' + i[0].at + 's seeks act one to ' + tr.act1.seek;
  });

  P('RULING BO: skipping into act two changes FILE, and asks for his number', ()=>{
    const tr = runningShow();
    const c = CUES.filter(x=>x.at > 5000 && !x.audio)[0];
    if(!c) throw new Error('no plain act-two cue to jump to');
    cueFiredByHand(CUES.indexOf(c));
    if(tr.act1.want) throw new Error('act one is still wanted after jumping into act two');
    if(!tr.act2 || !tr.act2.want) throw new Error('act two was not asked for');
    /* RULING BI: the plot never learns about the split.  His number goes in, and
       the position INSIDE the second file comes out. */
    if(Math.abs(tr.act2.seek - (c.at - 4292)) > 1e-6)
      throw new Error('act two seeked to ' + tr.act2.seek + ', wanted ' + (c.at - 4292));
    return 'Q' + c.n + ' at ' + c.at + 's = ' + tr.act2.seek.toFixed(1) + 's into act two';
  });

  P('RULING BO: going BACK takes the music back too', ()=>{
    const tr = runningShow();
    const i = CUES.map((c,k)=>[c,k]).filter(p=>p[0].at > 3000 && p[0].at < 4000 && !p[0].audio)[0];
    cueFiredByHand(i[1]);
    tr.act1.seek = null;
    nextCue = i[1] + 1;
    goBack();
    if(tr.act1.seek === null)
      throw new Error('BACK moved the lights and left the music running forward');
    if(!(tr.act1.seek < i[0].at))
      throw new Error('BACK seeked to ' + tr.act1.seek + ', which is not before ' + i[0].at);
    return 'back from ' + i[0].at + 's to ' + tr.act1.seek + 's';
  });

  /* THE ONE THAT KEEPS IT OUT OF THE FEEDBACK LOOP.  showAudioTick calls
     fireCue; if the seek lived in there, every transport-fired cue would drag
     the track to its own timestamp on every frame. */
  P('RULING BO: the transport firing a cue does NOT seek — only a person does', ()=>{
    const tr = runningShow();
    const c = CUES.filter(x=>x.at > 2000 && x.at < 4000 && !x.audio)[0];
    fireCue(CUES.indexOf(c));            // the transport's path, not the operator's
    if(tr.act1.seek !== null && tr.act1.seek !== undefined)
      throw new Error('fireCue seeked to ' + tr.act1.seek + ' — the transport would feed itself');
    return 'fireCue moved nothing; cueFiredByHand is the only door';
  });

  P('RULING BO: a cue that names its own track is left alone', ()=>{
    const tr = runningShow();
    /* the interval: it deliberately STOPS act one and starts the pre-show
       music underneath, and a seek here would resume the show under it */
    const iv = CUES.filter(c=>c.audio && c.audio.play === 'preshow' && c.at > 4000)[0];
    if(!iv) throw new Error('the interval cue is not there');
    cueFiredByHand(CUES.indexOf(iv));
    if(AUD.tracks.act1.want) throw new Error('the interval left act one running');
    if(AUD.tracks.act2 && AUD.tracks.act2.want)
      throw new Error('the interval started act two — the seek overrode the cue');
    if(!AUD.tracks.preshow.want) throw new Error('the interval did not bring the pre-show music back');
    return 'the interval keeps its own words: act one stopped, pre-show music up';
  });

  /* AND THE GUARD ITSELF, ASKED DIRECTLY.  The test above passes with the
     guard REMOVED, which makes it a weak test of this particular rule: the
     interval cue stops act one before the seek is ever reached, so by then
     there is no running show to move and it declines for the other reason.
     The guard is still right — it is what stops a reordering, or a future cue
     whose audio.at differs from its at, from being quietly overruled — so
     prove it the only way that distinguishes it: call it on a cue that names
     a track WHILE the show is running, and require a refusal. */
  P('RULING BO: a cue naming its own track refuses the seek outright', ()=>{
    runningShow();
    const named = CUES.map((c,i)=>[c,i]).filter(p=>p[0].audio && p[0].audio.play);
    if(named.length < 3) throw new Error('only ' + named.length + ' cues name a track');
    for(const p of named){
      if(!audShowRunning())
        throw new Error('the show stopped running before Q' + p[0].n + ' could be tested');
      if(showCueSeek(p[1]) !== false)
        throw new Error('Q' + p[0].n + ' carries its own audio and the seek overrode it');
    }
    return named.length + ' cues name a track; every one refuses the jump seek';
  });

  P('RULING BO: a silent show is not started by a jump', ()=>{
    showLoad('beetlejuice');
    showSoundStop();
    Object.keys(AUD.tracks).forEach(k=>{ AUD.tracks[k].want = false; AUD.tracks[k].seek = null; });
    const c = CUES.filter(x=>x.at > 2000 && x.at < 4000 && !x.audio)[0];
    cueFiredByHand(CUES.indexOf(c));
    /* go() is what the FOLLOW chain calls when no audio is driving.  A silent
       run that suddenly started playing act one halfway through would be a
       far worse bug than the one this ruling fixes. */
    if(AUD.tracks.act1 && AUD.tracks.act1.want)
      throw new Error('a jump started act one on a show that was running silent');
    return 'nothing playing, nothing started';
  });

  P('RULING BO: a show with no timecode is untouched by any of this', ()=>{
    showLoad('outsiders');
    if(CUES.some(c=>c.at !== undefined && c.at !== null))
      throw new Error('THE OUTSIDERS has timecode now — pick another show');
    for(let i = 0; i < Math.min(5, CUES.length); i++)
      if(showCueSeek(i) !== false)
        throw new Error('cue ' + i + ' of a show with no timecode tried to seek');
    showLoad('beetlejuice');
    return 'four other productions unaffected, as they must be';
  });

  P('RULING BO: audTrackFor puts every one of his timestamps in the right file', ()=>{
    const want = {0:'act1', 35:'act1', 4291:'act1', 4292:'act2', 8100:'act2'};
    for(const k in want)
      if(audTrackFor(+k) !== want[k])
        throw new Error(k + 's routed to ' + audTrackFor(+k) + ', wanted ' + want[k]);
    /* every cue in the plot lands in a file that exists */
    const orphan = CUES.filter(c=>c.at !== undefined && c.at !== null && !audTrackFor(c.at));
    if(orphan.length) throw new Error(orphan.length + ' cues fall outside both halves');
    return 'the cut at 4292 splits them exactly, 94 cues all placed';
  });

  /* ---- RULING BN: a cue is labelled by where it falls in the show ---- */

  P('RULING BN: the timestamp is written the way he writes it', ()=>{
    const t = at => cueTimeText({at});
    const want = {33:'0:33', 63:'1:03', 585:'9:45', 4262:'1:11:02', 8092:'2:14:52'};
    for(const k in want)
      if(t(+k) !== want[k])
        throw new Error(k + 's rendered as ' + t(+k) + ', wanted ' + want[k]);
    /* and a cue with no place in a show says nothing, so the caller keeps the
       fade — four of five productions, and every cue recorded off the board */
    if(cueTimeText({}) !== null) throw new Error('a cue with no timecode invented a timestamp');
    if(cueTimeText({at:null}) !== null) throw new Error('a null timecode invented a timestamp');
    if(cueTimeText(null) !== null) throw new Error('cueTimeText(null) threw or answered');
    return Object.keys(want).map(k=>k+'s = '+want[k]).join(', ');
  });

  /* THROUGH THE DOM, not the model — a detached row fires its handler
     perfectly well, and this is a test about what the operator READS */
  P('RULING BN: every Beetlejuice row shows its place in the show, not its fade', ()=>{
    showLoad('beetlejuice');
    refreshCues();
    const rows = document.querySelectorAll('#cuelist .cue');
    if(rows.length !== CUES.length)
      throw new Error(rows.length + ' rows drawn for ' + CUES.length + ' cues');
    let checked = 0;
    for(let i = 0; i < rows.length; i++){
      const meta = rows[i].querySelector('.mt');
      if(!meta) throw new Error('row ' + i + ' has no meta cell');
      const txt = meta.textContent, want = cueTimeText(CUES[i]);
      if(!want) throw new Error('Beetlejuice cue ' + CUES[i].n + ' has no timecode');
      if(txt.indexOf(want) !== 0)
        throw new Error('Q' + CUES[i].n + ' reads "' + txt + '", wanted it to open with ' + want);
      /* the fade must be GONE, which is the actual ask — "not by how long it
         is".  Only checked where the fade could not be mistaken for a time. */
      if(CUES[i].fade > 0 && txt.indexOf(CUES[i].fade + 's') >= 0)
        throw new Error('Q' + CUES[i].n + ' still shows its ' + CUES[i].fade + 's fade');
      checked++;
    }
    return checked + ' rows, every one labelled by its timestamp';
  });

  P('RULING BN: a show with no timecode keeps its fades', ()=>{
    showLoad('outsiders');
    refreshCues();
    if(CUES.some(c=>c.at !== undefined && c.at !== null))
      throw new Error('THE OUTSIDERS has timecoded cues now — pick another show for this test');
    const rows = document.querySelectorAll('#cuelist .cue');
    if(!rows.length) throw new Error('no rows drawn');
    for(let i = 0; i < rows.length; i++){
      const txt = rows[i].querySelector('.mt').textContent;
      if(txt.indexOf(CUES[i].fade + 's') !== 0)
        throw new Error('row ' + i + ' reads "' + txt + '", wanted the fade ' + CUES[i].fade + 's');
    }
    showLoad('beetlejuice');
    return rows.length + ' rows still showing fades, as they must';
  });

  P('RULING BJ: the arch is dark through both sweeps and both blackouts', ()=>{
    showLoad('beetlejuice');
    const cue = t => CUES.filter(x=>x.at === t)[0];
    [63, 65, 66, 69].forEach(t=>{
      const c = cue(t);
      if(!c) throw new Error('no cue at ' + t + 's');
      const up = GROUPS.blind.filter(n=>c.lx[n-1].lvl > 0.01);
      if(up.length)
        throw new Error(up.length + ' blinders are still lit at ' + t + 's (RULING BJ takes the arch out)');
    });
    /* THE RED HALF OF THIS IS GONE, AND RULING CH IS WHY.  It used to demand the
       arch still be red at GO — the thing BJ was scoped NOT to take — and "red at
       the start when the blinders WOULD HAVE BEEN red" takes exactly that off
       them and gives it to the proscenium frame.  So BJ's remaining job is the
       one that was always its own: the sweeps and blackouts are dark, and the
       1:16 white flash it must NOT have eaten is still there.  A blinder lit
       anywhere at the top of the show now would be the regression. */
    const flash = cue(76);
    if(!GROUPS.blind.some(n=>flash.lx[n-1].lvl > 0.9))
      throw new Error('BJ went too far: the 1:16 white flash is gone');
    for(const t of [35, 60]){
      const c = cue(t);
      if(c && GROUPS.blind.some(n=>c.lx[n-1].lvl > 0.02))
        throw new Error('a blinder is lit at ' + t + 's — CH moved that red onto the frame');
    }
    /* the sign is what stays red, and it stays red by saying nothing */
    [63, 65, 66, 69].forEach(t=>{
      if(cue(t).signCol !== undefined)
        throw new Error(t + 's speaks about the sign; it must leave it alone so it stays red');
    });
    return 'arch out at 1:03/1:05/1:06/1:09 and at GO and 1:00, white at 1:16, sign untouched';
  });

  /* RULING BK — and this is the assertion that pins the owner's actual
     complaint.  "i still cant see the purple sweeps when im on the balcony":
     a balcony head sits ABOVE the lens, and the sweep used to run downward
     into the stalls, so no part of it could ever arrive. */
  P('RULING BK: a sweep starts on the stalls and finishes ABOVE the balcony', ()=>{
    showLoad('beetlejuice');
    const idx = CUES.findIndex(c=>c.at === 63);
    fireCue(idx); cancelFollow();
    /* the first frame: pointing DOWN, hard, at the stalls floor */
    audFxStep(1/60); updateRig(1/60, 0);
    const start = GROUPS.aud.map(n=>chan(n)._dir.y);
    if(start.some(y=>y > -0.9))
      throw new Error('a sweep does not begin aimed at the stalls (worst dir.y ' +
                      Math.max.apply(null, start).toFixed(3) + ', wanted below -0.9)');
    /* run it out: every mover must finish pointing ABOVE horizontal */
    for(let i = 0; i < 200; i++){ audFxStep(1/60); updateRig(1/60, i/60); }
    const end = GROUPS.aud.map(n=>chan(n)._dir.y);
    if(end.some(y=>y <= 0))
      throw new Error('a sweep finishes below horizontal (worst dir.y ' +
                      Math.min.apply(null, end).toFixed(3) + ') — it is sweeping DOWN');
    return 'starts at dir.y ' + start[0].toFixed(2) + ', ends at ' + end[0].toFixed(2);
  });

  /* the balcony, measured the way the probe measures it — the only assertion
     in this file that answers the complaint rather than the mechanism */
  P('RULING BK: purple really lands on a balcony head, flat and in a headset', ()=>{
    showLoad('beetlejuice');
    /* A ROW OF HEADS ACROSS THE BACK HALF OF THE BALCONY, not one chair.  A
       sweep writes tilt and never pan, so pan is wherever the pre-show drift
       left it (+/-34 deg) — which chair is dead centre of a beam is a phase
       accident, and asking about one chair measures the phase.  The question
       is whether the purple gets to the balcony at all. */
    const ROW = [[-6.5, 26], [-3, 24], [0, 26], [3, 28], [6.5, 26]];
    const smooth = (a,b,x)=>{ const t = Math.min(1, Math.max(0, (x-a)/(b-a))); return t*t*(3-2*t); };
    /* the brightest head in the row, this frame, counting ONLY light that came
       out of an audience mover — the colour he asked about, not the total */
    const purpleAt = ()=>{
      let best = 0;
      for(const seat of ROW){
        let s = 0;
        for(const l of LIGHT_POOL){
          if(l.intensity <= 0) continue;
          const f = FIXTURES.filter(q=>q._live && q._org.distanceTo(l.position) < 0.01)[0];
          if(!f || !f.audience || f.type !== 'mover') continue;
          const d = new THREE.Vector3(seat[0], balcFloorY(seat[1]) + 1.15, seat[1]).sub(l.position);
          const dist = d.length();
          if(l.distance > 0 && dist > l.distance) continue;
          const axis = l.target.position.clone().sub(l.position).normalize();
          const cone = smooth(Math.cos(l.angle), Math.cos(l.angle*(1-l.penumbra)),
                              d.clone().normalize().dot(axis));
          if(cone > 0) s += l.intensity * cone * Math.max(0, 1 - dist/l.distance);
        }
        if(s > best) best = s;
      }
      return best;
    };
    const run = ()=>{
      /* RUN IT THE WAY THE SHOW RUNS IT.  A sweep writes tilt and deliberately
         never touches pan, so pan is wherever the last effect left it — and in
         the show that is the pre-show drift.  Setting pan to 0 by hand is NOT
         the home position either: a mover's group is built already turned
         toward its rigged focus, so pan 0 is "as hung", not "straight ahead".
         Two seconds of the real drift first, and the state is the real state. */
      fireCue(CUES.findIndex(c=>c.n === 0.5)); cancelFollow();
      for(let i = 0; i < 120; i++){ audFxStep(1/60); updateRig(1/60, i/60); }
      const idx = CUES.findIndex(c=>c.at === 63);
      fireCue(idx); cancelFollow();
      let hit = 0, peak = 0, live = 0;
      for(let i = 0; i < 150; i++){
        audFxStep(1/60); updateRig(1/60, i/60);
        live = Math.max(live, GROUPS.aud.filter(n=>chan(n)._live).length);
        const v = purpleAt();
        if(v > peak) peak = v;
        if(v > 0.05) hit++;
      }
      return {peak, share: hit/150, live};
    };
    const flat = run();
    const wasActive = VR.active, wasCap = VR.lightCap;
    VR.active = true; VR.lightCap = 4;
    const vr = run();
    VR.active = wasActive; VR.lightCap = wasCap;
    /* it was a FLAT ZERO before this round, on every balcony row, both flat
       and in a headset — the blinders held all eight (all four) real lights */
    if(!(flat.peak > 0.5))
      throw new Error('the balcony gets ' + flat.peak.toFixed(3) + ' of purple flat');
    if(!(vr.peak > 0.5))
      throw new Error('the balcony gets ' + vr.peak.toFixed(3) + ' of purple in a headset');
    if(!(flat.share > 0.25))
      throw new Error('the balcony is in the purple only ' +
                      Math.round(flat.share*100) + '% of the sweep');
    return 'flat peak ' + flat.peak.toFixed(2) + ' for ' + Math.round(flat.share*100) +
           '% of it; headset peak ' + vr.peak.toFixed(2);
  });

  /* the pre-show drift has the same job and the same failure mode: its tilt
     used to live 4..52 deg BELOW horizontal, which is the stalls and nothing
     else, and its pan threw a third of the effect through the side wall */
  /* THE FIRST VERSION OF THIS COUNTED FRAMES WITH dir.y > 0.02 AND WAS WEAK —
     it survived the old -62 +/- 24 range untouched.  A mover's group is built
     already turned toward its rigged focus, so panning a tilted yoke moves
     dir.y all by itself, and "some frame pointed slightly up" happens whatever
     the tilt range is.  What the owner asked about is whether the drift ARRIVES
     somewhere, so measure arrival: does it put light on a balcony head, and
     does it still come down into the stalls. */
  P('RULING BK: the pre-show drift reaches the balcony AND still works the stalls', ()=>{
    showLoad('beetlejuice');
    fireCue(CUES.findIndex(c=>c.n === 0.5)); cancelFollow();
    const smooth = (a,b,x)=>{ const t = Math.min(1, Math.max(0, (x-a)/(b-a))); return t*t*(3-2*t); };
    const litAt = seats=>{
      let best = 0;
      for(const seat of seats){
        let s = 0;
        for(const l of LIGHT_POOL){
          if(l.intensity <= 0) continue;
          const f = FIXTURES.filter(q=>q._live && q._org.distanceTo(l.position) < 0.01)[0];
          if(!f || !f.audience) continue;
          const d = new THREE.Vector3(seat[0], seat[1], seat[2]).sub(l.position);
          const dist = d.length();
          if(dist > l.distance) continue;
          const axis = l.target.position.clone().sub(l.position).normalize();
          const cone = smooth(Math.cos(l.angle), Math.cos(l.angle*(1-l.penumbra)),
                              d.clone().normalize().dot(axis));
          if(cone > 0) s += l.intensity * cone * Math.max(0, 1 - dist/l.distance);
        }
        if(s > best) best = s;
      }
      return best;
    };
    const balc   = [-6.5, -3, 0, 3, 6.5].map(x=>[x, balcFloorY(26) + 1.15, 26]);
    const stalls = [-6.5, 0, 6.5].map(x=>[x, houseFloorY(16) + 1.15, 16]);
    let onBalc = 0, onStalls = 0, outOfRoom = 0;
    const N = 800;
    for(let i = 0; i < N; i++){
      audFxStep(1/20); updateRig(1/20, i/20);
      if(litAt(balc)   > 0.05) onBalc++;
      if(litAt(stalls) > 0.05) onStalls++;
      for(const n of GROUPS.aud){
        const f = chan(n);
        if(f._dir.z > 0.05){        // where the axis crosses the back of the house
          const t = (D.houseBack - f._org.z)/f._dir.z;
          if(t > 0 && Math.abs(f._org.x + f._dir.x*t) > D.houseW/2) outOfRoom++;
        }
      }
    }
    /* it was 7% of a 40-second cycle at the back of the balcony before this
       round — three seconds in forty, which is what "i cant see it" looks like */
    if(onBalc < N*0.15)
      throw new Error('the balcony is in the drift only ' + Math.round(100*onBalc/N) +
                      '% of a cycle — the owner will not see it');
    /* AND THE STALLS ARE WHAT THE TILT RANGE IS FOR, which took a negative
       check to learn: narrowing the PAN from +/-62 to +/-34 is what put the
       drift on the balcony (56% either way, because the old pan was spraying
       a third of the effect through the side wall rather than round the
       house), and widening the TILT from -62+/-24 to -55+/-42 is what keeps
       the stalls in it while it does — 20% of a cycle against 80%.  Two
       changes, two different jobs, and the first draft of this test credited
       the wrong one. */
    if(onStalls < N*0.50)
      throw new Error('reaching the balcony cost the stalls: only ' +
                      Math.round(100*onStalls/N) + '% of a cycle');
    if(outOfRoom > N*GROUPS.aud.length*0.10)
      throw new Error(outOfRoom + ' frame-fixtures of the drift are aimed outside the auditorium');
    return 'balcony ' + Math.round(100*onBalc/N) + '% of a cycle, stalls ' +
           Math.round(100*onStalls/N) + '%, out of the room ' + outOfRoom;
  });

  P('1:16 sends the curtain and the sign out under a white flash, and 1:26 finds them gone', ()=>{
    showLoad('beetlejuice');
    const ls = frontCurtainLineset();
    const trg = c => c.fly.filter(x=>x.id === ls.id)[0].target;
    const a = CUES.filter(x=>x.at === 76)[0], mid = CUES.filter(x=>x.at === 77)[0],
          b = CUES.filter(x=>x.at === 86)[0];
    if(!a || !mid || !b) throw new Error('the 1:16, 1:17 and 1:26 beats are not all there');
    if(!a.move || a.move.scene !== 'bjSign') throw new Error('1:16 does not send the sign out');
    if(!(trg(a) > OUT_TRIM - 1)) throw new Error('1:16 does not take the curtain out');
    if(!(trg(b) > OUT_TRIM - 1)) throw new Error('the curtain came back in by 1:26');
    if(!a.fx || a.fx.kind !== 'flash') throw new Error('1:16 is not a flash');
    if(!b.fx || b.fx.kind !== 'flash') throw new Error('1:26 is not a flash');
    if(!mid.fx || mid.fx.kind !== 'random') throw new Error('nothing runs the fast pattern between them');
    if(b.at - a.at !== 10) throw new Error('the two flashes are not ten seconds apart');
    /* and the flash is not a blackout dressed up as one: the cue state itself
       has the blinders up, so the moment reads even if the effect never steps */
    const up = GROUPS.blind.filter(n=>a.lx[n-1].lvl > 0.9);
    if(up.length !== 8) throw new Error('only ' + up.length + ' blinders are up in the flash cue itself');
    return 'curtain and sign out at 1:16, flash, pattern, flash, gone by 1:26';
  });

  /* ====================================================================== *
     ACT ONE, AS HE WROTE IT

     His act one.txt is the authority.  The point of these is that the next
     round can diff his file against the plot in one command instead of by eye.
     ====================================================================== */
  console.log('--- act one, off his own cue sheet ---');

  P('every timestamp in his act one is a cue at that second', ()=>{
    showLoad('beetlejuice');
    /* every line of act one.txt that carries a clock, converted: 3:30, 3:40,
       5:26, 9:01, 15:51, 15:56, 18:53, 20:27, 20:41, 21:51, 22:57, 23:42,
       30:00, 32:47, 32:59, 37:30, 38:27, 39:07, 55:54, 57:08, 1:02:49,
       1:03:00, 1:07:13, 1:09:33, 1:10:09, 1:10:16, 1:11:02, 1:11:09 */
    const his = [210, 220, 326, 541, 951, 956, 1133, 1227, 1241, 1311, 1377,
                 1422, 1800, 1967, 1979, 2250, 2307, 2347, 3354, 3428, 3769,
                 3780, 4033, 4173, 4209, 4216, 4262, 4269];
    const missing = his.filter(t=>!CUES.some(c=>c.at === t));
    if(missing.length)
      throw new Error(missing.length + ' of his times have no cue: ' + missing.join(', '));
    /* and his SET times are all still exactly where his set list puts them */
    const sets = [585, 638, 1936, 1970, 2554, 2929, 3120, 3355, 3771, 4262];
    const lostSets = sets.filter(t=>!CUES.some(c=>c.at === t));
    if(lostSets.length)
      throw new Error('a set change moved off its timestamp: ' + lostSets.join(', '));
    return his.length + ' light cues and ' + sets.length + ' set cues, all on his seconds';
  });

  /* "snap" and "fade" are instructions about TIME, and he uses both words
     deliberately — four snaps in act one and they must not have fade times. */
  P('the cues he calls snaps have no fade, and the ones he times keep his number', ()=>{
    showLoad('beetlejuice');
    const at = t => CUES.filter(c=>c.at === t)[0];
    [[2307, '38:27 snap back to light brown'], [2347, '39:07 snap to white'],
     [4173, '1:09:33 snap to green'], [3769, '1:02:49 snap black'],
     [541, '9:01 flash bright']].forEach(pair=>{
      const c = at(pair[0]);
      if(c.fade !== 0) throw new Error(pair[1] + ' has a ' + c.fade + 's fade on it');
    });
    /* "30:00 lights start slowly fading ... and by 30:30" — thirty seconds,
       his own arithmetic, and the longest fade in the show */
    if(at(1800).fade !== 30)
      throw new Error('the 30:00 fade is ' + at(1800).fade + 's, he wrote thirty');
    /* "22:57 ... and by 23:00 they are fully green and blue" — three */
    if(at(1377).fade !== 3)
      throw new Error('the 22:57 fade is ' + at(1377).fade + 's, he wrote three');
    return 'five snaps at 0s, the long fade at 30s, the 22:57 fade at 3s';
  });

  /* Both of his mid-act set changes are covered: he snaps to black FIRST and
     the scenery moves inside it.  That is RULING AY read off his own sheet. */
  P('his two blackouts cover the set changes that follow them', ()=>{
    showLoad('beetlejuice');
    const at = t => CUES.filter(c=>c.at === t)[0];
    [[1967, 1970, 'the attic'], [3769, 3771, 'the Deetz house']].forEach(trio=>{
      const dark = at(trio[0]), change = at(trio[1]);
      const lit = dark.lx.filter(r=>r.lvl > 0.02);
      if(lit.length)
        throw new Error('the cover before ' + trio[2] + ' is not dark: ' +
                        lit.length + ' channels up');
      const stillLit = change.lx.filter(r=>r.lvl > 0.02);
      if(stillLit.length)
        throw new Error(trio[2] + ' comes on into ' + stillLit.length + ' lit channels');
      if(change.at - dark.at > 3)
        throw new Error(trio[2] + ' waits ' + (change.at - dark.at) + 's after the blackout');
    });
    return 'black at 32:47 then the attic at 32:50; black at 1:02:49 then the house at 1:02:51';
  });

  /* A cue that forgets to state its backdrop does not leave it alone — the
     plotter reads the backdrop field on EVERY cue and flies the cloth OUT when
     it is missing.  So an omission is a cloth sailing up mid-scene, silently. */
  P('every act one cue states where the backdrop is', ()=>{
    showLoad('beetlejuice');
    const ls = FLY[13];
    const act1 = CUES.filter(c=>c.at >= 88 && c.at <= 4269);
    /* his set list: the graveyard cloth is IN to 10:40, OUT to 32:50, IN to
       1:02:51, OUT to the act break */
    const wantIn = t => (t < 638) || (t >= 1970 && t < 3771);
    const wrong = act1.filter(c=>{
      const trg = c.fly.filter(x=>x.id === ls.id)[0].target;
      const isIn = trg < OUT_TRIM - 1;
      return isIn !== wantIn(c.at);
    });
    if(wrong.length)
      throw new Error(wrong.length + ' cues have the backdrop on the wrong side: ' +
                      wrong.map(c=>c.at).join(', '));
    return act1.length + ' act one cues, the cloth in and out exactly as his set list says';
  });

  /* After the opening he never mentions the audience rig again, so it stays
     dark for the whole act — including through his "all lights" cues, which
     mean the stage. */
  P('the audience rig stays dark through act one', ()=>{
    showLoad('beetlejuice');
    const act1 = CUES.filter(c=>c.at >= 88 && c.at <= 4269);
    const lit = [];
    act1.forEach(c=>{
      GROUPS.house.forEach(n=>{ if(c.lx[n-1].lvl > 0.02) lit.push(c.at + ':ch' + n); });
    });
    if(lit.length)
      throw new Error(lit.length + ' audience channels are up during act one: ' +
                      lit.slice(0, 4).join(', '));
    /* and no act one cue arms a pattern on them either */
    const armed = act1.filter(c=>c.fx);
    if(armed.length)
      throw new Error(armed.length + ' act one cues arm an audience pattern');
    return 'all 14 audience channels dark across ' + act1.length + ' cues, no patterns armed';
  });

  /* The engine drives the audience rig and NOTHING ELSE.  This exists because
     the 9:01 "all lights flash" cue was very nearly written as an effect, which
     would have flashed eight blinders and left the stage dark — an aim at the
     wrong fourteen lamps, with nothing to show it. */
  /* AN EFFECT WRITES ONLY TO THE CHANNELS ITS TARGET NAMES.  This began as
     "the engine can never touch the stage", which was true until act two asked
     for a purple mover crawling on the curtain and a fast green strobe
     (RULING BE).  Containment is the guarantee that survives the widening, and
     it still catches the mistake that prompted it: an effect spilling onto
     lamps the cue never named.  An unknown target must move NOTHING. */
  P('a pattern writes only to the channels its target names', ()=>{
    showLoad('beetlejuice');
    const groups = {blind:GROUPS.blind, aud:GROUPS.aud, house:GROUPS.house,
                    movers:GROUPS.movers, stage:GROUPS.stage, front:GROUPS.front,
                    nonsense:[]};
    Object.keys(groups).forEach(on=>{
      FIXTURES.forEach(f=>{ f.level = 0; f.lvlDur = 0; f.panT = 0; });
      const mine = {};
      groups[on].forEach(n=>{ mine[n] = 1; });
      showCueFx({on:on, kind:'random', col:'#ffffff'});
      for(let i = 0; i < 120; i++) audFxStep(1/60);
      const spilled = [];
      FIXTURES.forEach((f, k)=>{
        if(mine[k + 1]) return;
        if(Math.abs(f.level) > 1e-9 || Math.abs(f.panT) > 1e-9) spilled.push(k + 1);
      });
      if(spilled.length)
        throw new Error('a "' + on + '" pattern spilled onto channels ' + spilled.join(', '));
      if(groups[on].length){
        const moved = groups[on].filter(n=>Math.abs(chan(n).level) > 1e-9);
        if(!moved.length) throw new Error('a "' + on + '" pattern moved nothing at all');
      }
    });
    showCueFx(null);
    FIXTURES.forEach(f=>{ f.level = 0; });
    return Object.keys(groups).length + ' targets, every one contained to its own channels';
  });

  P('the interval stops the show track and brings the pre-show music back', ()=>{
    showLoad('beetlejuice');
    const iv = CUES.filter(c=>c.at === 4269)[0];
    if(!iv.hold) throw new Error('the interval does not hold');
    if(iv.follow !== null) throw new Error('the interval arms a follow');
    if(!iv.audio || iv.audio.stop !== 'act1')
      throw new Error('the interval does not stop the show track — he wrote "audio two stops"');
    if(iv.audio.play !== 'preshow')
      throw new Error('the interval does not bring back audio one');
    /* and it really does it, through the cue path */
    fireCue(CUES.indexOf(iv));
    if(AUD.tracks.act1.want) throw new Error('the show track is still wanted after the interval');
    if(!AUD.tracks.preshow.want) throw new Error('the pre-show music was not restarted');
    return 'holds, stops the show, restarts the pre-show music';
  });

  /* ====================================================================== *
     ACT TWO, AND HIS SET LIST PINNED END TO END
     ====================================================================== */
  console.log('--- act two, off his own cue sheet ---');

  P('every timestamp in his act two is a cue at that second', ()=>{
    showLoad('beetlejuice');
    /* every clock in act 2.txt, converted: 1:11:47 through 2:15 */
    const his = [4307, 4329, 4336, 4465, 4497, 4498, 4504, 4623, 4843, 5105,
                 5455, 5471, 5828, 5841, 5904, 5921, 5962, 5981, 6802, 6813,
                 6818, 6879, 7064, 7187, 7313, 7319, 7559, 7602, 7716, 7748,
                 7969, 7973, 8047, 8066, 8076, 8081, 8092, 8100];
    const missing = his.filter(t=>!CUES.some(c=>c.at === t));
    if(missing.length)
      throw new Error(missing.length + ' of his act two times have no cue: ' + missing.join(', '));
    return his.length + ' act two light cues, all on his seconds';
  });

  /* HIS WHOLE SET LIST, BOTH ACTS, IN ONE PLACE.  set cues.txt transcribed as
     data so the next round diffs it in one command instead of by eye — which is
     how the 1:39:00 drift below went unnoticed until he wrote the list out
     again. */
  P('his set list is the set list, every time and every action', ()=>{
    showLoad('beetlejuice');
    const B = FLY[13];
    const list = [
      /* act one */
      /* FIVE OF THESE ARE HIS 2026-08-13 REVISIONS (RULING CK), marked so the
         next round can tell a number he moved from a number that drifted — which
         is the whole reason this list is data.  Each is the SET change; where the
         cue also carried a look, his "dont change any light cues" split it and
         the light cue keeps its own second. */
      {at:585,  scene:'cemetery', backdrop:'in',  parts:true,  what:'9:45 the graveyard empties'},
      {at:638,  scene:'interior', dress:'maitland', backdrop:'out', off:0,
       what:'10:38 backdrop out, house on (CK: 2s earlier, and gated on the cloth)'},
      {at:1936, scene:'interior', dress:'maitland', backdrop:'out', off:BJ_WAGON_BACK, what:'32:16 house back'},
      {at:1970, scene:'attic',    backdrop:'in',  what:'32:50 backdrop in, the attic'},
      {at:2554, scene:'closet',   backdrop:'in',  what:'42:34 the closet'},
      {at:2929, scene:'attic',    backdrop:'in',  what:'48:49 the attic'},
      {at:3120, scene:'bedroom',  backdrop:'in',  what:'52:00 the bedroom'},
      {at:3355, scene:'roof',     backdrop:'in',  what:'55:55 the roof (CK: 5s earlier, set only)'},
      {at:3771, scene:'interior', dress:'deetz', backdrop:'out', off:0, what:'1:02:51 backdrop out, house on'},
      {at:4262, scene:'interior', dress:'deetz', backdrop:'out', curtain:'shut', what:'1:11:02 end of half'},
      /* act two */
      /* flyHouse: BJ_PART_OUT since RULING CR — a SET flying out takes the flown
         family's own out, not the number the SIGN travels (see the scene's park) */
      {at:4470, scene:'interior', dress:'bj', backdrop:'out', off:0, flyHouse:BJ_PART_OUT,
       what:'1:14:30 sky out, house on'},
      {at:5100, scene:'attic',    backdrop:'in',  off:BJ_WAGON_BACK,
       what:'1:25:00 house back, the attic (CK: 25s earlier, set only)'},
      {at:5455, scene:'interior', dress:'bj', backdrop:'out', off:0,
       what:'1:30:55 backdrop out, house on (CK: 55s later, onto his own blackout)'},
      /* THE ONE CHANGE IN HIS PREVIOUS LIST: 1:39:00 became 1:39:19 */
      {at:5959, scene:'afterlife', backdrop:'out', off:BJ_WAGON_BACK, what:'1:39:19 the netherworld'},
      {at:6795, scene:'interior', dress:'bj', backdrop:'out', off:0,
       what:'1:53:15 house on again (CK: 15s later)'},
      {at:7985, scene:'interior', dress:'bj', backdrop:'out', off:BJ_WAGON_BACK,
       what:'2:13:05 house back, backdrop stays up, the call'},
      {at:8100, scene:'interior', dress:'bj', backdrop:'out', curtain:'shut', what:'2:15:00 curtain in'}
    ];
    list.forEach(e=>{
      const c = CUES.filter(q=>q.at === e.at)[0];
      if(!c) throw new Error('no cue at ' + e.at + 's for ' + e.what);
      if(c.scene !== e.scene)
        throw new Error(e.what + ': the cue calls on ' + c.scene + ', not ' + e.scene);
      if(e.dress && c.dress !== e.dress)
        throw new Error(e.what + ': dressed ' + c.dress + ', not ' + e.dress);
      const trg = c.fly.filter(x=>x.id === B.id)[0].target;
      const isIn = trg < OUT_TRIM - 1;
      if(isIn !== (e.backdrop === 'in'))
        throw new Error(e.what + ': the backdrop is ' + (isIn ? 'in' : 'out') +
                        ', his list says ' + e.backdrop);
      const mv = Array.isArray(c.move) ? c.move : (c.move ? [c.move] : []);
      if(e.off !== undefined){
        const m = mv.filter(x=>x && x.scene === 'interior' && !x.part)[0];
        if(!m) throw new Error(e.what + ': the wagon is never told to move');
        if(Math.abs(m.off - e.off) > 1e-9)
          throw new Error(e.what + ': the wagon goes to ' + m.off + ', not ' + e.off);
      }
      if(e.flyHouse !== undefined){
        const m = mv.filter(x=>x && x.scene === 'house' && !x.part)[0];
        if(!m || Math.abs(m.off - e.flyHouse) > 1e-9)
          throw new Error(e.what + ': the exterior does not fly to ' + e.flyHouse);
      }
      if(e.parts && !mv.some(x=>x && x.part))
        throw new Error(e.what + ': nothing moves within the scene');
      if(e.curtain === 'shut'){
        const ct = c.fly.filter(x=>x.id === frontCurtainLineset().id)[0].target;
        if(ct > OUT_TRIM - 1) throw new Error(e.what + ': the curtain is not in');
      }
    });
    return list.length + ' set changes, every time and action off his list';
  });

  /* The one numeric change between the list he wrote in #104 and the list he
     wrote this round.  Worth its own assertion because it is the whole reason
     the set list above is now data. */
  P('the netherworld moved to 1:39:19, and nothing is left at 1:39:00', ()=>{
    showLoad('beetlejuice');
    const now = CUES.filter(c=>c.at === 5959)[0];
    if(!now) throw new Error('there is no cue at 1:39:19');
    if(now.scene !== 'afterlife')
      throw new Error('1:39:19 calls on ' + now.scene + ', not the netherworld');
    if(CUES.some(c=>c.at === 5940))
      throw new Error('a cue is still sitting on the old 1:39:00');
    return 'the netherworld at 5959s, and 5940 is empty';
  });

  P('act two picks the show track back up at 1:11:32', ()=>{
    showLoad('beetlejuice');
    const iv = CUES.filter(c=>c.at === 4269)[0];
    const go2 = CUES[CUES.indexOf(iv) + 1];
    if(!go2) throw new Error('nothing follows the interval');
    if(!go2.audio || go2.audio.play !== 'act2')
      throw new Error('the act two GO does not restart the show track');
    if(go2.audio.at !== 4292)
      throw new Error('it resumes at ' + go2.audio.at + 's, he wrote 1:11:32 (4292)');
    if(go2.audio.stop !== 'preshow')
      throw new Error('the pre-show music plays on into act two');
    return 'GO resumes the show at 1:11:32 and kills the interval music';
  });

  P('the last cue fades the audio out rather than cutting it', ()=>{
    showLoad('beetlejuice');
    const last = CUES[CUES.length - 1];
    if(last.at !== 8100) throw new Error('the show does not end at 2:15:00');
    if(!last.audio || last.audio.fade !== 'act2')
      throw new Error('the last cue does not fade the audio — he wrote "Audio fades out"');
    /* and the ramp really runs, on dt, and pauses itself at the bottom.  It is
       ACT TWO's element that fades — the last cue is 3808s into that file, and
       fading the wrong half would be a silent no-op on a track already stopped
       at the interval (RULING BI). */
    const tr = audTrack('act2'), real = tr.el;
    let paused = false;
    tr.el = {paused:false, readyState:4, currentTime:3808, volume:1,
             play(){ return null; }, pause(){ paused = true; this.paused = true; }};
    tr.want = true;
    showCueAudio(last.audio);
    const v0 = tr.el.volume;
    for(let i = 0; i < 60; i++) audPump(1/60);
    const v1 = tr.el.volume;
    if(!(v1 < v0 - 0.02)) throw new Error('a second in, the volume is still ' + v1);
    for(let i = 0; i < 700; i++) audPump(1/60);
    if(!paused) throw new Error('the fade never reached the bottom');
    tr.el = real; tr.want = false; tr.fade = null;
    return 'fades over ' + last.audio.secs + 's and pauses itself at the end';
  });

  /* "lights flash green really fast" and "then stop flashing" — a strobe has to
     actually alternate, and it has to stop when he says it stops. */
  P('the fast green flashing really alternates, and the next cue stops it', ()=>{
    showLoad('beetlejuice');
    const on = CUES.filter(c=>c.at === 7313)[0], off = CUES.filter(c=>c.at === 7319)[0];
    if(!on.fx) throw new Error('2:01:53 arms nothing');
    const e = Array.isArray(on.fx) ? on.fx[0] : on.fx;
    if(e.kind !== 'strobe') throw new Error('2:01:53 is a ' + e.kind + ', not a strobe');
    if(off.fx) throw new Error('2:01:59 leaves the flashing running');
    showCueFx(on.fx);
    const f = chan(GROUPS.stage[0]);
    let hi = 0, lo = 0;
    for(let i = 0; i < 300; i++){ audFxStep(1/60); if(f.level > 0.5) hi++; else lo++; }
    if(hi < 40 || lo < 40)
      throw new Error('over five seconds it was up ' + hi + ' frames and down ' + lo);
    showCueFx(off.fx || null);
    audFxStep(1/60);
    if(AUD.fx.stage) throw new Error('the strobe survived the cue that stops it');
    return 'up ' + hi + ' frames, down ' + lo + ' over 5s, then stopped';
  });

  /* "1:53:33 all lights move in a random pattern pointing at the audience" —
     the one cue in the show where the audience rig is the point, and "1:53:38
     Lights point at stage" takes it straight back off them. */
  P('1:53:33 points at the audience and 1:53:38 takes it off them', ()=>{
    showLoad('beetlejuice');
    const at = CUES.filter(c=>c.at === 6813)[0], back = CUES.filter(c=>c.at === 6818)[0];
    if(!at.fx) throw new Error('1:53:33 arms no pattern');
    const list = Array.isArray(at.fx) ? at.fx : [at.fx];
    const targets = list.map(e=>e.on).sort().join(',');
    if(targets !== 'aud,blind')
      throw new Error('1:53:33 aims at ' + targets + ', and he pointed it at the audience');
    if(!list.every(e=>e.kind === 'random'))
      throw new Error('1:53:33 is not a random pattern');
    const up = GROUPS.house.filter(n=>at.lx[n-1].lvl > 0.5);
    if(up.length !== 14)
      throw new Error('only ' + up.length + ' of the 14 audience lamps are up on it');
    if(back.fx) throw new Error('1:53:38 leaves the audience pattern running');
    const stillUp = GROUPS.house.filter(n=>back.lx[n-1].lvl > 0.02);
    if(stillUp.length)
      throw new Error(stillUp.length + ' audience lamps are still up once it points at the stage');
    return 'both audience groups random and full at 1:53:33, all 14 dark by 1:53:38';
  });

  P('the snaps in act two have no fade either', ()=>{
    showLoad('beetlejuice');
    const at = t => CUES.filter(c=>c.at === t)[0];
    /* "1:59:47 lights snap blue", "2:08:36 lights snap blue", "2:14:41 lights
       snap to white", and the two strobes, which start on the instant */
    [7187, 7716, 8081, 7313, 8076].forEach(t=>{
      if(at(t).fade !== 0)
        throw new Error('the snap at ' + t + 's carries a ' + at(t).fade + 's fade');
    });
    /* "1:57:44 lights slowly fade to white" — slowly, so it is not a snap */
    if(at(7064).fade < 8)
      throw new Error('the slow fade at 1:57:44 is only ' + at(7064).fade + 's');
    return 'five snaps at 0s, and the slow one at ' + at(7064).fade + 's';
  });

  /* ==========================================================================
     RULING BW — THE TOP OF THE SHOW FIRES THE FIRST CUE

     His words: "make it so when you press top of show it automaticall sets it to
     cue one beuase when i try to press go to go to top os show it starts the
     show."  Two halves, and the second one was not in the spec: TOP has to FIRE
     the cue, and it has to LET GO OF THE TRANSPORT, or a live clock track drags
     the stack straight back to where the music is.
     ========================================================================== */
  console.log('--- RULING BW: the top of the show ---');

  P('TOP fires the first cue rather than only selecting it', ()=>{
    showLoad('beetlejuice');
    /* stand the board somewhere in the middle of act one, the way an operator
       who has been running the show for ten minutes would have it */
    const mid = CUES.findIndex(c=>c.at >= 640);
    if(mid < 1) throw new Error('no cue at or past 10:40 to stand on');
    /* through the GO cue on the way, because that is what takes the foyer out
       (RULING BH) — otherwise the lobby check below reads 0.9 both sides and
       passes against a button that does nothing */
    fireCue(1);
    fireCue(mid);
    const midHouse = HOUSE.house, midLobby = HOUSE.lobby;
    const top = CUES[0];
    /* a fixture that cannot tell the two looks apart would pass whatever the
       button did, which is the whole lesson of this file */
    if(midHouse === top.house)
      throw new Error('the mid-show house matches the pre-show, so this proves nothing');
    if(midLobby === top.lobby)
      throw new Error('the foyer is already at the pre-show level, so that half proves nothing');
    const btn = document.getElementById('btnTop');
    if(!btn) throw new Error('there is no TOP OF SHOW button in the DOM');
    btn.onclick();
    if(nextCue !== 1)
      throw new Error('TOP left the stack at index ' + nextCue + ' instead of standing after the first cue');
    if(HOUSE.house !== top.house)
      throw new Error('the pre-show look never landed: house ' + HOUSE.house + ' against a cue that says ' + top.house);
    if(HOUSE.lobby !== top.lobby)
      throw new Error('the foyer did not come back up: lobby ' + HOUSE.lobby + ' was ' + midLobby);
    if(RIG.haze !== top.haze)
      throw new Error('the haze is still the mid-show value: ' + RIG.haze);
    /* the whole cue, not just its masters — cue 0 arms the wander pattern */
    if(!AUD.fx || !AUD.fx.aud)
      throw new Error('the pre-show pattern was never armed, so only part of the cue fired');
    return 'fired Q' + top.n + ' — house ' + midHouse + ' to ' + HOUSE.house +
           ', lobby ' + midLobby + ' to ' + HOUSE.lobby + ', standing at Q' + CUES[1].n;
  });

  /* THE HALF THE SPEC GOT WRONG.  It predicted this composed with RULING BO for
     free because cue 0 carries its own audio and the jump-seek declines.  The
     seek does decline — and it is not the seek that bites, it is the transport:
     the pre-show cue does not stop act one, so showAudioTick keeps the clock and
     fires the GO cue one frame later off a playhead already past 0:35. */
  P('TOP lets go of the transport, so the pre-show actually holds', ()=>{
    showLoad('beetlejuice');
    const tr = audTrack('act1'), real = tr.el;
    const fake = {paused:false, readyState:4, currentTime:40, volume:1,
                  play(){ return null; }, pause(){ this.paused = true; }};
    tr.el = fake; tr.want = true; tr.blocked = false;
    showAudioTick(0.016);
    if(!AUD.clock) throw new Error('the transport never took the clock, so this fixture proves nothing');
    document.getElementById('btnTop').onclick();
    if(nextCue !== 1)
      throw new Error('TOP did not leave the board standing after the first cue: index ' + nextCue);
    const preHouse = HOUSE.house;
    /* five frames of the real transport.  If a clock track is still live, the
       cue at 35 is already due at a playhead of 40 and goes on the first one. */
    for(let i = 0; i < 5; i++) showAudioTick(0.016);
    if(nextCue !== 1)
      throw new Error('the transport dragged the stack to index ' + nextCue +
                      ' — the show started by itself');
    if(HOUSE.house !== preHouse)
      throw new Error('the pre-show look was overwritten: house ' + HOUSE.house + ' was ' + preHouse);
    if(AUD.clock) throw new Error('a clock track still holds the stack after TOP');
    if(tr.want) throw new Error('act one is still wanted after TOP');
    if(audLive(tr)) throw new Error('act one is still playing after TOP');
    /* and the pre-show music IS asked for, because the cue says so */
    if(!audTrack('preshow').want)
      throw new Error('the pre-show music was not asked for by the cue TOP fired');
    /* RULING BO still declines: the cue has already spoken about its own audio */
    if(tr.seek !== null)
      throw new Error('TOP seeked the show track behind the back of a cue that names its own');
    tr.el = real; tr.want = false;
    showSoundStop();
    return 'five frames of transport later, still standing at Q' + CUES[1].n +
           ' with the pre-show up and act one stopped';
  });

  showLoad('beetlejuice');       // leave the board where the AZ tail expects it

  /* RULING AZ (the appended tail): the model-import tests live PAST this
     probe, out in node, because GLTFLoader.parse resolves through promise
     microtasks a synchronous probe can never see.  SHOW and WALKABLE are
     consts of this eval program, invisible from outside — hand them out. */
  /* bjCues() RELOADS rather than handing over whatever stack happened to be
     live when this ran — the AZ tail leaves another show up, and a captured
     reference to CUES would silently be the wrong production's. */
  window.__AZ = {SHOW:SHOW, WALKABLE:WALKABLE, BJ_MODELS:BJ_MODELS, BJ_AUDIO:BJ_AUDIO,
                 BJ_TRI_BUDGET:BJ_TRI_BUDGET, BJ_TEX_BUDGET:BJ_TEX_BUDGET,
                 /* RULING BX — the room a set is fitted INTO, not just its width */
                 BJ:BJ, D:D, FIXTURES:FIXTURES,
                 /* RULING CL — where the Palace brick really stands, and how far
                    upstage the wagon tracks to hide */
                 PAL_BACK:PAL_BACK, PAL_DEEP:PAL_DEEP, BJ_WAGON_BACK:BJ_WAGON_BACK,
                 BJ_FIT_AIR:typeof BJ_FIT_AIR === 'undefined' ? undefined : BJ_FIT_AIR,
                 BJ_SET_DEPTH:typeof BJ_SET_DEPTH === 'undefined' ? undefined : BJ_SET_DEPTH,
                 bjCues:()=>{ showLoad('beetlejuice'); return CUES.slice(); }};

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); }
catch(e){ console.log('TOP LEVEL THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
/* =============================================================================
   RULING AZ — the model-import pipeline.  APPENDED PAST THE PROBE on purpose:
   GLTFLoader.parse resolves through promise microtasks, which the synchronous
   probe above can never observe — so these tests run out here in node,
   awaiting the page's own vendored loader, and the exit moved down with them.
   (This is plain node code, not a probe template: backslashes survive here.)

   THE WATCHDOG: this tail carries the whole suite's exit, and an await on a
   promise that never settles would DRAIN the loop and exit 0 — a hang that
   silences everything, vacuously green.  A non-unref'd timer keeps the
   process alive and turns a hung tail into a loud non-zero exit.  (setTimeout
   is fine in TESTS — the standing ban is on game timing.)
   ========================================================================== */
const wd = setTimeout(() => {
  console.log('AZ tail never finished — a promise hung; failing the suite');
  process.exit(1);
}, 60000);
(async () => {
  const errs = w.__errs || (w.__errs = []);
  const az = w.__AZ || {};
  const P = async (name, fn) => {
    try{
      const v = await fn();
      console.log('  ok  ' + name + (v !== undefined ? '  -> ' + JSON.stringify(v).slice(0, 180) : ''));
    }catch(e){
      console.log('  ERR ' + name + ': ' + e.message);
      errs.push(name + ': ' + e.message);
    }
  };
  const under = (o, g) => { let p = o; while(p){ if(p === g) return true; p = p.parent; } return false; };
  const meshCount = g => { let n = 0; g.traverse(o => { if(o.isMesh) n++; }); return n; };
  const findByName = (g, name) => { let f = null; g.traverse(o => { if(!f && o.name === name) f = o; }); return f; };

  /* a tiny .glb built by hand — glTF 2.0 binary: 12-byte header, a JSON chunk
     padded with spaces, a BIN chunk padded with zeros.  Every node is its own
     2-triangle quad mesh (4 verts, 6 indices); matCount > 1 gives each node
     its own material so the material census is real to a walker. */
  const makeGlb = (nodes, matCount) => {
    const pos = new Float32Array([-0.5, 0, -0.5,  0.5, 0, -0.5,  0.5, 0, 0.5,  -0.5, 0, 0.5]);
    const idx = new Uint16Array([0, 1, 2, 0, 2, 3]);
    const bin = Buffer.concat([Buffer.from(pos.buffer), Buffer.from(idx.buffer)]);   // 48 + 12
    const nMat = matCount || 1;
    const json = {
      asset: {version: '2.0'}, scene: 0,
      scenes: [{nodes: nodes.map((_, i) => i)}],
      nodes: nodes.map((n, i) => ({name: n.name, mesh: i, translation: [n.x, 0, 0]})),
      meshes: nodes.map((n, i) => ({name: n.name,
        primitives: [{attributes: {POSITION: 0}, indices: 1, material: (n.mat || 0) % nMat}]})),
      materials: Array.from({length: nMat}, (_, i) =>
        ({name: 'm' + i, pbrMetallicRoughness: {baseColorFactor: [1, 1, 1, 1]}})),
      accessors: [
        {bufferView: 0, componentType: 5126, count: 4, type: 'VEC3',
         min: [-0.5, 0, -0.5], max: [0.5, 0, 0.5]},
        {bufferView: 1, componentType: 5123, count: 6, type: 'SCALAR'}
      ],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 48},
        {buffer: 0, byteOffset: 48, byteLength: 12}
      ],
      buffers: [{byteLength: 60}]
    };
    let js = Buffer.from(JSON.stringify(json), 'utf8');
    while(js.length % 4) js = Buffer.concat([js, Buffer.from(' ')]);
    const binPad = bin.length % 4 ? Buffer.concat([bin, Buffer.alloc(4 - bin.length % 4)]) : bin;
    const head = Buffer.alloc(12), cj = Buffer.alloc(8), cb = Buffer.alloc(8);
    head.writeUInt32LE(0x46546C67, 0);                       // 'glTF'
    head.writeUInt32LE(2, 4);
    head.writeUInt32LE(12 + 8 + js.length + 8 + binPad.length, 8);
    cj.writeUInt32LE(js.length, 0);  cj.writeUInt32LE(0x4E4F534A, 4);   // 'JSON'
    cb.writeUInt32LE(binPad.length, 0); cb.writeUInt32LE(0x004E4942, 4); // 'BIN\0'
    const all = Buffer.concat([head, cj, js, cb, binPad]);
    return all.buffer.slice(all.byteOffset, all.byteOffset + all.length);
  };
  const parseGlb = buf => new Promise((res, rej) =>
    new w.THREE.GLTFLoader().parse(buf, '',
      g => res(g),
      e => rej(new Error('parse failed: ' + (e && e.message || e)))));

  /* RULING BA — the same contract shape as the models, and out here in node
     for the same reason the models one is: it reads a doc off the disk. */
  await P('the audio manifest names exactly the files docs/AUDIO.md promises, both directions', async () => {
    /* The fallback is silent BY DESIGN, so neither half of a mismatch can ever
       announce itself: a manifest file the doc does not name is a delivery
       instruction nobody was given, and a documented file the manifest does not
       want is a correctly-named file sitting in assets/audio/ that never plays. */
    const doc = fs.readFileSync(require('path').join(__dirname, '..', 'docs', 'AUDIO.md'), 'utf8');
    /* the CONTRACT is the table, so only table rows count.  Scanning the whole
       document swept up the owner's own source filenames out of the copy
       commands and reported them as undelivered — the doc talks about more
       files than it promises. */
    const rows = doc.split('\n').filter(l => l.trim().charAt(0) === '|').join('\n');
    const docSet = new Set((rows.match(/[a-z0-9_-]+\.(?:mp3|m4a|ogg|wav)/gi) || [])
                           .map(s => s.toLowerCase()));
    if(!docSet.size) throw new Error('AUDIO.md names no files at all');
    const man = az.BJ_AUDIO;
    if(!man) throw new Error('the build handed out no audio manifest');
    const manSet = new Set(Object.keys(man).map(k => man[k].file.toLowerCase()));
    const undelivered = [...docSet].filter(f => !manSet.has(f));
    const unwanted = [...manSet].filter(f => !docSet.has(f));
    if(undelivered.length) throw new Error('documented but never played: ' + undelivered.join(', '));
    if(unwanted.length) throw new Error('played but never documented: ' + unwanted.join(', '));
    if(manSet.size !== 3) throw new Error(manSet.size + ' tracks, the contract lists 3');
    /* the pre-show loops and neither half of the show does — getting that
       backwards means the show restarting itself at the curtain call */
    if(!man.preshow.loop) throw new Error('the pre-show music does not loop');
    if(man.act1.loop || man.act2.loop) throw new Error('a half of the show loops');
    /* and only the show may drive the cue stack (BB, BI) */
    if(man.preshow.clock) throw new Error('the pre-show music is allowed to be the clock');
    if(!man.act1.clock || !man.act2.clock) throw new Error('a half of the show is not a clock');
    return [...manSet].join(', ') + ' — all three documented, preshow loops and is no clock';
  });

  /* THE OFFSETS ARE THE WHOLE OF "make sure the cues still line up" (BI).
     His timestamps are positions in one 2h23m recording and RULING BB made that
     literal; cutting the file in half is only safe while each half says where
     it begins.  Pinned against the PLOT rather than against themselves —
     asserting offset===4292 twice would prove nothing about the cues. */
  await P('the split is invisible to the plot: every cue still lands on its own second', async () => {
    const man = az.BJ_AUDIO;
    const cues = az.bjCues();
    /* the act-two cue asks for the same number it always asked for, and that
       number must land at the very top of its own file */
    const two = cues.filter(c => c.audio && c.audio.play === 'act2')[0];
    if(!two) throw new Error('no cue starts act two');
    if(two.audio.at !== 4292)
      throw new Error('the act-two cue asks for ' + two.audio.at + ', not his 4292');
    const seek = two.audio.at - man.act2.offset;
    if(seek !== 0) throw new Error('act two would open ' + seek + 's into its own file');
    /* act one likewise, at his 35 */
    const one = cues.filter(c => c.audio && c.audio.play === 'act1')[0];
    if(!one || one.audio.at !== 35) throw new Error('act one does not start at his 0:35');
    if(one.audio.at - man.act1.offset !== 35)
      throw new Error('act one seeks to the wrong place in its own file');
    /* EVERY cue after the join must be reachable from act two's own clock, and
       no cue before it may be — that is what the offset actually buys */
    const dur2 = 8626.79 - man.act2.offset;
    const late = cues.filter(c => c.at !== undefined && c.at !== null && c.at > man.act2.offset);
    const over = late.filter(c => (c.at - man.act2.offset) > dur2);
    if(!late.length) throw new Error('no cue falls in act two at all');
    if(over.length)
      throw new Error(over.length + ' act-two cues fall past the end of act2.m4a');
    const last = late[late.length - 1];
    /* and the cut point itself: the track is STOPPED before it and RESUMED
       after it, so the join sits in a silence the show already had */
    const stops = cues.filter(c => c.audio && c.audio.stop === 'act1')[0];
    if(!stops) throw new Error('nothing stops act one');
    if(!(stops.at <= man.act2.offset))
      throw new Error('act one is stopped at ' + stops.at + ', after the cut at ' + man.act2.offset);
    return 'act1 stops at ' + stops.at + ', act2 opens at its 0.0 for his 4292, last cue ' +
           last.at + ' = ' + (last.at - man.act2.offset).toFixed(0) + 's into act2';
  });

  /* REVERSED IN PLACE (RULING BI amends BA).  This assertion used to demand the
     exact opposite — that git REFUSE every recording — because BA said the
     files could never be committed: 134MB against GitHub's 100MB hard limit,
     off a video, and a commercial recording on a repo with Pages on.  The first
     of those stopped being true when the show track was split at the act break
     (69.4MB and 70.1MB), and the owner overruled the other two with all three
     in front of him.

     It is turned round rather than deleted, because what it guards did not go
     away — it inverted.  The three NAMED files must be committable and the
     directory must still refuse everything else, so a stray recording is an
     accident and not a silent delivery.  And the reasoning stays on the record
     where the next session will read it: a reversed ruling is worth more than a
     deleted one (the AO/AV precedent). */
  await P('the three named recordings are committed, and nothing else can slip in', async () => {
    /* ASK GIT, do not read the file.  Grepping .gitignore for a pattern was the
       first version of this and it was worthless: commenting a rule out leaves
       the pattern text sitting right there in the line.  git check-ignore
       answers the question actually being asked — and that is why this survived
       the reversal unchanged in method while flipping in meaning. */
    const cp = require('child_process'), root = require('path').join(__dirname, '..');
    const ignored = p => {
      try{ cp.execSync('git check-ignore -q ' + p, {cwd:root}); return true; }
      catch(e){ return false; }
    };
    const files = Object.keys(az.BJ_AUDIO).map(k => az.BJ_AUDIO[k].file);
    for(const f of files)
      if(ignored('assets/audio/' + f))
        throw new Error('git still refuses ' + f + ' — BI says it is committed');
    if(ignored('assets/audio/README.md'))
      throw new Error('the README that carries the contract is ignored');
    /* the directory is still closed to anything the contract does not name */
    if(!ignored('assets/audio/videoplayback.m4a'))
      throw new Error('an unnamed recording could ride in on a git add');
    /* and they must really BE in the index, not merely permitted — a manifest
       naming a file nobody committed is exactly the silent failure BI inherits
       from BA, and on Pages it is the difference between sound and no sound */
    const tracked = new Set(cp.execSync('git ls-files assets/audio', {cwd:root})
      .toString().trim().split('\n').filter(Boolean).map(f => f.replace('assets/audio/', '')));
    const missing = files.filter(f => !tracked.has(f));
    if(missing.length)
      throw new Error('named in the manifest but not in git: ' + missing.join(', '));
    /* .gitattributes must call them binary.  The repo pins `* text=auto eol=lf`
       for build.sh's sake, and text=auto decides by content heuristic — a media
       file that lost that coin toss would be rewritten on checkout, and there is
       nothing in this repo that could hear it. */
    const attrs = fs.readFileSync(require('path').join(root, '.gitattributes'), 'utf8');
    for(const ext of ['m4a', 'mp3'])
      if(!new RegExp('^\\*\\.' + ext + '\\s+binary', 'm').test(attrs))
        throw new Error('.gitattributes does not pin *.' + ext + ' as binary');
    return files.length + ' tracked (' + files.join(', ') +
           '), pinned binary, and an unnamed recording still refused';
  });

  console.log('--- the model import (RULING AZ): parse, validate, apply, fall back ---');

  /* HIS DELIVERED SETS ARE COMMITTED, and this is the assertion that says so.
     Same reasoning as the recordings (RULING BI) and the same method: ASK GIT,
     do not read the directory.  A model sitting on disk and missing from the
     index works perfectly on this machine and is simply absent on Pages, where
     the fallback is silent BY DESIGN — so the failure would be "the sets never
     arrived" with nothing anywhere saying why.

     It deliberately does NOT demand all nine.  A set he has not modelled is a
     normal state that the stand-in covers; what must never happen is a file
     that is there-but-untracked, or a file in assets/ that no manifest entry
     ever fetches. */
  await P('every delivered .glb is in the index, and assets/ holds nothing the manifest ignores', async () => {
    const cp = require('child_process'), root = require('path').join(__dirname, '..');
    const manifest = new Set(Object.keys(az.BJ_MODELS).map(k => {
      const v = az.BJ_MODELS[k];
      return ((typeof v === 'string') ? v : v.url).replace(/^assets\//, '');
    }));
    const onDisk = fs.readdirSync(require('path').join(root, 'assets')).filter(f => /\.glb$/.test(f));
    if(!onDisk.length) throw new Error('no models delivered yet — this assertion has nothing to guard');
    const tracked = new Set(cp.execSync('git ls-files assets', {cwd: root})
      .toString().trim().split('\n').filter(Boolean).map(f => f.replace('assets/', '')));

    const untracked = onDisk.filter(f => !tracked.has(f));
    if(untracked.length)
      throw new Error('on disk but not in git, so silently absent on Pages: ' + untracked.join(', '));
    const unfetched = onDisk.filter(f => !manifest.has(f));
    if(unfetched.length)
      throw new Error('committed but no manifest entry fetches them: ' + unfetched.join(', '));

    /* and the bytes have to survive a checkout.  `* text=auto eol=lf` decides
       binary by CONTENT HEURISTIC, and a glb that lost that coin toss would be
       rewritten on checkout into something that never parses — against a
       silent fallback.  .gitattributes names the extension; this checks the
       result, by asking git whether the blob it stored still matches the file. */
    if(!/^\*\.glb\s+binary/m.test(fs.readFileSync(require('path').join(root, '.gitattributes'), 'utf8')))
      throw new Error('.gitattributes does not pin *.glb as binary');
    /* porcelain is `XY path`: X is index-vs-HEAD, Y is WORKTREE-vs-index, and
       only Y answers this question.  Filtering on the whole line instead would
       fail on a freshly staged file (`A `), where the worktree and the index
       agree perfectly — which is the state this very commit was made from. */
    const dirty = cp.execSync('git status --porcelain -- assets', {cwd: root}).toString()
      .split('\n').filter(l => /\.glb$/.test(l) && l[1] !== ' ');
    if(dirty.length)
      throw new Error('the worktree and the index disagree about ' + dirty.length +
                      ' model(s) — a checkout rewrote them: ' + dirty.join(' | '));
    return onDisk.length + ' of ' + manifest.size + ' delivered and tracked (' +
           onDisk.join(', ') + '), byte-identical to the index, pinned binary';
  });

  await P('the manifest fetches exactly the files docs/MODELING.md promises, both directions', async () => {
    /* the fallback is SILENT, so a manifest url the doc never names would rot
       unnoticed — and a documented file the manifest never fetches would be a
       correctly-named delivery that simply never loads, with no feedback */
    const doc = fs.readFileSync(require('path').join(__dirname, '..', 'docs', 'MODELING.md'), 'utf8');
    const docSet = new Set(doc.match(/bj-[a-z0-9-]+\.glb/g) || []);
    if(!docSet.size) throw new Error('MODELING.md names no files at all');
    const manSet = new Set(Object.keys(az.BJ_MODELS).map(k => {
      const v = az.BJ_MODELS[k];
      return ((typeof v === 'string') ? v : v.url).replace(/^assets\//, '');
    }));
    const undelivered = [...docSet].filter(f => !manSet.has(f));
    const undocumented = [...manSet].filter(f => !docSet.has(f));
    if(undelivered.length) throw new Error('documented but never fetched: ' + undelivered.join(', '));
    if(undocumented.length) throw new Error('fetched but never documented: ' + undocumented.join(', '));
    /* 9 -> 10 with the exterior (RULING BZ).  The number is pinned rather than
       derived so that a file quietly appearing in, or vanishing from, BOTH the
       doc and the manifest still has to be a deliberate edit here. */
    if(manSet.size !== 11) throw new Error(manSet.size + ' files, the contract lists 11');
    /* THE HOUSE IS THREE WHOLE HOUSES (RULING BP), not a shell plus three
       dressings.  Each targets the interior — the z-slide wagon, never the
       exterior miniature — names its own dressing, and declares `whole`, which
       is what takes the built-in shell out from under it. */
    if(az.BJ_MODELS.house) throw new Error('the shell entry is back; BP replaced it with three houses');
    /* SELECTED BY WHAT THEY TARGET, NOT BY THEIR KEY.  This used to filter on
       `k.indexOf('house') === 0`, which was fine until RULING BZ added
       `houseExterior` — a fourth key starting with "house" that is not one of
       these at all, and it turned this assertion into a false alarm the moment
       the exterior landed.  The interior wagon is the real discriminator. */
    const houses = Object.keys(az.BJ_MODELS).filter(k=>az.BJ_MODELS[k].scene === 'interior');
    if(houses.length !== 3) throw new Error(houses.length + ' whole-house entries, wanted 3');
    const dressSeen = {};
    for(const k of houses){
      const h = az.BJ_MODELS[k];
      if(h.scene !== 'interior') throw new Error(k + ' does not target the wagon: ' + h.scene);
      if(!h.dress) throw new Error(k + ' names no dressing, so nothing would choose between them');
      if(!h.whole) throw new Error(k + ' is not marked whole — the shell would stand inside it');
      if(dressSeen[h.dress]) throw new Error('two house files claim the ' + h.dress + ' dressing');
      dressSeen[h.dress] = true;
    }
    for(const d of ['maitland','deetz','bj'])
      if(!dressSeen[d]) throw new Error('no whole house for the ' + d + ' dressing');
    /* REVERSED IN PLACE FOR RULING BZ — the AO/AV/BA precedent, fourth time.
       This block used to read:

         if(typeof v !== 'string' && v.scene === 'house')
           throw new Error('an entry targets the exterior house scene: ' + k);

       and it was right at the time: RULING AW read the production photograph as
       a painted CLOTH, MODELING.md said the exterior was not the owner's to
       model, and an entry pointed at the `house` scene would have been a
       mistake — three whole interiors accidentally aimed at the exterior
       miniature instead of the wagon.  He then modelled the exterior and
       delivered it, which is his to decide, so the thing to guard flipped:
       there must be EXACTLY ONE such entry, it must be the exterior file, and
       the three interiors must still not be it. */
    const ext = Object.keys(az.BJ_MODELS).filter(k => {
      const v = az.BJ_MODELS[k];
      return typeof v !== 'string' && v.scene === 'house';
    });
    if(ext.length !== 1)
      throw new Error(ext.length + ' entries target the exterior house scene, wanted exactly 1: ' +
                      ext.join(', '));
    if(az.BJ_MODELS[ext[0]].url !== 'assets/bj-house-exterior.glb')
      throw new Error('the exterior slot fetches ' + az.BJ_MODELS[ext[0]].url);
    /* and it is NOT a whole-house interior wearing the wrong scene key, which
       is the mistake the old assertion existed to catch */
    if(az.BJ_MODELS[ext[0]].dress || az.BJ_MODELS[ext[0]].whole)
      throw new Error('the exterior entry claims a dressing — it is aimed at the wagon, not the drop');
    /* filenames are not enough: a typo in a scene or dress key is the same
       silent never-loads.  Every entry must resolve against the loaded show. */
    w.showLoad('beetlejuice');
    for(const k of Object.keys(az.BJ_MODELS)){
      const v = az.BJ_MODELS[k];
      const sceneName = (typeof v === 'string') ? k : v.scene;
      const sc = w.sceneFind(sceneName);
      if(!sc) throw new Error('entry ' + k + ' names a scene that does not exist: ' + sceneName);
      if(typeof v !== 'string' && v.dress && (!sc.dress || !sc.dress[v.dress]))
        throw new Error('entry ' + k + ' names a dressing that does not exist: ' + v.dress);
    }
    return manSet.size + ' files — contract and manifest are provably the same list, ' +
           'every scene and dress key resolves, three whole houses on the wagon';
  });

  await P('with no fetch in the world, loadSetModels resolves and touches nothing', async () => {
    if(typeof w.fetch === 'function')
      throw new Error('jsdom grew a fetch — this fallback test needs a rewrite');
    if(typeof w.loadSetModels !== 'function') throw new Error('loadSetModels is not in the build');
    w.showLoad('beetlejuice');            // the hook inside showLoad already ran it once, silently
    const att = w.sceneFind('attic');
    const before = meshCount(att.group);
    const r = await w.loadSetModels();    // and calling it cold must not throw either
    if(!r) throw new Error('it resolved to nothing');
    if(r.applied.length || r.refused.length)
      throw new Error('it applied or refused with no fetch to fetch with');
    if(meshCount(att.group) !== before)
      throw new Error('the attic changed with no model to change it');
    return 'no fetch: resolved, nothing applied, ' + before + ' stand-in meshes still playing';
  });

  await P('a hand-built two-mesh .glb parses through the vendored r128 loader', async () => {
    const gltf = await parseGlb(makeGlb([{name: 'walk_floor', x: -1}, {name: 'junk', x: 2}]));
    const kids = gltf.scene.children;
    if(kids.length !== 2) throw new Error(kids.length + ' top-level nodes, wanted 2');
    const names = kids.map(k => k.name).sort().join('+');
    if(names !== 'junk+walk_floor') throw new Error('wrong names: ' + names);
    if(meshCount(gltf.scene) !== 2) throw new Error('not two meshes');
    const wf = findByName(gltf.scene, 'walk_floor');
    if(Math.abs(wf.position.x + 1) > 1e-6) throw new Error('walk_floor lost its translation');
    return 'THREE.GLTFLoader (vendored, r128): ' + names + ', 2 meshes, 2 tris each';
  });

  await P('nine materials are refused, and the refusal names the budget and the excess', async () => {
    const bad = await parseGlb(makeGlb(
      Array.from({length: 9}, (_, i) => ({name: 'n' + i, x: i - 4, mat: i})), 9));
    const why = w.bjValidateModel(bad.scene);
    if(!why) throw new Error('nine materials were accepted against a budget of 8');
    if(why.indexOf('9 materials') < 0 || why.indexOf('8') < 0)
      throw new Error('the refusal does not name the budget and the excess: ' + why);
    const ok = await parseGlb(makeGlb([{name: 'clean', x: 0}]));
    if(w.bjValidateModel(ok.scene)) throw new Error('a clean model was refused');
    /* and a stray light is refused out loud, not applied silently against
       the no-lights rule (MODELING.md: lighting is the rig's job) */
    const lit = new w.THREE.Group();
    const lamp = new w.THREE.PointLight(0xffffff, 1);
    lamp.name = 'sun';
    lit.add(lamp);
    const whyLit = w.bjValidateModel(lit);
    if(!whyLit || whyLit.indexOf('no-lights') < 0 || whyLit.indexOf('sun') < 0)
      throw new Error('a light in the export was not refused by name: ' + whyLit);
    return why + ' / ' + whyLit;
  });

  await P('a refused model leaves the stand-in playing (the full fetch round)', async () => {
    const badBuf = makeGlb(Array.from({length: 9}, (_, i) => ({name: 'n' + i, x: i - 4, mat: i})), 9);
    w.fetch = url => (url === 'assets/bj-bedroom.glb')
      ? Promise.resolve({ok: true, arrayBuffer: () => Promise.resolve(badBuf)})
      : Promise.reject(new Error('not delivered'));
    try{
      const bed = w.sceneFind('bedroom');
      const before = meshCount(bed.group);
      const r = await w.loadSetModels();
      if(r.applied.length) throw new Error('something applied: ' + r.applied.join(','));
      if(r.refused.length !== 1 || r.refused[0].key !== 'bedroom')
        throw new Error('the refusal did not land on the bedroom: ' + JSON.stringify(r.refused));
      if(r.refused[0].why.indexOf('materials') < 0)
        throw new Error('refused for the wrong reason: ' + r.refused[0].why);
      if(meshCount(bed.group) !== before)
        throw new Error('the refused model disturbed the stand-in');
      /* DERIVED from the manifest rather than hardcoded: it was 8, and RULING
         BZ's tenth entry made it 9.  What this is actually asserting is "every
         entry but the one I served came back silently", and saying that in terms
         of the manifest means the next delivery does not edit a number here. */
      const others = Object.keys(az.BJ_MODELS).length - 1;
      if(r.missing !== others)
        throw new Error(r.missing + ' missing, wanted the other ' + others + ' silent');
      return 'bedroom refused (' + r.refused[0].why + '), ' + before +
             ' stand-in meshes intact, ' + others + ' absentees silent';
    } finally { delete w.fetch; }
  });

  await P('a model swaps INTO the attic flyer, and an OFF attic stays inert', async () => {
    w.sceneShow('cemetery');                       // the attic is OFF for the swap
    const att = w.sceneFind('attic');
    const flyer = att.pmv && att.pmv.all && att.pmv.all.group;
    if(!flyer) throw new Error('the attic lost its all flyer');
    const standIns = flyer.children.slice();
    if(!standIns.length) throw new Error('no stand-in to replace');
    const gltf = await parseGlb(makeGlb([{name: 'walk_floor', x: -1}, {name: 'junk', x: 2}]));
    if(!w.bjApplyModel({scene: 'attic', url: 'x'}, gltf.scene))
      throw new Error('the apply refused a clean model');
    for(const o of standIns)
      if(under(o, att.group)) throw new Error('a stand-in survived the swap: ' + (o.name || 'unnamed'));
    const walk = findByName(flyer, 'walk_floor');
    if(!walk || meshCount(flyer) !== 2)
      throw new Error('the model is not inside the flyer: ' + meshCount(flyer) + ' meshes');
    if(att.walk.indexOf(walk) < 0) throw new Error('walk_floor never reached sc.walk');
    /* the landed subtree is FROZEN scenery (RULING AP): lockShowStatic ran
       before the model could arrive, so the apply must freeze what it lands
       — and must NOT reach the flyer above it, whose matrix stays live */
    let live = 0;
    flyer.traverse(o => { if(o !== flyer && o.matrixAutoUpdate) live++; });
    if(live) throw new Error(live + ' landed nodes escaped the static freeze (RULING AP)');
    if(!flyer.matrixAutoUpdate) throw new Error('the freeze reached the flyer itself');
    /* the trap this pins: fresh meshes wake on layer 0, and a scene that skips
       the sceneApply refresh takes raycasts through a set that is not on.
       REVERSED IN PLACE BY RULING BQ — the trap is identical, the answer moved:
       a parked set is DRAWN on purpose, so what must be true of a fresh mesh
       landing in one is the RAYCAST OPT-OUT, not a cleared layer.  Still
       negative-checked by removing the refresh from bjApplyModel. */
    if(walk.layers.mask === 0)
      throw new Error('the parked attic went dark — BQ says it stands backstage');
    if(walk.raycast === w.THREE.Mesh.prototype.raycast)
      throw new Error('a fresh mesh in a PARKED scene is still in front of the crosshair');
    if(az.WALKABLE.indexOf(walk) >= 0) throw new Error('a parked floor is standable');
    w.sceneShow('attic');                          // ON wakes exactly what came in
    if(walk.layers.mask === 0) throw new Error('the model never wakes with the set on');
    if(az.WALKABLE.indexOf(walk) < 0) throw new Error('walk_floor missing from WALKABLE with the attic on');
    /* and the landed model RIDES THE MOVER OUT with the set, whichever way that
       set goes — read the WORLD matrix, never position (TRAPS).  It used to read
       y, because the attic flew; RULING CE tracks it upstage, so this asks the
       mover which axis it is on rather than assuming.  The guarantee was never
       "it goes up", it is "what came in through the importer travels with the
       set it landed in". */
    const axis = {x: 12, y: 13, z: 14}[att.pmv.all.axis];
    const wp = o => { az.SHOW.group.updateMatrixWorld(true); return o.matrixWorld.elements[axis]; };
    const p0 = wp(walk);
    w.sceneChangeTo('cemetery');
    for(let i = 0; i < 3; i++) w.sceneMoveStep(0.5);
    const moved = Math.abs(wp(walk) - p0);
    if(moved < 2.0)
      throw new Error('the changeover moved the model only ' + moved.toFixed(2) + 'm on ' + att.pmv.all.axis);
    if(att.group.userData.sceneOff) throw new Error('the attic went dark mid-travel');
    for(let i = 0; i < 14; i++) w.sceneMoveStep(0.5);
    /* and it PARKS rather than hiding (RULING BQ) — but the floor still leaves
       WALKABLE, which is the half that matters for a set you could stand on */
    if(att.group.userData.sceneOff) throw new Error('the attic vanished instead of parking');
    if(az.WALKABLE.indexOf(walk) >= 0) throw new Error('the floor stayed standable after the set left');
    return '2 meshes into the flyer, stand-ins gone, unpickable while parked, rode the ' +
           att.pmv.all.axis + '-track ' + moved.toFixed(2) + 'm and left WALKABLE once gone';
  });

  await P('the graveyard routes by side of centre, and a part_ prefix overrides', async () => {
    const cem = w.sceneFind('cemetery');
    if(!cem.pmv || !cem.pmv.hillR || !cem.pmv.hillL) throw new Error('the hills lost their movers');
    const R = cem.pmv.hillR.group, L = cem.pmv.hillL.group;
    const gltf = await parseGlb(makeGlb([{name: 'walk_floor', x: -1}, {name: 'junk', x: 2}]));
    w.bjApplyModel({scene: 'cemetery', url: 'x'}, gltf.scene);
    const wf = findByName(R, 'walk_floor'), jk = findByName(L, 'junk');
    if(!wf) throw new Error('x -1 did not ride the stage-right hill');
    if(!jk) throw new Error('x +2 did not ride the stage-left hill');
    if(findByName(L, 'walk_floor') || findByName(R, 'junk'))
      throw new Error('a node landed on both hills');
    if(meshCount(R) !== 1 || meshCount(L) !== 1)
      throw new Error('stand-ins survived: ' + meshCount(R) + ' SR, ' + meshCount(L) + ' SL');
    if(cem.walk.indexOf(wf) < 0) throw new Error('the routed floor missed sc.walk');
    if(az.WALKABLE.indexOf(wf) < 0) throw new Error('the routed floor missed WALKABLE with the set on');
    /* the explicit prefix beats the sign of x */
    const g2 = await parseGlb(makeGlb([{name: 'part_hillL_thing', x: -3}]));
    w.bjApplyModel({scene: 'cemetery', url: 'x'}, g2.scene);
    if(!findByName(L, 'part_hillL_thing'))
      throw new Error('part_hillL_ at x -3 did not override the sign of x');
    /* and the first model, stripped as the stand-in it now was, took its
       walkable with it — sc.walk and WALKABLE both */
    if(cem.walk.indexOf(wf) >= 0) throw new Error('a stripped floor stayed on sc.walk');
    if(az.WALKABLE.indexOf(wf) >= 0) throw new Error('a stripped floor stayed standable');
    return 'x -1 SR, x +2 SL, part_hillL_ overrode x -3, stripped walkable left both lists';
  });

  await P('a dressing file replaces exactly that dressing, and bjRedress still rules it', async () => {
    const inr = w.sceneFind('interior');
    if(!inr.dress || !inr.dress.maitland) throw new Error('the wagon lost its dressings');
    const mai = inr.dress.maitland, deetz = inr.dress.deetz, bjd = inr.dress.bj;
    const dBefore = meshCount(deetz), bBefore = meshCount(bjd);
    const gBefore = inr.group.children.length;
    const gltf = await parseGlb(makeGlb([{name: 'm_new', x: 0}]));
    if(!w.bjApplyModel({scene: 'interior', dress: 'maitland', url: 'x', scale: 0.3048}, gltf.scene))
      throw new Error('the dressing apply refused');
    const mNew = findByName(mai, 'm_new');
    if(!mNew) throw new Error('the model did not land in the maitland dressing');
    if(meshCount(mai) !== 1) throw new Error('maitland stand-in survived: ' + meshCount(mai) + ' meshes');
    if(Math.abs(gltf.scene.scale.x - 0.3048) > 1e-9)
      throw new Error('a model delivered in feet was not scaled: ' + gltf.scene.scale.x);
    if(meshCount(deetz) !== dBefore || meshCount(bjd) !== bBefore)
      throw new Error('the other dressings were disturbed');
    if(inr.group.children.length !== gBefore)
      throw new Error('the shell was disturbed: ' + inr.group.children.length + ' children, had ' + gBefore);
    w.sceneShow('interior');
    w.bjDress(inr, 'maitland');
    if(mNew.layers.mask === 0) throw new Error('the maitland model stays dark in its own dressing');
    let deetzMesh = null; deetz.traverse(o => { if(!deetzMesh && o.isMesh) deetzMesh = o; });
    if(deetzMesh && deetzMesh.layers.mask !== 0)
      throw new Error('the deetz dressing lit alongside the maitland one');
    w.bjDress(inr, 'deetz');
    if(mNew.layers.mask !== 0) throw new Error('the maitland model stays lit under the deetz dressing');
    return 'maitland replaced (scaled 0.3048), deetz and bj untouched, bjRedress swaps the model like a dressing';
  });

  /* RULING BP.  This used to test a shell landing under three dressings; the
     owner built three whole houses instead, so the thing to prove changed:
     each file lands in its OWN dressing group, the built-in shell comes out
     from under it, and the other two dressing groups are left standing for
     bjRedress to keep choosing between. */
  await P('a whole house lands in its dressing and takes the built-in shell out', async () => {
    const inr = w.sceneFind('interior');
    const dressGroups = [inr.dress.maitland, inr.dress.deetz, inr.dress.bj];
    const shellBefore = inr.group.children.filter(c => dressGroups.indexOf(c) < 0).length;
    if(!shellBefore) throw new Error('the interior has no shell scenery to take out');
    const otherCounts = [meshCount(inr.dress.deetz), meshCount(inr.dress.bj)];

    const gltf = await parseGlb(makeGlb([{name: 'house_maitland', x: 0}, {name: 'walk_stairs', x: 1}]));
    /* through the REAL manifest entry, so this covers the routing the
       manifest actually declares rather than a hand-made one */
    if(!w.bjApplyModel(az.BJ_MODELS.houseMaitland, gltf.scene))
      throw new Error('the whole-house apply refused');

    if(!findByName(inr.dress.maitland, 'house_maitland'))
      throw new Error('the house did not land in the maitland dressing');
    /* the shell is gone — ours must not stand inside his */
    for(const c of inr.group.children)
      if(dressGroups.indexOf(c) < 0)
        throw new Error('built-in shell scenery survived a whole house: ' + (c.name || c.type));
    /* the other two dressing GROUPS stand, with their stand-ins untouched:
       they are machinery, and bjRedress still has to choose between three */
    /* REVERSED IN PLACE BY RULING CN.  It demanded all three dressing groups
       stay children of the scene, which was right when the other two were merely
       darkened; "only one house exist in the world at a time" makes exactly one a
       child and holds the rest OUT of the graph.  The thing this line is for —
       an unmodelled dressing must not be destroyed by a house landing next to it
       — is unchanged and is what the mesh count still proves. */
    const inWorld = inr.group.children.filter(c => dressGroups.indexOf(c) >= 0);
    if(inWorld.length !== 1)
      throw new Error(inWorld.length + ' dressings are in the world at once (RULING CN says one)');
    if(inWorld[0] !== inr.dress[inr.dressOn])
      throw new Error('the dressing in the world is not the one being worn');
    for(const g of dressGroups){
      if(g === inWorld[0]) continue;
      if(az.SHOW.offstage.indexOf(g) < 0)
        throw new Error('a dressing group vanished instead of being held offstage');
    }
    for(let i = 1; i < 3; i++)
      if(meshCount(dressGroups[i]) !== otherCounts[i-1])
        throw new Error('an unmodelled dressing lost meshes to the house swap');
    const wf = findByName(inr.dress.maitland, 'walk_stairs');
    if(inr.walk.indexOf(wf) < 0) throw new Error('the house stairs missed sc.walk');
    return 'maitland house in, ' + shellBefore + ' shell objects out, deetz and bj dressings intact';
  });

  /* RULING BP — the texture that is SHRUNK rather than refused.  His exports
     each carry one 4096 map because that is what the tool emits; 4096 RGBA is
     67MB of GPU memory and every set stays resident once they park backstage. */
  await P('an oversized texture is brought down to the budget, not refused', async () => {
    const big = {image: {width: 4096, height: 4096}, needsUpdate: false};
    const ok  = {image: {width: 1024, height: 1024}, needsUpdate: false};
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(),
                                new THREE.MeshStandardMaterial());
    mesh.material.map = big;
    mesh.material.normalMap = ok;
    const root = new THREE.Group(); root.add(mesh);

    const r = w.bjShrinkTextures(root);
    if(r.shrunk !== 1) throw new Error(r.shrunk + ' textures shrunk, wanted exactly 1');
    if(r.from !== 4096) throw new Error('it reported coming down from ' + r.from);
    if(big.image.width !== 2048 || big.image.height !== 2048)
      throw new Error('the 4096 map is now ' + big.image.width + 'x' + big.image.height);
    if(!big.needsUpdate) throw new Error('the texture was resized without being marked for upload');
    if(ok.image.width !== 1024) throw new Error('a map already inside the budget was touched');
    /* and the whole point: it now PASSES the validator instead of being
       refused, which is what lets his files load as they are */
    if(w.bjValidateModel(root))
      throw new Error('still refused after shrinking: ' + w.bjValidateModel(root));
    return '4096 -> 2048, the 1024 left alone, and the model validates';
  });

  await P('a map shared across meshes keeps its aspect, and an empty one is survived', async () => {
    const shared = {image: {width: 4096, height: 2048}, needsUpdate: false};
    const root = new THREE.Group();
    for(let i = 0; i < 3; i++){
      const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
      m.material.map = shared;                 // the same object on all three
      m.material.aoMap = {image: null};        // a texture with nothing in it yet
      root.add(m);
    }
    const r = w.bjShrinkTextures(root);
    if(r.shrunk !== 1)
      throw new Error(r.shrunk + ' shrinks reported for one shared map');
    /* the long side goes to the cap and the aspect is KEPT: 4096x2048 -> 2048x1024 */
    if(shared.image.width !== 2048 || shared.image.height !== 1024)
      throw new Error('aspect lost: ' + shared.image.width + 'x' + shared.image.height);
    /* NOTE, so nobody strengthens this by mistake: the `seen` Set in
       bjShrinkTextures is an OPTIMISATION with no observable effect.  Remove it
       and the first mesh still shrinks the map, after which it is inside the
       cap and the other two decline — same count, same result, just three
       canvases instead of one.  A negative check proved exactly that, so this
       test claims the aspect and the empty-map survival and nothing more. */
    return 'shared 4096x2048 -> 2048x1024, aspect kept, empty map survived';
  });

  /* RULING BP — FIT AND SEAT.  Every one of the seven files that arrived is
     normalised to a ~1.9-unit box centred on the origin, which is what the
     export tool emits and not what MODELING.md asks for.  Straight in, a set
     would stand a seventh of its size with half of it under the deck. */
  /* REWRITTEN IN PLACE FOR RULING BX, not replaced — the AO/AV/BA precedent.
     It used to fit a 1.9 CUBE and demand exactly 13.40m of width, and it used
     to demand the footprint be CENTRED on z.  Both were correct under BP and
     are wrong now, for reasons worth keeping on the record:

       - a cube fitted to 13.40m wide is 13.40m TALL, in a 9.20m opening.  The
         width was never reachable for that shape; the old expectation only
         held because nothing looked up.
       - centring the footprint on z centres it on the PROSCENIUM, which
         stands at z = 0.

     So the fixture is now doc-shaped — wide, low, shallow, the proportions
     MODELING.md actually asks for — which is what makes the width the binding
     ratio and keeps this test about what it was always about: that a unit-box
     delivery is scaled up to the declared width and seated on the deck. The
     new caps get their own tests below. */
  await P('a unit-box model is fitted to its declared width and seated on the deck', async () => {
    /* deliberately OFF-CENTRE and OFF-DECK.  The first version of this test
       used a box centred on the origin, which made the centring unobservable
       — a negative check that removed the centring entirely passed, because a
       centred box is already centred. */
    const g = new THREE.BoxGeometry(1.9, 0.9, 1.2);
    const root = new THREE.Group();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial());
    m.position.set(0.7, -0.4, -1.1);
    root.add(m);
    const s = w.bjFitAndSeat(root, 13.4);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    if(Math.abs(size.x - 13.4) > 0.01)
      throw new Error('fitted to ' + size.x.toFixed(2) + 'm, wanted 13.40');
    /* THE DECK IS y = 0 ON EVERY STAGE (INVARIANTS) — the model's lowest
       point, not its origin, is what goes there */
    if(Math.abs(box.min.y) > 0.01)
      throw new Error('seated with its base at y=' + box.min.y.toFixed(3) + ', wanted 0');
    const c = box.getCenter(new THREE.Vector3());
    if(Math.abs(c.x) > 0.01)
      throw new Error('footprint off centre at x=' + c.x.toFixed(2));
    /* and its downstage face is upstage of the arch, which is BX's half of it */
    if(box.max.z > 0)
      throw new Error('it reaches z=' + box.max.z.toFixed(2) + ', downstage of the arch');
    if(Math.abs(s - 13.4/1.9) > 0.01) throw new Error('reported a scale of ' + s);
    return '1.9 units -> 13.40m wide (x' + s.toFixed(2) + '), base on the deck, ' +
           'centred on x, downstage face at z=' + box.max.z.toFixed(2);
  });

  await P('a model already in metres is left near enough alone, and scale still wins', async () => {
    const mk = (wid, hei) => {
      const r = new THREE.Group();
      r.add(new THREE.Mesh(new THREE.BoxGeometry(wid, hei, 4), new THREE.MeshStandardMaterial()));
      return r;
    };
    /* fitting a 13.4m set to 13.4m is a scale of 1.0 — the clause that means
       a conforming export is not mangled by this */
    const s1 = w.bjFitAndSeat(mk(13.4, 8), 13.4);
    if(Math.abs(s1 - 1) > 1e-6) throw new Error('a metres model was rescaled by ' + s1);
    /* an explicit scale beats a measurement: the manifest can still override */
    const r2 = mk(1.9, 1.9);
    if(!w.bjApplyModel({scene:'attic', scale:2, fit:13.4}, r2))
      throw new Error('the apply refused');
    r2.updateMatrixWorld(true);
    const sz = new THREE.Box3().setFromObject(r2).getSize(new THREE.Vector3());
    if(Math.abs(sz.x - 3.8) > 0.05)
      throw new Error('scale:2 was overridden by fit — came out ' + sz.x.toFixed(2) + 'm wide');
    return 'metres model untouched (x1.00); an explicit scale:2 beat fit:13.4';
  });

  /* AND THE WIRING.  Every test above called bjFitAndSeat directly, so a
     negative check that stopped bjApplyModel ever calling it broke nothing —
     the third time this session that a function was proved and its wiring was
     not.  Through the REAL manifest entry, at the real scale his files are. */
  await P('a real manifest entry fits and seats through the apply path', async () => {
    /* the fixture went 1.9 x 1.6 x 1.4 -> 1.9 x 0.9 x 1.2 for RULING BX: at
       1.6 units tall the HEIGHT cap binds first and the set lands 10.57m wide,
       which is correct behaviour and makes this test's subject (does the apply
       path reach fit-and-seat at all?) unobservable.  Doc-shaped, so width
       binds. */
    const root = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 1.2),
                             new THREE.MeshStandardMaterial());
    m.position.set(0.5, 0.9, 0);          // off-centre and floating
    root.add(m);
    const entry = az.BJ_MODELS.attic;     // fit: 13.4, no explicit scale
    if(entry.scale) throw new Error('the attic entry has an explicit scale; pick another for this test');
    if(!w.bjApplyModel(entry, root)) throw new Error('the apply refused');
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    if(Math.abs(size.x - entry.fit) > 0.05)
      throw new Error('landed ' + size.x.toFixed(2) + 'm wide, the manifest says ' + entry.fit);
    /* it lands INSIDE the flyer, whose own position is not the deck, so the
       check is that the apply path scaled and seated it — not its world y */
    if(size.x < 5) throw new Error('it landed at tool scale: ' + size.x.toFixed(2) + 'm');
    return 'the attic entry landed ' + size.x.toFixed(2) + 'm wide from a 1.9-unit file';
  });

  await P('a model lands INSIDE the mover that carries the set, not beside it', async () => {
    /* THE CLOSET IS THE CASE, and it is new: RULING CS gives it a SECOND mover
       (the depth it stands at in the wing) on top of the wrapper it travels on.
       bjApplyModel used to choose its route by COUNTING part movers — one meant
       "a wrapped flying set", more than one meant "the cemetery, deal the nodes
       out by the sign of their x" — so a set with a park as well as a wrapper
       took the cemetery's route and its model landed in whichever group the
       dealing picked, with the stand-in stripped out from under it.  Seen once
       already, on the roof, as a set that measured as an empty box.

       A count is not a kind.  `all` is the name that means "the whole set travels
       on this one", and this asserts the model ends up under it. */
    const sc = w.sceneFind('closet');
    if(!sc) throw new Error('there is no closet scene');
    if(!sc.pmv || !sc.pmv.all) throw new Error('the closet carries no all-of-it wrapper');
    if(Object.keys(sc.pmv).length < 2)
      throw new Error('the closet has one mover, so this test cannot see the fault it is for');
    const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 1.2),
                            new THREE.MeshStandardMaterial()));
    if(!w.bjApplyModel(az.BJ_MODELS.closet, root)) throw new Error('the apply refused');
    let under = null;
    for(let k = root.parent; k; k = k.parent) if(k === sc.pmv.all.group) under = k;
    if(!under)
      throw new Error('the model landed outside the wrapper — it will not travel with the set');
    return 'landed under ' + sc.pmv.all.group.name + ', with ' +
           Object.keys(sc.pmv).length + ' movers on the scene';
  });

  await P('every manifest entry declares a width, and it matches the doc', async () => {
    const doc = fs.readFileSync(require('path').join(__dirname, '..', 'docs', 'MODELING.md'), 'utf8');
    for(const k of Object.keys(az.BJ_MODELS)){
      const e = az.BJ_MODELS[k];
      if(!e.fit) throw new Error(k + ' declares no fit width, so it lands at whatever the tool emitted');
      if(!(e.fit > 3 && e.fit <= 14.8))
        throw new Error(k + ' fits to ' + e.fit + 'm; the hard cap is 14.8');
    }
    /* MODELING.md must tell him what those numbers are, or the contract is
       one-sided — the doc/manifest pin, extended to the widths */
    if(doc.indexOf('fit') < 0 && doc.indexOf('scaled to') < 0)
      throw new Error('MODELING.md never explains that models are scaled to a declared width');
    return Object.keys(az.BJ_MODELS).length + ' entries, every one with a width inside the cap';
  });

  /* ══ RULING BX — A SET IS FITTED TO THE ROOM, NOT JUST TO ITS WIDTH ═══════
     BP's fit-and-seat was right about the width and silent about the other two
     dimensions, and his models are proportionally much taller and deeper than
     the targets in MODELING.md.  Measured through the real importer
     (tools/models.js, and these are the numbers those tests use):

       attic   1.898 x 0.916 x 1.454  ->  13.40 x  6.47 x 10.26   0.26m too deep
       roof    1.898 x 1.227 x 1.544  ->  13.40 x  8.66 x 10.90   0.90m too deep
       house   1.911 x 1.793 x 1.824  ->  12.80 x 12.01 x 12.22   2.81m ABOVE a
                                                                  9.20m opening

     and every one of them centred on z = 0, where the proscenium also stands,
     so the two flying sets landed with over five metres of set downstage of
     the arch — out over the audience.                                       */
  const HIS = {                      // his real boxes, off the glb containers
    attic: [1.898, 0.916, 1.454],
    roof:  [1.898, 1.227, 1.544],
    house: [1.911, 1.793, 1.824]
  };
  const hisRoot = k => {
    const r = new THREE.Group();
    r.add(new THREE.Mesh(new THREE.BoxGeometry(HIS[k][0], HIS[k][1], HIS[k][2]),
                         new THREE.MeshStandardMaterial()));
    return r;
  };
  const boxOf = o => { o.updateMatrixWorld(true); return new THREE.Box3().setFromObject(o); };

  await P('a set taller than the picture is fitted to the OPENING, not to its width', async () => {
    if(az.BJ_FIT_AIR === undefined)
      throw new Error('BJ_FIT_AIR is not in the build — RULING BX is unbuilt');
    const root = hisRoot('house');
    const s = w.bjFitAndSeat(root, 12.8);
    const box = boxOf(root), size = box.getSize(new THREE.Vector3());
    const cap = az.BJ.opH - az.BJ_FIT_AIR;
    if(size.y > cap + 0.01)
      throw new Error('his house stands ' + size.y.toFixed(2) + 'm in a ' +
                      az.BJ.opH + 'm opening');
    if(size.x > 12.8 + 0.01)
      throw new Error('it grew past its declared width to ' + size.x.toFixed(2) + 'm');
    /* UNIFORM, so nothing is ever distorted: the one scale is the height ratio,
       which is the binding one for this set */
    const want = cap / HIS.house[1];
    if(Math.abs(s - want) > 0.01)
      throw new Error('scaled x' + s.toFixed(3) + ', wanted the height ratio x' + want.toFixed(3));
    if(Math.abs(size.z - HIS.house[2] * s) > 0.02)
      throw new Error('the depth did not ride the same scale — it is distorted');
    return 'his house ' + size.x.toFixed(2) + ' x ' + size.y.toFixed(2) + ' x ' +
           size.z.toFixed(2) + ' inside a ' + az.BJ.opW + ' x ' + az.BJ.opH + ' opening';
  });

  await P('a set deeper than the stage is fitted to the stage depth', async () => {
    if(az.BJ_SET_DEPTH === undefined)
      throw new Error('BJ_SET_DEPTH is not in the build — RULING BX is unbuilt');
    /* his attic is the shallow-but-wide one: on width alone it came out
       10.26m deep against the ~10m MODELING.md declares available */
    const root = hisRoot('attic');
    const s = w.bjFitAndSeat(root, 13.4);
    const size = boxOf(root).getSize(new THREE.Vector3());
    if(size.z > az.BJ_SET_DEPTH + 0.01)
      throw new Error('his attic is ' + size.z.toFixed(2) + 'm deep on a ' +
                      az.BJ_SET_DEPTH + 'm stage');
    const want = az.BJ_SET_DEPTH / HIS.attic[2];
    if(Math.abs(s - want) > 0.01)
      throw new Error('scaled x' + s.toFixed(3) + ', wanted the depth ratio x' + want.toFixed(3));
    return 'his attic ' + size.x.toFixed(2) + ' x ' + size.y.toFixed(2) + ' x ' +
           size.z.toFixed(2) + ' on a ' + az.BJ_SET_DEPTH + 'm stage';
  });

  await P('a set is seated UPSTAGE of the arch, never centred on it', async () => {
    /* UPSTAGE IS -z (INVARIANTS) and the proscenium stands at z = 0, so
       centring the footprint on the origin puts half of every set in the
       auditorium.  His roof did it by 5.45m.

       THE GUARD IS NOT DECORATION: without it this assertion PASSED against
       the pre-change build.  `box.max.z > -undefined + 0.01` is
       `5.45 > NaN`, which is false, so a set hanging five metres over the
       audience sailed through — the weak-assertion trap arriving by way of
       arithmetic on an undefined constant rather than by a lazy comparison. */
    if(az.BJ_FIT_AIR === undefined || az.BJ_SET_DEPTH === undefined)
      throw new Error('BJ_FIT_AIR/BJ_SET_DEPTH are not in the build — RULING BX is unbuilt');
    const root = hisRoot('roof');
    w.bjFitAndSeat(root, 13.4);
    const box = boxOf(root);
    if(box.max.z > -az.BJ_FIT_AIR + 0.01)
      throw new Error('it reaches z=' + box.max.z.toFixed(2) +
                      ' — downstage of the arch, over the audience');
    /* and it must not have been shoved so far up it is through the back wall */
    if(box.min.z < -az.BJ_SET_DEPTH - az.BJ_FIT_AIR - 0.01)
      throw new Error('it starts at z=' + box.min.z.toFixed(2) + ', past the stage depth');
    /* the deck and the centring are BP's and must survive */
    if(Math.abs(box.min.y) > 0.01)
      throw new Error('base at y=' + box.min.y.toFixed(3));
    const c = box.getCenter(new THREE.Vector3());
    if(Math.abs(c.x) > 0.01) throw new Error('footprint off centre at x=' + c.x.toFixed(2));
    return 'his roof sits z ' + box.min.z.toFixed(1) + '..' + box.max.z.toFixed(1) +
           ', wholly upstage of an arch at z=0';
  });

  await P('a set drawn to the doc\'s own ratios is untouched by any of the caps', async () => {
    /* THE CLAUSE THAT KEEPS BX INVISIBLE.  A model that obeys MODELING.md is
       limited by its width and lands at exactly the width it asks for — so
       this rule only ever bites a set that would not have fitted anyway. */
    const r = new THREE.Group();
    r.add(new THREE.Mesh(new THREE.BoxGeometry(13.4, 6.0, 5.0), new THREE.MeshStandardMaterial()));
    const s = w.bjFitAndSeat(r, 13.4);
    if(Math.abs(s - 1) > 1e-6)
      throw new Error('a conforming set was rescaled by ' + s);
    const size = boxOf(r).getSize(new THREE.Vector3());
    if(Math.abs(size.x - 13.4) > 0.01)
      throw new Error('it landed ' + size.x.toFixed(2) + 'm wide, not its declared 13.40');
    return 'a doc-shaped set: x1.00, 13.40m wide, caps never engaged';
  });

  /* AND THE WIRING, through the REAL manifest entry — the lesson from BP's own
     round, where three separate functions were proved while nothing proved
     bjApplyModel ever called them.

     REWRITTEN IN PLACE FOR RULING CB.  It used to demand the house fit UNDER
     the opening height, which is what BX did and what the owner then overruled:
     "make the houses wide enought to stretch from one side of the prosinium to
     the other ... its fine if the house is a little taller than the prosinium".
     So the expectation flips — the house must FILL the picture side to side and
     is allowed to overrun the border — and the assertion that replaces it is
     stronger than the one it replaces, because the thing that can now go wrong
     is not "too tall" but "stretched", "through the brick", or "no longer
     filling". It pins all three. */
  await P('his house FILLS the picture through the real apply path (CB)', async () => {
    if(az.BJ_FIT_AIR === undefined || az.BJ_SET_DEPTH === undefined)
      throw new Error('BJ_FIT_AIR/BJ_SET_DEPTH are not in the build — RULING BX is unbuilt');
    const e = az.BJ_MODELS.houseMaitland;
    if(!e.fillWidth) throw new Error('the house entry does not declare fillWidth — CB is unbuilt');
    const inr = w.sceneFind('interior');
    const root = hisRoot('house');
    if(!w.bjApplyModel(e, root)) throw new Error('the apply refused');
    /* measure in the DRESSING's own frame: the wagon is parked at
       BJ_WAGON_BACK, so a world box would be reading the wagon's offset and
       calling it the set's position */
    const par = root.parent;
    if(par !== inr.dress.maitland)
      throw new Error('it did not land in the maitland dressing');
    /* updateWorldMatrix walks the PARENTS, which updateMatrixWorld does not —
       and the landed subtree is frozen (matrixAutoUpdate false), so a stale
       ancestor would be read as the set's own position */
    root.updateWorldMatrix(true, true);
    const inv = new THREE.Matrix4().copy(par.matrixWorld).invert();
    const box = new THREE.Box3().setFromObject(root).applyMatrix4(inv);
    const size = box.getSize(new THREE.Vector3());

    /* 1. IT FILLS THE PICTURE, which is the whole instruction.  Landing short
          leaves bare stage and open wings either side of it. */
    if(Math.abs(size.x - az.BJ.opW) > 0.02)
      throw new Error('it landed ' + size.x.toFixed(2) + 'm wide in a ' + az.BJ.opW +
                      'm opening — ' + ((az.BJ.opW - size.x)/2).toFixed(2) +
                      'm of bare stage each side');
    /* 2. AND IT IS NOT STRETCHED.  Reaching that width by scaling x alone would
          have distorted every door and window by 43%; the ratios must survive. */
    const raw = HIS.house;
    for(const [i, got, name] of [[1, size.y, 'height'], [2, size.z, 'depth']]){
      const want = raw[i] / raw[0] * size.x;
      if(Math.abs(got - want) > 0.03)
        throw new Error('the ' + name + ' is ' + got.toFixed(2) + 'm where a uniform scale ' +
                        'gives ' + want.toFixed(2) + 'm — the set is distorted');
    }
    /* 3. THE BORDER MAY MASK IT; THE BRICK MAY NOT BE WALKED THROUGH. */
    if(box.min.z < az.D.backWall)
      throw new Error('it reaches z=' + box.min.z.toFixed(2) +
                      ', through the back wall at ' + az.D.backWall);
    /* 4. RULING CD — IT SITS FURTHER UPSTAGE than the arch clearance every
          other set gets: "make it so the houses slide up a little further".
          At 12.98m deep with its face 0.30m off the arch it stood on top of the
          audience, where the shell it replaced kept its landing at z -6.6. */
    if(!e.upstage) throw new Error('the house entry asks for no upstage push — RULING CD is unbuilt');
    const want = -(az.BJ_FIT_AIR + e.upstage);
    if(Math.abs(box.max.z - want) > 0.02)
      throw new Error('its face is at z=' + box.max.z.toFixed(2) + ', wanted ' + want.toFixed(2) +
                      ' (' + e.upstage + 'm upstage of the usual clearance)');
    /* and BX's seating survives untouched */
    if(box.max.z > -az.BJ_FIT_AIR + 0.01)
      throw new Error('through the apply path it reaches z=' + box.max.z.toFixed(2));
    if(Math.abs(box.min.y) > 0.01)
      throw new Error('through the apply path its base is at y=' + box.min.y.toFixed(3));
    return 'houseMaitland fills the ' + az.BJ.opW + 'm picture: ' + size.x.toFixed(2) + ' x ' +
           size.y.toFixed(2) + ' x ' + size.z.toFixed(2) + ', undistorted, ' +
           (size.y - az.BJ.opH).toFixed(2) + 'm behind the border, base on the deck';
  });

  /* ══ RULING CC — THE WHOLE SET IS LIT UNLESS THE CUE SAYS OTHERWISE ═════
     "do something to make sure that unless i said otherwise in the cue that the
     entire set is lit up."  His sets run 12.98m front to back where our shell
     was a wall and a staircase, and the rig aims at positions chosen for the
     shell, so the upstage half stood dark with no cue saying so.            */
  await P('an imported set lights itself, and follows the rig rather than a fixed level (CC)', async () => {
    if(typeof w.bjUpdateSetFill !== 'function')
      throw new Error('bjUpdateSetFill is not in the build — RULING CC is unbuilt');
    const root = hisRoot('house');
    const mat = new THREE.MeshStandardMaterial({map:new THREE.Texture()});
    root.children[0].material = mat;
    if(!w.bjApplyModel(az.BJ_MODELS.houseMaitland, root)) throw new Error('the apply refused');
    if((az.SHOW.bjFill || []).indexOf(mat) < 0)
      throw new Error('the landed material was never registered for the fill');
    /* HIS DETAIL SURVIVES: the emissive follows his own map, so a lit set is not
       a flat glowing block */
    if(mat.emissiveMap !== mat.map)
      throw new Error('the emissive does not follow his texture — the set would go flat');

    /* A BLACKOUT STAYS BLACK.  This is the guard that keeps his instruction from
       meaning "a lit set in the dark": the show has real blackouts and the act
       break is one. */
    az.SHOW.bjFillCue = 1;
    for(const f of az.FIXTURES) f._lvl = 0;
    az.SHOW.bjFillNow = 0.5;                          // start it LIT, so the
    for(let i = 0; i < 120; i++) w.bjUpdateSetFill(1/60);   // fade down is real
    if(mat.emissiveIntensity > 0.02)
      throw new Error('the set is lit at ' + mat.emissiveIntensity.toFixed(3) +
                      ' with every fixture at zero — a blackout would not be black');

    /* AND A LIT CUE LIGHTS THE WHOLE SET, without the cue saying anything */
    let stage = 0;
    for(const f of az.FIXTURES){ if(!f.audience){ f._lvl = 1; stage += f.power; } }
    if(!stage) throw new Error('no stage fixtures to light with');
    for(let i = 0; i < 240; i++) w.bjUpdateSetFill(1/60);
    if(mat.emissiveIntensity < 0.3)
      throw new Error('a fully lit rig only got the set to ' + mat.emissiveIntensity.toFixed(3));
    const full = mat.emissiveIntensity;

    /* THE AUDIENCE RIG IS NOT SET LIGHT.  Eight blinders pointed at the house
       are not lighting the scenery, and counting them would light the set in
       cues whose only lit channels point the other way. */
    for(const f of az.FIXTURES) f._lvl = f.audience ? 1 : 0;
    for(let i = 0; i < 240; i++) w.bjUpdateSetFill(1/60);
    if(mat.emissiveIntensity > 0.02)
      throw new Error('the audience rig alone lit the set to ' + mat.emissiveIntensity.toFixed(3));

    /* AND A CUE THAT SAYS OTHERWISE WINS */
    for(const f of az.FIXTURES) f._lvl = f.audience ? 0 : 1;
    az.SHOW.bjFillCue = 0;
    for(let i = 0; i < 240; i++) w.bjUpdateSetFill(1/60);
    if(mat.emissiveIntensity > 0.02)
      throw new Error('fill:0 was ignored — the set is at ' + mat.emissiveIntensity.toFixed(3));
    az.SHOW.bjFillCue = 1;
    return 'dark rig -> 0.000, full rig -> ' + full.toFixed(3) +
           ', audience rig alone -> 0.000, fill:0 -> 0.000';
  });

  await P('the fill NEVER touches a stand-in material (the shared-material trap)', async () => {
    /* Stand-in materials are shared across scenes AND shows (TRAPS: freeing one
       would strip another), so an emissive written onto one would quietly light
       the same material in four other productions.  Only what bjApplyModel
       landed may be registered. */
    /* THIS TEST BUILDS ITS OWN STATE, and two earlier attempts at it did not,
       which is worth recording because both looked like real leaks:

         1. naming cemetery/bedroom/closet/afterlife as "the scenes he did not
            model" — but earlier tests in this file land hand-built models INTO
            the cemetery, so by here its materials really are imported;
         2. deriving the same list from sc.group.userData.bjApplied — which is
            set by loadSetModels and NOT by bjApplyModel, so a suite that calls
            the apply directly leaves every scene looking like a stand-in.

       Both reported "1 material in the cemetery is registered" and both were
       measuring the suite rather than the code.  So: reload the show, snapshot
       what our OWN build made, land exactly one model, and compare. */
    w.showLoad('beetlejuice');
    const ours = [];
    for(const sc of az.SHOW.scenes)
      sc.group.traverse(o=>{
        if(!o.isMesh || !o.material) return;
        const l = Array.isArray(o.material) ? o.material : [o.material];
        for(const m of l) if(ours.indexOf(m) < 0) ours.push(m);
      });
    if(!ours.length) throw new Error('the fresh build has no stand-in materials at all');
    if((az.SHOW.bjFill || []).length)
      throw new Error('a freshly loaded show already has ' + az.SHOW.bjFill.length +
                      ' materials registered, before anything was imported');

    /* their emissive state BEFORE, because several of ours are BUILT with a
       white emissive on purpose — the sign's panel and its arrow face carry
       emissiveMap textures.  Pattern-matching "has a white emissive" flagged
       those two and was a false positive; what matters is that nothing CHANGED. */
    const was = ours.filter(m => m.emissive).map(m => ({m,
      e: m.emissive.getHex(), ei: m.emissiveIntensity, em: m.emissiveMap}));

    const root = hisRoot('attic');
    const mine = new THREE.MeshStandardMaterial();
    root.children[0].material = mine;
    if(!w.bjApplyModel(az.BJ_MODELS.attic, root)) throw new Error('the apply refused');

    const reg = az.SHOW.bjFill || [];
    if(reg.indexOf(mine) < 0) throw new Error('the imported material was not registered');
    const leaked = reg.filter(m => ours.indexOf(m) >= 0);
    if(leaked.length)
      throw new Error(leaked.length + ' of our own shared materials were registered for the ' +
                      'fill — the same material is used by other productions');
    if(reg.length !== 1)
      throw new Error(reg.length + ' materials registered by one imported set, wanted 1');
    /* and not one of ours was ALTERED — colour, intensity or map */
    const moved = was.filter(r => r.m.emissive.getHex() !== r.e ||
                                  r.m.emissiveIntensity !== r.ei ||
                                  r.m.emissiveMap !== r.em);
    if(moved.length)
      throw new Error(moved.length + ' of our own shared materials had their emissive ' +
                      'changed by the import — that would light them in other shows too');
    /* the fill really does drive the imported one, so the comparison above is
       between a material that moved and materials that did not */
    az.SHOW.bjFillCue = 1;
    for(const f of az.FIXTURES) f._lvl = f.audience ? 0 : 1;
    for(let i = 0; i < 240; i++) w.bjUpdateSetFill(1/60);
    if(!(mine.emissiveIntensity > 0.3))
      throw new Error('the imported material never lit, so nothing was being compared');
    return '1 imported material registered and lit to ' + mine.emissiveIntensity.toFixed(2) +
           '; ' + was.length + ' of our own shared materials unchanged';
  });

  await P('every cue lights the set unless it says otherwise, and the plot still has its dark', async () => {
    /* bjCues() RELOADS the show and hands back the LIVE array, so it is called
       once and not followed by another showLoad — a second load rebuilds CUES
       and would leave this holding the previous load's objects while fireCue
       fired the new ones (the stale-reference trap, already in this file's own
       notes about captured CUES). */
    const cues = az.bjCues();
    const stated = cues.filter(c => c.fill !== undefined);
    /* A MODEL HAS TO BE IN, or this whole test is free.  bjUpdateSetFill returns
       immediately when nothing is registered, so the act-break check below read
       an undefined SHOW.bjFillNow and passed — a negative check that replaced
       the rig term with a fixed level sailed straight through it.  The fill has
       to have something to drive before "it stays dark" means anything. */
    const root = hisRoot('attic');
    const mat = new THREE.MeshStandardMaterial();
    root.children[0].material = mat;
    if(!w.bjApplyModel(az.BJ_MODELS.attic, root)) throw new Error('the apply refused');
    if(!(az.SHOW.bjFill || []).length) throw new Error('nothing registered — the test would be vacuous');

    /* THE REAL FRAME IS THREE CALLS, not one.  updateStorm alone does not move
       the rig: updateFades drives f.level off the cue's fade and updateRig turns
       that into f._lvl, which is what the set fill reads.  Stepping only
       updateStorm left the fixtures wherever the previous test had put them —
       which is how this assertion first "failed" against correct code. */
    let clock = 0;
    const step = dt => { clock += dt; w.updateFades(dt); w.updateRig(dt, clock); w.updateStorm(dt); };

    const i = cues.findIndex(c => c.fill === undefined && c.lx && c.lx.some(x => x.lvl > 0.5));
    if(i < 0) throw new Error('no lit cue that leaves fill unstated — nothing to check');
    w.fireCue(i);
    if(az.SHOW.bjFillCue !== 1)
      throw new Error('a cue that says nothing set the fill to ' + az.SHOW.bjFillCue + ', not 1');
    /* it really lights the set through the REAL frame path, not just the field */
    for(let k = 0; k < 300; k++) step(1/60);
    const onLit = mat.emissiveIntensity;
    if(!(onLit > 0.05))
      throw new Error('a lit cue that says nothing left the set at ' + onLit.toFixed(3));

    /* and the act break, a real blackout, still puts nothing on it */
    const dark = cues.findIndex(c => /END OF HALF/.test(c.label));
    if(dark < 0) throw new Error('no act-break blackout to check');
    w.fireCue(dark);
    for(let k = 0; k < 600; k++) step(1/60);
    if(mat.emissiveIntensity > 0.02)
      throw new Error('the act-break blackout leaves the set lit at ' +
                      mat.emissiveIntensity.toFixed(3));

    /* AND `fill` ON A CUE REALLY REACHES IT, through fireCue rather than by
       writing SHOW.bjFillCue here.  A negative check that made showCueExtras
       ignore the field entirely passed against the version of this suite that
       set the field itself — proving the function while never proving its
       wiring, which is the fourth time that has happened in this project.
       The plot states no fill anywhere, so one is put on a cue and fired. */
    cues[i].fill = 0;
    try{
      w.fireCue(i);
      if(az.SHOW.bjFillCue !== 0)
        throw new Error('fill:0 on a cue never reached the show (bjFillCue is ' +
                        az.SHOW.bjFillCue + ')');
      for(let k = 0; k < 300; k++) step(1/60);
      if(mat.emissiveIntensity > 0.02)
        throw new Error('a cue saying fill:0 still lit the set to ' +
                        mat.emissiveIntensity.toFixed(3));
      /* and taking it off again brings the set back, so the field is read per
         cue and not latched */
      delete cues[i].fill;
      w.fireCue(i);
      for(let k = 0; k < 300; k++) step(1/60);
      if(!(mat.emissiveIntensity > 0.05))
        throw new Error('removing fill left the set dark at ' +
                        mat.emissiveIntensity.toFixed(3) + ' — the field latched');
    } finally { delete cues[i].fill; }

    return cues.length + ' cues, ' + stated.length + ' stating a fill; an unstated lit cue ' +
           'lit the set to ' + onLit.toFixed(2) + ', the act break took it to 0.000, ' +
           'and fill:0 on that cue took it to 0.000 through fireCue';
  });

  /* ══ RULING CA — HIS SIGN, OUR LAMPS ════════════════════════════════════ */
  await P('his sign is HUNG, not seated on the deck at the arch', async () => {
    const e = az.BJ_MODELS.sign;
    if(!e) throw new Error('there is no sign entry — RULING CA is unbuilt');
    if(!e.centre) throw new Error('the sign entry names no centre, so it would be seated like a set');
    const sc = w.sceneFind('bjSign');
    const root = new THREE.Group();
    /* his sign, to the millimetre: a flat face, 1.898 x 0.899 x 0.024 */
    root.add(new THREE.Mesh(new THREE.BoxGeometry(1.898, 0.899, 0.024),
                            new THREE.MeshStandardMaterial()));
    if(!w.bjApplyModel(e, root)) throw new Error('the apply refused');
    root.updateWorldMatrix(true, true);
    sc.group.updateWorldMatrix(true, false);
    const inv = new THREE.Matrix4().copy(sc.group.matrixWorld).invert();
    const b = new THREE.Box3().setFromObject(root).applyMatrix4(inv);
    const size = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    if(Math.abs(size.x - e.fit) > 0.02)
      throw new Error('it landed ' + size.x.toFixed(2) + 'm wide, wanted ' + e.fit);
    for(const [i, ax] of [[0,'x'],[1,'y'],[2,'z']])
      if(Math.abs(c[ax] - e.centre[i]) > 0.02)
        throw new Error('hung at ' + ax + '=' + c[ax].toFixed(2) + ', wanted ' + e.centre[i]);
    /* THE TWO THINGS THAT WOULD BE WRONG IF IT WERE TREATED AS A SET: it would
       be sitting on the deck, and it would be shoved upstage of the arch —
       where it would be behind the house curtain it is meant to hang in front
       of (RULING AS). */
    if(b.min.y < 1.0)
      throw new Error('the sign is on the floor (base y=' + b.min.y.toFixed(2) + ') — it was seated, not hung');
    if(b.max.z < 0)
      throw new Error('the sign is upstage of the arch at z=' + b.max.z.toFixed(2) +
                      ' — it hangs DOWNSTAGE of the curtain');
    return 'hung ' + size.x.toFixed(2) + 'm wide, centred ' +
           c.x.toFixed(2) + '/' + c.y.toFixed(2) + '/' + c.z.toFixed(2) + ', clear of the deck';
  });

  /* ══ RULING CF — AND THE LAMPS COME OFF THE BOX AND ONTO THE SIGN ═══════
     REVERSED IN PLACE, the AO/AV/BA/BI/BQ precedent, sixth time.  RULING CA's
     assertion demanded TWO lamp materials, each with its own merged mesh, and it
     was right about the thing it was guarding: two materials registered, tintable
     and used by nothing is a silent failure and every signCol cue in the plot
     would have tinted a sign that never changes colour.

     What has changed is WHOSE geometry answers for them.  "The lights for the
     beetlejuice sign arent on the sign they are just a box around it" — and they
     were: bjSignLamps measured his 99k-triangle marquee's bounding box and hung a
     bead ring and a tube outline round its perimeter.  The lamps are HIS OWN
     MATERIAL now, so the guard has to check the registry points at geometry his
     file actually uses, and that no ring is hung round it.  The tint-and-restore
     half is untouched and still load-bearing. */
  await P('the sign\'s lamps are HIS OWN sign, and nothing is hung round it (CF)', async () => {
    const reg = az.SHOW.signLamps;
    if(!reg || !reg.length) throw new Error('the sign registered no lamp materials at all');
    const sc = w.sceneFind('bjSign');

    /* NOT A RING.  The two names are the geometry CA minted; CF stops minting it,
       and a mesh by either name means the box is back. */
    for(const n of ['bj:signBulbs', 'bj:signNeon'])
      if(findByName(sc.group, n))
        throw new Error(n + ' is still hung round the sign — that is the box he objected to');

    /* every registered lamp is used by a mesh in the scene, and that mesh is one
       his file landed rather than one of ours */
    const users = reg.map(() => 0);
    let hisMeshes = 0;
    sc.group.traverse(o => {
      if(!o.isMesh) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      let mine = false;
      reg.forEach((r, i) => { if(list.indexOf(r.mat) >= 0){ users[i]++; mine = true; } });
      if(mine && !(o.name || '').startsWith('bj:')) hisMeshes++;
    });
    reg.forEach((r, i) => {
      if(!users[i])
        throw new Error('lamp material ' + i + ' is used by NO mesh — ' +
                        'every signCol cue would tint nothing');
    });
    if(!hisMeshes)
      throw new Error('the lamps are on OUR geometry, not on his sign');

    /* SELF-LIT.  A marquee hanging in front of the curtain has to read at the
       pre-show, where the stage rig is at zero — so it carries its own glow
       rather than borrowing the rig's (that is the other half of CF). */
    for(const r of reg)
      if(!(r.mat.emissiveIntensity > 0))
        throw new Error('a lamp material sits at emissiveIntensity ' +
                        r.mat.emissiveIntensity + ' — the sign is dark of itself');

    /* and a signCol cue really does move them, and give them back */
    const before = reg.map(r => r.mat.color.getHexString());
    w.setSignLamps('#ff1e10');
    const after = reg.map(r => r.mat.color.getHexString());
    if(after.join() === before.join())
      throw new Error('setSignLamps moved no lamp');
    w.setSignLamps(null);
    if(reg.map(r => r.mat.color.getHexString()).join() !== before.join())
      throw new Error('the lamps never got their own colour back');
    return reg.length + ' lamp material(s), all on his own ' + hisMeshes +
           ' mesh(es), self-lit and tinting through setSignLamps';
  });

  await P('the sign is lit while the stage rig is dark (CF)', async () => {
    /* bjApplyModel registers everything it lands for the RULING CC set fill,
       which drives emissiveIntensity from the STAGE RIG's own output — and the
       plot's first cue is "PRE-SHOW ... the sign lit" with the rig at zero.  So
       the sign on that list is dark for the whole pre-show and the only lit thing
       on it is the ring.  CF takes it off the list. */
    const reg = az.SHOW.signLamps || [];
    if(!reg.length) throw new Error('no lamp materials to check');
    const fill = az.SHOW.bjFill || [];
    for(const r of reg)
      if(fill.indexOf(r.mat) >= 0)
        throw new Error('the sign is on the RULING CC fill list — it goes dark whenever the rig does');
    /* measured, not reasoned: black the rig out through the real frame and read
       the marquee back */
    az.FIXTURES.forEach(f => { f.level = 0; f._lvl = 0; });
    let clock = 0;
    const step = dt => { clock += dt; w.updateFades(dt); w.updateRig(dt, clock); w.updateStorm(dt); };
    for(let k = 0; k < 300; k++) step(1/60);
    const lit = Math.min.apply(null, reg.map(r => r.mat.emissiveIntensity));
    if(!(lit > 0.05))
      throw new Error('with the rig black the sign sits at ' + lit.toFixed(3) + ' — it went out with the stage');
    return 'rig at 0, the marquee still lit at ' + lit.toFixed(2) + ', and off the fill list';
  });

  await P('the sign\'s lamps travel with it when it flies out', async () => {
    /* they ride HIS mesh now rather than a minted ring, and the mesh is under the
       scene GROUP, which is what the y mover moves — a lamp left behind in the air
       would be the frozen-group trap by another route (TRAPS: read the world
       matrix, never position) */
    const reg = az.SHOW.signLamps || [];
    const sc = w.sceneFind('bjSign');
    let found = null;
    sc.group.traverse(o => {
      if(found || !o.isMesh) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      if(reg.some(r => list.indexOf(r.mat) >= 0)) found = o;
    });
    if(!found) throw new Error('no mesh inside the sign scene carries a lamp material');
    const wy = () => { found.updateWorldMatrix(true, false); return found.matrixWorld.elements[13]; };
    const y0 = wy();
    w.sceneMoveTo('bjSign', 9.0);
    for(let i = 0; i < 40; i++) w.sceneMoveStep(0.25);
    const y1 = wy();
    if(y1 - y0 < 4.0)
      throw new Error('the lamps moved ' + (y1 - y0).toFixed(2) + 'm while the sign flew 9m');
    w.sceneMoveTo('bjSign', 0);
    for(let i = 0; i < 40; i++) w.sceneMoveStep(0.25);
    if(Math.abs(wy() - y0) > 0.05)
      throw new Error('they did not come back with it');
    return 'his lit sign rode out ' + (y1 - y0).toFixed(2) + 'm and back';
  });

  /* ══ RULING CL — THE PALACE HOLDS THE WHOLE HOUSE SET ═══════════════════ */
  await P('his house fits behind the brick when the wagon slides back (CL)', async () => {
    /* "Make the back wall of the palace go a little farther back to fit the
       entir hous set."

       THE STAND-IN IS THE COMFORTABLE CASE HERE, which is the inverse of the
       RULING BQ trap and the reason this went unseen: the stand-in interior
       parked at BJ_WAGON_BACK measures z -19.24..-11.56 and clears a brick at
       -21.50 by 2.26m, so the existing synchronous assertion ("parked it stands
       in the brick") passes and always would.  HIS house is 12.98m deep and
       measures -24.78..-11.80 — 3.28m of it out in the street.

       Built from his own normalised box through the REAL manifest entry, so it
       carries CB's fill and CD's upstage seat rather than a number typed here. */
    const inr = w.sceneFind('interior');
    if(!inr || !inr.mv) throw new Error('the interior does not travel');
    if(az.PAL_BACK === undefined || az.BJ_WAGON_BACK === undefined)
      throw new Error('PAL_BACK / BJ_WAGON_BACK are not in the build');

    const root = hisRoot('house');
    if(!w.bjApplyModel(az.BJ_MODELS.houseMaitland, root))
      throw new Error('the whole-house apply refused');
    w.bjDress(inr, 'maitland');

    /* WORLD BOX, after stepping the mover — never mv.off.  A mover parked at its
       target proves nothing about the geometry (TRAPS), and the set is frozen, so
       reading position back would report the record rather than the room. */
    const zbox = () => {
      const b = new THREE.Box3();
      az.SHOW.group.updateMatrixWorld(true);
      inr.group.traverse(o => { if(o.isMesh) b.expandByObject(o); });
      return b;
    };
    const home = zbox();
    w.sceneMoveTo('interior', az.BJ_WAGON_BACK);
    for(let i = 0; i < 4000 && w.sceneTravelling(inr); i++) w.sceneMoveStep(1/60);
    const back = zbox();
    const deep = home.max.z - home.min.z;
    if(!(deep > 11))
      throw new Error('the fixture is only ' + deep.toFixed(2) + 'm deep — his house is 12.98, ' +
                      'so this would pass on a set that was never the problem');
    if(back.min.z < az.PAL_BACK)
      throw new Error('parked back it reaches z=' + back.min.z.toFixed(2) +
                      ', ' + (az.PAL_BACK - back.min.z).toFixed(2) + 'm through the brick at ' + az.PAL_BACK);
    /* and the deepening is the PALACE's alone — D.backWall is the stage
       coordinate every plot and both Arc houses are written to */
    if(az.D.backWall !== -17)
      throw new Error('D.backWall moved to ' + az.D.backWall + ' — the deepening leaked into the box');
    w.sceneMoveTo('interior', 0);
    for(let i = 0; i < 4000 && w.sceneTravelling(inr); i++) w.sceneMoveStep(1/60);
    return 'his ' + deep.toFixed(2) + 'm house parks at z ' + back.min.z.toFixed(2) +
           '..' + back.max.z.toFixed(2) + ', clear of the brick at ' + az.PAL_BACK +
           ' by ' + (back.min.z - az.PAL_BACK).toFixed(2) + 'm';
  });

  await P('a filling set is still stopped by the back wall', async () => {
    /* The border may mask the top; the brick may not be walked through.  This
       needs a FIXTURE rather than his geometry: his houses reach z -13.28
       against a wall at -17, so the bound never binds for them, and a negative
       check that deleted it passed for exactly that reason — the bound was
       unobservable, not sound.  A deliberately deep set makes it observable. */
    const r = new THREE.Group();
    r.add(new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.0, 6.0), new THREE.MeshStandardMaterial()));
    w.bjFitAndSeat(r, 13.6, true);
    const box = boxOf(r), size = box.getSize(new THREE.Vector3());
    const avail = Math.abs(az.D.backWall) - az.BJ_FIT_AIR;
    if(size.z > avail + 0.01)
      throw new Error('a filling set came out ' + size.z.toFixed(2) +
                      'm deep with only ' + avail.toFixed(2) + 'm of stage behind the arch');
    if(box.min.z < az.D.backWall - 0.01)
      throw new Error('it reaches z=' + box.min.z.toFixed(2) + ', past the brick at ' + az.D.backWall);
    /* and it gave up WIDTH to do it, uniformly — the brick outranks the picture */
    if(size.x > az.BJ.opW - 0.01)
      throw new Error('it kept its full width AND its depth: ' + size.x.toFixed(2) + 'm');
    if(Math.abs(size.z / size.x - 6.0 / 1.9) > 0.02)
      throw new Error('it was squashed rather than scaled to fit the depth');
    return 'a 6-deep fixture filled to ' + size.x.toFixed(2) + 'm wide, stopped at ' +
           size.z.toFixed(2) + 'm deep by brick at ' + az.D.backWall + ', undistorted';
  });

  await P('a set that does NOT ask to fill is still capped by the opening (BX survives CB)', async () => {
    /* CB is opt-in per entry and that is the load-bearing half of it: the attic
       and the roof are depth-limited, not height-limited, and must not quietly
       start overrunning the border because the houses were allowed to. */
    for(const k of ['attic', 'roof', 'closet', 'bedroom', 'graveyard', 'netherworld', 'houseExterior'])
      if(az.BJ_MODELS[k].fillWidth)
        throw new Error(k + ' declares fillWidth; CB was scoped to the three interiors');
    const root = hisRoot('house');            // the tallest thing he sent
    w.bjFitAndSeat(root, 13.6);               // no fill flag
    const size = boxOf(root).getSize(new THREE.Vector3());
    if(size.y > az.BJ.opH - az.BJ_FIT_AIR + 0.01)
      throw new Error('an unflagged set stands ' + size.y.toFixed(2) + 'm in a ' +
                      az.BJ.opH + 'm opening — the cap is gone for everyone');
    if(size.z > az.BJ_SET_DEPTH + 0.01)
      throw new Error('an unflagged set is ' + size.z.toFixed(2) + 'm deep — the depth cap is gone');
    return 'unflagged: ' + size.x.toFixed(2) + ' x ' + size.y.toFixed(2) + ' x ' +
           size.z.toFixed(2) + ', still inside the opening and the stage depth';
  });

  /* THE BUDGET NUMBER ITSELF (RULING BP).  A negative check putting it back to
     30,000 changed nothing, because nothing here was asserting what it is —
     only that things over it are refused.  His models are 93k-99.5k, so the
     test that matters is that a model of HIS size gets in. */
  await P('a 100k model of his size passes, and 160k is still refused', async () => {
    if(az.BJ_TRI_BUDGET !== 150000)
      throw new Error('the triangle budget is ' + az.BJ_TRI_BUDGET + ', RULING BP set 150,000');
    const tri = n => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 9), 3));
      const root = new THREE.Group();
      root.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial()));
      return root;
    };
    const his = w.bjValidateModel(tri(100000));
    if(his) throw new Error('a 100,000-triangle model is refused: ' + his);
    /* and the old number really would have refused it — the whole point of BP */
    if(100000 <= 30000) throw new Error('arithmetic');
    const over = w.bjValidateModel(tri(160000));
    if(!over) throw new Error('160,000 triangles was accepted');
    if(over.indexOf('160,000') < 0 || over.indexOf('150,000') < 0)
      throw new Error('the refusal does not name the count and the budget: ' + over);
    return '100k in, 160k out ("' + over + '")';
  });

  /* AND THE WIRING, not just the function.  A negative check that took the
     shrink out of the fetch round killed nothing, because every test above
     called bjShrinkTextures directly — the same shape of hole as the RULING BM
     assertion that recomputed the shader formula instead of reading it. */
  await P('the fetch round really does shrink before it validates', async () => {
    const order = [];
    const realShrink = w.bjShrinkTextures, realValidate = w.bjValidateModel;
    w.bjShrinkTextures = root => { order.push('shrink'); return realShrink(root); };
    w.bjValidateModel  = root => { order.push('validate'); return realValidate(root); };
    w.fetch = url => (url === 'assets/bj-attic.glb')
      ? Promise.resolve({ok: true, arrayBuffer: async () => makeGlb([{name: 'a', x: 0}])})
      : Promise.resolve({ok: false, status: 404});
    try{
      w.showLoad('beetlejuice');
      await w.loadSetModels();
    } finally {
      w.bjShrinkTextures = realShrink; w.bjValidateModel = realValidate; delete w.fetch;
    }
    if(order.indexOf('shrink') < 0) throw new Error('the fetch round never shrank anything');
    if(order.indexOf('validate') < 0) throw new Error('the fetch round never validated anything');
    if(order.indexOf('shrink') > order.indexOf('validate'))
      throw new Error('it validated before shrinking, so an oversized map is still refused');
    return 'shrink then validate, in that order, through the real fetch path';
  });

  console.log(errs.length ? '--- failures: ' + errs.length + ' (with the AZ tail) ---'
                          : '--- failures: 0 (with the AZ tail) ---');
  clearTimeout(wd);
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.log('AZ TAIL THREW: ' + e.message); clearTimeout(wd); process.exit(1); });
