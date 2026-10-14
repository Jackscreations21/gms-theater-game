#!/usr/bin/env python3
"""Top-down pictures of the Hamilton blocking, without the page (RULINGS FF-FN).

For reviewers who cannot share the one browser pane.  Standard library only:
the PNGs are written with zlib + struct, the text is a 5x7 bitmap font.

    python -I tools/blocking-plot.py <file> <track> <t1,t2,...> [--out DIR] [--scale PX_PER_M]
        one plan per moment (seconds into <track>): every actor at that moment
    python -I tools/blocking-plot.py <file> <track> --path <actorId> [--out DIR]
        one actor's whole path through the track, each waypoint marked with its time
    python -I tools/blocking-plot.py <file> <track|all> --sheet [--every SECONDS] [--out DIR]
        a contact sheet per track: a small plan every SECONDS (default 10) from 0 to the track's end;
        `all` = a sheet for every track the file has waypoints in

    add --pools <POOLS DIR> to any of these: the light lit at each moment is drawn UNDER the actors, from
    <POOLS DIR>/<track>.json (dumped from the page: the lit units, where each beam lands and its radius there
    — see that folder's README.md): every pool a translucent disc in its colour, SPECIALS (narrow pools for one
    person) outlined white, washes in their colour; side light and LED strips are left out unless --pools-all.
    In moment mode it also prints, per actor, the person lights she stands in (within the pool's radius + 0.3 m, at
    her level) — or "NO SPECIAL".  A person light is a `special` OR any unit at zoom 18.5 deg or less: the dump's
    `special` cut-off (zoom <= 14, or a floor pool of radius <= 1 m) misses face keys and duet pools at 14.5-18.5 deg
    whose pool is wider than 1 m (found by the segment-5 spotlight pass).  Only the specials are outlined white.

A DANCING actor (RULING FV: her `moves`, from the blocking file, or for a segment file from the `dance.json` beside it,
timed on assets/hamilton-beats.json as the page times them) wears a little note over her disc and the move's name under
her label; the moment printout names the move.

Props (RULINGS FR, FT) are drawn as shaded squares in their colour, from the blocking file's `props`, or for a segment
file from the `props.json` beside it; a placed prop GLIDES between two placed waypoints, as the page draws it.

<file> is either a SEGMENT file (`{"segment", "tracks", "waypoints": {"<id>": [...]}}`, as the
blocking writers produce) or the page's blocking file (`assets/hamilton-blocking.json`,
`{"actors": [{"id", "name", "color", "path"}]}`).  Names and colours come from the file, else
from tools/hamilton-cast.json.  Track lengths come from assets/hamilton-show.json; the stage from
tools/hamilton-floor.json (measured in the page at Real size).  Output: DIR (default: the current
directory), files named <track>_<t>.png, <track>_path_<id>.png, <track>_sheet.png.

THE PICTURE.  A plan as the house sees it: the house (downstage, +z) at the BOTTOM, stage left
(+x) on the RIGHT.  The floor is shaded by height from the measured map (black: below the deck;
grey: the deck; brown ramps: stairs and landings; tan: the galleries at 2.74; pale: rails and
posts); a 1 m grid (brighter every 5 m, and at x 0 / z 0); the two turntable rings (red); the
named entrance points (blue crosses) and deck points (yellow).  Each actor is a disc in her cast
colour with a white tick for the way she faces and her CURRENT head label beside it; a white rim
means she is up off the deck (on a stair or a gallery); a HOLLOW ring means she is not seen
(offstage, or before / after her blocking).  Actors with no waypoints in the file are not drawn.

THE POSE RULES, re-implemented from midtown.html (actCompile / actPose) — the same numbers:
arrive at a waypoint at its time; leave after `dwell`, or (dwell absent) just in time to walk the
leg at 1.3 m/s, never after the next waypoint's time; a stop (first, last, offstage, any dwell but
0) eases out and in over 0.6 s (a trapezoid of speed) and breaks the curve; walk-throughs (dwell 0)
shape a centripetal Catmull-Rom, each leg walked at constant speed along its arc length (24-sample
table); facing: the way of travel, turning over 0.6 s into a stop's `facing` and out of it into the
walk; before the first waypoint and after the last she stands at it; visible unless at an offstage
waypoint or walking between two; the label is the last `label` at or before the time, else the
actor's name.  APPROXIMATED: the page finds her HEIGHT by a ray down onto the real geometry; here
the height is the waypoints' `y` interpolated along the leg (only used for the white "up" rim,
and as the page's own starting hint).  A SEGMENT file alone has no earlier segments before it, so
an actor stands at her first waypoint of the segment from the top of the show — as the page would
show that file on its own (the brief makes every segment start its actors offstage).
"""
import json, math, os, struct, sys, zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WALK, EASE, TURN, SEG_N = 1.3, 0.6, 0.6, 24
VIEW = (-10.0, 10.0, -6.2, 6.0)                 # x0, x1, z0, z1 (metres, set-local)

