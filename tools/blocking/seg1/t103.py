# 1-03 My Shot
# REVIEW2 (Jack's verdict, 2026-10-13): rewritten sparse. Half the company (five) comes on at Q106; at Q123 they go off
# and the four wander the room until Q124; they come back on at Q131. The revolves, the flying V, the marching rows,
# the death-verse ring and the full-company lines are cut (all marked invented). The picnic table the friends brought
# on in 1-02 stands DSC at (0, 3.3) all song (props.py 'picnic-table'): Laurens stands on it for his verse (fan
# account), Hamilton writes at it on Q132 ("Cntr Table"). Burr reads in a chair UR until his verse (fan account).
import random
from lib import *

def M(at): return S('1-03', at)

FR = ['lafayette', 'hamilton', 'laurens', 'mulligan']
FRIENDS = ['lafayette', 'laurens', 'mulligan']
H5 = ['ens1', 'ens4', 'ens5', 'ens8', 'ens10']     # REVIEW2: half the company

# SPOT: My Shot's light for him is his DSC special, ch13 at (0, 2.40) (Binkley's 'Ham DSC' preset 151 is ch43 at
# (0.27, 2.53)); it is up nearly the whole song, so the four stand about it
H0 = (0.05, 2.4)
FOUR_AT = [(-1.3, 2.9), (-0.1, 2.55), (1.1, 2.75), (2.3, 3.0)]
TABLE = (0.0, 3.3)            # the picnic table: x -0.9 .. 0.9, z 2.95 .. 3.65
LAMP = (3.6, 2.2)             # the street lamp (props.py 'street-lamp')
BURR_SEAT = (-3.3, -2.2)      # Burr in his chair UR (props.py 'burr-chair', 0.7 m behind him)

# the five: where they come on from, and their places (Q106 and Q131), then Q137
WING5 = {'ens1': 'W_USR', 'ens4': 'W_USR', 'ens5': 'D_UC', 'ens8': 'W_USL', 'ens10': 'W_MSL'}
AT106 = {'ens1': (-2.7, 0.4), 'ens4': (-1.6, -0.7), 'ens5': (0.0, -1.2), 'ens8': (1.6, -0.7), 'ens10': (3.0, 0.3)}
AT131 = {'ens1': (-2.4, 0.0), 'ens4': (-1.2, -0.9), 'ens5': (0.0, -1.3), 'ens8': (1.2, -0.9), 'ens10': (2.4, 0.0)}
AT137 = {'ens1': (-3.0, 1.3), 'ens4': (-2.8, -2.0), 'ens5': (-1.6, 0.9), 'ens8': (1.8, 1.0), 'ens10': (3.0, 1.3)}

def four_dsc(tl, ta, at=FOUR_AT):
    for a, p in zip(FR, at):
        move(a, M(tl), M(ta), p, f=0)

def five_on(t0, slots):
    for k, e in enumerate(H5):
        p = slots[e]
        q = WINGS[WING5[e]]
        tl = t0 + 0.5 * k
        put(e, M(tl - 0.1), q, off=True); W[e][-1]['d'] = 0
        put(e, M(tl + max(3.0, dist(p, q) / 1.4)), p, f=face_to(p, H0, 60))

def five_off(t0):
    for k, e in enumerate(H5):
        exit_(e, M(t0 + 0.3 * k), WING5[e], speed=1.6)

def _free(p):
    x, z = p
    if not (-3.6 <= x <= 3.6 and -1.8 <= z <= 4.3): return False
    if -1.35 <= x <= 1.35 and 2.55 <= z <= 4.05: return False          # the table
    if dist(p, LAMP) < 0.8: return False
    return True

def wander(actors, t0, t1, seed=11):
    """REVIEW2 (Jack): 'everyone is walking around randomly' from Q123 to Q124: each of the four strolls from spot to
    spot (about 1 m/s, a short pause at each), clear of the table, the lamp and each other (0.9 m)."""
    rnd = random.Random(seed)
    for a in actors:
        t = t0
        while True:
            p0 = pos(a)
            for _ in range(400):
                q = (round(rnd.uniform(-3.4, 3.4), 2), round(rnd.uniform(-1.6, 4.1), 2))
                d = dist(p0, q)
                if not (1.6 <= d <= 3.4) or not _free(q): continue
                mid = ((p0[0] + q[0]) / 2, (p0[1] + q[1]) / 2)
                if not _free(mid): continue
                dur = d / 1.0
                ta = t + 0.6 + dur
                if ta > t1: break
                ok = True
                tt = t
                while tt <= ta + 1.2 and ok:
                    u = min(1.0, max(0.0, (tt - t - 0.6) / dur))
                    me = (p0[0] + (q[0] - p0[0]) * u, p0[1] + (q[1] - p0[1]) * u)
                    for b in actors:
                        if b == a: continue
                        s = sim(b, tt)
                        if math.hypot(s[0] - me[0], s[1] - me[1]) < 0.9: ok = False; break
                    tt += 0.2
                if ok: break
            else:
                return
            if ta > t1: break
            move(a, t + 0.6, ta, q, f=face_to(q, (q[0] * 0.3, q[1] + 1.0), 150))
            t = ta + rnd.uniform(0.4, 1.2)

