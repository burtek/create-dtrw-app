import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import packageJson from '../../package.json' with { type: 'json' };


const exec = promisify(execFile);

const it = test
    .extend('tarball', { auto: true, scope: 'file' }, () => {
        assertString(process.env.E2E_TARBALL);
        return process.env.E2E_TARBALL;
    })
    .extend('cwd', { auto: true, scope: 'file' }, async ({}, { onCleanup }) => {
        const cwd = await mkdtemp(join(tmpdir(), 'create-dtrw-app'));
        onCleanup(async () => await rm(cwd, { recursive: true, force: true }));
        return cwd;
    })
    .extend('pkg', { auto: true }, async ({ cwd, task }, { onCleanup }) => {
        const name = `app-${task.id}`;
        const fullname = `dtrw-app-${name}`;
        return { name, fullname, root: join(cwd, fullname) };
    })
    .extend('execCreate', { auto: true }, ({ cwd, tarball }) => async (...args: string[]) => {
        return await exec('pnpm', ['--config.dlx-cache-max-age=0', 'dlx', tarball, ...args], {
            cwd, env: process.env
        });
    })

describe('creating new project', () => {
    let tarball: string;

    beforeAll(async () => {
        assertString(process.env.E2E_TARBALL);
        tarball = process.env.E2E_TARBALL;
    });

    async function expectGitCommit(cwd: string, message: string) {
        await expect(exec('git', ['log', '--oneline'], { cwd }))
            .resolves
            .toMatchObject({ stderr: '', stdout: expect.stringMatching(message) });
    }
``
    it('should create empty project', async ({ execCreate, pkg }) => {
        const { stdout } = await execCreate(pkg.name, '--no-create-github-repo');

        expect(stdout).toMatch('Creating project root');
        expect(stdout).toMatch('Installing dependencies');
        expect(stdout).toMatch('Skipping tests because no packages were added');
        expect(stdout).toMatch('Committing files');

        await expectGitCommit(pkg.root, `feat: new project ${pkg.fullname} created`);

        expect(join(pkg.root, 'package.json')).toMatchFileObject({
            'create-dtrw-app': {
                generatorVersion: packageJson.version,
                templatesUsed: {}
            }
        });
        expect(join(pkg.root, 'packages')).toBeEmptyDirectory();

        expect(join(pkg.root, 'docker-compose.yml')).toMatchFileObject({
            services: {}
        });
    });

    it('should create project with provided packages', async ({ execCreate, pkg }) => {
        const { stdout } = await execCreate(pkg.name, '--no-create-github-repo', '-w', 'reactjs:ui', '-w', 'nodejs:api');

        expect(stdout).toMatch('Creating project root');
        expect(stdout).toMatch('Creating package ui using preset reactjs');
        expect(stdout).toMatch('Creating package api using preset nodejs');
        expect(stdout).toMatch('Installing dependencies');
        expect(stdout).toMatch('Running tests');
        expect(stdout).toMatch('Committing files');

        await expectGitCommit(pkg.root, `feat: new project ${pkg.fullname} created`);

        expect(join(pkg.root, 'package.json')).toMatchFileObject({
            'create-dtrw-app': {
                generatorVersion: packageJson.version,
                templatesUsed: {
                    ui: 'reactjs',
                    api: 'nodejs'
                }
            }
        });
        expect(join(pkg.root, 'packages')).toBeDirectory();
        expect(join(pkg.root, 'packages', 'ui')).toBeDirectory();
        expect(join(pkg.root, 'packages', 'api')).toBeDirectory();

        expect(join(pkg.root, 'docker-compose.yml')).toMatchFileObject({
            services: {
                api: expect.objectContaining({ container_name: `${pkg.name}_api` }),
                ui: expect.objectContaining({ container_name: `${pkg.name}_ui` }),
            }
        });

        expect(join(pkg.root, 'packages', 'ui', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ react: expect.any(String) }),
            'create-dtrw-app': {
                generatorVersion: packageJson.version,
                templateUsed: 'reactjs'
            }
        });
        expect(join(pkg.root, 'packages', 'api', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ fastify: expect.any(String) }),
            'create-dtrw-app': {
                generatorVersion: packageJson.version,
                templateUsed: 'nodejs'
            }
        });
    });

    it('should create project using starter', async ({ execCreate, pkg }) => {
        const { stdout } = await execCreate(pkg.name, '--no-create-github-repo', '-s', 'fullstack');

        expect(stdout).toMatch('Creating project root');
        expect(stdout).toMatch('Creating package frontend using preset reactjs');
        expect(stdout).toMatch('Creating package backend using preset nodejs');
        expect(stdout).toMatch('Installing dependencies');
        expect(stdout).toMatch('Running tests');
        expect(stdout).toMatch('Committing files');

        await expectGitCommit(pkg.root, `feat: new project ${pkg.fullname} created`);

        expect(join(pkg.root, 'package.json')).toMatchFileObject({
            'create-dtrw-app': {
                generatorVersion: packageJson.version,
                templatesUsed: {
                    frontend: 'reactjs',
                    backend: 'nodejs'
                }
            }
        });
        expect(join(pkg.root, 'packages')).toBeDirectory();
        expect(join(pkg.root, 'packages', 'frontend')).toBeDirectory();
        expect(join(pkg.root, 'packages', 'backend')).toBeDirectory();

        expect(join(pkg.root, 'docker-compose.yml')).toMatchFileObject({
            services: {
                backend: expect.objectContaining({ container_name: `${pkg.name}_backend` }),
                frontend: expect.objectContaining({ container_name: `${pkg.name}_frontend` }),
            }
        });

        expect(join(pkg.root, 'packages', 'frontend', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ react: expect.any(String) }),
            'create-dtrw-app': {
                generatorVersion: packageJson.version,
                templateUsed: 'reactjs'
            }
        });
        expect(join(pkg.root, 'packages', 'backend', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ fastify: expect.any(String) }),
            'create-dtrw-app': {
                generatorVersion: packageJson.version,
                templateUsed: 'nodejs'
            }
        });
    });

    it('should create project using starter with additional packages', async ({ execCreate, pkg }) => {
        const { stdout } = await execCreate(pkg.name, '--no-create-github-repo', '-s', 'fullstack', '-w', 'reactjs:admin');

        expect(stdout).toMatch('Creating project root');
        expect(stdout).toMatch('Creating package frontend using preset reactjs');
        expect(stdout).toMatch('Creating package backend using preset nodejs');
        expect(stdout).toMatch('Creating package admin using preset reactjs');
        expect(stdout).toMatch('Installing dependencies');
        expect(stdout).toMatch('Running tests');
        expect(stdout).toMatch('Committing files');

        await expectGitCommit(pkg.root, `feat: new project ${pkg.fullname} created`);

        expect(join(pkg.root, 'package.json')).toMatchFileObject({
            'create-dtrw-app': {
                generatorVersion: packageJson.version,
                templatesUsed: {
                    frontend: 'reactjs',
                    backend: 'nodejs',
                    admin: 'reactjs'
                }
            }
        });
        expect(join(pkg.root, 'packages')).toBeDirectory();
        expect(join(pkg.root, 'packages', 'frontend')).toBeDirectory();
        expect(join(pkg.root, 'packages', 'backend')).toBeDirectory();
        expect(join(pkg.root, 'packages', 'admin')).toBeDirectory();

        expect(join(pkg.root, 'docker-compose.yml')).toMatchFileObject({
            services: {
                backend: expect.objectContaining({ container_name: `${pkg.name}_backend` }),
                frontend: expect.objectContaining({ container_name: `${pkg.name}_frontend` }),
                admin: expect.objectContaining({ container_name: `${pkg.name}_admin` }),
            }
        });

        expect(join(pkg.root, 'packages', 'frontend', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ react: expect.any(String) }),
            'create-dtrw-app': {
                generatorVersion: packageJson.version,
                templateUsed: 'reactjs'
            }
        });
        expect(join(pkg.root, 'packages', 'backend', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ fastify: expect.any(String) }),
            'create-dtrw-app': {
                generatorVersion: packageJson.version,
                templateUsed: 'nodejs'
            }
        });
        expect(join(pkg.root, 'packages', 'admin', 'package.json')).toMatchFileObject({
            dependencies: expect.objectContaining({ react: expect.any(String) }),
            'create-dtrw-app': {
                generatorVersion: packageJson.version,
                templateUsed: 'reactjs'
            }
        });
    });

    it('should throw if trying to use multiple packages under same name', async ({ execCreate, pkg }) => {
        await expect(async () => {
            await execCreate(pkg.name, '--no-create-github-repo', '-w', 'reactjs:app', '-w', 'nodejs:app');
        }).rejects.toMatchObject({
            message: expect.stringContaining('Error: Package app is defined more than once')
        });

        expect(pkg.root).not.toBeDirectory();
    });

    it('should throw if trying to use starter and conflicting additional package', async ({ execCreate, pkg }) => {
        await expect(async () => {
            await execCreate(pkg.name, '--no-create-github-repo', '-s', 'fullstack', '-w', 'reactjs:frontend');
        }).rejects.toMatchObject({
            message: expect.stringContaining('Error: Starter fullstack already defines package frontend')
        });

        expect(pkg.root).not.toBeDirectory();
    });
});

function assertString(value: unknown): asserts value is string {
    if (typeof value !== 'string') {
        throw TypeError(`expected string, got ${typeof value}`);
    }
}
