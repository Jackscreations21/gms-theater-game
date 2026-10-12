"""Generator for segment 6 (2-06 .. 2-10). Writes segments/seg6.json (notes from seg6-notes.txt)."""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "segments", "seg6.json")
os.makedirs(os.path.join(HERE, "segments"), exist_ok=True)
NOTES = os.path.join(HERE, "seg6-notes.txt")
LEN = {"2-06": 63.0, "2-07": 142.0, "2-08": 181.0, "2-09": 296.0, "2-10": 97.0}
ORDER = ["2-06", "2-07", "2-08", "2-09", "2-10"]

ENT = {
    "W-DSR": (-7.3, 4.6), "W-DSL": (7.3, 4.6), "W-MSR": (-8.5, 0.0), "W-MSL": (8.0, -0.5),
    "W-USR": (-8.5, -3.0), "W-USL": (8.5, -3.0), "D-UC": (1.25, -4.9), "G-UC": (0.6, -4.8),
}
PASS = (0.6, -3.35)  # where the backstage passage meets the USG
C = (0.0, 0.95)
W = {}


def face(a, b, cheat=0.7):
    """Facing from point a towards point b, cheated to `cheat` of the full turn (towards the house)."""
    ang = math.degrees(math.atan2(b[0] - a[0], b[1] - a[1]))
    return round(ang * cheat, 1)


def wp(actor, track, at, x, z, facing=None, dwell=None, off=False, y=None, label=None):
    while at > LEN[track]:
        at -= LEN[track]
        track = ORDER[ORDER.index(track) + 1]
    p = {"track": track, "at": round(at, 2), "x": round(x, 3), "z": round(z, 3)}
    if y is not None:
        p["y"] = y
    if dwell is not None:
        p["dwell"] = dwell
    if facing is not None:
        p["facing"] = facing
    if off:
        p["off"] = True
    if label:
        p["label"] = label
    W.setdefault(actor, []).append(p)


def off(actor, track, at, ent, label=None):
    x, z = ENT[ent]
    wp(actor, track, at, x, z, off=True, y="gallery" if ent == "G-UC" else None, label=label)


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def route(ent, target):
    """Via points from the entrance to the target, round the stairs and the wing posts."""
    if ent == "W-DSR":
        return [(-5.9, 4.55)]
    if ent == "W-DSL":
        return [(5.9, 4.55)]
    if ent == "W-MSR":
        return [(-4.1, -0.6)]
    if ent == "W-MSL":
        return [(4.9, -0.2)]
    if ent == "W-USR":
        return [(-4.9, -3.2)]
    if ent == "W-USL":
        v = [(5.2, -3.1)]
        if target[1] > -2.15:
            v.append((4.7, -2.0))
        elif target[0] < 2.3:
            v.append((2.0, -3.1))
        return v
    if ent == "D-UC":
        v = [(1.25, -3.9)]
        if abs(target[0]) < 0.3 and target[1] > -1.0:
            v.append((0.0, -2.4))
        return v
    return []


def plen(pts):
    return sum(dist(a, b) for a, b in zip(pts, pts[1:]))


def enter(actor, track, t_arr, ent, target, facing, label=None, speed=1.3):
    pts = [ENT[ent]] + route(ent, target) + [target]
    t0 = t_arr - plen(pts) / speed
    off(actor, track, t0, ent, label)
    t = t0
    for k in range(1, len(pts) - 1):
        t += dist(pts[k - 1], pts[k]) / speed
        wp(actor, track, t, pts[k][0], pts[k][1], dwell=0)
    wp(actor, track, t_arr, target[0], target[1], facing=facing)
    return t0


def leave(actor, track, t_leave, frm, ent, speed=1.3):
    pts = [frm] + list(reversed(route(ent, frm))) + [ENT[ent]]
    wp(actor, track, t_leave, frm[0] + 0.001, frm[1], dwell=0)
    t = t_leave
    for k in range(1, len(pts) - 1):
        t += dist(pts[k - 1], pts[k]) / speed
        wp(actor, track, t, pts[k][0], pts[k][1], dwell=0)
    t += dist(pts[-2], pts[-1]) / speed
    off(actor, track, t, ent)
    return t


def gal_enter(actor, track, t0, spot, facing, label=None, speed=1.3):
    """Up the backstage stair (offstage) and through the passage onto the USG at `spot` (x, z)."""
    off(actor, track, t0, "G-UC", label)
    t1 = t0 + 1.3
    wp(actor, track, t1, PASS[0], PASS[1], dwell=0, y="gallery")
    t2 = t1 + max(0.8, dist(PASS, spot) / speed)
    wp(actor, track, t2, spot[0], spot[1], facing=facing, y="gallery")
    return t2


