import { useUserStore } from './user';
import { AppUser } from '@/types/user';
import { Globals, Role, User } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { RouteLocationNormalized } from 'vue-router';


beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

const mockUsersResponse = {
	id: '00000000-0000-0000-0000-000000000000',
	language: null,
	first_name: 'Test',
	last_name: 'User',
	email: 'test@example.com',
	last_page: null,
	tfa_secret: null,
	avatar: null,
	custom_user_field: 'test',
	role: {
		id: '00000000-0000-0000-0000-000000000000',
		custom_role_field: 'test',
	} as Partial<Role>,
	policies: [],
} as Partial<User>;

const mockGlobalsResponse = {
	app_access: true,
	admin_access: true,
	enforce_tfa: false,
} as Globals;

const mockRolesResponse: Pick<Role, 'id'>[] = [{ id: '00000000-0000-0000-0000-000000000000' }];

vi.mock('@/api', () => {
	return {
		default: {
			get: (path: string) => {
				switch (path) {
					case '/users/me':
						return Promise.resolve({
							data: {
								data: mockUsersResponse,
							},
						});
					case '/policies/me/globals':
						return Promise.resolve({
							data: {
								data: mockGlobalsResponse,
							},
						});
					case '/roles/me':
						return Promise.resolve({
							data: {
								data: mockRolesResponse,
							},
						});
				}

				return Promise.reject(new Error(`GET "${path}" is not mocked in this test`));
			},
			patch: (path: string) => {
				if (path === '/users/me/track/page') {
					return Promise.resolve({
						data: {},
					});
				}

				return Promise.reject(new Error(`PATCH "${path}" is not mocked in this test`));
			},
		},
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('getters', () => {
	describe('fullName', () => {
		test('should return null when there is no current user', async () => {
			const userStore = useUserStore();

			expect(userStore.fullName).toEqual(null);
		});

		test('should return concatenated first and last name when there is current user with first and last name', async () => {
			const userStore = useUserStore();
			await userStore.hydrate();

			expect(userStore.fullName).toEqual('Test User');
		});
	});

	describe('isAdmin', () => {
		test('should return false when there is no current user', async () => {
			const userStore = useUserStore();

			expect(userStore.isAdmin).toEqual(false);
		});

		test('should return false when current user has role with no admin access', async () => {
			const userStore = useUserStore();

			userStore.currentUser = {
				admin_access: false,
			} as AppUser;

			expect(userStore.isAdmin).toEqual(false);
		});

		test('should return true when current user has role with admin access', async () => {
			const userStore = useUserStore();

			userStore.currentUser = {
				admin_access: true,
			} as AppUser;

			expect(userStore.isAdmin).toEqual(true);
		});
	});
});

describe('actions', () => {
	describe('hydrate', () => {
		test('should fetch user fields and set current user as the returned value', async () => {
			const userStore = useUserStore();
			await userStore.hydrate();

			expect(userStore.currentUser).toEqual({ ...mockUsersResponse, ...mockGlobalsResponse, roles: mockRolesResponse });
		});
	});

	describe('trackPage', () => {
		const page = '/test';

		test('should not set last_page if there is no current user', async () => {
			const userStore = useUserStore();
			await userStore.trackPage({ path: page, fullPath: page } as RouteLocationNormalized);

			expect((userStore.currentUser as User)?.last_page).not.toBe(page);
		});

		test('should set last_page if there is current user', async () => {
			const userStore = useUserStore();
			await userStore.hydrate();
			await userStore.trackPage({ path: page, fullPath: page } as RouteLocationNormalized);

			expect((userStore.currentUser as User).last_page).toBe(page);
		});
	});
});
