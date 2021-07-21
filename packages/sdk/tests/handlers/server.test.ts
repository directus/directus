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
});
