import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { expect, test, vi } from 'vitest';
import { Client_SQLite3 } from './mock.js';

const aliasFn = vi.fn();

vi.doMock('nanoid/non-secure', () => ({
	customAlphabet: () => aliasFn,
}));

const { addJoin } = await import('./add-join.js');

test('add join non existed relation', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();
	aliasFn.mockReturnValueOnce('alias');

	addJoin({
		aliasMap: {},
		collection: 'articles',
		knex: db,
		path: ['no_field'],
		rootQuery: queryBuilder,
		schema,
	});

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select *`);
	expect(rawQuery.bindings).toEqual([]);
});

test('add join for m2o relation', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('author').m2o('users');
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();
	aliasFn.mockReturnValueOnce('alias');

	addJoin({
		aliasMap: {},
		collection: 'articles',
		knex: db,
		path: ['author'],
		rootQuery: queryBuilder,
		schema,
	});

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * left join "users" as "alias" on "articles"."author" = "alias"."id"`);
	expect(rawQuery.bindings).toEqual([]);
});

test('add join for o2m relation', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('links').o2m('links_list', 'article_id');
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();
	aliasFn.mockReturnValueOnce('alias');

	addJoin({
		aliasMap: {},
		collection: 'articles',
		knex: db,
		path: ['links'],
		rootQuery: queryBuilder,
		schema,
	});

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * left join "links_list" as "alias" on "articles"."id" = "alias"."article_id"`);
	expect(rawQuery.bindings).toEqual([]);
});

test('add join for a2o relation without collection scope', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('title_component').a2o(['images', 'videos']);
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	expect(() => {
		addJoin({
			aliasMap: {},
			collection: 'articles',
			knex: db,
			path: ['title_component'],
			rootQuery: queryBuilder,
			schema,
		});
	}).toThrowError('You have to provide a collection scope when sorting or filtering on a many-to-any item');
});

test('add join for a2o relation', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('title_component').a2o(['images', 'videos']);
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();
	aliasFn.mockReturnValueOnce('alias');

	addJoin({
		aliasMap: {},
		collection: 'articles',
		knex: db,
		path: ['title_component:images'],
		rootQuery: queryBuilder,
		schema,
	});

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * left join "images" as "alias" on "articles"."collection" = ? and "articles"."title_component" = CAST("alias"."id" AS CHAR(255))`,
	);

	expect(rawQuery.bindings).toEqual(['images']);
});

test('add join for m2m relation', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('tags').m2m('tags_list');
		})
		.collection('tags_list', (c) => {
			c.field('id').id();
			c.field('tag_name').string();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();
	aliasFn.mockReturnValueOnce('alias');
	aliasFn.mockReturnValueOnce('alias2');

	addJoin({
		aliasMap: {},
		collection: 'articles',
		knex: db,
		path: ['tags', 'tags_list_id'],
		rootQuery: queryBuilder,
		schema,
	});

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * left join "articles_tags_list_junction" as "alias" on "articles"."id" = "alias"."articles_id" left join "tags_list" as "alias2" on "alias"."tags_list_id" = "alias2"."id"`,
	);

	expect(rawQuery.bindings).toEqual([]);
});

test('dont overwrite already aliased relations', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
			c.field('links').o2m('links_list', 'article_id');
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	addJoin({
		aliasMap: {
			links: {
				alias: 'alias',
				collection: 'links_list',
			},
		},
		collection: 'articles',
		knex: db,
		path: ['links'],
		rootQuery: queryBuilder,
		schema,
	});

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select *`);
	expect(rawQuery.bindings).toEqual([]);
});
