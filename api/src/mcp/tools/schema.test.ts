import { InvalidPayloadError } from '@directus/errors';
import type {
	Accountability,
	Collection,
	Field,
	Query,
	Relation,
	SchemaOverview,
	SnapshotRelation,
} from '@directus/types';
import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest';
import { CollectionsService } from '../../services/collections.js';
import { FieldsService } from '../../services/fields.js';
import { RelationsService } from '../../services/relations.js';
import { getSnapshot } from '../../utils/get-snapshot.js';
import { collection, field, relation, schema } from './schema.js';

vi.mock('../../services/collections.js');
vi.mock('../../services/fields.js');
vi.mock('../../services/relations.js');

vi.mock('../../utils/get-snapshot.js', () => ({
	getSnapshot: vi.fn(),
}));

const mockSchema = { collections: {}, fields: {}, relations: {} } as unknown as SchemaOverview;
const mockAccountability = { user: 'test-user', admin: true } as Accountability;
const mockSanitizedQuery = { limit: 10, offset: 0 } as Query;

describe('Schema Tool', () => {
	it('should return schema overview', async () => {
		const mockSnapshot = {
			collections: [
				{ collection: 'articles', meta: {} },
				{ collection: 'categories', meta: {} },
			],
			fields: [
				{
					field: 'id',
					collection: 'articles',
					type: 'integer',
					schema: { is_primary_key: true },
					meta: { required: true, readonly: false, interface: 'input' },
				},
				{
					field: 'title',
					collection: 'articles',
					type: 'string',
					schema: { is_primary_key: false },
					meta: { required: true, readonly: false, interface: 'input', note: 'Article title' },
				},
				{
					field: 'category_id',
					collection: 'articles',
					type: 'integer',
					schema: { is_primary_key: false },
					meta: {
						required: false,
						readonly: false,
						interface: 'select-dropdown-m2o',
						special: ['m2o'],
					},
				},
				{
					field: 'divider',
					collection: 'articles',
					type: 'alias',
					schema: {},
					meta: { special: ['no-data'] },
				},
			],
			relations: [
				{
					collection: 'articles',
					field: 'category_id',
					related_collection: 'categories',
					meta: {},
				} as SnapshotRelation,
			],
		};

		(getSnapshot as any).mockResolvedValue(mockSnapshot);

		const result = await schema.handler({
			args: {
				action: 'overview',
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(getSnapshot).toHaveBeenCalled();

		expect(result).toEqual({
			type: 'text',
			data: {
				articles: {
					id: {
						name: 'id',
						type: 'integer',
						primary_key: true,
						required: true,
						interface: {
							type: 'input',
						},
					},
					title: {
						name: 'title',
						type: 'string',
						required: true,
						interface: {
							type: 'input',
						},
						note: 'Article title',
					},
					category_id: {
						name: 'category_id',
						type: 'integer',
						interface: {
							type: 'select-dropdown-m2o',
						},
						relation: {
							type: 'm2o',
							related_collections: ['categories'],
						},
					},
				},
			},
		});
	});

	it('should handle fields with choices in interface', async () => {
		const mockSnapshot = {
			collections: [],
			fields: [
				{
					field: 'status',
					collection: 'articles',
					type: 'string',
					schema: {},
					meta: {
						required: true,
						readonly: false,
						interface: 'select-dropdown',
						options: {
							choices: ['draft', 'published', 'archived'],
						},
					},
				},
			],
			relations: [],
		};

		(getSnapshot as any).mockResolvedValue(mockSnapshot);

		const result = await schema.handler({
			args: { action: 'overview' },
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(result).toEqual({
			type: 'text',
			data: {
				articles: {
					status: {
						name: 'status',
						required: true,
						type: 'string',
						interface: {
							type: 'select-dropdown',
							choices: ['draft', 'published', 'archived'],
						},
					},
				},
			},
		});
	});

	it('should handle many-to-many relations', async () => {
		const mockSnapshot = {
			collections: [],
			fields: [
				{
					field: 'tags',
					collection: 'articles',
					type: 'alias',
					schema: {},
					meta: {
						special: ['m2m'],
						interface: 'list-m2m',
					},
				},
			],
			relations: [
				{
					collection: 'articles',
					field: 'tags',
					related_collection: 'tags',
					meta: {},
				} as SnapshotRelation,
			],
		};

		(getSnapshot as any).mockResolvedValue(mockSnapshot);

		const result = await schema.handler({
			args: { action: 'overview' },
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(result).toEqual({
			type: 'text',
			data: {
				articles: {
					tags: {
						name: 'tags',
						type: 'alias',
						interface: {
							type: 'list-m2m',
						},
						relation: {
							type: 'm2m',
							related_collections: ['tags'],
						},
					},
				},
			},
		});
	});

	it('should handle many-to-any relations', async () => {
		const mockSnapshot = {
			collections: [],
			fields: [
				{
					field: 'related_items',
					collection: 'articles',
					type: 'json',
					schema: {},
					meta: {
						special: ['m2a'],
						interface: 'list-m2a',
					},
				},
			],
			relations: [
				{
					collection: 'articles',
					field: 'related_items',
					related_collection: null,
					meta: {
						one_allowed_collections: ['pages', 'products', 'events'],
					},
				} as SnapshotRelation,
			],
		};

		(getSnapshot as any).mockResolvedValue(mockSnapshot);

		const result = await schema.handler({
			args: { action: 'overview' },
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(result).toEqual({
			type: 'text',
			data: {
				articles: {
					related_items: {
						name: 'related_items',
						type: 'json',
						interface: {
							type: 'list-m2a',
						},
						relation: {
							type: 'm2a',
							related_collections: ['pages', 'products', 'events'],
						},
					},
				},
			},
		});
	});
});

describe('Collections Tool', () => {
	const MockedCollectionService = vi.mocked(CollectionsService);

	let mockCollectionsService: {
		createMany: MockedFunction<any>;
		readMany: MockedFunction<any>;
		readByQuery: MockedFunction<any>;
		updateBatch: MockedFunction<any>;
		deleteMany: MockedFunction<any>;
	};

	beforeEach(() => {
		vi.clearAllMocks();

		mockCollectionsService = {
			createMany: vi.fn(),
			readMany: vi.fn(),
			readByQuery: vi.fn(),
			updateBatch: vi.fn(),
			deleteMany: vi.fn(),
		};

		MockedCollectionService.mockImplementation(() => mockCollectionsService as any);
	});

	it('should error for invalid action', async () => {
		await expect(
			collection.handler({
				args: {
					action: 'invalid' as any,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			}),
		).rejects.toThrow(InvalidPayloadError);
	});

	it('should create a single collection', async () => {
		const collectionData = {
			collection: 'test_collection',
			meta: { hidden: false, singleton: false },
		} as unknown as Collection;

		mockCollectionsService.createMany.mockResolvedValue(['test_collection']);
		mockCollectionsService.readMany.mockResolvedValue([collectionData]);

		const result = await collection.handler({
			args: {
				action: 'create',
				data: collectionData,
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(CollectionsService).toHaveBeenCalledWith({
			schema: mockSchema,
			accountability: mockAccountability,
		});

		expect(mockCollectionsService.createMany).toHaveBeenCalledWith([collectionData]);
		expect(mockCollectionsService.readMany).toHaveBeenCalledWith(['test_collection']);

		expect(result).toEqual({
			type: 'text',
			data: [collectionData],
		});
	});

	it('should create multiple collections', async () => {
		const collectionsData = [
			{ collection: 'collection1', meta: { hidden: false } },
			{ collection: 'collection2', meta: { hidden: false } },
		] as unknown as Collection[];

		mockCollectionsService.createMany.mockResolvedValue(['collection1', 'collection2']);
		mockCollectionsService.readMany.mockResolvedValue(collectionsData);

		const result = await collection.handler({
			args: {
				action: 'create',
				data: collectionsData,
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(mockCollectionsService.createMany).toHaveBeenCalledWith(collectionsData);
		expect(result).toEqual({ type: 'text', data: collectionsData });
	});

	it('should read collections by keys', async () => {
		const keys = ['collection1', 'collection2'];

		const expectedData = [
			{ collection: 'collection1', meta: { hidden: false } },
			{ collection: 'collection2', meta: { hidden: false } },
		] as unknown as Collection[];

		mockCollectionsService.readMany.mockResolvedValue(expectedData);

		const result = await collection.handler({
			args: {
				action: 'read',
				keys,
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: {},
		});

		expect(mockCollectionsService.readMany).toHaveBeenCalledWith(keys);
		expect(result).toEqual({ type: 'text', data: expectedData });
	});

	it('should read collections by query', async () => {
		const expectedData = [{ collection: 'test_collection' }];
		mockCollectionsService.readByQuery.mockResolvedValue(expectedData);

		const result = await collection.handler({
			args: {
				action: 'read',
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(mockCollectionsService.readByQuery).toHaveBeenCalled();
		expect(result).toEqual({ type: 'text', data: expectedData });
	});

	it('should update collection by data array', async () => {
		const keys = ['collection1'];
		const updateData = { collection: 'collection1', meta: { hidden: true } } as unknown as Collection;
		const expectedResult = [{ collection: 'collection1', meta: { hidden: true } }];

		mockCollectionsService.updateBatch.mockResolvedValue(keys);
		mockCollectionsService.readMany.mockResolvedValue(expectedResult);

		const result = await collection.handler({
			args: {
				action: 'update',
				data: updateData,
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(mockCollectionsService.updateBatch).toHaveBeenCalledWith([updateData]);
		expect(result).toEqual({ type: 'text', data: expectedResult });
	});

	it('should delete collections', async () => {
		const keys = ['collection1', 'collection2'];

		mockCollectionsService.deleteMany.mockResolvedValue(keys);

		const result = await collection.handler({
			args: {
				action: 'delete',
				keys,
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(mockCollectionsService.deleteMany).toHaveBeenCalledWith(keys);

		expect(result).toEqual({
			type: 'text',
			data: keys,
		});
	});
});

describe('Fields Tool', () => {
	const MockedFieldService = vi.mocked(FieldsService);

	let mockFieldsService: {
		createField: MockedFunction<any>;
		readOne: MockedFunction<any>;
		readAll: MockedFunction<any>;
		updateFields: MockedFunction<any>;
		deleteField: MockedFunction<any>;
	};

	beforeEach(() => {
		vi.clearAllMocks();

		mockFieldsService = {
			createField: vi.fn(),
			readOne: vi.fn(),
			readAll: vi.fn(),
			updateFields: vi.fn(),
			deleteField: vi.fn(),
		};

		MockedFieldService.mockImplementation(() => mockFieldsService as any);
	});

	it('should create a field', async () => {
		const fieldData = {
			field: 'title',
			type: 'string',
			collection: 'articles',
			meta: { required: true },
		} as unknown as Field;

		mockFieldsService.readOne.mockResolvedValue(fieldData);

		const result = await field.handler({
			args: {
				action: 'create',
				collection: 'articles',
				data: fieldData,
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(FieldsService).toHaveBeenCalledWith({
			schema: mockSchema,
			accountability: mockAccountability,
		});

		expect(result).toEqual({ type: 'text', data: fieldData });
	});

	it('should read fields', async () => {
		const expectedFields = [
			{ field: 'title', type: 'string', collection: 'articles' },
			{ field: 'content', type: 'text', collection: 'articles' },
		];

		mockFieldsService.readAll.mockResolvedValue(expectedFields);

		const result = await field.handler({
			args: {
				collection: 'articles',
				action: 'read',
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(result).toEqual({ type: 'text', data: expectedFields });
	});

	it('should read field by field name', async () => {
		const expectedField = { field: 'title', type: 'string', collection: 'articles' };

		mockFieldsService.readOne.mockResolvedValue(expectedField);

		const result = await field.handler({
			args: {
				collection: 'articles',
				field: 'title',
				action: 'read',
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(mockFieldsService.readOne).toHaveBeenCalledWith(expectedField.collection, expectedField.field);

		expect(result).toEqual({ type: 'text', data: expectedField });
	});

	it('should update field by field', async () => {
		const collection = 'articles';

		const updateData = {
			field: 'title',
			meta: { required: false, note: 'Updated field note' },
		} as unknown as Field;

		const expectedResult = [
			{
				field: 'title',
				type: 'string',
				collection,
				meta: { required: false, note: 'Updated field note' },
			},
		];

		mockFieldsService.readOne.mockImplementation((collection, field) =>
			expectedResult.find((f) => f.collection === collection && f.field === field),
		);

		const result = await field.handler({
			args: {
				action: 'update',
				collection,
				data: updateData,
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(mockFieldsService.updateFields).toHaveBeenCalledWith(collection, [updateData]);
		expect(result).toEqual({ type: 'text', data: expectedResult });
	});

	it('should update field by fields', async () => {
		const collection = 'articles';

		const updateData = [
			{
				field: 'title',
				meta: { required: false, note: 'Updated field note' },
			},
			{
				field: 'subtitle',
				meta: { required: false, note: 'Updated field note' },
			},
		] as unknown as Field[];

		const expectedResult = [
			{
				field: 'title',
				type: 'string',
				collection,
				meta: { required: false, note: 'Updated field note' },
			},
			{
				field: 'subtitle',
				type: 'string',
				collection,
				meta: { required: false, note: 'Updated field note' },
			},
		];

		mockFieldsService.readOne.mockImplementation((collection, field) => {
			return expectedResult.find((f) => f.collection === collection && f.field === field);
		});

		const result = await field.handler({
			args: {
				action: 'update',
				collection,
				data: updateData,
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(mockFieldsService.updateFields).toHaveBeenCalledWith(collection, updateData);
		expect(result).toEqual({ type: 'text', data: expectedResult });
	});

	it('should delete fields', async () => {
		const collection = 'articles';
		const fieldName = 'title';

		const result = await field.handler({
			args: {
				action: 'delete',
				collection,
				field: fieldName,
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(mockFieldsService.deleteField).toHaveBeenCalledWith(collection, fieldName);

		expect(result).toEqual({
			type: 'text',
			data: {
				collection,
				field: fieldName,
			},
		});
	});
});

describe('Relation Tool ', () => {
	const MockedRelationService = vi.mocked(RelationsService);

	let mockRelationsService: {
		createOne: MockedFunction<any>;
		readOne: MockedFunction<any>;
		readAll: MockedFunction<any>;
		updateOne: MockedFunction<any>;
		deleteOne: MockedFunction<any>;
	};

	beforeEach(() => {
		vi.clearAllMocks();

		mockRelationsService = {
			createOne: vi.fn(),
			readOne: vi.fn(),
			readAll: vi.fn(),
			updateOne: vi.fn(),
			deleteOne: vi.fn(),
		};

		MockedRelationService.mockImplementation(() => mockRelationsService as any);
	});

	it('should create a relation', async () => {
		const relationData = {
			collection: 'articles',
			field: 'category_id',
			related_collection: 'categories',
		} as unknown as Relation;

		mockRelationsService.createOne.mockResolvedValue([1]);
		mockRelationsService.readOne.mockResolvedValue([relationData]);

		const result = await relation.handler({
			args: {
				action: 'create',
				collection: 'articles',
				data: relationData,
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(RelationsService).toHaveBeenCalledWith({
			schema: mockSchema,
			accountability: mockAccountability,
		});

		expect(result).toEqual({ type: 'text', data: [relationData] });
	});

	it('should read relation by field', async () => {
		const collection = 'articles';
		const field = 'category_id';
		const expectedRelations = { collection, field, related_collection: 'categories' };
		mockRelationsService.readOne.mockResolvedValue(expectedRelations);

		const result = await relation.handler({
			args: {
				collection,
				field,
				action: 'read',
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(mockRelationsService.readOne).toHaveBeenCalledWith(collection, field);
		expect(mockRelationsService.readAll).not.toHaveBeenCalled();
		expect(result).toEqual({ type: 'text', data: expectedRelations });
	});

	it('should read relations', async () => {
		const expectedRelations = [
			{ collection: 'articles', field: 'category_id', related_collection: 'categories' },
			{ collection: 'articles', field: 'author_id', related_collection: 'users' },
		];

		mockRelationsService.readAll.mockResolvedValue(expectedRelations);

		const result = await relation.handler({
			args: {
				collection: 'articles',
				action: 'read',
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(mockRelationsService.readAll).toHaveBeenCalled();
		expect(result).toEqual({ type: 'text', data: expectedRelations });
	});

	it('should update relation by field', async () => {
		const collection = 'articles';
		const field = 'category_id';

		const updateData = {
			meta: { one_field: 'updated_field' },
		} as unknown as Relation;

		const expectedResult = {
			collection,
			field,
			related_collection: 'categories',
			meta: { one_field: 'updated_field' },
		};

		mockRelationsService.readOne.mockResolvedValue(expectedResult);

		const result = await relation.handler({
			args: {
				collection,
				field,
				action: 'update',
				data: updateData,
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(mockRelationsService.updateOne).toHaveBeenCalledWith(collection, field, updateData);
		expect(result).toEqual({ type: 'text', data: expectedResult });
	});

	it('should delete relation by collection + field', async () => {
		const collection = 'articles';
		const field = 'category_id';

		const result = await relation.handler({
			args: {
				collection,
				field,
				action: 'delete',
			},
			schema: mockSchema,
			accountability: mockAccountability,
			sanitizedQuery: mockSanitizedQuery,
		});

		expect(mockRelationsService.deleteOne).toHaveBeenCalledWith(collection, field);
		expect(result).toEqual({ type: 'text', data: { collection, field } });
	});
});
