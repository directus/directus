import { USER_INACTIVE_LICENSE_STATUS } from '@directus/constants';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { FlowsService } from '../../services/flows.js';
import { ItemsService, UsersService } from '../../services/index.js';
import { pruneResolvedItems, toResolvedOutput } from './read.js';

const entitlements = vi.hoisted(() => ({ check: vi.fn(), isEntitled: vi.fn() }));

vi.mock('../entitlements/manager.js', () => ({ getEntitlementManager: () => entitlements }));
vi.mock('../../utils/get-schema.js', () => ({ getSchema: vi.fn() }));

vi.mock('../../services/index.js', async () => {
	const { mockItemsService } = await import('../../test-utils/services/items-service.js');
	return { ItemsService: mockItemsService().ItemsService, UsersService: mockItemsService().ItemsService };
});

vi.mock('../../services/flows.js', async () => {
	const { mockItemsService } = await import('../../test-utils/services/items-service.js');
	return { FlowsService: mockItemsService().ItemsService };
});

const AT = '2026-11-20T00:00:00.000Z';
const entry = (id: string) => ({ id, resolved_at: AT });

afterEach(() => {
	vi.clearAllMocks();
});

describe('pruneResolvedItems', () => {
	test('prunes ids that no longer exist', async () => {
		vi.mocked(ItemsService.prototype.readByQuery).mockResolvedValue([{ collection: 'c1', status: 'inactive' }]);

		await expect(pruneResolvedItems({ collections: [entry('c1'), entry('gone')] })).resolves.toEqual({
			collections: [entry('c1')],
		});
	});

	test('prunes ids that are no longer deactivated', async () => {
		vi.mocked(FlowsService.prototype.readByQuery).mockResolvedValue([
			{ id: 'f1', status: 'inactive' },
			{ id: 'f2', status: 'active' },
		] as any);

		vi.mocked(UsersService.prototype.readByQuery).mockResolvedValue([
			{ id: 'u1', status: USER_INACTIVE_LICENSE_STATUS },
			{ id: 'u2', status: 'suspended' },
		]);

		await expect(
			pruneResolvedItems({ flows: [entry('f1'), entry('f2')], seats: [entry('u1'), entry('u2')] }),
		).resolves.toEqual({ flows: [entry('f1')], seats: [entry('u1')] });
	});
});

describe('toResolvedOutput', () => {
	test('adds display data and limit/usage per key; sso_users carries entitled', async () => {
		entitlements.check.mockResolvedValue({ allowed: true, hardLimit: 5, usage: 3, remaining: 2 });
		entitlements.isEntitled.mockReturnValue(false);
		vi.mocked(FlowsService.prototype.readByQuery).mockResolvedValue([{ id: 'f1', name: 'Flow' }] as any);

		vi.mocked(UsersService.prototype.readByQuery).mockResolvedValue([
			{ id: 's1', first_name: 'Sso', last_name: null, avatar: null, email: 's@x.io' },
		]);

		const output = await toResolvedOutput({
			collections: [entry('c1')],
			flows: [entry('f1')],
			sso_users: [entry('s1')],
		});

		expect(output).toEqual({
			collections: { limit: 5, usage: 3, candidates: [{ id: 'c1', resolved_at: AT }] },
			flows: { limit: 5, usage: 3, candidates: [{ id: 'f1', name: 'Flow', resolved_at: AT }] },
			sso_users: {
				entitled: false,
				limit: 5,
				usage: 3,
				candidates: [{ id: 's1', first_name: 'Sso', last_name: null, avatar: null, email: 's@x.io', resolved_at: AT }],
			},
		});

		expect(entitlements.check).toHaveBeenCalledWith('collections');
		expect(entitlements.isEntitled).toHaveBeenCalledWith('sso_enabled');
	});

	test('omits empty keys', async () => {
		await expect(toResolvedOutput({ flows: [] })).resolves.toEqual({});
	});
});
