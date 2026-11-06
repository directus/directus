import type { ImageProviderType, ProviderType } from '@directus/ai';
import { ServiceUnavailableError } from '@directus/errors';
import { type ImageModel, type LanguageModel, wrapLanguageModel } from 'ai';
import { getDevToolsMiddleware } from '../devtools/index.js';
import { getProviderOptions } from './options.js';
import { buildProviderConfigs, createAIProviderRegistry } from './registry.js';
import type { AISettings } from './types.js';

export interface ResolvedLanguageModel {
	model: LanguageModel;
	providerOptions: ReturnType<typeof getProviderOptions>;
}

/** Does not check the allowed models list. Callers that need that check do it themselves. */
export function resolveLanguageModel(
	provider: ProviderType,
	model: string,
	settings: AISettings,
): ResolvedLanguageModel {
	const registry = createRegistryFor(provider, settings);
	let languageModel = registry.languageModel(`${provider}:${model}`);
	const devToolsMiddleware = getDevToolsMiddleware();

	if (devToolsMiddleware) {
		languageModel = wrapLanguageModel({ model: languageModel, middleware: devToolsMiddleware });
	}

	return {
		model: languageModel,
		providerOptions: getProviderOptions(provider, model, settings),
	};
}

export function resolveImageModel(provider: ImageProviderType, model: string, settings: AISettings): ImageModel {
	return createRegistryFor(provider, settings).imageModel(`${provider}:${model}`);
}

function createRegistryFor(provider: ProviderType, settings: AISettings) {
	const configs = buildProviderConfigs(settings);

	if (!configs.some((config) => config.type === provider)) {
		throw new ServiceUnavailableError({ service: provider, reason: 'No API key configured for AI provider' });
	}

	return createAIProviderRegistry(configs, settings);
}
