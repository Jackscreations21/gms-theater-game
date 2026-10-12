import sys, math
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seg5lib import *

E = ['ens%d' % i for i in range(1, 11)]
def lab(a):
    return {'ens%d' % i: 'Ensemble %d' % i for i in range(1, 11)}.get(a)

# ======================================================================= 2-01 WHAT'D I MISS
t = lambda at: T('2-01', at)

# Burr narrates the recap from DSC, steps aside SR as the build begins, leaves before Jefferson's descent.
add('burr', t(0.0), *WINGS['W-DSR'], off=True, label='Burr')
go('burr', [(-6.0, 4.65), (-0.5, 4.4)], t_end=t(3.4), facing=0)
go('burr', [(0.5, 4.2)], t_end=t(14.0), facing=-15)
go('burr', [(-0.3, 4.3)], t_end=t(27.9), facing=10)
go('burr', [(-3.7, 3.7)], t_start=t(41.3), facing=40)
stand('burr', t(52.0), facing=face((-3.7, 3.7), (0.6, -3.35)))   # turns to look up at the gallery top centre with the company
leave('burr', 'W-DSR', t_start=t(63.0))

# --- the company: W1 an arc upstage of Burr for the recap
W1 = [ring(3.2, -110 + 220 * k / 9) for k in range(10)]
W1_toff = [2.6, 0.3, 0.8, 1.8, 2.8, 4.8, 3.8, 0.5, 2.6, 1.2]
W1_via = ['W-DSR', 'W-DSR', 'D-UC', 'D-UC', 'D-UC', 'D-UC', 'D-UC', 'W-MSL', 'W-MSL', 'W-DSL']
for k, a in enumerate(E):
    extra = [(-3.9, 2.6)] if k == 1 else None
    enter(a, W1_via[k], W1[k], t_end=t(8.8 - 0.0 * k), facing=0, label=lab(a), extra=extra,
          t_off=t(W1_toff[k]))
# 27.9 the rival named: the arc turns to look up at the gallery
for k, a in enumerate(E):
    stand(a, t(28.6 + 0.15 * k), facing=face(W1[k], (0.6, -3.6)))
# W2 41.3/45.3: two rows across the turntable, a fan towards the top centre of the gallery
# (REVIEW: Jefferson appears top centre and comes down the stage-left stair - PLSN/BroadwayBox: the
#  Washington/Jefferson rolling staircase parks at the SL balcony)
W2 = [(-2.6, 0.0), (-1.2, -0.3), (0.2, -0.5), (1.6, -0.6), (3.0, -0.5),
      (-1.9, 1.5), (-0.5, 1.3), (0.9, 1.2), (2.3, 1.2), (3.7, 1.4)]
m2 = form(E, W2, t_end=t(45.3), facing=lambda p: face(p, (0.6, -3.35)))
for k, a in enumerate(E):
    stand(a, t(58.4 + 0.1 * k), facing=face(m2[a], (0.6, -3.35)))   # Jefferson appears up top
# W3 60.8: they drop to scrub the floor as he strides down - scattered, low, turned to his path
# (an aisle is left from the SL stair foot (2.2,-2.45) down through (2.0,0.4) and (0.6,2.8) to DSC)
W3 = [(-3.0, -0.6), (-1.6, -0.1), (-0.2, -0.8), (1.0, -0.9), (3.1, -0.9),
      (-2.3, 1.1), (-0.8, 1.7), (0.6, 1.0), (2.4, 2.0), (3.6, 0.6)]
m3 = form(E, W3, t_end=t(63.5), stagger=0.2, facing=lambda p: face(p, (1.6, 1.2)))
for k, a in enumerate(E):
    stand(a, t(76.0 + 0.2 * k), facing=face(m3[a], (0.0, 4.2)))       # they watch him sing DSC
# W4 97.0: the party picture - a V behind Jefferson DSC
W4 = [(-3.8, 0.7), (-3.0, 1.4), (-2.1, 2.2), (-1.2, 3.0), (-0.7, 1.7),
      (0.7, 1.7), (1.2, 3.0), (2.1, 2.2), (3.0, 1.4), (3.8, 0.7)]
m4 = form(E, W4, t_end=t(97.0))
for k, a in enumerate(E):
    stand(a, t(109.5 + 0.1 * k), facing=face(m4[a], (1.4, 3.6)))       # the Paris aside
# W5 118.2 the letter: the company pulls back to an upstage arc; Sally (ens6) brings the letter
W5 = [ring(3.2, -100 + 200 * k / 9) for k in range(10)]
go('ens6', [(0.95, 3.0)], t_end=t(119.5), facing=face((0.95, 3.0), (0.0, 3.6)))
others = [a for a in E if a != 'ens6']
m5 = form(others, W5, t_end=t(120.5), facing=lambda p: face(p, (0.0, 3.6)))
left = [p for p in W5 if p not in m5.values()][0]
go('ens6', [left], t_start=t(126.5), facing=face(left, (0.0, 3.6)))
# 135.3 the journey north: the arc walks the outer ring an eighth of a turn (12 -> 3 -> 6 way)
for k, a in enumerate(E):
    th1 = theta_of(cur(a)) + 45
    revolve_by(a, 3.2, 45, t(135.6), t(152.5), facing=face(ring(3.2, th1), (0, 0.95)))
# 163.5 Madison's verse: the ring turns in to the two of them
for k, a in enumerate(E):
    stand(a, t(164.0 + 0.1 * k), facing=face(cur(a), (0.0, 3.9)))
# 187.5 hook 2: back to the V
m4b = form(E, W4, t_end=t(187.5))
# 208.3 Hamilton named, DL: the company turns on him
for k, a in enumerate(E):
    stand(a, t(209.0 + 0.1 * k), facing=face(m4b[a], (3.5, 3.4)))
# 221.2 final build: one line across the deck
W8 = [(-3.6 + 0.8 * k, 1.9) for k in range(10)]
m8 = form(E, W8, t_end=t(222.0))

