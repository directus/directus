import { SchemaBuilder } from '@directus/schema-builder';
import type { Permission } from '@directus/types';
import knex from 'knex';
import { expect, test, vi } from 'vitest';
import { Client_SQLite3 } from './mock.js';
import { applySearch } from './search.js';

const schema = new SchemaBuilder()
	.collection('test', (c) => {
		c.field('id').uuid().primary();
		c.field('text').text();
		c.field('string').string();
		c.field('float').float();
		c.field('integer').integer();

		c.field('secret')
			.string()
			.options({
				special: ['conceal'],
			});
	})
	.build();

const permissions = [
	{
		collection: 'test',
		action: 'read',
		fields: ['text', 'float', 'integer', 'id'],
		permissions: {
			text: {},
		},
	},
] as unknown as Permission[];

for (const number of ['0x56071c902718e681e274DB0AaC9B4Ed2d027924d', '0b11111', '0.42e3', 'Infinity', '42.000']) {
	test(`Prevent ${number} from being cast to number`, async () => {
		const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
		const queryBuilder = db.queryBuilder();

		applySearch(db as any, schema, queryBuilder, number, 'test', {}, permissions);

		const rawQuery = queryBuilder.toSQL();

		expect(rawQuery.sql).toEqual(`select * where ((LOWER("test"."text") LIKE ?))`);
		expect(rawQuery.bindings).toEqual([`%${number.toLowerCase()}%`]);
	});
}

for (const number of ['1234', '-128', '12.34']) {
	test(`Casting number ${number}`, async () => {
		const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
		const queryBuilder = db.queryBuilder();

		applySearch(db as any, schema, queryBuilder, number, 'test', {}, permissions);

		const rawQuery = queryBuilder.toSQL();

		expect(rawQuery.sql).toEqual(
			`select * where ((LOWER("test"."text") LIKE ?) or ("test"."float" = ?) or ("test"."integer" = ?))`,
		);

		expect(rawQuery.bindings).toEqual([`%${number.toLowerCase()}%`, Number(number), Number(number)]);
	});
}

test(`Query is falsy if no other clause is added`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const schema = new SchemaBuilder()
		.collection('test', (c) => {
			c.field('id').uuid().primary();
			c.field('string').string();
			c.field('float').float();
			c.field('integer').integer();
		})
		.build();

	applySearch(db as any, schema, queryBuilder, 'searchstring', 'test', {}, permissions);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where (1 = 0)`);
	expect(rawQuery.bindings).toEqual([]);
});

test(`Exclude non uuid searchable field(s) when searchQuery has valid uuid value`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, '4b9adc65-4ad8-4242-9144-fbfc58400d74', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['id', 'text'],
			permissions: null,
		} as unknown as Permission,
	]);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where (("test"."id" = ?) or (LOWER("test"."text") LIKE ?))`);
	expect(rawQuery.bindings).toEqual(['4b9adc65-4ad8-4242-9144-fbfc58400d74', '%4b9adc65-4ad8-4242-9144-fbfc58400d74%']);
});

test(`Remove forbidden field(s) from search`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, 'directus', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['string'],
			permissions: {
				text: {},
			},
		} as unknown as Permission,
	]);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where ((LOWER("test"."string") LIKE ?))`);
	expect(rawQuery.bindings).toEqual(['%directus%']);
});

test(`Remove "conceal" field(s) from search irrespective of permissions`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, 'directus', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['text', 'string', 'secret'],
			permissions: {
				text: {},
			},
		} as unknown as Permission,
	]);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where ((LOWER("test"."text") LIKE ?) or (LOWER("test"."string") LIKE ?))`);
	expect(rawQuery.bindings).toEqual(['%directus%', '%directus%']);
});

test(`Add all fields for * field rule`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, '1', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['*'],
			permissions: null,
		} as unknown as Permission,
	]);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * where (LOWER("test"."text") LIKE ? or LOWER("test"."string") LIKE ? or "test"."float" = ? or "test"."integer" = ?)`,
	);

	expect(rawQuery.bindings).toEqual(['%1%', '%1%', 1, 1]);
});

test(`Add all fields when * is present in field rule with permission rule present`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, '1', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['*', 'text'],
			permissions: {
				text: {},
			},
		} as unknown as Permission,
	]);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * where (LOWER("test"."text") LIKE ? or LOWER("test"."string") LIKE ? or "test"."float" = ? or "test"."integer" = ?)`,
	);

	expect(rawQuery.bindings).toEqual(['%1%', '%1%', 1, 1]);
});

test(`All field(s) are searched for admin`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, schema, queryBuilder, '1', 'test', {}, []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(
		`select * where (LOWER("test"."text") LIKE ? or LOWER("test"."string") LIKE ? or "test"."float" = ? or "test"."integer" = ?)`,
	);

	expect(rawQuery.bindings).toEqual(['%1%', '%1%', 1, 1]);
});

test(`Exclude fields marked as non-searchable`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const schemaWithNonSearchable = new SchemaBuilder()
		.collection('test', (c) => {
			c.field('id').uuid().primary();
			c.field('text').text();
			c.field('string').string().options({ searchable: false });
			c.field('float').float().options({ searchable: false });
			c.field('integer').integer();
		})
		.build();

	applySearch(db as any, schemaWithNonSearchable, queryBuilder, '1', 'test', {}, [
		{
			collection: 'test',
			action: 'read',
			fields: ['*'],
			permissions: null,
		} as unknown as Permission,
	]);

	const rawQuery = queryBuilder.toSQL();

	// only text and integer should be searched, string and float are marked as non-searchable
	expect(rawQuery.sql).toEqual(`select * where (LOWER("test"."text") LIKE ? or "test"."integer" = ?)`);
	expect(rawQuery.bindings).toEqual(['%1%', 1]);
});

