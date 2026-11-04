import type { CollectionBuilder } from '@directus/schema-builder';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Query, SchemaOverview } from '@directus/types';
import knex from 'knex';
import { createTracker, MockClient } from 'knex-mock-client';
import { describe, expect, test } from 'vitest';
import { countVersionedItems, readVersionedItems } from './read.js';

// The database helpers derive the dialect from the class name of the client
class Client_PG extends MockClient {}

class Client_MySQL2 extends MockClient {}

class Client_MSSQL extends MockClient {}

class Client_Oracledb extends MockClient {}

function versionMeta(c: CollectionBuilder) {
	c.field('version_id').id();
	c.field('version_name').string();
	c.field('version_type').string();
	c.field('version_date_created').timestamp();
	c.field('version_date_updated').timestamp();
	c.field('version_user_created').uuid();
	c.field('version_user_updated').uuid();
}

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('authors');
		c.field('tags').o2m('tags', 'article');
		c.field('category').m2o('categories');
	})
	.collection('authors', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('categories', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.collection('tags', (c) => {
		c.field('id').id();
		c.field('label').string();
	})
	.collection('directus_shadow_articles', (c) => {
		versionMeta(c);
		c.field('id').integer();
		c.field('title').string();
		c.field('author').integer();
		c.field('version_ref_author').m2o('directus_shadow_authors');
	})
	.collection('directus_shadow_authors', (c) => {
		versionMeta(c);
		c.field('id').integer();
		c.field('name').string();
	})
	.collection('directus_shadow_tags', (c) => {
		versionMeta(c);
		c.field('id').integer();
		c.field('label').string();
		c.field('version_ref_article').m2o('directus_shadow_articles');
	})
	.collection('directus_link_tags', (c) => {
		c.field('id').id();
		c.field('article').integer();
	})
	// String primary key, and a shadow table that's missing a live column
	.collection('pages', (c) => {
		c.field('slug').string().primary();
		c.field('body').text();
	})
	.collection('directus_shadow_pages', (c) => {
		versionMeta(c);
		c.field('slug').string();
	})
	.build();

/** The rows of the virtual collection, which are the same in every query of a collection */
const SOURCE = /\(select "(?:directus_shadow_)?\w+"\."[^]*?\) as "(directus_versioned_\w+)"/g;

type Options = {
	mode?: 'items' | 'versions';
	client?: typeof MockClient;
	/** Rows returned for queries whose SQL contains the key, in order */
	responses?: [string, Record<string, unknown>[]][];
	/** Keep the rows of the virtual collection in the SQL instead of replacing them with its name */
	source?: boolean;
};

function setup(options: Options = {}) {
	const db = knex.default({ client: options.client ?? Client_PG });
	const tracker = createTracker(db);

	for (const [key, rows] of options.responses ?? []) {
		tracker.on.select((query) => query.sql.includes(key)).responseOnce(rows);
	}

	tracker.on.select(() => true).response([]);

	const queries = () =>
		tracker.history.select.map(({ sql, bindings }) => ({
			sql: options.source ? sql : sql.replace(SOURCE, '"$1"'),
			bindings,
		}));

	return { db, queries };
}

async function read(collection: string, query: Query, options: Options = {}) {
	const { db, queries } = setup(options);

	const items = await readVersionedItems(
		collection,
		query,
		{ knex: db, schema: schema as SchemaOverview, accountability: null },
		options.mode,
	);

	return { items, queries: queries() };
}

describe('source of the virtual collection', () => {
	test('combines live items with their published meta and all unpublished versions', async () => {
		const { queries } = await read('articles', { fields: ['id', 'title'] }, { source: true });

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."title", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from (select "articles"."id" as "id", "articles"."title" as "title", "articles"."author" as "author", "articles"."category" as "category", "published"."version_id" as "version_id", "published"."version_name" as "version_name", 'published' as "version_type", "published"."version_date_created" as "version_date_created", "published"."version_date_updated" as "version_date_updated", "published"."version_user_created" as "version_user_created", "published"."version_user_updated" as "version_user_updated", NULL as "version_ref_author", "articles"."id" as "directus_version_key" from "articles" left join "directus_shadow_articles" as "published" on "published"."id" = "articles"."id" and "published"."version_type" = ? union all select "directus_shadow_articles"."id" as "id", "directus_shadow_articles"."title" as "title", "directus_shadow_articles"."author" as "author", NULL as "category", "directus_shadow_articles"."version_id" as "version_id", "directus_shadow_articles"."version_name" as "version_name", "directus_shadow_articles"."version_type" as "version_type", "directus_shadow_articles"."version_date_created" as "version_date_created", "directus_shadow_articles"."version_date_updated" as "version_date_updated", "directus_shadow_articles"."version_user_created" as "version_user_created", "directus_shadow_articles"."version_user_updated" as "version_user_updated", "directus_shadow_articles"."version_ref_author" as "version_ref_author", -1 * "directus_shadow_articles"."version_id" as "directus_version_key" from "directus_shadow_articles" where not "directus_shadow_articles"."version_type" = ?) as "directus_versioned_articles" limit ?",
			  },
			]
		`);
	});

	test('reads all versions, including published ones, in versions mode', async () => {
		const { queries } = await read('articles', { fields: ['id', 'title'] }, { source: true, mode: 'versions' });

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."title", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from (select "directus_shadow_articles"."id" as "id", "directus_shadow_articles"."title" as "title", "directus_shadow_articles"."author" as "author", NULL as "category", "directus_shadow_articles"."version_id" as "version_id", "directus_shadow_articles"."version_name" as "version_name", "directus_shadow_articles"."version_type" as "version_type", "directus_shadow_articles"."version_date_created" as "version_date_created", "directus_shadow_articles"."version_date_updated" as "version_date_updated", "directus_shadow_articles"."version_user_created" as "version_user_created", "directus_shadow_articles"."version_user_updated" as "version_user_updated", "directus_shadow_articles"."version_ref_author" as "version_ref_author", -1 * "directus_shadow_articles"."version_id" as "directus_version_key" from "directus_shadow_articles") as "directus_versioned_articles" limit ?",
			  },
			]
		`);
	});

	test('selects version references from the link table for live items', async () => {
		const { queries } = await read('tags', { fields: ['id', 'label'] }, { source: true });

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      100,
			    ],
			    "sql": "select "directus_versioned_tags"."id", "directus_versioned_tags"."label", "directus_versioned_tags"."version_id", "directus_versioned_tags"."version_name", "directus_versioned_tags"."version_type", "directus_versioned_tags"."version_date_created", "directus_versioned_tags"."version_date_updated", "directus_versioned_tags"."version_user_created", "directus_versioned_tags"."version_user_updated", "directus_versioned_tags"."version_ref_article", "directus_versioned_tags"."directus_version_key" from (select "tags"."id" as "id", "tags"."label" as "label", "tags"."article" as "article", "published"."version_id" as "version_id", "published"."version_name" as "version_name", 'published' as "version_type", "published"."version_date_created" as "version_date_created", "published"."version_date_updated" as "version_date_updated", "published"."version_user_created" as "version_user_created", "published"."version_user_updated" as "version_user_updated", "directus_link_tags"."article" as "version_ref_article", "tags"."id" as "directus_version_key" from "tags" left join "directus_shadow_tags" as "published" on "published"."id" = "tags"."id" and "published"."version_type" = ? left join "directus_link_tags" on "directus_link_tags"."id" = "tags"."id" union all select "directus_shadow_tags"."id" as "id", "directus_shadow_tags"."label" as "label", NULL as "article", "directus_shadow_tags"."version_id" as "version_id", "directus_shadow_tags"."version_name" as "version_name", "directus_shadow_tags"."version_type" as "version_type", "directus_shadow_tags"."version_date_created" as "version_date_created", "directus_shadow_tags"."version_date_updated" as "version_date_updated", "directus_shadow_tags"."version_user_created" as "version_user_created", "directus_shadow_tags"."version_user_updated" as "version_user_updated", "directus_shadow_tags"."version_ref_article" as "version_ref_article", -1 * "directus_shadow_tags"."version_id" as "directus_version_key" from "directus_shadow_tags" where not "directus_shadow_tags"."version_type" = ?) as "directus_versioned_tags" limit ?",
			  },
			]
		`);
	});

	test('casts string keys and selects null for columns missing in the shadow table', async () => {
		const { queries } = await read('pages', { fields: ['slug', 'body'] }, { source: true });

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      100,
			    ],
			    "sql": "select "directus_versioned_pages"."slug", "directus_versioned_pages"."body", "directus_versioned_pages"."version_id", "directus_versioned_pages"."version_name", "directus_versioned_pages"."version_type", "directus_versioned_pages"."version_date_created", "directus_versioned_pages"."version_date_updated", "directus_versioned_pages"."version_user_created", "directus_versioned_pages"."version_user_updated", "directus_versioned_pages"."directus_version_key" from (select "pages"."slug" as "slug", "pages"."body" as "body", "published"."version_id" as "version_id", "published"."version_name" as "version_name", 'published' as "version_type", "published"."version_date_created" as "version_date_created", "published"."version_date_updated" as "version_date_updated", "published"."version_user_created" as "version_user_created", "published"."version_user_updated" as "version_user_updated", CAST("pages"."slug" AS VARCHAR(255)) as "directus_version_key" from "pages" left join "directus_shadow_pages" as "published" on "published"."slug" = "pages"."slug" and "published"."version_type" = ? union all select "directus_shadow_pages"."slug" as "slug", NULL as "body", "directus_shadow_pages"."version_id" as "version_id", "directus_shadow_pages"."version_name" as "version_name", "directus_shadow_pages"."version_type" as "version_type", "directus_shadow_pages"."version_date_created" as "version_date_created", "directus_shadow_pages"."version_date_updated" as "version_date_updated", "directus_shadow_pages"."version_user_created" as "version_user_created", "directus_shadow_pages"."version_user_updated" as "version_user_updated", CAST(-1 * "directus_shadow_pages"."version_id" AS VARCHAR(255)) as "directus_version_key" from "directus_shadow_pages" where not "directus_shadow_pages"."version_type" = ?) as "directus_versioned_pages" limit ?",
			  },
			]
		`);
	});

	test.each([
		['mysql', Client_MySQL2, 'CHAR(255)'],
		['mssql', Client_MSSQL, 'NVARCHAR(255)'],
		['oracle', Client_Oracledb, 'VARCHAR2(255)'],
	])('casts string keys to %s string type', async (_name, client, type) => {
		const { queries } = await read('pages', { fields: ['slug'] }, { source: true, client });

		expect(queries[0]!.sql).toContain(`CAST(`);
		expect(queries[0]!.sql).toContain(` AS ${type})`);
	});
});

