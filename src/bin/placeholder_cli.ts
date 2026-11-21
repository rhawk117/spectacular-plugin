// PLACEHOLDER: shows how a src/bin entrypoint bundles into dist/. Delete with its integration test.
import { greet } from '../placeholder.js';

process.stdout.write(`${greet(process.argv.at(2) ?? 'world')}\n`);
