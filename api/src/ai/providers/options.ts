import { buildCustomModels, DEFAULT_AI_MODELS, type ModelDefinition, type ProviderType } from '@directus/ai';
import type { AISettings } from './types.js';

export function getModelDefinition(
	provider: ProviderType,
	model: string,
	settings: AISettings,
): ModelDefinition | undefined {
	const customModels = buildCustomModels(settings.ai_openai_compatible_models);

	return [...DEFAULT_AI_MODELS, ...customModels].find((m) => m.provider === provider && m.model === model);
}

const OPENAI_REASONING_OPTIONS = {
	openai: {
		reasoningSummary: 'auto',
		store: false,
		include: ['reasoning.encrypted_content'],
	},
};

export function getProviderOptions(provider: ProviderType, model: string, settings: AISettings) {
	const modelDef = getModelDefinition(provider, model, settings);

	if (provider === 'openai' && modelDef?.reasoning) {
		return OPENAI_REASONING_OPTIONS;
	}

	if (provider === 'openai-compatible') {
		const customModel = settings.ai_openai_compatible_models?.find((m) => m.id === model);

		if (customModel?.providerOptions) {
			const providerName = settings.ai_openai_compatible_name ?? 'openai-compatible';
			return { [providerName]: customModel.providerOptions };
		}
	}

	return {};
}
