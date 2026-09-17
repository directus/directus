import { describe, expect, test } from 'vitest';
import { throwIfEmpty } from './throw-if-empty.js';

describe('throwIfEmpty', () => {
	test.each([
		{ description: 'an empty string', value: '' },
		{ description: 'an empty array', value: [] },
		{ description: 'null', value: null },
		{ description: 'undefined', value: undefined },
	])('throws for $description', ({ value }) => {
		expect(() => throwIfEmpty(value, 'Collection cannot be empty')).toThrow('Collection cannot be empty');
	});

	test.each([
		{ description: 'a non-empty string', value: 'posts' },
		{ description: 'a non-empty array', value: ['id'] },
		{ description: 'a whitespace-only string', value: ' ' },
	])('does not throw for $description', ({ value }) => {
		expect(() => throwIfEmpty(value, 'Collection cannot be empty')).not.toThrow();
	});

	test('uses the provided message', () => {
		expect(() => throwIfEmpty('', 'Run ID cannot be empty')).toThrow('Run ID cannot be empty');
	});
});
