# Common notes for every agent on the video capture (2026-10-14, second session)

- **Where:** the git worktree `C:\Users\jackf\OneDrive\Documents\gms-theater\.claude\worktrees\agent-a00f4ef392ac2906d`,
  branch `actors`. Run every command from that directory. Do not `cd` to the main checkout. Do not touch git at all
  (no commit, no stash, no checkout, no branch): the spawning session commits.
- **Python:** `P=tools/vision/.venv/Scripts/python` (3.13, with torch/ultralytics/opencv/numpy/scipy). Run scripts as
  `$P -I <script>`. The system `python` is 3.15 and has no torch.
- **Other agents work in the same worktree at the same time.** Touch only the files your brief names. Never edit a
  file another agent owns. Never delete anything under `tools/vision/cache/`.
- **The manual** is `docs/guide/VISION.md` (how every stage works, the formats, what is left). The binding rulings are
  `docs/superpowers/specs/2026-10-13-video-blocking-capture-design.md` (FX-GE). Read what your brief points you to.
- **Frames:** set-local metres, the frame of `assets/hamilton-set.glb`: upstage -z, the house +z, deck y 0.045 (the
  blocking writes deck as y 0 / absent), galleries y 2.743, **stage left = +x = the RIGHT of a house camera's frame**.
  Pixels in every cache file are in the 1280x720 cache frame.
- **Windows file traps:** Python's `open(p, 'w')` writes CRLF; write any committed file with `newline='\n'`, and read
  files with `encoding='utf-8'`. Do not use heredocs with backslashes through Bash (they get stripped); write files
  with the Write/Edit tools.
- **Report back short**, as your brief says. The spawning session cannot see your tool calls, only your final report.
