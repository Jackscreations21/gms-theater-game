# Generates segments/seg2.json (Hamilton tracks 1-07 .. 1-11) for the blocking merge.
import json, math, os, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "segments", "seg2.json")
os.makedirs(os.path.join(HERE, "segments"), exist_ok=True)
W = defaultdict(list)
LEN = {"1-07": 208.0, "1-08": 321.0, "1-09": 69.0, "1-10": 249.0, "1-11": 329.0}
ORDER = ["1-07", "1-08", "1-09", "1-10", "1-11"]

OFF = {'W-DSR': (-7.3, 4.6), 'W-DSL': (7.3, 4.6), 'W-MSR': (-8.5, 0.0), 'W-MSL': (8.0, -0.5),
       'W-USR': (-8.5, -3.0), 'W-USL': (8.5, -3.0), 'D-UC': (1.25, -4.9)}


def w(a, tr, at, x, z, f=None, dwell=None, label=None, y=None):
    d = {"track": tr, "at": round(at, 2), "x": round(x, 3), "z": round(z, 3)}
    if y is not None:
        d["y"] = y
    if dwell is not None:
        d["dwell"] = dwell
    if f is not None:
        d["facing"] = round(f, 1)
    if label:
        d["label"] = label
    W[a].append(d)


def off(a, tr, at, ent, label=None):
    x, z = OFF[ent]
    d = {"track": tr, "at": round(at, 2), "x": x, "z": z, "off": True}
    if label:
        d["label"] = label
    W[a].append(d)


def wing(x, z):
    if x < 0:
        return "W-DSR" if z > 2.5 else ("W-USR" if z < -0.5 else "W-MSR")
    return "W-DSL" if z > 2.5 else ("W-USL" if z < -0.5 else "W-MSL")


def face(x, z, tx, tz):
    return math.degrees(math.atan2(tx - x, tz - z))


def clock(r, h):
    th = math.radians(h * 30)
    return (r * math.sin(th), 0.95 - r * math.cos(th))


def ring(a, tr, t0, t1, r, h0, h1, f=0, step=1.2, start=True, last_dwell=None):
    """Walk the body round the turntable centre from clock h0 to h1 (hours; + = clockwise
    seen from the house/above, - = counterclockwise) between t0 and t1."""
    n = max(1, math.ceil(abs(h1 - h0) / step))
    for i in range(0 if start else 1, n + 1):
        h = h0 + (h1 - h0) * i / n
        t = t0 + (t1 - t0) * i / n
        x, z = clock(r, h)
        if i == n:
            w(a, tr, t, x, z, f, dwell=last_dwell)
        else:
            w(a, tr, t, x, z, dwell=0)


ENS = ["ens%d" % i for i in range(1, 11)]
LABEL0 = {"hamilton": "Hamilton", "burr": "Burr", "eliza": "Eliza", "angelica": "Angelica",
          "peggy": "Peggy", "washington": "Washington", "lafayette": "Lafayette",
          "mulligan": "Mulligan", "laurens": "Laurens", "king": "King George"}
for i in range(1, 11):
    LABEL0["ens%d" % i] = "Ensemble %d" % i

# ---------------------------------------------------------------- first (labelled) off waypoints
# Everyone starts hidden at 1-07 0.0 with an explicit label.
START = {"king": "D-UC", "washington": "D-UC", "burr": "W-DSL", "hamilton": "W-MSR",
         "laurens": "W-MSR", "lafayette": "W-MSL", "mulligan": "W-MSL", "eliza": "W-MSL",
         "angelica": "W-MSL", "peggy": "W-MSL"}
for a, lab in LABEL0.items():
    ent = START.get(a)
    if ent is None:  # ensemble: odd SR, even SL
        n = int(a[3:])
        ent = "W-MSR" if n <= 5 else "W-MSL"
    off(a, "1-07", 0.0, ent, label=lab)


# REVIEW 2 (Jack's verdict: "the ensemble members are being used too much. a lot of the choreo is wrong"):
# the ensemble is OFF unless evidence puts it on. The strongest evidence is ETC's renders of Binkley's real cues
# (THPP "Cue Photos": 190.01 ... 368.01, read page by page) and the two fan staging write-ups; research/seg2.md
# "Review 2" lists what each placement rests on. Invented formations of the earlier passes are cut.
# The four couples of the ball / Helpless / the wedding / Satisfied's replay, and the Satisfied semicircle.
MEN = ["ens2", "ens3", "ens5", "ens10"]
WOMEN = ["ens6", "ens7", "ens8", "ens9"]

# ================================================================= 1-07 YOU'LL BE BACK
T = "1-07"
k = "king"
w(k, T, 3.5, 0.0, -2.3, 0, dwell=38.3)        # revealed UC (Q190.01, photo 192/193: him alone in the ring UC)
w(k, T, 49.0, 0.0, 4.1, 0)                     # Q194 George DC (photo 194; ch 93 lands at (0, 4.2)) - a stately walk
w(k, T, 68.5, 0.0, 4.6, 0)                     # Q194.2 the threat - a step to the edge
w(k, T, 77.0, 0.6, 4.2, -10)                   # Q194.4 sing-along - eases SL
w(k, T, 92.0, 0.0, 4.1, 0)                     # Q194.6 verse 2 DC
w(k, T, 109.0, -0.7, 4.2, 12)                  # Q194.8 patter - drifts SR
w(k, T, 124.0, 0.0, 4.5, 0)                    # Q195 band drops - alone DSC
w(k, T, 141.0, 0.0, 4.1, 0)                    # Q195.2 chorus 2
w(k, T, 161.0, 0.0, 4.7, 0)                    # Q195.4 the second threat - to the lip
w(k, T, 169.0, 0.5, 4.3, -10)                  # Q195.6 sing-along 2
w(k, T, 182.5, 0.0, 4.1, 0, dwell=23.4)        # Q196 group enters round him; holds through the BUTTON to Q202
off(k, "1-08", 2.0, "W-DSL")                   # Q202 trans (205.9): brisk off SL in the dark, gone before Burr enters SL

# R2: Q196 "Group Enters" (Binkley's own label) - photo 196 (a top-down render) shows EIGHT figures standing on the
# X4 ring's pools, four a side (8 ... 11 o'clock and 1 ... 4 o'clock), the downstage side open for the King. They
# stand still (the earlier ten-body semicircle and its sway were invented). Q198 "Group Exits": photo 198 has the
# King alone again.
RING196 = [("ens2", (-1.96, -1.39), "W-USR"), ("ens3", (-2.88, -0.37), "W-USR"), ("ens6", (-3.20, 0.99), "W-MSR"),
           ("ens7", (-3.26, 2.66), "W-DSR"), ("ens4", (2.01, -1.47), "W-USL"), ("ens5", (2.88, -0.36), "W-MSL"),
           ("ens8", (3.15, 1.04), "W-MSL"), ("ens9", (2.55, 1.91), "W-DSL")]   # X4 ch60 59 53 47 | 63 64 58 52
for i, (a, (x, z), ent) in enumerate(RING196):
    off(a, T, 176.0 + 0.3 * i, ent)
    w(a, T, 183.6, x, z, face(x, z, 0.0, 4.1), dwell=13.4 + 0.25 * (i % 4))   # Q198 (196.48): they melt away
    off(a, T, 203.0 + 0.25 * (i % 4), ent)

