"""The diff (RULING GC): what the footage says against the committed blocking, for a person to read - never an
overwrite.

    python -I tools/vision/compare.py <track>                       # -> tools/vision/diffs/<track>.md + .json
    python -I tools/vision/compare.py --all                         # every tools/vision/out/*.json, and a summary
    python -I tools/vision/compare.py <track> --apply [--min-conf 0.7] --dry   # show the generator section, write nothing
    python -I tools/vision/compare.py <track> --apply [--min-conf 0.7]         # write it (a NEW `# VISION:` section)
    options: --in <out file> (instead of tools/vision/out/<track>.json), --diffs <dir> (instead of tools/vision/diffs),
             --gen-root <dir> (a copy of tools/blocking to apply into, for a test)

Reads tools/vision/out/<track>.json (stages 4-5: `characters`, samples {at, x, z, level, conf, clip, shot, tid, rule,
fromBlocking?, offMap?}) and assets/hamilton-blocking.json (through ident.py's Blocking: where each actor is, and
whether she is seen, at a track time).  What counts as EVIDENCE: a named sample whose identity came from a label, from
continuity or from appearance (GB rules 1-3).  A `fromBlocking` sample (GB rule 4) was named BY the blocking and agrees
with it by construction: it is never evidence, only counted ("seen, placed by blocking").  A pooled `ens?` body has no
name: it gives formation counts and shapes per 3 s window, never a waypoint.  A sample with `offMap` (the ray left the
floor map) is counted, never used for a position.

Per character, from the evidence only:
- POSITION: the footage more than POS_M (0.75 m) from where the blocking has her, for more than POS_S (2 s): a run of
  such samples with no agreeing sample between and no gap over GAP_S (1 s).  Compared only where both are on the same
  level and she is seen in the blocking (a stair on either side is not compared).
- ON / OFF: the footage sees her (a named tracklet, with or without a floor position - a close-up counts) while the
  blocking has her off or has no path for her; or the reverse - the footage puts her in a wing or backstage (|x| >= 6.7
  or z <= -4.4, blocking.html's offstage rule) while the blocking has her seen, or a shot a person LABELLED does not
  name her while the blocking stands her inside that shot's frame (weak: the labeller may have skipped her).
- LEVEL: deck against gallery (y > 2.0 in the blocking) for more than 2 s; a stair is not compared.
- PROPOSALS: her footage track (5 fps samples binned at 0.2 s, conf-weighted, a rolling median over +-0.5 s, split
  where it has a gap over 1 s) simplified by Douglas-Peucker at DP_M (0.3 m), then thinned to at most one waypoint per
  WP_S (3 s) (the ends first, then the most significant points); each snapped to the floor map (tools/hamilton-floor.json:
  a deck point onto plain deck - not the house, not a stair or a prop over 0.15 m - and a gallery point onto gallery
  floor within 0.1 m of 2.743, the merge's own test); conf = the mean conf of the samples it stands on (its share of
  the track: from half way to the previous waypoint to half way to the next).  Under LOOK_CONF (0.5): "do not apply
  without a look".
- RULED items (RULINGS below, each with where it is written down): a footage run that contradicts one is reported as
  "footage disagrees with ruling", and no proposal inside a ruled window is ever applied.

--apply writes the proposals that qualify (conf >= --min-conf, the footage differs from the blocking, not a stair, not
inside a ruled window, snapped under 1 m, not within 0.25 s of an existing waypoint, no leg over 3.5 m/s to its
neighbours) as ONE new section in the track's segment generator under tools/blocking/, between `# VISION: <track>
begin` and `# VISION: <track> end`, placed before the generator writes its file; it adds waypoints between the existing
ones and changes none of them (re-applying replaces only that section).  Delete the section to drop the proposals.
Then: run that generator and `python -I tools/blocking-merge.py tools/blocking/segments`, as the format doc says.
"""
import os, sys, re, json, math, argparse, hashlib, bisect, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import ident                                    # the blocking reader (Blocking, track_starts), the cast, POOL

OUT = ident.OUT
CACHE = ident.CACHE
CALIB = os.path.join(HERE, 'calib')
DIFFS = os.path.join(HERE, 'diffs')
BLOCKING = ident.BLOCKING
GEN_ROOT = os.path.join(ROOT, 'tools', 'blocking')

POOL = ident.POOL
EVIDENCE_RULES = ('label', 'continuity', 'appearance')
POS_M, POS_S, GAP_S = 0.75, 2.0, 1.0            # GC: more than 0.75 m for more than 2 s; a gap this long ends a run
DP_M, WP_S = 0.3, 3.0                           # GC: Douglas-Peucker at 0.3 m, at most one waypoint per 3 s
BIN_S, SMOOTH_S = 0.2, 0.5                      # the 5 fps sample grid; the rolling median's half width
LOOK_CONF, APPLY_CONF = 0.5, 0.7                # GC: under 0.5 "do not apply without a look"; --apply's default
SNAP_MAX = 1.0                                  # a proposal snapped further than this needs a look
SAME_T, FAST = 0.25, 3.5                        # an existing waypoint this close in time; the merge's leg speed limit
OFF_X, OFF_Z = 6.7, -4.4                        # blocking.html's offstage rule: a wing or behind the upstage wall
GAL_Y = 2.743
WIN_S = 3.0                                     # the pool's formation windows

SEGMENTS = [   # (segment, tracks, generator under tools/blocking/) - docs/hamilton-blocking-format.md, RULING FO
    (1, ['1-01', '1-02', '1-03', '1-04', '1-05', '1-06'], 'seg1/export.py'),
    (2, ['1-07', '1-08', '1-09', '1-10', '1-11'], 'gen_seg2.py'),
    (3, ['1-12', '1-13', '1-14', '1-15', '1-16', '1-17'], 'seg3gen.py'),
    (4, ['1-18', '1-19', '1-20', '1-21', '1-22', '1-23'], 'gen4.py'),
    (5, ['2-01', '2-02', '2-03', '2-04', '2-05'], 'seg5gen.py'),
    (6, ['2-06', '2-07', '2-08', '2-09', '2-10'], 'gen6.py'),
    (7, ['2-11', '2-12', '2-13', '2-14', '2-15', '2-16'], 'seg7_gen.py'),
    (8, ['2-17', '2-18', '2-19', '2-20', '2-21', '2-22', '2-23'], 'gen_seg8.py'),
]

# ---------------------------------------------------------------- the RULED items (GC: listed here, never proposed)
# A check is ('point', actor, track, from, to, (x, z), level) - she stands there - or ('side', actor, track, from, to,
# -1 | +1) - she is stage right (x < 0) or stage left (x > 0).  A point is contradicted more than POS_M away or on
# another level; a side more than POS_M over the centre line on the wrong side while the blocking has her on the ruled
# one.  A run counts when it lasts more than POS_S, or half the window when the window is shorter (a boundary instant).
_FW = (('ens2', (-1.34, -0.44)), ('ens3', (-0.69, -0.06)), ('ens4', (-0.05, 0.32)), ('ens6', (1.25, 1.08)),
       ('ens7', (1.89, 1.46)), ('ens8', (2.54, 1.84)), ('ens9', (3.19, 2.22)))
