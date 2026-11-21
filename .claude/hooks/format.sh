#!/usr/bin/env bash
# PostToolUse hook for Edit|Write|MultiEdit: Prettier formats the edited file, then ESLint (.ts) or markdownlint (.md) fixes it.
# Exit 2 with the linter's remaining errors on stderr so Claude fixes them; unsupported files exit 0 quietly.
set -uo pipefail

readonly PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
readonly PRETTIER_CACHE=".cache/prettier/cache.json"
readonly ESLINT_CACHE=".cache/eslint/"

edited_file() {
  jq -er '.tool_input.file_path // empty' 2>/dev/null
}

toolchain_ready() {
  command -v bun >/dev/null 2>&1 && [[ -d node_modules ]]
}

run_prettier() {
  bun run prettier --write --cache --cache-location "$PRETTIER_CACHE" --log-level silent -- "$1" >/dev/null 2>&1
}

linter_for() {
  case "$1" in
    *.ts) echo ESLint ;;
    *.md) echo markdownlint ;;
  esac
}

run_linter() {
  case "$1" in
    ESLint) bun run eslint --fix --cache --cache-location "$ESLINT_CACHE" --format stylish -- "$2" ;;
    # The ":" prefix makes markdownlint-cli2 read the path literally instead of as a glob.
    markdownlint) bun run markdownlint-cli2 --fix ":$2" ;;
  esac
}

main() {
  local file_path linter lint_output lint_status

  file_path=$(edited_file) || exit 0
  [[ -f "$file_path" ]] || exit 0

  case "$file_path" in
    "$PROJECT_DIR"/*) ;;
    *) exit 0 ;;
  esac

  case "$file_path" in
    *.ts | *.js | *.mjs | *.json | *.jsonc | *.md | *.yml | *.yaml) ;;
    *) exit 0 ;;
  esac

  cd "$PROJECT_DIR" || exit 0
  toolchain_ready || exit 0
  run_prettier "$file_path" || exit 0

  linter=$(linter_for "$file_path")
  [[ -n "$linter" ]] || exit 0

  lint_output=$(run_linter "$linter" "$file_path" 2>&1)
  lint_status=$?

  # Linter fixes can change layout, so Prettier gets the last word.
  run_prettier "$file_path"

  case "$lint_status" in
    0) exit 0 ;;
    1)
      printf '%s found problems it cannot fix in %s:\n%s\n' "$linter" "$file_path" "$lint_output" >&2
      exit 2
      ;;
    *)
      printf '%s failed to run on %s:\n%s\n' "$linter" "$file_path" "$lint_output" >&2
      exit 1
      ;;
  esac
}

main "$@"