# Jefferson: appears TOP CENTRE on the upstage gallery (REVIEW: the Washington/Jefferson rolling staircase
# is parked at the SL balcony and rolled centre for this entrance - PLSN, BroadwayBox/Korins; the page has no
# rolling stair, so he takes the fixed SL stair, the parked unit's place), strides along the gallery, down the
# SL stair and through an aisle in the scrubbing company to DSC
J = 'lafayette'
add(J, t(53.0), *GUC[0][:2], 'g', off=True, label='Jefferson')
go(J, [(0.6, -3.35, 'g')], t_end=t(57.9), facing=0)
go(J, [(4.75, -3.3, 'g'), (4.75, -2.6, 'g'), (4.5, -2.45, 'g'), (2.2, -2.45)], t_start=t(60.8), speed=1.7)
last(J)['dwell'] = 0
go(J, [(2.0, 0.4), (0.6, 2.8), (0.0, 4.2)], t_end=t(73.0), facing=0, hold=False, speed=1.7)
# SPOT: verse 1 kept inside the DSC warm key (727, ch93 at (0, 4.45) r1.04)
go(J, [(0.9, 4.0)], t_end=t(80.0), facing=-15)
go(J, [(-0.8, 3.85)], t_end=t(87.0), facing=15)
go(J, [(0.0, 4.1)], t_end=t(95.0), facing=0)
go(J, [(1.4, 3.6)], t_start=t(108.4), facing=-30)
go(J, [(0.0, 3.6)], t_end=t(118.8), facing=40)
stand(J, t(129.8), facing=0)
go(J, [(-1.3, 2.4), (-0.8, 0.9), (0.9, 1.2), (0.5, 2.4)], t_start=t(135.5), t_end=t(150.0), facing=-60)
go(J, [(0.6, 3.85)], t_end=t(160.0), facing=-100)   # SPOT: 734 the DSC key (93) on the two of them
stand(J, t(172.0), facing=-60)
go(J, [(0.0, 4.1)], t_end=t(188.5), facing=0)
go(J, [(0.0, 4.5)], t_end=t(199.0), facing=0)
stand(J, t(209.3), facing=55)
go(J, [(0.3, 4.1)], t_end=t(222.0), facing=-20)
stand(J, t(233.0), facing=0)

# Madison: arrives DR on the hit, flustered (mirrored from the reconstruction's DL - see notes)
M = 'mulligan'
enter(M, 'W-DSR', (-3.5, 3.4), t_end=t(153.9), facing=60, label='Madison')
go(M, [(-0.6, 3.95)], t_end=t(163.5), facing=70)    # SPOT: his verse in the DSC key (734, ch93)
go(M, [(-0.75, 3.85)], t_end=t(176.0), facing=60)
go(M, [(-1.6, 3.9)], t_end=t(189.0), facing=20)
go(M, [(-2.0, 3.6)], t_end=t(200.0), facing=40)
stand(M, t(209.5), facing=80)
go(M, [(-1.6, 3.9)], t_end=t(222.0), facing=20)

# Hamilton: named by the company, appears DL (mirrored, see notes)
H = 'hamilton'
enter(H, 'W-DSL', (3.5, 3.4), t_end=t(208.3), facing=-50, label='Hamilton')
go(H, [(3.0, 3.0)], t_end=t(222.5), facing=-60)

# Washington comes on with Hamilton for the welcome (REVIEW: Jefferson reaches for Washington's hand and
# Hamilton takes it - ironinkpen staging notes), then steps to the DSC mic in the snap for the cabinet meeting
WA = 'washington'
enter(WA, 'W-DSL', (2.2, 3.7), t_end=t(210.8), facing=face((2.2, 3.7), (0.0, 4.5)), label='Washington')
stand(WA, t(222.6), facing=face((2.2, 3.7), (0.3, 4.1)))
go(WA, [(0.0, 4.4)], t_start=t(234.3), t_end=T('2-02', 0.5), facing=0)

# ======================================================================= 2-02 CABINET BATTLE #1
c = lambda at: T('2-02', at)
# the snap (2-01 234.2): the line of the company sits in the V of chairs on the deck
# (REVIEW: "two rows of chairs form a V opening toward the audience", ensemble seated in them, Washington
#  seated with them - ironinkpen staging notes; cue 742 puts Washington's chair SL. Jefferson's side SR,
#  Hamilton's side SL per Jack's revision-5 ruling. The chairs themselves are not modelled.)
V_SR = [(-3.8, 2.4), (-3.1, 1.45), (-2.4, 0.5), (-1.7, -0.45), (-1.0, -1.4)]          # downstage-out -> vertex
V_SL = [(1.7, -0.45), (2.4, 0.5), (3.1, 1.45), (3.8, 2.4), (4.5, 3.35)]               # vertex -> downstage-out
WA_CHAIR = (1.0, -1.4)                                                               # SL arm, at the vertex
byx = sorted(E, key=lambda a: m8[a][0])
seat = {a: (V_SR + V_SL)[i] for i, a in enumerate(byx)}
look = (0.0, 3.2)
for k, a in enumerate(byx):
    go(a, [seat[a]], t_start=T('2-01', 234.3 + 0.15 * k), facing=face(seat[a], look))
# the crowd reacts: they turn to whoever has the floor
for k, a in enumerate(E):
    d = seat[a]
    stand(a, c(22.5 + 0.1 * k), facing=face(d, (-1.3, 3.7)))
    stand(a, c(86.5 + 0.1 * k), facing=face(d, (1.3, 3.7)))
    stand(a, c(147.5 + 0.1 * k), facing=face(d, (0.0, 1.4)))
