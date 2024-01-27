import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { randomIdentifier, randomUUID } from '@directus/random';
import { Permission, User } from '@directus/types';
import { isCreateAllowed } from './is-create-allowed';

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
		collection: randomIdentifier(),
		user: { id: randomUUID() },
		role: { id: randomUUID() },
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('admin users', () => {
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

		const result = isCreateAllowed(sample.collection);

		expect(result.value).toBe(true);
	});
});

describe('non-admin users', () => {
	it('should be disallowed if user has no create permission', () => {
		const mockUser = {
			id: sample.user.id,
			role: {
				id: sample.role.id,
				admin_access: false,
			},
		} as User;

		const userStore = useUserStore();
		userStore.currentUser = mockUser;

		const result = isCreateAllowed(sample.collection);

		expect(result.value).toBe(false);
	});

	it('should be allowed if user has create permission', () => {
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
				action: 'create',
				permissions: null,
				validation: null,
				presets: null,
				fields: ['*'],
			},
		];

		const permissionsStore = usePermissionsStore();
		permissionsStore.permissions = mockPermissions;

		const result = isCreateAllowed(sample.collection);

		expect(result.value).toBe(true);
	});
});
