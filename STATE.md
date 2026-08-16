# STATE — 2026-08-15 (ART-NET: SIX PRs LANDED, RULINGS EL–EW)

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## READ THIS FIRST

The desk drives the Palace. Six PRs of a nine-PR chain are on `main`
(**`e0c5768`**), the suite count is **21**, rulings are at **EW**, and the
cache-bust is **`?v=30`** from here.

**Nothing in this round has been seen on hardware, and nothing has been seen
against a real desk.** Every number below came out of jsdom.

| PR | Ruling | What |
|---|---|---|
| **#200** | **EL** | `tools/artnet-relay.js` — zero-dep Art-Net→WebSocket relay, and the 21st suite |
| **#201** | **EM state, EN, EU, EV** | `src/p6d.txt` — the socket, the reconnect off frame `dt`, `artnetTick` |
| **#202** | **EP, EN, EO** | the lights are raw writes; the Palace only; the channel bases |
| **#203** | **EM gates, EV, EW** | the board yields; the ARTNET row on both surfaces |
| **#204** | **EQ** | the flys, through their own motor |
| **#205** | **ER, ES** | the Beetlejuice house selector and the sign |

Every merge verified: `main` rebuilds **byte-identical**, 21/21 suites on the
merged result, branches deleted local and remote. Two-stage review on every
PR, and on most of them a THIRD pass over the fix commit.

## WHAT IS LEFT — three things, in order

### 1. PR 7 (RULING ET, set movers) — BUILT, MERGED WITH MAIN, NOT VERIFIED

Branch **`artnet-movers`**, tip **`cb10848`**. It has `artMovers` in `p6d`,
one channel per mover, `m.target` only, walked at the mover's own speed. It
was written in a worktree by an agent, then `main` was merged into it (both
`p6d` blocks kept, the built file rebuilt from `src`).

**It has had NO review and the full suite has NOT been run on the merge.** The
merge commit says so. Do not merge it to `main` on this state. Next session:
`cd tests && npm test`, then a two-stage review, then the usual protocol.

**AND IT CARRIES A QUESTION FOR JACK THAT SHOULD BE ASKED BEFORE IT LANDS**
— see "STILL HIS TO DECIDE" below. It is one condition either way.

Its channel order for Beetlejuice, measured off the records (this is what the
map probe will print, and `bjSign` is excluded because the rail hauls it):

| Ch | Mover | Axis | byte 0 → 255 |
|---|---|---|---|
| 310 | cemetery : hillR | x | 0.00 → −9.50 |
| 311 | cemetery : hillL | x | 0.00 → +9.50 |
| 312 | house : mv | y | 0.00 → 0.00 **(degenerate)** |
| 313 | interior : mv | z | −10.00 → 0.00 |
| 314 | attic : all | x | 0.00 → −19.50 |
| 315 | attic : park | z | 0.00 → +1.00 |
| 316 | bedroom : all | x | 0.00 → −18.51 |
| 317 | bedroom : park | z | 0.00 → −9.20 |
| 318 | afterlife : all | y | 0.00 → +10.50 |
| 319 | closet : all | x | 0.00 → −18.71 |
| 320 | closet : park | z | 0.00 → −14.91 |
| 321 | roof : all | y | 0.00 → +10.50 |

Note **312 is dead at both ends** (home 0, no `out`) — and dead is not inert:
it writes `target` 0 every frame, so while a desk drives, the exterior can
never fly out. Reading ET literally is deliberate; changing it means
consulting `sc.parkMv`, which the plan's correction #2 forbids.

### 2. PR 8 (RULING EO) — the map probe, NOT STARTED

`tools/artnet-map.js` reads the **BUILT** `the-house.html`, prints its byte
size (probe rule), boots it under jsdom the way `tools/draws.js` does, and
emits every channel with its real label — fixture name and section, lineset id
and goods, the 307/308 band tables, each mover's name and metre range. Output
is committed as **`docs/ARTNET.md`**, and a suite assertion fails if the
committed file differs from what the probe emits. **The map cannot drift
because it is read off the code.** Run `node probe-lint.js` after every edit.

Everything it needs is already in the build: `artFixBase`, `artFlyBase`,
`artHouseBase`, `artSelBase`, `artMoverBase`, `ART_CH_FIX`, `ART_PAN`,
`ART_TILT_LO/HI`, `ART_FLY_MAX`, `ART_HOUSES`, `artBandOf`.

Two things the map must say that the code cannot: **"even/odd channel" for the
flys holds only because `artFlyBase()` is 274 today** — the bases are computed,
so a 40th fixture puts every fly TARGET on an odd channel; and `sc.mv` records
carry no `group` field while `sc.pmv` records do.

### 3. PR 9 — the rest of the record

`VR-SETUP.md` needs the QLC+ section (output Art-Net to 127.0.0.1, universe 0)
and the two-line Route B recipe. `FUTURE.md`'s Art-Net entry gets deleted when
the chain finishes. This file and HANDOFF.md are done as of PR #206.

## HOW TO ACTUALLY RUN IT

```sh
node tools/artnet-relay.js            # serves the repo, upgrades /artnet, UDP 6454
```

Then open `http://localhost:8080/the-house.html`, LIGHTING page, throw ARTNET.
QLC+ outputs Art-Net to **127.0.0.1, universe 0**.

Headset: `adb reverse tcp:8080 tcp:8080`, then the same localhost URL in the
Quest. **Art-Net from the GitHub Pages URL cannot work** — that page is HTTPS
and a LAN `ws://` is mixed content. The relay says so in its banner.

The relay binds **127.0.0.1 by default** (it serves the working directory,
which is the repo, `.git` included). `--host 0.0.0.0` opens the LAN if he
really wants it; the UDP socket is unaffected either way, so a desk on another
machine still reaches it.

