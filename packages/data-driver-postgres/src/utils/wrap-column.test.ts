import { expect, test } from 'vitest';
import { wrapColumn } from './wrap-column.js';

test('Primitive field', () => {
	expect(wrapColumn('test-table', 'col-name')).toBe('"test-table"."col-name"');
});

test('Primitive field with alias', () => {
	expect(wrapColumn('test-table', 'col-name', 'alt-name')).toBe('"test-table"."col-name" AS "alt-name"');
});
