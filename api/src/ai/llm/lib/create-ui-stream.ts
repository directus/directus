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

export interface CreateUiStreamOptions {
	provider: ProviderType;
	model: string;
	tools: { [x: string]: Tool };
	aiSettings: AISettings;
	systemPrompt?: string;
	onUsage?: (usage: Pick<LanguageModelUsage, 'inputTokens' | 'outputTokens' | 'totalTokens'>) => void | Promise<void>;
}

export const createUiStream = async (
	messages: UIMessage[],
	{ provider, model, tools, aiSettings, systemPrompt, onUsage }: CreateUiStreamOptions,
): Promise<StreamTextResult<Record<string, Tool<any, any>>, any>> => {
	const configs = buildProviderConfigs(aiSettings);
	const providerConfig = configs.find((c) => c.type === provider);

	if (!providerConfig) {
		throw new ServiceUnavailableError({ service: provider, reason: 'No API key configured for LLM provider' });
	}

	const registry = createAIProviderRegistry(configs, aiSettings);

	systemPrompt ||= SYSTEM_PROMPT;

	const providerOptions = getProviderOptions(provider, model, aiSettings);

	const stream = streamText({
		system: systemPrompt,
		model: registry.languageModel(`${provider}:${model}`),
		messages: await convertToModelMessages(messages),
		stopWhen: [stepCountIs(10)],
		providerOptions,
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
