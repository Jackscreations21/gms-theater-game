#!/usr/bin/env python3
"""assets/hamilton-eos.json from the ETC Hamilton Programming Project's show file.

    python -I tools/hamilton-cues.py [<Eos CSV>] [assets/hamilton-eos.json]

<Eos CSV> is the Eos Nomad "Export > CSV" of the show file (default
`~/Downloads/The Hamilton Programming Project - Intro - Rev A.csv`).  ETC's,
NON-COMMERCIAL (see assets/README.md); it is not in this repository and must
not be copied in.  Standard library only.  The output shape is section 1 of
docs/hamilton-cues-format.md; read that first.

WHAT THE CSV HOLDS (Eos 3.x export)
-----------------------------------
START_LEVELS   one row per (target, part, channel, parameter): the stored
               value.  LEVEL is already the RESOLVED number even when
               LEVEL_REFERENCE_* names a preset / palette / cue; we keep the
               number and record the reference as `ref`.  TRACK_TYPE: 'b'/'B'
               = a blocked value (explicit anyway; dropped), 'M' = a MARK
               (move-in-dark): the value is pre-set here, while dark, for the
               cue LEVEL_REFERENCE_ID names (kept as PARAMS `mark`).  EFFECT
               = the effect running on that parameter (0 = effect stopped).
START_TARGETS  cues (a header row per cue, PART_NUMBER empty, then one row
               per part), groups, presets, palettes, effects.  A Group row's
               TIME_DATA column carries its CHANNEL LIST ("101>104", "121 116
               111", "(45 51) (41 57 52)" - brackets are Eos sub-groups).
START_CHANNELS the patch: channel -> Eos fixture type, label, gel.
START_FIXTURES the parameters of each Eos fixture type.

THE FRAME
---------
X/Y/Z_Focus are ETC/Augment3d WORLD metres (Z up, +Y upstage) - the frame
tools/hamilton-rig.py reads fixture positions in.  So the same map:
    set.x = X,   set.y = Z + 0.2651,   set.z = 3.96 - Y
Checked: the tilt a mover would need from its hamilton-rig.json position to
its stored focus point agrees with Eos's stored Tilt to about 1 deg
(viper 1, cue 0.5: 23.7 vs 24.7; cue 24: 37.3 vs 38.6; VL3500 71: 18.4 vs
19.3).  NB the CSV's own LOCATION_X/Y/Z agree with that frame for the
conventionals but NOT for the movers (theirs sit at Z 0, offset by
(-3.58, -2.76, 8.55)); the movers' CSV locations are ignored.

UNITS (Eos-native unless said)
------------------------------
Zoom is DEGREES (Viper 10-44 / 10-55, X4 7-49.2, VL3500 10-50).  Gobo_Select
is a slot number (0.5 = home/open), turned into our gobo name by voting over
labelled beam palettes (see learn_gobos).  Gobo_Index/Speed is read by
Gobo_Wheel_Mode: 25 = INDEX (value = degrees, emitted as `goboIdx`,
goboRot 0); 63 / 76 = ROTATE (value taken as RPM: goboRot = 6 x value deg/s,
raw kept as `goboSpd`).  That reading is an inference - see summary.lossy.
"""
import collections
import csv
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
DEFAULT_CSV = os.path.join(os.path.expanduser('~'), 'Downloads',
                           'The Hamilton Programming Project - Intro - Rev A.csv')
DEFAULT_OUT = os.path.join(REPO, 'assets', 'hamilton-eos.json')
RIG = os.path.join(REPO, 'assets', 'hamilton-rig.json')

SOURCE = ("ETC Eos Nomad CSV export of The Hamilton Programming Project - Intro - Rev A "
          "(non-commercial, see assets/README.md)")
FRAME = ("focus points are SET-LOCAL metres (the set GLB's frame, the same transform as "
         "hamilton-rig.json: (x, z+0.2651, 3.96-y) from Eos X/Y/Z)")

UTILITY_FROM = 1900          # cues at or above this are utility position cues, not show
ISLAND_GAP = 15.0            # a jump in cue number bigger than this starts a new island
GOBO_INDEX_MODE = 25.0       # Gobo_Wheel_Mode value meaning "index" (see docstring)
RPM_TO_DEGS = 6.0

