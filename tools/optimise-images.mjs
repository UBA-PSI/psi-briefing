#!/usr/bin/env node
// optimise-images.mjs – re-encode a deck's images to WebP at the size the
// slides actually use, before inline-deck.mjs turns them into data: URIs.
//
// Part of the browserslides toolchain (CC BY 4.0). Node.js built-ins only for
// everything except the encode step, which shells out to `cwebp` or `magick`
// (see ENCODERS). Requires Node 18+ (ESM).
//
// Why this is a separate tool:
//   inline-deck.mjs promises to be dependency-free, and WebP cannot be encoded
//   from plain Node. Keeping the encoder here leaves that promise intact, and
//   it lets you look at the optimised files before they disappear into a
//   multi-megabyte data: URI.
//
// Why it is worth running:
//   Photographs embedded at camera resolution dominate a self-contained deck.
//   A slide is 16:9 and an image rarely spans more than half of it, so beyond
//   roughly 1600 px of width you are embedding detail nobody can see. On a real
//   20-image deck this cut the inlined file from 8.1 MB to 3.2 MB.
//
// Usage
//   node tools/optimise-images.mjs <input.html> [-o <output.html>]
//                                  [--max-width N] [--quality Q] [--dry-run]
//   node tools/optimise-images.mjs --help
//
// Default output is <input>.optimised.html next to the input; the .webp files
// are written beside the originals, which are left untouched.

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const HELP = `optimise-images.mjs – re-encode a deck's images to WebP before inlining

USAGE
  node tools/optimise-images.mjs <input.html> [options]

OPTIONS
  -o, --output <file>   Where to write the rewritten HTML
                        (default: <input>.optimised.html)
  --max-width <px>      Downscale anything wider (default: 1600)
  --quality <1-100>     WebP quality (default: 82)
  --dry-run             Report what would happen, write nothing
  -h, --help            This text

WHAT IT DOES
  For every LOCAL <img src="..."> in the deck: re-encodes it to .webp beside
  the original, downscaling only if it is wider than --max-width, then writes a
  copy of the HTML pointing at the .webp files. Originals are never modified.

WHAT IT LEAVES ALONE
  Remote URLs, data: URIs, SVG (already vector), images that are already .webp,
  and any file it cannot find (a warning goes to stderr).

CHOOSING --max-width
  Measure, do not guess. Open the deck and ask the widest image how much of the
  slide it covers:

    Math.max(...[...document.querySelectorAll('.slide img')].map(i =>
      i.getBoundingClientRect().width /
      i.closest('.slide').getBoundingClientRect().width))

  Multiply by the widest slide you will present on (a 4K display is ~3800 px).
  The default 1600 covers an image spanning ~43% of a slide on a 4K screen.

ENCODERS
  Uses whichever it finds first:
    cwebp   (libwebp)      brew install webp
    magick  (ImageMagick)  brew install imagemagick
  If neither is present it exits with a message and changes nothing.

TYPICAL ORDER
  node tools/optimise-images.mjs deck.html -o deck.opt.html
  node tools/inline-deck.mjs      deck.opt.html -o deck.self-contained.html
`;

// Formats worth re-encoding. SVG is vector and WebP would be a downgrade.
const CONVERTIBLE = new Set(['.png', '.jpg', '.jpeg']);

function isExternalOrInline(url) {
  return /^(https?:)?\/\//i.test(url)
      || /^data:/i.test(url)
      || url.startsWith('#')
      || /^[a-z][a-z0-9+.-]*:/i.test(url);
}

/* Image width from the file header, so the common case needs no subprocess.
   We only need the width, and only to decide whether to downscale. Returns
   null when the header is not understood, which callers treat as "don't
   resize" rather than as an error. */
