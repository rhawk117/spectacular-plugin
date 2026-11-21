# spectacular-plugin

A Claude Code plugin written in TypeScript.

## Development

You need Node.js 24 (through nvm), [Bun](https://bun.sh) 1.4.3 and GNU Make. Bun installs only
package versions that are at least 14 days old (see `bunfig.toml`).

```sh
make setup
claude plugin install typescript-lsp@claude-plugins-official
```

`make setup` installs the locked dependencies, installs the prek git hooks, and installs
`typescript-language-server` and `typescript` globally with the nvm npm when they are missing.
The second command enables the TypeScript language server plugin in Claude Code.

| Target                  | What it does                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `make help`             | List the targets                                                                              |
| `make build`            | Bundle each `src/bin` entrypoint into `dist/`                                                 |
| `make sync`             | Install dependencies exactly as locked in `bun.lock`                                          |
| `make format`           | Run the prek format hooks (oxlint, ESLint and Prettier fixes, shfmt)                          |
| `make lint`             | Run the prek lint hooks (Prettier check, oxlint, ESLint, tsc, shellcheck, actionlint, zizmor) |
| `make typecheck`        | Run `tsc --noEmit`                                                                            |
| `make test`             | Run the unit tier in shuffled order                                                           |
| `make test.integration` | Run the integration tier against the built `dist/`                                            |
| `make coverage`         | Run the unit tier with coverage and its thresholds                                            |
| `make quality`          | Run every prek hook, then the unit tier with coverage, as CI does                             |
| `make check`            | Run lint, then test                                                                           |

Lint rules follow the Google TypeScript Style Guide. `docs/google-typescript-style.md` holds the
digest of its rules and `docs/lint-rule-map.md` maps each rule ID to the check that enforces it.

## Build

Each `src/bin/<name>.ts` is an entrypoint (a hook script, an MCP server or a CLI). `make build` bundles
it and its dependencies into one ESM file, `dist/<name>.js`, with `bun build`. Claude Code installs a
plugin by copying the repository and never runs `bun install`, so `dist/` is committed and plugin
config runs it with `node ${CLAUDE_PLUGIN_ROOT}/dist/<name>.js`. The prek `build` hook rebuilds
`dist/` on commit, and the `dist-fresh` lint hook fails in CI when `dist/` differs from a fresh build.

## Tests

Vitest runs two tiers, defined as projects in `vitest.config.ts`:

- **unit**: `src/**/*.test.ts`, next to the code they test. CI runs them with v8 coverage, and the run
  fails below 80% of lines, branches, functions or statements.
- **integration**: `tests/integration/**/*.test.ts`, which run the bundled `dist/` the way a plugin
  install does. CI runs them in their own job.

Tests run in a shuffled order. Vitest prints the seed; rerun an order with
`bun run vitest run --project unit --sequence.shuffle --sequence.seed=<seed>`. In CI, each tier's job
summary lists the results, the seed with its reproduce command, failures with their tracebacks and
the coverage per file.

## Markdown

The prek `markdown` group formats Markdown with Prettier (2-space indent) and lints its structure with
markdownlint-cli2, including the plugin's skills, agents and commands. `.markdownlint-cli2.jsonc`
turns off the rules that conflict with Prettier and with prompt files (inline XML tags, files that
open with frontmatter instead of a heading).

## Claude Code hooks

In Claude Code, `.claude/hooks/format.sh` runs after every edit: Prettier formats the file, then
ESLint (TypeScript) or markdownlint (Markdown) fixes what it can. Errors they cannot fix are sent
back to Claude.
`.claude/hooks/suppressions.sh` asks for permission before an edit adds a lint, type, format or
coverage suppression comment.

## CI

Set these repository variables before the workflows run:

- `NODE_VERSION`: the Node.js version for `actions/setup-node`, for example `24`.
- `CODE_SCANNING`: `true` to upload osv-scanner SARIF results to code scanning.
