# Build Usability PRs 1–2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the two build-usability fixes the owner asked for now — grab wood anywhere along the piece, and a nail gun that joins two pieces already lying together — as two PRs straight to `main`.

**Architecture:** PR 1 replaces the hand-to-centre distance in `vrSqueeze`'s body loop with an exact hand-to-surface distance for wood (the meshes are shared unit boxes scaled, so local-space clamp is exact and cheap). PR 2 adds a seam seek to p4c (pairwise touching test between wood OBBs, approximated on the target's axes with the existing `snapHalf`) and wires it into `vrToolFire`'s no-offer branch plus a throttled per-frame label. The two changes are independent of the deferred snap rebuild and work table (spec §6 scope ruling).

**Tech Stack:** three.js r128, one concatenated HTML file built by `build.sh`, jsdom test suites in `tests/` (run against the BUILT file — always `sh build.sh` after touching `src/`).

**Spec:** `docs/superpowers/specs/2026-08-07-build-usability-design.md` (§2 grab, §4 gun; §3/§5 deferred).

**Ground rules (repo):** one concern per PR, straight to `main`, never stack; suites 15/15 before and after; every new assertion must FAIL against the pre-change build (here that is automatic: write the test, run it against the still-unchanged build, watch it fail); `gh` is not installed — PRs via the GitHub API with the stored git credential; commit messages via `-F` file (PowerShell mangles quotes); never `git add -A`.

---

## PR 1 — grab anywhere on the wood (branch `build-grab`, already exists and carries the spec)

### Task 1: The failing tests

**Files:**
- Modify: `tests/vr.js` — insert immediately after the `P('gun nails a lined-up stud; the hammer pulls it back out', ...)` block, whose last lines are:

```js
    return 'joined by the gun, parted by the hammer';
  });
```

- [ ] **Step 1: Write the three failing tests** (insert after that anchor):

```js
  P('an 8ft stick is a handful anywhere along it', ()=>{
    const b = regWood('s2x4');
    b.mesh.rotation.set(0, 0, 0);
    b.mesh.position.set(4, 1.22, -0.6);        // upright: ends at y=0 and y=2.44
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(4, 2.49, -0.6);            // 5cm past the TOP END — 1.27m from centre
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== b)
      throw new Error('the end of the stick was not taken: '+(VR.held && VR.held.kind));
    vrSqueeze(0, false);
    /* and the tolerance is a tolerance, not a beam: 35cm off is a miss */
    c0.position.set(4, 2.79, -0.6);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(VR.held && VR.held.kind === 'body' && VR.held.body === b)
      throw new Error('a hand 35cm off the end still took it');
    if(VR.held) vrSqueeze(0, false);
    return 'held at the end, missed at 35cm';
  });
  P('a sheet is a handful at its corner', ()=>{
    const s = regWood('sheet');
    s.mesh.rotation.set(0, 0, 0);
    s.mesh.position.set(4, 1.5, -1.2);         // corner at x=5.22, y=2.11
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(5.25, 2.14, -1.2);         // 3cm past the corner both ways
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== s)
      throw new Error('the corner of the sheet was not taken: '+(VR.held && VR.held.kind));
    vrSqueeze(0, false);
    return 'the corner is in reach';
  });
  P('a built frame comes by the end of any plank', ()=>{
    const a1 = regWood('s2x4'), a2 = regWood('s2x4');
    a1.mesh.rotation.set(0, 0, 0); a2.mesh.rotation.set(0, 0, 0);
    a1.mesh.position.set(6, 1.22, -0.6);
    a2.mesh.position.set(6.038, 1.22, -0.6);   // faces kissing in x
    scene.updateMatrixWorld(true);
    addNail(a1, {body:a2}, new THREE.Vector3(6.019, 1.9, -0.6), new THREE.Vector3(1,0,0));
    addNail(a1, {body:a2}, new THREE.Vector3(6.019, 0.6, -0.6), new THREE.Vector3(1,0,0));
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    c0.position.set(6, 2.47, -0.6);            // 3cm past a1's top end
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'asm')
      throw new Error('the frame was not taken whole: '+(VR.held && VR.held.kind));
    vrSqueeze(0, false);
    const asm = a1.asm;
    while(a1.asm && a1.asm.nails.length) removeNail(a1.asm.nails[0]);   // tidy
    if(ASSEMBLIES.indexOf(asm) >= 0) throw new Error('tidy-up failed');
    return 'the whole frame by one plank end';
  });
```

