/**
 * @jest-environment node
 */

import { Directus } from '../../src';
import { test } from '../utils';

describe('auth (node)', function () {
	test(`sets default auth mode to json`, async (url) => {
		const sdk = new Directus(url);
		expect(sdk.auth.mode).toBe('json');
	});

	test(`sends default auth mode`, async (url, nock) => {
		const scope = nock()
			.post('/auth/login', (body) => body.mode === 'json')
			.reply(200, {
				data: {
					access_token: 'access_token',
					refresh_token: 'refresh_token',
					expires: 60000,
				},
			});

		const sdk = new Directus(url);
		const loginPromise = sdk.auth.login({
			email: 'wolfulus@gmail.com',
			password: 'password',
		});

		await loginPromise;

		expect(scope.pendingMocks().length).toBe(0);
	});

	test(`logout sends a refresh token in body`, async (url, nock) => {
		nock()
			.post('/auth/login', (body) => body.mode === 'json')
			.reply(
				200,
				{
					data: {
						access_token: 'auth_token',
						refresh_token: 'json_refresh_token',
						expires: 60000,
					},
				},
				{
					'Set-Cookie': 'directus_refresh_token=my_refresh_token; Max-Age=604800; Path=/; HttpOnly;',
				}
			);

		nock()
			.post('/auth/logout', {
				refresh_token: 'json_refresh_token',
			})
			.reply(200, {
				data: {},
			});

		const sdk = new Directus(url);

		const loginPromise = sdk.auth.login({
			email: 'wolfulus@gmail.com',
			password: 'password',
		});

		await loginPromise;

		expect(sdk.auth.token).toBe('auth_token');

		const logoutPromise = sdk.auth.logout();

		await logoutPromise;

		expect(sdk.auth.token).toBeNull();
	});
});
