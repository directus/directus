import type { Accountability, SchemaOverview } from '@directus/types';
import type { ZodType } from 'zod';

export type ToolHandler<Args> = {
	args: Args;
	schema: SchemaOverview;
	accountability: Accountability | undefined;
};

export interface ToolConfig<Args> {
	name: string;
	description: string;
	admin?: boolean;
	inputSchema?: ZodType<any>;
	validateSchema?: ZodType<Args>;
	annotations?: Record<string, unknown>;
	handler: (opts: ToolHandler<Args>) => Promise<{ data?: null | unknown } | undefined>;
}

export function defineTool<Args>(tool: ToolConfig<Args>): ToolConfig<Args> {
	return tool;
}
