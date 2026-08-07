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

  console.log('--- the palace warehouse ---');
  P('the shed exists and is a room', ()=>{
    if(typeof SHEDS === 'undefined' || !SHEDS.palace) throw new Error('no palace shed');
    if(!ROOMS.shed) throw new Error('no shed room slab');
    if(roomAt(-25) !== 'shed') throw new Error('z=-25 files as '+roomAt(-25));
    if(roomAt(-10) !== 'stage') throw new Error('the stage slab moved');
    return 'room at z<'+ROOMS.shed.z1;
  });
  P('the shed culls behind its shut door', ()=>{
    goToView(3);
    SHEDS.palace.door.open = 0; SHEDS.palace.door.target = 0;
    Player.mode = 'walk'; Player.pos.set(0, 0, -8); updateRooms(true);
    if(ROOM_GROUP.shed.visible) throw new Error('shed drawn through a shut door');
    SHEDS.palace.door.open = 1; SHEDS.palace.door.target = 1;
    updateRooms(true);
    if(!ROOM_GROUP.shed.visible) throw new Error('shed hidden with the door open');
    return 'portal honoured';
  });
  P('the back wall has a doorway now', ()=>{
    SHEDS.palace.door.open = 1;
    if(backWallBlocks(0, -18.2, -16.8)) throw new Error('open door still blocks');
    if(!backWallBlocks(8, -18.2, -16.8)) throw new Error('the wall beside the door is gone');
    SHEDS.palace.door.open = 0;
    if(!backWallBlocks(0, -18.2, -16.8)) throw new Error('a shut door does not block');
    return 'gap at x=0, wall elsewhere';
  });
  P('the shed floor is walkable through the open door', ()=>{
    SHEDS.palace.door.open = 1; SHEDS.palace.door.target = 1;
    goToView(3);
    Player.mode = 'walk'; Player.pos.set(0, 0, -15);
    /* drive the player the way full14.js does: yaw 0 + KeyW walks upstage
       (full14 faces Math.PI to walk downstage into the foyer)             */
    Player.yaw = 0; Player.pitch = 0; Player.vel.set(0,0,0);
    keys['KeyW'] = true;
    for(let i=0;i<600;i++) updatePlayer(0.016);
    keys['KeyW'] = false;
    if(Player.pos.z > -19) throw new Error('never got through the doorway: z='+Player.pos.z.toFixed(1));
    if(Player.pos.z < SHEDS.palace.z0) throw new Error('walked through the shed rear wall');
    return 'walked to z='+Player.pos.z.toFixed(1);
  });

  console.log('--- the arc warehouse ---');
  P('one shed serves both arc houses', ()=>{
    if(!SHEDS.arc) throw new Error('no arc shed');
    if(arcRoomAt(420-26, -52) !== 'shed') throw new Error('behind main is '+arcRoomAt(420-26,-52));
    if(arcRoomAt(420+26, -52) !== 'shed') throw new Error('behind studio is '+arcRoomAt(420+26,-52));
    if(arcRoomAt(420-26, -40) === 'shed') throw new Error('the shed ate the main stage');
    return 'one room behind both';
  });
  P('the board does not thrash in the shed', ()=>{
    goToView(15);
    const before = STAGE;
    Player.mode = 'walk';
    Player.pos.set(420-10, 0, -52); updateStageFromPosition();
    if(STAGE !== before) throw new Error('board swapped to '+STAGE+' in the shed');
    Player.pos.set(420+10, 0, -52); updateStageFromPosition();
    if(STAGE !== before) throw new Error('crossing the shed centre-line swapped the board');
    goToView(3);
    return 'board held: '+before;
  });
  P('each house has a rear door into the shed', ()=>{
    if(!ARC.doorMap.mainRear || !ARC.doorMap.studioRear) throw new Error('rear doors missing');
    const d = ARC.doorMap.mainRear;
    d.open = 0;
    if(!arcWallBlocks(420-26, -47.9, 420-26, -46.7, 1.0)) throw new Error('shut rear door does not block');
    d.open = 1;
    if(arcWallBlocks(420-26, -47.9, 420-26, -46.7, 1.0)) throw new Error('open rear door blocks');
    d.open = 0;
    return 'both keyed and blocking';
  });
  P('standing in the shed does not crash the zone readout', ()=>{
    /* arcZone(x, y, z) is the per-frame readout call (p7 passes the player) */
    const label = arcZone(420, 1.7, -55);
    if(typeof label !== 'string' || !label.length) throw new Error('arcZone returned '+label);
    return label;
  });

  console.log('--- the carts ---');
  P('each shed parks a cart with six slots', ()=>{
    if(typeof CARTS === 'undefined' || !CARTS.palace || !CARTS.arc) throw new Error('carts missing');
    if(CARTS.palace.slots.length !== 6) throw new Error(CARTS.palace.slots.length+' slots');
    if(!CARTS.palace.group.userData.moves) throw new Error('the cart will be matrix-frozen');
    if(roomAt(CARTS.palace.z) !== 'shed') throw new Error('the palace cart is not in its shed');
    return '6 slots each';
  });
  P('the racks offer storage slots', ()=>{
    if(SHEDS.palace.slots.length < 12) throw new Error('palace rack has '+SHEDS.palace.slots.length);
    if(SHEDS.arc.slots.length < 12) throw new Error('arc rack has '+SHEDS.arc.slots.length);
    return SHEDS.palace.slots.length+' + '+SHEDS.arc.slots.length;
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
