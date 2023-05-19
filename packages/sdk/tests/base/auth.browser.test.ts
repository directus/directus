import { Directus } from '../../src';
import { mockServer, URL } from '../utils';
import { rest } from 'msw';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

describe('auth (browser)', function () {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it(`sets default auth mode to cookie`, async () => {
		const sdk = new Directus(URL, { auth: { mode: 'cookie' } });
		expect(sdk.auth.mode).toBe('cookie');
	});

	it(`sends default auth mode`, async () => {
		mockServer.use(
			rest.post(URL + '/auth/login', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							access_token: 'access_token',
							refresh_token: 'refresh_token',
							expires: 60000,
						},
					})
				)
			)
		);

		const sdk = new Directus(URL);

		await expect(
			sdk.auth.login({
				email: 'wolfulus@gmail.com',
				password: 'password',
			})
		).resolves.not.toThrowError();

		// expect(scope.pendingMocks().length).toBe(0);
	});

	it(`logout doesn't send a refresh token due to cookie mode`, async () => {
		mockServer.use(
			rest.post(URL + '/auth/login', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							access_token: 'some_access_token',
							expires: 60000,
						},
					}),
					ctx.cookie('directus_refresh_token', 'my_refresh_token', { httpOnly: true })
				)
			),
			rest.post(URL + '/auth/logout', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {},
					})
				)
			)
		);

		const sdk = new Directus(URL);

		await sdk.auth.login({
			email: 'wolfulus@gmail.com',
			password: 'password',
		});

		expect(await sdk.auth.token).toBe('some_access_token');

		await sdk.auth.logout();

		expect(await sdk.auth.token).toBeNull();
	});
});
