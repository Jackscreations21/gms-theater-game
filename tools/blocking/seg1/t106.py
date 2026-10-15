# 1-06 Farmer Refuted
from lib import *

def F(at): return S('1-06', at)

BOX = (1.4, 2.4)

def build():
    # REVIEW2: a small crowd -- four of the company round Seabury (was nine); one of them is the herald
    from t105 import CROWD
    crowd_e = list(CROWD)
    # ---- Q175 0.8 Seabury up on his box centre-left; the crowd gathers round him (in the change)
    move('ens2', S('1-05', 183.6), F(0.8), BOX, f=-15, label='Samuel Seabury')
    crowd = [(-0.2, 1.4), (1.5, -0.3), (2.9, 0.6), (3.9, 2.4)]
    m = assign(crowd_e, crowd)
    for e in crowd_e:
        move(e, S('1-05', 184.6), F(2.0), m[e], f=face_to(m[e], BOX))
    # Burr joins the crowd SR (REVIEW 3: he is already on, from the end of The Schuyler Sisters: t105, at (-1.3, 0.5))
    # ---- Q177 15.8 Hamilton interrupts from DSR, his friends at his back
    enter('hamilton', F(12.0), F(15.8), (-3.0, 3.6), 50, wing='W_DSR')
    move('hamilton', F(16.4), F(19.6), (-1.2, 3.15), f=50)   # SPOT: his warm-white key DSR (ch44 at (-1.53, 3.14))
    enter('lafayette', F(13.6), F(18.4), (-3.0, 2.4), 60, wing='W_MSR')
    enter('mulligan', F(14.4), F(18.8), (-3.6, 3.6), 50, wing='W_DSR')
    enter('laurens', F(15.6), F(20.2), (-1.0, 4.4), 45, wing='W_DSR')
    # REVIEW: Burr holds him back at first (fan staging account)
    move('burr', F(16.4), F(19.8), (-2.5, 3.95), f=60)   # SPOT: at his shoulder, outside his key
    turn(crowd_e, F(16.6), lambda a, p: face_to(p, (-0.8, 3.2), 120))
    turn(['ens2'], F(17.2), -60)
    # ---- Q178 27.7 Seabury restores order; Hamilton gives a step
    move('hamilton', F(27.7), F(29.4), (-1.2, 2.9), f=50)
    # REVIEW 3 (the Disney+ clip Oy5ybRNSkb8, its viewers' timestamped comments; the clip runs with the album here):
    # "0:27 Lafayette: go child go / Burr: let him be"; "Lafayette tried to grab Aaron to stop him [stopping Hamilton]".
    # Lafayette steps in at Burr's side and holds him off; at 40 he pushes Hamilton on, as before.
    move('lafayette', F(26.4), F(27.8), (-2.95, 3.3), f=60)
    # Mulligan and Lafayette nudge him toward the box (fan staging account)
    move('lafayette', F(40.0), F(42.4), (-1.8, 2.2), f=60)
    move('mulligan', F(40.4), F(42.8), (-2.2, 3.0), f=60)
    turn(['ens2'], F(28.2), -15)
    turn(crowd_e, F(28.6), lambda a, p: face_to(p, BOX, 120))
    # REVIEW 3: "0:46 is that Charles Lee's actor standing beside Laurens' actor?", "watching Jon (Charles Lee) the
    # whole time. Then he walked off stage": ens3 (Charles Lee's body) drifts down beside Laurens, and goes at Q183
    move('ens3', F(40.4), F(44.4), (-0.3, 4.55), f=-20)
    # ---- Q180 46.1 the duet: Hamilton gets up on the box beside him
    move('hamilton', F(46.1), F(48.0), (1.0, 2.65), f=30)   # SPOT: beside Seabury, in ch12 and ch45
    move('ens2', F(46.4), F(47.6), (1.8, 2.2), f=-30)
    turn(crowd_e, F(48.0), lambda a, p: face_to(p, (1.3, 2.4), 120))
    # ---- Q181 62.3 he heats up: round to the front of the box
    move('hamilton', F(62.3), F(64.0), (1.4, 3.2), f=0)
    turn(['ens2'], F(63.0), -20)
    exit_('ens3', F(76.8), 'W_DSL', speed=1.4)               # REVIEW 3: Charles Lee walks off (comment above)
    crowd_e.remove('ens3')
    # ---- Q183 78.0 the company shouts with him: the crowd presses in, the friends join him
    for e in crowd_e:
        p = pos(e); dx, dz = BOX[0] - p[0], BOX[1] - p[1]; d = math.hypot(dx, dz)
        q = (p[0] + dx / d * 0.5, p[1] + dz / d * 0.5)
        move(e, F(78.0), F(79.6), q, f=face_to(q, (1.4, 3.0), 135))
    move('laurens', F(78.0), F(80.0), (-0.2, 3.6), f=45)
    move('lafayette', F(78.0), F(80.0), (-1.2, 2.6), f=45)
    move('mulligan', F(78.0), F(80.0), (-2.0, 3.6), f=30)
    move('burr', F(81.0), F(83.6), (-2.4, 4.8), f=40)
    # ---- Q184 86.9 the collision: Seabury picks up his box and moves it away from Hamilton (fan account),
    # to (2.6, 2.0) (props.py 'seabury-box'), and stands at it again
    move('ens2', F(86.9), F(88.6), (2.6, 2.0), f=-60)
    turn(['hamilton'], F(87.2), 60)
    # ---- Q185 92.3 Hamilton DSC with his best line
    # SPOT: 'Hamilton DSC in his key (preset 259)' -- ch44 lands at (-0.28, 2.93); the friends give him the pool
    move('hamilton', F(92.3), F(93.8), (-0.25, 2.95), f=0)
    move('laurens', F(92.3), F(93.8), (0.9, 3.8), f=-40)
    move('lafayette', F(92.3), F(93.6), (-1.6, 2.2), f=40)
    move('mulligan', F(92.3), F(93.8), (-2.8, 3.2), f=40)
    # ---- Q186 96.5 Burr steps in to calm him
    move('burr', F(96.5), F(99.0), (-1.75, 4.2), f=50)   # SPOT: into his AF (ch2); he pulls him away (fan staging account)
    # ---- Q187 101.5 silence; Q188 102.9 the King's herald UC (ens10 steps up from the crowd)
    # SPOT: the herald stands in the one hard white special (ch13 at (0, 0.63)), the red disc (ch18) just upstage of him
    HER = (0.0, 0.63)
    herald = min(crowd_e, key=lambda e: dist(pos(e), HER))
    move(herald, F(101.0), F(102.8), HER, f=0)
    for e in crowd_e:
        if e == herald: continue
        p = pos(e); d = dist(p, HER)
        if d < 1.4:
            q = (HER[0] + (p[0] - HER[0]) / d * 1.45, HER[1] + (p[1] - HER[1]) / d * 1.45)
            move(e, F(101.0), F(102.4), q, f=face_to(q, HER, 150))
    others = [a for a in crowd_e if a != herald] + ['ens2', 'hamilton', 'burr', 'laurens', 'lafayette', 'mulligan']
    turn(others, F(102.9), lambda a, p: face_to(p, HER, 150))
    # ---- Q189 106.9 the build into the King's song: the stage clears to the wings, the herald last
    exit_('burr', F(104.0), 'W_DSR', speed=2.0)
    exit_('hamilton', F(104.4), 'W_DSR', speed=2.0)
    for k, a in enumerate(sorted([o for o in others if o not in ('burr', 'hamilton')], key=lambda a: -abs(pos(a)[0]))):
        exit_(a, F(104.6 + 0.15 * k), speed=2.0,
              label='Ensemble 2' if a == 'ens2' else None)
    exit_(herald, F(108.8), 'D_UC', speed=2.3)
