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
		.listen(port, async () => {
			let update = null;

			try {
				update = await checkForUpdate(pkg);
			} catch (err) {
				// eslint-disable-next-line no-console
				console.log(err);
			}

			if (update) {
				logger.warn(`New Version Available (${update.latest})\nYou can update by running: npx ${pkg.name}@latest [command]
				`);
			}

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
