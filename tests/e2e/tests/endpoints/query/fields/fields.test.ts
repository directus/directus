import { createDirectus, createItem, readItem, rest, staticToken } from '@directus/sdk';
import { join } from 'path';
import { expect, test } from 'vitest';
import { useSnapshot } from '../../../../utils/useSnapshot';
import { Schema } from './schema';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const collections = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

test(`select only id`, async () => {
	const id = (
		await api.request(
			createItem(collections.articles, {
				title: `Article A`,
			}),
		)
	).id;

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
	).id;

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
	).id;

	const result = await api.request(readItem(collections.articles, id, { fields: ['*.*.*'] }));

	expect(result).toEqual({
		id: id,
		title: 'Article A',
		author: null,
		blocks: [],
		links: [],
		tags: [
			{
				articles_id: {
					author: null,
					blocks: [],
					id: id,
					links: [],
					tags: [result.tags[0].id],
					title: 'Article A',
				},
				id: result.tags[0].id,
				tags_id: {
					id: result.tags[0].tags_id.id,
					tag: 'Tag A',
				},
			},
		],
	});
});
