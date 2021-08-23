/**
 * @jest-environment jsdom
 */

import { Auth, AxiosTransport, Directus, MemoryStorage } from '../../src';
import { test, timers } from '../utils';

describe('auth (browser)', function () {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

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
		const scope = nock();

		scope
			.post('/auth/login', (body) => body.mode === 'cookie')
			.reply(
				200,
				{
					data: {
						access_token: 'access_token',
						expires: 5000,
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
					expires: 5000,
				},
			});

		expect(scope.pendingMocks().length).toBe(2);

		await timers(async ({ tick, flush }) => {
			const sdk = new Directus(url);

			const loginPromise = sdk.auth.login(
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

			await loginPromise;

			expect(scope.pendingMocks().length).toBe(1);
			expect(sdk.auth.expiring).toBe(false);
			expect(sdk.storage.auth_token).toBe('access_token');
			expect(sdk.storage.auth_expires).toBe(107000);
			await tick(5000);

			expect(scope.pendingMocks().length).toBe(1);
			await flush();
			expect(sdk.auth.expiring).toBe(true);

			await new Promise((resolve) => {
				scope.once('replied', () => {
					flush().then(resolve);
				});
			});

			expect(sdk.storage.auth_expires).toBe(112000);
			expect(scope.pendingMocks().length).toBe(0);
			expect(sdk.storage.auth_token).toBe('new_access_token');
			expect(sdk.auth.expiring).toBe(false);
		}, 100000);
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
