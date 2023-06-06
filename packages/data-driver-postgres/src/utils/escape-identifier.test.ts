import { expect, test, describe } from 'vitest';
import { escapeIdentifier } from './escape-identifier.js';

describe('escapeIdentifier', () => {
	test('with a space inside', () => {
		expect(escapeIdentifier('some collection')).toBe('"some collection"');
	});

	test('with double quotes', () => {
		expect(escapeIdentifier('collection_"xy"')).toBe('"collection_""xy"""');
	});

	test('with single quotes', () => {
		expect(escapeIdentifier(`collection_'xy'`)).toBe(`"collection_'xy'"`);
	});

	test('with backslashes', () => {
		expect(escapeIdentifier('collection\\ xy')).toBe('"collection\\ xy"');
	});

	test('with single and double quote', () => {
		expect(escapeIdentifier(`collection_'xy`)).toBe(`"collection_'xy"`);
	});
});
