import { resolve } from 'node:path';
import { z } from 'zod';
import { requireText } from '../../../utils/require-text.js';
import { defineTool } from '../define-tool.js';

const SystemPromptInputSchema = z.object({});

const SystemPromptValidateSchema = z.object({
	promptOverride: z.union([z.string(), z.null()]).optional(),
});

export const system = defineTool<z.infer<typeof SystemPromptValidateSchema>>({
	name: 'system-prompt',
	description: "Returns the AI usage guidance configured by this project's administrator, if any.",
	keywords: ['instructions', 'role', 'assistant prompt', 'system instructions'],
	annotations: {
		title: 'Directus - System Prompt',
	},
	inputSchema: SystemPromptInputSchema,
	validateSchema: SystemPromptValidateSchema,
	readOnly: true,
	async handler({ args }) {
		return {
			type: 'text',
			data: args.promptOverride || requireText(resolve(import.meta.dirname, './prompt.md')),
		};
	},
});
