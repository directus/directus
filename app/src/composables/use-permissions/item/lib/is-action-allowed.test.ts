import { ItemPermissions } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, Ref } from 'vue';
import { isActionAllowed } from './is-action-allowed';
import { mockedStore } from '@/__utils__/store';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { ActionPermission } from '@/types/permissions';

let sample: {
	collection: string;
};

const fetchedItemPermissionsSpy = vi.fn();
let fetchedItemPermissions: Ref<ItemPermissions>;

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);

	sample = {
		collection: 'test_collection',
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

const sharedTests = (action: (typeof actions)[number]) => {
	it('should be disallowed if no collection is given', () => {
		const isNew = false;

		const result = isActionAllowed(null, isNew, fetchedItemPermissions, action);

		expect(result.value).toBe(false);
		expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
	});

	it('should be disallowed if item is new', () => {
		const isNew = true;

		const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

		expect(result.value).toBe(false);
		expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
	});
};

describe('admin users', () => {
	beforeEach(() => {
		const userStore = mockedStore(useUserStore());
		userStore.isAdmin = true;
	});

	describe.each(actions)('%s', (action) => {
		sharedTests(action);

		it('should be allowed if item is not new', () => {
			const isNew = false;

			const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

			expect(result.value).toBe(true);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});
	});
});

describe('non-admin users', () => {
	beforeEach(() => {
		const userStore = mockedStore(useUserStore());
		userStore.isAdmin = false;
	});

	describe.each(actions)('%s', (action) => {
		sharedTests(action);

		it('should be disallowed if item is new', () => {
			const isNew = true;

			const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

			expect(result.value).toBe(false);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});

		it('should be disallowed if no permissions are configured', () => {
			const permissionsStore = mockedStore(usePermissionsStore());
			permissionsStore.getPermission.mockReturnValue(null);

			const isNew = false;

			const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

			expect(result.value).toBe(false);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});

		it('should be disallowed if user has no permission', () => {
			const permissionsStore = mockedStore(usePermissionsStore());
			permissionsStore.getPermission.mockReturnValue({ access: 'none' } as ActionPermission);

			const isNew = false;

			const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

			expect(result.value).toBe(false);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});

		it('should be allowed if user has full permission', () => {
			const permissionsStore = mockedStore(usePermissionsStore());
			permissionsStore.getPermission.mockReturnValue({ access: 'full' } as ActionPermission);

			const isNew = false;

			const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

			expect(result.value).toBe(true);
			expect(fetchedItemPermissionsSpy).not.toHaveBeenCalled();
		});

		it('should check item-based permission for conditional permission rules', () => {
			const permissionsStore = mockedStore(usePermissionsStore());
			permissionsStore.getPermission.mockReturnValue({ access: 'partial' } as ActionPermission);

			const isNew = false;

			const result = isActionAllowed(sample.collection, isNew, fetchedItemPermissions, action);

			expect(result.value).toBe(true);
			expect(fetchedItemPermissionsSpy).toHaveBeenCalled();
		});
	});
});
