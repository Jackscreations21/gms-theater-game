# STATE — 2026-10-11 (THE HAMILTON SET IS A MODEL ON THE STAGE)

**Do not trust this file for what is next without fetching first.** `git
fetch`, compare `origin/main`, then read this.

## NEWEST — 2026-10-11, the Hamilton set (branch `hamilton-set`, RULING FE)

- **Where it stands: committed (`f4d9a90`) and pushed, PR NOT YET OPENED.** The
  permission layer refused the GitHub API call, so Jack opens it from
  https://github.com/Jackscreations21/gms-theater-game/compare/main...hamilton-set
  (the body is in the chat of 2026-10-11). Until it merges, `main` is `4125f6f`
  with the red `beetlejuice.js` case below. After the merge: rebuild `main`
  byte-identical, 21/21, delete the branch both sides — the post-merge protocol.
- **RULING FE (Jack, 2026-10-11): "can you put the set model onto the stage."**
  HAMILTON is now *modelled on the production* — AV's repeal of AO extends to
  it, scoped to it; the other three shows still carry the interpretation note
  and `beetlejuice.js` pins that. The set is the model ETC ships inside the
  *Hamilton Programming Project* (Rod Lemmond's model of David Korins' design,
  **non-commercial licence** — see `assets/README.md`).
- **What landed:** `assets/hamilton-set.glb` (65,949 tris, 5 materials, 6.8 MB),
  built by `tools/blender/hamilton_set.py` from the `Hamilton Full Set` COLLADA
  inside the show file — the theatre's proscenium, borders and floor stripped,
  walls brick, flats timber, 400k CAD triangles planar-dissolved to 66k. `p5i`
  `loadHamiltonSet` fetches it at show load and `hamApplyModel` seats it
  (metres, deck at 0, x centred, `HAM_MODEL.z` −3.91 so the model's turntable
  centre lands at **z −2.96**); the hand-built structure is now the **stand-in**
  (`SHOW.hamStand`, p5f) and leaves with its walkables and lanterns. The
  revolves moved and shrank to the real turntables, **r 3.82 / 2.59 at z −2.96**,
  measured off the model's own floor rings; `HAM_MODEL.tt` and `REV` are held
  together by a test. New cases in `tests/sets.js` (five) plus a node-side read
  of the GLB's budgets; `beetlejuice.js`'s on-disk check now also accepts
  `HAM_MODEL` and README-declared third-party files.
- **Not done, deliberately (FUTURE.md PART 2):** the model is scenery only —
  no `walk_` meshes, so the galleries and stairs are not climbable (a 66k mesh
  cannot go on `WALKABLE`; it wants low-poly walk boxes); the lanterns went
  with the stand-in; textures are generated brick/grain, not photographs; the
  rig, the cues and the Art-Net patch are untouched.
- **Finding: `main` had a red suite since #221.** `beetlejuice.js` "every
  delivered .glb is in the index …" fails on `midtown-auditorium.glb`
  (committed, fetched by no manifest) and nobody saw it because that round had
  no Node. Fixed in this branch by letting `assets/README.md` declare a
  not-yet-wired file; the lesson is in TRAPS.
- **This machine now has Node**, portable, at
  `C:\Users\jackf\AppData\Local\Temp\claude\…\scratchpad\node_dl\node-v24.21.0-win-x64`
  (session scratch — install it properly with `winget install OpenJS.NodeJS.LTS`,
  and run that yourself, see TRAPS "the sandbox"). `tests/npm install` is done.
  **Eos Nomad v3.3.10 is installed** (`C:\Program Files\ETC\EosFamily\v3\Eos`).
- **The Hamilton cue data is exported:** `C:\Users\jackf\Downloads\The Hamilton
  Programming Project - Intro - Rev A.csv` — 128 distinct cues in 13 islands,
  111 presets, 659 channels, 200,900 level rows. **It is not the whole show**
  (about a fifth of the cue stack); FUTURE.md PART 2 has the breakdown and
  what a reconstruction would mean. Nothing of it is in the repo yet.
- **Headset run still owed**, as below.

---

## NEWEST — 2026-10-10, read this before the Art-Net sections below

- **`main` moved on after the Art-Net record below was written:** #217
  (`artnet-desk-record`), #218 (`build-load-gate`), #221 (`midtown-scan`) and
  #222 (`midtown-holes`) merged; `main` is **`7d27c9d`**. The Art-Net sections
  below were not updated for #217/#218. Read those two PRs before trusting the
  Art-Net numbers below.
