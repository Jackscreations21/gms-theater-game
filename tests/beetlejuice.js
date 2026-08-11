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
    const t = byName('bj:portalTrim');
    if(!t) throw new Error('no portal trim');
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

  /* one material for every trim strip: a material per object is the
     draw-call trap, and an array material is worse (TRAPS.md) */
  P('the cold trim is ONE shared material, not one per strip', ()=>{
    showLoad('beetlejuice');
    const t = byName('bj:portalTrim');
    if(Array.isArray(t.material)) throw new Error('the trim uses an array material');
    let strips = 0;
    t.traverse(o=>{ if(o.isMesh) strips++; });
    if(strips !== 1) throw new Error('the trim is '+strips+' meshes, it should be merged to one');
    if(!t.material.emissive) throw new Error('the trim does not glow');
    return 'one merged mesh, one emissive material';
  });

  P('the neon frames the opening and returns into the wings', ()=>{
    showLoad('beetlejuice');
    const t = byName('bj:portalTrim');
    const b2 = box(t);
    /* it must SURROUND the picture, not sit across the top of it */
    if(b2.min.y > 0.4) throw new Error('there is no sill: the neon starts at y='+b2.min.y.toFixed(2));
    if(b2.max.y < BJ.opH - 0.2) throw new Error('the neon does not reach the header');
    /* and it must run UPSTAGE — that is the wings half of the ask */
    const deep = b2.max.z - b2.min.z;
    if(deep < 4) throw new Error('the neon is '+deep.toFixed(2)+'m deep — it does not go into the wings');
    /* never wider than the house opening, wings or no wings */
    const wide = Math.max(Math.abs(b2.min.x), Math.abs(b2.max.x));
    if(wide > D.procW/2) throw new Error('the neon is '+(wide*2).toFixed(2)+'m across a '+D.procW+' opening');
    /* blue-green, and one material for the lot */
    if(Array.isArray(t.material)) throw new Error('the neon uses an array material');
    const e = t.material.emissive;
    if(!e) throw new Error('the neon does not glow');
    if(!(e.b > e.r && e.g > e.r))
      throw new Error('the neon is not blue-green: r='+e.r.toFixed(2)+' g='+e.g.toFixed(2)+' b='+e.b.toFixed(2));
    let n = 0; t.traverse(o=>{ if(o.isMesh) n++; });
    if(n !== 1) throw new Error('the neon is '+n+' meshes, it should be merged to one');
    return (wide*2).toFixed(1)+'m across, '+deep.toFixed(1)+'m into the wings, one merged mesh';
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

  P('the house is its own scene, and a substantial one', ()=>{
    showLoad('beetlejuice');
    const h = sceneFind('house');
    if(!h) throw new Error('there is no house scene');
    if(h.on) throw new Error('the house is live at the top of the show — the cemetery is');
    sceneShow('house');
    let m = 0; h.group.traverse(o=>{ if(o.isMesh) m++; });
    if(m < 10) throw new Error('the house is only '+m+' pieces');
    if(!byName('bj:house')) throw new Error('no main mass');
    return m+' pieces';
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

  /* sceneWalk's whole point: you cannot stand on a porch that is not on stage */
  P('the porch is walkable only while the house is on the stage', ()=>{
    showLoad('beetlejuice');
    const f = (()=>{ let r=null; SHOW.group.traverse(o=>{ if(!r && o.name==='bj:porchFloor') r=o; }); return r; })();
    if(!f) throw new Error('no porch floor was built');
    if(WALKABLE.indexOf(f) >= 0)
      throw new Error('you can stand on the porch while the cemetery is up');
    sceneShow('house');
    if(WALKABLE.indexOf(f) < 0) throw new Error('the porch is not walkable with the house on');
    const b = box(f);
    if(b.max.y < 0.3) throw new Error('the porch is at deck level, y='+b.max.y.toFixed(2));
    sceneShow('cemetery');
    if(WALKABLE.indexOf(f) >= 0)
      throw new Error('the porch stayed walkable after the house went off');
    return 'porch at y='+b.max.y.toFixed(2)+', in WALKABLE only while the house is live';
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

  P('firing the act two cue actually swaps the set', ()=>{
    showLoad('beetlejuice');
    const i = CUES.findIndex(c=>c.scene === 'house');
    if(i < 0) throw new Error('no cue plays in the house');
    fireCue(i);
    if(SHOW.scene !== 'house') throw new Error('the live scene is still '+SHOW.scene);
    const cem = sceneFind('cemetery');
    if(cem.on) throw new Error('the cemetery is still on with the house');
    let lit = 0; cem.group.traverse(o=>{ if(o.layers && o.layers.mask !== 0) lit++; });
    if(lit) throw new Error(lit+' cemetery pieces still test against a ray');
    return 'cue '+CUES[i].n+' put the house on and made the cemetery inert';
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

  P('the last cue fires confetti, and it falls and clears itself', ()=>{
    showLoad('beetlejuice');
    const last = CUES[CUES.length - 1];
    if(!last.confetti) throw new Error('the last cue does not fire confetti');
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
    return 'backdrop in at '+bd.pos.toFixed(2)+' footing at '+foot.toFixed(2)+', sky out at '+sk.pos.toFixed(2);
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
      if(m < 6) throw new Error(n+' is only '+m+' pieces');
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
    /* and a CUE is what chooses the dressing, the way it chooses the set */
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
    const b = box(byName('bj:redWall')), a = box(byName('bj:bjWall'));
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

  /* act one now plays across four sets; the interval re-dresses for act two */
  console.log('--- the plot: measured times, interpreted levels ---');

  P('it stands by at the top with a preset and the house open', ()=>{
    showLoad('beetlejuice');
    if(CUES.length < 12) throw new Error('only '+CUES.length+' cues');
    if(nextCue !== 1) throw new Error('stands by at '+nextCue);
    if(CUES[0].n > 1) throw new Error('the first cue is '+CUES[0].n+', not a preset');
    if(HOUSE.house < 0.4) throw new Error('loads with the house down, that is mid-show');
    return CUES.length+' cues, standing by at '+CUES[1].label;
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
    while(CUES[nextCue] && CUES[nextCue].n <= 2 && guard++ < 6){
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
    if(up.house < 0.9) throw new Error('the interval house is only at '+up.house);
    return 'act break dark at cue '+down.n+', interval house at '+up.house;
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
    const missing = [], holds = [];
    for(let i = 0; i < CUES.length - 1; i++)
      if(!(CUES[i].follow > 0)){ (CUES[i].hold ? holds : missing).push(CUES[i].n); }
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
    /* the warmers cue went with the re-time; the cue that throws the front UP
       at the cloth is now the last one of the show, where the curtain is in */
    const warm = CUES.find(c=>/confetti, curtain in/.test(c.label));
    if(!warm) throw new Error('no cue throws the front at the cloth');
    const up = warm.lx.slice(0, 6).filter(r=>r.aim && r.aim[1] > 5);
    if(up.length < 4) throw new Error('the warmers cue does not aim the front high');
    const plain = CUES.find(c=>/the moon takes the upstage/.test(c.label));
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

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); }
catch(e){ console.log('TOP LEVEL THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
process.exit((w.__errs||[]).length ? 1 : 0);
