import { exec } from "../utils/exec.js";
import { logger } from "../utils/log.js";

export async function checkGit(): Promise<Result> {
    const log = logger.extend('tool:git');

    log.debug('checking tool availability');

    const [
        versionResult,
        defaultBranchResult,
        userNameResult,
        emailResult,
        topLevelResult
    ] = await Promise.allSettled([
        exec('git', ['-v']),
        exec('git', ['config', '--global', 'init.defaultBranch']),
        exec('git', ['config', '--global', 'user.name']),
        exec('git', ['config', '--global', 'user.email']),
        exec('git', ['rev-parese', '--show-toplevel'])
    ]);

    if (versionResult.status === 'rejected') {
        log.debug('unavailable');
        return { tool: 'git', available: false };
    }
    
    const defaultBranch = defaultBranchResult.status === 'rejected'
        ? 'master'
        : defaultBranchResult.value.stdout.trim() || 'master';

    const topLevel = topLevelResult.status === 'rejected'
        ? false
        : topLevelResult.value.stdout.trim();

    const user = userNameResult.status === 'rejected'
        ? undefined
        : userNameResult.value.stdout.trim() || undefined;

    const email = emailResult.status === 'rejected'
        ? undefined
        : emailResult.value.stdout.trim() || undefined;

    log.debug(`available, branch=${defaultBranch}, topLevel=${topLevel}`);
    log.debug('done');
    return { tool: 'git', available: true, defaultBranch, topLevel, user, email };
}

type Result = {
    tool: "git";
    available: true;
    defaultBranch: string;
    topLevel: false | string;
    user: string | undefined;
    email: string | undefined;
} | {
    tool: "git";
    available: false;
}
