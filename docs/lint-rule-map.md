# Lint rule map

Maps every `[prettier]`, `[lint]` and `[tsc]` rule in [google-typescript-style.md](google-typescript-style.md) to the tool and rule that enforces it. `[review]` rules (82) need human judgment and are not listed.

- **Prettier**: `prettier.config.ts`
- **oxlint**: `.oxlintrc.json` (syntax-only rules)
- **ESLint**: `eslint.config.ts` (type-aware rules; rules oxlint already runs are turned off by eslint-plugin-oxlint, then eslint-config-prettier)
- **tsc**: `tsconfig.json`

Status: **enforced** means a tool reports every violation the rule describes; **partial** means a tool catches some violations and review catches the rest; **not enforced** means no rule is available or the maintainers chose not to enforce it.

## Coverage

| Tag      | Rules | Enforced | Partial | Not enforced |
| -------- | ----- | -------- | ------- | ------------ |
| prettier | 17    | 17       | 0       | 0            |
| lint     | 121   | 79       | 18      | 24           |
| tsc      | 8     | 8        | 0       | 0            |
| total    | 146   | 104      | 18      | 24           |

## Decisions

- **Stricter readings of the guide's tensions**: `{}` is banned (TYP-20); `isolatedDeclarations` is on, so exported symbols carry annotations (TYP-03); file names are snake_case (NAM-18); static dispatch on subclasses (CLS-09/CLS-10) is treated as Must not, though no rule exists; `catch (e: unknown)` is left to TypeScript's `useUnknownInCatchVariables` (part of `strict`).
- **Stricter than the text**: `curly: all` drops the one-line `if` exception (CTL-01); `prefer-template` flags any concatenation with a literal (STR-03); `@ts-expect-error` is banned in tests too (TC-02).
- **Maintainer decisions**: 4-space indentation (`tabWidth: 4`); `semi: true` set explicitly; ESLint Stylistic enforces blank-line rules (SFS-02, CLS-06, CLS-15) and `//` multi-line comments (DOC-02); no JSDoc linting and no JSDoc requirement, so comments stay sparse (DOC-*); at most 300 lines of code per file (oxlint `eslint/max-lines`, blank and comment lines skipped); the size limits of mightymodels' `ruff.toml` (`[lint.pylint]`, `[lint.mccabe]`): `max-params` 3 (max-args, max-positional-args), `max-statements` 25, `max-depth` 3 (max-nested-blocks), `complexity` 8 (mccabe) and `typescript/no-magic-numbers` (PLR2004, off in tests and `*.config.ts`) in oxlint, `sonarjs/expression-complexity` 3 (max-bool-expr), `sonarjs/cognitive-complexity` 8 (approximates max-branches) and `no-restricted-syntax` bans on boolean positional parameters (FBT001, FBT002) in ESLint; pylint max-locals, max-returns, max-statements-in-try and max-public-methods have no ESLint or oxlint rule and are not enforced.
- **Left at tool defaults** because the guide does not specify them: line length, trailing commas, bracket spacing and import order.

## Prettier rules

| ID     | Tool     | Rule                                              | Status   | Notes                                                      |
| ------ | -------- | ------------------------------------------------- | -------- | ---------------------------------------------------------- |
| ARR-03 | Prettier | core printer                                      | enforced | prints `...rest` with no space                             |
| CLS-01 | Prettier | core printer                                      | enforced | drops the `;` after a class declaration                    |
| CLS-02 | Prettier | `semi: true`                                      | enforced | keeps the `;` after a statement holding a class expression |
| CLS-03 | Prettier | core printer                                      | enforced | keeps the author's choice, max one blank line              |
| CLS-05 | Prettier | core printer                                      | enforced | removes `;` between methods                                |
| CLS-12 | Prettier | core printer                                      | enforced | prints `new Foo()`                                         |
| FN-15  | Prettier | core printer                                      | enforced | removes blank lines at block start and end                 |
| FN-17  | Prettier | core printer                                      | enforced | prints `function*` and `yield*`                            |
| FN-18  | Prettier | `arrowParens: "always"` (default)                 | enforced | always parenthesizes, which the guide recommends           |
| FN-19  | Prettier | core printer                                      | enforced | no space after `...`                                       |
| STR-01 | Prettier | `singleQuote: true`                               | enforced | double quotes only to avoid escaping                       |
| STR-04 | Prettier | core printer                                      | enforced | leaves template literal content alone                      |
| NUM-01 | Prettier | core printer                                      | enforced | lowercases `0x`, `0o`, `0b` prefixes                       |
| CTL-02 | Prettier | core printer                                      | enforced | first statement on its own line                            |
| CTL-08 | Prettier | core printer                                      | enforced | removes redundant parentheses                              |
| DIS-02 | Prettier | `semi: true`                                      | enforced | every statement ends with `;`                              |
| POL-06 | Prettier | prek `format` group, Claude Code PostToolUse hook | enforced | formatting runs on commit and after every Claude edit      |