RULINGS = [
    {'id': 'edge-2-10-2-11',
     'title': 'Segment edge 2-10 -> 2-11: the King stays at (0, 3.41), facing the house, through the blackout',
     'cite': ['docs/superpowers/specs/2026-10-12-automatic-actors-design.md, RULING FO, "Segment edges"',
              'tools/blocking/gen6.py, end of 2-10 ("SPOT (coordinator, boundary relaxed for 2-10 -> 2-11)")',
              'tools/blocking/seg7_gen.py, 2-11 King ("REVIEW (ruled boundary exception)")'],
     'checks': [('point', 'king', '2-10', 94.4, 97.0, (0.0, 3.41), 'deck'),
                ('point', 'king', '2-11', 0.0, 0.5, (0.0, 3.41), 'deck')]},
    {'id': 'edge-2-16-2-17',
     'title': 'Segment edge 2-16 -> 2-17: Philip (laurens) at (-0.4, 2.4) and Eacker (ens5) at (1.6, -1.0), and the '
              'seven of the company at the count (ens2-4, ens6-9), carried over the boundary',
     'cite': ['docs/superpowers/specs/2026-10-12-automatic-actors-design.md, RULING FO "Segment edges" and RULING FW '
              '(the seven\'s spots)',
              'tools/blocking/seg7_gen.py, 2-16 ("RE-RULED marks", "coordinator\'s RULING on 2-16\'s count")',
              'tools/blocking/gen_seg8.py, 2-17 top; tools/blocking/seg8-notes.txt ("Boundary (re-ruled)")',
              'docs/hamilton-blocking-cue-notes.md, Act Two, 2-16 1087-1089 ("The RULED end marks")'],
     'checks': [('point', 'laurens', '2-16', 172.0, 173.0, (-0.4, 2.4), 'deck'),
                ('point', 'laurens', '2-17', 0.0, 0.3, (-0.4, 2.4), 'deck'),
                ('point', 'ens5', '2-16', 172.0, 173.0, (1.6, -1.0), 'deck'),
                ('point', 'ens5', '2-17', 0.0, 0.3, (1.6, -1.0), 'deck')]
               + [('point', a, '2-16', 170.6, 173.0, p, 'deck') for a, p in _FW]
               + [('point', a, '2-17', 0.0, 0.3, p, 'deck') for a, p in _FW]},
    {'id': 'cabinet-sides',
     'title': 'The Cabinet Battles (2-02, 2-07): Jefferson (lafayette) and Madison (mulligan) STAGE RIGHT, Hamilton '
              'STAGE LEFT (Jack\'s revision-5 ruling)',
     'cite': ['tools/blocking/seg5gen.py, 2-02 header ("Jefferson\'s side SR, Hamilton\'s side SL per Jack\'s '
              'revision-5 ruling") and its NOTES ("SIDES (Jack\'s revision-5 ruling)")',
              'tools/blocking/gen6.py, 2-07 ("REVIEW: Jack\'s ruling (cue revision 5, PR #233)"); '
              'tools/blocking/seg6-notes.txt, 2-07',
              'docs/hamilton-blocking-cue-notes.md, "SETTLED by revision 5: 2-02 Cabinet Battle #1\'s sides" and '
              '"2-07 the sides (unchanged, still open)"'],
     'checks': [('side', a, tr, 0.0, ln, s) for tr, ln in (('2-02', 215.0), ('2-07', 142.0))
                for a, s in (('lafayette', -1), ('mulligan', -1), ('hamilton', 1))]},
    {'id': 'burr-balcony',
     'title': '1-18 Guns and Ships: Burr sings the opening from the SL balcony, the G&S spot (5.49, 2.36), gallery level',
     'cite': ['tools/blocking/research/seg4.md, Review 2 1-18 ("Kept (ruled): Burr on the SL balcony for the opening") '
              'and Review 3 1-18 ("balcony (ruled)")',
              'tools/blocking/gen4.py, 1-18 Burr (BroadwayWorld forum, OBC 2016); tools/blocking/seg4-notes.txt'],
     'checks': [('point', 'burr', '1-18', 6.3, 50.0, (5.49, 2.36), 'gallery')]},
    {'id': 'nonstop-gallery',
     'title': '1-23 Non-Stop: Washington on the SL gallery at (4.9, -1.5) from 330.2 for the finale',
     'cite': ['tools/blocking/research/seg4.md, 1-23 ("Kept as ruled: Washington is on the SL gallery (4.9, -1.5) '
              'from 330.2")',
              'tools/blocking/seg4-notes.txt ("climbs to the SL gallery (4.9, -1.5) for the finale (ruling)")',
              'docs/hamilton-blocking-cue-notes.md, 1-23 659 / 661 ("By ruling Washington is on the SL gallery")'],
     'checks': [('point', 'washington', '1-23', 330.2, 382.0, (4.9, -1.5), 'gallery')]},
    {'id': 'duel-sides',
     'title': '2-22 The World Was Wide Enough: Hamilton STAGE RIGHT, Burr STAGE LEFT at FIRE and at the shot (kept '
              'until Jack rules)',
     'cite': ['docs/hamilton-blocking-cue-notes.md, "Two blocking questions only you can rule" item 2 and "The duel\'s '
              'sides at the shot (2-22)" ("The ruling (Hamilton SR, Burr SL) is kept until Jack rules")',
              'docs/superpowers/specs/2026-10-12-automatic-actors-design.md, RULING FO (the duel sides at the shot, '
              'Jack\'s question)',
              'tools/blocking/gen_seg8.py, 2-22 SPOTLIGHT ("Kept on the ruled sides (Hamilton SR, Burr SL)"); '
              'tools/blocking/research/seg8.md ("Ruled and kept: Hamilton SR, Burr SL")'],
     'checks': [('side', 'hamilton', '2-22', 100.6, 104.0, -1), ('side', 'burr', '2-22', 100.6, 104.0, 1),
                ('side', 'hamilton', '2-22', 187.0, 193.4, -1), ('side', 'burr', '2-22', 187.0, 193.4, 1)]},
]


def _load(p):
    with open(p, encoding='utf-8') as f: return json.load(f)


def _sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f: h.update(f.read())
    return h.hexdigest()


def _r(v, n=3): return None if v is None else round(float(v), n)


def rel(p):
    """a path relative to the repository when it is inside it, else absolute; forward slashes."""
    p = os.path.abspath(p)
    try: r = os.path.relpath(p, ROOT)
    except ValueError: r = p
    return (p if r.startswith('..') else r).replace(os.sep, '/')


