import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
	buildMCPToolName,
	getMCPClientManager,
	isExternalMCPTool,
	MCPClientManager,
	parseMCPToolName,
	resetMCPClientManager,
} from './mcp-client-manager.js';
import type { MCPServerConfig } from './types.js';

// Mock the MCPClient
vi.mock('./mcp-client.js', () => ({
	MCPClient: vi.fn().mockImplementation(() => ({
		connect: vi.fn().mockResolvedValue(undefined),
		disconnect: vi.fn().mockResolvedValue(undefined),
		reconnect: vi.fn().mockResolvedValue(undefined),
		listTools: vi.fn().mockResolvedValue([
			{
				name: 'weather_forecast',
				description: 'Get weather forecast',
				inputSchema: { type: 'object', properties: { location: { type: 'string' } } },
			},
			{
				name: 'weather_current',
				description: 'Get current weather',
				inputSchema: { type: 'object', properties: { location: { type: 'string' } } },
			},
		]),
		callTool: vi.fn().mockResolvedValue({
			content: [{ type: 'text', text: 'Sunny, 72°F' }],
			isError: false,
		}),
		isConnected: vi.fn().mockReturnValue(true),
		state: 'connected',
	})),
}));

vi.mock('../../../logger/index.js', () => ({
	useLogger: vi.fn(() => ({
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	})),
}));

