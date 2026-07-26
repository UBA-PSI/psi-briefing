# psi-briefing tools

Small, dependency-free scripts (Node.js 18+, ESM, built-ins only — the one
exception is the WebP encode step, which shells out to `cwebp` or `magick`).

| Tool | What it is for |
| --- | --- |
| [`md-to-deck.mjs`](#md-to-deckmjs) | write a deck as Markdown; it infers the components |
| [`build-deck.sh`](#build-decksh) | the release pipeline: optimise → inline → verify |
| [`optimise-images.mjs`](#optimise-imagesmjs) | re-encode photographs to WebP at the size slides use |
| [`inline-deck.mjs`](#inline-deckmjs) | fold CSS, JS and images into one `.html` |
| [`embed-fonts.mjs`](#embed-fontsmjs) | fonts → base64 `@font-face` rules |
| [`sync-assets.sh`](#sync-assetssh) | keep the duplicated copies of the framework in step |

The development decks in `examples/` deliberately **link** to their assets:

```html
<link rel="stylesheet" href="../framework/briefing.css">
<link rel="stylesheet" href="../themes/bamberg.css">
<script src="../framework/briefing.js"></script>
```

That is convenient while you edit, but it needs a folder of files and a server.
For distribution you want a single file with CSS, JS, fonts and images all
embedded. These tools do that.

## Recommended workflow

1. **Write** the deck — as Markdown through `md-to-deck.mjs`, or by hand from
   the catalog in `docs/cookbook.md`.
2. **Look at it** over `python3 -m http.server`, and run the audit from
   `skills/briefing/SKILL.md`.
3. *(once per theme)* **Embed fonts**: run `embed-fonts.mjs` and paste its
   output into your theme, so the fonts travel with the deck.
4. **Ship one file**: `tools/build-deck.sh deck.html`. That runs the image and
   inline steps and then *verifies* that nothing external is left — the step
   people skip, and the reason this is a script and not a note in a README.

```
deck.md ── md-to-deck.mjs ──> deck.html  +  linked css/js/fonts/images
                                  │
                                  └─ build-deck.sh
                                       ├─ optimise-images.mjs  (jpg/png -> webp)
                                       ├─ inline-deck.mjs      (everything -> data:)
                                       └─ verify               (assert nothing external)
                                             │
                                             └─> deck.self-contained.html
```

---

## `md-to-deck.mjs`

Turns a Markdown document into a deck, choosing the component from the *shape*
of the content: three equal `###` blocks become three columns, four become a
bordered grid, a blockquote becomes the closing band. See
[`docs/markdown.md`](../docs/markdown.md) for the authoring reference.

```bash
node tools/md-to-deck.mjs deck.md -o deck.html
node tools/md-to-deck.mjs deck.md --no-fix     # report problems, change nothing
node tools/md-to-deck.mjs --help
```

It prints a per-slide report: which rule fired, how full the content row is,
which corrections it applied, and which slides are thin in a way no tool can fix.

---

## `build-deck.sh`

```bash
tools/build-deck.sh deck.html
tools/build-deck.sh deck.html -o share/deck.html --max-width 2000
```

Exit `0` built and verified, `1` usage error, `2` built but still depending on
something external (it tells you what). Without a WebP encoder installed it
warns, skips that step, and still produces a valid file.

---

## `sync-assets.sh`

`framework/` and `themes/` are the originals, but two directories hold copies —
`skills/briefing/references/assets/` so the skill is self-contained, and
`test-aufsicht/assets/` so the local test decks link without a path prefix.
`docs/cookbook.md` and `skills/briefing/references/components.md` are the
same arrangement for the catalog.

```bash
tools/sync-assets.sh            # copy the originals over the copies
tools/sync-assets.sh --check    # report drift, exit 1, change nothing
```

Run it after any change to the framework CSS/JS or a theme. The failure it
prevents is a bad one to debug: you change the CSS, open a deck, see the old
behaviour, and start looking for the bug in your change.

---

## `embed-fonts.mjs`

Reads font files and prints matching `@font-face` rules with the font bytes
base64-encoded into `data:` URIs, so no external font request is ever made.
Includes `font-display: swap`.

```bash
# Guess family/weight/style from each filename:
node tools/embed-fonts.mjs Copse-Regular.ttf OpenSans-Regular.woff2 OpenSans-Bold.woff2

# Append the generated CSS straight into a theme file:
node tools/embed-fonts.mjs fonts/*.woff2 >> themes/bamberg.css

# Full control via a manifest:
node tools/embed-fonts.mjs --manifest fonts.json

# Help:
node tools/embed-fonts.mjs --help
```

Extension → `format()` mapping: `.woff2`→`woff2`, `.woff`→`woff`,
`.ttf`→`truetype`, `.otf`→`opentype`.

**Filename guessing.** `OpenSans-BoldItalic.woff2` becomes family
`Open Sans`, weight `700`, style `italic`. Recognised weight words include
thin/light/regular/medium/semibold/bold/extrabold/black (and explicit numeric
weights like `600`).

**Manifest mode.** `fonts.json` is a JSON array; only `file` is required, and
paths resolve relative to the manifest itself:

```json
[
  { "file": "Copse-Regular.ttf",   "family": "Copse",     "weight": 400 },
  { "file": "OpenSans-Regular.woff2", "family": "Open Sans", "weight": 400 },
  { "file": "OpenSans-Bold.woff2",    "family": "Open Sans", "weight": 700 },
  { "file": "OpenSans-Italic.woff2",  "family": "Open Sans", "weight": 400,
    "style": "italic", "display": "swap" }
]
```

The Bamberg theme asks for the `Copse` (display) and `Open Sans` (body) families
via `--font-display` / `--font-body`. Embedding those two families is exactly
what makes a Bamberg-themed deck render identically on a machine that does not
have the fonts installed.

Output goes to **stdout**; redirect it where you want it.

---

## `inline-deck.mjs`

Produces one self-contained HTML file from a deck that links its assets.

```bash
# Default output: examples/example-deck.inlined.html
node tools/inline-deck.mjs examples/example-deck.html

# Explicit output path:
node tools/inline-deck.mjs examples/example-deck.html -o dist/aurora.html

# Help:
node tools/inline-deck.mjs --help
```

What it inlines (all resolved **relative to the input HTML's directory**):

| Reference                                    | Becomes                          |
| -------------------------------------------- | -------------------------------- |
| `<link rel="stylesheet" href="local.css">`   | `<style>…</style>`               |
| `<script src="local.js"></script>`           | `<script>…</script>`             |
| `<img src="local.png">`                       | `<img src="data:image/png;base64,…">` |
| `url(local.png)` inside CSS                    | `url("data:image/png;base64,…")` |

Supported image types: `.png .jpg .jpeg .gif .svg .webp`.

**Left untouched:** remote URLs (`http://`, `https://`, `//host/…`), existing
`data:` URIs, and any local file that cannot be found — those log a warning to
stderr and the original tag is kept, so the run never fails on a missing asset.
Document order of styles and scripts is preserved. A one-line summary
(bytes in → bytes out) is printed to stderr.

Because psi-briefing's CSS and runtime are already dependency-free, an
inlined example deck is a genuinely standalone file: no server, no build, works
from `file://` and offline.

Each image is embedded once per `<img>` tag, so a photograph reused on three
slides is carried three times. If that ever matters, cut it at the source
(one gallery instead of three) rather than in the inliner.

---

## `optimise-images.mjs`

Re-encodes local `<img>` sources to WebP beside the originals and rewrites the
HTML to point at them. Originals are never modified.

```bash
node tools/optimise-images.mjs deck.html -o deck.opt.html --max-width 1600 --quality 82
node tools/optimise-images.mjs deck.html --dry-run
```

Two things it refuses to do quietly. If the `.webp` comes out **larger** than
its source — routine for a flat-colour screenshot at q82 — it deletes it and
keeps the original, because switching would make the deck heavier while
reporting an optimisation. And if two sources in the same folder would produce
the same `.webp` (`photo.png` and `photo.jpg`), the second is left alone rather
than overwriting the first.

Only `<img src>` is rewritten. A background image referenced from CSS `url()` is
still inlined by `inline-deck.mjs`, but at its original size.
