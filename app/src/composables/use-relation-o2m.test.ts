import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { useRelationO2M } from './use-relation-o2m';

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

describe('useRelationO2M', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('relationMissingPermissions is false when relationInfo exists', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([
			{
				collection: 'comments',
				field: 'article',
				related_collection: 'articles',
				meta: { many_field: 'article', sort_field: null },
				schema: null,
			},
		]);

		mockCollectionsStore.getCollection.mockReturnValue({ collection: 'comments' });
		mockFieldsStore.getPrimaryKeyFieldForCollection.mockReturnValue({ field: 'id' });
		mockFieldsStore.getField.mockReturnValue({ field: 'article' });

		const { relationInfo, relationMissingPermissions } = useRelationO2M(ref('articles'), ref('comments'));

		expect(relationInfo.value).toBeDefined();
		expect(relationMissingPermissions.value).toBe(false);
	});

	test('relationMissingPermissions is true when relationInfo is undefined and field has o2m special', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([]);

		mockFieldsStore.getField.mockReturnValue({
			field: 'comments',
			meta: { special: ['o2m'] },
		});

		const { relationInfo, relationMissingPermissions } = useRelationO2M(ref('articles'), ref('comments'));

		expect(relationInfo.value).toBeUndefined();
		expect(relationMissingPermissions.value).toBe(true);
	});

	test('relationMissingPermissions is false when relationInfo is undefined and field has no o2m special', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([]);

		mockFieldsStore.getField.mockReturnValue({
			field: 'comments',
			meta: { special: [] },
		});

		const { relationInfo, relationMissingPermissions } = useRelationO2M(ref('articles'), ref('comments'));

		expect(relationInfo.value).toBeUndefined();
		expect(relationMissingPermissions.value).toBe(false);
	});

	test('relationMissingPermissions is false when field has no meta', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([]);
		mockFieldsStore.getField.mockReturnValue(undefined);

		const { relationMissingPermissions } = useRelationO2M(ref('articles'), ref('comments'));

		expect(relationMissingPermissions.value).toBe(false);
	});
});
