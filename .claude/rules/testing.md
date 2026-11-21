---
paths:
  - '**/*.test.ts'
  - 'tests/**/*.ts'
---

<scope>
Governs Vitest test files and test support code when Claude reads, writes or edits them: unit tests beside the code as `src/**/*.test.ts` and everything under `tests/`. The TypeScript conventions in `.claude/rules/typescript.md` also apply to these files; this file adds what is specific to tests. `vitest.config.ts` defines the tiers, the shuffled order and the coverage thresholds.
</scope>

<conventions>
1. Must test behavior through a module's exported API, never private members or internal calls, because a test that breaks when the implementation changes but the behavior does not is noise.
2. Must place each test by tier: a unit test sits beside its module (`src/parser.ts` is tested by `src/parser.test.ts`) and uses only fakes and in-memory values; a test that starts a child process, touches the filesystem or runs the built bundle goes in `tests/integration/` and runs `dist/` through `process.execPath`, because `vitest.config.ts` only collects those two locations and a test anywhere else never runs.
3. Must keep arrangement in `beforeEach`, `test.extend` fixtures or helper functions so each test body reads as one scenario and one expectation, and must name a helper for the outcome it proves, because the reader should see what is being tested before how it is set up.
4. Must pass fakes into the code under test through its parameters instead of replacing modules with `vi.mock`, and use `vi.spyOn` only for process state the code reads directly, because injected fakes keep the dependency visible in the code under test.
5. Must create every piece of mutable state inside the test or a per-test fixture, because Vitest runs tests in a shuffled order and shared state makes results depend on that order.
6. Must write table-driven cases as `it.each` over objects with named fields and a `$name` title, because positional arrays hide what each value means.
7. Must name the unit in `describe` and state the expected behavior in `it`, in the present tense ("rejects a manifest without a name"), because the test list then reads as a specification.
8. Must assert a whole value with one `toEqual` instead of several single-field assertions, because one comparison shows every difference at once.
9. Must write fakes as typed classes or objects that implement the real interface, because a fake that compiles against the interface breaks when the interface changes.
10. Avoid tests that only restate what the type checker or linter guarantees, such as the type of a return value, because they cost upkeep and catch nothing.
</conventions>

<examples>
Convention 3, arrangement in fixtures.

Before:

```ts
it('rejects an expired token', () => {
  const clock = new FakeClock(new Date('2026-01-02'));
  const store = new MemoryTokenStore([token({ expiresAt: '2026-01-01' })]);
  const verifier = new TokenVerifier(store, clock);
  expect(verifier.verify('abc')).toEqual({ kind: 'expired' });
});
```

After:

```ts
it('rejects an expired token', () => {
  const verifier = createVerifierWithExpiredToken();

  expect(verifier.verify(EXPIRED_TOKEN_ID)).toEqual({ kind: 'expired' });
});
```

Convention 4, injected fakes.

Before:

```ts
vi.mock('node:fs');
```

After:

```ts
const files = new MemoryFiles({ 'plugin.json': validManifest });
expect(loadManifest(files, 'plugin.json')).toEqual({
  kind: 'loaded',
  manifest: validManifest,
});
```

Convention 6, named table cases.

Before:

```ts
it.each([
  ['', 0],
  ['a b', 2],
])('%s', (input, expected) => {
  /* ... */
});
```

After:

```ts
it.each([
  { name: 'empty input', input: '', expected: 0 },
  { name: 'two words', input: 'a b', expected: 2 },
])('counts words in $name', ({ input, expected }) => {
  expect(countWords(input)).toBe(expected);
});
```

</examples>

<anti_patterns>

- A test that reads a private field through bracket access or asserts how many times an internal helper was called; assert on the returned or observable result.
- A module-level variable that several tests mutate; build it per test.
- A partial mock cast with `as unknown as` to the real type; write a fake that implements the interface.
- A unit test that spawns a process or writes to disk; move it to `tests/integration/`.
- When an existing test already breaks a convention, apply the conventions to the tests being written or changed, and name the others in the reply without rewriting them.

</anti_patterns>

<verification>
Before finishing a change to a test, run `make test` and, for integration tests, `make build test.integration`; then check that the new test fails when the behavior it names is broken, by reverting or altering that behavior once. A reviewer can confirm with `rg -n "vi\.mock|as unknown as|\['[a-z]" -g '*.test.ts'` returning no new hits, and by reading the `it` titles as a list of behaviors.
</verification>
