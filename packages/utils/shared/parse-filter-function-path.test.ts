import { describe, expect, it } from 'vitest';
import { parseFilterFunctionPath } from './parse-filter-function-path.js';

describe('parseFilterFunctionPath', () => {
	it('parses an empty input', () => {
		const input = '';
		expect(parseFilterFunctionPath(input)).toBe(input);
	});

	it('parses strings without functions', () => {
		let input = 'noFunction';
		expect(parseFilterFunctionPath(input)).toBe(input);

		input = 'a.b.noFunction';
		expect(parseFilterFunctionPath(input)).toBe(input);
	});

	it('parses functions without nested columns', () => {
		const input = 'function(field)';
		expect(parseFilterFunctionPath(input)).toBe(input);
	});

	it('parses functions with nested columns', () => {
		const input = 'function(a.b.field)';
		expect(parseFilterFunctionPath(input)).toBe('a.b.function(field)');
	});

	it('parses nested functions without nested columns', () => {
		const input = 'a.b.function(field)';
		expect(parseFilterFunctionPath(input)).toBe(input);
	});

	it('parses nested functions with nested columns', () => {
		const input = 'a.b.function(c.d.field)';
		expect(parseFilterFunctionPath(input)).toBe('a.b.c.d.function(field)');
	});
});
