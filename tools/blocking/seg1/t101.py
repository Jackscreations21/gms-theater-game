# 1-01 Alexander Hamilton
from lib import *

def A(at): return S('1-01', at)

def build():
    # ---- everyone offstage at the top, labelled
    start('burr', 'W_DSR', t=LEAD_IN); start('hamilton', 'D_UC'); start('laurens', 'W_MSL')
    start('lafayette', 'W_MSR'); start('mulligan', 'W_DSL'); start('eliza', 'W_MSL')
    start('angelica', G_UC, y=GAL); start('peggy', G_UC, y=GAL); start('washington', 'D_UC')
    wings = {'ens1': 'W_USR', 'ens2': 'W_MSR', 'ens3': 'D_UC', 'ens4': 'W_USL', 'ens5': 'W_MSL',
             'ens10': 'W_MSR'}
    GALQ = ['ens6', 'ens7', 'ens8', 'ens9']            # REVIEW: four of the company watch from the upstage gallery
    DECK6 = [e for e in ENS if e not in GALQ]
    for e in DECK6: start(e, wings[e])
    for e in GALQ: start(e, G_UC, y=GAL)

    # ---- Burr Enters (Q36 2.0): walks on from the DSR wing and starts the story
    # SPOT: Burr's AF stand-in (ch2, preset 117 BURR) lands at (-1.82, 4.25): he walks into it and works inside it
    # REVIEW2 (Jack): Burr walks on in the 10 s lead-in and is in his place when the music starts at 0
    move('burr', A(-8.0), A(-3.5), (-1.9, 4.05), f=0)
    move('burr', A(10.0), A(12.5), (-1.45, 4.2), f=0)
    move('burr', A(15.8), A(19.0), (-4.4, 3.2), f=40)          # gives the floor to Laurens

    # ---- the company gathers into the opening pools
    # REVIEW2 (Jack): the ensemble walks on SLOWER and a little AFTER Lafayette (Jefferson, Q39 33.5) starts
    A_slots = [(-3.2, -1.4), (-1.0, -1.6), (1.0, -1.6), (3.2, -1.2), (-1.8, 0.6), (1.8, 0.6)]
    m = assign(DECK6, A_slots)
    for k, e in enumerate(sorted(DECK6, key=lambda e: -dist(pos(e), m[e]))):
        p = m[e]
        q = WINGS[wings[e]]
        tl = 36.0 + 0.7 * k
        ta = tl + max(4.5, dist(p, q) / 0.85)      # a stroll, about 0.85 m/s
        move(e, A(tl), A(ta), p, f=0)
    # the gallery four come through the passage onto the upstage gallery (it warms on Q39), at the same slow pace
    for k, (e, x) in enumerate(zip(['ens9', 'ens6', 'ens8', 'ens7'], [3.2, -3.2, 1.5, -1.5])):
        W[e][-1]['d'] = 0
        W[e][-1]['t'] = A(36.4 + 1.4 * k)
        via(e, A(38.4 + 1.4 * k), (0.6, -3.35), y=GAL)
        put(e, A(38.8 + 1.4 * k + abs(x - 0.6) / 0.85), (x, -3.35), f=0, y=GAL)

    # ---- Q38 18.6 Laurens' verse, his pin SL
    move('laurens', A(14.4), A(19.0), (2.9, 3.3), f=-15)   # SPOT: into his SL pin (ch51)
    move('laurens', A(33.4), A(36.0), (4.0, 2.3), f=-40)
    # ---- Q39 33.5 Jefferson's verse SR (Lafayette's body)
    move('lafayette', A(29.0), A(34.0), (-2.85, 3.15), f=15, label='Jefferson')   # SPOT: his SR pin (ch48)
    move('lafayette', A(43.4), A(45.8), (-3.4, 4.3), f=30)
    # ---- Q40 48.4 Madison: the hurricane (Mulligan's body)
    move('mulligan', A(41.6), A(46.2), (1.1, 2.7), f=-10, label='Madison')   # SPOT: ch52

    # REVIEW2: the hurricane swirl on the outer ring is CUT (invented; Blankenbuehler kept the opening off the
    # turntable, and the slower entrance lands the six in their pools only just before Q40). They hold their pools.
    E = ENS
    # Q41 55.9: the gallery four come down for the company's turn (two by each onstage stair)
    for e, x, t0 in (('ens9', 3.2, 53.4), ('ens8', 1.5, 53.6)):
        t1 = t0 + abs(4.75 - x) / 1.3
        move(e, A(t0), A(t1), (4.75, -3.1), d=0, y=GAL)
        via(e, A(t1 + 0.6), (4.5, -2.45), y=GAL)
        put(e, A(t1 + 5.1), (2.2, -2.45), d=0)
        put(e, A(t1 + 6.0), {'ens9': (1.6, -1.5), 'ens8': (2.6, -1.6)}[e], f=0)
    for e, x, t0 in (('ens6', -3.2, 52.6), ('ens7', -1.5, 52.8)):
        t1 = t0 + abs(-4.5 - x) / 1.3
        move(e, A(t0), A(t1), (-4.5, -3.35), d=0, y=GAL)
        via(e, A(t1 + 2.4), (-4.5, -0.3), y=GAL)
        put(e, A(t1 + 6.9), (-4.5, 1.85), d=0)
        put(e, A(t1 + 7.6), {'ens6': (-3.2, 2.6), 'ens7': (-3.7, 2.0)}[e], f=40)


    # ---- Q42 63.4 the company takes the story: everyone warps in slow motion into an upstage arc
    arc = [ring(3.2, -81 + 18 * k) for k in range(10)]
    form(E, arc, A(63.4), A(68.4), face=0)
    move('mulligan', A(64.4), A(67.4), (4.4, 2.2), f=-40, label='Mulligan')
    move('burr', A(63.4), A(66.0), (-1.6, 3.9), f=0)
    move('lafayette', A(63.4), A(66.5), (-3.3, 4.1), f=20, label='Lafayette')
    move('laurens', A(63.4), A(66.0), (2.6, 4.4), f=-20)

    # ---- Q43 71.2 the collection: the company opens a corridor down the centre for him
    vsr = [(-1.1, -1.7), (-1.7, -0.5), (-2.3, 0.7), (-2.9, 1.9), (-3.5, 3.1)]
    vsl = [(-x, z) for x, z in vsr]
    order = sorted(E, key=lambda a: pos(a)[0])
    srs = [a for a in order[:5]]; sls = [a for a in order[5:]]
    srs.sort(key=lambda a: -abs(polar(pos(a))[1] % 360 - 360) if polar(pos(a))[1] < 0 else 0)
    srs.sort(key=lambda a: abs(polar(pos(a))[1]))
    sls.sort(key=lambda a: abs(polar(pos(a))[1]))
    form(srs, [s + (60,) for s in vsr], A(71.2), A(74.2), face='slot', fixed=True)
    form(sls, [s + (-60,) for s in vsl], A(71.2), A(74.2), face='slot', fixed=True)
    move('burr', A(71.2), A(73.4), (-2.2, 4.5), f=30)
    move('lafayette', A(71.0), A(73.4), (-4.6, 3.0), f=40)

    # ---- Q44 79.0 Hamilton revealed: up through the corridor from the deck door into the centre shaft
    move('hamilton', A(74.4), A(76.6), (0.3, -2.3), d=0)
    put('hamilton', A(79.0), C, f=0)
    turn(E, A(79.2), lambda a, p: face_to(p, C, 135))
    turn(['burr', 'lafayette', 'laurens', 'mulligan'], A(79.4), lambda a, p: face_to(p, C, 110))

    # ---- Q45 85.9 the company closes round him, Q46 89.5 the hook accent: they spring out and face front
    bear = sorted(E, key=lambda a: polar(pos(a))[1])
    for k, a in enumerate(bear):
        th = -162 + k * 36
        p = ring(2.0, th)
        move(a, A(85.9), A(87.9), p, f=face_to(p, C))
    for k, a in enumerate(bear):
        th = -162 + k * 36
        move(a, A(89.5), A(91.0), ring(3.0, th), f=0)

    # ---- Q47 93.2 Eliza's verse, her key SL; the company withdraws to an upstage line
    enter('eliza', A(90.0), A(93.6), (2.2, 3.05), -45, wing='W_DSL')   # SPOT: her warm key SL (ch52 at (2.14, 3.06))
    turn(['hamilton'], A(93.0), 40)
    eline = [(-4.4, -1.9), (-3.5, -1.9), (-2.6, -1.9), (-1.7, -1.9), (-0.9, -1.9),
             (0.9, -1.9), (1.7, -1.9), (2.6, -1.9), (3.5, -1.9), (4.3, -1.7)]
    form(E, eline, A(92.4), A(95.8), face=0)   # SPOT: a beat early, clear of Eliza's key

    # ---- Q48 105.2 his mother dies: ens6 comes down to him, then is gone
    MOTHER = 'ens6'
    CARRIER = 'ens7'   # REVIEW2: fixed (was the nearest to (-1.7, -1.9), which is ens7): props.py names him
    move(MOTHER, A(101.6), A(105.0), (-0.75, 1.25), f=70)
    move(CARRIER, A(102.6), A(105.6), (-1.25, 0.95), f=60)
    turn(['hamilton'], A(104.6), -70)
    # REVIEW2: off DSR round Lafayette (the old MSR line crossed the SR stair)
    move(MOTHER, A(108.4), A(111.4), (-4.0, 4.25), d=0); put(MOTHER, A(113.8), WINGS['W_DSR'], off=True)
    move(CARRIER, A(108.4), A(111.4), (-4.1, 3.4), d=0); put(CARRIER, A(114.0), (-7.6, 3.8), off=True)
    # ---- Q49 109.2 Washington UC; the cousin on the centre chair (fan staging account)
    # SPOT: his pale warm pool UC is ch12 refocused onto the deck at (-0.57, -0.59) (rev 2); he steps back to UC after the verse
    move('washington', A(105.6), A(109.2), (-0.5, -0.65), f=15)
    move('washington', A(119.8), A(121.8), (0.0, -2.3), f=0)
    move('hamilton', A(107.6), A(109.0), (1.0, 1.7), f=-150)
    # REVIEW2: the chair is real (fan account: a chair centre, the cousin on it). It stands preset UC by the SL
    # stair foot (props.py 'cousin-chair' at (1.6, -2.75)); the cousin picks it up at 106.6 and sets it at centre.
    COUSIN = 'ens3'    # fixed (was the nearest to (0.9, -1.9)): props.py names him
    cousin_home = pos(COUSIN)
    move(COUSIN, A(106.6), A(109.4), (0.0, 0.35), f=0)    # REVIEW2: on the chair, which he sets at (0, 0.35)
    move(COUSIN, A(116.4), A(118.6), cousin_home, f=0)
    move('eliza', A(109.6), A(112.6), (5.0, 3.6), f=-60)
    exit_('eliza', A(113.0), 'W_DSL')

    # ---- Q50 119.8 Burr, the reader
    move('burr', A(119.8), A(121.6), (-1.65, 4.15), f=0)   # SPOT: his AF (ch2)
    move('hamilton', A(119.8), A(122.0), (1.6, 2.7), f=40)
    enter('angelica', A(118.4), A(122.6), (2.3, 3.2), -50, wing='W_DSL')   # she hands him a book
    exit_('angelica', A(125.0), 'W_DSL')
    # ---- Q51 130.0 the clerking: Mulligan's verse SL; the company dances in two loose rows
    move('mulligan', A(130.0), A(131.6), (1.8, 3.3), f=-30)   # SPOT: his key SL (ch51 at (1.78, 3.27))
    move('burr', A(130.0), A(132.6), (-3.0, 4.4), f=35)    # REVIEW2: was (-3.6, 3.8), the carriers' path
    # REVIEW2 (Jack): right before Q51 two of the company (ens7 carrying, ens6 beside him) bring a table on to the
    # centre (props.py 'clerk-table' at (0, 1.6)); Hamilton works at it, on the cousin's chair behind it (C);
    # at Q52 they take the table and the chair off again.
    TABLE = (0.0, 1.6)
    put(CARRIER, A(122.6), WINGS['W_DSR'], off=True); W[CARRIER][-1]['d'] = 0
    via(CARRIER, A(125.4), (-4.0, 4.25))                       # round Lafayette, who stands DSR
    put(CARRIER, A(129.4), (-1.0, 1.6), f=90)                  # sets the table down at its SR end
    put(MOTHER, A(122.9), (-7.6, 3.8), off=True); W[MOTHER][-1]['d'] = 0
    via(MOTHER, A(125.9), (-3.9, 3.55))                        # beside him, a body's width upstage
    put(MOTHER, A(129.8), (-0.95, 0.4), f=60)                  # stands by the chair
    move('hamilton', A(128.6), A(130.0), (0.95, 1.0), d=0)     # round the table's SL end
    put('hamilton', A(130.8), C, f=0)                          # at the table, on the chair: writing
    fslots = [(-4.0, -1.0), (-2.4, -1.4), (-0.8, -1.0), (-3.2, 0.4), (-1.6, -0.3),
              (3.6, 0.6), (3.4, -1.0), (4.2, 1.9)]
    others = [e for e in E if e not in (MOTHER, CARRIER)]
    form(others, fslots, A(130.0), A(133.0), face=0)
    # Laurens brings him his pack for the voyage (fan account): to the table's SL side
    move('laurens', A(136.4), A(137.0), (2.75, 2.9), d=0)   # SPOT: round Mulligan, who is in his key
    put('laurens', A(138.8), (1.15, 1.05), f=-90)
    turn(['hamilton'], A(137.6), 80)
    move('laurens', A(139.8), A(141.2), (2.75, 2.9), d=0)
    put('laurens', A(142.6), (2.6, 4.4), f=-20)
    # Q52 141.3: the table and the chair go off DSR
    move(CARRIER, A(141.3), A(144.0), (-4.0, 4.25), d=0)
    put(CARRIER, A(146.4), WINGS['W_DSR'], off=True)
    move(MOTHER, A(141.6), A(144.6), (-3.9, 3.55), d=0)
    put(MOTHER, A(147.0), (-7.6, 3.8), off=True)

    # ---- Q52 141.3 the voyage: the company becomes the ship, sailing SL; he climbs to the gallery (the prow)
    hull = [(-3.7, -0.4), (-2.7, -0.4), (-1.7, -0.4), (-0.7, -0.4), (-3.7, 1.7), (-2.7, 1.7), (-1.7, 1.7),
            (-0.7, 1.7)]
    SHIP = [e for e in E if e not in (MOTHER, CARRIER)]    # REVIEW2: the two carriers are off with the table
    m = assign(SHIP, hull)
    for a in SHIP:   # the ones from SL wait until he has passed on his way to the stair
        late = pos(a)[0] > 1.0
        move(a, A(143.0 if late else 141.6), A(145.6 if late else 145.0), m[a], f=90)
    for a in SHIP:
        p = pos(a)
        move(a, A(145.8), A(148.0), (p[0] + 0.7, p[1]), f=90)
    move('hamilton', A(140.2), A(143.8), (2.2, -2.45), d=0)
    put('hamilton', A(148.6), (4.5, -2.45), d=0, y=GAL)
    put('hamilton', A(149.8), (4.75, -3.1), d=0, y=GAL)
    put('hamilton', A(152.6), (1.6, -3.35), f=0, y=GAL)
    move('washington', A(141.3), A(142.4), (0.0, -1.25), f=0)   # SPOT: under the voyage's white top light UC (ch13, a narrow wash)
    move('washington', A(148.2), A(149.4), (0.0, -1.8), f=0)

    # ---- Q53 148.2 New York: the company bursts out across the stage, the centre lane left open
    hslots = [(-4.2, 0.2), (-2.8, 0.2), (3.0, 0.2), (4.2, 0.7), (-3.6, 1.6), (-2.2, 1.6), (2.4, 1.6),
              (3.8, 1.9), (-1.0, 2.6), (1.4, 2.6)]
    m = assign(E, hslots)
    for k, a in enumerate(sorted(E, key=lambda a: -dist(pos(a), m[a]))):
        tl = 148.2 + 0.25 * k
        move(a, A(tl), A(tl + max(2.6, dist(pos(a), m[a]) / 2.0)), m[a], f=0)
    move('burr', A(148.2), A(150.6), (-1.8, 4.2), f=0)
    move('lafayette', A(148.2), A(150.6), (-3.4, 3.6), f=0)
    move('laurens', A(148.2), A(150.6), (1.9, 4.1), f=0)
    move('mulligan', A(148.2), A(150.6), (3.4, 3.6), f=0)
    # Q54 154.5 the sweep: the company cheats in to the centre
    turn(E, A(154.5), lambda a, p: 30 if p[0] < 0 else -30)
    # he comes down from the prow to DC for the women
    # REVIEW: he steps off the ship and two of the company tie it up at the stair foot (Searcy 2018)
    for a, p in zip(sorted(E, key=lambda a: dist(pos(a), (2.2, -2.45)))[:2], [(1.3, -2.2), (3.0, -1.6)]):
        move(a, A(157.6), A(160.0), p, f=face_to(p, (2.2, -2.45)))
    move('hamilton', A(155.0), A(157.4), (4.75, -3.1), d=0, y=GAL)
    put('hamilton', A(158.2), (4.5, -2.45), d=0, y=GAL)
    put('hamilton', A(162.7), (2.2, -2.45), d=0)
    put('hamilton', A(166.3), (0.0, 3.0), f=0)

    # ---- Q56 166.3 the women sing to him
    # SPOT: Q56 lights Eliza's and Angelica's warm keys ON THE DECK (ch52 SL (2.55, 1.92), ch47 SR (-2.76, 2.43));
    # they walk on into them. Peggy alone on the warm upstage gallery, in its special (ch74 (1.90, -3.61)).
    put('peggy', A(162.3), G_UC, off=True, y=GAL)
    W['peggy'][-1]['d'] = 0
    via('peggy', A(163.9), (0.6, -3.35), y=GAL)
    put('peggy', A(165.5), (1.75, -3.4), f=0, y=GAL)
    enter('eliza', A(163.0), A(167.4), (2.55, 1.95), -68, wing='W_DSL')   # a beat after the company clears her key
    enter('angelica', A(161.4), A(166.3), (-2.75, 2.45), 78, wing='W_DSR')
    side = [(-3.6, 0.2), (-2.4, 0.6), (-1.4, -0.4), (-3.9, 1.3), (-4.1, 3.3),
            (3.6, 0.2), (2.4, 0.6), (1.4, -0.4), (3.9, 1.3), (4.1, 3.3)]
    form(E, side, A(166.3), A(169.0), face=('at', (0, 2.4), 140))
    move('burr', A(166.3), A(168.8), (-1.6, 4.4), f=30)
    move('lafayette', A(166.3), A(168.8), (-3.8, 4.2), f=150)
    move('laurens', A(166.3), A(168.8), (1.6, 4.3), f=-150)
    move('mulligan', A(166.3), A(168.8), (3.9, 4.2), f=-140)
    turn(['hamilton'], A(169.6), -101)    # to Angelica
    turn(['hamilton'], A(172.8), 112)     # to Eliza
    turn(['hamilton'], A(176.0), 0)

    # ---- Q58 179.5 the anthem: a wedge behind him DSC
    move('hamilton', A(179.5), A(181.0), (0.0, 4.2), f=0)
    move('laurens', A(179.5), A(181.4), (1.2, 3.3), f=0)
    move('lafayette', A(179.5), A(181.8), (-2.4, 2.6), f=0)
    move('mulligan', A(179.5), A(181.8), (2.4, 2.6), f=0)
    move('burr', A(179.5), A(181.4), (-1.2, 3.3), f=0)
    move('eliza', A(179.5), A(181.6), (3.6, 1.0), f=-60)
    move('angelica', A(179.5), A(181.8), (-4.6, 2.4), f=70)
    # REVIEW: two of the company UL, the rest SR, so Peggy comes down the SL stair clear of them
    jslots = [(-3.6, 1.2), (-1.8, 1.4), (-4.0, -0.2), (-2.0, -0.2), (-3.0, 2.8), (-0.9, -0.8), (0.0, 0.4),
              (-2.8, 0.6), (0.9, -1.4), (1.6, -0.3)]
    form(E, jslots, A(179.5), A(182.4), face=0)
    # Peggy comes down the SL stair (Q59 193.7 the held note)
    for a, tl, hold in (('peggy', 187.4, (4.0, -0.8)),):
        x0 = pos(a)[0]
        t1 = tl + dist((x0, -3.35), (4.75, -3.1)) / 1.4
        move(a, A(tl), A(t1), (4.75, -3.1), d=0, y=GAL)
        via(a, A(t1 + 0.8), (4.5, -2.45), y=GAL)
        via(a, A(t1 + 5.3), (2.2, -2.45))
        put(a, A(t1 + 5.3 + dist((2.2, -2.45), hold) / 1.3 + 0.2), hold, f=-30)

    # ---- Q60 201.2 the company turns toward him: Hamilton to the centre shaft, all eighteen in a ring
    move('hamilton', A(201.2), A(204.0), (0.0, 1.0), f=0)
    # SPOT: the ring is set so each roll-call pool is on (or one step in from) its owner's place:
    # Lafayette 228 (ch47), Mulligan 190 (ch49), Laurens 140 (ch51), Washington 0 (ch12), Eliza 110 (ch52),
    # Angelica 252 at r 3.4 (ch48), Burr 210 at r 3.4 (ch2, his AF); the downstage arc is left open
    ringslots = {'washington': (0, 3.2), 'peggy': (88, 3.2), 'eliza': (110, 3.2), 'laurens': (140, 3.2),
                 'mulligan': (190, 3.2), 'burr': (210, 3.4), 'lafayette': (228, 3.2), 'angelica': (252, 3.4)}
    es = [15, 30, 45, 60, 74, 266, 284, 302, 320, 338]
    for a, (th, rr) in ringslots.items():
        p = ring(rr, th)
        if a in ('peggy', 'angelica', 'eliza'):
            move(a, A(202.0), A(205.2), p, f=face_to(p, C, 135))
        elif a == 'laurens':
            move(a, A(201.2), A(202.2), p, f=face_to(p, C, 135))
        elif a == 'mulligan':   # SPOT: round behind Laurens to the SR side of the downstage arc
            move(a, A(201.4), A(202.6), (1.2, 2.9), d=0)
            via(a, A(203.8), (0.5, 4.3))
            put(a, A(205.0), p, f=face_to(p, C, 135))
        else:
            move(a, A(201.2), A(204.6), p, f=face_to(p, C, 135))
    m = assign(E, [ring(3.2, th) for th in es])
    for a in E:
        move(a, A(201.0), A(204.2), m[a], f=face_to(m[a], C, 135))

    # ---- Q61 212.0 the friends, each in a pool on a dark deck (Lafayette ch47, Mulligan ch49, Laurens ch51)
    move('lafayette', A(211.6), A(212.4), (-2.6, 3.05), f=40)
    move('mulligan', A(211.4), A(212.4), (-0.62, 3.52), f=-10)
    move('laurens', A(211.6), A(212.4), (1.95, 3.25), f=-40)
    # Q62 214.0 Laurens alone: the other two step back into the ring
    for a in ('mulligan', 'lafayette'):
        th, rr = ringslots[a]; p = ring(rr, th)
        move(a, A(213.6), A(214.6), p, f=face_to(p, C, 135))
    # Q63 215.9 Washington's pool UC (ch12); Laurens slips round to his place for the line-up
    move('washington', A(214.3), A(215.9), (-0.55, -0.6), f=19)
    move('laurens', A(216.0), A(219.0), (-1.2, 3.0), f=20)
    # Q64 217.4 the women's line: Eliza's pool SL (ch52), Angelica's SR (ch48)
    move('eliza', A(216.9), A(217.9), (2.6, 1.95), f=-20)
    move('angelica', A(216.9), A(217.9), (-2.05, 2.05), f=20)
    # ---- Q65 219.6 Burr's confession: into his AF (ch2); in the dark Angelica crosses to the sisters' side
    move('burr', A(219.2), A(220.0), (-1.82, 4.22), f=0)
    move('angelica', A(219.7), A(223.2), (3.1, 2.9), f=-30)

    # ---- Q66 223.3 the line-up across the front, the company in a row behind
    # REVIEW: symmetric, four each side of him; Burr beside him for the last question; the sisters SL
    # SPOT: Q66 brings his centre shaft back (ch13 at (0, 1.15)): he holds it, framed by a corridor through the
    # row and the line, and comes down into the line on Q67 (229.4, the last question)
    line = {'washington': -3.4, 'lafayette': -2.55, 'laurens': -1.7, 'burr': -0.85, 'hamilton': 0.0,
            'mulligan': 0.85, 'eliza': 1.7, 'angelica': 2.55, 'peggy': 3.4}
    for a, x in line.items():
        if a == 'washington':
            move(a, A(226.0), A(228.5), (-3.0, 1.0), d=0)
            via(a, A(229.6), (-3.0, 3.0))
            put(a, A(230.4), (x, 3.7), f=0)
        elif a == 'burr':
            move(a, A(223.9), A(226.4), (x, 3.7), f=0)
        elif a == 'hamilton':
            move(a, A(229.4), A(231.0), (x, 3.7), f=0)
        else:
            move(a, A(223.3), A(226.2), (x, 3.7), f=0)
    erow = [(x, 2.2) for x in (-4.4, -3.6, -2.4, -1.6, -0.8, 0.8, 1.6, 2.4, 3.3, 4.3)]
    m = assign(E, erow)
    for a in E:
        move(a, A(223.3), A(226.4), m[a], f=0)
    # Q67 229.4 the last question: Burr turns to him; Q68 the button, all to him
    turn(['burr'], A(229.4), 60)
    turn([a for a in line if a not in ('burr', 'hamilton')], A(232.4),
         lambda a, p: 25 if p[0] < 0 else -25)
    turn(['burr'], A(233.0), 0)

    # ---- blackout 233.9: the company clears in the dark; Burr finds his street mark, Hamilton goes off SL
    UPW = ['W_MSR', 'W_MSL', 'W_USR', 'W_USL', 'D_UC']
    for a in E:     # REVIEW: the row behind goes off upstage, the line downstage, so nobody crosses in the dark
        exit_(a, A(234.0) + 0.25 * ENS.index(a), nearest_wing(pos(a), UPW), speed=2.4)
    for a in ('washington', 'lafayette', 'mulligan', 'laurens', 'eliza', 'angelica', 'peggy'):
        exit_(a, A(234.0), nearest_wing(pos(a), ['W_DSR', 'W_DSL']), speed=2.4)
    exit_('hamilton', A(234.0), 'W_DSL', speed=2.4)
