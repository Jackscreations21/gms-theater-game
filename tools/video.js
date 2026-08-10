/* video.js — what can we actually measure off a video of a real show?
   Shells out to ffmpeg and prints a picture: is the camera locked off or is
   this an edit, where the blackouts are, how long the fades take, and how the
   acts break. Not pass/fail: a measurement, and an honest one — it separates
   what it MEASURED from what it GUESSED.

   No game code, no jsdom, no three — this one only needs ffmpeg on PATH.
       node video.js <path-to-video> [--skip=33] [--fresh]
   Extracted numbers are cached in the OS temp dir. Nothing from the video is
   ever written into the repo: no frames, no clips, no audio (see the IP line
   in docs/superpowers — derived numbers and code only).
   See tools/README.md for how to run the others. */
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const SRC = args.find(a => !a.startsWith('--'));
const SKIP = +((args.find(a => a.startsWith('--skip=')) || '--skip=0').split('=')[1]);
const FRESH = args.includes('--fresh');
if (!SRC) { console.log('usage: node video.js <video> [--skip=SECONDS] [--fresh]'); process.exit(1); }
if (!fs.existsSync(SRC)) { console.log('no such file: ' + SRC); process.exit(1); }

/* ffmpeg is not on a fresh shell's PATH on this machine — same quirk as node */
const WINGET = path.join(os.homedir(), 'AppData/Local/Microsoft/WinGet/Packages');
const find = exe => {
  if (spawnSync(exe, ['-version']).status === 0) return exe;
  try {
    for (const d of fs.readdirSync(WINGET)) {
      if (!/ffmpeg/i.test(d)) continue;
      for (const b of fs.readdirSync(path.join(WINGET, d))) {
        const p = path.join(WINGET, d, b, 'bin', exe + '.exe');
        if (fs.existsSync(p)) return p;
      }
    }
  } catch (e) { /* no winget dir: fall through */ }
  return null;
};
const FFMPEG = find('ffmpeg'), FFPROBE = find('ffprobe');
if (!FFMPEG) { console.log('ffmpeg not found. winget install Gyan.FFmpeg, then a FRESH shell.'); process.exit(1); }

const run = (bin, a) => spawnSync(bin, a, { encoding: 'utf8', maxBuffer: 1 << 28 });
const st = fs.statSync(SRC);
const CACHE = path.join(os.tmpdir(), 'video-probe-' + path.basename(SRC).replace(/\W/g, '_') + '-' + st.size);
if (FRESH && fs.existsSync(CACHE)) fs.rmSync(CACHE, { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });
const cached = (name, produce) => {
  const p = path.join(CACHE, name);
  if (!fs.existsSync(p) || fs.statSync(p).size === 0) { process.stderr.write('  measuring ' + name + ' ...\n'); produce(p); }
  return p;
};

/* ---------- 0. what are we working with ---------- */
console.log('=== the file ===');
console.log('  ' + SRC + '   ' + (st.size / 1048576).toFixed(0) + ' MB');
let DUR = 0;
if (FFPROBE) {
  const o = run(FFPROBE, ['-v', 'error', '-show_entries',
    'stream=codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate',
    '-show_entries', 'format=duration,bit_rate', '-of', 'default=noprint_wrappers=1', SRC]).stdout || '';
  const g = k => (o.match(new RegExp('^' + k + '=(.+)$', 'm')) || [])[1];
  DUR = +g('duration') || 0;
  const r = g('r_frame_rate'), a = g('avg_frame_rate');
  const rate = x => { const p = (x || '0/1').split('/'); return +p[0] / +p[1]; };
  console.log('  ' + g('codec_name') + ' ' + g('width') + 'x' + g('height') +
              '   ' + (DUR / 60).toFixed(1) + ' min   ' + Math.round(+g('bit_rate') / 1000) + ' kbps total');
  console.log('  frame rate: r=' + rate(r).toFixed(3) + ' avg=' + rate(a).toFixed(3) +
              (Math.abs(rate(r) - rate(a)) < 0.01
                ? '  -> CFR, timestamps are trustworthy'
                : '  -> *** VFR: every timestamp below carries slop ***'));
  const perPix = +g('bit_rate') / (+g('width') * +g('height'));
  if (perPix < 2) console.log('  *** low bitrate for this frame size — check the blackout floor below ***');
}
if (SKIP) console.log('  ignoring the first ' + SKIP + 's as instructed');

/* ---------- 1. the four measurements ---------- */
const FPS = 5, W = 16, H = 9, CELLS = W * H, FSZ = CELLS * 3;
const gridPath = cached('grid.raw', p => run(FFMPEG, ['-hide_banner', '-v', 'error', '-y', '-i', SRC,
  '-vf', 'fps=' + FPS + ',scale=' + W + ':' + H + ':flags=area,format=yuv444p', '-an', '-f', 'rawvideo', p]));
