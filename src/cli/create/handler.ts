import { mkdir } from "node:fs/promises";
import { scaffoldContext } from "../../core/context.js";
import { PRESETS, STARTERS } from "../../presets/index.js";
import { normalizeInitialPackages, logger, prechecks } from "./utils.js";
import { executeCreate } from "../../commands/create/index.js";

export const printAvailableConfigs = () => {
    prechecks(false);

    logger.log([
        '',
        'Available presets:',
        ...Object.entries(PRESETS).map(([name, desc]) => ` * ${name} - ${desc}`),
        '',
        'Available starters:',
        ...Object.entries(STARTERS).map(
            ([name, config]) => {
                const desc = Object.entries(config).map(([name, template]) => `${name} using ${template}`).join(', ')
                return ` * ${name}: ${desc}`;
            }
        ),
        ''
    ].join('\n'));
}

export const runCLI = async (name: string, options: Options) => {
    await prechecks();

    logger.debug('Analysing presets to use');

    const presetsToInclude = normalizeInitialPackages(options.starter, options.with);

    logger.debug('Presets to use: %j', [...presetsToInclude.entries()]);

    logger.debug('Creating project context');

    const context = await scaffoldContext({
        projectName: name,
        currentDir: process.env.FORCE_CWD ?? process.cwd(),
        presetsToInclude,
        install: options.install,
        commit: options.commit,
        createRepo: options.createGithubRepo
            ? ['github', options.createGithubRepo]
            : false
    });

    logger.debug('Project context created, using path: %s with %d packages',
        context.paths.projectRoot,
        context.scaffoldOptions.presetsToInclude.size
    );

    try {
        logger.debug('creating root directory');
        await mkdir(context.paths.projectRoot);
        logger.debug('done, executing create command');
        await executeCreate(context, logger);
    } catch (error) {
        switch ((error as NodeJS.ErrnoException).code) {
            case 'EEXISTS':
                logger.error(`Error creating ${context.paths.projectRoot}: path already exists`);
                break;
            case 'ENOENT':
                logger.error(`Error creating ${context.paths.projectRoot}: parent directory does not exist`);
                break;
            case 'EACCES':
                logger.error(`Error creating ${context.paths.projectRoot}: permission denied`);
                break;
            default:
                console.log(error)
                logger.error(`Error creating project: ${(error as NodeJS.ErrnoException | Error).message}`);
        }
        process.exit(1);
    }

    logger.success('Done!');
}

export const handler = (name: string, options: Options) => {
    logger.debug('handler entrypoint, analysing options');
    logger.debug('  name: %s', name);
    logger.debug('  options: %j', options);
    logger.debug('  argv: %j', process.argv);

    if (options.listAvailableConfigs) {
        return printAvailableConfigs();
    }

    return runCLI(name, options);
}

interface Options {
    with: [keyof typeof PRESETS, string][];
    starter?: keyof typeof STARTERS;
    listAvailableConfigs: boolean;
    commit: boolean;
    install: boolean;
    createGithubRepo: false | "public" | "private";
}
