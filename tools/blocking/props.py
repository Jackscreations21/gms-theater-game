#!/usr/bin/env python3
"""The Hamilton props (RULING FR): writes segments/props.json for tools/blocking-merge.py.

    python -I props.py                     # writes segments/props.json
    python -I props.py --check [FILE]      # also checks the carries against the actors' paths in FILE
                                           # (default ../../assets/hamilton-blocking.json; give a fresh merge
                                           # when the segments have changed since it was committed)

The furniture the blocking already MIMES (the research notes and the eight generators put the bodies round
a desk, a table, a box that the model does not have), placed where the reviewers put it. Format (the merge
validates it; docs/hamilton-blocking-format.md):

    { "props": [ { "id", "kind", "label", "size": [w, h, d], "color",
                   "waypoints": [ { "track", "at", "x"?, "z"?, "facing"?, "off"?, "carriedBy"?, "note"? } ] } ] }

A waypoint with `carriedBy` hands the prop to that actor until the next waypoint (held at her waist, seen when
she is); one without places it on the floor at (x, z) turned to `facing`; `off` hides it. Before its first
waypoint a prop is hidden; every prop here still starts with an `off` waypoint.

HOW A CARRY IS CHOSEN. Bring-on: an actor the notes name, else one who is OFFSTAGE before the moment and walks
on to within about a metre of the spot just as the scene needs it (found with the actors' poses; --check
re-verifies it). Strike: an actor standing by the piece who then walks off. Where nobody is free, the piece is
set or struck IN THE DARK (a blackout or change the cues name) and its note says so. The set-down is the
carrier's arrival time; the piece jumps the last few tenths of a metre from her hands to its spot.

PLACEMENT. A desk's spot is where the reviewer stood the writer; the desk goes 0.55 m in front of or behind
him (whichever keeps the later blocking clear) — each note says which. A chair goes 0.7 m behind its sitter,
turned the way she faces, since the mannequins stand. Exceptions, from the staging: Seabury and Hamilton stand
"on" the box (1-06), Hamilton climbs his desk (2-14) and Burr the Room's table (2-05), Philip lies on his
table (2-17): the body stands inside the piece there, because the page has no raised standing.

None of it is sacred: Jack moves them in the Blocking editor. Standard library only.

EIGHT SECTIONS, ONE PER SEGMENT. The props are listed in eight delimited sections,
`# ===== SEGMENT 1 (1-01..1-06) =====` … `# ===== END SEGMENT 8 =====`. Each holds a plain list
(`SEGMENT_1` … `SEGMENT_8`) of operations: P (a new prop), DARK, HIDE, PLACE, CARRY, BRING, STRIKE.
The file concatenates the lists in show order. A prop's waypoints are its operations in that order.
  - The section is the one of the track the operation STARTS in. A prop is declared (P) once, in the
    section of its first use, and a later section adds to it by id.
  - Keep each prop's operations in time order within a section.
  - THE RULE FOR REVIEWERS: edit ONLY your own segment's section, with small exact replacements. Then
    run `python -I props.py --check ../segments/segN.json` against your own segment file. Read only the
    warnings for your own tracks: carries in other segments name actors your file does not have.
  - Then the merge: `python -I ../blocking-merge.py ../segments` from tools/blocking, or the usual
    command from the repo root.
"""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, 'segments', 'props.json')

WING = {'W-DSR': (-7.3, 4.6), 'W-DSL': (7.3, 4.6), 'W-MSR': (-8.5, 0.0), 'W-MSL': (8.0, -0.5), 'W-USR': (-8.5, -3.0),
        'W-USL': (8.5, -3.0), 'D-UC': (1.25, -4.9), 'G-UC': (0.6, -4.8)}

PROPS = []


