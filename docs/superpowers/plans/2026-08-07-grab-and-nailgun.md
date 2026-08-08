# Grab-Anywhere + Nail-Gun-at-Seam Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the two owner-scoped fixes from the build-usability spec (§2 and §4 of `docs/superpowers/specs/2026-08-07-build-usability-design.md`): wood grabbable anywhere along its surface, and the nail gun able to nail two pieces that are already touching — no held piece required.

**Architecture:** Two independent PRs. PR 1 (`build-grab`) changes ONE distance test in p9's `vrSqueeze` body loop from centre-distance to exact surface-distance (wood meshes are the shared unit box scaled, so local-space clamp gives the true gap). PR 2 (`build-nailgun`, cut from PR 1's branch, opened after PR 1 merges) adds `seamSeek` to p4c (find the nearest touching wood-wood contact near a point), wires it into `vrToolFire`'s no-offer branch, and adds a per-frame gun label. The deferred §3 snap rebuild and §5 table are NOT in this plan.

**Tech Stack:** three.js r128 concatenated build (`sh build.sh`), jsdom test suites (`tests/vr.js`), PRs via GitHub API (no `gh` on this machine).

**Repo rules that bind every step:** one concern per PR, straight to `main`, never stack; every new assertion negative-checked against the pre-change build; never `git add -A`; commit messages written to a file and passed with `-F`; suites 15/15 before and after.

---

## Task 0: Preflight

**Files:** none modified.

- [ ] **Step 0.1: Confirm the branch and a green baseline**

```bash
cd /c/Users/patri/Documents/theater_game
git checkout build-grab        # exists; carries the spec + this plan
git log --oneline -2           # expect: plan/spec commits on top of origin/main
sh build.sh
cd tests && npm test
```

Expected: build prints its syntax-check pass; `npm test` ends `15/15 suites`, exit 0. If not, STOP — the baseline is broken and this plan assumes it isn't.

---

## Task 1: PR 1 — grab anywhere on the wood (branch `build-grab`)

**Files:**
- Modify: `src/p9.txt` — the body-grab loop inside `vrSqueeze` (the block starting `/* loose gear (the p4 detach system)` around line 1822), plus two new lines above `function vrSqueeze`
- Test: `tests/vr.js` — one new `P(...)` test, inserted immediately AFTER the closing `});` of the existing test `P('gun nails a lined-up stud; the hammer pulls it back out', ...)`

**Why here:** wood meshes are always the shared unit `BoxGeometry` scaled (`makeWoodMesh`, p4c), so `worldToLocal` puts the hand into unit-box space where faces sit at ±0.5 and the per-axis overshoot × `mesh.scale` is the exact metric gap to the surface.

- [ ] **Step 1.1: Write the failing test**

In `tests/vr.js`, find the test `P('gun nails a lined-up stud; the hammer pulls it back out', ...)` and insert after its closing `});` (note: this code lives inside the big `probe` template literal — use NO backticks and NO `${` inside test code, string-concat with `+` like the neighbours):