# our gobo names (midtown.html LX_GOBOS), and the beam-palette label spellings that mean them
GOBO_NAMES = ['Open', 'Construction', 'Linear', 'Dust', 'Cobble stone', 'Alpha', 'Vignette', 'Nite sky',
              'Brains', 'Pebbles', 'Blocks', 'Tribal', 'Leaves', 'Slot', 'Square', 'Pickup sticks']
GOBO_ALIASES = {'open open': 'Open', 'open static': 'Open', 'cobble': 'Cobble stone',
                'construct 1': 'Construction', 'nite sky': 'Nite sky'}

LIST_KIND = {'Preset': 'preset', 'Color_Palette': 'cp', 'Beam_Palette': 'bp',
             'Focus_Palette': 'fp', 'Intensity_Palette': 'ip', 'Cue': 'cue'}
SECTION = {'Preset': 'presets', 'Color_Palette': 'colorPalettes', 'Beam_Palette': 'beamPalettes',
           'Focus_Palette': 'focusPalettes', 'Intensity_Palette': 'intensityPalettes'}
EFFECT_KIND = {'Intens': 'intensity', 'Pan': 'focus', 'Tilt': 'focus', 'Red': 'color', 'Green': 'color',
               'Blue': 'color', 'Gobo_Index/Speed': 'image'}
KEPT = {'Intens', 'Red', 'Green', 'Blue', 'White', 'Amber', 'Lime', 'Indigo', 'Cyan', 'Magenta', 'Yellow',
        'CTO', 'Zoom', 'Edge', 'Iris', 'Pan', 'Tilt', 'X_Focus', 'Y_Focus', 'Z_Focus', 'Gobo_Select',
        'Gobo_Index/Speed', 'Gobo_Wheel_Mode', 'Color_Select', 'Diffusion'}


def num(s):
    """'5.0000' -> 5, '2.11' -> 2.11, '' -> None."""
    s = (s or '').strip()
    if not s:
        return None
    return rnd(float(s))


def rnd(x, nd=3):
    x = round(float(x), nd)
    if x == int(x):
        return int(x)
    return x


def qkey(q):
    return float(q)


def read_csv(path):
    secs, cur, hdr = {}, None, None
    with open(path, newline='', encoding='utf-8-sig') as f:
        for row in csv.reader(f):
            if row and row[0].startswith('START_'):
                cur, hdr = row[0][6:], None
                secs[cur] = []
                continue
            if row and row[0].startswith('END_'):
                cur = None
                continue
            if cur is None:
                continue
            if hdr is None:
                hdr = row
                continue
            secs[cur].append(dict(zip(hdr, row)))
    return secs


def parse_chan_list(s):
    """'101>104 (45 51)' -> ([101, 102, 103, 104, 45, 51], [[45, 51]] sub-groups)."""
    flat, sets = [], []
    for m in re.finditer(r'\(([^)]*)\)|(\d+(?:>\d+)?)', s):
        body = m.group(1) if m.group(1) is not None else m.group(2)
        part = []
        for tok in body.split():
            if '>' in tok:
                a, b = (int(t) for t in tok.split('>'))
                part.extend(range(a, b + 1) if a <= b else range(a, b - 1, -1))
            else:
                part.append(int(tok))
        if m.group(1) is not None:
            sets.append(part)
        for c in part:
            if c not in flat:
                flat.append(c)
    return flat, sets


def focus_point(x, y, z):
    return [rnd(x), rnd(z + 0.2651), rnd(3.96 - y)]


