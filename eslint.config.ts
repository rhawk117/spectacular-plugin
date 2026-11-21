// ESLint runs the type-aware rules. Base: @eslint/js recommended plus typescript-eslint
// strict-type-checked and stylistic-type-checked. Every deviation cites docs/google-typescript-style.md.
// eslint-plugin-oxlint turns off what .oxlintrc.json already checks; eslint-config-prettier comes last.

import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import type { Linter } from 'eslint';
import prettier from 'eslint-config-prettier';
import oxlint from 'eslint-plugin-oxlint';
import sonarjs from 'eslint-plugin-sonarjs';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const FUNCTION_PARAM =
    ':function > :matches(ObjectPattern, AssignmentPattern > ObjectPattern)';
const BOOLEAN_PARAM_OWNER =
    ':matches(:function, TSDeclareFunction, TSMethodSignature, TSFunctionType, TSParameterProperty)';
const CLASS_MEMBER =
    ':matches(PropertyDefinition, MethodDefinition, AccessorProperty, TSAbstractPropertyDefinition, TSAbstractMethodDefinition)';

const restrictedSyntax = [
    {
        selector: 'TSEnumDeclaration[const=true]',
        message: 'DIS-03: use a plain enum, not const enum.',
    },
    {
        selector: 'TSImportType',
        message: 'ITY-03: use import type instead of import() in a type.',
    },
    {
        selector: 'PrivateIdentifier',
        message: 'CLS-16: use the TypeScript private modifier, not #private.',
    },
    {
        selector:
            ':matches(CallExpression, NewExpression)[callee.name="Array"]',
        message:
            'ARR-01: use an array literal or Array.from, not the Array constructor.',
    },
    {
        selector:
            ':function > AssignmentPattern[left.type="ArrayPattern"] > ArrayExpression.right[elements.length>0]',
        message:
            'ARR-05: default an optional destructured array to [] and put element defaults on the left.',
    },
    {
        selector:
            ':function > AssignmentPattern[left.type="ObjectPattern"] > ObjectExpression.right[properties.length>0]',
        message:
            'OBJ-07: default an optional destructured object to {} and put property defaults on the left.',
    },
    {
        selector: `${FUNCTION_PARAM} > Property:matches([computed=true], [value.type=/^(ObjectPattern|ArrayPattern)$/], [value.left.type=/^(ObjectPattern|ArrayPattern)$/])`,
        message:
            'OBJ-06: no nested or computed properties in parameter destructuring.',
    },
    {
        selector:
            'CallExpression[callee.object.name="Object"][callee.property.name=/^definePropert(y|ies)$/] Property[key.name=/^(get|set)$/]',
        message:
            'CLS-27: declare accessors in the class, not with Object.defineProperty.',
    },
    {
        selector: `${CLASS_MEMBER}[computed=true]:not([key.type="MemberExpression"][key.object.name="Symbol"])`,
        message: 'CLS-28: no computed class keys except symbols.',
    },
    {
        selector: `${CLASS_MEMBER} > Literal.key`,
        message: 'CLS-28: no quoted class keys.',
    },
    {
        selector:
            'CallExpression:matches([callee.name="parseInt"], [callee.property.name="parseInt"])[arguments.length<2]',
        message:
            'COE-06: use Number() for decimal strings; parseInt only with a non-decimal radix.',
    },
    {
        selector:
            'CallExpression:matches([callee.name="parseInt"], [callee.property.name="parseInt"])[arguments.length=2][arguments.1.value=10]',
        message:
            'COE-06: use Number() for decimal strings; parseInt only with a non-decimal radix.',
    },
    {
        selector:
            'TSAsExpression > TSAsExpression.expression:not([typeAnnotation.type="TSUnknownKeyword"])',
        message: 'AST-04: a double assertion goes through unknown.',
    },
    {
        selector:
            'TSTypeAliasDeclaration > TSUnionType.typeAnnotation > :matches(TSNullKeyword, TSUndefinedKeyword)',
        message:
            'TYP-08: add |null or |undefined where the alias is used, not in the alias.',
    },
    {
        selector: `${BOOLEAN_PARAM_OWNER} > Identifier[typeAnnotation.typeAnnotation.type="TSBooleanKeyword"]`,
        message:
            'FBT001 (maintainer decision): no boolean positional parameter; take an options object or split the function.',
    },
    {
        selector: `${BOOLEAN_PARAM_OWNER} > AssignmentPattern > Literal.right[raw=/^(true|false)$/]`,
        message:
            'FBT002 (maintainer decision): no boolean default on a positional parameter; take an options object or split the function.',
    },
];

