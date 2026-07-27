#!/usr/bin/env bash
# build-deck.sh – turn a linked development deck into one shareable file.
#
# Part of the psi-briefing toolchain (MIT - see LICENSE).
#
# This is a wrapper. The pipeline lives in build-deck.mjs, because a reader who
# has just installed Node on Windows has no shell to run this file in, and
# telling them to install one in order to run two Node scripts is a bad trade.
# Everything the pipeline does was already Node; only the orchestration was
# bash, so the port cost nothing and the shell name still works where people
# have it in their fingers, in the README and in CI.
#
# Every option, every line of output and every exit code is build-deck.mjs's.
# Do not add behaviour here: a flag handled in this file would not exist for
# anyone invoking the .mjs directly, which is what the website now documents.
#
# Usage
#   tools/build-deck.sh deck.html
#   tools/build-deck.sh deck.html -o share/deck.html --max-width 2000
#   tools/build-deck.sh --help

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

command -v node >/dev/null || { echo "build-deck: node 18+ is required" >&2; exit 1; }

# exec, so the exit code reaches the caller unchanged: CI and RELEASING.md both
# rely on 2 meaning "built, but it still points outward".
exec node "$SCRIPT_DIR/build-deck.mjs" "$@"
