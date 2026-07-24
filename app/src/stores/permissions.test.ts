import { PermissionsAction } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';
import { usePermissionsStore } from './permissions';
import { useUserStore } from './user';
import { mockedStore } from '@/__utils__/store';
import api from '@/api';
import { ActionPermission, CollectionPermission } from '@/types/permissions';

vi.mock('@/api');

let sample: {
	collection: string;
	user: { id: string };
	role: { id: string };
};

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);

	sample = {
		collection: 'test_collection',
		user: { id: 'test-user-id' },
		role: { id: 'test-role-id' },
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

const actions: PermissionsAction[] = ['create', 'read', 'update', 'delete', 'share'];

describe('actions', () => {
	describe('hydrate', () => {
		test('should store the permissions returned by the API', async () => {
			const permissions = {
				[sample.collection]: {
					create: {
						access: 'full',
						full_access: true,
						fields: ['*'],
						presets: {
							tenant_id: 'resolved-tenant-id',
						},
					},
				},
			};

			vi.spyOn(vi.mocked(api), 'get').mockResolvedValueOnce({ data: { data: permissions } });

			const permissionsStore = usePermissionsStore();
			await permissionsStore.hydrate();

			expect(api.get).toHaveBeenCalledWith('/permissions/me');

			expect(permissionsStore.getPermission(sample.collection, 'create')?.presets).toEqual({
				tenant_id: 'resolved-tenant-id',
			});
		});
	});

	describe('getPermission', () => {
		it.each(actions)('should return matching permission if it exists', (action) => {
			const permission: ActionPermission = {
				access: true,
				full_access: true,
				fields: ['*'],
			};

			const mockPermissions: Record<string, CollectionPermission> = {
				[sample.collection]: {
					[action as PermissionsAction]: permission,
				},
			};

			const permissionsStore = usePermissionsStore();
			permissionsStore.permissions = mockPermissions;

			expect(permissionsStore.getPermission(sample.collection, action)).toMatchObject(permission);
		});

		it.each(actions)('should return null when not matching permission exists', (action) => {
			const permissionsStore = usePermissionsStore();

			expect(permissionsStore.getPermission(sample.collection, action)).toBe(null);
		});
	});

	describe('hasPermission', () => {
		const actions: PermissionsAction[] = ['create', 'read', 'update', 'delete', 'share'];

		describe('admin users', () => {
			it.each(actions)('should always return true for %s permission', (action) => {
				const userStore = mockedStore(useUserStore());
				userStore.isAdmin = true;

				const { hasPermission } = usePermissionsStore();
				const result = hasPermission(sample.collection, action);

				expect(result).toBe(true);
			});
		});

		describe('non-admin users', () => {
			it.each(actions)('should return false if user has no %s permission', (action) => {
				const userStore = mockedStore(useUserStore());
				userStore.isAdmin = false;

				const { hasPermission } = usePermissionsStore();
				const result = hasPermission(sample.collection, action);

				expect(result).toBe(false);
			});

			it.each(actions)('should return true if user has %s permission', (action) => {
				const userStore = mockedStore(useUserStore());
				userStore.isAdmin = false;

				const permission: ActionPermission = {
					access: true,
					full_access: true,
					fields: ['*'],
				};

				const mockPermissions: Record<string, CollectionPermission> = {
					[sample.collection]: {
						[action as PermissionsAction]: permission,
					},
				};

				const permissionsStore = usePermissionsStore();
				permissionsStore.permissions = mockPermissions;

				const result = permissionsStore.hasPermission(sample.collection, action);

				expect(result).toBe(true);
			});
		});
	});
});
