#!/usr/bin/env node
// build-deck.mjs – turn a linked development deck into one shareable file.
//
// Part of the psi-briefing toolchain (MIT - see LICENSE).
//
// The pipeline is short but the order matters, and the last step is the one
// people skip: a deck can come out of the inliner looking finished and still
// need the network. This script runs all three and refuses to stay quiet about
// the result.
//
//   1. optimise-images.mjs   re-encode images to WebP at the size slides use
//   2. inline-deck.mjs       fold CSS, JS and images into the HTML
//   3. verify                assert nothing external is left
//
// This is the portable entry point. build-deck.sh wraps it and stays the
// documented name on macOS and Linux, but the reader who has just installed
// Node on Windows has no shell to run that wrapper in, and telling them to
// install one to run two Node scripts is a bad trade. Everything below was
// already Node; only the orchestration was bash.
//
// Usage
//   node tools/build-deck.mjs deck.html
//   node tools/build-deck.mjs deck.html -o share/deck.html --max-width 2000
//   node tools/build-deck.mjs --help

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

const USAGE = `build-deck – build one self-contained HTML file from a linked deck

USAGE
  node tools/build-deck.mjs <deck.html> [options]

OPTIONS
  -o, --output <file>   Result (default: <deck>.self-contained.html)
  --max-width <px>      Downscale images wider than this (default: 1600)
  --quality <1-100>     WebP quality (default: 82)
  --skip-images         Do not re-encode images, only inline
  -h, --help            This text

WHAT YOU GET
  One .html with the stylesheets, the runtime, the fonts and every local image
  embedded. No server, no network, no missing-asset risk.

PICKING --max-width
  Measure instead of guessing. In the deck's console:

    Math.max(...[...document.querySelectorAll('.slide img')].map(i =>
      i.getBoundingClientRect().width /
      i.closest('.slide').getBoundingClientRect().width))

  Multiply by the widest screen you will present on (4K is ~3800 px). The
  default 1600 covers an image spanning ~43% of a slide on a 4K display.

REQUIREMENTS
  node 18+                     always
  cwebp or magick              only for the image step; without one the script
                               warns, skips it, and still produces a valid file

EXIT CODES
  0  built and verified
  1  usage or input error
  2  built, but verification found external references
`;

// ---------------------------------------------------------------- arguments
function parseArgs(argv) {
  const opts = { maxWidth: '1600', quality: '82', skipImages: false, input: '', output: '' };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const needsValue = (name) => {
      const value = argv[++i];
      if (value === undefined) fail(`${name} needs a value`);
      return value;
    };

    switch (arg) {
      case '-h': case '--help': process.stdout.write(USAGE); process.exit(0); break;
      case '-o': case '--output': opts.output = needsValue('--output'); break;
      case '--max-width': opts.maxWidth = needsValue('--max-width'); break;
      case '--quality': opts.quality = needsValue('--quality'); break;
      case '--skip-images': opts.skipImages = true; break;
      default:
        if (arg.startsWith('-')) fail(`unknown option: ${arg}`);
        if (opts.input) fail(`unexpected argument: ${arg}`);
        opts.input = arg;
    }
  }
  return opts;
}

