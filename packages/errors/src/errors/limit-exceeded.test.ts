import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { messageConstructor, type LimitExceededErrorExtensions } from './limit-exceeded.js';

let sample: LimitExceededErrorExtensions;

beforeEach(() => {
	sample = {
		category: randomAlpha(randomInteger(2, 500)),
	};
});

test('Constructs message', () => {
	expect(messageConstructor(sample)).toBe(`${sample.category} limit exceeded.`);
});
