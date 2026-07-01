import type { Accountability, SchemaOverview } from '@directus/types';
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
		schema: SchemaOverview;
		accountability: Accountability | undefined;
	}): Promise<ToolResult | undefined>;
};

export type ToolEndpoint<T> = {
	(options: { input: T; data: unknown }): string[] | undefined;
};

export type ToolExposure = 'root' | 'search';

export type ToolReadOnly<T> = boolean | ((input: T) => boolean);

export interface ToolConfig<Input, Output = unknown> {
	name: string;
	description: string;
	keywords?: string[];
	instructions?: string;
	endpoint?: ToolEndpoint<Input>;
	admin?: boolean;
	inputSchema: ZodType<any>;
	validateSchema?: ZodType<Input>;
	output?: ZodType<Output>;
	readOnly?: ToolReadOnly<Input>;
	exposure?: ToolExposure;
	annotations?: ToolAnnotations;
	handler: ToolHandler<Input>;
}
