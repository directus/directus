import { getGraphqlQueryFields } from './get-graphql-query-fields.js';
import { mockedStore } from '@/__utils__/store.js';
import { useFieldsStore } from '@/stores/fields.js';
import { useRelationsStore } from '@/stores/relations.js';
import { getRelatedCollection } from '@/utils/get-related-collection.js';
import { Field, Relation } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/utils/get-related-collection.js');

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

it('should return all direct fields for collection if field input is empty', () => {
	const fieldsStore = mockedStore(useFieldsStore());

	fieldsStore.getFieldsForCollection.mockReturnValue([
		{ field: 'title' },
		{ field: 'divider', meta: { special: ['no-data'] } },
	] as Field[]);

	const fields: string[] = [];
	const collection = 'articles';

	const result = getGraphqlQueryFields(fields, collection);

	expect(result).toEqual({ title: true });
});

it('should return non-related fields directly', () => {
	vi.mocked(getRelatedCollection).mockImplementation((collection, field) => {
		if (collection === 'articles' && field === 'author')
			return {
				relatedCollection: 'authors',
			};
		return null;
	});

	const fields: string[] = ['title', 'author.first_name', 'author.last_name'];
	const collection = 'articles';

	const result = getGraphqlQueryFields(fields, collection);

	expect(result).toEqual({ title: true, author: { first_name: true, last_name: true } });
});

it('should include primary keys for relational fields', () => {
	vi.mocked(getRelatedCollection).mockImplementation((collection, field) => {
		if (collection === 'articles' && field === 'author')
			return {
				relatedCollection: 'authors',
			};

		if (collection === 'authors' && field === 'avatar')
			return {
				relatedCollection: 'directus_files',
			};

		if (collection === 'articles' && field === 'translations')
			return {
				relatedCollection: 'translations',
				junctionCollection: 'articles_translations',
			};

		return null;
	});

	const fieldsStore = mockedStore(useFieldsStore());

	fieldsStore.getPrimaryKeyFieldForCollection.mockImplementation((collection) => {
		switch (collection) {
			case 'directus_files':
			case 'articles_translations':
				return { field: 'id' } as Field;
			default:
				return null;
		}
	});

	const fields: string[] = ['author.avatar', 'translations'];
	const collection = 'articles';

	const result = getGraphqlQueryFields(fields, collection);

	expect(result).toEqual({ author: { avatar: { id: true } }, translations: { id: true } });
});

it('should work with m2a fields', () => {
	vi.mocked(getRelatedCollection).mockImplementation((collection, field) => {
		if (collection === 'pages')
			switch (field) {
				case 'blocks':
					return {
						relatedCollection: 'pages_blocks',
					};
				case 'sub_blocks':
					return {
						relatedCollection: 'pages_sub_blocks',
					};
			}

		return null;
	});

	const fieldsStore = mockedStore(useFieldsStore());

	fieldsStore.getPrimaryKeyFieldForCollection.mockImplementation((collection) => {
		switch (collection) {
			case 'block_text':
			case 'pages_blocks':
			case 'pages_sub_blocks':
				return { field: 'id' } as Field;
			default:
				return null;
		}
	});

	const relationsStore = mockedStore(useRelationsStore());

	relationsStore.getRelationForField.mockImplementation((currentCollection, sourceField) => {
		if (
			(currentCollection === 'pages_blocks' && sourceField === 'item') ||
			(currentCollection === 'pages_sub_blocks' && sourceField === 'different_field_for_test')
		)
			return {
				meta: { one_collection_field: 'collection' },
			} as Relation;

		return null;
	});

	const fields: string[] = [
		'blocks.item:block_text',
		'sub_blocks.different_field_for_test:block_paragraph.id',
		'sub_blocks.different_field_for_test:block_paragraph.text',
	];

	const collection = 'pages';

	const result = getGraphqlQueryFields(fields, collection);

	expect(result).toEqual({
		blocks: {
			__args: {
				filter: {
					collection: {
						_in: ['block_text'],
					},
				},
			},
			id: true,
			item: {
				__on: [
					{
						__typeName: 'block_text',
						id: true,
					},
				],
			},
		},
		sub_blocks: {
			__args: {
				filter: {
					collection: {
						_in: ['block_paragraph'],
					},
				},
			},
			different_field_for_test: {
				__on: [
					{
						__typeName: 'block_paragraph',
						id: true,
						text: true,
					},
				],
			},
			id: true,
		},
	});
});
