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

# ================================================================= 1-07 YOU'LL BE BACK
T = "1-07"
k = "king"
w(k, T, 3.5, 0.0, -2.3, 0, dwell=38.3)        # revealed UC (Q190.01), holds till the chorus
w(k, T, 49.0, 0.0, 4.1, 0)                     # Q194 George DC (Binkley's ch 93 special lands at (0, 4.2)) - a stately walk
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

# Q196 Group Enters: the company in a semicircle behind the King, Q198 Group Exits
for i, a in enumerate(ENS):
    phi = math.radians(-100 + 200 * i / 9)
    x, z = 2.4 * math.sin(phi), 4.0 - 2.4 * math.cos(phi)
    srside = x < 0
    ent = ("W-DSR" if z > 2.8 else "W-MSR") if srside else ("W-DSL" if z > 2.8 else "W-MSL")
    off(a, T, 177.0 + 0.3 * i, ent)
    w(a, T, 183.5, x, z, 0)
    # the sing-along sway: the arc steps one way, then back
    phi2 = phi + math.radians(8)
    w(a, T, 189.5, 2.4 * math.sin(phi2), 4.0 - 2.4 * math.cos(phi2), 0)
    w(a, T, 194.0, x, z, 0, dwell=2.5)
    off(a, T, 202.0 + 0.2 * i, ent)

# ================================================================= 1-08 RIGHT HAND MAN
T = "1-08"
# Opening company: two rows marching, Burr narrating DL, the spy (ens1) and a redcoat (ens5) DR.
FRONT = [("ens6", -3.0), ("laurens", -1.8), ("hamilton", -0.6), ("mulligan", 0.6), ("lafayette", 1.8), ("ens7", 3.0)]
BACK = [("ens8", -3.0), ("ens2", -1.8), ("ens3", -0.6), ("ens4", 0.6), ("ens10", 1.8), ("ens9", 3.0)]
for a, x in FRONT:
    if a in ("hamilton", "laurens"):
        off(a, "1-07", 205.0, "W-MSR")
    elif a in ("mulligan", "lafayette"):
        off(a, "1-07", 205.0, "W-MSL")
    w(a, T, 6.0, x, 1.4, 0)
    w(a, T, 16.0, x, 2.0, 0)              # the march forward
for a, x in BACK:
    w(a, T, 6.5, x, 0.0, 0)
    w(a, T, 16.5, x, 0.6, 0)
off("burr", "1-07", 205.0, "W-DSL")
w("burr", T, 6.0, 3.6, 3.5, -25)
# the spy and the redcoat DR: Q202.01 DR bax up, Q204 Kill DR at 22.22
w("ens1", T, 5.5, -2.1, 3.65, 20)          # in Binkley's Kill 1 pools (Q204 preset 224)
w("ens5", T, 6.0, -2.9, 3.0, 50)
w("ens5", T, 21.6, -2.3, 3.2, 40)         # steps in behind her
w("ens1", T, 23.0, -2.0, 3.7, 0, dwell=3.0)  # the kill - she drops
off("ens1", T, 31.0, "W-DSR")             # carried off
off("ens5", T, 31.5, "W-DSR")

# Q206 Hamilton DSC - his verse
w("hamilton", T, 29.6, -1.2, 3.7, 0)        # Binkley's 'Ham dsc' (preset 259), lit again in Q274
w("hamilton", T, 66.0, -1.2, 3.7, 40)       # the General arrives beside him (Q274 lights 259 and the lane)
# Q208 build - company presses forward
for a, x in FRONT:
    if a != "hamilton":
        w(a, T, 44.5, x * 1.08, 2.6, 0)
for a, x in BACK:
    w(a, T, 45.0, x * 1.08, 1.2, 0)

# Q274 Here comes the General: the company splits to make the centre lane; Burr announces DL.
LANE = {"ens6": (-2.1, 2.3), "laurens": (-1.8, 1.0), "ens8": (-1.8, -0.6), "ens4": (-3.0, 1.8), "ens9": (-3.0, 0.2),
        "mulligan": (1.8, 1.0), "lafayette": (1.8, -0.6), "ens7": (3.0, 1.8), "ens10": (3.0, 0.2)}
