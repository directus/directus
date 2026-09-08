import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { PassThrough } from 'node:stream';
import express from 'express';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getRouteHandler } from '../test-utils/controllers.js';

const { getAsset } = vi.hoisted(() => ({ getAsset: vi.fn() }));

vi.mock('../database/index.js', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../logger/index.js', () => ({
	useLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn(), trace: vi.fn() }),
}));

vi.mock('../middleware/is-locked.js', () => ({
	default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../services/payload.js', () => ({ PayloadService: vi.fn() }));
vi.mock('../services/files.js', () => ({ FilesService: vi.fn() }));
vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({ validateAccess: vi.fn() }));
vi.mock('../services/assets.js', () => ({ AssetsService: vi.fn(() => ({ getAsset })) }));

const { default: router } = await import('./assets.js');

function deferred<T = void>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((r) => (resolve = r));
	return { promise, resolve };
}

/**
 * Mounts only the final "return file" handler of `GET /:pk/:filename?`, with the response `locals`
 * the preceding query validation middleware would have set.
 */
function createApp() {
	const handlers = getRouteHandler(router, 'GET', '/:pk/:filename?');

	// Retarget deliberately: only the last layer serves the file
	expect(handlers).toHaveLength(3);

	const returnFile = handlers.at(-1)!;

	const closed = deferred();

	const app = express();

	app.get(
		'/:pk',
		(_req, res, next) => {
			res.locals['shortcuts'] = [];
			res.locals['transformation'] = {};
			// Registered before the handler runs, so it always fires first
			res.on('close', () => closed.resolve());
			next();
		},
		(req, res, next) => returnFile.handle(req, res, next),
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

describe('GET /:pk/:filename?', () => {
	/**
	 * The storage stream holds a socket from the driver's connection pool. If the client disconnects
	 * while the stream is still being opened, nothing consumes or destroys it, so the socket stays
	 * checked out of the agent forever. Once `maxSockets` worth of them accumulate, every subsequent
	 * storage call starves and times out, which `exists()` turns into a bare 403 for every asset.
	 */
	test('destroys the storage stream when the client disconnects while the stream is being opened', async () => {
		const sourceStream = new PassThrough();
		sourceStream.write('some-image-bytes');

		const streamRequested = deferred();
		const releaseStream = deferred();

		getAsset.mockImplementation(async () => ({
			file: { id: 'file-1', type: 'image/webp', filename_download: 'file-1.webp' },
			stat: { size: 16 },
			stream: async () => {
				streamRequested.resolve();
				await releaseStream.promise;
				return sourceStream;
			},
		}));

		const { app, closed } = createApp();
		const url = await listen(app);

		const controller = new AbortController();
		const request = fetch(`${url}/00000000-0000-0000-0000-000000000000`, { signal: controller.signal });

		// Disconnect mid-flight: after the storage stream was requested, before it resolved
		await streamRequested.promise;
		controller.abort();
		await expect(request).rejects.toThrowError(expect.objectContaining({ name: 'AbortError' }));
		await closed;

		releaseStream.resolve();
		await vi.waitFor(() => expect(sourceStream.destroyed).toBe(true));
	});

	test('serves the whole body to a client that stays connected', async () => {
		const sourceStream = new PassThrough();
		sourceStream.end('some-image-bytes');

		getAsset.mockImplementation(async () => ({
			file: { id: 'file-1', type: 'image/webp', filename_download: 'file-1.webp' },
			stat: { size: 16 },
			stream: async () => sourceStream,
		}));

		const { app } = createApp();
		const url = await listen(app);

		const response = await fetch(`${url}/00000000-0000-0000-0000-000000000000`);

		expect(response.status).toBe(200);
		await expect(response.text()).resolves.toBe('some-image-bytes');
	});

	test('destroys the storage stream when the client disconnects while the body is being piped', async () => {
		const sourceStream = new PassThrough();
		// Enough to flush the response headers, less than the announced size so the body stays open
		sourceStream.write('some-image-bytes');

		getAsset.mockImplementation(async () => ({
			file: { id: 'file-1', type: 'image/webp', filename_download: 'file-1.webp' },
			stat: { size: 1024 },
			stream: async () => sourceStream,
		}));

		const { app, closed } = createApp();
		const url = await listen(app);

		const controller = new AbortController();
		const response = await fetch(`${url}/00000000-0000-0000-0000-000000000000`, { signal: controller.signal });

		expect(response.status).toBe(200);

		controller.abort();
		await closed;

		await vi.waitFor(() => expect(sourceStream.destroyed).toBe(true));
	});
});
