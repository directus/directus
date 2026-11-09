import { knex } from 'knex';
import { afterAll, expect, test, vi } from 'vitest';
import runSeed from '../seeds/run.js';
import run from './run.js';

// No .env during `directus init`. Schema cache off so every `getSchema()` call hits the guard
vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../../test-utils/env.js');
	return mockEnv({ CACHE_SCHEMA: false });
});

// Migrations must only use the passed connection
vi.mock('../index.js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../index.js')>();

	const getDatabase = () => {
		throw new Error('Migrations must not use the global database instance');
	};

	return { ...actual, default: getDatabase, getDatabase };
});

const db = knex({ client: 'sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true });

afterAll(async () => {
	await db.destroy();
});

test('should migrate to latest using only the passed database connection', async () => {
	await runSeed(db);

	await expect(run(db, 'latest', false)).resolves.toBeUndefined();
}, 60_000);
