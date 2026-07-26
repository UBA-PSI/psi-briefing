#!/usr/bin/env node
// inline-deck.mjs — fold a linked slide deck into ONE self-contained HTML file.
//
// Part of the psi-briefing toolchain (MIT - see LICENSE). Dependency-free: uses only
// Node.js built-ins (fs, path, url). Requires Node 18+ (ESM).
//
// What it does, for a deck that LINKS to its assets during development:
//   1. Inlines every local <link rel="stylesheet" href="..."> into a <style>.
//   2. Inlines every local <script src="..."></script> into an inline <script>.
//   3. Inlines local <img src="..."> and CSS url(...) image references as
//      base64 data: URIs.
//   Document order of styles and scripts is preserved. Remote (http/https),
//   protocol-relative and existing data: URIs are left untouched. Missing
//   local files produce a warning on stderr and the original tag is kept.
//
// Usage
//   node tools/inline-deck.mjs <input.html> [-o <output.html>]
//   node tools/inline-deck.mjs --help
//
// Default output is <input>.inlined.html next to the input.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const HELP = `inline-deck.mjs — produce one self-contained HTML file from a linked deck

USAGE
  node tools/inline-deck.mjs <input.html> [-o <output.html>]
  node tools/inline-deck.mjs --help

WHAT GETS INLINED
  <link rel="stylesheet" href="local.css">   ->  <style> ... </style>
  <script src="local.js"></script>           ->  <script> ... </script>
  <img src="local.png">                       ->  <img src="data:image/png;base64,...">
  url(local.png) inside CSS                    ->  url("data:image/png;base64,...")

