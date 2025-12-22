import { mockedStore } from '@/__utils__/store';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { ActionPermission } from '@/types/permissions';
import { useCollection } from '@directus/composables';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { isFieldAllowed } from '../../utils/is-field-allowed';
import { isSortAllowed } from './is-sort-allowed';

vi.mock('@directus/composables');
vi.mock('../../utils/is-field-allowed');

let sample: {
	collection: string;
	sortField: string;
};

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);

	sample = {
		collection: 'test_collection',
		sortField: 'test_sort_field',
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

const sharedTests = () => {
	it('should be disallowed if no collection is given', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref(null) } as any);

		const result = isSortAllowed(null);

		expect(result.value).toBe(false);
	});

	it('should be disallowed if collection has no sort field', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref({}) } as any);

		const result = isSortAllowed(sample.collection);

		expect(result.value).toBe(false);
	});
};

describe('admin users', () => {
	beforeEach(() => {
		const userStore = mockedStore(useUserStore());
		userStore.isAdmin = true;
	});

	sharedTests();

	it('should be allowed for admin if collection has sort field', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref({ meta: { sort_field: sample.sortField } }) } as any);

		const result = isSortAllowed(sample.collection);

		expect(result.value).toBe(true);
	});
});

describe('non-admin users', () => {
	beforeEach(() => {
		const userStore = mockedStore(useUserStore());
		userStore.isAdmin = false;
	});

	sharedTests();

	it('should be disallowed if collection has no sort field', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref({}) } as any);

		const result = isSortAllowed(sample.collection);

		expect(result.value).toBe(false);
	});

	it('should be disallowed if user has no permission', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref({ meta: { sort_field: sample.sortField } }) } as any);

		const permissionsStore = mockedStore(usePermissionsStore());
		permissionsStore.getPermission.mockReturnValue(null);

		const result = isSortAllowed(sample.collection);

		expect(result.value).toBe(false);
	});

	it('should be disallowed if user has no field permission', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref({ meta: { sort_field: sample.sortField } }) } as any);

		const permissionsStore = mockedStore(usePermissionsStore());
		permissionsStore.getPermission.mockReturnValue({} as ActionPermission);

		vi.mocked(isFieldAllowed).mockReturnValue(false);

		const result = isSortAllowed(sample.collection);

		expect(result.value).toBe(false);
	});

	it('should be allowed if user has permission', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref({ meta: { sort_field: sample.sortField } }) } as any);

		const permissionsStore = mockedStore(usePermissionsStore());
		permissionsStore.getPermission.mockReturnValue({} as ActionPermission);

		vi.mocked(isFieldAllowed).mockReturnValue(true);

		const result = isSortAllowed(sample.collection);

		expect(result.value).toBe(true);
	});
});