# ================================================================= 1-08 RIGHT HAND MAN
T = "1-08"
# R2: photos 202 / 202.01 / 204 show ONE figure in a special at the centre of the disc and the DR pair (the spy and
# the redcoat); nobody else is lit. The earlier two marching rows of the company are cut. The centre figure is taken
# to be Hamilton (his verse follows at Q206).
off("hamilton", "1-07", 199.0, "W-USR")
w("hamilton", "1-07", 205.9, 0.0, 0.6, 0)        # in the transition (Q202 photo: already at the centre)
w("hamilton", T, 29.6, -1.2, 3.7, 0)             # Q206 Binkley's 'Ham dsc' (preset 259), lit again in Q274
w("hamilton", T, 66.0, -1.2, 3.7, 40)            # the General arrives beside him (photo 274: the figure DSR of the lane)
# the spy and the redcoat DR: Q202.01 DR bax up, Q204 Kill DR at 22.22 (photos 202.01 / 204: the DR pair)
off("ens1", "1-07", 203.0, "W-DSR")
w("ens1", "1-07", 207.5, -2.1, 3.65, 20)         # in Binkley's Kill 1 pools (Q204 preset 224); photo 202 has her there
off("ens5", "1-07", 204.5, "W-DSR")
w("ens5", T, 1.0, -2.9, 3.0, 50)
w("ens5", T, 21.6, -2.3, 3.2, 40)                # steps in behind her
w("ens1", T, 23.0, -2.0, 3.7, 0, dwell=3.0)      # the kill - she drops (photo 204.02: one of the pair gone dark)
off("ens1", T, 31.0, "W-DSR")                    # carried off
off("ens5", T, 31.5, "W-DSR")

# Q274 Here comes the General: photo 274 / 274.01 - Washington at the head of a SINGLE FILE of soldiers standing in the
# blue-white centre lane, Hamilton DSR of its head. Washington and seven ensemble walk down from the door in the
# red climax and are standing in the lane on the snap. Burr announces from DL.
off("burr", T, 47.0, "W-DSL")
w("burr", T, 53.0, 3.7, 3.7, -40)
off("burr", T, 72.0, "W-DSL")                    # Burr leaves after the introduction
off("washington", T, 43.5, "D-UC")
w("washington", T, 47.5, 0.0, -2.3, dwell=0)
w("washington", T, 53.4, 0.1, 3.0, 0)
w("washington", T, 64.9, -0.1, 3.5, -20)          # SPOT: in Q274.01's DSC X4s ch42/45 (0, 4.05) for the chorus
FILE = [("ens2", 2.2), ("ens3", 1.45), ("ens4", 0.7), ("ens6", -0.05), ("ens7", -0.8), ("ens8", -1.55), ("ens10", -2.3)]
for a, z in FILE:
    off(a, T, 44.0, "D-UC")
    w(a, T, 53.4, 0.0, z, 0)
# Q278 Path up: photo 278 - Washington in the path DC with Hamilton beside him, and the company (EIGHT figures) in a
# loose block on the STAGE-LEFT side (the earlier passes put it SR: the photo is from the house, SL on its right).
BLOCK = {"ens2": (1.9, 2.4), "ens5": (2.8, 2.6), "ens3": (2.1, 1.5), "ens4": (3.0, 1.7), "ens6": (2.3, 0.6),
         "ens7": (3.2, 0.8), "ens8": (2.5, -0.3), "ens10": (3.4, -0.1)}
off("ens5", T, 72.0, "W-DSL")                    # the redcoat's actor rejoins the company
for a, (x, z) in BLOCK.items():
    w(a, T, 79.5, x, z, face(x, z, 0.0, 3.2))
w("washington", T, 79.0, 0.0, 3.4, 0)
w("washington", T, 90.0, 1.1, 3.2, -15)
w("washington", T, 104.0, 0.0, 3.0, 0)
w("washington", T, 116.0, 0.0, 3.5, 0)          # Q279.5 chorus 2
w("washington", T, 130.0, 0.0, 3.0, 0)
w("hamilton", T, 79.5, -1.1, 3.3, 45)            # photo 278: the figure just SR of Washington
# Q280-282.5 the battle: R2 - the scatter, the cannon recoils and the retreat were invented. Kept only what the fan
# notes say: the soldiers desert him one by one over the number (ironinkpen). Hamilton goes off to the fight.
off("hamilton", T, 132.0, "W-DSR")
DESERT = [("ens10", 128.0), ("ens8", 131.5), ("ens7", 135.0), ("ens6", 138.5), ("ens4", 142.0), ("ens3", 145.5),
          ("ens5", 149.0), ("ens2", 152.5)]
for a, t in DESERT:
    x, z = BLOCK[a]
    ent = "W-USL" if z < 0.3 else ("W-MSL" if z < 2.0 else "W-DSL")
    w(a, T, t, x, z, face(x, z, 0.0, 3.2), dwell=0)
    ex, ez = OFF[ent]
    off(a, T, t + math.hypot(ex - x, ez - z) / 1.5 + 0.3, ent)
# Q283 Washington alone
w("washington", T, 163.5, 0.0, 2.45, 0)                # SPOT: Q283 the white shaft ch93 lands at (0, 2.37), r 0.75
# Q283.5 (night march light, 168.7): R2 - the twelve-soldier night march is cut. Two soldiers set Washington's desk and
# chair for the tent (props.py) and go.
off("ens4", T, 166.0, "W-USR")
w("ens4", T, 174.0, -0.35, 0.2, 0, dwell=0.6)            # sets the desk at (-0.35, 0.85)
off("ens4", T, 181.0, "W-USR")
off("ens10", T, 166.5, "W-USR")
w("ens10", T, 174.5, -1.0, -0.8, 60, dwell=0.6)          # sets the chair at (-0.35, -0.45)
off("ens10", T, 181.0, "W-USR")
# Q284 Washington's tent: Washington at the desk, Burr enters SR
w("washington", T, 176.5, -0.4, 1.4, 0)
off("burr", T, 172.0, "W-MSR")
w("burr", T, 180.0, -2.1, 2.4, 60)
# Q284.5 Hamilton enters DL of the desk
off("hamilton", T, 196.0, "W-DSL")
w("hamilton", T, 203.0, 1.5, 2.7, -60)
# Q285 Burr dismissed
w("burr", T, 213.5, -2.3, 2.6, 60, dwell=0)
off("burr", T, 220.0, "W-MSR")
# SPOT: Washington keeps to the desk's shaft (VL ch74 (-0.06, 1.14) and the desk pool ch13), Hamilton to his pool
# DL of the desk (ch4 (1.37, 2.33)); for the duet (Q286-Q287.5) the two keys are ch4 (Hamilton) and ch2 (-1.78, 2.54).
w("washington", T, 226.0, -0.3, 1.75, 75)
w("hamilton", T, 228.0, 1.1, 2.6, -75)
w("washington", T, 251.0, 0.15, 1.8, 70)       # Q285.5 advice - the two specials tighten
w("hamilton", T, 252.0, 0.95, 2.4, -100)
w("hamilton", T, 266.0, 1.25, 2.85, -10)       # Q286 Hamilton accepts - steps out into his key
w("washington", T, 277.0, -1.6, 2.75, 20)      # Q286.5 Washington takes the chorus, in ch2
w("hamilton", T, 290.0, 1.25, 2.6, -15)
# Q288 finale: R2 - the thirteen-body arc on the ring is cut. The company (the eight of the file) comes back for the
# last chorus in ONE loose line upstage of the desk, standing, and goes in the last line (Q288.5).
FIN = [("ens8", -3.5, "W-USR"), ("ens7", -2.5, "W-USR"), ("ens3", -1.5, "W-USR"), ("ens2", -0.5, "D-UC"),
       ("ens4", 0.5, "D-UC"), ("ens6", 1.5, "W-USL"), ("ens5", 2.5, "W-USL"), ("ens10", 3.5, "W-MSL")]
