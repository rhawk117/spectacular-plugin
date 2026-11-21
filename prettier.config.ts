// Prettier options. Anything the style digest leaves open stays at Prettier's default.

import type { Config } from 'prettier';

const config: Config = {
    // STR-01: single quotes for ordinary string literals.
    singleQuote: true,
    // DIS-02: end every statement with a semicolon.
    semi: true,
    // Maintainer decision: 4-space indentation. The guide leaves indentation width open.
    tabWidth: 4,
};

export default config;
