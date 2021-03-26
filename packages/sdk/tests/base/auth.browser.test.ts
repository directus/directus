/**
 * @jest-environment jest-environment-jsdom-global
 */

import { Auth, AxiosTransport, Directus, MemoryStorage } from '../../src';
import { test } from '../utils';

describe('auth (browser)', function () {
	test(`sets default auth mode to cookie`, async (url) => {
		const storage = new MemoryStorage();
		const transport = new AxiosTransport(url, storage);
		const auth = new Auth(transport, storage);
		expect(auth.options.mode).toBe('cookie');
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

	test(`authentication should auto refresh after specified period`, async (url, nock) => {
		jest.useFakeTimers();

		const scope = nock();

		scope
			.post('/auth/login', (body) => body.mode === 'cookie')
			.reply(
				200,
				{
					data: {
						access_token: 'access_token',
						expires: 60000,
					},
				},
				{
					'Set-Cookie': 'directus_refresh_token=the_refresh_token; Max-Age=604800; Path=/; HttpOnly;',
				}
			);

		scope
			.post('/auth/refresh')
			.matchHeader('cookie', 'directus_refresh_token=the_refresh_token')
			.reply(200, {
				data: {
					access_token: 'new_access_token',
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
		expect(sdk.auth.token).toBe('new_access_token');

		jest.clearAllTimers();
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
