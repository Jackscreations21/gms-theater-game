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

# Theodosia: one ensemble woman far stage left in her own pool (ens8) - "a second dim pool on a watcher in Wait for It"
# is seen in the production pictures (docs/HAMILTON-LIGHTING-STYLE.md 4.5); cue 410 has her seated: she brings her
# chair on and takes it off (props.py SEGMENT_3)
enter_from("ens8", T, 9.5, "W-MSL", 4.0, 2.6, -60, label="Ensemble 8", t_off=0.0)   # SPOT: her chair pool ch10 (4.04, 2.64)
add("ens8", T, 31.0, 4.0, 2.6, -45)
add("ens8", T, 51.1, 4.0, 2.6, -80)
exit_to("ens8", T, 51.3, "W-MSL")

# REVIEW 2 (Jack: "the ensemble are used too much"): the ring, the counter-revolve, the V fan, the side columns and
# the line behind him were all invented and are cut. What is sourced is only that the company stand in Burr's shoes
# and move as he moves (Blankenbuehler, Playbill). So: SIX bodies, a loose staggered group on the turntable upstage of
# him, in from chorus 1 (cue 411) to the outro fade, standing as he stands and taking his few moves with him - the
# step down on his boast and at the peak, the turn upstage to look at Hamilton in verse 3 - and nothing else.
MIRROR = {"ens1": (-1.9, 1.45), "ens2": (-0.75, 0.55), "ens5": (2.05, 0.65), "ens6": (3.05, 1.6),
          "ens7": (-1.35, -0.6), "ens9": (1.15, -0.45)}
GATE13 = {"ens1": "W-MSR", "ens2": "W-MSR", "ens7": "W-USR", "ens5": "W-MSL", "ens6": "W-MSL", "ens9": "W-USL"}
for k, (m, (x, z)) in enumerate(sorted(MIRROR.items())):
    enter_from(m, T, 31.15, GATE13[m], x, z, 0, label="Ensemble %s" % m[3:], t_off=22.5 + 0.4 * k)
    add(m, T, 44.8, x, z, 0)
    for at, dz in [(99.9, 0.6), (106.0, 0.0), (152.2, 0.6), (159.45, 0.0)]:   # his boast / his peak: a step down with him
        add(m, T, at, x, z + dz, 0)
# verse 3: as he turns upstage to watch Hamilton UC, they turn with him; front again when he does
for m, (x, z) in MIRROR.items():
    add(m, T, 115.4, x, z, 180)
    add(m, T, 132.3, x, z, 0)
for k, (m, (x, z)) in enumerate(sorted(MIRROR.items())):
    add(m, T, 178.2, x, z, 0)
    g = {"ens1": "W-MSR", "ens2": "W-MSR", "ens7": "W-USR", "ens9": "W-USL", "ens5": "W-MSL", "ens6": "W-DSL"}[m]
    exit_to(m, T, 179.0 + 0.7 * k, g)          # a slow walk off in the outro fade
for m in MIRROR:
    P[m].sort(key=lambda w: clock(w["track"], w["at"]))

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

# REVIEW 2: the camp ring, the two drill lines, the marching revolve, the cut-away and the two Monmouth ranks with a
# colour bearer were invented and are cut. Newtfire's libretto gives the company ONE line in the whole number (the
# reaction to Lee's slander, which they can sing unseen) and credits the tactics chant to Hamilton / Lafayette /
# Laurens; the only staging source for an ensemble body is WatchMojo's "the Bullet mimes holding a bullet" during it.
# So the camp is the principals, and FOUR soldiers (ens1 the Bullet among them) come on for Monmouth only: Lee's men,
# who advance and fall back on his four contradictory orders and leave as the battle ends.
# Charles Lee: ens3 walks on for his promotion, into his DL special (ch5, up from 87.1)
add("ens3", T, 80.0, ENT["W-DSL"][0], ENT["W-DSL"][1], off=True, label="Charles Lee")
add("ens3", T, 87.6, 2.45, 3.05, -20)      # SPOT: Lee's DL special (ch5 2.35-2.56, 3.02-3.33) is up from 87.1
add("ens3", T, 90.1, 2.45, 3.05, -20)
SOLD = {"ens1": -1.8, "ens2": -0.6, "ens5": 0.6, "ens6": 1.8}
GATE14 = {"ens1": "W-MSR", "ens2": "W-MSR", "ens5": "W-MSL", "ens6": "W-MSL"}
SZ = 2.2
for k, (m, x) in enumerate(SOLD.items()):
    enter_from(m, T, 98.6, GATE14[m], x, SZ, 0, label="Ensemble %s" % m[3:], t_off=89.5 + 0.5 * k)
    for at, dz in [(101.3, 1.0), (102.5, 0.0), (103.4, 1.0), (104.1, 0.0)]:
        add(m, T, at, x, SZ + dz, 0 if dz else 180)
    add(m, T, 105.6, x, SZ, 0)
    add(m, T, 114.1, x * 1.15, SZ - 0.3, 20 if x < 0 else -20)    # the heat: a slow sag outward
    exit_to(m, T, {"ens1": 115.0, "ens2": 115.6, "ens6": 115.0, "ens5": 115.6}[m], GATE14[m])   # off before the sepia camp (119.5)
