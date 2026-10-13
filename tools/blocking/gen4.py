# Segment 4 blocking generator (1-18 .. 1-23). Writes segments/seg4.json.
# Times are written on a GLOBAL segment clock (seconds from the top of 1-18) and converted.
import json, math, os, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
WT = os.path.dirname(os.path.dirname(HERE))   # the repository root
OFFS = {'1-18': 0.0, '1-19': 127.0, '1-20': 224.0, '1-21': 466.0, '1-22': 565.0, '1-23': 749.0}
LENS = {'1-18': 127.0, '1-19': 97.0, '1-20': 242.0, '1-21': 99.0, '1-22': 184.0, '1-23': 385.0}
ORDER = ['1-18', '1-19', '1-20', '1-21', '1-22', '1-23']
def T(tr, at): return OFFS[tr] + at

ENT = {'W-DSR': (-7.3, 4.6), 'W-DSL': (7.3, 4.6), 'W-MSR': (-8.5, 0.0), 'W-MSL': (8.0, -0.5),
       'W-USR': (-8.5, -3.0), 'W-USL': (8.5, -3.0), 'D-UC': (1.25, -4.9), 'G-UC': (0.6, -4.8)}
NAMES = {'hamilton': 'Hamilton', 'burr': 'Burr', 'eliza': 'Eliza', 'angelica': 'Angelica', 'peggy': 'Peggy',
         'washington': 'Washington', 'lafayette': 'Lafayette', 'mulligan': 'Mulligan', 'laurens': 'Laurens',
         'king': 'King George'}
for i in range(1, 11): NAMES['ens%d' % i] = 'Ensemble %d' % i
ENS = ['ens%d' % i for i in range(1, 11)]
C = (0.0, 0.95)

W = defaultdict(list)

def facing_to(p, q):
    return math.degrees(math.atan2(q[0] - p[0], q[1] - p[1]))

def wp(a, t, x, z, face=None, dwell=None, off=False, y=None, label=None):
    if isinstance(face, tuple): face = facing_to((x, z), face)
    if not W[a] and label is None: label = NAMES[a]
    W[a].append(dict(t=float(t), x=float(x), z=float(z), face=face, dwell=dwell, off=off, y=y, label=label))

def off(a, t, name, label=None):
    x, z = ENT[name]
    wp(a, t, x, z, off=True, y='gallery' if name == 'G-UC' else None, label=label)

def last(a): return W[a][-1]
def pos(a): w = W[a][-1]; return (w['x'], w['z'])
def hold_until(a, t):
    w = W[a][-1]; w['dwell'] = round(t - w['t'], 2); assert w['dwell'] >= 0, (a, t, w)
def polar(r, th, c=C): th = math.radians(th); return (c[0] + r * math.sin(th), c[1] - r * math.cos(th))
def dist(p, q): return math.hypot(p[0] - q[0], p[1] - q[1])

def place(actors, pts, t, face=None, dwell=None):
    for a, p in zip(actors, pts):
        f = face(p) if callable(face) else face
        wp(a, t, p[0], p[1], face=f, dwell=dwell)

def revolve(a, r, th0, th1, t0, t1, step=35.0, face=None, c=C, endstop=True):
    """she stands at polar(r, th0) (last waypoint); leaves at t0; walks the arc to th1 at t1."""
    hold_until(a, t0)
    n = max(1, int(math.ceil(abs(th1 - th0) / step - 1e-9)))
    for i in range(1, n + 1):
        th = th0 + (th1 - th0) * i / n; t = t0 + (t1 - t0) * i / n
        x, z = polar(r, th, c)
        if i < n: wp(a, t, x, z, dwell=0)
        else: wp(a, t, x, z, face=face if face is not None else 0, dwell=None if endstop else 0)

def ring(n, r, start, step=None):
    step = step if step is not None else 360.0 / n
    return [polar(r, start + step * k) for k in range(n)]

def arc(n, r, a0, a1, c=C):
    return [polar(r, a0 + (a1 - a0) * k / (n - 1), c) for k in range(n)]

def exit_to(a, t_leave, name, speed=1.5, via=None):
    """stand till t_leave, walk (via points) to the entrance at `speed`"""
    hold_until(a, t_leave)
    p = pos(a); t = t_leave
    for v in (via or []):
        t += dist(p, v) / speed; wp(a, t, v[0], v[1], dwell=0); p = v
    q = ENT[name]; t += dist(p, q) / speed
    off(a, round(t, 2), name)
    return t

def nearest(p, names):
    return min(names, key=lambda n: dist(p, ENT[n]))

# stairs
SLF, SLT = (2.2, -2.45), (4.5, -2.45)        # SL stair foot / top
SRF, SRT = (-4.5, 1.85), (-4.5, -0.3)        # SR stair foot / top
SLJ = (4.85, -2.45)                           # on the SLG beside the stair top
def climb_SL(a, t_foot, dur=4.5): wp(a, t_foot, *SLF, dwell=0); wp(a, t_foot + dur, *SLT, dwell=0, y='top'); return t_foot + dur
def down_SL(a, t_top, dur=4.5): wp(a, t_top, *SLT, dwell=0, y='top'); wp(a, t_top + dur, *SLF, dwell=0); return t_top + dur
def climb_SR(a, t_foot, dur=4.5): wp(a, t_foot, *SRF, dwell=0); wp(a, t_foot + dur, *SRT, dwell=0, y='top'); return t_foot + dur
def down_SR(a, t_top, dur=4.5): wp(a, t_top, *SRT, dwell=0, y='top'); wp(a, t_top + dur, *SRF, dwell=0); return t_top + dur
def g(a, t, x, z, face=None, dwell=None): wp(a, t, x, z, face=face, dwell=dwell, y='gallery')

# ====================================================================================
# 1-18 GUNS AND SHIPS
# ====================================================================================
tr = '1-18'
GS = (5.49, 2.36)

# REVIEW: Burr opens the number from the stage-left balcony (the G&S spot): BroadwayWorld forum, two OBC-era
# patrons (2016) - Burr gives the opening of Guns and Ships from the stage-left balcony. He comes along the gallery
# from the back way while he starts (the album gives no lead-in), sings the intro there, and goes back the same way in
# the build while the company's attention goes to Lafayette on the deck.
off('burr', T(tr, 0.0), 'G-UC')
g('burr', T(tr, 0.8), 0.6, -3.35, dwell=0)
g('burr', T(tr, 3.0), 4.75, -3.2, dwell=0)
g('burr', T(tr, 3.6), 4.9, -2.2, dwell=0)
g('burr', T(tr, 5.8), 4.9, 1.9, dwell=0)
g('burr', T(tr, 6.3), GS[0], GS[1], face=-40)
hold_until('burr', T(tr, 20.5))
g('burr', T(tr, 21.1), 4.9, 1.9, dwell=0)
g('burr', T(tr, 24.3), 4.9, -2.2, dwell=0)
g('burr', T(tr, 25.1), 4.75, -3.2, dwell=0)
g('burr', T(tr, 28.3), 0.6, -3.35, dwell=0)
off('burr', T(tr, 29.5), 'G-UC')

