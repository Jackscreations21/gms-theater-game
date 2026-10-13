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
# REVIEW 2 (Jack: "the ensemble members are being used too much"): ironinkpen's Act II notes say Cabinet Battle #2 is
# "another rap battle, same kind of staging" as #1 (the company seated in a V of chairs opening to the house), that
# "everyone kind of clears out", leaving Hamilton and Jefferson to argue, and that Washington then calls Hamilton from
# off-stage on the left and the two go off together, leaving Jefferson alone (who is still there, staring after them,
# when Burr walks on in 2-08). So: the invented crowd (four on the USG, six standing upstage, leaning to every speaker)
# is cut; SIX of the company sit in a short V of chairs (three an arm, the vertex seats of Cabinet Battle #1's V, seg5gen
# V_SR / V_SL), carry their chairs on in the top of the number and off at the clear-out (956, 127.4) - props.py
# segment 6. Every principal spot that stood in the arms is moved inside the V.
T = "2-07"
CB2_SR = [(-3.1, 1.45), (-2.4, 0.5), (-1.7, -0.45)]           # downstage-out -> vertex (seg5gen V_SR without its DS seat)
CB2_SL = [(1.7, -0.45), (2.4, 0.5), (3.1, 1.45)]
CB2_LOOK = (0.0, 3.2)
CB2 = {  # id: (seat, wing, arrival) -- the chairs: props.py SEGMENT_6 cb2-chair-<n> (keep the two in step)
    "ens1": (CB2_SR[0], "W-DSR", 10.0), "ens2": (CB2_SR[1], "W-MSR", 9.6), "ens3": (CB2_SR[2], "W-USR", 10.4),
    "ens4": (CB2_SL[0], "W-USL", 10.6), "ens5": (CB2_SL[1], "W-MSL", 9.8), "ens6": (CB2_SL[2], "W-DSL", 10.2),
}
CB2_OUT = {"ens1": 127.6, "ens2": 128.2, "ens3": 129.4, "ens4": 129.0, "ens5": 128.4, "ens6": 127.8}

enter("washington", T, 5.0, "D-UC", C, 0, label="Washington")
wp("washington", T, 12.4, -0.3, 0.95, facing=-55)                  # hands Jefferson the floor
wp("washington", T, 18.5, 0.0, 0.45, facing=0)                     # held dim, centre (between the V's vertex seats)
wp("washington", T, 76.5, 0.05, 0.45, facing=50)                   # turns to Hamilton
wp("washington", T, 84.0, 0.0, 0.45, facing=0)
wp("washington", T, 114.8, 0.0, 2.0, facing=0)                     # rules: alone DC
wp("washington", T, 124.6, -0.5, 2.2, facing=60)                   # gives Hamilton the order
leave("washington", T, 127.6, (-0.5, 2.2), "D-UC")                 # gone (956): the room clears with him
# REVIEW 2: he calls Hamilton from off-stage left (ironinkpen) - seen at the SL wing on the last call, and the two go
enter("washington", T, 139.6, "W-DSL", (5.5, 4.45), -100)
leave("washington", T, 140.9, (5.5, 4.45), "W-DSL")

# Jefferson (lafayette) with Madison (mulligan) at his shoulder: the SR side, both in from the DR wing.
# REVIEW 2: every spot that stood in the SR arm of the V is moved inside it (the arm's seats: CB2_SR).
enter("lafayette", T, 7.0, "W-DSR", (-1.9, 1.9), 30, label="Jefferson")
wp("lafayette", T, 16.6, -3.0, 3.0, facing=20)                     # the DR mic (SPOT: at it for the top of the verse, 945)
wp("lafayette", T, 31.5, -1.5, 2.4, facing=40)                     # prowls in on the beams (SPOT: inside the mirrored key ch5)
wp("lafayette", T, 36.0, -2.0, 2.0, facing=30)
wp("lafayette", T, 42.0, -3.0, 3.0, facing=0)                      # the break: alone
wp("lafayette", T, 47.0, -1.4, 2.6, facing=30)
wp("lafayette", T, 54.5, 1.2, 2.3, facing=80)                      # right in Hamilton's face
wp("lafayette", T, 62.0, -0.8, 2.8, facing=20)
wp("lafayette", T, 67.5, -2.2, 3.4, facing=10)
wp("lafayette", T, 72.5, -2.65, 3.1, facing=0)                     # the mic-drop (SPOT: in the mirrored ch94 shaft (-2.23, 3.02))
wp("lafayette", T, 77.0, -2.0, 2.0, facing=50)                     # waits out Hamilton's verse inside the V
wp("lafayette", T, 100.0, -2.05, 2.05, facing=65)                  # Hamilton comes at him
wp("lafayette", T, 111.8, -2.0, 2.1, facing=80)                    # takes the French-king jab
wp("lafayette", T, 115.0, -2.2, 2.3, facing=70)
wp("lafayette", T, 130.0, -1.6, 2.9, facing=90)                    # face-off across centre (956), the room cleared
wp("lafayette", T, 139.6, -1.35, 2.95, facing=90)                  # the final dig (957); then alone, staring after them