class Prop:
    def __init__(self, pid, kind, label, color, size=None):
        self.d = {'id': pid, 'kind': kind, 'label': label}
        if size: self.d['size'] = size
        self.d['color'] = color
        self.w = []
        PROPS.append(self)

    def _add(self, track, at, note=None, **kw):
        o = {'track': track, 'at': round(at, 2)}
        for k in ('x', 'z'):
            if k in kw: o[k] = round(kw[k], 3)
        if kw.get('facing') is not None: o['facing'] = round(kw['facing'], 1)
        if kw.get('off'): o['off'] = True
        if kw.get('by'): o['carriedBy'] = kw['by']
        if note: o['note'] = note
        self.w.append(o)
        return self

    def hidden(self, track, at, where, note=None):            # off, parked at a wing (or a point)
        x, z = WING[where] if isinstance(where, str) else where
        return self._add(track, at, note, x=x, z=z, off=True)

    def place(self, track, at, x, z, facing=0.0, note=None):
        return self._add(track, at, note, x=x, z=z, facing=facing)

    def carry(self, track, at, who, note=None):
        return self._add(track, at, note, by=who)

    # the common shapes
    def set_dark(self, track, at, x, z, facing=0.0, note='set in the dark'):
        return self.hidden(track, at - 0.2, (x, z)).place(track, at, x, z, facing, note)

    def bring(self, who, track0, t0, track1, t1, x, z, facing=0.0, note=None, wing=None):
        """offstage until t0, carried on by `who` (offstage at t0), set down at (x, z) at t1"""
        self.hidden(track0, t0 - 0.2, wing or (x, z))
        return self.carry(track0, t0, who, note).place(track1, t1, x, z, facing)

    def strike(self, who, track0, t0, track1, t1, wing, note=None):
        """picked up by `who` at t0 (she is beside it), off with her; parked at `wing` once she is off (t1)"""
        return self.carry(track0, t0, who, note).hidden(track1, t1, wing)


def behind(p, facing, d):        # the point d metres behind someone at p facing `facing` (0 the house, 90 SL)
    a = math.radians(facing)
    return (p[0] - d * math.sin(a), p[1] - d * math.cos(a))


def ahead(p, facing, d):
    return behind(p, facing, -d)


def face(p, q):
    return math.degrees(math.atan2(q[0] - p[0], q[1] - p[1]))


def chair_for(sitter, look, d=0.7):
    f = face(sitter, look)
    return behind(sitter, f, d) + (f,)


OAK, WALNUT, PINE, CRATE = '#7a5230', '#5e3f26', '#9a7b4f', '#8c6d45'


# The operations a section lists. Each returns a plain tuple; the file applies them in section order (below).
def P(pid, kind, label, color, size=None):                                    # a new prop (declared once, where it first appears)
    return ('new', pid, (kind, label, color), {'size': size})


def DARK(pid, track, at, x, z, facing=0.0, note='set in the dark'):            # set on the floor in a blackout
    return ('set_dark', pid, (track, at, x, z, facing), {'note': note})


def HIDE(pid, track, at, where, note=None):                                     # off, parked at a wing name or an (x, z)
    return ('hidden', pid, (track, at, where), {'note': note})


def PLACE(pid, track, at, x, z, facing=0.0, note=None):                        # on the floor at (x, z)
    return ('place', pid, (track, at, x, z, facing), {'note': note})


def CARRY(pid, track, at, who, note=None):                                      # in `who`'s hands from `at`
    return ('carry', pid, (track, at, who), {'note': note})


def BRING(pid, who, track0, t0, track1, t1, x, z, facing=0.0, note=None, wing=None):    # carried on, set down at t1
    return ('bring', pid, (who, track0, t0, track1, t1, x, z, facing), {'note': note, 'wing': wing})


def STRIKE(pid, who, track0, t0, track1, t1, wing, note=None):                 # picked up at t0, parked off at t1
    return ('strike', pid, (who, track0, t0, track1, t1, wing), {'note': note})