# REVIEW2 (Jack's verdict: the ensemble is used too much, much of the choreography is wrong). Eight soldiers, not
# twelve: Laurens and Mulligan are out of this number (their labels would read as the characters; Mulligan's entrance
# is Yorktown's). The company comes on WITH Lafayette's entrance (cue 561, the build; the Disney+ frame behind cue 562
# has "the company in warm amber side light" round him), stands in two loose groups either side of the centre, and
# only turns to whoever has the number. Cut as invented: the march-on during Burr's intro, the outer-ring walk at 42.3
# (cue 563's "fan opens" is the BEAMS), the upstage arc, the chant blocks, the arcs round Washington, the V, and the
# upstage watchers' line that stood through History.
CO8 = ['ens%d' % i for i in range(1, 9)]
G18 = {'ens1': ('W-USR', (-3.6, -1.1)), 'ens2': ('W-MSR', (-2.3, -0.5)), 'ens3': ('W-MSR', (-3.7, 0.6)), 'ens4': ('W-DSR', (-2.5, 1.3)),
       'ens5': ('W-USL', (3.6, -1.1)), 'ens6': ('W-MSL', (2.3, -0.5)), 'ens7': ('W-MSL', (3.7, 0.6)), 'ens8': ('W-DSL', (2.5, 1.3))}
for a in CO8:
    e, p = G18[a]
    off(a, T(tr, 0.0), e)
    wp(a, T(tr, 24.0), p[0], p[1], face=facing_to(p, (0.0, 1.0)))     # they walk on from about 19 s, behind his burst
for a in CO8:
    wp(a, T(tr, 31.3), *pos(a), face=facing_to(pos(a), (0.0, 2.1)))     # Lafayette in the ring of beams
    wp(a, T(tr, 59.2), *pos(a), face=facing_to(pos(a), C))              # Washington's special
for a in CO8:   # the company chant (cue 567): a step in towards the front, out to the house
    x, z = pos(a); wp(a, T(tr, 69.6), x * 0.85, z + 0.8, face=0)
WDC = (0.0, 1.6)   # SPOT: Washington in his special (cue 568: Viper 93 at (0, 1.54))
for a in CO8:
    wp(a, T(tr, 80.0), *pos(a), face=facing_to(pos(a), WDC))            # his anthem: they turn to him
    wp(a, T(tr, 104.4), *pos(a), face=0)                                 # the build, out front
for a in CO8:   # the button (cue 572): everything out but Washington and Hamilton - the company goes in the dark
    exit_to(a, T(tr, 120.0), G18[a][0], speed=1.5)

LAFC = (0.0, 2.1)   # REVIEW: the ring of beams of cue 562 is centred (0, 2.0), his front key (0, 2.3)
# REVIEW: Lafayette bursts in up centre through the company on the shout (17.6) and raps on the deck; he is centre
# in the cathedral of beams by 31.3 (cue 562's ring of ten Vipers round (0, 2.0); Jack's note: the ring on him at 34.2).
# The balcony at the top is Burr's (BroadwayWorld forum), so the 31.3 conflict goes away.
off('lafayette', T(tr, 0.0), 'D-UC')
off('lafayette', T(tr, 14.5), 'D-UC')
wp('lafayette', T(tr, 17.0), 0.6, -2.6, dwell=0)
wp('lafayette', T(tr, 19.0), 0.0, -0.2, face=0)
wp('lafayette', T(tr, 24.5), -1.0, 1.0, face=20)
wp('lafayette', T(tr, 28.0), 1.0, 1.4, face=-20)
wp('lafayette', T(tr, 31.3), LAFC[0], LAFC[1], face=0)
hold_until('lafayette', T(tr, 40.0))
wp('lafayette', T(tr, 42.3), -1.0, 2.8, face=15)
wp('lafayette', T(tr, 45.7), 1.0, 2.8, face=-15)
wp('lafayette', T(tr, 48.8), 0.0, 1.8, face=0)
wp('lafayette', T(tr, 59.2), 1.4, 1.6, face=-65)
wp('lafayette', T(tr, 69.6), 1.2, 3.3, face=0)
wp('lafayette', T(tr, 80.0), 1.6, 3.7, face=-60)
wp('lafayette', T(tr, 104.4), 1.6, 3.1, face=0)
wp('lafayette', T(tr, 109.6), 1.4, 3.5, face=-10)
exit_to('lafayette', T(tr, 120.2), 'W-DSL', speed=1.5, via=[(5.8, 4.75)])

# Washington: through the deck door to the centre for the plan, his anthem DC, back to centre for the button
off('washington', T(tr, 0.0), 'D-UC')
off('washington', T(tr, 50.0), 'D-UC')
wp('washington', T(tr, 54.5), 0.3, -2.0, dwell=0)
wp('washington', T(tr, 59.2), 0.0, 0.95, face=0)
# SPOT: cues 568-572 hold Washington's special (Viper 93) at (0, 1.54) under the anthem: he sings in it, not DC
wp('washington', T(tr, 80.0), 0.0, 1.65, face=0)
wp('washington', T(tr, 93.7), 0.0, 1.55, face=0)
wp('washington', T(tr, 108.0), 0.0, 1.2, face=0)

# Hamilton: sent for - in from DSR at the end, into his DS special facing his general
off('hamilton', T(tr, 0.0), 'W-DSR')
off('hamilton', T(tr, 112.0), 'W-DSR')
wp('hamilton', T(tr, 118.5), -0.8, 4.0, face=165)

# ====================================================================================
# 1-19 HISTORY HAS ITS EYES ON YOU
# ====================================================================================
tr = '1-19'
# SPOT: every cue of 1-19 (576-583) holds his special, Viper 93 at (0, 1.96) r 0.82: he moves inside it
wp('washington', T(tr, 0.5), 0.2, 1.75, face=0)
wp('washington', T(tr, 15.0), 0.3, 2.3, face=0)
wp('washington', T(tr, 37.3), 0.5, 2.2, face=-20)
wp('washington', T(tr, 52.9), -0.2, 2.25, face=-60)
wp('washington', T(tr, 65.2), -0.45, 2.3, face=-75)
wp('washington', T(tr, 74.7), 0.0, 2.0, face=0)
wp('washington', T(tr, 87.1), 0.0, 1.9, face=0)
exit_to('washington', T(tr, 95.0), 'D-UC', speed=1.3, via=[(-1.0, 0.5)])

wp('hamilton', T(tr, 0.5), -1.4, 3.4, face=70)
wp('hamilton', T(tr, 15.0), -1.4, 3.5, face=80)
wp('hamilton', T(tr, 37.3), -1.0, 3.9, face=45)
wp('hamilton', T(tr, 52.9), -0.8, 3.8, face=60)
wp('hamilton', T(tr, 74.7), -1.2, 3.2, face=30)
# into Yorktown: onto the box near the lip
hold_until('hamilton', T(tr, 95.0))
wp('hamilton', T('1-20', 0.0), 0.0, 4.7, face=0)

# REVIEW2: History is Washington and Hamilton alone. The company is OFF for the whole number: the previous passes
# stood twelve in an upstage line and stepped them into invented arcs for each chorus. The ensemble's backing is
# heard, not seen ("the chorus sings" is not evidence of bodies), and nothing places them. They walk on only in the
# transition (cue 584, 94.5: "the cold column ... troops in line", under the drum count-in) to form the Yorktown line.
LINE = [(-4.0 + 0.8 * k, -1.4) for k in range(11)]
YC = ['ens1', 'ens2', 'ens3', 'ens4', 'laurens', 'ens5', 'ens6', 'ens7', 'ens8', 'ens9', 'ens10']   # SR -> SL
for a, p in zip(YC, LINE):
    if a == 'ens10': continue
    off(a, T(tr, 94.5), nearest(p, ['W-USR', 'W-MSR', 'D-UC', 'W-USL', 'W-MSL']))
    wp(a, T('1-20', 2.5), p[0], p[1], face=0)
