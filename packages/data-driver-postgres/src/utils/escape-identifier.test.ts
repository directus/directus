import { expect, test } from 'vitest';
import { escapeIdentifier } from './escape-identifier.js';

test('space inside', () => {
	expect(escapeIdentifier('some collection')).toBe('"some collection"');
});

test('Double quotes', () => {
	expect(escapeIdentifier('collection_"xy"')).toBe('"collection_""xy"""');
});

test('Single quotes', () => {
	expect(escapeIdentifier(`collection_'xy'`)).toBe(`"collection_'xy'"`);
});

test('Backslashes', () => {
	expect(escapeIdentifier('collection\\ xy')).toBe('"collection\\ xy"');
});

test('Single and double quote', () => {
	expect(escapeIdentifier(`collection_'xy`)).toBe(`"collection_'xy"`);
});
