#!/usr/bin/env python
"""Video blocking capture - stages 1 and 2 (docs/superpowers/specs/2026-10-13-video-blocking-capture-design.md).

    python tools/vision/run.py index                       # scan video/, (re)write video/INDEX.json
    python tools/vision/run.py frames <clip> [--fps 5]     # stage 1: frames, cuts, clip time -> album time
    python tools/vision/run.py bodies <clip> [--model M]   # stage 2: pose + tracklets on every kept frame
    python tools/vision/run.py check  <clip>               # what the cache says about a clip

<clip> is a file in video/ by name, stem, or path.  Everything this writes goes to tools/vision/cache/<clip>/
(git-ignored, regenerable): frames/NNNNNN.jpg, frames.json, bodies.json.  Stage 1 needs numpy, cv2 and an ffmpeg
(on the PATH or imageio-ffmpeg's); stage 2 needs ultralytics (torch).  Run it from the venv:
    tools/vision/.venv/Scripts/python tools/vision/run.py ...

Time (RULING FZ): the clip's audio is decoded to the page's own 20 ms loudness envelope and cross-correlated,
piecewise, against assets/hamilton-soundtrack-env.u8 over the track(s) the clip covers; the anchors (clipTime,
albumFileTime, corr) every ~10 s are in frames.json, and every kept frame gets (track, at).  A clip with no usable
music: put anchors by hand in cache/<clip>/anchors.json as [[clipTime, "1-03:12.5"], ...] and re-run frames.
Cuts: frames.json shots come from a frame-difference detector; cache/<clip>/cuts.json {"add":[i], "remove":[i]}
edits them (frame indices); re-run frames --no-decode --keep-align to apply without decoding or aligning again.
"""
import sys, os, re, json, hashlib, subprocess, shutil, argparse, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
VIDEO = os.path.join(ROOT, 'video')
CACHE = os.path.join(HERE, 'cache')
INDEX = os.path.join(VIDEO, 'INDEX.json')
SHOW = os.path.join(ROOT, 'assets', 'hamilton-show.json')
ENV = os.path.join(ROOT, 'assets', 'hamilton-soundtrack-env.u8')
ENV_BIN = 0.020          # the page's envelope: one byte per 20 ms, 255*(log10(rms)+4)/4
VIDEO_EXT = ('.mp4', '.mkv', '.webm', '.mov', '.m4v')
TRACK_RE = re.compile(r'^([12]-\d\d)(?:\+([12]-\d\d))*')


def log(*a): print(*a, file=sys.stderr, flush=True)


def die(msg): log('error:', msg); sys.exit(1)


# ---------------------------------------------------------------- the album

def tracks():
    with open(SHOW, encoding='utf-8') as f: return json.load(f)['tracks']


def file_time_to_track(ft, ts):
    """album file seconds -> (track id, at) or (None, None) between/outside tracks."""
    for t in ts:
        if t['file'] <= ft < t['file'] + t['len']: return t['id'], round(ft - t['file'], 3)
    return None, None


def parse_album_time(s, ts):
    """'1-03:12.5' or a number (album file seconds) -> album file seconds."""
    if isinstance(s, (int, float)): return float(s)
    m = re.match(r'^([12]-\d\d):([\d.]+)$', s.strip())
    if not m: die('bad album time %r (want "1-03:12.5" or seconds)' % s)
    t = next(t for t in ts if t['id'] == m.group(1))
    return t['file'] + float(m.group(2))


# ---------------------------------------------------------------- tools

def ffmpeg():
    exe = shutil.which('ffmpeg')
    if exe: return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        die('no ffmpeg on the PATH and imageio-ffmpeg is not installed (pip install -r tools/vision/requirements.txt)')


def ffprobe_meta(path):
    """duration, width, height, fps - ffprobe if present, else cv2."""
    exe = shutil.which('ffprobe')
    if exe:
        out = subprocess.run([exe, '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                              'stream=width,height,r_frame_rate:format=duration', '-of', 'json', path],
                             capture_output=True, text=True).stdout
        j = json.loads(out or '{}')
        st = (j.get('streams') or [{}])[0]
        n, d = (st.get('r_frame_rate') or '0/1').split('/')
        fps = float(n) / float(d) if float(d) else 0.0
        return float(j.get('format', {}).get('duration') or 0), st.get('width'), st.get('height'), round(fps, 3)
    import cv2
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    n = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()
    return (n / fps if fps else 0.0), w, h, round(fps, 3)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''): h.update(chunk)
    return h.hexdigest()


def resolve_clip(name):
    """a path, a file name or a stem in video/ -> (abs path, clip key = stem)."""
    cands = [name, os.path.join(VIDEO, name)] + [os.path.join(VIDEO, name + e) for e in VIDEO_EXT]
    for c in cands:
        if os.path.isfile(c): return os.path.abspath(c), os.path.splitext(os.path.basename(c))[0]
    die('no clip %r in %s' % (name, VIDEO))