# 156.5 the meeting breaks up: the crowd goes, the SR arm first (the Virginians leave that way after them)
exit_plan = {V_SR[0]: ('W-DSR', None), V_SR[1]: ('W-DSR', [(-3.9, 2.6)]), V_SR[2]: ('W-DSR', [(-3.9, 2.6)]),
             V_SR[3]: ('D-UC', None), V_SR[4]: ('D-UC', None),
             V_SL[0]: ('D-UC', None), V_SL[1]: ('W-MSL', None), V_SL[2]: ('W-MSL', None),
             V_SL[3]: ('W-DSL', None), V_SL[4]: ('W-DSL', None)}
exit_order = [V_SR[0], V_SR[1], V_SR[2], V_SL[4], V_SL[3], V_SR[4], V_SL[2], V_SR[3], V_SL[1], V_SL[0]]
for a in E:
    via, extra = exit_plan[seat[a]]
    ts = c(157.5) + 1.1 * exit_order.index(seat[a])
    leave(a, via, t_start=ts, extra=extra)

# Washington: the MC at the DSC mic, then his chair at the vertex of the SL arm (cue 742: chair SL)
go(WA, [(0.4, 1.0), WA_CHAIR], t_start=c(9.0), facing=face(WA_CHAIR, look))
go(WA, [(0.3, 0.4)], t_end=c(79.5), facing=0)          # thanks Jefferson, hands over
go(WA, [WA_CHAIR], t_start=c(82.0), facing=face(WA_CHAIR, look))
go(WA, [(0.0, 1.4)], t_end=c(148.0), facing=0)         # stops it, stands
# SPOT: 761-763 Washington's pool (the dump's ch8 at (0.8, 2.2), Hamilton's ch92 at (-1.2, 2.4); mirrored with the
# ruling they land on Washington at (-0.8, 2.2) and Hamilton at (1.2, 2.4); this spot is in both versions)
go(WA, [(-0.8, 2.6)], t_end=c(176.5), facing=68)       # the private reprimand
go(WA, [(-0.65, 2.4)], t_end=c(196.0), facing=60)
stand(WA, c(208.4), facing=60)
leave(WA, 'D-UC', t_start=c(211.2), speed=1.6)

# Jefferson (SR) and Hamilton (SL) - see notes for the side question
go(J, [(-1.6, 3.0)], t_start=T('2-01', 234.2), facing=45)
go(J, [(-1.3, 3.7)], t_end=c(13.0), facing=75)
stand(J, c(22.2), facing=15)
go(J, [(-0.2, 1.2)], t_start=c(35.6), facing=0)        # works the room, crosses to C
stand(J, c(45.4), facing=face((-0.2, 1.2), (0.8, 3.3)))
go(J, [(-1.8, 2.9)], t_end=c(53.0), facing=30)        # SPOT: near his key (747, mirrored ch94)
go(J, [(-0.6, 2.9)], t_end=c(60.0), facing=0)
go(J, [(-2.4, 3.4)], t_end=c(68.0), facing=-40)        # rallies his side of the room
go(J, [(-1.3, 3.7)], t_end=c(76.5), facing=0)          # mic drop
stand(J, c(80.0), facing=75)
stand(J, c(109.0), facing=60)
go(J, [(-1.7, 3.3)], t_end=c(131.0), facing=70)        # Hamilton comes at them
go(J, [(-1.5, 3.4)], t_end=c(148.0), facing=30)
# SPOT: 760's lavender pool on their way out (the dump's ch94 at (3.0, 3.6) DL, mirrored to DR by the ruling)
go(J, [(0.2, 2.5), (-1.2, 2.2), (-2.8, 3.3)], t_start=c(156.5), t_end=c(164.5), facing=60)
leave(J, 'W-DSR', t_start=c(170.5))

go(M, [(-2.6, 2.6)], t_start=T('2-01', 234.3), t_end=T('2-01', 235.6), facing=45)
go(M, [(-2.1, 3.3)], t_end=c(34.5), facing=25)         # the shared shout
go(M, [(-2.6, 2.6)], t_end=c(41.0), facing=60)
go(M, [(-2.4, 2.9)], t_end=c(70.0), facing=45)
go(M, [(-3.0, 2.2)], t_end=c(131.0), facing=60)
go(M, [(-2.6, 2.6)], t_end=c(149.0), facing=40)
go(M, [(-0.6, 1.7), (-2.2, 2.4), (-3.4, 3.0)], t_start=c(156.5), t_end=c(163.0), facing=70)
leave(M, 'W-DSR', t_start=c(167.3))

go(H, [(2.4, 2.0), (1.3, 3.7)], t_start=c(4.0), t_end=c(13.0), facing=-75)
stand(H, c(22.4), facing=-60)
go(H, [(0.8, 3.3)], t_end=c(45.5), facing=face((0.8, 3.3), (-0.2, 1.2)))   # the interjection
go(H, [(1.4, 3.6)], t_end=c(49.5), facing=-60)
go(H, [(1.3, 3.7)], t_end=c(80.0), facing=-45)
stand(H, c(86.0), facing=0)
go(H, [(0.4, 3.0)], t_end=c(100.0), facing=0)          # the plan
go(H, [(1.6, 3.1)], t_end=c(106.0), facing=-20)       # SPOT: in his key (752, mirrored ch92)
go(H, [(0.2, 3.2)], t_end=c(109.5), facing=-70)        # the slavery charge, at Jefferson
go(H, [(-0.4, 3.5)], t_end=c(120.0), facing=-80)       # personal
go(H, [(0.6, 4.2)], t_end=c(127.0), facing=0)          # the war memory, to the house
go(H, [(-0.7, 2.8)], t_end=c(131.0), facing=-75)       # at Jefferson and Madison
go(H, [(0.4, 3.4)], t_end=c(138.0), facing=-30)
go(H, [(1.3, 3.7)], t_end=c(144.6), facing=0)          # mic drop
go(H, [(1.0, 3.4)], t_end=c(148.5), facing=-45)
stand(H, c(160.0), facing=-90)                          # the Virginians taunt him on their way out
go(H, [(0.7, 3.2)], t_end=c(176.5), facing=-50)
stand(H, c(196.0), facing=-40)
stand(H, c(212.0), facing=0)                            # alone

