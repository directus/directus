import type { ProviderType } from '@directus/ai';
import { ServiceUnavailableError } from '@directus/errors';
import { wrapLanguageModel } from 'ai';
import { getDevToolsMiddleware } from '../devtools/index.js';
import { getProviderOptions } from './options.js';
import { buildProviderConfigs, createAIProviderRegistry } from './registry.js';
import type { AISettings } from './types.js';
import { validateModelAllowed } from './validate-model-allowed.js';

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

	const config = buildProviderConfigs(settings).find((config) => config.type === provider);

	if (!config) {
		throw new ServiceUnavailableError({ service: provider, reason: 'No API key configured for LLM provider' });
	}

	const registry = createAIProviderRegistry([config], settings);
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
