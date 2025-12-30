import { extractFieldFromFunction } from '@/utils/extract-field-from-function';
import { expect, test } from 'vitest';

test('Returns original field if no function is given', () => {
	expect(extractFieldFromFunction('title')).toEqual({ fn: null, field: 'title' });
});

test('Returns function extracted', () => {
	expect(extractFieldFromFunction('year(date_created)')).toEqual({ fn: 'year', field: 'date_created' });
});
