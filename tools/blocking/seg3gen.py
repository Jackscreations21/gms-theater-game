"""Generate segments/seg3.json: 1-12 .. 1-17 blocking (Story of Tonight reprise .. That Would Be Enough)."""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TRACKS = ["1-12", "1-13", "1-14", "1-15", "1-16", "1-17"]
LEN = {"1-12": 115.0, "1-13": 193.0, "1-14": 159.0, "1-15": 106.0, "1-16": 83.0, "1-17": 178.0}
START = {}
s = 0.0
for t in TRACKS:
    START[t] = s; s += LEN[t]

ENT = {"W-DSR": (-7.3, 4.6), "W-DSL": (7.3, 4.6), "W-MSR": (-8.5, 0.0), "W-MSL": (8.0, -0.5),
       "W-USR": (-8.5, -3.0), "W-USL": (8.5, -3.0), "D-UC": (1.25, -4.9)}
WALK = 1.3

P = {}  # actor -> list of waypoint dicts


def r3(v):
    return round(v, 3)


def add(actor, track, at, x, z, facing=None, dwell=None, off=False, label=None, y=None):
    w = {"track": track, "at": round(at, 2), "x": r3(x), "z": r3(z)}
    if y is not None: w["y"] = y
    if dwell is not None: w["dwell"] = dwell
    if facing is not None: w["facing"] = round(((facing + 180) % 360) - 180, 1)
    if off: w["off"] = True
    if label: w["label"] = label
    P.setdefault(actor, []).append(w)
    return w


def clock(track, at):
    return START[track] + at


def ring(r, th):
    a = math.radians(th)
    return (r * math.sin(a), 0.95 - r * math.cos(a))


def face(frm, to, cheat=0.0):
    """facing from point frm towards point to; cheat blends toward the house (0..1)."""
    dx, dz = to[0] - frm[0], to[1] - frm[1]
    f = math.degrees(math.atan2(dx, dz))
    return f * (1 - cheat)


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def last(actor):
    w = P[actor][-1]
    return (w["x"], w["z"])


def exit_to(actor, track, t_leave, gate, label=None, extra=0.3):
    """Walk off from the actor's last point, leaving at t_leave at 1.3 m/s, to an entrance."""
    g = ENT[gate]
    d = dist(last(actor), g)
    t = t_leave + d / WALK + extra
    add(actor, track, t, g[0], g[1], off=True, label=label)
    return t


def enter_from(actor, track, t_arrive, gate, x, z, facing, label=None, t_off=None):
    g = ENT[gate]
    d = dist(g, (x, z))
    if t_off is None:
        t_off = max(0.0, t_arrive - d / WALK - 1.0)
    add(actor, track, t_off, g[0], g[1], off=True, label=label)
    add(actor, track, t_arrive, x, z, facing=facing)


def assign(ms, slots, cur):
    """Map members to slots minimising the summed squared walk (2-opt swaps), so paths do not cross."""
    a = {m: slots[i] for i, m in enumerate(ms)}
    better = True
    while better:
        better = False
        for i, m in enumerate(ms):
            for n in ms[i + 1:]:
                d0 = dist(cur[m], a[m]) + dist(cur[n], a[n])
                d1 = dist(cur[m], a[n]) + dist(cur[n], a[m])
                if d1 < d0 - 1e-9:
                    a[m], a[n] = a[n], a[m]; better = True
    return a


def here(m, track, at):
    """The member's position at its latest waypoint at or before (track, at)."""
    best = None
    for w in P[m]:
        if clock(w["track"], w["at"]) <= clock(track, at) + 1e-9:
            if best is None or clock(w["track"], w["at"]) >= clock(best["track"], best["at"]):
                best = w
    return (best["x"], best["z"])


C = (0.0, 0.95)
ENS = ["ens%d" % i for i in range(1, 11)]

