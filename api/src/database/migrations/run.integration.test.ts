import { knex } from 'knex';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import runSeed from '../seeds/run.js';
import run from './run.js';

// `directus init` runs migrations before the .env file exists, so migrations must only use the
// connection that is passed to them and never fall back to the global database instance
vi.mock('../index.js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../index.js')>();

	const getDatabase = () => {
		throw new Error('Migrations must not use the global database instance');
	};

	return { ...actual, default: getDatabase, getDatabase };
});

describe('migrations', () => {
	const db = knex({
		client: 'sqlite3',
		connection: { filename: ':memory:' },
		useNullAsDefault: true,
		pool: { min: 1, max: 1 },
	});

	beforeAll(async () => {
		await runSeed(db);
	});

	afterAll(async () => {
		await db.destroy();
	});

	test('run to latest using only the passed database connection', async () => {
		await run(db, 'latest', false);

		const pending = await run(db, 'up', false).catch((err: Error) => err.message);

		expect(pending).toBe('Nothing to upgrade');
	}, 60_000);
});
