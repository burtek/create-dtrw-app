import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import { Asset, getAssetText } from '../assets/index.js';
import { meta as databaseProviderMeta } from '../database/database.provider.js';
import { dummy } from '../database/schemas/dummy.js';


const name = 'helloWorld-service';
const decorator = 'helloWorldService';
export const meta = { name, decorator } as const;

class HelloWorldService {
    constructor(private readonly app: FastifyInstance) {
    }

    async getDBEntry() {
        let result = await this.app.database.db.query.dummy.findFirst();

        if (!result) {
            [result] = await this.app.database.db.insert(dummy).values({ name: 'some name' }).returning();
        }

        return result;
    }

    async getFileContents() {
        return await getAssetText(Asset.HELLO);
    }
}

const helloWorldService: FastifyPluginCallback = (app, opts, done) => {
    const service = new HelloWorldService(app);

    app.decorate(decorator, service);

    done();
};

export default fp(helloWorldService, {
    dependencies: [databaseProviderMeta.name],
    decorators: { fastify: [databaseProviderMeta.decorator] },
    name
});

declare module 'fastify' {
    interface FastifyInstance {
        [decorator]: HelloWorldService;
    }
}