const text = (name, a, pick) => cached(name, p => {
  const r = run(FFMPEG, ['-hide_banner', '-i', SRC].concat(a).concat(['-f', 'null', '-']));
  fs.writeFileSync(p, ((r.stderr || '') + (r.stdout || '')).split('\n').filter(pick).join('\n'));
});
const scdetPath = text('scdet.txt', ['-vf', 'scdet=threshold=0', '-an'], L => L.includes('scd.time'));
const blackPath = text('black.txt', ['-vf', 'blackdetect=d=0.04:pix_th=0.12', '-an'], L => L.includes('black_start'));
const loudPath = text('loud.txt', ['-vn', '-af',
  'asetnsamples=n=44100,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-'],
  L => L.includes('pts_time') || L.includes('RMS_level'));

const raw = fs.readFileSync(gridPath);
const NF = Math.floor(raw.length / FSZ), t0 = Math.round(SKIP * FPS);
if (NF - t0 < 100) { console.log('too little video after --skip to say anything'); process.exit(1); }
const bright = new Float64Array(NF);
for (let f = 0; f < NF; f++) { let s = 0; for (let i = 0; i < CELLS; i++) s += raw[f * FSZ + i]; bright[f] = s / CELLS; }
const vec = f => { const v = new Float64Array(CELLS); for (let i = 0; i < CELLS; i++) v[i] = raw[f * FSZ + i]; return v; };
const fmt = t => Math.floor(t / 60) + ':' + (t % 60).toFixed(0).padStart(2, '0');
const pctl = (arr, p) => arr[Math.floor(p / 100 * (arr.length - 1))];

const cuts = [];
for (const L of fs.readFileSync(scdetPath, 'utf8').split('\n')) {
  const m = L.match(/score: *([0-9.]+), lavfi\.scd\.time: *([0-9.]+)/);
  if (m) cuts.push({ t: +m[2], s: +m[1] });
}
const sc = cuts.filter(c => c.t >= SKIP);
const black = fs.readFileSync(blackPath, 'utf8').split('\n').map(L => {
  const m = L.match(/black_start:([0-9.]+) black_end:([0-9.]+) black_duration:([0-9.]+)/);
  return m ? { s: +m[1], e: +m[2], d: +m[3] } : null;
}).filter(x => x && x.s >= SKIP);
const loud = [];
{
  const L = fs.readFileSync(loudPath, 'utf8').split('\n');
  for (let i = 0; i < L.length; i++) {
    const t = (L[i].match(/pts_time:([0-9.]+)/) || [])[1];
    const v = (L[i + 1] || '').match(/RMS_level=(-?[0-9.]+|-?inf)/);
    if (t !== undefined && v) loud.push({ t: +t, db: v[1].includes('inf') ? -90 : +v[1] });
  }
}
const SHOW = NF / FPS - SKIP;

/* ---------- 2. is the camera locked off? everything downstream depends on it ---------- */
const corr = (a, b) => {
  let ma = 0, mb = 0; for (let i = 0; i < CELLS; i++) { ma += a[i]; mb += b[i]; } ma /= CELLS; mb /= CELLS;
  if (ma < 3 || mb < 3) return null;                              // both too dark to compare layout
  let n = 0, da = 0, db = 0;
  for (let i = 0; i < CELLS; i++) { const x = a[i] / ma - 1, y = b[i] / mb - 1; n += x * y; da += x * x; db += y * y; }
  return (da < 1e-9 || db < 1e-9) ? null : n / Math.sqrt(da * db);
};
console.log('\n=== is the camera locked off? (normalised layout, frame vs frame+5s) ===');
console.log('  a locked-off wide shot scores ~0.95+. Re-framing does not.');
const rs = [];
for (let f = t0; f < NF - 5 * FPS; f += 5) { const r = corr(vec(f), vec(f + 5 * FPS)); if (r !== null) rs.push(r); }
rs.sort((a, b) => a - b);
const share = rs.filter(r => r > 0.9).length / rs.length * 100;
console.log('  median ' + pctl(rs, 50).toFixed(3) + '   share above 0.9: ' + share.toFixed(1) + '%');

