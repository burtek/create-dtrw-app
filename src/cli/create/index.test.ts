import { handler } from './handler.js';

vitest.mock('./handler.js', () => ({ handler: vitest.fn() }));
vitest.mock('./utils.js');


describe('create CLI', () => {
    describe('sade argv parsing', () => {
        const originalArgv = process.argv;

        afterEach(() => {
            process.argv = originalArgv;
            vitest.resetModules();
        });

        const defaults = {
            commit: true,
            install: true,
            'createGithubRepo': 'public',
            'listAvailableConfigs': false,
            with: [],
            starter: undefined
        }

        it.each([
            {
                argv: ['app'],
                expected: {
                    name: 'app', 
                    options: { ...defaults }
                }
            },
            {
                argv: ['app', '-l'],
                expected: {
                    name: 'app', 
                    options: { ...defaults, 'listAvailableConfigs': true }
                }
            },
            {
                argv: ['app', '-w', 'reactjs:admin', '-s', 'fullstack', '-w', 'nodejs:api-proxy'],
                expected: {
                    name: 'app', 
                    options: { ...defaults, 'with': [['reactjs','admin'], ['nodejs','api-proxy']], starter: 'fullstack' }
                }
            },
            {
                argv: ['app', '--no-commit'],
                expected: {
                    name: 'app', 
                    options: { ...defaults, commit: false }
                }
            },
            {
                argv: ['app', '--no-create-github-repo'],
                expected: {
                    name: 'app', 
                    options: { ...defaults, createGithubRepo: false }
                }
            },
        ])('should properly parse args $argv', async ({ argv, expected }) => {
            process.argv = ['node', 'create-cli.js', ...argv];
            
            await vitest.importActual('./index.js');

            expect(vitest.mocked(handler)).toHaveBeenCalledWith(expected.name, expected.options)
        })
    })
})
