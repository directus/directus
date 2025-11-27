import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import relatedValuesDisplay from './index';

vi.mock('@/utils/adjust-fields-for-displays', () => ({
	adjustFieldsForDisplays: vi.fn((fields: string[]) => fields),
}));

vi.mock('@/utils/get-related-collection', () => ({
	getRelatedCollection: vi.fn((collection: string, field: string) => {
		// For M2A test
		if (collection === 'pages' && field === 'items') {
			return { relatedCollection: 'pages_items', path: [] };
		}

		// For other tests
		return { relatedCollection: 'tags', junctionCollection: 'posts_tags', path: ['tags_id'] };
	}),
}));

vi.mock('@directus/utils', () => ({
	getFieldsFromTemplate: vi.fn((template: string) => {
		const matches = template.match(/{{(.*?)}}/g) || [];
		return matches.map((match) => match.replace(/{{|}}/g, '').trim());
	}),
	getRelations: vi.fn(() => []),
}));

describe('related-values display - fields function', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
	});

	it('should use explicit template from options without prefixing', () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		collectionsStore.collections = [] as any;
		fieldsStore.fields = [] as any;
		fieldsStore.getPrimaryKeyFieldForCollection = vi.fn(() => ({ field: 'id' }) as any);

		const options = { template: 'Test {{Collection_name_id.name}}' };

		const context = {
			field: 'mtm_field',
			collection: 'articles',
			type: 'm2m',
		};

		vi.mock('@/utils/get-related-collection', () => ({
			getRelatedCollection: vi.fn(() => ({
				junctionCollection: 'articles_tags',
				relatedCollection: 'tags',
				path: ['tags_id'],
			})),
		}));

		const fieldsFunc = relatedValuesDisplay.fields;
		const fields = typeof fieldsFunc === 'function' ? fieldsFunc(options, context) : [];

		expect(fields).toContain('Collection_name_id.name');
		expect(fields).not.toContain('tags_id.Collection_name_id.name');
	});

	it('should use junction collection template without prefixing', () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		collectionsStore.collections = [
			{
				collection: 'articles_tags',
				meta: {
					display_template: 'Tag {{tags_id.name}} (Order: {{order}})',
				},
			},
		] as any;

		fieldsStore.fields = [] as any;
		fieldsStore.getPrimaryKeyFieldForCollection = vi.fn(() => ({ field: 'id' }) as any);

		const options = { template: undefined };

		const context = {
			field: 'tags',
			collection: 'articles',
			type: 'm2m',
		};

		const fieldsFunc = relatedValuesDisplay.fields;
		const fields = typeof fieldsFunc === 'function' ? fieldsFunc(options as any, context) : [];

		expect(fields).toContain('tags_id.name');
		expect(fields).toContain('order');
	});

	it('should use related collection template WITH prefixing', () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		collectionsStore.collections = [
			{
				collection: 'articles_tags',
				meta: {},
			},
			{
				collection: 'tags',
				meta: {
					display_template: 'Tag {{name}}',
				},
			},
		] as any;

		fieldsStore.fields = [] as any;
		fieldsStore.getPrimaryKeyFieldForCollection = vi.fn(() => ({ field: 'id' }) as any);

		const options = { template: undefined };

		const context = {
			field: 'tags',
			collection: 'articles',
			type: 'm2m',
		};

		const fieldsFunc = relatedValuesDisplay.fields;
		const fields = typeof fieldsFunc === 'function' ? fieldsFunc(options as any, context) : [];

		expect(fields).toContain('tags_id.name');
		expect(fields).toContain('tags_id.id');
	});

	it('should fallback to primary key when no template exists', () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		collectionsStore.collections = [] as any;
		fieldsStore.fields = [] as any;
		fieldsStore.getPrimaryKeyFieldForCollection = vi.fn(() => ({ field: 'id' }) as any);

		const options = { template: undefined };

		const context = {
			field: 'tags',
			collection: 'articles',
			type: 'm2m',
		};

		const fieldsFunc = relatedValuesDisplay.fields;
		const fields = typeof fieldsFunc === 'function' ? fieldsFunc(options as any, context) : [];

		expect(fields).toContain('tags_id.id');
		expect(fields).toHaveLength(1);
	});

	it('should handle empty template gracefully', () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		collectionsStore.collections = [
			{
				collection: 'tags',
				meta: {
					display_template: '',
				},
			},
		] as any;

		fieldsStore.fields = [] as any;
		fieldsStore.getPrimaryKeyFieldForCollection = vi.fn(() => ({ field: 'id' }) as any);

		const options = { template: undefined };

		const context = {
			field: 'tags',
			collection: 'articles',
			type: 'm2m',
		};

		const fieldsFunc = relatedValuesDisplay.fields;
		const fields = typeof fieldsFunc === 'function' ? fieldsFunc(options as any, context) : [];

		expect(fields).toContain('tags_id.id');
		expect(fields).toHaveLength(1);
	});

	it('should handle missing collection gracefully', () => {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		collectionsStore.collections = [] as any;
		fieldsStore.fields = [] as any;
		fieldsStore.getPrimaryKeyFieldForCollection = vi.fn(() => ({ field: 'id' }) as any);

		const options = { template: undefined };

		const context = {
			field: 'tags',
			collection: 'articles',
			type: 'm2m',
		};

		const fieldsFunc = relatedValuesDisplay.fields;
		const fields = typeof fieldsFunc === 'function' ? fieldsFunc(options as any, context) : [];

		expect(fields).toContain('tags_id.id');
	});
});
