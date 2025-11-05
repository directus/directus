import { createAnthropic, type AnthropicProvider } from '@ai-sdk/anthropic';
import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai';
import { ServiceUnavailableError } from '@directus/errors';
import { convertToModelMessages, streamText, type UIMessage, type Tool } from 'ai';

export interface CreateUiStreamOptions {
	provider: 'openai' | 'anthropic';
	model: string;
	tools: { [x: string]: Tool };
	apiKeys: {
		openai: string | null;
		anthropic: string | null;
	};
	systemPrompt?: string;
}

export const createUiStream = (
	messages: UIMessage[],
	{ provider, model, tools, apiKeys, systemPrompt }: CreateUiStreamOptions,
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

	return streamText({
		model: modelProvider(model),
		messages: convertToModelMessages(messages),
		tools,
		system: systemPrompt || '',
	});
};
