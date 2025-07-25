import type { ZodType } from 'zod';

export interface ToolDefinition<Params = any> {
	name: string;
	description: string;
	admin?: boolean;
	inputSchema?: ZodType<Params>;
	annotations?: Record<string, any>;
	handler: (args: Params) => Promise<{ data: unknown; message?: string }>;
}

export const defineTool = (name: string, tool: Omit<ToolDefinition, 'name'>): ToolDefinition => ({ name, ...tool });
