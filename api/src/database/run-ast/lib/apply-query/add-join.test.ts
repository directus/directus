import { SchemaBuilder } from '@directus/schema-builder';
import knex from 'knex';
import { expect, test, vi } from 'vitest';
import { Client_SQLite3 } from './mock.js';

const { addJoin } = await import('./add-join.js');

test('add join non existed relation', async () => {
	const schema = new SchemaBuilder()
		.collection('articles', (c) => {
			c.field('id').id();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

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

	addJoin({
		aliasMap: {},
		collection: 'articles',
		knex: db,
		path: ['author'],
		rootQuery: queryBuilder,
		schema,
	});

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * left join "users" as "ydsed" on "articles"."author" = "ydsed"."id"`);
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

	addJoin({
		aliasMap: {},
		collection: 'articles',
		knex: db,
		path: ['links'],
		rootQuery: queryBuilder,
		schema,
	});

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * left join "links_list" as "qljec" on "articles"."id" = "qljec"."article_id"`);
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
		`select * left join "images" as "dvlav" on "articles"."collection" = ? and "articles"."title_component" = CAST("dvlav"."id" AS CHAR(255))`,
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
		`select * left join "articles_tags_list_junction" as "oxuxz" on "articles"."id" = "oxuxz"."articles_id" left join "tags_list" as "oojot" on "oxuxz"."tags_list_id" = "oojot"."id"`,
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