def gal_enter_all(track, t_first, spots, facing, labels=False):
    """Farthest first through the passage, 1.0 s apart."""
    order = sorted(spots, key=lambda a: -dist(PASS, spots[a]))
    for k, a in enumerate(order):
        gal_enter(a, track, t_first + 1.0 * k, spots[a], facing,
                  label=("Ensemble " + a[3:]) if labels else None)


def gal_exit_all(track, t_first, spots, speed=1.5):
    """Nearest first along the USG to the passage and off at G-UC, 1.2 s apart at the passage."""
    order = sorted(spots, key=lambda a: dist(PASS, spots[a]))
    for k, a in enumerate(order):
        sp = spots[a]
        t_go = t_first + 1.2 * k
        t_pass = t_go + max(0.6, dist(PASS, sp) / speed)
        wp(a, track, t_go, sp[0] + 0.001, sp[1], dwell=0, y="gallery")
        wp(a, track, t_pass, PASS[0], PASS[1], dwell=0, y="gallery")
        off(a, track, t_pass + 1.1, "G-UC")


def lean(base, toward, d):
    vx, vz = toward[0] - base[0], toward[1] - base[1]
    n = math.hypot(vx, vz) or 1
    return (base[0] + d * vx / n, base[1] + d * vz / n)


# ---------------------------------------------------------------- 2-06 Schuyler Defeated
# REVIEW (seg 6 reviewer): Burr's and Hamilton's pools are at z 2.81 (pools/2-06.json ch94 / ch92), not 1.6; the
# gallery is out at 30.6 ("Eliza and Philip gone", cue 939); Hamilton stays, dimmed beside Burr, through 942 to the button.
T = "2-06"
# Eliza and Philip on the USG with the paper.
# SPOT (narrow-light pass): 935's two apron Vipers ch2/ch4 (zoom 10, dumped as "side") are their warm front keys,
# focused at gallery height on (-1.9, 2.72, -3.1) and (1.9, 2.72, -3.1), beam r about 1.1 m there. Eliza keeps to
# x -0.8 (1.1 m from ch2's focus); Philip moves from x -0.1 (2.0 m from both) to x 0.8 (1.1 m from ch4's).
gal_enter("eliza", T, 0.0, (-0.8, -3.35), 60, label="Eliza")
gal_enter("laurens", T, 0.6, (0.8, -3.35), -60, label="Philip")
wp("laurens", T, 11.0, 0.8, -3.15, facing=-35, y="gallery")       # to the rail, reading out
wp("eliza", T, 12.0, -0.85, -3.3, facing=40, y="gallery")
wp("laurens", T, 22.7, 0.8, -3.1, facing=-10, y="gallery")        # both look down at Burr
wp("eliza", T, 23.0, -0.8, -3.2, facing=25, y="gallery")
wp("eliza", T, 26.5, -0.8, -3.25, facing=60, y="gallery")
gal_exit_all(T, 27.0, {"laurens": (0.8, -3.1), "eliza": (-0.8, -3.25)})

# Burr: the new senator, in his shaft 1.2 m SL of centre (ch94 lands at (1.2, 2.81)).
enter("burr", T, 22.7, "W-MSL", (1.2, 2.8), 0, label="Burr")
wp("burr", T, 31.5, 1.15, 2.8, facing=-60)
wp("burr", T, 42.0, 0.95, 2.75, facing=-75)
wp("burr", T, 54.5, 1.0, 2.85, facing=-35)                         # watches Hamilton turn away
wp("burr", T, 58.0, 1.0, 3.0, facing=0)                            # alone: the warning (ch94 at (0.99, 3.02))
leave("burr", T, 62.9, (1.0, 3.0), "W-DSL", speed=2.0)             # on the button, into the dark

# Hamilton: storms in on the stop-time hit, his own shaft (ch92 at (-1.2, 2.81)), 2.4 m from Burr's.
enter("hamilton", T, 30.6, "W-MSR", (-1.2, 2.8), 60, label="Hamilton")
wp("hamilton", T, 41.0, -0.85, 2.75, facing=75)                    # closes in, still in his own pool
wp("hamilton", T, 51.0, -1.3, 2.9, facing=-120)                    # the crack: turns away
wp("hamilton", T, 58.0, -1.2, 2.85, facing=40)                     # dimmed beside Burr (942), looks back

