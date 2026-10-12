# 1-02 Aaron Burr, Sir
from lib import *

def B(at): return S('1-02', at)

TAVERN = ['ens1', 'ens2', 'ens3', 'ens4', 'ens5', 'ens7', 'ens8', 'ens10']

def build():
    # ---- the street at night (Q80 0.5): Burr alone, strolling SR to centre
    move('burr', S('1-01', 234.2), B(0.4), (-3.0, 3.0), f=60)
    # SPOT: Q81-Q85 light Burr in his AF (ch2, preset 117 BURR, lands (-1.82, 4.25)) and Hamilton in his key
    # (ch44, preset 259 'Ham dsc', lands (-0.69, 3.35)); the scene is played between the two pools
    put('burr', B(8.0), (-1.8, 4.15), f=0)
    # ---- Q81 12.0 Hamilton finds him, in from SL
    enter('hamilton', B(9.4), B(14.4), (-0.55, 3.25), -55, wing='W_DSL')
    turn(['burr'], B(13.0), 70)
    # ---- Q82 37.1 Princeton: Hamilton circles in to him
    move('hamilton', B(37.1), B(39.0), (-0.75, 3.05), f=-60)
    turn(['burr'], B(39.0), 45)
    move('hamilton', B(48.0), B(51.0), (-0.85, 3.45), f=-70)
    turn(['burr'], B(50.0), 60)
    # ---- Q83 56.0 the drink: Burr leads him SL toward the lamp
    # SPOT: the lamplit pool (ch52, a narrow wash at (0.89, 3.27)) spreads over both men, Hamilton still in his key
    move('burr', B(56.0), B(59.0), (-0.1, 3.85), f=60)
    move('hamilton', B(56.4), B(59.6), (0.25, 3.25), f=-60)   # REVIEW: Burr's arm round his shoulders (fan staging account)
    # ---- Q84 62.3 Burr's advice: he steps down out of the conversation
    move('burr', B(62.3), B(64.0), (-1.75, 4.15), f=30)   # SPOT: back into his AF, alone
    turn(['hamilton'], B(63.0), 45)
    # ---- Q85 79.6 the warning
    turn(['burr'], B(79.6), -60)

    # ---- Q86 83.4 the friends burst in; the street becomes the tavern
    enter('laurens', B(82.0), B(86.0), (3.0, 1.0), face_to((3.0, 1.0), (0.0, 1.9)), wing='W_MSL')
    enter('lafayette', B(81.8), B(86.0), (-3.0, 0.6), face_to((-3.0, 0.6), (0.0, 1.9)), wing='W_MSR')
    enter('mulligan', B(82.6), B(86.2), (0.6, -0.6), 0, wing='D_UC')
    move('burr', B(84.0), B(88.0), (-3.6, 3.6), f=45)
    move('hamilton', B(84.6), B(87.0), (0.0, 1.9), f=0)
    tslots = [(-3.8, -1.4), (-2.6, -2.3), (-1.4, -1.5), (-0.6, -2.6), (1.8, -1.8), (3.0, -1.0), (4.1, -0.2),
              (-4.0, 0.2)]
    tw = {'ens1': 'W_USR', 'ens2': 'W_MSR', 'ens3': 'D_UC', 'ens4': 'W_USL', 'ens5': 'W_MSR',
          'ens7': 'W_USR', 'ens8': 'W_USL', 'ens10': 'D_UC'}
    for e in TAVERN:
        put(e, B(60.0 + TAVERN.index(e) * 0.1), WINGS[tw[e]], off=True)
    m = assign(TAVERN, tslots)
    for k, e in enumerate(TAVERN):
        p = m[e]
        W[e][-1]['d'] = 0
        W[e][-1]['t'] = B(82.4 + 0.35 * k)
        put(e, B(82.4 + 0.35 * k + max(3.0, dist(p, WINGS[tw[e]]) / 1.7)), p, f=face_to(p, (0.0, 2.0), 110))

    # ---- Q87 90.9 Laurens' verse, his pool SL
    move('laurens', B(90.6), B(92.6), (2.4, 3.0), f=-30)
    # ---- Q88 102.8 Lafayette's verse SR
    move('lafayette', B(102.4), B(104.6), (-2.2, 3.0), f=30)
    move('laurens', B(102.8), B(104.8), (2.6, 1.3), f=-60)
    # ---- Q89 115.6 Mulligan's verse, down the centre
    move('hamilton', B(113.6), B(115.2), (-0.9, 1.8), f=30)
    move('mulligan', B(114.6), B(117.6), (0.4, 2.5), f=0)   # SPOT: his pool centre (ch50 at (0.39, 2.44))
    move('lafayette', B(115.0), B(117.0), (-2.6, 1.4), f=60)
    # ---- Q90 127.6 the toast: the friends round Hamilton, the tavern raises up behind
    move('hamilton', B(127.6), B(129.0), (0.0, 2.2), f=0)
    move('laurens', B(127.6), B(129.4), (1.1, 2.7), f=-45)
    move('lafayette', B(127.6), B(129.4), (-1.1, 2.7), f=45)
    move('mulligan', B(127.6), B(129.4), (1.4, 3.6), f=-40)
    arc = [ring(3.2, th) for th in (-80, -57, -34, -11, 11, 34, 57, 80)]
    form(TAVERN, arc, B(127.6), B(130.4), face=('at', (0.0, 2.2), 110))
    # ---- Q91 133.7 they turn on Burr
    move('burr', B(133.7), B(135.4), (-1.85, 4.15), f=45)   # SPOT: into his AF (ch2)
    turn(['hamilton', 'laurens', 'lafayette', 'mulligan'] + TAVERN, B(134.6),
         lambda a, p: face_to(p, (-1.85, 4.15), 120))
    # ---- Q92 139.6 Burr sits it out: back to his corner
    move('burr', B(139.6), B(141.6), (-4.2, 4.1), f=40)
    turn(['hamilton', 'laurens', 'lafayette', 'mulligan'] + TAVERN, B(141.8),
         lambda a, p: face_to(p, (0.0, 2.2), 110) if a != 'hamilton' else 0)
    # ---- Q93 151.6 Hamilton steps up DSC: the vamp into My Shot
    # SPOT: his DSC special is ch13 at (0, 2.40) (and the real 'Ham DSC' preset 151, ch43, at (0.27, 2.53)):
    # he steps back among the friends on Q92 and forward into it on Q93
    move('hamilton', B(142.4), B(143.6), (0.0, 1.7), f=0)
    move('hamilton', B(151.6), B(152.8), (0.1, 2.45), f=0)
    turn(['laurens', 'lafayette', 'mulligan'] + TAVERN, B(152.4), lambda a, p: face_to(p, (0.1, 2.45), 120))
