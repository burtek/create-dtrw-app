import type { ErrorType } from './type.js';


export class AppError extends Error {
    constructor(readonly type: ErrorType, message: string) {
        super(message);
    }
}

export { ErrorType } from './type.js';
