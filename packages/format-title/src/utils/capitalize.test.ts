import { capitalize } from './capitalize.js';
import { expect, test } from 'vitest';

test('Capitalizes input string', () => {
	expect(capitalize('test')).toBe('Test');
	expect(capitalize('Test')).toBe('Test');
	expect(capitalize('TEST')).toBe('TEST');
});
