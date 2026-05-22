import type { ContentVersion } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
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

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
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

	describe('deleteVersion', () => {
		it('should call DELETE /versions/{id} and remove from rawVersions', async () => {
			const existingVersion: ContentVersion = {
				id: 'version-123',
				key: 'my-version',
				name: 'My Version',
				collection: 'test_collection',
				item: '1',
				hash: 'abc123',
				date_created: '2024-01-01',
				date_updated: '2024-01-02',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [existingVersion] } });
			vi.mocked(api.delete).mockResolvedValueOnce({});

			const { versions, deleteVersion } = useVersions(ref('test_collection'), ref(false), ref('1'));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			await deleteVersion('version-123');

			expect(api.delete).toHaveBeenCalledWith('/versions/version-123');
			expect(versions.value.find((v) => v.key === 'my-version')).toBeUndefined();
		});

		it('should clear currentVersion when it matches the deleted version', async () => {
			const existingVersion: ContentVersion = {
				id: 'version-123',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: '1',
				hash: 'abc123',
				date_created: '2024-01-01',
				date_updated: '2024-01-02',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [existingVersion] } });
			vi.mocked(api.delete).mockResolvedValueOnce({});

			const { versions, currentVersion, deleteVersion } = useVersions(ref('test_collection'), ref(true), ref('1'));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;
			expect(currentVersion.value).not.toBeNull();

			await deleteVersion('version-123');

			expect(currentVersion.value).toBeNull();
		});

		it('should toggle deleteVersionLoading during the API call', async () => {
			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } });

			let resolveDelete!: () => void;

			vi.mocked(api.delete).mockReturnValueOnce(
				new Promise((resolve) => {
					resolveDelete = () => resolve({} as any);
				}),
			);

			const { deleteVersion, deleteVersionLoading } = useVersions(ref('test_collection'), ref(false), ref('1'));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			const deletePromise = deleteVersion('version-123');
			expect(deleteVersionLoading.value).toBe(true);

			resolveDelete();
			await deletePromise;

			expect(deleteVersionLoading.value).toBe(false);
		});

		it('should handle errors via unexpectedError and re-throw', async () => {
			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } });

			const error = new Error('API error');
			vi.mocked(api.delete).mockRejectedValueOnce(error);

			const { deleteVersion, deleteVersionLoading } = useVersions(ref('test_collection'), ref(false), ref('1'));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			await expect(deleteVersion('version-123')).rejects.toThrow('API error');
			expect(deleteVersionLoading.value).toBe(false);
		});
	});

	describe('primary key resolution', () => {
		it('should load existing versions for an existing singleton via the resolved primary key', async () => {
			vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });

			const primaryKey = ref<string | number | null>(null);

			useVersions(ref('singleton_collection'), ref(true), primaryKey);

			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			// Simulate the singleton item loading and reporting PK=1
			primaryKey.value = 1;

			await vi.waitFor(() =>
				expect(api.get).toHaveBeenLastCalledWith(
					'/versions',
					expect.objectContaining({
						params: expect.objectContaining({
							filter: {
								_and: [{ collection: { _eq: 'singleton_collection' } }, { item: { _eq: '1' } }],
							},
						}),
					}),
				),
			);
		});
	});

	describe('saveVersion', () => {
		it('should use the resolved primary key for new version creation on singletons', async () => {
			const { saveVersion, currentVersion, versions } = useVersions(ref('singleton_collection'), ref(true), ref(1));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			currentVersion.value = versions.value.find((v) => v.key === 'draft')!;

			vi.mocked(api.post)
				.mockResolvedValueOnce({ data: { data: { id: 'new-version-id' } } })
				.mockResolvedValueOnce({ data: { data: { title: 'saved' } } });

			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } });

			await saveVersion(ref({ title: 'Updated' }), ref({ id: 1, title: 'Original' }));

			expect(vi.mocked(api.post).mock.calls[0]).toEqual([
				'/versions',
				{ key: 'draft', collection: 'singleton_collection', item: '1' },
			]);
		});

		it('should create an item-less draft when primary key is + on a pristine singleton', async () => {
			const { saveVersion, currentVersion, versions } = useVersions(ref('singleton_collection'), ref(true), ref('+'));

			currentVersion.value = versions.value.find((v) => v.key === 'draft')!;

			vi.mocked(api.post)
				.mockResolvedValueOnce({ data: { data: { id: 'new-version-id' } } })
				.mockResolvedValueOnce({ data: { data: { title: 'saved' } } });

			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } });

			await saveVersion(ref({ title: 'Updated' }), ref(null));

			expect(vi.mocked(api.post).mock.calls[0]).toEqual([
				'/versions',
				{ key: 'draft', collection: 'singleton_collection', item: null },
			]);
		});

		it('should return early for non-singleton collections with null primary key', async () => {
			const { saveVersion, currentVersion, versions } = useVersions(ref('test_collection'), ref(false), ref(null));

			currentVersion.value = versions.value.find((v) => v.key === 'draft')!;

			await saveVersion(ref({ title: 'Updated' }), ref({ id: 1 }));

			expect(api.post).not.toHaveBeenCalled();
		});

		it('should save successfully even when required fields are missing (no client-side validation)', async () => {
			// Arrange: mock a version that exists on the server
			const existingVersion: ContentVersion = {
				id: 'version-123',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: '1',
				hash: 'abc',
				date_created: '2024-01-01',
				date_updated: '2024-01-01',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			// getVersions response
			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [existingVersion] } });
			// saveVersion POST response
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { title: null } } });

			const { versions, currentVersion, saveVersion, validationErrors } = useVersions(
				ref('test_collection'),
				ref(false),
				ref('1'),
			);

			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());
			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;

			const edits = ref<Record<string, any>>({ title: null }); // missing required field
			const item = ref<Record<string, any>>({ id: '1', title: 'existing' });

			// Act: should NOT throw even though 'title' is null
			await expect(saveVersion(edits, item)).resolves.not.toThrow();
			expect(validationErrors.value).toHaveLength(0);
		});

		it('should call the save API endpoint with the edits', async () => {
			const existingVersion: ContentVersion = {
				id: 'version-123',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: '1',
				hash: 'abc',
				date_created: '2024-01-01',
				date_updated: '2024-01-01',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [existingVersion] } });
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { title: 'new value' } } });
			// second api.get for getVersions refresh after save
			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [existingVersion] } });

			const { versions, currentVersion, saveVersion } = useVersions(ref('test_collection'), ref(false), ref('1'));

			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());
			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;

			const edits = ref<Record<string, any>>({ title: 'new value' });
			const item = ref<Record<string, any>>({ id: '1', title: 'old value' });

			await saveVersion(edits, item);

			expect(api.post).toHaveBeenCalledWith('/versions/version-123/save', { title: 'new value' });
		});

		it('should append ?patchRevision when opts.patchRevision is true', async () => {
			const existingVersion: ContentVersion = {
				id: 'version-123',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: '1',
				hash: 'abc',
				date_created: '2024-01-01',
				date_updated: '2024-01-01',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [existingVersion] } });
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { title: 'new value' } } });
			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [existingVersion] } });

			const { versions, currentVersion, saveVersion } = useVersions(ref('test_collection'), ref(false), ref('1'));

			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());
			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;

			const edits = ref<Record<string, any>>({ title: 'new value' });
			const item = ref<Record<string, any>>({ id: '1', title: 'old value' });

			await saveVersion(edits, item, { patchRevision: true });

			expect(api.post).toHaveBeenCalledWith('/versions/version-123/save?patchRevision', { title: 'new value' });
		});

		it('should omit ?patchRevision for brand-new versions even if opts.patchRevision is true', async () => {
			const createdVersion: ContentVersion = {
				id: 'version-new',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: '1',
				hash: 'abc',
				date_created: '2024-01-01',
				date_updated: '2024-01-01',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			// POST /versions (create version)
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: createdVersion } });
			// POST /versions/:id/save
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { title: 'new value' } } });

			const { saveVersion, currentVersion, versions } = useVersions(ref('test_collection'), ref(false), ref('+'));

			currentVersion.value = versions.value.find((v) => v.id === '+') ?? null;

			const edits = ref<Record<string, any>>({ title: 'new value' });
			const item = ref<Record<string, any>>({ id: '1', title: 'old value' });

			await saveVersion(edits, item, { patchRevision: true });

			expect(api.post).toHaveBeenCalledWith('/versions/version-new/save', { title: 'new value' });
		});
	});

	describe('publishVersion', () => {
		it('should call POST /versions/{id}/promote with mainHash and fields', async () => {
			const existingVersion: ContentVersion = {
				id: 'version-123',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: '1',
				hash: 'abc',
				date_created: '2024-01-01',
				date_updated: '2024-01-01',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [existingVersion] } });
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: '1' } });

			const { publishVersion } = useVersions(ref('test_collection'), ref(false), ref('1'));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			await publishVersion('version-123', { mainHash: 'hash-abc', fields: ['title', 'body'] });

			expect(api.post).toHaveBeenCalledWith('/versions/version-123/promote', {
				mainHash: 'hash-abc',
				fields: ['title', 'body'],
			});
		});

		it('should call POST /versions/{id}/promote without fields when not provided', async () => {
			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } });
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: '1' } });

			const { publishVersion } = useVersions(ref('test_collection'), ref(false), ref('1'));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			await publishVersion('version-123', { mainHash: 'hash-abc' });

			expect(api.post).toHaveBeenCalledWith('/versions/version-123/promote', { mainHash: 'hash-abc' });
		});

		it('should call POST /versions/{id}/promote with empty body for item-less drafts', async () => {
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: 'new-item-key' } });

			// primaryKey='+' skips getVersions(), so no api.get mock needed
			const { publishVersion } = useVersions(ref('test_collection'), ref(false), ref('+'));

			const result = await publishVersion('draft-uuid', {});

			expect(api.post).toHaveBeenCalledWith('/versions/draft-uuid/promote', {});
			expect(result).toBe('new-item-key');
		});

		it('should return the created item key after promoting an item-less draft', async () => {
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: 42 } });

			// primaryKey='+' skips getVersions(), so no api.get mock needed
			const { publishVersion } = useVersions(ref('test_collection'), ref(false), ref('+'));

			const result = await publishVersion('draft-uuid', {});

			expect(result).toBe(42);
		});

		it('should set publishVersionLoading to true while publishing and false after', async () => {
			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } });

			let resolvePost!: () => void;

			vi.mocked(api.post).mockReturnValueOnce(
				new Promise((resolve) => {
					resolvePost = () => resolve({ data: { data: '1' } } as any);
				}),
			);

			const { publishVersion, publishVersionLoading } = useVersions(ref('test_collection'), ref(false), ref('1'));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			const publishPromise = publishVersion('version-123', { mainHash: 'hash-abc' });
			expect(publishVersionLoading.value).toBe(true);

			resolvePost();
			await publishPromise;

			expect(publishVersionLoading.value).toBe(false);
		});
	});

	describe('saveVersion (item-less draft)', () => {
		it('should POST /versions with item: null when primaryKey is "+"', async () => {
			const createdVersion: ContentVersion = {
				id: 'new-version-uuid',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: null as any,
				hash: null as any,
				date_created: '2024-01-01',
				date_updated: '2024-01-01',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			// getVersions is skipped for '+' without queryVersionId, so no initial GET mock needed
			// POST /versions (create version)
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: createdVersion } });
			// POST /versions/:id/save
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { title: 'My Draft' } } });

			const { versions, currentVersion, saveVersion } = useVersions(ref('test_collection'), ref(false), ref('+'));

			// Set synthetic draft version as current
			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;
			expect(currentVersion.value?.id).toBe('+');

			const edits = ref<Record<string, any>>({ title: 'My Draft' });
			const item = ref<Record<string, any> | null>(null);

			await saveVersion(edits, item);

			expect(api.post).toHaveBeenCalledWith('/versions', {
				key: 'draft',
				collection: 'test_collection',
				item: null,
			});
		});

		it('should populate item ref with savedData after saving an item-less draft', async () => {
			const createdVersion: ContentVersion = {
				id: 'new-version-uuid',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: null as any,
				hash: null as any,
				date_created: '2024-01-01',
				date_updated: '2024-01-01',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: createdVersion } });
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { title: 'My Draft' } } });

			const { versions, currentVersion, saveVersion } = useVersions(ref('test_collection'), ref(false), ref('+'));

			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;

			const edits = ref<Record<string, any>>({ title: 'My Draft' });
			const item = ref<Record<string, any> | null>(null);

			await saveVersion(edits, item);

			expect(item.value).toEqual({ title: 'My Draft' });
		});

		it('should refresh versions list with the newly-created item-less draft', async () => {
			const createdVersion: ContentVersion = {
				id: 'new-version-uuid',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: null as any,
				hash: null as any,
				date_created: '2024-01-01',
				date_updated: '2024-01-01',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: createdVersion } });
			vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { title: 'My Draft' } } });
			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [createdVersion] } });

			const { versions, currentVersion, saveVersion } = useVersions(ref('test_collection'), ref(false), ref('+'));

			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;

			const edits = ref<Record<string, any>>({ title: 'My Draft' });
			const item = ref<Record<string, any> | null>(null);

			await saveVersion(edits, item);

			// GET should be called to refresh the versions list scoped to the new versionId
			expect(api.get).toHaveBeenCalledWith(
				'/versions',
				expect.objectContaining({
					params: expect.objectContaining({
						filter: {
							_and: [
								{ collection: { _eq: 'test_collection' } },
								{ item: { _null: true } },
								{ id: { _eq: 'new-version-uuid' } },
							],
						},
					}),
				}),
			);
		});
	});

	describe('isItemlessVersion', () => {
		it('should be true when currentVersion has a real id and item is null', () => {
			// primaryKey='+' with no queryVersionId means getVersions returns early (no API call)
			// Just set currentVersion manually to test the computed
			const { isItemlessVersion, currentVersion } = useVersions(ref('test_collection'), ref(false), ref('+'));

			currentVersion.value = {
				id: 'version-abc',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: null,
				hash: 'abc',
				date_created: '2024-01-01',
				date_updated: '2024-01-02',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
				type: 'global',
			};

			expect(isItemlessVersion.value).toBe(true);
		});

		it('should be false when primaryKey is a real id', async () => {
			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } });

			const { isItemlessVersion } = useVersions(ref('test_collection'), ref(false), ref('1'));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			expect(isItemlessVersion.value).toBe(false);
		});

		it('should be false when currentVersion has virtual id "+"', () => {
			// primaryKey='+' with no queryVersionId means getVersions returns early
			const { isItemlessVersion, currentVersion, versions } = useVersions(ref('test_collection'), ref(false), ref('+'));

			// The virtual draft version always has id='+'
			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;
			expect(currentVersion.value?.id).toBe('+');
			expect(isItemlessVersion.value).toBe(false);
		});
	});

	describe('version-gone detection', () => {
		it('should tag error with versionGone when save returns 403 on an existing version', async () => {
			const existingVersion: ContentVersion = {
				id: 'version-123',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: '1',
				hash: 'abc123',
				date_created: '2024-01-01',
				date_updated: '2024-01-02',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [existingVersion] } });

			const { saveVersion, currentVersion, versions } = useVersions(ref('test_collection'), ref(true), ref('1'));
			await vi.waitFor(() => expect(versions.value.some((v) => v.id === 'version-123')).toBe(true));

			currentVersion.value = versions.value.find((v) => v.id === 'version-123') ?? null;
			expect(currentVersion.value?.id).toBe('version-123');

			const saveError = Object.assign(new Error('Forbidden'), {
				response: { status: 403, data: { errors: [{ extensions: { code: 'FORBIDDEN' } }] } },
			});

			vi.mocked(api.post).mockRejectedValueOnce(saveError);

			const edits = ref({ title: 'updated' });
			const item = ref({ id: '1', title: 'original' });

			await expect(saveVersion(edits, item)).rejects.toMatchObject({
				versionGone: true,
			});
		});

		it('should NOT tag error with versionGone for non-403 errors', async () => {
			const existingVersion: ContentVersion = {
				id: 'version-123',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: '1',
				hash: 'abc123',
				date_created: '2024-01-01',
				date_updated: '2024-01-02',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [existingVersion] } });

			const { saveVersion, currentVersion, versions } = useVersions(ref('test_collection'), ref(true), ref('1'));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;

			const saveError = Object.assign(new Error('Server Error'), {
				response: { status: 500, data: { errors: [{ extensions: { code: 'INTERNAL_SERVER_ERROR' } }] } },
			});

			vi.mocked(api.post).mockRejectedValueOnce(saveError);

			const edits = ref({ title: 'updated' });
			const item = ref({ id: '1', title: 'original' });

			await expect(saveVersion(edits, item)).rejects.not.toMatchObject({
				versionGone: true,
			});
		});

		it('should NOT tag error with versionGone for new (unsaved) versions', async () => {
			const { saveVersion, currentVersion, versions } = useVersions(ref('test_collection'), ref(true), ref('+'));

			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;
			expect(currentVersion.value?.id).toBe('+');

			const saveError = Object.assign(new Error('Forbidden'), {
				response: { status: 403, data: { errors: [{ extensions: { code: 'FORBIDDEN' } }] } },
			});

			vi.mocked(api.post).mockRejectedValueOnce(saveError);

			const edits = ref({ title: 'updated' });
			const item = ref(null);

			await expect(saveVersion(edits, item)).rejects.not.toMatchObject({
				versionGone: true,
			});
		});
	});

	describe('network error preserves edits', () => {
		it('should preserve edits when save fails with network error', async () => {
			const existingVersion: ContentVersion = {
				id: 'version-123',
				key: 'draft',
				name: null,
				collection: 'test_collection',
				item: '1',
				hash: 'abc123',
				date_created: '2024-01-01',
				date_updated: '2024-01-02',
				user_created: 'user-1',
				user_updated: 'user-1',
				delta: {},
			};

			vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [existingVersion] } });
			vi.mocked(api.post).mockRejectedValueOnce(new Error('Network Error'));

			const { saveVersion, currentVersion, versions } = useVersions(ref('test_collection'), ref(true), ref('1'));
			await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

			currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;

			const edits = ref({ title: 'my changes' });
			const item = ref({ id: '1', title: 'original' });

			await expect(saveVersion(edits, item)).rejects.toThrow();
			expect(edits.value).toEqual({ title: 'my changes' });
		});
	});
});
