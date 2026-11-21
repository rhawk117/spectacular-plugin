# Google TypeScript Style Guide: Condensed Digest

- Source: https://google.github.io/styleguide/tsguide.html
- Fetched: 2026-11-21
- Where this digest and the guide differ, the guide wins.

## How to read this digest

- Rule format: **ID** Level: rule. [tag]
- Levels follow the guide's "Terminology notes" (RFC 2119): "prefer" maps to Should, "avoid" maps to Should not, and imperative or declarative statements ("Do not use X", "X is used") map to Must / Must not. Where the guide uses a weaker or unusual phrase ("consider", "recommended", "discouraged", "it is unnecessary"), the phrase is quoted next to the level.
- Tags:
  - [prettier]: layout a code formatter controls.
  - [lint]: a static linter (with or without type information) could plausibly check it.
  - [tsc]: the TypeScript compiler reports it, given suitable compiler options.
  - [review]: needs human judgment.
- The guide states its examples are non-normative: "Optional formatting choices made in examples must not be enforced as rules."
- The guide is the external version of Google's internal guide. Some rules name Google-internal tooling (tsetse, tsec, Apps JSPB, Closure's `@nocollapse`); they are kept because the guide states them.

## 1. Introduction

- **INT-01** Must not: enforce optional formatting choices that only appear in the guide's examples. [review]
- **INT-02** May: use language features the guide does not discuss, with no recommendation on their use. [review]

## 2. Source file basics

- **SFB-01** Must: source files are encoded in UTF-8. [lint]
- **SFB-02** Must: apart from the line terminator, ASCII space (0x20) is the only whitespace character in a source file; other whitespace inside string literals is escaped. [lint]
- **SFB-03** Must: characters with a special escape (`\'` `\"` `\\` `\b` `\f` `\n` `\r` `\t` `\v`) use it, not a numeric escape (`\x0a`, `\u000a`, `\u{a}`). [lint]
- **SFB-04** Must not: legacy octal escapes are never used. [lint]
- **SFB-05** Must: other non-ASCII characters are written as the actual Unicode character (e.g. `'μs'`); May use hex/Unicode escapes for non-printable characters, with an explanatory comment. [review]

## 3. Source file structure

- **SFS-01** Must: file order is copyright (if present), file-level JSDoc such as `@fileoverview` (if present), imports (if present), implementation. [lint]
- **SFS-02** Must: exactly one blank line separates each section that is present. [lint]
- **SFS-03** Must: license or copyright information, when needed, goes in a JSDoc at the top of the file. [review]
- **SFS-04** May: a top-level `@fileoverview` JSDoc; its wrapped lines are not indented. [lint]

### 3.1 Imports

- **IMP-01** Must: use module (`import * as foo from '...'`) and named (`import {Foo} from '...'`) imports for TypeScript code; default imports "only for other external code that requires them"; side-effect imports (`import '...'`) only for libraries' load-time side effects. [lint]
- **IMP-02** Must: TypeScript code uses paths to import other TypeScript code; paths may be relative (`.` / `..`) or rooted at the base directory. [review]
- **IMP-03** Should: use relative imports (`./foo`) rather than root-based paths for files in the same logical project. [lint]
- **IMP-04** Should ("consider"): limit the number of parent steps (`../../../`). [lint]
- **IMP-05** Should: prefer named imports for symbols used often in a file or with clear names (e.g. `describe`, `it`). [review]
- **IMP-06** Should: prefer namespace imports when using many different symbols from a large API. [review]
- **IMP-07** Must: Apps JSPB protos use named imports, even when the import line gets long. [review]
- **IMP-08** Should: fix name collisions with a namespace import or by renaming the exports; May rename imports with `as` when needed. [review]

### 3.2 Exports

- **EXP-01** Must: use named exports in all code. [lint]
- **EXP-02** Must not: default exports. [lint]
- **EXP-03** Must: only export symbols used outside the module; minimize the exported API surface. [review]
- **EXP-04** Must not: mutable exports ("`export let` is not allowed"); expose mutable bindings through explicit getter functions. [lint]
- **EXP-05** Must: all exports are final after the module body has executed; for conditional exports, compute first, then export a `const`. [review]
- **EXP-06** Must not: container classes with static methods or properties used for namespacing; export individual constants and functions. [lint]

### 3.3 Import and export type

- **ITY-01** May: `import type {...}` (or inline `import {type Foo, Bar}`) when a symbol is used only as a type; use regular imports for values. [lint]
- **ITY-02** Must: use `export type` when re-exporting a type (the guide cites `isolatedModules`). [tsc]
- **ITY-03** Must not: `import()` inside type annotations; use `import type` to guarantee elision. [lint]
- **ITY-04** Must: use `import '...';` to force a runtime load for side effects. [review]

