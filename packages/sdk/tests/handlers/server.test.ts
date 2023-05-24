import { Directus } from '../../src';
import { mockServer, URL } from '../utils';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

describe('server', function () {
	it(`ping the server`, async () => {
		mockServer.use(rest.get(URL + '/server/ping', (_req, res, ctx) => res(ctx.status(200), ctx.text('pong'))));

		const sdk = new Directus(URL);
		const str = await sdk.server.ping();

		expect(str).toBe('pong');
	});

	it(`get server info`, async () => {
		mockServer.use(rest.get(URL + '/server/info', (_req, res, ctx) => res(ctx.status(200))));

		const sdk = new Directus(URL);
		await expect(sdk.server.info()).resolves.not.toThrowError();
	});

	it(`get open api spec`, async () => {
		mockServer.use(
			rest.get(URL + '/server/specs/oas', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						openapi: '3.0.0',
					})
				)
			)
		);

		const sdk = new Directus(URL);
		const oas = await sdk.server.oas();

		expect(oas.openapi).toBe('3.0.0');
	});
});
