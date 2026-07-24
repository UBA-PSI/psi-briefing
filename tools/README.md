# browserslides tools

Two small, dependency-free helper scripts (Node.js 18+, ESM, built-ins only)
for turning a *linked* browserslides deck into one self-contained `.html` file
you can email, drop on a USB stick, or open offline.

The development decks in `examples/` deliberately **link** to their assets:

```html
<link rel="stylesheet" href="../framework/browserslides.css">
<link rel="stylesheet" href="../themes/bamberg.css">
<script src="../framework/browserslides.js"></script>
```

That is convenient while you edit, but it needs a folder of files and a server.
For distribution the author wants a single file with CSS, JS, fonts and images
all embedded. These tools do that.

## Recommended workflow

1. **Develop** with linked files in `examples/` (edit CSS/JS/theme freely).
2. *(optional)* **Embed fonts**: run `embed-fonts.mjs` and paste its output into
   your theme (or a `<style>` block) so the fonts travel with the deck.
3. **Inline everything**: run `inline-deck.mjs` to fold every local
   stylesheet, script and image into one self-contained HTML file.

```
examples/my-deck.html  +  linked css/js/fonts/images
        │
        ├─ embed-fonts.mjs   (fonts -> @font-face base64, pasted into a theme)
        │
        └─ inline-deck.mjs   -> my-deck.inlined.html   (one distributable file)
```

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

Because the browserslides framework CSS/JS is already dependency-free, an
inlined example deck is a genuinely standalone file: no server, no build, works
from `file://` and offline.