def build():
    # ---- Q100 0.1 the room falls away to Hamilton behind the table; the friends fall back
    move('lafayette', M(0.1), M(2.6), (-2.6, 2.0), f=40)
    move('laurens', M(0.1), M(2.4), (2.4, 1.8), f=-40)
    move('mulligan', M(1.4), M(3.6), (2.9, 3.6), f=-50)
    # Burr goes up to his chair UR and reads until his verse (fan staging account)
    move('burr', M(0.4), M(1.6), (-3.3, 2.6), d=0)
    put('burr', M(6.0), BURR_SEAT, f=20)
    # ---- Q101 6.1 verse 1: he works the room, inside his special, just upstage of the table
    move('hamilton', M(6.1), M(8.4), (-0.7, 2.5), f=20)
    move('hamilton', M(16.4), M(18.6), (0.7, 2.5), f=-20)
    move('hamilton', M(26.4), M(28.0), (0.3, 2.45), f=0)
    # ---- Q104 39.9 the dark turn: back to his special
    move('hamilton', M(39.9), M(41.0), H0, f=0)
    # ---- Q106 46.6 the company in: five of them, a loose group upstage, watching him
    five_on(46.6, AT106)
    move('hamilton', M(47.6), M(49.8), (-0.75, 2.5), f=15)
    move('hamilton', M(54.4), M(56.6), (0.75, 2.5), f=-15)
    # ---- Q107 60.2 tension; Q108 63.5 he steps in
    move('hamilton', M(60.2), M(61.6), (0.0, 2.5), f=0)
    move('hamilton', M(63.5), M(64.6), H0, f=0)   # SPOT: he steps in to his special

    # ---- Q109 73.9 chorus 1: the four DSC about his special (the cue's Joan Marcus still); the five face front
    four_dsc(73.9, 75.8)
    turn(H5, M(74.2), 0)
    # ---- Q111 94.9 Lafayette's verse, SR
    move('lafayette', M(94.9), M(96.5), (-2.45, 3.1), f=20)   # SPOT: ch48
    move('hamilton', M(95.2), M(97.0), (-0.35, 2.6), f=-60)
    move('laurens', M(95.2), M(97.0), (1.15, 2.7), f=-40)
    # ---- Q113 106.8 Mulligan's verse, SL
    move('mulligan', M(106.8), M(108.4), (2.25, 3.1), f=-20)   # SPOT: ch51
    move('hamilton', M(106.8), M(107.8), (0.45, 2.55), f=70)
    # ---- Q115 117.5 Laurens' verse, centre: up on the table (fan account: Laurens stands on a table)
    move('laurens', M(117.5), M(119.0), (0.55, 3.45), f=0)   # SPOT: ch50
    move('hamilton', M(117.5), M(119.0), (-0.45, 2.5), f=45)
    # ---- Q117 127.7 Burr cools them down
    # SPOT: down the SR side, clear of the stair and of Lafayette, into his AF (ch2 at (-1.82, 4.25))
    move('burr', M(123.6), M(125.0), (-3.5, -0.6), d=0)
    via('burr', M(127.4), (-3.4, 3.4))
    put('burr', M(128.6), (-1.75, 4.1), f=45)
    turn(['hamilton', 'laurens', 'mulligan', 'lafayette'], M(128.4), lambda a, p: face_to(p, (-1.75, 4.1), 110))
    # ---- Q118 138.9 he rallies his friends; Burr leaves the tavern
    exit_('burr', M(138.9), 'W_DSR', speed=1.3)
    # SPOT: all four keyed: Hamilton ch13, Lafayette ch48 (-2.41, 3.06), Laurens ch50 (0.91, 3.68), Mulligan ch51 (2.20, 3.06)
    move('hamilton', M(139.4), M(141.0), (0.1, 2.5), f=0)
    move('lafayette', M(139.4), M(141.0), (-2.35, 3.05), f=30)
    move('laurens', M(139.4), M(141.0), (1.25, 3.85), f=-20)   # down off the table, still in ch50
    move('mulligan', M(139.4), M(141.0), (2.2, 3.1), f=-30)
    # ---- Q119 159.8 the quiet confession: Jack's note (revision 4) -- blue, with ONE white spot at centre:
    # ch13 refocused to (0, 0.3, 1.1), i.e. the centre shaft at (0, 1.15). He goes up into it; the friends hold their pools.
    move('hamilton', M(159.8), M(161.0), (0.0, 1.15), f=0)
    # Q120 165.6 the friends lift him: he comes back down a step
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

    # ---- Q121 168.2 chorus 2: the three come in round him (no revolve; the five hold their places)
    move('lafayette', M(167.0), M(169.2), (-1.3, 1.1), f=30)
    move('mulligan', M(167.6), M(170.0), (0.0, 0.3), f=0)
    move('laurens', M(168.2), M(170.2), (1.3, 1.1), f=-30)
    # ---- Q123 189.9 the five go off; the four walk the room at random until Q124 (Jack)
    five_off(189.9)
    wander(FR, M(190.4), M(203.0))
    # ---- Q124 203.5 the shout: the four together about his special
    four_dsc(203.5, 205.6)
    # Q125 211.9 / Q126 220.7 the chant: they hold, cheating in to him on the repeat
    turn(['lafayette'], M(220.7), 30)
    turn(['laurens', 'mulligan'], M(220.9), -30)
    turn(['lafayette', 'laurens', 'mulligan'], M(228.0), 0)

    # ---- Q127 231.9 the death verse: Hamilton alone in the centre shaft (ch13 at (0, 1.15)); the friends freeze apart
    move('hamilton', M(231.9), M(234.4), (0.0, 1.15), f=0)
    move('lafayette', M(231.9), M(234.6), (-3.2, 4.2), f=30)
    move('laurens', M(231.9), M(234.6), (3.0, 4.3), f=-30)
    move('mulligan', M(231.9), M(234.6), (4.4, 3.0), f=-40)
    # ---- Q129 255.0 the snap back
    move('hamilton', M(255.0), M(256.6), H0, f=0)   # SPOT: ch13 back at (0, 2.40)
    move('lafayette', M(255.0), M(257.0), (-2.0, 3.6), f=20)
    move('laurens', M(255.0), M(257.0), (2.0, 3.8), f=-20)
    move('mulligan', M(255.0), M(257.0), (3.8, 3.6), f=-30)
    # ---- Q131 265.3 the five come back on (Jack), a loose group upstage of him
    five_on(265.3, AT131)
    # ---- Q132 275.9 Hamilton at the table ("Cntr Table"): writing
    move('hamilton', M(275.9), M(277.0), (0.0, 2.55), f=0)
    # ---- Q133 281.2 the friends come to him
    move('hamilton', M(281.2), M(282.0), H0, f=0)
    move('lafayette', M(281.2), M(283.4), (-1.1, 2.2), f=45)
    move('laurens', M(281.2), M(283.4), (1.15, 2.6), f=-60)
    move('mulligan', M(281.4), M(284.2), (1.2, 1.6), f=-30)
    # ---- Q135 296.4 the final chorus: the four about his special; the five face front
    four_dsc(299.6, 301.2)
    turn(H5, M(296.6), 0)
    # ---- Q137 319.3 the peak: the five come down a step (ens4 to Burr's empty chair, which he will strike)
    form(H5, [AT137[e] for e in H5], M(319.3), M(321.6), face=0, fixed=True)
    # ---- Q138 325.5 he isolates in the centre shaft (ch13 at (0, 1.15)); the friends open to the sides;
    # ens8 steps to the table to strike it in the blackout
    move('hamilton', M(325.5), M(326.6), (0.0, 1.15), f=0)
    move('lafayette', M(325.5), M(327.0), (-1.9, 2.9), f=20)
    move('laurens', M(325.5), M(327.0), (1.7, 2.8), f=-20)
    move('mulligan', M(325.5), M(327.0), (2.9, 3.0), f=-20)
    move('ens8', M(325.5), M(327.2), (0.65, 2.5), f=-30)
    move('hamilton', M(329.0), M(330.0), (0.0, 1.75), f=0)
    # ---- blackout 331.25: the five go, striking the table (ens8), the lamp (ens10) and Burr's chair (ens4);
    # the four find their places for The Story of Tonight
    exit_('ens8', M(331.3), 'D_UC', speed=2.4)
    exit_('ens10', M(331.3), 'W_MSL', speed=2.2)
    exit_('ens4', M(331.3), 'W_USR', speed=2.2)
    exit_('ens1', M(331.4), 'W_DSR', speed=2.2)
    exit_('ens5', M(331.5), 'W_USR', speed=2.2)
