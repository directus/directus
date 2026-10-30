import { ServiceUnavailableError } from '@directus/errors';
import type { UIMessage } from 'ai';
import { convertToModelMessages, createProviderRegistry, stepCountIs, streamText } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AISettings } from '../../providers/types.js';
import { createUiStream } from './create-ui-stream.js';

// Mocks
vi.mock('@ai-sdk/openai', () => ({
	createOpenAI: vi.fn(() => (model: string) => ({ id: `openai:${model}` })),
}));

vi.mock('@ai-sdk/anthropic', () => ({
	createAnthropic: vi.fn(() => (model: string) => ({ id: `anthropic:${model}` })),
}));

vi.mock('@ai-sdk/google', () => ({
	createGoogleGenerativeAI: vi.fn(() => (model: string) => ({ id: `google:${model}` })),
}));

vi.mock('../constants/system-prompt.js', () => ({
	SYSTEM_PROMPT: 'DEFAULT_SYSTEM_PROMPT',
}));

const mockStreamTextResult = {
	toDataStreamResponse: vi.fn(),
	pipeDataStreamToResponse: vi.fn(),
	toTextStreamResponse: vi.fn(),
	pipeTextStreamToResponse: vi.fn(),
};

vi.mock('ai', () => ({
	streamText: vi.fn(() => mockStreamTextResult),
	convertToModelMessages: vi.fn((messages: UIMessage[]) =>
		Promise.resolve(messages.map((m) => ({ ...m, converted: true }))),
	),
	stepCountIs: vi.fn(),
	createProviderRegistry: vi.fn((providers) => ({
		languageModel: (id: string) => ({ id, providers }),
	})),
}));

