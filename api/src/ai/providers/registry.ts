import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createProviderRegistry } from 'ai';
import { createAnthropicWithFileSupport } from './anthropic-file-support.js';
import type { AISettings, ProviderConfig } from './types.js';

type ProviderRegistry = ReturnType<typeof createProviderRegistry>;

/** The subset of AI settings required to determine which providers are configured. */
export type ProviderCredentials = Partial<
	Pick<
		AISettings,
		| 'ai_openai_api_key'
		| 'ai_anthropic_api_key'
		| 'ai_google_api_key'
		| 'ai_openrouter_api_key'
		| 'ai_openai_compatible_api_key'
		| 'ai_openai_compatible_base_url'
	>
>;

export function buildProviderConfigs(settings: ProviderCredentials): ProviderConfig[] {
	const configs: ProviderConfig[] = [];

	if (settings.ai_openai_api_key) {
		configs.push({
			type: 'openai',
			apiKey: settings.ai_openai_api_key,
		});
	}

	if (settings.ai_anthropic_api_key) {
		configs.push({
			type: 'anthropic',
			apiKey: settings.ai_anthropic_api_key,
		});
	}

	if (settings.ai_google_api_key) {
		configs.push({
			type: 'google',
			apiKey: settings.ai_google_api_key,
		});
	}

	if (settings.ai_openrouter_api_key) {
		configs.push({
			type: 'openrouter',
			apiKey: settings.ai_openrouter_api_key,
		});
	}

	// The API key is optional for OpenAI-compatible servers, e.g. a local Ollama or LM Studio
	if (settings.ai_openai_compatible_base_url) {
		configs.push({
			type: 'openai-compatible',
			apiKey: settings.ai_openai_compatible_api_key || undefined,
			baseUrl: settings.ai_openai_compatible_base_url,
		});
	}

	return configs;
}

export function createAIProviderRegistry(configs: ProviderConfig[], settings?: AISettings): ProviderRegistry {
	const providers: Parameters<typeof createProviderRegistry>[0] = {};

	for (const config of configs) {
		switch (config.type) {
			case 'openai':
				providers['openai'] = createOpenAI({ apiKey: config.apiKey });
				break;
			case 'anthropic':
				providers['anthropic'] = createAnthropicWithFileSupport(config.apiKey);
				break;
			case 'google':
				providers['google'] = createGoogleGenerativeAI({ apiKey: config.apiKey });
				break;
			case 'openrouter':
				providers['openrouter'] = createOpenRouter({
					apiKey: config.apiKey,
					appName: 'Directus',
					appUrl: 'https://directus.com',
				});

				break;
			case 'openai-compatible':
				if (config.baseUrl) {
					const customHeaders = Object.fromEntries(
						settings?.ai_openai_compatible_headers?.map(({ header, value }) => [header, value]) ?? [],
					);

					providers['openai-compatible'] = createOpenAICompatible({
						name: settings?.ai_openai_compatible_name ?? 'openai-compatible',
						apiKey: config.apiKey,
						baseURL: config.baseUrl,
						headers: customHeaders,
					});
				}

				break;
		}
	}

	return createProviderRegistry(providers);
}
