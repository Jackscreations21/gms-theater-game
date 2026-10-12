# The Hamilton blocking — data format

`assets/hamilton-blocking.json` holds the automatic actors' paths for
`midtown.html` (RULINGS FF–FM, `docs/superpowers/specs/2026-10-12-automatic-actors-design.md`).
The page fetches it at load; the **Blocking** panel edits it and saves it by
Download (the page cannot write to the repository). A missing file is an empty
stage.

```jsonc
{
  "format": "hamilton-blocking 1",
  "frame": "set-local metres ...",          // informational
  "model": "assets/mannequin-woman.glb",    // informational: every actor wears it today (FL)
  "note": "free text",
  "actors": [
    {
      "id": "eliza",                        // unique; made from the name when absent or taken
      "name": "Eliza",                      // shown over her head while the panel is open
      "color": "#5a8fd8",                   // #rrggbb, her body's colour
      "path": [ WAYPOINT, ... ]             // kept in time order by the editor
    }
  ]
}
```

### WAYPOINT

| key | required | meaning |
|---|---|---|
| `track` | yes | album track id, as in `assets/hamilton-show.json` (`"1-01"` … `"2-23"`) |
| `at` | yes | seconds into that track — the cues' own clock. She **arrives** here at this time |
| `x`, `z` | yes | where, in **set-local metres**: the frame of `assets/hamilton-set.glb` — upstage −z, the house +z, stage right −x, stage left +x. The turntable's centre is (0, 0.95); the deck runs to about z +4.4 at real size |
| `y` | no | the floor height she stands at here (deck 0.045, galleries 2.74). The editor writes it from where the waypoint was dropped. Absent = the deck. It is a hint, not a position: the floor is found by a ray down from the path's height + 0.6 m (FI) |
| `dwell` | no | absent: she stands, then leaves just in time to walk the next leg at 1.3 m/s. `0`: she walks **through** without stopping (and the path curves through it). `n`: she leaves `n` s after arriving |
| `facing` | no | degrees she turns to while standing here: 0 the house, 90 stage left, −90 stage right, 180 upstage. Absent: the way she arrived |
| `off` | no | `true`: she is not seen at this waypoint — she walks on from it or off to it (FJ) |

Rules (FH, FJ):

- Before her first waypoint and after her last she stands at it.
- A stop (first, last, offstage, or any dwell other than 0) eases in and out
  over 0.6 s and breaks the curve; walk-throughs shape it (centripetal
  Catmull–Rom).
- Two waypoints at the same time are a jump (she is at the second from then).
- `MIDTOWN.actors.check()` reports an unknown track, an `at` outside its
  track, a dwell that runs past the next waypoint, and a leg faster than
  3.5 m/s.

Numbers are written rounded: positions to the millimetre, times to the
hundredth of a second, facings to a tenth of a degree.
