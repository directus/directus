import { Directus } from '../../src';
import { mockServer, URL } from '../utils';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

describe('comments', function () {
	it(`creates comments`, async () => {
		mockServer.use(
			rest.post(URL + '/activity/comment', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							id: 5,
							collection: 'posts',
							item: '1',
							comment: 'Awesome post!',
						},
					})
				)
			)
		);

		const sdk = new Directus(URL);

		const item = await sdk.activity.comments.create({
			collection: 'posts',
			item: '1',
			comment: 'Awesome post!',
		});

		expect(item.id).toBe(5);
		expect(item.comment).toBe('Awesome post!');
	});

	it(`updates comments`, async () => {
		mockServer.use(
			rest.patch(URL + '/activity/comment/5', (_req, res, ctx) =>
				res(
					ctx.status(202),
					ctx.json({
						data: {
							id: 5,
							collection: 'posts',
							item: '1',
							comment: 'Awesome content!',
						},
					})
				)
			)
		);

		const sdk = new Directus(URL);
		const item = await sdk.activity.comments.update(5, 'Awesome content!');

		expect(item.comment).toBe('Awesome content!');
	});

	it(`deletes comments`, async () => {
		mockServer.use(rest.delete(URL + '/activity/comment/5', (_req, res, ctx) => res(ctx.status(204))));

		const sdk = new Directus(URL);
		await expect(sdk.activity.comments.delete(5)).resolves.not.toThrowError();
	});
});
