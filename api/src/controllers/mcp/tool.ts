import type { Accountability, SchemaOverview } from '@directus/types';
import type { ZodType } from 'zod';

export type ToolHandler<T> = {
	(options: {
		args: T;
		schema: SchemaOverview;
		accountability: Accountability | undefined;
	}): Promise<{ data?: unknown } | undefined>;
};

export interface ToolConfig<T> {
	name: string;
	description: string;
	admin?: boolean;
	inputSchema?: ZodType<any>;
	validateSchema?: ZodType<T>;
	annotations?: Record<string, unknown>;
	handler: ToolHandler<T>;
}

export function defineTool<Args>(tool: ToolConfig<Args>): ToolConfig<Args> {
	return tool;
}