# ---------------------------------------------------------------- the 5x7 font (columns, bit 0 at the top)
_F = ('0000000000 00005F0000 0007000700 147F147F14 242A7F2A12 2313086462 3649552250 0005030000 001C224100 0041221C00 '
      '082A1C2A08 08083E0808 0050300000 0808080808 0060600000 2010080402 3E5149453E 00427F4000 4261514946 2141454B31 '
      '1814127F10 2745454539 3C4A494930 0171090503 3649494936 064949291E 0036360000 0056360000 0008142241 1414141414 '
      '4122140800 0201510906 324979413E 7E1111117E 7F49494936 3E41414122 7F4141221C 7F49494941 7F09090101 3E41415132 '
      '7F0808087F 00417F4100 2040413F01 7F08142241 7F40404040 7F0204027F 7F0408107F 3E4141413E 7F09090906 3E4151215E '
      '7F09192946 4649494931 01017F0101 3F4040403F 1F2040201F 7F2018207F 6314081463 0304780403 6151494543 00007F4141 '
      '0204081020 41417F0000 0402010204 4040404040 0001020400 2054545478 7F48444438 3844444420 384444487F 3854545418 '
      '087E090102 081454543C 7F08040478 00447D4000 2040443D00 007F102844 00417F4000 7C04180478 7C08040478 3844444438 '
      '7C14141408 081414187C 7C08040408 4854545420 043F444020 3C4040207C 1C2040201C 3C4030403C 4428102844 0C5050503C '
      '4464544C44 0008364100 00007F0000 0041360800 1008081008').split()
FONT = {chr(32 + i): bytes.fromhex(h) for i, h in enumerate(_F)}
_SUBST = {'−': '-', '–': '-', '—': '-', '’': "'", '‘': "'", '“': '"', '”': '"', 'é': 'e', '→': '>'}


class Canvas:
    def __init__(self, w, h, bg=(13, 12, 15)):
        self.w, self.h = w, h
        self.px = bytearray(bytes(bg) * (w * h))

    def put(self, x, y, c, a=1.0):
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (y * self.w + x) * 3
            if a >= 1:
                self.px[i:i + 3] = bytes(c)
            else:
                p = self.px
                p[i] = int(p[i] + (c[0] - p[i]) * a); p[i + 1] = int(p[i + 1] + (c[1] - p[i + 1]) * a); p[i + 2] = int(p[i + 2] + (c[2] - p[i + 2]) * a)

    def rect(self, x0, y0, x1, y1, c):
        x0, y0, x1, y1 = max(0, int(x0)), max(0, int(y0)), min(self.w, int(x1)), min(self.h, int(y1))
        if x1 <= x0 or y1 <= y0: return
        row = bytes(c) * (x1 - x0)
        for y in range(y0, y1):
            i = (y * self.w + x0) * 3
            self.px[i:i + len(row)] = row

    def disc(self, cx, cy, r, c, a=1.0):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for x in range(int(cx - r - 1), int(cx + r + 2)):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r: self.put(x, y, c, a)

    def ring(self, cx, cy, r, c, wdt=1.5):
        for y in range(int(cy - r - 2), int(cy + r + 3)):
            for x in range(int(cx - r - 2), int(cx + r + 3)):
                d = math.hypot(x - cx, y - cy)
                if abs(d - r) <= wdt / 2: self.put(x, y, c)

    def line(self, x0, y0, x1, y1, c, wdt=1, a=1.0, dash=0):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for k in range(n + 1):
            if dash and (k // dash) % 2: continue
            t = k / n; x = x0 + (x1 - x0) * t; y = y0 + (y1 - y0) * t
            if wdt <= 1: self.put(int(round(x)), int(round(y)), c, a)
            else:
                r = wdt / 2
                for yy in range(int(y - r), int(y + r) + 1):
                    for xx in range(int(x - r), int(x + r) + 1):
                        if (xx - x) ** 2 + (yy - y) ** 2 <= r * r: self.put(xx, yy, c, a)

    def text(self, x, y, s, c, sc=1, bg=None):
        s = ''.join(_SUBST.get(ch, ch) for ch in str(s))
        if bg is not None:
            self.rect(x - 1, y - 1, x + len(s) * 6 * sc, y + 8 * sc, bg)
        for k, ch in enumerate(s):
            cols = FONT.get(ch, FONT['?'])
            for i, col in enumerate(cols):
                for j in range(7):
                    if col >> j & 1:
                        if sc == 1: self.put(x + k * 6 + i, y + j, c)
                        else: self.rect(x + (k * 6 + i) * sc, y + j * sc, x + (k * 6 + i + 1) * sc, y + (j + 1) * sc, c)

    def blit(self, other, ox, oy):
        for y in range(other.h):
            if 0 <= oy + y < self.h:
                a = (y * other.w) * 3; b = ((oy + y) * self.w + ox) * 3
                n = min(other.w, self.w - ox) * 3
                self.px[b:b + n] = other.px[a:a + n]

    def save(self, path):
        raw = b''.join(b'\x00' + bytes(self.px[y * self.w * 3:(y + 1) * self.w * 3]) for y in range(self.h))
        chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
        with open(path, 'wb') as f:
            f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', self.w, self.h, 8, 2, 0, 0, 0))
                    + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


def hexc(h):
    h = str(h).lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)) if len(h) == 6 else (200, 200, 200)


# ---------------------------------------------------------------- the pose (midtown.html actCompile / actPose)
def cr(s, u):
    p0, p1, p2, p3 = s['p']
    k = lambda a, b: max(1e-4, math.sqrt(math.hypot(b[0] - a[0], b[1] - a[1])))
    t1 = k(p0, p1); t2 = t1 + k(p1, p2); t3 = t2 + k(p2, p3); t = t1 + (t2 - t1) * u
    L = lambda a, b, ta, tb: ((tb - t) / (tb - ta) * a[0] + (t - ta) / (tb - ta) * b[0], (tb - t) / (tb - ta) * a[1] + (t - ta) / (tb - ta) * b[1])
    A1 = L(p0, p1, 0, t1); A2 = L(p1, p2, t1, t2); A3 = L(p2, p3, t2, t3); B1 = L(A1, A2, 0, t2); B2 = L(A2, A3, t1, t3)
    return L(B1, B2, t1, t2)


