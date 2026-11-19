import {
	createCollection,
	createDirectus,
	createField,
	createRelation,
	createUser,
	deleteCollection,
	deleteField,
	deleteUser,
	readCollections,
	rest,
	schemaApply,
	schemaDiff,
	schemaSnapshot,
	staticToken,
	updateCollection,
	updateField,
	updateRelation,
} from '@directus/sdk';
import type { Snapshot } from '@directus/types';
import { database, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import type { Knex } from 'knex';
import { afterAll, describe, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { snapshot } from './snapshot.js';
import { getColumn, getColumns, getForeignKey, knex, LINK, SHADOW } from './versions.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, snapshot);

const META = [
	'version_date_created',
	'version_date_updated',
	'version_id',
	'version_name',
	'version_type',
	'version_user_created',
	'version_user_updated',
];

const columns = (...names: string[]) => [...names].sort();

/**
 * MySQL refuses to change columns referenced by foreign keys. SQLite checks the foreign keys of the whole database
 * after rebuilding a table, which fails on references that concurrently running tests leave dangling while cleaning up.
 */
async function withoutForeignKeyChecks(fn: (db: Knex) => Promise<unknown>) {
	if (database === 'sqlite') {
		await knex.raw('PRAGMA foreign_keys = OFF');

		try {
			return await fn(knex);
		} finally {
			await knex.raw('PRAGMA foreign_keys = ON');
		}
	}

	if (database === 'mysql' || database === 'maria') {
		return knex.transaction(async (trx) => {
			await trx.raw('SET FOREIGN_KEY_CHECKS = 0');

			try {
				return await fn(trx);
			} finally {
				await trx.raw('SET FOREIGN_KEY_CHECKS = 1');
			}
		});
	}

	return fn(knex);
}

afterAll(async () => {
	await knex.destroy();
});

test('creates shadow tables mirroring the fields of versioned collections', async () => {
	expect(await getColumns(SHADOW + collections.posts)).toEqual(
		columns(
			...META,
			'id',
			'title',
			'views',
			'author',
			'category',
			'parent',
			'attachment',
			'collection',
			'version_ref_author',
			'version_ref_parent',
			'version_ref_attachment',
		),
	);

	expect(await getColumns(SHADOW + collections.posts_blocks)).toEqual(
		columns(...META, 'id', 'posts_id', 'item', 'collection', 'version_ref_posts_id', 'version_ref_item'),
	);

	expect(await getColumns(SHADOW + collections.authors)).toEqual(columns(...META, 'id', 'name'));
	expect(await getColumns(SHADOW + collections.categories)).toBeNull();
	expect(await getColumns(SHADOW + collections.languages)).toBeNull();
});

test('removes constraints from mirrored fields', async () => {
	await api.request(
		createField(collections.posts, {
			field: 'subtitle',
			type: 'string',
			schema: { is_nullable: false, default_value: 'none', is_unique: true, max_length: 50 },
		}),
	);

	const column = await getColumn(SHADOW + collections.posts, 'subtitle');

	expect(column).toMatchObject({ is_nullable: true, default_value: null, is_unique: false, max_length: 50 });
});

test('mirrors field updates and deletions', async () => {
	// Not unique, as CockroachDB can't change the type of indexed columns
	await api.request(createField(collections.posts, { field: 'summary', type: 'string', schema: { max_length: 50 } }));
	await api.request(updateField(collections.posts, 'summary', { schema: { max_length: 100 } }));

	expect((await getColumn(SHADOW + collections.posts, 'summary')).max_length).toBe(100);

	await api.request(deleteField(collections.posts, 'summary'));

	expect(await getColumns(SHADOW + collections.posts)).not.toContain('summary');
});

test('creates link tables only for collections with an o2m from a versioned collection', async () => {
	// posts only has m2o / a2o relations to versioned collections, without an o2m pointing back
	expect(await getColumns(LINK + collections.posts)).toBeNull();
	expect(await getColumns(LINK + collections.notes)).toEqual(columns('id', 'post_id'));
	expect(await getColumns(LINK + collections.links)).toEqual(columns('id', 'post_id'));
	expect(await getColumns(LINK + collections.posts_tags_junction)).toEqual(columns('id', 'posts_id', 'tags_id'));
	expect(await getColumns(LINK + collections.posts_blocks)).toEqual(columns('id', 'posts_id', 'item'));
	expect(await getColumns(LINK + collections.posts_translations)).toEqual(columns('id', 'posts_id'));

	expect(await getColumns(LINK + collections.authors)).toBeNull();
	expect(await getColumns(LINK + collections.categories)).toBeNull();
});

test('mirrors relations that are added and removed', async () => {
	await api.request(createField(collections.posts, { field: 'editor', type: 'integer', schema: {} }));

	await api.request(
		createRelation({
			collection: collections.posts,
			field: 'editor',
			related_collection: collections.authors,
			// MSSQL rejects a second cascade path to the same table, `author` already sets null
			schema: { on_delete: 'NO ACTION' },
		}),
	);

	expect(await getColumns(SHADOW + collections.posts)).toContain('version_ref_editor');
	expect(await getColumns(LINK + collections.posts)).toBeNull();

	// Deleting the field removes its relation as well
	await api.request(deleteField(collections.posts, 'editor'));

	expect(await getColumns(SHADOW + collections.posts)).not.toContain('version_ref_editor');
	expect(await getColumns(SHADOW + collections.posts)).not.toContain('editor');
});

test('adding and removing an o2m creates and drops the link table', async () => {
	await api.request(
		createField(collections.authors, { field: 'posts', type: 'alias', meta: { special: ['o2m'] }, schema: null }),
	);

	await api.request(updateRelation(collections.posts, 'author', { meta: { one_field: 'posts' } }));

	expect(await getColumns(LINK + collections.posts)).toEqual(columns('id', 'author', 'parent', 'attachment'));

	await api.request(deleteField(collections.authors, 'posts'));

	expect(await getColumns(LINK + collections.posts)).toBeNull();
});

test('hides version tables from the collections', async () => {
	const names = (await api.request(readCollections())).map(({ collection }: { collection: string }) => collection);

	expect(names).toContain(collections.posts);
	expect(names.filter((name: string) => name.startsWith(SHADOW) || name.startsWith(LINK))).toEqual([]);
});

test('rejects fields named like version table columns before changing the live table', async () => {
	for (const field of ['version_type', 'version_ref_author']) {
		await expect(api.request(createField(collections.posts, { field, type: 'string' }))).rejects.toBeDefined();
		expect(await getColumns(collections.posts)).not.toContain(field);
	}

	const name = `${collections.categories}_reserved`;

	await expect(
		api.request(
			createCollection({
				collection: name,
				meta: { versioning: true },
				schema: {},
				fields: [
					{ field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true } },
					{ field: 'version_type', type: 'string' },
				],
			}),
		),
	).rejects.toBeDefined();

	expect(await getColumns(name)).toBeNull();
});

test('mirrors decimals without losing their precision', async () => {
	await api.request(
		createField(collections.posts, {
			field: 'price',
			type: 'decimal',
			schema: { numeric_precision: 12, numeric_scale: 4 },
		}),
	);

	const live = await getColumn(collections.posts, 'price');
	const mirror = await getColumn(SHADOW + collections.posts, 'price');

	expect([mirror.numeric_precision, mirror.numeric_scale]).toEqual([live.numeric_precision, live.numeric_scale]);

	await knex(SHADOW + collections.posts).insert({ title: 'decimal', price: 1.2345 });

	const { price } = await knex(SHADOW + collections.posts)
		.where({ title: 'decimal' })
		.first();

	expect(Number(price)).toBe(1.2345);

	await api.request(deleteField(collections.posts, 'price'));
});

test('link tables can reference live items with uuid keys', async () => {
	const parent = `${collections.categories}_parent`;
	const child = `${collections.categories}_child`;

	await api.request(
		createCollection({
			collection: parent,
			schema: {},
			fields: [{ field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true } }],
		}),
	);

	await api.request(
		createCollection({
			collection: child,
			schema: {},
			fields: [
				{ field: 'id', type: 'uuid', meta: { special: ['uuid'] }, schema: { is_primary_key: true } },
				{ field: 'parent', type: 'integer' },
			],
		}),
	);

	await api.request(createField(parent as any, { field: 'children', type: 'alias', meta: { special: ['o2m'] } }));

	await api.request(
		createRelation({
			collection: child,
			field: 'parent',
			related_collection: parent,
			meta: { one_field: 'children' },
			schema: { on_delete: 'SET NULL' },
		} as any),
	);

	await api.request(updateCollection(parent as any, { meta: { versioning: true } }));

	expect(await getColumns(LINK + child)).toEqual(columns('id', 'parent'));
	expect((await getColumn(LINK + child, 'id')).data_type).toBe((await getColumn(child, 'id')).data_type);

	await api.request(deleteCollection(child));
	await api.request(deleteCollection(parent));
});

