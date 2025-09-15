import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi, type MockedFunction } from 'vitest';
import { ItemsService } from '../../services/items.js';
import { items } from './items.js';

vi.mock('../../services/items.js');

describe('items tool', () => {
	const mockSchema = {
		collections: {
			test_collection: { singleton: false },
			singleton_collection: { singleton: true },
		},
		fields: {},
		relations: {},
	} as unknown as SchemaOverview;

	const mockAccountability = { user: 'test-user' } as Accountability;
	const mockSanitizedQuery = { fields: ['*'] };

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('item operations', () => {
		let mockItemsService: {
			createMany: MockedFunction<any>;
			readMany: MockedFunction<any>;
			readByQuery: MockedFunction<any>;
			readSingleton: MockedFunction<any>;
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
				readByQuery: vi.fn(),
				readSingleton: vi.fn(),
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
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockItemsService.createMany).toHaveBeenCalledWith([item]);
				expect(mockItemsService.readMany).toHaveBeenCalledWith(savedKeys, mockSanitizedQuery);

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
					sanitizedQuery: mockSanitizedQuery,
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
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockItemsService.upsertSingleton).toHaveBeenCalledWith(item);
				expect(mockItemsService.readSingleton).toHaveBeenCalledWith(mockSanitizedQuery);

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
					sanitizedQuery: mockSanitizedQuery,
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
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockItemsService.readByQuery).toHaveBeenCalledWith(mockSanitizedQuery);

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
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockItemsService.readMany).toHaveBeenCalledWith(keys, mockSanitizedQuery);

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
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockItemsService.readSingleton).toHaveBeenCalledWith(mockSanitizedQuery);
				expect(result).toEqual({ type: 'text', data: singletonItem });
			});

			test('should return null when no items found', async () => {
				mockItemsService.readByQuery.mockResolvedValue(null);

				const result = await items.handler({
					args: { action: 'read', collection: 'test_collection' },
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
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
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockItemsService.updateMany).toHaveBeenCalledWith(keys, updateData);
				expect(mockItemsService.readMany).toHaveBeenCalledWith(keys, mockSanitizedQuery);

				expect(result).toEqual({
					type: 'text',
					data: updatedItems,
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
					sanitizedQuery: mockSanitizedQuery,
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
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockItemsService.updateByQuery).toHaveBeenCalledWith(mockSanitizedQuery, updateData);

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
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(mockItemsService.upsertSingleton).toHaveBeenCalledWith(updateData);
				expect(mockItemsService.readSingleton).toHaveBeenCalledWith(mockSanitizedQuery);

				expect(result).toEqual({
					type: 'text',
					data: updatedSingleton,
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
					sanitizedQuery: mockSanitizedQuery,
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
					sanitizedQuery: mockSanitizedQuery,
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
			readByQuery: MockedFunction<any>;
			readSingleton: MockedFunction<any>;
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
				readByQuery: vi.fn(),
				readSingleton: vi.fn(),
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
					sanitizedQuery: mockSanitizedQuery,
				}),
			).rejects.toThrow(InvalidPayloadError);
		});

		test('should throw ForbiddenError for for non-existent collections', async () => {
			await expect(
				items.handler({
					args: { action: 'read', collection: 'nonexistent' },
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				}),
			).rejects.toThrow(ForbiddenError);
		});

		test('should throw error for invalid action', async () => {
			await expect(
				items.handler({
					args: { action: 'invalid' as any, collection: 'test_collection' },
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
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
					sanitizedQuery: mockSanitizedQuery,
				}),
			).rejects.toThrow('Database connection failed');
		});
	});

	describe('meta', () => {
		let mockItemsService: {
			createMany: MockedFunction<any>;
			readMany: MockedFunction<any>;
			readByQuery: MockedFunction<any>;
			readSingleton: MockedFunction<any>;
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
				readByQuery: vi.fn(),
				readSingleton: vi.fn(),
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
					sanitizedQuery: mockSanitizedQuery,
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
					sanitizedQuery: mockSanitizedQuery,
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
					sanitizedQuery: mockSanitizedQuery,
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
