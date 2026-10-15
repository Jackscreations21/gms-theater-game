# video/ — Jack's footage (never committed)

The clips live here, one file per YouTube video, downloaded by Jack (JDownloader or yt-dlp). Git ignores
everything in this folder except `INDEX.json` and this file (RULING FX in
`docs/superpowers/specs/2026-10-13-video-blocking-capture-design.md`).

**Name a file `<track-id>-<slug>.mp4`**, e.g. `1-03-my-shot.mp4`, `2-22-the-world-was-wide-enough.mp4`. A clip that
covers several tracks is named by the first and lists the rest in `INDEX.json`. Any extension ffmpeg can read is
fine (mp4, mkv, webm). A yt-dlp `--write-info-json` sidecar (`<same stem>.info.json`) is read for the URL, title
and uploader; otherwise fill those fields in `INDEX.json` by hand.

```sh
python tools/vision/run.py index     # scan this folder, (re)write INDEX.json, say which files it could not place
```

`INDEX.json` records per file: url, title, uploader, duration, width, height, fps, sha256, tracks. The derived
data (`tools/vision/out/`, `calib/`, `labels/`, `diffs/`) names the clip it came from by this file name.
