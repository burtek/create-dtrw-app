import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { routeFp } from '../helpers/route-plugin.js';

import { meta as healthServiceMeta } from './health.service.js';


const healthController: FastifyPluginCallback = (instance, options, done) => {
    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/',
        { logLevel: 'silent' },
        () => ({
            status: 'ok',
            errors: [],
            timestamp: new Date().toISOString(),
            uptime: process.uptime(), // seconds
            commit: process.env.COMMIT_SHA ?? 'dev',
            version: f.healthService.getVersion(),
            nodeVersion: process.version,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            platform: process.platform,
            arch: process.arch,
            freeMemory: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed
        })
    );

    done();
};

export default routeFp(healthController, {
    dependencies: [healthServiceMeta.name],
    decorators: { fastify: [healthServiceMeta.decorator] }
});
