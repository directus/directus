import { randBoolean } from '@ngneat/falso';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import api from '@/api';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { useCollection } from '@directus/composables';
import { randomIdentifier, randomUUID } from '@directus/random';
import { ItemPermissions, Permission, User } from '@directus/types';
import { ref } from 'vue';
import { useItemPermissions } from './item';

vi.mock('@directus/composables');

let sample: {
	collection: string;
	primaryKey: string;
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
		primaryKey: randomUUID(),
		user: { id: randomUUID() },
		role: { id: randomUUID() },
	};

	vi.mocked(useCollection).mockReturnValue({ info: ref({}) } as any);
});

afterEach(() => {
	vi.clearAllMocks();
});

it('should fetch item permissions only once for all actions', async () => {
	const mockUser = {
		id: sample.user.id,
		role: {
			id: sample.role.id,
			admin_access: false,
		},
	} as User;

	const userStore = useUserStore();
	userStore.currentUser = mockUser;

	const mockPermissions: Permission[] = [
		{
			role: sample.role.id,
			collection: sample.collection,
			action: 'update',
			permissions: { _and: { example: { _eq: 'example' } } },
			validation: null,
			presets: null,
			fields: ['*'],
		},
		{
			role: sample.role.id,
			collection: sample.collection,
			action: 'delete',
			permissions: { _and: { example: { _eq: 'example' } } },
			validation: null,
			presets: null,
			fields: ['*'],
		},
		{
			role: sample.role.id,
			collection: sample.collection,
			action: 'share',
			permissions: { _and: { example: { _eq: 'example' } } },
			validation: null,
			presets: null,
			fields: ['*'],
		},
	];

	const permissionsStore = usePermissionsStore();
	permissionsStore.permissions = mockPermissions;

	const itemPermissions: ItemPermissions = {
		update: {
			access: randBoolean(),
		},
		delete: {
			access: randBoolean(),
		},
		share: {
			access: randBoolean(),
		},
	};

	const spy = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: itemPermissions } });

	const { updateAllowed, deleteAllowed, shareAllowed } = useItemPermissions(sample.collection, sample.primaryKey);

	// first render
	expect(updateAllowed.value).toBe(false);
	expect(deleteAllowed.value).toBe(false);
	expect(shareAllowed.value).toBe(false);

	await flushPromises();

	expect(updateAllowed.value).toBe(itemPermissions.update.access);
	expect(deleteAllowed.value).toBe(itemPermissions.delete.access);
	expect(shareAllowed.value).toBe(itemPermissions.share.access);

	expect(spy).toHaveBeenCalledTimes(1);
});
