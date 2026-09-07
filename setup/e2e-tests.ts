import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as vitestFSMatchers from 'vitest-fs';
import './matchers/toMatchFileObject.js'

const exec = promisify(execFile);

expect.extend(vitestFSMatchers);

declare module 'vitest' {
    interface Matchers<
        R extends void | Promise<void> = void | Promise<void>,
        T = unknown
    > extends vitestFSMatchers.Matchers {}
}

beforeAll(async () => {
    console.log('Building create-dtrw-app...');
    await exec('pnpm', ['build']);
    console.log('Packing create-dtrw-app...');
    const packResult = await exec('pnpm', ['pack', '--pack-destination=/tmp', '--json']);
    const { filename } = JSON.parse(packResult.stdout);
    process.env.E2E_TARBALL = filename;
});