def tan_yaw(s, u):
    e = 1 / (SEG_N * 4); a = cr(s, max(0, u - e)); b = cr(s, min(1, u + e))
    return math.atan2(b[0] - a[0], b[1] - a[1])


def arc_u(s, f):
    d = f * s['len']; L = s['L']; k = 1
    while k < SEG_N and L[k] < d: k += 1
    span = L[k] - L[k - 1]
    return (k - 1 + ((d - L[k - 1]) / span if span > 1e-9 else 0)) / SEG_N


def warp(t, D, a, b):
    v = 1 / (D - a / 2 - b / 2)
    if t <= 0: return 0.0
    if t >= D: return 1.0
    if a > 0 and t < a: return v * t * t / (2 * a)
    if b > 0 and t > D - b: return 1 - v * (D - t) * (D - t) / (2 * b)
    return v * (a / 2 + (t - a))


smooth = lambda k: (lambda k: k * k * (3 - 2 * k))(min(1.0, max(0.0, k)))


def ylerp(a, b, k):
    return a + ((((b - a) % (2 * math.pi)) + 3 * math.pi) % (2 * math.pi) - math.pi) * k


def num(v):
    try: return None if v is None or v == '' else float(v)
    except Exception: return None


def compile_path(path, tracks, head):
    P = []
    for k, w in enumerate(path):
        t = tracks.get(str(w.get('track')))
        if not t: continue
        y = w.get('y')
        y = 2.743 if y == 'gallery' else (num(y) if not isinstance(y, str) else 0.045)
        P.append({'k': k, 'w': w, 'T': t['start'] + (num(w.get('at')) or 0), 'x': num(w.get('x')) or 0, 'z': num(w.get('z')) or 0,
                  'y': y if y is not None else 0.045, 'dwell': num(w.get('dwell')), 'facing': num(w.get('facing')), 'off': bool(w.get('off')),
                  'label': str(w['label']).strip() if w.get('label') else None})
    P.sort(key=lambda p: (p['T'], p['k']))
    n = len(P)
    for i, p in enumerate(P):
        p['stop'] = i == 0 or i == n - 1 or p['off'] or p['dwell'] is None or p['dwell'] > 0
        p['lab'] = p['label'] or (P[i - 1]['lab'] if i else head)
    segs = []
    for i in range(n - 1):
        a, b = P[i], P[i + 1]
        p1, p2 = (a['x'], a['z']), (b['x'], b['z'])
        p0 = (2 * p1[0] - p2[0], 2 * p1[1] - p2[1]) if a['stop'] or i == 0 else (P[i - 1]['x'], P[i - 1]['z'])
        p3 = (2 * p2[0] - p1[0], 2 * p2[1] - p1[1]) if b['stop'] or i + 2 >= n else (P[i + 2]['x'], P[i + 2]['z'])
        s = {'p': (p0, p1, p2, p3), 'L': [0.0] * (SEG_N + 1)}
        px, pz = p1
        for k in range(1, SEG_N + 1):
            q = cr(s, k / SEG_N); s['L'][k] = s['L'][k - 1] + math.hypot(q[0] - px, q[1] - pz); px, pz = q
        s['len'] = s['L'][SEG_N]
        segs.append(s)
    for i, p in enumerate(P):
        q = P[i + 1] if i + 1 < n else None
        s = segs[i] if i < len(segs) else None
        if not q: p['leave'] = p['T'] + (p['dwell'] or 0)
        elif p['dwell'] is None: p['leave'] = max(p['T'], q['T'] - s['len'] / WALK)
        else: p['leave'] = min(p['T'] + p['dwell'], q['T'])
        if s: s['t0'], s['t1'] = p['leave'], q['T']
    for s in segs:
        s['yaw0'] = tan_yaw(s, 0) if s['len'] > 1e-3 else None
        s['yaw1'] = tan_yaw(s, 1) if s['len'] > 1e-3 else None
    for i, p in enumerate(P):
        before = segs[i - 1] if i > 0 else None
        after = segs[i] if i < len(segs) else None
        p['arrive'] = before['yaw1'] if before and before['yaw1'] is not None else None
        if p['facing'] is not None: p['yaw'] = p['facing'] * math.pi / 180
        elif p['arrive'] is not None: p['yaw'] = p['arrive']
        elif after and after['yaw0'] is not None: p['yaw'] = after['yaw0']
        else: p['yaw'] = P[i - 1]['yaw'] if i else 0.0
    return {'P': P, 'segs': segs, 'head': head}


def pose(c, T):
    P = c['P']
    if not P: return None
    lo, hi = 0, len(P) - 1
    while lo < hi:
        m = (lo + hi + 1) // 2
        if P[m]['T'] <= T: lo = m
        else: hi = m - 1
    i = lo; p = P[i]; q = P[i + 1] if i + 1 < len(P) else None
    if T < p['T'] or not q or T < p['leave'] or q['T'] - p['leave'] <= 1e-6:
        k = smooth((T - p['T']) / TURN) if i > 0 and p['arrive'] is not None and T >= p['T'] else 1
        return {'x': p['x'], 'z': p['z'], 'y': p['y'], 'yaw': ylerp(p['arrive'], p['yaw'], k) if k < 1 else p['yaw'], 'visible': not p['off'],
                'label': c['head'] if T < p['T'] else p['lab'], 'moving': False}
    s = c['segs'][i]; D = s['t1'] - s['t0']; t = T - s['t0']
    f = warp(t, D, min(EASE, D / 2) if p['stop'] else 0, min(EASE, D / 2) if q['stop'] else 0)
    u = arc_u(s, f); x, z = cr(s, u)
    yaw = tan_yaw(s, u) if s['len'] > 1e-3 else p['yaw']
    if p['stop']: yaw = ylerp(p['yaw'], yaw, smooth(t / TURN))
    return {'x': x, 'z': z, 'y': p['y'] + (q['y'] - p['y']) * f, 'yaw': yaw, 'visible': not (p['off'] and q['off']), 'label': p['lab'], 'moving': True}


