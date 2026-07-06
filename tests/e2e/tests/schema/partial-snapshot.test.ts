import { randomUUID } from 'node:crypto';
import { createCollection, createDirectus, deleteCollection, rest, schemaSnapshot, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { afterAll, describe, expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

const suffix = randomUUID().replace(/-/g, '');
const authors = `authors_${suffix}`;
const articles = `articles_${suffix}`;
const tags = `tags_${suffix}`;

const intPrimaryKey = () => ({
	field: 'id',
	type: 'integer' as const,
	meta: { hidden: true },
	schema: { is_primary_key: true, has_auto_increment: true },
});

await api.request(createCollection({ collection: authors, fields: [intPrimaryKey()], schema: {}, meta: {} }));
await api.request(createCollection({ collection: articles, fields: [intPrimaryKey()], schema: {}, meta: {} }));
await api.request(createCollection({ collection: tags, fields: [intPrimaryKey()], schema: {}, meta: {} }));

afterAll(async () => {
	await api.request(deleteCollection(articles)).catch(() => {});
	await api.request(deleteCollection(authors)).catch(() => {});
	await api.request(deleteCollection(tags)).catch(() => {});
});

const owners = (rows: Record<string, any>[]) => rows.map((row) => row['collection']);

describe('GET /schema/snapshot — partial (collection scoping)', () => {
	test('scopes the snapshot to the included collections', async () => {
		const snapshot = await api.request(schemaSnapshot({ includeCollections: [articles, authors] }));

		expect(snapshot.version).toBe(2);
		expect(owners(snapshot.collections).sort()).toEqual([articles, authors].sort());
		expect(owners(snapshot.fields)).not.toContain(tags);
	});

	test('excludes the named collections from the snapshot', async () => {
		const snapshot = await api.request(schemaSnapshot({ excludeCollections: [tags] }));

		expect(snapshot.version).toBe(2);
		expect(owners(snapshot.collections)).toContain(articles);
		expect(owners(snapshot.collections)).not.toContain(tags);
	});

	test('silently skips an unknown collection name', async () => {
		const snapshot = await api.request(schemaSnapshot({ includeCollections: [articles, `missing_${suffix}`] }));

		expect(snapshot.version).toBe(2);
		expect(owners(snapshot.collections)).toEqual([articles]);
	});
});
