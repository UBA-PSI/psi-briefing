# Handoff: what laying out a real deck taught us, and what auto-layout has to survive

Written after rebuilding a real 17-step procedure (the psi-exam invigilation
document, 23 slides, 20 photographs) as a psi-briefing deck. Everything below
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
wrong; here the fix is *right* – a `.punch` genuinely closes the frame and
states the takeaway, and `SKILL.md` recommends it – and it silences the metric
anyway. **Any move that adds a bottom-pinned element makes a fill score
meaningless.** An auto-layout pass driven by such a score would learn to add a
band to every thin slide.

`SKILL.md`'s audit now carries a `deadBand` check for it. Per §2 it was
calibrated before shipping: the naive version (gap under the content ≥ 12 %)
gave 7 hits with 2 false, both on rows the author had deliberately centred with
`cols--center`. Comparing the slack *above* the content with the slack *below*
and requiring an 8-point difference separates "hanging from the top" from
"centred": 5 hits, 0 false, across two decks. Same lesson as `crampedLabels` –
the first version of a detector is not the shippable one.

**Measure the row, not the slide.** The converter's estimator was changed to
report the fill of the *content row* – content height over the height the row
was given – instead of the painted fraction of the slide. That is the smallest
change that makes the number unbuyable: the band is not in the row, so it cannot
inflate it, but it still shrinks the room the row has, which is a real effect
and should show. On two slides identical but for a closing blockquote the row
metric reads 26 % and 31 %; an ink-fill metric reads 36 % and 49 %. Checked
against a browser on 18 content slides: mean error 7 points, 14 within 10,
errors in both directions.

**`cols--center` is automatic after all, once the two questions are separated.**
It was first demoted to a suggestion on the grounds that a centred row is
excluded from the thin check by construction, so automating it would silence the
tool exactly where it should speak. That objection was aimed at the wrong thing.
The problem was never the centring; it was that one number was being asked to
answer two questions.

Split them and both work. *Arrangement*: a short row hanging from the top leaves
its slack in one lump above the closing band and reads as broken, while the same
slack split above and below reads as composed – so centre it, automatically.
*Content volume*: the row fill is computed from content over room and is
unaffected by where that room sits, so the slide keeps its honest reading and
stays in the thin list, marked `(centred)`. Measured on the 23-slide deck: 10
rows centred, every dead band symmetric afterwards (19/19, 11/11, 17/17 …),
`deadBand` silent on all of them, and the measured row fills unchanged at 44 %,
52 %, 46 %.

The general lesson is worth more than the specific fix: **before rejecting an
automation because it would suppress a signal, check whether the signal is
conflating two things.** §4's note that the author wanted to keep the centring
decision came from an image/text balance case, and was over-generalised here.

**`.tl` now has a regression test, and writing it found a hole in
`crampedLabels`.** `test-aufsicht/stress-tracks.html` gained two `.tl` slides
with long German labels, including the original "kurz vor 0" case. The first
version of the test had no power: reinstating `grid-template-columns: 7cqw 1fr`
changed none of its assertions, because `.tl time` carries
`white-space: nowrap`. The label cannot wrap, so it clips – and `crampedLabels`,
which looks for a short string on more than one line, sees a normal one-line
label and reports nothing. **The cause detector is blind to the exact fault
class it was written for, whenever the label is a nowrap atom.**

`SKILL.md` gained `clippedLabels` (`scrollWidth > clientWidth`, skipping `<svg>`
because generated chart labels report it differently). Calibrated as §2
requires: 0 hits across six decks with the fix in place, 5 hits with the
hard-coded track reinstated, 0 again on restore. Note also the second-order
lesson – the test's first assertion silently never ran, because
`getComputedStyle(li).gridTemplateColumns` returns the string `"subgrid [] []
[]"` under subgrid and `parseFloat` of that is `NaN`, so every comparison was
false. **A regression test is not finished until you have watched it fail.**