# =====================================================================================
# 1-12  The Story of Tonight (Reprise) - the four friends at the tavern table DC, Burr DR
# =====================================================================================
T = "1-12"
enter_from("hamilton", T, 5.0, "W-DSL", 0.0, 2.5, 0, label="Hamilton", t_off=0.0)
enter_from("lafayette", T, 5.5, "W-DSL", 1.0, 2.6, -20, label="Lafayette", t_off=0.2)
enter_from("laurens", T, 6.0, "W-DSR", -1.0, 2.7, 20, label="Laurens", t_off=0.0)
enter_from("mulligan", T, 6.5, "W-DSR", 0.4, 1.7, 0, label="Mulligan", t_off=0.2)
# toast chorus: the four rise round the table, mugs up
add("hamilton", T, 20.25, 0.0, 2.95, 0)
add("lafayette", T, 20.6, 1.3, 3.0, -15)
add("laurens", T, 20.6, -1.3, 3.1, 15)
add("mulligan", T, 21.0, 0.5, 2.0, 0)
# toast tag: back in to the table
add("hamilton", T, 38.6, 0.0, 2.5, 0)
add("lafayette", T, 39.0, 1.0, 2.6, -30)
add("laurens", T, 39.0, -0.9, 2.7, 30)
add("mulligan", T, 39.2, 0.4, 1.7, 0)
# Burr arrives DR
add("burr", T, 0.0, ENT["W-DSR"][0], ENT["W-DSR"][1], off=True, label="Burr")
add("burr", T, 45.75, -1.6, 3.35, 40)     # SPOT: into his DRC apron key (ch2) and VL back light (ch72/74) on the stab
add("hamilton", T, 45.9, -0.2, 2.6, -50)
add("laurens", T, 45.9, -1.0, 2.8, -60)
add("lafayette", T, 46.1, 1.0, 2.6, -70)
add("mulligan", T, 46.1, 0.4, 1.7, -50)
# the friends crowd Burr, teasing him about his lady
add("laurens", T, 49.0, -2.45, 2.55, 40)
add("lafayette", T, 50.5, -0.6, 3.75, -80)
add("mulligan", T, 51.5, -1.35, 2.2, -10)
add("burr", T, 50.0, -1.5, 3.4, 30)
# Ham/Burr exchange: Hamilton DLC, Burr DRC; the friends drop back up to the table
add("burr", T, 54.85, -1.5, 3.6, 60)
add("hamilton", T, 54.85, 1.5, 3.6, -60)
add("mulligan", T, 53.5, -0.3, 1.2, -30)
add("lafayette", T, 56.0, 0.6, 1.9, -40)
add("laurens", T, 56.5, -0.9, 1.6, -30)     # SPOT: back at the table but out of Burr's key and VL (ch2/72/74)
add("hamilton", T, 66.0, 1.2, 3.4, -55)
add("burr", T, 66.5, -1.3, 3.6, 50)
# friends sent off (75.4)
add("laurens", T, 75.4, -0.9, 1.6, -90)
add("lafayette", T, 75.4, 0.6, 1.9, 60)
add("mulligan", T, 75.4, -0.3, 1.2, -100)
exit_to("laurens", T, 75.6, "W-USR")
exit_to("lafayette", T, 75.6, "W-MSL")
exit_to("mulligan", T, 77.5, "W-MSR")
add("hamilton", T, 78.0, 1.0, 3.5, -60)
# Burr's secret: he turns out to the house; Hamilton steps in
add("burr", T, 90.7, -1.35, 3.6, 0)        # SPOT: his key (ch2) up on the secret
add("hamilton", T, 91.5, 0.95, 3.45, -70)  # SPOT: in his own key (ch4)
add("burr", T, 100.0, -1.4, 3.45, 60)
add("hamilton", T, 108.25, 0.95, 3.45, -40)
exit_to("hamilton", T, 108.4, "W-DSL")
# Burr walks to his spot on the turntable for Wait for It
add("burr", T, 112.5, 0.63, 2.2, 0)     # SPOT: his Wait for It pool (ch93 at 0.63, 2.37; blue column ch8 behind)

# =====================================================================================
# 1-13  Wait for It - Burr alone in his pool; the ensemble a slow formation behind him
# =====================================================================================
T = "1-13"
B = "burr"
# SPOT: every unit of his look lands at x 0.5-0.76 (pool ch93 0.63,2.37; column ch8 0.63,1.18; VL rims 0.5-0.76 at
# z 2.63, or z 1.90 in chorus 2), so his spot is (0.63, 2.2) and his boast / peak are steps DOWN the pool's axis
# to z 2.95 / 3.1 (still inside ch72/93), not to DC (0, 3.2 / 3.6), where no unit of his reaches
for at, x, z, f in [(0.6, 0.63, 2.2, 0), (10.0, 0.85, 2.4, 25), (31.15, 0.63, 2.2, 0), (44.8, 0.63, 2.4, 0),
                    (51.1, 0.35, 2.3, -15), (66.4, 0.45, 2.5, 0), (72.0, 0.63, 2.0, 0), (85.9, 0.63, 2.4, 0),
                    (92.55, 0.63, 2.2, 0), (99.5, 0.65, 2.95, 0), (106.0, 0.95, 2.5, -20), (114.9, 0.8, 2.2, -170),
                    (124.0, 0.6, 2.2, 175), (131.8, 0.63, 2.4, 0), (146.2, 0.63, 2.6, 0), (152.0, 0.7, 3.1, 0),
                    (159.45, 0.63, 2.3, 0), (175.2, 0.63, 2.2, 0), (189.6, 0.63, 2.3, 0)]:
    add(B, T, at, x, z, f)

# Theodosia: one ensemble woman far stage left in her own pool (ens8)
enter_from("ens8", T, 9.5, "W-MSL", 4.0, 2.6, -60, label="Ensemble 8", t_off=0.0)   # SPOT: her chair pool ch10 (4.04, 2.64)
add("ens8", T, 31.0, 4.0, 2.6, -45)
add("ens8", T, 51.1, 4.0, 2.6, -80)
exit_to("ens8", T, 51.3, "W-MSL")

# chorus 1: nine bodies on the outer ring round and behind him, mirroring him, slow revolve clockwise
NINE = ["ens1", "ens2", "ens3", "ens4", "ens5", "ens6", "ens7", "ens9", "ens10"]
A1 = [-100, -75, -50, -25, 0, 25, 50, 75, 100]
gate1 = {"ens1": "W-MSR", "ens2": "W-MSR", "ens3": "W-USR", "ens4": "W-USR", "ens5": "D-UC",
         "ens6": "W-USL", "ens7": "W-USL", "ens9": "W-MSL", "ens10": "W-MSL"}
for i, m in enumerate(NINE):
    x, z = ring(3.2, A1[i])
    enter_from(m, T, 31.15 + 0.15 * (i % 3), gate1[m], x, z, 0, label="Ensemble %s" % m[3:],
               t_off=12.0 + i * 0.5)
    x, z = ring(3.2, A1[i] + 15); add(m, T, 41.0 + 0.1 * i, x, z, dwell=0)
    x, z = ring(3.2, A1[i] + 30); add(m, T, 51.1, x, z, 0)
    # 66.4 everyone else goes: they fade back to the ring's outer edge
    x, z = ring(3.75, A1[i] + 30); add(m, T, 68.5, x, z, 0)
