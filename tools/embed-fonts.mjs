#!/usr/bin/env node
// embed-fonts.mjs — turn font files into base64 @font-face CSS rules.
//
// Part of the browserslides toolchain (MIT - see LICENSE). Dependency-free: uses only
// Node.js built-ins (fs, path). Requires Node 18+ (ESM).
//
// What it does
//   Reads one or more font files, base64-encodes each, and prints a matching
//   @font-face rule (with font-display:swap) to stdout. Paste the output into
//   a <style> block or a theme file to make a deck fully self-contained — no
//   external font requests, works offline.
//
// Usage
//   node tools/embed-fonts.mjs <font-file> [<font-file> ...]
//   node tools/embed-fonts.mjs --manifest fonts.json
//   node tools/embed-fonts.mjs --help
//
// Manifest mode
//   fonts.json is a JSON array of entries. Only `file` is required; the rest
//   default to sensible guesses:
//     [
//       { "file": "Copse-Regular.ttf", "family": "Copse", "weight": 400,
//         "style": "normal", "display": "swap" },
//       { "file": "OpenSans-Bold.woff2", "family": "Open Sans", "weight": 700 }
//     ]
//   Paths in the manifest are resolved relative to the manifest file itself.

import { readFileSync } from 'node:fs';
import path from 'node:path';

// --- format + mime lookup by extension -----------------------------------
// The @font-face `format()` hint and the data: URI mime type both depend on
// the file extension. woff2 is by far the smallest; prefer it when you can.
const FONT_FORMATS = {
  '.woff2': { format: 'woff2',    mime: 'font/woff2' },
  '.woff':  { format: 'woff',     mime: 'font/woff'  },
  '.ttf':   { format: 'truetype', mime: 'font/ttf'   },
  '.otf':   { format: 'opentype', mime: 'font/otf'   },
};

const HELP = `embed-fonts.mjs — base64-embed fonts as @font-face CSS rules

USAGE
  node tools/embed-fonts.mjs <font-file> [<font-file> ...]
  node tools/embed-fonts.mjs --manifest <fonts.json>
  node tools/embed-fonts.mjs --help

ARGUMENTS
  <font-file>          One or more .woff2/.woff/.ttf/.otf files. The
                       font-family, weight and style are guessed from the
                       filename (e.g. "OpenSans-BoldItalic.woff2" ->
                       family "Open Sans", weight 700, style italic).

  --manifest <file>    JSON array of { file, family, weight, style, display }.
                       Only "file" is required; anything you set overrides the
                       filename guess. Paths resolve relative to the manifest.

OUTPUT
  @font-face CSS rules on stdout (with font-display:swap). Redirect or copy
  them into a <style> block or a theme file to make a deck self-contained:

      node tools/embed-fonts.mjs fonts/*.woff2 >> themes/mytheme.css
`;

// --- filename-based guessing ----------------------------------------------

// Map common weight words/numbers found in font filenames to numeric weights.
const WEIGHT_WORDS = {
  thin: 100, hairline: 100,
  extralight: 200, ultralight: 200,
  light: 300,
  regular: 400, normal: 400, book: 400,
  medium: 500,
  semibold: 600, demibold: 600,
  bold: 700,
  extrabold: 800, ultrabold: 800,
  black: 900, heavy: 900,
};

// Split a filename stem like "OpenSans-SemiBoldItalic" into its tokens so we
// can pick out the family, weight and style. We treat -, _, space and
// camelCase boundaries as separators.
function tokenize(stem) {
  return stem
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camelCase -> spaced words
    .split(/[\s\-_.]+/)
    .filter(Boolean);
}