for a, (x, z) in LANE.items():
    w(a, T, 52.5, x, z, -60 if x > 0 else 60)
w("burr", T, 53.0, 3.7, 3.7, -40)
# Washington and his file (ens2, ens3) down the lane from the door
w("washington", T, 53.6, 0.0, -2.0, 0, dwell=0)
w("washington", T, 58.5, 0.0, 0.95, dwell=0)
w("washington", T, 64.9, -0.1, 3.5, -20)                # SPOT: in Q274.01's DSC X4s ch42/45 (0, 4.05) for the chorus
w("ens2", T, 52.0, -0.6, -2.7, 0, dwell=1.8)
w("ens3", T, 52.0, 0.6, -2.7, 0, dwell=1.8)
w("ens2", T, 60.0, -0.6, -0.4, 0)
w("ens3", T, 60.0, 0.6, -0.4, 0)
w("ens2", T, 67.0, -2.4, -1.6, 30)
w("ens3", T, 67.0, 2.4, -1.6, -30)
off("burr", T, 72.0, "W-DSL")             # Burr leaves after the introduction

# Q278 Path up - Washington's verse DC, the company peeled to SR (photo 278)
SRB = ["hamilton", "laurens", "lafayette", "mulligan", "ens2", "ens3", "ens4", "ens5", "ens6", "ens7", "ens8", "ens9", "ens10"]
slots = [(-1.9, 2.4), (-2.7, 2.6), (-3.5, 2.8), (-1.9, 1.3), (-2.7, 1.4), (-3.5, 2.0),
         (-1.9, 0.2), (-2.7, 0.3), (-3.4, -0.6), (-1.9, -0.9), (-2.7, -0.8), (-1.9, -2.0), (-2.7, -1.9)]
for a, (x, z) in zip(SRB, slots):
    if a == "ens5":
        w(a, T, 79.0, x, z, 50)           # comes back on from SR to join the block
    else:
        w(a, T, 79.5, x, z, 50)
w("washington", T, 79.0, 0.0, 3.4, 0)
w("washington", T, 90.0, 1.1, 3.2, -15)
w("washington", T, 104.0, 0.0, 3.0, 0)     # after the cannon boom, the retreat
# the cannon boom: the block flinches upstage
for a, (x, z) in zip(SRB, slots):
    w(a, T, 102.2, x - 0.3, z - 0.3, 50)

# Q279.5 chorus 2 - company floods back in two rows, Washington DC
CH2F = [("ens6", -3.3), ("laurens", -2.2), ("hamilton", -1.1), ("mulligan", 1.1), ("lafayette", 2.2), ("ens7", 3.3)]
CH2B = [("ens8", -3.0), ("ens2", -2.0), ("ens3", -1.0), ("ens4", 0.0), ("ens5", 1.0), ("ens10", 2.0), ("ens9", 3.0)]
for a, x in CH2F:
    w(a, T, 116.5, x, 2.0, 0)
for a, x in CH2B:
    w(a, T, 117.0, x, 0.4, 0)
w("washington", T, 116.0, 0.0, 3.5, 0)

# Q280 battle: scatter into the fight; booms SR, SL, upstage; Q282.5 retreat north
BAT = {"ens6": (-3.2, 2.6), "laurens": (-2.0, 1.4), "ens2": (-0.8, 2.8), "mulligan": (0.8, 2.0), "ens7": (1.8, 3.2),
       "lafayette": (3.0, 1.6), "ens8": (-3.0, 0.0), "ens3": (-1.6, -0.6), "ens4": (1.4, -0.4), "ens10": (2.8, 0.0),
       "ens5": (-0.2, -1.4), "ens9": (-2.6, -1.8)}
w("hamilton", T, 129.6, 0.0, 0.8, 0)
w("washington", T, 129.0, -3.5, -1.2, 30)
for a, (x, z) in BAT.items():
    w(a, T, 129.6, x, z, face(x, z, 0, 0.8) if (a in ("laurens", "mulligan")) else 0)
    if x < -1:
        w(a, T, 142.6, x + 0.5, z, 60)             # SR cannon
    elif x > 1:
        w(a, T, 145.6, x - 0.5, z, -60)            # SL cannon
    else:
        w(a, T, 148.6, x, z + 0.5, 0)              # upstage boom
