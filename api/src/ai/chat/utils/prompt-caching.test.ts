import { describe, expect, test } from 'vitest';
import { buildCacheAwareSystemPrompt, formatUsageWithCacheTokens, sortToolsByName } from './prompt-caching.js';

describe('buildCacheAwareSystemPrompt', () => {
	test('returns plain system text for providers with automatic caching', () => {
		expect(buildCacheAwareSystemPrompt('openai', 'SYSTEM_PROMPT')).toBe('SYSTEM_PROMPT');
		expect(buildCacheAwareSystemPrompt('google', 'SYSTEM_PROMPT')).toBe('SYSTEM_PROMPT');
	});

	test('adds Anthropic cache control to the system prompt', () => {
		expect(buildCacheAwareSystemPrompt('anthropic', 'SYSTEM_PROMPT')).toEqual({
			role: 'system',
			content: 'SYSTEM_PROMPT',
			providerOptions: {
				anthropic: {
					cacheControl: { type: 'ephemeral' },
				},
			},
		});
	});
});

describe('sortToolsByName', () => {
	test('sorts tools deterministically by key', () => {
		const result = sortToolsByName({
			zeta: { description: 'Zeta tool', inputSchema: {} } as any,
			alpha: { description: 'Alpha tool', inputSchema: {} } as any,
			beta: { description: 'Beta tool', inputSchema: {} } as any,
		});

		expect(Object.keys(result)).toEqual(['alpha', 'beta', 'zeta']);
	});
});

describe('formatUsageWithCacheTokens', () => {
	test('uses AI SDK totalUsage cache token details when available', () => {
		const result = formatUsageWithCacheTokens({
			usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 } as any,
			totalUsage: {
				inputTokens: 300,
				outputTokens: 150,
				totalTokens: 450,
				inputTokenDetails: {
					cacheReadTokens: 200,
					cacheWriteTokens: 100,
				},
			} as any,
		});

		expect(result).toEqual({
			inputTokens: 300,
			outputTokens: 150,
			totalTokens: 450,
			cacheReadTokens: 200,
			cacheCreationTokens: 100,
		});
	});

	test('falls back to Anthropic provider metadata cache token counts', () => {
		const result = formatUsageWithCacheTokens({
			usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 } as any,
			providerMetadata: {
				anthropic: {
					cacheReadInputTokens: 75,
					cacheCreationInputTokens: 25,
				},
			},
		});

		expect(result).toEqual({
			inputTokens: 100,
			outputTokens: 50,
			totalTokens: 150,
			cacheReadTokens: 75,
			cacheCreationTokens: 25,
		});
	});

	test('falls back to Google cached content token metadata', () => {
		const result = formatUsageWithCacheTokens({
			usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 } as any,
			providerMetadata: {
				google: {
					usageMetadata: {
						cachedContentTokenCount: 80,
					},
				},
			},
		});

		expect(result).toEqual({
			inputTokens: 100,
			outputTokens: 50,
			totalTokens: 150,
			cacheReadTokens: 80,
		});
	});
});
