import { Auth, Directus, MemoryStorage, Transport } from '../../src';
import { mockServer, URL } from '../utils';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

describe('auth', function () {
	it(`static auth should validate token`, async () => {
		mockServer.use(rest.get(URL + '/users/me', (_req, res, ctx) => res(ctx.status(203))));

		const sdk = new Directus(URL);
		await sdk.auth.static('token');
	});

	it(`should allow to extend auth handler`, async () => {
		class CustomAuthHandler extends Auth {
			hello() {
				return 'hello';
			}
		}

		// eslint-disable-next-line prefer-const
		let auth: CustomAuthHandler;
		const storage = new MemoryStorage();

		const transport = new Transport({
			url: URL,
			beforeRequest: async (config) => {
				await auth.refreshIfExpired();
				const token = auth.storage.auth_token;

				let bearer = '';

				if (token) {
					bearer = token.startsWith(`Bearer `) ? String(auth.storage.auth_token) : `Bearer ${auth.storage.auth_token}`;
				}

				return {
					...config,
					headers: {
						Authorization: bearer,
						...config.headers,
					},
				};
			},
		});

		auth = new CustomAuthHandler({ storage, transport });

		const sdk = new Directus(URL, {
			auth,
			storage: auth.storage,
			transport: auth.transport,
		});

		mockServer.use(rest.get(URL + '/users/me', (_req, res, ctx) => res(ctx.status(203))));

		await sdk.auth.static('token');
		expect(sdk.auth.hello()).toBe('hello');
	});

	/*
	it(`throws when refresh time resolves to an invalid value`, async () => {
		nock()
			.post('/auth/login')
			.reply(200, {
				data: {
					access_token: 'access_token',
					refresh_token: 'refresh_token',
					expires: 10000, // expires in 10 seconds
				},
			});

		const sdk = new Directus(URL);
		try {
			await sdk.auth.login(
				{
					email: 'wolfulus@gmail.com',
					password: 'password',
				},
				{
					refresh: {
						auto: true,
						time: 15000, // but we ask to refresh 15 seconds before the expiration
					},
				}
			);
			fail('Should have failed');
		} catch (err: any) {
			expect(err).toBeInstanceOf(InvalidRefreshTime);
		}
	});
	*/

	it(`successful auth should set the token`, async () => {
		mockServer.use(rest.get(URL + '/users/me', (_req, res, ctx) => res(ctx.status(203))));

		const sdk = new Directus(URL);
		await sdk.auth.static('token');

		expect(await sdk.auth.token);
	});

	it(`invalid credentials token should not set the token`, async () => {
		mockServer.use(
			rest.post(URL + '/auth/login', (_req, res, ctx) =>
				res(
					ctx.status(401),
					ctx.json({
						errors: [
							{
								message: 'Invalid token',
								extensions: {
									code: 'EUNAUTHORIZED',
								},
							},
						],
					})
				)
			)
		);

		const sdk = new Directus(URL);

		await expect(
			sdk.auth.login({
				email: 'invalid@email.com',
				password: 'invalid_password',
			})
		).rejects.toThrowError();

		expect(await sdk.auth.token).toBeNull();
	});

	it(`invalid static token should not set the token`, async () => {
		mockServer.use(
			rest.get(URL + '/users/me', (_req, res, ctx) =>
				res(
					ctx.status(401),
					ctx.json({
						errors: [
							{
								message: 'Invalid token',
								extensions: {
									code: 'EUNAUTHORIZED',
								},
							},
						],
					})
				)
			)
		);

		const sdk = new Directus(URL);

		await expect(sdk.auth.static('token')).rejects.toThrowError();

		expect(await sdk.auth.token).toBeNull();
	});
});
