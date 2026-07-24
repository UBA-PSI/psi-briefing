---
name: browserslides
description: Build polished 16:9 presentation decks as a single self-contained HTML file — no framework, no build step, no dependencies. Use when the user wants to create a slide deck, presentation, talk, or retrospective as HTML/in the browser, wants slides that scale to any screen, mentions "browserslides", or wants to turn notes/an outline into slides. Assembles slides from a component catalog, themes them with design tokens, and can inline everything into one shareable file.
---

# browserslides

A dependency-free framework for presentation decks that live in one self-contained HTML file and scale pixel-perfectly to any screen. This skill lets you author such decks reliably.

## The two ideas that make it work

1. **Container-query scaling.** Every slide is a `16:9` box with `container-type:size`. Everything inside is sized in `cqw` (1% of slide width) / `cqh` (1% of slide height) — never px/rem. So the whole layout scales *proportionally* with the slide and looks identical on a laptop, a projector, or a phone in landscape. When you size anything custom inside a slide, **use cqw/cqh, never px**.
2. **Semantic design tokens.** Colours and fonts are CSS variables (`--accent`, `--ink`, `--highlight`, `--font-display`…). A theme is only a `:root{}` override. Re-skinning is a one-file change — including the JS-generated SVG charts, which read tokens at draw time.

## Default style: slidedoc, not sparse slides

Unless the user asks for a sparse "presentation" look, **build slidedocs** (in the Duarte sense): text-dense slides that *fill the frame* with well-arranged blocks — the reading-oriented look of the original retro decks. Draw generously on the source material; a near-empty slide with one line is usually wrong for this framework.

