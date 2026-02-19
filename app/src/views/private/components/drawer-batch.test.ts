import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import DrawerBatch from './drawer-batch.vue';
import { Tooltip } from '@/__utils__/tooltip';

const mockApi = vi.hoisted(() => ({
	patch: vi.fn().mockResolvedValue({ data: {} }),
}));

const mockFetchAll = vi.hoisted(() => vi.fn().mockResolvedValue([]));

const mockFieldsStore = vi.hoisted(() => ({
	getField: vi.fn(),
	getPrimaryKeyFieldForCollection: vi.fn(),
}));

const mockRelationsStore = vi.hoisted(() => ({
	getRelationsForField: vi.fn().mockReturnValue([]),
}));

vi.mock('@/api', () => ({
	default: mockApi,
}));

vi.mock('@/utils/fetch-all', () => ({
	fetchAll: mockFetchAll,
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => mockFieldsStore,
}));

vi.mock('@/stores/relations', () => ({
	useRelationsStore: () => mockRelationsStore,
}));

vi.mock('@directus/composables', () => ({
	useCollection: () => ({
		primaryKeyField: { value: { field: 'id' } },
	}),
}));

const mockUnexpectedError = vi.hoisted(() => vi.fn());

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: mockUnexpectedError,
}));

const i18n = createI18n({
	legacy: false,
	missingWarn: false,
	locale: 'en-US',
	messages: { 'en-US': {} },
});

function mountDrawerBatch(props: Record<string, any> = {}) {
	return mount(DrawerBatch, {
		props: {
			collection: 'articles',
			primaryKeys: [1, 2],
			active: true,
			...props,
		},
		global: {
			plugins: [i18n],
			directives: { tooltip: Tooltip },
			stubs: {
				VDrawer: { template: '<div><slot /><slot name="actions" /></div>' },
				VForm: { template: '<div />' },
				PrivateViewHeaderBarActionButton: { template: '<button />' },
			},
		},
	});
}

function setupTranslationsRelation() {
	mockFieldsStore.getField.mockImplementation((_collection: string, field: string) => {
		if (field === 'translations') {
			return { meta: { special: ['translations'] } };
		}

		return { meta: { special: [] } };
	});

	mockFieldsStore.getPrimaryKeyFieldForCollection.mockImplementation((collection: string) => {
		if (collection === 'languages') return { field: 'code' };
		return { field: 'id' };
	});

	mockRelationsStore.getRelationsForField.mockReturnValue([
		{ meta: { one_field: 'translations', junction_field: 'languages_code' } },
		{ field: 'languages_code', related_collection: 'languages' },
	]);
}

afterEach(() => {
	vi.clearAllMocks();
});

describe('batch save without translations', () => {
	it('sends standard batch PATCH with keys + data', async () => {
		const wrapper = mountDrawerBatch({
			edits: { status: 'published' },
		});

		await (wrapper.vm as any).save();

		expect(mockApi.patch).toHaveBeenCalledWith('/items/articles', {
			keys: [1, 2],
			data: { status: 'published' },
		});
	});

	it('ignores non-translations CUD fields', async () => {
		mockFieldsStore.getField.mockReturnValue({ meta: { special: ['m2m'] } });

		const wrapper = mountDrawerBatch({
			edits: { tags: { create: [{ tag: 'new' }] } },
		});

		await (wrapper.vm as any).save();

		expect(mockApi.patch).toHaveBeenCalledWith('/items/articles', {
			keys: [1, 2],
			data: { tags: { create: [{ tag: 'new' }] } },
		});

		expect(mockFetchAll).not.toHaveBeenCalled();
	});
});