w("hamilton", T, 145.0, 0.6, 0.2, -30)
w("hamilton", T, 149.0, -0.4, 1.0, 20)
# retreat north: everyone upstage and off; Hamilton last
for a, (x, z) in BAT.items():
    ent = "W-USR" if x < 0 else "W-USL"
    off(a, T, 158.5 + (0.3 if z > 1 else 0.0), ent)
off("hamilton", T, 160.0, "W-USL")
# Q283 Washington alone DC
w("washington", T, 163.5, 0.0, 2.45, 0)                # SPOT: Q283 the white shaft ch93 lands at (0, 2.37), r 0.75
# Q283.5 night march: the company files SL -> SR along z -1.8
MARCH = ["laurens", "lafayette", "mulligan", "ens2", "ens3", "ens4", "ens5", "ens6", "ens7", "ens8", "ens9", "ens10"]
for i, a in enumerate(MARCH):
    t0 = 165.0 + 0.6 * i
    off(a, T, t0, "W-USL")
    w(a, T, t0 + 3.4, 3.8, -0.45, dwell=0)              # SPOT: the file walks through Q283.5's row of blue VL shafts (z -0.41)
    w(a, T, t0 + 8.0, -3.6, -0.45, dwell=0)
    off(a, T, t0 + 11.0, "W-USR")
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
# the two men: Washington comes round the desk
# SPOT: Washington keeps to the desk's shaft (VL ch74 (-0.06, 1.14) and the desk pool ch13), Hamilton to his pool
# DL of the desk (ch4 (1.37, 2.33)); for the duet (Q286-Q287.5) the two keys are ch4 (Hamilton) and ch2 (-1.78, 2.54).
w("washington", T, 226.0, -0.3, 1.75, 75)
w("hamilton", T, 228.0, 1.1, 2.6, -75)
w("washington", T, 251.0, 0.15, 1.8, 70)       # Q285.5 advice - the two specials tighten
w("hamilton", T, 252.0, 0.95, 2.4, -100)
w("hamilton", T, 266.0, 1.25, 2.85, -10)       # Q286 Hamilton accepts - steps out into his key
w("washington", T, 277.0, -1.6, 2.75, 20)      # Q286.5 Washington takes the chorus, in ch2
w("hamilton", T, 290.0, 1.25, 2.6, -15)
# Q288 finale: the company in an arc on the outer ring behind the two men
FIN = ["ens6", "ens2", "laurens", "ens8", "ens3", "ens1", "ens4", "mulligan", "ens5", "ens9", "lafayette", "ens10", "ens7"]
for i, a in enumerate(FIN):
    h = 8.5 + 7.0 * i / (len(FIN) - 1)
    x, z = clock(3.2, h)
    if x > 0:
        off(a, T, 290.0, "W-MSL")
    else:
        off(a, T, 290.0, "W-MSR")
    w(a, T, 302.5, x, z, 0, dwell=9.6 + 0.6 * (i % 3))   # holds through the finale, Q288.5 recedes
    # each leaves for the wing nearest its place on the arc, so neighbours do not cross
    ent = ("W-DSR" if h < 9.3 else "W-MSR" if h < 10.5 else "W-USR" if h < 11.7 else "D-UC" if h < 12.8 else
           "W-USL" if h < 14.0 else "W-MSL" if h < 14.7 else "W-DSL")
    off(a, T, 317.6 + 0.4 * (i % 3), ent)
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
w("burr", T, 50.5, -3.9, 4.0, 30)               # Q292 the ball: Burr DR
# the desk: Washington, Hamilton at his right hand
off("washington", T, 8.0, "W-MSR")
w("washington", T, 17.0, -0.3, 0.2, 0)
off("hamilton", T, 8.5, "W-MSR")
w("hamilton", T, 18.2, -1.5, 0.4, 20)
off("washington", T, 40.0, "W-USR")             # leaves as the men take over
# Q291 refrain - the men round Hamilton
w("hamilton", T, 35.0, 0.0, 1.8, 0)
w("laurens", T, 35.5, -1.1, 2.4, 20)
w("lafayette", T, 35.5, 1.1, 2.4, -20)
w("mulligan", T, 36.0, 1.9, 1.3, -30)
MEN = ["ens2", "ens3", "ens4", "ens5", "ens10"]
WOMEN = ["ens6", "ens7", "ens8", "ens9", "ens1"]
for i, a in enumerate(MEN):
    x = -2.4 + 1.2 * i
    w(a, T, 36.5, x, -0.6, 0)
