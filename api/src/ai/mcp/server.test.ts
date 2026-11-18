import type { Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createError, ErrorCode } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import express, { type Request, type Response } from 'express';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, type MockedFunction, test, vi } from 'vitest';
import { ItemsService } from '../../services/items.js';
import { expectMcpBearerChallenge } from '../../test-utils/mcp-oauth.js';
import { DirectusMCP } from './server.js';
import type { MCPOptions } from './types.js';

const toolMocks = vi.hoisted(() => ({
	adminHandler: vi.fn(),
	deleteHandler: vi.fn(),
	systemHandler: vi.fn(),
	testHandler: vi.fn(),
}));

vi.mock('@directus/env', async () => {
	const { mockUseEnv } = await import('../../test-utils/env.js');
	return mockUseEnv({
		PUBLIC_URL: 'https://directus.example.com',
		MCP_OAUTH_ENABLED: true,
		SECRET: 'test-secret',
		// Required by transitive module-level useEnv() calls:
		SESSION_COOKIE_NAME: 'directus_session',
		REFRESH_TOKEN_COOKIE_DOMAIN: '',
		REFRESH_TOKEN_TTL: 900_000,
		REFRESH_TOKEN_COOKIE_SECURE: false,
		SESSION_COOKIE_DOMAIN: '',
		SESSION_COOKIE_TTL: 86_400_000,
		SESSION_COOKIE_SECURE: false,
		IP_TRUST_PROXY: true,
		CACHE_ENABLED: false,
		RATE_LIMITER_ENABLED: false,
		ACCESS_TOKEN_TTL: 900_000,
		EMAIL_FROM: 'no-reply@example.com',
		EMAIL_TRANSPORT: 'sendmail',
	});
});

vi.mock('../../services/items.js');

vi.mock('../tools/index.js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../tools/index.js')>();
	const { z } = await import('zod');

	return {
		...actual,
		ALL_TOOLS: [
			{
				name: 'test-tool',
				description: 'A test tool',
				instructions: 'Full test tool instructions',
				inputSchema: z.strictObject({
					collection: z.string().optional(),
					data: z.unknown().optional(),
					test: z.string().optional(),
				}),
				validateSchema: z.object({
					collection: z.string().optional(),
					data: z.unknown().optional(),
					test: z.string().optional(),
				}),
				admin: false,
				annotations: {},
				readOnly: true,
				handler: toolMocks.testHandler,
			},
			{
				name: 'admin-tool',
				description: 'An admin tool',
				inputSchema: z.strictObject({}),
				validateSchema: z.strictObject({}),
				admin: true,
				annotations: {},
				readOnly: true,
				handler: toolMocks.adminHandler,
			},
			{
				name: 'delete-tool',
				description: 'A delete tool',
				inputSchema: z.strictObject({ action: z.literal('delete') }),
				validateSchema: z.strictObject({ action: z.literal('delete') }),
				admin: false,
				readOnly: false,
				handler: toolMocks.deleteHandler,
			},
			{
				name: 'system-prompt',
				description: 'System prompt',
				inputSchema: z.strictObject({}),
				validateSchema: z.strictObject({ promptOverride: z.string().nullable() }),
				admin: false,
				readOnly: true,
				handler: toolMocks.systemHandler,
			},
			{
				name: 'schema',
				description: 'Schema tool',
				inputSchema: z.strictObject({ keys: z.array(z.string()).optional() }),
				validateSchema: z.strictObject({ keys: z.array(z.string()).optional() }),
				output: z.object({ data: z.object({ collections: z.array(z.string()) }) }),
				admin: false,
				readOnly: true,
				exposure: 'root',
				handler: vi.fn(() => Promise.resolve({ type: 'text', data: { collections: [] } })),
			},
		],
	};
});

const MODERN_VERSION = '2026-07-28';

const regularAccountability = {
	user: 'user-id',
	role: 'role-id',
	roles: ['role-id'],
	admin: false,
	app: false,
	ip: null,
} as Accountability;

type RequestContext = Pick<Request, 'accountability' | 'token' | 'tokenSource'>;

