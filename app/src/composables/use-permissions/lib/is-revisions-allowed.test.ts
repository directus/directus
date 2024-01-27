import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { randomUUID } from '@directus/random';
import { Permission, User } from '@directus/types';
import { isRevisionsAllowed } from './is-revisions-allowed';

let sample: {
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

		const result = isRevisionsAllowed();

		expect(result.value).toBe(true);
	});
});

describe('non-admin users', () => {
	it('should be disallowed if user has no read permission', () => {
		const mockUser = {
			id: sample.user.id,
			role: {
				id: sample.role.id,
				admin_access: false,
			},
		} as User;

		const userStore = useUserStore();
		userStore.currentUser = mockUser;

		const result = isRevisionsAllowed();

		expect(result.value).toBe(false);
	});

	it('should be allowed if user has read permission', () => {
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
				collection: 'directus_revisions',
				action: 'read',
				permissions: null,
				validation: null,
				presets: null,
				fields: ['*'],
			},
		];

		const permissionsStore = usePermissionsStore();
		permissionsStore.permissions = mockPermissions;

		const result = isRevisionsAllowed();

		expect(result.value).toBe(true);
	});
});
