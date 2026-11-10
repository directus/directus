import { describe, expect, it } from 'vitest';
import { buildCustomModelDefinition, buildCustomModels, DEFAULT_ALLOWED_MODELS, getAllowedModels } from './models.js';

describe('buildCustomModels', () => {
	it('returns empty array for null', () => {
		expect(buildCustomModels(null)).toEqual([]);
	});

	it('returns empty array for empty array', () => {
		expect(buildCustomModels([])).toEqual([]);
	});

	it('maps custom model with defaults', () => {
		const result = buildCustomModels([{ id: 'llama3', name: 'Llama 3' }]);

		expect(result).toHaveLength(1);

		expect(result[0]).toEqual({
			provider: 'openai-compatible',
			model: 'llama3',
			name: 'Llama 3',
			limit: { context: 128_000, output: 16_000 },
			cost: { input: 0, output: 0 },
			attachment: false,
			reasoning: false,
		});
	});

	it('uses provided context and output limits', () => {
		const result = buildCustomModels([{ id: 'custom', name: 'Custom', context: 32_000, output: 4_000 }]);

		expect(result[0]?.limit).toEqual({ context: 32_000, output: 4_000 });
	});

	it('assigns the given provider', () => {
		const result = buildCustomModels([{ id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5' }], 'openrouter');

		expect(result[0]?.provider).toBe('openrouter');
	});

	it('uses provided attachment and reasoning flags', () => {
		const result = buildCustomModels([{ id: 'custom', name: 'Custom', attachment: true, reasoning: true }]);

		expect(result[0]?.attachment).toBe(true);
		expect(result[0]?.reasoning).toBe(true);
	});
});

describe('buildCustomModelDefinition', () => {
	it('creates model definition with defaults', () => {
		const result = buildCustomModelDefinition('openai', 'gpt-custom');

		expect(result).toEqual({
			provider: 'openai',
			model: 'gpt-custom',
			name: 'gpt-custom',
			limit: { context: 128_000, output: 16_000 },
			cost: { input: 0, output: 0 },
			attachment: false,
			reasoning: false,
		});
	});

	it('uses modelId as name', () => {
		const result = buildCustomModelDefinition('anthropic', 'claude-custom');

		expect(result.name).toBe('claude-custom');
	});
});

describe('getAllowedModels', () => {
	it('falls back to the defaults when a list was never saved', () => {
		expect(getAllowedModels(null)).toEqual({ ...DEFAULT_ALLOWED_MODELS, openrouter: [] });
	});

	it('keeps an empty list instead of falling back', () => {
		expect(getAllowedModels({ ai_openai_allowed_models: [] }).openai).toEqual([]);
	});

	it('uses the saved openrouter model ids', () => {
		const settings = { ai_openrouter_models: [{ id: 'anthropic/claude-sonnet-5.5', name: 'Claude Sonnet 5.5' }] };

		expect(getAllowedModels(settings).openrouter).toEqual(['anthropic/claude-sonnet-5.5']);
	});
});
