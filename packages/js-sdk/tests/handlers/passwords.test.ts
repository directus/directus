import { Directus } from '../../src';
import { mockServer, URL } from '../utils';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

describe('password', function () {
	it(`request`, async () => {
		mockServer.use(rest.post(URL + '/auth/password/request', (_req, res, ctx) => res(ctx.status(200))));

		const sdk = new Directus(URL);
		await expect(sdk.auth.password.request('admin@example.com', 'http://some_url.com')).resolves.not.toThrowError();
	});

	it(`reset`, async () => {
		mockServer.use(rest.post(URL + '/auth/password/reset', (_req, res, ctx) => res(ctx.status(200))));

		const sdk = new Directus(URL);
		await expect(sdk.auth.password.reset('token', 'newpassword')).resolves.not.toThrowError();
	});
});
