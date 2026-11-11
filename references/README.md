# references/

Drop reference material here and it stays out of version control (see
`.gitignore`): MP4 reference films, screenshots, storyboards, brand sheets,
typography specimens, motion studies, UI mock-ups.

Nothing in this directory is read automatically. It is a place to put the
material a human or an agent studies before authoring a storyboard, and the
analysis belongs in `docs/REFERENCE_ANALYSIS.md`.

**Do not commit third-party creative work.** Reference films and brand assets
belong to whoever made them. Extract the technique, not the asset.

Useful commands when a reference film is present:

```bash
# Every frame of a 4-second section, for measuring a motion grammar.
ffmpeg -ss 00:00:12 -t 4 -i references/film.mp4 -vf fps=30 /tmp/ref/%04d.png

# A contact sheet of the whole film, 5 columns.
ffmpeg -i references/film.mp4 -vf "fps=1/2,scale=480:-1,tile=5x8" /tmp/ref-sheet.png

# Shot boundaries, to measure cut rhythm.
ffmpeg -i references/film.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep pts_time
```
