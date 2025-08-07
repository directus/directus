import { z } from 'zod';
import { defineTool } from '../tool.js';
import prompts from './prompts/index.js';

export const system = defineTool({
	name: 'system-prompt',
	description: prompts.systemPromptDescription,
	inputSchema: z.object({}),
	async handler() {
		return {
			type: 'text',
			data: prompts.systemPrompt,
		};
	},
});
