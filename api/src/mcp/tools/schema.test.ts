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
import { ItemsService } from '../../services/items.js';
import { getSnapshot } from '../../utils/get-snapshot.js';
import { schema } from './schema.js';

vi.mock('../../services/items.js');

const MockedItemsService = vi.mocked(ItemsService);

vi.mock('../../utils/get-snapshot.js', () => ({
	getSnapshot: vi.fn(),
}));

let mockItemsService: {
	createMany: MockedFunction<any>;
	readMany: MockedFunction<any>;
	readByQuery: MockedFunction<any>;
	updateMany: MockedFunction<any>;
	updateByQuery: MockedFunction<any>;
	updateBatch: MockedFunction<any>;
	deleteMany: MockedFunction<any>;
};

beforeEach(() => {
	vi.clearAllMocks();

	mockItemsService = {
		createMany: vi.fn(),
		readMany: vi.fn(),
		readByQuery: vi.fn(),
		updateMany: vi.fn(),
		updateBatch: vi.fn(),
		updateByQuery: vi.fn(),
		deleteMany: vi.fn(),
	};

	MockedItemsService.mockImplementation(() => mockItemsService as any);
});

describe('Schema Tool', () => {
	const mockSchema = { collections: {}, fields: {}, relations: {} } as unknown as SchemaOverview;
	const mockAccountability = { user: 'test-user', admin: true } as Accountability;
	const mockSanitizedQuery = { limit: 10, offset: 0 } as Query;

	describe('errors', () => {
		it('should throw error for invalid action with non-overview type', async () => {
			await expect(
				schema.handler({
					args: {
						type: 'collection',
						action: 'invalid' as any,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				}),
			).rejects.toThrow('Invalid type.');
		});
	});

	describe('COLLECTION', () => {
		it('should create a single collection', async () => {
			const collectionData = {
				collection: 'test_collection',
				meta: { hidden: false, singleton: false },
			} as unknown as Collection;

			mockItemsService.createMany.mockResolvedValue(['test_collection']);
			mockItemsService.readMany.mockResolvedValue([collectionData]);

			const result = await schema.handler({
				args: {
					type: 'collection',
					action: 'create',
					data: collectionData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(ItemsService).toHaveBeenCalledWith('directus_collections', {
				schema: mockSchema,
				accountability: mockAccountability,
			});

			expect(mockItemsService.createMany).toHaveBeenCalledWith([collectionData]);
			expect(mockItemsService.readMany).toHaveBeenCalledWith(['test_collection'], mockSanitizedQuery);

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

			mockItemsService.createMany.mockResolvedValue(['collection1', 'collection2']);
			mockItemsService.readMany.mockResolvedValue(collectionsData);

			const result = await schema.handler({
				args: {
					type: 'collection',
					action: 'create',
					data: collectionsData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.createMany).toHaveBeenCalledWith(collectionsData);
			expect(result).toEqual({ type: 'text', data: collectionsData });
		});

		it('should read collections by keys', async () => {
			const keys = ['collection1', 'collection2'];

			const expectedData = [
				{ collection: 'collection1', meta: { hidden: false } },
				{ collection: 'collection2', meta: { hidden: false } },
			] as unknown as Collection[];

			mockItemsService.readMany.mockResolvedValue(expectedData);

			const result = await schema.handler({
				args: {
					type: 'collection',
					action: 'read',
					keys,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.readMany).toHaveBeenCalledWith(keys, mockSanitizedQuery);
			expect(result).toEqual({ type: 'text', data: expectedData });
		});

		it('should read collections by query', async () => {
			const expectedData = [{ collection: 'test_collection' }];
			mockItemsService.readByQuery.mockResolvedValue(expectedData);

			const result = await schema.handler({
				args: {
					type: 'collection',
					action: 'read',
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.readByQuery).toHaveBeenCalledWith(mockSanitizedQuery);
			expect(result).toEqual({ type: 'text', data: expectedData });
		});

		it('should update collection by keys', async () => {
			const keys = ['collection1'];
			const updateData = { meta: { hidden: true } } as unknown as Collection;
			const expectedResult = [{ collection: 'collection1', meta: { hidden: true } }];

			mockItemsService.updateMany.mockResolvedValue(keys);
			mockItemsService.readMany.mockResolvedValue(expectedResult);

			const result = await schema.handler({
				args: {
					type: 'collection',
					action: 'update',
					keys,
					data: updateData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.updateMany).toHaveBeenCalledWith(keys, updateData);
			expect(result).toEqual({ type: 'text', data: expectedResult });
		});

		it('should delete collections', async () => {
			const keys = ['collection1', 'collection2'];

			mockItemsService.deleteMany.mockResolvedValue(keys);

			const result = await schema.handler({
				args: {
					type: 'collection',
					action: 'delete',
					keys,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.deleteMany).toHaveBeenCalledWith(keys);

			expect(result).toEqual({
				type: 'text',
				data: keys,
			});
		});
	});

	describe('FIELD', () => {
		it('should create a field', async () => {
			const fieldData = {
				field: 'title',
				type: 'string',
				collection: 'articles',
				meta: { required: true },
			} as unknown as Field;

			mockItemsService.createMany.mockResolvedValue([1]);
			mockItemsService.readMany.mockResolvedValue([fieldData]);

			const result = await schema.handler({
				args: {
					type: 'field',
					action: 'create',
					data: fieldData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(ItemsService).toHaveBeenCalledWith('directus_fields', {
				schema: mockSchema,
				accountability: mockAccountability,
			});

			expect(result).toEqual({ type: 'text', data: [fieldData] });
		});

		it('should read fields', async () => {
			const expectedFields = [
				{ field: 'title', type: 'string', collection: 'articles' },
				{ field: 'content', type: 'text', collection: 'articles' },
			];

			mockItemsService.readByQuery.mockResolvedValue(expectedFields);

			const result = await schema.handler({
				args: {
					type: 'field',
					action: 'read',
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(result).toEqual({ type: 'text', data: expectedFields });
		});

		it('should update field by keys', async () => {
			const keys = [1];

			const updateData = {
				meta: { required: false, note: 'Updated field note' },
			} as unknown as Field;

			const expectedResult = [
				{
					field: 'title',
					type: 'string',
					collection: 'articles',
					meta: { required: false, note: 'Updated field note' },
				},
			];

			mockItemsService.updateMany.mockResolvedValue(keys);
			mockItemsService.readMany.mockResolvedValue(expectedResult);

			const result = await schema.handler({
				args: {
					type: 'field',
					action: 'update',
					keys,
					data: updateData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.updateMany).toHaveBeenCalledWith(keys, updateData);
			expect(mockItemsService.readMany).toHaveBeenCalledWith(keys, mockSanitizedQuery);
			expect(result).toEqual({ type: 'text', data: expectedResult });
		});

		it('should update field by query', async () => {
			const updateData = { meta: { readonly: true } } as unknown as Field;
			const updatedKeys = [1, 2];

			const expectedResult = [
				{ field: 'title', meta: { readonly: true } },
				{ field: 'content', meta: { readonly: true } },
			];

			mockItemsService.updateByQuery.mockResolvedValue(updatedKeys);
			mockItemsService.readMany.mockResolvedValue(expectedResult);

			const result = await schema.handler({
				args: {
					type: 'field',
					action: 'update',
					data: updateData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.updateByQuery).toHaveBeenCalledWith(mockSanitizedQuery, updateData);
			expect(result).toEqual({ type: 'text', data: expectedResult });
		});

		it('should update fields with batch data', async () => {
			const batchData = [
				{ id: 1, meta: { required: true } },
				{ id: 2, meta: { required: false } },
			] as unknown as Field;

			const updatedKeys = [1, 2];

			const expectedResult = [
				{ field: 'title', meta: { required: true } },
				{ field: 'content', meta: { required: false } },
			];

			mockItemsService.updateBatch.mockResolvedValue(updatedKeys);
			mockItemsService.readMany.mockResolvedValue(expectedResult);

			const result = await schema.handler({
				args: {
					type: 'field',
					action: 'update',
					data: batchData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.updateBatch).toHaveBeenCalledWith(batchData);
			expect(result).toEqual({ type: 'text', data: expectedResult });
		});

		it('should delete fields', async () => {
			const keys = [1, 2, 3];

			mockItemsService.deleteMany.mockResolvedValue(keys);

			const result = await schema.handler({
				args: {
					type: 'field',
					action: 'delete',
					keys,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.deleteMany).toHaveBeenCalledWith(keys);

			expect(result).toEqual({
				type: 'text',
				data: keys,
			});
		});
	});

	describe('RELATION', () => {
		it('should create a relation', async () => {
			const relationData = {
				collection: 'articles',
				field: 'category_id',
				related_collection: 'categories',
			} as unknown as Relation;

			mockItemsService.createMany.mockResolvedValue([1]);
			mockItemsService.readMany.mockResolvedValue([relationData]);

			const result = await schema.handler({
				args: {
					type: 'relation',
					action: 'create',
					data: relationData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(ItemsService).toHaveBeenCalledWith('directus_relations', {
				schema: mockSchema,
				accountability: mockAccountability,
			});

			expect(result).toEqual({ type: 'text', data: [relationData] });
		});

		it('should read relations by keys', async () => {
			const keys = [1, 2];

			const expectedRelations = [
				{ collection: 'articles', field: 'category_id', related_collection: 'categories' },
				{ collection: 'articles', field: 'author_id', related_collection: 'users' },
			];

			mockItemsService.readMany.mockResolvedValue(expectedRelations);

			const result = await schema.handler({
				args: {
					type: 'relation',
					action: 'read',
					keys,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.readMany).toHaveBeenCalledWith(keys, mockSanitizedQuery);
			expect(result).toEqual({ type: 'text', data: expectedRelations });
		});

		it('should update relation by keys', async () => {
			const keys = [1];

			const updateData = {
				meta: { one_field: 'updated_field' },
			} as unknown as Relation;

			const expectedResult = [
				{
					collection: 'articles',
					field: 'category_id',
					related_collection: 'categories',
					meta: { one_field: 'updated_field' },
				},
			];

			mockItemsService.updateMany.mockResolvedValue(keys);
			mockItemsService.readMany.mockResolvedValue(expectedResult);

			const result = await schema.handler({
				args: {
					type: 'relation',
					action: 'update',
					keys,
					data: updateData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.updateMany).toHaveBeenCalledWith(keys, updateData);
			expect(result).toEqual({ type: 'text', data: expectedResult });
		});

		it('should read relations by query', async () => {
			const expectedRelations = [
				{ collection: 'articles', field: 'category_id', related_collection: 'categories' },
				{ collection: 'products', field: 'brand_id', related_collection: 'brands' },
			];

			mockItemsService.readByQuery.mockResolvedValue(expectedRelations);

			const result = await schema.handler({
				args: {
					type: 'relation',
					action: 'read',
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.readByQuery).toHaveBeenCalledWith(mockSanitizedQuery);
			expect(result).toEqual({ type: 'text', data: expectedRelations });
		});

		it('should update relation by query', async () => {
			const updateData = {
				meta: { sort_field: 'sort' },
			} as unknown as Relation;

			const updatedKeys = [1, 2];

			const expectedResult = [
				{ collection: 'articles', field: 'tags', meta: { sort_field: 'sort' } },
				{ collection: 'products', field: 'categories', meta: { sort_field: 'sort' } },
			];

			mockItemsService.updateByQuery.mockResolvedValue(updatedKeys);
			mockItemsService.readMany.mockResolvedValue(expectedResult);

			const result = await schema.handler({
				args: {
					type: 'relation',
					action: 'update',
					data: updateData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.updateByQuery).toHaveBeenCalledWith(mockSanitizedQuery, updateData);
			expect(result).toEqual({ type: 'text', data: expectedResult });
		});

		it('should update relations with batch data', async () => {
			const batchData = [
				{ id: 1, meta: { sort_field: 'order' } },
				{ id: 2, meta: { one_field: 'parent_id' } },
			] as unknown as Relation[];

			const updatedKeys = [1, 2];

			const expectedResult = [
				{ collection: 'articles', field: 'tags', meta: { sort_field: 'order' } },
				{ collection: 'categories', field: 'parent', meta: { one_field: 'parent_id' } },
			];

			mockItemsService.updateBatch.mockResolvedValue(updatedKeys);
			mockItemsService.readMany.mockResolvedValue(expectedResult);

			const result = await schema.handler({
				args: {
					type: 'relation',
					action: 'update',
					data: batchData,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.updateBatch).toHaveBeenCalledWith(batchData);
			expect(result).toEqual({ type: 'text', data: expectedResult });
		});

		it('should delete relations', async () => {
			const keys = [1, 2];

			mockItemsService.deleteMany.mockResolvedValue(keys);

			const result = await schema.handler({
				args: {
					type: 'relation',
					action: 'delete',
					keys,
				},
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(mockItemsService.deleteMany).toHaveBeenCalledWith(keys);
			expect(result).toEqual({ type: 'text', data: keys });
		});
	});

	describe('OVERVIEW', () => {
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
					type: 'overview',
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
				args: { type: 'overview' },
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
				args: { type: 'overview' },
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
				args: { type: 'overview' },
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

	describe('Input Validation', () => {
		it('should validate collection create schema', () => {
			const validInput = {
				type: 'collection' as const,
				action: 'create' as const,
				data: { collection: 'test', meta: {} },
			};

			expect(() => schema.validateSchema?.parse(validInput)).not.toThrow();
		});

		it('should validate field read schema', () => {
			const validInput = {
				type: 'field' as const,
				action: 'read' as const,
				keys: ['field1', 'field2'],
			};

			expect(() => schema.validateSchema?.parse(validInput)).not.toThrow();
		});

		it('should validate relation delete schema', () => {
			const validInput = {
				type: 'relation' as const,
				action: 'delete' as const,
				keys: [1, 2, 3],
			};

			expect(() => schema.validateSchema?.parse(validInput)).not.toThrow();
		});

		it('should validate overview schema', () => {
			const validInput = {
				type: 'overview' as const,
			};

			expect(() => schema.validateSchema?.parse(validInput)).not.toThrow();
		});

		it('should reject invalid schema', () => {
			const invalidInput = {
				type: 'invalid_type',
				action: 'create',
			};

			expect(() => schema.validateSchema?.parse(invalidInput)).toThrow();
		});
	});
});