# ---------------------------------------------------------------- 2-07 Cabinet Battle #2
# REVIEW: Jack's ruling (cue revision 5, PR #233): the Cabinet Battles have Jefferson (and Madison) STAGE RIGHT and
# Hamilton STAGE LEFT. The pools dump of 2-07 still has the old sides, so positions here are the mirror of its specials.
# Washington stays in his centre pool (held dim) through the verses (cues 945, 951), rules DC at 113.3 (954).
T = "2-07"
enter("washington", T, 5.0, "D-UC", C, 0, label="Washington")
wp("washington", T, 12.4, -0.3, 0.95, facing=-55)                  # hands Jefferson the floor
wp("washington", T, 18.5, 0.0, 0.45, facing=0)                     # held dim, centre
wp("washington", T, 76.5, 0.05, 0.45, facing=50)                   # turns to Hamilton
wp("washington", T, 84.0, 0.0, 0.45, facing=0)
wp("washington", T, 114.8, 0.0, 2.0, facing=0)                     # rules: alone DC
wp("washington", T, 124.6, -0.5, 2.2, facing=60)                   # gives Hamilton the order
leave("washington", T, 128.6, (-0.5, 2.2), "D-UC")

# Jefferson (lafayette) with Madison (mulligan) at his shoulder: the SR side.
enter("lafayette", T, 6.0, "W-MSR", (-2.2, 0.8), 30, label="Jefferson")
wp("lafayette", T, 16.6, -3.0, 3.0, facing=20)                     # the DR mic (SPOT: at it for the top of the verse, 945)
wp("lafayette", T, 31.5, -1.5, 2.4, facing=40)                     # prowls in on the beams (SPOT: inside the mirrored key ch5)
wp("lafayette", T, 36.0, -2.4, 1.6, facing=30)
wp("lafayette", T, 42.0, -3.0, 3.0, facing=0)                      # the break: alone
wp("lafayette", T, 47.0, -1.4, 2.6, facing=30)
wp("lafayette", T, 54.5, 1.9, 1.8, facing=80)                      # right in Hamilton's face
wp("lafayette", T, 62.0, -0.8, 2.8, facing=20)
wp("lafayette", T, 67.5, -2.2, 3.4, facing=10)
wp("lafayette", T, 72.5, -2.65, 3.1, facing=0)                     # the mic-drop (SPOT: in the mirrored ch94 shaft (-2.23, 3.02))
wp("lafayette", T, 77.0, -3.3, 1.2, facing=50)
wp("lafayette", T, 100.0, -3.35, 1.1, facing=65)                   # Hamilton comes at him
wp("lafayette", T, 111.8, -3.3, 1.25, facing=80)                   # takes the French-king jab
wp("lafayette", T, 115.0, -3.4, 1.6, facing=70)
wp("lafayette", T, 130.0, -1.6, 2.9, facing=90)                    # face-off across centre (956)
wp("lafayette", T, 139.6, -1.35, 2.95, facing=90)                  # the final dig (957)

enter("mulligan", T, 6.8, "W-MSR", (-3.4, 0.2), 40, label="Madison")
wp("mulligan", T, 18.5, -3.7, 2.1, facing=30)
wp("mulligan", T, 32.0, -2.6, 1.0, facing=40)
wp("mulligan", T, 42.0, -3.7, 2.2, facing=20)
wp("mulligan", T, 48.0, -2.8, 1.4, facing=40)
wp("mulligan", T, 54.5, -1.0, 0.6, facing=60)
wp("mulligan", T, 62.0, -2.2, 1.6, facing=30)
wp("mulligan", T, 68.0, -3.6, 2.2, facing=20)
wp("mulligan", T, 77.0, -3.6, 0.2, facing=50)
wp("mulligan", T, 113.0, -3.7, 0.3, facing=30)
wp("mulligan", T, 130.0, -2.6, 1.9, facing=80)

# Hamilton: the SL side, the DL mic for his verse; in from his 2-06 pool across the dark top of the number.
wp("hamilton", T, 6.5, 2.6, 1.4, facing=-60)
wp("hamilton", T, 18.0, 2.6, 1.45, facing=-45)
wp("hamilton", T, 54.0, 2.9, 1.6, facing=-70)                      # gives ground as Jefferson closes
wp("hamilton", T, 77.0, 2.2, 2.0, facing=-30)
wp("hamilton", T, 83.5, 3.0, 3.0, facing=-20)                      # the DL mic
wp("hamilton", T, 100.0, 1.6, 2.2, facing=-55)                     # drives at them
wp("hamilton", T, 105.5, 1.1, 1.7, facing=-70)
wp("hamilton", T, 111.8, 2.35, 3.0, facing=-60)                    # back at his mic: the punchline snap (953)
wp("hamilton", T, 119.0, 1.7, 1.3, facing=-30)                     # Washington rules: backs off
wp("hamilton", T, 126.0, 1.3, 2.6, facing=-60)                     # called to Washington (955)
wp("hamilton", T, 129.5, 1.6, 2.9, facing=-90)                     # face-off (956)
leave("hamilton", T, 140.3, (1.6, 2.9), "W-DSL")                   # called away on the button

