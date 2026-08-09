# The carpenters, phase 2 — implementation plan (PRs 1–4)

> **For agentic workers:** use `superpowers:subagent-driven-development` or
> `superpowers:executing-plans` to work this plan task by task. Steps are
> checkboxes.

**Goal:** a built assembly you can turn over; two flats with openings in
them; the skin as a switch; and one CALL that takes a list.

**Architecture:** no new machinery. PR 1 gives the `asm` hold the carry a
plank already has. PR 2 lets a cut schedule name the axis it seats on,
which the saws already support. PR 3 is two data rows plus a skin flag
through the pure planner. PR 4 makes the plan a list and stacks it on the
one mark.

**Spec:** `docs/superpowers/specs/2026-08-08-carpenters-phase2-design.md`
(RULINGS AD–AH). **PR 3 amends RULING AE** — see the note under that PR.

**Ground rules, unchanged:** failing test first; every new assertion
negative-checked against the pre-change build; suites green before and
after; one concern per PR; straight to `main`, **never stack** — each
branch cut AFTER its parent merges (rebase → rebuild → retest → open).
`sh build.sh` then `cd tests && npm test`. PRs via the GitHub API (no
`gh`), commit messages via `-F`, never `git add -A`.

**Node is not on a fresh shell's PATH:**
`export PATH="/c/Program Files/nodejs:$PATH"`.

---

## PR 1 — `carp2-turn` — a built assembly turns in the hand (RULING AD)

**Files:** `src/p9.txt`, `tests/vr.js`. Carries this plan.

The `asm` hold (`src/p9.txt:2517-2532`) writes `position` only. Give it
the pattern the body hold already uses at `src/p9.txt:2368-2384` (grab)
and `src/p9.txt:2562-2598` (update). An assembly root is an unscaled
`Group`, so its grab vector needs no `.multiply(scale)` — that term in
the wood branch exists only because a wood mesh is a scaled unit box.

- [ ] **Step 1 — the failing tests** in `tests/vr.js`. Three:
      (a) grab a free assembly, turn the controller 90° about Z, assert
      `a.root.quaternion` moved and the grabbed point stayed within 2cm
      of the controller; (b) with the wrist at an odd angle and `VR.btnX`
      false, assert the root's world Euler lands on π/4 multiples on all
      three axes; (c) with `VR.btnX` true, assert it matches the wrist
      exactly. Build the assembly through `regWood` + `addNail` the way
      `carp.js` does — never by poking meshes.
- [ ] **Step 2 — run them, confirm they fail.**
      `node vr.js` → (a) fails "the root never turned".
- [ ] **Step 3 — the grab.** In the `bod.asm` / `!bod.asm.anchor` branch
      (`src/p9.txt:2352-2359`), after the existing `VR.held = {...}`:

```js
        /* the assembly turns in the hand exactly as a plank does
           (RULING AD): pose kept relative to the CONTROLLER, and the
           point you grabbed stays in the palm.  The root is an unscaled
           Group, so the grab vector is metric as it stands — the wood
           branch's .multiply(scale) is only for a scaled unit box. */
        c.getWorldQuaternion(_tq1);
        a.root.getWorldQuaternion(_tq2);
        VR.held.relQ = _tq1.invert().multiply(_tq2).clone();
        VR.held.grabV = a.root.worldToLocal(_rayO.clone()).clone();
```

- [ ] **Step 4 — the update.** Replace the position-only opening of the
      `asm` branch (`src/p9.txt:2518-2521`) with:

```js
    const a = VR.held.asm;
    /* orientation first, then the palm keeps the grabbed point — the
       45° grid applies unless X is down (RULING M, via AD) */
    if(VR.held.relQ){
      c.getWorldQuaternion(_tq1).multiply(VR.held.relQ);
      if(!VR.btnX){
        _wristE.setFromQuaternion(_tq1, 'YXZ');
        _wristE.x = Math.round(_wristE.x/(Math.PI/4))*(Math.PI/4);
        _wristE.y = Math.round(_wristE.y/(Math.PI/4))*(Math.PI/4);
        _wristE.z = Math.round(_wristE.z/(Math.PI/4))*(Math.PI/4);
        _tq1.setFromEuler(_wristE);
      }
      a.root.quaternion.copy(_tq1);
    }
    if(VR.held.grabV)
      _vecA.copy(VR.held.grabV).applyQuaternion(a.root.quaternion).negate().add(_rayO);
    else _vecA.set(_rayO.x + VR.held.offX, _rayO.y + VR.held.offY, _rayO.z + VR.held.offZ);
    if(a.root.parent) a.root.parent.worldToLocal(_vecA);
    a.root.position.copy(_vecA);
    a.root.updateMatrixWorld(true);
```

      Keep the `snapAsm` call and the label below it **exactly as they
      are** — the snap still offers `dy` only, never a re-orientation.
      Keep the `offX/offY/offZ` fallback: a hold record restored from
      anywhere without `grabV` must still carry.
- [ ] **Step 5 — run the tests, confirm they pass**, then the full suite.
- [ ] **Step 6 — negative-check.** Re-run `tests/vr.js` against `main`'s
      build (copy `git show main:the-house.html` aside and point a copy of
      the suite at it) and confirm the three new assertions fail there and
      nothing else does.
- [ ] **Step 7 — rebuild and commit** `src/p9.txt`, `the-house.html`,
      `tests/vr.js`, this plan. Open the PR.

**Watch for:** an anchored assembly must still refuse the grab, and a
one-nail piece must still take the `swing` branch rather than this one —
both are above this code and untouched, but pin them in the tests.

---

## PR 2 — `carp2-rip` — a cut schedule names its axis (RULING AE, mechanism)