# ---------------------------------------------------------------- the stage
NAMED = {'C': (0, 0.95), 'DC': (0, 3.4), 'DSC': (0, 4.4), 'UC': (0, -2.3), 'DR': (-3.5, 3.4), 'DL': (3.5, 3.4), 'R': (-3.5, 0.95), 'L': (3.6, 0.95),
         'UR': (-3.3, -2.2), 'UL': (4.2, -1.6)}
ENTR = {'W-DSR': (-7.3, 4.6), 'W-DSL': (7.3, 4.6), 'W-MSR': (-8.5, 0.0), 'W-MSL': (8.0, -0.5), 'W-USR': (-8.5, -3.0), 'W-USL': (8.5, -3.0),
        'D-UC': (1.25, -4.9), 'G-UC': (0.6, -4.8)}


class Stage:
    def __init__(self, scale, margin=(26, 22, 26, 30), labels=True):
        self.s = scale; self.ml, self.mt, self.mr, self.mb = margin
        x0, x1, z0, z1 = VIEW
        self.w = int((x1 - x0) * scale) + self.ml + self.mr
        self.h = int((z1 - z0) * scale) + self.mt + self.mb
        self.labels = labels
        self.bg = self._draw()

    def P(self, x, z):
        return (self.ml + (x - VIEW[0]) * self.s, self.mt + (z - VIEW[2]) * self.s)

    def _draw(self):
        fl = json.load(open(os.path.join(ROOT, 'tools', 'hamilton-floor.json'), encoding='utf-8'))
        cv = Canvas(self.w, self.h)
        st = fl['step']
        for j in range(fl['nz']):
            for i in range(fl['nx']):
                x = fl['x0'] + i * st; z = fl['z0'] + j * st
                if not (VIEW[0] - st <= x <= VIEW[1] + st and VIEW[2] - st <= z <= VIEW[3] + st): continue
                top, deck = fl['top'][j][i], fl['deck'][j][i]
                if top < -0.05: c = (8, 8, 10)
                elif 2.65 <= top <= 2.85: c = (150, 112, 72)
                elif top > 2.85: c = (120, 120, 130)
                elif top > 0.3: g = int(70 + top / 2.7 * 80); c = (g + 20, g, g - 25)
                elif deck > 0.12: c = (84, 76, 66)
                else: c = (52, 50, 50)
                a = self.P(x - st / 2, z - st / 2); b = self.P(x + st / 2, z + st / 2)
                cv.rect(a[0], a[1], b[0] + 1, b[1] + 1, c)
        x0, x1, z0, z1 = VIEW
        for x in range(int(math.ceil(x0)), int(x1) + 1):
            a = self.P(x, z0); b = self.P(x, z1)
            cv.line(a[0], a[1], b[0], b[1], (110, 200, 210) if x == 0 else (70, 110, 120), 1, 0.9 if x == 0 or x % 5 == 0 else 0.35)
        for z in range(int(math.ceil(z0)), int(z1) + 1):
            a = self.P(x0, z); b = self.P(x1, z)
            cv.line(a[0], a[1], b[0], b[1], (110, 200, 210) if z == 0 else (70, 110, 120), 1, 0.9 if z == 0 or z % 5 == 0 else 0.35)
        for r in (2.59, 3.82):
            n = int(2 * math.pi * r * self.s / 2) + 16
            pts = [self.P(math.sin(2 * math.pi * k / n) * r, 0.95 - math.cos(2 * math.pi * k / n) * r) for k in range(n + 1)]
            for a, b in zip(pts, pts[1:]): cv.line(a[0], a[1], b[0], b[1], (220, 80, 80), 1, 0.8)
        big = self.s >= 25
        for name, (x, z) in ENTR.items():
            p = self.P(x, z)
            cv.line(p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3, (120, 170, 255)); cv.line(p[0] - 3, p[1] + 3, p[0] + 3, p[1] - 3, (120, 170, 255))
            if big and self.labels: cv.text(int(p[0]) + 5, int(p[1]) - 3, name, (120, 170, 255))
        for name, (x, z) in NAMED.items():
            p = self.P(x, z); cv.disc(p[0], p[1], 1.6, (230, 210, 80))
            if big and self.labels: cv.text(int(p[0]) + 4, int(p[1]) + 2, name, (200, 185, 90))
        if self.labels:
            sc = 1
            for x in range(-10, 11, 5 if not big else 1):
                p = self.P(x, VIEW[3]); cv.text(int(p[0]) - 3, int(p[1]) + 3, str(x), (150, 150, 110))
            for z in range(-6, 7, 3 if not big else 1):
                p = self.P(VIEW[0], z); cv.text(1, int(p[1]) - 3, ('+' if z > 0 else '') + str(z), (150, 150, 110))
            p = self.P(0, VIEW[3]); cv.text(int(p[0]) - 60, int(p[1]) + 13 + (0 if big else -2), 'HOUSE / DOWNSTAGE +z', (230, 230, 230), sc)
            p = self.P(VIEW[1], -5.9); cv.text(int(p[0]) - 84, int(p[1]), 'STAGE LEFT +x', (230, 230, 230), sc)
            p = self.P(VIEW[0], -5.9); cv.text(int(p[0]) + 2, int(p[1]), 'STAGE RIGHT -x', (230, 230, 230), sc)
        return cv

    def canvas(self):
        cv = Canvas(self.w, self.h); cv.px[:] = self.bg.px
        return cv


