import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from './index.js';


export function errorHandler(error: Error, request: FastifyRequest, reply: FastifyReply) {
    if (error instanceof AppError) {
        reply.code(error.type).send({ success: false, error: error.message });
    } else {
        reply.send(error);
    }
}