# the Yorktown box (Joan Marcus photo: Hamilton on a box near the lip): ens10 brings it on from W-DSL in the dark at
# the lip (cue 583 has pulled the stage in to Washington), sets it down, and takes the SL end of the line
off('ens10', T(tr, 90.0), 'W-DSL')
wp('ens10', T(tr, 94.5), 0.5, 4.55, face=-90, dwell=0.3)
wp('ens10', T('1-20', 2.5), LINE[10][0], LINE[10][1], face=0)
W1s = sorted([(-4.0, -3.1), (-3.2, -3.1), (-2.4, -3.1), (-1.6, -3.1), (-0.8, -3.1), (0.0, -3.1), (0.8, -3.1), (1.6, -3.1),
              (-3.6, -2.2), (-2.0, -2.2), (-0.4, -2.2), (1.2, -2.2)])

# ====================================================================================
# 1-20 YORKTOWN
# ====================================================================================
tr = '1-20'
# the line advances, falls back for the night pools, surges for the company's Shot reprise
place(YC, [(x, 1.2) for x, _ in LINE], T(tr, 12.0), face=0)
place(YC, [(x, 0.2) for x, _ in LINE], T(tr, 22.4), face=0)   # SPOT2: back by 22.4, clear of the centre pool
place(YC, [(x, 2.4) for x, _ in LINE], T(tr, 34.5), face=0)
# Lafayette and Hamilton, the farewell exchange DSC
off('lafayette', T(tr, 12.0), 'W-DSL')
# SPOT2: cue 589 is preset 402 "3 pools" (Eos): the farewell is played in its centre pool, Viper 13 at (-0.04, 1.84)
wp('lafayette', T(tr, 22.4), 0.4, 1.9, face=-60)
wp('hamilton', T(tr, 22.4), -0.45, 1.9, face=60)
wp('lafayette', T(tr, 32.2), 0.6, 3.6, face=0)
wp('hamilton', T(tr, 32.2), -0.6, 3.6, face=0)
def assign_ring(actors, pts):
    out, free = {}, list(range(len(pts)))
    for a in sorted(actors, key=lambda a: pos(a)[0]):
        k = min(free, key=lambda k: dist(pos(a), pts[k])); free.remove(k); out[a] = k
    return out
# REVIEW2: the first title phrase (43.6) no longer turns the line into a walking ring (invented from cue 591's turning
# GOBOS). The line holds at the front of the stage, then falls back into the upstage dark for Hamilton alone (51.2).
RING_Y = YC + ['lafayette']
wp('hamilton', T(tr, 43.6), 0.0, 4.6, face=0)
wp('hamilton', T(tr, 52.0), 0.0, 4.55, face=0)   # SPOT: cue 592's centre shaft (Viper 98) crosses the lip at (0, 5.55)
REC = [a for a in RING_Y if a != 'ens10']
srt = sorted(REC, key=lambda a: pos(a)[0])
place(srt, [p for p in W1s if p != (1.6, -3.1)], T(tr, 56.0), face=0)
# ens10 (the SL end of the line) goes off DL instead, to come back for the box
exit_to('ens10', T(tr, 52.0), 'W-DSL', speed=1.4)
wp('hamilton', T(tr, 61.2), -1.1, 3.7, face=10)   # SPOT: cue 593, his DS special (X4 44 at (-1.31, 3.53)) warms
wp('hamilton', T(tr, 66.7), 0.0, 3.2, face=0)
# the box struck on the march (66.7, "the drive returns"): ens10 in from DL, out with it the same way
wp('ens10', T(tr, 70.0), 0.55, 4.55, face=-90, dwell=0.3)
exit_to('ens10', T(tr, 70.3), 'W-DSL', speed=1.5)
# REVIEW2: the night attack (cue 595; the Disney+ frame behind it: "each soldier in his own small warm-white pool on
# the turntable, black between"). The cue lights twelve pools; twelve bodies stand in them - Hamilton (Viper 4),
# Laurens (Viper 13, held through 597-598), Lafayette in the DSR one (he has the DR pool at 100.1) and nine soldiers.
# Cut: the march block, and the six soldiers climbing to the SR arm, the SL gallery and the USG for the "gallery
# specials" (cue 596 is a reconstruction; only two USG units are lit, and the climbs and descents were the busiest
# invented traffic in the number).
TAB = [(-1.97, -0.80), (0.11, -1.37), (1.86, -0.75), (-2.69, 1.60), (-1.05, 0.98), (1.04, 1.07), (2.69, 1.66),
       (-3.18, 3.37), (-1.58, 3.99), (-0.09, 3.16), (1.52, 3.99), (3.42, 3.68)]
NIGHT = [a for a in REC if a not in ('laurens', 'lafayette')]       # ens1..ens9
npools = [p for k, p in enumerate(TAB) if k not in (6, 7, 9)]        # minus Laurens', Lafayette's, Hamilton's
pk = assign_ring(NIGHT, npools)
for a in NIGHT:
    p = npools[pk[a]]; wp(a, T(tr, 72.0), p[0], p[1] - 0.3, face=0)
wp('laurens', T(tr, 72.0), TAB[6][0], TAB[6][1] - 0.3, face=0)
wp('lafayette', T(tr, 72.0), TAB[7][0], TAB[7][1] - 0.3, face=0)
wp('hamilton', T(tr, 72.5), TAB[9][0], TAB[9][1] - 0.05, face=0)
DECKY = NIGHT + ['laurens', 'lafayette']
for a in DECKY:   # the creep: a slow advance inside each pool
    x, z = pos(a); hold_until(a, T(tr, 80.0)); wp(a, T(tr, 84.0), x, z + 0.4, face=0)
# the friends' fortunes: Hamilton narrates DS; Laurens in his own pool; Lafayette at the bay DR
wp('hamilton', T(tr, 92.0), 0.05, 3.0, face=0)   # SPOT: cue 597's warm key on him is X4 43, focused (0.06, 2.98)
wp('laurens', T(tr, 93.0), 2.75, 1.7, face=-20)  # SPOT: Laurens' own pool is Viper 13 (2.69, 1.66), lit 595-598
wp('lafayette', T(tr, 100.1), -3.5, 3.4, face=20)
# Mulligan bursts in from upstage
off('mulligan', T(tr, 100.0), 'D-UC')
wp('mulligan', T(tr, 108.5), 0.4, -1.0, dwell=0)
wp('mulligan', T(tr, 111.0), 0.3, 2.0, face=0)
M = (0.3, 2.0)
for a in NIGHT:   # every soldier turns to him
    wp(a, T(tr, 111.5), *pos(a), face=facing_to(pos(a), M))
# the rally: the nearest gather round him (cue 600, full stage)
rallyers = ['ens2', 'ens3', 'ens4', 'ens5', 'laurens', 'lafayette']
rpts = arc(6, 1.8, -95, 95, M)
rk = assign_ring(rallyers, rpts)
for a in rallyers:
    p = rpts[rk[a]]; wp(a, T(tr, 120.1), p[0], p[1], face=facing_to(p, M))
# the drill: a block of twelve (ens10 back in from DL), Hamilton and Lafayette in front
B12 = YC + ['mulligan']
BLK12 = [(x, z) for z in (-0.6, 0.8, 2.2) for x in (-2.4, -0.8, 0.8, 2.4)]
bk = assign_ring(B12, BLK12)
for a in B12:
    p = BLK12[bk[a]]; wp(a, T(tr, 129.9), p[0], p[1], face=0)
