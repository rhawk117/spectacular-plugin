---
paths:
  - '**/*.ts'
---

<scope>
Governs every TypeScript file in the repository when Claude reads, writes or edits it: plugin source in `src/`, entrypoints in `src/bin/`, tests, CI scripts and configs. Does not cover `*.config.ts` files, which follow their tool's documented shape (TS-6 and TS-7 do not apply), or `.github/**/*.ts` CI scripts, which are entrypoints themselves and may do I/O directly (TS-7 does not apply). Formatting, naming case, imports and most of the Google TypeScript Style Guide are enforced by Prettier, oxlint, ESLint and tsc (`docs/lint-rule-map.md` lists which); these conventions cover only what they cannot check. `docs/google-typescript-style.md` holds the full guide digest; read the matching section when a question here is not settled.
</scope>

<conventions>
1. Must name things so a new reader understands them without context: no abbreviations, no type information in the name, because the reader of a call site never sees the declaration.
2. Must keep helpers module-local (a plain function, not a private static method) and export only what another module imports, because a small public surface is what makes a module safe to change.
3. Must make illegal states unrepresentable with discriminated unions, narrow literal types and `readonly` values, because a state the type cannot hold needs no runtime check and no test.
4. Must give intermediate results names instead of chaining or nesting expressions, and must split a function that passes about 40 lines into named steps, because each name tells the reader what a step is for.
5. Avoid an interface, class or wrapper that has one implementation and no test that substitutes it, because an abstraction is paid for on every read and earns nothing until it is a guarantee or a test seam.
6. Must keep modules in `src/` free of I/O and process state (filesystem, `process.env`, `process.stdout`, `Date.now()`): read inputs and write outputs in the `src/bin/` entrypoint and pass values in, because pure modules can be tested with plain values.
7. Must use what Node's standard library, an installed package or this codebase already provides before writing a helper, because a hand-rolled copy is one more thing to read and get wrong.
8. Must take an options object once a function has more than two optional parameters, and must return an object rather than a tuple when a function returns several values, because named fields read at the call site.
9. Must initialize class members where they are declared, never add or remove instance properties after the constructor, and keep getters free of side effects, because a class's shape should be readable from its declarations.
10. Must report failures by throwing an `Error` subclass with a specific name and `{ cause }` when wrapping, never by returning an error field or code, and must keep each `try` around only the call that can fail, because callers then cannot ignore a failure and the reader sees which call fails.
11. Avoid `as` assertions: narrow `unknown` with a runtime check, and when an assertion is truly unavoidable add a `::NOTE::` comment saying why it is safe, because an assertion silences the compiler exactly where data enters from outside.
12. Must handle `null` and `undefined` where they first arise and check every numeric coercion for `NaN`, because absence handled far from its source is absence nobody remembers.
13. Must use the simplest type that expresses the value: `Map` or `Set` over index-signature objects, and no mapped or conditional type where a plain interface works, because the reader has to evaluate every type operator in their head.
14. Must match how the surrounding file, then its directory, already does a thing the rules here do not settle, and keep existing names when editing, because two styles for one thing in a file make the reader wonder whether they differ.
15. Must put each runnable entrypoint (hook script, MCP server, CLI) in its own file in `src/bin/` (for example `src/bin/check_manifest.ts`) as a thin shell that parses input, calls modules and writes output, because `make build` bundles exactly `src/bin/*.ts` into `dist/`, which the plugin runs.
</conventions>

<examples>
Convention 3, illegal states.

Before:

```ts
interface LoadResult {
  ok: boolean;
  manifest?: Manifest;
  error?: string;
}
```

After:

```ts
type LoadResult =
  | { readonly kind: 'loaded'; readonly manifest: Manifest }
  | { readonly kind: 'invalid'; readonly reason: string };
```

Convention 4, named steps.

Before:

```ts
return items
  .filter((i) => i.enabled && !i.hidden)
  .map((i) => i.name.trim())
  .sort()
  .join(', ');
```

After:

```ts
const visibleItems = items.filter((item) => item.enabled && !item.hidden);
const names = visibleItems.map((item) => item.name.trim()).sort();
return names.join(', ');
```

Convention 6, pure modules.

Before:

```ts
// src/report.ts
export function writeReport(outputPath: string): void {
  writeFileSync(outputPath, render(readEntries()));
}
```

After:

```ts
// src/report.ts
export function renderReport(entries: readonly Entry[]): string {
  /* ... */
}

// src/bin/report.ts
writeFileSync(outputPath, renderReport(readEntries(inputPath)));
```

Convention 10, errors.

Before:

```ts
function loadManifest(path: string): { error?: string; manifest?: Manifest } {
  /* ... */
}
```

After:

```ts
class ManifestError extends Error {
  override name = 'ManifestError';
}

const text = readFileSync(path, 'utf8');
try {
  return parseManifest(JSON.parse(text));
} catch (cause) {
  throw new ManifestError(`invalid manifest at ${path}`, { cause });
}
```

Convention 11, narrowing instead of asserting.

Before:

```ts
const report = JSON.parse(text) as Report;
```

After:

```ts
const report = parseReport(JSON.parse(text)); // checks the unknown value, throws on a mismatch
```

</examples>

<anti_patterns>

- An object with a boolean flag and optional fields that are only valid for one value of the flag; use a discriminated union instead.
- A long chain of `filter`, `map` and `reduce` with single-letter callback parameters; name the intermediate arrays and the parameters.
- A module function that reads a file, an environment variable or the clock to get its input; take the value as a parameter and read it in the entrypoint.
- Parsed JSON or any other external input cast with `as` to an interface; write a narrowing parser.
- A `try` wrapping a whole function body or a whole loop, or a `catch` that swallows the error; wrap only the failing call and rethrow with `cause`.
- When an existing file already breaks a convention, apply the conventions to the lines being written or changed, and name the other violations in the reply without rewriting them, so the diff stays focused.

</anti_patterns>

<verification>
Before finishing a change to a TypeScript file, run `make lint typecheck test`, then reread the diff and ask of each new function whether a new reader could tell what it does from its name and its named steps, and whether any new `as`, I/O outside `src/bin/` or optional-field bag crept in. A reviewer can confirm with `git diff -U0 -- '*.ts' | rg -n ' as [A-Z{]|process\.(env|stdout)|readFileSync|writeFileSync'` and by checking that each hit sits in `src/bin/` or carries a `::NOTE::`.
</verification>
