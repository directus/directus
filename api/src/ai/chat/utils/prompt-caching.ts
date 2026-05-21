import type { ProviderType } from '@directus/ai';
import type { LanguageModelUsage, ProviderMetadata, SystemModelMessage, Tool } from 'ai';

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
