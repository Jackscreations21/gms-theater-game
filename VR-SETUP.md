# Running THE HOUSE on a Quest 3

How to get the game into the headset, what the controls are once you are
standing in it, and what to check on the first run. Written for a Meta
Quest 3; any WebXR headset with two sticks should behave the same.

---

## 1. What you need

- A Quest 3 (charged, on the same planet — no cable, no PC link, no app
  store; the game runs in the headset's own browser).
- The game served over **HTTPS**. WebXR flatly refuses `file://` and plain
  `http://` on a LAN IP. Two routes below — use Route A unless the repo has
  gone private.

## 2. Route A — GitHub Pages (the normal way)

Pages is enabled and serving from `main`. In the headset:

1. Press the Meta button, open **Browser** (the built-in Meta Quest
   Browser — it is Chromium and speaks WebXR).
2. Go to:

   ```
   https://jackscreations21.github.io/gms-theater-game/the-house.html
   ```

   (Once PR #8 is merged, the shorter
   `https://jackscreations21.github.io/gms-theater-game/` redirects there.)
3. Wait for the theatre front page, click **ENTER THE THEATRE**.
4. See §4.

Pages serves whatever is on `main`, so a merged PR is live within a minute
or two. The headset browser caches hard — if you just merged something and
the game looks stale, open the ⋯ menu → Settings → clear browsing data, or
add `?v=2` to the URL.

## 3. Route B — `adb reverse` (repo private, or no internet)

`localhost` is a secure context, so WebXR runs without any certificate
dance. A LAN IP will **not** work — it must literally be `localhost`.

1. Enable Developer Mode on the Quest (Meta Horizon phone app → the
   headset → Settings → Developer Mode) and install
   [android platform-tools](https://developer.android.com/tools/releases/platform-tools)
   on the PC.
2. Serve the repo folder on the PC:

   ```sh
   python -m http.server 8080
   ```

   (or `npx serve -l 8080`, or anything else that serves static files).
3. Plug the headset into the PC over USB, allow the connection in the
   headset when it asks, then:

   ```sh
   adb reverse tcp:8080 tcp:8080
   ```

   This makes the *headset's* `localhost:8080` reach the *PC's* port 8080.
4. In the Quest Browser open:

   ```
   http://localhost:8080/the-house.html
   ```

The reverse survives until the cable is pulled or the headset sleeps;
re-run the `adb reverse` line if the page stops loading.

## 4. Entering VR

- The game boots to the normal desktop view inside the browser window.
- Look at the top HUD bar. If the headset's WebXR is alive there is a green
  **ENTER VR** chip next to the FPS counter. Click it (with the controller
  pointer, like any web page).
  - **No green chip?** The page thinks there is no XR. Almost always this
    means the page was not served over HTTPS/localhost — check the URL bar.
- The browser will ask permission to enter immersive mode — allow it.
- You should land on the orchestra floor of the Palace at standing height.
  The session automatically drops shadows, caps the light beams at the
  nearest 14, and shortens the draw distance — a toast says
  `VR: shadows off, beams capped, 90Hz`. The desktop page is untouched;
  taking the headset off ends the session and puts everything back.
- If instead a toast says `VR would not start: …`, write down the exact
  message — that promise chain has never run on real hardware and the
  message is the diagnosis.

## 5. Controls

| Input | Does |
|---|---|
| **Left stick** | walk, head-relative (forward is where you look) |
| **Right stick ←/→** | smooth turn |
| **Right trigger** | click whatever the pointer ray touches on a console desk |
| **Grip (either hand)** | grab a rope — anywhere along it — or a lock's red handle; release to let go |
| **Reach out and touch the GO button** | fires the next cue (it physically depresses) |

- **Consoles.** Five physical desks: on the Palace balcony rail, and a tech
  table plus a control room desk in each of the two Arc houses. Walk up to
  one and point at it — a cursor dot lands where the ray hits, within about
  6 m. The pointing ray comes from one specific controller (the second one
  the browser reports, normally the **right** hand) — if no cursor appears,
  try the other hand before assuming it is broken. Trigger clicks whatever
  the cursor is on: cue list, faders, page tabs.
- **Ropes.** At the Palace locking rail (stage right), close a grip on a
  rope — **anywhere** along either run, deck to grid — to seize it; a toast
  names the lineset. Pull **down** on the front run and the batten comes
  **in**, like a real counterweight line; the back run is the other half of
  the loop and works in reverse. A locked lineset will not move.
- **Rope locks.** Every line has a red handle on the rail in front of it,
  over its number plate. Grab the handle and **push it in** (upright) to
  lock the line off; **pull it out** (toward you) to release it. The handle
  only moves when a closed hand moves it. Release a line with nothing
  holding it — no lock, no hand — and it runs away to the deck.
- **GO.** Each console has a raised button; put a hand on it. It has a
  cooldown so a lingering hand fires one cue, not ten.
- Crossing town works the same as on desktop — walk out through the foyer;
  the board follows you into whichever theatre you enter.

## 6. First-run checklist (in this order)

This is the first time the VR code will have met real hardware — the test
suite drives a stubbed WebXR and structurally *cannot* test these four
things (AUDIT.md, "What the tests don't cover"). Record what happens in
HANDOFF.md, even — especially — the failures.

1. **Does a session start at all?** Green chip appears → click → you are
   standing in the Palace. If not, the toast message is the bug report.
2. **Frame rate.** Target is 90 Hz. Judge it standing centre stage with a
   show loaded and lights up — that is the worst case (additive beams in
   haze are overdraw, the thing a mobile GPU hates most). If it chugs, the
   knobs in order: lower `VR.beamCap` (14), thin `LIGHT_POOL`, cut
   `SMOKE.n`, set RENDER to *low* in the LIGHTS tab before entering.
3. **Pointing.** Point at a desk: does the cursor dot land *where you
   point*, and does the trigger press the thing under it? The tests bypass
   this path entirely — a UV flip here passes every suite while every
   console in the headset is dead.
4. **Human factors.** Is the console text readable at arm's length? Can
   you actually reach the ropes and the GO button? Is smooth turn
   comfortable, or does it want snap turn? Expect a tuning pass, not a
   rewrite.

## 7. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| No ENTER VR chip | Not HTTPS/localhost, or the browser has no WebXR — check the URL scheme first |
| Chip clicked, nothing happens | Read the toast: `VR would not start: <message>` is the diagnosis |
| Stale/old version of the game | Quest Browser cache — clear site data or bust with `?v=2` |
| Blank page over `adb reverse` | Reverse dropped (cable/sleep) — re-run `adb reverse tcp:8080 tcp:8080` |
| Judder / low FPS | Work the knob list in §6.2, starting with `VR.beamCap` |
| Cursor lands nowhere / consoles dead | Try the other hand's trigger; if still dead, that is checklist item 3 failing — report it |
| Held rope does nothing | Lineset locked (pull its red handle out first), or you grabbed air — get within ~30 cm of the rope and re-grip |
