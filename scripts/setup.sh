#!/usr/bin/env bash
set -euo pipefail

readonly LOGGING_UTILS="./scripts/log.sh"
readonly GLOBAL_LSP_PACKAGES=(typescript-language-server typescript)

setup_environment() {
  local repository_root
  repository_root=$(git rev-parse --show-toplevel)
  cd "$repository_root"

  # shellcheck disable=SC1090
  source "$LOGGING_UTILS"
}

# The global install must use the nvm-managed npm: under WSL a Windows npm or tsc
# from /mnt/c can shadow it on PATH.
resolve_nvm_npm() {
  local npm_path
  npm_path=$(command -v npm || true)

  if [[ -z "$npm_path" || "$npm_path" == /mnt/* ]]; then
    log::error "nvm npm not found on PATH (got '${npm_path:-none}'); run 'nvm use' first"
    return 1
  fi

  printf '%s\n' "$npm_path"
}

install_language_server() {
  local npm_path package
  local missing=()
  npm_path=$(resolve_nvm_npm)

  for package in "${GLOBAL_LSP_PACKAGES[@]}"; do
    if ! "$npm_path" ls --global --depth=0 "$package" >/dev/null 2>&1; then
      missing+=("$package")
    fi
  done

  if ((${#missing[@]} == 0)); then
    log::info "typescript-language-server and typescript already installed globally"
    return 0
  fi

  log::step "installing ${missing[*]} globally with $npm_path"
  "$npm_path" install --global "${missing[@]}"
  log::step_end
}

main() {
  setup_environment

  log::step "installing dependencies from bun.lock"
  bun install --frozen-lockfile
  log::step_end

  log::step "installing prek git hooks"
  bun run prek install --prepare-hooks
  log::step_end

  install_language_server

  log::success "development environment setup"
}

main "$@"
