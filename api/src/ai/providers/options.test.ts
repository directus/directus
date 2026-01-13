import { describe, expect, it } from 'vitest';
import { getModelDefinition, getProviderOptions } from './options.js';
import type { AISettings } from './types.js';

const baseSettings: AISettings = {
	openaiApiKey: null,
	anthropicApiKey: null,
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

describe('getModelDefinition', () => {
	it('finds model in DEFAULT_AI_MODELS', () => {
		const result = getModelDefinition('openai', 'gpt-4o-mini', baseSettings);

		expect(result).toBeDefined();
		expect(result?.provider).toBe('openai');
		expect(result?.model).toBe('gpt-4o-mini');
	});

	it('returns undefined for unknown model', () => {
		const result = getModelDefinition('openai', 'unknown-model', baseSettings);

		expect(result).toBeUndefined();
	});

	it('finds custom model from settings', () => {
		const settings: AISettings = {
			...baseSettings,
			openaiCompatibleModels: [{ id: 'llama3', name: 'Llama 3' }],
		};

		const result = getModelDefinition('openai-compatible', 'llama3', settings);

		expect(result).toBeDefined();
		expect(result?.provider).toBe('openai-compatible');
		expect(result?.model).toBe('llama3');
	});
});

describe('getProviderOptions', () => {
	it('returns reasoning options for OpenAI reasoning model', () => {
		const result = getProviderOptions('openai', 'gpt-5', baseSettings);

		expect(result).toEqual({
			openai: {
				reasoningSummary: 'auto',
				store: false,
				include: ['reasoning.encrypted_content'],
			},
		});
	});

	it('returns empty object for non-reasoning OpenAI model', () => {
		const result = getProviderOptions('openai', 'gpt-4o-mini', baseSettings);

		expect(result).toEqual({});
	});

	it('returns empty object for Anthropic provider', () => {
		const result = getProviderOptions('anthropic', 'claude-sonnet-4-20250514', baseSettings);

		expect(result).toEqual({});
	});

	it('returns empty object for unknown model', () => {
		const result = getProviderOptions('openai', 'unknown-model', baseSettings);

		expect(result).toEqual({});
	});
});