# ======================================================================= 2-03 TAKE A BREAK
b = lambda at: T('2-03', at)
EL, AN, PH = 'eliza', 'angelica', 'laurens'
PIANO_P, PIANO_E = (1.0, 1.5), (2.2, 1.1)
# (REVIEW: Eliza and Philip at the piano "on the moving platform, which spins slowly" - ironinkpen staging
#  notes; the piano group rides the inner turntable 40 degrees into its place SL of centre)
def _rot(p, d):
    th = theta_of(p); r_ = dist(p, (0.0, 0.95)); return ring(r_, th + d)
enter(EL, 'W-MSL', _rot(PIANO_E, -40), t_end=b(0.0), facing=-40, label='Eliza')
enter(PH, 'W-MSL', _rot(PIANO_P, -40), t_end=T('2-02', 213.0), facing=0, label='Philip')
revolve_by(EL, dist(PIANO_E, (0.0, 0.95)), 40, b(0.5), b(18.0), step=20, facing=-40)
revolve_by(PH, dist(PIANO_P, (0.0, 0.95)), 40, b(0.5), b(18.0), step=20, facing=-10)
DESK = (-1.5, 1.4)
go(H, [DESK], t_end=b(19.5), facing=0)                  # to the desk, writing to Angelica
# SPOT: her gallery key (766/774/775/776, ch18) crosses the USG at x 0 and head height near z -3.4
enter(AN, 'G-UC', (0.0, -3.45, 'g'), t_end=b(45.2), facing=0, label='Angelica')
go(AN, [(-0.9, -3.65, 'g')], t_start=b(58.6), facing=0)  # she fades back
go(EL, [(1.6, 2.4)], t_end=b(60.0), facing=-60)          # calls him down
go(H, [(-0.6, 2.6)], t_end=b(70.0), facing=40)
go(EL, [(1.1, 2.8)], t_end=b(70.5), facing=-30)
go(PH, [(0.0, 4.4)], t_end=b(78.5), facing=0)            # Philip's poem, DSC
go(PH, [(-1.0, 4.2)], t_end=b(85.0), facing=15)
go(PH, [(0.9, 4.3)], t_end=b(92.0), facing=-15)
go(PH, [(0.0, 4.5)], t_end=b(99.0), facing=0)
go(H, [(-1.1, 2.8)], t_end=b(80.0), facing=20)
go(EL, [(1.1, 2.8)], t_end=b(80.5), facing=-20)
go(PH, [(2.2, 3.8), PIANO_P], t_start=b(103.0), facing=-20)   # back to the piano, round them
go(EL, [(0.6, 3.3)], t_end=b(106.0), facing=-50)         # the duet
go(H, [(-0.45, 3.15)], t_end=b(106.0), facing=50)        # SPOT: inside the duet pool (772, ch8)
go(EL, [(0.4, 2.6)], t_end=b(118.0), facing=-40)         # the lake upstate
go(H, [(-0.4, 3.1)], t_end=b(118.0), facing=40)
go(H, [DESK], t_end=b(129.0), facing=0)                  # Angelica's second letter
go(EL, [(1.9, 2.2), PIANO_E], t_end=b(130.0), facing=-40)
go(AN, [(0.0, -3.45, 'g')], t_end=b(128.0), facing=0)
stand(AN, b(152.0), facing=0)                            # the comma, in her key
# she is coming: along the gallery, down the SL stair, across to the family
go(AN, [(4.75, -3.3, 'g'), (4.75, -2.6, 'g'), (4.5, -2.45, 'g'), (2.2, -2.45)], t_start=b(164.0))
last(AN)['dwell'] = 0
go(AN, [(3.1, -0.4)], t_end=b(177.5), facing=-40, hold=False)
go(AN, [(3.1, 1.8), (2.3, 2.6)], t_start=b(181.1), facing=-70)
go(EL, [(1.6, 2.5)], t_start=b(184.0), t_end=b(187.5), facing=70)    # the sisters meet
stand(PH, b(189.5), facing=40)
stand(H, b(189.5), facing=60)
go(H, [(-2.6, 3.0)], t_end=b(218.0), facing=40)          # he stays behind - his DR pool
go(EL, [(1.4, 3.1)], t_end=b(226.0), facing=-60)         # the trio
go(AN, [(2.3, 2.6)], t_end=b(226.5), facing=-60)
go(PH, [(2.0, 1.6)], t_end=b(227.0), facing=-50)
go(EL, [(0.8, 3.4)], t_end=b(257.0), facing=0)           # the Schuyler motif
go(AN, [(1.6, 3.4)], t_end=b(257.0), facing=0)
leave(EL, 'W-MSL', t_start=b(266.3), extra=[(3.0, 1.6)])
leave(AN, 'W-MSL', t_start=b(268.6), extra=[(3.6, 2.2)])
leave(PH, 'W-MSL', t_start=b(266.6))
go(H, [DESK], t_end=b(271.0), facing=0)                  # alone at the desk into the dark

