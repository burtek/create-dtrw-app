#!/usr/bin/env node
import { Command, InvalidArgumentError, Option, program } from '@commander-js/extra-typings';
import packageJson from '../../../package.json' with { type: 'json' };
import { handler } from './handler.js';
import { logger } from './utils.js';
import { PRESETS, STARTERS } from '../../presets/index.js';
import { PROJECT_NAME_PREFIX } from '../../core/const.js';

logger.success(packageJson.name);

logger.debug('initialising sade');

const cli = new Command(packageJson.name)
    .description('Create a dtrw-app using one or more predefined presets')
    .argument('[name]', `name of the project to create.\nWill be prefixed with '${PROJECT_NAME_PREFIX}' unless manually prefixed.\nRequired unless --list-available-configs is specified`)
    .option(
        '-w, --with <template:name>',
        `add a package to generated project (see --list-available-configs)`,
        function collect(value, prev) {
            const values = value.split(':');
            if (values.length !== 2 || values.some(x => !x)) {
                throw new InvalidArgumentError(`Option must have <template>:<name> format, got ${value}`)
            }
            if (!(values[0] in PRESETS)) {
                throw new InvalidArgumentError(`Option must have <template>:<name> format.\n    See --list-available-configs for available templates`)
            }
            return [...prev, value.split(':') as [keyof typeof PRESETS, string]]
        },
        [] as [keyof typeof PRESETS, string][]
    )
    .addOption(
        new Option(
            '-s, --starter <name>',
            'use predefined starter config (can only be specified once, see --list-available-configs)',
        )
            .choices(Object.keys(STARTERS) as Array<keyof typeof STARTERS>)
            .default(undefined as keyof typeof STARTERS | undefined)
    )
    .option('-l, --list-available-configs', 'list all available starters and presets', false)
    .option('--no-commit', 'do not git-commit project after creation')
    .option('--no-install', 'don not run install after project creation')
    .addOption(
        new Option(
            '--create-github-repo <visibility>',
            'create GitHub repo and push to it after committing files, visibility (can be disabled with --no-create-github-repo)'
        )
            .choices(['public', 'private'])
            .default('public')
    )
    .option('--no-create-github-repo', 'disable creating GitHub repo')
    .version(packageJson.version)
    .action((name, opts) => {
        if (!name && !opts.listAvailableConfigs) {
            logger.error('name argument is required');
            process.exit(1);
        }
        // we can be sure that the invalid '' default will only be used when listAvailableConfigs is true
        handler(name ?? '', opts);
    });

logger.debug('parsing args')
cli.parse(process.argv);
