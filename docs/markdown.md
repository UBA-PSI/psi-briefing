# Writing a deck in Markdown

`tools/md-to-deck.mjs` turns a Markdown document into a browserslides deck. You
write a document; it picks the components.

```bash
node tools/md-to-deck.mjs deck.md -o deck.html
python3 -m http.server 8000          # then look at it
tools/build-deck.sh deck.html        # when you want one shareable file
```

The output is ordinary browserslides HTML — readable, and safe to edit by hand
afterwards. Re-running the converter overwrites it, so keep the `.md` as the
source of truth and hand-edit only once you have stopped converting.

## Why inference and not a template language

The component is chosen from the *shape* of the content, before anything is
rendered. Three equal-ranked `###` blocks are three parallel points, so they
become three columns; four become a bordered 2×2 grid; a blockquote is the
slide's takeaway, so it becomes the `.punch` band at the bottom.

That ordering is deliberate. `docs/handoff-autolayout.md` records what happened
when layout was driven by measuring rendered slides instead: the cheapest way
to raise a fill score is to stretch containers, which lifted median ink fill
from 74 % to 96 % and made the deck visibly *worse*, because a stretched
bordered panel frames the empty space rather than removing it. Reading the
content's structure needs no such score.

## The document

### Slide boundaries

| Markdown | Becomes |
|---|---|
| `# Heading` (first one) | the title slide |
| `# Heading` (each later one) | a section divider, numbered automatically |
| `## Heading` | one content slide |
| `---` on its own line | a slide break, for a slide with no heading |

Dividers are numbered in document order and the title slide's table of contents
is built from their headings. Neither can drift out of sync with the other,
which is the one bookkeeping error the hand-written decks kept making.

Frontmatter, if present, must start on line 1:

```yaml
---
title: Ablauf der Aufsicht einer E-Prüfung
subtitle: Von der Absprache bis zum Abbau.
footer: Aufsicht E-Prüfung · psi-exam
lang: de                 # de (default) or en - picks the quotation marks
theme: bamberg           # themes/<name>.css
assets: assets/          # a folder holding browserslides.css/js + the theme
strip:                   # the numeric strip on the title slide
  - "17: Schritte am Prüfungstag"
  - "4: Rollen"
takeaway: A single sentence for the title slide's right-hand card.
fill: 85                 # target ink fill in %, default 85
typescale: 1.2           # --type-scale override
punch: accent            # use the cool band tone throughout
---
```

`css` and `js` take explicit paths if `assets` + `theme` do not fit your layout.

### Attributes

One optional `{…}` line directly under a slide heading:

```markdown
## Der Countdown bis zum Start
{#kuverts eyebrow="Schritte 9–11"}
```

| Attribute | Effect |
|---|---|
| `{#anchor}` | gives the slide an id, so `[text](#anchor)` can link to it |
| `{eyebrow="…"}` | adds a kicker — leave it out unless it earns its line |
| `{footer="…"}` | overrides the deck footer on this slide |
| `{.statement}` | adds a class to the `.slide` element |
| `{keep}` | exempts the slide from layout corrections |

Eyebrows are never generated. An eyebrow on nearly every slide is wallpaper;
the framework's own rule is that it must carry orientation the heading cannot,
like a step number inside a long numbered procedure.

## What shape becomes what

| You write | You get |
|---|---|
| two `###` blocks | two columns of panels |
| three `###` blocks | three columns of panels |
| four `###` blocks | a bordered 2×2 grid (`.net`) |
| five to eight `###` blocks | two columns of stacked cards |
| paragraphs, then one `###` block | prose on the wide side, a highlighter call-out on the narrow one |
| paragraphs and images | text one side, gallery the other |
| one image alone | shown whole, letterboxed rather than cropped |
| two or more images | a gallery grid |
| a short paragraph before other blocks | a `.lede` under the heading |
| a short paragraph after a gallery | the gallery's caption |
| `> blockquote` | the `.punch` band, pinned to the bottom |
| `- bullets` | a `.kulissen` list, density picked from the item count |
| `1.` items with `**bold leads**` | numbered `.flow` steps |
| `- **12** — label` items | a `.facts` grid of big numbers |
| a two-column table | a `.tl` label/value list with content-sized tracks |
| a wider table | a real table, with a small scoped style |
| a fenced code block | `<pre class="md-code">`, sized in `cqw` like everything else |

