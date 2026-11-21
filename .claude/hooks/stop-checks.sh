#!/usr/bin/env bash
# Stop hook: before Claude finishes, run the prek lint hooks (oxlint, ESLint, tsc, markdownlint, ...) on changed files,
# then the unit tier when a .ts file changed. Exit 2 with the failing output on stderr so Claude fixes it.
# A clean tree, a missing toolchain or a second stop attempt in a row (stop_hook_active) exits 0.
set -uo pipefail

readonly PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
readonly OUTPUT_LINES=40

stop_hook_active() {
  jq -e '.stop_hook_active == true' >/dev/null 2>&1
}

toolchain_ready() {
  command -v bun >/dev/null 2>&1 && [[ -d node_modules ]]
}

changed_files() {
  local file_path
  {
    git diff --name-only HEAD
    git ls-files --others --exclude-standard
  } | sort -u | while IFS= read -r file_path; do
    [[ -f "$file_path" ]] && printf '%s\n' "$file_path"
  done
}

run_check() {
  local name=$1 output
  shift
  if ! output=$("$@" 2>&1); then
    printf '%s failed:\n%s\n\n' "$name" "$(tail -n "$OUTPUT_LINES" <<<"$output")" >&2
    return 1
  fi
}

main() {
  local -a files
  local failed=0

  stop_hook_active && exit 0
  cd "$PROJECT_DIR" || exit 0
  toolchain_ready || exit 0
  mapfile -t files < <(changed_files)
  ((${#files[@]} > 0)) || exit 0

  run_check "prek lint hooks" bun run prek run --color never --group lint --files "${files[@]}" || failed=1
  if printf '%s\n' "${files[@]}" | grep -q '\.ts$'; then
    run_check "Unit tests (make test)" bun run test || failed=1
  fi
  ((failed == 0)) || exit 2
}

main
