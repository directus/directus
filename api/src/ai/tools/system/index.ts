import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { requireText } from '../../../utils/require-text.js';
import { defineTool } from '../define-tool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SystemPromptInputSchema = z.object({});

const SystemPromptValidateSchema = z.object({
	promptOverride: z.union([z.string(), z.null()]).optional(),
});

export const system = defineTool<z.infer<typeof SystemPromptValidateSchema>>({
	name: 'system-prompt',
	description:
		'Returns the Directus Assistant system instructions. Use first to load role, behavior, and tool guidance.',
	instructions: requireText(resolve(__dirname, './prompt.md')),
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
			data: args.promptOverride || requireText(resolve(__dirname, './prompt.md')),
		};
	},
});
