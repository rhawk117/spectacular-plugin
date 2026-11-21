// PLACEHOLDER: shows how a src/bin entrypoint bundles into dist/. Delete with its integration test.
import { parseArgs } from 'node:util';

import { greet } from '../placeholder.js';

const { positionals } = parseArgs({ allowPositionals: true });
process.stdout.write(`${greet(positionals.at(0) ?? 'world')}\n`);
