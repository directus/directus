import {
	createCollection,
	createDirectus,
	createField,
	createRelation,
	deleteCollection,
	deleteField,
	readCollections,
	rest,
	staticToken,
	updateCollection,
	updateField,
	updateRelation,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { afterAll, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { snapshot } from './snapshot.js';
import { getColumn, getColumns, knex, LINK, SHADOW } from './versions.js';

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
