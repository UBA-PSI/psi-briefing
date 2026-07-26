---
title: How to write a briefing
subtitle: A briefing that teaches its own format. Every slide shows the Markdown that produced it.
footer: psi-briefing · tutorial
lang: en
theme: bamberg
css: [../framework/briefing.css, ../themes/bamberg.css]
js: ../framework/briefing.js
hyphenate: false
takeaway: You write a document. Its shape picks the layout, and one command turns it into the deck.
strip:
  - "1: file"
  - "0: dependencies"
  - "33: components"
---

# How to write a briefing
{#contents}

# The document

Three characters decide where slides begin. Everything else is ordinary Markdown.

## One file in, one deck out
{#report eyebrow="The whole workflow"}

Nothing to install and no project to set up. This is what the two commands
printed for the file you are reading.

::: html
<pre class="md-code"><code>$ node tools/md-to-deck.mjs examples/tutorial.md -o examples/tutorial.html
md-to-deck: 17 slides -&gt; examples/tutorial.html
    9~  60 % gap 27 %  directive:cols--2                   A two-column table becomes a timeline
   17   86 % gap  9 %  directive:cols--3                   When not to use this
  typography: 10 marks normalised
  layout: 1 correction(s) applied
$ tools/build-deck.sh examples/tutorial.html
built   examples/tutorial.self-contained.html
        0.02 MB linked  -&gt;  0.13 MB self-contained
        no external references: opens with no server and no network</code></pre>
:::

> The `.md` stays the source of truth. Re-running the converter overwrites the
> HTML, so hand-tune only once you have stopped converting.

## Where slides begin
{eyebrow="Structure"}

This file has four `#` headings after the title. They are the four numbered
dividers you page through, and they are the contents list on
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
One optional `{…}` directly under a heading. `{#anchor}` to link to the slide,
`{eyebrow="…"}` for a kicker, `{.center}`, `{hyphenate}`, `{keep}` to exempt it
from corrections.
:::

# Shape becomes layout

The component is chosen from the structure of your text. It also rearranges what
you wrote: more columns, fewer, an overfull prose slide split into two. It never
pads, and a slide it cannot fix it names in the report.

## Four peers become a grid
{eyebrow="Shape → component"}

Four `###` blocks of equal rank are four parallel points, so they become a
bordered 2×2 grid. Two become two columns, three become three, five to eight
become two columns of stacked cards.

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
{eyebrow="Shape → component"}

> Who leads is settled **before** the exam day. This blockquote is the first
> block in the slide's source, above the two columns.

A blockquote is the slide's takeaway, so it lands in the band at the bottom.
Write it anywhere in the slide.

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

## Numbers become numbers
{eyebrow="Shape → component"}

A short list whose every item reads `**value** – label`, with a digit in the
value, comes out as a row of figures. The first one is set large.

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
{eyebrow="Shape → component"}

No width is named in the table. The label column comes out as wide as its
longest label.

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

Write `::: name`, and the blocks under it become that component. Five of them
appear in this part; every other component in the catalog is reached the same
way.

## One block outranks the rest
{eyebrow="::: editorial"}

`::: editorial` promotes the first `###` block to the hero position and stacks
the rest beside it. Use it when one point carries the slide and the others are
footnotes to it.

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
sets one list against another under its own head. Both read their body as a
list, so a longer one just grows downwards.

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

The six lines on the left are the chart on the right. `max=220` is the ceiling
the bars are scaled against, `values` writes each number above its bar, and the
bars take the theme's accent colour, the same one as the heading above them.

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

## Where the shape already carries it
{eyebrow="No directive needed"}

A numbered list whose items lead with a bold phrase comes out as numbered steps,
two columns of them once there are four. No directive for this one.

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

> A finished 23-slide deck used three directives in total.

## Depth that stays off the path
{eyebrow="::: detail"}

A reveal is a slide the deck never pages to: a strip on the visible slide opens
a full panel over it. Put the derivation there, or the numbers behind a claim,
and the room only sees it if someone asks.

::: cols--2
```markdown
::: detail line="**The method.**" more="Show"
## How the range is derived

### Lower bound
Sessions with two commits or more.

### Upper bound
Everything up to the next commit.
:::
```

### Try the strip below
The strip at the foot of this slide is a real reveal, written the same way as the
snippet beside it. Its panel has no page number and no nav dot, so paging through
this deck will never land on it.
:::

::: detail line="**How this reveal was made.**  Fifteen lines of Markdown, the same directive as the snippet on the left." more="Show the method"
## A reveal is a slide

### What you write on the strip
`line="…"` is the strip's own text: say what is behind it, not "click here".
`more="…"` is the call to action on its right, and `eyebrow="…"` works as it does
on a slide.

### What the panel can hold
Everything after the leading `##` is laid out like a slide. The two panels you
are reading are two `###` blocks, and the band below them is a `> blockquote`.

> Press Escape, or use the close button. While this panel is open the deck's own
> arrow keys stand down, so you cannot page away behind it.
:::

# Where this fits

## When not to use this
{eyebrow="Limits"}

::: cols--3
### What it fits
Content that is already document-shaped: a retrospective, project
documentation, a research summary, lecture notes, a report with numbers in it.
Those sources arrive with sections and comparisons to arrange densely, and
arranging them densely is the work.

### What it does not
A sparse spoken keynote, driven by timing and by question-then-answer beats.
Tried on a real one, it resisted both treatments: dense, it fought the
dramaturgy; sparse, it produced empty frames. The dramaturgy is in the speaking.

### What is missing
No animation beyond click-to-reveal panels. No speaker view, no presenter notes
on a second screen, no `.pptx` export. Charts are bars and nothing else, and the
only image effects are a lightbox and a fanned stack.
:::

> For a talk you will actually deliver, use [psi-slides](https://github.com/UBA-PSI/psi-slides) –
> the sibling project. The line between the two is whether anyone is speaking.