## Compiler rules

| ID     | Tool | Rule                                                      | Status   | Notes                                         |
| ------ | ---- | --------------------------------------------------------- | -------- | --------------------------------------------- |
| ITY-02 | tsc  | `isolatedModules`                                         | enforced |                                               |
| CLS-20 | tsc  | `useDefineForClassFields` (TS2729)                        | enforced |                                               |
| NUM-02 | tsc  | strict-mode ES modules (legacy octal literals are errors) | enforced |                                               |
| SW-02  | tsc  | `noFallthroughCasesInSwitch`                              | enforced |                                               |
| DIS-05 | tsc  | strict-mode ES modules (`with` is an error)               | enforced |                                               |
| TYP-03 | tsc  | `isolatedDeclarations`                                    | enforced | stricter reading of the TYP-03/TYP-06 tension |
| TC-01  | tsc  | `tsc --noEmit` (prek `lint` group, `make typecheck`, CI)  | enforced |                                               |
| POL-07 | tsc  | single `tsconfig.json`                                    | enforced |                                               |

## Lint rules

| ID      | Tool             | Rule                                                                                                    | Status       | Notes                                                                                   |
| ------- | ---------------- | ------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------- |
| SFB-01  | —                | no rule available                                                                                       | not enforced | no linter checks file encoding                                                          |
| SFB-02  | oxlint, ESLint   | `eslint/no-irregular-whitespace` (strings, templates, regexes and comments too), `@stylistic/no-tabs`   | enforced     |                                                                                         |
| SFB-03  | —                | no rule available                                                                                       | not enforced |                                                                                         |
| SFB-04  | tsc              | strict-mode ES modules (octal escapes are errors)                                                       | enforced     |                                                                                         |
| SFS-01  | oxlint           | `import/first`                                                                                          | partial      | partial: checks imports before code, not copyright/`@fileoverview` order                |
| SFS-02  | ESLint, Prettier | `@stylistic/padding-line-between-statements` (import → code)                                            | partial      | Prettier collapses runs of blank lines to one                                           |
| SFS-04  | —                | no rule available                                                                                       | not enforced |                                                                                         |
| IMP-01  | oxlint           | `import/no-default-export` (indirect)                                                                   | partial      | partial: our modules have no default export to import; side-effect imports unchecked    |
| IMP-03  | —                | no rule available                                                                                       | not enforced | no root-based path alias is configured                                                  |
| IMP-04  | —                | no rule available                                                                                       | not enforced | the guide sets no limit                                                                 |
| EXP-01  | oxlint           | `import/no-default-export`                                                                              | enforced     | `*.config.ts` exempt: Prettier and ESLint require a default export                      |
| EXP-02  | oxlint           | `import/no-default-export`                                                                              | enforced     | `*.config.ts` exempt: Prettier and ESLint require a default export                      |
| EXP-04  | oxlint           | `import/no-mutable-exports`                                                                             | enforced     |                                                                                         |
| EXP-06  | ESLint           | `@typescript-eslint/no-extraneous-class` (strict)                                                       | enforced     |                                                                                         |
| ITY-01  | —                | not enforced                                                                                            | not enforced | "May": optional style                                                                   |
| ITY-03  | ESLint           | `no-restricted-syntax` `TSImportType`                                                                   | enforced     |                                                                                         |
| MOD-01  | ESLint           | `@typescript-eslint/no-namespace` (recommended)                                                         | enforced     |                                                                                         |
| MOD-02  | ESLint           | `@typescript-eslint/no-require-imports` (recommended)                                                   | enforced     |                                                                                         |
| MOD-03  | oxlint           | `typescript/triple-slash-reference` (correctness)                                                       | enforced     |                                                                                         |
| VAR-01  | oxlint           | `eslint/prefer-const`                                                                                   | enforced     |                                                                                         |
| VAR-02  | oxlint           | `eslint/no-var`                                                                                         | enforced     |                                                                                         |
| VAR-03  | ESLint           | `@typescript-eslint/no-use-before-define`                                                               | enforced     | variables and classes; hoisted function declarations allowed                            |
| VAR-04  | oxlint           | `eslint/one-var` never                                                                                  | enforced     |                                                                                         |
| ARR-01  | ESLint, oxlint   | `no-restricted-syntax` (`Array(...)`, `new Array(...)`), `eslint/no-array-constructor`                  | enforced     |                                                                                         |
| ARR-04  | oxlint           | `eslint/no-unused-vars`                                                                                 | enforced     | unused destructured elements are reported                                               |
| ARR-05  | ESLint           | `no-restricted-syntax`                                                                                  | enforced     |                                                                                         |
| OBJ-01  | oxlint           | `eslint/no-object-constructor`                                                                          | enforced     |                                                                                         |
| OBJ-02  | oxlint           | `eslint/guard-for-in`                                                                                   | enforced     |                                                                                         |
| OBJ-03  | ESLint           | `@typescript-eslint/no-misused-spread` (strict-type-checked)                                            | enforced     |                                                                                         |
| OBJ-04  | —                | no rule available                                                                                       | not enforced |                                                                                         |
| OBJ-06  | ESLint           | `no-restricted-syntax`                                                                                  | enforced     |                                                                                         |
| OBJ-07  | ESLint           | `no-restricted-syntax`                                                                                  | enforced     |                                                                                         |
| CLS-06  | ESLint           | `@stylistic/lines-between-class-members`                                                                | enforced     | blank line around every method                                                          |
| CLS-10  | —                | no rule available                                                                                       | not enforced |                                                                                         |
| CLS-11  | —                | no rule available                                                                                       | not enforced |                                                                                         |
| CLS-13  | oxlint           | `eslint/no-useless-constructor`                                                                         | enforced     |                                                                                         |
| CLS-15  | ESLint           | `@stylistic/lines-between-class-members`                                                                | enforced     | the constructor counts as a method                                                      |
| CLS-16  | ESLint           | `no-restricted-syntax` `PrivateIdentifier`                                                              | enforced     |                                                                                         |
| CLS-17  | ESLint           | `@typescript-eslint/prefer-readonly`                                                                    | partial      | partial: private members only                                                           |
| CLS-18  | ESLint           | `@typescript-eslint/parameter-properties` prefer parameter-property                                     | enforced     |                                                                                         |
| CLS-23  | ESLint           | `@typescript-eslint/dot-notation` (stylistic-type-checked)                                              | enforced     |                                                                                         |
| CLS-25  | —                | no rule available                                                                                       | not enforced |                                                                                         |
| CLS-27  | ESLint           | `no-restricted-syntax`                                                                                  | enforced     |                                                                                         |
| CLS-28  | ESLint           | `no-restricted-syntax`                                                                                  | enforced     |                                                                                         |
| CLS-31  | ESLint           | `@typescript-eslint/explicit-member-accessibility` no-public                                            | enforced     |                                                                                         |
| CLS-32  | oxlint           | `eslint/no-extend-native`, `eslint/no-proto`                                                            | partial      | partial: mixins and `Object.setPrototypeOf` unchecked                                   |
| FN-01   | oxlint           | `eslint/func-style` declaration, arrows allowed                                                         | enforced     |                                                                                         |
| FN-03   | oxlint           | `eslint/prefer-arrow-callback`, `eslint/func-style`                                                     | partial      | partial: callbacks and assigned function expressions                                    |
| FN-04   | ESLint           | `@typescript-eslint/no-confusing-void-expression` (strict-type-checked)                                 | partial      | partial: void-typed concise bodies only                                                 |
| FN-05   | ESLint, tsc      | `@typescript-eslint/no-invalid-this`, `noImplicitThis` (strict)                                         | enforced     |                                                                                         |
| FN-06   | oxlint           | `eslint/prefer-arrow-callback`, `typescript/no-this-alias`                                              | enforced     |                                                                                         |
| FN-07   | oxlint           | `unicorn/no-array-callback-reference`                                                                   | partial      | partial: array methods only                                                             |
| FN-10   | —                | no rule available                                                                                       | not enforced |                                                                                         |
| FN-13   | oxlint, tsc      | `eslint/prefer-rest-params`; a binding named `arguments` is a strict-mode error                         | enforced     |                                                                                         |
| FN-14   | oxlint           | `eslint/prefer-spread`                                                                                  | enforced     |                                                                                         |
| THIS-01 | ESLint           | `@typescript-eslint/no-invalid-this`                                                                    | enforced     |                                                                                         |
| THIS-02 | ESLint           | `@typescript-eslint/no-invalid-this`                                                                    | partial      | partial: event-target and needless call/apply uses unchecked                            |
| STR-02  | oxlint           | `eslint/no-multi-str`                                                                                   | partial      | partial: template-literal continuations unchecked                                       |
| STR-03  | oxlint           | `eslint/prefer-template`                                                                                | enforced     | stricter: flags any concatenation with a literal                                        |
| COE-02  | —                | no rule available                                                                                       | not enforced | no rule distinguishes enum truthiness                                                   |
| COE-03  | oxlint           | `eslint/no-implicit-coercion` (string)                                                                  | enforced     |                                                                                         |
| COE-05  | oxlint, ESLint   | `eslint/no-implicit-coercion` (number), `no-restricted-globals` / `no-restricted-properties` parseFloat | enforced     |                                                                                         |
| COE-06  | ESLint           | `no-restricted-syntax` (parseInt without radix or with radix 10)                                        | partial      | partial: digit validation and NaN check are review                                      |
| COE-07  | oxlint           | `eslint/no-extra-boolean-cast` (correctness)                                                            | enforced     |                                                                                         |
| CTL-01  | oxlint           | `eslint/curly` all                                                                                      | enforced     | stricter: also requires braces on one-line ifs                                          |
| CTL-03  | oxlint           | `eslint/no-cond-assign` except-parens (correctness)                                                     | enforced     |                                                                                         |
| CTL-04  | ESLint           | `@typescript-eslint/prefer-for-of` (stylistic)                                                          | enforced     |                                                                                         |
| CTL-05  | ESLint           | `@typescript-eslint/no-for-in-array` (recommended-type-checked)                                         | enforced     |                                                                                         |
| CTL-06  | oxlint           | `eslint/guard-for-in`                                                                                   | partial      | partial: for-of over Object.keys is not preferred by any rule                           |
| EXC-02  | oxlint           | `unicorn/throw-new-error`                                                                               | enforced     |                                                                                         |
| EXC-03  | ESLint           | `@typescript-eslint/only-throw-error`, `@typescript-eslint/prefer-promise-reject-errors`                | partial      | partial: abort reasons unchecked                                                        |
| EXC-06  | oxlint           | `eslint/no-empty`                                                                                       | enforced     |                                                                                         |
| EXC-08  | —                | no rule available                                                                                       | not enforced |                                                                                         |
| SW-01   | oxlint           | `eslint/default-case`, `eslint/default-case-last`                                                       | enforced     |                                                                                         |
| EQ-01   | oxlint           | `eslint/eqeqeq` always, null ignored                                                                    | enforced     |                                                                                         |
| AST-03  | ESLint           | `@typescript-eslint/consistent-type-assertions` as                                                      | enforced     |                                                                                         |
| AST-04  | ESLint           | `no-restricted-syntax`                                                                                  | enforced     |                                                                                         |
| AST-05  | ESLint           | `@typescript-eslint/consistent-type-assertions` objectLiteralTypeAssertions never                       | enforced     |                                                                                         |
| DEC-02  | —                | no rule available                                                                                       | not enforced |                                                                                         |
| DIS-01  | oxlint           | `eslint/no-new-wrappers`                                                                                | enforced     |                                                                                         |
| DIS-03  | ESLint           | `no-restricted-syntax` `TSEnumDeclaration[const=true]`                                                  | enforced     |                                                                                         |
| DIS-04  | oxlint           | `eslint/no-debugger` (correctness)                                                                      | enforced     |                                                                                         |
| DIS-06  | oxlint, ESLint   | `eslint/no-eval` (correctness), `eslint/no-new-func`, `@typescript-eslint/no-implied-eval`              | enforced     |                                                                                         |
| DIS-08  | oxlint           | `eslint/no-extend-native`                                                                               | partial      | partial: dependencies that modify built-ins unchecked                                   |
| NAM-01  | oxlint           | `eslint/id-match` `^[A-Za-z0-9_$]*$`                                                                    | enforced     |                                                                                         |
| NAM-03  | ESLint           | `@typescript-eslint/naming-convention` leadingUnderscore forbid                                         | enforced     |                                                                                         |
| NAM-04  | ESLint           | `@typescript-eslint/naming-convention` strictCamelCase                                                  | enforced     | `opt_x` fails the format                                                                |
| NAM-05  | ESLint           | `@typescript-eslint/naming-convention` custom regex                                                     | enforced     |                                                                                         |
| NAM-08  | ESLint           | `@typescript-eslint/naming-convention` strictCamelCase / StrictPascalCase                               | enforced     |                                                                                         |
| NAM-09  | —                | no rule available                                                                                       | not enforced | naming-convention formats accept `$`; NAM-01 allows it rarely                           |
| NAM-10  | ESLint           | `@typescript-eslint/naming-convention` typeLike StrictPascalCase                                        | enforced     |                                                                                         |
| NAM-11  | ESLint           | `@typescript-eslint/naming-convention` default strictCamelCase                                          | enforced     |                                                                                         |
| NAM-12  | ESLint           | `@typescript-eslint/naming-convention` enumMember UPPER_CASE                                            | partial      | partial: module-level constants may be either case                                      |
| NAM-13  | ESLint           | `@typescript-eslint/naming-convention` typeLike StrictPascalCase                                        | enforced     | `T` passes                                                                              |
| NAM-15  | ESLint, oxlint   | naming-convention unused leadingUnderscore allow, `eslint/no-unused-vars` after-used                    | enforced     |                                                                                         |
| NAM-16  | oxlint           | `eslint/no-unused-vars` argsIgnorePattern `^$`                                                          | enforced     |                                                                                         |
| NAM-17  | ESLint           | `@typescript-eslint/naming-convention` trailingUnderscore forbid                                        | enforced     |                                                                                         |
| NAM-18  | oxlint, ESLint   | `unicorn/filename-case` snakeCase, naming-convention strictCamelCase                                    | enforced     | stricter reading of the file-name gap                                                   |
| NAM-20  | ESLint           | `@typescript-eslint/naming-convention`                                                                  | enforced     | UPPER_CASE only for global consts and static readonly fields                            |
| TYP-02  | ESLint           | `@typescript-eslint/no-inferrable-types` (stylistic)                                                    | enforced     |                                                                                         |
| TYP-04  | —                | no rule available                                                                                       | not enforced | `consistent-generic-constructors` is off: the guide's own good examples use both styles |
| TYP-08  | ESLint           | `no-restricted-syntax`                                                                                  | enforced     |                                                                                         |
| TYP-12  | ESLint           | `@typescript-eslint/consistent-type-definitions` interface (stylistic)                                  | enforced     |                                                                                         |
| TYP-13  | ESLint           | `@typescript-eslint/array-type` array-simple                                                            | enforced     |                                                                                         |
| TYP-17  | ESLint           | `@typescript-eslint/no-explicit-any` (recommended)                                                      | enforced     |                                                                                         |
| TYP-18  | ESLint           | `@typescript-eslint/no-unsafe-*` (recommended-type-checked)                                             | partial      | partial                                                                                 |
| TYP-20  | ESLint           | `@typescript-eslint/no-empty-object-type` (recommended)                                                 | enforced     | stricter reading of the `{}` tension                                                    |
| TYP-22  | oxlint           | `typescript/no-wrapper-object-types` (correctness)                                                      | enforced     |                                                                                         |
| TYP-23  | oxlint           | `eslint/no-new-wrappers`                                                                                | enforced     |                                                                                         |
| TYP-24  | ESLint           | `@typescript-eslint/no-unnecessary-type-parameters` (strict-type-checked)                               | partial      | partial                                                                                 |
| TC-02   | ESLint           | `@typescript-eslint/ban-ts-comment` (all directives banned)                                             | enforced     | stricter: no `@ts-expect-error` in tests either                                         |
| DOC-02  | ESLint           | `@stylistic/multiline-comment-style` separate-lines                                                     | enforced     |                                                                                         |
| DOC-04  | —                | not enforced                                                                                            | not enforced | maintainer decision: no JSDoc linting                                                   |
| DOC-05  | —                | not enforced                                                                                            | not enforced | maintainer decision: no JSDoc linting                                                   |
| DOC-07  | —                | not enforced                                                                                            | not enforced | maintainer decision: no JSDoc linting                                                   |
| DOC-08  | —                | not enforced                                                                                            | not enforced | maintainer decision: no JSDoc linting                                                   |
| DOC-09  | —                | not enforced                                                                                            | not enforced | maintainer decision: no JSDoc linting                                                   |
| DOC-10  | —                | not enforced                                                                                            | not enforced | maintainer decision: JSDoc is not required; comments stay sparse                        |
| DOC-16  | —                | not enforced                                                                                            | not enforced | maintainer decision: no JSDoc linting                                                   |
| DOC-18  | —                | not enforced                                                                                            | not enforced | maintainer decision: no JSDoc linting                                                   |
| POL-08  | tsc              | unresolved imports fail typechecking                                                                    | partial      | partial: transitive dependencies are not caught                                         |
