---
title: How to write a briefing
subtitle: This deck is one Markdown file. Every slide shows the Markdown that produced it.
footer: psi-briefing · tutorial
lang: en
theme: bamberg
css: [../framework/briefing.css, ../themes/bamberg.css]
js: ../framework/briefing.js
hyphenate: false
takeaway: Write an ordinary Markdown document, run one command, and the converter picks a layout for every slide.
strip:
  - "1: file"
  - "0: dependencies"
  - "33: components"
---

# How to write a briefing
{#contents}

# The document

`#`, `##` and `---` are what decide where a slide begins. Everything else in the
file is ordinary Markdown.

## One file in, one deck out
{#report eyebrow="The whole workflow"}

Nothing to install and no project to set up. Below is what the two commands
printed when this deck was built from `examples/tutorial.md`.

::: html
<pre class="md-code"><code>$ node tools/md-to-deck.mjs examples/tutorial.md -o examples/tutorial.html
md-to-deck: 17 slides -&gt; examples/tutorial.html
   12   98 %          directive:cols--2                   Old against new, do against avoid
    9~  66 % gap 21 %  directive:cols--2                   A two-column table becomes a timeline
  typography: 9 marks normalised

$ tools/build-deck.sh examples/tutorial.html
        0.02 MB linked  -&gt;  0.13 MB self-contained
        no external references: opens with no server and no network</code></pre>
:::

> The `.md` stays the source of truth. Re-running the converter overwrites the
> HTML, so hand-tune only once you have stopped converting.

## Where slides begin
{eyebrow="Structure"}

This file has four `#` headings after the title. Each one becomes a numbered
divider slide, and the four of them together are the contents list on
[the title slide](#contents) – hover the link and count them.

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
A heading may take one `{…}` line under it. `{#anchor}` gives the slide an id so
another slide can link to it, `{eyebrow="…"}` puts a small line above the title,
`{.center}` centres the content, `{keep}` leaves this slide's layout untouched.
:::

# How the layout is chosen

The converter reads the structure of your Markdown and picks a component for each
slide. It also adjusts what you wrote: more columns or fewer, or an overfull
prose slide split into two. It never invents text to fill a gap, and every slide
it could not fix is named in the report it prints.

## Four equal blocks become a grid

Four `###` blocks at the same level become a bordered 2×2 grid. Two become two
columns, three become three, and five to eight become two columns of stacked
cards.

::: cols--2
```markdown
### Candidates
They sit the exam.

### Examiner
Owns the paper.

### Invigilators
They set up and watch.

### Technical lead
Knows the system.
```

<div class="net net--middle">
  <div><h3>Candidates</h3><p>They sit the exam.</p></div>
  <div><h3>Examiner</h3><p>Owns the paper.</p></div>
  <div><h3>Invigilators</h3><p>They set up and watch.</p></div>
  <div><h3>Technical lead</h3><p>Knows the system.</p></div>
</div>
:::

## A quotation becomes the closing band

> Who leads is settled **before** the exam day. This blockquote is the first
> block in the slide's source, written above the two columns beside it.

A `> blockquote` becomes the highlighted band across the bottom of the slide. It
can sit anywhere in the slide's source, first block or last, and still ends up
down there.

::: cols--2
```markdown
> Who leads is settled **before**
> the exam day.

Three roles, one rule: whoever
leads is settled before the day.
```

<div class="prose">
  <p>Three roles, one rule: whoever leads is settled before the day.</p>
  <p>The quotation went to the band at the foot of the slide, although it was
  written above this column.</p>
</div>
:::

## Three numbers become a row of figures

A short list in which every item reads `**value** – label`, and the value
contains a digit, comes out as a row of figures. The first item is set largest,
so lead with the number you most want read.

::: cols--2
```markdown
- **1280** – commits across the project
- **11** – weeks from kickoff to launch
- **3** – people, none of them full time
```

<div class="facts">
  <div class="fact fact--hero"><b>1280</b><span>commits across the project</span></div>
  <div class="fact"><b>11</b><span>weeks from kickoff to launch</span></div>
  <div class="fact"><b>3</b><span>people, none of them full time</span></div>
</div>
:::

## A two-column table becomes a timeline

A table of two columns becomes this label-and-text list. You set no widths
anywhere: the label column on the left comes out as wide as its longest label,
and no wider. A table of three or more columns stays an ordinary table instead.

::: cols--2
```markdown
| When | What happens |
| --- | --- |
| The evening before | Laptops imaged |
| −45 min | Room open, laptops out |
| −10 min | Doors closed, IDs checked |
| 0 | Exam starts |
| +90 min | Working time ends |
```

<ul class="tl">
  <li><time>The evening before</time><span>Laptops imaged</span></li>
  <li><time>−45 min</time><span>Room open, laptops out</span></li>
  <li><time>−10 min</time><span>Doors closed, IDs checked</span></li>
  <li><time>0</time><span>Exam starts</span></li>
  <li><time>+90 min</time><span>Working time ends</span></li>
</ul>
:::

# Asking for a component by name

Some layouts cannot be read off Markdown, so you name them with a directive:
`::: name` on its own line, the blocks that belong to it below, then `:::` to
close. Five directives appear in this part; the rest of the catalog works the
same way.

## One block outranks the rest
{eyebrow="::: editorial"}

`::: editorial` gives the first `###` block a large panel of its own and stacks
the others beside it as smaller cards. Use it when one point carries the slide.
Markdown has no way to show that one of five blocks outranks the others, which is
why this layout has to be asked for by name.

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

<div class="editorial-layout editorial-layout--lessons">
  <div class="editorial-hero">
    <h3>The one thing that mattered</h3>
    <p>Everything else followed from it.</p>
  </div>
  <div class="editorial-stack">
    <div class="editorial-item"><h3>A smaller lesson</h3><p>Worth a line.</p></div>
    <div class="editorial-item"><h3>Another</h3><p>Also worth a line.</p></div>
  </div>
</div>
:::

## Old against new, do against avoid
{eyebrow="::: delta · ::: principles"}

`::: delta` puts an arrow between the two halves of each item. `::: principles`
sets two bullet lists side by side, each under its own heading. Both bodies are
plain Markdown lists.

::: cols--2
```markdown
::: delta
- Seven pages -> **One guided flow**
- A PDF by e-mail -> **A link**
:::

::: principles
### Do
- Cite the source
- Say what changed

### Avoid
- One line per slide
:::
```

<div class="delta">
  <div><div class="d-old">Seven pages</div><div class="d-arrow">&rarr;</div><div class="d-new"><b>One guided flow</b></div></div>
  <div><div class="d-old">A PDF by e-mail</div><div class="d-arrow">&rarr;</div><div class="d-new"><b>A link</b></div></div>
</div>
<div class="principle-columns" style="margin-top:2cqh">
  <div class="principle-group">
    <div class="tl-head">Do</div>
    <ul class="principle-list"><li>Cite the source</li><li>Say what changed</li></ul>
  </div>
  <div class="principle-group">
    <div class="tl-head">Avoid</div>
    <ul class="principle-list"><li>One line per slide</li><li>Unlabelled numbers</li></ul>
  </div>
</div>
:::

## A list of numbers becomes a chart
{eyebrow="::: chart"}

The six bullet lines on the left produced the chart on the right. `max=220` sets
the top of the scale the bars are measured against, `values` prints each number
above its bar, and the bars take the theme's accent colour, the same one as the
heading above them.

::: cols--2
```markdown
::: chart max=220 values label="Commits per week"
- W1: 40
- W2: 95
- W3: 120
- W4: 60
- W5: 150
- W6: 205
:::
```

::: chart max=220 values label="Commits per week"
- W1: 40
- W2: 95
- W3: 120
- W4: 60
- W5: 150
- W6: 205
:::
:::

## Numbered steps need no directive
{eyebrow="No directive needed"}

A numbered list whose items start with a bold phrase becomes numbered steps, in
two columns once there are four. Nothing to name here: the numbering already
says what these are.

::: cols--2
```markdown
1. **Absprache** Agree room and
   laptop count.
2. **Aufbau** Lay out machines,
   check network.
3. **Einlass** Doors close, IDs
   checked.
4. **Abbau** Pack down, count
   papers twice.
```

<div class="flow">
  <div class="fcol">
    <div class="fstep"><div class="step-num">1</div><h3>Absprache</h3><p>Agree room and laptop count.</p></div>
    <div class="fstep"><div class="step-num">2</div><h3>Aufbau</h3><p>Lay out machines, check network.</p></div>
  </div>
  <div class="fcol">
    <div class="fstep"><div class="step-num">3</div><h3>Einlass</h3><p>Doors close, IDs checked.</p></div>
    <div class="fstep"><div class="step-num">4</div><h3>Abbau</h3><p>Pack down, count papers twice.</p></div>
  </div>
</div>
:::

> A finished 23-slide briefing on exam invigilation names a component three
> times in all.

## Extra detail behind a click
{eyebrow="::: detail"}

`::: detail` adds a clickable strip along the bottom of a slide, and clicking it
covers the slide with a full panel. Put a derivation or the numbers behind a
claim in there. The reader who wants that much can open it, and the reader who
does not is never held up by it.

::: cols--2
```markdown
::: detail line="**How this panel was made.**" more="Show the method"
## What a reveal is made of

### The strip
What `line` and `more` write on it.

### The panel
Laid out exactly like a slide.
:::
```

### The strip below is real
The Markdown beside this paragraph is what produced it, with the two panel texts
shortened and the closing quotation left out. Click the strip and read what
opens.
:::

::: detail line="**How this panel was made.**" more="Show the method"
## What a reveal is made of

### The strip
`line="…"` is the text on the strip itself: say what is behind it rather than
"click here". `more="…"` labels the button on its right, and `eyebrow="…"` works
as it does on a slide.

### The panel
Everything after the leading `##` is laid out exactly like a slide. The two
panels you are reading are two `###` blocks, and the band below them is a
`> blockquote`. This panel has no page number and no navigation dot, so paging
from slide to slide never lands on it.

> Press Escape, or use the close button. While the panel is open, the arrow keys
> belong to it, so the deck cannot scroll away underneath.
:::

# Where this fits

## When not to use this
{eyebrow="Limits"}

::: cols--3
### What it fits
Material already written as a document: a retrospective, project documentation,
a research summary, lecture notes, a report with numbers in it. Such a source
arrives with its own sections and comparisons, and the job is getting all of
them onto slides without dropping any of it on the way.

### What it does not
A spoken keynote of one line per slide, where the timing and the order of
question and answer carry the talk. That was tried on a real one. Filling the
slides worked against the timing, and keeping them sparse gave a deck of
near-empty frames. For that kind of talk the pacing is the design, and no
converter can supply it.

### What is missing
No animation beyond the click-to-open panels. No speaker view, no presenter
notes on a second screen, no `.pptx` export. Charts are bars and nothing else,
and the only image effects are a lightbox and a fanned stack.
:::

> For a talk you will actually deliver, use [psi-slides](https://uba-psi.github.io/psi-slides/) –
> the sibling project. The line between the two is whether anyone will be in the
> room speaking.
