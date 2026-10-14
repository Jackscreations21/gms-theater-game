// GD (the video capture's dance timing): the move library's joint curves for tools/vision/motion.py.
//
// The moves are JavaScript in midtown.html (DANCE, RULING FV): pure functions of the beat writing a pose vector of joint
// rotations onto the jointed mannequin (FS). Python cannot run them, so this runs them where they live: open midtown.html
// (served, e.g. `python -m http.server` from the repo root), wait for the actors, and evaluate this file in the console
// (or an agent's javascript tool). It resolves to the JSON text of tools/vision/motion/moves.json; save it there with
// LF line ends. Re-make it whenever a move changes (motion.py warns when midtown.html's move code has changed since).
//
// What it writes, per move: { counts, once, reverse?, body?, spb, pts }. pts is one entry per sample, `spb` samples per
// beat, over ONE loop (a looping move) or the move played once (a one-shot), each sample the 3D points of her body in HER
// frame (x her left, y up from the floor, z forward), metres, 2 decimals, in this order:
//   head (the head part's centre), shoulder L, R, elbow L, R, wrist L, R, hip L, R, knee L, R, ankle L, R
// plus `top` (the head's top, y) per sample. The body's own offset and turn (a spin, a step) are in the points.
// The sampling is midtown.html's danceEval with no blend, no mirror, speed 1, from beat 0. `freeze` (holds whatever
// she was doing) is left out; moves that pose the walk (slow-walk, rewind, bullet, crawl-back) are posed on the first
// actor's body with no travel speed, as on the spot.
(async () => {
  const ready = () => { const M = window.MIDTOWN; return M && M.actors && M.actors.rig && M.actors.rig.parts && M.actors.state.actors.length; };
  for (let i = 0; i < 1200 && !ready(); i++) await new Promise(r => setTimeout(r, 50));   // the page's boot, not game time
  if (!ready()) throw new Error('midtown.html has no actors yet (is the blocking loaded?)');
  const M = window.MIDTOWN, A = M.actors, RIG = A.rig, DANCE = A.moves, THREE = M.THREE, ACT = A.state;
  if (!RIG.parts) throw new Error('the rig is not loaded (?rig=0, or assets/mannequin-woman-rig.glb missing)');
  const NAMES = RIG.parts.map(p => p.name), DV_N = NAMES.length * 3 + 7, DV_PEL = NAMES.length * 3, DV_BODY = DV_PEL + 3, DV_YAW = DV_BODY + 3;
  const DJ = Object.fromEntries(NAMES.map((n, i) => [n, i * 3]));
  // midtown.html's danceNeutral (dvLeg / dvLegAbs / dvArm / rigIK, copied)
  function rigIK(a, b, dz, dy, bend) {
    const D = Math.min(Math.max(Math.hypot(dz, dy), Math.abs(a - b) + 1e-4), a + b - 1e-4), phi = Math.atan2(dz, -dy);
    const c = x => Math.min(1, Math.max(-1, x));
    const beta = Math.acos(c((a * a + D * D - b * b) / (2 * a * D))), gamma = Math.acos(c((a * a + b * b - D * D) / (2 * a * b)));
    const t1 = phi + bend * beta;
    return [t1, t1 - bend * (Math.PI - gamma)];
  }
  const neutral = new Float64Array(DV_N);
  for (const s of ['L', 'R']) {
    const J = RIG.J, th = RIG.len['thigh_' + s], sh = RIG.len['shin_' + s], hip = J['thigh_' + s], ank = J['foot_' + s];
    const [t1, t2] = rigIK(th.len, sh.len, ank.z - hip.z, ank.y - hip.y, 1), r1 = t1 - th.rest, r2 = (t2 - sh.rest) - r1;
    neutral[DJ['thigh_' + s]] = -r1; neutral[DJ['shin_' + s]] = -r2; neutral[DJ['foot_' + s]] = r1 + r2;
    neutral[DJ['forearm_' + s]] = -0.12;
  }
  // a bare skeleton of the parts (no meshes): the same parents and joint places as rigBody builds
  const B = new THREE.Group(), P = {};
  for (const d of RIG.parts) { const o = new THREE.Object3D(); o.name = d.name; o.position.copy(d.pos); P[d.name] = o; (d.parent ? P[d.parent] : B).add(o); }
  const rest = RIG.parts[0].pos, head = RIG.parts.find(p => p.name === 'head'); head.geo.computeBoundingSphere();
  const hc = head.geo.boundingSphere.center.clone(), hr = head.geo.boundingSphere.radius;
  function write(V) {                                         // midtown.html's rigWrite
    NAMES.forEach((n, i) => P[n].rotation.set(V[i * 3], V[i * 3 + 1], V[i * 3 + 2]));
    P.pelvis.position.set(rest.x + V[DV_PEL], rest.y + V[DV_PEL + 1], rest.z + V[DV_PEL + 2]);
    B.position.set(V[DV_BODY], V[DV_BODY + 1], V[DV_BODY + 2]); B.rotation.set(0, V[DV_YAW], 0);
    B.updateMatrixWorld(true);
  }
  const at = (n, local) => (local ? local.clone() : new THREE.Vector3()).applyMatrix4(P[n].matrixWorld);
  const r2 = v => Math.round(v * 100) / 100;
  const JOINTS = [['head', hc], ['upperarm_L'], ['upperarm_R'], ['forearm_L'], ['forearm_R'], ['hand_L'], ['hand_R'],
    ['thigh_L'], ['thigh_R'], ['shin_L'], ['shin_R'], ['foot_L'], ['foot_R']];
  const actor = ACT.actors[0], g = actor.obj, wasVisible = g.visible;
  const p0 = { speed: 0, dist: 0, T: 0, turn: 0, turnK: 1, rise: 0, carry: null, dance: null };
  const SPB = 4, out = {};
  g.visible = true;
  try {
    for (const [name, def] of Object.entries(DANCE)) {
      if (name === 'freeze') continue;
      const counts = def.counts, sign = def.reverse ? -1 : 1, pts = [], top = [];
      for (let j = 0; j <= counts * SPB; j++) {
        const ks = j / SPB, V = new Float64Array(neutral);
        const u = def.once ? Math.min(1, ks / counts) : (ks / counts) % 1;
        def.f(V, sign * ks, def.once ? u : (sign < 0 ? (1 - u) % 1 : u), { a: actor, p: p0, g, seed: 0, at0: 0, reverse: sign < 0 });
        write(V);
        pts.push(JOINTS.map(([n, l]) => { const v = at(n, l); return [r2(v.x), r2(v.y), r2(v.z)]; }));
        top.push(r2(at('head', hc).y + hr));
      }
      if (!def.once) { pts.pop(); top.pop(); }                // a loop: [0, counts), the next loop starts where it began
      out[name] = Object.assign({ counts, once: !!def.once }, def.reverse ? { reverse: true } : {}, def.body ? { body: true } : {}, { spb: SPB, top, pts });
    }
  } finally { g.visible = wasVisible; }
  // the move code's fingerprint: sha256 of midtown.html from `const DV_N = ` to `function danceBaseAt(` (motion.py checks it)
  const src = await (await fetch(location.pathname, { cache: 'no-store' })).text();
  const code = src.slice(src.indexOf('const DV_N = '), src.indexOf('function danceBaseAt('));
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code)))].map(b => b.toString(16).padStart(2, '0')).join('');
  const lines = Object.entries(out).map(([k, v]) => ' ' + JSON.stringify(k) + ': ' + JSON.stringify(v));
  return '{\n "format": "hamilton-vision-moves 1",\n "by": "tools/vision/motion/moves2d.js run in midtown.html",\n "source": "' + hash.slice(0, 16) + '",\n "points": ["head", "shoulderL", "shoulderR", "elbowL", "elbowR", "wristL", "wristR", "hipL", "hipR", "kneeL", "kneeR", "ankleL", "ankleR"],\n "moves": {\n' + lines.map(l => ' ' + l).join(',\n') + '\n }\n}\n';
})();
