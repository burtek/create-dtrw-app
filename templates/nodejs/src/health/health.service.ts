import type { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import packageJson from '../../package.json' with { type: 'json' };


const name = 'health-service';
const decorator = 'healthService';
export const meta = { name, decorator } as const;

class HealthService {
    getVersion(): string {
        return packageJson.version;
    }
}

const healthService: FastifyPluginCallback = (app, opts, done) => {
    const service = new HealthService();

    app.decorate(decorator, service);

    done();
};

export default fp(healthService, { name });

declare module 'fastify' {
    interface FastifyInstance {
        [decorator]: HealthService;
    }
}
