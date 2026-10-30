import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import display from './index';
import { cryptoStub } from '@/__utils__/crypto';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { getRelatedCollection } from '@/utils/get-related-collection';

vi.stubGlobal('crypto', cryptoStub);

vi.mock('@/utils/get-related-collection');

describe('related-values display fields', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				createSpy: vi.fn,
			}),
		);
	});

	it('returns template fields and primary key for non-M2A relations', () => {
		(getRelatedCollection as Mock).mockReturnValue({
			relatedCollection: 'authors',
			junctionCollection: undefined,
			path: undefined,
		});

		const fieldsStore = useFieldsStore();
		(fieldsStore.getPrimaryKeyFieldForCollection as Mock).mockReturnValue({ field: 'id' });

		(fieldsStore.getField as Mock).mockReturnValue({
			collection: 'articles',
			field: 'author',
			meta: { special: ['m2o'] },
		});

		const result = (display.fields as any)({ template: '{{ name }}' }, { collection: 'articles', field: 'author' });

		expect(result).toContain('name');
		expect(result).toContain('id');
	});

	it('returns collection field and template fields for M2A when template is provided', () => {
		(getRelatedCollection as Mock).mockReturnValue({
			relatedCollection: 'sections_junction',
			junctionCollection: undefined,
			path: undefined,
		});

		const fieldsStore = useFieldsStore();
		(fieldsStore.getPrimaryKeyFieldForCollection as Mock).mockReturnValue({ field: 'id' });

		(fieldsStore.getField as Mock).mockReturnValue({
			collection: 'pages',
			field: 'sections',
			meta: { special: ['m2a'] },
		});

		const relationsStore = useRelationsStore();

		(relationsStore.getRelationsForField as Mock).mockReturnValue([
			{
				collection: 'sections_junction',
				field: 'page_id',
				related_collection: 'pages',
				meta: {
					one_field: 'sections',
					junction_field: 'item',
				},
			},
			{
				collection: 'sections_junction',
				field: 'item',
				related_collection: null,
				meta: {
					one_collection_field: 'collection',
					one_allowed_collections: ['headings', 'paragraphs'],
				},
			},
		]);

		const result = (display.fields as any)(
			{ template: '{{ collection }}: {{ item:headings.text }}' },
			{ collection: 'pages', field: 'sections' },
		);

		expect(result).toContain('id');
		expect(result).toContain('collection');
		expect(result).toContain('item:headings.text');
	});

	it('returns display template fields and PKs for all allowed collections when no template is provided for M2A', () => {
		(getRelatedCollection as Mock).mockReturnValue({
			relatedCollection: 'sections_junction',
			junctionCollection: undefined,
			path: undefined,
		});

		const fieldsStore = useFieldsStore();

		(fieldsStore.getPrimaryKeyFieldForCollection as Mock).mockImplementation((collection: string) => {
			if (collection === 'sections_junction') return { field: 'id' };
			if (collection === 'headings') return { field: 'id' };
			if (collection === 'paragraphs') return { field: 'id' };
			return null;
		});

		(fieldsStore.getField as Mock).mockImplementation((collection: string, field: string) => {
			if (collection === 'pages' && field === 'sections') {
				return {
					collection: 'pages',
					field: 'sections',
					meta: { special: ['m2a'] },
				};
			}

			return null;
		});

		const collectionsStore = useCollectionsStore();

		(collectionsStore.getCollection as Mock).mockImplementation((collection: string) => {
			if (collection === 'headings') {
				return {
					collection: 'headings',
					meta: { display_template: '{{ text }}' },
				};
			}

			if (collection === 'paragraphs') {
				return {
					collection: 'paragraphs',
					meta: { display_template: '{{ body }}' },
				};
			}

			return null;
		});

		const relationsStore = useRelationsStore();

		(relationsStore.getRelationsForField as Mock).mockReturnValue([
			{
				collection: 'sections_junction',
				field: 'page_id',
				related_collection: 'pages',
				meta: {
					one_field: 'sections',
					junction_field: 'item',
				},
			},
			{
				collection: 'sections_junction',
				field: 'item',
				related_collection: null,
				meta: {
					one_collection_field: 'collection',
					one_allowed_collections: ['headings', 'paragraphs'],
				},
			},
		]);

		const result = (display.fields as any)(null, { collection: 'pages', field: 'sections' });

		expect(result).toContain('id');
		expect(result).toContain('collection');
		expect(result).toContain('item:headings.text');
		expect(result).toContain('item:headings.id');
		expect(result).toContain('item:paragraphs.body');
		expect(result).toContain('item:paragraphs.id');
	});
});