# chorus 2: all ten on the ring, revolving the other way
A2 = [-112.5 + 25 * k for k in range(10)]
for k, m in enumerate(ENS):
    x, z = ring(3.2, A2[k])
    if m == "ens8":
        enter_from(m, T, 72.0, "W-MSL", x, z, 0, t_off=60.0)
    else:
        add(m, T, 72.0, x, z, 0)
    x, z = ring(3.2, A2[k] - 12); add(m, T, 81.0, x, z, dwell=0)
    x, z = ring(3.2, A2[k] - 24); add(m, T, 89.5, x, z, 0)
# bridge: the fan - a V opening upstage behind Burr
V = [(-4.1, -1.0), (-3.2, -1.8), (-2.3, -1.3), (-1.4, -0.8), (-0.5, -0.3),
     (0.5, -0.3), (1.4, -0.8), (2.3, -1.3), (3.2, -1.8), (4.1, -1.0)]
VA = assign(ENS, V, {m: here(m, T, 89.5) for m in ENS})
for k, m in enumerate(ENS):
    x, z = VA[m]
    add(m, T, 94.5, x, z, 0)
    add(m, T, 99.9, x, z + 0.8, 0)          # Burr's boast: the fan surges a step with him
    add(m, T, 106.0, x, z, 0)
# REVIEW: ens3 swings wide of ens4 on the way into the fan (they passed 0.39 m apart)
assert VA["ens3"] == (-3.2, -1.8)
add("ens3", T, 92.6, -3.65, -0.6, dwell=0)
# verse 3 (Hamilton seen UC): the fan splits into two side columns, UC left open
COLS = [(sx * 3.6, z) for sx in (-1, 1) for z in (-1.5, -0.3, 0.9, 2.1, 3.3)]
CA = assign(ENS, COLS, VA)
for m in ENS:
    x, z = CA[m]
    add(m, T, 114.9, x, z, 90 if x < 0 else -90)
    add(m, T, 136.3, x, z, 0)               # the sparse half: they face out in the side light
    add(m, T, 146.2, x * 0.68, z, 0)        # the build: they close in
LINEP = [(-4.05 + 0.9 * k, 2.4) for k in range(10)]
LA = assign(ENS, LINEP, {m: (CA[m][0] * 0.68, CA[m][1]) for m in ENS})
VB = assign(ENS, V, LA)
for m in ENS:
    add(m, T, 152.0, LA[m][0], LA[m][1], 0)     # the peak: a line right behind him
    add(m, T, 159.45, VB[m][0], VB[m][1], 0)    # final chorus: back to the fan
    add(m, T, 175.2, VB[m][0], VB[m][1], 0)
    add(m, T, 178.2, VB[m][0], VB[m][1], 0)
OUT13 = {"ens1": "W-MSR", "ens2": "W-USR", "ens3": "W-USR", "ens4": "D-UC", "ens5": "D-UC",
         "ens6": "D-UC", "ens7": "D-UC", "ens8": "W-USL", "ens9": "W-USL", "ens10": "W-MSL"}
for k, m in enumerate(ENS):
    g = min([ENT[q] for q in ("W-MSR", "W-USR", "D-UC", "W-USL", "W-MSL")], key=lambda q: dist(VB[m], q))
    add(m, T, 185.0 + 0.6 * k, g[0], g[1], off=True)   # a slow walk off in the fade

# Hamilton crosses UC through verse 3
add("hamilton", T, 106.0, ENT["D-UC"][0], ENT["D-UC"][1], off=True)
add("hamilton", T, 114.9, 0.05, -2.15, 0)   # SPOT: the UC special (ch18 0.11,-2.0; VL ch73/75) to its end at 131.8
add("hamilton", T, 124.0, -0.1, -2.1, 20)
exit_to("hamilton", T, 131.9, "D-UC")
# Burr walks off in the dark into Stay Alive
# REVIEW: he holds his pool to its last cue (189.6), then goes in the navy hold, off before Eliza's opening is lit
_bw = [w for w in P["burr"] if w["track"] == "1-13" and w["at"] == 189.6][0]
_bw["dwell"] = 0.05
add("burr", "1-14", 1.0, ENT["W-MSR"][0], ENT["W-MSR"][1], off=True)

# =====================================================================================
# 1-14  Stay Alive - Eliza writing on the gallery; Washington's tent; Monmouth; Lee
# =====================================================================================
T = "1-14"
add("eliza", T, 0.0, 0.6, -4.8, y="gallery", off=True, label="Eliza")
add("eliza", T, 2.0, 0.6, -3.35, y="gallery", dwell=0)
add("eliza", T, 4.5, 0.0, -3.35, y="gallery", facing=0)      # SPOT: her gallery special ch18 (0.0, -3.42)
add("eliza", T, 29.65, -0.2, -3.35, y="gallery", facing=10)
add("eliza", T, 59.45, 0.0, -3.35, y="gallery", facing=0)
add("eliza", T, 66.0, 0.0, -3.35, y="gallery", facing=0)
add("eliza", T, 68.5, 0.6, -3.35, y="gallery", dwell=0)
add("eliza", T, 70.0, 0.6, -4.8, y="gallery", off=True)

W = "washington"
enter_from(W, T, 16.9, "D-UC", 0.0, 1.4, 0, label="Washington", t_off=9.0)   # SPOT: the desk where its pools land
for at, x, z, f in [(29.65, 0.0, 1.4, 0), (44.95, -0.3, 1.5, 20), (65.5, 0.0, 1.35, 0), (77.5, -0.2, 1.4, 10),
                    (87.1, 0.4, 1.45, -60), (90.1, 0.0, 1.4, 30), (98.6, 0.0, 1.4, 0), (105.0, 0.0, 3.0, 0),
                    (114.1, 0.0, 2.8, 0), (119.5, -0.3, 1.45, 40), (137.3, 0.0, 1.4, 0), (140.0, 0.2, 1.35, -45)]:
    add(W, T, at, x, z, f)
