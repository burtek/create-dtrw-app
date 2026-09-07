import * as pkg from 'empathic/package';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import packageJson from '../../package.json' with { type: 'json' };
import { PRESETS } from '../presets/index.js';
import { PROJECT_NAME_PREFIX } from './const.js';


type Preset = keyof typeof PRESETS;

export interface ProjectContext {
    generator: {
        name: string;
        version: string;
        libRoot: string;
    };
    scaffoldOptions: {
        projectLongName: string;
        projectShortName: string;
        presetsToInclude: Map<string, Preset>;

        install: boolean;
        commit: boolean;
        createRepo: false | [provider: 'github', visibility: 'public' | 'private'];
    };
    paths: {
        cwd: string;
        projectRoot: string;
        projectPackages: string;
        projectPackage(name: string): string;
    }
}

export async function scaffoldContext(scaffoldOptions: ScaffoldOptions): Promise<ProjectContext> {
    const libRoot = pkg.up({ cwd: import.meta.dirname });
    if (!libRoot || packageJson.name !== JSON.parse(await readFile(libRoot, 'utf-8')).name) {
        throw new Error('Unable to locate @dtrw/create-dtrw-app root');
    }

    const projectShortName = scaffoldOptions.projectName.startsWith(PROJECT_NAME_PREFIX)
        ? scaffoldOptions.projectName.substring(PROJECT_NAME_PREFIX.length)
        : scaffoldOptions.projectName;
    const projectLongName = `${PROJECT_NAME_PREFIX}${projectShortName}`;

    const cwd = scaffoldOptions.currentDir,
          projectRoot = resolve(cwd, projectLongName),
          projectPackages = resolve(projectRoot, 'packages');

    return {
        generator: {
            name: packageJson.name,
            version: packageJson.version,
            libRoot
        },
        scaffoldOptions: {
            projectShortName,
            projectLongName,
            presetsToInclude: scaffoldOptions.presetsToInclude,
            install: scaffoldOptions.install,
            commit: scaffoldOptions.commit,
            createRepo: scaffoldOptions.createRepo,
        },
        paths: {
            cwd,
            projectRoot,
            projectPackages,
            projectPackage(name) {
                return resolve(projectPackages, name)
            },
        }
    }
}

interface ScaffoldOptions {
    projectName: string;
    currentDir: string;
    presetsToInclude: Map<string, Preset>;

    install: boolean;
    commit: boolean;
    createRepo: false | [provider: 'github', visibility: 'public' | 'private'];
}
