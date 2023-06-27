import { Directus } from '../../src';
import { mockServer, URL } from '../utils';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

describe('tfa', function () {
	it(`generate`, async () => {
		mockServer.use(
			rest.post(URL + '/users/me/tfa/generate', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							secret: 'supersecret',
							otpauth_url: 'https://example.com',
						},
					})
				)
			)
		);

		const sdk = new Directus(URL);
		const data = await sdk.users.me.tfa.generate('password1234');

		expect(data).toStrictEqual({
			secret: 'supersecret',
			otpauth_url: 'https://example.com',
		});
	});

	it(`enable`, async () => {
		mockServer.use(rest.post(URL + '/users/me/tfa/enable', (_req, res, ctx) => res(ctx.status(200))));

		const sdk = new Directus(URL);
		await expect(sdk.users.me.tfa.enable('supersecret', '123456')).resolves.not.toThrowError();
	});

	it(`disable`, async () => {
		mockServer.use(rest.post(URL + '/users/me/tfa/disable', (_req, res, ctx) => res(ctx.status(200))));

		const sdk = new Directus(URL);
		await expect(sdk.users.me.tfa.disable('12345')).resolves.not.toThrowError();
	});
});