test(`Return falsy query when all searchable fields are excluded`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const schemaAllNonSearchable = new SchemaBuilder()
		.collection('test', (c) => {
			c.field('id').uuid().primary();
			c.field('text').text().options({ searchable: false });
			c.field('string').string().options({ searchable: false });
		})
		.build();

	applySearch(db as any, schemaAllNonSearchable, queryBuilder, 'test', 'test', {}, []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toEqual(`select * where (1 = 0)`);
	expect(rawQuery.bindings).toEqual([]);
});

// --- Translation-aware search tests ---

const translationSchema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('status').string();
		c.field('translations').translations();
	})
	.collection('articles_translations', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('body').text();
	})
	.build();

test(`Searches translation fields via EXISTS subquery for admin`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, translationSchema, queryBuilder, 'hello', 'articles', {}, []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toContain(`LOWER("articles"."status") LIKE ?`);
	expect(rawQuery.sql).toContain(`exists`);
	expect(rawQuery.sql).toContain(`"articles_translations"`);
	expect(rawQuery.sql).toContain(`LOWER("articles_translations"."title") LIKE ?`);
	expect(rawQuery.sql).toContain(`LOWER("articles_translations"."body") LIKE ?`);
	expect(rawQuery.bindings).toContain('%hello%');
});

test(`Translation EXISTS subquery correlates on parent FK and PK`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, translationSchema, queryBuilder, 'test', 'articles', {}, []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toContain(`"articles_translations"."articles_id" = "articles"."id"`);
});

test(`Restricts translation fields based on junction collection permissions`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const restrictedPermissions = [
		{
			collection: 'articles',
			action: 'read',
			fields: ['*'],
			permissions: null,
		},
		{
			collection: 'articles_translations',
			action: 'read',
			fields: ['title'],
			permissions: {
				title: {},
			},
		},
	] as unknown as Permission[];

	applySearch(db as any, translationSchema, queryBuilder, 'hello', 'articles', {}, restrictedPermissions);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toContain(`LOWER("articles_translations"."title") LIKE ?`);
	expect(rawQuery.sql).not.toContain(`"articles_translations"."body"`);
});

test(`Omits translation subquery when user has no junction collection permissions`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const noJunctionPermissions = [
		{
			collection: 'articles',
			action: 'read',
			fields: ['*'],
			permissions: null,
		},
	] as unknown as Permission[];

	applySearch(db as any, translationSchema, queryBuilder, 'hello', 'articles', {}, noJunctionPermissions);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toContain(`LOWER("articles"."status") LIKE ?`);
	expect(rawQuery.sql).not.toContain(`articles_translations`);
	expect(rawQuery.sql).not.toContain(`exists`);
});

test(`Excludes non-searchable translation fields`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const schemaWithNonSearchable = new SchemaBuilder()
		.collection('pages', (c) => {
			c.field('id').id();
			c.field('slug').string();
			c.field('translations').translations();
		})
		.collection('pages_translations', (c) => {
			c.field('id').id();
			c.field('title').string();
			c.field('internal_notes').string().options({ searchable: false });
		})
		.build();

	applySearch(db as any, schemaWithNonSearchable, queryBuilder, 'test', 'pages', {}, []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toContain(`LOWER("pages_translations"."title") LIKE ?`);
	expect(rawQuery.sql).not.toContain(`"pages_translations"."internal_notes"`);
});

test(`Excludes concealed translation fields`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const schemaWithConcealed = new SchemaBuilder()
		.collection('pages', (c) => {
			c.field('id').id();
			c.field('translations').translations();
		})
		.collection('pages_translations', (c) => {
			c.field('id').id();
			c.field('title').string();

			c.field('secret')
				.string()
				.options({ special: ['conceal'] });
		})
		.build();

	applySearch(db as any, schemaWithConcealed, queryBuilder, 'test', 'pages', {}, []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).toContain(`LOWER("pages_translations"."title") LIKE ?`);
	expect(rawQuery.sql).not.toContain(`"pages_translations"."secret"`);
});

test(`Avoids fallback 1=0 when root has no searchable fields but translations do`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	const schemaRootUnsearchable = new SchemaBuilder()
		.collection('items', (c) => {
			c.field('id').id();
			c.field('translations').translations();
		})
		.collection('items_translations', (c) => {
			c.field('id').id();
			c.field('title').string();
		})
		.build();

	applySearch(db as any, schemaRootUnsearchable, queryBuilder, 'test', 'items', {}, []);

	const rawQuery = queryBuilder.toSQL();

	expect(rawQuery.sql).not.toContain(`1 = 0`);
	expect(rawQuery.sql).toContain(`exists`);
	expect(rawQuery.sql).toContain(`LOWER("items_translations"."title") LIKE ?`);
});

test(`Excludes junction FK and PK fields from translation search`, async () => {
	const db = vi.mocked(knex.default({ client: Client_SQLite3 }));
	const queryBuilder = db.queryBuilder();

	applySearch(db as any, translationSchema, queryBuilder, 'hello', 'articles', {}, []);

	const rawQuery = queryBuilder.toSQL();

	// FK fields (articles_id, languages_code) should not appear in LIKE conditions
	expect(rawQuery.sql).not.toContain(`LOWER("articles_translations"."articles_id") LIKE ?`);
	expect(rawQuery.sql).not.toContain(`LOWER("articles_translations"."languages_code") LIKE ?`);
});
