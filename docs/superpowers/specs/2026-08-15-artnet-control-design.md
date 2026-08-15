# Art-Net control of the Palace — design (2026-08-15)

**BINDING. Rulings EL–EW.** The next spec starts at **EX**.

## The brief, verbatim

> make the lights controllable over artnet. make it so every light, fly and
> set movment is controallable by artnet. make it so for beetljuice it has a
> channel and if it is between 0 and 85 it is the maitlands house. if it
> between 86 and 170 it is the deetz house and if it is between 171 and 255
> it is the beetlejuice house. make it so each fly has 2 sliders one for
> speed and one for target position. create a file labeling what each
> channel is.

Answered in design Q&A (2026-08-15):

- **A relay program on the PC is acceptable** ("do number 1. but would it
  work on vr" — yes, via Route B; see §2).
- **Scope is "only ever palace"** — one universe, the Palace rig, nothing
  else, ever.
- **Approach C chosen** ("do c"): lights raw, flys and set movers through
  their own motors, an explicit mode switch on both surfaces.

## What this is

The game becomes an Art-Net visualizer for the Palace: QLC+ (or any
console — Art-Net is Art-Net) sends DMX, a small relay turns it into
WebSocket frames, and the game's rig follows it. A mode switch chooses
between the desk and the game's own board; the board is untouched when the
mode is off.

Nothing here changes how any production runs today. Every gate in this spec
is additive: `ART.on === false` must leave the built file behaviourally
identical to before the round.

---

## RULINGS

### RULING EL — Art-Net enters through a relay; the game speaks only WebSocket

Art-Net is UDP and a browser page cannot receive UDP — no exceptions, no
clever workaround. The relay is `tools/artnet-relay.js`:

- **Zero npm dependencies.** Node's own `dgram`, `http`, `net`, `crypto`.
  Node v24 is already on the machine (it runs the suite). The WebSocket
  server side is hand-rolled RFC 6455 (accept-key handshake, unmasked
  server→client binary frames, answer ping with pong, honour close); the
  server never needs to parse large client frames — the game sends nothing
  but the occasional pong.
- **Three jobs, one port** (default 8080, `--port` to change): serves the
  repo directory as static files; upgrades `GET /artnet` to a WebSocket;
  listens on UDP 6454 for ArtDmx.
- **ArtDmx parse:** packet id `Art-Net\0` (bytes 0–7), opcode `0x5000`
  little-endian (bytes 8–9), universe little-endian (bytes 14–15), length
  big-endian (16–17), channel data from byte 18. Wrong id, opcode or
  universe (default 0, `--universe` to change) → dropped silently.
- **Forwarding:** each accepted packet's channel data goes to every
  connected client as one binary frame, padded/truncated to 512 bytes.
  No batching, no rate logic — Art-Net's own refresh (~44Hz) is the rate,
  and the game keeps only the latest frame per render tick anyway.
- **VR route:** the headset loads the game from this same relay via
  Route B (VR-SETUP.md): `adb reverse tcp:8080 tcp:8080`, then
  `http://localhost:8080/the-house.html`. Same origin, so the WebSocket is
  `ws://localhost:8080/artnet` — no certificates, no mixed content.
  **Art-Net in VR from the GitHub Pages URL does not work and is not
  supported** — the page is HTTPS and a LAN `ws://` is mixed content. The
  relay prints this in its startup banner so nobody rediscovers it.

### RULING EM — one switch, both surfaces, and the game's masters still win

A new `ART` state in the game (`src/p6c.txt`): `{on:false, seen:0, buf:null}`.

- **The toggle exists on BOTH surfaces**: an ARTNET row on the LIGHTING
  panel (p1 markup, p6c wiring) and the same row on the VR console's
  LIGHTING page (p9). A control that exists only in the DOM does not exist
  in VR — that rule is already paid for.
- **`ART.on === true` gates every internal writer of rig state:**
  - `fireCue` (p6) — returns before touching anything (GO/BACK/TOP toast
    "board is on ART-NET" instead).
  - `showAudioTick` (p5j:273) — the transport keeps time and audio, but its
    cue-firing branch is skipped. Sound is not Art-Net's; light is.
  - `runSub` (p6) — submaster moves ignored.
  - `setSection` / `setSectionColor` / `setSectionGobo` (p6) — panel and VR
    fader writes ignored (the faders still MOVE — `syncSections` reads back
    from the rig, so they display what the desk is doing; they just stop
    writing).
  - The fly board UI's `flyTo` calls and the VR rope (p9) — a desk-driven
    line is not also hand-hauled; the rope reports "on ART-NET".
- **What is NOT gated:** `RIG.grand` and `RIG.blackout` still multiply the
  final output in `updateRig` (p4:1694, :1744). The in-game grand master
  outranks the desk, deliberately — it is the safety, same as a house
  console's grand over a remote desk.
- **Switch-ON hygiene:** every fixture's `lvlDur` and `colDur` zero on the
  frame the mode goes on, so a cue fade caught mid-flight halts where it is
  instead of fighting the desk.
- **Switch-OFF:** nothing snaps. The rig holds its last Art-Net look and
  the board resumes writing from there — exactly what happens when an
  operator takes over a rig mid-state today.

### RULING EN — the Palace only, ever

Jack's scope: "only ever palace". Art-Net data applies only while
`STAGE === 'palace'` (p2k:25). Patched to any other stage: packets are
still received (the indicator stays live) but nothing is written. No
per-stage universes, no writes into a parked stage's captured state — that
machinery is not built and this ruling says it never is without a new
ruling.

### RULING EO — the channel map is generated, and cannot drift

**Universe 0, one universe.** Layout:

| Channels | What | Footprint |
|---|---|---|
| 1–273 | the 39 fixtures, patch order = `FIXTURES` order | 7 each: intensity, R, G, B, gobo, pan, tilt |
| 274–301 | the 14 linesets, `FLY` order | 2 each: target, speed |
| 302–305 | house circuits: house, work, lobby, backstage | 1 each |
| 306 | house circuit: practicals (`HOUSE.practical`, p4:2049) | 1 |
| 307 | BEETLEJUICE house selector (RULING ER) | 1 |
| 308 | BEETLEJUICE sign position (RULING ES) | 1 |
| 309 | traveler open (0=shut, 255=open) — applies to the first lineset whose hung goods declare `traveler:true`; the map probe prints which line that is | 1 |
| 310+ | set movers of the loaded show (RULING ET) | 1 each |

- **Uniform 7-channel fixture footprint** so QLC+ needs exactly one generic
  fixture definition. Pan/tilt bytes are ignored on non-movers (only
  channels 23, 24 and 34–39 are movers today). Gobo: byte/43 → index 0–5
  (the six `GOBO_NAMES`).
- **The map file is `docs/ARTNET.md`, GENERATED** by a new probe
  `tools/artnet-map.js` that reads **the BUILT `the-house.html`** (and
  prints its byte size, per probe rules), boots it under jsdom the way
  `tools/draws.js` does, and emits every channel number with its real
  label: fixture name and section, lineset id and goods, band tables for
  307/308, each mover's name and its metre range. The committed file is
  regenerated whenever the rig changes; a suite assertion fails if the
  committed file differs from what the probe emits against the current
  build. **The map cannot drift from the code because it is read off the
  code.**

### RULING EP — lights are raw writes; the fade engine never fights the desk

Per incoming frame (applied once per render tick, latest frame wins), for
each fixture: `f.level = byte/255`, `f.color.setRGB(r,g,b)` (bytes /255),
`f.gobo`, movers `f.panT`/`f.tiltT` (pan byte → ±170°, tilt byte → the
fixture's own travel range; exact ranges printed by the map probe). Every
write sets `lvlDur = colDur = 0` — `updateFades` (p6:17) only engages while
a duration is pending, so the desk's own fades stream through untouched.
QLC+ fades by sending values every frame; stacking the game's fade engine
on top would make every fade mushy. The desk fades; the game obeys.

### RULING EQ — flys move through their own motor, never teleport

The two sliders per line map onto machinery that already exists:

- **Target** (even channel): byte 0 = deck, 255 = grid, mapped onto
  `[minTrimOf(ls), OUT_TRIM]` and applied via `flyTo(ls, y)` (p3:212) —
  which works the lock itself and clamps, so **a desk cannot drive a cloth
  through the floor** any more than a cue can (INVARIANTS).
- **Speed** (odd channel): byte 0 = **parked** (the line does not move,
  whatever the target says — a dead universe moves no scenery), 255 =
  `ART_FLY_MAX` (new tunable in p6c, default 2.0 m/s). While `ART.on` and
  the line has a live speed byte, `updateFly` (p3:225) uses this speed in
  place of `ls.speed` — one guarded read; `ls.speed` itself is never
  written, because `hangGoods` (p3:175) recomputes it from goods weight and
  an Art-Net write there would be silently destroyed on the next hang.
- Runaway physics untouched: a board-driven line is a board move, and
  `updateFly` already ends a runaway when anything writes `ls.target`.

### RULING ER — the house selector, his bands exactly

Channel 307. 0–85 → `'maitland'`, 86–170 → `'deetz'`, 171–255 → `'bj'` —
the three dressing keys as built (p5h:1592/1757/1848). Applied only when
the loaded show's scene carries those dressings (the Beetlejuice interior):
set `sc.dressOn`, call `bjRedress(sc)` (p5h:514) — the exact mechanism the
show itself uses, holding two houses out of the graph (RULING CN). Fires
only on a band CHANGE, not per packet — `bjRedress` detaches/attaches scene
graph nodes and must not run 44 times a second. Any other show loaded:
channel ignored.

### RULING ES — the sign, the same idiom

Channel 308, three bands, same splits: 0–85 → stop 0 FLOOR, 86–170 →
stop 1 PRE-SHOW, 171–255 → stop 2 UP — the sign's own named stops
(RULING DH, p5h:2578) via `flyExtraToStop` (p5c:195). Band-change only,
like ER. No Beetlejuice loaded: ignored.

### RULING ET — set movers: one target channel each, walking at their own speed

From channel 310: iterate `SHOW.scenes` in declaration order; for each
scene, its travel mover `sc.mv` first, then its part movers in declaration
order. Each mover gets ONE channel:

- byte 0 → `m.home`, byte 255 → `m.out` where declared (parks and part
  travels), else → 0 on its axis (the acting position of every open travel
  this game has — e.g. the attic tracking in from x −14.20). Linear
  between. The map probe prints each mover's actual metre range so nothing
  is guessed from this paragraph.
- The write is `m.target` only. The mover walks there at its own
  `m.speed` on the existing scene tick — no teleporting, same reason as EQ.
- No speed channels for set movers — Jack asked for speed on flys only.
- The block reassigns when the loaded show changes. `docs/ARTNET.md`
  documents Beetlejuice's block fully (it is the show this is for); other
  shows' movers are live but documented by the probe's output, not by hand.

### RULING EU — hold the last look; reconnect off the frame dt

- **Signal loss** (no frame for >2s): the rig HOLDS its last look — a real
  rig does not snap to black when the desk hiccups. The ARTNET row shows
  live/stale and last-packet age on both surfaces.
- **Socket drop:** reconnect attempts are timed off the frame `dt`
  accumulated in the game loop — **never `setTimeout`** (hard rule).
  Backoff 1s → 2s → 4s → capped 8s.
- **Frame application:** the WebSocket `onmessage` only stores the bytes in
  `ART.buf`; the frame loop's `artnetTick(dt)` (called from p7, once,
  after input and before `updateRig`) applies the latest buffer. One
  writer, one place in the frame, no mid-frame tearing.

### RULING EV — no signal is not a mode; the board simply has it back

Added 2026-08-15, after the round began. Jack, on reading the plan:

> make it so it just runs normally if it doesnt detect art net signals.

**This narrows RULING EM.** EM gated the board on the SWITCH; the gate is now
on the SWITCH **and a live signal**. `ART.live` is true only while a frame has
arrived within `ART_STALE` (2s, RULING EU's window).

- Switch on with no desk connected, or no relay running: **nothing changes.**
  Every cue, sub, fader, fly and rope works exactly as it does today. A switch
  that silently killed the board would be indistinguishable from a broken
  game, and it is the first thing anyone will do with it.
- Desk drops mid-show: the board takes over from where the desk left it. This
  does not fight RULING EU — EU says the RIG holds its last look and nothing
  snaps, and it still does. EU governs the light; EV governs who may write.
- The ARTNET row's live/stale reading is therefore not decoration: it is the
  gate, shown. Both surfaces print it (EM).
- The one thing this costs: a desk that stutters for two seconds hands the
  board back and takes it again. That is the right trade — the alternative is
  a rig nobody can touch because a laptop went to sleep.

### RULING EW — EM's list of writers was incomplete, and one of the gaps runs for ever

Added 2026-08-15, from the PR 5 review. RULING EM named the writers to gate
by listing them. The list was written from the board's controls, and it
missed every writer that is not a control — which is most of the dangerous
ones, because a control writes when a hand moves and these write every frame.

**The gate is now the RULE, not the list**: *nothing inside the game may write
a fixture's level, colour, gobo, pan or tilt, or a HOUSE circuit, while
`artDriving()` is true.* Named because each was found by measurement:

- **`standByAtTheTop` (p5c)** — calls `fireCue(0)`, which refuses, and then
  writes all 39 fixtures itself anyway. A half-refusal is worse than either
  whole answer: the operator got a toast saying the board had yielded, a frame
  of the wrong look, and a cue pointer that had moved.
- **The firelight (`updateStorm`, p5c)** and **`audFxStep` (p5j)** — both run
  AFTER `artnetTick` in the frame and win every frame. Not a flicker or a
  fight: a **silent total override on a subset of channels**, with the ARTNET
  row still reading LIVE and nothing anywhere to say why.
- **And the part that makes it a ruling rather than a patch:** `SHOW.flicker`
  and `AUD.fx` are only ever cleared by `showCueExtras`/`showCueFx`, which
  only `fireCue` reaches — and EM gates `fireCue`. **So an effect armed in the
  last cue before the desk takes over could never be turned off again.**
  Gating the effects themselves fixes this: they stop writing while the desk
  drives and resume when it stops, which is what handing a rig back means.
- **The pan/tilt and house sliders (p7)** — `#panR`, `#tiltR`, `#hl`, `#wl`
  write `f.panT`/`f.tiltT`/`HOUSE` directly, bypassing `setSection*`. Art-Net
  owns those bytes (fixture channels 6–7; house 302–303), so ungated they are
  the mover swinging under the operator's hand and snapping back 44 times a
  second — the exact fight this round exists to stop.
- **The script engine's rig ops (`stepProgram`, p6)** — `at`, `color`, `gobo`,
  `pan`, `tilt`, `bo`, `sys`. Only its `cue` and `sub` ops passed through
  gated functions, so a running show script kept writing against the desk, and
  its faded writes set `lvlDur`, which `updateFades` then carried for the
  whole fade.

`RIG.grand` and `RIG.blackout` remain ungated (EM), and the transport keeps
its clock and its audio (EM). This ruling adds no new surface: it is the same
gate, applied where the list forgot to look.

---

## Architecture

**New part `src/p6c.txt`** (after `p6b` in build.sh — order is a dependency
order, position chosen because p6c calls p6's `chan`/`syncMasters` and
p3/p5c functions only at runtime, never at build): `ART` state, the
WebSocket client + reconnect, `artnetTick`, the byte→rig mapping, the
band decoders, the mode toggle wiring for the DOM row.

**Touched parts, each minimally:**

- `p1` — the ARTNET row markup on the LIGHTING panel.
- `p6` — the gates in `fireCue`, `runSub`, `setSection*` (one guard line
  each).
- `p5j` — the gate on `showAudioTick`'s cue-firing branch.
- `p3` — the one guarded speed read in `updateFly`.
- `p7` — the `artnetTick(dt)` call site.
- `p9` — the VR console row; the rope guard.
- `build.sh` — one added line for p6c (never sorted).

**New tools:** `tools/artnet-relay.js` (the relay), `tools/artnet-map.js`
(the map probe). Both pass probe-lint.

**New docs:** `docs/ARTNET.md` (generated), a QLC+ setup section appended
to VR-SETUP.md (output Art-Net to 127.0.0.1 universe 0; the two-line VR
recipe).

**Cache-bust:** bumped when the round lands, numbered at landing time
(FUTURE.md has already earmarked `?v=30` for the paused GMS round's headset
run — whichever lands first takes 30, the other 31).

## Testing

New suite `tests/artnet.js` (suite count 20 → 21; it must be added to
`run-all.js`):

- **Mapping:** synthesize a 512-byte frame, call the apply path directly
  (the ws client stores to `ART.buf`; tests write `ART.buf` and call
  `artnetTick`), assert fixture level/colour/gobo/pan/tilt land, `lvlDur`
  stays 0, fly targets clamp to `minTrimOf`, speed 0 parks, band tables
  switch `dressOn` / the sign stop, mover targets map home→out.
- **Gating:** with `ART.on`, `fireCue` changes nothing, `runSub` changes
  nothing, sections write nothing; with it off, all three work — asserted
  through the DOM, not the model (TRAPS).
- **Palace-only:** patch the board to the Arc, apply a frame, assert zero
  writes.
- **Band-change-only:** two identical frames → `bjRedress` runs once
  (counted via the dressing's graph membership, not a spy on the function).
- **The relay, for real:** the test spawns `tools/artnet-relay.js` as a
  child process on a free port, connects with Node's own WebSocket client
  (global in v24), sends a genuine ArtDmx packet over UDP, and asserts the
  512 bytes arrive intact; then a wrong-universe packet and asserts
  silence.
- **The map:** run `tools/artnet-map.js`, assert its output equals the
  committed `docs/ARTNET.md` byte for byte.
- **Every new assertion negative-checked by sha** — mutation proved present
  in the BUILT file, proved to have changed the build, restore proved
  byte-identical. House rules, no exceptions.

What jsdom cannot prove, named honestly: that QLC+'s actual output looks
right on the rig, the feel of fly moves under a fader, and anything about
VR hands. Those are the headset/desk run's questions.

## Sequencing

The GMS Studios round is paused with two branches in flight (FUTURE.md
Part 1), and `gms-studio-grids` touches `updateRig` in `p4` — this round
does not touch `updateRig`, so the only shared surface is `p7`'s frame
loop and `p9`'s console pages (small, mergeable). Every PR here bases on
fresh `main` and retests per the hard rules, so the rounds stay
independent; FUTURE.md's Part 1a bugs (the save-eater especially) remain
worth landing first as their own small PRs, as already suggested there.

## Open questions (non-blocking, default answers in force)

1. **A QLC+ fixture definition file (.qxf) for the 7-channel footprint** —
   nice-to-have, not in scope; the map file is enough to patch by hand.
   Say the word and it becomes a PR.
2. **Set-mover speed channels** — deliberately absent (ET). If driving a
   set at cue-variable speed matters later, that is a new ruling.
3. **The neon portal frame** is a cue field, not a fixture, and is NOT on
   the map in this round. If it should be, it is one channel and one small
   ruling.
