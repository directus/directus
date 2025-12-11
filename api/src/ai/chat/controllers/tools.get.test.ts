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

vi.mock('../../mcp/client/index.js', () => ({
	getMCPClientManager: vi.fn(() => ({
		initialized: false,
		getServers: vi.fn(() => []),
		getClient: vi.fn(),
		registerServers: vi.fn(),
		connectAll: vi.fn(),
		disconnectAll: vi.fn(),
	})),
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
});
