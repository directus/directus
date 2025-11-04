import { SchemaBuilder } from '@directus/schema-builder';
import type { Permission } from '@directus/types';
import knex from 'knex';
import { describe, expect, test, vi } from 'vitest';
import { DEFUAULT_PERMISSION } from '../../../../../permissions/utils/default-permission.js';
import { Client_SQLite3 } from '../mock.js';

const { applyFilter } = await import('./index.js');

describe('boolean filter operators', () => {
	const operators = [
		{
			filterOperator: 'null',
			sqlWhereClause: {
				true: '$column is null',
				false: '$column is not null',
			},
		},
		{
			filterOperator: 'empty',
			sqlWhereClause: {
				true: '($column is null or $column = ?)',
				false: '($column is not null and $column != ?)',
			},
		},
	];

	const withReverseOperators = operators.reduce((acc, cur) => {
		const reverse = {
			filterOperator: `n${cur.filterOperator}`,
			sqlWhereClause: {
				true: cur.sqlWhereClause.false,
				false: cur.sqlWhereClause.true,
			},
		};

		acc.push(reverse);
		return acc;
	}, operators);

	const schema = new SchemaBuilder()
		.collection('test', (c) => {
			c.field('id').uuid().primary();
			c.field('text').text();
			c.field('string').string();
			c.field('float').float();
			c.field('integer').integer();
		})
		.build();

	for (const { filterOperator, sqlWhereClause } of withReverseOperators) {
		for (const filterValue of [true, '', false]) {
			test(`${filterOperator} with value ${filterValue}`, async () => {
				const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
				const queryBuilder = db.queryBuilder();

				const rootFilter = {
					_and: [{ text: { [`_${filterOperator}`]: filterValue } }],
				};

				applyFilter(db, schema, queryBuilder, rootFilter, 'test', {}, [], []);

				const rawQuery = queryBuilder.toSQL();

				const expectedSql = sqlWhereClause[filterValue === false ? 'false' : 'true'].replaceAll(
					'$column',
					`"test"."text"`,
				);

				expect(rawQuery.sql).toEqual(`select * where (${expectedSql})`);
			});
		}
	}
});

test(`filter values on bigint fields are correctly passed as such to db query`, async () => {
	const schema = new SchemaBuilder()
		.collection('test', (c) => {
			c.field('id').id();
			c.field('bigInteger').bigInteger();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	// testing with value greater than Number.MAX_SAFE_INTEGER
	const bigintId = 9007199254740991477n;

	applyFilter(
		db,
		schema,
		queryBuilder,
		{
			bigInteger: {
				_eq: bigintId.toString(),
			},
		},
		'test',
		{},
		[],
		[],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where "test"."bigInteger" = ?`);
	expect(rawQuery.bindings).toEqual([bigintId.toString()]);
});

for (const { operator, replacement, sql } of [
	{ operator: '_eq', replacement: '_null', sql: 'null' },
	{ operator: '_neq', replacement: '_nnull', sql: 'not null' },
]) {
	test(`${operator} = null should behave as ${replacement} = true`, async () => {
		const schema = new SchemaBuilder()
			.collection('test', (c) => {
				c.field('id').id();
				c.field('string').string();
			})
			.build();

		const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
		const queryBuilder = db.queryBuilder();

		applyFilter(
			db,
			schema,
			queryBuilder,
			{
				string: {
					[operator]: null,
				},
			},
			'test',
			{},
			[],
			[],
		);

		const rawQuery = queryBuilder.toSQL();

		expect(rawQuery.sql).toEqual(`select * where "test"."string" is ${sql}`);
		expect(rawQuery.bindings).toEqual([]);
	});
}

test(`filtering m2o relation`, async () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('author').m2o('users');
		})
		.collection('users', (c) => {
			c.field('id').id();
			c.field('name').string();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyFilter(
		db,
		schema,
		queryBuilder,
		{
			author: {
				name: {
					_eq: 'username',
				},
			},
		},
		'article',
		{},
		[],
		[],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * left join "users" as "qonnj" on "article"."author" = "qonnj"."id" where "qonnj"."name" = ?`,
	);

	expect(rawQuery.bindings).toEqual(['username']);
});

const o2m_schema = new SchemaBuilder()
	.collection('article', (c) => {
		c.field('id').id();
		c.field('links').o2m('links_list', 'article_id');
	})
	.collection('links_list', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.build();

test(`filtering o2m relation`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyFilter(
		db,
		o2m_schema,
		queryBuilder,
		{
			links: {
				name: {
					_eq: 2,
				},
			},
		},
		'article',
		{},
		[],
		[],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * left join "links_list" as "uhmis" on "article"."id" = "uhmis"."article_id" where "uhmis"."name" = ?`,
	);

	expect(rawQuery.bindings).toEqual([2]);
});

for (const quantifier of ['_some', '_none']) {
	test(`filtering o2m relation with ${quantifier}`, async () => {
		const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
		const queryBuilder = db.queryBuilder();

		applyFilter(
			db,
			o2m_schema,
			queryBuilder,
			{
				links: {
					[quantifier]: {
						name: {
							_eq: 2,
						},
					},
				},
			},
			'article',
			{},
			[],
			[],
		);

		const rawQuery = queryBuilder.toSQL();

		if (quantifier === '_none') {
			expect(rawQuery.sql).toEqual(
				`select * left join "links_list" as "vjhrm" on "article"."id" = "vjhrm"."article_id" where "article"."id" not in (select "links_list"."article_id" as "article_id" from "links_list" where "links_list"."article_id" is not null and "links_list"."name" = ?)`,
			);
		} else {
			expect(rawQuery.sql).toEqual(
				`select * left join "links_list" as "dbjyi" on "article"."id" = "dbjyi"."article_id" where "article"."id" in (select "links_list"."article_id" as "article_id" from "links_list" where "links_list"."article_id" is not null and "links_list"."name" = ?)`,
			);
		}

		expect(rawQuery.bindings).toEqual([2]);
	});
}

test(`filtering a2o relation`, async () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('header').a2o(['image', 'video']);
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyFilter(
		db,
		schema,
		queryBuilder,
		{
			'header:image': {
				id: {
					_eq: 1,
				},
			},
			'header:video': {
				id: {
					_eq: 2,
				},
			},
		},
		'article',
		{},
		[],
		[],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * left join "image" as "rdiyb" on "article"."collection" = ? and "article"."header" = CAST("rdiyb"."id" AS CHAR(255)) left join "video" as "jbfbb" on "article"."collection" = ? and "article"."header" = CAST("jbfbb"."id" AS CHAR(255)) where "rdiyb"."id" = ? and "jbfbb"."id" = ?`,
	);

	expect(rawQuery.bindings).toEqual(['image', 'video', 1, 2]);
});

test(`filtering _between`, async () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('created').date();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyFilter(
		db,
		schema,
		queryBuilder,
		{
			created: {
				_between: ['2024-01-01', '2024-12-31'],
			},
		},
		'article',
		{},
		[],
		[],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where "article"."created" between ? and ?`);
	expect(rawQuery.bindings).toEqual(['1704067200000', '1735603200000']);
});

test(`filtering _in`, async () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('title').string();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyFilter(
		db,
		schema,
		queryBuilder,
		{
			title: {
				_in: ['title1', 'title2'],
			},
		},
		'article',
		{},
		[],
		[],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where "article"."title" in (?, ?)`);
	expect(rawQuery.bindings).toEqual(['title1', 'title2']);
});

test(`filtering _contains`, async () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('title').string();
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyFilter(
		db,
		schema,
		queryBuilder,
		{
			title: {
				_contains: 'abc',
			},
		},
		'article',
		{},
		[],
		[],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where "article"."title" like ?`);
	expect(rawQuery.bindings).toEqual(['%abc%']);
});

const operator_schema = new SchemaBuilder()
	.collection('article', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('likes').integer();
	})
	.build();

test(`filtering _and`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyFilter(
		db,
		operator_schema,
		queryBuilder,
		{
			_and: [
				{
					title: {
						_contains: 'norge er kult',
					},
				},
				{
					likes: {
						_gte: 2000,
					},
				},
			],
		},
		'article',
		{},
		[],
		[],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where ("article"."title" like ? and "article"."likes" >= ?)`);
	expect(rawQuery.bindings).toEqual(['%norge er kult%', 2000]);
});