for i, (a, x, ent) in enumerate(FIN):
    off(a, T, 294.0 + 0.3 * i, ent)
    w(a, T, 302.0, x, -1.6, 0, dwell=10.8 + 0.4 * (i % 3))
    ex, ez = OFF[ent]
    off(a, T, 313.0 + 0.4 * (i % 3) + math.hypot(ex - x, ez + 1.6) / 1.6, ent)
w("washington", T, 302.0, -0.47, 2.52, 10, dwell=16.94)   # SPOT: Q288.5/Q289 the two DC specials ch12 (-0.47, 2.52)
w("hamilton", T, 302.0, 0.47, 2.52, -10, dwell=16.94)      # and ch14 (0.47, 2.52), with ch93 (0, 2.37) over both
# BUTTON and blackout: the two men leave in the dark
off("washington", "1-09", 3.4, "W-MSR")
off("hamilton", "1-09", 3.6, "W-DSR")

# ================================================================= 1-09 A WINTER'S BALL
T = "1-09"
off("burr", "1-08", 318.94, "W-DSL")
w("burr", T, 1.6, 0.0, 3.0, 0)                  # Q290 Burr DSC narration (walks on brisk in the blackout); SPOT: ch93 lands (0, 2.99)
w("burr", T, 19.5, -2.8, 3.8, 30)               # Q290.5 aside DR as the desk lights
w("burr", T, 45.0, 0.0, 3.0, 0)                 # Q291.5 Burr's aside DSC; SPOT: back in ch93 (0, 2.99)
w("burr", T, 50.5, 2.6, 3.9, -30)               # R2: Q292 the ball - Burr DL (the men leave SL: fan write-up, photo 300.3)
# the desk: Washington behind it, Hamilton at his right hand (the desk stays from the tent; props.py)
off("washington", T, 8.0, "W-MSR")
w("washington", T, 17.0, -0.3, 0.2, 0)
off("hamilton", T, 8.5, "W-MSR")
w("hamilton", T, 18.2, -1.5, 0.4, 20)
off("washington", T, 40.0, "W-USR")             # takes the desk with him as the men take over (props.py)
# Q291 refrain - the three friends round Hamilton (R2: the five ensemble men behind them are cut)
w("hamilton", T, 35.0, 0.0, 1.8, 0)
w("laurens", T, 35.5, -1.1, 2.4, 20)
w("lafayette", T, 35.5, 1.1, 2.4, -20)
w("mulligan", T, 36.0, 1.9, 1.3, -30)
# Q292 the ball: four couples come on and stand on the turntable's upstage half (they start to turn on Q293)
CPL_H = [9.5, 11.0, 13.0, 14.5]
for i, (m, wo) in enumerate(zip(MEN, WOMEN)):
    h = CPL_H[i]
    xm, zm = clock(1.6, h)
    xw, zw = clock(2.2, h)
    ent = "W-USR" if xm < 0 else "W-USL"
    off(m, T, 42.0 + 0.4 * i, ent)
    off(wo, T, 42.2 + 0.4 * i, ent)
    w(m, T, 50.5, xm, zm, face(xm, zm, xw, zw))
    w(wo, T, 51.0, xw, zw, face(xw, zw, xm, zm))
# Hamilton and the men drift DL to Burr; Laurens and Mulligan dance off SL
w("hamilton", T, 51.0, 1.6, 3.4, -40)
w("laurens", T, 51.5, 2.2, 2.6, -30, dwell=4.0)
off("laurens", T, 61.0, "W-DSL")
w("mulligan", T, 52.5, 1.0, 4.3, -20, dwell=2.5)
off("mulligan", T, 61.5, "W-DSL")
w("lafayette", T, 50.0, 0.6, 2.6, -20)
# Q292.5 the sisters: Angelica and Peggy centre (door), Eliza in her own pool far SL
off("angelica", T, 44.0, "D-UC")
off("peggy", T, 44.0, "D-UC")
W["angelica"][-1]["x"] = 0.7
W["peggy"][-1]["x"] = 1.25
w("angelica", T, 52.3, -0.4, 1.6, 0)            # SPOT: in the sisters' centre pool ch13 (-0.04, 1.84)
w("peggy", T, 52.3, 0.4, 1.6, 0)
off("eliza", T, 46.0, "W-MSL")
w("eliza", T, 52.3, 3.1, 1.8, -20)               # SPOT: the centre of her own pool far SL, ch14 (3.05, 1.89)
# Angelica sees him and crosses on the diagonal toward him, Lafayette at her side; Hamilton pushes him aside, kisses
# her hand, circles her and goes back downstage to Burr (fan write-up)
w("lafayette", T, 56.5, 0.35, 2.75, -30)
w("angelica", T, 57.5, 0.85, 2.85, 60)
w("lafayette", T, 58.8, -0.4, 2.5, 30)           # pushed aside
w("hamilton", T, 58.5, 1.5, 3.2, -110)           # kisses her hand
w("hamilton", T, 59.8, 1.55, 2.3, dwell=0)       # circles her
w("hamilton", T, 61.0, 0.4, 2.35, dwell=0)
w("hamilton", T, 62.2, 0.6, 3.5, dwell=0)
w("hamilton", T, 63.8, 2.0, 3.6, -40)            # back to Burr
off("lafayette", T, 66.0, "W-DSR")
# Q293 build into Helpless: the turntable starts (couples CCW). R2: photo 300.3 (Binkley's top of Helpless) has the
# three sisters together SR and two men SL - the earlier passes had it the other way round. The men hold SL; Angelica
# watches them, then the sisters gather SR; Eliza crosses from her SL pool round the downstage edge.
# (the three go round the downstage half, where no couple is, and up the SR side outside the ring)
w("peggy", T, 64.0, 0.4, 1.6, 0, dwell=0)
w("peggy", T, 65.6, -0.7, 3.0, dwell=0)
w("peggy", T, 67.3, -2.7, 2.9, dwell=0)
w("angelica", T, 64.5, 0.85, 2.85, 60, dwell=0)
w("angelica", T, 66.2, -1.0, 3.75, dwell=0)
w("angelica", T, 67.6, -2.75, 3.25, dwell=0)
w("eliza", T, 63.9, 3.1, 1.8, -20, dwell=0)
w("eliza", T, 65.9, 1.0, 3.9, dwell=0)
w("eliza", T, 67.6, -1.6, 4.0, dwell=0)

# ================================================================= 1-10 HELPLESS
T = "1-10"
# Q300.3 (photo): the sisters SR on the outer ring, the two men SL. The men go off SL at once.
w("peggy", T, 0.05, -3.1, 0.3, 70)
w("angelica", T, 0.05, -3.45, 1.1, 70)
w("eliza", T, 0.05, -3.0, 2.25, 60, dwell=1.0)
w("hamilton", T, 0.05, 3.2, 1.35, -110, dwell=1.5)
off("hamilton", T, 6.0, "W-MSL")
w("burr", T, 0.05, 3.65, 2.4, -110, dwell=1.0)
off("burr", T, 4.5, "W-DSL")
# Eliza spirals out from SR to DSC for her chorus (Q300.4); Angelica 'Sister DR out' holds SR with Peggy
w("eliza", T, 5.0, -2.5, 3.4, dwell=0)
w("eliza", T, 8.0, -1.2, 4.4, dwell=0)
w("eliza", T, 11.3, 0.1, 3.75, 0)               # SPOT: Q300.4 her DSC key ch13 lands (0.1, 2.9); 0.6 m clear of the ring

