import { test, expect } from 'vitest';

import { capitalizeFirst } from '@/utils/capitalize-first';

test('Capitalizes first character', () => {
	expect(capitalizeFirst('test')).toBe('Test');
});

test('Does not explode on empty strings', () => {
	expect(capitalizeFirst('')).toBe('');
});
