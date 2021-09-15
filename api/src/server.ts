import { createTerminus, TerminusOptions } from '@godaddy/terminus';
import { Request } from 'express';
import * as http from 'http';
import * as https from 'https';
import { once } from 'lodash';
import qs from 'qs';
import url from 'url';
import createApp from './app';
import getDatabase from './database';
import env from './env';
import logger from './logger';
import emitter from './emitter';
import checkForUpdate from 'update-check';
import pkg from '../package.json';

export async function createServer(): Promise<http.Server> {
	const server = http.createServer(await createApp());

	server.on('request', function (req: http.IncomingMessage & Request, res: http.ServerResponse) {
		const startTime = process.hrtime();

		const complete = once(function (finished: boolean) {
			const elapsedTime = process.hrtime(startTime);
			const elapsedNanoseconds = elapsedTime[0] * 1e9 + elapsedTime[1];
			const elapsedMilliseconds = elapsedNanoseconds / 1e6;

			const previousIn = (req.socket as any)._metrics?.in || 0;
			const previousOut = (req.socket as any)._metrics?.out || 0;

			const metrics = {
				in: req.socket.bytesRead - previousIn,
				out: req.socket.bytesWritten - previousOut,
			};

			(req.socket as any)._metrics = {
				in: req.socket.bytesRead,
				out: req.socket.bytesWritten,
			};

			// Compatibility when supporting serving with certificates
			const protocol = server instanceof https.Server ? 'https' : 'http';

			// Rely on url.parse for path extraction
			// Doesn't break on illegal URLs
			const urlInfo = url.parse(req.originalUrl || req.url);

			const info = {
				finished,
				request: {
					aborted: req.aborted,
					completed: req.complete,
					method: req.method,
					url: urlInfo.href,
					path: urlInfo.pathname,
					protocol,
					host: req.headers.host,
					size: metrics.in,
					query: urlInfo.query ? qs.parse(urlInfo.query) : {},
					headers: req.headers,
				},
				response: {
					status: res.statusCode,
					size: metrics.out,
					headers: res.getHeaders(),
				},
				ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
				duration: elapsedMilliseconds.toFixed(),
			};

			emitter.emitAction('response', info, {
				database: getDatabase(),
				schema: req.schema,
				accountability: req.accountability ?? null,
			});
		});

		res.once('finish', complete.bind(null, true));
		res.once('close', complete.bind(null, false));
	});

	const terminusOptions: TerminusOptions = {
		timeout: 1000,
		signals: ['SIGINT', 'SIGTERM', 'SIGHUP'],
		beforeShutdown,
		onSignal,
		onShutdown,
	};

	createTerminus(server, terminusOptions);

	return server;

	async function beforeShutdown() {
		if (env.NODE_ENV !== 'development') {
			logger.info('Shutting down...');
		}
	}

	async function onSignal() {
		const database = getDatabase();
		await database.destroy();

		logger.info('Database connections destroyed');
	}

	async function onShutdown() {
		emitter.emitAction(
			'server.stop',
			{},
			{
				database: getDatabase(),
				schema: null,
				accountability: null,
			}
		);

		if (env.NODE_ENV !== 'development') {
			logger.info('Directus shut down OK. Bye bye!');
		}
	}
}

export async function startServer(): Promise<void> {
	const server = await createServer();

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

			logger.info(`Server started at http://localhost:${port}`);

			emitter.emitAction(
				'server.start',
				{},
				{
					database: getDatabase(),
					schema: null,
					accountability: null,
				}
			);
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
