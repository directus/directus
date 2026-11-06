import type { Column, ForeignKey } from '@directus/schema';
import { SchemaBuilder } from '@directus/schema-builder';
import type { RelationMeta } from '@directus/types';
import { describe, expect, test, vi } from 'vitest';
import { createMockDialectKnex, formatSql } from '../test-utils/knex.js';
import { VersionTablesService } from './version-tables.js';

const inspector = vi.hoisted(() => ({
	/** Tables that were introspected, `*` for the whole database */
	introspected: [] as string[],
	tables: [] as string[],
	columns: [] as Column[],
	foreignKeys: [] as ForeignKey[],
}));

vi.mock('@directus/schema', async (importOriginal) => ({
	...(await importOriginal<typeof import('@directus/schema')>()),
	createInspector: () => ({
		tables: async () => inspector.tables,
		columnInfo: async (table?: string) => {
			inspector.introspected.push(table ?? '*');
			return table ? inspector.columns.filter((column) => column.table === table) : inspector.columns;
		},
		foreignKeys: async (table?: string) =>
			table ? inspector.foreignKeys.filter((foreignKey) => foreignKey.table === table) : inspector.foreignKeys,
	}),
}));

vi.mock('../cache.js', async () => {
	const { mockCache } = await import('../test-utils/cache.js');
	return mockCache();
});

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('authors');
	})
	.collection('authors', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.build();

function column(table: string, name: string, data_type = 'integer', overrides: Partial<Column> = {}): Column {
	return {
		table,
		name,
		data_type,
		max_length: data_type === 'varchar' ? 255 : null,
		numeric_precision: null,
		numeric_scale: null,
		is_primary_key: name === 'id',
		...overrides,
	} as Column;
}

const LIVE_COLUMNS = [
	column('articles', 'id'),
	column('articles', 'title', 'varchar'),
	column('articles', 'author'),
	column('authors', 'id'),
	column('authors', 'name', 'varchar'),
];

/** Version columns of a shadow table as they exist after it was created */
function metaColumns(table: string) {
	return [
		column(table, 'version_id'),
		column(table, 'version_name', 'varchar'),
		column(table, 'version_type', 'varchar', { max_length: 16 }),
		column(table, 'version_date_created', 'timestamp with time zone'),
		column(table, 'version_date_updated', 'timestamp with time zone'),
		column(table, 'version_user_created', 'uuid'),
		column(table, 'version_user_updated', 'uuid'),
	];
}

function foreignKey(
	table: string,
	column: string,
	foreign_key_table: string,
	on_delete: ForeignKey['on_delete'],
): ForeignKey {
	return {
		table,
		column,
		foreign_key_table,
		foreign_key_column: foreign_key_table === 'directus_shadow_authors' ? 'version_id' : 'id',
		constraint_name: `${table}_${column}_foreign`,
		on_update: 'NO ACTION',
		on_delete,
	};
}

/** Version tables of articles, with authors not being versioned */
const ARTICLES_SHADOW = {
	tables: ['directus_shadow_articles'],
	columns: [
		...metaColumns('directus_shadow_articles'),
		column('directus_shadow_articles', 'id'),
		column('directus_shadow_articles', 'title', 'varchar'),
		column('directus_shadow_articles', 'author'),
	],
	foreignKeys: [
		foreignKey('directus_shadow_articles', 'version_user_created', 'directus_users', 'SET NULL'),
		foreignKey('directus_shadow_articles', 'version_user_updated', 'directus_users', 'SET NULL'),
		foreignKey('directus_shadow_articles', 'author', 'authors', 'SET NULL'),
	],
};

type Options = {
	client?: Parameters<typeof createMockDialectKnex>[0];
	/** Collections with versioning enabled */
	versioned?: string[];
	/** Version tables that already exist */
	existing?: { tables: string[]; columns: Column[]; foreignKeys: ForeignKey[] };
	/** Columns of the live tables, defaults to the ones matching the schema */
	live?: Column[];
	/** Foreign keys of the live tables, defaults to the ones matching the schema */
	liveForeignKeys?: ForeignKey[];
	/** Rows of `directus_relations` */
	relations?: Partial<RelationMeta>[];
	/** Method of the service to run, defaults to a full sync */
	run?: (service: VersionTablesService) => Promise<void>;
};

/** The m2o from articles to authors, as it exists on the live table */
const LIVE_FOREIGN_KEYS = [foreignKey('articles', 'author', 'authors', 'SET NULL')];

async function sync(options: Options = {}) {
	const { db, tracker, language } = createMockDialectKnex(options.client ?? 'postgres');

	tracker.on.select('directus_collections').response((options.versioned ?? []).map((collection) => ({ collection })));
	tracker.on.select('directus_relations').response(options.relations ?? []);

	// SQLite alters tables by recreating them from their current definition, which is the last one created by the sync
	tracker.on
		.any((query) => query.sql.includes('sqlite_master'))
		.response((query) => {
			const table = /tbl_name\)='(\w+)'/.exec(query.sql)![1]!;

			const create = tracker.history.all
				.filter((statement) => statement.sql.replaceAll('`', '"').startsWith(`create table "${table}"`))
				.at(-1);

			return create ? [{ type: 'table', sql: create.sql }] : [];
		});

	tracker.on.any((query) => query.sql === 'PRAGMA foreign_keys').response([{ foreign_keys: 1 }]);

	tracker.on.any(() => true).response([]);

	const existing = options.existing ?? { tables: [], columns: [], foreignKeys: [] };

	inspector.introspected = [];
	inspector.tables = ['articles', 'authors', ...existing.tables];
	inspector.columns = [...(options.live ?? LIVE_COLUMNS), ...existing.columns];
	inspector.foreignKeys = [...(options.liveForeignKeys ?? LIVE_FOREIGN_KEYS), ...existing.foreignKeys];

	const service = new VersionTablesService({ knex: db, schema });

	await (options.run ?? ((service) => service.syncCollections('all')))(service);

	// Only the statements changing the schema, the reads of the versioning settings and relations are the same for every sync
	const statements = tracker.history.all.filter(
		(query) =>
			!query.sql.includes('directus_collections') &&
			!query.sql.includes('directus_relations') &&
			!query.sql.includes('sqlite_master'),
	);

	return {
		sql: statements
			.map((query) => formatSql(query.sql.replace(/_knex_temp_alter\d+/g, '_knex_temp_alter'), language))
			.join(';\n\n'),
		bindings: statements.map((query) => query.bindings),
		introspected: [...new Set(inspector.introspected)],
	};
}

