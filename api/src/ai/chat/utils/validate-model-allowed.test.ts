import { DEFAULT_ALLOWED_MODELS } from '@directus/ai';
import { ForbiddenError } from '@directus/errors';
import { describe, expect, test } from 'vitest';
import type { AISettings } from '../../providers/types.js';
import { validateModelAllowed } from './validate-model-allowed.js';

const aiSettings: AISettings = {
	ai_openai_api_key: null,
	ai_anthropic_api_key: null,
	ai_google_api_key: null,
	ai_openrouter_api_key: null,
	ai_openai_compatible_api_key: null,
	ai_openai_compatible_base_url: null,
	ai_openai_compatible_name: null,
	ai_openai_compatible_models: null,
	ai_openai_compatible_headers: null,
	ai_openai_allowed_models: ['gpt-5'],
	ai_anthropic_allowed_models: [],
	ai_google_allowed_models: [],
	ai_openrouter_models: [{ id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5' }],
	ai_system_prompt: null,
};

describe('validateModelAllowed', () => {
	test('allows a model in the provider list', () => {
		expect(() => validateModelAllowed('openai', 'gpt-5', aiSettings)).not.toThrow();
	});

	test('allows a saved openrouter model', () => {
		expect(() => validateModelAllowed('openrouter', 'anthropic/claude-sonnet-4.5', aiSettings)).not.toThrow();
	});

	test('rejects a model missing from the provider list', () => {
		expect(() => validateModelAllowed('openai', 'gpt-4o', aiSettings)).toThrow(ForbiddenError);
		expect(() => validateModelAllowed('openrouter', 'openai/gpt-5', aiSettings)).toThrow(ForbiddenError);
	});

	test('rejects every model when the list is empty', () => {
		expect(() => validateModelAllowed('anthropic', 'claude-sonnet-4-5', aiSettings)).toThrow(ForbiddenError);
		expect(() => validateModelAllowed('google', 'gemini-3-pro', aiSettings)).toThrow(ForbiddenError);
	});

	test('falls back to the default list when none was saved', () => {
		const settings = { ...aiSettings, ai_anthropic_allowed_models: null };

		expect(() => validateModelAllowed('anthropic', DEFAULT_ALLOWED_MODELS.anthropic[0]!, settings)).not.toThrow();
		expect(() => validateModelAllowed('anthropic', 'not-a-default', settings)).toThrow(ForbiddenError);
	});

	test('skips the check for openai-compatible', () => {
		expect(() => validateModelAllowed('openai-compatible', 'anything', aiSettings)).not.toThrow();
	});
});
