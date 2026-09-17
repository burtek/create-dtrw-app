import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { routeFp } from '../helpers/route-plugin.js';

import { meta as helloWorldServiceMeta } from './helloworld.service.js';


const helloWorldController: FastifyPluginCallback = (instance, options, done) => {
    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/',
        async () => {
            const hello = await f.helloWorldService.getFileContents();

            return hello.trim();
        }
    );

    done();
};

export default routeFp(helloWorldController, {
    dependencies: [helloWorldServiceMeta.name],
    decorators: { fastify: [helloWorldServiceMeta.decorator] }
});
