import { ProjectContext } from "../../core/context.js";
import { ghResult$, gitResult$ } from "../../external-tools/index.js";
import { getPreset } from "../../presets/index.js";
import { exec } from "../../utils/exec.js";
import { Logger } from "../../utils/log.js";

export async function executeCreate(
    context: ProjectContext,
    logger: Logger
) {
    const cwd = context.paths.projectRoot;

    logger.log('🏗️  Creating project root...');
    logger.debug('executing preset: workspace-root');
    await getPreset('workspace-root').execute(context, context.scaffoldOptions.projectShortName);

    const presetsToInclude = [...context.scaffoldOptions.presetsToInclude.entries()];

    for (const [name, preset] of presetsToInclude) {
        logger.log(`📦 Creating package ${name} using preset ${preset}...`);
        logger.debug('executing preset: %s', preset);
        await getPreset(preset).execute(context, name);
    }

    const userAgent = process.env.npm_config_user_agent?.split(' ')[0];
    const pkgManager = ((): [manager: string, installArgs: string[], testsArgs: string[]] => {
        switch (true) {
            case userAgent?.startsWith('pnpm/'): return ['pnpm', ['install'], ['run', 'test']];
            case userAgent?.startsWith('yarn/'): return ['yarn', ['install'], ['run', 'test']];
            default: return ['npm/', ['install'], ['run', 'test']];
        }
    })();

    await runStep(logger, cwd, 'git', ['init'], '🌱 Initialising git repo...');

    if (context.scaffoldOptions.install) {
        await runStep(logger, cwd, pkgManager[0], pkgManager[1], '📥 Installing dependencies...',
            stdout => stdout.split('\n').find(line => line.startsWith('Progress')) ?? ''
        );

        if (context.scaffoldOptions.presetsToInclude.size > 0) {
            await runStep(logger, cwd, pkgManager[0], pkgManager[2], '🧪 Running tests...', true);
        } else {
            logger.log(`⏭️ Skipping tests because no packages were added`);
        }
    } else {
        logger.log(`⏭️ Skipping dependencies installation`);
    }

    if (context.scaffoldOptions.commit) {
        await runStep(logger, cwd, 'git', ['add', '-A'], '📝 Committing files...');
        await runStep(logger, cwd, 'git',
            ['commit', '-m', `feat: new project ${context.scaffoldOptions.projectLongName} created`]
        );
    }

    if (context.scaffoldOptions.createRepo) {
        const [provider, visibility] = context.scaffoldOptions.createRepo;
        const gh = await ghResult$;

        if (!gh.available) {
            logger.log(`⏭️ gh not installed, skipping github repo creation`);
        } else if (!gh.authenticated) {
            logger.log(`⏭️ gh not authenticated, skipping github repo creation`);
        } else {
            switch (provider) {
                case 'github':
                    await runStep(logger, cwd, 'gh',
                        ['repo', 'create', context.scaffoldOptions.projectLongName, `--${visibility}`, '--disable-wiki',
                            '--description', `${context.scaffoldOptions.projectShortName} project`, '--source=.', '--remote=origin'],
                        '🚀 bootstrapping github repo', true
                    );
                    logger.log('GitHub repo created.\n'
                        + `Please set all required secrets in the repo at https://github.com/${gh.username}/${context.scaffoldOptions.projectLongName}/settings/secrets/actions`
                        + 'After those are set, push commits to the repo and make sure the build and deploy passes.');
                    break;
                default:
                    logger.error(`Unknown git provider: ${provider}`);
            }
        }
    }
}

async function runStep(
    logger: Logger,
    cwd: string,
    cmd: string,
    args: string[],
    label?: string,
    processOutput?: ((stdout: string) => string) | boolean
) {
    if (label) {
        logger.log(label);
    }
    logger.debug('executing %s %j', cmd, args);

    const result = await exec(cmd, args, { cwd });
    
    if (processOutput) {
        logger.log('   ' + (processOutput === true ? result.stdout : processOutput(result.stdout)));
    }

    return result;
}
