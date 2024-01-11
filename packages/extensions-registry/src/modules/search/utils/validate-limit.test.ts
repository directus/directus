import { expect, test } from 'vitest';
import { validateLimit } from './validate-limit.js';

test('Throws an error is limit is smaller than 1', () => {
	expect(() => validateLimit(-5)).toThrowErrorMatchingInlineSnapshot(`[TypeError: "limit" must be in range 1...250]`);
});

test('Throws an error is limit is bigger than 250', () => {
	expect(() => validateLimit(251)).toThrowErrorMatchingInlineSnapshot(`[TypeError: "limit" must be in range 1...250]`);
});

test('Passes on valid number', () => {
	expect(() => validateLimit(150)).not.toThrow();
});