# Lee's battle: running back and forth in front of the troops
for at, x, z, f in [(98.6, 1.2, 4.0, 0), (101.3, 1.0, 4.2, 0), (102.5, -0.8, 4.0, -90), (103.4, 0.9, 4.2, 90),
                    (104.1, -0.9, 4.0, -90), (105.6, -2.4, 4.3, 45), (110.0, -1.8, 4.4, 30),
                    (119.5, 2.45, 3.05, -30), (130.0, 2.3, 3.1, -40), (137.3, 2.45, 3.05, -20)]:
    add("ens3", T, at, x, z, f)
exit_to("ens3", T, 137.5, "W-DSL")

# =====================================================================================
# 1-15  Ten Duel Commandments - REVIEW 2: staged from ETC's renders of Binkley's real cues (THPP Cue Photos.pdf,
# pp. 27-44, cues 450.01-476), which stand mannequins where each cue's light needs bodies:
#   450.01 the two duellists face each other in the centre pool, a second alone in each of the DR / DL pools;
#   452 #1 / 470 #9: duellists face to face at C, the seconds out at the sides; 454 #2 / 456 #3: the four in one row
#   across the middle, duellists facing, seconds facing in; 457 Company Vocal: the four facing out on the upstage arc
#   (the company is NOT on: they sing unseen); 458 #4 / 459 Ham/Burr DL / 460 #5: the four only, Hamilton and Burr
#   together right of centre; 461 Company Vocal -> 461.11 / 462 #6: a line of ten across at z ~0.5 (the strobe row
#   ch59-64 / 72-75 lands on it); 464 #7 / 466 #8: a loose cluster on the inner disc; 468 Ham/Burr scene: six or
#   seven, the company leaving; 470 #9 the four only again; 472 the count: duellists back to back at C, seconds in the
#   DR / DL specials; 474 the shot: one duellist DC at the lip (ch98), one up centre (ch18), seconds DR / DL.
# Cut (invented, and contradicted by the renders): the outer-ring opposed revolve of the duellists and seconds, the
# company line from the top, the two mirrored groups of four, the unison step on every number.
# =====================================================================================
T = "1-15"
DUEL = {"laurens": -1, "ens3": 1}          # SR / SL duellist
SEC = {"hamilton": -1, "burr": 1}           # Laurens' second SR, Lee's second SL
# the walk-on in the 1-14 FTB (158.1), placed when the three pools come up (1.6)
add("ens3", "1-14", 157.0, ENT["W-MSL"][0], ENT["W-MSL"][1], off=True, dwell=0, label="Charles Lee")
add("burr", "1-14", 157.2, ENT["W-DSL"][0], ENT["W-DSL"][1], off=True, dwell=0)
add("laurens", T, 1.6, -0.45, 1.84, 90)     # SPOT: the centre pool of preset 402 "3 pools" (ch13 -0.04, 1.84)
add("ens3", T, 1.65, 0.45, 1.84, -90)
add("hamilton", T, 1.6, -3.18, 3.86, 50)    # SPOT: the DR pool (ch12 -3.18, 3.86)
add("burr", T, 1.6, 3.35, 4.08, -50)        # SPOT: the DL pool (ch14 3.35, 4.08)
for a, s in DUEL.items():
    add(a, T, 14.9, s * 0.45, 0.95, -s * 90)                 # #1: face to face at C
for a, s in SEC.items():
    add(a, T, 16.5, s * 2.95, 1.5, -s * 60)                  # #1: out at the sides (ch11 / ch15)
    add(a, T, 21.6, s * 1.6, 0.85, -s * 90)                  # #2 / #3: one row across the middle, facing in
    add(a, T, 31.0, s * 1.6, 0.85, -s * 90)
for a, s in DUEL.items():
    add(a, T, 31.0, s * 0.45, 0.95, -s * 90)