const namingConvention = [
    // NAM-11, NAM-08: lowerCamelCase with acronyms as words; NAM-03, NAM-17: no leading or trailing underscores.
    {
        selector: 'default',
        format: ['strictCamelCase'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
    },
    // NAM-10, NAM-13: UpperCamelCase types and type parameters.
    { selector: 'typeLike', format: ['StrictPascalCase'] },
    // NAM-05: no I prefix or Interface suffix.
    {
        selector: 'interface',
        format: ['StrictPascalCase'],
        custom: { regex: '^I[A-Z]|Interface$', match: false },
    },
    // NAM-12: enum values are CONSTANT_CASE.
    { selector: 'enumMember', format: ['UPPER_CASE'] },
    // NAM-12, NAM-20: only module-level constants and static readonly fields may be CONSTANT_CASE.
    {
        selector: 'variable',
        modifiers: ['const', 'global'],
        format: ['strictCamelCase', 'UPPER_CASE'],
    },
    {
        selector: 'classProperty',
        modifiers: ['static', 'readonly'],
        format: ['strictCamelCase', 'UPPER_CASE'],
    },
    // NAM-15: an unused, syntactically required name may take a _ prefix.
    {
        selector: ['parameter', 'variable'],
        modifiers: ['unused'],
        format: ['strictCamelCase'],
        leadingUnderscore: 'allow',
    },
    // NAM-22: names that need quotes come from an external contract.
    {
        selector: ['objectLiteralProperty', 'typeProperty'],
        modifiers: ['requiresQuotes'],
        format: null,
    },
];

const config: Linter.Config[] = defineConfig(
    { ignores: ['node_modules/', '.cache/', 'coverage/', 'dist/'] },
    {
        files: ['**/*.ts'],
        extends: [
            js.configs.recommended,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
        ],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: { '@stylistic': stylistic, sonarjs },
        rules: {
            '@typescript-eslint/naming-convention': [
                'error',
                ...namingConvention,
            ],
            'no-restricted-syntax': ['error', ...restrictedSyntax],
            // COE-05: Number() instead of Number.parseFloat.
            'no-restricted-properties': [
                'error',
                {
                    object: 'Number',
                    property: 'parseFloat',
                    message: 'COE-05: use Number() to parse strings.',
                },
            ],
            // TC-02: no @ts-ignore, @ts-expect-error or @ts-nocheck.
            '@typescript-eslint/ban-ts-comment': [
                'error',
                {
                    'ts-expect-error': true,
                    'ts-ignore': true,
                    'ts-nocheck': true,
                    'ts-check': false,
                },
            ],
            // TYP-13: T[] for simple types, Array<T> for complex ones.
            '@typescript-eslint/array-type': [
                'error',
                { default: 'array-simple' },
            ],
            // AST-03, AST-05: as-style assertions, never on object literals.
            '@typescript-eslint/consistent-type-assertions': [
                'error',
                { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
            ],
            // TYP-04: the guide's good examples use both styles (local new Set<string>(), exported : Set<string> = new Set()).
            '@typescript-eslint/consistent-generic-constructors': 'off',
            // CLS-31: no public modifier except on non-readonly parameter properties.
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                { accessibility: 'no-public' },
            ],
            // CLS-18: parameter properties instead of plumbing constructor arguments into fields.
            '@typescript-eslint/parameter-properties': [
                'error',
                { prefer: 'parameter-property' },
            ],
            // CLS-17: readonly for properties never reassigned outside the constructor.
            '@typescript-eslint/prefer-readonly': 'error',
            // VAR-03: no use of a variable before its declaration.
            'no-use-before-define': 'off',
            '@typescript-eslint/no-use-before-define': [
                'error',
                { functions: false, classes: true, variables: true },
            ],
            // FN-05, THIS-01, THIS-02: this only in classes, typed-this functions and arrows.
            'no-invalid-this': 'off',
            '@typescript-eslint/no-invalid-this': 'error',
            // SFB-02: ASCII space is the only whitespace character.
            '@stylistic/no-tabs': 'error',
            // SFS-02: one blank line between the import section and the implementation.
            '@stylistic/padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: 'import', next: '*' },
                { blankLine: 'any', prev: 'import', next: 'import' },
            ],
            // CLS-06, CLS-15: a blank line around methods and the constructor.
            '@stylistic/lines-between-class-members': [
                'error',
                {
                    enforce: [
                        { blankLine: 'always', prev: 'method', next: '*' },
                        { blankLine: 'always', prev: '*', next: 'method' },
                    ],
                },
            ],
            // DOC-02: multi-line comments are several // lines, not /* */.
            '@stylistic/multiline-comment-style': ['error', 'separate-lines'],
            // Maintainer decision: pylint max-bool-expr from mightymodels' ruff.toml.
            'sonarjs/expression-complexity': ['error', { max: 3 }],
            // Maintainer decision: pylint max-branches from mightymodels' ruff.toml, approximated by cognitive complexity.
            'sonarjs/cognitive-complexity': ['error', 8],
        },
    },
    oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
    prettier,
);

export default config;