exit_to(W, T, 144.5, "D-UC")

H = "hamilton"
enter_from(H, T, 16.9, "W-MSR", -1.4, 2.4, 20, t_off=8.0)
for at, x, z, f in [(29.65, -1.0, 1.2, 50), (44.95, -0.4, 2.6, 0), (53.45, -1.0, 2.2, 30), (65.5, -1.3, 1.4, 45),
                    (77.5, -1.1, 1.6, 40), (87.1, -0.6, 1.85, 70), (90.1, -0.4, 2.4, 60), (96.0, -3.8, 2.6, 30), (99.5, -3.8, 2.6, 30),
                    (105.0, -3.0, 3.4, 30), (114.1, -3.4, 3.0, 20), (122.5, -1.25, 1.0, 60), (137.3, -0.9, 1.6, 45),
                    (144.3, -0.9, 1.6, 90), (147.5, 1.7, 3.3, 60), (151.0, 1.7, 3.3, 70)]:
    add(H, T, at, x, z, f)
add(H, T, 158.1, 1.7, 3.3, 70, dwell=0.05)
# REVIEW: he holds his flank through the heat until the ranks have opened out
add(H, T, 120.3, -3.4, 3.0, 20, dwell=0.05)

L = "laurens"
enter_from(L, T, 29.65, "W-MSL", 1.2, 1.3, -30, t_off=22.0)
for at, x, z, f in [(53.45, 1.6, 1.9, -20), (65.5, 2.0, 2.4, -20), (77.5, 1.7, 2.0, -20), (87.1, 2.2, 0.9, -20),
                    (94.0, 3.9, 2.6, -30), (98.6, 3.9, 2.6, -30), (105.0, 3.6, 3.2, -40), (119.5, 1.4, 1.6, 45), (137.3, 1.0, 1.9, 30),
                    (144.3, 1.0, 1.9, 60), (147.5, 2.6, 3.3, -70), (151.0, 2.6, 3.3, -75)]:
    add(L, T, at, x, z, f)
add(L, T, 158.1, 2.6, 3.3, -75, dwell=0.05)
LF = "lafayette"
enter_from(LF, T, 29.65, "W-MSR", -2.0, 0.0, 30, t_off=22.0)
for at, x, z, f in [(53.45, -2.1, 0.6, 20), (65.5, -1.8, 2.6, 20), (77.5, -1.9, 2.1, 30), (87.1, -2.0, -0.3, 20),
                    (93.0, -3.6, -0.5, 30), (98.6, -3.6, -0.5, 30), (114.1, -3.0, 0.2, 20), (119.5, -0.6, -0.6, 60), (137.3, -0.9, -0.4, 30)]:
    add(LF, T, at, x, z, f)
exit_to(LF, T, 144.5, "W-MSR")
MU = "mulligan"
enter_from(MU, T, 29.65, "W-USL", 1.9, -0.6, -20, t_off=22.0)
for at, x, z, f in [(53.45, 1.2, 0.3, -10), (65.5, 0.3, 2.9, 0), (77.5, 0.0, 2.6, 0), (87.1, 1.6, -0.9, -40),
                    (93.0, 3.6, -0.6, -30), (98.6, 3.6, -0.6, -30), (114.1, 3.0, 0.1, -20), (119.5, 1.1, -0.4, 30), (137.3, 0.9, -0.3, 10)]:
    add(MU, T, at, x, z, f)
exit_to(MU, T, 144.5, "W-USL")

# the company: soldiers of the camp on the outer ring round the tent
CAMP = {"ens1": 210, "ens2": 240, "ens4": 270, "ens5": 300, "ens6": 330,
        "ens7": 30, "ens8": 60, "ens3": 90, "ens9": 120, "ens10": 150}
GATE14 = {"ens1": "W-DSR", "ens2": "W-MSR", "ens4": "W-MSR", "ens5": "W-USR", "ens6": "W-USR",
          "ens7": "W-USL", "ens8": "W-USL", "ens3": "W-MSL", "ens9": "W-MSL", "ens10": "W-DSL"}
LINEA = {"ens1": (-3.2, -0.5), "ens4": (-1.6, -0.5), "ens6": (0.0, -0.5), "ens8": (1.6, -0.5), "ens10": (3.2, -0.5),
         "ens2": (-4.0, -1.7), "ens5": (-2.0, -1.7), "ens7": (0.0, -1.7), "ens3": (2.0, -1.7), "ens9": (4.0, -1.7)}
for k, m in enumerate(ENS):
    th = CAMP[m]
    x, z = ring(3.4, th)
    enter_from(m, T, 29.65 + 0.2 * (k % 4), GATE14[m], x, z, face((x, z), C, 0.4), t_off=20.0 + 0.3 * k)
LAS = assign(ENS, list(LINEA.values()), {m: ring(3.4, CAMP[m]) for m in ENS})
for k, m in enumerate(ENS):
    th = CAMP[m]
    lx, lz = LAS[m]
    add(m, T, 53.6 + 0.05 * k, lx, lz, 0)       # tactics chant: two drill lines snap in
    add(m, T, 59.0 + 0.05 * k, lx, lz, 0)       # the vocal gun: hold
    x, z = ring(3.4, th); add(m, T, 65.5 + 0.1 * (k % 3), x, z, face((x, z), C, 0.4))
    x, z = ring(3.4, th + 20); add(m, T, 72.0 + 0.1 * k, x, z, dwell=0)
    x, z = ring(3.4, th + 40); add(m, T, 77.5 + 0.1 * (k % 3), x, z, face((x, z), C, 0.4))
    x, z = ring(3.4, th + 52); add(m, T, 81.5 + 0.1 * k, x, z, dwell=0)
    x, z = ring(3.4, th + 64); add(m, T, 85.0 + 0.05 * k, x, z, face((x, z), C, 0.4))