# ===== SEGMENT 1 (1-01..1-06) =====
# the tavern: 1-04 the four by candlelight round their chairs DSC (seg1/t104.py); 1-12 the table DC (seg3gen.py).
# 1-06 Seabury's box (seg1/t106.py BOX (1.4, 2.4); "the soapbox goes on in the dark", cue 174.7)
FOUR = [('lafayette', (-1.26, 3.47), 20), ('hamilton', (-0.39, 3.78), 5), ('laurens', (0.49, 3.79), -5), ('mulligan', (1.37, 3.48), -20)]
EXIT4 = {'lafayette': ('W-MSR', 97.0), 'mulligan': ('W-MSL', 97.0), 'laurens': ('W-DSL', 95.0), 'hamilton': ('W-DSL', 95.0)}
SEGMENT_1 = [
    P('tavern-table', 'table', 'Tavern table', WALNUT, size=[0.8, 0.75, 0.5]),
    DARK('tavern-table', '1-03', 331.4, 0.0, 2.7, 0, note='1-04: set in the blackout at the end of My Shot (cue 139.5); the candle table upstage of their chairs'),
    HIDE('tavern-table', '1-04', 89.2, (0.0, 2.7), note='struck in the 1-04 blackout (cue 149)'),
    *[P(f'tavern-chair-{k + 1}', 'chair', f'Chair ({who.capitalize()})', PINE) for k, (who, p, f) in enumerate(FOUR)],
    *[DARK(f'tavern-chair-{k + 1}', '1-03', 331.4, *behind(p, f, 0.7), f, note="1-04: his chair, behind his pool (chair pools ch48-51); set in the blackout")
      for k, (who, p, f) in enumerate(FOUR)],
    *[STRIKE(f'tavern-chair-{k + 1}', who, '1-04', 89.1, '1-05', EXIT4[who][1] - 91.0, EXIT4[who][0], note='he takes his own chair off in the blackout (cue 149)')
      for k, (who, p, f) in enumerate(FOUR)],
    P('seabury-box', 'box', "Seabury's box", CRATE),
    DARK('seabury-box', '1-05', 184.75, 1.4, 2.4, -15, note='1-06: set in the 1-05 blackout (cue 174.7, "the soapbox goes on in the dark"); Seabury stands at it'),
    STRIKE('seabury-box', 'ens2', '1-06', 105.5, '1-06', 110.0, 'W-DSL', note='Seabury takes his box off at the end of the scene'),
]
# ===== END SEGMENT 1 =====

# ===== SEGMENT 2 (1-07..1-11) =====
# Washington's desk: 1-08 the tent and 1-09 (gen_seg2.py). The tavern table comes back for 1-12 (carried on at the end of 1-11).
SEGMENT_2 = [
    P('washington-desk', 'desk', "Washington's desk", OAK),
    BRING('washington-desk', 'ens9', '1-08', 170.8, '1-08', 177.0, -0.35, 0.85, 0, wing='W-USL',
          note="1-08 the tent (Q284): a soldier of the night march drops it off on his way across; Washington stands DS of it"),
    STRIKE('washington-desk', 'washington', '1-09', 33.3, '1-09', 41.0, 'W-USR', note='1-09: Washington takes it with him as the men take over (Q291)'),
    BRING('tavern-table', 'hamilton', '1-11', 328.5, '1-12', 5.0, -0.05, 2.1, 0,
          note='1-12: Hamilton brings it on from W-DSL; the four stand round it (seg3gen.py)', wing='W-DSL'),
]
# ===== END SEGMENT 2 =====