**Files:** `src/p6c.txt` (schedule shape + doc), `src/p6b.txt`
(`carpCut`'s seat), `tests/carp.js`.

The saws already rip: a sheet body carries `dims {L, W}`, `seatWood`
picks the axis from the pose it is offered (`src/p4c.txt:865-872`) and
`sawCut` writes the surviving dimension either way
(`src/p4c.txt:1040`). Only the carpenters cannot ask: `carpCut` forces
every sheet to seat `'L'` so the schedule's lengths mean what they say
(`src/p6b.txt:536-544`).

- [ ] **Step 1 — the failing test** in `tests/carp.js`: seat a full sheet
      via a one-entry schedule with `axis:'W'` and a 9in cut, run the
      lead, and assert the kept product has `dims.W === 0.2286` and
      `dims.L === 2.4384` — the piece is ripped, not crosscut.
- [ ] **Step 2 — run it, confirm it fails** (today it crosscuts: L 0.2286).
- [ ] **Step 3 — the schedule shape.** In `src/p6c.txt`, document that a
      cut entry may carry `axis:'L'|'W'` (default `'L'`, lumber ignores
      it), and that **two entries may name the same `stock` index**: the
      second continues on the piece the first left on the bench, re-seated
      if the axis differs.
- [ ] **Step 4 — the seat.** In `src/p6b.txt:536-544`, replace the
      unconditional "turn it to the table" with the schedule's axis:

```js
            /* a sheet seats on the axis the SCHEDULE asks for — 'L'
               (length along table X, a crosscut) or 'W' (a rip).  The
               saws have always done both; seatWood reads whichever axis
               the hand offers, so the lead offers the right one. */
            if(b.prof === 'sheet'){
              st.group.getWorldQuaternion(_crewQ);
              h.hands.getWorldQuaternion(_crewQ2).invert();
              b.mesh.quaternion.copy(_crewQ2.multiply(_crewQ));
              if(job.axis === 'W') b.mesh.rotateY(Math.PI/2);
              b.mesh.updateMatrixWorld(true);
            }
```

      and carry `axis` from the schedule entry onto the `carpFetch` /
      `carpCut` job records in `carpPlan` so `job.axis` exists here.
- [ ] **Step 5 — run the test, confirm it passes**, then the full suite.
- [ ] **Step 6 — negative-check** the new assertion against `main`'s build.
- [ ] **Step 7 — rebuild, commit, open the PR** (rebased onto the `main`
      that now has PR 1).

**Watch for:** `seatWood` returns false if the profile is wrong for the
station; a refused seat sets the piece down loose and must not strand the
run. That path exists (`carpSetDown`) — leave it.

---

## PR 3 — `carp2-openings` — the DOOR and WINDOW flats, and SKIN (AE + AF)

**Files:** `src/p6c.txt` (two rows, `skinnable`/`skinFrom`, `carpPlan`'s
skin option), `src/p9.txt` (the SKIN switch on the glass),
`docs/superpowers/specs/2026-08-08-carpenters-phase2-design.md` (the
amendment below), `tests/carp.js`.

### Spec amendment — RULING AE's framing

The spec says the jambs meet a 41" header. **That cannot be cut:** a jamb
running from the bottom rail's inner face to a header at 80" measures
76.5", and the saw snaps to the inch. Corrected framing, which is also
the more usual way to build it: **the jambs run the full 89" between the
rails, and a 30" header sits between the jambs** at the door head. Same
opening, same skin, every cut on the inch. Amend the RULING AE paragraph
in the spec in this PR and say why.

### The frame conventions, read off `flat4x8` (`src/p6c.txt:37-67`)

Mark-local: **X is the flat's length (8ft), Z its width (4ft), Y is up**,
built lying flat. 2x4s lie flat (0.038 thick) centred at `y = 0.019`; the
skin sits on top at `y = 0.0475` (thickness 0.019). A 2x4 running along
X is `rot:[0, 0, -Math.PI/2]`; along Z, `rot:[0, Math.PI/2, -Math.PI/2]`.
A sheet is `rot:[-Math.PI/2, 0, 0]`, which puts its L along X, its W
along Z and its thickness up.

Inches to metres used below: 96″ 2.4384 · 89″ 2.2606 · 80″ 2.032 ·
48″ 1.2192 · 41″ 1.0414 · 36″ 0.9144 · 30″ 0.762 · 24″ 0.6096 ·
16″ 0.4064 · 9″ 0.2286 · 1.75″ 0.04445 · 46.25″ 1.1747 · 22.25″ 0.5651 ·
16.75″ 0.42545 · 33.75″ 0.85725 · 13.75″ 0.34925 · 25.75″ 0.65405 ·
19.5″ 0.4953 · 8″ 0.2032 · 40″ 1.016 · 6″ 0.1524 · 30″(x) 0.762.

### Piece order matters

**Frame pieces first, skin pieces last, in every skinnable row**, with
`skinFrom` naming the first skin index. SKIN OFF is then a truncation:
`pieces.slice(0, skinFrom)` and the nails whose `i` and `j` are both
below `skinFrom` — no index renumbering, ever. This means
**`flat4x8` must be reordered**: its sheet is piece 0 today. Move it to
the end and renumber every nail's `i`/`j` accordingly. Its existing
tests ("16 nails on the blueprint joints, every point inside both boxes")
must stay green — they check geometry, not indices, so a correct
renumber is invisible to them.

- [ ] **Step 1 — the failing tests** in `tests/carp.js`:
      (a) `carpPlan('doorFlat', mark)` yields 10 pieces, and every cut in
      its schedule lands on an exact inch (`len/0.0254` within 1e-6 of an
      integer); (b) the same with `{skin:false}` yields 7 pieces, no
      sheet in the NEED list, and no nail referencing a dropped piece;
      (c) the same pair for `windowFlat` (12 and 8);
      (d) end to end through the glass: pick DOOR FLAT, CALL, and assert
      one un-anchored rigid assembly of 10 stands at the mark with a
      clear opening — cast a ray through the middle of the opening
      (mark-local x 0, z 0, from below) and assert it hits nothing.
- [ ] **Step 2 — run them, confirm they fail** ("no such row").
- [ ] **Step 3 — reorder `flat4x8`** so the sheet is the last piece; add
      `skinnable:true, skinFrom:4`. Run the suite: still green.
- [ ] **Step 4 — the DOOR FLAT row.** `stock: [{prof:'sheet',n:1},
      {prof:'s2x4',n:6}]`, `skinnable:true, skinFrom:7`.

      `cuts:` (indices matter — the pieces reference them)
      `0 {stock:3, saw:'chop', make:[1.0414, 1.0414]}` (two rails, 14″ off)
      `1 {stock:4, saw:'chop', make:[2.2606]}` (jamb, 7″ off)
      `2 {stock:5, saw:'chop', make:[2.2606]}` (jamb, 7″ off)
      `3 {stock:6, saw:'chop', make:[0.762]}` (header, 66″ off)
      `4 {stock:0, saw:'track', axis:'L', make:[0.4064]}` (the 16×48 panel)
      `5 {stock:0, saw:'track', axis:'W', make:[0.2286, 0.2286]}` (two
      9×80 strips off the 80×48 remainder, leaving a 30×80 panel as stock)

      `blueprint.pieces:`
      | # | what | src | prof | len | w | pos | rot |
      |---|---|---|---|---|---|---|---|
      | 0 | stile | `{stock:1}` | s2x4 | 2.4384 | — | `[0, 0.019, -0.5651]` | `[0,0,-π/2]` |
      | 1 | stile | `{stock:2}` | s2x4 | 2.4384 | — | `[0, 0.019, 0.5651]` | `[0,0,-π/2]` |
      | 2 | bottom rail | `{cut:[0,0]}` | s2x4 | 1.0414 | — | `[-1.1747, 0.019, 0]` | `[0,π/2,-π/2]` |
      | 3 | top rail | `{cut:[0,1]}` | s2x4 | 1.0414 | — | `[1.1747, 0.019, 0]` | `[0,π/2,-π/2]` |
      | 4 | jamb | `{cut:[1,0]}` | s2x4 | 2.2606 | — | `[0, 0.019, -0.42545]` | `[0,0,-π/2]` |
      | 5 | jamb | `{cut:[2,0]}` | s2x4 | 2.2606 | — | `[0, 0.019, 0.42545]` | `[0,0,-π/2]` |
      | 6 | header | `{cut:[3,0]}` | s2x4 | 0.762 | — | `[0.85725, 0.019, 0]` | `[0,π/2,-π/2]` |
      | 7 | skin over the door | `{cut:[4,0]}` | sheet | 0.4064 | 1.2192 | `[1.016, 0.0475, 0]` | `[-π/2,0,0]` |
      | 8 | skin, stage right | `{cut:[5,0]}` | sheet | 2.032 | 0.2286 | `[-0.2032, 0.0475, -0.4953]` | `[-π/2,0,0]` |
      | 9 | skin, stage left | `{cut:[5,1]}` | sheet | 2.032 | 0.2286 | `[-0.2032, 0.0475, 0.4953]` | `[-π/2,0,0]` |

      The opening is then `z ∈ [-0.381, 0.381]`, `x ∈ [-1.2192, 0.8128]`
      — 30″ × 80″, open to the bottom rail, which is the sill you step
      over.

      `blueprint.nails:` **two per joint** (RULING G), each buried in both
      pieces, placed at ±⅓ along the shared edge. The joints, **16 of
      them, 32 nails**: 0–2, 0–3, 1–2, 1–3 (frame corners); 4–2, 4–3,
      5–2, 5–3 (jambs to rails); 6–4, 6–5 (header to jambs); and the
      skin 7–3, 7–6, 8–0, 8–2, 9–1, 9–2.
      Skin nails drive down (`ax:[0,-1,0]`) at `y 0.038`; frame-to-frame
      nails drive along the joint normal at `y 0.019`, the way
      `flat4x8`'s do.
- [ ] **Step 5 — the WINDOW FLAT row.** Same stock (sheet ×1, s2x4 ×6),
      `skinnable:true, skinFrom:8`.

      `cuts:`
      `0 {stock:3, saw:'chop', make:[1.0414, 1.0414]}`
      `1 {stock:4, saw:'chop', make:[2.2606]}`
      `2 {stock:5, saw:'chop', make:[2.2606]}`
      `3 {stock:6, saw:'chop', make:[0.762, 0.762]}` (sill + header, 36″ off)
      `4 {stock:0, saw:'track', axis:'L', make:[0.9144, 0.6096]}`
      `5 {stock:0, saw:'track', axis:'W', make:[0.2286, 0.2286]}`

      Pieces 0–5 are the door flat's 0–5 verbatim (two stiles, two rails,
      two jambs). Then:
      | # | what | src | prof | len | w | pos | rot |
      |---|---|---|---|---|---|---|---|
      | 6 | sill | `{cut:[3,0]}` | s2x4 | 0.762 | — | `[-0.34925, 0.019, 0]` | `[0,π/2,-π/2]` |
      | 7 | header | `{cut:[3,1]}` | s2x4 | 0.762 | — | `[0.65405, 0.019, 0]` | `[0,π/2,-π/2]` |
      | 8 | skin below the sill | `{cut:[4,0]}` | sheet | 0.9144 | 1.2192 | `[-0.762, 0.0475, 0]` | `[-π/2,0,0]` |
      | 9 | skin above the head | `{cut:[4,1]}` | sheet | 0.6096 | 1.2192 | `[0.9144, 0.0475, 0]` | `[-π/2,0,0]` |
      | 10 | skin, stage right | `{cut:[5,0]}` | sheet | 0.9144 | 0.2286 | `[0.1524, 0.0475, -0.4953]` | `[-π/2,0,0]` |
      | 11 | skin, stage left | `{cut:[5,1]}` | sheet | 0.9144 | 0.2286 | `[0.1524, 0.0475, 0.4953]` | `[-π/2,0,0]` |

      Opening: `z ∈ [-0.381, 0.381]`, `x ∈ [-0.3048, 0.6096]` — 30″ × 36″
      with its sill 36″ up. Joints: the four frame corners, four
      jamb-to-rail, sill 6–4/6–5, header 7–4/7–5, then two per skin panel
      (8–2, 8–6; 9–3, 9–7; 10–0, 10–4; 11–1, 11–5) = 20 joints, 40 nails.
