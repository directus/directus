import { Directus } from '../../src';
import { mockServer, URL } from '../utils';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

describe('invites', function () {
	it('send', async () => {
		mockServer.use(rest.post(URL + '/users/invite', (_req, res, ctx) => res(ctx.status(200))));

		const sdk = new Directus(URL);

		await expect(
			sdk.users.invites.send('admin@example.com', '1e098175-6258-48d6-ad88-d24cae2abe15')
		).resolves.not.toThrowError();
	});

	it(`accept`, async () => {
		mockServer.use(rest.post(URL + '/users/invite/accept', (_req, res, ctx) => res(ctx.status(200))));

		const sdk = new Directus(URL);
		await expect(sdk.users.invites.accept('token', 'password1234')).resolves.not.toThrowError();
	});
});
