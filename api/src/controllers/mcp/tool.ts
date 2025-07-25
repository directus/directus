import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ZodType } from 'zod';

export interface ToolDefinition<Params = any> {
	name: string;
	description: string;
	inputSchema: ZodType<Params>;
	annotations?: Record<string, any>;
	handler: (args: Params) => Promise<CallToolResult>;
}

export const defineTool = (name: string, tool: Omit<ToolDefinition, 'name'>) => ({ name, ...tool });
