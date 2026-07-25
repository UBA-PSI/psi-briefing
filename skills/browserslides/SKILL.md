---
name: browserslides
description: Build polished 16:9 presentation decks as a single self-contained HTML file – no framework, no build step, no dependencies. Use when the user wants to create a slide deck, presentation, talk, or retrospective as HTML/in the browser, wants slides that scale to any screen, mentions "browserslides", or wants to turn notes/an outline into slides. Assembles slides from a component catalog, themes them with design tokens, and can inline everything into one shareable file.
---

# browserslides

A dependency-free framework for presentation decks that live in one self-contained HTML file and scale pixel-perfectly to any screen. This skill lets you author such decks reliably.

## The two ideas that make it work

1. **Container-query scaling.** Every slide is a `16:9` box with `container-type:size`. Everything inside is sized in `cqw` (1% of slide width) / `cqh` (1% of slide height) – never px/rem. So the whole layout scales *proportionally* with the slide and looks identical on a laptop, a projector, or a phone in landscape. When you size anything custom inside a slide, **use cqw/cqh, never px**.
2. **Semantic design tokens.** Colours and fonts are CSS variables (`--accent`, `--ink`, `--highlight`, `--font-display`…). A theme is only a `:root{}` override. Re-skinning is a one-file change – including the JS-generated SVG charts, which read tokens at draw time.

## First: does the content fit this framework?

browserslides shines for **reference / report content meant to be read** – retrospectives, project documentation, research summaries, whitepapers, lecture notes, data-driven decks. That is where slidedocs work: the source already has sections, data, comparisons, definitions to arrange densely.

It is a **poor fit for a sparse performance talk** – a short spoken keynote driven by timing, delivery, and question→answer beats. Forcing such a talk into dense slides fights its dramaturgy; making it sparse just yields empty slides. If the user brings that kind of content, say so and suggest either a genuinely document-shaped source, or a different tool.

## Default style: slidedoc, not sparse slides

Unless the user asks for a sparse "presentation" look, **build slidedocs** (in the Duarte sense): text-dense slides that *fill the frame* with well-arranged blocks – the reading-oriented look of the original retro decks. Draw generously on the source material; a near-empty slide with one line is usually wrong for this framework.

