import { InvalidPayloadError } from '@directus/errors';
import { jsonSchema, tool, type Tool } from 'ai';
import type { ExternalMCPTool, MCPClientManager, MCPToolResult } from '../../mcp/client/index.js';
import type { ToolApprovalMode } from '../models/chat-request.js';

/**
 * Convert MCP tool result content to AI SDK format
 */
function convertMCPResultToText(result: MCPToolResult): string {
	const textParts: string[] = [];

	for (const content of result.content) {
		if (content.type === 'text' && content.text) {
			textParts.push(content.text);
		} else if (content.type === 'image' && content.data) {
			textParts.push(`[Image: ${content.mimeType ?? 'image'}]`);
		} else if (content.type === 'resource' && content.text) {
			textParts.push(content.text);
		}
	}

	return textParts.join('\n');
}

/**
 * Convert an external MCP tool to an AI SDK tool
 *
 * @param externalTool - The external MCP tool
 * @param clientManager - The MCP client manager for executing tool calls
 * @param toolApprovals - Optional tool approval overrides from the request
 * @returns An AI SDK tool
 */
export function externalMCPToolToAiSdkTool(
	externalTool: ExternalMCPTool,
	clientManager: MCPClientManager,
	toolApprovals?: Record<string, ToolApprovalMode>,
): Tool {
	// Determine if tool needs approval based on client settings or server default
	const approvalMode = toolApprovals?.[externalTool.fullName] ?? externalTool.toolApproval;
	const needsApproval = approvalMode !== 'always';

	return tool({
		name: externalTool.fullName,
		description: `[${externalTool.serverName}] ${externalTool.description}`,
		inputSchema: jsonSchema(externalTool.inputSchema as Parameters<typeof jsonSchema>[0]),
		needsApproval,
		execute: async (rawArgs) => {
			try {
				const result = await clientManager.callTool(externalTool.fullName, rawArgs as Record<string, unknown>);

				if (result.isError) {
					throw new InvalidPayloadError({
						reason: `MCP tool "${externalTool.originalName}" returned an error: ${convertMCPResultToText(result)}`,
					});
				}

				return {
					type: 'text' as const,
					data: convertMCPResultToText(result),
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				throw new InvalidPayloadError({
					reason: `Failed to execute MCP tool "${externalTool.originalName}": ${errorMessage}`,
				});
			}
		},
	});
}

/**
 * Get all external MCP tools as AI SDK tools
 *
 * @param clientManager - The MCP client manager
 * @param toolApprovals - Optional tool approval overrides
 * @returns Record of tool name to AI SDK tool
 */
export function getAllExternalMCPToolsAsAiSdkTools(
	clientManager: MCPClientManager,
	toolApprovals?: Record<string, ToolApprovalMode>,
): Record<string, Tool<unknown, unknown>> {
	const tools: Record<string, Tool<unknown, unknown>> = {};
	const externalTools = clientManager.getAllTools();

	for (const externalTool of externalTools) {
		// Skip disabled tools
		const approvalMode = toolApprovals?.[externalTool.fullName] ?? externalTool.toolApproval;

		if (approvalMode === 'disabled') {
			continue;
		}

		tools[externalTool.fullName] = externalMCPToolToAiSdkTool(externalTool, clientManager, toolApprovals) as Tool<
			unknown,
			unknown
		>;
	}

	return tools;
}
