import { ref, watch } from 'vue';
import { z } from 'zod';
import { useAiStore } from '../stores/use-ai';
import { defineTool } from './define-tool';

const questionSchema = z.object({
	id: z.string().min(1).describe('Unique key for this question, e.g. "auth_method". Each id must be unique.'),
	question: z.string().min(1).describe('The question text to display'),
	options: z
		.array(
			z.object({
				label: z.string().min(1).describe('Short option label'),
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
export type AskUserAnswers = Record<string, string | string[]>;

interface PendingAskUser {
	input: AskUserInput;
	resolve: (value: AskUserAnswers) => void;
}

export const pendingAskUser = ref<PendingAskUser | null>(null);

function resolvePending(value: AskUserAnswers): void {
	if (!pendingAskUser.value) return;
	pendingAskUser.value.resolve(value);
	pendingAskUser.value = null;
}

export function cancelPending(): void {
	resolvePending({ _cancelled: 'true' });
}

export function submitAnswers(answers: AskUserAnswers): void {
	resolvePending(answers);
}

export function useAskUserTool() {
	const aiStore = useAiStore();

	// Cancel pending when conversation is reset
	watch(
		() => aiStore.messages.length,
		(length) => {
			if (length === 0) cancelPending();
		},
	);

	// Cancel pending when chat is stopped mid-stream
	watch(
		() => aiStore.status,
		(newStatus, oldStatus) => {
			if (
				pendingAskUser.value &&
				(oldStatus === 'streaming' || oldStatus === 'submitted') &&
				newStatus !== 'streaming' &&
				newStatus !== 'submitted'
			) {
				cancelPending();
			}
		},
	);

	defineTool({
		name: 'ask_user',
		displayName: 'Ask User',
		description:
			'Ask the user one or more questions and wait for their answers. Use to confirm choices, get preferences, or clarify requirements. Each question must have options or allow_text (or both). Question ids must be unique. Each question can have up to 4 predefined options, but prefer fewer when possible — only include options that are meaningfully different. Do not overuse — only ask when the answer meaningfully affects your next steps. Output is keyed by question id; missing keys mean skipped. If _cancelled is present, the interaction was interrupted and no answers were collected.',
		inputSchema,
		execute: (args) => {
			cancelPending();

			return new Promise<AskUserAnswers>((resolve) => {
				pendingAskUser.value = { input: args, resolve };
			});
		},
	});
}
