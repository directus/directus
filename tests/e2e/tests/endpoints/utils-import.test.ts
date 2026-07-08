import { randomUUID } from 'node:crypto';
import {
	createCollection,
	createDirectus,
	createField,
	createItem,
	createRelation,
	deleteCollection,
	readItems,
	rest,
	staticToken,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { afterAll, describe, expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

/** Unique, short prefix so collections from this file don't clash on the shared instance. */
const prefix = `imp_${randomUUID().replace(/-/g, '').slice(0, 8)}_`;
const createdCollections: string[] = [];

type Pk = 'integer' | 'uuid';

async function makeCollection(name: string, pk: Pk = 'integer'): Promise<string> {
	const collection = prefix + name;

	const idField =
		pk === 'uuid'
			? {
					field: 'id',
					type: 'uuid' as const,
					meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
					schema: { is_primary_key: true, length: 36, has_auto_increment: false },
				}
			: {
					field: 'id',
					type: 'integer' as const,
					meta: { hidden: true, interface: 'input', readonly: true },
					schema: { is_primary_key: true, has_auto_increment: true },
				};

	await api.request(createCollection({ collection, fields: [idField], schema: {}, meta: {} }));
	createdCollections.unshift(collection);
	return collection;
}

async function makeField(collection: string, field: string, type = 'string'): Promise<void> {
	await api.request(createField(collection, { field, type, meta: {}, schema: {} }));
}

async function makeM2O(
	collection: string,
	field: string,
	related: string,
	options: { nullable?: boolean; relatedPk?: Pk } = {},
): Promise<void> {
	const { nullable = true, relatedPk = 'integer' } = options;

	await api.request(
		createField(collection, {
			field,
			type: relatedPk,
			meta: { special: ['m2o'], interface: 'select-dropdown-m2o' },
			schema: { is_nullable: nullable },
		}),
	);

	await api.request(
		createRelation({
			collection,
			field,
			related_collection: related,
			schema: { on_delete: nullable ? 'SET NULL' : 'NO ACTION' },
		} as any),
	);
}

async function importData(
	body: { collection: string; items: Record<string, unknown>[] }[],
	params: Record<string, string> = {},
): Promise<{ status: number; body: any }> {
	const url = new URL(`http://localhost:${port}/utils/import`);
	for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

	// The batch payload is uploaded as a JSON file (bypasses MAX_PAYLOAD_SIZE); let fetch set the
	// multipart Content-Type + boundary itself
	const form = new FormData();
	form.append('file', new Blob([JSON.stringify(body)], { type: 'application/json' }), 'import.json');

	const response = await fetch(url, {
		method: 'POST',
		headers: { Authorization: 'Bearer admin' },
		body: form,
	});

	return { status: response.status, body: await response.json().catch(() => null) };
}

afterAll(async () => {
	for (const collection of createdCollections) {
		await api.request(deleteCollection(collection)).catch(() => {
			/* best-effort cleanup */
		});
	}
});

describe('POST /utils/import', () => {
	test('imports a linear relation in dependency order and remaps foreign keys (add mode)', async () => {
		const authors = await makeCollection('lin_authors');
		await makeField(authors, 'name');
		const articles = await makeCollection('lin_articles');
		await makeField(articles, 'title');
		await makeM2O(articles, 'author', authors, { nullable: true });

		const { status, body } = await importData(
			[
				{
					collection: authors,
					items: [
						{ id: 1, name: 'Ada' },
						{ id: 2, name: 'Alan' },
					],
				},
				{
					collection: articles,
					items: [
						{ id: 100, title: 'On Computability', author: 2 },
						{ id: 101, title: 'The Analytical Engine', author: 1 },
					],
				},
			],
			{ mode: 'add' },
		);

		expect(status).toBe(200);
		expect(body.data.applied).toBe(true);
		expect(body.data.collections[authors].new).toHaveLength(2);
		expect(body.data.collections[articles].new).toHaveLength(2);

		// Verify the foreign keys were remapped by reading the linked author name
		const rows = await api.request(
			readItems(articles as any, { sort: ['title'] as any, fields: ['title', 'author.name'] as any }),
		);

		expect(rows).toEqual([
			expect.objectContaining({ title: 'On Computability', author: { name: 'Alan' } }),
			expect.objectContaining({ title: 'The Analytical Engine', author: { name: 'Ada' } }),
		]);
	});

	test('merge mode preserves UUID primary keys and upserts on re-import', async () => {
		const people = await makeCollection('merge_people', 'uuid');
		await makeField(people, 'name');

		const id = randomUUID();

		const first = await importData([{ collection: people, items: [{ id, name: 'First' }] }], { mode: 'merge' });

		expect(first.status).toBe(200);
		// New row, key preserved (not remapped)
		expect(first.body.data.collections[people].new).toEqual([id]);
		expect(first.body.data.collections[people].mapped).toEqual({});

		const second = await importData([{ collection: people, items: [{ id, name: 'Second' }] }], { mode: 'merge' });

		expect(second.status).toBe(200);
		// Second import matches the existing row
		expect(second.body.data.collections[people].existing).toEqual([id]);

		const rows = await api.request(readItems(people as any, { fields: ['*'] as any }));

		// Upsert: same row, updated value
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ id, name: 'Second' });
	});

	test('add mode regenerates a conflicting UUID primary key', async () => {
		const people = await makeCollection('add_people', 'uuid');
		await makeField(people, 'name');

		const id = randomUUID();
		await api.request(createItem(people as any, { id, name: 'Existing' } as any));

		const { status, body } = await importData([{ collection: people, items: [{ id, name: 'Incoming' }] }], {
			mode: 'add',
		});

		expect(status).toBe(200);

		const newId = body.data.collections[people].mapped[id];
		expect(newId).not.toBe(id);
		expect(body.data.collections[people].new).toEqual([newId]);

		const rows = await api.request(readItems(people as any, { sort: ['name'] as any, fields: ['*'] as any }));

		expect(rows).toHaveLength(2);
		expect(rows.map((r: any) => r.name).sort()).toEqual(['Existing', 'Incoming']);
	});

	test('breaks a nullable self-reference with a second pass', async () => {
		const categories = await makeCollection('self_categories');
		await makeField(categories, 'name');
		await makeM2O(categories, 'parent', categories, { nullable: true });

		const { status, body } = await importData([
			{
				collection: categories,
				items: [
					{ id: 1, name: 'root', parent: null },
					{ id: 2, name: 'child', parent: 1 },
					{ id: 3, name: 'grandchild', parent: 2 },
				],
			},
		]);

		expect(status).toBe(200);

		// old id -> final id (remapped when changed, otherwise unchanged)
		const mapped = body.data.collections[categories].mapped;
		const resolve = (oldId: number) => mapped[String(oldId)] ?? oldId;

		const rows = await api.request(readItems(categories as any, { sort: ['name'] as any, fields: ['*'] as any }));
		const byName = Object.fromEntries(rows.map((r: any) => [r.name, r]));

		// Correct parent links prove the deferred second pass ran
		expect(byName['root'].parent).toBeNull();
		expect(byName['child'].parent).toBe(resolve(1));
		expect(byName['grandchild'].parent).toBe(resolve(2));
	});

	test('breaks a nullable cross-collection cycle', async () => {
		const countries = await makeCollection('cyc_countries');
		await makeField(countries, 'name');
		const cities = await makeCollection('cyc_cities');
		await makeField(cities, 'name');

		await makeM2O(countries, 'capital', cities, { nullable: true });
		await makeM2O(cities, 'country', countries, { nullable: true });

		const { status, body } = await importData([
			{ collection: countries, items: [{ id: 1, name: 'Utopia', capital: 10 }] },
			{ collection: cities, items: [{ id: 10, name: 'Capital City', country: 1 }] },
		]);

		expect(status).toBe(200);

		const countryId = body.data.collections[countries].mapped['1'] ?? 1;
		const cityId = body.data.collections[cities].mapped['10'] ?? 10;

		const [country] = (await api.request(readItems(countries as any, { fields: ['*'] as any }))) as any[];
		const [city] = (await api.request(readItems(cities as any, { fields: ['*'] as any }))) as any[];

		expect(country.capital).toBe(cityId);
		expect(city.country).toBe(countryId);
	});

	test('rejects an unresolvable non-nullable cycle', async () => {
		const left = await makeCollection('unres_left');
		const right = await makeCollection('unres_right');

		await makeM2O(left, 'right_ref', right, { nullable: false });
		await makeM2O(right, 'left_ref', left, { nullable: false });

		const { status, body } = await importData([
			{ collection: left, items: [{ id: 1, right_ref: 1 }] },
			{ collection: right, items: [{ id: 1, left_ref: 1 }] },
		]);

		expect(status).toBe(422);
		expect(body.errors[0].extensions.code).toBe('UNPROCESSABLE_CONTENT');
	});

	test('dry run does not persist any data', async () => {
		const authors = await makeCollection('dry_authors');
		await makeField(authors, 'name');

		const { status, body } = await importData([{ collection: authors, items: [{ id: 1, name: 'Ghost' }] }], {
			mode: 'add',
			dryRun: 'true',
		});

		expect(status).toBe(200);
		expect(body.data.applied).toBe(false);
		expect(body.data.collections[authors]).toBeDefined();

		const rows = await api.request(readItems(authors as any, { fields: ['*'] as any }));
		expect(rows).toHaveLength(0);
	});

	test('rejects a dangling foreign key reference', async () => {
		const authors = await makeCollection('dangle_authors');
		await makeField(authors, 'name');
		const articles = await makeCollection('dangle_articles');
		await makeField(articles, 'title');
		await makeM2O(articles, 'author', authors, { nullable: true });

		// author 999 is neither in the import nor in the database
		const { status, body } = await importData([
			{ collection: articles, items: [{ id: 1, title: 'Orphan', author: 999 }] },
		]);

		expect(status).toBe(400);
		expect(body.errors[0].extensions.code).toBe('INVALID_FOREIGN_KEY');
	});
});