describe('fields', () => {
	test('selects the primary key and version meta when not requested', async () => {
		const { queries } = await read('articles', { fields: ['title'] });

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."title", "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" limit ?",
			  },
			]
		`);
	});

	test('ignores version meta fields in the selection of live columns', async () => {
		const { queries } = await read('articles', { fields: ['title', 'directus_version.name'] });

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."title", "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" limit ?",
			  },
			]
		`);
	});
});

describe('filter', () => {
	test('maps version meta to the meta columns', async () => {
		const { queries } = await read('articles', {
			fields: ['id'],
			filter: { directus_version: { type: { _eq: 'draft' }, name: { _contains: 'review' } } },
		});

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      "draft",
			      "%review%",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" where "directus_versioned_articles"."version_type" = ? and "directus_versioned_articles"."version_name" like ? limit ?",
			  },
			]
		`);
	});

	test('maps version meta nested in logical operators', async () => {
		const { queries } = await read('articles', {
			fields: ['id'],
			filter: {
				_or: [{ title: { _eq: 'Hello' } }, { _and: [{ directus_version: { type: { _neq: 'published' } } }] }],
			},
		});

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      "Hello",
			      "published",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" where ("directus_versioned_articles"."title" = ? or (not "directus_versioned_articles"."version_type" = ?)) limit ?",
			  },
			]
		`);
	});

	test('matches m2o filters against the live item or the referenced version', async () => {
		const { queries } = await read('articles', {
			fields: ['id'],
			filter: { author: { name: { _eq: 'Jane' } } },
		});

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      "Jane",
			      "Jane",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" left join "authors" as "tyjzk" on "directus_versioned_articles"."author" = "tyjzk"."id" left join "directus_shadow_authors" as "udhuy" on "directus_versioned_articles"."version_ref_author" = "udhuy"."version_id" where (("tyjzk"."name" = ? or ("directus_versioned_articles"."author" is null and "udhuy"."name" = ?))) limit ?",
			  },
			]
		`);
	});

	test('applies version meta on related items to referenced versions and published live items', async () => {
		const { queries } = await read('articles', {
			fields: ['id'],
			filter: { author: { directus_version: { type: { _eq: 'published' } } } },
		});

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      "published",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" left join "directus_shadow_authors" as "maoqz" on "directus_versioned_articles"."version_ref_author" = "maoqz"."version_id" where (("directus_versioned_articles"."author" is not null or ("directus_versioned_articles"."author" is null and "maoqz"."version_type" = ?))) limit ?",
			  },
			]
		`);
	});

	test('never matches live related items with version meta that only versions have', async () => {
		const { queries } = await read('articles', {
			fields: ['id'],
			filter: { author: { directus_version: { type: { _eq: 'draft' } } } },
		});

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      0,
			      "draft",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" left join "authors" as "jiqfw" on "directus_versioned_articles"."author" = "jiqfw"."id" left join "directus_shadow_authors" as "maoqz" on "directus_versioned_articles"."version_ref_author" = "maoqz"."version_id" where (((1 = ?) or ("directus_versioned_articles"."author" is null and "maoqz"."version_type" = ?))) limit ?",
			  },
			]
		`);
	});

	test("never matches version meta of related items in collections that aren't versioned", async () => {
		const { queries } = await read('articles', {
			fields: ['id'],
			filter: { category: { directus_version: { type: { _eq: 'draft' } } } },
		});

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      0,
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" left join "categories" as "wwbtm" on "directus_versioned_articles"."category" = "wwbtm"."id" where ((1 = ?)) limit ?",
			  },
			]
		`);
	});

	test('matches published version meta of related items in collections that aren\'t versioned', async () => {
		const { queries } = await read('articles', {
			fields: ['id'],
			filter: { category: { directus_version: { type: { _eq: 'published' } } } },
		});

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" where "directus_versioned_articles"."category" is not null limit ?",
			  },
			]
		`);
	});

	test('applies every condition on the related item', async () => {
		const { queries } = await read('articles', {
			fields: ['id'],
			filter: { category: { name: { _eq: 'News' }, id: { _gt: 1 } } },
		});

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      "News",
			      1,
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" left join "categories" as "ebrwj" on "directus_versioned_articles"."category" = "ebrwj"."id" where (("ebrwj"."name" = ? and "ebrwj"."id" > ?)) limit ?",
			  },
			]
		`);
	});

	test('combines field and version meta conditions on related items', async () => {
		const { queries } = await read('articles', {
			fields: ['id'],
			filter: { author: { name: { _eq: 'Jane' }, directus_version: { type: { _eq: 'draft' } } } },
		});

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      "Jane",
			      0,
			      "Jane",
			      "draft",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" left join "authors" as "tyjzk" on "directus_versioned_articles"."author" = "tyjzk"."id" left join "directus_shadow_authors" as "udhuy" on "directus_versioned_articles"."version_ref_author" = "udhuy"."version_id" where ((("tyjzk"."name" = ? and 1 = ?) or ("directus_versioned_articles"."author" is null and ("udhuy"."name" = ? and "udhuy"."version_type" = ?)))) limit ?",
			  },
			]
		`);
	});

	test('keeps operators directly on m2o fields', async () => {
		const { queries } = await read('articles', { fields: ['id'], filter: { author: { _null: true } } });

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" where "directus_versioned_articles"."author" is null limit ?",
			  },
			]
		`);
	});

	test('filters o2m relations on the live related items', async () => {
		const { queries } = await read('articles', {
			fields: ['id'],
			filter: { tags: { _some: { label: { _eq: 'news' } } } },
		});

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      "published",
			      "published",
			      "news",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" inner join (select distinct "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" left join "tags" as "rzthf" on "directus_versioned_articles"."directus_version_key" = "rzthf"."article" where "directus_versioned_articles"."directus_version_key" in (select "tags"."article" as "article" from "tags" where "tags"."article" is not null and "tags"."label" = ?) limit ?) as "inner" on "directus_versioned_articles"."directus_version_key" = "inner"."directus_version_key"",
			  },
			]
		`);
	});

	test('throws on unknown version meta', async () => {
		await expect(
			read('articles', { fields: ['id'], filter: { directus_version: { unknown: { _eq: 1 } } } }),
		).rejects.toThrow('"directus_version.unknown" doesn\'t exist');
	});

	test('throws on unsupported operators on version meta of live related items', async () => {
		await expect(
			read('articles', {
				fields: ['id'],
				filter: { author: { directus_version: { type: { _between: ['a', 'b'] } } } },
			}),
		).rejects.toThrow('Operator "_between" isn\'t supported');
	});
});

describe('sort', () => {
	test('maps version meta to the meta columns', async () => {
		const { queries } = await read('articles', {
			fields: ['id'],
			sort: ['-directus_version.date_created', 'title'],
		});

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" order by "directus_versioned_articles"."version_date_created" desc, "directus_versioned_articles"."title" asc limit ?",
			  },
			]
		`);
	});
});

