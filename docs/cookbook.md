# browserslides Cookbook

A copy-from reference catalog for building 16:9 HTML slide decks with browserslides. Every snippet below uses only classes that exist in `framework/browserslides.css`. Pick the component you need, copy its markup into a slide, and adjust the text.

---

## How it works

**Scaling.** Every `.slide` is a 16:9 box declared with `container-type: size`. Because of that, everything *inside* a slide is measured in container-query units — `cqw` (1% of the slide's width) and `cqh` (1% of its height) — never in `px` or `rem`. The entire layout, including the type scale, is expressed as a proportion of the slide itself. Show the same deck on a 13" laptop, a 4K projector, or a phone in landscape and every heading, gap, and rule keeps the exact same relative position. That is why the alignment feels pixel-perfect: it is proportion-perfect. When you write your own additions, stay in `cqw`/`cqh` so they scale with the frame too.

**Theming.** Colours and fonts are semantic design tokens — CSS custom properties declared in `:root` in the core stylesheet (a neutral "slate" default). A theme file is nothing but a `:root { … }` block that overrides some of those tokens; it never restyles components. Load the core CSS first, then a theme:

```html
<link rel="stylesheet" href="framework/browserslides.css">
<link rel="stylesheet" href="themes/bamberg.css">
```

Swap the second line for `themes/midnight.css` and the same deck goes dark — because nothing is hard-coded to white or black, only to tokens. Charts read these same tokens at runtime (via `Browserslides.token()`), so a generated chart automatically matches the active theme. For distribution, inline the two stylesheets and the script into the HTML to get one self-contained file.

---

## Design tokens

Every custom property from `:root` in `browserslides.css`. Override any of these in a theme; leave the rest to inherit the default.

| Token | What it's for |
| --- | --- |
| `--accent` | Brand accent — headings, rules, default chart bars, the title/divider background |
| `--accent-80` | Accent tint ramp step (darker end) — divider numbers, secondary bars, borders |
| `--accent-60` | Accent tint — eyebrows, muted bars, dotted underlines |
| `--accent-40` | Accent tint — arrows, faint borders, min TOC numerals |
| `--accent-20` | Lightest accent tint — panel fills, fact cards, chat bubbles |
| `--accent-ink` | Text/icons placed on top of `--accent` (usually white) |
| `--highlight` | Call-outs, emphasis (the `.punch` family) |
| `--highlight-soft` | Soft fill behind a highlight (e.g. `.punch` background) |
| `--danger` | Annotations, alerts, chart milestone markers |
| `--danger-soft` | Soft fill / focus-outline pairing for danger |
| `--positive` | Badges, "public" markers (e.g. `.fassung-mark`) |
| `--positive-soft` | Soft fill behind a positive marker |
| `--paper` | The slide surface (light by default) |
| `--ink` | Primary text |
| `--ink-soft` | Secondary text — body copy, captions inside components |
| `--muted` | Captions, footers, axis labels |
| `--muted-soft` | Subtle fills and row separators |
| `--rule` | Borders and hairlines |
| `--stage` | The area behind the slides (the "desk") |
| `--stage-ink` | Text/dots on the stage — nav dots, hint, scroll cue |
| `--font-display` | Display face for headings |
| `--font-body` | Body face for running text |
| `--font-mono` | Monospace face — document heads, build-card titles |
| `--slide-radius` | Corner radius of the slide box |
| `--slide-shadow` | Drop shadow under each slide |

Note: `--stage`/`--stage-ink` also have dark-mode values applied via `@media (prefers-color-scheme: dark)` and via `:root[data-theme="dark"|"light"]` (set by the theme toggle).

---

## The slide skeleton

One slide is one `<section class="frame">`. The nesting is required: `.frame` centres and scroll-snaps the panel, `.slide` is the 16:9 container, `.slide-inner` is the padded flex column your content lives in.

```html
<section class="frame">
  <div class="slide"><div class="slide-inner">
    <p class="eyebrow">Chapter · Section</p>
    <h2>Slide heading</h2>
    <!-- component markup goes here -->
    <div class="pagefoot"><span>Deck name</span><span class="pagenum"></span></div>
  </div></div>
</section>
```

- `.eyebrow` — small uppercase kicker above the heading (optional).
- `h1` is for title/closing slides; `h2` for content slides.
- `.pagefoot` sits at the bottom of every slide. Leave `.pagenum` empty — the runtime fills it with `n / total`.
- Give a `<section>` an `id` if you want to link to it with an `a.goto` cross-reference.

### Deck chrome (once, at the end of `<body>`)

Put this after the last slide, then the two includes:

```html
<!-- deck chrome -->
<nav class="dots" aria-label="Slide navigation"></nav>
<div class="hint">↓ scroll · → next · press a key</div>
<div id="rotate-hint">
  <div class="rh-icon">📱</div>
  <h2>Turn your phone</h2>
  <p>This deck is designed for landscape. Rotate your device, or tap to dismiss.</p>
  <button class="rh-btn">Show anyway</button>
</div>

<script src="framework/browserslides.js"></script>
<script>
  /* your per-deck chart definitions go here */
</script>
```

The `.dots` nav is populated at runtime (one dot per `.frame`); if you omit the element, dots are simply skipped. `#rotate-hint` only shows on narrow portrait screens.

---

## Component catalog

### Title slide

The opening slide. Dark accent background, big headline, an optional numeric strip and a right-hand "takeaway" card or table of contents.

**Use when:** the first slide of a deck.

```html
<section class="frame">
  <div class="slide slide--title"><div class="slide-inner">
    <p class="eyebrow">Retrospective · Example deck</p>
    <div class="title-grid">
      <div class="title-left">
        <h1>Project&nbsp;Aurora: shipping a portal in eleven weeks</h1>
        <p class="title-sub">A worked example of the browserslides framework</p>
        <div class="title-strip">
          <div><b>11</b><span>Weeks</span></div>
          <div><b>1&nbsp;280</b><span>Commits</span></div>
          <div><b>1</b><span>HTML file</span></div>
        </div>
      </div>
      <div class="takeaway">
        <p class="takeaway-kicker">In one sentence</p>
        <p class="takeaway-these">A small team can ship a <b>polished product</b> fast when the tooling gets out of the way.</p>
        <div class="takeaway-facts">
          <div><b>3</b><span>People on the core team</span></div>
          <div><b>34%</b><span>Work done before 10&nbsp;a.m.</span></div>
          <div><b>0</b><span>Build steps</span></div>
          <div><b>100%</b><span>Offline-capable</span></div>
        </div>
        <p class="takeaway-note">Everything on these slides is placeholder content.</p>
      </div>
    </div>
    <div class="pagefoot"><span>Project Aurora</span><span class="pagenum"></span></div>
  </div></div>
</section>
```

To use the right column as a table of contents instead of a takeaway card, swap `.takeaway` for `.toc` (add `.toc--wide` when the numbers are multi-digit):

```html
<div class="toc">
  <div><b>1</b><span>How the timeline went</span></div>
  <div><b>2</b><span>How it was built</span></div>
  <div><b>3</b><span>What we learned</span></div>
</div>
```

### Section divider

A dark chapter break with a giant number. Keep the divider number and the title-slide TOC in sync.

**Use when:** starting a new part of the deck.

```html
<section class="frame">
  <div class="slide slide--divider"><div class="slide-inner">
    <div class="divider-grid">
      <div class="divider-num">1</div>
      <div>
        <p class="divider-kicker">Part one</p>
        <h2 class="divider-title">How the timeline actually went</h2>
        <p class="divider-lead">Context, cadence, and the numbers behind the eleven weeks.</p>
      </div>
    </div>
    <div class="pagefoot"><span>Project Aurora</span><span class="pagenum"></span></div>
  </div></div>
</section>
```

### Two-column timeline

Two parallel lists of time-stamped items — good for plan-vs-reality or two workstreams. Each `<li>` holds a `<time>` cell and a description; add a `.sub` span for a secondary line.

**Use when:** comparing two sequences of dated events.

```html
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
      <li><time>Wk 2</time><span>Prototype early</span></li>
      <li><time>Wk 11</time><span>Launch, on time</span></li>
    </ul>
  </div>
</div>
```

### Punch callout

A soft highlighted strip for a one-line conclusion. Emphasise with `<b>`; add a `<small>` footnote line.

**Use when:** you want one takeaway to stand out under other content.

```html
<div class="punch">The plan was roughly right. <b>The order changed, not the destination.</b>
  <small>See the activity chart on <a class="goto" href="#slide-chart">the next data slide</a>.</small></div>
```

### Facts grid

Four big-number cells. Mark one `.fact--hero` to invert it (accent background). Use `<sup>` for units like `%`.

**Use when:** presenting four headline metrics.

```html
<div class="facts">
  <div class="fact fact--hero"><b>1&nbsp;280</b><span>Commits across the whole project</span></div>
  <div class="fact"><b>117</b><span>Working days of elapsed time</span></div>
  <div class="fact"><b>34<sup>%</sup></b><span>Of commits before 10&nbsp;a.m.</span></div>
  <div class="fact"><b>3</b><span>People on the core team</span></div>
</div>
```

### Bar chart

An SVG bar chart generated by the runtime into a `.chartbox`. It reads theme tokens, so colours match automatically and redraw on resize.

**Use when:** showing a distribution or series (commits per week, counts per category).

Markup — just an empty box with an id:

```html
<div class="chartbox" id="chart-weeks"></div>
```

Definition — in the trailing `<script>`, after `browserslides.js`:

```js
Browserslides.barChart('#chart-weeks', {
  ariaLabel: 'Commits per week, with three milestones', // accessible name on the <svg>
  max: 220,                        // y-axis maximum (default: 1.1 × largest, rounded up)
  gridlines: [0, 55, 110, 165, 220], // y values to draw (default: 5 evenly spaced)
  valueLabels: true,               // draw each bar's value on top (default false)
  labelEvery: 1,                   // draw an x-label every N bars (default: every labelled bar)
  barColor: '--accent',            // default fill; a "--token" name or a raw colour
  data: [
    { value: 40,  label: 'W1', color: '--accent-60' },   // per-bar color override
    { value: 95,  label: 'W2', tooltip: '<b>Week 2</b> — 95 commits' }, // custom tooltip HTML
    { value: 120, label: 'W6' },
    { value: 205, label: 'W9' }
  ],
  markers: [                       // optional milestone overlay: dashed line + dot + text
    { index: 0,  label: 'Kickoff',        level: 0, anchor: 'start' },
    { index: 2,  label: 'Feature freeze', level: 1, anchor: 'start' },
    { index: 3,  label: 'Launch',         level: 0, anchor: 'end'   }
  ]
});
```

Notes on the config:
- `data` accepts plain numbers (`[40, 95, 120]`) or objects `{ value, label?, color?, tooltip? }`.
- Any colour field (`barColor`, a bar's `color`, a marker's `color`) accepts a raw CSS colour **or** a `"--token"` name, which is resolved against `:root` at draw time.
- `markers[].level` staggers overlapping labels vertically; `anchor` is `"start"` or `"end"` for which side the text sits.
- Turn off the numeric y-axis with `yLabels: false`; set corner rounding with `radius`.
- The call returns a controller `{ redraw() }` if you need to force a re-render.

### Phases legend

A compact legend of coloured phase bands, often under a chart. Two forms: a labelled key (`.phases`) and a proportional colour bar (`.phase-band`). Set colours inline per item.

**Use when:** labelling regions of a timeline or chart.

```html
<!-- key only -->
<div class="phases">
  <div style="border-color:var(--accent-60)"><b>Explore</b>Weeks 1–3</div>
  <div style="border-color:var(--muted)"><b>Lull</b>Weeks 4–5</div>
  <div style="border-color:var(--accent)"><b>Push</b>Weeks 6–11</div>
</div>

<!-- proportional band + key -->
<div class="phase-band">
  <i style="left:0;width:27%;background:var(--accent-60)"></i>
  <i style="left:27%;width:18%;background:var(--muted)"></i>
  <i style="left:45%;width:55%;background:var(--accent)"></i>
</div>
<div class="phases">
  <div><b>Explore</b>Weeks 1–3</div>
  <div><b>Lull</b>Weeks 4–5</div>
  <div><b>Push</b>Weeks 6–11</div>
</div>
```

### Rhythm two-pane

A wide text pane beside a narrower cell, typically holding a small chart. Use `.cell` for the right pane and drop a `.chartbox` inside it.

**Use when:** a short narrative needs a supporting visual alongside.

```html
<div class="rhythm">
  <div>
    <h3>A steady weekly beat</h3>
    <p class="note">Most weeks looked the same: frame on Monday, review on Friday.</p>
    <p class="note">The exceptions were the two weeks around the feature freeze.</p>
  </div>
  <div class="cell">
    <div class="chartbox" id="chart-rhythm"></div>
  </div>
</div>
```

### Method bar-comparison

A left explanatory column and a set of labelled proportional bars, with an optional "fun fact" panel. Mark the chosen row `li.pick` to emphasise it. Each row is `label / bar / value`.

**Use when:** comparing options where one is the pick.

```html
<div class="method">
  <div>
    <p>We compared four ways to embed the fonts before settling on one.</p>
    <ul class="karenz">
      <li><span>Link (CDN)</span><span class="bar" style="width:40%"></span><span>0.4s</span></li>
      <li><span>Self-host</span><span class="bar" style="width:65%"></span><span>0.9s</span></li>
      <li class="pick"><span>Inline base64</span><span class="bar" style="width:100%"></span><span>0.0s</span></li>
    </ul>
  </div>
  <div class="fun">
    <h3>One odd detail</h3>
    <p>The inlined fonts add ~180&nbsp;KB but remove every network round-trip.</p>
  </div>
</div>
```

### Image gallery

A grid of screenshots with captions. Default is a 2-up grid (`.shots`); `.shots--single` shows one centred image; add `.shots--fit` to letterbox images to their natural aspect instead of cropping. `.gallery-note` adds a caption line under the grid.

**Use when:** showing product screenshots.

```html
<div class="shots">
  <figure>
    <div class="imgwrap"><img src="shot-a.png" alt="Enrolment start screen"></div>
    <figcaption><b>Start</b> — one obvious entry point</figcaption>
  </figure>
  <figure>
    <div class="imgwrap"><img src="shot-b.png" alt="Guided flow step"></div>
    <figcaption><b>Flow</b> — same information, fewer clicks</figcaption>
  </figure>
</div>
<p class="gallery-note">Screens are from the launch build. <a href="#">See the live portal</a>.</p>
```

Single, fitted variant:

```html
<div class="shots shots--single shots--fit">
  <figure>
    <div class="imgwrap"><img src="dashboard.png" alt="Full dashboard"></div>
    <figcaption>The dashboard, shown whole (letterboxed, not cropped)</figcaption>
  </figure>
</div>
```

### Annotated screenshot

One screenshot with red callout pins positioned absolutely on top. Position each `.anno` with inline `left`/`top` percentages.

**Use when:** pointing at specific spots in a UI.

```html
<div class="anno-stage">
  <div class="anno-wrap">
    <img src="portal.png" alt="Portal home with annotations">
    <span class="anno" style="left:22%;top:18%">Single entry point</span>
    <span class="anno" style="left:70%;top:55%">Next-step card</span>
  </div>
</div>
<p class="gallery-note">The two changes users noticed first.</p>
```

### Change strip / panel

A soft accent strip summarising a change under a gallery (`.change-strip`), a larger centred statement (`.change-strip--statement`), or a full list panel (`.change-panel`).

**Use when:** stating what changed, at three levels of prominence.

```html
<div class="change-strip">Enrolment went from <b>seven pages</b> to <b>one guided flow</b>.</div>

<div class="change-strip change-strip--statement">The most-requested change shipped first — and became the most-used screen.</div>

<div class="change-panel">
  <h3>What we changed</h3>
  <ul>
    <li><b>Fewer steps.</b> Seven pages became one flow.</li>
    <li><b>No paper.</b> Forms are filled in the browser.</li>
    <li><b>One entry point.</b> A single obvious place to start.</li>
  </ul>
</div>
```

### Document object

Renders a spec, PRD, or email as a paper document with a mono header and a body of sections. Use `.doc-ellipsis` to show elision.

**Use when:** quoting or mocking a written document on a slide.

```html
<div class="doc">
  <div class="doc-head">PRD — Guided Enrolment<span class="doc-meta">v3 · owner: product · 2 pages</span></div>
  <div class="doc-body">
    <p class="doc-sect">Problem</p>
    <p>New students cannot tell where to begin. Seven separate pages, no obvious order.</p>
    <p class="doc-sect">Proposal</p>
    <ol>
      <li>One guided flow with a single entry point.</li>
      <li>Carry answers forward; never ask twice.</li>
    </ol>
    <p class="doc-ellipsis">… (3 sections omitted) …</p>
  </div>
</div>
```

### Flow steps

A numbered vertical process, laid out in two columns with a connector line between steps. Each step is a `.fstep` with a `.step-num` badge.

**Use when:** showing an ordered process of ~4–6 steps.

```html
<div class="flow">
  <div class="fcol">
    <div class="fstep"><div class="step-num">1</div><h3>Frame the week</h3><p>One outcome, written down Monday morning.</p></div>
    <div class="fstep"><div class="step-num">2</div><h3>Build in the open</h3><p>Small commits, deployed continuously.</p></div>
  </div>
  <div class="fcol">
    <div class="fstep"><div class="step-num">3</div><h3>Review Friday</h3><p>Look at the real thing, not a status doc.</p></div>
    <div class="fstep"><div class="step-num">4</div><h3>Write it down</h3><p>A short note per week.</p></div>
  </div>
</div>
```

### Safety-net grid

A 2×2 grid of bordered cells, each a heading plus a line. (Also used inside detail layers.)

**Use when:** four parallel points — pillars, guarantees, categories.

```html
<div class="net">
  <div><h3>Frontend</h3><p>The guided flow and the component library.</p></div>
  <div><h3>Backend</h3><p>Enrolment logic and the data model.</p></div>
  <div><h3>Content</h3><p>Copy, translations, and the weekly notes.</p></div>
  <div><h3>Infra</h3><p>Deploy scripts and the font-embedding pipeline.</p></div>
</div>
```

### Editorial layout

A magazine split: one hero block beside a stack of smaller items. Add `.editorial-layout--lessons` to rebalance the columns for a lessons slide.

**Use when:** one dominant point plus several supporting ones.

```html
<div class="editorial-layout editorial-layout--lessons">
  <div class="editorial-hero">
    <p class="editorial-kicker">The big one</p>
    <h3>Ship something real every single week.</h3>
    <p>Nothing aligned the team like a working artifact on a Friday.</p>
  </div>
  <div class="editorial-stack">
    <div class="editorial-item"><h3>One page of scope</h3><p>If it did not fit on a page, we did not understand it yet.</p></div>
    <div class="editorial-item"><h3>Mornings for the hard part</h3><p>A third of the work happened before 10&nbsp;a.m.</p></div>
    <div class="editorial-item"><h3>Cut, don't defer</h3><p>"Later" is a graveyard. We removed features outright.</p></div>
  </div>
</div>
```

### Principle columns

Two soft panels of bulleted principles — a do/avoid pair reads well here. Each group can carry a `.tl-head` label.

**Use when:** two contrasting lists side by side.

```html
<div class="principle-columns">
  <div class="principle-group">
    <div class="tl-head">Do</div>
    <ul class="principle-list">
      <li><b>Decide in the room.</b> Async is for reporting, not deciding.</li>
      <li><b>Prefer the boring tool.</b> One HTML file beats a toolchain.</li>
    </ul>
  </div>
  <div class="principle-group">
    <div class="tl-head">Avoid</div>
    <ul class="principle-list">
      <li><b>Silent scope creep.</b> New work needs old work removed.</li>
      <li><b>Status theatre.</b> If it isn't running, it isn't done.</li>
    </ul>
  </div>
</div>
```

### Chat bubbles

A conversation thread. `.msg` is the default (left) bubble, `.msg--ai` the alternate style, `.msg--final` a wider highlighted outcome bubble. Each `<time>` is the speaker label.

**Use when:** reconstructing a conversation or prompt exchange.

```html
<div class="chat">
  <div class="msg"><time>Team member</time>Users keep asking where to begin. Can we just… give them one button?</div>
  <div class="msg msg--ai"><time>Reply</time>What if the button knows who you are and takes you to your next step?</div>
  <div class="msg msg--final"><time>Result</time>That "one button" became the most-used screen in the portal.</div>
</div>
```

### Before / after delta

Rows of old → new, right-aligned old value, arrow, new value. Use `<b>` for the new headline and `<small>` for a note.

**Use when:** showing concrete before/after changes.

```html
<div class="delta">
  <div>
    <div class="d-old">Seven separate pages to enrol</div>
    <div class="d-arrow">&rarr;</div>
    <div class="d-new"><b>One guided flow</b><small>Same information, a quarter of the clicks</small></div>
  </div>
  <div>
    <div class="d-old">PDF forms, printed and scanned</div>
    <div class="d-arrow">&rarr;</div>
    <div class="d-new"><b>Fill in the browser</b></div>
  </div>
</div>
```

### Pipeline infographic

Cards connected by arrows, showing inputs → build → output. `.pcard--build` is the accent build step, `.pcard--out` the output card. Group split sources with `.pcard-src` / `.pcard-src-half`. `.pipe--offset` vertically offsets the non-column cells; `.pipe--offset` targets everything that is not a `.pipe-col`.

**Use when:** showing a transformation or build pipeline.

```html
<div class="pipe">
  <div class="pipe-col">
    <div class="pcard-group">
      <div class="pcard-src">
        <div class="pcard-src-half"><b>Content</b> — Markdown notes per week</div>
        <div class="pcard-src-half"><b>Assets</b> — screenshots, fonts</div>
      </div>
    </div>
  </div>
  <div class="pipe-arrow">&rarr;</div>
  <div class="pipe-col"><div class="pcard pcard--build"><h3>embed-fonts.mjs</h3><p>Inlines fonts and images as base64</p></div></div>
  <div class="pipe-arrow">&rarr;</div>
  <div class="pipe-col"><div class="pcard pcard--out"><h3>deck.html</h3><p>One self-contained file. No server, no build, works offline.</p></div></div>
</div>
```

### Card columns

A vertical stack of bordered cards inside a column. Combine several `.cardcol` in a grid, or use one on its own.

**Use when:** a short list of titled cards.

```html
<div class="cardcol">
  <div><h3>Offline-first</h3><p>Everything embedded — no network at runtime.</p></div>
  <div><h3>No build step</h3><p>Edit the HTML directly; refresh to see changes.</p></div>
  <div><h3>Theme-driven</h3><p>Restyle the whole deck by swapping tokens.</p></div>
</div>
```

### Scenery lists

Plain separated lists with density variants: `.kulissen` (default), `--dicht` (dense), `--mittel` (medium), `--rollen` (roles — bold label on its own line).

**Use when:** a straightforward itemised list, sized to the content.

```html
<ul class="kulissen kulissen--mittel">
  <li><b>Registrar</b> — owns the enrolment rules</li>
  <li><b>IT</b> — hosting and single sign-on</li>
  <li><b>Design</b> — the guided flow and these slides</li>
</ul>

<ul class="kulissen kulissen--rollen">
  <li><b>Product owner</b>Sets the weekly outcome and cuts scope.</li>
  <li><b>Engineer</b>Builds in the open, deploys continuously.</li>
</ul>
```

### Image stack

Four fanned "polaroid" cards. Click (or focus) one to pin it to the front; the runtime toggles `.pinned`. Positions are fixed by `.stack-p1`…`.stack-p4`.

**Use when:** an informal gallery that invites interaction.

```html
<div class="stack-stage">
  <figure class="stack-card stack-p1"><span class="stack-shot"><img src="wk2.png" alt="Week 2 prototype"></span><figcaption class="stack-cap"><b>Week 2</b> — first clickable prototype</figcaption></figure>
  <figure class="stack-card stack-p2"><span class="stack-shot"><img src="wk6.png" alt="Week 6 flow"></span><figcaption class="stack-cap"><b>Week 6</b> — the guided flow takes shape</figcaption></figure>
  <figure class="stack-card stack-p3"><span class="stack-shot"><img src="wk11.png" alt="Launch build"></span><figcaption class="stack-cap"><b>Week 11</b> — launch build</figcaption></figure>
  <figure class="stack-card stack-p4"><span class="stack-shot"><img src="wk12.png" alt="First metrics"></span><figcaption class="stack-cap"><b>Week 12</b> — the first metrics</figcaption></figure>
</div>
```

### Cross-reference links

An inline link that previews and jumps to another slide. Give the target `<section>` an `id`; point `a.goto` at it. On the desktop a hover shows a scaled clone of the target slide; a click jumps. On touch, the first tap previews, the second jumps.

**Use when:** referring to another slide inline.

```html
<p>The activity is on <a class="goto" href="#slide-chart">the chart slide</a>.</p>
```

```html
<section class="frame" id="slide-chart"> … </section>
```

### Bottom-line + detail layer

A clickable strip that opens a full-slide deep-dive overlay. Put the `.detail-layer` right after the `.bottomline` (or anywhere in the same `.slide`). Open by click/Enter/Space; close with the `.layer-close` button or Esc.

**Use when:** offering optional detail without leaving the slide.

```html
<div class="bottomline">
  <span>The team logged <b>1&nbsp;280 commits</b> — click for the breakdown</span>
  <span class="more">Details &rarr;</span>
</div>
<div class="detail-layer">
  <button class="layer-close">Close &times;</button>
  <p class="eyebrow">Deep dive</p>
  <h2>Where the 1&nbsp;280 commits went</h2>
  <div class="net" style="margin-top:2cqh">
    <div><h3>Frontend</h3><p>620 commits.</p></div>
    <div><h3>Backend</h3><p>410 commits.</p></div>
    <div><h3>Content</h3><p>180 commits.</p></div>
    <div><h3>Infra</h3><p>70 commits.</p></div>
  </div>
</div>
```

### In-slide lightbox

A button that opens a dark overlay with one or two enlarged screenshots. The `.shot-link`'s `data-shot` must equal the `.shot-layer`'s `id`. Click anywhere on the layer (or press Esc) to close. Use `.shot-imgs--pair` for two side-by-side images.

**Use when:** letting the audience see a screenshot at full size on demand.

```html
<button class="shot-link" data-shot="shot-dashboard">Enlarge &#x2197;</button>
<div class="shot-layer" id="shot-dashboard">
  <div class="shot-imgs shot-imgs--pair">
    <img src="before.png" alt="Before">
    <img src="after.png" alt="After">
  </div>
  <p class="shot-caption">Before and after the guided-flow redesign.</p>
</div>
```

Separately, any image can be made click-to-zoom on its own by adding the `zoomable` class — the runtime opens a full-viewport lightbox:

```html
<img class="zoomable" src="chart.png" alt="Full-size chart">
```

### Version badge

A small uppercase marker (e.g. a "public"/"internal" tag) that sits in the footer. `.fassung-foot` is the plain footer-text variant.

**Use when:** labelling which cut of a deck this is.

```html
<div class="pagefoot">
  <span><span class="fassung-mark">Public</span> <span class="fassung-foot">· v5</span></span>
  <span class="pagenum"></span>
</div>
```

---

## Narrative / talk components

The components above suit reports and retrospectives. An argument-driven *talk* needs a different set of primitives: big rhetorical questions and reveals, a thesis that evolves as you speak, cited studies, and a running tracker of your key points. These pair naturally with the numbered `.slide--divider` for act breaks.

### Big statement / question / reveal

A single line that fills the slide — a rhetorical question or its answer. `.slide--statement` centres it vertically; `.slide--question` turns it into an accent panel with light text and highlight emphasis. `.statement small` adds a supporting paragraph; `.statement--answer` underlines the emphasis in the highlight colour.

```html
<!-- a question -->
<section class="frame"><div class="slide slide--question slide--statement"><div class="slide-inner">
  <p class="statement-kicker">Act 2 · An honest question</p>
  <p class="statement">Who gains more from AI — the <b>strong</b> or the <b>weak</b>?</p>
  <div class="pagefoot"><span class="thesis"><b>0 × tool = 0</b></span><span class="pagenum"></span></div>
</div></div></section>

<!-- the reveal, on a light slide -->
<section class="frame"><div class="slide slide--statement"><div class="slide-inner">
  <p class="statement-kicker">Act 3 · The core</p>
  <p class="statement statement--answer">The multiplier doesn't multiply skill. It multiplies <b>judgement.</b>
    <small>That's why the students couldn't tell if their program worked: they didn't see the silent errors.</small></p>
  <div class="pagefoot"><span class="thesis"><b>judgement × tool = leverage</b></span><span class="pagenum"></span></div>
</div></div></section>
```

### Running thesis (evolving footer)

A formula-like line in the footer that changes across the talk to dramatise a turn. Assert the current form with `<b>`; strike an abandoned one with `<s>`. On dark title/question slides the emphasis switches to the highlight colour automatically.

```html
<div class="pagefoot">
  <span class="thesis"><s>0 × tool = 0</s></span>   <!-- struck once the argument breaks -->
  <span class="pagenum"></span>
</div>
```

### Cited study / stat

Numbers in a `.facts` grid (use `.fact--hero` for the headline figure), followed by a muted `.source` line carrying the reference and link.

```html
<div class="facts">
  <div class="fact fact--hero"><b>+43<sup>%</sup></b><span>gain for the <b>weaker</b> performers</span></div>
  <div class="fact"><b>+17<sup>%</sup></b><span>gain for the stronger</span></div>
  <div class="fact"><b>758</b><span>consultants with GPT-4</span></div>
  <div class="fact"><b>−19<sup>pp</sup></b><span>more often wrong outside AI's reach</span></div>
</div>
<p class="source"><b>Dell'Acqua et al. 2023</b>, "Navigating the Jagged Technological Frontier".
  <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4573321">ssrn.com/abstract=4573321</a></p>
```

### Point tracker

The talk's key points, filling up as you reach each one. Add `.done` to the items already covered; repeat the block on each recap slide with one more `.done`. `margin-top:auto` pushes it to the bottom of the slide.

```html
<div class="tracker">
  <div class="tracker-item done"><span class="t-dot">1</span><span><b>Judgement, not skill</b></span></div>
  <div class="tracker-item"><span class="t-dot">2</span><span>The bar moves</span></div>
  <div class="tracker-item"><span class="t-dot">3</span><span>Study matters more, not less</span></div>
</div>
```

### Sandwich diagram (edges vs. shrinking middle)

Two solid edge bands with a middle band that gets "eaten" — a decide → execute → deliver picture, or any edges-vs-middle idea. `.sandwich-band--mid.eaten` shrinks and strikes the middle; `.sandwich-note` captions it.

```html
<div class="sandwich">
  <div class="sandwich-band sandwich-band--edge"><h3>Decide</h3><p><b>what</b> gets built — needs judgement</p></div>
  <div class="sandwich-band sandwich-band--mid eaten"><h3>Execute</h3><p>this is what AI eats</p></div>
  <div class="sandwich-band sandwich-band--edge"><h3>Deliver</h3><p>own <b>that</b> it's right — needs judgement</p></div>
</div>
<p class="sandwich-note">The middle shrinks. What's left are the <b>edges</b> — and both need judgement.</p>
```

### Full-bleed quote

```html
<section class="frame"><div class="slide slide--quote"><div class="slide-inner">
  <p class="eyebrow">Act 5 · Why study endures</p>
  <blockquote class="bigquote">"I remember the books no more than the meals; <b>yet they made me.</b>"</blockquote>
  <p class="quote-attr"><b>Emerson</b>, attributed — the wording is uncertain, which is almost the point.</p>
  <div class="pagefoot"><span class="pagenum"></span></div>
</div></div></section>
```

---

## Interactions & keyboard

All wired up automatically by `browserslides.js` on load.

- **Navigation:** `→` / `↓` / `PageDown` / `Space` go to the next slide; `←` / `↑` / `PageUp` go back; `Home` jumps to the first slide, `End` to the last. Keys are ignored while typing in an input/textarea. Navigation is smooth-scroll unless the user prefers reduced motion.
- **Nav dots:** one dot per slide in the `.dots` rail; the active slide's dot is highlighted (tracked via `IntersectionObserver`). Click a dot to jump.
- **Detail layers:** click, Enter, or Space on a `.bottomline` opens its `.detail-layer`; the `.layer-close` button or **Esc** closes any open layer. Focus moves to the close button on open.
- **Cross-reference previews:** hovering an `a.goto` on the desktop shows a live mini-clone of the target slide; clicking jumps. On touch devices the first tap previews and the second tap jumps. Scrolling dismisses a preview.
- **Zoomable images:** clicking an `img.zoomable` opens a full-viewport lightbox; click it or press **Esc** to close.
- **In-slide lightboxes:** a `.shot-link[data-shot]` opens the matching `.shot-layer` overlay; click the layer or press **Esc** to close.
- **Image-stack pinning:** clicking a `.stack-card` pins it to the front (adds `.pinned`); clicking another moves the pin.
- **Theme toggle:** a `[data-theme-toggle]` button flips `data-theme` between `light` and `dark` on `<html>`, switching the stage (and any theme rules keyed off `data-theme`).
- **Portrait hint:** on narrow portrait screens `#rotate-hint` overlays a "turn your phone" prompt; tapping it dismisses the overlay.

---

## Accessibility & printing

- **Reduced motion** is respected: scroll behaviour falls back to instant, and the tooltip and rotate-hint animations are disabled under `prefers-reduced-motion: reduce`.
- **ARIA & roles** are set where it matters: generated charts get `role="img"` and an `aria-label` (pass `ariaLabel` to `barChart`); the nav rail is labelled and its dots carry per-slide labels; `.bottomline` strips get `role="button"` and are keyboard-focusable; focus is managed when detail layers open.
- **Semantic HTML:** slides are ordinary `<section>` / `<h1>`/`<h2>` / `<ul>` / `<figure>` markup with no framework wrappers beyond the `.frame` → `.slide` → `.slide-inner` skeleton, so content stays readable to assistive tech and degrades gracefully. Because everything is one self-contained document with real text, printing and "save as PDF" work without a build step.
```