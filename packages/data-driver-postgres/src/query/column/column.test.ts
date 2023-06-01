import { test, expect } from 'vitest';
import { column } from './column.js';

test('primitive field selection', () => {
	expect(
		column(
			{
				type: 'primitive',
				field: 'col-name',
			},
			'test-table'
		)
	).toBe('"test-table"."col-name"');
});
