// PLACEHOLDER: test for src/placeholder.ts. Delete with the module.

import { describe, expect, it } from 'vitest';

import { greet } from './placeholder.js';

describe('greet', () => {
    it('greets by name', () => {
        expect(greet('Ada')).toBe('Hello, Ada!');
    });
});