```js
  P('wood is a handful anywhere along it, not just at its middle', ()=>{
    /* an 8ft 2x4 lying along world X: rot z 90 maps the long local Y axis
       across the stage.  Ends at x = 5 +/- 1.2192. */
    const stick = regWood('s2x4');
    stick.mesh.rotation.set(0, 0, Math.PI/2);
    stick.mesh.position.set(5, 1.0, -0.6);
    const sheet = regWood('sheet');
    sheet.mesh.position.set(5, 1.0, -3);       // corners at (5+/-1.2192, 1.0+/-0.6096)
    scene.updateMatrixWorld(true);
    const c0 = VR.controllers[0];
    c0.quaternion.set(0,0,0,1);
    /* 5cm past the stick's end face — 1.27m from its centre */
    c0.position.set(5 + 1.2192 + 0.05, 1.0, -0.6);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== stick)
      throw new Error('the end of the stick was not taken: '+(VR.held && VR.held.kind));
    vrSqueeze(0, false);
    /* 30cm off the end is air */
    scene.updateMatrixWorld(true);
    c0.position.set(5 + 1.2192 + 0.30, 1.0, -0.6);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(VR.held) throw new Error('30cm off the end still grabbed: '+VR.held.kind);
    vrSqueeze(0, false);
    /* a sheet corner, 4cm diagonally off it */
    c0.position.set(5 + 1.2192 + 0.04, 1.0 + 0.6096 + 0.04, -3);
    c0.updateMatrixWorld(true);
    vrSqueeze(0, true);
    if(!VR.held || VR.held.kind !== 'body' || VR.held.body !== sheet)
      throw new Error('the sheet corner was not taken: '+(VR.held && VR.held.kind));
    vrSqueeze(0, false);
    /* tidy: deregister both so no later count or proximity assertion moves */
    [stick, sheet].forEach(b=>{
      BODIES.splice(BODIES.indexOf(b), 1);
      if(b.mesh.parent) b.mesh.parent.remove(b.mesh);   // shared geom/mat — no dispose
    });
    return 'held at the tip and the corner, refused a foot off the end';
  });
```

- [ ] **Step 1.2: Run it — the grab assertions must FAIL today**

```bash
cd /c/Users/patri/Documents/theater_game && sh build.sh && cd tests && node vr.js
```

