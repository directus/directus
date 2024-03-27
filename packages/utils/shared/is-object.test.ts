import { describe, expect, it } from 'vitest';
import { isObject } from './is-object.js';

describe('isObject', () => {
	it.each([{}, { exampleProp: 1 }])('returns true if input is an object', (input) => {
		const result = isObject(input);

		expect(result).toEqual(true);
	});

	it.each([null, [], undefined, 'string', 1, () => ({})])('returns false if input is not an object', (input) => {
		const result = isObject(input);

		expect(result).toEqual(false);
	});
});
