import { describe, expect, test } from 'vitest';
import { buildCustomModelDefinition, buildCustomModels } from './models';

describe('buildCustomModels', () => {
	test('returns empty array when input is null', () => {
		expect(buildCustomModels(null)).toEqual([]);
	});

	test('returns empty array when input is empty array', () => {
		expect(buildCustomModels([])).toEqual([]);
	});

	test('maps OpenAICompatibleModel to ModelDefinition', () => {
		const input = [
			{
				id: 'llama-3.2',
				name: 'Llama 3.2',
				context: 32_000,
				output: 4_096,
			},
		];

		const result = buildCustomModels(input);

		expect(result).toHaveLength(1);

		expect(result[0]).toMatchObject({
			provider: 'openai-compatible',
			model: 'llama-3.2',
			name: 'Llama 3.2',
			limit: {
				context: 32_000,
				output: 4_096,
			},
			cost: {
				input: 0,
				output: 0,
			},
		});
	});

	test('uses default context when not provided', () => {
		const input = [{ id: 'test-model', name: 'Test' }];

		const result = buildCustomModels(input);

		expect(result[0]?.limit.context).toBe(128_000);
	});

	test('uses default output when not provided', () => {
		const input = [{ id: 'test-model', name: 'Test' }];

		const result = buildCustomModels(input);

		expect(result[0]?.limit.output).toBe(16_000);
	});

	test('maps multiple models', () => {
		const input = [
			{ id: 'model-a', name: 'Model A' },
			{ id: 'model-b', name: 'Model B', context: 64_000 },
		];

		const result = buildCustomModels(input);

		expect(result).toHaveLength(2);
		expect(result[0]?.model).toBe('model-a');
		expect(result[1]?.model).toBe('model-b');
		expect(result[1]?.limit.context).toBe(64_000);
	});
});

describe('buildCustomModelDefinition', () => {
	test('creates model definition with model ID as name', () => {
		const result = buildCustomModelDefinition('openai', 'gpt-4o-2024-08-06');

		expect(result.provider).toBe('openai');
		expect(result.model).toBe('gpt-4o-2024-08-06');
		expect(result.name).toBe('gpt-4o-2024-08-06');
	});

	test('uses default limits', () => {
		const result = buildCustomModelDefinition('anthropic', 'claude-custom');

		expect(result.limit.context).toBe(128_000);
		expect(result.limit.output).toBe(16_000);
	});

	test('uses zero cost', () => {
		const result = buildCustomModelDefinition('google', 'gemini-custom');

		expect(result.cost.input).toBe(0);
		expect(result.cost.output).toBe(0);
	});

	test('uses provider-specific icon for known providers', () => {
		const openaiResult = buildCustomModelDefinition('openai', 'test');
		const anthropicResult = buildCustomModelDefinition('anthropic', 'test');
		const googleResult = buildCustomModelDefinition('google', 'test');

		// Icons are Vue components, just verify they exist
		expect(openaiResult.icon).toBeDefined();
		expect(anthropicResult.icon).toBeDefined();
		expect(googleResult.icon).toBeDefined();
	});

	test('uses custom icon for unknown providers', () => {
		const result = buildCustomModelDefinition('unknown-provider', 'test');

		expect(result.icon).toBeDefined();
	});
});
