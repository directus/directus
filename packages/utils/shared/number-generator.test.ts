import { numberGenerator } from './number-generator.js';
import { expect, test } from 'vitest';

test('generator', () => {
	const idGen = numberGenerator();

	expect(idGen.next().value).toBe(0);
	expect(idGen.next().value).toBe(1);
	expect(idGen.next().value).toBe(2);
});
