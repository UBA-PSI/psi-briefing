#!/usr/bin/env node
// md-to-deck.mjs — turn a Markdown document into a browserslides deck.
//
// Part of the browserslides toolchain (MIT). Dependency-free: Node built-ins
// only (fs, path). Requires Node 18+ (ESM).
//
// WHY THIS EXISTS
//   Authoring a deck by hand means picking components out of a 40-entry
//   catalog and getting the markup right. This tool infers the component from
//   the *shape* of the content instead: three equal-ranked ### blocks become a
//   three-column panel row, four become a .net grid, a blockquote becomes the
//   closing .punch band. You write a document; you get a slidedoc.
//
//   The inference happens before anything is rendered, which is deliberate.
//   docs/handoff-autolayout.md records that layout chosen by optimising a fill
//   score over rendered slides fails: the cheapest way to raise the score is
//   to stretch containers, which frames the empty space instead of removing it
//   (median fill 74 % -> 96 %, deck visibly worse). So no correction in this
//   tool ever resizes a container. Corrections rearrange content or split a
//   slide; nothing else.
//
// USAGE
//   node tools/md-to-deck.mjs deck.md [-o deck.html] [--no-fix] [--quiet]
//   node tools/md-to-deck.mjs --help
//
// The output is ordinary browserslides HTML, meant to be readable and
// hand-editable afterwards. Run tools/build-deck.sh on it to get a single
// self-contained file.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const HELP = `md-to-deck.mjs — Markdown (plus HTML where you need it) -> a browserslides deck

USAGE
  node tools/md-to-deck.mjs <input.md> [-o <output.html>] [options]

OPTIONS
  -o <file>     Output path (default: <input>.html next to the input)
  --no-fix      Report layout problems but change nothing
  --quiet       Suppress the report (exit code still signals hard errors)
  --help        This text