enter("mulligan", T, 7.8, "W-DSR", (-2.7, 2.6), 40, label="Madison")
wp("mulligan", T, 14.0, -3.6, 3.6, facing=30)             # clear of Jefferson's way to the mic
wp("mulligan", T, 32.0, -2.5, 2.9, facing=40)
wp("mulligan", T, 42.0, -3.6, 3.6, facing=20)
wp("mulligan", T, 48.0, -2.6, 3.1, facing=40)
wp("mulligan", T, 54.5, -0.6, 2.4, facing=60)
wp("mulligan", T, 62.0, -1.9, 2.2, facing=30)
wp("mulligan", T, 68.0, -3.3, 3.8, facing=20)
wp("mulligan", T, 77.0, -2.7, 2.7, facing=50)
wp("mulligan", T, 113.0, -2.75, 2.75, facing=30)
leave("mulligan", T, 128.8, (-2.75, 2.75), "W-DSR")               # REVIEW 2: clears out with the room (re-enters SL in 2-08)

# Hamilton: the SL side, the DL mic for his verse; in from his 2-06 pool across the dark top of the number.
wp("hamilton", T, 6.5, 2.1, 2.0, facing=-60)                       # REVIEW 2: inside the V (was in the SL arm)
wp("hamilton", T, 18.0, 2.1, 2.05, facing=-45)
wp("hamilton", T, 54.0, 2.3, 2.2, facing=-70)                      # gives ground as Jefferson closes
wp("hamilton", T, 77.0, 2.2, 2.0, facing=-30)
wp("hamilton", T, 83.5, 3.0, 3.0, facing=-20)                      # the DL mic
wp("hamilton", T, 100.0, 1.6, 2.2, facing=-55)                     # drives at them
wp("hamilton", T, 105.5, 1.1, 1.7, facing=-70)
wp("hamilton", T, 111.8, 2.35, 3.0, facing=-60)                    # back at his mic: the punchline snap (953)
wp("hamilton", T, 119.0, 1.7, 1.3, facing=-30)                     # Washington rules: backs off
wp("hamilton", T, 126.0, 1.3, 2.6, facing=-60)                     # called to Washington (955)
wp("hamilton", T, 129.5, 1.6, 2.9, facing=-90)                     # face-off (956)
wp("hamilton", T, 140.0, 1.6, 2.9, facing=80)                      # Washington calls from the SL wing
leave("hamilton", T, 140.6, (1.6, 2.9), "W-DSL")                   # the two go off together

# The company in the V of chairs: in with their chairs while Washington calls the cabinet, seated facing the house's
# centre line, turning to whoever has the floor (as in Cabinet Battle #1), off with their chairs as the room clears.
for a, (seat, ent, arr) in CB2.items():
    f0 = face(seat, CB2_LOOK, 1.0)
    enter(a, T, arr, ent, seat, f0, label="Ensemble " + a[3:])
    wp(a, T, 16.4 + 0.1 * int(a[3:]), seat[0], seat[1], facing=face(seat, (-3.0, 3.0), 1.0))   # Jefferson's verse
    wp(a, T, 82.6 + 0.1 * int(a[3:]), seat[0], seat[1], facing=face(seat, (3.0, 3.0), 1.0))    # Hamilton's
    wp(a, T, 113.8 + 0.1 * int(a[3:]), seat[0], seat[1], facing=face(seat, (0.0, 2.0), 1.0))   # Washington rules
    leave(a, T, CB2_OUT[a], seat, ent)

