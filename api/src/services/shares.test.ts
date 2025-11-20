import { ForbiddenError } from '@directus/errors';
import type { Accountability, AbstractServiceOptions } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SharesService } from './shares.js';
import { ItemsService } from './items.js';

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn().mockResolvedValue(undefined),
}));

describe('SharesService', () => {
	let mockOptions: AbstractServiceOptions;

	beforeEach(() => {
		vi.clearAllMocks();

		mockOptions = {
			knex: {} as any,
			schema: {
				collections: {
					test_collection: {},
				},
			} as any,
			accountability: null,
		};

		vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue('share-id');
	});

	describe('createOne - role privilege escalation check', () => {
		test('allows admin users to set any role', async () => {
			const adminAccountability: Accountability = {
				user: 'admin-user-id',
				role: 'admin-role-id',
				admin: true,
				app: false,
				ip: '',
				roles: [],
			};

			mockOptions.accountability = adminAccountability;
			const service = new SharesService(mockOptions);

			const shareData = {
				collection: 'test_collection',
				item: 'item-id',
				role: 'different-role-id',
			};

			const result = await service.createOne(shareData);
			expect(result).toBe('share-id');
		});

		test('allows non-admin users to set their own role', async () => {
			const userAccountability: Accountability = {
				user: 'user-id',
				role: 'user-role-id',
				admin: false,
				app: false,
				ip: '',
				roles: [],
			};

			mockOptions.accountability = userAccountability;
			const service = new SharesService(mockOptions);

			const shareData = {
				collection: 'test_collection',
				item: 'item-id',
				role: 'user-role-id',
			};

			const result = await service.createOne(shareData);
			expect(result).toBe('share-id');
		});

		test('allows non-admin users to create shares without specifying a role', async () => {
			const userAccountability: Accountability = {
				user: 'user-id',
				role: 'user-role-id',
				admin: false,
				app: false,
				ip: '',
				roles: [],
			};

			mockOptions.accountability = userAccountability;
			const service = new SharesService(mockOptions);

			const shareData = {
				collection: 'test_collection',
				item: 'item-id',
			};

			const result = await service.createOne(shareData);
			expect(result).toBe('share-id');
		});

		test('allows non-admin users to create shares with null role', async () => {
			const userAccountability: Accountability = {
				user: 'user-id',
				role: 'user-role-id',
				admin: false,
				app: false,
				ip: '',
				roles: [],
			};

			mockOptions.accountability = userAccountability;
			const service = new SharesService(mockOptions);

			const shareData = {
				collection: 'test_collection',
				item: 'item-id',
				role: null,
			};

			const result = await service.createOne(shareData);
			expect(result).toBe('share-id');
		});

		test('throws ForbiddenError when non-admin user tries to set a different role', async () => {
			const userAccountability: Accountability = {
				user: 'user-id',
				role: 'user-role-id',
				admin: false,
				app: false,
				ip: '',
				roles: [],
			};

			mockOptions.accountability = userAccountability;
			const service = new SharesService(mockOptions);

			const shareData = {
				collection: 'test_collection',
				item: 'item-id',
				role: 'admin-role-id',
			};

			await expect(service.createOne(shareData)).rejects.toThrow(ForbiddenError);
		});
	});
});