- [ ] **Step 6 — the blueprint's sheet width.** A blueprint sheet piece
      now carries `w`. Where `carpPlan` matches a cut product to a piece,
      match on `prof` **and** `len` **and** `w` (default
      `WOOD_PROF.sheet.W` when absent) so a ripped strip cannot be hauled
      to a full-width panel's slot.
- [ ] **Step 7 — the skin option.** `carpPlan(key, mark, opts)` — with
      `opts.skin === false` on a `skinnable` row: pieces
      `slice(0, skinFrom)`, nails filtered to both ends below `skinFrom`,
      stock entries whose profile is only used by dropped pieces removed
      from the NEED list, and cut entries with no surviving consumer
      dropped. Rows without `skinnable` ignore `opts.skin` entirely.
      `carpPlan` stays **pure**.
- [ ] **Step 8 — the glass.** In `vrDrawCarp` (`src/p9.txt:1065`), add a
      SKIN ON/OFF region carrying META `carpSkin:true`, stored on
      `sc.skin` (default true) and passed into every `carpPlan` call and
      into `carpStart`. Rows: five now — drop the row pitch from 86 to 64
      and move the mark line, CALL and status down accordingly. **Do not
      touch the ORDER screen canvas.**
- [ ] **Step 9 — run everything**, negative-check every new assertion,
      rebuild, commit, open the PR.

