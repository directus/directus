import { getRelatedCollection } from '@/utils/get-related-collection.js';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getGraphqlQueryFields } from './get-graphql-query-fields.js';
import { useFieldsStore } from '@/stores/fields.js';
import { mockedStore } from '@/__utils__/store.js';
import { Field } from '@directus/types';

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

	fieldsStore.getFieldsForCollection.mockReturnValue([{ field: 'title' } as Field]);

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
