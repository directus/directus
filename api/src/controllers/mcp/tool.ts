import type { Accountability } from '@directus/types';
import type { ZodType } from 'zod';

export type ToolDefinitionHandlerOptions<Params> = { args: Params; accountability: Accountability | undefined };

export interface ToolDefinition<Params = unknown> {
	name: string;
	description: string;
	admin?: boolean;
	inputSchema?: ZodType<Params>;
	annotations?: Record<string, unknown>;
	handler: (opts: ToolDefinitionHandlerOptions<Params>) => Promise<{ data: unknown; message?: string }>;
}

export const defineTool = (name: string, tool: Omit<ToolDefinition, 'name'>): ToolDefinition => ({ name, ...tool });
