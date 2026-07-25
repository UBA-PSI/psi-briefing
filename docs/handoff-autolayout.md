# Handoff: what laying out a real deck taught us, and what auto-layout has to survive

Written after rebuilding a real 17-step procedure (the psi-exam invigilation
document, 23 slides, 20 photographs) as a browserslides deck. Everything below
came out of that build. Nothing here is speculation about what might go wrong;
each item is a fault that actually occurred, with the measurement that found it.

The next task is auto-layout. Read this first, because the strongest finding is
that **the obvious approach to auto-layout is the one that already failed.**

---

## 1. The finding that matters most: a fill metric will lie to you

The deck’s first draft had slides whose content sat in the top half with a dead
band above the footer. The obvious diagnosis: `.cols` does not fill its height.
The obvious fix: stretch the boxes.

It was implemented and measured:

| | median ink fill | how it looked |
| --- | --- | --- |
| before | 74 % | content top, dead band below |
| **containers stretched** | **96 %** | **worse** |
| more content added | 96 % | right |

Stretching a `.panel` to full height draws a border around the empty space, so
the emptiness becomes *framed* instead of merely present. Stretched `.imgwrap`
images blew up, cropped badly, and pushed their text sibling off the slide. The
score improved and the deck got worse.

**Consequence for auto-layout.** Any optimiser driven by a fill score will
discover exactly this move, because it is the cheapest way to raise the number.
An auto-layout pass therefore needs either a loss term that punishes empty
bordered area, or a hard rule that it may not resize containers to close a gap.
The framework’s `align-content: start` is correct and deliberate, not a bug to
be optimised away.

The honest fix for whitespace was **content**: more from the source, or a
closing `.punch` line stating the slide’s takeaway. That is an authoring
decision, not a layout one, which is the second reason to be careful about
automating it.

---

## 2. Two kinds of detector, and the second kind is the valuable one

Six checks accumulated during the build (all in `SKILL.md`, section
"Verify in a browser"). They split into two groups:

**Symptom detectors** say *that* something is wrong:
`overflow`, `overlap`, `thin` (ink fill), `widows`, `longLines`.

**Cause detectors** point at the decision responsible:
`crampedLabels`.

The distinction is not academic. The timeline bug (`.tl` breaking "kurz vor 0"
across two lines) produced **no overflow, no overlap, and a perfectly healthy
fill score**. Every symptom detector passed. Only the cause detector found it,
because it asks a different question: *is a short string wrapping?* If yes, its
container is too narrow, and a too-narrow container is almost always a
hard-coded width meeting content it was not sized for.

**Consequence for auto-layout.** Cause detectors find faults that have not
surfaced yet, because the triggering content does not exist in this deck. They
are the ones worth extending. A useful next one: *is any grid track a fixed
length where the content is variable?* That is a static check on the CSS, not
on a rendered deck.

### Writing a detector: expect the first version to be useless

The naive cramped-label test returned 2 real hits and 5 false positives (bold
runs breaking mid-paragraph, display headings wrapping as intended). It was
only usable after measuring what separated the real cases:

| | real fault | false positive |
| --- | --- | --- |
| `display` | `block` (owns a cell) | `inline` (run inside prose) |
| parent | `grid` / `flex` | `block` |
| width | ≤ 14 cqw | wide |

With those three filters plus "not a heading": 2 hits, 0 false positives before
the fix, 0 after. **Do not ship a detector without checking its false positive
rate against a real deck.** A noisy detector is worse than none, because people
learn to ignore it.

---

## 3. Framework mechanics an auto-layout pass has to know

These are the specific behaviours that produced faults. All are load-bearing.

**`.cols` fills its container, not its content.** It carries `flex: 1` *and*
`align-content: start`. "The component has flex:1" does not mean the slide is
full. This is the single most misleading thing in the framework.

**Vertical centring is three different questions**, and they act on different
axes. Conflating them was the cause of two separate faults:

| Question | Modifier | Mechanism |
| --- | --- | --- |
| Is the whole row too high? | `.cols--center` | `align-content: center` on the grid |
| Do two columns of different length hang from the top? | `.cols--middle` | `justify-content: center` on each `.col` |
| Does an equal-height cell look top-heavy? | `.net--middle` | same, on the cell |

**`align-items: center` on the grid is a trap.** It was the first implementation
of `--middle` and it broke slide 12: un-stretching a column removes its definite
height, so any component that sizes itself to the space it is given (`.shots`,
`.chartbox`) balloons to its natural height and runs off the slide. Centring
must be done *inside* the stretched column, never by un-stretching it. Expect
the same trap anywhere auto-layout wants to "shrink to fit".

**Threshold-based equalisation works; unconditional does not.** `equaliseRows()`
levels side-by-side panels whose heights are within 28 % and leaves the rest
alone. Panels within a few percent look sloppy unlevelled; panels of genuinely
different length look worse levelled (see §1). It equalises with a class rather
than pixel heights, so it survives resize, and it removes the class before
measuring so the test sees natural heights. It only fires when the panel *is*
its column: a column stacking prose over a panel must keep its natural height,
or the panel is forced to full column height and overruns the text above it.

