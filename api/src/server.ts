import logger from './logger';
import { createTerminus, TerminusOptions } from '@godaddy/terminus';
import http from 'http';
import emitter from './emitter';
import database, { validateDBConnection } from './database';
import app from './app';
import env from './env';

const server = http.createServer(app);

const terminusOptions: TerminusOptions = {
	timeout: 1000,
	signals: ['SIGINT', 'SIGTERM', 'SIGHUP'],
	beforeShutdown,
	onSignal,
	onShutdown,
	logger: logger.info,
};

createTerminus(server, terminusOptions);

export default server;

export async function start() {
	await validateDBConnection();
	await emitter.emitAsync('server.start.before', { server });

	const port = env.PORT;

	server
		.listen(port, () => {
			logger.info(`Server started at port ${port}`);
			emitter.emitAsync('server.start').catch((err) => logger.warn(err));
		})
		.once('error', (err: any) => {
			if (err?.code === 'EADDRINUSE') {
				logger.fatal(`Port ${port} is already in use`);
				process.exit(1);
			} else {
				throw err;
			}
		});
}

async function beforeShutdown() {
	await emitter.emitAsync('server.stop.before', { server });

	if (process.env.NODE_ENV === 'development') {
		logger.info('Restarting...');
	} else {
		logger.info('Shutting down...');
	}
}

async function onSignal() {
	await database.destroy();
	logger.info('Database connections destroyed');
}

async function onShutdown() {
	emitter.emitAsync('server.stop').catch((err) => logger.warn(err));

	if (process.env.NODE_ENV !== 'development') {
		logger.info('Directus shut down OK. Bye bye!');
	}
}
