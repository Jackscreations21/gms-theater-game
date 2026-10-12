# 1-05 The Schuyler Sisters
from lib import *

def Y(at): return S('1-05', at)

SIS = ['eliza', 'angelica', 'peggy']

def build():
    # ---- Q150 0.7 Burr DS introduces the scene (he walks on in the dark of the change)
    put('burr', S('1-04', 86.0), WINGS['W_DSR'], off=True)
    move('burr', S('1-04', 88.8), Y(0.7), (-1.7, 4.2), f=0)   # SPOT: his AF (ch2)
    # ---- Q151 10.4 downtown: the city walks on and fills the street, the centre lane kept clear
    city = [(-4.0, -1.6), (-2.6, -0.6), (-1.6, -2.2), (1.8, -0.4), (2.8, -1.5), (4.0, 0.0), (-3.6, 1.2),
            (-2.0, 1.4), (2.2, 1.6), (3.4, 2.4)]
    cw = {'ens1': 'W_USR', 'ens2': 'W_MSR', 'ens3': 'W_USR', 'ens4': 'W_USL', 'ens5': 'W_MSL',
          'ens6': 'W_MSL', 'ens7': 'W_MSR', 'ens8': 'W_USL', 'ens9': 'D_UC', 'ens10': 'W_DSL'}
    for k, e in enumerate(ENS):
        put(e, Y(2.0 + 0.1 * k), WINGS[cw[e]], off=True)
    m = assign(ENS, city)
    for k, e in enumerate(sorted(ENS, key=lambda e: -dist(pos(e), m[e]))):
        p = m[e]
        W[e][-1]['d'] = 0
        W[e][-1]['t'] = Y(9.8 + 0.4 * k)
        put(e, Y(9.8 + 0.4 * k + max(3.4, dist(p, pos(e)) / 1.5)), p, f=0)
    move('burr', Y(10.4), Y(14.0), (-4.6, 4.3), f=30)
    # the street bustles: everyone drifts a step outward and back, cheating to the lane
    for e in ENS:
        p = pos(e); s = 1 if p[0] > 0 else -1
        q = (p[0] + 0.6 * s, p[1] + 0.3)
        if q[0] < -3.7 and -0.6 < q[1] < 2.4: q = (p[0], p[1] + 0.6)
        move(e, Y(16.0 + 0.2 * ENS.index(e)), Y(18.4 + 0.2 * ENS.index(e)), q, f=-25 * s)
    # ---- Q152-154 the sisters revealed one by one, up from the deck door into their shafts
    # SPOT: the cue's shafts and keys put ANGELICA SR (ch96 (-1.65, 2.81) on her name, then ch48, her verse pool ch47
    # (-1.52, 3.27), her solo ch97 (-1.62, 3.13)), ELIZA CENTRE (ch98 (0, 3.16), ch50, her question ch52 (1.10, 3.06)) and
    # PEGGY SL (ch100 (1.65, 2.81), ch51). The blocking follows the light; the review's photo-caption order (Eliza SR,
    # Angelica centre) is reported to the coordinator as a cue question, not forced here.
    for a, p, ta in (('angelica', (-1.62, 2.85), 21.9), ('eliza', (0.0, 3.1), 24.2), ('peggy', (1.62, 2.85), 25.9)):
        put(a, Y(ta - 6.2), WINGS['D_UC'], off=True)
        put(a, Y(ta), p, f=0)
    # ---- Q155 26.7 the title: into their keys DSC, under their shafts
    KEYS = {'angelica': (-1.66, 3.0), 'eliza': (0.0, 3.3), 'peggy': (1.66, 3.0)}
    SHAFT = {'angelica': (-1.6, 2.85), 'eliza': (0.0, 3.1), 'peggy': (1.6, 2.85)}
    for a in SIS:
        move(a, Y(26.7), Y(28.0), KEYS[a], f=0)
    # ---- Q157 39.9 the street walk: they hold their row (walking against the disc), the city is carried round
    # REVIEW: they walk AGAINST the turning disc, so in the theatre they stay put (fan staging account);
    # the city on the outer ring is carried round counter-clockwise to show the turn
    for a in SIS:
        move(a, Y(39.4), Y(41.0), SHAFT[a], f=0)
    outer = [ring(3.6, -62 + 20.44 * k) for k in range(10)]
    form(ENS, outer, Y(39.9), Y(42.3), face=0)
    revolve(ENS, Y(42.6), Y(50.6), -60, step=15, face=0, r=3.6)
    # ---- Q159 46.7 Angelica's verse: her warm-white pool DS (ch47)
    move('angelica', Y(51.2), Y(52.4), (-1.5, 3.1), f=20)
    turn(['eliza'], Y(51.6), -25)
    turn(['peggy'], Y(51.8), -20)
    # ---- Q160 60.9 Eliza's question: her pool (ch52); Peggy gives her room
    move('peggy', Y(60.6), Y(61.6), (2.15, 2.8), f=-30)
    move('eliza', Y(60.9), Y(62.2), (1.0, 3.1), f=-70)
    # ---- Q161 64.9 Burr sidles in, into his AF (ch2)
    move('burr', Y(64.9), Y(67.0), (-2.1, 4.35), f=60)
    turn(['angelica'], Y(66.0), -40)
    # ---- Q162 70.5 the swell
    move('eliza', Y(70.5), Y(71.8), (0.0, 3.15), f=0)
    move('peggy', Y(70.5), Y(71.6), (1.65, 2.95), f=0)
    # ---- Q163 77.0 Burr works Angelica, inside his AF; her sisters step aside
    move('eliza', Y(77.0), Y(78.5), (0.6, 2.6), f=-45)
    move('peggy', Y(77.0), Y(78.6), (2.2, 2.6), f=-45)
    move('burr', Y(78.0), Y(80.0), (-1.3, 4.3), f=-50)
    turn(['angelica'], Y(78.6), 25)
    move('burr', Y(85.0), Y(87.4), (-2.45, 4.1), f=40)
    turn(['angelica'], Y(85.6), -53)
    # ---- Q164 91.5 Angelica rebuffs him: he retreats off SR
    exit_('burr', Y(92.0), 'W_DSR', speed=1.6)
    # ---- Q165 97.4 Angelica's solo: her pool to white with a white shaft over her (ch97 + ch47, about (-1.57, 3.2))
    move('angelica', Y(97.4), Y(98.4), (-1.57, 3.2), f=10)
    move('eliza', Y(97.4), Y(99.4), (0.0, 3.1), f=-30)
    move('peggy', Y(97.4), Y(99.4), (1.65, 2.9), f=-30)
    # ---- Q166 105.9 the city warms behind her: the arc comes in a step
    for e in ENS:
        r, th = polar(pos(e)); p = ring(3.5, th)
        move(e, Y(105.9), Y(108.0), p, f=face_to(p, (-1.57, 3.2), 60))
    # ---- Q167 115.5 the anthem: sisters in a line DSC in their keys, the city in rows behind (clear of the shafts)
    for a in SIS:
        move(a, Y(115.5), Y(117.0), KEYS[a], f=0)
    rows = [(-3.8, 1.6), (-2.2, 1.6), (2.2, 1.6), (3.8, 1.6), (0.0, 0.2),
            (-2.7, 0.2), (-0.9, 0.2), (0.9, 0.2), (2.7, 0.2), (0.0, -1.2)]
    form(ENS, rows, Y(115.5), Y(118.2), face=0)
    # Q168 122.4 the sweep; Q169 131.6 the hit
    turn(ENS, Y(122.4), lambda a, p: 30 if p[0] < 0 else (-30 if p[0] > 0 else 0))
    turn(ENS, Y(131.6), 0)
    # ---- Q170 134.2 the counterpoint: the sisters under their shafts, the city revolves round them
    for a in SIS:
        move(a, Y(134.4), Y(135.8), SHAFT[a], f=0)
    m = assign(ENS, [ring(3.5, -162 + 36 * k) for k in range(10)])
    for a in ENS:
        move(a, Y(134.8), Y(137.4), m[a], f=face_to(m[a], C, 135))
    revolve(ENS, Y(137.4), Y(147.6), 180, step=36, face=0)
    # ---- Q171 148.2 the reprise: sisters DSC again, the rows
    # ens2 takes the row slot nearest Seabury's box for the next number
    others = [e for e in ENS if e != 'ens2']
    form(others, [r for r in rows if r != (2.2, 1.6)], Y(148.2), Y(151.0), face=0)
    move('ens2', Y(148.2), Y(149.6), (2.9, 3.3), d=0)   # SPOT: round Peggy, who is under her shaft
    put('ens2', Y(151.2), (2.2, 1.6), f=0)
    for a in SIS:
        move(a, Y(150.6), Y(152.0), KEYS[a], f=0)
    # ---- Q172 162.6 the names again: each sister cheats out into her shaft
    for a, f in (('angelica', 20), ('eliza', 0), ('peggy', -20)):
        turn([a], Y(162.6 + 0.6 * SIS.index(a)), f)
    # ---- Q173 173.0 stabs; Q174 177.6 the final line: the city pushes in a step; Q174.5 the button
    for e in ENS:   # SPOT: the front row only a little, so it stays out of the sisters' shafts
        p = pos(e); move(e, Y(173.0), Y(174.4), (p[0], p[1] + (0.2 if p[1] > 1.0 else 0.5)), f=0)
    for a, f in (('angelica', 15), ('eliza', 0), ('peggy', -15)):
        turn([a], Y(181.0), f)
    # ---- blackout 184.7: the sisters leave; the city stays and becomes the crowd at Seabury's soapbox
    exit_('angelica', Y(183.0), 'W_DSR', speed=2.4)
    exit_('peggy', Y(183.0), 'W_DSL', speed=2.4)
    exit_('eliza', Y(183.4), 'W_DSL', speed=2.4)
