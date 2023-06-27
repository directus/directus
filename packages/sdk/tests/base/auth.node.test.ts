// @vitest-environment node
import { Directus } from '../../src';
import { mockServer, URL } from '../utils';
import { rest } from 'msw';
import { describe, expect, it } from 'vitest';

describe('auth (node)', function () {
	it(`sets default auth mode to json`, async () => {
		const sdk = new Directus(URL);
		expect(sdk.auth.mode).toBe('json');
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

		const loginPromise = sdk.auth.login({
			email: 'wolfulus@gmail.com',
			password: 'password',
		});

		await expect(loginPromise).resolves.not.toThrowError();
	});

	it(`logout sends a refresh token in body`, async () => {
		mockServer.use(
			rest.post(URL + '/auth/login', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							access_token: 'auth_token',
							refresh_token: 'json_refresh_token',
							expires: 60000,
						},
					}),
					ctx.cookie('directus_refresh_token', 'my_refresh_token', { httpOnly: true })
				)
			),
			rest.post(URL + '/auth/logout', (_req, res, ctx) => res(ctx.status(200), ctx.json({ data: {} })))
		);

		const sdk = new Directus(URL);

		const loginPromise = sdk.auth.login({
			email: 'wolfulus@gmail.com',
			password: 'password',
		});

		await loginPromise;

		expect(await sdk.auth.token).toBe('auth_token');

		const logoutPromise = sdk.auth.logout();

		await logoutPromise;

		expect(await sdk.auth.token).toBeNull();
	});
});
