import { triggerFlow } from './index.js';
import { getFlowManager } from '../../../flows.js';
import { FlowsService } from '../../../services/flows.js';
import type { Accountability, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, type MockedFunction, test, vi } from 'vitest';

vi.mock('../../../services/flows.js');
vi.mock('../../../flows');

describe('trigger flow tool', () => {
	const mockSchema = { collections: {}, fields: {}, relations: {} } as unknown as SchemaOverview;
	const mockAccountability = { user: 'test-user' } as Accountability;

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('handler', () => {
		let mockFlowManager: {
			runWebhookFlow: MockedFunction<any>;
		};

		let mockFlowsService: {
			readOne: MockedFunction<any>;
		};

		beforeEach(() => {
			mockFlowManager = {
				runWebhookFlow: vi.fn(),
			};

			mockFlowsService = {
				readOne: vi.fn(),
			};

			vi.mocked(getFlowManager).mockImplementation(
				() => mockFlowManager as unknown as ReturnType<typeof getFlowManager>,
			);

			vi.mocked(FlowsService).mockImplementation(() => mockFlowsService as unknown as FlowsService);
		});

		test('should trigger a flow with minimal parameters', async () => {
			const mockArgs = {
				id: 'flow-123',
				collection: 'articles',
			};

			const mockResult = { success: true, message: 'Flow executed successfully' };
			mockFlowManager.runWebhookFlow.mockResolvedValue({ result: mockResult });

			mockFlowsService.readOne.mockResolvedValue({});

			const result = await triggerFlow.handler({
				args: mockArgs,
				schema: mockSchema,
				accountability: mockAccountability,
			});

			expect(mockFlowManager.runWebhookFlow).toHaveBeenCalledWith(
				`POST-${mockArgs.id}`,
				{
					path: `/trigger/${mockArgs.id}`,
					query: {},
					body: {
						collection: mockArgs.collection,
					},
					method: 'POST',
					headers: {},
				},
				{ accountability: mockAccountability, schema: mockSchema },
			);

			expect(result).toEqual({
				type: 'text',
				data: mockResult,
			});
		});
	});

	describe('error handling', () => {
		let mockFlowManager: {
			runWebhookFlow: MockedFunction<any>;
		};

		let mockFlowsService: {
			readOne: MockedFunction<any>;
		};

		beforeEach(() => {
			mockFlowManager = {
				runWebhookFlow: vi.fn(),
			};

			mockFlowsService = {
				readOne: vi.fn(),
			};

			vi.mocked(getFlowManager).mockImplementation(
				() => mockFlowManager as unknown as ReturnType<typeof getFlowManager>,
			);

			vi.mocked(FlowsService).mockImplementation(() => mockFlowsService as unknown as FlowsService);
		});

		test('should propogate error from flowService', async () => {
			mockFlowsService.readOne.mockImplementation(() => Promise.reject('Forbidden'));

			const mockArgs = {
				id: 'flow-123',
				collection: 'articles',
				keys: [],
				data: undefined,
			};

			await expect(
				triggerFlow.handler({
					args: mockArgs,
					schema: mockSchema,
					accountability: mockAccountability,
				}),
			).rejects.toThrow('Forbidden');
		});

		test('should throw error when data is missing but required fields exist', async () => {
			mockFlowsService.readOne.mockResolvedValue({
				options: {
					fields: [{ field: 'title', meta: { required: true } }],
				},
			});

			const mockArgs = {
				id: 'flow-123',
				collection: 'articles',
				keys: [],
				data: undefined,
			};

			await expect(
				triggerFlow.handler({
					args: mockArgs,
					schema: mockSchema,
					accountability: mockAccountability,
				}),
			).rejects.toThrow('Invalid payload. Required field "title" is missing.');
		});

		test('should throw error for missing required fields', async () => {
			mockFlowsService.readOne.mockResolvedValue({
				options: {
					fields: [
						{ field: 'title', meta: { required: true } },
						{ field: 'content', meta: { required: false } },
						{ field: 'author', meta: { required: true } },
					],
				},
			});

			const mockArgs = {
				id: 'flow-123',
				collection: 'articles',
				keys: [],
				data: { title: 'Lorem' },
			};

			await expect(
				triggerFlow.handler({
					args: mockArgs,
					schema: mockSchema,
					accountability: mockAccountability,
				}),
			).rejects.toThrow('Invalid payload. Required field "author" is missing.');
		});
	});

	describe('tool configuration', () => {
		test('should have correct tool name', () => {
			expect(triggerFlow.name).toBe('trigger-flow');
		});

		test('should not be admin tool', () => {
			expect(triggerFlow.admin).toBeUndefined();
		});

		test('should have description', () => {
			expect(triggerFlow.description).toBeDefined();
		});

		test('should have input and validation schemas', () => {
			expect(triggerFlow.inputSchema).toBeDefined();
			expect(triggerFlow.validateSchema).toBeDefined();
		});
	});
});