# the couples: CCW from the ball (WB 63.84) to Helpless 28.24, then dance, then chorus 2 CCW again (fan write-up:
# "Eliza, the ensemble women and their partners spiral round the turntable"; Blankenbuehler: all of Helpless CCW)
for i, (m, wo) in enumerate(zip(MEN, WOMEN)):
    h0 = CPL_H[i]
    for a, r in ((m, 1.6), (wo, 2.2)):
        ring(a, "1-09", 63.84, 68.5, r, h0, h0 - 0.6, f=None, start=True, last_dwell=0)
        ring(a, T, 0.5, 28.2, r, h0 - 0.6, h0 - 12.0, f=0, step=1.0, start=False)
        ring(a, T, 60.6, 84.5, r, h0 - 12.0, h0 - 24.0, f=0, step=1.0, start=True)
# Q300.6 ball memory: Angelica takes Peggy's hands, they charge down to Eliza - the triangle
w("angelica", T, 28.3, -3.45, 1.1, 70, dwell=0)
w("peggy", T, 28.3, -3.1, 0.3, 70, dwell=0)
w("angelica", T, 31.0, 0.0, 3.5, 0)
w("peggy", T, 31.0, 0.8, 4.2, -20)
w("eliza", T, 31.0, -0.8, 4.2, 20)
# spin out: Angelica with Washington, Mulligan sweeps Peggy away
off("washington", T, 25.0, "W-DSR")
w("washington", T, 33.5, -1.5, 3.4, 60)
w("angelica", T, 33.8, -0.8, 3.6, -60)
off("mulligan", T, 27.0, "W-DSL")
w("mulligan", T, 33.5, 1.6, 3.9, -60)
w("peggy", T, 34.0, 1.0, 4.5, 60)
# Q300.8 Hamilton walks in UL - first sight; Washington goes to shake his hand
off("hamilton", T, 30.0, "W-USL")
w("hamilton", T, 36.2, 3.2, -1.5, -120, dwell=0.8)
w("hamilton", T, 41.5, 3.4, 0.2, -60)
w("washington", T, 41.0, 2.8, 0.6, 60, dwell=2.0)
off("washington", T, 50.0, "W-MSL")
# Eliza pulls Angelica downstage as he passes
w("eliza", T, 35.0, -2.3, 3.9, 30)                # first sight: Eliza DR at the end of the light strip from his UL (fan write-up)
w("eliza", T, 39.5, -1.4, 4.6, -20)
w("angelica", T, 40.0, -0.5, 4.7, -20)
# he goes back to the steps (the foot of the SL stair)
w("hamilton", T, 47.0, 2.45, -2.45, -40, y="top")   # perched on the SL stair's lower treads
# Q301.2 Angelica crosses to him on the steps
w("angelica", T, 54.5, 2.1, -1.6, 60)
w("eliza", T, 56.0, 0.1, 3.75, 0)                  # back to her spot for chorus 2 (SPOT: in ch13 again)
# Peggy changes partners: Laurens takes her
off("laurens", T, 56.0, "W-DSL")
w("laurens", T, 62.0, 1.8, 3.4, -60)
w("peggy", T, 62.5, 1.2, 4.1, 60)
off("mulligan", T, 66.0, "W-DSL")
# Q301.6 Angelica brings him down to Eliza - the three DC
w("hamilton", T, 85.0, 2.45, -2.45, -40, dwell=0, y="top")
w("angelica", T, 85.0, 2.1, -1.6, -40, dwell=0)
# SPOT: Q301.6 "the three held in cool-white specials DC" are ch12 (-0.78, 2.31), ch13 (0, 1.97), ch14 (0.78, 2.31):
# Eliza SR, Hamilton in the middle, Angelica on his SL side; they come round downstage of the parked couples.
w("hamilton", T, 87.5, 2.9, 0.3, dwell=0)
w("angelica", T, 87.5, 3.6, 0.4, dwell=0)
w("hamilton", T, 89.0, 2.6, 2.4, dwell=0)
w("angelica", T, 89.3, 3.2, 2.6, dwell=0)
w("hamilton", T, 91.0, 0.0, 2.0, -68)
w("angelica", T, 91.3, 0.78, 2.31, -80)
w("eliza", T, 89.0, -0.78, 2.31, 60)
# Laurens and Peggy dance off
off("laurens", T, 99.0, "W-DSL")
off("peggy", T, 99.5, "W-DSL")
# Q301.8 the letters: the ensemble goes ("The ensemble exits"), two pools apart
for i, (m, wo) in enumerate(zip(MEN, WOMEN)):
    for j, (a, r) in enumerate(((m, 1.6), (wo, 2.2))):
        x, z = clock(r, CPL_H[i])
        off(a, T, 108.0 + 0.9 * i + 0.45 * j, wing(x, z))
