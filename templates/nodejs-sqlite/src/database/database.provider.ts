import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { FastifyBaseLogger, FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import { env } from '../config.js';

import * as schema from './schemas/index.js';


const name = 'database-provider';
const decorator = 'database';
export const meta = { name, decorator } as const;

const makeDb = (database: Database.Database) => drizzle(database, { schema });
export type DB = ReturnType<typeof makeDb>;

class DatabaseProvider {
    private readonly dbInstance: Database.Database;
    private readonly drizzleDb: DB;

    constructor() {
        this.dbInstance = new Database(env.DB_FILE_NAME, { readonly: false });
        this.drizzleDb = makeDb(this.dbInstance);
    }

    closeDb() {
        this.dbInstance.close();
    }

    runMigrations(log: FastifyBaseLogger) {
        log.info('Database open, migrating...');
        migrate(this.drizzleDb, { migrationsFolder: env.DB_MIGRATIONS_FOLDER });
        log.info('Database migrated');
    }

    get db() {
        return this.drizzleDb;
    }
}

const databaseProvider: FastifyPluginCallback = (app, opts, done) => {
    const provider = new DatabaseProvider();

    app.decorate(decorator, provider);

    app.addHook('onClose', () => {
        app.log.info('Closing database...');
        provider.closeDb();
        app.log.info('Database closed');
    });

    done();
};

export default fp(databaseProvider, { name });

declare module 'fastify' {
    interface FastifyInstance {
        [decorator]: DatabaseProvider;
    }
}
