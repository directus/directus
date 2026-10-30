import type { Knex } from 'knex';
import { describe, expect, test, vi } from 'vitest';
import { collectDatabaseMetrics } from './database.js';

vi.mock('../../../database/helpers/index.js', () => ({
	getHelpers: vi.fn().mockReturnValue({
		schema: { getDatabaseSize: vi.fn().mockResolvedValue(1024000) },
	}),
}));

describe('collectDatabaseMetrics', () => {
	const mockDb = {} as Knex;

	test('returns database size from schema helper', async () => {
		const result = await collectDatabaseMetrics(mockDb);
		expect(result.size).toBe(1024000);
	});
});