wp('hamilton', T(tr, 129.9), -0.8, 3.6, face=0)
wp('lafayette', T(tr, 129.9), 0.8, 3.6, face=0)
# REVIEW2: the battle is the line, not shapes: two ranks (133.3) charge (135.8); on the cold turn (141.7, cue 604)
# they freeze and move on in slow motion (Wyzant viewer account: the dancers stop, then seem to move in slow motion);
# back in the red (146) the ranks re-form and charge to the lip (150.5). Cut: the counter-walked rings at 138.4-141.7
# and the outward drift (invented).
LX = [-3.5, -2.1, -0.7, 0.7, 2.1, 3.5]
LINES = [(x, 2.2) for x in LX] + [(x, 0.5) for x in LX]
lk = assign_ring(B12, LINES)
for a in B12:
    p = LINES[lk[a]]; wp(a, T(tr, 133.3), p[0], p[1], face=0)
wp('hamilton', T(tr, 133.3), -0.6, 3.6, face=0)
wp('lafayette', T(tr, 133.3), 0.6, 3.6, face=0)
for a in B12:
    x, z = pos(a); wp(a, T(tr, 135.8), x, z + 0.8, face=0)
wp('hamilton', T(tr, 135.8), -4.4, 3.7, face=30)
wp('lafayette', T(tr, 135.8), 4.4, 3.7, face=-30)
wp('hamilton', T(tr, 138.6), -4.2, 4.2, face=40)
wp('lafayette', T(tr, 138.6), 4.2, 4.2, face=-40)
for a in B12:   # the freeze, then the slow-motion advance
    x, z = pos(a); hold_until(a, T(tr, 141.7)); wp(a, T(tr, 145.6), x, z + 0.5, face=0)
wp('hamilton', T(tr, 143.0), -3.3, 4.4, face=20)
wp('lafayette', T(tr, 143.0), 3.3, 4.4, face=-20)
# back to red: the lines re-form upstage and charge to the lip; ens5 slips away to become the redcoat
B11 = [a for a in B12 if a != 'ens5']
for a in B11:   # each rank straight back 3.1 m (no reshuffle)
    x, z = pos(a); wp(a, T(tr, 148.0), x, z - 3.1, face=0)
for a in B11:
    x, z = pos(a); wp(a, T(tr, 150.5), x, z + 2.6, face=0)
wp('hamilton', T(tr, 148.0), -0.7, 2.6, face=0)
wp('lafayette', T(tr, 148.0), 0.7, 2.6, face=0)
wp('hamilton', T(tr, 150.5), -0.8, 4.3, face=0)
wp('lafayette', T(tr, 150.5), 0.8, 4.3, face=0)
# the redcoat with the white flag
hold_until('ens5', T(tr, 146.0))
off('ens5', T(tr, 151.5), 'D-UC')
# SPOT: cue 606's "cool special upstage centre for the redcoat" is Viper 18, straight down onto the DECK at (0, -1.58)
off('ens5', T(tr, 152.0), 'D-UC')
wp('ens5', T(tr, 155.0), 0.0, -1.6, face=0)
# after a week: the soldiers in a few pools, all turned to the parapet
# SPOT: cue 606's four warm soldier pools (Vipers 16, 13, 5, 1); Hamilton in the centre one (Viper 8 at (0, 2.01))
P12 = [(1.66, 0.60), (-1.55, 0.52), (2.46, 2.74), (-2.46, 2.74)] + [polar(3.2, a) for a in (30, 70, 110, 150, 210, 250, 290, 330)]
pk = assign_ring(B11 + ['lafayette'], P12)
for a in B11 + ['lafayette']:
    p = P12[pk[a]]; wp(a, T(tr, 158.0), p[0], p[1], face=facing_to(p, (0.0, -1.6)) * 0.6)
wp('hamilton', T(tr, 155.5), 0.0, 2.3, face=0)
# REVIEW2: "it is over" (169.8) and the celebration (189.6): the soldiers stay where they are and turn out (the
# arc at 170.5 and the full-stage spread at 189.6 were invented reshuffles)
for a in B11 + ['lafayette']:
    wp(a, T(tr, 170.5), *pos(a), face=0)
wp('hamilton', T(tr, 169.8), 0.0, 2.6, face=0)
hold_until('ens5', T(tr, 169.0))
off('ens5', T(tr, 172.0), 'D-UC')   # SPOT: back out through the deck door
# Washington comes through the door: the surrender terms, his smile
off('washington', T(tr, 173.0), 'D-UC')
wp('washington', T(tr, 179.8), 0.0, -0.6, face=0)
wp('hamilton', T(tr, 179.8), 0.0, 2.6, face=165)
wp('washington', T(tr, 189.6), 0.0, -2.6, face=0)
wp('hamilton', T(tr, 189.6), 0.0, 1.0, face=0)
off('ens5', T(tr, 186.0), 'D-UC')
wp('ens5', T(tr, 191.0), -0.9, -1.4, face=0)    # the redcoat back among the company
wp('washington', T(tr, 199.0), 0.0, -3.1, face=0)
wp('hamilton', T(tr, 198.4), 0.0, 0.95, face=0)
# REVIEW2: the World Turned Upside Down. Cut: nine on the outer ring and four on the inner, walked 160 / 120 degrees
# against each other and back (invented from cues 609.2/609.3, whose "spin" is the Construction GOBOS turning). Now
# each soldier walks slowly (a stagger, not a march) to his own pool of the final tableau and holds there; the tableau
# (LSA: "the company on the turntable, each brandishing a weapon, isolated in his own pool") is then already made.
OUT9 = ['ens1', 'ens2', 'ens3', 'ens4', 'ens5', 'ens6', 'ens7', 'ens8', 'laurens']
IN4 = ['ens9', 'ens10', 'mulligan', 'lafayette']
tab_bodies = OUT9 + IN4
tab_free = [k for k in range(len(TAB)) if k != 4]
TABK = {}
for group in (['lafayette', 'laurens', 'mulligan'], tab_bodies):     # the principals first, then the company
    for d_, a, k in sorted((dist(pos(a), TAB[k]), a, k) for a in group for k in tab_free):
        if a in TABK or k in TABK.values(): continue
        TABK[a] = k
for a in tab_bodies:
    hold_until(a, T(tr, 204.2))
    if a in TABK:
        p = TAB[TABK[a]]
    else:   # left over (thirteen bodies, eleven pools): back out into the dark, clear of every pool
        x, z = pos(a); th = math.degrees(math.atan2(x, -(z - C[1]))); p = polar(4.0, th)
    wp(a, T(tr, 217.1), p[0], p[1], face=0)
wp('hamilton', T(tr, 235.4), TAB[4][0], TAB[4][1], face=0)
# blackout: everyone off in the dark, upstage and mid wings (the King comes on DSL)
for a in OUT9 + IN4 + ['hamilton', 'washington']:
    p = pos(a)
    e = nearest(p, ['W-MSR', 'W-USR', 'W-MSL', 'W-USL', 'D-UC'])
    exit_to(a, T(tr, 240.3), e, speed=1.7)

# ====================================================================================
# 1-21 WHAT COMES NEXT?  - the King alone at the lip
# ====================================================================================
tr = '1-21'
off('king', T('1-20', 238.0), 'W-DSL')
hold_until('king', T('1-20', 240.2))
wp('king', T(tr, 2.0), 0.3, 4.5, face=-5)
wp('king', T(tr, 16.5), 0.1, 4.7, face=0)
wp('king', T(tr, 38.6), -0.6, 4.3, face=15)
wp('king', T(tr, 54.5), 0.0, 4.9, face=0)
wp('king', T(tr, 63.4), 0.5, 4.4, face=-10)
wp('king', T(tr, 76.0), 0.0, 4.5, face=0)
wp('king', T(tr, 95.9), 0.0, 4.6, face=0)
exit_to('king', T(tr, 96.8), 'D-UC', speed=1.45)