describe('aggregate', () => {
	test('groups by version meta', async () => {
		const { queries } = await read('articles', {
			aggregate: { count: ['*'], countDistinct: ['directus_version.user_created'] },
			group: ['directus_version.type'],
		});

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      100,
			    ],
			    "sql": "select count(*) as "count", count(distinct "directus_versioned_articles"."version_user_created") as "countDistinct->version_user_created", "directus_versioned_articles"."version_type" from "directus_versioned_articles" group by "directus_versioned_articles"."version_type" limit ?",
			  },
			]
		`);
	});

	test('formats aggregated version meta like the query', async () => {
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
		const { db, queries } = setup({ responses: [['directus_versioned_articles', [{ count: 3 }]]] });

		const count = await countVersionedItems(
			'articles',
			{ filter: { directus_version: { type: { _eq: 'draft' } } } },
			{ knex: db, schema: schema as SchemaOverview, accountability: null },
		);

		expect(count).toBe(3);

		expect(queries()).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      "draft",
			      100,
			    ],
			    "sql": "select count(*) as "count" from "directus_versioned_articles" where "directus_versioned_articles"."version_type" = ? limit ?",
			  },
			]
		`);
	});
});

describe('version references', () => {
	test('reads referenced versions of m2o related items', async () => {
		const { items, queries } = await read(
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

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."author", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" limit ?",
			  },
			  {
			    "bindings": [
			      0,
			    ],
			    "sql": "select "authors"."name", "authors"."id" from "authors" where 1 = ?",
			  },
			  {
			    "bindings": [
			      7,
			    ],
			    "sql": "select "directus_versioned_authors"."name", "directus_versioned_authors"."id", "directus_versioned_authors"."version_id", "directus_versioned_authors"."version_name", "directus_versioned_authors"."version_type", "directus_versioned_authors"."version_date_created", "directus_versioned_authors"."version_date_updated", "directus_versioned_authors"."version_user_created", "directus_versioned_authors"."version_user_updated", "directus_versioned_authors"."directus_version_key" from "directus_versioned_authors" where "directus_versioned_authors"."version_id" in (?)",
			  },
			]
		`);

		expect(items[0]!['author']).toEqual({ name: 'Jane' });
	});

	test('reads live and versioned o2m related items of versions', async () => {
		const { items, queries } = await read(
			'articles',
			{ fields: ['id', 'tags.label'] },
			{
				responses: [
					['directus_versioned_articles', [{ id: 1, version_id: 3, version_type: 'draft', directus_version_key: -3 }]],
					['"directus_link_tags"', [{ id: 10, article: 3 }]],
					['"directus_versioned_tags"', [{ id: 10, label: 'live', directus_version_key: 10 }]],
					['"directus_shadow_tags"', [{ version_id: 12, version_ref_article: 3 }]],
					['"directus_versioned_tags"', [{ id: 11, label: 'draft', version_id: 12, directus_version_key: -12 }]],
				],
			},
		);

		expect(queries).toMatchInlineSnapshot(`
			[
			  {
			    "bindings": [
			      "published",
			      "published",
			      100,
			    ],
			    "sql": "select "directus_versioned_articles"."id", "directus_versioned_articles"."version_id", "directus_versioned_articles"."version_name", "directus_versioned_articles"."version_type", "directus_versioned_articles"."version_date_created", "directus_versioned_articles"."version_date_updated", "directus_versioned_articles"."version_user_created", "directus_versioned_articles"."version_user_updated", "directus_versioned_articles"."version_ref_author", "directus_versioned_articles"."directus_version_key" from "directus_versioned_articles" limit ?",
			  },
			  {
			    "bindings": [
			      1,
			      25000,
			    ],
			    "sql": "select "tags"."label", "tags"."article", "tags"."id" from "tags" where "tags"."article" in (?) order by "tags"."id" asc limit ?",
			  },
			  {
			    "bindings": [
			      3,
			    ],
			    "sql": "select "id", "article" from "directus_link_tags" where "article" in (?)",
			  },
			  {
			    "bindings": [
			      "published",
			      "published",
			      10,
			      "published",
			    ],
			    "sql": "select "directus_versioned_tags"."label", "directus_versioned_tags"."id", "directus_versioned_tags"."version_id", "directus_versioned_tags"."version_name", "directus_versioned_tags"."version_type", "directus_versioned_tags"."version_date_created", "directus_versioned_tags"."version_date_updated", "directus_versioned_tags"."version_user_created", "directus_versioned_tags"."version_user_updated", "directus_versioned_tags"."version_ref_article", "directus_versioned_tags"."directus_version_key" from "directus_versioned_tags" where ("directus_versioned_tags"."id" in (?) and "directus_versioned_tags"."version_type" = ?)",
			  },
			  {
			    "bindings": [
			      3,
			    ],
			    "sql": "select "version_id", "version_ref_article" from "directus_shadow_tags" where "version_ref_article" in (?)",
			  },
			  {
			    "bindings": [
			      12,
			    ],
			    "sql": "select "directus_versioned_tags"."label", "directus_versioned_tags"."id", "directus_versioned_tags"."version_id", "directus_versioned_tags"."version_name", "directus_versioned_tags"."version_type", "directus_versioned_tags"."version_date_created", "directus_versioned_tags"."version_date_updated", "directus_versioned_tags"."version_user_created", "directus_versioned_tags"."version_user_updated", "directus_versioned_tags"."version_ref_article", "directus_versioned_tags"."directus_version_key" from "directus_versioned_tags" where "directus_versioned_tags"."version_id" in (?)",
			  },
			]
		`);

		expect(items[0]!['tags']).toEqual([{ label: 'live' }, { label: 'draft' }]);
	});
});
