# Rig & Warehouse feature set — PRs 1–4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the four independent PRs of the approved spec (`docs/superpowers/specs/2026-08-07-rig-warehouse-design.md`): real-looking lantern bodies, FOH bar wires-to-the-roof + reach floor, L+R speaker bars per stage, and two warehouse sheds with pushable carts. PRs 5 (detach system) and 6 (ordering) get their own plan once these are on `main`.

**Architecture:** All game code lives in `src/p*.txt` parts concatenated by `build.sh` into `the-house.html` (three.js r128, no modules). PR 1 rewrites the five fixture-body builders in `p4` with shared cached geometry. PR 2 parameterises the FOH bar's wire anchor per venue and lowers its floor to hand height. PR 3 clones the FOH-bar pattern (p4 model + p6 desktop row + p9 VR buttons + p2k parking) into an L/R pair of speaker arrays. PR 4 adds a new part `p2m` (two sheds + two carts), cuts doors through both venues' solid back walls, extends the room-culling and collision systems, and adds a cart-grab class to the VR squeeze arbitration.

**Tech stack:** three.js r128 (global `T`), jsdom test suites in `tests/` (real three, stubbed `WebGLRenderer`), ASCII ray probes in `tools/`.

---

## Section 0 — Ground rules and mechanics (read first, applies to every task)

**Branches and PRs.** One PR per concern, branched off current `main`, never stacked. Branch names: `fixture-bodies` (PR 1), `foh-bar-reach` (PR 2), `speaker-bars` (PR 3), `warehouses` (PR 4). `gh` is NOT installed — open PRs through the GitHub API (§0.4). **Owner merges; never push to `main`.**

**Ordering note.** PR 2 and PR 3 edit adjacent code (the FOH block in `p4` `buildRig`, the p2k override block, `vrPageFly` in p9). Do PR 2 **first and alone**; branch PR 3 after PR 2 is committed locally (still base the PR on `main` — the diffs don't overlap once PR 2's exact lines are known, but writing PR 3 against a tree that already has PR 2 avoids guessing). PRs 1 and 4 are independent of everything.

**Seam check (mandatory before opening any PRs).** Merge ALL open feature branches into a throwaway branch, `sh build.sh`, run the full suite. This caught two real bugs last session. Never `git add -A` while agent worktrees exist under `.claude/`.

### 0.1 Build

```sh
sh build.sh
```
Expected: no output except a possible success line; exits 0. It concatenates `src/` in the order listed inside it and syntax-checks the result. **If you add a part, edit `build.sh` — order is dependency order, do not sort.**

### 0.2 Test

```sh
cd tests
npm install        # once
npm test           # all suites, non-zero exit on any failure
node stages.js     # or any single suite
```
Every suite must end `--- failures: 0 ---`. Suites eval the LAST `<script>` block of the built `the-house.html` — **always `sh build.sh` before testing.**

### 0.3 Negative-check (required for every new assertion)

