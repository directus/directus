export interface MCPPrompt {
	id: string;
	name: string;
	description?: string;
	status: string;
	system_prompt?: string | null;
	messages: { role: 'user' | 'assistant'; text: string }[];
}
