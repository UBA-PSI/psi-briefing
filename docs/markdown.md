# Writing a deck in Markdown

`tools/md-to-deck.mjs` turns a Markdown document into a psi-briefing deck. You
write a document; it picks the components.

```bash
node tools/md-to-deck.mjs deck.md -o deck.html
python3 -m http.server 8000          # then look at it
tools/build-deck.sh deck.html        # when you want one shareable file
```

The output is ordinary psi-briefing HTML — readable, and safe to edit by hand
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
lang: de                 # a BCP-47 tag: de, de-CH, en-GB, fr …
hyphenate: false         # hyphenate running text (default false)
theme: bamberg           # themes/<name>.css
assets: assets/          # a folder holding briefing.css/js + the theme
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

`lang` does two jobs and they are not the same job. It is written through to
`<html lang>` verbatim, because that attribute is what the browser reads to pick
a hyphenation dictionary and what a screen reader reads to choose a voice — so
`de-CH`, `en-GB` and `fr` all work and all mean something. Separately, a tag
starting `en` switches the deck's own conventions to English: the quotation
marks, and the handful of generated labels (`Part two`, `In one sentence`,
`Turn your phone`). Anything else keeps the German ones.

`hyphenate: true` turns hyphenation on for running text, using the dictionary
`lang` selects. It is off by default: a hyphenated ragged edge is busier, and in
a wide measure there is nothing to win. It earns its place in narrow German
columns, where one `Prüfungsaufsicht` on a line leaves a hole nothing else can
close. Display type and label atoms are excluded automatically. Per slide:
`{hyphenate}` to turn it on for one, `{hyphenate=off}` to exempt one from a
deck-wide setting, `{lang="en"}` for a slide that quotes another language.

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
| `{.center}` | centres the whole row in the slide (`cols--center`) |
| `{.middle}` | centres each column's content against its neighbour (`cols--middle`) |
| `{.statement}` | adds any other class to the `.slide` element |
| `{hyphenate}` `{hyphenate=off}` | turns hyphenation on or off for this slide |
| `{lang="en"}` | this slide is in another language (picks the hyphenation dictionary) |
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
| a short paragraph after a gallery | the gallery's caption (also after `::: stack` / `::: shots`) |
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

There is a pattern to which components need one. Inference reads *shape*, and
some components encode an **intention that has no shape in Markdown**.

`::: editorial` is the clearest case. It lays out one dominant hero block beside
a stack of smaller points — but in Markdown five `###` blocks all look alike.
That the first outranks the rest is a decision, not a structure, so no rule
could recover it. `::: delta` (old → new), `::: principles` (do vs avoid) and
`::: chart` are directives for the same reason: the relationship between the
items carries the meaning, and Markdown has no notation for it.

Where the shape *does* carry the meaning — four peers, a list of steps, a
quotation as the takeaway — no directive is needed, and using one is just extra
typing. The 23-slide deck in `test-aufsicht/` uses exactly three.

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
| `::: editorial` | `###` blocks; the first is the hero. `::: editorial wide` gives it the dominant column instead of the balanced "lessons" split |
| `::: principles` | two `###` blocks, each holding a list |
| `::: net`, `::: cardcol`, `::: sandwich`, `::: doc` | `###` blocks |
| `::: stack` | four images, fanned and click-to-pin |
| `::: shots single` | a gallery, forced to one image |
| `::: chart max=220 values` | `- W1: 40` per bar |
| `::: statement kicker="Act 2"` | one line, set large |
| `::: quote by="**Emerson**, attributed"` | a full-bleed quote |
| `::: punch`, `::: punch--accent`, `::: lede`, `::: note`, `::: source` | one line each |
| `::: detail line="…" more="…"` | a reveal: a clickable strip plus a full-slide layer that is not in the scroll path (see below) |
| `::: html` | passed through untouched |

### Reveals: `::: detail`

A reveal is a slide the deck never pages to. A clickable strip sits on the
visible slide; clicking it covers that slide with a full panel holding the
depth — the derivation, the caveat, the numbers behind the claim. The panel has
no page number and no nav dot, so running through the deck never lands on it.

```markdown
## Wie viel Aktivität steckt darin?
Commit-Zeitstempel ergeben 162 bis 399 Stunden Aktivitätsfenster.

::: detail line="**Wie geschätzt wird.** Zwei Verfahren, eine Spanne." more="Wie geschätzt wird"
## Wie die Spanne entsteht

### Untere Grenze
Nur Sitzungen mit mindestens zwei Commits, Lücken über 90 Minuten geschnitten.

### Obere Grenze
Jede Sitzung wird bis zum nächsten Commit als aktiv gezählt.

> Beide Verfahren sind Schätzungen. Keine Arbeitszeiterfassung.
:::
```

