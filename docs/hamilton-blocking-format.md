# The Hamilton blocking — data format

`assets/hamilton-blocking.json` holds the automatic actors' paths for
`midtown.html` (RULINGS FF–FN, `docs/superpowers/specs/2026-10-12-automatic-actors-design.md`).
The page fetches it at load. The **Blocking** panel edits it and saves it by
Download, because the page cannot write to the repository. A missing file
means an empty stage. For the whole show the file is **generated** by
`tools/blocking-merge.py` from per-segment files (see "Writing it in
segments" below).

```jsonc
{
  "format": "hamilton-blocking 1",
  "frame": "set-local metres ...",          // informational
  "model": "assets/mannequin-woman.glb",    // informational: every actor wears it today (FL)
  "note": "free text",
  "actors": [
    {
      "id": "eliza",                        // unique; made from the name when absent or taken
      "name": "Eliza",                      // her default head label (FN)
      "label": "…",                         // optional: a head label other than the name
      "color": "#5a8fd8",                   // #rrggbb, her body's colour and her label's dot
      "path": [ WAYPOINT, ... ]             // kept in time order by the editor and the merge
    }
  ]
}
```

### WAYPOINT

| key | required | meaning |
|---|---|---|
| `track` | yes | Album track id, as in `assets/hamilton-show.json` (`"1-01"` … `"2-23"`). |
| `at` | yes | Seconds into that track, the cues' own clock. She **arrives** here at this time. |
| `x`, `z` | yes | Where she stands, in **set-local metres**: the frame of `assets/hamilton-set.glb`. Upstage is −z, the house +z, stage right −x, stage left +x. The turntables' centre is (0, 0.95). The deck's edge is at z +5.4 at real size. |
| `y` | no | The floor height she stands at here: deck 0.045, galleries 2.743, stair treads in between. The editor writes it from where the waypoint was dropped. Absent means the deck. It is a hint, not a position: the page finds the floor with a ray down from the path's height + 0.6 m (FI). |
| `dwell` | no | Absent: she stands, then leaves just in time to walk the next leg at 1.3 m/s. `0`: she walks **through** without stopping, and the path curves through the waypoint. `n`: she leaves `n` s after arriving. |
| `facing` | no | Degrees she turns to while standing here: 0 the house, 90 stage left, −90 stage right, 180 upstage. Absent: the way she arrived. |
| `off` | no | `true`: she is not seen at this waypoint. She walks on from it, or off to it (FJ). |
| `label` | no | **From this waypoint on**, the name over her head (FN). It holds until another waypoint's `label` changes it. This is how Lafayette becomes Jefferson and an ensemble body becomes Seabury for a number and back. Like the rest of her pose, the label depends only on show time, so a seek shows the right name. |

Rules (FH, FJ, FN):

- Before her first waypoint and after her last, she stands at it.
- **An actor with no waypoints is not on stage.** A cast list with no blocking
  yet stands nobody anywhere.
- A stop eases in and out over 0.6 s and breaks the curve. A stop is the
  first or last waypoint, an offstage one, or any with a dwell other than 0.
  Walk-throughs shape the curve (centripetal Catmull–Rom).
- Two waypoints at the same time are a jump: she is at the second one from
  then on. The merge forbids it; time must increase.
- The head label is a constant-size tag about 0.25 m above her crown, drawn
  over everything so it reads from any seat. It hides with her. The panel's
  **Names** box turns all labels off.
- `MIDTOWN.actors.check()` reports:
  - an unknown track;
  - an `at` outside its track;
  - a dwell that runs past the next waypoint;
  - a leg faster than 3.5 m/s.

  Its seek-equivalence test also compares the labels.

Numbers are written rounded: positions to the millimetre, times to the
hundredth of a second, facings to a tenth of a degree.

## The company (fixed: `tools/hamilton-cast.json`)

Twenty bodies. The `name` is the default head label. The labels column lists
the **only** other labels each may show, by a waypoint's `label`. The
doublings follow the Original Broadway Cast's tracks as far as they are
known.

| id | name (default label) | colour | other labels it may show |
|---|---|---|---|
| `hamilton` | Hamilton | `#6abf7a` green | — |
| `burr` | Burr | `#c9a23a` gold | — |
| `eliza` | Eliza | `#5a8fd8` blue | — |
| `angelica` | Angelica | `#e0789e` pink | — |
| `peggy` | Peggy | `#e8d24a` yellow | Maria Reynolds (Act 2) |
| `washington` | Washington | `#ece6da` ivory | — |
| `lafayette` | Lafayette | `#4fc1c1` teal | Jefferson (Act 2) |
| `mulligan` | Mulligan | `#a47ad8` violet | Madison (Act 2) |
| `laurens` | Laurens | `#e0883a` orange | Philip (Act 2) |
| `king` | King George | `#c0392b` crimson | — |
| `ens1` | Ensemble 1 | `#8c8c8c` grey | The Bullet |
| `ens2` | Ensemble 2 | grey | Samuel Seabury |
| `ens3` | Ensemble 3 | grey | Charles Lee |
| `ens4` | Ensemble 4 | grey | Philip Schuyler, James Reynolds, The Doctor |
| `ens5` | Ensemble 5 | grey | George Eacker |
| `ens6`–`ens10` | Ensemble 6 … 10 | grey | — |

To go back to the default after a doubling, give a later waypoint the
default name (`"label": "Ensemble 2"`, `"label": "Lafayette"`).

## Writing it in segments (`tools/blocking-merge.py`)

```sh
python -I tools/blocking-merge.py <dir with seg1.json … seg8.json> [--check] [--out FILE]
```

A segment file holds only its own tracks:

```jsonc
{ "segment": 3, "tracks": ["1-12", "1-13", "1-14", "1-15", "1-16", "1-17"],
  "waypoints": { "hamilton": [ WAYPOINT, ... ], "ens2": [ ... ] },
  "notes": "free text" }
```

In a segment file, `y` may also be a **level name**. The merge fills it from
the floor map measured in the page (`tools/hamilton-floor.json`, 0.2 m cells
at Real size):

- `"deck"` is the same as leaving `y` out;
- `"gallery"` is 2.743, checked against the map;
- `"top"` is the highest floor at (x, z): a stair tread, a landing or a gallery.

The merge **fails** (writes nothing) if any of these occur:

- an unknown actor or track;
- an `at` outside its track;
- a label the cast does not allow that actor;
- time that does not strictly increase for an actor across the whole show;
- a track claimed by two segments.

It **warns** (and still writes) if any of these occur:

- a waypoint off the measured stage;
- standing on a prop or a stair at deck level;
- a gallery waypoint where there is no gallery;
- a gallery-to-gallery leg that leaves the gallery floor;
- a level change of more than 1 m over more than 3.5 m of floor (split it at
  a stair's foot and top);
- a stair climbed faster than 0.7 m/s across the floor;
- a leg faster than 3.5 m/s;
- a dwell that overruns;
- an offstage waypoint in plain view.

It then prints, for each track, the actors present and their waypoint counts.

## Seeing it without the page (`tools/blocking-plot.py`)

```sh
python -I tools/blocking-plot.py <segN.json | assets/hamilton-blocking.json> <track> <t1,t2,...> [--out DIR]   # plans at those moments
python -I tools/blocking-plot.py <file> <track> --path <actorId> [--out DIR]                                  # one actor's path, waypoint times
python -I tools/blocking-plot.py <file> <track|all> --sheet [--every 10] [--out DIR]                          # a contact sheet per track
```

The tool draws top-down PNGs from the measured floor map, using the page's pose rules re-implemented in Python. Standard
library only. Its header lists what it approximates: the height comes from the waypoints, not a ray.
