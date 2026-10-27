export interface Prompt {
	name: string;
	system_prompt?: string | null;
	description?: string;
	messages: { role: 'user' | 'assistant'; text: string }[];
}

export interface MCPProject {
	name?: string | null;
	descriptor?: string | null;
	url?: string | null;
	/** Project icon as a PNG */
	icon?: Buffer;
}

export interface MCPOptions {
	project?: MCPProject;
	promptsCollection?: string;
	allowDeletes?: boolean;
	systemPromptEnabled?: boolean;
	systemPrompt?: string | null;
}
