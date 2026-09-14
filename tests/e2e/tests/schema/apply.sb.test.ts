import { sandbox } from '@directus/sandbox';
import {
	createCollection,
	createDirectus,
	createField,
	createItem,
	createRelation,
	deleteCollection,
	deleteField,
	readCollections,
	readFieldsByCollection,
	readItem,
	rest,
	schemaApply,
	schemaDiff,
	schemaSnapshot,
	type SchemaSnapshotOutput,
	staticToken,
	updateCollection,
	updateField,
	updateFields,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { afterAll, beforeEach, expect, test } from 'vitest';

/**
 * Applying a snapshot rewrites the whole schema, so this runs against its own instance.
 */
const directus = await sandbox(database, {
	port: sandboxPort(),
	inspect: false,
	prefix: 'schema-apply',
	env: { DB_FILENAME: `directus_test_${getUID()}.db` },
	docker: { suffix: getUID() },
});

const url = `http://localhost:${directus.apis[0]!.port}`;
const api = createDirectus<any>(url).with(rest()).with(staticToken('admin'));

afterAll(async () => {
	await directus.stop();
});

/** `articles` points at `authors`; `extra` exists only to hang new relations off. */
const ARTICLES = 'articles';
const AUTHORS = 'authors';
const EXTRA = 'extra';

const pk = () => ({
	field: 'id',
	type: 'integer',
	meta: { hidden: true, interface: 'input', readonly: true },
	schema: { is_primary_key: true, has_auto_increment: true },
});

/** Rebuilds the fixture schema from scratch, so every test starts from the same place. */
async function buildSchema() {
	// Dropped child first, since the others are referenced by its foreign keys
	for (const collection of [ARTICLES, AUTHORS, EXTRA]) {
		await api.request(deleteCollection(collection)).catch(() => {});
	}

	for (const collection of [AUTHORS, EXTRA]) {
		await api.request(
			createCollection({
				collection,
				fields: [pk(), { field: 'name', type: 'string', meta: { interface: 'input' }, schema: {} }],
				schema: {},
				meta: { singleton: false },
			} as any),
		);
	}

	await api.request(
		createCollection({
			collection: ARTICLES,
			fields: [
				pk(),
				{ field: 'title', type: 'string', meta: { interface: 'input' }, schema: {} },
				{ field: 'author_id', type: 'integer', meta: { interface: 'input' }, schema: {} },
			],
			schema: {},
			meta: { singleton: false },
		} as any),
	);

	await api.request(
		createField(AUTHORS, {
			field: 'articles',
			type: 'alias',
			meta: { special: ['o2m'], interface: 'list-o2m' },
		} as any),
	);

	await api.request(
		createRelation({
			collection: ARTICLES,
			field: 'author_id',
			related_collection: AUTHORS,
			schema: { on_delete: 'SET NULL' },
			meta: { one_field: 'articles', one_deselect_action: 'nullify' },
		} as any),
	);
}

let original: SchemaSnapshotOutput;

beforeEach(async () => {
	await buildSchema();
	original = await api.request(schemaSnapshot());
});

const names = async () => (await api.request(readCollections())).map((collection: any) => collection.collection);

/** Applies `snapshot` on top of the live schema. */
async function applySnapshot(snapshot: SchemaSnapshotOutput) {
	const diff = await api.request(schemaDiff(snapshot, { force: true }));

	if (diff) await api.request(schemaApply(diff));
}

test('a snapshot round trips through diff and apply', async () => {
	await api.request(deleteCollection(ARTICLES));
	await api.request(deleteCollection(AUTHORS));

	expect(await names()).not.toContain(ARTICLES);

	await applySnapshot(original);

	expect(await names()).toEqual(expect.arrayContaining([ARTICLES, AUTHORS]));

	const after = await api.request(schemaSnapshot());

	expect(after.collections.map((collection: any) => collection.collection).sort()).toEqual(
		original.collections.map((collection: any) => collection.collection).sort(),
	);

	expect(after.relations).toEqual(original.relations);
});

test('an empty snapshot removes every user collection', async () => {
	const empty = { ...original, collections: [], fields: [], relations: [] } as SchemaSnapshotOutput;

	await applySnapshot(empty);

	const remaining = await names();

	expect(remaining).not.toContain(ARTICLES);
	expect(remaining).not.toContain(AUTHORS);
	expect(remaining).not.toContain(EXTRA);
});

test('a yaml snapshot can be applied through a multipart request', async () => {
	const yaml = await (
		await fetch(`${url}/schema/snapshot?export=yaml`, { headers: { Authorization: 'Bearer admin' } })
	).text();

	await api.request(deleteCollection(ARTICLES));

	const form = new FormData();
	form.set('file', new Blob([yaml], { type: 'text/yaml' }), 'snapshot.yaml');

	const diff = await fetch(`${url}/schema/diff?force`, {
		method: 'POST',
		headers: { Authorization: 'Bearer admin' },
		body: form,
	});

	expect(diff.status).toBe(200);

	const apply = await fetch(`${url}/schema/apply`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: 'Bearer admin' },
		body: JSON.stringify((await diff.json()).data),
	});

	expect(apply.status).toBe(204);
	expect(await names()).toContain(ARTICLES);
});

