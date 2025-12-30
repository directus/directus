import { type LimitExceededErrorExtensions, messageConstructor } from './limit-exceeded.js';
import { beforeEach, expect, test } from 'vitest';

let sample: LimitExceededErrorExtensions;

beforeEach(() => {
	sample = {
		category: 'Test category',
	};
});

test('Constructs message', () => {
	expect(messageConstructor(sample)).toBe(`${sample.category} limit exceeded.`);
});