# ---------------------------------------------------------------- 2-08 Washington on Your Side
# REVIEW 2: ironinkpen: Burr walks on while Jefferson is still staring after Hamilton and Washington; Jefferson reacts,
# then joins him; Madison enters from the left on his first line (the authorship line, just before hook 2, 966) and
# joins the two; Washington's desk is set up in the background while the focus is on the trio; Jefferson writes his
# resignation at the end and it ends up on Washington's desk. The libretto gives the ensemble three short lines in the
# money passage, but no account puts them on stage: the invented two lines of ten (122.6-176) are cut. One of the
# company (ens1) brings the desk on from the deck door during the plotters' answer (props.py washington-desk).
T = "2-08"
ROW = {"burr": (-2.7, 3.0), "lafayette": (0.0, 3.0), "mulligan": (2.7, 3.0)}
enter("burr", T, 6.5, "W-DSR", ROW["burr"], 20)
wp("lafayette", T, 3.5, -1.35, 2.95, facing=85)                    # still staring off SL after them
wp("lafayette", T, 7.0, -1.3, 2.95, facing=-70)                    # reacts to Burr
wp("lafayette", T, 10.5, ROW["lafayette"][0], ROW["lafayette"][1], facing=0)   # joins in: the centre key (961)
wp("burr", T, 10.5, ROW["burr"][0], ROW["burr"][1] + 0.01, facing=0)
# Jefferson's verse
wp("lafayette", T, 22.5, 0.0, 3.6, facing=0)                       # SPOT: in his key ch2
wp("burr", T, 23.5, -2.9, 2.0, facing=20)
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
wp("lafayette", T, 54.0, -0.6, 2.4, facing=0)                      # the room closes in
wp("lafayette", T, 59.5, 0.0, 3.6, facing=0)                       # the threat, forward in his key (ch2)
enter("mulligan", T, 63.5, "W-MSL", (3.0, 2.4), -50, label="Madison")   # REVIEW 2: in from SL on his first line
for a, p in ROW.items():                                           # hook 2
    wp(a, T, 66.5, p[0], p[1], facing=0)
# Madison's verse
wp("lafayette", T, 78.0, -0.6, 1.8, facing=20)
wp("burr", T, 78.0, -2.8, 2.6, facing=30)
wp("mulligan", T, 78.5, 1.6, 2.8, facing=-10)                      # his key moves in to (1.52, 2.75) (967)
wp("mulligan", T, 83.0, 1.3, 2.85, facing=15)
for a, p in ROW.items():                                           # hook 3 (SPOT: back in the keys for 968 at 87.0)
    wp(a, T, 88.0, p[0], p[1], facing=0)
# the drive: Jefferson round the SR half of the outer ring
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
# Washington's desk, set in the background by one of the company (props.py washington-desk: BRING at 123.0)
WDESK = (-0.4, 0.85)                                               # in the desk pool of 981 (ch18 at (0, 1.11)), clear of ch94
enter("ens1", T, 123.0, "D-UC", (WDESK[0], WDESK[1] - 0.6), 0)
leave("ens1", T, 124.6, (WDESK[0], WDESK[1] - 0.6), "D-UC")
# the chant: the three in a row
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
leave("mulligan", T, 180.5, (2.7, 3.21), "W-MSL", speed=2.0)
# REVIEW 2: Jefferson leaves his resignation on Washington's desk in the change (ironinkpen), then goes SL
wp("lafayette", T, 180.5, 0.001, 3.21, dwell=0)
wp("lafayette", "2-09", 1.2, -0.3, 1.5, facing=180)
leave("lafayette", "2-09", 2.6, (-0.3, 1.5), "W-MSL")

