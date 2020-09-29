import logger from '../../logger';
import { Express } from 'express';

export default async function start() {
	const { default: env } = require('../../env');
	const { validateDBConnection } = require('../../database');

	await validateDBConnection();

	const app: Express = require('../../app').default;

	const port = env.PORT;

	const server = app.listen(port, () => {
		logger.info(`Server started at port ${port}`);
	});

	const signals: NodeJS.Signals[] = ['SIGHUP', 'SIGINT', 'SIGTERM'];
	signals.forEach((signal) => {
		process.on(signal, () =>
			server.close((err) => {
				if (err) {
					logger.error(err.message, { err });
					return;
				}
				logger.info('Server stopped.');
			})
		);
	});
}
