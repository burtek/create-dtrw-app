import { createAuthDecorator } from '@dtrw/fastify-shared/plugins/authelia';
import { createPluginRegistry } from '@dtrw/fastify-shared/registry/registry';
import type { FastifyServerOptions } from 'fastify';
import { fastify } from 'fastify';
import { fastifyRawBody } from 'fastify-raw-body';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { errorHandler } from './errors/handler.js';
import healthController from './health/health.controller.js';
import healthService from './health/health.service.js';
import helloWorldController from './helloworld/helloworld.controller.js';


export async function createApp(opts: FastifyServerOptions = {}) {
    const app = fastify(opts);

    await app.register(fastifyRawBody, {
        field: 'rawBody',
        global: false,
        encoding: false,
        runFirst: true
    });

    app.setErrorHandler(errorHandler);

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    // Decorators
    app.register(createAuthDecorator());

    // Services
    createPluginRegistry(app)
        .use(healthService)
        .registerAll();

    // Controllers
    app.register(healthController, { prefix: '/health' });
    app.register(helloWorldController, { prefix: '/hello' });

    return {
        app,
        async shutdown(signal: string) {
            app.log.info(`Received ${signal}, shutting down gracefully...`);
            try {
                await app.close();
                app.log.info('Fastify closed. Bye!');
                // eslint-disable-next-line n/no-process-exit
                process.exit(0);
            } catch (err) {
                app.log.error(err, 'Error during shutdown');
                throw err;
            }
        }
    };
}