# The ensemble: the battle's crowd (one company interjection in the libretto). Four on the USG, six upstage on the
# deck, reacting to whoever has the floor.
SPEAK = [(16.9, (-3.0, 3.0)), (30.3, (-1.2, 2.2)), (41.2, (-3.0, 3.0)), (46.0, (-1.4, 2.6)),
         (53.0, (1.9, 1.8)), (73.0, (-2.65, 3.1)), (75.8, (0.0, 0.45)), (83.1, (3.0, 3.0)), (99.0, (1.6, 2.2)),
         (112.3, (2.35, 3.0)), (114.3, (0.0, 2.0)), (128.4, (0.0, 2.9))]
GAL7 = {"ens1": (-3.4, -3.35), "ens2": (-1.8, -3.35), "ens3": (2.0, -3.35), "ens4": (3.6, -3.35)}
gal_enter_all(T, 0.0, GAL7, 0, labels=True)
for a, sp in GAL7.items():
    for k, (t, who) in enumerate(SPEAK):
        p = (sp[0] + (0.12 if k % 2 == 0 else 0.0), sp[1])
        wp(a, T, t + 0.4, p[0], p[1], facing=face(p, who, 0.8), y="gallery")
gal_exit_all(T, 135.5, GAL7)

DECK7 = {  # id: (spot, entrance) -- the mirror of the writer's, with the principals' sides
    "ens5": ((3.3, -0.4), "W-MSL"), "ens6": ((2.7, -1.5), "W-USL"), "ens7": ((1.4, -2.2), "W-USL"),
    "ens8": ((-1.9, -1.9), "W-USR"), "ens9": ((-2.9, -1.3), "W-USR"), "ens10": ((-3.6, -2.1), "W-USR"),   # clear of the post at (-3.75, -1.0)
}
OUT7 = {"ens5": 137.0, "ens6": 137.4, "ens7": 139.0, "ens8": 140.4, "ens9": 139.4, "ens10": 138.4}
for i, (a, (sp, ent)) in enumerate(DECK7.items()):
    enter(a, T, 6.0 + 0.5 * i + (1.5 if a in ("ens7", "ens10") else 0), ent, sp, face(sp, C, 0.8),
          label="Ensemble " + a[3:])
    for k, (t, who) in enumerate(SPEAK):
        d = 0.45 if t in (73.0, 112.3) else 0.25          # the mic-drop and the punchline: they lean right in
        p = lean(sp, who, d)
        wp(a, T, t + 0.6 + 0.15 * i, p[0], p[1], facing=face(p, who, 0.85))
    leave(a, T, OUT7[a], lean(sp, (0.0, 2.4), 0.25), ent)

# ---------------------------------------------------------------- 2-08 Washington on Your Side
T = "2-08"
ROW = {"burr": (-2.7, 3.0), "lafayette": (0.0, 3.0), "mulligan": (2.7, 3.0)}
enter("burr", T, 8.1, "W-DSR", ROW["burr"], 0)
wp("mulligan", T, 4.0, 0.0, 1.7, dwell=0)                          # crosses from the CB2 side in the dark, upstage of Jefferson
for a in ("lafayette", "mulligan"):
    wp(a, T, 8.1, ROW[a][0], ROW[a][1], facing=0)                  # the hook: three in a row
