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
		// SQLite is served by the better-sqlite3 driver, but callers still see `sqlite`
		['Client_BetterSQLite3', 'sqlite'],
		// node-sqlite3 stays mapped, so an externally supplied Knex still resolves
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

		expect(database.client.config.client).toBe('better-sqlite3');
		expect(database.client.constructor.name).toBe('Client_BetterSQLite3');
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