# Charles Lee: ens3 leaves the ring for his promotion DL
add("ens3", T, 86.4, *ring(3.4, CAMP["ens3"] + 64), dwell=0, label="Charles Lee")
add("ens3", T, 87.6, 2.45, 3.05, -20)      # SPOT: Lee's DL special (ch5 2.35-2.56, 3.02-3.33) is up from 87.1
add("ens3", T, 90.1, 2.45, 3.05, -20)
# 87.1 the camp cuts away: the others withdraw under the gallery, x-sorted
others = [m for m in ENS if m != "ens3"]
WD = {m: CAMP[m] + 64 for m in others}
# SPOT: ens8 stood in Lee's DL special (ch5, up from 87.1); ens7 steps upstage (64 deg) and ens8 takes its place (94)
WD["ens7"], WD["ens8"] = 50, 94
WT = {"ens7": 87.6, "ens8": 88.6}
for i, m in enumerate(others):
    x, z = ring(3.6, WD[m])
    add(m, T, WT.get(m, 89.0 + 0.1 * i), x, z, face((x, z), C, 0.4))   # they step back out of the light
# Monmouth: two ranks, advance / fall back on Lee's orders
FRONT = {"ens1": -2.4, "ens4": -0.8, "ens8": 0.8, "ens10": 2.4}
BACK = {"ens2": -3.2, "ens5": -1.6, "ens7": 1.6, "ens9": 3.2}
RANKS = [(v, 2.2) for v in (-2.4, -0.8, 0.8, 2.4)] + [(v, 0.9) for v in (-3.2, -1.6, 1.6, 3.2)] + [(0.0, -1.3)]
RA = assign(others, RANKS, {m: ring(3.6, WD[m]) for m in others})
for m in others:
    x, z = RA[m]
    add(m, T, 98.6, x, z, 0)
    for at, dz in [(101.3, 1.0), (102.5, 0.0), (103.4, 1.0), (104.1, 0.0)]:
        if z < 0:
            dz *= 0.4
        add(m, T, at, x, z + dz, 0 if dz else (180 if z > 0 else 0))
    add(m, T, 105.6, x, z, 0)
    add(m, T, 118.0, x * 1.15, z - 0.4, 0 if x == 0 else (20 if x < 0 else -20))   # the heat: a slow sag
SAG = {m: (RA[m][0] * 1.15, RA[m][1] - 0.4) for m in others}
# SPOT: the camp's ring places skip the DL arc round Lee's special (Lee stands at ~131 deg on the ring)
CAMPA = {"ens1": 270, "ens2": 300, "ens10": 225, "ens4": 200, "ens9": 180, "ens5": 0, "ens6": 30, "ens8": 60,
         "ens7": 105}
assert sorted(CAMPA) == sorted(others)
CAMPR = {m: ring(3.4, CAMPA[m]) for m in others}
for m in others:
    x2, z2 = CAMPR[m]
    add(m, T, 121.0, x2, z2, face((x2, z2), (2.45, 3.05), 0.3))                       # sepia camp, all eyes on Lee
    add(m, T, 137.3 + 0.05 * (int(m[3:])), x2, z2, face((x2, z2), (0.0, 1.4), 0.3))  # and back to Washington
for k, m in enumerate(others):
    g = min(["W-DSR", "W-MSR", "W-USR", "W-USL", "W-MSL", "W-DSL"], key=lambda gg: dist(last(m), ENT[gg]))
    exit_to(m, T, 144.3 + 0.2 * (k % 4), g)
# Lee's battle: running back and forth in front of the troops
for at, x, z, f in [(98.6, 1.2, 4.0, 0), (101.3, 1.0, 4.2, 0), (102.5, -0.8, 4.0, -90), (103.4, 0.9, 4.2, 90),
                    (104.1, -0.9, 4.0, -90), (105.6, -2.4, 4.3, 45), (110.0, -1.8, 4.4, 30),
                    (119.5, 2.45, 3.05, -30), (130.0, 2.3, 3.1, -40), (137.3, 2.45, 3.05, -20)]:
    add("ens3", T, at, x, z, f)
exit_to("ens3", T, 137.5, "W-DSL")

# =====================================================================================
# 1-15  Ten Duel Commandments - the duellists on the outer ring; the company counts in a line, then two unison groups
# =====================================================================================
T = "1-15"
NUMS = [14.9, 21.0, 27.3, 39.4, 52.3, 58.0, 64.5, 70.2]
LINE8 = ["ens1", "ens2", "ens5", "ens6", "ens7", "ens8", "ens9", "ens10"]


def lpos(th):
    return ring(3.2, th)


def mir(p):
    return (-p[0], p[1])


def ringface(p):
    return face(p, C, 0.35)


# Laurens' angles round the outer ring (Lee mirrors him: the two revolves turn against each other)
LTH = [(14.9, 240), (21.0, 255), (27.3, 270), (39.4, 285), (52.3, 300), (58.0, 310), (64.5, 320),
       (70.2, 330), (86.0, 330)]
add("laurens", T, 0.75, -1.5, 2.7, dwell=0)  # in the FTB: upstage of Hamilton on the cross
add("laurens", T, 1.6, -3.4, 3.55, 30)       # SPOT: the DR pool of the "3 pools" (ch12 -3.18, 3.86)
for i, (at, th) in enumerate(LTH):
    p = lpos(th)
    dw = None if i in (0, len(LTH) - 1) else 1.0
    add("laurens", T, at, p[0], p[1], ringface(p), dwell=dw)
