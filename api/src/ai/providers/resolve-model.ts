import type { ImageProviderType, ProviderType } from '@directus/ai';
import { ServiceUnavailableError } from '@directus/errors';
import { type ImageModel, wrapLanguageModel } from 'ai';
import { validateModelAllowed } from '../chat/utils/validate-model-allowed.js';
import { getDevToolsMiddleware } from '../devtools/index.js';
import { getProviderOptions } from './options.js';
import { buildProviderConfigs, createAIProviderRegistry } from './registry.js';
import type { AISettings } from './types.js';

export interface ResolvedLanguageModel {
	model: ReturnType<typeof wrapLanguageModel>;
	providerOptions: ReturnType<typeof getProviderOptions>;
}

/** Throws when the model isn't in the admin's allowed list or the provider has no API key saved. */
export function resolveLanguageModel(
	provider: ProviderType,
	model: string,
	settings: AISettings,
): ResolvedLanguageModel {
	validateModelAllowed(provider, model, settings);

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
	const config = buildProviderConfigs(settings).find((config) => config.type === provider);

	if (!config) {
		throw new ServiceUnavailableError({ service: provider, reason: 'No API key configured for AI provider' });
	}

	return createAIProviderRegistry([config], settings);
}