DOCUMENT STRUCTURE
  ---            YAML frontmatter at the top of the file (deck-level settings)
  # Heading      First one: the title slide. Every later one: a section
                 divider. Dividers are numbered and the title slide's table of
                 contents is built from them, so the two cannot drift apart.
  ## Heading     One content slide.
  ---            A slide break (for a slide with no heading, or to split one).
  {#id ...}      Optional attribute line under a heading (see ATTRIBUTES).

INSIDE A SLIDE — what shape becomes what
  ### blocks x2        -> two columns of panels
  ### blocks x3        -> three columns of panels
  ### blocks x4        -> a bordered 2x2 grid (.net)
  ### blocks x5-8      -> two columns of stacked cards (.cardcol)
  paragraphs + one ### -> prose on the wide side, call-out on the narrow one
  paragraphs + images  -> text one side, gallery the other
  images only          -> a gallery (one image is shown whole, not cropped)
  > blockquote         -> the closing .punch band, pinned to the bottom
  first short para     -> a .lede under the heading
  - bullet list        -> a .kulissen list
  1. ordered list      -> numbered .flow steps, if the items have bold leads
  **12** — label       -> a .facts grid of big numbers
  | a | b |            -> a two-column table becomes a .tl label/value list

  Anything else you can force with a directive:

      ::: cols--3
      ### One
      ### Two
      ### Three
      :::

  Directive names are component names from the catalog (cols--2, cols--3,
  cols--wide-left, net, cardcol, flow, facts, editorial, principles, delta,
  chat, timeline, kulissen, shots, stack, doc, sandwich, tracker, punch,
  punch--accent, lede, note, source, statement, question, quote, chart, html).
  An unknown name becomes <div class="that-name"> with its body rendered
  inside, so any catalog component is reachable. ::: html passes its body
  through untouched. Raw HTML blocks in the Markdown also pass through.

ATTRIBUTES (one optional line directly under a slide heading)
  {#anchor}                 give the slide an id, so [text](#anchor) can link
  {eyebrow="Schritt 4"}     add a kicker (leave it out unless it earns its line)
  {footer="Custom footer"}  override the deck footer for this slide
  {.statement}              add a class to the .slide element
  {keep}                    exempt this slide from layout corrections

FRONTMATTER KEYS
  title, subtitle, footer, lang (de|en), theme (bamberg|midnight|...),
  assets (dir holding browserslides.css/js, default framework/ + themes/),
  css / js (explicit paths, override assets+theme), strip (title-slide
  numbers, "17: Schritte am Prüfungstag"), takeaway, typescale, hint,
  rotatehint (true|false), fill (target ink fill in %, default 85)

WHAT IT CORRECTS BY ITSELF
  Fewer or more columns, .cols--middle for uneven rows, .cols--center for a
  genuinely short row, images moved to the wide side, and splitting a slide
  that cannot fit. It never stretches a container to close a gap, and it never
  invents content: a thin slide with nothing to rearrange is reported, not
  "fixed". Use --no-fix to get the report only.

TYPOGRAPHY
  Straight quotes, apostrophes and -- are converted to the marks the deck's
  language wants (German „…“, English “…”, en dash, never an em dash), except
  inside code spans, code blocks and HTML attributes.
`;

// ---------------------------------------------------------------------------
// Geometry. Every number here is read off framework/browserslides.css; the
// comment names the rule it comes from. The estimator is only as honest as
// these, so keep them in sync if the CSS changes.
// ---------------------------------------------------------------------------
const G = {
  // .slide-inner { padding: 5.5cqh 6cqw 9cqh }
  padTop: 5.5, padBottom: 9, padSide: 6,
  // h2 { font-size: 3.4cqw; line-height: 1.15; margin-bottom: 1cqh }
  h2Size: 3.4, h2Line: 1.15, h2Margin: 1,
  // .eyebrow { font-size: calc(1.35cqw * scale); margin-bottom: 1.4cqh }
  eyebrowSize: 1.35, eyebrowMargin: 1.4,
  // .lede { font-size: calc(1.55cqw * scale); line-height: 1.55; margin-bottom: 2.2cqh; max-width: 58cqw }
  ledeSize: 1.55, ledeLine: 1.55, ledeMargin: 2.2, ledeMax: 58,
  // .cols { gap: 4.8cqw; margin-top: 3cqh }   .col { gap: 3.6cqh }
  colsGap: 4.8, colsMarginTop: 3, colGap: 3.6,
  // .prose { font-size: calc(1.35cqw * scale); line-height: 1.6 }  > * { margin-bottom: 1.2cqh }
  proseSize: 1.35, proseLine: 1.6, proseGap: 1.2,
  proseDenseSize: 1.15, proseDenseLine: 1.5,
  // .panel { padding: 3cqh 2.6cqw }   .tl-head { ...; padding-bottom: 1cqh; margin-bottom: 1.6cqh }
  panelPadV: 3, panelPadH: 2.6, tlHeadSize: 1.3, tlHeadLine: 1.35, tlHeadMargin: 2.6,
  // .net > div { padding: 2.2cqh 2cqw }  .net h3 { 2.0cqw; margin-bottom: 1cqh }  .net p { 1.3cqw/1.55 }
  netPadV: 2.2, netPadH: 2, netH3: 2.0, netH3Margin: 1, netP: 1.3, netPLine: 1.55, netGap: 1.6,
  // .panel h3 { font-size: calc(1.95cqw * scale); margin-bottom: 0.9cqh }
  panelH3: 1.95, panelH3Margin: 0.9,
  // .cardcol { gap: 1.5cqh }  > div { padding: 1.6cqh 1.6cqw }  h3 1.45cqw  p 1.22cqw/1.5
  cardGap: 1.5, cardPadV: 1.6, cardPadH: 1.6, cardH3: 1.45, cardP: 1.22, cardPLine: 1.5,
  // .kulissen li { font-size: calc(1.32cqw * scale); line-height: 1.5; padding: 1.3cqh 0 }
  kulSize: 1.32, kulLine: 1.5, kulPad: 1.3,
  // .punch { padding: 2.2cqh 2.2cqw; font-size: calc(1.5cqw * scale); line-height: 1.5; margin-top: 2.4cqh }
  punchSize: 1.5, punchLine: 1.5, punchPadV: 2.2, punchPadH: 2.2, punchMargin: 2.4,
  // .fstep { padding-bottom: 3.4cqh; padding-left: 4.6cqw }  h3 1.5cqw  p 1.25cqw/1.5
  fstepPadBottom: 3.4, fstepPadLeft: 4.6, fstepH3: 1.5, fstepP: 1.25, fstepPLine: 1.5,
  flowGap: 6,
  // .facts { grid-auto-rows: 1fr } — a facts row always fills, height is not text-driven
  // .gallery-note { font-size: calc(1.1cqw * scale); margin-top: 1.6cqh }
  noteSize: 1.1, noteMargin: 1.6,
  // .tl li { font-size: calc(1.42cqw * scale); line-height: 1.38; padding: 0.6cqh 0 }  .sub 1.08cqw
  tlSize: 1.42, tlLine: 1.38, tlPad: 0.6, tlSub: 1.08,
  typeScale: 1.2,           // :root { --type-scale: 1.2 }
  // Average glyph advance as a fraction of font size. Same approximation the
  // audit in SKILL.md uses for its long-line check, so the two agree.
  glyphRatio: 0.5,
};

// A slide is 16:9, so one cqw of height equals 16/9 cqh.
const CQW_TO_CQH = 16 / 9;
const contentWidth = () => 100 - 2 * G.padSide;              // 88cqw
const contentHeight = () => 100 - G.padTop - G.padBottom;    // 85.5cqh
const scaled = (cqw) => cqw * G.typeScale;

// Height in cqh of `chars` characters of text at `size` cqw (pre-scale) with
// `lh` line-height, set in a column `width` cqw wide.
function textHeight(chars, size, lh, width) {
  const fs = scaled(size);
  const perLine = Math.max(8, Math.floor(width / (fs * G.glyphRatio)));
  const lines = Math.max(1, Math.ceil(chars / perLine));
  return lines * fs * lh * CQW_TO_CQH;
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------
const NUL = ' ';
const textOf = (html) => html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;|&#\d+;/gi, 'x');
const len = (html) => textOf(html).trim().length;

function die(msg) {
  process.stderr.write(`md-to-deck: ${msg}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Frontmatter. A deliberately small YAML subset: `key: value`, plus
//    `- item` lists and [a, b] flow lists. Enough for deck settings; anything
//    more belongs in the document, not in its header.
// ---------------------------------------------------------------------------
function parseFrontmatter(src) {
  if (!/^---\r?\n/.test(src)) return { meta: {}, body: src };
  const end = src.indexOf('\n---', 3);
  if (end === -1) return { meta: {}, body: src };
  const raw = src.slice(4, end);
  const body = src.slice(src.indexOf('\n', end + 1) + 1);
  const meta = {};
  let listKey = null;
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && listKey) { meta[listKey].push(unquote(item[1])); continue; }
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    const [, key, rest] = kv;
    if (rest === '') { listKey = key; meta[key] = []; continue; }
    listKey = null;
    if (/^\[.*\]$/.test(rest)) {
      meta[key] = rest.slice(1, -1).split(',').map((s) => unquote(s.trim())).filter(Boolean);
    } else {
      meta[key] = unquote(rest);
    }
  }
  return { meta, body };
}
const unquote = (s) => s.replace(/^["'](.*)["']$/, '$1').trim();
const truthy = (v) => v !== undefined && v !== false && !/^(false|no|0|off)$/i.test(String(v));

// ---------------------------------------------------------------------------
// 2. Inline Markdown -> HTML, plus typographic normalisation.
//
//    Order matters. Code spans and raw HTML tags are lifted out first so that
//    quote conversion cannot reach into an attribute or a class name; SKILL.md
//    is explicit that straight quotes stay straight inside markup.
// ---------------------------------------------------------------------------
function inline(text, ctx) {
  const kept = [];
  const keep = (s) => { kept.push(s); return `${NUL}${kept.length - 1}${NUL}`; };

  let s = text;
  // Code spans, then raw HTML tags, out of harm's way.
  s = s.replace(/`([^`]+)`/g, (_, code) => keep(`<code>${escapeText(code)}</code>`));
  s = s.replace(/<\/?[A-Za-z][^>]*>/g, (tag) => keep(tag));

  // Images. On a slide these only appear inside a gallery builder, but an
  // inline one still has to render.
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, src) => keep(`<img src="${src}" alt="${escapeAttr(alt)}">`));

  // Links. An in-page target becomes a cross-reference with a hover preview;
  // anything leaving the deck opens in a new tab (SKILL.md: a deck is read
  // full-screen, navigating away strands the reader).
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, label, href) => {
    if (href.startsWith('#')) {
      ctx.gotoTargets.add(href.slice(1));
      return keep(`<a class="goto" href="${href}">`) + label + keep('</a>');
    }
    return keep(`<a href="${href}" target="_blank" rel="noopener">`) + label + keep('</a>');
  });

  // Emphasis. `**` and `_` are unrestricted; a single `*` is only emphasis
  // when it does not sit inside a word, because German gender asterisks
  // ("Prüfer*in", "Nutzer*innen") are extremely common in this material and
  // would otherwise be swallowed as italics.
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, t) => `<b>${t}</b>`);
  s = s.replace(/(^|[\s([{«„"'‘-])\*([^*\s][^*]*?)\*(?=$|[\s.,;:!?)\]}»“"'’-])/g,
    (_, pre, t) => `${pre}<i>${t}</i>`);
  s = s.replace(/(^|[^\w])_([^_\s][^_]*?)_(?=$|[^\w])/g, (_, pre, t) => `${pre}<i>${t}</i>`);

  s = typography(s, ctx);
  s = escapeText(s, true);

  return s.replace(new RegExp(`${NUL}(\\d+)${NUL}`, 'g'), (_, i) => kept[Number(i)]);
}

// Convert the marks the framework's audit checks for. German's closing mark is
// the same character as English's opening one, which is why it is so often
// wrong; the pair is chosen from the deck language.
function typography(s, ctx) {
  const de = ctx.lang !== 'en';
  const [open, close] = de ? ['„', '“'] : ['“', '”'];
  let out = s;
  let n = 0;
  out = out.replace(/"([^"]*)"/g, (_, inner) => { n += 2; return `${open}${inner}${close}`; });
  // A lone straight quote left over is still wrong, but we cannot know which
  // half it is - report rather than guess.
  const strays = (out.match(/"/g) || []).length;
  // Apostrophes: only between letters, so a stray quote is not mangled.
  out = out.replace(/(\w)'(\w)/g, (_, a, b) => { n += 1; return `${a}’${b}`; });
  // Dashes. Never an em dash: wrong in German typography and a tired tic
  // elsewhere. Ranges stay unspaced, parenthetical breaks keep their spaces.
  out = out.replace(/—/g, () => { n += 1; return '–'; });
  out = out.replace(/(\s)--(\s)/g, (_, a, b) => { n += 1; return `${a}–${b}`; });
  out = out.replace(/(\d)\s*--\s*(\d)/g, (_, a, b) => { n += 1; return `${a}–${b}`; });
  out = out.replace(/\.\.\./g, () => { n += 1; return '…'; });
  ctx.typoFixes += n;
  ctx.strayQuotes += strays;
  return out;
}

// `&` is the only character we escape in prose: authors are invited to write
// HTML where Markdown runs out, so `<` must pass through. An existing entity
// is left alone.
function escapeText(s, keepEntities = false) {
  if (!keepEntities) return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return s.replace(/&(?![A-Za-z][A-Za-z0-9]*;|#\d+;|#x[0-9A-Fa-f]+;)/g, '&amp;');
}
const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// ---------------------------------------------------------------------------
// 3. Block parser. Produces a flat list of blocks; slide splitting comes next.
// ---------------------------------------------------------------------------
function parseBlocks(lines, start = 0, stopAtFence = false) {
  const blocks = [];
  let i = start;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (stopAtFence && /^:::\s*$/.test(trimmed)) return { blocks, next: i + 1 };

    if (!trimmed) { i += 1; continue; }

    // Directive fence: ::: name key=value
    const dir = trimmed.match(/^:::\s*([A-Za-z][\w-]*)\s*(.*)$/);
    if (dir) {
      const inner = parseBlocks(lines, i + 1, true);
      blocks.push({ type: 'directive', name: dir[1], args: parseArgs(dir[2]), blocks: inner.blocks });
      i = inner.next;
      continue;
    }

    // Slide break. Must be checked before anything else that starts with `-`.
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { blocks.push({ type: 'break' }); i += 1; continue; }

    // Heading
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      blocks.push({ type: 'heading', level: h[1].length, text: h[2].replace(/\s+#+\s*$/, '') });
      i += 1;
      // An attribute line may follow immediately.
      const attr = (lines[i] || '').trim().match(/^\{(.*)\}$/);
      if (attr) { blocks.push({ type: 'attrs', attrs: parseAttrs(attr[1]) }); i += 1; }
      continue;
    }

    // Fenced code
    const fence = trimmed.match(/^(```+|~~~+)\s*([\w-]*)\s*$/);
    if (fence) {
      const mark = fence[1][0].repeat(3);
      const body = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith(mark)) { body.push(lines[i]); i += 1; }
      i += 1;
      blocks.push({ type: 'code', lang: fence[2], text: body.join('\n') });
      continue;
    }

    // Blockquote (consecutive `>` lines)
    if (/^>/.test(trimmed)) {
      const body = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { body.push(lines[i].replace(/^\s*>\s?/, '')); i += 1; }
      blocks.push({ type: 'quote', text: body.join(' ').trim() });
      continue;
    }

    // Table
    if (/^\|.*\|$/.test(trimmed) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      const rows = [];
      const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(lines[i]);
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(cells(lines[i])); i += 1; }
      blocks.push({ type: 'table', head, rows });
      continue;
    }

    // Lists. An ordered list keeps its marker so .flow can be inferred.
    const li = trimmed.match(/^([-*+]|\d+[.)])\s+(.*)$/);
    if (li) {
      const ordered = /\d/.test(li[1]);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(/^([-*+]|\d+[.)])\s+(.*)$/);
        if (!m || /\d/.test(m[1]) !== ordered) break;
        let item = m[2];
        i += 1;
        // Continuation lines: indented, not a new item, not blank.
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) &&
               !/^\s*([-*+]|\d+[.)])\s/.test(lines[i])) { item += ` ${lines[i].trim()}`; i += 1; }
        items.push(item);
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    // Raw HTML block: from a line starting with a tag to the next blank line.
    if (/^</.test(trimmed)) {
      const body = [];
      while (i < lines.length && lines[i].trim()) { body.push(lines[i]); i += 1; }
      blocks.push({ type: 'raw', text: body.join('\n') });
      continue;
    }

    // Paragraph: to the next blank line or block start.
    const body = [];
    while (i < lines.length && lines[i].trim() &&
           !/^(:::|#{1,6}\s|```|~~~|>|\||-{3,}$|\*{3,}$)/.test(lines[i].trim()) &&
           !/^\s*([-*+]|\d+[.)])\s/.test(lines[i])) { body.push(lines[i].trim()); i += 1; }
    if (body.length) blocks.push({ type: 'para', text: body.join(' ') });
    else i += 1;
  }
  return { blocks, next: i };
}

function parseArgs(s) {
  const out = {};
  const re = /([A-Za-z][\w-]*)(?:=(?:"([^"]*)"|(\S+)))?/g;
  let m;
  while ((m = re.exec(s))) out[m[1]] = m[2] ?? m[3] ?? true;
  return out;
}

