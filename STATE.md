# STATE — 2026-08-16 (ART-NET: THE CHAIN IS FINISHED, RULINGS EL–EY)

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## READ THIS FIRST

The desk drives the Palace, and the nine-PR chain is **done**. `main` is
**`<the PR 9 merge>`**, the suite count is **21**, rulings are at **EY**, and the
cache-bust is **`?v=31`** from here.

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
| **#207** | **ET, EX** | the set movers — parked unless driven |
| **#208** | **EO** | `tools/artnet-map.js` and the generated `docs/ARTNET.md` |
| **#209** | **EY** | the record: the QLC+ recipe, the rulings, the one bug left standing |

Every merge verified: `main` rebuilds **byte-identical**, 21/21 suites on the
merged result, branches deleted local and remote. Two-stage review on every
PR — and on #207 that review was the first the mover code had ever had.

## THE ONE THING LEFT, AND IT IS RULED BUT NOT BUILT

**RULING EY — a dead universe still hauls the BEETLEJUICE sign 11.36m.**
Jack ruled the fix and ruled that it waits: *"Don't fix it — just record it."*
It is written up in the spec, and the work is **PART 1a item 4 of FUTURE.md**.

`artBands` writes channels 307 and 308 on a band CHANGE only, and the two band
memories start at **-1**. A change from -1 is a change — so the FIRST frame of
an unpatched universe reads band 0 and acts on it: channel 308 hauls the sign
to its FLOOR stop (**11.356m of world travel**, measured from its UP stop, in
full view), and channel 307 redresses whichever house is standing back to the
Maitlands.

**The third time the same collision was found in one round.** EQ gave the flys
a speed byte; 309 was parked by its own lineset's speed byte after an unpatched
desk ran the house curtain shut in front of the audience; EX made byte 0 "no
command" on the set movers. The bands were the only ones left, and they were
left because nobody had measured them.

**AND THE SUITE READS GREEN ON IT BECAUSE OF CASE ORDERING** — which is the
finding worth keeping. The round's own safety case for the sign calls
`deskOn()` (which delivers a frame, which establishes band 0) BEFORE it puts
the sign on its stop, so its 120 measured frames are a no-change band. The
assertion written to prove the sign safe is the thing concealing the hole.
Move that `deskOn()` two lines down and it fails.

## HOW TO ACTUALLY RUN IT

```sh
node tools/artnet-relay.js            # serves the repo, upgrades /artnet, UDP 6454
```

Then open `http://localhost:8080/the-house.html`, LIGHTING page, throw ARTNET.
QLC+ outputs Art-Net to **127.0.0.1, universe 0**. **Patch off
`docs/ARTNET.md`** — it is generated from the build and the suite fails if it
drifts. VR-SETUP.md §8 is the full recipe.

Headset: `adb reverse tcp:8080 tcp:8080`, then the same localhost URL in the
Quest. **Art-Net from the GitHub Pages URL cannot work** — `artUrl()` only ever
builds a SAME-ORIGIN socket, so from an HTTPS Pages page it attempts
`wss://jackscreations21.github.io/artnet`, and there is no WebSocket endpoint
there. (Mixed content is what kills the obvious workaround — hard-coding a LAN
`ws://` — not the default path. The console error will not say "mixed
content", which is worth knowing before anyone debugs it.)

The relay binds **127.0.0.1 by default** and serves **the repo** — resolved
from the script's own location, so you cannot redirect it by `cd`-ing
elsewhere. `--host 0.0.0.0` opens the LAN; the UDP socket is unaffected either
way, so a desk on another machine still reaches it.

## STILL HIS TO DECIDE

1. **Audio from QLC+ — asked and unanswered, twice now.** Art-Net carries DMX
   only. A QLC+ audio function plays on the PC's own sound card, outside the
   game entirely. The offer on the table: a **4-channel sound block** (track
   select, play/stop, master volume, seek) so a desk cue fires the game's OWN
   recordings in sync with its transport — the machinery already exists from
   RULING BO. One PR. Or volume only (1 channel). Or leave it out.
2. **Channel 312 is one-way and nothing can be done about it without a
   ruling.** The Maitlands exterior is a whole-group travel with `home` 0 and
   no `out`, so every byte from 1 to 255 commands it HOME and no byte sends it
   back out — and it hangs a 12.6m drop dead centre of a 15m opening. Widening
   it means consulting `sc.parkMv`, which the plan's correction #2 forbids.
   `docs/ARTNET.md` prints it rather than hiding it.
3. **Channel 309's traveler moves with the production, and the spec has it
   wrong.** EO and STATE both said "the house curtain". On the Palace standing
   hang that is right (line 2). **With Beetlejuice loaded it is line 1**,
   because the show hangs its own `bjCurtain` and `FLY.findIndex` takes the
   first — the Palace house curtain is not hung at all under Beetlejuice. The
   map measures and prints both. Nothing is broken; the DOCUMENT was wrong.

## CARRIED, AND STILL UNSEEN

**The `?v=29` headset run never happened**, and it is still owed — now two
rounds deep. Read all four wrist lines (`avg`, `pk`, `fov`, `calls · tri`) at
the four moments: empty Palace, Beetlejuice pre-show, the 1:00 cue with eight
blinders, at the proscenium looking up into the neon. Prediction on record:
**~590 calls empty at the boot view**; if it reads ~700 the build is stale.

Everything else in "STILL HIS TO DECIDE" from the perf round stands: the neon
rake, the sign's red at GO, the cemetery's missing park, 181MB of models, the
graveyard, the audio join at 4292, the house floor pool, `BLIND_BODY`,
`pr6.json` (still untracked, still unruled), the `envTrack` rota backstop.

**And a pre-existing flake worth knowing about before it wastes an hour:**
`tests/smoke.js` "the puffs drift, spread and die" fails about **1 run in 12**
— a puff whose random drift stays under the case's 0.3m threshold. Found
during this round on a build it does not touch. Not fixed; it is in FUTURE.md.

## Standing facts

Suite count **21** (`npm test` in tests/); probe-lint runs first and is a test
of the TESTS. The patch is 39 channels on every stage and the rail is 14 lines
— which is where 274 and 302 come from, computed not written. three.js has
**no multiview at any version**; r160.1 is the UMD ceiling. **His photographs
are never committed.** **Every timestamp in the Beetlejuice plot is a position
in his WHOLE recording.**

## Shelved

**Nothing.**
