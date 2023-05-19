import { Directus } from '../../src';
import { mockServer, URL } from '../utils';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

describe('profile', function () {
	it(`read`, async () => {
		mockServer.use(rest.get(URL + '/users/me', (_req, res, ctx) => res(ctx.status(200))));

		const sdk = new Directus(URL);
		await expect(sdk.users.me.read()).resolves.not.toThrowError();
	});

	it(`update`, async () => {
		mockServer.use(rest.patch(URL + '/users/me', (_req, res, ctx) => res(ctx.status(200))));

		const sdk = new Directus(URL);

		await expect(
			sdk.users.me.update({
				email: 'other@email.com',
				untyped_field: 12345,
			})
		).resolves.not.toThrowError();
	});
});
