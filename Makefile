SHELL := /usr/bin/env bash
BUN ?= bun
.DEFAULT_GOAL := help

.PHONY: help setup sync build format lint typecheck test test.integration coverage quality pre-commit check
help: ## Show available targets
	@awk 'BEGIN {FS = ":.*## "; printf "Usage: make <target>\n\nTargets:\n"} /^[a-zA-Z0-9_.-]+:.*## / {printf "  %-16s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Setup Developer Environment
	bash ./scripts/setup.sh

sync: ## Install dependencies exactly as locked in bun.lock
	$(BUN) install --frozen-lockfile

build: ## Bundle each src/bin entrypoint into dist/
	$(BUN) run build

format: ## Run the prek format hooks on all files
	$(BUN) run prek run --all-files --group format

lint: ## Run the prek lint hooks on all files
	$(BUN) run prek run --all-files --group lint

typecheck: ## Run tsc for typechecking
	$(BUN) run typecheck

test: ## Run the unit tier in shuffled order
	$(BUN) run test

test.integration: ## Run the integration tier against the built dist/
	$(BUN) run test:integration

coverage: ## Run the unit tier with coverage and its thresholds
	$(BUN) run coverage

quality: ## Run every prek hook on all files, then the tests CI runs
	$(BUN) run prek run --all-files
	$(BUN) run coverage

pre-commit: ## Run every prek hook on all files
	$(BUN) run prek run --all-files

check: lint test ## Run lint then test
