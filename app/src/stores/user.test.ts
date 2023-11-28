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

import { User } from '@directus/types';
import { useLatencyStore } from './latency';
import { useUserStore } from './user';

const mockAdminUser = {
	id: '00000000-0000-0000-0000-000000000000',
	language: null,
	first_name: 'Test',
	last_name: 'User',
	email: 'test@example.com',
	last_page: null,
	tfa_secret: null,
	// this should be "null", but mocked as "{ id: null }" due to lodash pick usage
	avatar: {
		id: null,
	},
	custom_user_field: 'test',
	role: {
		admin_access: true,
		app_access: true,
		id: '00000000-0000-0000-0000-000000000000',
		enforce_tfa: false,
		custom_role_field: 'test',
	},
};

vi.mock('@/api', () => {
	return {
		default: {
			get: (path: string) => {
				if (path === '/users/me') {
					return Promise.resolve({
						data: {
							data: mockAdminUser,
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
	vi.restoreAllMocks();
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

		test('should return true when is current user with role that has admin access', async () => {
			const userStore = useUserStore();
			await userStore.hydrate();

			expect(userStore.isAdmin).toEqual(true);
		});
	});
});

describe('actions', () => {
	describe('hydrate', () => {
		test('should fetch user fields and set current user as the returned value', async () => {
			const userStore = useUserStore();
			await userStore.hydrate();
			expect(userStore.currentUser).toEqual(mockAdminUser);
		});
	});

	describe('trackPage', () => {
		const page = '/test';

		test('should not set last_page if there is no current user', async () => {
			const latencyStore = useLatencyStore();
			vi.spyOn(latencyStore, 'save').mockReturnValue();

			const userStore = useUserStore();
			await userStore.trackPage({ path: page, fullPath: page } as RouteLocationNormalized);

			expect((userStore.currentUser as User)?.last_page).not.toBe(page);
		});

		test('should set last_page if there is current user', async () => {
			const latencyStore = useLatencyStore();
			vi.spyOn(latencyStore, 'save').mockReturnValue();

			const userStore = useUserStore();
			await userStore.hydrate();
			await userStore.trackPage({ path: page, fullPath: page } as RouteLocationNormalized);

			expect((userStore.currentUser as User).last_page).toBe(page);
		});
	});
});
