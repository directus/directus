import logger from '../../logger';
import { Express } from 'express';

export default async function start() {
	const { default: env } = require('../../env');
	const database = require('../../database');

	await database.validateDBConnection();

	const app: Express = require('../../app').default;

	const port = env.PORT;

	const server = app.listen(port, () => {
		logger.info(`Server started at port ${port}`);
	});

	const signals: NodeJS.Signals[] = ['SIGHUP', 'SIGINT', 'SIGTERM'];

	signals.forEach((signal) => {
		process.on(signal, async () => {
			let exitStatus = 0;

			try {
				await database.default.destroy();
				logger.info('Database connections destroyed');
			} catch (err) {
				logger.fatal(`Couldn't close database connections`);
				logger.error(err);
				exitStatus = 1;
			}

			server.close((err) => {
				if (err) {
					logger.fatal(`Couldn't close server`);
					logger.error(err);
					exitStatus = 1;
				} else {
					logger.info('Server closed');
				}

				if (exitStatus === 0) {
					logger.info('Directus shut down OK. Bye bye!');
				}

				process.exit(exitStatus);
			});
		});
	});
}
