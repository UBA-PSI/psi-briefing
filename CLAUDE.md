# CLAUDE.md

Guidance for Claude Code working **on this repository**. For building a deck *with*
the framework, use the skill in `skills/briefing/` instead — that is the authoring
guide, this is the maintenance one.

## Read these first, not this file

This file deliberately stays short. Everything real lives elsewhere:

| Question | File |
|---|---|
| What are the conventions, and what will trip me up? | `CONTRIBUTING.md` |
| How do I cut a release, and what does this failing guard mean? | `RELEASING.md` |
| Why is it built this way? | `docs/handoff-autolayout.md` |
| Which component do I use, and what is its markup? | `docs/cookbook.md` |
| What does the Markdown converter do with X? | `docs/markdown.md` |

`docs/handoff-autolayout.md` is the one to read before arguing with a design
decision. It carries the measurements behind them, including the cases where the
obvious fix was tried and was wrong.

## Traps that have actually caught someone here

Each of these cost real time at least once. They are listed because none of them
is visible from the code you are about to change.

- **`docs/cookbook.md` is duplicated byte-identically** as
  `skills/briefing/references/components.md`, so the skill is self-contained.
  A relative link that is correct in one is dead in the other: links in that file
  must be absolute repository URLs. Four framework and theme files are mirrored the
  same way. After touching any of them run `tools/sync-assets.sh`; CI fails on
  drift.
- **Never take a browser DOM dump as a working copy.** `briefing.js` generates
  charts, page numbers and nav dots at runtime and is not idempotent, so a saved
  DOM re-runs the generation on top of the baked-in result. Same rule as the deck
  this framework came from.
- **The built decks are build products.** `examples/example-deck-md.html` and
  `examples/tutorial.html` are gitignored and rebuilt by CI. Edit the `.md`.
  `examples/example-deck.html` is the exception: hand-maintained source.
- **`docs/site/index.html` has no JavaScript and makes zero network requests.**
  That is the page's whole argument, and it is asserted on the live site. Inline
  any asset as a `data:` URI; if something seems to need a script, check whether a
  native control does it (the contents menu is a `<details>`, the lightbox is
  `:target`).
- **Measure in a browser rather than reason about the CSS.** Layout claims in this
  repo are expected to come with numbers. `chrome-headless-shell` driven directly
  works; MCP screenshots do not persist in this environment.
- **Calibrate a new check in both directions** before trusting it: confirm it fires
  on a case with the fault, and does not fire on a case without. Several detectors
  here were wrong on first writing, and the failure mode is a check that reports
  clean while the fault is present.

## Language

Code, comments and documentation in this repository are **English**. Commit
messages too. (Conversation with the repository owner is German.) The rules in
`CONTRIBUTING.md` under "Comments, commit messages, documentation" apply: a comment
explains the failure it prevents, not what the line does.