class Conv:
    """Eos parameter rows of one (target, part, channel) -> one PARAMS dict."""

    def __init__(self, eos_type_params, gobo_table):
        self.tp = eos_type_params
        self.gobos = gobo_table

    def params(self, eos_type, rows, gobo_mode=None):
        """rows: {param: row}.  gobo_mode: the tracked Gobo_Wheel_Mode when the rows lack one."""
        v = {p: num(r['LEVEL']) for p, r in rows.items()}
        for p in v:                 # 0.1 of a percent / degree is plenty; focus keeps millimetres
            if v[p] is not None and p not in ('X_Focus', 'Y_Focus', 'Z_Focus'):
                v[p] = rnd(v[p], 1)
        out = {}
        cmy_type = 'Magenta' in self.tp.get(eos_type, ())
        if v.get('Intens') is not None:
            out['i'] = v['Intens']
        if any(v.get(k) is not None for k in ('X_Focus', 'Y_Focus', 'Z_Focus')):
            if all(v.get(k) is not None for k in ('X_Focus', 'Y_Focus', 'Z_Focus')):
                out['focus'] = focus_point(v['X_Focus'], v['Y_Focus'], v['Z_Focus'])
            else:   # partial XYZ: keep what there is, in Eos axes
                out['focusEos'] = [v.get('X_Focus'), v.get('Y_Focus'), v.get('Z_Focus')]
        for k, o in (('Pan', 'pan'), ('Tilt', 'tilt')):
            if v.get(k) is not None:
                out[o] = v[k]
        if cmy_type:
            if any(v.get(k) is not None for k in ('Cyan', 'Magenta', 'Yellow')):
                out['cmy'] = [v.get('Cyan'), v.get('Magenta'), v.get('Yellow')]
        elif v.get('Cyan') is not None:
            out['cyan'] = v['Cyan']
        if any(v.get(k) is not None for k in ('Red', 'Green', 'Blue')):
            out['rgb'] = [v.get('Red'), v.get('Green'), v.get('Blue')]
        for k, o in (('White', 'w'), ('Amber', 'a'), ('Lime', 'lime'), ('Indigo', 'indigo'), ('CTO', 'cto'),
                     ('Zoom', 'zoom'), ('Edge', 'edge'), ('Iris', 'iris'), ('Diffusion', 'frost')):
            if v.get(k) is not None:
                out[o] = v[k]
        if v.get('Color_Select') is not None:
            out['cw'] = 'open' if v['Color_Select'] == 0.5 else 'slot:%s' % v['Color_Select']
        if v.get('Gobo_Select') is not None:
            out['gobo'] = self.gobos.get(eos_type, {}).get(v['Gobo_Select'], 'slot:%s' % v['Gobo_Select'])
        mode = v.get('Gobo_Wheel_Mode', gobo_mode)
        if v.get('Gobo_Index/Speed') is not None:
            g = v['Gobo_Index/Speed']
            if mode is None or mode == GOBO_INDEX_MODE:
                out['goboIdx'] = g
                out['goboRot'] = 0
            else:
                out['goboSpd'] = g
                out['goboRot'] = rnd(g * RPM_TO_DEGS, 1)
        elif 'Gobo_Wheel_Mode' in rows and mode == GOBO_INDEX_MODE:
            out['goboRot'] = 0
        # where the values came from
        refs = []
        for p in sorted(rows):
            r = rows[p]
            kind = LIST_KIND.get(r['LEVEL_REFERENCE_TYPE_AS_TEXT'])
            if kind and r['TRACK_TYPE'] != 'M':
                s = '%s %s' % (kind, r['LEVEL_REFERENCE_ID'])
                if s not in refs:
                    refs.append(s)
        if refs:
            out['ref'] = ', '.join(refs)
        marks = sorted({r['LEVEL_REFERENCE_ID'] for r in rows.values() if r['TRACK_TYPE'] == 'M'}, key=qkey)
        if marks:
            out['mark'] = marks[0] if len(marks) == 1 else marks
        if all(r['TRACK_TYPE'] in ('b', 'B') for r in rows.values()):
            out['blk'] = True       # all blocked: Eos's hard copy of the tracked state, not a move
        fx = sorted({num(r['EFFECT']) for r in rows.values() if r['EFFECT'].strip()})
        if fx:
            out['fx'] = fx[0] if len(fx) == 1 else fx
        ft = [num(r['FADE_TIME']) for r in rows.values() if num(r['FADE_TIME'])]
        dt = [num(r['DELAY_TIME']) for r in rows.values() if num(r['DELAY_TIME'])]
        if ft:
            out['time'] = max(ft)
        if dt:
            out['delay'] = max(dt)
        return out


