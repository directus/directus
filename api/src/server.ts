import type { TerminusOptions } from '@godaddy/terminus';
import { createTerminus } from '@godaddy/terminus';
import type { Request } from 'express';
import * as http from 'http';
import * as https from 'https';
import { once } from 'lodash-es';
import qs from 'qs';
import url from 'url';
import createApp from './app.js';
import getDatabase from './database/index.js';
import emitter from './emitter.js';
import env from './env.js';
import logger from './logger.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';

export let SERVER_ONLINE = true;

export async function createServer(): Promise<http.Server> {
	const server = http.createServer(await createApp());

	Object.assign(server, getConfigFromEnv('SERVER_'));

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
		timeout:
			env['SERVER_SHUTDOWN_TIMEOUT'] >= 0 && env['SERVER_SHUTDOWN_TIMEOUT'] < Infinity
				? env['SERVER_SHUTDOWN_TIMEOUT']
				: 1000,
		signals: ['SIGINT', 'SIGTERM', 'SIGHUP'],
		beforeShutdown,
		onSignal,
		onShutdown,
	};

	createTerminus(server, terminusOptions);

	return server;

	async function beforeShutdown() {
		if (env['NODE_ENV'] !== 'development') {
			logger.info('Shutting down...');
		}

		SERVER_ONLINE = false;
	}

	async function onSignal() {
		const database = getDatabase();
		await database.destroy();

		logger.info('Database connections destroyed');
	}

	async function onShutdown() {
		emitter.emitAction(
			'server.stop',
			{ server },
			{
				database: getDatabase(),
				schema: null,
				accountability: null,
			}
		);

		if (env['NODE_ENV'] !== 'development') {
			logger.info('Directus shut down OK. Bye bye!');
		}
	}
}

export async function startServer(): Promise<void> {
	const server = await createServer();

	const host = env['HOST'];
	const port = env['PORT'];

	server
		.listen(port, host, () => {
			logger.info(`Server started at http://${host}:${port}`);

			emitter.emitAction(
				'server.start',
				{ server },
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