`line` is the strip's own text — say what is behind it, not "click here".
`more` is the call to action on the right (default *Mehr* / *Details*).
`eyebrow` works as on a slide.

**The body is planned exactly like a slide.** A leading `##` becomes the panel's
`h2`; everything after it goes through the same shape inference, so the two
`###` blocks above become two panel columns and the blockquote becomes the
closing band. Reveals are corrected like slides and reported separately:

```
  reveals (a .bottomline strip opens these; they are not in the scroll path):
   ~  31 %  2 cards -> two columns            Wie die Spanne entsteht
       fix   short row (31 %) -> cols--center; balances the gap, does not fill it
```

They are listed on their own because they are the slides nobody proof-reads —
an overfull reveal is invisible until someone clicks it in front of an audience.

More than one reveal per slide is fine; each strip opens its own panel.

An **unknown** directive name becomes `<div class="that-name">` with its body
rendered inside, so any component in the catalog is reachable without teaching
the converter about it. Raw HTML blocks in the Markdown also pass through
unchanged — that is the "notfalls HTML" escape hatch, and it is not a
second-class path.

## What it corrects, and what it refuses to

Corrections are applied unless you pass `--no-fix` or mark a slide `{keep}`.
Every one is printed in the report.

It will: use fewer or more columns, add `.cols--middle` when one column hangs
more than 20 % higher than its neighbour, widen the gutter with `.cols--figure`
when one column is a figure and the other is text, move images off the narrow
side of a row where they would render as postage stamps, split an overfull prose
slide into two columns, and centre a short row with `.cols--center`.

`.cols--figure` is the least visible of those and worth one sentence. Text
against text is what the `4.8cqw` gutter is calibrated for — two ragged edges,
nothing for the eye to catch on. A photograph or a bordered call-out puts a hard
vertical rule down one side of that gutter, and then the last words of every line
read as touching it. The class widens the gutter to `6.4cqw` for that pairing
only, which is what the title slide has always done with its `9cqw` column gap.
It is re-derived after the corrections run, so a correction that regroups the
columns cannot leave the class describing a pairing that no longer exists.

That last one is worth being precise about, because it is easy to mistake for a
fullness fix. A short row hanging from the top leaves its slack in one lump
above the closing band, which reads as broken; the same slack split above and
below reads as composed. So it is applied — but it is an **arrangement**
decision, and it does not touch the row's fill. The slide keeps its honest
reading and stays in the thin list afterwards, marked `(centred)`. Set
`autocenter: false` in the frontmatter to turn it off, or `{keep}` on one slide.

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
    6~  65 % gap 23 %  3 cards -> three columns      Was vorab abgesprochen wird
       note  add {.center} to balance the whitespace, if there is nothing left to say
   10  100 %          3 cards -> three columns      Laptops austeilen – drei Varianten
       fix   uneven columns (28 %) -> cols--middle
```

`~` marks a thin row, `!` one that will not fit. The rule name tells you which
inference fired, so the next slide's outcome is predictable. `fix` lines are
corrections that were applied; `note` lines are suggestions that were not.

### What the percentage means

It is the fill of the **content row** — how much of the space the row was given
its content actually occupies — and `gap` is what is left over, as a share of
the whole slide.

It is deliberately *not* "how much of the slide is painted", because that
number can be bought. A `.punch` is pinned to the bottom by `.cols { flex: 1 }`,
so its bottom edge is the deepest ink on the slide: under an ink-fill metric,
adding one closing line lifts the score by that line's height — around 12 points
— without a word being added to the content. Measured on a finished 23-slide
deck, five slides scored 97 % ink fill with their content stopping between 55 %
and 71 %.

Row fill cannot be bought that way, because the band is not part of the row. A
band does still move the number, in the honest direction: it occupies real
space, leaving a smaller row for the same content to fill. On identical slides
differing only in a closing blockquote, the estimate reads 26 % and 31 %, and
the gap falls from 64 % to 51 %. Under the old metric the same pair read 36 %
and 49 %.

**It is an estimate, not a measurement.** It is computed from the real geometry
in `framework/briefing.css` — the 88 cqw × 85.5 cqh content box, the type
scale, and the same average-glyph-width approximation the browser audit uses —
but it cannot know font metrics or image aspect ratios. Checked against a
browser on 18 content slides: mean error 7 points, 14 of 18 within 10, errors in
both directions. Run the audit from `SKILL.md` before you ship, and look at a
few slides.

Centring does not change this number, by design. `.cols--center` moves where the
leftover space sits, not how much of it there is, so a centred row reports the
same fill and stays in the thin list. The browser audit's `deadBand` check is
the complement: it goes quiet once a row is centred, because it asks whether the
gap is lopsided. Read together, the pair tells you both things — `deadBand`
silent means it *looks* right, a low row fill means it still *is* thin.
