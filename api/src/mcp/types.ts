import type { Accountability, Query, SchemaOverview } from '@directus/types';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodType } from 'zod';

export type ToolResultBase = {
	type?: 'text' | 'image' | 'audio';
	url?: string | undefined;
};

export type TextToolResult = ToolResultBase & {
	type: 'text';
	data: unknown;
};

export type AssetToolResult = ToolResultBase & {
	type: 'image' | 'audio';
	data: string;
	mimeType: string;
};

export type ToolResult = TextToolResult | AssetToolResult;

export type ToolHandler<T> = {
	(options: {
		args: T;
		sanitizedQuery: Query;
		schema: SchemaOverview;
		accountability: Accountability | undefined;
	}): Promise<ToolResult | undefined>;
};

export type ToolEndpoint<T> = {
	(options: { input: T; data: unknown }): string[] | undefined;
};

export interface ToolConfig<T> {
	name: string;
	description: string;
	endpoint?: ToolEndpoint<T>;
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
	promptsCollection?: string;
	allowDeletes?: boolean;
	allowSystemCollections?: boolean;
	systemPromptEnabled?: boolean;
	systemPrompt?: string | null;
}