# ======================================================================= 2-04 SAY NO TO THIS
s = lambda at: T('2-04', at)
MR = 'peggy'
enter('burr', 'W-DSR', (-3.4, 1.2), t_end=s(0.5), facing=35, label='Burr', extra=[(-3.9, 2.4)])
stand('burr', s(15.0), facing=60)
leave('burr', 'W-DSR', t_start=s(22.0), extra=[(-3.9, 2.4)])
# SPOT: Maria's face key is ch13 throughout (preset 732 'Woman SL' (3.5, 0.24); 790-818 at (2.7, 0.8)/(3.1, 1.0);
# 820 at (0.93, 1.66)); her door is SL, Hamilton's pool ch93 at (0.42, 1.96) / (1.66, 1.75)
enter(MR, 'W-MSL', (3.1, 0.8), t_end=s(16.0), facing=-80, label='Maria Reynolds')
go(H, [(-1.4, 2.3)], t_end=s(21.5), facing=0)            # steps DS of the desk to tell it
stand(H, s(33.5), facing=60)
go(H, [(0.8, 1.9)], t_end=s(45.0), facing=60)
go(MR, [(1.6, 1.2)], t_start=s(44.8), t_end=s(47.5), facing=face((1.6, 1.2), (0.8, 1.9)))
# the walk to her door: she leads him round the turntable
go(MR, [(1.0, 0.0), (2.0, -0.6), (2.8, 0.7)], t_start=s(59.1), t_end=s(70.0), facing=face((2.8, 0.7), (0.8, 1.5)))
go(H, [(0.4, 0.6), (1.3, -0.2), (0.8, 1.5)], t_start=s(60.3), t_end=s(71.5), facing=face((0.8, 1.5), (2.8, 0.7)))
go(H, [(0.3, 2.4)], t_start=s(81.0), facing=0)           # the first chorus: he tries to leave
go(MR, [(1.7, 1.3)], t_end=s(88.0), facing=-70)
go(H, [(1.1, 1.65)], t_end=s(101.5), facing=70)
go(MR, [(1.65, 1.35)], t_end=s(102.5), facing=-70)         # the kiss, between her key and his pool
go(H, [(0.6, 2.6)], t_start=s(106.8), facing=0)          # the hits
go(H, [(0.3, 1.7)], t_end=s(114.0), facing=-120)
go(MR, [(2.7, 0.8)], t_end=s(116.0), facing=-60)         # back to her door
go(H, [(-0.7, 2.2)], t_end=s(124.0), facing=60)          # SPOT: home, DS of his desk (804, ch93 at (-0.83, 2.16))
go(MR, [(3.1, 0.6)], t_start=s(130.0), facing=-60)       # she withdraws as Reynolds' letter comes
go(H, [(-1.15, 2.65)], t_end=s(133.5), facing=-55)
# SPOT: Reynolds' letter (806-810): preset 769 'DL Ham/James' puts four of its five units DR (ch92/93/97/98 at
# x -2.5 .. -4.1, z 3.9 .. 4.6; only ch21 is DL), and the cue lights 97/98 DR - so James comes on DR, to Hamilton
enter('ens4', 'W-DSR', (-2.7, 3.8), t_end=s(131.0), facing=125, label='James Reynolds', t_off=s(125.0))
go('ens4', [(-2.3, 3.6)], t_end=s(144.0), facing=120)    # names his price
leave('ens4', 'W-DSR', t_start=s(154.0))
go(H, [(1.8, 1.5)], t_start=s(153.6), speed=1.9, facing=65)   # races to her door (812, ch93 at (1.66, 1.75))
go(H, [(2.1, 1.35)], t_end=s(166.0), facing=75)
go(MR, [(3.0, 0.95)], t_end=s(166.0), facing=-95)
go(H, [(1.55, 1.85)], t_end=s(173.5), facing=0)          # trapped (816, the tight ch93)
go(MR, [(2.5, 1.2)], t_end=s(177.0), facing=-75)         # her offer
go(MR, [(1.6, 0.9), (0.95, 1.6)], t_start=s(180.0), t_end=s(182.6), facing=-60)   # chorus 2: her key moves to (0.93, 1.66)
go(H, [(0.2, 2.6)], t_end=s(186.0), facing=-20)
go(H, [(0.3, 2.3)], t_end=s(205.0), facing=-100)         # gives in
go(H, [(0.8, 3.0)], t_end=s(209.0), facing=0)            # answering the hits
go(H, [(0.2, 2.3)], t_end=s(214.0), facing=-110)
leave(MR, 'W-MSL', t_start=s(222.0), extra=[(1.6, 0.6)])
go(H, [(0.0, 4.4)], t_end=s(229.0), facing=0)            # to the house, alone
leave(H, 'W-DSR', t_start=s(236.2))

# the company in the two choruses: UP ON THE GALLERIES, shouting down at him
# (REVIEW: "the ensemble stands on the second floor and shouts down at Hamilton", also after the kiss -
#  ironinkpen staging notes; the writer's revolving deck ring is replaced)
SN_POS = {  # body: (gallery route, destination); entry order = list order (farthest first)
    'ens2': ('srarm', (-6.15, 2.0, 'g')), 'ens8': ('srarm', (-6.15, 0.6, 'g')),
    'ens7': ('slg', (4.9, 1.8, 'g')), 'ens5': ('slg', (4.9, 0.0, 'g')),
    'ens1': ('usg', (-3.4, -3.35, 'g')), 'ens10': ('usg', (3.4, -3.35, 'g')),
    'ens3': ('usg', (-2.0, -3.35, 'g')), 'ens9': ('usg', (2.0, -3.35, 'g')),
    'ens6': ('usg', (-0.6, -3.35, 'g'))}
SN_ROUTE = {'srarm': [(-4.5, -3.3, 'g'), (-4.5, -0.7, 'g'), (-6.15, -0.7, 'g')],
            'slg': [(4.75, -3.3, 'g'), (4.9, -2.6, 'g')], 'usg': []}
def sn_on(t_first, look_at, label=False):
    for k, (a, (route, dst)) in enumerate(SN_POS.items()):
        add(a, t_first + 0.9 * k, *GUC[0][:2], 'g', off=True, label=lab(a) if label else None)
        go(a, [GUC[1]] + SN_ROUTE[route] + [dst], t_start=t_first + 0.9 * k, speed=1.6,
           facing=face(dst, look_at), hold=False)
def sn_off(t_first):
    for k, (a, (route, dst)) in enumerate(reversed(list(SN_POS.items()))):
        leave(a, 'G-UC', t_start=t_first + 0.7 * k, extra=list(reversed(SN_ROUTE[route])), speed=1.6)
sn_on(s(72.5), (0.2, 1.4), label=True)
for k, a in enumerate(SN_POS):
    stand(a, s(104.3 + 0.1 * k), facing=face(SN_POS[a][1], (0.4, 1.5)))     # the kiss: they turn on him
