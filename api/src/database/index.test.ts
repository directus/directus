import type { Knex } from 'knex';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex } from '../test-utils/knex.js';

const mocks = vi.hoisted(() => ({
	env: {} as Record<string, any>,
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => mocks.env),
}));

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn(() => ({ trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() })),
}));

vi.mock('../metrics/index.js', () => ({
	useMetrics: vi.fn(() => undefined),
}));

vi.mock('../utils/validate-env.js', () => ({
	validateEnv: vi.fn(),
}));

vi.mock('../extensions/lib/get-extensions-path.js', () => ({
	getExtensionsPath: vi.fn(() => '/extensions'),
}));

vi.mock('./helpers/index.js', () => ({
	getHelpers: vi.fn(() => ({})),
}));

vi.mock('@directus/schema', () => ({
	createInspector: vi.fn(),
}));

/**
 * getDatabaseClient() only reads `client.constructor.name`, so a mock knex with the dialect's
 * class name substituted is enough to exercise every branch.
 */
function knexReportingDialect(constructorName: string): Knex {
	const { db } = createMockKnex();
	Object.defineProperty(db.client, 'constructor', { value: { name: constructorName }, configurable: true });
	return db;
}

beforeEach(() => {
	vi.resetModules();

	for (const key of Object.keys(mocks.env)) delete mocks.env[key];
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('getDatabaseClient', () => {
	test.each([
		['DirectusBetterSQLite3', 'sqlite'],
		['Client_BetterSQLite3', 'sqlite'],
		['Client_SQLite3', 'sqlite'],
		['Client_MySQL2', 'mysql'],
		['Client_PG', 'postgres'],
		['Client_CockroachDB', 'cockroachdb'],
		['Client_Oracledb', 'oracle'],
		['Client_Oracle', 'oracle'],
		['Client_MSSQL', 'mssql'],
		['Client_Redshift', 'redshift'],
	])('maps %s to %s', async (constructorName, expected) => {
		const { getDatabaseClient } = await import('./index.js');

		expect(getDatabaseClient(knexReportingDialect(constructorName))).toBe(expected);
	});

	test('throws for an unrecognised client', async () => {
		const { getDatabaseClient } = await import('./index.js');

		expect(() => getDatabaseClient(knexReportingDialect('Client_Nonsense'))).toThrowError(
			`Couldn't extract database client`,
		);
	});
});

describe('getDatabase with DB_CLIENT=sqlite3', () => {
	let database: Knex;

	beforeEach(() => {
		mocks.env['DB_CLIENT'] = 'sqlite3';
		mocks.env['DB_FILENAME'] = ':memory:';
	});

	afterEach(async () => {
		await database?.destroy();
	});

	test('resolves to the better-sqlite3 knex dialect', async () => {
		const { getDatabase } = await import('./index.js');
		database = getDatabase();

		expect(database.client.driverName).toBe('better-sqlite3');

		// getDatabaseClient() and createInspector() both switch on this name
		expect(database.client.constructor.name).toBe('DirectusBetterSQLite3');
	});

	test('binds integers as integers, so ids stored in text columns keep their exact form', async () => {
		const { getDatabase } = await import('./index.js');
		database = getDatabase();

		await database.schema.createTable('junction', (table) => {
			table.increments('id');
			table.string('item', 255);
		});

		// better-sqlite3 binds every JS number as a double, which a TEXT affinity column would
		// stringify to "41.0" and break the a2o join against CAST(id AS CHAR(255))
		await database('junction').insert({ item: 41 });

		expect(await database('junction').select('item')).toEqual([{ item: '41' }]);

		const [{ pk }] = await database.raw(`select item = CAST(? AS CHAR(255)) as pk from junction`, [41]);
		expect(pk).toBe(1);

		// binding integers as BigInt mustn't leak into reads
		expect(await database('junction').select('id')).toEqual([{ id: 1 }]);
	});

	test('binds integers as integers inside a transaction too', async () => {
		const { getDatabase } = await import('./index.js');
		database = getDatabase();

		await database.schema.createTable('junction', (table) => {
			table.increments('id');
			table.string('item', 255);
		});

		// knex gives a transaction its own client, built from `client.constructor.prototype` with only
		// a fixed set of properties copied over. Every mutation runs in a transaction, so a coercion
		// that only reached the outer client would leave every written id as "41.0"
		await database.transaction(async (trx) => {
			await trx('junction').insert({ item: 41 });
		});

		expect(await database('junction').select('item')).toEqual([{ item: '41' }]);
	});

	test('runs queries that carry no bindings', async () => {
		const { getDatabase } = await import('./index.js');
		database = getDatabase();

		// `prepBindings` is handed `undefined` for these, not an array
		expect(await database.raw('select 1 as one')).toEqual([{ one: 1 }]);
	});

	test('leaves floats and unsafe integers on the double binding path', async () => {
		const { getDatabase } = await import('./index.js');
		database = getDatabase();

		await database.schema.createTable('measurements', (table) => {
			table.float('radius');
			table.string('label', 255);
		});

		await database('measurements').insert({ radius: 91.97, label: Number.MAX_SAFE_INTEGER + 2 });

		expect(await database('measurements').select('radius')).toEqual([{ radius: 91.97 }]);
	});

	test('still reports itself as the sqlite database client', async () => {
		const { getDatabase, getDatabaseClient } = await import('./index.js');
		database = getDatabase();

		expect(getDatabaseClient(database)).toBe('sqlite');
	});

	test('keeps DB_FILENAME wired through to the connection', async () => {
		const { getDatabase } = await import('./index.js');
		database = getDatabase();

		expect(database.client.config.connection).toMatchObject({ filename: ':memory:' });
	});

	test('sets useNullAsDefault', async () => {
		const { getDatabase } = await import('./index.js');
		database = getDatabase();

		expect(database.client.config.useNullAsDefault).toBe(true);
	});

	test('enables foreign keys through pragma(), the better-sqlite3 connection API', async () => {
		const { getDatabase } = await import('./index.js');
		database = getDatabase();

		const { afterCreate } = database.client.config.pool;
		expect(afterCreate).toBeTypeOf('function');

		// better-sqlite3 connections expose pragma() and have no node-sqlite3 style run()
		const connection = { pragma: vi.fn() };
		const callback = vi.fn();
		afterCreate(connection, callback);

		expect(connection.pragma).toHaveBeenCalledWith('foreign_keys = ON');
		expect(callback).toHaveBeenCalledWith(null, connection);
	});

	test('opens a working connection end to end', async () => {
		const { getDatabase } = await import('./index.js');
		database = getDatabase();

		await database.schema.createTable('widgets', (table) => {
			table.increments('id');
			table.string('name');
		});

		await database('widgets').insert({ name: 'gizmo' });

		expect(await database('widgets').select('name')).toEqual([{ name: 'gizmo' }]);
	});

	test('applies the foreign key pragma to real connections', async () => {
		const { getDatabase } = await import('./index.js');
		database = getDatabase();

		const [{ foreign_keys: foreignKeys }] = await database.raw('PRAGMA foreign_keys');

		expect(foreignKeys).toBe(1);
	});
});

describe('getDatabase with other clients', () => {
	let database: Knex;

	afterEach(async () => {
		await database?.destroy();
	});

	test('passes non-sqlite clients through untouched', async () => {
		mocks.env['DB_CLIENT'] = 'pg';
		mocks.env['DB_HOST'] = 'localhost';

		const { getDatabase } = await import('./index.js');
		database = getDatabase();

		expect(database.client.config.client).toBe('pg');
		expect(database.client.config.useNullAsDefault).toBeUndefined();
	});
});