# ===== SEGMENT 3 (1-12..1-17) =====
# the tavern table struck in 1-12; Washington's desk in 1-14 Stay Alive (seg3gen.py) and 1-16 the office
SEGMENT_3 = [
    STRIKE('tavern-table', 'lafayette', '1-12', 75.8, '1-12', 83.0, 'W-MSL', note='the friends leave on 75.4: Lafayette takes it off W-MSL'),
    BRING('washington-desk', 'washington', '1-14', 11.5, '1-14', 16.9, 0.0, 0.85, 0, wing='D-UC',
          note='1-14: Washington brings his desk in from D-UC (cue 429 "a warm pool on the desk"); he stands DS of it'),
    STRIKE('washington-desk', 'washington', '1-14', 144.8, '1-14', 150.5, 'D-UC', note='he takes it off D-UC as the company clears (144.3)'),
    DARK('washington-desk', '1-16', 25.0, -1.75, 2.45, 40, note='1-16: set on the chant stab that turns the deck into his office (cue 478); behind his place'),
    STRIKE('washington-desk', 'washington', '1-16', 77.9, '1-16', 82.9, 'W-DSR', note='he takes it off DR on the button'),
]
# ===== END SEGMENT 3 =====

# ===== SEGMENT 4 (1-18..1-23) =====
# Hamilton's desk: 1-23 the Federalist papers (it comes back in segments 5, 7 and 8)
SEGMENT_4 = [
    P('hamilton-desk', 'desk', "Hamilton's desk", WALNUT),
    DARK('hamilton-desk', '1-23', 249.5, -1.0, 2.1, 0, note='1-23 the Federalist papers: set as the sisters go (gen4.py puts him at (-1.0, 2.65)); the desk US of him, clear of the finale pools DS'),
    HIDE('hamilton-desk', '1-23', 382.3, (-1.0, 2.1), note='struck in the Act One blackout (cue 669)'),
]
# ===== END SEGMENT 4 =====

# ===== SEGMENT 5 (2-01..2-05) =====
# Hamilton's desk in 2-03; 2-02 Cabinet Battle #1: the V of chairs (seg5gen.py V_SR / V_SL / WA_CHAIR), the company
# seated, all facing (0, 3.2); 2-05 The Room Where It Happens: the table USC (0, 0.2), the three round it
# (seg5gen.py TABLE, H_T / J_T / M_T)
LOOK = (0.0, 3.2)
VSEAT = [('ens1', (-3.8, 2.4), 'W-DSR'), ('ens3', (-3.1, 1.45), 'W-DSR'), ('ens2', (-2.4, 0.5), 'W-DSR'), ('ens6', (-1.7, -0.45), 'D-UC'),
         ('ens4', (-1.0, -1.4), 'D-UC'), ('ens7', (1.7, -0.45), 'D-UC'), ('ens8', (2.4, 0.5), 'W-MSL'), ('ens9', (3.1, 1.45), 'W-MSL'),
         ('ens10', (3.8, 2.4), 'W-DSL'), ('ens5', (4.5, 3.35), 'W-DSL')]
