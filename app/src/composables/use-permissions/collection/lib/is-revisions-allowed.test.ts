import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { isRevisionsAllowed } from './is-revisions-allowed';
import { mockedStore } from '@/__utils__/store';
import { usePermissionsStore } from '@/stores/permissions';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

it('should be disallowed if user has no read permission on directus_revisions', () => {
	const permissionsStore = mockedStore(usePermissionsStore());

	permissionsStore.hasPermission.mockImplementation((collection, action) => {
		if (collection === 'directus_revisions' && action === 'read') return false;
		return true;
	});

	const result = isRevisionsAllowed();

	expect(result.value).toBe(false);
});

it('should be allowed if user has read permission on directus_revisions', () => {
	const permissionsStore = mockedStore(usePermissionsStore());

	permissionsStore.hasPermission.mockImplementation((collection, action) => {
		if (collection === 'directus_revisions' && action === 'read') return true;
		return false;
	});

	const result = isRevisionsAllowed();

	expect(result.value).toBe(true);
});
