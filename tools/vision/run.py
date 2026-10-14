#!/usr/bin/env python
"""Video blocking capture - stages 1 and 2 (docs/superpowers/specs/2026-10-13-video-blocking-capture-design.md).

    python tools/vision/run.py index                       # scan video/, (re)write video/INDEX.json
    python tools/vision/run.py frames <clip> [--fps 5]     # stage 1: frames, cuts, clip time -> album time
    python tools/vision/run.py bodies <clip> [--model M] [--imgsz 640]   # stage 2: pose + tracklets on every kept frame
    python tools/vision/run.py check  <clip>               # what the cache says about a clip
    python tools/vision/run.py recut  <clip>|all [--dry]   # re-detect cuts from the cached frames -> shots, shotmap.json

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


TEMPO_PRIOR = (0.94, 0.97, 1.03, 1.06)   # the clip envelope's stretches tried when the plain pass finds < 3 anchors
PRIOR_CORR = 0.45                         # ... and the median corr a stretched chain must reach to be taken


def align(cenv, aenv, ts, tids, win_s=10.0, step_s=10.0, slack_s=2.0, min_corr=0.35):
    """piecewise anchors (clipTime, albumFileTime, corr): align_pass, then the tempo prior - a film number can run
    5 % off the album's tempo (1-04 The Story of Tonight does), which the +-2 s slack cannot follow; when the plain
    pass finds fewer than 3 anchors the clip envelope is resampled at each TEMPO_PRIOR stretch and the best chain
    is kept (most anchors, then the best median corr).  info['stretch'] is the one used (1.0: none)."""
    import numpy as np
    anchors, info = align_pass(cenv, aenv, ts, tids, win_s, step_s, slack_s, min_corr)
    info['stretch'] = 1.0
    if len(anchors) >= 3: return anchors, info

    def score(an): return (len(an), float(np.median([a[2] for a in an])) if an else 0.0)
    best, tried = (anchors, info), {'1.0': len(anchors)}
    x = np.asarray(cenv, dtype=np.float32)
    for s in TEMPO_PRIOR:
        # stretched clip time c' = s * c: c' / s is the clip time again (album times are untouched)
        sx = np.interp(np.arange(int(round(len(x) * s))) / s, np.arange(len(x)), x)
        an, inf = align_pass(sx, aenv, ts, tids, win_s, step_s, slack_s, min_corr)
        an = [(round(c / s, 3), a, cc) for c, a, cc in an]
        inf['dropped'] = [(round(c / s, 3), a, cc) for c, a, cc in inf['dropped']]
        inf['stretch'] = s; tried[str(s)] = len(an)
        # four more tries are four more chances at a wrong number: a stretched chain must be three anchors with a
        # median corr of PRIOR_CORR (true ones: 1-04 0.55, 1-01 0.48; What'd I Miss over My Shot's span at x0.97
        # made a false chain of seven at 0.33)
        if len(an) >= 3 and score(an)[1] >= PRIOR_CORR and score(an) > score(best[0]): best = (an, inf)
    best[1]['tempoTried'] = tried
    return best


def drop_outliers(anchors, max_res=0.5, agree=0.3, steady=0.25, step=1.5, reach=40.0, max_slope=0.08):
    """drop the wrong-beat anchors: the local search takes a beat or bar of the same groove (0.6-2 s off) when the
    true peak weakens, about one anchor in fifty.  A run of one or two anchors goes when every one of them is more
    than max_res off the line through the anchors either side of the run (p and q, within reach s of each other),
    and p and q agree.  They agree when
      - their offsets (album - clip) are within `agree` of each other; or
      - the film runs steadily off the album's tempo (0.3 s per 10 s at 3 %): the line through p and q has a
        believable slope (under max_slope), the next anchor out on each side sits on it within `steady`, and the run
        lies outside p's and q's offsets by more than `steady` (in between, it is a pause being taken up); or
      - the run is more than `step` times their disagreement D off that line.  A pause in the film is a STEP (the
        offset jumps by D and stays), and an anchor on either side of a step is never more than D off the line
        through its neighbours; a wrong beat goes out and comes back.
    So a real drift or pause is kept (Take a Break slows by 4 s over a minute; Aaron Burr, Sir gains 1.5 s in a gap).
    The first and last anchors are never judged (the next number after a pause looks like a wrong beat from one
    side).  Worst first, then all again, until none goes.  -> (kept, dropped)."""
    a = sorted(anchors); dropped = []

    def on(p, q):
        return lambda c: p[1] + (q[1] - p[1]) * (c - p[0]) / (q[0] - p[0])
    while True:
        worst = None
        for n in (1, 2):
            for k in range(1, len(a) - n):
                p, q = a[k - 1], a[k + n]
                if q[0] - p[0] > reach: continue
                f = on(p, q)
                r = min(abs(x[1] - f(x[0])) for x in a[k:k + n])
                if r <= max_res or (worst is not None and r <= worst[0]): continue
                d = abs((q[1] - q[0]) - (p[1] - p[0]))
                if d > agree and r <= step * d:
                    if abs((q[1] - p[1]) / (q[0] - p[0]) - 1.0) > max_slope or k < 2 or k + n + 1 >= len(a): continue
                    pl, qr = a[k - 2], a[k + n + 1]
                    if abs(pl[1] - f(pl[0])) > steady or abs(qr[1] - f(qr[0])) > steady: continue
                    # ... and the run goes OUT of the offsets either side and comes back (an anchor between them is a
                    # pause being taken up, not a wrong beat: Take a Break 4719.3 -> 4718.2 -> 4717.5 -> 4717.6)
                    lo, hi = sorted((p[1] - p[0], q[1] - q[0]))
                    if any(lo - steady <= x[1] - x[0] <= hi + steady for x in a[k:k + n]): continue
                worst = (r, k, n)
        if worst is None: break
        _, k, n = worst
        dropped += a[k:k + n]; del a[k:k + n]
    return a, dropped


def align_pass(cenv, aenv, ts, tids, win_s=10.0, step_s=10.0, slack_s=2.0, min_corr=0.35):
    """piecewise anchors (clipTime, albumFileTime, corr) over the span of the covered tracks (+-30 s): a win_s
    window every step_s, searched +-slack_s around the running offset (globally when there is none), then
    drop_outliers."""
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
    # were too weak to pass the global bar on their own (a quiet opening) - until six misses or an earlier anchor.
    # The walk is tempo-aware: 3 % off the album's tempo smears a 10 s window's peak to 0.30-0.34 at the truth (My
    # Shot at +3 % gave up after six such windows, 47 % covered), so each window is resampled to the tempo of the
    # chain the find started (the line through its anchors within 40 s, the two agreeing windows at least) and
    # searched around where that line puts it; at that tempo the same windows correlate at 0.94-0.99.
    taken = {round(a[0], 3) for a in anchors}
    for s_g, off_g in found_global:
        c_ref = round((s_g + wn / 2) / b, 3)
        ref = next((a for a in anchors if a[0] == c_ref), None)
        if ref is None: continue
        fwd = sorted(a for a in anchors if c_ref <= a[0] <= c_ref + 40.0)
        r = float(np.polyfit([a[0] for a in fwd], [a[1] for a in fwd], 1)[0]) if len(fwd) >= 2 else 1.0
        if abs(r - 1.0) < 0.005 or abs(r - 1.0) > 0.1: r = 1.0
        m = int(round(wn * r)); a_ref, misses = ref[1], 0
        for s in range(s_g - st, -1, -st):
            c = round((s + wn / 2) / b, 3)
            if c in taken: break
            sl2 = sl + misses * int(b)
            mid = (a_ref + (c - c_ref) * r) * b - span0          # where the chain's line puts this window's centre
            lo, hi = max(0, int(round(mid - m / 2)) - sl2), min(len(hay), int(round(mid + m / 2)) + sl2)
            if hi - lo < m: break
            w = clip[s:s + wn] if r == 1.0 else np.interp(np.arange(m) / r, np.arange(wn), clip[s:s + wn])
            j, cc = ncc_search(w, hay[lo:hi]); searches['local'] += 1
            if j is not None and cc >= min_corr:               # the full bar: a quiet opening is also where applause is
                anchors.append((c, round((span0 + lo + j + m / 2) / b, 3), round(cc, 3)))
                c_ref, a_ref, misses = c, anchors[-1][1], 0
            else:
                misses += 1
                if misses >= 6: break
    # drop, refine, and drop again: a wrong beat between two anchors still carrying their tempo jitter (+-0.15 s) can
    # fail the steady test before refine and pass it after (One Last Time at +3 %)
    anchors, dropped = drop_outliers(anchors)
    for _ in range(3):
        if REFINE: anchors = refine(anchors, clip, hay, span0, wn)
        anchors, more = drop_outliers(anchors); dropped += more
        if not more: break
    info = {'spanS': [round(span0 / b, 1), round(span1 / b, 1)], 'searches': searches, 'winS': win_s, 'slackS': slack_s,
            'minCorr': min_corr, 'globalFinds': len(found_global), 'dropped': dropped}
    return anchors, info


REFINE = True


def refine(anchors, clip, hay, span0, wn, reach=25.0, r_bins=15):
    """each anchor again, its window resampled to the local tempo (the slope of the anchors within reach s) and
    searched +-r_bins around where it is: a 10 s window 3 % off tempo has no single best offset (+-0.15 s), one at
    the album's tempo has.  Kept only where the corr does not fall."""
    import numpy as np
    b = 1.0 / ENV_BIN; out = []
    for k, (c, a, cc) in enumerate(anchors):
        nb = [x for x in anchors if abs(x[0] - c) <= reach]
        if len(nb) < 2: out.append((c, a, cc)); continue
        r = float(np.polyfit([x[0] for x in nb], [x[1] for x in nb], 1)[0])
        s = int(round(c * b - wn / 2))
        if abs(r - 1.0) < 0.005 or abs(r - 1.0) > 0.1 or s < 0 or s + wn > len(clip): out.append((c, a, cc)); continue
        m = int(round(wn * r))
        w = np.interp(np.arange(m) / r, np.arange(wn), clip[s:s + wn])
        lo = int(round(a * b - span0 - m / 2)) - r_bins; hi = lo + m + 2 * r_bins
        if lo < 0 or hi > len(hay): out.append((c, a, cc)); continue
        j, c2 = ncc_search(w, hay[lo:hi])
        if j is None or c2 < cc: out.append((c, a, cc)); continue
        out.append((c, round((span0 + lo + j + m / 2) / b, 3), round(c2, 3)))
    return out


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
    return [(round(float(c), 3), round(parse_album_time(a, ts), 3), 1.0) for c, a in raw]


