import { describe, expect, test } from 'vitest';
import { countCustomModels } from './count-custom-models.js';

describe('countCustomModels', () => {
	const known = new Set(['gpt-5', 'gpt-5-mini']);

	test('counts models not in the known set', () => {
		expect(countCustomModels(['gpt-5', 'my-custom', 'another-custom'], known)).toBe(2);
	});

	test('returns 0 when allowed is not an array', () => {
		expect(countCustomModels(null, known)).toBe(0);
		expect(countCustomModels(undefined, known)).toBe(0);
		expect(countCustomModels('gpt-5', known)).toBe(0);
	});

	test('returns 0 when all models are known', () => {
		expect(countCustomModels(['gpt-5', 'gpt-5-mini'], known)).toBe(0);
	});

	test('counts all when none are known', () => {
		expect(countCustomModels(['custom-a', 'custom-b'], known)).toBe(2);
	});

	test('returns 0 for empty array', () => {
		expect(countCustomModels([], known)).toBe(0);
	});
});
