import { combine } from './combine.js';
import { expect, test } from 'vitest';

test('Combines two strings with a space', () => {
	expect(combine('Hello', 'World')).toBe('Hello World');
});
