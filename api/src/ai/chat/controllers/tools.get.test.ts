import type { Accountability } from '@directus/types';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { aiToolsGetHandler } from './tools.get.js';

// Mock dependencies
vi.mock('../../../logger/index.js', () => ({
	useLogger: () => ({
		warn: vi.fn(),
		debug: vi.fn(),
		info: vi.fn(),
		error: vi.fn(),
	}),
}));

const mockGetMCPClientManager = vi.fn();

vi.mock('../../mcp/client/index.js', () => ({
	getMCPClientManager: () => mockGetMCPClientManager(),
	buildMCPToolName: (serverId: string, toolName: string) => `mcp__${serverId}__${toolName}`,
}));

describe('aiToolsGetHandler', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;

	beforeEach(() => {
		mockRequest = {
			accountability: {
				app: true,
				user: 'test-user',
				role: 'admin',
				admin: true,
			} as Accountability,
		};

		mockResponse = {
			locals: {
				ai: {
					mcpExternalServers: [],
				},
			},
			json: vi.fn(),
		};

		// Default mock - not initialized
		mockGetMCPClientManager.mockReturnValue({
			initialized: false,
			getServers: vi.fn(() => []),
			getClient: vi.fn(),
			registerServers: vi.fn(),
			connectAll: vi.fn(),
			disconnectAll: vi.fn(),
		});

		vi.clearAllMocks();
	});

	test('should return empty array when no external servers are configured', async () => {
		await aiToolsGetHandler(mockRequest as Request, mockResponse as Response, vi.fn());

		expect(mockResponse.json).toHaveBeenCalledWith({ data: [] });
	});

	test('should throw ForbiddenError when not an app request', async () => {
		mockRequest.accountability = { app: false } as Accountability;

		await expect(aiToolsGetHandler(mockRequest as Request, mockResponse as Response, vi.fn())).rejects.toThrow();
	});

	test('should return empty array when MCP client manager is not initialized', async () => {
		mockResponse.locals = {
			ai: {
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

		await aiToolsGetHandler(mockRequest as Request, mockResponse as Response, vi.fn());

		expect(mockResponse.json).toHaveBeenCalledWith({ data: [] });
	});

	test('should return tools from connected MCP servers', async () => {
		const mockClient = {
			isConnected: vi.fn(() => true),
			listTools: vi.fn(() =>
				Promise.resolve([
					{ name: 'tool1', description: 'Tool 1 description' },
					{ name: 'tool2', description: 'Tool 2 description' },
				]),
			),
		};

		mockGetMCPClientManager.mockReturnValue({
			initialized: true,
			getServers: vi.fn(() => [
				{
					id: 'test-server',
					name: 'Test Server',
					url: 'https://mcp.example.com',
					enabled: true,
					toolApproval: 'ask',
				},
			]),
			getClient: vi.fn(() => mockClient),
			registerServers: vi.fn(),
			connectAll: vi.fn(),
			disconnectAll: vi.fn(),
		});

		mockResponse.locals = {
			ai: {
				mcpExternalServers: [],
			},
		};

		await aiToolsGetHandler(mockRequest as Request, mockResponse as Response, vi.fn());

		expect(mockResponse.json).toHaveBeenCalledWith({
			data: [
				{
					name: 'mcp__test-server__tool1',
					description: 'Tool 1 description',
					serverId: 'test-server',
					serverName: 'Test Server',
					toolApproval: 'ask',
				},
				{
					name: 'mcp__test-server__tool2',
					description: 'Tool 2 description',
					serverId: 'test-server',
					serverName: 'Test Server',
					toolApproval: 'ask',
				},
			],
		});
	});

	test('should skip disabled servers', async () => {
		const mockClient = {
			isConnected: vi.fn(() => true),
			listTools: vi.fn(() => Promise.resolve([{ name: 'tool1', description: 'Tool 1' }])),
		};

		mockGetMCPClientManager.mockReturnValue({
			initialized: true,
			getServers: vi.fn(() => [
				{
					id: 'disabled-server',
					name: 'Disabled Server',
					url: 'https://mcp.example.com',
					enabled: false,
					toolApproval: 'ask',
				},
			]),
			getClient: vi.fn(() => mockClient),
			registerServers: vi.fn(),
			connectAll: vi.fn(),
			disconnectAll: vi.fn(),
		});

		mockResponse.locals = {
			ai: {
				mcpExternalServers: [],
			},
		};

		await aiToolsGetHandler(mockRequest as Request, mockResponse as Response, vi.fn());

		expect(mockResponse.json).toHaveBeenCalledWith({ data: [] });
		expect(mockClient.listTools).not.toHaveBeenCalled();
	});

	test('should skip servers without connected client', async () => {
		mockGetMCPClientManager.mockReturnValue({
			initialized: true,
			getServers: vi.fn(() => [
				{
					id: 'test-server',
					name: 'Test Server',
					url: 'https://mcp.example.com',
					enabled: true,
					toolApproval: 'ask',
				},
			]),
			getClient: vi.fn(() => null),
			registerServers: vi.fn(),
			connectAll: vi.fn(),
			disconnectAll: vi.fn(),
		});

		mockResponse.locals = {
			ai: {
				mcpExternalServers: [],
			},
		};

		await aiToolsGetHandler(mockRequest as Request, mockResponse as Response, vi.fn());

		expect(mockResponse.json).toHaveBeenCalledWith({ data: [] });
	});

	test('should skip servers with disconnected client', async () => {
		const mockClient = {
			isConnected: vi.fn(() => false),
			listTools: vi.fn(),
		};

		mockGetMCPClientManager.mockReturnValue({
			initialized: true,
			getServers: vi.fn(() => [
				{
					id: 'test-server',
					name: 'Test Server',
					url: 'https://mcp.example.com',
					enabled: true,
					toolApproval: 'ask',
				},
			]),
			getClient: vi.fn(() => mockClient),
			registerServers: vi.fn(),
			connectAll: vi.fn(),
			disconnectAll: vi.fn(),
		});

		mockResponse.locals = {
			ai: {
				mcpExternalServers: [],
			},
		};

		await aiToolsGetHandler(mockRequest as Request, mockResponse as Response, vi.fn());

		expect(mockResponse.json).toHaveBeenCalledWith({ data: [] });
		expect(mockClient.listTools).not.toHaveBeenCalled();
	});

	test('should continue with other servers when one fails', async () => {
		const mockClientSuccess = {
			isConnected: vi.fn(() => true),
			listTools: vi.fn(() => Promise.resolve([{ name: 'working-tool', description: 'Works' }])),
		};

		const mockClientFail = {
			isConnected: vi.fn(() => true),
			listTools: vi.fn(() => Promise.reject(new Error('Connection failed'))),
		};

		mockGetMCPClientManager.mockReturnValue({
			initialized: true,
			getServers: vi.fn(() => [
				{
					id: 'failing-server',
					name: 'Failing Server',
					url: 'https://fail.example.com',
					enabled: true,
					toolApproval: 'ask',
				},
				{
					id: 'working-server',
					name: 'Working Server',
					url: 'https://work.example.com',
					enabled: true,
					toolApproval: 'always',
				},
			]),
			getClient: vi.fn((id: string) => {
				if (id === 'failing-server') return mockClientFail;
				return mockClientSuccess;
			}),
			registerServers: vi.fn(),
			connectAll: vi.fn(),
			disconnectAll: vi.fn(),
		});

		mockResponse.locals = {
			ai: {
				mcpExternalServers: [],
			},
		};

		await aiToolsGetHandler(mockRequest as Request, mockResponse as Response, vi.fn());

		expect(mockResponse.json).toHaveBeenCalledWith({
			data: [
				{
					name: 'mcp__working-server__working-tool',
					description: 'Works',
					serverId: 'working-server',
					serverName: 'Working Server',
					toolApproval: 'always',
				},
			],
		});
	});

	test('should handle tools with empty description', async () => {
		const mockClient = {
			isConnected: vi.fn(() => true),
			listTools: vi.fn(() => Promise.resolve([{ name: 'tool1', description: '' }])),
		};

		mockGetMCPClientManager.mockReturnValue({
			initialized: true,
			getServers: vi.fn(() => [
				{
					id: 'test-server',
					name: 'Test Server',
					url: 'https://mcp.example.com',
					enabled: true,
					toolApproval: 'disabled',
				},
			]),
			getClient: vi.fn(() => mockClient),
			registerServers: vi.fn(),
			connectAll: vi.fn(),
			disconnectAll: vi.fn(),
		});

		mockResponse.locals = {
			ai: {
				mcpExternalServers: [],
			},
		};

		await aiToolsGetHandler(mockRequest as Request, mockResponse as Response, vi.fn());

		expect(mockResponse.json).toHaveBeenCalledWith({
			data: [
				{
					name: 'mcp__test-server__tool1',
					description: '',
					serverId: 'test-server',
					serverName: 'Test Server',
					toolApproval: 'disabled',
				},
			],
		});
	});

	test('should return empty array when initialization fails', async () => {
		mockGetMCPClientManager.mockReturnValue({
			initialized: false,
			getServers: vi.fn(() => []),
			getClient: vi.fn(),
			registerServers: vi.fn(),
			connectAll: vi.fn(() => Promise.reject(new Error('Connection failed'))),
			disconnectAll: vi.fn(),
		});

		mockResponse.locals = {
			ai: {
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

		await aiToolsGetHandler(mockRequest as Request, mockResponse as Response, vi.fn());

		expect(mockResponse.json).toHaveBeenCalledWith({ data: [] });
	});

	test('should re-initialize when servers have changed', async () => {
		const disconnectAll = vi.fn();
		const registerServers = vi.fn();
		const connectAll = vi.fn();

		mockGetMCPClientManager.mockReturnValue({
			initialized: true,
			getServers: vi.fn(() => [
				{
					id: 'old-server',
					name: 'Old Server',
					url: 'https://old.example.com',
					enabled: true,
					toolApproval: 'ask',
				},
			]),
			getClient: vi.fn(() => null),
			registerServers,
			connectAll,
			disconnectAll,
		});

		mockResponse.locals = {
			ai: {
				mcpExternalServers: [
					{
						id: 'new-server',
						name: 'New Server',
						url: 'https://new.example.com',
						enabled: true,
						toolApproval: 'ask',
					},
				],
			},
		};

		await aiToolsGetHandler(mockRequest as Request, mockResponse as Response, vi.fn());

		expect(disconnectAll).toHaveBeenCalled();
		expect(registerServers).toHaveBeenCalled();
		expect(connectAll).toHaveBeenCalled();
	});
});
