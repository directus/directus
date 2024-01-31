import { expect, test } from 'vitest';
import { numberGenerator } from './number-generator.js';

test('number generator', () => {
	const numberGen = numberGenerator();

	expect(numberGen.next().value).toBe(0);
	expect(numberGen.next().value).toBe(1);
	expect(numberGen.next().value).toBe(2);
});