test('enabling and disabling versioning creates and drops the tables', async () => {
	await api.request(updateCollection(collections.categories, { meta: { versioning: true } }));

	expect(await getColumns(SHADOW + collections.categories)).toEqual(columns(...META, 'id', 'name'));
	expect(await getColumns(SHADOW + collections.posts)).toContain('version_ref_category');
	expect(await getColumns(LINK + collections.posts)).toBeNull();

	await api.request(updateCollection(collections.categories, { meta: { versioning: false } }));

	expect(await getColumns(SHADOW + collections.categories)).toBeNull();
	expect(await getColumns(SHADOW + collections.posts)).not.toContain('version_ref_category');
});

test('deleting a versioned collection drops its version tables', async () => {
	const name = `${collections.categories}_temp`;

	await api.request(
		createCollection({
			collection: name,
			meta: { versioning: true },
			schema: {},
			fields: [{ field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true } }],
		}),
	);

	expect(await getColumns(SHADOW + name)).toEqual(columns(...META, 'id'));

	await api.request(deleteCollection(name));

	expect(await getColumns(SHADOW + name)).toBeNull();
});

test('disabling versioning on a related collection updates the link tables', async () => {
	await api.request(updateCollection(collections.posts, { meta: { versioning: false } }));

	expect(await getColumns(SHADOW + collections.posts)).toBeNull();
	expect(await getColumns(LINK + collections.notes)).toBeNull();
	// The junction's only o2m is from posts, so its live items can no longer belong to a version
	expect(await getColumns(LINK + collections.posts_tags_junction)).toBeNull();
	expect(await getColumns(SHADOW + collections.posts_tags_junction)).not.toContain('version_ref_posts_id');
});