# Lee enters with Burr from SL
add("ens3", "1-14", 157.0, ENT["W-MSL"][0], ENT["W-MSL"][1], off=True, dwell=0, label="Charles Lee")
add("ens3", T, 1.6, 3.55, 3.75, -30)         # SPOT: the DL pool (ch14 3.35, 4.08)
for i, (at, th) in enumerate(LTH):
    p = mir(lpos(th))
    dw = None if i in (0, len(LTH) - 1) else 1.0
    add("ens3", T, at + 0.05, p[0], p[1], ringface(p), dwell=dw)
for a, sgn in (("laurens", 1), ("ens3", -1)):
    p = ring(3.2, 300); add(a, T, 88.0, sgn * p[0], p[1], dwell=0)
    p = ring(3.2, 270); add(a, T, 91.0, sgn * p[0], p[1], dwell=0)
    add(a, T, 94.9, sgn * -0.3, 0.95, sgn * -90)       # back to back at the centre
    add(a, T, 101.0, sgn * -0.3, 0.95, sgn * -90)
    add(a, T, 104.5, sgn * -2.8, 0.95, sgn * 90)       # the ten paces out, and turn

# Hamilton (Laurens' second) and Burr (Lee's second)
for a, sgn in (("hamilton", 1), ("burr", -1)):
    def S(p):
        return (sgn * p[0], p[1])
    if a == "burr":
        add(a, "1-14", 157.2, ENT["W-DSL"][0], ENT["W-DSL"][1], off=True, dwell=0)
    p = S((-2.8, 4.05)); add(a, T, 1.6, p[0], p[1], sgn * 30)   # SPOT: with his principal in the DR / DL pool
    p = S(lpos(220)); add(a, T, 14.95, p[0], p[1], ringface(p))
    p = S(lpos(235)); add(a, T, 21.1, p[0], p[1], ringface(p), dwell=1.0)
    p = S(lpos(250)); add(a, T, 27.4, p[0], p[1], ringface(p), dwell=1.0)
    add(a, T, 34.1, p[0], p[1], ringface(p))
    # #4: Hamilton and Burr together down left
    if a == "hamilton":
        add(a, T, 37.6, 0.2, 3.9, dwell=0)
        add(a, T, 40.4, 2.9, 3.7, 50)
        add(a, T, 50.5, 2.9, 3.7, 70)
        add(a, T, 56.0, 0.0, 3.4, dwell=0)
        add(a, T, 58.5, -3.9, 2.2, 45)
    else:
        add(a, T, 40.4, 3.9, 3.1, -60)
        add(a, T, 51.0, 3.9, 3.1, -50)
        add(a, T, 52.3, 3.9, 2.2, -45)
    q = S((-3.9, 2.2))
    add(a, T, 64.6, q[0], q[1], sgn * 40)
    add(a, T, 70.3, q[0], q[1], sgn * 45)
    # the seconds' negotiation DC
    add(a, T, 73.5, *S((-3.4, 2.4)), dwell=0)
    add(a, T, 77.1, *S((-0.8, 3.6)), facing=sgn * 45)
    add(a, T, 85.0, *S((-0.7, 3.6)), facing=sgn * 60)
    add(a, T, 91.0, *S((-0.7, 3.6)), facing=sgn * 45)
    add(a, T, 94.9, *S((-3.2, 4.0)), facing=sgn * 50)    # SPOT: the count's DR / DL specials (ch42 / ch45), and the shot's (ch97 / ch99)
    add(a, T, 104.9, *S((-3.2, 4.0)), facing=sgn * 60)

# the company (REVIEW): the opening count in a line, then two mirrored groups of four, unison on every number
GATE15 = {"ens1": "W-DSR", "ens2": "W-MSR", "ens5": "W-USR", "ens6": "D-UC", "ens7": "D-UC", "ens8": "W-USL",
          "ens9": "W-MSL", "ens10": "W-MSL"}
GO15 = {"ens6": 156.3, "ens7": 157.6, "ens9": 156.0}
# group slots: SR group (Laurens' side) ens1,2,5,6; SL group (Lee's side) ens7..10, mirrored
GRP_A = {"ens1": (-1.6, 1.5), "ens2": (-0.8, 1.5), "ens5": (-1.6, 0.6), "ens6": (-0.8, 0.6)}
GRP_B = {"ens1": (-1.6, -0.3), "ens2": (-0.8, -0.3), "ens5": (-1.6, -1.1), "ens6": (-0.8, -1.1)}   # SPOT: inner pair just clear of the UC special (the Doctor's) on #9
MIR = {"ens7": "ens6", "ens8": "ens5", "ens9": "ens2", "ens10": "ens1"}
for dst, src in MIR.items():
    GRP_A[dst] = (-GRP_A[src][0], GRP_A[src][1])
    GRP_B[dst] = (-GRP_B[src][0], GRP_B[src][1])
