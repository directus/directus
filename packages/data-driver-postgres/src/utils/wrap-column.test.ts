import { test, expect } from 'vitest';
import { column } from './wrap-column.js';

test.todo('primitive field selection', () => {
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
