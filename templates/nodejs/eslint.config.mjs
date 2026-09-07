// @ts-check
import { prepareConfig, config } from '@dtrw/eslint-config';


export default config(
    ...prepareConfig({
        jest: { mode: 'vitest' },
        json: { additionalFiles: { jsonc: ['tsconfig.*.json'] } },
        node: true
    }),
    {
        files: ['**/*.{mjs,js,jsx,ts,tsx,mts}'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        settings: { 'import/resolver': { typescript: true } }
    },
    { rules: { 'new-cap': 'off' } }, // for nestjs decorators
    { ignores: ['dist', 'node_modules', '.assembled'] }
);