sn_off(s(119.2))
sn_on(s(173.5), (0.3, 2.3))
for k, a in enumerate(SN_POS):
    stand(a, s(208.2 + 0.1 * k), facing=face(SN_POS[a][1], (0.8, 3.0)))     # the answering hits
sn_off(s(220.5))

# ======================================================================= 2-05 THE ROOM WHERE IT HAPPENS
r = lambda at: T('2-05', at)
TABLE = (0.0, 0.2)
H_T, J_T, M_T = (0.0, -0.65), (0.85, 0.3), (-0.85, 0.3)
B = 'burr'
# Burr and Hamilton walk on together from SR, talking
go(H, [(-6.0, 4.65), (-2.2, 3.3)], t_end=r(4.6), facing=face((-2.2, 3.3), (-3.0, 3.8)), hold=False)
go(B, [(-6.0, 4.65), (-3.0, 3.8)], t_end=r(5.4), facing=face((-3.0, 3.8), (-2.2, 3.3)), hold=False)
go(H, [(-0.8, 3.0)], t_end=r(14.0), facing=face((-0.8, 3.0), (-1.6, 3.7)))
go(B, [(-1.6, 3.7)], t_end=r(14.5), facing=face((-1.6, 3.7), (-0.8, 3.0)))
go(H, [(0.8, 2.9)], t_end=r(24.0), facing=face((0.8, 2.9), (0.0, 3.5)))
go(B, [(0.0, 3.5)], t_end=r(24.5), facing=face((0.0, 3.5), (0.8, 2.9)))
go(H, [(2.0, 3.2)], t_end=r(33.0), facing=face((2.0, 3.2), (1.2, 3.8)))
go(B, [(1.2, 3.8)], t_end=r(33.5), facing=face((1.2, 3.8), (2.0, 3.2)))
go(H, [(1.4, 2.5)], t_end=r(40.0), facing=face((1.4, 2.5), (0.4, 3.9)))
go(B, [(0.4, 3.9)], t_end=r(41.0), facing=face((0.4, 3.9), (1.4, 2.5)))
go(H, [(1.9, 0.9), (1.1, -0.9), H_T], t_start=r(44.5), facing=0)      # off to the dinner
go(B, [(0.0, 3.9)], t_end=r(46.0), facing=0)                           # alone, DS
enter(J, 'D-UC', J_T, t_end=r(47.0), facing=face(J_T, H_T), label='Jefferson', t_off=r(40.0))
enter(M, 'D-UC', [(-0.9, -1.5), M_T], t_end=r(48.5), facing=face(M_T, H_T), label='Madison', t_off=r(41.5))
# Burr through the number
go(B, [(0.0, 4.9)], t_end=r(72.5), facing=0)            # chorus 1: the lines cross upstage of him
go(B, [(-2.6, 4.2)], t_end=r(99.0), facing=45)          # watches Jefferson's account
go(B, [(0.0, 4.9)], t_end=r(119.0), facing=0)           # chorus 2
go(B, [(0.8, 4.0)], t_end=r(134.0), facing=face((0.8, 4.0), TABLE))   # peers in at the chess game
go(B, [(1.5, 4.1)], t_end=r(145.0), facing=-60)
go(B, [(0.0, 4.4)], t_end=r(157.0), facing=0)
stand(B, r(166.0), facing=180)                           # the trade - turned to the table
go(B, [(0.0, 4.9)], t_end=r(177.5), facing=0)           # chorus 3
go(B, [(0.0, 4.1)], t_end=r(194.0), facing=0)           # click-boom
stand(B, r(196.5), facing=180)                           # to the table
go(B, [(-2.3, 3.5)], t_end=r(201.0), facing=face((-2.3, 3.5), (-3.2, 2.9)))   # Burr / Ham DR
stand(B, r(221.0), facing=-90)
go(B, [(0.0, 2.4)], t_start=r(243.6), facing=0)         # Burr MC, the music slows
go(B, [(-0.8, 2.9)], t_end=r(262.0), facing=15)
go(B, [(0.8, 2.9)], t_end=r(267.0), facing=-15)
go(B, [(0.0, 4.3)], t_end=r(272.5), facing=0)           # Burr DS
go(B, [TABLE], t_end=r(277.9), facing=0)                # up on the table (deck level here)
go(B, [(0.0, 1.2)], t_start=r(294.6), t_end=r(295.2), facing=0, speed=1.8)   # jumps off
go(B, [(0.0, 2.75)], t_end=r(296.1), facing=0)         # SPOT: into 888.01's ch13 at DSC (preset 24) while it holds
go(B, [(-0.6, 2.4)], t_end=r(300.0), facing=10)
go(B, [(0.6, 2.6)], t_end=r(305.0), facing=-10)
go(B, [(0.0, 3.0)], t_end=r(310.0), facing=0)
go(B, [(0.0, 4.3)], t_end=r(314.2), facing=0)           # the final click-boom (SPOT: preset 770 'Burr DSC', ch93 at (0, 4.82))
add(B, r(314.6), 0.0, 4.3, facing=0, dwell=0.55)
go(B, [(-6.0, 4.65), WINGS['W-DSR']], t_end=r(317.5), last_off=True, hold=False)

