import { createTestingPinia } from '@pinia/testing';
import { AxiosRequestConfig } from 'axios';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		})
	);
});

import { User } from '@directus/shared/types';
import { pick } from 'lodash';
import { useLatencyStore } from './latency';
import { useUserStore } from './user';

const mockAdminUser = {
	id: '00000000-0000-0000-0000-000000000000',
	language: null,
	first_name: 'Test',
	last_name: 'User',
	email: 'test@example.com',
	last_page: null,
	theme: 'light',
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
			get: (path: string, config?: AxiosRequestConfig<any>) => {
				if (path === '/users/me' && config?.params?.fields) {
					const returnedData = pick(mockAdminUser, config.params.fields);

					return Promise.resolve({
						data: {
							data: returnedData,
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
		test('should fetch required fields and set current user as the returned value', async () => {
			const userStore = useUserStore();
			await userStore.hydrate();

			const requiredFields = [
				'id',
				'language',
				'first_name',
				'last_name',
				'email',
				'last_page',
				'theme',
				'tfa_secret',
				'avatar.id',
				'role.admin_access',
				'role.app_access',
				'role.id',
				'role.enforce_tfa',
			];

			expect(userStore.currentUser).toEqual(pick(mockAdminUser, requiredFields));
		});
	});

	describe('hydrateAdditionalFields', () => {
		test('should fetch additional fields and add them to the current user', async () => {
			const userStore = useUserStore();
			await userStore.hydrate();
			await userStore.hydrateAdditionalFields(['custom_user_field', 'role.custom_role_field']);

			expect(userStore.currentUser).toEqual(mockAdminUser);
		});
	});

	describe('trackPage', () => {
		const page = '/test';

		test('should not set last_page if there is no current user', async () => {
			const latencyStore = useLatencyStore();
			vi.spyOn(latencyStore, 'save').mockReturnValue();

			const userStore = useUserStore();
			await userStore.trackPage(page);

			expect((userStore.currentUser as User)?.last_page).not.toBe(page);
		});

		test('should set last_page if there is current user', async () => {
			const latencyStore = useLatencyStore();
			vi.spyOn(latencyStore, 'save').mockReturnValue();

			const userStore = useUserStore();
			await userStore.hydrate();
			await userStore.trackPage(page);

			expect((userStore.currentUser as User).last_page).toBe(page);
		});
	});
});