WHAT IS LEFT ALONE
  Remote URLs (http://, https://, //host/...), existing data: URIs, and any
  local file that cannot be found (a warning is printed to stderr).

PATHS
  Every reference is resolved relative to the input HTML file's own directory.

RECOMMENDED WORKFLOW
  Develop with linked files in examples/, then run this tool (optionally after
  embed-fonts.mjs) to produce a single distributable .html.
`;

// Image extensions we know how to turn into data: URIs, with their mime types.
const IMAGE_MIME = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
};

// True for references we must never rewrite: remote, protocol-relative, data:,
// or in-page anchors / fragments.
function isExternalOrInline(url) {
  return /^(https?:)?\/\//i.test(url)   // http://, https://, //host
      || /^data:/i.test(url)            // already a data: URI
      || url.startsWith('#')            // fragment
      || /^[a-z][a-z0-9+.-]*:/i.test(url); // mailto:, tel:, other schemes
}

// Read a local asset relative to the deck's directory. Returns null (and warns)
// if the file is missing, so callers can leave the original tag in place.
function readLocalAsset(ref, baseDir, kind) {
  // Strip any ?query or #fragment suffix before hitting the filesystem.
  const clean = ref.replace(/[?#].*$/, '');
  const abs = path.resolve(baseDir, clean);
  if (!existsSync(abs)) {
    process.stderr.write(`warn: ${kind} not found, leaving as-is: ${ref}\n`);
    return null;
  }
  return { abs, buffer: readFileSync(abs) };
}

// Encode an image file as a data: URI, or null if unsupported/missing.
function imageDataUri(ref, baseDir) {
  const clean = ref.replace(/[?#].*$/, '');
  const ext = path.extname(clean).toLowerCase();
  const mime = IMAGE_MIME[ext];
  if (!mime) {
    process.stderr.write(`warn: unsupported image type, leaving as-is: ${ref}\n`);
    return null;
  }
  const asset = readLocalAsset(ref, baseDir, 'image');
  if (!asset) return null;
  // SVG can be embedded as-is; here we keep it simple and base64 everything.
  const base64 = asset.buffer.toString('base64');
  return `data:${mime};base64,${base64}`;
}

// Tally of what we changed, for the summary line.
const stats = { styles: 0, scripts: 0, images: 0, cssUrls: 0 };

// --- CSS url(...) rewriting ------------------------------------------------
// Used both for inlined stylesheets and for inline <style> blocks. baseDir is
// the directory that url(...) references should resolve against.
function inlineCssUrls(css, baseDir) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (whole, quote, ref) => {
    const trimmed = ref.trim();
    if (isExternalOrInline(trimmed)) return whole;
    const dataUri = imageDataUri(trimmed, baseDir);
    if (!dataUri) return whole; // missing/unsupported: keep original
    stats.cssUrls++;
    return `url("${dataUri}")`;
  });
}

// --- main transform --------------------------------------------------------

function inlineDeck(html, inputDir) {
  let out = html;

  // 1) <link rel="stylesheet" href="..."> -> <style> ... </style>
  // Match any <link> tag; only act on stylesheet links with a local href.
  out = out.replace(/<link\b[^>]*>/gi, (tag) => {
    const relMatch = tag.match(/\brel\s*=\s*(['"]?)([^'">\s]+)\1/i);
    const isStylesheet = relMatch && /stylesheet/i.test(relMatch[2]);
    if (!isStylesheet) return tag;

    const hrefMatch = tag.match(/\bhref\s*=\s*(['"])(.*?)\1/i);
    if (!hrefMatch) return tag;
    const href = hrefMatch[2];
    if (isExternalOrInline(href)) {
      process.stderr.write(`warn: skipping remote stylesheet: ${href}\n`);
      return tag;
    }

    const asset = readLocalAsset(href, inputDir, 'stylesheet');
    if (!asset) return tag;

    // Resolve nested url(...) refs relative to the stylesheet's own directory.
    const cssDir = path.dirname(asset.abs);
    const css = inlineCssUrls(asset.buffer.toString('utf8'), cssDir);
    stats.styles++;
    return `<style>\n/* inlined from ${href} */\n${css}\n</style>`;
  });

  // 2) <script src="..."></script> -> <script> ... </script>
  // Only scripts that carry a src attribute; preserve other attributes' intent
  // by dropping src and keeping the tag inline (type etc. rarely matter here).
  out = out.replace(/<script\b([^>]*)>\s*<\/script>/gi, (tag, attrs) => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*(['"])(.*?)\1/i);
    if (!srcMatch) return tag; // no src: already inline, leave it
    const src = srcMatch[2];
    if (isExternalOrInline(src)) {
      process.stderr.write(`warn: skipping remote script: ${src}\n`);
      return tag;
    }

    const asset = readLocalAsset(src, inputDir, 'script');
    if (!asset) return tag;

    const js = asset.buffer.toString('utf8');
    stats.scripts++;
    // Guard against a literal </script> inside the code breaking the tag.
    const safe = js.replace(/<\/script>/gi, '<\\/script>');
    return `<script>\n/* inlined from ${src} */\n${safe}\n</script>`;
  });

  // 3) Inline <style> blocks may themselves contain url(...) references.
  //    Rewrite those against the input HTML's own directory.
  out = out.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (whole, open, css, close) => {
    // Skip blocks we just generated (already resolved against their css dir);
    // re-running inlineCssUrls on them is harmless (all url()s are data: now).
    // Rebuilt from the captured parts rather than whole.replace(css, rewritten):
    // with a string pattern, $&, $` and $1 in the REPLACEMENT are still special,
    // so a stylesheet containing one of those would be silently corrupted.
    return open + inlineCssUrls(css, inputDir) + close;
  });

  // 4) <img src="..."> -> base64 data: URI
  out = out.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\bsrc\s*=\s*(['"])(.*?)\1/i);
    if (!srcMatch) return tag;
    const src = srcMatch[2];
    if (isExternalOrInline(src)) return tag;

    const dataUri = imageDataUri(src, inputDir);
    if (!dataUri) return tag;
    stats.images++;
    // Same reason as the <style> rewrite above: a function replacement, so that
    // nothing in the data: URI is read as a $-pattern.
    return tag.replace(srcMatch[0], () => `src="${dataUri}"`);
  });

  return out;
}

// --- CLI -------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return { help: true };
  }
  let input = null;
  let output = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-o' || a === '--output') {
      output = args[++i];
    } else if (!input) {
      input = a;
    } else {
      throw new Error(`Unexpected argument: ${a}`);
    }
  }
  if (!input) throw new Error('No input HTML file given.');
  return { input, output };
}

function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    process.stdout.write(HELP);
    return 0;
  }

  const inputPath = path.resolve(opts.input);
  if (!existsSync(inputPath)) {
    process.stderr.write(`Error: input not found: ${inputPath}\n`);
    return 1;
  }
  const inputDir = path.dirname(inputPath);
  const outputPath = opts.output
    ? path.resolve(opts.output)
    : inputPath.replace(/\.html?$/i, '') + '.inlined.html';

  const html = readFileSync(inputPath, 'utf8');
  const result = inlineDeck(html, inputDir);
  writeFileSync(outputPath, result, 'utf8');

  const inBytes = Buffer.byteLength(html, 'utf8');
  const outBytes = Buffer.byteLength(result, 'utf8');
  process.stderr.write(
    `inlined ${stats.styles} stylesheet(s), ${stats.scripts} script(s), ` +
    `${stats.images} image(s), ${stats.cssUrls} css url(s)\n` +
    `${inputPath} (${inBytes} B) -> ${outputPath} (${outBytes} B)\n`
  );
  return 0;
}

try {
  process.exit(main(process.argv));
} catch (err) {
  process.stderr.write(`inline-deck: ${err.message}\n`);
  process.exit(1);
}