w("hamilton", T, 105.3, -1.45, 1.35, dwell=0)     # SPOT: round upstage of Eliza to DR
w("hamilton", T, 107.0, -3.1, 2.8, 35)
w("eliza", T, 105.3, 0.7, 3.2, dwell=0)            # SPOT: round downstage of Angelica to DL
w("eliza", T, 107.0, 2.9, 3.0, -35)
w("angelica", T, 108.0, 2.2, 3.6, -30)
off("peggy", T, 102.0, "W-DSL")
w("peggy", T, 106.5, 3.7, 3.7, -40)                # brings the letters
w("angelica", T, 110.5, 2.6, 3.5, 60)              # snatches them
w("eliza", T, 112.0, 3.1, 3.1, 60)                 # takes them back
w("peggy", T, 113.5, 3.7, 3.9, 0)                  # turns out to the house
# Q302 "Two weeks" - R2, from the real photo 302 and both fan accounts: the sisters on a BENCH at the downstage edge of
# the disc, their backs to the house, watching; upstage on the turntable Hamilton with Philip Schuyler in a CHAIR
# (hamilton-lyrics: "Papa Schuyler sits in a chair on the turntable ... the sisters sit on a bench on the opposite
# side"; ironinkpen: the two men upstage on the turntable, away from the house). Photo 304: the three upstage centre.
# The page cannot turn the disc, so the half-turn between 302 and 304 is shown by the sisters walking up.
# (The spotlight pass had put this scene in the Q302 viper keys ch25 DR / ch26 SL; the photo does not.)
off("ens1", T, 108.5, "W-DSR")
w("ens1", T, 114.0, -0.8, 3.35, 70, dwell=0.6)     # sets the sisters' bench at (0, 3.0) (props.py), then goes
off("ens1", T, 121.0, "W-DSR")
w("eliza", T, 115.0, 0.0, 2.3, 180)                # on the bench, facing upstage
w("angelica", T, 113.8, 1.0, 1.75, dwell=0)         # round upstage of Eliza
w("angelica", T, 115.2, 0.0, 1.45, dwell=0)
w("angelica", T, 116.3, -0.55, 2.3, 180)
w("peggy", T, 117.0, 0.55, 2.3, 180)
off("ens4", T, 112.0, "W-MSL", label="Philip Schuyler")
w("ens4", T, 117.5, 1.3, -0.9, -90)                # carries his chair on: it stands behind him at (2.0, -0.9)
w("hamilton", T, 112.5, -3.1, 2.8, 35, dwell=0)
w("hamilton", T, 117.0, 0.45, -0.9, 90)            # facing Schuyler, upstage on the disc
# Eliza runs to him; they swirl at centre; Schuyler steps away upstage, his back to them
w("hamilton", T, 125.0, 0.45, -0.9, 90, dwell=0)
w("hamilton", T, 126.2, 0.25, 0.3, 160)
w("eliza", T, 125.2, 0.0, 2.3, 180, dwell=0)
w("eliza", T, 126.5, -0.2, 1.2, 180)
w("hamilton", T, 127.6, -0.6, 0.6, dwell=0)
w("eliza", T, 127.6, 0.6, 0.8, dwell=0)
w("hamilton", T, 129.0, -0.4, 0.4, 60)
w("eliza", T, 129.0, 0.35, 0.85, -120)
w("ens4", T, 127.0, 1.6, -1.6, 180)
# Q302.5 her father crosses: panic; Q303 he shakes Hamilton's hand
w("ens4", T, 132.5, 0.9, -0.5, -120)
w("hamilton", T, 135.0, 0.25, -0.05, 60)
w("ens4", T, 135.5, 0.8, -0.4, -120, dwell=1.5)
w("eliza", T, 135.5, -0.6, 1.3, 30)
# Q304 third chorus - the three upstage centre (photo 304); the men share a drink SL by the chair
w("hamilton", T, 139.0, 2.7, 0.6, 130)
w("ens4", T, 139.5, 3.3, 0.0, -50)
w("eliza", T, 139.5, -0.6, 1.3, 30, dwell=0)
w("eliza", T, 142.5, 0.0, -1.35, 0)
w("angelica", T, 139.5, -0.55, 2.3, 180, dwell=0)
w("angelica", T, 142.5, -0.65, -1.3, 10)
w("peggy", T, 139.5, 0.55, 2.3, 180, dwell=0)
w("peggy", T, 142.5, 0.65, -1.3, -10)
# the sisters come down and dance; Eliza at centre for the climax
w("eliza", T, 156.0, 0.0, 1.8, 0)
w("angelica", T, 156.0, -0.8, 2.1, 20)
w("peggy", T, 156.0, 0.8, 2.1, -20)
# Q306 Hamilton's verse - the couple in one pool DC; the others leave (Peggy takes the bench, Schuyler his chair)
w("peggy", T, 159.5, 0.6, 2.55, 160, dwell=0.3)
off("peggy", T, 166.0, "W-DSL")
off("angelica", T, 167.0, "W-DSR")
w("ens4", T, 163.5, 2.45, -0.45, -130, dwell=0.4)
off("ens4", T, 170.0, "W-MSL")
w("hamilton", T, 165.0, 0.4, 2.45, -40)          # SPOT: Q306/Q308/Q310 the DC pool is ch13 (0, 2.28)
w("eliza", T, 165.0, -0.4, 2.55, 40)
# Q310 his vow - he grabs her and spins her round
w("hamilton", T, 197.0, 0.45, 2.4, -40, dwell=0)  # SPOT: the spin, 0.8 m upstage; it ends in Q312's keys
w("hamilton", T, 198.4, 0.9, 1.6, dwell=0)
w("hamilton", T, 199.6, -0.3, 1.25, dwell=0)
w("hamilton", T, 201.0, -0.35, 2.4, 0)            # ch12 (-0.47, 2.31)
w("eliza", T, 197.0, -0.4, 2.55, 40, dwell=0)
w("eliza", T, 198.4, 0.1, 2.15, dwell=0)
w("eliza", T, 199.6, 0.4, 1.65, dwell=0)
w("eliza", T, 201.0, 0.45, 2.55, -30)            # ch14 (0.47, 2.31)
# Q312 the wedding: the (four) ensemble women bring the papers for him to sign, in a line
for i, a in enumerate(WOMEN):
    x = -1.5 + 1.0 * i
    off(a, T, 196.0, "W-MSL" if x > 0 else "W-MSR")
    w(a, T, 203.5, x, 1.5, 0)
# Q314 final chorus: Laurens pulls Hamilton DR to Washington for the pep talk; the bride SL with her sisters
off("laurens", T, 203.0, "W-DSR")
w("laurens", T, 208.0, -0.8, 3.1, 60)
w("hamilton", T, 208.5, -0.4, 2.8, -60)
w("laurens", T, 212.0, -2.2, 3.5, 30)
w("hamilton", T, 212.5, -2.6, 2.9, -45)
off("washington", T, 205.0, "W-DSR")
w("washington", T, 212.0, -3.4, 3.4, 60)
w("eliza", T, 210.5, 2.6, 3.4, 30)
off("angelica", T, 205.0, "W-DSL")
off("peggy", T, 205.0, "W-DSL")
w("angelica", T, 211.0, 3.4, 3.9, -40)
w("peggy", T, 211.0, 3.2, 2.7, -60)
# the guests dance on the ring, CCW (Q316 "wedding dance on the turntable"): the four couples
WED = [("ens2", "ens6", 10.5), ("ens3", "ens7", 12.0), ("ens5", "ens9", 1.5), ("ens10", "ens8", 3.0)]
for m, wo, h in WED:
    xm, zm = clock(2.0, h)
    off(m, T, 207.0, "W-MSR" if xm < 0 else "W-MSL")
    w(m, T, 214.0, xm, zm, 0)
    xw, zw = clock(2.6, h)
    w(wo, T, 214.0, xw, zw, 0)
    ring(m, T, 214.0, 229.0, 2.0, h, h - 2.0, f=0, start=False)
    ring(wo, T, 214.0, 229.0, 2.6, h, h - 2.0, f=0, start=False)
# the aisle for the processional (Q316 wedding dance -> Q318): "the ensemble forms the wedding audience"
AISLE = {"ens2": (-1.6, -1.0), "ens6": (-1.8, 0.0), "ens3": (-2.0, 1.0), "ens7": (-2.2, 2.0),
         "ens5": (1.6, -1.0), "ens9": (1.8, 0.0), "ens10": (2.0, 1.0), "ens8": (2.2, 2.0)}
for a, (x, z) in AISLE.items():
    w(a, T, 233.0, x, z, 75 if x < 0 else -75)
