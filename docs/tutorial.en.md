# Build your first deck in 15 minutes

*browserslides — a dependency-free framework for self-contained 16:9 HTML slide decks. [MIT-licensed](https://opensource.org/license/mit) (fonts excepted).*

This walkthrough takes you from a blank file to a real presentation: a title slide, a content slide with live components, and a bar chart generated in the browser. By the end you'll know enough to build and share your own deck.

## What you'll build

A short deck that opens straight from your file system — double-click it, or serve it statically. No `npm install`, no bundler, no build step, no framework runtime. Just three files you link together: the core CSS, a theme, and one small script.

### The core idea

Every slide is a **16:9 box**. The box uses CSS `container-type: size`, which means everything inside it is measured in *container-query units* — `cqw` (1% of the slide's width) and `cqh` (1% of its height) — instead of pixels. So the whole layout, headline sizes included, scales in proportion to the slide.

The practical payoff: a slide looks *identical* on a 13" laptop, a 4K projector, and a phone held in landscape. Nothing reflows, nothing jumps. It isn't "pixel-perfect" so much as **proportion-perfect** — the same design, just bigger or smaller.

You'll almost never write `px` in your own slide content. Reach for `cqw`/`cqh` and the layout follows the slide everywhere.

---

## Step 1 — The minimal HTML

Create a file called `my-deck.html` next to the `framework/` and `themes/` folders (adjust the two `href`s if you put it elsewhere). Here is a complete, working starter page — copy it in as-is:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>My first deck</title>

<!-- 1) the framework, then 2) a theme. Order matters: the theme only
     overrides tokens, so it must come second. -->
<link rel="stylesheet" href="framework/browserslides.css">
<link rel="stylesheet" href="themes/bamberg.css">
</head>
<body>

<!-- One slide. Copy this <section> block for every new slide. -->
<section class="frame">
  <div class="slide"><div class="slide-inner">
    <p class="eyebrow">My first deck</p>
    <h2>Hello, browserslides</h2>
    <div class="pagefoot"><span>My deck</span><span class="pagenum"></span></div>
  </div></div>
</section>

<!-- deck chrome: nav dots + a keyboard hint. Put these once, near the end. -->
<nav class="dots" aria-label="Slide navigation"></nav>
<div class="hint">↓ scroll · → next · press a key</div>

<script src="framework/browserslides.js"></script>
</body>
</html>
```

Open it in a browser. You already have a working slide, navigation dots down the right edge, keyboard control, and a page number that fills itself in.

**The anatomy of a slide** is always the same three nested elements:

```html
<section class="frame">          <!-- one full viewport panel, scroll-snaps to centre -->
  <div class="slide">            <!-- the 16:9 box; this is where cqw/cqh become "% of slide" -->
    <div class="slide-inner">    <!-- your content lives here (a flex column) -->
      …
    </div>
  </div>
</section>
```

One `<section class="frame">` = one slide. To add slides, you copy that block. The `.dots`, `.hint`, and the `<script>` go **once** at the very end of `<body>`.

> **Opening it:** `file://` works for everything in this tutorial. If you later add a headless-browser preview or anything that dislikes `file://` URLs, run a throwaway static server from the deck's folder — e.g. `python3 -m http.server 8000` — and visit `http://localhost:8000/my-deck.html`.

---

## Step 2 — A title slide

Give the deck an opening. A title slide is a normal slide with the extra class `slide--title` on the `.slide` element — the theme paints it in the accent colour and centres the content. Replace your first `<section>` with this:

```html
<section class="frame">
  <div class="slide slide--title"><div class="slide-inner">
    <p class="eyebrow">Retrospective · 2026</p>
    <h1>Shipping a portal in eleven weeks</h1>
    <p class="title-sub">A worked example built with browserslides</p>
    <div class="title-strip">
      <div><b>11</b><span>Weeks</span></div>
      <div><b>1&nbsp;280</b><span>Commits</span></div>
      <div><b>1</b><span>HTML file</span></div>
    </div>
    <div class="pagefoot"><span>My deck</span><span class="pagenum"></span></div>
  </div></div>
</section>
```

What each piece does:

- `.eyebrow` — the small, spaced, uppercase kicker above the headline.
- `<h1>` — the big display headline. On a title slide it's set in the display font and sized in `cqw`, so it never overflows.
- `.title-strip` — a row of small stat blocks (`<b>` is the number, `<span>` is the label). Great for a "deck at a glance" summary.

Use `&nbsp;` (a non-breaking space) inside numbers and short phrases you don't want to wrap — `1&nbsp;280`, `10&nbsp;a.m.`

---

## Step 3 — A content slide with real components

Now a data slide. Add this as a new `<section>` after the title. It shows two of the built-in components — a **facts grid** and a **two-column timeline** — and demonstrates how the slide body is laid out.