describe('batch save with translations', () => {
	it('merges edits onto existing translations without duplicates', async () => {
		setupTranslationsRelation();

		mockFetchAll.mockResolvedValue([
			{
				id: 1,
				translations: [
					{ id: 10, languages_code: 'en', title: 'Old EN' },
					{ id: 11, languages_code: 'fr', title: 'Old FR' },
				],
			},
			{
				id: 2,
				translations: [{ id: 20, languages_code: 'en', title: 'Old EN 2' }],
			},
		]);

		const wrapper = mountDrawerBatch({
			edits: {
				translations: {
					create: [{ languages_code: 'en', title: 'New EN' }],
				},
			},
		});

		await (wrapper.vm as any).save();

		expect(mockFetchAll).toHaveBeenCalledWith('/items/articles', {
			params: {
				filter: { id: { _in: [1, 2] } },
				fields: ['id', 'translations.*'],
			},
		});

		expect(mockApi.patch).toHaveBeenCalledWith('/items/articles', [
			{
				id: 1,
				translations: [
					{ id: 10, languages_code: 'en', title: 'New EN' },
					{ id: 11, languages_code: 'fr', title: 'Old FR' },
				],
			},
			{
				id: 2,
				translations: [{ id: 20, languages_code: 'en', title: 'New EN' }],
			},
		]);
	});

	it('appends new translations when no match exists', async () => {
		setupTranslationsRelation();

		mockFetchAll.mockResolvedValue([
			{
				id: 1,
				translations: [{ id: 10, languages_code: 'en', title: 'EN' }],
			},
		]);

		const wrapper = mountDrawerBatch({
			primaryKeys: [1],
			edits: {
				translations: {
					create: [{ languages_code: 'de', title: 'New DE' }],
				},
			},
		});

		await (wrapper.vm as any).save();

		expect(mockApi.patch).toHaveBeenCalledWith('/items/articles', [
			{
				id: 1,
				translations: [
					{ id: 10, languages_code: 'en', title: 'EN' },
					{ languages_code: 'de', title: 'New DE' },
				],
			},
		]);
	});

	it('creates translations on items with no existing translations', async () => {
		setupTranslationsRelation();

		mockFetchAll.mockResolvedValue([{ id: 1, translations: [] }]);

		const wrapper = mountDrawerBatch({
			primaryKeys: [1],
			edits: {
				translations: {
					create: [{ languages_code: 'en', title: 'New' }],
				},
			},
		});

		await (wrapper.vm as any).save();

		expect(mockApi.patch).toHaveBeenCalledWith('/items/articles', [
			{
				id: 1,
				translations: [{ languages_code: 'en', title: 'New' }],
			},
		]);
	});

	it('includes scalar edits alongside translations', async () => {
		setupTranslationsRelation();

		mockFetchAll.mockResolvedValue([{ id: 1, translations: [] }]);

		const wrapper = mountDrawerBatch({
			primaryKeys: [1],
			edits: {
				status: 'published',
				translations: {
					create: [{ languages_code: 'en', title: 'New' }],
				},
			},
		});

		await (wrapper.vm as any).save();

		expect(mockApi.patch).toHaveBeenCalledWith('/items/articles', [
			{
				id: 1,
				status: 'published',
				translations: [{ languages_code: 'en', title: 'New' }],
			},
		]);
	});

	it('handles nested object junction field values', async () => {
		setupTranslationsRelation();

		mockFetchAll.mockResolvedValue([
			{
				id: 1,
				translations: [{ id: 10, languages_code: { code: 'en' }, title: 'Old' }],
			},
		]);

		const wrapper = mountDrawerBatch({
			primaryKeys: [1],
			edits: {
				translations: {
					create: [{ languages_code: 'en', title: 'New' }],
				},
			},
		});

		await (wrapper.vm as any).save();

		expect(mockApi.patch).toHaveBeenCalledWith('/items/articles', [
			{
				id: 1,
				translations: [{ id: 10, languages_code: 'en', title: 'New' }],
			},
		]);
	});

	it('skips items not returned by fetch', async () => {
		setupTranslationsRelation();

		mockFetchAll.mockResolvedValue([{ id: 1, translations: [] }]);

		const wrapper = mountDrawerBatch({
			primaryKeys: [1, 99],
			edits: {
				translations: {
					create: [{ languages_code: 'en', title: 'New' }],
				},
			},
		});

		await (wrapper.vm as any).save();

		const payload = mockApi.patch.mock.calls[0]![1] as any[];
		expect(payload).toHaveLength(1);
		expect(payload[0]!.id).toBe(1);
	});

	it('handles multiple translation fields on the same collection', async () => {
		mockFieldsStore.getField.mockImplementation((_collection: string, field: string) => {
			if (field === 'translations' || field === 'content_translations') {
				return { meta: { special: ['translations'] } };
			}

			return { meta: { special: [] } };
		});

		mockFieldsStore.getPrimaryKeyFieldForCollection.mockImplementation((col: string) => {
			if (col === 'languages') return { field: 'code' };
			if (col === 'content_languages') return { field: 'code' };
			return { field: 'id' };
		});

		mockRelationsStore.getRelationsForField.mockImplementation((_collection: string, field: string) => {
			if (field === 'translations') {
				return [
					{ meta: { one_field: 'translations', junction_field: 'languages_code' } },
					{ field: 'languages_code', related_collection: 'languages' },
				];
			}

			if (field === 'content_translations') {
				return [
					{ meta: { one_field: 'content_translations', junction_field: 'languages_code' } },
					{ field: 'languages_code', related_collection: 'content_languages' },
				];
			}

			return [];
		});

		mockFetchAll.mockResolvedValue([
			{
				id: 1,
				translations: [{ id: 10, languages_code: 'en', title: 'Old' }],
				content_translations: [{ id: 30, languages_code: 'en', body: 'Old body' }],
			},
		]);

		const wrapper = mountDrawerBatch({
			primaryKeys: [1],
			edits: {
				translations: { create: [{ languages_code: 'en', title: 'New' }] },
				content_translations: { create: [{ languages_code: 'en', body: 'New body' }] },
			},
		});

		await (wrapper.vm as any).save();

		expect(mockApi.patch).toHaveBeenCalledWith('/items/articles', [
			{
				id: 1,
				translations: [{ id: 10, languages_code: 'en', title: 'New' }],
				content_translations: [{ id: 30, languages_code: 'en', body: 'New body' }],
			},
		]);
	});

	it('handles rows where junction field is missing', async () => {
		setupTranslationsRelation();

		mockFetchAll.mockResolvedValue([
			{
				id: 1,
				translations: [
					{ id: 10, title: 'No lang key' },
					{ id: 11, languages_code: 'en', title: 'EN' },
				],
			},
		]);

		const wrapper = mountDrawerBatch({
			primaryKeys: [1],
			edits: {
				translations: { create: [{ languages_code: 'en', title: 'Updated EN' }] },
			},
		});

		await (wrapper.vm as any).save();

		const payload = mockApi.patch.mock.calls[0]![1] as any[];

		expect(payload[0]!.translations).toEqual([
			{ id: 10, title: 'No lang key' },
			{ id: 11, languages_code: 'en', title: 'Updated EN' },
		]);
	});
});

