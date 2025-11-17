import { createAnthropic, type AnthropicProvider } from '@ai-sdk/anthropic';
import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai';
import { ServiceUnavailableError } from '@directus/errors';
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type LanguageModelUsage,
	type Tool,
	type UIMessage,
} from 'ai';

export interface CreateUiStreamOptions {
	provider: 'openai' | 'anthropic';
	model: string;
	tools: { [x: string]: Tool };
	apiKeys: {
		openai: string | null;
		anthropic: string | null;
	};
	systemPrompt?: string;
	onUsage?: (usage: Pick<LanguageModelUsage, 'inputTokens' | 'outputTokens' | 'totalTokens'>) => void | Promise<void>;
}

export const createUiStream = (
	messages: UIMessage[],
	{ provider, model, tools, apiKeys, systemPrompt, onUsage }: CreateUiStreamOptions,
) => {
	if (apiKeys[provider] === null) {
		throw new ServiceUnavailableError({ service: provider, reason: 'No API key configured for LLM provider' });
	}

	let modelProvider: OpenAIProvider | AnthropicProvider;

	if (provider === 'openai') {
		modelProvider = createOpenAI({ apiKey: apiKeys.openai! });
	} else if (provider === 'anthropic') {
		modelProvider = createAnthropic({ apiKey: apiKeys.anthropic! });
	} else {
		throw new Error(`Unexpected provider given: "${provider}"`);
	}

	const optionalStreamingParameters: { system?: string } = {};

	if (systemPrompt) {
		optionalStreamingParameters.system = systemPrompt;
	}

	const stream = streamText({
		...optionalStreamingParameters,
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

	return stream;
};