/* cuts: isolated single-frame spikes. A fade is gradual and scores near zero here. */
const CUT_T = 10, cutList = [];
for (let i = 1; i < sc.length - 1; i++) {
  if (sc[i].s <= CUT_T || sc[i].s < sc[i - 1].s || sc[i].s < sc[i + 1].s) continue;
  if (cutList.length && sc[i].t - cutList[cutList.length - 1] < 0.4) continue;
  cutList.push(sc[i].t);
}
const gaps = []; for (let i = 1; i < cutList.length; i++) gaps.push(cutList[i] - cutList[i - 1]);
gaps.sort((a, b) => a - b);
const LOCKED = share > 80 && cutList.length / (SHOW / 60) < 0.3;
console.log('  hard cuts (isolated spikes > ' + CUT_T + '): ' + cutList.length + '   ' +
            (cutList.length / (SHOW / 60)).toFixed(1) + '/min' +
            (gaps.length ? '   median shot ' + pctl(gaps, 50).toFixed(1) + 's' : ''));
console.log('  VERDICT: ' + (LOCKED
  ? 'looks locked off. Region-by-region measurement is VALID.'
  : 'this is an EDIT. Frame regions do NOT map to stage areas, so\n' +
    '           per-area levels are NOT measurable from this file. Whole-frame\n' +
    '           brightness is also contaminated by framing (a cut to a close-up\n' +
    '           brightens the frame with no lighting change at all).'));

/* ---------- 3. blackouts — the one thing an edit cannot fake away ---------- */
console.log('\n=== blackouts (whole frame near-black) ===');
const floor = Math.min.apply(null, Array.from(bright.slice(t0)));
console.log('  darkest whole frame: Y=' + floor.toFixed(1) + ' (16 is video black)' +
            (floor < 22 ? '  -> real black survives the compression' : '  -> *** blacks are crushed/lifted ***'));
[0.2, 0.5, 1.0, 2.0, 4.0].forEach(d =>
  console.log('  >= ' + d.toFixed(1) + 's: ' + String(black.filter(b => b.d >= d).length).padStart(4) +
              (d === 0.5 ? '   <- below this, most are cut transitions, not cues' : '')));

/* auto-exposure: through a long blackout, does the camera lift the image? */
const longest = black.slice().sort((a, b) => b.d - a.d).slice(0, 4);
if (longest.length && longest[0].d > 3) {
  console.log('\n=== was the camera fighting the fades? (drift through the long blackouts) ===');
  longest.forEach(b => {
    const fa = Math.round(b.s * FPS), fb = Math.min(NF - 1, Math.round(b.e * FPS));
    if (fb - fa < 6) return;
    const avg = (x, y) => { let s = 0; for (let f = x; f < y; f++) s += bright[f]; return s / (y - x); };
    const d = avg(fb - 5, fb) - avg(fa, fa + 5);
    console.log('  ' + fmt(b.s).padStart(7) + '  ' + b.d.toFixed(1) + 's black   drift ' +
                (d >= 0 ? '+' : '') + d.toFixed(1) + ' Y' + (Math.abs(d) > 8 ? '   *** auto-exposure ***' : ''));
  });
  console.log('  under about +8 Y means fixed exposure: fade SLOPES can be trusted.');
}

/* ---------- 4. fades — only inside a cut-free window is a slope a fade ---------- */
const GUARD = 0.6, wins = [];
let prev = SKIP;
for (const c of cutList) { if (c - prev > 2 * GUARD + 1) wins.push([prev + GUARD, c - GUARD]); prev = c; }
if (NF / FPS - prev > 2 * GUARD + 1) wins.push([prev + GUARD, NF / FPS - GUARD]);
const sm = new Float64Array(NF);
for (let f = 0; f < NF; f++) {
  let s = 0, c = 0;
  for (let j = Math.max(0, f - 1); j <= Math.min(NF - 1, f + 1); j++) { s += bright[j]; c++; }
  sm[f] = s / c;
}
const fades = [];
for (const [a, b] of wins) {
  const fa = Math.ceil(a * FPS), fb = Math.floor(b * FPS);
  if (fb - fa < 5) continue;
  let i = fa;
  while (i < fb - 1) {
    const dir = Math.sign(sm[i + 1] - sm[i]);
    if (dir === 0) { i++; continue; }
    let j = i + 1, bad = 0;
    while (j < fb) {
      const d = sm[j + 1] - sm[j];
      if (Math.sign(d) === dir || Math.abs(d) < 0.4) { bad = 0; j++; }
      else if (++bad <= 1) j++; else break;
    }
    const amp = Math.abs(sm[j] - sm[i]), secs = (j - i) / FPS;
    if (amp >= 10 && secs >= 0.8) fades.push({ t: i / FPS, d: secs, from: sm[i], to: sm[j], amp, win: b - a });
    i = Math.max(j, i + 1);
  }
}
const clean = f => f.d <= 8 && f.win >= 4;
const A = black.filter(b => b.d >= 1).length;
const B = fades.filter(f => f.amp >= 25 && clean(f)).length;
const C = fades.filter(f => f.amp >= 15 && f.amp < 25 && clean(f)).length;
console.log('\n=== how many cues is that? by how much I would trust each ===');
console.log('  cut-free ground: ' + wins.length + ' windows, ' +
            (wins.filter(w => w[1] - w[0] >= 10).length) + ' of them >=10s');
