#!/usr/bin/env bash
# sync-assets.sh – keep the copies of framework/ and themes/ in step.
#
# Part of the psi-briefing toolchain (MIT - see LICENSE).
#
# WHY THIS EXISTS
#   framework/briefing.{css,js} and themes/*.css are the originals, but two
#   places hold copies of them:
#
#     skills/briefing/references/assets/   so the skill is self-contained
#     test-aufsicht/assets/                     so the test decks link locally
#
#   docs/cookbook.md and skills/briefing/references/components.md are the
#   same pairing one level up: the skill carries its own copy of the catalog.
#
#   Copies drift silently, and the failure mode is nasty: you change the CSS,
#   look at a deck, and see the OLD behaviour - then debug the change instead of
#   the stale copy. That happened while adding .cols--figure.
#
# Usage
#   tools/sync-assets.sh           copy the originals over every copy
#   tools/sync-assets.sh --check   report drift and exit 1; changes nothing

set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CHECK=0
[ "${1:-}" = "--check" ] && CHECK=1
[ $# -gt 0 ] && [ "$CHECK" -eq 0 ] && { echo "sync-assets: unknown argument: $1" >&2; exit 1; }

# Copy targets that exist. test-aufsicht/ is gitignored, so it may be absent.
TARGETS=()
for d in "$ROOT/skills/briefing/references/assets" "$ROOT/test-aufsicht/assets"; do
  [ -d "$d" ] && TARGETS+=("$d")
done
[ ${#TARGETS[@]} -gt 0 ] || { echo "sync-assets: no copies found, nothing to do"; exit 0; }

SOURCES=("$ROOT/framework/briefing.css" "$ROOT/framework/briefing.js")
for t in "$ROOT"/themes/*.css; do SOURCES+=("$t"); done

drift=0

# One source -> one destination. Reports or fixes, per --check.
compare() {
  local src="$1" dest="$2" rel
  [ -f "$dest" ] || return 0   # a copy that was never made is not drift
  cmp -s "$src" "$dest" && return 0
  drift=$((drift + 1))
  rel="${dest#"$ROOT"/}"
  if [ "$CHECK" -eq 1 ]; then
    echo "stale: $rel"
  else
    cp "$src" "$dest"
    echo "updated: $rel"
  fi
}

for src in "${SOURCES[@]}"; do
  for dir in "${TARGETS[@]}"; do
    compare "$src" "$dir/$(basename -- "$src")"
  done
done

# The component catalog, kept twice under two different names.
compare "$ROOT/docs/cookbook.md" "$ROOT/skills/briefing/references/components.md"

if [ "$CHECK" -eq 1 ]; then
  [ "$drift" -eq 0 ] && { echo "assets in sync"; exit 0; }
  echo >&2
  echo "$drift copy/copies are out of date. Run tools/sync-assets.sh to fix." >&2
  exit 1
fi
[ "$drift" -eq 0 ] && echo "assets already in sync"
exit 0
