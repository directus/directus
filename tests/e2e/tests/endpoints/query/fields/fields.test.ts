import { createDirectus, createItem, readItem, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/useSnapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

test(`select only id`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
			}),
		)
	).id!;

	const result = await api.request(readItem(collections.articles, id, { fields: ['id'] }));

	expect(result).toEqual({
		id: id,
	});
});

test(`select id and title`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
			}),
		)
	).id!;

	const result = await api.request(readItem(collections.articles, id, { fields: ['id', 'title'] }));

	expect(result).toEqual({
		id: id,
		title: 'Article A',
	});
});

test(`select *.*.*`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
				tags: [
					{
						tags_id: {
							tag: 'Tag A',
						},
					},
				],
			}),
		)
	).id!;

	const result = await api.request(readItem(collections.articles, id, { fields: ['*.*.*'] }));

	expect(result).toMatchObject({
		id: id,
		title: 'Article A',
		tags: [
			{
				articles_id: {
					id: id,
				},
				id: expect.anything(),
				tags_id: {
					id: expect.anything(),
					tag: 'Tag A',
				},
			},
		],
	});
});