# Hamilton waits at DC for his bride; Washington beside the aisle's foot
w("hamilton", T, 230.0, 0.35, 3.9, 180)
w("washington", T, 230.5, -2.7, 3.7, 60)
# the bridesmaids and groomsmen go round the outside to UC
w("angelica", T, 220.0, 3.3, -0.8, dwell=0)
w("angelica", T, 226.0, 1.8, -2.25, dwell=0)
w("angelica", T, 231.0, -0.4, -2.0, 0, dwell=0.5)
w("laurens", T, 220.0, -3.3, -0.6, dwell=0)
w("laurens", T, 225.5, -2.4, -2.35, dwell=0)
w("laurens", T, 231.0, 0.4, -2.0, 0, dwell=0.5)
w("peggy", T, 222.0, 3.6, -0.6, dwell=0)
w("peggy", T, 228.0, 1.6, -2.6, dwell=0)
w("peggy", T, 232.0, -0.6, -2.7, 0)
off("lafayette", T, 225.0, "D-UC")
w("lafayette", T, 232.0, 0.6, -2.7, 0)
off("mulligan", T, 226.0, "D-UC")
w("mulligan", T, 233.0, 1.4, -2.6, 0)
w("eliza", T, 216.0, 3.4, 1.5, dwell=0)
w("eliza", T, 227.0, 3.3, -0.9, dwell=0)
w("eliza", T, 235.5, 0.3, -2.4, 0, dwell=1.0)
off("ens4", T, 228.0, "D-UC")
w("ens4", T, 235.5, -0.3, -2.4, 0, dwell=1.0)
# the processional down the lane (fan write-up order)
w("angelica", T, 236.5, -0.4, 2.2, dwell=0)
w("angelica", T, 238.5, 1.3, 3.3, -30)
w("laurens", T, 236.5, 0.4, 2.2, dwell=0)
w("laurens", T, 238.5, -1.3, 3.3, 30)
w("peggy", T, 233.0, -0.4, -2.0, 0, dwell=0.5)
w("lafayette", T, 233.0, 0.4, -2.0, 0, dwell=0.5)
w("peggy", T, 238.0, -0.4, 1.8, dwell=0)
w("peggy", T, 240.0, 1.9, 2.9, -30)
w("lafayette", T, 238.0, 0.4, 1.8, dwell=0)
w("lafayette", T, 240.0, -1.9, 2.9, 30)
w("mulligan", T, 234.5, 0.0, -1.9, 0, dwell=0)      # the petals
w("mulligan", T, 239.0, 0.0, 1.4, dwell=0)
w("mulligan", T, 241.0, 2.8, 3.2, -30)
w("eliza", T, 242.5, 0.0, 2.8, 0)
w("ens4", T, 242.5, -0.6, 2.8, 0)
# Q320 he hands her to Hamilton; the couple DC; Q322 the kiss on the chord
w("eliza", T, 244.4, -0.35, 2.4, 90)             # SPOT: Q320 the couple DC in ch12/ch14 (+-0.47, 2.31)
w("ens4", T, 245.0, -1.1, 2.0, 60)
w("hamilton", T, 244.0, 0.45, 2.45, -90)          # he steps up to take her

# ================================================================= 1-11 SATISFIED
T = "1-11"
# the reception: "the ensemble forms a semicircle along the back of the stage" (fan write-up). R2: the eight ensemble
# with Washington and Lafayette (ten, was fourteen); Burr, Mulligan and Schuyler are not in it.
SEMI = ["ens6", "ens2", "washington", "ens7", "ens3", "ens8", "ens5", "lafayette", "ens9", "ens10"]
SEMI_H = {a: 8.5 + 7.0 * i / (len(SEMI) - 1) for i, a in enumerate(SEMI)}
off("mulligan", T, 6.0, "W-DSL")
off("ens4", T, 5.0, "W-DSR", label="Ensemble 4")
for a in SEMI:
    x, z = clock(3.2, SEMI_H[a])
    if a == "ens2":                       # the soldier with the tray goes round the room first
        w(a, T, 3.0, -0.6, -0.3, dwell=0)
        w(a, T, 6.0, 1.2, 0.2, dwell=0)
    w(a, T, 9.5, x, z, face(x, z, 0, 3.3))
# Laurens takes the floor and sweeps the room; Angelica DC with Peggy and Laurens beside her
w("laurens", T, 2.5, -2.4, 1.6, dwell=0)
w("laurens", T, 4.5, -1.0, 0.0, dwell=0)
w("laurens", T, 6.5, 1.2, 0.3, dwell=0)
w("laurens", T, 9.6, 0.9, 3.0, -20)
w("angelica", T, 9.6, 0.0, 3.3, 0)
w("peggy", T, 9.0, -0.9, 3.0, 20)
# the couple to DL
w("hamilton", T, 6.0, 2.4, 3.9, -40)
w("eliza", T, 6.0, 3.0, 3.4, -40)
# Q366 freeze ... Q366.2 the rewind: the turntable runs CLOCKWISE; everyone in reverse
for a in SEMI:
    ring(a, T, 46.7, 57.6, 3.2, SEMI_H[a], SEMI_H[a] + 1.5, f=0, step=0.75, start=True)
w("angelica", T, 46.7, 0.0, 3.3, 0, dwell=0)
w("angelica", T, 57.6, 0.0, 2.25, 0)                     # walks backward upstage (SPOT: to the centre, photo 366.01/368)
w("peggy", T, 46.7, -0.9, 3.0, 20, dwell=0)
w("peggy", T, 52.0, -1.6, 4.2, 20)
w("laurens", T, 46.7, 0.9, 3.0, -20, dwell=0)
w("laurens", T, 52.0, 1.2, 4.3, -30)
off("laurens", T, 60.0, "W-DSL")
# the couple walks backward to centre, the kiss reversed, and turns out of it
w("hamilton", T, 46.7, 2.4, 3.9, -40, dwell=0)
w("eliza", T, 46.7, 3.0, 3.4, -40, dwell=0)
w("hamilton", T, 50.5, -0.35, 1.6, 90, dwell=1.0)
w("eliza", T, 50.5, 0.35, 1.6, -90, dwell=1.0)
w("hamilton", T, 57.5, -3.2, 3.0, 50)                    # Q366.01 DR pool: frozen, as before Helpless (photo 366.01)
w("eliza", T, 57.5, 3.7, -1.0, -40)                      # Q366.01 UL pool
# Q368 lose outside pools: Eliza, Peggy slip away; Angelica alone (photo 368: one figure, centre)
off("eliza", T, 64.5, "W-MSL")
off("peggy", T, 60.0, "W-DSR")
# the ensemble re-forms as the ball (four couples on the upstage half), then turns CCW as silhouettes (Q369).
# Washington leaves; Lafayette stays near Angelica for the replay; Burr comes on beside Hamilton.
CPL2 = list(zip(MEN, WOMEN))
CPL2_H = [9.0, 11.0, 13.0, 15.0]
for (m, wo), h in zip(CPL2, CPL2_H):
    for a, r in ((m, 1.3), (wo, 1.9)):
        x, z = clock(r, h)
        w(a, T, 66.0, x, z, 0)
        ring(a, T, 71.6, 98.0, r, h, h - 2.0, f=0, step=1.0, start=True)
off("washington", T, 66.0, "W-USR")
off("burr", T, 58.0, "W-DSR")
w("burr", T, 66.0, -4.0, 3.9, 40)                       # beside Hamilton's DR pool (fan write-up: he goes to talk to Burr)
w("lafayette", T, 66.0, 0.9, 2.7, -20)
# Q370 first sight: Hamilton frozen DR (fan write-up); he approaches, pushes Lafayette aside (the ball replayed)
w("hamilton", T, 91.0, -3.2, 3.0, 50, dwell=0.5)
w("hamilton", T, 94.8, -1.0, 4.3, dwell=0)
w("hamilton", T, 96.8, 1.0, 3.45, -80)
w("lafayette", T, 96.5, 1.7, 1.9, -50)
# Q371 the conversation DC, nose to nose; he counters round her to Burr
w("hamilton", T, 99.4, 0.6, 3.3, -70)
w("angelica", T, 99.4, -0.1, 3.2, 70)
w("hamilton", T, 120.5, 0.3, 4.2, dwell=0)
w("hamilton", T, 122.5, -0.9, 3.9, dwell=0)
w("hamilton", T, 126.0, -2.9, 3.5, -70)                 # back to Burr DR
w("angelica", T, 126.0, 0.0, 3.6, -20)
# Q372 Angelica's rap: the ball starts again - the couples turn CCW; the double twirl with her sisters
for (m, wo), h in zip(CPL2, CPL2_H):
    for a, r in ((m, 1.3), (wo, 1.9)):
        ring(a, T, 130.4, 158.5, r, h - 2.0, h - 12.0, f=0, step=1.0, start=True)   # SPOT: they park on the upstage half, clear of her DC specials