# 457 Company Vocal: the four face out on the upstage arc
for a, p in {"hamilton": (-2.6, 0.2), "laurens": (-1.5, -0.4), "ens3": (1.5, -0.4), "burr": (2.6, 0.2)}.items():
    add(a, T, 34.6, p[0], p[1], 0)
# 458 #4
for a, p, f in [("laurens", (-2.5, -0.3), 20), ("hamilton", (-1.6, 0.5), 30), ("burr", (1.7, 1.2), -30), ("ens3", (2.9, 0.2), -20)]:
    add(a, T, 39.6, p[0], p[1], f)
# 459 "Hamilton/ Burr DL": the two seconds together right of centre, the duellists apart
add("burr", T, 42.0, 1.85, 2.05, -50)
add("hamilton", T, 43.0, 1.1, 2.75, 60)
add("laurens", T, 43.0, -0.2, -0.5, 0)
add("ens3", T, 43.0, 3.7, 2.6, -60)
# 460 #5
for a, p, f in [("laurens", (0.0, -0.5), 0), ("hamilton", (0.0, 0.9), 180), ("burr", (0.9, 2.7), 75), ("ens3", (3.7, 2.8), -90)]:
    add(a, T, 52.6, p[0], p[1], f)
# 461 Company Vocal -> 462 #6: the line of ten at z 0.5 (the four principals in the middle)
LZ = 0.5
LX = {"laurens": -3.15, "hamilton": -2.45, "ens1": -1.75, "ens2": -1.05, "ens5": -0.35, "ens6": 0.35, "ens7": 1.05,
      "ens9": 1.75, "burr": 2.45, "ens3": 3.15}
CO = ["ens1", "ens2", "ens5", "ens6", "ens7", "ens9"]
GATE15 = {"ens5": ("W-USR", 51.6), "ens2": ("W-USR", 52.3), "ens1": ("W-USR", 53.0),
          "ens6": ("W-USL", 51.6), "ens7": ("W-USL", 52.3), "ens9": ("W-USL", 53.0)}
VIA = -1.2      # the company comes on upstage of the four and steps down into the line (clear of the Doctor UC)
for m in CO:
    g, t0 = GATE15[m]
    add(m, T, t0, ENT[g][0], ENT[g][1], off=True, label="Ensemble %s" % m[3:])
    add(m, T, 56.0, LX[m], VIA, dwell=0)
for a, x in LX.items():
    if a in ("laurens", "ens3"):
        add(a, T, 55.0, x, LZ, 0)        # the duellists are in their places first
    add(a, T, 57.3, x, LZ, 0)
    add(a, T, 58.3, x, LZ, 0, dwell=3.2 if a in CO else None)   # the company moves off the line all together at 61.5
# 464 #7 (held through 466 #8): a loose cluster on the inner disc, Hamilton and Burr outside it DR / DL
WEDGE_CO = [(0.0, 2.0), (-0.6, 1.35), (0.6, 1.35), (0.0, 0.7), (-0.6, 0.05), (0.6, 0.05)]
WA = assign(CO, WEDGE_CO, {m: (LX[m], LZ) for m in CO})
for m in CO:
    add(m, T, 64.5, WA[m][0], WA[m][1], 0)
    add(m, T, 71.0, WA[m][0], WA[m][1], 0)
add("laurens", T, 64.5, -3.15, 0.5, 30)      # the duellists hold their line places either side of it
add("ens3", T, 64.5, 3.15, 0.5, -30)
add("hamilton", T, 64.5, -2.7, 2.5, 30)
add("burr", T, 64.5, 2.7, 2.5, -30)
# 468 the Hamilton/Burr scene: the company goes; the seconds negotiate in the front row (ch113 / ch112), the duellists
# wait in the two mid pools (ch119 / ch117)
for k, m in enumerate(sorted(CO, key=lambda q: (WA[q][1], abs(WA[q][0])))):
    x, z = WA[m]
    t0 = 77.1 + 0.8 * k
    add(m, T, t0 + (z - VIA) / 1.3, x, VIA, dwell=0)     # straight upstage, then off to the upstage wing
    exit_to(m, T, t0 + (z - VIA) / 1.3, "W-USR" if x < 0 or (x == 0 and z < 1) else "W-USL", extra=0.0)
add("laurens", T, 79.0, -1.83, 1.2, 30)
add("ens3", T, 79.0, 1.83, 1.2, -30)
add("hamilton", T, 79.6, 0.4, 3.6, 70)
add("burr", T, 79.0, 1.5, 3.5, -70)
add("hamilton", T, 91.0, 0.4, 3.6, 60)
add("burr", T, 91.0, 1.5, 3.5, -60)
# 470 #9: back to the #1 picture
for a, s in DUEL.items():
    add(a, T, 94.9, s * 0.45, 0.95, -s * 90)
