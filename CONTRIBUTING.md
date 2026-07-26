# Contributing

Bug reports, decks built with this, and patches are all welcome. This file is
mostly about the conventions that are not obvious from reading the code, so that
a patch does not get sent back over something nobody told you.

## Getting set up

There is nothing to install.

```bash
git clone https://github.com/UBA-PSI/psi-briefing.git
cd psi-briefing
python3 -m http.server 8000
# open http://localhost:8000/examples/example-deck.html
```

Node 18 or newer for the tools in `tools/`; the framework itself is CSS and one
plain script and needs nothing at all. `cwebp` or `magick` is optional and only
speeds up image-heavy decks.

## Before you open a pull request

```bash
tools/sync-assets.sh --check                                   # duplicated copies in step
node tools/md-to-deck.mjs examples/example-deck.md -o examples/example-deck-md.html
node tools/md-to-deck.mjs examples/tutorial.md -o examples/tutorial.html
tools/build-deck.sh examples/example-deck-md.html -o /tmp/x.html   # must exit 0
```

CI runs exactly these. Then **open a deck and look at it**, and run the audit
snippet from `skills/briefing/SKILL.md` in the console. Every fault recorded in
`docs/handoff-autolayout.md` that a metric missed was found by looking.

If you changed `framework/briefing.css`, `framework/briefing.js` or a theme, run
`tools/sync-assets.sh` – four copies of those files exist so the skill and the
local test decks are self-contained, and a stale copy makes your change appear
not to work.

## The conventions that will trip you up

**Never use `px` or `rem` inside a slide.** Everything is `cqw` and `cqh`, which
is what makes a deck scale proportionally instead of breaking at one size. A bare
`<p>` falls back to 16px and stops scaling – wrap free text in `.prose` or a
component that styles its own text. The audit has a check that halves the
container and looks for text whose size does not move.

**Never hard-code a grid track width.** `grid-template-columns: 7cqw 1fr` is a
guess about how long the content will be, and it is the fault class this project
has fixed three times. Use `minmax(floor, max-content)`, `fit-content(cap)`, or
`subgrid` so rows stay aligned without anyone naming a number.

**A theme is a `:root {}` override and nothing else.** If a theme has to restyle
a component, the component is wrong, not the theme.

**Do not add a dependency.** Not to the framework, not to the tools. "No
dependencies, no lockfile" is a property people choose this for, and the moment
there is one lockfile there is a supply chain.

**Do not fix whitespace by stretching a container.** This is measured and written
up in `docs/handoff-autolayout.md` §1: it raised median ink fill from 74 % to
96 % and made the deck visibly worse, because a stretched bordered panel frames
the empty space instead of removing it. The honest fixes are more content, a
closing `.punch`, or merging two thin slides.

**Typography.** German quotation marks are `„…“`, apostrophes are `’`, and the
em dash is not used – en dash for parenthetical breaks, spaced in German. The
Markdown converter applies this automatically to slide text; it deliberately does
not touch code spans, so an example that *teaches* a character should show the
one the project actually uses.

## Comments, commit messages, documentation

This codebase has an unusual convention and it is deliberate: **a comment
explains why, and names the concrete failure it prevents.** There are a lot of
comments that read like short paragraphs. Where a number appears – a threshold, a
tolerance, a magic constant – the comment says where the number came from and,
where possible, what was measured. `# run the tests` would be out of place.

The same goes for commit messages. They are long here because the reasoning is
the part that is expensive to reconstruct later.

**If you claim something is better, measure it.** Fill percentages, byte counts,
character counts per line: this project has been wrong often enough about "that
looks better" that the measurement is now the argument. Report the number both
ways round, before and after.

**A detector is not finished until you have watched it fail.** If you add a check
to the audit in `SKILL.md`, calibrate it: introduce the fault, confirm it fires,
remove the fault, confirm it goes quiet, and state the false-positive count
against a real deck. A noisy check is worse than none, because people learn to
ignore it.

## Where things live

| Path | What it is |
| --- | --- |
| `framework/` | The core CSS and the runtime. The originals. |
| `themes/` | Token overrides. Nothing else belongs here. |
| `tools/` | The converter and the build pipeline, dependency-free. |
| `docs/cookbook.md` | The component catalog. Mirrored into the skill by `sync-assets.sh`. |
| `docs/markdown.md` | The Markdown authoring reference. |
| `docs/handoff-autolayout.md` | Why things are the way they are, with the measurements. Read this before arguing with a design decision. |
| `skills/briefing/` | The Claude Code skill. Carries its own copy of the framework. |
| `examples/` | The worked example and the tutorial deck. Both are documentation. |

`examples/example-deck.html` is hand-maintained source. `examples/example-deck-md.html`
and `examples/tutorial.html` are generated and gitignored – edit the `.md`.

## The example decks are documentation

They are built in CI and published to the Pages site, so a change that breaks
them breaks the front page. They have also silently drifted out of compliance
with the project's own rules once before. If you change layout behaviour, check
what it did to both of them.

## Reporting a bug

The useful report says what you expected, what happened, and ideally the smallest
`.md` that reproduces it. If it is a layout bug, the console output of the audit
in `SKILL.md` is worth more than a screenshot, because the interesting faults are
the ones that look fine.

## Licence

MIT, and by contributing you agree your contribution is licensed the same way.
Fonts are not covered: the default theme uses system faces, and anything you
embed with `tools/embed-fonts.mjs` carries its own licence, which has to travel
with the deck.