**This is the one automation in the framework that earns its place.** It is
conditional, measured, reversible, and it declines to act in the ambiguous case.
That is a reasonable template for anything auto-layout adds.

**Hard-coded track widths are a fault class.** `grid-template-columns: 7cqw 1fr`
is a guess about how long the labels will be. Three components had one; all
three are converted:

```css
.tl     { grid-template-columns: minmax(7cqw, max-content) 1fr; }
.tl li  { grid-template-columns: subgrid; grid-column: 1 / -1; }
.karenz { grid-template-columns: fit-content(26cqw) 1fr fit-content(10cqw); }
```

`minmax` gives a floor, `fit-content(x)` a ceiling, `subgrid` keeps rows aligned
without anyone naming a number. Proportional tracks (`1fr`, `1.5fr`) are *not*
this fault: those are shares of a row, not content-sized labels, and a fraction
is the right tool there.

**Modifiers with negative margins eat the gutter.** `.panel--flush` and
`.panel--marker` bleed left so their text lines up with the column above. In a
*right-hand* column that bleed comes straight out of the gutter: it cut a
3.5 cqw gutter to an effective 1.15 cqw and the columns visibly collided. Fixed
by dropping the bleed when the call-out is `:only-child` (nothing to line up
with anyway) and widening the gutter to 4.8 cqw. Any new modifier that shifts an
element sideways needs the same audit.

**The gutter needs more room than it looks like it needs.** It is the only thing
separating two blocks of text; near word-space width the eye reads across it and
the columns fuse.

---

## 4. What the human kept deciding, and why

The deck was built with a human in the loop giving feedback per slide. It is
worth recording which decisions they made, because those are the ones
auto-layout should probably *not* take:

- **Which call-out treatment** (tinted box flush with the column, versus a
  highlighter rule with no fill). Both were built and compared side by side; the
  choice was aesthetic and went to the rule.
- **Which band tone** (warm or cool) for a given deck.
- **Whether a slide should be centred at all.** Their words, on image/text
  balance: *"automatismus ist da glaub ich nicht die lösung"* – what they wanted
  was the option to fix it by hand, not a system that guessed.
- **How much text a slide should carry.** Every fill problem was ultimately
  solved by writing, not by layout.

They also rejected things a metric would have accepted: overly tracked caps
(`0.28em`, technically legible), blue on yellow (contrast fine, looked wrong),
and an "announcing" label above the sentence it announced.

**Consequence for auto-layout.** The useful target is probably not a system that
decides, but one that *surfaces and offers*: measures the deck, names the slides
with a problem, proposes the specific modifier, and applies it on confirmation.
The manual levers already exist and cover the observed cases.

---

## 5. Process notes that cost time

- **Browsers cache linked assets hard.** Twice, an edit appeared to have no
  effect and the file was fine. Add `?v=N` to `<link>`/`<script>` while working.
  Symptom worth recognising: `--type-scale` missing made every `calc()` invalid,
  so text fell back to exactly 16 px.
- **`fullPage` screenshots are unusable on this deck.** `scroll-snap` makes
  Playwright stitch duplicated frames; it looked like duplicated slides. Verify
  slide counts in the DOM and screenshot individual `.slide` elements.
- **Build the stress case first.** For the track-width fix there was no content
  in the deck that broke `.karenz`, so `test-aufsicht/stress-tracks.html` was
  written with deliberately longer German labels. It reproduced the fault, the
  detector caught it, the fix cleared it. That file is the regression test.
- **A verification step catches your own mistakes.** `build-deck.sh`'s check
  found its own stage file being created in `/tmp`, where relative paths
  resolved against the wrong directory and the inliner silently emitted a deck
  with every reference intact and none resolvable.
