import emitter, { emitAsyncSafe } from './emitter';
import env from './env';
import logger from './logger';

// If this file is called directly using node, start the server
if (require.main === module) {
	start();
}

export default async function start(): Promise<void> {
	const createServer = require('./server').default;

	const server = await createServer();

	await emitter.emitAsync('server.start.before', { server });

	const port = env.PORT;

	server
		.listen(port, () => {
			logger.info(`Server started at port ${port}`);
			emitAsyncSafe('server.start');
		})
		.once('error', (err: any) => {
			if (err?.code === 'EADDRINUSE') {
				logger.error(`Port ${port} is already in use`);
				process.exit(1);
			} else {
				throw err;
			}
		});
}
