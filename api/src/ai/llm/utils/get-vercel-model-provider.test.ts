import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { ServiceUnavailableError } from '@directus/errors';
import { describe, expect, test, vi } from 'vitest';
import { getVercelModelProvider } from './get-vercel-model-provider.js';

vi.mock('@ai-sdk/openai', () => ({
	createOpenAI: vi.fn(),
}));

vi.mock('@ai-sdk/anthropic', () => ({
	createAnthropic: vi.fn(),
}));

describe('getVercelModelProvider', () => {
	describe('openai provider', () => {
		test('should create OpenAI provider with valid API key', () => {
			const mockOpenAIProvider = { provider: 'openai' };
			vi.mocked(createOpenAI).mockReturnValue(mockOpenAIProvider as any);

			const apiKeys = {
				openai: 'test-openai-key',
				anthropic: null,
			};

			const result = getVercelModelProvider('openai', apiKeys);

			expect(createOpenAI).toHaveBeenCalledWith({ apiKey: 'test-openai-key' });
			expect(result).toBe(mockOpenAIProvider);
		});

		test('should throw ServiceUnavailableError when OpenAI API key is null', () => {
			const apiKeys = {
				openai: null,
				anthropic: null,
			};

			expect(() => getVercelModelProvider('openai', apiKeys)).toThrow(ServiceUnavailableError);

			try {
				getVercelModelProvider('openai', apiKeys);
			} catch (error: any) {
				expect(error.extensions.service).toBe('openai');
				expect(error.extensions.reason).toBe('No API key configured for LLM provider');
			}
		});
	});

	describe('anthropic provider', () => {
		test('should create Anthropic provider with valid API key', () => {
			const mockAnthropicProvider = { provider: 'anthropic' };
			vi.mocked(createAnthropic).mockReturnValue(mockAnthropicProvider as any);

			const apiKeys = {
				openai: null,
				anthropic: 'test-anthropic-key',
			};

			const result = getVercelModelProvider('anthropic', apiKeys);

			expect(createAnthropic).toHaveBeenCalledWith({ apiKey: 'test-anthropic-key' });
			expect(result).toBe(mockAnthropicProvider);
		});

		test('should throw ServiceUnavailableError when Anthropic API key is null', () => {
			const apiKeys = {
				openai: null,
				anthropic: null,
			};

			expect(() => getVercelModelProvider('anthropic', apiKeys)).toThrow(ServiceUnavailableError);

			try {
				getVercelModelProvider('anthropic', apiKeys);
			} catch (error: any) {
				expect(error.extensions.service).toBe('anthropic');
				expect(error.extensions.reason).toBe('No API key configured for LLM provider');
			}
		});
	});

	describe('invalid provider', () => {
		test('should throw Error for unexpected provider', () => {
			const apiKeys = {
				openai: 'test-key',
				anthropic: 'test-key',
			};

			// @ts-expect-error: Testing invalid provider
			expect(() => getVercelModelProvider('invalid-provider', apiKeys)).toThrow(
				'Unexpected provider given: "invalid-provider"',
			);
		});
	});
});
