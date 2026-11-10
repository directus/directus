import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, type ModelMessage } from 'ai';
import { describe, expect, test, vi } from 'vitest';
import {
	applyAnthropicConversationCaching,
	buildCacheAwareSystemPrompt,
	formatUsageWithCacheTokens,
	getOpenRouterAutomaticCacheOptions,
	sortToolsByName,
	usesAnthropicCaching,
} from './prompt-caching.js';

describe('usesAnthropicCaching', () => {
	test('is true for direct Anthropic and Anthropic models through OpenRouter', () => {
		expect(usesAnthropicCaching('anthropic', 'claude-sonnet-4-6')).toBe(true);
		expect(usesAnthropicCaching('openrouter', 'anthropic/claude-sonnet-5.5')).toBe(true);
		expect(usesAnthropicCaching('openrouter', '~anthropic/claude-sonnet-latest')).toBe(true);
	});

	test('is false for other providers and non-Anthropic OpenRouter models', () => {
		expect(usesAnthropicCaching('openrouter', 'openai/gpt-5.5')).toBe(false);
		expect(usesAnthropicCaching('openai', 'gpt-5')).toBe(false);
		expect(usesAnthropicCaching('google', 'gemini-2.5-pro')).toBe(false);
		expect(usesAnthropicCaching('openai-compatible', 'anthropic/claude-sonnet-5.5')).toBe(false);
	});
});

describe('buildCacheAwareSystemPrompt', () => {
	test('returns plain system text for providers with automatic caching', () => {
		expect(buildCacheAwareSystemPrompt('openai', 'gpt-5', 'SYSTEM_PROMPT')).toBe('SYSTEM_PROMPT');
		expect(buildCacheAwareSystemPrompt('google', 'gemini-2.5-pro', 'SYSTEM_PROMPT')).toBe('SYSTEM_PROMPT');
	});

	test('adds Anthropic cache control to the system prompt', () => {
		expect(buildCacheAwareSystemPrompt('anthropic', 'claude-sonnet-4-6', 'SYSTEM_PROMPT')).toEqual({
			role: 'system',
			content: 'SYSTEM_PROMPT',
			providerOptions: {
				anthropic: {
					cacheControl: { type: 'ephemeral' },
				},
			},
		});
	});

	test('adds cache control for Anthropic models through OpenRouter', () => {
		expect(buildCacheAwareSystemPrompt('openrouter', 'anthropic/claude-sonnet-5.5', 'SYSTEM_PROMPT')).toEqual({
			role: 'system',
			content: 'SYSTEM_PROMPT',
			providerOptions: {
				anthropic: {
					cacheControl: { type: 'ephemeral' },
				},
			},
		});
	});

	test('returns plain system text for non-Anthropic models through OpenRouter', () => {
		expect(buildCacheAwareSystemPrompt('openrouter', 'openai/gpt-5.5', 'SYSTEM_PROMPT')).toBe('SYSTEM_PROMPT');
	});
});

