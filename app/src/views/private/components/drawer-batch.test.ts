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

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
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
});
