import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, Mock, test, vi } from 'vitest';
import { cryptoStub } from '@/__utils__/crypto';
import { useRelationsStore } from '@/stores/relations';
import { getLocalTypeForField } from '@/utils/get-local-type';
import { getRelatedCollection } from '@/utils/get-related-collection';

vi.stubGlobal('crypto', cryptoStub);

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);
});

vi.mock('@/utils/get-local-type');

test('Returns M2M as related + junction', () => {
	const relationsStore = useRelationsStore();

	(relationsStore.getRelationsForField as Mock).mockReturnValue([
		{
			collection: 'articles_categories',
			field: 'articles_id',
			related_collection: 'articles',
		},
		{
			collection: 'articles_categories',
			field: 'categories_id',
			related_collection: 'categories',
		},
	]);

	(getLocalTypeForField as Mock).mockReturnValue('m2m');

	expect(getRelatedCollection('articles', 'categories')).toEqual({
		relatedCollection: 'categories',
		junctionCollection: 'articles_categories',
		path: ['categories_id'],
	});
});

test('Returns other O2M as just related', () => {
	const relationsStore = useRelationsStore();

	(relationsStore.getRelationsForField as Mock).mockReturnValue([
		{
			collection: 'users',
			field: 'favorite_article',
			related_collection: 'articles',
		},
	]);

	(getLocalTypeForField as Mock).mockReturnValue('o2m');

	expect(getRelatedCollection('articles', 'favorited_by')).toEqual({
		relatedCollection: 'users',
	});
});

test('Returns M2O from related_collection rather than collection', () => {
	const relationsStore = useRelationsStore();

	(relationsStore.getRelationsForField as Mock).mockReturnValue([
		{
			collection: 'users',
			field: 'favorite_article',
			related_collection: 'articles',
		},
	]);

	(getLocalTypeForField as Mock).mockReturnValue('m2o');

	expect(getRelatedCollection('users', 'favorite_article')).toEqual({
		relatedCollection: 'articles',
	});
});

test('Returns null if no relation exists in the relationsStore', () => {
	const relationsStore = useRelationsStore();

	(relationsStore.getRelationsForField as Mock).mockReturnValue([]);

	expect(getRelatedCollection('users', 'favorite_article')).toEqual(null);
});