# ====================================================================================
# 1-22 DEAR THEODOSIA - Burr SL, Hamilton SR, each in his pool
# ====================================================================================
tr = '1-22'
off('burr', T('1-21', 90.0), 'W-MSL')
# SPOT: cues 618-630 keep each man in his own pool (Burr: Viper 10 at (2.38, 2.32); Hamilton: Viper 6 at
# (-2.38, 2.32), r 0.92), and 627 says "the pools still separate": they no longer close to DC for the duet.
wp('burr', T(tr, 4.5), 2.75, 2.05, face=-15)
wp('burr', T(tr, 29.5), 2.6, 2.4, face=-10)
wp('burr', T(tr, 44.1), 2.3, 2.75, face=0)
wp('burr', T(tr, 61.4), 2.4, 2.65, face=-10)
wp('burr', T(tr, 75.5), 2.7, 2.15, face=-30)
wp('burr', T(tr, 114.2), 2.3, 2.75, face=-25)
wp('burr', T(tr, 126.5), 2.1, 2.8, face=-20)
wp('burr', T(tr, 135.6), 2.0, 2.6, face=-10)
wp('burr', T(tr, 153.4), 2.1, 2.7, face=-35)
wp('burr', T(tr, 162.5), 2.05, 2.55, face=-60)
off('hamilton', T('1-21', 90.0), 'W-MSR')
wp('hamilton', T(tr, 4.5), -2.75, 2.05, face=15)
wp('hamilton', T(tr, 75.5), -2.6, 2.45, face=10)
wp('hamilton', T(tr, 87.5), -2.3, 2.75, face=0)
wp('hamilton', T(tr, 104.2), -2.4, 2.65, face=15)
wp('hamilton', T(tr, 114.2), -2.3, 2.75, face=25)
wp('hamilton', T(tr, 126.5), -2.1, 2.8, face=20)
wp('hamilton', T(tr, 135.6), -2.0, 2.6, face=10)
wp('hamilton', T(tr, 153.4), -2.1, 2.7, face=35)
wp('hamilton', T(tr, 162.5), -2.05, 2.55, face=60)
# REVIEW2: the Disney+ frame behind cue 618 has Burr SEATED SL and Hamilton SR: each brings his chair on (props.py
# 'theo-chair-burr' / 'theo-chair-hamilton', set 0.7 m behind his first place). In the fade (176.9) each picks his
# chair up and turns it into a juror's chair for Non-Stop (the courtroom of real cue 631.01), then goes to his place
# at the defence table.
JCH = {'b1': (-2.12, 1.87), 'b2': (0.70, 1.81), 'b3': (3.50, 1.71), 'f1': (-3.50, 3.60), 'f2': (-0.59, 3.65), 'f3': (2.31, 3.55)}
wp('burr', T(tr, 176.5), 2.75, 1.85, face=160)
wp('burr', T(tr, 179.5), 2.95, 1.75, face=90)        # sets his chair at JCH b3, facing upstage
wp('hamilton', T(tr, 176.5), -2.75, 1.85, face=-160)
wp('hamilton', T(tr, 179.5), -1.5, 2.2, face=-90)    # sets his chair at JCH b1, facing upstage
# the jury and Levi Weeks come on in the dark (1-22 176.9 fade, 181.5 "move in the dark", 1-23 0.0 FTB): four bring
# their chairs, two sit in the fathers' chairs, Weeks (ens4) brings the defence table in through the deck door
JURY = {'ens1': ('b1', 'W-MSR'), 'ens6': ('b2', 'W-USL'), 'ens7': ('b3', 'W-MSL'),
        'ens8': ('f1', 'W-DSR'), 'ens9': ('f2', 'W-DSL'), 'ens10': ('f3', 'W-DSL')}
for a, (k, e) in JURY.items():
    off(a, T(tr, 176.9), e, label=NAMES[a])
    x, z = JCH[k]; wp(a, T(tr, 183.5), x, z - 0.7, face=180)
off('ens4', T(tr, 176.9), 'D-UC', label='Ensemble 4')
wp('ens4', T(tr, 182.5), 0.0, -1.25, face=0)          # behind the table at (0, -0.6)

# ====================================================================================
# 1-23 NON-STOP
# ====================================================================================
tr = '1-23'
# REVIEW2: the courtroom is the ETC render of Binkley's real cue 631.01 (THPP Cue Photos, "CUE 631.01"): the defence
# table up centre in the row of narrow X4 pools (z -0.6), one figure at it and one either side, and SIX CHAIRS in the
# diamond of Viper pools in front, in two rows, their seats turned UPSTAGE to the table. So: Weeks (ens4) at the table,
# Hamilton and Burr in the two flank pools (X4 59 (-1.73, -0.67), X4 64 (1.68, -0.81)), the jury of six at their chairs
# facing the table. Cut as invented: the judge, the two onlookers, the company arc at the first chorus, the hook's
# outer ring and its revolve. In the choruses the jurors only turn out to the house.
wp('burr', T(tr, 0.5), 1.7, -0.75, face=-10)
wp('hamilton', T(tr, 0.5), -1.73, -0.67, face=10)
wp('hamilton', T(tr, 21.6), -1.3, -0.15, face=15)     # REVIEW2: addresses the jury from the table (see notes: cue 631.1)
wp('hamilton', T(tr, 30.0), -0.8, 0.25, face=0)
wp('burr', T(tr, 32.0), 0.9, -0.2, face=-40)           # co-counsel: he sits him down
wp('hamilton', T(tr, 38.0), -1.6, -0.5, face=20)
for a in JURY:
    wp(a, T(tr, 41.5), *pos(a), face=0)                 # the first chorus (631.2): the jury turns out
wp('burr', T(tr, 41.5), 1.6, -0.6, face=-20)
wp('hamilton', T(tr, 53.5), -0.7, 0.35, face=0)        # the hook
wp('hamilton', T(tr, 73.8), -1.55, 3.3, face=10)       # SPOT: cue 631.5, his DS special X4 44 (-1.31, 3.53)
for a in JURY:
    wp(a, T(tr, 74.5), *pos(a), face=facing_to(pos(a), (-1.55, 3.3)))
# the trial is over: each juror takes her chair off, Weeks the table (props.py)
JEX = {'ens1': 'W-MSR', 'ens6': 'W-USL', 'ens7': 'W-MSL', 'ens8': 'W-DSR', 'ens9': 'W-DSL', 'ens10': 'W-DSL'}
for a in JURY:
    exit_to(a, T(tr, 78.5), JEX[a], speed=1.5)
exit_to('ens4', T(tr, 78.5), 'D-UC', speed=1.4)
# the Convention (632 "Constitutional"): the real renders of 633-638 show four or five men round Hamilton, not a
# company. Four delegates (ens2, ens3, ens5, and ens4 back in without the table).
MEN = ['ens2', 'ens3', 'ens4', 'ens5']
DEL = {'ens2': ('W-USR', -60), 'ens3': ('D-UC', -20), 'ens4': ('D-UC', 20), 'ens5': ('W-USL', 60)}
for a in MEN:
    e, th = DEL[a]; p = polar(2.4, th)
    if a == 'ens4':
        off(a, T(tr, 84.0), e); wp(a, T(tr, 87.0), p[0], p[1], face=facing_to(p, C))
    else:
        off(a, T(tr, 79.0), e); wp(a, T(tr, 85.2), p[0], p[1], face=facing_to(p, C))
