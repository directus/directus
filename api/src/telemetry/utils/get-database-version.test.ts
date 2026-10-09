import { afterEach, describe, expect, test } from 'vitest';
import { createMockKnex, resetKnexMocks } from '../../test-utils/knex.js';
import { getDatabaseVersion } from './get-database-version.js';

const { db, tracker, mockSchemaBuilder } = createMockKnex();

afterEach(() => {
	resetKnexMocks(tracker, mockSchemaBuilder);
});

describe('getDatabaseVersion', () => {
	test('returns version for postgres driver', async () => {
		tracker.on.select(/version\(\)/).response([{ version: 'PostgreSQL 16.0' }]);

		const result = await getDatabaseVersion(db, 'postgres');
		expect(result).toBe('PostgreSQL 16.0');
	});

	test('returns version for cockroachdb driver', async () => {
		tracker.on.select(/version\(\)/).response([{ version: 'CockroachDB CCL v23.1.0' }]);

		const result = await getDatabaseVersion(db, 'cockroachdb');
		expect(result).toBe('CockroachDB CCL v23.1.0');
	});

	test('returns version for mysql driver', async () => {
		tracker.on.select(/version\(\)/).response([{ version: '8.0.33' }]);

		const result = await getDatabaseVersion(db, 'mysql');
		expect(result).toBe('8.0.33');
	});

	test('returns version for sqlite driver', async () => {
		tracker.on.select(/sqlite_version\(\)/).response([{ version: '3.42.0' }]);

		const result = await getDatabaseVersion(db, 'sqlite');
		expect(result).toBe('3.42.0');
	});

	test('returns version for mssql driver', async () => {
		tracker.on.select(/@@VERSION/).response([{ version: 'Microsoft SQL Server 2022' }]);

		const result = await getDatabaseVersion(db, 'mssql');
		expect(result).toBe('Microsoft SQL Server 2022');
	});

	test('returns version for oracle driver', async () => {
		tracker.on.select(/banner/).response([{ version: 'Oracle Database 19c' }]);

		const result = await getDatabaseVersion(db, 'oracle');
		expect(result).toBe('Oracle Database 19c');
	});

	test('returns null when query returns no rows', async () => {
		tracker.on.select(/version\(\)/).response([]);

		const result = await getDatabaseVersion(db, 'postgres');
		expect(result).toBeNull();
	});

	test('returns null for unknown driver', async () => {
		const result = await getDatabaseVersion(db, 'redshift');
		expect(result).toBeNull();
	});

	test('returns null on query error', async () => {
		tracker.on.select(/version\(\)/).simulateError(new Error('Connection failed'));

		const result = await getDatabaseVersion(db, 'postgres');
		expect(result).toBeNull();
	});
});
