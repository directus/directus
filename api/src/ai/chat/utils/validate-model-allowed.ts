import { getAllowedModels, type ProviderType } from '@directus/ai';
import { ForbiddenError } from '@directus/errors';
import type { AISettings } from '../../providers/types.js';

/** OpenAI-compatible endpoints aren't limited to a saved model list, so they skip the check. */
export function validateModelAllowed(provider: ProviderType, model: string, aiSettings: AISettings): void {
	if (provider === 'openai-compatible') return;

	if (!getAllowedModels(aiSettings)[provider].includes(model)) {
		throw new ForbiddenError({ reason: 'Model not allowed for this provider' });
	}
}
