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
		  vi.mocked(api.post).mockResolvedValueOnce({ data: { data: {} } });

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
		  vi.mocked(api.post).mockResolvedValueOnce({ data: { data: {} } });

		  const { publishVersion } = useVersions(ref('test_collection'), ref(false), ref('1'));
		  await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

		  await publishVersion('version-123', { mainHash: 'hash-abc' });

		  expect(api.post).toHaveBeenCalledWith('/versions/version-123/promote', { mainHash: 'hash-abc' });
		});

		it('should set publishVersionLoading to true while publishing and false after', async () => {
		  vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } });

		  let resolvePost!: () => void;

		  vi.mocked(api.post).mockReturnValueOnce(
			new Promise((resolve) => {
			  resolvePost = () => resolve({ data: { data: {} } } as any);
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

	  describe('removeVersion', () => {
		it('should call DELETE /versions/{id} and remove from rawVersions', async () => {
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
		  vi.mocked(api.delete).mockResolvedValueOnce({});

		  const { versions, currentVersion, removeVersion } = useVersions(
			ref('test_collection'),
			ref(false),
			ref('1'),
		  );

		  await vi.waitFor(() => expect(api.get).toHaveBeenCalled());

		  currentVersion.value = versions.value.find((v) => v.key === 'draft') ?? null;
		  expect(currentVersion.value).not.toBeNull();

		  await removeVersion('version-123');

		  expect(api.delete).toHaveBeenCalledWith('/versions/version-123');
		  expect(currentVersion.value).toBeNull();
		  // draft should now be virtual (id '+')
		  expect(versions.value.find((v) => v.key === 'draft')?.id).toBe('+');
		});
	  });
});
