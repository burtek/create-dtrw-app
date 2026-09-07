import { defineConfig } from 'vitest/config';
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    globals: true,
                    name: 'vitest-matchers',
                    include: ['setup/matchers/*.test.ts'],
                },
            },
            {
                test: {
                    globals: true,
                    name: 'unit',
                    include: ['src/**/*.test.ts'],
                    exclude: ['src/**/*.e2e.test.ts'],
                },
            },
            {
                test: {
                    globals: true,
                    name: 'e2e',
                    include: ['src/**/*.e2e.test.ts'],
                    testTimeout: 30_000,
                    hookTimeout: 30_000,
                    fileParallelism: false,
                    env: {
                        E2E_TEMP_DIR: mkdtempSync(join(tmpdir(), 'cli-e2e-')),
                    },
                    setupFiles: ['setup/e2e-tests.ts'],
                },
            },
        ],
    },
});