# Jefferson and Madison at the table, their asides DSL / DSR, the dinner
go(J, [(3.0, 3.7)], t_end=r(99.5), facing=-20)          # Jefferson's account DSL
go(J, [J_T], t_end=r(118.0), facing=face(J_T, H_T))     # the dinner he set
go(M, [(-1.5, 1.7), (-3.0, 3.7)], t_start=r(142.0), t_end=r(146.0), facing=20)   # Madison weighs it DSR
go(J, [(0.0, 2.4), (-0.2, 3.3), (-2.2, 3.4)], t_start=r(147.0), t_end=r(151.0), facing=face((-2.2, 3.4), (-3.0, 3.7)))
go(M, [(-1.5, 1.7), M_T], t_start=r(153.0), t_end=r(157.0), facing=face(M_T, H_T))
go(J, [(-0.2, 3.3), (0.0, 2.4), J_T], t_start=r(153.4), t_end=r(158.0), facing=face(J_T, H_T))
stand(J, r(166.0), facing=-90)                           # the trade struck
stand(M, r(166.2), facing=90)
go(H, [(-0.1, 1.3), (-3.2, 2.9)], t_start=r(197.4), t_end=r(201.0), facing=face((-3.2, 2.9), (-2.3, 3.5)))
stand(H, r(221.0), facing=60)
stand(J, r(200.0), facing=-120)
stand(M, r(200.2), facing=-150)
# REVIEW: 874 "Lose DR" - Hamilton walks back into the room (the table) and leaves Burr outside it. The THPP
# renders keep three bodies at the table through 876, 876.1 and 882 (dark after 878 "Lose table") and none at
# 884; the staging notes say Hamilton, Jefferson and Madison leave together and Burr is left with the company.
# So the three stay at the table through Burr's build and go upstage on 882 "Burr DS", before 884.
go(H, [(-1.8, 2.0), (-1.6, 0.4), (-0.9, -0.8), H_T], t_start=r(242.5), facing=0)
stand(J, r(247.0), facing=face(J_T, H_T))
stand(M, r(247.2), facing=face(M_T, H_T))
leave(H, 'D-UC', t_start=r(271.6), extra=[(0.4, -2.0)])
leave(J, 'D-UC', t_start=r(272.4), extra=[(1.25, -1.2)])
leave(M, 'D-UC', t_start=r(273.4), extra=[(-0.2, -1.0), (0.6, -2.6)])

# the company
# R1 50.06: a line downstage with Burr; four upstage flanking the table
R1 = {'ens1': (-4.2, 3.8), 'ens3': (-2.8, 3.8), 'ens5': (-1.4, 3.8), 'ens7': (1.4, 3.8), 'ens9': (2.8, 3.8),
      'ens10': (4.2, 3.8), 'ens2': (-2.6, -1.2), 'ens4': (-1.6, -2.0), 'ens6': (1.6, -2.0), 'ens8': (2.6, -1.2)}
R1via = {'ens1': 'W-DSR', 'ens3': 'W-DSR', 'ens5': 'W-DSR', 'ens7': 'W-DSL', 'ens9': 'W-DSL', 'ens10': 'W-DSL',
         'ens2': 'D-UC', 'ens4': 'D-UC', 'ens6': 'D-UC', 'ens8': 'D-UC'}
R1t = {'ens1': 49.6, 'ens3': 50.0, 'ens5': 50.4, 'ens7': 50.4, 'ens9': 50.0, 'ens10': 49.6,
       'ens2': 46.0, 'ens4': 47.5, 'ens6': 49.0, 'ens8': 50.5}
for k, a in enumerate(E):
    enter(a, R1via[a], R1[a], t_end=r(R1t[a]), facing=0, label=lab(a))
# chorus 1 (71.9): "Ensemble X" - two diagonal lines, one SR one SL, that cross through each other
A = ['ens2', 'ens5', 'ens3']
Bl = ['ens8', 'ens7', 'ens9']
FL = ['ens4', 'ens6']
CO = ['ens1', 'ens10']
A0 = [(-2.4, 1.3), (-3.1, 2.4), (-3.8, 3.5)]
B0 = [(2.7, 1.85), (3.4, 2.95), (4.1, 4.05)]
FL0 = [(-1.0, -2.2), (1.0, -2.2)]
CO0 = [(-4.8, 4.6), (4.8, 4.6)]
def lines(t_set, t_a, t_b, a_starts_sr, fl=True):
    for i, a in enumerate(A):
        p = A0[i] if a_starts_sr else (-A0[i][0], A0[i][1])
        go(a, [p], t_end=t_set + 0.15 * i, facing=0)
        go(a, [(-p[0], p[1])], t_start=t_a + 0.2 * i, t_end=t_a + 6.0 + 0.2 * i, facing=0)
    for i, a in enumerate(Bl):
        p = B0[i] if a_starts_sr else (-B0[i][0], B0[i][1])
        go(a, [p], t_end=t_set + 0.15 * i, facing=0)
        go(a, [(-p[0], p[1])], t_start=t_b + 0.2 * i, t_end=t_b + 6.0 + 0.2 * i, facing=0)
    if fl:
        for i, a in enumerate(FL):
            go(a, [FL0[i]], t_end=t_set + 0.3 * i, facing=0)
        for i, a in enumerate(CO):
            go(a, [CO0[i]], t_end=t_set + 0.3 * i, facing=0)
lines(r(71.9), r(76.0), r(79.0), True)
# 97: Jefferson's account - the lines drift up to an arc on the outer ring and hold, watching him DSL
ARC_A = [ring(3.2, th) for th in (45, 70, 95)]      # A ended SL
ARC_B = [ring(3.2, -th) for th in (45, 70, 95)]     # B ended SR
for i, a in enumerate(A):
    go(a, [ARC_A[i]], t_end=r(100.0 + 0.2 * i), facing=face(ARC_A[i], (3.0, 3.7)))
for i, a in enumerate(Bl):
    go(a, [ARC_B[i]], t_end=r(100.0 + 0.2 * i), facing=face(ARC_B[i], (3.0, 3.7)))
# chorus 2 (118.4): the lines again, from the other sides
lines(r(118.4), r(120.5), r(122.5), False, fl=False)
# 129.5 the chess game: eight in a ring round the table, two in the DS corners
RING8 = [ring(2.3, 22.5 + 45 * k, 0.0, 0.2) for k in range(8)]
mc = form(E, RING8 + [(-4.0, 3.9), (4.0, 3.9)], t_end=r(130.0),
          facing=lambda p: face(p, TABLE) if p[1] < 3.5 else (30 if p[0] < 0 else -30))
