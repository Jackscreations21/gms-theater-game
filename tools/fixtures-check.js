#!/usr/bin/env node
/* Checks every game-ready fixture GLB without three.js: the node tree the game relies on,
   the triangle and material budgets, and that the hang point is the origin.

     node tools/fixtures-check.js [dir]      (default assets/fixtures)
     node tools/fixtures-check.js assets/fixtures/lod --lod   (the far-level copies: 800 tris a unit, 1,000 for the big four)

   Exits non-zero on any failure, so it can run as a suite case once the files are committed.
   A GLB is a 12-byte header, a JSON chunk and a BIN chunk; the JSON carries nodes, meshes,
   accessors and materials, which is all this needs - it never touches the vertex data. */
const fs = require('fs'), path = require('path');
const ARGS = process.argv.slice(2), LOD = ARGS.includes('--lod');
const DIR = ARGS.filter(a => a !== '--lod')[0] || path.join(__dirname, '..', 'assets', 'fixtures');
const BUDGET = {tris: LOD ? 800 : 12000, mats: 8};
const LOD_BIG = {'mac-viper': 1000, 'vl3500': 1000, 'glp-x4': 1000, 'lycian': 1000};   // tools/blender/fixtures_lod.py
const MOVERS = ['mac-viper', 'vl3500', 'glp-x4', 's4-revolution'];
let fails = 0;
const fail = (f, m) => { fails++; console.log(`FAIL ${f}: ${m}`); };

for (const f of fs.readdirSync(DIR).filter(n => n.endsWith('.glb')).sort()) {
  const buf = fs.readFileSync(path.join(DIR, f));
  if (buf.toString('ascii', 0, 4) !== 'glTF') { fail(f, 'not a GLB'); continue; }
  const jsonLen = buf.readUInt32LE(12);
  const g = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
  const key = f.replace('.glb', '');
  const byName = Object.fromEntries((g.nodes || []).map((n, i) => [n.name, {n, i}]));
  const childOf = (c, p) => byName[p] && (byName[p].n.children || []).includes(byName[c].i);
  // the tree: base? > yoke? > head > lens, hung from a scene root node
  if (!byName.head) fail(f, 'no head node');
  if (!byName.lens) fail(f, 'no lens node');
  else if (!childOf('lens', 'head')) fail(f, 'lens is not a child of head');
  if (byName.yoke && !childOf('head', 'yoke')) fail(f, 'head is not a child of yoke');
  if (byName.base && byName.yoke && !childOf('yoke', 'base')) fail(f, 'yoke is not a child of base');
  if (byName.base && !byName.yoke && !childOf('head', 'base')) fail(f, 'head is not a child of base');
  if (MOVERS.includes(key) && !(byName.base && byName.yoke)) fail(f, 'a mover needs base, yoke and head');
  // the hang point (or floor point) is the scene origin: the geometry hangs below y = 0, or stands on it.
  // A single-part fixture's head is pivoted at its own centre, so only the bounds can say where the hang point is.
  const FLOOR = ['colorblast', 'colorblaze-48', 'colorblaze-72', 'lycian', 'hazer', 'mini-10'];
  const world = {}; const walk = (i, off) => { const n = g.nodes[i]; const t = n.translation || [0, 0, 0]; const w = off.map((v, k) => v + t[k]); world[i] = w; for (const c of n.children || []) walk(c, w); };
  for (const s of g.scenes || []) for (const r of s.nodes) walk(r, [0, 0, 0]);
  let ymin = 1e9, ymax = -1e9;
  (g.nodes || []).forEach((n, i) => { if (n.mesh === undefined || n.name === 'lens') return;
    for (const p of g.meshes[n.mesh].primitives) { const a = g.accessors[p.attributes.POSITION]; ymin = Math.min(ymin, a.min[1] + world[i][1]); ymax = Math.max(ymax, a.max[1] + world[i][1]); } });
  if (FLOOR.includes(key)) { if (Math.abs(ymin) > 0.01) fail(f, `floor unit does not stand on y=0 (ymin ${ymin.toFixed(3)})`); }
  else if (Math.abs(ymax) > 0.01) fail(f, `hung unit does not hang from y=0 (ymax ${ymax.toFixed(3)})`);
  if (!FLOOR.includes(key) && ymin > -0.02) fail(f, 'hung unit has no body below the hang point');
  // budgets
  let tris = 0;
  for (const m of g.meshes || []) for (const p of m.primitives) {
    const acc = g.accessors[p.indices !== undefined ? p.indices : p.attributes.POSITION];
    tris += acc.count / 3;
  }
  const mats = (g.materials || []).length;
  const tb = LOD && LOD_BIG[key] || BUDGET.tris;
  if (tris > tb) fail(f, `${tris} triangles, budget ${tb}`);
  if (mats > BUDGET.mats) fail(f, `${mats} materials, budget ${BUDGET.mats}`);
  if (g.cameras || g.extensions && g.extensions.KHR_lights_punctual) fail(f, 'carries a camera or light');
  const parts = ['base', 'yoke', 'head', 'lens'].filter(k => byName[k]);
  console.log(`${f.padEnd(20)} ${String(Math.round(tris)).padStart(6)} tris  ${String(mats).padStart(2)} mats  ${parts.join(' > ')}`);
}
console.log(fails ? `--- failures: ${fails} ---` : '--- failures: 0 ---');
process.exit(fails ? 1 : 0);