def _med(v):
    v = sorted(v); n = len(v)
    return None if not n else (v[n // 2] if n % 2 else 0.5 * (v[n // 2 - 1] + v[n // 2]))


def level_of_y(y):
    y = y or 0.0
    return 'gallery' if y > ident.GAL_Y_SPLIT else ('stair' if y > 0.25 else 'deck')


def offstage_zone(x, z): return abs(x) >= OFF_X or z <= OFF_Z


def kind_of(cid, s):
    """'pool' | 'placed' (fromBlocking) | 'evidence' | 'other'."""
    if cid == POOL: return 'pool'
    if s.get('fromBlocking') or s.get('rule') == 'blocking': return 'placed'
    return 'evidence' if s.get('rule') in EVIDENCE_RULES else 'other'


def positional(s): return s.get('x') is not None and s.get('z') is not None and not s.get('offMap')


# ---------------------------------------------------------------- context: the cast, the show, the blocking's raw paths

class Context:
    def __init__(self):
        cast = _load(ident.CAST)['actors']
        self.names = {a['id']: a['name'] for a in cast}
        self.labels = {a['id']: a.get('labels', []) for a in cast}
        self.titles = {t['id']: t.get('title', '') for t in _load(ident.SHOW)['tracks']}
        self.blocking = ident.Blocking()
        self.starts = self.blocking.starts
        self.raw = {a['id']: a.get('path', []) for a in _load(BLOCKING).get('actors', [])}
        self.blocking_sha = _sha(BLOCKING)
        self._floor = None
        self._frames = {}
        self._calib = {}

    def name(self, cid):
        if cid == POOL: return 'the pool (unnamed bodies)'
        n = self.names.get(cid, cid)
        return n + (' (also %s)' % ', '.join(self.labels[cid]) if self.labels.get(cid) else '')

    def where(self, cid, track, at):
        """-> (x, z, level, seen) or None (no path at all)."""
        p = self.blocking.at(cid, track, at)
        if p is None: return None
        return p[0], p[1], level_of_y(p[2]), p[3]

    def label_at(self, cid, T):
        """the head label in effect at global time T (the last `label` at or before it, else the first after it)."""
        lab = None; first = None
        for w in self.raw.get(cid, []):
            if w.get('track') not in self.starts: continue
            t = self.starts[w['track']] + float(w['at'])
            if w.get('label'):
                if t <= T + 1e-9: lab = w['label']
                elif first is None: first = w['label']
        return lab or first or self.names.get(cid, cid)

    def floor(self):
        if self._floor is None:
            import floor as F
            self._floor = F.Floor()
        return self._floor

    def frame_index(self, clip):
        """(track, at) -> frame i, from the cache's frames.json (None when the cache is not here)."""
        if clip not in self._frames:
            p = os.path.join(CACHE, clip, 'frames.json'); idx = None
            if os.path.isfile(p):
                fr = _load(p)
                idx = {'key': {}, 'by_track': {}, 'shots': fr.get('shots', []), 'frames': fr['frames']}
                for f in fr['frames']:
                    if f.get('track') is None or f.get('at') is None: continue
                    idx['key'][(f['track'], _r(f['at']))] = f['i']
                    idx['by_track'].setdefault(f['track'], []).append((f['at'], f['i']))
            self._frames[clip] = idx
        return self._frames[clip]

    def frame_of(self, clip, track, at):
        idx = self.frame_index(clip)
        if idx is None: return None
        i = idx['key'].get((track, _r(at)))
        if i is not None: return i
        L = idx['by_track'].get(track, [])
        k = bisect.bisect_left(L, (at, -1))
        best = min((L[j] for j in (k - 1, k) if 0 <= j < len(L)), key=lambda e: abs(e[0] - at), default=None)
        return best[1] if best and abs(best[0] - at) <= 0.15 else None

    def calib(self, clip):
        if clip not in self._calib:
            p = os.path.join(CALIB, clip + '.json')
            self._calib[clip] = _load(p) if os.path.isfile(p) else None
        return self._calib[clip]


# ---------------------------------------------------------------- evidence records

def evidence(ctx, track, ss):
    """what a list of samples stands on: n, the at span, the mean conf, the rules, per clip its shots, tracklets, frames."""
    clips = {}
    for s in ss:
        c = clips.setdefault(s['clip'], {'shots': set(), 'tids': set(), 'frames': []})
        c['shots'].add(s['shot']); c['tids'].add(s['tid'])
        i = ctx.frame_of(s['clip'], track, s['at'])
        if i is not None: c['frames'].append(i)
    rules = {}
    for s in ss: rules[s['rule']] = rules.get(s['rule'], 0) + 1
    return {'n': len(ss), 'at': [_r(min(s['at'] for s in ss), 2), _r(max(s['at'] for s in ss), 2)],
            'conf': _r(sum(s['conf'] or 0.0 for s in ss) / len(ss)), 'rules': rules,
            'clips': {k: {'shots': sorted(v['shots']), 'tids': sorted(v['tids'], key=ident.tid_key),
                          'frames': [min(v['frames']), max(v['frames'])] if v['frames'] else None}
                      for k, v in sorted(clips.items())}}


def ev_text(ev):
    parts = []
    for clip, c in ev['clips'].items():
        fr = ('frames %d-%d' % tuple(c['frames'])) if c['frames'] else 'frames ?'
        parts.append('%s s%s %s, %s' % (clip, ','.join(str(x) for x in c['shots']), ','.join(c['tids']), fr))
    rules = ', '.join('%s %d' % kv for kv in sorted(ev['rules'].items()))
    return '%s; conf %.2f; %s' % ('; '.join(parts), ev['conf'] or 0.0, rules)


def runs(seq, min_s=POS_S):
    """seq: [(at, flagged, sample)] sorted by at, only samples that could be judged.  -> [[sample, ...]] - maximal runs
    of flagged samples with no unflagged one between and no gap over GAP_S, longer than min_s."""
    out, cur, last = [], [], None
    for at, flag, s in seq:
        if flag and cur and at - last <= GAP_S + 1e-9:
            cur.append(s)
        else:
            if cur: out.append(cur)
            cur = [s] if flag else []
        last = at
    if cur: out.append(cur)
    return [r for r in out if r[-1]['at'] - r[0]['at'] > min_s - 1e-9]


# ---------------------------------------------------------------- per character: the disagreements

def disagreements(ctx, track, cid, ev_samples):
    items = []
    seq_pos, seq_lvl, seq_on, seq_off = [], [], [], []
    for s in ev_samples:
        b = ctx.where(cid, track, s['at'])
        b_seen = bool(b and b[3])
        seq_on.append((s['at'], not b_seen, s))
        if s.get('x') is None or s.get('offMap'): continue
        fz = offstage_zone(s['x'], s['z'])
        if b_seen: seq_off.append((s['at'], fz, s))
        if fz or not b_seen: continue
        lv_f, lv_b = s.get('level'), b[2]
        if 'stair' in (lv_f, lv_b) or lv_f is None: continue
        seq_lvl.append((s['at'], lv_f != lv_b, s))
        if lv_f == lv_b: seq_pos.append((s['at'], math.hypot(s['x'] - b[0], s['z'] - b[1]) > POS_M, s))

    def rec(kind, r, text):
        bs = [ctx.where(cid, track, s['at']) for s in r]
        fx = [s['x'] for s in r if s.get('x') is not None]
        item = {'kind': kind, 'what': text, 'from': _r(r[0]['at'], 2), 'to': _r(r[-1]['at'], 2),
                'seconds': _r(r[-1]['at'] - r[0]['at'], 2), 'evidence': evidence(ctx, track, r)}
        if fx:
            item['footage'] = {'x': _r(_med(fx), 2), 'z': _r(_med([s['z'] for s in r if s.get('z') is not None]), 2),
                               'level': max({s.get('level') for s in r}, key=lambda v: sum(1 for s in r if s.get('level') == v))}
        bb = [b for b in bs if b]
        if bb:
            item['blocking'] = {'x': _r(_med([b[0] for b in bb]), 2), 'z': _r(_med([b[1] for b in bb]), 2),
                                'level': bb[len(bb) // 2][2], 'seen': sum(1 for b in bb if b[3]) * 2 > len(bb)}
        if fx and bb and kind == 'position':
            item['metres'] = _r(_med([math.hypot(s['x'] - b[0], s['z'] - b[1]) for s, b in zip(r, bs) if b]), 2)
        items.append(item)

    for r in runs(seq_pos): rec('position', r, 'the footage is more than %.2f m from the blocking' % POS_M)
    for r in runs(seq_on):
        none = ctx.where(cid, track, r[0]['at']) is None
        rec('on-off', r, 'the footage sees her; the blocking has %s' % ('no path for her' if none else 'her off'))
    for r in runs(seq_off): rec('on-off', r, 'the footage puts her in a wing / backstage; the blocking has her on stage')
    for r in runs(seq_lvl): rec('level', r, 'the footage has another level than the blocking')
    return items


def labelled_shot_absences(ctx, track, data, cid, ev_samples):
    """shots a person labelled (any `label` tracklet) that do not name `cid`, while the blocking has her seen and her
    point projects inside that shot's frame for more than POS_S."""
    import floor as F
    items = []
    named_shots = {(s['clip'], s['shot']) for s in ev_samples}
    for clip, ids in (data.get('identities') or {}).items():
        for tid, idn in ids.items():
            m = re.match(r'^s(\d+)-t\d+$', tid)
            if m and idn.get('id') == cid and idn.get('rule') in EVIDENCE_RULES: named_shots.add((clip, int(m.group(1))))
    for clip, ids in (data.get('identities') or {}).items():
        lab_shots = set()
        idx = ctx.frame_index(clip)
        if idx is None: continue
        cal = ctx.calib(clip) or {}
        tid_shot = {}
        for tid, idn in ids.items():
            m = re.match(r'^s(\d+)-t\d+$', tid)
            if m: tid_shot[tid] = int(m.group(1))
            if idn.get('rule') == 'label' and m: lab_shots.add(int(m.group(1)))
        for sid in sorted(lab_shots):
            if (clip, sid) in named_shots: continue
            rec = (cal.get('shots') or {}).get(str(sid)) or {}
            solve = rec.get('solve')
            if not solve or rec.get('skipped'): continue
            fs = solve.get('frameSize') or [1280, 720]
            cam = F.Camera(solve, fs)
            sh = next((s for s in idx['shots'] if s['id'] == sid), None)
            if sh is None: continue
            seq = []
            for i in range(sh['first'], sh['last'] + 1):
                f = idx['frames'][i]
                if f.get('track') != track or f.get('at') is None: continue
                b = ctx.where(cid, track, f['at'])
                inside = False
                if b and b[3]:
                    y = GAL_Y + 0.9 if b[2] == 'gallery' else 0.95
                    uv = cam.project([b[0], y, b[1]])
                    inside = uv is not None and 0 <= uv[0] < fs[0] and 0 <= uv[1] < fs[1]
                seq.append((f['at'], inside, {'at': f['at'], 'clip': clip, 'shot': sid, 'tid': '-', 'rule': 'label',
                                              'conf': 0.3, 'i': i}))
            for r in runs(seq):
                bb = [ctx.where(cid, track, q['at']) for q in r]
                items.append({'kind': 'on-off', 'absent': True,
                              'blocking': {'x': _r(_med([q[0] for q in bb]), 2), 'z': _r(_med([q[1] for q in bb]), 2),
                                           'level': bb[len(bb) // 2][2], 'seen': True},
                              'what': 'a shot a person labelled does not name her, while the blocking '
                              'stands her inside its frame (weak: the labeller may have left her out)',
                              'from': _r(r[0]['at'], 2), 'to': _r(r[-1]['at'], 2), 'seconds': _r(r[-1]['at'] - r[0]['at'], 2),
                              'evidence': {'n': len(r), 'at': [_r(r[0]['at'], 2), _r(r[-1]['at'], 2)], 'conf': 0.3,
                                           'rules': {'label (absent)': len(r)},
                                           'clips': {clip: {'shots': [sid], 'tids': [], 'frames': [r[0]['i'], r[-1]['i']]}}}})
    return items


# ---------------------------------------------------------------- per character: the proposals

def binned(ss):
    """[(at, x, z, level, [samples])] on the 0.2 s grid: conf-weighted mean, majority level."""
    bins = {}
    for s in ss: bins.setdefault(int(round(s['at'] / BIN_S)), []).append(s)
    out = []
    for k in sorted(bins):
        b = bins[k]
        lv = max(sorted({s['level'] for s in b}, key=str), key=lambda v: sum(1 for s in b if s['level'] == v))
        bl = [s for s in b if s['level'] == lv]
        w = [max(1e-3, s['conf'] or 0.0) for s in bl]
        out.append((sum(s['at'] for s in bl) / len(bl), sum(s['x'] * q for s, q in zip(bl, w)) / sum(w),
                    sum(s['z'] * q for s, q in zip(bl, w)) / sum(w), lv, b))
    return out


def dp(pts, eps):
    """Douglas-Peucker over [(x, z)] -> {index: significance} (the ends: inf)."""
    keep = {0: float('inf'), len(pts) - 1: float('inf')}
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        if b - a < 2: continue
        (x1, z1), (x2, z2) = pts[a], pts[b]
        L = math.hypot(x2 - x1, z2 - z1)
        best, bi = -1.0, None
        for i in range(a + 1, b):
            x, z = pts[i]
            d = math.hypot(x - x1, z - z1) if L < 1e-9 else abs((x2 - x1) * (z1 - z) - (x1 - x) * (z2 - z1)) / L
            if d > best: best, bi = d, i
        if best > eps:
            keep[bi] = best; stack += [(a, bi), (bi, b)]
    return keep


def snap(ctx, x, z, level):
    """-> (x, z, metres moved, note).  Onto plain deck (not the house, nothing over 0.15 m) or gallery floor."""
    import numpy as np
    F = ctx.floor()
    if level == 'gallery':
        ok = F.gallery & (np.abs(F.top - GAL_Y) <= 0.1)
    else:
        ok = (F.deck >= -0.1) & (F.deck <= 0.15) & ~F.stair & (F.top < 2.5)
        ok = ok & (np.abs(F.x0 + np.arange(F.nx)[None, :] * F.step) <= 9.5) & \
             (F.z0 + np.arange(F.nz)[:, None] * F.step <= 5.3)
    r, c, inside = F.cell(x, z)
    if inside and ok[int(r), int(c)]: return x, z, 0.0, None
    rr, cc = np.nonzero(ok)
    if not len(rr): return x, z, 0.0, 'no %s floor in the map' % level
    gx = F.x0 + cc * F.step; gz = F.z0 + rr * F.step
    k = int(np.argmin((gx - x) ** 2 + (gz - z) ** 2))
    nx, nz = float(gx[k]), float(gz[k])
    return nx, nz, math.hypot(nx - x, nz - z), 'snapped onto the %s' % level


def proposals(ctx, track, cid, ev_samples, ruled_windows):
    pos = sorted((s for s in ev_samples if positional(s) and not offstage_zone(s['x'], s['z'])), key=lambda s: s['at'])
    out = []
    if not pos: return out
    B = binned(pos)
    segs, cur = [], [B[0]]
    for b in B[1:]:
        if b[0] - cur[-1][0] > GAP_S: segs.append(cur); cur = [b]
        else: cur.append(b)
    segs.append(cur)
    for seg in segs:
        ts = [b[0] for b in seg]
        sm = []
        for i, b in enumerate(seg):
            lo = bisect.bisect_left(ts, b[0] - SMOOTH_S); hi = bisect.bisect_right(ts, b[0] + SMOOTH_S)
            sm.append((_med([q[1] for q in seg[lo:hi]]), _med([q[2] for q in seg[lo:hi]])))
        if ts[-1] - ts[0] < WP_S:
            keep = [len(seg) // 2]
        else:
            sig = dp(sm, DP_M)
            keep = []
            for i in sorted(sig, key=lambda i: (-sig[i], ts[i])):
                if all(abs(ts[i] - ts[j]) >= WP_S - 1e-9 for j in keep): keep.append(i)
            keep.sort()
        for n, i in enumerate(keep):
            t0 = ts[0] if n == 0 else 0.5 * (ts[keep[n - 1]] + ts[i])
            t1 = ts[-1] if n == len(keep) - 1 else 0.5 * (ts[i] + ts[keep[n + 1]])
            sup = [s for b in seg if t0 - 1e-9 <= b[0] <= t1 + 1e-9 for s in b[4]]
            lv = max(sorted({s['level'] for s in sup}, key=str), key=lambda v: sum(1 for s in sup if s['level'] == v))
            x, z = sm[i]
            p = {'at': _r(ts[i], 2), 'x': _r(x), 'z': _r(z), 'level': lv, 'conf': _r(sum(s['conf'] or 0.0 for s in sup) / len(sup)),
                 'span': [_r(t0, 2), _r(t1, 2)], 'evidence': evidence(ctx, track, sup), 'flags': []}
            if lv == 'stair':
                p['flags'].append('on a stair: place it by hand (RULING GA)')
            else:
                sx, sz, moved, note = snap(ctx, x, z, lv)
                if note: p['snapped'] = {'from': [_r(x), _r(z)], 'metres': _r(moved, 2), 'note': note}
                p['x'], p['z'] = _r(sx), _r(sz)
                if moved > SNAP_MAX: p['flags'].append('snapped %.2f m onto the floor map' % moved)
            b = ctx.where(cid, track, ts[i])
            if b is None: p['blocking'] = None; p['status'] = 'not in the blocking (no path for her)'
            else:
                d = math.hypot(p['x'] - b[0], p['z'] - b[1])
                p['blocking'] = {'x': _r(b[0], 2), 'z': _r(b[1], 2), 'level': b[2], 'seen': b[3], 'metres': _r(d, 2)}
                if not b[3]: p['status'] = 'the blocking has her off'
                elif d <= POS_M and (b[2] == lv or 'stair' in (b[2], lv)): p['status'] = 'agrees'
                else: p['status'] = 'differs'
            if p['conf'] < LOOK_CONF: p['flags'].append('do not apply without a look (conf < %.1f)' % LOOK_CONF)
            for rid, chk in ruled_windows:
                if chk[1] == cid and chk[2] == track and chk[3] - 1e-9 <= ts[i] <= chk[4] + 1e-9:
                    p['ruled'] = rid
                    p['flags'].append('inside the ruled item "%s": never applied' % rid)
            out.append(p)
    return out


# ---------------------------------------------------------------- the rulings

def check_rulings(ctx, track, chars):
    res = []
    for R in RULINGS:
        mine = [c for c in R['checks'] if c[2] == track]
        if not mine: continue
        rr = {'id': R['id'], 'title': R['title'], 'cite': R['cite'], 'checks': []}
        for c in mine:
            kind, cid, tr, lo, hi = c[:5]
            ss = [s for s in chars.get(cid, []) if lo - 1e-9 <= s['at'] <= hi + 1e-9]
            ev = [s for s in ss if kind_of(cid, s) == 'evidence' and positional(s)]
            placed = sum(1 for s in ss if kind_of(cid, s) == 'placed')
            seq = []
            for s in sorted(ev, key=lambda s: s['at']):
                if kind == 'point':
                    (px, pz), lv = c[5], c[6]
                    if s['level'] == 'stair': continue
                    bad = math.hypot(s['x'] - px, s['z'] - pz) > POS_M or s['level'] != lv
                else:
                    side = c[5]; b = ctx.where(cid, track, s['at'])
                    if b is None or not b[3] or b[0] * side < 0: continue
                    bad = s['x'] * side < -POS_M
                seq.append((s['at'], bad, s))
            want = '(%s) at (%.2f, %.2f) on the %s' % (cid, c[5][0], c[5][1], c[6]) if kind == 'point' else \
                   '(%s) on stage %s' % (cid, 'right (x < 0)' if c[5] < 0 else 'left (x > 0)')
            k = {'check': '%s %s %.1f-%.1f: %s' % (ctx.names.get(cid, cid), tr, lo, hi, want), 'actor': cid,
                 'evidenceSamples': len(seq), 'placedByBlocking': placed}
            if not seq:
                k['status'] = 'not testable'
                k['why'] = 'no evidence sample of her in the window' + \
                           (' (%d there were placed by the blocking - not evidence)' % placed if placed else '')
            else:
                bad = runs(seq, min(POS_S, 0.5 * (hi - lo)))
                if bad:
                    k['status'] = 'footage disagrees with ruling'
                    k['runs'] = [{'from': _r(r[0]['at'], 2), 'to': _r(r[-1]['at'], 2),
                                  'footage': {'x': _r(_med([s['x'] for s in r]), 2), 'z': _r(_med([s['z'] for s in r]), 2),
                                              'level': r[len(r) // 2]['level']},
                                  'evidence': evidence(ctx, track, r)} for r in bad]
                else:
                    k['status'] = 'footage agrees'
            rr['checks'].append(k)
        res.append(rr)
    return res


# ---------------------------------------------------------------- the pool: formations per 3 s

def shape(pts):
    import numpy as np
    n = len(pts)
    if n == 1: return 'one body'
    P = np.array(pts, dtype=float); c = P.mean(axis=0)
    if n == 2: return 'a pair %.1f m apart' % float(np.hypot(*(P[0] - P[1])))
    if float(np.max(np.hypot(*(P - c).T))) <= 1.2: return 'a cluster (all within 1.2 m)'
    w, v = np.linalg.eigh(np.cov((P - c).T))
    l1, l2 = math.sqrt(max(w[1], 0)), math.sqrt(max(w[0], 0))
    if l2 < 0.35 and l1 > 0.7:
        ang = abs(math.degrees(math.atan2(v[1, 1], v[0, 1]))) % 180
        ang = min(ang, 180 - ang)
        return 'a line %s' % ('across the stage' if ang < 30 else ('up / downstage' if ang > 60 else 'on a diagonal'))
    A = np.c_[2 * P, np.ones(n)]; bb = (P ** 2).sum(axis=1)
    sol = np.linalg.lstsq(A, bb, rcond=None)[0]
    cx, cz = sol[0], sol[1]; r = math.sqrt(max(sol[2] + cx * cx + cz * cz, 0))
    res = np.hypot(P[:, 0] - cx, P[:, 1] - cz) - r
    if 1.0 <= r <= 5.0 and float(np.sqrt((res ** 2).mean())) < 0.3:
        th = sorted(math.degrees(math.atan2(p[0] - cx, p[1] - cz)) % 360 for p in pts)
        gaps = [(th[(i + 1) % n] - th[i]) % 360 for i in range(n)]
        spread = 360 - max(gaps)
        if spread >= 120:
            return '%s r %.1f m about (%.1f, %.1f)' % ('a ring' if spread >= 270 else 'an arc', r, cx, cz)
    return 'scattered'


def formations(ctx, track, pool):
    ss = [s for s in pool if positional(s)]
    if not ss: return []
    out = []
    k0 = int(math.floor(min(s['at'] for s in ss) / WIN_S)); k1 = int(math.floor(max(s['at'] for s in ss) / WIN_S))
    by = {}
    for s in ss: by.setdefault(int(math.floor(s['at'] / WIN_S)), []).append(s)
    for k in range(k0, k1 + 1):
        w = by.get(k)
        if not w: continue
        per_clip = {}
        for s in w: per_clip.setdefault(s['clip'], {}).setdefault(s['tid'], []).append(s)
        clip = max(sorted(per_clip), key=lambda c: len(per_clip[c]))
        # the snapshot: the frame of this clip with the most pooled bodies at once (a tracker that fragments a body
        # into several tracklets over 3 s must not multiply it), each body at its own sample in that frame
        frames = {}
        for tid, L in per_clip[clip].items():
            for s in L: frames.setdefault(round(s['at'], 1), {})[tid] = s
        snap_at = max(sorted(frames), key=lambda t: len(frames[t]))
        bodies = [(s['x'], s['z'], s['level']) for tid, s in sorted(frames[snap_at].items(), key=lambda kv: ident.tid_key(kv[0]))]
        n_tracklets = len(per_clip[clip])
        wings = sum(1 for x, z, lv in bodies if offstage_zone(x, z))
        bodies = [b for b in bodies if not offstage_zone(b[0], b[1])]
        if not bodies: continue
        deck = [(x, z) for x, z, lv in bodies if lv != 'gallery']
        gal = [(x, z) for x, z, lv in bodies if lv == 'gallery']
        mid = (k + 0.5) * WIN_S
        ens_on = sum(1 for a in ctx.blocking.actors if a.startswith('ens') and (ctx.where(a, track, mid) or (0, 0, 0, False))[3])
        all_on = sum(1 for a in ctx.blocking.actors if (ctx.where(a, track, mid) or (0, 0, 0, False))[3])
        f = {'from': _r(k * WIN_S, 1), 'to': _r((k + 1) * WIN_S, 1), 'clip': clip, 'at': _r(snap_at, 1), 'bodies': len(bodies),
             'tracklets': n_tracklets,
             'deck': len(deck), 'gallery': len(gal), 'inWings': wings,
             'sides': {'SR': sum(1 for x, z, _ in bodies if x < -1.5), 'C': sum(1 for x, z, _ in bodies if -1.5 <= x <= 1.5),
                       'SL': sum(1 for x, z, _ in bodies if x > 1.5)},
             'shape': shape(deck) if deck else '-',
             'centroid': [_r(sum(x for x, z, _ in bodies) / len(bodies), 2), _r(sum(z for x, z, _ in bodies) / len(bodies), 2)],
             'extent': {'x': [_r(min(b[0] for b in bodies), 2), _r(max(b[0] for b in bodies), 2)],
                        'z': [_r(min(b[1] for b in bodies), 2), _r(max(b[1] for b in bodies), 2)]},
             'samples': len(w), 'otherClips': {c: len(v) for c, v in sorted(per_clip.items()) if c != clip},
             'blocking': {'ensembleOn': ens_on, 'everyoneOn': all_on}}
        out.append(f)
    return out


# ---------------------------------------------------------------- one track

def compare(ctx, track, in_file=None):
    p = in_file or os.path.join(OUT, track + '.json')
    data = _load(p)
    chars = data.get('characters')
    has_s5 = chars is not None
    chars = chars or {}
    clips = data.get('clips', {})
    head = {'track': track, 'title': ctx.titles.get(track, ''), 'made': datetime.date.today().isoformat(),
            'outFile': rel(p), 'outSha256': _sha(p),
            'blocking': 'assets/hamilton-blocking.json', 'blockingSha256': ctx.blocking_sha, 'stage5': has_s5,
            'clips': {}}
    rows = 0
    for clip, c in sorted(clips.items()):
        pos = c.get('positions', {})
        n = sum(len(v) for v in pos.values()); rows += n
        head['clips'][clip] = {'url': (c.get('source') or {}).get('url', ''),
                               'shots': {s: {k: v.get(k) for k in ('judged', 'moving', 'rms')} for s, v in
                                         sorted((c.get('shots') or {}).items(), key=lambda kv: int(kv[0]))},
                               'tracklets': len(pos), 'positions': n}
    idents = data.get('identities') or {}
    for clip in idents:
        head['clips'].setdefault(clip, {'url': '', 'shots': {}, 'tracklets': 0, 'positions': 0})
        head['clips'][clip]['identified'] = len(idents[clip])
    cnt = {'samples': 0, 'withPosition': 0, 'offMap': 0, 'evidence': 0, 'evidenceWithPosition': 0, 'placedByBlocking': 0,
           'pool': 0, 'other': 0, 'byRule': {}}
    for cid, ss in chars.items():
        for s in ss:
            cnt['samples'] += 1; k = kind_of(cid, s)
            cnt['byRule'][s.get('rule')] = cnt['byRule'].get(s.get('rule'), 0) + 1
            if s.get('x') is not None: cnt['withPosition'] += 1
            if s.get('offMap'): cnt['offMap'] += 1
            if k == 'evidence':
                cnt['evidence'] += 1
                if positional(s): cnt['evidenceWithPosition'] += 1
            elif k == 'placed': cnt['placedByBlocking'] += 1
            else: cnt[k] += 1
    head['stage4Positions'] = rows
    head['counts'] = cnt
    if not has_s5: verdict = 'NO IDENTITIES: stage 5 has not run on this file (run ident.py %s). Nothing was compared.' % track
    elif cnt['evidence'] == 0:
        verdict = ('NO EVIDENCE: not one sample was named by a label, continuity or appearance (no labels exist yet). '
                   'Every named sample was placed by the blocking (fromBlocking) and every other body is pooled. The empty '
                   'disagreement and proposal lists below mean NOTHING WAS TESTED - not that the footage agrees with the '
                   'blocking. Only the pool\'s formation counts and shapes say anything here.')
    else:
        verdict = ('%d evidence samples (%d with a floor position) from labels, continuity or appearance. Where a character '
                   'has none, she was not tested.' % (cnt['evidence'], cnt['evidenceWithPosition']))
    head['verdict'] = verdict

    ruled = [(R['id'], c) for R in RULINGS for c in R['checks'] if c[2] == track]
    per = {}
    for cid in sorted(chars, key=lambda k: (k == POOL, k)):
        if cid == POOL: continue
        ss = sorted(chars[cid], key=lambda s: s['at'])
        ev = [s for s in ss if kind_of(cid, s) == 'evidence']
        placed = [s for s in ss if kind_of(cid, s) == 'placed']
        e = {'name': ctx.name(cid), 'evidence': len(ev), 'evidenceWithPosition': sum(1 for s in ev if positional(s)),
             'evidenceOffMap': sum(1 for s in ev if s.get('offMap')),
             'placedByBlocking': {'samples': len(placed), 'tracklets': len({(s['clip'], s['tid']) for s in placed})},
             'other': sum(1 for s in ss if kind_of(cid, s) == 'other'), 'items': [], 'proposals': []}
        if ev:
            e['items'] = disagreements(ctx, track, cid, ev) + labelled_shot_absences(ctx, track, data, cid, ev)
            e['items'].sort(key=lambda it: (it['from'], it['kind']))
            for it in e['items']:
                for rid, chk in ruled:
                    if chk[1] == cid and chk[2] == track and it['from'] <= chk[4] + 1e-9 and it['to'] >= chk[3] - 1e-9:
                        it['ruled'] = rid
            e['proposals'] = proposals(ctx, track, cid, ev, ruled)
        per[cid] = e
    # a character with no sample at all can still be absent from a labelled shot - only with labels; skipped here
    res = {'format': 'hamilton-vision-diff 1', 'header': head,
           'thresholds': {'positionM': POS_M, 'positionS': POS_S, 'gapS': GAP_S, 'dpM': DP_M, 'waypointS': WP_S,
                          'lookConf': LOOK_CONF, 'applyConf': APPLY_CONF, 'snapMaxM': SNAP_MAX, 'sameTimeS': SAME_T,
                          'fastMps': FAST, 'offstage': '|x| >= %.1f or z <= %.1f' % (OFF_X, OFF_Z), 'windowS': WIN_S},
           'rulings': check_rulings(ctx, track, chars),
           'characters': per,
           'pool': {'samples': len(chars.get(POOL, [])), 'withPosition': sum(1 for s in chars.get(POOL, []) if positional(s)),
                    'tracklets': len({(s['clip'], s['tid']) for s in chars.get(POOL, [])}),
                    'formations': formations(ctx, track, chars.get(POOL, []))}}
    res['summary'] = summarise(res)
    return res


def summarise(res):
    s = {'position': 0, 'on-off': 0, 'level': 0, 'rulingDisagreements': 0, 'rulingsTestable': 0, 'rulingChecks': 0,
         'proposals': 0, 'proposalsLook': 0, 'proposalsDiffer': 0, 'formationWindows': len(res['pool']['formations'])}
    for e in res['characters'].values():
        for it in e['items']: s[it['kind']] += 1
        for p in e['proposals']:
            s['proposals'] += 1
            if p['conf'] < LOOK_CONF: s['proposalsLook'] += 1
            if p['status'] != 'agrees': s['proposalsDiffer'] += 1
    for R in res['rulings']:
        for k in R['checks']:
            s['rulingChecks'] += 1
            if k['status'] != 'not testable': s['rulingsTestable'] += 1
            if k['status'] == 'footage disagrees with ruling': s['rulingDisagreements'] += 1
    return s


# ---------------------------------------------------------------- the .md

def md(res):
    h, c = res['header'], res['header']['counts']
    L = ['# Vision diff - %s %s' % (h['track'], h['title']), '',
         'Made by `tools/vision/compare.py` (RULING GC) on %s from `%s` (sha256 %s...) against `%s` (sha256 %s...). '
         'A brief for a person: nothing here has changed the blocking.' % (h['made'], h['outFile'], h['outSha256'][:12],
                                                                          h['blocking'], h['blockingSha256'][:12]), '',
         '## What the footage had', '', '> **%s**' % h['verdict'], '',
         '| clip | shots used (judged) | tracklets with positions | stage-4 positions | tracklets identified | url |',
         '|---|---|---|---|---|---|']
    for clip, ci in h['clips'].items():
        shots = ', '.join('s%s %s%s' % (s, v.get('judged') or 'unjudged', ' moving' if v.get('moving') else '')
                          for s, v in ci['shots'].items()) or 'none'
        L.append('| %s | %s | %d | %d | %s | %s |' % (clip, shots, ci['tracklets'], ci['positions'],
                                                     ci.get('identified', '-'), ci['url'] or '-'))
    L += ['', 'Samples in `characters`: **%d** (%d with a floor position, %d of them off the floor map).' %
          (c['samples'], c['withPosition'], c['offMap']), '',
          '| kind | samples | what it is |', '|---|---|---|',
          '| evidence (label / continuity / appearance) | %d (%d with a position) | used below |' % (c['evidence'], c['evidenceWithPosition']),
          '| seen, placed by blocking (`fromBlocking`) | %d | NOT evidence: named by the blocking, agrees with it by construction |' % c['placedByBlocking'],
          '| pooled `ens?` | %d | unnamed bodies: formation counts and shapes only |' % c['pool'],
          '', 'By rule: ' + (', '.join('%s %d' % kv for kv in sorted(c['byRule'].items(), key=lambda kv: str(kv[0]))) or 'none') + '.',
          '']
    s = res['summary']
    L += ['Found: %d position, %d on/off, %d level disagreements; %d ruling checks (%d testable, %d disagree); %d proposals '
          '(%d differ from the blocking, %d under conf %.1f); %d formation windows from the pool.' %
          (s['position'], s['on-off'], s['level'], s['rulingChecks'], s['rulingsTestable'], s['rulingDisagreements'],
           s['proposals'], s['proposalsDiffer'], s['proposalsLook'], LOOK_CONF, s['formationWindows']), '']
    # rulings
    L += ['## Ruled items in this track', '']
    if not res['rulings']: L += ['None of the ruled items (listed in `compare.py`) falls in this track.', '']
    for R in res['rulings']:
        L += ['### %s' % R['title'], '', 'Written down in: ' + '; '.join(R['cite']) + '.', '']
        for k in R['checks']:
            line = '- %s - **%s**' % (k['check'], k['status'])
            if k.get('why'): line += ': ' + k['why']
            elif k['status'] == 'footage agrees': line += ' (%d evidence samples)' % k['evidenceSamples']
            L.append(line)
            for r in k.get('runs', []):
                L.append('  - %.2f-%.2f s: the footage has her at (%.2f, %.2f) %s. Evidence: %s. **Reported, not proposed.**' %
                         (r['from'], r['to'], r['footage']['x'], r['footage']['z'], r['footage']['level'], ev_text(r['evidence'])))
        L.append('')
    # characters
    L += ['## Per character', '']
    if not res['characters']: L += ['No named character in this file.', '']
    for cid, e in res['characters'].items():
        L += ['### %s - %s' % (cid, e['name']), '']
        pb = e['placedByBlocking']
        L.append('- Evidence samples: **%d** (%d with a floor position%s).' % (
            e['evidence'], e['evidenceWithPosition'], ', %d off the map' % e['evidenceOffMap'] if e['evidenceOffMap'] else ''))
        L.append('- Seen, placed by blocking: %d sample(s) from %d tracklet(s) (not evidence; not compared).' % (pb['samples'], pb['tracklets']))
        if not e['evidence']:
            L += ['- **Not tested**: no evidence sample. No disagreement can be found and no waypoint proposed.', '']
            continue
        if not e['items']: L.append('- Disagreements: none found in %d evidence samples.' % e['evidence'])
        else:
            L += ['', '| kind | at (s) | for | footage | blocking | what | evidence |', '|---|---|---|---|---|---|---|']
            for it in e['items']:
                f = it.get('footage'); b = it.get('blocking')
                fs = '(%.2f, %.2f) %s' % (f['x'], f['z'], f['level']) if f else                     ('not named in a labelled shot' if it.get('absent') else 'seen, no position')
                bs = ('(%.2f, %.2f) %s%s' % (b['x'], b['z'], b['level'], '' if b['seen'] else ', off')) if b else 'no path'
                if it.get('metres') is not None: bs += ', %.2f m apart' % it['metres']
                L.append('| %s | %.2f-%.2f | %.1f s | %s | %s | %s | %s |' % (it['kind'], it['from'], it['to'], it['seconds'],
                                                                            fs, bs, it['what'] + (
                    ' (inside the ruled item "%s": see Ruled items - reported, not proposed)' % it['ruled'] if it.get('ruled') else ''),
                                                                            ev_text(it['evidence'])))
        if e['proposals']:
            L += ['', 'Proposed waypoints (the footage\'s track, Douglas-Peucker %.1f m, one per %.0f s at most, snapped):' % (DP_M, WP_S), '',
                  '| at (s) | x | z | level | conf | the blocking then | status | flags | evidence |', '|---|---|---|---|---|---|---|---|---|']
            for p in e['proposals']:
                b = p['blocking']
                bs = ('(%.2f, %.2f) %s%s, %.2f m' % (b['x'], b['z'], b['level'], '' if b['seen'] else ' off', b['metres'])) if b else 'no path'
                fl = list(p['flags'])
                if p.get('snapped') and p['snapped']['metres'] > 0: fl.append('snapped %.2f m' % p['snapped']['metres'])
                L.append('| %.2f | %.2f | %.2f | %s | %.2f | %s | %s | %s | %s |' % (
                    p['at'], p['x'], p['z'], p['level'], p['conf'], bs, p['status'], '; '.join(fl) or '-', ev_text(p['evidence'])))
        L.append('')
    # the pool
    P = res['pool']
    L += ['## The pool (`ens?`): formations per %.0f s window' % WIN_S, '',
          '%d pooled samples (%d with a position) from %d tracklets. A pooled body has no name - it may be one of the '
          'company OR a principal nobody labelled - so these are counts and shapes, never waypoints. "Blocking on" is how '
          'many of the company (ens1-10) and how many people in all the blocking has seen at the window\'s middle, for '
          'comparison only. Each window is a snapshot: the frame with the most pooled bodies at once (its time in '
          'brackets), so a body the tracker split into several tracklets is counted once; the stage-2 detector misses '
          'many bodies in the widest shots (VISION.md section 4, stage 2), so a count is a floor, not the company.' %
          (P['samples'], P['withPosition'], P['tracklets']), '']
    if P['formations']:
        L += ['| window (s) | bodies on stage (at s) | tracklets in window | deck / gallery | SR / C / SL | in a wing | shape (deck) | centroid | x range | z range | blocking on (company / all) | clip |',
              '|---|---|---|---|---|---|---|---|---|---|---|---|']
        for f in P['formations']:
            L.append('| %.0f-%.0f | %d (%.1f) | %d | %d / %d | %d / %d / %d | %d | %s | (%.1f, %.1f) | %.1f..%.1f | %.1f..%.1f | %d / %d | %s%s |' % (
                f['from'], f['to'], f['bodies'], f['at'], f['tracklets'], f['deck'], f['gallery'], f['sides']['SR'], f['sides']['C'], f['sides']['SL'],
                f['inWings'], f['shape'], f['centroid'][0], f['centroid'][1], f['extent']['x'][0], f['extent']['x'][1], f['extent']['z'][0],
                f['extent']['z'][1], f['blocking']['ensembleOn'], f['blocking']['everyoneOn'], f['clip'],
                (' (+ %s)' % ', '.join('%s %d samples' % kv for kv in f['otherClips'].items())) if f['otherClips'] else ''))
    else: L.append('No pooled body with a floor position.')
    T = res['thresholds']
    L += ['', '## Thresholds', '',
          'Position: more than %.2f m for more than %.0f s (a gap over %.0f s ends a run). Proposals: Douglas-Peucker at %.1f m, '
          'at most one waypoint per %.0f s, conf = the mean of the samples it stands on, under %.1f "do not apply without a '
          'look", `--apply` from %.1f (default). Offstage: %s. Snapped more than %.1f m: a look. Formation windows %.0f s.' %
          (T['positionM'], T['positionS'], T['gapS'], T['dpM'], T['waypointS'], T['lookConf'], T['applyConf'], T['offstage'],
           T['snapMaxM'], T['windowS']), '']
    return '\n'.join(L)


def write_diff(res, ddir):
    os.makedirs(ddir, exist_ok=True)
    t = res['header']['track']
    with open(os.path.join(ddir, t + '.json'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(json.dumps(res, ensure_ascii=False, indent=1) + '\n')
    with open(os.path.join(ddir, t + '.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(md(res))
    return os.path.join(ddir, t + '.md')


# ---------------------------------------------------------------- --apply: a new `# VISION:` section in the generator

ANCHORS = {   # segment -> (the line the section goes before, the loop body that inserts one waypoint, in its own form)
    1: ("notes = open(os.path.join(HERE, 'notes.txt'), encoding='utf-8').read().strip()",
        ["_w = {'t': round(T0[_tr] + _at, 3), 'x': _x, 'z': _z}",
         "if _lv == 'gallery': _w['y'] = GAL",
         "if _lab: _w['label'] = _lab",
         "W[_a].insert(sum(1 for _q in W[_a] if _q['t'] < _w['t']), _w)"]),
    2: ('problems = []\nfor a, lst in W.items():\n    lst.sort(key=key)',
        ['_d = {"track": _tr, "at": round(_at, 2), "x": _x, "z": _z}',
         'if _lv == "gallery": _d["y"] = "gallery"',
         'if _lab: _d["label"] = _lab',
         'W[_a].append(_d)   # the sort below puts it in time order']),
    3: ('TI = {t: i for i, t in enumerate(TRACKS)}',
        ['_d = {"track": _tr, "at": round(_at, 2), "x": _x, "z": _z}',
         'if _lv == "gallery": _d["y"] = "gallery"',
         'if _lab: _d["label"] = _lab',
         'P.setdefault(_a, []).append(_d)   # the sort below puts it in time order']),
    4: ('problems = []\nout = {}',
        ["_w = dict(t=float(OFFS[_tr] + _at), x=_x, z=_z, face=None, dwell=None, off=False,",
         "          y='gallery' if _lv == 'gallery' else None, label=_lab)",
         "W[_a].insert(sum(1 for _q in W[_a] if _q['t'] < _w['t']), _w)"]),
    5: ("if __name__ == '__main__':\n    msgs = checks(verbose=True)",
        ["_w = dict(g=START[_tr] + _at, x=_x, z=_z, lvl='g' if _lv == 'gallery' else 'd', dwell=None, facing=None,",
         "          off=False, label=_lab)",
         "W.setdefault(_a, []).insert(sum(1 for _q in W.get(_a, []) if _q['g'] < _w['g']), _w)"]),
    6: ('# ---------------------------------------------------------------- write\nfor a, path in W.items():',
        ['_p = {"track": _tr, "at": round(_at, 2), "x": _x, "z": _z}',
         'if _lv == "gallery": _p["y"] = "gallery"',
         'if _lab: _p["label"] = _lab',
         '_k = (ORDER.index(_tr), _p["at"])   # put in time order here: the check below does not sort',
         'W.setdefault(_a, []).insert(sum(1 for _q in W[_a] if (ORDER.index(_q["track"]), _q["at"]) < _k), _p)']),
    7: ('# ---------------------------------------------------------------- write\ndef r3(v): return round(v, 3)',
        ["if _a not in A: actor(_a)",
         "_d = {'g': G(_tr, _at), 'x': _x, 'z': _z}",
         "if _lv == 'gallery': _d['y'] = 'gallery'",
         "if _lab: _d['label'] = _lab",
         "A[_a].w.insert(sum(1 for _q in A[_a].w if _q['g'] < _d['g']), _d)"]),
    8: ("# =====================================================================================\n"
        "out = {'segment': 8, 'tracks': ORDER, 'waypoints': {}, 'notes': ''}",
        ["_w = {'track': _tr, 'at': round(_at, 2), 'x': round(_x, 3), 'z': round(_z, 3)}",
         "if _lv == 'gallery': _w['y'] = 'gallery'",
         "if _lab: _w['label'] = _lab",
         "_w['_T'] = OFS[_tr] + _w['at']",
         "A.setdefault(_a, []).insert(sum(1 for _q in A.get(_a, []) if _q['_T'] < _w['_T']), _w)"]),
}


def segment_of(track):
    for seg, tracks, gen in SEGMENTS:
        if track in tracks: return seg, tracks, gen
    raise SystemExit('track %s is in no segment' % track)


def qualifying(ctx, res, min_conf):
    """-> ([(cid, p, label)], [(cid, p, why)]) - the proposals --apply writes, and those it leaves out (why)."""
    track = res['header']['track']
    seg, tracks, _ = segment_of(track)
    st = ctx.starts[track]
    take, skip = [], []
    for cid, e in res['characters'].items():
        cand = []
        for p in e['proposals']:
            why = None
            if p['conf'] < min_conf: why = 'conf %.2f < %.2f' % (p['conf'], min_conf)
            elif p['status'] == 'agrees': why = 'agrees with the blocking'
            elif p['level'] == 'stair': why = 'on a stair'
            elif p.get('ruled'): why = 'inside the ruled item "%s"' % p['ruled']
            elif p.get('snapped') and p['snapped']['metres'] > SNAP_MAX: why = 'snapped %.2f m' % p['snapped']['metres']
            if why: skip.append((cid, p, why))
            else: cand.append(p)
        if not cand: continue
        ex = []                                     # (T, x, z, off, dwell) - the existing waypoints, show clock
        for w in ctx.raw.get(cid, []):
            if w.get('track') in ctx.starts:
                ex.append((ctx.starts[w['track']] + float(w['at']), float(w['x']), float(w['z']), bool(w.get('off')),
                           None if w.get('dwell') is None else float(w['dwell'])))
        ex.sort(key=lambda e: e[0])
        ok = []
        for p in cand:
            T = st + p['at']
            if any(abs(e[0] - T) < SAME_T for e in ex):
                skip.append((cid, p, 'within %.2f s of an existing waypoint' % SAME_T)); continue
            prev = [e for e in ex if e[0] < T]
            if prev and prev[-1][4] is not None and prev[-1][0] + prev[-1][4] > T - 1e-6:
                skip.append((cid, p, 'inside the %.2f s dwell of the existing waypoint at %.2f (that is an edit of it, '
                             'not an addition)' % (prev[-1][4], prev[-1][0] - st))); continue
            ok.append(p)
        # the legs as the merge judges them (a dwell leaves at T + dwell, else the whole interval; off to off unseen)
        merged = sorted(ex + [(st + p['at'], p['x'], p['z'], False, None, k) for k, p in enumerate(ok)], key=lambda e: e[0])
        legs = {}
        for a_, b_ in zip(merged, merged[1:]):
            if a_[3] and b_[3]: continue
            dt = b_[0] - a_[0]
            walk = dt - (min(a_[4], dt) if a_[4] is not None else 0.0)
            v = math.hypot(b_[1] - a_[1], b_[2] - a_[2]) / walk if walk > 1e-6 else float('inf')
            for e in (a_, b_):
                if len(e) > 5: legs[e[5]] = max(legs.get(e[5], 0.0), v)
        bad = {k for k, v in legs.items() if v > FAST}
        for k, p in enumerate(ok):
            if k in bad:
                skip.append((cid, p, 'a leg of %.2f m/s to a neighbour (over %.1f)' % (legs[k], FAST))); continue
            T = st + p['at']
            # the merge wants a segment's first waypoint per actor labelled: label it only when it would be the first
            lo = ctx.starts[tracks[0]] - 10.0
            hi = ctx.starts[SEGMENTS[seg][1][0]] - 1e-6 if seg < len(SEGMENTS) else float('inf')
            seg_ex = [e for e in ex if lo - 1e-9 <= e[0] <= hi]
            need = not seg_ex or T < seg_ex[0][0]
            take.append((cid, p, ctx.label_at(cid, T) if need else None))
    take.sort(key=lambda t: (t[0], t[1]['at']))
    return take, skip


def section(ctx, res, take, min_conf):
    track = res['header']['track']
    seg, tracks, gen = segment_of(track)
    var = 'VISION_' + track.replace('-', '_')
    L = ['# VISION: %s begin - proposals from tools/vision/diffs/%s.json (tools/vision/compare.py --apply --min-conf %.2f,' %
         (track, track, min_conf),
         '# %s). The footage\'s waypoints, for a person to accept or delete (RULING GC): NEW waypoints only, between the' %
         res['header']['made'],
         '# existing ones; nothing above is changed. Delete this whole section to drop them. Each line: (actor, track, at,',
         '# x, z, level, label) # conf, the evidence (clip, shots, tracklets, frames), and the blocking there before.',
         '%s = [' % var]
    for cid, p, lab in take:
        b = p['blocking']
        bs = ('blocking (%.2f, %.2f)%s %.2f m away' % (b['x'], b['z'], '' if b['seen'] else ' off', b['metres'])) if b else 'no path'
        ev = '; '.join('%s s%s %s %s' % (c, ','.join(str(x) for x in ci['shots']), ','.join(ci['tids']),
                                         ('f%d-%d' % tuple(ci['frames'])) if ci['frames'] else '')
                       for c, ci in p['evidence']['clips'].items())
        line = '    (%r, %r, %.2f, %.3f, %.3f, %r, %r),' % (cid, track, p['at'], p['x'], p['z'], p['level'], lab)
        L.append(line + '   # conf %.2f, %s; %s' % (p['conf'], ev, bs))
    L += [']', 'for _a, _tr, _at, _x, _z, _lv, _lab in %s:' % var]
    L += ['    ' + s for s in ANCHORS[seg][1]]
    L += ['# VISION: %s end' % track, '']
    txt = '\n'.join(L)
    if any(ord(ch) > 127 for ch in txt): txt = txt.encode('ascii', 'replace').decode('ascii')
    return txt


def apply(ctx, res, min_conf, dry, gen_root):
    track = res['header']['track']
    seg, tracks, gen = segment_of(track)
    path = os.path.join(gen_root, gen)
    take, skip = qualifying(ctx, res, min_conf)
    print('--apply %s (min conf %.2f): %d proposal(s) qualify, %d left out -> %s' % (track, min_conf, len(take), len(skip),
                                                                                     rel(path)))
    for cid, p, why in skip: print('  left out: %s %.2f (%.2f, %.2f) conf %.2f - %s' % (cid, p['at'], p['x'], p['z'], p['conf'], why))
    with open(path, encoding='utf-8', newline='') as f: src = f.read()
    beg = re.compile(r'^# VISION: %s begin.*?^# VISION: %s end\n\n?' % (re.escape(track), re.escape(track)), re.S | re.M)
    had = bool(beg.search(src))
    src0 = beg.sub('', src)
    if not take:
        print('nothing qualifies: no section written%s' % ((' (the old VISION section for %s %s)' % (
            track, 'would be removed' if dry else 'was removed')) if had else ''))
        if had and not dry:
            with open(path, 'w', encoding='utf-8', newline='') as f: f.write(src0)
        return None
    anchor = ANCHORS[seg][0]
    if src0.count(anchor) != 1:
        raise SystemExit('the anchor for segment %d is not found exactly once in %s - the generator changed; place the '
                         'section by hand before its write:\n%s' % (seg, gen, anchor))
    txt = section(ctx, res, take, min_conf)
    new = src0.replace(anchor, txt + '\n' + anchor, 1)
    print('%s a section of %d line(s) before:\n    %s' % ('would insert' if dry else ('replaced the old section with' if had else 'inserted'),
                                                       txt.count('\n'), anchor.splitlines()[0]))
    print('-' * 100); print(txt); print('-' * 100)
    if not dry:
        with open(path, 'w', encoding='utf-8', newline='') as f: f.write(new)
        print('then: python -I %s && python -I tools/blocking-merge.py tools/blocking/segments --check' % rel(path))
    return txt


# ---------------------------------------------------------------- main

def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('track', nargs='?', help='album track id, e.g. 2-05')
    ap.add_argument('--all', action='store_true', help='every tools/vision/out/*.json')
    ap.add_argument('--apply', action='store_true', help='write the qualifying proposals into a new # VISION: section')
    ap.add_argument('--min-conf', type=float, default=APPLY_CONF)
    ap.add_argument('--dry', action='store_true', help='with --apply: show the section, write nothing')
    ap.add_argument('--in', dest='in_file', help='an out file to read instead of tools/vision/out/<track>.json')
    ap.add_argument('--diffs', default=DIFFS, help='where the .md and .json go (default tools/vision/diffs)')
    ap.add_argument('--gen-root', default=GEN_ROOT, help='the tools/blocking to apply into (a copy, for a test)')
    a = ap.parse_args(argv)
    if a.all == bool(a.track): ap.error('give a track or --all')
    if a.apply and a.all: ap.error('--apply takes one track')
    ctx = Context()
    tracks = [a.track] if a.track else sorted(fn[:-5] for fn in os.listdir(OUT) if fn.endswith('.json'))
    rows = []
    for t in tracks:
        res = compare(ctx, t, a.in_file)
        p = write_diff(res, a.diffs)
        rows.append((t, res))
        if not a.all:
            s, c = res['summary'], res['header']['counts']
            print('%s: %s' % (t, res['header']['verdict']))
            print('  samples %d: evidence %d, placed by blocking %d, pool %d | items: position %d, on/off %d, level %d | '
                  'rulings %d/%d testable, %d disagree | proposals %d (%d differ, %d under %.1f) | formation windows %d' %
                  (c['samples'], c['evidence'], c['placedByBlocking'], c['pool'], s['position'], s['on-off'], s['level'],
                   s['rulingsTestable'], s['rulingChecks'], s['rulingDisagreements'], s['proposals'], s['proposalsDiffer'],
                   s['proposalsLook'], LOOK_CONF, s['formationWindows']))
            print('-> %s (+ .json)' % rel(p))
        if a.apply: apply(ctx, res, a.min_conf, a.dry, a.gen_root)
    if a.all:
        print('%-6s %6s %6s %6s %6s | %4s %4s %4s | %9s | %5s %5s | %5s' % ('track', 'samp', 'evid', 'placed', 'pool', 'pos',
              'onof', 'lvl', 'ruled', 'prop', 'look', 'forms'))
        for t, res in rows:
            s, c = res['summary'], res['header']['counts']
            print('%-6s %6d %6d %6d %6d | %4d %4d %4d | %3d/%2d/%2d | %5d %5d | %5d' % (
                t, c['samples'], c['evidence'], c['placedByBlocking'], c['pool'], s['position'], s['on-off'], s['level'],
                s['rulingDisagreements'], s['rulingsTestable'], s['rulingChecks'], s['proposals'], s['proposalsLook'],
                s['formationWindows']))
        print('ruled = disagree / testable / checks.  -> %s/<track>.md + .json' % rel(a.diffs))


if __name__ == '__main__':
    main()
