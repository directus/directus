import { anthropic } from '@ai-sdk/anthropic';
import type { ProviderType } from '@directus/ai';
import type { Tool } from 'ai';

/**
 * For supported Anthropic models, enables tool search to reduce token usage.
 * All tools are marked as deferred so they're only loaded when Claude needs them.
 * Tool search is not supported on Haiku models.
 */
export function applyAnthropicToolSearch(
	provider: ProviderType,
	model: string,
	tools: { [x: string]: Tool },
): { [x: string]: Tool } {
	if (provider !== 'anthropic' || model.includes('haiku') || Object.keys(tools).length === 0) {
		return tools;
	}

	const deferredTools: { [x: string]: Tool } = {};

	for (const [name, t] of Object.entries(tools)) {
		deferredTools[name] = {
			...t,
			providerOptions: {
				...t.providerOptions,
				anthropic: { ...(t.providerOptions?.['anthropic'] as Record<string, unknown>), deferLoading: true },
			},
		};
	}

	return {
		...deferredTools,
		toolSearch: anthropic.tools.toolSearchBm25_20251119() as Tool,
	};
}
