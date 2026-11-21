// PLACEHOLDER: runs the bundled CLI the way a plugin install would. Delete with src/bin/placeholder_cli.ts.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const cliPath = fileURLToPath(
    new URL('../../dist/placeholder_cli.js', import.meta.url),
);

describe('placeholder_cli bundle', () => {
    it('greets the name given on the command line', () => {
        const output = execFileSync(process.execPath, [cliPath, 'Ada'], {
            encoding: 'utf8',
        });

        expect(output).toBe('Hello, Ada!\n');
    });
});
