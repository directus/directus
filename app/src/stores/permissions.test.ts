import api from '@/api';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { usePermissionsStore } from './permissions';
import { useUserStore } from './user';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

const mockUser = {
	id: '00000000-0000-0000-0000-000000000000',
	role: {
		admin_access: false,
		id: '00000000-0000-0000-0000-000000000000',
	},
};

const mockAdminUser = {
	id: '00000000-0000-0000-0000-000000000000',
	role: {
		admin_access: true,
		id: '00000000-0000-0000-0000-000000000000',
	},
};

const mockPermissions = [
	{
		role: '00000000-0000-0000-0000-000000000000',
		permissions: {
			_and: [
				{
					field_a: {
						_null: true,
					},
				},
				{
					field_b: {
						_null: true,
					},
				},
			],
		},
		validation: null,
		presets: null,
		fields: ['*'],
		collection: 'test',
		action: 'read',
	},
];

vi.mock('@/api', () => {
	return {
		default: {
			get: (path: string) => {
				if (path === '/permissions') {
					return Promise.resolve({
						data: {
							data: mockPermissions,
						},
					});
				}

				return Promise.reject(new Error(`GET "${path}" is not mocked in this test`));
			},
		},
	};
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('actions', () => {
	describe('hydrate', () => {
		test('should fetch additional fields when there are dynamic variables in presets', async () => {
			const userStore = useUserStore();
			userStore.currentUser = mockAdminUser as any;
			const hydrateAdditionalFieldsSpy = vi.spyOn(userStore, 'hydrateAdditionalFields').mockResolvedValue();

			const permissionWithDynamicVariablesInPresets = {
				role: '00000000-0000-0000-0000-000000000000',
				permissions: {
					collection_b: {
						role: {
							_eq: '$CURRENT_ROLE.name',
						},
					},
				},
				validation: {
					user: {
						_eq: '$CURRENT_USER',
					},
				},
				presets: {
					field_c: '$CURRENT_USER.custom_user_field',
				},
				fields: ['*'],
				collection: 'test',
				action: 'create',
			};

			vi.spyOn(vi.mocked(api), 'get').mockResolvedValueOnce({
				data: { data: [...mockPermissions, permissionWithDynamicVariablesInPresets] },
			});

			const permissionsStore = usePermissionsStore();
			await permissionsStore.hydrate();

			expect(hydrateAdditionalFieldsSpy).toHaveBeenCalledOnce();
			expect(hydrateAdditionalFieldsSpy).toBeCalledWith(expect.arrayContaining(['role.name', 'custom_user_field']));
		});

		test('should not fetch additional fields when there are not dynamic variables in presets', async () => {
			const userStore = useUserStore();
			userStore.currentUser = mockAdminUser as any;
			vi.spyOn(userStore, 'hydrateAdditionalFields').mockResolvedValue();

			expect(userStore.hydrateAdditionalFields).not.toHaveBeenCalled();
		});
	});

	describe('getPermissionsForUser', () => {
		const collection = 'test';

		test('should return permission for current user when it exists', async () => {
			const userStore = useUserStore();
			userStore.currentUser = mockAdminUser as any;

			const permissionsStore = usePermissionsStore();
			await permissionsStore.hydrate();

			expect(permissionsStore.getPermissionsForUser(collection, 'read')).toMatchObject({
				collection,
				action: 'read',
			});
		});

		test('should return null for current user when it does not exists', async () => {
			const userStore = useUserStore();
			userStore.currentUser = mockAdminUser as any;

			const permissionsStore = usePermissionsStore();
			await permissionsStore.hydrate();

			expect(permissionsStore.getPermissionsForUser(collection, 'create')).toBe(null);
		});
	});

	describe('hasPermission', () => {
		const collection = 'test';

		test('should return true for admin user', async () => {
			const userStore = useUserStore();
			userStore.currentUser = mockAdminUser as any;

			const permissionsStore = usePermissionsStore();
			await permissionsStore.hydrate();

			expect(permissionsStore.hasPermission(collection, 'read')).toBe(true);
		});

		test('should return true for current user with necessary permissions', async () => {
			const userStore = useUserStore();
			userStore.currentUser = mockUser as any;

			const permissionsStore = usePermissionsStore();
			await permissionsStore.hydrate();

			expect(permissionsStore.hasPermission(collection, 'read')).toBe(true);
		});

		test('should return false for current user without necessary permissions', async () => {
			const userStore = useUserStore();
			userStore.currentUser = mockUser as any;

			const permissionsStore = usePermissionsStore();
			await permissionsStore.hydrate();

			expect(permissionsStore.hasPermission(collection, 'create')).toBe(false);
			expect(permissionsStore.hasPermission(collection, 'update')).toBe(false);
			expect(permissionsStore.hasPermission(collection, 'delete')).toBe(false);
		});
	});
});
