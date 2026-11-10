import { describe, expect, it } from 'vitest';
import { getModelDefinition, getProviderOptions } from './options.js';
import type { AISettings } from './types.js';

const baseSettings: AISettings = {
	ai_openai_api_key: null,
	ai_anthropic_api_key: null,
	ai_google_api_key: null,
	ai_openrouter_api_key: null,
	ai_openai_compatible_api_key: null,
	ai_openai_compatible_base_url: null,
	ai_openai_compatible_name: null,
	ai_openai_compatible_models: null,
	ai_openai_compatible_headers: null,
	ai_openai_allowed_models: [],
	ai_anthropic_allowed_models: [],
	ai_google_allowed_models: [],
	ai_openrouter_models: [],
	ai_system_prompt: null,
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
			ai_openai_compatible_models: [{ id: 'llama3', name: 'Llama 3' }],
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

	it('returns providerOptions for openai-compatible model with custom options', () => {
		const settings: AISettings = {
			...baseSettings,
			ai_openai_compatible_models: [
				{
					id: 'llama3',
					name: 'Llama 3',
					providerOptions: { customOption: 'value', temperature: 0.5 },
				},
			],
		};

		const result = getProviderOptions('openai-compatible', 'llama3', settings);

		expect(result).toEqual({
			'openai-compatible': { customOption: 'value', temperature: 0.5 },
		});
	});

	it('uses custom provider name in providerOptions key', () => {
		const settings: AISettings = {
			...baseSettings,
			ai_openai_compatible_name: 'ollama',
			ai_openai_compatible_models: [
				{
					id: 'llama3',
					name: 'Llama 3',
					providerOptions: { customOption: 'value' },
				},
			],
		};

		const result = getProviderOptions('openai-compatible', 'llama3', settings);

		expect(result).toEqual({
			ollama: { customOption: 'value' },
		});
	});

	it('returns empty object for openai-compatible model without providerOptions', () => {
		const settings: AISettings = {
			...baseSettings,
			ai_openai_compatible_models: [{ id: 'llama3', name: 'Llama 3' }],
		};

		const result = getProviderOptions('openai-compatible', 'llama3', settings);

		expect(result).toEqual({});
	});
});
