# 1-02 Aaron Burr, Sir
from lib import *

def B(at): return S('1-02', at)

TAVERN = []   # REVIEW2 (Jack): no ensemble in Aaron Burr, Sir (was eight of the company filling the tavern)

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
    # REVIEW2 (Jack): the three carry on a picnic table -- Laurens carries it (props.py 'picnic-table'), Lafayette and
    # Mulligan walk in either side of him -- and the ensemble does NOT come on. They play their verses at the table.
    # The table stands DSC at (0, 3.3) (x -0.9..0.9, z 2.95..3.65): each verse pool is at one end or behind it.
    move('hamilton', B(84.0), B(85.8), (-0.9, 2.1), f=20)      # out of the table's way
    move('burr', B(84.0), B(88.0), (-3.6, 3.6), f=45)
    enter('lafayette', B(83.0), B(86.4), (0.2, 4.2), -100, wing='W_DSL')   # the downstage side
    W['lafayette'][-1]['d'] = 0; W['lafayette'][-1].pop('f')
    put('lafayette', B(88.6), (-1.55, 3.3), f=60)                          # the table's SR end
    enter('laurens', B(83.4), B(88.0), (1.05, 3.3), -90, wing='W_DSL')     # carrying it: sets it down at 88.0
    enter('mulligan', B(83.8), B(88.4), (0.6, 2.3), -10, wing='W_DSL')    # the upstage side

    # ---- Q87 90.9 Laurens' verse, his pool SL (ch51 (2.41, 3.26)), at the table's SL end
    move('laurens', B(90.6), B(92.0), (1.75, 3.35), f=-30)
    # ---- Q88 102.8 Lafayette's verse SR (ch48 (-2.41, 3.06)), at the table's SR end
    move('lafayette', B(102.4), B(103.6), (-1.75, 3.2), f=30)
    move('laurens', B(102.8), B(104.4), (1.15, 2.7), f=-45)
    # ---- Q89 115.6 Mulligan's verse, behind the table centre
    move('hamilton', B(113.6), B(115.2), (-0.8, 1.9), f=30)
    move('mulligan', B(114.6), B(116.2), (0.4, 2.45), f=0)   # SPOT: his pool centre (ch50 at (0.39, 2.44))
    move('lafayette', B(115.0), B(117.0), (-1.5, 2.45), f=60)
    # ---- Q90 127.6 the toast: the four round the table
    move('hamilton', B(127.6), B(129.0), (0.0, 2.35), f=0)
    move('mulligan', B(127.4), B(128.8), (0.9, 2.4), f=-20)
    move('laurens', B(127.6), B(129.4), (1.35, 3.0), f=-80)
    move('lafayette', B(127.6), B(129.4), (-1.35, 3.0), f=80)
    # ---- Q91 133.7 they turn on Burr
    move('burr', B(133.7), B(135.4), (-1.85, 4.15), f=45)   # SPOT: into his AF (ch2)
    turn(['hamilton', 'laurens', 'lafayette', 'mulligan'], B(134.6),
         lambda a, p: face_to(p, (-1.85, 4.15), 120))
    # ---- Q92 139.6 Burr sits it out: back to his corner
    move('burr', B(139.6), B(141.6), (-4.2, 4.1), f=40)
    turn(['laurens', 'lafayette', 'mulligan'], B(141.8), lambda a, p: face_to(p, (0.0, 2.35), 110))
    turn(['hamilton'], B(141.8), 0)
    # ---- Q93 151.6 Hamilton steps up: the vamp into My Shot
    # SPOT: his DSC special is ch13 at (0, 2.40): he steps back among the friends on Q92 and forward into it on Q93
    # (just upstage of the picnic table)
    move('hamilton', B(142.4), B(143.6), (0.0, 1.7), f=0)
    move('hamilton', B(151.6), B(152.8), (0.05, 2.35), f=0)
    turn(['laurens', 'lafayette', 'mulligan'], B(152.4), lambda a, p: face_to(p, (0.05, 2.35), 120))
