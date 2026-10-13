# The Hamilton blocking — data format

`assets/hamilton-blocking.json` holds the automatic actors' paths and the props for
`midtown.html` (RULINGS FF–FR, `docs/superpowers/specs/2026-10-12-automatic-actors-design.md`).
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
  ],
  "props": [ PROP, ... ]                    // optional, after the actors (RULING FR): see "Props" below
}
```

### WAYPOINT

| key | required | meaning |
|---|---|---|
| `track` | yes | Album track id, as in `assets/hamilton-show.json` (`"1-01"` … `"2-23"`). |
| `at` | yes | Seconds into that track, the cues' own clock. She **arrives** here at this time. 0 … the track's length, with the clock's edges (RULING FQ, below): −10 … 0 on 1-01 and 2-01, up to length + 10 on 1-23, no upper bound on 2-23. |
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

## The clock's edges: lead-ins and tails (RULING FQ)

Jack: *"for timing make it give me 10 seconds before the first song starts at the start of the first and second act, and give
me 10 seconds at the end of act 1, and as much time as I want at the end of act 2."*

| track | `at` may run | what happens there |
|---|---|---|
| **1-01** (the show's first) | **−10 … 236** | a 10 s LEAD-IN: the clock runs, no music; the preshow look (HOME / PRESET, the cues at 1-01 0.0) stands from −10; the music starts at 0 |
| **2-01** (the track the show file marks `hold`) | **−10 … 236** | a 10 s LEAD-IN after the interval: no music; the interval's look (1-23's last cue) holds; the music starts at 0 |
| **1-23** (the track before the `hold`) | 0 … **395** | a 10 s TAIL: the music has ended, the clock runs on; then the interval hold (the page stops and waits for Play) |
| **2-23** (the album's last) | 0 … **open** | an OPEN TAIL: the clock keeps counting after the music until Stop or a scrub |
| every other track | 0 … its length | as before |

- The rule is the show file's, not the ids: a lead-in before the first track and before any track with `hold`; a 10 s tail on
  the track before a `hold`; an open tail on the last track. `tools/blocking-merge.py` (`track_table`, `at_ok`),
  `tools/blocking-plot.py`, `midtown.html` (`showCompile`) and `blocking.html` (`buildTracks`) lay the clock out the same way.
- On the GLOBAL clock (seconds from the top of the show, what `MIDTOWN.actors.pose(id, T)` takes) a track's 0 is after its own
  lead-in and the next track starts after this one's tail: 1-01's 0 is T 10, 2-01's 0 is 1-23's end + 10 + 10.
- No cue fires in a lead-in that would not have fired before 0; seek = play holds across the edges (`MIDTOWN.show.check`,
  `MIDTOWN.actors.check`).
- The existing blocking does not use the edges yet; they are for Jack's edits.

## Props (RULING FR)

Jack: *"make it so i can also put in props i want people to carry on like desks or stuff."*

```jsonc
"props": [
  { "id": "room-table",                 // unique
    "kind": "table",                    // desk · table · chair · bench · stool · box · crate · lantern · bucket · custom
    "label": "The Room's table",        // the name tag over it (the Names box)
    "size": [1.5, 0.75, 0.9],           // [w across, h, d deep] metres; absent: the kind's default
    "color": "#8a6a48",
    "waypoints": [ PROP WAYPOINT, ... ] }
]
```

| kind | default size [w, h, d] m | | kind | default size |
|---|---|---|---|---|
| desk | 1.2 × 0.75 × 0.6 | | box | 0.5 × 0.45 × 0.5 |
| table | 1.5 × 0.75 × 0.9 | | crate | 0.6 × 0.5 × 0.6 |
| chair | 0.45 × 0.9 × 0.45 | | lantern | 0.2 × 0.35 × 0.2 |
| bench | 1.4 × 0.45 × 0.4 | | bucket | 0.3 × 0.35 × 0.3 |
| stool | 0.4 × 0.6 × 0.4 | | custom | 0.5 × 0.5 × 0.5 |

PROP WAYPOINT: `{ track, at, x, z, y?, facing?, off?, carriedBy?, note? }` — the same clock (and edges) as an actor's.

- **Placed** (no `carriedBy`): from `at` until its next waypoint the prop stands on the floor at (x, z), its front (+z of its
  own frame) turned to `facing` (degrees, as an actor's; absent 0, the house). The floor is found as an actor's is (a desk on
  the gallery sits on the gallery); `y` is a hint, like hers.
- **The glide (RULING FT):** when the NEXT waypoint is placed too (neither of the two carried, neither `off`), the prop moves
  from the first spot to the second in a straight line and turns the short way, linearly in time from the first's `at` to
  the second's. Examples: a piece riding the turntable (a few points on the ring), or a piece pushed across. To make it JUMP
  instead (moved in a blackout), put an `off` between, or a carry. In Simple mode two placed keyframes of a square glide the
  same way, as two keyframes of a dot walk.
- **Carried** (`carriedBy: "<actor id>"`, x / z not needed): from `at` until its next waypoint it rides with her — held in
  front of her at waist height (its centre 1.0 m up, 0.22 m beyond her front), turned with her, seen when she is.
- **`off`**: not seen from `at` on.
- **Before its first waypoint a prop is not on stage**; after its last it stays as that one says.
- "Hamilton carries the desk on at 2-05 12.0 and sets it at centre at 18.0" is two waypoints:
  `{ "track": "2-05", "at": 12.0, "carriedBy": "hamilton" }`, `{ "track": "2-05", "at": 18.0, "x": 0, "z": 1.9, "facing": 0 }`.
- A prop's state is a pure function of show time (and its carrier's pose), so a seek shows it right; `MIDTOWN.actors.check()`
  includes props. `MIDTOWN.actors.props`, `MIDTOWN.actors.propPose(id, T)`.
- In the page: a few shaded boxes of its size and colour (a desk or a table is a top on four legs, a chair has a back), lit as
  the actors are, with a name tag (the Names box).
- The seed is GENERATED: `python -I tools/blocking/props.py` writes `tools/blocking/segments/props.json`; the merge validates it
  (kind, size, colour, unique id, `carriedBy` a cast id, x / z on a placed waypoint, the track ranges, strictly increasing times
  — errors; a placed prop off the stage, a carrier with no waypoints — warnings) and writes `props` after the actors.

## The editor: `blocking.html` (RULING FP)

A second page beside `midtown.html`, for Jack: the stage from the top (the house at the bottom, stage left on the right, as
`tools/blocking-plot.py` draws it), every part labelled (upper level / lower level, the galleries at 2.74 m, the stairs with
an arrow up, the turntables, the balcony, the pit, the house, the entrances), a hover readout of the part, level and height
under the pointer, every actor at the current moment with her head label, the selected actor's or prop's path through the
track, the music (Jack's soundtrack, or the MP3 chosen from disk, or a silent clock), the BLACKOUT indicator and the blackouts
on the scrub bars, the person lights (`assets/hamilton-pools.json`, optional), and editing: drag, click to add at the current
time, the waypoint form, delete, undo / redo, nudges; the merge tool's checks run live. Its pose and prop functions are
`midtown.html`'s, lifted (checked equal at 360 random moments), so the plan and the 3D page agree.

**Two modes.** It opens in **Simple** (recording): one big dot per person, one square per prop, the plan, the music, the
blackout indicator and the scrub bars — no lines, no forms. Jack plays the music (Space anywhere) and drags a dot to where that
person should be: that records a KEYFRAME at that moment (below, "The recording file"). **Advanced ▸** (top bar) is the full
editor described here; its edits and the recording are separate (Advanced edits the loaded paths, Simple records over them).

It writes nothing to the repository. Advanced's three downloads:

1. **`hamilton-blocking-changes-<date>.json` — "what to change"** (below). This is what Jack hands to a session.
2. The same as Markdown, to read.
3. **`hamilton-blocking.json`** — the whole edited file, laid out byte for byte as the merge writes it (an unedited file
   downloads identical to the committed one). Because the committed file is GENERATED (FO), a session should apply the
   change file to the generators, not drop this file in; it is there for a quick look in `midtown.html` (Blocking → Load…).

A draft of the edits and notes is kept in the browser (localStorage `hamilton-blocking-editor-draft-1`) and OFFERED on
reload ("Restore it" / "Discard it"), never applied by itself.

- **Clear this song** (beside the track list; confirm; one undo step): every waypoint of every actor and prop in the CURRENT
  track goes, so Jack blocks the number from a blank stage. Because an actor stands at her last waypoint after it (and at her
  first before it), someone on stage at the end of the song before, or needed on stage at the top of the song after, would
  otherwise stand frozen through the cleared song. So the clear leaves, for each such actor, `off` "holds" in the song (note
  `clear-track: held offstage`): she walks off at a walk to the nearest wing (in the song's first seconds if the song before kept
  her to its end), and waits in the wing nearest her next spot until she must walk on to reach it (its last seconds). A prop
  still seen gets an `off` at the song's top. The merge's rules still hold (checked: 0 errors, 0 warnings after clearing 1-02,
  1-04 and 2-17). **Restore this song** puts the track back as the loaded file has it (also one undo step).
- **The level**, where the floor has two (under and on the galleries, the balcony): the waypoint form's **Lower · deck** /
  **Upper · gallery (2.74 m)** buttons, the **⇅** tab by the selected disc, or the **L** key. Elsewhere the buttons are disabled
  and the form says the one level the floor has. Dragging keeps the chosen level while the disc stays over gallery floor; off
  it, the waypoint is on the deck. In the file the level is `y` (absent = the deck, 2.743 = the gallery); a segment generator
  may write it as the merge's level names `"deck"` / `"gallery"`, and the change file names it (`level`, below).
- **Music:** the soundtrack loads with a percentage; Play while it loads runs the clock silent and the music joins when it
  lands; in a lead-in the Music line says "lead-in — the music starts at 0:00"; a browser refusal to play is shown and stops
  the clock; with no file in `assets/audio/` it says to press "Choose the MP3…".

### Simple mode: recording, and the recording file

Jack: *"just make it so every person has a dot, then I can play the music and I move the people to where they need to be, and
make it so I pause it with space bar … then make it export that so I can give it to you"*; *"when I add furniture it creates a
square for it, and it has a button, then when I press it I can choose who carries it at that time."*

- **Recording.** Dragging a dot (or a prop's square) records a keyframe for it at the CURRENT clock time: paused, the paused
  time; playing, the time the drag ENDS (everyone else keeps moving meanwhile). Dropped in a wing (|x| ≥ 6.7), behind the
  upstage wall (z ≤ −4.4) or on an entrance tab, it is OFFSTAGE (`off: true`). A keyframe within ±0.25 s of an existing one
  for the same body replaces it. **Level:** where the floor has two, the hovered dot shows ⇅ (or press **L** over it) to record
  it on the other level at the current time; the dot's white rim means up. **Ctrl+Z** takes back the last thing recorded.
- **Transport:** Space play / pause anywhere on the page (never a scroll or a button press); ← / → ±1 s, Shift ±5 s; Home the
  song's top. The song list (with each song's keyframe count), "Keyframes: N in this song" and a tick per keyframe on the song's
  scrub bar show what is recorded.
- **Furniture:** "Add furniture" (desk, table, chair, bench, stool, box, crate, lantern, bucket; a name) makes a square in the
  upstage-right wing tray. Every square has a **carry ▾** button (on hover or when clicked): it lists "Nobody — set it down
  here" and the company, the nearest first; choosing someone records `{ at, carriedBy }` now — the square rides with them until
  it is dragged somewhere (a placed keyframe: set down there, then). A CARRIED square is drawn beside its carrier's dot (not
  under it), tagged "carried by …", with a **⬇ put down** button (a placed keyframe where it rides, now); its carry ▾ list
  starts with **Set down here, now** and **Off stage, now** (an `off` keyframe at the nearest wing). In the file a set-down
  is simply the next keyframe with x / z (no `carriedBy`). The 28 seeded props show as squares with their carries and
  are overridden the same way. Only the props of the current song (and new furniture) are shown while unseen.
- **THE RULE:** a body's keyframes in a song REPLACE its loaded waypoints in that song from its first keyframe's time on; the
  loaded waypoints before that stay, and so do other songs'. **Clear this song** first drops every loaded waypoint of the song
  (and anything recorded in it): a body with no keyframe there is offstage through it (the same offstage holds as Advanced's
  clear: nobody frozen), and one with keyframes waits in the wing until she must walk on to her first. Between keyframes a
  body moves by the page's own pose rules — each keyframe is a stop with no dwell and no facing, so she walks the straight leg
  at 1.3 m/s, leaving just in time (faster if the time is short) — so the playback is what `midtown.html` will do.
- **Selecting and deleting** (Jack: *"make it so I can delete the track for a specific person, or it can delete the track in
  front of the position of the song I am at. Make it so I can select multiple people at once"*): click a dot (or square) to
  select it, Shift / Ctrl-click to add, drag a box on the empty plan round several, Ctrl+A everyone, Esc clears; the cast list
  shows and makes the same selection (Shift-click for a range). Then:
  - **Delete their track in this song** (the Delete key): each selected body's whole track in the CURRENT song goes — its
    keyframes there and the loaded blocking's waypoints there.
  - **Delete from 2:03 on in this song** (Shift+Delete; the button shows the clock's time): everything of theirs in the
    CURRENT song at or after the clock's time goes; nothing before it in the song, and nothing in any other song.
  - Both confirm (the song, the time, who, how many keyframes) and are one Ctrl+Z. Nobody is left frozen: a body on stage at
    the cut walks off to the nearest wing right after it, and waits in the wing nearest her next spot until a later keyframe
    (or the next song) needs her. A cut prop goes off at the cut.
  - **Delete this keyframe** (X): the keyframe within ±0.25 s of the clock of the dot under the pointer (or the one selected).
- **Saved** to this browser (localStorage `hamilton-blocking-recording-1`) at every keyframe and note, and back on reload with
  a one-line banner ("Discard it" throws it away). **Restore** puts the current song back as the loaded file has it.

**The recording file** (`hamilton-blocking-recording-<date>.json`, the **Export** button; "Load a recording…" reads one back):

```jsonc
{
  "format": "hamilton-blocking-recording 1", "made": "…", "by": "blocking.html, Simple mode (RULING FP)",
  "source": { "file": "assets/hamilton-blocking.json", "bytes": 722013, "sha256": "…", "waypoints": 9559 },
  "rule": "…the rule above, in words…",
  "clock": "at: seconds into the album track; 1-01 and 2-01 may be −10…0, 1-23 up to its length + 10, 2-23 open (RULING FQ)",
  "notes": { "global": "…", "tracks": { "1-04": "…" } },
  "furniture": [ { "id": "f-test-desk", "kind": "desk", "label": "Test desk", "size": [1.2, 0.75, 0.6], "color": "#9a7b4f" } ],   // props he added
  "keyframes": 5,
  "tracks": {
    "1-04": { "title": "The Story of Tonight", "cleared": false,
              "actors": { "laurens": [ { "at": 30, "x": 2, "z": 0, "level": "deck", "off": false } ] },
              "props":  { "f-test-desk": [ { "at": 66.1, "carriedBy": "laurens", "off": false },
                                           { "at": 77.4, "x": 0, "z": 1.65, "off": false },
                                           { "at": 85.6, "carriedBy": "hamilton", "off": false } ] },
              "deletions": { "actors": { "laurens": { "deleted": "all" }, "hamilton": { "deletedFrom": 30 } }, "props": {} } } }
}
```

**Applying it (for the next session):** check `source.sha256` against the committed blocking. For each track: if `cleared`,
remove every waypoint the generator writes in that track (actors; props in `tools/blocking/props.py`); otherwise, per body,
remove its waypoints in the track at or after the EARLIER of its first keyframe's `at` and its `deletions` entry
(`deleted: "all"` = all of them in that track; `deletedFrom: s` = those at or after s in that track only). A body whose track
was cut and who would be left on stage gets an offstage waypoint at the nearest wing just after the cut (and one in the wing
nearest her next spot, timed to walk on to it), as the editor plays it. Then write each keyframe as a waypoint:
`{ track, at, x, z }` plus `"y": "gallery"` when `level` is "gallery" and `"off": true` when `off` — no `dwell`, no `facing`
(add a `facing` only if Jack's note asks); a prop keyframe with `carriedBy` becomes `{ track, at, carriedBy }`, one with x / z a
placed waypoint (`facing` 0 unless noted). Each `furniture` entry becomes a new prop in `props.py`. A cleared track's bodies
with no keyframes need an offstage waypoint at the track's top and before its end (the editor's holds: the nearest wing). Run
the generators and the merge, then `MIDTOWN.actors.check()`.

### The editor's change file

```jsonc
{
  "format": "hamilton-blocking-changes 1",
  "made": "2026-10-12T20:52:43.000Z", "by": "blocking.html (RULING FP)",
  "source": { "file": "assets/hamilton-blocking.json", "bytes": 719625, "sha256": "1bada61f…",   // what the edits were made against
              "format": "hamilton-blocking 1", "actors": 20, "waypoints": 9410, "props": 0 },
  "show":   { "file": "assets/hamilton-show.json", "cues": 892, "tracks": 46, "approxSha256": "…" },   // a hash of the parsed show, to tell revisions apart
  "clock":  "track + at: seconds into the album track …",
  "notes":  { "global": "Jack's notes on the whole show", "tracks": { "1-05": "Jack's notes on that number" } },
  "summary": { "changes": 3, "byOp": { "move": 2, "add": 1 }, "byTrack": { "1-05": 3 }, "problemsNow": { "errors": 0, "warnings": 1 } },
  "changes": [ CHANGE, ... ]                                            // in show order
}
```

CHANGE:

| key | meaning |
|---|---|
| `n` | 1, 2, … in show order |
| `kind` | `"actor"` or `"prop"`; then `actor` or `prop`: the id; `name`: the actor's name or the prop's label |
| `track`, `title` | where it is (the waypoint after the change, else before); `null` for a prop-level change |
| `op`, `ops` | the first of `ops`, and every kind of change on this one waypoint |
| `before`, `after` | the waypoint as it was in the source file and as it is now (`null` for an add / a delete), in the file's format; an actor waypoint may carry Jack's `note` |
| `note` | Jack's note on this waypoint (the form's Note box), or "" |
| `generator` | where the fix goes (RULING FO): the segment's generator for the track, `tools/blocking/props.py` for a prop |

Ops on an actor's waypoint: `add`, `delete`, `move` (x / z), `retime` (track / at), `dwell`, `facing`, `relabel` (`label`),
`level` (`y`), `offstage` (`off`), `note` (only a note was written on an unchanged waypoint). An actor's change also carries
`level: { before, after }`: `"deck"`, `"gallery"` or `"stair 1.23 m"` — write `"y": "gallery"` (or leave `y` out for the deck)
in the generator.

**`clear-track`** (`kind: "track"`, `track`, `removed`: how many of the source's waypoints in that track are gone, `who`: the
actor and prop ids that had them): every original waypoint in the track was removed (Clear this song, or every one deleted by
hand). Its individual deletes are NOT listed; the track's `add`s that follow are the new blocking, including the
`clear-track: held offstage` waypoints. To apply: drop every waypoint the track's generator writes for that track (all actors;
the props in `tools/blocking/props.py`), then add the listed `add`s. On a prop: `prop-add`,
`prop-remove`, `prop-edit` (kind, label, size, colour — `before` / `after` are those), and on its waypoints
`prop-add-waypoint`, `prop-delete-waypoint`, `prop-move`, `prop-retime`, `prop-carry` (`carriedBy`), `prop-facing`,
`prop-level`, `prop-offstage`, `prop-note`.

Waypoints are matched by identity, not by value: a moved waypoint is one `move`, not a delete and an add, and a waypoint
retimed past its neighbours is still one `retime`.

**Applying it (for the next session):** check `source.sha256` against the committed `assets/hamilton-blocking.json` (if it
differs, the edits were made on another revision: match each `before` by track, at, x and z). For each change, edit the
generator named in `generator` so that it writes `after` instead of `before` (or adds / drops it), re-run that generator and
the merge (the commands above), and confirm with `python -I tools/blocking-merge.py tools/blocking/segments --check` and, in
the page, `MIDTOWN.actors.check()`. The notes are Jack's words: read them before the list.

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

## How the committed file is produced (RULING FO)

`assets/hamilton-blocking.json` is GENERATED. Do not hand-edit it: fix the segment's generator and re-run.

```sh
cd tools/blocking
python -I seg1/export.py      # 1-01 … 1-06   (seg1/lib.py + one module per track, t101.py … t106.py)
python -I gen_seg2.py         # 1-07 … 1-11
python -I seg3gen.py --space  # 1-12 … 1-17   (--space also prints its spacing check)
python -I gen4.py             # 1-18 … 1-23
python -I seg5gen.py          # 2-01 … 2-05   (seg5lib.py)
python -I gen6.py             # 2-06 … 2-10
python -I seg7_gen.py         # 2-11 … 2-16
python -I gen_seg8.py         # 2-17 … 2-23
python -I props.py            # the props (RULING FR) -> segments/props.json
cd ../..
python -I tools/blocking-merge.py tools/blocking/segments    # -> assets/hamilton-blocking.json
```

- Each generator writes `tools/blocking/segments/segN.json`. That folder is git-ignored, because it is an intermediate.
- Each generator reads its own notes file (`segN-notes.txt`, `seg1/notes.txt`) into the segment's `notes`.
- The research, the review and the spotlight pass behind every segment are in `tools/blocking/research/segN.md`.
- `tools/blocking/floor-map.txt` is the brief's ASCII floor map; segment 5 reads it.
- They are standard library only. Re-run from the repository, they reproduce the committed file byte for byte.
- The cue problems the blocking passes found are listed for Jack in `docs/hamilton-blocking-cue-notes.md`.

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

Add `--pools <DIR>` to any of these to draw the light lit at each moment under the actors. A "person light" in its
printed check is any `special`, or any unit at zoom 18.5° or less. The dump's own `special` cut-off (zoom ≤ 14°, or a
floor pool ≤ 1 m) misses face keys and duet pools of 14.5–18.5°. `<DIR>/<track>.json` is a
per-cue dump of every lit unit's landing point and radius. It is derived from the page and kept in the session scratch,
not in the repository; that folder's README says how it was made and how to read it. Specials are outlined white. In
moment mode the tool also prints, for each actor, the specials she stands in, or "NO SPECIAL".

The tool draws top-down PNGs from the measured floor map, using the page's pose rules re-implemented in Python. Standard
library only. Its header lists what it approximates: the height comes from the waypoints, not a ray.
