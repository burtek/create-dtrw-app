import { defineConfig } from 'tsdown';


export default defineConfig({
    entry: {
        index: 'src/server.ts'
        // more?
    },
    dts: true,
    sourcemap: true,
    tsconfig: 'tsconfig.build.json',
    format: 'esm',
    unbundle: true,
    copy: [
        {
            from: [
                'src/assets/**/*',
                '!src/assets/**/*.ts'
            ],
            to: 'dist',
            flatten: false
        }
    ]
});