describe('batch save error handling', () => {
	it('calls unexpectedError when fetchAll rejects', async () => {
		setupTranslationsRelation();

		const error = new Error('Network error');
		mockFetchAll.mockRejectedValue(error);

		const wrapper = mountDrawerBatch({
			primaryKeys: [1],
			edits: {
				translations: { create: [{ languages_code: 'en', title: 'New' }] },
			},
		});

		await (wrapper.vm as any).save();

		expect(mockUnexpectedError).toHaveBeenCalledWith(error);
		expect(mockApi.patch).not.toHaveBeenCalled();
	});

	it('calls unexpectedError when api.patch rejects without response errors', async () => {
		setupTranslationsRelation();

		mockFetchAll.mockResolvedValue([{ id: 1, translations: [] }]);

		const error = new Error('Network error');
		mockApi.patch.mockRejectedValue(error);

		const wrapper = mountDrawerBatch({
			primaryKeys: [1],
			edits: {
				translations: { create: [{ languages_code: 'en', title: 'New' }] },
			},
		});

		await (wrapper.vm as any).save();

		expect(mockUnexpectedError).toHaveBeenCalledWith(error);
	});

	it('surfaces validation errors from translations-aware save', async () => {
		setupTranslationsRelation();

		mockFetchAll.mockResolvedValue([{ id: 1, translations: [] }]);

		mockApi.patch.mockRejectedValue({
			response: {
				data: {
					errors: [
						{ extensions: { code: 'FAILED_VALIDATION', field: 'title' } },
						{ extensions: { code: 'INTERNAL_SERVER_ERROR' } },
					],
				},
			},
		});

		const wrapper = mountDrawerBatch({
			primaryKeys: [1],
			edits: {
				translations: { create: [{ languages_code: 'en', title: '' }] },
			},
		});

		await (wrapper.vm as any).save();

		expect(mockUnexpectedError).toHaveBeenCalledWith(
			{ extensions: { code: 'INTERNAL_SERVER_ERROR' } },
			0,
			expect.any(Array),
		);
	});
});

describe('stageOnSave with translations', () => {
	it('emits raw edits without translations merging when stageOnSave is true', async () => {
		setupTranslationsRelation();

		const wrapper = mountDrawerBatch({
			primaryKeys: [1],
			stageOnSave: true,
			edits: {
				translations: { create: [{ languages_code: 'en', title: 'New' }] },
			},
		});

		await (wrapper.vm as any).save();

		expect(mockFetchAll).not.toHaveBeenCalled();
		expect(mockApi.patch).not.toHaveBeenCalled();

		const emitted = wrapper.emitted('input');
		expect(emitted).toBeTruthy();

		expect(emitted![0]![0]).toEqual({
			translations: { create: [{ languages_code: 'en', title: 'New' }] },
		});
	});
});