def learn_gobos(levels, targets, ftype):
    """(Eos type, Gobo_Select) -> our name, by a channel-count-weighted vote over beam palettes / presets
    whose label is one of our gobo names.  Returns (table, evidence)."""
    labels = {(t['TARGET_TYPE_AS_TEXT'], t['TARGET_ID']): t['LABEL'].strip() for t in targets}
    canon = {n.lower(): n for n in GOBO_NAMES}
    canon.update(GOBO_ALIASES)
    votes = collections.defaultdict(collections.Counter)
    seen = collections.defaultdict(set)
    for r in levels:
        if r['PARAMETER_TYPE_AS_TEXT'] != 'Gobo_Select' or r['TARGET_TYPE_AS_TEXT'] not in ('Beam_Palette', 'Preset'):
            continue
        lab = labels.get((r['TARGET_TYPE_AS_TEXT'], r['TARGET_ID']), '').lower()
        name = canon.get(re.sub(r'\s+', ' ', lab))
        if not name:
            continue
        val = num(r['LEVEL'])
        et = ftype.get(r['CHANNEL'])
        votes[(et, val)][name] += 1
        seen[(et, val, name)].add('%s %s' % (LIST_KIND[r['TARGET_TYPE_AS_TEXT']], r['TARGET_ID']))
    table, evidence = collections.defaultdict(dict), []
    for (et, val), c in sorted(votes.items(), key=lambda kv: (kv[0][0] or '', kv[0][1])):
        ranked = sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))
        top, n = ranked[0]
        if len(ranked) > 1 and ranked[1][1] == n:
            name = None            # a tie: cannot learn it
        else:
            name = top
        if name:
            table[et][val] = name
        evidence.append({'eosType': et, 'slot': val, 'name': name or 'slot:%s' % val,
                         'votes': {k: [v, sorted(seen[(et, val, k)])] for k, v in ranked}})
    for et in list(table):          # 0.5 is Eos's home slot: the open beam
        table[et].setdefault(0.5, 'Open')
        # 6.4 is the wheel's far end past the last gobo: the beam palettes that hold it are labelled for the
        # OTHER wheel (Pebbles, Blocks, Tribal, Leaves, Alpha, Open alike), so wheel 1 is open there.
        table[et].setdefault(6.4, 'Open')
    # Both Viper profiles (hamilton__main, Hamilton_91-100) carry the same general gobo load; the labelled palettes
    # only ever name the main profile's channels, so the other profile learns nothing on its own and every cue on
    # channels 91-100 came out as "slot:N" (the player then kept the previous gobo). Share the table.
    vipers = [et for et in ftype.values() if et and et.lower().startswith('mac_viper')]
    best = max((et for et in set(vipers) if et in table), key=lambda et: len(table[et]), default=None)
    if best:
        for et in set(vipers):
            for slot, name in table[best].items():
                table[et].setdefault(slot, name)
    return table, evidence


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CSV
    out_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_OUT
    secs = read_csv(src)
    L, T, C, F = secs['LEVELS'], secs['TARGETS'], secs['CHANNELS'], secs['FIXTURES']

    # ---- the patch
    tparams = collections.defaultdict(list)
    for r in F:
        if r['PARAMETER_TYPE_TEXT_SHORT'] not in tparams[r['FIXTURE_TYPE_NAME']]:
            tparams[r['FIXTURE_TYPE_NAME']].append(r['PARAMETER_TYPE_TEXT_SHORT'])
    rig = json.load(open(RIG, encoding='utf-8'))['units']
    ourtype = {}
    for u in rig:
        for c in u['channels']:
            ourtype.setdefault(int(c), u['type'])
    chans = {}
    ftype = {}
    for r in C:
        c = int(r['CHANNEL'])
        if c == 0:
            continue
        ftype[r['CHANNEL']] = r['FIXTURE_TYPE']
        e = chans.setdefault(c, {'type': ourtype.get(c), 'eosType': r['FIXTURE_TYPE'],
                                 'label': None, 'gel': None})
        if r['LABEL'].strip() and not e['label']:
            e['label'] = r['LABEL'].strip()
        if r['GEL'].strip() and not e['gel']:
            e['gel'] = r['GEL'].strip()

    def is_light(c):
        e = chans.get(int(c))
        return e is not None and not e['eosType'].startswith('Scenic_Element')

    gobo_table, gobo_evidence = learn_gobos(L, T, ftype)
    conv = Conv(tparams, gobo_table)

    # ---- group rows of LEVELS by (target type, list, id, part, channel)
    recs = collections.OrderedDict()
    dropped = collections.Counter()
    for r in L:
        p = r['PARAMETER_TYPE_AS_TEXT']
        if p not in KEPT:
            dropped[p] += 1
            continue
        if not r['LEVEL'].strip() and not r['EFFECT'].strip() and not r['LEVEL_REFERENCE_TYPE_AS_TEXT']:
            continue
        k = (r['TARGET_TYPE_AS_TEXT'], r['TARGET_ID'], r['TARGET_PART_NUMBER'], r['CHANNEL'])
        recs.setdefault(k, {})[p] = r

    labels = {}
    for t in T:
        labels.setdefault((t['TARGET_TYPE_AS_TEXT'], t['TARGET_ID'], t['PART_NUMBER']), t)

    doc = collections.OrderedDict()
    doc['source'] = SOURCE
    doc['generated_by'] = 'tools/hamilton-cues.py'
    doc['frame'] = FRAME
    doc['channels'] = {str(c): chans[c] for c in sorted(chans)}

    # ---- groups
    groups = {}
    for t in T:
        if t['TARGET_TYPE_AS_TEXT'] != 'Group':
            continue
        flat, sets = parse_chan_list(t['TIME_DATA'])
        g = {'label': t['LABEL'].strip(), 'ch': flat}
        if sets:
            g['sets'] = sets
        groups[t['TARGET_ID']] = g
    doc['groups'] = {k: groups[k] for k in sorted(groups, key=qkey)}

    # ---- presets and palettes
    scenic_dropped = collections.Counter()
    for kind, sec in SECTION.items():
        d = {}
        for t in T:
            if t['TARGET_TYPE_AS_TEXT'] == kind:
                d[t['TARGET_ID']] = {'label': t['LABEL'].strip(), 'ch': {}}
        for (tt, tid, part, ch), rows in recs.items():
            if tt != kind:
                continue
            if not is_light(ch):
                scenic_dropped[kind] += 1
                continue
            e = d.setdefault(tid, {'label': '', 'ch': {}})
            e['ch'][ch] = conv.params(ftype.get(ch), rows)
        for e in d.values():
            e['ch'] = {c: e['ch'][c] for c in sorted(e['ch'], key=int)}
        doc[sec] = {k: d[k] for k in sorted(d, key=qkey)}

    # ---- effects: label, plus the kind of parameter the levels show each one running on
    fxparams = collections.defaultdict(set)
    for r in L:
        if r['EFFECT'].strip() and num(r['EFFECT']):
            fxparams[str(num(r['EFFECT']))].add(r['PARAMETER_TYPE_AS_TEXT'])
    effects = {}
    for t in T:
        if t['TARGET_TYPE_AS_TEXT'] != 'Effect':
            continue
        ps = sorted(fxparams.get(t['TARGET_ID'], ()))
        kinds = sorted({EFFECT_KIND.get(p, p) for p in ps})
        e = {'label': t['LABEL'].strip(), 'type': kinds[0] if len(kinds) == 1 else (kinds or None)}
        if ps:
            e['params'] = ps
        notes = []
        if 900 <= int(float(t['TARGET_ID'])) < 1000:
            notes.append('Eos stock effect')
        if not ps:
            notes.append('not seen running in any cue; type unknown')
        if notes:
            e['notes'] = '; '.join(notes)
        effects[t['TARGET_ID']] = e
    doc['effects'] = {k: effects[k] for k in sorted(effects, key=qkey)}
    doc['gobos'] = {}
    eos_to_ours = {}
    for e in chans.values():
        if e['type']:
            eos_to_ours.setdefault(e['eosType'], e['type'])
    for et in sorted(gobo_table):
        ours = eos_to_ours.get(et) or et
        doc['gobos'].setdefault(ours, {})
        for val in sorted(gobo_table[et]):
            doc['gobos'][ours][str(val)] = gobo_table[et][val]

    # ---- cues (list 1)
    heads = [t for t in T if t['TARGET_TYPE_AS_TEXT'] == 'Cue' and t['TARGET_LIST_NUMBER'] == '1']
    qs = sorted({t['TARGET_ID'] for t in heads}, key=qkey)

    def times(t):
        tm = {}
        for col, k in (('TIME_DATA', 'up'), ('DOWN_TIME', 'down'), ('FOCUS_TIME', 'focus'),
                       ('COLOR_TIME', 'color'), ('BEAM_TIME', 'beam')):
            if num(t[col]) is not None:
                tm[k] = num(t[col])
        dl = {}
        for col, k in (('DOWN_DELAY', 'down'), ('FOCUS_DELAY', 'focus'), ('COLOR_DELAY', 'color'),
                       ('BEAM_DELAY', 'beam')):
            if num(t[col]) is not None:
                dl[k] = num(t[col])
        return tm, dl

    def common(t, o, part=False):
        tm, dl = times(t)
        if tm:
            o['time'] = tm
        o['delay'] = num(t['UP_DELAY']) or 0
        if dl:
            o['delays'] = dl
        mk = t['MARK'].strip()
        o['mark'] = mk in ('M', 'm')
        if mk == 'R':
            o['marked'] = True      # an earlier cue pre-set (marked) some of this cue's values in the dark
        elif mk and mk not in ('M', 'm'):
            o['markFlag'] = mk
        bl = t['BLOCK'].strip()
        o['block'] = 'intensity' if bl == 'I' else bool(bl)
        if t['ASSERT'].strip():
            o['assert'] = True
        if part:                    # a part carries only what is set
            for k in ('mark', 'block'):
                if not o[k]:
                    del o[k]

    cuerows = collections.defaultdict(lambda: collections.defaultdict(dict))
    for (tt, tid, part, ch), rows in recs.items():
        if tt == 'Cue':
            cuerows[tid][part][ch] = rows

    gobo_mode = {}      # tracked Gobo_Wheel_Mode per channel, in cue order
    cues, lights_dropped = [], collections.Counter()

    def chblock(rowsets):
        out = {}
        for ch in sorted(rowsets, key=int):
            if not is_light(ch):
                lights_dropped[chans.get(int(ch), {}).get('eosType', 'unpatched')] += 1
                continue
            rows = rowsets[ch]
            if 'Gobo_Wheel_Mode' in rows and num(rows['Gobo_Wheel_Mode']['LEVEL']) is not None:
                gobo_mode[ch] = num(rows['Gobo_Wheel_Mode']['LEVEL'])
            out[ch] = conv.params(ftype.get(ch), rows, gobo_mode.get(ch))
        return out

    for q in qs:
        h = labels[('Cue', q, '')]
        cue = collections.OrderedDict()
        cue['q'] = q
        cue['label'] = h['LABEL'].strip()
        common(h, cue)
        fo = h['FOLLOW'].strip()
        cue['follow'] = num(fo[1:]) if fo.upper().startswith('F') else None
        cue['link'] = num(h['LINK']) if h['LINK'].strip() else None
        if h['LOOP'].strip():
            cue['loop'] = h['LOOP'].strip()
        if h['SCENE_TEXT'].strip():
            cue['scene'] = h['SCENE_TEXT'].strip()
        if h['CUE_NOTES'].strip():
            cue['notes'] = h['CUE_NOTES'].strip()
        if h['CURVE'].strip():
            cue['curve'] = num(h['CURVE'])
        if h['RATE'].strip():
            cue['rate'] = num(h['RATE'])
        if h['EFFECTS'].strip():
            cue['fx'] = [num(x) for x in h['EFFECTS'].strip().lstrip('E').split()]
        if h['EXTERNAL_LINKS'].strip():
            cue['macros'] = [num(x.lstrip('M')) for x in h['EXTERNAL_LINKS'].split()]
        if qkey(q) >= UTILITY_FROM:
            cue['utility'] = True
        parts = sorted((t for t in heads if t['TARGET_ID'] == q and t['PART_NUMBER']),
                       key=lambda t: int(t['PART_NUMBER']))
        cue['parts'] = []
        for t in parts:
            p = collections.OrderedDict()
            p['part'] = int(t['PART_NUMBER'])
            if t['LABEL'].strip():
                p['label'] = t['LABEL'].strip()
            common(t, p, part=True)
            p['ch'] = chblock(cuerows[q].get(t['PART_NUMBER'], {}))
            cue['parts'].append(p)
        cue['ch'] = chblock(cuerows[q].get('', {}))
        orphan = set(cuerows[q]) - {''} - {t['PART_NUMBER'] for t in parts}
        if orphan:
            raise SystemExit('cue %s: levels for parts with no part row: %s' % (q, sorted(orphan)))
        cues.append(cue)
    doc['cues'] = cues

    # ---- summary
    islands, cur = [], None
    for c in cues:
        if c.get('utility'):
            continue
        lone_home = cur is not None and cur['n'] == 1 and cur['firstLabel'] == 'HOME'
        if cur is None or (qkey(c['q']) - qkey(cur['last']) > ISLAND_GAP and not lone_home):
            cur = {'first': c['q'], 'last': c['q'], 'n': 0, 'firstLabel': c['label'], 'scenes': []}
            islands.append(cur)
        cur['last'] = c['q']
        cur['n'] += 1
        if c.get('scene'):
            cur['scenes'].append([c['q'], c['scene']])
    util = [c['q'] for c in cues if c.get('utility')]
    if util:
        islands.append({'first': util[0], 'last': util[-1], 'n': len(util), 'utility': True,
                        'firstLabel': cues[[c['q'] for c in cues].index(util[0])]['label'], 'scenes': []})
    targ_counts = collections.Counter(t['TARGET_TYPE_AS_TEXT'] for t in T)
    summary = collections.OrderedDict()
    summary['counts'] = {
        'cues': len(cues), 'cueTargetRows': targ_counts['Cue'],
        'parts': sum(len(c['parts']) for c in cues),
        'channels': len(chans), 'channelsInRig': sum(1 for e in chans.values() if e['type']),
        'groups': len(doc['groups']), 'presets': len(doc['presets']),
        'colorPalettes': len(doc['colorPalettes']), 'beamPalettes': len(doc['beamPalettes']),
        'focusPalettes': len(doc['focusPalettes']), 'intensityPalettes': len(doc['intensityPalettes']),
        'effects': len(doc['effects']), 'levelRows': len(L),
        'cueChannelRecords': sum(len(c['ch']) + sum(len(p['ch']) for p in c['parts']) for c in cues),
    }
    summary['islands'] = islands
    summary['gobos'] = gobo_evidence
    summary['lossy'] = [
        'Parameters dropped (rows): ' + ', '.join('%s %d' % kv for kv in sorted(dropped.items())),
        'Scenic-element channels (Eos Scenic_Element*, e.g. the revolve) dropped from cues/presets: '
        + ', '.join('%s %d' % kv for kv in sorted(lights_dropped.items()) + sorted(scenic_dropped.items())),
        'Blocked values (TRACK_TYPE b/B) are kept as plain values; a channel whose rows are ALL blocked '
        'carries PARAMS `blk: true` (a hard copy of the tracked state, not a move). Cue-level BLOCK is kept '
        'as `block`. In a cue with parts, Eos stores blocked (b) and mark (M) rows outside any part: they '
        'are the cue\'s own `ch`; a mark part (mark: true, usually part 20 "Mark") gives the marks\' timing.',
        'Mark (move-in-dark) values: TRACK_TYPE M rows; PARAMS `mark` names the cue they are pre-set for. '
        'Cue/part `mark: true` = Eos M/m (this cue moves lights in the dark); `marked: true` = Eos R '
        '(some of this cue\'s values were pre-set by an earlier mark).',
        'Zoom: Eos stores degrees (ranges: Viper 10-44, Viper 91-100 10-55, X4 7-49.2, VL3500 10-50).',
        'Gobo rotation: Gobo_Wheel_Mode 25 read as INDEX (goboIdx degrees, goboRot 0), 63/76 as ROTATE '
        'with the value taken as RPM (goboRot = 6 x value, raw in goboSpd). Evidence: mode 25 carries '
        'per-fixture angles like -167.8/-100.8/-67.6/0.9 on a Linear gobo in a "shutter in" palette '
        '(an alignment, not a speed); but the "spin" palettes (bp 52/76/80) are also mode 25 with values '
        'near +-50, so those spins may come from effect 355 "GOBO <>" or may mean mode 25 is rotate. '
        'MEDIUM-LOW confidence; RPM unit is a guess.',
        'Gobo_Select 6.4 cannot be learnt (beam palettes 107-114 label it Pebbles/Iris/Blocks/Tribal/'
        'Leaves/Alpha/Open alike) -> "slot:6.4". Beam palettes 101-106 (25 Vipers) disagree with 2-7 '
        '(all 35 Vipers); the vote follows 2-7. Viper 91-100 and VL3500 slots other than open are unlearnt.',
        'Colour wheel (Color_Select) is emitted as cw "slot:N" (0.5 = "open"); names unknown.',
        'LED Cyan (S4 Lustr) is emitted as `cyan` (0-100); CMY fixtures use `cmy`.',
        'Diffusion is emitted as `frost` 0-100. Strobe, shutters/framing, animation wheel, beam fx, '
        'X4 pixel mask and mode params are dropped.',
        'Per-parameter FADE_TIME/DELAY_TIME (discrete timing) are folded to the channel as PARAMS '
        '`time`/`delay` (max over that channel\'s parameters).',
        'Group membership comes from the Group rows\' TIME_DATA column (the Eos export puts the channel '
        'list there); bracketed sub-groups are kept as `sets`.',
        'Focus: X/Y/Z_Focus mapped to set-local metres; Pan/Tilt kept as Eos degrees.',
    ]
    doc['summary'] = summary

    # ---- checks
    want = {t['TARGET_ID'] for t in T if t['TARGET_TYPE_AS_TEXT'] == 'Cue' and t['TARGET_LIST_NUMBER'] == '1'}
    got = {c['q'] for c in cues}
    if want != got:
        raise SystemExit('cue mismatch: missing %s' % sorted(want - got, key=qkey))
    partrows = sum(1 for t in heads if t['PART_NUMBER'])
    if partrows != summary['counts']['parts'] or len(heads) != targ_counts['Cue']:
        raise SystemExit('part rows do not add up')

    write(doc, out_path)
    report(doc, out_path)