**A build-time estimator is viable, and cheaper than it looks.** Predicting
painted height from the CSS geometry (the 88 cqw × 85.5 cqh content box, the
type scale, and the same average-glyph-width approximation the browser audit
uses) agreed with the browser on which slides were thin. Two calibration traps
found by comparing against real measurements: `.flow` carries `flex: 1` but also
`align-content: start`, so it does **not** fill its row – the same trap as
`.cols` in §3, and easy to get backwards; and `.editorial-layout` /
`.principle-columns` size to content and are then centred by `margin: auto`, so
their measured ink sits higher than their content volume implies. An estimator
that assumes a component fills is optimistic in exactly the direction that hides
thin slides.

## 6c. Findings from a full read of the project

A review pass over every file. Ordered by how quietly each thing failed.

**A check that could never fire.** `build-deck.sh`'s verify step blanked
`<script>` elements with `"<script></script>"` – replacing the *opening tag* as
well, so the `src` attribute it then went looking for had already been deleted.
The "external script" check had therefore never matched anything, and the script
printed **"no external references"** for a deck loading a remote `<script src>`.
That is the one promise the whole pipeline exists to keep. The fix is a capturing
replacement (`"$1$2"`), which preserves the reason the content was blanked at all
(the framework CSS header quotes `<link>` lines as documentation) while leaving
the tag itself intact. The general lesson: a sanitising step that runs *before* a
detector can remove the evidence the detector was written to find, and a check
that never fires looks exactly like a check that always passes.

**A guess dressed as a default.** The runtime filled in a missing `<html lang>`
with `"en"`. Harmless while nothing read it; now that hyphenation depends on
`lang`, an undeclared German deck would have been broken at English break points
and read aloud in English by a screen reader. Replaced with a console warning –
with no `lang` at all, browsers simply do not hyphenate, which is the safe
failure.

**Two handlers, one keypress.** `.bottomline` handles Space to open its detail
layer and calls `preventDefault()`. The document-level key handler then ran
anyway – `preventDefault` stops the default action, not the propagation – so one
press both opened the layer and advanced the deck. Guarded with
`ev.defaultPrevented`.

**Silent corruption paths.** Three places passed author-controlled text through
APIs where a metacharacter is still special: `JSON.stringify` into an inline
`<script>` (a chart label containing `</script` ends the block, because the HTML
parser looks for that string before any JavaScript is read), and
`String.replace(stringPattern, replacement)` twice in `inline-deck.mjs`, where
`$&` and `$1` in the *replacement* remain live. None had triggered; all three are
cheap to close and expensive to diagnose.

**WebP is not always smaller.** `optimise-images.mjs` reported an optimisation
whether or not it had achieved one. A flat-colour screenshot at q82 regularly
encodes *larger* than its source PNG, and the deck got heavier. It now keeps
whichever file wins and says so. Related: `photo.png` and `photo.jpg` in one
folder both map to `photo.webp`, and the second used to overwrite the first –
refused now, but only for collisions *within* a run, since refusing pre-existing
files would make every second `build-deck.sh` run skip every image.

**Duplicated files drift, and the drift is invisible.** Four copies of the
framework CSS/JS (skill references, test decks) and two of the component catalog.
Adding `.cols--figure` looked like it had no effect for two rounds of debugging,
because the deck was linking a stale copy. `tools/sync-assets.sh` copies or, with
`--check`, reports.

**Documentation rot, found by reading it against the code.** `tools/README.md`
opened with "Two small, dependency-free helper scripts" and documented two of six
tools – `md-to-deck.mjs`, `build-deck.sh` and `optimise-images.mjs` were absent.
All four tool headers claimed "CC BY 4.0" against an MIT `LICENSE`.

**Not fixed, on purpose.** `inline-deck.mjs` embeds one data URI per `<img>` tag,
so an image reused on three slides is carried three times; de-duplicating means a
lookup table and a runtime, which costs more than it saves for a deck that should
not be reusing photographs anyway. `optimise-images.mjs` rewrites only
`<img src>`, not CSS `url()`. `.pipe--offset` translates by a hard-coded
`10.7cqh` – the fault class of §3, in a place no detector looks.

