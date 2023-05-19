import { Directus } from '../../src';
import { mockServer, URL } from '../utils';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

describe('relations', function () {
	it(`update one`, async () => {
		mockServer.use(rest.patch(URL + '/relations/posts/title', (_req, res, ctx) => res(ctx.status(200))));

		const sdk = new Directus(URL);

		await expect(
			sdk.relations.updateOne('posts', 'title', {
				meta: {
					required: true,
				},
			})
		).resolves.not.toThrowError();
	});
});