wp('burr', T(tr, 85.2), 3.3, 2.9, face=-60)
wp('hamilton', T(tr, 85.2), -2.0, 3.4, face=30)
wp('hamilton', T(tr, 95.6), 0.0, 0.95, face=0)       # Move to center / AF-Center
# Men on Ring (635, Binkley's label): the four ring him on the outer ring and walk a little; on 636 they close in
R4 = ring(4, 3.2, 0)
mk = assign_ring(MEN, R4)
for a in MEN:
    p = R4[mk[a]]; wp(a, T(tr, 99.5), p[0], p[1], face=facing_to(p, C))
    th0 = 90 * mk[a]
    revolve(a, 3.2, th0, th0 + 45, T(tr, 99.6), T(tr, 104.0), step=45)
    p = polar(2.2, th0 + 45); wp(a, T(tr, 106.0), p[0], p[1], face=facing_to(p, C))
wp('burr', T(tr, 106.0), 0.0, 3.15, face=150)
# Burr/Men (638): Burr DS, the four men loose behind him (the render: one far SR, two up centre, one SL); Hamilton
# pushed upstage
LOOSE = [(-2.8, 0.4), (-1.2, -0.2), (1.2, -0.4), (2.8, 0.6)]
wk = assign_ring(MEN, LOOSE)
for a in MEN:
    p = LOOSE[wk[a]]; wp(a, T(tr, 115.1), p[0], p[1], face=0)
wp('burr', T(tr, 115.1), 0.0, 4.2, face=0)
wp('hamilton', T(tr, 115.1), 0.0, -0.8, face=0)
# midnight at Burr's: the men go; the two men DR
for a in MEN:
    p = pos(a)
    e = 'W-MSL' if p[0] > 0 else 'W-USR'
    exit_to(a, T(tr, 125.3), e, speed=1.5)
# SPOT: preset 766's narrow unit is Viper 2 at (-1.82, 4.25) (the DR washes are Vipers 92/94/8 round (-3, 3.5));
# Hamilton at Burr's door stands in it, Burr in the wash upstage of him. On cue 642 ("the two men move in, one
# warm-white special on them") both step into Viper 93 at (-1.25, 2.79).
wp('burr', T(tr, 129.0), -3.2, 3.6, face=55)
hold_until('hamilton', T(tr, 126.5))
wp('hamilton', T(tr, 130.0), -2.1, 4.05, face=-70)
wp('hamilton', T(tr, 146.8), -1.9, 4.1, face=-75)
wp('burr', T(tr, 146.8), -3.1, 3.4, face=55)
wp('hamilton', T(tr, 169.9), -0.9, 2.95, face=-70)
wp('burr', T(tr, 169.9), -1.6, 2.6, face=60)
wp('hamilton', T(tr, 178.1), -0.85, 3.05, face=-50)
# Burr alone in the blue column; Hamilton gone into the dark
wp('burr', T(tr, 189.0), 0.0, 1.1, face=0)   # SPOT: in Viper 13's column (0, 1.24) a second after cue 644, not 3 s
exit_to('hamilton', T(tr, 188.0), 'W-DSR', speed=1.3, via=[(-5.6, 4.7)])
# REVIEW2: no watchers on the galleries for Burr's reprise (cue 645 is a reconstruction; nothing places bodies there,
# and the three climbs were invented traffic). The company is off from the Convention to the company chorus (281.7).
# Angelica's farewell SL; Burr leaves; Hamilton answers from his DS special; Eliza's plea SR
exit_to('burr', T(tr, 205.0), 'W-DSR', speed=1.5, via=[(-5.6, 4.75)])
off('angelica', T(tr, 0.0), 'W-DSL', label='Angelica')
off('angelica', T(tr, 202.0), 'W-MSL')
wp('angelica', T(tr, 209.5), 3.6, -0.4, face=-45)   # SPOT: cue 646's warm SL key is Viper 14, focused (3.81, -1.02)
off('hamilton', T(tr, 219.0), 'W-DSR')
wp('hamilton', T(tr, 225.4), -0.8, 3.6, face=60)
off('eliza', T(tr, 0.0), 'W-MSR', label='Eliza')
off('eliza', T(tr, 225.0), 'W-MSR')
wp('eliza', T(tr, 231.4), -3.4, 3.0, face=30)
wp('hamilton', T(tr, 233.0), -0.6, 3.5, face=-45)
wp('angelica', T(tr, 240.0), 3.5, -0.3, face=-60)
wp('hamilton', T(tr, 242.0), -0.2, 3.3, face=0)
exit_to('angelica', T(tr, 245.0), 'W-MSL', speed=1.3)
wp('eliza', T(tr, 244.0), -2.6, 3.2, face=45)
exit_to('eliza', T(tr, 249.0), 'W-MSR', speed=1.3)
# REVIEW2: Hamilton's desk (props.py 'hamilton-desk') is brought on in the change by ens8 from SR and set at (-1.0, 2.1)
off('ens8', T(tr, 246.0), 'W-MSR')
wp('ens8', T(tr, 251.0), -1.0, 1.5, face=0, dwell=0.3)
exit_to('ens8', T(tr, 251.3), 'W-MSR', speed=1.5)
# the Federalist Papers: Hamilton at his desk centre, writing; Burr counts the essays DR
# SPOT: cue 649's warm-white key on him is X4 44 (-1.31, 3.53), and the slanted window (Vipers 16/17) is round
# (-0.95, 1.1): his desk sits where both reach, (-1.0, 2.65), not at C (no desk prop exists)
wp('hamilton', T(tr, 253.5), -1.0, 2.65, face=0)
off('burr', T(tr, 254.0), 'W-DSR')
wp('burr', T(tr, 260.0), -2.8, 3.6, face=20)
wp('hamilton', T(tr, 268.0), -0.8, 2.75, face=-10)
wp('hamilton', T(tr, 276.0), -1.15, 2.6, face=10)
wp('burr', T(tr, 281.7), -2.6, 4.6, face=20)
# the company chorus (cue 652, 281.7): REVIEW2 - seven of the company walk on into a loose arc upstage of the desk and
# stay there, facing in (cut: the ten watchers coming down three stairs and the ring walked 108 degrees; the turning
# is cue 652's Construction GOBO texture). They hold the arc to the end, turn out for the counterpoint and take one
# step in on the final Shot (368.7).
FIN = ['ens%d' % i for i in range(1, 8)]
FIN_TH = [-80, -55, -30, -5, 30, 55, 80]
for a, th in zip(FIN, FIN_TH):
    p = polar(2.9, th)
    off(a, T(tr, 276.0), nearest(p, ['W-USR', 'W-MSR', 'D-UC', 'W-USL', 'W-MSL']))
    wp(a, T(tr, 285.5), p[0], p[1], face=facing_to(p, (-1.0, 2.65)))
