import { stderr, stdout } from 'node:process';
import { format, styleText } from 'node:util';
import { createDebug } from 'obug';


class Logger {
    constructor(readonly debug = createDebug('dtrw', { log: this.log })) {}

    log(...args: unknown[]) {
        console.log(...args);
    }
    
    warn(...args: unknown[]) {
        stderr.write(styleText('yellow', format(...args), { stream: stderr }) + '\n');
    }
    
    error(...args: unknown[]) {
        stderr.write(styleText('red', format(...args), { stream: stderr }) + '\n');
    }

    success(...args: unknown[]) {
        stderr.write(styleText('green', format(...args), { stream: stderr }) + '\n');
    }

    // EXTEND

    extend(subnamespace: string): Logger {
        return new Logger(this.debug.extend(subnamespace));
    }
};

export const logger = new Logger();

export type { Logger };
