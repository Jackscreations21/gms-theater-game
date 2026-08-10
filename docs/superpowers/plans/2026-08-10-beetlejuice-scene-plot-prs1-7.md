# BEETLEJUICE re-time — the build, seven PRs

Spec: `docs/superpowers/specs/2026-08-10-beetlejuice-scene-plot-design.md`.
**Read the rulings AP–AU before touching any of this.**

**Linear chain, never stacked.** Each branch is cut after its parent merges,
rebased onto fresh `main`, rebuilt, and 18/18 green before the PR is opened.
Every new assertion negative-checked against a **wrong** implementation, not an
absent one.

Order matters: the mover (PR 2) is a dependency of the sign and the wagon; the
scenery must all exist before the cue list (PR 7) can name it.

---

## PR 1 — the spec and this plan

Docs only, no code. Lands the rulings so they can be argued with before any of
it is built.

---

## PR 2 — the mover (RULING AP)

**Where:** `src/p5c.txt`, beside the scene machinery it extends.

A scene may carry a travel. On the scene record:

```
sc.mv = {axis:'x'|'y', off:0, target:0, speed:2.2, home:0}
```

- `sceneMoveTo(name, target, speed)` — sets the target; returns the record.
- `sceneMoveStep(dt)` — advances every scene's `off` toward its `target` at
  `speed` m/s and writes it to `sc.group.position[axis]`. Called from the same
  place the other per-frame show work happens; **never `setTimeout`.**
- A scene mid-travel stays **on**. `sceneShow` must not disable the layers of a
  scene that is still moving off; the plot always covers a change, so the
  ordering is: travel completes, *then* the cue that follows swaps the scene.
- `sceneWalk` objects ride the group, so walkability travels for free — **pin
  it with a test anyway**, because "the deck drove out from under you" is this
  codebase's favourite shape of bug.
- `p2k` parks and restores `mv.off` with the rest of the per-stage state.
- The cue record grows `move:{scene, off}` (nullable), applied by the same
  branch in `p6` that already applies `c.scene`.

**Tests (`sets.js`):** travel reaches its target in the expected time under a
stepped `dt`; a scene mid-travel still has layers enabled; a walkable rides the
move; a stage swap parks and restores the offset; a retarget mid-travel does
not queue.

**Negative check:** against a mover that snaps instantly (no `dt` term) — the
timing and mid-travel assertions must both fail.

---

## PR 3 — everything that flies (RULINGS AS, AT)

**Cloths on real lines.** Two new made-goods in `p5h`, built the same way
`bjCurtain` already is (`GOODS[key] = {…, made:true, build(){…}}`, `TRIMS[key]`,
`SHOW.goods.push`):

- `bjBackdrop` — the graveyard/general backdrop. Hung on **FLY[7]**.
- the existing stock `sky` good, hung on **FLY[9]**.

Both are trims, so every "lifts / drops" beat in the plot is a value in the fly
snapshot the cue already carries. **No new machinery on this half.**

**The sign on a mover.** A `bjSign` scene (its own scene record so it can carry
`mv`), built downstage at `z = +0.6` — in front of the curtain, which is why it
cannot be a good on a batten (`makeLineset` puts every line at `z = -0.50 -
i*0.80`). Axis `'y'`, home = in, target = out above the header.

**Tests:** both cloths hang and their trims resolve; the sign sits downstage of
`FLY[0].z`; the sign travels out on the mover and is above the proscenium head
when parked.

---

## PR 4 — one house, three dressings (RULING AQ)

The largest PR. `interior` and `redecorated` stop being two scenes and become
two dressings of one structure, and a third is added.

- One `house` wagon scene: the shell, on a mover, axis `'x'`, home offstage.
- `bjDress(which)` swaps the dressing group — `'maitland' | 'deetz' | 'bj'`.
  Maitlands lived-in, Deetz pale and redecorated (the existing `redecorated`
  pieces), Beetlejuice's warped and striped (new, RULING AO — our shapes).
- A dressing swap is instant and always covered; it needs no travel.
- Cue record grows `dress` (nullable), applied alongside `scene`.
- Detail is paid for with `mergeParts`, never with extra meshes. Nothing on the
  wagon is grabbed, moved or recoloured at runtime, so it may merge.

**Tests:** each dressing shows its own pieces and hides the others; the wagon
carries whatever is dressed on it when it travels; a cue naming a dressing
applies it; piece count stays inside the shows' band.

**Negative check:** against a build where the dressing swap toggles `visible`
only — the layers/raycast assertion must fail.

---

## PR 5 — the closet, the roof, and two deletions (RULING AS)

- **New:** `closet` (42:34) and `roof` (56:00).
- **Deleted:** `crypt` — the scene, its three cues, and the `sets.js`
  assertions that pin it. It is not in the show.
- **Retired:** the `signset` scene, superseded by PR 3's flying sign.

Rewrite the removed assertions **in place** saying what they used to guard and
why that changed — the same courtesy the round paid the original
`SHOWS.beetlejuice` assertion. Do not delete them silently.

---

## PR 6 — confetti

A burst, not a state: fired once, falls under gravity off `dt`, clears itself.
Sits with `rain`/`storm`/`fire` in `p5c` and takes a cue field the same way
they do. One instanced batch, not a mesh per fleck.

**Tests:** the cue field fires it; it falls under a stepped `dt`; it clears; it
is not in `WALKABLE`.

---

## PR 7 — the re-timed cue list (RULINGS AR, AU)

The point of the round. Every `looks[].at` re-anchored onto the owner's
seventeen beats, every `scene` / `dress` / `move` / fly value set to match, and
the covers moved to where the changes now are.

- **Fades and channel levels are not touched.** They were measured off held
  shots; the owner's list says nothing about light.
- **Two holds:** the pre-show preset and the interval carry `follow:null`. The
  auto-cue loop currently fills every gap and blanks only the last cue — it
  must learn about both holds.
- **Ends at 8100** (RULING AR). Cues past it are deleted, not stretched.
- The opening light sequence gains the beat the owner described: light, **sign
  out**, curtain up, graveyard.

**Tests:** the act break still lands on **4262**; the end lands on **8100**;
exactly three cues carry `follow:null` (pre-show, interval, last); every one of
the sixteen changes is covered by a blackout, the curtain, or the backdrop; the
scene named by each cue matches the plot table in the spec.

**Negative check:** against the current build — the act-break assertion passes
today (4262 is unchanged, deliberately), so it is **not** a valid negative
check on its own. Use the end-of-show and hold-count assertions, which fail
against `main`.

---

## Gates, every PR

```sh
sh build.sh
cd tests && npm test        # 18/18
cd tests && node real.js    # "fatal": null
```

`main` must rebuild byte-identical after each merge. Branch deleted local and
remote. Cache-bust bumped past `?v=16` on the last one.
