# spectacular-plugin

A Claude Code plugin written in TypeScript. Bun installs and runs everything; `make help` lists every target.

## Commands

| Task                                         | Command                 |
| -------------------------------------------- | ----------------------- |
| Install exactly as locked                    | `make sync`             |
| Bundle `src/bin/*.ts` into `dist/`           | `make build`            |
| Fix formatting, then lint                    | `make format lint`      |
| Type-check                                   | `make typecheck`        |
| Unit tier, shuffled                          | `make test`             |
| Integration tier against `dist/`             | `make test.integration` |
| Everything CI runs, with coverage thresholds | `make quality`          |

## Rules

- Add or upgrade a package only with `bun add` (`bun add -d` for tooling); `bunfig.toml` enforces a 14-day release cooldown. Never hand-pin a version and never use npm, npx or yarn.
- Never edit `bun.lock` or `dist/` by hand: `bun add` writes the lockfile, and `make build` writes `dist/`, which is committed and checked for staleness in CI.
- Commit with Conventional Commits (`feat:`, `fix:`, `build:`, `ci:`, `docs:`, `test:`, `refactor:`, `style:`, `chore:`).
- No JSDoc. Comments are a sparse note at the top of a file or a greppable `::TODO::` or `::NOTE::` marker.
- No em dashes in prose, docs or commit messages.
- Ask before editing the lint, format, type-check or test configuration listed under `permissions.ask` in `.claude/settings.json`. Size and complexity limits are maintainer decisions; split the code instead of raising a limit.
- `.claude/rules/typescript.md` loads when a `.ts` file is opened and `.claude/rules/testing.md` when a test is. Read `docs/lint-rule-map.md` before changing a lint rule, and `docs/google-typescript-style.md` when those rules leave a style question open.

## Hooks

- Before an edit, `.claude/hooks/suppressions.sh` asks for permission when the edit adds a lint, type-check or coverage suppression.
- After an edit, `.claude/hooks/format.sh` runs Prettier, then ESLint (`.ts`) or markdownlint (`.md`), and reports what it cannot fix.
- Before finishing, `.claude/hooks/stop-checks.sh` runs the prek lint hooks on changed files, and the unit tier when a `.ts` file changed, and reports failures.

## Verification

Before calling a change done, run `make lint typecheck test`; add `make build test.integration` when `src/bin/` or `tests/integration/` changed, and `make quality` before a commit that touches configuration.

## Sandbox

`bun.lock`, `.claude/settings.json` and `.claude/hooks/` are read-only inside the Bash sandbox. Run `bun add` and any commit that touches them outside it, because prek's fixers rewrite staged files. Inside it, bun needs `BUN_TMPDIR=$TMPDIR BUN_INSTALL_CACHE_DIR=$HOME/.cache/bun/install`.