**One thing this review got wrong, worth recording.** An ad-hoc paraphrase of
`crampedLabels` (element height vs line-height) reported three false positives on
`.tl time`, because a grid item stretches to its row and its box height says
nothing about how many lines it holds. The real check in `SKILL.md` uses
`Range.getClientRects()` line tops and reported none. If you re-implement a
detector from memory to run it quickly, you are testing your memory.

## 6d. Reveals: the slides no metric was looking at

A `.detail-layer` is a full-slide panel outside the scroll path – the mechanism
the retro decks used for optional depth. The markup and the runtime were both
already here; what was missing was everything around them.

**A reveal was not built like a slide, even though it is one.** From Markdown,
`::: detail` rendered its body with `renderBlocks`: flat `h3`/`p`, no shape
inference, and – worst – bare `<p>` elements, which fall back to 16 px and stop
scaling with the frame. The framework's loudest documented trap, in the one place
nobody looks. The body now goes through the same planner as a slide, so a reveal
gets its `h2`, its columns, its closing band. The fix was mostly *factoring*: the
sequence eyebrow → heading → lede → body → note → band is now one function used
by both, which is why the two cannot drift apart again.

**Every audit check walked straight past them.** `display: none` has no geometry,
so an overfull reveal was invisible until someone clicked it in front of an
audience. The new check opens each layer, measures, and restores it. Two things
about that check are worth keeping:

- Measure the deepest painted **descendant**, not the direct children. The
  components inside are `flex: 1` / `1fr`, so their boxes never exceed the layer
  however much text they hold – text overflows inside a `.net` cell while the
  `.net` box reports a perfect fit. Children said 0 on a layer that was 10 px
  over; descendants found it.
- To ask "does this text scale?", **halve the container and look**. A cq-based
  size follows it, a hard-coded px does not. The first version guessed from class
  names instead (`<p>` with no `.prose` ancestor) and reported four false
  positives on perfectly good `.net p` markup. Verified against a planted bare
  `<p>`: one hit at 16 px unchanged, nine other elements clean.

**A reveal is chrome, not a column.** Because `::: detail` was a group like any
other, it took half the row on the example deck's chart slide – demoting a
full-width `.chartbox` to one column of two and dropping the row from 100 % to
59 %. It is now pulled out of the layout like `note` and `source`. The general
shape: a directive that renders *around* the body must never be planned *as* the
body, and the symptom is a fill number that moves when you add chrome.

**One threshold was serving two different jobs.** The reveal came out at 78 % row
fill and the report flagged it, so the first instinct was to add sentences until
the number went up – which is exactly the behaviour §1 exists to forbid, applied
to a doc example. The 85 % target exists because a slide is projected in front of
a room and empty space on it is space nobody chose. A reveal is opened by one
reader who asked one question; its job is to answer it and get out of the way.
Different jobs, so reveals are now judged at 60 %. The lesson is not the number:
it is that reaching for content to satisfy a metric is a signal to go and look at
whether the metric applies.

**Interaction bugs the reveal work surfaced.** An arrow key paged the deck
*behind* an open layer, which then stayed open on a slide nobody was looking at –
the deck's key handler now stands down while any overlay is up. Tab walked out of
the panel into the invisible slide underneath. Focus never came back to the strip
on close. And on a slide with two reveals, both strips opened the first layer,
because the pairing fell back to `slide.querySelector('.detail-layer')`; the
retro deck happened to be immune only because its markup interleaves them.

**And a documentation claim that was simply false.** Both `SKILL.md` and the
cookbook stated that `.punch` carries `margin-top: auto`. It does not, and never
did: the band is pushed down by the `flex: 1` on the `.cols` above it. The first
instinct was to add the missing `auto` and make the docs true – but that would be
wrong. After a `.kulissen` list or a `.doc` there is no `flex: 1` sibling, and a
band floated to the bottom of a short list *opens* a dead band rather than
closing one, which is the fault `deadBand` exists to find. The framework was
right and the prose was wrong, so the prose changed. Worth noticing how close
that came to a regression justified by a comment.

