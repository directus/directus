import { beforeEach, expect, test } from 'vitest';
import { randomAlpha } from './alpha.js';
import { randomArray } from './array.js';
import { randomInteger } from './integer.js';

let sample: {
	input: string[];
};

beforeEach(() => {
	const length = randomInteger(1, 25);

	sample = {
		input: Array.from(Array(length)).map(() => randomAlpha(randomInteger(1, 10))),
	};
});

test('Returns a random item from the given array', () => {
	const item = randomArray(sample.input);
	expect(sample.input.includes(item)).toBe(true);
});
