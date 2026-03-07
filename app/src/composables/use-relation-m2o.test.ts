import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { useRelationM2O } from './use-relation-m2o';

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

describe('useRelationM2O', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('relationMissingPermissions is false when relationInfo exists', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([
			{ collection: 'articles', field: 'author', related_collection: 'users', meta: null, schema: null },
		]);

		mockCollectionsStore.getCollection.mockReturnValue({ collection: 'users' });
		mockFieldsStore.getPrimaryKeyFieldForCollection.mockReturnValue({ field: 'id' });

		const { relationInfo, relationMissingPermissions } = useRelationM2O(ref('articles'), ref('author'));

		expect(relationInfo.value).toBeDefined();
		expect(relationMissingPermissions.value).toBe(false);
	});

	test('relationMissingPermissions is true when relationInfo is undefined and field has m2o special', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([]);

		mockFieldsStore.getField.mockReturnValue({
			field: 'author',
			meta: { special: ['m2o'] },
		});

		const { relationInfo, relationMissingPermissions } = useRelationM2O(ref('articles'), ref('author'));

		expect(relationInfo.value).toBeUndefined();
		expect(relationMissingPermissions.value).toBe(true);
	});

	test('relationMissingPermissions is false when relationInfo is undefined and field has no m2o special', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([]);

		mockFieldsStore.getField.mockReturnValue({
			field: 'author',
			meta: { special: [] },
		});

		const { relationInfo, relationMissingPermissions } = useRelationM2O(ref('articles'), ref('author'));

		expect(relationInfo.value).toBeUndefined();
		expect(relationMissingPermissions.value).toBe(false);
	});

	test('relationMissingPermissions is false when field has no meta', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([]);
		mockFieldsStore.getField.mockReturnValue(undefined);

		const { relationMissingPermissions } = useRelationM2O(ref('articles'), ref('author'));

		expect(relationMissingPermissions.value).toBe(false);
	});
});
