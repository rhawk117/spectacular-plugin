#!/usr/bin/env bash
# PreToolUse hook for Edit|Write|MultiEdit: ask before an edit adds a lint, type, format or coverage suppression.
# Suppression lines before and after the edit are compared, so keeping or moving an existing one does not ask.
set -uo pipefail

readonly PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
readonly DIRECTIVE='(eslint|oxlint)-disable|eslint[[:space:]]+[@a-z]|@ts-(ignore|expect-error|nocheck)|prettier-ignore|shellcheck[[:space:]]+disable|zizmor:[[:space:]]*ignore|(v8|c8|istanbul)[[:space:]]+ignore'
readonly SUPPRESSION="(//|/\\*+|#)[[:space:]]*($DIRECTIVE)"

suppressed_lines() {
  grep -E -- "$SUPPRESSION" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g' | LC_ALL=C sort
}

text_before() {
  local payload=$1 file_path=$2
  if [[ $(jq -r '.tool_name' <<<"$payload") == "Write" ]]; then
    [[ -f "$file_path" ]] && cat -- "$file_path"
    return 0
  fi
  jq -r '.tool_input | if .edits then [.edits[].old_string] | join("\n") else .old_string // "" end' <<<"$payload"
}

text_after() {
  jq -r '.tool_input | if .edits then [.edits[].new_string] | join("\n") else .content // .new_string // "" end' <<<"$1"
}

main() {
  local payload file_path added reason

  payload=$(cat)
  file_path=$(jq -er '.tool_input.file_path // empty' <<<"$payload" 2>/dev/null) || exit 0

  case "$file_path" in
    "$PROJECT_DIR"/*) ;;
    *) exit 0 ;;
  esac

  case "$file_path" in
    *.ts | *.mts | *.cts | *.js | *.mjs | *.cjs | *.sh | *.bash | *.yml | *.yaml) ;;
    *) exit 0 ;;
  esac

  added=$(LC_ALL=C comm -13 \
    <(text_before "$payload" "$file_path" | suppressed_lines) \
    <(text_after "$payload" | suppressed_lines))
  [[ -n "$added" ]] || exit 0

  reason=$(printf 'This edit adds suppressions to %s:\n%s' "${file_path#"$PROJECT_DIR"/}" "$added")
  jq -n --arg reason "$reason" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: $reason
    }
  }'
}

main "$@"
