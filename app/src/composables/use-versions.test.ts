import type { ContentVersion } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import { useVersions } from './use-versions';
import api from '@/api';

vi.mock('@/api');

vi.mock('@vueuse/router', () => ({
	useRouteQuery: vi.fn(() => ref(null)),
}));

vi.mock('./use-permissions', () => ({
	useCollectionPermissions: vi.fn(() => ({
		createAllowed: ref(true),
		readAllowed: ref(true),
	})),
	usePermissions: vi.fn(() => ({
		itemPermissions: {
			fields: computed(() => []),
		},
	})),
}));

vi.mock('@/composables/use-nested-validation', () => ({
	useNestedValidation: vi.fn(() => ({
		nestedValidationErrors: ref([]),
	})),
}));

vi.mock('@/utils/get-default-values-from-fields', () => ({
	getDefaultValuesFromFields: vi.fn(() => ref({})),
}));

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);

	vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('useVersions', () => {
	describe('versions computed', () => {
		it('should always include global draft version first', async () => {
			const { versions, getVersions } = useVersions(ref('test_collection'), ref(true), ref('1'));

			await getVersions();

			expect(versions.value.length).toBeGreaterThanOrEqual(1);
			expect(versions.value[0]?.key).toBe('draft');
			expect(versions.value[0]?.type).toBe('global');
		});

		it('should create virtual draft version with id "+" when no draft version exists in the database', async () => {
			const { versions, getVersions } = useVersions(ref('test_collection'), ref(true), ref('1'));

			await getVersions();

			const draftVersion = versions.value.find((v) => v.key === 'draft');

			expect(draftVersion).toBeDefined();
			expect(draftVersion?.id).toBe('+');
			expect(draftVersion?.type).toBe('global');
		});

		it('should use existing draft version when one exists in the database', async () => {
			const existingDraftVersion: ContentVersion = {
				id: 'existing-draft-id',
				key: 'draft',
				name: 'My Draft',
				collection: 'test_collection',
				item: '1',
				hash: 'abc123',
				date_created: '2024-01-01',
				date_updated: '2024-01-02',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.get).mockResolvedValueOnce({
				data: { data: [existingDraftVersion] },
			});

			const { versions } = useVersions(ref('test_collection'), ref(true), ref('1'));

			// Wait for the immediate watch to complete
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			const draftVersion = versions.value.find((v) => v.key === 'draft');

			expect(draftVersion).toBeDefined();
			expect(draftVersion?.id).toBe('existing-draft-id');
			expect(draftVersion?.type).toBe('global');
		});

		it('should mark non-draft versions as local type', async () => {
			const localVersion: ContentVersion = {
				id: 'local-version-id',
				key: 'my-local-version',
				name: 'Local Version',
				collection: 'test_collection',
				item: '1',
				hash: 'def456',
				date_created: '2024-01-01',
				date_updated: '2024-01-02',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.get).mockResolvedValueOnce({
				data: { data: [localVersion] },
			});

			const { versions } = useVersions(ref('test_collection'), ref(true), ref('1'));

			// Wait for the immediate watch to complete
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			const foundLocalVersion = versions.value.find((v) => v.key === 'my-local-version');

			expect(foundLocalVersion).toBeDefined();
			expect(foundLocalVersion?.type).toBe('local');
		});

		it('should place draft version before local versions', async () => {
			const localVersion: ContentVersion = {
				id: 'local-version-id',
				key: 'my-local-version',
				name: 'Local Version',
				collection: 'test_collection',
				item: '1',
				hash: 'def456',
				date_created: '2024-01-01',
				date_updated: '2024-01-02',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.get).mockResolvedValueOnce({
				data: { data: [localVersion] },
			});

			const { versions } = useVersions(ref('test_collection'), ref(true), ref('1'));

			// Wait for the immediate watch to complete
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			expect(versions.value[0]?.key).toBe('draft');
			expect(versions.value[0]?.type).toBe('global');
			expect(versions.value[1]?.key).toBe('my-local-version');
			expect(versions.value[1]?.type).toBe('local');
		});

	});
});