def load_index():
    if os.path.isfile(INDEX):
        with open(INDEX, encoding='utf-8') as f: return json.load(f)
    return {'note': 'what is in video/ (the files themselves are never committed, RULING FX)', 'files': []}


def clip_tracks(stem):
    """which album tracks a clip covers: INDEX.json first, then the file name's 1-03[+1-04] prefix."""
    for e in load_index().get('files', []):
        if os.path.splitext(e['file'])[0] == stem and e.get('tracks'): return e['tracks']
    tids, how = guess_tracks(stem, tracks())
    if tids:
        if how == 'title': log('clip placed by its title:', stem, '->', tids)
        return tids
    die('clip %s covers which tracks?  name it 1-03-slug.mp4 or set "tracks" in video/INDEX.json' % stem)


# ---------------------------------------------------------------- index

def norm_title(s):
    return re.sub(r'[^a-z0-9 ]+', ' ', s.lower()).split()


STOP = ('the', 'a', 'of', 'to', 'on')
PART_RE = re.compile(r'\bpart\s*(\d+)\b', re.I)


def guess_tracks(stem, ts):
    """the track a file name means: a 1-03 prefix, else the title whose words all appear in the name (the longest
    wins; a title's part before its bracket counts too, so 'Battle of Yorktown' finds 1-20)."""
    m = TRACK_RE.match(stem)
    if m: return re.findall(r'[12]-\d\d', m.group(0)), 'name'
    words = set(norm_title(stem))
    best, score = [], 0
    for t in ts:
        for title in (t['title'], t['title'].split('(')[0]):
            tw = [w for w in norm_title(title) if w not in STOP]
            if tw and all(w in words for w in tw) and len(tw) > score: best, score = [t['id']], len(tw)
    return best, ('title' if best else 'none')


def track_file_name(tids, stem, ext, idx):
    """1-23-non-stop.mp4 from the playlist's name or the track's title, with -p2 for 'Part 2' in the stem."""
    pe = playlist_entry(idx, tids)
    base = os.path.splitext(pe['file'])[0] if pe else '%s-%s' % ('+'.join(tids), '-'.join(norm_title(next(t['title'] for t in tracks() if t['id'] == tids[0]))))
    m = PART_RE.search(stem)
    return base + ('-p%d' % int(m.group(1)) if m else '') + ext.lower()


def playlist_entry(idx, tids):
    """the INDEX.json playlist clip for a track id, if the playlist section knows one."""
    for c in idx.get('playlist', {}).get('clips', []):
        if tids and c['track'] == tids[0]: return c
    return None


