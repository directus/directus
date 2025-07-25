import type { Accountability } from '@directus/types';
import type { ZodType } from 'zod';

export type ToolDefinitionHandlerOptions<Args> = { args: Args; accountability: Accountability | undefined };

export interface ToolDefinition<Args = unknown> {
	name: string;
	description: string;
	admin?: boolean;
	inputSchema?: ZodType<Args>;
	annotations?: Record<string, unknown>;
	handler: (opts: ToolDefinitionHandlerOptions<Args>) => Promise<{ data: unknown; message?: string }>;
}

export const defineTool = <Args = unknown>(
	name: string,
	tool: Omit<ToolDefinition<Args>, 'name'>,
): ToolDefinition<Args> => ({
	name,
	...tool,
});
