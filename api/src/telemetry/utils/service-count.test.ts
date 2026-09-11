import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ItemsService } from '../../services/items.js';
import { serviceCount } from './service-count.js';

vi.mock('../../services/items.js', () => ({
	ItemsService: vi.fn().mockImplementation(() => ({
		readByQuery: vi.fn().mockResolvedValue([{ count: 42 }]),
	})),
}));

afterEach(() => {
	vi.clearAllMocks();
});

describe('serviceCount', () => {
	const mockDb = {} as Knex;
	const mockSchema = {} as SchemaOverview;

	test('returns count from aggregate query', async () => {
		const result = await serviceCount(mockDb, mockSchema, 'directus_shares');
		expect(result).toBe(42);
		expect(ItemsService).toHaveBeenCalledWith('directus_shares', { knex: mockDb, schema: mockSchema });
	});

	test('accepts a schema', async () => {
		const result = await serviceCount(mockDb, mockSchema, 'directus_fields');
		expect(result).toBe(42);
	});

	test('defaults to 0 when no count returned', async () => {
		vi.mocked(ItemsService).mockImplementationOnce(
			() =>
				({
					readByQuery: vi.fn().mockResolvedValue([{}]),
				}) as any,
		);

		const result = await serviceCount(mockDb, mockSchema, 'directus_shares');
		expect(result).toBe(0);
	});

	test('defaults to 0 when empty array returned', async () => {
		vi.mocked(ItemsService).mockImplementationOnce(
			() =>
				({
					readByQuery: vi.fn().mockResolvedValue([]),
				}) as any,
		);

		const result = await serviceCount(mockDb, mockSchema, 'directus_shares');
		expect(result).toBe(0);
	});
});
