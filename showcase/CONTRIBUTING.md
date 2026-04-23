# Contributing to the showcase

The `showcase/` directory holds real decks built with this skill. PRs welcome.

## What goes here

- A short markdown file (`<your-deck>.md`) — the source you actually used
- The build artifact (`<your-deck>.html`) — the single self-contained file the build produced
- One screenshot of the first slide (`<your-deck>.png`, 1920×1080) for the README gallery

Optional but encouraged:

- A `brand.md` sidecar in the same folder, if your deck overrides the ODS look
- A short paragraph at the top of the markdown file explaining when this deck was used

## What does NOT go here

- Anything containing customer names, internal financials, or roadmaps you don't want public — you are responsible for the contents
- Decks with raw API keys / secrets in the markdown
- Multi-megabyte image assets that aren't already inlined into the HTML

## Submitting

1. Fork → create a folder under `showcase/<your-deck-slug>/`
2. Add the three files above
3. Open a PR with title: `showcase: <your-deck-slug>`
4. The maintainer reviews for fit (Orangeimpact tone, anti-slop compliance) and merges

## Inspirational examples

While the gallery fills up, see [`examples/all-layouts.md`](../examples/all-layouts.md) and the [remix recipes](../examples/remix/) for what a finished deck looks like.
