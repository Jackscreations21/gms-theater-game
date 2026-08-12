# His sets into the house — design

**Date:** 2026-08-12
**Rulings:** BX, BY, BZ, CA (continuing the sequence; BW was the last)
**Supersedes nothing.** Extends RULING BP (the model importer, fit and seat)
and RULING BV (the netherworld backdrop) from
`2026-08-11-the-balcony-the-beams-and-the-cue-clock-design.md`.

The owner's instruction, in one line: *"can you just use the pcitrue i gave you
as a backdrop for the netherworld. and start with adding the sets in"* — and,
immediately after, *"dont wait for me to merge pr's to keep going just keep
going"*.

So: his seven `.glb` files land, and the netherworld gets his picture. The
second half of that is RULING BV and already specified. This document exists
because **the first half turned out not to be a file copy.**

---

## 1. What the delivery actually is

`tools/models.js` is new and kept. It has two halves because neither alone
answers the question: a **container scan** straight off the glb bytes (exact —
jsdom cannot decode a PNG, so anything measured through the loader would be
guessing about textures), and a **real import run** that boots the build,
serves his files to the actual `loadSetModels` fetch, and measures what lands
in world space against the frame it has to be seen through.

Seven files, ~181 MB, out of Meshy:

| his file | goes to | MB | triangles | materials |
|---|---|---|---|---|
| `attic/…attic_0812020523` | `assets/bj-attic.glb` | 25.8 | 99,446 | 1 |
| `roof/…roof_0812020713` | `assets/bj-roof.glb` | 26.3 | 99,568 | 1 |
| `house/…0812020736` | `assets/bj-house-maitland.glb` | 27.5 | 93,510 | 1 |
| `house/…0812020721` | `assets/bj-house-deetz.glb` | 27.2 | 93,528 | 1 |
| `house/…0812020729` | `assets/bj-house-beetlejuice.glb` | 27.9 | 93,502 | 1 |
| `house extirior/…0812020837` | `assets/bj-house-exterior.glb` | 30.8 | 97,920 | 1 |
| `beetlejuice sign/…0812020344` | `assets/bj-sign.glb` | 15.7 | 98,984 | 1 |

**Every one passes every budget** — 93k–99.5k against 150,000, one material
against 8, no stray lights, one primitive each. RULING BP's raise to 150,000
was sized off exactly these numbers and it holds.

Three textures each, not one: two 2048 PNGs and one 4096 PNG. The 4096 is the
**normal map**, not the base colour, which the palette decode below settles.

### The three houses are one house, painted three times

Same bounding box to three decimals (1.911 × 1.793 × 1.824), triangle counts
within 26 of each other, and all three came out of the tool named
`deetz_house`. **The paint is the only thing that tells them apart**, so the
naming was verified by decoding the base-colour PNG out of each file and
characterising it, rather than trusting the filename or a previous session's
note:

| file | warmth (mean R−B) | dominant hues | reading |
|---|---|---|---|
| `…736` | **+15.3** | red/orange 94% | warm brown, cream, sage → **Maitland** |
| `…721` | −4.4 | red 48%, violet 22%, blue 13% | cool grey, slate, teal → **Deetz** |
| `…729` | **−10.9** | blue 49%, violet 36% | saturated purple → **Beetlejuice** |

The ordering on warmth is unambiguous and matches what STATE.md recorded. If
this is ever wrong it is a rename, not a rebuild.

---

## 2. RULING BX — a set is fitted to the room it plays in, not just to its width

**This is the finding that stopped the file copy being a file copy.**

`bjFitAndSeat` (RULING BP) scales a model so its **width** matches the `fit`
column, puts its lowest point on the deck, and centres its footprint on the
origin. That was written against the one fact known at the time — the files
arrive normalised to a ~1.9-unit box — and it is right about the width. It is
silent about the other two dimensions, and **his models are proportionally much
taller and deeper than the targets in `docs/MODELING.md`.**

Measured through the real importer, at `?v=21`:

```
set / dressing          fitted box (w x h x d)      y base    z span        verdict
attic                   13.40 x  6.47 x 10.26         0.00   -5.1..5.1    deeper than the stage by 0.26m; DOWNSTAGE of the arch by 5.13m
roof                    13.40 x  8.66 x 10.90         0.00   -5.4..5.4    deeper than the stage by 0.90m; DOWNSTAGE of the arch by 5.45m
houseMaitland           12.80 x 12.01 x 12.22         0.00  -16.1..-3.9   OVER the opening by 2.81m; deeper than the stage by 2.22m
houseDeetz              12.80 x 12.01 x 12.22         0.00  -16.1..-3.9   OVER the opening by 2.81m; deeper than the stage by 2.22m
houseBeetlejuice        12.80 x 12.01 x 12.22         0.00  -16.1..-3.9   OVER the opening by 2.81m; deeper than the stage by 2.22m
```

Three distinct faults, one root cause:

1. **The houses stand 12.01 m tall in a 9.20 m opening** — 2.81 m, very nearly
   a third of the house, cropped off above the picture. MODELING.md already
   warns in its own words that the height cap is real and anything taller gets
   cropped by the portal; nothing enforced it.
2. **Every set is deeper than the stage** — by 0.26 m (attic), 0.90 m (roof)
   and 2.22 m (the houses) against the ~10 m MODELING.md declares available.
3. **The footprint is centred on z = 0, and the proscenium is also at z = 0**,
   so the two flying sets land with **5.13 m and 5.45 m of set downstage of the
   arch** — hanging out over the audience. The stand-ins they replace were
   built where scenery belongs: `bj:roofDeck` at z −6.4, `bj:landing` at −6.6.
   The houses escape this one only because the wagon parks them at
   `BJ_WAGON_BACK` −10; at wagon-home they would reach z +6.1.

**RULING BX:** the fit is the smallest of the three ratios the room allows, and
the seat is three-dimensional.

- scale = `min(fit / w, (opH − air) / h, stageDepth / d)` — uniform, so nothing
  is ever distorted;
- the lowest point goes on the deck (`y = 0`), unchanged;
- the footprint centres on `x = 0`, unchanged;
- **the downstage face goes just upstage of the arch**, not the centre on it.

Two constants, both one-line tunes: `BJ_FIT_AIR` 0.30 (the air above the set
and the clearance downstage of the arch) and `BJ_SET_DEPTH` 10.0 (MODELING.md's
"stage depth available to a set"). `opH` is 9.2 and is not ours to tune — it is
the picture opening.

What that gives, predicted, for all seven:

| set | limited by | fitted w × h × d |
|---|---|---|
| attic | depth | 13.06 × 6.30 × 10.00 |
| roof | depth | 12.29 × 7.95 × 10.00 |
| the three houses | **height** | 9.49 × 8.90 × 9.06 |
| exterior | height | 8.63 × 8.90 × 8.77 |
| sign | width | 13.40 × 6.35 × 0.17 |

The houses come out **9.49 m wide (31 ft) instead of the 42 ft the doc asks
for**, and that is the trade being made deliberately: a set you can see all of,
narrower than intended, beats one with a third of it above the picture and two
metres of it through the back wall. It is a consequence of his proportions, not
of the rule — a set drawn to the doc's own ratios is limited by its width and
lands at exactly the width it asks for, which is what keeps this change
invisible to every set that obeys the brief.

**`scale` still wins.** An explicit number on a manifest entry is an
instruction and beats all three measurements, which is what you want the moment
a set is deliberately not full size.

---

## 3. RULING BY — a single-mesh delivery can still be stood on

Every one of the seven files is **one mesh named `Mesh1.0`**. MODELING.md asks
for standable floors to be named `walk_` + anything; **not one file names
anything**, and none can — the tool emits a single primitive, so there is no
sub-node left to name. This is the same class of thing as the 4096 texture and
the 1.9-unit box: a shape the tool chose, not something he decided.

What that costs today, measured:

```
roof              WALKABLE LOST: bj:roofDeck
houseMaitland     WALKABLE LOST: bj:landing
houseDeetz        WALKABLE LOST: bj:landing
houseBeetlejuice  WALKABLE LOST: bj:landing
```

