import { randomUUID } from 'node:crypto';
import {
	createContentVersion,
	createDirectus,
	createItem,
	deleteContentVersion,
	deleteItem,
	promoteContentVersion,
	readItems,
	rest,
	saveToContentVersion,
	staticToken,
	updateContentVersion,
} from '@directus/sdk';
import { database, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';

export type Schema = {
	articles: Articles[];
};
export type Articles = {
	id: string | number;
	title: string;
	author: string;
};

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, 'snapshot-collection.json');

// TODO: fix later
if (database !== 'mssql') {
	test(`allow creating version item = null`, async () => {
		const response = await api.request(
			createContentVersion({
				collection: collections.articles,
				item: null,
				key: 'draft',
				name: 'draft',
			}),
		);

		expect(response).toBeDefined();

		await api.request(deleteContentVersion(response.id));
	});

	test(`saving an itemless version`, async () => {
		const version = await api.request(
			createContentVersion({
				collection: collections.articles,
				item: null,
				key: 'draft',
				name: 'draft',
			}),
		);

		const response = await api.request(saveToContentVersion(version.id, { title: 'title' }));

		expect(response).toMatchObject({
			title: 'title',
		});

		await api.request(deleteContentVersion(version.id));
	});

	test(`promoting an itemless version`, async () => {
		const version = await api.request(
			createContentVersion({
				collection: collections.articles,
				item: null,
				key: 'draft',
				name: 'draft',
			}),
		);

		await api.request(saveToContentVersion(version.id, { title: 'title' }));

		const response = await api.request(promoteContentVersion(version.id));

		expect(response).toBeDefined();

		await api.request(deleteContentVersion(version.id));
		await api.request(deleteItem(collections.articles, response));
	});

	test(`deny updating non draft version from item to itemless`, async () => {
		const item = await api.request(createItem(collections.articles, { title: 'item1' }));

		const version = await api.request(
			createContentVersion({
				collection: collections.articles,
				item: String(item.id),
				key: 'test',
				name: 'draft',
			}),
		);

		await api.request(saveToContentVersion(version.id, { title: 'title' }));

		await expect(api.request(updateContentVersion(version.id, { item: null }))).rejects.toThrow();

		await api.request(deleteContentVersion(version.id));
		await api.request(deleteItem(collections.articles, item.id));
	});

	test(`deny updating itemless draft version to item(full)`, async () => {
		const version = await api.request(
			createContentVersion({
				collection: collections.articles,
				item: null,
				key: 'draft',
				name: 'draft',
			}),
		);

		await api.request(saveToContentVersion(version.id, { title: 'title' }));

		await expect(api.request(updateContentVersion(version.id, { key: 'test2' }))).rejects.toThrow();

		await api.request(deleteContentVersion(version.id));
	});

	test(`request version on collection with no drafts`, async () => {
		const versionKey = randomUUID();

		const item = await api.request(createItem(collections.articles, { title: 'item1' }));

		const response = await api.request(readItems(collections.articles, { version: versionKey }));

		expect(response).toMatchObject([]);

		await api.request(deleteItem(collections.articles, item.id));
	});

	test(`request version on collection a draft item`, async () => {
		const versionKey = randomUUID();

		const item = await api.request(createItem(collections.articles, { title: 'item1' }));

		const version = await api.request(
			createContentVersion({
				collection: collections.articles,
				item: String(item.id),
				key: versionKey,
				name: versionKey,
			}),
		);

		await api.request(saveToContentVersion(version.id, { title: 'title' }));

		const response = (await api.request(readItems(collections.articles, { version: versionKey }))) as any[];

		expect(response).toMatchObject([
			{
				$meta: {
					version_id: version.id,
				},
				author: null,
				id: item.id,
				title: 'title',
			},
		]);

		await api.request(deleteItem(collections.articles, item.id));
		await api.request(deleteContentVersion(version.id));
	});

	test(`request version on collection a draft itemless`, async () => {
		const versionKey = 'draft';

		const version = await api.request(
			createContentVersion({
				collection: collections.articles,
				item: null,
				key: versionKey,
				name: versionKey,
			}),
		);

		await api.request(saveToContentVersion(version.id, { title: 'title' }));

		const response = (await api.request(readItems(collections.articles, { version: versionKey }))) as any[];

		expect(response).toMatchObject([
			{
				$meta: {
					version_id: version.id,
				},
				author: null,
				id: null,
				title: 'title',
			},
		]);

		await api.request(deleteContentVersion(version.id));
	});

	test(`request version on collection a draft failed itemless`, async () => {
		const versionKey = 'draft';

		const version = await api.request(
			createContentVersion({
				collection: collections.articles,
				item: null,
				key: versionKey,
				name: versionKey,
			}),
		);

		await api.request(saveToContentVersion(version.id, { title: null, author: 'abc' }));

		const response = (await api.request(readItems(collections.articles, { version: versionKey }))) as any[];

		expect(response).toMatchObject([
			{
				$meta: {
					error: expect.anything(),
					version_id: version.id,
				},
				author: 'abc',
				title: null,
			},
		]);

		await api.request(deleteContentVersion(version.id));
	});

	test(`request version on collection a draft failed itemless with limit=-1`, async () => {
		const versionKey = 'draft';

		const version = await api.request(
			createContentVersion({
				collection: collections.articles,
				item: null,
				key: versionKey,
				name: versionKey,
			}),
		);

		await api.request(saveToContentVersion(version.id, { title: null, author: 'abc' }));

		const response = (await api.request(readItems(collections.articles, { version: versionKey, limit: -1 }))) as any[];

		expect(response).toMatchObject([
			{
				$meta: {
					error: expect.anything(),
					version_id: version.id,
				},
				author: 'abc',
				title: null,
			},
		]);

		await api.request(deleteContentVersion(version.id));
	});

	test(`request version on collection a failed draft item`, async () => {
		const versionKey = randomUUID();

		const item = await api.request(createItem(collections.articles, { title: 'item1' }));

		const version = await api.request(
			createContentVersion({
				collection: collections.articles,
				item: String(item.id),
				key: versionKey,
				name: versionKey,
			}),
		);

		await api.request(saveToContentVersion(version.id, { title: null }));

		const response = (await api.request(readItems(collections.articles, { version: versionKey }))) as any[];

		expect(response).toMatchObject([
			{
				$meta: {
					error: expect.any(Object),
					version_id: version.id,
				},
				author: null,
				id: item.id,
				title: null,
			},
		]);

		await api.request(deleteItem(collections.articles, item.id));
		await api.request(deleteContentVersion(version.id));
	});
}
