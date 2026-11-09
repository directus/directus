import { ForbiddenError } from '@directus/errors';
import { describe, expect, test } from 'vitest';
import type { AISettings } from '../../providers/index.js';
import { validateModelAllowed } from './validate-model-allowed.js';

const aiSettings: AISettings = {
	openaiApiKey: null,
	anthropicApiKey: null,
	googleApiKey: null,
	openrouterApiKey: null,
	openaiCompatibleApiKey: null,
	openaiCompatibleBaseUrl: null,
	openaiCompatibleName: null,
	openaiCompatibleModels: null,
	openaiCompatibleHeaders: null,
	openaiAllowedModels: ['gpt-5'],
	anthropicAllowedModels: [],
	googleAllowedModels: null,
	openrouterModels: [{ id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5' }],
	systemPrompt: null,
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

	test('rejects every model when the list is empty or null', () => {
		expect(() => validateModelAllowed('anthropic', 'claude-sonnet-4-5', aiSettings)).toThrow(ForbiddenError);
		expect(() => validateModelAllowed('google', 'gemini-3-pro', aiSettings)).toThrow(ForbiddenError);
	});

	test('skips the check for openai-compatible', () => {
		expect(() => validateModelAllowed('openai-compatible', 'anything', aiSettings)).not.toThrow();
	});
});
