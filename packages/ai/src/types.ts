export type ProviderType = 'openai' | 'anthropic' | 'google' | 'openai-compatible';

export type StandardProviderType = Exclude<ProviderType, 'openai-compatible'>;

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export type ToolApprovalMode = 'always' | 'ask' | 'disabled';

export type SystemTool =
	| 'items'
	| 'files'
	| 'folders'
	| 'assets'
	| 'flows'
	| 'trigger-flow'
	| 'operations'
	| 'schema'
	| 'collections'
	| 'fields'
	| 'relations';

export interface OpenAICompatibleModel {
	id: string;
	name: string;
	context?: number;
	output?: number;
	attachment?: boolean;
	reasoning?: boolean;
	providerOptions?: { [key: string]: JSONValue };
}

export interface OpenAICompatibleHeader {
	header: string;
	value: string;
}

export interface ModelDefinition {
	provider: ProviderType;
	model: string;
	name: string;
	limit: {
		context: number;
		output: number;
	};
	cost: {
		input: number;
		output: number;
	};
	/** Supports file attachments */
	attachment: boolean;
	/** Supports reasoning / chain-of-thought */
	reasoning: boolean;
}

export type PrimaryKey = string | number;

export interface ItemContextData {
	collection: string;
	id: PrimaryKey;
}

export interface VisualElementContextData {
	key: string;
	collection: string;
	item: PrimaryKey;
	fields?: string[];
	rect?: { top: number; left: number; width: number; height: number };
}

export interface PromptContextData {
	text: string;
	prompt: Record<string, unknown>;
	values: Record<string, string>;
}

export type ContextAttachment =
	| { type: 'item'; data: ItemContextData; display: string; snapshot: Record<string, unknown> }
	| { type: 'visual-element'; data: VisualElementContextData; display: string; snapshot: Record<string, unknown> }
	| { type: 'prompt'; data: PromptContextData; display: string; snapshot: Record<string, unknown> };
