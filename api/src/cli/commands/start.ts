import logger from '../../logger';
import { Express } from 'express';
import { createTerminus, TerminusOptions } from '@godaddy/terminus';
import http from 'http';
import emitter from '../../emitter';

export default async function start() {
	const { default: env } = require('../../env');
	const database = require('../../database');

	await database.validateDBConnection();

	const app: Express = require('../../app').default;
	const port = env.PORT;

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

	server.listen(port);
	logger.info(`Server started at port ${port}`);

	async function beforeShutdown() {
		emitter.emit('destroy');
		logger.info('Shutting down Directus');
	}

	async function onSignal() {
		await database.default.destroy();
		logger.info('Database connections destroyed');
	}

	async function onShutdown() {
		logger.info('Directus shut down OK. Bye bye!');
	}
}