describe('MCPClientManager', () => {
	let manager: MCPClientManager;

	const testServerConfig: MCPServerConfig = {
		id: 'weather-server',
		name: 'Weather Server',
		url: 'http://localhost:3001/mcp',
		enabled: true,
		toolApproval: 'ask',
	};

	const testServerConfig2: MCPServerConfig = {
		id: 'calendar-server',
		name: 'Calendar Server',
		url: 'http://localhost:3002/mcp',
		enabled: true,
		auth: {
			type: 'bearer',
			token: 'secret-token',
		},
		toolApproval: 'always',
	};

	beforeEach(() => {
		manager = new MCPClientManager();
	});

	afterEach(async () => {
		await manager.disconnectAll();
		vi.clearAllMocks();
	});

	describe('utility functions', () => {
		describe('buildMCPToolName', () => {
			test('should build correct tool name format', () => {
				const result = buildMCPToolName('weather-server', 'get_forecast');
				expect(result).toBe('mcp__weather-server__get_forecast');
			});
		});

		describe('parseMCPToolName', () => {
			test('should parse valid tool name', () => {
				const result = parseMCPToolName('mcp__weather-server__get_forecast');
				expect(result).toEqual({ serverId: 'weather-server', toolName: 'get_forecast' });
			});

			test('should return null for invalid tool name', () => {
				expect(parseMCPToolName('invalid-name')).toBeNull();
				expect(parseMCPToolName('mcp__only-two-parts')).toBeNull();
				expect(parseMCPToolName('other__prefix__tool')).toBeNull();
			});
		});

		describe('isExternalMCPTool', () => {
			test('should identify external MCP tools', () => {
				expect(isExternalMCPTool('mcp__server__tool')).toBe(true);
				expect(isExternalMCPTool('items')).toBe(false);
				expect(isExternalMCPTool('files')).toBe(false);
			});
		});
	});

	describe('registerServer', () => {
		test('should register a server configuration', () => {
			manager.registerServer(testServerConfig);

			const servers = manager.getServers();
			expect(servers).toHaveLength(1);
			expect(servers[0]?.id).toBe('weather-server');
		});

		test('should register multiple servers', () => {
			manager.registerServers([testServerConfig, testServerConfig2]);

			const servers = manager.getServers();
			expect(servers).toHaveLength(2);
		});

		test('should update existing server on re-register', () => {
			manager.registerServer(testServerConfig);
			manager.registerServer({ ...testServerConfig, name: 'Updated Weather Server' });

			const servers = manager.getServers();
			expect(servers).toHaveLength(1);
			expect(servers[0]?.name).toBe('Updated Weather Server');
		});
	});

	describe('unregisterServer', () => {
		test('should unregister a server', async () => {
			manager.registerServer(testServerConfig);
			await manager.connectServer('weather-server');
			await manager.unregisterServer('weather-server');

			expect(manager.getServers()).toHaveLength(0);
			expect(manager.getClient('weather-server')).toBeUndefined();
		});
	});

	describe('getServer', () => {
		test('should get a specific server by id', () => {
			manager.registerServers([testServerConfig, testServerConfig2]);

			const server = manager.getServer('weather-server');
			expect(server?.name).toBe('Weather Server');
		});

		test('should return undefined for unknown server', () => {
			expect(manager.getServer('unknown')).toBeUndefined();
		});
	});

	describe('connectServer', () => {
		test('should connect to a registered server', async () => {
			manager.registerServer(testServerConfig);
			await manager.connectServer('weather-server');

			const client = manager.getClient('weather-server');
			expect(client).toBeDefined();
			expect(client?.isConnected()).toBe(true);
		});

		test('should throw for unregistered server', async () => {
			await expect(manager.connectServer('unknown')).rejects.toThrow('is not registered');
		});

		test('should skip disabled servers', async () => {
			manager.registerServer({ ...testServerConfig, enabled: false });
			await manager.connectServer('weather-server');

			expect(manager.getClient('weather-server')).toBeUndefined();
		});

		test('should cache tools after connecting', async () => {
			manager.registerServer(testServerConfig);
			await manager.connectServer('weather-server');

			const tools = manager.getServerTools('weather-server');
			expect(tools).toHaveLength(2);
			expect(tools[0]?.fullName).toBe('mcp__weather-server__weather_forecast');
		});
	});

	describe('connectAll', () => {
		test('should connect to all enabled servers', async () => {
			manager.registerServers([testServerConfig, testServerConfig2]);
			await manager.connectAll();

			expect(manager.initialized).toBe(true);
			expect(manager.getClient('weather-server')?.isConnected()).toBe(true);
			expect(manager.getClient('calendar-server')?.isConnected()).toBe(true);
		});

		test('should skip disabled servers', async () => {
			manager.registerServers([testServerConfig, { ...testServerConfig2, enabled: false }]);
			await manager.connectAll();

			expect(manager.getClient('weather-server')?.isConnected()).toBe(true);
			expect(manager.getClient('calendar-server')).toBeUndefined();
		});
	});

	describe('disconnectAll', () => {
		test('should disconnect from all servers', async () => {
			manager.registerServers([testServerConfig, testServerConfig2]);
			await manager.connectAll();
			await manager.disconnectAll();

			expect(manager.initialized).toBe(false);
		});
	});

	describe('getAllTools', () => {
		test('should return tools from all connected servers', async () => {
			manager.registerServers([testServerConfig, testServerConfig2]);
			await manager.connectAll();

			const tools = manager.getAllTools();
			// 2 tools per server * 2 servers = 4 tools
			expect(tools).toHaveLength(4);
		});

		test('should not include tools from disabled servers', async () => {
			manager.registerServers([testServerConfig, { ...testServerConfig2, enabled: false }]);
			await manager.connectAll();

			const tools = manager.getAllTools();
			expect(tools).toHaveLength(2);
		});
	});

	describe('findTool', () => {
		test('should find tool by full name', async () => {
			manager.registerServer(testServerConfig);
			await manager.connectServer('weather-server');

			const tool = manager.findTool('mcp__weather-server__weather_forecast');
			expect(tool).toBeDefined();
			expect(tool?.originalName).toBe('weather_forecast');
		});

		test('should return undefined for unknown tool', async () => {
			manager.registerServer(testServerConfig);
			await manager.connectServer('weather-server');

			expect(manager.findTool('mcp__weather-server__unknown')).toBeUndefined();
			expect(manager.findTool('mcp__unknown-server__weather_forecast')).toBeUndefined();
		});
	});

	describe('callTool', () => {
		test('should call tool on correct server', async () => {
			manager.registerServer(testServerConfig);
			await manager.connectServer('weather-server');

			const result = await manager.callTool('mcp__weather-server__weather_forecast', { location: 'NYC' });
			expect(result.content[0]?.text).toBe('Sunny, 72°F');
		});

		test('should throw for invalid tool name format', async () => {
			await expect(manager.callTool('invalid-name', {})).rejects.toThrow('Invalid MCP tool name');
		});

		test('should throw for disconnected server', async () => {
			await expect(manager.callTool('mcp__unknown__tool', {})).rejects.toThrow('is not connected');
		});
	});

	describe('testConnection', () => {
		test('should test connection successfully', async () => {
			const result = await manager.testConnection(testServerConfig);
			expect(result.success).toBe(true);
			expect(result.toolCount).toBe(2);
		});
	});
});

describe('getMCPClientManager singleton', () => {
	afterEach(async () => {
		await resetMCPClientManager();
	});

	test('should return same instance', () => {
		const instance1 = getMCPClientManager();
		const instance2 = getMCPClientManager();
		expect(instance1).toBe(instance2);
	});

	test('should reset instance', async () => {
		const instance1 = getMCPClientManager();
		await resetMCPClientManager();
		const instance2 = getMCPClientManager();
		expect(instance1).not.toBe(instance2);
	});
});