```html
<section class="frame">
  <div class="slide"><div class="slide-inner">
    <p class="eyebrow">Chapter 1 · The numbers</p>
    <h2>Plan versus reality</h2>

    <!-- Facts grid: four big-number cells; the first is a "hero" cell. -->
    <div class="facts">
      <div class="fact fact--hero"><b>1&nbsp;280</b><span>Commits across the project</span></div>
      <div class="fact"><b>117</b><span>Working days elapsed</span></div>
      <div class="fact"><b>34<sup>%</sup></b><span>Of commits before 10&nbsp;a.m.</span></div>
      <div class="fact"><b>3</b><span>People on the core team</span></div>
    </div>

    <!-- Two-column timeline. -->
    <div class="twocol">
      <div>
        <div class="tl-head">Planned</div>
        <ul class="tl">
          <li><time>Wk 1</time><span>Kickoff &amp; scope<span class="sub">One page, agreed in a room</span></span></li>
          <li><time>Wk 3</time><span>First prototype</span></li>
          <li><time>Wk 11</time><span>Launch</span></li>
        </ul>
      </div>
      <div>
        <div class="tl-head">Reality</div>
        <ul class="tl">
          <li><time>Wk 1</time><span>Kickoff, on time</span></li>
          <li><time>Wk 2</time><span>Prototype early<span class="sub">Momentum from a good first day</span></span></li>
          <li><time>Wk 11</time><span>Launch, on time</span></li>
        </ul>
      </div>
    </div>

    <div class="pagefoot"><span>My deck</span><span class="pagenum"></span></div>
  </div></div>
</section>
```

**How the layout works.** `.slide-inner` is a **flex column**: children stack top to bottom. Components like `.facts` and `.twocol` carry `flex: 1`, so they grow to fill the space left between the heading and the footer — the slide always looks balanced, whatever you put in it. (In practice, put *one* main component per content slide; two, as shown here, works when both are compact.)

- **`.facts`** — a four-cell grid of big numbers. `.fact b` is the number, `.fact span` is the caption. Add `.fact--hero` to any cell to flood it with the accent colour. `<sup>` shrinks a unit like `%`.
- **`.twocol` + `.tl`** — two columns, each a timeline list. `.tl-head` is the column heading; every `<li>` is a `<time>` label plus text, and a nested `<span class="sub">` adds a quiet second line.

**The footer.** Every slide ends with `.pagefoot` — a left caption and a right `.pagenum`. Leave `.pagenum` empty: the script fills in `n / total` for every slide automatically, so you never renumber by hand.

---

## Step 4 — A generated bar chart

Charts aren't images — the script draws them as SVG at runtime, and they inherit your theme's colours. Two parts: an empty container in the slide, and one call at the end of the page.

First, the container. It needs an `id` so the script can find it:

```html
<section class="frame" id="slide-chart">
  <div class="slide"><div class="slide-inner">
    <p class="eyebrow">Chapter 1 · Activity</p>
    <h2>Commits per week, with milestones</h2>
    <div class="chartbox" id="chart-weeks"></div>
    <div class="pagefoot"><span>My deck</span><span class="pagenum"></span></div>
  </div></div>
</section>
```

Then, *after* `<script src="framework/browserslides.js"></script>`, add your own script block:

```html
<script>
  Browserslides.barChart('#chart-weeks', {
    ariaLabel: 'Commits per week over eleven weeks, with three milestones',
    max: 220,
    gridlines: [0, 55, 110, 165, 220],
    data: [
      { value: 40,  label: 'W1', color: '--accent-60' },
      { value: 95,  label: 'W2', color: '--accent-60' },
      { value: 70,  label: 'W3', color: '--accent-60' },
      { value: 30,  label: 'W4', color: '--muted' },
      { value: 25,  label: 'W5', color: '--muted' },
      { value: 120, label: 'W6' },
      { value: 180, label: 'W7' },
      { value: 205, label: 'W9' },
      { value: 90,  label: 'W11' }
    ],
    markers: [
      { index: 0, label: 'Kickoff',        level: 0, anchor: 'start' },
      { index: 5, label: 'Feature freeze', level: 1, anchor: 'start' },
      { index: 8, label: 'Launch',         level: 0, anchor: 'end'   }
    ]
  });
</script>
```

What the options mean:

- **`data`** — an array of bars. Each is `{ value, label?, color?, tooltip? }`; a plain number works too when you only need the height.
- **`max`** — the top of the y-axis. Omit it and the chart picks a sensible round maximum just above your tallest bar.
- **`gridlines`** — the y-values to draw horizontal lines and labels at. Omit for five evenly-spaced defaults.
- **`markers`** — milestone overlays: a dashed line + dot + label at a bar `index`. `level` staggers labels vertically so they don't collide; `anchor` is `'start'` or `'end'` for which side the text sits.

**Colours come from your theme, for free.** With no `color`, bars use `--accent`. Any per-bar `color` (or `barColor` for the whole chart) accepts either a literal colour *or* a `"--token"` name — `'--accent-60'`, `'--muted'` — which is read live from the active theme. Change the theme and the chart recolours itself; you never hard-code a hex value into a chart. The chart also redraws on resize and after web fonts load, so it stays crisp.