CVOX = [34.1, 55.3]
for n, m in enumerate(LINE8):
    sg = -1 if GRP_A[m][0] < 0 else 1          # -1 SR group, +1 SL group
    x = -2.275 + n * 0.65                      # the opening-count line across the middle, 0.65 m apart
    # walk on in the FTB at the end of Stay Alive, in the line for the opening count (3.0)
    add(m, "1-14", GO15.get(m, 156.5 + 0.1 * n), ENT[GATE15[m]][0], ENT[GATE15[m]][1], off=True, dwell=0)
    add(m, T, 3.0 + 0.1 * n, x, 1.75, 0)      # SPOT: the line in the centre pool of the "3 pools" (ch13 -0.04, 1.84)
    # #1: the line splits into the two groups, each behind its own duellist, facing across at the other side
    bx, bz = GRP_A[m]
    base_f = -sg * 35
    add(m, T, 14.9 + 2.0, bx, bz, base_f)
    shouts = [t for t in NUMS[1:]]              # #2..#8: the same unison pose, both groups at once
    for t in shouts:
        if t > 77.0:
            continue
        add(m, T, t + 0.4, bx, bz + 0.35, 0)    # the shout: a step to the house, square to it
        add(m, T, t + 2.6, bx, bz, base_f)      # and back, facing across again
        for cv in CVOX:                          # the company vocals: both groups surge at each other
            if t < cv < t + 6.0:
                add(m, T, cv + 0.5, bx - sg * 0.35, bz, -sg * 90)
                add(m, T, cv + 2.4, bx, bz, base_f)
    add(m, T, 73.0, bx, bz, sg * 165)            # after #8: they turn up to their own duellist on the ring
    # the seconds' negotiation DC: both groups fall back upstage, out of the duellists' walk line
    gx, gz = GRP_B[m]
    add(m, T, 79.0, gx, gz, -sg * 30)
    add(m, T, 94.9 + 0.4, gx, gz + 0.35, 0)      # #9: the same pose, together
    add(m, T, 97.5, gx, gz, -sg * 30)
    add(m, T, 101.35 + 0.3, gx, gz, sg * 60)       # the count: they turn out to their own man walking away
# the doctor: paid, then turns his back
add("ens4", T, 30.0, ENT["D-UC"][0], ENT["D-UC"][1], off=True, label="The Doctor")
add("ens4", T, 45.0, 0.0, -2.6, 0)
add("ens4", T, 50.0, 0.0, -2.6, 180)

# =====================================================================================
# 1-16  Meet Me Inside - Lee yields, Washington arrives UC, the office
# =====================================================================================
T = "1-16"
add("ens3", T, 1.5, 2.9, 1.1, -60)
add("ens3", T, 20.0, 2.9, 1.1, -30)
exit_to("ens3", T, 21.0, "W-MSL", label="Ensemble 3")
add("ens4", T, 1.5, 2.3, -1.9, dwell=0)
add("ens4", T, 3.5, 3.5, 0.4, -120)
add("ens4", T, 20.0, 3.5, 0.4, -110)
exit_to("ens4", T, 21.3, "W-MSL", label="Ensemble 4")
add("burr", T, 3.0, 2.4, 1.9, -30)
add("burr", T, 9.6, 2.2, 2.0, -60)
add("burr", T, 18.0, 2.2, 2.0, -100)
exit_to("burr", T, 19.0, "W-DSL")
add("laurens", T, 3.0, -1.6, 1.4, 60)
add("laurens", T, 9.6, -1.4, 1.2, 160)
add("laurens", T, 17.0, -1.4, 1.2, -90)
exit_to("laurens", T, 17.5, "W-MSR")
for at, x, z, f in [(2.5, -0.6, 1.8, 60), (9.6, -0.4, 1.6, 160), (25.0, -0.4, 1.6, 170), (31.6, 1.3, 3.1, -60),
                    (43.4, 1.15, 3.2, -70), (57.0, 1.35, 3.65, -20), (63.0, 0.85, 3.3, -50), (70.25, 1.15, 3.25, -70),
                    (74.4, 1.3, 3.3, -60), (80.45, 1.4, 3.35, 0)]:
    add("hamilton", T, at, x, z, f)
add(W, T, 4.5, ENT["D-UC"][0], ENT["D-UC"][1], off=True)
for at, x, z, f in [(9.6, 0.0, -2.3, 0), (25.0, 0.0, -2.3, 10), (31.6, -1.25, 3.05, 60), (43.4, -1.1, 3.2, 70),
                    (57.0, -1.3, 3.1, 50), (70.25, -1.2, 3.2, 70), (74.4, -1.3, 3.0, -140)]:
    add(W, T, at, x, z, f)
exit_to(W, T, 77.6, "W-DSR")     # SPOT: holds his key through his order; goes off DR on the button
# the company breaks the line when Washington arrives, then chants and clears for the office
SIDE = {"ens1": (-2.4, 0.0), "ens2": (-1.6, 0.0), "ens5": (-2.4, -0.8), "ens6": (-1.6, -0.8),
        "ens10": (2.4, 0.0), "ens9": (1.6, 0.0), "ens8": (2.4, -0.8), "ens7": (1.6, -0.8)}
OUT16 = {"ens1": "W-MSR", "ens2": "W-MSR", "ens5": "W-USR", "ens6": "W-USR",
         "ens7": "W-USL", "ens8": "W-USL", "ens9": "W-MSL", "ens10": "W-MSL"}
for k, m in enumerate(LINE8):
    x, z = SIDE[m]
    add(m, T, 11.5 + 0.1 * k, x, z, face((x, z), (0.0, -2.3), 0.3))
    add(m, T, 25.0 + 0.1 * k, x, z, face((x, z), (0.0, 1.2), 0.3))
    exit_to(m, T, 26.0 + 0.2 * k, OUT16[m])

# =====================================================================================
# 1-17  That Would Be Enough - Hamilton and Eliza alone
# =====================================================================================
T = "1-17"
enter_from("eliza", T, 9.0, "W-DSR", -0.55, 2.75, 40, t_off=0.0)   # SPOT: her key ch2 (-0.63, 2.81)
add("hamilton", T, 4.0, 0.75, 2.6, -20)                               # SPOT: his key ch4 (0.84, 2.71)
for at, x, z, f in [(19.75, 0.72, 2.6, -45), (45.0, 0.72, 2.7, -30), (76.1, 0.72, 2.62, -75)]:
    add("hamilton", T, at, x, z, f)