console.log('  A  blackout >=1s                 ' + String(A).padStart(4) + '  near-certain: physically dark');
console.log('  B  fade, swing >=25Y, <=8s       ' + String(B).padStart(4) + '  strong: real level change, duration measured');
console.log('  C  fade, swing 15-25Y, <=8s      ' + String(C).padStart(4) + '  plausible: cue, or a performer crossing frame');
console.log('  D  the rest of ' + fades.length + ' ramps           ' +
            String(fades.length - B - C).padStart(4) + '  not defensible as cues');
console.log('  -> defensible A+B: ' + (A + B) + '    with C: ' + (A + B + C) +
            '    (raw scene spikes, for contrast: ' + cutList.length + ')');
if (fades.length) {
  const fd = fades.filter(clean).map(f => f.d).sort((a, b) => a - b);
  console.log('  measured fade times: median ' + pctl(fd, 50).toFixed(1) + 's  p90 ' +
              pctl(fd, 90).toFixed(1) + 's   <- these are real numbers, not guesses');
}

/* ---------- 5. act structure ---------- */
console.log('\n=== act structure ===');
const houseUp = [];
{
  let cur = null;
  for (let f = t0; f < NF; f++) {
    if (bright[f] > 95) { if (!cur) cur = [f, f]; else cur[1] = f; }
    else { if (cur && cur[1] - cur[0] > 5 * FPS) houseUp.push(cur); cur = null; }
  }
  if (cur && cur[1] - cur[0] > 5 * FPS) houseUp.push(cur);
  houseUp.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
}
const longBright = houseUp.length ? (houseUp[0][1] - houseUp[0][0]) / FPS : 0;
console.log('  longest sustained-bright stretch: ' + longBright.toFixed(0) + 's' +
            (longBright > 240 ? ' at ' + fmt(houseUp[0][0] / FPS) + '  <- house lights: an interval is IN the file'
                              : '  -> no house-lights interval in the file'));
const biggest = black.slice().sort((a, b) => b.d - a.d)[0];
if (biggest) console.log('  longest blackout: ' + fmt(biggest.s) + ' for ' + biggest.d.toFixed(1) +
                         's  <- strongest act-break candidate');
/* a curtain call is lights bumping up and down every few seconds, at the end */
const tail = 0.03 * SHOW;
const bows = black.filter(b => b.s > SKIP + SHOW - tail && b.d >= 0.5).length +
             fades.filter(f => f.t > SKIP + SHOW - tail && f.amp >= 20).length;
console.log('  events in the last ' + (tail / 60).toFixed(1) + ' min: ' + bows +
            (bows > 20 ? '   <- a curtain call: lights bumping for each bow' : ''));

/* ---------- 6. the timeline ---------- */
console.log('\n=== the show, one row per 5 min ===');
console.log('         brightness 16..140    loudness -35..-8   cuts  blackouts>=1s');
const BIN = 300, bar = (v, lo, hi, n) => {
  const k = Math.max(0, Math.min(n, Math.round((v - lo) / (hi - lo) * n)));
  return '#'.repeat(k) + ' '.repeat(n - k);
};
for (let b = 0; b * BIN < NF / FPS; b++) {
  const fa = Math.max(t0, b * BIN * FPS), fb = Math.min(NF, (b + 1) * BIN * FPS);
  if (fb <= fa) continue;
  let s = 0; for (let f = fa; f < fb; f++) s += bright[f];
  const seg = loud.filter(x => x.t >= b * BIN && x.t < (b + 1) * BIN);
  const ml = seg.length ? seg.reduce((a, x) => a + x.db, 0) / seg.length : -90;
  const nk = black.filter(x => x.s >= b * BIN && x.s < (b + 1) * BIN && x.d >= 1).length;
  console.log('  ' + fmt(b * BIN).padStart(6) + ' |' + bar(s / (fb - fa), 16, 140, 20) + '|' +
              bar(ml, -35, -8, 16) + '|' + String(cutList.filter(t => t >= b * BIN && t < (b + 1) * BIN).length).padStart(4) +
              '  ' + '*'.repeat(nk));
}
console.log('\n  Read the caveats: an edit contaminates whole-frame brightness, and a');
console.log('  brightness measurement that sweeps in the auditorium is the same bug as');
console.log('  the one in TRAPS.md. Times and fade durations are measured; per-channel');
console.log('  levels and focus are always an interpretation onto our own 25-channel rig.');
