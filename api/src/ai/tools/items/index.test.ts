import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Accountability, Relation, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, type MockedFunction, test, vi } from 'vitest';
import { CollectionsService } from '../../../services/collections.js';
import { ItemsService } from '../../../services/items.js';
import { VersionsService } from '../../../services/versions.js';
import { items } from './index.js';

vi.mock('../../../services/collections.js');
vi.mock('../../../services/items.js');

vi.mock('../../../services/versions.js', () => ({
	VersionsService: vi.fn(),
}));

describe('items tool', () => {
	const mockSchema = {
		collections: {
			test_collection: { singleton: false },
			singleton_collection: { singleton: true },
		},
		fields: {},
		relations: [],
	} as unknown as SchemaOverview;

	const mockAccountability = { user: 'test-user' } as Accountability;

	beforeEach(() => {
		vi.mocked(CollectionsService).mockImplementation(
			() =>
				({
					readOne: vi.fn().mockResolvedValue({ meta: { versioning: false } }),
				}) as unknown as CollectionsService,
		);

		vi.mocked(VersionsService).mockImplementation(
			() =>
				({
					readByQuery: vi.fn().mockResolvedValue([]),
					createOne: vi.fn().mockResolvedValue('version-1'),
					save: vi.fn().mockResolvedValue({}),
				}) as unknown as VersionsService,
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('item operations', () => {
		let mockItemsService: {
			createMany: MockedFunction<any>;
			readMany: MockedFunction<any>;
			readOne: MockedFunction<any>;
			readByQuery: MockedFunction<any>;
			readSingleton: MockedFunction<any>;
			updateOne: MockedFunction<any>;
			updateMany: MockedFunction<any>;
			updateBatch: MockedFunction<any>;
			updateByQuery: MockedFunction<any>;
			upsertSingleton: MockedFunction<any>;
			deleteMany: MockedFunction<any>;
		};

		beforeEach(() => {
			mockItemsService = {
				createMany: vi.fn(),
				readMany: vi.fn(),
				readOne: vi.fn(),
				readByQuery: vi.fn(),
				readSingleton: vi.fn(),
				updateOne: vi.fn(),
				updateMany: vi.fn(),
				updateBatch: vi.fn(),
				updateByQuery: vi.fn(),
				upsertSingleton: vi.fn(),
				deleteMany: vi.fn(),
			};

			vi.mocked(ItemsService).mockImplementation(() => mockItemsService as unknown as ItemsService);
		});

		describe('CREATE action', () => {
			test('should create single item in regular collection', async () => {
				const item = { title: 'Test Item', status: 'published' };
				const savedKeys = [1];
				const createdItem = { id: 1, title: 'Test Item', status: 'published' };

				mockItemsService.createMany.mockResolvedValue(savedKeys);
				mockItemsService.readMany.mockResolvedValue([createdItem]);

				const result = await items.handler({
					args: { action: 'create', collection: 'test_collection', data: item },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.createMany).toHaveBeenCalledWith([item]);
				expect(mockItemsService.readMany).toHaveBeenCalledWith(savedKeys, {});

				expect(result).toEqual({
					type: 'text',
					data: [createdItem],
				});
			});

			test('should create multiple items in regular collection', async () => {
				const data = [
					{ title: 'Item 1', status: 'published' },
					{ title: 'Item 2', status: 'draft' },
				];

				const savedKeys = [1, 2];

				const createdItems = [
					{ id: 1, title: 'Item 1', status: 'published' },
					{ id: 2, title: 'Item 2', status: 'draft' },
				];

				mockItemsService.createMany.mockResolvedValue(savedKeys);
				mockItemsService.readMany.mockResolvedValue(createdItems);

				const result = await items.handler({
					args: { action: 'create', collection: 'test_collection', data: data },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.createMany).toHaveBeenCalledWith(data);

				expect(result).toEqual({
					type: 'text',
					data: createdItems,
				});
			});

			test('should handle singleton collection creation', async () => {
				const item = { setting_name: 'site_title', value: 'My Site' };
				const singletonItem = { id: 1, setting_name: 'site_title', value: 'My Site' };

				mockItemsService.readSingleton.mockResolvedValue(singletonItem);

				const result = await items.handler({
					args: { action: 'create', collection: 'singleton_collection', data: item },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.upsertSingleton).toHaveBeenCalledWith(item);
				expect(mockItemsService.readSingleton).toHaveBeenCalledWith({});

				expect(result).toEqual({
					type: 'text',
					data: singletonItem,
				});
			});

			test('should return null when no item is created', async () => {
				mockItemsService.createMany.mockResolvedValue([]);
				mockItemsService.readMany.mockResolvedValue(null);

				const result = await items.handler({
					args: { action: 'create', collection: 'test_collection', data: { title: 'Test' } },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(result).toEqual({
					type: 'text',
					data: null,
				});
			});
		});

		describe('READ action', () => {
			test('should read all items when no keys provided', async () => {
				const data = [
					{ id: 1, title: 'Item 1' },
					{ id: 2, title: 'Item 2' },
				];

				mockItemsService.readByQuery.mockResolvedValue(data);

				const result = await items.handler({
					args: { action: 'read', collection: 'test_collection' },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.readByQuery).toHaveBeenCalledWith({});

				expect(result).toEqual({
					type: 'text',
					data: data,
				});
			});

			test('should read specific items by keys', async () => {
				const keys = [1, 2];

				const data = [
					{ id: 1, title: 'Item 1' },
					{ id: 2, title: 'Item 2' },
				];

				mockItemsService.readMany.mockResolvedValue(data);

				const result = await items.handler({
					args: { action: 'read', collection: 'test_collection', keys },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.readMany).toHaveBeenCalledWith(keys, {});

				expect(result).toEqual({
					type: 'text',
					data: data,
				});
			});

			test('should read singleton item', async () => {
				const singletonItem = { id: 1, setting: 'value' };

				mockItemsService.readSingleton.mockResolvedValue(singletonItem);

				const result = await items.handler({
					args: { action: 'read', collection: 'singleton_collection' },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.readSingleton).toHaveBeenCalledWith({});
				expect(result).toEqual({ type: 'text', data: singletonItem });
			});

			test('should return null when no items found', async () => {
				mockItemsService.readByQuery.mockResolvedValue(null);

				const result = await items.handler({
					args: { action: 'read', collection: 'test_collection' },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(result).toEqual({
					type: 'text',
					data: null,
				});
			});
		});

		describe('UPDATE action', () => {
			test('should update items by keys', async () => {
				const keys = [1, 2];
				const updateData = { status: 'published' };

				const updatedItems = [
					{ id: 1, title: 'Item 1', status: 'published' },
					{ id: 2, title: 'Item 2', status: 'published' },
				];

				mockItemsService.updateMany.mockResolvedValue(keys);
				mockItemsService.readMany.mockResolvedValue(updatedItems);

				const result = await items.handler({
					args: { action: 'update', collection: 'test_collection', keys, data: updateData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.updateMany).toHaveBeenCalledWith(keys, updateData);
				expect(mockItemsService.readMany).toHaveBeenCalledWith(keys, {});

				expect(result).toEqual({
					type: 'text',
					data: updatedItems,
				});
			});

			test('should not route unrelated updates through draft page context', async () => {
				const updateData = { status: 'published' };
				const updatedItem = { id: 1, status: 'published' };

				mockItemsService.updateMany.mockResolvedValue([1]);
				mockItemsService.readMany.mockResolvedValue([updatedItem]);

				const result = await items.handler({
					args: { action: 'update', collection: 'test_collection', keys: [1], data: updateData },
					schema: mockSchema,
					accountability: mockAccountability,
					context: { page: { path: '/visual/pages/1', collection: 'pages', item: 1, version: 'draft' } },
				});

				expect(mockItemsService.updateMany).toHaveBeenCalledWith([1], updateData);
				expect(mockItemsService.updateOne).not.toHaveBeenCalled();

				expect(result).toEqual({
					type: 'text',
					data: [updatedItem],
				});
			});

			test('should handle batch update with array data', async () => {
				const updateData = [
					{ id: 1, title: 'Updated Item 1' },
					{ id: 2, title: 'Updated Item 2' },
				];

				const updatedKeys = [1, 2];

				mockItemsService.updateBatch.mockResolvedValue(updatedKeys);
				mockItemsService.readMany.mockResolvedValue(updateData);

				const result = await items.handler({
					args: { action: 'update', collection: 'test_collection', data: updateData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.updateBatch).toHaveBeenCalledWith(updateData);

				expect(result).toEqual({
					type: 'text',
					data: updateData,
				});
			});

			test('should update by query when no keys provided', async () => {
				const updateData = { status: 'archived' };
				const updatedKeys = [1, 2, 3];

				const updatedItems = [
					{ id: 1, status: 'archived' },
					{ id: 2, status: 'archived' },
					{ id: 3, status: 'archived' },
				];

				mockItemsService.updateByQuery.mockResolvedValue(updatedKeys);
				mockItemsService.readMany.mockResolvedValue(updatedItems);

				const result = await items.handler({
					args: { action: 'update', collection: 'test_collection', data: updateData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.updateByQuery).toHaveBeenCalledWith({}, updateData);

				expect(result).toEqual({
					type: 'text',
					data: updatedItems,
				});
			});

			test('should update singleton item', async () => {
				const updateData = { value: 'Updated Value' };
				const updatedSingleton = { id: 1, setting: 'test', value: 'Updated Value' };

				mockItemsService.readSingleton.mockResolvedValue(updatedSingleton);

				const result = await items.handler({
					args: { action: 'update', collection: 'singleton_collection', data: updateData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.upsertSingleton).toHaveBeenCalledWith(updateData);
				expect(mockItemsService.readSingleton).toHaveBeenCalledWith({});

				expect(result).toEqual({
					type: 'text',
					data: updatedSingleton,
				});
			});

			test('should save versioned item updates to the requested version', async () => {
				const updateData = { title: 'Updated Title' };
				const updatedItem = { id: 1, title: 'Updated Title' };

				const mockVersionsService = {
					readByQuery: vi.fn().mockResolvedValue([]),
					createOne: vi.fn().mockResolvedValue('version-1'),
					save: vi.fn().mockResolvedValue({}),
				};

				vi.mocked(CollectionsService).mockImplementation(
					() =>
						({
							readOne: vi.fn().mockResolvedValue({ meta: { versioning: true } }),
						}) as unknown as CollectionsService,
				);

				vi.mocked(VersionsService).mockImplementation(() => mockVersionsService as unknown as VersionsService);
				vi.mocked(ItemsService).mockImplementation(() => mockItemsService as unknown as ItemsService);
				mockItemsService.readMany.mockResolvedValue([updatedItem]);

				const result = await items.handler({
					args: {
						action: 'update',
						collection: 'test_collection',
						keys: [1],
						data: updateData,
						query: { version: 'draft' },
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.updateMany).not.toHaveBeenCalled();

				expect(mockVersionsService.createOne).toHaveBeenCalledWith({
					key: 'draft',
					collection: 'test_collection',
					item: '1',
				});

				expect(mockVersionsService.save).toHaveBeenCalledWith('version-1', updateData);
				expect(mockItemsService.readMany).toHaveBeenCalledWith([1], expect.objectContaining({ version: 'draft' }));

				expect(result).toEqual({
					type: 'text',
					data: [updatedItem],
				});
			});

			test('should merge multiple child updates into one parent version save', async () => {
				const mockVersionsService = {
					readByQuery: vi.fn().mockResolvedValue([]),
					createOne: vi.fn().mockResolvedValue('version-1'),
					save: vi.fn().mockResolvedValue({}),
				};

				const schema = {
					collections: {
						pages: { singleton: false, primary: 'id' },
						pages_blocks: { singleton: false, primary: 'id' },
						block_hero: { singleton: false, primary: 'id' },
					},
					fields: {},
					relations: [
						relation('pages_blocks', 'pages_id', 'pages', {
							oneField: 'blocks',
							junctionField: 'item',
						}),
						relation('pages_blocks', 'item', null, {
							oneCollectionField: 'collection',
							oneAllowedCollections: ['block_hero'],
						}),
					],
				} as unknown as SchemaOverview;

				vi.mocked(CollectionsService).mockImplementation(
					() =>
						({
							readOne: vi.fn(async (collection) => ({ meta: { versioning: collection === 'pages' } })),
						}) as unknown as CollectionsService,
				);

				vi.mocked(VersionsService).mockImplementation(() => mockVersionsService as unknown as VersionsService);

				mockItemsService.readOne.mockResolvedValue({
					blocks: [
						{ id: 7, collection: 'block_hero', item: { id: 9 } },
						{ id: 8, collection: 'block_hero', item: { id: 10 } },
					],
				});

				await items.handler({
					args: {
						action: 'update',
						collection: 'block_hero',
						keys: [9, 10],
						data: { title: 'Updated Title' },
					},
					schema,
					accountability: mockAccountability,
					context: { page: { path: '/visual/pages/page-id', collection: 'pages', item: 'page-id', version: 'draft' } },
				});

				expect(mockVersionsService.save).toHaveBeenCalledTimes(1);

				expect(mockVersionsService.save).toHaveBeenCalledWith('version-1', {
					blocks: {
						create: [],
						update: [
							{ id: 7, collection: 'block_hero', item: { id: 9, title: 'Updated Title' } },
							{ id: 8, collection: 'block_hero', item: { id: 10, title: 'Updated Title' } },
						],
						delete: [],
					},
				});
			});

			test('should include the child primary key when reading back parent-version updates with selected fields', async () => {
				const mockVersionsService = {
					readByQuery: vi.fn().mockResolvedValue([]),
					createOne: vi.fn().mockResolvedValue('version-1'),
					save: vi.fn().mockResolvedValue({}),
				};

				const schema = {
					collections: {
						pages: { singleton: false, primary: 'id' },
						pages_blocks: { singleton: false, primary: 'id' },
						block_hero: { singleton: false, primary: 'id' },
					},
					fields: {},
					relations: [
						relation('pages_blocks', 'pages_id', 'pages', {
							oneField: 'blocks',
							junctionField: 'item',
						}),
						relation('pages_blocks', 'item', null, {
							oneCollectionField: 'collection',
							oneAllowedCollections: ['block_hero'],
						}),
					],
				} as unknown as SchemaOverview;

				vi.mocked(CollectionsService).mockImplementation(
					() =>
						({
							readOne: vi.fn(async (collection) => ({ meta: { versioning: collection === 'pages' } })),
						}) as unknown as CollectionsService,
				);

				vi.mocked(VersionsService).mockImplementation(() => mockVersionsService as unknown as VersionsService);

				mockItemsService.readOne.mockResolvedValue({
					blocks: [{ id: 7, collection: 'block_hero', item: { id: 9, title: 'Updated Title' } }],
				});

				const result = await items.handler({
					args: {
						action: 'update',
						collection: 'block_hero',
						keys: [9],
						data: { title: 'Updated Title' },
						query: { fields: ['title'] },
					},
					schema,
					accountability: mockAccountability,
					context: { page: { path: '/visual/pages/page-id', collection: 'pages', item: 'page-id', version: 'draft' } },
				});

				expect(mockItemsService.readOne).toHaveBeenLastCalledWith(
					'page-id',
					expect.objectContaining({
						fields: ['blocks.collection', 'blocks.item.id', 'blocks.item.title'],
						version: 'draft',
					}),
				);

				expect(result).toEqual({
					type: 'text',
					data: [{ id: 9, title: 'Updated Title' }],
				});
			});
		});

		describe('DELETE action', () => {
			test('should delete items by keys', async () => {
				const keys = [1, 2, 3];

				mockItemsService.deleteMany.mockResolvedValue(keys);

				const result = await items.handler({
					args: { action: 'delete', collection: 'test_collection', keys },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.deleteMany).toHaveBeenCalledWith(keys);

				expect(result).toEqual({
					type: 'text',
					data: keys,
				});
			});

			test('should handle empty keys array', async () => {
				const keys: number[] = [];

				mockItemsService.deleteMany.mockResolvedValue(keys);

				const result = await items.handler({
					args: { action: 'delete', collection: 'test_collection', keys },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.deleteMany).toHaveBeenCalledWith(keys);

				expect(result).toEqual({
					type: 'text',
					data: keys,
				});
			});
		});
	});

	describe('error handling', () => {
		let mockItemsService: {
			createMany: MockedFunction<any>;
			readMany: MockedFunction<any>;
			readOne: MockedFunction<any>;
			readByQuery: MockedFunction<any>;
			readSingleton: MockedFunction<any>;
			updateOne: MockedFunction<any>;
			updateMany: MockedFunction<any>;
			updateBatch: MockedFunction<any>;
			updateByQuery: MockedFunction<any>;
			upsertSingleton: MockedFunction<any>;
			deleteMany: MockedFunction<any>;
		};

		beforeEach(() => {
			mockItemsService = {
				createMany: vi.fn(),
				readMany: vi.fn(),
				readOne: vi.fn(),
				readByQuery: vi.fn(),
				readSingleton: vi.fn(),
				updateOne: vi.fn(),
				updateMany: vi.fn(),
				updateBatch: vi.fn(),
				updateByQuery: vi.fn(),
				upsertSingleton: vi.fn(),
				deleteMany: vi.fn(),
			};

			vi.mocked(ItemsService).mockImplementation(() => mockItemsService as unknown as ItemsService);
		});

		test('should throw InvalidPayloadError for system collections', async () => {
			await expect(
				items.handler({
					args: { action: 'read', collection: 'directus_users' },
					schema: mockSchema,
					accountability: mockAccountability,
				}),
			).rejects.toThrow(InvalidPayloadError);
		});

		test('should throw ForbiddenError for for non-existent collections', async () => {
			await expect(
				items.handler({
					args: { action: 'read', collection: 'nonexistent' },
					schema: mockSchema,
					accountability: mockAccountability,
				}),
			).rejects.toThrow(ForbiddenError);
		});

		test('should throw error for invalid action', async () => {
			await expect(
				items.handler({
					args: { action: 'invalid' as any, collection: 'test_collection' },
					schema: mockSchema,
					accountability: mockAccountability,
				}),
			).rejects.toThrow('Invalid action.');
		});

		test('should propagate ItemsService errors', async () => {
			const serviceError = new Error('Database connection failed');
			mockItemsService.readByQuery.mockRejectedValue(serviceError);

			await expect(
				items.handler({
					args: { action: 'read', collection: 'test_collection' },
					schema: mockSchema,
					accountability: mockAccountability,
				}),
			).rejects.toThrow('Database connection failed');
		});
	});

	describe('meta', () => {
		let mockItemsService: {
			createMany: MockedFunction<any>;
			readMany: MockedFunction<any>;
			readOne: MockedFunction<any>;
			readByQuery: MockedFunction<any>;
			readSingleton: MockedFunction<any>;
			updateOne: MockedFunction<any>;
			updateMany: MockedFunction<any>;
			updateBatch: MockedFunction<any>;
			updateByQuery: MockedFunction<any>;
			upsertSingleton: MockedFunction<any>;
			deleteMany: MockedFunction<any>;
		};

		beforeEach(() => {
			mockItemsService = {
				createMany: vi.fn(),
				readMany: vi.fn(),
				readOne: vi.fn(),
				readByQuery: vi.fn(),
				readSingleton: vi.fn(),
				updateOne: vi.fn(),
				updateMany: vi.fn(),
				updateBatch: vi.fn(),
				updateByQuery: vi.fn(),
				upsertSingleton: vi.fn(),
				deleteMany: vi.fn(),
			};

			vi.mocked(ItemsService).mockImplementation(() => mockItemsService as unknown as ItemsService);
		});

		describe('construction', () => {
			test('should create ItemsService with correct parameters', async () => {
				await items.handler({
					args: { action: 'read', collection: 'test_collection' },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(ItemsService).toHaveBeenCalledWith('test_collection', {
					schema: mockSchema,
					accountability: mockAccountability,
				});
			});
		});

		describe('schema validation', () => {
			test('should validate create action with required data', () => {
				const validInput = {
					action: 'create',
					collection: 'test_collection',
					data: { title: 'Test Item' },
				};

				expect(() => items.validateSchema?.parse(validInput)).not.toThrow();
			});

			test('should validate read action with optional keys', () => {
				const validInput = {
					action: 'read',
					collection: 'test_collection',
					keys: [1, 2, 3],
				};

				expect(() => items.validateSchema?.parse(validInput)).not.toThrow();
			});

			test('should validate update action with data and keys', () => {
				const validInput = {
					action: 'update',
					collection: 'test_collection',
					data: { status: 'published' },
					keys: [1, 2],
				};

				expect(() => items.validateSchema?.parse(validInput)).not.toThrow();
			});

			test('should validate delete action with required keys', () => {
				const validInput = {
					action: 'delete',
					collection: 'test_collection',
					keys: [1, 2, 3],
				};

				expect(() => items.validateSchema?.parse(validInput)).not.toThrow();
			});

			test('should reject invalid action types', () => {
				const invalidInput = {
					action: 'invalid',
					collection: 'test_collection',
				};

				expect(() => items.validateSchema?.parse(invalidInput)).toThrow();
			});
		});

		describe('singleton handling', () => {
			test('should correctly identify singleton collections', async () => {
				mockItemsService.readSingleton.mockResolvedValue({ id: 1, value: 'test' });

				await items.handler({
					args: { action: 'read', collection: 'singleton_collection' },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.readSingleton).toHaveBeenCalled();
				expect(mockItemsService.readByQuery).not.toHaveBeenCalled();
			});

			test('should handle missing singleton flag as false', async () => {
				mockItemsService.readByQuery.mockResolvedValue([]);

				await items.handler({
					args: { action: 'read', collection: 'test_collection' },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockItemsService.readByQuery).toHaveBeenCalled();
				expect(mockItemsService.readSingleton).not.toHaveBeenCalled();
			});
		});
	});

	describe('tool configuration', () => {
		test('should have correct tool name', () => {
			expect(items.name).toBe('items');
		});

		test('should not be admin tool', () => {
			expect(items.admin).toBeUndefined();
		});

		test('should have description', () => {
			expect(items.description).toBeDefined();
		});

		test('should have input and validation schemas', () => {
			expect(items.inputSchema).toBeDefined();
			expect(items.validateSchema).toBeDefined();
		});
	});
});

function relation(
	collection: string,
	field: string,
	relatedCollection: string | null,
	options: {
		oneField?: string | null;
		junctionField?: string | null;
		oneCollectionField?: string | null;
		oneAllowedCollections?: string[] | null;
	} = {},
): Relation {
	return {
		collection,
		field,
		related_collection: relatedCollection,
		schema: null,
		meta: {
			id: 1,
			many_collection: collection,
			many_field: field,
			one_collection: relatedCollection,
			one_field: options.oneField ?? null,
			one_collection_field: options.oneCollectionField ?? null,
			one_allowed_collections: options.oneAllowedCollections ?? null,
			one_deselect_action: 'nullify',
			junction_field: options.junctionField ?? null,
			sort_field: null,
		},
	};
}
