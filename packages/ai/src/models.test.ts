import { describe, expect, it } from 'vitest';
import { buildCustomModelDefinition, buildCustomModels } from './models.js';

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