# the desk struck as the music drops for Washington (304.3): ens8 in from DR, off with it the same way
off('ens8', T(tr, 302.0), 'W-DSR')
wp('ens8', T(tr, 305.5), -1.6, 2.65, face=60, dwell=0.3)
exit_to('ens8', T(tr, 305.8), 'W-DSR', speed=1.5)
# Washington appears high centre on the gallery: the new government
# REVIEW: BroadwayWorld forum (OBC, 2016): Washington at the end of Non-Stop is on the upper balcony, stage left.
# The offer (304.3) is played in his deck special (cue 655: Viper 93 + X4 front focused (0, 1.8)-(0, 2.1)), then he
# climbs the SL stair and stands on the SL gallery for the finale; no raised box exists in the set, and no source
# puts one on the deck.
off('washington', T(tr, 0.0), 'D-UC', label='Washington')
off('washington', T(tr, 297.0), 'D-UC')
wp('washington', T(tr, 300.5), 0.7, -1.6, dwell=0)
wp('washington', T(tr, 304.3), 0.3, 1.9, face=-55)
wp('hamilton', T(tr, 304.3), -1.3, 1.4, face=60)   # SPOT: off the edge of Washington's special (Viper 93 (0, 1.75))
hold_until('washington', T(tr, 320.0))
climb_SL('washington', T(tr, 324.0))
g('washington', T(tr, 328.9), *SLJ, dwell=0)
g('washington', T(tr, 330.2), 4.9, -1.5, face=-50)
g('washington', T(tr, 349.8), 4.9, -1.5, face=-35)
wp('burr', T(tr, 306.5), 1.8, 4.7, face=-20)   # SPOT2: out of Angelica's 402 pool
wp('hamilton', T(tr, 327.1), 0.0, 1.3, face=0)
# the sisters' pools, outside the ring
off('eliza', T(tr, 320.0), 'W-MSR')
wp('eliza', T(tr, 327.1), -3.4, 3.55, face=30)    # SPOT: in her narrow SR pools of cue 658 (Vipers 2/12)
off('angelica', T(tr, 320.0), 'W-MSL')
wp('angelica', T(tr, 327.1), 3.4, 3.65, face=-30)  # SPOT: in her narrow SL pools of cue 658 (Vipers 4/14)
# SPOT: cue 659 "principals each in a clean cool-white special": Angelica SL = Viper 13 (3.31, 1.56) (held to the
# end), Eliza SR = Viper 11 (-3.21, 1.58) (to 352.4), Hamilton below = X4 43, focused (0.06, 2.36)
wp('angelica', T(tr, 332.2), 3.3, 1.6, face=-40)
wp('eliza', T(tr, 332.2), -3.2, 1.6, face=40)
wp('hamilton', T(tr, 332.0), 0.05, 2.3, face=0)
wp('angelica', T(tr, 342.8), 3.3, 1.5, face=-25)
wp('eliza', T(tr, 342.8), -3.2, 1.55, face=25)
wp('eliza', T(tr, 368.7), -3.4, 2.55, face=20)    # SPOT: into the beam fan's SR unit (Viper 11 at (-3.23, 2.18)), then X4 54
# everyone: the company counterpoint (662, 352.4) - REVIEW2: the arc turns out to the house, and steps in on the
# final Shot (368.7); no walked revolve (cut, invented)
for a, th in zip(FIN, FIN_TH):
    wp(a, T(tr, 352.4), *pos(a), face=0)
    p = polar(2.4, th); wp(a, T(tr, 368.7), p[0], p[1], face=0)
# SPOT: cue 666 "his DS specials and an overhead white special": X4 44 (-1.31, 3.53), Viper 93 (0, 2.99) and the fan's
# Viper 9 (0, 4.0) all reach (-0.4, 3.5)
wp('hamilton', T(tr, 374.0), -0.4, 3.5, face=0)
# the button, then the blackout: everyone off for the interval
everyone = FIN + ['hamilton', 'burr', 'eliza', 'angelica', 'washington']
for a in everyone:
    hold_until(a, T(tr, 382.2))
    p = pos(a)
    if a == 'washington':
        g(a, T(tr, 382.57), 4.85, -2.7, dwell=0); g(a, T(tr, 382.78), 4.6, -3.3, dwell=0)
        g(a, T(tr, 384.0), 0.6, -3.35, dwell=0); off(a, T(tr, 384.45), 'G-UC'); continue
    if a == 'hamilton': e = 'W-DSR'   # SPOT: from (-0.4, 3.5) DSL would be 3.5 m/s
    elif a in ('burr',): e = 'W-DSL'
    elif a == 'eliza': e = 'W-DSR'
    elif a == 'angelica': e = 'W-MSL'
    else:
        e = nearest(p, ['W-MSR', 'W-USR', 'W-MSL', 'W-USL', 'D-UC'])
        if dist(p, ENT[e]) > 6.5: e = nearest(p, ['W-DSL', 'W-DSR'])
    off(a, T(tr, 384.4), e)


# ---- deck routing: legs that would walk through a stair, a post or a prop go round it (A*) ----
_floor = json.load(open(os.path.join(WT, 'tools', 'hamilton-floor.json')))
def _deck_h(x, z):
    i = round((x - _floor['x0']) / _floor['step']); j = round((z - _floor['z0']) / _floor['step'])
    if 0 <= i < _floor['nx'] and 0 <= j < _floor['nz']: return _floor['deck'][j][i]
    return None
BOXES = [(-4.8, -4.2, -0.25, 1.8), (2.25, 4.45, -2.8, -2.1)]
def blocked_pt(x, z):
    for x0, x1, z0, z1 in BOXES:
        if x0 <= x <= x1 and z0 <= z <= z1: return True
    h = _deck_h(x, z)
    return h is not None and h > 0.15
def seg_clear(p, q, step=0.05):
    d = dist(p, q); n = max(1, int(d / step))
    for k in range(n + 1):
        f = k / n; x = p[0] + (q[0] - p[0]) * f; z = p[1] + (q[1] - p[1]) * f
        if dist((x, z), p) < 0.15 or dist((x, z), q) < 0.15: continue
        if blocked_pt(x, z): return False
        # clearance 0.2 m
        for dx, dz in ((0.2, 0), (-0.2, 0), (0, 0.2), (0, -0.2)):
            if blocked_pt(x + dx, z + dz) and dist((x, z), p) > 0.3 and dist((x, z), q) > 0.3: return False
    return True
import heapq
GS_ = 0.2
def astar(p, q):
    def cell(pt): return (round(pt[0] / GS_), round(pt[1] / GS_))
    def ctr(c): return (c[0] * GS_, c[1] * GS_)
    def ok(c):
        x, z = ctr(c)
        if blocked_pt(x, z): return False
        for dx, dz in ((0.2, 0), (-0.2, 0), (0, 0.2), (0, -0.2)):
            if blocked_pt(x + dx, z + dz): return False
        return True
    s, g_ = cell(p), cell(q)
    openh = [(0, s)]; came = {s: None}; cost = {s: 0}
    while openh:
        _, c = heapq.heappop(openh)
        if c == g_: break
        for dx in (-1, 0, 1):
            for dz in (-1, 0, 1):
                if not dx and not dz: continue
                n = (c[0] + dx, c[1] + dz)
                x, z = ctr(n)
                if not (-10 <= x <= 10 and -6.5 <= z <= 5.3): continue
                if n != g_ and not ok(n) and dist(ctr(n), p) > 0.45 and dist(ctr(n), q) > 0.45: continue
                nc = cost[c] + math.hypot(dx, dz)
                if nc < cost.get(n, 1e9):
                    cost[n] = nc; came[n] = c
                    heapq.heappush(openh, (nc + math.hypot(n[0] - g_[0], n[1] - g_[1]), n))
    if g_ not in came: return None
    path = []; c = g_
    while c is not None: path.append(ctr(c)); c = came[c]
    path = path[::-1]; path[0] = p; path[-1] = q
    # string pull
    out = [p]; i = 0
    while i < len(path) - 1:
        j = len(path) - 1
        while j > i + 1 and not seg_clear(path[i], path[j]): j -= 1
        out.append(path[j]); i = j
    return out
