import type { CollectionBuilder } from '@directus/schema-builder';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability, Item, Permission, Query } from '@directus/types';
import knex from 'knex';
import { createTracker, MockClient } from 'knex-mock-client';
import { describe, expect, test, vi } from 'vitest';
import { getAstFromQuery } from '../database/get-ast-from-query/get-ast-from-query.js';
import { runAst } from '../database/run-ast/run-ast.js';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { processAst } from '../permissions/modules/process-ast/process-ast.js';
import { formatSql } from '../test-utils/knex.js';
import { isVersionedQuery } from './query.js';
import { extractVersioning } from './schema.js';

vi.mock('../permissions/lib/fetch-policies.js', () => ({ fetchPolicies: vi.fn().mockResolvedValue(['policy']) }));
vi.mock('../permissions/lib/fetch-permissions.js', () => ({ fetchPermissions: vi.fn().mockResolvedValue([]) }));

// The database helpers derive the dialect from the class name of the client
const CLIENTS = {
	postgres: class Client_PG extends MockClient {},
	mysql: class Client_MySQL2 extends MockClient {},
	mssql: class Client_MSSQL extends MockClient {},
	oracle: class Client_Oracledb extends MockClient {},
};

function versionSystemFields(c: CollectionBuilder) {
	c.field('version_id').id();
	c.field('version_name').string();
	c.field('version_type').string();
	c.field('version_date_created').timestamp();
	c.field('version_date_updated').timestamp();
	c.field('version_user_created').uuid();
	c.field('version_user_updated').uuid();
}

