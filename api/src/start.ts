import emitter, { emitAsyncSafe } from './emitter';
import env from './env';
import logger from './logger';
import checkForUpdate from 'update-check';
import pkg from '../package.json';

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
			checkForUpdate(pkg)
				.then((update) => {
					if (update) {
						logger.warn(`Update available: ${pkg.version} -> ${update.latest}`);
					}
				})
				.catch(() => {
					// No need to log/warn here. The update message is only an informative nice-to-have
				});

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