describe('columns created outside of Directus', () => {
	const name = `${collections.categories}_numbers`;
	const PRECISE = 0.1234567890123;

	afterAll(async () => {
		await api.request(deleteCollection(name as any));
	});

	test('are mirrored with their exact type', async () => {
		await knex.schema.createTable(name, (table) => {
			table.increments('id');
			table.double('ratio');
			table.smallint('rank');
		});

		await api.request(updateCollection(name as any, { meta: { versioning: true } }));

		for (const field of ['ratio', 'rank']) {
			const live = await getColumn(name, field);
			const mirror = await getColumn(SHADOW + name, field);

			expect({ field, type: mirror.data_type, precision: mirror.numeric_precision }).toEqual({
				field,
				type: live.data_type,
				precision: live.numeric_precision,
			});
		}

		await knex(SHADOW + name).insert({ ratio: PRECISE, rank: 1 });

		const { ratio } = await knex(SHADOW + name).first();

		expect(Number(ratio)).toBe(PRECISE);
	});

	// The catalog row of a column is only rewritten when the column is altered
	test.runIf(database === 'postgres')('are not altered by unrelated schema changes', async () => {
		const readCatalogRows = () =>
			knex
				.select('attribute.attname', knex.raw('attribute.xmin::text as xmin'))
				.from('pg_attribute as attribute')
				.join('pg_class as class', 'class.oid', 'attribute.attrelid')
				.where('class.relname', SHADOW + name)
				// `id` is mirrored without a type change, so its row has to stay the same either way
				.whereIn('attribute.attname', ['id', 'ratio', 'rank'])
				.orderBy('attribute.attname');

		const before = await readCatalogRows();

		await api.request(createField(name as any, { field: 'note', type: 'string' }));

		expect(await getColumns(SHADOW + name)).toContain('note');
		expect(await readCatalogRows()).toEqual(before);
	});
});

// CockroachDB can't change the type of indexed columns, MSSQL can't alter columns referenced by foreign keys
test.skipIf(['cockroachdb', 'mssql'].includes(database))(
	'mirrors primary key changes to the link table on the next sync',
	async () => {
		const parent = `${collections.categories}_pk_parent`;
		const child = `${collections.categories}_pk_child`;

		await api.request(
			createCollection({
				collection: parent,
				meta: { versioning: true },
				schema: {},
				fields: [{ field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true } }],
			}),
		);

		await api.request(
			createCollection({
				collection: child,
				schema: {},
				fields: [
					{ field: 'id', type: 'string', schema: { is_primary_key: true, max_length: 50 } },
					{ field: 'parent', type: 'integer' },
				],
			}),
		);

		await api.request(createField(parent as any, { field: 'children', type: 'alias', meta: { special: ['o2m'] } }));

		await api.request(
			createRelation({
				collection: child,
				field: 'parent',
				related_collection: parent,
				meta: { one_field: 'children' },
				schema: { on_delete: 'SET NULL' },
			} as any),
		);

		expect((await getColumn(LINK + child, 'id')).max_length).toBe(50);

		// Changed directly, as Postgres rejects the `drop not null` Directus emits when altering a primary key
		await withoutForeignKeyChecks((db) =>
			db.schema.alterTable(child, (table) => {
				table.string('id', 100).notNullable().alter({ alterNullable: false });
			}),
		);

		await api.request(createField(child as any, { field: 'note', type: 'string' }));

		expect((await getColumn(child, 'id')).max_length).toBe(100);
		expect((await getColumn(LINK + child, 'id')).max_length).toBe(100);

		await api.request(deleteCollection(child));
		await api.request(deleteCollection(parent));
	},
);