# ---------------------------------------------------------------- 2-09 One Last Time
# REVIEW 2: ironinkpen: Washington reads Jefferson's resignation as Hamilton walks in; he pours them drinks; the address
# starts with Hamilton at the front of the stage and Washington behind him, and they switch places over its course;
# Hamilton, Eliza and Philip stand together as a family in the final chorus, and members of the company come out to
# watch Washington's last speech (the company behind him at the end is the well-known picture). Cut: the chorus-2
# company (four on the USG, six on the deck, 88.7-112.4 - no account puts them on), the gallery four of the ending, and
# Hamilton's climb to read on the gallery (the blue gallery special ch25 of 992-995 is a reconstruction; it should be
# refocused onto the desk). Kept: Washington's walk upstage SL and the hold half-way up the SL stair (998-1000, his
# specials ch12 / ch20). The desk is real now: Washington's desk at WDESK (props.py), set in 2-08.
T = "2-09"
HPLACE = (-1.8, 2.2)   # Hamilton's place SR of the desk, by his shafts (984 ch92 (-1.62, 1.57), 987 (-1.41, 2.2))
WBEHIND = (WDESK[0], WDESK[1] - 0.6)
enter("washington", T, 5.0, "D-UC", WBEHIND, 0)                    # behind his desk, reading the resignation
enter("hamilton", T, 7.0, "W-MSR", (-1.7, 1.5), 60)
wp("washington", T, 20.0, 0.4, 0.1, facing=-50)                    # pours the drinks
wp("hamilton", T, 22.0, -1.45, 1.5, facing=65)
wp("hamilton", T, 34.5, HPLACE[0], HPLACE[1], facing=30)           # the address commissioned
wp("washington", T, 35.0, 0.45, 0.45, facing=-60)
wp("washington", T, 44.0, 0.55, 0.95, facing=0)                    # the decision: alone (SPOT: in ch94 (0.58, 1.16) by 44.0)
wp("hamilton", T, 47.0, HPLACE[0], HPLACE[1] + 0.05, facing=55)
wp("washington", T, 55.0, 1.0, 1.6, facing=-10)
wp("hamilton", T, 69.5, -1.3, 1.7, facing=70)                      # Hamilton protests
wp("washington", T, 70.0, 1.0, 1.7, facing=-80)
wp("washington", T, 81.8, 0.2, 3.9, facing=0)                      # comes down to teach, DSC (SPOT: ch13 picks him up at 80.5)
wp("hamilton", T, 85.0, -1.6, 2.6, facing=40)
wp("washington", T, 100.0, 0.8, 3.2, facing=-30)
wp("hamilton", T, 101.0, -1.5, 2.7, facing=55)
wp("hamilton", T, 113.5, HPLACE[0], HPLACE[1], facing=40)          # Hamilton's doubt
wp("washington", T, 113.0, 0.6, 1.95, facing=-70)                   # his shaft by the desk (987, ch94 (0.78, 1.99))
wp("washington", T, 127.5, 0.8, 2.0, facing=-40)                   # the reason: intimate
wp("washington", T, 137.0, 0.75, 1.85, facing=0)                   # the scripture
wp("hamilton", T, 140.0, HPLACE[0] + 0.05, HPLACE[1], facing=50)
wp("washington", T, 150.0, 0.9, 2.1, facing=-30)
wp("washington", T, 164.0, 0.8, 2.0, facing=0)                     # the hush before the address
# The address (992-995): Hamilton at the front reading, Washington behind him at the desk; they change places
# (Washington takes over the reading at 993, 193.1, DSC in ch13); Hamilton finishes it at the desk.
wp("washington", T, 168.0, 0.65, 0.5, dwell=0)
wp("washington", T, 170.0, WBEHIND[0] + 0.1, WBEHIND[1], facing=0)
wp("hamilton", T, 171.5, 0.0, 3.35, facing=0)                      # DSC, in ch13 (0, 3.32) as the address begins
wp("washington", T, 186.5, 0.75, 1.4, dwell=0)                     # the change of places
wp("hamilton", T, 184.0, 0.001, 3.35, dwell=0)
wp("hamilton", T, 185.8, -1.5, 1.5, dwell=0)
wp("hamilton", T, 186.9, -1.35, 0.2, dwell=0)
wp("hamilton", T, 187.6, WBEHIND[0] - 0.15, WBEHIND[1] - 0.05, facing=0)   # at the desk, writing
wp("washington", T, 193.0, 0.1, 3.3, facing=0)                     # takes over the reading (993), DSC in ch13
wp("washington", T, 195.0, 0.0, 3.35, facing=0)
wp("washington", T, 213.0, 0.2, 3.4, facing=0)
wp("hamilton", T, 214.0, WBEHIND[0] - 0.15, WBEHIND[1] - 0.04, facing=10)
wp("washington", T, 225.0, -0.3, 3.5, facing=20)
wp("hamilton", T, 237.0, WBEHIND[0] - 0.149, WBEHIND[1] - 0.04, dwell=0)   # the breath: he comes down from the desk
wp("hamilton", T, 238.5, -1.4, 0.4, dwell=0)
wp("hamilton", T, 241.5, -2.4, 2.9, facing=45)
wp("washington", T, 246.0, 0.0, 2.6, facing=0)                     # the company gathers
wp("hamilton", T, 249.5, -2.4, 3.0, facing=45)
wp("hamilton", T, 256.0, -2.4, 3.05, facing=20)
# Eliza and Philip join him: the family, SR front (ironinkpen)
enter("eliza", T, 247.0, "W-DSR", (-3.15, 3.45), 30)
enter("laurens", T, 248.5, "W-DSR", (-2.85, 2.25), 30)
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
wp("hamilton", T, 270.0, -2.2, 2.8, facing=135)                    # the family watches him go
wp("eliza", T, 270.4, -3.15, 3.45, facing=120)
wp("laurens", T, 270.8, -2.85, 2.25, facing=125)
leave("eliza", T, 293.0, (-3.15, 3.45), "W-DSR")
leave("hamilton", T, 293.6, (-2.2, 2.8), "W-DSR")
leave("laurens", T, 294.8, (-2.85, 2.25), "W-DSR")