ORDER = [(-3.8, 2.4), (-3.1, 1.45), (-2.4, 0.5), (4.5, 3.35), (3.8, 2.4), (-1.0, -1.4), (3.1, 1.45), (-1.7, -0.45), (2.4, 0.5), (1.7, -0.45)]   # the order they get up (157.5 + 1.1 k, seg5gen.py)
H_T, J_T, M_T = (0.0, -0.65), (0.85, 0.3), (-0.85, 0.3)
SEGMENT_5 = [
    DARK('hamilton-desk', '2-03', 0.2, -1.5, 1.85, 0, note='2-03 Take a Break: set in the change ("Desk Mid SR"); he stands at (-1.5, 1.4), behind it'),
    HIDE('hamilton-desk', '2-04', 236.3, (-1.5, 1.85), note='struck in the Say No fade to black (cue 834)'),
    *[P(f'cabinet-chair-{k + 1}', 'chair', f'Chair ({who[3:] if who.startswith("ens") else who})', PINE) for k, (who, seat, wing) in enumerate(VSEAT)],
    *[DARK(f'cabinet-chair-{k + 1}', '2-01', 234.2, *chair_for(seat, LOOK, 0.45), note='2-02: the V of chairs (ironinkpen); set in the snap to the DSC mic special (cue 739.5)')
      for k, (who, seat, wing) in enumerate(VSEAT)],
    *[STRIKE(f'cabinet-chair-{k + 1}', who, '2-02', 157.5 + 1.1 * ORDER.index(seat), '2-02', 157.5 + 1.1 * ORDER.index(seat) + 9.5, wing,
             note='she takes her chair off as the meeting breaks up (156.5)') for k, (who, seat, wing) in enumerate(VSEAT)],
    P('washington-chair', 'chair', "Washington's chair", OAK),
    DARK('washington-chair', '2-01', 234.2, *chair_for((1.0, -1.4), LOOK, 0.45), note="2-02: his chair at the vertex of the SL arm (cue 742 'chair SL')"),
    STRIKE('washington-chair', 'washington', '2-02', 214.0, '2-03', 3.0, 'W-USL',
           note='struck in the change into Take a Break: Washington, beside it (1.3 m at 214.8), takes it as he goes off'),
    P('room-table', 'table', 'The Room table', WALNUT, size=[1.4, 0.75, 0.9]),
    DARK('room-table', '2-05', 0.2, 0.0, 0.2, 0, note='2-05: preset USC in the opening FTB (cue 864); Burr stands up on it at 277.9 (deck level here)'),
    HIDE('room-table', '2-05', 317.0, (0.0, 0.2), note='struck in the dark after the button (cue 896)'),
    P('room-chair-hamilton', 'chair', 'Chair (Hamilton)', PINE),
    DARK('room-chair-hamilton', '2-05', 0.2, *chair_for(H_T, (0.0, 0.2), 0.45), note='preset with the table'),
    STRIKE('room-chair-hamilton', 'hamilton', '2-05', 271.6, '2-05', 276.0, 'D-UC', note='the three leave upstage on 882 "Burr DS": each takes his chair'),
    P('room-chair-jefferson', 'chair', 'Chair (Jefferson)', PINE),
    BRING('room-chair-jefferson', 'lafayette', '2-05', 40.0, '2-05', 47.0, *chair_for(J_T, H_T, 0.45), wing='D-UC', note='Jefferson brings his chair in from D-UC to the dinner'),
    STRIKE('room-chair-jefferson', 'lafayette', '2-05', 272.4, '2-05', 277.5, 'D-UC'),
    P('room-chair-madison', 'chair', 'Chair (Madison)', PINE),
    BRING('room-chair-madison', 'mulligan', '2-05', 41.5, '2-05', 48.5, *chair_for(M_T, H_T, 0.45), wing='D-UC', note='Madison brings his chair in from D-UC'),
    STRIKE('room-chair-madison', 'mulligan', '2-05', 273.4, '2-05', 279.0, 'D-UC'),
]
# ===== END SEGMENT 5 =====

# ===== SEGMENT 6 (2-06..2-10) =====
SEGMENT_6 = [
]
# ===== END SEGMENT 6 =====

