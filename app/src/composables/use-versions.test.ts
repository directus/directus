import type { ContentVersion } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
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

vi.mock('@/utils/validate-item', () => ({
	validateItem: vi.fn(() => []),
}));

vi.mock('@/utils/merge-item-data', () => ({
	mergeItemData: vi.fn((_defaults: any, _item: any, edits: any) => edits),
}));

vi.mock('@/utils/push-group-options-down', () => ({
	pushGroupOptionsDown: vi.fn(() => []),
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

		it('should set currentVersion to null after promoting a Draft version', async () => {
			const existingDraftVersion: ContentVersion = {
				id: 'draft-id',
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

			const { versions, currentVersion, deleteVersion } = useVersions(ref('test_collection'), ref(true), ref('1'));

			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			// Select the draft version
			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;
			expect(currentVersion.value).not.toBeNull();
			expect(currentVersion.value?.type).toBe('global');

			deleteVersion(true);

			expect(currentVersion.value).toBeNull();
		});

		it('should keep currentVersion as Draft when discarding edits', async () => {
			const existingDraftVersion: ContentVersion = {
				id: 'draft-id',
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

			const { versions, currentVersion, deleteVersion } = useVersions(ref('test_collection'), ref(true), ref('1'));

			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			// Select the draft version
			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;
			expect(currentVersion.value).not.toBeNull();
			expect(currentVersion.value?.type).toBe('global');

			deleteVersion(false);

			// currentVersion should remain non-null (Draft stays selected, re-created as virtual)
			expect(currentVersion.value).not.toBeNull();
			expect(currentVersion.value?.key).toBe('draft');
		});
	});

	describe('saveVersion', () => {
		it('should use actualPrimaryKey for new version creation on singletons', async () => {
			const { saveVersion, currentVersion, versions } = useVersions(ref('singleton_collection'), ref(true), ref(null));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			currentVersion.value = versions.value.find((v) => v.key === 'draft')!;

			vi.mocked(api.post)
				.mockResolvedValueOnce({ data: { data: { id: 'new-version-id' } } })
				.mockResolvedValueOnce({ data: { data: { title: 'saved' } } });

			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } });

			const actualPrimaryKey = 1;
			await saveVersion(ref({ title: 'Updated' }), ref({ id: 1, title: 'Original' }), actualPrimaryKey);

			expect(vi.mocked(api.post).mock.calls[0]).toEqual([
				'/versions',
				{ key: 'draft', collection: 'singleton_collection', item: '1' },
			]);
		});

		it('should return early when actualPrimaryKey is null', async () => {
			const { saveVersion, currentVersion, versions } = useVersions(ref('singleton_collection'), ref(true), ref(null));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			currentVersion.value = versions.value.find((v) => v.key === 'draft')!;

			const actualPrimaryKey = null;
			await saveVersion(ref({ title: 'Updated' }), ref({ id: 1, title: 'Original' }), actualPrimaryKey);

			expect(api.post).not.toHaveBeenCalled();
		});
	});
});
