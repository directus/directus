export interface Prompt {
	name: string;
	system_prompt?: string | null;
	description?: string;
	messages: { role: 'user' | 'assistant'; text: string }[];
}

export interface MCPOptions {
	promptsCollection?: string;
	allowDeletes?: boolean;
	systemPromptEnabled?: boolean;
	systemPrompt?: string | null;
}
