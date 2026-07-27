# Changelog

Notable changes to psi-briefing, newest first. The shape of this file follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the version numbers
follow [semantic versioning](https://semver.org/spec/v2.0.0.html).

## 1.1.0 – 2026-07-27

### Changed

- **The build pipeline runs on Node alone.** `tools/build-deck.mjs` is the new
  entry point and works identically on Windows, macOS and Linux.
  `tools/build-deck.sh` still exists and still behaves exactly as before: it is
  now a wrapper around the `.mjs`, with the same options, output and exit codes,
  so every existing invocation in CI, in `package.json` and in the docs keeps
  working. The reason for the move is that Windows has no shell for the wrapper,
  and the whole pipeline was already Node apart from its orchestration.

### Added

- **A setup walkthrough on the landing page** for readers who have never
  installed Node or opened a terminal, covering Windows and macOS from an empty
  machine to a built copy of the example deck. It starts from the release ZIP
  rather than from `git clone`, so no Git and no GitHub account is needed.

## 1.0.0 – 2026-07-26

First release under the name `psi-briefing`. The project was developed under the
working name `browserslides` and this is the same thing renamed, so if you have
seen it before: the JavaScript global is now `window.Briefing`, the CSS utility
prefix is `bf-`, and the framework files are `framework/briefing.css` and
`framework/briefing.js`.

### The framework

- A deck is a 16:9 layout in **one self-contained HTML file** – no build step, no
  server, no fonts to install. That constraint is the point rather than a
  limitation: a file you can email is a file that still opens in five years.
- **Container-query scaling.** Every slide is a `container-type: size` box and
  everything inside it is measured in `cqw`/`cqh`, never in `px` or `rem`, so a
  deck holds its proportions on a laptop, a 4K projector and a phone in
  landscape alike.
- **Semantic design tokens.** Colours and fonts are custom properties with names
  like `--accent`, `--ink` and `--font-display`. A theme is a `:root { … }` block
  that overrides them, which is why re-skinning a deck – including the generated
  SVG charts, which read the tokens when they draw – is a one-file change. Two
  themes ship: `bamberg` and `midnight`.
- 33 layout components, each catalogued with copy-paste markup in
  [`docs/cookbook.md`](docs/cookbook.md): title slides, section dividers,
  timelines, fact grids, bar charts, galleries, flow steps, editorial layouts,
  pipelines, before/after pairs.
- A small runtime with **no dependencies** – navigation, page numbers, SVG bar
  charts, cross-reference hover previews, lightboxes, image stacks and reveals.
  It reads declarative markup and generates the chrome; there is nothing to
  install and nothing to keep up to date.
- **Reveals.** A clickable strip at the foot of a slide opens a full-slide panel
  that sits outside the scroll path, for the detail a reader may want and the
  rest will not. A reveal is laid out by the same planner as a slide, so it gets
  headings, columns and a closing band rather than flat paragraphs, and the
  audit measures it with the panel open – `display: none` has no geometry, so an
  overfull reveal is otherwise invisible until it is clicked in front of an
  audience.
- **Optional hyphenation**, off by default: `.bf-hyphens` on `<body>` or on a
  single slide, or `hyphenate: true` in the Markdown frontmatter. It earns its
  place in narrow German columns, where one long compound leaves a hole no
  line-breaking algorithm can close; on a 23-slide German deck the three worst
  ragged lines went from 77/75/67 % of the column width to 71/59/56 %. Narrow
  cells that would suffer from it opt themselves back out.
- **`.cols--figure`** widens the gutter to 6.4cqw for a row where a figure faces
  text. The 4.8cqw default is calibrated for two ragged text edges; a photograph
  or a bordered call-out puts a hard vertical rule down one side of the gutter,
  and without the extra room the last words of every line read as touching it.

### Writing a deck as Markdown

- [`tools/md-to-deck.mjs`](tools/md-to-deck.mjs) turns a Markdown document into
  a deck, choosing each component from the **shape** of the content: three
  equal-ranked `###` blocks become three columns, four become a bordered grid, a
  blockquote becomes the closing band, an ordered list with bold leads becomes
  numbered steps.
- The inference runs before anything is rendered, and that ordering is the
  design. [`docs/handoff-autolayout.md`](docs/handoff-autolayout.md) records what
  happened when layout was instead driven by measuring rendered slides: the
  cheapest way to raise a fill score is to stretch containers, which lifted
  median fill from 74 % to 96 % and made the deck visibly worse. Reading
  structure needs no score. The converter rearranges and splits; it never pads,
  and a thin slide with nothing to rearrange is reported rather than filled.
- Output is ordinary psi-briefing HTML, readable and safe to hand-tune, so the
  converter is a starting point and not a lock-in.
- Section numbering and the title slide's table of contents are derived from the
  `#` headings, so they cannot drift apart, and German typographic marks are
  normalised at build time instead of by grep.
- Authoring reference: [`docs/markdown.md`](docs/markdown.md).

### Getting to one file

- [`tools/build-deck.sh`](tools/build-deck.sh) runs the release pipeline:
  optimise images, inline everything, then **verify that nothing external is
  left**. The third step is why this is a script and not a paragraph of advice –
  the inliner leaves remote URLs alone by design, so a deck can come out looking
  finished and still need the network. Exit 2 names the offending references.
- [`tools/optimise-images.mjs`](tools/optimise-images.mjs) re-encodes
  photographs to WebP at the width the slides actually use, which took a real
  20-image deck from 8.3 MB to 3.3 MB. It keeps the original when the WebP comes
  out larger, as it routinely does for a flat-colour screenshot.
- [`tools/inline-deck.mjs`](tools/inline-deck.mjs) folds CSS, JS and images into
  the HTML; [`tools/embed-fonts.mjs`](tools/embed-fonts.mjs) prints `@font-face`
  rules with the font bytes base64-encoded, so a themed deck renders identically
  on a machine that does not have the fonts.
- [`tools/sync-assets.sh`](tools/sync-assets.sh) keeps the duplicated copies of
  the framework and the component catalog in step, and with `--check` reports
  drift without touching anything. The failure it prevents is a bad one to
  debug: you change the CSS, open a deck, see the old behaviour, and start
  looking for the bug in your change.
- The tools are ESM and use only Node built-ins, so there is nothing to install
  before running them. The single exception is the WebP encode step, which shells
  out to `cwebp` or `magick` and is skipped with a warning when neither is
  present.

### Building decks with Claude Code

- [`skills/briefing/`](skills/briefing/) is a Claude Code skill: the component
  catalog, the starter markup, and an audit that opens a deck in a browser and
  measures it – overflow, overlapping boxes, clipped and wrapped labels, dead
  space under a closing band, and text that has stopped scaling with the frame.
  Each check was calibrated against decks with the fault present and absent
  before it shipped, because the first version of a detector reports false
  positives rather than faults.

### Documentation written for assistants

- The [component catalog](docs/cookbook.md) and the [Claude Code
  skill](skills/briefing/) are aimed at a language model as much as at a person.
  They are long, repetitive and exhaustive on purpose: an assistant choosing
  between components needs each one spelled out with its markup and the case it
  is for, where a human reader would skim.
- Neither is required. The output is plain HTML with named class names and the
  input is Markdown, so pointing an assistant at
  [`examples/example-deck.md`](examples/example-deck.md),
  [`examples/tutorial.md`](examples/tutorial.md) and the decks they build is
  usually enough for it to infer the format. The decks are the specification; the
  catalog and the skill only save it the guessing.