function readWidth(buf, ext) {
  try {
    if (ext === '.png') {
      // 8-byte signature, then IHDR: length(4) type(4) width(4) ...
      if (buf.readUInt32BE(12) !== 0x49484452) return null; // 'IHDR'
      return buf.readUInt32BE(16);
    }
    // JPEG: walk the segment chain to a Start-Of-Frame marker.
    if (buf.readUInt16BE(0) !== 0xffd8) return null;
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      // SOF0..SOF15, excluding the non-frame markers DHT/JPG/DAC
      if (marker >= 0xc0 && marker <= 0xcf &&
          marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return buf.readUInt16BE(i + 7);
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  } catch { /* fall through */ }
  return null;
}

function findEncoder() {
  for (const [cmd, probe] of [['cwebp', ['-version']], ['magick', ['-version']]]) {
    try {
      execFileSync(cmd, probe, { stdio: 'ignore' });
      return cmd;
    } catch { /* try the next one */ }
  }
  return null;
}

/* cwebp's -resize scales to exactly the given size, so it would ENLARGE a
   small image. Both encoders are therefore only asked to resize when the
   source is genuinely wider than the cap. */
function encode(cmd, src, dest, quality, resizeTo) {
  if (cmd === 'cwebp') {
    const args = ['-quiet', '-q', String(quality)];
    if (resizeTo) args.push('-resize', String(resizeTo), '0');
    execFileSync(cmd, [...args, src, '-o', dest], { stdio: 'ignore' });
  } else {
    const args = [src];
    if (resizeTo) args.push('-resize', `${resizeTo}x>`);
    execFileSync(cmd, [...args, '-quality', String(quality), dest], { stdio: 'ignore' });
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { maxWidth: 1600, quality: 82, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '-o' || a === '--output') opts.output = args[++i];
    else if (a === '--max-width') opts.maxWidth = Number(args[++i]);
    else if (a === '--quality') opts.quality = Number(args[++i]);
    else if (a === '--dry-run') opts.dryRun = true;
    else if (!opts.input) opts.input = a;
    else throw new Error(`Unexpected argument: ${a}`);
  }
  if (!opts.help && !opts.input) throw new Error('No input HTML file given.');
  if (!(opts.maxWidth > 0)) throw new Error('--max-width must be a positive number.');
  if (!(opts.quality >= 1 && opts.quality <= 100)) throw new Error('--quality must be 1-100.');
  return opts;
}

function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) { process.stdout.write(HELP); return 0; }

  const inputPath = path.resolve(opts.input);
  if (!existsSync(inputPath)) {
    process.stderr.write(`Error: input not found: ${inputPath}\n`);
    return 1;
  }
  const encoder = findEncoder();
  if (!encoder && !opts.dryRun) {
    process.stderr.write(
      'Error: no WebP encoder found. Install one of:\n' +
      '  brew install webp          (cwebp, best compression)\n' +
      '  brew install imagemagick   (magick)\n');
    return 1;
  }

  const inputDir = path.dirname(inputPath);
  const html = readFileSync(inputPath, 'utf8');
  const seen = new Map();          // original ref -> new ref (or null = keep)
  let before = 0, after = 0, converted = 0, skipped = 0, missing = 0;

  const out = html.replace(/(<img\b[^>]*?\bsrc=)(["'])(.*?)\2/gi, (m, head, q, ref) => {
    if (isExternalOrInline(ref)) return m;
    if (seen.has(ref)) {
      const to = seen.get(ref);
      return to ? `${head}${q}${to}${q}` : m;
    }
    const ext = path.extname(ref).toLowerCase();
    if (!CONVERTIBLE.has(ext)) { skipped++; seen.set(ref, null); return m; }

    const srcPath = path.resolve(inputDir, ref);
    if (!existsSync(srcPath)) {
      process.stderr.write(`warning: image not found, left as is: ${ref}\n`);
      missing++; seen.set(ref, null); return m;
    }
    const destRef = ref.replace(/\.[^.]+$/, '.webp');
    const destPath = path.resolve(inputDir, destRef);
    const srcBytes = statSync(srcPath).size;
    const width = readWidth(readFileSync(srcPath), ext);
    const resizeTo = width && width > opts.maxWidth ? opts.maxWidth : null;

    if (!opts.dryRun) {
      try {
        encode(encoder, srcPath, destPath, opts.quality, resizeTo);
      } catch (e) {
        process.stderr.write(`warning: could not encode ${ref}, left as is\n`);
        missing++; seen.set(ref, null); return m;
      }
      after += statSync(destPath).size;
    }
    before += srcBytes;
    converted++;
    seen.set(ref, destRef);
    return `${head}${q}${destRef}${q}`;
  });

  const outputPath = opts.output
    ? path.resolve(opts.output)
    : inputPath.replace(/\.html?$/i, '') + '.optimised.html';

  if (!opts.dryRun) writeFileSync(outputPath, out, 'utf8');

  const pct = before ? Math.round(after / before * 100) : 100;
  process.stderr.write(
    `${opts.dryRun ? '[dry run] ' : ''}` +
    `${converted} image(s) via ${encoder || 'no encoder'}` +
    `, ${skipped} skipped, ${missing} left as is\n`);
  if (!opts.dryRun) {
    process.stderr.write(
      `images ${(before / 1e6).toFixed(2)} MB -> ${(after / 1e6).toFixed(2)} MB (${pct}%)\n` +
      `${inputPath} -> ${outputPath}\n`);
  }
  return 0;
}

try {
  process.exit(main(process.argv));
} catch (err) {
  process.stderr.write(`optimise-images: ${err.message}\n`);
  process.exit(1);
}