# ===== SEGMENT 7 (2-11..2-16) =====
# Hamilton's desk in 2-12, 2-14 and 2-16; 2-11 the King's stool UL (seg7_gen.py: "walks in the dark to UL: a stool is
# brought; he sits and watches"); 2-15 Burn: the bench, the lantern, the bucket (seg7_gen.py BENCH (-0.4, 3.2),
# LANTERN (-1.1, 3.05), BUCKET (-1.5, 2.6))
SEGMENT_7 = [
    BRING('hamilton-desk', 'hamilton', '2-11', 50.6, '2-12', 1.0, 1.4, 1.1, 0, wing='D-UC',
          note='2-12 We Know: Hamilton brings it in from D-UC; he stands behind it at (1.4, 0.5) (seg7_gen.py DESK)'),
    STRIKE('hamilton-desk', 'mulligan', '2-12', 116.3, '2-12', 121.5, 'W-MSL', note='the accusers withdraw: Madison takes it off'),
    BRING('hamilton-desk', 'ens1', '2-13', 130.7, '2-13', 134.0, 0.0, 1.9, 0, wing=(-0.95, 1.55),
          note='2-14: brought on in front of him at the decision (hamilton-lyrics); ens1 lifts it from the ring in the dark of 130.65'),
    STRIKE('hamilton-desk', 'hamilton', '2-14', 115.6, '2-14', 121.5, 'D-UC', note='Hamilton takes it off upstage as the title comes back (115.66)'),
    BRING('hamilton-desk', 'hamilton', '2-16', 76.0, '2-16', 81.5, -1.4, 1.75, 0, wing='D-UC',
          note="2-16 Hamilton's office: he brings it in from D-UC and stands behind it in the 'Desk' pool (Viper 12 at (-1.38, 1.82))"),
    STRIKE('hamilton-desk', 'hamilton', '2-16', 137.4, '2-16', 145.4, 'D-UC',
           note='struck as the room goes to the cold dawn (cue 1081): Hamilton, 1.8 m from it, takes it as he goes off'),
    P('king-stool', 'stool', "The King's stool", '#8c2a22'),
    DARK('king-stool', '2-11', 1.0, *behind((4.2, -1.6), -30, 0.35), -30, note='2-11: set UL in the dark while he walks to it'),
    STRIKE('king-stool', 'king', '2-11', 47.4, '2-11', 51.5, 'W-MSL', note='he takes his stool with him'),
    P('burn-bench', 'bench', 'Bench', OAK, size=[1.2, 0.45, 0.4]),
    DARK('burn-bench', '2-15', 0.2, -0.3, 2.85, 0, note='2-15: set in the dark (cue 1051: one figure on a bench); she sits at (-0.4, 3.2), DS of it'),
    HIDE('burn-bench', '2-15', 217.0, (-0.3, 2.85), note='struck in the dark after she goes (cue 1065)'),
    P('burn-bucket', 'bucket', 'Bucket', '#6f7377'),
    DARK('burn-bucket', '2-15', 0.2, -1.5, 2.6, 0, note='the burnt letters go in it'),
    HIDE('burn-bucket', '2-15', 217.0, (-1.5, 2.6), note='struck in the dark (cue 1065)'),
    P('burn-lantern', 'lantern', 'Lantern', '#d9a441'),
    BRING('burn-lantern', 'eliza', '2-14', 127.5, '2-15', 6.0, *ahead((-1.1, 3.05), -30, 0.3), 0, wing='W-DSR',
          note='2-15: Eliza brings it on and sets it at the bench\'s SR end (Viper 2, the candle glow)'),
    STRIKE('burn-lantern', 'eliza', '2-15', 217.2, '2-15', 224.0, 'W-DSR', note='"she exits with her lantern as the fire dies" (WatchMojo)'),
]
# ===== END SEGMENT 7 =====

# ===== SEGMENT 8 (2-17..2-23) =====
# 2-17 Stay Alive (Reprise): Philip's table at the front (gen_seg8.py TABLE_F), brought on from SR by the bearers;
# Hamilton's desk in 2-20 / 2-21
SEGMENT_8 = [
    P('philip-table', 'table', "Philip's table", WALNUT, size=[1.4, 0.75, 0.8]),
    BRING('philip-table', 'ens3', '2-17', 0.3, '2-17', 4.2, -0.3, 3.9, 0, wing='W-DSR',
          note='2-17: a bearer brings it from SR under Philip at the shot (gen_seg8.py); he lies on it'),
    HIDE('philip-table', '2-17', 109.8, (-0.3, 3.9), note='struck in the blackout (cue 1116) as Philip is carried off'),
    DARK('hamilton-desk', '2-19', 236.0, 0.0, 1.15, 0, note="2-20: set in the change; Burr's desk centre (cue 1193), he sits behind it at (0, 0.6)"),
    CARRY('hamilton-desk', '2-20', 147.75, 'hamilton', note='in the blackout (cue 1206) Hamilton moves it to his place near SR'),
    PLACE('hamilton-desk', '2-21', 0.44, -2.8, 3.15, 0, note='2-21: the desk near SR (ironinkpen); he sits behind it at (-2.8, 2.6)'),
    STRIKE('hamilton-desk', 'hamilton', '2-21', 44.4, '2-22', 3.0, 'W-DSR', note='he takes it off in the dark (cue 1238 FTB)'),
]
# ===== END SEGMENT 8 =====

