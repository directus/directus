import type { Accountability, FlowRaw, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, type MockedFunction, test, vi } from 'vitest';
import { FlowsService } from '../../../services/flows.js';
import { ItemsService } from '../../../services/items.js';
import { flows } from './index.js';

vi.mock('../../../services/flows');
vi.mock('../../../services/items');
vi.mock('../../../flows.js', () => ({ getFlowManager: () => ({ reload: vi.fn() }) }));

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

		let mockLayoutService: { readByQuery: MockedFunction<any>; updateBatch: MockedFunction<any> };

		beforeEach(() => {
			mockFlowsService = {
				createOne: vi.fn(),
				readOne: vi.fn(),
				readByQuery: vi.fn(),
				updateOne: vi.fn(),
				deleteOne: vi.fn(),
			};

			vi.mocked(FlowsService).mockImplementation(() => mockFlowsService as unknown as FlowsService);

			mockLayoutService = {
				readByQuery: vi.fn().mockResolvedValue([]),
				updateBatch: vi.fn().mockResolvedValue([]),
			};

			// FlowsService extends ItemsService, so its automocked constructor runs
			// through this implementation too; dispatch on the collection
			vi.mocked(ItemsService).mockImplementation(
				(collection) =>
					(collection === 'directus_operations' ? mockLayoutService : mockFlowsService) as unknown as ItemsService,
			);
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

			test('should give nested operations placeholder positions and lay out the flow', async () => {
				const mockFlowData = {
					name: 'Test Flow',
					trigger: 'manual',
					operations: [{ key: 'log_message', type: 'log' }],
				};

				mockFlowsService.createOne.mockResolvedValue('flow-123');
				mockFlowsService.readOne.mockResolvedValue({ id: 'flow-123', operation: null });

				await flows.handler({
					args: { action: 'create', data: mockFlowData as any },
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(mockFlowsService.createOne).toHaveBeenCalledWith({
					...mockFlowData,
					operations: [{ position_x: 19, position_y: 1, key: 'log_message', type: 'log' }],
				});

				expect(mockLayoutService.readByQuery).toHaveBeenCalledWith(
					expect.objectContaining({ filter: { flow: { _eq: 'flow-123' } } }),
				);
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
		test('should expose the expected tool configuration', () => {
			expect(flows.name).toBe('flows');
			expect(flows.admin).toBe(true);
			expect(flows.description).toBeDefined();
			expect(flows.inputSchema).toBeDefined();
			expect(flows.validateSchema).toBeDefined();
		});
	});
});