## 6e. The band hides overflow as well as emptiness

§6a recorded that a bottom-pinned `.punch` inflates a fill score, because the
band's own bottom edge becomes the deepest ink. The same band hides the opposite
fault, and that took longer to notice.

A row with `flex: 1` shrinks under pressure rather than pushing its siblings
down. So when the row's content outgrows the room the row was given, the content
spills *over* the band while the band itself never moves, and the deepest painted
pixel on the slide stays above the footer. **The overflow check reads clean on a
slide whose panel is sitting on top of its own closing line.**

Calibrated by growing one panel a sentence at a time at 1600 × 900, a single
`.panel` in a one-column row with a `.punch` beneath it:

| panel content | overflow check says | content over the band |
| --- | --- | --- |
| 10 sentences | clean | 16 px |
| 11 sentences | clean | 75 px |
| 12 sentences | 6 px | 105 px |
| 14 sentences | 125 px | 224 px |

The blind spot is about one band's height wide, and everything inside it is
invisible to every other check in `SKILL.md`. `bandCollision` asks the direct
question instead: does any painted box in the row reach past the top of the band.
Zero hits across 50 slides in three finished decks, and it fires at 16 px where
the overflow check is silent.

Two lessons. **A fault that a bottom-pinned element can absorb needs its own
check** — the band has now defeated three separate metrics in this project, and
each time the fix was to stop measuring the slide as a whole and measure the
relationship between two named boxes instead. And this one surfaced because an
agent reported the fault it had introduced mid-task rather than only the state it
left behind; asking for that explicitly is what turned a transient mistake into a
permanent check.

## 6f. A known weakness in the estimator, left in place on purpose

The tutorial's last slide is a `::: cols--3` of three text cards. The report flags
it `!` — "will not fit" — while the browser measures 25 px of headroom at 1600 ×
900 and 16 px at 1024 × 768. The flag is wrong, and it is wrong every time the
deck is built.

It was tempting to shorten a card until the number came right. That is the same
mistake as padding a slide to raise a fill score, run backwards: changing content
that is fine in order to satisfy a measurement that is not. So the content stands
and the flag is documented here instead.

Where to look, for whoever picks this up: a *directive* named `cols--3` does not
reach the `kind === 'cols'` branch of `columnWidths`. It falls to the generic one,
which infers the column count from the group count and computes the width itself.
Three narrow columns are also where the average-glyph-width approximation is
weakest, since the error compounds per line and there are more lines per column.
Both effects push the same way, which is why the flag is confidently wrong rather
than slightly wrong.

The lesson is about the flag rather than the arithmetic. `~` means "look at this",
and being wrong occasionally costs nothing. `!` claims a slide is broken, and one
that cries wolf on every build teaches the reader to ignore it — which is exactly
what a detector must never do (§2). If this cannot be made accurate, `!` should
become `~` for the layouts where the estimate is known to be unreliable.

## 7. If you change one thing, check these

Run the audit in `SKILL.md` after any framework change, on **both**
`test-aufsicht/aufsicht-deck.html` and `examples/example-deck.html`. The example
deck matters: it is the documentation, and it silently drifted out of compliance
with its own rules once already (six slides under the fill threshold, thirteen
eyebrows on fourteen slides, an "announcing" label the skill explicitly bans).

Run `tools/sync-assets.sh --check` too. Half of a framework change is invisible
while a deck links a stale copy of it.

And **open the reveals.** Nothing about them is on screen by default, so the eye
misses them as reliably as the metrics did. `test-aufsicht/reveal.html` covers
two on one slide, `reveal-overfull.html` is the deliberately overfull one the
`revealOverflow` check is calibrated against, and `reveal-bad.html` holds the two
mispaired-markup cases that must produce console warnings rather than a silently
wrong panel.

Then look at three or four slides. Every fault in this document that a metric
missed was found by looking.
