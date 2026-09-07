import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { routeFp } from '../helpers/route-plugin.js';


const helloWorldController: FastifyPluginCallback = (instance, options, done) => {
    const f = instance.withTypeProvider<ZodTypeProvider>();

    f.get(
        '/',
        () => 'Hello world'
    );

    done();
};

export default routeFp(helloWorldController);
