import { expect, test } from 'vitest';
import { parameterIndexGenerator } from './param-index-generator.js';

test('generator', () => {
	const idGen = parameterIndexGenerator();

	expect(idGen.next().value).toBe(0);
	expect(idGen.next().value).toBe(1);
	expect(idGen.next().value).toBe(2);
});