function parseAttrs(s) {
  const out = { classes: [] };
  const re = /(#[\w-]+)|(\.[\w-]+)|([A-Za-z][\w-]*)=(?:"([^"]*)"|(\S+))|([A-Za-z][\w-]*)/g;
  let m;
  while ((m = re.exec(s))) {
    if (m[1]) out.id = m[1].slice(1);
    else if (m[2]) out.classes.push(m[2].slice(1));
    else if (m[3]) out[m[3]] = m[4] ?? m[5];
    else if (m[6]) out[m[6]] = true;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 4. Split the block stream into slides.
//    `#` = title slide (first) or section divider (later); `##` = a content
//    slide; `---` = an explicit break. Divider numbering and the title slide's
//    TOC are derived from the `#` headings, so neither can drift out of sync -
//    a footgun both CLAUDE.md and SKILL.md warn about.
// ---------------------------------------------------------------------------
function splitSlides(blocks) {
  const slides = [];
  let cur = null;
  const open = (kind, heading) => {
    cur = { kind, heading: heading ?? null, attrs: { classes: [] }, blocks: [] };
    slides.push(cur);
    return cur;
  };

  for (const b of blocks) {
    if (b.type === 'heading' && b.level === 1) {
      open(slides.some((s) => s.kind === 'title') ? 'divider' : 'title', b.text);
      continue;
    }
    if (b.type === 'heading' && b.level === 2) { open('content', b.text); continue; }
    if (b.type === 'break') { cur = null; continue; }
    if (!cur) open('content', null);
    if (b.type === 'attrs') {
      cur.attrs = { ...cur.attrs, ...b.attrs, classes: [...cur.attrs.classes, ...(b.attrs.classes || [])] };
      continue;
    }
    cur.blocks.push(b);
  }
  return slides;
}

// ---------------------------------------------------------------------------
// 5. Group a slide's blocks. A group is the unit layout decisions are made
//    over: a titled card (### plus what follows it), a run of prose, a run of
//    images, a list, a table, or an explicit directive.
// ---------------------------------------------------------------------------
const IMG_ONLY = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;

function groupBlocks(blocks) {
  const groups = [];
  let cur = null;
  const push = (g) => { groups.push(g); cur = g; };

  for (const b of blocks) {
    if (b.type === 'heading' && b.level >= 3) { push({ type: 'card', title: b.text, blocks: [] }); continue; }
    if (b.type === 'directive') { push({ type: 'directive', block: b }); cur = null; continue; }
    if (b.type === 'quote') { push({ type: 'quote', block: b }); cur = null; continue; }

    // A paragraph that is nothing but an image is a gallery item.
    if (b.type === 'para' && IMG_ONLY.test(b.text.trim())) {
      const m = b.text.trim().match(IMG_ONLY);
      const shot = { alt: m[1], src: m[2], caption: m[3] || m[1] };
      if (cur && cur.type === 'images') cur.shots.push(shot);
      else push({ type: 'images', shots: [shot] });
      continue;
    }

    if (cur && cur.type === 'card') { cur.blocks.push(b); continue; }

    if (b.type === 'list') { push({ type: 'list', block: b }); cur = null; continue; }
    if (b.type === 'table') { push({ type: 'table', block: b }); cur = null; continue; }
    if (b.type === 'raw') { push({ type: 'raw', block: b }); cur = null; continue; }
    if (b.type === 'code') { push({ type: 'code', block: b }); cur = null; continue; }

    if (cur && cur.type === 'prose') { cur.blocks.push(b); continue; }
    push({ type: 'prose', blocks: [b] });
  }
  return groups;
}

// A list whose every item is `**value** — label` with a digit in the value is a
// numbers grid, not a list. This is a cause-style inference: it reads what the
// content *is* rather than how a first draft happened to render.
const FACT_ITEM = /^\*\*([^*]{1,14})\*\*\s*[—–:-]\s*(.+)$/;
function factsFrom(list) {
  if (!list || list.ordered || list.items.length < 2 || list.items.length > 4) return null;
  const facts = list.items.map((it) => it.match(FACT_ITEM)).filter(Boolean);
  if (facts.length !== list.items.length) return null;
  if (!facts.some((f) => /\d/.test(f[1]))) return null;
  return facts.map((f) => ({ value: f[1], label: f[2] }));
}

// An ordered list of 3-6 items that each lead with a bold phrase reads as a
// numbered process, which is what .flow draws.
function stepsFrom(list) {
  if (!list || !list.ordered || list.items.length < 3 || list.items.length > 6) return null;
  const steps = list.items.map((it) => {
    const m = it.match(/^\*\*([^*]+)\*\*[.:\s]*(.*)$/);
    return m ? { title: m[1], text: m[2] } : null;
  });
  return steps.every(Boolean) ? steps : null;
}

// ---------------------------------------------------------------------------
// 6. Layout inference. Each rule returns a plan naming itself, so the report
//    can tell you which rule fired and you can predict the next one.
// ---------------------------------------------------------------------------
function planSlide(slide, ctx) {
  const groups = groupBlocks(slide.blocks);
  const plan = { rule: null, lede: null, punch: null, note: null, body: [], groups };

  // Blockquotes become the closing band, wherever they sat in the source.
  const quotes = groups.filter((g) => g.type === 'quote');
  const rest = groups.filter((g) => g.type !== 'quote');
  if (quotes.length) {
    plan.punch = quotes[0].block.text;
    if (quotes.length > 1) ctx.warn(slide, `${quotes.length} blockquotes; only the first becomes the .punch band`);
  }

  // A short opening paragraph orients the slide: that is what .lede is for,
  // and the only place full-width running text belongs.
  if (rest.length > 1 && rest[0].type === 'prose' && rest[0].blocks.length === 1) {
    const t = rest[0].blocks[0].text || '';
    if (len(t) <= 320) { plan.lede = t; rest.shift(); }
  }

  // A trailing short paragraph after a gallery is a caption for it.
  if (rest.length >= 2 && rest[rest.length - 1].type === 'prose' &&
      rest[rest.length - 2].type === 'images' && rest[rest.length - 1].blocks.length === 1 &&
      len(rest[rest.length - 1].blocks[0].text) <= 240) {
    plan.note = rest.pop().blocks[0].text;
  }

  plan.groups = rest;
  const sig = rest.map((g) => g.type);
  const cards = rest.filter((g) => g.type === 'card');
  const only = (t) => sig.length > 0 && sig.every((x) => x === t);

  // --- explicit directives win, always -----------------------------------
  // A directive that is the whole slide body owns the slide. One that sits
  // *beside* other groups is just another group and takes part in the column
  // rules below - stacking it would waste the horizontal half of the slide.
  if (rest.length === 1 && rest[0].type === 'directive') {
    plan.rule = `directive:${rest[0].block.name}`;
    plan.layout = { kind: 'directive', dir: rest[0].block };
    return plan;
  }
  // Directives that only ever produce a trailing line are pulled out of the
  // layout so they do not become a column of their own.
  const TRAILING = new Set(['note', 'source', 'punch', 'punch--accent', 'lede']);
  for (let i = rest.length - 1; i >= 0; i -= 1) {
    const g = rest[i];
    if (g.type === 'directive' && TRAILING.has(g.block.name)) {
      if (g.block.name === 'note' || g.block.name === 'source') plan.note = plainText(g.block.blocks);
      else if (g.block.name === 'lede') plan.lede = plan.lede || plainText(g.block.blocks);
      else plan.punch = plan.punch || plainText(g.block.blocks);
      rest.splice(i, 1);
    }
  }
  plan.groups = rest;
  sig.length = 0;
  sig.push(...rest.map((g) => g.type));
  if (rest.length === 1 && rest[0].type === 'directive') {
    plan.rule = `directive:${rest[0].block.name}`;
    plan.layout = { kind: 'directive', dir: rest[0].block };
    return plan;
  }

  // --- a single list or table can be the whole slide ----------------------
  if (rest.length === 1 && rest[0].type === 'list') {
    const facts = factsFrom(rest[0].block);
    if (facts) { plan.rule = 'facts grid (bold numbers)'; plan.layout = { kind: 'facts', facts }; return plan; }
    const steps = stepsFrom(rest[0].block);
    if (steps) { plan.rule = 'flow steps (ordered, bold leads)'; plan.layout = { kind: 'flow', steps }; return plan; }
    plan.rule = 'kulissen list';
    plan.layout = { kind: 'kulissen', list: rest[0].block };
    return plan;
  }
  if (rest.length === 1 && rest[0].type === 'table') {
    plan.rule = rest[0].block.head.length === 2 ? 'timeline from 2-column table' : 'table';
    plan.layout = { kind: 'table', table: rest[0].block };
    return plan;
  }

  // --- galleries ----------------------------------------------------------
  if (only('images')) {
    const shots = rest.flatMap((g) => g.shots);
    plan.rule = shots.length === 1 ? 'single image, shown whole' : `gallery of ${shots.length}`;
    plan.layout = { kind: 'shots', shots, single: shots.length === 1 };
    return plan;
  }

  // --- text beside pictures ----------------------------------------------
  // Everything that is not a picture goes into one text column, however many
  // blocks it is: prose, a list and a table beside two photographs is still
  // "text on one side, pictures on the other", not four columns.
  const imgGroup = rest.find((g) => g.type === 'images');
  const TEXTY = new Set(['prose', 'card', 'list', 'table', 'directive']);
  if (imgGroup && rest.length >= 2 &&
      rest.every((g) => g.type === 'images' || TEXTY.has(g.type)) &&
      rest.filter((g) => g.type === 'images').length === 1) {
    const textSide = rest.filter((g) => g !== imgGroup);
    const chars = textSide.reduce((n, g) => n + groupChars(g), 0);
    // Images on the narrow side of a wide-left row render as postage stamps
    // (SKILL.md, "Filling the frame" #3), so an even split is the default and
    // the wide side is only given to genuinely long text.
    const wide = chars > 900 ? 'cols--wide-left' : 'cols--2';
    plan.rule = `text + ${imgGroup.shots.length} image(s) side by side`;
    plan.layout = {
      kind: 'cols', mod: `${wide} cols--middle`,
      columns: [{ groups: textSide }, { groups: [imgGroup] }],
    };
    return plan;
  }

  // --- prose with a call-out ---------------------------------------------
  if (sig.length === 2 && sig[0] === 'prose' && sig[1] === 'card') {
    plan.rule = 'prose + call-out';
    plan.layout = {
      kind: 'cols', mod: 'cols--wide-left cols--middle',
      columns: [{ groups: [rest[0]] }, { groups: [rest[1]], callout: true }],
    };
    return plan;
  }

  // --- equal-ranked titled blocks ---------------------------------------
  if (only('card')) {
    if (cards.length === 1) {
      plan.rule = 'single panel';
      plan.layout = { kind: 'cols', mod: 'cols--2', columns: [{ groups: cards }] };
      return plan;
    }
    if (cards.length === 2) {
      plan.rule = '2 cards -> two columns';
      plan.layout = { kind: 'cols', mod: 'cols--2', columns: cards.map((c) => ({ groups: [c] })) };
      return plan;
    }
    if (cards.length === 3) {
      plan.rule = '3 cards -> three columns';
      plan.layout = { kind: 'cols', mod: 'cols--3', columns: cards.map((c) => ({ groups: [c] })) };
      return plan;
    }
    if (cards.length === 4) {
      plan.rule = '4 cards -> .net grid';
      plan.layout = { kind: 'net', cards };
      return plan;
    }
    if (cards.length <= 8) {
      const half = Math.ceil(cards.length / 2);
      plan.rule = `${cards.length} cards -> two columns of stacked cards`;
      plan.layout = {
        kind: 'cols', mod: 'cols--2',
        columns: [{ groups: cards.slice(0, half), cardcol: true }, { groups: cards.slice(half), cardcol: true }],
      };
      return plan;
    }
    ctx.warn(slide, `${cards.length} titled blocks is too many for one slide - split it`);
    plan.rule = 'too many cards (stacked)';
    plan.layout = { kind: 'stack', groups: rest };
    return plan;
  }

  // --- prose only --------------------------------------------------------
  if (only('prose')) {
    const paras = rest.flatMap((g) => g.blocks);
    const chars = paras.reduce((n, b) => n + len(b.text || ''), 0);
    if (paras.length === 1 && chars <= 320) {
      plan.rule = 'one short paragraph -> lede';
      plan.lede = plan.lede ? `${plan.lede} ${paras[0].text}` : paras[0].text;
      plan.layout = { kind: 'empty' };
      return plan;
    }
    // Full-width running text is a layout mistake (SKILL.md), so prose always
    // ends up in a column; two columns once there is enough of it to balance.
    if (paras.length >= 3 && chars > 700) {
      const half = balanceSplit(paras);
      plan.rule = 'prose split into two columns';
      plan.layout = {
        kind: 'cols', mod: 'cols--2',
        columns: [{ groups: [{ type: 'prose', blocks: paras.slice(0, half) }] },
                  { groups: [{ type: 'prose', blocks: paras.slice(half) }] }],
      };
      return plan;
    }
    plan.rule = 'prose in one column';
    plan.layout = { kind: 'cols', mod: 'cols--2', columns: [{ groups: rest }] };
    return plan;
  }

  // --- mixed: keep source order, one column per group, capped at three ----
  if (rest.length >= 2 && rest.length <= 3) {
    plan.rule = `${rest.length} mixed blocks side by side`;
    plan.layout = {
      kind: 'cols', mod: rest.length === 3 ? 'cols--3' : 'cols--2',
      columns: rest.map((g) => ({ groups: [g] })),
    };
    return plan;
  }

  plan.rule = 'stacked (no rule matched)';
  plan.layout = { kind: 'stack', groups: rest };
  return plan;
}

// Split a paragraph run so both columns carry roughly the same amount of text.
function balanceSplit(paras) {
  const lens = paras.map((p) => len(p.text || ''));
  const total = lens.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < lens.length - 1; i += 1) {
    acc += lens[i];
    if (acc >= total / 2) return i + 1;
  }
  return Math.max(1, paras.length - 1);
}

function groupChars(g) {
  switch (g.type) {
    case 'prose': return g.blocks.reduce((n, b) => n + len(b.text || '') +
      (b.items ? b.items.reduce((m, it) => m + len(it), 0) : 0), 0);
    case 'card': return len(g.title) + g.blocks.reduce((n, b) => n + len(b.text || '') +
      (b.items ? b.items.reduce((m, it) => m + len(it), 0) : 0), 0);
    case 'list': return g.block.items.reduce((n, it) => n + len(it), 0);
    case 'table': return g.block.rows.reduce((n, r) => n + r.reduce((m, c) => m + len(c), 0), 0);
    case 'quote': return len(g.block.text);
    case 'images': return 0;
    default: return 200;
  }
}

// ---------------------------------------------------------------------------
// 7. Fill estimate. Predicts the painted height of a plan in cqh, per column,
//    so a correction can be chosen before anything is rendered. It is an
//    estimate, not a measurement: the browser audit in SKILL.md stays the
//    authority. Its job is to be right about *which* slides are thin.
// ---------------------------------------------------------------------------
function estimate(plan, slide) {
  const avail = contentHeight();
  let used = 0;

  if (slide.attrs.eyebrow) used += scaled(G.eyebrowSize) * 1.3 * CQW_TO_CQH + G.eyebrowMargin;
  if (slide.heading) {
    const perLine = Math.floor(contentWidth() / (G.h2Size * G.glyphRatio));
    used += Math.max(1, Math.ceil(len(slide.heading) / perLine)) * G.h2Size * G.h2Line * CQW_TO_CQH + G.h2Margin;
  }
  if (plan.lede) used += textHeight(len(plan.lede), G.ledeSize, G.ledeLine, G.ledeMax) + G.ledeMargin;

  const bodyTop = used;
  const punch = plan.punch
    ? textHeight(len(plan.punch), G.punchSize, G.punchLine, contentWidth() - 2 * G.punchPadH)
      + 2 * G.punchPadV + G.punchMargin
    : 0;
  const note = plan.note ? textHeight(len(plan.note), G.noteSize, 1.4, 62) + G.noteMargin : 0;
  // The body row's own top margin comes out of the room available to it, or a
  // component that fills by design would score just over 100 % every time.
  const bodyRoom = avail - bodyTop - G.colsMarginTop - punch - note;

  const cols = columnWidths(plan.layout);
  const heights = cols.map((c) => columnHeight(c.groups, c.width, c));
  const bodyHeight = fillsByDesign(plan.layout) ? bodyRoom : Math.max(...heights, 0);

  const painted = bodyTop + G.colsMarginTop + Math.min(bodyHeight, bodyRoom) + punch + note;
  return {
    fill: Math.round((painted / avail) * 100),
    overflow: Math.round(((bodyTop + G.colsMarginTop + bodyHeight + punch + note) / avail) * 100),
    columns: heights,
    imbalance: heights.length > 1 && Math.max(...heights) > 0
      ? (Math.max(...heights) - Math.min(...heights)) / Math.max(...heights) : 0,
  };
}

// Components whose height is the space they are given, not the text they hold.
// Verified against framework/browserslides.css rather than assumed, because
// getting this list wrong in the optimistic direction is the dangerous
// mistake - it makes the estimator under-report thin slides:
//   .facts / .shots / .net  flex:1 + grid-auto-rows:1fr  -> fill
//   .chartbox               flex:1, svg height:100%      -> fills
//   .stack-stage            flex:1, cards absolute       -> fills
//   .flow                   flex:1 BUT align-content:start -> does NOT fill
//   .editorial-layout / .principle-columns / .sandwich / .doc
//                           sized to content, centred by auto margins
const FILLS_BY_DESIGN = new Set(['facts', 'shots', 'net', 'chart', 'stack']);
function fillsByDesign(layout) {
  if (layout.kind === 'directive') return FILLS_BY_DESIGN.has(layout.dir.name);
  return FILLS_BY_DESIGN.has(layout.kind);
}

// Column widths in cqw, derived from the .cols modifier actually emitted.
function columnWidths(layout) {
  // .flow is two columns of .fstep and, despite flex:1, sizes to its content.
  if (layout.kind === 'flow' || (layout.kind === 'directive' && layout.dir.name === 'flow')) {
    const steps = layout.steps
      || (layout.dir.blocks.filter((b) => b.type === 'list').flatMap((b) => b.items)
        .map((it) => { const m = it.match(/^\*\*([^*]+)\*\*[.:\s]*(.*)$/); return m ? { title: m[1], text: m[2] } : { title: it, text: '' }; }));
    const width = (contentWidth() - G.flowGap) / 2;
    const half = Math.ceil(steps.length / 2);
    const height = (list) => list.reduce((n, s) =>
      n + textHeight(len(s.title), G.fstepH3, 1.3, width - G.fstepPadLeft)
        + textHeight(len(s.text), G.fstepP, G.fstepPLine, width - G.fstepPadLeft)
        + G.fstepPadBottom, 0);
    return [
      { groups: [], width, precomputed: height(steps.slice(0, half)) },
      { groups: [], width, precomputed: height(steps.slice(half)) },
    ];
  }
  if (layout.kind !== 'cols') {
    // Layouts that are not a .cols grid still need their content described to
    // the estimator, or a full slide reads as empty.
    const groups = layout.groups || layout.cards
      || (layout.table ? [{ type: 'table', block: layout.table }] : null)
      || (layout.list ? [{ type: 'list', block: layout.list }] : null)
      || (layout.dir ? groupBlocks(layout.dir.blocks) : null)
      || [];
    // A directive laying its body out in columns splits the width, so the text
    // wraps sooner and the block is taller than a single full-width run.
    const sideBySide = layout.kind === 'directive' &&
      /^(principles|cols|cols--2|cols--3|editorial|delta|sandwich|method|pipe)/.test(layout.dir.name);
    const n = sideBySide ? Math.max(2, groups.length) : 1;
    const width = n > 1 ? (contentWidth() - G.colsGap * (n - 1)) / n : contentWidth();
    return groups.length && n > 1
      ? groups.map((g) => ({ groups: [g], width }))
      : [{ groups, width: contentWidth() }];
  }
  const n = layout.columns.length;
  const shares = /wide-left/.test(layout.mod) ? [1.5, 1]
    : /wide-right/.test(layout.mod) ? [1, 1.5]
    : new Array(n).fill(1);
  const total = shares.slice(0, n).reduce((a, b) => a + b, 0);
  const free = contentWidth() - G.colsGap * (n - 1);
  return layout.columns.map((c, i) => ({ ...c, width: (free * (shares[i] ?? 1)) / total }));
}

function columnHeight(groups, width, col = {}) {
  if (col.precomputed !== undefined) return col.precomputed;
  let h = 0;
  groups.forEach((g, i) => {
    if (i) h += G.colGap;
    h += groupHeight(g, width, col);
  });
  return h;
}

function groupHeight(g, width, col = {}) {
  switch (g.type) {
    case 'prose': {
      let h = 0;
      g.blocks.forEach((b, i) => {
        if (i) h += G.proseGap;
        if (b.type === 'list') {
          h += b.items.reduce((n, it) => n + textHeight(len(it), G.proseSize, G.proseLine, width - 2) + 0.7, 0);
        } else if (b.type === 'para') {
          h += textHeight(len(b.text), G.proseSize, G.proseLine, width);
        } else {
          h += textHeight(groupChars({ type: 'prose', blocks: [b] }), G.proseSize, G.proseLine, width);
        }
      });
      return h;
    }
    case 'card': {
      if (col.cardcol) {
        const inner = width - 2 * G.cardPadH;
        return 2 * G.cardPadV + textHeight(len(g.title), G.cardH3, 1.3, inner) + 0.6 +
          textHeight(groupChars(g) - len(g.title), G.cardP, G.cardPLine, inner);
      }
      const inner = width - 2 * G.panelPadH;
      const head = col.callout
        ? textHeight(len(g.title), G.tlHeadSize, G.tlHeadLine, inner) + G.tlHeadMargin
        : textHeight(len(g.title), G.panelH3, 1.3, inner) + G.panelH3Margin;
      const body = textHeight(groupChars(g) - len(g.title), G.proseDenseSize, G.proseDenseLine, inner);
      // .panel--marker carries no fill and no vertical padding to speak of.
      return (col.callout ? 0 : 2 * G.panelPadV) + head + body;
    }
    case 'list': return g.block.items.reduce(
      (n, it) => n + textHeight(len(it), G.kulSize, G.kulLine, width) + 2 * G.kulPad, 0);
    case 'table': return g.block.rows.reduce(
      (n, r) => n + textHeight(r.reduce((m, c) => m + len(c), 0), G.tlSize, G.tlLine, width) + 2 * G.tlPad, 0);
    case 'images': return contentHeight() * 0.55;
    case 'quote': return textHeight(len(g.block.text), G.punchSize, G.punchLine, width) + 2 * G.punchPadV;
    default: return contentHeight() * 0.4;
  }
}

// ---------------------------------------------------------------------------
// 8. Corrections.
//
//    The repertoire deliberately excludes the one move a fill-driven optimiser
//    would find first: stretching a container. Per docs/handoff-autolayout.md
//    that raised median fill from 74 % to 96 % and made the deck worse, since a
//    stretched bordered panel frames the empty space instead of removing it.
//    Everything here either rearranges content or splits a slide. A thin slide
//    with nothing to rearrange is reported, never padded.
// ---------------------------------------------------------------------------
function correct(slide, plan, ctx) {
  if (!ctx.fix || slide.attrs.keep) return estimate(plan, slide);
  const target = ctx.targetFill;
  const log = (msg) => { plan.fixes.push(msg); ctx.fixCount += 1; };
  let est = estimate(plan, slide);

  for (let pass = 0; pass < 4; pass += 1) {
    // Too much for one slide. Splitting is the honest answer; the alternative
    // would be shrinking type, which SKILL.md rules out ("if a slide only fits
    // at a smaller size, the slide has too much on it").
    if (est.overflow > 104 && plan.layout.kind === 'cols' && plan.layout.columns.length === 1) {
      const groups = plan.layout.columns[0].groups;
      const paras = groups.length === 1 && groups[0].type === 'prose' ? groups[0].blocks : null;
      if (paras && paras.length >= 3) {
        const half = balanceSplit(paras);
        plan.layout = {
          kind: 'cols', mod: 'cols--2',
          columns: [{ groups: [{ type: 'prose', blocks: paras.slice(0, half) }] },
                    { groups: [{ type: 'prose', blocks: paras.slice(half) }] }],
        };
        log('overfull -> split the prose into two columns');
        est = estimate(plan, slide); continue;
      }
    }
    if (est.overflow > 104 && plan.layout.kind === 'cols' && plan.layout.columns.length >= 2 &&
        plan.layout.columns.every((c) => c.groups.every((g) => g.type === 'card'))) {
      const all = plan.layout.columns.flatMap((c) => c.groups);
      if (!plan.layout.columns[0].cardcol && all.length >= 4) {
        const half = Math.ceil(all.length / 2);
        plan.layout = {
          kind: 'cols', mod: 'cols--2',
          columns: [{ groups: all.slice(0, half), cardcol: true }, { groups: all.slice(half), cardcol: true }],
        };
        log('overfull -> denser stacked cards');
        est = estimate(plan, slide); continue;
      }
      ctx.warn(slide, `still overfull at ~${est.overflow} % - split it into two slides`);
      break;
    }

    // Thin. Fewer columns make each column taller, which fills the frame with
    // the same content rather than with padding.
    if (est.fill < target && plan.layout.kind === 'cols') {
      // Note what is NOT done here: three equal-ranked cards are not regrouped
      // into 2 + 1 to raise the number. They are parallel by authorial intent,
      // and a lopsided grid says they are not. A thin row of three is a
      // content problem, so it gets reported instead.
      //
      // A gallery on the narrow side renders postage stamps; an even split
      // gives the images room and lifts the row at the same time.
      if (/wide-left/.test(plan.layout.mod) &&
          plan.layout.columns[1]?.groups.some((g) => g.type === 'images')) {
        plan.layout.mod = plan.layout.mod.replace('cols--wide-left', 'cols--2');
        log('thin -> even columns, so the images get room');
        est = estimate(plan, slide); continue;
      }
    }

    // An uneven row reads as one column hanging from the top. Centring the
    // content inside each column fixes that without un-stretching anything -
    // the trap that broke slide 12 during the manual build.
    if (plan.layout.kind === 'cols' && plan.layout.columns.length > 1 &&
        est.imbalance > 0.2 && !/cols--middle/.test(plan.layout.mod)) {
      plan.layout.mod += ' cols--middle';
      log(`uneven columns (${Math.round(est.imbalance * 100)} %) -> cols--middle`);
      est = estimate(plan, slide); continue;
    }

    break;
  }

  // Last resort, and only for a row that is genuinely short: balance the
  // whitespace instead of removing it. SKILL.md ranks this below every content
  // fix, so it is logged loudly.
  if (est.fill < target - 12 && plan.layout.kind === 'cols' &&
      !/cols--center/.test(plan.layout.mod) && !plan.punch) {
    plan.layout.mod += ' cols--center';
    plan.fixes.push('very thin -> cols--center (balances the whitespace; content is the real fix)');
    ctx.fixCount += 1;
    est = estimate(plan, slide);
  }

  return est;
}

// ---------------------------------------------------------------------------
// 9. Emit HTML.
// ---------------------------------------------------------------------------
function renderBlocks(blocks, ctx) {
  return blocks.map((b) => renderBlock(b, ctx)).filter(Boolean).join('\n');
}

function renderBlock(b, ctx) {
  switch (b.type) {
    case 'para': return `<p>${inline(b.text, ctx)}</p>`;
    case 'list': {
      const tag = b.ordered ? 'ol' : 'ul';
      return `<${tag}>${b.items.map((it) => `<li>${inline(it, ctx)}</li>`).join('')}</${tag}>`;
    }
    case 'raw': return b.text;
    case 'code':
      ctx.needsCodeStyle = true;
      return `<pre class="md-code"><code>${escapeText(b.text)}</code></pre>`;
    case 'quote': return `<div class="punch">${inline(b.text, ctx)}</div>`;
    case 'heading': return `<h3>${inline(b.text, ctx)}</h3>`;
    case 'table': return renderTable(b, ctx);
    case 'directive': return renderDirective(b, ctx);
    default: return '';
  }
}

function renderProse(blocks, ctx, mod = '') {
  return `<div class="prose${mod}">\n${indent(renderBlocks(blocks, ctx), 2)}\n</div>`;
}

// A two-column table is a label/value list, which is what .tl draws (and its
// tracks are content-sized, so a long label no longer wraps). Wider tables get
// a real table with a small scoped style - the sanctioned escape hatch.
function renderTable(b, ctx) {
  if (b.head.length === 2) {
    const rows = b.rows.map(([a, c]) =>
      `  <li><time>${inline(a, ctx)}</time><span>${inline(c, ctx)}</span></li>`).join('\n');
    const head = b.head[0] || b.head[1]
      ? `<div class="tl-head">${inline(b.head[1] || b.head[0], ctx)}</div>\n` : '';
    return `${head}<ul class="tl">\n${rows}\n</ul>`;
  }
  ctx.needsTableStyle = true;
  const head = `<tr>${b.head.map((c) => `<th>${inline(c, ctx)}</th>`).join('')}</tr>`;
  const body = b.rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c, ctx)}</td>`).join('')}</tr>`).join('\n');
  return `<table class="md-table">\n<thead>${head}</thead>\n<tbody>\n${body}\n</tbody>\n</table>`;
}

