import type { SchemaOverview } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex } from '../test-utils/knex.js';
import { FlowsService } from './flows.js';

const { assertMock } = vi.hoisted(() => ({ assertMock: vi.fn() }));

vi.mock('../license/entitlements/manager.js', () => ({
	getEntitlementManager: () => ({
		assert: assertMock,
		clearCache: vi.fn(),
	}),
}));

vi.mock('../flows.js', () => ({
	getFlowManager: () => ({
		reload: vi.fn(),
	}),
}));

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

describe('FlowsService', () => {
	const mockSchema = {
		collections: {},
		relations: [],
	} as SchemaOverview;

	const { db, tracker } = createMockKnex();

	const service = new FlowsService({
		knex: db,
		schema: mockSchema,
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('updateMany', () => {
		test('does not count flows that are already active', async () => {
			tracker.on.select('directus_flows').response([]);
			tracker.on.update('directus_flows').response([]);

			await service.updateMany(['flow-id-1'], { status: 'active' });

			expect(assertMock).not.toHaveBeenCalled();
		});

		test('counts only the flows that are being activated', async () => {
			tracker.on.select('directus_flows').response([{ id: 'flow-id-2' }]);
			tracker.on.update('directus_flows').response([]);

			await service.updateMany(['flow-id-1', 'flow-id-2'], { status: 'active' });

			expect(assertMock).toHaveBeenCalledWith('flows', { adding: 1, knex: db });
		});

		test('does not check the limit when the status is not being set to active', async () => {
			tracker.on.update('directus_flows').response([]);

			await service.updateMany(['flow-id-1'], { name: 'Updated' });

			expect(assertMock).not.toHaveBeenCalled();
		});
	});
});
