"""Segment 7 blocking generator (2-11 .. 2-16). Writes segments/seg7.json and runs own checks."""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TR = [('2-11', 54.0), ('2-12', 142.0), ('2-13', 143.0), ('2-14', 128.0), ('2-15', 225.0), ('2-16', 173.0)]
START = {}
g = 0.0
for t, L in TR:
    START[t] = g; g += L
END = g

def G(tr, at): return START[tr] + at
def TA(gt):
    for t, L in TR:
        if START[t] - 1e-9 <= gt <= START[t] + L + 1e-9:
            at = gt - START[t]
            if at > L: at = L
            return t, round(at, 2)
    raise ValueError(gt)

C = (0.0, 0.95)
WING = {
    'W-DSR': ((-7.3, 4.6), None, [(-6.0, 4.7)]),
    'W-DSL': ((7.3, 4.6), None, [(6.0, 4.7)]),
    'W-USR': ((-8.5, -3.0), None, [(-5.0, -2.9)]),
    'W-USL': ((8.5, -3.0), None, [(5.4, -1.9)]),
    'W-MSL': ((8.0, -0.5), None, [(5.0, -0.6)]),
    'W-MSR': ((-8.5, 0.0), None, [(-5.6, -0.7), (-4.0, -0.7)]),
    'D-UC': ((1.25, -4.9), None, [(1.25, -3.4)]),
    'G-UC': ((0.6, -4.8), 'gallery', [(0.6, -3.35)]),
}

def ring(r, deg):
    a = math.radians(deg)
    return (r * math.sin(a), 0.95 - r * math.cos(a))

def inward(deg):
    f = -deg
    while f > 180: f -= 360
    while f <= -180: f += 360
    return f

def dist(a, b): return math.hypot(a[0] - b[0], a[1] - b[1])

