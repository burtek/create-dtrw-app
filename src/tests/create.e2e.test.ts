import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);

describe('creating new project', () => {
    let tarball: string;
    let cwd: string;

    beforeAll(() => {
        assertString(process.env.E2E_TARBALL);
        tarball = process.env.E2E_TARBALL;
    });

    beforeEach(async () => {
        cwd = await mkdtemp(join(tmpdir(), 'create-dtrw-app'));
    });

    const outputs = new Map<string, string>();
    afterEach(async ctx => {
        if (ctx.task.result?.state === 'pass') {
            await rm(cwd, { recursive: true, force: true });
        } else if (ctx.task.result?.state === 'fail') {
            outputs.set(ctx.task.fullTestName, cwd);
        }
    });

    afterAll(() => {
        outputs.forEach((value, key) => {
            console.error(key);
            console.error('  ' + value);
        })
    })

    async function execCreate(...args: string[]) {
        const result = await exec('pnpm', ['--config.dlx-cache-max-age=0', 'dlx', tarball, ...args], {
            cwd, env: process.env
        });

        return { cwd, result };
    }

    it('should create empty project', async () => {
        const { result: { stdout } } = await execCreate('testapp', '--no-create-github-repo');

        expect(stdout).toMatch('Creating project root');
        expect(stdout).toMatch('Installing dependencies');
        expect(stdout).toMatch('Skipping tests because no packages were added');
        expect(stdout).toMatch('Committing files');

        await expect(exec('git', ['log', '--oneline'], { cwd: join(cwd, 'dtrw-app-testapp') }))
            .resolves
            .toStrictEqual({
                stderr: '',
                stdout: expect.stringMatching('feat: new project dtrw-app-testapp created')
            });

        expect(join(cwd, 'dtrw-app-testapp', 'package.json')).toBeFile();
        expect(join(cwd, 'dtrw-app-testapp', 'packages')).toBeEmptyDirectory();

        expect(join(cwd, 'dtrw-app-testapp', 'docker-compose.yml')).toMatchFileObject({
            services: {}
        });
    });

    it('should create project with provided packages', async () => {
        const { result: { stdout } } = await execCreate('testapp-with-packages', '--no-create-github-repo', '-w', 'reactjs:ui', '-w', 'nodejs:api');

        expect(stdout).toMatch('Creating project root');
        expect(stdout).toMatch('Creating package ui using preset reactjs');
        expect(stdout).toMatch('Creating package api using preset nodejs');
        expect(stdout).toMatch('Installing dependencies');
        expect(stdout).toMatch('Running tests');
        expect(stdout).toMatch('Committing files');

        await expect(exec('git', ['log', '--oneline'], { cwd: join(cwd, 'dtrw-app-testapp-with-packages') }))
            .resolves
            .toStrictEqual({
                stderr: '',
                stdout: expect.stringMatching('feat: new project dtrw-app-testapp-with-packages created')
            });

        expect(join(cwd, 'dtrw-app-testapp-with-packages', 'package.json')).toBeFile();
        expect(join(cwd, 'dtrw-app-testapp-with-packages', 'packages')).toBeDirectory();
        expect(join(cwd, 'dtrw-app-testapp-with-packages', 'packages', 'ui')).toBeDirectory();
        expect(join(cwd, 'dtrw-app-testapp-with-packages', 'packages', 'api')).toBeDirectory();

        expect(join(cwd, 'dtrw-app-testapp-with-packages', 'docker-compose.yml')).toMatchFileObject({
            services: {
                api: expect.objectContaining({ container_name: 'testapp-with-packages_api' }),
                ui: expect.objectContaining({ container_name: 'testapp-with-packages_ui' }),
            }
        });

        expect(join(cwd, 'dtrw-app-testapp-with-packages', 'packages', 'ui', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ react: expect.any(String) })
        });
        expect(join(cwd, 'dtrw-app-testapp-with-packages', 'packages', 'api', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ fastify: expect.any(String) })
        });
    });

    it('should create project using starter', async () => {
        const { result: { stdout } } = await execCreate('testapp-using-starter', '--no-create-github-repo', '-s', 'fullstack');

        expect(stdout).toMatch('Creating project root');
        expect(stdout).toMatch('Creating package frontend using preset reactjs');
        expect(stdout).toMatch('Creating package backend using preset nodejs');
        expect(stdout).toMatch('Installing dependencies');
        expect(stdout).toMatch('Running tests');
        expect(stdout).toMatch('Committing files');

        await expect(exec('git', ['log', '--oneline'], { cwd: join(cwd, 'dtrw-app-testapp-using-starter') }))
            .resolves
            .toStrictEqual({
                stderr: '',
                stdout: expect.stringMatching('feat: new project dtrw-app-testapp-using-starter created')
            });

        expect(join(cwd, 'dtrw-app-testapp-using-starter', 'package.json')).toBeFile();
        expect(join(cwd, 'dtrw-app-testapp-using-starter', 'packages')).toBeDirectory();
        expect(join(cwd, 'dtrw-app-testapp-using-starter', 'packages', 'frontend')).toBeDirectory();
        expect(join(cwd, 'dtrw-app-testapp-using-starter', 'packages', 'backend')).toBeDirectory();

        expect(join(cwd, 'dtrw-app-testapp-using-starter', 'docker-compose.yml')).toMatchFileObject({
            services: {
                backend: expect.objectContaining({ container_name: 'testapp-using-starter_backend' }),
                frontend: expect.objectContaining({ container_name: 'testapp-using-starter_frontend' }),
            }
        });

        expect(join(cwd, 'dtrw-app-testapp-using-starter', 'packages', 'frontend', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ react: expect.any(String) })
        });
        expect(join(cwd, 'dtrw-app-testapp-using-starter', 'packages', 'backend', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ fastify: expect.any(String) })
        });
    });

    it('should create project using starter with additional packages', async () => {
        const { result: { stdout } } = await execCreate('testapp-combo', '--no-create-github-repo', '-s', 'fullstack', '-w', 'reactjs:admin');

        expect(stdout).toMatch('Creating project root');
        expect(stdout).toMatch('Creating package frontend using preset reactjs');
        expect(stdout).toMatch('Creating package backend using preset nodejs');
        expect(stdout).toMatch('Creating package admin using preset reactjs');
        expect(stdout).toMatch('Installing dependencies');
        expect(stdout).toMatch('Running tests');
        expect(stdout).toMatch('Committing files');

        await expect(exec('git', ['log', '--oneline'], { cwd: join(cwd, 'dtrw-app-testapp-combo') }))
            .resolves
            .toStrictEqual({
                stderr: '',
                stdout: expect.stringMatching('feat: new project dtrw-app-testapp-combo created')
            });

        expect(join(cwd, 'dtrw-app-testapp-combo', 'package.json')).toBeFile();
        expect(join(cwd, 'dtrw-app-testapp-combo', 'packages')).toBeDirectory();
        expect(join(cwd, 'dtrw-app-testapp-combo', 'packages', 'frontend')).toBeDirectory();
        expect(join(cwd, 'dtrw-app-testapp-combo', 'packages', 'backend')).toBeDirectory();
        expect(join(cwd, 'dtrw-app-testapp-combo', 'packages', 'admin')).toBeDirectory();

        expect(join(cwd, 'dtrw-app-testapp-combo', 'docker-compose.yml')).toMatchFileObject({
            services: {
                backend: expect.objectContaining({ container_name: 'testapp-combo_backend' }),
                frontend: expect.objectContaining({ container_name: 'testapp-combo_frontend' }),
                admin: expect.objectContaining({ container_name: 'testapp-combo_admin' }),
            }
        });

        expect(join(cwd, 'dtrw-app-testapp-combo', 'packages', 'frontend', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ react: expect.any(String) })
        });
        expect(join(cwd, 'dtrw-app-testapp-combo', 'packages', 'backend', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ fastify: expect.any(String) })
        });
        expect(join(cwd, 'dtrw-app-testapp-combo', 'packages', 'admin', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ react: expect.any(String) })
        });
    });

    it('should throw if trying to use multiple packages under same name', async () => {
        await expect(async () => {
            await execCreate('testapp-duplicate-names', '--no-create-github-repo', '-w', 'reactjs:app', '-w', 'nodejs:app');
        }).rejects.toMatchObject({
            message: expect.stringContaining('Error: Package app is defined more than once')
        });

        expect(join(cwd, 'dtrw-app-testapp-duplicate-names')).not.toBeDirectory();
    });

    it('should throw if trying to use starter and conflicting additional package', async () => {
        await expect(async () => {
            await execCreate('testapp-conflicting-package', '--no-create-github-repo', '-s', 'fullstack', '-w', 'reactjs:frontend');
        }).rejects.toMatchObject({
            message: expect.stringContaining('Error: Starter fullstack already defines package frontend')
        });

        expect(join(cwd, 'dtrw-app-testapp-conflicting-package')).not.toBeDirectory();
    });
});

function assertString(value: unknown): asserts value is string {
    if (typeof value !== 'string') {
        throw TypeError(`expected string, got ${typeof value}`);
    }
}