// Oracle doesn't support on update actions
test.skipIf(database === 'oracle')('copies the on update action to the foreign keys of mirrored fields', async () => {
	const target = `${collections.categories}_update_target`;
	const source = `${collections.categories}_update_source`;

	await api.request(
		createCollection({
			collection: target,
			schema: {},
			fields: [{ field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true } }],
		}),
	);

	await api.request(
		createCollection({
			collection: source,
			meta: { versioning: true },
			schema: {},
			fields: [
				{ field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true } },
				{ field: 'target', type: 'integer' },
			],
		}),
	);

	await api.request(
		createRelation({
			collection: source,
			field: 'target',
			related_collection: target,
			schema: { on_delete: 'SET NULL', on_update: 'CASCADE' },
		} as any),
	);

	expect(await getForeignKey(source, 'target')).toMatchObject({ on_delete: 'SET NULL', on_update: 'CASCADE' });
	expect(await getForeignKey(SHADOW + source, 'target')).toMatchObject({ on_delete: 'SET NULL', on_update: 'CASCADE' });

	await api.request(deleteCollection(source));
	await api.request(deleteCollection(target));
});

test('deleting a user clears its references from the version tables', async () => {
	const name = `${collections.categories}_owned`;

	await api.request(
		createCollection({
			collection: name,
			meta: { versioning: true },
			schema: {},
			fields: [
				{ field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true } },
				{ field: 'owner', type: 'uuid' },
			],
		}),
	);

	// Together with the version_user_* foreign keys, this is a second cascade path to directus_users on MSSQL
	await api.request(
		createRelation({
			collection: name,
			field: 'owner',
			related_collection: 'directus_users',
			schema: { on_delete: 'SET NULL' },
		} as any),
	);

	const user = await api.request(createUser({ email: `${name.toLowerCase()}@example.com` }));

	await knex(SHADOW + name).insert({ owner: user.id, version_user_created: user.id });

	await api.request(deleteUser(user.id));

	expect(await knex(SHADOW + name).first()).toMatchObject({ owner: null, version_user_created: null });

	await api.request(deleteCollection(name));
});

test('rejects reserved field names when a schema apply enables versioning and adds the field', async () => {
	const name = `${collections.categories}_apply`;

	await api.request(
		createCollection({
			collection: name,
			// Collections and fields without meta are left out of snapshots
			meta: { versioning: false },
			schema: {},
			fields: [
				{ field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true } },
				{ field: 'title', type: 'string', meta: { interface: 'input' } },
			],
		}),
	);

	const snapshot = (await api.request(schemaSnapshot())) as unknown as Snapshot;
	const collection = snapshot.collections.find((collection) => collection.collection === name)!;
	const title = snapshot.fields.find((field) => field.collection === name && field.field === 'title')!;

	collection.meta!.versioning = true;

	snapshot.fields.push({
		...title,
		field: 'version_type',
		meta: { ...title.meta!, field: 'version_type' },
		schema: { ...title.schema!, name: 'version_type' },
	});

	const diff = await api.request(schemaDiff(snapshot as any, { force: true }));

	// Other test files change the schema concurrently, so only apply this collection's changes and skip the hash check
	for (const key of ['collections', 'fields', 'relations'] as const) {
		diff.diff[key] = diff.diff[key].filter((entry: { collection: string }) => entry.collection === name);
	}

	// Has to be rejected by the check that runs before the live table is changed, not by the version table sync
	await expect(api.request(schemaApply(diff, true))).rejects.toMatchObject({
		errors: [{ message: expect.stringContaining('reserved versioning field name') }],
	});

	expect(await getColumns(name)).not.toContain('version_type');
	expect(await getColumns(SHADOW + name)).toBeNull();

	await api.request(deleteCollection(name));
});
