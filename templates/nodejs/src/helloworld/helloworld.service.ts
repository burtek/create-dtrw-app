import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import { Asset, getAssetText } from '../assets/index.js';


const name = 'helloWorld-service';
const decorator = 'helloWorldService';
export const meta = { name, decorator } as const;

class HelloWorldService {
    constructor(private readonly app: FastifyInstance) {
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

export default fp(helloWorldService, { name });

declare module 'fastify' {
    interface FastifyInstance {
        [decorator]: HelloWorldService;
    }
}
