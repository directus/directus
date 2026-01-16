import {
	convertToModelMessages,
	type LanguageModelUsage,
	stepCountIs,
	streamText,
	type StreamTextResult,
	type Tool,
	type UIMessage,
} from 'ai';
import { SYSTEM_PROMPT } from '../constants/system-prompt.js';
import type { ProviderOptions } from '../types/model-options.js';
import { getVercelModelProvider } from '../utils/get-vercel-model-provider.js';

export interface CreateUiStreamOptions {
	tools: { [x: string]: Tool };
	systemPrompt?: string;
	onUsage?: (usage: Pick<LanguageModelUsage, 'inputTokens' | 'outputTokens' | 'totalTokens'>) => void | Promise<void>;
}

export const createUiStream = (
	messages: UIMessage[],
	{ provider, model, tools, apiKeys, systemPrompt, onUsage }: ProviderOptions & CreateUiStreamOptions,
): StreamTextResult<Record<string, Tool<any, any>>, any> => {
	const modelProvider = getVercelModelProvider(provider, apiKeys);

	systemPrompt ||= SYSTEM_PROMPT;

	const stream = streamText({
		system: systemPrompt,
		model: modelProvider(model),
		messages: convertToModelMessages(messages),
		stopWhen: [stepCountIs(10)],
		providerOptions: {
			openai: {
				reasoningSummary: 'auto',
				store: false,
				include: ['reasoning.encrypted_content'],
			},
		},
		tools,
		onFinish({ usage }) {
			if (onUsage) {
				const { inputTokens, outputTokens, totalTokens } = usage;
				onUsage({ inputTokens, outputTokens, totalTokens });
			}
		},
	});

	return stream as StreamTextResult<Record<string, Tool<any, any>>, any>;
};
