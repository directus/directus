import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import type { InvalidQueryErrorExtensions } from './invalid-query.js';
import { messageConstructor } from './invalid-query.js';

let sample: InvalidQueryErrorExtensions;

beforeEach(() => {
	sample = {
		reason: randomAlpha(randomInteger(2, 500)),
	};
});

test('Constructs message', () => {
	expect(messageConstructor(sample)).toBe(`Invalid query. ${sample.reason}.`);
});
