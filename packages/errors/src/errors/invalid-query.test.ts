import { beforeEach, expect, test } from 'vitest';
import type { InvalidQueryErrorExtensions } from './invalid-query.js';
import { messageConstructor } from './invalid-query.js';

let sample: InvalidQueryErrorExtensions;

beforeEach(() => {
	sample = {
		reason: 'Test query validation failed',
	};
});

test('Constructs message', () => {
	expect(messageConstructor(sample)).toBe(`Invalid query. ${sample.reason}.`);
});
