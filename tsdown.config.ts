import { defineConfig } from 'tsdown';


export default defineConfig({
    entry: {
        create: 'src/cli/create/index.ts',
        dtrw: 'src/cli/dtrw/index.ts'
    },
    dts: {
        enabled: true,
        sourcemap: true
    },
    sourcemap: true,
    tsconfig: 'tsconfig.app.json',
    format: 'esm'
});
