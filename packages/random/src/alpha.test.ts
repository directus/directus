import { beforeEach, expect, test, vi } from 'vitest';
import { randomAlpha } from './alpha.js';
import { CHARACTERS_ALPHA } from './constants.js';
import { randomInteger } from './integer.js';
import { randomSequence } from './sequence.js';

vi.mock('./sequence.js');

let sample: {
	length: number;
};

beforeEach(() => {
	sample = {
		length: randomInteger(1, 25),
	};
});

test('Returns output of randomSequence with given length', () => {
	randomAlpha(sample.length);
	expect(randomSequence).toHaveBeenCalledWith(sample.length, CHARACTERS_ALPHA);
});
