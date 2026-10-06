import {
	createDirectus,
	createItem,
	createItems,
	deleteItem,
	deleteItems,
	readItem,
	readItems,
	rest,
	staticToken,
	updateItem,
	updateItems,
	updateItemsBatch,
} from '@directus/sdk';
import { database, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { range } from 'lodash-es';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

test('creates many items in one request', async () => {
	const marker = 'create-many';

	const created = await api.request(
		createItems(
			collections.articles,
			range(5).map((i) => ({ title: `${marker}-${i}` })),
		),
	);

	expect(created.length).toBe(5);
	expect(created.map((item) => item.title)).toEqual(range(5).map((i) => `${marker}-${i}`));

	const read = await api.request(readItems(collections.articles, { filter: { title: { _starts_with: marker } } }));

	expect(read.length).toBe(5);
});

test('updates many items by key to the same value', async () => {
	const marker = 'update-many';

	const created = await api.request(
		createItems(
			collections.articles,
			range(5).map((i) => ({ title: `${marker}-${i}` })),
		),
	);

	const updated = await api.request(
		updateItems(
			collections.articles,
			created.map((item) => item.id!),
			{ votes: 42 },
		),
	);

	expect(updated.length).toBe(5);
	expect(updated.every((item) => item.votes === 42)).toBe(true);
});

test('updates many items by query', async () => {
	const marker = 'update-by-query';

	await api.request(
		createItems(
			collections.articles,
			range(5).map((i) => ({ title: `${marker}-${i}` })),
		),
	);

	const updated = await api.request(
		updateItems(collections.articles, { filter: { title: { _starts_with: marker } } }, { votes: 7 }),
	);

	expect(updated.length).toBe(5);
	expect(updated.every((item) => item.votes === 7)).toBe(true);
});

test('updates a batch of items to individual values', async () => {
	const marker = 'update-batch';

	const created = await api.request(
		createItems(
			collections.articles,
			range(5).map((i) => ({ title: `${marker}-${i}` })),
		),
	);

	const updated = await api.request(
		updateItemsBatch(
			collections.articles,
			created.map((item, i) => ({ id: item.id, votes: i * 10 })),
		),
	);

	expect(updated.length).toBe(5);
	expect(updated.map((item) => item.votes)).toEqual([0, 10, 20, 30, 40]);
});

test('deletes many items by key', async () => {
	const marker = 'delete-many';

	const created = await api.request(
		createItems(
			collections.articles,
			range(5).map((i) => ({ title: `${marker}-${i}` })),
		),
	);

	await api.request(
		deleteItems(
			collections.articles,
			created.map((item) => item.id!),
		),
	);

	const read = await api.request(readItems(collections.articles, { filter: { title: { _starts_with: marker } } }));

	expect(read.length).toBe(0);
});

test('deletes many items by query', async () => {
	const marker = 'delete-by-query';

	await api.request(
		createItems(
			collections.articles,
			range(5).map((i) => ({ title: `${marker}-${i}` })),
		),
	);

	await api.request(deleteItems(collections.articles, { filter: { title: { _starts_with: marker } } }));

	const read = await api.request(readItems(collections.articles, { filter: { title: { _starts_with: marker } } }));

	expect(read.length).toBe(0);
});

test('updates and deletes a single item', async () => {
	const created = await api.request(createItem(collections.articles, { title: 'single' }));

	const updated = await api.request(updateItem(collections.articles, created.id!, { title: 'single updated' }));

	expect(updated.title).toBe('single updated');

	await api.request(deleteItem(collections.articles, created.id!));

	await expect(api.request(readItem(collections.articles, created.id!))).rejects.toThrowError();
});

test('errors when reading an item with an id that does not exist', async () => {
	await expect(api.request(readItem(collections.articles, 99999999))).rejects.toMatchObject({
		errors: [{ extensions: { code: 'FORBIDDEN' } }],
	});
});

test('errors when reading an item with an id of the wrong type', async () => {
	await expect(api.request(readItem(collections.articles, 'not-an-id'))).rejects.toThrowError();
});

test('errors when reading from a collection that does not exist', async () => {
	await expect(api.request(readItems('no_such_collection' as any))).rejects.toMatchObject({
		errors: [{ extensions: { code: 'FORBIDDEN' } }],
	});
});

test('errors when creating in a collection that does not exist', async () => {
	await expect(api.request(createItem('no_such_collection' as any, { title: 'nope' }))).rejects.toMatchObject({
		errors: [{ extensions: { code: 'FORBIDDEN' } }],
	});
});

// Only databases with a sequence backed auto increment advance past an explicitly inserted key
const advancesSequence = !['cockroachdb', 'mssql', 'oracle'].includes(database);

test.skipIf(!advancesSequence)('an explicit primary key advances the auto increment value', async () => {
	const marker = 'auto-increment';
	const explicitId = 101111;

	const created = await api.request(
		createItems(collections.articles, [
			{ id: explicitId, title: `${marker}-explicit` },
			{ title: `${marker}-implicit` },
		] as any),
	);

	expect(created.map((item) => item.id)).toEqual([explicitId, explicitId + 1]);
});

test('deselecting o2m items applies to every child, not just the first page', { timeout: 60_000 }, async () => {
	const marker = 'deselect';
	// One over the default query limit, so a paginated read of the existing children would miss one
	const count = 101;

	const article = await api.request(
		createItem(collections.articles, {
			title: marker,
			links: range(count).map((i) => ({ link: `${marker}-${i}` })),
		}),
	);

	await api.request(
		updateItem(collections.articles, article.id!, { links: [{ link: `${marker}-replacement` }] } as any),
	);

	const remaining = await api.request(
		readItems(collections.links, {
			filter: { _and: [{ link: { _starts_with: marker } }, { article_id: { _nnull: true } }] },
			limit: -1,
		}),
	);

	expect(remaining.map((item) => item.link)).toEqual([`${marker}-replacement`]);
});