Expected: the new test FAILS with `the end of the stick was not taken` (hand is 1.27m from centre, today's radius is 0.35). Everything else stays green. (The build step matters — vr.js reads `the-house.html`, and the test rides the committed build; rebuilding without src changes reproduces it byte-identical.)

- [ ] **Step 1.3: Implement — surface distance for wood**

In `src/p9.txt`, directly ABOVE the line `function vrSqueeze(hand, down){` (grep for it), insert:

```js
/* wood is grabbed by its SURFACE, not its centre: an 8ft stick is a handful
   anywhere along it.  Wood meshes are the shared unit box scaled, so local
   space puts the faces at +/-0.5 and overshoot x scale is the true gap. */
const GRAB_WOOD = 0.15;
const _wsd = new T.Vector3();
function woodSurfDist(mesh, p){
  _wsd.copy(p);
  mesh.worldToLocal(_wsd);
  const gx = Math.max(0, Math.abs(_wsd.x) - 0.5) * mesh.scale.x;
  const gy = Math.max(0, Math.abs(_wsd.y) - 0.5) * mesh.scale.y;
  const gz = Math.max(0, Math.abs(_wsd.z) - 0.5) * mesh.scale.z;
  return Math.sqrt(gx*gx + gy*gy + gz*gz);
}
```

Then in the body loop inside `vrSqueeze` replace exactly this:

```js
  let bod = null, bdd = 0.35;
  if(typeof BODIES !== 'undefined'){
    for(const b of BODIES){
      if(b.state === 'held') continue;
      if(b.state === 'hung'){
        const p = b.point;
        const live = p && (p.spk
          ? (SPKBARS && (SPKBARS.L === p.bar || SPKBARS.R === p.bar))
          : FIXTURES.indexOf(p) >= 0);
        if(!live) continue;
      }
      b.mesh.getWorldPosition(_vecA);
      const d = _vecA.distanceTo(_rayO);
      if(d < bdd){ bdd = d; bod = b; }
    }
  }
```

with this (the hung-live check is untouched; only the distance test forks by kind — the six-way arbitration below it is NOT touched):

```js
  let bod = null, bdd = Infinity;
  if(typeof BODIES !== 'undefined'){
    for(const b of BODIES){
      if(b.state === 'held') continue;
      if(b.state === 'hung'){
        const p = b.point;
        const live = p && (p.spk
          ? (SPKBARS && (SPKBARS.L === p.bar || SPKBARS.R === p.bar))
          : FIXTURES.indexOf(p) >= 0);
        if(!live) continue;
      }
      let d;
      if(b.kind === 'wood'){
        d = woodSurfDist(b.mesh, _rayO);
        if(d >= GRAB_WOOD) continue;
      } else {
        b.mesh.getWorldPosition(_vecA);
        d = _vecA.distanceTo(_rayO);
        if(d >= 0.35) continue;
      }
      if(d < bdd){ bdd = d; bod = b; }
    }
  }
```

(`bdd` starts at `Infinity` now because each kind gates on its own radius; when no candidate passes, `bod` stays null and every downstream `(!bod || ...)` comparison short-circuits — verified against the arbitration lines that follow.)

- [ ] **Step 1.4: Build and run the suite**

```bash
cd /c/Users/patri/Documents/theater_game && sh build.sh && cd tests && node vr.js
```

Expected: `--- failures: 0 ---`. A hand INSIDE the wood reads distance 0 and wins the arbitration — that is correct and intended.

- [ ] **Step 1.5: Full suite**

```bash
cd /c/Users/patri/Documents/theater_game/tests && npm test
```

Expected: 15/15. Watch `build.js` and `full14.js` in particular — nothing else touches this loop, but the suite is the proof.

- [ ] **Step 1.6: Negative-check the new test against the pre-change build**

```bash
cd /c/Users/patri/Documents/theater_game
git stash push -- src/p9.txt
sh build.sh
cd tests && node vr.js
```

Expected: ONLY the new test fails, with `the end of the stick was not taken`. Then restore:

```bash
cd /c/Users/patri/Documents/theater_game
git stash pop
sh build.sh
cd tests && node vr.js
```

Expected: failures 0 again.

- [ ] **Step 1.7: Commit**

```bash
cd /c/Users/patri/Documents/theater_game
git add src/p9.txt tests/vr.js the-house.html
cat > ../msg.txt <<'EOF'
The grab: wood is a handful anywhere along it

vrSqueeze measured the hand to a body's CENTRE (0.35), so an 8ft stick
was only grabbable across its middle ~0.7m — the first thing the headset
tripped on.  Wood now measures to its SURFACE: local-space clamp on the
shared unit box, overshoot x scale, GRAB_WOOD = 0.15.  Compact gear
keeps the centre test; the six-way arbitration is untouched.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
git commit -F ../msg.txt && rm ../msg.txt
```

- [ ] **Step 1.8: Push and open PR 1 via the GitHub API**

```bash
cd /c/Users/patri/Documents/theater_game
git push -u origin build-grab
cat > ../pr-body.json <<'EOF'
{"title": "The grab: wood is a handful anywhere along it",
 "head": "build-grab", "base": "main",
 "body": "First of the two owner-scoped build-usability fixes (spec + plan ride this PR, docs/superpowers/). vrSqueeze measured the hand to a wood piece's CENTRE against 0.35m, so an 8ft stick was only grabbable across its middle ~0.7m. Wood now measures to its SURFACE (exact local-space gap on the shared unit box), GRAB_WOOD = 0.15, headset-tunable. Compact gear keeps the centre test; the six-way nearest-wins arbitration is untouched. New vr.js test (stick tip at 1.27m from centre, sheet corner, and a 30cm refusal) verified to FAIL against the pre-change build. 15/15 suites.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)"}
EOF
TOKEN=$(printf 'protocol=https\nhost=github.com\n' | git credential fill | grep '^password=' | cut -d= -f2-)
curl -s -X POST -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/Jackscreations21/gms-theater-game/pulls \
  -d @../pr-body.json | grep '"html_url"' | head -1
rm ../pr-body.json
```

Expected: the PR's `html_url` printed. Tell the owner it is ready.

---

## Task 2: PR 2 — the nail gun works on a seam (branch `build-nailgun`)

**Files:**
- Modify: `src/p4c.txt` — new SEAM SEEK section inserted between `snapAsm`'s closing brace and the `/* feet-and-inches ... */` comment above `function ftIn`
- Modify: `src/p9.txt` — the no-offer branch in `vrToolFire` (`if(!s){ ... 'nothing lined up to nail' ... }`), a new `vrGunLabel` function directly below `function vrHoverWorld`'s closing brace, and one call added in `vrUpdate` after `vrUpdateHold(dt);`
- Test: `tests/vr.js` — one new `P(...)` test inserted immediately AFTER the PR 1 test from Task 1

Branch discipline: built ON `build-grab` (it needs Task 1's test anchor), OPENED only after PR 1 merges — rebase onto fresh `main`, retest, then push (the #37/#38 pattern).

- [ ] **Step 2.1: Cut the branch**

```bash
cd /c/Users/patri/Documents/theater_game
git checkout build-grab && git checkout -b build-nailgun
```

- [ ] **Step 2.2: Write the failing test**

In `tests/vr.js`, insert after the closing `});` of Task 1's `P('wood is a handful anywhere along it, ...)` test:

```js
  P('the gun nails two pieces already touching on the deck', ()=>{
    /* the owner's exact case from the first headset run: two studs laid
       together on the floor, the gun pointed at the seam, nothing held */
    const a = regWood('s2x4'), b = regWood('s2x4');
    a.mesh.rotation.set(0, 0, Math.PI/2);      // flat: 38mm face down
    b.mesh.rotation.set(0, 0, Math.PI/2);
    a.mesh.position.set(6, 0.019, -3);
    b.mesh.position.set(6, 0.019, -3 - 0.089 - 0.20);   // 20cm APART first
    scene.updateMatrixWorld(true);
    const c1 = VR.controllers[1];
    c1.quaternion.set(0,0,0,1);
    vrUpdateBelt(); VR.rig.updateMatrixWorld(true);
    c1.position.copy(VR.holsters.nailgun.getWorldPosition(new THREE.Vector3()));
    c1.updateMatrixWorld(true);
    vrSqueeze(1, true);
    if(VR.tools[1] !== 'nailgun') throw new Error('the gun never drew: '+VR.tools[1]);
    /* apart: the shot refuses */
    c1.position.set(6, 0.10, -3.15);
    c1.updateMatrixWorld(true);
    let asmBefore = ASSEMBLIES.length;
    vrSelect(1, true);
    if(ASSEMBLIES.length !== asmBefore) throw new Error('20cm apart still nailed');
    /* kissing, but the muzzle a metre up: still refuses (SEAM_REACH) */
    b.mesh.position.set(6, 0.019, -3 - 0.089);
    scene.updateMatrixWorld(true);
    c1.position.set(6, 1.2, -3.045);
    c1.updateMatrixWorld(true);
    vrSelect(1, true);
    if(ASSEMBLIES.length !== asmBefore) throw new Error('nailed from a metre away');
    /* the label knows before the trigger does */
    c1.position.set(6, 0.10, -3.045);
    c1.updateMatrixWorld(true);
    vrLabel(null);
    vrGunLabel();
    if(!VR.labelTxt || VR.labelTxt.indexOf('NAIL') < 0)
      throw new Error('no seam label at the seam: '+VR.labelTxt);
    /* the shot, at the seam: one assembly, one nail, both fixed */
    vrSelect(1, true);
    if(ASSEMBLIES.length !== asmBefore + 1) throw new Error('the seam shot never joined them');
    if(a.state !== 'fixed' || b.state !== 'fixed') throw new Error('states: '+a.state+'/'+b.state);
    const asm = a.asm;
    if(!asm || b.asm !== asm || asm.nails.length !== 1)
      throw new Error('nails: '+(asm && asm.nails.length));
    /* a second shot into the same seam stiffens it: two nails, no pivots */
    vrSelect(1, true);
    if(asm.nails.length !== 2) throw new Error('the second nail never took: '+asm.nails.length);
    if(asm.pieces.some(p=>p.pivot)) throw new Error('two nails and it still swings');
    vrSqueeze(1, false);                        // gun home
    /* tidy: pull both nails (frees the pieces, removes the assembly), deregister */
    while(asm.nails.length) removeNail(asm.nails[asm.nails.length - 1]);
    [a, b].forEach(x=>{
      BODIES.splice(BODIES.indexOf(x), 1);
      if(x.mesh.parent) x.mesh.parent.remove(x.mesh);
    });
    return 'refused apart and afar, nailed at the seam, stiffened by the second';
  });
```

- [ ] **Step 2.3: Run it — must FAIL today**

```bash
cd /c/Users/patri/Documents/theater_game && sh build.sh && cd tests && node vr.js
```

Expected: FAILS at `no seam label at the seam` (vrGunLabel does not exist → thrown ReferenceError is also acceptable as the failure) or at `the seam shot never joined them` if the label assertion is reached differently. Any of these is the negative signal; everything else green.

- [ ] **Step 2.4: Implement `seamSeek` in p4c**

In `src/p4c.txt`, between the closing `}` of `function snapAsm(a){...}` and the comment `/* feet-and-inches for the tape, ... */`, insert:

```js
/* ============================================================================
   THE SEAM SEEK (build-usability spec §4).  The gun pointed at two pieces
   that already TOUCH — on the deck, on anything — nails them, no held
   piece required (the first headset run's expectation).  Among wood
   bodies near the muzzle, find the pair whose surfaces meet (per-axis
   flush test through |R|·h, the snapWood maths) and return the contact
   nearest the muzzle.  Held pieces are the ghost flow's business and are
   skipped; so are seated (saw bookkeeping) and slotted stock.  A pair
   already sharing an assembly is a REINFORCEMENT — addNail turns the
   one-nail pivot rigid, consistent with RULING G.
   ========================================================================== */