POOLS = {}
SHOWN_KINDS = {'special', 'wash', 'followspot'}


def pools_at(pdir, tid, sec, every_kind=False):
    """The pools lit at `sec` into the track: the cue whose at <= sec (latest) — its look holds until the next."""
    if not pdir: return []
    if tid not in POOLS:
        f = os.path.join(pdir, tid + '.json')
        POOLS[tid] = json.load(open(f, encoding='utf-8')) if os.path.exists(f) else {'cues': []}
    cue = None
    for c in POOLS[tid]['cues']:
        if c['at'] <= sec + 1e-6: cue = c
    if not cue: return []
    out = []
    for q in cue['pools']:
        if not every_kind and q.get('kind') not in SHOWN_KINDS: continue
        lands = q.get('lands', '')
        if q.get('hit') and (lands in ('deck', 'gallery') or lands.startswith('floor')):
            out.append(dict(q, px=q['hit'][0], pz=q['hit'][2], py=q['hit'][1], pr=q['hitR'], onfloor=True))
        elif q.get('deck'):
            out.append(dict(q, px=q['deck'][0], pz=q['deck'][1], py=0.045, pr=q['deckR'], onfloor=False))
    return out


def draw_pools(cv, st, pools):
    for q in sorted(pools, key=lambda q: -q['pr']):
        x, y = st.P(q['px'], q['pz']); r = max(1.5, q['pr'] * st.s)
        col = hexc(q['color'])
        lv = min(1.0, q['level'])
        if r < 260: cv.disc(x, y, r, col, 0.04 + 0.30 * lv)        # brighter = higher level
        if q.get('kind') == 'special': cv.ring(x, y, r, (255, 255, 255) if lv >= 0.15 else (150, 150, 150), 1.2)
        elif q['onfloor'] and lv >= 0.3: cv.ring(x, y, r, col, 1.0)


def specials_on(p, pools):
    hits = []
    for q in pools:
        if (q.get('kind') not in ('special', 'followspot') and q.get('zoom', 99) > 18.5) or not q['onfloor']: continue   # a person light: a special, or any unit at zoom <= 18.5
        if abs(q['py'] - p['y']) > 0.6: continue
        d = math.hypot(p['x'] - q['px'], p['z'] - q['pz'])
        if d <= q['pr'] + 0.3: hits.append(f"ch{q['ch']}({d:.1f}/{q['pr']:.1f}m)")
    return hits


def draw_actor(cv, st, a, p, short=False, dance=None):
    x, y = st.P(p['x'], p['z'])
    r = max(2.5, 0.27 * st.s)
    col = a['rgb']
    if p['visible']:
        cv.disc(x, y, r, col)
        if p['y'] > 1.0: cv.ring(x, y, r + 1, (255, 255, 255), 1.5)
        fx, fy = math.sin(p['yaw']), math.cos(p['yaw'])
        cv.line(x, y, x + fx * r * 1.9, y + fy * r * 1.9, (255, 255, 255), 2 if st.s >= 25 else 1)
    else:
        cv.ring(x, y, r, col, 1.5)
    lab = p['label'] or a['name']
    if short: lab = lab.split()[0][:7] if lab.split() else lab
    cv.text(int(x + r + 2), int(y - 3), lab, (240, 240, 240) if p['visible'] else (150, 150, 150), 1, bg=(20, 18, 22) if not short else None)
    if dance and p['visible']:                          # RULING FV: a note over her, the move's name under her label
        nx, ny = x + r * 0.6, y - r - 7
        cv.disc(nx, ny + 4, 2.2, (255, 226, 160)); cv.line(nx + 2, ny + 4, nx + 2, ny - 3, (255, 226, 160), 1); cv.line(nx + 2, ny - 3, nx + 5, ny - 1, (255, 226, 160), 1)
        if not short: cv.text(int(x + r + 2), int(y + 6), dance, (255, 226, 160), 1, bg=(20, 18, 22))


# ---------------------------------------------------------------- the dance moves (RULING FV): when each runs, as midtown.html times it
def beat_grid():
    try: beats = json.load(open(os.path.join(ROOT, 'assets', 'hamilton-beats.json'), encoding='utf-8'))
    except Exception: return {}
    out = {}
    for tid, t in (beats.get('tracks') or {}).items():
        segs = [(float(t['firstBeat']), 0, 60.0 / float(t['bpm']))]
        for c in sorted(t.get('changes') or [], key=lambda c: c['at']):
            a, b, per = segs[-1]
            if c['at'] <= a:
                if len(segs) == 1 and c['at'] == a: segs[0] = (a, 0, 60.0 / c['bpm'])
                continue
            segs.append((float(c['at']), round(b + (c['at'] - a) / per), 60.0 / c['bpm']))
        out[tid] = segs
    return out


def move_spans(moves, tracks, grid):
    """-> [(T0, T1, name)] on the global clock: `at` snapped to its beat, plus `canon`, for `counts` beats."""
    out = []
    for m in moves or []:
        tr = tracks.get(str(m.get('track')))
        if not tr: continue
        at, canon, n = float(m.get('at', 0)), float(m.get('canon') or 0), float(m.get('counts', 0))
        segs = grid.get(tr['id'])
        if not segs:
            out.append((tr['start'] + at + canon, tr['start'] + at + canon + n * 0.5, m.get('move'))); continue
        def beat(t):
            sg = segs[0]
            for q in segs:
                if q[0] <= t: sg = q
            return sg[1] + (t - sg[0]) / sg[2]
        def time(b):
            sg = segs[0]
            for q in segs:
                if q[1] <= b: sg = q
            return sg[0] + (b - sg[1]) * sg[2]
        b0 = round(beat(at))
        out.append((tr['start'] + time(b0) + canon, tr['start'] + time(b0 + n) + canon, m.get('move')))
    return sorted(out)