function renderCard(g, ctx, opts = {}) {
  const body = renderBlocks(g.blocks, ctx);
  if (opts.cardcol) return `  <div><h3>${inline(g.title, ctx)}</h3>${body.replace(/<\/?p>/g, (m) => m)}</div>`;
  const cls = opts.callout ? 'panel panel--marker' : 'panel panel--plain';
  const head = opts.callout
    ? `  <div class="tl-head">${inline(g.title, ctx)}</div>`
    : `  <h3>${inline(g.title, ctx)}</h3>`;
  return `<div class="${cls}">\n${head}\n${indent(renderProse(g.blocks, ctx, ' prose--dense'), 2)}\n</div>`;
}

function renderShots(shots, ctx, single) {
  const cls = single ? 'shots shots--single shots--fit' : 'shots';
  const figs = shots.map((s) => `  <figure><div class="imgwrap">` +
    `<img src="${s.src}" alt="${escapeAttr(s.alt)}"></div>` +
    `<figcaption>${inline(s.caption || s.alt, ctx)}</figcaption></figure>`).join('\n');
  return `<div class="${cls}">\n${figs}\n</div>`;
}

function renderGroup(g, ctx, col = {}) {
  switch (g.type) {
    case 'prose': return renderProse(g.blocks, ctx);
    case 'card': return renderCard(g, ctx, col);
    case 'images': return renderShots(g.shots, ctx, g.shots.length === 1);
    case 'list': {
      const items = g.block.items.map((it) => `  <li>${inline(it, ctx)}</li>`).join('\n');
      const dense = g.block.items.length > 6 ? ' kulissen--dicht'
        : g.block.items.length > 4 ? ' kulissen--mittel' : '';
      return `<ul class="kulissen${dense}">\n${items}\n</ul>`;
    }
    case 'table': return renderTable(g.block, ctx);
    case 'raw': return g.block.text;
    case 'code': return renderBlock(g.block, ctx);
    case 'directive': return renderDirective(g.block, ctx);
    default: return '';
  }
}

