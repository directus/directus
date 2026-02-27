import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectFlowMetrics } from './flows.js';

vi.mock('../../../services/flows.js', () => ({
	FlowsService: vi.fn().mockImplementation(() => ({
		readByQuery: vi.fn().mockResolvedValue([]),
	})),
}));

import type { Knex } from 'knex';
import type { SchemaOverview } from '@directus/types';
import { FlowsService } from '../../../services/flows.js';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectFlowMetrics', () => {
	const mockDb = {} as Knex;
	const mockSchema = {} as SchemaOverview;

	test('returns zero counts when no flows', async () => {
		const result = await collectFlowMetrics(mockDb, mockSchema);
		expect(result.active.count).toBe(0);
		expect(result.inactive.count).toBe(0);
	});

	test('separates active and inactive counts', async () => {
		vi.mocked(FlowsService).mockImplementation(() => ({
			readByQuery: vi.fn().mockResolvedValue([
				{ status: 'active', countDistinct: { id: 5 } },
				{ status: 'inactive', countDistinct: { id: 3 } },
			]),
		}) as any);

		const result = await collectFlowMetrics(mockDb, mockSchema);
		expect(result.active.count).toBe(5);
		expect(result.inactive.count).toBe(3);
	});
});