# The sections, concatenated in show order. A prop's waypoints are its operations in this order, so within a section keep
# each prop's operations in time order (write() asserts it); a prop is declared (P) once, in the section of its first use.
REG = {}
for _op, _pid, _args, _kw in SEGMENT_1 + SEGMENT_2 + SEGMENT_3 + SEGMENT_4 + SEGMENT_5 + SEGMENT_6 + SEGMENT_7 + SEGMENT_8:
    if _op == 'new':
        assert _pid not in REG, f'{_pid} declared twice'
        REG[_pid] = Prop(_pid, *_args, **_kw)
    else:
        assert _pid in REG, f'{_pid} used before it is declared (P) in an earlier section'
        getattr(REG[_pid], _op)(*_args, **_kw)


def track_starts():
    show = json.load(open(os.path.join(ROOT, 'assets', 'hamilton-show.json'), encoding='utf-8'))
    T, start, L = {}, 0.0, show['tracks']
    for k, t in enumerate(L):       # RULING FQ: as tools/blocking-merge.py lays the clock out
        pre = 10.0 if k == 0 or t.get('hold') else 0.0
        post = 0.0 if k == len(L) - 1 else (10.0 if L[k + 1].get('hold') else 0.0)
        start += pre; T[t['id']] = start; start += float(t['len']) + post
    return T


def write():
    starts = track_starts()
    for p in PROPS:
        G = [starts[w['track']] + w['at'] for w in p.w]
        assert all(b > a for a, b in zip(G, G[1:])), (p.d['id'], 'time must increase', p.w)
        assert not p.w[0].get('carriedBy') and p.w[0].get('off'), (p.d['id'], 'start with an off waypoint')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write('{\n "note": "Generated by tools/blocking/props.py (RULING FR). Edit that, not this.",\n "props": [\n')
        for n, p in enumerate(PROPS):
            head = json.dumps(p.d, ensure_ascii=False)[:-1]
            f.write('  ' + head + ', "waypoints": [' + ','.join('\n   ' + json.dumps(w, ensure_ascii=False) for w in p.w) + '\n  ]}' +
                    (',' if n + 1 < len(PROPS) else '') + '\n')
        f.write(' ]\n}\n')
    print(f'{len(PROPS)} props, {sum(len(p.w) for p in PROPS)} waypoints -> {OUT}')


