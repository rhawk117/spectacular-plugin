#!/usr/bin/env bash
# PostToolUse hook for Edit|Write|MultiEdit: Prettier formats the edited file, then ESLint fixes it.
# Exit 2 with ESLint's remaining errors on stderr so Claude fixes them; unsupported files exit 0 quietly.
set -uo pipefail

readonly PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
readonly PRETTIER="$PROJECT_DIR/node_modules/.bin/prettier"
readonly ESLINT="$PROJECT_DIR/node_modules/.bin/eslint"
readonly PRETTIER_CACHE=".cache/prettier/cache.json"
readonly ESLINT_CACHE=".cache/eslint/"

edited_file() {
  jq -er '.tool_input.file_path // empty' 2>/dev/null
}

run_prettier() {
  "$PRETTIER" --write --cache --cache-location "$PRETTIER_CACHE" --log-level silent -- "$1" >/dev/null 2>&1
}

main() {
  local file_path eslint_output eslint_status

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
  [[ -x "$PRETTIER" ]] || exit 0
  run_prettier "$file_path" || exit 0

  [[ "$file_path" == *.ts && -x "$ESLINT" ]] || exit 0

  eslint_output=$("$ESLINT" --fix --cache --cache-location "$ESLINT_CACHE" --format stylish -- "$file_path" 2>&1)
  eslint_status=$?

  # ESLint fixes can change layout, so Prettier gets the last word.
  run_prettier "$file_path"

  case "$eslint_status" in
    0) exit 0 ;;
    1)
      printf 'ESLint found problems it cannot fix in %s:\n%s\n' "$file_path" "$eslint_output" >&2
      exit 2
      ;;
    *)
      printf 'ESLint failed to run on %s:\n%s\n' "$file_path" "$eslint_output" >&2
      exit 1
      ;;
  esac
}

main "$@"