for a, s in SEC.items():
    add(a, T, 95.6, s * 2.95, 1.5, -s * 60)
# 472 the count: back to back at C, the seconds into the DR / DL specials (ch42 / ch45, and the shot's ch97 / ch99)
add("laurens", T, 101.35, 0.0, 0.7, 180)
add("ens3", T, 101.4, 0.0, 1.2, 0)
for a, s in SEC.items():
    add(a, T, 101.0, s * 3.2, 4.0, -s * 50)                  # SPOT: ch42 (-3.01, 3.76) / ch45 (3.05, 3.68)
    add(a, T, 104.9, s * 3.2, 4.0, -s * 60)
# the paces, and the turn for the shot (474): Lee DC at the lip in ch98, Laurens up centre in ch18 (-1.62, -1.31)
add("laurens", T, 104.0, -1.5, -1.2, 15)
add("ens3", T, 104.0, 0.0, 4.75, -165)
# the Doctor: comes on for the commandment that names him, stands up centre, turns his back
add("ens4", T, 30.0, ENT["D-UC"][0], ENT["D-UC"][1], off=True, label="The Doctor")
add("ens4", T, 45.0, 0.0, -2.1, 0)
add("ens4", T, 50.0, 0.0, -2.1, 180)

# =====================================================================================
# 1-16  Meet Me Inside - Lee hit DC, Washington arrives UC, the office. REVIEW 2: the company is not on (cue 476's
# render has an empty stage; the chant is sung unseen); two of them set the office furniture on the chant stab.
# =====================================================================================
T = "1-16"
add("ens3", T, 1.5, 0.3, 4.6, -150)          # hit: he staggers where he stood for the shot
add("ens3", T, 20.0, 0.3, 4.6, -120)
add("ens4", T, 1.5, 0.0, -2.1, 180, dwell=0)
add("ens4", T, 4.5, -0.5, 3.9, 120)          # the Doctor runs down the centre to him
add("ens4", T, 19.5, -0.5, 3.9, 110)
exit_to("ens4", T, 20.3, "W-DSR", label="Ensemble 4")
exit_to("ens3", T, 21.3, "W-DSR", label="Ensemble 3")
add("burr", T, 3.0, 1.1, 4.1, -100)
add("burr", T, 9.6, 1.1, 4.1, -165)
add("burr", T, 18.0, 1.1, 4.1, -120)
exit_to("burr", T, 19.0, "W-DSL")
add("laurens", T, 3.0, -1.9, 0.9, 30)
add("laurens", T, 9.6, -1.9, 0.9, 150)
add("laurens", T, 17.0, -1.9, 0.9, -90)
exit_to("laurens", T, 17.5, "W-MSR")
for at, x, z, f in [(2.5, -2.0, 2.6, 55), (9.6, -2.0, 2.6, 155), (25.0, -2.0, 2.6, 160), (28.5, 1.3, 3.1, -60),
                    (31.6, 1.3, 3.1, -60), (43.4, 1.15, 3.2, -70), (57.0, 1.35, 3.65, -20), (63.0, 0.85, 3.3, -50),
                    (70.25, 1.15, 3.25, -70), (74.4, 1.3, 3.3, -60), (80.45, 1.4, 3.35, 0)]:
    add("hamilton", T, at, x, z, f)
add(W, T, 4.5, ENT["D-UC"][0], ENT["D-UC"][1], off=True)
for at, x, z, f in [(9.6, 0.0, -2.3, 0), (25.0, 0.0, -2.3, 10), (31.6, -1.25, 3.05, 60), (43.4, -1.1, 3.2, 70),
                    (57.0, -1.3, 3.1, 50), (70.25, -1.2, 3.2, 70), (74.4, -1.3, 3.0, -140)]:
    add(W, T, at, x, z, f)
exit_to(W, T, 77.6, "W-DSR")     # SPOT: holds his key through his order; goes off DR on the button
# the office furniture, set on the chant stab (cue 478): ens2 the desk from SR, ens6 a chair from SL (props.py)
add("ens2", T, 21.5, ENT["W-MSR"][0], ENT["W-MSR"][1], off=True, label="Ensemble 2")
add("ens2", T, 28.5, -2.45, 2.15, 40)
exit_to("ens2", T, 29.0, "W-MSR")
add("ens6", T, 22.0, ENT["W-MSL"][0], ENT["W-MSL"][1], off=True, label="Ensemble 6")
add("ens6", T, 29.0, 1.45, 1.6, -20)
exit_to("ens6", T, 29.5, "W-MSL")

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
