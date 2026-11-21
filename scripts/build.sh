#!/usr/bin/env bash
# Bundles each src/bin entrypoint and its dependencies into one ESM file for Node, so plugin installs need no npm install.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

readonly OUT_DIR="${1:-dist}"

shopt -s nullglob
entrypoints=()
for entrypoint in src/bin/*.ts; do
  [[ "$entrypoint" == *.test.ts ]] || entrypoints+=("$entrypoint")
done

rm -rf -- "$OUT_DIR"
if ((${#entrypoints[@]} == 0)); then
  mkdir -p -- "$OUT_DIR"
  exit 0
fi

bun build "${entrypoints[@]}" --root src/bin --outdir "$OUT_DIR" --target node --format esm
