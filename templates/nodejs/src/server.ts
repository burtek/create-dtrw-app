import { createApp } from './app.js';
import { env } from './config.js';


const logLevels = {
    production: 'warn',
    development: 'info',
    test: 'silent'
};

async function bootstrap() {
    const { app, shutdown } = await createApp({ logger: { level: logLevels[env.NODE_ENV] } });

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    try {
        await app.listen({
            port: env.PORT,
            host: '0.0.0.0'
        });
    } catch (error: unknown) {
        app.log.error(error);
        throw error;
    }
}

void bootstrap();