# Q292 the ball: couples on the turntable's upstage half (man r 2.0, woman r 2.6)
CPL_H = [9.5, 11.0, 12.5, 14.0, 15.5]           # 15.5 == 3.5 o'clock
for i, (m, wo) in enumerate(zip(MEN, WOMEN)):
    h = CPL_H[i]
    xm, zm = clock(1.6, h)
    xw, zw = clock(2.2, h)
    off(wo, T, 42.0, "W-USR" if math.sin(math.radians(h * 30)) < 0 else "W-USL")
    w(m, T, 50.5, xm, zm, 0)
    w(wo, T, 51.0, xw, zw, 0)
# Hamilton and the men drift SR to Burr
w("hamilton", T, 51.0, -3.0, 3.3, 20)
w("laurens", T, 51.5, -3.8, 2.6, 30)
w("mulligan", T, 52.5, -2.6, 2.2, 30)
w("lafayette", T, 50.0, -0.6, 2.5, -20)
# Q292.5 the sisters: Angelica and Peggy centre, Eliza in her own pool SL
off("angelica", T, 44.0, "D-UC")
off("peggy", T, 44.0, "D-UC")
W["angelica"][-1]["x"] = 0.7
W["peggy"][-1]["x"] = 1.25
w("angelica", T, 52.3, -0.4, 1.6, 0)            # SPOT: in the sisters' centre pool ch13 (-0.04, 1.84)
w("peggy", T, 52.3, 0.4, 1.6, 0)
off("eliza", T, 46.0, "W-MSL")
w("eliza", T, 52.3, 3.1, 1.8, -20)               # SPOT: the centre of her own pool far SL, ch14 (3.05, 1.89)
# Angelica sees him; crosses on the diagonal with Lafayette at her side
w("angelica", T, 57.5, -2.1, 2.6, -60)
w("lafayette", T, 57.0, -1.5, 2.1, -60)
w("lafayette", T, 59.0, -1.2, 1.6, -40)          # pushed aside
w("hamilton", T, 58.5, -2.7, 3.0, 60)            # kisses her hand
w("hamilton", T, 60.0, -2.6, 3.7, dwell=0)        # circles her
w("hamilton", T, 61.3, -1.4, 3.3, dwell=0)
w("hamilton", T, 62.4, -1.5, 2.2, dwell=0)
w("hamilton", T, 63.8, -3.2, 3.4, 30)             # back to Burr
# Q293 build into Helpless: the turntable starts (couples CCW), Angelica back to the sisters SL
pass
w("peggy", T, 62.0, 3.9, 2.4, -20)

# ================================================================= 1-10 HELPLESS
T = "1-10"
w("angelica", T, 0.5, -2.1, 2.6, -60)             # Q300.3 part 2 'Sister DR out': she is still DR at the top
W["angelica"][-1]["dwell"] = 2.0
w("angelica", T, 5.0, 0.3, 3.75, dwell=0)        # round the downstage edge of the dancing ring
w("angelica", T, 7.6, 2.6, 3.3, dwell=0)
w("angelica", T, 9.5, 3.3, 1.8, -20)             # joins Peggy SL (Q300.3 photo: sisters SL, men SR)
w("eliza", T, 0.5, 3.4, 1.4, -20, dwell=1.5)
# Eliza spirals out to DSC for her chorus (Q300.4)
w("eliza", T, 5.0, 2.9, 3.4, dwell=0)
w("eliza", T, 8.0, 1.4, 4.4, dwell=0)
w("eliza", T, 11.3, 0.1, 3.75, 0)               # SPOT: Q300.4 her DSC key ch13 lands (0.1, 2.9); 0.6 m clear of the ring
# the men SR
w("hamilton", T, 0.5, -4.1, 3.6, 30, dwell=1.0)
off("hamilton", T, 6.0, "W-DSR")
w("burr", T, 0.5, -4.6, 4.1, 30, dwell=0.5)
off("burr", T, 4.0, "W-DSR")
w("laurens", T, 1.0, -4.1, 2.5, 40)
w("mulligan", T, 1.0, -3.4, 2.9, 40)

