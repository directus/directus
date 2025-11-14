import { createError, ErrorCode } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, test, vi, type MockedFunction } from 'vitest';
import { z } from 'zod';
import { ItemsService } from '../services/items.js';
import { DirectusMCP } from './server.js';
import { findMcpTool } from './tools/index.js';
import { DirectusTransport } from './transport.js';
import type { ToolConfig } from './types.js';

vi.mock('../services/items.js');

vi.mock('zod-validation-error', () => ({
	fromZodError: vi.fn((_error) => ({ message: 'Validation error' })),
}));

vi.mock('./tools/index.js', () => ({
	getAllMcpTools: vi.fn(() => [
		{
			name: 'test-tool',
			description: 'A test tool',
			inputSchema: z.strictObject({}),
			admin: false,
			annotations: {},
		},
		{
			name: 'admin-tool',
			description: 'An admin tool',
			inputSchema: z.strictObject({}),
			admin: true,
			annotations: {},
		},
	]),
	findMcpTool: vi.fn((name: string) => {
		const tools = {
			'test-tool': {
				name: 'test-tool',
				description: 'A test tool',
				validateSchema: { safeParse: vi.fn(() => ({ data: { test: 'value' } })) },
				admin: false,
				handler: vi.fn(() => Promise.resolve({ type: 'text', data: 'test result' })),
			},
			'admin-tool': {
				name: 'admin-tool',
				description: 'An admin tool',
				validateSchema: { safeParse: vi.fn(() => ({ data: { admin: 'value' } })) },
				admin: true,
				handler: vi.fn(() => Promise.resolve({ type: 'text', data: 'admin result' })),
			},
			'delete-tool': {
				name: 'delete-tool',
				description: 'A delete tool',
				validateSchema: { safeParse: vi.fn(() => ({ data: { action: 'delete' } })) },
				admin: false,
				handler: vi.fn(() => Promise.resolve({ type: 'text', data: 'deleted' })),
			},
		};

		return tools[name as keyof typeof tools] || null;
	}),
}));

function awaitJsonResponse(mcp: DirectusMCP): Promise<void> {
	return new Promise<void>((res) => {
		const _send = mcp.server.transport!.send.bind(mcp.server.transport!);

		mcp.server.transport!.send = async (...args) => {
			_send(...args);
			res();
		};
	});
}