`bj:roofDeck` carries the comment *"the roof slope you stand on — the whole
point of the set"*. The importer is correct to drop it — `bjPruneWalk` exists
so you cannot stand on a floor that is no longer there — but the result is that
**the moment his files land, the roof stops being standable and the house loses
its landing**, silently, and no suite would notice because no suite loads a
model.

**RULING BY:** a manifest entry may declare `walkAll`, which makes the landed
mesh itself standable when the file names no `walk_` node. Default off. On for
the roof and the three houses, which are the sets with somewhere to stand.

It is opt-in per entry rather than automatic because standing on a mesh means
raycasting it, and these are ~99k triangles apiece. **The cost is measured in
the PR, not assumed** — that is the RULING BQ discipline applied early, and if
the number is bad the flag comes off the houses and stays on the roof.

### The measurement refused it — BY is DEFERRED

`tools/walkcost.js` is the probe and the number is not close:

```
the stand-in deck (12 tris), over it          0.0018 ms/call
HIS ROOF (99,568 tris), over it               4.2867 ms/call     2400x
HIS ROOF, ray 40m away (bounding-box reject)  0.0001 ms/call
```

**4.29 ms is 38.6% of a 90 Hz frame**, and `groundAt` runs once for the player
*plus once per settling body* — so a standing build with loose pieces would
spend several frames' worth of time per frame deciding where the floor is.
There is no early exit either: three.js collects every intersection and sorts,
so a ray that **misses** costs the same as one that lands, and the figure above
is a miss. The bounding box rejects cheaply, which only helps when you are
nowhere near the set.

**So the flag was written, measured, and taken back out.** The estimate that
went into this spec before measuring was 0.031 ms — wrong by a factor of 100,
and it would have shipped a frame-rate cliff onto the one platform the whole
budget system exists to protect. This is the same lesson as the BP round's
probe, from the other side: *the number you would have guessed is not the
number.*

Neither cheap fallback is correct either, which is why nothing ships instead of
it. Keeping the stand-in's `walk_*` meshes as invisible collision costs
0.0018 ms, but `bj:roofDeck` sits at y 2.06–2.2 in **our** co-ordinates, and his
roof is a different shape at a different height — so you would stand inside the
slate, or on air. A floor plane at the model's own `min.y` is right for the
interior and useless for the roof, whose whole point is the pitch.

**What would actually fix it**, for whoever picks this up: a coarse collision
proxy generated at import (sample a heightfield off the mesh once at load — 12×12
rays is ~0.6 s of one-off cost, which is a visible hitch and needs thought), or
a `walk_` node in the file, or a raycaster with a BVH, which r128 does not have.
Until then **the roof and the house landing are not standable while his models
are loaded**, and that is now a known, measured, recorded state rather than a
silent one.

---

## 4. RULING BZ — the exterior gets a slot, and an assertion gets reversed

`bj-house-exterior.glb` has no manifest entry, because MODELING.md said the
exterior was not his to model: RULING AW read the production photograph as a
painted **cloth**, so the `house` scene is one drop. He modelled it anyway and
delivered it, which is his call to make.

`tests/beetlejuice.js` actively forbids the entry that is now wanted:

```js
if(typeof v !== 'string' && v.scene === 'house')
  throw new Error('an entry targets the exterior house scene: ' + k);
```

**RULING BZ:** the exterior is a model. The assertion is **reversed in place** —
rewritten to say what it used to guard and why that changed — rather than
deleted, which is the AO / AV / BA precedent for the **fourth** time. The
sibling assertion at *"the exterior is a painted DROP, one cloth and nothing
walkable (RULING AW)"* is rewritten the same way: what it must now pin is that
the **stand-in** is a drop and that a delivered model replaces it, because a
silent fallback means the drop is still what plays until the file arrives.

The exterior keeps its whole-group Y mover and every `move:{scene:'house'}` in
the plot untouched — RULING AT's wagon convention and the 1:14:30 fly-out are
not in scope here.

---

## 5. RULING CA — the sign is his geometry and our lamps

