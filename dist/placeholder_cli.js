// src/bin/placeholder_cli.ts
import { parseArgs } from "node:util";

// src/placeholder.ts
function greet(name) {
  return `Hello, ${name}!`;
}

// src/bin/placeholder_cli.ts
var { positionals } = parseArgs({ allowPositionals: true });
process.stdout.write(`${greet(positionals.at(0) ?? "world")}
`);
