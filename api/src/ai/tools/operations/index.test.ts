import type { Accountability, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, type MockedFunction, test, vi } from 'vitest';
import { ItemsService } from '../../../services/items.js';
import { OperationsService } from '../../../services/operations.js';
import { operations } from './index.js';

vi.mock('../../../services/operations');
vi.mock('../../../services/items');
vi.mock('../../../flows.js', () => ({ getFlowManager: () => ({ reload: vi.fn() }) }));

describe('operations tool', () => {
	const mockSchema = { collections: {}, fields: {}, relations: {} } as unknown as SchemaOverview;
	const mockAccountability = { user: 'test-user' } as Accountability;

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('operation operations', () => {
		let mockOperationsService: {
			createOne: MockedFunction<any>;
			readOne: MockedFunction<any>;
			readByQuery: MockedFunction<any>;
			updateOne: MockedFunction<any>;
			updateBatch: MockedFunction<any>;
			deleteOne: MockedFunction<any>;
		};

		let mockFlowsItemsService: { readByQuery: MockedFunction<any>; readOne: MockedFunction<any> };

		beforeEach(() => {
			mockOperationsService = {
				createOne: vi.fn(),
				readOne: vi.fn(),
				readByQuery: vi.fn(),
				updateOne: vi.fn(),
				updateBatch: vi.fn(),
				deleteOne: vi.fn(),
			};

			mockFlowsItemsService = {
				readByQuery: vi.fn().mockResolvedValue([]),
				readOne: vi.fn().mockResolvedValue({ operation: null }),
			};

			vi.mocked(OperationsService).mockImplementation(() => mockOperationsService as unknown as OperationsService);

			// Layout shifts run on a plain ItemsService('directus_operations'); alias
			// it to the operations mock so all shift assertions land in one place
			vi.mocked(ItemsService).mockImplementation(
				(collection) =>
					(collection === 'directus_flows' ? mockFlowsItemsService : mockOperationsService) as unknown as ItemsService,
			);
		});

		describe('CREATE action', () => {
			test('should create an operation and return the result', async () => {
				const mockOperationData = {
					name: 'Test Operation',
					type: 'log',
					flow: 'flow-123',
				};

				const mockCreatedKey = 'operation-123';
				const mockCreatedOperation = { id: mockCreatedKey, ...mockOperationData };

				mockOperationsService.readByQuery.mockResolvedValue([]);
				mockOperationsService.createOne.mockResolvedValue(mockCreatedKey);
				mockOperationsService.readOne.mockResolvedValue(mockCreatedOperation);

				const result = await operations.handler({
					args: { action: 'create', data: mockOperationData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockOperationsService.createOne).toHaveBeenCalledWith({
					...mockOperationData,
					position_x: 19,
					position_y: 1,
				});

				expect(mockOperationsService.readOne).toHaveBeenCalledWith(mockCreatedKey);

				expect(result).toEqual({
					type: 'text',
					data: mockCreatedOperation,
				});
			});

			test('should honor explicit positions without a layout pass', async () => {
				const mockOperationData = {
					key: 'validate',
					type: 'condition',
					flow: 'flow-123',
					position_x: 37,
					position_y: 1,
				};

				mockOperationsService.createOne.mockResolvedValue('operation-123');
				mockOperationsService.readOne.mockResolvedValue({ id: 'operation-123' });

				await operations.handler({
					args: { action: 'create', data: mockOperationData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockOperationsService.createOne).toHaveBeenCalledWith(mockOperationData);
				expect(mockOperationsService.readByQuery).not.toHaveBeenCalled();
				expect(mockOperationsService.updateBatch).not.toHaveBeenCalled();
			});
		});

		describe('READ action', () => {
			test('should read operations by query', async () => {
				const mockOperations = [
					{ id: 'op-1', name: 'Operation 1', type: 'log' },
					{ id: 'op-2', name: 'Operation 2', type: 'webhook' },
				];

				mockOperationsService.readByQuery.mockResolvedValue(mockOperations);

				const result = await operations.handler({
					args: { action: 'read' },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockOperationsService.readByQuery).toHaveBeenCalledWith({});

				expect(result).toEqual({
					type: 'text',
					data: mockOperations,
				});
			});
		});

		describe('UPDATE action', () => {
			test('should update an operation and return the updated result', async () => {
				const mockKey = 'operation-123';
				const mockUpdateData = { name: 'Updated Operation' };
				const mockUpdatedOperation = { id: mockKey, ...mockUpdateData };

				mockOperationsService.updateOne.mockResolvedValue(mockKey);
				mockOperationsService.readOne.mockResolvedValue(mockUpdatedOperation);

				const result = await operations.handler({
					args: { action: 'update', key: mockKey, data: mockUpdateData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockOperationsService.updateOne).toHaveBeenCalledWith(mockKey, mockUpdateData);
				expect(mockOperationsService.readOne).toHaveBeenCalledWith(mockKey, {});

				expect(result).toEqual({
					type: 'text',
					data: mockUpdatedOperation,
				});
			});

			test('should apply explicit position updates without a layout pass', async () => {
				const mockKey = 'operation-123';
				const mockUpdateData = { position_x: 37 };

				mockOperationsService.updateOne.mockResolvedValue(mockKey);
				mockOperationsService.readOne.mockResolvedValue({ id: mockKey, ...mockUpdateData });

				await operations.handler({
					args: { action: 'update', key: mockKey, data: mockUpdateData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockOperationsService.updateOne).toHaveBeenCalledWith(mockKey, mockUpdateData);
				expect(mockOperationsService.updateBatch).not.toHaveBeenCalled();
			});

			test('should allow moving an unlinked operation between flows', async () => {
				const mockKey = 'operation-123';
				const mockUpdateData = { flow: 'flow-b' };

				mockOperationsService.readOne
					.mockResolvedValueOnce({ id: mockKey, flow: 'flow-a', resolve: null, reject: null })
					.mockResolvedValue({ id: mockKey, ...mockUpdateData });

				mockOperationsService.readByQuery.mockResolvedValue([]);
				mockOperationsService.updateOne.mockResolvedValue(mockKey);

				await operations.handler({
					args: { action: 'update', key: mockKey, data: mockUpdateData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockOperationsService.updateOne).toHaveBeenCalledWith(mockKey, mockUpdateData);
			});

			test('should re-derive the flow layout when linking operations', async () => {
				const mockKey = 'parent-op';
				const mockUpdateData = { resolve: 'child-op' };

				mockOperationsService.updateOne.mockResolvedValue(mockKey);

				mockOperationsService.readOne
					.mockResolvedValueOnce({ flow: 'flow-123' })
					.mockResolvedValue({ id: mockKey, ...mockUpdateData });

				mockOperationsService.readByQuery.mockResolvedValue([
					{ id: mockKey, resolve: 'child-op', reject: null, position_x: 19, position_y: 1 },
					{ id: 'child-op', resolve: null, reject: null, position_x: 73, position_y: 1 },
				]);

				await operations.handler({
					args: { action: 'update', key: mockKey, data: mockUpdateData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockOperationsService.updateOne).toHaveBeenCalledWith(mockKey, mockUpdateData);

				expect(mockOperationsService.updateBatch).toHaveBeenCalledWith([
					{ id: 'child-op', position_x: 37, position_y: 1 },
				]);
			});

			test('should reject moving a linked operation to another flow', async () => {
				const mockKey = 'operation-123';

				mockOperationsService.readOne.mockResolvedValue({
					id: mockKey,
					flow: 'flow-a',
					position_x: 19,
					position_y: 1,
					resolve: 'child-op',
					reject: null,
				});

				mockOperationsService.readByQuery.mockResolvedValue([]);

				await expect(
					operations.handler({
						args: { action: 'update', key: mockKey, data: { flow: 'flow-b' } },
						schema: mockSchema,
						accountability: mockAccountability,
					}),
				).rejects.toThrow(/linked operation/);

				expect(mockOperationsService.updateOne).not.toHaveBeenCalled();
			});
		});

		describe('DELETE action', () => {
			test('should delete an operation and re-derive the flow layout', async () => {
				const mockKey = 'operation-123';

				mockOperationsService.readOne.mockResolvedValue({ flow: 'flow-123' });
				mockOperationsService.readByQuery.mockResolvedValue([]);
				mockOperationsService.deleteOne.mockResolvedValue(mockKey);

				const result = await operations.handler({
					args: { action: 'delete', key: mockKey },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockOperationsService.deleteOne).toHaveBeenCalledWith(mockKey);

				expect(result).toEqual({
					type: 'text',
					data: mockKey,
				});
			});
		});
	});

	describe('error handling', () => {
		test('should throw error for invalid action', async () => {
			await expect(
				operations.handler({
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
		test('should expose the expected tool configuration', () => {
			expect(operations.name).toBe('operations');
			expect(operations.admin).toBe(true);
			expect(operations.description).toBeDefined();
			expect(operations.inputSchema).toBeDefined();
			expect(operations.validateSchema).toBeDefined();
		});
	});
});