describe('applyAnthropicConversationCaching', () => {
	const baseMessages: ModelMessage[] = [
		{ role: 'user', content: 'Hello' },
		{ role: 'assistant', content: 'Hi there!' },
		{ role: 'user', content: 'What now?' },
	];

	test('returns messages unchanged for non-Anthropic providers', () => {
		expect(
			applyAnthropicConversationCaching('openai', 'gpt-5', baseMessages, '<user_context>page</user_context>'),
		).toEqual(baseMessages);

		expect(applyAnthropicConversationCaching('google', 'gemini-2.5-pro', baseMessages, null)).toEqual(baseMessages);
	});

	test('returns empty array when no messages', () => {
		expect(applyAnthropicConversationCaching('anthropic', 'claude-sonnet-4-6', [], 'ctx')).toEqual([]);
	});

	test('marks the last message cacheable when no context is present', () => {
		const result = applyAnthropicConversationCaching('anthropic', 'claude-sonnet-4-6', baseMessages, null);

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
		const result = applyAnthropicConversationCaching(
			'anthropic',
			'claude-sonnet-4-6',
			baseMessages,
			'<user_context>page</user_context>',
		);

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

	test('caches a tool-result continuation but does not append context after it', () => {
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
			'claude-sonnet-4-6',
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

		const result = applyAnthropicConversationCaching(
			'anthropic',
			'claude-sonnet-4-6',
			messages,
			'<user_context>page</user_context>',
		);

		expect(result).toHaveLength(2);
		expect(result.at(-1)?.role).toBe('assistant');
	});

	test('marks the last message cacheable for Anthropic models through OpenRouter', () => {
		const result = applyAnthropicConversationCaching(
			'openrouter',
			'anthropic/claude-sonnet-5.5',
			baseMessages,
			'<user_context>page</user_context>',
		);

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

	test('returns messages unchanged for non-Anthropic models through OpenRouter', () => {
		expect(
			applyAnthropicConversationCaching(
				'openrouter',
				'openai/gpt-5.5',
				baseMessages,
				'<user_context>page</user_context>',
			),
		).toEqual(baseMessages);
	});

	test('preserves existing providerOptions when adding cacheControl', () => {
		const messages: ModelMessage[] = [
			{
				role: 'user',
				content: 'Hello',
				providerOptions: { anthropic: { existing: 'value' } as any, openai: { other: true } as any },
			},
		];

		const result = applyAnthropicConversationCaching('anthropic', 'claude-sonnet-4-6', messages, null);

		expect(result[0]?.providerOptions).toEqual({
			openai: { other: true },
			anthropic: {
				existing: 'value',
				cacheControl: { type: 'ephemeral' },
			},
		});
	});
});

describe('getOpenRouterAutomaticCacheOptions', () => {
	const userLast: ModelMessage[] = [{ role: 'user', content: 'Hi' }];

	const toolLast: ModelMessage[] = [
		{ role: 'user', content: 'Hi' },
		{
			role: 'assistant',
			content: [{ type: 'tool-call', toolCallId: 'call-1', toolName: 'items', input: {} }],
		},
		{
			role: 'tool',
			content: [{ type: 'tool-result', toolCallId: 'call-1', toolName: 'items', output: { type: 'json', value: {} } }],
		},
	];

	test('requests automatic caching for OpenRouter Anthropic turns that do not end in a user message', () => {
		expect(getOpenRouterAutomaticCacheOptions('openrouter', 'anthropic/claude-sonnet-5.5', toolLast)).toEqual({
			openrouter: { cacheControl: { type: 'ephemeral' } },
		});
	});

	test('returns nothing for user turns, direct Anthropic, and non-Anthropic OpenRouter models', () => {
		expect(getOpenRouterAutomaticCacheOptions('openrouter', 'anthropic/claude-sonnet-5.5', userLast)).toEqual({});
		expect(getOpenRouterAutomaticCacheOptions('anthropic', 'claude-sonnet-4-6', toolLast)).toEqual({});
		expect(getOpenRouterAutomaticCacheOptions('openrouter', 'openai/gpt-5.5', toolLast)).toEqual({});
	});

	test('leaves OpenRouter tool turns without message-level breakpoints', () => {
		expect(applyAnthropicConversationCaching('openrouter', 'anthropic/claude-sonnet-5.5', toolLast, null)).toBe(
			toolLast,
		);
	});
});

// Runs the real OpenRouter SDK, since where it puts cache breakpoints is what the helpers above rely on
describe('OpenRouter request body', () => {
	const model = 'anthropic/claude-sonnet-5.5';

	async function captureRequestBody(messages: ModelMessage[], contextBlock: string | null = null) {
		const fetchMock = vi.fn(
			async (_url: string | URL | Request, _init?: RequestInit) =>
				new Response(
					JSON.stringify({
						id: 'gen-1',
						model,
						choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
						usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
					}),
					{ headers: { 'content-type': 'application/json' } },
				),
		);

		const openrouter = createOpenRouter({ apiKey: 'test-key', fetch: fetchMock as typeof fetch });

		await generateText({
			model: openrouter(model),
			system: buildCacheAwareSystemPrompt('openrouter', model, 'SYSTEM_PROMPT'),
			messages: applyAnthropicConversationCaching('openrouter', model, messages, contextBlock),
			providerOptions: getOpenRouterAutomaticCacheOptions('openrouter', model, messages),
		});

		return JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
	}

	const cachedSystemPrompt = {
		role: 'system',
		content: [{ type: 'text', text: 'SYSTEM_PROMPT', cache_control: { type: 'ephemeral' } }],
	};

	test('marks the system prompt and the last user message, with context after the breakpoint', async () => {
		const body = await captureRequestBody([{ role: 'user', content: 'Hello' }], '<user_context>page</user_context>');

		expect(body.cache_control).toBeUndefined();

		expect(body.messages).toEqual([
			cachedSystemPrompt,
			{ role: 'user', content: [{ type: 'text', text: 'Hello', cache_control: { type: 'ephemeral' } }] },
			{ role: 'user', content: '<user_context>page</user_context>' },
		]);
	});

	test('uses one request-level breakpoint for parallel tool results', async () => {
		const toolCallIds = ['call-1', 'call-2', 'call-3', 'call-4'];

		const body = await captureRequestBody([
			{ role: 'user', content: 'Look up four things' },
			{
				role: 'assistant',
				content: toolCallIds.map((toolCallId) => ({ type: 'tool-call', toolCallId, toolName: 'items', input: {} })),
			},
			{
				role: 'tool',
				content: toolCallIds.map((toolCallId) => ({
					type: 'tool-result',
					toolCallId,
					toolName: 'items',
					output: { type: 'json', value: { id: toolCallId } },
				})),
			},
		]);

		expect(body.cache_control).toEqual({ type: 'ephemeral' });

		expect(body.messages).toEqual([
			cachedSystemPrompt,
			{ role: 'user', content: 'Look up four things' },
			{
				role: 'assistant',
				content: null,
				tool_calls: toolCallIds.map((id) => ({ id, type: 'function', function: { name: 'items', arguments: '{}' } })),
			},
			...toolCallIds.map((id) => ({ role: 'tool', tool_call_id: id, content: JSON.stringify({ id }), name: 'items' })),
		]);
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
