import { createDirectus, createItem, readItems, rest, staticToken } from '@directus/sdk';
import { useSnapshot } from '../../../../utils/useSnapshot';
import { Schema } from './schema';
import { join } from 'path';
import { expect, test } from 'vitest';
import { range } from 'lodash-es';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const collections = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

test(`string _eq `, async () => {
	const ids = (
		await Promise.all(
			range(10).map(async (i) =>
				api.request(
					createItem(collections.articles, {
						title: `Article ${i}`,
					}),
				),
			),
		)
	).map((item) => item.id);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				id: { _in: ids },
				title: { _eq: 'Article 1' },
			},
		}),
	);

	expect(result.length).toBe(1);
	expect(result[0].title).toBe('Article 1');
});

test(`number _gte `, async () => {
	const ids = (
		await Promise.all(
			range(10).map(async (i) =>
				api.request(
					createItem(collections.articles, {
						votes: i * 10,
					}),
				),
			),
		)
	).map((item) => item.id);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				id: { _in: ids },
				votes: { _gte: 50 },
			},
		}),
	);

	expect(result.length).toBe(5);
});

test(`number _gt `, async () => {
	const ids = (
		await Promise.all(
			range(10).map(async (i) =>
				api.request(
					createItem(collections.articles, {
						votes: i * 10,
					}),
				),
			),
		)
	).map((item) => item.id);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				id: { _in: ids },
				votes: { _gt: 50 },
			},
		}),
	);

	expect(result.length).toBe(4);
});

test(`number _between `, async () => {
	const ids = (
		await Promise.all(
			range(10).map(async (i) =>
				api.request(
					createItem(collections.articles, {
						votes: i * 10,
					}),
				),
			),
		)
	).map((item) => item.id);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				id: { _in: ids },
				votes: { _between: [30, 60] },
			},
		}),
	);

	expect(result.length).toBe(4);
	expect(result.map((r) => r.votes)).toEqual([30, 40, 50, 60]);
});

test(`number _nbetween `, async () => {
	const ids = (
		await Promise.all(
			range(10).map(async (i) =>
				api.request(
					createItem(collections.articles, {
						votes: i * 10,
					}),
				),
			),
		)
	).map((item) => item.id);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				id: { _in: ids },
				votes: { _nbetween: [30, 60] },
			},
		}),
	);

	expect(result.length).toBe(6);
	expect(result.map((r) => r.votes).sort()).toEqual([0, 10, 20, 70, 80, 90]);
});

test(`string _eq on m2m relation `, async () => {
	await api.request(
		createItem(collections.articles, {
			title: 'Article A',
			tags: [
				{
					tags_id: {
						tag: 'Tag A',
					},
				},
			],
		}),
	);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				tags: {
					tags_id: {
						tag: {
							_eq: 'Tag A',
						},
					},
				},
			},
			fields: '*.*.*',
		}),
	);

	expect(result.at(-1)!.title).toBe('Article A');
	expect(result.at(-1)!.tags[0].tags_id.tag).toBe('Tag A');
});

test(`string _eq on m2a relation `, async () => {
	await api.request(
		createItem(collections.articles, {
			title: `Article B`,
			blocks: [
				{
					collection: collections.text_blocks,
					item: {
						text: 'Text Block 1',
					},
				},
			],
		}),
	);

	const result = await api.request(
		readItems(collections.articles, {
			filter: {
				blocks: {
					[`item:${collections.text_blocks}`]: {
						text: {
							_eq: 'Text Block 1',
						},
					},
				},
			},
			fields: '*.*.*',
		}),
	);

	expect(result.at(-1)!.title).toBe('Article B');
	expect(result.at(-1)!.blocks[0].collection).toBe(collections.text_blocks);
	expect(result.at(-1)!.blocks[0].item.text).toBe('Text Block 1');
});
