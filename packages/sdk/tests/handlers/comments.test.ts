/**
 * @jest-environment node
 */

import { Directus } from '../../src';
import { test } from '../utils';

describe('comments', function () {
	test(`creates comments`, async (url, nock) => {
		nock()
			.post('/activity/comment', {
				collection: 'posts',
				item: '1',
				comment: 'Awesome post!',
			})
			.reply(200, {
				data: {
					id: 5,
					collection: 'posts',
					item: '1',
					comment: 'Awesome post!',
				},
			});

		const sdk = new Directus(url);
		const item = await sdk.activity.comments.create({
			collection: 'posts',
			item: '1',
			comment: 'Awesome post!',
		});

		expect(item.id).toBe(5);
		expect(item.comment).toBe('Awesome post!');
	});

	test(`updates comments`, async (url, nock) => {
		nock()
			.patch('/activity/comment/5', {
				comment: 'Awesome content!',
			})
			.reply(202, {
				data: {
					id: 5,
					collection: 'posts',
					item: '1',
					comment: 'Awesome content!',
				},
			});

		const sdk = new Directus(url);
		const item = await sdk.activity.comments.update(5, 'Awesome content!');

		expect(item.comment).toBe('Awesome content!');
	});

	test(`deletes comments`, async (url, nock) => {
		const scope = nock().delete('/activity/comment/5').reply(204);

		const sdk = new Directus(url);
		await sdk.activity.comments.delete(5);

		expect(scope.pendingMocks().length).toBe(0);
	});
});
