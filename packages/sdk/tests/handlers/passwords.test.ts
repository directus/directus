/**
 * @jest-environment node
 */

import { Directus } from '@/src/index.js';
import { test } from '@/tests/utils.js';

describe('password', function () {
	test(`request`, async (url, nock) => {
		const scope = nock()
			.post('/auth/password/request', {
				email: 'admin@example.com',
				reset_url: 'http://some_url.com',
			})
			.reply(200, {});

		const sdk = new Directus(url);
		await sdk.auth.password.request('admin@example.com', 'http://some_url.com');

		expect(scope.pendingMocks().length).toBe(0);
	});

	test(`reset`, async (url, nock) => {
		const scope = nock()
			.post('/auth/password/reset', {
				token: 'token',
				password: 'newpassword',
			})
			.reply(200, {});

		const sdk = new Directus(url);
		await sdk.auth.password.reset('token', 'newpassword');

		expect(scope.pendingMocks().length).toBe(0);
	});
});
