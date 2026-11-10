import type { ProviderType } from '@directus/ai';
import { ForbiddenError } from '@directus/errors';
import type { AISettings } from '../../providers/index.js';

/** OpenAI-compatible endpoints aren't limited to a saved model list, so they skip the check. */
export function validateModelAllowed(provider: ProviderType, model: string, aiSettings: AISettings): void {
	if (provider === 'openai-compatible') return;

	if (!aiSettings.allowedModels[provider].includes(model)) {
		throw new ForbiddenError({ reason: 'Model not allowed for this provider' });
	}
}
