# The show's sound — what is where, and why

**RULING BI, which amends RULING BA.** The game plays three recorded tracks and
**they are in the repository**. RULING BA said they never would be; the owner
overruled it after the show track was split. The reasoning on both sides is
§"Why they are committed now" below — it is kept in full, because a reversed
ruling is worth more on the record than a deleted one.

A missing track is still a **normal state**. Nothing here logs an error, the
show runs complete and silent, and every test suite in this repo runs that way
— jsdom never fetches media at all.

## The contract

The **File** column is the contract. `BJ_AUDIO` in `src/p5j.txt` is the other
half of it, and `tests/beetlejuice.js` pins the two together **in both
directions** — a name in the doc that is not in the manifest fails, and a name
in the manifest that is not in the doc fails too.

That test exists because the fallback is silent *by design*. Without it a
misnamed file would simply never play, and nothing would ever say why.

| Track | File | Offset | Loops | Clock | What it is |
|---|---|---|---|---|---|
| `preshow` | `preshow.mp3` | 0 | yes | no | the pre-show music. Plays from load until the show starts, and again all through the interval. |
| `act1` | `act1.m4a` | **0** | no | yes | act one. Started at **0:35** on the first GO, stopped by the act-break cue at **1:11:09**. |
| `act2` | `act2.m4a` | **4292** | no | yes | act two. Started at **1:11:32** on the second GO, faded out at **2:15:00**. |

**Offset is the position in his whole recording at which that file begins**,
and it is what lets the show be two files without touching one number in the
plot. **Clock** is whether a track may drive the cue stack (RULING BB): the
pre-show music never can, which is what makes it underscore.

## What the timestamps mean — unchanged

Every timestamp in the owner's four cue files — lighting and sets alike — is a
**position in his whole 2h23m recording**, not elapsed show time. The two
differ by the 35 seconds the track is already into itself when the show starts.

**Splitting the file did not change that, and that was the requirement:** *"make
sure the cues still line up."* Each half says where it begins, and the
transport does the arithmetic:

```
the cue clock  = offset + el.currentTime     a cue at 5000 fires 708s into act2
a seek to `at` = at - offset                 {play:'act2', at:4292} seeks to 0.0
```

So RULING BB is untouched: while a clock track is really playing it **is** the
cue clock, a cue fires when its `at` has gone by, nothing drifts across two and
a quarter hours, and a seek drags the lights to the music. With no audio
present the `follow` chain drives the show exactly as it always did.

## How the split was made

From the repo root, with `videoplayback.m4a` as he supplied it (139,615,893
bytes, 8626.79s). **Stream copy — no re-encode, so no generation loss:**

```sh
ffmpeg -ss 0    -t 4292 -i videoplayback.m4a -c copy assets/audio/act1.m4a
ffmpeg -ss 4292         -i videoplayback.m4a -c copy assets/audio/act2.m4a
```

**The cut point is free.** The act-break cue stops the track at **4269** and the
act-two cue resumes it at **4292**, so nothing between those two numbers is ever
heard. Cutting at 4292 puts the join inside a silence the show already had.

Verified after the fact rather than assumed:

```
act1  4292.022857s   69,413,206 bytes
act2  4334.793651s   70,104,528 bytes
      4292.023 + 4334.794 = 8626.817 against a whole of 8626.794
      -> a 23ms overlap, exactly one AAC frame, inside the unheard stretch
      -> act2 therefore begins at 4292.000000 to the sample
```

`ffmpeg` is not on a fresh shell's PATH on this machine — it is under
`AppData/Local/Microsoft/WinGet/Packages`, the same quirk `tools/video.js`
documents and works around.

## Why they are committed now

RULING BA gave **three independent reasons** the recordings could never be
committed. One is gone; the owner overruled the other two with all three in
front of him.

1. ~~**It is not possible.** `show.m4a` is 134 MB and GitHub refuses any file
   over 100 MB on push.~~ **Gone.** Split at the act break the halves are 69.4
   MB and 70.1 MB, and `preshow.mp3` is 42 MB — *"audio number one is small
   enought to fit"*. All three are under the limit. (All three are over
   GitHub's 50 MB **warning** threshold; a warning is not a refusal.)
2. **It comes off a video**, and TRAPS.md rules: *"Nothing off a video is ever
   committed — no frame, clip or audio."* **Overruled for the audio the owner
   supplied.** The rule still stands for frames and clips.
3. **It is a commercial recording** and GitHub Pages is enabled on this repo.
   **The owner's call**, made knowing that git history is permanent — the
   ~180 MB is in every clone from here on even if the files are later removed —
   and that Pages serves them from a public URL.

**`.gitattributes` names these extensions binary**, and that is load-bearing
rather than tidy: the repo pins `* text=auto eol=lf` because `build.sh` breaks
under CRLF, and `text=auto` decides by content heuristic. A media file that lost
that coin toss would be rewritten on checkout, and nothing in this repo can
hear.

## Hosting them somewhere else instead

Still supported, and unchanged. A manifest entry may be an **absolute URL**
instead of a filename:

```js
act2: {file:'https://example.com/private/act2.m4a', offset:4292, clock:true, …}
```

One line, no code change.