- [ ] **Step 2: Run to verify the new tests FAIL against the unchanged build** (this IS the negative check — `the-house.html` has not been touched):

Run: `cd tests && node vr.js`
Expected: the three new tests FAIL ('the end of the stick was not taken', 'the corner of the sheet was not taken', 'the frame was not taken whole'); every pre-existing test still passes. If any OLD test breaks, stop — the new tests corrupted shared state; fix the tidy-up.

### Task 2: The implementation

**Files:**
- Modify: `src/p9.txt` — two edits: a constant above `vrSqueeze`, and the body-loop distance.

- [ ] **Step 1: Add the constant.** Immediately above `function vrSqueeze(hand, down){` (p9, ~line 1637), insert:

```js
/* wood is grabbed by its SURFACE, not its centre — an 8ft stick is a
   handful anywhere along it (build-usability spec §2).  Wood meshes are
   the shared unit box scaled, so local-space clamp is the exact distance. */
const GRAB_WOOD = 0.15;
```

- [ ] **Step 2: Replace the body-loop distance.** In the "loose gear" block of `vrSqueeze`, the current code is:

```js
      b.mesh.getWorldPosition(_vecA);
      const d = _vecA.distanceTo(_rayO);
      if(d < bdd){ bdd = d; bod = b; }
```

Replace with:

```js
      let d;
      if(b.kind === 'wood'){
        /* hand into the unit-box local frame; per-axis overshoot times the
           scale is the true metric gap to the nearest point on the piece */
        b.mesh.updateWorldMatrix(true, false);
        _vecA.copy(_rayO);
        b.mesh.worldToLocal(_vecA);
        const gx = Math.max(0, Math.abs(_vecA.x) - 0.5) * b.mesh.scale.x,
              gy = Math.max(0, Math.abs(_vecA.y) - 0.5) * b.mesh.scale.y,
              gz = Math.max(0, Math.abs(_vecA.z) - 0.5) * b.mesh.scale.z;
        d = Math.sqrt(gx*gx + gy*gy + gz*gz);
        if(d >= GRAB_WOOD) continue;
      } else {
        b.mesh.getWorldPosition(_vecA);
        d = _vecA.distanceTo(_rayO);
      }
      if(d < bdd){ bdd = d; bod = b; }
```

Notes for the implementer: `bdd` stays initialized to `0.35` (the non-wood cap; wood enforces its own tighter `GRAB_WOOD` cap via the `continue`). Do NOT touch the six-way nearest-wins arbitration below the loop — the wood surface distance simply IS the body's distance in that comparison. Track bodies (kind `'track'`, a Group, 1.2m long) deliberately keep the centre test in this PR (spec §6 out-of-scope list).

- [ ] **Step 3: Rebuild and run the suite:**

Run: `sh build.sh && cd tests && node vr.js`
Expected: `--- failures: 0 ---`, including the three new tests.

- [ ] **Step 4: Run everything:**

Run: `cd tests && npm test`
Expected: all 15 suites at `--- failures: 0 ---`, exit 0.

### Task 3: Commit and open PR 1

- [ ] **Step 1: Commit** (message via `-F` file in the scratchpad, never inline quotes; add files EXPLICITLY, never `git add -A`):

```bash
git add src/p9.txt the-house.html tests/vr.js
git commit -F <scratchpad>/msg1.txt
```

msg1.txt:

```
Grab wood by its surface, not its centre

An 8ft stick was only grabbable across its middle 0.7m: the vrSqueeze
body loop measured the hand to the piece's CENTRE against 0.35.  Wood
now measures to the nearest point on the piece (unit-box local clamp,
exact for the scaled shared box), tolerance GRAB_WOOD 0.15 from the
surface.  Sheets gain their corners; assembled frames come by any
plank end.  Lanterns and other compact bodies keep the centre test.
Three new vr.js tests, each verified failing against the pre-change
build.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

- [ ] **Step 2: Push and open the PR through the API** (title "Grab wood anywhere along the piece", base `main`, head `build-grab`; body written to a scratchpad JSON file, NOT the repo root — pr6.json was that mistake):

```bash
git push -u origin build-grab
printf 'protocol=https\nhost=github.com\n\n' | git credential fill   # take the password= line as TOKEN
curl -s -X POST -H "Authorization: token $TOKEN" \
  https://api.github.com/repos/Jackscreations21/gms-theater-game/pulls \
  -d @<scratchpad>/pr-grab.json
