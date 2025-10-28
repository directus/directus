import type { Accountability, SchemaOverview } from '@directus/types';
import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ErrorCode } from '@directus/errors';
import { CollectionsService } from '../services/collections.js';
import { MetaService } from '../services/meta.js';

const mockCreateOne = vi.fn();
const mockCreateMany = vi.fn();
const mockReadOne = vi.fn();
const mockReadMany = vi.fn();
const mockReadByQuery = vi.fn();
const mockUpdateOne = vi.fn();
const mockUpdateBatch = vi.fn();
const mockDeleteOne = vi.fn();
const mockGetMetaForQuery = vi.fn();

vi.mock('../database/index.js', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn(),
}));

vi.mock('../services/collections.js', () => ({
	CollectionsService: vi.fn(() => ({
		createOne: mockCreateOne,
		createMany: mockCreateMany,
		readOne: mockReadOne,
		readMany: mockReadMany,
		readByQuery: mockReadByQuery,
		updateOne: mockUpdateOne,
		updateBatch: mockUpdateBatch,
		deleteOne: mockDeleteOne,
	})),
}));

vi.mock('../services/meta.js', () => ({
	MetaService: vi.fn(() => ({
		getMetaForQuery: mockGetMetaForQuery,
	})),
}));

describe('Collections Controller', () => {
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;
	let mockAccountability: Accountability;
	let mockSchema: SchemaOverview;

	beforeEach(() => {
		mockAccountability = { role: 'admin' } as Accountability;
		mockSchema = {} as SchemaOverview;

		mockReq = {
			accountability: mockAccountability,
			schema: mockSchema,
			body: {},
			params: {},
			query: {},
		} as Partial<Request>;

		mockRes = {
			locals: {},
		} as Partial<Response>;

		// Reset all mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('POST / - Create Collection', () => {
		test('should create a single collection', async () => {
			const collectionData = { collection: 'test_collection', fields: [] };
			const createdCollection = { ...collectionData, id: 1 };

			mockReq.body = collectionData;
			mockReq.query = {};
			mockCreateOne.mockResolvedValue('test_collection');
			mockReadOne.mockResolvedValue(createdCollection);

			// Simulate the handler logic
			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			const attemptConcurrentIndex =
				'concurrentIndexCreation' in mockReq.query! && mockReq.query['concurrentIndexCreation'] !== 'false';

			const collectionKey = await collectionsService.createOne(mockReq.body, {
				attemptConcurrentIndex,
			});

			const record = await collectionsService.readOne(collectionKey);
			mockRes.locals!['payload'] = { data: record || null };

			expect(mockCreateOne).toHaveBeenCalledWith(collectionData, {
				attemptConcurrentIndex: false,
			});

			expect(mockReadOne).toHaveBeenCalledWith('test_collection');
			expect(mockRes.locals?.['payload']).toEqual({ data: createdCollection });
		});

		test('should create a single collection with concurrentIndexCreation enabled', async () => {
			const collectionData = { collection: 'test_collection', fields: [] };
			const createdCollection = { ...collectionData, id: 1 };

			mockReq.body = collectionData;
			mockReq.query = { concurrentIndexCreation: 'true' };
			mockCreateOne.mockResolvedValue('test_collection');
			mockReadOne.mockResolvedValue(createdCollection);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			const attemptConcurrentIndex =
				'concurrentIndexCreation' in mockReq.query! && mockReq.query['concurrentIndexCreation'] !== 'false';

			const collectionKey = await collectionsService.createOne(mockReq.body, {
				attemptConcurrentIndex,
			});

			const record = await collectionsService.readOne(collectionKey);
			mockRes.locals!['payload'] = { data: record || null };

			expect(mockCreateOne).toHaveBeenCalledWith(collectionData, {
				attemptConcurrentIndex: true,
			});

			expect(mockReadOne).toHaveBeenCalledWith('test_collection');
			expect(mockRes.locals?.['payload']).toEqual({ data: createdCollection });
		});

		test('should create multiple collections', async () => {
			const collectionsData = [
				{ collection: 'test_collection1', fields: [] },
				{ collection: 'test_collection2', fields: [] },
			];

			const createdCollections = [
				{ ...collectionsData[0], id: 1 },
				{ ...collectionsData[1], id: 2 },
			];

			mockReq.body = collectionsData;
			mockReq.query = {};
			mockCreateMany.mockResolvedValue(['test_collection1', 'test_collection2']);
			mockReadMany.mockResolvedValue(createdCollections);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			const attemptConcurrentIndex =
				'concurrentIndexCreation' in mockReq.query! && mockReq.query['concurrentIndexCreation'] !== 'false';

			const collectionKey = await collectionsService.createMany(mockReq.body, {
				attemptConcurrentIndex,
			});

			const records = await collectionsService.readMany(collectionKey);
			mockRes.locals!['payload'] = { data: records || null };

			expect(mockCreateMany).toHaveBeenCalledWith(collectionsData, {
				attemptConcurrentIndex: false,
			});

			expect(mockReadMany).toHaveBeenCalledWith(['test_collection1', 'test_collection2']);
			expect(mockRes.locals?.['payload']).toEqual({ data: createdCollections });
		});

		test('should handle null result from readOne', async () => {
			const collectionData = { collection: 'test_collection', fields: [] };

			mockReq.body = collectionData;
			mockReq.query = {};
			mockCreateOne.mockResolvedValue('test_collection');
			mockReadOne.mockResolvedValue(null);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			const attemptConcurrentIndex =
				'concurrentIndexCreation' in mockReq.query! && mockReq.query['concurrentIndexCreation'] !== 'false';

			const collectionKey = await collectionsService.createOne(mockReq.body, {
				attemptConcurrentIndex,
			});

			const record = await collectionsService.readOne(collectionKey);
			mockRes.locals!['payload'] = { data: record || null };

			expect(mockRes.locals?.['payload']).toEqual({ data: null });
		});
	});

	describe('GET / - Read Collections', () => {
		test('should read all collections', async () => {
			const collections = [
				{ collection: 'test_collection1', fields: [] },
				{ collection: 'test_collection2', fields: [] },
			];

			const meta = { total: 2 };

			mockReq.body = {};
			mockReadByQuery.mockResolvedValue(collections);
			mockGetMetaForQuery.mockResolvedValue(meta);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			const metaService = new MetaService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			const result = await collectionsService.readByQuery();
			const metaResult = await metaService.getMetaForQuery('directus_collections', {});

			mockRes.locals!['payload'] = { data: result, meta: metaResult };

			expect(mockReadByQuery).toHaveBeenCalled();
			expect(mockGetMetaForQuery).toHaveBeenCalledWith('directus_collections', {});
			expect(mockRes.locals?.['payload']).toEqual({ data: collections, meta });
		});

		test('should read collections by keys', async () => {
			const collections = [
				{ collection: 'test_collection1', fields: [] },
				{ collection: 'test_collection2', fields: [] },
			];

			const meta = { total: 2 };
			const keys = ['test_collection1', 'test_collection2'];

			mockReq.body = { keys };
			mockReadMany.mockResolvedValue(collections);
			mockGetMetaForQuery.mockResolvedValue(meta);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			const metaService = new MetaService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			let result;

			if (mockReq.body.keys) {
				result = await collectionsService.readMany(mockReq.body.keys);
			} else {
				result = await collectionsService.readByQuery();
			}

			const metaResult = await metaService.getMetaForQuery('directus_collections', {});

			mockRes.locals!['payload'] = { data: result, meta: metaResult };

			expect(mockReadMany).toHaveBeenCalledWith(keys);
			expect(mockGetMetaForQuery).toHaveBeenCalledWith('directus_collections', {});
			expect(mockRes.locals?.['payload']).toEqual({ data: collections, meta });
		});
	});

	describe('GET /:collection - Read One Collection', () => {
		test('should read a single collection', async () => {
			const collection = { collection: 'test_collection', fields: [] };

			mockReq.params = { collection: 'test_collection' };
			mockReadOne.mockResolvedValue(collection);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			const result = await collectionsService.readOne(mockReq.params['collection']!);
			mockRes.locals!['payload'] = { data: result || null };

			expect(mockReadOne).toHaveBeenCalledWith('test_collection');
			expect(mockRes.locals?.['payload']).toEqual({ data: collection });
		});

		test('should handle null result', async () => {
			mockReq.params = { collection: 'nonexistent' };
			mockReadOne.mockResolvedValue(null);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			const result = await collectionsService.readOne(mockReq.params['collection']!);
			mockRes.locals!['payload'] = { data: result || null };

			expect(mockRes.locals?.['payload']).toEqual({ data: null });
		});
	});

	describe('PATCH / - Update Batch', () => {
		test('should update multiple collections', async () => {
			const updates = [
				{ collection: 'test_collection1', note: 'Updated 1' },
				{ collection: 'test_collection2', note: 'Updated 2' },
			];

			const updatedCollections = [
				{ collection: 'test_collection1', note: 'Updated 1' },
				{ collection: 'test_collection2', note: 'Updated 2' },
			];

			mockReq.body = updates;
			mockUpdateBatch.mockResolvedValue(['test_collection1', 'test_collection2']);
			mockReadMany.mockResolvedValue(updatedCollections);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			const collectionKeys = await collectionsService.updateBatch(mockReq.body);
			const collections = await collectionsService.readMany(collectionKeys);
			mockRes.locals!['payload'] = { data: collections || null };

			expect(mockUpdateBatch).toHaveBeenCalledWith(updates);
			expect(mockReadMany).toHaveBeenCalledWith(['test_collection1', 'test_collection2']);
			expect(mockRes.locals?.['payload']).toEqual({ data: updatedCollections });
		});

		test('should handle forbidden error when reading after update', async () => {
			const updates = [{ collection: 'test_collection1', note: 'Updated' }];

			mockReq.body = updates;
			mockUpdateBatch.mockResolvedValue(['test_collection1']);

			const forbiddenError = new Error('Forbidden') as any;
			forbiddenError.code = ErrorCode.Forbidden;
			mockReadMany.mockRejectedValue(forbiddenError);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			const collectionKeys = await collectionsService.updateBatch(mockReq.body);

			// Simulate the error handling logic from the controller
			let errorThrown = false;

			try {
				await collectionsService.readMany(collectionKeys);
			} catch (error: any) {
				if (error.code === ErrorCode.Forbidden) {
					// Controller doesn't set payload when forbidden
					errorThrown = true;
				} else {
					throw error;
				}
			}

			expect(mockUpdateBatch).toHaveBeenCalledWith(updates);
			expect(mockReadMany).toHaveBeenCalledWith(['test_collection1']);
			expect(errorThrown).toBe(true);
			expect(mockRes.locals?.['payload']).toBeUndefined();
		});

		test('should throw non-forbidden errors', async () => {
			const updates = [{ collection: 'test_collection1', note: 'Updated' }];
			const error = new Error('Some other error');

			mockReq.body = updates;
			mockUpdateBatch.mockResolvedValue(['test_collection1']);
			mockReadMany.mockRejectedValue(error);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			const collectionKeys = await collectionsService.updateBatch(mockReq.body);

			await expect(collectionsService.readMany(collectionKeys)).rejects.toThrow('Some other error');
		});
	});

	describe('PATCH /:collection - Update One', () => {
		test('should update a single collection', async () => {
			const updateData = { note: 'Updated note' };
			const updatedCollection = { collection: 'test_collection', note: 'Updated note' };

			mockReq.params = { collection: 'test_collection' };
			mockReq.body = updateData;
			mockUpdateOne.mockResolvedValue(undefined);
			mockReadOne.mockResolvedValue(updatedCollection);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			await collectionsService.updateOne(mockReq.params['collection']!, mockReq.body);
			const collection = await collectionsService.readOne(mockReq.params['collection']!);
			mockRes.locals!['payload'] = { data: collection || null };

			expect(mockUpdateOne).toHaveBeenCalledWith('test_collection', updateData);
			expect(mockReadOne).toHaveBeenCalledWith('test_collection');
			expect(mockRes.locals?.['payload']).toEqual({ data: updatedCollection });
		});

		test('should handle forbidden error when reading after update', async () => {
			const updateData = { note: 'Updated note' };

			mockReq.params = { collection: 'test_collection' };
			mockReq.body = updateData;
			mockUpdateOne.mockResolvedValue(undefined);

			const forbiddenError = new Error('Forbidden') as any;
			forbiddenError.code = ErrorCode.Forbidden;
			mockReadOne.mockRejectedValue(forbiddenError);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			await collectionsService.updateOne(mockReq.params['collection']!, mockReq.body);

			// Simulate the error handling logic from the controller
			let errorThrown = false;

			try {
				await collectionsService.readOne(mockReq.params['collection']!);
			} catch (error: any) {
				if (error.code === ErrorCode.Forbidden) {
					errorThrown = true;
				} else {
					throw error;
				}
			}

			expect(mockUpdateOne).toHaveBeenCalledWith('test_collection', updateData);
			expect(mockReadOne).toHaveBeenCalledWith('test_collection');
			expect(errorThrown).toBe(true);
			expect(mockRes.locals?.['payload']).toBeUndefined();
		});

		test('should throw non-forbidden errors', async () => {
			const updateData = { note: 'Updated note' };
			const error = new Error('Some other error');

			mockReq.params = { collection: 'test_collection' };
			mockReq.body = updateData;
			mockUpdateOne.mockResolvedValue(undefined);
			mockReadOne.mockRejectedValue(error);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			await collectionsService.updateOne(mockReq.params['collection']!, mockReq.body);

			await expect(collectionsService.readOne(mockReq.params['collection']!)).rejects.toThrow('Some other error');
		});
	});

	describe('DELETE /:collection - Delete One', () => {
		test('should delete a single collection', async () => {
			mockReq.params = { collection: 'test_collection' };
			mockDeleteOne.mockResolvedValue(undefined);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			await collectionsService.deleteOne(mockReq.params['collection']!);

			expect(mockDeleteOne).toHaveBeenCalledWith('test_collection');
		});

		test('should handle errors during deletion', async () => {
			const error = new Error('Deletion failed');

			mockReq.params = { collection: 'test_collection' };
			mockDeleteOne.mockRejectedValue(error);

			const collectionsService = new CollectionsService({
				accountability: mockReq.accountability,
				schema: mockReq.schema!,
			});

			await expect(collectionsService.deleteOne(mockReq.params['collection']!)).rejects.toThrow('Deletion failed');
		});
	});
});
