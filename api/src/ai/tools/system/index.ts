import { requireText } from '@/utils/require-text.js';
import { resolve } from 'node:path';
import { z } from 'zod';
import { defineTool } from '../define-tool.js';

const SystemPromptInputSchema = z.object({});

const SystemPromptValidateSchema = z.object({
	promptOverride: z.union([z.string(), z.null()]).optional(),
});

export const system = defineTool<z.infer<typeof SystemPromptValidateSchema>>({
	name: 'system-prompt',
	description: requireText(resolve(__dirname, './prompt-description.md')),
	annotations: {
		title: 'Directus - System Prompt',
	},
	inputSchema: SystemPromptInputSchema,
	validateSchema: SystemPromptValidateSchema,
	async handler({ args }) {
		return {
			type: 'text',
			data: args.promptOverride || requireText(resolve(__dirname, './prompt.md')),
		};
	},
});