- **#222 was merged with only its first commit.** The markup tool and Jack's two
  applied rounds landed on the branch after the merge and never reached `main`;
  the `midtown-rounds` PR carries them. Until it merges, `main`'s GLB still has
  the speakers and the vent-recess holes.
- **New machine:** Jack's, at `C:\Users\jackf\OneDrive\Documents\gms-theater`.
  Git 2.55 and Blender 5.2 are installed. **Node is not**, so the suites cannot
  run here yet (`winget install OpenJS.NodeJS.LTS`). The relay path below
  (`C:/Users/patri/...`) is the OLD machine.
- **`midtown-scan` (#221) and `midtown-holes` (#222) are merged; `midtown-rounds`
  is the rest of the second pass** (assets and tools only, all three). Nothing in
  `src/` changed, so `the-house.html` and `docs/ARTNET.md` need no regenerating.
  - `assets/midtown-auditorium.glb` is a CC BY scan of a real auditorium, edited
    into a theatre house: a solid proscenium, a fly tower, a brick back wall and
    filled holes.
  - The second pass closed what an inside-out raycast audit found (a void east of
    the stage-right wall, slits under the wall-top fills, wing-door lintels, wall
    bases), deleted the shards the first pass missed, and matched the tiled brick
    to the real one. **Escaped rays: 4807 → 501, of which 498 go out through the
    two rear doorways Jack chose to leave open.**
  - Rebuild it with `tools/blender/midtown_theatre.py`. Walk it in
    `tools/midtown-viewer/` (re-exported). **Jack marks it up at
    https://claude.ai/artifact/LwSoKjQ911xowE1DQa4syv** (`markup.html`: delete a
    region, retexture a panel, pin a note); his edits land in that artifact's
    `edits` collection — **read it at the start of the next scan session and
    apply them in the script.** Recipe in HANDOFF. **Two rounds are already
    applied and cleared** (speakers out, piers widened, vent recesses closed),
    so the list starts empty.
  - The full record is in HANDOFF.md, the two "DONE — 2026-10-10" blocks.
- **Not wired into the game.** Three decisions are Jack's (FUTURE.md PART 2,
  "Realism"):
  1. Which venue it becomes.
  2. The fly rail for its new fly tower.
  3. Merging its 16 materials down to the 8 budget.

  The rest of the realism options list is there too, unchosen.
- **The headset run is still owed**, as below. Nothing in this session touched
  the game's rendering.

---

## (2026-08-16) ART-NET: THE ROUND IS CLOSED — RULINGS EL–FD, NOTHING OPEN

## READ THIS FIRST

The desk drives the Palace, **and the Art-Net round is finished** — #200 to
#216 with no gaps, of which #206 is an extra written mid-round. **Nothing is
open, nothing is shelved, and no branch is unlanded.** `main` is at
**`a3eecce`**, the suite count is **21**, rulings are at **FD**, and the
cache-bust is **`?v=31`** from here.