# Jefferson's verse
wp("lafayette", T, 22.5, 0.0, 3.6, facing=0)                       # SPOT: in his key ch2
wp("burr", T, 23.5, -2.9, 2.0, facing=20)
wp("mulligan", T, 23.5, 2.9, 2.0, facing=-20)
wp("lafayette", T, 30.0, -0.8, 3.3, facing=15)
wp("lafayette", T, 34.0, 0.9, 3.3, facing=-15, dwell=4.9)
# prowl: SPOT -- his key ch2 stays at full through 963 and he must be "alone in his key" at 964 (50.6), so he
# circles round the key (r about 1.05 about (0.1, 2.5)) instead of the writer's r 2.2 circle round the whole centre.
wp("lafayette", T, 41.0, 1.15, 2.35, dwell=0)
wp("lafayette", T, 43.5, 0.1, 1.45, dwell=0)
wp("lafayette", T, 46.0, -0.95, 2.4, dwell=0)
wp("lafayette", T, 48.5, -0.2, 3.45, dwell=0)
wp("lafayette", T, 50.6, 0.3, 3.2, facing=-10)
wp("burr", T, 44.0, -2.9, 2.1, facing=60)
wp("mulligan", T, 44.0, 2.9, 2.1, facing=-60)
wp("lafayette", T, 54.0, -0.6, 2.4, facing=0)                      # the room closes in
wp("lafayette", T, 59.5, 0.0, 3.6, facing=0)                       # the threat, forward in his key (ch2)
for a, p in ROW.items():                                           # hook 2
    wp(a, T, 66.5, p[0], p[1], facing=0)
# Madison's verse
wp("lafayette", T, 78.0, -0.6, 1.8, facing=20)
wp("burr", T, 78.0, -2.8, 2.6, facing=30)
wp("mulligan", T, 78.5, 1.6, 2.8, facing=-10)                      # his key moves in to (1.52, 2.75) (967)
wp("mulligan", T, 83.0, 1.3, 2.85, facing=15)
for a, p in ROW.items():                                           # hook 3 (SPOT: back in the keys for 968 at 87.0)
    wp(a, T, 88.0, p[0], p[1], facing=0)
# the drive: Jefferson round the SR half of the outer ring, Madison round the SL half
wp("lafayette", T, 97.1, 0.0, 3.01, dwell=0)
wp("lafayette", T, 99.4, -2.26, 3.21, dwell=0)
wp("lafayette", T, 101.7, -3.2, 0.95, dwell=0)
wp("lafayette", T, 104.0, -2.26, -1.31, dwell=0)
wp("lafayette", T, 107.1, -0.15, 3.0, facing=20)                   # decides to quit: the white shaft (970, (-0.17, 3.02))
# Madison's key is the one at full through the drive (969): he presses the case from it, SL
wp("mulligan", T, 97.1, 2.7, 3.01, dwell=0)
wp("mulligan", T, 102.0, 2.3, 2.2, facing=-40)
wp("mulligan", T, 107.0, 2.6, 2.6, facing=-50)
wp("mulligan", T, 113.4, 2.6, 2.8, facing=-75)                     # answers from across the stage (971, (2.59, 2.82))
wp("burr", T, 98.5, -3.9, 3.6, facing=30)
wp("burr", T, 115.0, -2.6, 2.8, facing=45)
# the chant: the three in a row, the company behind
wp("lafayette", T, 123.5, 0.0, 3.0, facing=0)
wp("mulligan", T, 124.0, 2.7, 3.0, facing=0)
wp("burr", T, 124.0, -2.7, 3.0, facing=0)
wp("lafayette", T, 140.0, -0.8, 3.6, facing=10)                    # the money: Jefferson works the line
wp("lafayette", T, 144.0, 0.8, 3.6, facing=-10)
wp("burr", T, 140.0, -2.9, 3.3, facing=20)
wp("mulligan", T, 140.0, 2.9, 3.3, facing=-20)
wp("lafayette", T, 149.5, 0.0, 2.8, facing=0)                      # the digging
for a, p in ROW.items():                                           # final hook
    wp(a, T, 153.0, p[0], p[1], facing=0)
TOP = {"burr": (-2.5, 3.65), "lafayette": (0.05, 3.75), "mulligan": (2.5, 3.65)}   # SPOT: the step down stays in the keys (976)
for a, p in TOP.items():                                           # the defiant climb
    wp(a, T, 166.5, p[0], p[1], facing=0)
for a, p in ROW.items():                                           # last hook
    wp(a, T, 174.0, p[0], p[1] + 0.2, facing=0)
    wp(a, T, 180.0, p[0], p[1] + 0.21, facing=0)                   # the button: three keys
leave("burr", T, 180.5, (-2.7, 3.21), "W-DSR", speed=2.0)
leave("lafayette", T, 180.5, (0.0, 3.21), "W-DSL", speed=2.0)
leave("mulligan", T, 180.5, (2.7, 3.21), "W-MSL", speed=2.0)

