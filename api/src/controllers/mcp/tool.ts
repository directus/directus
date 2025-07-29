import type { Accountability, SchemaOverview } from '@directus/types';
import type { ZodType } from 'zod';

export type ToolResultBase = {
	type?: 'text' | 'image';
};

export type TextToolResult = ToolResultBase & {
	type: 'text';
	data: unknown;
};

export type ImageToolResult = ToolResultBase & {
	type: 'image';
	data: string;
	mimeType: string;
};

export type ToolResult = TextToolResult | ImageToolResult;

export type ToolHandler<T> = {
	(options: {
		args: T;
		schema: SchemaOverview;
		accountability: Accountability | undefined;
	}): Promise<ToolResult | undefined>;
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
