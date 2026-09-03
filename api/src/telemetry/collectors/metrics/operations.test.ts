import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { countByColumn } from '../../utils/count-by-column.js';
import { serviceCount } from '../../utils/service-count.js';
import { BUILTIN_OPERATION_TYPES, collectOperationMetrics } from './operations.js';

vi.mock('../../utils/count-by-column.js');
vi.mock('../../utils/service-count.js');

const mockDb = {} as Knex;
const mockSchema = {} as SchemaOverview;

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectOperationMetrics', () => {
	test('returns the total and the breakdown by type', async () => {
		vi.mocked(serviceCount).mockResolvedValue(7);
		vi.mocked(countByColumn).mockResolvedValue({ log: { count: 5 }, custom: { count: 2 } });

		const result = await collectOperationMetrics(mockDb, mockSchema);

		expect(result).toStrictEqual({ count: 7, type: { log: { count: 5 }, custom: { count: 2 } } });
	});

	test('groups by type against the built in operation types', async () => {
		vi.mocked(serviceCount).mockResolvedValue(0);
		vi.mocked(countByColumn).mockResolvedValue({});

		await collectOperationMetrics(mockDb, mockSchema);

		expect(countByColumn).toHaveBeenCalledWith(mockDb, 'directus_operations', 'type', BUILTIN_OPERATION_TYPES);
	});

	test('covers every operation type shipped with Directus', () => {
		expect(BUILTIN_OPERATION_TYPES).toHaveLength(15);
	});
});
