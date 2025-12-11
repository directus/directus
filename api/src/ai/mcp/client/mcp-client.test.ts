import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MCPClient } from './mcp-client.js';

// Mock the MCP SDK
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
	Client: vi.fn().mockImplementation(() => ({
		connect: vi.fn(),
		close: vi.fn(),
		listTools: vi.fn().mockResolvedValue({
			tools: [
				{
					name: 'test_tool',
					description: 'A test tool',
					inputSchema: { type: 'object', properties: {} },
				},
			],
		}),
		callTool: vi.fn().mockResolvedValue({
			content: [{ type: 'text', text: 'Tool result' }],
			isError: false,
		}),
		getServerVersion: vi.fn().mockReturnValue({ name: 'test-server', version: '1.0.0' }),
	})),
}));

vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
	StreamableHTTPClientTransport: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
	SSEClientTransport: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../../logger/index.js', () => ({
	useLogger: vi.fn(() => ({
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	})),
}));

describe('MCPClient', () => {
	let client: MCPClient;

	beforeEach(() => {
		client = new MCPClient();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('initial state', () => {
		test('should start disconnected', () => {
			expect(client.state).toBe('disconnected');
			expect(client.isConnected()).toBe(false);
			expect(client.url).toBeNull();
			expect(client.serverInfo).toBeNull();
		});
	});

	describe('connect', () => {
		test('should connect to MCP server via StreamableHTTP', async () => {
			await client.connect('http://localhost:3000/mcp');

			expect(client.state).toBe('connected');
			expect(client.isConnected()).toBe(true);
			expect(client.url).toBe('http://localhost:3000/mcp');
		});

		test('should not reconnect if already connected', async () => {
			await client.connect('http://localhost:3000/mcp');
			await client.connect('http://localhost:3000/mcp');

			expect(client.state).toBe('connected');
		});

		test('should include auth headers for bearer auth', async () => {
			await client.connect('http://localhost:3000/mcp', {
				auth: {
					type: 'bearer',
					token: 'my-secret-token',
				},
			});

			expect(client.isConnected()).toBe(true);
		});

		test('should include auth headers for basic auth', async () => {
			await client.connect('http://localhost:3000/mcp', {
				auth: {
					type: 'basic',
					username: 'user',
					password: 'pass',
				},
			});

			expect(client.isConnected()).toBe(true);
		});
	});

	describe('listTools', () => {
		test('should list tools from connected server', async () => {
			await client.connect('http://localhost:3000/mcp');
			const tools = await client.listTools();

			expect(tools).toHaveLength(1);
			expect(tools[0]?.name).toBe('test_tool');
		});

		test('should throw if not connected', async () => {
			await expect(client.listTools()).rejects.toThrow('MCP client is not connected');
		});
	});

	describe('callTool', () => {
		test('should call tool on connected server', async () => {
			await client.connect('http://localhost:3000/mcp');
			const result = await client.callTool('test_tool', { arg: 'value' });

			expect(result.content).toHaveLength(1);
			expect(result.content[0]?.text).toBe('Tool result');
			expect(result.isError).toBe(false);
		});

		test('should throw if not connected', async () => {
			await expect(client.callTool('test_tool', {})).rejects.toThrow('MCP client is not connected');
		});
	});

	describe('disconnect', () => {
		test('should disconnect from server', async () => {
			await client.connect('http://localhost:3000/mcp');
			await client.disconnect();

			expect(client.state).toBe('disconnected');
			expect(client.isConnected()).toBe(false);
		});

		test('should be idempotent', async () => {
			await client.disconnect();
			await client.disconnect();

			expect(client.state).toBe('disconnected');
		});
	});

	describe('reconnect', () => {
		test('should reconnect using previous settings', async () => {
			await client.connect('http://localhost:3000/mcp');
			await client.disconnect();
			await client.reconnect();

			expect(client.isConnected()).toBe(true);
			expect(client.url).toBe('http://localhost:3000/mcp');
		});

		test('should throw if never connected', async () => {
			await expect(client.reconnect()).rejects.toThrow('No previous connection URL available');
		});
	});
});
