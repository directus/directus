import type { Accountability, Collection, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi, type MockedFunction } from 'vitest';
import { CollectionsService } from '@/services/collections.js';
import { collections } from './index.js';

vi.mock('@/services/collections.js');

describe('collections tool', () => {
	const mockSchema = { collections: {}, fields: {}, relations: {} } as unknown as SchemaOverview;
	const mockAccountability = { user: 'test-user', admin: true } as Accountability;

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('collection operations', () => {
		let mockCollectionsService: {
			createMany: MockedFunction<any>;
			readMany: MockedFunction<any>;
			readByQuery: MockedFunction<any>;
			updateBatch: MockedFunction<any>;
			deleteMany: MockedFunction<any>;
		};

		beforeEach(() => {
			mockCollectionsService = {
				createMany: vi.fn(),
				readMany: vi.fn(),
				readByQuery: vi.fn(),
				updateBatch: vi.fn(),
				deleteMany: vi.fn(),
			};

			vi.mocked(CollectionsService).mockImplementation(() => mockCollectionsService as unknown as CollectionsService);
		});

		describe('CREATE action', () => {
			test('should create a single collection', async () => {
				const collectionData = {
					collection: 'test_collection',
					meta: { hidden: false, singleton: false },
				};

				mockCollectionsService.createMany.mockResolvedValue(['test_collection']);
				mockCollectionsService.readMany.mockResolvedValue([collectionData]);

				const result = await collections.handler({
					args: {
						action: 'create',
						data: collectionData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
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

			test('should create multiple collections', async () => {
				const collectionsData = [
					{ collection: 'collection1', meta: { hidden: false } },
					{ collection: 'collection2', meta: { hidden: false } },
				];

				mockCollectionsService.createMany.mockResolvedValue(['collection1', 'collection2']);
				mockCollectionsService.readMany.mockResolvedValue(collectionsData);

				const result = await collections.handler({
					args: {
						action: 'create',
						data: collectionsData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockCollectionsService.createMany).toHaveBeenCalledWith(collectionsData);
				expect(result).toEqual({ type: 'text', data: collectionsData });
			});
		});

		describe('READ action', () => {
			test('should read collections by keys', async () => {
				const keys = ['collection1', 'collection2'];

				const expectedData = [
					{ collection: 'collection1', meta: { hidden: false } },
					{ collection: 'collection2', meta: { hidden: false } },
				];

				mockCollectionsService.readMany.mockResolvedValue(expectedData);

				const result = await collections.handler({
					args: {
						action: 'read',
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockCollectionsService.readMany).toHaveBeenCalledWith(keys);
				expect(result).toEqual({ type: 'text', data: expectedData });
			});

			test('should read collections by query', async () => {
				const expectedData = [{ collection: 'test_collection' }];
				mockCollectionsService.readByQuery.mockResolvedValue(expectedData);

				const result = await collections.handler({
					args: {
						action: 'read',
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockCollectionsService.readByQuery).toHaveBeenCalled();
				expect(result).toEqual({ type: 'text', data: expectedData });
			});
		});

		describe('UPDATE action', () => {
			test('should update collection by data array', async () => {
				const keys = ['collection1'];
				const updateData = { collection: 'collection1', meta: { hidden: true }, schema: {} } as Collection;
				const expectedResult = [{ collection: 'collection1', meta: { hidden: true } }];

				mockCollectionsService.updateBatch.mockResolvedValue(keys);
				mockCollectionsService.readMany.mockResolvedValue(expectedResult);

				const result = await collections.handler({
					args: {
						action: 'update',
						data: updateData,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockCollectionsService.updateBatch).toHaveBeenCalledWith([updateData]);
				expect(result).toEqual({ type: 'text', data: expectedResult });
			});
		});

		describe('DELETE action', () => {
			test('should delete collections', async () => {
				const keys = ['collection1', 'collection2'];

				mockCollectionsService.deleteMany.mockResolvedValue(keys);

				const result = await collections.handler({
					args: {
						action: 'delete',
						keys,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockCollectionsService.deleteMany).toHaveBeenCalledWith(keys);

				expect(result).toEqual({
					type: 'text',
					data: keys,
				});
			});
		});
	});

	describe('error handling', () => {
		test('should throw error for invalid action', async () => {
			await expect(
				collections.handler({
					args: {
						action: 'invalid' as any,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				}),
			).rejects.toThrow('Invalid action.');
		});
	});

	describe('tool configuration', () => {
		test('should have correct tool name', () => {
			expect(collections.name).toBe('collections');
		});

		test('should be admin tool', () => {
			expect(collections.admin).toBe(true);
		});

		test('should have description', () => {
			expect(collections.description).toBeDefined();
		});

		test('should have input and validation schemas', () => {
			expect(collections.inputSchema).toBeDefined();
			expect(collections.validateSchema).toBeDefined();
		});
	});
});
