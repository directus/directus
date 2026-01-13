export type ProviderType = 'openai' | 'anthropic' | 'google' | 'openai-compatible';

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