def dance_at(a, T):
    cur = None
    for s0, s1, name in a.get('dance') or []:
        if s0 <= T: cur = (s1, name)
    return cur[1] if cur and T < cur[0] else None


# ---------------------------------------------------------------- input
# ---------------------------------------------------------------- the props (RULINGS FR, FT): midtown.html propCompile / propPose
PROP_KINDS = {'desk': [1.2, 0.75, 0.6], 'table': [1.5, 0.75, 0.9], 'chair': [0.45, 0.9, 0.45], 'bench': [1.4, 0.45, 0.4], 'stool': [0.4, 0.6, 0.4],
              'box': [0.5, 0.45, 0.5], 'crate': [0.6, 0.5, 0.6], 'lantern': [0.2, 0.35, 0.2], 'bucket': [0.3, 0.35, 0.3], 'custom': [0.5, 0.5, 0.5]}
PROP_AHEAD = 0.22          # (FR; FU replaced it with the hold below)
PROP_HOLD = {'hand': 0.88, 'near': 0.10, 'body': 0.13, 'side': 0.70}   # RULING FU, as midtown.html's PROP_HOLD


def prop_hold_y(p):
    """FU: a held prop's feet above the carriers' feet (midtown.html propHoldY)."""
    h = p['size'][1]; t = min(0.05, h * 0.12)
    if h > 1.6: return 0.15
    if p.get('kind') in ('desk', 'table', 'bench'): return max(0.05, PROP_HOLD['hand'] - (h - t))
    return PROP_HOLD['hand']
PROPS_LOADED = []          # filled by load_inputs (its return value is kept as it was: tools/blocking/props.py unpacks three)


def compile_prop(p, tracks):
    P = []
    for k, w in enumerate(p.get('waypoints') or []):
        t = tracks.get(str(w.get('track')))
        if not t: continue
        f = num(w.get('facing'))
        P.append({'k': k, 'T': t['start'] + (num(w.get('at')) or 0), 'x': num(w.get('x')) or 0, 'z': num(w.get('z')) or 0, 'y': num(w.get('y')) or 0.045,
                  'yaw': (f or 0) * math.pi / 180, 'off': bool(w.get('off')), 'by': '+'.join(w['carriedBy']) if isinstance(w.get('carriedBy'), list) else (w.get('carriedBy') or None)})
    P.sort(key=lambda q: (q['T'], q['k']))
    return P


def prop_pose(p, T, actors_by_id):
    P = p['c']
    if not P or T < P[0]['T']: return None
    lo, hi = 0, len(P) - 1
    while lo < hi:
        m = (lo + hi + 1) // 2
        if P[m]['T'] <= T: lo = m
        else: hi = m - 1
    w = P[lo]
    if w['by']:
        ids = w['by'].split('+')                           # FU: one carrier, or two ("a+b")
        A = [actors_by_id.get(i) for i in ids]
        if not all(A): return None
        Q = [pose(a['c'], T) for a in A]
        if not all(Q): return None
        if len(Q) == 2:                                    # FU: between the two, its long side from the first to the second
            q1, q2 = Q
            return {'x': (q1['x'] + q2['x']) / 2, 'z': (q1['z'] + q2['z']) / 2, 'y': (q1['y'] + q2['y']) / 2 + prop_hold_y(p),
                    'yaw': math.atan2(-(q2['z'] - q1['z']), q2['x'] - q1['x']), 'visible': (q1['visible'] or q2['visible']) and not w['off'], 'by': w['by']}
        q = Q[0]
        if p.get('kind') in ('chair', 'stool') or p['size'][1] > 1.6:   # FU: at her right side
            sd = 0.16 + p['size'][0] / 2
            return {'x': q['x'] - math.cos(q['yaw']) * sd, 'z': q['z'] + math.sin(q['yaw']) * sd, 'y': q['y'], 'yaw': q['yaw'], 'visible': q['visible'] and not w['off'], 'by': w['by']}
        f = p['size'][2] / 2 + PROP_HOLD['near'] + PROP_HOLD['body']
        return {'x': q['x'] + math.sin(q['yaw']) * f, 'z': q['z'] + math.cos(q['yaw']) * f, 'y': q['y'] + prop_hold_y(p), 'yaw': q['yaw'], 'visible': q['visible'] and not w['off'], 'by': w['by']}
    n = P[lo + 1] if lo + 1 < len(P) else None
    if not w['off'] and n and not n['by'] and not n['off'] and n['T'] > w['T'] + 1e-6:     # the glide (RULING FT)
        f = (T - w['T']) / (n['T'] - w['T'])
        return {'x': w['x'] + (n['x'] - w['x']) * f, 'z': w['z'] + (n['z'] - w['z']) * f, 'y': w['y'] + (n['y'] - w['y']) * f,
                'yaw': ylerp(w['yaw'], n['yaw'], f), 'visible': True, 'by': None}
    return {'x': w['x'], 'z': w['z'], 'y': w['y'], 'yaw': w['yaw'], 'visible': not w['off'], 'by': None}