const builtSchema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('authors');
		c.field('tags').o2m('tags', 'article');
		c.field('category').m2o('categories');
		c.field('comments').o2m('comments', 'article');
	})
	.options({ versioning: true })
	.collection('authors', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.options({ versioning: true })
	.collection('categories', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('tags', (c) => {
		c.field('id').id();
		c.field('label').string();
	})
	.options({ versioning: true })
	.collection('directus_shadow_articles', (c) => {
		versionSystemFields(c);
		c.field('id').integer();
		c.field('title').string();
		c.field('author').integer();
		c.field('version_ref_author').m2o('directus_shadow_authors');
	})
	.collection('directus_shadow_authors', (c) => {
		versionSystemFields(c);
		c.field('id').integer();
		c.field('name').string();
	})
	.collection('directus_shadow_tags', (c) => {
		versionSystemFields(c);
		c.field('id').integer();
		c.field('label').string();
		c.field('version_ref_article').m2o('directus_shadow_articles');
	})
	.collection('directus_link_tags', (c) => {
		c.field('id').id();
		c.field('version_ref_article').integer();
	})
	// Not versioned, but linked to versions of articles
	.collection('comments', (c) => {
		c.field('id').id();
		c.field('body').text();
	})
	.collection('directus_link_comments', (c) => {
		c.field('id').id();
		c.field('version_ref_article').integer();
	})
	// String primary key, and a shadow table that's missing a live column
	.collection('pages', (c) => {
		c.field('slug').string().primary();
		c.field('body').text();
	})
	.options({ versioning: true })
	.collection('directus_shadow_pages', (c) => {
		versionSystemFields(c);
		c.field('slug').string();
	})
	// a2o relation to a versioned and a collection that isn't versioned
	.collection('posts', (c) => {
		c.field('id').id();
		c.field('collection').string();
		c.field('item').a2o(['authors', 'categories']);
	})
	.options({ versioning: true })
	.collection('directus_shadow_posts', (c) => {
		versionSystemFields(c);
		c.field('id').integer();
		c.field('collection').string();
		c.field('item').string();
		c.field('version_ref_item').integer();
	})
	.build();

/** The rows of the versioned read collection, which are the same in every query of a collection */
const SOURCE = /\(select "(?:directus_shadow_)?\w+"\."[^]*?\) as "(directus_versioned_\w+)"/g;

type Options = {
	client?: keyof typeof CLIENTS;
	/** Rows returned for queries whose SQL contains the key, in order */
	responses?: [string, Record<string, unknown>[]][];
	/** Keep the rows of the versioned read collection in the SQL instead of replacing them with its name */
	source?: boolean;
	/** Read permissions of a user that isn't an admin, the read is done as admin otherwise */
	permissions?: Partial<Permission>[];
};

function setup(options: Options = {}) {
	const db = knex.default({ client: CLIENTS[options.client ?? 'postgres'] });
	const tracker = createTracker(db);

	for (const [key, rows] of options.responses ?? []) {
		tracker.on.select((query) => query.sql.includes(key)).responseOnce(rows);
	}

	tracker.on.select(() => true).response([]);

	/** The executed queries, formatted and separated by a blank line, and the bindings of each */
	const queries = () => ({
		sql: tracker.history.select
			.map((query) => formatSql(options.source ? query.sql : query.sql.replace(SOURCE, '"$1"')))
			.join('\n\n'),
		bindings: tracker.history.select.map((query) => query.bindings),
	});

	return { db, queries };
}

async function read(collection: string, query: Query, options: Options = {}) {
	const { db, queries } = setup(options);

	const context = { knex: db, schema: extractVersioning(db, builtSchema) };

	const accountability = options.permissions ? ({ user: 'user', role: null, admin: false } as Accountability) : null;

	vi.mocked(fetchPermissions).mockImplementation(async ({ collections }) =>
		(options.permissions ?? [])
			.filter((permission) => !collections || collections.includes(permission.collection!))
			.map((permission) => ({ action: 'read', permissions: {}, fields: ['*'], ...permission }) as Permission),
	);

	let ast = await getAstFromQuery({ collection, query, accountability, versioning: true }, context);

	ast = await processAst({ ast, action: 'read', accountability }, context);

	const items = (await runAst(ast, context.schema, accountability, { knex: db })) as Item[];

	return { items, ...queries() };
}

describe('isVersionedQuery', () => {
	test.each([
		[{ version: 'true' }, true],
		[{ version: 'main' }, false],
		[{}, false],
	] as [Query, boolean][])('%o → %s', (query, expected) => {
		expect(isVersionedQuery(query)).toBe(expected);
	});
});

describe('source of the versioned read collection', () => {
	test('combines live items with their published system fields and all unpublished versions', async () => {
		const { sql, bindings } = await read('articles', { fields: ['id', 'title'] }, { source: true });

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."title",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  (
			    select
			      "articles"."id" as "id",
			      "articles"."title" as "title",
			      "articles"."author" as "author",
			      "articles"."category" as "category",
			      "published"."version_id" as "version_id",
			      "published"."version_name" as "version_name",
			      'published' as "version_type",
			      "published"."version_date_created" as "version_date_created",
			      "published"."version_date_updated" as "version_date_updated",
			      "published"."version_user_created" as "version_user_created",
			      "published"."version_user_updated" as "version_user_updated",
			      NULL as "version_ref_author",
			      "articles"."id" as "directus_version_key"
			    from
			      "articles"
			      left join "directus_shadow_articles" as "published" on "published"."id" = "articles"."id"
			      and "published"."version_type" = ?
			    union all
			    select
			      "directus_shadow_articles"."id" as "id",
			      "directus_shadow_articles"."title" as "title",
			      "directus_shadow_articles"."author" as "author",
			      NULL as "category",
			      "directus_shadow_articles"."version_id" as "version_id",
			      "directus_shadow_articles"."version_name" as "version_name",
			      "directus_shadow_articles"."version_type" as "version_type",
			      "directus_shadow_articles"."version_date_created" as "version_date_created",
			      "directus_shadow_articles"."version_date_updated" as "version_date_updated",
			      "directus_shadow_articles"."version_user_created" as "version_user_created",
			      "directus_shadow_articles"."version_user_updated" as "version_user_updated",
			      "directus_shadow_articles"."version_ref_author" as "version_ref_author",
			      -1 * "directus_shadow_articles"."version_id" as "directus_version_key"
			    from
			      "directus_shadow_articles"
			    where
			      not "directus_shadow_articles"."version_type" = ?
			  ) as "directus_versioned_articles"
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    100,
			  ],
			]
		`);
	});

	test('selects version references from the link table for live items', async () => {
		const { sql, bindings } = await read('tags', { fields: ['id', 'label'] }, { source: true });

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_tags"."id",
			  "directus_versioned_tags"."label",
			  "directus_versioned_tags"."version_id",
			  "directus_versioned_tags"."version_name",
			  "directus_versioned_tags"."version_type",
			  "directus_versioned_tags"."version_date_created",
			  "directus_versioned_tags"."version_date_updated",
			  "directus_versioned_tags"."version_user_created",
			  "directus_versioned_tags"."version_user_updated",
			  "directus_versioned_tags"."version_ref_article",
			  "directus_versioned_tags"."directus_version_key"
			from
			  (
			    select
			      "tags"."id" as "id",
			      "tags"."label" as "label",
			      "tags"."article" as "article",
			      "published"."version_id" as "version_id",
			      "published"."version_name" as "version_name",
			      'published' as "version_type",
			      "published"."version_date_created" as "version_date_created",
			      "published"."version_date_updated" as "version_date_updated",
			      "published"."version_user_created" as "version_user_created",
			      "published"."version_user_updated" as "version_user_updated",
			      "directus_link_tags"."version_ref_article" as "version_ref_article",
			      "tags"."id" as "directus_version_key"
			    from
			      "tags"
			      left join "directus_shadow_tags" as "published" on "published"."id" = "tags"."id"
			      and "published"."version_type" = ?
			      left join "directus_link_tags" on "directus_link_tags"."id" = "tags"."id"
			    union all
			    select
			      "directus_shadow_tags"."id" as "id",
			      "directus_shadow_tags"."label" as "label",
			      NULL as "article",
			      "directus_shadow_tags"."version_id" as "version_id",
			      "directus_shadow_tags"."version_name" as "version_name",
			      "directus_shadow_tags"."version_type" as "version_type",
			      "directus_shadow_tags"."version_date_created" as "version_date_created",
			      "directus_shadow_tags"."version_date_updated" as "version_date_updated",
			      "directus_shadow_tags"."version_user_created" as "version_user_created",
			      "directus_shadow_tags"."version_user_updated" as "version_user_updated",
			      "directus_shadow_tags"."version_ref_article" as "version_ref_article",
			      -1 * "directus_shadow_tags"."version_id" as "directus_version_key"
			    from
			      "directus_shadow_tags"
			    where
			      not "directus_shadow_tags"."version_type" = ?
			  ) as "directus_versioned_tags"
			order by
			  "directus_versioned_tags"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    100,
			  ],
			]
		`);
	});

	test('casts string keys and selects null for columns missing in the shadow table', async () => {
		const { sql, bindings } = await read('pages', { fields: ['slug', 'body'] }, { source: true });

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_pages"."slug",
			  "directus_versioned_pages"."body",
			  "directus_versioned_pages"."version_id",
			  "directus_versioned_pages"."version_name",
			  "directus_versioned_pages"."version_type",
			  "directus_versioned_pages"."version_date_created",
			  "directus_versioned_pages"."version_date_updated",
			  "directus_versioned_pages"."version_user_created",
			  "directus_versioned_pages"."version_user_updated",
			  "directus_versioned_pages"."directus_version_key"
			from
			  (
			    select
			      "pages"."slug" as "slug",
			      "pages"."body" as "body",
			      "published"."version_id" as "version_id",
			      "published"."version_name" as "version_name",
			      'published' as "version_type",
			      "published"."version_date_created" as "version_date_created",
			      "published"."version_date_updated" as "version_date_updated",
			      "published"."version_user_created" as "version_user_created",
			      "published"."version_user_updated" as "version_user_updated",
			      CAST("pages"."slug" AS VARCHAR(255)) as "directus_version_key"
			    from
			      "pages"
			      left join "directus_shadow_pages" as "published" on "published"."slug" = "pages"."slug"
			      and "published"."version_type" = ?
			    union all
			    select
			      "directus_shadow_pages"."slug" as "slug",
			      NULL as "body",
			      "directus_shadow_pages"."version_id" as "version_id",
			      "directus_shadow_pages"."version_name" as "version_name",
			      "directus_shadow_pages"."version_type" as "version_type",
			      "directus_shadow_pages"."version_date_created" as "version_date_created",
			      "directus_shadow_pages"."version_date_updated" as "version_date_updated",
			      "directus_shadow_pages"."version_user_created" as "version_user_created",
			      "directus_shadow_pages"."version_user_updated" as "version_user_updated",
			      CAST(
			        -1 * "directus_shadow_pages"."version_id" AS VARCHAR(255)
			      ) as "directus_version_key"
			    from
			      "directus_shadow_pages"
			    where
			      not "directus_shadow_pages"."version_type" = ?
			  ) as "directus_versioned_pages"
			order by
			  "directus_versioned_pages"."slug" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    100,
			  ],
			]
		`);
	});

	test.each([
		['mysql', 'CHAR(255)'],
		['mssql', 'NVARCHAR(255)'],
		['oracle', 'VARCHAR2(255)'],
	] as const)('casts string keys to %s string type', async (client, type) => {
		const { sql } = await read('pages', { fields: ['slug'] }, { source: true, client });

		// The formatter doesn't know every type, so whitespace within the cast may differ
		expect(sql.replace(/\s+/g, '')).toContain(`CAST("pages"."slug"AS${type})`);
	});
});

describe('fields', () => {
	test('selects the primary key and version system fields when not requested', async () => {
		const { sql, bindings } = await read('articles', { fields: ['title'] });

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."title",
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    100,
			  ],
			]
		`);
	});

	test('ignores version system fields in the selection of live columns', async () => {
		const { sql, bindings } = await read('articles', { fields: ['title', 'directus_version.name'] });

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."title",
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    100,
			  ],
			]
		`);
	});
});

describe('filter', () => {
	test('maps version system fields to the system columns', async () => {
		const { sql, bindings } = await read('articles', {
			fields: ['id'],
			filter: { directus_version: { type: { _eq: 'draft' }, name: { _contains: 'review' } } },
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			where
			  "directus_versioned_articles"."version_type" = ?
			  and "directus_versioned_articles"."version_name" like ?
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    "draft",
			    "%review%",
			    100,
			  ],
			]
		`);
	});

	test('maps version system fields nested in logical operators', async () => {
		const { sql, bindings } = await read('articles', {
			fields: ['id'],
			filter: {
				_or: [{ title: { _eq: 'Hello' } }, { _and: [{ directus_version: { type: { _neq: 'published' } } }] }],
			},
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			where
			  (
			    "directus_versioned_articles"."title" = ?
			    or (
			      not "directus_versioned_articles"."version_type" = ?
			    )
			  )
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    "Hello",
			    "published",
			    100,
			  ],
			]
		`);
	});

	test('matches m2o filters against the live item or the referenced version', async () => {
		const { sql, bindings } = await read('articles', {
			fields: ['id'],
			filter: { author: { name: { _eq: 'Jane' } } },
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			  left join "authors" as "tyjzk" on "directus_versioned_articles"."author" = "tyjzk"."id"
			  left join "directus_shadow_authors" as "udhuy" on "directus_versioned_articles"."version_ref_author" = "udhuy"."version_id"
			where
			  (
			    (
			      "tyjzk"."name" = ?
			      or (
			        "directus_versioned_articles"."author" is null
			        and "udhuy"."name" = ?
			      )
			    )
			  )
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    "Jane",
			    "Jane",
			    100,
			  ],
			]
		`);
	});

	test('applies version system fields on related items to referenced versions and published live items', async () => {
		const { sql, bindings } = await read('articles', {
			fields: ['id'],
			filter: { author: { directus_version: { type: { _eq: 'published' } } } },
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			  left join "directus_shadow_authors" as "maoqz" on "directus_versioned_articles"."version_ref_author" = "maoqz"."version_id"
			where
			  (
			    (
			      "directus_versioned_articles"."author" is not null
			      or (
			        "directus_versioned_articles"."author" is null
			        and "maoqz"."version_type" = ?
			      )
			    )
			  )
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    "published",
			    100,
			  ],
			]
		`);
	});

	test('never matches live related items with version system fields that only versions have', async () => {
		const { sql, bindings } = await read('articles', {
			fields: ['id'],
			filter: { author: { directus_version: { type: { _eq: 'draft' } } } },
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			  left join "authors" as "jiqfw" on "directus_versioned_articles"."author" = "jiqfw"."id"
			  left join "directus_shadow_authors" as "maoqz" on "directus_versioned_articles"."version_ref_author" = "maoqz"."version_id"
			where
			  (
			    (
			      (1 = ?)
			      or (
			        "directus_versioned_articles"."author" is null
			        and "maoqz"."version_type" = ?
			      )
			    )
			  )
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    0,
			    "draft",
			    100,
			  ],
			]
		`);
	});

	test("never matches version system fields of related items in collections that aren't versioned", async () => {
		const { sql, bindings } = await read('articles', {
			fields: ['id'],
			filter: { category: { directus_version: { type: { _eq: 'draft' } } } },
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			  left join "categories" as "wwbtm" on "directus_versioned_articles"."category" = "wwbtm"."id"
			where
			  ((1 = ?))
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    0,
			    100,
			  ],
			]
		`);
	});

	test("matches published version system fields of related items in collections that aren't versioned", async () => {
		const { sql, bindings } = await read('articles', {
			fields: ['id'],
			filter: { category: { directus_version: { type: { _eq: 'published' } } } },
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			where
			  "directus_versioned_articles"."category" is not null
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    100,
			  ],
			]
		`);
	});

	test('applies every condition on the related item', async () => {
		const { sql, bindings } = await read('articles', {
			fields: ['id'],
			filter: { category: { name: { _eq: 'News' }, id: { _gt: 1 } } },
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			  left join "categories" as "ebrwj" on "directus_versioned_articles"."category" = "ebrwj"."id"
			where
			  (
			    (
			      "ebrwj"."name" = ?
			      and "ebrwj"."id" > ?
			    )
			  )
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    "News",
			    1,
			    100,
			  ],
			]
		`);
	});

	test('combines field and version system fields conditions on related items', async () => {
		const { sql, bindings } = await read('articles', {
			fields: ['id'],
			filter: { author: { name: { _eq: 'Jane' }, directus_version: { type: { _eq: 'draft' } } } },
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			  left join "authors" as "tyjzk" on "directus_versioned_articles"."author" = "tyjzk"."id"
			  left join "directus_shadow_authors" as "udhuy" on "directus_versioned_articles"."version_ref_author" = "udhuy"."version_id"
			where
			  (
			    (
			      (
			        "tyjzk"."name" = ?
			        and 1 = ?
			      )
			      or (
			        "directus_versioned_articles"."author" is null
			        and (
			          "udhuy"."name" = ?
			          and "udhuy"."version_type" = ?
			        )
			      )
			    )
			  )
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    "Jane",
			    0,
			    "Jane",
			    "draft",
			    100,
			  ],
			]
		`);
	});

	test('keeps operators directly on m2o fields', async () => {
		const { sql, bindings } = await read('articles', { fields: ['id'], filter: { author: { _null: true } } });

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			where
			  "directus_versioned_articles"."author" is null
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    100,
			  ],
			]
		`);
	});

	test('filters o2m relations on the live related items', async () => {
		const { sql, bindings } = await read('articles', {
			fields: ['id'],
			filter: { tags: { _some: { label: { _eq: 'news' } } } },
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			  inner join (
			    select distinct
			      "directus_versioned_articles"."directus_version_key",
			      "directus_versioned_articles"."id" as "iiqmb"
			    from
			      "directus_versioned_articles"
			      left join "tags" as "rzthf" on "directus_versioned_articles"."directus_version_key" = "rzthf"."article"
			    where
			      "directus_versioned_articles"."directus_version_key" in (
			        select
			          "tags"."article" as "article"
			        from
			          "tags"
			        where
			          "tags"."article" is not null
			          and "tags"."label" = ?
			      )
			    order by
			      "directus_versioned_articles"."id" asc
			    limit
			      ?
			  ) as "inner" on "directus_versioned_articles"."directus_version_key" = "inner"."directus_version_key"
			order by
			  "inner"."iiqmb" asc"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    "published",
			    "published",
			    "news",
			    100,
			  ],
			]
		`);
	});

	test('throws on unknown version system fields', async () => {
		await expect(
			read('articles', { fields: ['id'], filter: { directus_version: { unknown: { _eq: 1 } } } }),
		).rejects.toThrow('"directus_version.unknown" doesn\'t exist');
	});

	test('throws on unsupported operators on version system fields of live related items', async () => {
		await expect(
			read('articles', {
				fields: ['id'],
				filter: { author: { directus_version: { type: { _between: ['a', 'b'] } } } },
			}),
		).rejects.toThrow('Operator "_between" isn\'t supported');
	});
});