def cmd_index(args):
    ts = tracks()
    idx = load_index()
    os.makedirs(VIDEO, exist_ok=True)
    # --import DIR: copy the clips (and any .info.json sidecars) from a download folder into video/; the download
    # folder is left as it was (a .part file, still downloading, is skipped; so is a clip already here)
    if args.import_dir:
        had = {e['file'] for e in idx.get('files', [])} | {e.get('source') for e in idx.get('files', [])}
        by_size = {e.get('size'): e.get('sha256') for e in idx.get('files', [])}
        for f in sorted(os.listdir(args.import_dir)):
            if not f.lower().endswith(VIDEO_EXT) or f in had or os.path.exists(os.path.join(VIDEO, f)): continue
            src = os.path.join(args.import_dir, f)
            if os.path.getsize(src) in by_size and sha256(src) == by_size[os.path.getsize(src)]:
                log('already here (same bytes):', f); continue       # it was imported and renamed before
            shutil.copy2(src, os.path.join(VIDEO, f)); log('copied', f)
            side = os.path.splitext(f)[0] + '.info.json'
            if os.path.isfile(os.path.join(args.import_dir, side)):
                shutil.copy2(os.path.join(args.import_dir, side), os.path.join(VIDEO, side))
    # --rename: a file placed on a track but not named 1-03-slug.ext takes the playlist's name (or 1-03-<its own name>)
    old = {e['file']: e for e in idx.get('files', [])}
    files = sorted(f for f in os.listdir(VIDEO) if f.lower().endswith(VIDEO_EXT))
    renames = []
    for f in files:
        stem, ext = os.path.splitext(f)
        if TRACK_RE.match(stem): continue
        tids, how = (old.get(f, {}).get('tracks') or [], 'index') if old.get(f, {}).get('tracks') else guess_tracks(stem, ts)
        if not tids: continue
        renames.append((f, track_file_name(tids, stem, ext, idx)))
    if renames and not args.rename:
        print('%d file(s) would be renamed (run with --rename):' % len(renames))
        for a, b2 in renames: print('  %s  ->  %s' % (a, b2))
    elif renames:
        for a, b2 in renames:
            if os.path.exists(os.path.join(VIDEO, b2)): log('skip, exists:', b2); continue
            os.rename(os.path.join(VIDEO, a), os.path.join(VIDEO, b2)); log('renamed', a, '->', b2)
            sa, sb = os.path.splitext(a)[0] + '.info.json', os.path.splitext(b2)[0] + '.info.json'
            if os.path.isfile(os.path.join(VIDEO, sa)): os.rename(os.path.join(VIDEO, sa), os.path.join(VIDEO, sb))
            old[b2] = old.pop(a, {}); old[b2]['source'] = a      # the name it was downloaded under: never re-imported
        files = sorted(f for f in os.listdir(VIDEO) if f.lower().endswith(VIDEO_EXT))
    out, unplaced = [], []
    for f in files:
        path = os.path.join(VIDEO, f)
        stem = os.path.splitext(f)[0]
        e = dict(old.get(f, {}))
        e['file'] = f
        size = os.path.getsize(path)
        if e.get('size') != size or not e.get('sha256'):
            log('hashing', f)
            e['sha256'] = sha256(path); e['size'] = size
            dur, w, h, fps = ffprobe_meta(path)
            e.update(duration=round(dur, 2), width=w, height=h, fps=fps)
        side = os.path.join(VIDEO, stem + '.info.json')
        if os.path.isfile(side):
            with open(side, encoding='utf-8') as s: info = json.load(s)
            e.setdefault('url', info.get('webpage_url') or ('https://www.youtube.com/watch?v=' + info.get('id', '')))
            e.setdefault('title', info.get('title', ''))
            e.setdefault('uploader', info.get('uploader') or info.get('channel', ''))
        if not e.get('tracks'):
            e['tracks'], how = guess_tracks(stem, ts)
            if how == 'title': log('placed by title:', f, '->', e['tracks'])
        pe = playlist_entry(idx, e['tracks'])
        if pe:    # the playlist section knows this clip: fill what the file cannot say
            for k in ('url', 'title', 'uploader'):
                if not e.get(k): e[k] = pe[k]
        for k in ('url', 'title', 'uploader'): e.setdefault(k, '')
        if not e['tracks']: unplaced.append(f)
        out.append(e)
    idx['files'] = out
    with open(INDEX, 'w', encoding='utf-8', newline='\n') as f: json.dump(idx, f, indent=1); f.write('\n')
    print('%d file(s) in video/, INDEX.json written' % len(out))
    for e in out:
        print('  %-48s %7.1fs %sx%s %5s fps  %s%s' % (e['file'], e['duration'], e['width'], e['height'], e['fps'],
              '+'.join(e['tracks']) or '??', '' if e['url'] else '   (no url yet)'))
    if unplaced:
        print('could not place (rename to 1-03-slug.mp4 or set "tracks" in INDEX.json):')
        for f in unplaced: print('  ' + f)
    missing = [t['id'] for t in ts if not any(t['id'] in e['tracks'] for e in out)]
    if missing: print('tracks with no clip: ' + ' '.join(missing))


# ---------------------------------------------------------------- stage 1: audio -> envelope -> anchors

def clip_envelope(path):
    """the clip's audio as the page's 20 ms loudness envelope (uint8), decoded by ffmpeg to 16 kHz mono."""
    import numpy as np
    sr = 16000
    p = subprocess.run([ffmpeg(), '-v', 'error', '-i', path, '-vn', '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'],
                       capture_output=True)
    if p.returncode or not p.stdout:
        die('ffmpeg could not decode audio from %s: %s' % (path, p.stderr.decode(errors='replace')[-400:]))
    x = np.frombuffer(p.stdout, dtype=np.int16).astype(np.float32) / 32768.0
    n = int(sr * ENV_BIN)
    m = len(x) // n
    rms = np.sqrt(np.mean(x[:m * n].reshape(m, n) ** 2, axis=1))
    env = np.clip(255.0 * (np.log10(rms + 1e-9) + 4.0) / 4.0, 0, 255)
    return env.astype(np.uint8)


def album_envelope():
    import numpy as np
    with open(ENV, 'rb') as f: return np.frombuffer(f.read(), dtype=np.uint8)


def prep(e):
    """envelope -> zero-mean, onset-emphasised float for correlation (minus a 1 s moving mean)."""
    import numpy as np
    x = e.astype(np.float32)
    k = 50
    mean = np.convolve(x, np.ones(k, dtype=np.float32) / k, mode='same')
    return x - mean


def ncc_full(win, hay):
    """normalised cross-correlation of win at every offset in hay -> (best offset in bins, best ncc, the ncc array)."""
    import numpy as np
    w = win - win.mean(); ws = np.sqrt((w ** 2).sum()) + 1e-6
    n = len(w)
    if len(hay) < n: return None, 0.0, None
    c = np.correlate(hay, w, mode='valid')
    cs = np.cumsum(np.insert(hay, 0, 0.0)); cs2 = np.cumsum(np.insert(hay ** 2, 0, 0.0))
    s = cs[n:] - cs[:-n]; s2 = cs2[n:] - cs2[:-n]
    std = np.sqrt(np.maximum(s2 - s * s / n, 1e-6))
    ncc = c / (std * ws)
    i = int(np.argmax(ncc))
    return i, float(ncc[i]), ncc


def ncc_search(win, hay):
    i, cc, _ = ncc_full(win, hay)
    return i, cc


