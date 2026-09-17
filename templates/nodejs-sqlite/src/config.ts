import { resolve } from 'node:path';

import 'dotenv/config';
import { z } from 'zod/v4';


const DEFAULT_PORT = 4000;

/* eslint-disable @typescript-eslint/naming-convention */
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).nonoptional(),
    PORT: z.coerce.number().default(DEFAULT_PORT),
    LOGS_FILE: z.string().optional(),
    DB_FILE_NAME: z.string().nonempty().transform(path => resolve(import.meta.dirname, '..', path)),
    DB_MIGRATIONS_FOLDER: z.string().nonempty().transform(path => resolve(import.meta.dirname, '..', path))
});
/* eslint-enable @typescript-eslint/naming-convention */

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    throw new Error('Environment validation failed', { cause: parsedEnv.error });
}

export const env = parsedEnv.data;
