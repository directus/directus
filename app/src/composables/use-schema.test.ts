import { beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
import { useSchemaOverview } from './use-schema';

// create simple reactive objects that mimic the pinia stores
const mockCollectionsStore = reactive({ collections: [] as any[] });

const mockFieldsStore = {
	getFieldsForCollection: vi.fn(),
	getPrimaryKeyFieldForCollection: vi.fn(),
};

const mockRelationsStore = reactive({ relations: [] as any[] });

// make sure the composable under test uses the mocked stores
vi.mock('@/stores/collections', () => ({
	useCollectionsStore: vi.fn(() => mockCollectionsStore),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: vi.fn(() => mockFieldsStore),
}));

vi.mock('@/stores/relations', () => ({
	useRelationsStore: vi.fn(() => mockRelationsStore),
}));

describe('useSchemaOverview', () => {
	beforeEach(() => {
		mockCollectionsStore.collections = [];
		mockRelationsStore.relations = [];
		mockFieldsStore.getFieldsForCollection.mockReset();
		mockFieldsStore.getPrimaryKeyFieldForCollection.mockReset();
	});

	test('returns empty overview when stores are empty', () => {
		const overview = useSchemaOverview();
		expect(overview.value).toEqual({ collections: {}, relations: [] });
	});

	test('computes collection and field information', () => {
		const sampleField = {
			field: 'id',
			type: 'integer',
			schema: {
				default_value: 42,
				is_nullable: false,
				data_type: 'int',
				numeric_precision: 10,
				numeric_scale: 0,
			},
			meta: {
				searchable: true,
				note: 'primary key field',
				special: ['some'],
				validation: { max: 100 },
			},
		} as any;

		mockCollectionsStore.collections = [
			{
				collection: 'items',
				meta: {
					accountability: 'none',
					note: 'a note',
					singleton: false,
					sort_field: 'id',
				},
			},
		];

		mockFieldsStore.getFieldsForCollection.mockReturnValue([sampleField]);
		mockFieldsStore.getPrimaryKeyFieldForCollection.mockReturnValue(sampleField);

		const overview = useSchemaOverview();
		const val = overview.value;

		expect(Object.keys(val.collections)).toEqual(['items']);
		const coll = val.collections['items']!;
		expect(coll.collection).toBe('items');
		expect(coll.primary).toBe('id');
		expect(coll.accountability).toBe('none');
		expect(coll.note).toBe('a note');
		expect(coll.singleton).toBe(false);
		expect(coll.sortField).toBe('id');

		expect(coll.fields).toHaveProperty('id');

		expect(coll.fields['id']).toEqual({
			field: 'id',
			defaultValue: 42,
			nullable: false,
			generated: false,
			type: 'integer',
			dbType: 'int',
			alias: false,
			searchable: true,
			note: 'primary key field',
			precision: 10,
			scale: 0,
			special: ['some'],
			validation: { max: 100 },
		});
	});

	test('field overview defaults when schema/meta are missing', () => {
		const sampleField = { field: 'y', type: 'string' } as any;

		mockCollectionsStore.collections = [{ collection: 'c', meta: {} }];
		mockFieldsStore.getFieldsForCollection.mockReturnValue([sampleField]);
		mockFieldsStore.getPrimaryKeyFieldForCollection.mockReturnValue(sampleField);

		const overview = useSchemaOverview();
		const fieldOverview = overview.value.collections['c']!.fields['y'];

		expect(fieldOverview).toEqual({
			field: 'y',
			defaultValue: undefined,
			nullable: false,
			generated: false,
			type: 'string',
			dbType: null,
			alias: false,
			searchable: true,
			note: null,
			precision: null,
			scale: null,
			special: [],
			validation: null,
		});
	});

	test('reactivity: overview updates when stores change', async () => {
		const overview = useSchemaOverview();

		expect(overview.value.collections).toEqual({});

		const newField = { field: 'x', type: 'string', schema: {}, meta: {} } as any;
		mockCollectionsStore.collections.push({ collection: 'foo', meta: {} });
		mockFieldsStore.getFieldsForCollection.mockReturnValue([newField]);
		mockFieldsStore.getPrimaryKeyFieldForCollection.mockReturnValue(newField);

		await nextTick();
		expect(overview.value.collections).toHaveProperty('foo');
	});

	test('includes relations from relations store', async () => {
		const overview = useSchemaOverview();
		mockRelationsStore.relations = [{ name: 'r1' }];

		await nextTick();
		expect(overview.value.relations).toEqual([{ name: 'r1' }]);
	});
});
