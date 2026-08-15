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
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,240):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); window.__errs.push(name+': '+e.message); } };
  const run = (n, dt)=>{ for(let i=0;i<n;i++){ updateStu(dt); updateArc(dt); updateFades(dt); } };
  const seen = o=>{ let p=o; while(p){ if(!p.visible) return false; p=p.parent; } return true; };
  const at = (n)=>{ goToView(n); updateRooms(true); run(2, 0.016); };

  console.log('--- the third building stands, and it is the SAME box four times ---');

  P('GMS Studios is built, hung off the scene and not off world', ()=>{
    if(!STU.built) throw new Error('buildStudios never ran');
    if(STU.group.parent !== scene)
      throw new Error('the venue hangs off ' + (STU.group.parent && STU.group.parent.name));
    /* the Palace room sorter files world.children; a venue filed in there would
       put four studios into the Palace auditorium the first time it sorted */
    if(world.children.indexOf(STU.group) >= 0)
      throw new Error('the venue is a child of world — the sorter will file it');
    if(Math.abs(STU.group.position.x - STU.X) > 0.001)
      throw new Error('the venue stands at x ' + STU.group.position.x);
    return 'at x ' + STU.X + ', ' + STU.order.length + ' rooms, off the scene';
  });

  P('the four studios are ONE builder run four times, not four rooms by hand', ()=>{
    const keys = ['s1','s2','s3','s4'];
    const rows = keys.map(k=>{
      const S = STU.studios[k];
      if(!S) throw new Error('no ' + k);
      return [k, {w:+(S.x1 - S.x0).toFixed(4), d:+(S.z1 - S.z0).toFixed(4),
                  deck:S.deckY}];
    });
    const ref = rows[0][1];
    for(const [k, d] of rows.slice(1))
      for(const key of Object.keys(ref))
        if(Math.abs(d[key] - ref[key]) > 0.001)
          throw new Error(k + ' has ' + key + ' = ' + d[key] + ', s1 has ' + ref[key]);
    // and their centre lines are the declared ones, evenly pitched
    for(let i=0;i<keys.length;i++)
      if(Math.abs(STU.studios[keys[i]].cx - STU_CX[i]) > 0.001)
        throw new Error(keys[i] + ' sits at ' + STU.studios[keys[i]].cx);
    for(let i=1;i<STU_CX.length;i++)
      if(Math.abs((STU_CX[i] - STU_CX[i-1]) - SS.PITCH) > 0.001)
        throw new Error('the pitch between ' + i + ' and ' + (i+1) + ' is ' +
                        (STU_CX[i] - STU_CX[i-1]) + ', SS.PITCH is ' + SS.PITCH);
    return '4 studios, each ' + ref.w + ' x ' + ref.d + ', pitched ' + SS.PITCH;
  });

  P('THE DECK IS y = 0 in every new room', ()=>{
    /* the invariant every set, trim and fixture aim in this game is written to.
       The Arc built its decks a metre up once and buried every production that
       loaded onto them. */
    if(SS.DECK !== 0) throw new Error('SS.DECK is ' + SS.DECK);
    if(SW.DECK !== 0) throw new Error('SW.DECK is ' + SW.DECK);
    const probes = [];
    at(22);
    for(let i=0;i<STU_CX.length;i++){
      at(22 + i);
      const g = groundAt(STU.X + STU_CX[i], -14, 3);
      if(g === null) throw new Error('no floor in studio ' + (i+1));
      if(Math.abs(g) > 0.02)
        throw new Error('studio ' + (i+1) + ' decks at y ' + g.toFixed(3));
      probes.push(+g.toFixed(3));
    }
    at(27);
    const gw = groundAt(STU.X, -50, 3);
    if(gw === null) throw new Error('no floor on the film stage');
    if(Math.abs(gw) > 0.02) throw new Error('the film stage decks at y ' + gw.toFixed(3));
    probes.push(+gw.toFixed(3));
    return 'four studios and the film stage all deck at ' + probes.join(', ');
  });

  console.log('--- three buildings, and the Palace keeps the middle ---');

  P('venueAt sorts all three, and no building claims another\\u2019s ground', ()=>{
    const cases = [[STU.X, 'studio'], [STU.X + 100, 'studio'], [0, 'palace'],
                   [-200, 'palace'], [200, 'palace'], [ARC.X - 100, 'arc'],
                   [ARC.X, 'arc']];
    for(const [x, want] of cases){
      const got = venueAt(x);
      if(got !== want) throw new Error('x ' + x + ' reads ' + got + ', wanted ' + want);
    }
    /* the margins are equal on both sides — an asymmetric pair is how one
       building quietly annexes the other's car park */
    const lo = STU.X + 140, hi = ARC.X - 140;
    if(Math.abs((0 - lo) - (hi - 0)) > 0.001)
      throw new Error('the margins are ' + (0 - lo) + ' and ' + (hi - 0));
    return 'studio < ' + lo + ' < palace < ' + hi + ' < arc';
  });

  P('the Palace\\u2019s own wall rules do NOT follow you into the studios', ()=>{
    /* inPalace() read (VENUE !== 'arc') while the town had two buildings, which
       was the same statement.  With a third it answers YES four hundred metres
       away and hangs the proscenium, the dock and the shed across a television
       studio. */
    at(22);
    if(VENUE !== 'studio') throw new Error('standing in studio 1, VENUE is ' + VENUE);
    if(inPalace()) throw new Error('inPalace() is true while you stand in GMS Studios');
    if(throughWall(STU.X + STU_CX[0], -10, -12) === undefined)
      throw new Error('throughWall is not callable');
    at(11);
    if(inPalace()) throw new Error('inPalace() is true at the Arc');
    at(1);
    if(!inPalace()) throw new Error('inPalace() is false at the Palace');
    return 'palace yes, arc no, studios no';
  });

  console.log('--- two floors (RULING EC) ---');

  P('there is a floor at 5.0 AND a floor at 0 on the same plan position', ()=>{
    at(26);
    const x = STU.X + 20, z = -2;
    const up = groundAt(x, z, SS.OFF_Y + 0.4);
    if(up === null) throw new Error('nothing to stand on at the office level');
    if(Math.abs(up - SS.OFF_Y) > 0.05)
      throw new Error('the office floor reads y ' + up.toFixed(3) + ', SS.OFF_Y is ' + SS.OFF_Y);
    at(21);
    const dn = groundAt(x, z, 0.4);
    if(dn === null) throw new Error('nothing to stand on underneath it');
    if(Math.abs(dn) > 0.05)
      throw new Error('the corridor floor reads y ' + dn.toFixed(3));
    if(up - dn < 3) throw new Error('the two floors are ' + (up-dn).toFixed(2) + 'm apart');
    return 'office slab at ' + up.toFixed(2) + ', corridor at ' + dn.toFixed(2);
  });

  P('the office floor\\u2019s edge is a WALL at 5.0 and open air at 0', ()=>{
    /* the same plane, two answers, and the difference is the yMin on the rule.
       A rule with no height would stop you walking across reception. */
    const x = STU.X, zIn = -3, zOut = 10;
    const hi = stuWallBlocks(x, zOut, x, zIn, SS.OFF_Y + 0.1);
    if(!hi) throw new Error('you can walk straight off the office floor');
    const lo = stuWallBlocks(x, zOut, x, zIn, 0.1);
    if(lo) throw new Error('the same plane blocks you at ground level too');
    return 'blocked at ' + (SS.OFF_Y + 0.1) + ', clear at 0.1';
  });

  P('the stair actually reaches the office floor, tread by tread', ()=>{
    /* a stair whose treads out-step the player is a stair you cannot climb:
       tryMove refuses a rise over 0.62 */
    at(21);
    let y = 0, climbed = 0;
    /* start on the FLOOR in front of the flight, not part-way up it: begin at
       a z the first tread has not reached and the first sample is a legitimate
       step onto tread one, rather than a jump to whichever tread happens to sit
       under the opening z */
    for(let z = 13.6; z > 2.0; z -= 0.21){
      const g = groundAt(STU.X + 30, z, y + 0.6);
      if(g === null) continue;
      if(g - y > 0.62)
        throw new Error('a step of ' + (g-y).toFixed(2) + 'm at z ' + z.toFixed(1) +
                        ' — the player can only manage 0.62');
      if(g > y){ y = g; climbed++; }
    }
    if(y < SS.OFF_Y - 0.2)
      throw new Error('the stair tops out at ' + y.toFixed(2) + ', the floor is at ' + SS.OFF_Y);
    return 'climbed to ' + y.toFixed(2) + ' in ' + climbed + ' rises, none over 0.62';
  });

  console.log('--- RULING EA: everything is empty, and that is the feature ---');

  P('nothing is hung, nothing is flown and no set stands in any of it', ()=>{
    const mine = (typeof BODIES !== 'undefined')
      ? BODIES.filter(b=>b.venue === 'studio') : [];
    const hung = mine.filter(b=>b.state === 'hung');
    if(hung.length)
      throw new Error(hung.length + ' bodies are already hung in a venue that boots empty');
    for(const k in STU.studios)
      if(STU.studios[k].bars && STU.studios[k].bars.length &&
         STU.studios[k].bars.some(b=>b.body))
        throw new Error(k + ' has a lantern on its grid at boot');
    return mine.length + ' studio bodies at boot, ' + hung.length + ' of them hung';
  });

  console.log('--- RULING EH: the rooms cull, and the bed leaves the light loop ---');

  P('a studio sees the corridor and NOT the other three studios', ()=>{
    at(22);
    if(STU.cur !== 's1') throw new Error('view 22 stands in ' + STU.cur);
    if(!STU.rooms.s1.visible) throw new Error('the room you are in is not drawn');
    for(const k of ['s2','s3','s4'])
      if(STU.rooms[k].visible) throw new Error(k + ' is drawn from inside s1');
    if(!STU.rooms.recep.visible) throw new Error('the corridor you opened off is not drawn');
    at(24);
    if(STU.cur !== 's3') throw new Error('view 24 stands in ' + STU.cur);
    for(const k of ['s1','s2','s4'])
      if(STU.rooms[k].visible) throw new Error(k + ' is drawn from inside s3');
    return 'four sealed boxes off one spine';
  });

  P('the other two buildings are switched off entirely while you are here', ()=>{
    at(22);
    if(ARC.built && ARC.group.visible) throw new Error('the Arc is still drawn');
    if(SHARED.visible) throw new Error('the Palace shared room is still drawn');
    for(const n of ROOM_ORDER)
      if(ROOM_GROUP[n].visible) throw new Error('the Palace room ' + n + ' is still drawn');
    at(1);
    if(STU.group.visible) throw new Error('walking back to the Palace left GMS drawn');
    at(11);
    if(STU.group.visible) throw new Error('walking to the Arc left GMS drawn');
    return 'one building at a time';
  });

  P('inside a studio the bed is at zero AND out of the light loop', ()=>{
    /* RULING DW: a hemisphere light at intensity 0 is still a full iteration of
       the hemisphere block in every standard material fragment, both eyes,
       every frame.  Only visible=false takes it out. */
    at(21); run(30, 0.05);
    if(!seen(STU.hemi)) throw new Error('in reception the bed is already gone');
    const lit = STU.hemi.intensity;
    at(23); run(30, 0.05);
    if(STU.hemi.intensity > 0.0001)
      throw new Error('inside a studio the bed reads ' + STU.hemi.intensity.toFixed(4));
    if(seen(STU.hemi))
      throw new Error('inside a studio the bed is at zero and still in the light loop');
    if(seen(STU.amb))
      throw new Error('inside a studio the ambient bed is at zero and still gathered');
    at(27); run(30, 0.05);
    if(seen(STU.hemi)) throw new Error('the film stage still gathers the bed');
    // and it comes back, or the building goes dark for good
    at(21); run(30, 0.05);
    if(!seen(STU.hemi)) throw new Error('back in reception the bed never came back');
    return 'reception ' + lit.toFixed(3) + ', studios and film stage out of the loop';
  });

  console.log('--- doors, and RULING EI ---');

  P('a studio door stops you while it is shut and passes you when it is up', ()=>{
    const key = 's2Door';
    const d = STU.doorMap[key];
    if(!d) throw new Error('studio 2 has no door');
    const cx = STU.X + STU_CX[1];
    stuDoorSet(key, false); d.open = 0;
    if(!stuWallBlocks(cx, -8, cx, -4, 1.2))
      throw new Error('a shut roller door let you walk through it');
    stuDoorSet(key, true);
    for(let i=0;i<120;i++) updateStuDoors(0.05);
    if(d.open < 0.99) throw new Error('the door only opened to ' + d.open.toFixed(2));
    if(stuWallBlocks(cx, -8, cx, -4, 1.2))
      throw new Error('an open roller door still blocks you');
    if(Math.abs(d.group.position.y - (d.y0 + d.travel)) > 0.01)
      throw new Error('the leaf sits at y ' + d.group.position.y + ', not lifted by ' + d.travel);
    stuDoorSet(key, false);
    for(let i=0;i<120;i++) updateStuDoors(0.05);
    return 'shut blocks, open passes, the leaf travels ' + d.travel;
  });

  P('a studio\\u2019s back wall is a scene DOCK, not a hole and not a seal', ()=>{
    /* the route to the film stage runs corridor -> studio -> yard -> stage.
       The first cut of this had a solid back wall with NO rule behind it, so
       the only way through was a hole; sealing it without a door would strand
       the film stage and the shed instead. */
    const S = STU.studios.s2, key = 's2Dock';
    const d = STU.doorMap[key];
    if(!d) throw new Error('studio 2 has no scene dock door');
    const inStudio = -10, inYard = SS.ZBACK - 3;
    stuDoorSet(key, false); d.open = 0;
    if(!stuWallBlocks(STU.X + S.dockX, inYard, STU.X + S.dockX, inStudio, 1.2))
      throw new Error('the shut dock let you walk out into the yard');
    // and the wall EITHER SIDE of the opening is solid whatever the door does
    stuDoorSet(key, true);
    for(let i=0;i<120;i++) updateStuDoors(0.05);
    if(!stuWallBlocks(STU.X + S.cx - 6, inYard, STU.X + S.cx - 6, inStudio, 1.2))
      throw new Error('you can walk through the back wall beside the dock');
    if(stuWallBlocks(STU.X + S.dockX, inYard, STU.X + S.dockX, inStudio, 1.2))
      throw new Error('the open dock still blocks you');
    stuDoorSet(key, false);
    for(let i=0;i<120;i++) updateStuDoors(0.05);
    return 'shut seals, open passes, the wall beside it is solid either way';
  });

  P('the film stage really is reachable from reception', ()=>{
    /* every door on the route, opened in turn, and the walk checked plane by
       plane — a venue whose far half you cannot get to is a venue that is not
       there.  Doors start SHUT, so this also proves the [E] controls are the
       whole story. */
    const legs = [
      ['the corridor into studio 2',   's2Door',    -11, 2,          -10],
      ['studio 2 out to the yard',     's2Dock',    STU.studios.s2.dockX, -10, SS.ZBACK - 3],
      ['the yard into the film stage', 'wareDoor',  0,   SW.Z1 + 3,  SW.Z1 - 3]
    ];
    const opened = [];
    for(const [what, key, lx, from, to] of legs){
      if(stuWallBlocks(STU.X + lx, to, STU.X + lx, from, 1.2) === false)
        throw new Error(what + ' was never shut to begin with');
      stuDoorSet(key, true);
      for(let i=0;i<120;i++) updateStuDoors(0.05);
      if(stuWallBlocks(STU.X + lx, to, STU.X + lx, from, 1.2))
        throw new Error(what + ' is still blocked with the door up');
      if(!stuBounds(STU.X + lx, 0, to))
        throw new Error(what + ' — bounds refuse the far side');
      opened.push(key);
    }
    for(const k of opened){ stuDoorSet(k, false); }
    for(let i=0;i<120;i++) updateStuDoors(0.05);
    return 'reception -> ' + opened.join(' -> ') + ' -> the film stage';
  });

  P('every door in the venue has a control you can walk up to', ()=>{
    /* a headset has no DOM: a door with no [E] station is a room VR cannot get
       into, and the studio doors are the only way in */
    const ids = INTERACT.map(m=>m.userData && m.userData.station && m.userData.station.id)
                        .filter(Boolean);
    const missing = STU.doors.map(d=>d.key)
      .filter(k=>ids.indexOf('stuDoor:' + k) < 0);
    if(missing.length) throw new Error('no control for: ' + missing.join(', '));
    // and the dispatcher actually knows the prefix
    const before = STU.doorMap[STU.doors[0].key].target;
    useStation({id:'stuDoor:' + STU.doors[0].key});
    if(STU.doorMap[STU.doors[0].key].target === before)
      throw new Error('useStation does not dispatch the stuDoor prefix');
    useStation({id:'stuDoor:' + STU.doors[0].key});
    return STU.doors.length + ' doors, ' + STU.doors.length + ' controls';
  });

  P('every material in the venue reached atmTrack (RULING EI)', ()=>{
    /* the ONE registration.  A material that misses it renders with the fog and
       the grade BYPASSED rather than broken — atmMix and gradeMix default to 0
       for exactly that reason — so the failure is silent and is asserted here
       rather than left to be noticed.

       WHAT HOLDS THIS UP is envRecollect() at the tail of init(), which walks
       the whole scene; p2n deliberately has no envRegister call of its own (the
       note there says why, and says it because the call was written first and
       its negative check FAILED TO FAIL).  This assertion is negative-checked
       against removing envRecollect's scene walk, which takes 182 of the 188
       materials below unhooked — so it does have teeth, and they are in the
       right place. */
    const bad = [];
    let n = 0;
    STU.group.traverse(o=>{
      if(!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for(const m of mats){
        n++;
        if(!m.userData.atmHooked) bad.push(m.type + ' on ' + (o.name || 'a mesh'));
      }
    });
    if(bad.length)
      throw new Error(bad.length + ' of ' + n + ' materials bypass the fog and grade (first: ' +
                      bad[0] + ')');
    return n + ' materials, all hooked';
  });

  console.log('--- you can get everywhere, and nowhere you should not ---');

  P('there is a floor under every room, and the yard joins them up', ()=>{
    const spots = [
      ['reception',    21, STU.X,               8,    0],
      ['the corridor', 21, STU.X,              -3,    0],
      ['studio 1',     22, STU.X + STU_CX[0], -14,    0],
      ['studio 4',     25, STU.X + STU_CX[3], -14,    0],
      ['the offices',  26, STU.X + 20,         -2,  SS.OFF_Y],
      ['the yard',     28, STU.X,             -26,    0],
      ['the film stage',27, STU.X,            -50,    0],
      ['the gantry',   27, STU.X + SW.W/2 - 2.4, -50, SW.OUT + 1.2]
    ];
    const out = [];
    for(const [name, view, x, z, want] of spots){
      at(view);
      const g = groundAt(x, z, want + 0.5);
      if(g === null) throw new Error('no floor in ' + name);
      if(Math.abs(g - want) > 0.35)
        throw new Error(name + ' floors at ' + g.toFixed(2) + ', wanted ' + want);
      out.push(name + ' ' + g.toFixed(2));
    }
    return out.join(', ');
  });

  P('the shell holds you in: you cannot walk out through a wall', ()=>{
    const outside = [
      ['through the glazed front', STU.X + 20, SS.ZGLAZE + 4],
      ['out of the studio range',  STU.X + STU_CX[0] - SS.W/2 - 4, -14],
      ['through the film stage flank', STU.X + SW.W/2 + 6, -50],
      ['out of the back of the film stage', STU.X, SW.Z0 - 6]
    ];
    for(const [what, x, z] of outside)
      if(stuBounds(x, 0, z)) throw new Error(what + ' — bounds let you stand there');
    /* and the one way in IS a way in: the entrance gap at the centre of the
       glazing takes you through */
    if(stuWallBlocks(STU.X, 10, STU.X, 18, 1.2))
      throw new Error('the front entrance is closed');
    return 'four escapes refused, the front door open';
  });

  console.log('--- the readouts name the room you are in ---');

  P('the zone readout knows all eight rooms apart', ()=>{
    const rows = [];
    for(const [view, want] of [[21,'RECEPTION'], [22,'STUDIO 1'], [25,'STUDIO 4'],
                               [26,'OFFICES'], [27,'FILM STAGE'], [28,'YARD']]){
      at(view);
      const z = stuZone(Player.pos.x, Player.pos.y, Player.pos.z);
      if(z.indexOf(want) < 0)
        throw new Error('view ' + view + ' reads ' + JSON.stringify(z) + ', wanted ' + want);
      rows.push(z);
    }
    if(VENUE_LABEL.studio !== 'GMS STUDIOS')
      throw new Error('the venue panel calls it ' + VENUE_LABEL.studio);
    if(VIEWS[VENUE_HOME.studio].venue !== 'studio')
      throw new Error('the venue home view is not in the venue');
    at(1);
    return rows.join(' / ');
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
