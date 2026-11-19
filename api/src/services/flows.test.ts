import { LimitExceededError } from '@directus/errors';
import type { SchemaOverview } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockKnex } from '../test-utils/knex.js';
import { FlowsService } from './flows.js';
import { ItemsService } from './items.js';

const entitlements = vi.hoisted(() => ({ assert: vi.fn(), clearCache: vi.fn() }));

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('../flows.js', () => ({ getFlowManager: () => ({ reload: vi.fn() }) }));
vi.mock('../license/entitlements/manager.js', () => ({ getEntitlementManager: () => entitlements }));
vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({ validateAccess: vi.fn() }));

const schema = { collections: {}, relations: [] } as unknown as SchemaOverview;

afterEach(() => {
	vi.clearAllMocks();
});

describe('flows entitlement', () => {
	const { db, tracker } = createMockKnex();
	tracker.on.update('directus_operations').response(1);

	const service = () => new FlowsService({ knex: db, schema });

	test.each([
		['without a status (defaults to active)', {}],
		['with status active', { status: 'active' }],
	])('createOne %s consumes a flow slot', async (_, data) => {
		await service().createOne({ name: 'flow', ...data });

		expect(entitlements.assert).toHaveBeenCalledWith('flows', { adding: 1, knex: db });
	});

	test('createOne with status inactive does not consume a flow slot', async () => {
		await service().createOne({ name: 'flow', status: 'inactive' });

		expect(entitlements.assert).not.toHaveBeenCalled();
	});

	test('createOne over the limit rejects before the flow is written', async () => {
		entitlements.assert.mockRejectedValueOnce(new LimitExceededError({ category: 'flows' }));

		await expect(service().createOne({ name: 'flow' })).rejects.toBeInstanceOf(LimitExceededError);
		expect(ItemsService.prototype.createOne).not.toHaveBeenCalled();
	});

	test('activating several flows consumes one slot per flow', async () => {
		await service().updateMany([1, 2, 3], { status: 'active' });

		expect(entitlements.assert).toHaveBeenCalledWith('flows', { adding: 3, knex: db });
	});

	test.each([
		['deactivating', { status: 'inactive' }],
		['a non-status edit', { name: 'renamed' }],
	])('%s is allowed without a limit check, even while over the limit', async (_, data) => {
		await service().updateMany([1], data);

		expect(entitlements.assert).not.toHaveBeenCalled();
	});

	test.each([
		['create', () => service().createOne({ name: 'flow', status: 'inactive' })],
		['update', () => service().updateMany([1], { status: 'inactive' })],
		['delete', () => service().deleteMany([1])],
	])('%s invalidates the cached flow count', async (_, mutate) => {
		await mutate();

		expect(entitlements.clearCache).toHaveBeenCalledWith('flows');
	});
});
