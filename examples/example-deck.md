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

This deck was written as a Markdown document and converted with
`node tools/md-to-deck.mjs examples/example-deck.md`. Nothing below names a CSS
class except where a directive is used deliberately, and everything on these
slides is placeholder content.

### How to read it

Open the `.md` beside the rendered deck. Each slide shows one inference rule, so
you can see which shape of Markdown produced which component – the report the
converter prints names the rule that fired for every slide.

Nothing here is hand-tuned. Where a directive appears (`::: delta`,
`::: principles`, `::: chart`) it is because that component has no natural
Markdown shape, not because the inference was overridden.

> Every layout on the following slides was chosen from the **shape of the
> Markdown**, not from a class name.

# How the timeline went

What the eleven weeks looked like from the inside, and the numbers behind them.

## The numbers

- **1280** – Commits across the whole project
- **117** – Working days of elapsed time
- **34%** – Of commits before 10 a.m.
- **3** – People on the core team

> Three people, and 34 % of the commits landed before 10 a.m. The schedule was
> built around that, not against it.

## Plan against reality

| Week | What actually happened |
|---|---|
| Wk 1 | Kickoff and scope, agreed in a room, on one page. Nothing was written down that could not be read aloud in a minute. |
| Wk 2 | First clickable prototype, a week early, because the component library came from an earlier project. |
| Wk 4 | The scope argument. Two weeks of low commit counts that the chart on the previous slide makes look like a holiday. |
| Wk 6 | Feature freeze. Two features were cut outright rather than deferred, which is the only reason the date held. |
| Wk 9 | Load testing found the one real bottleneck: a query that had never been run against production-sized data. |
| Wk 11 | Launch, on the planned day, with the two cut features still cut. |

> The plan was roughly right. **The order changed, not the destination.**

## Commits per week
{eyebrow="Activity"}

::: chart max=220 values label="Commits per week"
- W1: 40
- W2: 95
- W3: 120
- W4: 60
- W5: 55
- W6: 150
- W7: 170
- W8: 140
- W9: 205
- W10: 180
- W11: 120
:::

::: detail line="**What counts as a commit here.** Merges excluded, generated files excluded." more="How this is counted"
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

> The lull in weeks four and five was the scope argument, not a holiday.

# How it was built

Four areas of work, and the one decision that shaped all of them.

## Four areas of work

### Frontend

The guided flow and the component library. 620 commits, and the only part users
ever see.

### Backend

Enrolment logic and the data model. 410 commits, most of them in the first six
weeks.

### Content

Copy, translations, and the weekly notes. Written by the same people who built
the thing.

### Infra

Deploy scripts and the font-embedding pipeline. 70 commits, then left alone.

> Nobody owned a layer exclusively – **everyone shipped end to end.**

## What changed for the user

::: delta
- Seven separate pages to enrol -> **One guided flow** Same information, a quarter of the clicks, and answers carried forward
- PDF forms, printed, signed and scanned -> **Fill in the browser** The signature moved to the confirmation step
- Enrolment only during office hours -> **Open around the clock** Two thirds of enrolments now happen outside them
- Four places to check your status -> **One page that answers it** Reached from the same button as everything else
:::

> The most-requested change shipped first, and became the most-used screen.

## The weekly rhythm

1. **Frame the week.** One outcome, written down on Monday morning, in a single sentence. If it took two sentences it was two weeks of work and got split.
2. **Build in the open.** Small commits, deployed continuously, no staging queue to wait on. Anyone could see the portal as it stood at any hour.
3. **Review on Friday.** Look at the real thing running, never at a status document. Bugs found here were fixed before the note was written, not filed.
4. **Write it down.** A short note per week, describing what now works that did not before. Eleven notes are where these slides came from.
5. **Cut on Monday, not Thursday.** Scope came off at the start of a week, while there was still time to reshape it, never in a panic two days before the review.
6. **Leave it running.** The Friday build stayed deployed over the weekend. Anyone who wanted to look – registrar, IT, a student – could, without asking anyone.

> If it was not running by Friday, it did not count as done.

# What we learned

Three things that transferred, and one that did not.

## Two ways of working

::: principles
### Worth keeping

- **Decide in the room.** Async is for reporting, not for deciding. Three decisions a week, each taking ten minutes, beat a fortnight of threads.
- **Prefer the boring tool.** One HTML file beat a toolchain, twice: once for the portal's docs and once for this deck.
- **Cut, don't defer.** "Later" is a graveyard with good intentions. The two features cut in week six were never missed.
- **Ship on Fridays.** A deadline every week is easier to hit than one deadline in eleven.

### Worth avoiding

- **Silent scope creep.** New work needs old work removed, explicitly and in the same conversation.
- **Status theatre.** A slide saying it works is not it working. We stopped accepting screenshots as evidence.
- **One owner per layer.** It made every handover a negotiation; end-to-end ownership removed the queue.
- **Estimating in hours.** Nobody was right once. Estimating in "does it fit this week" was right most weeks.
:::

## Three lessons

::: editorial
### Ship something real every single week.

Nothing aligned the team like a working artifact on a Friday afternoon. The
weekly note existed to describe that artifact, which is why the notes were
never late.

### One page of scope

If it did not fit on a page, we did not understand it yet.

### Mornings for the hard part

A third of the commits landed before 10 a.m. We stopped booking meetings there.

### The tooling has to disappear

Every hour spent on the build was an hour not spent on the portal.
:::