# ---------------------------------------------------------------- stage 1: frames and cuts

def decode_frames(path, fdir, fps, height):
    if os.path.isdir(fdir): shutil.rmtree(fdir)
    os.makedirs(fdir)
    cmd = [ffmpeg(), '-v', 'error', '-i', path, '-vf', 'fps=%g,scale=-2:%d' % (fps, height), '-q:v', '3',
           os.path.join(fdir, '%06d.jpg')]
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode: die('ffmpeg frames failed: ' + p.stderr.decode(errors='replace')[-400:])
    return sorted(os.listdir(fdir))


# the cut rule (VISION.md stage 1, "Cuts"), tuned on 62 labelled missed cuts and 39 labelled non-cuts (2026-10-14):
#   old:       gray > 12 AND hist > 0.2 (the first rule) - kept unless the STRUCTURE did not change (tq >= same: a
#              lighting change; 71 of the first rule's 1326 cuts were, by eye, a cue on one camera) or it is a flash
#   structure: hist > shist AND tq < struct AND the pair is a dip, both neighbouring pairs at least `contrast` more alike
#              (fast dance and a moving camera keep every pair low; a cut is one low pair between two steadier ones),
#              or - a cut into or out of a moving shot - hist > ohist and ONE neighbour `oneSide` more alike;
#              AND neither frame is flat (a fade to black has no structure to compare)
#   flash:     frame i+1 against frame i-1 >= flash (the change did not last two frames) - no cut either way
CUT_RULE = {'same': 0.5, 'shist': 0.11, 'struct': 0.4, 'contrast': 0.3, 'ohist': 0.25, 'oneSide': 0.6, 'flash': 0.6, 'flat': 2.0,
            'tiles': [3, 4], 'tileFloor': 3.0, 'tileQ': 0.25}