# the couples: CCW from the ball (WB 63.84) to Helpless 28.24, then dance, then chorus 2 CCW again
for i, (m, wo) in enumerate(zip(MEN, WOMEN)):
    h0 = CPL_H[i]
    # 1-09 63.84 -> 1-09 68.5: first steps of the turn (one hour)
    for a, r in ((m, 1.6), (wo, 2.2)):
        ring(a, "1-09", 63.84, 68.5, r, h0, h0 - 0.6, f=None, start=True, last_dwell=0)
        ring(a, T, 0.5, 28.2, r, h0 - 0.6, h0 - 12.0, f=0, step=1.0, start=False)
        # chorus 2 (Q301.4): another full turn CCW
        ring(a, T, 60.6, 84.5, r, h0 - 12.0, h0 - 24.0, f=0, step=1.0, start=True)
# Q300.6 ball memory: Angelica takes Peggy's hands, they charge down to Eliza - the triangle
w("angelica", T, 31.0, 0.0, 3.5, 0)
w("peggy", T, 31.0, 0.8, 4.2, -20)
w("eliza", T, 31.0, -0.8, 4.2, 20)
# spin out: Angelica with Washington, Mulligan sweeps Peggy away
off("washington", T, 25.0, "W-DSR")
w("washington", T, 33.5, -1.5, 3.4, 60)
w("angelica", T, 33.8, -0.8, 3.6, -60)
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
w("laurens", T, 62.0, 1.8, 3.4, -60)
w("peggy", T, 62.5, 1.2, 4.1, 60)
off("mulligan", T, 66.0, "W-DSL")
w("lafayette", T, 3.5, -4.4, 3.4, 30, dwell=40.0)
off("lafayette", T, 50.0, "W-DSR")
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
# Q301.8 the letters: the ensemble goes, two pools apart
for i, (m, wo) in enumerate(zip(MEN, WOMEN)):
    for j, (a, r) in enumerate(((m, 1.6), (wo, 2.2))):
        x, z = clock(r, CPL_H[i])
        off(a, T, 108.0 + 0.9 * i + 0.45 * j, wing(x, z))
off("ens4", T, 113.0, "W-DSR", label="Philip Schuyler")   # SPOT: from DSR, straight into the DR special
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
# SPOT: Q302 "Two weeks" lights two specials (part 3, up from about 120): ch25 DR (-3.62, 4.26) r 1.7 and ch26
# (2.95, 2.29) r 1.5, held through Q302.5/Q303. Continuing the letters (Hamilton DR in 25, Eliza SL in 26), 25 is
# Hamilton and Philip Schuyler's talk, on the outer ring's DR edge (on the turntable, backs half to the house), and 26
# is the sisters' bench on the outer ring SL. The ring turns CCW (half an hour) under both groups.
w("eliza", T, 114.5, 2.38, 3.09, -40)               # Eliza sits first, at the bench's downstage end
w("angelica", T, 115.8, 3.35, 3.2, dwell=0)         # Angelica round behind her
w("peggy", T, 115.9, 3.85, 2.7, dwell=0)            # Peggy round the outside to the upstage end
for a, r, h, f in (("hamilton", 3.5, 7.55, -120), ("ens4", 3.5, 7.95, 60), ("peggy", 3.2, 3.6, -50),
                   ("angelica", 3.2, 4.0, -50), ("eliza", 3.2, 4.4, -50)):
    x, z = clock(r, h)
    t0 = 117.5 if a == "ens4" else 117.0
    w(a, T, t0, x, z, f)
    ring(a, T, t0, 124.0, r, h, h - 0.5, f=f, start=False)
