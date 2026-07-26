---
title: "Project Aurora: shipping a portal in eleven weeks"
subtitle: A worked example of writing a psi-briefing deck in Markdown
eyebrow: Retrospective · Example deck
footer: Project Aurora · example deck
lang: en
theme: bamberg
css: [../framework/briefing.css, ../themes/bamberg.css]
js: ../framework/briefing.js
strip:
  - "11: Weeks"
  - "1280: Commits"
  - "1: HTML file"
---

# Project Aurora: shipping a portal in eleven weeks

## What this file is

This deck is one Markdown document, `examples/example-deck.md`, converted with
`node tools/md-to-deck.mjs examples/example-deck.md`. Thirteen slides, no HTML
written by hand, and everything on them is placeholder content. The three
numbers on the title slide come from the front matter, and each `#` heading
became one of the three numbered dividers.

The file's order is the deck's order: front matter, then one `#` per part and
one `##` per slide, with the blockquote at the end of a slide becoming the band
across its bottom.

### How to read it

Count the directives in the `.md`: five of them (`::: chart`, `::: detail`,
`::: delta`, `::: principles`, `::: editorial`) on four of the thirteen slides.
The other nine name no layout at all: this one, the title, three dividers and
four content slides. A table became the plan/reality list, a numbered list
became the steps, four `###` blocks became the 2×2 grid – and the report the
converter prints names the rule it used for every slide.

> Nine of thirteen slides name no component. **The shape of the Markdown was
> the instruction.**

# How the timeline went

What the eleven weeks looked like from the inside, and the numbers behind them.

## The numbers

- **1280** – Commits across the whole project
- **117** – Person-days worked by the three of us
- **34%** – Of commits before 10 a.m.
- **3** – People on the core team

> 1280 commits over 117 person-days is **eleven a day**, and a third of them
> landed before 10 a.m. The mornings were kept free of meetings.

## Plan against reality

| Week | What actually happened |
|---|---|
| Wk 1 | Kickoff and scope, agreed in a room, on one page. Nothing was written down that could not be read aloud in a minute. |
| Wk 2 | First clickable prototype. Planned for week 3, and a week early because the component library came from an earlier project. |
| Wk 4 | The scope argument. Two weeks of low commit counts that the chart on the next slide makes look like a holiday. |
| Wk 6 | Feature freeze, planned for week 7. Two features were cut outright rather than deferred, which is the only reason the date held. |
| Wk 9 | Load testing found the one real bottleneck: a query that had never been run against production-sized data. |
| Wk 11 | Launch, on the day named in week 1, with the two cut features still cut. |

> Exactly two dates moved, both a week earlier than planned.
> **Week 11 was week 11 from the first day.**

## Commits per week
{eyebrow="Activity"}

::: chart max=220 values label="Commits per week"
- W1: 40
- W2: 95
- W3: 120
- W4: 60
- W5: 55
- W6: 145
- W7: 165
- W8: 135
- W9: 205
- W10: 165
- W11: 95
:::

::: detail line="**The eleven bars add up to 1280.** Merges and generated files are not among them." more="How this is counted"
## How a commit is counted

### What is in
Commits on `main`, and on any branch that eventually reached `main` – a branch
that was abandoned still cost the time it took, but it did not ship, so it is
not in this number. One commit per author per push, which means a pair
programming session shows up once rather than twice.

Reverts count as commits. Undoing work is work, and a week with three reverts
in it was a real week – flattening that would make week five look calmer than
it was.

### What is out
Merge commits, because a merge is bookkeeping rather than a change. Anything
touching only `dist/` or a lockfile, for the same reason. And the two history
rewrites in week six, which would otherwise have shown up as 300 commits on a
single afternoon.

Together that is roughly 9 % of the raw count – enough to matter if you compare
this chart against a number someone else counted differently, and the reason
this panel exists at all rather than a footnote nobody reads.

> Counted the other way – every commit object in the repository – the same
> eleven weeks come to 1407. Pick one definition and stay with it.
:::

