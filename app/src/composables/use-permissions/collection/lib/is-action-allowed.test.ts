import { mockedStore } from '@/__utils__/store';
import { usePermissionsStore } from '@/stores/permissions';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, expect, it, describe, vi } from 'vitest';
import { isActionAllowed } from './is-action-allowed';

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
		const result = isActionAllowed(null, testAction);

		expect(result.value).toBe(false);
	});

	it('should be disallowed if user has no permission', () => {
		const permissionsStore = mockedStore(usePermissionsStore());

		permissionsStore.hasPermission.mockImplementation((collection, action) => {
			if (collection === sample.collection && action === testAction) return false;
			return true;
		});

		const result = isActionAllowed(sample.collection, testAction);

		expect(result.value).toBe(false);
	});

	it('should be allowed if user has permission', () => {
		const permissionsStore = mockedStore(usePermissionsStore());

		permissionsStore.hasPermission.mockImplementation((collection, action) => {
			if (collection === sample.collection && action === testAction) return true;
			return false;
		});

		const result = isActionAllowed(sample.collection, testAction);

		expect(result.value).toBe(true);
	});
});
