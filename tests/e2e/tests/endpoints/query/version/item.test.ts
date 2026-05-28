import {
	createContentVersion,
	createDirectus,
	createItem,
	readItem,
	rest,
	saveToContentVersion,
	staticToken,
} from '@directus/sdk';
import type { DeepPartial } from '@directus/types';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Articles, Links, Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

const fields = [
	'id',
	'title',
	{ author: ['id', 'name'] },
	{ tags: ['id', { tags_id: ['id', 'tag'] }] },
	{ blocks: ['id', 'collection', 'item.*' as any] },
	{ links: ['id', 'link'] },
] as const;

const item: DeepPartial<Articles> = {
	title: 'Article 1',
	author: {
		id: 1,
		name: 'Author 1',
	},
	links: [
		{
			id: 1,
			link: 'Link A',
		},
		{
			id: 2,
			link: 'Link B',
		},
	],
	tags: [
		{
			id: 1,
			tags_id: {
				id: 1,
				tag: 'Tag A',
			},
		},
		{
			id: 2,
			tags_id: {
				id: 2,
				tag: 'Tag B',
			},
		},
	],
	blocks: [
		{
			id: 1,
			collection: collections.text_blocks,
			item: {
				id: 1,
				text: 'Text A',
			},
		},
		{
			id: 2,
			collection: collections.date_blocks,
			item: {
				id: 1,
				date: `2026-05-28`,
			},
		},
	],
} as const;

test(`version response`, async () => {
	const result = await api.request(createItem(collections.articles, item));

	const versionResult = await api.request(
		createContentVersion({
			collection: collections.articles,
			item: String(result.id),
			key: 'test',
			name: 'test',
		}),
	);

	await api.request(saveToContentVersion(versionResult.id, { title: 'Changed' }));

	let response: Record<string, any> = await api.request(
		readItem(collections.articles, result.id, {
			version: 'test',
			fields: ['id', 'title', 'author', 'tags', 'blocks', 'links'],
		}),
	);

	expect(response).toMatchObject({
		id: result.id,
		title: 'Changed',
		author: 1,
		tags: [1, 2],
		blocks: [1, 2],
		links: [1, 2],
	});

	let delta: Record<string, any> = {
		title: 'Changed',
		author: {
			id: 1,
			name: 'Changed',
		},
		links: [
			{
				id: 1,
				link: 'Link A Changed',
			},
		],
		tags: [
			{
				id: 1,
				tags_id: {
					id: 1,
					tag: 'Tag A Changed',
				},
			},
		],
		blocks: [
			{
				id: 1,
				collection: collections.text_blocks,
				item: {
					id: 1,
					text: 'Text A Changed',
				},
			},
		],
	};

	await api.request(saveToContentVersion(versionResult.id, delta));

	response = await api.request(
		readItem(collections.articles, result.id, {
			version: 'test',
			fields,
		}),
	);

	expect(response).toMatchObject({
		id: result.id,
		title: 'Changed',
		author: {
			id: 1,
			name: 'Changed',
		},
		tags: [
			{
				id: 1,
				tags_id: {
					id: 1,
					tag: 'Tag A Changed',
				},
			},
		],
		blocks: [
			{
				id: 1,
				item: { id: 1, text: 'Text A Changed' },
				collection: collections.text_blocks,
			},
		],
		links: [
			{
				id: 1,
				link: 'Link A Changed',
			},
		],
		$meta: {
			version_id: versionResult.id,
		},
	});

	delta = {
		links: {
			create: [
				{
					link: 'Link C',
				},
			],
			update: [
				{
					id: 2,
					link: 'Link B Changed',
				},
			],
			delete: [1],
		},
		tags: {
			create: [
				{
					tags_id: {
						tag: 'Tag C',
					},
				},
			],
			update: [
				{
					id: 2,
					tags_id: {
						id: 2,
						tag: 'Tag B Changed',
					},
				},
			],
			delete: [1],
		},
		blocks: {
			create: [
				{
					collection: collections.date_blocks,
					item: {
						date: `2027-04-29T00:00:00.000Z`,
					},
				},
			],
			update: [
				{
					id: 1,
					collection: collections.text_blocks,
					item: {
						id: 1,
						text: 'Text B Changed',
					},
				},
			],
			delete: [2],
		},
	};

	await api.request(saveToContentVersion(versionResult.id, delta));

	response = await api.request(
		readItem(collections.articles, result.id, {
			version: 'test',
			fields,
		}),
	);

	expect(response).toMatchObject({
		links: [
			{
				id: 2,
				link: 'Link B Changed',
			},
			{
				id: null,
				link: 'Link C',
			},
		],
		tags: [
			{
				id: 2,
				tags_id: {
					id: 2,
					tag: 'Tag B Changed',
				},
			},
			{
				id: null,
				tags_id: {
					id: null,
					tag: 'Tag C',
				},
			},
		],
		blocks: [
			{
				id: 1,
				item: { id: 1, text: 'Text B Changed' },
				collection: collections.text_blocks,
			},
			{
				id: null,
				item: { id: null, date: `2027-04-29` },
				collection: collections.date_blocks,
			},
		],
		$meta: {
			version_id: versionResult.id,
		},
	});
});

test('version deadlocking', async () => {
	const resultA = await api.request(
		createItem(collections.articles, {
			title: 'Article A',
			links: [
				{
					link: 'Link A',
				},
				{
					link: 'Link B',
				},
			],
		}),
	);

	const links = resultA.links as Links[];

	const resultB = await api.request(
		createItem(collections.articles, {
			title: 'Article B',
			links,
		}),
	);

	const versionResultA = await api.request(
		createContentVersion({
			collection: collections.articles,
			item: String(resultA.id),
			key: 'test',
			name: 'test',
		}),
	);

	const versionResultB = await api.request(
		createContentVersion({
			collection: collections.articles,
			item: String(resultB.id),
			key: 'test',
			name: 'test',
		}),
	);

	const deltaA: Record<string, any> = {
		links: {
			create: [],
			update: [
				{
					id: links[0],
					link: 'Link A Changed',
				},
				{
					id: links[1],
					link: 'Link B Changed',
				},
			],
			delete: [],
		},
	};

	const deltaB: Record<string, any> = {
		links: {
			create: [],
			update: [
				{
					id: links[1],
					link: 'Link B Changed 2',
				},
				{
					id: links[0],
					link: 'Link A Changed 2',
				},
			],
			delete: [],
		},
	};

	await api.request(saveToContentVersion(versionResultA.id, deltaA));
	await api.request(saveToContentVersion(versionResultB.id, deltaB));

	const responseA: Record<string, any> = api.request(
		readItem(collections.articles, resultA.id, {
			version: 'test',
			fields: ['id', { links: ['id', 'link'] }],
		}),
	);

	const responseB: Record<string, any> = api.request(
		readItem(collections.articles, resultB.id, {
			version: 'test',
			fields: ['id', { links: ['id', 'link'] }],
		}),
	);

	const [A, B] = await Promise.all([responseA, responseB]);

	expect(A).toMatchObject({
		id: resultA.id,
		links: [
			{
				id: links[0],
				link: 'Link A Changed',
			},
			{
				id: links[1],
				link: 'Link B Changed',
			},
		],

		$meta: {
			version_id: versionResultA.id,
		},
	});

	expect(B).toMatchObject({
		id: resultB.id,
		links: [
			{
				id: links[0],
				link: 'Link A Changed 2',
			},
			{
				id: links[1],
				link: 'Link B Changed 2',
			},
		],
		$meta: {
			version_id: versionResultB.id,
		},
	});
});
