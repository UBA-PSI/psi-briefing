# How psi-briefing compares

Written in both directions. Every entry names the case where the other tool is
the better choice, because a comparison that never concedes anything is not
information, it is advertising.

Read the short version first: **psi-briefing is narrow.** It makes text-dense
16:9 slides, in one HTML file, for a reader who has no presenter. If you are
going to stand up and talk, almost everything below is a better fit.

## At a glance

| | Licence / price | You write | Layout | The artefact | Speaker view | Animation |
|---|---|---|---|---|---|---|
| **psi-briefing** | MIT | Markdown | inferred from content shape | one self-contained `.html` | no | click-to-reveal only |
| **iA Presenter** | closed, $49.50/yr or $99 once, macOS (iOS/iPadOS beta) | Markdown | analysed and chosen for you | HTML *package*, PDF, PPTX, images | yes | yes |
| **reveal.js** | MIT | HTML or Markdown | you specify it | a folder, or a server | yes | fragments, transitions |
| **Marp** | MIT | Markdown | CSS themes, templated | HTML, but assets not bundled | via Marp tooling | fragments |
| **Slidev** | MIT | Markdown + Vue | components you compose | a built site | yes | extensive |
| **LaTeX Beamer** | LPPL / free | LaTeX | frames and templates | PDF | with a second file | overlays |
| **PowerPoint / Keynote** | commercial | direct manipulation | you place things | `.pptx` / `.key` / PDF | yes | extensive |

## iA Presenter

**Auto-layout from Markdown is not a new idea, and this is the tool that made it
mainstream.** iA Presenter analyses a slide's content and picks a layout for the
text and graphics on it; slides are separated by `---`, and layouts are
responsive across displays. On that specific claim we are doing the same kind of
thing, and inference is not what makes this different.

The difference is the **default**, and it is the whole design rather than a
detail. In iA Presenter the document is a *script*: an ordinary paragraph is what
you **say**, and you indent a paragraph to promote it onto the slide. What the
audience sees is the exception you opt into. That is a genuinely good idea, and
it is built on the assumption that someone is in the room talking.

psi-briefing assumes the opposite. There is no speaker, so there is nothing to
demote: everything in the document is on a slide, and the question the layout
engine answers is not "which fragment should be promoted" but "what shape is this
content, and which component expresses it". Four sibling headings become a grid
because they are siblings. The result is dense on purpose, where iA Presenter is
sparse on purpose.

So the honest placement is this: **iA Presenter is the closer relative of
[psi-slides](https://github.com/UBA-PSI/psi-slides)**, our sibling project, which
also keeps script and slide in one document. If you want beautiful automatic
layout for a talk you are going to give, iA Presenter is a mature, well-designed,
actively developed product and this is not a serious competitor to it.

Two practical differences worth knowing: its HTML export produces a package –
the presentation, graphics, the theme and a JavaScript rendering engine – rather
than a single file; and it is macOS-only, paid, and closed source.

**Use iA Presenter instead when:** you are presenting, you want the script and
the slides in one document, you are on a Mac, and you want a polished product
with a company behind it rather than a repository.

## reveal.js

The reference implementation of HTML presentations, and far more capable than
this: real transitions, fragment animations, nested slides, speaker view, a
plugin ecosystem, Markdown support. It is MIT-licensed and it is everywhere.

The differences are scope and layout. reveal.js is a *runtime*, not an
opinionated layout system: you say what each slide contains and roughly how it is
arranged, and it does not have a view about whether four sibling headings should
be a grid. And a reveal.js deck is normally a folder or a served site; getting to
one file you can attach to an email is possible but is not what the tool is for,
whereas here it is the entire point of the build step.

**Use reveal.js instead when:** you want animation and transitions that carry
meaning, you are comfortable writing the structure yourself, or you are
publishing to a URL rather than sending a file.

## Marp

The closest thing to psi-briefing in spirit: MIT, Markdown in, HTML out, CSS
themes, a CLI. If you want Markdown slides and none of the above matters to you,
Marp is mature and you should look at it first.

Two distinctions, both real. Layout in Marp comes from a **theme** – CSS you
write or pick – rather than from the structure of the content; the Markdown does
not change which component you get. And on the single-file question the Marp
team is explicit that they do not bundle assets into the HTML, recommending the
separate `monolith` tool for that. Here, bundling and then *verifying* that
nothing external survived is the last step of the pipeline and it exits non-zero
if anything is left.

**Use Marp instead when:** you want a large ecosystem, VS Code integration, and
themes you control directly, and you do not need the output to be a single file.

## LaTeX Beamer

Do not underestimate it. For anything where mathematics, citations, cross
references, a bibliography or exact typographic control matter, Beamer is not the
old option, it is the correct one. The output is a PDF, which is the most
portable artefact in this table by a wide margin: it will open identically in
twenty years on hardware that does not exist yet. `\pause` and overlays are a
perfectly good animation model for teaching.

The cost is authoring speed and iteration: a compile cycle, error messages that
take practice to read, and layout that fights back when you want something the
template did not anticipate.

**Use Beamer instead when:** the deck contains real mathematics, needs a
bibliography, has to match a thesis or a paper, or must be archivable as a PDF.

## PowerPoint and Keynote

The default, and mostly for good reasons. Direct manipulation is faster than any
markup for a one-off deck. Everyone can open the file and edit it, which matters
more than anything else on a shared deck. Corporate templates exist and are
sometimes mandatory. The presenter tooling is genuinely good, the animation is
far beyond anything here, and Keynote in particular is a better *design* tool
than this will ever be.

The honest failure modes are the ones people complain about anyway: a deck and
its script drift apart because they are two documents; the same file renders
differently on another machine; and version control is a folder of files with
dates in their names.

**Use PowerPoint or Keynote instead when:** other people need to edit the deck,
a template is mandated, you are giving a keynote, or the deck is a one-off that
will not be maintained.

## Others, briefly

- **Slidev** – MIT, Markdown plus Vue components, a dev server and a build step.
  Much more powerful and much larger; a different weight class, aimed at
  developer talks.
- **Quarto** – renders to reveal.js, with excellent support for executable code
  and citations. If your slides come out of an analysis, start there.
- **remark / Pandoc** – Markdown to HTML slides with no build step. Closer in
  spirit; no layout inference and no bundling step.
- **Deckset** – macOS, Markdown, themes rather than inference, paid.
- **Google Slides** – the collaboration answer. If two people are editing at
  once, nothing in this document competes.

## What is actually distinctive here

Very little, taken one at a time. Markdown input is not new; auto-layout is not
new; self-contained HTML is not new. What is unusual is the *combination* aimed
at one narrow job:

- layout inferred from **document structure** rather than from a theme or a
  promotion rule, because the content already has a shape;
- **dense by default**, because there is no speaker to carry the argument;
- one file, **verified** to be one file, because the deck is going to be sent
  rather than presented;
- and a documented refusal to improve a fill metric by stretching things, which
  is written up with the measurements in
  [`handoff-autolayout.md`](handoff-autolayout.md).

If your deck has a speaker, pick something else on this page.

---

*Verified against vendor documentation in July 2026: iA Presenter's
indentation-based split between spoken and shown text, its layout analysis, its
export formats, its pricing and its platform support; Marp's position on
bundling assets. Everything said about Beamer, PowerPoint and Keynote is general
knowledge rather than a cited claim. Corrections are welcome as issues – a
comparison that has gone stale is worse than none.*