# the company: two lines upstage of the three for the chant, pulsing with it
SPOT8 = {
    "ens1": ((-2.55, -1.3), "W-USR"), "ens2": ((-0.85, -1.3), "W-USR"), "ens3": ((0.85, -1.3), "D-UC"),
    "ens4": ((2.55, -1.3), "D-UC"), "ens5": ((4.0, -1.3), "W-USL"),
    "ens6": ((-3.4, 0.5), "W-MSR"), "ens7": ((-1.7, 0.5), "W-MSR"), "ens8": ((0.0, 0.5), "D-UC"),
    "ens9": ((1.7, 0.5), "W-MSL"), "ens10": ((3.4, 0.5), "W-MSL"),
}
ARR8 = {"ens1": 121.4, "ens2": 123.0, "ens3": 121.6, "ens4": 122.6, "ens5": 121.6,
        "ens6": 122.8, "ens7": 121.2, "ens8": 125.0, "ens9": 121.2, "ens10": 122.8}
LEAVE8 = {"ens1": 175.2, "ens2": 176.4, "ens3": 175.2, "ens4": 176.0, "ens5": 175.2,
          "ens6": 175.2, "ens7": 176.6, "ens8": 176.8, "ens9": 176.4, "ens10": 175.2}
for i, (a, (sp, ent)) in enumerate(SPOT8.items()):
    x, z = sp
    s = -1 if i % 2 else 1
    enter(a, T, ARR8[a], ent, sp, 0)
    wp(a, T, 129.0, x + 0.3 * s, z, facing=-15 * s)                # the chant: a step to the side
    wp(a, T, 134.0, x, z, facing=0)
    fd = 0.45 if z > 0 else 0.7                                    # SPOT: the front line drives less (ens8 stayed in Jefferson's key)
    wp(a, T, 139.5, x, z + fd, facing=0)                           # the money: the company drives in
    wp(a, T, 150.0, x, z, facing=0)                                # the digging: sinks back
    wp(a, T, 158.0, x - 0.3 * s, z + 0.2, facing=15 * s)           # final hook
    wp(a, T, 166.8, x, z + (0.5 if z > 0 else 0.8), facing=0)      # the top
    wp(a, T, 174.0, x, z, facing=0)
    leave(a, T, LEAVE8[a], sp, ent, speed=1.5)

