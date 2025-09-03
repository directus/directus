import { z } from 'zod';
import { defineTool } from '../define.js';
import prompts from './prompts/index.js';

const SystemPromptInputSchema = z.object({});

const SystemPromptValidateSchema = z.object({
	promptOverride: z.union([z.string(), z.null()]).optional(),
});

export const system = defineTool<z.infer<typeof SystemPromptValidateSchema>>({
	name: 'directus-system-prompt',
	title: 'Directus - System Prompt',
	description: prompts.systemPromptDescription,
	inputSchema: SystemPromptInputSchema,
	validateSchema: SystemPromptValidateSchema,
	async handler({ args }) {
		return {
			type: 'text',
			data: args.promptOverride || prompts.systemPrompt,
		};
	},
});
