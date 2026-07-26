---
title: How to write a briefing
subtitle: A briefing that teaches its own format. Every slide shows the Markdown that produced it.
footer: psi-briefing · tutorial
lang: en
theme: bamberg
css: [../framework/briefing.css, ../themes/bamberg.css]
js: ../framework/briefing.js
hyphenate: false
takeaway: You write a document. The shape of the document picks the layout, before anything is rendered.
strip:
  - "1: file"
  - "0: dependencies"
  - "33: components"
---

# How to write a briefing

# The document

Three characters decide where slides begin. Everything else is ordinary Markdown.

## One file in, one deck out
{eyebrow="The whole workflow"}

There is no project to set up and nothing to install. You write one Markdown
file and run one command; you get one HTML file that links its stylesheet during
development and can be folded into a single self-contained file for sending.

::: cols--wide-left
```bash
node tools/md-to-deck.mjs tutorial.md -o tutorial.html
python3 -m http.server 8000     # then look at it

tools/build-deck.sh tutorial.html   # one shareable file
```

### What the report tells you
Which rule fired on each slide, how full its content row is, what it corrected
by itself, and which slides are thin in a way no tool can fix.
:::

> The `.md` stays the source of truth. Re-running the converter overwrites the
> HTML, so hand-tune only once you have stopped converting.

## Where slides begin
{eyebrow="Structure"}

Divider numbering and the table of contents on the title slide are both derived
from the `#` headings, so the two can never drift apart — the one piece of
bookkeeping hand-written decks kept getting wrong.

::: cols--2
```markdown
# How to write a briefing   ← title slide

# The document             ← divider, numbered 1

## Where slides begin      ← a content slide
{eyebrow="Structure"}      ← optional attributes

---                        ← a break, for a slide
                             with no heading
```

### The attribute line
One optional `{…}` directly under a heading. `{#anchor}` to link to the slide,
`{eyebrow="…"}` for a kicker, `{.center}`, `{hyphenate}`, `{keep}` to exempt it
from corrections.
:::

# Shape becomes layout

The component is chosen from the structure of your text, before anything is
rendered. Nothing measures a fill score and then stretches a box to improve it.

## Four peers become a grid
{eyebrow="Shape → component"}

Four `###` blocks of equal rank are four parallel points, so they become a
bordered 2×2 grid. Two become two columns, three become three, five to eight
become two columns of stacked cards.

::: cols--2
```markdown
### Candidates
They sit the exam at laptops.

### Examiner
Responsible for the exam.

### Invigilators
They invigilate, and help set up.

### Technical lead
Knows the system. Not an invigilator.
```

<div class="net net--middle">
  <div><h3>Candidates</h3><p>They sit the exam at laptops.</p></div>
  <div><h3>Examiner</h3><p>Responsible for the exam.</p></div>
  <div><h3>Invigilators</h3><p>They invigilate, and help set up.</p></div>
  <div><h3>Technical lead</h3><p>Knows the system. Not an invigilator.</p></div>
</div>
:::

## A quotation becomes the closing band
{eyebrow="Shape → component"}

A blockquote is the slide's takeaway wherever it sat in your source, so it is
pinned to the bottom as a highlighted band. It is also the honest fix for a
slide that ends too high: it closes the frame *and* forces you to say what the
slide was for.

::: cols--2
```markdown
Three roles, one rule: whoever leads
is settled before the exam day.

> Who leads is settled **before**
> the exam day.
```

<div class="prose">
  <p>Three roles, one rule: whoever leads is settled before the exam day.</p>
</div>
<div class="punch">Who leads is settled <b>before</b> the exam day.</div>
:::

## Numbers become numbers
{eyebrow="Shape → component"}

A short list whose every item reads `**value** – label`, with a digit in the
value, is not a list. It is a row of figures, and it is set as one.

::: cols--2
```markdown
- **1 280** – commits across the project
- **11** – weeks from kickoff to launch
- **3** – people, none of them full time
```

<div class="facts">
  <div class="fact fact--hero"><b>1&nbsp;280</b><span>commits across the project</span></div>
  <div class="fact"><b>11</b><span>weeks from kickoff to launch</span></div>
  <div class="fact"><b>3</b><span>people, none of them full time</span></div>
</div>
:::

## A two-column table becomes a timeline
{eyebrow="Shape → component"}

The label track is sized to the longest label rather than to a number someone
guessed, so a long label neither wraps nor gets clipped.