**Watch for:** the 30×80 and 30×36 leftovers are **stock, not scrap** —
`SAW_MIN` must not eat them; assert one of them survives into
`carpSurvey` after a build.

---

## PR 4 — `carp2-list` — one CALL takes a list (RULINGS AG + AH)

**Files:** `src/p6c.txt` (`carpStackH`, `carpPlanList`, `carpStart`),
`src/p9.txt` (counts on the glass), `tests/carp.js`.

- [ ] **Step 1 — the failing tests** in `tests/carp.js`:
      (a) `carpPlanList([{key:'flat4x8',n:2}], mark)` needs exactly twice
      one flat's stock and its jobs are the two plans end to end;
      (b) the second item's pieces sit exactly one flat-height higher in
      mark-local Y than the first;
      (c) a list that would mint one piece past `BUILD_CAP` is refused
      whole with `full`, and the shed still holds every stick it started
      with (nothing was cut);
      (d) end to end through the glass: a list of one DOOR FLAT and one
      WINDOW FLAT, one CALL, two un-anchored rigid assemblies stacked at
      the mark, and the save round trip through a second world brings
      both back.
- [ ] **Step 2 — run them, confirm they fail.**
- [ ] **Step 3 — `carpStackH(row, skin)`**, pure: the height of a built
      item = `max(pos[1] + halfThickness)` over its surviving pieces,
      where half-thickness is 0.0095 for a sheet and half the profile's
      thin dimension for lumber. For a skinned flat that is 0.057.