# ---------------------------------------------------------------- 2-09 One Last Time
T = "2-09"
DESK = (-1.8, 2.2)   # where Hamilton writes (no desk in the model: a notional place)
enter("washington", T, 4.5, "D-UC", (0.8, 0.3), -60)
enter("hamilton", T, 6.0, "W-MSR", (-1.4, 1.0), 60)
wp("washington", T, 20.0, 0.4, 0.1, facing=-50)
wp("hamilton", T, 22.0, -1.1, 1.0, facing=65)
wp("hamilton", T, 34.5, DESK[0], DESK[1], facing=30)               # the address commissioned
wp("washington", T, 35.0, -0.4, 1.2, facing=-60)
wp("washington", T, 44.0, 0.4, 0.7, facing=0)                      # the decision: alone (SPOT: in ch94 by 44.0)
wp("hamilton", T, 47.0, DESK[0], DESK[1] + 0.05, facing=55)
wp("washington", T, 55.0, 1.0, 1.6, facing=-10)
wp("hamilton", T, 69.5, -1.3, 1.7, facing=70)                      # Hamilton protests
wp("washington", T, 70.0, 1.0, 1.7, facing=-80)
wp("washington", T, 81.8, 0.2, 3.9, facing=0)                      # comes down to teach, DSC (SPOT: ch13 picks him up at 80.5)
wp("hamilton", T, 85.0, -1.6, 2.6, facing=40)
wp("washington", T, 100.0, 0.8, 3.2, facing=-30)
wp("hamilton", T, 101.0, -1.5, 2.7, facing=55)
wp("hamilton", T, 113.5, DESK[0], DESK[1], facing=40)              # Hamilton's doubt
wp("washington", T, 113.0, 0.6, 1.95, facing=-70)                   # his shaft by the desk (987, ch94 (0.78, 1.99))
wp("washington", T, 127.5, 0.8, 2.0, facing=-40)                   # the reason: intimate
wp("washington", T, 137.0, 0.75, 1.85, facing=0)                   # the scripture
wp("hamilton", T, 140.0, DESK[0] + 0.05, DESK[1], facing=50)
wp("washington", T, 150.0, 0.9, 2.1, facing=-30)
wp("washington", T, 164.0, 0.8, 2.0, facing=0)                     # the hush before the address
# Hamilton takes the address up the SR stair and reads it on the USG in the blue gallery special (992: ch25 at
# (-0.55, -3.02) from 174.8 to 243.7, "Hamilton reading upstage in blue"); Washington DSC in his key (ch13 (0, 3.32)).
wp("hamilton", T, 160.5, -4.5, 1.85, dwell=0)                      # SR stair foot
wp("hamilton", T, 165.5, -4.5, -0.3, dwell=0, y="gallery")         # top, onto the SR strip
wp("hamilton", T, 168.2, -4.5, -3.3, dwell=0, y="gallery")
wp("hamilton", T, 172.0, -0.55, -3.3, facing=0, y="gallery")       # reads the address
wp("washington", T, 175.5, 0.1, 3.3, facing=0)
wp("washington", T, 195.0, 0.0, 3.35, facing=0)                    # takes over the reading
wp("washington", T, 213.0, 0.2, 3.4, facing=0)
wp("hamilton", T, 214.0, -0.55, -3.28, facing=10, y="gallery")
wp("washington", T, 225.0, -0.3, 3.5, facing=20)
wp("hamilton", T, 237.0, -0.56, -3.3, dwell=0, y="gallery")        # the breath: down again before the company gathers
wp("hamilton", T, 240.0, -4.5, -3.3, dwell=0, y="gallery")
wp("hamilton", T, 242.6, -4.5, -0.3, dwell=0, y="gallery")
wp("hamilton", T, 247.2, -4.5, 1.85, dwell=0)                      # SR stair foot
wp("hamilton", T, 249.5, -2.4, 3.0, facing=45)
wp("washington", T, 246.0, 0.0, 2.6, facing=0)                     # the company gathers
wp("hamilton", T, 256.0, -2.4, 3.05, facing=20)
# Washington heads upstage SL through the company (998: ch12 picks him up at (2.54, -1.42)) and up the SL stair --
# the "GW UL Steps" idea: on the held note (1000) the only special left, ch20, lights a body half-way up the SL stair.
wp("washington", T, 266.0, 0.0, 2.62, dwell=0)
wp("washington", T, 269.5, 0.5, 1.4, dwell=0)
wp("washington", T, 273.0, 1.3, 0.2, dwell=0)
wp("washington", T, 276.5, 2.45, -1.3, facing=150, dwell=2.5)      # in the warm special on his way
wp("washington", T, 280.0, 2.05, -2.0, dwell=0)
wp("washington", T, 280.6, 2.2, -2.45, dwell=0)                    # SL stair foot
wp("washington", T, 282.8, 3.35, -2.45, facing=-40, dwell=4.5, y="top")   # half-way up: the held note, a look back
wp("washington", T, 289.5, 4.5, -2.45, dwell=0, y="gallery")       # the top
wp("washington", T, 290.3, 4.75, -2.9, dwell=0, y="gallery")
wp("washington", T, 290.8, 4.75, -3.3, dwell=0, y="gallery")
wp("washington", T, 293.8, 0.6, -3.35, dwell=0, y="gallery")       # along the USG behind the company, off by the passage
off("washington", T, 294.9, "G-UC")
wp("hamilton", T, 270.0, -2.2, 2.8, facing=135)                    # watches him go
leave("hamilton", T, 293.0, (-2.2, 2.8), "W-DSR")

# the company: four on the USG, six flanking Washington's path upstage
GAL9 = {"ens1": (-3.4, -3.35), "ens2": (-1.8, -3.35), "ens3": (2.0, -3.35), "ens4": (3.6, -3.35)}
gal_enter_all(T, 82.0, GAL9, 0)                                    # chorus 2: the company joins
for a, sp in GAL9.items():
    wp(a, T, 100.0, sp[0] + 0.1, sp[1], facing=face(sp, (0.8, 3.2), 0.8), y="gallery")
gal_exit_all(T, 112.4, {a: (sp[0] + 0.1, sp[1]) for a, sp in GAL9.items()})
GAL9B = {"ens1": (-3.9, -3.35), "ens2": (-2.7, -3.35), "ens3": (-1.5, -3.35), "ens4": (-0.3, -3.35)}  # SR half: his path
gal_enter_all(T, 243.0, GAL9B, 0)                                  # the company gathers (after Hamilton is down)
for a, sp in GAL9B.items():
    wp(a, T, 256.0, sp[0] + 0.1, sp[1], facing=0, y="gallery")
    wp(a, T, 282.0, sp[0] + 0.15, sp[1], facing=face(sp, (3.35, -2.45), 0.9), y="gallery")
gal_exit_all(T, 295.0, {a: (sp[0] + 0.15, sp[1]) for a, sp in GAL9B.items()}, speed=1.8)

