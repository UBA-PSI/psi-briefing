#!/usr/bin/env bash
# build-deck.sh – turn a linked development deck into one shareable file.
#
# Part of the browserslides toolchain (CC BY 4.0).
#
# The pipeline is short but the order matters, and the last step is the one
# people skip: a deck can come out of the inliner looking finished and still
# need the network. This script runs all three and refuses to stay quiet about
# the result.
#
#   1. optimise-images.mjs   re-encode images to WebP at the size slides use
#   2. inline-deck.mjs       fold CSS, JS and images into the HTML
#   3. verify                assert nothing external is left
#
# Usage
#   tools/build-deck.sh deck.html
#   tools/build-deck.sh deck.html -o share/deck.html --max-width 2000
#   tools/build-deck.sh --help

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

MAX_WIDTH=1600
QUALITY=82
SKIP_IMAGES=0
INPUT=""
OUTPUT=""

usage() {
  cat <<'EOF'
build-deck.sh – build one self-contained HTML file from a linked deck

USAGE
  tools/build-deck.sh <deck.html> [options]

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
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help)     usage; exit 0 ;;
    -o|--output)   OUTPUT="${2:?--output needs a value}"; shift 2 ;;
    --max-width)   MAX_WIDTH="${2:?--max-width needs a value}"; shift 2 ;;
    --quality)     QUALITY="${2:?--quality needs a value}"; shift 2 ;;
    --skip-images) SKIP_IMAGES=1; shift ;;
    -*)            echo "build-deck: unknown option: $1" >&2; exit 1 ;;
    *)
      if [ -n "$INPUT" ]; then echo "build-deck: unexpected argument: $1" >&2; exit 1; fi
      INPUT="$1"; shift ;;
  esac
done

[ -n "$INPUT" ] || { usage >&2; exit 1; }
[ -f "$INPUT" ] || { echo "build-deck: no such file: $INPUT" >&2; exit 1; }
command -v node >/dev/null || { echo "build-deck: node 18+ is required" >&2; exit 1; }

[ -n "$OUTPUT" ] || OUTPUT="${INPUT%.html}.self-contained.html"
mkdir -p "$(dirname -- "$OUTPUT")"

# The intermediate file MUST sit beside the original: every href/src in a deck
# resolves against its own directory, so a stage file in /tmp would send the
# inliner looking for assets/ and imgs/ in the wrong place and it would quietly
# emit a deck with all its references intact but unresolvable.
STAGE="$(dirname -- "$INPUT")/.build-deck-stage.$$.html"
trap 'rm -f "$STAGE"' EXIT

size_of() { wc -c < "$1" | tr -d ' '; }
mb() { awk -v b="$1" 'BEGIN { printf "%.2f MB", b/1000000 }'; }

IN_BYTES="$(size_of "$INPUT")"

# ---------------------------------------------------------------- 1. images
if [ "$SKIP_IMAGES" -eq 1 ]; then
  echo "1/3  images       skipped (--skip-images)"
  cp "$INPUT" "$STAGE"
elif command -v cwebp >/dev/null || command -v magick >/dev/null; then
  echo "1/3  images       re-encoding to WebP (max ${MAX_WIDTH}px, q${QUALITY})"
  node "$SCRIPT_DIR/optimise-images.mjs" "$INPUT" -o "$STAGE" \
       --max-width "$MAX_WIDTH" --quality "$QUALITY" 2>&1 | sed 's/^/     /'
else
  echo "1/3  images       SKIPPED: no WebP encoder found." >&2
  echo "                  install one for a much smaller file:" >&2
  echo "                    brew install webp        (cwebp)" >&2
  echo "                    brew install imagemagick (magick)" >&2
  cp "$INPUT" "$STAGE"
fi

# ---------------------------------------------------------------- 2. inline
echo "2/3  inline       folding CSS, JS and images into the HTML"
node "$SCRIPT_DIR/inline-deck.mjs" "$STAGE" -o "$OUTPUT" 2>&1 | sed 's/^/     /'

# ---------------------------------------------------------------- 3. verify
# Static check, so it needs no browser. Style and script CONTENT is stripped
# first: the framework's own CSS header quotes <link rel="stylesheet"> lines as
# documentation, and a naive grep reports those as unresolved dependencies.
echo "3/3  verify       checking for anything still external"
VERDICT="$(node -e '
const fs = require("node:fs");
let html = fs.readFileSync(process.argv[1], "utf8");
html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "<style></style>")
           .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "<script></script>")
           .replace(/<!--[\s\S]*?-->/g, "");
const problems = [];
const add = (re, label) => {
  for (const m of html.matchAll(re)) problems.push(`${label}: ${m[1].slice(0, 70)}`);
};
add(/<link\b[^>]*\bhref=["\x27]([^"\x27]+)["\x27][^>]*>/gi, "external stylesheet");
add(/<script\b[^>]*\bsrc=["\x27]([^"\x27]+)["\x27]/gi,      "external script");
add(/<img\b[^>]*\bsrc=["\x27](?!data:)([^"\x27]+)["\x27]/gi, "image not embedded");
add(/url\(\s*["\x27]?(?!data:)((?:https?:)?\/\/[^)"\x27]+)/gi, "remote css url");
// Links to other pages are fine - those are hyperlinks, not dependencies.
console.log(problems.length ? problems.join("\n") : "OK");
' "$OUTPUT")"

OUT_BYTES="$(size_of "$OUTPUT")"

echo
if [ "$VERDICT" = "OK" ]; then
  echo "built   $OUTPUT"
  echo "        $(mb "$IN_BYTES") linked  ->  $(mb "$OUT_BYTES") self-contained"
  echo "        no external references: opens with no server and no network"
  echo
  echo "One check this cannot do without a browser: open the file and confirm"
  echo "  performance.getEntriesByType('resource').filter(e => !e.name.startsWith('data:'))"
  echo "is empty, and that no image is broken."
  exit 0
fi

echo "built   $OUTPUT   ($(mb "$OUT_BYTES"))" >&2
echo "PROBLEM this file still depends on things outside itself:" >&2
echo "$VERDICT" | sed 's/^/        /' >&2
echo >&2
echo "        Remote URLs are left alone on purpose - the tools cannot know" >&2
echo "        whether a file on someone else's server is yours to embed." >&2
echo "        Download them next to the deck, point the src at the local copy," >&2
echo "        and build again." >&2
exit 2