- [ ] **Step 4 — `carpPlanList(items, mark, opts)`**, pure: walk the list
      in order, calling the existing per-item planner with the mark's Y
      raised by the running stack height; concatenate `jobs`; **sum**
      `need` across every item and report it once; count the pieces the
      **whole** list would mint against `BUILD_CAP` and return `full`
      before emitting any job (RULING AH). Return `null` for an empty
      list or a bad key, as `carpPlan` does.
- [ ] **Step 5 — `carpStart`** takes a list and calls `carpRun` with the
      concatenated queue. `CREW.running === 'carp'` for the whole list;
      one `crewWorkLight` on, one off at the end.
- [ ] **Step 6 — the glass.** Each row gains `−  n  +` regions with META
      `carpMinus`/`carpPlus` and the row's key; `sc.counts[key]` starts
      at 0. CALL plans the whole list. Refusals keep their spec order and
      wording, with NEED summed across the list.
- [ ] **Step 7 — run everything**, negative-check, rebuild, commit, open
      the PR.

**Watch for:** a stacked item is still its own un-anchored assembly
(RULING AC) — assert the second one is NOT nailed to the first, or the
pair comes up as one lump when you lift it.

---

## As built — where the work departed from this plan

Recorded because the next round will read this file, not the diff.

1. **No `skinFrom`, and `flat4x8` was never reordered.** The plan had
   skin pieces moved to the tail so SKIN OFF could truncate. Better:
   each skin piece carries `skin:true` and the planner **keeps the
   original indices**, leaving a hole in the numbering. `CARP_RUN.made`
   and `.placed` are plain objects keyed by index, so sparse is free —
   and `flat4x8`'s blueprint, its tests and its save-round-trip poses
   never had to move. One pure helper, `carpParts(row, skin)`, decides
   which pieces, nails, cuts and stock units survive, and both the
   planner and the glass read it.
2. **A real bug the door flat's own test flushed out.** After the last
   cut of a schedule entry, `carpCut` cleared the bench unless the
   *next* job was another cut — so the re-seat that turns a sheet round
   to rip it found nothing to lift, and both skin strips went missing
   (8 pieces / 24 nails instead of 10 / 32). The bench now also stays
   for a re-seat. Nothing in PR 2's own tests could have caught this:
   it only appears when a crosscut and a rip share one sheet.
3. **RULING AE's framing was amended** (see the spec): full-height 89"
   jambs with a 30" header between them, because a jamb meeting a 41"
   header measures 76.5" and the saw snaps to the inch.
4. **The list's stock check is done once, not per item.** Planning item
   by item counts the same shortfall twice when several items are
   short. `carpPlanList` sums the rows and asks the survey once.
5. **The cap test proves the accounting, not the boundary.** Filling a
   venue to 150 pieces inside the suite is expensive and the
   single-item boundary is already pinned; the list test asserts that
   two flats count two flats' worth against `BUILD_CAP`.

## Self-review

- **Spec coverage.** AD → PR 1. AE (framing + the axis) → PR 2 and PR 3
  (with the amendment). AF → PR 3 steps 7–8. AG → PR 4 steps 3–6.
  AH → PR 4 step 4. The screen relayout → PR 3 step 8 and PR 4 step 6.
- **Numbers.** Both skins come out of one sheet each, checked cut by cut:
  door 16 + 9 + 9 leaves 30×80; window 36 + 24 then 9 + 9 leaves 30×36.
  Both frames are six 2x4s. Every cut is a whole number of inches.
- **Names used consistently:** `skinnable`, `skinFrom`, `carpStackH`,
  `carpPlanList`, `opts.skin`, `job.axis`, `sc.skin`, `sc.counts`.
