import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createProviderRegistry } from 'ai';
import { createAnthropicWithFileSupport } from './anthropic-file-support.js';
import type { AISettings, ProviderConfig } from './types.js';

type ProviderRegistry = ReturnType<typeof createProviderRegistry>;

/**
 * The OpenAI-compatible SDK appends `/chat/completions` (and similar paths)
 * itself. Users frequently paste the full OpenRouter/OpenAI completions URL,
 * which results in a double-pathed request that 404s. Strip the suffix and
 * any trailing slash so both conventions work.
 */
function normalizeOpenAICompatibleBaseUrl(baseUrl: string): string {
	return baseUrl
		.trim()
		.replace(/\/+(?:chat\/)?completions\/?$/, '')
		.replace(/\/+$/, '');
}

export function buildProviderConfigs(settings: AISettings): ProviderConfig[] {
	const configs: ProviderConfig[] = [];

	if (settings.openaiApiKey) {
		configs.push({
			type: 'openai',
			apiKey: settings.openaiApiKey,
		});
	}

	if (settings.anthropicApiKey) {
		configs.push({
			type: 'anthropic',
			apiKey: settings.anthropicApiKey,
		});
	}

	if (settings.googleApiKey) {
		configs.push({
			type: 'google',
			apiKey: settings.googleApiKey,
		});
	}

	if (settings.openaiCompatibleApiKey && settings.openaiCompatibleBaseUrl) {
		configs.push({
			type: 'openai-compatible',
			apiKey: settings.openaiCompatibleApiKey,
			baseUrl: settings.openaiCompatibleBaseUrl,
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
			case 'openai-compatible':
				if (config.baseUrl) {
					const customHeaders = Object.fromEntries(
						settings?.openaiCompatibleHeaders?.map(({ header, value }) => [header, value]) ?? [],
					);

					providers['openai-compatible'] = createOpenAICompatible({
						name: settings?.openaiCompatibleName ?? 'openai-compatible',
						apiKey: config.apiKey,
						baseURL: normalizeOpenAICompatibleBaseUrl(config.baseUrl),
						headers: customHeaders,
					});
				}

				break;
		}
	}

	return createProviderRegistry(providers);
}
