import { describe, expect, test } from 'vitest';
import { extractFromId } from './extract-from-id.js';

describe('extractFromId', () => {
	test('should extract provider and model from valid id', () => {
		const result = extractFromId('openai:gpt-4');

		expect(result).toEqual({
			provider: 'openai',
			model: 'gpt-4',
		});
	});

	test('should handle different providers and models', () => {
		const result = extractFromId('anthropic:claude-3');

		expect(result).toEqual({
			provider: 'anthropic',
			model: 'claude-3',
		});
	});

	test('should throw error for missing provider', () => {
		expect(() => extractFromId(':model-name')).toThrowError();
	});

	test('should throw error for missing model', () => {
		expect(() => extractFromId('provider:')).toThrowError();
	});

	test('should throw error for missing colon separator', () => {
		expect(() => extractFromId('provider-model')).toThrowError();
	});

	test('should throw error for empty string', () => {
		expect(() => extractFromId('')).toThrowError();
	});
});
