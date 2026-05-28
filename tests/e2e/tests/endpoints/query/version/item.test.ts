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
import { database, port } from '@utils/constants.js';
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
		name: 'Author 1',
	},
	links: [{ link: 'Link A' }, { link: 'Link B' }],
	tags: [{ tags_id: { tag: 'Tag A' } }, { tags_id: { tag: 'Tag B' } }],
	blocks: [
		{
			collection: collections.text_blocks,
			item: { text: 'Text A' },
		},
		{
			collection: collections.date_blocks,
			item: { date: `2026-05-28` },
		},
	],
} as const;

// TODO: fix later
if (database !== 'mssql')
	test(`version response`, async () => {
		const result = await api.request(
			createItem(collections.articles, item, {
				fields: [
					'id',
					'author',
					{ links: ['id'] },
					{ tags: ['id', { tags_id: ['id'] }] },
					{ blocks: ['id', 'collection', 'item.*' as any] },
				],
			}),
		);

		const authorId = result.author as number;
		const [{ id: linkAId }, { id: linkBId }] = result.links as unknown as [{ id: number }, { id: number }];

		const [
			{
				id: tagAJunctionId,
				tags_id: { id: tagAId },
			},
			{
				id: tagBJunctionId,
				tags_id: { id: tagBId },
			},
		] = result.tags as unknown as [{ id: number; tags_id: { id: number } }, { id: number; tags_id: { id: number } }];

		const [
			{
				id: blockAJunctionId,
				item: { id: textAId },
			},
			{ id: blockBJunctionId },
		] = result.blocks as unknown as [{ id: number; item: { id: number } }, { id: number; item: { id: number } }];

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
			author: authorId,
			tags: [tagAJunctionId, tagBJunctionId],
			blocks: [blockAJunctionId, blockBJunctionId],
			links: [linkAId, linkBId],
		});

		let delta: Record<string, any> = {
			title: 'Changed',
			author: {
				id: authorId,
				name: 'Changed',
			},
			links: [
				{
					id: linkAId,
					link: 'Link A Changed',
				},
			],
			tags: [
				{
					id: tagAJunctionId,
					tags_id: {
						id: tagAId,
						tag: 'Tag A Changed',
					},
				},
			],
			blocks: [
				{
					id: blockAJunctionId,
					collection: collections.text_blocks,
					item: {
						id: textAId,
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
				id: authorId,
				name: 'Changed',
			},
			tags: [
				{
					id: tagAJunctionId,
					tags_id: {
						id: tagAId,
						tag: 'Tag A Changed',
					},
				},
			],
			blocks: [
				{
					id: blockAJunctionId,
					item: { id: textAId, text: 'Text A Changed' },
					collection: collections.text_blocks,
				},
			],
			links: [
				{
					id: linkAId,
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
						id: linkBId,
						link: 'Link B Changed',
					},
				],
				delete: [linkAId],
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
						id: tagBJunctionId,
						tags_id: {
							id: tagBId,
							tag: 'Tag B Changed',
						},
					},
				],
				delete: [tagAJunctionId],
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
						id: blockAJunctionId,
						collection: collections.text_blocks,
						item: {
							id: textAId,
							text: 'Text B Changed',
						},
					},
				],
				delete: [blockBJunctionId],
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
					id: linkBId,
					link: 'Link B Changed',
				},
				{
					id: null,
					link: 'Link C',
				},
			],
			tags: [
				{
					id: tagBJunctionId,
					tags_id: {
						id: tagBId,
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
					id: blockAJunctionId,
					item: { id: textAId, text: 'Text B Changed' },
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

// TODO: fix later
if (database !== 'mssql')
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