describe('sort', () => {
	test('maps version system fields to the system columns', async () => {
		const { sql, bindings } = await read('articles', {
			fields: ['id'],
			sort: ['-directus_version.date_created', 'title'],
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			order by
			  "directus_versioned_articles"."version_date_created" desc,
			  "directus_versioned_articles"."title" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    100,
			  ],
			]
		`);
	});
});

describe('aggregate', () => {
	test('groups by version system fields', async () => {
		const { sql, bindings } = await read('articles', {
			aggregate: { count: ['*'], countDistinct: ['directus_version.user_created'] },
			group: ['directus_version.type'],
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  count(*) as "count",
			  count(
			    distinct "directus_versioned_articles"."version_user_created"
			  ) as "countDistinct->version_user_created",
			  "directus_versioned_articles"."version_type"
			from
			  "directus_versioned_articles"
			group by
			  "directus_versioned_articles"."version_type"
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    100,
			  ],
			]
		`);
	});

	test('formats aggregated version system fields like the query', async () => {
		const { items } = await read(
			'articles',
			{ aggregate: { countDistinct: ['directus_version.user_created'] }, group: ['directus_version.type'] },
			{
				responses: [
					['directus_versioned_articles', [{ version_type: 'draft', countDistinct: { version_user_created: 2 } }]],
				],
			},
		);

		expect(items).toEqual([
			{ directus_version: { type: 'draft' }, countDistinct: { 'directus_version.user_created': 2 } },
		]);
	});

	test('counts items and versions', async () => {
		const { items, sql, bindings } = await read(
			'articles',
			{ filter: { directus_version: { type: { _eq: 'draft' } } }, aggregate: { count: ['*'] } },
			{ responses: [['directus_versioned_articles', [{ count: 3 }]]] },
		);

		expect(items).toEqual([{ count: 3 }]);

		expect(sql).toMatchInlineSnapshot(`
			"select
			  count(*) as "count"
			from
			  "directus_versioned_articles"
			where
			  "directus_versioned_articles"."version_type" = ?
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    "draft",
			    100,
			  ],
			]
		`);
	});
});

