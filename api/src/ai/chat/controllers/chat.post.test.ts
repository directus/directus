import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiChatPostHandler } from './chat.post.js';

// Mock dependencies
vi.mock('ai', () => ({
	safeValidateUIMessages: vi.fn(),
}));

vi.mock('../lib/create-ui-stream.js', () => ({
	createUiStream: vi.fn(),
}));

vi.mock('../utils/chat-request-tool-to-ai-sdk-tool.js', () => ({
	chatRequestToolToAiSdkTool: vi.fn(),
}));

vi.mock('../../../logger/index.js', () => ({
	useLogger: () => ({
		warn: vi.fn(),
		debug: vi.fn(),
		info: vi.fn(),
		error: vi.fn(),
	}),
}));

const mockGetMCPClientManager = vi.fn();
const mockGetAllExternalMCPToolsAsAiSdkTools = vi.fn();
const mockIsExternalMCPTool = vi.fn();

vi.mock('../../mcp/client/index.js', () => ({
	getMCPClientManager: () => mockGetMCPClientManager(),
	isExternalMCPTool: (name: string) => mockIsExternalMCPTool(name),
}));

vi.mock('../utils/external-mcp-tool-to-ai-sdk-tool.js', () => ({
	getAllExternalMCPToolsAsAiSdkTools: (...args: unknown[]) => mockGetAllExternalMCPToolsAsAiSdkTools(...args),
}));

import { safeValidateUIMessages } from 'ai';
import { createUiStream } from '../lib/create-ui-stream.js';
import { chatRequestToolToAiSdkTool } from '../utils/chat-request-tool-to-ai-sdk-tool.js';

