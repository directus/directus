import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import RelatedValues from './related-values.vue';

const mockCollectionsStore = vi.hoisted(() => ({
	getCollection: vi.fn(),
}));

const mockFieldsStore = vi.hoisted(() => ({
	getField: vi.fn(),
	getPrimaryKeyFieldForCollection: vi.fn(),
}));

const mockRelationsStore = vi.hoisted(() => ({
	getRelationsForField: vi.fn().mockReturnValue([]),
}));

vi.mock('@/stores/collections', () => ({
	useCollectionsStore: () => mockCollectionsStore,
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => mockFieldsStore,
}));

vi.mock('@/stores/relations', () => ({
	useRelationsStore: () => mockRelationsStore,
}));

vi.mock('@/utils/get-local-type', () => ({
	getLocalTypeForField: vi.fn((collection, field) => {
		if (collection === 'pages' && field === 'sections') return 'm2a';
		return 'm2o';
	}),
}));

vi.mock('@/utils/get-related-collection', () => ({
	getRelatedCollection: vi.fn((collection, field) => {
		if (collection === 'pages' && field === 'sections') {
			return {
				relatedCollection: 'pages_sections',
				junctionCollection: undefined,
				path: undefined,
			};
		}

		return null;
	}),
}));

vi.mock('@directus/composables', () => ({
	useCollection: vi.fn(() => ({
		primaryKeyField: { value: { field: 'id' } },
	})),
}));

const i18n = createI18n({
	legacy: false,
	missingWarn: false,
	locale: 'en-US',
	messages: { 'en-US': {} },
});

describe('related-values.vue M2A', () => {
	beforeEach(() => {
		mockCollectionsStore.getCollection.mockImplementation((collection: string) => {
			if (collection === 'headings') {
				return {
					collection: 'headings',
					meta: { display_template: '{{ text }}' },
				};
			}

			return null;
		});

		mockRelationsStore.getRelationsForField.mockImplementation((collection: string, field: string) => {
			if (collection === 'pages' && field === 'sections') {
				return [
					{
						collection: 'pages_sections',
						field: 'pages_id',
						related_collection: 'pages',
						meta: {
							one_field: 'sections',
							junction_field: 'item',
						},
					},
					{
						collection: 'pages_sections',
						field: 'item',
						related_collection: null,
						meta: {
							one_collection_field: 'collection',
							one_allowed_collections: ['headings'],
						},
					},
				];
			}

			return [];
		});

		mockFieldsStore.getField.mockImplementation((collection: string, field: string) => {
			if (collection === 'pages_sections') {
				return { collection, field };
			}

			return null;
		});

		mockFieldsStore.getPrimaryKeyFieldForCollection.mockImplementation((collection: string) => {
			if (collection === 'headings') return { field: 'id' };
			if (collection === 'pages_sections') return { field: 'id' };
			return null;
		});
	});

	it('renders M2A dropdown and items with collection name', () => {
		const wrapper = mount(RelatedValues, {
			props: {
				collection: 'pages',
				field: 'sections',
				value: [
					{
						id: 1,
						collection: 'headings',
						item: {
							id: 10,
							text: 'Section Header',
						},
					},
				],
			},
			global: {
				plugins: [i18n],
				stubs: {
					VMenu: {
						template: '<div class="v-menu"><slot name="activator" :toggle="() => {}" /><slot /></div>',
					},
					VList: { template: '<div class="v-list"><slot /></div>' },
					VListItem: { template: '<div class="v-list-item"><slot /></div>' },
					VListItemContent: { template: '<div class="v-list-item-content"><slot /></div>' },
					VListItemIcon: { template: '<div class="v-list-item-icon"><slot /></div>' },
					VIcon: true,
					RouterLink: {
						props: ['to'],
						template: '<a :href="to"><slot /></a>',
					},
					RenderTemplate: {
						props: {
							collection: String,
							template: String,
							item: Object,
							showCollectionName: Boolean,
						},
						template: '<div class="mock-render-template" :data-collection="collection" :data-template="template" :data-show-name="String(showCollectionName)">{{ collection }}: {{ item?.text }}</div>',
					},
				},
			},
		});

		const renderTemplate = wrapper.find('.mock-render-template');
		expect(renderTemplate.exists()).toBe(true);
		expect(renderTemplate.attributes('data-collection')).toBe('headings');
		expect(renderTemplate.attributes('data-template')).toBe('{{ text }}');
		expect(renderTemplate.attributes('data-show-name')).toBe('true');

		// Router link should route to headings collection, not the junction collection
		const link = wrapper.find('a');
		expect(link.exists()).toBe(true);
		expect(link.attributes('href')).toBe('/content/headings/10');
	});
});