describe('VersionTablesService.syncCollections', () => {
	test('does nothing when no collection is versioned and no version tables exist', async () => {
		const { sql } = await sync();

		expect(sql).toBe('');
	});

	test('creates a shadow table with the foreign keys of the live table', async () => {
		const { sql, bindings } = await sync({ versioned: ['articles'] });

		expect(sql).toMatchInlineSnapshot(`
			"create table "directus_shadow_articles" (
			  "version_id" serial primary key,
			  "version_name" varchar(255) null,
			  "version_type" varchar(16) not null default 'draft',
			  "version_date_created" timestamptz default CURRENT_TIMESTAMP,
			  "version_date_updated" timestamptz null,
			  "version_user_created" uuid null,
			  "version_user_updated" uuid null,
			  "id" integer null default null,
			  "title" varchar(255) null default null,
			  "author" integer null default null
			);

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_version_user_created_foreign" foreign key ("version_user_created") references "directus_users" ("id") on delete SET NULL;

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_version_user_updated_foreign" foreign key ("version_user_updated") references "directus_users" ("id") on delete SET NULL;

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_author_foreign" foreign key ("author") references "authors" ("id") on delete SET NULL"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [],
			  [],
			  [],
			  [],
			]
		`);
	});

	test('creates link tables and version references for related versioned collections', async () => {
		const { sql, bindings } = await sync({ versioned: ['articles', 'authors'] });

		expect(sql).toMatchInlineSnapshot(`
			"create table "directus_shadow_articles" (
			  "version_id" serial primary key,
			  "version_name" varchar(255) null,
			  "version_type" varchar(16) not null default 'draft',
			  "version_date_created" timestamptz default CURRENT_TIMESTAMP,
			  "version_date_updated" timestamptz null,
			  "version_user_created" uuid null,
			  "version_user_updated" uuid null,
			  "id" integer null default null,
			  "title" varchar(255) null default null,
			  "author" integer null default null,
			  "version_ref_author" integer null
			);

			create table "directus_shadow_authors" (
			  "version_id" serial primary key,
			  "version_name" varchar(255) null,
			  "version_type" varchar(16) not null default 'draft',
			  "version_date_created" timestamptz default CURRENT_TIMESTAMP,
			  "version_date_updated" timestamptz null,
			  "version_user_created" uuid null,
			  "version_user_updated" uuid null,
			  "id" integer null default null,
			  "name" varchar(255) null default null
			);

			create table "directus_link_articles" (
			  "id" integer not null default null,
			  "author" integer null,
			  constraint "directus_link_articles_pkey" primary key ("id")
			);

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_version_user_created_foreign" foreign key ("version_user_created") references "directus_users" ("id") on delete SET NULL;

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_version_user_updated_foreign" foreign key ("version_user_updated") references "directus_users" ("id") on delete SET NULL;

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_author_foreign" foreign key ("author") references "authors" ("id") on delete SET NULL;

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_version_ref_author_foreign" foreign key ("version_ref_author") references "directus_shadow_authors" ("version_id") on delete SET NULL;

			alter table "directus_shadow_authors"
			add constraint "directus_shadow_authors_version_user_created_foreign" foreign key ("version_user_created") references "directus_users" ("id") on delete SET NULL;

			alter table "directus_shadow_authors"
			add constraint "directus_shadow_authors_version_user_updated_foreign" foreign key ("version_user_updated") references "directus_users" ("id") on delete SET NULL;

			alter table "directus_link_articles"
			add constraint "directus_link_articles_id_foreign" foreign key ("id") references "articles" ("id") on delete CASCADE;

			alter table "directus_link_articles"
			add constraint "directus_link_articles_author_foreign" foreign key ("author") references "directus_shadow_authors" ("version_id") on delete SET NULL"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [],
			  [],
			  [],
			  [],
			  [],
			  [],
			  [],
			  [],
			  [],
			  [],
			  [],
			]
		`);
	});

	test('does nothing when the version tables are up to date', async () => {
		const { sql } = await sync({ versioned: ['articles'], existing: ARTICLES_SHADOW });

		expect(sql).toBe('');
	});

	test('drops the foreign keys and version tables when versioning is disabled', async () => {
		const { sql, bindings } = await sync({ versioned: [], existing: ARTICLES_SHADOW });

		expect(sql).toMatchInlineSnapshot(`
			"alter table "directus_shadow_articles"
			drop constraint "directus_shadow_articles_version_user_created_foreign";

			alter table "directus_shadow_articles"
			drop constraint "directus_shadow_articles_version_user_updated_foreign";

			alter table "directus_shadow_articles"
			drop constraint "directus_shadow_articles_author_foreign";

			drop table "directus_shadow_articles""
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [],
			  [],
			  [],
			  [],
			]
		`);
	});

	test('adds, alters and drops mirrored columns to match the live table', async () => {
		const { sql, bindings } = await sync({
			versioned: ['articles'],
			existing: {
				...ARTICLES_SHADOW,
				columns: [
					...ARTICLES_SHADOW.columns.filter((column) => column.name !== 'author'),
					column('directus_shadow_articles', 'removed', 'varchar'),
				],
				foreignKeys: ARTICLES_SHADOW.foreignKeys.filter((foreignKey) => foreignKey.column !== 'author'),
			},
			live: LIVE_COLUMNS.map((live) =>
				live.table === 'articles' && live.name === 'title' ? { ...live, max_length: 500 } : live,
			),
		});

		expect(sql).toMatchInlineSnapshot(`
			"alter table "directus_shadow_articles"
			add column "author" integer null default null;

			alter table "directus_shadow_articles"
			alter column "title"
			drop default;

			alter table "directus_shadow_articles"
			alter column "title"
			drop not null;

			alter table "directus_shadow_articles"
			alter column "title" type varchar(500) using ("title"::varchar(500));

			alter table "directus_shadow_articles"
			alter column "title"
			set default null;

			alter table "directus_shadow_articles"
			drop column "removed";

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_author_foreign" foreign key ("author") references "authors" ("id") on delete SET NULL"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [],
			  [],
			  [],
			  [],
			  [],
			  [],
			  [],
			]
		`);
	});

	test('recreates foreign keys whose on delete action changed', async () => {
		const { sql, bindings } = await sync({
			versioned: ['articles'],
			existing: {
				...ARTICLES_SHADOW,
				foreignKeys: ARTICLES_SHADOW.foreignKeys.map((foreignKey) =>
					foreignKey.column === 'author' ? { ...foreignKey, on_delete: 'CASCADE' } : foreignKey,
				),
			},
		});

		expect(sql).toMatchInlineSnapshot(`
			"alter table "directus_shadow_articles"
			drop constraint "directus_shadow_articles_author_foreign";

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_author_foreign" foreign key ("author") references "authors" ("id") on delete SET NULL"
		`);

		expect(bindings).toMatchInlineSnapshot(`
			[
			  [],
			  [],
			]
		`);
	});

	test('treats the default on delete actions of all vendors as the same', async () => {
		const { sql } = await sync({
			versioned: ['articles'],
			existing: {
				...ARTICLES_SHADOW,
				foreignKeys: ARTICLES_SHADOW.foreignKeys.map((foreignKey) => ({
					...foreignKey,
					on_delete: foreignKey.column === 'author' ? 'SET NULL' : foreignKey.on_delete,
				})),
			},
		});

		expect(sql).toBe('');
	});
});

