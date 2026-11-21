// src/placeholder.ts
function greet(name) {
  return `Hello, ${name}!`;
}

// src/bin/placeholder_cli.ts
process.stdout.write(`${greet(process.argv.at(2) ?? "world")}
`);