class Actor:
    def __init__(self, aid):
        self.id = aid; self.w = []
    def last(self): return self.w[-1]
    def add(self, gt, x, z, y=None, f=None, dwell=None, off=False, label=None):
        if self.w: assert gt > self.w[-1]['g'] + 1e-6, (self.id, TA(gt), TA(self.w[-1]['g']))
        d = {'g': gt, 'x': x, 'z': z}
        if y: d['y'] = y
        if f is not None: d['facing'] = f
        if dwell is not None: d['dwell'] = dwell
        if off: d['off'] = True
        if label: d['label'] = label
        self.w.append(d); return self
    def at(self, tr, at, x, z, f=None, **kw):
        return self.add(G(tr, at), x, z, f=f, **kw)
    def go(self, tr, at, p, f=None, **kw):
        return self.add(G(tr, at), p[0], p[1], f=f, **kw)
    def face(self, tr, at, f):
        l = self.last(); return self.add(G(tr, at), l['x'], l['z'], y=l.get('y'), f=f)
    def start(self, wing, label, tr='2-11', at=0.0):
        (p, y, _) = WING[wing]
        return self.add(G(tr, at), p[0], p[1], y=y, off=True, label=label)
    def enter(self, wing, tr, at, p, f, speed=1.3, via=None, y=None, dwell=None, label=None, lead=1.0):
        (wp, wy, wv) = WING[wing]
        vias = (via if via is not None else wv)
        pts = [wp] + list(vias) + [p]
        tot = sum(dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
        t_arr = G(tr, at); t0 = t_arr - tot / speed
        l = self.last()
        if not (l.get('off') and dist((l['x'], l['z']), wp) < 0.01):
            toff = max(l['g'] + 0.1, t0 - lead)
            assert toff < t0 + 1e-6, (self.id, 'no time to reach wing', TA(t0))
            self.add(toff, wp[0], wp[1], y=wy, off=True, label=label)
        elif label:
            l['label'] = label
        t = t0; cur = wp
        for v in vias:
            t += dist(cur, v) / speed; cur = v
            self.add(t, v[0], v[1], y=wy, dwell=0)
        return self.add(t_arr, p[0], p[1], y=y, f=f, dwell=dwell)
    def exit(self, tr, at_leave, wing, speed=1.3, via=None):
        (wp, wy, wv) = WING[wing]
        vias = list(reversed(via if via is not None else wv))
        l = self.last(); cur = (l['x'], l['z'])
        t = G(tr, at_leave)
        # make the last stop leave at at_leave
        if l.get('dwell') is None or l['dwell'] != 0:
            l['dwell'] = round(max(0.0, t - l['g']), 2)
        for v in vias:
            t += dist(cur, v) / speed; cur = v
            self.add(t, v[0], v[1], y=wy, dwell=0)
        t += dist(cur, wp) / speed
        return self.add(t, wp[0], wp[1], y=wy, off=True)
    def path(self, tr, at_leave, pts, t_end_tr, t_end_at, f=None, last_dwell=None):
        """walk through pts (all but the last dwell 0), leaving last stop at at_leave, arriving at the last at t_end."""
        l = self.last(); cur = (l['x'], l['z'])
        t0 = G(tr, at_leave); t1 = G(t_end_tr, t_end_at)
        l['dwell'] = round(max(0.0, t0 - l['g']), 2)
        legs = [dist(cur, pts[0])] + [dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
        tot = sum(legs); t = t0
        for i, p in enumerate(pts):
            t += (t1 - t0) * legs[i] / tot
            if i < len(pts) - 1: self.add(t, p[0], p[1], dwell=0)
            else: self.add(t1, p[0], p[1], f=f, dwell=last_dwell)
        return self

A = {}
def actor(aid):
    A[aid] = Actor(aid); return A[aid]

# ---------------------------------------------------------------- positions
DESK = (1.4, 1.1)          # Hamilton's desk, SL of centre (cue 1017) - not a modelled prop
BEHIND_DESK = (1.4, 0.5)
CABINET = (3.6, 2.0)       # the cabinet / mantel SL where the letters and later the pistols are kept
BENCH = (-0.4, 3.2)        # SPOT: Eliza's bench in Burn, just SR of centre, in her key (Viper 4 focus (-0.3, 3.3), cue 1051)
LANTERN = (-1.1, 3.05)     # SPOT: the lantern at the bench's SR end (Viper 2 focus (-1.4, 3.3), the candle glow)
BUCKET = (-1.5, 2.6)       # SPOT: the bucket on the floor beside the lantern
ODESK = (-1.4, 1.2)        # SPOT: behind the 2-16 office desk - the 'preset 730 Desk' pool (Viper 12) lands at (-1.38, 1.82)
PDESK = (0.0, 1.9)         # REVIEW: the Pamphlet desk, brought on in front of him at centre at the end of Hurricane
def ringc(cx, cz, r, deg):
    a = math.radians(deg)
    return (cx + r * math.sin(a), cz - r * math.cos(a))
def facing_to(p, q):
    return round(math.degrees(math.atan2(q[0] - p[0], q[1] - p[1])), 1)

# ================================================================ HAMILTON
h = actor('hamilton').start('G-UC', 'Hamilton')
h.enter('G-UC', '2-11', 24.5, (0.0, -3.2), 0, y='gallery', lead=3.0)      # the upper gallery, centre
h.at('2-11', 29.56, -0.3, -3.1, f=0, y='gallery')                          # to the rail: his reply
h.at('2-11', 33.28, -0.3, -3.1, f=0, y='gallery')                          # the papers drop over the rail
h.at('2-11', 35.6, 0.2, -3.2, f=-20, y='gallery')
h.exit('2-11', 38.2, 'G-UC')
h.add(G('2-11', 44.0), 1.25, -4.9, off=True)                               # down the back to the deck door
h.enter('D-UC', '2-12', 1.0, BEHIND_DESK, 0)                               # the office: behind his desk
h.face('2-12', 9.44, 0)
h.face('2-12', 21.08, -25)
h.at('2-12', 36.0, 0.9, 2.2, f=-15)                                        # round the desk as Jefferson pushes
h.at('2-12', 45.4, -1.1, 3.4, f=10)                                        # he takes the floor, DS key (SPOT: into X4 44 at (-1.3, 3.5))
h.face('2-12', 61.49, -50)                                                 # to Burr DSR
h.at('2-12', 67.6, CABINET[0], CABINET[1], f=90, dwell=1.6)                # fetches the letters from the cabinet SL
h.at('2-12', 72.0, 1.8, 2.8, f=-20)                                        # reads them out
h.at('2-12', 83.6, -1.0, 3.4, f=0)                                         # the confession (SPOT: back into his key, 1024)
h.at('2-12', 94.0, 1.0, 2.6, f=-60)                                        # his records, at Jefferson
h.at('2-12', 106.4, 0.0, 3.4, f=0)                                         # his defence DC
h.at('2-12', 119.3, -1.3, 3.5, f=60, dwell=None)                           # alone DSR (the accusers gone) (SPOT: in X4 44, 1027)
h.face('2-12', 121.82, 70)                                                 # to Burr
h.face('2-12', 131.63, 80)
h.go('2-12', 141.4, C, f=0)                                                # into the eye
# Hurricane - the still centre
h.face('2-13', 11.88, 0)
h.face('2-13', 23.76, -30)
h.at('2-13', 35.5, 0.0, 1.7, f=0)                                          # writing - a step DS into the cool key
h.face('2-13', 51.16, 20)
h.face('2-13', 70.47, -20)
h.face('2-13', 84.38, 0)
h.face('2-13', 98.5, 0)                                                    # the still point again (SPOT: stays in the key, X4 43, lit to 130.65)
h.face('2-13', 104.8, -60)                                                 # watching his mother carried away SR
h.face('2-13', 116.28, 0)
h.face('2-13', 125.22, 180)                                                # the voices on the gallery; Maria behind
h.go('2-13', 131.2, C, f=0)                                                # the decision: a step back to C, onto the X4 44 key and Maria's quill (SPOT)
# The Reynolds Pamphlet (REVIEW: restaged from the hamilton-lyrics staging post and the ETC cue renders 1039.01-1044)
# his desk was brought on in front of him at the end of Hurricane: PDESK (0, 1.9), his chair behind it at C
h.face('2-14', 0.48, 0)
h.face('2-14', 12.68, 0)
h.at('2-14', 19.5, PDESK[0], PDESK[1], f=0)                                # climbs onto his desk; papers round his feet
h.face('2-14', 30.0, -20)
h.at('2-14', 33.5, -0.9, 1.9, f=60)                                        # steps off, SR side; Washington SL side
h.at('2-14', 39.0, -1.4, 2.9, f=20)                                        # walks downstage right of the desk
h.face('2-14', 41.0, -40)                                                  # King DR
h.face('2-14', 53.2, -100)                                                 # the King comes to him
h.face('2-14', 55.49, 80)                                                  # Angelica through the desk-arch
h.at('2-14', 60.0, -0.5, 3.0, f=90)                                        # crosses to her, reaches for her hand
h.face('2-14', 81.17, 90)                                                  # nose to nose
h.go('2-14', 89.5, C, f=0)                                                 # chorus 2: the centre of the mocking ring
h.face('2-14', 101.45, 0)
h.exit('2-14', 115.66, 'D-UC', via=[(1.25, -3.4), (0.0, -1.2)])            # out as the title line returns
# Blow Us All Away - the office
h.enter('D-UC', '2-16', 81.5, ODESK, 0)                                    # SPOT: behind the desk in the 'Desk' pool (Viper 12)
h.face('2-16', 102.5, 50)
h.at('2-16', 108.6, 0.35, 3.3, f=-60)                                     # father and son DC
h.face('2-16', 124.1, -70)
h.at('2-16', 129.5, 0.25, 1.9, f=-80)                                     # SPOT: the promise, under the top light (Viper 8)
h.at('2-16', 133.2, CABINET[0], CABINET[1], f=90, dwell=1.0)              # the pistols from the mantel SL
h.at('2-16', 137.27, 0.35, 2.0, f=-80)                                     # hands them over
h.exit('2-16', 138.4, 'D-UC', speed=1.6, via=[(1.25, -3.4), (-0.8, -0.6), (-0.85, 1.5)])   # REVIEW 2: off upstage, taking the desk

# ================================================================ BURR
b = actor('burr').start('W-DSR', 'Burr')
b.enter('W-DSR', '2-11', 2.4, (-3.3, 3.8), 25, speed=1.8)                  # DSR, narrating (SPOT: in X4 42 sooner)
b.at('2-11', 15.6, -2.8, 3.5, f=20)
b.at('2-11', 26.4, -2.9, 3.85, f=160)                                      # looks up at Hamilton on the gallery (SPOT: clear of X4 44)
b.at('2-11', 38.6, -2.5, 3.7, f=60)                                        # gloats with Jefferson and Madison (SPOT: in X4 42)
b.at('2-11', 48.4, -1.6, 4.2, f=20)                                        # the three DS
b.at('2-12', 9.44, 1.4, 2.7, f=180)                                        # closes on Hamilton at the desk (DS of it)
b.face('2-12', 21.08, 170)
b.at('2-12', 36.0, -1.6, 2.6, f=30)                                        # hangs back SR
b.at('2-12', 46.4, -2.9, 2.9, f=45)                                        # SPOT: clear of Hamilton's key
b.at('2-12', 61.49, -2.3, 4.6, f=30)                                       # his special DSR near the lip (SPOT: Viper 2 at (-1.8, 4.2))
b.face('2-12', 69.46, 60)
b.face('2-12', 82.38, 45)
b.path('2-12', 111.8, [(-0.6, 4.6), (1.4, 3.8)], '2-12', 116.3, f=-60)     # round to DSL of centre
b.at('2-12', 132.6, 1.0, 3.6, f=-80)                                       # the warning, closer (SPOT: stays in Viper 2)
b.exit('2-12', 136.9, 'W-DSL', speed=1.6)
# Hurricane (REVIEW): Burr has the one 'wait for it' line (newtfire libretto) - UR, on Binkley's 'Burr's motif' (116.28)
b.enter('W-USR', '2-13', 116.0, (-3.6, -2.0), 30, speed=1.4)
b.face('2-13', 125.22, 40)
b.path('2-13', 138.0, [(-3.4, 1.0), (-1.0, 3.3)], '2-14', 0.4, f=10)      # into the narrators' three DC for the Pamphlet
# Reynolds Pamphlet (REVIEW: the three are DC from Build MC - ETC renders 1039.01/1040; hamilton-lyrics staging post)
b.face('2-14', 7.2, 10)
b.face('2-14', 21.5, 40)                                                   # points at Philip's page
b.at('2-14', 38.5, -0.5, 4.0, f=0)
b.at('2-14', 46.0, -0.3, 4.6, f=10)                                        # the three split, laughing
b.at('2-14', 57.0, -0.3, 3.7, f=40)                                        # close in on Angelica, take her bags
b.at('2-14', 60.5, -3.0, 4.4, f=60)                                        # spread to the edge
b.last()['dwell'] = round(G('2-14', 88.0) - b.last()['g'], 2)
b.at('2-14', 89.4, -1.3, 3.9, f=10)                                        # chorus 2: hurling pages at him
b.face('2-14', 101.45, -10)
b.at('2-14', 120.8, -1.2, 4.4, f=0)                                        # Travel DS
b.at('2-14', 125.8, 0.0, 4.4, f=0)                                          # waits at centre as the other two go
b.exit('2-14', 126.86, 'W-DSL', speed=1.5, via=[(6.0, 4.7)])               # then follows them off SL

# ================================================================ JEFFERSON (lafayette)
j = actor('lafayette').start('W-DSR', 'Jefferson')
j.enter('W-DSR', '2-11', 39.0, (-0.8, 2.2), 20, speed=1.7)
j.at('2-11', 48.0, -0.4, 4.0, f=0)
j.at('2-12', 6.5, 0.2, 1.4, f=60)                                          # closes on him at the desk (SR of it)
j.at('2-12', 21.08, 0.7, 1.9, f=45)                                        # the accusation
j.at('2-12', 33.72, -0.3, 4.0, f=20)                                       # pushes in DSC
j.at('2-12', 44.5, -0.9, 1.7, f=60)                                        # SPOT: out of Hamilton's key
j.at('2-12', 74.0, 1.3, 2.2, f=30)                                         # reads the letter over his shoulder
j.at('2-12', 83.4, -0.6, 1.8, f=45)                                        # recoils
j.exit('2-12', 116.3, 'W-MSR', speed=1.4)
# Pamphlet (REVIEW: the three are DC at Build MC - ETC renders 1039.01/1040; moves from the hamilton-lyrics post)
j.enter('W-DSL', '2-14', 0.4, (0.0, 3.5), 0, speed=1.5)                   # in the dark at the end of Hurricane
j.face('2-14', 7.2, 0)                                                     # starts the story
j.at('2-14', 21.5, 0.7, 4.4, f=-140)                                       # turns: Philip is left in the middle, made to read
j.face('2-14', 30.0, -60)
j.at('2-14', 35.5, PDESK[0], PDESK[1], f=0)                                # hops over the desk and sits on it, bouncing
j.face('2-14', 41.0, -40)
j.at('2-14', 43.5, 0.0, 3.7, f=0)                                          # back to the three DC
j.at('2-14', 46.0, 1.2, 4.0, f=-20)                                        # they split, laughing
j.at('2-14', 57.0, 0.8, 3.6, f=-60)                                        # close in on Angelica, take her bags
j.at('2-14', 60.5, 3.0, 4.5, f=-80)                                        # spread to the edge
j.face('2-14', 81.17, -90)
j.last()['dwell'] = round(G('2-14', 88.5) - j.last()['g'], 2)
j.go('2-14', 89.6, (1.7, 4.65), dwell=0)
j.at('2-14', 90.5, 0.2, 4.1, f=0)                                          # chorus 2: hurling pages at him
j.face('2-14', 101.45, 0)
j.at('2-14', 121.0, 0.0, 4.4, f=0)                                         # Travel DS
j.at('2-14', 123.0, 0.0, 5.05, f=0)                                       # a page for the conductor in the pit
j.exit('2-14', 124.2, 'W-DSL', speed=1.6, via=[(6.0, 4.75)])   # exits smiling

# ================================================================ MADISON (mulligan)
m = actor('mulligan').start('W-DSR', 'Madison')
m.enter('W-DSR', '2-11', 40.2, (-1.8, 1.6), 30, speed=1.7)
m.at('2-11', 50.5, 0.8, 4.2, f=-20)
m.at('2-12', 8.4, 2.6, 1.6, f=-60)                                         # SL of the desk
m.face('2-12', 21.08, -50)
m.at('2-12', 35.5, 1.6, 3.2, f=-30)
m.at('2-12', 45.4, 2.2, 1.4, f=-60)
m.at('2-12', 73.0, 2.6, 2.0, f=-45)                                        # horrified at the letters
m.at('2-12', 84.0, 2.4, 1.4, f=-45)
m.exit('2-12', 116.3, 'W-MSL', speed=1.4)
m.enter('W-DSL', '2-14', 0.4, (1.0, 3.3), -20, speed=1.5)                 # the three DC at Build MC (REVIEW)
m.face('2-14', 7.2, -20)
m.at('2-14', 21.5, 1.1, 3.0, f=-60)                                        # points at Philip's page
m.face('2-14', 41.0, -50)
m.at('2-14', 46.0, 2.4, 3.3, f=-60)                                        # the three split, laughing
m.at('2-14', 57.0, 1.0, 2.5, f=-120)                                       # close in on Angelica, take her bags
m.at('2-14', 60.5, 4.3, 3.5, f=-100)                                       # spread to the edge (SPOT: out of Viper 94, Eliza's pool)
m.last()['dwell'] = round(G('2-14', 88.0) - m.last()['g'], 2)
m.at('2-14', 89.6, 1.7, 3.6, f=-10)                                        # chorus 2: hurling pages at him
m.face('2-14', 101.45, 25)
m.at('2-14', 120.8, 1.3, 4.4, f=0)                                         # Travel DS
m.exit('2-14', 123.6, 'W-DSL', speed=1.6, via=[(6.0, 4.75)])              # exits smiling

# ================================================================ KING GEORGE
k = actor('king')
k.add(G('2-11', 0.0), 0.0, 3.41, f=0, label='King George')               # REVIEW (ruled boundary exception): seg 6 leaves him
                                                                           # ON STAGE in his DC special at the 2-10 blackout
k.at('2-11', 4.0, 4.2, -1.6, f=-30)                                       # walks in the dark to UL: a stool is brought; he sits and watches
k.face('2-11', 16.0, -40)
k.face('2-11', 25.37, -126)                                                # up at Hamilton on the gallery
k.face('2-11', 37.63, -40)
k.exit('2-11', 47.44, 'W-MSL', speed=1.4)
# Pamphlet (REVIEW): dancing on the balcony, then down the stairs (hamilton-lyrics post) to Binkley's real 'King DR'
k.enter('G-UC', '2-14', 34.8, (-4.5, -0.3), 0, y='gallery', via=[(0.6, -3.35), (-4.5, -3.35)])
k.last()['dwell'] = 0.2
k.at('2-14', 39.3, -4.5, 1.85, dwell=0)                                    # down the SR stair
k.at('2-14', 41.0, -3.8, 4.2, f=20)                                        # King DR (real cue 1042)
k.at('2-14', 46.0, -3.0, 3.9, f=0)                                         # dances, fanning himself with a pamphlet
k.at('2-14', 51.16, -3.4, 4.3, f=30)                                       # the raucous tag
k.at('2-14', 53.8, -2.1, 3.5, f=60)                                        # a prissy step over to Hamilton (SPOT: leaves King DR as 1044 ends)
k.exit('2-14', 54.4, 'W-DSR', speed=1.5)

# ================================================================ ELIZA
e = actor('eliza').start('G-UC', 'Eliza')
e.enter('G-UC', '2-13', 125.2, (5.35, -0.75), -90, y='gallery', via=[(0.6, -3.35), (4.75, -3.3), (4.9, -2.5), (4.9, -0.75)])  # SPOT: a voice, SL gallery special (Viper 20)
e.exit('2-13', 131.0, 'G-UC', via=[(0.6, -3.35), (4.75, -3.3), (4.9, -2.5), (4.9, -0.75)])
# (REVIEW: removed from the Pamphlet - she has no line in it and the company's last line leaves her out; no account puts her on)
# Burn
e.enter('W-DSR', '2-15', 6.0, BENCH, 0, speed=1.2)                         # on the bench, in the window light
e.at('2-15', 42.64, -0.6, 2.4, f=0)                                        # stands and circles behind the bench (REVIEW; SPOT: in Viper 4)
e.go('2-15', 57.88, BENCH, f=0)                                            # rereading on the bench
e.go('2-15', 74.7, LANTERN, f=-30)                                         # burns the first letter
e.at('2-15', 88.0, -0.3, 4.1, f=0)                                         # verse 2 - stands, DS (SPOT: in Viper 4 / 25 / 26)
e.at('2-15', 104.0, 0.3, 3.9, f=15)
e.at('2-15', 119.46, -0.6, 2.9, f=facing_to((-0.6, 2.9), BUCKET))         # sings towards the burning bucket
e.go('2-15', 137.56, BENCH, f=0)                                           # withdraws to the bench
e.go('2-15', 148.88, LANTERN, f=-30)                                       # the second burning
e.at('2-15', 167.77, -0.9, 4.0, f=0)                                       # the bridge, DS (SPOT)
e.go('2-15', 190.04, BENCH, f=0)                                           # quieter, the bench
e.go('2-15', 212.0, LANTERN, f=0)                                          # takes up the lantern
e.exit('2-15', 217.2, 'W-DSR', speed=1.2)

# ================================================================ ANGELICA
an = actor('angelica').start('G-UC', 'Angelica')
an.enter('G-UC', '2-13', 123.4, (-4.5, -1.3), 90, y='gallery', via=[(0.6, -3.35), (-4.5, -3.35)])  # SPOT: SR strip, in Viper 16's beam (it stops on the rail at y 3.66)
an.exit('2-13', 132.0, 'G-UC', via=[(0.6, -3.35), (-4.5, -3.35)])
# Pamphlet (REVIEW: hamilton-lyrics post - through the desk-arch at centre with her bags; her verse is AT him, closer each line)
an.enter('D-UC', '2-14', 55.49, (0.3, 3.0), 0, speed=1.4, via=[(1.25, -3.4), (0.0, -2.7), (0.0, -1.6), (0.55, 0.3), (0.0, 1.9)])   # REVIEW 2: through the gap, round his chair
an.face('2-14', 57.0, 0)
an.at('2-14', 61.5, 0.9, 3.2, f=-90)                                       # pulls away from his hand
an.at('2-14', 72.0, 0.6, 3.1, f=-90)                                       # closer on every line
an.at('2-14', 81.17, 0.1, 3.05, f=-90)                                     # nose to nose, her climax
an.exit('2-14', 86.0, 'W-MSL', speed=1.5, via=[(5.0, -0.6), (2.6, 2.0), (2.0, 3.05)])   # REVIEW 2: out SL through the circle's gap, clear of the desk and his chair

# ================================================================ WASHINGTON
wa = actor('washington').start('G-UC', 'Washington')
wa.enter('D-UC', '2-13', 124.8, (-1.9, -2.7), 20, via=[(1.25, -3.4)])      # SPOT: on the deck UC-R in Viper 94 (Binkley's GW focus)
wa.exit('2-13', 130.7, 'D-UC', via=[(1.25, -3.4)])
# Pamphlet (REVIEW: on the deck, not the gallery - he sweeps round to the SL side of the desk; Philip exits SL in front of him)
wa.enter('W-MSL', '2-14', 34.0, (0.9, 1.9), -90, speed=1.4, via=[(5.0, -0.6), (3.4, 2.2)])
wa.face('2-14', 41.0, -60)
wa.exit('2-14', 50.5, 'W-MSL', speed=1.4, via=[(5.0, -0.6), (3.4, 2.2)])

# ================================================================ MARIA REYNOLDS (peggy)
p = actor('peggy').start('G-UC', 'Maria Reynolds')
# REVIEW: in the montage she appears on the upper walkway (a fan account: Maria 'on the upper walkway at key moments')
p.enter('G-UC', '2-13', 84.38, (-1.0, -3.35), 0, y='gallery')
p.at('2-13', 92.5, -3.4, -3.35, f=20, y='gallery')                         # drifts along it, red, watching him
p.exit('2-13', 94.0, 'G-UC')
p.add(G('2-13', 112.0), 1.25, -4.9, off=True)
p.enter('D-UC', '2-13', 129.2, (0.0, 0.2), 0)                              # behind him - the quill
p.at('2-13', 132.6, 0.0, -0.45, f=0)                                       # REVIEW 2: a step back as his chair is set between them
# Pamphlet (REVIEW: hamilton-lyrics post): she leaves as the company reads, then is on the DECK - DSR reading,
# round behind the desk, behind his chair as he steps down, and off on her heel. Not on the SL gallery.
p.exit('2-14', 12.9, 'D-UC', via=[(1.25, -3.4), (0.0, -2.4)])
p.enter('W-DSR', '2-14', 21.0, (-2.4, 3.9), 20, speed=1.4)                 # DSR, reading a pamphlet
p.at('2-14', 29.0, -0.6, 0.95, f=60)                                       # circles round behind the desk
p.at('2-14', 33.0, 0.0, -0.4, f=0)                                         # behind his chair as he steps off the desk (REVIEW 2: the chair is a prop at (0, 0.25))
p.exit('2-14', 38.0, 'D-UC', via=[(1.25, -3.4), (0.0, -2.4)])             # turns on her heel and goes

# ================================================================ PHILIP (laurens)
ph = actor('laurens').start('W-DSR', 'Philip')
# Pamphlet (REVIEW: hamilton-lyrics post): in behind Jefferson, looking up at his father on the desk; left in the middle
# of the three, made to read; exits SL crossing in front of Washington
ph.enter('W-DSR', '2-14', 19.5, (-0.3, 2.65), 160, speed=1.5, via=[(-6.0, 4.7), (-2.2, 2.3)])
ph.at('2-14', 22.0, 0.0, 3.5, f=0)                                         # front and centre, reading, horrified
ph.exit('2-14', 29.0, 'W-DSL', speed=1.5)
# Blow Us All Away
ph.enter('D-UC', '2-16', 1.72, C, 0, speed=1.5)                            # the graduate, centre
ph.at('2-16', 12.0, 0.0, 2.8, f=0)
ph.at('2-16', 25.85, 0.0, 3.8, f=0)                                        # the hook
ph.at('2-16', 30.0, -1.6, 2.4, f=-60)                                      # the girls SR
ph.at('2-16', 40.1, -0.6, 3.9, f=0)                                        # off to the play
ph.at('2-16', 50.01, 1.0, 4.2, f=20)
ph.at('2-16', 55.5, 3.4, 3.6, f=-30)
ph.at('2-16', 59.39, 2.9, 2.8, f=95)                                       # confronts Eacker in his box above (SPOT: in Vipers 93 / 13)
ph.face('2-16', 64.82, 80)
ph.face('2-16', 71.73, 60)
ph.at('2-16', 83.0, 0.3, 2.5, f=-120)                                      # home, facing his father at the desk (SPOT: Viper 14)
ph.at('2-16', 106.5, -0.35, 3.3, f=60)                                    # father and son DC
ph.at('2-16', 129.5, -0.45, 1.9, f=75)                                    # SPOT: the promise, under the top light (Viper 8)
ph.face('2-16', 137.27, 60)
ph.at('2-16', 140.34, -3.0, 3.6, f=30)                                     # alone DSR, nervous
ph.face('2-16', 151.12, 60)
ph.face('2-16', 156.52, 40)
# REVIEW: the ruled boundary - Philip ends at C facing 0, Eacker at (2.6, 2.0) facing -90; they start back to back on
# the line between those two marks and pace apart on the count
PH_END = (-0.4, 2.4); EA_END = (1.6, -1.0)                                 # RE-RULED marks (render 1104.01, fan posts)
_dl = math.hypot(EA_END[0] - PH_END[0], EA_END[1] - PH_END[1])
DUEL_DIR = ((EA_END[0] - PH_END[0]) / _dl, (EA_END[1] - PH_END[1]) / _dl)
DUEL_MID = ((PH_END[0] + EA_END[0]) / 2, (PH_END[1] + EA_END[1]) / 2)
PH_BB = (DUEL_MID[0] - 0.32 * DUEL_DIR[0], DUEL_MID[1] - 0.32 * DUEL_DIR[1])
EA_BB = (DUEL_MID[0] + 0.32 * DUEL_DIR[0], DUEL_MID[1] + 0.32 * DUEL_DIR[1])
ph.path('2-16', 167.6, [PH_BB], '2-16', 169.7, f=facing_to(EA_BB, PH_BB), last_dwell=0.2)   # back to back on the turntable (SPOT: in his pool to 167.6)
ph.at('2-16', 172.5, PH_END[0], PH_END[1], f=180)                          # paces DS - ends back to the house (handoff to seg 8)

# ================================================================ ENSEMBLE
ens = {i: actor(f'ens{i}') for i in range(1, 11)}
first_wing = {1: 'D-UC', 2: 'W-USR', 3: 'W-USR', 4: 'W-USR', 5: 'W-DSL', 6: 'W-USR',
              7: 'W-MSL', 8: 'W-MSL', 9: 'W-MSL', 10: 'W-USR'}
for i in range(1, 11):
    ens[i].start(first_wing[i], f'Ensemble {i}')

# ---- 2-11 (REVIEW 2, Jack's verdict): the writer's line of seven at z -1.0 (marked INVENTED) is CUT. Both eyewitness
# accounts (ironinkpen, hamilton-lyrics) name only the King on his stool, Burr, Hamilton on the gallery and the two
# Virginians; the company's hits are sung, with no account of a body on the deck. No ensemble in 2-11.

# ---- 2-13 Hurricane (REVIEW 2, Jack's verdict): EIGHT of the company, not ten, and they START GATHERED round him
# (ironinkpen: "initially gathered around Hamilton, eventually moves like hurricane winds as the stage spins"), r 1.9,
# frozen at the still point; on the storm memory they are flung out to the outer ring and revolve with the turntable
# (Backstage/Blankenbuehler: they swivel round him on the turntable). The writer's ten-body even ring that swirled on at
# r 3.2 is cut; ens9 and ens10 are off until the decision, where they bring on the desk and his chair.
R = 3.2
R0 = 1.9
RING8 = range(1, 9)
base = {i: -67.5 + 45 * (i - 1) for i in RING8}                         # so the mother and her two bearers end the montage SR
hw = {1: 'W-USR', 2: 'D-UC', 3: 'D-UC', 4: 'W-USL', 5: 'W-MSL', 6: 'W-DSL', 7: 'W-DSR', 8: 'W-MSR'}   # each from the wing nearest
stag = {1: 5.4, 2: 6.6, 3: 5.4, 4: 6.6, 5: 6.6, 6: 5.4, 7: 5.4, 8: 6.6}
rot = {}
def revolve(a, th, deg, t0, t1, step=30, r0=R, r1=R):
    n = max(1, round(abs(deg) / step))
    a.last()['dwell'] = round(G('2-13', t0) - a.last()['g'], 2)
    for k in range(1, n + 1):
        tt = t0 + (t1 - t0) * k / n
        thk = th + deg * k / n
        rk = r0 + (r1 - r0) * k / n
        if k < n: a.go('2-13', tt, ring(rk, thk), dwell=0)
        else: a.go('2-13', tt, ring(rk, thk), f=inward(thk))
    return th + deg
for i in RING8:
    a = ens[i]; th = base[i]
    a.enter(hw[i], '2-13', stag[i], ring(R0, th), inward(th), speed=1.5)     # gathered round him
    a.face('2-13', 11.88, inward(th))                                      # frozen in shapes at the still point
    th = revolve(a, th, 90, 23.76, 34.33, r0=R0, r1=R)                     # the storm memory: flung out to the outer ring
    th = revolve(a, th, 45, 51.16, 64.49)                                  # the town helps
    th = revolve(a, th, 270, 70.47, 97.38)                                 # the montage
    rot[i] = th

# the mother (ens6) - lifted and carried away SR by ens7 and ens8
m6 = ens[6]; m7 = ens[7]; m8 = ens[8]
m6.at('2-13', 103.4, -0.8, 1.5, f=60)
d = (-0.774, 0.633); pp = (0.633, 0.774)
def off_(p, s): return (p[0] + s * pp[0], p[1] + s * pp[1])
m7.go('2-13', 104.3, off_((-0.9, 1.6), 0.65), f=60)
m8.go('2-13', 104.4, off_((-0.9, 1.6), -0.65), f=60)
for a, s in ((m6, 0), (m7, 0.65), (m8, -0.65)):
    a.last()['dwell'] = round(G('2-13', 104.8) - a.last()['g'], 2)
    a.go('2-13', 108.8, off_((-3.0, 3.3), s), dwell=0)
    a.go('2-13', 112.2, off_((-6.0, 4.7), s * 0.3), dwell=0)
    a.add(G('2-13', 113.4 + abs(s)), -7.3, 4.6, off=True)

# cockroaches: ens2 and ens4 crawl backwards across the downstage edge, slowly (placement invented)
for i, (p0, p1) in {2: ((2.4, 4.8), (-1.6, 4.8)), 4: ((3.6, 4.8), (-0.4, 4.8))}.items():
    a = ens[i]
    a.at('2-13', 112.0 + (i - 2) * 0.5, p0[0], p0[1], f=-90)
    a.last()['dwell'] = round(G('2-13', 116.28) - a.last()['g'], 2)
    a.at('2-13', 129.0, p1[0], p1[1], f=-90)
    a.exit('2-13', {2: 131.2, 4: 131.8}[i], 'W-DSR', speed=1.6)

# REVIEW 2: the rest of the ring (ens1, 3, 5) hold where the montage left them until the decision (the writer's +60 stir
# is cut: it walked ens1 across Maria's path to him)
# REVIEW (hamilton-lyrics post): at the decision the crew bring his desk on in front of him, his chair behind it and an
# extra chair in front of it; four of the company close in round the desk under the white light and pose, and stay
# into the Pamphlet's Build MC. REVIEW 2: the desk comes on with ens9 (the fourth of the four; she was off for the
# storm), his chair with ens10, the extra chair with ens8; those two go again (props.py SEGMENT 7).
ens[9].enter('D-UC', '2-13', 133.4, (0.6, 1.75), -90, speed=1.6, via=[(1.25, -3.4), (1.0, -1.0)])   # sets the desk down
ens[9].at('2-13', 134.9, 0.95, 1.4, f=facing_to((0.95, 1.4), (0.0, 2.0)))
ens[10].enter('D-UC', '2-13', 138.2, (0.65, 0.25), -90, speed=1.6, via=[(1.25, -3.4), (1.0, -1.0)])  # sets his chair behind him
ens[10].exit('2-13', 139.0, 'D-UC', speed=1.6, via=[(1.25, -3.4), (1.0, -1.0)])
ens[8].enter('W-MSL', '2-13', 134.4, (1.4, 2.95), -120, speed=1.6, via=[(5.0, -0.6), (2.6, 2.2)])   # sets the extra chair DS-SL of the desk (0.7, 2.6)
ens[8].exit('2-13', 135.2, 'W-MSL', speed=1.6, via=[(5.0, -0.6), (2.6, 2.2)])
desk4 = {1: (-0.95, 1.4), 3: (1.25, 2.3), 5: (-0.95, 2.4)}             # REVIEW 2: clear of the extra chair
for k_, (i, pos) in enumerate(desk4.items()):
    ens[i].last()['dwell'] = round(G('2-13', 130.65 + 0.3 * k_) - ens[i].last()['g'], 2)
    ens[i].go('2-13', 134.0 + 0.3 * k_, pos, f=facing_to(pos, (0.0, 2.0)))

# ---- 2-14 The Reynolds Pamphlet (REVIEW: restaged from the ETC renders of Binkley's real cues 1039.01, 1040, 1042,
# 1044 - a horseshoe of the company upstage of him, open to the house, tight at Build MC and wider by the King - and
# the hamilton-lyrics staging post: the desk-arch, the ring round Hamilton and Angelica, the pages at their feet)
E8 = [5, 1, 6, 7, 8, 2, 9, 3]                                              # round the horseshoe, SR to SL
HS = dict(zip(E8, [-90, -65, -40, -15, 15, 40, 65, 90]))
SA = dict(zip(E8, [-157.5, -112.5, -67.5, -22.5, 22.5, 67.5, 112.5, 157.5]))
KING_DR = (-3.8, 4.2)
pw = {6: ('W-USR', 5.0), 7: ('D-UC', 6.0), 8: ('D-UC', 4.6), 2: ('W-USL', 5.5)}
for j_, i in enumerate(E8):
    a = ens[i]; p0 = ring(2.6, HS[i])
    if i in pw:
        w, t = pw[i]
        a.enter(w, '2-14', t, p0, inward(HS[i]), speed=1.5)                # Build MC: the horseshoe builds round him
    else:
        a.last()['dwell'] = round(G('2-14', 0.48 + 0.3 * j_) - a.last()['g'], 2)
        a.go('2-14', 5.5 + 0.2 * j_, p0, f=inward(HS[i]))                  # the four from the desk join it
    a.face('2-14', 12.68 + 0.1 * j_, 0)                                    # every one pulls out a pamphlet and reads
    a.face('2-14', 37.72 - 0.4, inward(HS[i]))
    a.go('2-14', 40.0, ring(3.2, HS[i]), f=inward(HS[i]))                  # the horseshoe widens for chorus 1
    a.face('2-14', 41.0 + 0.05 * j_, facing_to(ring(3.2, HS[i]), KING_DR)) # King DR
    a.face('2-14', 51.16 + 0.05 * j_, 0)
# two of the men lift the desk into an archway for Angelica, then go back
for i, pos in ((2, (-0.6, 1.9)), (3, (0.6, 1.9))):
    a = ens[i]
    a.last()['dwell'] = round(G('2-14', 52.0) - a.last()['g'], 2)
    a.go('2-14', 53.6, pos, f=0, dwell=2.4)
    a.go('2-14', 59.0, ring(3.2, HS[i]), f=inward(HS[i]))
# they circle Hamilton and Angelica and drop their pages in a pile at their feet
CEN = (-0.2, 3.05)
for j_, i in enumerate(E8):
    a = ens[i]
    a.last()['dwell'] = round(G('2-14', 66.0 + 0.2 * j_) - a.last()['g'], 2)
    pt = ringc(CEN[0], CEN[1], 1.9, SA[i])
    a.go('2-14', 72.0, pt, f=facing_to(pt, CEN), dwell=0)
    for k in range(1, 4):
        pk = ringc(CEN[0], CEN[1], 1.9, SA[i] + 30 * k)
        a.go('2-14', 72.0 + 14.0 * k / 3, pk, dwell=0 if k < 3 else None, f=None if k < 3 else facing_to(pk, CEN))
# ens4 is James Reynolds: he pops through the gap in the horseshoe, poses, and goes
j4 = ens[4]
j4.add(G('2-14', 14.0), 1.25, -4.9, off=True, label='James Reynolds')
j4.enter('D-UC', '2-14', 22.0, (0.0, -0.7), 0, speed=1.7, via=[(1.25, -3.4), (0.0, -2.6)])
j4.exit('2-14', 24.6, 'D-UC', speed=1.7, via=[(1.25, -3.4), (0.0, -2.6)])
j4.add(G('2-14', 40.0), 1.25, -4.9, off=True, label='Ensemble 4')
# the USG reader
ens[10].enter('G-UC', '2-14', 6.0, (2.2, -3.3), 0, y='gallery')
ens[10].face('2-14', 41.0, -30)
# chorus 2: the gloating ring, r 2.0 round him at C, revolving (it continues the circling: start at SA + 90)
R3 = 2.0
for i in E8:
    a = ens[i]; th = SA[i] + 90
    a.last()['dwell'] = round(G('2-14', 88.0) - a.last()['g'], 2)
    a.at('2-14', 89.5, *ring(R3, th), f=inward(th), dwell=1.5)
    for k in range(1, 4):
        thk = th + 30 * k
        a.go('2-14', 91.0 + (101.45 - 91.0) * k / 3, ring(R3, thk), dwell=0 if k < 3 else None,
             f=None if k < 3 else inward(thk))
    th += 90
    a.last()['dwell'] = 0
    for k in range(1, 4):
        thk = th + 30 * k
        a.go('2-14', 101.45 + (115.66 - 101.45) * k / 3, ring(R3, thk), dwell=0 if k < 3 else None,
             f=None if k < 3 else inward(thk))
# the pages picked up, then off (each to the wing nearest the place the ring leaves them)
pex = {5: ('W-MSL', 118.6), 1: ('W-MSL', 119.6), 7: ('W-MSR', 118.6), 6: ('W-MSR', 119.6), 8: ('W-USR', 118.8),
       2: ('D-UC', 119.0), 9: ('D-UC', 120.6), 3: ('W-USL', 118.8)}
for i, (w, t) in pex.items():
    if i == 1:                                                             # REVIEW 2: ens1 takes the desk off with him
        ens[i].exit('2-14', t, w, speed=1.5, via=[(5.0, -0.6), (0.65, 2.05)])
    else:
        ens[i].exit('2-14', t, w, speed=1.5)
ens[10].exit('2-14', 118.6, 'G-UC')

# ---- 2-16 Blow Us All Away (REVIEW 2, Jack's verdict). CUT: the writer's party of nine (marked INVENTED). Kept, from
# evidence: the two women Philip goes SR to ask (ironinkpen; the newtfire libretto names them DOLLY and MARTHA;
# hamilton-lyrics: ensemble women swooning) - ens6 and ens7, from the top; the play at centre with its audience on
# chairs SL facing SR (ironinkpen), who turn to watch the quarrel - ens1-4 each bring a chair on from SL, sit, and take
# it off again in the clear (props.py SEGMENT 7); the play's two actors ens9 and ens10 (the count is invented: two).
girls = {6: ((-2.6, 1.6), 40, 1.0, 'Dolly'), 7: ((-3.0, 2.7), 50, 2.6, 'Martha')}
for i, (pos, f, t, lab) in girls.items():
    ens[i].enter('W-USR', '2-16', t, pos, f, speed=1.5, label=lab,        # their libretto names, allowed by the cast file since review 2
                 via=[(-5.0, -2.9), (-3.6, -1.2)] if i == 7 else None)
    ens[i].face('2-16', 25.85, 0)                                          # the hook
    ens[i].face('2-16', 27.24, f - 15)
    ens[i].face('2-16', 30.0, 60)                                          # Philip comes to them
ens[7].exit('2-16', 40.6, 'W-DSR', speed=1.4)
ens[6].exit('2-16', 42.4, 'W-DSR', speed=1.4)
for i in (6, 7):                                                           # back to the company in the wing
    ens[i].add(G('2-16', 47.0), 7.3, 4.6, off=True, label=f'Ensemble {i}')
SEATS = {1: (3.0, 0.6), 2: (3.0, 1.8), 3: (1.6, 1.8), 4: (1.6, 0.6)}     # the theatre audience, SL, facing SR
seat_w = {1: ('W-MSL', 49.4), 2: ('W-DSL', 49.8), 3: ('W-DSL', 51.4), 4: ('W-USL', 50.6)}
for i, st in SEATS.items():
    ens[i].enter(seat_w[i][0], '2-16', seat_w[i][1], st, -90, speed=1.4)   # each brings a chair on, sits, watching the play
    ens[i].face('2-16', 59.39 + 0.1 * i, 60)                               # turn to the quarrel
    ens[i].face('2-16', 70.14, 75)                                         # the gasp
players = {9: ((-1.2, 0.5), 'W-USR', 50.5), 10: ((-0.4, 1.5), 'W-MSR', 51.0)}
for i, (st, w, t) in players.items():
    ens[i].enter(w, '2-16', t, st, 90, speed=1.4)                          # the play, centre, played out to the SL audience
    ens[i].face('2-16', 59.39, 60)
sx = {1: ('W-MSL', 73.0), 2: ('W-DSL', 73.0), 3: ('W-MSL', 75.6), 4: ('W-USL', 74.4), 9: ('W-USR', 72.6), 10: ('W-DSR', 72.6)}
for i, (w, t) in sx.items():
    ens[i].exit('2-16', t, w, speed=1.5)
# George Eacker
ea = ens[5]
ea.enter('G-UC', '2-16', 50.0, (4.9, 2.5), -90, y='gallery', label='George Eacker',  # SPOT: the box at the SLG's DS end
         via=[(0.6, -3.35), (4.75, -3.3), (4.9, -2.5)])                    # his box, the SL gallery
ea.face('2-16', 59.39, -80)
ea.face('2-16', 64.82, -85)                                                # the insult
ea.face('2-16', 71.73, -95)
ea.exit('2-16', 74.0, 'G-UC', via=[(0.6, -3.35), (4.75, -3.3), (4.9, -2.5)])
ea.add(G('2-16', 120.0), 7.3, 4.6, off=True)
ea.enter('W-DSL', '2-16', 151.12, (3.4, 3.6), -30, speed=1.4)              # DSL, his pool
ea.face('2-16', 156.52, -40)
ea.path('2-16', 167.6, [EA_BB], '2-16', 169.7, f=facing_to(PH_BB, EA_BB), last_dwell=0.2)  # back to back with Philip (SPOT: in his pool to 167.6)
ea.at('2-16', 172.5, EA_END[0], EA_END[1], f=180)                                     # REVIEW (ruled exception): paces to his mark
                                                                           # and turns toward Philip; seg 8 fires the shot
# REVIEW 2: the writer's duel seconds (ens2, ens3) and seven watchers (USG and deck) are CUT - all marked INVENTED; the
# libretto names no second, and the only account (ironinkpen) has just the two on the spinning platform. The count is
# the company's, unseen.

# ---------------------------------------------------------------- write
def r3(v): return round(v, 3)
out = {}
for aid, a in A.items():
    lst = []
    for d in a.w:
        tr, at = TA(d['g'])
        wp = {'track': tr, 'at': at, 'x': r3(d['x']), 'z': r3(d['z'])}
        for k in ('y', 'dwell', 'facing', 'off', 'label'):
            if k in d:
                v = d[k]
                if k == 'dwell': v = round(v, 2)
                if k == 'facing': v = round(v, 1)
                wp[k] = v
        lst.append(wp)
    out[aid] = lst
seg = {'segment': 7, 'tracks': [t for t, _ in TR], 'waypoints': out, 'notes': open(os.path.join(HERE, 'seg7_notes.txt'), encoding='utf-8').read().strip() if os.path.exists(os.path.join(HERE, 'seg7_notes.txt')) else ''}
dst = os.path.join(HERE, 'segments', 'seg7.json')
os.makedirs(os.path.join(HERE, 'segments'), exist_ok=True)
with open(dst, 'w', encoding='utf-8') as f:
    json.dump(seg, f, indent=1)
print('waypoints', sum(len(v) for v in out.values()), {k: len(v) for k, v in out.items()})

# ---------------------------------------------------------------- own checks: pose model, collisions, scenery, speed
def legs(a):
    """list of (t_leave, t_arrive, p0, p1, visible) plus stands"""
    w = a.w; res = []
    for i in range(len(w)):
        cur = w[i]
        if i + 1 < len(w):
            nxt = w[i + 1]
            dd = dist((cur['x'], cur['z']), (nxt['x'], nxt['z']))
            if cur.get('dwell') is not None: tl = cur['g'] + cur['dwell']
            else: tl = max(cur['g'], nxt['g'] - dd / 1.3)
            tl = min(tl, nxt['g'])
            res.append((cur['g'], tl, (cur['x'], cur['z']), (cur['x'], cur['z']), not cur.get('off')))
            vis = not (cur.get('off') and nxt.get('off'))
            res.append((tl, nxt['g'], (cur['x'], cur['z']), (nxt['x'], nxt['z']), vis))
            if nxt['g'] > tl + 1e-6 and dd / (nxt['g'] - tl) > 3.2:
                print('FAST', a.id, TA(tl), TA(nxt['g']), round(dd / (nxt['g'] - tl), 2))
    return res
def pose(a, t):
    L = A_legs[a.id]
    if t < a.w[0]['g']: return None
    for (t0, t1, p0, p1, vis) in L:
        if t0 - 1e-9 <= t <= t1 + 1e-9:
            if not vis: return None
            u = 0 if t1 <= t0 else (t - t0) / (t1 - t0)
            return (p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u)
    last = a.w[-1]
    return None if last.get('off') else (last['x'], last['z'])
A_legs = {aid: legs(a) for aid, a in A.items()}
def level(a, t):
    # gallery if nearest waypoint in time says gallery
    best = min(a.w, key=lambda d: abs(d['g'] - t))
    return best.get('y', 'deck')
boxes = {'SR stair': (-4.75, -4.25, -0.2, 1.75), 'SL stair': (2.3, 4.4, -2.75, -2.15),
         'post SR': (-6.75, -6.25, 3.9, 4.35), 'post SL': (6.25, 6.75, 3.9, 4.35)}
hits = {}
t = 0.0
while t <= END:
    ps = {}
    for aid, a in A.items():
        p_ = pose(a, t)
        if p_: ps[aid] = (p_, level(a, t))
    ids = sorted(ps)
    for x_ in range(len(ids)):
        for y_ in range(x_ + 1, len(ids)):
            (p1, l1), (p2, l2) = ps[ids[x_]], ps[ids[y_]]
            if l1 == l2 and dist(p1, p2) < 0.5:
                key = (ids[x_], ids[y_]); hits.setdefault(key, []).append(t)
    for aid, (p_, l_) in ps.items():
        if l_ != 'deck': continue
        for nm, (x0, x1, z0, z1) in boxes.items():
            if x0 - 0.15 <= p_[0] <= x1 + 0.15 and z0 - 0.15 <= p_[1] <= z1 + 0.15:
                hits.setdefault((aid, nm), []).append(t)
    t += 0.1
for k, ts in hits.items():
    # group into runs
    runs = []; s = ts[0]; pv = ts[0]
    for tt in ts[1:]:
        if tt - pv > 0.15: runs.append((s, pv)); s = tt
        pv = tt
    runs.append((s, pv))
    for (s, e_) in runs:
        print('CLOSE', k, TA(s), '..', TA(e_))