describe('scoped changes', () => {
	/** Shadow table of articles that is missing the title column */
	const OUTDATED_ARTICLES_SHADOW = {
		...ARTICLES_SHADOW,
		columns: ARTICLES_SHADOW.columns.filter((column) => column.name !== 'title'),
	};

	test('only introspects the tables of the changed collection', async () => {
		const { sql, introspected } = await sync({
			versioned: ['articles'],
			existing: OUTDATED_ARTICLES_SHADOW,
			run: (service) => service.syncCollections(['authors']),
		});

		// The outdated shadow table of articles is left alone, as it isn't affected by a change to authors
		expect(sql).toBe('');

		expect(introspected).toEqual(['directus_shadow_authors', 'directus_link_authors', 'authors']);
	});

	test('does not read the live table when nothing is versioned', async () => {
		const { introspected } = await sync({ run: (service) => service.syncCollections(['articles']) });

		expect(introspected).toEqual(['directus_shadow_articles', 'directus_link_articles']);
	});

	test('adds a new field to the shadow table', async () => {
		const { sql } = await sync({
			versioned: ['articles'],
			existing: OUTDATED_ARTICLES_SHADOW,
			run: (service) => service.syncCollections(['articles']),
		});

		expect(sql).toMatchInlineSnapshot(`
			"alter table "directus_shadow_articles"
			add column "title" varchar(255) null default null"
		`);
	});

	test('enabling versioning updates the version tables of relating collections', async () => {
		const { sql, introspected } = await sync({
			versioned: ['articles', 'authors'],
			existing: ARTICLES_SHADOW,
			run: (service) => service.syncCollections(['authors'], { includeRelating: true }),
		});

		expect(introspected).toEqual([
			'directus_shadow_authors',
			'directus_link_authors',
			'directus_shadow_articles',
			'directus_link_articles',
			'authors',
			'articles',
		]);

		expect(sql).toMatchInlineSnapshot(`
			"create table "directus_shadow_authors" (
			  "version_id" serial primary key,
			  "version_name" varchar(255) null,
			  "version_type" varchar(16) not null default 'draft',
			  "version_date_created" timestamptz default CURRENT_TIMESTAMP,
			  "version_date_updated" timestamptz null,
			  "version_user_created" uuid null,
			  "version_user_updated" uuid null,
			  "id" integer null default null,
			  "name" varchar(255) null default null
			);

			create table "directus_link_articles" (
			  "id" integer not null default null,
			  "author" integer null,
			  constraint "directus_link_articles_pkey" primary key ("id")
			);

			alter table "directus_shadow_articles"
			add column "version_ref_author" integer null;

			alter table "directus_shadow_authors"
			add constraint "directus_shadow_authors_version_user_created_foreign" foreign key ("version_user_created") references "directus_users" ("id") on delete SET NULL;

			alter table "directus_shadow_authors"
			add constraint "directus_shadow_authors_version_user_updated_foreign" foreign key ("version_user_updated") references "directus_users" ("id") on delete SET NULL;

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_version_ref_author_foreign" foreign key ("version_ref_author") references "directus_shadow_authors" ("version_id") on delete SET NULL;

			alter table "directus_link_articles"
			add constraint "directus_link_articles_id_foreign" foreign key ("id") references "articles" ("id") on delete CASCADE;

			alter table "directus_link_articles"
			add constraint "directus_link_articles_author_foreign" foreign key ("author") references "directus_shadow_authors" ("version_id") on delete SET NULL"
		`);
	});

	test('includes relating collections that are only known from the relation meta', async () => {
		const { introspected } = await sync({
			versioned: ['authors'],
			liveForeignKeys: [],
			relations: [
				{ many_collection: 'comments', many_field: 'item', one_allowed_collections: 'articles,authors' as any },
			],
			run: (service) => service.syncCollections(['authors'], { includeRelating: true }),
		});

		expect(introspected).toContain('comments');
	});

	test('deleting a collection drops the references to it from relating collections', async () => {
		const { sql } = await sync({
			versioned: ['articles'],
			existing: ARTICLES_SHADOW,
			run: (service) => service.syncCollections(['authors'], { includeRelating: true, exclude: ['authors'] }),
		});

		expect(sql).toMatchInlineSnapshot(`
			"alter table "directus_shadow_articles"
			drop constraint "directus_shadow_articles_author_foreign""
		`);
	});

	test('removing a relation drops its foreign key from the shadow table', async () => {
		const { sql } = await sync({
			versioned: ['articles'],
			existing: ARTICLES_SHADOW,
			liveForeignKeys: [],
			run: (service) => service.syncCollections(['articles']),
		});

		expect(sql).toMatchInlineSnapshot(`
			"alter table "directus_shadow_articles"
			drop constraint "directus_shadow_articles_author_foreign""
		`);
	});
});