def draw_prop(cv, st, p, q, short=False):
    w, d = p['size'][0], p['size'][2]
    c, s_ = math.cos(q['yaw']), math.sin(q['yaw'])
    corners = [(q['x'] + u * c + v * s_, q['z'] - u * s_ + v * c) for u, v in ((-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2))]
    pts = [st.P(x, z) for x, z in corners]
    x0, x1 = int(min(a for a, _ in pts)), int(max(a for a, _ in pts)) + 1
    y0, y1 = int(min(b for _, b in pts)), int(max(b for _, b in pts)) + 1
    def inside(x, y):
        sign = 0
        for (ax, ay), (bx, by) in zip(pts, pts[1:] + pts[:1]):
            cr_ = (bx - ax) * (y - ay) - (by - ay) * (x - ax)
            if cr_ != 0:
                if sign == 0: sign = 1 if cr_ > 0 else -1
                elif (cr_ > 0) != (sign > 0): return False
        return True
    col = p['rgb']
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if inside(x + 0.5, y + 0.5): cv.put(x, y, col, 0.85)
    for a, b in zip(pts, pts[1:] + pts[:1]): cv.line(a[0], a[1], b[0], b[1], (235, 220, 190), 1)
    if not short:
        cx, cy = st.P(q['x'], q['z'])
        cv.text(int(cx) - 3 * len(p['label'][:14]), int(cy) + 6, p['label'][:14], (235, 220, 190), 1, bg=(20, 18, 22))


def load_inputs(path):
    src_file = path                              # (the loop below rebinds `path` to each actor's path)
    d = json.load(open(path, encoding='utf-8'))
    cast = {a['id']: a for a in json.load(open(os.path.join(ROOT, 'tools', 'hamilton-cast.json'), encoding='utf-8'))['actors']}
    show = json.load(open(os.path.join(ROOT, 'assets', 'hamilton-show.json'), encoding='utf-8'))
    tracks, t0, L = {}, 0.0, show['tracks']
    for k, t in enumerate(L):                    # the clock's lead-ins and tails (RULING FQ), as midtown.html and the merge lay them out
        pre = 10.0 if k == 0 or t.get('hold') else 0.0
        post = math.inf if k == len(L) - 1 else (10.0 if L[k + 1].get('hold') else 0.0)
        t0 += pre
        tracks[t['id']] = {'i': k, 'id': t['id'], 'title': t['title'], 'len': float(t['len']), 'start': t0, 'pre': pre, 'post': post}
        t0 += float(t['len']) + (post if post != math.inf else 0.0)
    actors = []
    if isinstance(d.get('actors'), list):
        src = [(a['id'], a.get('name'), a.get('color'), a.get('label'), a.get('path') or []) for a in d['actors']]
        moves = {a['id']: a.get('moves') or [] for a in d['actors']}
    else:
        order = list(cast) + [k for k in (d.get('waypoints') or {}) if k not in cast]
        src = [(k, None, None, None, (d.get('waypoints') or {}).get(k) or []) for k in order]
        side = os.path.join(os.path.dirname(os.path.abspath(src_file)), 'dance.json')   # RULING FV: the moves beside a segment file
        moves = json.load(open(side, encoding='utf-8')).get('moves', {}) if os.path.exists(side) else {}
    grid = beat_grid()
    for aid, name, color, label, path in src:
        if not path: continue
        cs = cast.get(aid, {})
        name = name or cs.get('name') or aid
        a = {'id': aid, 'name': name, 'rgb': hexc(color or cs.get('color') or '#c8c8c8')}
        a['c'] = compile_path(path, tracks, label or name)
        a['path'] = path
        a['dance'] = move_spans(moves.get(aid), tracks, grid)
        actors.append(a)
    plist = d.get('props') if isinstance(d.get('props'), list) else None
    if plist is None:                            # a segment file: the props are generated beside it (tools/blocking/props.py)
        side = os.path.join(os.path.dirname(os.path.abspath(src_file)), 'props.json')
        plist = json.load(open(side, encoding='utf-8')).get('props', []) if os.path.exists(side) else []
    PROPS_LOADED.clear()
    for pr in plist:
        size = pr.get('size') if isinstance(pr.get('size'), list) and len(pr['size']) == 3 else PROP_KINDS.get(pr.get('kind'), PROP_KINDS['custom'])
        PROPS_LOADED.append({'id': pr.get('id'), 'kind': pr.get('kind'), 'label': str(pr.get('label') or pr.get('id')), 'size': [float(v) for v in size],
                             'rgb': hexc(pr.get('color') or '#8a6a48'), 'c': compile_prop(pr, tracks)})
    return d, tracks, actors


def frame(st, tracks, actors, tid, sec, title=True, short=False, pdir=None, every_kind=False):
    tr = tracks[tid]; T = tr['start'] + sec
    cv = st.canvas()
    pools = pools_at(pdir, tid, sec, every_kind)
    draw_pools(cv, st, pools)
    ps = [(a, pose(a['c'], T)) for a in actors]
    byid = {a['id']: a for a in actors}
    for pr in PROPS_LOADED:
        q = prop_pose(pr, T, byid)
        if q and q['visible']: draw_prop(cv, st, pr, q, short)
    for a, p in sorted(ps, key=lambda ap: (ap[1]['visible'], ap[1]['y']) if ap[1] else (False, 0)):
        if p: draw_actor(cv, st, a, p, short, dance_at(a, T))
    if title:
        m, s = divmod(sec, 60)
        cv.text(st.ml, 4, f'{tid} {tr["title"]}  {int(m)}:{s:04.1f}  ({sec:.1f} s)' + (f'  - {len(pools)} pools' if pdir else ''), (255, 225, 120), 1)
    return cv, ps, pools