### 3.4 Use modules not namespaces

- **MOD-01** Must not: `namespace Foo { ... }` (or legacy `module Foo { ... }`); namespaces may only be used when required to interface with external third-party code. [lint]
- **MOD-02** Must not: `import x = require('...');`; use ES6 module syntax. [lint]
- **MOD-03** Must not: `/// <reference path="..."/>` (shown as Bad). [lint]

## 4. Language features

### 4.1 Local variable declarations

- **VAR-01** Must: declare with `const` or `let`; `const` by default unless the variable is reassigned. [lint]
- **VAR-02** Must not: `var`. [lint]
- **VAR-03** Must not: use a variable before its declaration. [lint]
- **VAR-04** Must: one variable per declaration (no `let a = 1, b = 2;`). [lint]

### 4.2 Array literals

- **ARR-01** Must not: the `Array()` constructor, with or without `new`; use bracket literals or `Array.from`. [lint]
- **ARR-02** Must not: define or use non-numeric properties on arrays (other than `length`); use a `Map` or object. [review]
- **ARR-03** May: array destructuring, with a final rest element that has no space after `...`. [prettier]
- **ARR-04** Should: omit unused elements in array destructuring (`let [, b,, d] = someArray;`). [lint]
- **ARR-05** Must: an optional destructured array parameter defaults to `[]`, with element defaults on the left-hand side. [lint]
- **ARR-06** Should ("prefer"): object destructuring over array destructuring for multiple parameters or return values. [review]

ARR-05:

```ts
// Bad
function badDestructuring([a, b] = [4, 2]) { … }
// Good
function destructured([a = 4, b = 2] = []) { … }
```

### 4.3 Object literals