**RULING FD is the last ruling in** (#214), and it came from Jack at a desk with
the channel file open: *"make it so the list isnt generated it is just what it
is for beetlejuice and make it easier to read."* **The "not generated" half was
put back to him** — that was one instruction with two halves pulling opposite
ways, because un-generating the file removes the only reason it can be
trusted — **and he chose reformat-and-keep-generated.** So `docs/ARTNET.md` is
now a six-block patch sheet, 326 flat lines down to 219, and it is still
measured. See "HOW TO ACTUALLY RUN IT" below.

**#216 carries it into a spreadsheet.** `node tools/artnet-map.js --csv` emits
the same measurements in the three columns of his Google Sheet — `channel
number,what is does,where it is`, **header copied verbatim, typo and all,
because it is HIS sheet and a column whose name does not match will not line
up when he pastes.** `where it is` is the column the data never had, and it is
read off the built rig (`f.pos`, `f.ls`), so a lantern that is re-hung moves in
the sheet too. **It is a flag, not a third committed file** — see the open
decision at the bottom of this file.

**#213 (RULING FC, the proscenium neon) went in before it** — it was the one
branch this file previously listed as finished-but-unpushed, and the three
things it still owed are all discharged:

1. **It is merged.** Post-merge protocol run: `main` rebuilds byte-identical
   (`94084f5e`), `node tools/artnet-map.js` reproduces `docs/ARTNET.md`
   exactly, 21/21 on the merged result, branch deleted local and remote.
2. **The unreviewed post-review fixes were reviewed, and the review found a
   real hole.** The fix for the first review's finding had widened the gate
   from the portal to a `deskOwnsIt` that **also gates `HOUSE.house`** — a
   second behaviour change with **no assertion behind it**. Two assertions
   added, both on a sentinel, both negative-checked and both firing. The
   general lesson is now in TRAPS: **a fix written in response to a review is
   itself unreviewed code.**
3. **The two corrections this file owed are applied** — the Pages parenthetical
   below is rewritten, and the PR table's premature #213 self-healed on merge
   exactly as predicted.

## IT HAS NOW BEEN RUN AGAINST A REAL DESK, AND THAT IS NEW

Everything before 2026-08-16 came out of jsdom. On that evening Jack patched a
real QLC+ into the relay, and the session is worth reading for what it found:

- **The universe was the whole problem, and the default was right.** QLC+ sends
  Art-Net **universe 0**, which is what `docs/ARTNET.md` and the relay default
  say. A `--universe 1` suggestion from me broke a working setup for an hour.
- **QLC+ holds UDP 6454 itself**, on IPv6 `::`, while the relay holds IPv4
  `0.0.0.0`. With QLC+ open, packets to 127.0.0.1 still reach the relay.

  **CORRECTED 2026-08-16, off his machine, and the earlier verdict was too
  broad.** This bullet used to conclude *"no `EADDRINUSE` is ever raised — the
  relay's comment claims that refusing `reuseAddr` makes a clash loud, and it
  does not."* **The comment is right; the test was against the wrong
  opponent.** Measured on his machine, both ways:
  - **QLC+ vs the relay: genuinely no clash.** Seen with QLC+ holding **both**
    `0.0.0.0` and `::` — the relay still bound and still counted packets in.
    QLC+ sets `SO_REUSEADDR`, which on Windows lets a second socket take the
    same address, so the relay slots in beside it.
  - **Relay vs relay: a real, loud `EADDRINUSE`,** exactly as the comment
    claims. With one relay already up, a second printed
    `[artnet] UDP error: bind EADDRINUSE 0.0.0.0:6454` and died rather than
    silently splitting the packet stream. **That is the guard working.**

  So the relay's reasoning stands and this file was wrong about it for a day.
  It is the round's **second** hardware-sourced finding after RULING FB.
- **The ARTNET row cannot tell three failures apart.** A tab that is not
  rendering (the frame loop stops, so `artnetTick` never consumes what has
  arrived), a page whose socket can never reach a relay, and a desk that simply
  is not talking all read `ON — no desk yet`. That cost most of an evening, and
  it is unfixed.

  **CORRECTED 2026-08-16 — and the correction is the whole point of the
  bullet.** An earlier draft of this line said `file://` and Pages both make
  `artUrl` return null. **They do not, and they are two different failures with
  two different console signatures**, which matters enormously when the row
  says the same thing for both. `artUrl` (`p6d:172`) returns null **only when
  there is no host at all** — that is `file://`, where `artOpen` is a genuinely
  silent no-op and the console stays clean. **From Pages there IS a host**, so
  it returns `wss://jackscreations21.github.io/artnet`, a socket really is
  constructed, and it **fails to connect** — a visible WebSocket error, just
  not one that says anything about Art-Net. Telling a tester "it will fail
  silently" when their console is showing them an error is how an evening goes.
- **A REAL DESK IDLES AT ~1.8s BETWEEN PACKETS**, not at Art-Net's nominal
  44Hz — which is what RULING FB is, and it is the first number in this whole
  round that came off hardware rather than out of reasoning.

**Everything else below is still jsdom**, and no part of this round has been
in the headset.

| PR | Ruling | What |
|---|---|---|
| **#200** | **EL** | `tools/artnet-relay.js` — zero-dep Art-Net→WebSocket relay, and the 21st suite |
| **#201** | **EM state, EN, EU, EV** | `src/p6d.txt` — the socket, the reconnect off frame `dt`, `artnetTick` |
| **#202** | **EP, EN, EO** | the lights are raw writes; the Palace only; the channel bases |
| **#203** | **EM gates, EV, EW** | the board yields; the ARTNET row on both surfaces |
| **#204** | **EQ** | the flys, through their own motor |
| **#205** | **ER, ES** | the Beetlejuice house selector and the sign |
| **#206** | — | the mid-round record, written when the chain paused at six |
| **#207** | **ET, EX** | the set movers — parked unless driven |
| **#208** | **EO** | `tools/artnet-map.js` and the generated `docs/ARTNET.md` |
| **#209** | **EY** | the record: the QLC+ recipe, the rulings, the one bug left standing |
| **#210** | **EZ** | the sign is a fly — target and speed, and it retires EY’s sign half |
| **#211** | **FA** | `docs/ARTNET.md` becomes a flat list, one line per channel |
| **#212** | **FB** | `ART_STALE` 2s → 5s, measured against his real QLC+ desk |
| **#213** | **FC** | the proscenium neon: intensity and RGB, written raw — channels **311..314**, movers to **315** |
| **#214** | **FD** | `docs/ARTNET.md` becomes a grouped patch sheet — supersedes FA, still generated |
| **#215** | — | the record for FC and FD |
| **#216** | — | `tools/artnet-map.js --csv`, the same measurements in his spreadsheet columns |

Every merge verified: `main` rebuilds **byte-identical**, 21/21 suites on the
merged result, branches deleted local and remote. Two-stage review on every
PR — and on #207 that review was the first the mover code had ever had, and on
**#213 a THIRD pass** was needed, because the fixes closing out review two had
never been read by anybody.

## THE REST OF WHAT IS LEFT, in the order it will bite

**None of it is a branch, and none of it is mine to finish** — the first is
hardware, the rest want a ruling.

1. **A HEADSET RUN, now three rounds owed.** `?v=29` never happened, DR–DY has
   never been seen, and no part of the Art-Net round has been in the headset
   either. **All of the desk work is desktop-only.** Read all four wrist lines
   (`avg`, `pk`, `fov`, `calls · tri`) at the four moments: empty Palace,
   Beetlejuice pre-show, the 1:00 cue with eight blinders, and — new for this
   round — **at the proscenium looking up into the neon, with a desk driving
   311..314**. Prediction on record: **~590 calls empty at the boot view**; if
   it reads ~700 the build is stale.
2. **RULING EY, ruled and not built** — a dead universe still redresses the
   house on its first frame, channel 307. Jack ruled the fix and ruled that it
   waits. FUTURE.md PART 1a item 4.
3. **`ART_PROVE` and the relay's sequence guard** — both sized off Art-Net's
   nominal 44Hz, both disproved by the same measurement that produced FB.
   FUTURE.md PART 1a item 5. Neither is urgent; both are wrong.
4. **The ARTNET row cannot tell three failures apart** (above). It cost most of
   an evening and nothing has been done about it. **No ruling yet, and this is
   the one most likely to cost another evening.**
5. **Three spellings of "a desk is driving THIS rig", two disagreeing** —
   latent only, because `STAGE` is always defined. New this session, from the
   #213 review. FUTURE.md PART 1a item 7.
6. **The `tests/smoke.js` flake**, ~1 run in 12. FUTURE.md PART 1a item 6.
   **It fired once in this session** — a full `npm test` came back
   `20/21 FAILED: smoke`, and `smoke` alone then passed three times running and
   the next full run was 21/21. That is the documented flake behaving exactly
   as documented, and it is the first sighting recorded with a re-run count
   attached: **a lone red `smoke` after an unrelated change is this, and one
   re-run settles it.**

## THE ONE THING LEFT, AND IT IS RULED BUT NOT BUILT (and it is smaller than it was)

**RULING EY — a dead universe still redresses the HOUSE.** Jack ruled the fix
and ruled that it waits: *"Don't fix it — just record it."* The work is
**PART 1a item 4 of FUTURE.md**.

**THE SIGN HALF IS FIXED.** As first written EY was mostly about the sign,
which a dead universe hauled 11.36m to the deck in full view. **RULING EZ
retired that** by taking the sign off a band and onto its own target/speed
pair — a zero speed byte parks it. What is left is channel 307 alone.

`artBands` writes channel 307 on a band CHANGE only and `ART.houseBand` starts
at **-1**. A change from -1 is a change — so the FIRST frame of an unpatched
universe reads band 0 and redresses whichever house is standing back to the
Maitlands. A dress swap rather than a move, and band 0 is also the load
default, so usually a no-op — but "usually" is doing real work there.

**The third time the same collision was found in one round.** EQ gave the flys
a speed byte; 309 was parked by its own lineset's speed byte after an unpatched
desk ran the house curtain shut in front of the audience; EX made byte 0 "no
command" on the set movers. The bands were the only ones left, and they were
left because nobody had measured them.

**IT WAS HIDDEN BY CASE ORDERING**, and that is the finding worth keeping even
though the case that carried it is gone. The round's safety case for the sign
called `deskOn()` — which delivers a frame, which established band 0 — BEFORE
it put the sign on its stop, so its 120 measured frames were a no-change band
and it passed. The assertion written to prove the sign safe was the thing
concealing the hole. **That reproduction no longer fires**, because EZ took
the sign off the band; the lesson is in TRAPS, and 307 has no equivalent case
to reorder.

## HOW TO ACTUALLY RUN IT

```sh
node C:/Users/patri/Documents/theater_game/tools/artnet-relay.js
```

**THE ABSOLUTE PATH IS DELIBERATE AND IT COST HIM A ROUND.** `node
tools/artnet-relay.js` is what this file used to say, and run from anywhere but
the repo root it fails with `Cannot find module`. The relay resolves the
directory it SERVES from the script’s own location, so an absolute path is
safe from any working directory — there is no reason to make anyone `cd`
first.

**AND IT HAS TO BE RUNNING EVERY TIME.** It is a plain Node process, not a
service: close the window and `localhost:8080` stops answering, which presents
as `ERR_CONNECTION_REFUSED` and reads like the game is broken. Both of this
session’s “it isn’t coming up” reports were this.

Then open `http://localhost:8080/the-house.html`, LIGHTING page, throw ARTNET.
QLC+ outputs Art-Net to **127.0.0.1, universe 0**. **Patch off
`docs/ARTNET.md`** — it is generated from the build and the suite fails if it
drifts. VR-SETUP.md §8 is the full recipe.

**RULING FD made that file a PATCH SHEET** (#214): six blocks — LANTERNS 1-273,
FLY RAIL 274-301, HOUSE CIRCUITS 302-306, BEETLEJUICE dressing/sign/traveler
307-310, PROSCENIUM NEON 311-314, SET MOVERS 315-326 — each heading carrying
its own channel range, the 39 lanterns collapsed to one 7-channel pattern plus
a roster of base channels. **It is still generated and still measured**, and
there are now three guards on it: the probe refuses to emit a sheet whose
blocks do not tile the whole range, and the suite re-checks that tiling from
the committed file so the guarantee survives somebody deleting the probe's own
check.

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

## STILL HIS TO DECIDE — three, and one to know about

(1, 2 and 3 want an answer. 4 does not — it is here because it will otherwise
be found at a desk.)

1. **Should the CSV be COMMITTED and guarded, or stay an on-demand flag?**
   Asked at the end of the desk session and **not answered.** Today it is a
   flag: `--csv` emits it, nothing is checked in, and **nothing warns when the
   sheet he has pasted goes stale.** `docs/ARTNET.md` has a suite case that
   fails the moment it drifts from the build; the CSV has no such guard, so his
   tripwire is indirect — a red ARTNET.md case means the patch moved and the
   sheet needs regenerating too, but only if somebody runs the suite. **The
   argument against committing it** is that this repo already carries two
   generated files that must be regenerated with every `src/` change, and a
   third is a third thing to forget. **The argument for** is that a spreadsheet
   he has actually pasted into a shared sheet is the copy most likely to be
   consulted and least likely to be regenerated. One small PR either way.
2. **Audio from QLC+ — asked and unanswered, twice now.** Art-Net carries DMX
   only. A QLC+ audio function plays on the PC's own sound card, outside the
   game entirely. The offer on the table: a **4-channel sound block** (track
   select, play/stop, master volume, seek) so a desk cue fires the game's OWN
   recordings in sync with its transport — the machinery already exists from
   RULING BO. One PR. Or volume only (1 channel). Or leave it out.
3. **Channel 317 is one-way and nothing can be done about it without a
   ruling.** (It was 312 when first written — RULINGS EZ and FC have each
   renumbered the mover block since. **Patch off `docs/ARTNET.md`, which is
   generated and cannot drift; never off this file, which just proved it
   can.**) The Maitlands exterior is a whole-group travel with `home` 0 and
   no `out`, so every byte from 1 to 255 commands it HOME and no byte sends it
   back out — and it hangs a 12.6m drop dead centre of a 15m opening. Widening
   it means consulting `sc.parkMv`, which the plan's correction #2 forbids.
   `docs/ARTNET.md` prints it rather than hiding it.
4. **Channel 310's traveler moves with the production — nothing to rule on,
   but worth knowing before you patch it.** RULING EO always said "the first
   lineset whose hung goods declare `traveler:true`, and the map probe prints
   which line that is", and was right; the loose sentences were `p6d`'s comment
   and this file's, and both are corrected. On the Palace standing hang it is
   line 2, the house curtain. **With Beetlejuice loaded it is line 1**,
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
