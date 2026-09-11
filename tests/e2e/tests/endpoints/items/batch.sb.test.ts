import { sandbox } from '@directus/sandbox';
import {
	createDirectus,
	createItem,
	createItems,
	deleteItems,
	rest,
	staticToken,
	updateItems,
	updateItemsBatch,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { range } from 'lodash-es';
import { afterAll, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const LIMIT = 10;

const directus = await sandbox(database, {
	port: sandboxPort(),
	inspect: false,
	prefix: 'batch-limit',
	env: {
		MAX_BATCH_MUTATION: String(LIMIT),
		DB_FILENAME: `directus_test_${getUID()}.db`,
	},
	docker: {
		suffix: getUID(),
	},
});

const api = createDirectus<Schema>(`http://localhost:${directus.apis[0]!.port}`)
	.with(rest())
	.with(staticToken('admin'));

const { collections } = await useSnapshot<Schema>(api);

const MESSAGE = `Invalid payload. Exceeded max batch mutation limit of ${LIMIT}.`;

afterAll(async () => {
	await directus.stop();
});

function articles(marker: string, count: number) {
	return range(count).map((i) => ({ title: `${marker}-${i}` }));
}

test('createMany passes at the limit', async () => {
	const created = await api.request(createItems(collections.articles, articles('create-at', LIMIT)));

	expect(created.length).toBe(LIMIT);
});

test('createMany errors above the limit', async () => {
	await expect(
		api.request(createItems(collections.articles, articles('create-over', LIMIT + 1))),
	).rejects.toMatchObject({ errors: [{ message: MESSAGE }] });
});

test('nested relational writes count towards the limit', async () => {
	// One article plus its links, so the article itself takes up one of the allowed mutations
	const atLimit = await api.request(
		createItem(collections.articles, {
			title: 'nested-at',
			links: range(LIMIT - 1).map((i) => ({ link: `nested-at-${i}` })),
		}),
	);

	expect(atLimit.id).toBeDefined();

	await expect(
		api.request(
			createItem(collections.articles, {
				title: 'nested-over',
				links: range(LIMIT).map((i) => ({ link: `nested-over-${i}` })),
			}),
		),
	).rejects.toMatchObject({ errors: [{ message: MESSAGE }] });
});

test('updateBatch passes at the limit and errors above it', async () => {
	const created = await api.request(createItems(collections.articles, articles('update-batch', LIMIT)));

	const updated = await api.request(
		updateItemsBatch(
			collections.articles,
			created.map((item, i) => ({ id: item.id, votes: i })),
		),
	);

	expect(updated.length).toBe(LIMIT);

	const extra = await api.request(createItems(collections.articles, articles('update-batch-extra', 1)));

	await expect(
		api.request(
			updateItemsBatch(
				collections.articles,
				[...created, ...extra].map((item, i) => ({ id: item.id, votes: i })),
			),
		),
	).rejects.toMatchObject({ errors: [{ message: MESSAGE }] });
});

test('updateMany by key passes at the limit and errors above it', async () => {
	// Seeded in two calls, since a single create of LIMIT + 1 items would hit the limit itself
	const created = await api.request(createItems(collections.articles, articles('update-keys', LIMIT)));
	const extra = await api.request(createItems(collections.articles, articles('update-keys-extra', 1)));

	const ids = [...created, ...extra].map((item) => item.id!);

	const updated = await api.request(updateItems(collections.articles, ids.slice(0, LIMIT), { votes: 1 }));

	expect(updated.length).toBe(LIMIT);

	await expect(api.request(updateItems(collections.articles, ids, { votes: 2 }))).rejects.toMatchObject({
		errors: [{ message: MESSAGE }],
	});
});

test('updateMany by query passes at the limit and errors above it', async () => {
	const marker = 'update-query';

	await api.request(createItems(collections.articles, articles(marker, LIMIT)));

	const updated = await api.request(
		updateItems(collections.articles, { filter: { title: { _starts_with: marker } } }, { votes: 1 }),
	);

	expect(updated.length).toBe(LIMIT);

	await api.request(createItems(collections.articles, articles(`${marker}-extra`, 1)));

	await expect(
		api.request(updateItems(collections.articles, { filter: { title: { _starts_with: marker } } }, { votes: 2 })),
	).rejects.toMatchObject({ errors: [{ message: MESSAGE }] });
});

test('deleteMany by key passes at the limit and errors above it', async () => {
	const created = await api.request(createItems(collections.articles, articles('delete-keys', LIMIT)));
	const extra = await api.request(createItems(collections.articles, articles('delete-keys-extra', 1)));

	const ids = [...created, ...extra].map((item) => item.id!);

	await expect(api.request(deleteItems(collections.articles, ids))).rejects.toMatchObject({
		errors: [{ message: MESSAGE }],
	});

	await api.request(deleteItems(collections.articles, ids.slice(0, LIMIT)));
});

test('deleteMany by query passes at the limit and errors above it', async () => {
	await api.request(createItems(collections.articles, articles('dq-a', LIMIT)));
	await api.request(createItems(collections.articles, articles('dq-b', 1)));

	await expect(
		api.request(deleteItems(collections.articles, { filter: { title: { _starts_with: 'dq-' } } })),
	).rejects.toMatchObject({ errors: [{ message: MESSAGE }] });

	await api.request(deleteItems(collections.articles, { filter: { title: { _starts_with: 'dq-a' } } }));
});
