import { beforeEach, expect, test } from 'vitest';
import { messageConstructor, type LimitExceededErrorExtensions } from './limit-exceeded.js';

let sample: LimitExceededErrorExtensions;

beforeEach(() => {
	sample = {
		category: 'Test category',
	};
});

test('Constructs message', () => {
	expect(messageConstructor(sample)).toBe(`${sample.category} limit exceeded.`);
});