const SEAM_TOUCH = 0.05;        // surfaces within 5cm (or overlapping) touch
const SEAM_REACH = 0.45;        // the muzzle must be on the seam, not near it
const _sm1 = new T.Quaternion(), _sm2 = new T.Vector3(), _sm3 = new T.Vector3();
const _smC = [];
function seamSeek(muzzle){
  _smC.length = 0;
  for(const b of BODIES){
    if(b.kind !== 'wood') continue;
    if(b.state !== 'loose' && b.state !== 'fixed') continue;
    b.mesh.getWorldPosition(_av2);
    if(_av2.distanceTo(muzzle) < 2) _smC.push(b);
  }
  let best = null, bd = SEAM_REACH;
  for(let i = 0; i < _smC.length; i++) for(let j = 0; j < _smC.length; j++){
    if(i === j) continue;
    const A = _smC[i], B = _smC[j];
    if(A.venue !== B.venue) continue;
    const tm = B.mesh;
    tm.updateMatrixWorld(true);
    A.mesh.updateMatrixWorld(true);
    tm.getWorldQuaternion(_sq);
    A.mesh.getWorldQuaternion(_aq2);
    _sm1.copy(_sq).invert().multiply(_aq2);
    snapHalf(_sm1, A.mesh.scale, _sm2);        // A's half extents along B's axes
    A.mesh.getWorldPosition(_av);
    _sm3.copy(_av);
    tm.worldToLocal(_sm3);                     // A's centre, B-local UNIT coords
    let gap2 = 0, axK = 0, axSep = -1e9, sign = 1;
    for(let k = 0; k < 3; k++){
      const key = 'xyz'[k];
      const p = _sm3[key] * tm.scale[key];
      const flush = tm.scale[key]/2 + _sm2.getComponent(k);
      const over = Math.abs(p) - flush;        // >0 separated on k, <0 overlapping
      if(over > 0) gap2 += over*over;
      if(over > axSep){ axSep = over; axK = k; sign = p < 0 ? -1 : 1; }
    }
    if(Math.sqrt(gap2) > SEAM_TOUCH) continue;
    const kk = 'xyz'[axK];
    _av3.copy(_sm3);
    _av3[kk] = sign * 0.5;                     // onto B's face...
    _av3.x = clamp(_av3.x, -0.5, 0.5);         // ...clamped to the seam
    _av3.y = clamp(_av3.y, -0.5, 0.5);
    _av3.z = clamp(_av3.z, -0.5, 0.5);
    const point = tm.localToWorld(_av3.clone());
    const d = point.distanceTo(muzzle);
    if(d >= bd) continue;
    bd = d;
    const axis = _sm2.set(axK===0?sign:0, axK===1?sign:0, axK===2?sign:0)
      .applyQuaternion(_sq).normalize().clone();
    best = {a:A, b:B, point, axis};
  }
  return best;
}
```

- [ ] **Step 2.5: Wire the gun and the label in p9**

In `src/p9.txt`, in `vrToolFire`, replace exactly:

```js
    const s = VR.snap;
    if(!s){ if(typeof toast === 'function') toast('nothing lined up to nail'); return; }
