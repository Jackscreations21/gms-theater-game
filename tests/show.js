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
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,150):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); window.__errs.push(name+': '+e.message); } };
  function count(root){
    let meshes=0, tris=0;
    root.traverse(o=>{ if(o.isMesh && o.geometry){ meshes++;
      const idx=o.geometry.index, pos=o.geometry.attributes.position;
      const t = idx?idx.count/3:(pos?pos.count/3:0);
      tris += t*(o.isInstancedMesh?o.count:1); }});
    return {meshes, tris:Math.round(tris)};
  }

  console.log('--- the shows system ---');
  P('there is a show to load', ()=>{
    if(!SHOWS.outsiders) throw new Error('no Outsiders preset');
    if(!SHOWS.outsiders.name || !SHOWS.outsiders.blurb) throw new Error('unlabelled');
    return SHOWS.outsiders.name;
  });
  P('the tab and its buttons exist', ()=>{
    for(const id of ['#p-show','#showList','#showLoadBtn','#showStrikeBtn','#fxRain','#fxBolt','#fxStorm','#fxFire'])
      if(!document.querySelector(id)) throw new Error('missing '+id);
    if(!document.querySelector('#tabs button[data-p="show"]')) throw new Error('no SHOWS tab');
    return 'all present';
  });
  P('it loads in', ()=>{
    const ok = showLoad('outsiders');
    if(!ok) throw new Error('showLoad returned false');
    if(!SHOW.group) throw new Error('nothing was built');
    const c = count(SHOW.group);
    if(c.meshes < 12) throw new Error('only '+c.meshes+' meshes — that is not a set');
    return c.meshes+' meshes, '+(c.tris/1000).toFixed(1)+'k triangles';
  });
  P('the set is on the stage, not loose in the world', ()=>{
    if(SHOW.group.parent !== ROOM_GROUP.stage)
      throw new Error('the set is parented to '+(SHOW.group.parent && SHOW.group.parent.name));
    // from the lobby with the doors shut, the stage and its set come off
    setAllDoors(false); for(let i=0;i<200;i++) updateDoors(0.05);
    Player.mode='walk'; Player.pos.z = FOH.z0 + 5; updateRooms(true);
    if(ROOM_GROUP.stage.visible) throw new Error('the stage is drawn from a shut lobby');
    Player.pos.z = -4; updateRooms(true);
    if(!SHOW.group.visible || !ROOM_GROUP.stage.visible) throw new Error('the set is not drawn on stage');
    return 'culls with the stage';
  });
  P('the frame is a skeleton you see through, in front of a lit wall', ()=>{
    if(!SHOW.wall) throw new Error('no wall behind the frame');
    const wb = worldBox(SHOW.wall);
    const fb = worldBox(SHOW.group);
    if(!(wb.min.z < D.backWall + 3.2)) throw new Error('the wall is not upstage enough');
    // the frame must stand clear in front of it, not against it
    let frameZ = null;
    SHOW.group.traverse(o=>{ if(o.isInstancedMesh && o.count > 10 && frameZ === null){
      const b = worldBox(o); frameZ = b.min.z; }});
    if(!(frameZ > wb.max.z + 1.5)) throw new Error('the frame is flat against the wall');
    // and you must be able to see the wall through it: fire a grid of rays
    const eye = new THREE.Vector3(0, 2.0, 12.0);
    SHOW.group.traverse(o=>{ if(o.isInstancedMesh && o !== (SHOW.rain&&SHOW.rain.mesh)) delete o.raycast; });
    world.updateMatrixWorld(true);
    const ray = new THREE.Raycaster();
    let set = 0, through = 0;
    for(let i=0;i<40;i++) for(let j=0;j<28;j++){
      const x = -6.6 + (i/39)*13.2, y = 0.6 + (j/27)*9.2;
      ray.set(eye, new THREE.Vector3(x-eye.x, y-eye.y, -11.6-eye.z).normalize());
      ray.far = 60;
      const h = ray.intersectObject(SHOW.group, true);
      if(!h.length) continue;
      if(h[0].object === SHOW.wall) through++; else set++;
    }
    if(!set) throw new Error('the frame is invisible from the house');
    if(through < set*0.5) throw new Error('it is a wall, not a frame: '+set+' solid to '+through+' see-through');
    return set+' rays land on timber, '+through+' go straight through to the gold';
  });
  P('the batches are not culled the moment you look away', ()=>{
    let bad = [];
    SHOW.group.traverse(o=>{
      if(!o.isInstancedMesh || o === (SHOW.rain && SHOW.rain.mesh)) return;
      // walkable batches keep an honest local sphere and are never culled;
      // only the wide-sphere ones have to cover all their instances
      if(o.frustumCulled === false) return;
      const s = o.geometry.boundingSphere;
      if(!s || s.radius < 0.6) bad.push(o.count+'@'+(s?s.radius.toFixed(2):'none'));
    });
    if(bad.length) throw new Error('bad bounding spheres: '+bad.join(', '));
    return 'every batch has a real bounding sphere';
  });
  P('nothing floats and nothing is buried', ()=>{
    const down = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0,-1,0), 0, 40);
    const solids = [];
    SHOW.group.traverse(o=>{ if(o.isMesh && !o.isInstancedMesh && o.geometry) solids.push(o); });
    let floating = [];
    for(const o of solids){
      o.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(o);
      if(b.min.y > 0.6){
        // something resting on nothing: is there anything under it?
        const c = b.getCenter(new THREE.Vector3());
        down.set(new THREE.Vector3(c.x, b.min.y - 0.02, c.z), new THREE.Vector3(0,-1,0));
        const hits = down.intersectObjects(solids.filter(x=>x!==o), true);
        if(!hits.length && b.min.y > 1.2) floating.push(o.name || o.geometry.type);
      }
      if(b.max.y < -0.4) throw new Error('something is under the deck');
    }
    return solids.length+' solid pieces, '+floating.length+' with air under them (lamps and car parts)';
  });
  P('the set stays inside the stage house', ()=>{
    /* worldBox understands instanced meshes; Box3.setFromObject does not, and
       would measure 59 plank boards as one board sitting at the origin */
    const b = worldBox(SHOW.group);
    if(b.min.z < D.backWall - 0.5) throw new Error('it pokes through the back wall, z='+b.min.z.toFixed(1));
    if(b.max.z > D.apron + D.thrust + 0.5) throw new Error('it is out over the pit, z='+b.max.z.toFixed(1));
    if(Math.abs(b.min.x) > D.stageW/2 + 0.5 || b.max.x > D.stageW/2 + 0.5)
      throw new Error('it runs off into the wings and through the wall');
    return 'x '+b.min.x.toFixed(1)+' to '+b.max.x.toFixed(1)+', z '+b.min.z.toFixed(1)+' to '+b.max.z.toFixed(1);
  });
  P('you can walk the deck, the gallery and the stairs', ()=>{
    const lot = groundAt(0, -4, 3);
    if(lot === null) throw new Error('there is no ground on the deck');
    if(lot < 0.05) throw new Error('the deck is not there, ground at '+lot);
    const gallery = groundAt(0, -11.0, 6);
    if(gallery === null || gallery < 3.0)
      throw new Error('nothing to stand on up in the frame, got '+gallery);
    const landing = groundAt(2.6, -10.9, 9);
    if(landing === null || landing < 6.5)
      throw new Error('the upper landing is not standable, got '+landing);
    const step = groundAt(-6.4, -14.2, 5);
    if(step === null || step < 0.3) throw new Error('the stair is not standable, got '+step);
    return 'deck '+lot.toFixed(2)+'m, gallery '+gallery.toFixed(2)+
           'm, landing '+landing.toFixed(2)+'m, stair '+step.toFixed(2)+'m';
  });
  P('nothing is hung between the audience and the frame', ()=>{
    const frameZ = -11.6;
    const blocking = FLY.filter(l=>l.goods && l.z > frameZ && l.pos < 11 &&
      ['border','legs','valance','house','electric','none'].indexOf(l.goodsKey) === -1);
    if(blocking.length) throw new Error('lineset '+blocking[0].id+' ('+blocking[0].goodsKey+') masks the set');
    const gable = FLY.find(l=>l.goodsKey === 'border');
    if(!gable) throw new Error('no masking at all');
    return 'only borders and legs downstage of the frame';
  });
  P('the gable rafters meet at the peak', ()=>{
    const rafters = [];
    SHOW.group.traverse(o=>{ if(o.userData.part === 'rafter') rafters.push(o); });
    if(rafters.length !== 2) throw new Error('found '+rafters.length+' rafters');
    const ends = [];
    rafters.forEach(r=>{
      r.updateMatrixWorld(true);
      const half = new THREE.Vector3(0, r.userData.len/2, 0).applyQuaternion(r.quaternion);
      const c = r.position.clone();
      ends.push([c.clone().add(half), c.clone().sub(half)]);
    });
    // the two tops must land on each other, at the apex, on the centre line
    const tops = ends.map(e=>e[0].y > e[1].y ? e[0] : e[1]);
    const feet = ends.map(e=>e[0].y > e[1].y ? e[1] : e[0]);
    if(tops[0].distanceTo(tops[1]) > 0.25)
      throw new Error('the rafters do not meet: '+tops[0].distanceTo(tops[1]).toFixed(2)+'m apart');
    if(Math.abs(tops[0].x) > 0.2) throw new Error('the apex is off centre at x='+tops[0].x.toFixed(2));
    tops.forEach(t=>{ if(t.y > 10.9) throw new Error('a rafter overshoots the peak, y='+t.y.toFixed(2)); });
    // and the feet must land on the ends of the plate, not somewhere in mid air
    feet.forEach(f=>{
      if(Math.abs(Math.abs(f.x) - 7.2) > 0.3) throw new Error('a rafter foot misses the plate, x='+f.x.toFixed(2));
      if(Math.abs(f.y - 7.0) > 0.3) throw new Error('a rafter foot is not on the plate, y='+f.y.toFixed(2));
    });
    if(feet[0].x * feet[1].x > 0) throw new Error('both rafters lean the same way');
    return 'they meet at '+tops[0].y.toFixed(2)+'m on centre, feet on the plate';
  });
  P('the balcony is on the audience side of the frame', ()=>{
    // its deck must sit downstage of the frame plane, not tucked in behind it
    const deck = SHOW.walk.find(o=>{
      const b = worldBox(o); return b && b.min.y > 3.0 && b.max.y < 4.2;
    });
    if(!deck) throw new Error('no gallery deck found');
    const b = worldBox(deck);
    if(!(b.min.z > -11.6)) throw new Error('the gallery is upstage of the frame, z='+b.min.z.toFixed(2));
    if(!(b.max.z > -11.0)) throw new Error('it does not project towards the house');
    return 'deck runs z '+b.min.z.toFixed(2)+' to '+b.max.z.toFixed(2)+', frame at -11.60';
  });
  P('the balcony is a platform with a face on it, not floating sticks', ()=>{
    const gallery = groundAt(0, -11.0, 6);
    if(gallery === null || gallery < 3.0) throw new Error('you cannot stand on it');
    // there must be solid timber directly under the front edge, seen from the house
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 2.0, 12.0), new THREE.Vector3());
    SHOW.group.traverse(o=>{ if(o.isInstancedMesh && o !== (SHOW.rain&&SHOW.rain.mesh)) delete o.raycast; });
    world.updateMatrixWorld(true);
    let fascia = 0;
    for(let i=0;i<24;i++){
      const x = -5.0 + (i/23)*10.0, y = 3.32;      // just under the deck line
      const eye = new THREE.Vector3(0, 2.0, 12.0);
      ray.set(eye, new THREE.Vector3(x-eye.x, y-eye.y, -11.6-eye.z).normalize());
      ray.far = 60;
      const h = ray.intersectObject(SHOW.group, true);
      if(h.length && h[0].object !== SHOW.wall) fascia++;
    }
    if(fascia < 18) throw new Error('only '+fascia+' of 24 rays hit the balcony face — it is see-through');
    return fascia+'/24 rays land on the fascia, deck at '+gallery.toFixed(2)+'m';
  });
  P('the tyre is downstage of the curtain and the piles are gone', ()=>{
    if(!SHOW.tyre) throw new Error('no tyre');
    const curtain = FLY.find(l=>GOODS[l.goodsKey] && GOODS[l.goodsKey].traveler);
    if(!curtain) throw new Error('no front curtain to measure against');
    if(!(SHOW.tyre.position.z > curtain.z))
      throw new Error('the tyre is still upstage of the curtain: '+SHOW.tyre.position.z+' vs '+curtain.z);
    // no batch of tori anywhere in the set
    let stacks = 0;
    SHOW.group.traverse(o=>{
      if(o.isInstancedMesh && o.geometry.type === 'TorusGeometry' && o.count > 1) stacks++;
    });
    if(stacks) throw new Error(stacks+' tyre stacks are still there');
    return 'one tyre at z='+SHOW.tyre.position.z.toFixed(1)+', curtain at z='+curtain.z.toFixed(1);
  });
  P('there are climbing frames in both wings', ()=>{
    if(!SHOW.gyms || SHOW.gyms.length < 2) throw new Error('fewer than two frames');
    const [L, R] = SHOW.gyms;
    if(L.x * R.x > 0) throw new Error('both frames are on the same side');
    SHOW.gyms.forEach(g=>{
      if(Math.abs(g.x) < 8) throw new Error('a frame is out in the middle of the stage at x='+g.x);
      if(g.h < 2.5) throw new Error('a frame is only '+g.h+'m tall');
      const top = groundAt(g.x, g.z - 0.85, g.h + 2);
      if(top === null || top < g.h - 0.3)
        throw new Error('you cannot climb the frame at x='+g.x+', got '+top);
    });
    return 'frames at x '+L.x+' and '+R.x+', '+L.h.toFixed(1)+'m and '+R.h.toFixed(1)+'m tall';
  });
  P('the bars track in and back out on the slider', ()=>{
    if(!SHOW.gyms) throw new Error('no climbing frames');
    const home = SHOW.gyms.map(g=>g.home);
    setGymInset(0);
    SHOW.gyms.forEach((g,i)=>{ if(Math.abs(g.x - home[i]) > 0.01)
      throw new Error('zero inset did not park them at home'); });
    setGymInset(5);
    SHOW.gyms.forEach((g,i)=>{
      if(Math.abs(g.x) >= Math.abs(home[i]) - 0.01)
        throw new Error('frame at '+home[i]+' did not come inward, now '+g.x);
      if(g.x * home[i] < 0) throw new Error('a frame crossed the centre line');
    });
    // and the deck moves with the frame, so you can still stand on it
    const g0 = SHOW.gyms[0];
    world.updateMatrixWorld(true);
    const top = groundAt(g0.x, g0.z - 0.85, g0.h + 2);
    if(top === null || top < g0.h - 0.3)
      throw new Error('the deck did not track with the frame, got '+top);
    setGymInset(99);
    if(SHOW.gymIn > 6.5) throw new Error('the slider is not clamped');
    setGymInset(0);
    const slider = document.querySelector('#fxBars');
    if(!slider) throw new Error('no BARS slider on the SHOWS page');
    slider.value = 100; slider.oninput({target:slider});
    if(SHOW.gymIn < 6) throw new Error('the slider did not drive it');
    slider.value = 0; slider.oninput({target:slider});
    return 'tracks 0 to 6.5m in, decks follow, clamped at both ends';
  });
  P('the curtain is on lineset 1 and a black border on lineset 2', ()=>{
    for(const key of Object.keys(SHOWS)){
      showLoad(key);
      if(FLY[0].goodsKey !== SHOW.curtainKey)
        throw new Error(SHOWS[key].name+' has "'+FLY[0].goodsKey+'" on lineset 1');
      if(FLY[1].goodsKey !== 'border')
        throw new Error(SHOWS[key].name+' has "'+FLY[1].goodsKey+'" on lineset 2');
      if(!GOODS[FLY[0].goodsKey].traveler) throw new Error('lineset 1 is not a front curtain');
      if(Math.abs(FLY[1].pos - TRIMS.border) > 0.2) throw new Error('the border is not at its trim');
      // and the border is upstage of the curtain, where masking belongs
      if(!(FLY[1].z < FLY[0].z)) throw new Error('the border hangs downstage of the curtain');
      // nothing is left hanging in front of the curtain
      const inFront = FLY.filter(l=>l.goodsKey !== 'none' && l.z > FLY[0].z);
      if(inFront.length) throw new Error('lineset '+inFront[0].id+' hangs in front of the curtain');
    }
    return 'lineset 1 curtain at z='+FLY[0].z.toFixed(1)+
           ', border on lineset 2 at z='+FLY[1].z.toFixed(1);
  });
  P('the show hangs its own front curtain', ()=>{
    const ls = FLY.find(l=>l.goodsKey === SHOW.curtainKey);
    if(!ls) throw new Error('the show curtain is not hung');
    const spec = GOODS[SHOW.curtainKey];
    if(!spec) throw new Error('it is not on the goods list');
    if(!spec.traveler) throw new Error('it is not a traveler, so it cannot draw');
    if(!ls.goods || ls.goods.children.length !== 2)
      throw new Error('a pair of halves is what makes it draw, got '+
        (ls.goods ? ls.goods.children.length : 0));
    if(Math.abs(ls.pos - TRIMS[SHOW.curtainKey]) > 0.1) throw new Error('not at its trim');
    if(ls.travTarget > 0.01) throw new Error('it should load in, closed');
    // it is painted, not plain velour
    const m = ls.goods.children[0].material;
    if(!m.map) throw new Error('the curtain has no painted cloth on it');
    if(m === M.velour) throw new Error('it is still the house velour');
    return spec.label+' on lineset '+ls.id+' at '+ls.pos.toFixed(1)+'m';
  });
  P('the show curtain draws, and answers the CURTAINS call', ()=>{
    const ls = FLY.find(l=>l.goodsKey === SHOW.curtainKey);
    if(railGroup('curtains').indexOf(ls) === -1)
      throw new Error('the group call does not see it');
    const half = ls.goods.children[0];
    const shut = half.position.x;
    railCall('curtains','open');
    for(let i=0;i<200;i++) updateFly(0.05);
    if(ls.open < 0.9) throw new Error('it did not open, at '+ls.open.toFixed(2));
    const travel = Math.abs(half.position.x - shut);
    if(travel < 1) throw new Error('the halves did not travel, only '+travel.toFixed(2)+'m');
    railCall('curtains','close');
    for(let i=0;i<200;i++) updateFly(0.05);
    if(ls.open > 0.05) throw new Error('it did not shut again');
    if(Math.abs(half.position.x - shut) > 0.05) throw new Error('it did not come back to the middle');
    return 'each half travels '+travel.toFixed(1)+'m off and comes back';
  });
  P('the show curtain still works as a portal', ()=>{
    const ls = FLY.find(l=>l.goodsKey === SHOW.curtainKey);
    ls.pos = ls.target = TRIMS[SHOW.curtainKey];
    ls.open = ls.travTarget = 0;
    Player.mode = 'walk'; Player.pos.z = ls.z - 4;
    updateRooms(true);
    if(ROOM_GROUP.house.visible)
      throw new Error('the auditorium is drawn through a closed show curtain');
    ls.open = ls.travTarget = 1;
    updateRooms(true);
    if(!ROOM_GROUP.house.visible) throw new Error('opening it did not bring the house back');
    ls.open = ls.travTarget = 0;
    return 'a show curtain culls the house the same as the theatre one';
  });
  P('striking the show gives the house its own curtain back', ()=>{
    const key = SHOW.curtainKey;
    showStrike();
    if(GOODS[key]) throw new Error('the show curtain is still on the goods list');
    const back = FLY.find(l=>l.goodsKey === 'house');
    if(!back) throw new Error('the house is left with no curtain at all');
    if(!back.goods) throw new Error('hung but not built');
    if(Math.abs(back.pos - TRIMS.house) > 0.1) throw new Error('it came back at the wrong trim');
    showLoad('outsiders');
    if(!FLY.some(l=>l.goodsKey === SHOW.curtainKey))
      throw new Error('reloading did not hang the show curtain again');
    return 'house curtain restored on lineset '+back.id+', show curtain back on reload';
  });
  P('the round window is up in the gable', ()=>{
    if(!SHOW.window) throw new Error('no window was built');
    if(SHOW.window.y < 7.5) throw new Error('the window is too low to be in the gable');
    if(SHOW.window.r < 1.0) throw new Error('the window is too small to read');
    return 'radius '+SHOW.window.r+'m centred at '+SHOW.window.y+'m';
  });
  P('it loads in its preset, with the house open', ()=>{
    showLoad('outsiders');
    if(HOUSE.house < 0.4) throw new Error('the house is not open, at '+HOUSE.house);
    if(nextCue !== 1) throw new Error('standing by at '+nextCue+', not the top');
    // the preset is not a blackout — you can see the set under house light
    const bed = HOUSE.house + FIXTURES.reduce((a,f)=>a+f.level,0);
    if(bed < 0.3) throw new Error('there is nothing to see at all');
    return 'preset up, house at '+Math.round(HOUSE.house*100)+'%, standing by at cue '+CUES[1].n;
  });

  console.log('--- the plot ---');
  P('fourteen cues plus a preshow', ()=>{
    if(CUES.length < 14) throw new Error('only '+CUES.length+' cues');
    const labels = CUES.map(c=>c.label);
    for(const want of ['rumble','church','drive-in','gold'])
      if(!labels.some(l=>l.toLowerCase().indexOf(want) !== -1))
        throw new Error('no cue for '+want);
    return CUES.length+' cues, '+CUES[0].label+' to '+CUES[CUES.length-1].label;
  });
  P('every cue holds a real look', ()=>{
    CUES.forEach((c,i)=>{
      if(!c.lx || c.lx.length !== FIXTURES.length) throw new Error('cue '+c.n+' has no lx state');
      // the closing cues are meant to be dark
      const closing = /blackout|house up/.test(c.label);
      if(i > 1 && !closing && !c.lx.some(r=>r.lvl > 0.05))
        throw new Error('cue '+c.n+' is a blackout');
    });
    return 'all '+CUES.length+' carry a full '+FIXTURES.length+'-channel state';
  });
  P('firing every cue leaves the rig somewhere sane', ()=>{
    CUES.forEach((c,i)=>{ fireCue(i); for(let k=0;k<40;k++){ updateFades(0.05); updateStorm(0.05); } });
    const lit = FIXTURES.filter(f=>f.level > 0.02).length;
    if(!lit) throw new Error('the last cue is a blackout');
    return lit+' channels up at the curtain call';
  });
  P('the rain comes in and out with the cues', ()=>{
    const dry = CUES.find(c=>c.label.indexOf('drive-in') !== -1);
    const wet = CUES.find(c=>c.rain >= 1);
    if(!wet) throw new Error('no cue calls for rain');
    fireCue(CUES.indexOf(wet));
    for(let k=0;k<80;k++) updateStorm(0.05);
    if(SHOW.rain.level < 0.5) throw new Error('the rain never got going: '+SHOW.rain.level.toFixed(2));
    if(!SHOW.rain.mesh.visible) throw new Error('rain is on but not drawn');
    fireCue(CUES.indexOf(dry));
    for(let k=0;k<120;k++) updateStorm(0.05);
    if(SHOW.rain.level > 0.05) throw new Error('the rain never stopped');
    return 'wet on cue '+wet.n+', dry again on cue '+dry.n;
  });
  P('the storm throws lightning', ()=>{
    const st = CUES.find(c=>c.storm);
    if(!st) throw new Error('no storm cue');
    fireCue(CUES.indexOf(st));
    let peak = 0;
    for(let k=0;k<400;k++){ updateStorm(0.05); peak = Math.max(peak, LIGHTNING.intensity); }
    if(peak < 0.5) throw new Error('no lightning in 20 seconds of storm');
    SHOW.stormOn = false;
    for(let k=0;k<60;k++) updateStorm(0.05);
    if(LIGHTNING.intensity > 0.01) throw new Error('the flash never decayed');
    return 'peak flash '+peak.toFixed(1)+', decays back to black';
  });
  P('the church fire flickers and stops', ()=>{
    const fire = CUES.find(c=>c.fire);
    if(!fire) throw new Error('no fire cue');
    fireCue(CUES.indexOf(fire));
    const seen = [];
    for(let k=0;k<60;k++){ updateStorm(0.05); seen.push(chan(9).level); }
    const lo = Math.min.apply(null,seen), hi = Math.max.apply(null,seen);
    if(hi - lo < 0.05) throw new Error('the firelight is a flat level, not a flicker');
    const after = CUES.find(c=>c.label.indexOf('hospital') !== -1);
    fireCue(CUES.indexOf(after));
    for(let k=0;k<20;k++) updateStorm(0.05);
    if(SHOW.flicker) throw new Error('the fire is still burning in the hospital');
    return 'flickers between '+lo.toFixed(2)+' and '+hi.toFixed(2)+', out on the next cue';
  });
  P('the church actually burns', ()=>{
    if(!SHOW.fire) throw new Error('no fire was built');
    const fire = CUES.find(c=>c.fire && (c.fire.size === undefined || c.fire.size > 0.5));
    if(!fire) throw new Error('no cue lights it');
    fireCue(CUES.indexOf(fire));
    for(let k=0;k<80;k++) updateStorm(0.05);
    if(SHOW.fire.level < 0.6) throw new Error('the fire never caught: '+SHOW.fire.level.toFixed(2));
    if(!SHOW.fire.mesh.visible) throw new Error('alight but not drawn');
    if(!SHOW.fire.embers.visible) throw new Error('no embers');
    if(SHOW.fire.lights.every(l=>l.intensity < 0.5))
      throw new Error('the fire throws no light on the set');
    // the flames have to actually move
    const m = new THREE.Matrix4(), a = new THREE.Vector3(), b = new THREE.Vector3();
    SHOW.fire.mesh.getMatrixAt(3, m); a.setFromMatrixPosition(m);
    for(let k=0;k<10;k++) updateStorm(0.05);
    SHOW.fire.mesh.getMatrixAt(3, m); b.setFromMatrixPosition(m);
    if(a.distanceTo(b) < 0.05) throw new Error('the flames are frozen');
    // it dies back to a smoulder and then goes out
    const smoulder = CUES.find(c=>c.fire && c.fire.size !== undefined && c.fire.size < 0.5);
    if(!smoulder) throw new Error('nothing takes it down to a smoulder');
    fireCue(CUES.indexOf(smoulder));
    for(let k=0;k<120;k++) updateStorm(0.05);
    if(SHOW.fire.level > 0.35) throw new Error('it never died back: '+SHOW.fire.level.toFixed(2));
    const after = CUES.find(c=>c.label.indexOf('hospital') !== -1);
    fireCue(CUES.indexOf(after));
    for(let k=0;k<160;k++) updateStorm(0.05);
    if(SHOW.fire.level > 0.02) throw new Error('the fire is still burning in the hospital');
    if(SHOW.fire.mesh.visible) throw new Error('the flames are still drawn');
    return 'catches, moves, throws light, smoulders, goes out';
  });
  P('the porch light rides the practical master', ()=>{
    if(!SHOW.porch) throw new Error('no practical was built');
    HOUSE.practical = 1; updateStorm(0.05);
    const on = SHOW.porch.lamp.intensity;
    HOUSE.practical = 0; updateStorm(0.05);
    const off = SHOW.porch.lamp.intensity;
    if(!(on > 1 && off < 0.01)) throw new Error('on '+on+' off '+off);
    return 'on at '+on.toFixed(1)+', out at '+off.toFixed(1);
  });
  P('there is a runnable script for it', ()=>{
    if(!SNIPPETS.OUTSIDERS) throw new Error('no OUTSIDERS snippet');
    Prog.loop = false;
    runProgram(SNIPPETS.OUTSIDERS);
    if(!Prog.ops.length) throw new Error('the script did not compile');
    for(let i=0;i<4000;i++){ stepProgram(0.05); updateFades(0.05); updateStorm(0.05); }
    return Prog.ops.length+' operations, ran to the end';
  });

  console.log('--- the top of the show ---');
  P('a show loads in standing by at the top, not halfway through', ()=>{
    for(const key of Object.keys(SHOWS)){
      showLoad(key);
      if(nextCue !== 1)
        throw new Error(SHOWS[key].name+' stands by at cue index '+nextCue+', not the top');
      if(CUES[0].n > 1)
        throw new Error('the first cue is '+CUES[0].n+', that is not a preset');
      /* this read "below 0.4" and had Beetlejuice's old pre-show 0.45 baked
         into it by accident, so RULING BM's retune to 0.30 tripped it — a feel
         constant with a test hanging off it.  What it MEANS is "the preset it
         loaded is a standing-by look, not a mid-show one", so say that: the
         masters came from the preset itself, and the house is up rather than
         in a blackout (a mid-show cue carries house:0). */
      if(HOUSE.house !== CUES[0].house)
        throw new Error(SHOWS[key].name+' loads at house '+HOUSE.house+
                        ', which is not its own preset value '+CUES[0].house);
      if(HOUSE.house <= 0.1)
        throw new Error(SHOWS[key].name+' loads with the house lights down — that is mid-show');
    }
    return 'every show stands by at cue '+CUES[1].n+', preset up, house open';
  });
  P('pressing GO runs it from the beginning', ()=>{
    showLoad('outsiders');
    const first = CUES[nextCue];
    go();
    if(nextCue !== 2) throw new Error('GO jumped to '+nextCue);
    return 'first GO gives you "'+first.label+'"';
  });

  console.log('--- the front curtain in the stack ---');
  P('no cue closes the curtain except the ones that mean to', ()=>{
    for(const key of Object.keys(SHOWS)){
      /* BEETLEJUICE IS EXEMPT (owner, 2026-08-10).  This suite encodes a
         whole-evening convention the other four shows were written to, and
         the fifth is not written to it: its plot came off the owner's own
         reading of the recording, with rulings AR and AU deliberately
         changing the SHAPE of the evening.  It brings the cloth in twice more than the convention allows: once at
         the top so the sign can fly out in front of it, and once at the act
         break the owner puts at 1:11:02.
         Exempted by name, in the open, rather than by loosening the rule for
         everybody — the other four still have to obey it. */
      if(key === 'beetlejuice') continue;
      showLoad(key);
      const ls = frontCurtainLineset();
      if(!ls) throw new Error(SHOWS[key].name+' has no front curtain');
      // it flies now rather than drawing, so "in" is about the trim, not the draw
      const shut = [];
      CUES.forEach(c=>{
        if(!c.fly) return;
        const r = c.fly.find(x=>x.id === ls.id);
        if(r && r.target < OUT_TRIM - 1) shut.push(c.n);
      });
      /* it may be in for the preset and the house-to-half at the top, for the
         three interval cues, and for the last two at the end — never else */
      const lastOpenCue = CUES[CUES.length-3].n;   // the first of the closing cues
      const interval = CUES.filter(c=>/act one ends|INTERVAL|act two/.test(c.label)).map(c=>c.n);
      const wrong = shut.filter(n=>n > 1 && n < lastOpenCue && interval.indexOf(n) === -1);
      if(wrong.length)
        throw new Error(SHOWS[key].name+' closes the curtain on cue '+wrong.join(', '));
      if(shut.indexOf(0.5) === -1) throw new Error('the preset does not have the curtain in');
    }
    return 'the curtain is only in for the preset and the end';
  });
  P('the show starts behind the curtain and one cue takes it out', ()=>{
    for(const key of Object.keys(SHOWS)){
      showLoad(key);
      const ls = frontCurtainLineset();
      const isOut = c=>c.fly && c.fly.find(x=>x.id === ls.id).target > OUT_TRIM - 1;
      // the first two cues keep it in
      for(const n of [0.5, 1]){
        const c = CUES.find(x=>x.n === n);
        if(!c) throw new Error(SHOWS[key].name+' has no cue '+n);
        if(isOut(c)) throw new Error(SHOWS[key].name+' takes the curtain out on cue '+n);
      }
      /* the curtain goes out once at the top of each act — twice in a show
         with an interval, and never more than that */
      const opens = CUES.filter((c,i)=>{
        const prev = CUES[i-1];
        if(!prev) return false;
        return !isOut(prev) && isOut(c);
      });
      if(opens.length !== 2)
        throw new Error(SHOWS[key].name+' has '+opens.length+' cues that take the curtain out');
      // fire it and watch it actually go
      fireCue(0); for(let i=0;i<400;i++) updateFly(0.05);
      if(ls.pos > 14) throw new Error('the preset did not have it in, at '+ls.pos.toFixed(1));
      fireCue(CUES.indexOf(opens[0])); for(let i=0;i<600;i++) updateFly(0.05);
      if(ls.pos < OUT_TRIM - 1)
        throw new Error('the curtain did not fly out, it is at '+ls.pos.toFixed(1));
      if(ls.open > 0.1)
        throw new Error('it drew open instead of flying — open is '+ls.open.toFixed(2));
      for(let i=0;i<200;i++) updateFades(0.05);
      if(!FIXTURES.some(f=>f.level > 0.05))
        throw new Error('the curtain opens onto a blackout');
    }
    return 'both shows sit behind the curtain for two cues, and it flies out once per act';
  });
  /* Only THE LOST BOYS takes a second bow.  Everything else goes straight from
     the call to the curtain coming in, so the tail of the stack is four cues
     for that one and two for the rest — and the shared part is checked the
     same way either way.                                                    */
  P('the end of the night: call, curtain in, warmers, house', ()=>{
    for(const key of Object.keys(SHOWS)){
      /* BEETLEJUICE IS EXEMPT (owner, 2026-08-10).  This suite encodes a
         whole-evening convention the other four shows were written to, and
         the fifth is not written to it: its plot came off the owner's own
         reading of the recording, with rulings AR and AU deliberately
         changing the SHAPE of the evening.  RULING AR ends the show at 2:15:00 — call, then confetti, curtain in and
         house to half — so the call is two cues from the end, not four.  The
         blackout and warmers cues the convention counts on were deleted.
         Exempted by name, in the open, rather than by loosening the rule for
         everybody — the other four still have to obey it. */
      if(key === 'beetlejuice') continue;
      showLoad(key);
      const ls = frontCurtainLineset();
      const labels = CUES.map(c=>c.label.toLowerCase());
      const call = labels.findIndex(l=>l.indexOf('curtain call') !== -1);
      if(call < 0) throw new Error(SHOWS[key].name+' has no curtain call');
      const doubles = (key === 'lostboys');
      const want = doubles ? 6 : 4;
      if(call !== CUES.length - want)
        throw new Error(SHOWS[key].name+' has '+(CUES.length-1-call)+
                        ' cues after the call, want '+(want-1));
      const rest = CUES.slice(call + 1);
      const [bo1, bow] = doubles ? rest : [null, null];
      const [bo2, warm, up] = doubles ? rest.slice(2) : rest;
      const open = c=>c.fly.find(x=>x.id === ls.id).target > OUT_TRIM - 1;
      const dark = c=>!c.lx.some(r=>r.lvl > 0.02);

      // the call itself: full stage, no house
      if(CUES[call].house > 0.02)
        throw new Error('the curtain call has the house up at '+CUES[call].house);
      if(dark(CUES[call])) throw new Error('the curtain call is dark');
      if(!open(CUES[call])) throw new Error('the curtain is in for the call');
      if(CUES[call].fly.find(x=>x.id === ls.id).open > 0.1)
        throw new Error('the curtain is stored drawn open rather than flown out');

      if(doubles){
        if(!/blackout/.test(bo1.label) || !dark(bo1)) throw new Error('no blackout after the call');
        if(!open(bo1)) throw new Error('the first blackout brings the curtain in too early');
        if(bo1.house > 0.02) throw new Error('the house comes up on the first blackout');

        if(!/bow/.test(bow.label) || dark(bow)) throw new Error('the lights do not come back up');
        if(!open(bow)) throw new Error('the second bow happens behind the curtain');
        if(bow.house > 0.02) throw new Error('the house is up for the second bow');
      }

      if(!/blackout/.test(bo2.label) || !dark(bo2)) throw new Error('no blackout to bring it in on');
      if(open(bo2)) throw new Error('that blackout does not bring the curtain in');

      if(!/warmers|title/.test(warm.label)) throw new Error('no cue on the curtain');
      // the front of house has to be pointing UP at the lettering, not at the deck
      const aims = warm.lx.slice(0, 6).filter(r=>r.aim);
      if(aims.length < 4) throw new Error('the warmers cue stores no aim for the front of house');
      if(aims.some(r=>r.aim[1] < 5))
        throw new Error('the front of house is still aimed low, at y='+aims[0].aim[1]);
      // and the auditorium must not come up with it
      const bright = warm.lx.filter(r=>r.lvl > 0.05).length;
      if(bright > 10) throw new Error(bright+' channels up on a curtain cue');
      if(open(warm)) throw new Error('the warmers cue has the curtain open');
      if(dark(warm)) throw new Error('the warmers cue is dark — nothing on the title');
      const front = warm.lx.slice(0, 6).filter(r=>r.lvl > 0.4).length;
      if(front < 4) throw new Error('only '+front+' front-of-house channels on the cloth');
      if(warm.house > 0.02) throw new Error('the house is up over the warmers');

      if(!/house up/.test(up.label)) throw new Error('the house never comes up');
      // half or full, but it has to come up to something you can leave by
      if(up.house < 0.45) throw new Error('the house only comes to '+up.house);
      if(open(up)) throw new Error('the curtain is open when the house comes up');
      if(up.fade < 5) throw new Error('the house snaps up in '+up.fade+'s instead of fading');
      // the warmers stay on the cloth while the house comes up under them
      const stillOn = up.lx.slice(0, 6).filter(r=>r.lvl > 0.4);
      if(stillOn.length < 4)
        throw new Error('the warmers went out with the house up — only '+stillOn.length+' left');
      if(stillOn.some(r=>r.aim && r.aim[1] < 5))
        throw new Error('the warmers dropped off the title');
      // and nothing else is left burning
      const others = up.lx.slice(8).filter(r=>r.lvl > 0.05);
      if(others.length) throw new Error(others.length+' stage channels are still up');
    }
    return 'the Lost Boys takes a second bow; the other three go call, '+
           'curtain in, warmers, house — and the house fades up under them';
  });
  P('only the Lost Boys takes a second bow', ()=>{
    const bows = [];
    for(const key of Object.keys(SHOWS)){
      showLoad(key);
      const n = CUES.filter(c=>/second bow/.test(c.label)).length;
      if(n > 1) throw new Error(SHOWS[key].name+' bows '+n+' times');
      if(n) bows.push(SHOWS[key].name);
    }
    if(bows.length !== 1 || bows[0] !== 'THE LOST BOYS')
      throw new Error('the second bow is on ' + (bows.join(', ') || 'nothing'));
    return 'THE LOST BOYS only — the rest come straight in on the call';
  });
  P('running the whole stack ends with the house up and the title still lit', ()=>{
    showLoad('lostboys');
    CUES.forEach((c,i)=>{ fireCue(i); for(let k=0;k<60;k++){ updateFades(0.05); updateFly(0.05); } });
    for(let k=0;k<400;k++){ updateFades(0.05); updateFly(0.05); }
    const ls = frontCurtainLineset();
    if(ls.pos > TRIMS[ls.goodsKey] + 0.5) throw new Error('the curtain never came back in');
    if(HOUSE.house < 0.45) throw new Error('the house is at '+HOUSE.house);
    const front = FIXTURES.slice(0, 6).filter(f=>f.level > 0.4).length;
    if(front < 4) throw new Error('the red went out at the end');
    const rest = FIXTURES.slice(8).filter(f=>f.level > 0.05).length;
    if(rest) throw new Error(rest+' stage channels are still lit at the end');
    return 'curtain in, house full, '+front+' warmers still on the title';
  });

  P('the Lost Boys title cues are red and aimed high', ()=>{
    showLoad('lostboys');
    const warm = CUES.find(c=>/title/.test(c.label) && c.n > 10);
    const top  = CUES.find(c=>/warmers on the title/.test(c.label));
    if(!warm || !top) throw new Error('the title cues are missing');
    for(const c of [warm, top]){
      const front = c.lx.slice(0, 6);
      const red = front.filter(r=>{
        const n = parseInt(r.col.slice(1), 16);
        const R = (n>>16)&255, G = (n>>8)&255, B = n&255;
        return R > 150 && G < 90 && B < 90;
      });
      if(red.length < 4) throw new Error('"'+c.label+'" is not red — only '+red.length+' channels');
      const aims = front.filter(r=>r.aim && r.aim[1] > 5);
      if(aims.length < 4) throw new Error('"'+c.label+'" is not aimed up at the sign');
    }
    // and the aim goes back down for the show itself
    const mid = CUES.find(c=>/structure revealed/.test(c.label));
    const low = mid.lx.slice(0, 6).filter(r=>r.aim && r.aim[1] < 4);
    if(low.length < 4) throw new Error('the front of house never comes back down for the show');
    return 'both title cues red and aimed at y=7.4, back down for the show';
  });
  P('the room stays dark while the stage is lit', ()=>{
    showLoad('lostboys');
    const q = CUES.findIndex(c=>/structure revealed/.test(c.label));
    fireCue(q);
    for(let i=0;i<200;i++){ updateFades(0.05); updateRig(0.05, 1); }
    if(HOUSE.house > 0.02) throw new Error('the house is up during the show');
    if(ambient.intensity > 0.09)
      throw new Error('the auditorium is lit at '+ambient.intensity.toFixed(3));
    const bg = scene.background.r + scene.background.g + scene.background.b;
    if(bg > 0.03) throw new Error('the background is not dark: '+bg.toFixed(3));
    // and there is real light on the stage
    if(!FIXTURES.some(f=>f._lvl > 0.4)) throw new Error('nothing is lighting the stage');
    return 'ambient '+ambient.intensity.toFixed(3)+' with the rig up — the room stays out';
  });

  console.log('--- the lost boys ---');
  P('every show has an interval about halfway through', ()=>{
    for(const key of Object.keys(SHOWS)){
      /* BEETLEJUICE IS EXEMPT (owner, 2026-08-10).  This suite encodes a
         whole-evening convention the other four shows were written to, and
         the fifth is not written to it: its plot came off the owner's own
         reading of the recording, with rulings AR and AU deliberately
         changing the SHAPE of the evening.  RULING AU makes the interval a HOLD that waits for a button on the
         console, and the cue that ends act one is labelled END OF HALF.
         Exempted by name, in the open, rather than by loosening the rule for
         everybody — the other four still have to obey it. */
      if(key === 'beetlejuice') continue;
      showLoad(key);
      const ls = frontCurtainLineset();
      const isOut = c=>c.fly.find(x=>x.id === ls.id).target > OUT_TRIM - 1;
      const i = CUES.findIndex(c=>/INTERVAL/.test(c.label));
      if(i < 0) throw new Error(SHOWS[key].name+' has no interval');
      const [down, up, back] = [CUES[i-1], CUES[i], CUES[i+1]];
      if(!/act one ends/.test(down.label)) throw new Error('nothing ends act one');
      if(!/act two/.test(back.label)) throw new Error('nothing calls act two');
      // the curtain is in for all three
      for(const c of [down, up, back])
        if(isOut(c)) throw new Error('"'+c.label+'" has the curtain out');
      // act one goes dark, the house comes up, then back to half
      if(down.lx.some(r=>r.lvl > 0.02)) throw new Error('act one does not end in a blackout');
      if(down.house > 0.02) throw new Error('the house is up before the curtain is in');
      if(up.house < 0.9) throw new Error('the interval house is only at '+up.house);
      if(up.lx.some(r=>r.lvl > 0.02)) throw new Error('the rig is still lit in the interval');
      if(back.house > 0.4) throw new Error('act two starts with the house at '+back.house);
      if(back.house < 0.1) throw new Error('the house never came back to half');
      // and it sits about halfway
      const story = CUES.filter(c=>!/curtain call|blackout|bow|warmers|house up/.test(c.label));
      const frac = i / CUES.length;
      if(frac < 0.25 || frac > 0.65)
        throw new Error('the interval is '+Math.round(frac*100)+'% of the way in');
      // the act two cue after it takes the curtain out again
      const next = CUES[i+2];
      if(!isOut(next)) throw new Error('act two never takes the curtain out');
    }
    return 'blackout, curtain in, house up, house to half, curtain out — both shows';
  });
  P('running through the interval leaves the house up and the stage dark', ()=>{
    showLoad('lostboys');
    const i = CUES.findIndex(c=>/INTERVAL/.test(c.label));
    const ls = frontCurtainLineset();
    for(let k=i-1;k<=i;k++){
      fireCue(k);
      for(let n=0;n<400;n++){ updateFades(0.05); updateFly(0.05); }
    }
    if(HOUSE.house < 0.9) throw new Error('the house is at '+HOUSE.house);
    if(FIXTURES.some(f=>f.level > 0.05)) throw new Error('the rig is still up in the interval');
    if(ls.pos > TRIMS[ls.goodsKey] + 0.5) throw new Error('the curtain never came in');
    // and act two puts it back
    fireCue(i+1); for(let n=0;n<400;n++){ updateFades(0.05); updateFly(0.05); }
    if(HOUSE.house > 0.4) throw new Error('the house did not come back down');
    fireCue(i+2); for(let n=0;n<600;n++){ updateFades(0.05); updateFly(0.05); }
    if(ls.pos < OUT_TRIM - 1) throw new Error('act two did not take the curtain out');
    return 'house up behind a closed curtain, then act two takes it out again';
  });
  P('there are two productions now', ()=>{
    const keys = Object.keys(SHOWS);
    if(keys.length < 2) throw new Error('only '+keys.length+' show');
    if(!SHOWS.lostboys) throw new Error('no Lost Boys');
    return keys.map(k=>SHOWS[k].name).join(' / ');
  });
  P('it loads in', ()=>{
    showLoad('lostboys');
    if(!SHOW.group) throw new Error('nothing was built');
    let meshes = 0, tris = 0;
    SHOW.group.traverse(o=>{ if(o.isMesh && o.geometry){ meshes++;
      const idx = o.geometry.index, pos = o.geometry.attributes.position;
      tris += (idx?idx.count/3:(pos?pos.count/3:0))*(o.isInstancedMesh?o.count:1); }});
    if(meshes < 20) throw new Error('only '+meshes+' meshes');
    return meshes+' meshes, '+(tris/1000).toFixed(1)+'k triangles';
  });
  P('the structure is thin and well upstage', ()=>{
    let box = null;
    SHOW.group.traverse(o=>{
      if(!o.isInstancedMesh || o.count < 10) return;
      const b = worldBox(o);
      if(!b || b.max.y < 8) return;                 // the columns, not the rubble
      box = box ? box.union(b) : b;
    });
    if(!box) throw new Error('no structure found');
    const depth = box.max.z - box.min.z;
    if(depth > 6) throw new Error('it is '+depth.toFixed(1)+'m deep, that is not thin');
    if(box.max.z > -8) throw new Error('it comes down to z='+box.max.z.toFixed(1)+
      ', that is not upstage');
    // and there is a clear stage in front of it
    for(const z of [-7, -4, -1]){
      const g = groundAt(0, z, 2);
      if(g === null || g > 0.4) throw new Error('the floor at z='+z+' is not clear');
    }
    return depth.toFixed(1)+'m deep, running z '+box.min.z.toFixed(1)+
           ' to '+box.max.z.toFixed(1)+', clear stage in front';
  });
  P('the welcome drop hangs in front of it and flies out on cue', ()=>{
    const ls = FLY.find(l=>l.goodsKey === SHOW.dropKey);
    if(!ls) throw new Error('the welcome drop is not hung');
    if(!ls.goods) throw new Error('hung but nothing built');
    if(ls.z < -10) throw new Error('it hangs upstage of the structure, z='+ls.z);
    if(Math.abs(ls.pos - TRIMS[SHOW.dropKey]) > 0.2) throw new Error('it does not start in');
    // the first cues keep it in, then one flies it out
    const top = CUES[0], reveal = CUES.find(c=>c.label.indexOf('revealed') !== -1);
    if(!reveal) throw new Error('no cue reveals the structure');
    if(!top.fly || !reveal.fly) throw new Error('the cues carry no fly state');
    const inAt  = top.fly.find(r=>r.id === ls.id).target;
    const outAt = reveal.fly.find(r=>r.id === ls.id).target;
    if(!(inAt < 12)) throw new Error('the drop is not in at the top');
    if(!(outAt > OUT_TRIM - 1)) throw new Error('the reveal cue does not fly it out');
    // and it really moves
    fireCue(0); for(let i=0;i<400;i++) updateFly(0.05);
    const low = ls.pos;
    fireCue(CUES.indexOf(reveal)); for(let i=0;i<600;i++) updateFly(0.05);
    if(!(ls.pos > low + 5)) throw new Error('it did not fly out: '+low.toFixed(1)+' to '+ls.pos.toFixed(1));
    return 'in at '+low.toFixed(1)+'m on lineset '+ls.id+', out to '+ls.pos.toFixed(1)+'m on "'+reveal.label+'"';
  });
  P('it is steel, not a boardwalk', ()=>{
    // no neon signage: the practicals are a handful of caged lamps, nothing more
    if(SHOW.neon.length > 40) throw new Error(SHOW.neon.length+' tubes is a funfair');
    let metal = 0, total = 0;
    SHOW.group.traverse(o=>{
      if(!o.isMesh || !o.material || o.material.metalness === undefined) return;
      total++; if(o.material.metalness > 0.4) metal++;
    });
    if(metal < total*0.5) throw new Error('only '+metal+' of '+total+' pieces read as steel');
    return metal+' of '+total+' pieces are steel, '+SHOW.neon.length+' practicals';
  });
  P('it goes up, not along', ()=>{
    const b = worldBox(SHOW.group);
    if(b.max.y < 10) throw new Error('the set only reaches '+b.max.y.toFixed(1)+'m');
    // three levels you can stand on
    // probe each deck somewhere the one above does not overhang it
    const levels = [];
    /* probe from just above each gallery, and away from the stair flights —
       start the ray any higher and it lands on a tread on the way down */
    const probes = [[3.2, 0.0, -12.4], [6.2, 2.5, -12.4], [9.1, 2.5, -12.4]];
    for(const [y, px, pz] of probes){
      const g = groundAt(px, pz, y + 0.3);
      if(g !== null && Math.abs(g - y) < 0.5) levels.push(y);
    }
    if(levels.length < 3) throw new Error('only '+levels.length+' of 3 decks are walkable: '+levels);
    return b.max.y.toFixed(1)+'m tall, decks at '+levels.join(', ');
  });
  P('there is neon, and the cues dim it', ()=>{
    if(!SHOW.neon || SHOW.neon.length < 8) throw new Error('only '+(SHOW.neon||[]).length+' tubes');
    setNeon(1.2);
    for(let i=0;i<80;i++) updateStorm(0.05);
    const bright = SHOW.neon[0].mesh.material.color.r + SHOW.neon[0].mesh.material.color.g;
    setNeon(0);
    for(let i=0;i<120;i++) updateStorm(0.05);
    const dark = SHOW.neon[0].mesh.material.color.r + SHOW.neon[0].mesh.material.color.g;
    if(!(dark < bright*0.3)) throw new Error('the neon did not dim: '+bright.toFixed(2)+' to '+dark.toFixed(2));
    if(SHOW.neon.some(n=>n.mesh.visible)) throw new Error('a tube is still drawn with the neon out');
    setNeon(1);
    for(let i=0;i<80;i++) updateStorm(0.05);
    if(!SHOW.neon[0].mesh.visible) throw new Error('it did not come back');
    return SHOW.neon.length+' tubes, full to out and back';
  });
  P('the neon rides the cue stack', ()=>{
    const dark = CUES.find(c=>c.neon !== undefined && c.neon < 0.25);
    const bright = CUES.find(c=>c.neon !== undefined && c.neon > 1);
    if(!dark || !bright) throw new Error('no cue turns the neon down or right up');
    fireCue(CUES.indexOf(dark));
    for(let i=0;i<140;i++) updateStorm(0.05);
    const lo = SHOW.neonLevel;
    fireCue(CUES.indexOf(bright));
    for(let i=0;i<140;i++) updateStorm(0.05);
    if(SHOW.neonLevel <= lo + 0.4) throw new Error('the cue did not lift it');
    return '"'+dark.label+'" at '+lo.toFixed(2)+', "'+bright.label+'" at '+SHOW.neonLevel.toFixed(2);
  });
  P('the drum fire is there and answers a cue', ()=>{
    if(!SHOW.fire) throw new Error('no fire on the deck');
    const c = CUES.find(x=>x.fire);
    if(!c) throw new Error('no cue lights it');
    fireCue(CUES.indexOf(c));
    for(let i=0;i<100;i++) updateStorm(0.05);
    if(SHOW.fire.level < 0.5) throw new Error('the bonfire never caught');
    return '"'+c.label+'" lights it';
  });
  P('it has its own curtain and its own plot', ()=>{
    const ls = FLY.find(l=>l.goodsKey === SHOW.curtainKey);
    if(!ls) throw new Error('no show curtain');
    if(!GOODS[SHOW.curtainKey].traveler) throw new Error('it does not draw');
    if(CUES.length < 10) throw new Error('only '+CUES.length+' cues');
    const labels = CUES.map(c=>c.label.toLowerCase());
    for(const want of ['structure','shafts','daylight'])
      if(!labels.some(l=>l.indexOf(want) !== -1)) throw new Error('no cue for '+want);
    return CUES.length+' cues, '+GOODS[SHOW.curtainKey].label;
  });
  P('the black curtain carries the title across the join', ()=>{
    showLoad('lostboys');
    const ls = FLY.find(l=>l.goodsKey === SHOW.curtainKey);
    const halves = ls.goods.children;
    if(halves.length !== 2) throw new Error('not a pair');
    const [a, b] = halves.map(h=>h.material.map);
    if(!a || !b) throw new Error('no cloth on it');
    if(a === b) throw new Error('both halves share one texture, so the title doubles up');
    // both must map the same world x to the same u, or the wordmark breaks
    const halfW = D.procW/2 + 3.0, W = 17.2;
    const u = (m, side)=>{
      // the u at that half's inner edge
      const inner = side < 0 ? (halfW - (W - halfW))/halfW : ((W - halfW))/halfW;
      return m.offset.x + m.repeat.x * (side < 0 ? 1 : 0);
    };
    const rightEdgeOfLeft  = a.offset.x + a.repeat.x;
    const leftEdgeOfRight  = b.offset.x;
    if(Math.abs(a.repeat.x - halfW/W) > 0.01) throw new Error('the left half is scaled wrong');
    if(Math.abs(b.repeat.x - halfW/W) > 0.01) throw new Error('the right half is scaled wrong');
    if(Math.abs(a.offset.x) > 0.001) throw new Error('the left half is offset');
    if(Math.abs(b.offset.x - (W - halfW)/W) > 0.01) throw new Error('the right half is offset wrong');
    if(!(rightEdgeOfLeft > leftEdgeOfRight))
      throw new Error('the halves do not overlap in the texture, there will be a gap');
    // and it has to be black
    const col = halves[0].material.color;
    if(col.r + col.g + col.b < 2.9) throw new Error('the cloth is tinted, not plain');
    return 'two halves, repeat '+a.repeat.x.toFixed(2)+', overlap '+
           (rightEdgeOfLeft - leftEdgeOfRight).toFixed(2)+' of the image';
  });
  P('the Lost Boys leaves the house at half', ()=>{
    showLoad('lostboys');
    const up = CUES[CUES.length-1];
    if(Math.abs(up.house - 0.5) > 0.02)
      throw new Error('the last cue takes the house to '+up.house+', not half');
    showLoad('outsiders');
    const up2 = CUES[CUES.length-1];
    if(up2.house < 0.9) throw new Error('the Outsiders should still come to full');
    return 'Lost Boys half, Outsiders full';
  });
  P('each show rigs smoke of its own on the set', ()=>{
    for(const key of Object.keys(SHOWS)){
      showLoad(key);
      const mine = SMOKE.units.filter(u=>u.show);
      if(mine.length < 2) throw new Error(SHOWS[key].name+' rigged '+mine.length+' machines');
      // they have to be on the set, not out in the wings with the house kit
      for(const u of mine){
        if(Math.abs(u.x) > 10) throw new Error(u.name+' is out in the wings at x='+u.x);
        if(u.z > -2) throw new Error(u.name+' is downstage of the set at z='+u.z);
      }
      if(!mine.some(u=>u.y > 1)) throw new Error('nothing is rigged up on the structure');
      // and they make smoke like any other machine
      smokeClear(); smokeRefill();
      setSmoke(mine[0], 1);
      for(let i=0;i<80;i++) updateSmoke(0.05);
      if(!SMOKE.list.filter(p=>p.live).length) throw new Error(mine[0].name+' made nothing');
      setSmoke(mine[0], 0); smokeClear();
    }
    return 'both shows bring their own machines';
  });
  P('show machines go out with the set, the house kit stays', ()=>{
    showLoad('lostboys');
    const house = SMOKE.units.filter(u=>!u.show).length;
    const withShow = SMOKE.units.length;
    if(withShow <= house) throw new Error('the show rigged nothing');
    showStrike();
    if(SMOKE.units.some(u=>u.show)) throw new Error('a show machine survived the strike');
    if(SMOKE.units.length !== house)
      throw new Error('the house kit changed: '+SMOKE.units.length+' instead of '+house);
    // the panel follows
    buildSmokeUI();
    const strips = document.querySelectorAll('#smokeRack .smk').length;
    if(strips !== SMOKE.units.length) throw new Error(strips+' strips for '+SMOKE.units.length+' machines');
    showLoad('lostboys');
    buildSmokeUI();
    if(document.querySelectorAll('#smokeRack .smk').length !== SMOKE.units.length)
      throw new Error('the panel did not grow again on reload');
    return house+' house machines, '+(withShow-house)+' rigged by the show';
  });
  P('the two shows do not leak into each other', ()=>{
    showLoad('lostboys');
    const neon = SHOW.neon.length;
    showLoad('outsiders');
    if(SHOW.neon.length) throw new Error('the Outsiders inherited '+SHOW.neon.length+' neon tubes');
    if(GOODS.lostBoysCurtain) throw new Error('the Lost Boys curtain is still on the goods list');
    if(FLY.some(l=>l.goodsKey === 'lostBoysCurtain')) throw new Error('still hung');
    showLoad('lostboys');
    if(SHOW.neon.length !== neon) throw new Error('the neon did not come back');
    if(GOODS.outsidersCurtain) throw new Error('the Outsiders curtain is still on the goods list');
    return 'each show cleans up after itself';
  });
  P('the crew can bring the Lost Boys in too', ()=>{
    crewStop(true);
    showStrike();
    showSel = 'lostboys';
    crewLoadShow('lostboys');
    if(!CREW.running) throw new Error('the crew were not called');
    for(let i=0;i<12000 && CREW.running;i++){ updateCrew(0.05); updateFly(0.05); updateDockDoors(0.05); }
    if(CREW.running) throw new Error('the get-in never finished');
    const hidden = SHOW.group.children.filter(o=>o.userData.crewHidden).length;
    if(hidden) throw new Error(hidden+' pieces never came on');
    return 'brought in by hand';
  });

  console.log('--- saving the hang ---');
  P('the hang panel is there and knows what is loaded', ()=>{
    for(const id of ['#hangSave','#hangLoad','#hangForget','#hangStat'])
      if(!document.querySelector(id)) throw new Error('missing '+id);
    showLoad('outsiders');
    refreshHangUI();
    if(document.querySelector('#hangSave').disabled) throw new Error('save is dead with a show up');
    if(!document.querySelector('#hangLoad').disabled) throw new Error('restore is live with nothing saved');
    if(document.querySelector('#hangStat').innerHTML.indexOf('OUTSIDERS') === -1)
      throw new Error('the readout does not name the show');
    return 'panel live';
  });
  P('changing the rail reads as changed', ()=>{
    showLoad('outsiders');
    if(hangIsDirty()) throw new Error('a freshly loaded show already reads as changed');
    const ls = railGroup('electrics')[0];
    ls.target = ls.pos = 6.4;
    if(!hangIsDirty()) throw new Error('moving a lineset did not register');
    showLoad('outsiders');
    return 'clean on load, dirty the moment you move something';
  });
  P('save the rail to the show and it loads back that way', ()=>{
    showLoad('outsiders');
    const e = railGroup('electrics');
    const spare = FLY.find(l=>l.goodsKey === 'none');
    if(!spare) throw new Error('no empty lineset to re-hang');
    // make a hang of your own: drop an electric, hang a scrim, lock one off
    e[0].target = e[0].pos = 6.25;
    hangGoods(spare, 'scrim');
    spare.target = spare.pos = 9.1;
    FLY[0].locked = true;
    const curtain = FLY.find(l=>GOODS[l.goodsKey] && GOODS[l.goodsKey].traveler);
    curtain.travTarget = 1;
    const snap = saveHang();
    if(!snap) throw new Error('saveHang returned nothing');
    if(hangIsDirty()) throw new Error('it still reads as changed after saving');
    // now wreck it, then reload the show
    FLY.forEach(l=>{ l.locked = false; hangGoods(l,'none'); l.target = l.pos = OUT_TRIM; });
    showLoad('outsiders');
    if(Math.abs(FLY[e[0].id-1].pos - 6.25) > 0.06)
      throw new Error('the trim did not come back: '+FLY[e[0].id-1].pos.toFixed(2));
    if(FLY[spare.id-1].goodsKey !== 'scrim')
      throw new Error('the scrim did not come back, got '+FLY[spare.id-1].goodsKey);
    if(!FLY[0].locked) throw new Error('the lock did not come back');
    if(FLY.find(l=>GOODS[l.goodsKey] && GOODS[l.goodsKey].traveler).travTarget < 0.9)
      throw new Error('the curtain came back shut');
    return 'trim, goods, lock and curtain all restored';
  });
  P('the saved hang survives a strike', ()=>{
    showStrike();
    if(!SHOW_HANGS.outsiders) throw new Error('striking the set threw the hang away');
    showLoad('outsiders');
    if(FLY[0].locked !== true) throw new Error('it did not come back after the strike');
    return 'kept through a strike and a reload';
  });
  P('RESTORE puts the saved hang back without reloading the set', ()=>{
    showLoad('outsiders');
    const group = SHOW.group;
    FLY.forEach(l=>{ l.locked = false; l.target = l.pos = OUT_TRIM; });
    document.querySelector('#hangLoad').click();
    if(SHOW.group !== group) throw new Error('it rebuilt the set instead of just the rail');
    if(!FLY[0].locked) throw new Error('the lock did not come back');
    if(FLY.every(l=>l.pos > OUT_TRIM - 1)) throw new Error('nothing came back in');
    return 'rail restored, set untouched';
  });
  P('FORGET goes back to the hang the show came with', ()=>{
    const mine = SHOW_HANGS.outsiders;
    if(!mine) throw new Error('nothing saved to forget');
    forgetHang();
    if(SHOW_HANGS.outsiders) throw new Error('it did not forget');
    showLoad('outsiders');
    if(FLY[0].locked) throw new Error('it still loaded my locked lineset');
    const scrimBack = FLY.filter(l=>l.goodsKey === 'scrim' && l.pos < 11).length;
    if(scrimBack) throw new Error('it still loaded my scrim in');
    if(document.querySelector('#hangStat').innerHTML.indexOf('no saved hang') === -1)
      throw new Error('the readout still claims a saved hang');
    return "back to the designer's hang";
  });
  /* ══ RULING CM — THE FLY RAIL'S START-OF-SHOW CALL ════════════════════ */
  P('START OF SHOW puts the rail where the show says, and fires nothing', ()=>{
    showLoad('beetlejuice');
    if(!CUES.length || !CUES[0].fly) throw new Error('the plot recorded no fly snapshot on cue 0');
    const want = CUES[0].fly.slice();

    /* RUN THE BOARD ON FIRST, and this is what the negative check taught.
       showLoad leaves it standing AT cue 0 (standByAtTheTop), so "it did not
       fire cue 0" is unobservable from there: a mutant that called
       cueFiredByHand(0) moved the pointer from 1 to 1 and the house from 0.30 to
       0.30, and every assertion below sailed through against a build that
       started the show off the fly rail.  Fired from a mid-show look the same
       mutation is loud. */
    const mid = CUES.findIndex(c=>c.lx && c.lx.some(x=>x.lvl > 0.5) && c.n > 3);
    if(mid < 0) throw new Error('no lit mid-show cue to run the board on to');
    fireCue(mid);
    if(Math.abs(HOUSE.house - CUES[0].house) < 1e-9 &&
       nextCue === 1) throw new Error('the board did not actually move off cue 0');

    /* put the rail somewhere it definitely is not supposed to be, INCLUDING the
       traveler, so a call that only moved trims would be caught */
    FLY.forEach(l=>{ l.locked = false; l.target = l.pos = OUT_TRIM; l.travTarget = l.open = 1; });
    /* and note where everything the call must NOT touch stands */
    const pointer = nextCue, house = HOUSE.house;
    const lvl0 = FIXTURES.map(f=>f.level);

    /* THROUGH THE DOM (TRAPS: a detached handler fires perfectly well) */
    const btn = document.querySelector('#flyShowTop');
    if(!btn) throw new Error('there is no START OF SHOW button on the fly page');
    btn.click();

    for(const r of want){
      const ls = FLY[r.id-1];
      if(!ls) continue;
      if(Math.abs(ls.target - r.target) > 1e-6)
        throw new Error('lineset '+r.id+' went to '+ls.target.toFixed(2)+', the show says '+r.target.toFixed(2));
      if(Math.abs(ls.travTarget - r.open) > 1e-6)
        throw new Error('lineset '+r.id+' traveler is at '+ls.travTarget+', the show says '+r.open);
    }
    /* it really MOVED something — a call that no-oped would pass the loop above
       if the snapshot happened to be all-out */
    const moved = want.filter(r=>Math.abs(r.target - OUT_TRIM) > 0.01).length;
    if(!moved) throw new Error('cue 0 hangs everything out, so this proves nothing — check the plot');

    /* A RAIL CALL, NOT A CUE.  cueTop fires the cue (RULING BW); this must not,
       or the fly rail starts the show, which is the fault BW exists to fix. */
    if(nextCue !== pointer) throw new Error('it moved the cue pointer to '+nextCue);
    if(HOUSE.house !== house) throw new Error('it moved the house master to '+HOUSE.house);
    if(FIXTURES.some((f,i)=>f.level !== lvl0[i])) throw new Error('it moved the lights');
    return moved+' of '+want.length+' linesets set from the show own first cue, nothing fired';
  });

  P('START OF SHOW declines when there is no show to preset to', ()=>{
    showStrike();
    CUES.length = 0;
    const before = FLY.map(l=>l.target);
    document.querySelector('#flyShowTop').click();
    if(FLY.some((l,i)=>Math.abs(l.target - before[i]) > 1e-6))
      throw new Error('it moved the rail with no cue stack loaded');
    showLoad('outsiders');
    return 'empty stack: nothing moved';
  });

  P('a hang referring to goods that have gone is survivable', ()=>{
    showLoad('outsiders');
    const spare = FLY.find(l=>l.goodsKey === 'none');
    GOODS.tempCloth = {label:'temp', h:10, wt:100, made:true, build:()=>new THREE.Group()};
    TRIMS.tempCloth = 9;
    hangGoods(spare, 'tempCloth');
    saveHang();
    delete GOODS.tempCloth; delete TRIMS.tempCloth;
    hangGoods(spare, 'none');
    const r = applyHang('outsiders');
    if(r.missing !== 1) throw new Error('it reported '+r.missing+' missing, expected 1');
    if(r.set < FLY.length - 1) throw new Error('it gave up on the rest of the rail');
    forgetHang();
    showLoad('outsiders');
    return 'skips what no longer exists and hangs the rest';
  });
  P('saving with no show up is refused, not crashed', ()=>{
    showStrike();
    const r = saveHang();
    if(r !== null) throw new Error('it saved a hang to nothing');
    refreshHangUI();
    if(!document.querySelector('#hangSave').disabled) throw new Error('save is still live');
    showLoad('outsiders');
    return 'refused politely';
  });

  console.log('--- strike and reload ---');
  P('strike takes it all out again', ()=>{
    const walkBefore = WALKABLE.length;
    showStrike();
    if(SHOW.group) throw new Error('the set is still there');
    if(SHOW.rain) throw new Error('the rain is still there');
    if(GOODS.outsidersSky) throw new Error('the drop is still on the goods list');
    if(FLY.some(l=>l.goodsKey === 'outsidersSky')) throw new Error('still hung');
    if(WALKABLE.length >= walkBefore) throw new Error('the walkable list did not shrink');
    if(LIGHTNING.intensity !== 0) throw new Error('the lightning stayed on');
    return 'clean';
  });
  P('you can walk where the set was', ()=>{
    const g = groundAt(0, -4, 3);
    if(g === null) throw new Error('the stage floor went with it');
    if(g > 0.35) throw new Error('the lot deck is still there at '+g);
    return 'back to bare deck at '+g.toFixed(2)+'m';
  });
  P('plotting THE OUTSIDERS leaves every aim back at home focus', ()=>{
    showLoad('outsiders');
    const home = captureAims();
    plotOutsiders();          // the plot must restore what it found, not the last look
    const off = [];
    FIXTURES.forEach((f,i)=>{
      if(!home[i]) return;
      const d = Math.abs(f.aim.x - home[i][0]) + Math.abs(f.aim.y - home[i][1])
              + Math.abs(f.aim.z - home[i][2]);
      if(d > 1e-6) off.push(f.ch);
    });
    if(off.length) throw new Error(off.length+' fixtures left aimed at the final look: ch '+off.join(','));
    return 'every non-mover aim back at home';
  });

  P('the outsiders show curtain maps one picture across both halves', ()=>{
    showLoad('outsiders');
    const ls = FLY.find(l=>l.goodsKey === SHOW.curtainKey);
    if(!ls) throw new Error('the show curtain is not hung');
    const halves = [];
    ls.goods.traverse(o=>{ if(o.userData && o.userData.side !== undefined) halves.push(o); });
    if(halves.length !== 2) throw new Error(halves.length+' halves');
    const maps = halves.map(h=>{
      let m = null;
      h.traverse(o=>{ if(o.isMesh && o.material && o.material.map) m = o.material.map; });
      return m;
    });
    if(!maps[0] || !maps[1]) throw new Error('a half has no texture');
    if(maps[0] === maps[1]) throw new Error('both halves share one un-split texture — the sun paints twice');
    if(maps[0].repeat.x >= 0.999) throw new Error('the texture is not windowed: repeat '+maps[0].repeat.x);
    if(Math.abs(maps[0].offset.x - maps[1].offset.x) < 1e-6)
      throw new Error('both halves show the same window of the picture');
    return 'two windows onto one cloth, SR offset '+maps[1].offset.x.toFixed(2);
  });

  P('load, strike, load again five times over', ()=>{
    for(let i=0;i<5;i++){ showLoad('outsiders'); showStrike(); }
    showLoad('outsiders');
    const c = count(SHOW.group);
    if(WALKABLE.filter(o=>o && o.parent === null).length)
      throw new Error('stale walkable entries left behind');
    return 'stable at '+c.meshes+' meshes';
  });
  P('200 frames with the whole thing running', ()=>{
    goToView(3);
    fireCue(CUES.findIndex(c=>c.storm));
    for(let i=0;i<200;i++){ const cb=window.__raf; window.__raf=null; if(cb) cb(Date.now()+i*16); }
    return 'no errors';
  });
  P('the rain is not silly expensive', ()=>{
    const r = SHOW.rain;
    if(!r) throw new Error('no rain');
    if(r.drops.length > 1400) throw new Error(r.drops.length+' drops is too many');
    let calls = 0;
    SHOW.group.traverse(o=>{ if(o.isMesh) calls++; });
    if(calls > 120) throw new Error(calls+' draw calls for one set');
    return r.drops.length+' drops in 1 draw call, '+calls+' draw calls for the whole set';
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