def main(argv):
    if len(argv) < 2:
        print(__doc__); return 2
    f, tid = argv[0], argv[1]
    out, scale, every, path_id, sheet, times, pdir, every_kind = '.', 40.0, 10.0, None, False, None, None, False
    i = 2
    while i < len(argv):
        a = argv[i]
        if a == '--out': out = argv[i + 1]; i += 2
        elif a == '--scale': scale = float(argv[i + 1]); i += 2
        elif a == '--every': every = float(argv[i + 1]); i += 2
        elif a == '--path': path_id = argv[i + 1]; i += 2
        elif a == '--sheet': sheet = True; i += 1
        elif a == '--pools': pdir = argv[i + 1]; i += 2
        elif a == '--pools-all': every_kind = True; i += 1
        elif times is None and not a.startswith('--'): times = [float(t) for t in a.split(',') if t.strip()]; i += 1
        else: print('unknown argument', a); return 2
    os.makedirs(out, exist_ok=True)
    d, tracks, actors = load_inputs(f)
    if tid != 'all' and tid not in tracks:
        print('unknown track', tid); return 2
    if sheet:
        want = [tid] if tid != 'all' else [t for t, tr in sorted(tracks.items(), key=lambda kv: kv[1]['i'])
                                             if any(str(w.get('track')) == t for a in actors for w in a['path'])]
        st = Stage(12.0, margin=(6, 12, 6, 6), labels=False)
        for t in want:
            L = tracks[t]['len']; secs = []
            s = 0.0
            while s <= L + 1e-6: secs.append(round(s, 2)); s += every
            cols = 5; rows = (len(secs) + cols - 1) // cols
            sh = Canvas(cols * st.w + (cols + 1) * 4, rows * (st.h + 12) + 40)
            sh.text(6, 6, f'{t} {tracks[t]["title"]} - a frame every {every:g} s - {os.path.basename(f)}', (255, 225, 120), 2)
            sh.text(6, sh.h - 10, 'each frame: the house (downstage) at the bottom, stage left on the right; 1 m grid; hollow ring = not seen; white rim = up off the deck', (200, 200, 200), 1)
            for n, sec in enumerate(secs):
                cv, _, _ = frame(st, tracks, actors, t, sec, title=False, short=True, pdir=pdir, every_kind=every_kind)
                m, ss = divmod(sec, 60)
                cv.text(st.ml, 2, f'{int(m)}:{ss:04.1f}', (255, 225, 120))
                sh.blit(cv, 4 + (n % cols) * (st.w + 4), 28 + (n // cols) * (st.h + 12))
            p = os.path.join(out, f'{t}_sheet.png'); sh.save(p); print('wrote', p)
        return 0
    st = Stage(scale)
    if path_id:
        a = next((x for x in actors if x['id'] == path_id), None)
        if not a: print('no actor', path_id, 'with waypoints in', f); return 2
        tr = tracks[tid]; cv = st.canvas()
        n = int(tr['len'] / 0.1) + 1; prev = None
        for k in range(n + 1):
            T = tr['start'] + min(tr['len'], k * 0.1); p = pose(a['c'], T)
            q = st.P(p['x'], p['z'])
            if prev: cv.line(prev[0][0], prev[0][1], q[0], q[1], a['rgb'], 2 if p['visible'] and prev[1] else 1, 1.0, 0 if p['visible'] and prev[1] else 3)
            prev = (q, p['visible'])
        for w in a['c']['P']:
            if w['w'].get('track') != tid: continue
            q = st.P(w['x'], w['z'])
            if w['off']: cv.ring(q[0], q[1], 5, a['rgb'], 2)
            else: cv.disc(q[0], q[1], 4.5, a['rgb']); cv.ring(q[0], q[1], 5.5, (255, 255, 255), 1)
            if w['facing'] is not None and not w['off']:
                cv.line(q[0], q[1], q[0] + math.sin(w['yaw']) * 14, q[1] + math.cos(w['yaw']) * 14, (255, 255, 255), 2)
            at = w['T'] - tr['start']
            extra = (' d' + ('0' if w['dwell'] == 0 else f'{w["dwell"]:g}') if w['dwell'] is not None else '') + (' off' if w['off'] else '') + (f' "{w["label"]}"' if w['label'] else '')
            cv.text(int(q[0]) + 8, int(q[1]) - 3, f'{at:.1f}{extra}', (255, 255, 255), 1, bg=(20, 18, 22))
        cv.text(st.ml, 4, f'{tid} {tr["title"]}  path of {a["name"]} ({path_id}) - solid: seen, dotted: not seen; d = dwell', (255, 225, 120), 1)
        p = os.path.join(out, f'{tid}_path_{path_id}.png'); cv.save(p); print('wrote', p)
        return 0
    if not times:
        print('give the moments: <t1,t2,...> (seconds into the track), or --sheet, or --path <id>'); return 2
    for sec in times:
        cv, ps, pools = frame(st, tracks, actors, tid, sec, pdir=pdir, every_kind=every_kind)
        p = os.path.join(out, f'{tid}_{sec:07.2f}.png'); cv.save(p)
        print('wrote', p)
        for a, pp in ps:
            if not pp: continue
            line = f'   {a["id"]:10s} {pp["label"]:16s} ({pp["x"]:5.1f}, {pp["z"]:5.1f}) y {pp["y"]:.2f} ' + ('seen' if pp['visible'] else 'off ')
            dm = dance_at(a, tracks[tid]['start'] + sec)
            if dm and pp['visible']: line += f'  dancing: {dm}'                      # RULING FV
            if pdir and pp['visible']:
                sp = specials_on(pp, pools)
                line += '  specials: ' + (', '.join(sp) if sp else 'NO SPECIAL')
            print(line)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