def align(cenv, aenv, ts, tids, win_s=10.0, step_s=10.0, slack_s=2.0, min_corr=0.35):
    """piecewise anchors (clipTime, albumFileTime, corr) over the span of the covered tracks (+-30 s): a win_s
    window every step_s, searched +-slack_s around the running offset (globally when there is none)."""
    import numpy as np
    b = 1.0 / ENV_BIN
    first = next(t for t in ts if t['id'] == tids[0]); last = next(t for t in ts if t['id'] == tids[-1])
    span0 = max(0, int((first['file'] - 30) * b)); span1 = min(len(aenv), int((last['file'] + last['len'] + 30) * b))
    hay = prep(aenv[span0:span1]); clip = prep(cenv)
    # each window is searched +-slack around the running offset; with no offset yet (the start, or after three
    # windows in a row failed - applause, speech, a cut to another number) it is searched over the whole span
    L = len(clip); wn, st, sl = int(win_s * b), int(step_s * b), int(slack_s * b)
    anchors, off, misses, searches, found_global = [], None, 0, {'global': 0, 'local': 0}, []
    for s in range(0, L - wn + 1, st):
        if off is None:
            # a global search must be sure: a higher bar, and a peak that stands clear of the second-best match
            # more than 4 s away (a chorus repeats; a wrong number correlates at 0.4).  Not a longer window: 2 %
            # of tempo drift smears a 20 s window below the bar
            # ... and the NEXT window, correlated on its own, must land on the same offset within the slack: two
            # independent agreements are what a wrong number cannot fake
            searches['global'] += 1
            j, cc, ncc = ncc_full(clip[s:s + wn], hay)
            if j is None or cc < max(0.45, min_corr + 0.1): misses += 1; continue
            # (no runner-up test: a refrain repeats and the right window loses it - Non-Stop's second part did;
            # the neighbour's agreement below is the test that a wrong number cannot pass)
            agreed = False
            for s2 in (s + st, s - st):                        # the next window, or the previous one, on its own
                if s2 < 0 or s2 + wn > L: continue
                j2, cc2 = ncc_search(clip[s2:s2 + wn], hay)
                if j2 is not None and cc2 >= min_corr and abs((j2 - (s2 - s)) - j) <= sl: agreed = True; break
            if not agreed: misses += 1; continue               # (a clip shorter than two windows is nothing)
            lo, wn_used = 0, wn
            found_global.append((s, j - s))
        else:
            # local: the slack grows a second per miss (the film drifts through a weak stretch - rapped dialogue
            # over crowd noise correlates at 0.25); after six misses the chain is lost and the search goes global
            searches['local'] += 1
            sl2 = sl + misses * int(b)
            lo, hi = max(0, s + off - sl2), min(len(hay), s + off + wn + sl2)
            if hi - lo < wn: continue
            j, cc = ncc_search(clip[s:s + wn], hay[lo:hi]); wn_used = wn
        if j is not None and cc >= (min_corr if off is None else min_corr * 0.7):
            a = lo + j
            anchors.append((round((s + wn_used / 2) / b, 3), round((span0 + a + wn_used / 2) / b, 3), round(cc, 3)))
            off, misses = a - s, 0
        else:
            misses += 1
            if misses >= 6: off = None
    # a global find starts a chain going forward; walk BACK from it too, locally, for the windows before it that
    # were too weak to pass the global bar on their own (a quiet opening) - until six misses or an earlier anchor
    taken = {round(a[0], 3) for a in anchors}
    for s_g, off_g in found_global:
        off, misses = off_g, 0
        for s in range(s_g - st, -1, -st):
            if round((s + wn / 2) / b, 3) in taken: break
            sl2 = sl + misses * int(b)
            lo, hi = max(0, s + off - sl2), min(len(hay), s + off + wn + sl2)
            if hi - lo < wn: break
            j, cc = ncc_search(clip[s:s + wn], hay[lo:hi]); searches['local'] += 1
            if j is not None and cc >= min_corr:               # the full bar: a quiet opening is also where applause is
                anchors.append((round((s + wn / 2) / b, 3), round((span0 + lo + j + wn / 2) / b, 3), round(cc, 3)))
                off, misses = lo + j - s, 0
            else:
                misses += 1
                if misses >= 6: break
    anchors.sort()
    info = {'spanS': [round(span0 / b, 1), round(span1 / b, 1)], 'searches': searches, 'winS': win_s, 'slackS': slack_s,
            'minCorr': min_corr, 'globalFinds': len(found_global)}
    return anchors, info


