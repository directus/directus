import type { Accountability, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi, type MockedFunction } from 'vitest';
import { OperationsService } from '../../../services/operations.js';
import { operations } from './index.js';

vi.mock('../../../services/operations');

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
			deleteOne: MockedFunction<any>;
		};

		beforeEach(() => {
			mockOperationsService = {
				createOne: vi.fn(),
				readOne: vi.fn(),
				readByQuery: vi.fn(),
				updateOne: vi.fn(),
				deleteOne: vi.fn(),
			};

			vi.mocked(OperationsService).mockImplementation(() => mockOperationsService as unknown as OperationsService);
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

				mockOperationsService.createOne.mockResolvedValue(mockCreatedKey);
				mockOperationsService.readOne.mockResolvedValue(mockCreatedOperation);

				const result = await operations.handler({
					args: { action: 'create', data: mockOperationData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockOperationsService.createOne).toHaveBeenCalledWith(mockOperationData);
				expect(mockOperationsService.readOne).toHaveBeenCalledWith(mockCreatedKey);

				expect(result).toEqual({
					type: 'text',
					data: mockCreatedOperation,
				});
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
		});

		describe('DELETE action', () => {
			test('should delete an operation and return the deleted key', async () => {
				const mockKey = 'operation-123';

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
		test('should have correct tool name', () => {
			expect(operations.name).toBe('operations');
		});

		test('should be admin tool', () => {
			expect(operations.admin).toBe(true);
		});

		test('should have description', () => {
			expect(operations.description).toBeDefined();
		});

		test('should have input and validation schemas', () => {
			expect(operations.inputSchema).toBeDefined();
			expect(operations.validateSchema).toBeDefined();
		});
	});
});