# Eliza runs across to him; they swirl in the DR special; Schuyler steps away upstage, his back to them
w("hamilton", T, 126.0, -2.4, 3.3, 60)
w("eliza", T, 126.5, -1.75, 3.55, -70)
w("hamilton", T, 127.5, -2.1, 3.05, dwell=0)
w("eliza", T, 127.5, -2.45, 3.95, dwell=0)
w("hamilton", T, 129.0, -2.7, 3.2, 40)
w("eliza", T, 129.0, -1.85, 3.7, -40)
w("angelica", T, 128.0, 3.05, 1.75, -60)            # the sisters stay on the bench, watching
w("peggy", T, 128.5, 3.2, 1.1, -60)
w("ens4", T, 126.5, -3.5, 1.5, 160)
# Q302.5 her father crosses: panic; Q303 he shakes Hamilton's hand (both back in 25)
w("ens4", T, 132.5, -3.45, 2.55, 45)
w("hamilton", T, 135.5, -2.75, 2.95, -120)
w("ens4", T, 136.0, -3.35, 2.6, 60)
# Q304 third chorus - the three sisters upstage; the men share a drink SR
w("eliza", T, 141.0, 0.1, -1.9, 0)
w("angelica", T, 141.0, -0.7, -1.5, 10)
w("peggy", T, 141.5, 0.9, -1.5, -10)
w("hamilton", T, 142.0, -2.4, 1.6, 40)
w("ens4", T, 142.0, -3.0, 1.0, 50)
# the sisters come down and dance; Eliza at centre for the climax
w("eliza", T, 156.0, 0.0, 1.8, 0)
w("angelica", T, 156.0, -0.8, 2.1, 20)
w("peggy", T, 156.0, 0.8, 2.1, -20)
# Q306 Hamilton's verse - the couple in one pool DC; the others leave
w("hamilton", T, 165.0, 0.4, 2.45, -40)          # SPOT: Q306/Q308/Q310 the DC pool is ch13 (0, 2.28)
w("eliza", T, 165.0, -0.4, 2.55, 40)
off("angelica", T, 168.0, "W-MSL")
off("peggy", T, 168.5, "W-MSL")
off("ens4", T, 169.0, "W-USR")
# Q310 his vow - he grabs her and spins her round
w("hamilton", T, 197.0, 0.45, 2.4, -40, dwell=0)  # SPOT: the spin, 0.8 m upstage; it ends in Q312's keys
w("hamilton", T, 198.4, 0.9, 1.6, dwell=0)
w("hamilton", T, 199.6, -0.3, 1.25, dwell=0)
w("hamilton", T, 201.0, -0.35, 2.4, 0)            # ch12 (-0.47, 2.31)
w("eliza", T, 197.0, -0.4, 2.55, 40, dwell=0)
w("eliza", T, 198.4, 0.1, 2.15, dwell=0)
w("eliza", T, 199.6, 0.4, 1.65, dwell=0)
w("eliza", T, 201.0, 0.45, 2.55, -30)            # ch14 (0.47, 2.31)
# Q312 the wedding: the women bring the signed letters in a line
for i, a in enumerate(WOMEN):
    x = -2.0 + 1.0 * i
    off(a, T, 196.0, "W-MSL" if x > 0 else "W-MSR")
    w(a, T, 203.5, x, 1.6, 0)
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
# the table spins and the guests dance: couples on the ring CCW
WED = [("ens2", "ens6", 10.5), ("ens3", "ens7", 12.0), ("ens5", "ens9", 1.5), ("ens10", "ens8", 3.0), ("ens4", "ens1", 13.5)]
for m, wo, h in WED:
    if m == "ens4":
        continue
    xm, zm = clock(2.0, h)
    off(m, T, 207.0, "W-MSR" if xm < 0 else "W-MSL")
    w(m, T, 214.0, xm, zm, 0)
    xw, zw = clock(2.6, h)
    w(wo, T, 214.0, xw, zw, 0)
    ring(m, T, 214.0, 229.0, 2.0, h, h - 2.0, f=0, start=False)
    ring(wo, T, 214.0, 229.0, 2.6, h, h - 2.0, f=0, start=False)