def frame_feats(im):
    """a decoded frame -> (48x27 gray, uint8; 16x8 hue/sat histogram, normalised)."""
    import cv2, numpy as np
    g = cv2.resize(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), (48, 27), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(cv2.resize(im, (160, 90), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2HSV)
    h = cv2.calcHist([hsv], [0, 1], None, [16, 8], [0, 180, 0, 256]).flatten(); h /= (h.sum() + 1e-6)
    return g, h.astype(np.float32)


def tile_ncc(A, B, rule=CUT_RULE):
    """the structure of two stacks of 27x48 grays: per tile (3 rows x 4 columns) the NCC of the mean/std-normalised
    gray, over the tiles with contrast (std >= tileFloor on either side), and its lower quartile.  A tile normalises
    its own light, so a lighting cue keeps it near 1; a quartile, not the whole frame, because an overlay that does
    not cut with the picture (Wait for It's lyric captions, the Disney+ bug) holds a whole-frame NCC at 0.73-0.83
    across a real cut.  NaN where fewer than four tiles have contrast."""
    import numpy as np
    rows, cols = rule['tiles']; h, w = A.shape[-2] // rows, A.shape[-1] // cols
    vals = []
    for r in range(rows):
        for c in range(cols):
            a = A[..., r * h:(r + 1) * h, c * w:(c + 1) * w].reshape(A.shape[:-2] + (-1,))
            b = B[..., r * h:(r + 1) * h, c * w:(c + 1) * w].reshape(B.shape[:-2] + (-1,))
            a = a - a.mean(-1, keepdims=True); b = b - b.mean(-1, keepdims=True)
            sa = np.sqrt((a ** 2).mean(-1)); sb = np.sqrt((b ** 2).mean(-1))
            v = (a * b).mean(-1) / (sa * sb + 1e-3)
            vals.append(np.where(np.maximum(sa, sb) >= rule['tileFloor'], v, np.nan))
    V = np.stack(vals, -1)
    ok = (~np.isnan(V)).sum(-1)
    q = np.nanquantile(np.where(ok[..., None] > 0, V, 0.0), rule['tileQ'], axis=-1)
    return np.where(ok >= 4, q, np.nan)


def cut_scores(G, H, rule=CUT_RULE):
    """per consecutive pair (i-1, i): gray (mean abs diff), hist (half-L1), ncc (the whole normalised gray), tq (the
    tiles' lower quartile, falling back to ncc), and tq2 (frame i+1 against i-1: did the change last); plus each
    frame's gray std.  Arrays of len(G); index 0 is a no-change pair."""
    import numpy as np
    G = np.asarray(G, dtype=np.float32); n = len(G)
    Z = G.reshape(n, -1); sd = Z.std(1)
    Zn = (Z - Z.mean(1, keepdims=True)) / (sd[:, None] + 1e-3)
    d = np.zeros(n); hd = np.zeros(n); ncc = np.ones(n); ncc2 = np.ones(n); tq = np.ones(n); tq2 = np.ones(n)
    if n > 1:
        d[1:] = np.abs(G[1:] - G[:-1]).reshape(n - 1, -1).mean(1)
        hd[1:] = 0.5 * np.abs(H[1:] - H[:-1]).sum(1)
        ncc[1:] = (Zn[1:] * Zn[:-1]).mean(1)
        tq[1:] = tile_ncc(G[1:], G[:-1], rule)
    if n > 2:
        ncc2[1:n - 1] = (Zn[2:] * Zn[:-2]).mean(1)
        tq2[1:n - 1] = tile_ncc(G[2:], G[:-2], rule)
    tq = np.where(np.isnan(tq), ncc, tq); tq2 = np.where(np.isnan(tq2), ncc2, tq2)
    return {'gray': d, 'hist': hd, 'ncc': ncc, 'tq': tq, 'tq2': tq2, 'std': sd}


def decide_cuts(sc, thr=12.0, hthr=0.2, rule=CUT_RULE):
    """the cut rule (CUT_RULE above) over cut_scores -> the frame indices a shot starts at (a cut before frame i)."""
    d, hd, tq, tq2, sd = sc['gray'], sc['hist'], sc['tq'], sc['tq2'], sc['std']
    n = len(d); cuts = []
    for i in range(1, n):
        lasts = tq2[i] < rule['flash'] if i + 1 < n else True
        if not lasts: continue
        if d[i] > thr and hd[i] > hthr and tq[i] < rule['same']: cuts.append(i); continue
        if hd[i] <= rule['shist'] or tq[i] >= rule['struct'] or min(sd[i - 1], sd[i]) < rule['flat']: continue
        nb = (tq[i - 1] if i > 1 else 1.0, tq[i + 1] if i + 1 < n else 1.0)
        if min(nb) - tq[i] >= rule['contrast'] or (hd[i] > rule['ohist'] and max(nb) - tq[i] >= rule['oneSide']):
            cuts.append(i)
    return cuts


def read_feats(fdir, files):
    """frame_feats of every frame file, read on a few threads (cv2 lets go of the GIL) -> (G, H) arrays."""
    import cv2, numpy as np
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(8) as ex:
        r = list(ex.map(lambda f: frame_feats(cv2.imread(os.path.join(fdir, f))), files))
    return np.stack([g for g, _ in r]), np.stack([h for _, h in r])


def detect_cuts(fdir, files, thr, hthr, rule=CUT_RULE):
    """cut before frame i by decide_cuts: the first rule (gray > thr AND hist > hthr: on the film every cut it found
    had hist > 0.2, and fast motion inside a shot reaches gray 33 with hist under 0.15) unless the structure stayed,
    OR the structure rule.  -> (cuts, diffs): diffs[i] = [gray, hist, ncc, tq] of the pair (i-1, i)."""
    G, H = read_feats(fdir, files)
    sc = cut_scores(G, H, rule)
    cuts = decide_cuts(sc, thr, hthr, rule)
    diffs = [[round(float(sc['gray'][i]), 1), round(float(sc['hist'][i]), 3), round(float(sc['ncc'][i]), 2),
              round(float(sc['tq'][i]), 2)] for i in range(len(files))]
    if diffs: diffs[0] = [0.0, 0.0, 1.0, 1.0]
    return cuts, diffs


def make_shots(cuts, n):
    """cut frame indices -> shots [{id, first, last, n}] and the shot of every frame."""
    shots = []
    bounds = [0] + [c for c in sorted(set(cuts)) if 0 < c < n] + [n]
    for s in range(len(bounds) - 1):
        shots.append({'id': s, 'first': bounds[s], 'last': bounds[s + 1] - 1, 'n': bounds[s + 1] - bounds[s]})
    shot_of = [0] * n
    for sh in shots:
        for i in range(sh['first'], sh['last'] + 1): shot_of[i] = sh['id']
    return shots, shot_of


def apply_cuts_json(cdir, cuts):
    """cache/<clip>/cuts.json {"add": [i], "remove": [i]} over the detected cuts."""
    cj = os.path.join(cdir, 'cuts.json')
    if not os.path.isfile(cj): return sorted(cuts)
    with open(cj, encoding='utf-8') as f: ed = json.load(f)
    return sorted((set(cuts) | set(ed.get('add', []))) - set(ed.get('remove', [])))


def cuts_record(thr, hthr, detected):
    return {'threshold': thr, 'histThreshold': hthr, 'rule': CUT_RULE, 'detected': detected}


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
    anchors = [(round(c, 3), round(a, 3), round(cc, 3)) for c, a, cc in anchors]    # no float noise in the file
    stats = anchor_stats(anchors)
    # --- frames
    if args.no_decode and prev and os.path.isdir(fdir):
        files = sorted(os.listdir(fdir)); fps = prev['fps']; height = prev['height']
        cuts, diffs = prev['cuts']['detected'], prev.get('diffs') or []
        cut_rec = dict(prev['cuts'])           # the rule the kept cuts were detected by
    else:
        fps, height = args.fps, args.height
        t0 = time.time()
        files = decode_frames(path, fdir, fps, height)
        log('%d frames at %g fps in %.1f s' % (len(files), fps, time.time() - t0))
        cuts, diffs = detect_cuts(fdir, files, args.cut, args.cut_hist)
        cut_rec = cuts_record(args.cut, args.cut_hist, None)
        log('%d cuts detected' % len(cuts))
    detected = list(cuts)
    if os.path.isfile(os.path.join(cdir, 'cuts.json')):
        cuts = apply_cuts_json(cdir, cuts)
        log('cuts after cuts.json: %d' % len(cuts))
    # --- assemble
    frames = []
    shots, shot_of = make_shots(cuts, len(files))
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
           'align': {'anchors': anchors, 'info': info, **stats, 'stretch': info.get('stretch'),
                     'envelope': os.path.relpath(ENV, ROOT).replace('\\', '/')},
           'cuts': {**cut_rec, 'detected': detected}, 'diffs': diffs,
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
        cv2.putText(t, 'shot %d  f%d  %s %s' % (sh['id'], sh['first'], c['track'] or '-', c['at'] if c['at'] is not None else ''),
                    (6, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)
        # gray diff, hist distance and (since recut) the whole-frame NCC and the tiles' structure (VISION.md stage 1)
        cv2.putText(t, 'd%.0f h%.2f' % (d[0], d[1]) + (' ncc%.2f tq%.2f' % (d[2], d[3]) if len(d) > 3 else ''),
                    (6, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)
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


# ---------------------------------------------------------------- calib (stage 3, in calib.py)

def cmd_calib(args):
    sys.path.insert(0, HERE); import calib
    if args.shot == 'list': args.what = 'list'; return calib.cmd_calib(args, None, None)
    stem = os.path.splitext(os.path.basename(args.clip))[0]
    cdir = os.path.join(CACHE, stem)
    fp = os.path.join(cdir, 'frames.json')
    if not os.path.isfile(fp): die('run frames first for %s' % stem)
    calib.cmd_calib(args, cdir, json.load(open(fp, encoding='utf-8')))


def cmd_floor(args):
    sys.path.insert(0, HERE); import floor
    stem = os.path.splitext(os.path.basename(args.clip))[0]
    cdir = os.path.join(CACHE, stem)
    if not os.path.isfile(os.path.join(cdir, 'bodies.json')): die('run frames and bodies first for %s' % stem)
    if args.cmd == 'floor-check': floor.cmd_floor_check(stem, cdir, int(args.shot))
    else: floor.cmd_floor(stem, cdir, args.unjudged)


def cmd_wide(args):
    sys.path.insert(0, HERE); import calib
    stem = os.path.splitext(os.path.basename(args.clip))[0]
    cdir = os.path.join(CACHE, stem)
    fp, bp = os.path.join(cdir, 'frames.json'), os.path.join(cdir, 'bodies.json')
    if not os.path.isfile(bp): die('run frames and bodies first for %s' % stem)
    fr = json.load(open(fp, encoding='utf-8')); bo = json.load(open(bp, encoding='utf-8'))
    wide = calib.wide_shots(fr, bo, args.max_h, args.min_bodies)
    done = calib.load_calib(stem)['shots']
    print('%s: %d of %d shots look wide' % (stem, len(wide), len(fr['shots'])))
    for s in wide:
        print('  shot %3d  frames %4d-%4d (%3d)  %s at %s  body h %.2f  bodies %.0f%s' %
              (s['shot'], s['frames'][0], s['frames'][1], s['n'], s['track'], s['at'], s['bodyH'], s['bodies'],
               ('  SOLVED rms %.1f' % done[str(s['shot'])]['solve']['rms']) if str(s['shot']) in done else ''))


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
    p.add_argument('--imgsz', type=int, default=640, help='the model\'s input size: 960/1280 find many more bodies in the widest shots, at ~1/2 and ~1/3 the speed (VISION.md stage 2)')
    p = sub.add_parser('check'); p.set_defaults(fn=cmd_check); p.add_argument('clip'); p.add_argument('-n', type=int, default=12)
    p = sub.add_parser('sheet'); p.set_defaults(fn=cmd_sheet); p.add_argument('clip')
    p = sub.add_parser('recut', help='re-detect the cuts from the cached frames (no decode, no align) -> frames.json shots + shotmap.json (recut.py)')
    p.set_defaults(fn=lambda a: (sys.path.insert(0, HERE), __import__('recut').cmd_recut(a)))
    p.add_argument('clip', help="a clip, or 'all'"); p.add_argument('--dry', action='store_true', help='print old vs new shots and the new cut frames; write nothing')
    p.add_argument('--rebase', action='store_true', help='map from the shots frames.json has NOW, not the ones shotmap.json recorded first')
    p = sub.add_parser('draw'); p.set_defaults(fn=cmd_draw); p.add_argument('clip'); p.add_argument('-n', type=int, default=9)
    p = sub.add_parser('wide', help='the shots that look wide (small bodies, several) - the ones to calibrate'); p.set_defaults(fn=cmd_wide)
    p.add_argument('clip'); p.add_argument('--max-h', type=float, default=0.4); p.add_argument('--min-bodies', type=float, default=3)
    p = sub.add_parser('calib', help='stage 3: a shot\'s camera from named set points (calib.py)'); p.set_defaults(fn=cmd_calib)
    p.add_argument('clip'); p.add_argument('shot', help="the shot id, or 'list'"); p.add_argument('what', nargs='?', default='grid', choices=['grid', 'solve', 'refine', 'zoom', 'list', 'resolve'])
    p.add_argument('points', nargs='*', help='name=u,v (pixels in the cache frame)'); p.add_argument('--from', dest='from_file')
    p.add_argument('--frame', type=int, help='which frame of the shot (default: its middle)')
    p = sub.add_parser('floor', help='stage 4: every body\'s feet in the calibrated shots onto the floor -> out/<track>.json (floor.py)'); p.set_defaults(fn=cmd_floor)
    p.add_argument('clip'); p.add_argument('--unjudged', action='store_true', help='also use shots with a solve and no verdict yet (weight 0.3)')
    p = sub.add_parser('floor-check', help='cache/<clip>/floor-s<shot>.jpg: the shot\'s foot pixels and its positions on a plan'); p.set_defaults(fn=cmd_floor)
    p.add_argument('clip'); p.add_argument('shot')
    p = sub.add_parser('ident', help='stage 5: identities -> characters in out/<track>.json (ident.py)')
    p.set_defaults(fn=lambda a: (sys.path.insert(0, HERE), __import__('ident').run(a.track, a.clip, a.labels, a.hist_stats)))
    p.add_argument('track'); p.add_argument('--clip'); p.add_argument('--labels'); p.add_argument('--hist-stats', action='store_true')
    args = ap.parse_args(); args.fn(args)


if __name__ == '__main__': main()