off("eliza", T, 126.0, "W-MSL")
off("peggy", T, 126.0, "W-MSL")
w("eliza", T, 133.0, -0.8, 4.4, 20)
w("peggy", T, 133.0, 0.8, 4.4, -20)
w("angelica", T, 133.0, 0.0, 3.6, 0)
off("lafayette", T, 128.0, "W-MSL")
off("burr", T, 134.0, "W-DSR")
# Washington enters and dances with her (fan write-up), then goes up to greet Hamilton
off("washington", T, 136.0, "W-DSR")
w("washington", T, 143.0, -0.95, 3.5, 60)
w("angelica", T, 143.5, -0.2, 3.7, -60)
w("peggy", T, 141.0, 2.6, 3.8, -30)
off("peggy", T, 147.0, "W-DSL")
# Hamilton back to the steps UL; the first-sight tableau; Eliza in the UL pool
w("hamilton", T, 150.0, 2.45, -2.45, -30, y="top")
w("washington", T, 147.5, 3.0, 2.6, dwell=0)            # round outside the turning couples
w("washington", T, 152.0, 1.8, -1.6, 60)
w("eliza", T, 159.4, 3.6, -0.4, -30)
w("angelica", T, 160.0, 0.0, 3.6, 0)
w("angelica", T, 173.8, 0.0, 2.25, 0)                    # SPOT: Q374 her two X4s (+-0.13, 2.22); Q375 ch93 (0, 2.27)
# Q374 freeze - Angelica alone DC; Q375 count 1
w("washington", T, 183.0, 1.8, -1.6, 60, dwell=0.5)
off("washington", T, 190.0, "W-MSL")
# she fetches him from the steps and brings him to Eliza (Q376 the introduction replayed)
w("angelica", T, 188.15, 2.2, 1.3, dwell=0)           # SPOT: round the frozen men
w("angelica", T, 190.5, 1.75, -1.75, 50)
w("hamilton", T, 196.0, 2.9, -0.5, 60)
w("angelica", T, 195.5, 2.4, -0.1, 40)
w("angelica", T, 201.7, 2.3, 1.7, dwell=0)            # SPOT: round the frozen men
w("angelica", T, 203.5, 0.0, 2.25, 0)                    # SPOT: Q377 count 2, ch93
# Q377 count 2: Hamilton in a spotlight, "the ensemble men form a line with Hamilton ... turn him toward Eliza"
MLINE = [("laurens", -2.4), ("ens2", -1.6), ("ens3", -0.8), ("ens5", 0.0), ("ens10", 0.8)]
off("laurens", T, 199.0, "W-MSR")
for a, x in MLINE:
    w(a, T, 206.0, x, 0.6, 0)
w("hamilton", T, 206.0, 1.6, 0.6, 0)
w("hamilton", T, 212.0, 1.6, 0.6, face(1.6, 0.6, 3.6, -0.4))
MEXIT = {"laurens": "W-USR", "ens2": "W-MSR", "ens3": "W-DSR", "ens5": "W-USR", "ens10": "W-MSL"}
for j, (a, x) in enumerate(MLINE):
    w(a, T, 213.0, x, 0.6, 60, dwell=1.0 + 1.2 * (j % 3))
    off(a, T, 224.0 + 1.2 * (j % 3), MEXIT[a])
# the women: upstage after the freeze, then the letters held up (Q380)
for i, a in enumerate(WOMEN):
    x = -2.4 + 1.2 * i
    w(a, T, 186.0, x, -2.2, 0)
    w(a, T, 237.0, x, -1.2, 0, dwell=0.5 + 0.6 * i)
    off(a, T, 243.0 + 1.0 * i, ["W-USR", "W-MSR", "W-USL", "W-MSL"][i])
# Q380 confession: Hamilton leaves, Eliza crosses to Peggy, they meet Angelica centre (the letters)
off("hamilton", T, 232.0, "W-MSL")
off("peggy", T, 230.0, "W-DSL")
w("peggy", T, 236.0, 1.6, 3.3, -40)
w("eliza", T, 238.0, 1.0, 2.95, -10)
w("angelica", T, 239.0, 0.35, 2.6, 30)
w("angelica", T, 242.0, 0.0, 2.25, 0)                    # SPOT: Q382 her X4s only (+-0.13, 2.22)
# Q381 night fantasy: Hamilton DR in a pool, Eliza in the opposite upstage corner; the ensemble has gone
off("hamilton", T, 236.0, "W-DSR")
w("hamilton", T, 243.4, -2.8, 3.4, 30)
w("eliza", T, 245.5, 3.4, -0.8, -30)
w("peggy", T, 244.0, 2.6, 3.7, -30)
# Eliza comes down to Peggy and puts the letters in the box
w("eliza", T, 252.5, 2.0, 3.2, 60)
# Q383 rewind forward (CCW) - Q384 back at the toast
off("hamilton", T, 257.0, "W-DSR")
w("hamilton", T, 264.0, -2.4, 3.6, 0, dwell=0)
w("hamilton", T, 267.0, 0.0, 1.4, dwell=0)              # SPOT: upstage of Angelica
w("angelica", T, 269.6, 0.0, 3.6, 0)                     # SPOT: back down to the toast spot after Peggy passes
w("hamilton", T, 269.8, 2.4, 3.9, -40)
w("eliza", T, 269.8, 3.0, 3.4, -40)
w("peggy", T, 266.5, 1.0, 2.3, dwell=0)
w("peggy", T, 269.5, -0.9, 3.0, 20)
off("laurens", T, 262.0, "W-DSL")
w("laurens", T, 269.5, 0.9, 3.0, -20)
for a in SEMI:
    h = SEMI_H[a]
    x, z = clock(3.2, h + 0.8)
    ent = wing(x, z)
    if ent == "W-MSR" and SEMI.index(a) % 2 == 1:
        ent = "W-USR"                      # REVIEW: split the SR re-entry over two wings
    off(a, T, 256.0 + 0.4 * (SEMI.index(a) % 4), ent)
    w(a, T, 266.1, x, z, 0, dwell=0)
    ring(a, T, 266.1, 269.8, 3.2, h + 0.8, h, f=face(*clock(3.2, h), 0, 3.3), step=0.75, start=False)
# the toast replayed: Washington's pep talk with Hamilton; the tray man swirls round Angelica
xw0, zw0 = clock(3.2, SEMI_H["washington"])
w("washington", T, 274.0, 1.9, 2.4, 70, dwell=7.0)
w("washington", T, 283.5, 1.9, 0.3, dwell=0)              # back round upstage of the couple's kiss
w("washington", T, 286.0, -0.9, -0.7, dwell=0)
w("hamilton", T, 274.5, 2.6, 2.65, -100)
w("washington", T, 288.0, xw0, zw0, face(xw0, zw0, 0, 3.3))
x2, z2 = clock(3.2, SEMI_H["ens2"])
for _t, _x, _z in ((271.5, -1.6, 3.6), (272.6, -0.9, 4.6), (273.7, 0.4, 4.85), (274.9, 1.5, 4.1),
                   (275.9, 1.6, 3.0), (277.2, 0.5, 2.15), (278.3, -0.9, 2.2)):
    w("ens2", T, _t, _x, _z, dwell=0)