> Weeks four and five produced 115 commits between them, **fewer than week
> three alone.** Both weeks went on the scope argument.

# How it was built

Where the 1280 commits went, and the weekly loop that produced them.

## Four areas of work

### Frontend

620 commits, three authors. The guided flow and the component library, the
only part of the work users ever see.

### Backend

410 commits, three authors. Enrolment logic and the data model; 300 of the
410 landed in the first six weeks.

### Content

180 commits, three authors. Copy, translations, and the eleven weekly notes,
written by the same people who built the thing.

### Infra

70 commits, three authors. Deploy scripts and the font-embedding pipeline,
none of it touched after week 3.

> All three names appear in all four commit logs. **Nobody owned a layer.**

## What changed for the user

::: delta
- Seven separate pages to enrol -> **One guided flow** Same information in 5 clicks instead of 19, answers carried forward
- PDF forms, printed, signed and scanned -> **Fill in the browser** The signature moved to the confirmation step
- Enrolment only during office hours -> **Open around the clock** 64 % of enrolments now start outside them
- Four places to check your status -> **One page that answers it** Reached from the same button as everything else
:::

> One entry point was asked for in **168 of the 412 support tickets** from the
> year before launch. It shipped in week 3 and now takes 38 % of page views.

## The weekly rhythm

1. **Frame the week.** One outcome, written down on Monday morning, in a single sentence. If it took two sentences it was two weeks of work and got split.
2. **Build in the open.** Small commits, deployed continuously, no staging queue to wait on. Anyone could see the portal as it stood at any hour.
3. **Review on Friday.** Look at the real thing running, never at a status document. Bugs found here were fixed before the note was written, not filed.
4. **Write it down.** A short note per week, describing what now works that did not before. Eleven notes are where these slides came from.
5. **Cut on Monday, not Thursday.** Scope came off at the start of a week, while there was still time to reshape it, never in a panic two days before the review.
6. **Leave it running.** The Friday build stayed deployed over the weekend. Anyone who wanted to look – registrar, IT, a student – could, without asking anyone.

> **Eleven Fridays, eleven builds left running over the weekend.** Nothing was
> reported as done from a document.

# What we learned

Eight rules that were on the wall, and the four lessons that outlived them.

## Two ways of working

::: principles
### Worth keeping

- **Decide in the room.** Async is for reporting, not for deciding. Three decisions a week, each taking ten minutes, beat a fortnight of threads.
- **Prefer the boring tool.** One HTML file beat a toolchain, twice: once for the portal's docs and once for this deck.
- **Cut, don't defer.** "Later" is a graveyard with good intentions. The two features cut in week six appear in none of the 96 tickets since launch.
- **Ship on Fridays.** A deadline every week is easier to hit than one in eleven: eleven weekly builds, eleven hit.

### Worth avoiding

- **Silent scope creep.** New work needs old work removed, explicitly and in the same conversation.
- **Status theatre.** A slide saying it works is not it working. We stopped accepting screenshots as evidence, and ran all eleven Friday reviews against the deployed build.
- **One owner per layer.** It made every handover a negotiation; end-to-end ownership removed the queue.
- **Estimating in hours.** Nobody was right once. "Does it fit this week" was right in 9 of the 11 weeks.
:::

> Eight rules on one sheet of paper, put up in week 2. **Not one of them was
> edited in the nine weeks that followed.**

## Four lessons

::: editorial
### Ship something real every single week.

Nothing aligned the team like a working artifact on a Friday afternoon. Eleven
weeks produced eleven builds and eleven notes, each note written from the build
it describes.

### One page of scope

The page from week 1 held for all eleven weeks: two features came off it in
week 6, nothing was added.

### Mornings for the hard part

34 % of commits landed before 10 a.m. No meeting was booked before then.

### The tooling has to disappear

Infra took 70 of the 1280 commits, and none after week 3.
:::

> All four came out of the eleven weekly notes, not out of a retrospective
> workshop.