// Guess { family, weight, style } from a font filename. Weight/style tokens
// are stripped from the family name; whatever remains is the family.
function guessFromFilename(file) {
  const stem = path.basename(file, path.extname(file));
  const tokens = tokenize(stem);

  let weight = 400;
  let style = 'normal';
  const familyParts = [];

  for (const tok of tokens) {
    const low = tok.toLowerCase();
    if (low === 'italic' || low === 'oblique') {
      style = 'italic';
    } else if (WEIGHT_WORDS[low] !== undefined) {
      weight = WEIGHT_WORDS[low];
    } else if (/^\d{3}$/.test(low)) {
      weight = Number(low); // explicit numeric weight, e.g. "600"
    } else {
      familyParts.push(tok);
    }
  }

  // Fall back to the whole stem if every token looked like a modifier.
  const family = familyParts.join(' ') || stem;
  return { family, weight, style };
}

// --- rule generation -------------------------------------------------------

// Build a single @font-face rule string from a resolved font descriptor.
function buildFontFace({ file, family, weight, style, display }) {
  const ext = path.extname(file).toLowerCase();
  const info = FONT_FORMATS[ext];
  if (!info) {
    throw new Error(
      `Unsupported font extension "${ext}" for ${file}. ` +
      `Supported: ${Object.keys(FONT_FORMATS).join(', ')}`
    );
  }

  const bytes = readFileSync(file);
  const base64 = bytes.toString('base64');
  const dataUri = `data:${info.mime};base64,${base64}`;

  return [
    `/* ${path.basename(file)} — ${(bytes.length / 1024).toFixed(1)} KiB */`,
    `@font-face {`,
    `  font-family: "${family}";`,
    `  font-style: ${style};`,
    `  font-weight: ${weight};`,
    `  font-display: ${display};`,
    `  src: url("${dataUri}") format("${info.format}");`,
    `}`,
  ].join('\n');
}

// Merge a filename guess with any explicit overrides (from CLI or manifest).
function resolveDescriptor(file, overrides = {}) {
  const guess = guessFromFilename(file);
  return {
    file,
    family: overrides.family ?? guess.family,
    weight: overrides.weight ?? guess.weight,
    style: overrides.style ?? guess.style,
    display: overrides.display ?? 'swap',
  };
}

// --- argument handling -----------------------------------------------------

function loadManifest(manifestPath) {
  const raw = readFileSync(manifestPath, 'utf8');
  let entries;
  try {
    entries = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Could not parse manifest ${manifestPath}: ${err.message}`);
  }
  if (!Array.isArray(entries)) {
    throw new Error(`Manifest ${manifestPath} must be a JSON array of entries.`);
  }
  const baseDir = path.dirname(path.resolve(manifestPath));
  // Resolve each entry's `file` relative to the manifest's own directory.
  return entries.map((entry) => {
    if (!entry || typeof entry.file !== 'string') {
      throw new Error(`Each manifest entry needs a "file" string. Got: ${JSON.stringify(entry)}`);
    }
    const file = path.resolve(baseDir, entry.file);
    return resolveDescriptor(file, entry);
  });
}

function main(argv) {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    process.stdout.write(HELP);
    return 0;
  }

  let descriptors;
  const manifestIdx = args.indexOf('--manifest');
  if (manifestIdx !== -1) {
    const manifestPath = args[manifestIdx + 1];
    if (!manifestPath) {
      process.stderr.write('Error: --manifest requires a path to a JSON file.\n');
      return 1;
    }
    descriptors = loadManifest(manifestPath);
  } else {
    // Positional mode: every argument is a font file path.
    descriptors = args.map((file) => resolveDescriptor(path.resolve(file)));
  }

  if (descriptors.length === 0) {
    process.stderr.write('Error: no fonts to embed.\n');
    return 1;
  }

  // Header comment so the origin of the pasted CSS is obvious.
  const rules = [
    `/* Fonts embedded by tools/embed-fonts.mjs — ${descriptors.length} face(s).`,
    `   base64 data URIs; no external requests. Paste into a <style> or theme. */`,
    '',
  ];
  for (const d of descriptors) {
    rules.push(buildFontFace(d));
    rules.push('');
  }
  process.stdout.write(rules.join('\n'));
  return 0;
}

try {
  process.exit(main(process.argv));
} catch (err) {
  process.stderr.write(`embed-fonts: ${err.message}\n`);
  process.exit(1);
}
