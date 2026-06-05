import {
	createContentVersion,
	createDirectus,
	deleteContentVersion,
	deleteItem,
	promoteContentVersion,
	readSingleton,
	rest,
	saveToContentVersion,
	staticToken,
	updateContentVersion,
	updateSingleton,
} from '@directus/sdk';
import { database, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';

export type Schema = {
	singleton_articles: SingletonArticle;
};

export type SingletonArticle = {
	id: number;
	title: string | null;
};

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, 'snapshot-singleton.json');

const clearSingleton = async () => {
	try {
		const row = (await api.request(readSingleton(collections.singleton_articles, { fields: ['id'] }))) as {
			id: number | null;
		} | null;

		if (row?.id != null) {
			await api.request(deleteItem(collections.singleton_articles, row.id));
		}
	} catch {
		// noop
	}
};

// TODO: fix later
if (database !== 'mssql') {
	test('create itemless succeeds on empty singleton', async () => {
		await clearSingleton();

		const version = await api.request(
			createContentVersion({
				collection: collections.singleton_articles,
				item: null,
				key: 'draft',
				name: 'draft',
			}),
		);

		expect(version).toBeDefined();

		await api.request(deleteContentVersion(version.id));
	});

	test('create second itemless on singleton fails', async () => {
		await clearSingleton();

		const first = await api.request(
			createContentVersion({
				collection: collections.singleton_articles,
				item: null,
				key: 'draft',
				name: 'draft',
			}),
		);

		await expect(
			api.request(
				createContentVersion({
					collection: collections.singleton_articles,
					item: null,
					key: 'draft',
					name: 'draft2',
				}),
			),
		).rejects.toThrow();

		await api.request(deleteContentVersion(first.id));
	});

	test('create itemless on populated singleton fails', async () => {
		await clearSingleton();

		await api.request(updateSingleton(collections.singleton_articles, { title: 'populated' }));

		await expect(
			api.request(
				createContentVersion({
					collection: collections.singleton_articles,
					item: null,
					key: 'draft',
					name: 'draft',
				}),
			),
		).rejects.toThrow();

		await clearSingleton();
	});

	test('update version to itemless on populated singleton fails', async () => {
		await clearSingleton();

		await api.request(updateSingleton(collections.singleton_articles, { title: 'populated' }));

		const row = (await api.request(readSingleton(collections.singleton_articles, { fields: ['id'] }))) as {
			id: number;
		};

		const version = await api.request(
			createContentVersion({
				collection: collections.singleton_articles,
				item: String(row.id),
				key: 'draft',
				name: 'draft',
			}),
		);

		await expect(api.request(updateContentVersion(version.id, { item: null }))).rejects.toThrow();

		await api.request(deleteContentVersion(version.id));
		await clearSingleton();
	});

	test('promote itemless on empty singleton succeeds', async () => {
		await clearSingleton();

		const version = await api.request(
			createContentVersion({
				collection: collections.singleton_articles,
				item: null,
				key: 'draft',
				name: 'draft',
			}),
		);

		await api.request(saveToContentVersion(version.id, { title: 'promoted' }));

		const promoted = await api.request(promoteContentVersion(version.id));

		expect(promoted).toBeDefined();

		await api.request(deleteContentVersion(version.id));
		await clearSingleton();
	});

	test('promote itemless on populated singleton fails', async () => {
		await clearSingleton();

		const version = await api.request(
			createContentVersion({
				collection: collections.singleton_articles,
				item: null,
				key: 'draft',
				name: 'draft',
			}),
		);

		await api.request(saveToContentVersion(version.id, { title: 'attempted' }));

		await api.request(updateSingleton(collections.singleton_articles, { title: 'pre-existing' }));

		await expect(api.request(promoteContentVersion(version.id))).rejects.toThrow();

		await api.request(deleteContentVersion(version.id));
		await clearSingleton();
	});
}