describe('aiChatPostHandler', () => {
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;
	let mockNext: NextFunction;
	let mockStream: { pipeUIMessageStreamToResponse: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		mockStream = {
			pipeUIMessageStreamToResponse: vi.fn(),
		};

		mockNext = vi.fn();

		mockReq = {
			body: {},
			accountability: { user: 'test-user', role: 'test-role', app: true } as any,
			schema: { collections: {}, relations: {} } as any,
		} as any;

		mockRes = {
			locals: {
				ai: {
					apiKeys: {
						openai: 'test-openai-key',
						anthropic: 'test-anthropic-key',
					},
				},
			},
		} as any;

		vi.mocked(createUiStream).mockImplementation(() => mockStream as any);

		vi.mocked(chatRequestToolToAiSdkTool).mockImplementation((tool: any) => ({ tool }) as any);

		vi.mocked(safeValidateUIMessages).mockResolvedValue({
			success: true,
			data: [{ role: 'user', content: 'test message' }],
		} as any);

		// Default MCP mock - not initialized
		mockGetMCPClientManager.mockReturnValue({
			initialized: false,
			getServers: vi.fn(() => []),
			getClient: vi.fn(),
			registerServers: vi.fn(),
			connectAll: vi.fn(),
			disconnectAll: vi.fn(),
		});

		mockGetAllExternalMCPToolsAsAiSdkTools.mockReturnValue({});
		mockIsExternalMCPTool.mockImplementation((name: string) => name.startsWith('mcp__'));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('authentication and authorization', () => {
		it('should throw ForbiddenError when accountability is missing', async () => {
			delete (mockReq as any).accountability;

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ForbiddenError,
			);
		});

		it('should throw ForbiddenError when accountability is null', async () => {
			mockReq.accountability = null as any;

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ForbiddenError,
			);
		});
	});

	describe('input validation', () => {
		it('should throw InvalidPayloadError when provider is missing', async () => {
			mockReq.body = {
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when model is missing', async () => {
			mockReq.body = {
				provider: 'openai',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when messages is missing', async () => {
			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				tools: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when provider is invalid', async () => {
			mockReq.body = {
				provider: 'invalid-provider',
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when openai model is invalid', async () => {
			mockReq.body = {
				provider: 'openai',
				model: 'invalid-model',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when anthropic model is invalid', async () => {
			mockReq.body = {
				provider: 'anthropic',
				model: 'invalid-model',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when messages is not an array', async () => {
			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: 'not-an-array',
				tools: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when messages array is empty', async () => {
			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [],
				tools: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);

			expect(vi.mocked(safeValidateUIMessages)).not.toHaveBeenCalled();
		});
	});

	describe('message validation', () => {
		it('should throw InvalidPayloadError when safeValidateUIMessages fails', async () => {
			const errorMessage = 'Invalid message format';

			vi.mocked(safeValidateUIMessages).mockResolvedValue({
				success: false,
				error: new Error(errorMessage),
			} as any);

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [{ role: 'invalid', content: 'test' }],
				tools: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);

			expect(vi.mocked(safeValidateUIMessages)).toHaveBeenCalledWith({
				messages: [{ role: 'invalid', content: 'test' }],
			});
		});

		it('should call safeValidateUIMessages with correct messages', async () => {
			const messages = [
				{ role: 'user', content: 'Hello' },
				{ role: 'assistant', content: 'Hi there' },
			];

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages,
				tools: [],
			};

			await aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(vi.mocked(safeValidateUIMessages)).toHaveBeenCalledWith({ messages });
		});
	});

	describe('api keys handling', () => {
		it('should pass api keys from res.locals to createUiStream', async () => {
			const customApiKeys = {
				openai: 'custom-openai-key',
				anthropic: 'custom-anthropic-key',
			};

			mockRes.locals = {
				ai: {
					apiKeys: customApiKeys,
				},
			};

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'test' }],
				tools: [],
			};

			await aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(vi.mocked(createUiStream)).toHaveBeenCalledWith(expect.any(Array), {
				provider: 'openai',
				model: 'gpt-5',
				tools: {},
				apiKeys: customApiKeys,
				systemPrompt: undefined,
				onUsage: expect.any(Function),
			});
		});
	});

	describe('tools mapping', () => {
		it('should transform provided tools and pass them to validation and stream', async () => {
			const tools = [
				'search',
				{
					name: 'custom',
					description: 'Custom tool',
					inputSchema: { type: 'object', properties: { q: { type: 'string' } }, required: ['q'] },
				},
			];

			// Map tool name to a distinct mock tool value for easier assertions
			vi.mocked(chatRequestToolToAiSdkTool).mockImplementation((opts: any) => {
				const t = opts.chatRequestTool;
				const name = typeof t === 'string' ? t : t.name;
				return { name, mocked: true } as any;
			});

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
				tools,
			};

			await aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext);

			const expectedTools = {
				search: { name: 'search', mocked: true },
				custom: { name: 'custom', mocked: true },
			};

			expect(vi.mocked(safeValidateUIMessages)).toHaveBeenCalledWith({
				messages: [{ role: 'user', content: 'Hello' }],
			});

			expect(vi.mocked(createUiStream)).toHaveBeenCalledWith(expect.any(Array), {
				provider: 'openai',
				model: 'gpt-5',
				tools: expectedTools,
				apiKeys: mockRes.locals!['ai'].apiKeys,
				systemPrompt: undefined,
				onUsage: expect.any(Function),
			});
		});
	});

	describe('external MCP tools handling', () => {
		it('should include all external tools when no specific external tools are requested', async () => {
			const externalTools = {
				'mcp__server1__tool1': { name: 'mcp__server1__tool1', execute: vi.fn() },
				'mcp__server1__tool2': { name: 'mcp__server1__tool2', execute: vi.fn() },
			};

			mockGetMCPClientManager.mockReturnValue({
				initialized: true,
				getServers: vi.fn(() => []),
				getClient: vi.fn(),
				registerServers: vi.fn(),
				connectAll: vi.fn(),
				disconnectAll: vi.fn(),
			});

			mockGetAllExternalMCPToolsAsAiSdkTools.mockReturnValue(externalTools);

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: ['search'], // Only internal tool requested
			};

			vi.mocked(chatRequestToolToAiSdkTool).mockImplementation((opts: any) => {
				const t = opts.chatRequestTool;
				const name = typeof t === 'string' ? t : t.name;
				return { name, mocked: true } as any;
			});

			await aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(vi.mocked(createUiStream)).toHaveBeenCalledWith(
				expect.any(Array),
				expect.objectContaining({
					tools: expect.objectContaining({
						search: expect.any(Object),
						'mcp__server1__tool1': expect.any(Object),
						'mcp__server1__tool2': expect.any(Object),
					}),
				}),
			);
		});

		it('should include only specific external tools when explicitly requested', async () => {
			const externalTools = {
				'mcp__server1__tool1': { name: 'mcp__server1__tool1', execute: vi.fn() },
				'mcp__server1__tool2': { name: 'mcp__server1__tool2', execute: vi.fn() },
			};

			mockGetMCPClientManager.mockReturnValue({
				initialized: true,
				getServers: vi.fn(() => []),
				getClient: vi.fn(),
				registerServers: vi.fn(),
				connectAll: vi.fn(),
				disconnectAll: vi.fn(),
			});

			mockGetAllExternalMCPToolsAsAiSdkTools.mockReturnValue(externalTools);

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: ['search', 'mcp__server1__tool1'], // Only tool1 requested
			};

			vi.mocked(chatRequestToolToAiSdkTool).mockImplementation((opts: any) => {
				const t = opts.chatRequestTool;
				const name = typeof t === 'string' ? t : t.name;
				return { name, mocked: true } as any;
			});

			await aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext);

			const createUiStreamCall = vi.mocked(createUiStream).mock.calls[0]![1];
			const toolsResult = createUiStreamCall.tools;

			expect(toolsResult).toHaveProperty('search');
			expect(toolsResult).toHaveProperty('mcp__server1__tool1');
			expect(toolsResult).not.toHaveProperty('mcp__server1__tool2');
		});

		it('should skip external MCP tools in chatRequestToolToAiSdkTool loop', async () => {
			mockGetMCPClientManager.mockReturnValue({
				initialized: true,
				getServers: vi.fn(() => []),
				getClient: vi.fn(),
				registerServers: vi.fn(),
				connectAll: vi.fn(),
				disconnectAll: vi.fn(),
			});

			mockGetAllExternalMCPToolsAsAiSdkTools.mockReturnValue({
				'mcp__server1__tool1': { name: 'mcp__server1__tool1', execute: vi.fn() },
			});

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: ['search', 'mcp__server1__tool1'],
			};

			vi.mocked(chatRequestToolToAiSdkTool).mockImplementation((opts: any) => {
				const t = opts.chatRequestTool;
				const name = typeof t === 'string' ? t : t.name;
				return { name, mocked: true } as any;
			});

			await aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext);

			// chatRequestToolToAiSdkTool should only be called for internal tools
			const calls = vi.mocked(chatRequestToolToAiSdkTool).mock.calls;

			const toolNames = calls.map((call) => {
				const t = call[0].chatRequestTool;
				return typeof t === 'string' ? t : t.name;
			});

			expect(toolNames).toContain('search');
			expect(toolNames).not.toContain('mcp__server1__tool1');
		});

		it('should initialize MCP client manager when external servers are configured', async () => {
			const registerServers = vi.fn();
			const connectAll = vi.fn();

			mockGetMCPClientManager.mockReturnValue({
				initialized: false,
				getServers: vi.fn(() => []),
				getClient: vi.fn(),
				registerServers,
				connectAll,
				disconnectAll: vi.fn(),
			});

			mockRes.locals = {
				ai: {
					apiKeys: { openai: 'test-key' },
					mcpExternalServers: [
						{
							id: 'test-server',
							name: 'Test Server',
							url: 'https://mcp.example.com',
							enabled: true,
							toolApproval: 'ask',
						},
					],
				},
			};

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: [],
			};

			await aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(registerServers).toHaveBeenCalled();
			expect(connectAll).toHaveBeenCalled();
		});

		it('should continue without external tools when MCP initialization fails', async () => {
			mockGetMCPClientManager.mockReturnValue({
				initialized: false,
				getServers: vi.fn(() => []),
				getClient: vi.fn(),
				registerServers: vi.fn(),
				connectAll: vi.fn(() => Promise.reject(new Error('Connection failed'))),
				disconnectAll: vi.fn(),
			});

			mockRes.locals = {
				ai: {
					apiKeys: { openai: 'test-key' },
					mcpExternalServers: [
						{
							id: 'test-server',
							name: 'Test Server',
							url: 'https://mcp.example.com',
							enabled: true,
							toolApproval: 'ask',
						},
					],
				},
			};

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: [],
			};

			// Should not throw - continues without external tools
			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext)).resolves.not.toThrow();

			expect(vi.mocked(createUiStream)).toHaveBeenCalled();
		});

		it('should not include external tools when client manager is not initialized', async () => {
			mockGetMCPClientManager.mockReturnValue({
				initialized: false,
				getServers: vi.fn(() => []),
				getClient: vi.fn(),
				registerServers: vi.fn(),
				connectAll: vi.fn(),
				disconnectAll: vi.fn(),
			});

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: ['search'],
			};

			vi.mocked(chatRequestToolToAiSdkTool).mockImplementation((opts: any) => {
				const t = opts.chatRequestTool;
				const name = typeof t === 'string' ? t : t.name;
				return { name, mocked: true } as any;
			});

			await aiChatPostHandler(mockReq as Request, mockRes as Response, mockNext);

			// getAllExternalMCPToolsAsAiSdkTools should not be called when not initialized
			expect(mockGetAllExternalMCPToolsAsAiSdkTools).not.toHaveBeenCalled();
		});
	});
});
