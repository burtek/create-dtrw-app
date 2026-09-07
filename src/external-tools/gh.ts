import { exec } from "../utils/exec.js";
import { logger } from "../utils/log.js";

export async function checkGh(): Promise<Result> {
    const log = logger.extend('tool:gh');

    log.debug('checking tool availability');

    try {
        const { stdout } = await exec('gh', ['api', 'user', '--jq', '.login']);

        log.debug(`authenticated with user ${stdout.trim()}`);
        
        return {
            tool: 'gh',
            available: true,
            authenticated: true,
            username: stdout.trim(),
        };
    } catch (error) {
        if (isCommandNotFound(error)) {
            log.debug('unavailable');

            return {
                tool: 'gh',
                available: false,
                authenticated: false,
                username: null,
            };
        }

        log.debug('unauthenticated');
        
        return {
            tool: 'gh',
            available: true,
            authenticated: false,
            username: null,
        };
    } finally {
        log.debug('done')
    }
}

function isCommandNotFound(error: unknown) {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
    );
}

type Result = {
    tool: "gh";
    available: false;
    authenticated: false;
    username: null;
} | {
    tool: "gh";
    available: true;
    authenticated: false;
    username: null;
} | {
    tool: "gh";
    available: true;
    authenticated: true;
    username: string;
};
