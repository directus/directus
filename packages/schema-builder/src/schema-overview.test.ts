import type { SchemaOverview } from '@directus/types';
import { omit } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { SchemaBuilder } from './builder.js';
import { toSchemaOverview } from './schema-overview.js';

function createBuilder() {
	return new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('title').string().options({ nullable: false, searchable: false });
			c.field('rating').integer().options({ defaultValue: 5 });
			c.field('author').m2o('users');
			c.field('tags').m2m('tags');
			c.field('sort').integer().sort();
		})
		.options({ singleton: true, accountability: 'activity' });
}

describe('snapshot', () => {
	test('creates collections with meta and a table schema', () => {
		const snapshot = createBuilder().snapshot();

		expect(snapshot.collections.map(({ collection }) => collection)).toEqual([
			'articles',
			'users',
			'articles_tags_junction',
			'tags',
		]);

		expect(snapshot.collections[0]).toMatchObject({
			collection: 'articles',
			meta: { collection: 'articles', singleton: true, accountability: 'activity', sort_field: 'sort' },
			schema: { name: 'articles' },
		});
	});

	test('creates fields with meta and column schema', () => {
		const { fields } = createBuilder().snapshot();

		const field = (collection: string, name: string) =>
			fields.find((f) => f.collection === collection && f.field === name);

		expect(field('articles', 'id')).toMatchObject({
			type: 'integer',
			schema: {
				name: 'id',
				table: 'articles',
				is_primary_key: true,
				has_auto_increment: true,
				default_value: null,
				is_nullable: false,
			},
		});

		expect(field('articles', 'title')).toMatchObject({
			type: 'string',
			schema: { is_nullable: false, is_primary_key: false },
			meta: { searchable: false },
		});

		expect(field('articles', 'rating')?.schema?.default_value).toBe(5);
		expect(field('articles', 'author')).toMatchObject({ type: 'integer', meta: { special: ['m2o'] } });
		expect(field('articles', 'tags')).toMatchObject({ type: 'alias', schema: null, meta: { special: ['m2m'] } });
		expect(field('articles_tags_junction', 'articles_id')).toMatchObject({ type: 'integer' });
	});

	test('strips ids and field names', () => {
		const snapshot = createBuilder().snapshot();

		for (const field of snapshot.fields) {
			expect(field).not.toHaveProperty('name');
		}

		for (const item of [...snapshot.fields, ...snapshot.relations]) {
			expect(item.meta).not.toHaveProperty('id');
		}
	});

	test('sets version information', () => {
		expect(createBuilder().snapshot()).toMatchObject({ version: 1, directus: '0.0.0', systemFields: [] });
		expect(createBuilder().snapshot()).not.toHaveProperty('vendor');

		expect(createBuilder().snapshot({ directus: '12.0.0', vendor: 'postgres' })).toMatchObject({
			directus: '12.0.0',
			vendor: 'postgres',
		});
	});
});

describe('toSchemaOverview', () => {
	test('converts a snapshot into the same overview as build', () => {
		const builder = createBuilder();

		const withoutIds = (schema: SchemaOverview) => ({
			...schema,
			relations: schema.relations.map((relation) => omit(relation, 'meta.id')),
		});

		expect(withoutIds(toSchemaOverview(builder.snapshot()))).toEqual(withoutIds(builder.build()));
	});

	test('maps collection meta', () => {
		const { collections } = createBuilder().build();

		expect(collections['articles']).toMatchObject({
			primary: 'id',
			singleton: true,
			accountability: 'activity',
			sortField: 'sort',
			status: 'active',
		});
	});

	test('skips folders and collections without a primary key', () => {
		const schema = toSchemaOverview({
			collections: [
				{ collection: 'folder', meta: null, schema: null },
				{ collection: 'no_pk', meta: null, schema: { name: 'no_pk' } },
			],
			fields: [
				{
					collection: 'no_pk',
					field: 'name',
					name: 'name',
					type: 'string',
					meta: null,
					schema: { is_primary_key: false } as any,
				},
			],
			relations: [],
		});

		expect(schema.collections).toEqual({});
	});

	test('uses defaults for collections and fields without meta', () => {
		const schema = toSchemaOverview({
			collections: [{ collection: 'articles', meta: null, schema: { name: 'articles' } }],
			fields: [
				{
					collection: 'articles',
					field: 'id',
					name: 'id',
					type: 'uuid',
					meta: null,
					schema: { data_type: 'uuid', is_primary_key: true, is_nullable: false } as any,
				},
			],
			relations: [],
		});

		expect(schema.collections['articles']).toEqual({
			collection: 'articles',
			primary: 'id',
			singleton: false,
			note: null,
			sortField: null,
			accountability: 'all',
			status: 'active',
			fields: {
				id: {
					field: 'id',
					defaultValue: null,
					nullable: false,
					generated: false,
					type: 'uuid',
					dbType: 'uuid',
					precision: null,
					scale: null,
					special: [],
					note: null,
					validation: null,
					alias: false,
					searchable: true,
				},
			},
		});
	});

	test('ignores meta of no-data fields and drops those without a column', () => {
		const builder = new SchemaBuilder().collection('articles', (c) => {
			c.field('id').id();

			c.field('divider')
				.text()
				.options({ special: ['no-data'], note: 'ignored' });
		});

		const { collections, fields, relations } = builder.build_schema();

		fields.push({
			collection: 'articles',
			field: 'notice',
			name: 'notice',
			type: 'alias',
			schema: null,
			meta: { ...fields[1]!.meta!, field: 'notice', special: ['alias', 'no-data'] },
		});

		const schema = toSchemaOverview({ collections, fields, relations });

		expect(schema.collections['articles']?.fields['divider']).toMatchObject({ special: [], note: null });
		expect(schema.collections['articles']?.fields).not.toHaveProperty('notice');
	});

	test('derives missing relation ids from their position', () => {
		const { relations } = createBuilder().snapshot();

		expect(toSchemaOverview({ collections: [], fields: [], relations }).relations.map((r) => r.meta?.id)).toEqual([
			0, 1, 2,
		]);
	});
});