```

with:

```js
    const s = VR.snap;
    if(!s){
      /* nothing held or offered: the gun nails a SEAM under its muzzle —
         two pieces already touching (build-usability spec §4) */
      const seam = (typeof seamSeek === 'function') ? seamSeek(_rayO) : null;
      if(seam){
        const n2 = addNail(seam.a, {body:seam.b}, seam.point, seam.axis);
        if(typeof Snd !== 'undefined' && Snd.play) Snd.play('click');
        if(typeof toast === 'function') toast(n2 ? 'nailed' : 'that will not take a nail');
      } else if(typeof toast === 'function') toast('nothing lined up to nail');
      return;
    }
```

Then, directly below the closing `}` of `function vrHoverWorld(){...}`, insert:

```js
/* a nail gun in hand announces the seam it can reach — the label answers
   before the trigger has to.  Only ever SETS a label (when a seam is in
   reach); the hover/hold labels this frame already decided the rest. */
function vrGunLabel(){
  if(!VR.tools || VR.snap) return;
  if(VR.held && VR.held.kind === 'body') return;
  for(let h = 0; h < 2; h++){
    if(VR.tools[h] !== 'nailgun') continue;
    const c = VR.controllers[h];
    if(!c) continue;
    c.updateMatrixWorld(true);
    _vecA.setFromMatrixPosition(c.matrixWorld);
    const seam = (typeof seamSeek === 'function') ? seamSeek(_vecA) : null;
    if(seam){
      const camD = camera.getWorldPosition(_run).distanceTo(seam.point);
      vrLabel('SEAM — trigger to NAIL', seam.point, camD);
      return;
    }
  }
}
```

Then in `vrUpdate`, change:

```js
  vrUpdateHold(dt);
  vrUpdateRopes(dt);