w("ens1", T, 214.0, *clock(2.6, 6.8), 0)      # ens1 (no partner yet) drifts with the ring
ring("ens1", T, 214.0, 229.0, 2.6, 6.8, 4.8, f=0, start=False)
# the aisle for the processional (Q316 wedding dance -> Q318)
AISLE = {"ens2": (-1.6, -1.0), "ens6": (-1.8, 0.0), "ens3": (-2.0, 1.0), "ens7": (-2.2, 2.0),
         "ens5": (1.6, -1.0), "ens9": (1.8, 0.0), "ens10": (2.0, 1.0), "ens8": (2.2, 2.0), "ens1": (1.5, -2.0)}
for a, (x, z) in AISLE.items():
    w(a, T, 233.0, x, z, 75 if x < 0 else -75)
# Hamilton waits at DC for his bride; Washington beside as the officiant
w("hamilton", T, 230.0, 0.35, 3.9, 180)
w("washington", T, 230.5, -0.9, 4.5, 160)
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
# the processional down the lane
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
# the reception: the company in a semicircle across the back (outer ring, 8:30 -> 3:30)
SEMI = ["ens6", "ens2", "washington", "ens7", "ens3", "burr", "ens8", "mulligan", "ens5", "ens9",
        "lafayette", "ens10", "ens1", "ens4"]
SEMI_H = {a: 8.5 + 7.0 * i / (len(SEMI) - 1) for i, a in enumerate(SEMI)}
off("burr", T, 0.5, "W-MSR")
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
# the couple walks backward to centre, the kiss reversed, and turns out of it
w("hamilton", T, 46.7, 2.4, 3.9, -40, dwell=0)
w("eliza", T, 46.7, 3.0, 3.4, -40, dwell=0)
w("hamilton", T, 50.5, -0.35, 1.6, 90, dwell=1.0)
w("eliza", T, 50.5, 0.35, 1.6, -90, dwell=1.0)
w("hamilton", T, 57.5, -3.2, 3.0, 50)                    # Q366.01 DR pool: frozen, as before Helpless
w("eliza", T, 57.5, 3.7, -1.0, -40)                      # Q366.01 UL pool
# Q368 lose outside pools: Eliza, Peggy, Laurens slip away; Angelica alone
off("eliza", T, 64.5, "W-MSL")                           # Q368 lose outside pools: she slips away SL
off("peggy", T, 60.0, "W-DSR")
# the ensemble re-forms as the ball: couples on the upstage half, then turns CCW as silhouettes
CPL2 = [("ens2", "ens6"), ("ens3", "ens7"), ("ens5", "ens9"), ("ens10", "ens1"), ("laurens", "ens8")]
CPL2_H = [9.0, 10.6, 12.2, 13.8, 15.4]
for (m, wo), h in zip(CPL2, CPL2_H):
    for a, r in ((m, 1.3), (wo, 1.9)):
        x, z = clock(r, h)
        w(a, T, 66.0, x, z, 0)
        ring(a, T, 71.6, 98.0, r, h, h - 2.0, f=0, step=1.0, start=True)