def check(path):
    """Each carry against the actors' poses (tools/blocking-plot.py's re-implementation of the page's)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location('bplot', os.path.join(ROOT, 'tools', 'blocking-plot.py'))
    bp = importlib.util.module_from_spec(spec); spec.loader.exec_module(bp)
    _, tracks, actors = bp.load_inputs(path)
    A = {a['id']: a for a in actors}
    G = lambda w: tracks[w['track']]['start'] + w['at']
    pose = lambda who, T: bp.pose(A[who]['c'], T) if who in A else None
    order = sorted(tracks.values(), key=lambda t: t['start'])
    def local(T):
        tr = [t for t in order if t['start'] - t['pre'] <= T + 1e-9][-1]
        return f"{tr['id']} {T - tr['start']:.1f}"
    bad = 0
    for p in PROPS:
        W = p.w
        for i, w in enumerate(W):
            if not w.get('carriedBy'): continue
            who, T0 = w['carriedBy'], G(w)
            prev, nxt = (W[i - 1] if i else None), (W[i + 1] if i + 1 < len(W) else None)
            q0 = pose(who, T0)
            if q0 is None:
                print(f'  {p.d["id"]}: {who} has no blocking'); bad += 1; continue
            msg = []
            if prev and not prev.get('off'):                 # a pick-up: she must be beside it
                d0 = math.hypot(q0['x'] - prev['x'], q0['z'] - prev['z'])
                if not q0['visible'] or d0 > 1.5: msg.append(f'pick-up at {w["track"]} {w["at"]}: {who} {"hidden" if not q0["visible"] else f"{d0:.2f} m away"}')
            elif q0['visible'] and 'in the dark' not in (w.get('note') or ''):     # a pick-up in a blackout may start on stage
                msg.append(f'carry-on at {w["track"]} {w["at"]}: {who} is already on stage at ({q0["x"]:.1f}, {q0["z"]:.1f})')
            if nxt and nxt.get('off'):
                q1 = pose(who, G(nxt))
                if q1['visible']: msg.append(f'parked off at {nxt["track"]} {nxt["at"]} but {who} is still on at ({q1["x"]:.1f}, {q1["z"]:.1f})')
                T = T0; seen_off = False
                while T < G(nxt):
                    v = pose(who, T)['visible']
                    if not v: seen_off = True
                    elif seen_off: msg.append(f'{who} comes back on at {T - tracks[w["track"]]["start"]:.1f} with it'); break
                    T += 0.2
            elif nxt:
                q1 = pose(who, G(nxt))
                d1 = math.hypot(q1['x'] - nxt['x'], q1['z'] - nxt['z'])
                if d1 > 1.2: msg.append(f'set-down at {nxt["track"]} {nxt["at"]}: {who} is {d1:.2f} m from the spot')
                else: print(f'  ok   {p.d["id"]}: {who} sets it down {d1:.2f} m from its spot ({nxt["track"]} {nxt["at"]})')
            for m in msg: print(f'  WARN {p.d["id"]}: {m}'); bad += 1
        # bodies standing inside a placed piece (expected for the box / the climbed desk / Burr's table / Philip's)
        hw, hd = [v / 2 for v in (p.d.get('size') or {'desk': [1.2, 0, 0.6], 'table': [1.5, 0, 0.9], 'chair': [0.45, 0, 0.45], 'bench': [1.4, 0, 0.4],
                                                     'stool': [0.4, 0, 0.4], 'box': [0.5, 0, 0.5], 'lantern': [0.2, 0, 0.2], 'bucket': [0.3, 0, 0.3]}[p.d['kind']])[::2]]
        for i, w in enumerate(W):
            if w.get('off') or w.get('carriedBy') or i + 1 >= len(W): continue
            t, t1, hits = G(w), G(W[i + 1]), {}
            yaw = math.radians(w.get('facing', 0))
            while t < t1:
                for a in actors:
                    q = bp.pose(a['c'], t)
                    if not q['visible'] or q['moving']: continue
                    dx, dz = q['x'] - w['x'], q['z'] - w['z']
                    u = dx * math.cos(yaw) - dz * math.sin(yaw); v = dx * math.sin(yaw) + dz * math.cos(yaw)
                    if abs(u) < hw + 0.12 and abs(v) < hd + 0.12: hits.setdefault(a['id'], []).append(t)
                t += 0.5
            for aid, ts in hits.items():
                if len(ts) >= 4: print(f'  note {p.d["id"]} at ({w["x"]}, {w["z"]}): {aid} stands in it for {len(ts) * 0.5:.0f} s from {local(ts[0])}')
    print(f'check: {bad} warning(s)')


if __name__ == '__main__':
    write()
    if '--check' in sys.argv:
        k = sys.argv.index('--check')
        check(sys.argv[k + 1] if k + 1 < len(sys.argv) else os.path.join(ROOT, 'assets', 'hamilton-blocking.json'))
