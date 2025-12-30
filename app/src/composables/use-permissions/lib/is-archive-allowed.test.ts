import { isArchiveAllowed } from './is-archive-allowed';
import { isFieldAllowed } from '../utils/is-field-allowed';
import { mockedStore } from '@/__utils__/store';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { useCollection } from '@directus/composables';
import { Permission } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

vi.mock('@directus/composables');
vi.mock('../utils/is-field-allowed');

let sample: {
	collection: string;
	archiveField: string;
};

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);

	sample = {
		collection: 'test_collection',
		archiveField: 'archive_field',
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

const sharedTests = () => {
	it('should be disallowed if no collection is given', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref(null) } as any);

		const updateAllowed = true;

		const result = isArchiveAllowed(
			null,
			computed(() => updateAllowed),
		);

		expect(result.value).toBe(false);
	});

	it('should be disallowed if collection has no archive field', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref({}) } as any);

		const updateAllowed = true;

		const result = isArchiveAllowed(
			sample.collection,
			computed(() => updateAllowed),
		);

		expect(result.value).toBe(false);
	});
};

describe('admin users', () => {
	beforeEach(() => {
		const userStore = mockedStore(useUserStore());
		userStore.isAdmin = true;
	});

	sharedTests();

	it('should be allowed for admin if collection has archive field', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref({ meta: { archive_field: sample.archiveField } }) } as any);

		const updateAllowed = true;

		const result = isArchiveAllowed(
			sample.collection,
			computed(() => updateAllowed),
		);

		expect(result.value).toBe(true);
	});
});

describe('non-admin users', () => {
	beforeEach(() => {
		const userStore = mockedStore(useUserStore());
		userStore.isAdmin = false;
	});

	sharedTests();

	it('should be disallowed if user has no permission', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref({ meta: { archive_field: sample.archiveField } }) } as any);

		const permissionsStore = mockedStore(usePermissionsStore());
		permissionsStore.getPermission.mockReturnValue(null);

		const updateAllowed = true;

		const result = isArchiveAllowed(
			sample.collection,
			computed(() => updateAllowed),
		);

		expect(result.value).toBe(false);
	});

	it('should be disallowed if user has no field permission', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref({ meta: { archive_field: sample.archiveField } }) } as any);

		const permissionsStore = mockedStore(usePermissionsStore());
		permissionsStore.getPermission.mockReturnValue({} as Permission);

		vi.mocked(isFieldAllowed).mockReturnValue(false);

		const updateAllowed = true;

		const result = isArchiveAllowed(
			sample.collection,
			computed(() => updateAllowed),
		);

		expect(result.value).toBe(false);
	});

	it('should be disallowed if user has no update permission', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref({ meta: { archive_field: sample.archiveField } }) } as any);

		const permissionsStore = mockedStore(usePermissionsStore());
		permissionsStore.getPermission.mockReturnValue({} as Permission);

		vi.mocked(isFieldAllowed).mockReturnValue(true);

		const updateAllowed = false;

		const result = isArchiveAllowed(
			sample.collection,
			computed(() => updateAllowed),
		);

		expect(result.value).toBe(false);
	});

	it('should be allowed if user has update permission', () => {
		vi.mocked(useCollection).mockReturnValue({ info: ref({ meta: { archive_field: sample.archiveField } }) } as any);

		const permissionsStore = mockedStore(usePermissionsStore());
		permissionsStore.getPermission.mockReturnValue({} as Permission);

		vi.mocked(isFieldAllowed).mockReturnValue(true);

		const updateAllowed = true;

		const result = isArchiveAllowed(
			sample.collection,
			computed(() => updateAllowed),
		);

		expect(result.value).toBe(true);
	});
});
