import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import RenderTemplate from './render-template.vue';

const mockCollectionsStore = vi.hoisted(() => ({
	getCollection: vi.fn(),
}));

const mockFieldsStore = vi.hoisted(() => ({
	getField: vi.fn(),
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

function mountRenderTemplate(props: Record<string, any> = {}, messages: Record<string, any> = {}) {
	const i18n = createI18n({
		legacy: false,
		missingWarn: false,
		locale: 'en-US',
		messages: { 'en-US': messages },
	});

	return mount(RenderTemplate, {
		props: {
			collection: 'projects',
			item: { title: 'Acme redesign' },
			template: '{{ title }}',
			...props,
		},
		global: {
			plugins: [i18n],
		},
	});
}

describe('collection name', () => {
	beforeEach(() => {
		mockCollectionsStore.getCollection.mockReturnValue({ collection: 'projects', name: 'Projects' });
		// Falling back to the raw value keeps the assertions off the display extensions
		mockFieldsStore.getField.mockReturnValue(null);
	});

	it('does not render the collection name by default', () => {
		const wrapper = mountRenderTemplate();

		expect(wrapper.find('.collection-name').exists()).toBe(false);
		expect(wrapper.find('.vertical-aligner').exists()).toBe(true);
		expect(wrapper.classes()).not.toContain('has-collection-name');
		expect(wrapper.text()).toBe('Acme redesign');
	});

	it('renders the collection name before the template when enabled', () => {
		const wrapper = mountRenderTemplate({ showCollectionName: true });

		expect(wrapper.find('.collection-name').text()).toBe('Projects:');
		// The separator is a non-breaking space, so the prefix never wraps away from the value
		expect(wrapper.text()).toBe('Projects:\u00a0Acme redesign');
	});

	it('replaces the vertical aligner with the collection name', () => {
		const wrapper = mountRenderTemplate({ showCollectionName: true });

		expect(wrapper.find('.vertical-aligner').exists()).toBe(false);
		expect(wrapper.classes()).toContain('has-collection-name');
	});

	it('prefers the singular collection name translation over the collection name', () => {
		const wrapper = mountRenderTemplate(
			{ showCollectionName: true },
			{ collection_names_singular: { projects: 'Project' } },
		);

		expect(wrapper.find('.collection-name').text()).toBe('Project:');
	});

	it('does not render the collection name without a collection', () => {
		const wrapper = mountRenderTemplate({
			collection: undefined,
			showCollectionName: true,
			fields: [{ field: 'title', type: 'string' }],
		});

		expect(wrapper.find('.collection-name').exists()).toBe(false);
		expect(wrapper.text()).toBe('Acme redesign');
	});

	it('does not render the collection name for an unknown collection', () => {
		mockCollectionsStore.getCollection.mockReturnValue(null);

		const wrapper = mountRenderTemplate({ showCollectionName: true });

		expect(wrapper.find('.collection-name').exists()).toBe(false);
		expect(wrapper.text()).toBe('Acme redesign');
	});
});

describe('M2A rendering', () => {
	beforeEach(() => {
		mockCollectionsStore.getCollection.mockReturnValue(null);
		mockFieldsStore.getField.mockReturnValue(null);

		mockRelationsStore.getRelationsForField.mockImplementation((collection, field) => {
			if (collection === 'junction_collection' && field === 'item') {
				return [
					{
						collection: 'junction_collection',
						field: 'item',
						meta: {
							one_collection_field: 'collection',
							one_allowed_collections: ['posts', 'pages'],
						},
					},
				];
			}

			return [];
		});
	});

	it('renders only the matching M2A collection fields without dashes for non-matching collections', () => {
		const wrapper = mountRenderTemplate({
			collection: 'junction_collection',
			item: {
				collection: 'posts',
				item: {
					title: 'Directus in depth',
				},
			},
			template: '{{ item:posts.title }} {{ item:pages.name }}',
		});

		expect(wrapper.text().trim()).toBe('Directus in depth');
		expect(wrapper.text()).not.toContain('--');
	});

	it('renders pages M2A collection fields when collection matches pages', () => {
		const wrapper = mountRenderTemplate({
			collection: 'junction_collection',
			item: {
				collection: 'pages',
				item: {
					name: 'Homepage',
				},
			},
			template: '{{ item:posts.title }} {{ item:pages.name }}',
		});

		expect(wrapper.text().trim()).toBe('Homepage');
		expect(wrapper.text()).not.toContain('--');
	});

	it('still renders ValueNull when matching collection field value is null', () => {
		const wrapper = mountRenderTemplate({
			collection: 'junction_collection',
			item: {
				collection: 'posts',
				item: {
					title: null,
				},
			},
			template: '{{ item:posts.title }} {{ item:pages.name }}',
		});

		expect(wrapper.text().trim()).toBe('--');
	});
});
