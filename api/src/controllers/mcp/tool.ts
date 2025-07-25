import type { Accountability, SchemaOverview } from '@directus/types';
import type { ZodType } from 'zod';

export type ToolHandler<Args> = {
	args: Args;
	schema: SchemaOverview;
	accountability: Accountability | undefined;
};

export interface ToolConfig<Args = unknown> {
	name: string;
	description: string;
	admin?: boolean;
	inputSchema?: ZodType<Args>;
	annotations?: Record<string, unknown>;
	handler: (opts: ToolHandler<Args>) => Promise<{ data: unknown; message?: string }>;
}

export const defineTool = <Args = unknown>(name: string, tool: Omit<ToolConfig<Args>, 'name'>): ToolConfig<Args> => ({
	name,
	...tool,
});