function renderLayout(layout, ctx) {
  switch (layout.kind) {
    case 'empty': return '';
    case 'directive': return renderDirective(layout.dir, ctx);
    case 'stack': return layout.groups.map((g) => renderGroup(g, ctx)).join('\n');
    case 'shots': return renderShots(layout.shots, ctx, layout.single);
    case 'kulissen': return renderGroup({ type: 'list', block: layout.list }, ctx);
    case 'table': return renderTable(layout.table, ctx);
    case 'facts': return renderFacts(layout.facts, ctx);
    case 'flow': return renderFlow(layout.steps, ctx);
    case 'net': {
      const cells = layout.cards.map((c) => `  <div><h3>${inline(c.title, ctx)}</h3>` +
        `${renderBlocks(c.blocks, ctx)}</div>`).join('\n');
      return `<div class="net net--middle">\n${cells}\n</div>`;
    }
    case 'cols': {
      const cols = layout.columns.map((c) => {
        const inner = c.cardcol
          ? `<div class="cardcol">\n${c.groups.map((g) => renderCard(g, ctx, { cardcol: true })).join('\n')}\n</div>`
          : c.groups.map((g) => renderGroup(g, ctx, c)).join('\n');
        return `  <div class="col">\n${indent(inner, 4)}\n  </div>`;
      }).join('\n');
      return `<div class="cols ${layout.mod}">\n${cols}\n</div>`;
    }
    default: return '';
  }
}

