import { ServiceUnavailableError } from '@directus/errors';
import type { UIMessage } from 'ai';
import { streamText } from 'ai';
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
		openaiCompatibleApiKey: null,
		openaiCompatibleBaseUrl: null,
		openaiCompatibleName: null,
		openaiCompatibleModels: null,
		openaiCompatibleHeaders: null,
		openaiAllowedModels: null,
		anthropicAllowedModels: null,
		googleAllowedModels: null,
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
});
