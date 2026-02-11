import { ref } from 'vue';
import { z } from 'zod';
import { defineTool } from './define-tool';

const questionSchema = z.object({
	id: z.string().describe('Unique key for this question, e.g. "auth_method"'),
	question: z.string().describe('The question text to display'),
	options: z
		.array(
			z.object({
				label: z.string().describe('Short option label'),
				description: z.optional(z.string().describe('Longer explanation')),
			}),
		)
		.max(4)
		.optional(),
	multi_select: z.boolean().optional().describe('Allow multiple selections (default false)'),
	allow_text: z.boolean().optional().describe('Allow free-text input (default true)'),
});

const inputSchema = z.object({
	questions: z.array(questionSchema),
});

export type AskUserInput = z.infer<typeof inputSchema>;
export type AskUserQuestion = z.infer<typeof questionSchema>;

interface PendingAskUser {
	input: AskUserInput;
	resolve: (value: Record<string, unknown>) => void;
}

/** Current pending ask_user tool call waiting for user response */
export const pendingAskUser = ref<PendingAskUser | null>(null);

export function submitAnswers(answers: Record<string, unknown>) {
	if (pendingAskUser.value) {
		pendingAskUser.value.resolve(answers);
		pendingAskUser.value = null;
	}
}

export function useAskUserTool() {
	defineTool({
		name: 'ask_user',
		displayName: 'Ask User',
		description:
			'Ask the user one or more questions and wait for their answers. Use to confirm choices, get preferences, or clarify requirements. Each question can have up to 4 predefined options, but prefer fewer when possible — only include options that are meaningfully different. Do not overuse — only ask when the answer meaningfully affects your next steps.',
		inputSchema,
		execute: (args) => {
			return new Promise<Record<string, unknown>>((resolve) => {
				pendingAskUser.value = { input: args, resolve };
			});
		},
	});
}
