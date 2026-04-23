---
title: Terminal-Core — CLI tool launch deck
chapter: Remix Recipe · terminal-core
family: terminal-core
source: design-deck remix gallery
---

# `dd` — design-deck CLI

## Markdown in. Print-ready slides out.

A unix-style tool for engineers who prefer their decks in their editor.

---

# What it is

- A single command that turns one `.md` file into one self-contained 1920×1080 HTML
- Built-in lint, font embedding, image cache, headless PDF export
- `--verify` checks your build was actually produced correctly
- Zero JS framework runtime — the output works offline

---

```sh prompt
$ dd quarterly.md --verify --pdf
✓ lint clean
✓ wrote quarterly.html (2.4 MB, 18 slides)
✓ pdf written quarterly.pdf (engine: playwright)
✓ verify passed — 18 slides, font embedded, @page set
```

---

# Why monospace?

- Engineers read code all day; a deck in their muscle-memory typeface lowers cognitive switching cost
- `tnum` (tabular figures) makes numbers and metrics legible at a glance
- The output prints cleanly on receipt-style printers and survives screenshot resizing

---

# Thank you

`dd --help` for the manual. Pull requests welcome.
