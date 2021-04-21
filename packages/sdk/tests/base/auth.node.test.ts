/**
 * @jest-environment node
 */

import { Auth, AxiosTransport, Directus, MemoryStorage } from '../../src';
import { test } from '../utils';

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
		jest.useFakeTimers();

		const scope = nock();

		scope
			.post('/auth/login', (body) => body.mode === 'json')
			.reply(200, {
				data: {
					access_token: 'some_access_token',
					refresh_token: 'some_refresh_token',
					expires: 60000,
				},
			});

		scope
			.post('/auth/refresh', {
				refresh_token: 'some_refresh_token',
			})
			.reply(200, {
				data: {
					access_token: 'a_new_access_token',
					refresh_token: 'a_new_refresh_token',
					expires: 60000,
				},
			});

		const sdk = new Directus(url);
		await sdk.auth.login(
			{
				email: 'wolfulus@gmail.com',
				password: 'password',
			},
			{
				refresh: {
					auto: true,
				},
			}
		);

		jest.advanceTimersByTime(30000);
		expect(scope.pendingMocks().length).toBe(1);

		jest.advanceTimersByTime(25000);

		// Refresh is done in background, need to wait for it to complete
		await new Promise((resolve) => {
			jest.useRealTimers();
			setTimeout(resolve, 100);
			jest.useFakeTimers();
		});

		expect(scope.pendingMocks().length).toBe(0);
		expect(sdk.auth.token).toBe('a_new_access_token');

		jest.clearAllTimers();
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