Links are handled for you: `[text](#slide-id)` becomes a cross-reference with a
hover preview, and any link leaving the deck gets `target="_blank"
rel="noopener"`, because a deck is read full-screen and navigating away in the
same tab strands the reader.

## Directives, when inference is not what you want

A fenced block forces a component:

```markdown
::: cols--3
### One
### Two
### Three
:::
```

Purpose-built ones, which read their body as a list:

| Directive | Body |
|---|---|
| `::: facts` | `- 1 280 \| Commits across the project` |
| `::: timeline` | `- Wk 1 \| Kickoff \| optional second line` |
| `::: delta` | `- Seven pages -> **One guided flow** a note` |
| `::: chat` | `- **Speaker** text of the message` |
| `::: flow` | `- **Step title** the step's text` |
| `::: tracker` | `- [x] a point already covered` |
| `::: editorial` | `###` blocks; the first is the hero |
| `::: principles` | two `###` blocks, each holding a list |
| `::: net`, `::: cardcol`, `::: sandwich`, `::: doc` | `###` blocks |
| `::: stack` | four images, fanned and click-to-pin |
| `::: shots single` | a gallery, forced to one image |
| `::: chart max=220 values` | `- W1: 40` per bar |
| `::: statement kicker="Act 2"` | one line, set large |
| `::: quote by="**Emerson**, attributed"` | a full-bleed quote |
| `::: punch`, `::: punch--accent`, `::: lede`, `::: note`, `::: source` | one line each |
| `::: detail line="…"` | a clickable strip plus a deep-dive layer |
| `::: html` | passed through untouched |

An **unknown** directive name becomes `<div class="that-name">` with its body
rendered inside, so any component in the catalog is reachable without teaching
the converter about it. Raw HTML blocks in the Markdown also pass through
unchanged — that is the "notfalls HTML" escape hatch, and it is not a
second-class path.

## What it corrects, and what it refuses to

Corrections are applied unless you pass `--no-fix` or mark a slide `{keep}`.
Every one is printed in the report.

It will: use fewer or more columns, add `.cols--middle` when one column hangs
more than 20 % higher than its neighbour, move images off the narrow side of a
row where they would render as postage stamps, split an overfull prose slide
into two columns, and — as a logged last resort on a genuinely short row — add
`.cols--center`.

It will not:

- **Stretch a container to close a gap.** This is the move a fill-driven
  optimiser finds first, and the one measured to make decks worse. It is not in
  the repertoire at all.
- **Regroup equal-ranked cards.** Three thin `###` blocks stay three columns.
  They are parallel because you wrote them that way; a 2 + 1 grid would say
  they are not, in exchange for a better number.
- **Invent content.** A thin slide with nothing to rearrange is reported, with
  the two honest fixes named: take more from the source, or close the slide
  with a `> blockquote` takeaway.

## Reading the report

```
    6~  77 %  3 cards -> three columns              Was vorab abgesprochen wird
   10  100 %  3 cards -> three columns              Laptops austeilen – drei Varianten
       fix   uneven columns (28 %) -> cols--middle
```

`~` marks a slide under the fill target, `!` one that will not fit. The rule
name tells you which inference fired, so the next slide's outcome is
predictable. `fix` lines are the corrections that were applied.

**The percentage is an estimate, not a measurement.** It is computed from the
real geometry in `framework/browserslides.css` — the 88 cqw × 85.5 cqh content
box, the type scale, and the same average-glyph-width approximation the browser
audit uses — but it cannot know about font metrics or image aspect ratios. Run
the audit from `SKILL.md` in a browser before you ship, and look at a few
slides.

One thing the estimate is *better* at than the browser audit: a slide ending in
a `.punch` measures ~97 % in the browser whatever sits above the band, because
the band's bottom edge is the deepest painted pixel and `.cols { flex: 1 }` has
pushed it to the footer. The estimate measures the row's own content, so it
reports such a slide as thin — correctly. The audit in `SKILL.md` now carries a
`deadBand` check for the same blind spot; read it before trusting `thin`.