function renderFacts(facts, ctx) {
  const cells = facts.map((f, i) => {
    const value = f.value.replace(/(\d)\s+(\d)/g, '$1&nbsp;$2')
      .replace(/([%‰]|pp)$/, '<sup>$1</sup>');
    return `  <div class="fact${i === 0 ? ' fact--hero' : ''}"><b>${value}</b>` +
      `<span>${inline(f.label, ctx)}</span></div>`;
  }).join('\n');
  return `<div class="facts">\n${cells}\n</div>`;
}

function renderFlow(steps, ctx) {
  const half = Math.ceil(steps.length / 2);
  const col = (list, offset) => `  <div class="fcol">\n${list.map((s, i) =>
    `    <div class="fstep"><div class="step-num">${offset + i + 1}</div>` +
    `<h3>${inline(s.title, ctx)}</h3><p>${inline(s.text, ctx)}</p></div>`).join('\n')}\n  </div>`;
  return `<div class="flow">\n${col(steps.slice(0, half), 0)}\n${col(steps.slice(half), half)}\n</div>`;
}

// Directives. Known names get purpose-built markup; anything else becomes a
// div carrying that class name with its body rendered inside, so every
// component in the catalog is reachable without teaching this tool about it.
function renderDirective(d, ctx) {
  const name = d.name;
  const items = () => d.blocks.filter((b) => b.type === 'list').flatMap((b) => b.items);
  const cards = () => groupBlocks(d.blocks).filter((g) => g.type === 'card');

  switch (name) {
    case 'html': return d.blocks.map((b) => b.text ?? '').join('\n');
    case 'punch': case 'punch--accent':
      return `<div class="${name === 'punch' ? 'punch' : 'punch punch--accent'}">` +
        `${inline(plainText(d.blocks), ctx)}</div>`;
    case 'lede': return `<p class="lede">${inline(plainText(d.blocks), ctx)}</p>`;
    case 'note': return `<p class="gallery-note">${inline(plainText(d.blocks), ctx)}</p>`;
    case 'source': return `<p class="source">${inline(plainText(d.blocks), ctx)}</p>`;
    case 'statement': case 'question':
      return `${d.args.kicker ? `<p class="statement-kicker">${inline(String(d.args.kicker), ctx)}</p>\n` : ''}` +
        `<p class="statement${d.args.answer ? ' statement--answer' : ''}">${inline(plainText(d.blocks), ctx)}</p>`;
    case 'quote':
      return `<blockquote class="bigquote">${inline(plainText(d.blocks), ctx)}</blockquote>` +
        (d.args.by ? `\n<p class="quote-attr">${inline(String(d.args.by), ctx)}</p>` : '');
    case 'facts': {
      const facts = items().map((it) => {
        const m = it.match(/^(.+?)\s*[|—–]\s*(.+)$/);
        return m ? { value: m[1].replace(/\*\*/g, ''), label: m[2] } : null;
      }).filter(Boolean);
      return renderFacts(facts, ctx);
    }
    case 'flow': {
      const steps = items().map((it) => {
        const m = it.match(/^\*\*([^*]+)\*\*[.:\s]*(.*)$/);
        return m ? { title: m[1], text: m[2] } : { title: it, text: '' };
      });
      return renderFlow(steps, ctx);
    }
    case 'net': {
      const cs = cards();
      return `<div class="net net--middle">\n${cs.map((c) =>
        `  <div><h3>${inline(c.title, ctx)}</h3>${renderBlocks(c.blocks, ctx)}</div>`).join('\n')}\n</div>`;
    }
    case 'cardcol':
      return `<div class="cardcol">\n${cards().map((c) => renderCard(c, ctx, { cardcol: true })).join('\n')}\n</div>`;
    case 'editorial': {
      const cs = cards();
      const hero = cs[0];
      return `<div class="editorial-layout editorial-layout--lessons">\n` +
        `  <div class="editorial-hero">\n    <h3>${inline(hero.title, ctx)}</h3>\n` +
        `${indent(renderBlocks(hero.blocks, ctx), 4)}\n  </div>\n` +
        `  <div class="editorial-stack">\n${cs.slice(1).map((c) =>
          `    <div class="editorial-item"><h3>${inline(c.title, ctx)}</h3>` +
          `${renderBlocks(c.blocks, ctx)}</div>`).join('\n')}\n  </div>\n</div>`;
    }
    case 'principles': {
      const cs = cards();
      return `<div class="principle-columns">\n${cs.map((c) =>
        `  <div class="principle-group">\n    <div class="tl-head">${inline(c.title, ctx)}</div>\n` +
        `    <ul class="principle-list">\n${(c.blocks.find((b) => b.type === 'list')?.items || [])
          .map((it) => `      <li>${inline(it, ctx)}</li>`).join('\n')}\n    </ul>\n  </div>`).join('\n')}\n</div>`;
    }
    case 'delta': {
      const rows = items().map((it) => {
        const m = it.split(/\s*(?:->|→)\s*/);
        if (m.length < 2) return '';
        const nw = m[1].match(/^\*\*([^*]+)\*\*\s*(.*)$/);
        const newCell = nw
          ? `<b>${inline(nw[1], ctx)}</b>${nw[2] ? `<small>${inline(nw[2], ctx)}</small>` : ''}`
          : `<b>${inline(m[1], ctx)}</b>`;
        return `  <div>\n    <div class="d-old">${inline(m[0], ctx)}</div>\n` +
          `    <div class="d-arrow">&rarr;</div>\n    <div class="d-new">${newCell}</div>\n  </div>`;
      }).filter(Boolean).join('\n');
      return `<div class="delta">\n${rows}\n</div>`;
    }
    case 'chat': {
      const msgs = items().map((it, i) => {
        const m = it.match(/^\*\*([^*]+)\*\*[:.]?\s*(.*)$/) || it.match(/^([^:]{1,24}):\s*(.*)$/);
        const cls = i === items().length - 1 ? 'msg msg--final' : i % 2 ? 'msg msg--ai' : 'msg';
        return m ? `  <div class="${cls}"><time>${inline(m[1], ctx)}</time>${inline(m[2], ctx)}</div>`
          : `  <div class="${cls}">${inline(it, ctx)}</div>`;
      }).join('\n');
      return `<div class="chat">\n${msgs}\n</div>`;
    }
    case 'timeline': {
      const rows = items().map((it) => {
        const m = it.match(/^(.+?)\s*\|\s*(.+)$/);
        if (!m) return `  <li><span>${inline(it, ctx)}</span></li>`;
        const parts = m[2].split(/\s*\|\s*/);
        const sub = parts[1] ? `<span class="sub">${inline(parts[1], ctx)}</span>` : '';
        return `  <li><time>${inline(m[1], ctx)}</time><span>${inline(parts[0], ctx)}${sub}</span></li>`;
      }).join('\n');
      const head = d.args.head ? `<div class="tl-head">${inline(String(d.args.head), ctx)}</div>\n` : '';
      return `${head}<ul class="tl">\n${rows}\n</ul>`;
    }
    case 'tracker': {
      const rows = items().map((it, i) => {
        const done = /^\[x\]\s*/i.test(it);
        return `  <div class="tracker-item${done ? ' done' : ''}"><span class="t-dot">${i + 1}</span>` +
          `<span>${inline(it.replace(/^\[[ xX]\]\s*/, ''), ctx)}</span></div>`;
      }).join('\n');
      return `<div class="tracker">\n${rows}\n</div>`;
    }
    case 'sandwich': {
      const cs = cards();
      return `<div class="sandwich">\n${cs.map((c, i) =>
        `  <div class="sandwich-band sandwich-band--${i === 1 ? 'mid eaten' : 'edge'}">` +
        `<h3>${inline(c.title, ctx)}</h3>${renderBlocks(c.blocks, ctx)}</div>`).join('\n')}\n</div>`;
    }
    case 'stack': {
      const shots = groupBlocks(d.blocks).filter((g) => g.type === 'images').flatMap((g) => g.shots);
      return `<div class="stack-stage">\n${shots.slice(0, 4).map((s, i) =>
        `  <figure class="stack-card stack-p${i + 1}"><span class="stack-shot">` +
        `<img src="${s.src}" alt="${escapeAttr(s.alt)}"></span>` +
        `<figcaption class="stack-cap">${inline(s.caption || s.alt, ctx)}</figcaption></figure>`).join('\n')}\n</div>`;
    }
    case 'shots': {
      const shots = groupBlocks(d.blocks).filter((g) => g.type === 'images').flatMap((g) => g.shots);
      return renderShots(shots, ctx, shots.length === 1 || truthy(d.args.single));
    }
    case 'doc': {
      const cs = cards();
      const head = d.args.title ? String(d.args.title) : (cs[0]?.title ?? 'Document');
      const meta = d.args.meta ? `<span class="doc-meta">${inline(String(d.args.meta), ctx)}</span>` : '';
      const sects = cs.map((c) => `    <p class="doc-sect">${inline(c.title, ctx)}</p>\n` +
        indent(renderBlocks(c.blocks, ctx), 4)).join('\n');
      return `<div class="doc">\n  <div class="doc-head">${inline(head, ctx)}${meta}</div>\n` +
        `  <div class="doc-body">\n${sects}\n  </div>\n</div>`;
    }
    case 'chart': {
      const id = `chart-${ctx.charts.length + 1}`;
      const data = items().map((it) => {
        const m = it.match(/^(.+?)\s*[:|]\s*([-\d.,]+)$/);
        return m ? { label: m[1].replace(/\*\*/g, '').trim(), value: Number(m[2].replace(',', '.')) } : null;
      }).filter(Boolean);
      ctx.charts.push({ id, data, args: d.args });
      return `<div class="chartbox" id="${id}"></div>`;
    }
    case 'detail': {
      const line = d.args.line ? String(d.args.line) : 'Details';
      return `<div class="bottomline"><span>${inline(line, ctx)}</span>` +
        `<span class="more">${ctx.lang === 'en' ? 'Details' : 'Mehr'} &rarr;</span></div>\n` +
        `<div class="detail-layer">\n  <button class="layer-close">` +
        `${ctx.lang === 'en' ? 'Close' : 'Schließen'} &times;</button>\n` +
        `${indent(renderBlocks(d.blocks, ctx), 2)}\n</div>`;
    }
    default: {
      // Unknown name -> a div with that class. Covers the rest of the catalog
      // for any component that takes ordinary content.
      const body = groupBlocks(d.blocks).map((g) => renderGroup(g, ctx)).join('\n');
      ctx.usedClasses.add(name);
      return `<div class="${name}">\n${indent(body, 2)}\n</div>`;
    }
  }
}

