#!/usr/bin/env node
import { gitResult$ } from '../../external-tools/index.js';
import { PRESETS, STARTERS } from '../../presets/index.js';
import { logger as rootLogger } from '../../utils/log.js';

type Preset = keyof typeof PRESETS;
type PresetNamePair = [preset: Preset, name: string];
type Starter = keyof typeof STARTERS;

export const logger = rootLogger.extend('create');

export async function prechecks(fatal = true) {
    logger.debug('checking prerequisites');

    const gitResult = await gitResult$;

    function die(msg: string) {
        if (fatal) {
            logger.error(msg);
            process.exit(1);
        } else {
            logger.warn(msg);
        }
    }

    if (!gitResult.available) {
        die('Git is not available. Please install git to use this tool.');
    } else if (gitResult.topLevel) {
        die('create-dtrw-app was called from within a repository. This tool should be used to create new project rather than extend one');
    }
}

export function normalizeInitialPackages(
    starter: Starter | undefined,
    presets: PresetNamePair[]
): Map<string, Preset> {
    const debug = logger.debug.extend('normalizer');

    const packages = new Map<string, Preset>();
    
    if (starter) {
        debug(`- using starter ${starter}`);
        const starterPackages = Object.entries(STARTERS[starter]);
        for (const [name, preset] of starterPackages) {
            debug(`  - adding package ${name} using preset ${preset}`);
            if (packages.has(name)) {
                throw new Error(`Broken starter ${starter}: ${name} package is defined more than once`);
            }
            if (!(preset in PRESETS)) {
                throw new Error(`Broken starter ${starter}: ${name} package is defined to use unknown preset ${preset}`);
            }
            packages.set(name, preset);
        }
    }

    debug('- conflicts analysis with starter');
    for (const [preset, name] of presets) {
        debug(`  - checking package ${name} using preset ${preset}`);
        if (packages.has(name)) {
            throw new Error(`Starter ${starter} already defines package ${name}`);
        }
    };

    debug('- conflicts analysis between packages');
    for (const [preset, name] of presets) {
        debug(`  - checking package ${name} using preset ${preset}`);
        if (packages.has(name)) {
            throw new Error(`Package ${name} is defined more than once`);
        }
        if (!(preset in PRESETS)) {
            throw new Error(`Unknown preset ${preset} for package ${name}`);
        }
        packages.set(name, preset);
    }

    debug('done');

    return packages;
}