::: cols--2
```markdown
| When | What happens |
| --- | --- |
| −45 min | Room open, laptops out |
| −10 min | Doors closed, IDs checked |
| 0 | Exam starts |
| +90 min | Working time ends |
```

<ul class="tl">
  <li><time>−45 min</time><span>Room open, laptops out</span></li>
  <li><time>−10 min</time><span>Doors closed, IDs checked</span></li>
  <li><time>0</time><span>Exam starts</span></li>
  <li><time>+90 min</time><span>Working time ends</span></li>
</ul>
:::

# When inference is not enough

There is a pattern to it. Inference reads *shape*, and some components carry an
intention that has no shape in Markdown.

## Rank among peers has no notation
{eyebrow="Directives"}

In Markdown five `###` blocks all look alike. That the first outranks the rest
is a decision, not a structure, so no rule could recover it — and that is
exactly when you reach for a directive.

::: cols--2
```markdown
::: editorial
### The one thing that mattered
Everything else followed from it.

### A smaller lesson
Worth a line.

### Another
Also worth a line.
:::
```

### The same reason, three more times
`::: delta` for old → new, `::: principles` for do vs avoid, `::: chart` for a
bar chart. In each of them the **relationship** between the items carries the
meaning, and Markdown has no notation for a relationship.

Where the shape *does* carry the meaning — four peers, a list of steps, a
quotation as the takeaway — a directive is just extra typing. A finished
23-slide deck used exactly three.
:::

## Depth that stays off the path
{eyebrow="Reveals"}

A reveal is a slide the deck never pages to: a strip on the visible slide opens
a full panel over it. Use it for the derivation, the caveat, the numbers behind
a claim — the depth that would otherwise force an extra slide into the linear
run for the one reader in ten who wants it.

::: cols--2
```markdown
::: detail line="**How this is counted.**"
       more="Show the method"
## How the range is derived

### Lower bound
Sessions with two commits or more.

### Upper bound
Everything up to the next commit.
:::
```

### Try the strip below
It is a real reveal on this slide, written exactly like the code beside it. The
panel has no page number and no nav dot, so paging through this deck will never
land on it.
:::

::: detail line="**How this reveal was made.**  Eleven lines of Markdown, same as the snippet on the left." more="Show the method"
## A reveal is a slide

### It is planned like one
The body goes through the same layout inference as any slide, so it can hold
columns, a gallery, a chart, a closing band. A leading `##` becomes its
heading.

### It is checked like one
The report lists reveals separately, because they are the slides nobody
proof-reads. An overfull one is invisible until someone clicks it in front of an
audience.

> Press Escape, or use the close button. While this panel is open the deck's own
> arrow keys stand down, so you cannot page away behind it.
:::

# What it decides for you

## Corrections, and the ones it refuses to make
{eyebrow="Auto-layout"}

Every correction is printed in the report, and the repertoire is deliberately
short. Three moves are excluded on principle, because each of them improves a
number while making the deck worse.

::: principles
### It will
- Use fewer or more columns than the first guess
- Centre each column's content when one hangs higher than its neighbour
- Widen the gutter where a figure faces text
- Move images off the narrow side of a row
- Split an overfull prose slide into two columns

### It will not
- **Stretch a container to close a gap.** Measured: median fill 74 % → 96 %, and the deck was visibly worse. A stretched bordered panel frames the empty space instead of removing it.
- **Regroup equal-ranked cards.** Three thin columns stay three columns. They are parallel because you wrote them that way.
- **Invent content.** A thin slide is reported, with the two honest fixes named.
:::

## When not to use this
{eyebrow="Honestly"}

::: cols--3
### It fits content that is already document-shaped
A retrospective, project documentation, a research summary, lecture notes, a
report with numbers in it. Those sources arrive with sections, comparisons and
figures to arrange densely, and arranging them densely is the whole job.

### It is a poor fit for a performance talk
A short spoken keynote driven by timing, delivery and question→answer beats.
This was tried on a real one and it resisted both treatments: forced into dense
slides it fought the dramaturgy, made sparse it produced empty frames. The
dramaturgy lives in the speaking, and a deck built to be read cannot hold it.

### There is also no
Animation model beyond click-to-reveal panels, and no speaker view. If you need
presenter notes on a second screen, that is a different tool.
:::

> For a talk you will actually deliver, use [psi-slides](https://github.com/UBA-PSI/psi-slides) —
> the sibling project. The line between the two is whether anyone is speaking.