- **OBJ-01** Must not: the `Object` constructor; use an object literal. [lint]
- **OBJ-02** Must not: unfiltered `for (... in ...)`; filter with an `if` (e.g. `hasOwnProperty`) or use `for (... of Object.keys(...))` / `Object.entries(...)`. [lint]
- **OBJ-03** Should not ("avoid"): spreading values whose prototype is not `Object.prototype` (class instances, functions; the guide's example spreads an array). [lint]
- **OBJ-04** Must not: mix computed property names with unquoted keys; computed names count as dict-style (quoted) keys unless the key is a symbol (e.g. `[Symbol.iterator]`). [lint]
- **OBJ-05** Should: destructured parameters stay a single level of unquoted shorthand properties. [review]
- **OBJ-06** Must not ("may not be used"): deeper nesting or computed properties in parameter destructuring. [lint]
- **OBJ-07** Must: default values go on the left-hand side of a destructured parameter; an optional destructured object defaults to `{}`. [lint]

OBJ-06 / OBJ-07:

```ts
// Bad
function nestedTooDeeply({x: {num, str}}: {x: Options}) {}
function nontrivialDefault({num, str}: Options = {num: 42, str: 'default'}) {}
// Good
function destructured({num, str = 'default'}: Options = {}) {}
```

### 4.4 Classes

- **CLS-01** Must not: terminate class declarations with a semicolon. [prettier]
- **CLS-02** Must: terminate statements that contain a class expression with a semicolon. [prettier]
- **CLS-03** May: blank lines between class braces and content ("neither encouraged nor discouraged"). [prettier]
- **CLS-04** Should: member variables and class state used only during construction become constructor-local variables. [review]
- **CLS-05** Must not: semicolons between method declarations. [prettier]
- **CLS-06** Should: separate method declarations from surrounding code by a single blank line. [lint]
- **CLS-07** Must: an overridden `toString` always succeeds and has no visible side effects. [review]
- **CLS-08** Should ("prefer"): module-local functions over private static methods, where readability allows. [review]
- **CLS-09** Should not: rely on dynamic dispatch of static methods; call them only on the class that defines them (a dynamically called static method must be `@nocollapse`). [review]
- **CLS-10** Must not: call a static method directly on a subclass that does not define it. [lint]
- **CLS-11** Must not: use `this` in a static context. [lint]
- **CLS-12** Must: constructor calls use parentheses even with no arguments (`new Foo()`, not `new Foo`). [prettier]
- **CLS-13** Should not ("it is unnecessary"): empty constructors, or constructors that only delegate to `super`. [lint]
- **CLS-14** Should not: omit a constructor that has parameter properties, visibility modifiers or parameter decorators, even if its body is empty. [review]
- **CLS-15** Should: separate the constructor from surrounding code by a single blank line above and below. [lint]
- **CLS-16** Must not: `#private` fields (private identifiers); use TypeScript `private`. [lint]
- **CLS-17** Must: mark properties never reassigned outside the constructor `readonly` (need not be deeply immutable). [lint]
- **CLS-18** Must: use a parameter property instead of plumbing an obvious initializer into a member; document it with `@param`. [lint]
- **CLS-19** Must: initialize a member where it is declared when it does not depend on a constructor parameter or parameter property. [review]
- **CLS-20** Should ("should be avoided"): referencing a parameter property from a field initializer (the guide says this "will become a TypeScript compiler error"). [tsc]
- **CLS-21** Should (tip): never add or remove instance properties after the constructor finishes; initialize later-filled optional fields to `undefined`. [review]
- **CLS-22** Must not: `private` on properties used outside the class's lexical scope (exception: Angular properties used only from a template); use `protected` or `public`. [review]
- **CLS-23** Must not: use `obj['foo']` to bypass property visibility. [lint]
- **CLS-24** Must: getters are pure; they do not change observable state. [review]
- **CLS-25** Must: at least one accessor of a pair is non-trivial; no pass-through accessors only to hide a property (make it public or `readonly` instead). [lint]
- **CLS-26** May: a property hidden behind an accessor is prefixed or suffixed with a whole word such as `internal` or `wrapped`. [review]
- **CLS-27** Must not: define getters or setters with `Object.defineProperty`. [lint]
- **CLS-28** Must not: computed or quoted (dict-style) property keys in classes, except symbols. [lint]
- **CLS-29** Should: logically iterable classes define `[Symbol.iterator]`; otherwise use `Symbol` sparingly. [review]
- **CLS-30** Must: limit symbol visibility as much as possible ("consider" moving private methods to non-exported functions). [review]
- **CLS-31** Must not: the `public` modifier, except on non-readonly public parameter properties. [lint]
- **CLS-32** Must not: manipulate prototypes directly; mixins and modifying built-in prototypes are forbidden (framework code exempt). [lint]

CLS-01 / CLS-02 (the converted source lost the good/bad labels here; labels follow the guide's prose):

```ts
// Bad: semicolon after a class declaration
class Foo {
};
// Good: semicolon after a statement that contains a class expression
export const Baz = class extends Bar {
  method(): number {
    return this.x;
  }
};
```

CLS-31:

```ts
// Bad
class Foo {
  public bar = new Bar();
  constructor(public readonly baz: Baz) {}
}
// Good
class Foo {
  bar = new Bar();
  constructor(public baz: Baz) {}
}
```

### 4.5 Functions

- **FN-01** Should ("prefer"): function declarations over arrow functions or function expressions for named functions; arrow functions May be used, e.g. when an explicit type annotation is required. [lint]
- **FN-02** May: nested functions use declarations or arrows; in method bodies arrows are preferred (Should) for access to the outer `this`. [review]
- **FN-03** Must not: function expressions; use arrow functions (exceptions: code that must dynamically rebind `this`, which is discouraged, and generators). [lint]
- **FN-04** Must: use an arrow concise (expression) body only when the return value is used; otherwise use a block body or `void`. [lint]
- **FN-05** Must not: `this` in function expressions or declarations, unless they exist to rebind `this`. [lint]
- **FN-06** Should ("prefer"): arrow functions over `f.bind(this)`, `goog.bind(f, this)` or `const self = this`. [lint]
- **FN-07** Should not ("avoid"): passing a named callback to a higher-order function unless both call signatures are stable; pass an arrow that forwards arguments. [lint]
- **FN-08** Should not ("usually should not"): class properties initialized to arrow functions; call instance methods through an arrow and do not pass references to instance methods (use judgement; see FN-09). [review]
- **FN-09** May: event handlers that never need uninstalling are arrows; handlers that must be uninstalled are arrow-function properties. [review]
- **FN-10** Must not: `bind` in the expression that installs an event handler. [lint]
- **FN-11** Must: parameter initializers have no observable side effects; Should be as simple as possible. [review]
- **FN-12** Should: use default parameters sparingly; prefer destructuring when there are more than a few optional parameters without natural order. [review]
- **FN-13** Must: use a rest parameter instead of `arguments`; never name a local variable or parameter `arguments`. [lint]
- **FN-14** Must: use spread syntax instead of `Function.prototype.apply`. [lint]
- **FN-15** Must not: blank lines at the start or end of a function body. [prettier]
- **FN-16** May: a single blank line inside a function body, sparingly, for logical grouping. [review]
- **FN-17** Must: attach `*` to `function` and `yield` (`function* foo()`, `yield* iter`). [prettier]
- **FN-18** May ("recommended but not required"): parentheses around a single arrow-function parameter. [prettier]
- **FN-19** Must not: a space after `...` in rest or spread syntax. [prettier]
- **FN-20** Should: write small, focused functions; past about 40 lines, consider splitting (no hard limit). [review]

FN-04:

```ts
// Bad: return value is unused
myPromise.then((v) => console.log(v));
// Good
myPromise.then((v) => {
  console.log(v);
});
myPromise.then((v) => void console.log(v));
```

### 4.6 this

- **THIS-01** Must: use `this` only in class constructors and methods, functions with an explicit `this` type, or arrows defined where `this` may be used. [lint]
- **THIS-02** Must not: use `this` for the global object, an `eval` context, an event target, or needlessly `call()`ed / `apply()`ed functions. [lint]

### 4.7 Primitive literals

- **STR-01** Must: ordinary string literals use single quotes; May use double quotes when the string contains a single quote. [prettier]
- **STR-02** Must not: line continuations (backslash at end of line) in ordinary or template string literals. [lint]
- **STR-03** Must: template literals over complex string concatenation, particularly with multiple literals. [lint]
- **STR-04** May: a multi-line template literal does not follow the enclosing block's indentation. [prettier]
- **NUM-01** Must: hex, octal and binary use exactly `0x`, `0o`, `0b` "with lowercase letters". [prettier]
- **NUM-02** Must not: a leading zero unless immediately followed by `x`, `o` or `b`. [tsc]
- **COE-01** May: coerce with `String()` and `Boolean()` (no `new`), template literals, or `!!`. [review]
- **COE-02** Must not: convert enum values (including unions with enums) to booleans with `Boolean()`, `!!` or implicit coercion; compare with explicit operators. [lint]
- **COE-03** Should not ("discouraged"): string concatenation to cast to string. [lint]
- **COE-04** Must: check the output of any numeric coercion and handle non-throwing failures such as `NaN`. [review]
- **COE-05** Must not: unary plus (`+str`) or `parseFloat` to coerce strings to numbers; use `Number`. [lint]
- **COE-06** Must not: `parseInt` unless a non-decimal radix is required; then validate the input's digits first and check the result against `NaN`. [lint]
- **COE-07** Must not: explicit boolean coercion (`!!`) in `if`, `for` and `while` conditions. [lint]
- **COE-08** May: non-enum values are implicitly coerced or compared explicitly. [review]

COE-02:

```ts
// Bad
let enabled = Boolean(level);
if (maybeLevel) {...}
// Good
let enabled = level !== SupportLevel.NONE;
if (maybeLevel !== undefined && maybeLevel !== SupportLevel.NONE) {...}
```

### 4.8 Control structures

- **CTL-01** Must: control flow statements (`if`, `else`, `for`, `do`, `while`, ...) always use braced blocks, even for one statement; May elide the block for an `if` that fits on one line. [lint]
- **CTL-02** Must: the first statement of a non-empty block begins on its own line. [prettier]
- **CTL-03** Should not ("prefer to avoid"): assignment inside control statements; when intended, wrap the assignment in an extra pair of parentheses. [lint]
- **CTL-04** Should ("prefer"): `for (... of someArr)` for arrays; `Array.prototype.forEach` and indexed `for` loops are allowed. [lint]
- **CTL-05** Must not: `for (... in ...)` over arrays; for-in only on dict-style objects. [lint]
- **CTL-06** Should: guard for-in with `hasOwnProperty`; prefer for-of over `Object.keys` / `values` / `entries`. [lint]
- **CTL-07** Must: omit optional grouping parentheses only when author and reviewer agree there is no reasonable chance of misreading. [review]
- **CTL-08** Must not: unnecessary parentheses around the whole expression after `delete`, `typeof`, `void`, `return`, `throw`, `case`, `in`, `of`, `yield`. [prettier]

CTL-01:

```ts
// Bad
if (x)
  doSomethingWithALongMethodNameThatForcesANewLine(x);
for (let i = 0; i < x; i++) doSomethingWith(i);
// Good
for (let i = 0; i < x; i++) {
  doSomethingWith(i);
}
if (x) x.doFoo();  // allowed: the whole if fits on one line
```

CTL-03:

```ts
// Bad
if (x = someFunction()) { ... }
// Good
x = someFunction();
if (x) { ... }
while ((x = someFunction())) { ... }  // double parentheses mark it intentional
```

### 4.9 Exception handling

- **EXC-01** Should: use exceptions for exceptional cases; define custom exceptions where `Error` is insufficient; prefer throwing over ad-hoc error containers or error-property return objects. [review]
- **EXC-02** Must: instantiate errors with `new Error()`, not `Error()`. [lint]
- **EXC-03** Must not: throw primitives or non-`Error` objects; this extends to `Promise.reject`, promise `reject` callbacks and `AbortController#abort` / `AbortSignal.abort` reasons (no-argument `abort()` is fine). [lint]
- **EXC-04** Should: catch handlers assume every thrown value is an `Error`. [review]
- **EXC-05** Must not: defensively handle non-`Error` values unless the API is known to throw them; then Should comment where they come from. [review]
- **EXC-06** Must: an empty `catch` block carries a comment explaining why doing nothing is justified. [lint]
- **EXC-07** Must: the `cause` in `ErrorOptions` is an `Error` subtype (a type check may be skipped when `cause` is the `unknown` catch variable). [review]
- **EXC-08** Should not ("very likely a bug"): pass an `Error` as the `ErrorOptions` argument (`new Error('msg', e)`). [lint]
- **EXC-09** Must ("if this can be done without hurting readability"): keep `try` blocks focused; widening a `try` to cover a whole loop is ok. [review]

EXC-03:

```ts
// Bad
throw 'oh noes!';
Promise.reject('oh noes!');
AbortSignal.abort('my other custom abort error');
// Good
throw new Error('oh noes!');
Promise.reject(new Error('oh noes!'));
AbortSignal.abort(new Error('my other custom abort error'));
```

### 4.10 Switch statements

- **SW-01** Must: every `switch` has a `default` statement group, even if empty, and it is last. [lint]
- **SW-02** Must not: non-empty statement groups fall through ("enforced by the compiler"); each ends with `break`, `return` or a thrown exception; empty groups may fall through. [tsc]

### 4.11 Equality checks

- **EQ-01** Must: use `===` and `!==`; May use `==` / `!=` only to compare against the literal `null` (covers `undefined` too). [lint]

### 4.12 Type and non-nullability assertions

- **AST-01** Should not: type assertions (`x as T`) or non-null assertions (`y!`) without an obvious or explicit reason; prefer a runtime check. [review]
- **AST-02** Should: add a comment explaining why an assertion is safe, unless the reason is obvious. [review]
- **AST-03** Must: type assertions use `as`, not angle brackets (`<Foo>z`). [lint]
- **AST-04** Must: double assertions go through `unknown` (not `any` or `{}`). [lint]
- **AST-05** Must: specify an object literal's type with an annotation (`: Foo`), not an assertion (`as Foo`). [lint]

AST-05:

```ts
// Bad: renamed field 'bam' is not caught
const foo = {bar: 123, bam: 'abc'} as Foo;
// Good: excess property error is reported
const foo: Foo = {bar: 123, bam: 'abc'};
```

### 4.13 Keep try blocks focused

(Covered by EXC-09; the guide places this section after the assertion rules.)

### 4.14 Decorators

- **DEC-01** Must not: define new decorators; use only framework decorators (Angular, Polymer). [review]
- **DEC-02** Must: a decorator immediately precedes the symbol it decorates, with no empty lines; field decorators may share the line or wrap. [lint]

### 4.15 Disallowed features

- **DIS-01** Must not: instantiate `String`, `Boolean` or `Number` wrappers with `new`; calling them as functions to coerce is preferred over `+` or concatenating `''`. [lint]
- **DIS-02** Must not: rely on Automatic Semicolon Insertion; end every statement with a semicolon. [prettier]
- **DIS-03** Must not: `const enum`; use plain `enum`. [lint]
- **DIS-04** Must not: `debugger` statements in production code. [lint]
- **DIS-05** Must not: `with`. [tsc]
- **DIS-06** Must not: `eval` or the `Function(...string)` constructor (except code loaders). [lint]
- **DIS-07** Must not: non-standard ECMAScript or Web Platform features: deprecated or removed features, unfinished TC39 proposals, incomplete WHATWG proposals, transpiler-specific extensions (runtime-specific APIs are fine for projects targeting that runtime). [review]
- **DIS-08** Must not: modify built-in types (constructors or prototypes); Should not ("avoid") depend on libraries that do. [lint]
- **DIS-09** Must not: add symbols to the global object unless absolutely necessary. [review]

## 5. Naming

### 5.1 Identifiers

- **NAM-01** Must: identifiers use only ASCII letters, digits, underscores (constants and structured test names) and, rarely, `$`. [lint]
- **NAM-02** Should not: decorate names with information already in the type. [review]
- **NAM-03** Must not: leading or trailing underscores for private properties or methods. [lint]
- **NAM-04** Must not: the `opt_` prefix for optional parameters. [lint]
- **NAM-05** Must not: mark interfaces specially (`IMyInterface`, `MyFooInterface`) unless idiomatic in the environment. [lint]
- **NAM-06** Should: whether Observables get a `$` suffix is a team choice, but consistent within a project. [review]
- **NAM-07** Must: names are descriptive to a new reader; no ambiguous or project-local abbreviations, no deleted internal letters, no Hungarian notation; variables in scope for 10 lines or fewer (and non-exported arguments) May be short. [review]
- **NAM-08** Must: treat acronyms as whole words in camel case (`loadHttpUrl`, `customerId`), unless a platform name requires otherwise (`XMLHttpRequest`). [lint]
- **NAM-09** Should not: use `$` in identifiers, except where third-party framework conventions require it. [lint]

### 5.2 Rules by identifier type

- **NAM-10** Should: UpperCamelCase for class, interface, type, enum, decorator, type parameters, TSX component functions, JSXElement type parameter. [lint]
- **NAM-11** Should: lowerCamelCase for variable, parameter, function, method, property, module alias. [lint]
- **NAM-12** Should: CONSTANT_CASE for global constant values, including enum values. [lint]
- **NAM-13** May: type parameters are a single upper-case character (`T`) or UpperCamelCase. [lint]
- **NAM-14** May: xUnit-style test method names use `_` separators (`testX_whenY_doesZ()`). [review]
- **NAM-15** May: an `_` prefix marks a syntactically required identifier that is unused; a meaningful name after it is encouraged, a bare `_` is allowed. [lint]
- **NAM-16** Must not: the `_` prefix on trailing unused parameters; omit them (except on methods intended to be overridden). [lint]
- **NAM-17** Must not: `_` as an identifier suffix. [lint]
- **NAM-18** Must: module namespace imports are lowerCamelCase while files are snake_case (`import * as fooBar from './foo_bar';`); exceptions: jquery (`$`), threejs (`THREE`). [lint]
- **NAM-19** May: CONSTANT_CASE on values that are technically mutable (not deeply frozen) to signal they must not be modified; a `static readonly` class property can be a constant. [review]
- **NAM-20** Must: only module-level symbols, static fields of module-level classes and values of module-level enums use CONSTANT_CASE; values that can be instantiated more than once use lowerCamelCase; an arrow function implementing an interface May be lowerCamelCase. [lint]
- **NAM-21** Must: a local-scope alias keeps the source identifier's naming and format; use `const` for variable aliases and `readonly` for class-field aliases. [review]
- **NAM-22** Must: members that override, implement or narrow a base member, or appear in a contextually typed object literal, keep the existing name; casing rules apply at the original declaration, which follows them unless an external contract requires otherwise (then suppress the lint warning there with a rationale). [review]

NAM-15 / NAM-16:

```ts
// Bad: trailing unused parameter kept with an underscore
[].filter((element, _index) => !element.hasSomeProperty());
// Good
[].filter(element => !element.hasSomeProperty());
[].filter((_, i) => i % 2 === 0);  // leading unused parameter
```

## 6. Type system

### 6.1 Type inference

- **TYP-01** May: rely on compiler type inference for all type expressions. [review]
- **TYP-02** Must: leave out annotations that are trivially inferred: unexported variables or parameters initialized to a string, number or boolean literal. [lint]
- **TYP-03** Must: annotate exported symbols where `isolatedDeclarations` requires it (such annotations are not "trivial"). [tsc]
- **TYP-04** Must: leave out explicit generic types that repeat the type annotation. [lint]
- **TYP-05** May: annotate complex expressions for readability; "Whether an annotation is required is decided by the code reviewer." [review]
- **TYP-06** May: return type annotations are the author's choice; reviewers may ask for them; projects may require them locally. [review]

TYP-02 / TYP-03 / TYP-04:

```ts
// Bad
let count: number = 0;
export const PATH = `/users/${id}`;          // fails isolatedDeclarations
const x: Set<string> = new Set<string>();
// Good
let count = 0;
export const PATH: string = `/users/${id}`;
const x = new Set<string>();               // local
export const y: Set<string> = new Set();   // exported
```

### 6.2 Undefined and null

- **TYP-07** May: use either `undefined` or `null` for absence; no general preference, it depends on context. [review]
- **TYP-08** Must not: type aliases that include `|null` or `|undefined` in a union; add them where the alias is used. [lint]
- **TYP-09** Should: deal with null values close to where they arise. [review]

TYP-08:

```ts
// Bad
type CoffeeResponse = Latte|Americano|undefined;
// Good
type CoffeeResponse = Latte|Americano;
getLatte(): CoffeeResponse|undefined { ... }
```

### 6.3 Use structural types

- **TYP-10** Must: when providing a structural implementation, include the type at the symbol's declaration (`const foo: Foo = {...}`). [review]
- **TYP-11** Must: define structural types with interfaces, not classes. [review]

### 6.4 Prefer interfaces over type literal aliases

- **TYP-12** Must: declare object types with `interface`, not a type alias of an object literal type. [lint]

### 6.5 Array<T> type

- **TYP-13** Must: `T[]` / `readonly T[]` for simple element types (alphanumerics and dots), including multi-dimensional non-readonly arrays (`T[][]`); `Array<T>` / `ReadonlyArray<T>` for anything more complex; applied at each nesting level. [lint]

TYP-13:

```ts
// Bad
let a: Array<string>;
let e: {n: number, s: string}[];
let g: readonly (string | number)[];
let i: readonly string[][];
// Good
let a: string[];
let e: Array<{n: number, s: string}>;
let g: ReadonlyArray<string|number>;
let i: ReadonlyArray<string[]>;
```

### 6.6 Indexable types / index signatures

- **TYP-14** Must: give the index-signature key a meaningful label (`{[userName: string]: number}`, not `key`). [review]
- **TYP-15** Should ("consider"): ES6 `Map` and `Set` instead of index-signature objects. [review]

### 6.7 Mapped and conditional types

- **TYP-16** Must: always use the simplest type construct that can express the code; mapped and conditional types May be used subject to the guide's considerations (interface extension is often easier than `Pick`). [review]

### 6.8 any type

- **TYP-17** Should not ("Consider not to use any"): `any`; instead give a more specific type, use `unknown`, or suppress the lint warning and document why. [lint]
- **TYP-18** Must: use `unknown` when code only needs to express that a type is unknown; narrow it with a type guard. [lint]
- **TYP-19** Must: where `any` is legitimate (e.g. partial mocks in tests), add a lint-suppression comment that documents why. [review]

### 6.9 {} type

- **TYP-20** Should not: `{}` for most uses; prefer `unknown`, `Record<string, T>` or `object`. [lint]

### 6.10 Tuple types

- **TYP-21** May: a tuple type instead of a `Pair` interface; named properties or an inline object type are often clearer. [review]

### 6.11 Wrapper types

- **TYP-22** Must not: the types `String`, `Boolean`, `Number`, `Object` ("should not ever be used"; "Always use the lowercase version"). [lint]
- **TYP-23** Must not: invoke wrapper types as constructors with `new`. [lint]

### 6.12 Return type only generics

- **TYP-24** Should not ("avoid"): APIs with return-type-only generics; Must explicitly specify the generics when calling existing ones. [lint]

## 7. Toolchain requirements

- **TC-01** Must: all TypeScript files pass type checking with the standard toolchain. [tsc]
- **TC-02** Must not: `@ts-ignore`, `@ts-expect-error` or `@ts-nocheck`; `@ts-expect-error` May appear in unit tests but generally Should not (prefer a cast with a comment, or a documented lint suppression). [lint]
- **TC-03** Must: abide by applicable global or framework-local conformance rules (Google's tsetse and tsec). [review]

## 8. Comments and documentation

- **DOC-01** Must: `/** JSDoc */` for documentation a user of the code reads; `//` line comments for implementation comments. [review]
- **DOC-02** Must: multi-line comments use several `//` lines, not `/* */`, indented with the surrounding code. [lint]
- **DOC-03** Must not: comments enclosed in boxes of asterisks or other characters. [review]
- **DOC-04** Must: a JSDoc that overflows one line uses the multi-line form with `/**` and `*/` on their own lines. [lint]
- **DOC-05** Must: JSDoc comments are well-formed (tools extract metadata from them). [lint]
- **DOC-06** Must: JSDoc is written in Markdown (HTML when necessary); use Markdown lists rather than plain-text layout. [review]
- **DOC-07** Must: use only the allowed subset of JSDoc tags; most tags occupy their own line, starting the line, and are not combined (`@param left @param right` is Bad). [lint]
- **DOC-08** Must: indent wrapped block-tag lines four spaces; Should not ("discouraged") align wrapped description text horizontally. [lint]
- **DOC-09** Must not: indent wrapped `@desc` or `@fileoverview` descriptions. [lint]
- **DOC-10** Must: document all top-level exports of modules with JSDoc (exception: symbols exported only for tooling, e.g. `@NgModule` classes). [lint]
- **DOC-11** Should not ("avoid"): comments that merely restate the property or parameter name and type; `@param` / `@return` lines are required only when they add information. [review]
- **DOC-12** Should: document properties and methods (exported or not) whose purpose is not obvious from the name, as judged by the reviewer. [review]
- **DOC-13** Should: class JSDoc explains how and when to use the class; May omit the constructor's textual description. [review]
- **DOC-14** Must: method descriptions begin with a third-person verb phrase (implied "This method ..."); May omit descriptions that are obvious from the name and signature. [review]
- **DOC-15** Must: document parameter properties with `@param` on the constructor. [review]
- **DOC-16** Must not: JSDoc type annotations: no types in `@param` / `@return`, no `@implements`, `@enum`, `@private`, `@override` where the TypeScript keyword is used. [lint]
- **DOC-17** Should: add parameter-name comments when name and value do not convey meaning, placed before the value with an `=` suffix (`/* shouldRender= */ true`); "consider" refactoring to a destructured interface first; the legacy after-value style is acceptable for consistency within a file. [review]
- **DOC-18** Must: JSDoc goes before decorators, never between a decorator and the decorated statement. [lint]

DOC-02:

```ts
// Bad
/*
 * This should
 * use multiple
 * single-line comments
 */
// Good
// This is
// fine
```

DOC-17:

```ts
someFunction(obviousParam, /* shouldRender= */ true, /* name= */ 'hello');
```

## 9. Policies

- **POL-01** Must: for questions the guide does not settle, be consistent with the same file, then with files in the same directory. [review]
- **POL-02** Must: brand-new files use Google Style; new code in a non-conforming file is consistent with it but must not violate the guide. [review]
- **POL-03** May: leave existing code unreformatted; a file under significant change is expected to be brought into Google Style; Should move unrelated style changes into a separate change. [review]
- **POL-04** Must: mark deprecated methods, classes or interfaces with `@deprecated`, including clear directions for fixing call sites. [review]
- **POL-05** May: generated code is exempt, but generated identifiers referenced from hand-written code follow the naming rules (they may contain underscores). [review]
- **POL-06** Must (stated in "Style guide goals"): code is autoformatted so tooling can meet whitespace rules. [prettier]
- **POL-07** Must (stated in "Style guide goals"): a single set of compiler flags; the guide does not list the flags. [tsc]
- **POL-08** Must: code imports the libraries it uses ("strict deps"). [lint]

## 10. Tensions and gaps in the guide

- `{}`: the "{} Type" section says it should not be used in most cases, while "Wrapper types" says "Use `{}` for a type that include everything except null and undefined".
- Return types are the author's choice (TYP-06), but TYP-03 requires annotations on exports when `isolatedDeclarations` is in use. The guide names `isolatedDeclarations` and `isolatedModules` but does not list a tsconfig.
- Static dispatch (CLS-09/CLS-10) mixes "should not" and "must not" in one paragraph.
- File naming: snake_case files appear only incidentally in the naming of imports (NAM-18).
- The guide uses `catch (e: unknown)` in every example but states no rule requiring the annotation.
- Line length, indentation width, trailing commas and import ordering are not specified (see the table).

## 11. Formatting facts stated by the guide

| Topic | What the guide says |
| --- | --- |
| File encoding | "Source files are encoded in UTF-8." |
| Whitespace characters | ASCII space (0x20) is the only whitespace character besides the line terminator; tabs and other whitespace in strings are escaped. |
| Line endings | Not specified by the guide (only "the line terminator sequence"). |
| Final newline | Not specified by the guide. |
| Indentation width | Not specified by the guide (examples use 2 spaces; examples are non-normative). |
| JSDoc wrapped block tags | "Line-wrapped block tags are indented four spaces." |
| Line length | Not specified by the guide. |
| Quotes | "Ordinary string literals are delimited with single quotes"; double quotes allowed when the string contains a single quote. |
| Semicolons | "Explicitly end all statements using a semicolon." No semicolon after class declarations or between methods; semicolon after statements containing class expressions. |
| Trailing commas | Not specified by the guide (examples show both styles). |
| Braces | Control flow statements "always use braced blocks"; exception: "if statements fitting on one line may elide the block". First statement of a non-empty block on its own line. |
| Brace and bracket spacing | Not specified by the guide (examples write `{Foo}` without inner spaces; non-normative). |
| Blank lines | One blank line between file sections; methods and the constructor separated by a single blank line; no blank lines at the start or end of a function body; blank lines inside class braces "neither encouraged nor discouraged". |
| Arrow function parentheses | Around a single parameter: "recommended but not required". |
| Generators | `function* foo()` and `yield* iter`. |
| Rest and spread | No space after `...`. |
| Constructor calls | Always with parentheses: `new Foo()`. |
| Number literals | Lowercase `0x`, `0o`, `0b` prefixes; no leading zero otherwise. |
| Grouping parentheses | Optional ones omitted only when there is no reasonable chance of misreading; none around the whole operand of `delete`, `typeof`, `void`, `return`, `throw`, `case`, `in`, `of`, `yield`. |
| String line continuations | Not allowed; concatenate or use one long string. |
| Template literal indentation | Multi-line template literals need not follow the enclosing indentation. |
| Object keys | Computed (dict-style) keys must not be mixed with unquoted keys; classes allow only symbol computed keys. |
| Union type spacing | Not specified by the guide (examples mostly write `string\|null`). |
| Import ordering and grouping | Not specified by the guide. |
| Comments | Multi-line comments use `//` lines; no boxed comments; JSDoc uses `/** ... */` on its own lines when longer than one line. |
| Decorators | Immediately precede the decorated symbol with no empty line; field decorators may share the line or wrap; JSDoc goes before decorators. |
| Autoformatting | "code is autoformatted so it's easy for software to meet whitespace rules" (from "Style guide goals"); no formatter is named. |
