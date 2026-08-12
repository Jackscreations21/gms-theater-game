/* PROBE — what does the audience rig actually put on the BALCONY?
   The owner, after the BF/BG round: "i still cant see the purple sweeps when
   im on the balcony".

   Samples a whole cycle rather than one frame, because the pre-show drift is
   SLOW and a single instant says nothing about a slow effect: it reports, per
   seat, the peak light and the share of the cycle that seat spends lit.

       export NODE_PATH=../tests/node_modules
       node audience-balcony.js                                             */
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
  render(scene, camera){ scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); }
};
w.THREE = THREE;
w.AudioContext = undefined;
w.requestAnimationFrame = cb => { w.__raf = cb; return 1; };

const HEADSET = process.argv.indexOf('--headset') >= 0;

const probe = `
;(function(){
  for(let i=0;i<60;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  showLoad('beetlejuice');
  const out = [];
  const P = s => out.push(s);
  const f2 = (v,n) => (Math.round(v*Math.pow(10,n||2))/Math.pow(10,n||2)).toFixed(n||2);
  const HEADSET = ${HEADSET};

  /* WHERE A HEAD IS, on each level.  Eye height 1.15 over a seated body. */
  const SEATS = [
    ['stalls  z=8',   0, houseFloorY(8)+1.15,  8],
    ['stalls  z=16',  0, houseFloorY(16)+1.15, 16],
    ['stalls  z=24',  0, houseFloorY(24)+1.15, 24],
    ['mezz    z=18',  0, mezzFloorY(18)+1.15,  18],
    ['mezz    z=22',  0, mezzFloorY(22)+1.15,  22],
    ['BALCONY z=22',  0, balcFloorY(22)+1.15,  22],
    ['BALCONY z=26',  0, balcFloorY(26)+1.15,  26],
    ['BALCONY z=29',  0, balcFloorY(29)+1.15,  29]
  ];

  /* three r128, legacy lighting, decay 1:
       dist atten = 1 - d/distance
       cone       = smoothstep(cos(angle), cos(angle*(1-penumbra)), dot)   */
  function smooth(a,b,x){ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); }
  function lightAt(l, px,py,pz){
    if(l.intensity <= 0) return 0;
    const dx=px-l.position.x, dy=py-l.position.y, dz=pz-l.position.z;
    const d = Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(l.distance > 0 && d > l.distance) return 0;
    const sx=l.target.position.x-l.position.x, sy=l.target.position.y-l.position.y, sz=l.target.position.z-l.position.z;
    const sl = Math.sqrt(sx*sx+sy*sy+sz*sz) || 1;
    const dot = (dx*sx+dy*sy+dz*sz)/(d*sl||1);
    const cone = smooth(Math.cos(l.angle), Math.cos(l.angle*(1-l.penumbra)), dot);
    if(cone <= 0) return 0;
    return l.intensity * cone * (l.distance > 0 ? Math.max(0, 1 - d/l.distance) : 1);
  }
  /* SPLIT BY WHICH KIND OF AUDIENCE UNIT IT CAME OUT OF.  This matters more
     than the total and nearly went unmeasured: at 1:03 the old plot put 7.1 on
     a balcony head and every bit of it was RED, off the eight blinders, while
     the purple the owner was asking about contributed nothing at all.  A
     brightness number that does not say what colour it is answers the wrong
     question. */
  function audAt(px,py,pz){
    const s = {mover:0, blinder:0};
    for(let i=0;i<LIGHT_POOL.length;i++){
      const l = LIGHT_POOL[i];
      if(l.intensity <= 0) continue;
      const f = FIXTURES.find(q=>q._live && q._org.distanceTo(l.position) < 0.01);
      if(f && f.audience && s[f.type] !== undefined) s[f.type] += lightAt(l, px,py,pz);
    }
    return s;
  }

  /* ------------------------------------------------------------------ *
     RUN A CUE FOR A WHILE AND WATCH EVERY SEAT THE WHOLE TIME.
     A slow drift sampled at one instant tells you nothing about a slow
     drift; peak and duty over a full cycle tell you whether a seat is
     ever in it.                                                         */
  function watch(title, idx, secs, dt){
    fireCue(idx); if(typeof cancelFollow === 'function') cancelFollow();
    const peak = SEATS.map(()=>0), lit = SEATS.map(()=>0);
    const bPeak = SEATS.map(()=>0);
    let frames = 0, poolMin = 99, poolMax = 0;
    const everLive = {};
    const n = Math.round(secs/dt);
    for(let i=0;i<n;i++){
      audFxStep(dt); updateRig(dt, i*dt);
      frames++;
      let held = 0;
      for(const q of FIXTURES) if(q.audience && q._live){ held++; everLive[q.name] = (everLive[q.name]||0)+1; }
      if(held < poolMin) poolMin = held;
      if(held > poolMax) poolMax = held;
      for(let s=0;s<SEATS.length;s++){
        const v = audAt(SEATS[s][1], SEATS[s][2], SEATS[s][3]);
        if(v.mover > peak[s]) peak[s] = v.mover;
        if(v.blinder > bPeak[s]) bPeak[s] = v.blinder;
        if(v.mover > 0.05) lit[s]++;
      }
    }
    P('');
    P('==================================================================');
    P(title + '   (Q' + CUES[idx].n + ' — ' + CUES[idx].label + ')');
    P('   ' + f2(secs,0) + 's watched' + (HEADSET ? '   [HEADSET: pool of ' + VR.lightCap + ']' : '') +
      '   haze ' + f2(RIG.haze) + ' -> uHaze ' + f2(0.25 + hazeNow()*1.15));
    P('   audience units holding a real light: ' + poolMin + '..' + poolMax +
      ' of ' + (HEADSET ? VR.lightCap : LIGHT_POOL.length));
    P('==================================================================');
    P('  seat            peak MOVER (the colour he asked about)   peak BLINDER   share lit');
    for(let s=0;s<SEATS.length;s++){
      const pc = Math.round(100*lit[s]/frames);
      P('  ' + SEATS[s][0].padEnd(14) + '  ' + f2(peak[s],3).padStart(10) + '   ' +
        (pc > 0 ? '#'.repeat(Math.max(1,Math.round(pc/4))) : '(never)').padEnd(28) +
        f2(bPeak[s],3).padStart(8) + '   ' + String(pc).padStart(3) + '%');
    }
    P('  which units ever held a real light:');
    const names = Object.keys(everLive);
    if(!names.length) P('    NONE — the whole effect is beam cone and nothing else');
    else for(const k of names)
      P('    ' + k.padEnd(14) + Math.round(100*everLive[k]/frames) + '% of the time');
  }

  P('THE HOUSE, in numbers:');
  P('  stalls floor  ' + f2(houseFloorY(0),1) + ' .. ' + f2(houseFloorY(30),1) + '  (z 0..30)');
  P('  mezz    front ' + f2(D.mezzY,1) + ' at z=' + D.mezzZ + ', floor to ' + f2(mezzFloorY(21),1));
  P('  BALCONY front ' + f2(D.balcY,1) + ' at z=' + D.balcZ + ', floor ' +
    f2(balcFloorY(22),1) + ' .. ' + f2(balcFloorY(30),1));
  P('  audience movers hang at y=17.5 on two bars, z=9 and z=19');
  P('  a balcony head at z=26 sits ABOVE the lens — the drift has to reach up');

  if(HEADSET){ VR.active = true; VR.lightCap = 4; }
  /* a full wander cycle: the slowest term is sin(t*0.17) -> ~37s */
  watch('THE PRE-SHOW DRIFT, one full cycle', CUES.findIndex(c=>c.n===0.5), 40, 0.05);
  watch('THE 1:03 PURPLE SWEEP, the whole 2s and the hold after',
        CUES.findIndex(c=>c.n===1.1), 5, 0.02);

  window.__out = out.join('\\n');
})();
`;
const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); }
catch(e){ console.log('PROBE DIED: ' + e.message); console.log(e.stack.split('\n').slice(0,6).join('\n')); process.exit(1); }
console.log(w.__out);
process.exit(0);