describe('mcp server', () => {
	let directusMCP: DirectusMCP;
	let mockReq: Partial<Request>;
	let mockRes: Response;

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('handleRequest', () => {
		beforeEach(() => {
			directusMCP = new DirectusMCP();

			mockRes = {
				json: vi.fn(),
				status: vi.fn().mockReturnThis(),
				send: vi.fn(),
			} as unknown as Response;

			mockReq = {
				accepts: vi.fn((type: string) =>
					type === 'application/json' ? 'application/json' : false,
				) as unknown as Request['accepts'],
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/list',
				},
				accountability: { user: 'user', admin: false } as Accountability,
				schema: {} as SchemaOverview,
			};
		});

		test('should reject non-JSON requests', async () => {
			mockReq.accepts = vi.fn(() => false) as unknown as Request['accepts'];

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			expect(mockRes.status).toHaveBeenCalledWith(405);
			expect(mockRes.send).toHaveBeenCalled();
		});

		test('should reject public request', async () => {
			mockReq.accountability!.user = null;

			expect(() => directusMCP.handleRequest(mockReq as Request, mockRes as Response)).toThrow();
		});

		test('should accept JSON requests', async () => {
			expect(() => directusMCP.handleRequest(mockReq as Request, mockRes as Response)).not.toThrow();
		});

		test('should handle invalid JSON-RPC messages', async () => {
			mockReq.body = { invalid: 'message' };

			expect(() => directusMCP.handleRequest(mockReq as Request, mockRes as Response)).toThrow();
		});
	});

	describe('tool listing', () => {
		beforeEach(() => {
			directusMCP = new DirectusMCP();

			mockRes = {
				json: vi.fn(),
				status: vi.fn().mockReturnThis(),
				send: vi.fn(),
			} as unknown as Response;

			mockReq = {
				accepts: vi.fn((type: string) =>
					type === 'application/json' ? 'application/json' : false,
				) as unknown as Request['accepts'],
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/list',
				},
				accountability: { user: 'user', admin: false } as Accountability,
				schema: {} as SchemaOverview,
			};
		});

		test('should filter admin tools for non-admin users', async () => {
			mockReq.accountability = { admin: false, user: 'user' } as Accountability;

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith({
				id: 1,
				jsonrpc: '2.0',
				result: {
					tools: [
						{
							annotations: {},
							description: 'A test tool',
							inputSchema: {
								$schema: 'https://json-schema.org/draft/2020-12/schema',
								additionalProperties: false,
								properties: {},
								type: 'object',
							},
							name: 'test-tool',
						},
					],
				},
			});
		});

		test('should include admin tools for admin users', async () => {
			// Simulate admin user
			mockReq.accountability = { admin: true, user: 'user' } as Accountability;

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith({
				id: 1,
				jsonrpc: '2.0',
				result: {
					tools: [
						{
							annotations: {},
							description: 'A test tool',
							inputSchema: {
								$schema: 'https://json-schema.org/draft/2020-12/schema',
								additionalProperties: false,
								properties: {},
								type: 'object',
							},
							name: 'test-tool',
						},
						{
							annotations: {},
							description: 'An admin tool',
							inputSchema: {
								$schema: 'https://json-schema.org/draft/2020-12/schema',
								additionalProperties: false,
								properties: {},

								type: 'object',
							},
							name: 'admin-tool',
						},
					],
				},
			});
		});
	});

	describe('tool execution', () => {
		beforeEach(() => {
			directusMCP = new DirectusMCP();

			mockRes = {
				json: vi.fn(),
				status: vi.fn().mockReturnThis(),
				send: vi.fn(),
			} as unknown as Response;

			mockReq = {
				accepts: vi.fn((type: string) =>
					type === 'application/json' ? 'application/json' : false,
				) as unknown as Request['accepts'],
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/list',
				},
				accountability: { user: 'user', admin: false } as Accountability,
				schema: {} as SchemaOverview,
			};
		});

		test('should execute a valid tool successfully', async () => {
			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/call',
					params: {
						name: 'test-tool',
						arguments: { test: 'value' },
					},
				},
				accountability: { user: 'user', admin: false },
				schema: {},
			} as unknown as Request;

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			// Verify the response was sent via res.json
			expect(mockRes.json).toHaveBeenCalledWith(
				expect.objectContaining({
					jsonrpc: '2.0',
					id: 1,
					result: expect.objectContaining({
						content: expect.arrayContaining([
							expect.objectContaining({
								type: 'text',
								text: JSON.stringify({ raw: 'test result' }),
							}),
						]),
					}),
				}),
			);
		});

		test('should return error for non-existent tool', async () => {
			vi.mocked(findMcpTool).mockReturnValueOnce(undefined);

			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/call',
					params: {
						name: 'non-existent-tool',
						arguments: {},
					},
				},
				accountability: { user: 'user', admin: false },
				schema: {},
			} as unknown as Request;

			directusMCP.handleRequest(mockReq, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith(
				expect.objectContaining({
					jsonrpc: '2.0',
					id: 1,
					result: expect.objectContaining({
						isError: true,
						content: expect.arrayContaining([
							expect.objectContaining({
								type: 'text',
								text: expect.stringContaining("doesn't exist in the toolset"),
							}),
						]),
					}),
				}),
			);
		});

		test('should return error for calling system-prompt if it is disabled', async () => {
			const mockTool = {
				name: 'system-prompt',
				validateSchema: {
					safeParse: vi.fn(() => ({
						data: {},
					})),
				},
				admin: false,
				handler: vi.fn(),
			} as unknown as ToolConfig<any>;

			vi.mocked(findMcpTool).mockReturnValueOnce(mockTool);

			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/call',
					params: {
						name: 'system-prompt',
						arguments: {},
					},
				},
				accountability: { user: 'user', admin: false },
				schema: {},
			} as unknown as Request;

			directusMCP = new DirectusMCP({ systemPromptEnabled: false });

			directusMCP.handleRequest(mockReq, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith(
				expect.objectContaining({
					jsonrpc: '2.0',
					id: 1,
					result: expect.objectContaining({
						isError: true,
						content: expect.arrayContaining([
							expect.objectContaining({
								type: 'text',
								text: expect.stringContaining("doesn't exist in the toolset"),
							}),
						]),
					}),
				}),
			);
		});

		test('should prevent non-admin users from accessing admin tools', async () => {
			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/call',
					params: {
						name: 'admin-tool',
						arguments: {},
					},
				},
				accountability: { user: 'user', admin: false }, // Non-admin user
				schema: {},
			} as unknown as Request;

			directusMCP.handleRequest(mockReq, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith(
				expect.objectContaining({
					jsonrpc: '2.0',
					id: 1,
					result: expect.objectContaining({
						isError: true,
						content: expect.arrayContaining([
							expect.objectContaining({
								type: 'text',
								text: expect.stringContaining('FORBIDDEN'),
							}),
						]),
					}),
				}),
			);
		});

		test('should allow admin users to access admin tools', async () => {
			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/call',
					params: {
						name: 'admin-tool',
						arguments: {},
					},
				},
				accountability: { admin: true, user: 'user' }, // Admin user
				schema: {},
			} as unknown as Request;

			directusMCP.handleRequest(mockReq, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith(
				expect.objectContaining({
					jsonrpc: '2.0',
					id: 1,
					result: expect.objectContaining({
						content: expect.arrayContaining([
							expect.objectContaining({
								type: 'text',
								text: JSON.stringify({ raw: 'admin result' }),
							}),
						]),
					}),
				}),
			);
		});

		test('should handle validation errors', async () => {
			// Mock the tool to return validation error
			const mockTool = {
				name: 'validation-tool',
				validateSchema: {
					safeParse: vi.fn(() => ({
						error: { issues: [{ message: 'Invalid input' }] },
					})),
				},
				admin: false,
				handler: vi.fn(),
			} as unknown as ToolConfig<any>;

			vi.mocked(findMcpTool).mockReturnValueOnce(mockTool);

			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/call',
					params: {
						name: 'validation-tool',
						arguments: { invalid: 'data' },
					},
				},
				accountability: { user: 'user', admin: false },
				schema: {},
			} as unknown as Request;

			directusMCP.handleRequest(mockReq, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith(
				expect.objectContaining({
					jsonrpc: '2.0',
					id: 1,
					result: expect.objectContaining({
						isError: true,
						content: expect.arrayContaining([
							expect.objectContaining({
								type: 'text',
								text: expect.stringContaining('Validation error'),
							}),
						]),
					}),
				}),
			);
		});

		test('should error on delete action if deletes disabled', async () => {
			// Mock the tool to return validation error
			const mockTool = {
				name: 'deletes-tool',
				validateSchema: {
					safeParse: vi.fn(() => ({ data: { action: 'delete' } })),
				},
				admin: false,
				handler: vi.fn(),
			} as unknown as ToolConfig<any>;

			vi.mocked(findMcpTool).mockReturnValueOnce(mockTool);

			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/call',
					params: {
						name: 'deletes-tool',
						arguments: { action: 'delete' },
					},
				},
				accountability: { user: 'user', admin: false },
				schema: {},
			} as unknown as Request;

			directusMCP.handleRequest(mockReq, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith(
				expect.objectContaining({
					jsonrpc: '2.0',
					id: 1,
					result: expect.objectContaining({
						isError: true,
						content: expect.arrayContaining([
							expect.objectContaining({
								type: 'text',
								text: expect.stringContaining('Delete actions are disabled'),
							}),
						]),
					}),
				}),
			);
		});
	});

	describe('prompt list', () => {
		let mockItemsService: {
			readByQuery: MockedFunction<any>;
			readOne: MockedFunction<any>;
		};

		beforeEach(() => {
			mockRes = {
				json: vi.fn(),
				status: vi.fn().mockReturnThis(),
				send: vi.fn(),
			} as unknown as Response;

			mockReq = {
				accepts: vi.fn((type: string) =>
					type === 'application/json' ? 'application/json' : false,
				) as unknown as Request['accepts'],
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'prompts/list',
				},
				accountability: { user: 'user', admin: false } as Accountability,
				schema: {} as SchemaOverview,
			};

			mockItemsService = {
				readByQuery: vi.fn(),
				readOne: vi.fn(),
			};

			vi.mocked(ItemsService).mockImplementation(() => mockItemsService as unknown as ItemsService);
		});

		test('should return a json rpc error if no prompt collection defined', async () => {
			const directusMCP = new DirectusMCP({});

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith({
				id: 1,
				jsonrpc: '2.0',
				error: {
					code: 1001,
					message: 'MCP error 1001: A prompts collection must be set in settings',
				},
			});
		});

		test('should query prompt collection fields', async () => {
			const directusMCP = new DirectusMCP({ promptsCollection: 'ai_collection' });

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockItemsService.readByQuery).toHaveBeenCalledWith({
				fields: ['name', 'description', 'system_prompt', 'messages'],
			});
		});

		test('should return empty prompts array for no results', async () => {
			const directusMCP = new DirectusMCP({ promptsCollection: 'ai_collection' });

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			vi.mocked(mockItemsService.readByQuery).mockResolvedValue([]);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith({
				id: 1,
				jsonrpc: '2.0',
				result: {
					prompts: [],
				},
			});
		});

		test('should return defined prompts', async () => {
			const directusMCP = new DirectusMCP({ promptsCollection: 'ai_collection' });

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			const prompt = {
				name: 'lorem',
				description: 'Lorem Ipsum',
			};

			vi.mocked(mockItemsService.readByQuery).mockResolvedValue([prompt]);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith({
				id: 1,
				jsonrpc: '2.0',
				result: {
					prompts: [
						{
							...prompt,
							arguments: [],
						},
					],
				},
			});
		});

		test('should build prompt args based on message field', async () => {
			const directusMCP = new DirectusMCP({ promptsCollection: 'ai_collection' });

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			const prompt = {
				name: 'lorem',
				description: 'Lorem Ipsum',
				messages: [
					{
						text: 'My {{user}}',
					},
				],
			};

			vi.mocked(mockItemsService.readByQuery).mockResolvedValue([prompt]);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith({
				id: 1,
				jsonrpc: '2.0',
				result: {
					prompts: [
						{
							name: prompt.name,
							description: prompt.description,
							arguments: [
								{
									description: 'Value for user',
									name: 'user',
									required: false,
								},
							],
						},
					],
				},
			});
		});

		test('should auto inject system prompt args', async () => {
			const directusMCP = new DirectusMCP({ promptsCollection: 'ai_collection' });

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			const prompt = {
				name: 'lorem',
				description: 'Lorem Ipsum',
				messages: [
					{
						text: 'My {{user}}',
					},
				],
				system_prompt: 'The {{url}} is',
			};

			vi.mocked(mockItemsService.readByQuery).mockResolvedValue([prompt]);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith({
				id: 1,
				jsonrpc: '2.0',
				result: {
					prompts: [
						{
							name: prompt.name,
							description: prompt.description,
							arguments: [
								{
									description: 'Value for url',
									name: 'url',
									required: false,
								},
								{
									description: 'Value for user',
									name: 'user',
									required: false,
								},
							],
						},
					],
				},
			});
		});
	});

	describe('prompt get', () => {
		let mockItemsService: {
			readByQuery: MockedFunction<any>;
			readOne: MockedFunction<any>;
		};

		afterEach(() => {
			vi.clearAllMocks();
		});

		beforeEach(() => {
			mockRes = {
				json: vi.fn(),
				status: vi.fn().mockReturnThis(),
				send: vi.fn(),
			} as unknown as Response;

			mockReq = {
				accepts: vi.fn((type: string) =>
					type === 'application/json' ? 'application/json' : false,
				) as unknown as Request['accepts'],
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'prompts/get',
					params: {
						name: '',
						arguments: {},
					},
				},
				accountability: { user: 'user', admin: false } as Accountability,
				schema: {} as SchemaOverview,
			};

			mockItemsService = {
				readByQuery: vi.fn(),
				readOne: vi.fn(),
			};

			vi.mocked(ItemsService).mockImplementation(() => mockItemsService as unknown as ItemsService);
		});

		test('should return a json rpc error if no prompt collection defined', async () => {
			const directusMCP = new DirectusMCP({});

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith({
				id: 1,
				jsonrpc: '2.0',
				error: {
					code: 1001,
					message: 'MCP error 1001: A prompts collection must be set in settings',
				},
			});
		});

		test('should query prompt by name', async () => {
			const directusMCP = new DirectusMCP({ promptsCollection: 'ai_collection' });

			const promptName = 'test';

			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'prompts/get',
					params: {
						name: promptName,
						arguments: {},
					},
				},
				accountability: { user: 'user', admin: false },
				schema: {},
			} as unknown as Request;

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockItemsService.readByQuery).toHaveBeenCalledWith({
				fields: ['description', 'system_prompt', 'messages'],
				filter: {
					name: {
						_eq: promptName,
					},
				},
			});
		});

		test('should return invalid params if invalid prompt', async () => {
			const directusMCP = new DirectusMCP({ promptsCollection: 'ai_collection' });

			vi.mocked(mockItemsService.readByQuery).mockResolvedValue([]);

			const promptName = 'test';

			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'prompts/get',
					params: {
						name: promptName,
						arguments: {},
					},
				},
				accountability: { user: 'user', admin: false },
				schema: {},
			} as unknown as Request;

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(mockRes.json).toHaveBeenCalledWith({
				id: 1,
				jsonrpc: '2.0',
				error: {
					code: -32602,
					message: `MCP error -32602: Invalid prompt "${promptName}"`,
				},
			});
		});

		test('should render messages with args params', async () => {
			const directusMCP = new DirectusMCP({ promptsCollection: 'ai_collection' });

			vi.spyOn(directusMCP, 'toPromptResponse');

			vi.mocked(mockItemsService.readByQuery).mockResolvedValue([
				{
					name: 'test',
					description: 'Lorem Ipsum',
					messages: [
						{
							role: 'user',
							text: 'My {{user}}',
						},
					],
				},
			]);

			const promptName = 'test';

			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'prompts/get',
					params: {
						name: promptName,
						arguments: {
							user: '1',
						},
					},
				},
				accountability: { user: 'user', admin: false },
				schema: {},
			} as unknown as Request;

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(directusMCP.toPromptResponse).toHaveBeenCalledWith({
				description: 'Lorem Ipsum',
				messages: [
					{
						content: {
							text: 'My 1',
							type: 'text',
						},
						role: 'user',
					},
				],
			});
		});

		test('should render system prompt with args params', async () => {
			const directusMCP = new DirectusMCP({ promptsCollection: 'ai_collection' });

			vi.spyOn(directusMCP, 'toPromptResponse');

			vi.mocked(mockItemsService.readByQuery).mockResolvedValue([
				{
					name: 'test',
					description: 'Lorem Ipsum',
					messages: [
						{
							role: 'user',
							text: 'My {{user}}',
						},
					],
					system_prompt: 'Hello {{admin}}',
				},
			]);

			const promptName = 'test';

			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'prompts/get',
					params: {
						name: promptName,
						arguments: {
							user: '1',
							admin: '2',
						},
					},
				},
				accountability: { user: 'user', admin: false },
				schema: {},
			} as unknown as Request;

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(directusMCP.toPromptResponse).toHaveBeenCalledWith({
				description: 'Lorem Ipsum',
				messages: [
					{
						content: {
							text: 'Hello 2',
							type: 'text',
						},
						role: 'assistant',
					},
					{
						content: {
							text: 'My 1',
							type: 'text',
						},
						role: 'user',
					},
				],
			});
		});

		test('should support no messages or system_prompt', async () => {
			const directusMCP = new DirectusMCP({ promptsCollection: 'ai_collection' });

			vi.spyOn(directusMCP, 'toPromptResponse');

			vi.mocked(mockItemsService.readByQuery).mockResolvedValue([
				{
					name: 'test',
					description: 'Lorem Ipsum',
					messages: null,
					system_prompt: null,
				},
			]);

			const promptName = 'test';

			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'prompts/get',
					params: {
						name: promptName,
						arguments: {
							user: '1',
							admin: '2',
						},
					},
				},
				accountability: { user: 'user', admin: false },
				schema: {},
			} as unknown as Request;

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(directusMCP.toPromptResponse).toHaveBeenCalledWith({
				description: 'Lorem Ipsum',
				messages: [],
			});
		});

		test('should skip messages missing role and/or text', async () => {
			const directusMCP = new DirectusMCP({ promptsCollection: 'ai_collection' });

			vi.spyOn(directusMCP, 'toPromptResponse');

			vi.mocked(mockItemsService.readByQuery).mockResolvedValue([
				{
					name: 'test',
					description: 'Lorem Ipsum',
					messages: [
						{
							role: null,
							text: 'Lorem',
						},
						{
							role: 'user',
							text: null,
						},
						{
							role: null,
							text: null,
						},
					],
				},
			]);

			const promptName = 'test';

			const mockReq = {
				accepts: vi.fn(() => 'application/json'),
				body: {
					jsonrpc: '2.0',
					id: 1,
					method: 'prompts/get',
					params: {
						name: promptName,
						arguments: {
							user: '1',
							admin: '2',
						},
					},
				},
				accountability: { user: 'user', admin: false },
				schema: {},
			} as unknown as Request;

			directusMCP.handleRequest(mockReq as Request, mockRes as Response);

			await awaitJsonResponse(directusMCP);

			expect(directusMCP.toPromptResponse).toHaveBeenCalledWith({
				description: 'Lorem Ipsum',
				messages: [],
			});
		});
	});

	describe('toToolResponse', () => {
		test('should return empty content for undefined result', () => {
			const response = directusMCP.toToolResponse(undefined);
			expect(response).toEqual({ content: [] });
		});

		test('should return empty content for null data', () => {
			const response = directusMCP.toToolResponse({ type: 'text', data: null });
			expect(response).toEqual({ content: [] });
		});

		test('should return empty content for undefined data', () => {
			const response = directusMCP.toToolResponse({ type: 'text', data: undefined });
			expect(response).toEqual({ content: [] });
		});

		test('should format text type responses', () => {
			const result = { type: 'text' as const, data: { message: 'hello' } };
			const response = directusMCP.toToolResponse(result);

			expect(response).toEqual({
				content: [
					{
						type: 'text',
						text: JSON.stringify({ raw: { message: 'hello' } }),
					},
				],
			});
		});

		test('should return result directly for non-text types', () => {
			const result = { type: 'image' as const, data: 'base64data', mimeType: 'image/png' };
			const response = directusMCP.toToolResponse(result);

			expect(response).toEqual({
				content: [result],
			});
		});
	});

	describe('toExecutionError', () => {
		test('should handle Directus errors', () => {
			const error = new (createError(ErrorCode.Forbidden, 'test'))();
			const response = directusMCP.toExecutionError(error);

			expect(response.isError).toBe(true);
			expect(response.content[0]?.type).toBe('text');

			const parsedContent = JSON.parse(response.content[0]!.text);

			expect(parsedContent[0]).toEqual({
				error: 'test',
				code: ErrorCode.Forbidden,
			});
		});

		test('should handle generic Error objects', () => {
			const error = new Error('Generic error');
			const response = directusMCP.toExecutionError(error);

			expect(response.isError).toBe(true);
			const parsedContent = JSON.parse(response.content[0]!.text);
			expect(parsedContent[0].error).toBe('Generic error');
		});

		test('should handle string errors', () => {
			const error = 'String error message';
			const response = directusMCP.toExecutionError(error);

			expect(response.isError).toBe(true);
			const parsedContent = JSON.parse(response.content[0]!.text);
			expect(parsedContent[0].error).toBe('String error message');
		});

		test('should handle object errors with message property', () => {
			const error = { message: 'Object error', code: 'OBJ_ERROR' };
			const response = directusMCP.toExecutionError(error);

			expect(response.isError).toBe(true);

			const parsedContent = JSON.parse(response.content[0]!.text);

			expect(parsedContent[0]).toEqual({
				error: 'Object error',
				code: 'OBJ_ERROR',
			});
		});

		test('should handle unknown error types', () => {
			const error = 123; // Number, unknown type
			const response = directusMCP.toExecutionError(error);

			expect(response.isError).toBe(true);

			const parsedContent = JSON.parse(response.content[0]!.text);
			expect(parsedContent[0].error).toBe('An unknown error occurred.');
		});

		test('should handle array of errors', () => {
			const errors = [new Error('First error'), 'Second error', { message: 'Third error', code: 'THIRD' }];

			const response = directusMCP.toExecutionError(errors);

			expect(response.isError).toBe(true);

			const parsedContent = JSON.parse(response.content[0]!.text);
			expect(parsedContent).toHaveLength(3);
			expect(parsedContent[0].error).toBe('First error');
			expect(parsedContent[1].error).toBe('Second error');

			expect(parsedContent[2]).toEqual({
				error: 'Third error',
				code: 'THIRD',
			});
		});
	});

	describe('DirectusTransport', () => {
		let transport: DirectusTransport;
		let mockRes: Partial<Response>;

		beforeEach(() => {
			mockRes = {
				json: vi.fn(),
				status: vi.fn().mockReturnThis(),
				send: vi.fn(),
			};

			transport = new DirectusTransport(mockRes as Response);
		});

		describe('send', () => {
			test('should send JSON-RPC message via response.json', async () => {
				const message = {
					jsonrpc: '2.0' as const,
					id: 1,
					result: { data: 'test' },
				};

				await transport.send(message);

				expect(mockRes.json).toHaveBeenCalledTimes(1);
				expect(mockRes.json).toHaveBeenCalledWith(message);
			});

			test('should send error responses', async () => {
				const errorMessage = {
					jsonrpc: '2.0' as const,
					id: 1,
					error: {
						code: -32600,
						message: 'Invalid Request',
					},
				};

				await transport.send(errorMessage);

				expect(mockRes.json).toHaveBeenCalledWith(errorMessage);
			});

			test('should send notification messages (no id)', async () => {
				const notification = {
					jsonrpc: '2.0' as const,
					method: 'notifications/initialized',
				};

				await transport.send(notification);

				expect(mockRes.json).toHaveBeenCalledWith(notification);
			});
		});

		describe('event handling', () => {
			test('should handle messages when onmessage is set', () => {
				const messageHandler = vi.fn();
				transport.onmessage = messageHandler;

				const message = {
					jsonrpc: '2.0' as const,
					id: 1,
					method: 'tools/list',
				};

				// Simulate message handling (this would typically be called by the server)
				transport.onmessage?.(message);

				expect(messageHandler).toHaveBeenCalledWith(message);
			});

			test('should handle errors when onerror is set', () => {
				const errorHandler = vi.fn();
				transport.onerror = errorHandler;

				const error = new Error('Transport error');

				// Simulate error handling
				transport.onerror?.(error);

				expect(errorHandler).toHaveBeenCalledWith(error);
			});

			test('should handle messages with extra info', () => {
				const messageHandler = vi.fn();
				transport.onmessage = messageHandler;

				const message = {
					jsonrpc: '2.0' as const,
					id: 1,
					method: 'tools/call',
					params: { name: 'test-tool' },
				};

				const extraInfo = {};

				transport.onmessage?.(message, extraInfo);

				expect(messageHandler).toHaveBeenCalledWith(message, extraInfo);
			});
		});
	});
});
