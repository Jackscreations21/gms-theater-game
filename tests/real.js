const {JSDOM} = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname,'..','the-house.html'),'utf8');
const dom = new JSDOM(html.replace(/<script src=.*?<\/script>/,''), {runScripts:'outside-only', pretendToBeVisual:true});
const w = dom.window;
w.HTMLCanvasElement.prototype.getContext = function(){
  const noop=()=>{};
  return {fillRect:noop, fillStyle:'', strokeStyle:'', lineWidth:1, font:'',
    beginPath:noop, moveTo:noop, lineTo:noop, arc:noop, ellipse:noop, stroke:noop, fill:noop,
    save:noop, restore:noop, translate:noop, rotate:noop, scale:noop, drawImage:noop, clearRect:noop, createPattern:()=>null, fillText:noop, bezierCurveTo:noop, quadraticCurveTo:noop, closePath:noop, clip:noop, setTransform:noop,
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
w.performance = {now:()=>Date.now()};
const probe = `
;(function(){
  window.__out = {};
  let n=0;
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); n++; } }
  window.__out = { fatal: window.__fatal||null,
    frames:n,
    cameraPos:[+camera.position.x.toFixed(2),+camera.position.y.toFixed(2),+camera.position.z.toFixed(2)],
    playerPos:[+Player.pos.x.toFixed(2),+Player.pos.y.toFixed(2),+Player.pos.z.toFixed(2)],
    onGround:Player.onGround, mode:Player.mode, yaw:Player.yaw,
    groundHere:groundAt(Player.pos.x,Player.pos.z,Player.pos.y),
    walkable:WALKABLE.length,
    seats: window.SEAT_COUNT,
    drawables:(function(){let m=0,inst=0,instTot=0;scene.traverse(o=>{if(o.isInstancedMesh){inst++;instTot+=o.count;}else if(o.isMesh)m++;});
      return {plainMeshes:m, instancedMeshes:inst, instancesTotal:instTot, totalDraws:m+inst};})(),
    triangles:(function(){let t=0;scene.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.index){
      t+=(o.geometry.index.count/3)*(o.isInstancedMesh?o.count:1);}else if(o.isMesh&&o.geometry&&o.geometry.attributes.position){
      t+=(o.geometry.attributes.position.count/3)*(o.isInstancedMesh?o.count:1);}});return Math.round(t);})(),
    staticLocked:(function(){let n=0;scene.traverse(o=>{if(o.matrixAutoUpdate===false)n++;});return n;})(),
    houseLevel:HOUSE.house, houseLightIntensity:houseLights[0].intensity,
    litFixtures:FIXTURES.filter(f=>f.level>0.01).length,
    poolIntensities:LIGHT_POOL.map(l=>+l.intensity.toFixed(2)),
    totalLights:(function(){let n=0;scene.traverse(o=>{if(o.isLight)n++;});return n;})(),
    liveFixtures:FIXTURES.filter(f=>f._live).map(f=>f.ch),
    sceneChildren:scene.children.length, worldChildren:world.children.length,
    renderCalls:renderer.renderCount,
    veil:document.querySelector('#veil').style.display,
    canvasParent: renderer.domElement.parentNode ? renderer.domElement.parentNode.id : null,
    dockHidden: document.querySelector('#dock').className
  };
})();
`;
const blocks = html.match(/<script>[\s\S]*?<\/script>/g).map(b=>b.replace(/^<script>/,'').replace(/<\/script>$/,''));
const js = 'window.FATAL=function(t,d){ window.__fatal=(t+" :: "+d); };\n' + blocks[blocks.length-1];
// two hoisted declarations in one script and the later one silently wins (M14)
const declCounts = {};
for(const m of js.matchAll(/^function (\w+)\(/gm)) declCounts[m[1]] = (declCounts[m[1]]||0)+1;
const dupes = Object.keys(declCounts).filter(k=>declCounts[k] > 1);
if(dupes.length){
  console.log('!! duplicate top-level function declarations: '+dupes.join(', '));
  process.exit(1);
}
try { w.eval(js + probe); console.log('=== TOP LEVEL + init() OK ==='); }
catch(e){ console.log('!! CONSTRUCTION ERROR: '+e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
console.log(JSON.stringify(w.__out,null,1));
const out = w.__out || {};
const bad = [];
if(out.fatal) bad.push('fatal: '+out.fatal);
if(!out.frames) bad.push('no frames ran');
if(!out.renderCalls) bad.push('nothing rendered');
if(!out.onGround) bad.push('player not on the ground');
if(!out.walkable) bad.push('WALKABLE is empty');
bad.forEach(b=>console.log('!! '+b));
process.exit(bad.length ? 1 : 0);
