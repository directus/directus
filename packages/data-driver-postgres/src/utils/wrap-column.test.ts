import { test, expect } from 'vitest';
import { wrapColumn } from './wrap-column.js';

test('primitive field', () => {
	expect(wrapColumn('test-table', 'col-name', undefined)).toBe('"test-table"."col-name"');
});

test('primitive field with alias', () => {
	expect(wrapColumn('test-table', 'col-name', 'alt-name')).toBe('"test-table"."col-name" AS "alt-name"');
});