for at, x, z, f in [(19.75, -0.5, 2.7, 60), (45.0, -0.55, 2.6, 70), (76.1, -0.5, 2.7, 75)]:
    add("eliza", T, at, x, z, f)
# chorus: the two revolve slowly together about their own midpoint, each staying in his / her key
MID, RR = (0.1, 2.72), 0.7
for at, ph in [(89.55, 0.0), (95.0, -15.0), (100.6, -30.0)]:
    a = math.radians(ph)
    hp = (MID[0] + RR * math.cos(a), MID[1] + RR * math.sin(a))
    ep = (MID[0] - RR * math.cos(a), MID[1] - RR * math.sin(a))
    stop = at == 100.6 or at == 89.55
    add("hamilton", T, at, hp[0], hp[1], face(hp, ep, 0.5) if stop else None, dwell=None if stop else 0)
    add("eliza", T, at + 0.1, ep[0], ep[1], face(ep, hp, 0.5) if stop else None, dwell=None if stop else 0)
# his doubt: he turns away DL (still in his key); her bridge: her key up, she reaches towards him; her resolve: together
add("hamilton", T, 106.0, 1.25, 3.05, 20)
add("eliza", T, 111.7, -0.55, 2.85, 50)
add("eliza", T, 116.0, -0.5, 2.85, 60)
add("hamilton", T, 120.0, 0.8, 2.9, -45)
add("eliza", T, 126.95, -0.6, 2.95, 30)
add("hamilton", T, 127.5, 0.75, 2.85, -30)
add("eliza", T, 140.0, -0.45, 3.7, 15)       # SPOT: together in the DC shaft (ch8) and still in their keys
add("hamilton", T, 140.1, 0.45, 3.7, -15)
add("eliza", T, 155.85, -0.55, 2.75, 50)
add("hamilton", T, 155.9, 0.75, 2.7, -50)
add("eliza", T, 170.1, -0.5, 2.95, 40, dwell=3.0)                     # SPOT: "the couple alone in their pool" (ch93 0.11, 2.89)
add("hamilton", T, 170.2, 0.7, 2.95, -40, dwell=3.3)
add("eliza", T, 177.0, ENT["W-DSR"][0], ENT["W-DSR"][1], off=True)
add("hamilton", T, 177.5, ENT["W-DSR"][0], ENT["W-DSR"][1] - 0.4, off=True)

# =====================================================================================
TI = {t: i for i, t in enumerate(TRACKS)}
bad = []
for a, path in P.items():
    path.sort(key=lambda w: clock(w["track"], w["at"]))
    for u, v in zip(path, path[1:]):
        if clock(v["track"], v["at"]) <= clock(u["track"], u["at"]):
            bad.append((a, u, v))
    if not path[0].get("off") or not path[-1].get("off"):
        bad.append((a, "not off at ends", path[0], path[-1]))
    if "label" not in path[0]:
        bad.append((a, "first waypoint unlabelled"))
for b in bad:
    print("PROBLEM", b)

NOTES = open(os.path.join(HERE, "seg3-notes.txt"), encoding="utf-8").read().strip()
out = {"segment": 3, "tracks": TRACKS, "waypoints": {a: P[a] for a in sorted(P)}, "notes": NOTES}
os.makedirs(os.path.join(HERE, "segments"), exist_ok=True)
with open(os.path.join(HERE, "segments", "seg3.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("waypoints:", sum(len(v) for v in P.values()), "actors:", len(P))

# ---- spacing check: sample linear interpolation every 0.5 s on the show clock -------------------
def pos(path, t):
    pts = [(clock(w["track"], w["at"]), w) for w in path]
    def hid(x, z, off): return off or abs(x) > 6.4 or z < -4.0
    if t <= pts[0][0]: w = pts[0][1]; return (w["x"], w["z"], hid(w["x"], w["z"], w.get("off", False)))
    if t >= pts[-1][0]: w = pts[-1][1]; return (w["x"], w["z"], hid(w["x"], w["z"], w.get("off", False)))
    for (t0, a), (t1, b) in zip(pts, pts[1:]):
        if t0 <= t <= t1:
            d = math.hypot(b["x"] - a["x"], b["z"] - a["z"])
            dw = a.get("dwell")
            dep = t0 if dw == 0 else (t0 + dw if dw is not None else max(t0, t1 - d / WALK))
            f = 0.0 if t <= dep else (t - dep) / max(1e-6, t1 - dep)
            x = a["x"] + f * (b["x"] - a["x"]); z = a["z"] + f * (b["z"] - a["z"])
            return (x, z, hid(x, z, (a.get("off") and f == 0) or (a.get("off") and b.get("off"))))
if "--space" in sys.argv:
    seen = {}
    t = 0.0
    end = START["1-17"] + LEN["1-17"]
    names = sorted(P)
    while t < end:
        ps = {a: pos(P[a], t) for a in names}
        for i, a in enumerate(names):
            for b in names[i + 1:]:
                pa, pb = ps[a], ps[b]
                if pa[2] or pb[2]: continue
                d = math.hypot(pa[0] - pb[0], pa[1] - pb[1])
                if d < 0.5:
                    key = (a, b)
                    tr = max(tt for tt in TRACKS if START[tt] <= t)
                    seen.setdefault(key, []).append((tr, round(t - START[tr], 1), round(d, 2)))
        t += 0.5
    for k, v in seen.items():
        print("CLOSE", k, v[0], "...", v[-1], "n=%d" % len(v))
