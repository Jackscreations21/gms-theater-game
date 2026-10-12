# 1-03 My Shot
from lib import *
from t102 import TAVERN

def M(at): return S('1-03', at)

FR = ['lafayette', 'hamilton', 'laurens', 'mulligan']
FRIENDS = ['lafayette', 'laurens', 'mulligan']

# SPOT: My Shot's light for him is his DSC special, ch13 at (0, 2.40) (Binkley's 'Ham DSC' preset 151 is ch43 at
# (0.27, 2.53)); it is up nearly the whole song, so the four stand about it, a metre further up than before,
# and the company rows move up with them
H0 = (0.05, 2.4)
FOUR_AT = [(-1.3, 2.9), (-0.1, 2.55), (1.1, 2.75), (2.3, 3.0)]

def four_dsc(tl, ta, at=FOUR_AT):
    for a, p in zip(FR, at):
        move(a, M(tl), M(ta), p, f=0)

ROWS = [(-4.5, -0.4), (-2.7, -0.4), (-0.9, -0.4), (0.9, -0.4), (2.7, -0.4), (4.5, -0.4),
        (-3.6, 1.2), (-2.0, 1.2), (2.0, 1.2), (3.6, 1.2)]   # REVIEW: back row opened to keep a lane for the four

def dsline(tl, ta):
    """everyone in one line along the downstage edge, the four in the middle"""
    # SPOT: the line at z 3.6 with a gap in the middle; he calls to them from a step behind it, in his special
    left = [-(1.0 + 0.72 * k) for k in range(7)][::-1]
    right = [1.0 + 0.72 * k for k in range(6)]
    move('hamilton', M(tl), M(ta), (0.0, 2.05), f=0)
    pair = sorted(['mulligan', 'laurens'], key=lambda a: pos(a)[0])   # no crossing into the line
    fr = {'lafayette': left[-1], pair[0]: right[0], pair[1]: right[1]}
    for a, x in fr.items():
        move(a, M(tl), M(ta), (x, 3.6), f=0)
    rest = left[:-1] + right[2:]
    order = sorted(ENS, key=lambda a: pos(a)[0])
    for a, x in zip(order, rest):
        move(a, M(tl), M(ta), (x, 3.6), f=0)

