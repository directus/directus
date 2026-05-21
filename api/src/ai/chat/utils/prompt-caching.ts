import type { ProviderType } from '@directus/ai';
import type { LanguageModelUsage, ModelMessage, ProviderMetadata, SystemModelMessage, Tool } from 'ai';

export type PromptCachingUsage = Pick<LanguageModelUsage, 'inputTokens' | 'outputTokens' | 'totalTokens'> & {
	cacheReadTokens?: number;
	cacheCreationTokens?: number;
};

interface PromptCachingStepResult {
	providerMetadata?: ProviderMetadata;
}

interface PromptCachingFinishResult {
	usage: LanguageModelUsage;
	totalUsage?: LanguageModelUsage;
	providerMetadata?: ProviderMetadata;
	steps?: PromptCachingStepResult[];
}

export function buildCacheAwareSystemPrompt(provider: ProviderType, content: string): string | SystemModelMessage {
	if (provider !== 'anthropic') {
		return content;
	}

	return {
		role: 'system',
		content,
		providerOptions: {
			anthropic: {
				cacheControl: { type: 'ephemeral' },
			},
		},
	};
}

/**
 * For Anthropic, place a cache breakpoint on the last existing message so the conversation
 * prefix (tools + system + history) caches as it grows, and append the per-request page
 * context as a new user message after the breakpoint so it stays out of the cached prefix.
 *
 * Context is only appended after a real user turn. On multi-step continuations the last
 * message is an assistant or tool result; appending a user message there would make the
 * model respond to the context instead of synthesizing the tool output. The model still
 * sees context from the originating user turn earlier in the conversation.
 *
 * Other providers either auto-cache (Google/OpenAI) or don't support this, so we keep the
 * context inside the system prompt for them (handled upstream).
 */
export function applyAnthropicConversationCaching(
	provider: ProviderType,
	messages: ModelMessage[],
	contextBlock: string | null,
): ModelMessage[] {
	if (provider !== 'anthropic' || messages.length === 0) return messages;

	const lastIndex = messages.length - 1;

	const messagesWithCache = messages.map((message, index) =>
		index === lastIndex
			? {
					...message,
					providerOptions: {
						...message.providerOptions,
						anthropic: {
							...(message.providerOptions?.['anthropic'] as Record<string, unknown> | undefined),
							cacheControl: { type: 'ephemeral' },
						},
					},
				}
			: message,
	);

	if (!contextBlock || messages[lastIndex]?.role !== 'user') return messagesWithCache;

	return [
		...messagesWithCache,
		{
			role: 'user',
			content: contextBlock,
		},
	];
}

export function sortToolsByName<T extends Record<string, Tool>>(tools: T): T {
	return Object.fromEntries(
		Object.entries(tools).sort(([a], [b]) => {
			if (a < b) return -1;
			if (a > b) return 1;

			return 0;
		}),
	) as T;
}

export function formatUsageWithCacheTokens(result: PromptCachingFinishResult): PromptCachingUsage {
	const usage = result.totalUsage ?? result.usage;
	const providerMetadata = result.steps?.map((step) => step.providerMetadata) ?? [result.providerMetadata];
	const { inputTokens, outputTokens, totalTokens } = usage;

	return {
		inputTokens,
		outputTokens,
		totalTokens,
		...getCacheTokenUsage(usage, providerMetadata),
	};
}

function getCacheTokenUsage(
	usage: LanguageModelUsage,
	providerMetadata: Array<ProviderMetadata | undefined>,
): Pick<PromptCachingUsage, 'cacheReadTokens' | 'cacheCreationTokens'> {
	const cacheReadTokens =
		usage.inputTokenDetails?.cacheReadTokens ??
		usage.cachedInputTokens ??
		sumNumbers([
			...providerMetadata.map((metadata) => getProviderMetadataNumber(metadata, 'anthropic', 'cacheReadInputTokens')),
			...providerMetadata.map(getGoogleCachedContentTokenCount),
		]);

	const cacheCreationTokens =
		usage.inputTokenDetails?.cacheWriteTokens ??
		sumNumbers(
			providerMetadata.map((metadata) => getProviderMetadataNumber(metadata, 'anthropic', 'cacheCreationInputTokens')),
		);

	return {
		...(cacheReadTokens !== undefined ? { cacheReadTokens } : {}),
		...(cacheCreationTokens !== undefined ? { cacheCreationTokens } : {}),
	};
}

function getProviderMetadataNumber(
	providerMetadata: ProviderMetadata | undefined,
	providerName: string,
	fieldName: string,
): number | undefined {
	const value = providerMetadata?.[providerName]?.[fieldName];

	return typeof value === 'number' ? value : undefined;
}

function getGoogleCachedContentTokenCount(providerMetadata: ProviderMetadata | undefined): number | undefined {
	const usageMetadata = providerMetadata?.['google']?.['usageMetadata'];

	if (!usageMetadata || typeof usageMetadata !== 'object' || Array.isArray(usageMetadata)) {
		return undefined;
	}

	const cachedContentTokenCount = (usageMetadata as Record<string, unknown>)['cachedContentTokenCount'];

	return typeof cachedContentTokenCount === 'number' ? cachedContentTokenCount : undefined;
}

function sumNumbers(values: Array<number | undefined>): number | undefined {
	const definedValues = values.filter((value): value is number => typeof value === 'number');

	if (definedValues.length === 0) {
		return undefined;
	}

	return definedValues.reduce((sum, value) => sum + value, 0);
}
