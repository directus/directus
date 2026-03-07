import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { useRelationM2A } from './use-relation-m2a';

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

describe('useRelationM2A', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('relationMissingPermissions is false when relationInfo exists', () => {
		const junction = {
			collection: 'page_blocks',
			field: 'page_id',
			related_collection: 'pages',
			meta: { one_field: 'blocks', junction_field: 'item', sort_field: null },
			schema: null,
		};

		const relation = {
			collection: 'page_blocks',
			field: 'item',
			related_collection: null,
			meta: {
				junction_field: 'page_id',
				one_allowed_collections: ['headings', 'texts'],
				one_collection_field: 'collection',
			},
			schema: null,
		};

		mockRelationsStore.getRelationsForField.mockReturnValue([junction, relation]);

		mockCollectionsStore.getCollection.mockImplementation((collection: string) => {
			if (collection === 'page_blocks') return { collection: 'page_blocks' };
			if (collection === 'headings') return { collection: 'headings' };
			if (collection === 'texts') return { collection: 'texts' };
			return null;
		});

		mockFieldsStore.getPrimaryKeyFieldForCollection.mockReturnValue({ field: 'id' });
		mockFieldsStore.getField.mockReturnValue({ field: 'item' });

		const { relationInfo, relationMissingPermissions } = useRelationM2A(ref('pages'), ref('blocks'));

		expect(relationInfo.value).toBeDefined();
		expect(relationMissingPermissions.value).toBe(false);
	});

	test('relationMissingPermissions is true when relationInfo is undefined and field has m2a special', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([]);

		mockFieldsStore.getField.mockReturnValue({
			field: 'blocks',
			meta: { special: ['m2a'] },
		});

		const { relationInfo, relationMissingPermissions } = useRelationM2A(ref('pages'), ref('blocks'));

		expect(relationInfo.value).toBeUndefined();
		expect(relationMissingPermissions.value).toBe(true);
	});

	test('relationMissingPermissions is false when relationInfo is undefined and field has no m2a special', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([]);

		mockFieldsStore.getField.mockReturnValue({
			field: 'blocks',
			meta: { special: [] },
		});

		const { relationInfo, relationMissingPermissions } = useRelationM2A(ref('pages'), ref('blocks'));

		expect(relationInfo.value).toBeUndefined();
		expect(relationMissingPermissions.value).toBe(false);
	});

	test('relationMissingPermissions is false when field has no meta', () => {
		mockRelationsStore.getRelationsForField.mockReturnValue([]);
		mockFieldsStore.getField.mockReturnValue(undefined);

		const { relationMissingPermissions } = useRelationM2A(ref('pages'), ref('blocks'));

		expect(relationMissingPermissions.value).toBe(false);
	});
});
