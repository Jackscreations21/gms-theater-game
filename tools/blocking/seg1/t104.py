# 1-04 The Story of Tonight
from lib import *

def T(at): return S('1-04', at)

FOUR = ['lafayette', 'hamilton', 'laurens', 'mulligan']   # REVIEW: Laurens beside him (fan account); no crossing out of My Shot

def place(ps, tl, ta, fs):
    for a, p, f in zip(FOUR, ps, fs):
        move(a, tl, ta, p, f=f)

def build():
    # ---- Q140 0.0 the four by candlelight round their chairs DSC (they settle in the blackout)
    # SPOT: four warm pools, one per chair, held all song: ch48 (-1.26, 3.47), ch49 (-0.39, 3.78), ch50 (0.49, 3.79),
    # ch51 (1.37, 3.48), r 0.77. Each friend keeps to his own pool; the shapes below are small moves inside them.
    place([(-1.26, 3.47), (-0.39, 3.78), (0.49, 3.79), (1.37, 3.48)], S('1-03', 331.4), T(0.8), [20, 5, -5, -20])
    # ---- Q141 16.0 the round: they draw together, a half-circle open to the house
    place([(-1.3, 3.65), (-0.4, 3.45), (0.5, 3.45), (1.4, 3.65)], T(16.0), T(17.6), [45, 20, -20, -45])
    # ---- Q142 22.9 the first toast: up in a line, raised
    place([(-1.26, 3.8), (-0.39, 3.85), (0.49, 3.85), (1.37, 3.8)], T(22.9), T(24.4), [0, 0, 0, 0])
    # ---- Q143 35.1 back to the four
    place([(-1.3, 3.65), (-0.4, 3.45), (0.5, 3.45), (1.4, 3.65)], T(35.1), T(36.6), [45, 20, -20, -45])
    # REVIEW: the four are the only ones on stage (fan staging account); the company's hum is offstage
    # ---- Q145 59.0 the second toast to the friends
    place([(-1.3, 3.6), (-0.4, 3.5), (0.5, 3.5), (1.4, 3.6)], T(59.0), T(60.4), [40, 15, -15, -40])
    # ---- Q146 73.5 the last raise: the four close up DSC, the company leans in
    place([(-1.2, 3.6), (-0.38, 3.85), (0.47, 3.85), (1.3, 3.6)], T(73.5), T(75.0), [0, 0, 0, 0])
    # ---- Q149 89.0 blackout: everyone off; Laurens and Hamilton leave together (fan staging account)
    exit_('lafayette', T(89.1), 'W_MSR', speed=2.4)   # SPOT: clear of Burr, who walks on DSR to his AF
    exit_('mulligan', T(89.1), 'W_MSL', speed=2.4)
    exit_('laurens', T(89.1), 'W_DSL', speed=2.4)
    exit_('hamilton', T(89.3), 'W_DSL', speed=2.4)
