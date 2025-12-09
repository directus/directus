import type { Accountability, FlowRaw, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi, type MockedFunction } from 'vitest';
import { FlowsService } from '../../../services/flows.js';
import { flows } from './index.js';

vi.mock('../../../services/flows');

describe('flows tool', () => {
	const mockSchema = { collections: {}, fields: {}, relations: {} } as unknown as SchemaOverview;
	const mockAccountability = { user: 'test-user' } as Accountability;

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('file operations', () => {
		let mockFlowsService: {
			createOne: MockedFunction<any>;
			readOne: MockedFunction<any>;
			readByQuery: MockedFunction<any>;
			updateOne: MockedFunction<any>;
			deleteOne: MockedFunction<any>;
		};

		beforeEach(() => {
			mockFlowsService = {
				createOne: vi.fn(),
				readOne: vi.fn(),
				readByQuery: vi.fn(),
				updateOne: vi.fn(),
				deleteOne: vi.fn(),
			};

			vi.mocked(FlowsService).mockImplementation(() => mockFlowsService as unknown as FlowsService);
		});

		describe('CREATE action', () => {
			test('should create a flow and return the result', async () => {
				const mockFlowData = {
					name: 'Test Flow',
					trigger: 'manual',
					status: 'active',
				} satisfies Partial<FlowRaw>;

				const mockCreatedKey = 'flow-123';
				const mockCreatedFlow = { id: mockCreatedKey, ...mockFlowData };

				mockFlowsService.createOne.mockResolvedValue(mockCreatedKey);
				mockFlowsService.readOne.mockResolvedValue(mockCreatedFlow);

				const result = await flows.handler({
					args: { action: 'create', data: mockFlowData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFlowsService.createOne).toHaveBeenCalledWith(mockFlowData);
				expect(mockFlowsService.readOne).toHaveBeenCalledWith(mockCreatedKey);

				expect(result).toEqual({
					type: 'text',
					data: mockCreatedFlow,
				});
			});

			test('should handle null result from readOne after create', async () => {
				const mockFlowData = { name: 'Test Flow', trigger: 'manual' } satisfies Partial<FlowRaw>;
				const mockCreatedKey = 'flow-123';

				mockFlowsService.createOne.mockResolvedValue(mockCreatedKey);
				mockFlowsService.readOne.mockResolvedValue(null);

				const result = await flows.handler({
					args: { action: 'create', data: mockFlowData },
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
			test('should read flows by query', async () => {
				const mockFlows = [
					{ id: 'flow-1', name: 'Flow 1', trigger: 'manual' },
					{ id: 'flow-2', name: 'Flow 2', trigger: 'event' },
				];

				mockFlowsService.readByQuery.mockResolvedValue(mockFlows);

				const result = await flows.handler({
					args: { action: 'read' },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFlowsService.readByQuery).toHaveBeenCalledWith({});

				expect(result).toEqual({
					type: 'text',
					data: mockFlows,
				});
			});
		});

		describe('UPDATE action', () => {
			test('should update a flow and return the updated result', async () => {
				const mockKey = 'flow-123';
				const mockUpdateData = { status: 'inactive', description: 'Updated description' } satisfies Partial<FlowRaw>;
				const mockUpdatedFlow = { id: mockKey, name: 'Test Flow', ...mockUpdateData };

				mockFlowsService.updateOne.mockResolvedValue(mockKey);
				mockFlowsService.readOne.mockResolvedValue(mockUpdatedFlow);

				const result = await flows.handler({
					args: { action: 'update', key: mockKey, data: mockUpdateData },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFlowsService.updateOne).toHaveBeenCalledWith(mockKey, mockUpdateData);
				expect(mockFlowsService.readOne).toHaveBeenCalledWith(mockKey, {});

				expect(result).toEqual({
					type: 'text',
					data: mockUpdatedFlow,
				});
			});
		});

		describe('DELETE action', () => {
			test('should delete a flow and return the deleted key', async () => {
				const mockKey = 'flow-123';

				mockFlowsService.deleteOne.mockResolvedValue(mockKey);

				const result = await flows.handler({
					args: { action: 'delete', key: mockKey },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFlowsService.deleteOne).toHaveBeenCalledWith(mockKey);

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
				flows.handler({
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
			expect(flows.name).toBe('flows');
		});

		test('should be admin tool', () => {
			expect(flows.admin).toBe(true);
		});

		test('should have description', () => {
			expect(flows.description).toBeDefined();
		});

		test('should have input and validation schemas', () => {
			expect(flows.inputSchema).toBeDefined();
			expect(flows.validateSchema).toBeDefined();
		});
	});
});
