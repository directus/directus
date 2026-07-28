import type { ModelMessage } from 'ai';
import { describe, expect, test } from 'vitest';
import {
	applyAnthropicConversationCaching,
	buildCacheAwareSystemPrompt,
	formatUsageWithCacheTokens,
	sortToolsByName,
} from './prompt-caching.js';

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

describe('applyAnthropicConversationCaching', () => {
	const baseMessages: ModelMessage[] = [
		{ role: 'user', content: 'Hello' },
		{ role: 'assistant', content: 'Hi there!' },
		{ role: 'user', content: 'What now?' },
	];

	test('returns messages unchanged for non-Anthropic providers', () => {
		expect(applyAnthropicConversationCaching('openai', baseMessages, '<user_context>page</user_context>')).toEqual(
			baseMessages,
		);

		expect(applyAnthropicConversationCaching('google', baseMessages, null)).toEqual(baseMessages);
	});

	test('returns empty array when no messages', () => {
		expect(applyAnthropicConversationCaching('anthropic', [], 'ctx')).toEqual([]);
	});

	test('marks the last message cacheable when no context is present', () => {
		const result = applyAnthropicConversationCaching('anthropic', baseMessages, null);

		expect(result).toHaveLength(3);
		expect(result[0]).toEqual(baseMessages[0]);
		expect(result[1]).toEqual(baseMessages[1]);

		expect(result[2]).toEqual({
			role: 'user',
			content: 'What now?',
			providerOptions: {
				anthropic: { cacheControl: { type: 'ephemeral' } },
			},
		});
	});

	test('marks the last existing message cacheable and appends context as a trailing user message', () => {
		const result = applyAnthropicConversationCaching('anthropic', baseMessages, '<user_context>page</user_context>');

		expect(result).toHaveLength(4);

		expect(result[2]).toEqual({
			role: 'user',
			content: 'What now?',
			providerOptions: {
				anthropic: { cacheControl: { type: 'ephemeral' } },
			},
		});

		expect(result[3]).toEqual({
			role: 'user',
			content: '<user_context>page</user_context>',
		});
	});

	test('does not append context after a tool-result continuation', () => {
		const continuationMessages: ModelMessage[] = [
			{ role: 'user', content: 'Run the tool' },
			{
				role: 'assistant',
				content: [{ type: 'tool-call', toolCallId: 'tc-1', toolName: 'read-form-values', input: {} }],
			},
			{
				role: 'tool',
				content: [
					{
						type: 'tool-result',
						toolCallId: 'tc-1',
						toolName: 'read-form-values',
						output: { type: 'json', value: { ok: true } },
					},
				],
			},
		];

		const result = applyAnthropicConversationCaching(
			'anthropic',
			continuationMessages,
			'<user_context>page</user_context>',
		);

		expect(result).toHaveLength(3);
		expect(result.at(-1)?.role).toBe('tool');

		expect(result.at(-1)?.providerOptions).toEqual({
			anthropic: { cacheControl: { type: 'ephemeral' } },
		});
	});

	test('does not append context after an assistant turn', () => {
		const messages: ModelMessage[] = [
			{ role: 'user', content: 'Hello' },
			{ role: 'assistant', content: 'Hi there!' },
		];

		const result = applyAnthropicConversationCaching('anthropic', messages, '<user_context>page</user_context>');

		expect(result).toHaveLength(2);
		expect(result.at(-1)?.role).toBe('assistant');
	});

	test('preserves existing providerOptions when adding cacheControl', () => {
		const messages: ModelMessage[] = [
			{
				role: 'user',
				content: 'Hello',
				providerOptions: { anthropic: { existing: 'value' } as any, openai: { other: true } as any },
			},
		];

		const result = applyAnthropicConversationCaching('anthropic', messages, null);

		expect(result[0]?.providerOptions).toEqual({
			openai: { other: true },
			anthropic: {
				existing: 'value',
				cacheControl: { type: 'ephemeral' },
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
