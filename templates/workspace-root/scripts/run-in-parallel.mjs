import { load } from 'js-yaml';
import { spawn } from 'node:child_process';
import { glob, readFile } from 'node:fs/promises';
import { basename, delimiter as envPathDelimiter, dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';
import { getPackageColor, getScriptColor, padBothSides, pipeOutput } from './run-in-parallel.utils.mjs';


const root = fileURLToPath(new URL('..', import.meta.url));
const argv = process.argv.slice(2);

if (argv.length !== 1) {
    throw new Error(`Invalid argument count: expected 1, got ${argv.length}`);
}

/** @type {string|RegExp} */
let command = argv[0];

if (!command.includes('/')) {
    // plain script name, continue
} else if (/^\/[^/]+\/[i]*$/.test(command)) {
    const [_, body, flags] = command.split('/');
    command = new RegExp(body, flags);
} else {
    throw new Error('Invalid argument syntax, use exact script name or /regex/ syntax with optional i flag')
}

let workspace;
try {
    workspace = load(await readFile(resolve(root, 'pnpm-workspace.yaml'), 'utf-8'));
} catch (error) {
    throw new Error('Unable to load pnpm-workspace.yaml', { cause: error });
}

if (!workspace || typeof workspace !== 'object') {
    throw new Error('Invalid pnpm-workspace.yaml');
} else if (!('packages' in workspace) || !workspace.packages || (typeof workspace.packages !== 'string' && !Array.isArray(workspace.packages))) {
    throw new Error('pnpm-workspace.yaml has no packages defined');
}

const packages = await Array.fromAsync(glob(
    (typeof workspace.packages === 'string' ? [workspace.packages] : workspace.packages).map(path => resolve(path, 'package.json')),
    { cwd: root }
));

const packagesWithScripts = await Promise.all(packages.map(async path => {
    const pkg = /** @type {unknown} */(JSON.parse(await readFile(path, 'utf-8')));
    if (typeof pkg === 'object' && pkg && 'scripts' in pkg && typeof pkg.scripts === 'object' && pkg.scripts) {
        if (typeof command === 'string') {
            // @ts-ignore
            if (command in pkg.scripts && typeof pkg.scripts[command] === 'string') {
                // @ts-ignore
                return { path, scripts: [{ command, script: pkg.scripts[command] }] }
            } else {
                return { path, scripts: [] }
            }
        } else {
            const scripts = Object.keys(pkg.scripts)
            .filter(s => command.test(s))
            // @ts-ignore
            .map(script => ({ command: script, script: pkg.scripts[script] }));
            return { path, scripts }
        }
    } else {
        console.warn(`${path} has no readable scripts`);
    }
}));

const flattenedToRun = packagesWithScripts.filter(x => !!x).flatMap(({ path, scripts }) => scripts.map(script => ({ cwd: dirname(path), ...script })))

const dirnameLength = flattenedToRun.reduce((max, curr) => Math.max(max, basename(curr.cwd).length), 0);
const scriptNameLength = flattenedToRun.reduce((max, curr) => Math.max(max, basename(curr.command).length), 0);

let running = 0;
const children = flattenedToRun.map(({ cwd, script, command }, index) => {
    const child = spawn(script, {
        cwd,
        detached: process.platform !== 'win32',
        env: {
            ...process.env,
            FORCE_COLOR: '1', // vite
            PATH: [
                join(cwd, 'node_modules', '.bin'),
                ...process.env.PATH?.split(envPathDelimiter) ?? []
            ].join(envPathDelimiter)
        },
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
    });
    
    running++;
    
    child.addListener('exit', (code, signal) => handleClose(index, code, signal));
    child.addListener('error', (err) => handleError(index, err));

    const prefix1 = styleText(getPackageColor(basename(cwd)), `[${padBothSides(basename(cwd), dirnameLength)}]`);
    const prefix2 = styleText(getScriptColor(basename(cwd), command), `[${padBothSides(command, scriptNameLength)}]`);
    const prefix = `${prefix1} ${prefix2}`;

    pipeOutput(child.stdout, process.stdout, prefix);
    pipeOutput(child.stderr, process.stderr, prefix);
    
    return { child, cwd, script, command, status: 'running' };
});

let hasAnyExitNon0 = false;
/**
* @param {number} index 
* @param {number|null} code 
* @param {string|null} signal 
*/
function handleClose(index, code, signal) {
    running--;
    children[index].status = 'exited';
    console.log('%s from %s exited %s', children[index].command, basename(children[index].cwd), signal ? `due to signal ${signal}` : `with return code ${code}`);
    
    hasAnyExitNon0 ||= code !== 0;

    if (running === 0) {
        process.exit(0);
    }
}
/**
* @param {number} index
* @param {Error} err
*/
function handleError(index, err) {
    running--;
    children[index].status = 'errored';
    console.log('%s from %s spawn error: %s', children[index].command, basename(children[index].cwd), err.message);
    
    hasAnyExitNon0 = true;
    
    if (running === 0) {
        process.exit(0);
    }
}

/** @param {'SIGINT' | 'SIGTERM'} signal */
const handleSignal = signal => children.forEach(child => child.child.pid ? process.kill(-child.child.pid, signal) : null)
process.addListener('SIGINT', handleSignal);
process.addListener('SIGTERM', handleSignal);

if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', key => {
        if (key === 's') {
            console.table(children.map(({ child, ...c }) => ({
                pid: child.pid,
                ...c,
                cwd: relative(root, c.cwd)
            })));
        }

        // Ctrl+C
        if (key === '\u0003') {
            handleSignal('SIGINT');
        }
    });
}

const cleanupStdin = () => {
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
        process.stdin.pause();
    }
};

process.on('exit', cleanupStdin);
