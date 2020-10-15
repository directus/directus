import logger from './logger';
import { createTerminus, TerminusOptions } from '@godaddy/terminus';
import http from 'http';
import emitter from './emitter';
import database from './database';
import app from './app';

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
