/**
 * @jest-environment jsdom
 */

import { Directus } from '../../src';
import { test } from '../utils';

describe('auth (browser)', function () {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	test(`sets default auth mode to cookie`, async (url) => {
		const sdk = new Directus(url, { auth: { mode: 'cookie' } });
		expect(sdk.auth.mode).toBe('cookie');
	});

	test(`sends default auth mode`, async (url, nock) => {
		const scope = nock()
			.post('/auth/login', (body) => body.mode === 'cookie')
			.reply(200, {
				data: {
					access_token: 'access_token',
					refresh_token: 'refresh_token',
					expires: 60000,
				},
			});

		const sdk = new Directus(url);

		await sdk.auth.login({
			email: 'wolfulus@gmail.com',
			password: 'password',
		});

		expect(scope.pendingMocks().length).toBe(0);
	});

	test(`logout doesn't send a refresh token due to cookie mode`, async (url, nock) => {
		nock()
			.post('/auth/login', (body) => body.mode === 'cookie')
			.reply(
				200,
				{
					data: {
						access_token: 'some_access_token',
						expires: 60000,
					},
				},
				{
					'Set-Cookie': 'directus_refresh_token=my_refresh_token; Max-Age=604800; Path=/; HttpOnly;',
				}
			);

		nock().post('/auth/logout', {}).matchHeader('cookie', 'directus_refresh_token=my_refresh_token').reply(200, {
			data: {},
		});

		const sdk = new Directus(url);

		await sdk.auth.login({
			email: 'wolfulus@gmail.com',
			password: 'password',
		});

		expect(sdk.auth.token).toBe('some_access_token');

		await sdk.auth.logout();

		expect(sdk.auth.token).toBeNull();
	});
});
