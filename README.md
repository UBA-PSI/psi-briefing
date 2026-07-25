# browserslides

**Dependency-free presentation decks that live in a single, self-contained HTML file and scale pixel-perfectly to any screen.**

No framework, no build step, no server, no fonts to install. One `.html` file you open in a browser – on a 13″ laptop, a 4K projector, or a phone in landscape – and it looks identical everywhere.

*Made by [Dominik Herrmann](https://github.com/) · [MIT-licensed](LICENSE) · [Deutsche Kurzfassung unten ↓](#deutsch)*

![Example: title slide and a generated chart in the Bamberg theme](docs/preview.png)

---

## Why it looks the way it does

Two ideas do all the work:

1. **Container-query scaling.** Every slide is a `16:9` box with `container-type:size`. Everything inside it – text, spacing, charts, everything – is measured in container-query units (`cqw` = 1 % of slide width, `cqh` = 1 % of slide height), never in `px` or `rem`. So the whole layout scales *proportionally* with the slide. The alignment isn't pixel-*fixed*; it's proportion-perfect, which is what makes it hold together on any display.

2. **Semantic design tokens.** Every colour and font is a CSS custom property with a semantic name (`--accent`, `--ink`, `--highlight`, `--font-display`…). A *theme* is nothing but a `:root { … }` block that overrides those tokens. Re-skinning the entire deck – including the generated SVG charts, which read the tokens at draw time – is a one-file change.

The JavaScript runtime is deliberately small and dumb: it reads declarative markup and config, and generates nav dots, page numbers, SVG bar charts, hover-preview cross-references, detail layers, and lightboxes at runtime. Zero dependencies.

## Quickstart

```bash
git clone <this-repo> psi-browserslides
cd psi-browserslides
python3 -m http.server 8000
# open http://localhost:8000/examples/example-deck.html
```

A minimal deck is three things – link the framework, add slides, add the chrome:

```html
<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My deck</title>
  <link rel="stylesheet" href="framework/browserslides.css">
  <link rel="stylesheet" href="themes/bamberg.css">   <!-- swap to re-skin -->
</head><body>

  <section class="frame"><div class="slide slide--title"><div class="slide-inner">
    <p class="eyebrow">My talk</p>
    <h1>A headline that scales to any screen</h1>
    <div class="pagefoot"><span>Footer</span><span class="pagenum"></span></div>
  </div></div></section>

  <!-- more <section class="frame">…</section> slides -->

  <nav class="dots" aria-label="Slide navigation"></nav>
  <div class="hint">↓ scroll · → next</div>
  <script src="framework/browserslides.js"></script>
</body></html>
```

Navigate with arrow keys, space, PageUp/Down, Home/End, the scroll wheel, or the nav dots.

## What's in the box

| Path | What it is |
|------|-----------|
| `framework/browserslides.css` | The core: slide engine, type scale, ~25 layout components, deck chrome. Ships a neutral default theme. |
| `framework/browserslides.js` | The runtime: navigation, page numbers, `Browserslides.barChart()`, detail layers, cross-reference previews, lightboxes, image stacks. |
| `themes/bamberg.css` | The original University of Bamberg blue/yellow palette. |
| `themes/midnight.css` | A dark theme – proof that flipping `--paper`/`--ink` re-skins everything. |
| `examples/example-deck.html` | A 14-slide worked example exercising every major layout. |
| `docs/cookbook.md` | The component catalog – copy-paste snippets for every layout. |
| `docs/tutorial.en.md` · `docs/tutorial.de.md` | Build-your-first-deck walkthrough, bilingual. |
| `tools/embed-fonts.mjs` · `tools/inline-deck.mjs` | Turn a linked dev deck into one self-contained file with base64 fonts/images. |
| `tools/optimise-images.mjs` | Re-encode a deck's images to WebP at the size the slides actually use, before inlining. Cut a real 20-image deck from 8.3 MB to 3.3 MB. |
| `tools/build-deck.sh` | The whole pipeline in one command: optimise, inline, then verify that nothing external is left. |
| `skills/browserslides/` | A Claude Code / Agent **skill** so an AI assistant can build these decks for you. |
| `docs/handoff-autolayout.md` | What building a real deck taught us about the framework, and what an auto-layout pass has to survive. |

## Theming

Copy `themes/bamberg.css`, change the token values, load it after the core stylesheet:

```css
:root {
  --accent:    #6d28d9;  /* your brand colour */
  --accent-80: #7f43dd; --accent-60: #9366e4; --accent-40: #b89aee; --accent-20: #e3d9f8;
  --accent-ink:#ffffff;
  --font-display: "Playfair Display", Georgia, serif;
  --font-body:    "Inter", system-ui, sans-serif;
}
```

Fonts default to the system stack (zero bytes, works offline). To match a specific brand face, generate `@font-face` rules with `tools/embed-fonts.mjs` and paste them in – then your deck stays a single self-contained file.

See **[docs/cookbook.md](docs/cookbook.md)** for every component and **[docs/tutorial.en.md](docs/tutorial.en.md)** to build one step by step.

## The Claude skill

`skills/browserslides/` packages this framework as a skill so Claude can author decks for you: describe your talk, and it assembles slides from the catalog, picks or builds a theme, verifies the render, and (optionally) inlines everything into one file. See [skills/browserslides/README.md](skills/browserslides/README.md) for installation.

## License

**MIT** – use it anywhere, including commercially; just keep the copyright notice. Full text in [LICENSE](LICENSE). Fonts are not covered by MIT: the default theme uses system fonts, and any fonts you embed carry their own licenses (see LICENSE).

---

<a name="deutsch"></a>

## Deutsch

**browserslides** ist ein abhängigkeitsfreies Framework für Präsentationsdecks, die als *eine* selbst-enthaltene HTML-Datei leben und pixelgenau auf jeden Bildschirm skalieren. Kein Framework, kein Build-Schritt, kein Server, keine zu installierenden Schriften – eine `.html`, die überall gleich aussieht: 13″-Laptop, 4K-Beamer oder Handy im Querformat.

**Der Trick in zwei Ideen:**

1. **Container-Query-Skalierung.** Jede Folie ist eine `16:9`-Box mit `container-type:size`. *Alles* darin ist in `cqw`/`cqh` (Container-Query-Einheiten) bemessen, nie in `px`/`rem`. Das Layout skaliert also proportional mit der Folie – kein Pixel-Alignment, sondern Proportions-Alignment.
2. **Semantische Design-Tokens.** Jede Farbe und Schrift ist eine CSS-Variable mit sprechendem Namen (`--accent`, `--ink`, `--highlight`, `--font-display` …). Ein *Theme* ist nur ein `:root { … }`-Block, der diese Tokens überschreibt – inklusive der zur Laufzeit generierten SVG-Charts.

**Schnellstart:**

```bash
python3 -m http.server 8000
# http://localhost:8000/examples/example-deck.html öffnen
```

Bedienung: Pfeiltasten, Leertaste, Scrollen oder die Nav-Punkte. Die Farb-/Font-Anpassung ist ein Ein-Datei-Wechsel (`themes/…css` kopieren, `--accent` & Co. ändern). Volle Bauteil-Referenz in **[docs/cookbook.md](docs/cookbook.md)**, Schritt-für-Schritt in **[docs/tutorial.de.md](docs/tutorial.de.md)**.

**Lizenz: MIT** – frei nutzbar, auch kommerziell; nur den Copyright-Vermerk mitführen. Fonts fallen nicht unter MIT: das Default-Theme nutzt System-Schriften, eingebettete Schriften haben ihre eigenen Lizenzen (siehe LICENSE).
