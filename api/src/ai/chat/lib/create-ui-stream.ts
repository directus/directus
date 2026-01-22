import type { ProviderType } from '@directus/ai';
import { ServiceUnavailableError } from '@directus/errors';
import {
	convertToModelMessages,
	type LanguageModelUsage,
	stepCountIs,
	streamText,
	type StreamTextResult,
	type Tool,
	type UIMessage,
} from 'ai';
import {
	type AISettings,
	buildProviderConfigs,
	createAIProviderRegistry,
	getProviderOptions,
} from '../../providers/index.js';
import { SYSTEM_PROMPT } from '../constants/system-prompt.js';
import type { ChatContext } from '../models/chat-request.js';

export interface CreateUiStreamOptions {
	provider: ProviderType;
	model: string;
	tools: { [x: string]: Tool };
	aiSettings: AISettings;
	systemPrompt?: string;
	context?: ChatContext;
	onUsage?: (usage: Pick<LanguageModelUsage, 'inputTokens' | 'outputTokens' | 'totalTokens'>) => void | Promise<void>;
}

/**
 * Format context for appending to system prompt
 */
function formatContextForSystemPrompt(context: ChatContext): string {
	const sections: string[] = [];

	// Format page context
	if (context.page) {
		const page = context.page;
		const pageLines = [`Path: ${page.path}`];

		if (page.collection) pageLines.push(`Collection: ${page.collection}`);
		if (page.item !== undefined) pageLines.push(`Item: ${page.item}`);
		if (page.module) pageLines.push(`Module: ${page.module}`);

		sections.push(`## Current Page\n${pageLines.join('\n')}`);
	}

	// Format user-added context attachments
	if (context.attachments && context.attachments.length > 0) {
		const attachmentLines = context.attachments.map((att) => {
			if (att.type === 'visual-element') {
				const data = att.data as { collection?: string; item?: unknown };
				return `[Visual Element: ${att.display}] (collection: ${data.collection}, item: ${data.item})\n${JSON.stringify(att.snapshot, null, 2)}`;
			}

			if (att.type === 'item') {
				return `[Item: ${att.display}]\n${JSON.stringify(att.snapshot, null, 2)}`;
			}

			if (att.type === 'prompt') {
				const snapshot = att.snapshot as { text?: string };
				return `[Prompt: ${att.display}]\n${snapshot.text ?? ''}`;
			}

			return '';
		});

		sections.push(`## User-Added Context\n${attachmentLines.filter(Boolean).join('\n\n')}`);
	}

	if (sections.length === 0) return '';

	return `\n\n<user_context>\n${sections.join('\n\n')}\n</user_context>`;
}

export const createUiStream = async (
	messages: UIMessage[],
	{ provider, model, tools, aiSettings, systemPrompt, context, onUsage }: CreateUiStreamOptions,
): Promise<StreamTextResult<Record<string, Tool<any, any>>, any>> => {
	const configs = buildProviderConfigs(aiSettings);
	const providerConfig = configs.find((c) => c.type === provider);

	if (!providerConfig) {
		throw new ServiceUnavailableError({ service: provider, reason: 'No API key configured for LLM provider' });
	}

	const registry = createAIProviderRegistry(configs, aiSettings);

	const baseSystemPrompt = systemPrompt || SYSTEM_PROMPT;
	const providerOptions = getProviderOptions(provider, model, aiSettings);

	const stream = streamText({
		system: baseSystemPrompt,
		model: registry.languageModel(`${provider}:${model}`),
		messages: await convertToModelMessages(messages),
		stopWhen: [stepCountIs(10)],
		providerOptions,
		tools,
		prepareStep: () => {
			// Append context to system prompt on each step
			if (context) {
				const contextBlock = formatContextForSystemPrompt(context);
				return { system: baseSystemPrompt + contextBlock };
			}

			return {};
		},
		onFinish({ usage }) {
			if (onUsage) {
				const { inputTokens, outputTokens, totalTokens } = usage;
				onUsage({ inputTokens, outputTokens, totalTokens });
			}
		},
	});

	return stream as StreamTextResult<Record<string, Tool<any, any>>, any>;
};