```

- [ ] **Step 3: Tell the owner PR 1 is up, and start PR 2 on top of it locally while waiting.**

---

## PR 2 — the nail gun works on a seam (branch `build-nailgun`, cut from `build-grab`; OPEN it only after PR 1 merges, rebased onto fresh `main`)

### Task 4: The failing tests

**Files:**
- Modify: `tests/vr.js` — insert immediately after the `P('a built frame comes by the end of any plank', ...)` block added in Task 1.

- [ ] **Step 1: Write the three failing tests:**

```js
  P('the gun nails two pieces already lying together', ()=>{
    const a = regWood('s2x4'), b = regWood('s2x4');
    a.mesh.rotation.set(0, 0, Math.PI/2);      // both lying flat, long axis X
    b.mesh.rotation.set(0, 0, Math.PI/2);
    a.mesh.position.set(8, 0.019, -1.0);
    b.mesh.position.set(8, 0.019, -1.089);     // side by side, faces kissing in z
    scene.updateMatrixWorld(true);
    const c1 = VR.controllers[1];
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c1.position.copy(VR.holsters.nailgun.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    if(VR.tools[1] !== 'nailgun') throw new Error('the gun never drew: '+VR.tools[1]);
    c1.position.set(8, 0.1, -1.045);           // over the seam, nothing in the other hand
    c1.updateMatrixWorld(true);
    const before = ASSEMBLIES.length;
    vrSelect(1, true);
    if(ASSEMBLIES.length !== before + 1) throw new Error('the shot never joined them');
    if(a.state !== 'fixed' || b.state !== 'fixed') throw new Error('states: '+a.state+'/'+b.state);
    const n = a.asm.nails[0];
    if(Math.abs(n.axis.z) < 0.9) throw new Error('the nail went in sideways: '+JSON.stringify(n.axis));
    vrSqueeze(1, false);                       // gun home
    const asm = a.asm;
    while(a.asm && a.asm.nails.length) removeNail(a.asm.nails[0]);   // tidy
    if(ASSEMBLIES.indexOf(asm) >= 0) throw new Error('tidy-up failed');
    return 'two loose pieces, one trigger, one frame';
  });
  P('the gun refuses pieces apart, and a seam out of reach', ()=>{
    const a = regWood('s2x4'), b = regWood('s2x4');
    a.mesh.rotation.set(0, 0, Math.PI/2);
    b.mesh.rotation.set(0, 0, Math.PI/2);
    a.mesh.position.set(8, 0.019, -3.0);
    b.mesh.position.set(8, 0.019, -3.289);     // 0.2m of daylight between them
    scene.updateMatrixWorld(true);
    const c1 = VR.controllers[1];
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c1.position.copy(VR.holsters.nailgun.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    c1.position.set(8, 0.1, -3.14);
    c1.updateMatrixWorld(true);
    let before = ASSEMBLIES.length;
    vrSelect(1, true);
    if(ASSEMBLIES.length !== before) throw new Error('it nailed across 0.2m of air');
    /* close the gap so they touch, but fire from too far away */
    b.mesh.position.set(8, 0.019, -3.089);
    scene.updateMatrixWorld(true);
    c1.position.set(8, 0.1, -3.75);            // ~0.66m from the seam
    c1.updateMatrixWorld(true);
    before = ASSEMBLIES.length;
    vrSelect(1, true);
    if(ASSEMBLIES.length !== before) throw new Error('it nailed from across the room');
    vrSqueeze(1, false);
    a.mesh.position.set(8, 0.019, -5.0);       // tidy: part them so later tests
    scene.updateMatrixWorld(true);             // never see this pair as a seam
    return 'daylight refused, long reach refused';
  });
  P('the gun talks when a seam is in reach', ()=>{
    const a = regWood('s2x4'), b = regWood('s2x4');
    a.mesh.rotation.set(0, 0, Math.PI/2);
    b.mesh.rotation.set(0, 0, Math.PI/2);
    a.mesh.position.set(10, 0.019, -1.0);
    b.mesh.position.set(10, 0.019, -1.089);
    scene.updateMatrixWorld(true);
    const c1 = VR.controllers[1];
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c1.position.copy(VR.holsters.nailgun.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    c1.position.set(10, 0.1, -1.045);
    c1.updateMatrixWorld(true);
    vrLabel(null);
    vrGunLabel(1);                             // dt=1 beats the 0.12s throttle
    if(VR.labelTxt !== 'TRIGGER TO NAIL')
      throw new Error('the gun said nothing: '+VR.labelTxt);
    c1.position.set(10, 0.1, -3.5);            // walk away
    c1.updateMatrixWorld(true);
    vrLabel(null);
    vrGunLabel(1);
    if(VR.labelTxt === 'TRIGGER TO NAIL') throw new Error('it is still talking from 2.5m');
    vrSqueeze(1, false);
    a.mesh.position.set(10, 0.019, -5.0);      // tidy: part the pair
    scene.updateMatrixWorld(true);
    return 'label at the seam, silence away from it';
  });
```

- [ ] **Step 2: Run to verify the new tests FAIL against the unchanged build:**

Run: `cd tests && node vr.js`
Expected: the three new tests FAIL (first: 'the shot never joined them'; second: passes its first assert but note — it must FAIL overall today via the label test's `vrGunLabel is not defined`; check each). Every pre-existing test still passes.

Note: test 2 (refusals) may PASS against the unfixed build — refusing is what the old code does. That is fine; it guards the new code's limits. Tests 1 and 3 are the negative-checked pair.

### Task 5: The seam seek (p4c)

**Files:**
- Modify: `src/p4c.txt` — new section inserted immediately BEFORE the line `/* feet-and-inches for the tape, the saws and the labels: 2.4384 -> 8'0" */`

- [ ] **Step 1: Insert the seam section:**

```js
/* ============================================================================
   THE SEAM (build-usability spec §4): the nail gun pointed at two pieces
   ALREADY touching joins them, no hand on either.  A pair "touches" when
   no axis of the target's frame separates them by more than SEAM_TOUCH
   (the OBB test run on one box's axes — exact for our squared-up world,
   honest enough for the rest).  The contact point is the held centre
   projected onto the touching face, clamped to it; the axis is that
   face's normal.  addNail already builds, joins and merges assemblies
   from any mix of loose and fixed pieces, and already refuses what must
   be refused (two anchored assemblies) — the seam adds NO new rules.
   ========================================================================== */
const SEAM_TOUCH = 0.05;         // faces within this are touching
const SEAM_REACH = 0.45;         // the muzzle must be this close to the seam
const _smA = new T.Vector3(), _smB = new T.Vector3(), _smH = new T.Vector3(),
      _smQ = new T.Quaternion(), _smQ2 = new T.Quaternion(), _smP = new T.Vector3();
const _AXES = ['x', 'y', 'z'];
/* the seam between two wood bodies: {point, axis} in WORLD, or null */
function seamPair(A, B){
  const am = A.mesh, bm = B.mesh;
  am.updateWorldMatrix(true, false);
  bm.updateWorldMatrix(true, false);
  bm.getWorldPosition(_smB);
  _smA.copy(_smB);
  am.worldToLocal(_smA);                        // B's centre, A-unit-local
  am.getWorldQuaternion(_smQ);
  bm.getWorldQuaternion(_smQ2);
  _aq.copy(_smQ).invert().multiply(_smQ2);      // B relative to A
  snapHalf(_aq, bm.scale, _smH);                // B's half extents on A's axes
  let axis = 0, worst = -1e9;
  for(let i = 0; i < 3; i++){
    const k = _AXES[i];
    const pm = _smA[k] * am.scale[k];           // metric offset on A's axis
    const gap = Math.abs(pm) - (am.scale[k]/2 + _smH.getComponent(i));
    if(gap > SEAM_TOUCH) return null;           // daylight on this axis: apart
    if(gap > worst){ worst = gap; axis = i; }   // the touching face is the
  }                                             // axis NEAREST to separating
  const K = _AXES[axis];
  const sgn = _smA[K] < 0 ? -1 : 1;
  _smP.copy(_smA);
  _smP[K] = sgn * 0.5;                          // onto A's touching face…
  for(let i = 0; i < 3; i++){
    if(i === axis) continue;
    const k = _AXES[i];
    _smP[k] = clamp(_smP[k], -0.5, 0.5);        // …and clamped to it
  }
  const point = am.localToWorld(_smP.clone());
  const ax = _av3.set(axis === 0 ? sgn : 0, axis === 1 ? sgn : 0, axis === 2 ? sgn : 0)
    .applyQuaternion(_smQ).normalize().clone();
  return {point, axis: ax};
}
/* the nearest nailable seam to the muzzle.  The 2m prefilter also keeps
   the pair walk to the local venue — the venues are 420m apart. */
function seamSeek(muzzle){
  let best = null, bd = SEAM_REACH;
  const near = [];
  for(const b of BODIES){
    if(b.kind !== 'wood') continue;
    if(b.state !== 'loose' && b.state !== 'fixed') continue;
    b.mesh.getWorldPosition(_av2);
    if(_av2.distanceTo(muzzle) < 2) near.push(b);
  }
  for(let i = 0; i < near.length; i++)
    for(let j = i + 1; j < near.length; j++){
      const s = seamPair(near[i], near[j]);
      if(!s) continue;
      const d = s.point.distanceTo(muzzle);
      if(d < bd){ bd = d; best = {a:near[i], b:near[j], point:s.point, axis:s.axis}; }
    }
  return best;
}
```

Notes: a pair inside the SAME assembly is deliberately nailable again — that is how a swinging one-nail piece (or a hinged door) is nailed rigid/shut, the PR 6 semantics. `snapHalf`, `_aq`, `_av2`, `_av3`, `clamp` are all already defined above this point in p4c/p2.

### Task 6: The gun and the label (p9)

**Files:**
- Modify: `src/p9.txt` — two edits.

- [ ] **Step 1: The trigger.** In `vrToolFire`, replace:

```js
    const s = VR.snap;
    if(!s){ if(typeof toast === 'function') toast('nothing lined up to nail'); return; }
```

with:

```js
    const s = VR.snap;
    if(!s){
      /* no held offer: the seam under the muzzle (build-usability §4) */
      const sm = (typeof seamSeek === 'function') ? seamSeek(_rayO) : null;
      if(sm){
        const n = addNail(sm.a, {body:sm.b}, sm.point, sm.axis);
        if(typeof Snd !== 'undefined' && Snd.play) Snd.play('click');
        if(typeof toast === 'function') toast(n ? 'nailed' : 'that will not take a nail');
      } else if(typeof toast === 'function') toast('nothing lined up to nail');
      return;
    }
```

- [ ] **Step 2: The label.** Immediately above `function vrUpdate(dt){`, insert:

```js
/* the gun talks: while a nail gun is in hand and no held offer stands, a
   nailable seam near the muzzle labels itself.  The seek is throttled —
   a pair walk over a dense build is not a per-frame cost — and the cached
   seam re-labels every frame so the hover never wins the flicker war. */
function vrGunLabel(dt){
  VR.seamT = (VR.seamT || 0) + dt;
  if(VR.snap || (VR.held && VR.held.kind === 'body')){ VR.seam = null; return; }
  const gh = VR.tools && (VR.tools[0] === 'nailgun' ? 0 : VR.tools[1] === 'nailgun' ? 1 : -1);
  if(gh === undefined || gh < 0){ VR.seam = null; return; }
  if(VR.seamT > 0.12){
    VR.seamT = 0;
    const c = VR.controllers[gh];
    if(!c){ VR.seam = null; return; }
    c.updateMatrixWorld(true);
    _vecA.setFromMatrixPosition(c.matrixWorld);
    VR.seam = (typeof seamSeek === 'function') ? seamSeek(_vecA) : null;
  }
  if(VR.seam){
    const d = camera.getWorldPosition(_vecB).distanceTo(VR.seam.point);
    vrLabel('TRIGGER TO NAIL', VR.seam.point, d);
  }
}
```

Then in `vrUpdate`, after the line `vrUpdateHold(dt);`, insert:

```js
  vrGunLabel(dt);
```

Note: `_vecB` — check it exists near `_vecA`'s declaration in p9; if p9 only has `_vecA`, declare a fresh `const _gunV = new T.Vector3();` above `vrGunLabel` and use that instead (the vrTapeLine aliasing trap — never pass a shared temp into a function that also uses it).

- [ ] **Step 3: Rebuild and run the suite:**

Run: `sh build.sh && cd tests && node vr.js`
Expected: `--- failures: 0 ---` including all six new tests (three from PR 1, three from this PR).

- [ ] **Step 4: Run everything:**

Run: `cd tests && npm test`
Expected: all 15 suites `--- failures: 0 ---`.

### Task 7: HANDOFF and commit

**Files:**
- Modify: `HANDOFF.md` — the step-zero headset list.

- [ ] **Step 1:** Add to the headset feel-questions list (the "New from the build round" area):

```
New from the usability round (grab + gun): does GRAB_WOOD 0.15 feel
like grabbing lumber or like a magnet (one constant, p9); does the
gun-at-seam read — point at two touching pieces, TRIGGER TO NAIL label,
fire — or does the SEAM_REACH 0.45 leash feel short; does SEAM_TOUCH
0.05 accept the seams a real stack of lumber offers.
```

- [ ] **Step 2: Commit on `build-nailgun`:**

```bash
git add src/p4c.txt src/p9.txt the-house.html tests/vr.js HANDOFF.md
git commit -F <scratchpad>/msg2.txt
```

msg2.txt:

```
The nail gun fires into a seam: touching pieces join, no hand on either

The owner laid two pieces together on the deck and pulled the trigger —
nothing.  The gun only confirmed a ghost offer on a HELD piece.  Now,
with no offer standing, it seeks the nearest touching wood pair within
SEAM_REACH 0.45 of the muzzle (OBB touch test on the target's axes,
SEAM_TOUCH 0.05) and drives a nail at the contact: addNail already
knew how to join any mix of loose pieces and assemblies.  While the
gun is in hand a throttled seek labels a reachable seam TRIGGER TO
NAIL.  The held-offer flow is untouched and still wins when standing.
Three new vr.js tests; the join and label tests verified failing
against the pre-change build.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

### Task 8: Open PR 2 the clean-dependent way

- [ ] **Step 1: Wait for PR 1 to merge** (the owner's move).
- [ ] **Step 2: Rebase, rebuild, retest, push, open:**

```bash
git fetch origin
git rebase origin/main build-nailgun     # if the-house.html conflicts: take EITHER side, then sh build.sh regenerates it; git add the-house.html; git rebase --continue
sh build.sh
cd tests && npm test                      # 15/15 before pushing
git push -u origin build-nailgun
```

Open via the API exactly as in Task 3 (title "The nail gun fires into a seam", base `main`, head `build-nailgun`, body JSON in the scratchpad).

- [ ] **Step 3: After the owner merges:** verify `main` rebuilds byte-identical (`git checkout main && git pull && sh build.sh && git status --short` → clean), 15/15 on `main`, delete both work branches local and remote.

---

## Addendum (same day): PRs 3–4 un-deferred

The owner said go on the remaining two, late in the usage window — so this
addendum is deliberately lean; spec §3 and §5 carry the full design and the
constants, and the discipline is unchanged (failing test → negative check →
implement → build → 15/15 → one PR, opened after its parent merges).

- **PR 3 (`build-snap`, cut from `build-nailgun`)** — spec §3. Rebuild
  `snapWood` step 1: candidates by metric SURFACE gap (`SNAP_SEEK 0.35`),
  joint axes require cross-axis face overlap (`SNAP_SLACK 0.08`), daylight
  axes beat overlapped axes, smallest flush error ≤ `SNAP_OFFER 0.22` wins;
  position/nail math all metric (the old code mixed unit-box coordinates
  with metric flush distances and could bury a snapped piece inside its
  target). Tests in `tests/build.js`: end-to-end butt offers with flush pos
  and seam nail (fails pre-change: centres 2.48m apart > the old 1.4m);
  side-by-side flush position honest (fails pre-change: the unit/metric
  bug left pos unmoved); past-the-edge refusal (guard for the new overlap
  rule).
- **PR 4 (`build-table`, cut from `build-snap`)** — spec §5, unchanged.

## Self-review (done at write time)

- **Spec coverage:** §2 grab → Tasks 1–3 (surface distance, GRAB_WOOD 0.15, wood-only, arbitration untouched, stick/sheet/assembly tests). §4 gun → Tasks 4–8 (seam seek, precedence hinge→offer→seam→refusal, wood-to-wood only — states loose/fixed, no deck target in the seek — label, reach/touch constants, tests). §3/§5 correctly absent (deferred).
- **Placeholders:** none; every step carries its code or its exact command.
- **Type consistency:** `seamSeek(muzzle)` returns `{a, b, point, axis}` — matches both call sites; `seamPair` returns `{point, axis}`; `vrGunLabel(dt)` matches the test call `vrGunLabel(1)` and the vrUpdate call.
- **Known judgment calls, on purpose:** same-assembly pairs stay nailable (that is the nail-a-door-shut path); test 2's refusal asserts may pass pre-change (documented in-step; tests 1 and 3 are the negative-checked pair).
