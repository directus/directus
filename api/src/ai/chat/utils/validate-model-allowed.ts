import type { ProviderType, StandardProviderType } from '@directus/ai';
import { ForbiddenError } from '@directus/errors';
import type { AISettings } from '../../providers/index.js';

/**
 * Standard providers only allow models in their saved list, and an empty list allows none.
 * OpenAI-compatible providers skip the check.
 */
export function validateModelAllowed(provider: ProviderType, model: string, aiSettings: AISettings): void {
	if (provider === 'openai-compatible') return;

	const allowedModelsMap: Record<StandardProviderType, string[] | null> = {
		openai: aiSettings.openaiAllowedModels,
		anthropic: aiSettings.anthropicAllowedModels,
		google: aiSettings.googleAllowedModels,
		openrouter: aiSettings.openrouterModels?.map((model) => model.id) ?? null,
	};

	const allowedModels = allowedModelsMap[provider];

	if (!allowedModels || allowedModels.length === 0 || !allowedModels.includes(model)) {
		throw new ForbiddenError({ reason: 'Model not allowed for this provider' });
	}
}
