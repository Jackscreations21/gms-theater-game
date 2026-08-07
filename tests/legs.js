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
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,200):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); window.__errs.push(name+': '+e.message); } };
  const run = (n, dt)=>{ for(let i=0;i<n;i++){ updateFly(dt); updateFades(dt); } };
  const sideOf = ls=>{
    ls.group.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(ls.goods);
    return b.getCenter(new THREE.Vector3()).x - (STAGES[STAGE].cx +
            (STAGES[STAGE].venue === 'arc' ? ARC.X : 0));
  };

  console.log('--- half legs ---');

  P('there is a half leg for each side, and a pair as before', ()=>{
    for(const k of ['legs','legSL','legSR'])
      if(!GOODS[k]) throw new Error('no goods called '+k);
    if(!/pr/.test(GOODS.legs.label)) throw new Error('the pair is not labelled as a pair');
    if(GOODS.legSL.half !== 'SL' || GOODS.legSR.half !== 'SR')
      throw new Error('the halves do not say which side they are');
    return [GOODS.legs.label, GOODS.legSL.label, GOODS.legSR.label];
  });

  P('a half leg is one leg, on the side it says', ()=>{
    goToView(3);
    const ls = FLY[9];
    hangGoods(ls, 'legs');
    let n = 0; ls.goods.traverse(o=>{ if(o.isMesh) n++; });
    if(n !== 2) throw new Error('the pair is '+n+' cloths');
    hangGoods(ls, 'legSL');
    let sl = 0; ls.goods.traverse(o=>{ if(o.isMesh) sl++; });
    if(sl !== 1) throw new Error('the SL half is '+sl+' cloths');
    const xSL = sideOf(ls);
    hangGoods(ls, 'legSR');
    let sr = 0; ls.goods.traverse(o=>{ if(o.isMesh) sr++; });
    if(sr !== 1) throw new Error('the SR half is '+sr+' cloths');
    const xSR = sideOf(ls);
    if(!(xSL < -2)) throw new Error('the SL half is at x='+xSL.toFixed(1)+', not stage left of centre');
    if(!(xSR >  2)) throw new Error('the SR half is at x='+xSR.toFixed(1)+', not stage right of centre');
    // and each one sits where the matching half of the pair would
    hangGoods(ls, 'legs');
    const b = new THREE.Box3().setFromObject(ls.goods);
    if(Math.abs(Math.abs(xSL) - Math.abs(xSR)) > 0.2)
      throw new Error('the two halves are not mirror images');
    hangGoods(ls, 'none');
    return 'pair = 2 cloths, halves = 1 each, at x='+xSL.toFixed(1)+' and '+xSR.toFixed(1);
  });

  P('a half leg masks one side and leaves the other clear', ()=>{
    goToView(3);
    const ls = FLY[9];
    hangGoods(ls, 'legSL');
    flyIn(ls); run(900, 0.05);
    world.updateMatrixWorld(true);
    const ray = new THREE.Raycaster();
    const eye = new THREE.Vector3(0, 4.5, 16);
    const hit = (x)=>{
      const dir = new THREE.Vector3(x - eye.x, 0, ls.z - eye.z).normalize();
      ray.set(eye, dir); ray.near = 0; ray.far = 60;
      return ray.intersectObject(ls.goods, true).length > 0;
    };
    if(!hit(-(D.procW/2 + 1.9))) throw new Error('the SL half is not masking its own side');
    if(hit(D.procW/2 + 1.9))     throw new Error('the SL half is masking stage right as well');
    hangGoods(ls, 'none');
    return 'stage left masked, stage right clear';
  });

  P('a half leg trims like a whole one', ()=>{
    goToView(3);
    const ls = FLY[9];
    hangGoods(ls, 'legs');   const full = inTrimOf(ls);
    hangGoods(ls, 'legSL');  const half = inTrimOf(ls);
    if(Math.abs(full - half) > 0.01)
      throw new Error('the pair trims to '+full+' and the half to '+half);
    if(GOODS.legSL.wt >= GOODS.legs.wt)
      throw new Error('a half leg weighs '+GOODS.legSL.wt+', the pair '+GOODS.legs.wt);
    hangGoods(ls, 'none');
    return 'same trim, '+GOODS.legSL.wt+'kg against '+GOODS.legs.wt+'kg on the rail';
  });

  P('the LEGS group call takes the halves with it', ()=>{
    goToView(3);
    hangGoods(FLY[9],  'legSL');
    hangGoods(FLY[10], 'legSR');
    hangGoods(FLY[11], 'legs');
    const g = railGroup('legs').map(l=>l.id);
    for(const id of [10, 11, 12])
      if(g.indexOf(id) < 0) throw new Error('lineset '+id+' is not in the LEGS group');
    railCall('legs', 'in'); run(900, 0.05);
    for(const i of [9,10,11])
      if(Math.abs(FLY[i].pos - inTrimOf(FLY[i])) > 0.2)
        throw new Error('lineset '+FLY[i].id+' did not come in with the group');
    railCall('legs', 'out'); run(900, 0.05);
    for(const i of [9,10,11])
      if(Math.abs(FLY[i].pos - OUT_TRIM) > 0.2)
        throw new Error('lineset '+FLY[i].id+' did not go out with the group');
    [9,10,11].forEach(i=>hangGoods(FLY[i], 'none'));
    return g.length+' linesets answer the LEGS call, halves included';
  });

  P('you can hang them on any of the three stages', ()=>{
    const out = [];
    for(const [view, key] of [[3,'palace'],[15,'arcMain'],[19,'arcStudio']]){
      goToView(view);
      hangGoods(FLY[9], 'legSR');
      if(FLY[9].goodsKey !== 'legSR') throw new Error('it would not hang at '+key);
      flyIn(FLY[9]); run(900, 0.05);
      FLY[9].group.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(FLY[9].goods);
      if(b.min.y < -0.5)
        throw new Error(key+': it hangs to '+b.min.y.toFixed(2)+'m, through the deck');
      out.push(STAGES[key].label);
      hangGoods(FLY[9], 'none');
    }
    return out;
  });

  P('and the palette offers them', ()=>{
    buildGoodsPalette();
    const w = document.getElementById('goodsPal');
    const labels = Array.prototype.map.call(w.children, b=>b.textContent);
    for(const want of ['half leg (SL)', 'half leg (SR)'])
      if(labels.indexOf(want) < 0) throw new Error('no button for '+want);
    return labels.filter(l=>/leg/.test(l));
  });

  console.log(window.__errs.length ? '--- failures: '+window.__errs.length+' ---'
                                   : '--- failures: 0 ---');
  window.__errs.forEach(e=>console.log('  '+e));
})();
`;

const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); }
catch(e){ console.log('TOP LEVEL THREW: ' + e.message); process.exit(1); }
process.exit((w.__errs||[]).length ? 1 : 0);