describe('version references', () => {
	test('reads referenced versions of m2o related items', async () => {
		const { items, sql, bindings } = await read(
			'articles',
			{ fields: ['id', 'author.name'] },
			{
				responses: [
					[
						'directus_versioned_articles',
						[
							{
								id: 1,
								author: null,
								version_ref_author: 7,
								version_id: 3,
								version_type: 'draft',
								directus_version_key: -3,
							},
						],
					],
					['directus_versioned_authors', [{ id: 2, name: 'Jane', version_id: 7, directus_version_key: -7 }]],
				],
			},
		);

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."author",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?

			select
			  "directus_versioned_authors"."name",
			  "directus_versioned_authors"."id",
			  "directus_versioned_authors"."version_id",
			  "directus_versioned_authors"."version_name",
			  "directus_versioned_authors"."version_type",
			  "directus_versioned_authors"."version_date_created",
			  "directus_versioned_authors"."version_date_updated",
			  "directus_versioned_authors"."version_user_created",
			  "directus_versioned_authors"."version_user_updated",
			  "directus_versioned_authors"."directus_version_key"
			from
			  "directus_versioned_authors"
			where
			  "directus_versioned_authors"."version_id" in (?)"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    100,
			  ],
			  [
			    "published",
			    "published",
			    7,
			  ],
			]
		`);

		expect(items[0]!['author']).toEqual({ name: 'Jane' });
	});

	test('reads live and versioned o2m related items of versions', async () => {
		const { items, sql, bindings } = await read(
			'articles',
			{ fields: ['id', 'tags.label'] },
			{
				responses: [
					['directus_versioned_articles', [{ id: 1, version_id: 3, version_type: 'draft', directus_version_key: -3 }]],
					[
						'directus_versioned_tags',
						[
							{ id: 10, label: 'live', version_type: 'published', version_ref_article: 3, directus_version_key: 10 },
							{
								id: 11,
								label: 'draft',
								version_id: 12,
								version_type: 'draft',
								version_ref_article: 3,
								directus_version_key: -12,
							},
						],
					],
				],
			},
		);

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_articles"."id",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?

			select
			  "directus_versioned_tags"."label",
			  "directus_versioned_tags"."article",
			  "directus_versioned_tags"."id",
			  "directus_versioned_tags"."version_id",
			  "directus_versioned_tags"."version_name",
			  "directus_versioned_tags"."version_type",
			  "directus_versioned_tags"."version_date_created",
			  "directus_versioned_tags"."version_date_updated",
			  "directus_versioned_tags"."version_user_created",
			  "directus_versioned_tags"."version_user_updated",
			  "directus_versioned_tags"."version_ref_article",
			  "directus_versioned_tags"."directus_version_key"
			from
			  "directus_versioned_tags"
			where
			  "directus_versioned_tags"."version_ref_article" in (?)
			order by
			  "directus_versioned_tags"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "published",
			    100,
			  ],
			  [
			    "published",
			    "published",
			    3,
			    25000,
			  ],
			]
		`);

		expect(items[0]!['tags']).toEqual([{ label: 'live' }, { label: 'draft' }]);
	});

	test('only returns the reference to versions of m2o related items without subfields', async () => {
		const { items, sql } = await read(
			'articles',
			{ fields: ['id', 'author'] },
			{
				responses: [
					[
						'directus_versioned_articles',
						[{ id: 1, author: null, version_ref_author: 7, version_type: 'draft', directus_version_key: -3 }],
					],
				],
			},
		);

		expect(sql).not.toContain('directus_versioned_authors');
		expect(items[0]!['author']).toEqual({ directus_version: { id: 7 } });
	});

	test('only returns keys and version ids of o2m related items without subfields', async () => {
		const { items } = await read(
			'articles',
			{ fields: ['id', 'tags'] },
			{
				responses: [
					['directus_versioned_articles', [{ id: 1, version_id: 3, version_type: 'draft', directus_version_key: -3 }]],
					[
						'directus_versioned_tags',
						[
							{ id: 10, version_type: 'published', version_ref_article: 3, directus_version_key: 10 },
							{ id: null, version_id: 12, version_type: 'draft', version_ref_article: 3, directus_version_key: -12 },
						],
					],
				],
			},
		);

		expect(items[0]!['tags']).toEqual([10, { directus_version: { id: 12 } }]);
	});

	test('reads only live o2m related items of published items', async () => {
		const { sql, bindings } = await read(
			'articles',
			{ fields: ['id', 'tags.label'] },
			{
				responses: [
					[
						'directus_versioned_articles',
						[{ id: 1, version_id: 3, version_type: 'published', directus_version_key: 1 }],
					],
				],
			},
		);

		expect(sql.split('\n\n')[1]).toContain(`"directus_versioned_tags"."article" in (?)`);
		expect(sql.split('\n\n')[1]).not.toContain('"directus_versioned_tags"."version_ref_article" in');
		expect(bindings[1]).toEqual(['published', 'published', 1, 'published', 25000]);
	});

	test('links m2o related items through the live key, or the version reference without one', async () => {
		const { items, bindings } = await read(
			'articles',
			{ fields: ['id', 'author.name'] },
			{
				responses: [
					[
						'directus_versioned_articles',
						[
							{ id: 1, author: 2, version_type: 'published', directus_version_key: 1 },
							{
								id: 1,
								author: null,
								version_ref_author: 7,
								version_id: 3,
								version_type: 'draft',
								directus_version_key: -3,
							},
							{
								id: 4,
								author: null,
								version_ref_author: 9,
								version_id: 5,
								version_type: 'draft',
								directus_version_key: -5,
							},
						],
					],
					[
						'directus_versioned_authors',
						[
							{ id: 2, name: 'Live', version_id: 9, version_type: 'published', directus_version_key: 2 },
							{ id: 2, name: 'Draft', version_id: 7, version_type: 'draft', directus_version_key: -7 },
						],
					],
				],
			},
		);

		expect(bindings[1]).toEqual(['published', 'published', 2, 'published', 7, 9]);

		// A reference to the published version resolves to the live item
		expect(items.map((item) => item['author'])).toEqual([{ name: 'Live' }, { name: 'Draft' }, { name: 'Live' }]);
	});

	test('applies deep queries with version system fields to versions of related items', async () => {
		const { sql, items } = await read(
			'articles',
			{
				fields: ['id', 'tags.label', 'tags.directus_version.date_created'],
				deep: {
					tags: {
						_filter: { directus_version: { type: { _eq: 'draft' } } },
						_sort: ['-directus_version.date_created'],
					},
				},
			} as Query,
			{
				responses: [
					['directus_versioned_articles', [{ id: 1, version_id: 3, version_type: 'draft', directus_version_key: -3 }]],
					[
						'directus_versioned_tags',
						[
							{
								id: 11,
								label: 'old',
								version_id: 12,
								version_type: 'draft',
								version_date_created: '2026-01-01',
								version_ref_article: 3,
							},
							{
								id: 13,
								label: 'new',
								version_id: 14,
								version_type: 'draft',
								version_date_created: '2026-02-01',
								version_ref_article: 3,
							},
						],
					],
				],
			},
		);

		expect(sql.split('\n\n')[1]).toContain(`"directus_versioned_tags"."version_type" = ?`);
		expect(sql.split('\n\n')[1]).toContain(`order by\n  "directus_versioned_tags"."version_date_created" desc`);

		expect(items[0]!['tags']).toEqual([
			{ label: 'new', directus_version: { date_created: '2026-02-01T00:00:00.000Z' } },
			{ label: 'old', directus_version: { date_created: '2026-01-01T00:00:00.000Z' } },
		]);
	});

	test('reads versions referenced by versions of related items', async () => {
		const { items } = await read(
			'tags',
			{ fields: ['label', 'article.author.name', 'article.directus_version.id'] },
			{
				responses: [
					[
						'directus_versioned_tags',
						[{ id: 11, label: 'draft', version_ref_article: 3, version_id: 12, version_type: 'draft' }],
					],
					[
						'directus_versioned_articles',
						[{ id: null, author: null, version_ref_author: 7, version_id: 3, version_type: 'draft' }],
					],
					['directus_versioned_authors', [{ id: null, name: 'Jane', version_id: 7, version_type: 'draft' }]],
				],
			},
		);

		expect(items).toEqual([{ label: 'draft', article: { author: { name: 'Jane' }, directus_version: { id: 3 } } }]);
	});

	test("reads linked o2m related items in collections that aren't versioned", async () => {
		const { items } = await read(
			'articles',
			{ fields: ['id', 'comments.body', 'comments.directus_version.type'] },
			{
				responses: [
					['directus_versioned_articles', [{ id: 1, version_id: 3, version_type: 'draft', directus_version_key: -3 }]],
					[
						'directus_versioned_comments',
						[{ id: 5, body: 'Hi', version_type: 'published', version_ref_article: 3, directus_version_key: 5 }],
					],
				],
			},
		);

		expect(items[0]!['comments']).toEqual([{ body: 'Hi', directus_version: { type: 'published' } }]);
	});

	test('reads a2o related items through the live key, or the version reference without one', async () => {
		const { items, sql, bindings } = await read(
			'posts',
			{ fields: ['id', 'item:authors.name', 'item:categories.name'] },
			{
				responses: [
					[
						'directus_versioned_posts',
						[
							{ id: 1, collection: 'authors', item: '2', version_type: 'published', directus_version_key: 1 },
							{
								id: 1,
								collection: 'authors',
								item: null,
								version_ref_item: 7,
								version_id: 3,
								version_type: 'draft',
								directus_version_key: -3,
							},
							{
								id: 4,
								collection: 'authors',
								item: null,
								version_ref_item: 9,
								version_id: 5,
								version_type: 'draft',
								directus_version_key: -5,
							},
							{ id: 6, collection: 'categories', item: '5', version_type: 'published', directus_version_key: 6 },
						],
					],
					[
						'directus_versioned_authors',
						[
							{ id: 2, name: 'Live', version_id: 9, version_type: 'published', directus_version_key: 2 },
							{ id: 2, name: 'Draft', version_id: 7, version_type: 'draft', directus_version_key: -7 },
						],
					],
					[
						'directus_versioned_categories',
						[{ id: 5, name: 'News', version_type: 'published', directus_version_key: 5 }],
					],
				],
			},
		);

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_posts"."id",
			  "directus_versioned_posts"."item",
			  "directus_versioned_posts"."collection",
			  "directus_versioned_posts"."version_id",
			  "directus_versioned_posts"."version_name",
			  "directus_versioned_posts"."version_type",
			  "directus_versioned_posts"."version_date_created",
			  "directus_versioned_posts"."version_date_updated",
			  "directus_versioned_posts"."version_user_created",
			  "directus_versioned_posts"."version_user_updated",
			  "directus_versioned_posts"."version_ref_item",
			  "directus_versioned_posts"."directus_version_key"
			from
			  (
			    select
			      "directus_versioned_rows".*,
			      case
			        when "directus_versioned_rows"."collection" = ? then "directus_versioned_rows"."version_ref_item"
			      end as "version_ref_item__authors"
			    from
			      "directus_versioned_rows"
			  ) as "directus_versioned_posts"
			order by
			  "directus_versioned_posts"."id" asc
			limit
			  ?

			select
			  "directus_versioned_authors"."name",
			  "directus_versioned_authors"."id",
			  "directus_versioned_authors"."version_id",
			  "directus_versioned_authors"."version_name",
			  "directus_versioned_authors"."version_type",
			  "directus_versioned_authors"."version_date_created",
			  "directus_versioned_authors"."version_date_updated",
			  "directus_versioned_authors"."version_user_created",
			  "directus_versioned_authors"."version_user_updated",
			  "directus_versioned_authors"."directus_version_key"
			from
			  "directus_versioned_authors"
			where
			  (
			    (
			      "directus_versioned_authors"."id" in (?)
			      and "directus_versioned_authors"."version_type" = ?
			    )
			    or "directus_versioned_authors"."version_id" in (?, ?)
			  )

			select
			  "directus_versioned_categories"."name",
			  "directus_versioned_categories"."id",
			  "directus_versioned_categories"."version_id",
			  "directus_versioned_categories"."version_name",
			  "directus_versioned_categories"."version_type",
			  "directus_versioned_categories"."version_date_created",
			  "directus_versioned_categories"."version_date_updated",
			  "directus_versioned_categories"."version_user_created",
			  "directus_versioned_categories"."version_user_updated",
			  "directus_versioned_categories"."directus_version_key"
			from
			  "directus_versioned_categories"
			where
			  (
			    "directus_versioned_categories"."id" in (?)
			    and "directus_versioned_categories"."version_type" = ?
			  )"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "authors",
			    "published",
			    "published",
			    100,
			  ],
			  [
			    "published",
			    "published",
			    2,
			    "published",
			    7,
			    9,
			  ],
			  [
			    5,
			    "published",
			  ],
			]
		`);

		// A reference to the published version resolves to the live item
		expect(items.map((item) => item['item'])).toEqual([
			{ name: 'Live' },
			{ name: 'Draft' },
			{ name: 'Live' },
			{ name: 'News' },
		]);
	});

	test("reads a2o related items of collections that aren't versioned by their live key", async () => {
		const { items, bindings } = await read(
			'posts',
			{ fields: ['id', 'item:authors.name', 'item:categories.name'] },
			{
				responses: [
					[
						'directus_versioned_posts',
						[{ id: 1, collection: 'categories', item: '5', version_type: 'published', directus_version_key: 1 }],
					],
					[
						'directus_versioned_categories',
						[{ id: 5, name: 'News', version_type: 'published', directus_version_key: 5 }],
					],
				],
			},
		);

		expect(bindings[2]).toEqual([5, 'published']);
		expect(items[0]!['item']).toEqual({ name: 'News' });
	});

	test('marks each related collection of a2o nodes as versioned, with the shadow tables they read', async () => {
		const db = knex.default({ client: CLIENTS.postgres });
		const context = { knex: db, schema: extractVersioning(db, builtSchema) };

		const ast = await getAstFromQuery(
			{
				collection: 'posts',
				query: { fields: ['item:authors.name', 'item:categories.name'] },
				accountability: null,
				versioning: true,
			},
			context,
		);

		const node = ast.children.find((child) => child.type === 'a2o')!;

		expect(node.type === 'a2o' && node.versioning).toEqual({
			authors: expect.objectContaining({ reference: 'version_ref_item', shadows: {} }),
			categories: expect.objectContaining({ reference: 'version_ref_item', shadows: {} }),
		});
	});

	test('returns version system fields of a2o related items', async () => {
		const { items, sql } = await read(
			'posts',
			{ fields: ['id', 'item:authors.directus_version.type', 'item:categories.name'] },
			{
				responses: [
					[
						'directus_versioned_posts',
						[
							{
								id: 1,
								collection: 'authors',
								item: null,
								version_ref_item: 7,
								version_id: 3,
								version_type: 'draft',
								directus_version_key: -3,
							},
						],
					],
					['directus_versioned_authors', [{ id: 2, name: 'Draft', version_id: 7, version_type: 'draft' }]],
				],
			},
		);

		// Only the primary key is selected next to the system columns, as no other field of authors is requested
		expect(sql).toContain('select\n  "directus_versioned_authors"."id",\n  "directus_versioned_authors"."version_id"');
		expect(items[0]!['item']).toEqual({ directus_version: { type: 'draft' } });
	});
});

describe('a2o filter', () => {
	test('matches the live item of the collection or the referenced version of it', async () => {
		const { sql, bindings } = await read('posts', {
			fields: ['id'],
			filter: { 'item:authors': { name: { _eq: 'Jane' } } },
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_posts"."id",
			  "directus_versioned_posts"."version_id",
			  "directus_versioned_posts"."version_name",
			  "directus_versioned_posts"."version_type",
			  "directus_versioned_posts"."version_date_created",
			  "directus_versioned_posts"."version_date_updated",
			  "directus_versioned_posts"."version_user_created",
			  "directus_versioned_posts"."version_user_updated",
			  "directus_versioned_posts"."version_ref_item",
			  "directus_versioned_posts"."directus_version_key"
			from
			  (
			    select
			      "directus_versioned_rows".*,
			      case
			        when "directus_versioned_rows"."collection" = ? then "directus_versioned_rows"."version_ref_item"
			      end as "version_ref_item__authors"
			    from
			      "directus_versioned_rows"
			  ) as "directus_versioned_posts"
			  left join "authors" as "fjylc" on "directus_versioned_posts"."collection" = ?
			  and "directus_versioned_posts"."item" = CAST("fjylc"."id" AS CHAR(255))
			  left join "directus_shadow_authors" as "emimg" on "directus_versioned_posts"."version_ref_item__authors" = "emimg"."version_id"
			where
			  (
			    (
			      "fjylc"."name" = ?
			      or (
			        "directus_versioned_posts"."item" is null
			        and "emimg"."name" = ?
			      )
			    )
			  )
			order by
			  "directus_versioned_posts"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "authors",
			    "published",
			    "published",
			    "authors",
			    "Jane",
			    "Jane",
			    100,
			  ],
			]
		`);
	});

	test('applies version system fields to the referenced version and the published live item', async () => {
		const { sql } = await read('posts', {
			fields: ['id'],
			filter: { 'item:authors': { directus_version: { type: { _eq: 'draft' } } } },
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_posts"."id",
			  "directus_versioned_posts"."version_id",
			  "directus_versioned_posts"."version_name",
			  "directus_versioned_posts"."version_type",
			  "directus_versioned_posts"."version_date_created",
			  "directus_versioned_posts"."version_date_updated",
			  "directus_versioned_posts"."version_user_created",
			  "directus_versioned_posts"."version_user_updated",
			  "directus_versioned_posts"."version_ref_item",
			  "directus_versioned_posts"."directus_version_key"
			from
			  (
			    select
			      "directus_versioned_rows".*,
			      case
			        when "directus_versioned_rows"."collection" = ? then "directus_versioned_rows"."version_ref_item"
			      end as "version_ref_item__authors"
			    from
			      "directus_versioned_rows"
			  ) as "directus_versioned_posts"
			  left join "authors" as "polww" on "directus_versioned_posts"."collection" = ?
			  and "directus_versioned_posts"."item" = CAST("polww"."id" AS CHAR(255))
			  left join "directus_shadow_authors" as "mxqzd" on "directus_versioned_posts"."version_ref_item__authors" = "mxqzd"."version_id"
			where
			  (
			    (
			      (1 = ?)
			      or (
			        "directus_versioned_posts"."item" is null
			        and "mxqzd"."version_type" = ?
			      )
			    )
			  )
			order by
			  "directus_versioned_posts"."id" asc
			limit
			  ?"
		`);
	});

	test("only matches live items of collections that aren't versioned", async () => {
		const { sql } = await read('posts', {
			fields: ['id'],
			filter: { 'item:categories': { name: { _eq: 'News' } } },
		});

		expect(sql).toMatchInlineSnapshot(`
			"select
			  "directus_versioned_posts"."id",
			  "directus_versioned_posts"."version_id",
			  "directus_versioned_posts"."version_name",
			  "directus_versioned_posts"."version_type",
			  "directus_versioned_posts"."version_date_created",
			  "directus_versioned_posts"."version_date_updated",
			  "directus_versioned_posts"."version_user_created",
			  "directus_versioned_posts"."version_user_updated",
			  "directus_versioned_posts"."version_ref_item",
			  "directus_versioned_posts"."directus_version_key"
			from
			  (
			    select
			      "directus_versioned_rows".*,
			      case
			        when "directus_versioned_rows"."collection" = ? then "directus_versioned_rows"."version_ref_item"
			      end as "version_ref_item__authors"
			    from
			      "directus_versioned_rows"
			  ) as "directus_versioned_posts"
			  left join "categories" as "tgymy" on "directus_versioned_posts"."collection" = ?
			  and "directus_versioned_posts"."item" = CAST("tgymy"."id" AS CHAR(255))
			where
			  "tgymy"."name" = ?
			order by
			  "directus_versioned_posts"."id" asc
			limit
			  ?"
		`);
	});

	test('requires read access to the shadow tables of referenced versions', async () => {
		const db = knex.default({ client: CLIENTS.postgres });
		const context = { knex: db, schema: extractVersioning(db, builtSchema) };

		const ast = await getAstFromQuery(
			{
				collection: 'posts',
				query: { fields: ['id'], filter: { 'item:authors': { name: { _eq: 'Jane' } } } },
				accountability: null,
				versioning: true,
			},
			context,
		);

		expect(ast.versioning?.shadows).toEqual({ directus_shadow_authors: ['name'] });
	});
});

describe('permissions', () => {
	test('limits version rows to the permissions of the shadow table', async () => {
		const { sql, bindings } = await read(
			'articles',
			{ fields: ['id', 'title'] },
			{
				permissions: [
					{ collection: 'articles', fields: ['id', 'title'] },
					{
						collection: 'directus_shadow_articles',
						permissions: { version_user_created: { _eq: 'user' } },
						fields: ['id'],
					},
				],
			},
		);

		expect(sql).toMatchInlineSnapshot(`
			"select
			  (
			    CASE
			      WHEN (
			        ("directus_versioned_articles"."version_type" = ?)
			        or (
			          "directus_versioned_articles"."version_user_created" = ?
			          and not "directus_versioned_articles"."version_type" = ?
			        )
			      ) THEN "directus_versioned_articles"."id"
			    END
			  ) AS "id",
			  (
			    CASE
			      WHEN (
			        ("directus_versioned_articles"."version_type" = ?)
			      ) THEN "directus_versioned_articles"."title"
			    END
			  ) AS "title",
			  "directus_versioned_articles"."version_id",
			  "directus_versioned_articles"."version_name",
			  "directus_versioned_articles"."version_type",
			  "directus_versioned_articles"."version_date_created",
			  "directus_versioned_articles"."version_date_updated",
			  "directus_versioned_articles"."version_user_created",
			  "directus_versioned_articles"."version_user_updated",
			  "directus_versioned_articles"."version_ref_author",
			  "directus_versioned_articles"."directus_version_key"
			from
			  "directus_versioned_articles"
			where
			  (
			    ("directus_versioned_articles"."version_type" = ?)
			    or (
			      "directus_versioned_articles"."version_user_created" = ?
			      and not "directus_versioned_articles"."version_type" = ?
			    )
			  )
			order by
			  "directus_versioned_articles"."id" asc
			limit
			  ?"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [
			    "published",
			    "user",
			    "published",
			    "published",
			    "published",
			    "published",
			    "published",
			    "user",
			    "published",
			    100,
			  ],
			]
		`);
	});

	test('rejects filters on fields of versions of related items without access to them', async () => {
		const permissions = (fields: string[]) => [
			{ collection: 'articles', fields: ['*'] },
			{ collection: 'authors', fields: ['*'] },
			{ collection: 'directus_shadow_articles', fields: ['*'] },
			{ collection: 'directus_shadow_authors', fields },
		];

		const query = { fields: ['id'], filter: { author: { name: { _eq: 'Jane' } } } };

		await expect(read('articles', query, { permissions: permissions(['id']) })).rejects.toThrow(
			'You don\'t have permission to access field "name" in collection "directus_shadow_authors" or it does not exist. Queried in root.',
		);

		await expect(read('articles', query, { permissions: permissions(['name']) })).resolves.toBeDefined();
	});

	test('rejects reading versions without access to the shadow table', async () => {
		await expect(
			read('articles', { fields: ['id', 'title'] }, { permissions: [{ collection: 'articles', fields: ['*'] }] }),
		).rejects.toThrow('You don\'t have permission to access collection "directus_shadow_articles"');
	});
});
