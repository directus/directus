import { ref, watch } from 'vue';
import { z } from 'zod';
import { useAiStore } from '../stores/use-ai';
import { defineTool } from './define-tool';

const questionSchema = z.object({
	id: z.string().describe('Unique key for this question, e.g. "auth_method"'),
	question: z.string().describe('The question text to display'),
	options: z
		.array(
			z.object({
				label: z.string().describe('Short option label'),
				description: z.string().describe('Longer explanation').optional(),
			}),
		)
		.max(4)
		.optional(),
	multi_select: z.boolean().default(false).describe('Allow multiple selections (default false)'),
	allow_text: z.boolean().default(true).describe('Allow free-text input (default true)'),
});

const inputSchema = z.object({
	questions: z.array(questionSchema).min(1),
});

export type AskUserInput = z.infer<typeof inputSchema>;
export type AskUserQuestion = z.infer<typeof questionSchema>;

interface PendingAskUser {
	input: AskUserInput;
	resolve: (value: Record<string, unknown>) => void;
}

export const pendingAskUser = ref<PendingAskUser | null>(null);

function resolvePending(value: Record<string, unknown>): void {
	if (!pendingAskUser.value) return;
	pendingAskUser.value.resolve(value);
	pendingAskUser.value = null;
}

export function cancelPending(): void {
	resolvePending({ _cancelled: true });
}

export function submitAnswers(answers: Record<string, unknown>): void {
	resolvePending(answers);
}

export function useAskUserTool() {
	const aiStore = useAiStore();

	// Cancel any pending ask_user when the conversation is reset
	watch(
		() => aiStore.messages.length,
		(length) => {
			if (length === 0) cancelPending();
		},
	);

	defineTool({
		name: 'ask_user',
		displayName: 'Ask User',
		description:
			'Ask the user one or more questions and wait for their answers. Use to confirm choices, get preferences, or clarify requirements. Each question can have up to 4 predefined options, but prefer fewer when possible — only include options that are meaningfully different. Do not overuse — only ask when the answer meaningfully affects your next steps.',
		inputSchema,
		execute: (args) => {
			cancelPending();

			return new Promise<Record<string, unknown>>((resolve) => {
				pendingAskUser.value = { input: args, resolve };
			});
		},
	});
}