## STILL HIS TO DECIDE (this round)

1. **THE BIG ONE — what an unpatched universe does to his scenery (RULING ET).**
   ET gives set movers no speed byte, so byte 0 is `home` and **512 zeros
   command every mover in the loaded show home**. Measured: it walks the parked
   attic **19.50m onto the deck while it is drawn**, and flies the exterior
   cloth in. A desk patched only for the 273 light channels sends zeros on
   everything else, which is the likeliest first real use. RULING EQ's stated
   principle is that a dead universe moves no scenery. Two answers: **parked
   unless driven** (byte 0 means "no command", 1–255 spans home→out — costs
   exact-home commanding by one byte, and matches the flys and channel 309), or
   **as ET is written**. One condition either way.
2. **Channel 309, already decided the safe way and reversible in one line.**
   Written unconditionally it was the one piece of scenery a dead universe DID
   move: the house curtain ran itself shut at 0.42/s in front of the audience.
   It is now parked by its own lineset's speed byte. Say the word and it goes
   back to EO's literal table.
3. **Audio from QLC+ — asked and unanswered.** Art-Net carries DMX only. A
   QLC+ audio function plays on the PC's own sound card, outside the game
   entirely. The offer on the table: a **4-channel sound block** (track select,
   play/stop, master volume, seek) so a desk cue fires the game's OWN
   recordings in sync with its transport — the machinery already exists from
   RULING BO. One extra PR. Or volume only (1 channel). Or leave it out.
4. **The Art-Net redress pops in full view.** RULING AY defers a cue's dress
   until the set is out of sight; the band channel swaps it in place. Immediate
   is probably right for a desk (the same argument as EV), but ER's claim that
   this is "the exact mechanism the show itself uses" is not accurate — the
   show uses `bjDress`, which IS the deferral. His to rule on.
5. **ET's own parenthetical is wrong about the data.** "the attic tracking in
   from x −14.20" — the built record is home 0, out −19.50. The records are
   what the code and the map read; the sentence is what will not match.

## WHAT THE ROUND IS, IN ONE PARAGRAPH

QLC+ (or any desk) sends ArtDmx on UDP 6454. `tools/artnet-relay.js` — zero
npm dependencies, hand-rolled RFC 6455 — serves the game AND forwards each
packet's 512 channel bytes as one binary WebSocket frame, which is what makes
the socket same-origin and works over `adb reverse` with no certificate.
`src/p6d.txt` stores the latest frame in `ART.buf` and applies it once per
frame in `artnetTick`, called from `p7` after input and above everything that
reads the rig. `artDriving()` — the switch AND a frame inside 2 seconds — is
the one gate the rest of the game asks.

## THE ENGINE PIECES THIS ROUND ADDED

- **`src/p6d.txt`** — a new build part after `p6c`, before `p5c` (the spec said
  "p6c"; that name was already the carpenters). `ART` state, `artUrl`/`artOpen`/
  `artBackoff`/`artClose`, `artSetOn`, `artDriving`, `artHandover`,
  `artnetTick`, `artLights`, `artFlys`, `artBands`, `artYields`, `artSyncRow`.
- **`artDriving()`** — the gate. Used by `fireCue`, GO/BACK/TOP, `runSub`, all
  three `setSection*`, `showAudioTick`'s cue sweep, `standByAtTheTop`, the
  firelight, `audFxStep`, `stepProgram`, the fly board on both surfaces, the
  VR rope, the sign's X-rows, and the pan/tilt/house sliders.
- **One guarded read in `updateFly` (p3)** — `ls.artSpeed` while a desk drives,
  `ls.speed` otherwise. `ls.speed` is never written, because `hangGoods`
  recomputes it from goods weight and would destroy an Art-Net write silently.
- **The channel bases are FUNCTIONS** (`artFlyBase()` etc.), computed off
  `FIXTURES.length` and `FLY.length`, because a literal would silently repoint
  every channel after a rig change and `docs/ARTNET.md` is generated from them.

## TUNABLES ADDED (all in p6d unless noted)

`ART_STALE` 2.0 · `ART_BACKOFF` [1,2,4,8] · `ART_CONNECT_MAX` 10 ·
`ART_PROVE` 44 · `ART_CH_FIX` 7 · `ART_PAN` 170 · `ART_TILT_LO` −180 ·
`ART_TILT_HI` 0 · `ART_FLY_MAX` 2.0 · `ART_HOUSES` maitland/deetz/bj.

## CARRIED FROM THE PERF ROUND — STILL UNSEEN

**The `?v=29` headset run never happened**, and it is still owed. Read all four
wrist lines (`avg`, `pk`, `fov`, `calls · tri`) at the four moments: empty
Palace, Beetlejuice pre-show, the 1:00 cue with eight blinders, at the
proscenium looking up into the neon. Prediction on record: **~590 calls empty
at the boot view**; if it reads ~700 the build is stale. The DT/DU look
questions and the carried DJ–DQ questions are in HANDOFF's DR–DY block.

Everything else in "STILL HIS TO DECIDE" from that round stands: the neon
rake, the sign's red at GO, the cemetery's missing park, 181MB of models, the
graveyard, the audio join at 4292, the house floor pool, `BLIND_BODY`,
`pr6.json` (still untracked, still unruled), the `envTrack` rota backstop.

## Standing facts

Suite count **21** (`npm test` in tests/); probe-lint runs first and is a test
of the TESTS. The patch is 39 channels on every stage and the rail is 14 lines
— which is where 274 and 302 come from, computed not written. three.js has
**no multiview at any version**; r160.1 is the UMD ceiling. **His photographs
are never committed.** **Every timestamp in the Beetlejuice plot is a position
in his WHOLE recording.**

## Shelved

**Nothing.**
