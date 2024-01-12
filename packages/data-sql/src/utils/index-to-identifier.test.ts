import { expect, test } from 'vitest';
import { columnIndexToIdentifier, tableIndexToIdentifier } from './index-to-identifier.js';

test('Convert column index to identifier', () => {
	expect(columnIndexToIdentifier(0)).toBe('c0');
	expect(columnIndexToIdentifier(1)).toBe('c1');
	expect(columnIndexToIdentifier(2)).toBe('c2');
});

test('Convert table index to identifier', () => {
	expect(tableIndexToIdentifier(0)).toBe('t0');
	expect(tableIndexToIdentifier(1)).toBe('t1');
	expect(tableIndexToIdentifier(2)).toBe('t2');
});