- Reach first for the text-block layouts: `.cols` grids holding `.prose` and `.panel` blocks, plus `.editorial-layout`, `.principle-columns`, `.twocol`, `.net`, `.cardcol`, `.facts`, `.kulissen`, `.delta`.
- Free paragraphs **must** be wrapped in `.prose` (a bare `<p>` falls back to 16px and won't scale).
- Use the big `.slide--statement` / `.slide--question` / `.slide--quote` slides *sparingly*, for a deliberate beat — not as the default for content.
- Aim to fill the vertical space; `.cols`/component `flex:1` do this. After building, check no slide overflows (content taller than the slide) and none is mostly empty.

## Workflow

1. **Scaffold.** Copy `references/starter.html` and `references/assets/` (browserslides.css, browserslides.js, and a theme) into the deck's folder. During authoring, keep the CSS/JS *linked* (readable); inline only at the end.
2. **Structure the talk.** One `<section class="frame">` per slide. Give the deck a shape: title → section dividers (`.slide--divider`, big number) → content → closing. Keep divider numbering and any table of contents in sync.
3. **Build each slide** by copying a component from the catalog below (full detail: `references/components.md`, or `docs/cookbook.md` in the repo). Match the exact class names. Every slide follows the skeleton:
   ```html
   <section class="frame"><div class="slide"><div class="slide-inner">
     <p class="eyebrow">Kicker</p>
     <h2>Slide title</h2>
     <!-- one component here -->
     <div class="pagefoot"><span>Footer</span><span class="pagenum"></span></div>
   </div></div></section>
   ```
   `.slide-inner` is a flex column; components with `flex:1; min-height:0` fill the remaining height. `.pagenum` auto-fills to "n / total".
4. **Add the chrome once**, at the end of `<body>`: `<nav class="dots">`, `<div class="hint">`, optional `#rotate-hint`, then `<script src="…/browserslides.js">`, then any `Browserslides.barChart(...)` calls.
5. **Theme it.** Pick `bamberg.css` (blue/yellow) or `midnight.css` (dark), or make one: copy a theme, change `--accent` + the `--accent-80/60/40/20` tint ramp, `--accent-ink`, and `--font-display`/`--font-body`. Fonts default to the system stack.
6. **Verify in a browser.** Serve with `python3 -m http.server` and load it (Playwright/Chrome blocks `file://` for local assets). Check: one `<section>` per slide, exactly one SVG per chart box, page numbers count correctly, nothing overflows the slide. Screenshot the title + a chart slide to confirm.
7. **Make it self-contained (optional, for sharing).** Run `tools/inline-deck.mjs deck.html` to fold the CSS/JS and local images into one file; embed brand fonts first with `tools/embed-fonts.mjs`.

## Component quick-reference

Copy the matching block from `references/components.md` / `docs/cookbook.md`. Pick by intent:

| Need | Component (key classes) |
|------|-------------------------|
| Free text that scales | `.prose` (+ `--lead` / `--dense`); wrap every bare paragraph |
| Arrange text blocks | `.cols` (+ `--2` / `--3` / `--wide-left` / `--wide-right` / `--center`) with `.col` children |
| A grouped text card | `.panel` (+ `--plain` / `--hl`) |
| Opening slide | `.slide--title` + `.title-grid`, `.title-strip`, `.toc`, `.takeaway` |
| Section break | `.slide--divider` + `.divider-num`, `.divider-title`, `.divider-lead` |
| Big numbers | `.facts` + `.fact`, `.fact--hero`, `<sup>` |
| Two timelines / plan vs reality | `.twocol` + `.tl` + `time` + `.sub` |
| Highlighted takeaway line | `.punch` |
| Bar chart (generated) | `.chartbox#id` + `Browserslides.barChart('#id', {...})` |
| Numbered process | `.flow` + `.fcol` + `.fstep` + `.step-num` |
| Grid of 4 cards | `.net` (bordered) or `.cardcol` (stacked) |
| Magazine hero + list | `.editorial-layout` + `.editorial-hero` + `.editorial-stack`/`.editorial-item` |
| Two do/avoid lists | `.principle-columns` + `.principle-group` + `.principle-list` |
| Prompt / conversation | `.chat` + `.msg`, `.msg--ai`, `.msg--final` |
| Before → after | `.delta` + `.d-old`, `.d-arrow`, `.d-new` |
| Build/data pipeline | `.pipe` + `.pcard`, `.pcard--build`, `.pcard--out`, `.pipe-arrow` |
| Screenshots | `.shots` (grid), `.shots--single`, `.shots--fit`; annotate with `.anno-stage`/`.anno` |
| Fanned photo stack (click to pin) | `.stack-stage` + `.stack-card.stack-p1…p4` |
| Render a spec as a document | `.doc` + `.doc-head`, `.doc-body`, `.doc-sect` |
| Plain list, denser | `.kulissen`, `.kulissen--dicht/--mittel/--rollen` |
| Deep-dive behind a slide | `.bottomline` → `.detail-layer` + `.layer-close` (Esc closes) |
| Jump to another slide w/ preview | `<a class="goto" href="#slide-id">` (hover previews, click jumps) |
| Zoom an image | add class `zoomable` to an `<img>` |

**Narrative / talk components** (for argument-driven talks — questions, reveals, a running thesis, cited studies):

| Need | Component (key classes) |
|------|-------------------------|
| A big rhetorical question | `.slide--question.slide--statement` + `.statement` + `.statement-kicker` (accent panel, highlight emphasis) |
| A big statement / reveal | `.slide--statement` + `.statement` (+ `.statement--answer` for a highlight underline); `.statement small` adds a supporting line |
| A cited study/stat | `.facts` + `.fact--hero` for the numbers, then `.source` (with `<b>` author + `<a>` link) |
| The talk's key points, filling up | `.tracker` + `.tracker-item` (add `.done`) + `.t-dot` — repeat with more `.done` each recap slide |
| A thesis that evolves in the footer | `<span class="thesis">` in `.pagefoot`; assert with `<b>`, strike the old form with `<s>` |
| Edges-vs-middle diagram | `.sandwich` + `.sandwich-band--edge` / `.sandwich-band--mid.eaten` + `.sandwich-note` |
| A full-bleed quote | `.slide--quote` + `.bigquote` + `.quote-attr` |

### barChart config (the only JS you normally write)

```js
Browserslides.barChart('#chart-id', {
  data: [{ value: 40, label: 'W1', color: '--accent-60', tooltip: '<b>W1</b> 40' }, …],
  max: 220,                       // optional; auto from data otherwise
  gridlines: [0, 55, 110, 165, 220],
  markers: [{ index: 6, label: 'Freeze', level: 1, anchor: 'start' }], // dashed milestone lines
  valueLabels: true,              // draw value on each bar
  labelEvery: 4,                  // thin out x labels for dense data
  ariaLabel: 'Commits per week'
});
```
Bar/marker `color` accepts a raw colour **or** a `--token` name (recommended, so it follows the theme). Charts read theme tokens at draw time — a live theme switch needs `redraw()`.

## Rules & gotchas

- **cqw/cqh only** inside a slide. A stray `px` breaks the scale-to-any-screen promise.
- **Keep one `<section class="frame">` per slide.** Divider numbering and TOC must match the actual section order.
- The runtime is **not idempotent** (it appends). Never re-run it on an already-rendered DOM, and never take a browser "Save As" DOM dump as your source — charts and dots will double. Edit the source HTML.
- If two versions of a deck exist (e.g. public vs internal), make every content change in **both**.
- Respect the footer/version convention if the user has one; keep any version marker consistent across all slides.
- Don't invent class names. If a layout isn't in the catalog, compose from existing components or add a small scoped `<style>` block using cqw/cqh + tokens.

## Files in this skill

- `references/starter.html` — a minimal working deck to copy.
- `references/assets/` — `browserslides.css`, `browserslides.js`, `bamberg.css`, `midnight.css`.
- `references/components.md` — the full component catalog with copy-paste snippets.
- In the repo: `docs/cookbook.md`, `docs/tutorial.{en,de}.md`, `tools/embed-fonts.mjs`, `tools/inline-deck.mjs`.
