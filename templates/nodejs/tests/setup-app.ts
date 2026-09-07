import { createApp } from '../src/app';


export const setupApp = async ({ closeAfterAll = true } = {}) => {
    const { app } = await createApp({ logger: { level: 'warn' } });

    afterAll(async () => {
        if (closeAfterAll) {
            await app.close();
        }
    });

    return await app;
};
