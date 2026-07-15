import { ErrorCode, isDirectusError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import knex, { type Knex } from 'knex';
import { createTracker, MockClient, type Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, describe, expect, type MockedFunction, test, vi } from 'vitest';
import { getDatabaseClient } from '../database/index.js';
import { ItemsService } from './items.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('../utils/validate-user-count-integrity.js');

// Flat, non-accountability, uuid-PK collection (eligible for batch insert)
const schema = new SchemaBuilder()
	.collection('flat', (c) => {
		c.field('id').uuid().primary();
		c.field('name').string();
		c.field('status').string();
	})
	.options({ accountability: null })
	.build();

// Accountability-tracked collection (must NOT batch)
const trackedSchema = new SchemaBuilder()
	.collection('tracked', (c) => {
		c.field('id').uuid().primary();
		c.field('name').string();
	})
	.build();

// Collection with an o2m alias field (must NOT batch: needs createOne's processO2M)
const aliasSchema = new SchemaBuilder()
	.collection('with_alias', (c) => {
		c.field('id').uuid().primary();
		c.field('name').string();
		c.field('children').o2m('other', 'parent_id');
	})
	.options({ accountability: null })
	.build();

// Flat but integer auto-increment PK (must NOT batch: sequence-reset parity)
const intPkSchema = new SchemaBuilder()
	.collection('int_pk', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.options({ accountability: null })
	.build();

// uuid PK that isn't app-generated (no `uuid` special, e.g. a DB default) - must NOT batch, since the
// key wouldn't be on the prepared row without RETURNING.
const dbGeneratedUuidSchema = new SchemaBuilder()
	.collection('db_uuid', (c) => {
		c.field('id').uuid().primary();
		c.field('name').string();
	})
	.options({ accountability: null })
	.build();

dbGeneratedUuidSchema.collections['db_uuid']!.fields['id']!.special = [];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('ItemsService createMany batch insert', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(() => {
		db = vi.mocked(knex.default({ client: MockClient }));
		tracker = createTracker(db);
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
		vi.mocked(getDatabaseClient).mockReturnValue('postgres');
	});

	describe('canBatchCreate guard', () => {
		const svc = (collection: string, s = schema) => new ItemsService(collection, { knex: db, schema: s }) as any;

		test('true for >1 flat uuid-PK rows', () => {
			expect(svc('flat').canBatchCreate([{ name: 'a' }, { name: 'b' }], {})).toBe(true);
		});

		test('true regardless of database driver (dialect-agnostic)', () => {
			for (const driver of ['mysql', 'sqlite', 'mssql', 'oracle', 'cockroachdb']) {
				vi.mocked(getDatabaseClient).mockReturnValue(driver as any);
				expect(svc('flat').canBatchCreate([{ name: 'a' }, { name: 'b' }], {})).toBe(true);
			}
		});

		test('false for a single row', () => {
			expect(svc('flat').canBatchCreate([{ name: 'a' }], {})).toBe(false);
		});

		test('false when a primary key is provided', () => {
			expect(svc('flat').canBatchCreate([{ id: 'x', name: 'a' }, { name: 'b' }], {})).toBe(false);
		});

		test('false when overwriteDefaults is set', () => {
			expect(svc('flat').canBatchCreate([{ name: 'a' }, { name: 'b' }], { overwriteDefaults: [{}, {}] })).toBe(false);
		});

		test('false for a uuid PK that is not app-generated (no uuid special)', () => {
			expect(svc('db_uuid', dbGeneratedUuidSchema).canBatchCreate([{ name: 'a' }, { name: 'b' }], {})).toBe(false);
		});

		test('false on MSSQL above its multi-row INSERT limit (falls back to per-row)', () => {
			vi.mocked(getDatabaseClient).mockReturnValue('mssql');
			// `flat` has 3 columns; MSSQL cap = min(1000, floor(2100/3)) = 700.
			const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `n${i}` }));
			expect(svc('flat').canBatchCreate(rows(700), {})).toBe(true);
			expect(svc('flat').canBatchCreate(rows(701), {})).toBe(false);
		});

		test('false for accountability-tracked collections', () => {
			expect(svc('tracked', trackedSchema).canBatchCreate([{ name: 'a' }, { name: 'b' }], {})).toBe(false);
		});

		test('false for collections with alias (o2m) fields', () => {
			expect(svc('with_alias', aliasSchema).canBatchCreate([{ name: 'a' }, { name: 'b' }], {})).toBe(false);
		});

		test('false for non-uuid (auto-increment) primary keys', () => {
			expect(svc('int_pk', intPkSchema).canBatchCreate([{ name: 'a' }, { name: 'b' }], {})).toBe(false);
		});
	});

	describe('batch insert behaviour', () => {
		test('inserts all rows in a single statement and returns the generated keys in order', async () => {
			const inserts: any[] = [];

			tracker.on.insert('flat').response((query) => {
				inserts.push(query);
				return [];
			});

			const service = new ItemsService('flat', { knex: db, schema });
			const keys = await service.createMany([{ name: 'a' }, { name: 'b' }]);

			expect(inserts).toHaveLength(1); // one multi-row INSERT, not one per row
			expect(inserts[0].bindings).toEqual(expect.arrayContaining(['a', 'b']));

			// uuid PKs are generated app-side; the returned keys are those uuids in insertion order.
			expect(keys).toHaveLength(2);
			expect(keys.every((k) => UUID_RE.test(String(k)))).toBe(true);
			const uuidBindings = inserts[0].bindings.filter((b: unknown) => typeof b === 'string' && UUID_RE.test(b));
			expect(uuidBindings).toEqual(keys);
		});

		test('handles rows with different key sets in a single insert', async () => {
			const inserts: any[] = [];

			tracker.on.insert('flat').response((query) => {
				inserts.push(query);
				return [];
			});

			const service = new ItemsService('flat', { knex: db, schema });
			// second row omits `status` — DB default should apply, still one statement
			const keys = await service.createMany([{ name: 'a', status: 'x' }, { name: 'b' }]);

			expect(inserts).toHaveLength(1);
			expect(keys).toHaveLength(2);
			expect(keys.every((k) => UUID_RE.test(String(k)))).toBe(true);
		});

		test('translates DB constraint violations on the batch path (savepoint rollback + replay)', async () => {
			// Postgres unique-violation shape that translateDatabaseError recognizes.
			const dupError: any = new Error('duplicate key value violates unique constraint');
			dupError.code = '23505';
			dupError.table = 'flat';
			dupError.detail = 'Key (name)=(a) already exists.';
			tracker.on.insert('flat').simulateError(dupError);

			const service = new ItemsService('flat', { knex: db, schema });

			let thrown: unknown;

			try {
				await service.createMany([{ name: 'a' }, { name: 'b' }]);
			} catch (err) {
				thrown = err;
			}

			// Same typed error the per-row path would throw, not a raw DB error.
			expect(isDirectusError(thrown, ErrorCode.RecordNotUnique)).toBe(true);
		});

		test('falls back to per-row inserts when the collection is not eligible', async () => {
			let n = 0;
			const inserts: any[] = [];

			tracker.on.insert('tracked').response((query) => {
				inserts.push(query);
				return [{ id: `id${++n}` }];
			});

			const service = new ItemsService('tracked', { knex: db, schema: trackedSchema });
			await service.createMany([{ name: 'a' }, { name: 'b' }]);

			expect(inserts).toHaveLength(2); // one INSERT per row
		});
	});
});
