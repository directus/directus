import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getMemorySchemaCache, setMemorySchemaCache } from '../cache.js';
import { getSchema } from './get-schema.js';
import { runExclusive } from './run-exclusive.js';

vi.mock('@directus/env', async () => {
	const { mockUseEnv } = await import('../test-utils/env.js');

	return mockUseEnv({
		CACHE_SCHEMA: true,
		CACHE_SCHEMA_SYNC_TIMEOUT: 10000,
		DB_EXCLUDE_TABLES: [],
	});
});

vi.mock('./run-exclusive.js', () => ({ runExclusive: vi.fn() }));

vi.mock('../cache.js', () => ({
	getMemorySchemaCache: vi.fn(),
	setMemorySchemaCache: vi.fn(),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: () => ({ trace: vi.fn(), warn: vi.fn() }),
}));

const inspector = vi.hoisted(() => ({ overview: {} as Record<string, unknown>, relations: [] as unknown[] }));

vi.mock('@directus/schema', () => ({
	createInspector: () => ({ overview: async () => inspector.overview }),
}));

vi.mock('../services/relations.js', () => ({
	RelationsService: class {
		readAll = async () => inspector.relations;
	},
}));

const SCHEMA: SchemaOverview = {
	collections: {},
	relations: [],
	versioning: { collections: {}, relations: [] },
};

const rows = { collections: [] as Record<string, unknown>[] };

// The database helpers derive the dialect from the class name of the client
const database = {
	client: new (class Client_PG {})(),
	select: () => ({ from: async (table: string) => (table === 'directus_collections' ? rows.collections : []) }),
} as unknown as Knex;

afterEach(() => {
	vi.clearAllMocks();
	inspector.overview = {};
	inspector.relations = [];
	rows.collections = [];
});

describe('getSchema', () => {
	test('returns the cached schema without an exclusive run', async () => {
		vi.mocked(getMemorySchemaCache).mockReturnValueOnce(SCHEMA);

		await expect(getSchema()).resolves.toBe(SCHEMA);

		expect(runExclusive).not.toHaveBeenCalled();
		expect(setMemorySchemaCache).not.toHaveBeenCalled();
	});

	test('builds the schema in an exclusive run and caches it', async () => {
		vi.mocked(runExclusive).mockImplementation(async (_key, fn) => ({ result: await fn(), leader: true }));

		await expect(getSchema({ database })).resolves.toEqual(SCHEMA);

		expect(runExclusive).toHaveBeenCalledWith('schema-cache', expect.any(Function), { timeout: 10000 });
		expect(setMemorySchemaCache).toHaveBeenCalledExactlyOnceWith(SCHEMA);
	});

	test('caches the schema received from another leader', async () => {
		vi.mocked(runExclusive).mockResolvedValue({ result: SCHEMA, leader: false });

		await expect(getSchema()).resolves.toBe(SCHEMA);

		expect(setMemorySchemaCache).toHaveBeenCalledExactlyOnceWith(SCHEMA);
	});

	test('passes errors from the exclusive run through without retrying', async () => {
		vi.mocked(runExclusive).mockRejectedValue(new Error('connection refused'));

		await expect(getSchema()).rejects.toThrow('connection refused');

		expect(runExclusive).toHaveBeenCalledOnce();
		expect(setMemorySchemaCache).not.toHaveBeenCalled();
	});

	test('derives the version tables that exist from the live collections', async () => {
		vi.mocked(runExclusive).mockImplementation(async (_key, fn) => ({ result: await fn(), leader: true }));

		const column = (name: string) => ({ column_name: name, data_type: 'integer', is_nullable: true });

		inspector.overview = {
			articles: { primary: 'id', columns: { id: column('id'), author: column('author') } },
			authors: { primary: 'id', columns: { id: column('id') } },
			directus_shadow_articles: { primary: 'version_id', columns: { version_id: column('version_id') } },
		};

		inspector.relations = [
			{ collection: 'articles', field: 'author', related_collection: 'authors', schema: null, meta: null },
		];

		rows.collections = [
			{ collection: 'articles', versioning: true },
			{ collection: 'authors', versioning: true },
		];

		const schema = await getSchema({ database });

		expect(Object.keys(schema.collections)).toEqual(['articles', 'authors']);
		// The shadow table of authors isn't created yet
		expect(Object.keys(schema.versioning!.collections)).toEqual(['directus_shadow_articles']);

		expect(Object.keys(schema.versioning!.collections['directus_shadow_articles']!.fields)).toEqual(
			expect.arrayContaining(['version_id', 'id', 'author', 'version_ref_author']),
		);

		expect(schema.versioning!.relations).toContainEqual(
			expect.objectContaining({
				collection: 'directus_shadow_articles',
				field: 'version_ref_author',
				related_collection: 'directus_shadow_authors',
			}),
		);
	});

	test('marks collections with versioning enabled as versioned', async () => {
		vi.mocked(runExclusive).mockImplementation(async (_key, fn) => ({ result: await fn(), leader: true }));

		const table = { primary: 'id', columns: {} };

		inspector.overview = { articles: table, authors: table };
		rows.collections = [{ collection: 'articles', versioning: true }];

		const schema = await getSchema({ database });

		expect(schema.collections['articles']?.versioned).toBe(true);
		expect(schema.collections['authors']?.versioned).toBe(false);
	});
});