`bj-sign.glb` is the one delivery that is not a set, and his note is the whole
brief: **"you just have to add the lights"**. Its box is 1.898 × 0.899 ×
**0.024** — a flat sign face, as expected.

`SHOW.signLamps` / `setSignLamps` drive our lamps today, attached to nodes we
built and named. His file gives us one mesh called `Mesh1.0`, so **the lamps
cannot be attached by node name.**

**RULING CA:** the lamps are attached **geometrically** — placed against the
landed mesh's own measured bounding box, in its own local space, so a re-export
at any scale puts them in the same place relative to the sign. The sign is a
flown piece (`sc.always`, RULING AS) and stays one: it is not z-seated to the
arch like a set, because it hangs downstage of the house curtain on purpose.

Its own PR, last of the model chain, because it is the only one that touches
the lighting rig.

---

## 6. The netherworld backdrop (RULING BV, already ruled)

His instruction, repeated this session: *"just use this as a backdrop for the
netherworld"*. That makes the picture **the look, not a new set** — which is
how BV already reads it, so nothing here changes it.

Today `aft` (`p5h` ~line 1316) is five nested **axis-aligned** rectangles in
green / cyan / magenta. His picture is nested **tilted trapezoids receding
upstage**, all blue with bright edges, over a dark blue backing.

Two constraints are load-bearing and survive unchanged:

- **not `neonTube`** — its CatmullRom overshoots a right angle; a 12.6 m frame
  came out 14.5 m wide and 0.53 m through the deck;
- **a material per tube is required**, because `updateNeon` writes a colour
  into every registered mesh every frame, so a shared material would repaint
  the lot.

**The photograph is never committed.** TRAPS draws the line at looking versus
committing, and this round looks at one.

---

## 7. What is NOT in this round, and why

- **Recompression of his files.** 181 MB of PNG, and the 4096 normal map in
  each is *already discarded at load* — RULING BP shrinks it to 2048 — so
  roughly 70 MB of what a Quest downloads is thrown away on arrival. Re-encoding
  to 2048 JPEG would take the delivery to a few MB per file. It is the same
  class of decision as the texture shrink, but it **rewrites his asset** rather
  than adjusting what we do with it, and that is his call. Flagged with the
  numbers, not taken.
- **RULING BQ**, a struck set parking backstage. Unchanged and still the biggest
  item on the list.
- **The graveyard**, which he did not supply, and **bedroom / closet**, which
  keep their stand-ins by his word: *"just use what you are currently using for
  it"*.
- **The split route's lost seating.** `bjApplyModel`'s multi-part branch (the
  cemetery hills) detaches the root's children and scales their positions,
  discarding the root transform that `bjFitAndSeat` just wrote — so fit-and-seat
  does not reach the graveyard at all. No graveyard file exists, so it is
  recorded here rather than fixed blind.

---

## 8. The plan — one concern per PR, in this order

The owner has said not to wait for merges, so these are built and opened as a
linear chain: each branch off the previous, each PR stating the one before it.
**They must be merged in order.**

| # | Concern | Touches |
|---|---|---|
| 1 | **BX** — fit and seat to the room (height, depth, z-seat) | `p5i`, `tests/beetlejuice.js`, `docs/MODELING.md` |
| 2 | **The five straight swaps** into `assets/` | `assets/`, `.gitattributes` check, `tests/beetlejuice.js` |
| 3 | **BY** — `walkAll`, with the raycast cost measured | `p5i`, `tests/beetlejuice.js`, `docs/MODELING.md` |
| 4 | **BZ** — the exterior slot, two assertions reversed in place | `p5i`, `tests/beetlejuice.js`, `docs/MODELING.md`, `assets/` |
| 5 | **CA** — the sign, with our lamps placed geometrically | `p5h`/`p5i`, `tests/beetlejuice.js`, `assets/` |
| 6 | **BV** — the netherworld backdrop | `p5h`, `tests/beetlejuice.js` |

PR 1 goes first even though he asked for the sets first, because without it the
sets land cropped and poking into the auditorium — the files would arrive
looking broken for a reason that is not his fault, which has already happened
twice in this project (1.9M triangles, then the unit box) and is worth not
doing a third time.