```

to:

```js
  vrUpdateHold(dt);
  vrGunLabel();
  vrUpdateRopes(dt);
```

- [ ] **Step 2.6: Build and run vr.js, then the full suite**

```bash
cd /c/Users/patri/Documents/theater_game && sh build.sh && cd tests && node vr.js && npm test
```

Expected: failures 0, then 15/15. The existing `gun nails a lined-up stud` test is the proof the held-offer flow is untouched (the snap branch still takes precedence over the seam).

- [ ] **Step 2.7: Negative-check against the pre-change build**

```bash
cd /c/Users/patri/Documents/theater_game
git stash push -- src/p4c.txt src/p9.txt
sh build.sh
cd tests && node vr.js
```

Expected: ONLY the new seam test fails. Restore:

```bash
cd /c/Users/patri/Documents/theater_game
git stash pop
sh build.sh
cd tests && node vr.js
```

Expected: failures 0.

- [ ] **Step 2.8: Update HANDOFF.md**

In `HANDOFF.md`, under the NEXT SESSION section, record: this session's owner bug list was the four build-usability asks; grab (GRAB_WOOD 0.15 surface) and gun-at-seam (SEAM_TOUCH 0.05, SEAM_REACH 0.45) shipped; the snap rebuild (§3) and work table (§5, RULING K) are SPECCED AND DEFERRED in `docs/superpowers/specs/2026-08-07-build-usability-design.md` — build them from that spec when the owner asks. Add to the headset step-zero list: does the surface grab feel right at 0.15; does the seam label read; is 0.45 reach forgiving enough. Keep the existing text's voice; do not delete standing sections.

- [ ] **Step 2.9: Commit**

```bash
cd /c/Users/patri/Documents/theater_game
git add src/p4c.txt src/p9.txt tests/vr.js the-house.html HANDOFF.md
cat > ../msg.txt <<'EOF'
The nail gun works on a seam: touching pieces nail where you point

