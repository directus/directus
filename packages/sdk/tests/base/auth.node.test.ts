/**
 * @jest-environment node
 */

import { Auth, AxiosTransport, Directus, MemoryStorage } from '../../src';
import { test, timers } from '../utils';

describe('auth (node)', function () {
	test(`sets default auth mode to json`, async (url) => {
		const storage = new MemoryStorage();
		const transport = new AxiosTransport(url, storage);
		const auth = new Auth(transport, storage);
		expect(auth.options.mode).toBe('json');
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
		await sdk.auth.login({
			email: 'wolfulus@gmail.com',
			password: 'password',
		});

		expect(scope.pendingMocks().length).toBe(0);
	});

	test(`authentication should auto refresh after specified period`, async (url, nock) => {
		const scope = nock();

		scope
			.post('/auth/login', (body) => body.mode === 'json')
			.reply(200, {
				data: {
					access_token: 'some_node_access_token',
					refresh_token: 'some_node_refresh_token',
					expires: 5000,
				},
			});

		scope
			.post('/auth/refresh', {
				refresh_token: 'some_node_refresh_token',
			})
			.reply(200, {
				data: {
					access_token: 'a_new_node_access_token',
					refresh_token: 'a_new_node_refresh_token',
					expires: 5000,
				},
			});

		await timers(async ({ tick, flush }) => {
			const sdk = new Directus(url);
			await sdk.auth.login(
				{
					email: 'wolfulus@gmail.com',
					password: 'password',
				},
				{
					refresh: {
						auto: true,
						time: 2500,
					},
				}
			);

			await tick(2000);

			expect(scope.pendingMocks().length).toBe(1);
			expect(sdk.auth.expiring).toBe(false);

			await tick(500);

			expect(scope.pendingMocks().length).toBe(1);
			expect(sdk.auth.expiring).toBe(true);

			await new Promise((resolve) => {
				scope.once('replied', () => {
					flush().then(resolve);
				});
			});

			expect(sdk.storage.auth_expires).toBe(107500);

			expect(sdk.auth.expiring).toBe(false);
		}, 100000);

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

		await sdk.auth.login({
			email: 'wolfulus@gmail.com',
			password: 'password',
		});

		expect(sdk.auth.token).toBe('auth_token');

		await sdk.auth.logout();

		expect(sdk.auth.token).toBeNull();
	});
});
