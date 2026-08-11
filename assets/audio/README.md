# assets/audio/

The show's three recorded tracks live here, and **they are committed**
(RULING BI, which amends BA) — see
[../../docs/AUDIO.md](../../docs/AUDIO.md), which holds the File-column
contract, the offsets, the split commands and the whole reasoning.

| File | Offset | What |
|---|---|---|
| `preshow.mp3` | 0 | the pre-show music, and the interval |
| `act1.m4a` | 0 | act one — 0:35 to the act break |
| `act2.m4a` | 4292 | act two — from 1:11:32 |

**Offset is where that file begins in his whole recording.** It is what lets
the show be two files without a single timestamp in the plot changing.

Nothing else belongs in this directory: `.gitignore` names these three and
ignores the rest, so a stray file is still an accident rather than a delivery.

With the media absent the game runs **silent and complete** — that is still a
designed state, not a fault, and every test suite in this repo runs in it
because jsdom never fetches media at all.
