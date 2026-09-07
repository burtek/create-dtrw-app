import { defineConfig } from 'tsdown';


export default defineConfig({
    entry: {
        index: 'src/server.ts'
        // more?
    },
    dts: true,
    sourcemap: true,
    tsconfig: 'tsconfig.build.json',
    format: 'esm'
});
