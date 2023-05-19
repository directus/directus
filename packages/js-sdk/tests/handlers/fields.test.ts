import { Directus } from '../../src';
import { mockServer, URL } from '../utils';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

describe('fields', function () {
	it(`update one`, async () => {
		mockServer.use(rest.patch(URL + '/fields/posts/title', (_req, res, ctx) => res(ctx.status(200))));

		const sdk = new Directus(URL);

		await expect(
			sdk.fields.updateOne('posts', 'title', {
				meta: {
					required: true,
				},
			})
		).resolves.not.toThrowError();
	});

	it(`check ManyItems return type for readAll`, async () => {
		mockServer.use(
			rest.get(URL + '/fields', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: [],
					})
				)
			)
		);

		const sdk = new Directus(URL);
		const response = await sdk.fields.readAll();

		expect(Array.isArray(response.data)).toBe(true);
	});

	it(`check ManyItems return type for readMany`, async () => {
		mockServer.use(
			rest.get(URL + '/fields/posts', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: [],
					})
				)
			)
		);

		const sdk = new Directus(URL);
		const response = await sdk.fields.readMany('posts');

		expect(Array.isArray(response.data)).toBe(true);
	});
});
