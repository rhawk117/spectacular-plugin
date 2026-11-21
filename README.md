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

| Target           | What it does                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `make help`      | List the targets                                                                              |
| `make sync`      | Install dependencies exactly as locked in `bun.lock`                                          |
| `make format`    | Run the prek format hooks (oxlint, ESLint and Prettier fixes, shfmt)                          |
| `make lint`      | Run the prek lint hooks (Prettier check, oxlint, ESLint, tsc, shellcheck, actionlint, zizmor) |
| `make typecheck` | Run `tsc --noEmit`                                                                            |
| `make test`      | Run the Vitest suite                                                                          |
| `make quality`   | Run every prek hook, then the tests, as CI does                                               |
| `make check`     | Run lint, then test                                                                           |

Lint rules follow the Google TypeScript Style Guide. `docs/google-typescript-style.md` holds the
digest of its rules and `docs/lint-rule-map.md` maps each rule ID to the check that enforces it.

In Claude Code, `.claude/hooks/format.sh` runs after every edit: Prettier formats the file and
ESLint fixes what it can. Errors ESLint cannot fix are sent back to Claude.

## CI

Set these repository variables before the workflows run:

- `NODE_VERSION`: the Node.js version for `actions/setup-node`, for example `24`.
- `CODE_SCANNING`: `true` to upload osv-scanner SARIF results to code scanning.