# the others of the ball: Burr DR, Schuyler SR, Lafayette by Angelica, Washington and Mulligan watch
w("burr", T, 66.0, -4.0, 3.9, 40)                       # beside Hamilton's DR pool
w("ens4", T, 66.0, -3.6, -1.2, 40)
w("washington", T, 66.0, -3.3, -2.2, 30)
w("mulligan", T, 66.0, 3.6, 2.6, -40)
w("lafayette", T, 66.0, 0.9, 2.7, -20)
# Q370 first sight: Hamilton UL; he approaches, pushes Lafayette aside (the ball replayed)
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
# Washington dances with her (the posture line), then goes up to greet Hamilton
w("washington", T, 143.0, -0.95, 3.5, 60)
w("angelica", T, 143.5, -0.2, 3.7, -60)
w("peggy", T, 141.0, 2.6, 3.8, -30)
off("peggy", T, 147.0, "W-DSL")
# Hamilton back to the steps UL; the first-sight tableau; Eliza in the UL pool
w("hamilton", T, 150.0, 2.45, -2.45, -30, y="top")
w("washington", T, 152.0, 1.8, -1.6, 60)
w("eliza", T, 159.4, 3.6, -0.4, -30)
w("angelica", T, 160.0, 0.0, 3.6, 0)
w("angelica", T, 173.8, 0.0, 2.25, 0)                    # SPOT: Q374 her two X4s (+-0.13, 2.22); Q375 ch93 (0, 2.27)
# Q374 freeze - Angelica alone DC; Q375 count 1
off("ens4", T, 175.0, "W-USR")
off("mulligan", T, 175.0, "W-DSL")
w("washington", T, 183.0, 1.8, -1.6, 60, dwell=0.5)
off("washington", T, 190.0, "W-MSL")
# she fetches him from the steps and brings him to Eliza (Q376 the introduction replayed)
w("angelica", T, 188.15, 2.2, 1.3, dwell=0)           # SPOT: round the frozen men
w("angelica", T, 190.5, 1.75, -1.75, 50)
w("hamilton", T, 196.0, 2.9, -0.5, 60)
w("angelica", T, 195.5, 2.4, -0.1, 40)
w("angelica", T, 201.7, 2.3, 1.7, dwell=0)            # SPOT: round the frozen men
w("angelica", T, 203.5, 0.0, 2.25, 0)                    # SPOT: Q377 count 2, ch93
# Q377 count 2: Hamilton in a spotlight, the men line up with him and turn him to Eliza
MLINE = [("laurens", -2.4), ("ens2", -1.6), ("ens3", -0.8), ("ens5", 0.0), ("ens10", 0.8)]
for a, x in MLINE:
    w(a, T, 206.0, x, 0.6, 0)
w("hamilton", T, 206.0, 1.6, 0.6, 0)
off("lafayette", T, 199.0, "W-MSL")
w("lafayette", T, 206.0, 2.4, 0.6, 0)
w("hamilton", T, 212.0, 1.6, 0.6, face(1.6, 0.6, 3.6, -0.4))
MEXIT = {"laurens": "W-USR", "ens2": "W-MSR", "ens3": "W-DSR", "ens5": "W-USR", "ens10": "W-MSL", "lafayette": "W-USL"}
for j, (a, x) in enumerate(MLINE + [("lafayette", 2.4)]):
    w(a, T, 213.0, x, 0.6, 60, dwell=1.0 + 1.2 * (j % 3))
    off(a, T, 224.0 + 1.2 * (j % 3), MEXIT[a])
# the women: upstage after the freeze, then the letters held up (Q380)
for i, a in enumerate(["ens6", "ens7", "ens9", "ens1", "ens8"]):
    x = -3.0 + 1.0 * i
    w(a, T, 186.0, x, -2.2, 0)
    w(a, T, 237.0, x, -1.2, 0, dwell=0.5 + 0.6 * i)
    off(a, T, 243.0 + 1.0 * i, ["W-USR", "W-MSR", "W-USL", "W-MSL", "W-DSL"][i])
# Q380 confession: Hamilton leaves, Eliza crosses to Peggy, they meet Angelica centre (the letters)
off("hamilton", T, 232.0, "W-MSL")
off("peggy", T, 230.0, "W-DSL")
w("peggy", T, 236.0, 1.6, 3.3, -40)
w("eliza", T, 238.0, 1.0, 2.95, -10)
w("angelica", T, 239.0, 0.35, 2.6, 30)
w("angelica", T, 242.0, 0.0, 2.25, 0)                    # SPOT: Q382 her X4s only (+-0.13, 2.22)
# Q381 night fantasy: Hamilton DR in a pool, Eliza in the opposite upstage corner
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
    off(a, T, 309.0 + 1.1 * (i % 5) + 0.05 * i, wing(x, z), label="Ensemble 4" if a == "ens4" else None)
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
