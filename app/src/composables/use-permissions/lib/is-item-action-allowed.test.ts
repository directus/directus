import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { randomIdentifier, randomUUID } from '@directus/random';
import { ItemPermissions, Permission, User } from '@directus/types';
import { Ref, computed } from 'vue';
import { isItemActionAllowed } from './is-item-action-allowed';

let sample: {
	collection: string;
	user: { id: string };
	role: { id: string };
};

const fetchedItemPermissionsSpy = vi.fn();
let fetchedItemPermissions: Ref<ItemPermissions>;

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);

	sample = {
		collection: randomIdentifier(),
		user: { id: randomUUID() },
		role: { id: randomUUID() },
	};

	fetchedItemPermissions = computed(() => {
		fetchedItemPermissionsSpy();
		return {
			update: {
				access: true,
			},
			delete: {
				access: true,
			},
			share: {
				access: true,
			},
		};
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

const actions = ['update', 'delete', 'share'] as const;

describe('admin users', () => {
	describe.each(actions)('%s', (action) => {
		it('should always be allowed', () => {
			const mockUser = {
				id: sample.user.id,
				role: {
					id: sample.role.id,
					admin_access: true,
				},
			} as User;

			const userStore = useUserStore();
			userStore.currentUser = mockUser;

			const result = isItemActionAllowed(sample.collection, action, fetchedItemPermissions);

			expect(result.value).toBe(true);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});
	});
});

describe('non-admin users', () => {
	describe.each(actions)('%s', (action) => {
		it('should be disallowed if user has no permission', () => {
			const mockUser = {
				id: sample.user.id,
				role: {
					id: sample.role.id,
					admin_access: false,
				},
			} as User;

			const userStore = useUserStore();
			userStore.currentUser = mockUser;

			const result = isItemActionAllowed(sample.collection, action, fetchedItemPermissions);

			expect(result.value).toBe(false);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});

		it('should be allowed if user has full permission', () => {
			const mockUser = {
				id: sample.user.id,
				role: {
					id: sample.role.id,
					admin_access: false,
				},
			} as User;

			const userStore = useUserStore();
			userStore.currentUser = mockUser;

			const mockPermissions: [Permission] = [
				{
					role: sample.role.id,
					collection: sample.collection,
					action,
					permissions: null,
					validation: null,
					presets: null,
					fields: ['*'],
				},
			];

			const permissionsStore = usePermissionsStore();
			permissionsStore.permissions = mockPermissions;

			const result = isItemActionAllowed(sample.collection, action, fetchedItemPermissions);

			expect(result.value).toBe(true);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});

		it('should check item-based permission for conditional permission rules', () => {
			const mockUser = {
				id: sample.user.id,
				role: {
					id: sample.role.id,
					admin_access: false,
				},
			} as User;

			const userStore = useUserStore();
			userStore.currentUser = mockUser;

			const mockPermissions: [Permission] = [
				{
					role: sample.role.id,
					collection: sample.collection,
					action,
					permissions: { _and: { example: { _eq: 'example' } } },
					validation: null,
					presets: null,
					fields: ['*'],
				},
			];

			const permissionsStore = usePermissionsStore();
			permissionsStore.permissions = mockPermissions;

			const result = isItemActionAllowed(sample.collection, action, fetchedItemPermissions);

			expect(result.value).toBe(true);
			expect(fetchedItemPermissionsSpy).toHaveBeenCalled();
		});
	});
});