describe('createUiStream', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const messages: UIMessage[] = [
		{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
		{ id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }] },
	];

	const aiSettings: AISettings = {
		openaiApiKey: 'openai-key',
		anthropicApiKey: 'anthropic-key',
		googleApiKey: null,
		openrouterApiKey: null,
		openaiCompatibleApiKey: null,
		openaiCompatibleBaseUrl: null,
		openaiCompatibleName: null,
		openaiCompatibleModels: null,
		openaiCompatibleHeaders: null,
		openaiAllowedModels: null,
		anthropicAllowedModels: null,
		googleAllowedModels: null,
		openrouterModels: null,
		systemPrompt: null,
	};

	it('should create a stream for OpenAI provider', async () => {
		const result = await createUiStream(messages, {
			provider: 'openai',
			model: 'gpt-3.5',
			tools: {},
			aiSettings,
		});

		expect(result).toBe(mockStreamTextResult);
	});

	it('should create a stream for Anthropic provider', async () => {
		const result = await createUiStream(messages, {
			provider: 'anthropic',
			model: 'claude-2',
			tools: {},
			aiSettings,
		});

		expect(result).toBe(mockStreamTextResult);
	});

	it('should throw ServiceUnavailableError if API key is missing for provider', async () => {
		await expect(
			createUiStream(messages, {
				provider: 'openai',
				model: 'gpt-3.5',
				tools: {},
				aiSettings: { ...aiSettings, openaiApiKey: null },
			}),
		).rejects.toThrow(ServiceUnavailableError);

		await expect(
			createUiStream(messages, {
				provider: 'anthropic',
				model: 'claude-2',
				tools: {},
				aiSettings: { ...aiSettings, anthropicApiKey: null },
			}),
		).rejects.toThrow(ServiceUnavailableError);
	});

	it('should throw ServiceUnavailableError for unconfigured provider', async () => {
		await expect(
			createUiStream(messages, {
				provider: 'google',
				model: 'gemini-pro',
				tools: {},
				aiSettings,
			}),
		).rejects.toThrow(ServiceUnavailableError);
	});

	it('uses default system prompt when none provided', async () => {
		await createUiStream(messages, {
			provider: 'openai',
			model: 'gpt-4',
			tools: {},
			aiSettings,
		});

		expect(streamText).toHaveBeenCalledWith(expect.objectContaining({ system: 'DEFAULT_SYSTEM_PROMPT' }));
	});

	it('uses provided system prompt when given', async () => {
		await createUiStream(messages, {
			provider: 'openai',
			model: 'gpt-4o',
			tools: {},
			aiSettings,
			systemPrompt: 'CUSTOM_PROMPT',
		});

		expect(streamText).toHaveBeenCalledWith(expect.objectContaining({ system: 'CUSTOM_PROMPT' }));
	});

	it('includes context in the top-level system prompt without prepareStep override', async () => {
		await createUiStream(messages, {
			provider: 'openai',
			model: 'gpt-4',
			tools: {},
			aiSettings,
			context: {
				page: {
					path: '/content/posts/123',
					collection: 'posts',
				},
			},
		});

		const call = vi.mocked(streamText).mock.calls[0]?.[0];

		expect(call?.system).toContain('DEFAULT_SYSTEM_PROMPT');
		expect(call?.system).toContain('<user_context>');
		expect(call?.system).toContain('Path: /content/posts/123');
		expect(call).not.toHaveProperty('prepareStep');
	});

	it('keeps context out of the cached Anthropic system prompt and appends it as a trailing user message', async () => {
		const userInitiatedMessages: UIMessage[] = [
			{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
			{ id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }] },
			{ id: '3', role: 'user', parts: [{ type: 'text', text: 'Update the title' }] },
		];

		await createUiStream(userInitiatedMessages, {
			provider: 'anthropic',
			model: 'claude-sonnet-4-5',
			tools: {},
			aiSettings,
			context: {
				page: {
					path: '/content/posts/123',
					collection: 'posts',
				},
			},
		});

		const call = vi.mocked(streamText).mock.calls[0]?.[0];

		expect(call?.system).toEqual({
			role: 'system',
			content: 'DEFAULT_SYSTEM_PROMPT',
			providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
		});

		const callMessages = call?.messages ?? [];
		const trailingContext = callMessages.at(-1);

		expect(trailingContext?.role).toBe('user');

		expect(typeof trailingContext?.content === 'string' ? trailingContext.content : '').toContain(
			'Path: /content/posts/123',
		);
	});

	it('applies Anthropic caching to Anthropic models through OpenRouter', async () => {
		const userInitiatedMessages: UIMessage[] = [
			{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
			{ id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }] },
			{ id: '3', role: 'user', parts: [{ type: 'text', text: 'Update the title' }] },
		];

		await createUiStream(userInitiatedMessages, {
			provider: 'openrouter',
			model: 'anthropic/claude-sonnet-5.5',
			tools: {},
			aiSettings: { ...aiSettings, openrouterApiKey: 'openrouter-key' },
			context: {
				page: {
					path: '/content/posts/123',
					collection: 'posts',
				},
			},
		});

		const call = vi.mocked(streamText).mock.calls[0]?.[0];

		expect(call?.system).toEqual({
			role: 'system',
			content: 'DEFAULT_SYSTEM_PROMPT',
			providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
		});

		const callMessages = call?.messages ?? [];

		expect(callMessages.at(-2)?.providerOptions).toEqual(
			expect.objectContaining({ anthropic: { cacheControl: { type: 'ephemeral' } } }),
		);

		expect(callMessages.at(-1)?.role).toBe('user');
	});

	it('caches growing tool history across OpenRouter server tool steps', async () => {
		const ai = await vi.importActual<typeof import('ai')>('ai');

		vi.mocked(streamText).mockImplementationOnce(ai.streamText);
		vi.mocked(convertToModelMessages).mockImplementationOnce(ai.convertToModelMessages);
		vi.mocked(createProviderRegistry).mockImplementationOnce(ai.createProviderRegistry);
		vi.mocked(stepCountIs).mockImplementationOnce(ai.stepCountIs);

		const requests: Array<{ cache_control?: { type: string } }> = [];

		const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
			requests.push(JSON.parse(init?.body as string));

			const callsTool = requests.length < 3;

			const chunk = {
				id: `gen-${requests.length}`,
				model: 'anthropic/claude-sonnet-5.5',
				choices: [
					{
						index: 0,
						delta: callsTool
							? {
									tool_calls: [
										{
											index: 0,
											id: `call-${requests.length}`,
											type: 'function',
											function: { name: 'items', arguments: '{}' },
										},
									],
								}
							: { content: 'Done' },
						finish_reason: callsTool ? 'tool_calls' : 'stop',
					},
				],
			};

			return new Response(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`, {
				headers: { 'content-type': 'text/event-stream' },
			});
		});

		vi.stubGlobal('fetch', fetchMock);

		try {
			const result = await createUiStream([{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Read items' }] }], {
				provider: 'openrouter',
				model: 'anthropic/claude-sonnet-5.5',
				aiSettings: { ...aiSettings, openrouterApiKey: 'openrouter-key' },
				tools: {
					items: ai.tool({
						inputSchema: ai.jsonSchema({ type: 'object', properties: {} }),
						execute: async () => ({ items: 'tool result '.repeat(1000) }),
					}),
				},
				context: { page: { path: '/content/posts/123' } },
			});

			await result.consumeStream();

			expect(await result.text).toBe('Done');

			expect(requests.map((request) => request.cache_control)).toEqual([
				undefined,
				{ type: 'ephemeral' },
				{ type: 'ephemeral' },
			]);
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('does not append context as a trailing user message during multi-step continuations', async () => {
		await createUiStream(messages, {
			provider: 'anthropic',
			model: 'claude-sonnet-4-5',
			tools: {},
			aiSettings,
			context: {
				page: { path: '/content/posts/123' },
			},
		});

		const call = vi.mocked(streamText).mock.calls[0]?.[0];
		const callMessages = call?.messages ?? [];

		expect(callMessages.at(-1)?.role).toBe('assistant');
	});

	it('places a cache breakpoint on the last existing Anthropic message', async () => {
		await createUiStream(messages, {
			provider: 'anthropic',
			model: 'claude-sonnet-4-5',
			tools: {},
			aiSettings,
		});

		const call = vi.mocked(streamText).mock.calls[0]?.[0];
		const callMessages = call?.messages ?? [];

		expect(callMessages.at(-1)).toEqual(
			expect.objectContaining({
				providerOptions: expect.objectContaining({
					anthropic: expect.objectContaining({ cacheControl: { type: 'ephemeral' } }),
				}),
			}),
		);
	});

	it('does not add Anthropic cache breakpoints for other providers', async () => {
		await createUiStream(messages, {
			provider: 'openai',
			model: 'gpt-4',
			tools: {},
			aiSettings,
			context: {
				page: {
					path: '/content/posts/123',
				},
			},
		});

		const call = vi.mocked(streamText).mock.calls[0]?.[0];
		const callMessages = call?.messages ?? [];

		expect(callMessages.every((m: any) => !m.providerOptions?.anthropic)).toBe(true);
		expect(callMessages.at(-1)?.role).toBe('assistant');
	});

	it('replaces empty string system prompt with default', async () => {
		await createUiStream(messages, {
			provider: 'openai',
			model: 'gpt-4o-mini',
			tools: {},
			aiSettings,
			systemPrompt: '',
		});

		expect(streamText).toHaveBeenCalledWith(expect.objectContaining({ system: 'DEFAULT_SYSTEM_PROMPT' }));
	});

	it('adds Anthropic cache control to the system prompt', async () => {
		await createUiStream(messages, {
			provider: 'anthropic',
			model: 'claude-sonnet-4-5',
			tools: {},
			aiSettings,
		});

		expect(streamText).toHaveBeenCalledWith(
			expect.objectContaining({
				system: {
					role: 'system',
					content: 'DEFAULT_SYSTEM_PROMPT',
					providerOptions: {
						anthropic: {
							cacheControl: { type: 'ephemeral' },
						},
					},
				},
			}),
		);
	});

	it('sorts tools by name before streaming', async () => {
		await createUiStream(messages, {
			provider: 'openai',
			model: 'gpt-4',
			tools: {
				zeta: { description: 'Zeta tool', inputSchema: {} } as any,
				alpha: { description: 'Alpha tool', inputSchema: {} } as any,
			},
			aiSettings,
		});

		const call = vi.mocked(streamText).mock.calls[0]?.[0];

		expect(Object.keys(call?.tools ?? {})).toEqual(['alpha', 'zeta']);
	});

	it('passes onUsage callback to streamText onFinish', async () => {
		const onUsage = vi.fn();

		await createUiStream(messages, {
			provider: 'openai',
			model: 'gpt-4',
			tools: {},
			aiSettings,
			onUsage,
		});

		expect(streamText).toHaveBeenCalledWith(
			expect.objectContaining({
				onFinish: expect.any(Function),
			}),
		);

		// Extract and call the onFinish handler to verify it invokes onUsage
		const call = vi.mocked(streamText).mock.calls[0]?.[0];

		const onFinish = call?.onFinish as (result: {
			usage: { inputTokens: number; outputTokens: number; totalTokens: number };
			totalUsage?: {
				inputTokens: number;
				outputTokens: number;
				totalTokens: number;
				inputTokenDetails?: {
					cacheReadTokens?: number;
					cacheWriteTokens?: number;
				};
			};
			steps?: [];
		}) => void;

		onFinish({ usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 } });

		expect(onUsage).toHaveBeenCalledWith({ inputTokens: 100, outputTokens: 50, totalTokens: 150 });
	});
});