# The company (six) come out to watch: a loose arc upstage, behind him, his lane to the SL stair left open.
CO9 = {  # id: (spot, entrance, arrival)
    "ens1": ((-2.6, -0.3), "W-MSR", 245.0), "ens2": ((-1.4, -0.9), "W-USR", 246.2), "ens3": ((-0.2, -1.3), "W-USR", 247.6),
    "ens4": ((0.9, -1.0), "W-USL", 249.0), "ens5": ((3.4, 0.3), "W-MSL", 245.4), "ens6": ((3.7, -0.9), "W-USL", 246.0),
}
for i, (a, (sp, ent, arr)) in enumerate(CO9.items()):
    enter(a, T, arr, ent, sp, face(sp, (0.0, 3.3), 0.8))
    wp(a, T, 268.0 + 0.2 * i, sp[0], sp[1], facing=face(sp, (1.0, 0.7), 0.9))           # he comes up through them
    wp(a, T, 283.0 + 0.2 * i, sp[0], sp[1] + 0.01, facing=face(sp, (3.35, -2.45), 0.9))  # watch him on the stair
    leave(a, T, 293.0 + 0.3 * i, (sp[0], sp[1] + 0.01), ent, speed=2.0)

# ---------------------------------------------------------------- 2-10 I Know Him
# REVIEW: his UC special lands at (0, -0.62) (1004), DC at (0, 3.4) (1005-1009.5: the button special is ch93 at
# (0, 3.41), so he stays in it for the laugh); he strolls on from the deck door as One Last Time ends.
# REVIEW 2: ironinkpen: the King walks on while Washington is still walking off and side-eyes him; alone centre; a
# member of the company runs on to tell him who the new president is and he shoos them away (hamilton-lyrics: they
# whisper it and giggle) - in the six-second silence before the name (1006, 39.1-45.1). The stool (he sets a small
# chair and sits to watch the next number) belongs to 2-11: seg7_gen.py / props.py segment 7 'king-stool'.
T = "2-10"
off("king", "2-09", 294.0, "D-UC", label="King George")
wp("king", T, 0.3, 1.25, -3.6, dwell=0)
wp("king", T, 2.0, 0.0, -0.65, facing=0)                           # appears UC on the first note
wp("king", T, 12.0, 0.2, -0.6, facing=-15)
wp("king", T, 24.0, 0.0, 3.45, facing=0)                           # comes down to his spot DC
wp("king", T, 33.0, 0.2, 3.4, facing=-10)
wp("king", T, 40.6, 0.15, 3.4, facing=-60)                         # the messenger
wp("king", T, 43.0, 0.1, 3.45, facing=-20)                         # shoos them off
wp("king", T, 45.1, 0.0, 3.45, facing=0)                           # the name
enter("ens3", T, 40.5, "W-DSR", (-0.65, 3.65), 70, speed=3.2)      # runs on, whispers the name
wp("ens3", T, 42.3, -0.65, 3.66, facing=40)                        # giggles
leave("ens3", T, 42.8, (-0.65, 3.66), "W-DSR", speed=3.2)
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
