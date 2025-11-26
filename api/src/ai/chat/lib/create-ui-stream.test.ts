import { ServiceUnavailableError } from '@directus/errors';
import type { UIMessage } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { createUiStream } from './create-ui-stream.js';

// Mocks
vi.mock('@ai-sdk/openai', () => ({
	createOpenAI: vi.fn(() => (model: string) => ({ id: `openai:${model}` })),
}));

vi.mock('@ai-sdk/anthropic', () => ({
	createAnthropic: vi.fn(() => (model: string) => ({ id: `anthropic:${model}` })),
}));

const mockStreamTextResult = {
	toDataStreamResponse: vi.fn(),
	pipeDataStreamToResponse: vi.fn(),
	toTextStreamResponse: vi.fn(),
	pipeTextStreamToResponse: vi.fn(),
};

vi.mock('ai', () => ({
	streamText: vi.fn(() => mockStreamTextResult),
	convertToModelMessages: vi.fn((messages: UIMessage[]) => messages.map((m) => ({ ...m, converted: true }))),
	stepCountIs: vi.fn(),
}));

describe('createUiStream', () => {
	const messages: UIMessage[] = [
		{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
		{ id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }] },
	];

	const apiKeys = { openai: 'openai-key', anthropic: 'anthropic-key' };

	it('should create a stream for OpenAI provider', () => {
		const result = createUiStream(messages, {
			provider: 'openai',
			model: 'gpt-3.5',
			tools: {},
			apiKeys,
		});

		expect(result).toBe(mockStreamTextResult);
	});

	it('should create a stream for Anthropic provider', () => {
		const result = createUiStream(messages, {
			provider: 'anthropic',
			model: 'claude-2',
			tools: {},
			apiKeys,
		});

		expect(result).toBe(mockStreamTextResult);
	});

	it('should throw ServiceUnavailableError if API key is missing for provider', () => {
		expect(() =>
			createUiStream(messages, {
				provider: 'openai',
				model: 'gpt-3.5',
				tools: {},
				apiKeys: { ...apiKeys, openai: null },
			}),
		).toThrow(ServiceUnavailableError);

		expect(() =>
			createUiStream(messages, {
				provider: 'anthropic',
				model: 'claude-2',
				tools: {},
				apiKeys: { ...apiKeys, anthropic: null },
			}),
		).toThrow(ServiceUnavailableError);
	});

	it('should throw Error for unknown provider', () => {
		expect(() =>
			createUiStream(messages, {
				provider: 'unknown',
				model: 'model',
				tools: {},
				apiKeys,
			}),
		).toThrow('Unexpected provider given: "unknown"');
	});
});