DECK9 = {  # id: (spot, entrance)
    "ens5": ((-2.4, -0.2), "W-MSR"), "ens6": ((-1.9, -1.3), "W-USR"), "ens7": ((-1.6, -2.4), "W-USR"),
    "ens8": ((2.2, -0.2), "W-MSL"), "ens9": ((2.9, -1.2), "W-USL"), "ens10": ((3.9, -1.6), "W-USL"),
}
for i, (a, (sp, ent)) in enumerate(DECK9.items()):
    x, z = sp
    side = -1 if x < 0 else 1
    fin = face(sp, (0.0, 2.6), 0.6)
    stagger = 1.5 if a in ("ens7", "ens10") else 0.0          # entering: ens10 after ens9
    xstag = 1.5 if a in ("ens7", "ens9") else 0.0             # leaving: ens9 after ens10 (it passes his spot)
    enter(a, T, 88.7 + 0.5 * i + stagger, ent, sp, fin)
    wp(a, T, 97.0, x - 0.25 * side, z + 0.3, facing=face((x, z), (0.8, 3.2), 0.6))   # sway in on the chorus
    wp(a, T, 105.0, x, z, facing=fin)
    leave(a, T, 112.4 + 0.4 * i + xstag, sp, ent)
    enter(a, T, 245.0 + 0.4 * i + stagger, ent, sp, fin)
    wp(a, T, 256.0, x, z + 0.6, facing=fin)                         # the gospel build: step in
    wp(a, T, 262.0, x - 0.2 * side, z + 0.9, facing=fin)
    p = (x + 0.3 * side, z + 0.8) if a != "ens9" else (3.6, -0.5)   # SPOT: ens9 clear of his ch12 (2.54, -1.42) and of ens8's exit line
    wp(a, T, 268.0, p[0], p[1], facing=face(p, (0.3, 0.6), 0.8))   # open his path, turn to him
    wp(a, T, 283.0 + 0.2 * i, p[0], p[1] + 0.01, facing=face(p, (3.35, -2.45), 0.9))    # watch him go
    leave(a, T, 293.0 + 0.15 * i + xstag, (p[0], p[1] + 0.01), ent, speed=2.0)

# ---------------------------------------------------------------- 2-10 I Know Him
# REVIEW: his UC special lands at (0, -0.62) (1004), DC at (0, 3.4) (1005-1009.5: the button special is ch93 at
# (0, 3.41), so he stays in it for the laugh); he strolls on from the deck door as One Last Time ends.
T = "2-10"
off("king", "2-09", 294.0, "D-UC", label="King George")
wp("king", T, 0.3, 1.25, -3.6, dwell=0)
wp("king", T, 2.0, 0.0, -0.65, facing=0)                           # appears UC on the first note
wp("king", T, 12.0, 0.2, -0.6, facing=-15)
wp("king", T, 24.0, 0.0, 3.45, facing=0)                           # comes down to his spot DC
wp("king", T, 33.0, 0.2, 3.4, facing=-10)
wp("king", T, 45.1, 0.0, 3.45, facing=0)                           # the name
wp("king", T, 58.0, -1.0, 3.35, facing=20)                         # the band: he struts
wp("king", T, 64.0, 1.0, 3.35, facing=-20)
wp("king", T, 70.3, 0.0, 3.6, facing=0)
wp("king", T, 80.0, -0.9, 3.75, facing=15)                         # the scat chorus
wp("king", T, 84.0, 0.9, 3.75, facing=-15)
wp("king", T, 89.0, 0.0, 3.45, facing=0)                           # the announcement, his single special
wp("king", T, 92.0, -1.0, 3.7, facing=15)                          # the laugh, at the SR edge of the special
# SPOT (coordinator, boundary relaxed for 2-10 -> 2-11): he ENDS the segment ON STAGE in the button special ch93
# (0, 3.41), facing the house, at the blackout; seg 7 picks him up at that spot at 2-11 0.0.
wp("king", T, 94.4, 0.0, 3.41, facing=0)                           # back into the special for the button (1009.5 at 94.7)
wp("king", T, 95.6, 0.0, 3.41, facing=0)                           # the blackout: he stands in it

# ---------------------------------------------------------------- write
for a, path in W.items():   # time must increase as written: no silent sorting
    key = [(ORDER.index(p["track"]), p["at"]) for p in path]
    for k in range(1, len(key)):
        if key[k] <= key[k - 1]:
            raise SystemExit("time does not increase: %s #%d %s" % (a, k, path[k]))
seg = {"segment": 6, "tracks": ORDER, "waypoints": W,
       "notes": open(NOTES, encoding="utf-8").read().strip() if os.path.exists(NOTES) else ""}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(seg, f, indent=1)
print("wrote", OUT, sum(len(v) for v in W.values()), "waypoints")
