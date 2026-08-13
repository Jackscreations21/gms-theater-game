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
  let n=0;
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); n++; } }
  window.__errs = [];
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,150):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); window.__errs.push(name+': '+e.message); } };

  /* what the renderer would actually submit: visible objects only, the way
     WebGLRenderer.projectObject walks the graph */
  function submitted(){
    let meshes = 0, tris = 0, lights = 0;
    (function walk(o){
      if(o.visible === false) return;
      if(o.isLight) lights++;
      if(o.isMesh && o.geometry){
        meshes++;
        const idx = o.geometry.index, pos = o.geometry.attributes.position;
        const t = idx ? idx.count/3 : (pos ? pos.count/3 : 0);
        tris += t * (o.isInstancedMesh ? o.count : 1);
      }
      for(const c of o.children) walk(c);
    })(scene);
    return {meshes, tris:Math.round(tris), lights};
  }

  console.log('--- the rooms ---');
  P('the building sorted itself into rooms', ()=>{
    if(!ROOMS_BUILT) throw new Error('buildRooms never ran');
    for(const nm of ROOM_ORDER) if(!ROOM_GROUP[nm]) throw new Error('no group for '+nm);
    if(world.children.length !== ROOM_ORDER.length + 1)
      throw new Error('world has '+world.children.length+' children, want 6 room groups');
    return ROOM_TALLY;
  });
  P('the dock doors do not break the culling', ()=>{
    setAllDockDoors(true);
    for(let i=0;i<200;i++) updateDockDoors(0.05);
    Player.mode='walk'; Player.pos.z = -6; updateRooms(true);
    if(!ROOM_GROUP.stage.visible) throw new Error('the stage went dark');
    setAllDockDoors(false);
    for(let i=0;i<200;i++) updateDockDoors(0.05);
    return 'stage stays up with the shutters either way';
  });
  P('every room holds something', ()=>{
    const empty = ROOM_ORDER.filter(nm=>ROOM_GROUP[nm].children.length === 0);
    if(empty.length) throw new Error('empty rooms: '+empty.join(', '));
    return ROOM_ORDER.map(nm=>nm+':'+ROOM_GROUP[nm].children.length).join(' ');
  });
  P('no light was put in a room that can be switched off', ()=>{
    const bad = [];
    for(const nm of ROOM_ORDER)
      ROOM_GROUP[nm].traverse(c=>{ if(c.isLight) bad.push(nm+'/'+(c.type||'light')); });
    if(bad.length) throw new Error(bad.length+' lights can be culled: '+bad.slice(0,4).join(', '));
    return 'all lights are shared';
  });
  P('the seats really are in the auditorium', ()=>{
    let seats = null;
    ROOM_GROUP.house.traverse(c=>{ if(c.isInstancedMesh && c.count > 1000) seats = c; });
    if(!seats) throw new Error('the seating did not land in the house');
    return seats.count + ' seats filed under the auditorium';
  });
  P('the loading dock belongs to the stage', ()=>{
    // it is off the stage-right wing, same z, so it culls with the stage
    let dockFloor = null;
    ROOM_GROUP.stage.traverse(o=>{
      if(dockFloor || !o.isMesh) return;
      const b = worldBox(o);
      if(b && b.min.x > DOCK.x0 - 1 && b.max.y < DOCK.y + 0.4 && b.max.y > DOCK.y - 0.4)
        dockFloor = o;
    });
    if(!dockFloor) throw new Error('the dock floor is not filed under the stage');
    return 'the dock culls with the stage';
  });

  console.log('--- what it saves ---');
  // shed added by the warehouse PR — its slab runs upstage of the back wall.
  // TAKEN OFF THE ROOM, not typed: the brick has moved twice (PAL_DEEP 4.5 then
  // 8.5, RULING CL) and a literal -25 ends up standing on the stage instead.
  const zOf = {shed:ROOMS.shed.z1 - 4, stage:-4, house:13, lobby:FOH.z0+5};
  QUALITY.rooms = false; updateRooms(true);
  const before = submitted();
  P('with culling off, the whole building is submitted', ()=> before);
  const saved = {};
  for(const room of ROOM_ORDER){
    P('standing in '+ROOMS[room].label, ()=>{
      QUALITY.rooms = true;
      Player.mode = 'walk'; Player.pos.z = zOf[room];
      const hc = FLY.find(l=>l.goodsKey === 'house');
      if(hc){ hc.open = hc.travTarget = 1; }        // curtain open, so this
      setAllDoors(true); for(const d of DOORS) d.open = 1;   // measures the rooms alone
      const got = updateRooms(true);
      if(got !== room) throw new Error('roomAt put me in '+got+', not '+room);
      const s = submitted();
      if(s.lights !== before.lights) throw new Error('lost '+(before.lights-s.lights)+' lights');
      saved[room] = Math.round(100 - s.tris/before.tris*100);
      return s.meshes+' meshes, '+(s.tris/1000).toFixed(0)+'k triangles — '+
             saved[room]+'% fewer triangles';
    });
  }
  P('it saves something worth having', ()=>{
    const best = Math.max.apply(null, ROOM_ORDER.map(nm=>saved[nm]));
    const worst = Math.min.apply(null, ROOM_ORDER.map(nm=>saved[nm]));
    // with three rooms the auditorium is most of the building, so the win is
    // in the lobby and behind a closed curtain rather than out on the stage
    if(best < 10) throw new Error('the best case only saves '+best+'%');
    return 'between '+worst+'% and '+best+'% of the triangles go away';
  });

  console.log('--- and does not hide anything you can see ---');
  P('you can always see the room next door', ()=>{
    setAllDoors(true); for(const d of DOORS) d.open = 1;
    // the warehouse door is a portal too (the warehouse PR) — open it as well
    SHEDS.palace.door.open = 1; SHEDS.palace.door.target = 1;
    for(const room of ROOM_ORDER){
      Player.pos.z = zOf[room]; updateRooms(true);
      for(const other of ROOM_SEES[room])
        if(!ROOM_GROUP[other].visible) throw new Error('from '+room+' you cannot see '+other);
    }
    return 'with the doors open, every neighbour stays up';
  });
  P('shutting the house doors closes the portal', ()=>{
    setAllDoors(false); for(const d of DOORS) d.open = 0;
    Player.pos.z = zOf.lobby; updateRooms(true);
    if(ROOM_GROUP.house.visible) throw new Error('the auditorium is still drawn from a shut lobby');
    const shut = submitted();
    Player.pos.z = zOf.house; updateRooms(true);
    if(ROOM_GROUP.lobby.visible) throw new Error('the lobby is still drawn from a shut house');
    setAllDoors(true); for(const d of DOORS) d.open = 1;
    Player.pos.z = zOf.lobby; updateRooms(true);
    if(!ROOM_GROUP.house.visible) throw new Error('opening the doors did not bring the house back');
    const open = submitted();
    if(!(shut.tris < open.tris*0.5)) throw new Error('shutting the doors saved almost nothing');
    if(shut.lights !== open.lights) throw new Error('a shut door put a light out');
    return 'from the lobby: '+(open.tris/1000).toFixed(0)+'k with the doors open, '+
           (shut.tris/1000).toFixed(0)+'k with them shut';
  });
  P('a door part way open still counts as open', ()=>{
    setAllDoors(false); for(const d of DOORS) d.open = 0;
    DOORS[0].open = 0.2;
    Player.pos.z = zOf.lobby; updateRooms(true);
    if(!ROOM_GROUP.house.visible) throw new Error('one door ajar and the house is still culled');
    setAllDoors(false); for(const d of DOORS) d.open = 0;
    return 'one leaf ajar is enough';
  });
  P('the house curtain culls the auditorium from upstage of it', ()=>{
    const ls = FLY.find(l=>l.goodsKey === 'house');
    if(!ls) throw new Error('nothing is hung with the house curtain');
    ls.pos = ls.target = TRIMS.house; ls.open = ls.travTarget = 0;   // in and closed
    Player.mode = 'walk'; Player.pos.z = ls.z - 4;                   // well upstage
    updateRooms(true);
    if(ROOM_GROUP.house.visible) throw new Error('the auditorium is drawn through a closed curtain');
    const behind = submitted();
    Player.pos.z = ls.z + 1.2;                                       // out on the apron
    updateRooms(true);
    if(!ROOM_GROUP.house.visible) throw new Error('the house is culled from downstage of the curtain');
    ls.open = ls.travTarget = 1;                                     // draw it open
    Player.pos.z = ls.z - 4; updateRooms(true);
    if(!ROOM_GROUP.house.visible) throw new Error('an open curtain still culls the house');
    ls.open = ls.travTarget = 0; ls.pos = ls.target = OUT_TRIM;      // fly it out
    updateRooms(true);
    if(!ROOM_GROUP.house.visible) throw new Error('a flown-out curtain still culls the house');
    ls.pos = ls.target = TRIMS.house;
    Player.pos.z = ls.z - 4; updateRooms(true);
    const open = (()=>{ ls.open = 1; updateRooms(true); const s = submitted(); ls.open = 0; return s; })();
    updateRooms(true);
    if(!(behind.tris < open.tris*0.5)) throw new Error('the curtain saved almost nothing');
    return 'behind a closed curtain: '+(behind.tris/1000).toFixed(0)+'k, open: '+
           (open.tris/1000).toFixed(0)+'k';
  });
  P('you can see through the proscenium both ways', ()=>{
    const ls = FLY.find(l=>l.goodsKey === 'house');
    if(ls){ ls.open = ls.travTarget = 1; }
    Player.pos.z = 13; updateRooms(true);
    if(!ROOM_GROUP.stage.visible) throw new Error('the stage vanished from the auditorium');
    Player.pos.z = -4; updateRooms(true);
    if(!ROOM_GROUP.house.visible) throw new Error('the auditorium vanished from the stage');
    return 'ok';
  });
  P('the walls, doors and your own pieces never go away', ()=>{
    setAllDoors(true); for(const d of DOORS) d.open = 1;
    for(const room of ROOM_ORDER){
      Player.pos.z = zOf[room]; updateRooms(true);
      if(!SHARED.visible) throw new Error('the shared group went dark');
      if(doorGroup.parent !== SHARED) throw new Error('the doors can be culled');
      if(setGroup.parent !== SHARED) throw new Error('pieces you place can be culled');
    }
    return 'always drawn';
  });
  P('every viewpoint still sees its own room', ()=>{
    const out = [];
    for(const k of [1,2,3,4,5,6,7,8,9]){
      goToView(k);
      if(!ROOM_GROUP[curRoom].visible) throw new Error('view '+k+' hid the room it stands in');
      out.push(k+':'+curRoom);
    }
    return out.join(' ');
  });
  P('walking the length of the building never leaves a gap', ()=>{
    Player.mode = 'walk';
    let flips = 0, last = null;
    for(let z = D.backWall + 1; z < FOH.z1; z += 0.5){
      Player.pos.z = z;
      const r = updateRooms(false);
      if(r !== last){ flips++; last = r; }
      if(!ROOM_GROUP[r].visible) throw new Error('hid my own room at z='+z.toFixed(1));
      if(!SHARED.visible) throw new Error('lost the walls at z='+z.toFixed(1));
    }
    if(flips !== 3) throw new Error('crossed '+flips+' boundaries, expected 3');
    return 'walked '+((FOH.z1-D.backWall).toFixed(0))+' m through 3 rooms with no gaps';
  });
  P('turning it off puts everything back', ()=>{
    QUALITY.rooms = false; updateRooms(true);
    const s = submitted();
    if(s.tris !== before.tris) throw new Error('came back with '+s.tris+' instead of '+before.tris);
    QUALITY.rooms = true; updateRooms(true);
    return 'all '+(before.tris/1000).toFixed(0)+'k triangles are back';
  });
  P('the checkbox drives it', ()=>{
    const cb = document.querySelector('#roomCull');
    if(!cb) throw new Error('no room culling checkbox');
    cb.checked = false; cb.onchange({target:cb});
    if(QUALITY.rooms) throw new Error('unchecking did nothing');
    cb.checked = true; cb.onchange({target:cb});
    if(!QUALITY.rooms) throw new Error('rechecking did nothing');
    const el = document.querySelector('#roomStat');
    if(!el || !el.innerHTML) throw new Error('no readout');
    return 'checkbox and readout both live';
  });
  P('300 frames with the culling running', ()=>{
    goToView(1);
    for(let i=0;i<300;i++){
      Player.pos.z = 13 + Math.sin(i/20)*34;
      const cb = window.__raf; window.__raf = null; if(cb) cb(Date.now()+i*16);
    }
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
catch(e){ console.log('TOP LEVEL THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,6).join('\n')); process.exit(1); }
process.exit((w.__errs||[]).length ? 1 : 0);