const plainText = (blocks) => blocks.map((b) => b.text ?? (b.items || []).join(' ')).join(' ').trim();
const indent = (s, n) => s ? s.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n') : s;

// ---------------------------------------------------------------------------
// Slide emitters
// ---------------------------------------------------------------------------
function emitSlide(slide, plan, ctx) {
  const cls = ['slide', ...slide.attrs.classes.map((c) => (c.startsWith('slide') ? c : `slide--${c}`))];
  if (slide.kind === 'divider') cls.push('slide--divider');
  if (slide.kind === 'title') cls.push('slide--title');

  const id = slide.attrs.id ? ` id="${slide.attrs.id}"` : '';
  const foot = footer(slide, ctx);
  let inner;

  if (slide.kind === 'title') inner = titleInner(slide, ctx);
  else if (slide.kind === 'divider') inner = dividerInner(slide, ctx);
  else {
    const parts = [];
    if (slide.attrs.eyebrow) parts.push(`<p class="eyebrow">${inline(String(slide.attrs.eyebrow), ctx)}</p>`);
    if (slide.heading) parts.push(`<h2>${inline(slide.heading, ctx)}</h2>`);
    if (plan.lede) parts.push(`<p class="lede">${inline(plan.lede, ctx)}</p>`);
    const body = renderLayout(plan.layout, ctx);
    if (body) parts.push(body);
    if (plan.note) parts.push(`<p class="gallery-note">${inline(plan.note, ctx)}</p>`);
    if (plan.punch) parts.push(`<div class="punch${ctx.punchTone}">${inline(plan.punch, ctx)}</div>`);
    inner = parts.join('\n');
  }

  return `<section class="frame"${id}>\n  <div class="${cls.join(' ')}"><div class="slide-inner">\n` +
    `${indent(inner, 4)}\n${indent(foot, 4)}\n  </div></div>\n</section>`;
}

function footer(slide, ctx) {
  const text = slide.attrs.footer ?? ctx.footer;
  return `<div class="pagefoot"><span>${text ? inline(String(text), ctx) : ''}</span>` +
    `<span class="pagenum"></span></div>`;
}

function titleInner(slide, ctx) {
  const parts = [];
  if (slide.attrs.eyebrow ?? ctx.meta.eyebrow) {
    parts.push(`<p class="eyebrow">${inline(String(slide.attrs.eyebrow ?? ctx.meta.eyebrow), ctx)}</p>`);
  }
  const title = slide.heading || ctx.meta.title || 'Untitled';
  const sub = ctx.meta.subtitle;
  const strip = (Array.isArray(ctx.meta.strip) ? ctx.meta.strip : ctx.meta.strip ? [ctx.meta.strip] : [])
    .map((s) => {
      const m = String(s).match(/^(.+?)\s*[:|]\s*(.+)$/);
      return m ? `<div><b>${m[1].trim()}</b><span>${inline(m[2].trim(), ctx)}</span></div>` : '';
    }).filter(Boolean).join('');

  // The table of contents is built from the deck's section dividers, so it can
  // never disagree with them.
  const toc = ctx.dividers.length
    ? `<div class="toc${ctx.dividers.length > 9 ? ' toc--wide' : ''}">\n${ctx.dividers.map((d, i) =>
        `      <div><b>${i + 1}</b><span>${inline(d, ctx)}</span></div>`).join('\n')}\n    </div>`
    : '';
  const takeaway = ctx.meta.takeaway
    ? `<div class="takeaway">\n      <p class="takeaway-kicker">${ctx.lang === 'en' ? 'In one sentence' : 'In einem Satz'}</p>\n` +
      `      <p class="takeaway-these">${inline(String(ctx.meta.takeaway), ctx)}</p>\n    </div>`
    : '';
  const right = toc || takeaway;

  parts.push(`<div class="title-grid">\n  <div class="title-left">\n` +
    `    <h1>${inline(title, ctx)}</h1>\n` +
    (sub ? `    <p class="title-sub">${inline(String(sub), ctx)}</p>\n` : '') +
    (strip ? `    <div class="title-strip">${strip}</div>\n` : '') +
    `  </div>\n${right ? `  ${right}\n` : ''}</div>`);

  const body = renderBlocks(slide.blocks, ctx);
  if (body && !right) parts.push(body);
  return parts.join('\n');
}

function dividerInner(slide, ctx) {
  const n = ctx.dividers.indexOf(slide.heading) + 1;
  const words = ctx.lang === 'en'
    ? ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']
    : ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht'];
  const kicker = slide.attrs.kicker ??
    `${ctx.lang === 'en' ? 'Part' : 'Teil'} ${words[n - 1] ?? n}`;
  const lead = slide.blocks.filter((b) => b.type === 'para').map((b) => b.text).join(' ');
  return `<div class="divider-grid">\n  <div class="divider-num">${n}</div>\n  <div>\n` +
    `    <p class="divider-kicker">${inline(kicker, ctx)}</p>\n` +
    `    <h2 class="divider-title">${inline(slide.heading || '', ctx)}</h2>\n` +
    (lead ? `    <p class="divider-lead">${inline(lead, ctx)}</p>\n` : '') +
    `  </div>\n</div>`;
}