def anchor_stats(anchors):
    """median residual (an anchor against the line through its neighbours) and the worst gap between anchors."""
    if len(anchors) < 3: return {'count': len(anchors), 'medianResidualS': None, 'worstGapS': None}
    res = []
    for k in range(1, len(anchors) - 1):
        (c0, a0, _), (c1, a1, _), (c2, a2, _) = anchors[k - 1], anchors[k], anchors[k + 1]
        pred = a0 + (a2 - a0) * (c1 - c0) / (c2 - c0)
        res.append(abs(a1 - pred))
    res.sort()
    gaps = [anchors[k + 1][0] - anchors[k][0] for k in range(len(anchors) - 1)]
    return {'count': len(anchors), 'medianResidualS': round(res[len(res) // 2], 3), 'worstGapS': round(max(gaps), 1)}


def interp(anchors, t):
    """clip time -> album file time, linear between anchors, constant offset beyond the ends."""
    if not anchors: return None
    if t <= anchors[0][0]: return anchors[0][1] + (t - anchors[0][0])
    if t >= anchors[-1][0]: return anchors[-1][1] + (t - anchors[-1][0])
    for k in range(len(anchors) - 1):
        c0, a0, _ = anchors[k]; c1, a1, _ = anchors[k + 1]
        if c0 <= t <= c1: return a0 + (a1 - a0) * (t - c0) / (c1 - c0)


def load_manual_anchors(cdir, ts):
    p = os.path.join(cdir, 'anchors.json')
    if not os.path.isfile(p): return None
    with open(p, encoding='utf-8') as f: raw = json.load(f)
    return [(float(c), parse_album_time(a, ts), 1.0) for c, a in raw]


# ---------------------------------------------------------------- stage 1: frames and cuts

def decode_frames(path, fdir, fps, height):
    if os.path.isdir(fdir): shutil.rmtree(fdir)
    os.makedirs(fdir)
    cmd = [ffmpeg(), '-v', 'error', '-i', path, '-vf', 'fps=%g,scale=-2:%d' % (fps, height), '-q:v', '3',
           os.path.join(fdir, '%06d.jpg')]
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode: die('ffmpeg frames failed: ' + p.stderr.decode(errors='replace')[-400:])
    return sorted(os.listdir(fdir))


def detect_cuts(fdir, files, thr, hthr):
    """cut before frame i when the tiny-grayscale mean abs diff AND the hue/sat-histogram distance both jump.
    (On the film at 5 fps / 720p: every real cut had hist > 0.2 and gray > 12; fast motion inside a shot reaches
    gray 33 but hist stays under 0.15.)"""
    import cv2, numpy as np
    prev_g = prev_h = None; diffs = []; cuts = []
    for i, f in enumerate(files):
        im = cv2.imread(os.path.join(fdir, f))
        g = cv2.resize(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), (48, 27), interpolation=cv2.INTER_AREA).astype(np.float32)
        hsv = cv2.cvtColor(cv2.resize(im, (160, 90), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2HSV)
        h = cv2.calcHist([hsv], [0, 1], None, [16, 8], [0, 180, 0, 256]).flatten(); h /= (h.sum() + 1e-6)
        if prev_g is not None:
            d = float(np.abs(g - prev_g).mean()); hd = float(0.5 * np.abs(h - prev_h).sum())
            diffs.append((round(d, 1), round(hd, 3)))
            if d > thr and hd > hthr: cuts.append(i)
        else:
            diffs.append((0.0, 0.0))
        prev_g, prev_h = g, h
    return cuts, diffs


def cmd_frames(args):
    path, stem = resolve_clip(args.clip)
    ts = tracks(); tids = clip_tracks(stem)
    cdir = os.path.join(CACHE, stem); fdir = os.path.join(cdir, 'frames'); os.makedirs(cdir, exist_ok=True)
    fjson = os.path.join(cdir, 'frames.json')
    prev = json.load(open(fjson, encoding='utf-8')) if os.path.isfile(fjson) else None
    # --- time
    manual = load_manual_anchors(cdir, ts)
    if manual:
        anchors, info = manual, {'manual': True}
        log('anchors from anchors.json:', len(anchors))
    elif args.keep_align and prev and prev.get('align', {}).get('anchors'):
        anchors = [tuple(a) for a in prev['align']['anchors']]; info = prev['align'].get('info', {})
    else:
        t0 = time.time()
        cenv = clip_envelope(path)
        log('clip audio: %.1f s decoded in %.1f s' % (len(cenv) * ENV_BIN, time.time() - t0))
        anchors, info = align(cenv, album_envelope(), ts, tids, win_s=args.win, slack_s=args.slack, min_corr=args.min_corr)
        log('anchors: %d  %s' % (len(anchors), info))
        if not anchors: log('WARNING: no alignment - no usable music?  write cache/%s/anchors.json by hand' % stem)
    stats = anchor_stats(anchors)
    # --- frames
    if args.no_decode and prev and os.path.isdir(fdir):
        files = sorted(os.listdir(fdir)); fps = prev['fps']; height = prev['height']
        cuts, diffs = prev['cuts']['detected'], prev.get('diffs') or []
    else:
        fps, height = args.fps, args.height
        t0 = time.time()
        files = decode_frames(path, fdir, fps, height)
        log('%d frames at %g fps in %.1f s' % (len(files), fps, time.time() - t0))
        cuts, diffs = detect_cuts(fdir, files, args.cut, args.cut_hist)
        log('%d cuts detected' % len(cuts))
    detected = list(cuts)
    cj = os.path.join(cdir, 'cuts.json')
    if os.path.isfile(cj):
        ed = json.load(open(cj, encoding='utf-8'))
        cuts = sorted((set(cuts) | set(ed.get('add', []))) - set(ed.get('remove', [])))
        log('cuts after cuts.json: %d' % len(cuts))
    # --- assemble
    frames, shots = [], []
    bounds = [0] + [c for c in cuts if 0 < c < len(files)] + [len(files)]
    for s in range(len(bounds) - 1):
        shots.append({'id': s, 'first': bounds[s], 'last': bounds[s + 1] - 1, 'n': bounds[s + 1] - bounds[s]})
    shot_of = {}
    for sh in shots:
        for i in range(sh['first'], sh['last'] + 1): shot_of[i] = sh['id']
    a0, a1 = (anchors[0][0], anchors[-1][0]) if anchors else (None, None)
    for i, f in enumerate(files):
        t = i / fps
        ft = interp(anchors, t)
        tid, at = file_time_to_track(ft, ts) if ft is not None else (None, None)
        # tconf: 1 between the anchors; the ends ride the last offset (applause, the next number's lead-in) and are
        # trusted less the further they go
        if ft is None: tc = 0.0
        elif a0 <= t <= a1: tc = 1.0
        else: tc = round(max(0.2, 1.0 - 0.08 * min(a0 - t if t < a0 else t - a1, 10.0)), 2)
        frames.append({'i': i, 'file': f, 't': round(t, 3), 'album': None if ft is None else round(ft, 3),
                       'track': tid, 'at': at, 'tconf': tc, 'shot': shot_of[i]})
    covered = sorted({fr['track'] for fr in frames if fr['track'] and fr['tconf'] >= 0.5})
    out = {'clip': stem, 'source': os.path.relpath(path, ROOT).replace('\\', '/'), 'tracksDeclared': tids,
           'tracksSeen': covered, 'fps': fps, 'height': height, 'frames': frames, 'shots': shots,
           'align': {'anchors': anchors, 'info': info, **stats, 'envelope': os.path.relpath(ENV, ROOT).replace('\\', '/')},
           'cuts': {'threshold': args.cut, 'histThreshold': args.cut_hist, 'detected': detected}, 'diffs': diffs,
           'written': time.strftime('%Y-%m-%d %H:%M')}
    with open(fjson, 'w', encoding='utf-8') as f: json.dump(out, f, separators=(',', ':')); f.write('\n')
    print('%s: %d frames, %d shots, %d anchors (median residual %s s, worst gap %s s), tracks seen %s -> %s' %
          (stem, len(frames), len(shots), stats['count'], stats['medianResidualS'], stats['worstGapS'], covered,
           os.path.relpath(fjson, ROOT)))
    if covered and set(covered) != set(tids): log('NOTE: declared %s, the music says %s' % (tids, covered))


# ---------------------------------------------------------------- stage 2: bodies

def cmd_bodies(args):
    import cv2
    path, stem = resolve_clip(args.clip)
    cdir = os.path.join(CACHE, stem); fdir = os.path.join(cdir, 'frames'); fjson = os.path.join(cdir, 'frames.json')
    if not os.path.isfile(fjson): die('run frames first for %s' % stem)
    fr = json.load(open(fjson, encoding='utf-8'))
    os.chdir(HERE)                         # ultralytics downloads the .pt into the cwd: keep it here (git-ignored)
    from ultralytics import YOLO
    model = YOLO(args.model)
    t0 = time.time(); per_frame = []; tracklets = {}; count = 0
    for sh in fr['shots']:
        # a tracker never crosses a cut (RULING FY): reset it at every shot
        pred = getattr(model, 'predictor', None)
        if pred is not None and getattr(pred, 'trackers', None):
            for tr in pred.trackers: tr.reset()
        for i in range(sh['first'], sh['last'] + 1):
            f = fr['frames'][i]
            im = cv2.imread(os.path.join(fdir, f['file']))
            r = model.track(im, persist=True, tracker='bytetrack.yaml', conf=args.conf, imgsz=args.imgsz, verbose=False)[0]
            bodies = []
            if r.boxes is not None and len(r.boxes):
                ids = r.boxes.id.int().tolist() if r.boxes.id is not None else [-1] * len(r.boxes)
                xyxy = r.boxes.xyxy.tolist(); bc = r.boxes.conf.tolist()
                kxy = r.keypoints.xy.tolist() if r.keypoints is not None else [[]] * len(ids)
                kc = (r.keypoints.conf.tolist() if (r.keypoints is not None and r.keypoints.conf is not None)
                      else [[1.0] * 17] * len(ids))
                for k, tid in enumerate(ids):
                    tk = 's%d-t%d' % (sh['id'], tid)
                    kp = [[round(x, 1), round(y, 1), round(c, 2)] for (x, y), c in zip(kxy[k], kc[k])]
                    bodies.append({'tid': tk, 'box': [round(v, 1) for v in xyxy[k]], 'conf': round(bc[k], 3), 'kp': kp})
                    tl = tracklets.setdefault(tk, {'shot': sh['id'], 'first': i, 'last': i, 'n': 0})
                    tl['last'] = i; tl['n'] += 1
            per_frame.append({'i': i, 'bodies': bodies}); count += len(bodies)
            if i % 100 == 0: log('  frame %d/%d  %.1f fps' % (i, len(fr['frames']), (i + 1) / max(1e-6, time.time() - t0)))
    im0 = cv2.imread(os.path.join(fdir, fr['frames'][0]['file']))
    out = {'clip': stem, 'model': args.model, 'imgsz': args.imgsz, 'conf': args.conf, 'keypoints': 'COCO-17',
           'frameSize': [im0.shape[1], im0.shape[0]], 'frames': per_frame, 'tracklets': tracklets,
           'written': time.strftime('%Y-%m-%d %H:%M')}
    bj = os.path.join(cdir, 'bodies.json')
    with open(bj, 'w', encoding='utf-8') as f: json.dump(out, f, separators=(',', ':')); f.write('\n')
    print('%s: %d bodies over %d frames, %d tracklets, %.1f fps -> %s' %
          (stem, count, len(per_frame), len(tracklets), len(per_frame) / max(1e-6, time.time() - t0),
           os.path.relpath(bj, ROOT)))


# ---------------------------------------------------------------- sheet

def cmd_sheet(args):
    """cache/<clip>/shots.jpg: the last frame of each shot beside the first frame of the next, so a cut is judged
    by eye (and a missed one found: --all tiles every shot's first frame instead)."""
    import cv2, numpy as np
    stem = os.path.splitext(os.path.basename(args.clip))[0]
    cdir = os.path.join(CACHE, stem); fdir = os.path.join(cdir, 'frames')
    fr = json.load(open(os.path.join(cdir, 'frames.json'), encoding='utf-8'))
    tiles = []
    for sh in fr['shots'][1:]:
        a = fr['frames'][sh['first'] - 1]; c = fr['frames'][sh['first']]
        ia = cv2.resize(cv2.imread(os.path.join(fdir, a['file'])), (320, 180))
        ic = cv2.resize(cv2.imread(os.path.join(fdir, c['file'])), (320, 180))
        t = np.hstack([ia, ic]); d = fr['diffs'][sh['first']] if sh['first'] < len(fr['diffs']) else (0, 0)
        cv2.putText(t, 'shot %d  f%d  %s %s  d%.0f h%.2f' % (sh['id'], sh['first'], c['track'] or '-', c['at'] if c['at'] is not None else '', d[0], d[1]),
                    (6, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)
        tiles.append(t)
    if not tiles: print('one shot, nothing to tile'); return
    cols = 3
    while len(tiles) % cols: tiles.append(np.zeros_like(tiles[0]))
    sheet = np.vstack([np.hstack(tiles[k:k + cols]) for k in range(0, len(tiles), cols)])
    out = os.path.join(cdir, 'shots.jpg')
    cv2.imwrite(out, sheet, [cv2.IMWRITE_JPEG_QUALITY, 70])
    print('%s: %d cuts -> %s (%dx%d)' % (stem, len(fr['shots']) - 1, os.path.relpath(out, ROOT), sheet.shape[1], sheet.shape[0]))


# ---------------------------------------------------------------- draw

COCO_BONES = [(5, 7), (7, 9), (6, 8), (8, 10), (5, 6), (5, 11), (6, 12), (11, 12), (11, 13), (13, 15), (12, 14), (14, 16),
              (0, 5), (0, 6)]


def cmd_draw(args):
    """cache/<clip>/bodies.jpg: the middle frame of each shot (the first --n shots) with every detected body's box,
    tracklet id and skeleton drawn on it - what stage 2 saw, to judge by eye."""
    import cv2, numpy as np
    stem = os.path.splitext(os.path.basename(args.clip))[0]
    cdir = os.path.join(CACHE, stem); fdir = os.path.join(cdir, 'frames')
    fr = json.load(open(os.path.join(cdir, 'frames.json'), encoding='utf-8'))
    bp = os.path.join(cdir, 'bodies.json')
    if not os.path.isfile(bp): die('run bodies first for %s' % stem)
    bo = json.load(open(bp, encoding='utf-8'))
    by_i = {x['i']: x['bodies'] for x in bo['frames']}
    tiles = []
    for sh in fr['shots'][:args.n]:
        i = sh['first'] + sh['n'] // 2
        im = cv2.imread(os.path.join(fdir, fr['frames'][i]['file']))
        for b in by_i.get(i, []):
            x1, y1, x2, y2 = map(int, b['box']); cv2.rectangle(im, (x1, y1), (x2, y2), (0, 255, 255), 2)
            cv2.putText(im, b['tid'], (x1, max(12, y1 - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
            kp = b['kp']
            for a, c in COCO_BONES:
                if kp[a][2] > 0.3 and kp[c][2] > 0.3:
                    cv2.line(im, (int(kp[a][0]), int(kp[a][1])), (int(kp[c][0]), int(kp[c][1])), (0, 0, 255), 2)
            for x, y, cf in kp:
                if cf > 0.3: cv2.circle(im, (int(x), int(y)), 3, (255, 128, 0), -1)
        f = fr['frames'][i]
        cv2.putText(im, 'shot %d  %s at %s  %d bodies' % (f['shot'], f['track'], f['at'], len(by_i.get(i, []))), (8, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        tiles.append(cv2.resize(im, (640, 360)))
    while len(tiles) % 3: tiles.append(np.zeros_like(tiles[0]))
    sheet = np.vstack([np.hstack(tiles[k:k + 3]) for k in range(0, len(tiles), 3)])
    out = os.path.join(cdir, 'bodies.jpg')
    cv2.imwrite(out, sheet, [cv2.IMWRITE_JPEG_QUALITY, 80])
    n = [len(x['bodies']) for x in bo['frames']]
    print('%s: %d shots drawn -> %s; %.1f bodies/frame (max %d), %d tracklets, longest %d frames' %
          (stem, min(args.n, len(fr['shots'])), os.path.relpath(out, ROOT), sum(n) / max(1, len(n)), max(n or [0]),
           len(bo['tracklets']), max((t['n'] for t in bo['tracklets'].values()), default=0)))


# ---------------------------------------------------------------- check

def cmd_check(args):
    stem = os.path.splitext(os.path.basename(args.clip))[0]
    if not os.path.isdir(os.path.join(CACHE, stem)): _, stem = resolve_clip(args.clip)
    cdir = os.path.join(CACHE, stem)
    fj, bj = os.path.join(cdir, 'frames.json'), os.path.join(cdir, 'bodies.json')
    if not os.path.isfile(fj): print(stem + ': no frames.json (run frames)'); return
    fr = json.load(open(fj, encoding='utf-8'))
    a = fr['align']
    print('%s: %d frames @ %g fps, %d shots; tracks %s; %d anchors, median residual %s s, worst gap %s s' %
          (stem, len(fr['frames']), fr['fps'], len(fr['shots']), fr['tracksSeen'], a['count'], a['medianResidualS'],
           a['worstGapS']))
    for s in fr['shots'][:args.n]:
        f0, f1 = fr['frames'][s['first']], fr['frames'][s['last']]
        print('  shot %3d  frames %5d-%5d  clip %7.1f-%7.1f  %s' % (s['id'], s['first'], s['last'], f0['t'], f1['t'],
              ('%s %s -> %s' % (f0['track'], f0['at'], f1['at'])) if f0['track'] else '(outside the album)'))
    if len(fr['shots']) > args.n: print('  ... %d more shots' % (len(fr['shots']) - args.n))
    if os.path.isfile(bj):
        b = json.load(open(bj, encoding='utf-8'))
        n = [len(x['bodies']) for x in b['frames']]
        print('bodies: %d tracklets, %.1f bodies/frame (max %d), model %s' %
              (len(b['tracklets']), sum(n) / max(1, len(n)), max(n or [0]), b['model']))
    else:
        print('bodies: not run')


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    p = sub.add_parser('index'); p.set_defaults(fn=cmd_index)
    p.add_argument('--import', dest='import_dir', metavar='DIR', help='COPY the clips in DIR (a download folder) into video/ first')
    p.add_argument('--rename', action='store_true', help='rename placed files to 1-03-slug.ext (the playlist names); without it, only say what would change')
    p = sub.add_parser('frames'); p.set_defaults(fn=cmd_frames); p.add_argument('clip')
    p.add_argument('--fps', type=float, default=5.0); p.add_argument('--height', type=int, default=720)
    p.add_argument('--cut', type=float, default=12.0, help='mean abs diff (0-255) on a 48x27 gray that marks a cut')
    p.add_argument('--cut-hist', type=float, default=0.2, help='hue/sat histogram distance (0-1) that must jump too')
    p.add_argument('--win', type=float, default=10.0); p.add_argument('--slack', type=float, default=2.0)
    p.add_argument('--min-corr', type=float, default=0.35)
    p.add_argument('--no-decode', action='store_true', help='keep the decoded frames and detected cuts (re-align, re-apply cuts.json)')
    p.add_argument('--keep-align', action='store_true', help='keep the anchors too (with --no-decode: re-apply cuts.json only)')
    p = sub.add_parser('bodies'); p.set_defaults(fn=cmd_bodies); p.add_argument('clip')
    p.add_argument('--model', default='yolo26n-pose.pt'); p.add_argument('--conf', type=float, default=0.25)
    p.add_argument('--imgsz', type=int, default=640)
    p = sub.add_parser('check'); p.set_defaults(fn=cmd_check); p.add_argument('clip'); p.add_argument('-n', type=int, default=12)
    p = sub.add_parser('sheet'); p.set_defaults(fn=cmd_sheet); p.add_argument('clip')
    p = sub.add_parser('draw'); p.set_defaults(fn=cmd_draw); p.add_argument('clip'); p.add_argument('-n', type=int, default=9)
    args = ap.parse_args(); args.fn(args)


if __name__ == '__main__': main()