Other handy options: `valueLabels: true` prints each bar's value on top, `labelEvery: 5` thins a crowded x-axis, `yLabels: false` hides the numeric axis.

---

## Step 5 — Theme it

A **theme is nothing but a `:root { … }` block that overrides design tokens** — colours and fonts. The framework hard-codes no colours; every component reads tokens like `--accent`, `--ink`, `--paper`. So re-theming a whole deck is a one-line change.

**Try a different look instantly.** Swap the theme `<link>`:

```html
<link rel="stylesheet" href="framework/browserslides.css">
<link rel="stylesheet" href="themes/midnight.css">   <!-- was: themes/bamberg.css -->
```

`midnight.css` flips the neutrals too — `--paper` goes dark, `--ink` goes light — and because nothing is pinned to white or black, the entire deck, charts included, goes dark with it.

**Make your own theme.** Copy `themes/bamberg.css` to `themes/mytheme.css` and change a few tokens. The essentials:

```css
:root {
  /* Your brand accent, plus a tint ramp from 80 down to 20.
     Charts, headings, rules and fills all draw from this ramp. */
  --accent:     #7a2e2e;
  --accent-80:  #97595a;
  --accent-60:  #b18485;
  --accent-40:  #cbafb0;
  --accent-20:  #e5d9da;
  --accent-ink: #ffffff;   /* text placed on top of --accent */

  /* Two type roles: a display face for headings, a body face for text. */
  --font-display: "Playfair Display", Georgia, serif;
  --font-body:    "Inter", system-ui, -apple-system, sans-serif;
}
```

The tint ramp (`--accent-80 … --accent-20`) is worth getting right: it's the accent progressively mixed toward white, and it's what gives fact cells, timelines, and chart bars their range. Pick five evenly-lightening steps.

**Fonts.** The framework's default fonts are **system fonts** — so a deck renders identically offline with zero downloaded bytes. A theme may *name* real fonts (Bamberg asks for Copse + Open Sans); if they aren't available, the stack falls back to the system serif/sans and the deck still works. To ship the real fonts, embed them (next step).

---

## Step 6 — Make it self-contained for sharing

While you're building, three linked files is convenient. To *hand the deck to someone* — email it, drop it on a USB stick, put it behind a login — you want **one HTML file that works offline**, with no folder of assets to lose.

The recipe:

1. **Inline the CSS** — paste `browserslides.css` and your theme into a `<style>` block in the `<head>`, replacing the two `<link>`s.
2. **Inline the JS** — paste `browserslides.js` into a `<script>` block, replacing `<script src=…>`.
3. **Embed fonts and images as base64** — instead of linking a `.woff2` or a `.png`, encode it and drop it straight into the CSS/HTML as a `data:` URI.

Do that and the file has zero external references: it opens from `file://`, from a stick, from anywhere, forever, with no network.

You don't have to do this by hand. The intended home for the helper scripts is the **`tools/`** directory:

- **`tools/embed-fonts.mjs`** — encodes your `.woff2`/`.png` assets as base64 and inlines them.
- **`tools/inline-deck.mjs`** — folds the linked CSS and JS into the HTML, producing the single self-contained file.

Run those against your working deck to get the shareable artifact, and keep editing the linked version.

---

## Navigation & tips

Once the script is on the page, the deck drives itself:

- **Move around:** `→` `↓` `Space` `PageDown` go forward; `←` `↑` `PageUp` go back; `Home`/`End` jump to the first/last slide. Plain scrolling works too, and each slide **snaps** to centre.
- **Nav dots:** the `.dots` rail on the right shows your position and is clickable. It's built from your slides automatically — the number of dots always matches the number of `.frame` sections.
- **Page numbers:** any empty `.pagenum` is filled with `n / total` on load. Renumbering is never your job.
- **Reduced motion:** if the viewer's OS asks for reduced motion, scrolling jumps instead of animating and transitions are dropped. Respected automatically.
- **Phones:** in portrait on a small screen, a dismissible hint suggests turning the device — the deck is designed for landscape.

A couple of rules keep things predictable:

- **One `<section class="frame">` per slide.** The dots, page numbers, and keyboard nav all count `.frame` elements.
- **Don't hand-edit a browser-saved copy of the deck as your source.** The script *generates* charts, dots and page numbers into the DOM on load, so a "Save page as…" dump has that output baked in — reopen it and you'd get duplicates. Always edit the original source file.

---

## Where to go next

You've used a handful of components; there are many more — image galleries, annotated screenshots, flow steps, before/after deltas, chat bubbles, section dividers, document mock-ups, clickable detail layers, cross-reference previews, and more.

They're all catalogued, with copy-paste markup, in **[`docs/cookbook.md`](cookbook.md)**. The **[`examples/example-deck.html`](../examples/example-deck.html)** file is a complete deck that exercises most of them — read its source alongside the cookbook.

Happy building.