let mcpOptions: MCPOptions = {};
let requestContext: RequestContext;
let httpServer: HttpServer;
let mcpUrl: string;

beforeAll(async () => {
	const app = express();

	app.use(express.json());

	app.post('/mcp', async (req, res) => {
		Object.assign(req, requestContext, { schema: {} as SchemaOverview });
		await new DirectusMCP(mcpOptions).handleRequest(req, res);
	});

	httpServer = app.listen(0);
	await new Promise((resolve) => httpServer.once('listening', resolve));
	mcpUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}/mcp`;
});

afterAll(() => {
	httpServer.close();
});

beforeEach(() => {
	mcpOptions = {};
	requestContext = { accountability: regularAccountability, token: null, tokenSource: 'header' };
	toolMocks.testHandler.mockResolvedValue({ type: 'text', data: 'test result' });
	toolMocks.adminHandler.mockResolvedValue({ type: 'text', data: 'admin result' });
	toolMocks.deleteHandler.mockResolvedValue({ type: 'text', data: 'deleted' });
	toolMocks.systemHandler.mockResolvedValue({ type: 'text', data: 'system prompt' });
});

afterEach(() => {
	vi.clearAllMocks();
});

type RpcOptions = { era?: 'modern' | 'legacy'; toolMode?: 'registry' };

function post(body: unknown, headers: Record<string, string> = {}, toolMode?: 'registry') {
	return fetch(toolMode ? `${mcpUrl}?tool_mode=${toolMode}` : mcpUrl, {
		method: 'POST',
		headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers },
		body: JSON.stringify(body),
	});
}

/** Send one JSON-RPC request and return the parsed JSON-RPC response. */
async function rpc(
	method: string,
	params: Record<string, unknown> = {},
	{ era = 'modern', toolMode }: RpcOptions = {},
) {
	const headers: Record<string, string> = {};
	let body: Record<string, unknown> = { jsonrpc: '2.0', id: 1, method, params };

	if (era === 'modern') {
		headers['mcp-protocol-version'] = MODERN_VERSION;
		headers['mcp-method'] = method;
		if (typeof params['name'] === 'string') headers['mcp-name'] = params['name'];

		body = {
			...body,
			params: {
				...params,
				_meta: {
					'io.modelcontextprotocol/protocolVersion': MODERN_VERSION,
					'io.modelcontextprotocol/clientCapabilities': {},
				},
			},
		};
	}

	const response = await post(body, headers, toolMode);
	const text = await response.text();

	// 2025-era responses come back as a single SSE message
	const json = response.headers.get('content-type')?.includes('text/event-stream')
		? text
				.split('\n')
				.find((line) => line.startsWith('data: '))!
				.slice('data: '.length)
		: text;

	return JSON.parse(json);
}

async function callTool(name: string, args: Record<string, unknown> = {}, options?: RpcOptions) {
	return (await rpc('tools/call', { name, arguments: args }, options)).result;
}

describe('mcp server', () => {
	let directusMCP: DirectusMCP;

	describe('protocol', () => {
		test('advertises supported versions and server identity through server/discover', async () => {
			mcpOptions = { project: { name: 'Acme CMS', icon: Buffer.from('png') } };

			const { result } = await rpc('server/discover');

			expect(result.supportedVersions).toContain(MODERN_VERSION);
			expect(result.capabilities).toEqual({ tools: {}, prompts: {} });

			expect(result._meta['io.modelcontextprotocol/serverInfo']).toMatchObject({
				name: 'directus',
				title: 'Acme CMS',
				version: expect.any(String),
				icons: [expect.objectContaining({ mimeType: 'image/png' })],
			});
		});

		test('marks list results cacheable per user', async () => {
			const { result } = await rpc('tools/list');

			expect(result).toMatchObject({ resultType: 'complete', cacheScope: 'private', ttlMs: expect.any(Number) });
		});

		test('serves 2025-era clients without a session', async () => {
			const initialize = await rpc(
				'initialize',
				{ protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } },
				{ era: 'legacy' },
			);

			expect(initialize.result.protocolVersion).toBe('2025-11-25');

			const list = await rpc('tools/list', {}, { era: 'legacy' });

			expect(list.result.tools.length).toBeGreaterThan(0);
		});

		test.each(['notifications/initialized', 'notifications/cancelled'])('acknowledges %s with 202', async (method) => {
			const response = await post({ jsonrpc: '2.0', method, params: { requestId: 1 } });

			expect(response.status).toBe(202);
		});

		test('rejects invalid JSON-RPC messages', async () => {
			const response = await post({ invalid: 'message' });
			const body = await response.json();

			expect(response.status).toBe(400);
			expect(body.error.code).toBe(-32600);
		});

		test('rejects modern requests without the protocol version header', async () => {
			const response = await post({
				jsonrpc: '2.0',
				id: 1,
				method: 'tools/list',
				params: { _meta: { 'io.modelcontextprotocol/protocolVersion': MODERN_VERSION } },
			});

			expect(response.status).toBe(400);
		});
	});

	describe('tool listing', () => {
		test('should list individual MCP tools by default', async () => {
			const { result } = await rpc('tools/list');

			expect(result.tools.map((tool: { name: string }) => tool.name)).toEqual([
				'test-tool',
				'delete-tool',
				'system-prompt',
				'schema',
			]);

			expect(result.tools.find((tool: { name: string }) => tool.name === 'test-tool')).toMatchObject({
				description: 'Full test tool instructions',
			});

			expect(result.tools.find((tool: { name: string }) => tool.name === 'schema')).not.toHaveProperty('outputSchema');
		});

		test('should list only MCP root tools in registry mode', async () => {
			const { result } = await rpc('tools/list', {}, { toolMode: 'registry' });

			expect(result.tools.map((tool: { name: string }) => tool.name)).toEqual(['search', 'execute', 'schema']);
			expect(result.tools.find((tool: { name: string }) => tool.name === 'schema')).toHaveProperty('outputSchema');
			expect(result.tools.find((tool: { name: string }) => tool.name === 'execute')).not.toHaveProperty('outputSchema');
		});
	});

	describe('tool execution', () => {
		test('should execute a valid tool successfully', async () => {
			const result = await callTool('test-tool', { test: 'value' });

			expect(result.content).toEqual([{ type: 'text', text: 'test result' }]);
		});

		test('should execute a valid tool for 2025-era clients', async () => {
			const result = await callTool('test-tool', { test: 'value' }, { era: 'legacy' });

			expect(result.content).toEqual([{ type: 'text', text: 'test result' }]);
		});

		test('should execute tools through the registry root execute tool in registry mode', async () => {
			const result = await callTool(
				'execute',
				{ name: 'test-tool', input: { test: 'value' } },
				{ toolMode: 'registry' },
			);

			expect(result.content).toEqual([{ type: 'text', text: JSON.stringify({ data: 'test result' }) }]);
		});

		test('should not accept the registry root execute tool by default', async () => {
			const result = await callTool('execute', { name: 'test-tool', input: { test: 'value' } });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain('INVALID_PAYLOAD');
		});

		test('should return error for non-existent tool', async () => {
			const result = await callTool('non-existent-tool');

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toMatch(/doesn't exist in the toolset.*INVALID_PAYLOAD/);
		});

		test('should preserve the forbidden error for non-admin callers of admin tools', async () => {
			const result = await callTool('admin-tool');

			expect(result.content[0].text).toContain('FORBIDDEN');
			expect(toolMocks.adminHandler).not.toHaveBeenCalled();
		});

		test('should return error for calling system-prompt if it is disabled', async () => {
			mcpOptions = { systemPromptEnabled: false };

			const result = await callTool('system-prompt');

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("doesn't exist in the toolset");
		});

		test('should allow admin users to access admin tools', async () => {
			requestContext.accountability = { ...regularAccountability, admin: true };

			const result = await callTool('admin-tool');

			expect(result.content).toEqual([{ type: 'text', text: 'admin result' }]);
		});

		test('should error on delete action if deletes disabled', async () => {
			const result = await callTool('delete-tool', { action: 'delete' });

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain('Delete actions are disabled');
		});
	});

	describe('prompt list', () => {
		let mockItemsService: { readByQuery: MockedFunction<any> };

		beforeEach(() => {
			mockItemsService = { readByQuery: vi.fn().mockResolvedValue([]) };

			vi.mocked(ItemsService).mockImplementation(function () {
				return mockItemsService as unknown as ItemsService;
			});
		});

		test('should return no prompts if no prompt collection defined', async () => {
			const { result } = await rpc('prompts/list');

			expect(result.prompts).toEqual([]);
			expect(ItemsService).not.toHaveBeenCalled();
		});

		test('should query prompt collection fields', async () => {
			mcpOptions = { promptsCollection: 'ai_collection' };

			await rpc('prompts/list');

			expect(mockItemsService.readByQuery).toHaveBeenCalledWith({
				fields: ['name', 'description', 'system_prompt', 'messages'],
			});
		});

		test('should return defined prompts', async () => {
			mcpOptions = { promptsCollection: 'ai_collection' };
			mockItemsService.readByQuery.mockResolvedValue([{ name: 'lorem', description: 'Lorem Ipsum' }]);

			const { result } = await rpc('prompts/list');

			expect(result.prompts).toEqual([{ name: 'lorem', description: 'Lorem Ipsum', arguments: [] }]);
		});

		test('should build prompt args from the system prompt and messages once per variable', async () => {
			mcpOptions = { promptsCollection: 'ai_collection' };

			mockItemsService.readByQuery.mockResolvedValue([
				{
					name: 'lorem',
					description: 'Lorem Ipsum',
					messages: [{ text: 'My {{user}}' }, { text: 'Again {{user}} at {{url}}' }],
					system_prompt: 'The {{url}} is',
				},
			]);

			const { result } = await rpc('prompts/list');

			expect(result.prompts[0].arguments).toEqual([
				{ name: 'url', description: 'Value for url', required: false },
				{ name: 'user', description: 'Value for user', required: false },
			]);
		});

		test('should return a JSON-RPC error if reading prompts fails', async () => {
			mcpOptions = { promptsCollection: 'ai_collection' };
			mockItemsService.readByQuery.mockRejectedValue(new Error('boom'));

			const response = await rpc('prompts/list');

			expect(response.error).toBeDefined();
		});
	});

	describe('prompt get', () => {
		let mockItemsService: { readByQuery: MockedFunction<any> };

		beforeEach(() => {
			mcpOptions = { promptsCollection: 'ai_collection' };
			mockItemsService = { readByQuery: vi.fn().mockResolvedValue([]) };

			vi.mocked(ItemsService).mockImplementation(function () {
				return mockItemsService as unknown as ItemsService;
			});
		});

		test('should return invalid params if no prompt collection defined', async () => {
			mcpOptions = {};

			const { error } = await rpc('prompts/get', { name: 'test', arguments: {} });

			expect(error).toMatchObject({ code: -32602, message: expect.stringContaining('Invalid prompt "test"') });
		});

		test('should query prompt by name', async () => {
			await rpc('prompts/get', { name: 'test', arguments: {} });

			expect(mockItemsService.readByQuery).toHaveBeenCalledWith({
				fields: ['description', 'system_prompt', 'messages'],
				filter: { name: { _eq: 'test' } },
			});
		});

		test('should return invalid params if invalid prompt', async () => {
			const { error } = await rpc('prompts/get', { name: 'test', arguments: {} });

			expect(error).toMatchObject({ code: -32602, message: expect.stringContaining('Invalid prompt "test"') });
		});

		test('should render system prompt and messages with args', async () => {
			mockItemsService.readByQuery.mockResolvedValue([
				{
					name: 'test',
					description: 'Lorem Ipsum',
					messages: [{ role: 'user', text: 'My {{user}}' }],
					system_prompt: 'Hello {{admin}}',
				},
			]);

			const { result } = await rpc('prompts/get', { name: 'test', arguments: { user: '1', admin: '2' } });

			expect(result).toMatchObject({
				description: 'Lorem Ipsum',
				messages: [
					{ role: 'assistant', content: { type: 'text', text: 'Hello 2' } },
					{ role: 'user', content: { type: 'text', text: 'My 1' } },
				],
			});
		});

		test('should support no messages or system_prompt', async () => {
			mockItemsService.readByQuery.mockResolvedValue([
				{ name: 'test', description: 'Lorem Ipsum', messages: null, system_prompt: null },
			]);

			const { result } = await rpc('prompts/get', { name: 'test', arguments: {} });

			expect(result).toMatchObject({ description: 'Lorem Ipsum', messages: [] });
		});

		test('should skip messages missing role and/or text', async () => {
			mockItemsService.readByQuery.mockResolvedValue([
				{
					name: 'test',
					description: 'Lorem Ipsum',
					messages: [
						{ role: null, text: 'Lorem' },
						{ role: 'user', text: null },
						{ role: null, text: null },
					],
				},
			]);

			const { result } = await rpc('prompts/get', { name: 'test', arguments: {} });

			expect(result.messages).toEqual([]);
		});
	});

	describe('toToolResponse', () => {
		beforeEach(() => {
			directusMCP = new DirectusMCP();
		});

		test('should return empty content for undefined result', () => {
			const response = directusMCP.toResultResponse(undefined);
			expect(response).toEqual({ content: [] });
		});

		test('should return empty content for null data', () => {
			const response = directusMCP.toResultResponse({ type: 'text', data: null });
			expect(response).toEqual({ content: [] });
		});

		test('should return empty content for undefined data', () => {
			const response = directusMCP.toResultResponse({ type: 'text', data: undefined });
			expect(response).toEqual({ content: [] });
		});

		test('should preserve the legacy text payload', () => {
			const result = { type: 'text' as const, data: { message: 'hello' } };
			const response = directusMCP.toResultResponse(result);

			expect(response).toEqual({
				content: [
					{
						type: 'text',
						text: JSON.stringify({ raw: { message: 'hello' } }),
					},
				],
			});
		});

		test('should send string results as plain text', () => {
			const response = directusMCP.toResultResponse({ type: 'text', data: 'line one\n\tline two', url: 'http://x/y' });

			expect(response).toEqual({
				content: [
					{ type: 'text', text: 'line one\n\tline two' },
					{ type: 'text', text: 'URL: http://x/y' },
				],
			});
		});

		test('should keep string results as JSON in registry mode', () => {
			const response = directusMCP.toResultResponse({ type: 'text', data: 'hello' }, { data: 'hello' }, 'registry');

			expect(response.content).toEqual([{ type: 'text', text: JSON.stringify({ data: 'hello' }) }]);
		});

		test('should attach structured content alongside the registry text payload', () => {
			const result = {
				type: 'text' as const,
				data: [{ id: 1 }],
			};

			const response = directusMCP.toResultResponse(result, { data: [{ id: 1 }] }, 'registry');

			expect(response).toEqual({
				content: [
					{
						type: 'text',
						text: JSON.stringify({ data: [{ id: 1 }] }),
					},
				],
				structuredContent: { data: [{ id: 1 }] },
			});
		});

		test('should preserve structured content when registry data is null', () => {
			const response = directusMCP.toResultResponse({ type: 'text', data: null }, { data: null }, 'registry');

			expect(response).toEqual({
				content: [],
				structuredContent: { data: null },
			});
		});

		test('should map registry errors to tool errors', () => {
			const response = directusMCP.toToolResponse(
				{
					ok: false,
					error: {
						code: 'UNKNOWN_TOOL',
						message: '"missing" does not exist',
						recoverable: true,
						next: {
							tool: 'search',
							input: { query: 'missing' },
						},
					},
				},
				'registry',
			);

			expect(response).toEqual({
				isError: true,
				content: [
					{
						type: 'text',
						text: JSON.stringify([
							{
								error: '"missing" does not exist',
								code: 'UNKNOWN_TOOL',
								recoverable: true,
								next: {
									tool: 'search',
									input: { query: 'missing' },
								},
							},
						]),
					},
				],
			});
		});

		test('should preserve native error codes in legacy responses', () => {
			const response = directusMCP.toToolResponse({
				ok: false,
				error: {
					code: 'ER_DUP_ENTRY',
					message: 'Duplicate entry',
					recoverable: false,
				},
			});

			expect(response).toEqual({
				isError: true,
				content: [
					{
						type: 'text',
						text: JSON.stringify([{ error: 'Duplicate entry', code: 'ER_DUP_ENTRY' }]),
					},
				],
			});
		});

		test('should return result directly for non-text types', () => {
			const result = { type: 'image' as const, data: 'base64data', mimeType: 'image/png' };
			const response = directusMCP.toResultResponse(result);

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

	describe('auth guard', () => {
		const MCP_RESOURCE_URL = 'https://directus.example.com/mcp';

		const oauthAccountability = {
			...regularAccountability,
			oauth: { client: 'client-id', scopes: ['mcp:access'], aud: [MCP_RESOURCE_URL] },
		} as Accountability;

		let mockRes: Response;

		beforeEach(() => {
			mockRes = {
				status: vi.fn().mockReturnThis(),
				set: vi.fn().mockReturnThis(),
				send: vi.fn(),
			} as unknown as Response;
		});

		function makeAuthReq(overrides: Partial<Request> = {}): Request {
			return {
				body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
				accountability: regularAccountability,
				schema: {} as SchemaOverview,
				token: null,
				tokenSource: null,
				method: 'POST',
				...overrides,
			} as unknown as Request;
		}

		test('unauthenticated request returns 401 with WWW-Authenticate', async () => {
			const req = makeAuthReq({
				accountability: { user: null, role: null, roles: [], admin: false, app: false, ip: null },
			});

			await new DirectusMCP().handleRequest(req, mockRes);

			expectMcpBearerChallenge(mockRes, { status: 401, resourceMetadata: true });
		});

		test.each(['GET', 'HEAD'])('should return 405 for authenticated %s requests', async (method) => {
			await new DirectusMCP().handleRequest(makeAuthReq({ method }), mockRes);

			expect(mockRes.status).toHaveBeenCalledWith(405);
			expect(mockRes.set).toHaveBeenCalledWith('Allow', 'POST');
		});

		test('OAuth session with wrong aud returns 401', async () => {
			const req = makeAuthReq({
				accountability: {
					...regularAccountability,
					oauth: { client: 'client-id', scopes: ['mcp:access'], aud: ['https://other.example.com/mcp'] },
				},
				tokenSource: 'header',
			});

			await new DirectusMCP().handleRequest(req, mockRes);

			expectMcpBearerChallenge(mockRes, { status: 401, error: 'invalid_token' });
		});

		test.each([
			['query', 'via query-string'],
			['cookie', 'via cookie'],
		] as const)('%s: OAuth session %s returns 401 invalid_request', async (tokenSource, _description) => {
			const req = makeAuthReq({ accountability: oauthAccountability, tokenSource });

			await new DirectusMCP().handleRequest(req, mockRes);

			expectMcpBearerChallenge(mockRes, { status: 401, error: 'invalid_request' });
		});

		test('OAuth session without mcp:access scope returns 403 insufficient_scope', async () => {
			const req = makeAuthReq({
				accountability: {
					...regularAccountability,
					oauth: { client: 'client-id', scopes: ['other:scope'], aud: [MCP_RESOURCE_URL] },
				},
				tokenSource: 'header',
			});

			await new DirectusMCP().handleRequest(req, mockRes);

			expectMcpBearerChallenge(mockRes, { status: 403, error: 'insufficient_scope' });
		});

		test('valid OAuth session with correct scope and aud via header returns tools', async () => {
			requestContext = { accountability: oauthAccountability, token: null, tokenSource: 'header' };

			const { result } = await rpc('tools/list');

			expect(result.tools).toEqual(expect.any(Array));
		});

		test.each([
			['query (legacy compat)', 'static-or-jwt-token', 'query' as const],
			['cookie', null, 'cookie' as const],
			['query (static token)', 'static-token', 'query' as const],
		])('regular session via %s passes through', async (_label, token, tokenSource) => {
			requestContext = { accountability: regularAccountability, token, tokenSource };

			const { result } = await rpc('tools/list');

			expect(result.tools).toEqual(expect.any(Array));
		});
	});
});
