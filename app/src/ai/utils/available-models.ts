import type { ProviderType, StandardProviderType } from '@directus/ai';
import type { Settings } from '@directus/types';
import { AI_MODELS, type AppModelDefinition, buildCustomModelDefinition, buildCustomModels } from '../models';

export type AIModelSettings = Pick<
	Settings,
	| 'ai_openai_api_key'
	| 'ai_anthropic_api_key'
	| 'ai_google_api_key'
	| 'ai_openai_compatible_api_key'
	| 'ai_openai_compatible_base_url'
	| 'ai_openai_compatible_models'
	| 'ai_openai_allowed_models'
	| 'ai_anthropic_allowed_models'
	| 'ai_google_allowed_models'
>;

export function getAvailableAiProviders(settings: AIModelSettings | null | undefined): ProviderType[] {
	const providers: ProviderType[] = [];

	if (settings?.ai_openai_api_key) {
		providers.push('openai');
	}

	if (settings?.ai_anthropic_api_key) {
		providers.push('anthropic');
	}

	if (settings?.ai_google_api_key) {
		providers.push('google');
	}

	if (settings?.ai_openai_compatible_api_key && settings?.ai_openai_compatible_base_url) {
		providers.push('openai-compatible');
	}

	return providers;
}

export function getAvailableModels(settings: AIModelSettings | null | undefined): AppModelDefinition[] {
	const availableProviders = getAvailableAiProviders(settings);
	const customModels = buildCustomModels(settings?.ai_openai_compatible_models ?? null);
	const allModels = [...AI_MODELS, ...customModels];

	const allowedModelsMap: Record<StandardProviderType, string[] | null> = {
		openai: settings?.ai_openai_allowed_models ?? null,
		anthropic: settings?.ai_anthropic_allowed_models ?? null,
		google: settings?.ai_google_allowed_models ?? null,
	};

	const result: AppModelDefinition[] = [];

	for (const modelDefinition of allModels) {
		if (!availableProviders.includes(modelDefinition.provider)) continue;

		if (modelDefinition.provider === 'openai-compatible') {
			result.push(modelDefinition);
			continue;
		}

		const allowedModels = allowedModelsMap[modelDefinition.provider];

		if (!allowedModels || allowedModels.length === 0) continue;

		if (allowedModels.includes(modelDefinition.model)) {
			result.push(modelDefinition);
		}
	}

	const resultKeys = new Set(result.map((m) => getModelKey(m)));

	for (const [provider, allowedModels] of Object.entries(allowedModelsMap)) {
		if (!allowedModels || allowedModels.length === 0) continue;
		if (!availableProviders.includes(provider as StandardProviderType)) continue;

		for (const modelId of allowedModels) {
			const key = `${provider}:${modelId}`;

			if (!resultKeys.has(key)) {
				result.push(buildCustomModelDefinition(provider as StandardProviderType, modelId));
				resultKeys.add(key);
			}
		}
	}

	return result;
}

export function getModelKey(modelDefinition: { provider: string; model: string }): string {
	return `${modelDefinition.provider}:${modelDefinition.model}`;
}

export function resolveModelByKey<T extends { provider: string; model: string }>(
	modelKey: string | null | undefined,
	models: readonly T[],
): T | null {
	if (!modelKey) return null;

	const colonIndex = modelKey.indexOf(':');

	if (colonIndex === -1) return null;

	const provider = modelKey.slice(0, colonIndex);
	const model = modelKey.slice(colonIndex + 1);

	if (!provider || !model) return null;

	return (
		models.find((modelDefinition) => modelDefinition.provider === provider && modelDefinition.model === model) ?? null
	);
}

export function getProviderIcon(provider: ProviderType): string {
	switch (provider) {
		case 'openai':
			return 'logo_openai';
		case 'anthropic':
			return 'logo_anthropic';
		case 'google':
			return 'logo_google';
		case 'openai-compatible':
			return 'logo_custom_provider';
	}
}
