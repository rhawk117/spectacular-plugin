// Vitest tiers: unit tests sit beside the code in src/, integration tests run the built dist/ from tests/integration/.

import { defineConfig, type ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = defineConfig({
    test: {
        sequence: { shuffle: true },
        projects: [
            {
                extends: true,
                test: { name: 'unit', include: ['src/**/*.test.ts'] },
            },
            {
                extends: true,
                test: {
                    name: 'integration',
                    include: ['tests/integration/**/*.test.ts'],
                },
            },
        ],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/bin/**'],
            reporter: ['text', 'html', 'json-summary'],
            reportOnFailure: true,
            thresholds: {
                lines: 80,
                branches: 80,
                functions: 80,
                statements: 80,
            },
        },
    },
});

export default config;
