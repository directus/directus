import { useCollection } from '@directus/composables';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isActionAllowed } from './is-action-allowed';
import { mockedStore } from '@/__utils__/store';
import { usePermissionsStore } from '@/stores/permissions';

vi.mock('@directus/composables');

let sample: {
	collection: string;
};

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);

	sample = {
		collection: 'test_collection',
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

const actions = ['create', 'read', 'update', 'delete'] as const;

describe.each(actions)('%s', (testAction) => {
	it('should be disallowed if no collection is given', () => {
		vi.mocked(useCollection).mockReturnValue({ info: { value: null } } as any);

		const result = isActionAllowed(null, testAction);

		expect(result.value).toBe(false);
	});

	it('should be disallowed if user has no permission', () => {
		vi.mocked(useCollection).mockReturnValue({ info: { value: { type: 'table' } } } as any);

		const permissionsStore = mockedStore(usePermissionsStore());

		permissionsStore.hasPermission.mockImplementation((collection, action) => {
			if (collection === sample.collection && action === testAction) return false;
			return true;
		});

		const result = isActionAllowed(sample.collection, testAction);

		expect(result.value).toBe(false);
	});

	it('should be allowed if user has permission', () => {
		vi.mocked(useCollection).mockReturnValue({ info: { value: { type: 'table' } } } as any);

		const permissionsStore = mockedStore(usePermissionsStore());

		permissionsStore.hasPermission.mockImplementation((collection, action) => {
			if (collection === sample.collection && action === testAction) return true;
			return false;
		});

		const result = isActionAllowed(sample.collection, testAction);

		expect(result.value).toBe(true);
	});

	it('should disallow create, update, and delete for views', () => {
		vi.mocked(useCollection).mockReturnValue({ info: { value: { type: 'view' } } } as any);

		const permissionsStore = mockedStore(usePermissionsStore());
		permissionsStore.hasPermission.mockReturnValue(true);

		const result = isActionAllowed(sample.collection, testAction);

		if (testAction === 'read') {
			expect(result.value).toBe(true);
		} else {
			expect(result.value).toBe(false);
		}
	});
});