test('a diff whose left hand side is not an object applies cleanly', async () => {
	// `meta.color` is null in the snapshot, so the diff has a scalar on the left
	await api.request(updateCollection(ARTICLES, { meta: { icon: 'abc', color: '#E35169' } } as any));

	await applySnapshot(original);

	const collection = (await api.request(readCollections())).find((entry: any) => entry.collection === ARTICLES);

	expect(collection.meta.color).toBeNull();
});

test('a diff of an array valued meta property applies cleanly', async () => {
	const field = (await api.request(readFieldsByCollection(ARTICLES))).find((entry: any) => entry.field === 'title');

	field.meta.translations = [
		{ language: 'en-US', translation: 'title' },
		{ language: 'nl-NL', translation: 'titel' },
	];

	await api.request(updateField(ARTICLES, 'title', field));

	const withTwo = await api.request(schemaSnapshot());

	field.meta.translations = [
		{ language: 'en-US', translation: 'title' },
		{ language: 'es-ES', translation: 'titulo' },
		{ language: 'nl-NL', translation: 'titel' },
	];

	await api.request(updateField(ARTICLES, 'title', field));

	await applySnapshot(withTwo);

	const applied = (await api.request(readFieldsByCollection(ARTICLES))).find((entry: any) => entry.field === 'title');

	expect(applied.meta.translations).toHaveLength(2);
});

test('a diff of field meta only changes applies cleanly', async () => {
	const fields = (await api.request(readFieldsByCollection(ARTICLES))).map((field: any) => field.field).sort();

	const sortPayload = (order: string[]) => order.map((field, index) => ({ field, meta: { sort: index + 1 } }));

	await api.request(updateFields(ARTICLES, sortPayload(fields) as any));

	const sorted = await api.request(schemaSnapshot());

	await api.request(updateFields(ARTICLES, sortPayload([...fields].reverse()) as any));

	await applySnapshot(sorted);

	const applied = await api.request(readFieldsByCollection(ARTICLES));

	for (const [index, field] of fields.entries()) {
		expect(applied.find((entry: any) => entry.field === field).meta.sort).toBe(index + 1);
	}
});

test('removing a relational field leaves the remaining relational data intact', async () => {
	const author = await api.request(createItem(AUTHORS, { name: 'Ada' }));
	const article = await api.request(createItem(ARTICLES, { title: 'Article', author_id: author.id }));

	// A field that is absent from the original snapshot, so applying it drops the field again
	await api.request(createField(ARTICLES, { field: 'temp_relational', type: 'integer', schema: {} } as any));

	await api.request(
		createRelation({
			collection: ARTICLES,
			field: 'temp_relational',
			related_collection: EXTRA,
			schema: { on_delete: 'SET NULL' },
			meta: {},
		} as any),
	);

	await applySnapshot(original);

	const after = await api.request(readItem(ARTICLES, article.id, { fields: ['*'] } as any));

	expect(after.author_id).toBe(author.id);

	const authorAfter = await api.request(readItem(AUTHORS, author.id, { fields: ['*', 'articles'] } as any));

	expect(authorAfter.articles).toEqual([article.id]);
});

test('a diff picks up foreign keys added after the snapshot was taken', async () => {
	const snapshot = await api.request(schemaSnapshot());

	await api.request(
		createField(ARTICLES, { field: 'extra_id', type: 'integer', meta: { interface: 'input' }, schema: {} } as any),
	);

	await api.request(
		createField(EXTRA, { field: 'articles', type: 'alias', meta: { special: ['o2m'], interface: 'list-o2m' } } as any),
	);

	await api.request(
		createRelation({
			collection: ARTICLES,
			field: 'extra_id',
			related_collection: EXTRA,
			schema: { on_delete: 'SET NULL' },
			meta: { one_field: 'articles', one_deselect_action: 'nullify' },
		} as any),
	);

	await applySnapshot(snapshot);

	const fields = (await api.request(readFieldsByCollection(ARTICLES))).map((field: any) => field.field);

	expect(fields).not.toContain('extra_id');
});

test('applying a stale diff is rejected because the schema hash moved on', async () => {
	const diff = await api.request(
		schemaDiff({ ...original, collections: [], fields: [], relations: [] } as any, { force: true }),
	);

	// The schema changes between taking the diff and applying it
	await api.request(deleteField(AUTHORS, 'articles'));

	await expect(api.request(schemaApply(diff!))).rejects.toMatchObject({
		errors: [{ message: expect.stringContaining("Provided hash does not match the current instance's schema hash") }],
	});
});