// ---------------------------------------------------------------------------
// Announcing labels. A cause detector, not a symptom one: it looks for
// headings that promise content instead of carrying it (SKILL.md's
// "Don't announce, name" table), including the self-Q&A form.
// ---------------------------------------------------------------------------
const ANNOUNCING = [
  /^(die|das|der)\s+(goldene|wichtigste|entscheidende)/i,
  /^das\s+wichtigste/i,
  /^(drei|vier|fünf|sechs)\s+(dinge|punkte|sachen)\b/i,
  /^(gut zu wissen|übrigens|ehrlich gesagt|was wirklich zählt|kurz gesagt)/i,
  /^(the )?(golden rule|most important|key takeaways?|good to know|by the way|honestly)/i,
  /\?\s*(zwei|drei|vier|two|three|four)\b/i,
  /^(warum|weshalb|wieso|what|why|how)\b.*\?$/i,
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main(argv) {
  if (argv.includes('--help') || argv.includes('-h') || argv.length === 0) {
    process.stdout.write(HELP);
    return 0;
  }
  const opts = { fix: true, quiet: false, out: null, input: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--no-fix') opts.fix = false;
    else if (a === '--quiet' || a === '-q') opts.quiet = true;
    else if (a === '-o' || a === '--out') { opts.out = argv[i + 1]; i += 1; }
    else if (a.startsWith('-')) die(`unknown option ${a}`);
    else if (!opts.input) opts.input = a;
    else die(`unexpected argument ${a}`);
  }
  if (!opts.input) die('no input file (try --help)');
  if (!existsSync(opts.input)) die(`no such file: ${opts.input}`);

  const src = readFileSync(opts.input, 'utf8');
  const { meta, body } = parseFrontmatter(src);
  const lang = (meta.lang || 'de').toLowerCase().startsWith('en') ? 'en' : 'de';

  const { blocks } = parseBlocks(body.split(/\r?\n/));
  const slides = splitSlides(blocks);
  if (!slides.length) die('no slides found - the document has no headings and no content');

  const ctx = {
    meta, lang, footer: meta.footer ?? meta.title ?? '',
    punchTone: /accent/.test(String(meta.punch || '')) ? ' punch--accent' : '',
    dividers: slides.filter((s) => s.kind === 'divider').map((s) => s.heading),
    gotoTargets: new Set(), charts: [], usedClasses: new Set(),
    typoFixes: 0, strayQuotes: 0, fixCount: 0,
    fix: opts.fix, targetFill: Number(meta.fill) || 85,
    needsCodeStyle: false, needsTableStyle: false,
    warnings: [],
    warn(slide, msg) { this.warnings.push({ slide: slide.heading || '(untitled)', msg }); },
  };
  if (meta.typescale) G.typeScale = Number(meta.typescale) || G.typeScale;

  // Plan, correct, emit.
  const report = [];
  const html = slides.map((slide, i) => {
    const plan = slide.kind === 'content' ? planSlide(slide, ctx)
      : { rule: slide.kind, lede: null, punch: null, note: null, layout: { kind: 'empty' }, groups: [] };
    plan.fixes = [];
    const est = slide.kind === 'content' ? correct(slide, plan, ctx) : null;

    if (slide.heading && ANNOUNCING.some((re) => re.test(slide.heading))) {
      ctx.warn(slide, 'heading announces instead of naming - state the thing itself');
    }
    if (slide.attrs.eyebrow && slide.heading &&
        String(slide.attrs.eyebrow).toLowerCase().replace(/\W/g, '')
          .includes(slide.heading.toLowerCase().replace(/\W/g, '').slice(0, 12))) {
      ctx.warn(slide, 'eyebrow restates the heading - delete it');
    }

    report.push({ n: i + 1, kind: slide.kind, heading: slide.heading, rule: plan.rule, est, fixes: plan.fixes });
    return emitSlide(slide, plan, ctx);
  });

  // Cross-references must resolve, or the preview silently does nothing.
  const ids = new Set(slides.map((s) => s.attrs.id).filter(Boolean));
  for (const t of ctx.gotoTargets) {
    if (!ids.has(t)) ctx.warnings.push({ slide: '(deck)', msg: `link to #${t} has no slide with that id` });
  }

  const outPath = opts.out || opts.input.replace(/\.(md|markdown)$/i, '') + '.html';
  writeFileSync(outPath, document(html, ctx), 'utf8');

  if (!opts.quiet) printReport(report, ctx, outPath, slides.length);
  return 0;
}

function document(slides, ctx) {
  const m = ctx.meta;
  const assets = m.assets ? String(m.assets).replace(/\/?$/, '/') : null;
  const theme = m.theme ? String(m.theme) : 'bamberg';
  const css = m.css ? (Array.isArray(m.css) ? m.css : [m.css])
    : assets ? [`${assets}browserslides.css`, `${assets}${theme}.css`]
    : ['framework/browserslides.css', `themes/${theme}.css`];
  const js = m.js ? String(m.js) : assets ? `${assets}browserslides.js` : 'framework/browserslides.js';

  const extra = [];
  if (m.typescale) extra.push(`  :root { --type-scale: ${Number(m.typescale)}; }`);
  if (ctx.needsCodeStyle) {
    extra.push(`  /* Code on a slide. cqw so it scales with the frame, like everything else. */`);
    extra.push(`  .md-code { font-family: var(--font-mono); font-size: calc(1.15cqw * var(--type-scale));`);
    extra.push(`    line-height: 1.5; background: var(--muted-soft); border-radius: 0.5cqh;`);
    extra.push(`    padding: 1.6cqh 1.8cqw; margin: 0 0 1.2cqh; overflow: hidden; }`);
  }
  if (ctx.needsTableStyle) {
    extra.push(`  /* A table wider than two columns; .tl covers the label/value case. */`);
    extra.push(`  .md-table { width: 100%; border-collapse: collapse;`);
    extra.push(`    font-size: calc(1.25cqw * var(--type-scale)); line-height: 1.45; }`);
    extra.push(`  .md-table th { text-align: left; font-weight: 700; color: var(--accent);`);
    extra.push(`    border-bottom: 0.3cqh solid var(--accent); padding: 0.9cqh 1cqw 0.9cqh 0; }`);
    extra.push(`  .md-table td { border-bottom: 1px solid var(--muted-soft);`);
    extra.push(`    padding: 0.9cqh 1cqw 0.9cqh 0; color: var(--ink-soft); vertical-align: top; }`);
  }

  const charts = ctx.charts.map((c) => {
    const cfg = { data: c.data };
    if (c.args.max) cfg.max = Number(c.args.max);
    if (truthy(c.args.values)) cfg.valueLabels = true;
    if (c.args.label) cfg.ariaLabel = String(c.args.label);
    return `  Browserslides.barChart('#${c.id}', ${JSON.stringify(cfg)});`;
  });

  const hint = ctx.meta.hint ?? (ctx.lang === 'en' ? '↓ scroll · → next' : '↓ scrollen · → weiter');
  const rotate = truthy(ctx.meta.rotatehint ?? true)
    ? `<div id="rotate-hint"><div class="rh-icon">📱</div><h2>${
        ctx.lang === 'en' ? 'Turn your phone' : 'Bitte quer halten'}</h2><p>${
        ctx.lang === 'en'
          ? 'This deck is designed for landscape. Rotate your device, or tap to dismiss.'
          : 'Dieses Deck ist für Querformat gebaut. Gerät drehen oder tippen zum Ausblenden.'}</p>` +
      `<button class="rh-btn">${ctx.lang === 'en' ? 'Show anyway' : 'Trotzdem anzeigen'}</button></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="${ctx.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeAttr(String(ctx.meta.title || 'Deck'))}</title>
<!-- Generated by tools/md-to-deck.mjs. Safe to edit by hand; re-running the
     converter overwrites this file, so keep the .md as the source of truth. -->
${css.map((h) => `<link rel="stylesheet" href="${h}">`).join('\n')}
${extra.length ? `<style>\n${extra.join('\n')}\n</style>\n` : ''}</head>
<body>

${slides.join('\n\n')}

<!-- deck chrome (keep at end of body) -->
<nav class="dots" aria-label="${ctx.lang === 'en' ? 'Slide navigation' : 'Foliennavigation'}"></nav>
<div class="hint">${escapeAttr(String(hint))}</div>
${rotate ? `${rotate}\n` : ''}
<script src="${js}"></script>
${charts.length ? `<script>\n${charts.join('\n')}\n</script>\n` : ''}</body>
</html>
`;
}

function printReport(report, ctx, outPath, n) {
  const w = process.stderr;
  w.write(`\nmd-to-deck: ${n} slides -> ${outPath}\n\n`);
  const thin = [];
  for (const r of report) {
    const fill = r.est ? `${String(r.est.fill).padStart(3)} %` : '  – ';
    const flag = r.est && r.est.overflow > 104 ? '!' : r.est && r.est.fill < ctx.targetFill ? '~' : ' ';
    w.write(`  ${String(r.n).padStart(3)}${flag} ${fill}  ${(r.rule || r.kind).padEnd(38)}` +
      `${(r.heading || '').slice(0, 44)}\n`);
    for (const f of r.fixes) w.write(`       fix   ${f}\n`);
    if (r.est && r.est.fill < ctx.targetFill && !r.fixes.length) thin.push(r);
  }

  const content = report.filter((r) => r.est);
  if (content.length) {
    const fills = content.map((r) => r.est.fill).sort((a, b) => a - b);
    const median = fills[Math.floor(fills.length / 2)];
    w.write(`\n  estimated median ink fill: ${median} % (target ${ctx.targetFill} %)\n`);
  }
  if (ctx.typoFixes) w.write(`  typography: ${ctx.typoFixes} marks normalised\n`);
  if (ctx.strayQuotes) w.write(`  typography: ${ctx.strayQuotes} unpaired straight quote(s) left as-is - fix by hand\n`);
  if (ctx.fixCount) w.write(`  layout: ${ctx.fixCount} correction(s) applied${ctx.fix ? '' : ' (dry run)'}\n`);
  if (ctx.usedClasses.size) w.write(`  passed through as class names: ${[...ctx.usedClasses].join(', ')}\n`);

  if (thin.length) {
    w.write(`\n  thin slides - these need content, which no tool can invent:\n`);
    for (const r of thin) {
      w.write(`    ${r.n}: ~${r.est.fill} % — add detail from the source, or close it with a > blockquote\n`);
    }
  }
  if (ctx.warnings.length) {
    w.write(`\n  warnings:\n`);
    for (const g of ctx.warnings) w.write(`    ${g.slide}: ${g.msg}\n`);
  }
  w.write(`\n  Then verify in a browser: python3 -m http.server, and run the audit\n` +
    `  from SKILL.md. The estimate above is not a measurement.\n\n`);
}

process.exit(main(process.argv.slice(2)));