- **German is the harder test case.** Long compounds ("ERKLÄRVIDEO FÜR
  PRÜFLINGE", "Schreibzeitverlängerungen") break label widths and letterspacing
  assumptions that English never reaches. Test with German.

---

## 6. State of things

**Deck:** `test-aufsicht/aufsicht-deck.html` (gitignored). 23 slides, median ink
fill 97 %, no overflow, no overlap, no cramped labels, no long lines, no widows.
Slide 23 sits at 81 % deliberately – it is the closing summary and forcing
content onto it to hit a threshold would be exactly the mistake in §1.

Also there: `varianten-callout.html` (call-out and band comparisons) and
`stress-tracks.html` (track-width regression).

**Build:** `tools/build-deck.sh deck.html` runs optimise → inline → verify.
8.26 MB → 3.31 MB for this deck, verified to make zero network requests.

**Open, not started:** auto-layout itself.

**Open, small:** the `.net` cells still stretch to row height, so a short entry
leaves space under its text inside the border. `.net--middle` centres it, which
helps, but the underlying tension (equal-height cells versus unequal content) is
the same one auto-layout has to answer generally.

---

## 6a. Addendum from building the Markdown converter

`tools/md-to-deck.mjs` now infers layout from the structure of a Markdown
document, before rendering. Building its build-time fill estimator turned up two
things that revise this document.

**The fill metric lies a second way, and §6's "median ink fill 97 %" is
overstated.** A slide ending in a `.punch` measures ~97 % whatever sits above
the band: `.cols { flex: 1 }` pushes the band down to the footer, and the band's
bottom edge is the deepest painted pixel the audit can find. Re-measured on
`aufsicht-deck.html`, five of eighteen content slides scored 97 % while their
content stopped at 55–71 %, leaving 13–26 % of dead space under it (slides 9,
13, 14, 17, 18). The deck is not as full as the number said.

This is worse than the stretched-container case in §1, because there the fix was
wrong; here the fix is *right* — a `.punch` genuinely closes the frame and
states the takeaway, and `SKILL.md` recommends it — and it silences the metric
anyway. **Any move that adds a bottom-pinned element makes a fill score
meaningless.** An auto-layout pass driven by such a score would learn to add a
band to every thin slide.

`SKILL.md`'s audit now carries a `deadBand` check for it. Per §2 it was
calibrated before shipping: the naive version (gap under the content ≥ 12 %)
gave 7 hits with 2 false, both on rows the author had deliberately centred with
`cols--center`. Comparing the slack *above* the content with the slack *below*
and requiring an 8-point difference separates "hanging from the top" from
"centred": 5 hits, 0 false, across two decks. Same lesson as `crampedLabels` —
the first version of a detector is not the shippable one.

**Measure the row, not the slide.** The converter's estimator was changed to
report the fill of the *content row* — content height over the height the row
was given — instead of the painted fraction of the slide. That is the smallest
change that makes the number unbuyable: the band is not in the row, so it cannot
inflate it, but it still shrinks the room the row has, which is a real effect
and should show. On two slides identical but for a closing blockquote the row
metric reads 26 % and 31 %; an ink-fill metric reads 36 % and 49 %. Checked
against a browser on 18 content slides: mean error 7 points, 14 within 10,
errors in both directions.

**`cols--center` was demoted from an automatic fix to a suggestion**, after it
fired on 6 of 18 slides. Two reasons, and the second is the general one: it is
the only correction that changes nothing about the content, and a centred row is
excluded from the thin check by construction — so automating it would have made
the tool quiet exactly where it should speak. Any "fix" that also disables the
detector that found the problem is not a fix. §4 had already recorded the
author's own view on this one ("automatismus ist da glaub ich nicht die lösung").

**`.tl` now has a regression test, and writing it found a hole in
`crampedLabels`.** `test-aufsicht/stress-tracks.html` gained two `.tl` slides
with long German labels, including the original "kurz vor 0" case. The first
version of the test had no power: reinstating `grid-template-columns: 7cqw 1fr`
changed none of its assertions, because `.tl time` carries
`white-space: nowrap`. The label cannot wrap, so it clips — and `crampedLabels`,
which looks for a short string on more than one line, sees a normal one-line
label and reports nothing. **The cause detector is blind to the exact fault
class it was written for, whenever the label is a nowrap atom.**

`SKILL.md` gained `clippedLabels` (`scrollWidth > clientWidth`, skipping `<svg>`
because generated chart labels report it differently). Calibrated as §2
requires: 0 hits across six decks with the fix in place, 5 hits with the
hard-coded track reinstated, 0 again on restore. Note also the second-order
lesson — the test's first assertion silently never ran, because
`getComputedStyle(li).gridTemplateColumns` returns the string `"subgrid [] []
[]"` under subgrid and `parseFloat` of that is `NaN`, so every comparison was
false. **A regression test is not finished until you have watched it fail.**

**A build-time estimator is viable, and cheaper than it looks.** Predicting
painted height from the CSS geometry (the 88 cqw × 85.5 cqh content box, the
type scale, and the same average-glyph-width approximation the browser audit
uses) agreed with the browser on which slides were thin. Two calibration traps
found by comparing against real measurements: `.flow` carries `flex: 1` but also
`align-content: start`, so it does **not** fill its row — the same trap as
`.cols` in §3, and easy to get backwards; and `.editorial-layout` /
`.principle-columns` size to content and are then centred by `margin: auto`, so
their measured ink sits higher than their content volume implies. An estimator
that assumes a component fills is optimistic in exactly the direction that hides
thin slides.

## 7. If you change one thing, check these

Run the audit in `SKILL.md` after any framework change, on **both**
`test-aufsicht/aufsicht-deck.html` and `examples/example-deck.html`. The example
deck matters: it is the documentation, and it silently drifted out of compliance
with its own rules once already (six slides under the fill threshold, thirteen
eyebrows on fourteen slides, an "announcing" label the skill explicitly bans).

Then look at three or four slides. Every fault in this document that a metric
missed was found by looking.
