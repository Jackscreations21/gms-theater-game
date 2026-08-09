# The workshop, made real — implementation plan (PRs 1–4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the appearance of the four toolbelt tools and the
seven warehouse fixtures so they read as real tools, without changing a
single behaviour and without spending more draw calls than they cost
today.

**Architecture:** A shared workshop palette (canvas textures,
materials, and a `mergeParts()` geometry merger) lands in `src/p2.txt`
beside the existing `TX` and `M`. The tool builders in `src/p9.txt` and
the fixture builders in `src/p2m.txt` are then rewritten in place —
same function names, same signatures, same returned record shapes — so
no caller anywhere changes. Detail is paid for by merging static
clusters into single geometries, which is why the round can add a lot
of visible detail and come out at or below today's mesh count.

**Tech Stack:** three.js r128 (CDN, no build step), one concatenated
HTML file, jsdom + real three.js with a stubbed `WebGLRenderer` for
tests.

**Spec:** `docs/superpowers/specs/2026-08-09-workshop-realism-design.md`
— RULINGS AI–AN are binding. Read it before starting.

---

## Ground rules for this repo (read before touching anything)

You are working in a project with hard, learned-the-hard-way rules.
Breaking these is worse than doing nothing:

1. **`the-house.html` is committed BUILT.** After editing anything in
   `src/`, run `sh build.sh` and commit both the source and the built
   file. Never hand-edit `the-house.html`.
2. **Never sort or reorder `build.sh`.** Its order is a dependency
   order with load-bearing positions. This round adds no new part, so
   you should not touch `build.sh` at all.
3. **All work via PRs to `main`. Never commit to `main`. Never stack
   PRs** — open a dependent PR only after its parent merges, rebased
   onto fresh `main` and retested.
4. **Commits use the owner's no-reply address**
   (`314018971+Jackscreations21@users.noreply.github.com`). It is
   already the repo's `user.email`; do not override it.
5. **PowerShell 5.1 mangles quoted `git commit -m`.** Write the message
   to a file and use `git commit -F <file>`. Prefer the Bash tool.
6. **Never `git add -A` while agent worktrees exist under `.claude/`.**
   Add named paths.
7. **Node is not on a fresh shell's PATH.** Prefix with
   `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
8. **Test probe templates eat every backslash.** The suites embed their
   assertions in a JS template string. Build regexes from
   doubled-backslash strings, and **avoid apostrophes entirely inside
   probe strings** — one escaped `\'` kills the whole probe with
   `missing ) after argument list`.
9. **jsdom's 2D canvas context is a noop stub** (see the top of any
   suite). Textures are drawn into a fake context and `getImageData`
   returns zeroes. **Never assert on texture pixel content** — only
   that a texture object exists and is wired to the right material.
10. **The shared-material trap has bitten three times**
    (`M.serge`/`M.velour`, `LENSM`, `WOODM`). Never mutate a shared
    material in place. Per-object colour uses cache-and-swap.

**Verification commands** (run from the repo root unless noted):

```bash
sh build.sh
```

```bash
cd tests && npm test
```

```bash
cd tests && node real.js
```

---

## File structure

| File | Change | Responsibility |
|---|---|---|
| `src/p2.txt` | modify (after `grain()` ~line 112, and inside `TX`/`M` at ~295/304) | the shared workshop palette: six canvas textures, a stencil helper, the new materials, and `mergeParts()` |
| `src/p9.txt` | modify (1208–1245) | the four belt tool builders |
| `src/p2m.txt` | modify (24–42, 45–84, 123–161, 167–195, 199–215, 217–253) | the seven shed fixture builders |
| `tests/workshop.js` | **create** | the 17th suite: the merge helper, the mesh census, the four survivors |
| `tests/run-all.js` | modify (line 4) | add `workshop` to the suite list |
| `CLAUDE.md`, `docs/guide/TESTING.md` | modify | suite count 16 → 17 |
| `the-house.html` | rebuild | committed built, never hand-edited |

**Note on RULING AJ:** adding `workshop` to `run-all.js`'s list is not
"editing an existing suite" — no existing *assertion* changes. If any
assertion in `vr.js`, `build.js`, `warehouse.js`, `carp.js`, `full14.js`
or the others has to change to go green, **stop**: that is proof the
round altered behaviour, and the implementation is wrong, not the test.

---

# PR 1 — the workshop palette and the belt

Branch: `workshop-palette-belt`. Carries the spec and this plan.

### Task 1: Record the baseline mesh census

This must happen **first**, before any geometry changes, because every
later task is measured against it.

**Files:**
- Create: `tools/census.js`

- [ ] **Step 1: Write the census probe**

```js
/* tools/census.js — prints the mesh count of every object this round
   touches.  Not pass/fail: it is the BASELINE for the RULING AK budget. */
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
  const count = o => { let n=0; if(!o) return -1; o.traverse(c=>{ if(c.isMesh) n++; }); return n; };
  vrBuildBelt();
  const rows = [];
  rows.push(['nailgun', count(VR.toolMesh.nailgun)]);
  rows.push(['hammer',  count(VR.toolMesh.hammer)]);
  rows.push(['tape',    count(VR.toolMesh.tape)]);
  rows.push(['crayon',  count(VR.toolMesh.crayon)]);
  rows.push(['saw:track', count(SAWS.palace.track.group)]);
  rows.push(['saw:chop',  count(SAWS.palace.chop.group)]);
  rows.push(['rack',   count(RACKS.palace.group)]);
  rows.push(['trash',  count(TRASH.palace.group)]);
  rows.push(['lift',   count(LIFTS.palace.group)]);
  rows.push(['cart',   count(CARTS.palace.group)]);
  console.log('BASELINE CENSUS');
  rows.forEach(r=>console.log('  ' + r[0].padEnd(12) + r[1]));
  console.log('JSON ' + JSON.stringify(rows.reduce((a,r)=>{a[r[0]]=r[1]; return a;},{})));
})();
`;
const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g,'');
try{ w.eval(script + probe); }
catch(e){ console.log('TOP LEVEL THREW: ' + e.message); console.log(e.stack.split('\n').slice(0,8).join('\n')); process.exit(1); }
```

- [ ] **Step 2: Run it against the UNCHANGED build**

Run: `cd tests && node ../tools/census.js`

Expected: a `JSON {...}` line. Based on reading the current source the
counts should be approximately `nailgun 3, hammer 2, tape 2, crayon 2,
saw:track 7, saw:chop 7, trash 3, lift 12, cart 13`. **Use the numbers
the probe actually prints, not these** — they are a sanity check only.
If a number differs wildly from the estimate, stop and find out why
before continuing.

- [ ] **Step 3: Record the numbers in the plan**

Paste the `JSON` line into a new `## Baseline census` section at the
bottom of this plan file. Every later budget assertion quotes it.

- [ ] **Step 4: Commit**

```bash
git add tools/census.js docs/superpowers/plans/2026-08-09-workshop-realism-prs1-4.md
git commit -F .git/CMSG
```

with `.git/CMSG` containing:

```
The census probe, and the baseline it measured

RULING AK needs a number to hold the round to. This prints the mesh
count of every object the round touches, measured against the build
before any of it changes.
```

---

### Task 2: `mergeParts()` — the geometry merger

**Files:**
- Modify: `src/p2.txt` (insert after `grain()`, currently ending line 112)
- Create: `tests/workshop.js`
- Modify: `tests/run-all.js:4`

- [ ] **Step 1: Write the failing test**

Create `tests/workshop.js`. Copy the harness header verbatim from
`tests/warehouse.js:1-32` (the JSDOM setup, the canvas stub, the
`THREE.WebGLRenderer` stub, the `requestAnimationFrame` shim), then:

```js
const probe = `
;(function(){
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  window.__errs = [];
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,210):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); if(e.stack) console.log('      '+e.stack.split('\\n').slice(1,4).join(' | ')); window.__errs.push(name+': '+e.message); } };

  console.log('--- the merge helper (RULING AK) ---');
  P('mergeParts bakes a translation into the vertices', ()=>{
    const g = mergeParts([{geo:new THREE.BoxGeometry(1,1,1), pos:[5,0,0]}]);
    const p = g.attributes.position;
    let minX = Infinity, maxX = -Infinity;
    for(let i=0;i<p.count;i++){ minX = Math.min(minX, p.getX(i)); maxX = Math.max(maxX, p.getX(i)); }
    if(Math.abs(minX - 4.5) > 1e-6) throw new Error('minX ' + minX + ', wanted 4.5');
    if(Math.abs(maxX - 5.5) > 1e-6) throw new Error('maxX ' + maxX + ', wanted 5.5');
    return 'x spans ' + minX.toFixed(2) + ' to ' + maxX.toFixed(2);
  });
  P('mergeParts bakes a rotation, and the normals turn with it', ()=>{
    const g = mergeParts([{geo:new THREE.BoxGeometry(2,1,1), rot:[0, Math.PI/2, 0]}]);
    g.computeBoundingBox();
    const b = g.boundingBox;
    if(Math.abs((b.max.x - b.min.x) - 1) > 1e-5) throw new Error('x span ' + (b.max.x-b.min.x) + ', wanted 1');
    if(Math.abs((b.max.z - b.min.z) - 2) > 1e-5) throw new Error('z span ' + (b.max.z-b.min.z) + ', wanted 2');
    const n = g.attributes.normal;
    if(!n) throw new Error('no normals on the merged geometry');
    let len = 0;
    for(let i=0;i<n.count;i++){ len += Math.hypot(n.getX(i), n.getY(i), n.getZ(i)); }
    if(Math.abs(len/n.count - 1) > 1e-3) throw new Error('normals not unit length: ' + (len/n.count));
    return 'a 2x1x1 turned 90deg spans 1 in x and 2 in z';
  });
  P('mergeParts concatenates: two boxes make one geometry', ()=>{
    const one = mergeParts([{geo:new THREE.BoxGeometry(1,1,1)}]);
    const two = mergeParts([{geo:new THREE.BoxGeometry(1,1,1), pos:[-1,0,0]},
                            {geo:new THREE.BoxGeometry(1,1,1), pos:[ 1,0,0]}]);
    if(two.attributes.position.count !== one.attributes.position.count * 2)
      throw new Error('expected ' + (one.attributes.position.count*2) + ' verts, got ' + two.attributes.position.count);
    two.computeBoundingBox();
    if(Math.abs(two.boundingBox.max.x - 1.5) > 1e-6) throw new Error('bbox did not grow to the second box');
    return two.attributes.position.count + ' verts, one buffer';
  });
  P('mergeParts gives the result a bounding sphere', ()=>{
    const g = mergeParts([{geo:new THREE.BoxGeometry(1,1,1), pos:[0,3,0]}]);
    if(!g.boundingSphere) throw new Error('no bounding sphere — it would be culled wrong');
    if(Math.abs(g.boundingSphere.center.y - 3) > 1e-6) throw new Error('sphere centre at y=' + g.boundingSphere.center.y);
    return 'centre y ' + g.boundingSphere.center.y;
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
```

- [ ] **Step 2: Run it and verify it FAILS**

Run: `cd tests && node workshop.js`
Expected: four `ERR` lines, all `mergeParts is not defined`, and
`--- failures: 4 ---`, exit code 1. **This is the negative check** —
record that you saw it.

- [ ] **Step 3: Implement `mergeParts()`**

Insert into `src/p2.txt` immediately after `grain()` (after the current
line 112):

```js
/* ----------------------------------------------------------------------------
   mergeParts — bake a cluster of static detail into ONE geometry.
   r128's core ships no BufferGeometryUtils, so this is the house version.
   Each part is {geo, pos:[x,y,z], rot:[x,y,z], scale:[x,y,z]}; the transform
   is baked into the vertices and the parts are concatenated, so a detailed
   object costs one draw call instead of one per part (RULING AK).
   EVERY part must be drawn with the material the merged mesh is given.
   Anything that moves, is grabbed, or is recoloured at runtime must stay its
   own mesh — see RULING AL for the list that must never come through here.
   -------------------------------------------------------------------------- */
const _mpM = new T.Matrix4(), _mpQ = new T.Quaternion(), _mpE = new T.Euler();
const _mpP = new T.Vector3(), _mpS = new T.Vector3();
function mergeParts(parts){
  const pos = [], nor = [], uvs = [];
  parts.forEach(p=>{
    const src = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    _mpP.set(p.pos ? p.pos[0] : 0, p.pos ? p.pos[1] : 0, p.pos ? p.pos[2] : 0);
    _mpE.set(p.rot ? p.rot[0] : 0, p.rot ? p.rot[1] : 0, p.rot ? p.rot[2] : 0);
    _mpS.set(p.scale ? p.scale[0] : 1, p.scale ? p.scale[1] : 1, p.scale ? p.scale[2] : 1);
    src.applyMatrix4(_mpM.compose(_mpP, _mpQ.setFromEuler(_mpE), _mpS));
    const pa = src.attributes.position, na = src.attributes.normal, ua = src.attributes.uv;
    for(let i=0;i<pa.count;i++){
      pos.push(pa.getX(i), pa.getY(i), pa.getZ(i));
      if(na) nor.push(na.getX(i), na.getY(i), na.getZ(i));
      if(ua) uvs.push(ua.getX(i), ua.getY(i));
    }
    src.dispose();
  });
  const out = new T.BufferGeometry();
  out.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  if(nor.length) out.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  if(uvs.length) out.setAttribute('uv',     new T.Float32BufferAttribute(uvs, 2));
  out.computeBoundingSphere();
  return out;
}
```

Note `p.geo.clone()` on the non-indexed branch: `applyMatrix4` mutates
in place, and the caller's geometry (often a cached one) must not be
touched.

- [ ] **Step 4: Add the suite to the runner**

In `tests/run-all.js:4`, append `'workshop'` to the end of the array:

```js
const suites = ['real','full14','rooms','holes','crew','smoke','show','sets','arc','stages','legs','warehouse','orders','build','vr','carp','workshop'];
```

Also change the comment on line 1 from `sixteen suites` to
`seventeen suites`.

- [ ] **Step 5: Rebuild and verify the test PASSES**

Run: `sh build.sh`
Expected: `built <n> bytes  syntax OK`

Run: `cd tests && node workshop.js`
Expected: four `ok` lines, `--- failures: 0 ---`, exit code 0.

- [ ] **Step 6: Verify every OTHER suite is still green, unedited**

Run: `cd tests && npm test`
Expected: `===== 17/17 suites passed =====`

- [ ] **Step 7: Commit**

```bash
git add src/p2.txt the-house.html tests/workshop.js tests/run-all.js
git commit -F .git/CMSG
```

Message:

```
mergeParts: one draw call for a cluster of static detail

r128's core ships no BufferGeometryUtils. This bakes each part's
transform into its vertices and concatenates them, which is what lets
the round add detail without adding draw calls (RULING AK).

New 17th suite, tests/workshop.js. Four assertions, all verified
failing before the helper existed.
```

---

### Task 3: The workshop textures and materials

**Files:**
- Modify: `src/p2.txt` (new texture functions before `const TX`, currently line 295; new entries in `TX` and `M`)
- Modify: `tests/workshop.js`

- [ ] **Step 1: Write the failing test**

Append inside the probe of `tests/workshop.js`, before the
`console.log(window.__errs.length ...)` line:

```js
  console.log('--- the workshop palette (RULING AM) ---');
  P('the shed palette exists and every material is shared, not per object', ()=>{
    const want = ['galv','castIron','moulded','rubber','hazard','ply'];
    want.forEach(k=>{ if(!M[k]) throw new Error('no M.' + k); });
    if(!TX.galv) throw new Error('no TX.galv');
    if(M.galv.map !== TX.galv) throw new Error('M.galv is not wired to TX.galv');
    return want.join(', ');
  });
  P('the palette is six materials, not one per object', ()=>{
    const set = new Set([M.galv, M.castIron, M.moulded, M.rubber, M.hazard, M.ply]);
    if(set.size !== 6) throw new Error('the palette collapsed to ' + set.size + ' materials');
    return '6 distinct, all shared';
  });
  P('stencil draws a label texture without touching a shared one', ()=>{
    const a = stencilTex('SHOP', '#1a1a1a');
    const b = stencilTex('SHOP', '#1a1a1a');
    if(!a || !a.isTexture) throw new Error('stencilTex did not return a texture');
    if(a !== b) throw new Error('stencilTex is not cached — it would mint a texture per call');
    return 'cached by text and colour';
  });
```

- [ ] **Step 2: Run and verify it FAILS**

Run: `cd tests && node workshop.js`
Expected: three new `ERR` lines (`no M.galv`, etc.), `--- failures: 3 ---`.

- [ ] **Step 3: Write the textures**

Insert into `src/p2.txt` immediately before `const TX = {` (line 295).
These follow the existing texture idiom exactly — `cvs()`, a 2D
context, `grain()`, then `tex()`:

```js
/* ---------- the workshop palette (RULING AM: SHARED, never per object) ----
   Six surfaces serve every tool and every fixture in the shed.  They are
   deliberately few: each CanvasTexture is VRAM and a texture bind, and a
   headset pays for both twice a frame.                                     */
function galvTex(){
  const c=cvs(256,256), x=c.getContext('2d');
  x.fillStyle='#8d9299'; x.fillRect(0,0,256,256);
  for(let i=0;i<160;i++){                       // the spangle of galvanising
    const px=Math.random()*256, py=Math.random()*256, r=6+Math.random()*22;
    x.fillStyle='rgba('+(150+Math.random()*60|0)+','+(155+Math.random()*60|0)+','+(162+Math.random()*60|0)+',0.5)';
    x.beginPath(); x.ellipse(px,py,r,r*0.7,Math.random()*3.14,0,6.3); x.fill();
  }
  for(let i=0;i<40;i++){                        // scuffs
    x.strokeStyle='rgba(70,74,80,'+(0.05+Math.random()*0.15).toFixed(2)+')';
    x.lineWidth=0.5+Math.random()*1.5;
    x.beginPath(); const sx=Math.random()*256, sy=Math.random()*256;
    x.moveTo(sx,sy); x.lineTo(sx+(Math.random()-0.5)*60, sy+(Math.random()-0.5)*20); x.stroke();
  }
  grain(x,256,256,16);
  return tex(c,1,1);
}
function castIronTex(){
  const c=cvs(256,256), x=c.getContext('2d');
  x.fillStyle='#3a3d42'; x.fillRect(0,0,256,256);
  for(let i=0;i<900;i++){                       // the sand-cast pit texture
    x.fillStyle='rgba('+(20+Math.random()*40|0)+','+(22+Math.random()*40|0)+','+(26+Math.random()*40|0)+',0.5)';
    x.beginPath(); x.arc(Math.random()*256, Math.random()*256, 0.6+Math.random()*2.2, 0, 6.3); x.fill();
  }
  grain(x,256,256,10);
  return tex(c,1,1);
}
function mouldedTex(){
  const c=cvs(256,256), x=c.getContext('2d');
  x.fillStyle='#23262b'; x.fillRect(0,0,256,256);
  for(let i=0;i<256;i+=4){                      // the fine mould stipple
    x.strokeStyle='rgba(255,255,255,0.025)'; x.lineWidth=1;
    x.beginPath(); x.moveTo(0,i); x.lineTo(256,i+2); x.stroke();
  }
  grain(x,256,256,8);
  return tex(c,1,1);
}
function rubberTex(){
  const c=cvs(128,128), x=c.getContext('2d');
  x.fillStyle='#191b1e'; x.fillRect(0,0,128,128);
  for(let gy=0;gy<128;gy+=8){                   // the moulded grip diamonds
    for(let gx=0;gx<128;gx+=8){
      x.fillStyle='rgba(255,255,255,0.05)';
      x.beginPath(); x.moveTo(gx+4,gy); x.lineTo(gx+8,gy+4);
      x.lineTo(gx+4,gy+8); x.lineTo(gx,gy+4); x.fill();
    }
  }
  grain(x,128,128,6);
  return tex(c,1,1);
}
function hazardTex(){
  const c=cvs(256,256), x=c.getContext('2d');
  x.fillStyle='#c8a020'; x.fillRect(0,0,256,256);
  for(let i=0;i<70;i++){                        // chipped through to primer
    x.fillStyle='rgba(70,66,58,'+(0.2+Math.random()*0.5).toFixed(2)+')';
    x.beginPath(); x.ellipse(Math.random()*256, Math.random()*256,
      1+Math.random()*7, 1+Math.random()*4, Math.random()*3.14, 0, 6.3); x.fill();
  }
  grain(x,256,256,18);
  return tex(c,1,1);
}
function plyTex(){
  const c=cvs(256,256), x=c.getContext('2d');
  x.fillStyle='#b99560'; x.fillRect(0,0,256,256);
  for(let i=0;i<220;i++){                       // the strand of OSB
    x.fillStyle='rgba('+(140+Math.random()*70|0)+','+(110+Math.random()*55|0)+','+(66+Math.random()*40|0)+',0.55)';
    x.save(); x.translate(Math.random()*256, Math.random()*256); x.rotate(Math.random()*3.14);
    x.fillRect(-14,-3.5,28,7); x.restore();
  }
  grain(x,256,256,14);
  return tex(c,1,1);
}
/* stencilled labels — cached by text and colour so a shed full of the same
   label is ONE texture (RULING AM) */
const STENCILS = {};
function stencilTex(text, bg){
  const key = text + '|' + bg;
  if(STENCILS[key]) return STENCILS[key];
  const c=cvs(256,128), x=c.getContext('2d');
  x.fillStyle=bg||'#1a1a1a'; x.fillRect(0,0,256,128);
  x.fillStyle='#d8d4c8'; x.font='bold 44px monospace';
  x.textAlign='center'; x.textBaseline='middle';
  x.fillText(text, 128, 64);
  return STENCILS[key] = tex(c,1,1);
}
```

- [ ] **Step 4: Wire them into `TX` and `M`**

In `src/p2.txt`, extend the `TX` literal (line 295) — add before the
closing brace:

```js
  galv: galvTex(), castIron: castIronTex(), moulded: mouldedTex(),
  rubber: rubberTex(), hazard: hazardTex(), ply: plyTex(),
```

and extend `M` (line 304) — add before its closing brace:

```js
  /* the workshop palette — SHARED across every tool and fixture (RULING AM).
     Never tint one of these in place: the shared-material trap has bitten
     three times (M.serge/M.velour, LENSM, WOODM). */
  galv:     new T.MeshStandardMaterial({map:TX.galv, roughness:.55, metalness:.7}),
  castIron: new T.MeshStandardMaterial({map:TX.castIron, roughness:.72, metalness:.5}),
  moulded:  new T.MeshStandardMaterial({map:TX.moulded, roughness:.62, metalness:.05}),
  rubber:   new T.MeshStandardMaterial({map:TX.rubber, roughness:.95, metalness:.02}),
  hazard:   new T.MeshStandardMaterial({map:TX.hazard, roughness:.7,  metalness:.15}),
  ply:      new T.MeshStandardMaterial({map:TX.ply, roughness:.85, metalness:.02}),
```

- [ ] **Step 5: Rebuild and verify the tests PASS**

Run: `sh build.sh` then `cd tests && node workshop.js`
Expected: seven `ok` lines, `--- failures: 0 ---`.

- [ ] **Step 6: Verify the whole suite**

Run: `cd tests && npm test`
Expected: `===== 17/17 suites passed =====`

- [ ] **Step 7: Commit**

```bash
git add src/p2.txt the-house.html tests/workshop.js
git commit -F .git/CMSG
```

Message:

```
The workshop palette: six shared surfaces and a stencil helper

Galvanised steel, cast iron, moulded plastic, rubber grip, chipped
hazard yellow and ply, all drawn on a canvas the way every other
texture in this game is (RULING AI), and all SHARED (RULING AM) --
each CanvasTexture is VRAM and a bind, paid for twice a frame in a
headset. Labels are cached by text and colour.
```

---

### Task 4: The nail gun

**Files:**
- Modify: `src/p9.txt:1211-1220` (`vrToolGun`)
- Modify: `tests/workshop.js`

- [ ] **Step 1: Write the failing budget test**

Append inside the probe, before the failures line:

```js
  console.log('--- the belt, rebuilt (RULING AK budget) ---');
  P('the belt tools cost no more meshes than they did', ()=>{
    if(!VR.belt) vrBuildBelt();
    const count = o => { let n=0; o.traverse(c=>{ if(c.isMesh) n++; }); return n; };
    const BUDGET = {nailgun:3, hammer:2, tape:2, crayon:2};
    const got = {};
    Object.keys(BUDGET).forEach(k=>{
      got[k] = count(VR.toolMesh[k]);
      if(got[k] > BUDGET[k]) throw new Error(k + ' is ' + got[k] + ' meshes, budget ' + BUDGET[k]);
    });
    return got;
  });
  P('the gun still points from the same muzzle', ()=>{
    if(!VR.belt) vrBuildBelt();
    const g = VR.toolMesh.nailgun;
    let nose = null;
    g.traverse(c=>{ if(c.isMesh && c.position.z < -0.1) nose = c; });
    if(!nose) throw new Error('nothing at the muzzle end of the gun');
    return 'muzzle part at z ' + nose.position.z.toFixed(3);
  });
```

**Replace the `BUDGET` numbers with the ones Task 1's census actually
printed** if they differ.

- [ ] **Step 2: Run and verify the budget test PASSES already**

Run: `cd tests && node workshop.js`
Expected: `ok` — the budget holds trivially before the rebuild, because
nothing has changed yet. This assertion is a **ratchet**, not a
negative check: its job is to fail if Step 3 overspends. Confirm it is
green now so a failure later means something.

- [ ] **Step 3: Rebuild `vrToolGun` as a real framing nailer**

Replace `src/p9.txt:1211-1220` entirely:

```js
/* a pneumatic framing nailer: angled stick magazine, depth-adjust nose,
   contact tip, hose fitting at the heel.  The whole static body is ONE
   merged mesh per material (RULING AK); the muzzle stays where nailRay
   has always cast from, at z -0.16 (RULING AJ: nothing moves). */
function vrToolGun(){
  const g = new T.Group();
  const shell = new T.Mesh(toolG('gun:shell', ()=>mergeParts([
    {geo:new T.BoxGeometry(0.05, 0.085, 0.15),  pos:[0, 0.02, -0.04]},          // motor housing
    {geo:new T.CylinderGeometry(0.026, 0.026, 0.10, 10), pos:[0, 0.055, 0.01], rot:[Math.PI/2, 0, 0]}, // head cap
    {geo:new T.BoxGeometry(0.036, 0.095, 0.045), pos:[0, -0.05, 0.03], rot:[0.25, 0, 0]},  // grip core
    {geo:new T.BoxGeometry(0.028, 0.012, 0.20),  pos:[0, -0.075, -0.07], rot:[-0.42, 0, 0]}, // magazine rail
    {geo:new T.BoxGeometry(0.034, 0.030, 0.18),  pos:[0, -0.058, -0.07], rot:[-0.42, 0, 0]}  // magazine body
  ])), M.moulded);
  g.add(shell);
  const steel = new T.Mesh(toolG('gun:steel', ()=>mergeParts([
    {geo:new T.CylinderGeometry(0.011, 0.011, 0.07, 8), pos:[0, 0.01, -0.16], rot:[Math.PI/2, 0, 0]},  // nose
    {geo:new T.CylinderGeometry(0.016, 0.016, 0.02, 8), pos:[0, 0.01, -0.125], rot:[Math.PI/2, 0, 0]}, // depth adjuster
    {geo:new T.BoxGeometry(0.026, 0.026, 0.012),        pos:[0, -0.004, -0.192]},                       // contact tip
    {geo:new T.CylinderGeometry(0.010, 0.010, 0.03, 8), pos:[0, -0.10, 0.055], rot:[0.25, 0, 0]},       // hose fitting
    {geo:new T.BoxGeometry(0.014, 0.020, 0.014),        pos:[0, -0.012, -0.012]}                        // trigger
  ])), M.castIron);
  g.add(steel);
  const grip = new T.Mesh(toolG('gun:grip', ()=>new T.CylinderGeometry(0.021, 0.021, 0.085, 10)), M.rubber);
  grip.rotation.set(0.25 + Math.PI/2, 0, 0); grip.position.set(0, -0.05, 0.03);
  g.add(grip);
  return g;
}
```

That is 3 meshes — exactly the budget, for an object that was three
plain boxes.

- [ ] **Step 4: Rebuild and verify**

Run: `sh build.sh` then `cd tests && node workshop.js`
Expected: all `ok`, `--- failures: 0 ---`. If the budget line fails,
merge more aggressively — do not raise the budget.

- [ ] **Step 5: Verify `vr.js` is still green, UNEDITED**

Run: `cd tests && node vr.js`
Expected: `--- failures: 0 ---`. This is RULING AJ's check: the gun's
grab, holster, draw, trigger and `nailRay` behaviour must be untouched.

- [ ] **Step 6: Commit**

```bash
git add src/p9.txt the-house.html tests/workshop.js
git commit -F .git/CMSG
```

Message:

```
The nail gun is a framing nailer

Angled stick magazine, depth-adjust nose, contact tip, hose fitting and
a rubber grip -- in the same three meshes the three plain boxes cost,
because the static shell merges per material (RULING AK). The muzzle
did not move: nailRay still casts from z -0.16, and vr.js passes
unedited (RULING AJ).
```

---

### Task 5: The hammer, the tape and the crayon

**Files:**
- Modify: `src/p9.txt:1221-1245` (`vrToolHammer`, `vrToolTape`, `vrToolCrayon`)

The budget assertion from Task 4 already covers these three. No new
test is needed — it will fail if any of them overspends.

- [ ] **Step 1: Rebuild the three builders**

Replace `src/p9.txt:1221-1245`:

```js
/* a 20oz framing hammer: forged head with a claw and a waffled face, a
   tapered neck, a wood haft with a grip wrap.  Two meshes, as before. */
function vrToolHammer(){
  const g = new T.Group();
  const haft = new T.Mesh(toolG('ham:haft', ()=>mergeParts([
    {geo:new T.CylinderGeometry(0.013, 0.016, 0.20, 8), pos:[0, 0, 0.07], rot:[Math.PI/2, 0, 0]},
    {geo:new T.CylinderGeometry(0.017, 0.015, 0.07, 8), pos:[0, 0, 0.155], rot:[Math.PI/2, 0, 0]}  // swell at the butt
  ])), M.rubber);
  g.add(haft);
  const head = new T.Mesh(toolG('ham:head', ()=>mergeParts([
    {geo:new T.CylinderGeometry(0.017, 0.020, 0.045, 10), pos:[0, 0, -0.125], rot:[Math.PI/2, 0, 0]}, // face
    {geo:new T.BoxGeometry(0.026, 0.030, 0.055),          pos:[0, 0, -0.088]},                        // eye and neck
    {geo:new T.BoxGeometry(0.020, 0.011, 0.040),          pos:[0, 0.014, -0.052], rot:[-0.55, 0, 0]}, // claw root
    {geo:new T.BoxGeometry(0.017, 0.009, 0.034),          pos:[0, 0.037, -0.030], rot:[-1.05, 0, 0]}, // claw curve
    {geo:new T.CylinderGeometry(0.010, 0.014, 0.045, 8),  pos:[0, 0, -0.062], rot:[Math.PI/2, 0, 0]}  // tapered neck
  ])), M.castIron);
  g.add(head);
  return g;
}
/* a cased 25ft tape: rounded ABS shell, brake button, belt clip, and a
   hooked blade tip standing proud.  The tab the other hand takes stays at
   its old offset (RULING AJ) — vrTapeLine reads it. */
function vrToolTape(){
  const g = new T.Group();
  const shell = new T.Mesh(toolG('tape:shell', ()=>mergeParts([
    {geo:new T.BoxGeometry(0.066, 0.066, 0.044), pos:[0, 0, 0]},
    {geo:new T.CylinderGeometry(0.033, 0.033, 0.046, 14), pos:[0, 0.005, 0], rot:[Math.PI/2, 0, 0]}, // the drum bulge
    {geo:new T.BoxGeometry(0.020, 0.012, 0.014), pos:[0, 0.036, -0.010]},                            // brake button
    {geo:new T.BoxGeometry(0.016, 0.040, 0.004), pos:[0, -0.012, 0.026]}                             // belt clip
  ])), M.moulded);
  g.add(shell);
  const tab = new T.Mesh(toolG('tape:tab', ()=>mergeParts([
    {geo:new T.BoxGeometry(0.030, 0.018, 0.010), pos:[0, 0, 0]},                    // the hook
    {geo:new T.BoxGeometry(0.026, 0.004, 0.022), pos:[0, 0.008, 0.014]}             // the blade standing proud
  ])), M.galv);
  tab.position.set(0, -0.03, -0.035);
  g.add(tab);
  return g;
}
/* a carpenter's pencil: flat oval body, chisel tip, printed band.
   M_CRAYON is the existing declaration from the old line 1237 — it sits
   INSIDE the replaced range, so it must be carried across, right here. */
const M_CRAYON = new T.MeshStandardMaterial({color:0x2f6fd6, roughness:.7});
function vrToolCrayon(){
  const g = new T.Group();
  const stick = new T.Mesh(toolG('cray:stick', ()=>{
    const geo = mergeParts([
      {geo:new T.CylinderGeometry(0.011, 0.011, 0.125, 8), pos:[0, 0, -0.015], rot:[Math.PI/2, 0, 0]},
      {geo:new T.ConeGeometry(0.011, 0.028, 8),            pos:[0, 0, -0.091], rot:[-Math.PI/2, 0, 0]}
    ]);
    geo.scale(1, 0.55, 1);           // a carpenter's pencil is flat, not round
    return geo;
  }), M_CRAYON);
  g.add(stick);
  const band = new T.Mesh(toolG('cray:band', ()=>{
    const geo = mergeParts([
      {geo:new T.CylinderGeometry(0.0125, 0.0125, 0.018, 8), pos:[0, 0, 0.045], rot:[Math.PI/2, 0, 0]}
    ]);
    geo.scale(1, 0.55, 1);
    return geo;
  }), M.galv);
  g.add(band);
  return g;
}
```

Note the `M_CRAYON` declaration inside that block: it currently lives at
`src/p9.txt:1237`, which is **inside** the range being replaced. Carry
it across exactly as shown or the build dies on an undefined reference.

- [ ] **Step 2: Rebuild and verify the budget still holds**

Run: `sh build.sh` then `cd tests && node workshop.js`
Expected: `--- failures: 0 ---`, budget line reports
`{"nailgun":3,"hammer":2,"tape":2,"crayon":2}`.

- [ ] **Step 3: Verify the behaviour suites, UNEDITED**

Run: `cd tests && npm test`
Expected: `===== 17/17 suites passed =====`. Pay particular attention
to `vr.js` (the belt, the draw radius, the tape tab) and `carp.js` (the
crayon's mark).

- [ ] **Step 4: Commit**

```bash
git add src/p9.txt the-house.html
git commit -F .git/CMSG
```

Message:

```
The hammer, the tape and the crayon

A 20oz framing hammer with a claw and a waffled face, a cased tape with
a brake button, belt clip and a hooked blade, and a carpenter's pencil
that is actually flat. Same mesh count as the six plain boxes they
replace; every holster position, grab radius and tab offset unchanged.
```

---

### Task 6: Ship PR 1

- [ ] **Step 1: Full verification**

```bash
sh build.sh
```
Expected: `built <n> bytes  syntax OK`

```bash
cd tests && npm test
```
Expected: `===== 17/17 suites passed =====`

```bash
cd tests && node real.js
```
Expected: `"fatal": null`

- [ ] **Step 2: Confirm no existing suite was edited**

Run: `git diff --stat main -- tests/`
Expected: only `tests/workshop.js` (new) and `tests/run-all.js`
(one line + one comment). **If any other test file appears, stop** —
RULING AJ was broken.

- [ ] **Step 3: Update the docs**

In `CLAUDE.md`, change `all 16 suites` to `all 17 suites` in the
Commands block. In `docs/guide/TESTING.md`, change the suite count and
add a `workshop.js` row to the suite table describing it as "the merge
helper, the mesh census, and the parts that must never merge".

- [ ] **Step 4: Commit and open the PR**

```bash
git add CLAUDE.md docs/guide/TESTING.md docs/superpowers/specs docs/superpowers/plans
git commit -F .git/CMSG
git push -u origin workshop-palette-belt
```

Open the PR with the API recipe in `docs/guide/WORKFLOW.md`, `base:
main`. **Write the PR body JSON to the scratchpad directory, not the
repo root** — `pr6.json` in the root is a leftover from someone
forgetting this.

---

# PR 2 — the cut stations

Branch: `workshop-saws`, cut **after PR 1 merges**, rebased onto fresh
`main`, retested before opening.

### Task 7: The track table and the chop bench

**Files:**
- Modify: `src/p2m.txt:123-161` (`buildSaw`)
- Modify: `tests/workshop.js`

- [ ] **Step 1: Write the failing survivor + budget test**

Append inside the probe:

```js
  console.log('--- the cut stations (RULINGS AK + AL) ---');
  P('the saws cost no more meshes than they did', ()=>{
    const count = o => { let n=0; o.traverse(c=>{ if(c.isMesh) n++; }); return n; };
    const t = count(SAWS.palace.track.group), ch = count(SAWS.palace.chop.group);
    if(t > 7)  throw new Error('track saw is ' + t + ' meshes, budget 7');
    if(ch > 7) throw new Error('chop bench is ' + ch + ' meshes, budget 7');
    return {track:t, chop:ch};
  });
  P('the cutter survived the merge as its own moving group (RULING AL)', ()=>{
    ['track','chop'].forEach(k=>{
      const st = SAWS.palace[k];
      if(!st.cutter) throw new Error(k + ' lost its cutter');
      if(!st.cutter.userData.moves) throw new Error(k + ' cutter lost userData.moves');
      if(st.cutter.parent !== st.group) throw new Error(k + ' cutter was merged into the body');
      let n = 0; st.cutter.traverse(c=>{ if(c.isMesh) n++; });
      if(n < 1) throw new Error(k + ' cutter has no mesh of its own');
    });
    return 'both cutters still slide';
  });
  P('the saw record kept every field the logic reads', ()=>{
    const st = SAWS.palace.track;
    ['venue','kind','group','seat','cutter','pieces','cut','span','grabR','gripY']
      .forEach(f=>{ if(st[f] === undefined) throw new Error('saw record lost ' + f); });
    if(Math.abs(st.grabR - 0.28) > 1e-9) throw new Error('grabR moved to ' + st.grabR);
    return 'span ' + st.span.toFixed(2) + ', grabR ' + st.grabR;
  });
```

- [ ] **Step 2: Run and confirm the budget/survivor tests pass BEFORE the change**

Run: `cd tests && node workshop.js`
Expected: all `ok`. These are ratchets — confirm green now so a failure
after Step 3 is meaningful.

- [ ] **Step 3: Rebuild `buildSaw`**

Rewrite `src/p2m.txt:123-161`. The contract that must not change:
`g.position.set(wx - ox, 0, wz)`; `seat` is an `Object3D` at
`topY + 0.035`; `cutter` is a `Group` at `topY + 0.035` carrying
`userData.moves = true`; the returned record keeps every field listed
in the test above, with `span: W - 0.1`, `grabR: 0.28`,
`gripY: topY + 0.2`; `SAWS[venue][kind] = st`.

The static body becomes **two merged meshes** — one `M.galv` (the top,
fence and legs) and one `M.castIron` (braces, motor, kerf plate) — and
the cutter becomes **one or two meshes** inside its group.

Parts for the **track table** (`kind === 'track'`, `W = 2.9`,
`D2 = 1.6`, `topY = 0.86`):

- galv: the top `BoxGeometry(W, 0.07, D2)` at y `topY`; a fence
  `BoxGeometry(W, 0.09, 0.05)` at y `topY+0.08`, z `-D2/2+0.12`; four
  legs `CylinderGeometry(0.03,0.03,topY,6)` at the existing four corner
  positions; two stretchers `BoxGeometry(W-0.3, 0.04, 0.04)` at y 0.2,
  z `±(D2/2-0.1)`.
- castIron: four T-slot strips `BoxGeometry(W, 0.012, 0.03)` at y
  `topY+0.036`, z `-D2/2+0.35 + i*0.3` for i 0..3.
- cutter group: the rail `BoxGeometry(0.09, 0.03, D2+0.3)` at y 0.08 in
  `M.galv`; the head merged in `M.moulded` — a housing
  `BoxGeometry(0.2, 0.14, 0.22)` at y 0.16, a motor barrel
  `CylinderGeometry(0.055,0.055,0.14,10)` rotated `[0,0,Math.PI/2]` at
  `[0.11, 0.19, 0]`, a guard `CylinderGeometry(0.09,0.09,0.03,12)`
  rotated `[0,0,Math.PI/2]` at `[-0.02, 0.13, 0]`, and a dust port
  `CylinderGeometry(0.024,0.024,0.07,8)` rotated `[Math.PI/2,0,0]` at
  `[0, 0.2, 0.12]`.

Parts for the **chop bench** (`kind === 'chop'`, `W = 2.8`,
`D2 = 0.62`):

- galv: the top, the four legs and two stretchers as above; plus a
  fence `BoxGeometry(W, 0.11, 0.045)` at y `topY+0.09`,
  z `-D2/2+0.10`.
- castIron: a kerf plate `BoxGeometry(0.34, 0.014, D2-0.1)` at y
  `topY+0.038`; two feed-arm rollers
  `CylinderGeometry(0.03,0.03,0.30,8)` rotated `[0,0,Math.PI/2]` at
  `[±(W/2-0.28), topY+0.06, 0]`.
- cutter group: merged in `M.castIron` — the arm
  `BoxGeometry(0.07, 0.5, 0.1)` at `[0, 0.25, -D2/2-0.06]`, a pivot
  boss `CylinderGeometry(0.05,0.05,0.09,10)` rotated `[0,0,Math.PI/2]`
  at `[0, 0.46, -D2/2-0.06]`, a motor
  `CylinderGeometry(0.07,0.07,0.18,10)` rotated `[0,0,Math.PI/2]` at
  `[0.13, 0.32, -0.02]`, and a handle
  `CylinderGeometry(0.018,0.018,0.13,8)` rotated `[Math.PI/2,0,0]` at
  `[0, 0.42, 0.08]`; plus the blade, kept as its own mesh in `M.galv`:
  `CylinderGeometry(0.16, 0.16, 0.012, 16)` rotated
  `[0,0,Math.PI/2]` at y 0.3 — unchanged from today, and a guard
  merged into the arm cluster as `CylinderGeometry(0.18,0.18,0.02,14)`
  rotated `[0,0,Math.PI/2]` at `[-0.01, 0.30, 0]`.

Keep the existing
`g.traverse(o=>{ if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });`
line and the `parent.add(g)` that follows.

- [ ] **Step 4: Rebuild and verify**

Run: `sh build.sh` then `cd tests && node workshop.js`
Expected: `--- failures: 0 ---`, both saws at or under 7 meshes.

- [ ] **Step 5: Verify behaviour, UNEDITED**

Run: `cd tests && npm test`
Expected: `===== 17/17 suites passed =====`. `build.js` covers seating,
`sawSetCut` and `sawCut`; `carp.js` covers the lead carpenter working
both stations. Neither may be touched.

- [ ] **Step 6: Commit and ship PR 2**

```bash
git add src/p2m.txt the-house.html tests/workshop.js
git commit -F .git/CMSG
git push -u origin workshop-saws
```

Message:

```
The cut stations are real saws

The track table gets a fence, T-slots, stretchers and a saw head with a
motor, guard and dust port; the chop bench gets a kerf plate, feed
rollers, a pivot boss, a motor and a handle. Both come in at or under
their old seven meshes because the static body merges per material.

The cutter stays its own group with userData.moves (RULING AL) -- it
slides, it is a grab class, and merging it would have killed both saws.
```

---

# PR 3 — the paint rack, the roller, the cans and the drum

Branch: `workshop-paint`, cut **after PR 2 merges**.

### Task 8: The paint rack and roller

**Files:**
- Modify: `src/p2m.txt:167-195` (`buildRack`)
- Modify: `tests/workshop.js`

- [ ] **Step 1: Write the failing survivor test**

```js
  console.log('--- the paint rack (RULING AL) ---');
  P('the roller head survived as its own mesh with its own material', ()=>{
    const ro = RACKS.palace.roller;
    if(!ro || !ro.head) throw new Error('the rack lost its roller head');
    if(!ro.head.isMesh) throw new Error('the roller head is not a mesh');
    if(!ro.head.material) throw new Error('the roller head has no material of its own');
    const before = ro.head.material;
    ro.head.material = woodMat(0x884422);
    if(ro.head.material === before) throw new Error('the head material cannot be swapped');
    ro.head.material = before;
    return 'swappable, so a dip still shows';
  });
  P('the rack record kept every field the logic reads', ()=>{
    const r = RACKS.palace;
    ['venue','group','shelfW','shelfY','colors','canMeshes','roller'].forEach(f=>{
      if(r[f] === undefined) throw new Error('rack record lost ' + f); });
    if(Math.abs(r.roller.grabR - 0.22) > 1e-9) throw new Error('roller grabR moved');
    if(!r.roller.home) throw new Error('the roller lost its home — vrReRack would throw');
    return 'shelfY ' + r.shelfY + ', grabR ' + r.roller.grabR;
  });
  P('the cans are still one mesh each, one material each', ()=>{
    const r = RACKS.palace;
    if(!r.canMeshes.length) throw new Error('no cans on the rack');
    const mats = new Set(r.canMeshes.map(c=>c.material));
    if(mats.size < r.canMeshes.length) throw new Error('cans are sharing materials — colours would collapse');
    return r.canMeshes.length + ' cans, ' + mats.size + ' materials';
  });
```

- [ ] **Step 2: Run and confirm green before the change**

Run: `cd tests && node workshop.js` — expected all `ok`.

- [ ] **Step 3: Rebuild `buildRack`**

Rewrite `src/p2m.txt:167-195`. The contract: `g.position.set(wx - ox,
0, wz)`, `g.rotation.y = yaw || 0`, `shelfW = 2.4`, `shelfY = 1.025`,
`roller.home` at `[shelfW/2 - 0.15, 1.55, 0.05]`, `roller.grabR = 0.22`,
`RACKS[venue] = rack`, and `rackCans(rack)` still called at the end.

The shelving becomes **one merged `M.galv` mesh**: two shelf boards
`BoxGeometry(shelfW, 0.05, 0.36)` at y 1.0 and 1.5 (unchanged
positions); four uprights `BoxGeometry(0.05, 1.75, 0.05)` at
x `±(shelfW/2 - 0.04)`, z `±0.15`, y 0.875; four shelf brackets
`BoxGeometry(0.04, 0.04, 0.30)` at the shelf ends; and a back rail
`BoxGeometry(shelfW, 0.04, 0.03)` at y 1.72, z `-0.16`. Add a **second
merged `M.ply` mesh** for a drip board: `BoxGeometry(shelfW - 0.1,
0.018, 0.34)` at y 1.03, and a second at y 1.53.

The roller keeps two meshes: the handle merged in `M.galv` (the stem
`CylinderGeometry(0.012,0.012,0.2,8)` at y `-0.1`, a grip
`CylinderGeometry(0.016,0.016,0.07,8)` at y `-0.17`, and the crank
`BoxGeometry(0.012, 0.012, 0.05)` at `[0, 0.02, 0.025]`), and
**`head` unchanged in shape and still its own mesh** —
`CylinderGeometry(0.035, 0.035, 0.18, 10)` rotated `[0,0,Math.PI/2]` at
y 0.03. Its material must remain individually assignable, because
`src/p9.txt:2528` swaps it to show the last dip.

- [ ] **Step 4: Rebuild, verify, and check `build.js` unedited**

Run: `sh build.sh` then `cd tests && npm test`
Expected: `===== 17/17 suites passed =====`.

- [ ] **Step 5: Commit**

Message:

```
The paint rack is a rack

Uprights, brackets, a back rail and drip-stained boards, merged into
two meshes. The roller head stays its own mesh with its own material
(RULING AL) -- p9 swaps it to show the last dip, and merging it would
have made every dip invisible.
```

### Task 9: The trash drum

**Files:**
- Modify: `src/p2m.txt:199-215` (`buildTrash`)

- [ ] **Step 1: Add the budget assertion**

```js
  P('the drum costs no more than it did', ()=>{
    let n = 0; TRASH.palace.group.traverse(c=>{ if(c.isMesh) n++; });
    if(n > 3) throw new Error('the drum is ' + n + ' meshes, budget 3');
    if(Math.abs(TRASH.palace.r - 0.45) > 1e-9) throw new Error('the drum mouth radius moved');
    return n + ' meshes, r ' + TRASH.palace.r;
  });
```

- [ ] **Step 2: Rebuild `buildTrash`**

Keep `TRASH[venue] = {venue, group:g, r:0.45}` exactly. Merge into
**one `M.galv` mesh**: the body `CylinderGeometry(0.32, 0.28, 0.85, 14)`
at y 0.425 (unchanged), the rim `TorusGeometry(0.32, 0.03, 8, 14)`
rotated `[Math.PI/2,0,0]` at y 0.86, and three hoop bands
`TorusGeometry(0.315, 0.014, 6, 14)` rotated `[Math.PI/2,0,0]` at y
0.22, 0.48 and 0.74. Keep the dark `mouth` disc as its own mesh with
its `MeshBasicMaterial` — it reads as the hole and must not take light.

That is 2 meshes against a budget of 3.

- [ ] **Step 3: Rebuild, run `npm test`, commit, ship PR 3**

Expected: `===== 17/17 suites passed =====`.

---

# PR 4 — the heavy plant

Branch: `workshop-plant`, cut **after PR 3 merges**.

### Task 10: The forklift

**Files:**
- Modify: `src/p2m.txt:217-253` (`buildLift`)
- Modify: `tests/workshop.js`

- [ ] **Step 1: Write the failing survivor test**

```js
  console.log('--- the heavy plant (RULINGS AK + AL) ---');
  P('the forks survived the merge as their own moving group', ()=>{
    const L = LIFTS.palace;
    if(!L.forks) throw new Error('the lift lost its forks');
    if(L.forks.parent !== L.group) throw new Error('the forks were merged into the body');
    let n = 0; L.forks.traverse(c=>{ if(c.isMesh) n++; });
    if(n < 1) throw new Error('the forks have no mesh');
    L.forks.position.y = 0.5;
    if(Math.abs(L.forks.position.y - 0.5) > 1e-9) throw new Error('the forks cannot be moved');
    L.forks.position.y = 0;
    return 'forks lift, ' + n + ' mesh(es)';
  });
  P('the lift record kept every field the p9 cart machinery reads', ()=>{
    const L = LIFTS.palace;
    ['venue','group','x','z','yaw','yBase','handleH','handleZ','handleHalf','grabR','slots','lift','forks','forkY','prevForkY','riding']
      .forEach(f=>{ if(L[f] === undefined) throw new Error('lift record lost ' + f); });
    if(CARTS.palaceLift !== L) throw new Error('the lift is no longer registered as a cart');
    if(Math.abs(L.handleH - 1.0) > 1e-9) throw new Error('the tiller handle moved');
    return 'handleH ' + L.handleH + ', grabR ' + L.grabR;
  });
  P('the plant costs no more meshes than it did', ()=>{
    const count = o => { let n=0; o.traverse(c=>{ if(c.isMesh) n++; }); return n; };
    const l = count(LIFTS.palace.group), c = count(CARTS.palace.group);
    if(l > 12) throw new Error('the lift is ' + l + ' meshes, budget 12');
    if(c > 13) throw new Error('the cart is ' + c + ' meshes, budget 13');
    return {lift:l, cart:c};
  });
```

Replace `12` and `13` with Task 1's measured numbers if they differ.

- [ ] **Step 2: Confirm green before the change, then rebuild `buildLift`**

The contract: `g.userData.moves = true`; the record keeps every field
in the test; `LIFTS[venue] = lift`; `CARTS[venue + 'Lift'] = lift`;
`cartPose(lift)`; `INTERACT.push(g)`.

Static body merged into **one `M.hazard` mesh** (the body
`BoxGeometry(0.62, 0.72, 0.6)` at `[0, 0.42, -0.26]`, plus a control
head `BoxGeometry(0.30, 0.12, 0.18)` at `[0, 0.95, -0.52]` and a
counterweight `BoxGeometry(0.5, 0.22, 0.16)` at `[0, 0.16, -0.5]`) and
**one `M.galv` mesh** (the two mast channels
`BoxGeometry(0.07, 1.62, 0.07)` at `[±0.24, 0.81, 0.1]`, a mast tie
`BoxGeometry(0.55, 0.06, 0.05)` at `[0, 1.6, 0.1]`, the tiller handle
`CylinderGeometry(0.022,0.022,0.56,8)` rotated `[0,0,Math.PI/2]` at
`[0, 1.0, -0.62]`, the stem `CylinderGeometry(0.02,0.02,0.5,6)` rotated
`[0.55,0,0]` at `[0, 0.82, -0.5]`, a hydraulic ram
`CylinderGeometry(0.035,0.035,1.0,8)` at `[0, 0.6, 0.1]`, and a lift
chain `BoxGeometry(0.02, 1.4, 0.012)` at `[0, 0.85, 0.14]`). Keep the
four wheels as **one merged `M.castIron` mesh** at their existing
positions.

The **forks group stays a child group** with its two fork tines and
carriage merged into **one `M.galv` mesh** — one mesh, still movable,
still the thing pallets `attach()` to.

- [ ] **Step 3: Rebuild, verify, commit**

Run: `sh build.sh` then `cd tests && npm test`
Expected: `===== 17/17 suites passed =====`. `warehouse.js` drives the
lift, `build.js` drives pallets onto the forks; neither may change.

### Task 11: The pushcart and the storage racking

**Files:**
- Modify: `src/p2m.txt:45-84` (`buildCart`), `src/p2m.txt:25-42` (`shedRack`)

- [ ] **Step 1: Rebuild `buildCart`**

Contract: `g.userData.moves = true`, `g.userData.cartInfo = true`, the
record's `handleH:1.02, handleZ:-0.72, handleHalf:0.33, grabR:0.30`,
the six slot `Object3D`s at their exact existing offsets,
`CARTS[venue] = cart`, `cartPose(cart)`, `INTERACT.push(g)`.

Merge into **one `M.galv` mesh** (both shelf frames, four legs, the
handle bar, the two uprights, plus four new corner gussets
`BoxGeometry(0.05, 0.05, 0.05)` at the leg tops and a lower rail
`BoxGeometry(0.7, 0.03, 0.03)` at `[0, 0.14, 0]`) and **one merged
`M.castIron` mesh** for the four castors (each a wheel
`CylinderGeometry(0.08,0.08,0.05,10)` rotated `[0,0,Math.PI/2]` plus a
yoke `BoxGeometry(0.06, 0.07, 0.03)` above it). Add **one `M.ply`
mesh** for two deck boards `BoxGeometry(0.72, 0.016, 1.22)` at y 0.29
and 0.89, which is what makes it read as a shop cart.

That is 3 meshes against a budget of 13.

- [ ] **Step 2: Rebuild `shedRack`**

Contract: the function still pushes 8 `Object3D` slot anchors into the
`slots` array at their exact existing positions
(`-1.35 + i*0.9`, `sy + 0.06`, `0` for `sy` of 0.55 and 1.45), and
still returns `g`.

Merge the whole bay into **one `M.galv` mesh**: the back frame
`BoxGeometry(3.6, 2.2, 0.1)` at `[0, 1.1, -0.3]`, the two shelves at
their existing positions, four punched uprights
`BoxGeometry(0.08, 2.2, 0.08)` at `[±1.76, 1.1, ±0.26]`, four beams
`BoxGeometry(3.6, 0.07, 0.05)` at y 0.52 and 1.42, z `±0.28`, two
diagonal braces `BoxGeometry(0.04, 2.3, 0.04)` rotated `[0, 0, 0.42]`
at `[±0.9, 1.1, -0.29]`, and four footplates
`BoxGeometry(0.16, 0.03, 0.16)` at `[±1.76, 0.015, ±0.26]`.

One mesh against a budget of 3.

- [ ] **Step 3: Rebuild, verify, commit, ship PR 4**

Run: `sh build.sh` then `cd tests && npm test`
Expected: `===== 17/17 suites passed =====`.

### Task 12: Close the round

- [ ] **Step 1: Re-run the census and record the delta**

Run: `cd tests && node ../tools/census.js`
Compare against the baseline recorded in Task 1. Every number must be
at or below it. Write the before/after table into the PR body — that
is the evidence RULING AK was honoured.

- [ ] **Step 2: Update the record**

Append a "Done 2026-08-09" block to `HANDOFF.md` covering the round,
the rulings, and the census delta. Update `STATE.md`'s Position and
Current focus. Add the new headset questions to HANDOFF's next-session
block:

- Do the tools read as real tools at arm's length, or does the detail
  disappear at headset resolution?
- Is the nail gun's muzzle still where your hand expects it now that
  there is a visible nose and contact tip?
- Does the shed read as a working scene shop?
- **The frame-rate reading is still owed** — take it with the new
  geometry standing, and compare against the census delta.

- [ ] **Step 3: Add any new trap to `docs/guide/TRAPS.md`**

If merging broke something during the round (the realistic candidate: a
part that needed to stay separate), write it up. That file only earns
its keep if it grows.

---

## Self-review

**Spec coverage:** RULING AI — Task 3 draws every texture on a canvas,
no loader, no asset files. RULING AJ — enforced at Task 2 Step 6, Task
4 Step 5, Task 5 Step 3, Task 6 Step 2, and every `npm test` step.
RULING AK — `mergeParts()` in Task 2, budget assertions in Tasks 4, 7,
9, 10, census delta in Task 12. RULING AL — survivor tests in Tasks 7
(cutter), 8 (roller head, cans) and 10 (forks). RULING AM — Task 3
builds exactly six shared materials and asserts they stay six, with a
cached stencil helper. RULING AN — no task animates anything; every
rebuild is geometry and materials only.

**Placeholder scan:** no TBD/TODO. Every code step carries the code.
The two places that give parts lists rather than literal function
bodies (Tasks 7 and 10–11) name every geometry, every dimension, every
position and the material each merges into, which is the actionable
content — the surrounding function contract is stated explicitly above
each.

**Type consistency:** `mergeParts(parts)` takes `{geo, pos, rot, scale}`
in Task 2 and is called with exactly those keys in Tasks 4, 5, 7, 8, 9,
10 and 11. `stencilTex(text, bg)` is defined and called with two
arguments. `toolG(key, mk)` is the existing cache and is used with its
existing signature throughout. Record field names in the survivor tests
are quoted from the current source.

**One known gap, deliberately left:** `stencilTex` is defined in Task 3
and asserted, but no task in PRs 1–4 applies a stencil label to an
object. It is built because the palette is the place to build it and
because labelled hazard panels are the obvious next detail pass; if the
implementer wants it used in-round, the forklift's control head (Task
10) is the natural home. Leaving it unused is not a plan failure, but
do not let it grow into dead code — either use it there or drop it.

## Baseline census

*(Task 1 Step 3 pastes the measured `JSON` line here before any
geometry changes.)*