def build():
    # ---- Q100 0.1 the room falls away to Hamilton DSC; the friends fall back
    move('laurens', M(0.1), M(2.6), (2.6, 2.0), f=-40)
    move('lafayette', M(0.1), M(2.6), (-2.6, 2.0), f=40)
    move('mulligan', M(0.1), M(2.6), (3.2, 3.4), f=-50)
    turn(TAVERN, M(1.0), lambda a, p: face_to(p, H0, 110))
    # REVIEW: Burr sits at the back of the tavern with a book until his verse (fan staging account)
    move('burr', M(0.4), M(6.0), (-3.3, -2.2), f=20)
    # ---- Q101 6.1 verse 1: he works the room
    move('hamilton', M(6.1), M(8.4), (-0.7, 2.9), f=20)     # SPOT: he works the room inside his special
    move('hamilton', M(16.4), M(18.6), (0.7, 2.9), f=-20)
    move('hamilton', M(26.4), M(28.0), (0.3, 2.8), f=0)
    # ---- Q104 39.9 the dark turn: back to his special DSC (and the fan of Q105 round it)
    move('hamilton', M(39.9), M(41.0), H0, f=0)
    # ---- Q106 46.6 the politics verse: the rest of the company comes in; a V opening onto him
    enter('ens6', M(46.6), M(51.0), (3.3, 1.9), -60, wing='W_MSL')
    enter('ens9', M(46.4), M(51.0), (-3.3, 1.9), 60, wing='W_MSR')
    vsr = [(-1.2, -1.2), (-2.0, -0.2), (-2.8, 0.8), (-4.0, 2.8)]
    vsl = [(1.2, -1.2), (2.0, -0.2), (2.8, 0.8), (4.0, 2.8)]
    srs = sorted(TAVERN, key=lambda a: pos(a)[0])[:4]
    sls = sorted(TAVERN, key=lambda a: pos(a)[0])[4:]
    form(srs, vsr, M(46.6), M(49.6), face=('at', (0.0, 2.6), 110))
    form(sls, vsl, M(46.6), M(49.6), face=('at', (0.0, 2.6), 110))
    move('lafayette', M(46.6), M(48.4), (-1.8, 2.4), f=30)
    move('laurens', M(46.6), M(48.4), (1.8, 2.4), f=-30)
    move('mulligan', M(46.6), M(48.4), (3.0, 3.8), f=-40)
    move('hamilton', M(47.6), M(49.8), (-0.75, 2.85), f=15)
    move('hamilton', M(54.4), M(56.6), (0.75, 2.85), f=-15)
    # ---- Q107 60.2 tension; Q108 63.5 he steps in
    move('hamilton', M(60.2), M(62.0), (0.0, 2.95), f=0)
    move('hamilton', M(63.5), M(64.6), H0, f=0)   # SPOT: he steps in to his special

    # ---- Q109 73.9 chorus 1: the four DSC, the company in two rows behind
    four_dsc(73.9, 75.8)
    form(ENS, ROWS, M(73.9), M(76.4), face=0)
    # Q110 84.4 the repeat: the rows cheat to the four
    turn(ENS, M(84.4), lambda a, p: 25 if p[0] < 0 else -25)
    turn(ENS, M(89.4), 0)
    # ---- Q111 94.9 Lafayette's verse, SR
    move('lafayette', M(94.9), M(96.5), (-2.45, 3.1), f=20)   # SPOT: ch48
    move('hamilton', M(95.2), M(97.0), (-0.35, 2.75), f=-60)
    move('laurens', M(95.2), M(97.0), (1.0, 3.1), f=-40)
    # ---- Q113 106.8 Mulligan's verse, SL
    move('mulligan', M(106.8), M(108.4), (2.25, 3.1), f=-20)   # SPOT: ch51
    move('hamilton', M(106.8), M(107.8), (0.45, 2.6), f=70)
    move('laurens', M(107.8), M(109.2), (-0.8, 3.5), f=30)
    move('lafayette', M(106.8), M(108.6), (-1.8, 3.6), f=30)
    # ---- Q115 117.5 Laurens' verse, centre
    move('laurens', M(117.5), M(119.0), (0.55, 3.45), f=0)   # SPOT: ch50
    move('hamilton', M(117.5), M(119.0), (-0.45, 2.5), f=45)
    # ---- Q117 127.7 Burr cools them down
    # SPOT: down the SR side, through the gaps in the rows, into his AF (ch2 at (-1.82, 4.25))
    move('burr', M(123.6), M(124.9), (-3.6, -0.4), d=0)
    via('burr', M(126.6), (-2.85, 1.9))
    put('burr', M(128.2), (-1.75, 4.1), f=45)
    move('lafayette', M(127.0), M(128.4), (-0.8, 3.4), f=-60)
    turn(['hamilton', 'laurens', 'mulligan'], M(128.4), lambda a, p: face_to(p, (-1.75, 4.1), 110))
    # ---- Q118 138.9 he rallies his friends; Burr leaves the tavern
    exit_('burr', M(138.9), 'W_DSR', speed=1.3)
    # SPOT: all four keyed: Hamilton ch13, Lafayette ch48 (-2.41, 3.06), Laurens ch50 (0.91, 3.68), Mulligan ch51 (2.20, 3.06)
    move('hamilton', M(139.4), M(141.0), (0.1, 2.5), f=0)
    move('lafayette', M(139.4), M(141.0), (-2.35, 3.05), f=30)
    move('laurens', M(139.4), M(141.0), (0.9, 3.6), f=-20)
    move('mulligan', M(139.4), M(141.0), (2.2, 3.1), f=-30)
    # ---- Q119 159.8 the quiet confession: Jack's note (revision 4) -- blue, with ONE white spot at centre:
    # ch13 refocused to (0, 0.3, 1.1), i.e. the centre shaft at (0, 1.15). He goes up into it; the friends hold their pools.
    move('hamilton', M(159.8), M(161.0), (0.0, 1.15), f=0)
    # Q120 165.6 the friends lift him: he comes back down a step (ch13 lands at (0, 2.40) in the dump; with revision 4
    # it tracks at (0, 1.15) until Q129 -- (0, 1.75) is inside both)
    move('hamilton', M(165.6), M(166.6), (0.0, 1.75), f=0)

    # REVIEW: the Schuyler sisters watch him from the upstage gallery (two fan staging accounts)
    for a, x, tl in (('eliza', -1.2, 163.0), ('angelica', 0.0, 164.2), ('peggy', 1.2, 165.4)):
        put(a, M(tl), G_UC, off=True, y=GAL)
        W[a][-1]['d'] = 0
        via(a, M(tl + 1.6), (0.6, -3.35), y=GAL)
        put(a, M(tl + 2.0 + abs(x - 0.6) / 1.3), (x, -3.35), f=0, y=GAL)
    for a, tl in (('peggy', 300.0), ('angelica', 301.4), ('eliza', 302.8)):
        x = pos(a)[0]
        move(a, M(tl), M(tl + abs(x - 0.6) / 1.3 + 0.2), (0.6, -3.35), d=0, y=GAL)
        put(a, W[a][-1]['t'] + 1.6, G_UC, off=True, y=GAL)

    # ---- Q121 168.2 chorus 2: the four into the centre, the company revolves round them
    move('lafayette', M(167.0), M(169.2), (-1.3, 1.1), f=0)
    move('mulligan', M(167.6), M(170.0), (0.0, 0.3), f=0)
    move('laurens', M(168.2), M(170.2), (1.3, 1.1), f=0)
    bear = sorted(ENS, key=lambda a: polar(pos(a))[1])
    for k, a in enumerate(bear):
        move(a, M(168.2), M(171.0), ring(3.2, -135 + 30 * k), f=face_to(ring(3.2, -135 + 30 * k), C, 135))
    revolve(ENS, M(171.0), M(189.4), 360, step=36, face_in=False, face=0)
    # ---- Q123 189.9 the call: everyone in a line along the downstage edge
    dsline(189.9, 193.0)
    # ---- Q124 203.5 the shout: a flying V with Hamilton at the point
    # SPOT: the V's point is Hamilton in his special at (0, 2.05); the V runs upstage from him
    move('lafayette', M(203.5), M(205.0), (-0.9, 1.2), f=0)
    move('mulligan', M(203.5), M(205.4), (0.9, 1.2), f=0)
    move('laurens', M(204.4), M(206.2), (1.8, 0.4), f=0)
    vee = [(0.0, 0.4), (-1.8, 0.4), (-2.7, -0.4), (-0.9, -0.4), (0.9, -0.4), (2.7, -0.4), (-3.6, -1.2),
           (-1.8, -1.2), (1.8, -1.2), (3.6, -1.2)]
    form(ENS, vee, M(203.5), M(206.4), face=0)
    # ---- Q125 211.9 the chant: the four DSC, the company in two marching rows; Q126 220.7 they advance
    four_dsc(211.9, 213.6, [(-1.3, 2.15), (0.0, 1.85), (2.5, 2.4), (1.3, 2.15)])
    rows = [(-4.5, -1.2), (-2.7, -1.2), (-0.9, -1.2), (0.9, -1.2), (2.7, -1.2), (4.5, -1.2),
            (-3.6, -0.2), (-1.8, -0.2), (1.8, -0.2), (3.6, -0.2)]
    form(ENS, rows, M(211.9), M(214.6), face=0)
    for a in ENS:
        p = pos(a); move(a, M(220.7), M(222.4), (p[0], p[1] + 1.0), f=0)

    # ---- Q127 231.9 the death verse: slow motion, Hamilton alone in the centre shaft
    move('hamilton', M(231.9), M(235.0), C, f=0)
    move('lafayette', M(231.9), M(234.6), (-3.2, 4.2), f=30)
    move('laurens', M(231.9), M(234.6), (4.4, 3.0), f=-40)
    move('mulligan', M(231.9), M(234.6), (3.0, 4.3), f=-30)
    dslots = [ring(3.0, -150 + 30 * k) for k in range(10)]
    m = assign(ENS, dslots)
    for a in ENS:
        move(a, M(232.2), M(236.0), m[a], f=face_to(m[a], C, 135))
    revolve(ENS, M(237.0), M(254.0), 90, step=30, face_in=True)
    # ---- Q129 255.0 the snap back: the company scatters into pools, he comes down
    pools = [(-4.0, -1.4), (-2.4, -0.2), (-0.8, -1.6), (0.8, -0.4), (2.4, -1.4), (3.8, 0.0), (-3.4, 1.6),
             (-1.4, 1.4), (1.6, 1.6), (3.2, 2.0)]
    form(ENS, pools, M(255.0), M(257.4), face=0)
    move('hamilton', M(255.0), M(256.6), H0, f=0)   # SPOT: ch13 back at (0, 2.40)
    move('lafayette', M(255.0), M(257.0), (-2.0, 3.6), f=20)
    move('laurens', M(255.0), M(257.0), (2.0, 3.8), f=-20)
    move('mulligan', M(255.0), M(257.0), (3.8, 3.6), f=-30)
    # ---- Q131 265.3 the cost: he goes back to the centre and the company closes in round him
    move('hamilton', M(265.3), M(267.2), (0.0, 1.5), f=0)   # SPOT: inside the tightened fan and his special
    bear = sorted(ENS, key=lambda a: polar(pos(a))[1])
    for k, a in enumerate(bear):
        p = ring(2.6, -162 + 36 * k)
        move(a, M(265.6), M(268.6), p, f=face_to(p, C))
    # ---- Q132 275.9 at the centre table: the ring opens out
    for a in ENS:
        r, th = polar(pos(a)); p = ring(3.4, th)
        move(a, M(275.9), M(277.8), p, f=face_to(p, C, 135))
    # ---- Q133 281.2 the friends come to him
    move('hamilton', M(281.2), M(282.2), (0.0, 1.85), f=0)   # SPOT: back into his special (ch13 (0, 2.40)), near ch93 (0, 1.01) of Q134
    move('lafayette', M(281.2), M(283.4), (-1.2, 1.6), f=30)
    move('laurens', M(281.2), M(283.6), (1.0, 2.75), f=-130)
    move('mulligan', M(281.2), M(282.6), (3.23, 2.0), d=0)   # through the gap in the ring
    put('mulligan', M(284.2), (1.2, 1.6), f=-30)
    # ---- Q135 296.4 the final chorus: the four DSC, the rows
    four_dsc(299.6, 301.2)
    form(ENS, ROWS, M(296.4), M(299.2), face=0)
    turn(ENS, M(307.1), lambda a, p: 25 if p[0] < 0 else -25)
    turn(ENS, M(313.0), 0)
    # ---- Q137 319.3 the peak: the line downstage
    dsline(319.3, 322.0)
    # ---- Q138 325.5 he isolates: a step out to the lip, the company falls back
    # SPOT: Q138 isolates him in the centre shaft (ch13 refocused to (0, 1.15)); the line opens to the sides and
    # falls back so nothing stands between him and the house; on the button (Q139, ch13 back at (0, 2.40)) a step down
    move('hamilton', M(325.5), M(326.6), (0.0, 1.15), f=0)
    for a in ENS + FRIENDS:
        p = pos(a); s = 1 if p[0] > 0 else -1
        move(a, M(325.5), M(327.4), (s * (1.6 + (abs(p[0]) - 1.0) * 0.85), 2.9), f=0)
    move('hamilton', M(329.0), M(330.0), (0.0, 1.75), f=0)
    # ---- blackout 331.25: the company clears; the four find their places for The Story of Tonight
    for k, a in enumerate(sorted(ENS, key=lambda a: -abs(pos(a)[0]))):   # SPOT: outermost first, each to his own side
        exit_(a, M(331.3) + 0.2 * k, 'W_DSR' if pos(a)[0] < 0 else 'W_DSL', speed=2.0)