def dumps(x):
    return json.dumps(x, ensure_ascii=False, separators=(',', ':'))


def write(doc, path):
    lines = ['{']
    keys = list(doc)
    for i, k in enumerate(keys):
        v = doc[k]
        end = ',' if i < len(keys) - 1 else ''
        if isinstance(v, dict) and k not in ('summary',) and v:
            lines.append(' %s:{' % dumps(k))
            items = list(v.items())
            for j, (kk, vv) in enumerate(items):
                lines.append('  %s:%s%s' % (dumps(kk), dumps(vv), ',' if j < len(items) - 1 else ''))
            lines.append(' }' + end)
        elif isinstance(v, list) and v:
            lines.append(' %s:[' % dumps(k))
            for j, vv in enumerate(v):
                lines.append('  %s%s' % (dumps(vv), ',' if j < len(v) - 1 else ''))
            lines.append(' ]' + end)
        elif k == 'summary':
            lines.append(' %s:%s%s' % (dumps(k), json.dumps(v, ensure_ascii=False, indent=None,
                                                           separators=(', ', ': ')), end))
        else:
            lines.append(' %s:%s%s' % (dumps(k), dumps(v), end))
    lines.append('}')
    data = ('\n'.join(lines) + '\n').encode('utf-8')
    json.loads(data)
    with open(path, 'wb') as f:
        f.write(data)


def report(doc, path):
    s = doc['summary']
    print('wrote %s (%d bytes)' % (os.path.relpath(path, REPO), os.path.getsize(path)))
    print('counts: ' + ', '.join('%s %s' % kv for kv in s['counts'].items()))
    print('islands:')
    for i in s['islands']:
        sc = '; '.join('%s %s' % tuple(x) for x in i['scenes'])
        print('  %-8s .. %-8s %3d cues%s  first "%s"%s' % (i['first'], i['last'], i['n'],
              ' UTILITY' if i.get('utility') else '', i['firstLabel'], ('  scenes: ' + sc) if sc else ''))
    print('gobos: ' + json.dumps(doc['gobos'], ensure_ascii=False))


if __name__ == '__main__':
    main()