ROUTED = []
for a, L in W.items():
    newL = [L[0]]
    for p, q in zip(L, L[1:]):
        if (p['off'] and q['off']) or p['y'] or q['y']:
            newL.append(q); continue
        P0, Q0 = (p['x'], p['z']), (q['x'], q['z'])
        if seg_clear(P0, Q0):
            newL.append(q); continue
        path = astar(P0, Q0)
        if not path:
            ROUTED.append('NO ROUTE %s %.1f' % (a, q['t'])); newL.append(q); continue
        d = dist(P0, Q0); dt = q['t'] - p['t']
        if p['dwell'] is None: leave = max(p['t'], q['t'] - sum(dist(u, v) for u, v in zip(path, path[1:])) / 1.3)
        else: leave = p['t'] + min(p['dwell'], dt)
        L_tot = sum(dist(u, v) for u, v in zip(path, path[1:]))
        acc = 0.0
        for u, v in zip(path[:-2], path[1:-1]):
            acc += dist(u, v)
            t = leave + (q['t'] - leave) * acc / L_tot
            newL.append(dict(t=round(t, 2), x=round(v[0], 3), z=round(v[1], 3), face=None, dwell=0, off=False, y=None, label=None))
        if p['dwell'] is None: p['dwell'] = round(leave - p['t'], 2)
        ROUTED.append('routed %s ->%.1f via %d pts' % (a, q['t'], len(path) - 2))
        newL.append(q)
    W[a] = newL

# ====================================================================================
# convert, check, write
# ====================================================================================
def to_track(t):
    for tr in ORDER:
        if OFFS[tr] - 1e-9 <= t <= OFFS[tr] + LENS[tr] + 1e-9:
            if t > OFFS[tr] + LENS[tr] - 1e-9 and tr != ORDER[-1]:
                continue
            return tr, round(t - OFFS[tr], 2)
    raise ValueError(t)

problems = []
out = {}
for a, L in W.items():
    for p, q in zip(L, L[1:]):
        if q['t'] <= p['t'] + 0.005: problems.append('time order %s %.2f -> %.2f' % (a, p['t'], q['t']))
    res = []
    for w in L:
        tr, at = to_track(w['t'])
        o = {'track': tr, 'at': at, 'x': round(w['x'], 3), 'z': round(w['z'], 3)}
        if w['y']: o['y'] = w['y']
        if w['dwell'] is not None: o['dwell'] = round(w['dwell'], 2)
        if w['face'] is not None and not w['off']: o['facing'] = round(((w['face'] + 180) % 360) - 180, 1)
        if w['off']: o['off'] = True
        if w['label']: o['label'] = w['label']
        res.append(o)
    out[a] = res
    if not L[0]['off']: problems.append('%s does not start off' % a)
    if not L[-1]['off']: problems.append('%s does not end off' % a)
    if L[-1]['t'] > T('1-23', 384.5): problems.append('%s ends too late' % a)

# kinematic sampling: speeds and standing-too-close
def leg_times(L):
    segs = []
    for p, q in zip(L, L[1:]):
        dt = q['t'] - p['t']; d = dist((p['x'], p['z']), (q['x'], q['z']))
        if p['dwell'] is None: leave = max(p['t'], q['t'] - d / 1.3)
        else: leave = p['t'] + min(p['dwell'], dt)
        segs.append((p, q, leave))
    return segs
def where(L, segs, t):
    if t <= L[0]['t']: w = L[0]; return (w['x'], w['z'], w['off'], w['y'] in ('gallery',), True)
    for p, q, leave in segs:
        if p['t'] <= t <= q['t']:
            gal = p['y'] == 'gallery' and q['y'] == 'gallery'
            hidden = (p['off'] and q['off'])
            if t <= leave: return (p['x'], p['z'], p['off'] or hidden, p['y'] == 'gallery', True)
            f = (t - leave) / max(1e-6, q['t'] - leave)
            return (p['x'] + (q['x'] - p['x']) * f, p['z'] + (q['z'] - p['z']) * f, hidden, gal, False)
    w = L[-1]; return (w['x'], w['z'], w['off'], w['y'] == 'gallery', True)
SEGS = {a: leg_times(L) for a, L in W.items()}
for a, segs in SEGS.items():
    for p, q, leave in segs:
        if p['off'] and q['off']: continue
        d = dist((p['x'], p['z']), (q['x'], q['z'])); walk = q['t'] - leave
        if walk > 0 and d / walk > 3.0: problems.append('fast %s %.1f m/s at %.1f' % (a, d / walk, q['t']))
# obstacles on deck legs
floor = json.load(open(os.path.join(WT, 'tools', 'hamilton-floor.json')))
def deck_h(x, z):
    i = round((x - floor['x0']) / floor['step']); j = round((z - floor['z0']) / floor['step'])
    if 0 <= i < floor['nx'] and 0 <= j < floor['nz']: return floor['deck'][j][i]
    return None
for a, segs in SEGS.items():
    for p, q, leave in segs:
        if p['off'] and q['off']: continue
        if p['y'] or q['y']: continue
        d = dist((p['x'], p['z']), (q['x'], q['z'])); n = max(2, int(d / 0.1))
        for k in range(n + 1):
            f = k / n; x = p['x'] + (q['x'] - p['x']) * f; z = p['z'] + (q['z'] - p['z']) * f
            h = deck_h(x, z)
            if h is not None and h > 0.15:
                problems.append('obstacle %s leg ->%.1f near (%.2f,%.2f) h %.2f' % (a, q['t'], x, z, h)); break
# proximity among standing bodies
close = {}
t = 0.0; END = T('1-23', 385.0)
acts = list(W)
while t < END:
    P = {a: where(W[a], SEGS[a], t) for a in acts}
    for i in range(len(acts)):
        for j in range(i + 1, len(acts)):
            A, B = P[acts[i]], P[acts[j]]
            if A[2] or B[2] or A[3] != B[3] or not (A[4] and B[4]): continue
            if math.hypot(A[0] - B[0], A[1] - B[1]) < 0.5:
                key = (acts[i], acts[j]); close.setdefault(key, []).append(t)
    t += 0.25
for k, ts in close.items():
    # group into runs
    runs = []; s = ts[0]; pv = ts[0]
    for x in ts[1:]:
        if x - pv > 0.3: runs.append((s, pv)); s = x
        pv = x
    runs.append((s, pv))
    for s, e in runs:
        if e - s >= 0.75:
            tr, at = to_track(s)
            problems.append('close %s/%s %s %.1f for %.1fs' % (k[0], k[1], tr, at, e - s + 0.25))

notes = open(os.path.join(HERE, 'seg4-notes.txt'), encoding='utf-8').read().strip() if os.path.exists(os.path.join(HERE, 'seg4-notes.txt')) else ''
seg = {'segment': 4, 'tracks': ORDER, 'waypoints': out, 'notes': notes}
os.makedirs(os.path.join(HERE, 'segments'), exist_ok=True)
with open(os.path.join(HERE, 'segments', 'seg4.json'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('{\n "segment": 4,\n "tracks": ' + json.dumps(ORDER) + ',\n "waypoints": {\n')
    ks = list(out)
    for n, a in enumerate(ks):
        f.write('  ' + json.dumps(a) + ': [')
        f.write(','.join('\n   ' + json.dumps(w) for w in out[a]))
        f.write('\n  ]' + (',' if n + 1 < len(ks) else '') + '\n')
    f.write(' },\n "notes": ' + json.dumps(notes, ensure_ascii=False) + '\n}\n')
print('waypoints', sum(len(v) for v in out.values()), {a: len(v) for a, v in out.items()})
for p in problems: print('PROBLEM', p)
print(len(ROUTED), 'legs routed'); [print(r) for r in ROUTED if r.startswith('NO')]