After the suite passes on the fixed build:
```sh
git stash              # stash the src/ fix, keep the test
sh build.sh
cd tests && node <suite>.js; cd ..
git stash pop
sh build.sh
```
Expected: the suite FAILS against the unfixed build (that's the proof the test bites), passes again after the pop. If a test cannot fail against the old build, it isn't testing the change.

### 0.4 Commit and PR mechanics (PowerShell 5.1)

Quotes in `git commit -m` get mangled — always write the message to a file:
```powershell
Set-Content -Path ..\commitmsg.txt -Encoding utf8 -Value @'
p4: real fixture bodies

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
git add src/p4.txt the-house.html tests/stages.js
git commit -F ..\commitmsg.txt
```
Open a PR (after push) with the stored credential:
```powershell
$cred = "url=https://github.com`nprotocol=https`nhost=github.com" | git credential fill
$token = ($cred | Select-String 'password=(.*)').Matches[0].Groups[1].Value
Set-Content -Path ..\pr.json -Encoding utf8 -Value '{"title":"...","head":"fixture-bodies","base":"main","body":"...\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)"}'
curl -s -H "Authorization: token $token" -H "Accept: application/vnd.github+json" -d "@..\pr.json" https://api.github.com/repos/Jackscreations21/gms-theater-game/pulls
```

### 0.5 Codebase contracts that every task must honour

- Deck is `y = 0` on every stage; upstage −z, downstage +z, stage right −x.
- `var` (not `const`/`let`) for any p4 global that p6/p9 reach for (`typeof` doesn't protect a later `const`; see `src/p4.txt:255-258`).
- `userData.lens` on every body, `userData.base/yoke/head` on movers — the beam/glow/aim code reads them.
- Never gate light output with `visible` — go through the level path.
- Anything world-space at the Arc needs `-ARC.X` compensation.
- `userData.moves = true` on anything that must not be matrix-frozen by `lockStatic`.
- Tests drive the DOM through `document.querySelectorAll`, never cached row references.

---

# PR 1 — real fixture bodies (`fixture-bodies`)

**Files:**
- Modify: `src/p4.txt:98-145` (the five body builders)
- Test: `tests/stages.js` (new section, before the closing block)
- Rebuild: `the-house.html`

The five builders become recognisable lanterns. Every geometry is created once via a module-level cache and shared across all instances (three stages × ~25 channels). Contract kept: `userData.lens` everywhere; mover keeps `userData.base/yoke/head`; overall body sizes stay within ~0.1m of today's so aims/beams/glows sit right. New contract introduced for tests and PR 5: each hangable body gets `userData.clamp` (the C-clamp mesh) — movers and cycs get it too.

### Task 1.1: Failing tests for the new bodies

- [ ] **Step 1: Write the failing tests.** In `tests/stages.js`, immediately before the closing `console.log(window.__errs.length ? ...)` block, add:

```js
  console.log('--- fixture bodies ---');
  P('every fixture type hangs from a real clamp', ()=>{
    const types = ['profile','fresnel','par','cyc','mover'];
    const missing = types.filter(t=>{
      const f = FIXTURES.find(x=>x.type===t);
      return !f || !f.body.userData.clamp;
    });
    if(missing.length) throw new Error('no clamp on: '+missing.join(', '));
    return types.length+' types clamped';
  });
  P('bodies share geometry across instances', ()=>{
    const profs = FIXTURES.filter(f=>f.type==='profile').slice(0,2);
    if(profs.length < 2) throw new Error('need two profiles to compare');
    const geoms = b=>{ const s=new Set(); b.traverse(o=>{ if(o.isMesh) s.add(o.geometry); }); return s; };
    const a = geoms(profs[0].body), bb = geoms(profs[1].body);
    let shared = 0; a.forEach(g=>{ if(bb.has(g)) shared++; });
    if(shared < 3) throw new Error('only '+shared+' geometries shared — cache not working');
    return shared+' shared geometries';
  });
  P('bodies stay inside the VR triangle budget', ()=>{
    const over = [];
    ['profile','fresnel','par','cyc','mover'].forEach(t=>{
      const f = FIXTURES.find(x=>x.type===t); if(!f) return;
      let tris = 0;
      f.body.traverse(o=>{ if(o.isMesh){ const p=o.geometry;
        tris += p.index ? p.index.count/3 : p.attributes.position.count/3; }});
      if(tris > 700) over.push(t+':'+Math.round(tris));
    });
    if(over.length) throw new Error('over budget: '+over.join(' '));
    return 'all under 700 tris';
  });
  P('the lens contract survives', ()=>{
    const bad = FIXTURES.filter(f=>!f.body.userData.lens);
    if(bad.length) throw new Error(bad.length+' bodies lost userData.lens');
    const m = FIXTURES.find(f=>f.type==='mover');
    if(!m.body.userData.base || !m.body.userData.yoke || !m.body.userData.head)
      throw new Error('mover lost base/yoke/head');
    return 'lens + mover parts intact';
  });
```

- [ ] **Step 2: Run to verify failure.** `sh build.sh && cd tests && node stages.js; cd ..` — Expected: `ERR every fixture type hangs from a real clamp: no clamp on: profile, fresnel, par, cyc, mover` and the shared-geometry test failing. The other new tests may pass (lens exists today) — that's fine, they're regression guards.

### Task 1.2: Implement the bodies

- [ ] **Step 1: Replace `src/p4.txt:98-145`** (from `/* ---- fixture bodies ---- */` through the end of `bodyMover`) with:

```js
/* ---- fixture bodies ------------------------------------------------------
   Real lanterns, not primitives.  Every geometry is built ONCE via fixG and
   shared across all instances — three stages hang ~25 channels each, so
   per-body geometry would be ~400 duplicate buffers.  Contracts the rest of
   p4 reads and must survive any edit here: userData.lens on every body,
   userData.base/yoke/head on movers.  New for the detach system (PR 5):
   userData.clamp is the C-clamp that meets the pipe.  Budget: each body
   stays well under 700 triangles — these are drawn ~75x in a headset.     */
const FIXG = {};
function fixG(k, make){ return FIXG[k] || (FIXG[k] = make()); }
function lensMat(c){ return new T.MeshBasicMaterial({color:c}); }
/* yoke + C-clamp + safety loop, shared by every hanging body.  yTop is the
   local y where the clamp jaw meets the pipe. */
function addHang(g, yokeR){
  const yoke = new T.Mesh(fixG('yoke'+yokeR, ()=>new T.TorusGeometry(yokeR,.022,5,14,Math.PI)), M.steel);
  yoke.rotation.y = Math.PI/2; g.add(yoke);
  const stem = new T.Mesh(fixG('stem', ()=>new T.CylinderGeometry(.02,.02,.14,6)), M.steel);
  stem.position.y = yokeR + .06; g.add(stem);
  const jaw = new T.Mesh(fixG('jaw', ()=>new T.BoxGeometry(.1,.13,.08)), M.steel);
  jaw.position.y = yokeR + .18; g.add(jaw);
  const bolt = new T.Mesh(fixG('bolt', ()=>new T.CylinderGeometry(.013,.013,.14,6)), M.steel);
  bolt.rotation.x = Math.PI/2; bolt.position.set(0, yokeR + .11, .06); g.add(bolt);
  const safety = new T.Mesh(fixG('safety', ()=>new T.TorusGeometry(.085,.008,4,10)), M.steel);
  safety.position.set(.06, yokeR + .1, 0); safety.rotation.x = .6; g.add(safety);
  g.userData.clamp = jaw;
  return g;
}
/* a square gel-frame at the nose: four thin bars, not a plate (a plate
   would occlude the lens) */
function addFrame(g, half, z){
  [[0, half, half*2+.04, .028],[0, -half, half*2+.04, .028]].forEach(s=>{
    const b = new T.Mesh(fixG('frH'+half, ()=>new T.BoxGeometry(half*2+.04, .028, .02)), M.steel);
    b.position.set(s[0], s[1], z); g.add(b);
  });
  [[half,0],[-half,0]].forEach(s=>{
    const b = new T.Mesh(fixG('frV'+half, ()=>new T.BoxGeometry(.028, half*2+.04, .02)), M.steel);
    b.position.set(s[0], s[1], z); g.add(b);
  });
}
function bodyProfile(){ // ellipsoidal — the Source Four silhouette
  const g = new T.Group();
  const barrel = new T.Mesh(fixG('proBarrel', ()=>new T.CylinderGeometry(.105,.15,.56,14)), M.fixture);
  barrel.rotation.x = Math.PI/2; barrel.position.z = .33; g.add(barrel);
  const gate = new T.Mesh(fixG('proGate', ()=>new T.CylinderGeometry(.155,.155,.18,14)), M.fixture);
  gate.rotation.x = Math.PI/2; gate.position.z = .05; g.add(gate);
  const lamp = new T.Mesh(fixG('proLamp', ()=>new T.BoxGeometry(.19,.24,.22)), M.fixture);
  lamp.position.set(0,.01,-.14); g.add(lamp);
  // four shutter handles at the gate
  [[0,.2,0],[0,-.2,0],[.2,0,Math.PI/2],[-.2,0,Math.PI/2]].forEach(s=>{
    const b = new T.Mesh(fixG('proShutter', ()=>new T.BoxGeometry(.1,.045,.012)), M.steel);
    b.position.set(s[0], s[1], .05); b.rotation.z = s[2]; g.add(b);
  });
  addFrame(g, .15, .585);
  const lens = new T.Mesh(fixG('proLens', ()=>new T.CircleGeometry(.115,14)), lensMat(0x111111));
  lens.position.z = .615; g.add(lens);
  addHang(g, .24);
  g.userData.lens = lens; return g;
}
function bodyFresnel(){
  const g = new T.Group();
  const b = new T.Mesh(fixG('freBody', ()=>new T.BoxGeometry(.32,.34,.4)), M.fixture);
  b.position.z = .08; g.add(b);
  // four barn-door leaves, folded half-open
  [[0,.24,-.5,0],[0,-.24,.5,0],[.23,0,0,-.5],[-.23,0,0,.5]].forEach(s=>{
    const leaf = new T.Mesh(fixG('freBarn', ()=>new T.BoxGeometry(.34,.22,.01)), M.fixture);
    leaf.position.set(s[0], s[1], .32);
    leaf.rotation.x = s[2]; leaf.rotation.y = s[3]; g.add(leaf);
  });
  addFrame(g, .17, .285);
  const lens = new T.Mesh(fixG('freLens', ()=>new T.CircleGeometry(.155,14)), lensMat(0x161616));
  lens.position.z = .305; g.add(lens);
  addHang(g, .26);
  g.userData.lens = lens; return g;
}
function bodyPar(){
  const g = new T.Group();
  const can = new T.Mesh(fixG('parCan', ()=>new T.CylinderGeometry(.16,.155,.44,14)), M.fixture);
  can.rotation.x = Math.PI/2; can.position.z = .16; g.add(can);
  const rim = new T.Mesh(fixG('parRim', ()=>new T.CylinderGeometry(.17,.17,.05,14)), M.fixture);
  rim.rotation.x = Math.PI/2; rim.position.z = .38; g.add(rim);
  addFrame(g, .16, .41);
  const lens = new T.Mesh(fixG('parLens', ()=>new T.CircleGeometry(.15,14)), lensMat(0x141414));
  lens.position.z = .406; g.add(lens);
  addHang(g, .23);
  g.userData.lens = lens; return g;
}
function bodyCyc(){
  const g = new T.Group();
  const trough = new T.Mesh(fixG('cycTrough', ()=>new T.BoxGeometry(.55,.3,.4)), M.fixture);
  g.add(trough);
  const hood = new T.Mesh(fixG('cycHood', ()=>new T.BoxGeometry(.55,.05,.46)), M.fixture);
  hood.position.set(0,.19,.05); hood.rotation.x = -.35; g.add(hood);
  const lens = new T.Mesh(fixG('cycLens', ()=>new T.PlaneGeometry(.5,.24)), lensMat(0x141414));
  lens.position.z = .205; g.add(lens);
  addHang(g, .28);
  g.userData.lens = lens; return g;
}
function bodyMover(){
  const g = new T.Group();
  const base = new T.Mesh(fixG('movBase', ()=>new T.BoxGeometry(.44,.24,.44)), M.fixture);
  base.position.y = .16; g.add(g.userData.base = base);
  // carry handles on the base
  [-.26,.26].forEach(x=>{
    const h = new T.Mesh(fixG('movHandle', ()=>new T.TorusGeometry(.07,.014,4,8,Math.PI)), M.steel);
    h.position.set(x,.2,0); h.rotation.z = x<0?Math.PI/2:-Math.PI/2; g.add(h);
  });
  const yoke = new T.Group(); yoke.position.y = -.05; g.add(yoke);
  const arm1 = new T.Mesh(fixG('movArm', ()=>new T.BoxGeometry(.08,.44,.16)), M.fixture);
  arm1.position.set(-.26,-.2,0); yoke.add(arm1);
  const arm2 = arm1.clone(); arm2.position.x = .26; yoke.add(arm2);
  const head = new T.Group(); head.position.y = -.4; yoke.add(head);
  const hb = new T.Mesh(fixG('movHead', ()=>new T.CylinderGeometry(.18,.21,.5,14)), M.fixture);
  hb.rotation.x = Math.PI/2; head.add(hb);
  const hr = new T.Mesh(fixG('movRing', ()=>new T.CylinderGeometry(.215,.215,.06,14)), M.fixture);
  hr.rotation.x = Math.PI/2; hr.position.z = .22; head.add(hr);
  const lens = new T.Mesh(fixG('movLens', ()=>new T.CircleGeometry(.15,16)), lensMat(0x101010));
  lens.position.z = .253; head.add(lens);
  g.userData.clamp = base;   // movers clamp through their base
  g.userData.yoke = yoke; g.userData.head = head; g.userData.lens = lens; return g;
}
```

- [ ] **Step 2: Rebuild and run.** `sh build.sh && cd tests && npm test; cd ..` — Expected: ALL suites `--- failures: 0 ---`. If `stages.js` geometry tests elsewhere break, check you haven't changed the FOH pipe (you shouldn't have — this task touches only bodies).

- [ ] **Step 3: Negative-check** per §0.3 (stash `src/p4.txt`, rebuild, `node stages.js` must FAIL on the clamp + shared-geometry tests, pop, rebuild).

- [ ] **Step 4: Eyeball it.** Run the probe `cd tools && NODE_PATH=../tests/node_modules node audience.js; cd ..` — fixtures appear tiny in wide shots; the real check is tri budget + suites. Optional: open `the-house.html` in a browser and look at the 1st electric.

- [ ] **Step 5: Commit** on branch `fixture-bodies` per §0.4. Message: `p4: real fixture bodies — shared geometry, clamps, frames, barn doors`.

---

# PR 2 — FOH wires to the roof + reach floor (`foh-bar-reach`)

**Files:**
- Modify: `src/p4.txt:300-308` (the `FOHBAR` object literal)
- Modify: `src/p2k.txt:270-276` (the per-house override block in `buildArcStage`)
- Test: `tests/stages.js`

Facts (verified by exploration): the Palace ceiling over the bar (x ±8.4, z 14.65) is the flat plaster at `D.ceilY = 24.6` — the cove ribbons and the dome hole both miss that spot. `wireTop: 15.8` was tuned for the Arc's 15.95 soffit and leaves the Palace wires 8.8m short. `FOHBAR.min` is `houseFloorY(barZ) + 3.2 = 4.015` (Palace) / `4.93` (both Arc houses) — unreachable.

### Task 2.1: Failing tests

- [ ] **Step 1: Write the failing tests.** In `tests/stages.js`, before the closing block:

```js
  console.log('--- FOH bar: wires and reach ---');
  P('palace wires anchor at the real ceiling', ()=>{
    goToView(3); updateStageFromPosition();
    if(FOHBAR.wireTop !== D.ceilY)
      throw new Error('wireTop '+FOHBAR.wireTop+' — the ceiling is '+D.ceilY);
    const want = FOHBAR.wireTop - FOHBAR.y;
    if(Math.abs(FOHBAR.wires[0].scale.y - want) > 0.02)
      throw new Error('wire is '+FOHBAR.wires[0].scale.y.toFixed(2)+'m, needs '+want.toFixed(2));
    return 'anchored at '+FOHBAR.wireTop+'m';
  });
  P('palace bar comes to hand', ()=>{
    goToView(3); updateStageFromPosition();
    const floor = houseFloorY(FOHBAR.z);
    const lanternAtMin = FOHBAR.min - 0.45;
    if(lanternAtMin - floor > 1.7)
      throw new Error('lowest lantern is '+(lanternAtMin-floor).toFixed(2)+'m over the stalls floor');
    return 'lanterns reach '+(lanternAtMin-floor).toFixed(2)+'m';
  });
  P('the arc keeps its own anchor and reach', ()=>{
    goToView(15); updateStageFromPosition();
    if(FOHBAR.wireTop > 15.95)
      throw new Error('arc wireTop '+FOHBAR.wireTop+' is through the 15.95 soffit');
    const H = ARC.houses.main;
    const row = Math.max(0, (H.zPros + FOHBAR.z - H.rake.zFirst)/H.rake.RUN);
    const floor = H.rake.Y0 + row*H.rake.RISE + 0.2;
    if(FOHBAR.min - 0.45 - floor > 1.7)
      throw new Error('arc lanterns stop '+(FOHBAR.min-0.45-floor).toFixed(2)+'m up');
    goToView(3); updateStageFromPosition();
    return 'ok';
  });
```

If `ARC.houses` isn't the map's real name, check `src/p2j.txt:215-220` — the per-house objects carry `rake`, `zPros`; adapt the accessor, keep the assertion.

- [ ] **Step 2: Run to verify failure.** `sh build.sh && cd tests && node stages.js; cd ..` — Expected: FAIL on `wireTop 15.8 — the ceiling is 24.6` and both reach tests.

### Task 2.2: Implement

- [ ] **Step 1: Edit `src/p4.txt:300-308`.** Replace the `FOHBAR = {...}` literal:

```js
    FOHBAR = {
      y:barY, target:barY, max:barY,         // no higher than it was hung
      /* low enough to take the lanterns off by hand — they hang 0.45 under
         the pipe, so this puts them at chest height over the stalls.  The
         Arc's steeper rake overrides this per house in buildArcStage (p2k) */
      min:houseFloorY(barZ) + 2.0,
      /* the wires anchor at the Palace's flat ceiling; the Arc's 15.95m
         soffit overrides this per house in buildArcStage (p2k) */
      z:barZ, wireTop:D.ceilY,
      group:bar, wires:wires
    };
```

- [ ] **Step 2: Edit `src/p2k.txt:270-276`.** The override block inside `buildArcStage` becomes:

```js
  {
    const rk = H.rake;
    const row = Math.max(0, (H.zPros + FOHBAR.z - rk.zFirst)/rk.RUN);
    FOHBAR.min = Math.min(FOHBAR.max - 0.5, rk.Y0 + row*rk.RISE + 0.2 + 2.0);
    /* the Arc's auditorium ceiling is a slab with its soffit at 15.95
       (p2j) — anchor the drop wires just under it, not at the Palace's
       24.6m plaster the buildRig default assumes */
    FOHBAR.wireTop = 15.8;
    fohBarPose(FOHBAR);
  }
```
(The `fohBarPose` call re-scales the wires — `buildRig` already posed them with the Palace anchor.)

- [ ] **Step 3: Rebuild, full suite.** `sh build.sh && cd tests && npm test; cd ..` — Expected: 12/12 `failures: 0`. Watch `vr.js` (FOH desk test drives the bar to `min` — the new lower min must not break its travel assertion; it asserts `FOHBAR.y < y0 - 1.0`, which a LOWER travel satisfies even more).

- [ ] **Step 4: Negative-check** per §0.3 (stash both src edits; all three new tests must fail; pop).

- [ ] **Step 5: Commit** on `foh-bar-reach`. Message: `p4+p2k: FOH wires anchor at each house's real ceiling; bar lowers to hand height`.

---

# PR 3 — speaker bars (`speaker-bars`)

**Files:**
- Modify: `src/p4.txt` (globals near `FOHBAR`, a new block in `buildRig`, motion in `updateRig`)
- Modify: `src/p2k.txt` (`makeStage` slot, capture/restore, `buildArcStage` aside/put-back + per-house override)
- Modify: `src/p6.txt` (`buildSpkBarUI` beside `buildFohBarUI`, sync)
- Modify: `src/p9.txt` (`vrPageFly` buttons)
- Test: `tests/stages.js`, `tests/vr.js`

**Do this after PR 2 is committed locally** (§0 ordering note). L+R flown line arrays per stage: short pipe on two drop wires, three speaker boxes under it, just downstage of the arch at stage-local `x = ±(D.procW/2+1.6) = ±9.1`, `z = 2.8`, home `y = 9.4`. Same motor idiom as the FOH bar; `fohBarPose` is reused as-is (it's shape-generic). Boxes are static meshes in this PR — they become detachable bodies in PR 5.

### Task 3.1: Failing tests

- [ ] **Step 1: `tests/stages.js`**, before the closing block:

```js
  console.log('--- speaker bars ---');
  P('every stage hangs an L+R speaker pair', ()=>{
    goToView(3); updateStageFromPosition();
    if(!SPKBARS || !SPKBARS.L || !SPKBARS.R) throw new Error('no speaker bars at the palace');
    const pal = SPKBARS;
    goToView(15); updateStageFromPosition();
    if(!SPKBARS || SPKBARS === pal) throw new Error('two stages share one speaker pair');
    goToView(3); updateStageFromPosition();
    if(SPKBARS !== pal) throw new Error('the palace pair did not come back');
    return 'per-stage pairs';
  });
  P('a parked pair does not move', ()=>{
    goToView(3); updateStageFromPosition();
    const pal = SPKBARS;
    spkBarStep('L', -1);
    goToView(15); updateStageFromPosition();
    const y0 = pal.L.y;
    for(let i=0;i<60;i++) updateRig(0.05, 1);
    if(pal.L.y !== y0) throw new Error('the parked palace bar moved on its own');
    goToView(3); updateStageFromPosition();
    for(let i=0;i<60;i++) updateRig(0.05, 1);
    if(!(SPKBARS.L.y < SPKBARS.L.max - 0.5)) throw new Error('the live bar never travelled');
    SPKBARS.L.target = SPKBARS.L.max;
    for(let i=0;i<80;i++) updateRig(0.05, 1);
    return 'parked holds, live travels';
  });
  P('speaker boxes come to hand at the bottom of travel', ()=>{
    goToView(3); updateStageFromPosition();
    const b = SPKBARS.L;
    const floor = houseFloorY(b.z);
    // three boxes hang to 1.24m + half a box below the pipe
    const lowestBox = b.min - 1.24 - 0.21;
    if(lowestBox - floor > 1.8) throw new Error('lowest box stops '+(lowestBox-floor).toFixed(2)+'m up');
    if(b.wires[0].scale.y < 1) throw new Error('no drop wires');
    return 'boxes reach '+(lowestBox-floor).toFixed(2)+'m';
  });
  P('the desktop rows drive the bars', ()=>{
    goToView(3); updateStageFromPosition();
    buildFlyUI();
    const rows = Array.prototype.slice.call(document.querySelectorAll('#lsTable tfoot tr.spkbar'));
    if(rows.length !== 2) throw new Error(rows.length+' spkbar rows, wanted 2');
    const btn = Array.prototype.slice.call(rows[0].querySelectorAll('button')).find(b=>b.textContent==='LOWER');
    if(!btn) throw new Error('no LOWER on the L row');
    const y0 = SPKBARS.L.target;
    btn.dispatchEvent(new window.MouseEvent('click', {bubbles:true}));
    if(!(SPKBARS.L.target < y0)) throw new Error('the click moved nothing');
    SPKBARS.L.target = SPKBARS.L.max;
    return 'rows wired';
  });
```

- [ ] **Step 2: `tests/vr.js`**, after the existing FOH bar test (`vr.js:493-515`):

```js
  P('the speaker bars are on the VR fly page', ()=>{
    VR.page = 'fly'; vrDrawConsole(true);
    if(typeof SPKBARS === 'undefined' || !SPKBARS) throw new Error('no speaker bars');
    const lRaise = VR.hits.find(h=>h.w === 116 && h.h === 46 && h.y === 86 + 312);
    const lLower = VR.hits.find(h=>h.w === 116 && h.h === 46 && h.y === 86 + 366);
    const rRaise = VR.hits.find(h=>h.w === 116 && h.h === 46 && h.y === 86 + 448);
    const rLower = VR.hits.find(h=>h.w === 116 && h.h === 46 && h.y === 86 + 502);
    if(!lRaise || !lLower || !rRaise || !rLower) throw new Error('missing RAISE/LOWER pairs');
    const y0 = SPKBARS.R.y;
    rLower.fn();
    for(let i=0;i<120;i++) updateRig(0.05, 1);
    if(!(SPKBARS.R.y < y0 - 1.0)) throw new Error('R LOWER left the bar at '+SPKBARS.R.y.toFixed(2));
    SPKBARS.R.target = SPKBARS.R.max;
    for(let i=0;i<160;i++) updateRig(0.05, 1);
    return 'VR pairs wired';
  });
```
Place it so the existing FOH test's state (VR entered, palace stage) is already established — read the surrounding tests and match their setup exactly.

- [ ] **Step 3: Run to verify failure.** Both suites must FAIL with `SPKBARS is not defined` (or 'no speaker bars').

### Task 3.2: p4 — model, geometry, motion

- [ ] **Step 1: Globals.** In `src/p4.txt`, immediately after the `fohBarStep` function (after line 276), add:

```js
/* ---- the speaker bars ----------------------------------------------------
   L+R flown PA beside the arch, one pair per stage — the FOH bar pattern
   run twice: same pose math (fohBarPose is shape-generic), same park in
   p2k, same two boards.  A var for the same reason FOHBAR is.            */
var SPKBARS = null;
const SPK_BAR_SPEED = 0.4;
const SPK_BAR_STEP  = 1.2;
function spkBarTo(side, y){
  if(!SPKBARS || !SPKBARS[side]) return false;
  const b = SPKBARS[side];
  b.target = clamp(y, b.min, b.max);
  return true;
}
function spkBarStep(side, s){
  if(!SPKBARS || !SPKBARS[side]) return false;
  return spkBarTo(side, SPKBARS[side].target + s*SPK_BAR_STEP);
}
```

- [ ] **Step 2: Geometry.** In `buildRig` (p4), immediately after the FOH bar block closes (after line 318's `}`), add:

```js
  // L+R SPEAKER ARRAYS — three boxes on a short pipe each side of the arch.
  // Stage-local coordinates, parented to the bar so travel carries them.
  {
    const sy = 9.4, sz = 2.8;
    SPKBARS = {};
    [['L',-(D.procW/2+1.6)],['R',D.procW/2+1.6]].forEach(pair=>{
      const side = pair[0], sx = pair[1];
      const bar = new T.Group();
      bar.position.set(sx, sy, sz); rigGroup.add(bar);
      const pipe = new T.Mesh(new T.CylinderGeometry(.05,.05,1.4,8), M.pipe);
      pipe.rotation.z = Math.PI/2; bar.add(pipe);
      const wires = [];
      [-0.6, 0.6].forEach(wx=>{
        const wr = new T.Mesh(new T.CylinderGeometry(.012,.012,1,4), M.steel);
        wr.position.x = wx; bar.add(wr); wires.push(wr);
      });
      for(let i=0;i<3;i++){
        const by = -.32 - i*.46;
        const box = new T.Mesh(new T.BoxGeometry(.56,.42,.5), M.fixture);
        box.position.y = by; bar.add(box);
        const grille = new T.Mesh(new T.PlaneGeometry(.5,.36),
          new T.MeshBasicMaterial({color:0x101010}));
        grille.position.set(0, by, .251); bar.add(grille);
      }
      SPKBARS[side] = {
        y:sy, target:sy, max:sy,
        min:houseFloorY(sz) + 2.9,          // lowest box at chest height
        z:sz, x:sx, wireTop:D.coveY,        // the cove band is overhead here, not the flat ceiling
        group:bar, wires:wires
      };
      fohBarPose(SPKBARS[side]);
    });
  }
```

- [ ] **Step 3: Motion.** In `updateRig` (p4), directly after the `if(FOHBAR && FOHBAR.y !== FOHBAR.target){...}` block (lines 395-398), add:

```js
  if(SPKBARS) for(const k in SPKBARS){
    const b = SPKBARS[k];
    if(b.y !== b.target){
      b.y += clamp(b.target - b.y, -SPK_BAR_SPEED*dt, SPK_BAR_SPEED*dt);
      fohBarPose(b);
    }
  }
```

### Task 3.3: p2k — parking and the Arc override

- [ ] **Step 1: Slot.** In `makeStage` (`src/p2k.txt:33-34`), extend the literal: `smokeRack:null, fohBar:null, spkBars:null, live:false`.

- [ ] **Step 2: Capture.** In `stageCapture`, next to `st.fohBar = FOHBAR;` (line 63): `st.spkBars = SPKBARS;`

- [ ] **Step 3: Restore.** In `stageRestore`, next to `if(st.fohBar) FOHBAR = st.fohBar;` (line 86): `if(st.spkBars) SPKBARS = st.spkBars;`

- [ ] **Step 4: buildArcStage aside/put-back.** Next to `const keepBar = FOHBAR;` (line 264): `const keepSpk = SPKBARS;`. Next to `st.fohBar = FOHBAR;` (line 296): `st.spkBars = SPKBARS;`. Next to `FOHBAR = keepBar;` (line 306): `SPKBARS = keepSpk;`

- [ ] **Step 5: Per-house override.** Inside the existing override block (extended in PR 2), after `fohBarPose(FOHBAR);`:

```js
    /* speaker bars: their floor is the flat front of the rake, and the
       wires anchor under the same 15.95 soffit as the FOH bar's */
    if(SPKBARS) for(const k in SPKBARS){
      const b = SPKBARS[k];
      b.min = rk.Y0 + 0.2 + 2.9;
      b.wireTop = 15.8;
      fohBarPose(b);
    }
```

### Task 3.4: p6 — desktop rows

- [ ] **Step 1:** In `src/p6.txt`, after `buildFohBarUI`/`syncFohBarRow` (after line 589), add:

```js
let spkBarUI = null;
function buildSpkBarUI(){
  const table = $('#lsTable'); if(!table || spkBarUI) return;
  const tf = table.querySelector('tfoot'); if(!tf) return;   // FOH row built it
  spkBarUI = {};
  [['L','SPK BAR L'],['R','SPK BAR R']].forEach(pair=>{
    const side = pair[0];
    const tr = document.createElement('tr'); tr.className = 'spkbar '+side.toLowerCase();
    tr.innerHTML =
      '<td style="color:var(--amber)">S'+side+'</td>'+
      '<td class="mini">'+pair[1]+'</td>'+
      '<td class="goods">3 &times; PA box</td>'+
      '<td><div class="pipbar"><i></i></div></td>'+
      '<td class="mini ht"></td>'+
      '<td class="mini"></td>'+
      '<td><span class="dot"></span></td>'+
      '<td></td>';
    const cell = tr.lastElementChild;
    const mk = (t,fn)=>{
      const b = document.createElement('button'); b.className = 'b';
      b.style.padding = '2px 6px'; b.style.fontSize = '10px'; b.textContent = t;
      b.addEventListener('click', e=>{ e.stopPropagation(); fn(); syncSpkBarRows(); });
      cell.appendChild(b); return b;
    };
    mk('LOWER', ()=>spkBarStep(side,-1));
    mk('RAISE', ()=>spkBarStep(side,1));
    spkBarUI[side] = { bar:tr.querySelector('.pipbar i'), ht:tr.querySelector('.ht'),
                       dot:tr.querySelector('.dot') };
    tf.appendChild(tr);
  });
  syncSpkBarRows();
}
function syncSpkBarRows(){
  if(!spkBarUI || !SPKBARS) return;
  for(const side in spkBarUI){
    const b = SPKBARS[side], ui = spkBarUI[side]; if(!b) continue;
    const pct = clamp((b.y - b.min)/Math.max(0.01, b.max - b.min), 0, 1);
    ui.bar.style.width = (pct*100).toFixed(1)+'%';
    ui.ht.textContent = b.y.toFixed(1)+'m';
    ui.dot.className = 'dot '+(Math.abs(b.target - b.y) > 0.004 ? 'mv' : '');
  }
}
```

- [ ] **Step 2:** Call it: at `src/p6.txt:546`, `buildFohBarUI();` becomes two lines: `buildFohBarUI();` / `buildSpkBarUI();`. At line 606, `syncFlyUI` becomes `function syncFlyUI(){ FLY.forEach(syncFlyRow); syncFohBarRow(); syncSpkBarRows(); }`.

### Task 3.5: p9 — VR fly page

- [ ] **Step 1:** In `vrPageFly` (`src/p9.txt`), after the `if(FOHBAR){...}` block closes (after line 536), add:

```js
  if(typeof SPKBARS !== 'undefined' && SPKBARS){
    const bx = P.x + P.w - 120;
    g.fillStyle = '#8f9aa7';
    g.font = '600 15px Helvetica, Arial, sans-serif';
    g.textBaseline = 'middle';
    g.fillText('SPK L  ' + SPKBARS.L.y.toFixed(1) + 'm', bx, P.y + 300);
    vrBtnBox(g, bx, P.y + 312, 116, 46, 'RAISE',
             ()=>{ spkBarStep('L',1); vrDrawConsole(true); });
    vrBtnBox(g, bx, P.y + 366, 116, 46, 'LOWER',
             ()=>{ spkBarStep('L',-1); vrDrawConsole(true); });
    g.fillStyle = '#8f9aa7';
    g.font = '600 15px Helvetica, Arial, sans-serif';
    g.fillText('SPK R  ' + SPKBARS.R.y.toFixed(1) + 'm', bx, P.y + 436);
    vrBtnBox(g, bx, P.y + 448, 116, 46, 'RAISE',
             ()=>{ spkBarStep('R',1); vrDrawConsole(true); });
    vrBtnBox(g, bx, P.y + 502, 116, 46, 'LOWER',
             ()=>{ spkBarStep('R',-1); vrDrawConsole(true); });
  }
```
**Do NOT shift the FOH block's y offsets** — `tests/vr.js:497-498` pins them by literal pixel.

### Task 3.6: Verify and commit

- [ ] **Step 1:** `sh build.sh && cd tests && npm test; cd ..` — 12/12 green including the new assertions.
- [ ] **Step 2:** Negative-check per §0.3 (stash all four src files; new tests fail; pop).
- [ ] **Step 3:** Commit on `speaker-bars`. Message: `p4+p2k+p6+p9: L+R speaker arrays per stage, raise/lower from both boards`.

---

# PR 4 — warehouses and carts (`warehouses`)

**Files:**
- Create: `src/p2m.txt` (both sheds, both carts)
- Modify: `build.sh` (insert `p2m` between `p2k` and `p2i`)
- Modify: `src/p2b.txt:149-154` (cut the Palace back-wall doorway)
- Modify: `src/p2i.txt` (`ROOMS`/`ROOM_ORDER`/`ROOM_SEES`/`portalShut`)
- Modify: `src/p2j.txt` (Arc: `order` list, house back-wall doorways, `arcRoomAt`, `ARC_SEES`, `arcBounds`, `arcZone`, `buildArc` tail)
- Modify: `src/p7.txt` (movement clamp, `backWallBlocks` gap, `shedWallBlocks`, `useStation` shed case)
- Modify: `src/p9.txt` (cart grab class in `vrSqueeze`/`vrUpdateHold`)
- Create: `tests/warehouse.js` (13th suite) + `tests/run-all.js` + `tools/warehouse.js`
- Modify: `tests/rooms.js` (room-count and zOf updates), `HANDOFF.md` §2 (suite list)

**Placement (all verified against the exploration reports):**
- Palace shed: behind the stage house — interior `x −12…+12, z −30.2…−18.4`, floor `y = 0`, roof 6.2. Doorway cut in the brick back wall at `x = 0` (clear width 3.2, head 3.6), roller leaf on the shed side. New room `'shed'` as a z-slab `z < D.backWall − 0.7` (works with `roomAt(z)` unchanged).
- Arc shed: behind both houses — Arc-local `x −34…+34, z −60…−47.0`, floor `y = 0`, roof 6.4. One doorway per house at `x = cx` (main −26, studio +26) through each stage-house back wall (`z ≈ −47.3` plane), `arcDoor kind:'roll'` each, so they appear in each house's door UI and the crew system automatically. New Arc room `'shed'`.
- One cart per shed, parked inside. Cart is VR-push-only via a new grab class.

### Task 4.1: Failing tests — the suite skeleton

- [ ] **Step 1: Create `tests/warehouse.js`.** Copy the harness boilerplate VERBATIM from `tests/stages.js:1-40` (jsdom setup, canvas stub, `THREE.WebGLRenderer` stub, `requestAnimationFrame` slot — see the §4g pattern the explorer quoted). Then the probe body:

```js
const probe = `
;(function(){
  for(let i=0;i<90;i++){ const cb=window.__raf; window.__raf=null; if(cb){ cb(Date.now()+i*16); } }
  window.__errs = [];
  const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,210):'')); }
    catch(e){ console.log('  ERR '+name+': '+e.message); if(e.stack) console.log('      '+e.stack.split('\\n').slice(1,4).join(' | ')); window.__errs.push(name+': '+e.message); } };

  console.log('--- the palace warehouse ---');
  P('the shed exists and is a room', ()=>{
    if(typeof SHEDS === 'undefined' || !SHEDS.palace) throw new Error('no palace shed');
    if(!ROOMS.shed) throw new Error('no shed room slab');
    if(roomAt(-25) !== 'shed') throw new Error('z=-25 files as '+roomAt(-25));
    if(roomAt(-10) !== 'stage') throw new Error('the stage slab moved');
    return 'room at z<'+ROOMS.shed.z1;
  });
  P('the shed culls behind its shut door', ()=>{
    goToView(3); updateStageFromPosition();
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
  P('the shed floor is walkable', ()=>{
    SHEDS.palace.door.open = 1; SHEDS.palace.door.target = 1;
    Player.pos.set(0, 0, -16); Player.mode = 'walk';
    const before = Player.pos.z;
    for(let i=0;i<400;i++){ Keys['KeyS'] = true; updatePlayer(0.03); }
    Keys['KeyS'] = false;
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
    goToView(15); updateStageFromPosition();
    const before = STAGE;
    Player.pos.set(420-10, 0, -52); updateStageFromPosition();
    if(STAGE !== before) throw new Error('board swapped to '+STAGE+' in the shed');
    Player.pos.set(420+10, 0, -52); updateStageFromPosition();
    if(STAGE !== before) throw new Error('crossing the shed centre-line swapped the board');
    goToView(3); updateStageFromPosition();
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
```
Adjust the movement-test key name (`Keys['KeyS']`) to whatever `full14.js` uses to walk backward/downstage — read its walking tests and copy the exact input mechanism (it may drive `keydown` events instead of a Keys map). The intent: walk the player from the stage through the open doorway into the shed.

- [ ] **Step 2: Register the suite.** In `tests/run-all.js`, the suites array gains `'warehouse'` after `'vr'`. Update the "twelve suites" language in `run-all.js:1` and `HANDOFF.md` (§2 list + counts at lines 22, 80, 95) to thirteen, adding `node warehouse.js   # the sheds and the carts` to the HANDOFF list.

- [ ] **Step 3: Run to verify failure.** `sh build.sh && cd tests && node warehouse.js; cd ..` — Expected: FAIL immediately (`SHEDS is not defined`), exit 1.

### Task 4.2: `src/p2m.txt` — the Palace shed

- [ ] **Step 1: Create `src/p2m.txt`:**

```js
/* ============================================================================
   p2m — THE WAREHOUSES.  One shed behind each venue: racking for the rig's
   loose lanterns (the detach system arrives in a later PR — this part builds
   the buildings, the racks and the carts), a pushable cart each, and a
   roller door into the venue's backstage.

   The Palace shed is plain world geometry behind the stage house — it can
   build at parse time like the rest of the Palace, and p2i (which runs
   later) files it into its own room.  The Arc shed needs ARC.group, which
   only exists once buildArc has run at init, so buildArcShed() is called
   from the tail of buildArc (p2j) — function declarations hoist across the
   concatenated file.
   ========================================================================== */
var SHEDS = {palace:null, arc:null};
var CARTS = {palace:null, arc:null};

/* one rack bay: two shelves of slot markers against a wall.  Slots are
   empty Object3D anchors the detach system will snap bodies into. */
function shedRack(parent, cx, cy, cz, yaw, slots){
  const g = new T.Group(); g.position.set(cx, cy, cz); g.rotation.y = yaw;
  parent.add(g);
  const frame = new T.Mesh(new T.BoxGeometry(3.6, 2.2, 0.1), M.steel);
  frame.position.set(0, 1.1, -0.3); g.add(frame);
  [0.55, 1.45].forEach(sy=>{
    const shelf = new T.Mesh(new T.BoxGeometry(3.6, 0.06, 0.62), M.steel);
    shelf.position.set(0, sy, 0); g.add(shelf);
    for(let i=0;i<4;i++){
      const a = new T.Object3D();
      a.position.set(-1.35 + i*0.9, sy + 0.06, 0);
      g.add(a); slots.push(a);
    }
  });
  return g;
}

function buildCart(venue, parent, x, z){
  const g = new T.Group();
  g.userData.moves = true;
  g.userData.cartInfo = true;
  const frame = new T.Mesh(new T.BoxGeometry(0.74, 0.06, 1.24), M.steel);
  frame.position.y = 0.26; g.add(frame);
  const top = new T.Mesh(new T.BoxGeometry(0.74, 0.06, 1.24), M.steel);
  top.position.y = 0.86; g.add(top);
  [[-0.35,-0.6],[0.35,-0.6],[-0.35,0.6],[0.35,0.6]].forEach(c=>{
    const leg = new T.Mesh(new T.CylinderGeometry(0.02,0.02,0.86,6), M.steel);
    leg.position.set(c[0], 0.55, c[1]); g.add(leg);
    const wheel = new T.Mesh(new T.CylinderGeometry(0.08,0.08,0.05,10), M.fixture);
    wheel.rotation.z = Math.PI/2; wheel.position.set(c[0], 0.08, c[1]); g.add(wheel);
  });
  // the handle: a horizontal bar at the -z end, the thing a hand grabs
  const hz = -0.72;
  const handle = new T.Mesh(new T.CylinderGeometry(0.022,0.022,0.7,8), M.pipe);
  handle.rotation.z = Math.PI/2; handle.position.set(0, 1.02, hz); g.add(handle);
  [[-0.33],[0.33]].forEach(hx=>{
    const up = new T.Mesh(new T.CylinderGeometry(0.018,0.018,0.34,6), M.steel);
    up.position.set(hx[0], 0.95, hz); g.add(up);
  });
  const cart = {
    venue, group:g, x, z, yaw:0, yBase:0,
    handleH:1.02, handleZ:hz, handleHalf:0.33, grabR:0.30,
    slots:[]
  };
  [0.32, 0.92].forEach(sy=>{
    for(let i=0;i<3;i++){
      const a = new T.Object3D();
      a.position.set(0, sy, -0.42 + i*0.42);
      g.add(a); cart.slots.push(a);
    }
  });
  parent.add(g);
  cartPose(cart);
  if(typeof INTERACT !== 'undefined') INTERACT.push(g);
  CARTS[venue] = cart;
  return cart;
}
function cartPose(c){
  const ox = (c.venue === 'arc' && typeof ARC !== 'undefined') ? ARC.X : 0;
  c.group.position.set(c.x - ox, c.yBase, c.z);
  c.group.rotation.y = c.yaw;
}

/* ---- the Palace shed: interior x -12..12, z -30.2..-18.4, ridge 6.2 ---- */
(function(){
  const S = {x0:-12, x1:12, z0:-30.2, z1:-18.4, h:6.2};
  const g = new T.Group(); world.add(g);
  const cx = (S.x0+S.x1)/2, cz = (S.z0+S.z1)/2, W = S.x1-S.x0, DPT = S.z1-S.z0;
  const floor = new T.Mesh(new T.BoxGeometry(W+1.2, 0.4, DPT+0.6), M.conc || M.steel);
  floor.position.set(cx, -0.2, cz); g.add(floor); WALKABLE.push(floor);
  const wL = new T.Mesh(new T.BoxGeometry(0.4, S.h, DPT+0.6), M.brick);
  wL.position.set(S.x0-0.2, S.h/2, cz); g.add(wL);
  const wR = wL.clone(); wR.position.x = S.x1+0.2; g.add(wR);
  const wB = new T.Mesh(new T.BoxGeometry(W+1.2, S.h, 0.4), M.brick);
  wB.position.set(cx, S.h/2, S.z0-0.2); g.add(wB);
  const roof = new T.Mesh(new T.BoxGeometry(W+1.6, 0.3, DPT+1.0), M.steel);
  roof.position.set(cx, S.h+0.15, cz); g.add(roof);
  /* the front wall is the theatre's own brick back wall (p2b cuts the
     doorway); we add only the roller leaf, on the shed side of it */
  const leaf = new T.Mesh(new T.BoxGeometry(3.1, 3.5, 0.12), M.steel);
  const leafG = new T.Group(); leafG.position.set(0, 0, D.backWall - 0.75);
  leafG.userData.moves = true;
  leaf.position.y = 1.75; leafG.add(leaf); g.add(leafG);
  const head = new T.Mesh(new T.BoxGeometry(3.6, 0.3, 0.3), M.steel);
  head.position.set(0, 3.8, D.backWall - 0.75); g.add(head);
  SHEDS.palace = {
    x0:S.x0, x1:S.x1, z0:S.z0, z1:S.z1, group:g, slots:[],
    door:{group:leafG, open:0, target:0, travel:3.2, H:3.4, halfW:1.6, x:0, y0:0}
  };
  shedRack(g, S.x0+2.2, 0, S.z0+0.9, 0, SHEDS.palace.slots);
  shedRack(g, S.x0+6.2, 0, S.z0+0.9, 0, SHEDS.palace.slots);
  shedRack(g, S.x1-2.2, 0, S.z0+0.9, 0, SHEDS.palace.slots);
  shedRack(g, S.x1-6.2, 0, S.z0+0.9, 0, SHEDS.palace.slots);
  buildCart('palace', g, 8.5, -27.5);
  if(typeof roomForce === 'function') roomForce(g, 'shed');
  /* the door station, on the stage side of the wall */
  const ctl = new T.Mesh(new T.BoxGeometry(0.4, 0.55, 0.2), M.fixture);
  ctl.position.set(2.2, 1.5, D.backWall + 0.4); world.add(ctl);
  station(ctl, 'shedP', 'WAREHOUSE DOOR  —  [E] open or shut it');
  if(typeof roomForce === 'function') roomForce(ctl, 'stage');
})();

function shedDoorToggle(which){
  const S = SHEDS[which]; if(!S) return false;
  S.door.target = S.door.target > 0.5 ? 0 : 1;
  if(typeof toast === 'function')
    toast('warehouse door '+(S.door.target ? 'opening' : 'closing'));
  return true;
}
function updateSheds(dt){
  const d = SHEDS.palace && SHEDS.palace.door;
  if(d && Math.abs(d.target - d.open) > 0.001){
    d.open += clamp(d.target - d.open, -dt*0.55, dt*0.55);
    d.group.position.y = d.y0 + d.open * d.travel;
  }
}

/* ---- the Arc shed: local x -34..34, z -60..-47, both houses ------------- */
function buildArcShed(){
  if(SHEDS.arc || typeof ARC === 'undefined' || !ARC.rooms || !ARC.rooms.shed) return;
  const R = ARC.rooms.shed;
  const S = {x0:-34, x1:34, z0:-60, z1:-47.0, h:6.4};
  const cx = (S.x0+S.x1)/2, cz = (S.z0+S.z1)/2, W = S.x1-S.x0, DPT = S.z1-S.z0;
  const conc = MAT && MAT.conc ? MAT.conc : M.steel;
  const mk = (w,h,d,x,y,z)=>{ const m = new T.Mesh(new T.BoxGeometry(w,h,d), conc);
    m.position.set(x,y,z); R.add(m); return m; };
  const floor = mk(W+1.2, 0.4, DPT+0.8, cx, -0.2, cz);
  if(typeof arcWalk === 'function') arcWalk(floor); else WALKABLE.push(floor);
  mk(0.4, S.h, DPT+0.8, S.x0-0.2, S.h/2, cz);        // west wall
  mk(0.4, S.h, DPT+0.8, S.x1+0.2, S.h/2, cz);        // east wall
  mk(W+1.2, S.h, 0.4, cx, S.h/2, S.z0-0.2);          // rear wall
  mk(W+1.6, 0.3, DPT+1.2, cx, S.h+0.15, cz);         // roof
  SHEDS.arc = {x0:S.x0, x1:S.x1, z0:S.z0, z1:S.z1, group:R, slots:[]};
  shedRack(R, S.x0+3, 0, S.z0+0.9, 0, SHEDS.arc.slots);
  shedRack(R, S.x0+7.5, 0, S.z0+0.9, 0, SHEDS.arc.slots);
  shedRack(R, S.x1-3, 0, S.z0+0.9, 0, SHEDS.arc.slots);
  shedRack(R, S.x1-7.5, 0, S.z0+0.9, 0, SHEDS.arc.slots);
  buildCart('arc', R, 420 + 0, -55);
  ARC.shed = SHEDS.arc;
}
```
Notes: `M.conc`/`MAT.conc` — check what material names actually exist in `p2.txt` (`M`) and `p2j.txt` (`MAT`); use the venue's own concrete/brick materials, falling back as shown. `clamp`, `world`, `WALKABLE`, `INTERACT` all exist by p2m's position in the build order.

- [ ] **Step 2: Add `p2m` to `build.sh`** between `p2k` and `p2i` in the parts list.

- [ ] **Step 3: Drive the door.** In `src/p7.txt`, in the frame loop where `updateArcDoors`-family updates run (near line 1427, next to the dock-door update), add: `if(typeof updateSheds === 'function') updateSheds(dt);`. In `useStation` (p7:1394-1400), add a case: `else if(id === 'shedP'){ shedDoorToggle('palace'); }`.

### Task 4.3: Palace integration — wall, clamp, rooms

- [ ] **Step 1: Cut the doorway in the brick back wall.** In `src/p2b.txt:149-154`, replace the single `bw` box (57.4 × 34 at `(−5.5, 17, −17.35)`) with three (same material, same shadow flags as the original lines):

```js
  /* the back wall — with a doorway now: the warehouse (p2m) stands behind
     it.  Clear opening 3.2 wide, 3.6 high, centred on x = 0. */
  const bwL = new T.Mesh(new T.BoxGeometry(32.6, 34, 0.7), M.brick);
  bwL.position.set(-17.9, 17, D.backWall - 0.35); world.add(bwL);
  const bwR = new T.Mesh(new T.BoxGeometry(21.6, 34, 0.7), M.brick);
  bwR.position.set(12.4, 17, D.backWall - 0.35); world.add(bwR);
  const bwH = new T.Mesh(new T.BoxGeometry(3.2, 30.4, 0.7), M.brick);
  bwH.position.set(0, 18.8, D.backWall - 0.35); world.add(bwH);
```
Preserve whatever `castShadow`/`receiveShadow`/parent the original `bw` had — read the surrounding lines first and match exactly (if the original was added to a group other than `world`, use that group).

- [ ] **Step 2: Relax the movement clamp.** `src/p7.txt:355`:
```js
    if(nz < D.backWall + 0.6 || nz > FOH.z1 - 0.9) return;
```
becomes
```js
    const zFloor = (typeof SHEDS !== 'undefined' && SHEDS.palace) ? SHEDS.palace.z0 + 0.5 : D.backWall + 0.6;
    if(nz < zFloor || nz > FOH.z1 - 0.9) return;
```

- [ ] **Step 3: The wall predicate learns the gap.** `src/p7.txt:108-112` (`backWallBlocks`) becomes:

```js
function backWallBlocks(x, z, oz){
  const plane = D.backWall - 0.3;
  if((oz < plane) === (z < plane)) return false;
  const sd = (typeof SHEDS !== 'undefined' && SHEDS.palace) ? SHEDS.palace.door : null;
  if(sd && Math.abs(x - sd.x) < sd.halfW - 0.2) return sd.open < 0.72;
  return true;
}
```
Match the original's exact signature and plane constant first — the explorer reports the plane as `z = -17.3` (`D.backWall - 0.3`); keep whatever the original uses.

- [ ] **Step 4: Shed side/rear walls block.** In `src/p7.txt`, next to `backWallBlocks`, add:

```js
function shedWallBlocks(nx, nz){
  if(typeof SHEDS === 'undefined' || !SHEDS.palace) return false;
  if(nz > D.backWall) return false;                 // not in the shed slab
  const S = SHEDS.palace;
  if(nx < S.x0 + 0.4 || nx > S.x1 - 0.4) return true;
  if(nz < S.z0 + 0.4) return true;
  return false;
}
```
and call it in `tryMove`'s Palace branch after `backWallBlocks`: `if(shedWallBlocks(nx, nz)) return;`

- [ ] **Step 5: Rooms.** `src/p2i.txt:17-32` becomes:

```js
const ROOM_ORDER = ['shed','stage','house','lobby'];
const ROOMS = {
  shed:  {label:'the warehouse',      z0:-Infinity,          z1:D.backWall - 0.7},
  stage: {label:'the stage',          z0:D.backWall - 0.7,   z1:1.3},
  house: {label:'the auditorium',     z0:1.3,                z1:D.houseBack + 0.5},
  lobby: {label:'the front of house', z0:D.houseBack + 0.5,  z1:Infinity}
};
const ROOM_SEES = {
  shed:['shed','stage'],
  stage:['stage','house','shed'],
  house:['house','stage','lobby'],
  lobby:['lobby','house']
};
```
And in `portalShut` (p2i:179-190), before the final `return false;`:

```js
  if((a==='stage'&&b==='shed')||(a==='shed'&&b==='stage')){
    const sd = (typeof SHEDS !== 'undefined' && SHEDS.palace) ? SHEDS.palace.door : null;
    return !!(sd && sd.open < 0.01 && sd.target < 0.01);
  }
```

- [ ] **Step 6: Fix `tests/rooms.js`.** Update the room-count assertion (`rooms.js:64` — `world.children.length !== ROOM_ORDER.length + 1` may now be off by the shed control box; run and read the actual number) and add `shed:-25` to the `zOf` map (`rooms.js:109`). Also check `tests/full14.js:420-422` (room assertions the explorer flagged) and update counts there the same way.

### Task 4.4: Arc integration — room, doors, bounds

- [ ] **Step 1: The room.** `src/p2j.txt:22`: append `'shed'` to the order array → `['lobby','main','studio','shed']` (the room group is auto-created by the `buildArc` loop).

- [ ] **Step 2: `arcRoomAt`** (`src/p2j.txt:834-838`) gains one line BEFORE the sign test:

```js
function arcRoomAt(x, z){
  const lx = x - ARC.X;
  if(z > 7.6) return 'lobby';
  if(z < -47.0) return 'shed';
  return lx < 0 ? 'main' : 'studio';
}
```
(`stageAt` in p2k already returns `null` for any room that isn't main/studio — the board keeps. No p2k change needed; the test in Task 4.1 proves it.)

- [ ] **Step 3: `ARC_SEES`** (`src/p2j.txt:843-847`): `shed:['shed','main','studio']`, and append `'shed'` to `main`'s and `studio`'s lists.

- [ ] **Step 4: Rear doorways.** In the per-house builder where the back wall is built (`src/p2j.txt:247`: `aBox(AS.W + 1.2, SH, 0.6, conc, cx, SH/2, H.zBack - 0.3, R)`), replace with three pieces (hole 3.2 wide × 3.6 high at `x = cx`):

```js
  aBox(19.7, SH, 0.6, conc, cx - 12.85, SH/2, H.zBack - 0.3, R);
  aBox(19.7, SH, 0.6, conc, cx + 12.85, SH/2, H.zBack - 0.3, R);
  aBox(3.2, SH - 3.6, 0.6, conc, cx, 3.6 + (SH - 3.6)/2, H.zBack - 0.3, R);
```
(Wall spans `cx ± 22.6`; two side pieces of 19.7 centred at `cx ± 12.85` leave exactly `cx ± 1.6` clear. Verify `aBox`'s exact parameter order against a neighbouring call before writing.)

Then, right after, the roller leaf + registration (mirroring the dock shutter at p2j:333-350):

```js
  {
    const sg = new T.Group();
    sg.position.set(cx, AS.DECK, H.zBack - 0.3);
    sg.userData.moves = true;
    R.add(sg);
    const leaf = new T.Mesh(new T.BoxGeometry(3.1, 3.5, 0.14), MAT.shutterM);
    leaf.position.y = 1.75; sg.add(leaf);
    aBox(3.8, 0.3, 0.5, steel, cx, 3.8, H.zBack - 0.3, R);
    const d = arcDoor({
      key:o.key + 'Rear', label:H.label + ' warehouse door', kind:'roll',
      house:o.key, group:sg,
      axis:'z', plane:H.zBack - 0.3, at:cx, halfW:1.6, H:3.4,
      travel:3.2
    });
    d.y0 = sg.position.y;
  }
```
(`MAT.shutterM`, `steel`, `aBox`, `o.key`, `H.label` — all exist in this scope; match the dock-shutter block's idiom exactly.)

- [ ] **Step 5: The wall knows its gap.** Next to the existing `ARC.walls.push` for the dock (p2j:405-407), add:

```js
  ARC.walls.push({axis:'z', plane:H.zBack - 0.3, lo:H.x0, hi:H.x1, gaps:[
    {at:cx, halfW:1.6, door:o.key + 'Rear'}
  ]});
```

- [ ] **Step 6: `arcBounds` learns the shed.** In `src/p2j.txt:896-910`, add a clause near the top (after `lx` is computed — read the function first and place it so it runs before any `return false` that covers `z < -46.5`):

```js
  if(ARC.shed){
    const S = ARC.shed;
    if(lx > S.x0 + 0.4 && lx < S.x1 - 0.4 && z > S.z0 + 0.4 && z < -46.0) return true;
  }
```

- [ ] **Step 7: `arcZone` must not crash.** In `src/p2j.txt:928-937`, guard the house dereference: at the top, `if(arcRoomAt(x, z) === 'shed') return 'the warehouse';` (match the function's real signature/return style — read it first; the requirement is: standing in the shed produces a label, not a TypeError).

- [ ] **Step 8: Build it.** At the tail of `buildArc` (after the room groups exist and the houses are built, before `ARC.built = true` if that flag is set there), add: `if(typeof buildArcShed === 'function') buildArcShed();`

- [ ] **Step 9: Run the suite.** `sh build.sh && cd tests && node warehouse.js; cd ..` — the palace + arc + cart-existence tests should now pass. `node rooms.js`, `node arc.js`, `node full14.js`, then `npm test` — fix any count assertions the new room broke (the explorer flagged `arc.js:108,379,461` as sensitive; read each failure and update the expected values with a comment).

### Task 4.5: The cart rolls — VR grab class

**Files:** `src/p9.txt` (`vrSqueeze`, `vrUpdateHold`), `src/p7.txt` (`describe` branch), `src/p2m.txt` (movement helper), `tests/vr.js`.

- [ ] **Step 1: Failing test.** In `tests/vr.js`, after the speaker-bar test (Task 3.1 — if PR 3 isn't merged yet in this worktree, place it after the FOH test and don't reference SPKBARS):

```js
  P('a squeeze on the handle pushes the cart, walls stop it', ()=>{
    if(typeof CARTS === 'undefined' || !CARTS.palace) throw new Error('no cart');
    const cart = CARTS.palace;
    cart.x = 8.5; cart.z = -27.5; cart.yaw = 0; cartPose(cart);
    // stand the left controller on the handle
    const c = VR.controllers[0];
    c.position.set(cart.x, cart.handleH, cart.z + cart.handleZ);
    c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'cart') throw new Error('the handle did not take');
    // drag the hand 2m toward the shed door and pump the hold
    const z0 = cart.z;
    for(let i=0;i<40;i++){
      c.position.z += 0.05; c.updateMatrixWorld(true);
      vrUpdateHold(0.05);
    }
    if(!(cart.z > z0 + 1.2)) throw new Error('cart stayed at z='+cart.z.toFixed(2));
    // now push it at the shed's west wall: it must stop
    vrSqueeze(0, false);
    cart.x = SHEDS.palace.x0 + 1.0; cart.z = -25; cart.yaw = 0; cartPose(cart);
    c.position.set(cart.x, cart.handleH, cart.z + cart.handleZ);
    c.updateMatrixWorld(true);
    vrSqueeze(0, true);
    for(let i=0;i<40;i++){
      c.position.x -= 0.05; c.updateMatrixWorld(true);
      vrUpdateHold(0.05);
    }
    vrSqueeze(0, false);
    if(cart.x < SHEDS.palace.x0 + 0.3) throw new Error('cart went through the wall to x='+cart.x.toFixed(2));
    cart.x = 8.5; cart.z = -27.5; cartPose(cart);
    return 'pushes and stops';
  });
```
Match the suite's actual way of posing controllers — if other grab tests set position on `VR.controllers[n]` differently (e.g. via matrix), copy that mechanism.

- [ ] **Step 2: Movement helper in `src/p2m.txt`** (append):

```js
/* can the cart occupy nx,nz?  Reuses the same analytic wall predicates the
   player walks against — branch on the CART's venue, not the player's. */
function cartBlocked(cart, nx, nz){
  const ox = cart.x, oz = cart.z;
  if(cart.venue === 'arc'){
    if(typeof arcBounds === 'function' && !arcBounds(nx, nz)) return true;
    if(typeof arcWallBlocks === 'function' && arcWallBlocks(nx, nz, ox, oz, 0.9)) return true;
  } else {
    const S = SHEDS.palace;
    if(nz < S.z0 + 0.5 || nz > FOH.z1 - 0.9) return true;
    if(nx < DOCK.x0 - 16 || nx > XL + 0.6) return true;
    if(typeof throughWall === 'function' && Player.pos.y < 5 && throughWall(nx, nz, oz)) return true;
    if(typeof doorBlocks === 'function' && doorBlocks(nx, nz, oz, 0.9)) return true;
    if(typeof backWallBlocks === 'function' && backWallBlocks(nx, nz, oz)) return true;
    if(typeof shedWallBlocks === 'function' && shedWallBlocks(nx, nz)) return true;
    if(typeof dockWallBlocks === 'function' && dockWallBlocks(nx, nz, ox)) return true;
    if(typeof dockDoorBlocks === 'function' && dockDoorBlocks(nx, nz, ox, 0.9)) return true;
  }
  const g = (typeof groundAt === 'function') ? groundAt(nx, nz, cart.yBase + 0.6) : 0;
  if(g === null) return true;
  if(Math.abs(g - cart.yBase) > 0.3) return true;
  return false;
}
function cartMoveTo(cart, wx, wz){
  // axis-separated, like the player, so the cart slides along walls
  if(!cartBlocked(cart, wx, cart.z)) cart.x = wx;
  if(!cartBlocked(cart, cart.x, wz)) cart.z = wz;
  const g = (typeof groundAt === 'function') ? groundAt(cart.x, cart.z, cart.yBase + 0.6) : 0;
  if(g !== null && Math.abs(g - cart.yBase) <= 0.3) cart.yBase = g;
  cartPose(cart);
}
```
Note `cartBlocked`'s Palace branch references `Player.pos.y` only for `throughWall`'s guard, mirroring `tryMove`; if that reads wrong in review, drop the `throughWall` line — the proscenium plane is above deck height anyway and `doorBlocks`/walls cover the rest.

- [ ] **Step 3: The grab.** In `src/p9.txt` `vrSqueeze`, extend the candidate scan (after the rope/lever loop at 1174-1190, before the tie-break at 1193):

```js
  /* the warehouse carts: nearest point on the handle bar (horizontal,
     cart-local x) against the hand */
  let cart = null, cd = 0.30, cgx = 0;
  if(typeof CARTS !== 'undefined'){
    for(const k in CARTS){
      const ct = CARTS[k]; if(!ct) continue;
      ct.group.updateMatrixWorld(true);
      _run.set(0, ct.handleH, ct.handleZ).applyMatrix4(ct.group.matrixWorld);
      // clamp the hand to the bar's extent along the cart's local x
      _rayD.set(1, 0, 0).transformDirection(ct.group.matrixWorld);
      const along = clamp(_rayD.dot(_vecA.subVectors(_rayO, _run)), -ct.handleHalf, ct.handleHalf);
      _run.addScaledVector(_rayD, along);
      const d = _run.distanceTo(_rayO);
      if(d < cd){ cd = d; cart = ct; cgx = along; }
    }
  }
```
`_vecA` — if p9 has no spare temp Vector3, declare one next to `_run`'s declaration (`const _vecA = new T.Vector3();`). Then extend the tie-break so the nearest of lever/rope/cart wins:

```js
  if(cart && (!best || cd < bd) && (!lv || cd < lvd)){
    VR.held = {hand, kind:'cart', cart,
      offX:cart.x - _rayO.x, offZ:cart.z - _rayO.z};
    return;
  }
```
(Insert BEFORE the existing lever tie-break; the lever check `if(lv && (!best || lvd < bd))` then keeps its current form — a cart that lost to either is already gone.)

And the release path (p9:1155-1163): the existing code does `h.rope.mesh...` — guard it:

```js
    if(VR.held && VR.held.hand === hand){
      const h = VR.held;
      VR.held = null;
      if(h.rope){
        h.rope.mesh.position.copy(h.rope.home);
        if(!h.rope.traveler) vrLetGo(h);
      }
    }
```

- [ ] **Step 4: The hold.** In `vrUpdateHold` (p9:1231+), right after the hand pose is read and before the traveler branch:

```js
  if(VR.held.kind === 'cart'){
    const ct = VR.held.cart;
    const wx = _rayO.x + VR.held.offX, wz = _rayO.z + VR.held.offZ;
    const dx = wx - ct.x, dz = wz - ct.z;
    if(typeof cartMoveTo === 'function') cartMoveTo(ct, wx, wz);
    // ease the yaw toward the direction of travel when actually moving
    if(dx*dx + dz*dz > 1e-6){
      const want = Math.atan2(dx, dz);
      let dy = want - ct.yaw;
      while(dy > Math.PI) dy -= Math.PI*2;
      while(dy < -Math.PI) dy += Math.PI*2;
      ct.yaw += clamp(dy, -2.5*dt, 2.5*dt);
      cartPose(ct);
    }
    return;
  }
```

- [ ] **Step 5: The label.** In `describe` (`src/p7.txt:454-482`), add a branch in the parent-walk (mirror the `travRope` branch):

```js
    if(p.userData && p.userData.cartInfo)
      return {kind:'cart', label:'WAREHOUSE CART — squeeze the handle and push'};
```
(`useInfo` needs no case — hover-label-only is a legitimate pattern, per the traveler precedent.)

- [ ] **Step 6: Lifecycle check.** `vrClearRopes` and `vrOnEnd` already null `VR.held` unconditionally — verify both still do after your edits; nothing else needed (the cart is never disposed).

- [ ] **Step 7: Run everything.** `sh build.sh && cd tests && npm test; cd ..` — 13/13 green.

### Task 4.6: Probe, negative-check, commit

- [ ] **Step 1: Probe.** Create `tools/warehouse.js` by copying `tools/arc-foyer.js` wholesale, then replace the `shot(...)` calls with:

```js
  shot('THE PALACE — the warehouse from the doorway',
       new THREE.Vector3(0, 1.7, -18.6), new THREE.Vector3(0, 2.2, -27), 13, 6.6, -0.5, 104, 24);
  shot('THE ARC — the warehouse from the main house rear door',
       new THREE.Vector3(420-26, 1.7, -48.2), new THREE.Vector3(420, 2.4, -55), 30, 6.8, -0.5, 104, 24);
```
and change the raycast targets to `[world]` for the Palace shot and `[ARC.group]` for the Arc shot (two probe loops or an argument — keep it simple, copy the shot function twice if needed). Skip `goToView`. Add both to `tools/README.md`. Run them; the racks, cart and door should read as solid bands. If a shot is empty, the shed didn't build — stop and fix before committing.

- [ ] **Step 2: Negative-check** per §0.3 — with all src changes stashed, `node warehouse.js` fails on every assertion and `node vr.js` fails the cart test; pop, rebuild, all green.

- [ ] **Step 3: Commit** on `warehouses` (several commits are fine — geometry, rooms/collision, cart — one concern per commit). Final message: `p2m+rooms+collision+p9: two warehouse sheds, roller doors, pushable carts`.

---

# Final task — seam check and PRs

- [ ] **Step 1:** With all four branches committed: `git checkout -b seam-check main`, merge `fixture-bodies`, `foh-bar-reach`, `speaker-bars`, `warehouses` in that order, resolving any p4/p2k/p9 overlaps (expected between PR 2 and PR 3: adjacent lines in `buildRig`, the p2k override block, `vrPageFly`).
- [ ] **Step 2:** `sh build.sh && cd tests && npm test; cd ..` — 13/13 on the COMBINED build. Also merge in a second order (`warehouses` first) into a second throwaway and re-run, then delete both throwaways.
- [ ] **Step 3:** Push the four branches; open four PRs per §0.4, each PR body naming its spec section. Do not stack; all bases are `main`.
- [ ] **Step 4:** Report to the owner: what's in each PR, the seam-check result, and the headset questions this round adds (do the new bodies read as real lanterns at arm's length; does the cart push feel right; frame-rate at the racks with ~50 extra meshes per shed).

## Deferred to the PR 5/6 plan (do not build here)

Hanging points, detachable bodies, channel-dead, snap-to-slot, the order screen, pallets. The hooks this plan leaves for them: `userData.clamp` on every body (PR 1), `SHEDS[*].slots` and `CARTS[*].slots` anchor lists (PR 4), the cart grab class as the `kind:`-discriminated `VR.held` precedent, and the level-gate point documented at `p4.txt:418` (`const lvl = clamp(f.level,0,1) * master`).
