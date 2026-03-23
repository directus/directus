import { getUrl } from '@common/config';
import { CreateItem, CreateVersion, SaveVersion } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { c } from './version.seed';

const item = {
	title: 'Article 1',
	author: {
		name: 'Author 1',
	},
	links: [
		{
			link: 'Link A',
		},
		{
			link: 'Link B',
		},
	],
	tags: [
		{
			[`${c.tags}_id`]: {
				tag: 'Tag A',
			},
		},
		{
			[`${c.tags}_id`]: {
				tag: 'Tag B',
			},
		},
	],
	sections: [
		{
			collection: c.sec_text,
			item: {
				text: 'Text A',
			},
		},
		{
			collection: c.sec_num,
			item: {
				num: 2,
			},
		},
	],
} as const;

describe('version response', () => {
	it.each(vendors)('%s', async (vendor) => {
		const result = await CreateItem(vendor, {
			collection: c.articles,
			item,
		});

		const versionResult = await CreateVersion(vendor, {
			collection: c.articles,
			item: String(result.id),
			key: 'test',
			name: 'test',
		});

		await SaveVersion(vendor, {
			id: versionResult.id,
			delta: {
				title: 'Changed',
			},
		});

		let response = await request(getUrl(vendor))
			.get(`/items/${c.articles}/${result.id}?version=test`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		expect(JSON.parse(response.text)).toEqual({
			data: { id: 1, title: 'Changed', author: 1, tags: [1, 2], sections: [1, 2], links: [1, 2] },
		});

		await SaveVersion(vendor, {
			id: versionResult.id,
			delta: {
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
						[`${c.tags}_id`]: {
							id: 1,
							tag: 'Tag A Changed',
						},
					},
				],
				sections: [
					{
						id: 1,
						collection: c.sec_text,
						item: {
							id: 1,
							text: 'Text A Changed',
						},
					},
				],
			},
		});

		response = await request(getUrl(vendor))
			.get(
				`/items/${c.articles}/${result.id}?version=test&fields=id,title,author.id,author.name,tags.id,tags.${c.tags}_id.id,tags.${c.tags}_id.tag,sections.id,sections.collection,sections.item.*,links.id,links.link`,
			)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		expect(JSON.parse(response.text)).toEqual({
			data: {
				id: 1,
				title: 'Changed',
				author: {
					id: 1,
					name: 'Changed',
				},
				tags: [
					{
						id: 1,
						[`${c.tags}_id`]: {
							id: 1,
							tag: 'Tag A Changed',
						},
					},
				],
				sections: [
					{
						id: 1,
						item: { id: 1, text: 'Text A Changed' },
						collection: c.sec_text,
					},
				],
				links: [
					{
						id: 1,
						link: 'Link A Changed',
					},
				],
			},
		});

		await SaveVersion(vendor, {
			id: versionResult.id,
			delta: {
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
							[`${c.tags}_id`]: {
								tag: 'Tag C',
							},
						},
					],
					update: [
						{
							id: 2,
							[`${c.tags}_id`]: {
								id: 2,
								tag: 'Tag B Changed',
							},
						},
					],
					delete: [1],
				},
				sections: {
					create: [
						{
							collection: c.sec_num,
							item: {
								num: 3,
							},
						},
					],
					update: [
						{
							id: 1,
							collection: c.sec_text,
							item: {
								id: 1,
								text: 'Text B Changed',
							},
						},
					],
					delete: [2],
				},
			},
		});

		response = await request(getUrl(vendor))
			.get(
				`/items/${c.articles}/${result.id}?version=test&fields=tags.id,tags.${c.tags}_id.id,tags.${c.tags}_id.tag,sections.id,sections.collection,sections.item.*,links.id,links.link`,
			)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		expect(JSON.parse(response.text)).toEqual({
			data: {
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
						[`${c.tags}_id`]: {
							id: 2,
							tag: 'Tag B Changed',
						},
					},
					{
						id: null,
						[`${c.tags}_id`]: {
							id: null,
							tag: 'Tag C',
						},
					},
				],
				sections: [
					{
						id: 1,
						item: { id: 1, text: 'Text B Changed' },
						collection: c.sec_text,
					},
					{
						id: null,
						item: { id: null, num: 3 },
						collection: c.sec_num,
					},
				],
			},
		});
	});
});

describe('version deadlocking', () => {
	it.each(vendors)('%s', async (vendor) => {
		const resultA = await CreateItem(vendor, {
			collection: c.articles,
			item: {
				title: 'Article A',
				links: [
					{
						link: 'Link A',
					},
					{
						link: 'Link B',
					},
				],
			},
		});

		const linkIds = resultA['links'];

		const resultB = await CreateItem(vendor, {
			collection: c.articles,
			item: {
				title: 'Article B',
				links: linkIds,
			},
		});

		const versionResultA = await CreateVersion(vendor, {
			collection: c.articles,
			item: String(resultA.id),
			key: 'test',
			name: 'test',
		});

		const versionResultB = await CreateVersion(vendor, {
			collection: c.articles,
			item: String(resultB.id),
			key: 'test',
			name: 'test',
		});

		await SaveVersion(vendor, {
			id: versionResultA.id,
			delta: {
				links: {
					create: [],
					update: [
						{
							id: linkIds[0],
							link: 'Link A Changed',
						},
						{
							id: linkIds[1],
							link: 'Link B Changed',
						},
					],
					delete: [],
				},
			},
		});

		await SaveVersion(vendor, {
			id: versionResultB.id,
			delta: {
				links: {
					create: [],
					update: [
						{
							id: linkIds[1],
							link: 'Link B Changed 2',
						},
						{
							id: linkIds[0],
							link: 'Link A Changed 2',
						},
					],
					delete: [],
				},
			},
		});

		const responseA = request(getUrl(vendor))
			.get(`/items/${c.articles}/${resultA.id}?version=test&fields=id,links.id,links.link`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		const responseB = request(getUrl(vendor))
			.get(`/items/${c.articles}/${resultB.id}?version=test&fields=id,links.id,links.link`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		const [A, B] = await Promise.all([responseA, responseB]);

		expect(JSON.parse(A.text).data).toEqual({
			id: resultA.id,
			links: [
				{
					id: linkIds[0],
					link: 'Link A Changed',
				},
				{
					id: linkIds[1],
					link: 'Link B Changed',
				},
			],
		});

		expect(JSON.parse(B.text).data).toEqual({
			id: resultB.id,
			links: [
				{
					id: linkIds[0],
					link: 'Link A Changed 2',
				},
				{
					id: linkIds[1],
					link: 'Link B Changed 2',
				},
			],
		});
	});
});
