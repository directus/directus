import { ErrorCode, isDirectusError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import { UserIntegrityCheckFlag } from '@directus/types';
import knex, { type Knex } from 'knex';
import { createTracker, MockClient, type Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, describe, expect, type MockedFunction, test, vi } from 'vitest';
import { getDatabaseClient } from '../database/index.js';
import emitter from '../emitter.js';
import { validateUserCountIntegrity } from '../utils/validate-user-count-integrity.js';
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

		test('false when preMutationError is set', () => {
			expect(svc('flat').canBatchCreate([{ name: 'a' }, { name: 'b' }], { preMutationError: new Error('x') })).toBe(
				false,
			);
		});

		test('false for heterogeneous key sets across rows', () => {
			// row 2 omits `status`: a multi-row insert would NULL-fill it, unlike the per-row DB default.
			expect(svc('flat').canBatchCreate([{ name: 'a', status: 'x' }, { name: 'b' }], {})).toBe(false);
		});

		test('false when a create filter hook is registered (would run per-row in the loop)', () => {
			const hook = () => undefined;
			emitter.onFilter('items.create', hook);

			try {
				expect(svc('flat').canBatchCreate([{ name: 'a' }, { name: 'b' }], {})).toBe(false);
			} finally {
				emitter.offFilter('items.create', hook);
			}

			// once removed, eligible again
			expect(svc('flat').canBatchCreate([{ name: 'a' }, { name: 'b' }], {})).toBe(true);
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

		test('false for ItemsService subclasses (would skip their createOne override)', () => {
			class SubService extends ItemsService {}

			const sub = new SubService('flat', { knex: db, schema }) as any;
			expect(sub.canBatchCreate([{ name: 'a' }, { name: 'b' }], {})).toBe(false);
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

		test('falls back to per-row inserts for heterogeneous key sets (preserves DB defaults)', async () => {
			const inserts: any[] = [];

			tracker.on.insert('flat').response((query) => {
				inserts.push(query);
				return [];
			});

			const service = new ItemsService('flat', { knex: db, schema });
			// row 2 omits `status`; batching would NULL-fill it, so this must use the per-row path.
			const keys = await service.createMany([{ name: 'a', status: 'x' }, { name: 'b' }]);

			expect(inserts).toHaveLength(2); // one INSERT per row, not a batched multi-row insert
			expect(keys).toHaveLength(2);
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

		test('normalizes MySQL primary-key unique violations to the pk field (replay path)', async () => {
			vi.mocked(getDatabaseClient).mockReturnValue('mysql');

			// MySQL doesn't name the field for a PK violation; the parser flags it via extensions.primaryKey.
			const dupError: any = new Error('dup');
			dupError.code = 'ER_DUP_ENTRY';
			dupError.sqlMessage = "Duplicate entry 'x' for key 'PRIMARY'";
			tracker.on.insert('flat').simulateError(dupError);

			const service = new ItemsService('flat', { knex: db, schema });

			let thrown: any;

			try {
				await service.createMany([{ name: 'a' }, { name: 'b' }]);
			} catch (err) {
				thrown = err;
			}

			// createOne maps this to field=<pk> and drops primaryKey; the batch replay must match.
			expect(isDirectusError(thrown, ErrorCode.RecordNotUnique)).toBe(true);
			expect(thrown.extensions.field).toBe('id');
			expect(thrown.extensions.primaryKey).toBeUndefined();
		});

		test('runs onItemCreate for all rows before the user-integrity check', async () => {
			tracker.on.insert('flat').response(() => []);

			const order: string[] = [];
			vi.mocked(validateUserCountIntegrity).mockImplementation(async () => void order.push('integrity'));

			const service = new ItemsService('flat', { knex: db, schema });

			await service.createMany([{ name: 'a' }, { name: 'b' }], {
				userIntegrityCheckFlags: UserIntegrityCheckFlag.UserLimits,
				onItemCreate: () => order.push('create'),
			});

			expect(order).toEqual(['create', 'create', 'integrity']);
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