test(`filtering _or`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyFilter(
		db,
		operator_schema,
		queryBuilder,
		{
			_or: [
				{
					title: {
						_contains: 'norge er kult',
					},
				},
				{
					likes: {
						_gte: 2000,
					},
				},
			],
		},
		'article',
		{},
		[],
		[],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where ("article"."title" like ? or "article"."likes" >= ?)`);
	expect(rawQuery.bindings).toEqual(['%norge er kult%', 2000]);
});

test(`filtering $FOLLOW against reverse o2m`, async () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('author').m2o('users');
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyFilter(
		db,
		schema,
		queryBuilder,
		{
			'$FOLLOW(article, author)': {
				id: {
					_eq: 1,
				},
			},
		},
		'users',
		{},
		[],
		[],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * left join "article" as "caibp" on "users"."id" = "caibp"."author" where "caibp"."id" = ?`,
	);

	expect(rawQuery.bindings).toEqual([1]);
});

test(`filtering on count(links)`, async () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('links').o2m('links', 'article_id');
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applyFilter(
		db,
		schema,
		queryBuilder,
		{
			'count(links)': {
				_lt: 5,
			},
		},
		'article',
		{},
		[],
		[],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * where (select count(*) from "links" as "skupe" where "skupe"."article_id" = "article"."id") < ?`,
	);

	expect(rawQuery.bindings).toEqual([5]);
});

test(`filtering on links with existing alias map`, async () => {
	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('links').o2m('links', 'article_id');
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const aliasMap = {};

	applyFilter(
		db,
		schema,
		queryBuilder,
		{
			links: {
				id: {
					_lt: 5,
				},
			},
		},
		'article',
		aliasMap,
		[],
		[],
	);

	applyFilter(
		db,
		schema,
		queryBuilder,
		{
			links: {
				id: {
					_gt: 1,
				},
			},
		},
		'article',
		aliasMap,
		[],
		[],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(aliasMap).toEqual({ links: { alias: 'ythdb', collection: 'links' } });

	expect(rawQuery.sql).toEqual(
		`select * left join "links" as "ythdb" on "article"."id" = "ythdb"."article_id" where "ythdb"."id" < ? and "ythdb"."id" > ?`,
	);

	expect(rawQuery.bindings).toEqual([5, 1]);
});

test(`filter with partial field permissions`, async () => {
	const permission: Permission = {
		...DEFUAULT_PERMISSION,
		action: 'read',
		collection: 'article',
		fields: ['id', 'title'],
	};

	const schema = new SchemaBuilder()
		.collection('article', (c) => {
			c.field('id').id();
			c.field('title').string();
			c.field('text').text();
			c.field('links').o2m('links', 'article_id');
		})
		.build();

	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const aliasMap = {};

	applyFilter(
		db,
		schema,
		queryBuilder,
		{
			title: {
				_eq: 1,
			},
		},
		'article',
		aliasMap,
		[],
		[permission],
	);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where "article"."title" = ?`);
	expect(rawQuery.bindings).toEqual([1]);
});