- Reach first for the text-block layouts: `.cols` grids holding `.prose` and `.panel` blocks, plus `.editorial-layout`, `.principle-columns`, `.twocol`, `.net`, `.cardcol`, `.facts`, `.kulissen`, `.delta`.
- Free paragraphs **must** be wrapped in `.prose` (a bare `<p>` falls back to 16px and won't scale).
- Use the big `.slide--statement` / `.slide--question` / `.slide--quote` slides *sparingly*, for a deliberate beat – not as the default for content.
- Aim to fill the vertical space. **This is the single most common failure mode** – see "Filling the frame" below before you build.

## Filling the frame (read this – the most common failure)

The default result of a first draft is slides whose content sits in the top half with a large dead band above the footer. `.cols` carries `flex:1`, but it also carries `align-content:start`: the **container** stretches to full height, the **content row inside it does not**. So "the component has flex:1" does *not* mean the slide is full.

**Do not fix this by stretching boxes.** Adding `flex:1` to `.panel`, `.shots`, or `.col` children makes measurements look great and the slide look *worse*: a bordered panel stretched to full height with three lines at the top frames the emptiness, and stretched `.imgwrap` images blow up, crop badly, and can push their text sibling out of the slide. Verified experimentally – the framework's `align-content:start` is correct, not a bug.

Fix it with content, in this order:

1. **Add real content.** Thin slides usually mean the source was over-compressed. Go back and take more from it – the detail you cut, the image you skipped. This is almost always the right answer.
2. **End the slide with a `.punch`.** It carries `margin-top:auto`, so it pins to the bottom and closes the dead band – *and* it forces you to state the slide's takeaway, which is good slidedoc practice anyway. The densest-reading slides in a well-built deck usually end this way.
3. **Give images more room.** A `.shots` grid inside the narrow side of `cols--wide-left` renders postage stamps. Use `cols--2`, or put the images on the wide side.
4. **Merge two thin slides** into one dense one. Fewer, fuller slides beat more, emptier ones.
5. **`cols--center`** only when the content is genuinely short and you have nothing honest to add. It *balances* whitespace rather than removing it – a last resort, not a fix.

Beware: a component with `flex:1` (`.flow`, `.cols`) will **overlap** a sibling you add after it rather than push it down. That overlap does not register as overflow – check for it (recipe below).

## Writing the words

Slide text is read, not skimmed past – weak prose shows more here than in a document, because there is so little of it. Write plainly and specifically.

- **Be specific, not impressive.** "36 laptops per trolley" beats "a substantial fleet of devices". Never trade a concrete fact for an abstraction.
- **Don't assert importance.** Cut "crucial", "pivotal", "essential", "key". If something matters, the fact itself shows it. Same for "seamless", "robust", "powerful", "comprehensive".
- **Avoid the AI vocabulary.** delve, leverage (verb), utilize, showcase, underscore, highlight (verb), foster, tapestry, landscape (figurative), ecosystem (figurative), testament, vibrant, intricate, streamline, harness, paradigm. Use the plain word: *use*, *show*, *support*.
- **No "-ing" narration.** Facts don't "underscore" or "highlight" anything; only people do. Write "The trolley holds 36 laptops." – not "…, highlighting the scale of the setup."
- **No rule-of-three padding.** "researchers, practitioners, and innovators" is almost always one real item plus two for rhythm.
- **No negative parallelism.** "It's not X – it's Y", "not only… but also", "Not X. Not Y. Just Z." One per deck at most; zero is better.
- **No rhetorical self-Q&A.** "The result? Chaos." Just state it.
- **No filler transitions.** "It's worth noting", "Importantly", "Notably", "That said". Say the thing.
- **Sentence case for headings**, not Title Case. Bold sparingly, for genuine emphasis – a slide where six phrases are bold has no emphasis at all.
- **Vary sentence length.** Uniform medium-length sentences are the clearest tell of generated text.

A bullet whose text is a full clause usually wants to *be* a sentence; a bullet that is three words usually wants to be merged with its neighbour.

**Don't announce, name.** Headings and labels that advertise their own importance are the deck equivalent of marketing copy. They promise something instead of saying it, and they cost a line that could have carried content.

| Announcing | Naming |
|---|---|
| "Die goldene Regel" | State the rule: "Nie ohne die technische Leitung" |
| "Das Wichtigste in fünf Punkten" | "Fünf Regeln für die Aufsicht" |
| "Drei Dinge, die wirklich zählen" | Name the three things |
| "Gut zu wissen" / "Übrigens" | Say what it is: "Erklärvideo für Prüflinge" |
| "Ehrlich gesagt" / "Was wirklich zählt" | Delete; then write the sentence |
| "Startet nicht? Zwei Ursachen" | "Wenn der Laptop nicht startet" |

The last row is the rhetorical self-Q&A from the list above, wearing a label. A question you invented in order to answer it is never orientation.

**Eyebrows are optional; treat them that way.** `.eyebrow` is a kicker for the rare slide that needs orientation its heading cannot carry – a step number inside a long numbered procedure, say. It is not a slot to fill on every slide.

An eyebrow on 19 of 23 slides is wallpaper: the eye stops reading it by slide four, and it has taken a line of vertical space from every slide to say nothing. Two specific redundancies to watch:

- **Restating the section.** After a `.slide--divider` announced "Teil 2 · Aufbau des Prüfungsraums", an eyebrow reading "Teil 2 · …" on each following slide repeats what the reader was just told. Drop the part, keep at most the part that changes ("Schritt 6").
- **Restating the heading.** Eyebrow "Gedrucktes Prüfungsmaterial" above the heading "Was die Prüfer*in bereitstellt" says the same thing twice. Delete the eyebrow.

Before keeping an eyebrow, ask what a reader would lose if it were gone. If the answer is nothing, it is decoration. Note that deleting eyebrows lowers ink fill slightly – that is the correct trade, and the fix is content, never re-adding chrome.

## Typography

The framework handles the scale; these are the choices it cannot make for you.

**Quotation marks.** Use real typographic marks, matched to the deck's language:

| | Opening | Closing |
|---|---|---|
| German | `„` U+201E (low) | `“` U+201C (high) |
| English | `“` U+201C | `”` U+201D |

German's closing mark is the same character as English's opening one, which is why it is so often got wrong. A straight `"` as the closing mark is **always wrong** and is the most common typo in a German deck, usually inherited from pasted source text. Grep for it before you ship. Apostrophes are `’`, never `'`.

Straight quotes stay straight inside code: a `<script>` block, a class name, a file path, an `alt` attribute delimiter. Convert the words on the slide, not the markup around them.

**Dashes.** Use the en dash `–` for parenthetical breaks, spaced in German (`Wort – Wort`), and unspaced for ranges (`2–3`, `1994–2003`). **Never use the em dash `—`**; it is wrong in German typography and a tired tic everywhere else. Hyphens stay hyphens (`E-Prüfung`).

**Type size.** `--type-scale` in `:root` multiplies every body and label size at once (display sizes stay fixed). Slides are read from across a room – err large. If a slide only fits at a smaller size, the slide has too much on it; split it rather than shrinking the type.

**Line length.** Keep running text under **100 characters per line**; 50–75 reads best. Long lines come from full-width text, so the fix is usually structural (columns, or `.lede`), not a smaller font – shrinking type to fit *more* characters on a line makes it worse in both directions.

**Full-width text belongs in the header or the footer.** Under the heading use `.lede` (capped at 58cqw, so the measure stays short); at the bottom use `.punch`. Everything between belongs in columns, panels, or a component. A bare full-width `.prose` block spanning the whole slide is a layout mistake.

**Serif sparingly.** `--font-display` is for display moments only: `h1`/`h2`, `.divider-title`, `.divider-num`, `.statement`, `.bigquote`, the editorial hero. Repeated small headings (`.panel h3`, `.net h3`, `.editorial-item h3`, …) are set in the body sans at weight 600 – a page of small serif headings looks fussy and reads worse at distance.

**Fonts must be embedded.** A theme that merely *names* a font silently falls back to whatever the OS has – the Bamberg theme asked for Copse and rendered Georgia for months without anyone noticing, because the fallback is plausible. Naming a font is not loading it.

Embedding needs no tooling. Fetch the woff2, base64 it, and paste an `@font-face` at the top of the theme file:

```bash
curl -s "https://fonts.googleapis.com/css2?family=Copse" \
  -H "User-Agent: Mozilla/5.0 Chrome/120" | grep -oE 'https://[^)]+\.woff2'
curl -s "<that-url>" -o font.woff2
python3 -c "import base64,pathlib; print(base64.b64encode(pathlib.Path('font.woff2').read_bytes()).decode())"
```

```css
@font-face {
  font-family: 'Copse';
  font-style: normal; font-weight: 400; font-display: swap;
  src: url(data:font/woff2;base64,<paste>) format('woff2');
}
```

Keep the `@font-face` **in the theme file**, so a theme stays one self-contained thing. If two themes want the same face, each embeds it; ~20 KB duplicated beats a broken fallback. Then verify in the browser – never by eye, since the fallback looks fine:

```js
document.fonts.check('16px Copse')   // must be true
```

**Line breaking: `pretty` for text, `balance` for labels.** `text-wrap: balance` evens out line lengths. That is right for a short display string of two or three lines (a heading, a caption, a label) and **wrong for running text or a wide band** – it makes every line short and leaves the container looking half empty, which is the usual cause of "why is there so much yellow to the right of my `.punch`". Running text and full-width bands use `text-wrap: pretty`, which fills each line normally and only guards the last one. The framework sets this; don't override it per slide.

That fixes the pathological case but not a genuinely short last line. A one-sentence `.punch` whose second line holds three words still looks like a hole. This is a writing problem, not a layout one, and it is measurable – the audit below flags any band whose last line falls under a quarter of the width. Tighten the sentence, or let it run to fill two full lines.

**Letterspacing: a little, not a lot.** Uppercase labels need *some* tracking to stop the caps colliding, but past roughly `0.12em` the word stops reading as a word and becomes separate letters. Keep uppercase labels near `0.08–0.11em`. The framework's own defaults were far too loose (`.eyebrow` sat at `0.28em`) and were pulled back; if you add an uppercase element, stay in that range. Long German compounds are the test case: at `0.2em`, "ERKLÄRVIDEO FÜR PRÜFLINGE" wraps to two lines and crowds its own box; at `0.08em` it fits on one.

**Ink on a tinted fill comes from the fill.** Accent blue on a yellow background is two saturated colours competing and neither winning. Text on a tint is near-black *in that tint's own hue*, so emphasis reads as weight rather than as a second colour. Two pairs exist, both mixed from the theme colour with `color-mix`, so re-theming carries them along:

| Fill | Body ink | Emphasis |
|---|---|---|
| `--highlight-soft` (warm: `.punch`, `.panel--hl`) | `--highlight-ink` | `--highlight-ink-em` |
| `--accent-20` (cool: `.punch--accent`) | `--accent-soft-ink` | `--accent-soft-ink-em` |

The percentages are picked so body and emphasis stay a visible step apart (about 8:1 and 11:1 against their own fill) – check that when you add a tint, or the emphasis stops registering. Never hand-colour text on a tinted fill.

**Links.** The framework styles links on a slide: accent colour, a thin underline pushed clear of the descenders, and – importantly – the same colour when visited. Never leave a slide link to the browser default: a followed link renders purple, which on a yellow `.punch` or `.panel--hl` reads as a mistake.

Every link that leaves the deck needs `target="_blank" rel="noopener"`. A deck is usually presented or read full-screen; navigating away in the same tab strands the reader with no way back to the slide.

**Vertical alignment: three separate questions.** They are easy to conflate, and each has its own modifier.

| Question | Answer |
|---|---|
| Is the whole row too high in the slide? | `.cols--center` – moves the row as a block |
| Do two columns of different length hang from the top? | `.cols--middle` – centres each column's content |
| Does a fixed-height cell look top-heavy? | `.net--middle` – centres the content inside the cell |

All three centre *content*; none of them shrinks its container. Reach for them when a row is uneven, not as a default. A quick way to find candidates: measure the painted height of each column in a row, and treat anything over ~20 % difference as worth centring.

**Levelling side-by-side boxes.** Panels that end within a few percent of each other look careless; the runtime levels them automatically (`equaliseRows`, tolerance 28 %). Panels of genuinely different length are deliberately left alone, because stretching a short panel to match a long one just draws a border around empty space. You do not need to do anything – but if you want two boxes level, make their text roughly the same length, and the runtime will do the rest.

**Never hard-code the width of a content-sized column.** A track like `grid-template-columns: 7cqw 1fr` is a guess about how long the labels will be. It holds for the labels you had in mind and shreds anything longer: in `.tl` a 7cqw label cell broke "kurz vor 0" over two lines. Size the label track to its content instead, and let the list own the tracks so rows stay aligned:

```css
.tl      { display: grid; grid-template-columns: minmax(7cqw, max-content) 1fr; }
.tl li   { display: grid; grid-template-columns: subgrid; grid-column: 1 / -1; }
.tl time { white-space: nowrap; }   /* the label is an atom */
```

`minmax(floor, max-content)` keeps a sensible minimum and grows for the longest entry; `subgrid` shares the parent's tracks so every row lines up without anyone guessing a number. Apply the same shape to any label/value pair. The audit's `crampedLabels` check below catches the class when it slips through.

**The gutter needs more room than it looks like it needs.** In a two-column slide the gutter is the only thing keeping two blocks of text apart. If it gets close to the width of a word space, the eye reads straight across the gap and the columns fuse into one ragged block. It should read as a deliberate channel, not as a slightly larger word space – the framework's `4.8cqw` is a floor, not a target.

Watch for modifiers that *eat* the gutter. `.panel--flush` and `.panel--marker` bleed leftwards by their own padding, which is what lines their text up with the column above them; but in a **right-hand** column that bleed comes straight out of the gutter. Here it cut a 3.5cqw gutter to an effective 1.15cqw and the two columns visibly collided. The framework now drops the bleed when the call-out is the only thing in its column (nothing to line up with anyway) – if you build a similar modifier, apply the same rule.

**Spacing.** Keep the vertical rhythm consistent – the same gap between a heading and its content on every slide, the same gap between stacked blocks. Horizontal gutters between columns should be visibly wider than the padding inside a panel; otherwise columns read as one block. Never crowd an image against text: the gutter is what separates them.

**Images.** Every image on a slide is click-to-zoom automatically (the runtime opens a lightbox with the caption). Nothing to add – no `zoomable` class needed. So always write a real `alt` or `figcaption`: it becomes the lightbox caption.

## Two ways to build one

**By hand**, slide by slide, from the component catalog – the workflow below.
Full control, and the only option for a slide that needs an unusual layout.

**From Markdown**, with `tools/md-to-deck.mjs` from the repo (not part of this
skill's own files): write the deck as a document and let the converter pick the
components from the shape of the content – three `###` blocks become three
columns, four become a `.net` grid, a `> blockquote` becomes the closing
`.punch`. It emits ordinary browserslides HTML that you then hand-tune, so the
two ways compose rather than compete.

Prefer Markdown when the source is already document-shaped (a report, notes, a
procedure) and there are more than a handful of slides: it keeps divider
numbering and the title-slide TOC in sync automatically, normalises the
typographic marks listed below, and reports the fill problems this file tells
you to look for. Reach for hand-building when the deck is short, or when most
slides need a component the converter would have to be told about anyway. The
rules in this file still apply either way – the converter follows them, it does
not replace them. `docs/markdown.md` in the repo is the authoring reference.

## Workflow

1. **Scaffold.** Copy `references/starter.html` and `references/assets/` (browserslides.css, browserslides.js, and a theme) into the deck's folder. During authoring, keep the CSS/JS *linked* (readable); inline only at the end. Browsers cache linked assets aggressively – if an edit to the CSS/JS seems to have no effect, add a `?v=N` query to the `<link>`/`<script>` and bump it, rather than debugging a stale file.
2. **Structure the talk.** One `<section class="frame">` per slide. Give the deck a shape: title → section dividers (`.slide--divider`, big number) → content → closing. Keep divider numbering and any table of contents in sync.
3. **Build each slide** by copying a component from the catalog below; `references/components.md` has the full markup for every one. Match the exact class names. Every slide follows the skeleton:
   ```html
   <section class="frame"><div class="slide"><div class="slide-inner">
     <!-- <p class="eyebrow">Kicker</p>   optional - usually omit -->
     <h2>Slide title</h2>
     <!-- one component here -->
     <div class="pagefoot"><span>Footer</span><span class="pagenum"></span></div>
   </div></div></section>
   ```
   `.slide-inner` is a flex column; components with `flex:1; min-height:0` fill the remaining height. `.pagenum` auto-fills to "n / total".
4. **Add the chrome once**, at the end of `<body>`: `<nav class="dots">`, `<div class="hint">`, optional `#rotate-hint`, then `<script src="…/browserslides.js">`, then any `Browserslides.barChart(...)` calls.
5. **Theme it.** Pick `bamberg.css` (blue/yellow) or `midnight.css` (dark), or make one: copy a theme, change `--accent` + the `--accent-80/60/40/20` tint ramp, `--accent-ink`, and `--font-display`/`--font-body`. Fonts default to the system stack.
6. **Verify in a browser.** Serve with `python3 -m http.server` and load it (Playwright/Chrome blocks `file://` for local assets). Check: one `<section>` per slide, exactly one SVG per chart box, page numbers count correctly, no broken images.

   Then run this audit in the page – it catches the three things eyeballing misses (dead space, overlap, overflow):

   ```js
   const rep = { thin: [], overlap: [], overflow: [], deadBand: [] };
   document.querySelectorAll('section.frame').forEach((sec, i) => {
     const slide = sec.querySelector('.slide'), inner = sec.querySelector('.slide-inner');
     const foot = sec.querySelector('.pagefoot'), n = i + 1;
     if (inner.scrollHeight - inner.clientHeight > 1) rep.overflow.push(n);
     const blocks = [...inner.children].filter(el => !el.classList.contains('pagefoot'));
     for (let a = 0; a < blocks.length; a++) for (let b = a + 1; b < blocks.length; b++) {
       const r1 = blocks[a].getBoundingClientRect(), r2 = blocks[b].getBoundingClientRect();
       if (Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top) > 2 &&
           Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left) > 2) rep.overlap.push(n);
     }
     if (slide.className.replace('slide', '').trim()) return;   // skip title/divider
     const top = inner.getBoundingClientRect().top;
     const end = foot ? foot.getBoundingClientRect().top : inner.getBoundingClientRect().bottom;
     const band = inner.querySelector('.punch, .change-strip, .tracker');
     let ink = top;
     inner.querySelectorAll('*').forEach(el => {
       if (el.closest('.pagefoot')) return;
       const cs = getComputedStyle(el), r = el.getBoundingClientRect();
       const paints = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px'
                   || el.tagName === 'IMG' || (!el.children.length && el.textContent.trim());
       if (paints && r.height && r.bottom <= end + 2) ink = Math.max(ink, r.bottom);
     });
     const fill = Math.round((ink - top) / (end - top) * 100);
     if (fill < 85) rep.thin.push({ n, fill });

     // A bottom-pinned band hides the gap above it from `fill`: the band's own
     // bottom edge IS the deepest ink, so the number reads ~97 % while the
     // slide's content stops half way down. Measure inside the content row
     // instead, and compare the slack ABOVE the content with the slack BELOW.
     // Equal slack means the row is deliberately centred (cols--center, or a
     // component like .delta that centres itself) - that is balanced
     // whitespace, not a fault. Only content hanging from the top with a big
     // gap under it is the real thing. Without that filter this fires on every
     // centred row: 7 hits / 2 of them false on a finished deck, versus 5 / 0.
     const row = [...inner.children].find(el => el !== band
       && !el.classList.contains('pagefoot') && !/^(H1|H2|P)$/.test(el.tagName));
     if (band && row) {
       const rr = row.getBoundingClientRect();
       let lo = Infinity, hi = -Infinity;
       row.querySelectorAll('*').forEach(el => {
         const cs = getComputedStyle(el), r = el.getBoundingClientRect();
         const paints = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px'
                     || el.tagName === 'IMG' || (!el.children.length && el.textContent.trim());
         if (paints && r.height) { lo = Math.min(lo, r.top); hi = Math.max(hi, r.bottom); }
       });
       if (isFinite(lo)) {
         const above = Math.round((lo - rr.top) / (end - top) * 100);
         const below = Math.round((rr.bottom - hi) / (end - top) * 100);
         if (below >= 12 && below - above >= 8) rep.deadBand.push({ n, above, below });
       }
     }
   });
   rep;   // want: thin/overlap/overflow/deadBand all empty
   ```

   Aim for **≥85 % ink fill** on content slides; treat anything under that as a slide needing more content (see "Filling the frame"). Note that measuring alone is not enough – always *look* at a few slides too, because a stretched-but-empty box scores well and reads badly. Screenshot **individual slides** (`.slide` elements), not `fullPage`: scroll-snap makes full-page captures stitch duplicated frames.

   **Read `deadBand` before you trust `thin`.** `thin` finds the deepest painted pixel, and on a slide that ends with a `.punch` that pixel is the band's bottom edge – which `.cols { flex: 1 }` has already pushed down to the footer. So the number reads ~97 % no matter how much empty space sits between the content and the band. Measured on a finished 23-slide deck: five slides scored 97 % while their content stopped at 55–71 %, leaving 13–26 % of dead space under it.

   This matters because adding a `.punch` is *recommended* above as fix #2 for a thin slide. It genuinely closes the bottom of the frame and states the takeaway – but it also silences the metric, so a slide can be "fixed" from 74 % to 97 % without a word being added to its middle. That is the same shape of failure as the stretched container in "Filling the frame", one level up: the band is real content, yet the number it produces is not about the slide being full.

   Treat a `deadBand` hit exactly like a `thin` one – the answer is content in the row, not chrome at the bottom. Note that `cols--center` **suppresses** the check by design: once you have decided to balance the whitespace, the gap is symmetric and deliberate.

   Then check the typography – these are mechanical, so never eyeball them:

   ```js
   const txt = [...document.querySelectorAll('.slide')].map(s => s.innerText).join('\n');
   ({
     emDashes:      (txt.match(/—/g) || []).length,        // must be 0 — use –
     straightQuote: (txt.match(/"/g)  || []).length,        // must be 0 — use „ … “
     openQuotes:    (txt.match(/„/g)  || []).length,        // must equal closeQuotes
     closeQuotes:   (txt.match(/“/g)  || []).length,
     apostrophes:   (txt.match(/'/g)  || []).length,        // must be 0 — use ’
     fontEmbedded:  document.fonts.check('16px Copse'),     // name your display font
     // check EVERY running-text component, not just the obvious ones: a caption
     // under a full-width gallery is the classic 130-character line
     longLines: [...document.querySelectorAll(
       '.slide .prose p, .slide .lede, .slide .punch, .slide .gallery-note,' +
       '.slide figcaption, .slide .change-strip, .slide .source, .slide .note'
     )].filter(el => {
       const cs = getComputedStyle(el);
       return el.getBoundingClientRect().width / (parseFloat(cs.fontSize) * 0.5) > 100;
     }).map(el => el.className || el.tagName),              // must be empty

     // A band whose last line is a stub leaves a visible hole. Rewrite the
     // sentence so it fills its lines - do not "fix" it with balance.
     widows: [...document.querySelectorAll('.slide .punch, .slide .change-strip, .slide .lede')]
       .filter(el => {
         const r = document.createRange(); r.selectNodeContents(el);
         const rects = [...r.getClientRects()].filter(x => x.width > 1);
         if (rects.length < 2) return false;
         const lines = {};
         rects.forEach(x => {                                // group fragments into lines
           const k = Object.keys(lines).find(k => Math.abs(k - x.top) < 4) ?? Math.round(x.top);
           lines[k] = lines[k] || { l: Infinity, r: -Infinity };
           lines[k].l = Math.min(lines[k].l, x.left); lines[k].r = Math.max(lines[k].r, x.right);
         });
         const w = Object.values(lines).map(l => l.r - l.l);
         const cs = getComputedStyle(el);
         const inner = el.getBoundingClientRect().width
                     - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
         return w.length > 1 && w[w.length - 1] / inner < 0.25;
       }).map(el => el.textContent.trim().slice(0, 40)),

     // A short label that STILL wraps means its cell is too narrow - almost
     // always a hard-coded track width meeting content it was not sized for.
     // The filters matter: without them this drowns in false positives from
     // <b> runs breaking mid-paragraph (inline) and display headings (h1-h6),
     // neither of which is a fault.
     crampedLabels: [...document.querySelectorAll('.slide *')].filter(el => {
       if (el.children.length) return false;                     // leaf text only
       const t = el.textContent.trim();
       if (!t || t.length > 24 || /^H[1-6]$/.test(el.tagName)) return false;
       if (el.closest('.pagefoot, .slide-preview')) return false;
       if (getComputedStyle(el).display === 'inline') return false;   // run inside prose
       if (!/grid|flex/.test(getComputedStyle(el.parentElement).display)) return false;
       const slideW = el.closest('.slide').getBoundingClientRect().width;
       if (el.getBoundingClientRect().width / slideW * 100 > 14) return false;
       const r = document.createRange(); r.selectNodeContents(el);
       const tops = [];
       [...r.getClientRects()].filter(x => x.width > 1 && x.height > 1)
         .forEach(x => { if (!tops.some(v => Math.abs(v - x.top) < 3)) tops.push(x.top); });
       return tops.length > 1;                                   // short string, >1 line
     }).map(el => el.textContent.trim())                         // must be empty
   })
   ```
7. **Make it self-contained (for sharing).** Fold the CSS/JS and images into the HTML so the deck is one file. With the repo checked out, `node tools/inline-deck.mjs deck.html -o deck.self-contained.html` does it; otherwise inline by hand – paste each stylesheet into a `<style>`, the runtime into a `<script>`, and replace every local `src="…"` with a `data:` URI. Fonts should already be embedded in the theme (see Typography).

   **Only *local* assets get inlined.** `inline-deck.mjs` deliberately leaves remote URLs alone – it cannot know whether `https://…/photo.jpg` is yours to embed. So a deck whose images are linked from a web server comes out of the tool looking self-contained and still fails offline. Download those files next to the deck and rewrite the `src` attributes to relative paths *before* inlining:

   ```bash
   # from the deck's folder, for images under imgs/
   curl -s --create-dirs -o imgs/photo.jpg https://example.org/deck/imgs/photo.jpg
   # then strip the origin from every src in the HTML, e.g.
   #   src="https://example.org/deck/imgs/…"  ->  src="imgs/…"
   ```

   Verify by loading the result and asking the page what it actually fetched – a self-contained deck requests nothing:

   ```js
   performance.getEntriesByType('resource').filter(e => !e.name.startsWith('data:'))
   // must be []  (and check no <img> is broken, and document.fonts.check(...) is true)
   ```

   Expect the file to be large: images as base64 grow by about a third, so a deck with 20 photos lands around 8 MB. Most of that is detail nobody can see – a slide is 16:9 and an image rarely spans more than half of it, so camera-resolution photographs are wasted. Re-encode first:

   ```bash
   tools/build-deck.sh deck.html            # optimise, inline, verify
   ```

   The script runs both tools and then checks the result, which is the step that actually matters: it exits non-zero and names the files if anything external survived. Without an encoder installed it says so, skips the image step, and still produces a valid file. The two tools are also callable on their own:

   ```bash
   node tools/optimise-images.mjs deck.html -o deck.opt.html    # WebP, capped width
   node tools/inline-deck.mjs      deck.opt.html -o deck.self-contained.html
   ```

   On the deck above that turned 8.26 MB into 3.31 MB with no visible loss – verified by zooming into a form screenshot with 8pt text, which survived quality 82 intact. Pick `--max-width` by measuring rather than guessing: find the widest image as a fraction of its slide, and multiply by the widest screen you will present on (a 4K display is ~3800 px). The default 1600 covers an image spanning ~43 % of a slide on 4K.

   The tool is separate because WebP cannot be encoded from plain Node: it shells out to `cwebp` or `magick`, which keeps `inline-deck.mjs` dependency-free, and it lets you look at the re-encoded files before they vanish into a data: URI.

## Component quick-reference

Copy the matching block from `references/components.md`. Pick by intent:

| Need | Component (key classes) |
|------|-------------------------|
| Free text that scales | `.prose` (+ `--lead` / `--dense`); wrap every bare paragraph |
| Full-width lede under the heading | `.lede` – the *only* full-width body text; capped at 58cqw |
| Arrange text blocks | `.cols` (+ `--2` / `--3` / `--wide-left` / `--wide-right`) with `.col` children |
| Centre a short row in the slide | `.cols--center` (moves the whole row) |
| Line up a text block with a taller image | `.cols--middle` (centres each column's content) |
| Stop equal-height cells looking top-heavy | `.net--middle` (centres the content inside each cell) |
| A grouped text card | `.panel` (+ `--plain` / `--hl`) |
| Call-out flush with the column text | `.panel--flush` (tinted, bleeds into the margin) or `.panel--marker` (no fill, highlighter rule) |
| Opening slide | `.slide--title` + `.title-grid`, `.title-strip`, `.toc`, `.takeaway` |
| Section break | `.slide--divider` + `.divider-num`, `.divider-title`, `.divider-lead` |
| Big numbers | `.facts` + `.fact`, `.fact--hero`, `<sup>` |
| Two timelines / plan vs reality | `.twocol` + `.tl` + `time` + `.sub` |
| Highlighted takeaway line | `.punch` (warm) or `.punch--accent` (cool); one tone per deck |
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

**Narrative / talk components** (for argument-driven talks – questions, reveals, a running thesis, cited studies):

| Need | Component (key classes) |
|------|-------------------------|
| A big rhetorical question | `.slide--question.slide--statement` + `.statement` + `.statement-kicker` (accent panel, highlight emphasis) |
| A big statement / reveal | `.slide--statement` + `.statement` (+ `.statement--answer` for a highlight underline); `.statement small` adds a supporting line |
| A cited study/stat | `.facts` + `.fact--hero` for the numbers, then `.source` (with `<b>` author + `<a>` link) |
| The talk's key points, filling up | `.tracker` + `.tracker-item` (add `.done`) + `.t-dot` – repeat with more `.done` each recap slide |
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
Bar/marker `color` accepts a raw colour **or** a `--token` name (recommended, so it follows the theme). Charts read theme tokens at draw time – a live theme switch needs `redraw()`.

## Rules & gotchas

- **cqw/cqh only** inside a slide. A stray `px` breaks the scale-to-any-screen promise.
- **Keep one `<section class="frame">` per slide.** Divider numbering and TOC must match the actual section order.
- The runtime is **not idempotent** (it appends). Never re-run it on an already-rendered DOM, and never take a browser "Save As" DOM dump as your source – charts and dots will double. Edit the source HTML.
- If two versions of a deck exist (e.g. public vs internal), make every content change in **both**.
- Respect the footer/version convention if the user has one; keep any version marker consistent across all slides.
- Don't invent class names. If a layout isn't in the catalog, compose from existing components or add a small scoped `<style>` block using cqw/cqh + tokens.

## Files in this skill

- `references/starter.html` – a minimal working deck to copy.
- `references/assets/` – `browserslides.css`, `browserslides.js`, `bamberg.css`, `midnight.css`.
- `references/components.md` – the full component catalog with copy-paste snippets.

That is everything the skill needs; it does not depend on the repo or on any other skill. The [psi-browserslides](https://github.com/) repo adds optional extras – `docs/tutorial.{en,de}.md`, and `tools/embed-fonts.mjs` / `tools/inline-deck.mjs`, which automate the font-embedding and inlining steps this file describes by hand.
