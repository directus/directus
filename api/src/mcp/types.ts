import type { Accountability, Query, SchemaOverview } from '@directus/types';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
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
		sanitizedQuery: Query;
		schema: SchemaOverview;
		accountability: Accountability | undefined;
	}): Promise<ToolResult | undefined>;
};

export interface ToolConfig<T> {
	name: string;
	description: string;
	admin?: boolean;
	inputSchema: ZodType<any>;
	validateSchema?: ZodType<T>;
	annotations?: ToolAnnotations;
	handler: ToolHandler<T>;
}

export interface Prompt {
	name: string;
	system_prompt?: string | null;
	description?: string;
	messages: { role: 'user' | 'assistant'; text: string }[];
}

export interface MCPOptions {
	prompts_collection: string;
	allow_deletes?: boolean;
	system_prompt?: string | null;
}
