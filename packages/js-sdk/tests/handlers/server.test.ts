/**
 * @jest-environment node
 */

import { Directus } from '../../src';
import { test } from '../utils';

describe('server', function () {
	test(`ping the server`, async (url, nock) => {
		nock().get('/server/ping').reply(200, 'pong', { 'Content-Type': 'text/plain' });

		const sdk = new Directus(url);
		const str = await sdk.server.ping();

		expect(str).toBe('pong');
	});

	test(`get server info`, async (url, nock) => {
		const scope = nock().get('/server/info').reply(200, {});

		const sdk = new Directus(url);
		await sdk.server.info();

		expect(scope.pendingMocks().length).toBe(0);
	});

	test(`get open api spec`, async (url, nock) => {
		nock().get('/server/specs/oas').reply(
			200,
			{
				openapi: '3.0.0',
			},
			{ 'Content-Type': 'application/json' }
		);

		const sdk = new Directus(url);
		const oas = await sdk.server.oas();

		expect(oas.openapi).toBe('3.0.0');
	});
});
