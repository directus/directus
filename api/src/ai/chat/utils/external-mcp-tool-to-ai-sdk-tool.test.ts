import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MCPClientManager } from '../../mcp/client/mcp-client-manager.js';
import type { ExternalMCPTool, MCPToolResult } from '../../mcp/client/types.js';
import { externalMCPToolToAiSdkTool, getAllExternalMCPToolsAsAiSdkTools } from './external-mcp-tool-to-ai-sdk-tool.js';

describe('external-mcp-tool-to-ai-sdk-tool', () => {
	let mockClientManager: MCPClientManager;
	let mockExternalTool: ExternalMCPTool;

	beforeEach(() => {
		mockExternalTool = {
			fullName: 'mcp__test-server__test_tool',
			originalName: 'test_tool',
			serverId: 'test-server',
			serverName: 'Test Server',
			description: 'A test tool for testing',
			inputSchema: {
				type: 'object' as const,
				properties: {
					input: { type: 'string' },
				},
			},
			toolApproval: 'ask',
		};

		mockClientManager = {
			callTool: vi.fn().mockResolvedValue({
				content: [{ type: 'text', text: 'Tool executed successfully' }],
				isError: false,
			} as MCPToolResult),
			getAllTools: vi.fn().mockReturnValue([
				mockExternalTool,
				{
					...mockExternalTool,
					fullName: 'mcp__test-server__another_tool',
					originalName: 'another_tool',
					description: 'Another test tool',
					toolApproval: 'always',
				},
			]),
		} as unknown as MCPClientManager;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('externalMCPToolToAiSdkTool', () => {
		test('should convert external MCP tool to AI SDK tool', () => {
			const aiTool = externalMCPToolToAiSdkTool(mockExternalTool, mockClientManager);

			expect(aiTool.name).toBe('mcp__test-server__test_tool');
			expect(aiTool.description).toContain('[Test Server]');
			expect(aiTool.description).toContain('A test tool for testing');
			// @ts-expect-error - accessing internal property for testing
			expect(aiTool.needsApproval).toBe(true); // 'ask' mode requires approval
		});

		test('should set needsApproval to false for always mode', () => {
			const toolWithAlways = { ...mockExternalTool, toolApproval: 'always' as const };
			const aiTool = externalMCPToolToAiSdkTool(toolWithAlways, mockClientManager);

			// @ts-expect-error - accessing internal property for testing
			expect(aiTool.needsApproval).toBe(false);
		});

		test('should respect tool approval overrides', () => {
			const aiTool = externalMCPToolToAiSdkTool(mockExternalTool, mockClientManager, {
				'mcp__test-server__test_tool': 'always',
			});

			// @ts-expect-error - accessing internal property for testing
			expect(aiTool.needsApproval).toBe(false);
		});

		test('should execute tool via client manager', async () => {
			const aiTool = externalMCPToolToAiSdkTool(mockExternalTool, mockClientManager);

			// @ts-expect-error - accessing execute for testing
			const result = await aiTool.execute({ input: 'test' });

			expect(mockClientManager.callTool).toHaveBeenCalledWith('mcp__test-server__test_tool', { input: 'test' });

			expect(result).toEqual({
				type: 'text',
				data: 'Tool executed successfully',
			});
		});

		test('should throw on tool error', async () => {
			(mockClientManager.callTool as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				content: [{ type: 'text', text: 'Something went wrong' }],
				isError: true,
			});

			const aiTool = externalMCPToolToAiSdkTool(mockExternalTool, mockClientManager);

			// @ts-expect-error - accessing execute for testing
			await expect(aiTool.execute({ input: 'test' })).rejects.toThrow('returned an error');
		});
	});

	describe('getAllExternalMCPToolsAsAiSdkTools', () => {
		test('should convert all external tools', () => {
			const tools = getAllExternalMCPToolsAsAiSdkTools(mockClientManager);

			expect(Object.keys(tools)).toHaveLength(2);
			expect(tools['mcp__test-server__test_tool']).toBeDefined();
			expect(tools['mcp__test-server__another_tool']).toBeDefined();
		});

		test('should skip disabled tools', () => {
			(mockClientManager.getAllTools as ReturnType<typeof vi.fn>).mockReturnValue([
				mockExternalTool,
				{ ...mockExternalTool, fullName: 'mcp__test-server__disabled_tool', toolApproval: 'disabled' },
			]);

			const tools = getAllExternalMCPToolsAsAiSdkTools(mockClientManager);

			expect(Object.keys(tools)).toHaveLength(1);
			expect(tools['mcp__test-server__test_tool']).toBeDefined();
			expect(tools['mcp__test-server__disabled_tool']).toBeUndefined();
		});

		test('should respect tool approval overrides for disabling', () => {
			const tools = getAllExternalMCPToolsAsAiSdkTools(mockClientManager, {
				'mcp__test-server__test_tool': 'disabled',
			});

			expect(tools['mcp__test-server__test_tool']).toBeUndefined();
			expect(tools['mcp__test-server__another_tool']).toBeDefined();
		});
	});
});