# 165.3 the trade: the ring closes in on the table
RING8b = [ring(1.9, 22.5 + 45 * k, 0.0, 0.2) for k in range(8)]
inring = [a for a in E if mc[a] in RING8]
form(inring, RING8b, t_end=r(166.5), facing=lambda p: face(p, TABLE))
# chorus 3 (176.8): the crossing lines a third time
lines(r(177.6), r(180.0), r(182.5), True)
# 193.8 click-boom / 196.3 to the table / 198.9 Burr-Ham DR: the company to the sides of the room
R6 = [(-3.4, -0.6), (-3.1, 0.5), (-2.9, 1.6), (-1.6, -1.8), (3.4, -0.6), (3.1, 0.5), (2.9, 1.6), (3.4, 2.8),
      (1.6, -1.8), (0.0, -3.0)]
m6 = form(E, R6, t_end=r(194.0), stagger=0.05, facing=lambda p: face(p, TABLE))
for k, a in enumerate(E):
    stand(a, r(200.0 + 0.1 * k), facing=face(m6[a], (-2.7, 3.2)))   # they call his name at Burr
# 256.6 PD: a loose ring round Burr in the build
R7 = [(-3.2, 3.0), (-2.0, 1.4), (-3.0, 0.4), (-2.0, -1.0), (3.0, 0.4), (2.0, 1.4), (3.2, 3.0), (2.6, -1.0),
      (-1.2, -2.2), (2.8, -1.7)]      # (REVIEW: kept clear of the table trio and their way out upstage)
form(E, R7, t_start=r(249.0), stagger=0.2, facing=lambda p: face(p, (0.0, 2.6)))
# 277.9 Art of Bink: two lines fanning out downstage from the table, Burr up on it
srl = [(-1.4, -0.4), (-2.2, 0.2), (-2.9, 0.9), (-3.4, 1.8), (-3.8, 2.8)]
R8 = srl + [(-p[0], p[1]) for p in srl]
m8r = form(E, R8, t_end=r(277.9), stagger=0.05)
# 284.4 the women's line - four step in to a V under the table
WOMT = {srl[1]: (-1.0, 0.9), srl[2]: (-1.7, 1.7), (-srl[1][0], srl[1][1]): (1.0, 0.9), (-srl[2][0], srl[2][1]): (1.7, 1.7)}
for a in E:
    if m8r[a] in WOMT:
        go(a, [WOMT[m8r[a]]], t_end=r(285.0), facing=0)
        go(a, [m8r[a]], t_start=r(291.4), t_end=r(294.0), facing=0)
# 296.9 the dance: a ring of ten on the outer turntable that revolves, Burr inside it
RING10 = [ring(3.2, 18 + 36 * k) for k in range(10)]
form(E, RING10, t_end=r(298.5), stagger=0.05, facing=lambda p: face(p, (0, 0.95)))
for a in E:
    revolve_by(a, 3.2, 72, r(301.0), r(311.0), step=36, facing=0)
# the button, then out in the blackout
for k, a in enumerate(E):
    p = cur(a)
    if p[1] < -0.5:
        via = 'D-UC'
    elif p[0] > 0:
        via = 'W-DSL' if p[1] > 2.0 else 'W-MSL'
    else:
        via = 'W-DSR'
    extra = [(-3.9, 2.6)] if (via == 'W-DSR' and p[1] < 2.2) else None
    leave(a, via, t_start=r(315.0), t_end=r(317.4), extra=extra)

if __name__ == '__main__':
    msgs = checks(verbose=True)
    print(len(msgs), 'messages')
    print({a: len(L) for a, L in W.items()}, sum(len(L) for L in W.values()))

NOTES = (
 "Segment 5 (2-01..2-05). Research, sources and the review: research/seg5.md. Generated by scratchpad seg5gen.py. "
 "2-01 What'd I Miss: Burr recaps DSC and leaves SR; company in an upstage arc, a fan turned to the gallery top centre, "
 "scrubbing low as Jefferson appears TOP CENTRE on the USG and comes down the SL stair (the real rolling staircase parks "
 "at the SL balcony and rolls centre - PLSN, Korins) to DSC; party V, the letter (Sally = ens6), a ring travel for the "
 "journey north, Madison enters DR, Hamilton and Washington appear DL together for the welcome. "
 "SIDES (Jack's revision-5 ruling): Jefferson+Madison STAGE RIGHT, Hamilton STAGE LEFT, Washington with Hamilton's side. "
 "2-02 Cabinet Battle #1: Washington MCs at the DSC mic then sits in a chair at the SL arm of a V of chairs opening to "
 "the house, the ensemble seated in the V (staging notes; chairs not modelled); debaters' pools at x -/+1.3 z 3.7; "
 "Virginians exit DSR; Washington and Hamilton DC; Washington exits through the upstage door. "
 "2-03 Take a Break: desk SR of centre (THPP 'Desk Mid SR'), piano SL of centre riding the inner turntable at the top; "
 "Angelica on the USG, down the SL stair at 164-177; Philip's poem DSC; family exits SL. "
 "2-04 Say No: desk, Burr SR, Maria SL from the THPP cue photos 782/784; her door SL in her key (ch13); James Reynolds (ens4) DR where preset 769 points (spotlight pass); the company on the "
 "galleries (USG, SR arm, SL gallery) for both choruses (staging notes). "
 "2-05 Room: THPP cue photos 864.01-892 (table USC with Jefferson SL / Madison SR / Hamilton upstage of it, Burr+Ham DR "
 "at 872, Hamilton back to the table at 874, the three at the table through 882 then out upstage, Burr at the table at "
 "884, the women's V at 885, Burr DC at 892); the chair choreography is not modelled, the 'Ensemble X' is two "
 "crossing diagonal lines matching the side lines in photos 867/868; Burr stands at deck level where the table is."
)
if __name__ == '__main__':
    import os
    os.makedirs(SP + '/segments', exist_ok=True)
    dump(SP + '/segments/seg5.json', NOTES)
