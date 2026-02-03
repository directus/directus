import { expect, test } from 'vitest';
import { capitalize } from './capitalize.js';

test('Capitalizes input string', () => {
	expect(capitalize('test')).toBe('Test');
	expect(capitalize('Test')).toBe('Test');
	expect(capitalize('TEST')).toBe('TEST');
});
