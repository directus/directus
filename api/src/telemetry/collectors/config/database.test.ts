import type { Knex } from 'knex';
import { describe, expect, test, vi } from 'vitest';
import { collectDatabase } from './database.js';

vi.mock('../../../database/index.js', () => ({
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('../../../database/helpers/index.js', () => ({
	getHelpers: vi.fn().mockReturnValue({
		schema: { getVersion: vi.fn().mockResolvedValue('PostgreSQL 16.0') },
	}),
}));

describe('collectDatabase', () => {
	test('returns driver and version', async () => {
		const mockDb = {} as unknown as Knex;

		const result = await collectDatabase(mockDb);
		expect(result.driver).toBe('postgres');
		expect(result.version).toBe('PostgreSQL 16.0');
	});
});
