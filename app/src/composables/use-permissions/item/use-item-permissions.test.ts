import { useCollection } from '@directus/composables';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { ref } from 'vue';
import { useItemPermissions } from './use-item-permissions';
import { mockedStore } from '@/__utils__/store';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

vi.mock('@directus/composables');

let sample: { collection: string; primaryKey: string };

beforeEach(() => {
	setActivePinia(createTestingPinia({ createSpy: vi.fn }));

	sample = { collection: 'test_collection', primaryKey: '1' };

	vi.mocked(useCollection).mockReturnValue({ fields: ref([]), info: ref({}) } as any);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('isVersion', () => {
	beforeEach(() => {
		const userStore = mockedStore(useUserStore());
		userStore.isAdmin = false;

		const permissionsStore = mockedStore(usePermissionsStore());
		permissionsStore.getPermission.mockReturnValue(null);
	});

	it('should allow update for versions regardless of store permissions', () => {
		const { updateAllowed } = useItemPermissions(sample.collection, sample.primaryKey, false, true);

		expect(updateAllowed.value).toBe(true);
	});

	it('should not bypass delete/share permissions for versions', () => {
		const { deleteAllowed, shareAllowed } = useItemPermissions(sample.collection, sample.primaryKey, false, true);

		expect(deleteAllowed.value).toBe(false);
		expect(shareAllowed.value).toBe(false);
	});

	it('should not bypass update permission for new items even when isVersion is true', () => {
		const { updateAllowed } = useItemPermissions(sample.collection, sample.primaryKey, true, true);

		expect(updateAllowed.value).toBe(false);
	});
});
