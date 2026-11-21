#!/usr/bin/env bash
# Fails when the committed dist/ differs from a fresh build, so the bundles a plugin install runs never drift from src/.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/log.sh

fresh_build=$(mktemp -d)
trap 'rm -rf -- "$fresh_build"' EXIT

bash scripts/build.sh "$fresh_build/dist" >/dev/null

if ! diff -r dist "$fresh_build/dist"; then
  log::error "dist/ is stale: run make build and commit dist/"
  exit 1
fi
