import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { PassThrough } from 'node:stream';
import express from 'express';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getRouteHandler } from '../test-utils/controllers.js';

const { getAppExtensionChunk } = vi.hoisted(() => ({ getAppExtensionChunk: vi.fn() }));

vi.mock('../database/index.js', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../extensions/index.js', () => ({
	getExtensionManager: () => ({ getAppExtensionChunk }),
}));

vi.mock('../middleware/respond.js', () => ({
	respond: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../services/extensions.js', () => ({
	ExtensionsService: vi.fn(),
	ExtensionReadError: class ExtensionReadError extends Error {},
}));

const { default: router } = await import('./extensions.js');

function deferred<T = void>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((r) => (resolve = r));
	return { promise, resolve };
}

function createApp() {
	const handlers = getRouteHandler(router, 'GET', '/sources/:chunk');
	const serveChunk = handlers.at(-1)!;

	const closed = deferred();

	const app = express();

	app.get(
		'/sources/:chunk',
		(_req, res, next) => {
			// Registered before the handler runs, so it always fires first
			res.on('close', () => closed.resolve());
			next();
		},
		(req, res, next) => serveChunk.handle(req, res, next),
	);

	return { app, closed: closed.promise };
}

let server: Server;

async function listen(app: express.Express) {
	server = createServer(app);
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(async () => {
	if (server?.listening) {
		server.closeAllConnections();
		await new Promise((resolve) => server.close(resolve));
	}
});

describe('GET /sources/:chunk', () => {
	/**
	 * The chunk stream holds an open file handle. If the client disconnects while it is being opened,
	 * nothing consumes or destroys it, so the handle is held for the lifetime of the process.
	 */
	test('destroys the chunk stream when the client disconnects while the stream is being opened', async () => {
		const sourceStream = new PassThrough();
		sourceStream.write('console.log("chunk")');

		const streamRequested = deferred();
		const releaseStream = deferred();

		getAppExtensionChunk.mockImplementation(async () => {
			streamRequested.resolve();
			await releaseStream.promise;
			return sourceStream;
		});

		const { app, closed } = createApp();
		const url = await listen(app);

		const controller = new AbortController();
		const request = fetch(`${url}/sources/index.js`, { signal: controller.signal });

		await streamRequested.promise;
		controller.abort();
		await expect(request).rejects.toThrowError(expect.objectContaining({ name: 'AbortError' }));
		await closed;

		releaseStream.resolve();
		await vi.waitFor(() => expect(sourceStream.destroyed).toBe(true));
	});

	test('destroys the chunk stream when the client disconnects while the body is being piped', async () => {
		const sourceStream = new PassThrough();
		sourceStream.write('console.log("chunk")');

		getAppExtensionChunk.mockResolvedValue(sourceStream);

		const { app, closed } = createApp();
		const url = await listen(app);

		const controller = new AbortController();
		const response = await fetch(`${url}/sources/index.js`, { signal: controller.signal });

		expect(response.status).toBe(200);

		controller.abort();
		await closed;

		await vi.waitFor(() => expect(sourceStream.destroyed).toBe(true));
	});
});
