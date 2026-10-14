# 1-05 The Schuyler Sisters
from lib import *

def Y(at): return S('1-05', at)

SIS = ['eliza', 'angelica', 'peggy']
CITY = ['ens%d' % i for i in range(1, 9)]   # REVIEW2: eight of the company (was ten); ens9 and ens10 stay off
CROWD = ['ens1', 'ens3', 'ens5', 'ens7']    # who stays on into 1-06 as Seabury's crowd (with ens2, Seabury)

def build():
    # ---- Q150 0.7 Burr introduces the scene
    # REVIEW2 (Jack): Burr comes from UPSTAGE LEFT and RUNS to downstage right at the start -- into his AF (ch2,
    # (-1.82, 4.25)), about 3 m/s
    put('burr', Y(0.2), WINGS['W_USL'], off=True); W['burr'][-1]['d'] = 0
    put('burr', Y(4.4), (-2.0, 4.15), f=0)
    # ---- Q151 10.4 downtown: the city walks on and fills the street, the centre lane kept clear
    city = [(-4.0, -1.6), (-2.6, -0.6), (-1.6, -2.2), (1.8, -0.4), (2.8, -1.5), (4.0, 0.0), (-3.4, 1.2),
            (2.2, 1.6)]
    cw = {'ens1': 'W_USR', 'ens2': 'W_DSL', 'ens3': 'W_USR', 'ens4': 'W_USL', 'ens5': 'W_MSL',
          'ens6': 'W_MSL', 'ens7': 'D_UC', 'ens8': 'W_USL'}     # REVIEW2: nobody from W_MSR (its line crosses the SR stair)
    for k, e in enumerate(CITY):
        put(e, Y(2.0 + 0.1 * k), WINGS[cw[e]], off=True)
    m = assign(CITY, city)
    for k, e in enumerate(sorted(CITY, key=lambda e: -dist(pos(e), m[e]))):
        p = m[e]
        W[e][-1]['d'] = 0
        W[e][-1]['t'] = Y(9.8 + 0.4 * k)
        put(e, Y(9.8 + 0.4 * k + max(3.4, dist(p, pos(e)) / 1.5)), p, f=0)
    move('burr', Y(10.4), Y(14.0), (-4.6, 4.3), f=30)
    # the street bustles: everyone drifts a step outward and back, cheating to the lane
    for e in CITY:
        p = pos(e); s = 1 if p[0] > 0 else -1
        q = (p[0] + 0.6 * s, p[1] + 0.3)
        if q[0] < -3.7 and -0.6 < q[1] < 2.4: q = (p[0], p[1] + 0.6)
        move(e, Y(16.0 + 0.2 * CITY.index(e)), Y(18.4 + 0.2 * CITY.index(e)), q, f=-25 * s)
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
    outer = [ring(3.6, -62 + 17.5 * k) for k in range(8)]
    form(CITY, outer, Y(39.9), Y(42.3), face=0)
    revolve(CITY, Y(42.6), Y(50.6), -60, step=15, face=0, r=3.6)
    # REVIEW 3 (the Disney+ clip POHVE9uCNAY, its viewers' timestamped comments; the clip runs about 1 s behind the
    # album): the three friends are IN the city. "0:51 Anthony [Laurens] ... in the back"; "1:23 Lafayette and Mulligan
    # do a secret handshake on the railing" (the upstage gallery); "2:05 Leslie [Burr] interacts with Daveed
    # [Lafayette] in the background". So: Lafayette and Mulligan come through the passage onto the upstage gallery as
    # the company joins (Q158), Laurens walks on USL into the back of the street once the city has turned past.
    for a, x, t0 in (('mulligan', -0.35, 43.4), ('lafayette', 0.35, 44.2)):
        put(a, Y(t0), G_UC, off=True, y=GAL); W[a][-1]['d'] = 0
        via(a, Y(t0 + 1.2), (0.6, -3.35), y=GAL)
        put(a, Y(t0 + 1.4 + abs(x - 0.6) / 1.3), (x, -3.35), f=0, y=GAL)
    put('laurens', Y(45.6), WINGS['W_USL'], off=True); W['laurens'][-1]['d'] = 0
    put('laurens', Y(51.4), (0.9, -1.7), f=-20)
    # ---- Q159 46.7 Angelica's verse: her warm-white pool DS (ch47)
    move('angelica', Y(51.2), Y(52.4), (-1.5, 3.1), f=20)
    turn(['eliza'], Y(51.6), -25)
    turn(['peggy'], Y(51.8), -20)
    # ---- Q160 60.9 Eliza's question: her pool (ch52); Peggy gives her room
    move('peggy', Y(60.6), Y(61.6), (2.15, 2.8), f=-30)
    move('eliza', Y(60.9), Y(62.2), (1.0, 3.1), f=-70)
    # REVIEW 3: "1:05 Peggy jumps at ... the guys around her sisters" / "Peggy's lil jump after Laurens's jumpscare"
    # (three comments, 0:59-1:06): as the men claim the sisters' attention (Q161, Burr's line), Laurens pops up behind
    # Peggy; she jumps (dance.py); he backs off into the street again
    move('laurens', Y(62.8), Y(64.6), (2.65, 2.2), f=-30)
    move('laurens', Y(66.4), Y(69.0), (0.9, -1.7), f=-20)
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
    # ---- Q164 91.5 Angelica rebuffs him
    # REVIEW2 (Jack): he went off too early -- he backs away to the DSR corner, watches the start of her solo,
    # and only leaves as the city warms behind her (Q166 105.9)
    move('burr', Y(92.0), Y(94.6), (-4.3, 4.35), f=50)
    # REVIEW 3: he does NOT leave. The film's viewers: "Burr smiling ... when he's dancing with the ensemble", "Leslie
    # interacts with Daveed in the background" (2:05), and at the last "And Peggy" (2:48) "Burr does angel wings
    # around Peggy" from behind her. So he watches the start of her solo from the corner (Jack's note), joins the
    # city's SR group in the back at the anthem (Q167), and stays to the end.
    # ---- Q165 97.4 Angelica's solo: her pool to white with a white shaft over her (ch97 + ch47, about (-1.57, 3.2))
    move('angelica', Y(97.4), Y(98.4), (-1.57, 3.2), f=10)
    move('eliza', Y(97.4), Y(99.4), (0.0, 3.1), f=-30)
    move('peggy', Y(97.4), Y(99.4), (1.65, 2.9), f=-30)
    # ---- Q166 105.9 the city warms behind her: the arc comes in a step
    for e in CITY:
        r, th = polar(pos(e)); p = ring(3.5, th)
        move(e, Y(105.9), Y(108.0), p, f=face_to(p, (-1.57, 3.2), 60))
    # ---- Q167 115.5 the anthem: sisters in a line DSC in their keys, the city in rows behind (clear of the shafts)
    for a in SIS:
        move(a, Y(115.5), Y(117.0), KEYS[a], f=0)
    # REVIEW2: the marching rows and the counterpoint revolve are CUT (invented): the city stands in two loose
    # groups either side of the sisters, facing front, and cheats in to them
    groups = [(-3.6, 1.4), (-2.6, 0.3), (-3.4, -0.9), (-2.0, -1.3), (3.6, 1.4), (2.6, 0.3), (3.8, -0.8), (2.0, -1.3)]
    form(CITY, groups, Y(115.5), Y(118.2), face=0)
    move('laurens', Y(112.0), Y(114.4), (3.3, -1.6), f=-20)     # REVIEW 3: out of the city's crossing, USL
    move('burr', Y(115.7), Y(117.6), (-1.6, 1.6), d=0)          # REVIEW 3: into the back, among the city
    put('burr', Y(120.0), (-1.1, -1.9), f=0)
    # REVIEW 3: Lafayette comes down off the gallery (the SL stair) to Burr in the back: they talk (2:05-2:07)
    move('lafayette', Y(110.6), Y(114.6), (4.75, -3.1), d=0, y=GAL)
    via('lafayette', Y(115.2), (4.5, -2.45), y=GAL)
    put('lafayette', Y(119.7), (2.2, -2.45), d=0)
    put('lafayette', Y(122.4), (-0.45, -2.35), f=-55)
    turn(['burr'], Y(122.6), 130)
    turn(['burr', 'lafayette'], Y(127.6), 0)
    # Q168 122.4 the sweep; Q169 131.6 the hit
    turn(CITY, Y(122.4), lambda a, p: 30 if p[0] < 0 else (-30 if p[0] > 0 else 0))
    turn(CITY, Y(131.6), 0)
    # ---- Q170 134.2 the counterpoint: the sisters under their shafts; the city holds, cheating in
    for a in SIS:
        move(a, Y(134.4), Y(135.8), SHAFT[a], f=0)
    turn(CITY, Y(134.6), lambda a, p: 25 if p[0] < 0 else -25)
    # ---- Q171 148.2 the reprise: sisters DSC again; ens2 drifts to where Seabury's box will be set
    move('ens2', Y(148.2), Y(150.4), (2.4, 1.5), f=-20)
    for a in SIS:
        move(a, Y(150.6), Y(152.0), KEYS[a], f=0)
    # REVIEW 3: "2:48 when Peggy says 'And Peggy' Burr makes a sign behind her that symbolizes wings" (two comments):
    # he crosses to stand behind her SL shoulder for the names; the wings are in dance.py
    move('burr', Y(163.0), Y(166.0), (2.15, 2.45), f=-10)
    # ---- Q172 162.6 the names again: each sister cheats out into her shaft
    for a, f in (('angelica', 20), ('eliza', 0), ('peggy', -20)):
        turn([a], Y(162.6 + 0.6 * SIS.index(a)), f)
    # ---- Q173 173.0 stabs; Q174 177.6 the final line: the city pushes in a step; Q174.5 the button
    for e in CITY:   # SPOT: the front row only a little, so it stays out of the sisters' shafts
        p = pos(e); move(e, Y(173.0), Y(174.4), (p[0], p[1] + (0.2 if p[1] > 1.0 else 0.5)), f=0)
    for a, f in (('angelica', 15), ('eliza', 0), ('peggy', -15)):
        turn([a], Y(181.0), f)
    # ---- blackout 184.7: the sisters leave; the city stays and becomes the crowd at Seabury's soapbox
    exit_('angelica', Y(183.0), 'W_DSR', speed=2.4)
    exit_('peggy', Y(183.0), 'W_DSL', speed=2.4)
    exit_('eliza', Y(183.4), 'W_DSL', speed=2.4)
    for k, e in enumerate([e for e in CITY if e not in CROWD + ['ens2']]):   # REVIEW2: the rest of the city goes
        exit_(e, Y(184.8 + 0.3 * k), nearest_wing(pos(e), ['W_USR', 'W_USL', 'W_MSL', 'D_UC']), speed=2.2)
    # REVIEW 3: the friends go in the dark (they come back on in Farmer Refuted from the SR wings); Burr stays on and
    # finds his place in Seabury's crowd (t106), round the box being set
    exit_('lafayette', Y(184.9), 'W_USR', speed=2.2)
    exit_('laurens', Y(184.9), 'W_USL', speed=2.2)
    move('mulligan', Y(184.9), Y(185.6), (0.6, -3.35), d=0, y=GAL)
    put('mulligan', Y(186.2), G_UC, off=True, y=GAL)
    move('burr', Y(183.3), Y(184.4), (1.0, 1.4), d=0)
    put('burr', S('1-06', 0.8), (-1.3, 0.5), f=60)