The first headset run put two studs together on the ground and pointed
the gun at them — the gun only knew how to confirm a ghost offer on a
HELD piece, so it refused.  seamSeek (p4c) finds the nearest wood-wood
contact under the muzzle (flush test through |R|.h, SEAM_TOUCH 0.05,
SEAM_REACH 0.45); vrToolFire fires addNail into it when no offer stands;
a gun in hand labels the seam it can reach.  A second shot into the same
seam goes rigid — RULING G, now reachable from the floor.  Held-offer
flow untouched and still takes precedence.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
git commit -F ../msg.txt && rm ../msg.txt
```

- [ ] **Step 2.10: WAIT for PR 1 to merge, then rebase, retest, push, open PR 2**

Do NOT push or open PR 2 before PR 1 is merged (never stack). Once merged:

```bash
cd /c/Users/patri/Documents/theater_game
git fetch origin
git rebase --onto origin/main build-grab build-nailgun
sh build.sh
cd tests && npm test
```

Expected: clean rebase (PR 2 touches p4c/p9 regions PR 1 does not, except the shared vr.js anchor which rebases cleanly because PR 1's test is now in main), 15/15. Then:

```bash
cd /c/Users/patri/Documents/theater_game
git push -u origin build-nailgun
cat > ../pr-body.json <<'EOF'
{"title": "The nail gun works on a seam: touching pieces nail where you point",
 "head": "build-nailgun", "base": "main",
 "body": "Second of the two owner-scoped build-usability fixes (spec: docs/superpowers/specs/2026-08-07-build-usability-design.md §4). The first headset run laid two studs together on the ground and pointed the gun at them; the gun only knew how to confirm a ghost offer on a held piece. Now: seamSeek (p4c) finds the nearest touching wood-wood contact under the muzzle (SEAM_TOUCH 0.05, SEAM_REACH 0.45); the trigger fires addNail into it when no offer stands; a gun in hand labels the reachable seam before the trigger; a second shot into the same seam makes the joint rigid (RULING G from the floor). Held-offer flow untouched and takes precedence. New vr.js test (refused apart, refused from a metre up, nailed at the seam, stiffened by the second shot, label check) verified to FAIL against the pre-change build. 15/15 suites.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)"}
EOF
TOKEN=$(printf 'protocol=https\nhost=github.com\n' | git credential fill | grep '^password=' | cut -d= -f2-)
curl -s -X POST -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/Jackscreations21/gms-theater-game/pulls \
  -d @../pr-body.json | grep '"html_url"' | head -1
rm ../pr-body.json
```

Expected: PR 2's `html_url` printed. After the owner merges: verify `main` rebuilds byte-identical (`git checkout main && git pull && sh build.sh && git status --short` → clean), 15/15 on `main`, delete both work branches local and remote.

---

## Self-review notes (already applied)

- Spec coverage: §2 → Task 1; §4 → Task 2 (seam seek, precedence order, label, wood-to-wood only, states loose/fixed only — seated/slotted excluded because `asmAdopt` does not unhook saw-station bookkeeping). §3 and §5 deferred by the owner — deliberately absent.
- The reinforcement behavior (same-assembly pair → second nail → rigid) is DELIBERATE and tested, not an accident of `addNail`.
- Temps: `seamSeek` mints its own (`_sm1/_sm2/_sm3/_smC`) and only borrows p4c's `_av/_av2/_av3/_sq/_aq2` within a single call — the `vrTapeLine` aliasing lesson.
- `vrGunLabel` only SETS a label; it never clears one, so it cannot fight `vrHoverWorld`/`vrUpdateHold`, which run earlier in the same frame.