describe('dialects', () => {
	test('mysql', async () => {
		const { sql } = await sync({ client: 'mysql', versioned: ['articles'] });

		expect(sql).toMatchInlineSnapshot(`
			"create table \`directus_shadow_articles\` (
			  \`version_id\` int unsigned not null auto_increment primary key,
			  \`version_name\` varchar(255) null,
			  \`version_type\` varchar(16) not null default 'draft',
			  \`version_date_created\` timestamp default CURRENT_TIMESTAMP,
			  \`version_date_updated\` timestamp null,
			  \`version_user_created\` char(36) null,
			  \`version_user_updated\` char(36) null,
			  \`id\` int null,
			  \`title\` varchar(255) null,
			  \`author\` int null
			);

			alter table \`directus_shadow_articles\`
			add constraint \`directus_shadow_articles_version_user_created_foreign\` foreign key (\`version_user_created\`) references \`directus_users\` (\`id\`) on delete SET NULL;

			alter table \`directus_shadow_articles\`
			add constraint \`directus_shadow_articles_version_user_updated_foreign\` foreign key (\`version_user_updated\`) references \`directus_users\` (\`id\`) on delete SET NULL;

			alter table \`directus_shadow_articles\`
			add constraint \`directus_shadow_articles_author_foreign\` foreign key (\`author\`) references \`authors\` (\`id\`) on delete SET NULL"
		`);
	});

	// MySQL doesn't accept foreign keys between signed and unsigned integers, keys created by Directus are unsigned
	const UNSIGNED_COLUMNS = LIVE_COLUMNS.map((live) =>
		live.data_type === 'integer' ? { ...live, data_type: 'int unsigned' } : live,
	);

	test('keeps unsigned integers on mysql, so foreign keys to unsigned keys can be added', async () => {
		const { sql } = await sync({ client: 'mysql', versioned: ['articles'], live: UNSIGNED_COLUMNS });

		expect(sql).toMatchInlineSnapshot(`
			"create table \`directus_shadow_articles\` (
			  \`version_id\` int unsigned not null auto_increment primary key,
			  \`version_name\` varchar(255) null,
			  \`version_type\` varchar(16) not null default 'draft',
			  \`version_date_created\` timestamp default CURRENT_TIMESTAMP,
			  \`version_date_updated\` timestamp null,
			  \`version_user_created\` char(36) null,
			  \`version_user_updated\` char(36) null,
			  \`id\` int unsigned null,
			  \`title\` varchar(255) null,
			  \`author\` int unsigned null
			);

			alter table \`directus_shadow_articles\`
			add constraint \`directus_shadow_articles_version_user_created_foreign\` foreign key (\`version_user_created\`) references \`directus_users\` (\`id\`) on delete SET NULL;

			alter table \`directus_shadow_articles\`
			add constraint \`directus_shadow_articles_version_user_updated_foreign\` foreign key (\`version_user_updated\`) references \`directus_users\` (\`id\`) on delete SET NULL;

			alter table \`directus_shadow_articles\`
			add constraint \`directus_shadow_articles_author_foreign\` foreign key (\`author\`) references \`authors\` (\`id\`) on delete SET NULL"
		`);
	});

	test('alters signed mirrors of unsigned integers on mysql', async () => {
		const { sql } = await sync({
			client: 'mysql',
			versioned: ['articles'],
			live: UNSIGNED_COLUMNS,
			existing: {
				...ARTICLES_SHADOW,
				columns: ARTICLES_SHADOW.columns.map((column) =>
					column.data_type === 'integer' ? { ...column, data_type: 'int' } : column,
				),
				foreignKeys: ARTICLES_SHADOW.foreignKeys.filter((foreignKey) => foreignKey.column !== 'author'),
			},
		});

		expect(sql).toMatchInlineSnapshot(`
			"alter table \`directus_shadow_articles\`
			modify \`id\` int unsigned null,
			modify \`author\` int unsigned null;

			alter table \`directus_shadow_articles\`
			add constraint \`directus_shadow_articles_author_foreign\` foreign key (\`author\`) references \`authors\` (\`id\`) on delete SET NULL"
		`);
	});

	test('mssql', async () => {
		const { sql } = await sync({ client: 'mssql', versioned: ['articles'] });

		expect(sql).toMatchInlineSnapshot(`
			"CREATE TABLE [directus_shadow_articles] (
			  [version_id] int identity(1, 1) not null primary key,
			  [version_name] nvarchar(255) null,
			  [version_type] nvarchar(16) not null CONSTRAINT [directus_shadow_articles_version_type_default] DEFAULT 'draft',
			  [version_date_created] datetimeoffset CONSTRAINT [directus_shadow_articles_version_date_created_default] DEFAULT CURRENT_TIMESTAMP,
			  [version_date_updated] datetimeoffset null,
			  [version_user_created] uniqueidentifier null,
			  [version_user_updated] uniqueidentifier null,
			  [id] int null CONSTRAINT [directus_shadow_articles_id_default] DEFAULT null,
			  [title] nvarchar(255) null CONSTRAINT [directus_shadow_articles_title_default] DEFAULT null,
			  [author] int null CONSTRAINT [directus_shadow_articles_author_default] DEFAULT null
			);

			ALTER TABLE [directus_shadow_articles]
			ADD CONSTRAINT [directus_shadow_articles_version_user_created_foreign] FOREIGN KEY ([version_user_created]) REFERENCES [directus_users] ([id]) ON DELETE SET NULL;

			ALTER TABLE [directus_shadow_articles]
			ADD CONSTRAINT [directus_shadow_articles_version_user_updated_foreign] FOREIGN KEY ([version_user_updated]) REFERENCES [directus_users] ([id]);

			ALTER TABLE [directus_shadow_articles]
			ADD CONSTRAINT [directus_shadow_articles_author_foreign] FOREIGN KEY ([author]) REFERENCES [authors] ([id]) ON DELETE SET NULL"
		`);
	});

	test('sqlite', async () => {
		const { sql } = await sync({ client: 'sqlite', versioned: ['articles'] });

		expect(sql).toMatchInlineSnapshot(`
			"create table \`directus_shadow_articles\` (
			  \`version_id\` integer not null primary key autoincrement,
			  \`version_name\` varchar(255) null,
			  \`version_type\` varchar(16) not null default 'draft',
			  \`version_date_created\` datetime default CURRENT_TIMESTAMP,
			  \`version_date_updated\` datetime null,
			  \`version_user_created\` char(36) null,
			  \`version_user_updated\` char(36) null,
			  \`id\` integer null default null,
			  \`title\` varchar(255) null default null,
			  \`author\` integer null default null
			);

			PRAGMA foreign_keys;

			PRAGMA foreign_keys = OFF;

			CREATE TABLE \`_knex_temp_alter\` (
			  \`version_id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			  \`version_name\` varchar(255) NULL,
			  \`version_type\` varchar(16) NOT NULL DEFAULT 'draft',
			  \`version_date_created\` datetime DEFAULT CURRENT_TIMESTAMP,
			  \`version_date_updated\` datetime NULL,
			  \`version_user_created\` char(36) NULL,
			  \`version_user_updated\` char(36) NULL,
			  \`id\` integer NULL DEFAULT null,
			  \`title\` varchar(255) NULL DEFAULT null,
			  \`author\` integer NULL DEFAULT null,
			  CONSTRAINT \`directus_shadow_articles_version_user_created_foreign\` FOREIGN KEY (\`version_user_created\`) REFERENCES \`directus_users\` (\`id\`) ON DELETE SET NULL
			);

			INSERT INTO
			  "_knex_temp_alter"
			SELECT
			  *
			FROM
			  "directus_shadow_articles";;

			DROP TABLE "directus_shadow_articles";

			ALTER TABLE "_knex_temp_alter"
			RENAME TO "directus_shadow_articles";

			PRAGMA foreign_key_check;

			PRAGMA foreign_keys = ON;

			PRAGMA foreign_keys;

			PRAGMA foreign_keys = OFF;

			CREATE TABLE \`_knex_temp_alter\` (
			  \`version_id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			  \`version_name\` varchar(255) NULL,
			  \`version_type\` varchar(16) NOT NULL DEFAULT 'draft',
			  \`version_date_created\` datetime DEFAULT CURRENT_TIMESTAMP,
			  \`version_date_updated\` datetime NULL,
			  \`version_user_created\` char(36) NULL,
			  \`version_user_updated\` char(36) NULL,
			  \`id\` integer NULL DEFAULT null,
			  \`title\` varchar(255) NULL DEFAULT null,
			  \`author\` integer NULL DEFAULT null,
			  CONSTRAINT \`directus_shadow_articles_version_user_updated_foreign\` FOREIGN KEY (\`version_user_updated\`) REFERENCES \`directus_users\` (\`id\`) ON DELETE SET NULL
			);

			INSERT INTO
			  "_knex_temp_alter"
			SELECT
			  *
			FROM
			  "directus_shadow_articles";;

			DROP TABLE "directus_shadow_articles";

			ALTER TABLE "_knex_temp_alter"
			RENAME TO "directus_shadow_articles";

			PRAGMA foreign_key_check;

			PRAGMA foreign_keys = ON;

			PRAGMA foreign_keys;

			PRAGMA foreign_keys = OFF;

			CREATE TABLE \`_knex_temp_alter\` (
			  \`version_id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			  \`version_name\` varchar(255) NULL,
			  \`version_type\` varchar(16) NOT NULL DEFAULT 'draft',
			  \`version_date_created\` datetime DEFAULT CURRENT_TIMESTAMP,
			  \`version_date_updated\` datetime NULL,
			  \`version_user_created\` char(36) NULL,
			  \`version_user_updated\` char(36) NULL,
			  \`id\` integer NULL DEFAULT null,
			  \`title\` varchar(255) NULL DEFAULT null,
			  \`author\` integer NULL DEFAULT null,
			  CONSTRAINT \`directus_shadow_articles_author_foreign\` FOREIGN KEY (\`author\`) REFERENCES \`authors\` (\`id\`) ON DELETE SET NULL
			);

			INSERT INTO
			  "_knex_temp_alter"
			SELECT
			  *
			FROM
			  "directus_shadow_articles";;

			DROP TABLE "directus_shadow_articles";

			ALTER TABLE "_knex_temp_alter"
			RENAME TO "directus_shadow_articles";

			PRAGMA foreign_key_check;

			PRAGMA foreign_keys = ON"
		`);
	});

	test('oracle', async () => {
		const { sql } = await sync({ client: 'oracle', versioned: ['articles'] });

		expect(sql).toMatchInlineSnapshot(`
			"create table "directus_shadow_articles" (
			  "version_id" integer not null primary key,
			  "version_name" varchar2(255) null,
			  "version_type" varchar2(16) default 'draft' not null,
			  "version_date_created" timestamp
			  with
			    local time zone default CURRENT_TIMESTAMP,
			    "version_date_updated" timestamp
			  with
			    local time zone null,
			    "version_user_created" char(36) null,
			    "version_user_updated" char(36) null,
			    "id" integer default null null,
			    "title" varchar2(255) default null null,
			    "author" integer default null null
			);

			DECLARE PK_NAME VARCHAR(200);

			BEGIN EXECUTE IMMEDIATE ('CREATE SEQUENCE "directus_shadow_articles_seq"');

			SELECT
			  cols.column_name INTO PK_NAME
			FROM
			  all_constraints cons,
			  all_cons_columns cols
			WHERE
			  cons.constraint_type = 'P'
			  AND cons.constraint_name = cols.constraint_name
			  AND cons.owner = cols.owner
			  AND cols.table_name = 'directus_shadow_articles';

			execute immediate (
			  'create or replace trigger "directus_shadow_articles_autoinc_trg"  BEFORE INSERT on "directus_shadow_articles"  for each row  declare  checking number := 1;  begin    if (:new."' || PK_NAME || '" is null) then      while checking >= 1 loop        select "directus_shadow_articles_seq".nextval into :new."' || PK_NAME || '" from dual;        select count("' || PK_NAME || '") into checking from "directus_shadow_articles"        where "' || PK_NAME || '" = :new."' || PK_NAME || '";      end loop;    end if;  end;'
			);

			END;;

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_version_user_created_foreign" foreign key ("version_user_created") references "directus_users" ("id") on delete SET NULL;

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_version_user_updated_foreign" foreign key ("version_user_updated") references "directus_users" ("id") on delete SET NULL;

			alter table "directus_shadow_articles"
			add constraint "directus_shadow_articles_author_foreign" foreign key ("author") references "authors" ("id") on delete SET NULL"
		`);
	});
});