function fail(message) {
  process.stderr.write(`build-deck: ${message}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------- helpers
const mb = (bytes) => `${(bytes / 1000000).toFixed(2)} MB`;
const sizeOf = (file) => fs.statSync(file).size;

// The bash original piped child output through `sed 's/^/     /'`. Indenting
// here keeps the transcript on the website and in RELEASING.md accurate.
function indent(text) {
  return text.split('\n').filter((line, i, all) => line !== '' || i < all.length - 1)
             .map((line) => `     ${line}`).join('\n');
}

// `command -v` has no portable equivalent, and `where`/`which` disagree across
// platforms. Running the binary is the only answer that is true everywhere:
// ENOENT means it is not on PATH, any other outcome means it is.
function haveCommand(cmd) {
  const probe = spawnSync(cmd, ['-version'], { stdio: 'ignore' });
  return !(probe.error && probe.error.code === 'ENOENT');
}

// process.execPath rather than "node": on Windows the launcher that started
// this script is not necessarily the one a bare "node" would resolve to, and
// running the two steps under a different Node than the caller chose is the
// kind of difference that only shows up as a confusing version error later.
function runNode(script, args) {
  const result = spawnSync(process.execPath, [path.join(SCRIPT_DIR, script), ...args],
                           { encoding: 'utf8' });
  if (result.error) fail(`could not run ${script}: ${result.error.message}`);
  const output = `${result.stdout || ''}${result.stderr || ''}`.replace(/\n$/, '');
  if (output) console.log(indent(output));
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// ---------------------------------------------------------------- verify
// Static check, so it needs no browser. Style and script CONTENT is stripped
// first: the framework's own CSS header quotes <link rel="stylesheet"> lines as
// documentation, and a naive grep reports those as unresolved dependencies.
//
// Only the content, though - the OPENING TAG has to survive. Replacing the whole
// element with "<script></script>" also destroyed the src attribute, so the
// "external script" check below could never match and this step declared a deck
// loading a remote <script src> to be free of external references. That is the
// one promise the whole pipeline exists to keep, so the capturing form matters.
function verify(file) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/(<style\b[^>]*>)[\s\S]*?(<\/style>)/gi, '$1$2')
             .replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2')
             .replace(/<!--[\s\S]*?-->/g, '');

  const problems = [];
  const add = (re, label) => {
    for (const m of html.matchAll(re)) problems.push(`${label}: ${m[1].slice(0, 70)}`);
  };
  add(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi, 'external stylesheet');
  add(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi, 'external script');
  add(/<img\b[^>]*\bsrc=["'](?!data:)([^"']+)["']/gi, 'image not embedded');
  add(/url\(\s*["']?(?!data:)((?:https?:)?\/\/[^)"']+)/gi, 'remote css url');
  // Links to other pages are fine - those are hyperlinks, not dependencies.
  return problems;
}

// ---------------------------------------------------------------- main
const opts = parseArgs(process.argv.slice(2));

if (!opts.input) { process.stderr.write(USAGE); process.exit(1); }
if (!fs.existsSync(opts.input)) fail(`no such file: ${opts.input}`);

const output = opts.output || opts.input.replace(/\.html$/, '') + '.self-contained.html';
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });

// The intermediate file MUST sit beside the original: every href/src in a deck
// resolves against its own directory, so a stage file in the temp directory
// would send the inliner looking for assets/ and imgs/ in the wrong place and it
// would quietly emit a deck with all its references intact but unresolvable.
const stage = path.join(path.dirname(opts.input), `.build-deck-stage.${process.pid}.html`);

// bash had `trap ... EXIT`, which also fires on Ctrl-C. Node's 'exit' event does
// not run for a signal, so without the two signal handlers an interrupted build
// leaves a .build-deck-stage.*.html behind next to the user's deck.
const cleanUp = () => { try { fs.unlinkSync(stage); } catch {} };
process.on('exit', cleanUp);
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => { cleanUp(); process.exit(130); });
}

const inBytes = sizeOf(opts.input);

// ---------------------------------------------------------------- 1. images
if (opts.skipImages) {
  console.log('1/3  images       skipped (--skip-images)');
  fs.copyFileSync(opts.input, stage);
} else if (haveCommand('cwebp') || haveCommand('magick')) {
  console.log(`1/3  images       re-encoding to WebP (max ${opts.maxWidth}px, q${opts.quality})`);
  runNode('optimise-images.mjs',
          [opts.input, '-o', stage, '--max-width', opts.maxWidth, '--quality', opts.quality]);
} else {
  process.stderr.write('1/3  images       SKIPPED: no WebP encoder found.\n');
  process.stderr.write('                  install one for a much smaller file:\n');
  process.stderr.write('                    brew install webp        (cwebp)\n');
  process.stderr.write('                    brew install imagemagick (magick)\n');
  fs.copyFileSync(opts.input, stage);
}

// ---------------------------------------------------------------- 2. inline
console.log('2/3  inline       folding CSS, JS and images into the HTML');
runNode('inline-deck.mjs', [stage, '-o', output]);

// ---------------------------------------------------------------- 3. verify
console.log('3/3  verify       checking for anything still external');
const problems = verify(output);
const outBytes = sizeOf(output);

console.log('');
if (problems.length === 0) {
  console.log(`built   ${output}`);
  console.log(`        ${mb(inBytes)} linked  ->  ${mb(outBytes)} self-contained`);
  console.log('        no external references: opens with no server and no network');
  console.log('');
  console.log('One check this cannot do without a browser: open the file and confirm');
  console.log("  performance.getEntriesByType('resource').filter(e => !e.name.startsWith('data:'))");
  console.log('is empty, and that no image is broken.');
  process.exit(0);
}

process.stderr.write(`built   ${output}   (${mb(outBytes)})\n`);
process.stderr.write('PROBLEM this file still depends on things outside itself:\n');
process.stderr.write(problems.map((p) => `        ${p}`).join('\n') + '\n');
process.stderr.write('\n');
process.stderr.write("        Remote URLs are left alone on purpose - the tools cannot know\n");
process.stderr.write('        whether a file on someone else\'s server is yours to embed.\n');
process.stderr.write('        Download them next to the deck, point the src at the local copy,\n');
process.stderr.write('        and build again.\n');
process.exit(2);
