import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { useRelationM2M } from './use-relation-m2m';

const mockRelationsStore = {
	getRelationsForField: vi.fn(),
};

const mockCollectionsStore = {
	getCollection: vi.fn(),
};

const mockFieldsStore = {
	getPrimaryKeyFieldForCollection: vi.fn(),
	getField: vi.fn(),
};

vi.mock('@/stores/relations', () => ({
	useRelationsStore: vi.fn(() => mockRelationsStore),
}));

vi.mock('@/stores/collections', () => ({
	useCollectionsStore: vi.fn(() => mockCollectionsStore),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: vi.fn(() => mockFieldsStore),
}));

describe('useRelationM2M', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('relationMissingPermissions is false when relationInfo exists', () => {
		const junction = {
			collection: 'articles_tags',
			field: 'article_id',
			related_collection: 'articles',
			meta: { one_field: 'tags', junction_field: 'tag_id', sort_field: null },
			schema: null,
		};

		const relation = {
			collection: 'articles_tags',
			field: 'tag_id',
			related_collection: 'tags',
			meta: { junction_field: 'article_id' },
			schema: null,
		};

		mockRelationsStore.getRelationsForField.mockReturnValue([junction, relation]);
		mockCollectionsStore.getCollection.mockReturnValue({ collection: 'tags' });
		mockFieldsStore.getPrimaryKeyFieldForCollection.mockReturnValue({ field: 'id' });
		mockFieldsStore.getField.mockReturnValue({ field: 'tag_id' });

		const { relationInfo, relationMissingPermissions } = useRelationM2M(ref('articles'), ref('tags'));

		expect(relationInfo.value).toBeDefined();
		expect(relationMissingPermissions.value).toBe(false);
	});

	test('relationMissingPermissions is true when relationInfo is undefined and field has m2m special', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([]);

		mockFieldsStore.getField.mockReturnValue({
			field: 'tags',
			meta: { special: ['m2m'] },
		});

		const { relationInfo, relationMissingPermissions } = useRelationM2M(ref('articles'), ref('tags'));

		expect(relationInfo.value).toBeUndefined();
		expect(relationMissingPermissions.value).toBe(true);
	});

	test('relationMissingPermissions is false when relationInfo is undefined and field has no m2m special', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([]);

		mockFieldsStore.getField.mockReturnValue({
			field: 'tags',
			meta: { special: [] },
		});

		const { relationInfo, relationMissingPermissions } = useRelationM2M(ref('articles'), ref('tags'));

		expect(relationInfo.value).toBeUndefined();
		expect(relationMissingPermissions.value).toBe(false);
	});

	test('relationMissingPermissions is false when field has no meta', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([]);
		mockFieldsStore.getField.mockReturnValue(undefined);

		const { relationMissingPermissions } = useRelationM2M(ref('articles'), ref('tags'));

		expect(relationMissingPermissions.value).toBe(false);
	});
});