w("ens2", T, 281.0, x2, z2, face(x2, z2, 0, 3.3))
# Eliza kisses Angelica's cheek, meets Hamilton at centre, the kiss, back to their spot
w("eliza", T, 280.0, 0.55, 3.5, -60)
w("eliza", T, 284.0, 0.3, 1.9, -90)
w("hamilton", T, 284.5, -0.3, 1.9, 90)
w("eliza", T, 291.0, 3.0, 3.4, -40)
w("hamilton", T, 291.0, 2.4, 3.9, -40)
# the ending: Eliza to Angelica, then away; Hamilton walks past, stops before her, follows Eliza
w("eliza", T, 302.0, 0.6, 3.6, -60)
w("eliza", T, 304.0, 0.3, 4.4, dwell=0)
off("eliza", T, 311.0, "W-DSR")
w("hamilton", T, 307.0, 0.3, 4.3, 180, dwell=1.5)
off("hamilton", T, 315.0, "W-DSR")
# Q387 the company falls away
for i, a in enumerate(SEMI):
    x, z = clock(3.2, SEMI_H[a])
    w(a, T, 300.0 + 0.1 * i, x, z, face(x, z, 0, 3.3), dwell=3.0 + 1.1 * (i % 5))
    off(a, T, 309.0 + 1.1 * (i % 5) + 0.05 * i, wing(x, z))
off("peggy", T, 310.0, "W-DSR")
off("laurens", T, 310.0, "W-DSL")
# Angelica alone; out in the blackout
w("angelica", T, 325.6, 0.0, 3.6, 0, dwell=0)
off("angelica", T, 328.5, "W-DSL")


# ---------------------------------------------------------------- tidy, check, write
def key(d):
    return (ORDER.index(d["track"]), d["at"])


# REVIEW (seg 2 reviewer): deck legs must not pass through the stairs' footprints or the proscenium posts.
# Most entrance/exit legs to W-MSR ran straight through the SR stair. Insert one walk-through detour
# point round the obstacle, timed so the body still arrives on time at a walk.
TSTART = {"1-07": 0.0, "1-08": 208.0, "1-09": 529.0, "1-10": 598.0, "1-11": 847.0}
OBST = {"SR stair": ((-4.8, -4.2, -0.25, 1.8), [(-4.5, 2.15), (-4.45, -0.55)]),
        "SL stair": ((2.25, 4.45, -2.8, -2.1), [(2.05, -1.9), (4.55, -1.9), (2.05, -3.05)]),
        "post SR": ((-6.65, -6.35, 3.9, 4.4), [(-6.5, 4.7), (-6.5, 3.6)]),
        "post SL": ((6.35, 6.65, 3.9, 4.4), [(6.5, 4.7), (6.5, 3.6)])}


def _abs(p):
    return TSTART[p["track"]] + p["at"]


def _hits(x0, z0, x1, z1):
    out = []
    for name, ((bx0, bx1, bz0, bz1), _) in OBST.items():
        for k in range(1, 60):
            f = k / 60
            x = x0 + f * (x1 - x0); z = z0 + f * (z1 - z0)
            if bx0 <= x <= bx1 and bz0 <= z <= bz1:
                out.append(name)
                break
    return out


def detour_all():
    n = 0
    for a, lst in W.items():
        lst.sort(key=key)
        i = 0
        while i < len(lst) - 1:
            p, q = lst[i], lst[i + 1]
            if (p.get("off") and q.get("off")) or p.get("y") or q.get("y"):
                i += 1
                continue
            hit = _hits(p["x"], p["z"], q["x"], q["z"])
            if not hit:
                i += 1
                continue
            best = None
            for dx, dz in OBST[hit[0]][1]:
                if math.hypot(dx - p["x"], dz - p["z"]) < 0.05 or math.hypot(dx - q["x"], dz - q["z"]) < 0.05:
                    continue
                if _hits(p["x"], p["z"], dx, dz) or _hits(dx, dz, q["x"], q["z"]):
                    continue
                d1 = math.hypot(dx - p["x"], dz - p["z"]); d2 = math.hypot(q["x"] - dx, q["z"] - dz)
                if best is None or d1 + d2 < best[0]:
                    best = (d1 + d2, dx, dz, d1, d2)
            if best is None:
                # two detour points (e.g. round a post and then a stair)
                pts = [c for _, cs in OBST.values() for c in cs]
                for c1 in pts:
                    for c2 in pts:
                        if c1 == c2 or math.hypot(c1[0] - p["x"], c1[1] - p["z"]) < 0.05 or _hits(p["x"], p["z"], *c1) or _hits(*c1, *c2) or _hits(c2[0], c2[1], q["x"], q["z"]):
                            continue
                        L = (math.hypot(c1[0] - p["x"], c1[1] - p["z"]) + math.hypot(c2[0] - c1[0], c2[1] - c1[1])
                             + math.hypot(q["x"] - c2[0], q["z"] - c2[1]))
                        if best is None or L < best[0]:
                            best = (L, c1, c2)
                if best is None:
                    print("no detour for", a, p["track"], p["at"], hit)
                    i += 1
                    continue
                # insert the first point only; the loop then re-checks the rest of the leg
                L, c1, c2 = best
                d1 = math.hypot(c1[0] - p["x"], c1[1] - p["z"])
                best = (L, c1[0], c1[1], d1, L - d1)
            _, dx, dz, d1, d2 = best
            t0, t1 = _abs(p), _abs(q)
            dep = t0 + p["dwell"] if "dwell" in p else max(t0, t1 - (d1 + d2) / 1.3)
            td = dep + (t1 - dep) * d1 / (d1 + d2)
            td = min(max(td, t0 + 0.3), t1 - 0.3)
            tr = max((k for k in ORDER if TSTART[k] <= td), key=lambda k: TSTART[k])
            if "dwell" not in p and not p.get("off"):
                p["dwell"] = round(max(0.0, dep - t0), 2)
            elif "dwell" not in p and p.get("off"):
                p["dwell"] = round(max(0.0, dep - t0), 2)
            lst.insert(i + 1, {"track": tr, "at": round(td - TSTART[tr], 2), "x": dx, "z": dz, "dwell": 0})
            n += 1
            i += 1
    return n


print("detours inserted:", detour_all())

problems = []
for a, lst in W.items():
    lst.sort(key=key)
    for p, q in zip(lst, lst[1:]):
        if key(p) == key(q):
            problems.append("%s: two waypoints at %s %s" % (a, p["track"], p["at"]))
    if not lst[-1].get("off"):
        problems.append("%s: does not end offstage" % a)
    if not lst[0].get("off") or not lst[0].get("label"):
        problems.append("%s: first waypoint not a labelled off" % a)
    last = lst[-1]
    if last["track"] == "1-11" and last["at"] > LEN["1-11"] - 0.5:
        problems.append("%s: ends too late" % a)
if problems:
    print("\n".join(problems))
    sys.exit(1)

notes = open(os.path.join(HERE, "seg2-notes.txt"), encoding="utf-8").read().strip() if os.path.exists(
    os.path.join(HERE, "seg2-notes.txt")) else ""
doc = {"segment": 2, "tracks": ORDER, "waypoints": {a: W[a] for a in LABEL0 if a in W}, "notes": notes}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(doc, fh, indent=1)
print("wrote", OUT, sum(len(v) for v in W.values()), "waypoints")
for a in LABEL0:
    print(" ", a, len(W[a]))
