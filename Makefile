SHELL := /usr/bin/env bash
BUN ?= bun
.DEFAULT_GOAL := help

.PHONY: help setup sync format lint typecheck test quality pre-commit check
help: ## Show available targets
	@awk 'BEGIN {FS = ":.*## "; printf "Usage: make <target>\n\nTargets:\n"} /^[a-zA-Z0-9_.-]+:.*## / {printf "  %-16s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Setup Developer Environment
	bash ./scripts/setup.sh

sync: ## Install dependencies exactly as locked in bun.lock
	$(BUN) install --frozen-lockfile

format: ## Run the prek format hooks on all files
	$(BUN) run prek run --all-files --group format

lint: ## Run the prek lint hooks on all files
	$(BUN) run prek run --all-files --group lint

typecheck: ## Run tsc for typechecking
	$(BUN) run typecheck

test: ## Run the Vitest suite
	$(BUN) run test

quality: ## Run every prek hook on all files, then the tests CI runs
	$(BUN) run prek run --all-files
	$(BUN) run test

pre-commit: ## Run every prek hook on all files
	$(BUN) run prek run --all-files

check: lint test ## Run lint then test
